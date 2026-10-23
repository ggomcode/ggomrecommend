<template>
  <div class="mt-2.5 rounded-xl border transition-all text-xs overflow-hidden" :class="containerClass">
    <!-- 1. 최저학력기준 헤더 바 -->
    <div class="p-2.5 flex items-start justify-between gap-2">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span 
            class="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-tight shrink-0 shadow-2xs"
            :class="hasRule ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'"
          >
            {{ hasRule ? '수능최저' : '최저미적용' }}
          </span>

          <!-- 정제된 요약 규칙 -->
          <span v-if="hasRule" class="font-bold text-slate-800 dark:text-slate-100 text-[11px] truncate">
            {{ parsedRule.summary || '수능최저학력기준 적용' }}
          </span>
          <span v-else class="text-slate-400 text-[11px]">
            수능최저학력기준 없음
          </span>
        </div>

        <!-- 최저기준 원문 (펼침 토글 가능) -->
        <div v-if="hasRule" class="mt-1">
          <p 
            v-if="!showRawText" 
            class="text-[11px] text-slate-500 line-clamp-1 cursor-pointer hover:text-slate-700 m-0"
            @click="showRawText = true"
            title="클릭하여 모집요강 원문 전체 보기"
          >
            {{ minScoreReq }}
          </p>
          <div 
            v-else 
            class="text-[11px] text-slate-600 bg-white/90 p-2 rounded-lg border border-slate-200 mt-1 whitespace-pre-line leading-relaxed shadow-2xs"
          >
            <div class="flex justify-between items-center pb-1 mb-1 border-b border-slate-100 font-semibold text-slate-700">
              <span>📋 P열 모집요강 원문</span>
              <button 
                @click="showRawText = false" 
                class="text-[10px] text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer"
              >
                닫기 ✕
              </button>
            </div>
            {{ minScoreReq }}
          </div>
        </div>
      </div>

      <!-- 원문 접기/펼치기 토글 버튼 -->
      <button 
        v-if="hasRule"
        @click="showRawText = !showRawText"
        class="shrink-0 p-1 text-[10px] text-slate-400 hover:text-indigo-600 bg-transparent border-none cursor-pointer"
        :title="showRawText ? '원문 접기' : '원문 펼치기'"
      >
        {{ showRawText ? '▲' : '▼' }}
      </button>
    </div>

    <!-- 2. 월별 모의고사 최저 충족 트래커 -->
    <div v-if="hasRule" class="px-2.5 pb-2.5 pt-1 border-t border-slate-100 bg-slate-50/70">
      <div class="flex items-center justify-between mb-1.5 text-[10px] text-slate-500 font-semibold">
        <span class="flex items-center gap-1">
          <span>🎯</span>
          <span>월별 모의고사 최저 충족 현황</span>
        </span>
        <span v-if="evaluations.length > 0" class="text-indigo-600 font-bold">
          충족률: {{ satisfiedCount }}/{{ evaluations.length }}회 ({{ Math.round((satisfiedCount / evaluations.length) * 100) }}%)
        </span>
      </div>

      <!-- 모의고사 데이터가 있는 경우: 회차별 배지 나열 -->
      <div v-if="evaluations.length > 0" class="flex flex-wrap gap-1.5">
        <div
          v-for="ev in evaluations"
          :key="ev.examName"
          class="group relative flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold transition-all shadow-2xs cursor-help"
          :class="ev.isSatisfied 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' 
            : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'"
        >
          <!-- 월/회차 이름 -->
          <span class="font-bold text-[10px] opacity-80">{{ formatExamLabel(ev.examName) }}</span>
          
          <!-- 상태 아이콘 & 등급합 -->
          <span class="font-extrabold flex items-center gap-0.5">
            <span>{{ ev.isSatisfied ? '✅' : '❌' }}</span>
            <span v-if="ev.achievedSum !== null">{{ ev.achievedSum }}합</span>
            <span v-else>{{ ev.isSatisfied ? '충족' : '미충족' }}</span>
          </span>

          <!-- 여유/부족 표시 -->
          <span 
            class="text-[9px] px-1 py-0.2 rounded font-mono"
            :class="ev.isSatisfied ? 'bg-emerald-200/60 text-emerald-900' : 'bg-rose-200/60 text-rose-900'"
          >
            {{ ev.gap !== null ? (ev.gap <= 0 ? `+${Math.abs(ev.gap)}여유` : `-${ev.gap}부족`) : (ev.isSatisfied ? '충족' : '부족') }}
          </span>

          <!-- 호버 툴팁 (상세 조합 및 불합격 사유) -->
          <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-50 min-w-[190px] p-2 bg-slate-900 text-white text-[10px] rounded-xl shadow-xl pointer-events-none leading-relaxed">
            <div class="font-bold border-b border-slate-700 pb-1 mb-1 flex justify-between">
              <span>{{ ev.examName }} 성적</span>
              <span :class="ev.isSatisfied ? 'text-emerald-400' : 'text-rose-400'">
                {{ ev.isSatisfied ? '충족 통과' : '최저 미충족' }}
              </span>
            </div>
            <div class="text-slate-300 font-mono">{{ ev.detailText }}</div>
            <div v-if="ev.failReasons && ev.failReasons.length > 0" class="mt-1 text-rose-300 text-[9px]">
              ⚠️ 사유: {{ ev.failReasons.join(' / ') }}
            </div>
            <!-- 삼각형 꼭짓점 -->
            <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
          </div>
        </div>
      </div>

      <!-- 모의고사 성적이 아직 없는 경우 -->
      <div v-else class="flex items-center justify-between py-1 text-[11px] text-slate-400">
        <span>해당 학생의 모의고사 성적이 등록되지 않았습니다.</span>
        <button 
          v-if="canLoadMock" 
          @click="$emit('request-mock-load')"
          class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 cursor-pointer transition-colors"
        >
          모의고사 동기화 🔄
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { parseCsatRequirement, evaluateCsatRequirement } from '../utils/csatMinScoreEvaluator.js'

const props = defineProps({
  minScoreReq: {
    type: String,
    default: ''
  },
  studentField: {
    type: String,
    default: '공통'
  },
  mockExams: {
    type: Array,
    default: () => []
  },
  canLoadMock: {
    type: Boolean,
    default: true
  }
})

defineEmits(['request-mock-load'])

const showRawText = ref(false)

// 최저학력기준 파싱
const parsedRule = computed(() => {
  return parseCsatRequirement(props.minScoreReq, props.studentField)
})

const hasRule = computed(() => {
  return parsedRule.value && parsedRule.value.isValid
})

const containerClass = computed(() => {
  if (!hasRule.value) {
    return 'bg-slate-50 border-slate-200 text-slate-600'
  }
  return 'bg-amber-50/40 border-amber-200/70 text-slate-800'
})

// 회차별 판정 결과 목록 산출
const evaluations = computed(() => {
  if (!hasRule.value || !Array.isArray(props.mockExams) || props.mockExams.length === 0) {
    return []
  }

  return props.mockExams.map(exam => {
    return evaluateCsatRequirement(parsedRule.value, exam)
  })
})

const satisfiedCount = computed(() => {
  return evaluations.value.filter(e => e.isSatisfied).length
})

// '2027학년도 9월 모의평가' -> '9월' 간소화 헬퍼
function formatExamLabel(name = '') {
  const match = String(name).match(/([0-9]{1,2})\s*월/)
  if (match) return `${match[1]}월`
  if (name.includes('수능') || name.includes('대수능')) return '수능'
  return name.slice(0, 4)
}
</script>
