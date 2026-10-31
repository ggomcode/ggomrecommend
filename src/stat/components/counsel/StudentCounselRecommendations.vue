<template>
  <div class="space-y-6">
    <!-- Top Recommendation Strategy Banner -->
    <div class="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 rounded-2xl p-5 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 mb-2">
          <span>💡</span>
          <span>학생 데이터 기반 맞춤형 합격 라인 분석</span>
        </div>
        <h4 class="text-base sm:text-lg font-black text-white m-0">
          내신 {{ studentGpa }}등급 & 모평 최저 충족력 기반 4단계 추천 포트폴리오
        </h4>
        <p class="text-xs text-slate-300 mt-1 m-0">
          본교 5개년 합격선, 2025~2027 수능최저 충족률, 실질경쟁률 급락 데이터를 종합 연산한 추천 풀입니다.
        </p>
      </div>

      <div class="flex items-center space-x-2 shrink-0">
        <span class="text-xs text-indigo-200">
          지원 자격: <strong class="text-white">{{ student.hasRural ? '🌲 농어촌 전형 우대' : (student.hasRec ? '⭐ 학교장추천 우대' : '일반고 전형') }}</strong>
        </span>
      </div>
    </div>

    <!-- 4-Category Recommendation Grid -->
    <div class="space-y-6">
      
      <!-- 1. 🚀 상향 (Reach) : 도전 & 수능최저 역전 스나이핑 -->
      <div class="bg-white rounded-2xl border border-purple-200/80 shadow-xs p-5">
        <div class="flex items-center justify-between pb-3 mb-4 border-b border-purple-100">
          <div class="flex items-center space-x-2.5">
            <span class="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
              🚀
            </span>
            <div>
              <h5 class="text-sm font-bold text-slate-900 m-0">상향 (Reach / 도전)</h5>
              <div class="text-[11px] text-purple-600 font-medium">높은 수능최저 충족으로 실질경쟁률이 급락하여 역전이 가능한 전형</div>
            </div>
          </div>
          <span class="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
            합격 확률 30~50%
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div 
            v-for="(rec, idx) in recommendations.reach" 
            :key="idx"
            class="bg-purple-50/40 rounded-xl p-3.5 border border-purple-100/80 flex flex-col justify-between hover:border-purple-300 transition-colors"
          >
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-[11px] font-bold text-purple-800">{{ rec.admissionType }}</span>
                <span class="text-[10px] text-slate-400">기준 내신 ~{{ rec.targetGpa }}</span>
              </div>
              <h6 class="text-sm font-bold text-slate-900 m-0">{{ rec.univName }}</h6>
              <div class="text-xs font-semibold text-indigo-700 mt-0.5">{{ rec.dept }}</div>
              
              <!-- 최저기준 배지 -->
              <div class="mt-2 text-[10px] bg-white p-2 rounded-lg border border-purple-100 text-purple-900 font-medium">
                🎯 최저: {{ rec.minScoreText }}
              </div>

              <!-- 데이터 추천 근거 3선 -->
              <div class="mt-2.5 space-y-1 text-[11px] text-slate-600">
                <div class="flex items-start space-x-1">
                  <span class="text-purple-600 font-bold shrink-0">①</span>
                  <span>{{ rec.reasonData.cutDiff }}</span>
                </div>
                <div class="flex items-start space-x-1">
                  <span class="text-purple-600 font-bold shrink-0">②</span>
                  <span class="font-medium text-slate-800">{{ rec.reasonData.csatEffect }}</span>
                </div>
                <div class="flex items-start space-x-1">
                  <span class="text-purple-600 font-bold shrink-0">③</span>
                  <span class="text-slate-500">{{ rec.reasonData.schoolSeniorStat }}</span>
                </div>
              </div>
            </div>

            <div class="mt-3 pt-2.5 border-t border-purple-100/60 flex items-center justify-end">
              <button
                type="button"
                @click="$emit('swap-card', rec)"
                class="text-[11px] font-bold text-purple-700 bg-white hover:bg-purple-600 hover:text-white px-2.5 py-1 rounded-lg border border-purple-200 transition-all cursor-pointer shadow-2xs"
              >
                + 내 6장 카드로 임시 스왑
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. 🎯 적정 (Target) : 주력 승부처 & 합격 유력 -->
      <div class="bg-white rounded-2xl border border-blue-200/80 shadow-xs p-5">
        <div class="flex items-center justify-between pb-3 mb-4 border-b border-blue-100">
          <div class="flex items-center space-x-2.5">
            <span class="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              🎯
            </span>
            <div>
              <h5 class="text-sm font-bold text-slate-900 m-0">적정 (Target / 승부처)</h5>
              <div class="text-[11px] text-blue-600 font-medium">학생 내신이 전년도 70% 컷에 부합하고 최저 충족이 안정적인 핵심 카드</div>
            </div>
          </div>
          <span class="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            합격 확률 60~80%
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div 
            v-for="(rec, idx) in recommendations.target" 
            :key="idx"
            class="bg-blue-50/40 rounded-xl p-3.5 border border-blue-100/80 flex flex-col justify-between hover:border-blue-300 transition-colors"
          >
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-[11px] font-bold text-blue-800">{{ rec.admissionType }}</span>
                <span class="text-[10px] text-slate-400">기준 내신 ~{{ rec.targetGpa }}</span>
              </div>
              <h6 class="text-sm font-bold text-slate-900 m-0">{{ rec.univName }}</h6>
              <div class="text-xs font-semibold text-indigo-700 mt-0.5">{{ rec.dept }}</div>
              
              <div class="mt-2 text-[10px] bg-white p-2 rounded-lg border border-blue-100 text-blue-900 font-medium">
                🎯 최저: {{ rec.minScoreText }}
              </div>

              <div class="mt-2.5 space-y-1 text-[11px] text-slate-600">
                <div class="flex items-start space-x-1">
                  <span class="text-blue-600 font-bold shrink-0">①</span>
                  <span>{{ rec.reasonData.cutDiff }}</span>
                </div>
                <div class="flex items-start space-x-1">
                  <span class="text-blue-600 font-bold shrink-0">②</span>
                  <span class="font-medium text-slate-800">{{ rec.reasonData.csatEffect }}</span>
                </div>
                <div class="flex items-start space-x-1">
                  <span class="text-blue-600 font-bold shrink-0">③</span>
                  <span class="text-slate-500">{{ rec.reasonData.schoolSeniorStat }}</span>
                </div>
              </div>
            </div>

            <div class="mt-3 pt-2.5 border-t border-blue-100/60 flex items-center justify-end">
              <button
                type="button"
                @click="$emit('swap-card', rec)"
                class="text-[11px] font-bold text-blue-700 bg-white hover:bg-blue-600 hover:text-white px-2.5 py-1 rounded-lg border border-blue-200 transition-all cursor-pointer shadow-2xs"
              >
                + 내 6장 카드로 임시 스왑
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. 🛡️ 안정 (Safety) : 합격 확보 & 안전 벨트 -->
      <div class="bg-white rounded-2xl border border-emerald-200/80 shadow-xs p-5">
        <div class="flex items-center justify-between pb-3 mb-4 border-b border-emerald-100">
          <div class="flex items-center space-x-2.5">
            <span class="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
              🛡️
            </span>
            <div>
              <h5 class="text-sm font-bold text-slate-900 m-0">안정 (Safety / 합격확보)</h5>
              <div class="text-[11px] text-emerald-600 font-medium">내신이 80~90% 컷 이내이며 충원율이 높아 무조건 최초합 또는 빠른 추합 보장</div>
            </div>
          </div>
          <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            합격 확률 85% 이상
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div 
            v-for="(rec, idx) in recommendations.safety" 
            :key="idx"
            class="bg-emerald-50/40 rounded-xl p-3.5 border border-emerald-100/80 flex flex-col justify-between hover:border-emerald-300 transition-colors"
          >
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-[11px] font-bold text-emerald-800">{{ rec.admissionType }}</span>
                <span class="text-[10px] text-slate-400">기준 내신 ~{{ rec.targetGpa }}</span>
              </div>
              <h6 class="text-sm font-bold text-slate-900 m-0">{{ rec.univName }}</h6>
              <div class="text-xs font-semibold text-indigo-700 mt-0.5">{{ rec.dept }}</div>
              
              <div class="mt-2 text-[10px] bg-white p-2 rounded-lg border border-emerald-100 text-emerald-900 font-medium">
                🎯 최저: {{ rec.minScoreText }}
              </div>

              <div class="mt-2.5 space-y-1 text-[11px] text-slate-600">
                <div class="flex items-start space-x-1">
                  <span class="text-emerald-600 font-bold shrink-0">①</span>
                  <span>{{ rec.reasonData.cutDiff }}</span>
                </div>
                <div class="flex items-start space-x-1">
                  <span class="text-emerald-600 font-bold shrink-0">②</span>
                  <span class="font-medium text-slate-800">{{ rec.reasonData.csatEffect }}</span>
                </div>
                <div class="flex items-start space-x-1">
                  <span class="text-emerald-600 font-bold shrink-0">③</span>
                  <span class="text-slate-500">{{ rec.reasonData.schoolSeniorStat }}</span>
                </div>
              </div>
            </div>

            <div class="mt-3 pt-2.5 border-t border-emerald-100/60 flex items-center justify-end">
              <button
                type="button"
                @click="$emit('swap-card', rec)"
                class="text-[11px] font-bold text-emerald-700 bg-white hover:bg-emerald-600 hover:text-white px-2.5 py-1 rounded-lg border border-emerald-200 transition-all cursor-pointer shadow-2xs"
              >
                + 내 6장 카드로 임시 스왑
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. ⚓ 하향 (Backup) : 수시 필승 최후의 보루 -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div class="flex items-center space-x-2.5">
            <span class="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
              ⚓
            </span>
            <div>
              <h5 class="text-sm font-bold text-slate-900 m-0">하향 (Backup / 최후 보루)</h5>
              <div class="text-[11px] text-slate-500 font-medium">재수를 고려하지 않을 때 수능 당일 변수와 무관하게 100% 합격하는 확실한 보험</div>
            </div>
          </div>
          <span class="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            합격 확률 95% 이상
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div 
            v-for="(rec, idx) in recommendations.backup" 
            :key="idx"
            class="bg-slate-50/60 rounded-xl p-3.5 border border-slate-200/80 flex flex-col justify-between hover:border-slate-300 transition-colors"
          >
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-[11px] font-bold text-slate-800">{{ rec.admissionType }}</span>
                <span class="text-[10px] text-slate-400">기준 내신 ~{{ rec.targetGpa }}</span>
              </div>
              <h6 class="text-sm font-bold text-slate-900 m-0">{{ rec.univName }}</h6>
              <div class="text-xs font-semibold text-indigo-700 mt-0.5">{{ rec.dept }}</div>
              
              <div class="mt-2 text-[10px] bg-white p-2 rounded-lg border border-slate-200 text-slate-700 font-medium">
                🎯 최저: {{ rec.minScoreText }}
              </div>

              <div class="mt-2.5 space-y-1 text-[11px] text-slate-600">
                <div class="flex items-start space-x-1">
                  <span class="text-slate-700 font-bold shrink-0">①</span>
                  <span>{{ rec.reasonData.cutDiff }}</span>
                </div>
                <div class="flex items-start space-x-1">
                  <span class="text-slate-700 font-bold shrink-0">②</span>
                  <span class="font-medium text-slate-800">{{ rec.reasonData.csatEffect }}</span>
                </div>
                <div class="flex items-start space-x-1">
                  <span class="text-slate-700 font-bold shrink-0">③</span>
                  <span class="text-slate-500">{{ rec.reasonData.schoolSeniorStat }}</span>
                </div>
              </div>
            </div>

            <div class="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-end">
              <button
                type="button"
                @click="$emit('swap-card', rec)"
                class="text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-700 hover:text-white px-2.5 py-1 rounded-lg border border-slate-300 transition-all cursor-pointer shadow-2xs"
              >
                + 내 6장 카드로 임시 스왑
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  student: { type: Object, required: true },
  recommendations: { type: Object, required: true }
})

defineEmits(['swap-card'])

const studentGpa = computed(() => {
  const g = props.student.allSubjectGrade || props.student.mainSubjectGrade
  return g ? Number(g).toFixed(2) : '3.00'
})
</script>

