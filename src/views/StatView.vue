<template>
  <div class="flex h-screen overflow-hidden" style="background: #eeecea;">

    <!-- 사이드바 (학추 시스템 스타일) -->
    <aside
      class="flex flex-col shrink-0 bg-white overflow-hidden z-30"
      :style="{
        width: collapsed ? '64px' : '240px',
        borderRight: '1px solid #d4d0cc',
        transition: 'width 0.2s ease',
      }"
    >
      <!-- 로고 + 접기/펼치기 버튼 -->
      <div
        class="flex items-center shrink-0"
        :style="{
          height: '60px',
          borderBottom: '1px solid #f1f5f9',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '0' : '0 14px 0 16px',
        }"
      >
        <div v-if="!collapsed" class="flex items-center gap-2 whitespace-nowrap">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-xs shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <line x1="18" y1="20" x2="18" y2="10" stroke-width="2.2" stroke-linecap="round"></line>
              <line x1="12" y1="20" x2="12" y2="4" stroke-width="2.2" stroke-linecap="round"></line>
              <line x1="6" y1="20" x2="6" y2="14" stroke-width="2.2" stroke-linecap="round"></line>
            </svg>
          </div>
          <div class="flex flex-col leading-tight">
            <span class="text-[10px] font-extrabold text-blue-600 tracking-tight">{{ schoolName }}</span>
            <span class="text-sm font-black text-slate-900 tracking-tight">수시 지원 통계 시스템</span>
          </div>
        </div>

        <button
          @click="collapsed = !collapsed"
          class="flex items-center justify-center p-1.5 rounded-md hover:bg-slate-100 transition-colors"
          style="background: none; border: none; cursor: pointer; color: #94a3b8;"
          :title="collapsed ? '메뉴 펼치기' : '메뉴 접기'"
        >
          <ChevronRight v-if="collapsed" :size="18" />
          <Menu v-else :size="18" />
        </button>
      </div>

      <!-- 메뉴 내비게이션 (학추 시스템 스타일) -->
      <nav class="flex-1 overflow-y-auto" style="padding: 10px 8px; display: flex; flex-direction: column; gap: 2px;">
        <button
          v-for="item in tabs"
          :key="item.id"
          @click="currentTab = item.id"
          :title="item.name"
          class="w-full rounded-lg text-sm transition-all duration-150"
          :style="{
            display: 'flex',
            alignItems: 'center',
            gap: collapsed ? '0' : '10px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '10px 0' : '9px 12px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: currentTab === item.id ? '700' : '500',
            color: currentTab === item.id ? '#1d4ed8' : '#64748b',
            background: currentTab === item.id ? '#eff6ff' : 'transparent',
          }"
        >
          <span class="relative shrink-0 flex items-center justify-center">
            <component 
              :is="item.iconComponent" 
              :size="19" 
              :style="{ color: currentTab === item.id ? '#1d4ed8' : undefined }" 
            />
            <span
              v-if="item.badge && collapsed"
              class="absolute -top-1.5 -right-2 flex h-3.5 min-w-[14px] px-0.5 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white shadow"
            >
              {{ item.badge }}
            </span>
          </span>

          <span v-if="!collapsed" class="whitespace-nowrap flex items-center justify-between w-full">
            <span>{{ item.name }}</span>
            <span
              v-if="item.badge"
              :class="[
                'ml-auto text-[10px] font-bold px-1.5 py-0.2 rounded-full',
                currentTab === item.id ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              ]"
            >
              {{ item.badge }}
            </span>
          </span>
        </button>
      </nav>

      <!-- 사이드바 하단 정보 & 액션 버튼 -->
      <div class="p-3 border-t border-slate-200 shrink-0 bg-slate-50/50">
        <!-- 접힘: 아바타 -->
        <div v-if="collapsed" class="flex justify-center py-1">
          <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
            {{ auth.isAdmin ? '관' : '교' }}
          </div>
        </div>

        <!-- 펼침 -->
        <div v-else class="space-y-2.5">
          <!-- 학년도 표시 배지 -->
          <div class="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white border border-slate-200/90 shadow-2xs">
            <span class="text-[11px] text-slate-500 font-medium">분석 기준</span>
            <span class="text-[11px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
              {{ selectedAcademicYear }}학년도 대입
            </span>
          </div>

          <!-- 사용자 정보 -->
          <div class="px-0.5">
            <p class="text-sm font-bold text-slate-900 m-0 leading-tight">
              {{ auth.isAdmin ? '관리자' : (auth.teacherName || auth.user?.user_metadata?.name || '교과 교사') }}
            </p>
            <p class="text-xs text-slate-500 font-medium m-0 mt-0.5">
              {{ auth.isAdmin ? '시스템 관리자' : '통계 열람 권한' }}
            </p>
          </div>

          <!-- 액션 링크 -->
          <div class="pt-2 border-t border-slate-200/80 flex flex-col gap-1">
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
      <!-- 상단 헤더 배너 (고정, 학추 시스템 헤더 규격) -->
      <StatHeader :currentTabItem="currentTabItem" />

      <!-- 필터 바 (상단 고정) -->
      <StatFilterBar />

      <!-- 스크롤 가능한 본문 영역 -->
      <div class="flex-1 min-h-0 flex flex-col overflow-y-auto" style="scrollbar-gutter: stable;">
        <div class="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <Transition name="fade" mode="out-in">
            <component :is="activeTabComponent" />
          </Transition>
        </div>

        <!-- 하단 푸터 -->
        <footer class="bg-white border-t border-slate-200 py-5 mt-auto text-xs text-slate-500 no-print">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div>
              <span class="font-bold text-slate-700">{{ schoolName }}</span>
              <span class="mx-1.5">•</span>
              <span>{{ selectedAcademicYear }}학년도 대입 수시 지원 통계 분석 시스템 (꼼스탯)</span>
            </div>
            <div class="text-slate-400">
              <span>대교협 수시 원서접수 자료 연계</span>
            </div>
          </div>
        </footer>
      </div>
    </main>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import StatHeader from '../stat/components/StatHeader.vue'
import StatFilterBar from '../stat/components/StatFilterBar.vue'
import OverviewTab from '../stat/components/tabs/OverviewTab.vue'
import MultiYearTab from '../stat/components/tabs/MultiYearTab.vue'
import UniversityTab from '../stat/components/tabs/UniversityTab.vue'
import GradeTab from '../stat/components/tabs/GradeTab.vue'
import CalendarTab from '../stat/components/tabs/CalendarTab.vue'
import StudentTab from '../stat/components/tabs/StudentTab.vue'
import DataExplorerTab from '../stat/components/tabs/DataExplorerTab.vue'
import PrintReportTab from '../stat/components/tabs/PrintReportTab.vue'
import { useStatData } from '../stat/composables/useStatData'
import { schoolName } from '../utils/schoolConfig'
import {
  BarChart3,
  TrendingUp,
  Building2,
  Target,
  CalendarDays,
  Users,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  Menu,
  Home,
  LogOut
} from 'lucide-vue-next'

const router = useRouter()
const auth = useAuthStore()
const { selectedAcademicYear } = useStatData()

// 사이드바 접기/펼치기 상태
const collapsed = ref(false)
const currentTab = ref('overview')

const tabs = [
  { id: 'overview', name: '종합 통계', iconComponent: BarChart3 },
  { id: 'multiYear', name: '5개년 비교 분석', iconComponent: TrendingUp, badge: 'NEW' },
  { id: 'university', name: '대학별 분석', iconComponent: Building2 },
  { id: 'grade', name: '성적대별 경향', iconComponent: Target },
  { id: 'calendar', name: '면접·고사 캘린더', iconComponent: CalendarDays },
  { id: 'student', name: '학생별 6장 카드', iconComponent: Users },
  { id: 'data', name: '전체 데이터 탐색기', iconComponent: FileSpreadsheet, badge: '1,376' },
  { id: 'report', name: '공식 인쇄 보고서', iconComponent: Printer }
]

const currentTabItem = computed(() => {
  return tabs.find(t => t.id === currentTab.value) || tabs[0]
})

const activeTabComponent = computed(() => {
  switch (currentTab.value) {
    case 'overview': return OverviewTab
    case 'multiYear': return MultiYearTab
    case 'university': return UniversityTab
    case 'grade': return GradeTab
    case 'calendar': return CalendarTab
    case 'student': return StudentTab
    case 'data': return DataExplorerTab
    case 'report': return PrintReportTab
    default: return OverviewTab
  }
})

function goToPortal() {
  router.push('/select-system')
}

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
