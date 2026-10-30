<template>
  <div class="space-y-6 pb-12 animate-in fade-in duration-200">
    <!-- 1. Top Presentation Banner & Quick Actions -->
    <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
      <!-- Decorative background glow -->
      <div class="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-24 -left-24 w-72 h-72 bg-sky-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-slate-950 shadow-xs">
              📊 5개년 시계열 비교
            </span>
            <span class="text-xs font-semibold text-indigo-200 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
              2023 ~ 2027학년도 대입
            </span>
          </div>
          <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white m-0">
            최근 5개년 수시 지원 및 입결 종합 비교 분석
          </h2>
          <p class="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed m-0">
            대교협 수시 원서접수 자료를 바탕으로 학년도별 지원자 규모, 전과목 평균 내신 추이, 주요 대학 및 의·치·한·약·수 지원 경향, 합불 성과를 프레젠테이션용으로 시각화하여 비교합니다. (데이터 미등록 연도는 '-' 표시)
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5 shrink-0 no-print">
          <button
            type="button"
            @click="exportMultiYearExcel"
            class="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-white/15 hover:bg-white/25 border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>📥</span>
            <span>5개년 통계 엑셀</span>
          </button>
          <button
            type="button"
            @click="window.print()"
            class="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all flex items-center gap-1.5 cursor-pointer border-none shadow-sm font-black"
          >
            <span>🖨️</span>
            <span>비교 보고서 인쇄</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 2. 4 Key Metric Summary Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- KPI 1: 5개년 총 누적 지원 -->
      <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div class="flex items-center justify-between text-slate-500 mb-2">
          <span class="text-xs font-bold">5개년 누적 지원 건수</span>
          <span class="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-sm">📋</span>
        </div>
        <div>
          <div class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {{ total5YearApps > 0 ? total5YearApps.toLocaleString() : '-' }}<span v-if="total5YearApps > 0" class="text-xs font-semibold text-slate-400 ml-1">건</span>
          </div>
          <div class="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <template v-if="hasMultiYearComparison && previousYearData?.totalApplications != null">
              <span :class="volumeGrowth >= 0 ? 'text-emerald-600 font-bold flex items-center' : 'text-slate-600 font-bold flex items-center'">
                <span>{{ volumeGrowth >= 0 ? '▲ +' : '▼ ' }}</span> {{ volumeGrowth }}%
              </span>
              <span>전년({{ previousYearData.year }}년 {{ previousYearData.totalApplications.toLocaleString() }}건) 대비</span>
            </template>
            <template v-else>
              <span class="text-slate-400 text-[11px]">과거 비교 데이터 미등록 (-)</span>
            </template>
          </div>
        </div>
      </div>

      <!-- KPI 2: 수시 지원율 추이 -->
      <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div class="flex items-center justify-between text-slate-500 mb-2">
          <span class="text-xs font-bold">재학생 수시 지원율</span>
          <span class="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-sm">🎯</span>
        </div>
        <div>
          <div class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {{ latestYearData?.applicantRate != null ? latestYearData.applicantRate : '-' }}<span v-if="latestYearData?.applicantRate != null" class="text-xs font-semibold text-slate-400 ml-1">%</span>
          </div>
          <div class="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <template v-if="hasMultiYearComparison && previousYearData?.applicantRate != null">
              <span :class="rateGrowth >= 0 ? 'text-emerald-600 font-bold flex items-center' : 'text-rose-600 font-bold flex items-center'">
                <span>{{ rateGrowth >= 0 ? '▲ +' : '▼ ' }}</span>{{ rateGrowth }}%p
              </span>
              <span>({{ previousYearData.year }}년 {{ previousYearData.applicantRate }}% → {{ latestYearData.year }}년 {{ latestYearData.applicantRate }}%)</span>
            </template>
            <template v-else>
              <span class="text-slate-400 text-[11px]">과거 비교 데이터 미등록 (-)</span>
            </template>
          </div>
        </div>
      </div>

      <!-- KPI 3: 평균 내신 성적 변화 -->
      <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div class="flex items-center justify-between text-slate-500 mb-2">
          <span class="text-xs font-bold">지원자 평균 내신 추이</span>
          <span class="p-1.5 rounded-lg bg-sky-50 text-sky-600 text-sm">📈</span>
        </div>
        <div>
          <div class="text-2xl sm:text-3xl font-black text-indigo-600 tracking-tight">
            {{ latestYearData?.avgGrade != null ? latestYearData.avgGrade.toFixed(2) : '-' }}<span v-if="latestYearData?.avgGrade != null" class="text-xs font-semibold text-slate-400 ml-1">등급</span>
          </div>
          <div class="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <template v-if="hasMultiYearComparison && previousYearData?.avgGrade != null">
              <span :class="gradeDiff <= 0 ? 'text-indigo-600 font-bold flex items-center' : 'text-slate-600 font-bold flex items-center'">
                <span>{{ gradeDiff <= 0 ? '▲ +' : '▼ -' }}</span>{{ Math.abs(gradeDiff).toFixed(2) }}등급
              </span>
              <span>전년({{ previousYearData.year }}년 {{ previousYearData.avgGrade }}) 대비 {{ gradeDiff <= 0 ? '상승' : '하락' }}</span>
            </template>
            <template v-else>
              <span class="text-slate-400 text-[11px]">과거 비교 데이터 미등록 (-)</span>
            </template>
          </div>
        </div>
      </div>

      <!-- KPI 4: 주요대 및 과기원 지원 -->
      <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div class="flex items-center justify-between text-slate-500 mb-2">
          <span class="text-xs font-bold">주요대·과기원 지원 건수</span>
          <span class="p-1.5 rounded-lg bg-amber-50 text-amber-600 text-sm">🌟</span>
        </div>
        <div>
          <div class="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">
            {{ latestYearData?.topTierApps != null ? latestYearData.topTierApps : '-' }}<span v-if="latestYearData?.topTierApps != null" class="text-xs font-semibold text-slate-400 ml-1">건</span>
          </div>
          <div class="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <template v-if="hasMultiYearComparison && previousYearData?.topTierApps != null">
              <span :class="topTierGrowth >= 0 ? 'text-amber-600 font-bold flex items-center' : 'text-slate-600 font-bold flex items-center'">
                <span>{{ topTierGrowth >= 0 ? '▲ +' : '▼ ' }}</span>{{ topTierGrowth }}%
              </span>
              <span>({{ previousYearData.year }}년 {{ previousYearData.topTierApps }}건 → {{ latestYearData.year }}년 {{ latestYearData.topTierApps }}건)</span>
            </template>
            <template v-else>
              <span class="text-slate-400 text-[11px]">과거 비교 데이터 미등록 (-)</span>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- 2-1. 특화 전형(학교장추천 & 농어촌 & 수능최저) 3대 핵심 지표 카드 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Special KPI 1: 학교장추천 전형 지원 -->
      <div class="bg-gradient-to-br from-violet-50/70 via-white to-purple-50/30 rounded-2xl p-5 border border-violet-100 shadow-xs flex flex-col justify-between">
        <div class="flex items-center justify-between text-violet-800 mb-2">
          <div class="flex items-center gap-2">
            <span class="p-1.5 rounded-lg bg-violet-100 text-violet-700 text-sm">🤝</span>
            <span class="text-xs font-black">학교장추천 전형(학추) 지원 현황</span>
          </div>
          <span class="text-[11px] font-bold text-violet-700 bg-violet-100/70 px-2.5 py-0.5 rounded-full border border-violet-200/50">
            수시 지원 중 {{ (latestYearData?.totalApplications && latestYearData?.recommendationApps) ? ((latestYearData.recommendationApps / latestYearData.totalApplications) * 100).toFixed(1) : '-' }}%
          </span>
        </div>
        <div>
          <div class="text-2xl sm:text-3xl font-black text-violet-900 tracking-tight">
            {{ latestYearData?.recommendationApps != null ? latestYearData.recommendationApps.toLocaleString() : '-' }}<span v-if="latestYearData?.recommendationApps != null" class="text-xs font-semibold text-violet-400 ml-1">건</span>
          </div>
          <div class="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <template v-if="hasMultiYearComparison && previousYearData?.recommendationApps != null">
              <span :class="recGrowth >= 0 ? 'text-violet-700 font-bold flex items-center' : 'text-slate-600 font-bold flex items-center'">
                <span>{{ recGrowth >= 0 ? '▲ +' : '▼ ' }}</span>{{ recGrowth }}% ({{ recDiff >= 0 ? '+' : '' }}{{ recDiff }}건)
              </span>
              <span>전년({{ previousYearData.year }}년 {{ previousYearData.recommendationApps }}건) 대비</span>
            </template>
            <template v-else>
              <span class="text-slate-400 text-[11px]">과거 비교 데이터 미등록 (-)</span>
            </template>
          </div>
        </div>
      </div>

      <!-- Special KPI 2: 농어촌 학생 특별전형 지원 -->
      <div class="bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/30 rounded-2xl p-5 border border-emerald-100 shadow-xs flex flex-col justify-between">
        <div class="flex items-center justify-between text-emerald-800 mb-2">
          <div class="flex items-center gap-2">
            <span class="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-sm">🌾</span>
            <span class="text-xs font-black">농어촌 학생 특별전형 지원 현황</span>
          </div>
          <span class="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-200/50">
            수시 지원 중 {{ (latestYearData?.totalApplications && latestYearData?.ruralApps) ? ((latestYearData.ruralApps / latestYearData.totalApplications) * 100).toFixed(1) : '-' }}%
          </span>
        </div>
        <div>
          <div class="text-2xl sm:text-3xl font-black text-emerald-900 tracking-tight">
            {{ latestYearData?.ruralApps != null ? latestYearData.ruralApps.toLocaleString() : '-' }}<span v-if="latestYearData?.ruralApps != null" class="text-xs font-semibold text-emerald-400 ml-1">건</span>
          </div>
          <div class="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <template v-if="hasMultiYearComparison && previousYearData?.ruralApps != null">
              <span :class="ruralGrowth >= 0 ? 'text-emerald-700 font-bold flex items-center' : 'text-slate-600 font-bold flex items-center'">
                <span>{{ ruralGrowth >= 0 ? '▲ +' : '▼ ' }}</span>{{ ruralGrowth }}% ({{ ruralDiff >= 0 ? '+' : '' }}{{ ruralDiff }}건)
              </span>
              <span>전년({{ previousYearData.year }}년 {{ previousYearData.ruralApps }}건) 대비</span>
            </template>
            <template v-else>
              <span class="text-slate-400 text-[11px]">과거 비교 데이터 미등록 (-)</span>
            </template>
          </div>
        </div>
      </div>

      <!-- Special KPI 3: 수능 최저학력기준 충족 현황 -->
      <div class="bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/30 rounded-2xl p-5 border border-blue-100 shadow-xs flex flex-col justify-between">
        <div class="flex items-center justify-between text-blue-800 mb-2">
          <div class="flex items-center gap-2">
            <span class="p-1.5 rounded-lg bg-blue-100 text-blue-700 text-sm">🎯</span>
            <span class="text-xs font-black">수능 최저학력기준 충족 현황</span>
          </div>
          <span class="text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full border border-blue-200/50">
            최저 반영 {{ latestYearData?.csatMinApps ? `${latestYearData.csatMinApps}건 중` : '-' }}
          </span>
        </div>
        <div>
          <div class="text-2xl sm:text-3xl font-black text-blue-900 tracking-tight">
            {{ latestYearData?.csatMinPassRate != null ? `${latestYearData.csatMinPassRate}%` : '-' }}<span v-if="latestYearData?.csatMinPassApps != null" class="text-xs font-semibold text-blue-500 ml-1.5">({{ latestYearData.csatMinPassApps }}건 충족)</span>
          </div>
          <div class="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <template v-if="hasMultiYearComparison && previousYearData?.csatMinPassRate != null">
              <span :class="csatMinGrowth >= 0 ? 'text-blue-700 font-bold flex items-center' : 'text-slate-600 font-bold flex items-center'">
                <span>{{ csatMinGrowth >= 0 ? '▲ +' : '▼ ' }}</span>{{ csatMinGrowth }}%p ({{ csatMinDiff >= 0 ? '+' : '' }}{{ csatMinDiff }}건)
              </span>
              <span>전년({{ previousYearData.year }}년 {{ previousYearData.csatMinPassRate }}%) 대비</span>
            </template>
            <template v-else>
              <span class="text-slate-400 text-[11px]">과거 비교 데이터 미등록 (-)</span>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. Charts Row 1: 지원 규모 & 1인당 지원 카드 수 추이 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Chart 1: 연도별 총 지원 건수 및 지원 학생 수 (Bar & Line) -->
      <div class="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm sm:text-base font-bold text-slate-900 m-0">
              연도별 총 지원 건수 & 수시 지원 인원 추이
            </h3>
            <p class="text-xs text-slate-400 mt-0.5 m-0">
              수시 원서접수 총 건수(막대)와 수시 지원 학생 수(선)
            </p>
          </div>
          <span class="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
            단위: 건, 명
          </span>
        </div>
        <div class="h-64 sm:h-72">
          <Bar :data="volumeChartData" :options="volumeChartOptions" />
        </div>
      </div>

      <!-- Chart 2: 연도별 지원자 평균 내신 & 1인당 지원 카드 수 -->
      <div class="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm sm:text-base font-bold text-slate-900 m-0">
              연도별 지원자 평균 내신 & 1인당 지원 카드 수
            </h3>
            <p class="text-xs text-slate-400 mt-0.5 m-0">
              전체 수시 지원자의 전과목 평균 내신(등급) 및 1인당 원서접수 건수
            </p>
          </div>
          <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
            단위: 등급, 장
          </span>
        </div>
        <div class="h-64 sm:h-72">
          <Line :data="gradeTrendChartData" :options="gradeTrendChartOptions" />
        </div>
      </div>
    </div>

    <!-- 4. Charts Row 2: 성적대별 분포 & 전형 유형별 비중 5개년 변화 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Chart 3: 성적대별 지원 분포 5개년 누적 막대 (Stacked Bar) -->
      <div class="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm sm:text-base font-bold text-slate-900 m-0">
              성적대별 지원 분포 5개년 변화 (1~6등급대)
            </h3>
            <p class="text-xs text-slate-400 mt-0.5 m-0">
              연도별 성적대 구간별 지원 건수 누적 분포
            </p>
          </div>
          <span class="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
            누적 건수
          </span>
        </div>
        <div class="h-64 sm:h-72">
          <Bar :data="gradeDistributionChartData" :options="stackedChartOptions" />
        </div>
      </div>

      <!-- Chart 4: 전형 유형별 비중 추이 (학생부교과 / 학생부종합 / 논술 / 실기) -->
      <div class="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm sm:text-base font-bold text-slate-900 m-0">
              전형 유형별 5개년 지원 비중 추이
            </h3>
            <p class="text-xs text-slate-400 mt-0.5 m-0">
              학생부교과, 학생부종합, 논술, 실기/실적 비중 변화
            </p>
          </div>
          <span class="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
            전형 비중
          </span>
        </div>
        <div class="h-64 sm:h-72">
          <Bar :data="admissionTypeChartData" :options="stackedChartOptions" />
        </div>
      </div>
    </div>

    <!-- 4-1. Charts Row 3: 특화 전형(학교장추천 & 농어촌) 5개년 추이 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Chart 5: 연도별 학교장추천 & 농어촌 지원 건수 추이 (Grouped Bar) -->
      <div class="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm sm:text-base font-bold text-slate-900 m-0 flex items-center gap-2">
              <span>🤝🌾</span>
              <span>특화 전형(학교장추천 & 농어촌) 5개년 지원 건수</span>
            </h3>
            <p class="text-xs text-slate-400 mt-0.5 m-0">
              연도별 학교장추천 전형 및 농어촌 학생 특별전형 원서접수 건수 비교
            </p>
          </div>
          <span class="text-xs font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md">
            단위: 건
          </span>
        </div>
        <div class="h-64 sm:h-72">
          <Bar :data="specialTrackVolumeChartData" :options="specialTrackChartOptions" />
        </div>
      </div>

      <!-- Chart 6: 전체 수시 대비 특화 전형 비중 추이 (Line) -->
      <div class="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm sm:text-base font-bold text-slate-900 m-0 flex items-center gap-2">
              <span>📈</span>
              <span>수시 원서접수 중 특화 전형 비중(%) 추이</span>
            </h3>
            <p class="text-xs text-slate-400 mt-0.5 m-0">
              전체 수시 원서접수 건수 중 학교장추천 및 농어촌 특별전형의 점유율 변화
            </p>
          </div>
          <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
            단위: %
          </span>
        </div>
        <div class="h-64 sm:h-72">
          <Line :data="specialTrackRatioChartData" :options="specialTrackRatioChartOptions" />
        </div>
      </div>
    </div>

    <!-- 4-2. Charts Row 4: 수능 최저학력기준 5개년 지원 및 실질 충족 추이 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Chart 7: 수능 최저 반영 전형 지원 건수 vs 충족 건수 추이 (Grouped Bar) -->
      <div class="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm sm:text-base font-bold text-slate-900 m-0 flex items-center gap-2">
              <span>🎯📊</span>
              <span>수능 최저 반영 지원 건수 vs 실질 충족 건수</span>
            </h3>
            <p class="text-xs text-slate-400 mt-0.5 m-0">
              연도별 수능 최저학력기준 적용 전형 지원 건수 중 실제 기준을 충족한 건수 비교
            </p>
          </div>
          <span class="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
            단위: 건
          </span>
        </div>
        <div class="h-64 sm:h-72">
          <Bar :data="csatMinVolumeChartData" :options="csatMinVolumeChartOptions" />
        </div>
      </div>

      <!-- Chart 8: 수능 최저학력기준 연도별 충족률(%) 추이 (Line) -->
      <div class="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm sm:text-base font-bold text-slate-900 m-0 flex items-center gap-2">
              <span>🎯📈</span>
              <span>수능 최저학력기준 실질 충족률(%) 추이</span>
            </h3>
            <p class="text-xs text-slate-400 mt-0.5 m-0">
              최저 적용 전형 지원자 중 수능 최저 통과율 추이 (최저 통과 시 실질 경쟁률 급감 효과)
            </p>
          </div>
          <span class="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
            단위: %
          </span>
        </div>
        <div class="h-64 sm:h-72">
          <Line :data="csatMinRatioChartData" :options="csatMinRatioChartOptions" />
        </div>
      </div>
    </div>

    <!-- 5. Table 1: 주요 목표 대학군별 5개년 지원 현황 및 전년 대비 증감표 -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 class="text-base font-bold text-slate-900 m-0 flex items-center gap-2">
            <span>🏫</span>
            <span>주요 목표 대학군별 5개년 지원 현황 및 평균 성적</span>
          </h3>
          <p class="text-xs text-slate-400 mt-1 m-0">
            설·카·포·연·고, 서·성·한·이, 과기원, 의·치·한·약·수 및 수도권 주요 대학별 지원 건수와 지원자 평균 내신 (미등록 연도는 '-' 표시)
          </p>
        </div>
        <span class="text-xs text-slate-500 font-semibold">
          기준: 본교 수시 지원자 데이터
        </span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <th class="py-3 px-4">대학군 구분</th>
              <th class="py-3 px-3">대상 대학 예시</th>
              <th v-for="y in years" :key="y" class="py-3 px-3 text-center">
                {{ y }}학년도
              </th>
              <th class="py-3 px-4 text-center">{{ previousYearKey ? `${previousYearKey} 대비 증감` : '전년 대비 증감' }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr 
              v-for="target in targetUnivComparison" 
              :key="target.groupName"
              class="hover:bg-slate-50/70 transition-colors"
            >
              <td class="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                <span class="inline-flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
                  {{ target.groupName }}
                </span>
              </td>
              <td class="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                {{ target.note }}
              </td>
              <td v-for="y in years" :key="y" class="py-3.5 px-3 text-center whitespace-nowrap">
                <template v-if="target.data[y] != null">
                  <div class="font-bold text-slate-900">{{ target.data[y] }}건</div>
                  <div v-if="target.avgGrade[y] != null" class="text-[10px] text-slate-400 font-mono">
                    평균 {{ target.avgGrade[y].toFixed(2) }}
                  </div>
                </template>
                <template v-else>
                  <span class="text-slate-300 font-bold">-</span>
                </template>
              </td>
              <td class="py-3.5 px-4 text-center whitespace-nowrap">
                <template v-if="previousYearKey && target.data['2027'] != null && target.data[previousYearKey] != null">
                  <span 
                    :class="[
                      'inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-bold',
                      target.data['2027'] >= target.data[previousYearKey] 
                        ? 'bg-rose-50 text-rose-700' 
                        : 'bg-blue-50 text-blue-700'
                    ]"
                  >
                    {{ target.data['2027'] >= target.data[previousYearKey] ? '▲ +' : '▼ ' }}
                    {{ target.data['2027'] - target.data[previousYearKey] }}건
                  </span>
                </template>
                <template v-else>
                  <span class="text-slate-300 font-bold">-</span>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 6. Table 2: 5개년 종합 입결 및 수시 핵심 지표 비교 요약 대장 -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 class="text-base font-bold text-slate-900 m-0 flex items-center gap-2">
            <span>📋</span>
            <span>최근 5개년 수시 핵심 지표 종합 비교표</span>
          </h3>
          <p class="text-xs text-slate-400 mt-1 m-0">
            학년도별 수시 지원 규모, 성적대, 권역 및 입결 합격률 변화 종합 (데이터가 없는 항목은 허수 없이 '-' 표시)
          </p>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <th class="py-3 px-4">학년도</th>
              <th class="py-3 px-3 text-center">전체 재학생</th>
              <th class="py-3 px-3 text-center">수시 지원자(비율)</th>
              <th class="py-3 px-3 text-center">총 지원 건수</th>
              <th class="py-3 px-3 text-center">1인당 지원 건</th>
              <th class="py-3 px-3 text-center">지원자 평균 내신</th>
              <th class="py-3 px-3 text-center">내신 범위(최고~최저)</th>
              <th class="py-3 px-3 text-center">수도권 비율</th>
              <th class="py-3 px-3 text-center">주요대 지원</th>
              <th class="py-3 px-3 text-center">의치한약수 지원</th>
              <th class="py-3 px-3 text-center text-violet-800 bg-violet-50/50">학교장추천(비율)</th>
              <th class="py-3 px-3 text-center text-emerald-800 bg-emerald-50/50">농어촌전형(비율)</th>
              <th class="py-3 px-3 text-center text-blue-800 bg-blue-50/50">수능최저 충족(비율)</th>
              <th class="py-3 px-4 text-center">최종 합격률</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr 
              v-for="y in [...years].reverse()" 
              :key="y"
              :class="[
                'transition-colors',
                y === '2027' ? 'bg-amber-50/40 font-bold text-slate-900' : 'hover:bg-slate-50/70 text-slate-700'
              ]"
            >
              <td class="py-3.5 px-4 font-extrabold text-slate-900 whitespace-nowrap flex items-center gap-1.5">
                <span>{{ y }}학년도</span>
                <span v-if="y === '2027'" class="px-1.5 py-0.2 rounded text-[10px] bg-amber-200 text-amber-900">기준</span>
                <span v-else-if="!byYear[y]?.hasData" class="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-400 font-normal">미등록</span>
              </td>
              <td class="py-3.5 px-3 text-center whitespace-nowrap">
                {{ byYear[y]?.totalStudents != null ? `${byYear[y].totalStudents}명` : '-' }}
              </td>
              <td class="py-3.5 px-3 text-center whitespace-nowrap font-bold text-indigo-600">
                <template v-if="byYear[y]?.applicantStudents != null">
                  {{ byYear[y].applicantStudents }}명 ({{ byYear[y].applicantRate }}%)
                </template>
                <template v-else>-</template>
              </td>
              <td class="py-3.5 px-3 text-center whitespace-nowrap font-bold">
                {{ byYear[y]?.totalApplications != null ? `${byYear[y].totalApplications.toLocaleString()}건` : '-' }}
              </td>
              <td class="py-3.5 px-3 text-center whitespace-nowrap">
                {{ byYear[y]?.avgAppsPerStudent != null ? `${byYear[y].avgAppsPerStudent.toFixed(2)}장` : '-' }}
              </td>
              <td class="py-3.5 px-3 text-center whitespace-nowrap">
                <span v-if="byYear[y]?.avgGrade != null" class="px-2 py-0.5 rounded font-bold bg-indigo-50 text-indigo-700">
                  {{ byYear[y].avgGrade.toFixed(2) }}
                </span>
                <span v-else class="text-slate-300 font-bold">-</span>
              </td>
              <td class="py-3.5 px-3 text-center whitespace-nowrap font-mono text-[11px] text-slate-500">
                <template v-if="byYear[y]?.bestGrade != null && byYear[y]?.worstGrade != null">
                  {{ byYear[y].bestGrade }} ~ {{ byYear[y].worstGrade }}
                </template>
                <template v-else>-</template>
              </td>
              <td class="py-3.5 px-3 text-center whitespace-nowrap font-bold text-sky-700">
                {{ byYear[y]?.metroRate != null ? `${byYear[y].metroRate}%` : '-' }}
              </td>
              <td class="py-3.5 px-3 text-center whitespace-nowrap font-bold text-amber-700">
                {{ byYear[y]?.topTierApps != null ? `${byYear[y].topTierApps}건` : '-' }}
              </td>
              <td class="py-3.5 px-3 text-center whitespace-nowrap font-bold text-rose-700">
                {{ byYear[y]?.medicalApps != null ? `${byYear[y].medicalApps}건` : '-' }}
              </td>
              <td class="py-3.5 px-3 text-center whitespace-nowrap font-bold text-violet-700">
                <template v-if="byYear[y]?.recommendationApps != null">
                  <span>{{ byYear[y].recommendationApps }}건</span>
                  <span v-if="byYear[y]?.totalApplications" class="text-[10px] text-violet-500 font-normal ml-0.5">
                    ({{ ((byYear[y].recommendationApps / byYear[y].totalApplications) * 100).toFixed(1) }}%)
                  </span>
                </template>
                <template v-else class="text-slate-300 font-bold">-</template>
              </td>
              <td class="py-3.5 px-3 text-center whitespace-nowrap font-bold text-emerald-700">
                <template v-if="byYear[y]?.ruralApps != null">
                  <span>{{ byYear[y].ruralApps }}건</span>
                  <span v-if="byYear[y]?.totalApplications" class="text-[10px] text-emerald-500 font-normal ml-0.5">
                    ({{ ((byYear[y].ruralApps / byYear[y].totalApplications) * 100).toFixed(1) }}%)
                  </span>
                </template>
                <template v-else class="text-slate-300 font-bold">-</template>
              </td>
              <td class="py-3.5 px-3 text-center whitespace-nowrap font-bold text-blue-700">
                <template v-if="byYear[y]?.csatMinPassRate != null">
                  <span>{{ byYear[y].csatMinPassRate }}%</span>
                  <span v-if="byYear[y]?.csatMinPassApps != null" class="text-[10px] text-blue-500 font-normal ml-0.5">
                    ({{ byYear[y].csatMinPassApps }}/{{ byYear[y].csatMinApps }}건)
                  </span>
                </template>
                <template v-else class="text-slate-300 font-bold">-</template>
              </td>
              <td class="py-3.5 px-4 text-center whitespace-nowrap font-bold text-emerald-700">
                {{ byYear[y]?.finalPassRate != null ? `${byYear[y].finalPassRate}%` : '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Bar, Line } from 'vue-chartjs'
import * as XLSX from 'xlsx'
import { useStatData } from '../../composables/useStatData'

const { 
  multiYearStats, 
  syncAllAvailableSheetYears 
} = useStatData()
const window = globalThis.window

const years = multiYearStats.years
const byYear = multiYearStats.byYear
const targetUnivComparison = multiYearStats.targetUnivComparison

// 탭 진입 시 구글 시트에 존재하는 모든 학년도(2027수시, 2026수시, 2025수시 등)를 실시간 자동 감지하여 5개년 통계 자동 갱신
onMounted(async () => {
  try {
    await syncAllAvailableSheetYears()
  } catch (err) {
    console.warn('[MultiYearTab] Real-time sheet sync on mount:', err.message)
  }
})

const availableYearsWithData = computed(() => years.filter(y => byYear[y]?.hasData))
const latestYearKey = computed(() => {
  const list = availableYearsWithData.value
  return list.length > 0 ? list[list.length - 1] : '2027'
})
const previousYearKey = computed(() => {
  const list = availableYearsWithData.value
  return list.length >= 2 ? list[list.length - 2] : null
})

const latestYearData = computed(() => byYear[latestYearKey.value] || byYear['2027'])
const previousYearData = computed(() => previousYearKey.value ? byYear[previousYearKey.value] : null)

// 실제 등록된 연도가 2개 이상일 때만 과거 대비 증감 비교를 표시 (허수 방지)
const hasMultiYearComparison = computed(() => {
  return availableYearsWithData.value.length >= 2
})

const volumeGrowth = computed(() => {
  if (!latestYearData.value?.totalApplications || !previousYearData.value?.totalApplications) return 0
  const cur = latestYearData.value.totalApplications
  const prev = previousYearData.value.totalApplications
  return Number((((cur - prev) / prev) * 100).toFixed(1))
})

const rateGrowth = computed(() => {
  if (!latestYearData.value || latestYearData.value.applicantRate == null || !previousYearData.value || previousYearData.value.applicantRate == null) return 0
  return Number((latestYearData.value.applicantRate - previousYearData.value.applicantRate).toFixed(1))
})

const gradeDiff = computed(() => {
  if (!latestYearData.value || latestYearData.value.avgGrade == null || !previousYearData.value || previousYearData.value.avgGrade == null) return 0
  return Number((latestYearData.value.avgGrade - previousYearData.value.avgGrade).toFixed(2))
})

const topTierGrowth = computed(() => {
  if (!latestYearData.value?.topTierApps || !previousYearData.value?.topTierApps) return 0
  const cur = latestYearData.value.topTierApps
  const prev = previousYearData.value.topTierApps
  return Number((((cur - prev) / prev) * 100).toFixed(1))
})

// 학교장추천 전형 지원 건수 증감률 및 편차
const recGrowth = computed(() => {
  if (!latestYearData.value?.recommendationApps || !previousYearData.value?.recommendationApps) return 0
  const cur = latestYearData.value.recommendationApps
  const prev = previousYearData.value.recommendationApps
  return Number((((cur - prev) / prev) * 100).toFixed(1))
})

const recDiff = computed(() => {
  if (latestYearData.value?.recommendationApps == null || previousYearData.value?.recommendationApps == null) return 0
  return latestYearData.value.recommendationApps - previousYearData.value.recommendationApps
})

// 농어촌 특별전형 지원 건수 증감률 및 편차
const ruralGrowth = computed(() => {
  if (!latestYearData.value?.ruralApps || !previousYearData.value?.ruralApps) return 0
  const cur = latestYearData.value.ruralApps
  const prev = previousYearData.value.ruralApps
  return Number((((cur - prev) / prev) * 100).toFixed(1))
})

const ruralDiff = computed(() => {
  if (latestYearData.value?.ruralApps == null || previousYearData.value?.ruralApps == null) return 0
  return latestYearData.value.ruralApps - previousYearData.value.ruralApps
})

// 수능 최저학력기준 충족률 증감(%p) 및 충족 건수 편차
const csatMinGrowth = computed(() => {
  if (latestYearData.value?.csatMinPassRate == null || previousYearData.value?.csatMinPassRate == null) return 0
  return Number((latestYearData.value.csatMinPassRate - previousYearData.value.csatMinPassRate).toFixed(1))
})

const csatMinDiff = computed(() => {
  if (latestYearData.value?.csatMinPassApps == null || previousYearData.value?.csatMinPassApps == null) return 0
  return latestYearData.value.csatMinPassApps - previousYearData.value.csatMinPassApps
})

const total5YearApps = computed(() => {
  return years.reduce((acc, y) => acc + (byYear[y]?.totalApplications || 0), 0)
})

// Chart 1: Volume Chart (Total Applications Bar + Applicants Line)
const volumeChartData = computed(() => ({
  labels: years.map(y => `${y}학년도`),
  datasets: [
    {
      type: 'bar',
      label: '총 지원 건수 (건)',
      data: years.map(y => byYear[y]?.totalApplications ?? null),
      backgroundColor: 'rgba(99, 102, 241, 0.85)', // indigo
      borderRadius: 8,
      yAxisID: 'y'
    },
    {
      type: 'line',
      label: '수시 지원 인원 (명)',
      data: years.map(y => byYear[y]?.applicantStudents ?? null),
      borderColor: '#f59e0b', // amber
      backgroundColor: '#f59e0b',
      borderWidth: 3,
      pointRadius: 5,
      pointHoverRadius: 7,
      spanGaps: false,
      yAxisID: 'y1'
    }
  ]
}))

const volumeChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11, weight: 'bold' } } }
  },
  scales: {
    y: {
      type: 'linear',
      position: 'left',
      beginAtZero: true,
      grid: { color: 'rgba(226, 232, 240, 0.6)' },
      ticks: { font: { size: 10 } }
    },
    y1: {
      type: 'linear',
      position: 'right',
      beginAtZero: true,
      grid: { drawOnChartArea: false },
      ticks: { font: { size: 10 } }
    },
    x: {
      grid: { display: false },
      ticks: { font: { size: 11, weight: 'bold' } }
    }
  }
}

// Chart 2: Grade Trend Chart (Average Grade Line)
const gradeTrendChartData = computed(() => ({
  labels: years.map(y => `${y}학년도`),
  datasets: [
    {
      label: '지원자 전과목 평균 내신 (등급, 역순)',
      data: years.map(y => byYear[y]?.avgGrade ?? null),
      borderColor: '#4f46e5',
      backgroundColor: 'rgba(79, 70, 229, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.3,
      pointRadius: 6,
      pointBackgroundColor: '#4f46e5',
      spanGaps: false,
      yAxisID: 'yGrade'
    },
    {
      type: 'bar',
      label: '1인당 평균 지원 카드 수 (장)',
      data: years.map(y => byYear[y]?.avgAppsPerStudent ?? null),
      backgroundColor: 'rgba(16, 185, 129, 0.6)',
      borderRadius: 6,
      yAxisID: 'yCard'
    }
  ]
}))

const gradeTrendChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11, weight: 'bold' } } }
  },
  scales: {
    yGrade: {
      type: 'linear',
      position: 'left',
      reverse: true, // 내신 등급은 1등급이 높으므로 역순 정렬
      min: 1.0,
      max: 9.0,
      grid: { color: 'rgba(226, 232, 240, 0.6)' },
      ticks: { font: { size: 10 } }
    },
    yCard: {
      type: 'linear',
      position: 'right',
      beginAtZero: true,
      max: 6.5,
      grid: { drawOnChartArea: false },
      ticks: { font: { size: 10 } }
    },
    x: {
      grid: { display: false },
      ticks: { font: { size: 11, weight: 'bold' } }
    }
  }
}

// Chart 3: Grade Distribution Stacked Bar
const gradeDistributionChartData = computed(() => {
  const bands = ['1~2등급', '2~3등급', '3~4등급', '4~5등급', '5~6등급', '6등급이하']
  const colors = [
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#10b981', // emerald
    '#f59e0b', // amber
    '#f97316', // orange
    '#94a3b8'  // slate
  ]

  return {
    labels: years.map(y => `${y}학년도`),
    datasets: bands.map((band, idx) => ({
      label: band,
      data: years.map(y => byYear[y]?.gradeDistribution ? byYear[y].gradeDistribution[band] : null),
      backgroundColor: colors[idx],
      stack: 'grades'
    }))
  }
})

// Chart 4: Admission Type Stacked Bar
const admissionTypeChartData = computed(() => {
  const types = ['학생부교과', '학생부종합', '논술위주', '실기/실적']
  const colors = ['#6366f1', '#3b82f6', '#ec4899', '#8b5cf6']

  return {
    labels: years.map(y => `${y}학년도`),
    datasets: types.map((type, idx) => ({
      label: type,
      data: years.map(y => byYear[y]?.admissionTypes ? byYear[y].admissionTypes[type] : null),
      backgroundColor: colors[idx],
      stack: 'types'
    }))
  }
})

const stackedChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top', labels: { boxWidth: 10, font: { size: 10 } } }
  },
  scales: {
    x: { stacked: true, grid: { display: false }, ticks: { font: { size: 11, weight: 'bold' } } },
    y: { stacked: true, grid: { color: 'rgba(226, 232, 240, 0.6)' }, ticks: { font: { size: 10 } } }
  }
}

// Chart 5: 특화 전형(학교장추천 & 농어촌) 지원 건수 5개년 Grouped Bar
const specialTrackVolumeChartData = computed(() => ({
  labels: years.map(y => `${y}학년도`),
  datasets: [
    {
      label: '학교장추천 전형 (건)',
      data: years.map(y => byYear[y]?.recommendationApps ?? null),
      backgroundColor: 'rgba(139, 92, 246, 0.85)', // violet
      borderRadius: 6
    },
    {
      label: '농어촌 학생 전형 (건)',
      data: years.map(y => byYear[y]?.ruralApps ?? null),
      backgroundColor: 'rgba(16, 185, 129, 0.85)', // emerald
      borderRadius: 6
    }
  ]
}))

const specialTrackChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11, weight: 'bold' } } }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(226, 232, 240, 0.6)' },
      ticks: { font: { size: 10 } }
    },
    x: {
      grid: { display: false },
      ticks: { font: { size: 11, weight: 'bold' } }
    }
  }
}

// Chart 6: 전체 수시 원서접수 중 특화 전형 비중(%) 추이 Line
const specialTrackRatioChartData = computed(() => ({
  labels: years.map(y => `${y}학년도`),
  datasets: [
    {
      label: '학교장추천 비중 (%)',
      data: years.map(y => {
        const rec = byYear[y]?.recommendationApps
        const tot = byYear[y]?.totalApplications
        return (rec != null && tot) ? Number(((rec / tot) * 100).toFixed(1)) : null
      }),
      borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      borderWidth: 3,
      pointRadius: 5,
      tension: 0.3,
      spanGaps: false
    },
    {
      label: '농어촌 전형 비중 (%)',
      data: years.map(y => {
        const rural = byYear[y]?.ruralApps
        const tot = byYear[y]?.totalApplications
        return (rural != null && tot) ? Number(((rural / tot) * 100).toFixed(1)) : null
      }),
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderWidth: 3,
      pointRadius: 5,
      tension: 0.3,
      spanGaps: false
    }
  ]
}))

const specialTrackRatioChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11, weight: 'bold' } } }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(226, 232, 240, 0.6)' },
      ticks: {
        callback: (val) => `${val}%`,
        font: { size: 10 }
      }
    },
    x: {
      grid: { display: false },
      ticks: { font: { size: 11, weight: 'bold' } }
    }
  }
}

// Chart 7: 수능 최저 반영 건수 vs 충족 건수 5개년 Grouped Bar
const csatMinVolumeChartData = computed(() => ({
  labels: years.map(y => `${y}학년도`),
  datasets: [
    {
      label: '최저 반영 지원 건수 (건)',
      data: years.map(y => byYear[y]?.csatMinApps ?? null),
      backgroundColor: 'rgba(59, 130, 246, 0.4)', // light blue
      borderColor: 'rgba(59, 130, 246, 0.9)',
      borderWidth: 1,
      borderRadius: 6
    },
    {
      label: '최저 충족 건수 (건)',
      data: years.map(y => byYear[y]?.csatMinPassApps ?? null),
      backgroundColor: 'rgba(37, 99, 235, 0.9)', // solid blue
      borderRadius: 6
    }
  ]
}))

const csatMinVolumeChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11, weight: 'bold' } } }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(226, 232, 240, 0.6)' },
      ticks: { font: { size: 10 } }
    },
    x: {
      grid: { display: false },
      ticks: { font: { size: 11, weight: 'bold' } }
    }
  }
}

// Chart 8: 수능 최저학력기준 연도별 충족률(%) 추이 Line
const csatMinRatioChartData = computed(() => ({
  labels: years.map(y => `${y}학년도`),
  datasets: [
    {
      label: '수능 최저 충족률 (%)',
      data: years.map(y => byYear[y]?.csatMinPassRate ?? null),
      borderColor: '#2563eb', // blue-600
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
      borderWidth: 3,
      pointRadius: 6,
      pointHoverRadius: 8,
      tension: 0.3,
      fill: true,
      spanGaps: false
    }
  ]
}))

const csatMinRatioChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11, weight: 'bold' } } }
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      grid: { color: 'rgba(226, 232, 240, 0.6)' },
      ticks: {
        callback: (val) => `${val}%`,
        font: { size: 10 }
      }
    },
    x: {
      grid: { display: false },
      ticks: { font: { size: 11, weight: 'bold' } }
    }
  }
}

// 엑셀 내보내기 (데이터 없는 항목은 '-' 처리)
function exportMultiYearExcel() {
  const summaryRows = years.map(y => {
    const rec = byYear[y]?.recommendationApps
    const rural = byYear[y]?.ruralApps
    const tot = byYear[y]?.totalApplications
    return {
      '학년도': `${y}학년도`,
      '전체 재학생(명)': byYear[y]?.totalStudents != null ? byYear[y].totalStudents : '-',
      '수시 지원자(명)': byYear[y]?.applicantStudents != null ? byYear[y].applicantStudents : '-',
      '수시 지원율(%)': byYear[y]?.applicantRate != null ? byYear[y].applicantRate : '-',
      '총 지원 건수(건)': byYear[y]?.totalApplications != null ? byYear[y].totalApplications : '-',
      '1인당 지원 건수(장)': byYear[y]?.avgAppsPerStudent != null ? byYear[y].avgAppsPerStudent : '-',
      '지원자 평균 내신(등급)': byYear[y]?.avgGrade != null ? byYear[y].avgGrade : '-',
      '최고 내신': byYear[y]?.bestGrade != null ? byYear[y].bestGrade : '-',
      '최저 내신': byYear[y]?.worstGrade != null ? byYear[y].worstGrade : '-',
      '수도권 대학 비율(%)': byYear[y]?.metroRate != null ? byYear[y].metroRate : '-',
      '주요대 지원 건수': byYear[y]?.topTierApps != null ? byYear[y].topTierApps : '-',
      '의치한약수 지원 건수': byYear[y]?.medicalApps != null ? byYear[y].medicalApps : '-',
      '학교장추천 지원 건수(건)': rec != null ? rec : '-',
      '학교장추천 비중(%)': (rec != null && tot) ? Number(((rec / tot) * 100).toFixed(1)) : '-',
      '농어촌전형 지원 건수(건)': rural != null ? rural : '-',
      '농어촌전형 비중(%)': (rural != null && tot) ? Number(((rural / tot) * 100).toFixed(1)) : '-',
      '수능최저 반영 건수(건)': byYear[y]?.csatMinApps != null ? byYear[y].csatMinApps : '-',
      '수능최저 충족 건수(건)': byYear[y]?.csatMinPassApps != null ? byYear[y].csatMinPassApps : '-',
      '수능최저 충족률(%)': byYear[y]?.csatMinPassRate != null ? byYear[y].csatMinPassRate : '-',
      '최종 합격률(%)': byYear[y]?.finalPassRate != null ? byYear[y].finalPassRate : '-'
    }
  })

  const targetRows = targetUnivComparison.map(t => ({
    '대학군': t.groupName,
    '대상 대학': t.note,
    '2023 지원건수': t.data['2023'] != null ? t.data['2023'] : '-',
    '2024 지원건수': t.data['2024'] != null ? t.data['2024'] : '-',
    '2025 지원건수': t.data['2025'] != null ? t.data['2025'] : '-',
    '2026 지원건수': t.data['2026'] != null ? t.data['2026'] : '-',
    '2027 지원건수': t.data['2027'] != null ? t.data['2027'] : '-',
    '전년(2026) 대비 증감': (previousYearKey.value && t.data['2027'] != null && t.data[previousYearKey.value] != null) ? (t.data['2027'] - t.data[previousYearKey.value]) : '-'
  }))

  const wb = XLSX.utils.book_new()
  const ws1 = XLSX.utils.json_to_sheet(summaryRows)
  const ws2 = XLSX.utils.json_to_sheet(targetRows)
  XLSX.utils.book_append_sheet(wb, ws1, '5개년 종합 비교')
  XLSX.utils.book_append_sheet(wb, ws2, '주요대학 5개년 현황')
  XLSX.writeFile(wb, `수시지원_5개년_비교분석_${new Date().toISOString().slice(0, 10)}.xlsx`)
}
</script>
