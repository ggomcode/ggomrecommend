<template>
  <div class="min-h-screen flex flex-col bg-slate-100 text-slate-800 font-sans selection:bg-indigo-500 selection:text-white">
    <!-- Header -->
    <StatHeader />

    <!-- Filter Bar -->
    <StatFilterBar />

    <!-- Navigation Tabs (Consistent with ggomrecommend pill/card style) -->
    <nav class="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-2xs no-print select-none">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2.5 scrollbar-none">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            @click="currentTab = tab.id"
            :class="[
              'inline-flex items-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-150 cursor-pointer border-none',
              currentTab === tab.id 
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-transparent'
            ]"
          >
            <span class="mr-2 text-base leading-none">{{ tab.icon }}</span>
            <span>{{ tab.name }}</span>
            <span 
              v-if="tab.badge" 
              :class="[
                'ml-2 px-1.5 py-0.2 rounded-full text-[10px] font-semibold',
                currentTab === tab.id ? 'bg-indigo-500 text-white' : 'bg-slate-200/70 text-slate-600'
              ]"
            >
              {{ tab.badge }}
            </span>
          </button>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Transition name="fade" mode="out-in">
        <component :is="activeTabComponent" />
      </Transition>
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-slate-200 py-6 mt-auto text-xs text-slate-500 no-print">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div>
          <span class="font-bold text-slate-700">{{ schoolName }}</span>
          <span class="mx-1.5">•</span>
          <span>2027학년도 대입 수시 지원 통계 분석 시스템 (꼼스탯)</span>
        </div>
        <div class="text-slate-400">
          <span>대교협 수시 원서접수 자료 연계</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import StatHeader from '../stat/components/StatHeader.vue'
import StatFilterBar from '../stat/components/StatFilterBar.vue'
import OverviewTab from '../stat/components/tabs/OverviewTab.vue'
import UniversityTab from '../stat/components/tabs/UniversityTab.vue'
import GradeTab from '../stat/components/tabs/GradeTab.vue'
import CalendarTab from '../stat/components/tabs/CalendarTab.vue'
import StudentTab from '../stat/components/tabs/StudentTab.vue'
import DataExplorerTab from '../stat/components/tabs/DataExplorerTab.vue'
import PrintReportTab from '../stat/components/tabs/PrintReportTab.vue'
import { schoolName } from '../utils/schoolConfig'

const currentTab = ref('overview')

const tabs = [
  { id: 'overview', name: '종합 통계', icon: '📊' },
  { id: 'university', name: '대학별 분석', icon: '🏫' },
  { id: 'grade', name: '성적대별 경향', icon: '📈' },
  { id: 'calendar', name: '면접·고사 캘린더', icon: '🗓️' },
  { id: 'student', name: '학생별 6장 카드', icon: '👤' },
  { id: 'data', name: '전체 데이터 탐색기', icon: '📋', badge: '1,376' },
  { id: 'report', name: '공식 인쇄 보고서', icon: '🖨️' }
]

const activeTabComponent = computed(() => {
  switch (currentTab.value) {
    case 'overview': return OverviewTab
    case 'university': return UniversityTab
    case 'grade': return GradeTab
    case 'calendar': return CalendarTab
    case 'student': return StudentTab
    case 'data': return DataExplorerTab
    case 'report': return PrintReportTab
    default: return OverviewTab
  }
})
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
