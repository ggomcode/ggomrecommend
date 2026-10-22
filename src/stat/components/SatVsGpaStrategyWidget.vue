<template>
  <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm transition-all duration-300">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/80 mb-2">
          <span>🎯</span>
          <span>내신 vs 수능 괴리도 & 2027 대입 전략</span>
          <span class="text-indigo-300">|</span>
          <span class="text-slate-500 font-semibold">괴리도 & 전략 분석</span>
        </div>
        <h3 class="text-lg sm:text-xl font-black text-slate-900 tracking-tight m-0">
          내신 vs 수능 불균형(괴리도) 분석 & 2027학년도 5대 대입 핵심 전략
        </h3>
        <p class="text-xs text-slate-500 m-0 mt-1 leading-relaxed">
          내신 대비 수능 과목별 등급 격차(오망성), 사탐런 현황, 수능최저 충족 실질경쟁률 및 2027학년도 5대 대입 전략을 종합 분석합니다.
        </p>
      </div>

      <!-- Quick KPI Badges -->
      <div class="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
        <div class="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-right">
          <span class="text-[10px] text-amber-800 block font-semibold">사탐런 전향율</span>
          <span class="text-sm font-black text-amber-700 font-mono">48.7% <span class="text-[11px] font-medium text-amber-600">(56명)</span></span>
        </div>
        <div class="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-right">
          <span class="text-[10px] text-blue-800 block font-semibold">최저 충족 마법</span>
          <span class="text-sm font-black text-blue-700 font-mono">6:1 ➔ 2:1</span>
        </div>
      </div>
    </div>

    <!-- Sub-tab Navigation Buttons -->
    <div class="flex flex-wrap items-center gap-2 pt-5 pb-3">
      <button
        v-for="tab in subTabs"
        :key="tab.id"
        type="button"
        @click="activeSubTab = tab.id"
        :class="[
          'px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer border',
          activeSubTab === tab.id
            ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]'
            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
        ]"
      >
        <span>{{ tab.emoji }}</span>
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- Content 1: 내신 vs 수능 오망성 괴리도 & 선택과목 비교 -->
    <div v-if="activeSubTab === 'radar'" class="mt-4 pt-4 border-t border-slate-100 space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <!-- Left: 오망성 방사형 차트 -->
        <div class="lg:col-span-6 bg-slate-50/70 rounded-3xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div class="flex items-center justify-between mb-2">
            <div>
              <div class="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <span>📊</span>
                <span>과목별 내신 vs 수능 등급 비교</span>
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
                <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span> 수능
              </span>
            </div>
          </div>

          <!-- Radar Chart Container -->
          <div class="h-68 relative flex items-center justify-center my-2">
            <Radar :data="radarChartData" :options="radarChartOptions" />
          </div>

          <!-- Insights Alert -->
          <div class="mt-2 p-3 bg-blue-50/80 rounded-2xl border border-blue-200/80 text-xs text-blue-900 leading-relaxed">
            <span class="font-extrabold">💡 등급 비교 핵심 분석:</span> 
            국어(1.90등급↓), 수학(1.30등급↓), 탐구(1.4~1.9등급↓) 등 모든 과목에서 <strong>수능 등급이 내신 대비 1.3~1.9등급 낮게 형성</strong>되는 명확한 격차를 보입니다.
            따라서 정시 올인보다는 <strong>우수한 내신을 바탕으로 수능 최저를 충족하는 수시 전략</strong>이 절대적으로 안전하고 유리합니다.
          </div>
        </div>

        <!-- Right: 주요 영역별 수능 선택과목 통계 테이블 & 미적/확통, 언매/화작 격차 -->
        <div class="lg:col-span-6 flex flex-col gap-4">
          <!-- 언어 / 수리 / 외국어 상세 요약 카드 -->
          <div class="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-black text-slate-900 m-0 flex items-center gap-1.5">
                <span>📝</span>
                <span>수능 주요 영역 응시자 수 및 평균 등급</span>
              </h4>
              <span class="text-[11px] text-slate-500 font-mono">2026 수능 응시 227명 기준</span>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-xs text-left border-collapse">
                <thead>
                  <tr class="bg-slate-100/80 text-slate-700 font-bold border-y border-slate-200">
                    <th class="p-2.5">영역</th>
                    <th class="p-2.5">구분</th>
                    <th class="p-2.5 text-center">응시 인원</th>
                    <th class="p-2.5 text-center">평균 등급</th>
                    <th class="p-2.5">특징 및 최저 충족 유불리</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 font-medium">
                  <!-- 국어 -->
                  <tr>
                    <td rowspan="3" class="p-2.5 font-bold text-slate-900 bg-slate-50/50 border-r border-slate-100">
                      국어
                    </td>
                    <td class="p-2 text-slate-600 font-semibold">전체</td>
                    <td class="p-2 text-center font-mono font-bold text-slate-800">227명</td>
                    <td class="p-2 text-center font-mono font-bold text-slate-800">6.10</td>
                    <td class="p-2 text-[11px] text-slate-500">내신(4.20) 대비 -1.90등급 괴리</td>
                  </tr>
                  <tr class="bg-blue-50/30">
                    <td class="p-2 text-blue-700 font-bold">언어와 매체</td>
                    <td class="p-2 text-center font-mono font-bold text-blue-700">36명</td>
                    <td class="p-2 text-center font-mono font-bold text-blue-700">5.28</td>
                    <td class="p-2 text-[11px] text-blue-800 font-semibold">화작 대비 +0.98등급 우세 (최저 주력)</td>
                  </tr>
                  <tr>
                    <td class="p-2 text-slate-600">화법과 작문</td>
                    <td class="p-2 text-center font-mono text-slate-700">191명</td>
                    <td class="p-2 text-center font-mono text-slate-700">6.26</td>
                    <td class="p-2 text-[11px] text-slate-500">대다수 학생 선택(84.1%), 등급 정체</td>
                  </tr>

                  <!-- 수학 -->
                  <tr class="border-t border-slate-200">
                    <td rowspan="3" class="p-2.5 font-bold text-slate-900 bg-slate-50/50 border-r border-slate-100">
                      수학
                    </td>
                    <td class="p-2 text-slate-600 font-semibold">전체</td>
                    <td class="p-2 text-center font-mono font-bold text-slate-800">214명</td>
                    <td class="p-2 text-center font-mono font-bold text-slate-800">5.80</td>
                    <td class="p-2 text-[11px] text-slate-500">내신(4.50) 대비 -1.30등급 괴리</td>
                  </tr>
                  <tr class="bg-indigo-50/40">
                    <td class="p-2 text-indigo-700 font-bold">미적분</td>
                    <td class="p-2 text-center font-mono font-bold text-indigo-700">69명</td>
                    <td class="p-2 text-center font-mono font-bold text-indigo-700">4.71</td>
                    <td class="p-2 text-[11px] text-indigo-800 font-semibold">확통 대비 무려 +1.61등급 우세</td>
                  </tr>
                  <tr>
                    <td class="p-2 text-slate-600">확률과 통계</td>
                    <td class="p-2 text-center font-mono text-slate-700">145명</td>
                    <td class="p-2 text-center font-mono text-slate-700">6.32</td>
                    <td class="p-2 text-[11px] text-slate-500">수학 최저 맞추기 가장 어려운 영역</td>
                  </tr>

                  <!-- 영어 -->
                  <tr class="border-t border-slate-200">
                    <td class="p-2.5 font-bold text-slate-900 bg-slate-50/50 border-r border-slate-100">
                      영어
                    </td>
                    <td class="p-2 text-emerald-700 font-bold">절대평가</td>
                    <td class="p-2 text-center font-mono font-bold text-emerald-700">221명</td>
                    <td class="p-2 text-center font-mono font-bold text-emerald-700">4.94</td>
                    <td class="p-2 text-[11px] text-emerald-800 font-semibold">전 영역 중 최우수 등급, 수능 최저 제1 전략 과목</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 과목별 비교 바 차트 -->
          <div class="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs">
            <h4 class="text-sm font-black text-slate-900 mb-2 flex items-center justify-between">
              <span>선택과목별 등급 격차 시각화</span>
              <span class="text-[11px] text-slate-500 font-normal">낮을수록 우수 (1등급 기준)</span>
            </h4>
            <div class="h-36">
              <Bar :data="subjectComparisonBarData" :options="subjectBarOptions" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content 2: 사탐런 & 사회/과학탐구 응시 상세 현황 -->
    <div v-else-if="activeSubTab === 'satamRun'" class="mt-4 pt-4 border-t border-slate-100 space-y-6">
      <!-- 상단 모드 전환 및 모의고사 분석 컨트롤 바 -->
      <div class="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
            <span class="text-xs font-black text-slate-800">사탐런 분석 모드:</span>
            <div class="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200 text-xs">
              <button
                type="button"
                @click="satamMode = 'OFFICIAL'"
                :class="[
                  'px-3 py-1 rounded-lg font-bold transition-all cursor-pointer',
                  satamMode === 'OFFICIAL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                ]"
              >
                📄 공식 보고서 기준
              </button>
              <button
                type="button"
                @click="satamMode = 'MOCK_ANALYSIS'"
                :class="[
                  'px-3 py-1 rounded-lg font-bold transition-all cursor-pointer',
                  satamMode === 'MOCK_ANALYSIS' ? 'bg-orange-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                ]"
              >
                📊 모의고사 원자료 분석
              </button>
            </div>
          </div>

          <!-- 액션 버튼군 -->
          <div class="flex flex-wrap items-center gap-2">
            <!-- 배포 구글 시트 2027가채점 실시간 연동 -->
            <button
              type="button"
              @click="syncFromGoogleSheetMockData"
              :disabled="isAnalyzingMock"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 transition-all cursor-pointer shadow-2xs"
            >
              <span>🌐</span>
              <span v-if="isAnalyzingMock">가채점 시트 연동 중...</span>
              <span v-else>배포 시트 '2027가채점' 연동</span>
            </button>

            <!-- 엑셀 파일 업로드 -->
            <label class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:border-orange-500 hover:text-orange-600 transition-all cursor-pointer shadow-2xs">
              <span>📁</span>
              <span>모의고사 엑셀 분석 (.xlsx, .csv)</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                class="hidden"
                @change="handleMockFileUpload"
              />
            </label>

            <!-- 115명 실증 샘플 데이터 로드 -->
            <button
              type="button"
              @click="loadSampleMockData"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 text-orange-800 hover:from-orange-100 hover:to-amber-100 transition-all cursor-pointer shadow-2xs"
            >
              <span>💡</span>
              <span>115명 실증 샘플 로드</span>
            </button>

            <!-- 서식 및 로마자 표기 안내 팝오버 토글 -->
            <button
              type="button"
              @click="showFormatGuide = !showFormatGuide"
              class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <span>ℹ️</span>
              <span>표기·서식 안내</span>
            </button>

            <!-- 초기화 버튼 (분석 결과가 있을 때) -->
            <button
              v-if="mockStats"
              type="button"
              @click="resetMockAnalysis"
              class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-all cursor-pointer"
            >
              <span>🔄</span>
              <span>초기화</span>
            </button>
          </div>
        </div>

        <!-- 에러 메시지 -->
        <div v-if="mockAnalysisError" class="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <span>⚠️</span>
          <span>{{ mockAnalysisError }}</span>
        </div>

        <!-- 서식 & 로마자/숫자 표기 호환 안내 박스 -->
        <div v-if="showFormatGuide" class="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-2">
          <div class="font-black text-amber-900 flex items-center gap-1.5 text-sm">
            <span>🔍</span>
            <span>사탐런 자동 판별 규칙 및 표기 호환 가이드</span>
          </div>
          <ul class="list-disc list-inside space-y-1 text-slate-700 pl-1">
            <li>
              <strong>자연계열(이과) 모수 선별:</strong> 3월부터 10월 모의고사 기간 중 <code>미적분</code>, <code>기하</code>, <code>과탐 8개 과목</code> 중 <strong>단 1개라도 응시한 이력</strong>이 있는 학생을 자동 추출합니다.
            </li>
            <li>
              <strong>사탐런 판정 기준:</strong> 위 모수 학생 중 <strong>가장 마지막 모의고사(10월 학평 등)</strong>에서 사회탐구를 <strong>1과목(과탐1+사탐1)</strong> 또는 <strong>2과목(사탐2)</strong> 선택한 경우를 사탐런으로 집계합니다.
            </li>
            <li>
              <strong>선택과목 표기 유연성 지원:</strong>
              <span class="inline-block bg-white px-2 py-0.5 rounded border border-amber-200 font-mono text-[11px] text-amber-900 ml-1">
                물리학Ⅰ, 물리학I, 물리학1, 물리1, 생명과학Ⅱ, 생명2, 지학I, 화학 Ⅱ 등
              </span>
              로마자(I, II), 로마자 특수문자(Ⅰ, Ⅱ), 숫자(1, 2) 및 공백, 축약명을 모두 100% 자동 정규화합니다.
            </li>
            <li>
              <strong>지원 엑셀 서식:</strong> 시트별 탭 분리(‘3월’, ‘6월’, ‘10월’ 등) 또는 단일 시트 롱 포맷(시험명, 이름, 수학, 탐구1, 탐구2)을 모두 자동 지원합니다.
            </li>
          </ul>
        </div>
      </div>

      <!-- 사탐런 인포그래픽 상단 배너 (공식 vs 원자료 분석 동적 전환) -->
      <div class="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div class="relative z-10">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-xs">
              <span>🚀</span>
              <span v-if="satamMode === 'OFFICIAL'">2026학년도 대입 최대 이슈: 사탐런 (과탐 ➔ 사탐 전향)</span>
              <span v-else>실시간 모의고사 원자료 분석: {{ mockFileName || '분석 대기 중' }}</span>
            </div>
            <span v-if="satamMode === 'MOCK_ANALYSIS' && mockStats" class="text-xs font-bold bg-white/30 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
              자연계열 모수: {{ mockStats.naturalCohortCount }}명
            </span>
          </div>

          <!-- 타이틀 -->
          <h3 class="text-xl sm:text-2xl font-black tracking-tight m-0">
            <template v-if="satamMode === 'OFFICIAL' || !mockStats">
              이과 수능 응시자 중 절반(48.7%)이 사탐으로 전향했습니다
            </template>
            <template v-else>
              자연계열 학생 중 {{ mockStats.totalRunRate }}% ({{ mockStats.totalRunCount }}명)가 사탐으로 전향했습니다
            </template>
          </h3>

          <p class="text-xs text-white/90 mt-1.5 max-w-2xl leading-relaxed">
            <template v-if="satamMode === 'OFFICIAL' || !mockStats">
              자연계열 지망 학생(115명 추정) 중 무려 <strong>56명(48.7%)</strong>이 과탐의 극심한 내신/수능 등급 방어 부담을 덜기 위해 사회탐구로 과목을 전환했습니다.
              이는 수능 최저학력기준 충족 확률을 비약적으로 끌어올리는 주효한 전략으로 작용했습니다.
            </template>
            <template v-else>
              3월~10월 모의고사 중 미적/기하/과탐 이력이 있는 자연계열 학생 <strong>{{ mockStats.naturalCohortCount }}명</strong> 중 <strong>{{ mockStats.totalRunCount }}명({{ mockStats.totalRunRate }}%)</strong>이 최종 모의고사에서 사탐 과목을 선택했습니다.
            </template>
          </p>

          <!-- 3개/4개 통계 카드 그리드 -->
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/20">
            <!-- 사탐런 전체 전향자 -->
            <div class="bg-white/10 rounded-2xl p-3 backdrop-blur-xs">
              <div class="text-[11px] text-white/80 font-semibold">사탐런 전체 전향자</div>
              <div class="text-2xl font-black font-mono">
                <template v-if="satamMode === 'OFFICIAL' || !mockStats">56명 <span class="text-sm font-bold opacity-80">(48.7%)</span></template>
                <template v-else>{{ mockStats.totalRunCount }}명 <span class="text-sm font-bold opacity-80">({{ mockStats.totalRunRate }}%)</span></template>
              </div>
              <div class="text-[10px] text-white/70 mt-0.5">이과생 중 전향 비율</div>
            </div>

            <!-- 1과목 전향 -->
            <div class="bg-white/10 rounded-2xl p-3 backdrop-blur-xs">
              <div class="text-[11px] text-white/80 font-semibold">1과목 전향 (과탐1 + 사탐1)</div>
              <div class="text-2xl font-black font-mono">
                <template v-if="satamMode === 'OFFICIAL' || !mockStats">30명 <span class="text-sm font-bold opacity-80">(26.1%)</span></template>
                <template v-else>{{ mockStats.run1Count }}명 <span class="text-sm font-bold opacity-80">({{ mockStats.run1Rate }}%)</span></template>
              </div>
              <div class="text-[10px] text-white/70 mt-0.5">자연계 요건 유지 + 최저 확보</div>
            </div>

            <!-- 2과목 전향 -->
            <div class="bg-white/10 rounded-2xl p-3 backdrop-blur-xs">
              <div class="text-[11px] text-white/80 font-semibold">2과목 전향 (사탐2)</div>
              <div class="text-2xl font-black font-mono">
                <template v-if="satamMode === 'OFFICIAL' || !mockStats">26명 <span class="text-sm font-bold opacity-80">(22.6%)</span></template>
                <template v-else>{{ mockStats.run2Count }}명 <span class="text-sm font-bold opacity-80">({{ mockStats.run2Rate }}%)</span></template>
              </div>
              <div class="text-[10px] text-white/70 mt-0.5">인문 교차지원 및 완전 최저 대비</div>
            </div>

            <!-- 과탐 2과목 유지자 -->
            <div class="bg-white/10 rounded-2xl p-3 backdrop-blur-xs">
              <div class="text-[11px] text-white/80 font-semibold">과탐 유지 (과탐2)</div>
              <div class="text-2xl font-black font-mono">
                <template v-if="satamMode === 'OFFICIAL' || !mockStats">59명 <span class="text-sm font-bold opacity-80">(51.3%)</span></template>
                <template v-else>{{ mockStats.keptCount }}명 <span class="text-sm font-bold opacity-80">({{ mockStats.keptRate }}%)</span></template>
              </div>
              <div class="text-[10px] text-white/70 mt-0.5">정통 자연계열 과탐 고수</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 모의고사 원자료 분석 모드: 학생별 전향 상세 내역 및 인기 사탐 과목 통계 -->
      <div v-if="satamMode === 'MOCK_ANALYSIS' && mockStats" class="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h4 class="text-sm font-black text-slate-900 m-0 flex items-center gap-1.5">
              <span>👥</span>
              <span>자연계열 학생별 3월 ➔ 최종(10월) 모의고사 응시 변화 내역</span>
            </h4>
            <p class="text-[11px] text-slate-500 m-0 mt-0.5">
              미적분/기하/과탐 이력 학생 {{ mockStats.naturalCohortCount }}명 전원의 탐구 과목 이동을 전수 추적한 결과입니다.
            </p>
          </div>

          <!-- 인기 선택 사탐 배지 -->
          <div v-if="mockStats.popularSocialSubjects.length > 0" class="flex flex-wrap items-center gap-1.5">
            <span class="text-[11px] text-slate-400 font-bold">인기 전향 사탐:</span>
            <span
              v-for="subj in mockStats.popularSocialSubjects.slice(0, 3)"
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
              전체 ({{ mockStats.naturalCohortCount }}명)
            </button>
            <button
              type="button"
              @click="studentFilter = 'RUN_ALL'"
              :class="[
                'px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer',
                studentFilter === 'RUN_ALL' ? 'bg-orange-600 text-white shadow-2xs' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
              ]"
            >
              사탐런 전체 ({{ mockStats.totalRunCount }}명)
            </button>
            <button
              type="button"
              @click="studentFilter = 'RUN_1'"
              :class="[
                'px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer',
                studentFilter === 'RUN_1' ? 'bg-amber-600 text-white shadow-2xs' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              ]"
            >
              1과목 사탐런 ({{ mockStats.run1Count }}명)
            </button>
            <button
              type="button"
              @click="studentFilter = 'RUN_2'"
              :class="[
                'px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer',
                studentFilter === 'RUN_2' ? 'bg-rose-600 text-white shadow-2xs' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              ]"
            >
              2과목 사탐런 ({{ mockStats.run2Count }}명)
            </button>
            <button
              type="button"
              @click="studentFilter = 'KEPT'"
              :class="[
                'px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer',
                studentFilter === 'KEPT' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              ]"
            >
              과탐 유지 ({{ mockStats.keptCount }}명)
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
        <div class="border border-slate-200 rounded-2xl overflow-hidden">
          <div class="overflow-x-auto max-h-80">
            <table class="w-full text-left text-xs border-collapse">
              <thead class="bg-slate-50 text-slate-600 sticky top-0 z-10 border-b border-slate-200 font-bold">
                <tr>
                  <th class="p-3 w-16 text-center">반-번호</th>
                  <th class="p-3 w-24">이름</th>
                  <th class="p-3">초기(3월) 응시 과목</th>
                  <th class="p-3">최종(10월) 응시 과목</th>
                  <th class="p-3 w-32 text-center">전향 유형</th>
                  <th class="p-3 w-40">선택한 사탐 과목</th>
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
                    {{ s.name }}
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
                  <td colspan="6" class="p-6 text-center text-slate-400 text-xs">
                    조건에 해당하는 학생이 없습니다.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 탐구 과목별 응시자 수 & 평균 등급 상세 그리드 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 사회탐구 과목별 현황 -->
        <div class="bg-slate-50/70 rounded-3xl p-5 border border-slate-200/90 shadow-2xs">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h4 class="text-sm font-black text-slate-900 m-0 flex items-center gap-1.5">
                <span>📚</span>
                <span>사회탐구 과목별 응시자 수 & 평균 등급</span>
              </h4>
              <p class="text-[11px] text-slate-500 m-0">사회·문화와 생활과 윤리로 쏠림 현상 뚜렷</p>
            </div>
            <span class="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800">
              사탐 전체
            </span>
          </div>

          <div class="space-y-2 mt-3">
            <div
              v-for="s in satamList"
              :key="s.name"
              class="bg-white p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs hover:border-blue-300 transition-colors"
            >
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: s.color }"></span>
                <span class="font-bold text-slate-800">{{ s.name }}</span>
                <span v-if="s.count >= 100" class="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800">
                  최다 응시
                </span>
              </div>
              <div class="flex items-center gap-4">
                <div class="text-right">
                  <span class="text-[10px] text-slate-400 block">응시 인원</span>
                  <span class="font-mono font-bold text-slate-700">{{ s.count }}명</span>
                </div>
                <div class="text-right min-w-16">
                  <span class="text-[10px] text-slate-400 block">평균 등급</span>
                  <span class="font-mono font-black text-blue-600 text-sm">{{ s.grade }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 과학탐구 과목별 현황 -->
        <div class="bg-slate-50/70 rounded-3xl p-5 border border-slate-200/90 shadow-2xs">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h4 class="text-sm font-black text-slate-900 m-0 flex items-center gap-1.5">
                <span>🔬</span>
                <span>과학탐구 과목별 응시자 수 & 평균 등급</span>
              </h4>
              <p class="text-[11px] text-slate-500 m-0">생명과학Ⅰ과 지구과학Ⅰ 위주, Ⅱ과목은 극소수</p>
            </div>
            <span class="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-sky-100 text-sky-800">
              과탐 전체
            </span>
          </div>

          <div class="space-y-2 mt-3">
            <div
              v-for="q in gwatamList"
              :key="q.name"
              class="bg-white p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs hover:border-indigo-300 transition-colors"
            >
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: q.color }"></span>
                <span class="font-bold text-slate-800">{{ q.name }}</span>
                <span v-if="q.count >= 30" class="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-indigo-100 text-indigo-800">
                  주력 응시
                </span>
              </div>
              <div class="flex items-center gap-4">
                <div class="text-right">
                  <span class="text-[10px] text-slate-400 block">응시 인원</span>
                  <span class="font-mono font-bold text-slate-700">{{ q.count }}명</span>
                </div>
                <div class="text-right min-w-16">
                  <span class="text-[10px] text-slate-400 block">평균 등급</span>
                  <span class="font-mono font-black text-indigo-600 text-sm">{{ q.grade }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content 3: 수능 최저 실질경쟁률 마법 시뮬레이터 -->
    <div v-else-if="activeSubTab === 'minScoreMagic'" class="mt-4 pt-4 border-t border-slate-100 space-y-6">
      <div class="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-md relative overflow-hidden">
        <div class="relative z-10">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-cyan-300 border border-cyan-400/30 mb-2">
            <span>✨</span>
            <span>수능 최저 영향력 분석</span>
          </div>
          <h3 class="text-xl sm:text-2xl font-black tracking-tight m-0 text-white">
            "수능 최저를 맞추는 순간, 6:1 경쟁률이 2:1로 떨어지는 마법"
          </h3>
          <p class="text-xs text-slate-300 mt-2 leading-relaxed max-w-2xl">
            수능 최저학력기준이 걸려 있는 전형은 겉보기 합격률이 32.0%로 미반영 전형(49.6%)보다 낮아 보이지만, 
            <strong>실제로 수능 최저를 맞추는 학생은 약 30% 내외</strong>에 불과합니다. 즉, 최저만 맞추면 경쟁자의 70%가 자동 탈락하여 
            실질 경쟁률이 기적처럼 낮아집니다.
          </p>
        </div>
      </div>

      <!-- Interactive Simulator Box -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <!-- Controls & Sliders -->
        <div class="lg:col-span-5 bg-slate-50/70 rounded-3xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <h4 class="text-sm font-black text-slate-900 mb-4 flex items-center gap-1.5">
              <span>🎛️</span>
              <span>수능 최저 실질경쟁률 시뮬레이션 설정</span>
            </h4>

            <!-- Slider 1: 최초 경쟁률 -->
            <div class="space-y-1.5 mb-5">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-slate-700">목표 대학·학과 최초 경쟁률</span>
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
                <span>3:1 (안정)</span>
                <span>6:1 (보고서 평균)</span>
                <span>15:1 (인기과)</span>
                <span>25:1 (상향)</span>
              </div>
            </div>

            <!-- Slider 2: 수능 최저 충족 비율 -->
            <div class="space-y-1.5 mb-5">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-slate-700">수능 최저학력기준 충족률 (%)</span>
                <span class="font-mono font-black text-emerald-600 text-sm">{{ passRateOfMinScore }}%</span>
              </div>
              <input
                type="range"
                min="15"
                max="60"
                step="5"
                v-model.number="passRateOfMinScore"
                class="w-full accent-emerald-600 cursor-pointer"
              />
              <div class="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>15% (매우 까다로움)</span>
                <span>30% (일반적 충족률)</span>
                <span>60% (완화 기준)</span>
              </div>
            </div>
          </div>

          <!-- Quick Scenario Presets -->
          <div class="pt-4 border-t border-slate-200">
            <span class="text-[11px] font-bold text-slate-500 block mb-2">대표 시나리오:</span>
            <div class="flex flex-wrap gap-1.5">
              <button
                type="button"
                @click="applyPreset(6, 30)"
                class="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 transition-all cursor-pointer"
              >
                📖 일반 평균 (6:1 / 30%)
              </button>
              <button
                type="button"
                @click="applyPreset(10, 25)"
                class="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 transition-all cursor-pointer"
              >
                🏛️ 서울 상위권 교과 (10:1 / 25%)
              </button>
              <button
                type="button"
                @click="applyPreset(18, 20)"
                class="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 transition-all cursor-pointer"
              >
                🩺 메디컬 / 첨단학과 (18:1 / 20%)
              </button>
            </div>
          </div>
        </div>

        <!-- Simulation Result Card -->
        <div class="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <span class="text-xs font-extrabold text-slate-700">시뮬레이션 결과</span>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-black bg-cyan-100 text-cyan-800">
                경쟁률 {{ dropRatio }}배 대폭 완화!
              </span>
            </div>

            <!-- Comparison Graphic -->
            <div class="grid grid-cols-2 gap-4 my-4">
              <!-- 최초 외형 경쟁률 -->
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span class="text-xs text-slate-500 font-semibold block">최초 지원 외형 경쟁률</span>
                <span class="text-3xl sm:text-4xl font-black text-slate-400 font-mono mt-1 block">
                  {{ initialCompetition }}:1
                </span>
                <span class="text-[11px] text-slate-500 mt-2 block">
                  모집 10명 기준 <strong>{{ Math.round(initialCompetition * 10) }}명</strong> 지원
                </span>
              </div>

              <!-- 실질 경쟁률 -->
              <div class="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 text-center relative overflow-hidden">
                <div class="absolute top-2 right-2 text-base">✨</div>
                <span class="text-xs text-blue-700 font-bold block">수능 최저 충족 후 실질 경쟁률</span>
                <span class="text-3xl sm:text-4xl font-black text-blue-700 font-mono mt-1 block">
                  {{ realCompetition }}:1
                </span>
                <span class="text-[11px] text-blue-800 mt-2 block font-semibold">
                  실질 경쟁 인원 <strong>{{ realApplicants }}명</strong>으로 급감
                </span>
              </div>
            </div>

            <!-- Summary Text Box -->
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs text-slate-700 leading-relaxed">
              <div class="font-extrabold text-slate-900 mb-1 flex items-center gap-1">
                <span>🎯</span>
                <span>입시 지도 처방:</span>
              </div>
              수능 최저 기준을 맞춘 학생에게 이 전형의 실제 체감 경쟁률은 <strong>{{ realCompetition }}:1</strong>에 불과합니다. 
              여기에 최초합격자의 등록 포기(충원합격)가 1~2바퀴만 돌아도 <strong>사실상 '지원자 전원 합격'에 가까운 기회</strong>가 열리게 됩니다.
            </div>
          </div>

          <!-- Bottom Reference Data -->
          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>전년도 실제 수시 통계:</span>
            <span class="font-semibold text-slate-700">최저 미반영 합격률 49.6% vs 반영 32.0%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Content 4: 2027학년도 5대 대입 핵심 전략 카드 -->
    <div v-else-if="activeSubTab === 'strategyCards'" class="mt-4 pt-4 border-t border-slate-100 space-y-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <span>💡</span>
          <span>2027학년도 수시·정시 대비 5대 핵심 지침</span>
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
              ? 'bg-gradient-to-br from-indigo-50/70 to-blue-50/70 border-indigo-300 shadow-md ring-2 ring-indigo-200'
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
import { ref, computed } from 'vue'
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
import { Radar, Bar } from 'vue-chartjs'
import * as XLSX from 'xlsx'
import {
  calculateSatamRunStats,
  parseMockExamWorkbook,
  generateRealisticMockSample,
  STANDARD_SCIENCE_SUBJECTS,
  STANDARD_SOCIAL_SUBJECTS
} from '../utils/satamRunCalculator.js'
import { fetchAndParseKcueMockData } from '../../api/statApi.js'

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

// Sub Tabs
const subTabs = [
  { id: 'radar', emoji: '📊', label: '1. 과목별 내신 vs 수능 등급 비교' },
  { id: 'satamRun', emoji: '🚀', label: '2. 사탐런 & 탐구 응시 분석' },
  { id: 'minScoreMagic', emoji: '✨', label: '3. 수능최저 실질경쟁률 마법' },
  { id: 'strategyCards', emoji: '💡', label: '4. 2027 대입 5대 핵심 전략' }
]

const activeSubTab = ref('radar')

// -------------------------------------------------------------
// 1. Radar Chart Data (내신 vs 수능 오망성)
// 보고서 1페이지 데이터: 내신 vs 수능 (국어, 수학, 영어, 사탐, 과탐)
// 내신: 국어 4.20, 수학 4.50, 영어 4.80, 사탐 4.60, 과탐 4.40
// 수능: 국어 6.10, 수학 5.80, 영어 4.94, 사탐 6.00, 과탐 6.30
// -------------------------------------------------------------

const radarChartData = computed(() => {
  // Chart.js 레이더 축: 시각적으로 1등급이 바깥쪽에 오도록 (10 - 등급)으로 정규화
  // 1등급 -> 9, 4등급 -> 6, 9등급 -> 1
  const gpaRaw = [4.20, 4.50, 4.80, 4.60, 4.40]
  const satRaw = [6.10, 5.80, 4.94, 6.00, 6.30]

  return {
    labels: ['국어', '수학', '영어', '사탐', '과탐'],
    datasets: [
      {
        label: '내신 평균 등급',
        data: gpaRaw.map(v => Number((10 - v).toFixed(2))),
        rawGrades: gpaRaw,
        backgroundColor: 'rgba(37, 99, 235, 0.22)',
        borderColor: '#2563eb',
        borderWidth: 2.5,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5
      },
      {
        label: '수능 평균 등급',
        data: satRaw.map(v => Number((10 - v).toFixed(2))),
        rawGrades: satRaw,
        backgroundColor: 'rgba(245, 158, 11, 0.25)',
        borderColor: '#f59e0b',
        borderWidth: 2.5,
        pointBackgroundColor: '#f59e0b',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5
      }
    ]
  }
})

const radarChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    r: {
      min: 0,
      max: 10,
      ticks: {
        stepSize: 2,
        callback: (val) => {
          if (val === 0) return ''
          return `${10 - val}등급`
        },
        font: { family: 'Pretendard', size: 10 },
        backdropColor: 'transparent',
        color: '#94a3b8'
      },
      grid: {
        color: '#e2e8f0'
      },
      pointLabels: {
        font: { family: 'Pretendard', size: 12, weight: 'bold' },
        color: '#0f172a'
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
// Subject comparison bar data (언매 vs 화작, 미적 vs 확통, 영어)
// -------------------------------------------------------------
const subjectComparisonBarData = computed(() => {
  return {
    labels: ['국어: 언매', '국어: 화작', '수학: 미적분', '수학: 확통', '영어 (전체)'],
    datasets: [
      {
        data: [5.28, 6.26, 4.71, 6.32, 4.94],
        backgroundColor: ['#2563eb', '#64748b', '#4f46e5', '#94a3b8', '#059669'],
        borderRadius: 8,
        barThickness: 18
      }
    ]
  }
})

const subjectBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  scales: {
    x: {
      min: 1,
      max: 9,
      reverse: true, // 1등급이 왼쪽(우수)
      title: { display: true, text: '평균 등급 (← 1등급 쪽이 우수)', font: { size: 10 } },
      grid: { color: '#f1f5f9' },
      ticks: {
        stepSize: 1,
        callback: (v) => `${v}등급`
      }
    },
    y: {
      grid: { display: false },
      ticks: { font: { family: 'Pretendard', size: 11, weight: 'bold' }, color: '#334155' }
    }
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => ` 평균 등급: ${ctx.formattedValue}등급`
      }
    }
  }
}

// -------------------------------------------------------------
// 2. 사탐 & 과탐 데이터 (보고서 2페이지)
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

// -------------------------------------------------------------
// 2-1. 사탐런 모의고사 원자료 분석 모드 상태 및 로직
// -------------------------------------------------------------
const satamMode = ref('OFFICIAL') // 'OFFICIAL' | 'MOCK_ANALYSIS'
const isAnalyzingMock = ref(false)
const mockFileName = ref('')
const mockStats = ref(null)
const mockAnalysisError = ref('')
const showFormatGuide = ref(false)

const studentFilter = ref('ALL') // 'ALL' | 'RUN_1' | 'RUN_2' | 'RUN_ALL' | 'KEPT'
const studentSearch = ref('')

async function handleMockFileUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return

  isAnalyzingMock.value = true
  mockAnalysisError.value = ''
  try {
    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'buffer' })
    const records = parseMockExamWorkbook(wb)
    if (!records || records.length === 0) {
      throw new Error('모의고사 성적 데이터를 찾을 수 없습니다. 시트 탭 이름이나 컬럼명(이름, 수학, 탐구1, 탐구2 등)을 확인해 주세요.')
    }
    const result = calculateSatamRunStats(records)
    if (!result.hasData) {
      throw new Error('3월~10월 중 미적분, 기하 또는 과학탐구(8개 과목)를 응시한 자연계열 이과 학생이 발견되지 않았습니다.')
    }
    mockStats.value = result
    mockFileName.value = file.name
    satamMode.value = 'MOCK_ANALYSIS'
  } catch (err) {
    console.error(err)
    mockAnalysisError.value = err.message || '파일 처리 중 오류가 발생했습니다.'
  } finally {
    isAnalyzingMock.value = false
    e.target.value = ''
  }
}

function loadSampleMockData() {
  isAnalyzingMock.value = true
  mockAnalysisError.value = ''
  setTimeout(() => {
    try {
      const records = generateRealisticMockSample()
      mockStats.value = calculateSatamRunStats(records)
      mockFileName.value = '2026학년도 3~10월 모의고사 실증 데이터 (자연계 115명)'
      satamMode.value = 'MOCK_ANALYSIS'
    } catch (err) {
      mockAnalysisError.value = '샘플 데이터 로드 실패: ' + err.message
    } finally {
      isAnalyzingMock.value = false
    }
  }, 150)
}

async function syncFromGoogleSheetMockData() {
  isAnalyzingMock.value = true
  mockAnalysisError.value = ''
  try {
    const records = await fetchAndParseKcueMockData(null, '2027가채점')
    if (!records || records.length === 0) {
      throw new Error("배포 시트에서 '2027가채점' 탭 데이터를 찾을 수 없거나 암호화가 해제되지 않았습니다. 원본 시트에서 '대입 데이터 배포'를 먼저 실행해 주세요.")
    }
    const result = calculateSatamRunStats(records)
    if (!result.hasData) {
      throw new Error("자연계열(미적/기하/과탐) 응시 학생이 발견되지 않았습니다. 시트의 컬럼명을 확인해 주세요.")
    }
    mockStats.value = result
    mockFileName.value = "구글 시트 '2027가채점' 탭 (실시간 연동)"
    satamMode.value = 'MOCK_ANALYSIS'
  } catch (err) {
    console.error(err)
    mockAnalysisError.value = err.message || '구글 시트 연동 중 오류가 발생했습니다.'
  } finally {
    isAnalyzingMock.value = false
  }
}

function resetMockAnalysis() {
  mockStats.value = null
  mockFileName.value = ''
  satamMode.value = 'OFFICIAL'
  mockAnalysisError.value = ''
}

const filteredCohortStudents = computed(() => {
  if (!mockStats.value || !mockStats.value.naturalCohort) return []
  let list = mockStats.value.naturalCohort

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
      s.socialSubjectsList.some(sub => sub.toLowerCase().includes(q)) ||
      s.scienceSubjectsList.some(sub => sub.toLowerCase().includes(q))
    )
  }

  return list
})

// -------------------------------------------------------------
// 3. 수능 최저 실질경쟁률 마법 시뮬레이터
// -------------------------------------------------------------
const initialCompetition = ref(6.0)
const passRateOfMinScore = ref(30)

const realCompetition = computed(() => {
  // 실질 경쟁률 = 최초 경쟁률 * (최저 충족률 / 100)
  const real = (initialCompetition.value * (passRateOfMinScore.value / 100)).toFixed(1)
  return Math.max(1.0, Number(real))
})

const realApplicants = computed(() => {
  const initApps = Math.round(initialCompetition.value * 10)
  return Math.round(initApps * (passRateOfMinScore.value / 100))
})

const dropRatio = computed(() => {
  if (realCompetition.value === 0) return '0'
  return (initialCompetition.value / realCompetition.value).toFixed(1)
})

function applyPreset(initial, rate) {
  initialCompetition.value = initial
  passRateOfMinScore.value = rate
}

// -------------------------------------------------------------
// 4. 2027학년도 5대 대입 전략 카드 (보고서 6페이지 원문 기반)
// -------------------------------------------------------------
const expandedCard = ref(1)

function toggleCard(num) {
  expandedCard.value = expandedCard.value === num ? null : num
}

const STRATEGY_CARDS = [
  {
    num: 1,
    badge: '내신 중심 교과 우세',
    title: '등급에 관계없이 학생부교과 전형이 일관되게 유리합니다',
    summary: '우리 학교의 과거 수시 결과에 비추어 볼 때 모든 등급대에서 교과 전형 합격률이 종합 전형을 앞섭니다.',
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
    title: '수능 최저학력기준을 맞추면 실질 경쟁률이 2:1로 급락하는 마법',
    summary: '겉보기 합격률이 낮아 보인다고 최저 없는 전형만 찾지 마십시오. 최저를 맞추는 순간 70%가 탈락합니다.',
    details: [
      '최저 미반영 전형은 지원자가 폭주하여 외형 합격률(49.6%)에 비해 실제 합격선이 매우 촘촘함',
      '수능 최저를 충족하는 학생 비율이 30%에 불과하므로 6:1 경쟁률이 실질 2:1로 축소',
      '충원합격(추합)까지 감안하면 수능 최저를 맞춘 교과 지원자는 사실상 전원 합격 궤도에 진입'
    ]
  },
  {
    num: 4,
    badge: '수능의 진짜 목적',
    title: '수능은 정시 파이터를 위한 것이 아니라, 수시 최저를 위한 전략 무기',
    summary: '고3 재학생의 정시 성공 확률은 매우 낮습니다. 수능 공부는 정시가 아니라 수시 최저 충족이 목표여야 합니다.',
    details: [
      '포곡고 수능 평균 등급은 국어 6.10, 수학 5.80으로 정시 지원 시 수도권 4년제 합격권 진입이 극히 제한적',
      '수능 공부의 목표를 4과목 정시 대비가 아닌 영어(절대평가, 평균 4.94) 및 사탐 1과목 등 2개 합 충족으로 압축할 것',
      '사탐런(과탐→사탐 48.7%)을 통해 최저 충족 전략 과목을 조기에 확정하는 것이 성공의 열쇠'
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
</script>
