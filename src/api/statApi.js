import { supabase } from '../utils/supabaseClient'

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
  { key: '2027수시', year: '2027', type: '수시', category: 'susi', label: '2027학년도 수시 지원 원자료', isDefault: true },
  { key: '2026수시', year: '2026', type: '수시', category: 'susi', label: '2026학년도 수시 지원 원자료' },
  { key: '2025수시', year: '2025', type: '수시', category: 'susi', label: '2025학년도 수시 지원 원자료' },
  { key: '2027정시', year: '2027', type: '정시', category: 'jungsi', label: '2027학년도 정시 지원 원자료' },
  { key: '2026정시', year: '2026', type: '정시', category: 'jungsi', label: '2026학년도 정시 지원 원자료' },
  { key: '2025정시', year: '2025', type: '정시', category: 'jungsi', label: '2025학년도 정시 지원 원자료' },
  { key: '2027통계', year: '2027', type: '통계', category: 'stat', label: '2027학년도 공식 통계 요약' },
  { key: '2026통계', year: '2026', type: '통계', category: 'stat', label: '2026학년도 공식 통계 요약' },
  { key: '2025통계', year: '2025', type: '통계', category: 'stat', label: '2025학년도 공식 통계 요약' }
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

