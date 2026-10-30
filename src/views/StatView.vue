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

      <!-- 메뉴 내비게이션 (3대 핵심 허브 & 아코디언 컴팩트 메뉴) -->
      <nav class="flex-1 overflow-y-auto px-2 py-2 space-y-1.5" style="scrollbar-gutter: stable;">
        <div v-for="(group, gIdx) in menuGroups" :key="group.title" class="space-y-0.5">
          <!-- 섹션 헤더 (펼침 상태: 클릭 시 아코디언 토글) -->
          <button
            v-if="!collapsed" 
            type="button"
            @click="toggleGroup(group.title)"
            class="w-full px-2 py-1 text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center justify-between select-none cursor-pointer hover:text-slate-800 rounded-md transition-colors bg-transparent border-none text-left"
          >
            <span class="flex items-center gap-1.5">
              <span>{{ group.emoji }}</span>
              <span>{{ group.title }}</span>
            </span>
            <span class="flex items-center gap-1 text-[10px] text-slate-400 font-normal">
              <span v-if="collapsedGroups[group.title]" class="px-1.5 py-0.2 rounded bg-slate-100 font-mono text-[9px]">{{ group.items.length }}</span>
              <ChevronDown v-if="!collapsedGroups[group.title]" :size="12" />
              <ChevronRight v-else :size="12" />
            </span>
          </button>

          <!-- 섹션 구분선 (접힘 상태) -->
          <div v-else-if="gIdx > 0" class="my-1.5 border-t border-slate-200/80 mx-1"></div>

          <!-- 메뉴 아이템 목록 (접히지 않았을 때 표시) -->
          <div v-show="!collapsedGroups[group.title] || collapsed" class="space-y-0.5">
            <button
              v-for="item in group.items"
              :key="item.id"
              @click="currentTab = item.id"
              :title="collapsed ? `${group.title} > ${item.name}` : item.name"
              class="w-full rounded-xl text-xs transition-all duration-150 relative cursor-pointer border-none text-left"
              :class="[
                collapsed ? 'p-2 flex justify-center items-center' : 'px-2.5 py-1.5 flex items-center gap-2',
                currentTab === item.id 
                  ? 'bg-blue-50 text-blue-700 font-bold shadow-2xs' 
                  : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
              ]"
            >
              <!-- 활성 탭 좌측 인디케이터 바 -->
              <span 
                v-if="currentTab === item.id && !collapsed" 
                class="absolute left-0 top-1 bottom-1 w-1 rounded-r-full bg-blue-600"
              ></span>

              <!-- 아이콘 & 접힘 시 배지 -->
              <span class="relative shrink-0 flex items-center justify-center">
                <component 
                  :is="item.iconComponent" 
                  :size="16" 
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
                <span class="truncate text-[11.5px]">{{ item.name }}</span>
                <span
                  v-if="item.badge"
                  :class="[
                    'ml-auto text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded-full',
                    currentTab === item.id 
                      ? 'bg-blue-600 text-white' 
                      : item.badge === 'HOT' 
                        ? 'bg-rose-100 text-rose-700'
                        : item.badge === 'NEW'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-500'
                  ]"
                >
                  {{ item.badge }}
                </span>
              </span>
            </button>
          </div>
        </div>
      </nav>

      <!-- 사이드바 하단: 슬림 프로필 & 빠른 액션 바 (스크롤 방지 42px 컴팩트화) -->
      <div class="px-2.5 py-2 border-t border-slate-200 shrink-0 bg-slate-50/80">
        <!-- 접힘 상태 -->
        <div v-if="collapsed" class="flex flex-col items-center gap-1.5 py-1">
          <div 
            class="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs"
            :title="auth.isAdmin ? '관리자' : (auth.teacherName || '교과 교사')"
          >
            {{ auth.isAdmin ? '관' : (auth.isGuest ? '게' : '교') }}
          </div>
          <button 
            @click="handleLogout" 
            class="text-slate-400 hover:text-rose-600 p-1 cursor-pointer bg-transparent border-none" 
            title="로그아웃"
          >
            <LogOut :size="14" />
          </button>
        </div>

        <!-- 펼침 상태: 한 줄로 깔끔하게 정돈된 프로필 & 3개 미니 액션 아이콘 -->
        <div v-else class="flex items-center justify-between gap-1.5">
          <div class="flex items-center gap-2 min-w-0">
            <div class="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              {{ auth.isAdmin ? '관' : (auth.isGuest ? '게' : '교') }}
            </div>
            <div class="truncate leading-tight">
              <div class="text-xs font-bold text-slate-800 truncate">
                {{ auth.isAdmin ? '관리자' : (auth.isGuest ? '게스트' : (auth.teacherName || auth.user?.user_metadata?.name || '교과 교사')) }}
              </div>
              <div class="text-[10px] text-slate-400 font-medium">
                {{ selectedAcademicYear }}학년도 대입
              </div>
            </div>
          </div>

          <!-- 액션 3대 퀵 아이콘 (잠금, 포털, 로그아웃) -->
          <div class="flex items-center gap-0.5 shrink-0">
            <button
              v-if="!auth.isGuest"
              @click="lockAndExit"
              class="p-1.5 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer border-none bg-transparent"
              title="통계 잠금 (암호화 유지)"
            >
              <Lock :size="14" />
            </button>
            <button
              v-if="!auth.isGuest"
              @click="goToPortal"
              class="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer border-none bg-transparent"
              title="포털 메인 화면 (시스템 선택)"
            >
              <Home :size="14" />
            </button>
            <button
              @click="handleLogout"
              class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border-none bg-transparent"
              title="로그아웃"
            >
              <LogOut :size="14" />
            </button>
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
import { ref, computed, onMounted } from 'vue'
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
import SchoolRecommendationTab from '../stat/components/tabs/SchoolRecommendationTab.vue'
import RuralStatTab from '../stat/components/tabs/RuralStatTab.vue'
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
  ChevronDown,
  Menu,
  Home,
  LogOut,
  ChartScatter,
  Lock,
  Sparkles,
  GraduationCap,
  Compass,
  Award,
  Trees
} from 'lucide-vue-next'
import { clearStatSessionPassword, getStatSessionPassword, hasRuralSheetConfigured } from '../api/statApi'

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

// 관리자 설정에서 '농어촌 및 기회균형 전형 구글 시트 ID' 등록 여부 확인 (미등록 시 메뉴 숨김)
const initialRuralSheetId = typeof window !== 'undefined' ? localStorage.getItem('pcm_google_sheet_rural_id') : ''
const hasRuralSheet = ref(!!(initialRuralSheetId && initialRuralSheetId.trim()))

async function checkRuralSheetConfig() {
  hasRuralSheet.value = await hasRuralSheetConfigured()
  if (!hasRuralSheet.value && currentTab.value === 'ruralStat') {
    currentTab.value = 'overview'
  }
}

onMounted(() => {
  checkRuralSheetConfig()
})

// 아코디언 그룹 접기/펼치기 상태 관리
const collapsedGroups = ref({})
function toggleGroup(title) {
  collapsedGroups.value[title] = !collapsedGroups.value[title]
}

const menuGroups = computed(() => [
  {
    emoji: '📊',
    title: '대입 현황 & 분석',
    items: [
      { id: 'overview', name: '종합 대시보드', iconComponent: BarChart3 },
      { id: 'multiYear', name: '5개년 추이 분석', iconComponent: TrendingUp },
      { id: 'scatter', name: '대입 합불 산점도', iconComponent: ChartScatter, badge: 'NEW' },
      { id: 'schoolRec', name: '학교장추천 전형 분석', iconComponent: Award, badge: '특화' },
      ...(hasRuralSheet.value ? [{ id: 'ruralStat', name: '농어촌 전형 분석', iconComponent: Trees, badge: '특화' }] : []),
      { id: 'university', name: '대학 그룹별 분석', iconComponent: Building2 },
      { id: 'grade', name: '성적대별 전형 경향', iconComponent: Target }
    ]
  },
  {
    emoji: '🎯',
    title: '진학 지도 & 상담',
    items: [
      { id: 'student', name: '학생별 6장 카드', iconComponent: Users },
      { id: 'csatTarget', name: '수능최저 & 목표진단', iconComponent: Compass, badge: '예비고3' },
      { id: 'counsel', name: '학부모 맞춤 상담', iconComponent: Sparkles, badge: 'HOT' },
      { id: 'admission', name: '고입 설명회 특화', iconComponent: GraduationCap, badge: '중3' }
    ]
  },
  {
    emoji: '📁',
    title: '일정 & 데이터 도구',
    items: [
      { id: 'calendar', name: '면접·고사 캘린더', iconComponent: CalendarDays },
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
    case 'schoolRec': return SchoolRecommendationTab
    case 'ruralStat': return hasRuralSheet.value ? RuralStatTab : OverviewTab
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
