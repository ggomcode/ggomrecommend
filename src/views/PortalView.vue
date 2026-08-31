<template>
  <div class="min-h-screen bg-slate-100 text-slate-800 font-sans flex flex-col justify-between transition-colors">
    
    <!-- 상단 헤더 (라이트 모드 고정) -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <div class="flex flex-col leading-tight">
            <span class="text-xs font-bold text-blue-600 tracking-wide">{{ schoolName }}</span>
            <h1 class="text-base font-bold text-slate-900 m-0">추천자 관리 포털</h1>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <div class="text-right hidden sm:block">
            <p class="text-sm font-bold text-slate-800 m-0">
              {{ userName }}
              <span class="text-xs font-semibold px-2 py-0.5 rounded-full ml-1" :class="roleBadgeClass">
                {{ roleLabel }}
              </span>
            </p>
            <p v-if="userSubInfo" class="text-xs text-slate-500 font-semibold m-0 mt-0.5">{{ userSubInfo }}</p>
          </div>
          <button
            @click="handleLogout"
            class="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-lg transition-all cursor-pointer border border-slate-200"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>

    <!-- 로딩 중 화면 (자격 점검 완료 시까지 메인 제목 및 버튼 전면 숨김) -->
    <main v-if="isPortalLoading" class="max-w-5xl mx-auto px-6 py-24 flex-1 flex flex-col justify-center items-center">
      <div class="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl border border-slate-200 shadow-md">
        <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-sm font-bold text-slate-700 m-0">추천 시스템 정보 및 학생 자격을 점검 중입니다...</p>
      </div>
    </main>

    <!-- 자격 점검 완료 후 메인 콘텐츠 전체 일괄 표출 -->
    <main v-else class="max-w-5xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center items-center">
      <div class="text-center max-w-2xl mb-12">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mb-3 border border-blue-200">
          <span>{{ isRuralSystemEnabled ? '통합 추천자 관리 시스템' : '학교장 추천자 선발 시스템' }}</span>
        </div>
        <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          {{ schoolName }} 추천 시스템 포털
        </h2>
        <p class="text-base text-slate-600 leading-relaxed">
          이용하실 추천 시스템을 아래에서 선택해 주세요.
        </p>
      </div>

      <!-- 시스템 선택 카드 뷰 -->
      <div :class="['grid gap-8 w-full', portalGridClass]">
        
        <!-- 카드 1: 학교장 추천자 선발 시스템 -->
        <div
          @click="enterPrincipalSystem"
          class="group relative bg-white rounded-3xl p-8 border border-slate-200/80 shadow-md hover:shadow-xl hover:border-blue-500 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <!-- 카드 호버 그라데이션 장식 -->
          <div class="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>

          <div>
            <div class="flex items-center justify-between mb-6">
              <div class="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm border border-blue-100">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
              </div>
              <span
                :class="[
                  'px-3 py-1 rounded-full text-xs font-bold shadow-xs',
                  principalPeriodState === 'OPEN'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : (principalPeriodState === 'DRAFT'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : (principalPeriodState === 'CLOSED'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'))
                ]"
              >
                {{ principalStatusText }}
              </span>
            </div>

            <div class="inline-block px-2.5 py-1 rounded-md text-xs font-extrabold bg-blue-100 text-blue-700 mb-3">
              전국 대입
            </div>

            <h3 class="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-3">
              학교장 추천자 선발 시스템
            </h3>
            
            <p class="text-sm text-slate-600 leading-relaxed">
              주요 대학 학교장추천전형(지역균형) 신청서 제출, 대학별 정원 관리, 교내 석차 심의 및 최종 추천 확정을 관리합니다.
            </p>
          </div>

          <div class="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-sm font-bold text-blue-600">
            <span>시스템 바로가기</span>
            <svg class="w-5 h-5 group-hover:translate-x-1.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>

        <!-- 카드 2: 농어촌 전형 추천자 관리 시스템 -->
        <div
          v-if="isRuralSystemEnabled"
          @click="enterRuralSystem"
          :class="[
            'group relative bg-white rounded-3xl p-8 border shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer',
            (!auth.isStudent || isRuralEligible)
              ? 'border-slate-200/80 hover:shadow-xl hover:border-emerald-500'
              : 'border-amber-300 bg-amber-50/40 opacity-70 hover:opacity-100 hover:border-amber-400'
          ]"
        >
          <div class="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>

          <div>
            <div class="flex items-center justify-between mb-6">
              <div
                :class="[
                  'w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm border',
                  (!auth.isStudent || isRuralEligible)
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white'
                    : 'bg-amber-100 text-amber-700 border-amber-200'
                ]"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
              </div>
              <span
                :class="[
                  'px-3 py-1 rounded-full text-xs font-bold shadow-xs',
                  (!auth.isStudent || isRuralEligible)
                    ? (isRuralSystemOpen
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : (ruralPeriodState === 'before' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-700 border border-slate-200'))
                    : 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold'
                ]"
              >
                <template v-if="auth.isStudent && !isRuralEligible">🔒 농어촌 대상 자격 미달</template>
                <template v-else>{{ ruralStatusText }}</template>
              </span>
            </div>

            <div class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-extrabold bg-emerald-100 text-emerald-800 mb-3">
              <span>기회균형 포함</span>
            </div>

            <h3 class="text-2xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors mb-3">
              농어촌 전형 추천자 관리 시스템
            </h3>
            
            <p class="text-sm text-slate-600 leading-relaxed">
              기회균형 내 농어촌 특별전형 자격 검증, 지원 희망자 배정 관리 및 거주 요건 이력을 통합 관리합니다.
            </p>
          </div>

          <div
            :class="[
              'mt-8 pt-6 border-t flex items-center justify-between text-sm font-bold',
              (!auth.isStudent || isRuralEligible)
                ? 'border-slate-100 text-emerald-600'
                : 'border-amber-200 text-amber-800 font-extrabold'
            ]"
          >
            <span>
              <template v-if="auth.isStudent && !isRuralEligible">⚠️ 농어촌 대상 자격 미달 (진입 시 확인 필요)</template>
              <template v-else>시스템 바로가기</template>
            </span>
            <svg class="w-5 h-5 group-hover:translate-x-1.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>

        <!-- 카드 3: 수능 미응시 및 수시 미접수 등록 시스템 (재학생/교사/관리자만 표시, 졸업생 미노출) -->
        <div
          v-if="showExamIntentCard"
          @click="enterExamIntentSystem"
          class="group relative bg-white rounded-3xl p-8 border border-slate-200/80 shadow-md hover:shadow-xl hover:border-violet-500 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <div class="absolute -top-20 -right-20 w-40 h-40 bg-violet-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>

          <div>
            <div class="flex items-center justify-between mb-6">
              <div class="w-16 h-16 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-all duration-300 shadow-sm border border-violet-100">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l3.58-3.58c.94-.94.94-2.48 0-3.42L9 5Z"/>
                  <path d="M6 9.01V9"/>
                </svg>
              </div>
              <span class="px-3 py-1 rounded-full text-xs font-bold shadow-xs bg-violet-100 text-violet-800 border border-violet-200">
                재학생 전수 조사
              </span>
            </div>

            <div class="inline-block px-2.5 py-1 rounded-md text-xs font-extrabold bg-violet-100 text-violet-700 mb-3">
              진학 관리
            </div>

            <h3 class="text-2xl font-bold text-slate-900 group-hover:text-violet-600 transition-colors mb-3">
              수능 · 수시 응시 등록
            </h3>
            
            <p class="text-sm text-slate-600 leading-relaxed">
              수능 응시 여부 및 대학 수시원서 접수 여부 자가 등록, 미응시/미접수 확인서 출력 및 수능 접수대장 대조 관리를 수행합니다.
            </p>
          </div>

          <div class="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-sm font-bold text-violet-600">
            <span>시스템 바로가기</span>
            <svg class="w-5 h-5 group-hover:translate-x-1.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>
      </div>
    </main>

    <!-- 하단 푸터 -->
    <footer class="py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
      <p>© {{ new Date().getFullYear() }} {{ schoolName }} 대입 추천 관리 포털</p>
    </footer>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { schoolName, fetchSchoolName } from '../utils/schoolConfig'
import { checkRuralSystemOpenStatus, getRuralEligibilityList } from '../api/ruralApi'
import { checkExamIntentSystemEnabled } from '../api/examIntentApi'
import { supabase } from '../utils/supabaseClient'
import { fetchRoundSchedulesMap, computeRoundDisplayStatus } from '../utils/roundSchedule'
import { dialog } from '../components/common/dialog'

const router = useRouter()
const auth = useAuthStore()

const principalPeriodState = ref('OPEN')
const principalStatusText = ref('🟢 접수 진행 중')

const isRuralSystemOpen = ref(true)
const isRuralSystemEnabled = ref(false)
const isExamIntentSystemEnabled = ref(localStorage.getItem('pcm_enable_exam_intent_system') !== 'false')
const activeRuralTerm = ref('수시')
const ruralClosedReason = ref('')
const ruralPeriodState = ref('open')
const ruralStatusText = ref('🟢 접수 진행 중 (수시)')
const isRuralEligible = ref(false)
const studentApplyRural = ref(true)
const isPortalLoading = ref(true)

const userName = computed(() => {
  if (auth.isAdmin) return '관리자'
  if (auth.isTeacher) return auth.user?.user_metadata?.name || '선생님'
  if (auth.isStudent) return auth.studentName || '학생'
  return '사용자'
})

const roleLabel = computed(() => {
  if (auth.isAdmin) return '시스템 관리자'
  if (auth.isTeacher) return '담임 교사'
  if (auth.isStudent) return auth.isEnrolled ? '재학생' : '졸업생'
  return ''
})

const roleBadgeClass = computed(() => {
  if (auth.isAdmin) return 'bg-purple-100 text-purple-700'
  if (auth.isTeacher) return 'bg-emerald-100 text-emerald-700'
  return 'bg-blue-100 text-blue-700'
})

const userSubInfo = computed(() => {
  if (auth.isStudent) {
    if (!auth.isEnrolled) {
      return `${auth.gradYear || ''}년 졸업생 (${auth.studentCode})`
    }
    const codeStr = String(auth.studentCode || '')
    const displayGrade = auth.grade ?? (codeStr.length === 5 ? parseInt(codeStr.substring(0, 1)) : 3)
    const displayClass = auth.classNo ?? (codeStr.length === 5 ? parseInt(codeStr.substring(1, 3)) : '')
    return `${displayGrade}학년 ${displayClass}반 (${auth.studentCode})`
  }
  return null
})

// 수능/수시 등록 시스템 카드 노출 여부 (시스템 활성화 && (재학생 + 교사 + 관리자만, 졸업생 미노출))
const showExamIntentCard = computed(() => {
  if (!isExamIntentSystemEnabled.value) return false
  if (auth.isAdmin || auth.isTeacher) return true
  if (auth.isStudent && auth.isEnrolled) return true
  return false
})

// 그리드 레이아웃 클래스 (카드 수에 따라 동적 조정)
const portalGridClass = computed(() => {
  const cardCount = 1 + (isRuralSystemEnabled.value ? 1 : 0) + (showExamIntentCard.value ? 1 : 0)
  if (cardCount >= 3) return 'grid-cols-1 md:grid-cols-3 max-w-6xl'
  if (cardCount === 2) return 'grid-cols-1 md:grid-cols-2 max-w-4xl'
  return 'grid-cols-1 max-w-xl'
})

function enterPrincipalSystem() {
  if (auth.isAdmin) router.push('/admin')
  else if (auth.isTeacher) router.push('/teacher')
  else if (auth.isStudent) router.push('/student')
  else router.push('/login')
}

async function enterExamIntentSystem() {
  if (isPortalLoading.value) return
  if (!isExamIntentSystemEnabled.value) {
    await dialog.alert({ title: '시스템 이용 제한', message: '수능 · 수시 응시 등록 시스템이 현재 비활성화되어 있습니다.' })
    return
  }
  if (auth.isStudent) router.push('/exam-intent')
  else router.push('/exam-intent-manage')
}

async function enterRuralSystem() {
  if (isPortalLoading.value) return
  if (!isRuralSystemEnabled.value) {
    await dialog.alert({ title: '시스템 이용 제한', message: '농어촌 전형 추천자 관리 시스템이 현재 비활성화되어 있습니다.' })
    return
  }

  // 농어촌 대상 자격 미달 학생인 경우 진입 확인 모달 표출
  if (auth.isStudent && !isRuralEligible.value) {
    const confirmed = await dialog.confirm({
      title: '⚠️ 농어촌 전형 자격 미확인 안내',
      message: '학생분의 농어촌 전형 자격 검증 결과 [농어촌 대상 자격 미달/미확인] 상태입니다.\n\n그래도 농어촌 추천자 관리 시스템에 진입하시겠습니까?',
      confirmText: '진입하기',
      cancelText: '취소'
    })
    if (confirmed) {
      router.push('/rural')
    }
    return
  }

  router.push('/rural')
}

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}

async function loadPrincipalStatus() {
  try {
    let totalRounds = 3
    if (supabase) {
      const { data: cfg } = await supabase.from('config').select('value').eq('key', 'total_rounds').maybeSingle()
      if (cfg && cfg.value) totalRounds = parseInt(cfg.value, 10) || 3
    }
    const schedulesMap = await fetchRoundSchedulesMap()
    let roundsList = []
    if (supabase) {
      const { data, error } = await supabase
        .from('timeline_rounds')
        .select('*')
        .order('id', { ascending: true })
      if (!error && data && data.length > 0) {
        roundsList = data
      }
    }

    if (roundsList.length === 0) {
      for (let i = 1; i <= totalRounds; i++) {
        roundsList.push({ id: i, status: 'DRAFT' })
      }
    }

    const processedRounds = roundsList.map(r => {
      const sched = schedulesMap[r.id]
      const dispStatus = computeRoundDisplayStatus(r, sched)
      return {
        ...r,
        computedStatus: dispStatus
      }
    })

    // 1. 접수 진행 중인 라운드
    const openRound = processedRounds.find(r => r.computedStatus === 'OPEN')
    if (openRound) {
      principalPeriodState.value = 'OPEN'
      principalStatusText.value = totalRounds === 1 ? '🟢 접수 진행 중' : `🟢 접수 진행 중 (${openRound.id}차)`
      return
    }

    // 2. 심사 진행 중인 라운드
    const closedRound = processedRounds.find(r => r.computedStatus === 'CLOSED')
    if (closedRound) {
      principalPeriodState.value = 'CLOSED'
      principalStatusText.value = totalRounds === 1 ? '🟡 심사 진행 중' : `🟡 심사 진행 중 (${closedRound.id}차)`
      return
    }

    // 3. 접수 전(DRAFT) 상태인 라운드
    const draftRound = processedRounds.find(r => r.computedStatus === 'DRAFT')
    if (draftRound) {
      principalPeriodState.value = 'DRAFT'
      principalStatusText.value = totalRounds === 1 ? '⚪ 접수 전' : `⚪ 접수 전 (${draftRound.id}차)`
      return
    }

    // 4. 모든 라운드 마감(FINALIZED)
    const finalizedRounds = processedRounds.filter(r => r.computedStatus === 'FINALIZED')
    if (finalizedRounds.length === processedRounds.length) {
      principalPeriodState.value = 'FINALIZED'
      principalStatusText.value = '🔒 최종 마감'
      return
    }

    principalPeriodState.value = 'DRAFT'
    principalStatusText.value = '⚪ 접수 전'
  } catch (e) {
    console.warn('Failed to load principal status:', e)
    principalPeriodState.value = 'OPEN'
    principalStatusText.value = '🟢 접수 진행 중'
  }
}

onMounted(async () => {
  fetchSchoolName()
  isPortalLoading.value = true
  try {
    await Promise.all([
      loadPrincipalStatus(),
      (async () => {
        isExamIntentSystemEnabled.value = await checkExamIntentSystemEnabled()
      })(),
      (async () => {
        const status = await checkRuralSystemOpenStatus()
        isRuralSystemEnabled.value = status.isEnabled === true
        isRuralSystemOpen.value = status.isOpen
        activeRuralTerm.value = status.activeTerm
        ruralClosedReason.value = status.reason
        ruralPeriodState.value = status.periodState || 'open'
        ruralStatusText.value = status.statusText || '🟢 접수 진행 중 (수시)'

        if (auth.isStudent) {
          const studentId = auth.user?.id || auth.userId || auth.studentId
          const sCode = auth.studentCode ? String(auth.studentCode).trim() : null
          const list = await getRuralEligibilityList()
          const myInfo = list.find(s =>
            (studentId && (s.id === studentId || s.user_id === studentId)) ||
            (sCode && s.student_code && String(s.student_code).trim() === sCode)
          )

          if (myInfo) {
            const elig = myInfo.eligibility
            const isEligible = Boolean(myInfo.is_rural_eligible || elig?.is_eligible || elig?.is_manual_approved)
            isRuralEligible.value = isEligible
            studentApplyRural.value = isEligible
          } else {
            isRuralEligible.value = false
            studentApplyRural.value = false
          }
        } else {
          isRuralEligible.value = true
          studentApplyRural.value = true
        }
      })()
    ])
  } catch (e) {
    console.warn('Failed to load portal data:', e)
    isRuralEligible.value = false
  } finally {
    isPortalLoading.value = false
  }
})
</script>
