import { ref } from 'vue'
import { supabase } from '../utils/supabaseClient.js'

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
    targetRoles: ['student', 'graduate', 'admin'],
    secretAccessEnabled: false,
    secretAccessExpireDate: '',
    secretAccessExpiresAt: null,
    secretAccessDate: '',
    secretAccessToken: ''
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
    targetRoles: ['student', 'graduate', 'admin'],
    secretAccessEnabled: false,
    secretAccessExpireDate: '',
    secretAccessExpiresAt: null,
    secretAccessDate: '',
    secretAccessToken: ''
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
    targetRoles: ['student', 'teacher', 'admin'],
    secretAccessEnabled: false,
    secretAccessExpireDate: '',
    secretAccessExpiresAt: null,
    secretAccessDate: '',
    secretAccessToken: ''
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
    targetRoles: ['student', 'graduate', 'admin'],
    secretAccessEnabled: false,
    secretAccessExpireDate: '',
    secretAccessExpiresAt: null,
    secretAccessDate: '',
    secretAccessToken: ''
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
    targetRoles: ['teacher', 'admin'],
    secretAccessEnabled: false,
    secretAccessExpireDate: '',
    secretAccessExpiresAt: null,
    secretAccessDate: '',
    secretAccessToken: ''
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
    targetRoles: ['teacher', 'admin'],
    secretAccessEnabled: false,
    secretAccessExpireDate: '',
    secretAccessExpiresAt: null,
    secretAccessDate: '',
    secretAccessToken: ''
  }
]

// ── 모듈별 내부 라우트 경로 매핑 ─────────────────────────────────────
export const MODULE_ROUTE_MAP = {
  stat: '/stat',
  rollbook: '/rollbook',
  rural: '/rural',
  junior_college: '/junior-college',
  exam_intent: '/exam-intent-manage',
  principal: '/admin'
}

// ── 모듈별 2글자 고유 식별 코드 매핑 ──────────────────────────────────
export const MODULE_CODE_MAP = {
  stat: 'st',
  rollbook: 'rb',
  rural: 'ru',
  junior_college: 'jc',
  exam_intent: 'ei',
  principal: 'pr'
}

export const CODE_TO_MODULE_MAP = {
  st: 'stat',
  rb: 'rollbook',
  ru: 'rural',
  jc: 'junior_college',
  ei: 'exam_intent',
  pr: 'principal'
}

const SECRET_KEY_STR = 'ggomrecommend_school_secret_2026!'

/**
 * 한국 시간 기준 YYYYMMDD 날짜 문자열 반환
 */
export function getTodayDateString(d = new Date()) {
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  const y = kst.getUTCFullYear()
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0')
  const day = String(kst.getUTCDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

/**
 * 한국 시간(KST) 기준 YYYY-MM-DD 날짜 문자열 반환
 */
export function getTodayIsoDate(d = new Date()) {
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  const y = kst.getUTCFullYear()
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0')
  const day = String(kst.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * 한국 시간(KST) 기준 days 일 후의 YYYY-MM-DD 날짜 문자열 반환
 */
export function getNextDayIsoDate(days = 1, baseDate = new Date()) {
  const target = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000)
  return getTodayIsoDate(target)
}

/**
 * YYYY-MM-DD 또는 YYYYMMDD 날짜 문자열을 해당 일자의 자정 직전(23:59:59.999 KST) 밀리초 타임스탬프로 변환
 */
export function parseExpireDateToTimestamp(dateStrOrTs) {
  if (!dateStrOrTs) {
    return Date.parse(`${getNextDayIsoDate(1)}T23:59:59.999+09:00`)
  }
  if (typeof dateStrOrTs === 'number') {
    if (dateStrOrTs > 100000000000) return dateStrOrTs
    return Date.now() + dateStrOrTs
  }
  const clean = String(dateStrOrTs).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const ts = Date.parse(`${clean}T23:59:59.999+09:00`)
    if (!isNaN(ts)) return ts
  }
  if (/^\d{8}$/.test(clean)) {
    const y = clean.slice(0, 4)
    const m = clean.slice(4, 6)
    const d = clean.slice(6, 8)
    const ts = Date.parse(`${y}-${m}-${d}T23:59:59.999+09:00`)
    if (!isNaN(ts)) return ts
  }
  const parsed = Date.parse(clean)
  if (!isNaN(parsed)) return parsed
  return Date.now() + 24 * 60 * 60 * 1000
}

/**
 * 타임스탬프를 한국 시간(KST) 기준 YYYY-MM-DD 날짜 문자열로 변환
 */
export function getIsoDateFromTimestamp(ts) {
  if (!ts) return ''
  const kst = new Date(Number(ts) + 9 * 60 * 60 * 1000)
  const y = kst.getUTCFullYear()
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0')
  const day = String(kst.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * 모듈별 비밀 접속 단축 AES-256-GCM 암호화 토큰 생성
 * - 모듈 식별자(modCode)와 발급일자(dateStr), 만료시각(expiresAt) 및 난수(nonce)를 모두 암호문 내부에 봉인
 * - URL 파라미터에는 어떠한 평문 정보(st, 20261029 등)도 노출되지 않고 순수 암호문만 포함
 * - expiresAtOrTtl: 유효 만료일자("YYYY-MM-DD") 또는 타임스탬프 (미지정 시 내일 23:59:59 KST)
 */
export async function generateSecretAccessToken(moduleId, dateStr = null, expiresAtOrTtl = null) {
  const modCode = MODULE_CODE_MAP[moduleId]
  if (!modCode) throw new Error('Unknown module ID for secret token: ' + moduleId)

  const dStr = dateStr || getTodayDateString()
  const expiresAt = parseExpireDateToTimestamp(expiresAtOrTtl)

  const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto
  if (!cryptoObj?.subtle) {
    throw new Error('Web Crypto API is not available')
  }

  const enc = new TextEncoder()
  const keySeed = enc.encode(`${SECRET_KEY_STR}_unified_token`)
  const keyHash = await cryptoObj.subtle.digest('SHA-256', keySeed)
  const key = await cryptoObj.subtle.importKey('raw', keyHash, { name: 'AES-GCM' }, false, ['encrypt'])

  const iv = cryptoObj.getRandomValues(new Uint8Array(12))
  const nonce = Math.random().toString(36).slice(2, 8)
  const payload = enc.encode(`${modCode}:${dStr}:${expiresAt}:${nonce}`)
  const encryptedBuf = await cryptoObj.subtle.encrypt({ name: 'AES-GCM', iv }, key, payload)

  const combined = new Uint8Array(iv.length + encryptedBuf.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(encryptedBuf), iv.length)

  let binary = ''
  for (let i = 0; i < combined.length; i++) binary += String.fromCharCode(combined[i])
  const b64url = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  return b64url
}

/**
 * 비밀 접속 AES-256-GCM 토큰 검증 및 복호화
 * - 완전 암호화 토큰 및 기존 레거시 포맷({modCode}{dateStr}_...) 동시 호환 지원
 */
export async function verifySecretAccessToken(token, expectedModuleId = null) {
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'missing_token' }
  }

  const clean = token.trim()
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto
  if (!cryptoObj?.subtle) {
    return { valid: false, reason: 'crypto_unavailable' }
  }

  const enc = new TextEncoder()

  // 1) 레거시 포맷 지원: 정확히 10글자(모듈코드2+날짜8) 뒤에 언더스코어(_)가 있는 경우
  if (/^[a-z]{2}\d{8}_/i.test(clean)) {
    try {
      const underIdx = clean.indexOf('_')
      const prefix = clean.slice(0, underIdx)
      const modCode = prefix.slice(0, 2).toLowerCase()
      const dateStr = prefix.slice(2)
      const rawCipher = clean.slice(underIdx + 1)

      const mappedModuleId = CODE_TO_MODULE_MAP[modCode]
      if (!mappedModuleId) {
        return { valid: false, reason: 'unknown_module' }
      }

      if (expectedModuleId && mappedModuleId !== expectedModuleId) {
        return { valid: false, reason: 'module_mismatch' }
      }

      let str = rawCipher.replace(/-/g, '+').replace(/_/g, '/')
      while (str.length % 4) str += '='
      const binary = atob(str)
      const rawBytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) rawBytes[i] = binary.charCodeAt(i)

      if (rawBytes.length >= 28) {
        const iv = rawBytes.slice(0, 12)
        const cipherData = rawBytes.slice(12)
        const keySeed = enc.encode(`${SECRET_KEY_STR}_${modCode}_${dateStr}`)
        const keyHash = await cryptoObj.subtle.digest('SHA-256', keySeed)
        const key = await cryptoObj.subtle.importKey('raw', keyHash, { name: 'AES-GCM' }, false, ['decrypt'])
        const decryptedBuf = await cryptoObj.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherData)
        const payloadText = new TextDecoder().decode(decryptedBuf)
        const [decMod, decDate, decExp] = payloadText.split(':')

        if (decMod === modCode && decDate === dateStr) {
          const expiresAt = Number(decExp)
          if (isNaN(expiresAt) || Date.now() > expiresAt) {
            return { valid: false, reason: 'expired', expiresAt, dateStr }
          }
          return {
            valid: true,
            moduleId: mappedModuleId,
            modCode,
            dateStr,
            expiresAt
          }
        }
      }
    } catch (e) {
      // 레거시 해석 실패 시 신규 완전 암호화 해석으로 계속 시도
    }
  }

  // 2) 신규 완전 암호화 포맷 (어떠한 평문 접두사 없이 전체가 AES-256-GCM 암호문)
  try {
    let str = clean.replace(/-/g, '+').replace(/_/g, '/')
    while (str.length % 4) str += '='
    const binary = atob(str)
    const rawBytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) rawBytes[i] = binary.charCodeAt(i)

    if (rawBytes.length < 28) {
      return { valid: false, reason: 'invalid_cipher_length' }
    }

    const iv = rawBytes.slice(0, 12)
    const cipherData = rawBytes.slice(12)

    const keySeed = enc.encode(`${SECRET_KEY_STR}_unified_token`)
    const keyHash = await cryptoObj.subtle.digest('SHA-256', keySeed)
    const key = await cryptoObj.subtle.importKey('raw', keyHash, { name: 'AES-GCM' }, false, ['decrypt'])

    const decryptedBuf = await cryptoObj.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherData)
    const payloadText = new TextDecoder().decode(decryptedBuf)
    const [decMod, decDate, decExp] = payloadText.split(':')

    const mappedModuleId = CODE_TO_MODULE_MAP[decMod]
    if (!mappedModuleId) {
      return { valid: false, reason: 'unknown_module' }
    }

    if (expectedModuleId && mappedModuleId !== expectedModuleId) {
      return { valid: false, reason: 'module_mismatch' }
    }

    const expiresAt = Number(decExp)
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return { valid: false, reason: 'expired', expiresAt, dateStr: decDate }
    }

    return {
      valid: true,
      moduleId: mappedModuleId,
      modCode: decMod,
      dateStr: decDate,
      expiresAt
    }
  } catch (err) {
    return { valid: false, reason: 'decryption_failed' }
  }
}

/**
 * 라우트 URL 경로로부터 해당 모듈 ID를 역산 (2글자 코드 및 일반 경로 모두 지원)
 */
export function getModuleIdByPath(path) {
  if (!path) return null
  const cleanPath = path.split('?')[0].replace(/\/+$/, '')
  if (cleanPath === '/stat') return 'stat'
  if (cleanPath === '/rollbook') return 'rollbook'
  if (cleanPath === '/rural') return 'rural'
  if (cleanPath === '/junior-college') return 'junior_college'
  if (cleanPath === '/exam-intent' || cleanPath === '/exam-intent-manage') return 'exam_intent'
  if (cleanPath === '/admin' || cleanPath === '/teacher' || cleanPath === '/student') return 'principal'
  if (cleanPath.startsWith('/guest/')) {
    const rawCodeOrId = cleanPath.replace(/^\/guest\/?/, '').split('/')[0]
    return CODE_TO_MODULE_MAP[rawCodeOrId] || rawCodeOrId || null
  }
  return null
}

/**
 * 모듈별 학교 관리자 Secret 접속 전체 URL 생성 (AES 암호화 토큰 적용)
 */
export async function getModuleSecretUrl(moduleId, customDateStr = null, customExpireDate = null) {
  if (!moduleId) return ''
  const token = await generateSecretAccessToken(moduleId, customDateStr, customExpireDate)
  const route = MODULE_ROUTE_MAP[moduleId] || `/${moduleId}`
  const base = import.meta.env.BASE_URL || '/'
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  const cleanRoute = route.startsWith('/') ? route.slice(1) : route
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}${normalizedBase}${cleanRoute}?sec=${token}`
}

/**
 * 모듈 객체의 기존 유효 토큰을 재사용하거나 새로 발급하여 URL 반환 (지정 만료일자 지원)
 */
export async function getOrGenerateModuleSecretUrl(module, customExpireDate = null) {
  if (!module) return ''
  const moduleId = typeof module === 'string' ? module : module.id
  const targetExpireDate = customExpireDate || (typeof module === 'object' ? module.secretAccessExpireDate : null) || getNextDayIsoDate(1)

  let token = typeof module === 'object' ? module?.secretAccessToken : null
  let needRegenerate = !token

  // 기존에 발급된 토큰이 구버전 포맷(st20261029_...)인 경우 신규 완전 암호화 포맷으로 자동 갱신
  if (token && token.includes('_')) {
    needRegenerate = true
  }

  // 날짜가 명시적으로 변경되었을 때
  if (token && customExpireDate && module?.secretAccessExpireDate !== customExpireDate) {
    needRegenerate = true
  }

  if (token && !needRegenerate) {
    const check = await verifySecretAccessToken(token, moduleId)
    if (!check.valid) {
      needRegenerate = true
    }
  }

  if (needRegenerate) {
    const expiresAt = parseExpireDateToTimestamp(targetExpireDate)
    const issuedDate = getTodayDateString()
    token = await generateSecretAccessToken(moduleId, issuedDate, expiresAt)
    if (typeof module === 'object' && module) {
      module.secretAccessToken = token
      module.secretAccessDate = issuedDate
      module.secretAccessExpireDate = targetExpireDate
      module.secretAccessExpiresAt = expiresAt
    }
  }

  const route = MODULE_ROUTE_MAP[moduleId] || `/${moduleId}`
  const base = import.meta.env.BASE_URL || '/'
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  const cleanRoute = route.startsWith('/') ? route.slice(1) : route
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}${normalizedBase}${cleanRoute}?sec=${token}`
}

let _cachedModulesList = null
let _cachedModulesListTime = 0

/**
 * 특정 모듈의 학교 관리자 Secret 접속 통로 활성화 여부 확인
 */
export async function isModuleSecretAccessEnabled(moduleId) {
  if (!moduleId) return false
  const now = Date.now()
  if (_cachedModulesList && (now - _cachedModulesListTime < 8000)) {
    const mod = _cachedModulesList.find(m => m.id === moduleId)
    if (mod) return !!(mod.secretAccessEnabled || mod.extraConfig?.secretAccessEnabled)
  }

  const modules = await fetchSuiteModules()
  _cachedModulesList = modules
  _cachedModulesListTime = now
  const target = modules.find(m => m.id === moduleId)
  return !!(target?.secretAccessEnabled || target?.extraConfig?.secretAccessEnabled)
}

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
        extraConfig: item.extra_config || {},
        secretAccessEnabled: !!(item.secret_access_enabled ?? item.extra_config?.secretAccessEnabled ?? false),
        secretAccessDate: item.extra_config?.secretAccessDate || '',
        secretAccessExpireDate: item.extra_config?.secretAccessExpireDate || getIsoDateFromTimestamp(item.extra_config?.secretAccessExpiresAt) || '',
        secretAccessExpiresAt: item.extra_config?.secretAccessExpiresAt || null,
        secretAccessToken: item.extra_config?.secretAccessToken || ''
      }))
      modules = mergeModulesWithDefaults(dbModules, DEFAULT_SUITE_MODULES)
      _cachedModulesList = modules
      _cachedModulesListTime = Date.now()
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
  _cachedModulesList = modulesList
  _cachedModulesListTime = Date.now()
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
      extra_config: {
        ...(m.extraConfig || {}),
        secretAccessEnabled: !!m.secretAccessEnabled,
        secretAccessDate: m.secretAccessDate || '',
        secretAccessExpireDate: m.secretAccessExpireDate || '',
        secretAccessExpiresAt: m.secretAccessExpiresAt || null,
        secretAccessToken: m.secretAccessToken || ''
      },
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
        secretAccessEnabled: !!(saved?.secretAccessEnabled ?? saved?.extraConfig?.secretAccessEnabled ?? def.secretAccessEnabled ?? false),
        secretAccessDate: saved?.secretAccessDate || saved?.extraConfig?.secretAccessDate || '',
        secretAccessExpireDate: saved?.secretAccessExpireDate || saved?.extraConfig?.secretAccessExpireDate || getIsoDateFromTimestamp(saved?.secretAccessExpiresAt || saved?.extraConfig?.secretAccessExpiresAt) || '',
        secretAccessExpiresAt: saved?.secretAccessExpiresAt || saved?.extraConfig?.secretAccessExpiresAt || null,
        secretAccessToken: saved?.secretAccessToken || saved?.extraConfig?.secretAccessToken || '',
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
    result.push({
      ...extra,
      secretAccessEnabled: !!(extra?.secretAccessEnabled ?? extra?.extraConfig?.secretAccessEnabled ?? false),
      secretAccessDate: extra?.secretAccessDate || extra?.extraConfig?.secretAccessDate || '',
      secretAccessExpireDate: extra?.secretAccessExpireDate || extra?.extraConfig?.secretAccessExpireDate || getIsoDateFromTimestamp(extra?.secretAccessExpiresAt || extra?.extraConfig?.secretAccessExpiresAt) || '',
      secretAccessExpiresAt: extra?.secretAccessExpiresAt || extra?.extraConfig?.secretAccessExpiresAt || null,
      secretAccessToken: extra?.secretAccessToken || extra?.extraConfig?.secretAccessToken || ''
    })
  }

  return result.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
}
