<template>
  <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm transition-all duration-300">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/80 mb-2">
          <span>🎯</span>
          <span>수시 전형별 합격률 심층 분석</span>
          <span class="text-indigo-300">|</span>
          <span class="text-slate-500 font-semibold">동적 레이더 차트</span>
        </div>
        <h3 class="text-lg sm:text-xl font-black text-slate-900 tracking-tight m-0">
          내신 등급대별 전형 합격률 (교과 vs 종합)
        </h3>
        <p class="text-xs text-slate-500 m-0 mt-1 leading-relaxed">
          내신 등급대별 주요 전형(교과·종합)의 합격률 분포와 전형별 유불리를 비교 분석합니다.
        </p>
      </div>

      <!-- Mode & Overlay Switches -->
      <div class="flex items-center gap-2.5 shrink-0 self-start md:self-center">
        <!-- Overlay toggle -->
        <button
          type="button"
          @click="showGhostOverlay = !showGhostOverlay"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer',
            showGhostOverlay
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-2xs'
              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
          ]"
          title="수시 전체 평균 다각형을 연한 회색 배경선으로 함께 겹쳐서 비교합니다"
        >
          <span>{{ showGhostOverlay ? '👁️' : '⚪' }}</span>
          <span>전체 평균 오버레이 비교</span>
        </button>

        <!-- View Mode (5축 세부전형 vs 4축 대분류) -->
        <div class="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-bold">
          <button
            type="button"
            @click="chartMode = 'subType'"
            :class="[
              'px-2.5 py-1 rounded-lg transition-all cursor-pointer border-none',
              chartMode === 'subType' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 bg-transparent'
            ]"
          >
            교과 vs 종합 세부
          </button>
          <button
            type="button"
            @click="chartMode = 'majorType'"
            :class="[
              'px-2.5 py-1 rounded-lg transition-all cursor-pointer border-none',
              chartMode === 'majorType' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 bg-transparent'
            ]"
          >
            4대 전형 비교
          </button>
        </div>
      </div>
    </div>

    <!-- Interactive Hover Pills Bar (등급 선택기) -->
    <div class="pt-5 pb-3">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
          <span>⚡</span>
          <span>내신 등급 구간</span>
        </span>
        <span v-if="isLocked" class="text-[11px] font-bold text-indigo-600 flex items-center gap-1">
          <span>🔒 {{ activeBand.label }} 고정됨</span>
          <button
            @click="unlockBand"
            class="ml-1 text-slate-400 hover:text-slate-600 underline cursor-pointer bg-transparent border-none text-[11px]"
          >
            고정 해제
          </button>
        </span>
      </div>

      <div class="grid grid-cols-4 sm:grid-cols-8 gap-2">
        <button
          v-for="band in gradeBandsList"
          :key="band.id"
          type="button"
          @mouseenter="handleMouseEnter(band.id)"
          @mouseleave="handleMouseLeave"
          @click="handleClick(band.id)"
          :class="[
            'px-2.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer border',
            activeBandId === band.id
              ? 'bg-gradient-to-b from-indigo-600 to-indigo-700 text-white border-indigo-700 shadow-md scale-[1.03] ring-2 ring-indigo-300'
              : 'bg-slate-50 hover:bg-indigo-50/70 text-slate-700 border-slate-200/90 hover:border-indigo-300'
          ]"
        >
          <span class="font-black text-xs leading-none">{{ band.label }}</span>
          <span
            :class="[
              'text-[10px] font-semibold leading-none',
              activeBandId === band.id ? 'text-indigo-200' : 'text-slate-600'
            ]"
          >
            {{ band.subLabel }}
          </span>
          <span
            :class="[
              'text-[10px] font-mono mt-0.5 px-1.5 py-0.2 rounded-full font-bold',
              activeBandId === band.id ? 'bg-indigo-500/60 text-white' : 'bg-slate-200/70 text-slate-600'
            ]"
          >
            {{ band.stats.total }}건
          </span>
        </button>
      </div>
    </div>

    <!-- Main Content: Radar Chart (Left) + Insight Panel (Right) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4 pt-4 border-t border-slate-100 items-stretch">
      <!-- Radar Chart Canvas -->
      <div class="lg:col-span-7 bg-slate-50/60 rounded-3xl p-4 sm:p-6 border border-slate-200/80 flex flex-col justify-between relative overflow-hidden">
        <!-- Floating Title Badge -->
        <div class="flex items-center justify-between z-10">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-indigo-600 animate-pulse"></span>
            <span class="text-sm font-bold text-slate-800">
              {{ activeBand.label }} 수시 합격률 다각형
            </span>
          </div>
          <!-- Legend Badges -->
          <div v-if="chartMode === 'subType'" class="flex items-center gap-2 text-xs font-bold">
            <span class="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
              <span class="w-2 h-2 rounded-full bg-blue-600"></span> 학생부교과
            </span>
            <span class="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              <span class="w-2 h-2 rounded-full bg-amber-500"></span> 학생부종합
            </span>
          </div>
          <div v-else class="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
            4대 전형 합격률 (%)
          </div>
        </div>

        <!-- Radar Canvas -->
        <div class="relative w-full h-[320px] sm:h-[360px] my-auto flex items-center justify-center">
          <Radar :data="radarChartData" :options="radarChartOptions" />
        </div>

        <!-- Chart Bottom Helper Note -->
        <div class="text-[11px] text-slate-600 text-center mt-2 z-10 flex items-center justify-center gap-1">
          <span>💡 각 꼭짓점은 0% ~ 100% 합격률을 의미하며, 다각형 면적이 넓을수록 합격 가능성이 높은 전형입니다.</span>
        </div>
      </div>

      <!-- Right: Realtime Insight & Metrics Card -->
      <div class="lg:col-span-5 flex flex-col gap-4">
        <!-- Card 1: Active Band Status & Advantage Meter -->
        <div class="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span class="text-[11px] font-bold text-slate-600">분석 구간</span>
              <h4 class="text-base font-black text-slate-900 m-0 leading-tight">
                {{ activeBand.label }} ({{ activeBand.rangeText }})
              </h4>
            </div>
            <div class="text-right">
              <span class="text-[11px] text-slate-600 block">전체 합격률</span>
              <span class="text-lg font-black text-indigo-600">
                {{ activeBand.stats.overallRate }}%
              </span>
              <span class="text-[10px] text-slate-600 ml-1">({{ activeBand.stats.passed }}/{{ activeBand.stats.total }}건)</span>
            </div>
          </div>

          <!-- Gyogwa vs Jonghap Comparison Meter -->
          <div class="space-y-2">
            <div class="flex items-center justify-between text-xs font-bold">
              <span class="text-slate-700 flex items-center gap-1.5">
                <span>⚖️</span>
                <span>교과 vs 종합 유불리 격차</span>
              </span>
              <span
                :class="[
                  'px-2 py-0.5 rounded-md text-[11px] font-extrabold',
                  advantageDelta >= 0 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                ]"
              >
                {{ advantageDeltaText }}
              </span>
            </div>

            <!-- Two Progress Bars -->
            <div class="space-y-1.5 pt-1">
              <!-- Gyogwa Bar -->
              <div>
                <div class="flex justify-between text-[11px] font-semibold text-slate-600 mb-0.5">
                  <span class="flex items-center gap-1 text-blue-700 font-bold">
                    <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span> 학생부교과
                  </span>
                  <span class="font-mono font-bold text-slate-800">
                    {{ activeBand.stats.gyogwa.rate }}%
                    <span class="font-normal text-slate-600 text-[10px]">({{ activeBand.stats.gyogwa.passed }}/{{ activeBand.stats.gyogwa.total }})</span>
                  </span>
                </div>
                <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-blue-600 rounded-full transition-all duration-500"
                    :style="{ width: `${Math.min(activeBand.stats.gyogwa.rate, 100)}%` }"
                  ></div>
                </div>
              </div>

              <!-- Jonghap Bar -->
              <div>
                <div class="flex justify-between text-[11px] font-semibold text-slate-600 mb-0.5">
                  <span class="flex items-center gap-1 text-amber-700 font-bold">
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> 학생부종합
                  </span>
                  <span class="font-mono font-bold text-slate-800">
                    {{ activeBand.stats.jonghap.rate }}%
                    <span class="font-normal text-slate-600 text-[10px]">({{ activeBand.stats.jonghap.passed }}/{{ activeBand.stats.jonghap.total }})</span>
                  </span>
                </div>
                <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-amber-500 rounded-full transition-all duration-500"
                    :style="{ width: `${Math.min(activeBand.stats.jonghap.rate, 100)}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Dynamic Insight Comment -->
          <div class="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs text-slate-700 leading-relaxed">
            <div class="font-extrabold text-indigo-900 flex items-center gap-1.5 mb-1">
              <span>💡</span>
              <span>2026학년도 입결 핵심 인사이트</span>
            </div>
            <p class="m-0 text-[11px] text-slate-600">
              {{ bandInsightComment }}
            </p>
          </div>
        </div>

        <!-- Card 2: Sub-types Breakdown Table (일반 / 농어촌 / 기회균형) -->
        <div class="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs flex-1 flex flex-col justify-between">
          <div>
            <h4 class="text-xs font-bold text-slate-700 m-0 mb-2 flex items-center justify-between">
              <span>전형 세부 유형별 합격률 상세 비교</span>
              <span class="text-[10px] text-slate-600 font-normal">합격률(합격/지원)</span>
            </h4>
            
            <div class="overflow-x-auto">
              <table class="w-full text-xs text-left">
                <thead>
                  <tr class="border-b border-slate-100 text-[11px] text-slate-600">
                    <th class="py-1.5 font-semibold">구분</th>
                    <th class="py-1.5 text-right text-blue-700 font-bold">학생부교과</th>
                    <th class="py-1.5 text-right text-amber-700 font-bold">학생부종합</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 font-mono text-[11px]">
                  <tr v-for="row in subTypeTableRows" :key="row.label" class="hover:bg-slate-50/80">
                    <td class="py-2 font-sans font-medium text-slate-800">{{ row.label }}</td>
                    <td class="py-2 text-right">
                      <span class="font-bold text-blue-600">{{ row.gyogwaRate }}%</span>
                      <span class="text-[10px] text-slate-600 ml-1">({{ row.gyogwaCount }})</span>
                    </td>
                    <td class="py-2 text-right">
                      <span class="font-bold text-amber-600">{{ row.jonghapRate }}%</span>
                      <span class="text-[10px] text-slate-600 ml-1">({{ row.jonghapCount }})</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Bottom Strategy Bullet -->
          <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>📌 {{ activeBand.label }} 합격생의 {{ activeBand.stats.metroRate }}%가 수도권에 합격</span>
            <span class="font-bold text-indigo-600">수시 집중 전형</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js'
import { Radar } from 'vue-chartjs'
import { useData } from '../composables/useStatData'

// Register Chart.js Radar components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
)

const { filteredApplications } = useData()

// Display modes
const chartMode = ref('subType') // 'subType' (교과vs종합 5축) | 'majorType' (4대전형 4축)
const showGhostOverlay = ref(true) // 전체 평균 다각형 잔상 오버레이 여부

// Hover and Lock States
const hoveredBandId = ref(null)
const lockedBandId = ref(null)

const activeBandId = computed(() => {
  return hoveredBandId.value || lockedBandId.value || 'ALL'
})

const isLocked = computed(() => !!lockedBandId.value)

function handleMouseEnter(bandId) {
  if (!lockedBandId.value) {
    hoveredBandId.value = bandId
  }
}

function handleMouseLeave() {
  if (!lockedBandId.value) {
    hoveredBandId.value = null
  }
}

function handleClick(bandId) {
  if (lockedBandId.value === bandId) {
    lockedBandId.value = null // 토글 해제
  } else {
    lockedBandId.value = bandId
    hoveredBandId.value = null
  }
}

function unlockBand() {
  lockedBandId.value = null
  hoveredBandId.value = null
}

// -------------------------------------------------------------
// Data Aggregation Engine
// -------------------------------------------------------------

// Helper: Check Pass Status
function isPass(app) {
  const final = String(app.finalStage || '').trim()
  const reg = String(app.registerStatus || '').trim()
  if (final.includes('불합')) return false
  return final.includes('합격') || final.includes('충원') || final.includes('최초') || reg === 'Y'
}

// Helper: Compute rate safely
function calcRate(passed, total) {
  if (!total || total === 0) return 0
  return Number(((passed / total) * 100).toFixed(1))
}

// Grade bands configuration
const GRADE_BANDS_CONFIG = [
  { id: 'ALL', label: '수시 전체', subLabel: '모든 등급', rangeText: '전교과 1.00 ~ 9.00', min: 0, max: 10 },
  { id: '1', label: '1등급대', subLabel: '최상위권', rangeText: '전교과 1.00 ~ 1.99', min: 1.0, max: 1.99 },
  { id: '2', label: '2등급대', subLabel: '상위권', rangeText: '전교과 2.00 ~ 2.99', min: 2.0, max: 2.99 },
  { id: '3', label: '3등급대', subLabel: '중상위권', rangeText: '전교과 3.00 ~ 3.99', min: 3.0, max: 3.99 },
  { id: '4', label: '4등급대', subLabel: '중위권', rangeText: '전교과 4.00 ~ 4.99', min: 4.0, max: 4.99 },
  { id: '5', label: '5등급대', subLabel: '중하위권', rangeText: '전교과 5.00 ~ 5.99', min: 5.0, max: 5.99 },
  { id: '6', label: '6등급대', subLabel: '하위권', rangeText: '전교과 6.00 ~ 6.99', min: 6.0, max: 6.99 },
  { id: '7_9', label: '7~9등급', subLabel: '실기/전문대', rangeText: '전교과 7.00 ~ 9.00', min: 7.0, max: 9.99 }
]

// Computed: Full statistical breakdown for all bands
const aggregatedStats = computed(() => {
  const apps = filteredApplications.value || []

  const statsMap = {}

  GRADE_BANDS_CONFIG.forEach(cfg => {
    // Filter apps in this band
    const bandApps = cfg.id === 'ALL' 
      ? apps 
      : apps.filter(a => {
          const g = a.allSubjectGrade ?? a.score9Grade
          return g !== null && g !== undefined && g >= cfg.min && g <= cfg.max
        })

    const total = bandApps.length
    const passed = bandApps.filter(isPass).length
    const overallRate = calcRate(passed, total)

    const metroPassed = bandApps.filter(a => isPass(a) && a.isMetro).length
    const metroRate = calcRate(metroPassed, passed)

    // Helper for category statistics
    const getStat = (predicate) => {
      const matched = bandApps.filter(predicate)
      const p = matched.filter(isPass).length
      return { total: matched.length, passed: p, rate: calcRate(p, matched.length) }
    }

    // Major Types
    const gyogwa = getStat(a => a.admissionType.includes('교과'))
    const jonghap = getStat(a => a.admissionType.includes('종합'))
    const nonsul = getStat(a => a.admissionType.includes('논술'))
    const silgi = getStat(a => a.admissionType.includes('실기'))

    // 5축 세부 전형 (교과 vs 종합)
    // 1. 전체
    const g_all = gyogwa
    const j_all = jonghap

    // 2. 일반 (농어촌·기회균형 제외)
    const g_general = getStat(a => a.admissionType.includes('교과') && !a.isRural && !a.isOpportunity)
    const j_general = getStat(a => a.admissionType.includes('종합') && !a.isRural && !a.isOpportunity)

    // 3. 농어촌
    const g_rural = getStat(a => a.admissionType.includes('교과') && a.isRural)
    const j_rural = getStat(a => a.admissionType.includes('종합') && a.isRural)

    // 4. 기회균형
    const g_opp = getStat(a => a.admissionType.includes('교과') && a.isOpportunity)
    const j_opp = getStat(a => a.admissionType.includes('종합') && a.isOpportunity)

    // 5. 농어촌+기회
    const g_ruralOrOpp = getStat(a => a.admissionType.includes('교과') && (a.isRural || a.isOpportunity))
    const j_ruralOrOpp = getStat(a => a.admissionType.includes('종합') && (a.isRural || a.isOpportunity))

    statsMap[cfg.id] = {
      total,
      passed,
      overallRate,
      metroRate,
      gyogwa,
      jonghap,
      nonsul,
      silgi,
      // 5축 레이더 데이터
      radar5: {
        gyogwa: [g_all.rate, g_general.rate, g_rural.rate, g_opp.rate, g_ruralOrOpp.rate],
        jonghap: [j_all.rate, j_general.rate, j_rural.rate, j_opp.rate, j_ruralOrOpp.rate],
        details: {
          general: { g: g_general, j: j_general },
          rural: { g: g_rural, j: j_rural },
          opp: { g: g_opp, j: j_opp },
          ruralOrOpp: { g: g_ruralOrOpp, j: j_ruralOrOpp }
        }
      },
      // 4대 전형 레이더 데이터
      radar4: [gyogwa.rate, jonghap.rate, nonsul.rate, silgi.rate]
    }
  })

  return statsMap
})

// Grade bands list with attached statistics
const gradeBandsList = computed(() => {
  return GRADE_BANDS_CONFIG.map(cfg => ({
    ...cfg,
    stats: aggregatedStats.value[cfg.id] || { total: 0, passed: 0, overallRate: 0 }
  }))
})

// Currently active band object
const activeBand = computed(() => {
  return gradeBandsList.value.find(b => b.id === activeBandId.value) || gradeBandsList.value[0]
})

// Overall average band for ghost overlay
const allBand = computed(() => {
  return gradeBandsList.value.find(b => b.id === 'ALL') || gradeBandsList.value[0]
})

// Advantage Delta (교과 합격률 - 종합 합격률)
const advantageDelta = computed(() => {
  const g = activeBand.value.stats.gyogwa?.rate || 0
  const j = activeBand.value.stats.jonghap?.rate || 0
  return Number((g - j).toFixed(1))
})

const advantageDeltaText = computed(() => {
  const delta = advantageDelta.value
  if (delta > 0) return `교과가 +${delta}%p 유리`
  if (delta < 0) return `종합이 +${Math.abs(delta)}%p 유리`
  return '교과·종합 동률 (0%p)'
})

// Table rows for right breakdown
const subTypeTableRows = computed(() => {
  const details = activeBand.value.stats.radar5?.details
  if (!details) return []

  return [
    {
      label: '일반전형',
      gyogwaRate: details.general.g.rate,
      gyogwaCount: `${details.general.g.passed}/${details.general.g.total}`,
      jonghapRate: details.general.j.rate,
      jonghapCount: `${details.general.j.passed}/${details.general.j.total}`
    },
    {
      label: '농어촌 전형',
      gyogwaRate: details.rural.g.rate,
      gyogwaCount: `${details.rural.g.passed}/${details.rural.g.total}`,
      jonghapRate: details.rural.j.rate,
      jonghapCount: `${details.rural.j.passed}/${details.rural.j.total}`
    },
    {
      label: '기회균형 전형',
      gyogwaRate: details.opp.g.rate,
      gyogwaCount: `${details.opp.g.passed}/${details.opp.g.total}`,
      jonghapRate: details.opp.j.rate,
      jonghapCount: `${details.opp.j.passed}/${details.opp.j.total}`
    },
    {
      label: '농어촌+기회 합계',
      gyogwaRate: details.ruralOrOpp.g.rate,
      gyogwaCount: `${details.ruralOrOpp.g.passed}/${details.ruralOrOpp.g.total}`,
      jonghapRate: details.ruralOrOpp.j.rate,
      jonghapCount: `${details.ruralOrOpp.j.passed}/${details.ruralOrOpp.j.total}`
    }
  ]
})

// Dynamic Insight Comment per Band
const bandInsightComment = computed(() => {
  const id = activeBand.value.id
  switch (id) {
    case '1':
      return '1등급대는 서울 주요 상위권 대학 중심 출원으로 경쟁이 치열하나, 농어촌 및 고른기회 전형에서 교과/종합 모두 압도적인 80% 이상의 높은 합격률을 나타냅니다.'
    case '2':
      return '2등급대는 서울 중하위권 및 수도권 선호 대학에서 교과 전형의 합격 안정성이 종합 전형보다 약 15%p 이상 높게 형성되는 핵심 전략 구간입니다.'
    case '3':
      return '3등급대는 수도권 및 지방거점국립대 타겟 구간으로, 일반 전형 대비 농어촌/기회균형 전형에서 교과 합격률이 가장 극적으로 상승하는 특징이 있습니다.'
    case '4':
      return '4등급대는 일반전형 교과의 경우 수도권 진입이 어려워지나, 교과 전형의 충원 합격률과 지방 국립대 및 수도권 외곽 대학에서 높은 반등률을 보입니다.'
    case '5':
      return '5등급대는 학생부종합 전형의 실효성이 크게 감소하며, 정량평가 중심의 전문대 교과 및 충청권 4년제 특성화 전형이 주효합니다.'
    case '6':
    case '7_9':
      return '6~9등급대는 실기위주 전형 및 전문대 유망 학과 위주의 출원이 두드러지며, 일반 4년제 종합전형보다는 교과 및 실기 전형이 유리합니다.'
    default:
      return '과거 입결 통계에 비추어 볼 때, 전 등급대에 걸쳐 학생부종합보다 학생부교과 전형의 실질 합격률이 전반적으로 높게 나타납니다.'
  }
})

// -------------------------------------------------------------
// Chart.js Radar Data & Options Configuration
// -------------------------------------------------------------

const radarLabels5 = ['전체', '일반전형', '농어촌', '기회균형', '농어촌+기회']
const radarLabels4 = ['학생부교과', '학생부종합', '논술위주', '실기/실적']

const radarChartData = computed(() => {
  if (chartMode.value === 'majorType') {
    // 4대 전형 모드
    const datasets = [
      {
        label: `${activeBand.value.label} 전형별 합격률`,
        data: activeBand.value.stats.radar4 || [0, 0, 0, 0],
        backgroundColor: 'rgba(99, 102, 241, 0.25)',
        borderColor: '#4f46e5',
        pointBackgroundColor: '#4f46e5',
        pointBorderColor: '#ffffff',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#4f46e5',
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2.5
      }
    ]

    // Ghost Overlay (전체 평균)
    if (showGhostOverlay.value && activeBand.value.id !== 'ALL') {
      datasets.unshift({
        label: '수시 전체 평균 (기준선)',
        data: allBand.value.stats.radar4 || [0, 0, 0, 0],
        backgroundColor: 'rgba(203, 213, 225, 0.15)',
        borderColor: '#94a3b8',
        borderDash: [4, 4],
        pointBackgroundColor: '#cbd5e1',
        pointBorderColor: '#ffffff',
        pointRadius: 2.5,
        borderWidth: 1.5
      })
    }

    return { labels: radarLabels4, datasets }
  }

  // 5축 세부 전형 모드 (교과 vs 종합)
  const current5 = activeBand.value.stats.radar5 || { gyogwa: [0,0,0,0,0], jonghap: [0,0,0,0,0] }
  const all5 = allBand.value.stats.radar5 || { gyogwa: [0,0,0,0,0], jonghap: [0,0,0,0,0] }

  const datasets = [
    {
      label: '학생부교과',
      data: current5.gyogwa,
      backgroundColor: 'rgba(37, 99, 235, 0.2)',
      borderColor: '#2563eb',
      pointBackgroundColor: '#2563eb',
      pointBorderColor: '#ffffff',
      pointHoverBackgroundColor: '#ffffff',
      pointHoverBorderColor: '#2563eb',
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2.5
    },
    {
      label: '학생부종합',
      data: current5.jonghap,
      backgroundColor: 'rgba(245, 158, 11, 0.2)',
      borderColor: '#f59e0b',
      pointBackgroundColor: '#f59e0b',
      pointBorderColor: '#ffffff',
      pointHoverBackgroundColor: '#ffffff',
      pointHoverBorderColor: '#f59e0b',
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2.5
    }
  ]

  // Ghost Overlay (전체 평균 점선 비교)
  if (showGhostOverlay.value && activeBand.value.id !== 'ALL') {
    datasets.push({
      label: '전체 평균 (교과)',
      data: all5.gyogwa,
      backgroundColor: 'transparent',
      borderColor: '#93c5fd',
      borderDash: [3, 3],
      pointRadius: 2,
      borderWidth: 1.2
    })
    datasets.push({
      label: '전체 평균 (종합)',
      data: all5.jonghap,
      backgroundColor: 'transparent',
      borderColor: '#fde68a',
      borderDash: [3, 3],
      pointRadius: 2,
      borderWidth: 1.2
    })
  }

  return { labels: radarLabels5, datasets }
})

const radarChartOptions = computed(() => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 350,
      easing: 'easeOutQuart'
    },
    plugins: {
      legend: {
        display: false // We use our custom HTML badges
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { family: 'Pretendard', size: 12, weight: 'bold' },
        bodyFont: { family: 'Pretendard', size: 11 },
        padding: 10,
        cornerRadius: 10,
        callbacks: {
          label: (ctx) => {
            return ` ${ctx.dataset.label}: ${ctx.formattedValue}%`
          }
        }
      }
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          display: true,
          backdropColor: 'transparent',
          color: '#94a3b8',
          font: { family: 'Pretendard', size: 9 },
          callback: (v) => `${v}%`
        },
        grid: {
          color: '#e2e8f0',
          circular: true
        },
        angleLines: {
          color: '#e2e8f0'
        },
        pointLabels: {
          font: { family: 'Pretendard', size: 12, weight: '700' },
          color: '#334155',
          padding: 10
        }
      }
    }
  }
})
</script>
