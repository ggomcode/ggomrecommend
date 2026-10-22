<template>
  <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm transition-all duration-300">
    <!-- Header: Title & Ranking Range Selector -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/80 mb-2">
          <span>🏆</span>
          <span>대학별 합격률 랭킹</span>
          <span class="text-emerald-300">|</span>
          <span class="text-slate-500 font-semibold">{{ selectedAcademicYear }}학년도 기준</span>
        </div>
        <h3 class="text-lg sm:text-xl font-black text-slate-900 tracking-tight m-0">
          대학별 최종 합격률 순위 (상위 1위 ~ 60위)
        </h3>
        <p class="text-xs text-slate-500 m-0 mt-1 leading-relaxed">
          지원 건수 대비 최종 합격률이 높은 대학교 순위입니다. (구간별 20개교씩 선택 조회)
        </p>
      </div>

      <!-- Controls: Range Segment & Min Apps Filter -->
      <div class="flex flex-wrap items-center gap-2 shrink-0">
        <!-- Min Applications Filter -->
        <div class="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-200 text-xs">
          <span class="text-[11px] text-slate-500 font-medium px-2">최소 지원:</span>
          <button
            v-for="opt in minAppsOptions"
            :key="opt.value"
            @click="minApps = opt.value"
            :class="[
              'px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border-none',
              minApps === opt.value
                ? 'bg-white text-indigo-700 shadow-2xs font-extrabold'
                : 'bg-transparent text-slate-500 hover:text-slate-800'
            ]"
          >
            {{ opt.label }}
          </button>
        </div>

        <!-- Rank Range Segmented Buttons -->
        <div class="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            v-for="r in rangeOptions"
            :key="r.id"
            @click="activeRange = r.id"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer border-none flex items-center gap-1',
              activeRange === r.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-transparent text-slate-600 hover:text-slate-900'
            ]"
          >
            <span>{{ r.emoji }}</span>
            <span>{{ r.label }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Summary KPI Bar -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-slate-100">
      <div class="bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
        <span class="text-[10px] text-slate-500 font-medium block">집계 대상 대학</span>
        <span class="text-sm font-black text-slate-800">{{ rankedUnivList.length }}개교</span>
      </div>
      <div class="bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
        <span class="text-[10px] text-slate-500 font-medium block">현재 구간 ({{ currentRangeLabel }})</span>
        <span class="text-sm font-black text-emerald-700">{{ currentDisplayList.length }}개교 표시</span>
      </div>
      <div class="bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
        <span class="text-[10px] text-slate-500 font-medium block">구간 최고 합격률</span>
        <span class="text-sm font-black text-indigo-700 font-mono">{{ topRateInRange }}%</span>
      </div>
      <div class="bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
        <span class="text-[10px] text-slate-500 font-medium block">구간 평균 합격률</span>
        <span class="text-sm font-black text-slate-700 font-mono">{{ avgRateInRange }}%</span>
      </div>
    </div>

    <!-- Universities Grid (2 Columns on Desktop) -->
    <div class="pt-4">
      <div v-if="currentDisplayList.length === 0" class="py-12 text-center text-xs text-slate-400">
        해당 순위 구간에 표시할 대학 데이터가 없습니다. (최소 지원 건수 필터를 조정해보세요)
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div
          v-for="item in currentDisplayList"
          :key="item.name"
          @click="$emit('select-univ', item.rawUniv)"
          class="bg-slate-50/60 hover:bg-emerald-50/40 p-4 rounded-2xl border border-slate-200/80 hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between group shadow-2xs"
        >
          <!-- Top: Rank, Name, Region, Pass Rate Badge -->
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center space-x-2.5">
              <!-- Rank Medal / Badge -->
              <span
                :class="[
                  'w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-2xs',
                  item.rank === 1 ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300/60' :
                  item.rank === 2 ? 'bg-slate-300 text-slate-800' :
                  item.rank === 3 ? 'bg-amber-600 text-white' :
                  'bg-white text-slate-700 border border-slate-200'
                ]"
              >
                {{ item.rank }}
              </span>

              <div>
                <div class="flex items-center space-x-1.5">
                  <h4 class="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors m-0">
                    {{ item.name }}
                  </h4>
                  <span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                    {{ item.region }}
                  </span>
                </div>
                <div class="text-[11px] text-slate-400 mt-0.5">
                  {{ item.passCount }}건 합격 / 총 {{ item.totalApps }}건 지원
                </div>
              </div>
            </div>

            <!-- Pass Rate Big Label -->
            <div class="text-right shrink-0">
              <span
                :class="[
                  'text-base font-black font-mono block leading-none',
                  item.passRate >= 70 ? 'text-emerald-600' :
                  item.passRate >= 40 ? 'text-indigo-600' :
                  item.passRate >= 20 ? 'text-blue-600' : 'text-slate-600'
                ]"
              >
                {{ item.passRate.toFixed(1) }}%
              </span>
              <span class="text-[10px] text-slate-400 font-medium mt-0.5 block">
                최종 합격률
              </span>
            </div>
          </div>

          <!-- Middle: Progress Bar -->
          <div class="mt-3">
            <div class="w-full h-2 bg-slate-200/70 rounded-full overflow-hidden flex">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="[
                  item.passRate >= 70 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                  item.passRate >= 40 ? 'bg-gradient-to-r from-indigo-500 to-blue-500' :
                  item.passRate >= 20 ? 'bg-gradient-to-r from-blue-500 to-sky-400' : 'bg-slate-400'
                ]"
                :style="{ width: `${Math.min(100, Math.max(4, item.passRate))}%` }"
              ></div>
            </div>
          </div>

          <!-- Bottom: Extra Meta (Average GPA of passed students) -->
          <div class="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
            <div>
              합격자 평균 내신:
              <strong v-if="item.avgPassedGrade" class="text-slate-800 font-mono font-bold">
                {{ item.avgPassedGrade }}등급
              </strong>
              <span v-else class="text-slate-400 font-normal">-</span>
            </div>
            <div class="text-slate-400 group-hover:text-emerald-600 font-medium flex items-center gap-0.5 transition-colors">
              <span>상세보기</span>
              <span>→</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useData } from '../composables/useStatData'

const emit = defineEmits(['select-univ'])

const { applications, selectedAcademicYear } = useData()

// Rank Range Options (1~20, 21~40, 41~60)
const rangeOptions = [
  { id: '1-20', label: '1위 ~ 20위', emoji: '🥇', start: 0, end: 20 },
  { id: '21-40', label: '21위 ~ 40위', emoji: '🥈', start: 20, end: 40 },
  { id: '41-60', label: '41위 ~ 60위', emoji: '🥉', start: 40, end: 60 }
]

const activeRange = ref('1-20')

// Min Applications Options
const minAppsOptions = [
  { value: 1, label: '전체 (1건 이상)' },
  { value: 3, label: '3건 이상' },
  { value: 5, label: '5건 이상' }
]
const minApps = ref(3) // 기본값 3건 이상으로 왜곡(1건 100%) 방지

// Evaluate whether an application is a final pass
function evaluateResult(app) {
  const finalRes = String(app.finalStage || '').trim()
  const isFinalPass = (finalRes.includes('합격') || finalRes.includes('충원') || finalRes.includes('최초') || app.registerStatus === 'Y') && !finalRes.includes('불합')
  return isFinalPass
}

// Compute Ranked Universities List
const rankedUnivList = computed(() => {
  if (!applications.value || applications.value.length === 0) return []

  const univMap = new Map()

  applications.value.forEach(app => {
    const name = String(app.univName || '').trim()
    if (!name) return

    if (!univMap.has(name)) {
      univMap.set(name, {
        name,
        region: app.region || '기타',
        totalApps: 0,
        passCount: 0,
        passedGrades: [],
        rawUniv: app
      })
    }

    const item = univMap.get(name)
    item.totalApps++

    const isPass = evaluateResult(app)
    if (isPass) {
      item.passCount++
      const g = Number(app.allSubjectGrade)
      if (!isNaN(g) && g > 0) {
        item.passedGrades.push(g)
      }
    }
  })

  // Filter by min applications and compute pass rate
  let list = Array.from(univMap.values())
    .filter(u => u.totalApps >= minApps.value)
    .map(u => {
      const passRate = u.totalApps > 0 ? (u.passCount / u.totalApps) * 100 : 0
      const avgPassedGrade = u.passedGrades.length > 0 
        ? (u.passedGrades.reduce((a, b) => a + b, 0) / u.passedGrades.length).toFixed(2)
        : null

      return {
        ...u,
        passRate,
        avgPassedGrade
      }
    })

  // Sort by Pass Rate DESC, then Pass Count DESC, then Total Apps DESC
  list.sort((a, b) => {
    if (b.passRate !== a.passRate) return b.passRate - a.passRate
    if (b.passCount !== a.passCount) return b.passCount - a.passCount
    return b.totalApps - a.totalApps
  })

  // Assign overall rank
  return list.map((item, idx) => ({
    ...item,
    rank: idx + 1
  }))
})

// Current display slice based on active range
const currentDisplayList = computed(() => {
  const range = rangeOptions.find(r => r.id === activeRange.value) || rangeOptions[0]
  return rankedUnivList.value.slice(range.start, range.end)
})

const currentRangeLabel = computed(() => {
  const range = rangeOptions.find(r => r.id === activeRange.value)
  return range ? range.label : '1위 ~ 20위'
})

const topRateInRange = computed(() => {
  if (currentDisplayList.value.length === 0) return '0.0'
  return currentDisplayList.value[0].passRate.toFixed(1)
})

const avgRateInRange = computed(() => {
  if (currentDisplayList.value.length === 0) return '0.0'
  const sum = currentDisplayList.value.reduce((acc, cur) => acc + cur.passRate, 0)
  return (sum / currentDisplayList.value.length).toFixed(1)
})
</script>
