import { ref, computed, reactive } from 'vue'
import { useAuthStore } from '../../stores/auth'
import rawAppsData from '../data/applications.json'
import { MULTI_YEAR_STATS, computeYearMultiYearStats } from '../data/multiYearStats.js'
import { 
  getKcueSheetId, 
  getKcueYearSheets, 
  DEFAULT_KCUE_YEAR_SHEETS, 
  fetchAndParseKcueYearData, 
  fetchBasicSchoolStats,
  STANDARD_KCUE_YEARS,
  getActualGoogleSheetTabs,
  getStatSessionPassword,
  clearStatSessionPassword,
  fetchAndParseKcueMockData,
  groupMockRecordsByStudent
} from '../../api/statApi.js'
import { supabase } from '../../utils/supabaseClient'
import officialStatsData from '../data/officialStats.json'
import * as XLSX from 'xlsx'

/**
 * 대입 학년도 자동 계산 규칙:
 * 오늘 날짜가 3월 1일 ~ 이듬해 2월 말일이면 다음 연도 대입학년도로 계산 (최소 2027학년도 보장)
 * 예: 2026년 3월 1일 ~ 2027년 2월 28일 -> '2027'학년도 대입
 */
export function getCurrentAcademicYear(date = new Date()) {
  const y = date.getFullYear()
  const m = date.getMonth() + 1 // 1 ~ 12
  const calc = m >= 3 ? y + 1 : y
  return String(Math.max(calc, 2027))
}

/**
 * 모집시기 및 대학구분 필터 옵션
 */
export const SCOPE_OPTIONS = [
  { value: 'ALL', label: '전체(수시+정시)', period: 'ALL', schoolType: 'ALL' },
  { value: 'SUSI_ALL', label: '수시 전체', period: '수시', schoolType: 'ALL' },
  { value: 'JUNGSI_ALL', label: '정시 전체', period: '정시', schoolType: 'ALL' },
  { value: 'SUSI_UNIV', label: '수시 일반대', period: '수시', schoolType: '일반대' },
  { value: 'JUNGSI_UNIV', label: '정시 일반대', period: '정시', schoolType: '일반대' },
  { value: 'SUSI_COLLEGE', label: '수시 전문대', period: '수시', schoolType: '전문대' },
  { value: 'JUNGSI_COLLEGE', label: '정시 전문대', period: '정시', schoolType: '전문대' }
]

// Global state
export const applications = ref(rawAppsData)
const officialStats = ref(officialStatsData)

// 학생별 모의고사 성적 전역 상태 (2027모의가채점 탭 연계)
export const mockExamRecords = ref([])
export const studentMockExamsMap = ref(new Map())
export const isLoadingMockExams = ref(false)

// 수능최저 시트(2027수능최저, 2028수능최저) 전역 상태
export const csatMinScoreTable = ref([])
export const isLoadingCsatMinScore = ref(false)
export const loadedCsatMinScoreYear = ref('')

/**
 * 구글 시트 '{year}수능최저' 탭의 정규화 데이터를 비동기 로드
 */
export async function loadCsatMinScoreData(year = '2027', forceReload = false) {
  if (!forceReload && csatMinScoreTable.value.length > 0 && loadedCsatMinScoreYear.value === year) {
    return csatMinScoreTable.value
  }
  isLoadingCsatMinScore.value = true
  try {
    const sheetId = await getKcueSheetId()
    const { fetchCsatMinScoreTable } = await import('../../api/statApi.js')
    const records = await fetchCsatMinScoreTable(sheetId, year, forceReload)
    if (records && records.length > 0) {
      csatMinScoreTable.value = records
      loadedCsatMinScoreYear.value = year
      console.log(`[useStatData] '${year}수능최저' 데이터 ${records.length}건 로드 완료`)
    }
    return records
  } catch (err) {
    console.warn(`[useStatData] '${year}수능최저' 데이터 로드 실패:`, err)
    return []
  } finally {
    isLoadingCsatMinScore.value = false
  }
}

/**
 * 구글 시트 '2027모의가채점' 탭의 모의고사 성적 데이터를 비동기 로드 및 복호화
 */
export async function loadMockExamData(forceReload = false) {
  if (!forceReload && mockExamRecords.value.length > 0) {
    return mockExamRecords.value
  }
  isLoadingMockExams.value = true
  try {
    const sheetId = await getKcueSheetId()
    const records = await fetchAndParseKcueMockData(sheetId)
    if (records && records.length > 0) {
      mockExamRecords.value = records
      studentMockExamsMap.value = groupMockRecordsByStudent(records)
      console.log(`[useStatData] 모의고사 성적 ${records.length}건 로드 완료 (학생수: ${studentMockExamsMap.value.size}명)`)
    }
    return records
  } catch (err) {
    console.warn('[useStatData] 모의고사 성적 로드 실패:', err)
    return []
  } finally {
    isLoadingMockExams.value = false
  }
}

// Academic Year State & Multi-Year Sheet Management
const savedYear = localStorage.getItem('pcm_stat_selected_year')
const initialYear = STANDARD_KCUE_YEARS.includes(savedYear) ? savedYear : '2027'
const selectedAcademicYear = ref(initialYear)
if (savedYear !== initialYear) {
  localStorage.setItem('pcm_stat_selected_year', initialYear)
}

const selectedScope = ref(localStorage.getItem('pcm_stat_selected_scope') || 'SUSI_ALL')
const availableAcademicYears = ref([...STANDARD_KCUE_YEARS])
const kcueYearSheets = ref({ ...DEFAULT_KCUE_YEAR_SHEETS })

// 연도 및 시기별 인메모리 캐시 (예: '2027_수시', '2026_수시', '2027_정시')
const yearlyApplicationsCache = ref({})
const isLoadingYearData = ref(false)
const yearDataError = ref(null)
const basicSchoolStats = ref({})

// 5개년 반응형 통계 상태 및 사용자 동기화 영구 저장소
const reactiveMultiYearStats = reactive(JSON.parse(JSON.stringify(MULTI_YEAR_STATS)))
const LOCAL_STORAGE_MULTI_YEAR_KEY = 'pcm_multi_year_custom_stats_v3'
const SUPABASE_MULTI_YEAR_CONFIG_KEY = 'multi_year_custom_stats_v3'

function applyMultiYearMerge(parsed) {
  if (!parsed || typeof parsed !== 'object') return
  if (parsed.byYear) {
    Object.keys(parsed.byYear).forEach(y => {
      if (reactiveMultiYearStats.byYear[y]) {
        reactiveMultiYearStats.byYear[y] = {
          ...reactiveMultiYearStats.byYear[y],
          ...parsed.byYear[y]
        }
      }
    })
  }
  if (Array.isArray(parsed.targetUnivComparison)) {
    parsed.targetUnivComparison.forEach(pTarget => {
      let targetName = pTarget.groupName
      if (targetName === '설·포·연·고' || targetName === '설포연고') targetName = '설·카·포·연·고'
      if (targetName === '5대 과기원') targetName = '과기원'

      const found = reactiveMultiYearStats.targetUnivComparison.find(t => t.groupName === targetName)
      if (found) {
        found.data = { ...found.data, ...pTarget.data }
        found.avgGrade = { ...found.avgGrade, ...pTarget.avgGrade }
      }
    })
  }
}

// 로컬 스토리지에 캐시된 5개년 커스텀 통계 우선 로드
try {
  const localCached = localStorage.getItem(LOCAL_STORAGE_MULTI_YEAR_KEY)
  if (localCached) {
    applyMultiYearMerge(JSON.parse(localCached))
  }
} catch (e) {
  console.warn('Failed to parse local multi-year stats:', e)
}

// 2027년도 기본 원자료 기반 5개년 통계 자동 보정 (의치한약수 1건, 설카포연고, 과기원 정합성 보장)
try {
  const init2027 = computeYearMultiYearStats('2027', rawAppsData, 334)
  if (init2027) {
    reactiveMultiYearStats.byYear['2027'] = {
      ...reactiveMultiYearStats.byYear['2027'],
      ...init2027
    }
    reactiveMultiYearStats.targetUnivComparison.forEach(t => {
      if (init2027.targetUnivSummary && init2027.targetUnivSummary[t.groupName]) {
        t.data['2027'] = init2027.targetUnivSummary[t.groupName].count
        t.avgGrade['2027'] = init2027.targetUnivSummary[t.groupName].avgGrade
      }
    })
  }
} catch (e) {
  console.warn('Failed to compute initial 2027 multi-year stats:', e)
}

// Supabase config에 등록된 5개년 통계 로드
async function loadRemoteMultiYearStats() {
  if (!supabase) return
  try {
    const { data, error } = await supabase
      .from('config')
      .select('value')
      .eq('key', SUPABASE_MULTI_YEAR_CONFIG_KEY)
      .maybeSingle()
    if (!error && data?.value) {
      const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value
      applyMultiYearMerge(parsed)
      localStorage.setItem(LOCAL_STORAGE_MULTI_YEAR_KEY, JSON.stringify({
        byYear: reactiveMultiYearStats.byYear,
        targetUnivComparison: reactiveMultiYearStats.targetUnivComparison
      }))
    }
  } catch (e) {
    console.warn('Failed to load remote multi-year stats from Supabase:', e)
  }
}

async function saveMultiYearStats() {
  const payload = {
    byYear: reactiveMultiYearStats.byYear,
    targetUnivComparison: reactiveMultiYearStats.targetUnivComparison
  }
  const strPayload = JSON.stringify(payload)
  try {
    localStorage.setItem(LOCAL_STORAGE_MULTI_YEAR_KEY, strPayload)
  } catch (e) {
    console.warn('Failed to save to localStorage:', e)
  }

  if (supabase) {
    try {
      await supabase
        .from('config')
        .upsert({ key: SUPABASE_MULTI_YEAR_CONFIG_KEY, value: strPayload }, { onConflict: 'key' })
    } catch (e) {
      console.warn('Failed to save multi-year stats to Supabase:', e)
    }
  }
}

// 공식 통계 요약 헬퍼: 구글 시트 '기본통계' 탭의 3학년 학생 수를 우선 반영
function updateOfficialStats(strYear, appsList) {
  const basic = basicSchoolStats.value?.[strYear]
  const yData = reactiveMultiYearStats.byYear[strYear]
  // 기본통계 시트 값 우선, 없으면 reactiveMultiYearStats 또는 기본값 334
  const baselineTotalStudents = basic?.totalStudents || yData?.totalStudents || 334

  if (appsList && appsList.length > 0) {
    const studentKeys = new Set(appsList.map(a => a.studentKey))
    const totalApps = appsList.length
    const applicantStudents = studentKeys.size
    const metroApps = appsList.filter(a => a.isMetro).length
    const metroRate = totalApps > 0 ? Number(((metroApps / totalApps) * 100).toFixed(1)) : 0
    const applicantRate = baselineTotalStudents > 0 
      ? Number(((applicantStudents / baselineTotalStudents) * 100).toFixed(1))
      : 0

    officialStats.value = {
      ...officialStatsData,
      academicYear: Number(strYear),
      totalStudents: baselineTotalStudents, // 항상 3학년 재학생 총원! (334 등)
      applicantStudents: applicantStudents, // 실제 원서접수 학생 수 (246 등)
      applicantRate: applicantRate,
      totalApplications: totalApps,
      avgApplicationsPerStudent: applicantStudents > 0 ? Number((totalApps / applicantStudents).toFixed(1)) : 0,
      metroBreakdown: {
        metro: { count: metroApps, rate: metroRate },
        nonMetro: { count: totalApps - metroApps, rate: Number((100 - metroRate).toFixed(1)) },
        total: totalApps
      }
    }
  } else {
    officialStats.value = null
  }
}

/**
 * 특정 연도와 모집시기의 데이터 로드 (캐시 우선)
 */
async function loadPeriodData(year, period = '수시', forceReload = false) {
  const strYear = String(year)
  const cacheKey = `${strYear}_${period}`
  const hasPassword = !!getStatSessionPassword()

  if (!forceReload && yearlyApplicationsCache.value[cacheKey] && yearlyApplicationsCache.value[cacheKey].length > 0) {
    if (!(hasPassword && yearlyApplicationsCache.value[cacheKey] === rawAppsData)) {
      return yearlyApplicationsCache.value[cacheKey]
    }
  }

  // 2027 수시 기본값 fallback (비밀번호가 전혀 없는 순수 데모 상태일 때만 사용)
  if (strYear === '2027' && period === '수시' && !forceReload && !hasPassword) {
    yearlyApplicationsCache.value[cacheKey] = rawAppsData
    return rawAppsData
  }

  const sheetId = await getKcueSheetId()
  try {
    const loaded = await fetchAndParseKcueYearData(sheetId, strYear, period)
    if (loaded && loaded.length > 0) {
      yearlyApplicationsCache.value[cacheKey] = loaded
      return loaded
    }
    // 구글 시트에 데이터가 없고 비밀번호도 없는 경우 fallback
    if (strYear === '2027' && period === '수시' && !hasPassword) {
      yearlyApplicationsCache.value[cacheKey] = rawAppsData
      return rawAppsData
    }
    return []
  } catch (e) {
    console.warn(`[useStatData] Failed to load ${strYear}${period} tab:`, e)
    if (strYear === '2027' && period === '수시' && !hasPassword) {
      yearlyApplicationsCache.value[cacheKey] = rawAppsData
      return rawAppsData
    }
    return []
  }
}

/**
 * 학년도 및 스코프(모집시기/대학구분) 동시 적용 및 데이터 갱신
 */
async function applyYearAndScope(year, scope, forceReload = false) {
  const strYear = String(year)
  selectedAcademicYear.value = strYear
  selectedScope.value = scope
  localStorage.setItem('pcm_stat_selected_year', strYear)
  localStorage.setItem('pcm_stat_selected_scope', scope)
  yearDataError.value = null

  isLoadingYearData.value = true
  try {
    // 1. 구글 시트의 '기본통계' 탭(학년도별 3학년 재학생 총원 및 학급 수) 로드
    if (forceReload || Object.keys(basicSchoolStats.value).length === 0) {
      const sheetId = await getKcueSheetId()
      const basic = await fetchBasicSchoolStats(sheetId, forceReload)
      if (basic && typeof basic === 'object') {
        basicSchoolStats.value = basic
      }
    }

    let combined = []
    if (scope === 'ALL') {
      const susiApps = await loadPeriodData(strYear, '수시', forceReload)
      const jungsiApps = await loadPeriodData(strYear, '정시', forceReload)
      combined = [...susiApps, ...jungsiApps]
    } else if (scope.startsWith('JUNGSI')) {
      combined = await loadPeriodData(strYear, '정시', forceReload)
    } else {
      // SUSI_*
      combined = await loadPeriodData(strYear, '수시', forceReload)
    }

    applications.value = combined
    updateOfficialStats(strYear, combined)

    if (combined.length === 0) {
      const periodLabel = scope.startsWith('JUNGSI') ? '정시' : '수시'
      yearDataError.value = `구글 스프레드시트에 '${strYear}${periodLabel}' 탭이 없거나 데이터가 비어 있습니다.`
    }
  } catch (e) {
    console.warn(`[useStatData] applyYearAndScope failed:`, e)
    yearDataError.value = e.message || '데이터를 불러오는 중 오류가 발생했습니다.'
  } finally {
    isLoadingYearData.value = false
  }
}

async function setAcademicYear(year, forceReload = false) {
  await applyYearAndScope(year, selectedScope.value, forceReload)
}

async function setScope(scope) {
  await applyYearAndScope(selectedAcademicYear.value, scope, false)
}

async function initYearSheets() {
  try {
    const sheetId = await getKcueSheetId()
    const basic = await fetchBasicSchoolStats(sheetId)
    if (basic && typeof basic === 'object') {
      basicSchoolStats.value = basic
    }

    const sheets = await getKcueYearSheets()
    if (sheets && typeof sheets === 'object') {
      kcueYearSheets.value = sheets
      const years = Object.keys(sheets).sort((a, b) => Number(b) - Number(a))
      if (years.length > 0) {
        availableAcademicYears.value = years
      }
    }
    // 원격 Supabase 및 캐시 5개년 통계 로드
    await loadRemoteMultiYearStats()

    // 초기 로드 실행
    await applyYearAndScope(selectedAcademicYear.value, selectedScope.value)
  } catch (e) {
    console.warn('Failed to load KCUE year sheets in useStatData:', e)
  }
}
initYearSheets()

/**
 * 특정 학년도의 구글 시트 원자료를 읽어와 5개년 비교 통계에 자동 집계 및 등록
 * @param {string|number} year 대상 학년도 (예: '2025')
 * @param {boolean} forceReload 강제 재조회 여부
 */
async function generateMultiYearStatsForYear(year, forceReload = true) {
  const strYear = String(year)
  const sheetId = await getKcueSheetId()
  if (!sheetId) {
    throw new Error('대교협 구글 스프레드시트 ID가 설정되지 않았습니다.')
  }

  // 1. 구글 시트에 실제 탭이 존재하는지 확인
  const actualTabs = await getActualGoogleSheetTabs(sheetId, forceReload)
  const tabName = `${strYear}수시`
  if (!actualTabs.includes(tabName)) {
    throw new Error(`구글 스프레드시트에 '${tabName}' 탭이 등록되지 않았습니다. 시트에 탭을 먼저 생성해 주세요.`)
  }

  // 2. 기본통계 로드 (3학년 학생 수)
  if (forceReload || Object.keys(basicSchoolStats.value).length === 0) {
    const basic = await fetchBasicSchoolStats(sheetId, forceReload)
    if (basic && typeof basic === 'object') {
      basicSchoolStats.value = basic
    }
  }

  // 3. 해당 연도 수시 원자료 가져오기
  const rows = await fetchAndParseKcueYearData(sheetId, strYear, '수시')
  if (!rows || rows.length === 0) {
    throw new Error(`'${tabName}' 탭에서 유효한 수시 지원 원자료를 찾을 수 없습니다. (데이터 비어있음)`)
  }

  // 4. 통계 계산
  const totalStudents = basicSchoolStats.value?.[strYear]?.totalStudents || null
  const computedStats = computeYearMultiYearStats(strYear, rows, totalStudents)
  if (!computedStats) {
    throw new Error(`'${tabName}' 통계 계산에 실패했습니다.`)
  }

  // 5. reactiveMultiYearStats에 적용
  reactiveMultiYearStats.byYear[strYear] = {
    ...(reactiveMultiYearStats.byYear[strYear] || {}),
    ...computedStats
  }

  // 대학군 비교 표 업데이트
  reactiveMultiYearStats.targetUnivComparison.forEach(t => {
    if (computedStats.targetUnivSummary && computedStats.targetUnivSummary[t.groupName]) {
      t.data[strYear] = computedStats.targetUnivSummary[t.groupName].count
      t.avgGrade[strYear] = computedStats.targetUnivSummary[t.groupName].avgGrade
    }
  })

  // 6. 영구 저장
  await saveMultiYearStats()

  return {
    success: true,
    year: strYear,
    totalApplications: computedStats.totalApplications,
    applicantStudents: computedStats.applicantStudents,
    avgGrade: computedStats.avgGrade
  }
}

/**
 * 구글 시트에 존재하는 모든 수시 탭을 자동 감지하여 5개년 통계에 일괄 생성/동기화
 */
async function syncAllAvailableSheetYears() {
  const sheetId = await getKcueSheetId()
  if (!sheetId) throw new Error('대교협 구글 스프레드시트 ID가 설정되지 않았습니다.')
  const actualTabs = await getActualGoogleSheetTabs(sheetId, true)

  const matchedYears = []
  for (const tab of actualTabs) {
    const m = tab.match(/^(\d{4})수시$/)
    if (m && reactiveMultiYearStats.years.includes(m[1])) {
      matchedYears.push(m[1])
    }
  }

  if (matchedYears.length === 0) {
    throw new Error('구글 시트에서 수시 원자료 탭(예: 2026수시, 2027수시)을 찾을 수 없습니다.')
  }

  const results = []
  for (const y of matchedYears) {
    try {
      const res = await generateMultiYearStatsForYear(y, true)
      results.push({ year: y, success: true, count: res.totalApplications, students: res.applicantStudents, avgGrade: res.avgGrade })
    } catch (err) {
      results.push({ year: y, success: false, error: err.message })
    }
  }
  return results
}

/**
 * 특정 연도의 5개년 통계를 초기화
 */
async function resetMultiYearStatsForYear(year) {
  const strYear = String(year)
  const defaultYear = MULTI_YEAR_STATS.byYear[strYear]
  if (defaultYear) {
    reactiveMultiYearStats.byYear[strYear] = JSON.parse(JSON.stringify(defaultYear))
  } else {
    reactiveMultiYearStats.byYear[strYear] = { hasData: false, totalApplications: null }
  }
  reactiveMultiYearStats.targetUnivComparison.forEach(t => {
    const defaultTarget = MULTI_YEAR_STATS.targetUnivComparison.find(dt => dt.groupName === t.groupName)
    t.data[strYear] = defaultTarget?.data[strYear] ?? null
    t.avgGrade[strYear] = defaultTarget?.avgGrade[strYear] ?? null
  })
  await saveMultiYearStats()
}


// Filters
const selectedClass = ref('ALL') // ALL, ENROLLED, 1..11, 졸업생
const selectedField = ref('ALL') // ALL, 인문, 자연, 예체능
const selectedType = ref('ALL') // ALL, 교과, 종합, 실기, 논술
const selectedMajorType = ref('ALL') // ALL, 일반학생, GROUP_RURAL, GROUP_OPP_NON_RURAL, or specific admissionMajorType
const selectedRegion = ref('ALL') // ALL, METRO, NON_METRO, or specific region
const searchKeyword = ref('')

/**
 * 학생 이름 마스킹 단계 (3단계 순환):
 * 0: MASK_MODES.LAST_ONLY (기본 디폴트) - 맨 뒤 한 글자만 표시 (예: "홍길동" -> "**동", "이민" -> "*민")
 * 1: MASK_MODES.FIRST_AND_LAST - 맨 앞글자(성)와 맨 뒷글자 총 2글자 표시 (예: "홍길동" -> "홍*동", "이민" -> "이민", "남궁민수" -> "남**수")
 * 2: MASK_MODES.UNMASKED - 모든 이름 다 보임 (예: "홍길동")
 */
export const MASK_MODES = {
  LAST_ONLY: 0,
  FIRST_AND_LAST: 1,
  UNMASKED: 2
}

// 관리자의 현재 마스킹 모드 (기본값: 0 - LAST_ONLY)
export const adminMaskMode = ref(MASK_MODES.LAST_ONLY)

/**
 * 관리자 전용 마스킹 모드 순환 함수:
 * 1단계(맨뒷글자 **동) -> 2단계(성과 맨뒷글자 홍*동) -> 3단계(전체공개 홍길동) -> 다시 1단계로 순환
 * *주의*: 교사는 마스킹을 해제하거나 모드를 변경할 수 없습니다.
 */
export function cycleAdminMaskMode() {
  try {
    const auth = useAuthStore()
    if (!auth.isAdmin) return // 교사는 마스킹 변경 불가!
  } catch (e) {}
  adminMaskMode.value = (adminMaskMode.value + 1) % 3
}

export const adminMaskToggle = computed({
  get: () => adminMaskMode.value !== MASK_MODES.UNMASKED,
  set: () => cycleAdminMaskMode()
})

/**
 * 학생 이름 마스킹 처리 함수:
 * - 관리자, 교사 모두 기본적으로 이름 마스킹 상태(맨 뒤 한글자만 표시)
 * - 교사는 마스킹 해제 불가 (항상 LAST_ONLY 적용)
 * - 관리자는 adminMaskMode에 따라 3단계 순환
 */
export function maskName(name, forceLevel = null) {
  if (!name) return ''
  const str = String(name).trim()
  if (!str) return ''

  let mode = MASK_MODES.LAST_ONLY

  try {
    const auth = useAuthStore()
    if (auth.isTeacher) {
      // 교사는 무조건 기본 마스킹(맨 뒤 한 글자만 표시) 고정!
      mode = MASK_MODES.LAST_ONLY
    } else if (auth.isAdmin) {
      mode = forceLevel !== null ? forceLevel : adminMaskMode.value
    } else {
      mode = MASK_MODES.LAST_ONLY
    }
  } catch (e) {
    mode = forceLevel !== null ? forceLevel : adminMaskMode.value
  }

  if (forceLevel !== null) {
    mode = forceLevel
  }

  // 3단계: 모든 이름 다 보임
  if (mode === MASK_MODES.UNMASKED) {
    return str
  }

  // 2단계: 맨 앞글자 성과 맨 뒷글자까지 총 2개 글자만 보임
  if (mode === MASK_MODES.FIRST_AND_LAST) {
    if (str.length <= 2) return str
    return str[0] + '*'.repeat(str.length - 2) + str[str.length - 1]
  }

  // 1단계(디폴트): 맨 뒤 한 글자만 보임 (단, 2글자 이름은 2글자 모두 '**'로 마스킹)
  if (str.length <= 1) return '*'
  if (str.length === 2) return '**'
  return '*'.repeat(str.length - 1) + str[str.length - 1]
}

// Standalone Helper: Format grade
export function formatGrade(val) {
  if (val === null || val === undefined || isNaN(val)) return '-'
  return Number(val).toFixed(2)
}

export const TOP_TIER_TARGET_UNIVS = [
  '서울대학교(서울)', '포항공과대학교(포항)', '연세대학교(서울)', '고려대학교(서울)',
  '서강대학교(서울)', '성균관대학교(서울)', '성균관대학교(수원)', '한양대학교(서울)',
  '이화여자대학교(서울)', '한국과학기술원', '울산과학기술원', '대구경북과학기술원',
  '광주과학기술원', '한국에너지공과대학교'
]

export const CLASS_STUDENT_COUNTS = {
  1: 31,
  2: 31,
  3: 29,
  4: 30,
  5: 31,
  6: 26,
  7: 27,
  8: 29,
  9: 30,
  10: 28,
  11: 31
}

export const REGION_ORDER = ['경기', '서울', '충남', '강원', '충북', '대전', '전북', '인천', '경북', '세종', '대구', '울산', '광주', '경남', '전남', '부산', '제주']
export const METRO_REGIONS = new Set(['경기', '서울', '인천'])

// Composable
export function useStatData() {
  const auth = useAuthStore()

  // Privacy Mask Rule:
  // - Teacher: ALWAYS masked (true). Student names are permanently protected.
  // - Admin: can toggle on/off.
  const isPrivacyMasked = computed(() => {
    if (auth.isTeacher) return true
    return adminMaskToggle.value
  })

  // Reset all filters
  const resetFilters = () => {
    selectedClass.value = 'ALL'
    selectedField.value = 'ALL'
    selectedType.value = 'ALL'
    selectedMajorType.value = 'ALL'
    selectedRegion.value = 'ALL'
    searchKeyword.value = ''
  }

  // Filtered applications
  const filteredApplications = computed(() => {
    return applications.value.filter(app => {
      // Scope filter (모집시기 및 대학구분)
      const p = app.period ? String(app.period).trim() : ''
      const isJungsi = p.includes('정시') || p.includes('추가')
      const isSusi = !isJungsi // 정시/추가가 아니면 수시 탭 데이터이므로 기본 수시로 판정 (수시, 수시1차, 수시2차 포함)
      const isCollege = app.schoolType === '전문대'

      if (selectedScope.value === 'SUSI_ALL') {
        if (!isSusi) return false
      } else if (selectedScope.value === 'JUNGSI_ALL') {
        if (!isJungsi) return false
      } else if (selectedScope.value === 'SUSI_UNIV') {
        if (!isSusi || isCollege) return false
      } else if (selectedScope.value === 'JUNGSI_UNIV') {
        if (!isJungsi || isCollege) return false
      } else if (selectedScope.value === 'SUSI_COLLEGE') {
        if (!isSusi || !isCollege) return false
      } else if (selectedScope.value === 'JUNGSI_COLLEGE') {
        if (!isJungsi || !isCollege) return false
      }

      // Class filter
      if (selectedClass.value === 'ENROLLED') {
        if (app.isGraduate || app.classNum === '졸업생') return false
      } else if (selectedClass.value === '졸업생' || selectedClass.value === 'GRADUATE') {
        if (!app.isGraduate && app.classNum !== '졸업생') return false
      } else if (selectedClass.value !== 'ALL') {
        if (String(app.classNum) !== String(selectedClass.value)) return false
      }
      // Field filter
      if (selectedField.value !== 'ALL' && app.field !== selectedField.value) {
        return false
      }
      // Admission type filter
      if (selectedType.value !== 'ALL') {
        if (!app.admissionType.includes(selectedType.value)) return false
      }
      // Major Type (전형명(대) - 대교협 구글시트 J열) filter
      if (selectedMajorType.value !== 'ALL') {
        if (selectedMajorType.value === 'GROUP_RURAL') {
          // 농어촌 (기회균형 및 고른기회 포함)
          if (!app.isRural && !app.admissionMajorType?.includes('농어촌') && !app.admissionDetailType?.includes('농어촌')) {
            return false
          }
        } else if (selectedMajorType.value === 'GROUP_OPP_NON_RURAL') {
          // 농어촌 외 기회균형 및 고른기회
          const isRuralApp = app.isRural || app.admissionMajorType?.includes('농어촌') || app.admissionDetailType?.includes('농어촌')
          const isOppApp = app.isOpportunity || 
            app.admissionMajorType?.includes('기회균형') || 
            app.admissionMajorType?.includes('고른기회') || 
            app.admissionMajorType?.includes('사회배려') ||
            app.admissionMajorType?.includes('수급자')
          if (isRuralApp || !isOppApp) {
            return false
          }
        } else if (selectedMajorType.value === 'GROUP_REC') {
          // 지역균형/학교장추천
          if (!app.isRecommendation && app.admissionMajorType !== '지역균형선발' && !app.admissionMajorType?.includes('추천')) {
            return false
          }
        } else {
          // Exact match with admissionMajorType
          if (app.admissionMajorType !== selectedMajorType.value) {
            return false
          }
        }
      }
      // Region filter
      if (selectedRegion.value === 'METRO') {
        if (!app.isMetro) return false
      } else if (selectedRegion.value === 'NON_METRO') {
        if (app.isMetro) return false
      } else if (selectedRegion.value !== 'ALL') {
        if (app.region !== selectedRegion.value) return false
      }
      // Search keyword
      if (searchKeyword.value.trim()) {
        const kw = searchKeyword.value.trim().toLowerCase()
        const text = `${app.name} ${app.univName} ${app.dept} ${app.admissionMajorType} ${app.admissionDetailType} ${app.classNum}반`.toLowerCase()
        if (!text.includes(kw)) return false
      }
      return true
    })
  })

  // Target total student count for current selection (Class-specific or overall)
  const currentTargetTotalStudents = computed(() => {
    if (!applications.value || applications.value.length === 0) return '-'
    const cls = Number(selectedClass.value)
    if (!isNaN(cls) && cls >= 1 && cls <= 11) {
      return CLASS_STUDENT_COUNTS[cls] || 30
    }
    if (selectedClass.value === '졸업생' || selectedClass.value === 'GRADUATE') {
      return currentStats.value.totalStudents
    }
    // 구글 시트 '기본통계' 탭의 3학년 학생 수 우선 사용
    const basic = basicSchoolStats.value?.[selectedAcademicYear.value]
    if (basic && basic.totalStudents) {
      return basic.totalStudents
    }
    return officialStats.value?.totalStudents || 334
  })

  // Dynamic label for enrolled card
  const enrolledLabel = computed(() => {
    const cls = Number(selectedClass.value)
    if (!isNaN(cls) && cls >= 1 && cls <= 11) {
      return `${cls}반 재학생`
    }
    if (selectedClass.value === 'ENROLLED') {
      return '3학년 재학생 (1~11반)'
    }
    if (selectedClass.value === '졸업생' || selectedClass.value === 'GRADUATE') {
      return '졸업생 지원자'
    }
    return '3학년 재학생'
  })

  // Dynamic label for applicant card
  const applicantLabel = computed(() => {
    if (selectedClass.value === '졸업생' || selectedClass.value === 'GRADUATE') {
      return '졸업생 지원자'
    }
    if (selectedScope.value === 'SUSI_ALL') return '수시 지원자'
    if (selectedScope.value === 'SUSI_UNIV') return '수시 일반대 지원자'
    if (selectedScope.value === 'SUSI_COLLEGE') return '수시 전문대 지원자'
    if (selectedScope.value === 'JUNGSI_ALL') return '정시 지원자'
    if (selectedScope.value === 'JUNGSI_UNIV') return '정시 일반대 지원자'
    if (selectedScope.value === 'JUNGSI_COLLEGE') return '정시 전문대 지원자'
    return '대입 지원자'
  })

  // Dynamic subtitle for enrolled card
  const enrolledSubText = computed(() => {
    if (!applications.value || applications.value.length === 0) return '데이터 미등록'
    const cls = Number(selectedClass.value)
    if (!isNaN(cls) && cls >= 1 && cls <= 11) {
      return `포곡고 3학년 ${cls}반 총원`
    }
    if (selectedClass.value === '졸업생' || selectedClass.value === 'GRADUATE') {
      return '수시 지원 졸업생 총원'
    }
    return '포곡고 3학년 총원'
  })

  // Dynamic applicant rate (based on current target students)
  const currentApplicantRate = computed(() => {
    const target = currentTargetTotalStudents.value
    if (!target || target === '-' || target === 0) return '-'
    if (!currentStats.value.totalStudents || currentStats.value.totalStudents === 0 || currentStats.value.totalStudents === '-') return '-'
    return ((Number(currentStats.value.totalStudents) / Number(target)) * 100).toFixed(1)
  })

  // Dynamic statistics based on filtered data
  const currentStats = computed(() => {
    const list = filteredApplications.value
    const totalApps = list.length
    
    // 데이터 미등록 시 허수 데이터를 절대 표시하지 않고 '-' 처리
    if (totalApps === 0) {
      return {
        totalApps: 0,
        totalStudents: 0,
        avgApps: '-',
        metroApps: 0,
        metroRate: '-',
        nonMetroApps: 0,
        nonMetroRate: '-',
        gyeonggiApps: 0,
        seoulApps: 0,
        incheonApps: 0,
        recApps: 0,
        recRate: '-',
        recStudents: 0,
        recStudentRate: '-',
        ruralApps: 0,
        ruralRate: '-',
        ruralStudents: 0,
        ruralStudentRate: '-',
        topTierApps: 0,
        topTierStudents: 0,
        topTierRate: '-',
        typeCounts: { gyogwa: 0, jonghap: 0, silgi: 0, nonsul: 0, other: 0 },
        fieldCounts: { humanities: 0, natural: 0, arts: 0 },
        regionalBreakdown: REGION_ORDER.map(region => ({ region, count: 0, rate: 0, metro: METRO_REGIONS.has(region) })),
        avgGrade: '-'
      }
    }

    // Unique students in filtered set
    const studentKeys = new Set(list.map(a => a.studentKey))
    const totalStudents = studentKeys.size

    // Average applications per student
    const avgApps = totalStudents > 0 ? (totalApps / totalStudents).toFixed(1) : '-'

    // Metropolitan count
    const metroApps = list.filter(a => a.isMetro).length
    const metroRate = totalApps > 0 ? ((metroApps / totalApps) * 100).toFixed(1) : '-'
    const nonMetroApps = totalApps - metroApps
    const nonMetroRate = totalApps > 0 ? ((nonMetroApps / totalApps) * 100).toFixed(1) : '-'

    // Specific metro regions
    const gyeonggiApps = list.filter(a => a.region === '경기').length
    const seoulApps = list.filter(a => a.region === '서울').length
    const incheonApps = list.filter(a => a.region === '인천').length

    // Recommendation count
    const recApps = list.filter(a => a.isRecommendation).length
    const recRate = totalApps > 0 ? ((recApps / totalApps) * 100).toFixed(1) : '0.0'
    const recStudents = new Set(list.filter(a => a.isRecommendation).map(a => a.studentKey)).size
    const recStudentRate = totalStudents > 0 ? ((recStudents / totalStudents) * 100).toFixed(1) : '0.0'

    // Rural count
    const ruralApps = list.filter(a => a.isRural).length
    const ruralRate = totalApps > 0 ? ((ruralApps / totalApps) * 100).toFixed(1) : '0.0'
    const ruralStudents = new Set(list.filter(a => a.isRural).map(a => a.studentKey)).size
    const ruralStudentRate = totalStudents > 0 ? ((ruralStudents / totalStudents) * 100).toFixed(1) : '0.0'

    // Top tier Sky & Tech
    const topTierAppsList = list.filter(a => TOP_TIER_TARGET_UNIVS.some(u => a.univName.includes(u) || a.univName === u))
    const topTierApps = topTierAppsList.length
    const topTierStudents = new Set(topTierAppsList.map(a => a.studentKey)).size
    const topTierRate = totalApps > 0 ? ((topTierApps / totalApps) * 100).toFixed(1) : '0.0'

    // Dynamic Regional Breakdown
    const regionCountsMap = {}
    list.forEach(a => {
      if (a.region) {
        regionCountsMap[a.region] = (regionCountsMap[a.region] || 0) + 1
      }
    })
    const regionalBreakdown = REGION_ORDER.map(region => {
      const count = regionCountsMap[region] || 0
      const rate = totalApps > 0 ? Number(((count / totalApps) * 100).toFixed(1)) : 0
      return {
        region,
        count,
        rate,
        metro: METRO_REGIONS.has(region)
      }
    })

    // Type counts
    const typeCounts = {
      gyogwa: list.filter(a => a.admissionType.includes('교과')).length,
      jonghap: list.filter(a => a.admissionType.includes('종합')).length,
      silgi: list.filter(a => a.admissionType.includes('실기')).length,
      nonsul: list.filter(a => a.admissionType.includes('논술')).length,
      other: 0
    }
    typeCounts.other = totalApps - (typeCounts.gyogwa + typeCounts.jonghap + typeCounts.silgi + typeCounts.nonsul)

    // Field counts
    const fieldCounts = {
      humanities: list.filter(a => a.field === '인문').length,
      natural: list.filter(a => a.field === '자연').length,
      arts: list.filter(a => a.field === '예체능').length
    }

    // Average grade of applied students
    const validGrades = list.map(a => a.allSubjectGrade).filter(g => g !== null && g > 0)
    const avgGrade = validGrades.length > 0 
      ? (validGrades.reduce((a, b) => a + b, 0) / validGrades.length).toFixed(2)
      : '-'

    return {
      totalApps,
      totalStudents,
      avgApps,
      metroApps,
      metroRate,
      nonMetroApps,
      nonMetroRate,
      gyeonggiApps,
      seoulApps,
      incheonApps,
      recApps,
      recRate,
      recStudents,
      recStudentRate,
      ruralApps,
      ruralRate,
      ruralStudents,
      ruralStudentRate,
      topTierApps,
      topTierStudents,
      topTierRate,
      typeCounts,
      fieldCounts,
      regionalBreakdown,
      avgGrade
    }
  })

  // Export filtered applications to Excel
  const exportToExcel = (customList = null, filename = '포곡고_2027수시지원통계') => {
    const list = customList || filteredApplications.value
    const exportData = list.map(app => ({
      '학년': app.grade,
      '반': app.classNum,
      '번호': app.studentNum,
      '이름': maskName(app.name),
      '학교유형': app.schoolType,
      '지역': app.region,
      '대학명': app.univName,
      '모집시기': app.period,
      '전형유형': app.admissionType,
      '전형명(대)': app.admissionMajorType,
      '세부유형': app.admissionDetailType,
      '계열': app.field,
      '모집단위': app.dept,
      '모집인원': app.quota,
      '선발유형': app.selectionMethod,
      '최저학력기준': app.minScoreReq,
      '전교과등급(100)': app.allSubjectGrade,
      '국영수사/과(100)': app.mainSubjectGrade,
      '대학환산점수': app.univConvertedScore,
      '대학환산등급': app.univConvertedGrade,
      '1단계': app.stage1,
      '최종단계': app.finalStage,
      '비고': app.note,
      '면접일자': app.interviewDate,
      '실기일자': app.practicalDate,
      '논술일자': app.essayDate,
      '최종발표일': app.finalAnnounceDate
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '수시지원현황')
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  // File upload parser
  const loadCustomData = (parsedApps) => {
    if (Array.isArray(parsedApps) && parsedApps.length > 0) {
      applications.value = parsedApps
    }
  }

  return {
    auth,
    applications,
    officialStats,
    selectedClass,
    selectedField,
    selectedType,
    selectedMajorType,
    selectedRegion,
    searchKeyword,
    adminMaskMode,
    adminMaskToggle,
    cycleAdminMaskMode,
    MASK_MODES,
    isPrivacyMasked,
    filteredApplications,
    currentStats,
    currentTargetTotalStudents,
    enrolledLabel,
    enrolledSubText,
    applicantLabel,
    currentApplicantRate,
    basicSchoolStats,
    resetFilters,
    exportToExcel,
    loadCustomData,
    maskName,
    formatGrade,
    selectedAcademicYear,
    availableAcademicYears,
    selectedScope,
    scopeOptions: SCOPE_OPTIONS,
    setAcademicYear,
    setScope,
    refreshYearSheets: initYearSheets,
    isLoadingYearData,
    yearDataError,
    reloadCurrentYear: () => applyYearAndScope(selectedAcademicYear.value, selectedScope.value, true),
    multiYearStats: reactiveMultiYearStats,
    generateMultiYearStatsForYear,
    resetMultiYearStatsForYear,
    syncAllAvailableSheetYears,
    mockExamRecords,
    studentMockExamsMap,
    isLoadingMockExams,
    loadMockExamData,
    csatMinScoreTable,
    isLoadingCsatMinScore,
    loadCsatMinScoreData
  }
}

// Aliases for seamless imports across all components
export { useStatData as useData }
