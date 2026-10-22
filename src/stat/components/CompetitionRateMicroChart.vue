<template>
  <div v-if="hasAnyData" class="mt-3 p-2.5 bg-slate-50/90 rounded-xl border border-slate-200/80">
    <!-- Header: Title & Axis Note -->
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center space-x-1.5">
        <span class="text-[11px] font-bold text-slate-700 flex items-center">
          <svg class="w-3 h-3 text-indigo-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          최근 3개년 경쟁률 추이
        </span>
        <span class="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-600 font-medium border border-indigo-100">
          기준 20:1
        </span>
      </div>
      <div class="text-[10px] text-slate-400">
        <span class="inline-flex items-center">
          <span class="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1"></span>20:1 초과(물결축)
        </span>
      </div>
    </div>

    <!-- Micro Chart Area -->
    <div class="relative bg-white rounded-lg p-2 pt-3 border border-slate-100 shadow-2xs">
      <!-- 20:1 Max Baseline -->
      <div class="absolute left-2 right-2 top-7 border-t border-dashed border-slate-200 pointer-events-none flex justify-end">
        <span class="text-[8px] text-slate-500 -mt-2 bg-white px-0.5">20:1</span>
      </div>
      <!-- 10:1 Mid Baseline -->
      <div class="absolute left-2 right-2 top-[52px] border-t border-dashed border-slate-100 pointer-events-none flex justify-end">
        <span class="text-[8px] text-slate-500 -mt-2 bg-white px-0.5">10:1</span>
      </div>

      <!-- 3 Years Columns Grid -->
      <div class="grid grid-cols-3 gap-2 text-center relative z-10 pt-1">
        <div 
          v-for="year in years" 
          :key="year"
          class="flex flex-col items-center justify-end"
        >
          <!-- Value Label or '자료없음' -->
          <div class="h-4.5 flex items-center justify-center mb-1">
            <template v-if="getItem(year).rate !== null">
              <span 
                :class="[
                  'text-[10px] font-bold leading-none px-1 py-0.5 rounded',
                  getItem(year).rate > 20 
                    ? 'text-rose-600 bg-rose-50 border border-rose-200/60 shadow-2xs' 
                    : 'text-indigo-700 bg-indigo-50/70'
                ]"
              >
                {{ formatRate(getItem(year).rate) }}
              </span>
            </template>
            <template v-else>
              <span class="text-[9px] text-slate-400 font-normal">
                {{ getItem(year).raw || '자료없음' }}
              </span>
            </template>
          </div>

          <!-- Bar Container (Fixed Height 58px) -->
          <div class="w-full h-[58px] flex items-end justify-center px-1">
            <!-- Case 1: Valid Data -->
            <template v-if="getItem(year).rate !== null">
              <!-- Over 20:1 (Broken axis wave) -->
              <div 
                v-if="getItem(year).rate > 20"
                class="w-8 h-full flex flex-col justify-between relative group cursor-help"
                :title="getTooltipText(year)"
              >
                <!-- Upper Part -->
                <div class="w-full bg-gradient-to-t from-purple-500 to-rose-500 rounded-t-sm h-[24px] shadow-xs"></div>
                
                <!-- Squiggly / Wave Break Mark (물결 표시) -->
                <div class="w-full h-3 my-[-1px] relative flex items-center justify-center z-10 overflow-hidden">
                  <svg class="w-full h-3 text-slate-300 drop-shadow-xs" viewBox="0 0 32 10" preserveAspectRatio="none">
                    <path 
                      d="M 0 5 Q 8 0, 16 5 T 32 5" 
                      fill="none" 
                      stroke="#cbd5e1" 
                      stroke-width="2" 
                      stroke-linecap="round"
                    />
                    <path 
                      d="M 0 8 Q 8 3, 16 8 T 32 8" 
                      fill="none" 
                      stroke="#cbd5e1" 
                      stroke-width="1.5" 
                      stroke-linecap="round"
                    />
                  </svg>
                  <span class="absolute text-[8px] font-black text-rose-500 select-none">≈</span>
                </div>

                <!-- Lower Part -->
                <div class="w-full bg-gradient-to-t from-indigo-600 to-purple-600 h-[22px] rounded-b-2xs"></div>
              </div>

              <!-- Normal <= 20:1 (Proportional Bar) -->
              <div 
                v-else
                class="w-8 flex flex-col justify-end group cursor-help"
                :style="{ height: getBarHeight(getItem(year).rate) }"
                :title="getTooltipText(year)"
              >
                <div class="w-full h-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-sm shadow-2xs hover:brightness-110 transition-all"></div>
              </div>
            </template>

            <!-- Case 2: No Data (Empty Box) -->
            <template v-else>
              <div class="w-8 h-full rounded-sm border border-dashed border-slate-200 bg-slate-50/60 flex items-center justify-center">
                <span class="text-[8px] text-slate-300 font-medium select-none">-</span>
              </div>
            </template>
          </div>

          <!-- Bottom: Year Label -->
          <div class="mt-1.5">
            <span 
              :class="[
                'text-[10px] font-semibold block leading-tight',
                year === '2027' ? 'text-indigo-700 font-bold' : 'text-slate-500'
              ]"
            >
              {{ year }}
            </span>
            <!-- Quota / Applicants Subtitle -->
            <span class="text-[8px] text-slate-400 block leading-tight truncate max-w-[64px] mx-auto">
              <template v-if="getItem(year).quota || getItem(year).applicants">
                {{ getItem(year).quota || '-' }}명/{{ getItem(year).applicants || '-' }}명
              </template>
              <template v-else>
                미매칭
              </template>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  rates: {
    type: Object,
    default: () => ({})
  }
})

const years = ['2025', '2026', '2027']

function getItem(year) {
  return props.rates?.[year] || { quota: '', applicants: '', rate: null, raw: '' }
}

const hasAnyData = computed(() => {
  if (!props.rates) return false
  return years.some(y => {
    const it = props.rates[y]
    return it && (it.rate !== null || it.quota || it.applicants || (it.raw && it.raw !== '자료없음'))
  })
})

function formatRate(val) {
  if (val === null || val === undefined) return '-'
  return `${Number(val).toFixed(1)}:1`
}

function getBarHeight(rate) {
  if (!rate || rate <= 0) return '6px'
  // 세로축 최대값 20 기준 (백분율)
  const pct = Math.min(100, Math.max(12, Math.round((rate / 20) * 100)))
  return `${pct}%`
}

function getTooltipText(year) {
  const it = getItem(year)
  const rateText = it.rate !== null ? `${it.rate}:1` : (it.raw || '자료없음')
  const quotaText = it.quota ? `${it.quota}명` : '미지정'
  const appText = it.applicants ? `${it.applicants}명` : '미지정'
  return `${year}학년도 | 경쟁률: ${rateText} (모집: ${quotaText}, 지원: ${appText})`
}
</script>
