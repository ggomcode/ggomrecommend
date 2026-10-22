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
export async function fetchAndParseKcueMockData(sheetId = null, tabName = '2027가채점', customPassword = null) {
  const cleanId = sheetId ? extractSheetId(sheetId) : await getKcueSheetId()
  if (!cleanId) throw new Error('구글 시트 ID가 설정되지 않았습니다.')

  const password = customPassword || getStatSessionPassword()
  const csvText = await fetchKcueSheetTabCsv(cleanId, tabName)
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

    const name = getVal('이름', '성명', '학생명')
    if (!name) continue

    const classNum = getVal('반', '학급') || ''
    const studentNum = getVal('번호', '출석번호') || ''
    const examName = getVal('시험명', '회차', '모의고사', '월', '구분') || tabName
    const mathSubject = getVal('수학', '수학선택', '수학과목', '선택_수학') || ''
    const inquiry1 = getVal('탐구1', '선택과목1', '탐구과목1', '사탐/과탐1', '제1선택', '탐구1과목') || ''
    const inquiry2 = getVal('탐구2', '선택과목2', '탐구과목2', '사탐/과탐2', '제2선택', '탐구2과목') || ''

    records.push({
      examName,
      name,
      classNum,
      studentNum,
      studentKey: `${classNum}-${studentNum}_${name}`,
      mathSubject,
      inquiry1,
      inquiry2,
      rawRow: rowData || {}
    })
  }

  return records
}



