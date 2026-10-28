<template>
  <div class="flex h-screen overflow-hidden" style="background: #eeecea;">

    <!-- 사이드바 (학추 시스템 스타일) -->
    <aside
      class="flex flex-col shrink-0 bg-white overflow-hidden z-30 no-print"
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
            <span class="text-sm font-black text-slate-900 tracking-tight">대입 통계 시스템</span>
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

      <!-- 메뉴 내비게이션 (그룹화된 4대 섹션 메뉴) -->
      <nav class="flex-1 overflow-y-auto px-2 py-3 space-y-3" style="scrollbar-gutter: stable;">
        <div v-for="(group, gIdx) in menuGroups" :key="group.title" class="space-y-0.5">
          <!-- 섹션 헤더 (펼침 상태) -->
          <div 
            v-if="!collapsed" 
            class="px-2.5 pt-1.5 pb-1 text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 select-none"
          >
            <span>{{ group.emoji }}</span>
            <span>{{ group.title }}</span>
          </div>

          <!-- 섹션 구분선 (접힘 상태) -->
          <div v-else-if="gIdx > 0" class="my-2 border-t border-slate-200/80 mx-1"></div>

          <!-- 메뉴 아이템 목록 -->
          <button
            v-for="item in group.items"
            :key="item.id"
            @click="currentTab = item.id"
            :title="collapsed ? `${group.title} > ${item.name}` : item.name"
            class="w-full rounded-xl text-xs transition-all duration-150 relative cursor-pointer border-none text-left"
            :class="[
              collapsed ? 'p-2.5 flex justify-center items-center' : 'px-3 py-2 flex items-center gap-2.5',
              currentTab === item.id 
                ? 'bg-blue-50 text-blue-700 font-bold shadow-2xs' 
                : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
            ]"
          >
            <!-- 활성 탭 좌측 인디케이터 바 -->
            <span 
              v-if="currentTab === item.id && !collapsed" 
              class="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-blue-600"
            ></span>

            <!-- 아이콘 & 접힘 시 배지 -->
            <span class="relative shrink-0 flex items-center justify-center">
              <component 
                :is="item.iconComponent" 
                :size="18" 
                :class="currentTab === item.id ? 'text-blue-600' : 'text-slate-400'" 
              />
              <span
                v-if="item.badge && collapsed"
                class="absolute -top-1.5 -right-2 flex h-3.5 min-w-[14px] px-0.5 items-center justify-center rounded-full bg-blue-600 text-[9px] font-black text-white shadow"
              >
                {{ item.badge }}
              </span>
            </span>

            <!-- 레이블 & 펼침 시 배지 -->
            <span v-if="!collapsed" class="whitespace-nowrap flex items-center justify-between w-full">
              <span class="truncate">{{ item.name }}</span>
              <span
                v-if="item.badge"
                :class="[
                  'ml-auto text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full',
                  currentTab === item.id 
                    ? 'bg-blue-600 text-white' 
                    : item.badge === 'HOT' 
                      ? 'bg-rose-100 text-rose-700'
                      : item.badge === 'NEW'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                ]"
              >
                {{ item.badge }}
              </span>
            </span>
          </button>
        </div>
      </nav>

      <!-- 사이드바 하단 정보 & 액션 버튼 -->
      <div class="p-3 border-t border-slate-200 shrink-0 bg-slate-50/50">
        <!-- 접힘: 아바타 -->
        <div v-if="collapsed" class="flex justify-center py-1">
          <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
            {{ auth.isAdmin ? '관' : (auth.isGuest ? '게' : '교') }}
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
              {{ auth.isAdmin ? '관리자' : (auth.isGuest ? '학교 관리자 (게스트)' : (auth.teacherName || auth.user?.user_metadata?.name || '교과 교사')) }}
            </p>
            <p class="text-xs text-slate-500 font-medium m-0 mt-0.5">
              {{ auth.isAdmin ? '시스템 관리자' : (auth.isGuest ? '임시 게스트 열람 모드' : '통계 열람 권한') }}
            </p>
          </div>

          <!-- 액션 링크 -->
          <div class="pt-2 border-t border-slate-200/80 flex flex-col gap-1">
            <!-- 게스트 전용 나가기 버튼 -->
            <button
              v-if="auth.isGuest"
              @click="handleGuestExit"
              class="w-full text-left text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1.5 py-1.5 px-2 rounded-lg bg-amber-50 hover:bg-amber-100/90 border border-amber-200/90 transition-colors cursor-pointer"
              title="게스트 열람을 종료하고 로그인 화면으로 돌아갑니다"
            >
              <LogOut :size="14" /> 게스트 열람 종료
            </button>

            <template v-else>
              <button
                @click="lockAndExit"
                class="w-full text-left text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1.5 py-1 transition-colors cursor-pointer bg-transparent border-none"
                title="복호화 암호를 메모리에서 즉시 삭제하고 포털로 나갑니다"
              >
                <Lock :size="14" /> 통계 잠금 (암호화 유지)
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
            </template>
          </div>
        </div>
      </div>
    </aside>

    <!-- 메인 콘텐츠 영역 -->
    <main class="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden bg-slate-100">
      <!-- 상단 헤더 배너 (고정, 학추 시스템 헤더 규격) -->
      <StatHeader :currentTabItem="currentTabItem" class="no-print" />

      <!-- 필터 바 (상단 고정, 고입 설명회, 학생별 6장 카드 및 수능최저 시뮬레이터 탭은 자체 컨트롤 사용으로 제외) -->
      <StatFilterBar v-if="currentTab !== 'admission' && currentTab !== 'student' && currentTab !== 'csatTarget'" class="no-print" />

      <!-- 스크롤 가능한 본문 영역 -->
      <div class="flex-1 min-h-0 flex flex-col overflow-y-auto" style="scrollbar-gutter: stable;">
        <div class="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <!-- 1. 구글 시트 탭 데이터 실시간 로딩 중 -->
          <div v-if="isLoadingYearData && currentTab !== 'csatTarget'" class="flex flex-col items-center justify-center py-24 text-center">
            <div class="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center mb-4 text-indigo-600 shadow-sm">
              <svg class="animate-spin w-7 h-7" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
            </div>
            <h3 class="text-base font-bold text-slate-800 m-0">
              {{ selectedAcademicYear }}학년도 대교협 수시 원자료를 불러오는 중입니다
            </h3>
            <p class="text-xs text-slate-500 mt-1.5 m-0">
              구글 스프레드시트의 <code class="px-1.5 py-0.5 bg-slate-200 rounded text-indigo-700 font-bold font-mono">{{ selectedAcademicYear }}수시</code> 탭에서 데이터를 실시간으로 동기화하고 있습니다.
            </p>
          </div>

          <!-- 2. 데이터가 없는 경우 (미등록 연도 또는 탭 부재, 수능최저 시뮬레이터는 제외) -->
          <div v-else-if="currentTab !== 'csatTarget' && (!applications || applications.length === 0)" class="flex flex-col items-center justify-center py-20 text-center">
            <div class="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-4 text-2xl shadow-xs">
              📂
            </div>
            <h3 class="text-base font-bold text-slate-800 m-0">
              {{ selectedAcademicYear }}학년도 수시 지원 데이터가 등록되지 않았습니다
            </h3>
            <p class="text-xs text-slate-500 mt-2 max-w-md m-0 leading-relaxed">
              {{ yearDataError || `구글 스프레드시트에 '${selectedAcademicYear}수시' 탭이 없거나 데이터가 비어 있습니다.` }}
            </p>
            <div class="mt-4 flex items-center gap-2">
              <button
                @click="reloadCurrentYear"
                class="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg border-none shadow-xs cursor-pointer transition-colors"
              >
                🔄 데이터 다시 불러오기
              </button>
            </div>
            <div class="mt-6 p-4 rounded-xl bg-white border border-slate-200 text-left text-xs text-slate-600 max-w-lg shadow-2xs space-y-1.5">
              <div class="font-bold text-slate-800 flex items-center gap-1.5">
                <span>💡</span>
                <span>{{ selectedAcademicYear }}학년도 데이터 연동 방법</span>
              </div>
              <p class="text-[11px] text-slate-500 m-0 leading-normal">
                1. 상단 우측 [구글 시트] 메뉴에서 대교협 스프레드시트를 엽니다.<br />
                2. 하단에 <code class="bg-indigo-50 text-indigo-700 px-1 py-0.2 rounded font-mono font-bold">{{ selectedAcademicYear }}수시</code> 이름으로 새 시트 탭을 생성합니다.<br />
                3. 대교협 수시 지원 원자료 엑셀의 내용을 A1 셀부터 그대로 붙여넣은 뒤 위의 <strong>[다시 불러오기]</strong> 버튼을 누르면 즉시 통계가 생성됩니다.
              </p>
            </div>
          </div>

          <!-- 3. 정상 데이터 탭 화면 -->
          <Transition v-else name="fade" mode="out-in">
            <component :is="activeTabComponent" />
          </Transition>
        </div>

        <!-- 하단 푸터 -->
        <footer class="bg-white border-t border-slate-200 py-5 mt-auto text-xs text-slate-500 no-print">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div>
              <span class="font-bold text-slate-700">{{ schoolName }}</span>
              <span class="mx-1.5">•</span>
              <span>{{ selectedAcademicYear }}학년도 대입 통계 분석 시스템 (꼼스탯)</span>
            </div>
            <div class="text-slate-400">
              <span>대교협 대입 원서접수 자료 연계</span>
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
import PassFailScatterTab from '../stat/components/tabs/PassFailScatterTab.vue'
import ParentCounselTab from '../stat/components/tabs/ParentCounselTab.vue'
import HighSchoolAdmissionTab from '../stat/components/tabs/HighSchoolAdmissionTab.vue'
import CsatTargetSimulatorTab from '../stat/components/tabs/CsatTargetSimulatorTab.vue'
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
  LogOut,
  ChartScatter,
  Lock,
  Sparkles,
  GraduationCap,
  Compass
} from 'lucide-vue-next'
import { clearStatSessionPassword, getStatSessionPassword } from '../api/statApi'

const router = useRouter()
const auth = useAuthStore()
const { 
  selectedAcademicYear, 
  applications, 
  isLoadingYearData, 
  yearDataError, 
  reloadCurrentYear 
} = useStatData()

// 사이드바 접기/펼치기 상태
const collapsed = ref(false)
const currentTab = ref('overview')

const menuGroups = computed(() => [
  {
    emoji: '📊',
    title: '현황 & 대입 진단',
    items: [
      { id: 'overview', name: '종합 대시보드', iconComponent: BarChart3 },
      { id: 'multiYear', name: '5개년 추이 분석', iconComponent: TrendingUp }
    ]
  },
  {
    emoji: '🏛️',
    title: '대학 & 전형 심층 분석',
    items: [
      { id: 'scatter', name: '대입 합불 산점도', iconComponent: ChartScatter, badge: 'NEW' },
      { id: 'university', name: '대학 그룹별 분석', iconComponent: Building2 },
      { id: 'grade', name: '성적대별 전형 경향', iconComponent: Target }
    ]
  },
  {
    emoji: '👤',
    title: '학생 지도 & 일정',
    items: [
      { id: 'student', name: '학생별 6장 카드', iconComponent: Users },
      { id: 'calendar', name: '면접·고사 캘린더', iconComponent: CalendarDays }
    ]
  },
  {
    emoji: '🎓',
    title: '상담 및 설명회',
    items: [
      { id: 'csatTarget', name: '수능최저 & 목표진단', iconComponent: Compass, badge: '예비고3' },
      { id: 'counsel', name: '학부모 맞춤 상담', iconComponent: Sparkles, badge: 'HOT' },
      { id: 'admission', name: '고입 설명회 특화', iconComponent: GraduationCap, badge: '중3' }
    ]
  },
  {
    emoji: '📁',
    title: '자료실 & 공식 출력',
    items: [
      { 
        id: 'data', 
        name: '전체 데이터 탐색기', 
        iconComponent: FileSpreadsheet, 
        badge: applications.value?.length ? applications.value.length.toLocaleString() : '0' 
      },
      { id: 'report', name: '공식 인쇄 보고서', iconComponent: Printer }
    ]
  }
])

const tabs = computed(() => menuGroups.value.flatMap(g => g.items))

const currentTabItem = computed(() => {
  return tabs.value.find(t => t.id === currentTab.value) || tabs.value[0]
})

const activeTabComponent = computed(() => {
  switch (currentTab.value) {
    case 'overview': return OverviewTab
    case 'csatTarget': return CsatTargetSimulatorTab
    case 'admission': return HighSchoolAdmissionTab
    case 'counsel': return ParentCounselTab
    case 'scatter': return PassFailScatterTab
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
  if (auth.isGuest) {
    handleGuestExit()
    return
  }
  router.push('/select-system')
}

function lockAndExit() {
  clearStatSessionPassword()
  if (auth.isGuest) {
    handleGuestExit()
    return
  }
  router.push('/select-system')
}

async function handleGuestExit() {
  clearStatSessionPassword()
  await auth.logout()
  router.push('/login')
}

async function handleLogout() {
  clearStatSessionPassword()
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

@media print {
  .no-print,
  aside,
  header,
  nav {
    display: none !important;
  }

  .flex.h-screen.overflow-hidden {
    height: auto !important;
    overflow: visible !important;
    display: block !important;
    background: #ffffff !important;
  }

  main {
    height: auto !important;
    overflow: visible !important;
    display: block !important;
    background: #ffffff !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .flex-1.min-h-0.overflow-y-auto {
    height: auto !important;
    overflow: visible !important;
    display: block !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .max-w-7xl {
    max-width: 100% !important;
    width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
  }
}
</style>
