<template>
  <div v-if="univ" class="fixed inset-0 z-50 overflow-y-auto no-print" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" @click="$emit('close')"></div>

    <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
      <div class="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-4xl border border-slate-200">
        <!-- Modal Header -->
        <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center text-white font-bold text-base">
              {{ univ.name.slice(0, 2) }}
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <h3 class="text-lg font-bold">{{ univ.name }}</h3>
                <span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/10 text-white/90 border border-white/20">
                  {{ univ.region }}
                </span>
                <span v-if="univ.isTopTier" class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  주요대/과기원
                </span>
                <span v-if="univ.isMedical" class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-400/20 text-rose-300 border border-rose-400/30" title="의·치·한·약·수 지원 건 포함">
                  의·약학 지원
                </span>
              </div>
              <p class="text-xs text-slate-300 mt-0.5">
                총 <span class="font-bold text-white">{{ univ.apps.length }}건</span> 지원 ({{ univ.uniqueStudents }}명) | 
                평균 내신 등급: <span class="font-bold text-amber-300">{{ univ.avgGrade }}</span>
              </p>
            </div>
          </div>
          <button 
            @click="$emit('close')" 
            class="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <!-- Applications Table -->
        <div class="p-6 max-h-[70vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-3 text-xs text-slate-500">
            <span>지원 상세 내역 (전형 및 학과별)</span>
            <span>최고 내신: <strong class="text-indigo-600">{{ univ.bestGrade }}</strong> / 최저: <strong class="text-slate-700">{{ univ.worstGrade }}</strong></span>
          </div>

          <div class="overflow-x-auto rounded-xl border border-slate-200">
            <table class="min-w-full divide-y divide-slate-200 text-xs">
              <thead class="bg-slate-50 font-semibold text-slate-600">
                <tr>
                  <th class="px-3 py-2.5 text-left">학생</th>
                  <th class="px-3 py-2.5 text-left">모집단위 (학과)</th>
                  <th class="px-3 py-2.5 text-left">전형명</th>
                  <th class="px-3 py-2.5 text-center">계열</th>
                  <th class="px-3 py-2.5 text-center">전교과(100)</th>
                  <th class="px-3 py-2.5 text-center">국영수사/과</th>
                  <th class="px-3 py-2.5 text-center">환산점수</th>
                  <th class="px-3 py-2.5 text-left">최저학력기준</th>
                  <th class="px-3 py-2.5 text-center">면접/발표일</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                <tr v-for="app in univ.apps" :key="app.id" class="hover:bg-slate-50 transition-colors">
                  <td class="px-3 py-2.5 whitespace-nowrap font-medium text-slate-800">
                    <span v-if="app.isGraduate || app.classNum === '졸업생'" class="inline-block px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] mr-1.5 font-bold">졸업 {{ app.studentNum }}</span>
                    <span v-else class="inline-block w-8 text-slate-400 text-[11px]">{{ app.classNum }}-{{ app.studentNum }}</span>
                    <span>{{ maskName(app.name) }}</span>
                  </td>
                  <td class="px-3 py-2.5 font-medium text-slate-900">
                    {{ app.dept }}
                    <span v-if="app.quota" class="text-[10px] text-slate-400 ml-1">({{ app.quota }}명)</span>
                  </td>
                  <td class="px-3 py-2.5">
                    <div class="text-indigo-700 font-medium">{{ app.admissionDetailType || app.admissionMajorType }}</div>
                    <div class="text-[10px] text-slate-400">{{ app.admissionType }}</div>
                  </td>
                  <td class="px-3 py-2.5 text-center whitespace-nowrap">
                    <span :class="[
                      'px-1.5 py-0.5 rounded text-[10px] font-medium',
                      app.field === '자연' ? 'bg-indigo-50 text-indigo-700' :
                      app.field === '인문' ? 'bg-sky-50 text-sky-700' : 'bg-amber-50 text-amber-700'
                    ]">
                      {{ app.field }}
                    </span>
                  </td>
                  <td class="px-3 py-2.5 text-center font-bold text-slate-700">
                    {{ formatGrade(app.allSubjectGrade) }}
                  </td>
                  <td class="px-3 py-2.5 text-center text-slate-600">
                    {{ formatGrade(app.mainSubjectGrade) }}
                  </td>
                  <td class="px-3 py-2.5 text-center text-slate-500 font-mono text-[11px]">
                    {{ app.univConvertedScore ? Number(app.univConvertedScore).toFixed(1) : '-' }}
                  </td>
                  <td class="px-3 py-2.5 text-[11px] text-slate-600 max-w-[200px] truncate" :title="app.minScoreReq">
                    <span v-if="app.hasMinScore" class="inline-block px-1 py-0.2 rounded bg-rose-50 text-rose-600 text-[10px] font-medium mr-1">최저</span>
                    {{ app.minScoreReq || '없음' }}
                  </td>
                  <td class="px-3 py-2.5 text-center whitespace-nowrap text-[10px] text-slate-500">
                    <div v-if="app.interviewDate" class="text-purple-600 font-medium">면접: {{ app.interviewDate.slice(5) }}</div>
                    <div v-if="app.finalAnnounceDate">발표: {{ app.finalAnnounceDate.slice(5, 10) }}</div>
                    <div v-if="!app.interviewDate && !app.finalAnnounceDate">-</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="bg-slate-50 px-6 py-3 flex items-center justify-between border-t border-slate-200">
          <span class="text-xs text-slate-500">
            총 {{ univ.apps.length }}건의 지원 정보가 포함되어 있습니다.
          </span>
          <button 
            @click="$emit('close')" 
            class="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useData, maskName, formatGrade } from '../composables/useStatData'

defineProps({
  univ: {
    type: Object,
    default: null
  }
})

defineEmits(['close'])
</script>
