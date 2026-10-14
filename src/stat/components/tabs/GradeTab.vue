<template>
  <div class="space-y-6">
    <!-- Top Summary Banner -->
    <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md">
      <div class="max-w-3xl">
        <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
          성적대별 수시 지원 경향성 분석
        </span>
        <h2 class="text-xl font-bold mt-2">전교과 내신 등급대별 대학 지원 포트폴리오</h2>
        <p class="text-xs text-slate-300 mt-1 leading-relaxed">
          포곡고 수시 지원자들의 내신 구간(1등급대 ~ 7등급대 이상)에 따른 선호 대학군, 전형 선택 비율(교과 vs 종합 vs 실기) 및 수도권 출원 비중을 심층 분석합니다.
        </p>
      </div>

      <!-- Quick Metrics inside Banner -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/10">
        <div>
          <div class="text-[11px] text-slate-400">지원자 전체 평균 내신</div>
          <div class="text-lg font-bold text-amber-300">{{ overallAvgGrade }} 등급</div>
        </div>
        <div>
          <div class="text-[11px] text-slate-400">1~2등급대 주요 타겟</div>
          <div class="text-lg font-bold text-sky-300">인서울 & 과기원</div>
        </div>
        <div>
          <div class="text-[11px] text-slate-400">3~4등급대 주요 타겟</div>
          <div class="text-lg font-bold text-indigo-300">경기/수도권 & 지거국</div>
        </div>
        <div>
          <div class="text-[11px] text-slate-400">5등급대 이후 주요 타겟</div>
          <div class="text-lg font-bold text-purple-300">충청권 4년제 & 전문대/실기</div>
        </div>
      </div>
    </div>

    <!-- Charts Row: Grade Band Distribution & Admission Type Stacked Bar -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Applications by Grade Band Bar Chart -->
      <div class="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm font-bold text-slate-800">내신 등급 구간별 수시 지원 건수</h3>
            <p class="text-xs text-slate-400">전교과(100) 등급 기준 분포</p>
          </div>
          <span class="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
            중위권 (3~5등급대) 밀집
          </span>
        </div>
        <div class="h-64">
          <Bar :data="gradeBandChartData" :options="chartOptions" />
        </div>
      </div>

      <!-- Type Breakdown by Grade Band Stacked Bar Chart -->
      <div class="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm font-bold text-slate-800">등급대별 전형 유형 선택 비중</h3>
            <p class="text-xs text-slate-400">내신 수준에 따른 교과/종합/실기/논술 선택 차이</p>
          </div>
        </div>
        <div class="h-64">
          <Bar :data="gradeTypeChartData" :options="stackedChartOptions" />
        </div>
      </div>
    </div>

    <!-- Interactive Grade Band Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div 
        v-for="band in gradeBands" 
        :key="band.id"
        @click="selectedBandId = selectedBandId === band.id ? null : band.id"
        :class="[
          'rounded-2xl p-5 border transition-all duration-200 cursor-pointer text-left',
          selectedBandId === band.id 
            ? 'bg-indigo-50/60 border-indigo-400 ring-2 ring-indigo-500/20 shadow-md' 
            : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-sm'
        ]"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <span :class="[
              'w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs',
              band.badgeClass
            ]">
              {{ band.rangeText.split(' ')[0] }}
            </span>
            <div>
              <h4 class="font-bold text-sm text-slate-900">{{ band.title }}</h4>
              <p class="text-[11px] text-slate-400">{{ band.rangeText }}</p>
            </div>
          </div>
          <span class="text-xs font-bold text-indigo-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
            {{ band.apps.length }}건
          </span>
        </div>

        <!-- Metrics inside Card -->
        <div class="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
          <div class="bg-slate-50 p-2 rounded-xl">
            <div class="text-[10px] text-slate-400">지원자</div>
            <div class="text-xs font-bold text-slate-800">{{ band.uniqueStudents }}명</div>
          </div>
          <div class="bg-slate-50 p-2 rounded-xl">
            <div class="text-[10px] text-slate-400">수도권율</div>
            <div class="text-xs font-bold text-emerald-600">{{ band.metroRate }}%</div>
          </div>
          <div class="bg-slate-50 p-2 rounded-xl">
            <div class="text-[10px] text-slate-400">주요전형</div>
            <div class="text-xs font-bold text-indigo-600">{{ band.dominantType }}</div>
          </div>
        </div>

        <!-- Top 3 Applied Univs in this Band -->
        <div class="mt-3 text-xs">
          <div class="text-[11px] font-semibold text-slate-500 mb-1 flex items-center justify-between">
            <span>선호 대학 TOP 3</span>
            <span class="text-[10px] text-indigo-600 font-normal">클릭하여 명단 확인</span>
          </div>
          <div class="flex flex-wrap gap-1">
            <span 
              v-for="(u, i) in band.topUnivs.slice(0, 3)" 
              :key="u.name"
              class="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px] font-medium"
            >
              {{ i + 1 }}. {{ u.name.replace(/대학교|\(.*\)/g, '') }} ({{ u.count }})
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Active Band Application Explorer -->
    <div v-if="selectedBand" class="bg-white rounded-2xl border border-indigo-200 shadow-md p-5 animate-fade-in">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 class="text-sm font-bold text-slate-900 flex items-center">
            <span class="w-2.5 h-2.5 rounded-full bg-indigo-600 mr-2"></span>
            {{ selectedBand.title }} ({{ selectedBand.rangeText }}) 지원 명단
            <span class="text-xs font-normal text-slate-500 ml-2">총 {{ selectedBand.apps.length }}건</span>
          </h3>
        </div>
        <button 
          @click="selectedBandId = null" 
          class="text-xs text-slate-400 hover:text-slate-600 flex items-center"
        >
          접기
          <svg class="w-3.5 h-3.5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" /></svg>
        </button>
      </div>

      <div class="overflow-x-auto mt-3">
        <table class="min-w-full divide-y divide-slate-200 text-xs">
          <thead class="bg-slate-50 font-semibold text-slate-600">
            <tr>
              <th class="px-3 py-2 text-left">학생</th>
              <th class="px-3 py-2 text-left">대학명</th>
              <th class="px-3 py-2 text-left">모집단위</th>
              <th class="px-3 py-2 text-left">전형명</th>
              <th class="px-3 py-2 text-center">전교과(100)</th>
              <th class="px-3 py-2 text-center">국영수사/과</th>
              <th class="px-3 py-2 text-left">최저학력기준</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
            <tr v-for="app in selectedBand.apps.slice(0, 50)" :key="app.id" class="hover:bg-slate-50">
              <td class="px-3 py-2 font-medium text-slate-800">
                {{ app.classNum }}-{{ app.studentNum }} {{ maskName(app.name) }}
              </td>
              <td class="px-3 py-2 font-semibold text-slate-900">{{ app.univName }}</td>
              <td class="px-3 py-2 text-slate-700">{{ app.dept }}</td>
              <td class="px-3 py-2 text-indigo-700 font-medium">{{ app.admissionDetailType || app.admissionMajorType }}</td>
              <td class="px-3 py-2 text-center font-bold text-slate-800">{{ formatGrade(app.allSubjectGrade) }}</td>
              <td class="px-3 py-2 text-center text-slate-600">{{ formatGrade(app.mainSubjectGrade) }}</td>
              <td class="px-3 py-2 text-[11px] text-slate-500 max-w-[250px] truncate" :title="app.minScoreReq">
                {{ app.minScoreReq || '-' }}
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="selectedBand.apps.length > 50" class="text-center py-2 text-[11px] text-slate-400">
          * 상위 50건만 표시됩니다. 전체 명세는 [전체 데이터] 탭에서 확인하실 수 있습니다.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { useData, maskName, formatGrade } from '../../composables/useStatData'

const { filteredApplications } = useData()

const selectedBandId = ref(null)

const overallAvgGrade = computed(() => {
  const grades = filteredApplications.value.map(a => a.allSubjectGrade).filter(g => g !== null && g > 0)
  return grades.length > 0 ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(2) : '-'
})

// Define Grade Bands
const gradeBandsConfig = [
  { id: 'band1', title: '1등급대', min: 1.0, max: 1.99, rangeText: '1.00 ~ 1.99 등급', badgeClass: 'bg-emerald-100 text-emerald-800' },
  { id: 'band2', title: '2등급대', min: 2.0, max: 2.99, rangeText: '2.00 ~ 2.99 등급', badgeClass: 'bg-teal-100 text-teal-800' },
  { id: 'band3', title: '3등급대', min: 3.0, max: 3.99, rangeText: '3.00 ~ 3.99 등급', badgeClass: 'bg-sky-100 text-sky-800' },
  { id: 'band4', title: '4등급대', min: 4.0, max: 4.99, rangeText: '4.00 ~ 4.99 등급', badgeClass: 'bg-indigo-100 text-indigo-800' },
  { id: 'band5', title: '5등급대', min: 5.0, max: 5.99, rangeText: '5.00 ~ 5.99 등급', badgeClass: 'bg-purple-100 text-purple-800' },
  { id: 'band6', title: '6등급대 이상', min: 6.0, max: 9.99, rangeText: '6.00 ~ 9.00 등급', badgeClass: 'bg-amber-100 text-amber-800' }
]

const gradeBands = computed(() => {
  return gradeBandsConfig.map(cfg => {
    const apps = filteredApplications.value.filter(a => {
      const g = a.allSubjectGrade
      return g !== null && g >= cfg.min && g <= cfg.max
    })

    const students = new Set(apps.map(a => a.studentKey))
    const metroCount = apps.filter(a => a.isMetro).length
    const metroRate = apps.length > 0 ? ((metroCount / apps.length) * 100).toFixed(0) : '0'

    // Type counts
    const gyogwa = apps.filter(a => a.admissionType.includes('교과')).length
    const jonghap = apps.filter(a => a.admissionType.includes('종합')).length
    const silgi = apps.filter(a => a.admissionType.includes('실기')).length
    const nonsul = apps.filter(a => a.admissionType.includes('논술')).length

    let dominantType = '교과'
    if (jonghap > gyogwa && jonghap > silgi) dominantType = '종합'
    else if (silgi > gyogwa && silgi > jonghap) dominantType = '실기'

    // Top univs in this band
    const univMap = {}
    apps.forEach(a => {
      univMap[a.univName] = (univMap[a.univName] || 0) + 1
    })
    const topUnivs = Object.entries(univMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    return {
      ...cfg,
      apps,
      uniqueStudents: students.size,
      metroRate,
      dominantType,
      typeCounts: { gyogwa, jonghap, silgi, nonsul },
      topUnivs
    }
  })
})

const selectedBand = computed(() => {
  return gradeBands.value.find(b => b.id === selectedBandId.value) || null
})

// Chart 1: Applications count by band
const gradeBandChartData = computed(() => {
  return {
    labels: gradeBands.value.map(b => b.title),
    datasets: [
      {
        label: '지원 건수',
        data: gradeBands.value.map(b => b.apps.length),
        backgroundColor: ['#10b981', '#14b8a6', '#0ea5e9', '#6366f1', '#a855f7', '#f59e0b'],
        borderRadius: 6
      }
    ]
  }
})

// Chart 2: Type breakdown stacked bar
const gradeTypeChartData = computed(() => {
  return {
    labels: gradeBands.value.map(b => b.title),
    datasets: [
      {
        label: '학생부교과',
        data: gradeBands.value.map(b => b.typeCounts.gyogwa),
        backgroundColor: '#6366f1'
      },
      {
        label: '학생부종합',
        data: gradeBands.value.map(b => b.typeCounts.jonghap),
        backgroundColor: '#0ea5e9'
      },
      {
        label: '실기/실적',
        data: gradeBands.value.map(b => b.typeCounts.silgi),
        backgroundColor: '#10b981'
      },
      {
        label: '논술',
        data: gradeBands.value.map(b => b.typeCounts.nonsul),
        backgroundColor: '#f59e0b'
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { family: 'Pretendard', size: 10 } } },
    x: { grid: { display: false }, ticks: { font: { family: 'Pretendard', size: 11 } } }
  }
}

const stackedChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: { boxWidth: 10, font: { family: 'Pretendard', size: 10 } }
    }
  },
  scales: {
    x: { stacked: true, grid: { display: false }, ticks: { font: { family: 'Pretendard', size: 11 } } },
    y: { stacked: true, beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { family: 'Pretendard', size: 10 } } }
  }
}
</script>
