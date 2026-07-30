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

    <!-- 메인 콘텐츠 영역 -->
    <main class="max-w-5xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center items-center">
      <div class="text-center max-w-2xl mb-12">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mb-3 border border-blue-200">
          <span>통합 추천자 관리 시스템</span>
        </div>
        <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          {{ schoolName }} 추천 시스템 포털
        </h2>
        <p class="text-base text-slate-600 leading-relaxed">
          이용하실 추천 시스템을 아래에서 선택해 주세요.
        </p>
      </div>

      <!-- 시스템 선택 2개 카드 뷰 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        
        <!-- 카드 1: 학교장 추천자 선발 시스템 -->
        <div
          @click="enterPrincipalSystem"
          class="group relative bg-white rounded-3xl p-8 border border-slate-200/80 shadow-md hover:shadow-xl hover:border-blue-500 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <!-- 카드 호버 그라데이션 장식 -->
          <div class="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>

          <div>
            <div class="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm border border-blue-100">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>

            <div class="inline-block px-2.5 py-1 rounded-md text-xs font-extrabold bg-blue-100 text-blue-700 mb-3">
              수도권 및 전국 대입
            </div>

            <h3 class="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-3">
              학교장 추천자 선발 시스템
            </h3>
            
            <p class="text-sm text-slate-600 leading-relaxed">
              수도권 및 주요 대학 학교장추천전형(지역균형) 신청서 제출, 대학별 정원 관리, 교내 석차 심의 및 최종 추천 확정을 관리합니다.
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
          @click="showRuralNotice = true"
          class="group relative bg-white rounded-3xl p-8 border border-slate-200/80 shadow-md hover:shadow-xl hover:border-emerald-500 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <div class="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>

          <div>
            <div class="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm border border-emerald-100">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </div>

            <div class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-extrabold bg-emerald-100 text-emerald-800 mb-3">
              <span>기회균형 포함</span>
              <span class="ml-1 text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded">오픈 예정</span>
            </div>

            <h3 class="text-2xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors mb-3">
              농어촌 전형 추천자 관리 시스템
            </h3>
            
            <p class="text-sm text-slate-600 leading-relaxed">
              기회균형 내 농어촌 특별전형 자격 검증, 지원 희망자 배정 관리 및 거주 요건 이력을 통합 관리합니다.
            </p>
          </div>

          <div class="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-sm font-bold text-emerald-600">
            <span>시스템 안내 보기</span>
            <svg class="w-5 h-5 group-hover:translate-x-1.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>

      </div>
    </main>

    <!-- 하단 푸터 -->
    <footer class="py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
      <p>© {{ new Date().getFullYear() }} {{ schoolName }} 학교장 추천자 선발 및 농어촌 전형 추천자 관리 시스템</p>
    </footer>

    <!-- 농어촌 전형 시스템 준비 중 모달 -->
    <div
      v-if="showRuralNotice"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      @click.self="showRuralNotice = false"
      @keydown.escape.window="showRuralNotice = false"
    >
      <div class="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center relative overflow-hidden">
        <div class="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="6" width="20" height="12" rx="2"/>
            <path d="M12 12h.01"/>
            <path d="M17 12h.01"/>
            <path d="M7 12h.01"/>
          </svg>
        </div>

        <h3 class="text-xl font-bold text-slate-900 mb-2">
          농어촌 전형 추천자 관리 시스템
        </h3>
        
        <p class="text-sm text-slate-600 leading-relaxed mb-6">
          기회균형 및 농어촌 특별전형 추천자 관리 기능은 현재 <strong>오픈 준비 중</strong>입니다.<br>
          학교장 추천자 선발 시스템을 이용하시려면 첫 번째 메뉴를 선택해 주세요.
        </p>

        <button
          @click="showRuralNotice = false"
          class="w-full py-3 px-6 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors cursor-pointer border-none"
        >
          확인
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { schoolName, fetchSchoolName } from '../utils/schoolConfig'

const router = useRouter()
const auth = useAuthStore()

const showRuralNotice = ref(false)

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
    return auth.isEnrolled
      ? `${auth.grade}학년 ${auth.classNo}반 (${auth.studentCode})`
      : `${auth.gradYear}년 졸업생 (${auth.studentCode})`
  }
  return null
})

function enterPrincipalSystem() {
  if (auth.isAdmin) router.push('/admin')
  else if (auth.isTeacher) router.push('/teacher')
  else if (auth.isStudent) router.push('/student')
  else router.push('/login')
}

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}

onMounted(() => {
  fetchSchoolName()
})
</script>
