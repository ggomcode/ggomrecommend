import { supabase } from '../utils/supabaseClient.js'
import defaultCalendarData from '../data/admissionCalendarDefault.json'

// 관리자 설정에서 등록된 시트 ID를 사용하며, 하드코딩된 기본 시트 ID는 제거됨
export const DEFAULT_ADMISSION_SHEET_ID = ''
const CACHE_KEY = 'pcm_admission_calendar_cache_v10'
const CACHE_TIME_KEY = 'pcm_admission_calendar_cache_time_v10'
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6시간 캐시

/**
 * 2027 기본 구글 스프레드시트 각 탭별 고유 GID 매핑
 * (구글 시트에서 Apps Script로 숨김 처리된 과거 행까지 누락 없이 전체 내보내기 위한 GID)
 */
export const DEFAULT_SHEET_GIDS = {
  '주요일정': '493465284',
  '원서접수마감': '0',
  '4년제일정': '1893353782',
  '전문대일정': '1486297043',
  '학사일정': '1779739532'
}

/**
 * URL이나 ID 문자열에서 순수 시트 ID 추출
 */
export function extractSheetId(input) {
  if (!input) return ''
  const trimmed = String(input).trim()
  const match = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/)
  if (match) return match[1]
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) return trimmed
  return ''
}

/**
 * 관리자 설정된 시트 ID 조회 (DB -> localStorage)
 * @param {boolean} allowDefault - 커스텀 설정이 없을 때 반환 여부 (하드코딩 제거로 미등록 시 빈 문자열 반환)
 */
export async function getAdmissionSheetId(allowDefault = false) {
  const localVal = localStorage.getItem('pcm_admission_sheet_id')
  const cleanLocal = extractSheetId(localVal)
  if (!supabase) return cleanLocal || ''

  try {
    const { data } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'admission_calendar_sheet_id')
      .maybeSingle()

    if (data && data.value) {
      const clean = extractSheetId(data.value)
      if (clean) {
        localStorage.setItem('pcm_admission_sheet_id', clean)
        return clean
      }
    } else if (data && !data.value) {
      localStorage.removeItem('pcm_admission_sheet_id')
      return ''
    }
  } catch (e) {
    console.warn('Failed to load admission_calendar_sheet_id from DB:', e)
  }

  return cleanLocal || ''
}

/**
 * 관리자 설정 시트 ID 저장
 */
export async function saveAdmissionSheetId(rawInput) {
  const cleanId = extractSheetId(rawInput)
  if (cleanId) {
    localStorage.setItem('pcm_admission_sheet_id', cleanId)
  } else {
    localStorage.removeItem('pcm_admission_sheet_id')
  }
  // 이전/현재 캐시 모두 무효화
  try {
    ['pcm_admission_calendar_cache_v6', 'pcm_admission_calendar_cache_time_v6',
     'pcm_admission_calendar_cache_v7', 'pcm_admission_calendar_cache_time_v7',
     'pcm_admission_calendar_cache_v8', 'pcm_admission_calendar_cache_time_v8',
     'pcm_admission_calendar_cache_v9', 'pcm_admission_calendar_cache_time_v9',
     'pcm_admission_calendar_cache_v10', 'pcm_admission_calendar_cache_time_v10'].forEach(k => localStorage.removeItem(k))
  } catch {}

  if (supabase) {
    if (cleanId) {
      const { error } = await supabase
        .from('config')
        .upsert({ key: 'admission_calendar_sheet_id', value: cleanId }, { onConflict: 'key' })
      if (error) throw error
    } else {
      await supabase
        .from('config')
        .delete()
        .eq('key', 'admission_calendar_sheet_id')
    }
  }
  return cleanId
}

/**
 * CSV 파서 (따옴표, 쉼표, 개행 완벽 처리)
 */
export function parseCSV(text) {
  if (!text) return []
  const rows = []
  let currentRow = []
  let currentVal = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const nextChar = text[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"'
        i++ // 건너뛰기
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentVal.trim())
      currentVal = ''
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++
      }
      currentRow.push(currentVal.trim())
      if (currentRow.some(val => val.length > 0)) {
        rows.push(currentRow)
      }
      currentRow = []
      currentVal = ''
    } else {
      currentVal += char
    }
  }

  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim())
    if (currentRow.some(val => val.length > 0)) {
      rows.push(currentRow)
    }
  }

  return rows
}

/**
 * 다양한 날짜 형식(YYYY년 M월 D일 [요일], YYYY.MM.DD., YYYY. MM. DD, M/D, M월 D일 등)을 YYYY-MM-DD로 정규화
 * 구글 스프레드시트에서 셀 속성을 숫자의 날짜 형식(예: "2026년 9월 9일 수")으로 변경한 경우도 완벽 지원
 * 대입 2027 학년도: 3월~12월은 2026년, 1월~2월은 2027년 (연도 미표기 시 defaultYear 기반 산출)
 */
export function normalizeDateStr(raw, defaultYear = 2026) {
  if (!raw) return null
  let s = String(raw).trim()
  if (!s) return null

  // 1) 2026년 9월 9일 수, 2026년 9월 22일(수), 2026년 9월 9일 등 한글 연월일 표기
  const korFullMatch = s.match(/(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일?/)
  if (korFullMatch) {
    const y = korFullMatch[1]
    const m = String(korFullMatch[2]).padStart(2, '0')
    const d = String(korFullMatch[3]).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  // 2) 2026. 10. 15 or 2026.10.15. or 2026. 5. 14 or 2027-01-04 or 2026/09/09
  const fullMatch = s.match(/(\d{4})[.\-/]\s*(\d{1,2})[.\-/]\s*(\d{1,2})/)
  if (fullMatch) {
    const y = fullMatch[1]
    const m = String(fullMatch[2]).padStart(2, '0')
    const d = String(fullMatch[3]).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  // 3) 9월 9일(수) or 9월 9일 or 9월 9 (연도 생략형 한글 표기)
  const korMatch = s.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일?/)
  if (korMatch) {
    const m = parseInt(korMatch[1], 10)
    const d = String(korMatch[2]).padStart(2, '0')
    const y = m <= 2 ? defaultYear + 1 : defaultYear
    return `${y}-${String(m).padStart(2, '0')}-${d}`
  }

  // 4) 9/7 or 11/3 or 9.7 (슬래시/점 구분형)
  const slashMatch = s.match(/^(\d{1,2})[.\/](\d{1,2})\.?$/)
  if (slashMatch) {
    const m = parseInt(slashMatch[1], 10)
    const d = String(slashMatch[2]).padStart(2, '0')
    const y = m <= 2 ? defaultYear + 1 : defaultYear
    return `${y}-${String(m).padStart(2, '0')}-${d}`
  }

  // 5) 구글 시트/엑셀 5자리 일련번호(예: 46274 등)
  if (/^\d{5}$/.test(s)) {
    const serial = parseInt(s, 10)
    if (serial >= 40000 && serial <= 60000) {
      const utcDays = Math.floor(serial - 25569)
      const d = new Date(utcDays * 86400 * 1000)
      const y = d.getUTCFullYear()
      const m = String(d.getUTCMonth() + 1).padStart(2, '0')
      const day = String(d.getUTCDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }
  }

  return null
}

/**
 * 단일 시트 CSV 데이터 fetch
 * 관리자가 등록한 구글 시트 ID를 기반으로 각 탭 이름('주요일정', '원서접수마감', '4년제일정', '전문대일정', '학사일정')을 호출
 * 1순위: /gviz/tq?tqx=out:csv&sheet=... (시트 탭 명칭 기반으로 신규 등록 시트에서도 정확히 전체 행 내보내기)
 * 2순위: /export?format=csv&sheet=... (대체 엔드포인트)
 */
async function fetchSheetCSV(sheetId, sheetName, retries = 2) {
  const targetId = extractSheetId(sheetId)
  if (!targetId) return null

  // 1순위: 시트 탭 이름 기반 GViz 엔드포인트
  const encName = encodeURIComponent(sheetName)
  const gvizUrl = `https://docs.google.com/spreadsheets/d/${targetId}/gviz/tq?tqx=out:csv&sheet=${encName}&_t=${Date.now()}`
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(gvizUrl)
      if (res.ok) {
        const text = await res.text()
        if (text && text.trim().length > 10 && !text.includes('<!DOCTYPE html>')) {
          return text
        }
      }
    } catch (err) {
      if (attempt === retries) console.warn(`GViz fetch failed for ${sheetName}:`, err)
      await new Promise(r => setTimeout(r, 400 * (attempt + 1)))
    }
  }

  // 2순위 (fallback): export format=csv 엔드포인트
  const exportUrl = `https://docs.google.com/spreadsheets/d/${targetId}/export?format=csv&sheet=${encName}&_t=${Date.now()}`
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(exportUrl)
      if (res.ok) {
        const text = await res.text()
        if (text && text.trim().length > 10 && !text.includes('<!DOCTYPE html>')) {
          return text
        }
      }
    } catch (err) {
      if (attempt === retries) console.warn(`Export CSV fallback failed for ${sheetName}:`, err)
      await new Promise(r => setTimeout(r, 400 * (attempt + 1)))
    }
  }

  return null
}

/**
 * 2027 기본 내장 fallback 주요 일정 (시트 로딩 불가 또는 네트워크 단절 대비)
 */
const FALLBACK_MAJOR_SCHEDULE = [
  { group: '공통', title: '수시모집 대입전형자료 온라인 신청', startDate: '2026-08-24', endDate: '2026-09-11', time: '18시', note: '2005.2~2023.2 졸업자' },
  { group: '일반대', title: '수시모집 원서접수', startDate: '2026-09-07', endDate: '2026-09-11', time: '18시', note: '대학별 마감시간 상이' },
  { group: '전문대', title: '전문대 수시모집 원서접수 1차', startDate: '2026-09-07', endDate: '2026-09-30', time: '', note: '' },
  { group: '일반대', title: '수시모집 전형기간', startDate: '2026-09-12', endDate: '2026-12-17', time: '', note: '97일간' },
  { group: '전문대', title: '전문대 수시모집 원서접수 2차', startDate: '2026-11-11', endDate: '2026-11-25', time: '', note: '' },
  { group: '공통', title: '2027학년도 대학수학능력시험 실시', startDate: '2026-11-19', endDate: '2026-11-19', time: '', note: '수능일' },
  { group: '공통', title: '수능 성적 통지', startDate: '2026-12-11', endDate: '2026-12-11', time: '', note: '성적표 교부' },
  { group: '일반대', title: '수시모집 합격자 발표 마감', startDate: '2026-12-18', endDate: '2026-12-18', time: '', note: '합격자 최초발표' },
  { group: '전문대', title: '전문대 수시모집 합격자 발표', startDate: '2026-12-20', endDate: '2026-12-20', time: '', note: '' },
  { group: '공통', title: '수시모집 합격자 등록 기간', startDate: '2026-12-21', endDate: '2026-12-23', time: '', note: '3일간' },
  { group: '공통', title: '정시모집 대입전형자료 온라인 신청', startDate: '2026-12-22', endDate: '2027-01-07', time: '18시', note: '' },
  { group: '일반대', title: '정시모집 원서접수', startDate: '2027-01-04', endDate: '2027-01-07', time: '', note: '3일 이상' },
  { group: '전문대', title: '전문대 정시모집 원서접수', startDate: '2027-01-04', endDate: '2027-01-20', time: '', note: '' },
  { group: '공통', title: '정시모집 전형기간 (군별)', startDate: '2027-01-11', endDate: '2027-01-31', time: '', note: '가/나/다군' },
  { group: '일반대', title: '정시모집 합격자 발표 마감', startDate: '2027-02-05', endDate: '2027-02-05', time: '', note: '' },
  { group: '전문대', title: '전문대 정시모집 합격자 발표', startDate: '2027-02-09', endDate: '2027-02-09', time: '', note: '' },
  { group: '공통', title: '정시모집 합격자 등록 기간', startDate: '2027-02-10', endDate: '2027-02-12', time: '', note: '3일간' },
  { group: '공통', title: '추가모집 원서접수 및 전형', startDate: '2027-02-19', endDate: '2027-02-26', time: '', note: '' },
]

/**
 * 전체 5개 시트 데이터 통합 조회 및 가공
 */
export async function fetchAdmissionCalendarData({ forceRefresh = false } = {}) {
  // 이전 버전의 깨지거나 빈 캐시 완벽 제거
  try {
    ['pcm_admission_calendar_cache_v5', 'pcm_admission_calendar_cache_time_v5',
     'pcm_admission_calendar_cache_v6', 'pcm_admission_calendar_cache_time_v6',
     'pcm_admission_calendar_cache_v7', 'pcm_admission_calendar_cache_time_v7',
     'pcm_admission_calendar_cache_v8', 'pcm_admission_calendar_cache_time_v8',
     'pcm_admission_calendar_cache_v9', 'pcm_admission_calendar_cache_time_v9'].forEach(k => localStorage.removeItem(k))
  } catch {}

  // 1. 캐시 확인 (유효 데이터 존재 여부 엄격 검증)
  if (!forceRefresh) {
    const cachedData = localStorage.getItem(CACHE_KEY)
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY)
    if (cachedData && cachedTime) {
      const age = Date.now() - parseInt(cachedTime, 10)
      if (age < CACHE_TTL_MS) {
        try {
          const parsed = JSON.parse(cachedData)
          if (
            parsed &&
            parsed.academicByDate && Object.keys(parsed.academicByDate).length > 0 &&
            parsed.fourYearByDate && Object.keys(parsed.fourYearByDate).length > 0
          ) {
            return parsed
          }
        } catch {
          // ignore error
        }
      }
    }
  }

  const rawSheetId = await getAdmissionSheetId()
  const sheetId = extractSheetId(rawSheetId)
  if (!sheetId) {
    // 관리자 설정에 ID가 아직 등록되지 않은 경우, 내장된 번들 기본 데이터 반환
    return buildFallbackData()
  }

  try {
    // 5개 시트 순차/배치 호출 (구글 동시 요청 차단 방지)
    const csvMajor = await fetchSheetCSV(sheetId, '주요일정').catch(e => { console.warn('주요일정 fetch 실패', e); return null })
    const csvDeadline = await fetchSheetCSV(sheetId, '원서접수마감').catch(e => { console.warn('원서접수마감 fetch 실패', e); return null })
    const csvFourYear = await fetchSheetCSV(sheetId, '4년제일정').catch(e => { console.warn('4년제일정 fetch 실패', e); return null })
    const csvJunior = await fetchSheetCSV(sheetId, '전문대일정').catch(e => { console.warn('전문대일정 fetch 실패', e); return null })
    const csvAcademic = await fetchSheetCSV(sheetId, '학사일정').catch(e => { console.warn('학사일정 fetch 실패', e); return null })

    // 기존 정상 캐시 보존용 로드
    let previousCached = null
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (raw) previousCached = JSON.parse(raw)
    } catch {}

    const parsedData = processAdmissionSheets({
      csvMajor,
      csvDeadline,
      csvFourYear,
      csvJunior,
      csvAcademic
    })

    // 구글 시트 fetch 실패나 누락 발생 시, 기존 정상 캐시 또는 번들된 defaultCalendarData로 완벽 보강 (절대 빈 캘린더 방지)
    if (!parsedData.fourYearByDate || Object.keys(parsedData.fourYearByDate).length === 0) {
      parsedData.fourYearByDate = (previousCached?.fourYearByDate && Object.keys(previousCached.fourYearByDate).length > 0)
        ? previousCached.fourYearByDate
        : defaultCalendarData.fourYearByDate
    }
    if (!parsedData.academicByDate || Object.keys(parsedData.academicByDate).length === 0) {
      parsedData.academicByDate = (previousCached?.academicByDate && Object.keys(previousCached.academicByDate).length > 0)
        ? previousCached.academicByDate
        : defaultCalendarData.academicByDate
      parsedData.academicEvents = (previousCached?.academicEvents && previousCached.academicEvents.length > 0)
        ? previousCached.academicEvents
        : defaultCalendarData.academicEvents
    }
    if (!parsedData.juniorByDate || Object.keys(parsedData.juniorByDate).length === 0) {
      parsedData.juniorByDate = (previousCached?.juniorByDate && Object.keys(previousCached.juniorByDate).length > 0)
        ? previousCached.juniorByDate
        : defaultCalendarData.juniorByDate
    }
    if (!parsedData.deadlineByDate || Object.keys(parsedData.deadlineByDate).length === 0) {
      parsedData.deadlineByDate = (previousCached?.deadlineByDate && Object.keys(previousCached.deadlineByDate).length > 0)
        ? previousCached.deadlineByDate
        : defaultCalendarData.deadlineByDate
    }
    if (!parsedData.majorList || parsedData.majorList.length === 0) {
      parsedData.majorList = defaultCalendarData.majorList
      parsedData.rangeEvents = defaultCalendarData.rangeEvents
    }

    // ★ 과거 일정 보호: 구글 시트에서 Apps Script(autoHidePastRows)로 인해 오늘 이전 행이 숨겨져서 누락된 경우,
    // 번들된 기본 데이터 및 이전 캐시의 과거 일정들을 완벽하게 보존/병합
    if (defaultCalendarData.fourYearByDate) {
      for (const [dateStr, data] of Object.entries(defaultCalendarData.fourYearByDate)) {
        if (!parsedData.fourYearByDate[dateStr] || parsedData.fourYearByDate[dateStr].items.length === 0) {
          parsedData.fourYearByDate[dateStr] = data
        }
      }
    }
    if (defaultCalendarData.juniorByDate) {
      for (const [dateStr, data] of Object.entries(defaultCalendarData.juniorByDate)) {
        if (!parsedData.juniorByDate[dateStr] || parsedData.juniorByDate[dateStr].items.length === 0) {
          parsedData.juniorByDate[dateStr] = data
        }
      }
    }
    if (defaultCalendarData.academicByDate) {
      for (const [dateStr, data] of Object.entries(defaultCalendarData.academicByDate)) {
        if (!parsedData.academicByDate[dateStr] || parsedData.academicByDate[dateStr].length === 0) {
          parsedData.academicByDate[dateStr] = data
        }
      }
    }

    // 데이터가 충분히 검증되었을 때만 로컬스토리지 캐시에 저장
    if (
      parsedData.academicByDate && Object.keys(parsedData.academicByDate).length > 0 &&
      parsedData.fourYearByDate && Object.keys(parsedData.fourYearByDate).length > 0
    ) {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(parsedData))
        localStorage.setItem(CACHE_TIME_KEY, String(Date.now()))
      } catch (e) {
        console.warn('LocalStorage cache write quota exceeded:', e)
      }
    }

    return parsedData
  } catch (err) {
    console.error('Failed to fetch Google Sheets admission data, using bundled default:', err)
    return buildFallbackData()
  }
}

/**
 * 파싱된 시트 로우들을 3단 트랙 캘린더용 데이터 모델로 가공
 * - 컬럼 이동 지원: A열에 대입학년도(2027, 2028 등) 또는 학사년도(2026 등)가 추가되고
 *   기존 컬럼이 B열 이후로 이동된 신규 서식(B~G, B~R)과 기존 서식(A~F, A~Q)을 자동 감지하여 완벽 호환
 */
function processAdmissionSheets({ csvMajor, csvDeadline, csvFourYear, csvJunior, csvAcademic }) {
  // ─────────────────────────────────────────────────────────────
  // 1. 주요일정
  //   - 신규: A(대입학년도), B(구분), C(세부구분/명칭), D(시작일), E(마감일), F(마감시간), G(비고)
  //   - 기존: A(구분), B(세부구분/명칭), C(시작일), D(마감일), E(마감시간), F(비고)
  // ─────────────────────────────────────────────────────────────
  const majorList = []
  if (csvMajor) {
    const rows = parseCSV(csvMajor)
    if (rows.length > 1) {
      const header0 = rows[0][0] || ''
      const firstDataRow = rows[1] || []
      const hasYearCol = header0.includes('학년도') || header0.includes('대입') || /^\d{4}$/.test(firstDataRow[0]?.trim())

      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 2) continue

        let admissionYear = 2027
        let offset = 0

        if (hasYearCol || /^\d{4}$/.test(r[0]?.trim())) {
          offset = 1
          const yNum = parseInt(r[0]?.trim(), 10)
          if (!isNaN(yNum) && yNum >= 2020 && yNum <= 2050) {
            admissionYear = yNum
          }
        }

        const group = r[0 + offset] || '공통'
        const title = r[1 + offset] || ''
        if (!title) continue

        // 대입학년도 기준 연도 계산 (예: 2027학년도 대입은 2026.08 ~ 2027.02)
        const baseCalYear = admissionYear ? admissionYear - 1 : 2026
        const startDate = normalizeDateStr(r[2 + offset], baseCalYear)
        const endDate = normalizeDateStr(r[3 + offset], baseCalYear) || startDate
        const time = r[4 + offset] || ''
        const note = r[5 + offset] || ''

        if (startDate || endDate) {
          majorList.push({
            id: `major-${i}`,
            admissionYear,
            group,
            title,
            startDate: startDate || endDate,
            endDate: endDate || startDate,
            time,
            note,
            isRange: !!(startDate && endDate && startDate !== endDate)
          })
        }
      }
    }
  }

  // fallback 결합 (만약 주요일정이 비어있다면)
  if (majorList.length === 0) {
    FALLBACK_MAJOR_SCHEDULE.forEach((item, idx) => {
      majorList.push({
        id: `major-fallback-${idx}`,
        admissionYear: 2027,
        ...item,
        isRange: item.startDate !== item.endDate
      })
    })
  }

  // ─────────────────────────────────────────────────────────────
  // 1-2. 원서접수 마감 대학 매핑
  //   - 신규: A(대입학년도), B(마감일: "2026년 9월 9일 수" 등 날짜 서식), C(마감시간), D(대학)
  //   - 기존: A(마감일), B(마감시간), C(대학)
  // ─────────────────────────────────────────────────────────────
  const deadlineByDate = {}
  if (csvDeadline) {
    const rows = parseCSV(csvDeadline)
    if (rows.length > 1) {
      const headerRow = rows[0] || []
      const header0 = headerRow[0] || ''
      const firstDataRow = rows[1] || []
      const hasYearCol = header0.includes('학년도') || header0.includes('대입') || (/^\d{4}$/.test(firstDataRow[0]?.trim()) && !firstDataRow[0]?.includes('.') && !firstDataRow[0]?.includes('-'))

      // 헤더 명칭 기반 컬럼 인덱스 자동 검색 (있으면 우선 적용)
      const hDateIdx = headerRow.findIndex(h => h.includes('마감일') || h.includes('날짜') || h.includes('일자'))
      const hTimeIdx = headerRow.findIndex(h => h.includes('시간') || h.includes('시각'))
      const hUniIdx = headerRow.findIndex(h => h.includes('대학') || h.includes('기관'))
      const hYearIdx = headerRow.findIndex(h => h.includes('학년도') || h.includes('대입'))

      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 2) continue

        let admissionYear = 2027
        let offset = 0

        if (hasYearCol || (/^\d{4}$/.test(r[0]?.trim()) && !r[0]?.includes('.') && !r[0]?.includes('-'))) {
          offset = 1
          const yNum = parseInt(r[0]?.trim(), 10)
          if (!isNaN(yNum) && yNum >= 2020 && yNum <= 2050) {
            admissionYear = yNum
          }
        }

        if (hYearIdx !== -1 && r[hYearIdx]) {
          const yNum = parseInt(r[hYearIdx].trim(), 10)
          if (!isNaN(yNum) && yNum >= 2020 && yNum <= 2050) {
            admissionYear = yNum
          }
        }

        const baseCalYear = admissionYear ? admissionYear - 1 : 2026
        const rawDate = hDateIdx !== -1 ? r[hDateIdx] : r[0 + offset]
        const dateStr = normalizeDateStr(rawDate, baseCalYear)
        if (!dateStr) continue

        const time = (hTimeIdx !== -1 ? r[hTimeIdx] : r[1 + offset]) || ''
        const uni = (hUniIdx !== -1 ? r[hUniIdx] : r[2 + offset]) || ''

        if (!deadlineByDate[dateStr]) {
          deadlineByDate[dateStr] = []
        }
        deadlineByDate[dateStr].push({ university: uni, time, admissionYear })
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. 4년제일정 (1단계합격, 면접, 실기, 논술, 합격자발표 등)
  //   - 신규: A(대입학년도), B(날짜), C(요일), D(구분), E(대학), F(전형), G(시각), H(비고)
  //   - 기존: A(날짜), B(요일), C(구분), D(대학), E(전형), F(시각), G(비고)
  // ─────────────────────────────────────────────────────────────
  const fourYearByDate = {}

  if (csvFourYear) {
    const rows = parseCSV(csvFourYear)
    if (rows.length > 1) {
      const header0 = rows[0][0] || ''
      const firstDataRow = rows[1] || []
      const hasYearCol = header0.includes('학년도') || header0.includes('대입') || /^\d{4}$/.test(firstDataRow[0]?.trim())

      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 3) continue

        let admissionYear = 2027
        let offset = 0

        if (hasYearCol || /^\d{4}$/.test(r[0]?.trim())) {
          offset = 1
          const yNum = parseInt(r[0]?.trim(), 10)
          if (!isNaN(yNum) && yNum >= 2020 && yNum <= 2050) {
            admissionYear = yNum
          }
        }

        const baseCalYear = admissionYear ? admissionYear - 1 : 2026
        const dateStr = normalizeDateStr(r[0 + offset], baseCalYear)
        if (!dateStr) continue

        const type = r[2 + offset] || '일정'
        const university = r[3 + offset] || ''
        const track = r[4 + offset] || ''
        const time = r[5 + offset] || ''
        const note = r[6 + offset] || ''

        if (!fourYearByDate[dateStr]) {
          fourYearByDate[dateStr] = {
            items: [],
            typeCounts: {}
          }
        }

        fourYearByDate[dateStr].items.push({
          university,
          type,
          track,
          time,
          note,
          admissionYear
        })

        fourYearByDate[dateStr].typeCounts[type] = (fourYearByDate[dateStr].typeCounts[type] || 0) + 1
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 3. 전문대일정
  //   - 신규: A(대입학년도), B(No), C(지역), D(구분), E(대학명), F(모집시기), G(원서접수), H(면접시작), I(면접마감), J(실기시작), K(실기마감), L(합격자발표), M(등록)
  //   - 기존: A(No), B(지역), C(구분), D(대학명), E(모집시기), F(원서접수), G(면접시작), H(면접마감), I(실기시작), J(실기마감), K(합격자발표), L(등록)
  // ─────────────────────────────────────────────────────────────
  const juniorByDate = {}
  if (csvJunior) {
    const rows = parseCSV(csvJunior)
    if (rows.length > 1) {
      const header0 = rows[0][0] || ''
      const firstDataRow = rows[1] || []
      const hasYearCol = header0.includes('학년도') || header0.includes('대입') || /^\d{4}$/.test(firstDataRow[0]?.trim())

      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 4) continue

        let admissionYear = 2027
        let offset = 0

        if (hasYearCol || /^\d{4}$/.test(r[0]?.trim())) {
          offset = 1
          const yNum = parseInt(r[0]?.trim(), 10)
          if (!isNaN(yNum) && yNum >= 2020 && yNum <= 2050) {
            admissionYear = yNum
          }
        }

        const baseCalYear = admissionYear ? admissionYear - 1 : 2026
        const university = r[3 + offset] || ''
        const round = r[4 + offset] || '수시'

        const addJunior = (dStr, type, note = '') => {
          const norm = normalizeDateStr(dStr, baseCalYear)
          if (!norm) return
          if (!juniorByDate[norm]) {
            juniorByDate[norm] = { items: [], typeCounts: {} }
          }
          juniorByDate[norm].items.push({
            university,
            round,
            type,
            note,
            admissionYear
          })
          juniorByDate[norm].typeCounts[type] = (juniorByDate[norm].typeCounts[type] || 0) + 1
        }

        const parseRange = (val, type) => {
          if (!val) return
          const parts = val.split('~')
          if (parts.length === 2) {
            let startPart = parts[0].trim()
            let endPart = parts[1].trim()
            if (!endPart.includes('/') && startPart.includes('/')) {
              const m = startPart.split('/')[0]
              endPart = `${m}/${endPart}`
            }
            addJunior(startPart, `${type} 시작`)
            addJunior(endPart, `${type} 마감`)
          } else {
            addJunior(val, type)
          }
        }

        parseRange(r[5 + offset], `${round} 원서접수`)
        if (r[6 + offset]) addJunior(r[6 + offset], `${round} 면접시작`)
        if (r[7 + offset]) addJunior(r[7 + offset], `${round} 면접마감`)
        if (r[8 + offset]) addJunior(r[8 + offset], `${round} 실기시작`)
        if (r[9 + offset]) addJunior(r[9 + offset], `${round} 실기마감`)
        if (r[10 + offset]) addJunior(r[10 + offset], `${round} 합격자발표`)
        parseRange(r[11 + offset], `${round} 등록`)
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 4. 기간 일정(Range Events) 생성: 형광 바 렌더링용
  // ─────────────────────────────────────────────────────────────
  const rangeEvents = []
  
  const COLOR_PALETTES = {
    major: [
      { name: 'emerald', bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46', bar: '#10b981' },
      { name: 'sky', bg: '#f0f9ff', border: '#bae6fd', text: '#0369a1', bar: '#0ea5e9' },
      { name: 'teal', bg: '#f0fdfa', border: '#99f6e4', text: '#115e59', bar: '#14b8a6' },
      { name: 'amber', bg: '#fffbeb', border: '#fde68a', text: '#92400e', bar: '#f59e0b' },
    ],
    fourYear: [
      { name: 'indigo', bg: '#eef2ff', border: '#c7d2fe', text: '#3730a3', bar: '#6366f1' },
      { name: 'purple', bg: '#faf5ff', border: '#e9d5ff', text: '#6b21a8', bar: '#a855f7' },
      { name: 'violet', bg: '#f5f3ff', border: '#ddd6fe', text: '#5b21b6', bar: '#8b5cf6' },
    ],
    junior: [
      { name: 'rose', bg: '#fff1f2', border: '#fecdd3', text: '#9f1239', bar: '#f43f5e' },
      { name: 'orange', bg: '#fff7ed', border: '#fed7aa', text: '#9a3412', bar: '#f97316' },
    ]
  }

  majorList.forEach((ev, idx) => {
    if (ev.startDate && ev.endDate && ev.startDate <= ev.endDate) {
      const isMultiDay = ev.startDate !== ev.endDate
      const palette = COLOR_PALETTES.major[idx % COLOR_PALETTES.major.length]
      rangeEvents.push({
        id: ev.id,
        track: 'major',
        title: ev.title,
        group: ev.group,
        admissionYear: ev.admissionYear || 2027,
        startDate: ev.startDate,
        endDate: ev.endDate,
        isMultiDay,
        time: ev.time,
        note: ev.note,
        palette
      })
    }
  })

  // ─────────────────────────────────────────────────────────────
  // 5. 학사일정 (학교 지필평가, 모의평가, 개학식/방학식, 휴업일 등)
  //   - 신규 B:R 서식: A열=학사년도(2026), B열=월(Month), C열=주차, D~R열=월~금 일자/시수/행사내용
  //   - 기존 A:Q 서식: A열=월(Month), B열=주차, C~Q열=월~금 일자/시수/행사내용
  // ─────────────────────────────────────────────────────────────
  const academicByDate = {}
  const academicEvents = []

  if (csvAcademic) {
    const rows = parseCSV(csvAcademic)
    if (rows.length > 0) {
      const yearMatch = csvAcademic.match(/(\d{4})\s*학년도/)
      const fallbackBaseYear = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear()

      const headerRow = rows[0] || []
      const dayNames = ['월', '화', '수', '목', '금', '토']
      let dynamicDaysInfo = []

      // 1) 헤더 행에서 요일 컬럼 위치 동적 탐색 (A:Q든 B:R이든 요일명 기준으로 자동 매핑)
      for (let c = 0; c < headerRow.length; c++) {
        const colName = headerRow[c]?.trim() || ''
        for (const dName of dayNames) {
          if (colName.includes(`${dName}요일`) || colName === `${dName} 일자` || colName === dName) {
            if (!dynamicDaysInfo.some(d => d.name === dName)) {
              let hoursIdx = -1
              let contentIdx = -1
              for (let offset = 1; offset <= 3; offset++) {
                const nextCol = headerRow[c + offset] || ''
                if (nextCol.includes('시수') && hoursIdx === -1) hoursIdx = c + offset
                if ((nextCol.includes('행사') || nextCol.includes('내용') || nextCol.includes('일정')) && contentIdx === -1) {
                  contentIdx = c + offset
                }
              }
              dynamicDaysInfo.push({
                name: dName,
                dayIdx: c,
                hoursIdx: hoursIdx !== -1 ? hoursIdx : c + 1,
                contentIdx: contentIdx !== -1 ? contentIdx : c + 2
              })
            }
          }
        }
      }

      // 첫 데이터 행을 보고 신규 서식(B:R, A=2026) 여부 판정
      const firstDataRow = rows[1] || []
      const hasYearColInA = /^\d{4}$/.test(firstDataRow[0]?.trim()) || headerRow[0]?.includes('학년도') || headerRow[0]?.includes('년도')

      if (dynamicDaysInfo.length === 0) {
        if (hasYearColInA) {
          // 신규 B:R 컬럼 (A=학사년도, B=월, C=주차, D=월요일 일자...)
          dynamicDaysInfo = [
            { dayIdx: 3, hoursIdx: 4, contentIdx: 5, name: '월' },
            { dayIdx: 6, hoursIdx: 7, contentIdx: 8, name: '화' },
            { dayIdx: 9, hoursIdx: 10, contentIdx: 11, name: '수' },
            { dayIdx: 12, hoursIdx: 13, contentIdx: 14, name: '목' },
            { dayIdx: 15, hoursIdx: 16, contentIdx: 17, name: '금' },
          ]
        } else {
          // 기존 A:Q 컬럼 (A=월, B=주차, C=월요일 일자...)
          dynamicDaysInfo = [
            { dayIdx: 2, hoursIdx: 3, contentIdx: 4, name: '월' },
            { dayIdx: 5, hoursIdx: 6, contentIdx: 7, name: '화' },
            { dayIdx: 8, hoursIdx: 9, contentIdx: 10, name: '수' },
            { dayIdx: 11, hoursIdx: 12, contentIdx: 13, name: '목' },
            { dayIdx: 14, hoursIdx: 15, contentIdx: 16, name: '금' },
          ]
        }
      }

      let currentMonth = 3
      let currentBaseYear = fallbackBaseYear

      for (let r = 1; r < rows.length; r++) {
        const row = rows[r]
        if (!row || row.length < 3) continue

        // A열에 4자리 연도가 있으면 해당 행의 학사년도로 적용 (예: 2026, 2027)
        let rowHasYearCol = false
        if (/^\d{4}$/.test(row[0]?.trim())) {
          rowHasYearCol = true
          const yVal = parseInt(row[0].trim(), 10)
          if (yVal >= 2020 && yVal <= 2050) {
            currentBaseYear = yVal
          }
        }

        // 월(Month) 컬럼: 신규 B:R일 때는 1열(B열), 기존 A:Q일 때는 0열(A열)
        const monthColIdx = (rowHasYearCol || hasYearColInA) ? 1 : 0
        const mCol = row[monthColIdx]?.trim()
        if (mCol && !isNaN(parseInt(mCol, 10))) {
          const parsedM = parseInt(mCol, 10)
          if (parsedM >= 1 && parsedM <= 12) {
            currentMonth = parsedM
          }
        }

        // 3~12월은 currentBaseYear (예: 2026), 1~2월은 currentBaseYear + 1 (예: 2027)
        const rowYear = currentMonth <= 2 ? currentBaseYear + 1 : currentBaseYear
        let weekPrevDay = 0
        let rowMonthOffset = 0

        for (const dInfo of dynamicDaysInfo) {
          const dStr = row[dInfo.dayIdx]?.trim()
          const content = row[dInfo.contentIdx]?.trim()
          const hours = row[dInfo.hoursIdx]?.trim()

          if (!dStr || isNaN(parseInt(dStr, 10))) continue
          const dayNum = parseInt(dStr, 10)
          if (dayNum < 1 || dayNum > 31) continue

          if (weekPrevDay > 20 && dayNum < 10) {
            rowMonthOffset = 1
          }
          weekPrevDay = dayNum

          let eventMonth = currentMonth + rowMonthOffset
          let eventYear = rowYear
          if (eventMonth > 12) {
            eventMonth = 1
            eventYear = currentBaseYear + 1
          }

          if (content) {
            const mStr = String(eventMonth).padStart(2, '0')
            const dayFormatted = String(dayNum).padStart(2, '0')
            const dateStr = `${eventYear}-${mStr}-${dayFormatted}`

            const isExam = content.includes('시험') || content.includes('지필')
            const isMockExam = content.includes('모의') || content.includes('연합') || content.includes('평가')
            const isHoliday = content.includes('휴업') || content.includes('공휴일') || content.includes('방학') || content.includes('신정') || content.includes('추석') || content.includes('한글날') || content.includes('성탄절')
            const isMilestone = content.includes('입학') || content.includes('개학') || content.includes('졸업') || content.includes('종업') || content.includes('수능')

            const item = {
              schoolYear: currentBaseYear,
              dateStr,
              dayOfWeek: dInfo.name,
              content,
              hours,
              isExam,
              isMockExam,
              isHoliday,
              isMilestone
            }

            if (!academicByDate[dateStr]) {
              academicByDate[dateStr] = []
            }
            academicByDate[dateStr].push(item)
            academicEvents.push(item)
          }
        }
      }
    }
  }

  return {
    majorList,
    deadlineByDate,
    fourYearByDate,
    juniorByDate,
    academicByDate,
    academicEvents,
    rangeEvents,
    lastUpdated: new Date().toISOString()
  }
}

/**
 * 오프라인/에러 시 사용할 fallback 데이터 (완벽 번들된 기본 2026/2027 데이터)
 */
function buildFallbackData() {
  return JSON.parse(JSON.stringify(defaultCalendarData))
}
