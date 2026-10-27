import { ref } from 'vue'
import { supabase } from '../utils/supabaseClient'

// ── 기본 시스템명 및 캐시 키 ──────────────────────────────────────────
export const DEFAULT_SYSTEM_NAME = '3학년 진학·학사 통합 포털'
export const CONFIG_KEY_LOGIN_SYSTEM_NAME = 'login_system_name'
export const CONFIG_KEY_MODULES_CACHE = 'suite_modules_cache'

export const loginSystemName = ref(
  localStorage.getItem('pcm_login_system_name') || DEFAULT_SYSTEM_NAME
)

// ── 5개 사용자 그룹 정의 (학부모는 준비 중 및 흐림 처리) ────────────
export const SUITE_TARGET_GROUPS = [
  { key: 'student', label: '학생', disabled: false },
  { key: 'graduate', label: '졸업생', disabled: false },
  { key: 'parent', label: '학부모', disabled: true, tooltip: '학부모 계정 연동 기능 준비 중' },
  { key: 'teacher', label: '교사', disabled: false },
  { key: 'admin', label: '관리자', disabled: false }
]

// ── 기본 모듈 메타데이터 목록 ─────────────────────────────────────────
export const DEFAULT_SUITE_MODULES = [
  {
    id: 'principal',
    name: '학교장 추천자 선발 시스템',
    category: '대입 전형',
    badge: '전국 대입',
    description: '주요 대학 학교장추천전형(지역균형) 신청서 제출, 대학별 정원 관리, 교내 석차 심의 및 최종 추천 확정',
    icon: 'GraduationCap',
    colorTheme: 'blue',
    isEnabled: true,
    alwaysOpen: true,
    startAt: '',
    endAt: '',
    sortOrder: 1,
    targetRoles: ['student', 'graduate', 'admin']
  },
  {
    id: 'rural',
    name: '농어촌(기회균형) 전형 추천 등록',
    category: '대입 전형',
    badge: '기회균형 포함',
    description: '기회균형 내 농어촌 특별전형 자격 검증, 지원 희망자 배정 관리 및 거주 요건 이력 통합 관리',
    icon: 'ShieldCheck',
    colorTheme: 'emerald',
    isEnabled: localStorage.getItem('pcm_enable_rural_system') === 'true',
    alwaysOpen: true,
    startAt: '',
    endAt: '',
    sortOrder: 2,
    targetRoles: ['student', 'graduate', 'admin']
  },
  {
    id: 'exam_intent',
    name: '수능응시 · 수시/정시 원서접수계획 등록',
    category: '진학 관리',
    badge: '재학생 전수 조사',
    description: '수능 응시 여부 및 대학 수시·정시 원서접수 계획 자가 등록, 미응시/미접수 확인서 출력 및 수능 접수대장 대조',
    icon: 'ClipboardList',
    colorTheme: 'violet',
    isEnabled: localStorage.getItem('pcm_enable_exam_intent_system') !== 'false',
    alwaysOpen: true,
    startAt: '',
    endAt: '',
    sortOrder: 3,
    targetRoles: ['student', 'teacher', 'admin']
  },
  {
    id: 'junior_college',
    name: '전문대학 학교장 추천',
    category: '대입 전형',
    badge: '직인 날인 즉시 발급',
    description: '별도 교내 심의 없이 대학·학과·전형 수동 직접 입력 및 행정실 학교장 직인 날인용 추천서 즉시 발급·출력',
    icon: 'School',
    colorTheme: 'indigo',
    isEnabled: localStorage.getItem('pcm_enable_junior_college_system') !== 'false',
    alwaysOpen: true,
    startAt: '',
    endAt: '',
    sortOrder: 4,
    targetRoles: ['student', 'graduate', 'admin']
  },
  {
    id: 'rollbook',
    name: '선택교과 출석관리',
    category: '학사 관리',
    badge: '고3 이동수업 · 원적학급',
    description: '고등학교 3학년 선택교육과정 이동수업(1~12반) 및 원적학급(1~11반) 출석부 생성·인쇄, 결석계 대장 조회/인쇄, 급식 캘린더',
    icon: 'BookOpen',
    colorTheme: 'teal',
    isEnabled: true,
    alwaysOpen: true,
    startAt: '',
    endAt: '',
    sortOrder: 5,
    targetRoles: ['teacher', 'admin']
  },
  {
    id: 'stat',
    name: '수시 지원 통계 분석 (꼼스탯)',
    category: '통계 분석',
    badge: '대교협 원자료 기반',
    description: '대교협 수시 지원 원자료를 바탕으로 한 학생별·대학별 전형 지원 통계 및 합격 예측 시각화 분석',
    icon: 'BarChart3',
    colorTheme: 'slate',
    isEnabled: true,
    alwaysOpen: true,
    startAt: '',
    endAt: '',
    sortOrder: 6,
    targetRoles: ['teacher', 'admin']
  }
]

// ── 추천 시스템 이름 목록 (관리자 편의 퀵픽) ───────────────────────────
export const RECOMMENDED_SYSTEM_NAMES = [
  '3학년 진학·학사 통합 포털',
  '3학년 통합 학년업무 시스템',
  '꼼스위트 (ggomsuite) 365',
  '스마트 학년업무 포털 (Smart Grade)',
  '하이그레이드 3 (HiGrade 3)',
  '올인원 학년통합 업무시스템'
]

// ── 1. 로그인 시스템명 조회 ───────────────────────────────────────────
export async function fetchLoginSystemName() {
  const cached = localStorage.getItem('pcm_login_system_name')
  if (cached) {
    loginSystemName.value = cached
  }

  if (!supabase) return loginSystemName.value

  try {
    const { data, error } = await supabase
      .from('config')
      .select('value')
      .eq('key', CONFIG_KEY_LOGIN_SYSTEM_NAME)
      .maybeSingle()

    if (!error && data && data.value && data.value.trim()) {
      loginSystemName.value = data.value.trim()
      localStorage.setItem('pcm_login_system_name', loginSystemName.value)
    }
  } catch (e) {
    console.warn('Failed to fetch login system name from DB:', e)
  }

  return loginSystemName.value
}

// ── 2. 로그인 시스템명 저장 ───────────────────────────────────────────
export async function saveLoginSystemName(newName) {
  const trimmed = (newName || '').trim() || DEFAULT_SYSTEM_NAME
  loginSystemName.value = trimmed
  localStorage.setItem('pcm_login_system_name', trimmed)

  if (!supabase) return { success: true }

  try {
    const { error } = await supabase
      .from('config')
      .upsert({ key: CONFIG_KEY_LOGIN_SYSTEM_NAME, value: trimmed }, { onConflict: 'key' })

    if (error) throw error
    return { success: true }
  } catch (e) {
    console.error('Failed to save login system name:', e)
    throw e
  }
}

// ── 3. 모듈 목록 불러오기 ─────────────────────────────────────────────
export async function fetchSuiteModules() {
  let modules = JSON.parse(JSON.stringify(DEFAULT_SUITE_MODULES))

  // 로컬 캐시 확인
  try {
    const localCached = localStorage.getItem(CONFIG_KEY_MODULES_CACHE)
    if (localCached) {
      const parsed = JSON.parse(localCached)
      if (Array.isArray(parsed) && parsed.length > 0) {
        modules = mergeModulesWithDefaults(parsed, modules)
      }
    }
  } catch (e) {
    console.warn('Error reading local modules cache:', e)
  }

  if (!supabase) return modules

  // 1) system_modules 테이블 시도
  try {
    const { data, error } = await supabase
      .from('system_modules')
      .select('*')
      .order('sort_order', { ascending: true })

    if (!error && data && data.length > 0) {
      const dbModules = data.map(item => ({
        id: item.id,
        name: item.name || '',
        category: item.category || '',
        badge: item.badge || '',
        description: item.description || '',
        icon: item.icon || 'Grid',
        isEnabled: item.is_enabled ?? true,
        alwaysOpen: item.always_open ?? true,
        startAt: item.start_at ? item.start_at.slice(0, 16) : '',
        endAt: item.end_at ? item.end_at.slice(0, 16) : '',
        sortOrder: item.sort_order ?? 0,
        targetRoles: item.target_roles || ['student', 'teacher', 'admin'],
        extraConfig: item.extra_config || {}
      }))
      modules = mergeModulesWithDefaults(dbModules, DEFAULT_SUITE_MODULES)
      localStorage.setItem(CONFIG_KEY_MODULES_CACHE, JSON.stringify(modules))
      syncLegacyLocalStorageFlags(modules)
      return modules
    }
  } catch (err) {
    // system_modules 테이블이 아직 없을 수 있음 (테이블 미생성 폴백)
  }

  // 2) 폴백: config 테이블의 suite_modules_cache 조회
  try {
    const { data: cfgData } = await supabase
      .from('config')
      .select('value')
      .eq('key', CONFIG_KEY_MODULES_CACHE)
      .maybeSingle()

    if (cfgData && cfgData.value) {
      const parsed = JSON.parse(cfgData.value)
      if (Array.isArray(parsed) && parsed.length > 0) {
        modules = mergeModulesWithDefaults(parsed, modules)
        localStorage.setItem(CONFIG_KEY_MODULES_CACHE, JSON.stringify(modules))
      }
    }
  } catch (err) {
    console.warn('Fallback config fetch failed:', err)
  }

  syncLegacyLocalStorageFlags(modules)
  return modules
}

// ── 4. 모듈 목록 저장하기 ─────────────────────────────────────────────
export async function saveSuiteModules(modulesList) {
  if (!Array.isArray(modulesList)) return

  // 로컬 및 레거시 플래그 동기화
  localStorage.setItem(CONFIG_KEY_MODULES_CACHE, JSON.stringify(modulesList))
  syncLegacyLocalStorageFlags(modulesList)
  syncLegacyDatabaseFlags(modulesList)

  if (!supabase) return { success: true }

  let dbSaved = false

  // 1) system_modules 테이블 업서트 시도
  try {
    const rows = modulesList.map(m => ({
      id: m.id,
      name: m.name,
      category: m.category,
      badge: m.badge,
      description: m.description,
      icon: m.icon,
      is_enabled: !!m.isEnabled,
      always_open: !!m.alwaysOpen,
      start_at: (m.startAt && String(m.startAt).trim()) ? new Date(m.startAt).toISOString() : null,
      end_at: (m.endAt && String(m.endAt).trim()) ? new Date(m.endAt).toISOString() : null,
      sort_order: m.sortOrder || 0,
      target_roles: m.targetRoles || ['student', 'teacher', 'admin'],
      extra_config: m.extraConfig || {},
      updated_at: new Date().toISOString()
    }))

    const { error } = await supabase
      .from('system_modules')
      .upsert(rows, { onConflict: 'id' })

    if (!error) {
      dbSaved = true
    }
  } catch (err) {
    console.warn('system_modules table upsert failed, falling back to config table:', err)
  }

  // 2) 폴백으로 config 테이블에도 JSON 저장 (테이블 미생성 시에도 즉시 동작 보장)
  try {
    await supabase
      .from('config')
      .upsert(
        { key: CONFIG_KEY_MODULES_CACHE, value: JSON.stringify(modulesList) },
        { onConflict: 'key' }
      )
  } catch (cfgErr) {
    console.warn('Failed to save to config table fallback:', cfgErr)
  }

  return { success: true, dbSaved }
}

// ── 5. 모듈 현재 오픈 상태 판별 (스케줄 연동) ─────────────────────────
export function getModuleStatus(module) {
  if (!module) return { isOpen: false, code: 'DISABLED', label: '비활성화' }

  if (!module.isEnabled) {
    return { isOpen: false, code: 'DISABLED', label: '대문 미노출' }
  }

  if (module.alwaysOpen) {
    return { isOpen: true, code: 'ALWAYS_OPEN', label: '상시 운영 중' }
  }

  const now = new Date().getTime()
  const start = module.startAt ? new Date(module.startAt).getTime() : null
  const end = module.endAt ? new Date(module.endAt).getTime() : null

  if (start && now < start) {
    return { isOpen: false, code: 'BEFORE', label: '오픈 예정' }
  }

  if (end && now > end) {
    return { isOpen: false, code: 'ENDED', label: '일정 마감' }
  }

  return { isOpen: true, code: 'RUNNING', label: '운영 중' }
}

// ── 유틸: 기존 플래그 동기화 ───────────────────────────────────────────
function syncLegacyLocalStorageFlags(modules) {
  const rural = modules.find(m => m.id === 'rural')
  if (rural) {
    localStorage.setItem('pcm_enable_rural_system', String(rural.isEnabled))
  }
  const examIntent = modules.find(m => m.id === 'exam_intent')
  if (examIntent) {
    localStorage.setItem('pcm_enable_exam_intent_system', String(examIntent.isEnabled))
  }
  const jc = modules.find(m => m.id === 'junior_college')
  if (jc) {
    localStorage.setItem('pcm_enable_junior_college_system', String(jc.isEnabled))
  }
}

async function syncLegacyDatabaseFlags(modules) {
  if (!supabase) return
  const rural = modules.find(m => m.id === 'rural')
  const examIntent = modules.find(m => m.id === 'exam_intent')
  const jc = modules.find(m => m.id === 'junior_college')

  const upserts = []
  if (rural) upserts.push({ key: 'enable_rural_system', value: String(rural.isEnabled) })
  if (examIntent) upserts.push({ key: 'enable_exam_intent_system', value: String(examIntent.isEnabled) })
  if (jc) upserts.push({ key: 'enable_junior_college_system', value: String(jc.isEnabled) })

  for (const item of upserts) {
    try {
      await supabase.from('config').upsert(item, { onConflict: 'key' })
    } catch (e) {
      console.warn('Failed to sync legacy config key:', item.key, e)
    }
  }
}

function mergeModulesWithDefaults(savedList, defaults) {
  const result = []
  const savedMap = new Map((savedList || []).map(m => [m.id, m]))

  for (const def of defaults) {
    const saved = savedMap.get(def.id)
    if (saved) {
      result.push({
        ...def,
        ...saved,
        // 보존할 고유 메타데이터
        icon: def.icon,
        colorTheme: def.colorTheme
      })
      savedMap.delete(def.id)
    } else {
      result.push({ ...def })
    }
  }

  // 추가로 동적 생성된 모듈이 있으면 추가
  for (const extra of savedMap.values()) {
    result.push(extra)
  }

  return result.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
}
