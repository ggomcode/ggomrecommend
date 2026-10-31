<template>
  <div class="space-y-6">
    <!-- Top Banner -->
    <div class="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 mb-2">
          <span>👥</span>
          <span>본교 5개년 수시 합불 빅데이터 복기</span>
        </div>
        <h4 class="text-base sm:text-lg font-black text-white m-0">
          내신 ±0.15 '도플갱어 선배'들의 실제 수시 6장 지원 & 합불 결과
        </h4>
        <p class="text-xs text-slate-300 mt-1 m-0">
          현재 학생(내신 {{ studentGpa }}등급)과 가장 유사한 성적을 가졌던 본교 졸업생 선배들이 실제로 어디를 지원하고 합격했는지 복기합니다.
        </p>
      </div>

      <div class="text-xs bg-white/10 px-3 py-2 rounded-xl border border-white/20 text-slate-200 shrink-0">
        유사 선배 매칭: <strong class="text-amber-400 font-bold">{{ seniors.length }}명</strong> 발견
      </div>
    </div>

    <!-- Seniors List Cards -->
    <div v-if="seniors.length > 0" class="space-y-4">
      <div 
        v-for="(senior, sIdx) in seniors" 
        :key="senior.seniorKey"
        class="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-indigo-200 transition-colors"
      >
        <!-- Senior Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100 gap-3">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-sm shrink-0">
              #{{ sIdx + 1 }}
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <span class="text-sm font-bold text-slate-900">{{ senior.maskedName }} 선배</span>
                <span class="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                  내신 {{ senior.gpa }}등급
                  <span class="text-indigo-600 font-bold">({{ senior.diffStr }})</span>
                </span>
                <span v-if="senior.isGraduate" class="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                  졸업생
                </span>
              </div>
              <div class="text-[11px] text-slate-400 mt-0.5">
                수시 6장 지원 결과: 
                최초합 <strong class="text-emerald-700">{{ senior.passCount }}건</strong> / 
                추합 <strong class="text-indigo-700">{{ senior.reserveCount }}건</strong> / 
                불합격 <span class="text-slate-500">{{ senior.failCount }}건</span>
              </div>
            </div>
          </div>

          <div class="flex items-center space-x-2">
            <span class="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              최종 합격률: {{ Math.round(((senior.passCount + senior.reserveCount) / senior.apps.length) * 100) }}%
            </span>
          </div>
        </div>

        <!-- 6 Application Cards Grid of This Senior -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          <div 
            v-for="(app, aIdx) in senior.apps" 
            :key="app.id"
            class="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between"
          >
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] text-slate-500">카드 #{{ aIdx + 1 }}</span>
                <span :class="['px-2 py-0.5 rounded text-[10px] font-bold', app.badgeClass]">
                  {{ app.resultBadge }}
                </span>
              </div>
              <div class="text-xs font-bold text-slate-900 leading-snug">{{ app.univName }}</div>
              <div class="text-[11px] text-indigo-600 font-medium mt-0.5">{{ app.dept }}</div>
              <div class="text-[10px] text-slate-500 mt-1 truncate">{{ app.admissionType }}</div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- No Match Fallback -->
    <div v-else class="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
      해당 학생의 내신 등급대(±0.15)와 일치하는 선배 데이터가 충분하지 않습니다.
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  student: { type: Object, required: true },
  seniors: { type: Array, default: () => [] }
})

const studentGpa = computed(() => {
  const g = props.student.allSubjectGrade || props.student.mainSubjectGrade
  return g ? Number(g).toFixed(2) : '3.00'
})
</script>

