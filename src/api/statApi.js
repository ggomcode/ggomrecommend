import { supabase } from '../utils/supabaseClient'
import * as XLSX from 'xlsx'
import CryptoJS from 'crypto-js'

export const STAT_PASSWORD_SESSION_KEY = 'pcm_stat_secret_key'

export function getStatSessionPassword() {
  return sessionStorage.getItem(STAT_PASSWORD_SESSION_KEY) || ''
}

export function setStatSessionPassword(password) {
  if (password) {
    sessionStorage.setItem(STAT_PASSWORD_SESSION_KEY, password.trim())
  }
}

export function clearStatSessionPassword() {
  sessionStorage.removeItem(STAT_PASSWORD_SESSION_KEY)
}

export function decryptAES(cipherText, password) {
  if (!cipherText || !password) return null
  try {
    const bytes = CryptoJS.AES.decrypt(String(cipherText).trim(), password.trim())
    const decrypted = bytes.toString(CryptoJS.enc.Utf8)
    return decrypted || null
  } catch (e) {
    return null
  }
}

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
  { key: '2027가채점', year: '2027', type: '가채점', category: 'mock', label: '2027학년도 가채점 원자료 (모의고사)', isDefault: false },
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

export const RURAL_SHEET_KEY = 'google_sheet_rural_id'

/**
 * 관리자 설정에 등록된 '2) 농어촌 및 기회균형 전형 구글 시트 ID' 조회
 */
export async function getRuralSheetId() {
  const cached = localStorage.getItem(`pcm_${RURAL_SHEET_KEY}`)
  let sheetId = cached ? cached.trim() : ''

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('config')
        .select('value')
        .eq('key', RURAL_SHEET_KEY)
        .maybeSingle()

      if (!error) {
        if (data && data.value != null && String(data.value).trim()) {
          sheetId = String(data.value).trim()
          localStorage.setItem(`pcm_${RURAL_SHEET_KEY}`, sheetId)
        } else if (data && !data.value) {
          sheetId = ''
          localStorage.removeItem(`pcm_${RURAL_SHEET_KEY}`)
        }
      }
    } catch (e) {
      console.warn('Failed to fetch rural sheet config:', e)
    }
  }

  return sheetId
}

/**
 * 관리자 설정에 농어촌 및 기회균형 전형 구글 시트 ID가 등록되어 있는지 여부
 */
export async function hasRuralSheetConfigured() {
  const sheetId = await getRuralSheetId()
  return !!(sheetId && sheetId.trim().length > 0)
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

  return cachedActualTabs || ['2027수시', '2026수시', '기본통계']
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
 * (DA열 또는 'encrypted_data' 열에 AES 암호문이 있는 경우 복호화하여 파싱)
 */
export function parseKcueRows(csvText, customPassword = null) {
  if (!csvText || typeof csvText !== 'string') return []

  const wb = XLSX.read(csvText, { type: 'string' })
  if (!wb.SheetNames || wb.SheetNames.length === 0) return []

  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 })
  if (!rows || rows.length < 2) return []

  const password = customPassword || getStatSessionPassword()
  const rawHeaders = rows[0] || []
  
  // 1. FA열(157번째, 0-index: 156), DA열(105번째, 0-index: 104), CA열(79번째, 0-index: 78) 또는 'encrypted_data' 헤더 열 확인
  let encColIdx = rawHeaders.findIndex(h => String(h || '').trim() === 'encrypted_data')
  if (encColIdx === -1) {
    for (const cIdx of [156, 104, 78]) {
      if (rawHeaders.length > cIdx && String(rows[1]?.[cIdx] || '').trim().startsWith('U2FsdGVkX1')) {
        encColIdx = cIdx
        break
      }
    }
    // Fallback: 1행(첫 데이터행) 전체 열 탐색
    if (encColIdx === -1 && rows[1]) {
      for (let c = 0; c < rows[1].length; c++) {
        if (String(rows[1][c] || '').trim().startsWith('U2FsdGVkX1')) {
          encColIdx = c
          break
        }
      }
    }
  }

  // 암호화된 열이 있고 암호문이 존재하는지 확인
  let isEncrypted = false
  if (encColIdx !== -1) {
    for (let i = 1; i < Math.min(rows.length, 10); i++) {
      if (String(rows[i]?.[encColIdx] || '').trim().startsWith('U2FsdGVkX1')) {
        isEncrypted = true
        break
      }
    }
  }

  // 2. 일반 텍스트 모드 컬럼 맵
  const colMap = {}
  rawHeaders.forEach((h, idx) => {
    if (!h) return
    const clean = String(h).replace(/[\r\n\s]+/g, '').trim()
    colMap[clean] = idx
  })

  const result = []

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    if (!r || r.length === 0) continue

    let rowData = null

    if (isEncrypted) {
      const cipherText = String(r[encColIdx] || '').trim()
      if (!cipherText) continue
      
      const decryptedStr = decryptAES(cipherText, password)
      if (decryptedStr) {
        try {
          rowData = JSON.parse(decryptedStr)
        } catch (e) {
          console.warn(`[statApi] ${i}행 JSON 파싱 실패:`, e)
        }
      }
    }

    // 값 추출 헬퍼 (복호화된 JSON 객체 또는 일반 행 배열 지원)
    const getVal = (...keys) => {
      if (rowData) {
        for (const k of keys) {
          if (rowData[k] !== undefined && rowData[k] !== null && rowData[k] !== '') {
            return rowData[k]
          }
          // 공백 제거 매칭
          const cleanKey = k.replace(/[\r\n\s]+/g, '')
          for (const actualKey of Object.keys(rowData)) {
            if (actualKey.replace(/[\r\n\s]+/g, '') === cleanKey) {
              const val = rowData[actualKey]
              if (val !== undefined && val !== null && val !== '') return val
            }
          }
        }
        return ''
      } else {
        for (const k of keys) {
          const cleanK = k.replace(/[\r\n\s]+/g, '')
          if (colMap[cleanK] !== undefined) {
            const val = r[colMap[cleanK]]
            if (val !== undefined && val !== null && val !== '') return val
          }
        }
        return ''
      }
    }

    const getNum = (...keys) => {
      const v = getVal(...keys)
      if (v === '' || v === null || v === undefined) return null
      const n = Number(v)
      return isNaN(n) ? null : n
    }

    const name = String(getVal('이름')).trim()
    if (!name) continue

    const grade = getNum('학년') || 3
    const classNum = getVal('반') || ''
    const studentNum = getNum('번호') || ''
    const univName = String(getVal('대학명')).trim()
    const region = String(getVal('지역')).trim()
    const admissionType = String(getVal('전형유형')).trim()
    const admissionMajorType = String(getVal('전형명(대)')).trim()
    const admissionDetailType = String(getVal('세부유형')).trim()
    const minScoreReq = String(getVal('최저학력기준')).trim()

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

    // 경쟁률 수치 파싱 헬퍼 (예: "15.4", "15.4:1", "15.4 : 1" 등 지원)
    const parseRateVal = (val) => {
      if (val === null || val === undefined || val === '') return null
      const str = String(val).trim()
      if (str === '자료없음' || str === '-' || str === '미매칭' || str === 'N/A') return null
      const match = str.match(/([0-9]+(?:\.[0-9]+)?)/)
      if (match) {
        const n = parseFloat(match[1])
        return isNaN(n) ? null : n
      }
      return null
    }

    // 물리적 열 인덱스 또는 헤더명으로 값 추출 (CI, CK, CM 등)
    const getColOrKeyVal = (colIdx, ...keys) => {
      // 1) rowData 또는 헤더명 매핑 우선
      const namedVal = getVal(...keys)
      if (namedVal !== '' && namedVal !== null && namedVal !== undefined) return namedVal
      // 2) 행 배열의 물리적 열 인덱스
      if (r && r[colIdx] !== undefined && r[colIdx] !== null && r[colIdx] !== '') {
        return r[colIdx]
      }
      return ''
    }

    // 2027: CI=86 (모집), CK=88 (지원), CM=90 (경쟁률 수치) / 89 (경쟁률 표시용)
    // 2026: CU=98 (모집), CV=99 (지원), CW=100 (경쟁률)
    // 2025: DA=104 (모집), DB=105 (지원), DC=106 (경쟁률)
    const rawRate2027 = getColOrKeyVal(90, '[2027_매칭]경쟁률(수치)', '[2027_매칭]경쟁률(표시용)', '2027경쟁률', '27경쟁률', '경쟁률(2027)', '경쟁률') || getColOrKeyVal(89, '[2027_매칭]경쟁률(표시용)')
    const rawRate2026 = getColOrKeyVal(100, '[2026_매칭]경쟁률', '2026경쟁률', '26경쟁률', '경쟁률(2026)')
    const rawRate2025 = getColOrKeyVal(106, '[2025_매칭]경쟁률', '2025경쟁률', '25경쟁률', '경쟁률(2025)')

    const competitionRates = {
      '2025': {
        quota: getColOrKeyVal(104, '[2025_매칭]모집인원', '2025모집인원', '25모집인원', '모집인원(2025)'),
        applicants: getColOrKeyVal(105, '[2025_매칭]지원인원', '2025지원인원', '25지원인원', '지원인원(2025)'),
        rate: parseRateVal(rawRate2025),
        raw: String(rawRate2025 || '').trim()
      },
      '2026': {
        quota: getColOrKeyVal(98, '[2026_매칭]모집인원', '2026모집인원', '26모집인원', '모집인원(2026)'),
        applicants: getColOrKeyVal(99, '[2026_매칭]지원인원', '2026지원인원', '26지원인원', '지원인원(2026)'),
        rate: parseRateVal(rawRate2026),
        raw: String(rawRate2026 || '').trim()
      },
      '2027': {
        quota: getColOrKeyVal(86, '[2027_매칭]모집인원(표시용)', '[2027_매칭]모집인원(합산용)', '2027모집인원', '27모집인원', '모집인원(2027)'),
        applicants: getColOrKeyVal(88, '[2027_매칭]지원인원', '2027지원인원', '27지원인원', '지원인원(2027)'),
        rate: parseRateVal(rawRate2027),
        raw: String(rawRate2027 || '').trim()
      }
    }

    result.push({
      id: i,
      grade,
      classNum,
      studentNum,
      name,
      studentKey,
      isGraduate,
      schoolType: String(getVal('학교유형')).trim(),
      region,
      univName,
      period: String(getVal('모집시기')).trim() || '수시',
      admissionType,
      admissionMajorType,
      admissionDetailType,
      field: String(getVal('계열')).trim(),
      dept: String(getVal('모집단위')).trim(),
      quota: getNum('모집인원'),
      selectionMethod: String(getVal('선발유형')).trim(),
      minScoreReq,
      hasMinScore: !!minScoreReq,
      score9Grade: getNum('(9등급)일반등급', '일반등급'),
      univConvertedScore: getNum('내점수(환산)', '대학환산점수'),
      univConvertedGrade: getNum('내등급(환산)', '대학환산등급'),
      stage1: String(getVal('1단계')).trim(),
      finalStage: String(getVal('최종단계')).trim(),
      failReason: String(getVal('불합격사유')).trim(),
      candidateRank: String(getVal('최초후보순위')).trim(),
      registerStatus: String(getVal('등록여부')).trim(),
      note: String(getVal('비고')).trim(),
      interviewDate: String(getVal('면접일자')).trim(),
      practicalDate: String(getVal('실기일자')).trim(),
      essayDate: String(getVal('논술일자')).trim(),
      finalAnnounceDate: String(getVal('최종발표일')).trim(),
      korGrade: getNum('국어'),
      engGrade: getNum('영어'),
      mathGrade: getNum('수학'),
      socGrade: getNum('사회'),
      sciGrade: getNum('과학'),
      allSubjectGrade: getNum('전교과(100)', '전교과'),
      mainSubjectGrade: getNum('국영수사/과(100)', '국영수사/과'),
      koreanMathEnglish: getNum('국영수'),
      isRecommendation,
      isRural,
      isOpportunity,
      isMetro,
      competitionRates
    })
  }

  return result
}

/**
 * 학년도 및 전형 시기별 시트 탭 데이터를 가져와 파싱된 배열로 반환
 * @param {string} sheetId 
 * @param {string} year 예: '2026', '2027'
 * @param {string} type 예: '수시', '정시'
 * @param {string|null} customPassword
 */
export async function fetchAndParseKcueYearData(sheetId, year, type = '수시', customPassword = null) {
  const tabName = getKcueTabName(year, type)
  
  // 실제 구글 스프레드시트에 존재하는 탭인지 엄격하게 검증!
  const actualTabs = await getActualGoogleSheetTabs(sheetId)
  if (!actualTabs.includes(tabName)) {
    console.log(`[statApi] 구글 시트에 '${tabName}' 탭이 아직 등록되지 않았습니다. 빈 데이터를 반환합니다.`)
    return []
  }

  const csv = await fetchKcueSheetTabCsv(sheetId, tabName)
  return parseKcueRows(csv, customPassword)
}

/**
 * 구글 시트의 암호화 상태 확인 및 입력된 비밀번호 검증
 * @param {string} sheetId 
 * @param {string} password 
 * @returns {Promise<{ success: boolean, isEncrypted: boolean, message?: string }>}
 */
const STAT_SAMPLE_CIPHER_KEY = 'pcm_stat_sample_cipher'
let memorySampleCipher = ''

/**
 * 구글 시트의 DA열 암호문 샘플 1개를 초고속으로 획득 (캐시 우선 & gviz limit 3 초경량 쿼리)
 */
export async function getStatSampleCipher(sheetId, forceReload = false) {
  if (!forceReload) {
    if (memorySampleCipher) return memorySampleCipher
    const sess = sessionStorage.getItem(STAT_SAMPLE_CIPHER_KEY) || localStorage.getItem(STAT_SAMPLE_CIPHER_KEY)
    if (sess) {
      memorySampleCipher = sess
      return sess
    }
  }

  const cleanId = extractSheetId(sheetId) || DEFAULT_KCUE_SHEET_ID
  if (!cleanId) return ''

  // 초고속 GViz 쿼리 (단 3개 행만 요청: 5KB 미만, 0.2~0.5초 완료)
  const candidateTabs = ['2027수시', '2026수시', '']
  for (const tab of candidateTabs) {
    try {
      const tabParam = tab ? `&sheet=${encodeURIComponent(tab)}` : ''
      const url = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv${tabParam}&tq=limit%203&_t=${Date.now()}`
      const res = await fetch(url)
      if (!res.ok) continue
      const csv = await res.text()
      if (!csv || !csv.trim()) continue

      const wb = XLSX.read(csv, { type: 'string' })
      if (!wb.SheetNames || wb.SheetNames.length === 0) continue
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 })
      if (!rows || rows.length < 2) continue

      const rawHeaders = rows[0] || []
      let encColIdx = rawHeaders.findIndex(h => String(h || '').trim() === 'encrypted_data')
      if (encColIdx === -1) {
        if (rawHeaders.length >= 157) {
          encColIdx = 156
        } else if (rawHeaders.length >= 105) {
          encColIdx = 104
        }
      }

      if (encColIdx !== -1) {
        for (let i = 1; i < rows.length; i++) {
          const val = String(rows[i]?.[encColIdx] || '').trim()
          if (val.startsWith('U2FsdGVkX1')) {
            memorySampleCipher = val
            sessionStorage.setItem(STAT_SAMPLE_CIPHER_KEY, val)
            localStorage.setItem(STAT_SAMPLE_CIPHER_KEY, val)
            return val
          }
        }
      }
    } catch (e) {
      // 다음 후보 탭 시도
    }
  }

  return memorySampleCipher || ''
}

/**
 * 포털 진입 시 백그라운드에서 암호문 샘플을 조용히 사전 로드 (클릭 시 0초 즉시 판정)
 */
export function preloadStatCipher(sheetId) {
  setTimeout(() => {
    getStatSampleCipher(sheetId).catch(() => {})
  }, 50)
}

/**
 * 대교협 구글 시트의 복호화 암호 검증 (초고속 캐시 활용)
 * @param {string} sheetId 
 * @param {string} password 
 * @returns {Promise<{ success: boolean, isEncrypted: boolean, message?: string }>}
 */
export async function verifyStatSheetPassword(sheetId, password) {
  const cleanId = extractSheetId(sheetId) || DEFAULT_KCUE_SHEET_ID
  try {
    // 캐시 우선으로 0ms 만에 암호문 샘플 획득
    const sampleCipher = await getStatSampleCipher(cleanId)

    // 시트에 암호화된 내용이 전혀 없는 경우 (기존 일반 시트)
    if (!sampleCipher) {
      return { success: true, isEncrypted: false, message: '암호화되지 않은 시트입니다.' }
    }

    // 암호문이 있는 경우: 비밀번호 검증
    if (!password) {
      return { success: false, isEncrypted: true, message: '비밀번호를 입력해야 합니다.' }
    }

    const decrypted = decryptAES(sampleCipher, password)
    if (!decrypted) {
      return { success: false, isEncrypted: true, message: '비밀번호가 올바르지 않습니다.' }
    }

    try {
      JSON.parse(decrypted)
      return { success: true, isEncrypted: true, message: '인증 성공' }
    } catch (e) {
      return { success: false, isEncrypted: true, message: '복호화 데이터가 손상되었습니다.' }
    }
  } catch (err) {
    return { success: false, isEncrypted: false, message: err.message || '시트 확인 실패' }
  }
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

/**
 * 배포 구글 시트의 '2027가채점' 탭(CA열 암호화 데이터)을 비동기 조회하여
 * 모의고사 응시 배열로 파싱 및 복호화
 */
export async function fetchAndParseKcueMockData(sheetId = null, tabName = null, customPassword = null) {
  const cleanId = sheetId ? extractSheetId(sheetId) : await getKcueSheetId()
  if (!cleanId) throw new Error('구글 시트 ID가 설정되지 않았습니다.')

  // 1. 실제 구글 시트에 존재하는 탭 자동 탐색 (2027모의가채점, 2027가채점, 모의가채점 등)
  let targetTab = tabName
  if (!targetTab) {
    const actualTabs = await getActualGoogleSheetTabs(cleanId)
    targetTab = actualTabs.find(t => t.includes('모의') || t.includes('가채점')) || '2027모의가채점'
  }

  const password = customPassword || getStatSessionPassword()
  const csvText = await fetchKcueSheetTabCsv(cleanId, targetTab)
  if (!csvText || typeof csvText !== 'string') return []

  const wb = XLSX.read(csvText, { type: 'string' })
  if (!wb.SheetNames || wb.SheetNames.length === 0) return []

  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 })
  if (!rows || rows.length < 2) return []

  const rawHeaders = rows[0] || []
  
  // CA열(79번째, 0-index: 78), encrypted_data 열 또는 U2FsdGVkX1 암호문 열 탐색
  let encColIdx = rawHeaders.findIndex(h => String(h || '').trim() === 'encrypted_data')
  if (encColIdx === -1) {
    for (const cIdx of [78, 156, 104]) {
      if (rawHeaders.length > cIdx && String(rows[1]?.[cIdx] || '').trim().startsWith('U2FsdGVkX1')) {
        encColIdx = cIdx
        break
      }
    }
    if (encColIdx === -1 && rows[1]) {
      for (let c = 0; c < rows[1].length; c++) {
        if (String(rows[1][c] || '').trim().startsWith('U2FsdGVkX1')) {
          encColIdx = c
          break
        }
      }
    }
  }

  const isEncrypted = encColIdx !== -1 && String(rows[1]?.[encColIdx] || '').trim().startsWith('U2FsdGVkX1')

  const colMap = {}
  rawHeaders.forEach((h, idx) => {
    if (!h) return
    const clean = String(h).replace(/[\r\n\s]+/g, '').trim()
    colMap[clean] = idx
  })

  const records = []

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    if (!r || r.length === 0) continue

    let rowData = null
    if (isEncrypted) {
      const cipherText = String(r[encColIdx] || '').trim()
      if (!cipherText) continue
      const decryptedStr = decryptAES(cipherText, password)
      if (decryptedStr) {
        try {
          rowData = JSON.parse(decryptedStr)
        } catch (e) {}
      }
    }

    const getVal = (...keys) => {
      if (rowData) {
        for (const k of keys) {
          if (rowData[k] !== undefined && rowData[k] !== null && rowData[k] !== '') {
            return String(rowData[k]).trim()
          }
          const cleanK = k.replace(/[\r\n\s]+/g, '')
          for (const ak of Object.keys(rowData)) {
            if (ak.replace(/[\r\n\s]+/g, '') === cleanK && rowData[ak] !== undefined && rowData[ak] !== null && rowData[ak] !== '') {
              return String(rowData[ak]).trim()
            }
          }
        }
        return ''
      } else {
        for (const k of keys) {
          const cleanK = k.replace(/[\r\n\s]+/g, '')
          if (colMap[cleanK] !== undefined && r[colMap[cleanK]] !== undefined && r[colMap[cleanK]] !== null && r[colMap[cleanK]] !== '') {
            return String(r[colMap[cleanK]]).trim()
          }
        }
        return ''
      }
    }

    const getNum = (...keys) => {
      const v = getVal(...keys)
      if (v === '' || v === null || v === undefined) return null
      const n = Number(v)
      return isNaN(n) ? null : n
    }

    // 등급 파싱 함수 (1~9 등급 검증 및 원점수/표준점수 등급 자동 환산)
    const parseGradeValue = (val, subjectType = 'NORMAL') => {
      if (val === '' || val === null || val === undefined) return null
      const cleanStr = String(val).replace(/[^0-9.]/g, '')
      if (!cleanStr) return null
      const n = Number(cleanStr)
      if (isNaN(n) || n <= 0) return null
      // 1~9 범위의 유효 등급
      if (n >= 1 && n <= 9) return Math.round(n * 100) / 100
      
      // 영어 절대평가 원점수(10~100) -> 1~9 등급 환산
      if (subjectType === 'ENG' && n > 9 && n <= 100) {
        if (n >= 90) return 1
        if (n >= 80) return 2
        if (n >= 70) return 3
        if (n >= 60) return 4
        if (n >= 50) return 5
        if (n >= 40) return 6
        if (n >= 30) return 7
        if (n >= 20) return 8
        return 9
      }

      // 한국사 절대평가 원점수(10~50) -> 1~9 등급 환산
      if (subjectType === 'HIST' && n > 9 && n <= 50) {
        if (n >= 40) return 1
        if (n >= 35) return 2
        if (n >= 30) return 3
        if (n >= 25) return 4
        if (n >= 20) return 5
        if (n >= 15) return 6
        if (n >= 10) return 7
        if (n >= 5) return 8
        return 9
      }

      // 국어 원점수(10~100) 또는 표준점수(>100) -> 등급 환산
      if (subjectType === 'KOR') {
        if (n > 100) {
          if (n >= 132) return 1
          if (n >= 124) return 2
          if (n >= 115) return 3
          if (n >= 104) return 4
          if (n >= 92) return 5
          if (n >= 80) return 6
          if (n >= 68) return 7
          if (n >= 56) return 8
          return 9
        }
        if (n > 9 && n <= 100) {
          if (n >= 88) return 1
          if (n >= 80) return 2
          if (n >= 70) return 3
          if (n >= 58) return 4
          if (n >= 46) return 5
          if (n >= 34) return 6
          if (n >= 22) return 7
          if (n >= 12) return 8
          return 9
        }
      }

      // 수학 원점수(10~100) 또는 표준점수(>100) -> 등급 환산
      if (subjectType === 'MATH') {
        if (n > 100) {
          if (n >= 133) return 1
          if (n >= 124) return 2
          if (n >= 115) return 3
          if (n >= 104) return 4
          if (n >= 91) return 5
          if (n >= 79) return 6
          if (n >= 67) return 7
          if (n >= 55) return 8
          return 9
        }
        if (n > 9 && n <= 100) {
          if (n >= 84) return 1
          if (n >= 74) return 2
          if (n >= 62) return 3
          if (n >= 50) return 4
          if (n >= 38) return 5
          if (n >= 26) return 6
          if (n >= 16) return 7
          if (n >= 8) return 8
          return 9
        }
      }

      // 탐구 원점수(10~50) 또는 표준점수(>50) -> 등급 환산
      if (subjectType === 'INQ') {
        if (n > 9 && n <= 50) {
          if (n >= 42) return 1
          if (n >= 36) return 2
          if (n >= 30) return 3
          if (n >= 23) return 4
          if (n >= 17) return 5
          if (n >= 11) return 6
          if (n >= 6) return 7
          if (n >= 3) return 8
          return 9
        }
        if (n > 50) {
          if (n >= 66) return 1
          if (n >= 61) return 2
          if (n >= 55) return 3
          if (n >= 48) return 4
          if (n >= 42) return 5
          if (n >= 35) return 6
          if (n >= 29) return 7
          if (n >= 22) return 8
          return 9
        }
      }

      return null
    }

    const getGradeNum = (keys, subjectType = 'NORMAL') => {
      // 1) 명시된 키 리스트 우선 탐색
      for (const k of keys) {
        const v = getVal(k)
        const parsed = parseGradeValue(v, subjectType)
        if (parsed !== null) return parsed
      }

      // 2) rowData 또는 colMap 키 패턴 fallback 탐색
      let pattern = null
      if (subjectType === 'KOR') pattern = /(?:^|[^가-힣])(?:국어|언어|국)(?:$|[^가-힣]|.*?(?:등급|석차|표점|원점수|성적))/i
      else if (subjectType === 'MATH') pattern = /(?:^|[^가-힣])(?:수학|수리|수)(?:$|[^가-힣]|.*?(?:등급|석차|표점|원점수|성적))/i
      else if (subjectType === 'ENG') pattern = /(?:^|[^가-힣])(?:영어|외국어|영)(?:$|[^가-힣]|.*?(?:등급|석차|표점|원점수|성적))/i
      else if (subjectType === 'HIST') pattern = /(?:^|[^가-힣])(?:한국사|국사|한)(?:$|[^가-힣]|.*?(?:등급|석차|표점|원점수|성적))/i

      if (pattern && rowData) {
        for (const [rk, rv] of Object.entries(rowData)) {
          if (pattern.test(rk)) {
            const parsed = parseGradeValue(rv, subjectType)
            if (parsed !== null) return parsed
          }
        }
      }
      return null
    }

    const getInqGrade = (inqIndex) => {
      const specificKeys = inqIndex === 1
        ? ['탐구1(등급)', '탐구1등급', '탐구1_등급', '제1선택_등급', '탐구1 등급', '사/과(1)_등급', '사탐1_등급', '과탐1_등급', '탐1_등급', '탐구1(원점수)', '탐구1원점수', '탐구1(표준점수)', '탐구1(표점)', '탐구1(백분위)', '탐구1점수', '탐구1']
        : ['탐구2(등급)', '탐구2등급', '탐구2_등급', '제2선택_등급', '탐구2 등급', '사/과(2)_등급', '사탐2_등급', '과탐2_등급', '탐2_등급', '탐구2(원점수)', '탐구2원점수', '탐구2(표준점수)', '탐구2(표점)', '탐구2(백분위)', '탐구2점수', '탐구2']
      
      for (const k of specificKeys) {
        const v = getVal(k)
        const parsed = parseGradeValue(v, 'INQ')
        if (parsed !== null) return parsed
      }

      if (rowData) {
        const regex = inqIndex === 1 
          ? /(?:탐구\s*1|선택\s*1|사탐\s*1|과탐\s*1|제1선택|1선택).*?(?:등급|표점|점수|성적)?/i
          : /(?:탐구\s*2|선택\s*2|사탐\s*2|과탐\s*2|제2선택|2선택).*?(?:등급|표점|점수|성적)?/i
        for (const [rk, rv] of Object.entries(rowData)) {
          if (regex.test(rk)) {
            const parsed = parseGradeValue(rv, 'INQ')
            if (parsed !== null) return parsed
          }
        }
      }
      return null
    }

    const name = getVal('이름', '성명', '학생명')
    if (!name) continue

    const classNum = getVal('반', '학급') || ''
    const studentNum = getVal('번호', '출석번호') || ''
    let examName = getVal('시험명', '회차', '모의고사', '월', '구분', '시험구분', '시험', '학평', '모의평가')
    if (!examName && r && r[0] != null && String(r[0]).trim()) {
      examName = String(r[0]).trim()
    }
    if (!examName && rowData) {
      for (const [k, v] of Object.entries(rowData)) {
        const strV = String(v || '').trim()
        if (strV.includes('수능') || /([0-9]{1,2})\s*월/.test(strV)) {
          examName = strV
          break
        }
      }
    }
    if (!examName) examName = targetTab

    // 국어 선택과목 (숫자 점수 오인식 방지)
    let korSubject = getVal(
      '국어(과목)', '국어(선택)', '국어선택', '국어과목', '선택_국어',
      '선택과목(국어)', '선택과목_국어', '국어선택과목', '국어_선택', '선택(국어)'
    ) || ''
    if (!korSubject) {
      const gukVal = getVal('국어', '국')
      if (gukVal && /화작|화법|언매|언어/.test(gukVal)) {
        korSubject = gukVal
      }
    }

    // 수학 선택과목 (숫자 점수 오인식 방지)
    let mathSubject = getVal(
      '수학(과목)', '수학(선택)', '수학선택', '수학과목', '선택_수학',
      '선택과목(수학)', '선택과목_수학', '수학선택과목', '수학_선택', '선택(수학)'
    ) || ''
    if (!mathSubject) {
      const suVal = getVal('수학', '수')
      if (suVal && /미적|기하|확률|확통/.test(suVal)) {
        mathSubject = suVal
      }
    }

    const inquiry1 = getVal('탐구1(과목)', '탐구1', '선택과목1', '탐구과목1', '사탐/과탐1', '제1선택', '탐구1과목') || ''
    const inquiry2 = getVal('탐구2(과목)', '탐구2', '선택과목2', '탐구과목2', '사탐/과탐2', '제2선택', '탐구2과목') || ''

    // 등급 파싱 (수능최저학력기준 판정용 & 과목별 통계용, 1~9등급 보장 및 원점수/표준점수 자동 환산)
    const korGrade = getGradeNum([
      '국어(등급)', '국어등급', '국어_등급', '국어 등급', '국(등급)', '국등급',
      '국어(원점수)', '국어원점수', '국어_원점수', '국어(표준점수)', '국어(표점)', '국어(백분위)', '국어점수', '국어', '국'
    ], 'KOR')
    const mathGrade = getGradeNum([
      '수학(등급)', '수학등급', '수학_등급', '수학 등급', '수(등급)', '수등급',
      '수학(원점수)', '수학원점수', '수학_원점수', '수학(표준점수)', '수학(표점)', '수학(백분위)', '수학점수', '수학', '수'
    ], 'MATH')
    const engGrade = getGradeNum([
      '영어(등급)', '영어등급', '영어_등급', '영어 등급', '영(등급)', '영등급',
      '영어(원점수)', '영어원점수', '영어_원점수', '영어(표준점수)', '영어(표점)', '영어점수', '영어', '영'
    ], 'ENG')
    const inq1Grade = getInqGrade(1)
    const inq2Grade = getInqGrade(2)
    const histGrade = getGradeNum([
      '한국사(등급)', '한국사등급', '한국사_등급', '한국사 등급', '한(등급)', '한등급',
      '한국사(원점수)', '한국사원점수', '한국사(표준점수)', '한국사점수', '한국사'
    ], 'HIST')
    const secondLangGrade = getGradeNum([
      '제2외국어(등급)', '제2외국어등급', '제2외국어_등급', '제2외국어',
      '제2외국어(원점수)', '제2외국어(표준점수)'
    ], 'NORMAL')

    records.push({
      examName,
      name,
      classNum,
      studentNum,
      studentKey: `${classNum}-${studentNum}_${name}`,
      korSubject,
      mathSubject,
      inquiry1,
      inquiry2,
      korGrade,
      mathGrade,
      engGrade,
      inq1Grade,
      inq2Grade,
      histGrade,
      secondLangGrade,
      rawRow: rowData || {}
    })
  }

  return records
}

/**
 * 학생별 모의고사 응시 이력을 studentKey 기준으로 그룹화하여 반환하는 헬퍼
 * @param {Array} records 
 * @returns {Map<string, Array>} studentKey -> [exam1, exam2, ...]
 */
export function groupMockRecordsByStudent(records = []) {
  const map = new Map()
  if (!Array.isArray(records)) return map

  records.forEach(r => {
    const key = r.studentKey
    if (!map.has(key)) {
      map.set(key, [])
    }
    map.get(key).push(r)
  })

  // 각 학생의 시험 이력을 월 순서대로 정렬
  map.forEach((examList) => {
    examList.sort((a, b) => {
      const getMonth = (name) => {
        const m = String(name).match(/([0-9]{1,2})\s*월/)
        return m ? parseInt(m[1], 10) : 0
      }
      return getMonth(a.examName) - getMonth(b.examName)
    })
  })

  return map
}

// 수능최저 시트 데이터 메모리 캐시
const csatMinScoreCache = new Map()

/**
 * [수능최저 시트 로더] 구글 시트의 '{year}수능최저' 탭 데이터를 비암호화 평문으로 로드
 * @param {string|null} sheetId 구글 스프레드시트 ID (생략 시 기본/설정된 시트 사용)
 * @param {string} year 학년도 ('2027', '2028' 등)
 * @param {boolean} forceRefresh 강제 새로고침 여부
 * @returns {Promise<Array<object>>} 9개 컬럼 정규화 레코드 배열
 */
export async function fetchCsatMinScoreTable(sheetId = null, year = '2027', forceRefresh = false) {
  const targetSheetId = sheetId ? extractSheetId(sheetId) : await getKcueSheetId()
  const cacheKey = `${targetSheetId}_${year}`

  if (!forceRefresh && csatMinScoreCache.has(cacheKey)) {
    return csatMinScoreCache.get(cacheKey)
  }

  const tabName = `${year}수능최저`
  const gvizUrl = buildSheetTabGvizUrl(targetSheetId, tabName)

  try {
    const res = await fetch(gvizUrl)
    if (!res.ok) {
      console.warn(`[fetchCsatMinScoreTable] '${tabName}' 탭 로드 실패: HTTP ${res.status}`)
      return []
    }

    const text = await res.text()
    if (!text || text.includes('google-signin') || text.includes('accounts.google.com')) {
      console.warn(`[fetchCsatMinScoreTable] 구글 로그인 필요 또는 시트 권한 부족`)
      return []
    }

    const wb = XLSX.read(text, { type: 'string' })
    const sheetName = wb.SheetNames[0]
    if (!sheetName) return []

    const sheet = wb.Sheets[sheetName]
    const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 })
    if (!rawRows || rawRows.length < 2) return []

    // 첫 행 헤더 확인
    const headerRow = rawRows[0] || []
    const colIdx = {
      seq: headerRow.findIndex(h => String(h).includes('연번')),
      univSeq: headerRow.findIndex(h => String(h).includes('대학순번')),
      region: headerRow.findIndex(h => String(h).includes('지역')),
      univName: headerRow.findIndex(h => String(h).includes('대학명')),
      broadType: headerRow.findIndex(h => String(h).trim() === '전형'),
      detailType: headerRow.findIndex(h => String(h).includes('세부전형') && !String(h).includes('세세부')),
      subDetailType: headerRow.findIndex(h => String(h).includes('세세부전형')),
      dept: headerRow.findIndex(h => String(h).includes('학부') || String(h).includes('학과')),
      minScore: headerRow.findIndex(h => String(h).includes('수능최저'))
    }

    // fallback to positional indices if header matching is imperfect
    const getVal = (row, idx, fallback) => {
      const targetIdx = idx !== -1 ? idx : fallback
      return row[targetIdx] !== undefined ? String(row[targetIdx]).trim() : ''
    }

    const records = []
    for (let r = 1; r < rawRows.length; r++) {
      const row = rawRows[r]
      if (!row || row.length === 0) continue

      const univName = getVal(row, colIdx.univName, 3)
      if (!univName) continue

      records.push({
        seq: parseInt(getVal(row, colIdx.seq, 0), 10) || r,
        univSeq: parseInt(getVal(row, colIdx.univSeq, 1), 10) || 0,
        region: getVal(row, colIdx.region, 2),
        univName,
        broadType: getVal(row, colIdx.broadType, 4),
        detailType: getVal(row, colIdx.detailType, 5),
        subDetailType: getVal(row, colIdx.subDetailType, 6),
        dept: getVal(row, colIdx.dept, 7),
        minScore: getVal(row, colIdx.minScore, 8)
      })
    }

    csatMinScoreCache.set(cacheKey, records)
    return records
  } catch (err) {
    console.error(`[fetchCsatMinScoreTable] 오류 발생:`, err)
    return []
  }
}

/**
 * 수능최저 테이블의 필터 옵션 메타데이터(지역 목록, 대학 목록, 전형 목록 등) 추출
 * @param {Array<object>} records 
 */
export function getCsatMinScoreFilterOptions(records = []) {
  const regions = new Set()
  const univNames = new Set()
  const broadTypes = new Set()
  const detailTypes = new Set()

  records.forEach(r => {
    if (r.region) regions.add(r.region)
    if (r.univName) univNames.add(r.univName)
    if (r.broadType) broadTypes.add(r.broadType)
    if (r.detailType) detailTypes.add(r.detailType)
  })

  return {
    regions: Array.from(regions),
    univNames: Array.from(univNames),
    broadTypes: Array.from(broadTypes),
    detailTypes: Array.from(detailTypes)
  }
}

/**
 * ==========================================================
 * [수능최저충족률 시트 로더 & 벤치마크 데이터셋]
 * 1~2등급 상위권뿐 아니라 4~6등급 중·하위권 공교육 학생들의
 * 실질경쟁률 완화 및 기적의 역전 합격 분석 지원
 * ==========================================================
 */

/**
 * ==========================================================
 * 수능 최저학력기준 충족률 벤치마크 및 2025학년도 30개 대학 실측 통계
 * ==========================================================
 */

// 2025학년도 전국 30개 대학 발표 공식 수능최저 충족률 집계 요약
export const OFFICIAL_CSAT_PASS_RATE_SUMMARY = {
  academicYear: '2025학년도',
  totalUniversities: 30,
  byAdmissionType: [
    {
      type: '학생부교과',
      univCount: 26,
      totalApplicants: 129582,
      passedApplicants: 75277,
      passRate: 58.1,
      dropRate: 41.9,
      minRateText: '동국대(WISE) 32.8%',
      maxRateText: '성신여대 80.7%',
      highlight: '지원자의 41.9%가 수능최저 미충족으로 자동 탈락 (실질경쟁률 40% 이상 완화)'
    },
    {
      type: '학생부종합',
      univCount: 8,
      totalApplicants: 40808,
      passedApplicants: 19271,
      passRate: 47.2,
      dropRate: 52.8,
      minRateText: '강원대 33.6%',
      maxRateText: '한양대 66.0%',
      highlight: '지원자 절반 이상(52.8%)이 최저 미충족 탈락, 충족 시 합격 확률 2배 이상 급증'
    },
    {
      type: '논술위주',
      univCount: 18,
      totalApplicants: 239542,
      passedApplicants: 81981,
      passRate: 34.2,
      dropRate: 65.8,
      minRateText: '고려대 22.1%',
      maxRateText: '성신여대 61.1%',
      highlight: '지원자의 65.8%가 허수 탈락! 실질경쟁률이 명목경쟁률 대비 1/3 ~ 최대 1/11 수준으로 급락'
    }
  ],
  miracleHighlights: [
    {
      univ: '경희대학교',
      dept: '한의예과(인문) 논술',
      badge: '실질경쟁률 1/11 토막',
      initialRate: '434.8:1',
      passRate: '9.1%',
      realRate: '39.6:1',
      desc: '5명 모집에 2,174명이 지원(434.8:1)했으나 수능최저 충족자는 단 198명(9.1%)에 불과! 실질경쟁률이 39.6:1로 11배 급락한 역대급 사례.'
    },
    {
      univ: '동국대(WISE) & 가톨릭관동대',
      dept: '한의예·의예 기회균형',
      badge: '충족률 0.0% 전원합격',
      initialRate: '11~14:1',
      passRate: '0.0%',
      realRate: '0:1 (미달)',
      desc: '동국대(WISE) 한의예 기균, 가톨릭관동대 의예 지역기균 지원자 전원이 최저 미충족(0명 충족). 최저만 맞췄다면 내신 상관없이 100% 무조건 전원 합격!'
    },
    {
      univ: '고려대학교',
      dept: '논술전형 전체',
      badge: '77.9% 허수 탈락',
      initialRate: '64.9:1',
      passRate: '22.1%',
      realRate: '14.4:1',
      desc: '361명 모집에 23,421명이 지원했으나 최저 통과자는 5,182명(22.1%)뿐. 18,239명(77.9%)이 자동 탈락하여 실질 경쟁률 14.4:1로 5분의 1 수준 하락.'
    },
    {
      univ: '한양대학교',
      dept: '학생부교과(추천형)',
      badge: '합격선 0.18등급 하락',
      initialRate: '7.5:1',
      passRate: '69.3%',
      realRate: '5.2:1',
      desc: '수능최저(3합 7) 도입 후 49개 모집단위 평균 충족률 69.3%. 48곳 평균 합격 내신선이 약 0.18등급 하락하며 내신 역전 기회 실증.'
    }
  ]
}

// 2025~2026학년도 공식 발표 실측 데이터 및 4~6등급 공교육 특화 벤치마크
export const DEFAULT_CSAT_PASS_RATE_BENCHMARK = [
  // -------------------------------------------------------------
  // [1] ★ 4~6등급: 기적의 역전존 & 거점 국립대 & 충족률 0.0% 전원합격
  // -------------------------------------------------------------
  {
    univName: '동국대(WISE)',
    admissionType: '학생부교과(기회균형I 지역인재)',
    targetGradeBand: '4_6',
    dept: '한의예과',
    minScoreText: '3개 영역 등급 합 5 이내',
    initialRate: 11.0,
    passRate: 0.0,
    fillRate: 100,
    note: '★ [충족률 0.0%] 2025 지원자 전원 최저 미충족 탈락! 최저만 맞췄다면 100% 무조건 전원 합격'
  },
  {
    univName: '가톨릭관동대',
    admissionType: '학생부교과(지역기회균형)',
    targetGradeBand: '4_6',
    dept: '의학과(의예과)',
    minScoreText: '3개 영역 등급 합 5 이내',
    initialRate: 14.0,
    passRate: 0.0,
    fillRate: 100,
    note: '★ [충족률 0.0%] 2025 지원자 전원 최저 미충족 탈락! 최저 충족자 전원 합격 실증'
  },
  {
    univName: '강원대학교',
    admissionType: '학생부종합(일반/지역인재)',
    targetGradeBand: '4_6',
    dept: '인문·자연 계열',
    minScoreText: '2개 영역 등급 합 8 이내 (탐구 1)',
    initialRate: 5.7,
    passRate: 33.6,
    fillRate: 140,
    note: '2025 오피셜 충족률 33.6%(최저군)! 경쟁자의 66.4%가 자동 탈락하여 실질 경쟁률 1.9:1로 급락'
  },
  {
    univName: '경기대학교',
    admissionType: '학생부교과(교과성적우수자)',
    targetGradeBand: '4_6',
    dept: '인문·자연 전체',
    minScoreText: '2개 영역 등급 합 7 이내 (한국사 4)',
    initialRate: 8.9,
    passRate: 38.5,
    fillRate: 155,
    note: '최저 미충족 탈락률 61.5%! 충원율 1.5바퀴 회전으로 체감 경쟁률 1.3:1 급락'
  },
  {
    univName: '가천대학교',
    admissionType: '학생부교과(학생부우수자)',
    targetGradeBand: '4_6',
    dept: '자연·공학계열',
    minScoreText: '2개 영역 등급 합 6 이내 (탐구 1과목)',
    initialRate: 11.2,
    passRate: 42.0,
    fillRate: 180,
    note: '인기 대학이지만 실질 경쟁률 4.7:1, 충원율 반영 시 1.68:1로 합격 문턱 대폭 완화'
  },
  {
    univName: '인천대학교',
    admissionType: '학생부교과(교과성적우수자)',
    targetGradeBand: '4_6',
    dept: '인문·자연계열',
    minScoreText: '2개 영역 등급 합 7 이내',
    initialRate: 7.8,
    passRate: 45.0,
    fillRate: 140,
    note: '국립 인천대, 실질 경쟁률 3.5:1로 떨어지며 4등급대 합격자 다수 발생'
  },
  {
    univName: '수원대학교',
    admissionType: '학생부교과(교과우수전형)',
    targetGradeBand: '4_6',
    dept: '인문·공학계열',
    minScoreText: '2개 영역 등급 합 8 이내 (영어/사탐 가능)',
    initialRate: 6.8,
    passRate: 32.0,
    fillRate: 210,
    note: '충원율 2.1바퀴! 실질 2.18:1 ÷ 3.1 = 체감 0.7:1 (사실상 전원합격 펑크)'
  },
  {
    univName: '강남대학교',
    admissionType: '학생부교과(학교생활우수자)',
    targetGradeBand: '4_6',
    dept: '인문사회·ICT',
    minScoreText: '1개 영역 4등급 이내 (영어 가능)',
    initialRate: 5.9,
    passRate: 48.0,
    fillRate: 160,
    note: '영어 또는 사탐 1과목 4등급만 맞추면 체감 경쟁률 1.09:1로 급락'
  },
  {
    univName: '안양대학교',
    admissionType: '학생부교과(교과우수)',
    targetGradeBand: '4_6',
    dept: '전 모집단위',
    minScoreText: '1개 영역 3등급 또는 2합 8 이내',
    initialRate: 6.2,
    passRate: 40.0,
    fillRate: 190,
    note: '실질 경쟁률 2.48:1, 충원 2바퀴 합산 시 체감 경쟁률 0.86:1 (전원합격권)'
  },
  {
    univName: '충남·충북대학교',
    admissionType: '학생부교과(일반전형)',
    targetGradeBand: '4_6',
    dept: '인문·자연·농생명',
    minScoreText: '2개 영역 등급 합 7~8 이내',
    initialRate: 6.4,
    passRate: 39.0,
    fillRate: 125,
    note: '지거국 4등급 합격선 형성의 핵심 요인은 최저 미충족 탈락(61%)'
  },
  {
    univName: '한양대학교(ERICA)',
    admissionType: '학생부교과(지역균형)',
    targetGradeBand: '4_6',
    dept: '공학·소프트웨어',
    minScoreText: '2개 영역 등급 합 6 이내 (탐구 1)',
    initialRate: 9.4,
    passRate: 36.0,
    fillRate: 130,
    note: '수도권 최선호 공학, 외형 9.4:1이지만 실질 경쟁률 3.38:1로 완화'
  },

  // -------------------------------------------------------------
  // [2] 3~4등급: 수도권 & 인서울 안정 (2025 공식 실측)
  // -------------------------------------------------------------
  {
    univName: '한국외국어대학교',
    admissionType: '학생부교과(학교장추천)',
    targetGradeBand: '3_4',
    dept: '인문·글로벌',
    minScoreText: '2개 영역 등급 합 4 이내 (탐구 1)',
    initialRate: 7.2,
    passRate: 55.8,
    fillRate: 135,
    note: '2025 공식: 지원 2,008명 중 충족 1,121명(55.8%), 실질 경쟁률 4.02:1로 완화'
  },
  {
    univName: '숭실대학교',
    admissionType: '학생부교과(학생부우수자)',
    targetGradeBand: '3_4',
    dept: '인문·자연',
    minScoreText: '2개 영역 등급 합 5 이내',
    initialRate: 8.1,
    passRate: 59.4,
    fillRate: 145,
    note: '2025 공식: 지원 4,861명 중 충족 2,886명(59.4%), 실질 경쟁률 4.81:1'
  },
  {
    univName: '아주대학교',
    admissionType: '학생부교과(고교추천)',
    targetGradeBand: '3_4',
    dept: '자연·공학·인문',
    minScoreText: '2개 영역 등급 합 5 이내',
    initialRate: 7.4,
    passRate: 51.0,
    fillRate: 140,
    note: '2025 공식: 지원 2,540명 중 충족 1,295명(51.0%), 충족률이 낮아 실질 3.77:1 급감'
  },
  {
    univName: '성신여자대학교',
    admissionType: '학생부교과(지역균형)',
    targetGradeBand: '3_4',
    dept: '인문·사회·자연',
    minScoreText: '2개 영역 등급 합 7 이내 (탐구 1)',
    initialRate: 6.8,
    passRate: 80.7,
    fillRate: 130,
    note: '2025 공식: 교과 26개 대학 중 최고 충족률 80.7% (최저 기준 완화 반영)'
  },
  {
    univName: '국민대학교',
    admissionType: '학생부교과(교과성적우수자)',
    targetGradeBand: '3_4',
    dept: '인문·자연',
    minScoreText: '2개 영역 등급 합 5~6 이내',
    initialRate: 8.8,
    passRate: 48.0,
    fillRate: 145,
    note: '실질 4.22:1, 충원율 반영 시 1.72:1로 합격 가능성 급상승'
  },
  {
    univName: '홍익대학교',
    admissionType: '학생부교과(학교장추천)',
    targetGradeBand: '3_4',
    dept: '인문·자연',
    minScoreText: '3개 영역 등급 합 7~8 이내',
    initialRate: 9.6,
    passRate: 41.0,
    fillRate: 130,
    note: '인서울 대학 중 최저 기준이 높아 최저 통과율 41.0%에 불과, 실질 3.94:1'
  },

  // -------------------------------------------------------------
  // [3] 1~2등급: 인서울 최상위 & 의약학계열 승부 (2025 공식 실측)
  // -------------------------------------------------------------
  {
    univName: '고려대학교',
    admissionType: '학생부교과(학교추천)',
    targetGradeBand: '1_2',
    dept: '인문·자연 전체',
    minScoreText: '3개 영역 등급 합 7 이내 (한국사 4)',
    initialRate: 6.9,
    passRate: 70.0,
    fillRate: 125,
    note: '2025 공식: 학교추천 충족률 70.0% (실질경쟁률 4.84:1), 교과 전체 61.3%(5,944명 중 3,644명)'
  },
  {
    univName: '고려대학교',
    admissionType: '학생부종합(학업우수전형)',
    targetGradeBand: '1_2',
    dept: '인문·자연 전체',
    minScoreText: '4개 영역 등급 합 8 이내 (탐구 1)',
    initialRate: 16.6,
    passRate: 40.4,
    fillRate: 95,
    note: '2025 공식: 학업우수 충족률 40.4% (실질경쟁률 6.70:1, 지원자의 약 60%가 자동 탈락!)'
  },
  {
    univName: '연세대학교',
    admissionType: '학생부교과(추천형)',
    targetGradeBand: '1_2',
    dept: '인문계열',
    minScoreText: '국수 중 1개 포함 2합 4 (영어 3)',
    initialRate: 6.2,
    passRate: 67.7,
    fillRate: 130,
    note: '2025 공식 발표: 연세대 인문계열 충족률 67.7% (전체 4,409명 중 2,861명 64.9%)'
  },
  {
    univName: '연세대학교',
    admissionType: '학생부교과(추천형)',
    targetGradeBand: '1_2',
    dept: '자연계열',
    minScoreText: '수(미/기) 포함 2합 5 (영어 3)',
    initialRate: 6.8,
    passRate: 75.7,
    fillRate: 140,
    note: '2025 공식 발표: 연세대 자연계열 충족률 75.7% (수학 역량 기반 높은 충족)'
  },
  {
    univName: '연세대학교',
    admissionType: '학생부교과(추천형)',
    targetGradeBand: '1_2',
    dept: '의예과',
    minScoreText: '국수(미/기) 1등급 2개 이상 (영어 3)',
    initialRate: 10.5,
    passRate: 53.3,
    fillRate: 110,
    note: '2025 공식 발표: 연세대 의예과 충족률 53.3% (지원자 절반 탈락)'
  },
  {
    univName: '경희대학교',
    admissionType: '학생부교과(지역균형)',
    targetGradeBand: '1_2',
    dept: '인문·자연 전체',
    minScoreText: '2개 영역 등급 합 5 이내 (탐구 1)',
    initialRate: 8.2,
    passRate: 63.8,
    fillRate: 155,
    note: '2025 공식 발표: 지역균형 충족률 63.8% (실질경쟁률 5.22:1), 전체 3,174명 중 1,976명 충족'
  },
  {
    univName: '경희대학교',
    admissionType: '학생부종합(네오르네상스 의예과)',
    targetGradeBand: '1_2',
    dept: '의예과 (의약학계열)',
    minScoreText: '3개 영역 등급 합 4 이내 + 한국사 5 (과탐 2평균)',
    initialRate: 18.5,
    passRate: 69.7,
    fillRate: 80,
    note: '2025 공식: 1단계 합격 109명 중 최저 충족 76명(69.7%), 까다로운 최저로 30% 탈락'
  },
  {
    univName: '한양대학교',
    admissionType: '학생부교과(추천형)',
    targetGradeBand: '1_2',
    dept: '전 모집단위 (49곳)',
    minScoreText: '3개 영역 등급 합 7 이내',
    initialRate: 7.5,
    passRate: 69.3,
    fillRate: 140,
    note: '2025 공식: 49개 모집단위 평균 충족률 69.3%. 최저 도입 후 48곳 평균 약 0.18등급 합격선 하락!'
  },
  {
    univName: '한양대학교',
    admissionType: '학생부종합(추천형/서류형)',
    targetGradeBand: '1_2',
    dept: '인문·자연',
    minScoreText: '3개 영역 등급 합 7 이내',
    initialRate: 15.2,
    passRate: 66.0,
    fillRate: 110,
    note: '2025 공식: 종합 8개 대학 중 최고 충족률 66.0%'
  },
  {
    univName: '가톨릭대학교',
    admissionType: '학생부교과(지역균형 의예과)',
    targetGradeBand: '1_2',
    dept: '의예과',
    minScoreText: '4개 영역 등급 합 5 이내 + 한국사 4 (과탐 2평균)',
    initialRate: 12.5,
    passRate: 48.0,
    fillRate: 120,
    note: '2025 공식: 지원 75명 중 최저 충족 36명(48.00%), 지원자의 52%가 최저 미충족 탈락'
  },
  {
    univName: '가톨릭대학교',
    admissionType: '학생부교과(지역균형 약학과)',
    targetGradeBand: '1_2',
    dept: '약학과',
    minScoreText: '3개 영역 등급 합 5 이내 (과탐 1)',
    initialRate: 14.8,
    passRate: 60.0,
    fillRate: 130,
    note: '2025 공식: 지원 25명 중 최저 충족 15명(60.00%), 실질경쟁률 8.88:1로 완화'
  },
  {
    univName: '서강대학교',
    admissionType: '학생부교과(지역균형)',
    targetGradeBand: '1_2',
    dept: '전 계열',
    minScoreText: '3개 영역 각 3등급 이내 (한국사 4)',
    initialRate: 10.2,
    passRate: 68.1,
    fillRate: 140,
    note: '2025 공식: 지원 2,678명 중 충족 1,823명(68.1%), 완화된 최저 기준'
  },
  {
    univName: '중앙대학교',
    admissionType: '학생부교과(지역균형)',
    targetGradeBand: '1_2',
    dept: '인문·자연',
    minScoreText: '3개 영역 등급 합 7 이내 (영어 1·2등급 인정)',
    initialRate: 8.7,
    passRate: 63.4,
    fillRate: 150,
    note: '2025 공식: 지원 4,505명 중 충족 2,856명(63.4%), 실질 경쟁률 5.52:1'
  },

  // -------------------------------------------------------------
  // [4] ★ 논술전형: 경쟁률 1/3 ~ 1/11 토막의 신화 (2025 공식 실측)
  // -------------------------------------------------------------
  {
    univName: '경희대학교',
    admissionType: '논술우수자(한의예과 인문)',
    targetGradeBand: 'essay',
    dept: '한의예과(인문)',
    minScoreText: '3개 영역 등급 합 4 이내 (국수영탐)',
    initialRate: 434.8,
    passRate: 9.1,
    fillRate: 20,
    note: '★ [경쟁률 1/11 토막] 5명 모집에 2,174명 지원(434.8:1)했으나 최저 충족자 단 198명(9.1%)! 실질경쟁률 39.6:1'
  },
  {
    univName: '고려대학교',
    admissionType: '논술전형',
    targetGradeBand: 'essay',
    dept: '전체 (경영·인문·자연)',
    minScoreText: '4개 영역 등급 합 8 이내 (경영은 4합 5)',
    initialRate: 64.9,
    passRate: 22.1,
    fillRate: 35,
    note: '★ 2025 공식: 361명 모집 23,421명 중 충족 5,182명(22.1%)! 77.9%가 허수로 실질경쟁률 14.4:1(1/5 수준) 급락'
  },
  {
    univName: '중앙대학교',
    admissionType: '논술전형',
    targetGradeBand: 'essay',
    dept: '인문·자연',
    minScoreText: '3개 영역 등급 합 6 이내',
    initialRate: 52.8,
    passRate: 22.3,
    fillRate: 30,
    note: '2025 공식: 지원 36,119명 중 충족 8,054명(22.3%), 실질 경쟁률 11.77:1로 4.5배 완화'
  },
  {
    univName: '경희대학교',
    admissionType: '논술우수자전형',
    targetGradeBand: 'essay',
    dept: '인문·자연·자율전공',
    minScoreText: '2개 영역 등급 합 5 이내 (탐구 1)',
    initialRate: 57.7,
    passRate: 31.9,
    fillRate: 35,
    note: '2025 공식 발표: 지원 24,049명 중 충족률 31.9% (원서접수 57.72:1 → 실질 18.42:1)'
  },
  {
    univName: '한국외국어대학교',
    admissionType: '논술전형',
    targetGradeBand: 'essay',
    dept: '인문·사회',
    minScoreText: '2개 영역 등급 합 4 이내',
    initialRate: 38.6,
    passRate: 25.3,
    fillRate: 30,
    note: '2025 공식: 지원 15,773명 중 충족 3,995명(25.3%), 실질 경쟁률 9.77:1'
  },
  {
    univName: '동국대학교',
    admissionType: '논술전형',
    targetGradeBand: 'essay',
    dept: '인문·자연',
    minScoreText: '2개 영역 등급 합 5 이내',
    initialRate: 51.2,
    passRate: 29.2,
    fillRate: 35,
    note: '2025 공식: 지원 14,749명 중 충족 4,310명(29.2%), 실질 경쟁률 14.95:1'
  },
  {
    univName: '성균관대학교',
    admissionType: '논술우수자',
    targetGradeBand: 'essay',
    dept: '인문·자연',
    minScoreText: '3개 영역 등급 합 6 이내',
    initialRate: 45.3,
    passRate: 36.2,
    fillRate: 35,
    note: '2025 공식: 지원 41,613명 중 충족 15,061명(36.2%), 실질 16.4:1'
  },
  {
    univName: '아주대학교',
    admissionType: '논술전형',
    targetGradeBand: 'essay',
    dept: '자연·의학',
    minScoreText: '의예 4합 6, 일반 2합 5',
    initialRate: 34.2,
    passRate: 52.6,
    fillRate: 25,
    note: '2025 공식: 지원 6,889명 중 충족 3,623명(52.6%), 실질 17.99:1'
  },
  {
    univName: '건국대학교',
    admissionType: '논술(KU논술우수자)',
    targetGradeBand: 'essay',
    dept: '인문·자연',
    minScoreText: '2개 영역 등급 합 5 이내',
    initialRate: 46.8,
    passRate: 60.3,
    fillRate: 30,
    note: '2025 공식: 지원 22,644명 중 충족 13,651명(60.3%), 실질 28.22:1'
  },
  {
    univName: '성신여자대학교',
    admissionType: '논술우수자',
    targetGradeBand: 'essay',
    dept: '인문·자연',
    minScoreText: '2개 영역 등급 합 7 이내',
    initialRate: 28.5,
    passRate: 61.1,
    fillRate: 25,
    note: '2025 공식: 논술 18개 대학 중 최고 충족률 61.1%'
  }
]

const csatPassRateCache = new Map()

/**
 * 구글 스프레드시트의 '수능최저충족률' 탭 데이터를 비동기 로드
 * (시트 데이터가 있을 경우 우선 적용하며, 기본 벤치마크와 융합 반환)
 */
export async function fetchCsatPassRateTable(sheetId = null, forceRefresh = false) {
  const targetSheetId = sheetId ? extractSheetId(sheetId) : await getKcueSheetId()
  const cacheKey = `csat_pass_rate_${targetSheetId}`

  if (!forceRefresh && csatPassRateCache.has(cacheKey)) {
    return csatPassRateCache.get(cacheKey)
  }

  const tabName = '수능최저충족률'
  const gvizUrl = buildSheetTabGvizUrl(targetSheetId, tabName)

  try {
    const res = await fetch(gvizUrl)
    if (!res.ok) {
      console.log(`[fetchCsatPassRateTable] '${tabName}' 탭 원격 로드 불가 -> 기본 벤치마크 데이터 활용`)
      return DEFAULT_CSAT_PASS_RATE_BENCHMARK
    }

    const text = await res.text()
    if (!text || text.includes('google-signin') || text.includes('accounts.google.com')) {
      return DEFAULT_CSAT_PASS_RATE_BENCHMARK
    }

    const wb = XLSX.read(text, { type: 'string' })
    const sheetName = wb.SheetNames[0]
    if (!sheetName) return DEFAULT_CSAT_PASS_RATE_BENCHMARK

    const sheet = wb.Sheets[sheetName]
    const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 })
    if (!rawRows || rawRows.length < 2) return DEFAULT_CSAT_PASS_RATE_BENCHMARK

    const headerRow = rawRows[0] || []
    const colIdx = {
      univName: headerRow.findIndex(h => String(h).includes('대학')),
      admissionType: headerRow.findIndex(h => String(h).includes('전형')),
      dept: headerRow.findIndex(h => String(h).includes('모집') || String(h).includes('계열') || String(h).includes('학과')),
      minScoreText: headerRow.findIndex(h => String(h).includes('최저기준') || String(h).includes('수능최저')),
      initialRate: headerRow.findIndex(h => String(h).includes('최초') || String(h).includes('경쟁률')),
      passRate: headerRow.findIndex(h => String(h).includes('충족률') || String(h).includes('통과율')),
      fillRate: headerRow.findIndex(h => String(h).includes('충원') || String(h).includes('추합')),
      note: headerRow.findIndex(h => String(h).includes('비고') || String(h).includes('특징') || String(h).includes('설명'))
    }

    const parseNum = (val, fallback = 0) => {
      if (val === undefined || val === null || val === '') return fallback
      const clean = String(val).replace(/[^0-9.-]/g, '')
      const n = parseFloat(clean)
      return !isNaN(n) ? n : fallback
    }

    const parsedSheetRecords = []
    for (let r = 1; r < rawRows.length; r++) {
      const row = rawRows[r]
      if (!row || row.length === 0) continue

      const univName = String(row[colIdx.univName !== -1 ? colIdx.univName : 1] || '').trim()
      if (!univName) continue

      const initialRate = parseNum(row[colIdx.initialRate !== -1 ? colIdx.initialRate : 5], 6.0)
      const passRate = parseNum(row[colIdx.passRate !== -1 ? colIdx.passRate : 6], 40.0)
      const fillRate = parseNum(row[colIdx.fillRate !== -1 ? colIdx.fillRate : 7], 120.0)

      // 등급대 자동 분류 판정
      let targetGradeBand = '4_6'
      if (initialRate >= 9.0 || passRate >= 55) {
        targetGradeBand = '1_2'
      } else if (initialRate >= 7.5 || passRate >= 45) {
        targetGradeBand = '3_4'
      }

      parsedSheetRecords.push({
        univName,
        admissionType: String(row[colIdx.admissionType !== -1 ? colIdx.admissionType : 2] || '학생부교과').trim(),
        targetGradeBand,
        dept: String(row[colIdx.dept !== -1 ? colIdx.dept : 3] || '전체').trim(),
        minScoreText: String(row[colIdx.minScoreText !== -1 ? colIdx.minScoreText : 4] || '수능최저 반영').trim(),
        initialRate,
        passRate,
        fillRate,
        note: String(row[colIdx.note !== -1 ? colIdx.note : 8] || '시트 실데이터 연동').trim(),
        isFromSheet: true
      })
    }

    // 시트 데이터가 있으면 시트 데이터를 우선하고 기본 벤치마크와 합침
    const combined = parsedSheetRecords.length > 0 
      ? [...parsedSheetRecords, ...DEFAULT_CSAT_PASS_RATE_BENCHMARK.filter(b => !parsedSheetRecords.some(s => s.univName === b.univName))]
      : DEFAULT_CSAT_PASS_RATE_BENCHMARK

    csatPassRateCache.set(cacheKey, combined)
    return combined
  } catch (err) {
    console.warn(`[fetchCsatPassRateTable] 오류 발생, 기본 벤치마크 적용:`, err)
    return DEFAULT_CSAT_PASS_RATE_BENCHMARK
  }
}
