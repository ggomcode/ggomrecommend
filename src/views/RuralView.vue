<template>
  <!-- 1) 학생 로그인 시: 좌측 사이드바 없는 단순화된 top-header 전용 학생 화면 (학추 시스템 StudentView와 100% 동일) -->
  <div v-if="auth.isStudent" class="min-h-screen bg-slate-100 text-slate-800 font-sans transition-colors duration-300">
    <!-- 네비게이션 헤더 바 -->
    <header class="bg-white/90 border-b border-slate-200/80 sticky top-0 z-50 shadow-sm backdrop-blur-md">
      <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <div class="flex flex-col leading-tight">
            <span class="text-[11px] font-extrabold text-emerald-600 tracking-tight">{{ schoolName }}</span>
            <h1 class="text-base font-bold text-slate-900 m-0">농어촌(기회균형) 전형 추천 신청</h1>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <div class="text-right hidden sm:block">
            <p class="text-sm font-bold text-slate-700 m-0">
              {{ auth.studentName }} 
              <span class="text-xs font-medium text-slate-400">
                ({{ auth.isEnrolled ? `${auth.grade ?? (auth.studentCode?.length === 5 ? parseInt(auth.studentCode.substring(0, 1)) : 3)}학년 ${auth.classNo ?? (auth.studentCode?.length === 5 ? parseInt(auth.studentCode.substring(1, 3)) : '')}반 ${auth.seqNo ?? (auth.studentCode?.length === 5 ? parseInt(auth.studentCode.substring(3, 5)) : '')}번` : `${auth.gradYear}년 졸업생` }})
              </span>
            </p>
            <p class="text-xs text-slate-400 font-semibold m-0">학번: {{ auth.studentCode }}</p>
          </div>

          <button
            @click="showMyPageModal = true"
            class="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
          >
            👤 마이페이지
          </button>

          <button
            @click="goToPortal"
            class="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1"
          >
            🏠 포털 이동
          </button>

          <button
            @click="handleLogout"
            class="text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-lg transition-all cursor-pointer"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>

    <!-- 메인 신청 콘텐츠 영역 -->
    <main class="max-w-6xl mx-auto px-6 py-8">
      <Suspense>
        <RuralApplyTab />
        <template #fallback>
          <div class="flex items-center justify-center py-20 text-slate-500">
            <p class="text-base font-semibold">농어촌 전형 희망 지망 신청 로딩 중...</p>
          </div>
        </template>
      </Suspense>
    </main>

    <!-- 학생 마이페이지 모달 -->
    <div
      v-if="showMyPageModal"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div class="bg-slate-100 rounded-2xl max-w-4xl w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 class="text-base font-bold text-slate-900 m-0 flex items-center gap-2">
            👤 학생 마이페이지 (대입 희망 전형 설정 및 자격 서약)
          </h3>
          <button
            @click="showMyPageModal = false"
            class="text-slate-400 hover:text-slate-600 font-bold text-xl bg-transparent border-none cursor-pointer p-1"
          >
            ✕
          </button>
        </div>
        <Suspense>
          <RuralMyPageTab />
          <template #fallback>
            <div class="py-12 text-center text-slate-400">마이페이지 로딩 중...</div>
          </template>
        </Suspense>
      </div>
    </div>
  </div>

  <!-- 2) 교사/관리자 전용: 좌측 사이드바 관리자 화면 -->
  <div v-else class="flex h-screen overflow-hidden bg-slate-100 font-sans">
    <!-- 사이드바 -->
    <aside
      class="flex flex-col shrink-0 bg-white border-r border-slate-200 overflow-hidden transition-all duration-200 shadow-sm"
      :style="{ width: collapsed ? '64px' : '240px' }"
    >
      <!-- 로고 & 시스템명 -->
      <div class="flex items-center shrink-0 h-15 border-b border-slate-100 px-3 justify-between">
        <div v-if="!collapsed" class="flex items-center gap-2.5 whitespace-nowrap overflow-hidden">
          <div class="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-xs">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <div class="flex flex-col leading-tight">
            <span class="text-[11px] font-extrabold text-emerald-600 tracking-tight">{{ schoolName }}</span>
            <span class="text-sm font-bold text-slate-900 truncate">농어촌 추천 관리</span>
          </div>
        </div>
        <button
          @click="collapsed = !collapsed"
          class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer border-none bg-transparent"
        >
          <ChevronRight v-if="collapsed" :size="18" />
          <Menu v-else :size="18" />
        </button>
      </div>

      <!-- 내비게이션 메뉴 목록 -->
      <nav class="flex-1 overflow-y-auto p-2 space-y-1">
        <button
          v-for="item in sidebarMenus"
          :key="item.key"
          @click="active = item.key"
          :title="item.label"
          :class="[
            'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150 cursor-pointer border-none',
            active === item.key
              ? 'bg-emerald-50 text-emerald-700 font-bold shadow-xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium',
            collapsed ? 'justify-center px-0' : 'justify-start'
          ]"
        >
          <component :is="item.icon" :size="20" class="shrink-0" />
          <span v-if="!collapsed" class="whitespace-nowrap">{{ item.label }}</span>
        </button>
      </nav>

      <!-- 사이드바 하단 사용자 및 시스템 전환 -->
      <div class="p-3 border-t border-slate-200 shrink-0 bg-slate-50/50">
        <div v-if="collapsed" class="flex justify-center py-1">
          <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
            {{ userName.substring(0, 1) }}
          </div>
        </div>
        <div v-else class="space-y-3">
          <div>
            <p class="text-sm font-bold text-slate-900 m-0">{{ userName }}</p>
            <p class="text-xs text-slate-500 font-medium m-0 mt-0.5">{{ roleLabel }}</p>
          </div>
          <div class="pt-2 border-t border-slate-200/80 flex flex-col gap-1.5">
            <button
              @click="switchToPrincipalSystem"
              class="w-full text-left text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 py-1 transition-colors cursor-pointer bg-transparent border-none"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
              학교장 추천 시스템
            </button>
            <button
              @click="goToPortal"
              class="w-full text-left text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 py-1 transition-colors cursor-pointer bg-transparent border-none"
            >
              <Home :size="14" /> 포털 (시스템 선택)
            </button>
            <button
              @click="handleLogout"
              class="w-full text-left text-xs font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1.5 py-1 transition-colors cursor-pointer bg-transparent border-none"
            >
              <LogOut :size="14" /> 로그아웃
            </button>
          </div>
        </div>
      </div>
    </aside>

    <!-- 메인 콘텐츠 영역 -->
    <main class="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden bg-slate-100">
      <!-- 상단 헤더 -->
      <header class="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0 shadow-2xs">
        <div class="flex items-center gap-2">
          <h1 class="text-base font-bold text-slate-900 m-0">농어촌 전형 추천자 관리 시스템</h1>
          <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            기회균형 포함
          </span>
        </div>
        <div class="text-xs font-bold text-slate-500">
          {{ schoolName }}
        </div>
      </header>

      <div class="p-6 flex-1 min-h-0 flex flex-col overflow-y-auto">
        <Transition name="tab-fade" mode="out-in">
          <div :key="active" class="flex-1 min-h-0 flex flex-col">
            <Suspense v-if="active === 'tracks'">
              <RuralTracksTab />
              <template #fallback>
                <div class="flex items-center justify-center py-20 text-slate-500">
                  <p class="text-base font-semibold">모집요강 전형 데이터 로딩 중...</p>
                </div>
              </template>
            </Suspense>

            <Suspense v-else-if="active === 'applications'">
              <RuralApplicationsTab />
              <template #fallback>
                <div class="flex items-center justify-center py-20 text-slate-500">
                  <p class="text-base font-semibold">학생 신청 현황 & 대장 로딩 중...</p>
                </div>
              </template>
            </Suspense>

            <Suspense v-else-if="active === 'academic'">
              <RuralTab />
              <template #fallback>
                <div class="flex items-center justify-center py-20 text-slate-500">
                  <p class="text-base font-semibold">학적 및 자격 검증 데이터 로딩 중...</p>
                </div>
              </template>
            </Suspense>

            <Suspense v-else-if="active === 'settings'">
              <RuralSettingsTab />
              <template #fallback>
                <div class="flex items-center justify-center py-20 text-slate-500">
                  <p class="text-base font-semibold">환경설정 로딩 중...</p>
                </div>
              </template>
            </Suspense>
          </div>
        </Transition>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { schoolName, fetchSchoolName } from '../utils/schoolConfig'
import { safeAsyncComponent } from '../utils/asyncComponent'
import { FileSpreadsheet, BookOpen, PenTool, Users, Settings, ChevronRight, Menu, Home, LogOut, User } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

import RuralTab from '../components/teacher/RuralTab.vue'
import RuralTracksTab from '../components/rural/RuralTracksTab.vue'
import RuralApplyTab from '../components/rural/RuralApplyTab.vue'
import RuralApplicationsTab from '../components/rural/RuralApplicationsTab.vue'
import RuralSettingsTab from '../components/rural/RuralSettingsTab.vue'
import RuralMyPageTab from '../components/rural/RuralMyPageTab.vue'

const collapsed = ref(false)
const showMyPageModal = ref(false)

const sidebarMenus = computed(() => {
  return [
    { key: 'tracks', label: '전형 요강 관리', icon: BookOpen },
    { key: 'academic', label: '학적 및 자격 검증', icon: FileSpreadsheet },
    { key: 'applications', label: '신청 현황 & 대장', icon: Users },
    { key: 'settings', label: '환경설정', icon: Settings }
  ]
})

const active = ref('tracks')

onMounted(() => {
  fetchSchoolName()
  if (route.query.tab) {
    active.value = route.query.tab
  } else if (!auth.isStudent) {
    active.value = 'tracks'
  }
})

const userName = computed(() => {
  if (auth.isAdmin) return '관리자'
  if (auth.isTeacher) return auth.user?.user_metadata?.name || auth.teacherName || '선생님'
  if (auth.isStudent) return auth.studentName || '학생'
  return '사용자'
})

const roleLabel = computed(() => {
  if (auth.isAdmin) return '시스템 관리자'
  if (auth.isTeacher) return '담임 교사'
  if (auth.isStudent) return auth.isEnrolled ? '재학생' : '졸업생'
  return ''
})

function switchToPrincipalSystem() {
  if (auth.isAdmin) router.push('/admin')
  else if (auth.isTeacher) router.push('/teacher')
  else if (auth.isStudent) router.push('/student')
  else router.push('/login')
}

function goToPortal() {
  router.push('/select-system')
}

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.tab-fade-enter-active { transition: opacity 0.18s ease; }
.tab-fade-leave-active { transition: opacity 0.10s ease; }
.tab-fade-enter-from,
.tab-fade-leave-to { opacity: 0; }
</style>
