import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'

/**
 * 학생 이름 마스킹 단계 (3단계 순환):
 * 0: MASK_MODES.LAST_ONLY (기본 디폴트) - 맨 뒤 한 글자만 표시 (예: "홍길동" -> "**동", "이민" -> "*민")
 * 1: MASK_MODES.FIRST_AND_LAST - 맨 앞글자(성)와 맨 뒷글자 표시 (예: "홍길동" -> "홍*동", 2글자는 성 가림 "고윤" -> "*윤", "남궁민수" -> "남**수")
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

  // 2단계: 맨 앞글자 성과 맨 뒷글자 표시 (단, 2글자 이름은 성 가림: '*윤')
  if (mode === MASK_MODES.FIRST_AND_LAST) {
    if (str.length <= 1) return '*'
    if (str.length === 2) return '*' + str[1]
    return str[0] + '*'.repeat(str.length - 2) + str[str.length - 1]
  }

  // 1단계(디폴트): 맨 뒤 한 글자만 보임 (단, 2글자 이름은 2글자 모두 '**'로 마스킹)
  if (str.length <= 1) return '*'
  if (str.length === 2) return '**'
  return '*'.repeat(str.length - 1) + str[str.length - 1]
}

export const adminMaskLabel = computed(() => {
  if (adminMaskMode.value === 0) return '마스킹: **동'
  if (adminMaskMode.value === 1) return '마스킹: 홍*동'
  return '이름 전체공개'
})

export const adminMaskTooltip = computed(() => {
  if (adminMaskMode.value === 0) {
    return '1단계 [기본 디폴트 마스킹]: 맨 뒷글자(**동)만 표시 (2글자 이름은 ** 전체 마스킹). 클릭 시 2단계(성과 맨뒷글자 총 2개 표시: 홍*동)로 전환됩니다.'
  }
  if (adminMaskMode.value === 1) {
    return '2단계 [부분 마스킹]: 성+맨뒷글자(홍*동, 2글자는 성 가림 *윤) 표시 중. 클릭 시 3단계(이름 전체 공개: 홍길동)로 전환됩니다.'
  }
  return '3단계 [이름 전체공개]: 모든 이름이 표시 중. 클릭 시 다시 1단계(디폴트 마스킹: **동)로 되돌아갑니다.'
})
