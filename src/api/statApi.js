import { supabase } from '../utils/supabaseClient'
import * as XLSX from 'xlsx'

export const KCUE_SHEET_KEY = 'google_sheet_kcue_id'
export const DEFAULT_KCUE_SHEET_ID = '1U5Vnx2x8gnXQlI3N4deyaurKxj-naZP0cRBb3lQnT4o'

// 하위 호환성을 위한 키 및 기본값
export const KCUE_YEAR_SHEETS_KEY = 'kcue_year_sheets'
export const DEFAULT_KCUE_YEAR_SHEETS = {
  '2027': DEFAULT_KCUE_SHEET_ID,
  '2026': DEFAULT_KCUE_SHEET_ID,
  '2025': DEFAULT_KCUE_SHEET_ID,
  '2024': DEFAULT_KCUE_SHEET_ID,
  '2023': DEFAULT_KCUE_SHEET_ID
}

// 대입 학년도 및 전형 시기/통계 탭 표준 목록
export const STANDARD_KCUE_YEARS = ['2027', '2026', '2025', '2024', '2023']

export const STANDARD_KCUE_TABS = [
  { key: '기본통계', year: '전체', type: '기본통계', category: 'basic', label: '학년도별 기본통계 (3학년 학생수·학급수)', isDefault: false },
  { key: '2027수시', year: '2027', type: '수시', category: 'susi', label: '2027학년도 수시 지원 원자료', isDefault: true },
  { key: '2026수시', year: '2026', type: '수시', category: 'susi', label: '2026학년도 수시 지원 원자료' },
  { key: '2025수시', year: '2025', type: '수시', category: 'susi', label: '2025학년도 수시 지원 원자료' },
  { key: '2027정시', year: '2027', type: '정시', category: 'jungsi', label: '2027학년도 정시 지원 원자료' },
  { key: '2026정시', year: '2026', type: '정시', category: 'jungsi', label: '2026학년도 정시 지원 원자료' },
  { key: '2025정시', year: '2025', type: '정시', category: 'jungsi', label: '2025학년도 정시 지원 원자료' },
  { key: '2027통계', year: '2027', type: '통계', category: 'stat', label: '2027학년도 통계 요약 (선택)' },
  { key: '2026통계', year: '2026', type: '통계', category: 'stat', label: '2026학년도 통계 요약 (선택)' },
  { key: '2025통계', year: '2025', type: '통계', category: 'stat', label: '2025학년도 통계 요약 (선택)' }
]

export function extractSheetId(input) {
  if (!input) return ''
  const trimmed = String(input).trim()
  const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/)
  if (match) return match[1]
  return trimmed
}

/**
 * 탭 명칭 생성 헬퍼 (예: getKcueTabName('2027', '수시') => '2027수시')
 */
export function getKcueTabName(year, type = '수시') {
  return `${year}${type}`
}

/**
 * 대교협 구글 스프레드시트 웹 접속 URL
 */
export function buildSheetWebUrl(sheetId = null) {
  const cleanId = sheetId ? extractSheetId(sheetId) : DEFAULT_KCUE_SHEET_ID
  return `https://docs.google.com/spreadsheets/d/${cleanId}/edit`
}

/**
 * 특정 탭의 GViz CSV 다운로드 URL 빌더
 */
export function buildSheetTabGvizUrl(sheetId, tabName) {
  const cleanId = extractSheetId(sheetId)
  const encName = encodeURIComponent(tabName)
  return `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv&sheet=${encName}`
}

/**
 * 관리자 설정에 등록된 '3) 대교협 수시 지원 원자료 구글 시트 ID' 단일 조회
 */
export async function getKcueSheetId() {
  const cached = localStorage.getItem(`pcm_${KCUE_SHEET_KEY}`)
  let sheetId = cached ? cached.trim() : ''

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('config')
        .select('value')
        .eq('key', KCUE_SHEET_KEY)
        .maybeSingle()

      if (!error) {
        if (data && data.value != null && String(data.value).trim()) {
          sheetId = String(data.value).trim()
          localStorage.setItem(`pcm_${KCUE_SHEET_KEY}`, sheetId)
        } else if (data && !data.value) {
          sheetId = ''
          localStorage.removeItem(`pcm_${KCUE_SHEET_KEY}`)
        }
      }
    } catch (e) {
      console.warn('Failed to fetch KCUE sheet config:', e)
    }
  }

  return sheetId || DEFAULT_KCUE_SHEET_ID
}

/**
 * 통계 시스템 활성화 여부
 */
export async function isKcueStatSystemEnabled() {
  const sheetId = await getKcueSheetId()
  return !!sheetId && sheetId.length > 0
}

/**
 * 단일 대교협 시트 ID 저장
 */
export async function saveKcueSheetId(id) {
  const cleanId = extractSheetId(id)
  if (supabase) {
    const { error } = await supabase
      .from('config')
      .upsert({ key: KCUE_SHEET_KEY, value: cleanId }, { onConflict: 'key' })
    if (error) throw error
  }
  if (cleanId) {
    localStorage.setItem(`pcm_${KCUE_SHEET_KEY}`, cleanId)
  } else {
    localStorage.removeItem(`pcm_${KCUE_SHEET_KEY}`)
  }
  return cleanId
}

let cachedActualTabs = null
let cachedActualTabsTime = 0

/**
 * 구글 스프레드시트에 실제로 존재하는 시트 탭(Sheet Names) 목록 조회
 * (XLSX export 엔드포인트를 통해 실제 탭 목록을 정확히 파악하여,
 * 존재하지 않는 탭 요청 시 구글 GViz가 첫 번째 탭을 허수로 반환하는 문제를 방지)
 */
export async function getActualGoogleSheetTabs(sheetId, forceReload = false) {
  const cleanId = extractSheetId(sheetId)
  if (!cleanId) return []

  const now = Date.now()
  if (!forceReload && cachedActualTabs && (now - cachedActualTabsTime < 300000)) {
    return cachedActualTabs
  }

  try {
    const url = `https://docs.google.com/spreadsheets/d/${cleanId}/export?format=xlsx&_t=${now}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buffer = await res.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'buffer' })
    if (wb && Array.isArray(wb.SheetNames) && wb.SheetNames.length > 0) {
      cachedActualTabs = wb.SheetNames
      cachedActualTabsTime = now
      return cachedActualTabs
    }
  } catch (err) {
    console.warn('[statApi] Failed to fetch actual sheet tabs via xlsx:', err)
  }

  return cachedActualTabs || ['2027수시', '2026수시']
}

/**
 * 특정 시트 탭의 CSV 내용 비동기 가져오기
 */
export async function fetchKcueSheetTabCsv(sheetId, tabName) {
  const cleanId = extractSheetId(sheetId)
  if (!cleanId) throw new Error('구글 시트 ID가 지정되지 않았습니다.')
  const url = `${buildSheetTabGvizUrl(cleanId, tabName)}&_t=${Date.now()}`
  
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`[${tabName}] 탭을 읽을 수 없습니다. (HTTP ${res.status}) 시트의 공유 권한 및 탭 이름을 확인하세요.`)
  }
  return await res.text()
}

/**
 * 특정 시트 탭의 연결 상태 테스트 (존재 여부 및 행 수 확인)
 */
export async function testKcueSheetTabConnection(sheetId, tabName) {
  try {
    // 1. 구글 시트에 실제 탭이 존재하는지 먼저 확인
    const actualTabs = await getActualGoogleSheetTabs(sheetId, true)
    if (!actualTabs.includes(tabName)) {
      return { 
        success: false, 
        message: `'${tabName}' 탭이 구글 시트에 아직 생성되지 않았습니다.`, 
        rowCount: 0 
      }
    }

    const csv = await fetchKcueSheetTabCsv(sheetId, tabName)
    if (!csv || csv.trim().length === 0) {
      return { success: false, message: '탭 데이터가 비어 있습니다.', rowCount: 0 }
    }
    // 간단한 행 수 계산
    const lines = csv.trim().split(/\r?\n/)
    if (lines.length <= 1) {
      return { success: true, message: '헤더만 존재하거나 데이터가 적습니다.', rowCount: lines.length - 1 }
    }
    return { success: true, message: `연결 성공 (${(lines.length - 1).toLocaleString()}건 확인)`, rowCount: lines.length - 1 }
  } catch (err) {
    return { success: false, message: err.message || '연결 실패 (탭 이름 또는 공유 권한 확인 필요)', rowCount: 0 }
  }
}

/**
 * 대교협 구글 시트 CSV 원자료를 시스템 표준 applications 배열로 파싱
 */
export function parseKcueRows(csvText) {
  if (!csvText || typeof csvText !== 'string') return []

  const wb = XLSX.read(csvText, { type: 'string' })
  if (!wb.SheetNames || wb.SheetNames.length === 0) return []

  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 })
  if (!rows || rows.length < 2) return []

  const rawHeaders = rows[0] || []
  const colMap = {}
  rawHeaders.forEach((h, idx) => {
    if (!h) return
    const clean = String(h).replace(/[\r\n\s]+/g, '').trim()
    colMap[clean] = idx
  })

  const getVal = (row, ...keys) => {
    for (const k of keys) {
      const cleanK = k.replace(/[\r\n\s]+/g, '')
      if (colMap[cleanK] !== undefined) {
        const val = row[colMap[cleanK]]
        if (val !== undefined && val !== null && val !== '') return val
      }
    }
    return ''
  }

  const getNum = (row, ...keys) => {
    const v = getVal(row, ...keys)
    if (v === '' || v === null || v === undefined) return null
    const n = Number(v)
    return isNaN(n) ? null : n
  }

  const result = []
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    if (!r || r.length === 0) continue
    const name = String(getVal(r, '이름')).trim()
    if (!name) continue

    const grade = getNum(r, '학년') || 3
    const classNum = getVal(r, '반') || ''
    const studentNum = getNum(r, '번호') || ''
    const univName = String(getVal(r, '대학명')).trim()
    const region = String(getVal(r, '지역')).trim()
    const admissionType = String(getVal(r, '전형유형')).trim()
    const admissionMajorType = String(getVal(r, '전형명(대)')).trim()
    const admissionDetailType = String(getVal(r, '세부유형')).trim()
    const minScoreReq = String(getVal(r, '최저학력기준')).trim()

    const isRecommendation = admissionMajorType.includes('추천') || 
      admissionMajorType.includes('지역균형') || 
      admissionDetailType.includes('추천') || 
      admissionDetailType.includes('지역균형')

    const isRural = admissionMajorType.includes('농어촌') || admissionDetailType.includes('농어촌')
    const isOpportunity = admissionMajorType.includes('기회균형') || 
      admissionMajorType.includes('고른기회') || 
      admissionMajorType.includes('사회배려') || 
      admissionMajorType.includes('수급자') ||
      admissionDetailType.includes('기회균형') || 
      admissionDetailType.includes('고른기회')

    const isMetro = ['경기', '서울', '인천'].includes(region)
    const isGraduate = String(classNum).includes('졸업') || grade !== 3
    const studentKey = `${classNum}-${studentNum}_${name}`

    result.push({
      id: i,
      grade,
      classNum,
      studentNum,
      name,
      studentKey,
      isGraduate,
      schoolType: String(getVal(r, '학교유형')).trim(),
      region,
      univName,
      period: String(getVal(r, '모집시기')).trim() || '수시',
      admissionType,
      admissionMajorType,
      admissionDetailType,
      field: String(getVal(r, '계열')).trim(),
      dept: String(getVal(r, '모집단위')).trim(),
      quota: getNum(r, '모집인원'),
      selectionMethod: String(getVal(r, '선발유형')).trim(),
      minScoreReq,
      hasMinScore: !!minScoreReq,
      score9Grade: getNum(r, '(9등급)일반등급', '일반등급'),
      univConvertedScore: getNum(r, '내점수(환산)', '대학환산점수'),
      univConvertedGrade: getNum(r, '내등급(환산)', '대학환산등급'),
      stage1: String(getVal(r, '1단계')).trim(),
      finalStage: String(getVal(r, '최종단계')).trim(),
      failReason: String(getVal(r, '불합격사유')).trim(),
      candidateRank: String(getVal(r, '최초후보순위')).trim(),
      registerStatus: String(getVal(r, '등록여부')).trim(),
      note: String(getVal(r, '비고')).trim(),
      interviewDate: String(getVal(r, '면접일자')).trim(),
      practicalDate: String(getVal(r, '실기일자')).trim(),
      essayDate: String(getVal(r, '논술일자')).trim(),
      finalAnnounceDate: String(getVal(r, '최종발표일')).trim(),
      korGrade: getNum(r, '국어'),
      engGrade: getNum(r, '영어'),
      mathGrade: getNum(r, '수학'),
      socGrade: getNum(r, '사회'),
      sciGrade: getNum(r, '과학'),
      allSubjectGrade: getNum(r, '전교과(100)', '전교과'),
      mainSubjectGrade: getNum(r, '국영수사/과(100)', '국영수사/과'),
      koreanMathEnglish: getNum(r, '국영수'),
      isRecommendation,
      isRural,
      isOpportunity,
      isMetro
    })
  }

  return result
}

/**
 * 학년도 및 전형 시기별 시트 탭 데이터를 가져와 파싱된 배열로 반환
 * @param {string} sheetId 
 * @param {string} year 예: '2026', '2027'
 * @param {string} type 예: '수시', '정시'
 */
export async function fetchAndParseKcueYearData(sheetId, year, type = '수시') {
  const tabName = getKcueTabName(year, type)
  
  // 실제 구글 스프레드시트에 존재하는 탭인지 엄격하게 검증!
  // 존재하지 않는 탭을 GViz로 호출하면 구글 시트가 2027수시(첫 탭)를 허수로 반환하는 문제 차단
  const actualTabs = await getActualGoogleSheetTabs(sheetId)
  if (!actualTabs.includes(tabName)) {
    console.log(`[statApi] 구글 시트에 '${tabName}' 탭이 아직 등록되지 않았습니다. 빈 데이터를 반환합니다.`)
    return []
  }

  const csv = await fetchKcueSheetTabCsv(sheetId, tabName)
  return parseKcueRows(csv)
}

let cachedBasicStats = null
let cachedBasicStatsTime = 0

/**
 * 구글 시트의 '기본통계' 탭 파싱 (학년도별 3학년 학생 수 및 학급 수)
 * @param {string} sheetId 
 * @param {boolean} forceReload 
 * @returns {Promise<Record<string, { academicYear: number, totalStudents: number|null, classCount: number|null }>>}
 */
export async function fetchBasicSchoolStats(sheetId, forceReload = false) {
  const cleanId = extractSheetId(sheetId) || DEFAULT_KCUE_SHEET_ID
  const now = Date.now()
  if (!forceReload && cachedBasicStats && (now - cachedBasicStatsTime < 300000)) {
    return cachedBasicStats
  }

  try {
    const actualTabs = await getActualGoogleSheetTabs(cleanId, forceReload)
    if (!actualTabs.includes('기본통계')) {
      console.log("[statApi] 구글 시트에 '기본통계' 탭이 없습니다.")
      return cachedBasicStats || {}
    }

    const csvText = await fetchKcueSheetTabCsv(cleanId, '기본통계')
    if (!csvText || !csvText.trim()) return cachedBasicStats || {}

    const wb = XLSX.read(csvText, { type: 'string' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })

    let yearRow = null
    let studentCountRow = null
    let classCountRow = null

    for (const r of rows) {
      if (!r || r.length === 0) continue
      const title = String(r[0] || '').replace(/\s+/g, '')
      if (title.includes('대입학년도')) yearRow = r
      else if (title.includes('학생수')) studentCountRow = r
      else if (title.includes('학급수')) classCountRow = r
    }

    const byYear = {}
    if (yearRow) {
      for (let c = 1; c < yearRow.length; c++) {
        const y = String(yearRow[c] || '').trim()
        if (!y) continue
        const totalStudents = studentCountRow && studentCountRow[c] != null && !isNaN(studentCountRow[c])
          ? Number(studentCountRow[c])
          : null
        const classCount = classCountRow && classCountRow[c] != null && !isNaN(classCountRow[c])
          ? Number(classCountRow[c])
          : null
        byYear[y] = {
          academicYear: Number(y),
          totalStudents,
          classCount
        }
      }
    }

    cachedBasicStats = byYear
    cachedBasicStatsTime = now
    return cachedBasicStats
  } catch (err) {
    console.warn('[statApi] Failed to fetch basic school stats:', err)
    return cachedBasicStats || {}
  }
}

/**
 * 학년도별 대교협 구글 시트 ID 맵 조회 (하위 호환성 유지)
 * - 단일 구글 시트 ID 정책에 따라 모든 학년도가 동일한 단일 시트 ID를 가리키도록 제공
 */
export async function getKcueYearSheets() {
  const singleId = await getKcueSheetId()
  const result = {}
  STANDARD_KCUE_YEARS.forEach(y => {
    result[y] = singleId
  })
  return result
}

/**
 * 학년도별 대교협 구글 시트 ID 맵 저장 (하위 호환성 유지)
 * - 전달받은 시트 ID 중 기준 학년도(또는 첫 번째 유효 ID)를 단일 시트 ID로 저장
 */
export async function saveKcueYearSheets(sheetsMap) {
  if (!sheetsMap || typeof sheetsMap !== 'object') return {}
  const targetId = sheetsMap['2027'] || Object.values(sheetsMap).find(v => !!v) || ''
  await saveKcueSheetId(targetId)
  return await getKcueYearSheets()
}


