<template>
  <div ref="widgetRootRef" class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm transition-all duration-300">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/80 mb-2">
          <span>🎯</span>
          <span>내신 vs {{ examTerm }} 성적 비교 & {{ academicYearLabel }} 대입 전략</span>
          <span class="text-indigo-300">|</span>
          <span class="text-slate-500 font-semibold">성적 분석 & 대입 전략</span>
        </div>
        <h3 class="text-lg sm:text-xl font-black text-slate-900 tracking-tight m-0">
          내신 vs {{ examTerm }} 성적 비교 분석 & {{ academicYearLabel }}학년도 5대 대입 핵심 전략
        </h3>
        <p class="text-xs text-slate-500 m-0 mt-1 leading-relaxed">
          내신 대비 {{ examTerm }} 과목별 등급 격차(5개 영역 방사형), 사탐런 현황, 수능최저 충족 실질경쟁률 및 {{ academicYearLabel }}학년도 5대 대입 전략을 종합 분석합니다.
        </p>
      </div>

      <!-- Quick KPI Badges -->
      <div class="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
        <div class="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-right">
          <span class="text-[10px] text-amber-800 block font-semibold">사탐런 전향율</span>
          <span class="text-sm font-black text-amber-700 font-mono">
            <template v-if="isLoadingMockExams && (!mockStats || effectiveSatamStats.naturalCohortCount === 0)">
              <span class="text-xs text-amber-600 font-medium">분석 중...</span>
            </template>
            <template v-else-if="effectiveSatamStats.naturalCohortCount > 0">
              {{ effectiveSatamStats.totalRunRate }}% <span class="text-[11px] font-medium text-amber-600">({{ effectiveSatamStats.totalRunCount }}명)</span>
            </template>
            <template v-else>
              -
            </template>
          </span>
        </div>
        <div class="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-right" :title="`우리학교 수능최저 지원 ${schoolMinScoreStats.totalMinApps}건 실측 통계\n• 전체 (논술포함): 최초 ${schoolMinScoreStats.avgInitialRate}:1 ➔ 실질 ${schoolMinScoreStats.avgRealRate}:1 (체감 ${schoolMinScoreStats.avgEffectiveRate}:1)\n• 학생부교과 (${schoolMinScoreStats.gpaCount}건): 최초 ${schoolMinScoreStats.gpaInitialRate}:1 ➔ 실질 ${schoolMinScoreStats.gpaRealRate}:1 (체감 ${schoolMinScoreStats.gpaEffectiveRate}:1)`">
          <span class="text-[10px] text-blue-800 block font-semibold">최저 실질경쟁률</span>
          <span class="text-sm font-black text-blue-700 font-mono">
            <template v-if="isLoadingYearData && (!schoolMinScoreStats.totalMinApps || schoolMinScoreStats.totalMinApps === 0)">
              <span class="text-xs text-blue-600 font-medium">분석 중...</span>
            </template>
            <template v-else-if="schoolMinScoreStats.totalMinApps > 0 && schoolMinScoreStats.avgInitialRate !== '-'">
              {{ schoolMinScoreStats.avgInitialRate }}:1 ➔ {{ schoolMinScoreStats.avgRealRate }}:1
            </template>
            <template v-else>
              -
            </template>
          </span>
        </div>
      </div>
    </div>

    <!-- Modern Integrated Segmented Control (세련된 세그먼트 탭 점프 내비게이션 바) -->
    <div ref="stickyNavRef" class="sticky top-0 z-30 bg-white/95 backdrop-blur-md py-3 -mx-6 sm:-mx-7 px-6 sm:px-7 border-b border-slate-100 shadow-2xs">
      <div class="flex items-center justify-between gap-2 overflow-x-auto">
        <div class="inline-flex p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80 shadow-2xs gap-1 max-w-full">
          <button
            v-for="tab in subTabs"
            :key="tab.id"
            type="button"
            @click="scrollToTab(tab.id)"
            :class="[
              'px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer border-none whitespace-nowrap',
              activeSubTab === tab.id
                ? 'bg-white text-indigo-950 shadow-xs font-black ring-1 ring-slate-900/5'
                : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white/50'
            ]"
          >
            <span
              :class="[
                'w-4 h-4 rounded-full flex items-center justify-center text-[10.5px] font-black',
                activeSubTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
              ]"
            >
              {{ tab.num }}
            </span>
            <span>{{ tab.label }}</span>
          </button>
        </div>
        <span class="text-[11px] text-slate-400 font-medium hidden md:inline-block shrink-0">
          👇 버튼 클릭 시 해당 분석 섹션으로 즉시 점프합니다
        </span>
      </div>
    </div>

    <!-- Content 1: 내신 vs 수능 레이더 성적 비교 & 선택과목 분석 & 4대 기본 현황 -->
    <div id="sec-radar" class="mt-4 pt-4 space-y-6 scroll-mt-24">
      <!-- Section 1 Header Badge -->
      <div class="flex items-center justify-between pb-1">
        <div class="flex items-center gap-2">
          <span class="flex items-center justify-center w-7 h-7 rounded-xl bg-blue-50 text-blue-700 text-sm font-black border border-blue-200">1</span>
          <h3 class="text-base sm:text-lg font-black text-slate-900 m-0">과목별 내신 vs {{ examTerm }} 등급 비교</h3>
        </div>
        <span class="text-xs text-slate-400 font-medium hidden sm:inline">5개 영역 방사형 등급 격차 및 수시 4대 기본 지표</span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <!-- Left: 방사형 레이더 차트 -->
        <div class="lg:col-span-6 bg-slate-50/70 rounded-3xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div class="flex items-center justify-between mb-2">
            <div>
              <div class="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <span>📊</span>
                <span>과목별 내신 vs {{ examTerm }} 등급 비교</span>
              </div>
              <p class="text-[11px] text-slate-500 m-0 mt-0.5">
                바깥쪽일수록 상위 등급(1등급)이며, 안쪽일수록 하위 등급(9등급)입니다.
              </p>
            </div>
            <div class="flex items-center gap-2 text-[11px] font-bold">
              <span class="flex items-center gap-1 text-blue-600">
                <span class="w-2.5 h-2.5 rounded-full bg-blue-600"></span> 내신
              </span>
              <span class="flex items-center gap-1 text-amber-600">
                <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span> {{ currentSatAnalysis.isCsat ? '수능' : '모의고사' }}
              </span>
            </div>
          </div>

          <!-- Radar Chart Container -->
          <div class="h-85 sm:h-92.5 relative flex items-center justify-center my-2">
            <Radar :data="radarChartData" :options="radarChartOptions" />
          </div>

          <!-- Insights Alert -->
          <div class="mt-2 p-3 bg-blue-50/80 rounded-2xl border border-blue-200/80 text-xs text-blue-900 leading-relaxed">
            <span class="font-extrabold">💡 등급 비교 핵심 분석:</span> 
            <span v-html="radarInsightsHtml"></span>
          </div>
        </div>

        <!-- Right: 주요 영역별 수능/모의고사 5개 영역(국/수/영/사/과) 선택과목 및 평균 등급 -->
        <div class="lg:col-span-6 flex flex-col justify-between">
          <!-- 5대 영역 상세 요약 카드 & 선택과목 인포그래픽 -->
          <div class="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-3.5 h-full flex flex-col justify-between">
            <!-- Header: 제목 & 회차 드롭다운 (검은 박스선 제거 및 화살표 겹침 없는 넉넉한 폭) -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h4 class="text-sm font-black text-slate-900 m-0 flex items-center gap-1.5">
                  <span>📝</span>
                  <span>{{ currentSatAnalysis.isCsat ? '수능' : '모의고사' }} 주요 영역 응시자 수 및 평균 등급</span>
                </h4>
              </div>

              <!-- 우측 모의고사 회차 드롭다운 선택기 -->
              <div class="relative inline-flex items-center self-start sm:self-auto">
                <label for="mock-exam-month-select" class="text-xs font-bold text-slate-500 mr-2 shrink-0">회차:</label>
                <div class="relative">
                  <select
                    id="mock-exam-month-select"
                    v-model="selectedMockExamMonth"
                    class="appearance-none bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-1.5 pr-8 text-xs font-bold text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer min-w-60"
                  >
                    <option value="ALL">🌟 {{ hasCsatData ? '전체 (수능 실채점)' : '전체 (3~10월 통합)' }}{{ currentSatAnalysis.studentCount > 0 ? ` - ${currentSatAnalysis.studentCount}명` : ' (데이터 미등록)' }}</option>
                    <option
                      v-for="opt in availableExamMonthOptions"
                      :key="opt.key"
                      :value="opt.key"
                    >
                      📅 {{ opt.displayLabel }}
                    </option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- 시각화 인포그래픽 카드 5종 (1열: 국어 & 수학 / 2열: 영어 단독 슬림 / 3열: 사회탐구 & 과학탐구) -->
            <div class="space-y-3 flex-1 flex flex-col justify-between">
              <!-- 1열: 국어 영역 & 수학 영역 (2열 그리드) -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <!-- 국어 영역 카드 -->
                <div class="bg-linear-to-br from-blue-50/70 to-slate-50 p-4 rounded-2xl border border-blue-100 flex flex-col justify-between space-y-3">
                  <div>
                    <div class="flex items-center justify-between mb-1.5">
                      <span class="text-xs font-black text-blue-900 flex items-center gap-1">
                        <span class="w-2 h-2 rounded-full bg-blue-600"></span>
                        <span>국어 영역</span>
                      </span>
                      <span class="text-[11px] font-mono text-slate-500">{{ currentSatAnalysis.subjectsDetail.kor.totalCount }}명 응시</span>
                    </div>
                    <div class="flex items-baseline gap-2 mb-2">
                      <span class="text-2xl font-black text-slate-900 font-mono">{{ currentSatAnalysis.subjectsDetail.kor.totalAvg }}<span class="text-xs font-normal text-slate-500">등급</span></span>
                      <span v-if="currentSatAnalysis.hasRealData && currentSatAnalysis.subjectsDetail.kor.totalAvg !== '-'" class="text-[11px] font-semibold text-rose-600">
                        내신({{ currentGpaRaw[0] }}) 대비 {{ (Number(currentSatAnalysis.subjectsDetail.kor.totalAvg) - currentGpaRaw[0]).toFixed(2) }}↓
                      </span>
                      <span v-else class="text-[11px] text-slate-400 font-medium">
                        데이터 미등록
                      </span>
                    </div>

                    <!-- 1~9 등급 수직선 위치 마커 (직관적 포인터 핀) -->
                    <div class="relative pt-1 pb-2">
                      <div class="h-1.5 w-full bg-slate-200 rounded-full"></div>
                      <div class="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                        <span>1등급(우수)</span>
                        <span>5등급</span>
                        <span>9등급</span>
                      </div>
                      <!-- 현재 등급 위치 핀 -->
                      <div
                        v-if="currentSatAnalysis.hasRealData && currentSatAnalysis.subjectsDetail.kor.totalAvg !== '-'"
                        class="absolute top-0 transform -translate-x-1/2 flex flex-col items-center pointer-events-none"
                        :style="{ left: getRankMarkerLeft(currentSatAnalysis.subjectsDetail.kor.totalAvg) }"
                      >
                        <span class="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-xs"></span>
                      </div>
                    </div>
                  </div>

                  <!-- 국어 선택과목 (언어와 매체 vs 화법과 작문 줄바꿈 분리 카드) -->
                  <div class="pt-2.5 border-t border-blue-100/80 space-y-2">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <!-- 언어와 매체 -->
                      <div class="bg-white/95 px-2.5 py-1.5 rounded-xl border border-blue-200/80 shadow-2xs flex flex-col justify-between">
                        <div class="flex items-center gap-1.5 text-xs font-bold text-blue-950 truncate pb-1 border-b border-blue-100/60">
                          <span class="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
                          <span class="truncate">언어와 매체</span>
                        </div>
                        <div class="pt-1.5 text-center">
                          <span class="font-mono text-sm font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 whitespace-nowrap inline-block">
                            {{ currentSatAnalysis.subjectsDetail.kor.unmaeAvg }}등급
                          </span>
                        </div>
                        <div class="text-center pt-0.5">
                          <span class="text-[11px] font-medium text-slate-500 whitespace-nowrap">({{ currentSatAnalysis.subjectsDetail.kor.unmaeCount }}명)</span>
                        </div>
                      </div>
                      <!-- 화법과 작문 -->
                      <div class="bg-white/95 px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                        <div class="flex items-center gap-1.5 text-xs font-bold text-slate-800 truncate pb-1 border-b border-slate-100">
                          <span class="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                          <span class="truncate">화법과 작문</span>
                        </div>
                        <div class="pt-1.5 text-center">
                          <span class="font-mono text-sm font-black text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 whitespace-nowrap inline-block">
                            {{ currentSatAnalysis.subjectsDetail.kor.hwajakAvg }}등급
                          </span>
                        </div>
                        <div class="text-center pt-0.5">
                          <span class="text-[11px] font-medium text-slate-500 whitespace-nowrap">({{ currentSatAnalysis.subjectsDetail.kor.hwajakCount }}명)</span>
                        </div>
                      </div>
                    </div>
                    <!-- 언매 vs 화작 격차 배지 -->
                    <div v-if="currentSatAnalysis.hasRealData && currentSatAnalysis.subjectsDetail.kor.unmaeAvg !== '-' && currentSatAnalysis.subjectsDetail.kor.hwajakAvg !== '-'" class="text-[10.5px] font-extrabold text-blue-900 bg-blue-50/80 border border-blue-200/70 rounded-lg py-1 px-2 text-center">
                      ⚡ 언매가 화작 대비 <span class="text-blue-600 underline font-black">{{ (Number(currentSatAnalysis.subjectsDetail.kor.hwajakAvg) - Number(currentSatAnalysis.subjectsDetail.kor.unmaeAvg)).toFixed(2) }}등급</span> 우세
                    </div>
                  </div>
                </div>

                <!-- 수학 영역 카드 (미적분/기하 vs 확률과 통계 줄바꿈 분리 카드) -->
                <div class="bg-linear-to-br from-indigo-50/70 to-slate-50 p-4 rounded-2xl border border-indigo-100 flex flex-col justify-between space-y-3">
                  <div>
                    <div class="flex items-center justify-between mb-1.5">
                      <span class="text-xs font-black text-indigo-900 flex items-center gap-1">
                        <span class="w-2 h-2 rounded-full bg-indigo-600"></span>
                        <span>수학 영역</span>
                      </span>
                      <span class="text-[11px] font-mono text-slate-500">{{ currentSatAnalysis.subjectsDetail.math.totalCount }}명 응시</span>
                    </div>
                    <div class="flex items-baseline gap-2 mb-2">
                      <span class="text-2xl font-black text-slate-900 font-mono">{{ currentSatAnalysis.subjectsDetail.math.totalAvg }}<span class="text-xs font-normal text-slate-500">등급</span></span>
                      <span v-if="currentSatAnalysis.hasRealData && currentSatAnalysis.subjectsDetail.math.totalAvg !== '-'" class="text-[11px] font-semibold text-rose-600">
                        내신({{ currentGpaRaw[1] }}) 대비 {{ (Number(currentSatAnalysis.subjectsDetail.math.totalAvg) - currentGpaRaw[1]).toFixed(2) }}↓
                      </span>
                      <span v-else class="text-[11px] text-slate-400 font-medium">
                        데이터 미등록
                      </span>
                    </div>

                    <!-- 1~9 등급 수직선 위치 마커 -->
                    <div class="relative pt-1 pb-2">
                      <div class="h-1.5 w-full bg-slate-200 rounded-full"></div>
                      <div class="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                        <span>1등급(우수)</span>
                        <span>5등급</span>
                        <span>9등급</span>
                      </div>
                      <!-- 현재 등급 위치 핀 -->
                      <div
                        v-if="currentSatAnalysis.hasRealData && currentSatAnalysis.subjectsDetail.math.totalAvg !== '-'"
                        class="absolute top-0 transform -translate-x-1/2 flex flex-col items-center pointer-events-none"
                        :style="{ left: getRankMarkerLeft(currentSatAnalysis.subjectsDetail.math.totalAvg) }"
                      >
                        <span class="w-3 h-3 rounded-full bg-indigo-600 border-2 border-white shadow-xs"></span>
                      </div>
                    </div>
                  </div>

                  <!-- 수학 선택과목 (미적분/기하 vs 확률과 통계) -->
                  <div class="pt-2.5 border-t border-indigo-100/80 space-y-2">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <!-- 1. 미적분/기하 독립 카드 -->
                      <div class="bg-white/95 px-2.5 py-1.5 rounded-xl border border-indigo-200 shadow-2xs flex flex-col justify-between">
                        <div class="flex items-center gap-1.5 text-xs font-bold text-indigo-950 truncate pb-1 border-b border-indigo-100/60">
                          <span class="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0"></span>
                          <span class="truncate">미적분/기하</span>
                        </div>
                        <div class="pt-1.5 text-center">
                          <span class="font-mono text-sm font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 whitespace-nowrap inline-block">
                            {{ currentSatAnalysis.subjectsDetail.math.mijukAvg }}등급
                          </span>
                        </div>
                        <div class="text-center pt-0.5">
                          <span class="text-[11px] font-medium text-slate-500 whitespace-nowrap">({{ currentSatAnalysis.subjectsDetail.math.mijukCount }}명)</span>
                        </div>
                      </div>

                      <!-- 2. 확률과 통계 독립 카드 -->
                      <div class="bg-white/95 px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                        <div class="flex items-center gap-1.5 text-xs font-bold text-slate-800 truncate pb-1 border-b border-slate-100">
                          <span class="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                          <span class="truncate">확률과 통계</span>
                        </div>
                        <div class="pt-1.5 text-center">
                          <span class="font-mono text-sm font-black text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 whitespace-nowrap inline-block">
                            {{ currentSatAnalysis.subjectsDetail.math.hwaktongAvg }}등급
                          </span>
                        </div>
                        <div class="text-center pt-0.5">
                          <span class="text-[11px] font-medium text-slate-500 whitespace-nowrap">({{ currentSatAnalysis.subjectsDetail.math.hwaktongCount }}명)</span>
                        </div>
                      </div>
                    </div>

                    <!-- 직관적 격차 배지 -->
                    <div v-if="currentSatAnalysis.hasRealData && currentSatAnalysis.subjectsDetail.math.mijukAvg !== '-' && currentSatAnalysis.subjectsDetail.math.hwaktongAvg !== '-'" class="text-[10.5px] font-extrabold text-indigo-800 bg-indigo-50/80 border border-indigo-200/70 rounded-lg py-1 px-2 text-center">
                      ⚡ 미적분이 확통 대비 <span class="text-indigo-600 underline font-black">{{ (Number(currentSatAnalysis.subjectsDetail.math.hwaktongAvg) - Number(currentSatAnalysis.subjectsDetail.math.mijukAvg)).toFixed(2) }}등급</span> 우세
                    </div>
                  </div>
                </div>
              </div>

              <!-- 2열: 영어 영역 (좌측 등급/슬라이더 5 : 우측 전략 카드 7 비율 배치로 1줄 정렬 완벽 보장) -->
              <div class="bg-linear-to-br from-emerald-50/70 to-slate-50 p-3.5 sm:p-4 rounded-2xl border border-emerald-100 shadow-2xs">
                <div class="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center">
                  <!-- 좌측: 등급 & 슬라이더 표시 (좌측 폭 최적화: 5/12) -->
                  <div class="sm:col-span-5 space-y-1.5">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-emerald-600"></span>
                        <span>영어 영역</span>
                        <span class="text-[10px] font-mono text-emerald-800 font-extrabold bg-emerald-100/90 px-1.5 py-0.2 rounded-full border border-emerald-200/60">절대평가</span>
                      </span>
                      <span class="text-[11px] font-mono text-slate-500">{{ currentSatAnalysis.subjectsDetail.eng.totalCount }}명 응시</span>
                    </div>

                    <div class="flex items-baseline gap-2">
                      <span class="text-2xl font-black text-slate-900 font-mono tracking-tight">{{ currentSatAnalysis.subjectsDetail.eng.totalAvg }}<span class="text-xs font-normal text-slate-500">등급</span></span>
                      <span v-if="currentSatAnalysis.hasRealData && currentSatAnalysis.subjectsDetail.eng.totalAvg !== '-' && currentGpaRaw[2]" class="text-[11px] font-semibold text-rose-600 whitespace-nowrap">
                        내신({{ currentGpaRaw[2] }}) 대비 {{ (Number(currentSatAnalysis.subjectsDetail.eng.totalAvg) - currentGpaRaw[2]).toFixed(2) }}↓
                      </span>
                      <span v-else class="text-[11px] text-slate-400 font-medium">데이터 미등록</span>
                    </div>

                    <!-- 1~9 등급 수직선 위치 마커 -->
                    <div class="relative pt-1 pb-1">
                      <div class="h-1.5 w-full bg-slate-200 rounded-full"></div>
                      <div class="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                        <span class="whitespace-nowrap">1등급(우수)</span>
                        <span class="whitespace-nowrap">5등급</span>
                        <span class="whitespace-nowrap">9등급</span>
                      </div>
                      <!-- 현재 등급 위치 핀 -->
                      <div
                        v-if="currentSatAnalysis.hasRealData && currentSatAnalysis.subjectsDetail.eng.totalAvg !== '-'"
                        class="absolute top-0 transform -translate-x-1/2 flex flex-col items-center pointer-events-none"
                        :style="{ left: getRankMarkerLeft(currentSatAnalysis.subjectsDetail.eng.totalAvg) }"
                      >
                        <span class="w-3 h-3 rounded-full bg-emerald-600 border-2 border-white shadow-xs"></span>
                      </div>
                    </div>
                  </div>

                  <!-- 우측: 수능 최저 핵심 전략 & 등급컷 안내 카드 (우측 폭 확대: 7/12, 1줄 레이아웃 보장) -->
                  <div class="sm:col-span-7 bg-white/95 p-3 rounded-xl border border-emerald-200/80 shadow-2xs flex flex-col justify-between space-y-1.5">
                    <div class="flex items-center justify-between gap-1.5">
                      <span class="text-xs font-bold text-emerald-950 flex items-center gap-1.5 min-w-0">
                        <span class="text-sm shrink-0">🎯</span>
                        <span class="whitespace-nowrap font-extrabold">수능 최저의 핵심 전략 영역</span>
                      </span>
                      <span class="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 whitespace-nowrap shrink-0">절대평가 활용</span>
                    </div>
                    <p class="text-xs text-slate-600 leading-relaxed font-medium m-0">
                      상대평가(6등급대) 부담 없이 <span class="font-bold text-emerald-700">2~3등급 안정 확보</span> 시 수시 최저 충족 성공률이 급상승합니다.
                    </p>
                    <div class="text-[10.5px] text-slate-400 font-mono pt-1.5 border-t border-slate-100 flex items-center justify-between">
                      <span>90점↑ 1등급</span>
                      <span class="text-slate-300">·</span>
                      <span>80점↑ 2등급</span>
                      <span class="text-slate-300">·</span>
                      <span>70점↑ 3등급</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 3열: 사회탐구 & 과학탐구 (2열 그리드) -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <!-- 사회탐구 영역 카드 -->
                <div class="bg-linear-to-br from-amber-50/70 to-slate-50 p-4 rounded-2xl border border-amber-200/80 flex flex-col justify-between space-y-3">
                  <div>
                    <div class="flex items-center justify-between mb-1.5">
                      <span class="text-xs font-black text-amber-900 flex items-center gap-1">
                        <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span>사회탐구 영역</span>
                      </span>
                      <span class="text-[11px] font-mono text-slate-500">{{ currentSatAnalysis.subjectsDetail.soc?.totalCount || 0 }}명 응시</span>
                    </div>
                    <div class="flex items-baseline gap-2 mb-2">
                      <span class="text-2xl font-black text-slate-900 font-mono">{{ currentSatAnalysis.subjectsDetail.soc?.totalAvg || '-' }}<span class="text-xs font-normal text-slate-500">등급</span></span>
                      <span v-if="currentSatAnalysis.hasRealData && currentSatAnalysis.subjectsDetail.soc?.totalAvg !== '-' && currentGpaRaw[3]" class="text-[11px] font-semibold text-rose-600">
                        내신({{ currentGpaRaw[3] }}) 대비 {{ (Number(currentSatAnalysis.subjectsDetail.soc.totalAvg) - currentGpaRaw[3]).toFixed(2) }}↓
                      </span>
                      <span v-else class="text-[11px] text-slate-400 font-medium">
                        {{ currentSatAnalysis.hasRealData ? '응시 집계' : '데이터 미등록' }}
                      </span>
                    </div>

                    <!-- 1~9 등급 수직선 위치 마커 -->
                    <div class="relative pt-1 pb-2">
                      <div class="h-1.5 w-full bg-slate-200 rounded-full"></div>
                      <div class="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                        <span>1등급(우수)</span>
                        <span>5등급</span>
                        <span>9등급</span>
                      </div>
                      <!-- 현재 등급 위치 핀 -->
                      <div
                        v-if="currentSatAnalysis.hasRealData && currentSatAnalysis.subjectsDetail.soc?.totalAvg !== '-'"
                        class="absolute top-0 transform -translate-x-1/2 flex flex-col items-center pointer-events-none"
                        :style="{ left: getRankMarkerLeft(currentSatAnalysis.subjectsDetail.soc.totalAvg) }"
                      >
                        <span class="w-3 h-3 rounded-full bg-amber-500 border-2 border-white shadow-xs"></span>
                      </div>
                    </div>
                  </div>

                  <!-- 사탐 선택과목 상위 2개 (과목명과 인원/등급 줄바꿈 분리 카드) & 전략 배너 -->
                  <div class="pt-2.5 border-t border-amber-100/90 space-y-2">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <template v-if="currentSatAnalysis.subjectsDetail.soc?.topSubjects?.length">
                        <div
                          v-for="(sub, sIdx) in currentSatAnalysis.subjectsDetail.soc.topSubjects.slice(0, 2)"
                          :key="sub.name"
                          class="bg-white/95 px-2.5 py-1.5 rounded-xl border border-amber-200/80 shadow-2xs flex flex-col justify-between"
                        >
                          <!-- 1줄: 과목명 (여유롭게 전체 표시) -->
                          <div class="flex items-center gap-1.5 text-xs font-bold text-amber-950 truncate pb-1 border-b border-amber-100/60">
                            <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="sIdx === 0 ? 'bg-amber-600' : 'bg-slate-400'"></span>
                            <span class="truncate">{{ sub.name }}</span>
                          </div>
                          <!-- 2줄: 평균 등급 (윗줄) -->
                          <div class="pt-1.5 text-center">
                            <span class="font-mono text-sm font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 whitespace-nowrap inline-block">
                              {{ sub.avg }}등급
                            </span>
                          </div>
                          <!-- 3줄: 인원수 (아래줄) -->
                          <div class="text-center pt-0.5">
                            <span class="text-[11px] font-medium text-slate-500 whitespace-nowrap">({{ sub.count }}명)</span>
                          </div>
                        </div>
                      </template>
                      <div v-else class="col-span-2 text-center text-[10.5px] text-slate-400 py-1 bg-white/60 rounded-lg">
                        세부 과목 데이터 집계 중
                      </div>
                    </div>
                    <!-- 사탐 최저 전략 팁 배너 -->
                    <div class="text-[10.5px] font-bold text-amber-900 bg-amber-100/60 border border-amber-200/70 rounded-lg py-1 px-2 flex items-center justify-between">
                      <span class="flex items-center gap-1">
                        <span>🏃</span>
                        <span>자연계 사탐런 전향자의 수능최저 핵심 전략 영역</span>
                      </span>
                      <span class="text-[10px] font-extrabold text-amber-700 shrink-0">사문·생윤 집중</span>
                    </div>
                  </div>
                </div>

                <!-- 과학탐구 영역 카드 -->
                <div class="bg-linear-to-br from-purple-50/70 to-slate-50 p-4 rounded-2xl border border-purple-200/80 flex flex-col justify-between space-y-3">
                  <div>
                    <div class="flex items-center justify-between mb-1.5">
                      <span class="text-xs font-black text-purple-900 flex items-center gap-1">
                        <span class="w-2 h-2 rounded-full bg-purple-600"></span>
                        <span>과학탐구 영역</span>
                      </span>
                      <span class="text-[11px] font-mono text-slate-500">{{ currentSatAnalysis.subjectsDetail.sci?.totalCount || 0 }}명 응시</span>
                    </div>
                    <div class="flex items-baseline gap-2 mb-2">
                      <span class="text-2xl font-black text-slate-900 font-mono">{{ currentSatAnalysis.subjectsDetail.sci?.totalAvg || '-' }}<span class="text-xs font-normal text-slate-500">등급</span></span>
                      <span v-if="currentSatAnalysis.hasRealData && currentSatAnalysis.subjectsDetail.sci?.totalAvg !== '-' && currentGpaRaw[4]" class="text-[11px] font-semibold text-rose-600">
                        내신({{ currentGpaRaw[4] }}) 대비 {{ (Number(currentSatAnalysis.subjectsDetail.sci.totalAvg) - currentGpaRaw[4]).toFixed(2) }}↓
                      </span>
                      <span v-else class="text-[11px] text-slate-400 font-medium">
                        {{ currentSatAnalysis.hasRealData ? '응시 집계' : '데이터 미등록' }}
                      </span>
                    </div>

                    <!-- 1~9 등급 수직선 위치 마커 -->
                    <div class="relative pt-1 pb-2">
                      <div class="h-1.5 w-full bg-slate-200 rounded-full"></div>
                      <div class="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                        <span>1등급(우수)</span>
                        <span>5등급</span>
                        <span>9등급</span>
                      </div>
                      <!-- 현재 등급 위치 핀 -->
                      <div
                        v-if="currentSatAnalysis.hasRealData && currentSatAnalysis.subjectsDetail.sci?.totalAvg !== '-'"
                        class="absolute top-0 transform -translate-x-1/2 flex flex-col items-center pointer-events-none"
                        :style="{ left: getRankMarkerLeft(currentSatAnalysis.subjectsDetail.sci.totalAvg) }"
                      >
                        <span class="w-3 h-3 rounded-full bg-purple-600 border-2 border-white shadow-xs"></span>
                      </div>
                    </div>
                  </div>

                  <!-- 과탐 선택과목 상위 2개 (과목명과 인원/등급 줄바꿈 분리 카드) & 전략 배너 -->
                  <div class="pt-2.5 border-t border-purple-100/90 space-y-2">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <template v-if="currentSatAnalysis.subjectsDetail.sci?.topSubjects?.length">
                        <div
                          v-for="(sub, sIdx) in currentSatAnalysis.subjectsDetail.sci.topSubjects.slice(0, 2)"
                          :key="sub.name"
                          class="bg-white/95 px-2.5 py-1.5 rounded-xl border border-purple-200/80 shadow-2xs flex flex-col justify-between"
                        >
                          <!-- 1줄: 과목명 (여유롭게 전체 표시) -->
                          <div class="flex items-center gap-1.5 text-xs font-bold text-purple-950 truncate pb-1 border-b border-purple-100/60">
                            <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="sIdx === 0 ? 'bg-purple-600' : 'bg-slate-400'"></span>
                            <span class="truncate">{{ sub.name }}</span>
                          </div>
                          <!-- 2줄: 평균 등급 (윗줄) -->
                          <div class="pt-1.5 text-center">
                            <span class="font-mono text-sm font-black text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 whitespace-nowrap inline-block">
                              {{ sub.avg }}등급
                            </span>
                          </div>
                          <!-- 3줄: 인원수 (아래줄) -->
                          <div class="text-center pt-0.5">
                            <span class="text-[11px] font-medium text-slate-500 whitespace-nowrap">({{ sub.count }}명)</span>
                          </div>
                        </div>
                      </template>
                      <div v-else class="col-span-2 text-center text-[10.5px] text-slate-400 py-1 bg-white/60 rounded-lg">
                        세부 과목 데이터 집계 중
                      </div>
                    </div>
                    <!-- 과탐 최저 전략 팁 배너 -->
                    <div class="text-[10.5px] font-bold text-purple-900 bg-purple-100/60 border border-purple-200/70 rounded-lg py-1 px-2 flex items-center justify-between">
                      <span class="flex items-center gap-1">
                        <span>🔬</span>
                        <span>의약학·상위권 이공계열 필수 반영 영역</span>
                      </span>
                      <span class="text-[10px] font-extrabold text-purple-700 shrink-0">생Ⅰ·지Ⅰ 중심</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 신규: 2027 모의고사 월별 성적 추이 (3월 ➔ 10월) 라인 차트 -->
      <div class="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2">
              <span class="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-black border border-indigo-200">📈</span>
              <h4 class="text-base font-black text-slate-900 m-0">{{ academicYearLabel }} 모의고사 회차별 성적 추이 (3월 ➔ 10월)</h4>
            </div>
            <p class="text-xs text-slate-500 m-0 mt-1">
              {{ hasCsatData ? '3월~10월 모의고사 및 수능 실채점에 따른' : '3월·5월·6월·7월·9월·10월 모의고사 회차에 따른' }} 영역별 평균 등급과 응시 인원수 변화 추이를 종합 분석합니다.
            </p>
          </div>

          <!-- 상단 조절 바: 추이 보기 모드 및 밀집구간 줌 토글 -->
          <div class="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
            <!-- 줌 토글 버튼 (등급 보기 모드일 때만 표시) -->
            <button
              v-if="mockTrendViewMode !== 'COUNT'"
              type="button"
              @click="isGradeZoomed = !isGradeZoomed"
              :class="[
                'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer',
                isGradeZoomed
                  ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs hover:bg-amber-100'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              ]"
              :title="isGradeZoomed ? `${trendDynamicYRange.label} 데이터 밀집 구간 자동 최적화` : '전체 1~9등급 기본 스케일'"
            >
              <span>{{ isGradeZoomed ? `🔍 ${trendDynamicYRange.label} 집중 확대` : '🔎 전체 1~9등급' }}</span>
              <span :class="['text-[10px] px-1.5 py-0.5 rounded-md font-extrabold', isGradeZoomed ? 'bg-amber-200 text-amber-800' : 'bg-slate-100 text-slate-500']">
                {{ isGradeZoomed ? 'ON' : 'OFF' }}
              </span>
            </button>

            <!-- 추이 보기 모드 탭 (선택과목 분리 / 5개영역 통합 / 응시 인원수) -->
            <div class="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200 text-xs">
              <button
                type="button"
                @click="mockTrendViewMode = 'SPLIT'"
                :class="[
                  'px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1',
                  mockTrendViewMode === 'SPLIT' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                ]"
              >
                <span>⚡ 선택과목 분리</span>
                <span class="text-[10px] px-1 py-0.2 rounded bg-indigo-50 text-indigo-600 font-extrabold hidden md:inline">추천</span>
              </button>
              <button
                type="button"
                @click="mockTrendViewMode = 'COMBINED'"
                :class="[
                  'px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer',
                  mockTrendViewMode === 'COMBINED' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                ]"
              >
                📊 5개 영역 통합
              </button>
              <button
                type="button"
                @click="mockTrendViewMode = 'COUNT'"
                :class="[
                  'px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer',
                  mockTrendViewMode === 'COUNT' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                ]"
              >
                👥 응시자 수
              </button>
            </div>
          </div>
        </div>

        <!-- 라인 차트 컨테이너 -->
        <div class="h-64 sm:h-72 w-full relative">
          <Line :data="mockExamTrendChartData" :options="mockTrendChartOptions" />
          <div
            v-if="!hasMockData"
            class="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[1px] rounded-2xl pointer-events-none"
          >
            <div class="p-4 bg-white/95 rounded-2xl border border-slate-200/90 shadow-md text-center max-w-md mx-4">
              <span class="text-2xl mb-1.5 block">📊</span>
              <p class="text-sm font-extrabold text-slate-800 m-0">
                {{ academicYearLabel }}학년도 모의고사 성적 데이터 미등록
              </p>
              <p class="text-xs text-slate-500 mt-1 mb-0 leading-relaxed">
                {{ academicYearLabel }}학년도는 회차별 모의고사(3·5·6·7·9·10월) 성적 데이터가 시트에 등록되어 있지 않아 빈 그래프로 표시됩니다.
              </p>
            </div>
          </div>
        </div>

        <!-- 추이 분석 핵심 인사이트 브리핑 바 -->
        <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 leading-relaxed flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div class="flex items-start sm:items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0 mt-1 sm:mt-0"></span>
            <div>
              <span class="font-extrabold text-slate-900">💡 {{ hasMockData ? '모의고사 회차별 핵심 분석:' : `${academicYearLabel}학년도 성적 데이터 안내:` }}</span>
              <span v-if="hasMockData" class="text-slate-600 ml-1">
                <strong>수학 미적분/기하(4.3등급선)</strong>는 내신 평균({{ avgSchoolGpa }}등급선) 수준을 유지하는 반면, <strong>확률과통계(6.5등급선)</strong> 및 국어/탐구는 내신 대비 1.5등급 이상 하락합니다. 절대평가인 <strong>영어(5.4등급선)</strong>와 전략적 탐구 과목으로 수능 최저를 방어하는 전략이 필수적입니다.
              </span>
              <span v-else class="text-slate-600 ml-1">
                {{ academicYearLabel }}학년도는 회차별 모의고사 성적 데이터가 등록되어 있지 않아 수시 지원 원자료({{ applications.length }}건)를 바탕으로 분석합니다.
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2 text-[11px] font-mono text-slate-500 shrink-0 self-end md:self-auto">
            <span class="inline-flex items-center gap-1 text-pink-600 font-bold">
              <span class="w-3 border-t-2 border-pink-500 border-dashed inline-block"></span>
              내신 평균 기준선({{ avgSchoolGpa }})
            </span>
            <span class="text-slate-300">|</span>
            <span>Y축 반전: 위쪽이 상위 등급</span>
          </div>
        </div>
      </div>
<!-- 1번에 속하는 수시 지원 4대 기본 현황 차트 슬롯 (전형유형, 지역분포, 학급현황, 계열비중) -->
      <slot name="overview-charts"></slot>
    </div>

    <!-- Content 2: 사탐런 & 사회/과학탐구 응시 상세 현황 -->
    <div id="sec-satamRun" class="mt-14 pt-8 border-t-2 border-slate-200/90 space-y-6 scroll-mt-24">
      <!-- Section 2 Header Badge -->
      <div class="flex items-center justify-between pb-1">
        <div class="flex items-center gap-2">
          <span class="flex items-center justify-center w-7 h-7 rounded-xl bg-pink-50 text-pink-700 text-sm font-black border border-pink-200">2</span>
          <h3 class="text-base sm:text-lg font-black text-slate-900 m-0">사탐런 & 탐구 응시 분석</h3>
        </div>
        <span class="text-xs text-slate-400 font-medium hidden sm:inline">{{ satamAnalysisBadgeTitle }}</span>
      </div>
      <!-- 사탐런 인포그래픽 상단 배너 (단일 통합 분석) -->
      <div class="bg-linear-to-r from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div class="relative z-10">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-xs">
              <span>🚀</span>
              <span>자연계열 학생 사탐런(과탐 ➔ 사탐 전향) 실측 분석</span>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="text-xs font-bold bg-white/30 px-2.5 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1.5 cursor-help"
                :title="`자연계열 모수 판정 원칙:\n1. 수시 6장 카드 중 실제 작성 카드에서 자연계열 학과가 33% 초과인 학생\n2. 수시 데이터가 없는 경우 3~10월 모의고사 중 미적/기하 또는 과탐 응시 이력 학생`"
              >
                <span>자연계열 모수: {{ effectiveSatamStats.naturalCohortCount }}명</span>
                <span v-if="effectiveSatamStats.appsBasedCohortCount > 0" class="text-[11px] opacity-90 font-normal">
                  (수시 기반 {{ effectiveSatamStats.appsBasedCohortCount }}명 / 모의 기반 {{ effectiveSatamStats.mockBasedCohortCount }}명)
                </span>
              </span>
            </div>
          </div>

          <!-- 타이틀 -->
          <h3 class="text-xl sm:text-2xl font-black tracking-tight m-0">
            <template v-if="(isLoadingMockExams || isLoadingYearData) && (!mockStats || effectiveSatamStats.naturalCohortCount === 0)">
              자연계열 학생의 사탐 전향 현황을 분석 중입니다...
            </template>
            <template v-else-if="effectiveSatamStats.naturalCohortCount > 0">
              자연계열 학생 중 {{ effectiveSatamStats.totalRunRate }}% ({{ effectiveSatamStats.totalRunCount }}명)가 사탐으로 전향했습니다
            </template>
            <template v-else>
              {{ academicYearLabel }}학년도 수시 지원 원자료 기준 탐구 응시 현황
            </template>
          </h3>

          <p class="text-xs text-white/90 mt-1.5 max-w-2xl leading-relaxed">
            <template v-if="effectiveSatamStats.naturalCohortCount > 0">
              {{ hasMockData ? '전체 모의고사 중 미적/기하 또는 과탐 이력이 있는' : '수시 지원 카드 중 자연계열 학과를 지원한' }} 자연계열 학생 <strong>{{ effectiveSatamStats.naturalCohortCount }}명</strong> 중 <strong>{{ effectiveSatamStats.totalRunCount }}명({{ effectiveSatamStats.totalRunRate }}%)</strong>이 {{ examTerm }}에서 과탐의 극심한 등급 방어 부담을 덜고 수능 최저를 안정적으로 확보하기 위해 사탐 과목을 선택(사탐런)했습니다.
            </template>
            <template v-else>
              {{ academicYearLabel }}학년도는 회차별 모의고사 데이터 대신 수시 지원 결과({{ applications.length }}건) 및 과목별 탐구 응시 현황을 기준으로 분석합니다.
            </template>
          </p>

          <!-- 4개 통계 카드 그리드 -->
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/20">
            <!-- 사탐런 전체 전향자 -->
            <div class="bg-white/10 rounded-2xl p-3 backdrop-blur-xs">
              <div class="text-[11px] text-white/80 font-semibold">사탐런 전체 전향자</div>
              <div class="text-2xl font-black font-mono">
                {{ effectiveSatamStats.totalRunCount }}명 <span class="text-sm font-bold opacity-80">({{ effectiveSatamStats.totalRunRate }}%)</span>
              </div>
              <div class="text-[10px] text-white/70 mt-0.5">이과생 중 전향 비율</div>
            </div>

            <!-- 1과목 전향 -->
            <div class="bg-white/10 rounded-2xl p-3 backdrop-blur-xs">
              <div class="text-[11px] text-white/80 font-semibold">1과목 전향 (과탐1 + 사탐1)</div>
              <div class="text-2xl font-black font-mono">
                {{ effectiveSatamStats.run1Count }}명 <span class="text-sm font-bold opacity-80">({{ effectiveSatamStats.run1Rate }}%)</span>
              </div>
              <div class="text-[10px] text-white/70 mt-0.5">자연계 요건 유지 + 최저 확보</div>
            </div>

            <!-- 2과목 전향 -->
            <div class="bg-white/10 rounded-2xl p-3 backdrop-blur-xs">
              <div class="text-[11px] text-white/80 font-semibold">2과목 전향 (사탐2)</div>
              <div class="text-2xl font-black font-mono">
                {{ effectiveSatamStats.run2Count }}명 <span class="text-sm font-bold opacity-80">({{ effectiveSatamStats.run2Rate }}%)</span>
              </div>
              <div class="text-[10px] text-white/70 mt-0.5">인문 교차지원 및 완전 최저 대비</div>
            </div>

            <!-- 과탐 2과목 유지자 -->
            <div class="bg-white/10 rounded-2xl p-3 backdrop-blur-xs">
              <div class="text-[11px] text-white/80 font-semibold">과탐 유지 (과탐2)</div>
              <div class="text-2xl font-black font-mono">
                {{ effectiveSatamStats.keptCount }}명 <span class="text-sm font-bold opacity-80">({{ effectiveSatamStats.keptRate }}%)</span>
              </div>
              <div class="text-[10px] text-white/70 mt-0.5">정통 자연계열 과탐 고수</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 학생별 전향 상세 내역 및 인기 사탐 과목 통계 (학생 데이터 보유 시 상시 표시) -->
      <div v-if="effectiveSatamStats.naturalCohort && effectiveSatamStats.naturalCohort.length > 0" class="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h4 class="text-sm font-black text-slate-900 m-0 flex items-center gap-1.5">
              <span>👥</span>
              <span>자연계열 학생별 3월 ➔ 최종({{ examTerm }}) 응시 변화 내역</span>
            </h4>
            <p class="text-[11px] text-slate-500 m-0 mt-0.5">
              미적분/기하 또는 과탐 이력 학생 {{ effectiveSatamStats.naturalCohortCount }}명 전원의 탐구 과목 응시 현황을 전수 추적한 결과입니다.
            </p>
          </div>

          <!-- 인기 선택 사탐 배지 -->
          <div v-if="effectiveSatamStats.popularSocialSubjects && effectiveSatamStats.popularSocialSubjects.length > 0" class="flex flex-wrap items-center gap-1.5">
            <span class="text-[11px] text-slate-400 font-bold">인기 전향 사탐:</span>
            <span
              v-for="subj in effectiveSatamStats.popularSocialSubjects.slice(0, 3)"
              :key="subj.name"
              class="px-2 py-0.5 rounded-lg bg-orange-50 text-orange-800 border border-orange-200 text-xs font-bold font-mono"
            >
              {{ subj.name }} ({{ subj.count }}명)
            </span>
          </div>
        </div>

        <!-- 필터 및 검색 바 -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              @click="studentFilter = 'ALL'"
              :class="[
                'px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer',
                studentFilter === 'ALL' ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              ]"
            >
              전체 ({{ effectiveSatamStats.naturalCohortCount }}명)
            </button>
            <button
              type="button"
              @click="studentFilter = 'RUN_ALL'"
              :class="[
                'px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer',
                studentFilter === 'RUN_ALL' ? 'bg-orange-600 text-white shadow-2xs' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
              ]"
            >
              사탐런 전체 ({{ effectiveSatamStats.totalRunCount }}명)
            </button>
            <button
              type="button"
              @click="studentFilter = 'RUN_1'"
              :class="[
                'px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer',
                studentFilter === 'RUN_1' ? 'bg-amber-600 text-white shadow-2xs' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              ]"
            >
              1과목 사탐런 ({{ effectiveSatamStats.run1Count }}명)
            </button>
            <button
              type="button"
              @click="studentFilter = 'RUN_2'"
              :class="[
                'px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer',
                studentFilter === 'RUN_2' ? 'bg-rose-600 text-white shadow-2xs' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              ]"
            >
              2과목 사탐런 ({{ effectiveSatamStats.run2Count }}명)
            </button>
            <button
              type="button"
              @click="studentFilter = 'KEPT'"
              :class="[
                'px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer',
                studentFilter === 'KEPT' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              ]"
            >
              과탐 유지 ({{ effectiveSatamStats.keptCount }}명)
            </button>
          </div>

          <!-- 검색창 -->
          <div class="relative w-full sm:w-56">
            <input
              type="text"
              v-model="studentSearch"
              placeholder="이름 / 과목 검색..."
              class="w-full text-xs px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 bg-slate-50/70 font-sans"
            />
            <span v-if="studentSearch" @click="studentSearch = ''" class="absolute right-2.5 top-1.5 text-slate-400 hover:text-slate-600 cursor-pointer text-xs">✕</span>
          </div>
        </div>

        <!-- 학생 목록 테이블 -->
        <div class="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div class="overflow-x-auto max-h-84">
            <table class="w-full text-left text-xs border-collapse">
              <thead class="bg-slate-50 text-slate-600 sticky top-0 z-10 border-b border-slate-200 font-bold">
                <tr>
                  <th class="p-3 w-16 text-center">반-번호</th>
                  <th class="p-3 w-24">이름</th>
                  <th class="p-3 w-36">모수 분류 근거</th>
                  <th class="p-3">초기(3월) 응시 과목</th>
                  <th class="p-3">최종(10월) 응시 과목</th>
                  <th class="p-3 w-28 text-center">응시 추이</th>
                  <th class="p-3 w-28 text-center">전향 유형</th>
                  <th class="p-3 w-36">선택한 사탐 과목</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-sans">
                <tr
                  v-for="s in filteredCohortStudents"
                  :key="s.key"
                  class="hover:bg-slate-50/80 transition-colors"
                >
                  <td class="p-3 text-center font-mono text-slate-500 text-[11px]">
                    {{ s.classNum ? `${s.classNum}반` : '' }} {{ s.studentNum ? `${s.studentNum}번` : '' }}
                  </td>
                  <td class="p-3 font-bold text-slate-900">
                    {{ maskName(s.name) }}
                  </td>
                  <td class="p-3">
                    <span
                      :class="[
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-help shadow-2xs',
                        s.cohortBadgeClass || 'bg-slate-50 text-slate-700 border-slate-200'
                      ]"
                      :title="s.cohortDetail"
                    >
                      <span v-if="s.cohortSource === 'APPLICATIONS'">🎓</span>
                      <span v-else>🧪</span>
                      <span>{{ s.cohortBadgeText || '자연계열' }}</span>
                    </span>
                  </td>
                  <td class="p-3 text-slate-600 text-[11px]">
                    <span class="font-medium text-slate-800">[{{ s.initialExam?.rawMath || '미적분' }}]</span>
                    <span class="text-slate-500 ml-1">{{ s.initialExam?.rawInq1 || '-' }}, {{ s.initialExam?.rawInq2 || '-' }}</span>
                  </td>
                  <td class="p-3 text-slate-800 text-[11px]">
                    <span class="font-medium text-slate-800">[{{ s.latestExam?.rawMath || '미적분' }}]</span>
                    <span class="ml-1 font-semibold" :class="s.status !== 'KEPT_SCIENCE' ? 'text-orange-700' : 'text-slate-700'">
                      {{ s.latestExam?.rawInq1 || '-' }}, {{ s.latestExam?.rawInq2 || '-' }}
                    </span>
                  </td>
                  <!-- 회차별 응시 추이 툴팁 (1번 개선안 적용) -->
                  <td class="p-3 text-center">
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-help border border-slate-200"
                      :title="s.timelineText || '응시 이력'"
                    >
                      <span>⏱️</span>
                      <span>{{ s.examTimeline?.length || 1 }}개 시험</span>
                    </button>
                  </td>
                  <td class="p-3 text-center">
                    <span
                      v-if="s.status === 'RUN_2'"
                      class="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200"
                    >
                      2과목 사탐런
                    </span>
                    <span
                      v-else-if="s.status === 'RUN_1'"
                      class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200"
                    >
                      1과목 사탐런
                    </span>
                    <span
                      v-else
                      class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200"
                    >
                      과탐 유지
                    </span>
                  </td>
                  <td class="p-3">
                    <div class="flex flex-wrap gap-1">
                      <span
                        v-for="soc in s.socialSubjectsList"
                        :key="soc"
                        class="px-1.5 py-0.2 rounded-md bg-orange-100 text-orange-900 font-bold text-[10px]"
                      >
                        {{ soc }}
                      </span>
                      <span v-if="s.socialSubjectsList.length === 0" class="text-[10px] text-slate-400">
                        -
                      </span>
                    </div>
                  </td>
                </tr>
                <tr v-if="filteredCohortStudents.length === 0">
                  <td colspan="8" class="p-6 text-center text-slate-400 text-xs">
                    조건에 해당하는 학생이 없습니다.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 탐구 과목별 응시자 수 & 평균 등급 상세 그리드 (인포그래픽 막대 그래프 & 차트) -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 사회탐구 과목별 현황 -->
        <div class="bg-slate-50/70 rounded-3xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h4 class="text-sm font-black text-slate-900 m-0 flex items-center gap-1.5">
                  <span>📚</span>
                  <span>사회탐구 과목별 응시자 수 & 평균 등급</span>
                </h4>
                <p class="text-[11px] text-slate-500 m-0">사회·문화와 생활과 윤리로 쏠림 현상 뚜렷</p>
              </div>
              <div class="flex items-center gap-1.5">
                <!-- 정렬 기준 토글 -->
                <div class="inline-flex rounded-xl bg-slate-200/80 p-0.5 text-[10px]">
                  <button
                    type="button"
                    @click="satamSortMode = 'count'"
                    :class="[
                      'px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer border-none',
                      satamSortMode === 'count' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    ]"
                  >
                    인원순
                  </button>
                  <button
                    type="button"
                    @click="satamSortMode = 'grade'"
                    :class="[
                      'px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer border-none',
                      satamSortMode === 'grade' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    ]"
                  >
                    성적순
                  </button>
                </div>
                <!-- 뷰 모드 토글 -->
                <div class="inline-flex rounded-xl bg-slate-200/80 p-0.5 text-[10px]">
                  <button
                    type="button"
                    @click="satamViewType = 'bars'"
                    :class="[
                      'px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer border-none',
                      satamViewType === 'bars' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    ]"
                  >
                    막대
                  </button>
                  <button
                    type="button"
                    @click="satamViewType = 'chart'"
                    :class="[
                      'px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer border-none',
                      satamViewType === 'chart' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    ]"
                  >
                    차트
                  </button>
                </div>
                <span class="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800">
                  사탐 {{ totalSatamCount }}건
                </span>
              </div>
            </div>

            <!-- 상단 누적 응시 점유율 띠 그래프 (100% Stacked Distribution) -->
            <div class="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-1.5 mb-3.5">
              <div class="flex items-center justify-between text-[11px] font-bold text-slate-600">
                <span class="flex items-center gap-1.5">
                  <span>📊</span>
                  <span>과목별 점유율 띠 그래프</span>
                </span>
                <span v-if="processedSatamList.length >= 2" class="text-slate-400 font-normal">
                  상위 2개({{ processedSatamList[0].name }}·{{ processedSatamList[1].name }}): <strong class="text-emerald-700 font-black">{{ (parseFloat(processedSatamList[0].pct) + parseFloat(processedSatamList[1].pct)).toFixed(1) }}%</strong>
                </span>
              </div>
              <!-- 100% Stacked Segmented Bar -->
              <div class="w-full h-3.5 rounded-full flex overflow-hidden bg-slate-100 border border-slate-200/60 p-0.5 gap-0.5">
                <div
                  v-for="s in processedSatamList"
                  :key="s.name"
                  :style="{ width: s.pct + '%', backgroundColor: s.color || '#15803d' }"
                  class="h-full rounded-full transition-all hover:brightness-110 cursor-pointer"
                  :title="`${s.name}: ${s.count}명 (${s.pct}%)`"
                ></div>
              </div>
              <!-- 하위 레전드 요약 -->
              <div class="flex flex-wrap items-center justify-between pt-0.5 text-[10px] text-slate-500 font-medium">
                <div class="flex flex-wrap items-center gap-2">
                  <span v-for="s in processedSatamList.slice(0, 4)" :key="s.name" class="inline-flex items-center gap-1">
                    <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: s.color || '#15803d' }"></span>
                    <span class="text-slate-700 font-bold">{{ s.name }}</span>
                    <span class="text-slate-400 font-mono">{{ s.pct }}%</span>
                  </span>
                  <span v-if="processedSatamList.length > 4" class="text-slate-400">외 {{ processedSatamList.length - 4 }}과목</span>
                </div>
                <span class="text-slate-400 font-mono text-[9px]">* 마우스 오버 시 과목별 인원 표출</span>
              </div>
            </div>

            <!-- 막대 모드: 과목별 시각적 가로 비례 막대 그래프 리스트 -->
            <div v-if="satamViewType === 'bars'" class="space-y-2 mt-2">
              <div
                v-for="(s, idx) in processedSatamList"
                :key="s.name"
                class="bg-white p-3 rounded-2xl border border-slate-200/90 hover:border-emerald-400 hover:shadow-xs transition-all space-y-2 group"
              >
                <!-- 상단: 순위, 과목명, 뱃지, 응시인원, 평균등급 -->
                <div class="flex items-center justify-between text-xs">
                  <div class="flex items-center gap-2 min-w-0">
                    <span
                      class="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 font-mono"
                      :class="idx < 2 ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600'"
                    >
                      {{ idx + 1 }}
                    </span>
                    <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: s.color }"></span>
                    <span class="font-extrabold text-slate-900 truncate">{{ s.name }}</span>
                    <span v-if="s.count >= 100" class="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                      최다 응시
                    </span>
                  </div>

                  <div class="flex items-center gap-3 shrink-0">
                    <div class="text-right">
                      <span class="text-[10px] text-slate-400 mr-1 hidden sm:inline">응시</span>
                      <span class="font-mono font-black text-slate-900 text-xs sm:text-sm">{{ s.count }}명</span>
                      <span class="text-[10px] font-mono text-slate-400 ml-1">({{ s.pct }}%)</span>
                    </div>
                    <div class="flex items-center gap-1.5 pl-2.5 border-l border-slate-100">
                      <span class="text-[10px] text-slate-400 font-medium">평균</span>
                      <span :class="['px-2 py-0.5 rounded-md text-xs font-black font-mono border shadow-2xs', s.gradeBadgeClass]">
                        {{ s.grade }}등급
                      </span>
                    </div>
                  </div>
                </div>

                <!-- 하단: 시각적 가로 비례 막대 바 (Horizontal Proportional Bar) -->
                <div class="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-700 ease-out"
                    :style="{
                      width: s.barWidth,
                      background: `linear-gradient(90deg, ${s.color}bb 0%, ${s.color} 100%)`
                    }"
                  ></div>
                </div>
              </div>
            </div>

            <!-- 차트 모드: Chart.js Bar Chart -->
            <div v-else class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs h-112.5">
              <Bar :data="satamChartData" :options="satamChartOptions" />
            </div>
          </div>
        </div>

        <!-- 과학탐구 과목별 현황 -->
        <div class="bg-slate-50/70 rounded-3xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h4 class="text-sm font-black text-slate-900 m-0 flex items-center gap-1.5">
                  <span>🔬</span>
                  <span>과학탐구 과목별 응시자 수 & 평균 등급</span>
                </h4>
                <p class="text-[11px] text-slate-500 m-0">생명과학Ⅰ과 지구과학Ⅰ 위주, Ⅱ과목은 극소수</p>
              </div>
              <div class="flex items-center gap-1.5">
                <!-- 정렬 기준 토글 -->
                <div class="inline-flex rounded-xl bg-slate-200/80 p-0.5 text-[10px]">
                  <button
                    type="button"
                    @click="gwatamSortMode = 'count'"
                    :class="[
                      'px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer border-none',
                      gwatamSortMode === 'count' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    ]"
                  >
                    인원순
                  </button>
                  <button
                    type="button"
                    @click="gwatamSortMode = 'grade'"
                    :class="[
                      'px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer border-none',
                      gwatamSortMode === 'grade' ? 'bg-white text-indigo-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    ]"
                  >
                    성적순
                  </button>
                </div>
                <!-- 뷰 모드 토글 -->
                <div class="inline-flex rounded-xl bg-slate-200/80 p-0.5 text-[10px]">
                  <button
                    type="button"
                    @click="gwatamViewType = 'bars'"
                    :class="[
                      'px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer border-none',
                      gwatamViewType === 'bars' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    ]"
                  >
                    막대
                  </button>
                  <button
                    type="button"
                    @click="gwatamViewType = 'chart'"
                    :class="[
                      'px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer border-none',
                      gwatamViewType === 'chart' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    ]"
                  >
                    차트
                  </button>
                </div>
                <span class="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-sky-100 text-sky-800">
                  과탐 {{ totalGwatamCount }}건
                </span>
              </div>
            </div>

            <!-- 상단 누적 응시 점유율 띠 그래프 (100% Stacked Distribution) -->
            <div class="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-1.5 mb-3.5">
              <div class="flex items-center justify-between text-[11px] font-bold text-slate-600">
                <span class="flex items-center gap-1.5">
                  <span>📊</span>
                  <span>과목별 점유율 띠 그래프</span>
                </span>
                <span v-if="processedGwatamList.length >= 2" class="text-slate-400 font-normal">
                  상위 2개({{ processedGwatamList[0].name }}·{{ processedGwatamList[1].name }}): <strong class="text-indigo-700 font-black">{{ (parseFloat(processedGwatamList[0].pct) + parseFloat(processedGwatamList[1].pct)).toFixed(1) }}%</strong>
                </span>
              </div>
              <!-- 100% Stacked Segmented Bar -->
              <div class="w-full h-3.5 rounded-full flex overflow-hidden bg-slate-100 border border-slate-200/60 p-0.5 gap-0.5">
                <div
                  v-for="q in processedGwatamList"
                  :key="q.name"
                  :style="{ width: q.pct + '%', backgroundColor: q.color || '#9333ea' }"
                  class="h-full rounded-full transition-all hover:brightness-110 cursor-pointer"
                  :title="`${q.name}: ${q.count}명 (${q.pct}%)`"
                ></div>
              </div>
              <!-- 하위 레전드 요약 -->
              <div class="flex flex-wrap items-center justify-between pt-0.5 text-[10px] text-slate-500 font-medium">
                <div class="flex flex-wrap items-center gap-2">
                  <span v-for="q in processedGwatamList.slice(0, 4)" :key="q.name" class="inline-flex items-center gap-1">
                    <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: q.color || '#9333ea' }"></span>
                    <span class="text-slate-700 font-bold">{{ q.name }}</span>
                    <span class="text-slate-400 font-mono">{{ q.pct }}%</span>
                  </span>
                  <span v-if="processedGwatamList.length > 4" class="text-slate-400">외 {{ processedGwatamList.length - 4 }}과목</span>
                </div>
                <span class="text-slate-400 font-mono text-[9px]">* 마우스 오버 시 과목별 인원 표출</span>
              </div>
            </div>

            <!-- 막대 모드: 과목별 시각적 가로 비례 막대 그래프 리스트 -->
            <div v-if="gwatamViewType === 'bars'" class="space-y-2 mt-2">
              <div
                v-for="(q, idx) in processedGwatamList"
                :key="q.name"
                class="bg-white p-3 rounded-2xl border border-slate-200/90 hover:border-indigo-400 hover:shadow-xs transition-all space-y-2 group"
              >
                <!-- 상단: 순위, 과목명, 뱃지, 응시인원, 평균등급 -->
                <div class="flex items-center justify-between text-xs">
                  <div class="flex items-center gap-2 min-w-0">
                    <span
                      class="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 font-mono"
                      :class="idx < 2 ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600'"
                    >
                      {{ idx + 1 }}
                    </span>
                    <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: q.color }"></span>
                    <span class="font-extrabold text-slate-900 truncate">{{ q.name }}</span>
                    <span v-if="q.count >= 30" class="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-900 border border-indigo-200 shrink-0">
                      주력 응시
                    </span>
                  </div>

                  <div class="flex items-center gap-3 shrink-0">
                    <div class="text-right">
                      <span class="text-[10px] text-slate-400 mr-1 hidden sm:inline">응시</span>
                      <span class="font-mono font-black text-slate-900 text-xs sm:text-sm">{{ q.count }}명</span>
                      <span class="text-[10px] font-mono text-slate-400 ml-1">({{ q.pct }}%)</span>
                    </div>
                    <div class="flex items-center gap-1.5 pl-2.5 border-l border-slate-100">
                      <span class="text-[10px] text-slate-400 font-medium">평균</span>
                      <span :class="['px-2 py-0.5 rounded-md text-xs font-black font-mono border shadow-2xs', q.gradeBadgeClass]">
                        {{ q.grade }}등급
                      </span>
                    </div>
                  </div>
                </div>

                <!-- 하단: 시각적 가로 비례 막대 바 (Horizontal Proportional Bar) -->
                <div class="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-700 ease-out"
                    :style="{
                      width: q.barWidth,
                      background: `linear-gradient(90deg, ${q.color}bb 0%, ${q.color} 100%)`
                    }"
                  ></div>
                </div>
              </div>
            </div>

            <!-- 차트 모드: Chart.js Bar Chart -->
            <div v-else class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs h-112.5">
              <Bar :data="gwatamChartData" :options="gwatamChartOptions" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content 3: 수능 최저 충족 실질 경쟁률 분석 & 공교육 역전 전략 -->
    <div id="sec-minScoreMagic" class="mt-14 pt-8 border-t-2 border-slate-200/90 space-y-6 scroll-mt-24">
      <!-- Section 3 Header Badge -->
      <div class="flex items-center justify-between pb-1">
        <div class="flex items-center gap-2">
          <span class="flex items-center justify-center w-7 h-7 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-black border border-indigo-200">3</span>
          <h3 class="text-base sm:text-lg font-black text-slate-900 m-0">수능최저 충족 실질 경쟁률</h3>
        </div>
        <span class="text-xs text-slate-400 font-medium hidden sm:inline">실질 경쟁률 하락 효과 & 성적대별 전략</span>
      </div>
      <!-- 1. Hero Banner: 공교육 가치 중심 헤더 -->
      <div class="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg relative overflow-hidden">
        <div class="relative z-10">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-cyan-300 border border-cyan-400/30">
              <span>🎯</span>
              <span>수능 최저 충족 실질 경쟁률 분석 & 공교육 역전 전략</span>
            </div>
            <div class="flex items-center gap-2 text-xs">
              <span v-if="csatPassRateTable && csatPassRateTable.length > 0" class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-semibold">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> '수능최저충족률' 시트 실데이터 연동됨
              </span>
              <span v-else class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 font-semibold">
                <span class="w-2 h-2 rounded-full bg-blue-400"></span> 표준 벤치마크 및 시트 가동
              </span>
            </div>
          </div>
          <h3 class="text-xl sm:text-2xl font-black tracking-tight m-0 text-white">
            "수능 최저를 맞추는 순간, 실질 경쟁률이 {{ schoolMinScoreStats.avgInitialRate }}:1에서 {{ schoolMinScoreStats.avgRealRate }}:1로 급락하는 마법"
          </h3>
          <p class="text-xs text-slate-300 mt-2.5 leading-relaxed max-w-3xl">
            우리 학교 수능최저 지원 <strong>{{ schoolMinScoreStats.totalMinApps }}건</strong> 실측 통계 분석 결과, 
            최초 외형 경쟁률은 평균 <strong>{{ schoolMinScoreStats.avgInitialRate }}:1</strong>(교과 {{ schoolMinScoreStats.gpaInitialRate }}:1)이지만, 
            <strong>수능 최저를 충족하는 순간 실질 경쟁률은 {{ schoolMinScoreStats.avgRealRate }}:1(교과 {{ schoolMinScoreStats.gpaRealRate }}:1, 충원율 반영 시 체감 {{ schoolMinScoreStats.avgEffectiveRate }}:1)</strong>로 대폭 급락합니다. 
            우리 학교 학생들의 수능최저 충족률({{ schoolMinScoreStats.schoolPassRate }}%)을 감안할 때, 최저만 맞추면 경쟁자의 60% 이상이 자동 탈락하여 수도권 및 거점국립대를 뚫는 가장 확실한 기적의 역전 카드입니다.
          </p>
        </div>
      </div>

      <!-- 1-1. 2025학년도 30개 대학 발표 공식 수능최저 충족률 실측 리포트 (전형 유형별 평균) -->
      <div class="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[11px] font-black">2025학년도 대입 실측</span>
              <h4 class="text-sm sm:text-base font-black text-slate-900 m-0">
                전국 30개 대학 발표 '수능최저충족률' 공식 실측 통계
              </h4>
            </div>
            <p class="text-xs text-slate-500 mt-1 m-0">
              수능최저는 단순 자격 기준이 아니라 실제 경쟁률을 1/2에서 최대 1/11 수준으로 떨어뜨리는 최대 승부처입니다.
            </p>
          </div>
          <span class="text-xs font-bold text-slate-400 font-mono self-start sm:self-auto">
            기준: 2025 대입 30개 대학 공식 발표치
          </span>
        </div>

        <!-- 3개 전형 유형별 공식 충족률 카드 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- 교과 -->
          <div class="p-4 rounded-2xl bg-linear-to-br from-blue-50/70 to-indigo-50/40 border border-blue-100 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black text-blue-900 flex items-center gap-1.5">
                <span>📘</span>
                <span>학생부교과전형 (26개 대학)</span>
              </span>
              <span class="px-2 py-0.5 rounded-md bg-blue-200/70 text-blue-800 text-[10px] font-bold">
                129,582명 분석
              </span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-3xl font-black text-blue-700 font-mono">58.1%</span>
              <span class="text-xs text-slate-500 font-semibold">(41.9% 자동 탈락)</span>
            </div>
            <div class="text-[11px] text-slate-600 leading-relaxed">
              최고 <strong>80.7%</strong>(성신여대) ~ 최저 <strong>32.8%</strong>(동국대 WISE).<br>
              지원자 10명 중 4명 이상이 최저 미달로 서류/내신 상관없이 자동 불합격합니다.
            </div>
          </div>

          <!-- 종합 -->
          <div class="p-4 rounded-2xl bg-linear-to-br from-emerald-50/70 to-teal-50/40 border border-emerald-100 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                <span>📗</span>
                <span>학생부종합전형 (8개 대학)</span>
              </span>
              <span class="px-2 py-0.5 rounded-md bg-emerald-200/70 text-emerald-800 text-[10px] font-bold">
                40,808명 분석
              </span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-3xl font-black text-emerald-700 font-mono">47.2%</span>
              <span class="text-xs text-slate-500 font-semibold">(52.8% 과반 탈락)</span>
            </div>
            <div class="text-[11px] text-slate-600 leading-relaxed">
              최고 <strong>66.0%</strong>(한양대) ~ 최저 <strong>33.6%</strong>(강원대).<br>
              지원자의 절반 이상이 서류 평가 전 최저에서 걸러져 충족 시 합격권에 진입합니다.
            </div>
          </div>

          <!-- 논술 -->
          <div class="p-4 rounded-2xl bg-linear-to-br from-purple-50/70 to-fuchsia-50/40 border border-purple-100 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black text-purple-900 flex items-center gap-1.5">
                <span>📕</span>
                <span>논술전형 (18개 대학)</span>
              </span>
              <span class="px-2 py-0.5 rounded-md bg-purple-200/70 text-purple-800 text-[10px] font-bold">
                239,542명 분석
              </span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-3xl font-black text-purple-700 font-mono">34.2%</span>
              <span class="text-xs text-slate-500 font-semibold">(65.8% 허수 탈락)</span>
            </div>
            <div class="text-[11px] text-slate-600 leading-relaxed">
              최저 <strong>22.1%</strong>(고려대) ~ 최고 <strong>61.1%</strong>(성신여대).<br>
              <strong>3명 중 2명이 허수!</strong> 실질경쟁률이 1/3~1/11 토막 납니다.
            </div>
          </div>
        </div>

        <!-- 4대 기적의 실증 팩트 배너 (경희대 한의예, 동국대 WISE 0%, 고대 논술, 한양대 0.18등급 하락) -->
        <div class="pt-3 border-t border-slate-100">
          <div class="text-xs font-black text-slate-800 mb-2 flex items-center gap-1.5">
            <span>⚡</span>
            <span>2025 입결 분석이 증명한 4대 기적의 실증 팩트</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div 
              v-for="(fact, fIdx) in officialSummary.miracleHighlights" 
              :key="fIdx"
              class="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-indigo-50/40 hover:border-indigo-200 transition-colors"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="font-extrabold text-slate-900 text-xs">{{ fact.univ }}</span>
                <span class="px-1.5 py-0.2 rounded text-[10px] font-black bg-rose-100 text-rose-700">{{ fact.badge }}</span>
              </div>
              <div class="text-[11px] font-semibold text-indigo-700 mb-1">{{ fact.dept }}</div>
              <p class="text-[10px] text-slate-600 leading-relaxed m-0">
                {{ fact.desc }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. 등급대별 맞춤 필터 바 (공교육 핵심 4~6등급 우선 배치) -->
      <div class="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs font-black text-slate-800 mr-1 flex items-center gap-1">
            <span>🎯</span>
            <span>성적대별 전략 구간:</span>
          </span>
          <button
            type="button"
            @click="selectedMagicBand = '4_6'"
            :class="[
              'px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-xs',
              selectedMagicBand === '4_6'
                ? 'bg-rose-600 text-white ring-2 ring-rose-400 ring-offset-1'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            ]"
          >
            <span>🔥</span>
            <span>4~6등급: 기적의 역전존 (수도권 교과·거점국립대)</span>
          </button>
          <button
            type="button"
            @click="selectedMagicBand = '3_4'"
            :class="[
              'px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-xs',
              selectedMagicBand === '3_4'
                ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 ring-offset-1'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
            ]"
          >
            <span>🏛️</span>
            <span>3~4등급: 수도권·지거국 안정</span>
          </button>
          <button
            type="button"
            @click="selectedMagicBand = '1_2'"
            :class="[
              'px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-xs',
              selectedMagicBand === '1_2'
                ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-1'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            ]"
          >
            <span>👑</span>
            <span>1~2등급: 인서울·메디컬 승부</span>
          </button>
          <button
            type="button"
            @click="selectedMagicBand = 'essay'"
            :class="[
              'px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-xs',
              selectedMagicBand === 'essay'
                ? 'bg-purple-600 text-white ring-2 ring-purple-400 ring-offset-1'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
            ]"
          >
            <span>✍️</span>
            <span>논술전형: 경쟁률 1/11 토막 (경희대·고대·중대 등)</span>
          </button>
          <button
            type="button"
            @click="selectedMagicBand = 'all'"
            :class="[
              'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
              selectedMagicBand === 'all'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            ]"
          >
            전체 보기
          </button>
        </div>

        <div class="relative w-full md:w-64">
          <input
            type="text"
            v-model="magicSearchQuery"
            placeholder="대학명, 전형, 최저기준 검색..."
            class="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:outline-hidden font-medium"
          />
          <span class="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
        </div>
      </div>

      <!-- 3. 실증 분석 요약 카드 3종 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Metric 1: 외형 vs 실질 경쟁률 평균 완화 -->
        <div class="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs">
          <div class="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
            <span>📉 우리학교 실질 경쟁률 완화 폭</span>
            <span class="text-indigo-600 font-mono font-black text-xs">{{ schoolMinScoreStats.easeFactor }}배 완화</span>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-black text-slate-900 font-mono">{{ schoolMinScoreStats.avgRealRate }}:1</span>
            <span class="text-xs text-slate-500 line-through">최초 {{ schoolMinScoreStats.avgInitialRate }}:1</span>
            <span class="text-[11px] font-bold text-emerald-600">(체감 {{ schoolMinScoreStats.avgEffectiveRate }}:1)</span>
          </div>
          <p class="text-[11px] text-slate-600 mt-2 mb-0 leading-relaxed">
            우리 학교 수능최저 지원 {{ schoolMinScoreStats.totalMinApps }}건 분석: 최저 충족률(평균 {{ schoolMinScoreStats.avgPassRate }}%) 및 충원율 반영 시 최초 {{ schoolMinScoreStats.avgInitialRate }}명 경쟁이 <strong>{{ schoolMinScoreStats.avgRealRate }}명 실질 경쟁</strong>(체감 {{ schoolMinScoreStats.avgEffectiveRate }}:1)으로 급감합니다.
          </p>
        </div>

        <!-- Metric 2: 4~5등급 선배 실제 합격률 격차 -->
        <div class="bg-linear-to-br from-rose-50 to-orange-50 rounded-3xl p-5 border border-rose-200/80 shadow-2xs">
          <div class="flex items-center justify-between text-xs font-bold text-rose-800 mb-2">
            <span>🏆 4~5등급 선배 최저 합격 실증</span>
            <span class="px-2 py-0.5 rounded-full bg-rose-200 text-rose-800 font-bold text-[10px]">+35.3%p 우위</span>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-black text-rose-700 font-mono">58.7%</span>
            <span class="text-xs text-slate-500 font-medium">(최저 미반영: 23.4%)</span>
          </div>
          <p class="text-[11px] text-rose-900 mt-2 mb-0 leading-relaxed">
            과거 2개년 데이터 분석 결과, 4등급대라도 <strong>최저를 충족한 교과 전형의 합격률이 2.5배 높게</strong> 나타났습니다.
          </p>
        </div>

        <!-- Metric 3: 해당 학년도 우리 학생 수혜 현황 -->
        <div class="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs">
          <div class="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
            <span>🚀 {{ academicYearLabel }} 우리 학생 최저 도전 현황</span>
            <span class="text-emerald-700 font-mono font-black text-xs">4등급 이하 대상</span>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-black text-emerald-600 font-mono">{{ statsForGrade4to6.minRatio }}%</span>
            <span class="text-xs text-slate-500">({{ statsForGrade4to6.minCards }}건 / {{ statsForGrade4to6.totalCards }}건)</span>
          </div>
          <p class="text-[11px] text-slate-600 mt-2 mb-0 leading-relaxed">
            현재 4등급 이하 학생 수시 지원의 <strong>3건 중 1건 이상이 최저 전형</strong>입니다. 영어/사탐 1과목 3~4등급 확보가 핵심 승부처입니다.
          </p>
        </div>
      </div>

      <!-- 4. 실제 대학·전형별 외형 vs 실질 경쟁률 시각화 & 인터랙티브 분석 -->
      <div class="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
        <!-- Top Header & View Mode Switcher -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h4 class="text-sm font-black text-slate-900 m-0 flex items-center gap-2">
              <span>📊</span>
              <span>대학·전형별 실질 경쟁률 시각화 분석 (수능최저충족률 & 충원율 융합)</span>
              <span class="text-[11px] font-normal text-slate-500">({{ activePassRateList.length }}개 전형)</span>
            </h4>
            <p class="text-[11px] text-slate-500 m-0 mt-0.5">
              외형 경쟁률 → 최저 통과 실질 경쟁률 → 충원 반영 체감 경쟁률의 급락세를 그래프로 확인하고, 호버/클릭하여 상세 정량 분해를 확인하세요.
            </p>
          </div>

          <!-- View Mode Switcher -->
          <div class="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200/80 text-xs shrink-0 self-start sm:self-auto">
            <button
              type="button"
              @click="magicDisplayMode = 'cards'"
              :class="[
                'px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer',
                magicDisplayMode === 'cards'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              ]"
            >
              <span>🎴</span>
              <span>비주얼 카드 뷰</span>
            </button>
            <button
              type="button"
              @click="magicDisplayMode = 'chart'"
              :class="[
                'px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer',
                magicDisplayMode === 'chart'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              ]"
            >
              <span>📊</span>
              <span>3단 비교 차트</span>
            </button>
            <button
              type="button"
              @click="magicDisplayMode = 'table'"
              :class="[
                'px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer',
                magicDisplayMode === 'table'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              ]"
            >
              <span>📋</span>
              <span>정밀 데이터 표</span>
            </button>
          </div>
        </div>

        <!-- 1) 비주얼 그래프 카드 뷰 (기본값) -->
        <div v-if="magicDisplayMode === 'cards'" class="space-y-3">
          <div v-if="activePassRateList.length === 0" class="p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
            선택하신 조건에 일치하는 대학·전형 데이터가 없습니다.
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div 
              v-for="(item, idx) in activePassRateList" 
              :key="idx"
              class="group relative bg-white rounded-2xl p-4.5 border border-slate-200/90 hover:border-indigo-400 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
              @click="openMagicModal(item)"
            >
              <!-- Card Top -->
              <div>
                <div class="flex items-center justify-between gap-1.5 mb-2">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span v-if="item.targetGradeBand === '4_6'" class="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-black">🔥 4~6등급 기적</span>
                    <span v-else-if="item.targetGradeBand === '3_4'" class="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-bold">🏛️ 3~4등급 안정</span>
                    <span v-else-if="item.targetGradeBand === 'essay'" class="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-black">✍️ 논술 1/11토막</span>
                    <span v-else class="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">👑 1~2등급 승부</span>
                    
                    <span v-if="item.isAllPass" class="px-2 py-0.5 rounded-md bg-amber-400 text-amber-950 text-[10px] font-black animate-pulse">
                      ⚡ 전원합격권
                    </span>
                  </div>
                  <span class="text-[10px] font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    {{ item.dropTimes }}배 완화
                  </span>
                </div>

                <div class="mb-3">
                  <div class="flex items-center justify-between">
                    <h5 class="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors m-0">
                      {{ item.univName }}
                    </h5>
                    <span class="text-[11px] font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      상세 분석 ↗
                    </span>
                  </div>
                  <div class="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span class="font-medium text-slate-700">{{ item.admissionType }}</span>
                    <span class="text-slate-300">•</span>
                    <span>{{ item.dept }}</span>
                  </div>
                  <div class="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 text-[11px] font-medium border border-slate-200/80">
                    <span class="text-slate-400 font-bold">최저:</span>
                    <span class="text-slate-900 font-bold">{{ item.minScoreText }}</span>
                  </div>
                </div>

                <!-- 3단 가로 비교 그래프 (Visual Triple Progress Bar) -->
                <div class="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-2.5 my-2">
                  <!-- ① 최초 외형 경쟁률 -->
                  <div>
                    <div class="flex items-center justify-between text-[11px] mb-1">
                      <span class="text-slate-500 font-medium flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        <span>최초 외형 경쟁률</span>
                      </span>
                      <span class="font-mono font-bold text-slate-600">{{ item.initialRate }}:1</span>
                    </div>
                    <div class="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div class="h-full bg-slate-400 rounded-full" style="width: 100%"></div>
                    </div>
                  </div>

                  <!-- ② 최저 통과 실질 경쟁률 -->
                  <div>
                    <div class="flex items-center justify-between text-[11px] mb-1">
                      <span class="text-indigo-700 font-bold flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                        <span>수능최저 통과 실질</span>
                        <span class="text-[10px] text-indigo-500 font-normal">({{ item.passRate }}% 충족)</span>
                      </span>
                      <span class="font-mono font-black text-indigo-700">{{ item.realRate }}:1</span>
                    </div>
                    <div class="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div 
                        class="h-full bg-linear-to-r from-indigo-500 to-blue-600 rounded-full transition-all duration-500"
                        :style="{ width: Math.min(100, Math.max(12, (item.realRate / item.initialRate) * 100)) + '%' }"
                      ></div>
                    </div>
                  </div>

                  <!-- ③ 최종 체감 경쟁률 -->
                  <div>
                    <div class="flex items-center justify-between text-[11px] mb-1">
                      <span class="text-emerald-700 font-bold flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        <span>추합 감안 최종 체감</span>
                        <span class="text-[10px] text-emerald-600 font-normal">(충원 {{ item.fillRate }}%)</span>
                      </span>
                      <span :class="['font-mono font-black text-xs px-1.5 py-0.2 rounded', item.isAllPass ? 'bg-amber-100 text-amber-800' : 'text-emerald-700']">
                        {{ item.effectiveRate }}:1
                      </span>
                    </div>
                    <div class="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                      <div 
                        :class="[
                          'h-full rounded-full transition-all duration-500',
                          item.isAllPass 
                            ? 'bg-linear-to-r from-amber-400 to-orange-500' 
                            : 'bg-linear-to-r from-emerald-500 to-teal-500'
                        ]"
                        :style="{ width: Math.min(100, Math.max(8, (item.effectiveRate / item.initialRate) * 100)) + '%' }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Card Bottom -->
              <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span class="truncate max-w-52.5">{{ item.note }}</span>
                <span class="text-indigo-600 font-bold text-[10px] shrink-0 ml-1">호버/클릭 상세 ➔</span>
              </div>

              <!-- Hover Tooltip Popover (Desktop) -->
              <div class="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3 bg-slate-900/95 text-white rounded-xl shadow-xl text-xs opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-30 hidden sm:block">
                <div class="font-black text-amber-300 flex items-center justify-between mb-1.5">
                  <span>💡 {{ item.univName }} 실질 분석</span>
                  <span class="text-[10px] text-cyan-300 font-mono">{{ item.dropTimes }}배 완화</span>
                </div>
                <p class="text-[11px] text-slate-200 mb-2 leading-relaxed">
                  {{ item.note }}
                </p>
                <div class="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-800 text-[10px]">
                  <div>최저 미충족 탈락: <span class="font-bold text-rose-300 font-mono">{{ (100 - item.passRate).toFixed(1) }}%</span></div>
                  <div>추가 합격 회전: <span class="font-bold text-emerald-300 font-mono">{{ item.fillRate }}%</span></div>
                </div>
                <div class="mt-2 text-center text-[10px] text-slate-400 font-medium">
                  👆 클릭 시 정량 계산식 & 상세 모달 오픈
                </div>
                <div class="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 2) 3단 종합 비교 차트 뷰 -->
        <div v-else-if="magicDisplayMode === 'chart'" class="space-y-3">
          <div class="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>💡 막대를 클릭하시면 해당 대학·전형의 상세 정량 분석 모달이 열립니다.</span>
            <span class="font-mono text-[11px]">X축: 경쟁률 (:1)</span>
          </div>
          <div :style="{ height: Math.max(380, activePassRateList.length * 42) + 'px' }" class="w-full">
            <Bar :data="magicChartData" :options="magicChartOptions" />
          </div>
        </div>

        <!-- 3) 정밀 데이터 표 뷰 -->
        <div v-else class="overflow-x-auto">
          <table class="w-full text-xs text-left border-collapse">
            <thead>
              <tr class="bg-slate-100/80 text-slate-700 font-bold border-y border-slate-200">
                <th class="p-3">대학명</th>
                <th class="p-3">전형명</th>
                <th class="p-3">모집단위</th>
                <th class="p-3">수능최저기준</th>
                <th class="p-3 text-center">최초 외형</th>
                <th class="p-3 text-center">최저 충족률</th>
                <th class="p-3 text-center">실질 경쟁률</th>
                <th class="p-3 text-center">충원율</th>
                <th class="p-3 text-center">최종 체감 경쟁률</th>
                <th class="p-3 text-center">분석</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium">
              <tr 
                v-for="(item, idx) in activePassRateList" 
                :key="idx"
                :class="[
                  item.isAllPass ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-slate-50/80',
                  'transition-colors cursor-pointer'
                ]"
                @click="openMagicModal(item)"
              >
                <!-- 대학명 -->
                <td class="p-3 font-bold text-slate-900 whitespace-nowrap">
                  <div class="flex items-center gap-1.5">
                    <span v-if="item.targetGradeBand === '4_6'" class="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-black">4~6등급</span>
                    <span v-else-if="item.targetGradeBand === '3_4'" class="px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-bold">3~4등급</span>
                    <span v-else-if="item.targetGradeBand === 'essay'" class="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-black">논술</span>
                    <span v-else class="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">1~2등급</span>
                    <span>{{ item.univName }}</span>
                  </div>
                </td>
                <!-- 전형명 -->
                <td class="p-3 text-slate-700 whitespace-nowrap">{{ item.admissionType }}</td>
                <!-- 모집단위 -->
                <td class="p-3 text-slate-500 whitespace-nowrap text-[11px]">{{ item.dept }}</td>
                <!-- 수능최저기준 -->
                <td class="p-3 font-semibold text-slate-800 whitespace-nowrap">
                  <span class="inline-block px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px]">
                    {{ item.minScoreText }}
                  </span>
                </td>
                <!-- 최초 외형 경쟁률 -->
                <td class="p-3 text-center font-mono font-bold text-slate-500 whitespace-nowrap">
                  {{ item.initialRate }}:1
                </td>
                <!-- 최저 충족률 -->
                <td class="p-3 text-center font-mono font-bold text-emerald-700 whitespace-nowrap">
                  {{ item.passRate }}%
                </td>
                <!-- 실질 경쟁률 -->
                <td class="p-3 text-center font-mono font-bold text-indigo-700 whitespace-nowrap">
                  {{ item.realRate }}:1
                </td>
                <!-- 충원율 -->
                <td class="p-3 text-center font-mono text-slate-600 whitespace-nowrap">
                  {{ item.fillRate }}%
                </td>
                <!-- 최종 체감 경쟁률 -->
                <td class="p-3 text-center whitespace-nowrap">
                  <div class="flex flex-col items-center gap-0.5">
                    <span 
                      :class="[
                        'px-2.5 py-1 rounded-xl font-mono font-black text-xs shadow-2xs',
                        item.isAllPass 
                          ? 'bg-amber-500 text-white ring-2 ring-amber-300' 
                          : Number(item.effectiveRate) <= 1.5
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-600 text-white'
                      ]"
                    >
                      {{ item.effectiveRate }}:1
                    </span>
                    <span v-if="item.isAllPass" class="text-[10px] font-bold text-amber-700">
                      ⚡ 사실상 전원합격
                    </span>
                  </div>
                </td>
                <!-- 상세 버튼 -->
                <td class="p-3 text-center whitespace-nowrap">
                  <button
                    type="button"
                    @click.stop="openMagicModal(item)"
                    class="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold border border-indigo-200 transition-colors"
                  >
                    상세 ↗
                  </button>
                </td>
              </tr>
              <tr v-if="activePassRateList.length === 0">
                <td colspan="10" class="p-8 text-center text-slate-400">
                  선택하신 조건에 일치하는 대학·전형 데이터가 없습니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- [상세 분석 모달] 대학·전형별 3단 정량 분해 팝업 -->
      <Teleport to="body">
        <div 
          v-if="selectedModalItem" 
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          @click.self="closeMagicModal"
        >
          <div class="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-5">
            <!-- Modal Header -->
            <div class="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div class="flex items-center gap-2 mb-1.5">
                  <span v-if="selectedModalItem.targetGradeBand === '4_6'" class="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-xs font-black">🔥 4~6등급 기적의 역전존</span>
                  <span v-else-if="selectedModalItem.targetGradeBand === '3_4'" class="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-xs font-bold">🏛️ 3~4등급 안정권</span>
                  <span v-else-if="selectedModalItem.targetGradeBand === 'essay'" class="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-xs font-black">✍️ 논술 실질경쟁률 급락</span>
                  <span v-else class="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-xs font-bold">👑 1~2등급 최상위</span>
                  <span class="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    실질 경쟁률 {{ selectedModalItem.dropTimes }}배 완화
                  </span>
                </div>
                <h3 class="text-xl font-black text-slate-900 m-0">
                  {{ selectedModalItem.univName }}
                </h3>
                <p class="text-xs text-slate-500 m-0 mt-0.5">
                  {{ selectedModalItem.admissionType }} · {{ selectedModalItem.dept }}
                </p>
              </div>
              <button 
                type="button" 
                @click="closeMagicModal" 
                class="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <!-- 1. 3단 경쟁률 급락 시각화 카드 -->
            <div class="grid grid-cols-3 gap-2.5 p-4 rounded-2xl bg-linear-to-r from-slate-50 via-indigo-50/40 to-emerald-50/50 border border-slate-200">
              <div class="text-center">
                <span class="text-[11px] text-slate-500 block font-medium">① 최초 외형</span>
                <span class="text-2xl font-black text-slate-400 font-mono mt-0.5 block">{{ selectedModalItem.initialRate }}:1</span>
                <span class="text-[10px] text-slate-400">지원자 전체</span>
              </div>
              <div class="text-center border-x border-slate-200">
                <span class="text-[11px] text-indigo-700 block font-bold">② 최저 통과</span>
                <span class="text-2xl font-black text-indigo-700 font-mono mt-0.5 block">{{ selectedModalItem.realRate }}:1</span>
                <span class="text-[10px] text-indigo-600 font-semibold">{{ selectedModalItem.passRate }}% 충족</span>
              </div>
              <div class="text-center">
                <span class="text-[11px] text-emerald-700 block font-bold">③ 최종 체감</span>
                <span class="text-2xl font-black text-emerald-600 font-mono mt-0.5 block">{{ selectedModalItem.effectiveRate }}:1</span>
                <span class="text-[10px] text-emerald-600 font-semibold">충원율 {{ selectedModalItem.fillRate }}%</span>
              </div>
            </div>

            <!-- 2. 모집 정원 10명 기준 정량 시뮬레이션 계산 분해 -->
            <div class="rounded-2xl border border-slate-200 overflow-hidden">
              <div class="p-3 bg-slate-100/70 border-b border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>🧮 모집 정원 10명 기준 실질 경쟁 분해표</span>
                <span class="text-[11px] font-mono text-indigo-700">체감경쟁률 산출 공식</span>
              </div>
              <div class="p-3.5 text-xs space-y-2 font-medium">
                <div v-if="selectedModalItem.applicantCount" class="flex justify-between items-center py-1.5 bg-amber-50/80 px-2.5 rounded-xl text-amber-950 font-bold border border-amber-200/70">
                  <span class="flex items-center gap-1"><span>🏛️</span><span>2025 공식 발표 실측 인원</span></span>
                  <span class="font-mono text-xs text-amber-900">지원 {{ selectedModalItem.applicantCount.toLocaleString() }}명 중 {{ selectedModalItem.passCount.toLocaleString() }}명 충족 ({{ selectedModalItem.passRate }}%)</span>
                </div>
                <div class="flex justify-between items-center py-1 border-b border-slate-100">
                  <span class="text-slate-600">1. 최초 접수 지원자 수</span>
                  <span class="font-bold text-slate-800 font-mono">{{ Math.round(selectedModalItem.initialRate * 10) }}명</span>
                </div>
                <div class="flex justify-between items-center py-1 border-b border-slate-100">
                  <span class="text-rose-600 font-bold">2. 수능최저 미충족 탈락자 수 ({{ (100 - selectedModalItem.passRate).toFixed(1) }}% 탈락)</span>
                  <span class="font-bold text-rose-600 font-mono">-{{ Math.round(selectedModalItem.initialRate * 10 * (1 - selectedModalItem.passRate / 100)) }}명 자동 탈락</span>
                </div>
                <div class="flex justify-between items-center py-1 border-b border-slate-100">
                  <span class="text-indigo-700 font-bold">3. 실제 최저 통과 유효 경쟁자 수</span>
                  <span class="font-bold text-indigo-700 font-mono">{{ Math.round(selectedModalItem.initialRate * 10 * (selectedModalItem.passRate / 100)) }}명</span>
                </div>
                <div class="flex justify-between items-center py-1 border-b border-slate-100">
                  <span class="text-slate-600">4. 최종 선발 총 인원 (정원 10명 + 충원 {{ Math.round(10 * selectedModalItem.fillRate / 100) }}명)</span>
                  <span class="font-bold text-emerald-700 font-mono">{{ Math.round(10 * (1 + selectedModalItem.fillRate / 100)) }}명 최종 합격</span>
                </div>
                <div class="flex justify-between items-center py-1.5 bg-indigo-50/70 px-2.5 rounded-xl text-indigo-950 font-bold">
                  <span>5. 최종 체감 경쟁률 (합격 확률)</span>
                  <span class="font-mono text-sm text-indigo-700">{{ selectedModalItem.effectiveRate }}:1 (합격률 {{ Math.min(100, Number(((1 / selectedModalItem.effectiveRate) * 100).toFixed(1))) }}%)</span>
                </div>
              </div>
            </div>

            <!-- 3. 수능 최저학력기준 상세 요강 -->
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <div class="font-bold text-slate-800 flex items-center gap-1.5">
                <span>📋</span>
                <span>수능 최저학력기준 공식 요강:</span>
              </div>
              <div class="p-2.5 rounded-xl bg-white border border-slate-200 font-bold text-slate-800">
                {{ selectedModalItem.minScoreText }}
              </div>
            </div>

            <!-- 4. 공교육 코칭 가이드 -->
            <div class="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-950 space-y-1.5 leading-relaxed">
              <div class="font-extrabold flex items-center gap-1.5 text-amber-900">
                <span>🎯</span>
                <span>진학 상담 코칭 팁:</span>
              </div>
              <p class="m-0 text-[11px] text-amber-900/90 leading-relaxed">
                {{ selectedModalItem.note }}
              </p>
            </div>

            <!-- Modal Footer -->
            <div class="pt-2 text-right">
              <button
                type="button"
                @click="closeMagicModal"
                class="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- 5. 공교육 감동 실증: 4등급 이하 선배들의 실제 최저 역전 합격 명예의 전당 -->
      <div class="bg-linear-to-br from-slate-50 via-rose-50/30 to-slate-50 rounded-3xl p-6 border border-rose-200/70 shadow-2xs space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-rose-200/50">
          <div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></span>
              <h4 class="text-sm font-black text-slate-900 m-0">
                🎓 우리 학교 선배들의 실제 '수능최저 역전 합격' 실증 스토리
              </h4>
            </div>
            <p class="text-[11px] text-slate-500 m-0 mt-0.5">
              2025·2026학년도 수시 지원 데이터 중 <strong>내신 4.3~5.2등급 선배들이 완화된 최저를 맞추고 합격한 실제 팩트</strong>입니다.
            </p>
          </div>
          <span class="text-xs font-black text-rose-700 bg-white px-3 py-1 rounded-full border border-rose-200">
            상담 지도용 핵심 근거
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <div 
            v-for="(story, sIdx) in pastSeniorReverseStories" 
            :key="sIdx"
            class="bg-white rounded-2xl p-4 border border-rose-100 shadow-2xs space-y-2 hover:shadow-md transition-shadow"
          >
            <div class="flex items-center justify-between">
              <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">{{ story.year }}학년도 수시</span>
              <span class="text-xs font-black text-rose-600 font-mono">내신 {{ story.grade }}등급</span>
            </div>
            <div>
              <div class="font-extrabold text-slate-900 text-sm">{{ story.univ }}</div>
              <div class="text-[11px] text-slate-500">{{ story.dept }} ({{ story.admission }})</div>
            </div>
            <div class="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] space-y-1">
              <div class="text-slate-600">
                <span class="font-bold text-slate-700">충족 기준:</span> {{ story.minCriteria }}
              </div>
              <div class="flex justify-between items-center text-slate-500 text-[10px]">
                <span>최초 외형: <strong class="text-slate-700 font-mono">{{ story.initialComp }}</strong></span>
                <span>실질 체감: <strong class="text-emerald-700 font-mono font-bold">{{ story.realComp }}</strong></span>
              </div>
            </div>
            <div class="text-right text-xs font-black text-indigo-700 flex items-center justify-end gap-1">
              <span>🎉</span>
              <span>{{ story.result }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 6. 업그레이드된 인터랙티브 3단 시뮬레이터 (최초 경쟁률 + 최저 충족률 + 충원율) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <!-- Controls & Sliders -->
        <div class="lg:col-span-5 bg-slate-50/80 rounded-3xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <h4 class="text-sm font-black text-slate-900 mb-4 flex items-center gap-1.5">
              <span>🎛️</span>
              <span>수능 최저 & 충원율 실질경쟁률 시뮬레이터</span>
            </h4>

            <!-- Slider 1: 최초 경쟁률 -->
            <div class="space-y-1.5 mb-4">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-slate-700">1. 목표 대학 최초 외형 경쟁률</span>
                <span class="font-mono font-black text-blue-700 text-sm">{{ initialCompetition }}:1</span>
              </div>
              <input
                type="range"
                min="3"
                max="25"
                step="0.5"
                v-model.number="initialCompetition"
                class="w-full accent-blue-600 cursor-pointer"
              />
              <div class="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>3:1</span>
                <span>7:1 (수도권 교과)</span>
                <span>15:1</span>
                <span>25:1</span>
              </div>
            </div>

            <!-- Slider 2: 수능 최저 충족 비율 -->
            <div class="space-y-1.5 mb-4">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-slate-700">2. 수능 최저 충족률 (%)</span>
                <span class="font-mono font-black text-emerald-600 text-sm">{{ passRateOfMinScore }}%</span>
              </div>
              <input
                type="range"
                min="15"
                max="65"
                step="5"
                v-model.number="passRateOfMinScore"
                class="w-full accent-emerald-600 cursor-pointer"
              />
              <div class="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>15% (까다로움)</span>
                <span>35% (4~6등급 평균)</span>
                <span>55% (상위권)</span>
              </div>
            </div>

            <!-- Slider 3: 추가합격 충원율 -->
            <div class="space-y-1.5 mb-5">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-slate-700">3. 추가합격 충원율 (%)</span>
                <span class="font-mono font-black text-indigo-700 text-sm">{{ fillRateOfMinScore }}% ({{ (fillRateOfMinScore/100).toFixed(1) }}바퀴)</span>
              </div>
              <input
                type="range"
                min="0"
                max="300"
                step="10"
                v-model.number="fillRateOfMinScore"
                class="w-full accent-indigo-600 cursor-pointer"
              />
              <div class="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0% (추합 없음)</span>
                <span>150% (1.5바퀴)</span>
                <span>300% (3바퀴 대폭발)</span>
              </div>
            </div>
          </div>

          <!-- Quick Scenario Presets (공교육 중심) -->
          <div class="pt-4 border-t border-slate-200">
            <span class="text-[11px] font-bold text-slate-500 block mb-2">실전 시나리오 원클릭 테스트:</span>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                @click="applyPreset(7.0, 35, 160)"
                class="px-2.5 py-1.5 rounded-xl text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer text-left"
              >
                🔥 4~5등급 수도권 교과<br>
                <span class="text-[10px] font-normal text-rose-600 font-mono">7:1 / 최저 35% / 충원 160%</span>
              </button>
              <button
                type="button"
                @click="applyPreset(5.8, 38, 140)"
                class="px-2.5 py-1.5 rounded-xl text-[11px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-all cursor-pointer text-left"
              >
                🏛️ 4~5등급 지거국 교과<br>
                <span class="text-[10px] font-normal text-indigo-600 font-mono">5.8:1 / 최저 38% / 충원 140%</span>
              </button>
              <button
                type="button"
                @click="applyPreset(8.5, 48, 150)"
                class="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 transition-all cursor-pointer text-left"
              >
                📖 3등급 인서울 교과<br>
                <span class="text-[10px] font-normal text-slate-500 font-mono">8.5:1 / 최저 48% / 충원 150%</span>
              </button>
              <button
                type="button"
                @click="applyPreset(10.0, 55, 130)"
                class="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 transition-all cursor-pointer text-left"
              >
                👑 1~2등급 서울 상위권<br>
                <span class="text-[10px] font-normal text-slate-500 font-mono">10:1 / 최저 55% / 충원 130%</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Simulation Result Card -->
        <div class="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <span class="text-xs font-extrabold text-slate-700">시뮬레이션 분석 결과</span>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-black bg-cyan-100 text-cyan-800">
                경쟁률 {{ dropRatio }}배 대폭 완화!
              </span>
            </div>

            <!-- 3단 Comparison Graphic -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
              <!-- 1. 최초 외형 경쟁률 -->
              <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span class="text-[11px] text-slate-500 font-semibold block">최초 지원 외형</span>
                <span class="text-2xl sm:text-3xl font-black text-slate-400 font-mono mt-1 block">
                  {{ initialCompetition }}:1
                </span>
                <span class="text-[10px] text-slate-500 mt-1 block">
                  모집 10명 기준 {{ Math.round(initialCompetition * 10) }}명
                </span>
              </div>

              <!-- 2. 최저 충족 후 실질 경쟁률 -->
              <div class="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200 text-center">
                <span class="text-[11px] text-indigo-700 font-bold block">최저 통과 실질</span>
                <span class="text-2xl sm:text-3xl font-black text-indigo-700 font-mono mt-1 block">
                  {{ realCompetition }}:1
                </span>
                <span class="text-[10px] text-indigo-800 mt-1 block font-semibold">
                  경쟁 인원 {{ realApplicants }}명으로 감소
                </span>
              </div>

              <!-- 3. 추가합격 반영 최종 체감 경쟁률 -->
              <div 
                :class="[
                  'p-3.5 rounded-2xl text-center relative overflow-hidden transition-all',
                  effectiveCompetition <= 1.05 
                    ? 'bg-amber-500 text-white ring-2 ring-amber-300 shadow-md' 
                    : 'bg-emerald-600 text-white'
                ]"
              >
                <div class="text-[11px] font-bold block opacity-90">최종 체감 경쟁률</div>
                <span class="text-2xl sm:text-3xl font-black font-mono mt-1 block">
                  {{ effectiveCompetition }}:1
                </span>
                <span class="text-[10px] mt-1 block font-bold">
                  {{ effectiveCompetition <= 1.05 ? '🔥 사실상 전원합격 펑크' : '매우 높은 합격권 진입' }}
                </span>
              </div>
            </div>

            <!-- Summary Text Box -->
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs text-slate-700 leading-relaxed space-y-1.5">
              <div class="font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>🎯</span>
                <span>공교육 진학 지도 핵심 가이드:</span>
              </div>
              <p class="m-0 text-[11px] leading-relaxed">
                4~6등급 학생이 겉보기 경쟁률 <strong>{{ initialCompetition }}:1</strong>에 겁먹고 수능을 포기하면 안 됩니다. 
                영어 절대평가나 사탐 1과목을 집중 관리하여 최저를 맞추는 순간, 충원합격까지 감안한 실제 체감 경쟁률은 <strong>{{ effectiveCompetition }}:1</strong>로 떨어집니다. 
                <strong>{{ effectiveCompetition <= 1.05 ? '사실상 지원자 전원이 합격하는 수준' : '2명 중 1명 이상이 합격하는 절호의 기회' }}</strong>가 열립니다.
              </p>
            </div>
          </div>

          <!-- Bottom Reference Data -->
          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>2025~2026학년도 실제 수시 통계:</span>
            <span class="font-semibold text-slate-700">4~5등급 최저 반영 전형 합격률 58.7% vs 미반영 23.4%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Content 4: 2027학년도 5대 대입 핵심 전략 카드 -->
    <div id="sec-strategyCards" class="mt-14 pt-8 border-t-2 border-slate-200/90 space-y-4 scroll-mt-24">
      <!-- Section 4 Header Badge -->
      <div class="flex items-center justify-between pb-1">
        <div class="flex items-center gap-2">
          <span class="flex items-center justify-center w-7 h-7 rounded-xl bg-amber-50 text-amber-700 text-sm font-black border border-amber-200">4</span>
          <h3 class="text-base sm:text-lg font-black text-slate-900 m-0">{{ academicYearLabel }} 대입 5대 핵심 전략</h3>
        </div>
        <span class="text-xs text-slate-400 font-medium hidden sm:inline">수시·정시 대비 5대 핵심 가이드</span>
      </div>
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <span>💡</span>
          <span>{{ academicYearLabel }}학년도 수시·정시 대비 5대 핵심 지침</span>
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="card in STRATEGY_CARDS"
          :key="card.num"
          @click="toggleCard(card.num)"
          :class="[
            'p-5 rounded-3xl border transition-all duration-200 cursor-pointer flex flex-col justify-between',
            expandedCard === card.num
              ? 'bg-linear-to-br from-indigo-50/70 to-blue-50/70 border-indigo-300 shadow-md ring-2 ring-indigo-200'
              : 'bg-slate-50/70 hover:bg-white border-slate-200/90 hover:border-slate-300'
          ]"
        >
          <div>
            <div class="flex items-center justify-between mb-2">
              <span
                :class="[
                  'w-7 h-7 rounded-full flex items-center justify-center font-black text-xs',
                  expandedCard === card.num ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                ]"
              >
                {{ card.num }}
              </span>
              <span class="text-[11px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                {{ card.badge }}
              </span>
            </div>

            <h4 class="text-sm font-black text-slate-900 m-0 tracking-tight leading-snug">
              {{ card.title }}
            </h4>
            <p class="text-xs text-slate-600 m-0 mt-1.5 leading-relaxed">
              {{ card.summary }}
            </p>
          </div>

          <!-- Expanded Detail View -->
          <div v-if="expandedCard === card.num" class="mt-4 pt-3 border-t border-indigo-200/60 text-xs space-y-2">
            <div
              v-for="(point, idx) in card.details"
              :key="idx"
              class="flex items-start gap-2 text-slate-700 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-indigo-100"
            >
              <span class="text-indigo-600 font-bold shrink-0">•</span>
              <span>{{ point }}</span>
            </div>
          </div>
          <div v-else class="mt-3 text-[11px] text-slate-400 font-semibold flex items-center justify-end gap-1">
            <span>자세히 보기</span>
            <span>▼</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js'
import { Radar, Bar, Line } from 'vue-chartjs'
import * as XLSX from 'xlsx'
import {
  calculateSatamRunStats,
  parseMockExamWorkbook,
  STANDARD_SCIENCE_SUBJECTS,
  STANDARD_SOCIAL_SUBJECTS,
  normalizeSubject
} from '../utils/satamRunCalculator.js'
import { fetchAndParseKcueMockData, DEFAULT_CSAT_PASS_RATE_BENCHMARK, OFFICIAL_CSAT_PASS_RATE_SUMMARY } from '../../api/statApi.js'
import { schoolName } from '../../utils/schoolConfig'
import { useStatData, maskName } from '../composables/useStatData.js'

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
)

const widgetRootRef = ref(null)
const stickyNavRef = ref(null)
const activeSubTab = ref('radar')
let isClickScrolling = false
let clickScrollTimeout = null
let scrollContainerEl = null
let scrollRafId = null
let sectionObserver = null
let handleScrollEvent = null
let handleUserIntentEvent = null
let handleScrollEndEvent = null

// 상단 세그먼트 버튼 클릭 시 해당 섹션으로 부드럽게 점프
function scrollToTab(tabId) {
  activeSubTab.value = tabId
  isClickScrolling = true
  if (clickScrollTimeout) clearTimeout(clickScrollTimeout)
  clickScrollTimeout = setTimeout(() => {
    isClickScrolling = false
  }, 900)

  const targetEl = document.getElementById(`sec-${tabId}`)
  if (targetEl) {
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// 사용자 직접 스크롤(마우스 휠, 터치) 시 클릭 스크롤 잠금 즉시 해제
function handleUserScrollIntent() {
  if (isClickScrolling) {
    isClickScrolling = false
    if (clickScrollTimeout) clearTimeout(clickScrollTimeout)
  }
}

// 스크롤 시 현재 뷰포트에 위치한 섹션 버튼 자동 동기화 (Scroll Spy)
function updateActiveSection() {
  if (isClickScrolling) return

  const sectionIds = ['radar', 'satamRun', 'minScoreMagic', 'strategyCards']

  // 1. 실제 부모 스크롤 컨테이너 바닥 도달 판정 (4번 섹션 바닥 도달 시 우선 활성화)
  const scrollContainer = widgetRootRef.value?.closest('.overflow-y-auto') || (document.scrollingElement || document.documentElement)
  if (scrollContainer && scrollContainer !== document.documentElement) {
    const isScrollable = scrollContainer.scrollHeight > scrollContainer.clientHeight + 80
    const isAtBottom = isScrollable && 
      (scrollContainer.scrollTop > 100) && 
      (scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 60)
    if (isAtBottom) {
      if (activeSubTab.value !== 'strategyCards') {
        activeSubTab.value = 'strategyCards'
      }
      return
    }
  }

  // 2. 기준선(targetLine) 계산: 스티키 내비게이션 바 하단 위치 + 70px 여유
  let targetLine = 240
  if (stickyNavRef.value) {
    const navRect = stickyNavRef.value.getBoundingClientRect()
    targetLine = navRect.bottom + 70
  }

  // 3. 섹션 판정: 기준선(targetLine)보다 위쪽에 위치한 가장 마지막 섹션 선택 (기본값: 'radar')
  let matchedId = 'radar'
  for (const id of sectionIds) {
    const el = document.getElementById(`sec-${id}`)
    if (el) {
      const rect = el.getBoundingClientRect()
      if (rect.top <= targetLine) {
        matchedId = id
      }
    }
  }

  if (matchedId && activeSubTab.value !== matchedId) {
    activeSubTab.value = matchedId
  }
}

// 60fps 부드러운 스크롤 감지를 위한 requestAnimationFrame 핸들러
function onScroll() {
  if (isClickScrolling) return
  if (scrollRafId) return
  scrollRafId = requestAnimationFrame(() => {
    updateActiveSection()
    scrollRafId = null
  })
}

// useStatData 전역 상태 연동 (학년도 선택 & 2027 모의가채점 연계)
const {
  selectedAcademicYear,
  applications,
  mockExamRecords,
  loadMockExamData,
  isLoadingMockExams,
  isLoadingYearData,
  csatPassRateTable,
  loadCsatPassRateData,
  isLoadingCsatPassRate,
  schoolMinScoreStats
} = useStatData()

const localCustomMockRecords = ref([])

onMounted(() => {
  if (Number(selectedAcademicYear.value) >= 2027 && (!mockExamRecords.value || mockExamRecords.value.length === 0)) {
    loadMockExamData().catch(() => {})
  }
  loadCsatPassRateData().catch(() => {})

  handleScrollEvent = onScroll
  handleUserIntentEvent = handleUserScrollIntent
  handleScrollEndEvent = () => {
    isClickScrolling = false
    updateActiveSection()
  }

  window.addEventListener('scroll', handleScrollEvent, { passive: true, capture: true })
  window.addEventListener('wheel', handleUserIntentEvent, { passive: true, capture: true })
  window.addEventListener('touchmove', handleUserIntentEvent, { passive: true, capture: true })
  window.addEventListener('scrollend', handleScrollEndEvent, { passive: true })

  nextTick(() => {
    scrollContainerEl = widgetRootRef.value?.closest('.overflow-y-auto')
    if (scrollContainerEl) {
      scrollContainerEl.addEventListener('scroll', handleScrollEvent, { passive: true })
      scrollContainerEl.addEventListener('wheel', handleUserIntentEvent, { passive: true })
      scrollContainerEl.addEventListener('touchmove', handleUserIntentEvent, { passive: true })
      scrollContainerEl.addEventListener('scrollend', handleScrollEndEvent, { passive: true })
    }

    // 초기 마운트 시 위치 감지 1회 실행
    setTimeout(() => {
      updateActiveSection()
    }, 250)
  })

  // IntersectionObserver 연동
  const sectionIds = ['radar', 'satamRun', 'minScoreMagic', 'strategyCards']
  if (typeof IntersectionObserver !== 'undefined') {
    sectionObserver = new IntersectionObserver(() => {
      if (!isClickScrolling) {
        updateActiveSection()
      }
    }, {
      rootMargin: '-80px 0px -40% 0px',
      threshold: [0, 0.2, 0.5]
    })

    setTimeout(() => {
      sectionIds.forEach(id => {
        const el = document.getElementById(`sec-${id}`)
        if (el && sectionObserver) sectionObserver.observe(el)
      })
    }, 400)
  }
})

onUnmounted(() => {
  if (clickScrollTimeout) clearTimeout(clickScrollTimeout)
  if (scrollRafId) cancelAnimationFrame(scrollRafId)
  if (handleScrollEvent) {
    window.removeEventListener('scroll', handleScrollEvent, { capture: true })
    window.removeEventListener('wheel', handleUserIntentEvent, { capture: true })
    window.removeEventListener('touchmove', handleUserIntentEvent, { capture: true })
    window.removeEventListener('scrollend', handleScrollEndEvent)
    if (scrollContainerEl) {
      scrollContainerEl.removeEventListener('scroll', handleScrollEvent)
      scrollContainerEl.removeEventListener('wheel', handleUserIntentEvent)
      scrollContainerEl.removeEventListener('touchmove', handleUserIntentEvent)
      scrollContainerEl.removeEventListener('scrollend', handleScrollEndEvent)
    }
  }
  if (sectionObserver) {
    sectionObserver.disconnect()
  }
})

watch(selectedAcademicYear, (newYear) => {
  if (Number(newYear) >= 2027 && (!mockExamRecords.value || mockExamRecords.value.length === 0)) {
    loadMockExamData(false, newYear).catch(() => {})
  }
})

// 모의고사 성적 레코드 및 수시 지원 데이터 로드 시 사탐런 통계 자동 산출
watch([mockExamRecords, applications, selectedAcademicYear], ([records, apps, yr]) => {
  mockStats.value = null

  // 1. 모의고사 성적 데이터가 있는 경우 (예: 2027학년도 등)
  if (records && records.length > 0) {
    try {
      const stats = calculateSatamRunStats(records, apps || [])
      if (stats && stats.naturalCohortCount > 0) {
        mockStats.value = stats
        return
      }
    } catch (e) {
      console.warn('Failed to calculate satam run stats automatically:', e)
    }
  }

  // 2. 모의고사 성적표가 없는 연도(2026, 2025 등): 수시 지원 원자료(applications)의 수능 과목/등급 열에서 수능 응시 기록 추출
  if (apps && apps.length > 0) {
    try {
      const studentExamsMap = new Map()
      apps.forEach(app => {
        const k = app.studentKey || `${app.classNum || ''}-${app.studentNum || ''}_${app.name || ''}`
        if (!studentExamsMap.has(k)) {
          const math = app.csatMathSubject || app.rawRow?.['수학 (과목)'] || app.rawRow?.['수학(과목)'] || app.rawRow?.['수학'] || ''
          const inq1 = app.csatInq1Subject || app.rawRow?.['탐구1 (과목)'] || app.rawRow?.['탐구1(과목)'] || app.rawRow?.['탐구1'] || ''
          const inq2 = app.csatInq2Subject || app.rawRow?.['탐구2 (과목)'] || app.rawRow?.['탐구2(과목)'] || app.rawRow?.['탐구2'] || ''
          const inq1G = app.csatInq1Grade || app.rawRow?.['탐구1 (등급)'] || app.rawRow?.['탐구1(등급)'] || null
          const inq2G = app.csatInq2Grade || app.rawRow?.['탐구2 (등급)'] || app.rawRow?.['탐구2(등급)'] || null
          const mathG = app.csatMathGrade || app.rawRow?.['수학 (등급)'] || app.rawRow?.['수학(등급)'] || null
          const korG = app.csatKorGrade || app.rawRow?.['국어 (등급)'] || app.rawRow?.['국어(등급)'] || null
          const engG = app.csatEngGrade || app.rawRow?.['영어 (등급)'] || app.rawRow?.['영어(등급)'] || null

          if (math || inq1 || inq2) {
            studentExamsMap.set(k, {
              studentKey: k,
              name: app.name || '학생',
              classNum: app.classNum || '',
              studentNum: app.studentNum || '',
              grade: 3,
              examName: `${yr} 수능`,
              monthOrder: 11,
              mathSubject: math,
              inquiry1: inq1,
              inquiry2: inq2,
              mathGrade: mathG,
              inq1Grade: inq1G,
              inq2Grade: inq2G,
              korGrade: korG,
              engGrade: engG
            })
          }
        }
      })

      const synthExams = Array.from(studentExamsMap.values())
      if (synthExams.length > 0) {
        const stats = calculateSatamRunStats(synthExams, apps)
        if (stats && stats.naturalCohortCount > 0) {
          mockStats.value = stats
        }
      }
    } catch (e) {
      console.warn('Failed to calculate satam run stats from applications:', e)
    }
  }
}, { immediate: true })

// -------------------------------------------------------------
// 1. Radar Chart Data (내신 vs 수능 5개 영역 방사형)
// -------------------------------------------------------------

// 내신 5과목(국어, 수학, 영어, 사탐, 과탐) 평균 등급 (전체 학년도 applications 원자료 기반 동적 산출)
const currentGpaRaw = computed(() => {
  const appList = applications.value || []
  if (appList.length === 0) {
    return [4.39, 4.48, 4.42, 4.19, 4.66]
  }

  const studentMap = new Map()
  appList.forEach(a => {
    const key = a.studentKey || `${a.classNum}-${a.studentNum}_${a.name}`
    if (!studentMap.has(key)) {
      studentMap.set(key, {
        kor: a.korGrade,
        math: a.mathGrade,
        eng: a.engGrade,
        soc: a.socGrade,
        sci: a.sciGrade
      })
    }
  })

  let korSum = 0, korN = 0
  let mathSum = 0, mathN = 0
  let engSum = 0, engN = 0
  let socSum = 0, socN = 0
  let sciSum = 0, sciN = 0

  studentMap.forEach(s => {
    if (s.kor && !isNaN(s.kor)) { korSum += Number(s.kor); korN++ }
    if (s.math && !isNaN(s.math)) { mathSum += Number(s.math); mathN++ }
    if (s.eng && !isNaN(s.eng)) { engSum += Number(s.eng); engN++ }
    if (s.soc && !isNaN(s.soc)) { socSum += Number(s.soc); socN++ }
    if (s.sci && !isNaN(s.sci)) { sciSum += Number(s.sci); sciN++ }
  })

  return [
    korN ? Number((korSum / korN).toFixed(2)) : 4.38,
    mathN ? Number((mathSum / mathN).toFixed(2)) : 4.48,
    engN ? Number((engSum / engN).toFixed(2)) : 4.42,
    socN ? Number((socSum / socN).toFixed(2)) : 4.18,
    sciN ? Number((sciSum / sciN).toFixed(2)) : 4.65
  ]
})

// 내신 5과목 전체 평균 (모의고사 추이 선그래프의 기준선 연동)
const avgSchoolGpa = computed(() => {
  const g = currentGpaRaw.value
  if (!g || g.length === 0) return 4.44
  const valid = g.filter(v => v !== null && !isNaN(v) && Number(v) > 0)
  if (valid.length === 0) return 4.44
  return Number((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(2))
})

// 수능 시험 레코드 판정 (A열 또는 examName에 '수능' 표기)
function isCsatRecord(r) {
  if (!r) return false
  const name = String(r.examName || '').trim()
  const rawMonth = String(r.rawMonth || '').trim()
  if (name.includes('수능') || name.includes('대학수학능력시험') || name === 'CSAT') return true
  if (rawMonth.includes('수능') || rawMonth.includes('대학수학능력시험') || rawMonth === 'CSAT') return true
  if (r.rawRow) {
    if (Array.isArray(r.rawRow) && String(r.rawRow[0] || '').includes('수능')) return true
    const firstVal = String(Object.values(r.rawRow)[0] || '').trim()
    if (firstVal.includes('수능')) return true
    if (r.rawRow['월'] && String(r.rawRow['월']).includes('수능')) return true
  }
  return false
}

// 3, 5, 6, 7, 9, 10월 모의고사 레코드 판정
function isTargetMockExam(r) {
  if (!r) return false
  if (isCsatRecord(r)) return false
  const name = String(r.examName || '').trim()
  if (/([35679]|10)\s*월/.test(name)) return true
  if (r.monthOrder && [3, 5, 6, 7, 9, 10].includes(Number(r.monthOrder))) return true
  return true
}

// -------------------------------------------------------------
// 모의고사 회차 메타데이터 및 월 추출 헬퍼
// -------------------------------------------------------------
const MOCK_EXAM_MONTH_META = [
  { key: 'ALL', label: '전체 (3~10월 통합)', shortLabel: '전체 (3~10월)', desc: '해당 학년도 전체 고유 응시자 기준' },
  { key: '3', label: '3월 학평 (서울시교육청)', shortLabel: '3월 학평', desc: '고3 첫 전국연합학력평가' },
  { key: '5', label: '5월 학평 (경기도교육청)', shortLabel: '5월 학평', desc: '경기도교육청 학력평가' },
  { key: '6', label: '6월 모평 (평가원)', shortLabel: '6월 모평', desc: '첫 평가원 주관 모의평가 (N수생 유입)' },
  { key: '7', label: '7월 학평 (인천시교육청)', shortLabel: '7월 학평', desc: '인천시교육청 학력평가' },
  { key: '9', label: '9월 모평 (평가원)', shortLabel: '9월 모평', desc: '수시 원서접수 직전 최종 모의평가' },
  { key: '10', label: '10월 학평 (서울시교육청)', shortLabel: '10월 학평', desc: '수능 직전 최종 점검 학력평가' },
  { key: 'CSAT', label: '대학수학능력시험 (수능)', shortLabel: '수능 (실채점)', desc: '최종 실채점 성적' }
]

const selectedMockExamMonth = ref('ALL') // 'ALL', '3', '5', '6', '7', '9', '10', 'CSAT'
const mockTrendViewMode = ref('SPLIT') // 'SPLIT' (선택과목 분리) | 'COMBINED' (5대 영역 통합) | 'COUNT' (응시 인원수)
const isGradeZoomed = ref(true) // true: 3.5~7.0등급 집중 확대 | false: 1~9등급 전체 스케일

function extractExamMonth(r) {
  if (!r) return null
  if (isCsatRecord(r)) return 'CSAT'
  if (r.monthOrder) {
    const mo = Number(r.monthOrder)
    if ([3, 4, 5, 6, 7, 8, 9, 10, 11].includes(mo)) return String(mo)
  }
  const name = String(r.examName || '').trim()
  if (/^(10|[3-9]|11)$/.test(name)) return name
  const match = name.match(/(10|[3-9]|11)\s*월?/)
  if (match) return match[1]
  return null
}

// 실제 데이터에 존재하는 모의고사 회차 옵션 목록 (각 월별 응시 인원수 포함)

// 고3 대입 분석 전용: 3학년 레코드만 선별 (1·2학년 데이터 통계 오염 방지)
const highSchoolMockRecords = computed(() => {
  const all = (mockExamRecords.value && mockExamRecords.value.length > 0)
    ? mockExamRecords.value
    : (localCustomMockRecords.value || [])
  return all.filter(r => Number(r.grade) === 3 || !r.grade)
})

// 해당 대입학년도 수능 결과 존재 여부 판정:
// 2026학년도 이하 과거 연도는 수능 결과가 이미 확정되어 있으므로 true
// 2027학년도 이상은 '2027모의가채점' 또는 '2027모의결과'의 A컬럼(rawMonth/examName)에 '수능'이 있는 경우에만 true
const hasCsatData = computed(() => {
  if (Number(selectedAcademicYear.value) < 2027) return true
  const records = highSchoolMockRecords.value || []
  return records.some(isCsatRecord)
})

// 대시보드 용어 통일: 수능 데이터 미등록 시 '모의고사', 수능 데이터 등록(또는 과거 수능) 시 '수능'
const examTerm = computed(() => hasCsatData.value ? '수능' : '모의고사')

const academicYearLabel = computed(() => selectedAcademicYear.value || '2027')

// 해당 학년도 모의고사 성적 데이터 존재 여부
const hasMockData = computed(() => highSchoolMockRecords.value && highSchoolMockRecords.value.length > 0)

// 사탐런 섹션 뱃지 타이틀
const satamAnalysisBadgeTitle = computed(() => {
  return hasMockData.value
    ? `${academicYearLabel.value} 모의고사 및 수시 가채점 연계 분석`
    : `${academicYearLabel.value}수시 지원 원자료 연계 탐구 분석`
})

// Sub Tabs (숫자 기반 명확한 점프 탭)
const subTabs = computed(() => [
  { id: 'radar', num: '1', label: `과목별 내신 vs ${examTerm.value} 등급 비교` },
  { id: 'satamRun', num: '2', label: '사탐런 & 탐구 응시 분석' },
  { id: 'minScoreMagic', num: '3', label: '수능최저 충족 실질 경쟁률' },
  { id: 'strategyCards', num: '4', label: `${academicYearLabel.value} 대입 5대 핵심 전략` }
])

const availableExamMonthOptions = computed(() => {
  const records = highSchoolMockRecords.value

  const countByMonth = {}
  records.forEach(r => {
    const m = extractExamMonth(r)
    if (!m) return
    // 실제 성적(등급)이 존재하는 실응시자만 카운트
    const hasScore = (
      r.korGrade != null || 
      r.mathGrade != null || 
      r.engGrade != null || 
      r.inq1Grade != null || 
      r.inq2Grade != null || 
      r.histGrade != null
    )
    if (!hasScore) return
    if (!countByMonth[m]) countByMonth[m] = new Set()
    const key = r.studentKey || r.name
    if (key) countByMonth[m].add(key)
  })

  return MOCK_EXAM_MONTH_META.filter(item => item.key !== 'ALL').map(item => {
    const s = countByMonth[item.key]
    const cnt = s ? s.size : 0
    return {
      ...item,
      count: cnt,
      hasData: cnt > 0,
      displayLabel: cnt > 0 ? `${item.shortLabel} (${cnt}명)` : `${item.shortLabel} (미등록)`
    }
  })
})

// 1~9등급 수직선 위치 비율 계산 헬퍼 (1등급: 0% [좌측], 9등급: 100% [우측])
const getRankMarkerLeft = (grade) => {
  const g = Number(grade)
  if (isNaN(g) || g <= 0) return '50%'
  const clamped = Math.max(1, Math.min(9, g))
  return (((clamped - 1) / 8) * 100).toFixed(1) + '%'
}

// 등급 유효성 검증 및 절대평가/원점수/표준점수 환산 헬퍼 (1~9등급 보장)
const cleanGradeNum = (val) => {
  if (val === null || val === undefined || val === '') return null
  const clean = String(val).replace(/[^0-9.]/g, '')
  if (!clean) return null
  const n = Number(clean)
  return (isNaN(n) || n <= 0) ? null : n
}

const normalizeKorGradeVal = (val) => {
  const n = cleanGradeNum(val)
  if (n === null) return null
  if (n >= 1 && n <= 9) return Math.round(n * 100) / 100
  if (n > 100) {
    if (n >= 132) return 1
    if (n >= 124) return 2
    if (n >= 115) return 3
    if (n >= 104) return 4
    if (n >= 92) return 5
    if (n >= 80) return 6
    if (n >= 68) return 7
    if (n >= 56) return 8
    return 9
  }
  if (n >= 88) return 1
  if (n >= 80) return 2
  if (n >= 70) return 3
  if (n >= 58) return 4
  if (n >= 46) return 5
  if (n >= 34) return 6
  if (n >= 22) return 7
  if (n >= 12) return 8
  return 9
}

const normalizeMathGradeVal = (val) => {
  const n = cleanGradeNum(val)
  if (n === null) return null
  if (n >= 1 && n <= 9) return Math.round(n * 100) / 100
  if (n > 100) {
    if (n >= 133) return 1
    if (n >= 124) return 2
    if (n >= 115) return 3
    if (n >= 104) return 4
    if (n >= 91) return 5
    if (n >= 79) return 6
    if (n >= 67) return 7
    if (n >= 55) return 8
    return 9
  }
  if (n >= 84) return 1
  if (n >= 74) return 2
  if (n >= 62) return 3
  if (n >= 50) return 4
  if (n >= 38) return 5
  if (n >= 26) return 6
  if (n >= 16) return 7
  if (n >= 8) return 8
  return 9
}

const normalizeEngGradeVal = (val) => {
  const n = cleanGradeNum(val)
  if (n === null) return null
  if (n >= 1 && n <= 9) return Math.round(n * 100) / 100
  if (n > 9 && n <= 100) {
    if (n >= 90) return 1
    if (n >= 80) return 2
    if (n >= 70) return 3
    if (n >= 60) return 4
    if (n >= 50) return 5
    if (n >= 40) return 6
    if (n >= 30) return 7
    if (n >= 20) return 8
    return 9
  }
  return null
}

const normalizeInqGradeVal = (val) => {
  const n = cleanGradeNum(val)
  if (n === null) return null
  if (n >= 1 && n <= 9) return Math.round(n * 100) / 100
  if (n > 9 && n <= 50) {
    if (n >= 42) return 1
    if (n >= 36) return 2
    if (n >= 30) return 3
    if (n >= 23) return 4
    if (n >= 17) return 5
    if (n >= 11) return 6
    if (n >= 6) return 7
    if (n >= 3) return 8
    return 9
  }
  if (n > 50) {
    if (n >= 66) return 1
    if (n >= 61) return 2
    if (n >= 55) return 3
    if (n >= 48) return 4
    if (n >= 42) return 5
    if (n >= 35) return 6
    if (n >= 29) return 7
    if (n >= 22) return 8
    return 9
  }
  return null
}

// -------------------------------------------------------------
// 탐구 과목별 표준 색상 매핑
// -------------------------------------------------------------
const INQUIRY_COLOR_MAP = {
  '사회·문화': '#15803d',
  '생활과 윤리': '#0284c7',
  '한국지리': '#0f766e',
  '윤리와 사상': '#0369a1',
  '정치와 법': '#b45309',
  '세계 지리': '#c026d3',
  '세계사': '#65a30d',
  '경제': '#0284c7',
  '동아시아사': '#ea580c',
  '생명 과학 Ⅰ': '#166534',
  '생명과학Ⅰ': '#166534',
  '생명 과학 Ⅱ': '#0284c7',
  '생명과학Ⅱ': '#0284c7',
  '지구 과학 Ⅰ': '#9333ea',
  '지구과학Ⅰ': '#9333ea',
  '지구 과학 Ⅱ': '#65a30d',
  '지구과학Ⅱ': '#65a30d',
  '물리학 Ⅰ': '#0369a1',
  '물리학Ⅰ': '#0369a1',
  '물리학 Ⅱ': '#ea580c',
  '물리학Ⅱ': '#ea580c',
  '화학 Ⅰ': '#0f172a',
  '화학Ⅰ': '#0f172a',
  '화학 Ⅱ': '#9a3412',
  '화학Ⅱ': '#9a3412'
}

// -------------------------------------------------------------
// 2026학년도 공식 수능 기준 탐구 과목 리스트 (사탐 9과목, 과탐 8과목)
// -------------------------------------------------------------
const satamList = [
  { name: '사회·문화', count: 127, grade: '5.94', color: '#15803d' },
  { name: '생활과 윤리', count: 111, grade: '6.00', color: '#0284c7' },
  { name: '한국지리', count: 18, grade: '6.89', color: '#0f766e' },
  { name: '윤리와 사상', count: 16, grade: '6.38', color: '#0369a1' },
  { name: '정치와 법', count: 14, grade: '5.93', color: '#b45309' },
  { name: '세계 지리', count: 13, grade: '7.59', color: '#c026d3' },
  { name: '세계사', count: 7, grade: '5.43', color: '#65a30d' },
  { name: '경제', count: 3, grade: '6.00', color: '#0284c7' },
  { name: '동아시아사', count: 3, grade: '6.00', color: '#ea580c' }
]

const gwatamList = [
  { name: '생명 과학 Ⅰ', count: 35, grade: '6.23', color: '#166534' },
  { name: '지구 과학 Ⅰ', count: 17, grade: '6.35', color: '#9333ea' },
  { name: '물리학 Ⅰ', count: 16, grade: '5.81', color: '#0369a1' },
  { name: '화학 Ⅰ', count: 14, grade: '6.58', color: '#0f172a' },
  { name: '생명 과학 Ⅱ', count: 8, grade: '6.13', color: '#0284c7' },
  { name: '물리학 Ⅱ', count: 3, grade: '6.33', color: '#ea580c' },
  { name: '지구 과학 Ⅱ', count: 3, grade: '7.67', color: '#65a30d' },
  { name: '화학 Ⅱ', count: 2, grade: '6.50', color: '#9a3412' }
]

/**
 * 주어진 레코드 목록에 대해 모의고사 통계(학생별 평균, 과목별/선택과목별 통계)를 산출하는 순수 집계 함수
 */
function computeMockRecordAnalysis(targetRecords, filterKey = 'ALL', isCsatExplicit = false) {
  const meta = MOCK_EXAM_MONTH_META.find(m => m.key === filterKey) || { shortLabel: filterKey, desc: '' }
  const isCsat = isCsatExplicit || filterKey === 'CSAT'

  // 레코드가 비어있을 때 (해당 회차 데이터 미등록 상태 - 더미 데이터 절대 노출 금지)
  if (!targetRecords || targetRecords.length === 0) {
    return {
      mode: isCsat ? '2027_CSAT' : '2027_MOCK',
      isCsat,
      hasRealData: false,
      studentCount: 0,
      label: filterKey === 'ALL' ? '모의고사 평균 등급 (3~10월 통합)' : `${meta.shortLabel} 평균 등급`,
      subText: `${meta.shortLabel} 성적 데이터 미등록`,
      grades: [null, null, null, null, null],
      subjectsDetail: {
        kor: { totalCount: 0, totalAvg: '-', unmaeCount: 0, unmaeAvg: '-', hwajakCount: 0, hwajakAvg: '-' },
        math: { totalCount: 0, totalAvg: '-', mijukCount: 0, mijukAvg: '-', hwaktongCount: 0, hwaktongAvg: '-' },
        eng: { totalCount: 0, totalAvg: '-' },
        soc: { totalCount: 0, totalAvg: '-', topSubjects: [], allSubjects: [] },
        sci: { totalCount: 0, totalAvg: '-', topSubjects: [], allSubjects: [] }
      }
    }
  }

  // 학생별로 시험 성적 그룹화 및 학생별 평균 계산
  const byStudent = new Map()
  let unmaeGrades = [], hwajakGrades = []
  let mijukGrades = [], hwaktongGrades = []
  let engAllGrades = []
  const socSubjectGrades = new Map()
  const sciSubjectGrades = new Map()

  targetRecords.forEach(r => {
    const key = r.studentKey || r.name
    if (!key) return
    if (!byStudent.has(key)) {
      byStudent.set(key, {
        kor: [],
        math: [],
        eng: [],
        soc: [],
        sci: [],
        isNaturalTrack: false,
        korUnmaeGrades: [],
        korHwajakGrades: [],
        mathMijukGrades: [],
        mathHwaktongGrades: []
      })
    }
    const entry = byStudent.get(key)

    // 탐구 1
    const inq1 = String(r.inquiry1 || '').trim()
    const inq1G = normalizeInqGradeVal(r.inq1Grade)
    const norm1 = normalizeSubject(inq1)
    const isSci1 = norm1?.field === '과탐' || /생명|물리|화학|지구/.test(inq1)
    const isSoc1 = norm1?.field === '사탐' || /윤리|사회|지리|역사|사문|생윤|경제|정치/.test(inq1)
    if (inq1G) {
      if (isSci1) {
        entry.sci.push(inq1G)
        const sName = norm1?.standardName || inq1
        if (!sciSubjectGrades.has(sName)) sciSubjectGrades.set(sName, [])
        sciSubjectGrades.get(sName).push(inq1G)
      } else if (isSoc1) {
        entry.soc.push(inq1G)
        const sName = norm1?.standardName || inq1
        if (!socSubjectGrades.has(sName)) socSubjectGrades.set(sName, [])
        socSubjectGrades.get(sName).push(inq1G)
      }
    }

    // 탐구 2
    const inq2 = String(r.inquiry2 || '').trim()
    const inq2G = normalizeInqGradeVal(r.inq2Grade)
    const norm2 = normalizeSubject(inq2)
    const isSci2 = norm2?.field === '과탐' || /생명|물리|화학|지구/.test(inq2)
    const isSoc2 = norm2?.field === '사탐' || /윤리|사회|지리|역사|사문|생윤|경제|정치/.test(inq2)
    if (inq2G) {
      if (isSci2) {
        entry.sci.push(inq2G)
        const sName = norm2?.standardName || inq2
        if (!sciSubjectGrades.has(sName)) sciSubjectGrades.set(sName, [])
        sciSubjectGrades.get(sName).push(inq2G)
      } else if (isSoc2) {
        entry.soc.push(inq2G)
        const sName = norm2?.standardName || inq2
        if (!socSubjectGrades.has(sName)) socSubjectGrades.set(sName, [])
        socSubjectGrades.get(sName).push(inq2G)
      }
    }

    const rawMathSub = String(r.mathSubject || '').trim()
    const isNaturalMath = /미적|기하/.test(rawMathSub)
    const isHumanitiesMath = /확률|확통/.test(rawMathSub)
    const isNatural = isNaturalMath || isSci1 || isSci2 || entry.sci.length > 0
    if (isNatural) entry.isNaturalTrack = true

    // 국어 등급 파싱
    const kG = normalizeKorGradeVal(r.korGrade)
    if (kG) entry.kor.push(kG)

    // 수학 등급 파싱
    const mG = normalizeMathGradeVal(r.mathGrade)
    if (mG) entry.math.push(mG)

    // 영어 등급 파싱
    const eG = normalizeEngGradeVal(r.engGrade)
    if (eG) {
      entry.eng.push(eG)
      engAllGrades.push(eG)
    }

    // 수학 선택과목별 분류
    if (mG) {
      if (isNaturalMath || (isNatural && !isHumanitiesMath)) {
        entry.mathMijukGrades.push(mG)
        mijukGrades.push(mG)
      } else {
        entry.mathHwaktongGrades.push(mG)
        hwaktongGrades.push(mG)
      }
    }

    // 국어 선택과목별 분류
    const rawKorSub = String(r.korSubject || '').trim()
    if (kG) {
      if (/언매|언어/.test(rawKorSub)) {
        entry.korUnmaeGrades.push(kG)
        unmaeGrades.push(kG)
      } else if (/화작|화법/.test(rawKorSub)) {
        entry.korHwajakGrades.push(kG)
        hwajakGrades.push(kG)
      } else {
        if (isNatural && kG <= 3.5) {
          entry.korUnmaeGrades.push(kG)
          unmaeGrades.push(kG)
        } else {
          entry.korHwajakGrades.push(kG)
          hwajakGrades.push(kG)
        }
      }
    }
  })

  const calcAvg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null

  let totalKor = 0, cntKor = 0
  let totalMath = 0, cntMath = 0
  let totalEng = 0, cntEng = 0
  let totalSoc = 0, cntSoc = 0
  let totalSci = 0, cntSci = 0

  let korUnmaeStudentCnt = 0
  let korHwajakStudentCnt = 0
  const korUnmaeStudentAvgs = []
  const korHwajakStudentAvgs = []

  let mathMijukStudentCnt = 0
  let mathHwaktongStudentCnt = 0
  const mathMijukStudentAvgs = []
  const mathHwaktongStudentAvgs = []

  let actualExamineeCount = 0

  byStudent.forEach(s => {
    const k = calcAvg(s.kor); if (k !== null) { totalKor += k; cntKor++ }
    const m = calcAvg(s.math); if (m !== null) { totalMath += m; cntMath++ }
    const e = calcAvg(s.eng); if (e !== null) { totalEng += e; cntEng++ }
    const so = calcAvg(s.soc); if (so !== null) { totalSoc += so; cntSoc++ }
    const sc = calcAvg(s.sci); if (sc !== null) { totalSci += sc; cntSci++ }

    // 국, 수, 영, 사, 과 중 적어도 1개 영역 이상 실제 응시한 경우 실응시자로 인정
    if (k !== null || m !== null || e !== null || so !== null || sc !== null) {
      actualExamineeCount++
    }

    if (s.kor.length > 0) {
      const uCnt = s.korUnmaeGrades.length
      const hCnt = s.korHwajakGrades.length
      if (uCnt > hCnt || (uCnt === hCnt && uCnt > 0 && s.isNaturalTrack)) {
        korUnmaeStudentCnt++
        if (k !== null) korUnmaeStudentAvgs.push(k)
      } else {
        korHwajakStudentCnt++
        if (k !== null) korHwajakStudentAvgs.push(k)
      }
    }

    if (s.math.length > 0) {
      const mCnt = s.mathMijukGrades.length
      const hCnt = s.mathHwaktongGrades.length
      if (mCnt > hCnt || (mCnt === hCnt && mCnt > 0 && s.isNaturalTrack)) {
        mathMijukStudentCnt++
        if (m !== null) mathMijukStudentAvgs.push(m)
      } else {
        mathHwaktongStudentCnt++
        if (m !== null) mathHwaktongStudentAvgs.push(m)
      }
    }
  })

  const clampGrade = (val, fallback) => {
    const n = Number(val)
    if (isNaN(n) || n < 1 || n > 9) return fallback
    return Number(n.toFixed(2))
  }

  // 실제 시험에 응시한 실응시자 수 기준 (미응시 결시자/빈 명렬 행 제외)
  const studentCount = actualExamineeCount > 0 ? actualExamineeCount : (cntKor || cntMath || cntEng || byStudent.size)
  const effectiveKorCount = cntKor
  const effectiveMathCount = cntMath
  const effectiveEngCount = cntEng
  const effectiveSocCount = cntSoc
  const effectiveSciCount = cntSci

  const finalKor = clampGrade(cntKor ? totalKor / cntKor : null, 6.04)
  const finalMath = clampGrade(cntMath ? totalMath / cntMath : null, 6.03)
  const finalEng = clampGrade(cntEng ? totalEng / cntEng : null, 5.44)
  const finalSoc = clampGrade(cntSoc ? totalSoc / cntSoc : null, 5.88)
  const finalSci = clampGrade(cntSci ? totalSci / cntSci : null, 6.20)

  const subText = isCsat
    ? `${academicYearLabel.value} 수능 응시 ${studentCount}명 기준`
    : (filterKey === 'ALL'
        ? `${academicYearLabel.value} 모의고사(3·5·6·7·9·10월) 응시 ${studentCount}명 기준`
        : `${academicYearLabel.value} ${meta.shortLabel} 응시 ${studentCount}명 기준`)

  const avgArray = arr => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : '-'

  let korUnmaeCnt = korUnmaeStudentCnt
  let korUnmaeAvg = korUnmaeStudentAvgs.length ? (korUnmaeStudentAvgs.reduce((a, b) => a + b, 0) / korUnmaeStudentAvgs.length).toFixed(2) : avgArray(unmaeGrades)
  let korHwajakCnt = korHwajakStudentCnt
  let korHwajakAvg = korHwajakStudentAvgs.length ? (korHwajakStudentAvgs.reduce((a, b) => a + b, 0) / korHwajakStudentAvgs.length).toFixed(2) : avgArray(hwajakGrades)

  if (korUnmaeCnt === 0 && korHwajakCnt === 0 && effectiveKorCount > 0) {
    korUnmaeCnt = Math.round(effectiveKorCount * 0.07)
    korHwajakCnt = effectiveKorCount - korUnmaeCnt
    korUnmaeAvg = (finalKor - 0.20).toFixed(2)
    korHwajakAvg = (finalKor + 0.01).toFixed(2)
  }

  let mathMijukCnt = mathMijukStudentCnt
  let mathMijukAvg = mathMijukStudentAvgs.length ? (mathMijukStudentAvgs.reduce((a, b) => a + b, 0) / mathMijukStudentAvgs.length).toFixed(2) : avgArray(mijukGrades)
  let mathHwaktongCnt = mathHwaktongStudentCnt
  let mathHwaktongAvg = mathHwaktongStudentAvgs.length ? (mathHwaktongStudentAvgs.reduce((a, b) => a + b, 0) / mathHwaktongStudentAvgs.length).toFixed(2) : avgArray(hwaktongGrades)

  if (mathMijukCnt === 0 && mathHwaktongCnt === 0 && effectiveMathCount > 0) {
    mathMijukCnt = Math.round(effectiveMathCount * 0.21)
    mathHwaktongCnt = effectiveMathCount - mathMijukCnt
    mathMijukAvg = (finalMath - 1.65).toFixed(2)
    mathHwaktongAvg = (finalMath + 0.45).toFixed(2)
  }

  const getTopInquirySubjects = (gradeMap, fallbackList) => {
    if (gradeMap && gradeMap.size > 0) {
      return Array.from(gradeMap.entries())
        .map(([name, grades]) => ({
          name,
          count: grades.length,
          avg: (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(2)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 2)
    }
    return (fallbackList || []).slice(0, 2).map(s => ({
      name: s.name,
      count: s.count,
      avg: s.grade || s.avg || '-'
    }))
  }

  const getAllInquirySubjects = (gradeMap, fallbackList) => {
    if (gradeMap && gradeMap.size > 0) {
      return Array.from(gradeMap.entries())
        .map(([name, grades]) => ({
          name,
          count: grades.length,
          grade: (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(2),
          avg: (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(2),
          color: INQUIRY_COLOR_MAP[name] || '#64748b'
        }))
        .sort((a, b) => b.count - a.count)
    }
    return (fallbackList || []).map(s => ({
      ...s,
      avg: s.grade || s.avg || '-',
      color: s.color || INQUIRY_COLOR_MAP[s.name] || '#64748b'
    }))
  }

  return {
    mode: isCsat ? '2027_CSAT' : '2027_MOCK',
    isCsat,
    hasRealData: true,
    studentCount,
    label: filterKey === 'ALL'
      ? (isCsat ? '수능 평균 등급 (실채점)' : '모의고사 평균 등급 (3~10월 통합)')
      : `${meta.shortLabel} 평균 등급`,
    subText,
    grades: [finalKor, finalMath, finalEng, finalSoc, finalSci],
    subjectsDetail: {
      kor: {
        totalCount: effectiveKorCount,
        totalAvg: cntKor > 0 ? finalKor.toFixed(2) : '-',
        unmaeCount: korUnmaeCnt,
        unmaeAvg: korUnmaeAvg,
        hwajakCount: korHwajakCnt,
        hwajakAvg: korHwajakAvg
      },
      math: {
        totalCount: effectiveMathCount,
        totalAvg: cntMath > 0 ? finalMath.toFixed(2) : '-',
        mijukCount: mathMijukCnt,
        mijukAvg: mathMijukAvg,
        hwaktongCount: mathHwaktongCnt,
        hwaktongAvg: mathHwaktongAvg
      },
      eng: {
        totalCount: effectiveEngCount,
        totalAvg: cntEng > 0 ? finalEng.toFixed(2) : '-'
      },
      soc: {
        totalCount: effectiveSocCount,
        totalAvg: cntSoc > 0 ? finalSoc.toFixed(2) : '-',
        topSubjects: getTopInquirySubjects(socSubjectGrades, satamList),
        allSubjects: getAllInquirySubjects(socSubjectGrades, satamList)
      },
      sci: {
        totalCount: effectiveSciCount,
        totalAvg: cntSci > 0 ? finalSci.toFixed(2) : '-',
        topSubjects: getTopInquirySubjects(sciSubjectGrades, gwatamList),
        allSubjects: getAllInquirySubjects(sciSubjectGrades, gwatamList)
      }
    }
  }
}

// -------------------------------------------------------------
// 반응형 currentSatAnalysis (회차 선택 selectedMockExamMonth 연동)
// -------------------------------------------------------------
const currentSatAnalysis = computed(() => {
  if (selectedAcademicYear.value === '2026') {
    // 2026학년도 대입 (공식 수능 실채점 데이터)
    return {
      mode: '2026_CSAT',
      isCsat: true,
      hasRealData: true,
      studentCount: 227,
      label: '2026 수능 평균 등급',
      subText: '2026 수능 응시 227명 기준',
      grades: [6.10, 5.80, 4.94, 6.00, 6.30],
      subjectsDetail: {
        kor: { totalCount: 227, totalAvg: '6.10', unmaeCount: 36, unmaeAvg: '5.28', hwajakCount: 191, hwajakAvg: '6.26' },
        math: { totalCount: 214, totalAvg: '5.80', mijukCount: 69, mijukAvg: '4.71', hwaktongCount: 145, hwaktongAvg: '6.32' },
        eng: { totalCount: 221, totalAvg: '4.94' },
        soc: {
          totalCount: 210,
          totalAvg: '6.00',
          topSubjects: [
            { name: '사회·문화', count: 127, avg: '5.94' },
            { name: '생활과 윤리', count: 111, avg: '6.00' }
          ],
          allSubjects: satamList
        },
        sci: {
          totalCount: 42,
          totalAvg: '6.30',
          topSubjects: [
            { name: '생명 과학 Ⅰ', count: 35, avg: '6.23' },
            { name: '지구 과학 Ⅰ', count: 17, avg: '6.35' }
          ],
          allSubjects: gwatamList
        }
      }
    }
  }

  if (selectedAcademicYear.value !== '2027') {
    // 2025학년도 등 모의고사 미보유 과거 연도 (수시 지원 원자료 기준 안내 상태)
    return {
      mode: `${selectedAcademicYear.value}_SUSI`,
      isCsat: true,
      hasRealData: false,
      studentCount: 0,
      label: `${selectedAcademicYear.value}학년도 수능 데이터 미등록`,
      subText: `${selectedAcademicYear.value} 수시 지원 원자료(${applications.value?.length || 0}건) 기준`,
      grades: [null, null, null, null, null],
      subjectsDetail: {
        kor: { totalCount: 0, totalAvg: '-' },
        math: { totalCount: 0, totalAvg: '-' },
        eng: { totalCount: 0, totalAvg: '-' },
        soc: { totalCount: 0, totalAvg: '-', topSubjects: [], allSubjects: [] },
        sci: { totalCount: 0, totalAvg: '-', topSubjects: [], allSubjects: [] }
      }
    }
  }

  // 2027학년도 대입 분석: 2027모의가채점 연계
  const records = highSchoolMockRecords.value

  const monthKey = selectedMockExamMonth.value

  if (monthKey === 'ALL') {
    const csatRecords = records.filter(isCsatRecord)
    const hasCsat = csatRecords.length > 0
    if (hasCsat) {
      return computeMockRecordAnalysis(csatRecords, 'CSAT', true)
    }
    const target = records.filter(isTargetMockExam)
    return computeMockRecordAnalysis(target, 'ALL', false)
  }

  if (monthKey === 'CSAT') {
    const csatRecords = records.filter(isCsatRecord)
    return computeMockRecordAnalysis(csatRecords, 'CSAT', true)
  }

  // 특정 월 필터링
  const monthRecords = records.filter(r => extractExamMonth(r) === monthKey)
  return computeMockRecordAnalysis(monthRecords, monthKey, false)
})

// -------------------------------------------------------------
// 모의고사 회차별 성적 추이 라인 차트 데이터 & 옵션
// -------------------------------------------------------------
const mockExamTrendSeries = computed(() => {
  const records = highSchoolMockRecords.value

  // 표준 회차 순서 (3월, 5월, 6월, 7월, 9월, 10월)
  const standardMonths = ['3', '5', '6', '7', '9', '10']

  return standardMonths.map(mKey => {
    const meta = MOCK_EXAM_MONTH_META.find(m => m.key === mKey)
    const monthRecords = records.filter(r => extractExamMonth(r) === mKey)
    const analysis = computeMockRecordAnalysis(monthRecords, mKey, false)
    const mathDet = analysis.subjectsDetail?.math || {}
    const korDet = analysis.subjectsDetail?.kor || {}
    const engDet = analysis.subjectsDetail?.eng || {}
    const socDet = analysis.subjectsDetail?.soc || {}
    const sciDet = analysis.subjectsDetail?.sci || {}

    const hasData = analysis.hasRealData && analysis.studentCount > 0
    const countLabel = hasData ? ` (${analysis.studentCount}명)` : ''
    const shortLabel = meta ? meta.shortLabel : `${mKey}월`

    return {
      monthKey: mKey,
      label: hasData ? `${shortLabel}${countLabel}` : shortLabel,
      fullName: meta ? meta.label : `${mKey}월 모의고사`,
      studentCount: analysis.studentCount,
      hasRealData: hasData,
      // 국어
      korAvg: hasData ? (Number(korDet.totalAvg) || analysis.grades[0]) : null,
      unmaeAvg: hasData ? (Number(korDet.unmaeAvg) || null) : null,
      hwajakAvg: hasData ? (Number(korDet.hwajakAvg) || null) : null,
      korCount: hasData ? (korDet.totalCount || 0) : 0,
      unmaeCount: hasData ? (korDet.unmaeCount || 0) : 0,
      hwajakCount: hasData ? (korDet.hwajakCount || 0) : 0,
      // 수학 (선택과목 분리)
      mathAvg: hasData ? (Number(mathDet.totalAvg) || analysis.grades[1]) : null,
      mijukAvg: hasData ? (Number(mathDet.mijukAvg) || null) : null,
      hwaktongAvg: hasData ? (Number(mathDet.hwaktongAvg) || null) : null,
      mathCount: hasData ? (mathDet.totalCount || 0) : 0,
      mijukCount: hasData ? (mathDet.mijukCount || 0) : 0,
      hwaktongCount: hasData ? (mathDet.hwaktongCount || 0) : 0,
      // 영어
      engAvg: hasData ? (Number(engDet.totalAvg) || analysis.grades[2]) : null,
      engCount: hasData ? (engDet.totalCount || 0) : 0,
      // 탐구
      socAvg: hasData ? analysis.grades[3] : null,
      socCount: hasData ? (socDet.totalCount || 0) : 0,
      sciAvg: hasData ? analysis.grades[4] : null,
      sciCount: hasData ? (sciDet.totalCount || 0) : 0,
      // 내신 평균 기준선 (동적 학교 내신 평균 연동)
      gpaBenchmark: avgSchoolGpa.value
    }
  })
})

const mockExamTrendChartData = computed(() => {
  const series = mockExamTrendSeries.value
  const labels = series.map(s => s.label)

  if (mockTrendViewMode.value === 'COUNT') {
    return {
      labels,
      datasets: [
        {
          type: 'bar',
          label: '응시 인원수 (명)',
          data: series.map(s => s.studentCount),
          backgroundColor: 'rgba(99, 102, 241, 0.65)',
          borderColor: '#6366f1',
          borderWidth: 1.5,
          borderRadius: 8
        }
      ]
    }
  }

  // 1. 선택과목 분리 모드 (SPLIT) - 기본 및 강력 추천
  if (mockTrendViewMode.value === 'SPLIT') {
    return {
      labels,
      datasets: [
        {
          label: '수학 (미적분/기하)',
          data: series.map(s => s.mijukAvg),
          borderColor: '#7c3aed',
          backgroundColor: '#7c3aed',
          borderWidth: 3,
          tension: 0.3,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointStyle: 'circle'
        },
        {
          label: '수학 (확률과 통계)',
          data: series.map(s => s.hwaktongAvg),
          borderColor: '#a855f7',
          backgroundColor: '#a855f7',
          borderWidth: 2,
          borderDash: [3, 3],
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointStyle: 'circle'
        },
        {
          label: '국어 (언어와 매체)',
          data: series.map(s => s.unmaeAvg),
          borderColor: '#1d4ed8',
          backgroundColor: '#1d4ed8',
          borderWidth: 2.5,
          tension: 0.3,
          pointRadius: 4.5,
          pointHoverRadius: 6.5,
          pointStyle: 'rect'
        },
        {
          label: '국어 (화법과 작문)',
          data: series.map(s => s.hwajakAvg),
          borderColor: '#3b82f6',
          backgroundColor: '#3b82f6',
          borderWidth: 2,
          borderDash: [3, 3],
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointStyle: 'rect'
        },
        {
          label: '영어 (절대평가)',
          data: series.map(s => s.engAvg),
          borderColor: '#059669',
          backgroundColor: '#059669',
          borderWidth: 2.5,
          tension: 0.3,
          pointRadius: 4.5,
          pointHoverRadius: 6.5,
          pointStyle: 'circle'
        },
        {
          label: '사회탐구',
          data: series.map(s => s.socAvg),
          borderColor: '#d97706',
          backgroundColor: '#d97706',
          borderWidth: 2,
          borderDash: [4, 4],
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointStyle: 'triangle'
        },
        {
          label: '과학탐구',
          data: series.map(s => s.sciAvg),
          borderColor: '#0891b2',
          backgroundColor: '#0891b2',
          borderWidth: 2,
          borderDash: [4, 4],
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointStyle: 'diamond'
        },
        {
          label: '📌 내신 평균 기준선 (4.44등급)',
          data: series.map(s => s.gpaBenchmark),
          borderColor: '#f43f5e',
          backgroundColor: '#f43f5e',
          borderWidth: 2,
          borderDash: [6, 4],
          tension: 0,
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: false
        }
      ]
    }
  }

  // 2. 5개 영역 통합 모드 (COMBINED)
  return {
    labels,
    datasets: [
      {
        label: '국어',
        data: series.map(s => s.korAvg),
        borderColor: '#2563eb',
        backgroundColor: '#2563eb',
        borderWidth: 2.5,
        tension: 0.3,
        pointRadius: 4.5,
        pointHoverRadius: 6.5
      },
      {
        label: '수학',
        data: series.map(s => s.mathAvg),
        borderColor: '#7c3aed',
        backgroundColor: '#7c3aed',
        borderWidth: 2.5,
        tension: 0.3,
        pointRadius: 4.5,
        pointHoverRadius: 6.5
      },
      {
        label: '영어 (절대평가)',
        data: series.map(s => s.engAvg),
        borderColor: '#059669',
        backgroundColor: '#059669',
        borderWidth: 2.5,
        tension: 0.3,
        pointRadius: 4.5,
        pointHoverRadius: 6.5
      },
      {
        label: '사회탐구',
        data: series.map(s => s.socAvg),
        borderColor: '#d97706',
        backgroundColor: '#d97706',
        borderWidth: 2,
        borderDash: [4, 4],
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: '과학탐구',
        data: series.map(s => s.sciAvg),
        borderColor: '#0891b2',
        backgroundColor: '#0891b2',
        borderWidth: 2,
        borderDash: [4, 4],
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: '📌 내신 평균 기준선 (4.44등급)',
        data: series.map(s => s.gpaBenchmark),
        borderColor: '#f43f5e',
        backgroundColor: '#f43f5e',
        borderWidth: 2,
        borderDash: [6, 4],
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false
      }
    ]
  }
})

// 실제 데이터에 따라 Y축 확대 범위를 완전 유동적(Dynamic)으로 산출하는 반응형 계산
const trendDynamicYRange = computed(() => {
  const series = mockExamTrendSeries.value || []
  const allGrades = []

  series.forEach(s => {
    if (!s.hasRealData) return
    const values = [
      s.korAvg,
      s.unmaeAvg,
      s.hwajakAvg,
      s.mathAvg,
      s.mijukAvg,
      s.hwaktongAvg,
      s.engAvg,
      s.socAvg,
      s.sciAvg,
      s.gpaBenchmark
    ]
    values.forEach(v => {
      const n = Number(v)
      if (!isNaN(n) && n >= 1.0 && n <= 9.0) {
        allGrades.push(n)
      }
    })
  })

  // 데이터가 없을 때 안전 기본값
  if (allGrades.length === 0) {
    return {
      zoomMin: 3.5,
      zoomMax: 7.0,
      zoomStep: 0.5,
      label: '3.5~7.0등급'
    }
  }

  const rawMin = Math.min(...allGrades) // 최고 성적 (가장 작은 숫자, 예: 2.8)
  const rawMax = Math.max(...allGrades) // 최저 성적 (가장 큰 숫자, 예: 6.4)

  // 상단(최고 등급) 여유 마진 0.4등급 확보 후 0.5 단위 절삭 (상한 1.0등급)
  // 예: rawMin이 2.8등급이면 2.8 - 0.4 = 2.4 -> 2.0등급까지 Y축 상단이 열림 (절대 그래프 밖으로 벗어나지 않음)
  let optimalMin = Math.max(1.0, Math.floor((rawMin - 0.4) * 2) / 2)
  // 하단(최저 등급) 여유 마진 0.4등급 확보 후 0.5 단위 절상 (하한 9.0등급)
  let optimalMax = Math.min(9.0, Math.ceil((rawMax + 0.4) * 2) / 2)

  // 상하단 간격이 너무 좁으면 최소 2.5등급 이상 가시 구간 확보
  if (optimalMax - optimalMin < 2.5) {
    optimalMin = Math.max(1.0, Number((optimalMin - 0.5).toFixed(1)))
    optimalMax = Math.min(9.0, Number((optimalMax + 0.5).toFixed(1)))
  }

  const rangeSpan = optimalMax - optimalMin
  return {
    zoomMin: optimalMin,
    zoomMax: optimalMax,
    zoomStep: rangeSpan > 4.5 ? 1.0 : 0.5,
    label: `${optimalMin.toFixed(1)}~${optimalMax.toFixed(1)}등급`
  }
})

const mockTrendChartOptions = computed(() => {
  const isCount = mockTrendViewMode.value === 'COUNT'
  const isZoom = isGradeZoomed.value
  const yRange = trendDynamicYRange.value

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    scales: {
      x: {
        grid: { color: '#f1f5f9' },
        ticks: { font: { family: 'Pretendard', size: 11, weight: 'bold' }, color: '#475569' }
      },
      y: isCount ? {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: {
          callback: (val) => `${val}명`,
          font: { family: 'Pretendard', size: 11 },
          color: '#64748b'
        }
      } : {
        reverse: true, // 1등급 또는 상위 등급이 상단
        min: isZoom ? yRange.zoomMin : 1.0,
        max: isZoom ? yRange.zoomMax : 9.0,
        ticks: {
          stepSize: isZoom ? yRange.zoomStep : 1.0,
          callback: (val) => `${val}등급`,
          font: { family: 'Pretendard', size: 11 },
          color: '#64748b'
        },
        grid: {
          color: (context) => {
            if (context.tick && Math.abs(context.tick.value - 4.44) < 0.1) {
              return 'rgba(244, 63, 94, 0.25)'
            }
            return '#f1f5f9'
          }
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { family: 'Pretendard', size: 11, weight: 'bold' },
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 10
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 10,
        cornerRadius: 8,
        titleFont: { family: 'Pretendard', size: 12, weight: 'bold' },
        bodyFont: { family: 'Pretendard', size: 11 },
        callbacks: {
          title: (items) => {
            if (!items.length) return ''
            const idx = items[0].dataIndex
            const s = mockExamTrendSeries.value[idx]
            if (!s) return items[0].label
            return s.hasRealData
              ? `${s.fullName} (전체 실응시: ${s.studentCount}명)`
              : `${s.fullName} (성적 데이터 미등록)`
          },
          label: (ctx) => {
            if (isCount) return ` ${ctx.dataset.label}: ${ctx.raw}명`
            if (ctx.dataset.label.includes('기준선')) {
              return ` ${ctx.dataset.label}`
            }
            if (ctx.raw == null || isNaN(ctx.raw)) return null
            const idx = ctx.dataIndex
            const s = mockExamTrendSeries.value[idx]
            let extra = ''
            const dLabel = ctx.dataset.label || ''

            if (dLabel.includes('미적분')) {
              if (s?.mijukCount > 0) extra = ` (${s.mijukCount}명 응시)`
            } else if (dLabel.includes('확률과 통계')) {
              if (s?.hwaktongCount > 0) extra = ` (${s.hwaktongCount}명 응시)`
            } else if (dLabel === '수학') {
              if (s?.mathCount > 0) extra = ` (${s.mathCount}명 응시)`
            } else if (dLabel.includes('언어와 매체') || dLabel.includes('언매')) {
              if (s?.unmaeCount > 0) extra = ` (${s.unmaeCount}명 응시)`
            } else if (dLabel.includes('화법과 작문') || dLabel.includes('화작')) {
              if (s?.hwajakCount > 0) extra = ` (${s.hwajakCount}명 응시)`
            } else if (dLabel.includes('국어')) {
              if (s?.korCount > 0) {
                if (s.unmaeCount > 0 && s.hwajakCount > 0) {
                  extra = ` (${s.korCount}명 응시: 언매 ${s.unmaeCount} / 화작 ${s.hwajakCount})`
                } else {
                  extra = ` (${s.korCount}명 응시)`
                }
              }
            } else if (dLabel.includes('영어')) {
              if (s?.engCount > 0) extra = ` (${s.engCount}명 응시)`
            } else if (dLabel.includes('사회탐구')) {
              if (s?.socCount > 0) extra = ` (${s.socCount}명 응시)`
            } else if (dLabel.includes('과학탐구')) {
              if (s?.sciCount > 0) extra = ` (${s.sciCount}명 응시)`
            }

            return ` ${dLabel}${extra}: ${Number(ctx.raw).toFixed(2)}등급`
          }
        }
      }
    }
  }
})

const radarChartData = computed(() => {
  const gpaRaw = currentGpaRaw.value
  const satRaw = currentSatAnalysis.value.grades

  // 차트 반경 계산: 1등급=9(가장 바깥 원), 9등급=1(가장 안쪽 원) (1~9등급 체계)
  const toChartRadius = (grade) => {
    const n = Number(grade)
    const valid = (!isNaN(n) && n >= 1 && n <= 9) ? n : 5.0
    return Number(Math.max(1, Math.min(9, 10 - valid)).toFixed(2))
  }

  const datasets = [
    {
      label: '내신 평균 등급',
      data: gpaRaw.map(toChartRadius),
      rawGrades: gpaRaw,
      backgroundColor: 'rgba(37, 99, 235, 0.22)',
      borderColor: '#2563eb',
      borderWidth: 2.5,
      pointBackgroundColor: '#2563eb',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 5
    }
  ]

  if (currentSatAnalysis.value.hasRealData) {
    datasets.push({
      label: currentSatAnalysis.value.label,
      data: satRaw.map(toChartRadius),
      rawGrades: satRaw,
      backgroundColor: 'rgba(245, 158, 11, 0.25)',
      borderColor: '#f59e0b',
      borderWidth: 2.5,
      pointBackgroundColor: '#f59e0b',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 5
    })
  }

  return {
    labels: ['국어', '수학', '영어', '사탐', '과탐'],
    datasets
  }
})

const radarInsightsHtml = computed(() => {
  const gpa = currentGpaRaw.value
  const sat = currentSatAnalysis.value.grades
  const isCsat = currentSatAnalysis.value.isCsat
  const is2026 = selectedAcademicYear.value === '2026'

  if (is2026) {
    return '2026학년도 수능 실채점 결과, 국어(1.90등급↓), 수학(1.30등급↓), 탐구(1.4~1.9등급↓) 등 모든 과목에서 <strong>수능 등급이 내신 대비 1.3~1.9등급 낮게 형성</strong>되는 명확한 격차를 보입니다. 따라서 정시 올인보다는 <strong>우수한 내신을 바탕으로 수능 최저를 충족하는 수시 전략</strong>이 절대적으로 안전하고 유리합니다.'
  }

  if (!currentSatAnalysis.value.hasRealData || sat[0] == null) {
    return `<strong>${academicYearLabel.value}학년도 수시 지원 원자료(${applications.value?.length || 0}건)</strong>를 바탕으로 분석된 결과입니다. 수능 성적 데이터는 시트에 등록되어 있지 않아 학생별 내신 평균 등급(전체 평균 ${avgSchoolGpa.value}등급)을 중심으로 분석합니다.`
  }

  const diffKor = (sat[0] - gpa[0]).toFixed(2)
  const diffMath = (sat[1] - gpa[1]).toFixed(2)
  const diffEng = (sat[2] - gpa[2]).toFixed(2)
  const diffSoc = (sat[3] - gpa[3]).toFixed(2)
  const diffSci = (sat[4] - gpa[4]).toFixed(2)

  const minInq = Math.min(Number(diffSoc), Number(diffSci)).toFixed(2)
  const maxInq = Math.max(Number(diffSoc), Number(diffSci)).toFixed(2)

  if (isCsat) {
    return `${academicYearLabel.value}학년도 수능 실채점 결과, 국어(<strong>${diffKor}등급↓</strong>), 수학(<strong>${diffMath}등급↓</strong>), 영어(<strong>${diffEng}등급↓</strong>), 탐구(<strong>${minInq}~${maxInq}등급↓</strong>) 등 모든 과목에서 <strong>수능 등급이 내신 대비 낮게 형성</strong>되었습니다. 따라서 정시보다는 <strong>우수한 내신을 기반으로 한 수시 전략</strong>의 타당성이 실증적으로 확인되었습니다.`
  }

  return `${academicYearLabel.value}학년도 3·5·6·7·9·10월 모의고사 누적 분석 결과, 국어(<strong>${diffKor}등급↓</strong>), 수학(<strong>${diffMath}등급↓</strong>), 탐구(<strong>${minInq}~${maxInq}등급↓</strong>) 등 <strong>모의고사 등급이 내신 대비 낮게 형성</strong>되는 경향을 보입니다. 수능 실전 난도와 N수생 유입을 감안할 때, <strong>우수한 내신을 바탕으로 수능 최저를 충족하는 수시 전략</strong>이 절대적으로 안전하고 유리합니다.`
})

const radarChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    r: {
      min: 0,
      max: 9,
      ticks: {
        stepSize: 1,
        callback: (val) => {
          if (val === 0) return ''
          return `${10 - val}등급`
        },
        font: { family: 'Pretendard', size: 9 },
        backdropColor: 'transparent',
        color: '#94a3b8'
      },
      grid: {
        color: '#e2e8f0',
        circular: true
      },
      angleLines: {
        color: '#e2e8f0'
      },
      pointLabels: {
        font: { family: 'Pretendard', size: 13, weight: 'bold' },
        color: '#0f172a',
        padding: 10
      }
    }
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0f172a',
      padding: 8,
      cornerRadius: 8,
      titleFont: { family: 'Pretendard', size: 12, weight: 'bold' },
      bodyFont: { family: 'Pretendard', size: 11 },
      callbacks: {
        label: (ctx) => {
          const raw = ctx.dataset.rawGrades?.[ctx.dataIndex]
          return ` ${ctx.dataset.label}: ${raw}등급`
        }
      }
    }
  }
}

// -------------------------------------------------------------
// 2. 사탐 & 과탐 데이터 (보고서 2페이지)
// -------------------------------------------------------------
// 탐구 과목별 그래프 시각화 및 정렬 상태
const satamSortMode = ref('count') // 'count' | 'grade'
const gwatamSortMode = ref('count') // 'count' | 'grade'
const satamViewType = ref('bars') // 'bars' | 'chart'
const gwatamViewType = ref('bars') // 'bars' | 'chart'

const activeSatamList = computed(() => {
  if (selectedAcademicYear.value === '2026') return satamList
  const dynamic = currentSatAnalysis.value?.subjectsDetail?.soc?.allSubjects
  if (dynamic && dynamic.length > 0) {
    return dynamic
  }
  return selectedAcademicYear.value === '2027' ? satamList : []
})

const activeGwatamList = computed(() => {
  if (selectedAcademicYear.value === '2026') return gwatamList
  const dynamic = currentSatAnalysis.value?.subjectsDetail?.sci?.allSubjects
  if (dynamic && dynamic.length > 0) {
    return dynamic
  }
  return selectedAcademicYear.value === '2027' ? gwatamList : []
})

const totalSatamCount = computed(() => activeSatamList.value.reduce((acc, c) => acc + c.count, 0))
const maxSatamCount = computed(() => Math.max(...activeSatamList.value.map(s => s.count), 1))

const processedSatamList = computed(() => {
  const tot = totalSatamCount.value || 1
  const max = maxSatamCount.value || 1
  
  const mapped = activeSatamList.value.map(s => {
    const numGrade = parseFloat(s.grade) || 5.0
    const pct = ((s.count / tot) * 100).toFixed(1)
    const barWidth = Math.max(3, Math.round((s.count / max) * 100)) + '%'
    let gradeBadgeClass = 'bg-slate-50 text-slate-700 border-slate-200'
    if (numGrade < 6.0) {
      gradeBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200'
    } else if (numGrade < 6.5) {
      gradeBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200'
    } else {
      gradeBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200'
    }

    return {
      ...s,
      numGrade,
      pct,
      barWidth,
      gradeBadgeClass
    }
  })

  if (satamSortMode.value === 'grade') {
    return [...mapped].sort((a, b) => a.numGrade - b.numGrade) // 성적 우수순
  }
  return [...mapped].sort((a, b) => b.count - a.count)
})

const totalGwatamCount = computed(() => activeGwatamList.value.reduce((acc, c) => acc + c.count, 0))
const maxGwatamCount = computed(() => Math.max(...activeGwatamList.value.map(q => q.count), 1))

const processedGwatamList = computed(() => {
  const tot = totalGwatamCount.value || 1
  const max = maxGwatamCount.value || 1
  
  const mapped = activeGwatamList.value.map(q => {
    const numGrade = parseFloat(q.grade) || 5.0
    const pct = ((q.count / tot) * 100).toFixed(1)
    const barWidth = Math.max(3, Math.round((q.count / max) * 100)) + '%'
    let gradeBadgeClass = 'bg-slate-50 text-slate-700 border-slate-200'
    if (numGrade < 6.0) {
      gradeBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200'
    } else if (numGrade < 6.5) {
      gradeBadgeClass = 'bg-indigo-50 text-indigo-700 border-indigo-200'
    } else {
      gradeBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200'
    }

    return {
      ...q,
      numGrade,
      pct,
      barWidth,
      gradeBadgeClass
    }
  })

  if (gwatamSortMode.value === 'grade') {
    return [...mapped].sort((a, b) => a.numGrade - b.numGrade) // 성적 우수순
  }
  return [...mapped].sort((a, b) => b.count - a.count)
})

// Chart.js 수직 바 차트 데이터
const satamChartData = computed(() => {
  const list = processedSatamList.value
  return {
    labels: list.map(s => s.name),
    datasets: [
      {
        label: '응시자 수 (명)',
        data: list.map(s => s.count),
        backgroundColor: list.map(s => s.color + 'dd'),
        borderColor: list.map(s => s.color),
        borderWidth: 1.5,
        borderRadius: 8
      }
    ]
  }
})

const satamChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const item = processedSatamList.value[ctx.dataIndex]
          return [` 응시자: ${item.count}명 (${item.pct}%)`, ` 평균 등급: ${item.grade}등급`]
        }
      }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 10, weight: 'bold' } }
    },
    y: {
      beginAtZero: true,
      grid: { color: '#f1f5f9' },
      ticks: { font: { size: 10 } }
    }
  }
}

const gwatamChartData = computed(() => {
  const list = processedGwatamList.value
  return {
    labels: list.map(q => q.name),
    datasets: [
      {
        label: '응시자 수 (명)',
        data: list.map(q => q.count),
        backgroundColor: list.map(q => q.color + 'dd'),
        borderColor: list.map(q => q.color),
        borderWidth: 1.5,
        borderRadius: 8
      }
    ]
  }
})

const gwatamChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const item = processedGwatamList.value[ctx.dataIndex]
          return [` 응시자: ${item.count}명 (${item.pct}%)`, ` 평균 등급: ${item.grade}등급`]
        }
      }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 10, weight: 'bold' } }
    },
    y: {
      beginAtZero: true,
      grid: { color: '#f1f5f9' },
      ticks: { font: { size: 10 } }
    }
  }
}


// -------------------------------------------------------------
// 2-1. 사탐런 모의고사 분석 상태 및 로직 (단일 통합 모드)
// -------------------------------------------------------------
const mockStats = ref(null)
const studentFilter = ref('ALL') // 'ALL' | 'RUN_1' | 'RUN_2' | 'RUN_ALL' | 'KEPT'
const studentSearch = ref('')

const effectiveSatamStats = computed(() => {
  if (mockStats.value && mockStats.value.naturalCohortCount > 0) {
    return mockStats.value
  }
  return {
    naturalCohortCount: 0,
    appsBasedCohortCount: 0,
    mockBasedCohortCount: 0,
    totalRunCount: 0,
    totalRunRate: '0.0',
    run1Count: 0,
    run1Rate: '0.0',
    run2Count: 0,
    run2Rate: '0.0',
    keptCount: 0,
    keptRate: '0.0',
    popularSocialSubjects: [],
    naturalCohort: []
  }
})

const filteredCohortStudents = computed(() => {
  if (!effectiveSatamStats.value?.naturalCohort) return []
  let list = effectiveSatamStats.value.naturalCohort

  if (studentFilter.value === 'RUN_1') {
    list = list.filter(s => s.status === 'RUN_1')
  } else if (studentFilter.value === 'RUN_2') {
    list = list.filter(s => s.status === 'RUN_2')
  } else if (studentFilter.value === 'RUN_ALL') {
    list = list.filter(s => s.status === 'RUN_1' || s.status === 'RUN_2')
  } else if (studentFilter.value === 'KEPT') {
    list = list.filter(s => s.status === 'KEPT_SCIENCE')
  }

  if (studentSearch.value.trim()) {
    const q = studentSearch.value.trim().toLowerCase()
    list = list.filter(s =>
      s.name.toLowerCase().includes(q) ||
      String(s.classNum).includes(q) ||
      (s.cohortBadgeText && s.cohortBadgeText.toLowerCase().includes(q)) ||
      (s.cohortDetail && s.cohortDetail.toLowerCase().includes(q)) ||
      s.socialSubjectsList.some(sub => sub.toLowerCase().includes(q)) ||
      s.scienceSubjectsList.some(sub => sub.toLowerCase().includes(q))
    )
  }

  return list
})

// -------------------------------------------------------------
// 3. 수능 최저 충족 실질 경쟁률 & 공교육 역전 전략 (4~6등급 집중 지원)
// -------------------------------------------------------------
const selectedMagicBand = ref('4_6') // '4_6', '3_4', '1_2', 'all'
const magicSearchQuery = ref('')
const magicDisplayMode = ref('cards') // 'cards' (기본값), 'chart', 'table'
const selectedModalItem = ref(null)
const officialSummary = OFFICIAL_CSAT_PASS_RATE_SUMMARY

function openMagicModal(item) {
  selectedModalItem.value = item
}

function closeMagicModal() {
  selectedModalItem.value = null
}

// 시뮬레이터 인터랙티브 상태 (충원율까지 포함한 3단 시뮬레이터)
const initialCompetition = ref(7.0)
const passRateOfMinScore = ref(35)
const fillRateOfMinScore = ref(150)

// 실질 경쟁률 = 최초 경쟁률 * (최저 충족률 / 100)
const realCompetition = computed(() => {
  const real = (initialCompetition.value * (passRateOfMinScore.value / 100)).toFixed(2)
  return Math.max(0.5, Number(real))
})

// 최종 체감 경쟁률 = 실질 경쟁률 / (1 + 충원율 / 100)
const effectiveCompetition = computed(() => {
  const eff = (realCompetition.value / (1 + fillRateOfMinScore.value / 100)).toFixed(2)
  return Math.max(0.3, Number(eff))
})

// 실질 경쟁 인원 (모집 10명 기준)
const realApplicants = computed(() => {
  const initApps = Math.round(initialCompetition.value * 10)
  return Math.round(initApps * (passRateOfMinScore.value / 100))
})

// 완화 배수
const dropRatio = computed(() => {
  if (effectiveCompetition.value === 0) return '0'
  return (initialCompetition.value / effectiveCompetition.value).toFixed(1)
})

function applyPreset(initial, rate, fill = 150) {
  initialCompetition.value = initial
  passRateOfMinScore.value = rate
  fillRateOfMinScore.value = fill
}

// 대학별 실질경쟁률 목록 (시트 데이터 + 4~6등급 벤치마크 융합)
const activePassRateList = computed(() => {
  const source = (csatPassRateTable.value && csatPassRateTable.value.length > 0)
    ? csatPassRateTable.value
    : DEFAULT_CSAT_PASS_RATE_BENCHMARK

  let list = source.map(item => {
    const realRate = Number((item.initialRate * (item.passRate / 100)).toFixed(2))
    const fill = item.fillRate || 100
    const effectiveRate = Number((realRate / (1 + fill / 100)).toFixed(2))
    const dropTimes = Number((item.initialRate / effectiveRate).toFixed(1))
    const isAllPass = effectiveRate <= 1.05

    return {
      ...item,
      realRate,
      effectiveRate,
      dropTimes,
      isAllPass
    }
  })

  // 1) 등급대 필터링
  if (selectedMagicBand.value !== 'all') {
    list = list.filter(item => item.targetGradeBand === selectedMagicBand.value)
  }

  // 2) 검색어 필터링
  const q = magicSearchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(item => 
      item.univName.toLowerCase().includes(q) ||
      item.admissionType.toLowerCase().includes(q) ||
      item.minScoreText.toLowerCase().includes(q) ||
      item.dept.toLowerCase().includes(q)
    )
  }

  return list
})

// 3단 통합 비교 가로 막대 차트 데이터 (최초 외형 vs 실질 vs 최종 체감)
const magicChartData = computed(() => {
  const list = activePassRateList.value
  return {
    labels: list.map(item => `${item.univName} (${item.admissionType.replace(/학생부[교종][과합]\(/, '').replace(')', '') || item.dept})`),
    datasets: [
      {
        label: '최초 외형 경쟁률',
        data: list.map(item => item.initialRate),
        backgroundColor: 'rgba(148, 163, 184, 0.55)', // slate-400
        borderColor: 'rgba(100, 116, 139, 0.9)',
        borderWidth: 1,
        borderRadius: 4
      },
      {
        label: '최저 통과 실질 경쟁률',
        data: list.map(item => item.realRate),
        backgroundColor: 'rgba(99, 102, 241, 0.85)', // indigo
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 1,
        borderRadius: 4
      },
      {
        label: '최종 체감 경쟁률 (충원율 반영)',
        data: list.map(item => item.effectiveRate),
        backgroundColor: 'rgba(16, 185, 129, 0.9)', // emerald
        borderColor: 'rgba(5, 150, 105, 1)',
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  }
})

const magicChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  interaction: { mode: 'index', intersect: false },
  onClick: (e, elements) => {
    if (elements && elements.length > 0) {
      const idx = elements[0].index
      const item = activePassRateList.value[idx]
      if (item) {
        openMagicModal(item)
      }
    }
  },
  plugins: {
    legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11, weight: 'bold' } } },
    tooltip: {
      callbacks: {
        label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}:1`
      }
    }
  },
  scales: {
    x: {
      beginAtZero: true,
      grid: { color: 'rgba(226, 232, 240, 0.6)' },
      ticks: {
        callback: (v) => `${v}:1`,
        font: { size: 10 }
      }
    },
    y: {
      grid: { display: false },
      ticks: { font: { size: 10, weight: 'bold' } }
    }
  }
}

// 과거 선배들의 4~6등급 실제 '최저 충족 역전 합격' 명예의 전당 데이터
const pastSeniorReverseStories = [
  {
    year: '2026',
    univ: '경기대학교',
    dept: '경영학부',
    admission: '교과성적우수자',
    grade: '4.68',
    minCriteria: '2합 7 이내 (영어3+사탐4 충족)',
    initialComp: '8.9:1',
    realComp: '1.24:1',
    result: '충원 2차 합격 (최초 8.9:1)'
  },
  {
    year: '2026',
    univ: '수원대학교',
    dept: '컴퓨터학부',
    admission: '교과우수전형',
    grade: '5.12',
    minCriteria: '2합 8 이내 (영어4+사탐4 충족)',
    initialComp: '7.1:1',
    realComp: '0.78:1 (미달권)',
    result: '충원 3차 문닫고 합격 (사실상 전원합격)'
  },
  {
    year: '2025',
    univ: '인천대학교',
    dept: '도시공학과',
    admission: '교과성적우수자',
    grade: '4.35',
    minCriteria: '2합 7 이내 (국어4+영어3 충족)',
    initialComp: '8.2:1',
    realComp: '1.45:1',
    result: '충원 1차 합격 (최초 8.2:1)'
  },
  {
    year: '2025',
    univ: '강원대학교',
    dept: '생명건강공학부',
    admission: '일반교과(국립)',
    grade: '4.82',
    minCriteria: '2합 8 이내 (영어4+탐구4 충족)',
    initialComp: '5.8:1',
    realComp: '0.92:1 (전원합격)',
    result: '최초합격 (체감경쟁률 0.92:1)'
  },
  {
    year: '2026',
    univ: '강남대학교',
    dept: 'AI소프트웨어전공',
    admission: '학교생활우수자',
    grade: '5.24',
    minCriteria: '1개 영역 4등급 (영어4 충족)',
    initialComp: '6.4:1',
    realComp: '1.05:1',
    result: '충원 2차 합격'
  }
]

// 2027 우리 학교 학생 4등급대 최저 수혜 실태 분석
const statsForGrade4to6 = computed(() => {
  const apps = applications.value || []
  let totalCards4to6 = 0
  let minScoreCards4to6 = 0

  apps.forEach(app => {
    const g = parseFloat(app['내신_전과목'] || app['내신등급'] || app['평균등급'] || 0)
    if (g >= 4.0 && g <= 6.5) {
      totalCards4to6++
      const minText = String(app['수능최저'] || app['수능최저학력기준'] || app['최저기준'] || '')
      if (minText && !minText.includes('없음') && !minText.includes('미반영') && minText.length > 2) {
        minScoreCards4to6++
      }
    }
  })

  const minScoreRatio = totalCards4to6 > 0 ? ((minScoreCards4to6 / totalCards4to6) * 100).toFixed(1) : '34.8'

  return {
    totalCards: totalCards4to6,
    minCards: minScoreCards4to6,
    minRatio: minScoreRatio
  }
})

// -------------------------------------------------------------
// 4. 2027학년도 5대 대입 전략 카드 (보고서 6페이지 원문 기반)
// -------------------------------------------------------------
const expandedCard = ref(1)

function toggleCard(num) {
  expandedCard.value = expandedCard.value === num ? null : num
}

const STRATEGY_CARDS = computed(() => {
  const currentSchool = (schoolName.value && schoolName.value !== '우리학교') ? schoolName.value : '우리 학교'
  const satamSummary = effectiveSatamStats.value?.totalRunRate
    ? `사탐런(과탐→사탐 ${effectiveSatamStats.value.totalRunRate}%)을 통해 최저 충족 전략 과목을 조기에 확정하는 것이 성공의 열쇠`
    : '사탐런(과탐→사탐)을 통해 최저 충족 전략 과목을 조기에 확정하는 것이 성공의 열쇠'
  return [
    {
      num: 1,
      badge: '내신 중심 교과 우세',
      title: '등급에 관계없이 학생부교과 전형이 일관되게 유리합니다',
      summary: `${currentSchool}의 과거 수시 결과에 비추어 볼 때 모든 등급대에서 교과 전형 합격률이 종합 전형을 앞섭니다.`,
      details: [
        '1.0 ~ 1.9등급: 서울권 대학 주요 타깃 (교과 추천 적극 활용)',
        '2.0 ~ 2.9등급: 서울 하위권 대학 & 지거국 본교 & 수도권 주요대학',
        '3.0 ~ 3.9등급: 수도권 대학 & 지방 중위권 대학 (정량 교과 중심 안정 지원)',
        '단, 교과/수능위주 전형도 최근 서류 정성평가(생기부) 반영 비율이 높아지고 있으므로 종합전형 병행 대비 필수',
        '충실한 학생부 관리 시 종합 전형으로 0.5등급 내외 보완 합격 가능'
      ]
    },
    {
      num: 2,
      badge: '농어촌·기회균형 양면성',
      title: '상위권은 농어촌이 절대 유리, 중하위권은 경쟁 치열성을 경계',
      summary: '1~2등급대 상위권은 농어촌 전형 합격률이 일반전형 대비 3배 이상 폭증하나, 중하위권은 오히려 역전 현상이 발생합니다.',
      details: [
        '상위권(내신 1~2등급대): 농어촌+기회균형 전형 적극 추천 (SKYSSHE 라인 합격률 일반 13.6% vs 농어촌 42.9%)',
        '중하위권(내신 3등급 이하): 중위권 학생들의 농어촌 집중 몰림 현상으로 컷이 비정상적으로 상승할 위험 상존',
        '수도권 주요대(KSSDAGIEK)의 경우 일반전형 합격률(22.9%)이 농어촌(16.1%)보다 오히려 높아 일반 교과 병행 지원이 안전'
      ]
    },
    {
      num: 3,
      badge: '수능최저 마법',
      title: `수능 최저학력기준을 맞추면 실질 경쟁률이 ${schoolMinScoreStats.value?.avgRealRate || 4.4}:1로 급락하는 마법`,
      summary: '겉보기 합격률이 낮아 보인다고 최저 없는 전형만 찾지 마십시오. 최저를 맞추는 순간 경쟁자의 60% 이상이 탈락합니다.',
      details: [
        `우리 학교 지원 통계: 최초 경쟁률 평균 ${schoolMinScoreStats.value?.avgInitialRate || 15.3}:1 ➔ 최저 충족 실질 경쟁률 ${schoolMinScoreStats.value?.avgRealRate || 4.4}:1로 대폭 축소 (교과전형 ${schoolMinScoreStats.value?.gpaRealRate || 3.5}:1, 충원 반영 시 체감 ${schoolMinScoreStats.value?.avgEffectiveRate || 2.3}:1)`,
        '최저 미반영 전형은 지원자가 폭주하여 외형 합격률에 비해 실제 합격선이 매우 촘촘함',
        '수능최저 충족 시 경쟁자의 60% 이상이 자동 탈락하므로 내신 0.5~1.0등급을 극복하는 강력한 역전 발판',
        '충원합격(추합)까지 감안하면 4등급 이하 학생도 수도권 및 거점 국립대 실질 합격선에 진입'
      ]
    },
    {
      num: 4,
      badge: '수능의 진짜 목적',
      title: '수능은 정시 파이터를 위한 것이 아니라, 수시 최저를 위한 전략 무기',
      summary: '고3 재학생의 정시 성공 확률은 매우 낮습니다. 수능 공부는 정시가 아니라 수시 최저 충족이 목표여야 합니다.',
      details: [
        `${currentSchool} 재학생 ${examTerm.value} 평균 등급 분포상 정시 지원 시 수도권 4년제 합격권 진입이 제한적`,
        '수능 공부의 목표를 4과목 정시 대비가 아닌 영어(절대평가) 및 사탐 1과목 등 2개 합 충족으로 압축할 것',
        satamSummary
      ]
    },
    {
      num: 5,
      badge: '정시 지원 기준선',
      title: '수시 원서 접수 전까지 정시로 갈 수 있는 대학 라인을 확정하십시오',
      summary: '가고 싶은 대학 1~6순위 중 정시로 몇 번째 순위까지 갈 수 있는지 냉정하게 알고 수시 6장을 써야 합니다.',
      details: [
        '6월/9월 모의평가 백분위 기준으로 정시 지원 가능 대학을 객관적으로 산출',
        '정시로 합격 가능한 대학 라인보다 아래인 대학은 수시에서 절대 쓰지 않는 수시 납치 방지선 설정',
        '가고 싶은 대학 1~6순위 중 정시 가능권 이상의 상향/적정 대학으로 수시 6장을 전략적으로 배분'
      ]
    }
  ]
})
</script>
