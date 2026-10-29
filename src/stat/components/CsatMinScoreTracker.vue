<template>
  <div class="mt-2.5 rounded-xl border transition-all text-xs relative" :class="containerClass">
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
            class="text-[11px] text-slate-600 bg-white/95 p-2 rounded-lg border border-slate-200 mt-1 whitespace-pre-line leading-relaxed shadow-sm z-10 relative"
          >
            <div class="flex justify-between items-center pb-1 mb-1 border-b border-slate-100 font-semibold text-slate-700">
              <span>📋 모집요강 수능최저 원문</span>
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

    <!-- 2. 월별 모의고사 최저 충족 트래커 (3~10월 가로축 1열 시각화 그래프) -->
    <div v-if="hasRule" class="px-2.5 pb-2.5 pt-1 border-t border-slate-100 bg-slate-50/70 relative">
      <div class="flex items-center justify-between mb-2 text-[10px] text-slate-500 font-semibold">
        <span class="flex items-center gap-1">
          <span>🎯</span>
          <span>월별 모의고사 최저 충족 추이 (3~10월)</span>
        </span>
        <span v-if="validEvaluatedCount > 0" class="font-bold" :class="satisfiedCount > 0 ? 'text-indigo-600' : 'text-slate-500'">
          유효응시 {{ validEvaluatedCount }}회 중 <span class="text-indigo-600 font-extrabold">{{ satisfiedCount }}회 충족</span> ({{ Math.round((satisfiedCount / validEvaluatedCount) * 100) }}%)
        </span>
        <span v-else class="text-slate-400 font-normal">
          성적 데이터 확인 필요
        </span>
      </div>

      <!-- 모의고사 데이터가 있는 경우: 가로축 1열 6분할 타임라인 스트립 -->
      <div v-if="sortedEvaluations.length > 0" class="grid grid-cols-6 gap-1 sm:gap-1.5 w-full relative">
        <div
          v-for="(ev, idx) in sortedEvaluations"
          :key="ev.examName"
          class="group relative flex flex-col items-center justify-between py-1.5 px-0.5 rounded-lg border text-center transition-all duration-150 cursor-pointer select-none"
          :class="getBlockClass(ev)"
        >
          <!-- 1) 월 회차 라벨 -->
          <span class="text-[10px] font-bold tracking-tight opacity-90">
            {{ formatExamLabel(ev.examName) }}
          </span>
          
          <!-- 2) 상태 아이콘 & 합산 등급 -->
          <div class="my-0.5 flex flex-col items-center justify-center min-h-[28px]">
            <span class="text-xs leading-none">
              <template v-if="ev.status === 'NO_SCORE'">⚪</template>
              <template v-else-if="ev.status === 'INSUFFICIENT'">⚠️</template>
              <template v-else-if="ev.isSatisfied">✅</template>
              <template v-else>❌</template>
            </span>
            <span class="text-[10px] font-extrabold tracking-tight mt-0.5 leading-none">
              <template v-if="ev.status === 'NO_SCORE'">미입력</template>
              <template v-else-if="ev.status === 'INSUFFICIENT'">부족</template>
              <template v-else-if="ev.achievedSum !== null">{{ ev.achievedSum }}합</template>
              <template v-else>{{ ev.isSatisfied ? '충족' : '미충족' }}</template>
            </span>
          </div>

          <!-- 3) 여유/부족 표시 바 -->
          <div 
            class="w-full text-[9px] py-0.5 px-0.5 rounded font-mono font-bold truncate leading-none"
            :class="getTagClass(ev)"
          >
            <template v-if="ev.status === 'NO_SCORE'">미응시</template>
            <template v-else-if="ev.status === 'INSUFFICIENT'">과목부족</template>
            <template v-else-if="ev.gap !== null">
              {{ ev.gap <= 0 ? `+${Math.abs(ev.gap)}여유` : `-${ev.gap}부족` }}
            </template>
            <template v-else>{{ ev.isSatisfied ? '충족' : '부족' }}</template>
          </div>

          <!-- 4) 스마트 호버 툴팁 (잘림 방지 스마트 포지셔닝: z-50, 좌/중/우 정렬 보정) -->
          <div 
            class="absolute bottom-full mb-2 hidden group-hover:block z-50 min-w-[200px] max-w-[260px] p-2.5 bg-slate-900/95 backdrop-blur-md text-white text-[11px] rounded-xl shadow-2xl pointer-events-none leading-relaxed text-left border border-slate-700/70"
            :class="getTooltipPositionClass(idx, sortedEvaluations.length)"
          >
            <!-- 툴팁 헤더 -->
            <div class="font-bold border-b border-slate-700/80 pb-1 mb-1.5 flex items-center justify-between gap-1 text-[11px]">
              <span class="text-slate-200 truncate">{{ ev.examName }}</span>
              <span 
                class="px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0"
                :class="getTooltipBadgeClass(ev)"
              >
                {{ getTooltipBadgeText(ev) }}
              </span>
            </div>

            <!-- 성적 조합 및 판정 텍스트 -->
            <div class="text-slate-300 font-mono text-[10px] break-keep leading-snug">
              {{ ev.detailText }}
            </div>

            <!-- 불합격/부족 사유 안내 -->
            <div 
              v-if="ev.failReasons && ev.failReasons.length > 0 && ev.status !== 'NO_SCORE'" 
              class="mt-1.5 pt-1 border-t border-slate-800 text-rose-300 text-[10px] leading-tight"
            >
              <div class="font-bold flex items-center gap-1 text-rose-400">
                <span>⚠️ 미충족 사유:</span>
              </div>
              <ul class="list-disc list-inside mt-0.5 space-y-0.5 text-[9px] text-rose-200">
                <li v-for="(reason, rIdx) in ev.failReasons" :key="rIdx">
                  {{ reason }}
                </li>
              </ul>
            </div>

            <!-- 최저 기준 요약 리마인더 -->
            <div class="mt-1.5 pt-1 border-t border-slate-800 text-[9px] text-slate-400">
              📌 기준: {{ parsedRule.summary }}
            </div>

            <!-- 툴팁 삼각형 꼬리 -->
            <div 
              class="absolute top-full border-4 border-transparent border-t-slate-900/95"
              :class="getTooltipArrowClass(idx, sortedEvaluations.length)"
            ></div>
          </div>
        </div>
      </div>

      <!-- 모의고사 성적이 아예 등록되지 않은 경우 -->
      <div v-else class="flex items-center justify-between py-2 text-[11px] text-slate-400">
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

// 3월 -> 10월 순으로 정렬된 평가 목록 (3~10월 가로 1열 스트립 보장)
const sortedEvaluations = computed(() => {
  if (!evaluations.value || evaluations.value.length === 0) return []

  return [...evaluations.value].sort((a, b) => {
    const getMonthNum = (name = '') => {
      const match = String(name).match(/([0-9]{1,2})\s*월/)
      if (match) return parseInt(match[1], 10)
      if (name.includes('수능') || name.includes('대수능')) return 11
      return 0
    }
    return getMonthNum(a.examName) - getMonthNum(b.examName)
  })
})

// 실제 성적이 입력되어 판정된 회차 수 (미응시/미입력 제외)
const validEvaluatedCount = computed(() => {
  return sortedEvaluations.value.filter(e => e.status !== 'NO_SCORE').length
})

// 충족한 회차 수
const satisfiedCount = computed(() => {
  return sortedEvaluations.value.filter(e => e.isSatisfied).length
})

// '2027학년도 9월 모의평가' -> '9월' 간소화 헬퍼
function formatExamLabel(name = '') {
  const match = String(name).match(/([0-9]{1,2})\s*월/)
  if (match) return `${match[1]}월`
  if (name.includes('수능') || name.includes('대수능')) return '수능'
  return name.slice(0, 4)
}

// 각 월별 블록 컨테이너 클래스 (상태별 색상 분기)
function getBlockClass(ev) {
  if (ev.status === 'NO_SCORE') {
    return 'bg-slate-50/80 text-slate-400 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
  }
  if (ev.status === 'INSUFFICIENT') {
    return 'bg-amber-50/70 text-amber-800 border-amber-200 hover:bg-amber-100/80 hover:border-amber-300'
  }
  if (ev.isSatisfied) {
    return 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 hover:shadow-xs'
  }
  return 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100 hover:shadow-xs'
}

// 하단 뱃지 태그 클래스
function getTagClass(ev) {
  if (ev.status === 'NO_SCORE') {
    return 'bg-slate-200/60 text-slate-500'
  }
  if (ev.status === 'INSUFFICIENT') {
    return 'bg-amber-200/70 text-amber-900'
  }
  if (ev.isSatisfied) {
    return 'bg-emerald-200/70 text-emerald-900'
  }
  return 'bg-rose-200/70 text-rose-900'
}

// 툴팁 위치 클래스 (좌/중/우 카드 경계선 벗어남 방지)
function getTooltipPositionClass(index, total) {
  if (index <= 1) {
    return 'left-0' // 첫 1~2개(3월, 5월): 좌측 정렬하여 오른쪽으로 펼침
  }
  if (index >= total - 2) {
    return 'right-0' // 마지막 2개(9월, 10월): 우측 정렬하여 왼쪽으로 펼침
  }
  return 'left-1/2 -translate-x-1/2' // 가운데: 중앙 정렬
}

// 툴팁 삼각형 꼬리 위치 클래스
function getTooltipArrowClass(index, total) {
  if (index <= 1) {
    return 'left-4'
  }
  if (index >= total - 2) {
    return 'right-4'
  }
  return 'left-1/2 -translate-x-1/2'
}

// 툴팁 상단 뱃지 텍스트
function getTooltipBadgeText(ev) {
  if (ev.status === 'NO_SCORE') return '성적 미입력'
  if (ev.status === 'INSUFFICIENT') return '응시영역 부족'
  if (ev.isSatisfied) return '최저 충족'
  return '최저 미충족'
}

// 툴팁 상단 뱃지 색상
function getTooltipBadgeClass(ev) {
  if (ev.status === 'NO_SCORE') return 'bg-slate-700 text-slate-300'
  if (ev.status === 'INSUFFICIENT') return 'bg-amber-800 text-amber-200'
  if (ev.isSatisfied) return 'bg-emerald-600 text-white'
  return 'bg-rose-600 text-white'
}
</script>