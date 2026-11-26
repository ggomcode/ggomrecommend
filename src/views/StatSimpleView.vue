<template>
  <div class="min-h-screen w-full" style="background: #eeecea;">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <!-- 1. 데이터 로딩 중 -->
      <div v-if="isLoadingYearData" class="flex flex-col items-center justify-center py-24 text-center">
        <div class="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p class="text-sm font-bold text-slate-700 m-0">
          {{ selectedAcademicYear }}학년도 합격자 통계를 불러오는 중입니다...
        </p>
      </div>

      <!-- 2. 데이터 없음 / 오류 -->
      <div v-else-if="!applications || applications.length === 0" class="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
        <div class="text-3xl mb-3">📂</div>
        <h3 class="text-base font-bold text-slate-800 m-0">
          {{ selectedAcademicYear }}학년도 수시 지원 데이터가 아직 등록되지 않았습니다
        </h3>
        <p class="text-xs text-slate-500 mt-2 max-w-md m-0">
          {{ yearDataError || `'${selectedAcademicYear}수시' 시트에 데이터가 없거나 불러올 수 없습니다.` }}
        </p>
        <button
          type="button"
          @click="reloadCurrentYear"
          class="mt-4 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg border-none shadow-xs cursor-pointer transition-colors"
        >
          🔄 다시 불러오기
        </button>
      </div>

      <!-- 3. 합격자 간단 통계 (상단 7대 KPI + 주요 대학 및 권역별 합격 인원 현황표) -->
      <template v-else>
        <StatOverviewKpiGrid />
        <UnivPassCountTableWidget />
      </template>
    </div>
  </div>
</template>

<script setup>
import StatOverviewKpiGrid from '../stat/components/StatOverviewKpiGrid.vue'
import UnivPassCountTableWidget from '../stat/components/UnivPassCountTableWidget.vue'
import { useStatData } from '../stat/composables/useStatData'

const {
  selectedAcademicYear,
  applications,
  isLoadingYearData,
  yearDataError,
  reloadCurrentYear
} = useStatData()
</script>

<style>
@media print {
  @page {
    size: A4 portrait !important;
    margin: 8mm 10mm !important;
  }
}
</style>

<style scoped>
@media print {
  .no-print {
    display: none !important;
  }
  .max-w-7xl {
    max-width: 100% !important;
    width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
  }
}
</style>
