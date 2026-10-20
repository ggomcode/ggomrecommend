<template>
  <div class="space-y-6">
    <!-- Top 7 KPI Cards Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
      <!-- 1. Enrolled Students -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between text-slate-400 mb-2">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ enrolledLabel }}</span>
          <span class="p-1.5 rounded-lg bg-slate-50 text-slate-500">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </span>
        </div>
        <div class="text-2xl font-bold text-slate-800">
          {{ currentTargetTotalStudents }}<span class="text-xs font-normal text-slate-500 ml-1">명</span>
        </div>
        <div class="mt-1 text-[11px] text-slate-500 flex items-center">
          <span class="inline-block w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span>
          {{ enrolledSubText }}
        </div>
      </div>

      <!-- 2. Applicants -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between text-slate-400 mb-2">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ applicantLabel }}</span>
          <span class="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </span>
        </div>
        <div class="text-2xl font-bold text-indigo-600">
          {{ currentStats.totalStudents }}<span class="text-xs font-normal text-slate-500 ml-1">명</span>
        </div>
        <div class="mt-1 text-[11px] text-indigo-700 font-medium flex items-center">
          <span class="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5"></span>
          지원율 {{ currentApplicantRate }}%
        </div>
      </div>

      <!-- 3. Total Applications -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between text-slate-400 mb-2">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">총 접수 건수</span>
          <span class="p-1.5 rounded-lg bg-sky-50 text-sky-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </span>
        </div>
        <div class="text-2xl font-bold text-sky-600">
          {{ currentStats.totalApps }}<span class="text-xs font-normal text-slate-500 ml-1">건</span>
        </div>
        <div class="mt-1 text-[11px] text-slate-500 flex items-center">
          <span class="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 mr-1.5"></span>
          1인 평균 {{ currentStats.avgApps }}건
        </div>
      </div>

      <!-- 4. Metropolitan Rate -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between text-slate-400 mb-2">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">수도권 지원</span>
          <span class="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </span>
        </div>
        <div class="text-2xl font-bold text-emerald-600">
          {{ currentStats.metroRate }}<span class="text-xs font-normal text-slate-500 ml-1">%</span>
        </div>
        <div class="mt-1 text-[11px] text-slate-500 flex items-center">
          <span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>
          {{ currentStats.metroApps }}건 (서울/경기/인천)
        </div>
      </div>

      <!-- 5. School Recommendation -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between text-slate-400 mb-2">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">학교장 추천</span>
          <span class="p-1.5 rounded-lg bg-purple-50 text-purple-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
          </span>
        </div>
        <div class="text-2xl font-bold text-purple-600">
          {{ currentStats.recApps }}<span class="text-xs font-normal text-slate-500 ml-1">건</span>
        </div>
        <div class="mt-1 text-[11px] text-slate-500 flex items-center">
          <span class="inline-block w-1.5 h-1.5 rounded-full bg-purple-400 mr-1.5"></span>
          {{ currentStats.recStudents }}명 지원 ({{ currentStats.recRate }}%)
        </div>
      </div>

      <!-- 6. Rural (농어촌) -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between text-slate-400 mb-2">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">농어촌 전형</span>
          <span class="p-1.5 rounded-lg bg-amber-50 text-amber-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /></svg>
          </span>
        </div>
        <div class="text-2xl font-bold text-amber-600">
          {{ currentStats.ruralApps }}<span class="text-xs font-normal text-slate-500 ml-1">건</span>
        </div>
        <div class="mt-1 text-[11px] text-slate-500 flex items-center">
          <span class="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5"></span>
          {{ currentStats.ruralStudents }}명 접수 ({{ currentStats.ruralStudentRate }}%)
        </div>
      </div>

      <!-- 7. Top Tier SKY & Tech -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between text-slate-400 mb-2">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">주요대 / 과기원</span>
          <span class="p-1.5 rounded-lg bg-rose-50 text-rose-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
          </span>
        </div>
        <div class="text-2xl font-bold text-rose-600">
          {{ currentStats.topTierApps }}<span class="text-xs font-normal text-slate-500 ml-1">건</span>
        </div>
        <div class="mt-1 text-[11px] text-slate-500 flex items-center">
          <span class="inline-block w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5"></span>
          <span v-if="currentStats.topTierStudents > 0">{{ currentStats.topTierStudents }}명 (설포연고/과기원)</span>
          <span v-else>설포연고서성한이/과기원</span>
        </div>
      </div>
    </div>

    <!-- 🎯 3단계: 내신 vs 수능 괴리도 분석 & 사탐런 & 2027 대입 전략 위젯 (보고서 1, 2, 6페이지 통합) -->
    <SatVsGpaStrategyWidget />

    <!-- Charts Row 1: Admission Types & Regional Distribution -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Admission Type Breakdown (Doughnut) -->
      <div class="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-sm font-bold text-slate-800">전형 유형별 지원 현황</h2>
            <p class="text-xs text-slate-400">교과 vs 종합 vs 실기 vs 논술</p>
          </div>
          <span class="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
            총 {{ currentStats.totalApps }}건
          </span>
        </div>

        <div class="h-64 relative flex items-center justify-center">
          <Doughnut :data="typeChartData" :options="doughnutOptions" />
        </div>

        <div class="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-center">
          <div class="p-2 rounded-xl bg-slate-50">
            <div class="text-[11px] text-slate-500">학생부교과</div>
            <div class="text-sm font-bold text-indigo-600">{{ currentStats.typeCounts.gyogwa }}건</div>
            <div class="text-[10px] text-slate-400">{{ getPercentage(currentStats.typeCounts.gyogwa) }}%</div>
          </div>
          <div class="p-2 rounded-xl bg-slate-50">
            <div class="text-[11px] text-slate-500">학생부종합</div>
            <div class="text-sm font-bold text-sky-600">{{ currentStats.typeCounts.jonghap }}건</div>
            <div class="text-[10px] text-slate-400">{{ getPercentage(currentStats.typeCounts.jonghap) }}%</div>
          </div>
          <div class="p-2 rounded-xl bg-slate-50">
            <div class="text-[11px] text-slate-500">실기/실적</div>
            <div class="text-sm font-bold text-emerald-600">{{ currentStats.typeCounts.silgi }}건</div>
            <div class="text-[10px] text-slate-400">{{ getPercentage(currentStats.typeCounts.silgi) }}%</div>
          </div>
          <div class="p-2 rounded-xl bg-slate-50">
            <div class="text-[11px] text-slate-500">논술/기타</div>
            <div class="text-sm font-bold text-amber-600">{{ currentStats.typeCounts.nonsul + currentStats.typeCounts.other }}건</div>
            <div class="text-[10px] text-slate-400">{{ getPercentage(currentStats.typeCounts.nonsul + currentStats.typeCounts.other) }}%</div>
          </div>
        </div>
      </div>

      <!-- Regional Distribution (Bar Chart) -->
      <div class="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-sm font-bold text-slate-800">지역별 수시 지원 분포</h2>
            <p class="text-xs text-slate-400">
              수도권 {{ currentStats.metroApps }}건 ({{ currentStats.metroRate }}%) / 비수도권 {{ currentStats.nonMetroApps }}건 ({{ currentStats.nonMetroRate }}%)
            </p>
          </div>
          <div class="flex items-center space-x-2 text-xs">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium text-[11px]">
              수도권 (경기 {{ currentStats.gyeonggiApps }} / 서울 {{ currentStats.seoulApps }} / 인천 {{ currentStats.incheonApps }})
            </span>
          </div>
        </div>

        <div class="h-64">
          <Bar :data="regionChartData" :options="regionBarOptions" />
        </div>

        <!-- Regional Quick Badges -->
        <div class="mt-4 flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
          <span 
            v-for="r in currentRegionalBadges" 
            :key="r.region"
            :class="[
              'inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border',
              r.metro 
                ? 'bg-indigo-50/70 border-indigo-200 text-indigo-800' 
                : 'bg-slate-50 border-slate-200 text-slate-700'
            ]"
          >
            <span class="font-bold mr-1">{{ r.region }}</span>
            <span class="text-slate-500">{{ r.count }}건</span>
            <span class="text-[10px] text-slate-400 ml-1">({{ r.rate }}%)</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Charts Row 2: Class By Class Analysis (1~11반) & Academic Fields -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Class-by-Class Distribution -->
      <div class="lg:col-span-8 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-sm font-bold text-slate-800">학급별(1반~11반) 수시 지원 현황</h2>
            <p class="text-xs text-slate-400">학급별 총 지원 건수 및 원서 접수 학생 수</p>
          </div>
          <span class="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2.5 py-1 rounded-lg">
            {{ classSummaryText }}
          </span>
        </div>

        <div class="h-64">
          <Bar :data="classChartData" :options="classBarOptions" />
        </div>
      </div>

      <!-- Academic Fields (인문 / 자연 / 예체능) & Special Quotas -->
      <div class="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-sm font-bold text-slate-800">계열별 지원 비중</h2>
              <p class="text-xs text-slate-400">인문 vs 자연 vs 예체능</p>
            </div>
          </div>

          <div class="h-44 flex items-center justify-center">
            <Doughnut :data="fieldChartData" :options="doughnutOptions" />
          </div>

          <div class="space-y-2 mt-4">
            <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-xs">
              <span class="flex items-center font-medium text-slate-700">
                <span class="w-2.5 h-2.5 rounded-full bg-sky-500 mr-2"></span>
                인문계열
              </span>
              <span class="font-bold text-slate-800">
                {{ currentStats.fieldCounts.humanities }}건 
                <span class="text-slate-400 font-normal">({{ getPercentage(currentStats.fieldCounts.humanities) }}%)</span>
              </span>
            </div>
            <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-xs">
              <span class="flex items-center font-medium text-slate-700">
                <span class="w-2.5 h-2.5 rounded-full bg-indigo-500 mr-2"></span>
                자연계열
              </span>
              <span class="font-bold text-slate-800">
                {{ currentStats.fieldCounts.natural }}건 
                <span class="text-slate-400 font-normal">({{ getPercentage(currentStats.fieldCounts.natural) }}%)</span>
              </span>
            </div>
            <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-xs">
              <span class="flex items-center font-medium text-slate-700">
                <span class="w-2.5 h-2.5 rounded-full bg-amber-500 mr-2"></span>
                예체능계열
              </span>
              <span class="font-bold text-slate-800">
                {{ currentStats.fieldCounts.arts }}건 
                <span class="text-slate-400 font-normal">({{ getPercentage(currentStats.fieldCounts.arts) }}%)</span>
              </span>
            </div>
          </div>
        </div>

        <div class="mt-4 p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 text-[11px] text-amber-800">
          <div class="font-semibold flex items-center">
            <span class="mr-1">💡</span> 2027학년도 대입 포인트
          </div>
          <div class="mt-1 text-amber-700 leading-relaxed">
            <span v-if="selectedClass !== 'ALL' && selectedClass !== 'ENROLLED'">
              {{ enrolledLabel }} 수시 지원 총 {{ currentStats.totalApps }}건 ({{ currentStats.totalStudents }}명) 중 수도권 {{ currentStats.metroRate }}%, 학교장추천 {{ currentStats.recApps }}건, 농어촌 {{ currentStats.ruralApps }}건 출원.
            </span>
            <span v-else>
              포곡고 농어촌 대상자 220명 중 123명(50%)이 실제 농어촌/기회균형 전형(276건)에 적극 출원하였습니다.
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Doughnut, Bar } from 'vue-chartjs'
import { useData } from '../../composables/useStatData'
import SatVsGpaStrategyWidget from '../SatVsGpaStrategyWidget.vue'

const { 
  applications,
  officialStats, 
  currentStats, 
  filteredApplications,
  selectedClass,
  selectedField,
  selectedType,
  selectedMajorType,
  selectedRegion,
  searchKeyword,
  currentTargetTotalStudents,
  enrolledLabel,
  enrolledSubText,
  applicantLabel,
  currentApplicantRate
} = useData()

const getPercentage = (count) => {
  const total = currentStats.value.totalApps
  if (!total) return '0.0'
  return ((count / total) * 100).toFixed(1)
}

// Chart 1: Admission Type Doughnut
const typeChartData = computed(() => {
  const counts = currentStats.value.typeCounts
  return {
    labels: ['학생부교과', '학생부종합', '실기/실적', '논술/기타'],
    datasets: [
      {
        data: [counts.gyogwa, counts.jonghap, counts.silgi, counts.nonsul + counts.other],
        backgroundColor: ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  }
})

// Dynamic Regional Badges (top regions sorted by count)
const currentRegionalBadges = computed(() => {
  const list = currentStats.value.regionalBreakdown.filter(r => r.count > 0)
  list.sort((a, b) => b.count - a.count)
  return list.slice(0, 8)
})

// Chart 2: Regional Distribution Bar
const regionChartData = computed(() => {
  const regions = currentStats.value.regionalBreakdown
  return {
    labels: regions.map(r => r.region),
    datasets: [
      {
        label: '접수 건수',
        data: regions.map(r => r.count),
        backgroundColor: regions.map(r => r.metro ? '#4f46e5' : '#94a3b8'),
        borderRadius: 6
      }
    ]
  }
})

// Filtered applications ignoring only class filter (for class comparison across field/type/majorType/region/search filters)
const classComparisonApps = computed(() => {
  return applications.value.filter(app => {
    // Field filter
    if (selectedField.value !== 'ALL' && app.field !== selectedField.value) {
      return false
    }
    // Admission type filter
    if (selectedType.value !== 'ALL') {
      if (!app.admissionType.includes(selectedType.value)) return false
    }
    // Major Type (전형명(대) - J열) filter
    if (selectedMajorType.value !== 'ALL') {
      if (selectedMajorType.value === 'GROUP_RURAL') {
        if (!app.isRural && !app.admissionMajorType?.includes('농어촌') && !app.admissionDetailType?.includes('농어촌')) {
          return false
        }
      } else if (selectedMajorType.value === 'GROUP_OPP_NON_RURAL') {
        const isRuralApp = app.isRural || app.admissionMajorType?.includes('농어촌') || app.admissionDetailType?.includes('농어촌')
        const isOppApp = app.isOpportunity || 
          app.admissionMajorType?.includes('기회균형') || 
          app.admissionMajorType?.includes('고른기회') || 
          app.admissionMajorType?.includes('사회배려') ||
          app.admissionMajorType?.includes('수급자')
        if (isRuralApp || !isOppApp) {
          return false
        }
      } else if (selectedMajorType.value === 'GROUP_REC') {
        if (!app.isRecommendation && app.admissionMajorType !== '지역균형선발' && !app.admissionMajorType?.includes('추천')) {
          return false
        }
      } else {
        if (app.admissionMajorType !== selectedMajorType.value) {
          return false
        }
      }
    }
    // Region filter
    if (selectedRegion.value === 'METRO') {
      if (!app.isMetro) return false
    } else if (selectedRegion.value === 'NON_METRO') {
      if (app.isMetro) return false
    } else if (selectedRegion.value !== 'ALL') {
      if (app.region !== selectedRegion.value) return false
    }
    // Search keyword
    if (searchKeyword.value.trim()) {
      const kw = searchKeyword.value.trim().toLowerCase()
      const text = `${app.name} ${app.univName} ${app.dept} ${app.admissionMajorType} ${app.admissionDetailType} ${app.classNum}반`.toLowerCase()
      if (!text.includes(kw)) return false
    }
    return true
  })
})

const classSummaryText = computed(() => {
  const cls = Number(selectedClass.value)
  if (!isNaN(cls) && cls >= 1 && cls <= 11) {
    return `${cls}반: 지원 ${currentStats.value.totalApps}건 (${currentStats.value.totalStudents}명)`
  }
  if (selectedClass.value === '졸업생' || selectedClass.value === 'GRADUATE') {
    return `졸업생: 지원 ${currentStats.value.totalApps}건 (${currentStats.value.totalStudents}명)`
  }
  const avg = (currentStats.value.totalApps / 11).toFixed(1)
  return `평균 ${avg}건 / 학급`
})

// Chart 3: Class by Class Bar
const classChartData = computed(() => {
  const classCounts = Array(11).fill(0)
  const classStudents = Array(11).fill(0).map(() => new Set())
  let gradCount = 0
  const gradStudents = new Set()

  classComparisonApps.value.forEach(app => {
    if (app.isGraduate || app.classNum === '졸업생') {
      gradCount++
      gradStudents.add(app.studentKey)
    } else if (app.classNum >= 1 && app.classNum <= 11) {
      classCounts[app.classNum - 1]++
      classStudents[app.classNum - 1].add(app.studentKey)
    }
  })

  const labels = Array(11).fill(0).map((_, i) => `${i + 1}반`)
  const countData = [...classCounts]
  const studentData = classStudents.map(s => s.size)

  if (gradCount > 0 || selectedClass.value === '졸업생') {
    labels.push('졸업생')
    countData.push(gradCount)
    studentData.push(gradStudents.size)
  }

  // Highlight selected class
  const selectedClsNum = Number(selectedClass.value)
  const isSelected = (index, isGrad = false) => {
    if (isGrad) return selectedClass.value === '졸업생' || selectedClass.value === 'GRADUATE'
    if (selectedClass.value === 'ALL' || selectedClass.value === 'ENROLLED') return true
    return selectedClsNum === index + 1
  }

  const barColors = countData.map((_, i) => {
    const isGrad = i === 11
    if (isSelected(i, isGrad)) {
      return '#4f46e5'
    }
    return '#cbd5e1'
  })

  const studentBarColors = studentData.map((_, i) => {
    const isGrad = i === 11
    if (isSelected(i, isGrad)) {
      return '#0284c7'
    }
    return '#e2e8f0'
  })

  return {
    labels,
    datasets: [
      {
        label: '지원 건수',
        data: countData,
        backgroundColor: barColors,
        borderRadius: 6
      },
      {
        label: '지원 학생 수',
        data: studentData,
        backgroundColor: studentBarColors,
        borderRadius: 6
      }
    ]
  }
})

// Chart 4: Academic Fields Doughnut
const fieldChartData = computed(() => {
  const fields = currentStats.value.fieldCounts
  return {
    labels: ['인문', '자연', '예체능'],
    datasets: [
      {
        data: [fields.humanities, fields.natural, fields.arts],
        backgroundColor: ['#0ea5e9', '#6366f1', '#f59e0b'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  }
})

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        boxWidth: 12,
        font: { size: 11, family: 'Pretendard' }
      }
    }
  },
  cutout: '65%'
}

const regionBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#f1f5f9' },
      ticks: { font: { family: 'Pretendard', size: 10 } }
    },
    x: {
      grid: { display: false },
      ticks: { font: { family: 'Pretendard', size: 11 } }
    }
  }
}

const classBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        boxWidth: 12,
        font: { size: 11, family: 'Pretendard' }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#f1f5f9' },
      ticks: { font: { family: 'Pretendard', size: 10 } }
    },
    x: {
      grid: { display: false },
      ticks: { font: { family: 'Pretendard', size: 11 } }
    }
  }
}
</script>
