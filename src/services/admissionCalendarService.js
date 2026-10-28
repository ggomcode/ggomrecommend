import { supabase } from '../utils/supabaseClient.js'
import defaultCalendarData from '../data/admissionCalendarDefault.json'

export const DEFAULT_ADMISSION_SHEET_ID = '1hoiLXSv7B3_7hWYnSlv60AIRKhkERj8wQAFGCgmhJ2k'
const CACHE_KEY = 'pcm_admission_calendar_cache_v8'
const CACHE_TIME_KEY = 'pcm_admission_calendar_cache_time_v8'
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
 * 관리자 설정된 시트 ID 조회 (DB -> localStorage -> 기본값)
 * @param {boolean} allowDefault - 커스텀 설정이 없을 때 내장 기본값 반환 여부 (관리자 설정 UI에서는 false로 조회하여 빈 값 유지)
 */
export async function getAdmissionSheetId(allowDefault = true) {
  const localVal = localStorage.getItem('pcm_admission_sheet_id')
  const cleanLocal = extractSheetId(localVal)
  if (!supabase) return cleanLocal || (allowDefault ? DEFAULT_ADMISSION_SHEET_ID : '')

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
    }
  } catch (e) {
    console.warn('Failed to load admission_calendar_sheet_id from DB:', e)
  }

  return cleanLocal || (allowDefault ? DEFAULT_ADMISSION_SHEET_ID : '')
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
     'pcm_admission_calendar_cache_v8', 'pcm_admission_calendar_cache_time_v8'].forEach(k => localStorage.removeItem(k))
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
 * 다양한 날짜 형식(YYYY.MM.DD., YYYY. MM. DD, M/D, M월 D일 등)을 YYYY-MM-DD로 정규화
 * 대입 2027 학년도: 3월~12월은 2026년, 1월~2월은 2027년
 */
export function normalizeDateStr(raw, defaultYear = 2026) {
  if (!raw) return null
  let s = String(raw).trim()
  if (!s) return null

  // 1) 2026. 10. 15 or 2026.10.15. or 2027-01-04
  const fullMatch = s.match(/(\d{4})[.\-/]\s*(\d{1,2})[.\-/]\s*(\d{1,2})/)
  if (fullMatch) {
    const y = fullMatch[1]
    const m = String(fullMatch[2]).padStart(2, '0')
    const d = String(fullMatch[3]).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  // 2) 9월 9일(수) or 9월 9일
  const korMatch = s.match(/(\d{1,2})월\s*(\d{1,2})일/)
  if (korMatch) {
    const m = parseInt(korMatch[1], 10)
    const d = String(korMatch[2]).padStart(2, '0')
    const y = m <= 2 ? 2027 : 2026
    return `${y}-${String(m).padStart(2, '0')}-${d}`
  }

  // 3) 9/7 or 11/3
  const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})$/)
  if (slashMatch) {
    const m = parseInt(slashMatch[1], 10)
    const d = String(slashMatch[2]).padStart(2, '0')
    const y = m <= 2 ? 2027 : 2026
    return `${y}-${String(m).padStart(2, '0')}-${d}`
  }

  return null
}

/**
 * 단일 시트 CSV 데이터 fetch
 * 1순위: /export?format=csv&gid=... (구글 시트에서 Apps Script로 숨김 처리된 과거 행까지 모두 포함하여 온전히 내보냄)
 * 2순위: /gviz/tq?tqx=out:csv&sheet=... (시트 이름 기반 Fallback)
 */
async function fetchSheetCSV(sheetId, sheetName, retries = 2) {
  const targetId = extractSheetId(sheetId) || DEFAULT_ADMISSION_SHEET_ID
  const gid = DEFAULT_SHEET_GIDS[sheetName]

  // 1순위: GID 기반 /export?format=csv (숨겨진 과거 행도 전부 포함)
  if (gid !== undefined) {
    const exportUrl = `https://docs.google.com/spreadsheets/d/${targetId}/export?format=csv&gid=${gid}&_t=${Date.now()}`
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
        if (attempt === retries) console.warn(`Export CSV failed for ${sheetName}, trying GViz fallback:`, err)
        await new Promise(r => setTimeout(r, 400 * (attempt + 1)))
      }
    }
  }

  // 2순위 (fallback): GViz 엔드포인트
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
      throw new Error(`Empty or invalid response for sheet ${sheetName}`)
    } catch (err) {
      if (attempt === retries) throw err
      await new Promise(r => setTimeout(r, 400 * (attempt + 1)))
    }
  }
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
     'pcm_admission_calendar_cache_v7', 'pcm_admission_calendar_cache_time_v7'].forEach(k => localStorage.removeItem(k))
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
  const sheetId = extractSheetId(rawSheetId) || DEFAULT_ADMISSION_SHEET_ID

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
 */
function processAdmissionSheets({ csvMajor, csvDeadline, csvFourYear, csvJunior, csvAcademic }) {
  // ─────────────────────────────────────────────────────────────
  // 1. 주요일정 & 원서접수 마감
  // ─────────────────────────────────────────────────────────────
  const majorList = []
  if (csvMajor) {
    const rows = parseCSV(csvMajor)
    // row[0]=구분(공통/일반대/전문대), row[1]=세부구분(명칭), row[2]=시작, row[3]=마감, row[4]=마감시간, row[5]=비고
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i]
      if (!r || r.length < 2) continue
      const group = r[0] || '공통'
      const title = r[1] || ''
      if (!title) continue

      const startDate = normalizeDateStr(r[2])
      const endDate = normalizeDateStr(r[3]) || startDate
      const time = r[4] || ''
      const note = r[5] || ''

      if (startDate || endDate) {
        majorList.push({
          id: `major-${i}`,
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

  // fallback 결합 (만약 주요일정이 비어있다면)
  if (majorList.length === 0) {
    FALLBACK_MAJOR_SCHEDULE.forEach((item, idx) => {
      majorList.push({
        id: `major-fallback-${idx}`,
        ...item,
        isRange: item.startDate !== item.endDate
      })
    })
  }

  // 1-2. 원서접수 마감 대학 매핑 (마감일별 대학 목록)
  const deadlineByDate = {}
  if (csvDeadline) {
    const rows = parseCSV(csvDeadline)
    // row[0]=마감일, row[1]=마감시간, row[2]=대학(캠퍼스)
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i]
      if (!r || r.length < 3) continue
      const dateStr = normalizeDateStr(r[0])
      if (!dateStr) continue
      const time = r[1] || ''
      const uni = r[2] || ''
      if (!deadlineByDate[dateStr]) {
        deadlineByDate[dateStr] = []
      }
      deadlineByDate[dateStr].push({ university: uni, time })
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. 4년제일정 (1단계합격, 면접, 실기, 논술, 합격자발표 등)
  // ─────────────────────────────────────────────────────────────
  const fourYearByDate = {}
  const fourYearRanges = []

  if (csvFourYear) {
    const rows = parseCSV(csvFourYear)
    // row[0]=날짜, row[1]=요일, row[2]=구분, row[3]=대학, row[4]=전형, row[5]=시각, row[6]=비고
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i]
      if (!r || r.length < 4) continue
      const dateStr = normalizeDateStr(r[0])
      if (!dateStr) continue

      const type = r[2] || '일정'
      const university = r[3] || ''
      const track = r[4] || ''
      const time = r[5] || ''
      const note = r[6] || ''

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
        note
      })

      fourYearByDate[dateStr].typeCounts[type] = (fourYearByDate[dateStr].typeCounts[type] || 0) + 1
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 3. 전문대일정
  // ─────────────────────────────────────────────────────────────
  const juniorByDate = {}
  if (csvJunior) {
    const rows = parseCSV(csvJunior)
    // row[3]=대학명, row[4]=모집시기, row[5]=원서접수(9/7~30), row[6]=면접시작, row[7]=면접마감,
    // row[8]=실기시작, row[9]=실기마감, row[10]=합격자발표, row[11]=합격자등록
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i]
      if (!r || r.length < 5) continue
      const university = r[3] || ''
      const round = r[4] || '수시'

      // helper to add single date
      const addJunior = (dStr, type, note = '') => {
        const norm = normalizeDateStr(dStr)
        if (!norm) return
        if (!juniorByDate[norm]) {
          juniorByDate[norm] = { items: [], typeCounts: {} }
        }
        juniorByDate[norm].items.push({
          university,
          round,
          type,
          note
        })
        juniorByDate[norm].typeCounts[type] = (juniorByDate[norm].typeCounts[type] || 0) + 1
      }

      // helper for ranges like 9/7~30 or 12/21~23
      const parseRange = (val, type) => {
        if (!val) return
        const parts = val.split('~')
        if (parts.length === 2) {
          // e.g. 9/7 ~ 30 -> 9/7 and 9/30
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

      parseRange(r[5], `${round} 원서접수`)
      if (r[6]) addJunior(r[6], `${round} 면접시작`)
      if (r[7]) addJunior(r[7], `${round} 면접마감`)
      if (r[8]) addJunior(r[8], `${round} 실기시작`)
      if (r[9]) addJunior(r[9], `${round} 실기마감`)
      if (r[10]) addJunior(r[10], `${round} 합격자발표`)
      parseRange(r[11], `${round} 등록`)
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 4. 기간 일정(Range Events) 생성: 형광 바 렌더링용
  // ─────────────────────────────────────────────────────────────
  const rangeEvents = []
  
  // 색상 팔레트 정의 (형광/파스텔 계열)
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

  // 주요일정 중 기간 일정들을 Range Event로 등록
  majorList.forEach((ev, idx) => {
    if (ev.startDate && ev.endDate && ev.startDate <= ev.endDate) {
      const isMultiDay = ev.startDate !== ev.endDate
      const palette = COLOR_PALETTES.major[idx % COLOR_PALETTES.major.length]
      rangeEvents.push({
        id: ev.id,
        track: 'major', // Track 1
        title: ev.title,
        group: ev.group,
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
  //   - 학년도 자동 감지 (2026, 2027, 2028 등 내년 변경 자동 수용)
  //   - 헤더 컬럼 위치(월~금, 시수, 행사내용) 동적 탐색
  //   - 학기별 행 개수 증감 무관 유동적 파싱
  // ─────────────────────────────────────────────────────────────
  const academicByDate = {}
  const academicEvents = []

  if (csvAcademic) {
    const rows = parseCSV(csvAcademic)

    // 1) 학년도 자동 감지 (예: 2026학년도 -> 2026, 2027학년도 -> 2027)
    const yearMatch = csvAcademic.match(/(\d{4})\s*학년도/)
    const baseYear = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear()

    // 2) 헤더 행에서 요일 컬럼 위치 동적 탐색
    const headerRow = rows[0] || []
    const dayNames = ['월', '화', '수', '목', '금', '토']
    let dynamicDaysInfo = []

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

    if (dynamicDaysInfo.length === 0) {
      dynamicDaysInfo = [
        { dayIdx: 2, hoursIdx: 3, contentIdx: 4, name: '월' },
        { dayIdx: 5, hoursIdx: 6, contentIdx: 7, name: '화' },
        { dayIdx: 8, hoursIdx: 9, contentIdx: 10, name: '수' },
        { dayIdx: 11, hoursIdx: 12, contentIdx: 13, name: '목' },
        { dayIdx: 14, hoursIdx: 15, contentIdx: 16, name: '금' },
      ]
    }

    let currentMonth = 3

    // 3) 전체 행 순회 (학기 구분이나 행 개수 변화에 완전 유동적)
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r]
      if (!row || row.length < 3) continue

      // 월(Month)은 오직 0번째 컬럼에만 기록되어 있으며, 월이 바뀔 때만 값이 들어있습니다. (1열은 '주차' 번호이므로 혼동 방지)
      const mCol = row[0]?.trim()
      if (mCol && !isNaN(parseInt(mCol, 10))) {
        const parsedM = parseInt(mCol, 10)
        if (parsedM >= 1 && parsedM <= 12) {
          currentMonth = parsedM
        }
      }

      // 3~12월은 baseYear (예: 2026), 1~2월은 baseYear + 1 (예: 2027)
      const rowYear = currentMonth <= 2 ? baseYear + 1 : baseYear
      let weekPrevDay = 0
      let rowMonthOffset = 0 // 한 주(Row) 안에서 월말(31일) -> 월초(1일)로 넘어갈 때 +1

      for (const dInfo of dynamicDaysInfo) {
        const dStr = row[dInfo.dayIdx]?.trim()
        const content = row[dInfo.contentIdx]?.trim()
        const hours = row[dInfo.hoursIdx]?.trim()

        if (!dStr || isNaN(parseInt(dStr, 10))) continue
        const dayNum = parseInt(dStr, 10)
        if (dayNum < 1 || dayNum > 31) continue

        // 동일한 행 안에서 날짜가 20 이상에서 10 이하로 떨어지면 다음 달로 진입 (예: 3월 31일 화 -> 4월 1일 수)
        if (weekPrevDay > 20 && dayNum < 10) {
          rowMonthOffset = 1
        }
        weekPrevDay = dayNum

        let eventMonth = currentMonth + rowMonthOffset
        let eventYear = rowYear
        if (eventMonth > 12) {
          eventMonth = 1
          eventYear = baseYear + 1
        }

        if (content) {
          const mStr = String(eventMonth).padStart(2, '0')
          const dayFormatted = String(dayNum).padStart(2, '0')
          const dateStr = `${eventYear}-${mStr}-${dayFormatted}`

          // 이벤트 유형 자동 분류
          const isExam = content.includes('시험') || content.includes('지필')
          const isMockExam = content.includes('모의') || content.includes('연합') || content.includes('평가')
          const isHoliday = content.includes('휴업') || content.includes('공휴일') || content.includes('방학') || content.includes('신정') || content.includes('추석') || content.includes('한글날') || content.includes('성탄절')
          const isMilestone = content.includes('입학') || content.includes('개학') || content.includes('졸업') || content.includes('종업') || content.includes('수능')

          const item = {
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
