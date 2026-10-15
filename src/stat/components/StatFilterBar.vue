<template>
  <div class="bg-white border-b border-slate-200/80 py-3.5 no-print shadow-2xs">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <!-- Filter Selectors -->
      <div class="flex flex-wrap items-center gap-2 sm:gap-2.5">
        <!-- Class Selector -->
        <div class="relative">
          <select 
            v-model="selectedClass" 
            class="appearance-none bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 pl-3 pr-8 py-1.5 hover:bg-slate-100 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors cursor-pointer"
          >
            <option value="ALL">전체 학급 (재학생 + 졸업생)</option>
            <option value="ENROLLED">재학생 전체 (1~11반)</option>
            <option v-for="c in 11" :key="c" :value="c">{{ c }}반</option>
            <option value="졸업생">🎓 졸업생</option>
          </select>
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>

        <!-- Field Selector -->
        <div class="relative">
          <select 
            v-model="selectedField" 
            class="appearance-none bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 pl-3 pr-8 py-1.5 hover:bg-slate-100 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors cursor-pointer"
          >
            <option value="ALL">전체 계열</option>
            <option value="인문">인문계열</option>
            <option value="자연">자연계열</option>
            <option value="예체능">예체능계열</option>
          </select>
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>

        <!-- Admission Type Selector -->
        <div class="relative">
          <select 
            v-model="selectedType" 
            class="appearance-none bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 pl-3 pr-8 py-1.5 hover:bg-slate-100 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors cursor-pointer"
          >
            <option value="ALL">전체 전형유형</option>
            <option value="교과">학생부교과</option>
            <option value="종합">학생부종합</option>
            <option value="실기">실기/실적</option>
            <option value="논술">논술위주</option>
          </select>
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>

        <!-- Region Selector -->
        <div class="relative">
          <select 
            v-model="selectedRegion" 
            class="appearance-none bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 pl-3 pr-8 py-1.5 hover:bg-slate-100 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors cursor-pointer"
          >
            <option value="ALL">전국 (전체 지역)</option>
            <option value="METRO">수도권 (서울/경기/인천)</option>
            <option value="NON_METRO">비수도권 지역</option>
            <option value="경기">경기</option>
            <option value="서울">서울</option>
            <option value="충남">충남</option>
            <option value="강원">강원</option>
            <option value="충북">충북</option>
            <option value="대전">대전</option>
            <option value="인천">인천</option>
            <option value="전북">전북</option>
          </select>
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>

        <!-- Reset Button -->
        <button 
          v-if="hasActiveFilter" 
          @click="resetFilters" 
          class="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
        >
          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          초기화
        </button>
      </div>

      <!-- Search & Status Summary -->
      <div class="flex items-center justify-between sm:justify-end gap-3">
        <!-- Live Count Badge -->
        <div class="text-xs font-medium text-slate-500 whitespace-nowrap">
          선택된 지원: <span class="font-bold text-indigo-600">{{ filteredApplications.length }}</span> / 1,376건
          <span class="text-slate-400 text-[11px] ml-1">({{ currentStats.totalStudents }}명)</span>
        </div>

        <!-- Search Input -->
        <div class="relative w-full sm:w-56">
          <input 
            v-model="searchKeyword" 
            type="text" 
            placeholder="학생명, 대학명, 학과..." 
            class="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs pl-8 pr-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
          <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <button 
            v-if="searchKeyword" 
            @click="searchKeyword = ''" 
            class="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useData } from '../composables/useStatData'

const { 
  selectedClass, 
  selectedField, 
  selectedType, 
  selectedRegion, 
  searchKeyword, 
  filteredApplications, 
  currentStats, 
  resetFilters 
} = useData()

const hasActiveFilter = computed(() => {
  return selectedClass.value !== 'ALL' ||
    selectedField.value !== 'ALL' ||
    selectedType.value !== 'ALL' ||
    selectedRegion.value !== 'ALL' ||
    searchKeyword.value.trim().length > 0
})
</script>
