<template>
  <!-- Top 7 KPI Cards Grid -->
  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
    <!-- 1. Enrolled Students -->
    <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
      <div class="flex items-center justify-between text-slate-400 mb-2">
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ enrolledLabel }}</span>
        <span class="p-1.5 rounded-lg bg-slate-50 text-slate-500">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        </span>
      </div>
      <div class="text-2xl font-bold text-slate-800 font-mono">
        {{ currentTargetTotalStudents }}<span class="text-xs font-normal text-slate-500 ml-1">명</span>
      </div>
      <div class="mt-1 text-[11px] text-slate-500 flex items-center">
        <span class="inline-block w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span>
        {{ enrolledSubText }}
      </div>
    </div>

    <!-- 2. Applicants -->
    <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
      <div class="flex items-center justify-between text-slate-400 mb-2">
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ applicantLabel }}</span>
        <span class="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        </span>
      </div>
      <div class="text-2xl font-bold text-indigo-600 font-mono">
        {{ currentStats.totalStudents }}<span class="text-xs font-normal text-slate-500 ml-1">명</span>
      </div>
      <div class="mt-1 text-[11px] text-indigo-700 font-medium flex items-center">
        <span class="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5"></span>
        지원율 {{ currentApplicantRate }}%
      </div>
    </div>

    <!-- 3. Total Applications -->
    <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
      <div class="flex items-center justify-between text-slate-400 mb-2">
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">총 접수 건수</span>
        <span class="p-1.5 rounded-lg bg-sky-50 text-sky-600">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        </span>
      </div>
      <div class="text-2xl font-bold text-sky-600 font-mono">
        {{ currentStats.totalApps }}<span class="text-xs font-normal text-slate-500 ml-1">건</span>
      </div>
      <div class="mt-1 text-[11px] text-slate-500 flex items-center">
        <span class="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 mr-1.5"></span>
        1인 평균 {{ currentStats.avgApps }}건
      </div>
    </div>

    <!-- 4. Metropolitan Rate -->
    <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
      <div class="flex items-center justify-between text-slate-400 mb-2">
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">수도권 지원</span>
        <span class="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
        </span>
      </div>
      <div class="text-2xl font-bold text-emerald-600 font-mono">
        {{ currentStats.metroRate }}<span class="text-xs font-normal text-slate-500 ml-1">%</span>
      </div>
      <div class="mt-1 text-[11px] text-slate-500 flex items-center">
        <span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>
        {{ currentStats.metroApps }}건 (서울/경기/인천)
      </div>
    </div>

    <!-- 5. School Recommendation -->
    <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
      <div class="flex items-center justify-between text-slate-400 mb-2">
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">학교장 추천</span>
        <span class="p-1.5 rounded-lg bg-purple-50 text-purple-600">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z" /></svg>
        </span>
      </div>
      <div class="text-2xl font-bold text-purple-600 font-mono">
        {{ currentStats.recApps }}<span class="text-xs font-normal text-slate-500 ml-1">건</span>
      </div>
      <div class="mt-1 text-[11px] text-slate-500 flex items-center">
        <span class="inline-block w-1.5 h-1.5 rounded-full bg-purple-400 mr-1.5"></span>
        {{ currentStats.recStudents }}명 지원 ({{ currentStats.recStudentRate }}%)
      </div>
    </div>

    <!-- 6. Rural (농어촌) -->
    <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
      <div class="flex items-center justify-between text-slate-400 mb-2">
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">농어촌 전형</span>
        <span class="p-1.5 rounded-lg bg-amber-50 text-amber-600">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /></svg>
        </span>
      </div>
      <div class="text-2xl font-bold text-amber-600 font-mono">
        {{ currentStats.ruralApps }}<span class="text-xs font-normal text-slate-500 ml-1">건</span>
      </div>
      <div class="mt-1 text-[11px] text-slate-500 flex items-center">
        <span class="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5"></span>
        {{ currentStats.ruralStudents }}명 접수 ({{ currentStats.ruralStudentRate }}%)
      </div>
    </div>

    <!-- 7. Top Tier SKY & Tech -->
    <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
      <div class="flex items-center justify-between text-slate-400 mb-2">
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">주요대 / 과기원</span>
        <span class="p-1.5 rounded-lg bg-rose-50 text-rose-600">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
        </span>
      </div>
      <div class="text-2xl font-bold text-rose-600 font-mono">
        {{ currentStats.topTierApps }}<span class="text-xs font-normal text-slate-500 ml-1">건</span>
      </div>
      <div class="mt-1 text-[11px] text-slate-500 flex items-center">
        <span class="inline-block w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5"></span>
        <span v-if="currentStats.topTierStudents > 0">{{ currentStats.topTierStudents }}명 (설카포연고/과기원)</span>
        <span v-else>설카포연고서성한이/과기원</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useData } from '../composables/useStatData'

const { 
  currentStats, 
  currentTargetTotalStudents,
  enrolledLabel,
  enrolledSubText,
  applicantLabel,
  currentApplicantRate
} = useData()
</script>
