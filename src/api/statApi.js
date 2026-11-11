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
export const DEFAULT_KCUE_SHEET_ID = '1hkgi-WKdbh_cIK1Ctzv3BBxqKLe50DCKAT8cmT9wbWg'

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
export const STANDARD_KCUE_YEARS = ['2028', '2027', '2026', '2025', '2024', '2023']

export const STANDARD_KCUE_TABS = [
  { key: '기본통계', year: '전체', type: '기본통계', category: 'basic', label: '학년도별 기본통계 (3학년 학생수·학급수)', isDefault: false },
  { key: '2027수시', year: '2027', type: '수시', category: 'susi', label: '2027학년도 수시 지원 원자료', isDefault: true },
  { key: '2026수시', year: '2026', type: '수시', category: 'susi', label: '2026학년도 수시 지원 원자료' },
  { key: '2025수시', year: '2025', type: '수시', category: 'susi', label: '2025학년도 수시 지원 원자료' },
  { key: '2027정시', year: '2027', type: '정시', category: 'jungsi', label: '2027학년도 정시 지원 원자료' },
  { key: '2026정시', year: '2026', type: '정시', category: 'jungsi', label: '2026학년도 정시 지원 원자료' },
  { key: '2025정시', year: '2025', type: '정시', category: 'jungsi', label: '2025학년도 정시 지원 원자료' },
  { key: '2027모의결과', year: '2027', type: '모의결과', category: 'mock', label: '2027학년도 모의고사 결과 원자료 (성적일람표 확정)', isDefault: false },
  { key: '2027모의가채점', year: '2027', type: '가채점', category: 'mock', label: '2027학년도 가채점 원자료 (모의고사)', isDefault: false },
  { key: '2027가채점', year: '2027', type: '가채점', category: 'mock', label: '2027학년도 가채점 원자료 (모의고사)', isDefault: false },
  { key: '진급명렬', year: '전체', type: '진급명렬', category: 'promotion', label: '신학년도 진급명렬 (학생 학적 및 성적 이관)', isDefault: false },
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
export function buildSheetWebUrl(sheetId = null, gid = null) {
  const cleanId = sheetId ? extractSheetId(sheetId) : DEFAULT_KCUE_SHEET_ID
  const hash = gid ? `#gid=${gid}` : ''
  return `https://docs.google.com/spreadsheets/d/${cleanId}/edit${hash}`
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

export const KCUE_GAS_URL_KEY = 'google_sheet_kcue_gas_url'

/**
 * 대교협 및 모의고사 성적 실시간 쓰기 연동용 GAS Web App URL 조회
 */
export async function getKcueGasUrl() {
  const cached = localStorage.getItem(`pcm_${KCUE_GAS_URL_KEY}`) || localStorage.getItem('ggom_master_gas_webapp_url')
  let gasUrl = cached ? cached.trim() : ''

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('config')
        .select('value')
        .eq('key', KCUE_GAS_URL_KEY)
        .maybeSingle()

      if (!error && data && data.value != null && String(data.value).trim()) {
        gasUrl = String(data.value).trim()
        localStorage.setItem(`pcm_${KCUE_GAS_URL_KEY}`, gasUrl)
        localStorage.setItem('ggom_master_gas_webapp_url', gasUrl)
      }
    } catch (_) {}
  }

  return gasUrl
}

/**
 * 대교협 및 모의고사 성적 실시간 쓰기 연동용 GAS Web App URL 저장
 */
export async function saveKcueGasUrl(url) {
  const cleanUrl = (url || '').trim()
  if (supabase) {
    const { error } = await supabase
      .from('config')
      .upsert({ key: KCUE_GAS_URL_KEY, value: cleanUrl }, { onConflict: 'key' })
    if (error) throw error
  }
  if (cleanUrl) {
    localStorage.setItem(`pcm_${KCUE_GAS_URL_KEY}`, cleanUrl)
    localStorage.setItem('ggom_master_gas_webapp_url', cleanUrl)
  } else {
    localStorage.removeItem(`pcm_${KCUE_GAS_URL_KEY}`)
    localStorage.removeItem('ggom_master_gas_webapp_url')
  }
  return cleanUrl
}

/**
 * Apps Script Web App URL 마스킹 헬퍼 (배포 ID 앞 4글자, 뒤 4글자 노출)
 * 예: https://script.google.com/macros/s/AKfy••••••••cdef/exec
 */
export function maskGasUrl(url) {
  if (!url) return ''
  const trimmed = String(url).trim()
  const match = trimmed.match(/^(https?:\/\/script\.google\.com\/macros\/s\/)([a-zA-Z0-9_-]+)(\/exec.*)?$/i)
  if (match) {
    const prefix = match[1]
    const id = match[2]
    const suffix = match[3] || '/exec'
    if (id.length <= 8) {
      return `${prefix}••••••••${suffix}`
    }
    const head = id.slice(0, 4)
    const tail = id.slice(-4)
    return `${prefix}${head}••••••••${tail}${suffix}`
  }
  if (trimmed.length > 20) {
    return trimmed.slice(0, 10) + '••••••••' + trimmed.slice(-6)
  }
  return trimmed
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

export const DEFAULT_KNOWN_TABS = [
  '2027수시',
  '2026수시',
  '2025수시',
  '2027모의결과',
  '2027모의가채점',
  '2027모의등급컷',
  '2027수능최저',
  '수능최저충족률',
  '기본통계',
  '진급명렬'
]

function getStoredTabs(cleanId) {
  try {
    const raw = localStorage.getItem(`pcm_actual_sheet_tabs_${cleanId}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (_) {}
  return null
}

function saveStoredTabs(cleanId, tabs) {
  try {
    if (Array.isArray(tabs) && tabs.length > 0) {
      localStorage.setItem(`pcm_actual_sheet_tabs_${cleanId}`, JSON.stringify(tabs))
    }
  } catch (_) {}
}

let cachedActualTabs = null
let cachedActualTabsTime = 0

/**
 * 타임아웃(기본 4초)이 적용된 fetch 헬퍼 (무한 로딩 및 네트워크 대기 방지)
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 4000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    return res
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 구글 스프레드시트에 실제로 존재하는 시트 탭(Sheet Names) 목록 조회
 * (XLSX export 엔드포인트를 통해 실제 탭 목록을 파악하여 허수 탭 접근 차단)
 * - 로컬 캐시(localStorage / in-memory) 및 기본 알려진 탭으로 즉각 반환 (무한 대기 및 AbortError 방지)
 * - forceReload 시에만 XLSX 엔드포인트를 적정 타임아웃(15초)과 bookSheets: true 초고속 모드로 조회하여 캐시 갱신
 */
export async function getActualGoogleSheetTabs(sheetId, forceReload = false) {
  const cleanId = extractSheetId(sheetId)
  if (!cleanId) return [...DEFAULT_KNOWN_TABS]

  const now = Date.now()

  // 1. 메모리 캐시 확인 (5분 이내 유효)
  if (!forceReload && cachedActualTabs && (now - cachedActualTabsTime < 300000)) {
    return cachedActualTabs
  }

  // 2. localStorage 영구 캐시 확인
  const stored = getStoredTabs(cleanId)
  if (!forceReload && stored && stored.length > 0) {
    cachedActualTabs = stored
    cachedActualTabsTime = now
    return cachedActualTabs
  }

  // 3. forceReload가 아닐 때는 컴포넌트 마운트 및 렌더링 블로킹을 차단하기 위해 즉시 반환
  if (!forceReload) {
    const fallback = stored || [...DEFAULT_KNOWN_TABS]
    cachedActualTabs = fallback
    cachedActualTabsTime = now
    return fallback
  }

  // 4. forceReload 시 실제 구글 시트 XLSX export로 백그라운드 갱신 시도
  try {
    const url = `https://docs.google.com/spreadsheets/d/${cleanId}/export?format=xlsx&_t=${now}`
    const res = await fetchWithTimeout(url, {}, 15000)
    if (res.ok) {
      const buffer = await res.arrayBuffer()
      // bookSheets: true 옵션으로 셀 파싱을 건너뛰고 탭 이름만 수 ms 내 초고속 추출
      const wb = XLSX.read(buffer, { type: 'buffer', bookSheets: true })
      if (wb && Array.isArray(wb.SheetNames) && wb.SheetNames.length > 0) {
        cachedActualTabs = wb.SheetNames
        cachedActualTabsTime = now
        saveStoredTabs(cleanId, wb.SheetNames)
        return cachedActualTabs
      }
    }
  } catch (err) {
    console.warn('[statApi] Failed to fetch actual sheet tabs via xlsx (using cached/fallback):', err.message || err)
  }

  // 네트워크 실패 시 기존 캐시 또는 저장소 또는 기본 탭으로 안전하게 복구 (절대 빈 배열 반환으로 화면을 깨뜨리지 않음)
  const safeFallback = cachedActualTabs || stored || [...DEFAULT_KNOWN_TABS]
  cachedActualTabs = safeFallback
  cachedActualTabsTime = now
  return safeFallback
}

/**
 * 특정 시트 탭의 CSV 내용 비동기 가져오기
 */
export async function fetchKcueSheetTabCsv(sheetId, tabName) {
  const cleanId = extractSheetId(sheetId)
  if (!cleanId) {
    throw new Error('유효한 구글 시트 ID가 설정되지 않았습니다.')
  }
  const url = `${buildSheetTabGvizUrl(cleanId, tabName)}&_t=${Date.now()}`
  
  const res = await fetchWithTimeout(url, {}, 6000)
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
    const actualTabs = await getActualGoogleSheetTabs(sheetId, false)
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
    const lines = csv.trim().split(/\r?\r\n/)
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
  
  // 1. A열(0-index: 0), FA열(157번째, 0-index: 156), DA열(105번째, 0-index: 104), CA열(79번째, 0-index: 78) 또는 'encrypted_data' 헤더 열 확인
  let encColIdx = rawHeaders.findIndex(h => String(h || '').trim() === 'encrypted_data')
  if (encColIdx === -1) {
    for (const cIdx of [0, 156, 104, 78]) {
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

  // 3. CE:DR 매칭 열(2027: CM=90, 2026: CW=100, 2025: DC=106) 동적 인덱스 탐색
  const findMatchingColIdx = (yr, typePattern, fallbackIdx) => {
    const yrShort = yr.slice(2)
    const idx = rawHeaders.findIndex(h => {
      const s = String(h || '').replace(/[\r\n\s]+/g, '')
      return (s.includes(yr) || s.includes(yrShort)) && typePattern.test(s)
    })
    return idx !== -1 ? idx : fallbackIdx
  }

  const col2027Rate = findMatchingColIdx('2027', /경쟁/, 90)
  const col2027Quota = findMatchingColIdx('2027', /모집|정원/, 86)
  const col2027App = findMatchingColIdx('2027', /지원|접수/, 88)

  const col2026Rate = findMatchingColIdx('2026', /경쟁/, 100)
  const col2026Quota = findMatchingColIdx('2026', /모집|정원/, 98)
  const col2026App = findMatchingColIdx('2026', /지원|접수/, 99)

  const col2025Rate = findMatchingColIdx('2025', /경쟁/, 106)
  const col2025Quota = findMatchingColIdx('2025', /모집|정원/, 104)
  const col2025App = findMatchingColIdx('2025', /지원|접수/, 105)

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

    // 경쟁률 수치 파싱 헬퍼 (CM: 숫자 "8.5", CW/DC: "5.25 : 1" 등 모든 형태 지원)
    const parseRateVal = (val) => {
      if (val === null || val === undefined || val === '') return null
      if (typeof val === 'number') {
        return isNaN(val) ? null : parseFloat(val.toFixed(2))
      }
      const str = String(val).trim()
      if (str === '자료없음' || str === '-' || str === '미매칭' || str === 'N/A' || str === '') return null
      // "5.25 : 1" 또는 "5.25:1" 또는 순수 숫자 "8.5"
      const match = str.match(/([0-9]+(?:\.[0-9]+)?)/)
      if (match) {
        const n = parseFloat(match[1])
        return isNaN(n) ? null : parseFloat(n.toFixed(2))
      }
      return null
    }

    // 물리적 열 인덱스(CE:DR 구간 CM=90, CW=100, DC=106) 또는 헤더명으로 값 추출
    const getColOrKeyVal = (colIdx, ...keys) => {
      // 1) keys로 getVal 시도 (rowData 또는 colMap)
      const namedVal = getVal(...keys)
      if (namedVal !== '' && namedVal !== null && namedVal !== undefined) return namedVal

      // 2) rawHeaders의 해당 인덱스 헤더명으로 rowData 조회
      const headerNameAtCol = rawHeaders && rawHeaders[colIdx] ? rawHeaders[colIdx] : null
      if (headerNameAtCol && rowData) {
        if (rowData[headerNameAtCol] !== undefined && rowData[headerNameAtCol] !== null && rowData[headerNameAtCol] !== '') {
          return rowData[headerNameAtCol]
        }
        const cleanH = String(headerNameAtCol).replace(/[\r\n\s]+/g, '')
        for (const k of Object.keys(rowData)) {
          if (k.replace(/[\r\n\s]+/g, '') === cleanH) {
            const v = rowData[k]
            if (v !== undefined && v !== null && v !== '') return v
          }
        }
      }

      // 3) rowData의 인덱스 키 조회 (객체가 인덱스 번호로 매핑된 경우)
      if (rowData) {
        if (rowData[colIdx] !== undefined && rowData[colIdx] !== null && rowData[colIdx] !== '') return rowData[colIdx]
        if (rowData[String(colIdx)] !== undefined && rowData[String(colIdx)] !== null && rowData[String(colIdx)] !== '') return rowData[String(colIdx)]
      }

      // 4) 원본 행 배열 r의 물리적 열 인덱스 (가장 확실함)
      if (r && r[colIdx] !== undefined && r[colIdx] !== null && r[colIdx] !== '') {
        return r[colIdx]
      }

      return ''
    }

    // 경쟁률 자동 연산 헬퍼 (직접 수치 파싱 우선 -> 미파싱 시 지원인원/모집인원으로 산출)
    const calcRate = (rawVal, quotaVal, appVal) => {
      let r = parseRateVal(rawVal)
      if (r !== null) return r
      const q = parseFloat(String(quotaVal || '').replace(/[^0-9.]/g, ''))
      const a = parseFloat(String(appVal || '').replace(/[^0-9.]/g, ''))
      if (q > 0 && a >= 0) {
        return parseFloat((a / q).toFixed(2))
      }
      return null
    }

    // [CE:DR 매칭 열 기준]
    // 2027: CI=86 (모집), CK=88 (지원), CM=90 (2027경쟁률 - 숫자만 존재)
    // 2026: CU=98 (모집), CV=99 (지원), CW=100 (2026경쟁률 - '5.25 : 1' 형식)
    // 2025: DA=104 (모집), DB=105 (지원), DC=106 (2025경쟁률 - '5.25 : 1' 형식)
    // 2024: DG=110 (모집), DH=111 (지원), DI=112 (2024경쟁률)
    const rawRate2027 = getColOrKeyVal(col2027Rate, '[2027_매칭]경쟁률(수치)', '[2027_매칭]경쟁률(표시용)', '[2027_매칭]경쟁률', '2027경쟁률', '27경쟁률', '경쟁률(2027)', '2027_경쟁률', '2027 수시 경쟁률') || getColOrKeyVal(89, '[2027_매칭]경쟁률(표시용)')
    const rawRate2026 = getColOrKeyVal(col2026Rate, '[2026_매칭]경쟁률(수치)', '[2026_매칭]경쟁률(표시용)', '[2026_매칭]경쟁률', '2026경쟁률', '26경쟁률', '경쟁률(2026)', '2026_경쟁률')
    const rawRate2025 = getColOrKeyVal(col2025Rate, '[2025_매칭]경쟁률(수치)', '[2025_매칭]경쟁률(표시용)', '[2025_매칭]경쟁률', '2025경쟁률', '25경쟁률', '경쟁률(2025)', '2025_경쟁률')
    const rawRate2024 = getColOrKeyVal(112, '[2024_매칭]경쟁률(수치)', '[2024_매칭]경쟁률(표시용)', '[2024_매칭]경쟁률', '2024경쟁률', '24경쟁률', '경쟁률(2024)', '2024_경쟁률')
    const rawRate2023 = getColOrKeyVal(118, '[2023_매칭]경쟁률(수치)', '[2023_매칭]경쟁률(표시용)', '[2023_매칭]경쟁률', '2023경쟁률', '23경쟁률', '경쟁률(2023)', '2023_경쟁률')

    const quota2027 = getColOrKeyVal(col2027Quota, '[2027_매칭]모집인원(표시용)', '[2027_매칭]모집인원(합산용)', '[2027_매칭]모집인원', '2027모집인원', '27모집인원', '모집인원(2027)')
    const app2027 = getColOrKeyVal(col2027App, '[2027_매칭]지원인원', '2027지원인원', '27지원인원', '지원인원(2027)')

    const quota2026 = getColOrKeyVal(col2026Quota, '[2026_매칭]모집인원(표시용)', '[2026_매칭]모집인원', '2026모집인원', '26모집인원', '모집인원(2026)')
    const app2026 = getColOrKeyVal(col2026App, '[2026_매칭]지원인원', '2026지원인원', '26지원인원', '지원인원(2026)')

    const quota2025 = getColOrKeyVal(col2025Quota, '[2025_매칭]모집인원(표시용)', '[2025_매칭]모집인원', '2025모집인원', '25모집인원', '모집인원(2025)')
    const app2025 = getColOrKeyVal(col2025App, '[2025_매칭]지원인원', '2025지원인원', '25지원인원', '지원인원(2025)')

    const quota2024 = getColOrKeyVal(110, '[2024_매칭]모집인원(표시용)', '[2024_매칭]모집인원', '2024모집인원', '24모집인원', '모집인원(2024)')
    const app2024 = getColOrKeyVal(111, '[2024_매칭]지원인원', '2024지원인원', '24지원인원', '지원인원(2024)')

    const quota2023 = getColOrKeyVal(116, '[2023_매칭]모집인원(표시용)', '[2023_매칭]모집인원', '2023모집인원', '23모집인원', '모집인원(2023)')
    const app2023 = getColOrKeyVal(117, '[2023_매칭]지원인원', '2023지원인원', '23지원인원', '지원인원(2023)')

    const formatRawRate = (val, rate) => {
      if (val !== null && val !== undefined && val !== '') {
        const s = String(val).trim()
        if (s.includes(':')) return s.replace(/\s+/g, '')
        return `${s}:1`
      }
      return rate !== null ? `${rate}:1` : ''
    }

    const r2025 = calcRate(rawRate2025, quota2025, app2025)
    const r2026 = calcRate(rawRate2026, quota2026, app2026)
    const r2027 = calcRate(rawRate2027, quota2027, app2027)

    const competitionRates = {
      '2023': {
        quota: quota2023,
        applicants: app2023,
        rate: calcRate(rawRate2023, quota2023, app2023),
        raw: formatRawRate(rawRate2023, calcRate(rawRate2023, quota2023, app2023))
      },
      '2024': {
        quota: quota2024,
        applicants: app2024,
        rate: calcRate(rawRate2024, quota2024, app2024),
        raw: formatRawRate(rawRate2024, calcRate(rawRate2024, quota2024, app2024))
      },
      '2025': {
        quota: quota2025,
        applicants: app2025,
        rate: r2025,
        raw: formatRawRate(rawRate2025, r2025)
      },
      '2026': {
        quota: quota2026,
        applicants: app2026,
        rate: r2026,
        raw: formatRawRate(rawRate2026, r2026)
      },
      '2027': {
        quota: quota2027,
        applicants: app2027,
        rate: r2027,
        raw: formatRawRate(rawRate2027, r2027)
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
      competitionRates,
      csatKorSubject: String(getVal('국어(과목)', '국어 (과목)')).trim(),
      csatKorGrade: getNum('국어(등급)', '국어 (등급)'),
      csatMathSubject: String(getVal('수학(과목)', '수학 (과목)')).trim(),
      csatMathGrade: getNum('수학(등급)', '수학 (등급)'),
      csatEngGrade: getNum('영어(등급)', '영어 (등급)', '수능영어', '수능 영어'),
      csatInq1Subject: String(getVal('탐구1(과목)', '탐구1 (과목)')).trim(),
      csatInq1Grade: getNum('탐구1(등급)', '탐구1 (등급)'),
      csatInq2Subject: String(getVal('탐구2(과목)', '탐구2 (과목)')).trim(),
      csatInq2Grade: getNum('탐구2(등급)', '탐구2 (등급)'),
      rawRow: rowData || {}
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
  
  // 실제 구글 스프레드시트에 존재하는 탭 목록 확인 (XLSX 목록이 확보된 경우에만 필터링)
  const actualTabs = await getActualGoogleSheetTabs(sheetId)
  if (actualTabs && actualTabs.length > 0 && !actualTabs.includes(tabName)) {
    console.log(`[statApi] 구글 시트에 '${tabName}' 탭이 아직 등록되지 않았습니다. 빈 데이터를 반환합니다.`)
    return []
  }

  try {
    const csv = await fetchKcueSheetTabCsv(sheetId, tabName)
    return parseKcueRows(csv, customPassword)
  } catch (err) {
    console.warn(`[statApi] '${tabName}' 탭 로드 실패:`, err)
    return []
  }
}

/**
 * 구글 시트의 암호화 상태 확인 및 입력된 비밀번호 검증
 * @param {string} sheetId 
 * @param {string} password 
 * @returns {Promise<{ success: boolean, isEncrypted: boolean, message?: string }>}
 */
const STAT_SAMPLE_CIPHER_KEY = 'pcm_stat_sample_cipher'
const STAT_NOT_ENCRYPTED_FLAG = '__NOT_ENCRYPTED__'
let memorySampleCipher = ''

/**
 * 구글 시트의 암호문 샘플 1개를 초고속으로 획득 (캐시 우선 & gviz limit 3 초경량 쿼리)
 * - 암호화된 시트: 암호문 샘플 문자열(U2FsdGVkX1...) 반환
 * - 암호화되지 않은 시트: 빈 문자열('') 반환
 */
export async function getStatSampleCipher(sheetId, forceReload = false) {
  const cleanId = extractSheetId(sheetId) || DEFAULT_KCUE_SHEET_ID
  if (!cleanId) return ''

  if (!forceReload) {
    if (memorySampleCipher) {
      return memorySampleCipher === STAT_NOT_ENCRYPTED_FLAG ? '' : memorySampleCipher
    }
    const sess = sessionStorage.getItem(`${STAT_SAMPLE_CIPHER_KEY}_${cleanId}`) || 
                 localStorage.getItem(`${STAT_SAMPLE_CIPHER_KEY}_${cleanId}`) ||
                 sessionStorage.getItem(STAT_SAMPLE_CIPHER_KEY) || 
                 localStorage.getItem(STAT_SAMPLE_CIPHER_KEY)
    if (sess) {
      if (sess === STAT_NOT_ENCRYPTED_FLAG) {
        memorySampleCipher = STAT_NOT_ENCRYPTED_FLAG
        return ''
      }
      if (typeof sess === 'string' && sess.startsWith('U2FsdGVkX1')) {
        memorySampleCipher = sess
        return sess
      }
      // 손상되거나 비정상적인 캐시([object Object] 등)는 자동 제거
      try {
        sessionStorage.removeItem(`${STAT_SAMPLE_CIPHER_KEY}_${cleanId}`)
        localStorage.removeItem(`${STAT_SAMPLE_CIPHER_KEY}_${cleanId}`)
        sessionStorage.removeItem(STAT_SAMPLE_CIPHER_KEY)
        localStorage.removeItem(STAT_SAMPLE_CIPHER_KEY)
      } catch (_) {}
    }
  }

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
        for (const cIdx of [0, 156, 104, 78]) {
          if (rawHeaders.length > cIdx && String(rows[1]?.[cIdx] || '').trim().startsWith('U2FsdGVkX1')) {
            encColIdx = cIdx
            break
          }
        }
        if (encColIdx === -1) {
          if (rawHeaders.length >= 157) {
            encColIdx = 156
          } else if (rawHeaders.length >= 105) {
            encColIdx = 104
          }
        }
      }

      let foundCipher = ''
      if (encColIdx !== -1) {
        for (let i = 1; i < rows.length; i++) {
          const val = String(rows[i]?.[encColIdx] || '').trim()
          if (val.startsWith('U2FsdGVkX1')) {
            foundCipher = val
            break
          }
        }
      }

      // 지정 열에 없을 경우 데이터 행 전체 열 fallback 탐색
      if (!foundCipher) {
        for (let i = 1; i < rows.length; i++) {
          const r = rows[i] || []
          for (let c = 0; c < r.length; c++) {
            const val = String(r[c] || '').trim()
            if (val.startsWith('U2FsdGVkX1')) {
              foundCipher = val
              break
            }
          }
          if (foundCipher) break
        }
      }

      if (foundCipher) {
        memorySampleCipher = foundCipher
        try {
          sessionStorage.setItem(`${STAT_SAMPLE_CIPHER_KEY}_${cleanId}`, foundCipher)
          localStorage.setItem(`${STAT_SAMPLE_CIPHER_KEY}_${cleanId}`, foundCipher)
          sessionStorage.setItem(STAT_SAMPLE_CIPHER_KEY, foundCipher)
          localStorage.setItem(STAT_SAMPLE_CIPHER_KEY, foundCipher)
        } catch (_) {}
        return foundCipher
      }
    } catch (e) {
      // 다음 후보 탭 시도
    }
  }

  // 암호화된 셀이 전혀 없는 시트인 경우 플래그 저장 후 빈 문자열 반환
  memorySampleCipher = STAT_NOT_ENCRYPTED_FLAG
  try {
    sessionStorage.setItem(`${STAT_SAMPLE_CIPHER_KEY}_${cleanId}`, STAT_NOT_ENCRYPTED_FLAG)
    localStorage.setItem(`${STAT_SAMPLE_CIPHER_KEY}_${cleanId}`, STAT_NOT_ENCRYPTED_FLAG)
  } catch (_) {}

  return ''
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

    // 시트에 암호화된 내용이 전혀 없는 경우 (기존 일반 평문 시트)
    if (!sampleCipher || typeof sampleCipher !== 'string' || !sampleCipher.trim() || !sampleCipher.startsWith('U2FsdGVkX1')) {
      return { success: true, isEncrypted: false, message: '암호화되지 않은 시트입니다.' }
    }

    // 암호문이 있는 경우: 비밀번호 검증
    if (!password || !password.trim()) {
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

/**
 * 모의고사 레코드에 실제 성적(원점수, 표준점수, 백분위, 등급 중 하나라도)이 존재하는지 판별하는 헬퍼
 * @param {Object} r 모의고사 레코드 객체
 * @returns {boolean}
 */
export function hasAnyMockScore(r) {
  if (!r) return false
  const isValid = (v) => v !== null && v !== undefined && String(v).trim() !== '' && String(v).trim() !== '-'
  return (
    isValid(r.korGrade) || isValid(r.korRawScore) || isValid(r.korStandardScore) || isValid(r.korPercentile) ||
    isValid(r.mathGrade) || isValid(r.mathRawScore) || isValid(r.mathStandardScore) || isValid(r.mathPercentile) ||
    isValid(r.engGrade) || isValid(r.engRawScore) || isValid(r.engStandardScore) || isValid(r.engPercentile) ||
    isValid(r.inq1Grade) || isValid(r.inq1RawScore) || isValid(r.inq1StandardScore) || isValid(r.inq1Percentile) ||
    isValid(r.inq2Grade) || isValid(r.inq2RawScore) || isValid(r.inq2StandardScore) || isValid(r.inq2Percentile) ||
    isValid(r.histGrade) || isValid(r.histRawScore) || isValid(r.histStandardScore) || isValid(r.histPercentile) ||
    isValid(r.secondLangGrade) || isValid(r.secondLangRawScore) || isValid(r.secondLangStandardScore) || isValid(r.secondLangPercentile)
  )
}

/**
 * 모의고사 결과(확정)와 가채점 데이터 스마트 병합
 * 규칙:
 * 1. 결과 시트에 해당 월(회차) 데이터가 있으면, 그 월은 가채점을 따르지 않고 결과 시트를 우선 근거로 분석.
 * 2. 단, 해당 월 모의고사에서 가채점에는 있는데 결과 시트에는 누락된 학생이 있다면,
 *    그 학생만 가채점 결과를 유지(Fallback).
 * 3. 결과 시트에 없는 월(회차)은 가채점 데이터를 사용하되 실제 성적이 있는 실응시자만 채택(결시 행 제외).
 */
export function smartMergeMockExamRecords(resultRecords = [], tentativeRecords = []) {
  const validResultRecords = (resultRecords || []).filter(hasAnyMockScore)
  const validTentativeRecords = (tentativeRecords || []).filter(hasAnyMockScore)

  if (!validResultRecords || validResultRecords.length === 0) return validTentativeRecords || []
  if (!validTentativeRecords || validTentativeRecords.length === 0) return validResultRecords || []

  // 1. 결과 시트에 존재하는 월(회차) 집합 (예: '6월', '10월' 등)
  const resultExamMonths = new Set()
  validResultRecords.forEach(r => {
    const m = String(r.examName || '').match(/([0-9]{1,2})\s*월/)
    if (m) {
      resultExamMonths.add(m[1])
    } else if (r.examName) {
      resultExamMonths.add(r.examName)
    }
  })

  // 2. 결과 시트에 존재하는 (월_학생키) 집합
  const resultSet = new Set()
  validResultRecords.forEach(r => {
    const m = String(r.examName || '').match(/([0-9]{1,2})\s*월/)
    const monthKey = m ? m[1] : r.examName
    resultSet.add(`${monthKey}_${r.studentKey}`)
  })

  // 3. 가채점 데이터에서 보완할 레코드 추출 (실응시자만)
  const fallbackRecords = []
  validTentativeRecords.forEach(tr => {
    const m = String(tr.examName || '').match(/([0-9]{1,2})\s*월/)
    const monthKey = m ? m[1] : tr.examName
    const hasMonthInResult = resultExamMonths.has(monthKey)

    if (!hasMonthInResult) {
      // 결과 시트에 전혀 없는 회차(월)는 가채점에서 실응시자 채택
      fallbackRecords.push(tr)
    } else {
      // 결과 시트가 이미 있는 회차이지만, 가채점에 실제 성적이 존재하는 누락 학생만 fallback
      const studentMonthKey = `${monthKey}_${tr.studentKey}`
      if (!resultSet.has(studentMonthKey)) {
        fallbackRecords.push({ ...tr, isFallbackFromTentative: true })
      }
    }
  })

  return [...validResultRecords, ...fallbackRecords]
}


const mockDataMemoryCache = new Map()

export async function fetchAndParseKcueMockData(sheetId = null, tabName = null, customPassword = null, forceReload = false, targetYear = null) {
  const cleanId = sheetId ? extractSheetId(sheetId) : await getKcueSheetId()
  if (!cleanId) throw new Error('구글 시트 ID가 설정되지 않았습니다.')

  const yearTag = targetYear ? String(targetYear) : 'all'
  const cacheKey = `${cleanId}_${tabName || yearTag}`
  if (!forceReload && mockDataMemoryCache.has(cacheKey)) {
    return mockDataMemoryCache.get(cacheKey)
  }

  // 만약 특정 탭이 지정된 경우 해당 탭만 단독 파싱
  if (tabName) {
    return await parseSingleMockTab(cleanId, tabName, customPassword)
  }

  const actualTabs = await getActualGoogleSheetTabs(cleanId)

  // 학년도가 지정된 경우 해당 연도 모의 탭 탐색, 미지정 시 전체 중 탐색
  const yr = targetYear ? String(targetYear) : ''
  const isMatchYear = (t) => !yr || t.includes(yr)

  // 1. 결과 탭(확정) 탐색: 예) '2027모의결과', '모의결과'
  const resultTab = actualTabs.find(t => isMatchYear(t) && (t.includes('모의결과') || (t.includes('모의') && t.includes('결과'))))
  // 2. 가채점 탭 탐색: 예) '2027모의가채점', '2027가채점', '모의가채점'
  const tentativeTab = actualTabs.find(t => isMatchYear(t) && (t.includes('가채점') || (t.includes('모의') && !t.includes('결과'))))

  let resultRecords = []
  if (resultTab) {
    try {
      resultRecords = await parseSingleMockTab(cleanId, resultTab, customPassword)
    } catch (e) {
      console.warn(`[statApi] ${resultTab} 로드 실패:`, e)
    }
  }

  let tentativeRecords = []
  if (tentativeTab) {
    try {
      tentativeRecords = await parseSingleMockTab(cleanId, tentativeTab, customPassword)
    } catch (e) {
      console.warn(`[statApi] ${tentativeTab} 로드 실패:`, e)
    }
  }

  if (resultRecords.length > 0 && tentativeRecords.length > 0) {
    const merged = smartMergeMockExamRecords(resultRecords, tentativeRecords)
    mockDataMemoryCache.set(cacheKey, merged)
    return merged
  }

  const finalRecords = resultRecords.length > 0 ? resultRecords : tentativeRecords
  mockDataMemoryCache.set(cacheKey, finalRecords)
  return finalRecords
}

async function parseSingleMockTab(cleanId, targetTab, customPassword = null) {
  if (!cleanId) throw new Error('구글 시트 ID가 설정되지 않았습니다.')
  if (!targetTab) return []

  const password = customPassword || getStatSessionPassword()
  const csvText = await fetchKcueSheetTabCsv(cleanId, targetTab)
  if (!csvText || typeof csvText !== 'string') return []

  const wb = XLSX.read(csvText, { type: 'string' })
  if (!wb.SheetNames || wb.SheetNames.length === 0) return []

  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 })
  if (!rows || rows.length < 2) return []

  const rawHeaders = rows[0] || []
  
  // A열(0-index: 0), CA열(79번째, 0-index: 78), encrypted_data 열 또는 U2FsdGVkX1 암호문 열 탐색
  let encColIdx = rawHeaders.findIndex(h => String(h || '').trim() === 'encrypted_data')
  if (encColIdx === -1) {
    for (const cIdx of [0, 78, 156, 104]) {
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

  // 44개 컬럼 표준 규격(A~AR열, 2027모의결과 등) 감지:
  // targetTab이 '모의결과'를 포함하거나, 열 수가 40열 이상이고 '월', '이름'이 있는 경우
  const isStandard44 = !isEncrypted && (
    targetTab.includes('모의결과') ||
    (rawHeaders.length >= 40 && (colMap['월'] !== undefined || colMap['월'] === 0) && colMap['이름'] !== undefined)
  )

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

    let name = ''
    let classNum = ''
    let studentNum = ''
    let grade = 3
    let monthOrder = null
    let examName = ''
    let rawMonth = ''
    let seriesNum = 1
    let korSubject = ''
    let korRawScore = ''
    let korStandardScore = ''
    let korPercentile = ''
    let korGrade = null
    let mathSubject = ''
    let mathRawScore = ''
    let mathStandardScore = ''
    let mathPercentile = ''
    let mathGrade = null
    let engRawScore = ''
    let engStandardScore = ''
    let engPercentile = ''
    let engGrade = null
    let inquiry1 = ''
    let inq1RawScore = ''
    let inq1StandardScore = ''
    let inq1Percentile = ''
    let inq1Grade = null
    let inquiry2 = ''
    let inq2RawScore = ''
    let inq2StandardScore = ''
    let inq2Percentile = ''
    let inq2Grade = null
    let histRawScore = ''
    let histStandardScore = ''
    let histPercentile = ''
    let histGrade = null
    let secondLangSubject = ''
    let secondLangRawScore = ''
    let secondLangStandardScore = ''
    let secondLangPercentile = ''
    let secondLangGrade = null

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

    if (isStandard44) {
      // 44개 컬럼 표준 규격 직접 인덱싱 파싱 (2027모의결과 탭 등)
      name = String(r[5] || '').trim()
      if (!name || name === '이름' || name === '성명') continue

      seriesNum = r[1] != null && r[1] !== '' ? Number(r[1]) : 1
      if (isNaN(seriesNum)) seriesNum = 1

      classNum = r[3] != null ? String(r[3]).trim() : ''
      studentNum = r[4] != null ? String(r[4]).trim() : ''
      grade = Number(r[2]) || 3

      rawMonth = r[0] != null ? String(r[0]).trim() : ''
      const mNum = parseInt(rawMonth.replace(/[^0-9]/g, ''), 10)
      if (!isNaN(mNum) && mNum >= 3 && mNum <= 11) {
        monthOrder = mNum
        const isMopyeong = [6, 9].includes(mNum)
        examName = `${mNum}월 ${isMopyeong ? '모평' : '학평'}`
      } else {
        examName = rawMonth || targetTab
      }

      korSubject = r[6] != null ? String(r[6]).trim() : ''
      korRawScore = r[9] != null && r[9] !== '' ? String(r[9]).trim() : ''
      korStandardScore = r[10] != null && r[10] !== '' ? String(r[10]).trim() : ''
      korPercentile = r[11] != null && r[11] !== '' ? String(r[11]).trim() : ''
      korGrade = parseGradeValue(r[12], 'KOR')

      mathSubject = r[13] != null ? String(r[13]).trim() : ''
      mathRawScore = r[16] != null && r[16] !== '' ? String(r[16]).trim() : ''
      mathStandardScore = r[17] != null && r[17] !== '' ? String(r[17]).trim() : ''
      mathPercentile = r[18] != null && r[18] !== '' ? String(r[18]).trim() : ''
      mathGrade = parseGradeValue(r[19], 'MATH')

      engRawScore = r[20] != null && r[20] !== '' ? String(r[20]).trim() : ''
      engStandardScore = r[21] != null && r[21] !== '' ? String(r[21]).trim() : ''
      engPercentile = r[22] != null && r[22] !== '' ? String(r[22]).trim() : ''
      engGrade = parseGradeValue(r[23], 'ENG')

      inquiry1 = r[25] != null ? String(r[25]).trim() : ''
      inq1RawScore = r[26] != null && r[26] !== '' ? String(r[26]).trim() : ''
      inq1StandardScore = r[27] != null && r[27] !== '' ? String(r[27]).trim() : ''
      inq1Percentile = r[28] != null && r[28] !== '' ? String(r[28]).trim() : ''
      inq1Grade = parseGradeValue(r[29], 'INQ')

      inquiry2 = r[30] != null ? String(r[30]).trim() : ''
      inq2RawScore = r[31] != null && r[31] !== '' ? String(r[31]).trim() : ''
      inq2StandardScore = r[32] != null && r[32] !== '' ? String(r[32]).trim() : ''
      inq2Percentile = r[33] != null && r[33] !== '' ? String(r[33]).trim() : ''
      inq2Grade = parseGradeValue(r[34], 'INQ')

      histRawScore = r[35] != null && r[35] !== '' ? String(r[35]).trim() : ''
      histStandardScore = r[36] != null && r[36] !== '' ? String(r[36]).trim() : ''
      histPercentile = r[37] != null && r[37] !== '' ? String(r[37]).trim() : ''
      histGrade = parseGradeValue(r[38], 'HIST')

      secondLangSubject = r[39] != null ? String(r[39]).trim() : ''
      secondLangRawScore = r[40] != null && r[40] !== '' ? String(r[40]).trim() : ''
      secondLangStandardScore = r[41] != null && r[41] !== '' ? String(r[41]).trim() : ''
      secondLangPercentile = r[42] != null && r[42] !== '' ? String(r[42]).trim() : ''
      secondLangGrade = parseGradeValue(r[43], 'NORMAL')
    } else {
      // 일반/가채점 탭 유연 파싱 (헤더명 매핑 방식)
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

      const getGradeNum = (keys, subjectType = 'NORMAL') => {
        for (const k of keys) {
          const v = getVal(k)
          const parsed = parseGradeValue(v, subjectType)
          if (parsed !== null) return parsed
        }

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

      name = getVal('이름', '성명', '학생명')
      if (!name || name === '이름' || name === '성명') continue

      seriesNum = Number(getVal('계열번호', '계열')) || 1
      if (isNaN(seriesNum)) seriesNum = 1

      classNum = getVal('반', '학급') || ''
      studentNum = getVal('번호', '출석번호') || ''
      rawMonth = getVal('월', '시행월', '회차') || (r && r[0] != null ? String(r[0]).trim() : '')
      examName = getVal('시험명', '회차', '모의고사', '월', '구분', '시험구분', '시험', '학평', '모의평가')
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

      const mMatch = examName.match(/(10|[3-9]|11)/)
      if (mMatch) {
        monthOrder = Number(mMatch[1])
      }

      korSubject = getVal(
        '국어(과목)', '국어(선택)', '국어선택', '국어과목', '선택_국어',
        '선택과목(국어)', '선택과목_국어', '국어선택과목', '국어_선택', '선택(국어)'
      ) || ''
      if (!korSubject) {
        const gukVal = getVal('국어', '국')
        if (gukVal && /화작|화법|언매|언어/.test(gukVal)) {
          korSubject = gukVal
        }
      }
      korRawScore = getVal('국어(원점수)', '국어원점수', '국어_원점수', '국어원점수총점', '원점수총점(국어)')
      korStandardScore = getVal('국어(표준점수)', '국어표준점수', '국어_표준점수', '국어(표점)', '국어표점')
      korPercentile = getVal('국어(백분위)', '국어백분위', '국어_백분위')

      mathSubject = getVal(
        '수학(과목)', '수학(선택)', '수학선택', '수학과목', '선택_수학',
        '선택과목(수학)', '선택과목_수학', '수학선택과목', '수학_선택', '선택(수학)'
      ) || ''
      if (!mathSubject) {
        const suVal = getVal('수학', '수')
        if (suVal && /미적|기하|확률|확통/.test(suVal)) {
          mathSubject = suVal
        }
      }
      mathRawScore = getVal('수학(원점수)', '수학원점수', '수학_원점수', '수학원점수총점', '원점수총점(수학)')
      mathStandardScore = getVal('수학(표준점수)', '수학표준점수', '수학_표준점수', '수학(표점)', '수학표점')
      mathPercentile = getVal('수학(백분위)', '수학백분위', '수학_백분위')

      engRawScore = getVal('영어(원점수)', '영어원점수', '영어_원점수')
      engStandardScore = getVal('영어(표준점수)', '영어표준점수', '영어_표준점수')
      engPercentile = getVal('영어(백분위)', '영어백분위', '영어_백분위')

      inquiry1 = getVal('탐구1(과목)', '탐구1', '선택과목1', '탐구과목1', '사탐/과탐1', '제1선택', '탐구1과목') || ''
      inq1RawScore = getVal('탐구1(원점수)', '탐구1원점수', '탐구1_원점수', '선택1_원점수')
      inq1StandardScore = getVal('탐구1(표준점수)', '탐구1표준점수', '탐구1_표준점수', '탐구1(표점)', '선택1_표준점수')
      inq1Percentile = getVal('탐구1(백분위)', '탐구1백분위', '탐구1_백분위', '선택1_백분위')

      inquiry2 = getVal('탐구2(과목)', '탐구2', '선택과목2', '탐구과목2', '사탐/과탐2', '제2선택', '탐구2과목') || ''
      inq2RawScore = getVal('탐구2(원점수)', '탐구2원점수', '탐구2_원점수', '선택2_원점수')
      inq2StandardScore = getVal('탐구2(표준점수)', '탐구2표준점수', '탐구2_표준점수', '탐구2(표점)', '선택2_표준점수')
      inq2Percentile = getVal('탐구2(백분위)', '탐구2백분위', '탐구2_백분위', '선택2_백분위')

      korGrade = getGradeNum([
        '국어(등급)', '국어등급', '국어_등급', '국어 등급', '국(등급)', '국등급',
        '국어(원점수)', '국어원점수', '국어_원점수', '국어(표준점수)', '국어(표점)', '국어(백분위)', '국어점수', '국어', '국'
      ], 'KOR')
      mathGrade = getGradeNum([
        '수학(등급)', '수학등급', '수학_등급', '수학 등급', '수(등급)', '수등급',
        '수학(원점수)', '수학원점수', '수학_원점수', '수학(표준점수)', '수학(표점)', '수학(백분위)', '수학점수', '수학', '수'
      ], 'MATH')
      engGrade = getGradeNum([
        '영어(등급)', '영어등급', '영어_등급', '영어 등급', '영(등급)', '영등급',
        '영어(원점수)', '영어원점수', '영어_원점수', '영어(표준점수)', '영어(표점)', '영어점수', '영어', '영'
      ], 'ENG')
      inq1Grade = getInqGrade(1)
      inq2Grade = getInqGrade(2)

      histRawScore = getVal('한국사(원점수)', '한국사원점수', '한국사_원점수')
      histStandardScore = getVal('한국사(표준점수)', '한국사표준점수')
      histPercentile = getVal('한국사(백분위)', '한국사백분위')
      histGrade = getGradeNum([
        '한국사(등급)', '한국사등급', '한국사_등급', '한국사 등급', '한(등급)', '한등급',
        '한국사(원점수)', '한국사원점수', '한국사(표준점수)', '한국사점수', '한국사'
      ], 'HIST')

      secondLangSubject = getVal('제2외국어(과목)', '제2외국어과목', '제2외국어', '제2외국어과목명')
      secondLangRawScore = getVal('제2외국어(원점수)', '제2외국어원점수')
      secondLangStandardScore = getVal('제2외국어(표준점수)', '제2외국어표준점수')
      secondLangPercentile = getVal('제2외국어(백분위)', '제2외국어백분위')
      secondLangGrade = getGradeNum([
        '제2외국어(등급)', '제2외국어등급', '제2외국어_등급', '제2외국어',
        '제2외국어(원점수)', '제2외국어(표준점수)'
      ], 'NORMAL')

      grade = Number(getVal('학년', '학년구분')) || (r && r[0] != null && [1, 2, 3].includes(Number(r[0])) ? Number(r[0]) : 3)
    }

    const rec = {
      grade,
      monthOrder: monthOrder || (parseInt(String(examName).replace(/[^0-9]/g, ''), 10) || null),
      examName,
      rawMonth: rawMonth || String(examName || ''),
      name,
      classNum,
      studentNum,
      seriesNum,
      studentKey: `${grade}-${classNum}-${studentNum}_${name}`,
      legacyStudentKey: `${classNum}-${studentNum}_${name}`,
      korSubject,
      korRawScore,
      korStandardScore,
      korPercentile,
      korGrade,
      mathSubject,
      mathRawScore,
      mathStandardScore,
      mathPercentile,
      mathGrade,
      engRawScore,
      engStandardScore,
      engPercentile,
      engGrade,
      inquiry1,
      inq1RawScore,
      inq1StandardScore,
      inq1Percentile,
      inq1Grade,
      inquiry2,
      inq2RawScore,
      inq2StandardScore,
      inq2Percentile,
      inq2Grade,
      histRawScore,
      histStandardScore,
      histPercentile,
      histGrade,
      secondLangSubject,
      secondLangRawScore,
      secondLangStandardScore,
      secondLangPercentile,
      secondLangGrade,
      rawRow: rowData || {}
    }

    if (hasAnyMockScore(rec)) {
      records.push(rec)
    }
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

    if (r.legacyStudentKey && r.legacyStudentKey !== key) {
      if (!map.has(r.legacyStudentKey)) {
        map.set(r.legacyStudentKey, [])
      }
      map.get(r.legacyStudentKey).push(r)
    }
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

/**
 * 구글 시트 '진급명렬' 탭 조회 및 복호화
 */
export async function fetchAndParsePromotionData(sheetId = null, customPassword = null) {
  const cleanId = sheetId ? extractSheetId(sheetId) : await getKcueSheetId()
  if (!cleanId) return []

  const actualTabs = await getActualGoogleSheetTabs(cleanId)
  const promoTab = actualTabs.find(t => t.includes('진급') || t.includes('진급명렬'))
  if (!promoTab) return []

  const password = customPassword || getStatSessionPassword()
  const csvText = await fetchKcueSheetTabCsv(cleanId, promoTab)
  if (!csvText || typeof csvText !== 'string') return []

  const wb = XLSX.read(csvText, { type: 'string' })
  if (!wb.SheetNames || wb.SheetNames.length === 0) return []

  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 })
  if (!rows || rows.length < 2) return []

  const rawHeaders = rows[0] || []
  let encColIdx = rawHeaders.findIndex(h => String(h || '').trim() === 'encrypted_data')
  if (encColIdx === -1) {
    for (const cIdx of [0, 156, 104, 78]) {
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
    if (h) colMap[String(h).replace(/[\r\n\s]+/g, '')] = idx
  })

  const records = []
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    if (!r || r.length === 0) continue

    let rowData = null
    if (isEncrypted) {
      const cipher = String(r[encColIdx] || '').trim()
      if (cipher) {
        const decryptedStr = decryptAES(cipher, password)
        if (decryptedStr) {
          try {
            rowData = JSON.parse(decryptedStr)
          } catch (e) {}
        }
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

    const prevYear = getVal('학년도', '이전학년도') || r[0] || '2026'
    const prevGrade = Number(getVal('학년', '이전학년') || r[1]) || 2
    const prevClass = String(getVal('반', '이전반') || r[2] || '').trim()
    const prevNum = Number(getVal('번호', '이전번호') || r[3]) || 0
    // E열(4)은 이전 이름, J열(9)은 '신이름' (개명자 및 헤더 중복 완벽 방어)
    const oldName = getVal('이전이름', '이전성명') || ((r && r[4]) ? String(r[4]).trim() : getVal('이름', '성명')) || ''
    const newName = getVal('신이름', '새이름', '신성명') || ((r && r[9]) ? String(r[9]).trim() : oldName) || oldName
    const name = oldName || newName

    const newYear = getVal('신학년도', '다음학년도') || r[5] || '2027'
    const newGrade = Number(getVal('신학년', '다음학년') || r[6]) || 3
    const newClass = String(getVal('신반', '다음반') || r[7] || '').trim()
    const newNum = Number(getVal('신번호', '다음번호') || r[8]) || 0

    if (name && prevClass && newClass) {
      records.push({
        prevYear,
        prevGrade,
        prevClass,
        prevNum,
        name: oldName,
        newName: newName,
        isRenamed: Boolean(oldName && newName && oldName !== newName),
        newYear,
        newGrade,
        newClass,
        newNum,
        oldStudentKey: `${prevClass}-${prevNum}_${oldName}`,
        newStudentKey: `${newClass}-${newNum}_${newName}`
      })
    }
  }

  return records
}
