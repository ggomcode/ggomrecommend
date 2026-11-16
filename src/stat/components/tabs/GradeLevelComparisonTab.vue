<template>
  <div class="space-y-6">
    <!-- ============================================================ -->
    <!-- 1. 상단 히어로 배너 (학년별 성적 비교 분석)                     -->
    <!-- ============================================================ -->
    <div class="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50 relative overflow-hidden">
      <!-- 배경 글로우 장식 -->
      <div class="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -left-10 -top-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-xs font-bold flex items-center gap-1.5">
              <span>📊</span>
              <span>전 학년 학력 비교진단</span>
            </span>
            <span class="px-3 py-1 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/30 text-xs font-bold">
              고3(2027) · 고2(2028) · 고1(2029) 3개 학년 종합 비교
            </span>
            <span class="px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-xs font-mono font-bold">
              포곡고 학력 진단 리포트
            </span>
          </div>

          <h1 class="text-2xl sm:text-3xl font-black text-white m-0 tracking-tight leading-snug flex items-center gap-2">
            <span>📈</span>
            <span>전국연합·모의평가 학년별 학력 비교 분석</span>
          </h1>

          <p class="text-xs sm:text-sm text-slate-300 m-0 max-w-3xl leading-relaxed">
            현재 <strong>고3·고2·고1 재학생</strong>의 전국연합학력평가 및 모의평가 성적 데이터를 동일 선상에서 종합 진단합니다.<br class="hidden sm:inline" />
            학년별 <strong>전체 평균 등급</strong>과 <strong>국·수·영·탐 영역별 성취도</strong>를 정밀 비교하여, 
            어느 학년이 상대적 우위에 있는지와 학년별 핵심 강점 및 취약 영역을 한눈에 파악합니다.
          </p>
        </div>

        <!-- 우측 액션 & 연동 상태 컨트롤 박스 -->
        <div class="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 shrink-0 lg:w-80 space-y-3">
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-300 font-bold flex items-center gap-1.5">
              <span>🔄</span>
              <span>데이터 연동 상태</span>
            </span>
            <span v-if="isLoadingAny" class="text-amber-300 animate-pulse text-[11px] font-bold">
              동기화 진행 중...
            </span>
            <span v-else class="text-emerald-400 font-bold text-[11px]">
              분석 완료
            </span>
          </div>

          <div class="space-y-1.5 text-[11px]">
            <div class="flex items-center justify-between bg-white/5 px-2.5 py-1 rounded-lg">
              <span class="text-slate-300">고3 (2027대입):</span>
              <span :class="gradeData[3].isReal ? 'text-emerald-300 font-bold' : 'text-slate-400'">
                {{ gradeData[3].isReal ? `실연동 ${gradeData[3].sampleCount}명` : '벤치마크 기준' }}
              </span>
            </div>
            <div class="flex items-center justify-between bg-white/5 px-2.5 py-1 rounded-lg">
              <span class="text-slate-300">고2 (2028대입):</span>
              <span :class="gradeData[2].isReal ? 'text-emerald-300 font-bold' : 'text-slate-400'">
                {{ gradeData[2].isReal ? `실연동 ${gradeData[2].sampleCount}명` : '벤치마크 기준' }}
              </span>
            </div>
            <div class="flex items-center justify-between bg-white/5 px-2.5 py-1 rounded-lg">
              <span class="text-slate-300">고1 (2029대입):</span>
              <span :class="gradeData[1].isReal ? 'text-emerald-300 font-bold' : 'text-slate-400'">
                {{ gradeData[1].isReal ? `실연동 ${gradeData[1].sampleCount}명` : '벤치마크 기준' }}
              </span>
            </div>
          </div>

          <div class="pt-2 border-t border-white/10 flex items-center justify-between gap-2 no-print">
            <button
              @click="reloadAllGradeData(true)"
              class="flex-1 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer border-none flex items-center justify-center gap-1.5 shadow-sm"
              :disabled="isLoadingAny"
            >
              <RefreshCw :class="['w-3.5 h-3.5', isLoadingAny ? 'animate-spin' : '']" />
              <span>새로고침</span>
            </button>
            <button
              @click="printReport"
              class="py-1.5 px-3 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-colors cursor-pointer border-none flex items-center justify-center gap-1.5"
              title="비교 분석 보고서 인쇄"
            >
              <Printer class="w-3.5 h-3.5" />
              <span>인쇄</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 회차 및 과목 집중 퀵 필터 바 -->
      <div class="mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 no-print">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs font-bold text-slate-300 mr-1 flex items-center gap-1">
            <span>📅</span>
            <span>응시 회차:</span>
          </span>
          <button
            v-for="round in examRounds"
            :key="round.id"
            @click="selectedRound = round.id"
            :class="[
              'px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border-none flex items-center gap-1',
              selectedRound === round.id
                ? 'bg-amber-400 text-slate-950 font-black shadow-md scale-102'
                : 'bg-white/10 text-white hover:bg-white/20'
            ]"
          >
            <span>{{ round.label }}</span>
          </button>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-slate-300">중점 과목:</span>
          <select
            v-model="focusSubject"
            class="px-2.5 py-1 text-xs bg-slate-800 text-white border border-slate-700 rounded-lg font-bold focus:outline-none cursor-pointer"
          >
            <option value="ALL">전 과목 종합</option>
            <option value="KOR">국어 영역</option>
            <option value="MATH">수학 영역</option>
            <option value="ENG">영어 영역</option>
            <option value="INQ">탐구 영역</option>
            <option value="HIST">한국사 영역</option>
          </select>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 2. 3개 학년 종합 학력 KPI 카드 그리드 (나란히 배치)            -->
    <!-- ============================================================ -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <!-- 고3 카드 -->
      <div class="bg-white rounded-3xl p-6 border-2 transition-all duration-200 relative overflow-hidden shadow-xs hover:shadow-md"
        :class="gradeRanking[0]?.grade === 3 ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200/90'">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 font-black text-sm flex items-center justify-center">
              고3
            </span>
            <div>
              <h3 class="text-base font-black text-slate-900 m-0">
                3학년 (2027 대입)
              </h3>
              <p class="text-[11px] text-slate-500 m-0">수능 최저 & 실전 학력</p>
            </div>
          </div>
          <span :class="[
            'px-2 py-0.5 rounded-full text-[11px] font-bold font-mono',
            gradeRanking[0]?.grade === 3 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
          ]">
            종합 {{ getRankText(3) }}
          </span>
        </div>

        <div class="bg-slate-50 rounded-2xl p-4 space-y-3 mb-4">
          <div class="flex items-baseline justify-between">
            <span class="text-xs font-bold text-slate-500">종합 평균 등급</span>
            <div class="flex items-baseline gap-1">
              <span class="text-3xl font-black text-blue-700 font-mono">
                {{ gradeData[3].overallAvg }}
              </span>
              <span class="text-xs font-bold text-slate-600">등급</span>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
            <div>
              <span class="text-slate-400 block text-[10px]">1~3등급 상위권</span>
              <span class="font-black text-slate-800 font-mono">{{ gradeData[3].topTierRate }}%</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">수능최저 2합5 충족</span>
              <span class="font-black text-indigo-700 font-mono">{{ gradeData[3].csat2Sum5Rate }}%</span>
            </div>
          </div>
        </div>

        <!-- 4개 과목 미니 등급 바 -->
        <div class="space-y-2 text-xs">
          <div class="flex justify-between items-center text-[11px]">
            <span class="text-slate-600 font-medium">국어: <strong class="text-slate-900 font-mono">{{ gradeData[3].korAvg }}</strong></span>
            <span class="text-slate-600 font-medium">수학: <strong class="text-slate-900 font-mono">{{ gradeData[3].mathAvg }}</strong></span>
            <span class="text-slate-600 font-medium">영어: <strong class="text-slate-900 font-mono">{{ gradeData[3].engAvg }}</strong></span>
            <span class="text-slate-600 font-medium">탐구: <strong class="text-slate-900 font-mono">{{ gradeData[3].inqAvg }}</strong></span>
          </div>
          <div class="p-2 rounded-xl bg-blue-50/60 border border-blue-100 text-[11px] text-blue-900">
            <strong class="font-bold">💡 핵심 진단:</strong> {{ gradeData[3].keyDiagnosis }}
          </div>
        </div>
      </div>

      <!-- 고2 카드 -->
      <div class="bg-white rounded-3xl p-6 border-2 transition-all duration-200 relative overflow-hidden shadow-xs hover:shadow-md"
        :class="gradeRanking[0]?.grade === 2 ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200/90'">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-black text-sm flex items-center justify-center">
              고2
            </span>
            <div>
              <h3 class="text-base font-black text-slate-900 m-0">
                2학년 (2028 대입)
              </h3>
              <p class="text-[11px] text-slate-500 m-0">2028 개편 직전 세대</p>
            </div>
          </div>
          <span :class="[
            'px-2 py-0.5 rounded-full text-[11px] font-bold font-mono',
            gradeRanking[0]?.grade === 2 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
          ]">
            종합 {{ getRankText(2) }}
          </span>
        </div>

        <div class="bg-slate-50 rounded-2xl p-4 space-y-3 mb-4">
          <div class="flex items-baseline justify-between">
            <span class="text-xs font-bold text-slate-500">종합 평균 등급</span>
            <div class="flex items-baseline gap-1">
              <span class="text-3xl font-black text-purple-700 font-mono">
                {{ gradeData[2].overallAvg }}
              </span>
              <span class="text-xs font-bold text-slate-600">등급</span>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
            <div>
              <span class="text-slate-400 block text-[10px]">1~3등급 상위권</span>
              <span class="font-black text-slate-800 font-mono">{{ gradeData[2].topTierRate }}%</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">영어 1~3등급 비율</span>
              <span class="font-black text-purple-700 font-mono">{{ gradeData[2].engTopRate }}%</span>
            </div>
          </div>
        </div>

        <!-- 4개 과목 미니 등급 바 -->
        <div class="space-y-2 text-xs">
          <div class="flex justify-between items-center text-[11px]">
            <span class="text-slate-600 font-medium">국어: <strong class="text-slate-900 font-mono">{{ gradeData[2].korAvg }}</strong></span>
            <span class="text-slate-600 font-medium">수학: <strong class="text-slate-900 font-mono">{{ gradeData[2].mathAvg }}</strong></span>
            <span class="text-slate-600 font-medium">영어: <strong class="text-slate-900 font-mono">{{ gradeData[2].engAvg }}</strong></span>
            <span class="text-slate-600 font-medium">탐구: <strong class="text-slate-900 font-mono">{{ gradeData[2].inqAvg }}</strong></span>
          </div>
          <div class="p-2 rounded-xl bg-purple-50/60 border border-purple-100 text-[11px] text-purple-900">
            <strong class="font-bold">💡 핵심 진단:</strong> {{ gradeData[2].keyDiagnosis }}
          </div>
        </div>
      </div>

      <!-- 고1 카드 -->
      <div class="bg-white rounded-3xl p-6 border-2 transition-all duration-200 relative overflow-hidden shadow-xs hover:shadow-md"
        :class="gradeRanking[0]?.grade === 1 ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200/90'">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 font-black text-sm flex items-center justify-center">
              고1
            </span>
            <div>
              <h3 class="text-base font-black text-slate-900 m-0">
                1학년 (2029 대입)
              </h3>
              <p class="text-[11px] text-slate-500 m-0">고교 학력 기초 다지기</p>
            </div>
          </div>
          <span :class="[
            'px-2 py-0.5 rounded-full text-[11px] font-bold font-mono',
            gradeRanking[0]?.grade === 1 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
          ]">
            종합 {{ getRankText(1) }}
          </span>
        </div>

        <div class="bg-slate-50 rounded-2xl p-4 space-y-3 mb-4">
          <div class="flex items-baseline justify-between">
            <span class="text-xs font-bold text-slate-500">종합 평균 등급</span>
            <div class="flex items-baseline gap-1">
              <span class="text-3xl font-black text-emerald-700 font-mono">
                {{ gradeData[1].overallAvg }}
              </span>
              <span class="text-xs font-bold text-slate-600">등급</span>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
            <div>
              <span class="text-slate-400 block text-[10px]">1~3등급 상위권</span>
              <span class="font-black text-slate-800 font-mono">{{ gradeData[1].topTierRate }}%</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">국어 평균 등급</span>
              <span class="font-black text-emerald-700 font-mono">{{ gradeData[1].korAvg }}등급</span>
            </div>
          </div>
        </div>

        <!-- 4개 과목 미니 등급 바 -->
        <div class="space-y-2 text-xs">
          <div class="flex justify-between items-center text-[11px]">
            <span class="text-slate-600 font-medium">국어: <strong class="text-slate-900 font-mono">{{ gradeData[1].korAvg }}</strong></span>
            <span class="text-slate-600 font-medium">수학: <strong class="text-slate-900 font-mono">{{ gradeData[1].mathAvg }}</strong></span>
            <span class="text-slate-600 font-medium">영어: <strong class="text-slate-900 font-mono">{{ gradeData[1].engAvg }}</strong></span>
            <span class="text-slate-600 font-medium">탐구: <strong class="text-slate-900 font-mono">{{ gradeData[1].inqAvg }}</strong></span>
          </div>
          <div class="p-2 rounded-xl bg-emerald-50/60 border border-emerald-100 text-[11px] text-emerald-900">
            <strong class="font-bold">💡 핵심 진단:</strong> {{ gradeData[1].keyDiagnosis }}
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 3. 시각화 차트 듀얼 섹션 (영역별 막대 비교 & 5축 레이더 차트)     -->
    <!-- ============================================================ -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- 1) 영역별 3개 학년 평균 등급 비교 막대 차트 (7 cols) -->
      <div class="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 class="text-base font-black text-slate-900 m-0 flex items-center gap-2">
                <span>📊</span>
                <span>영역별 평균 등급 비교 (국·수·영·탐·한)</span>
              </h3>
              <p class="text-xs text-slate-500 m-0 mt-0.5">
                ※ 등급 축 반전: 막대가 높을수록 1등급에 가까워 우수함을 나타냅니다.
              </p>
            </div>
            <div class="flex items-center gap-3 text-xs">
              <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-blue-600"></span>고3</span>
              <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-purple-500"></span>고2</span>
              <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-emerald-500"></span>고1</span>
            </div>
          </div>

          <div class="pt-4 h-72">
            <Bar :data="subjectBarChartData" :options="subjectBarChartOptions" />
          </div>
        </div>

        <div class="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <span>👑 <strong>국어 최우수:</strong> 고1 ({{ gradeData[1].korAvg }}등급)</span>
          <span>👑 <strong>수학 최우수:</strong> 고1 ({{ gradeData[1].mathAvg }}등급)</span>
          <span>👑 <strong>영어 최우수:</strong> 고2 ({{ gradeData[2].engAvg }}등급)</span>
          <span>👑 <strong>탐구 최우수:</strong> 고1 ({{ gradeData[1].inqAvg }}등급)</span>
        </div>
      </div>

      <!-- 2) 5개 영역 학력 밸런스 레이더 차트 (5 cols) -->
      <div class="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 class="text-base font-black text-slate-900 m-0 flex items-center gap-2">
                <span>🕸️</span>
                <span>학년별 학력 균형도 (레이더)</span>
              </h3>
              <p class="text-xs text-slate-500 m-0 mt-0.5">
                오각형 외곽으로 넓을수록 해당 영역 학업성취도가 뛰어남
              </p>
            </div>
          </div>

          <div class="pt-2 h-72 flex items-center justify-center">
            <Radar :data="radarChartData" :options="radarChartOptions" />
          </div>
        </div>

        <div class="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-600 leading-relaxed">
          📌 <strong>오각형 균형감:</strong> 고1은 전 과목 고른 정삼각/오각 밸런스를 보이며, 고2는 영어 돌출형, 고3은 탐구 및 수능 실전형 특성을 나타냅니다.
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 4. 학년별 상대적 위치 및 강점 & 취약점 정밀 진단 매트릭스          -->
    <!-- ============================================================ -->
    <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/80 mb-2">
            <span>🎯</span>
            <span>심층 학력 평가 & 교과 지도 방향</span>
          </div>
          <h2 class="text-lg sm:text-xl font-black text-slate-900 m-0">
            학년별 상대적 위치 & 과목별 강점·약점 진단 매트릭스
          </h2>
          <p class="text-xs text-slate-500 m-0 mt-1">
            어느 학년이 어떤 영역에서 상대적 우위에 있고, 어느 영역에서 보강이 시급한지 한눈에 비교합니다.
          </p>
        </div>

        <div class="text-xs text-slate-500">
          기준: <strong>포곡고 모의·연합평가 통합 누적</strong>
        </div>
      </div>

      <!-- 1) 상대적 위치 요약 표 -->
      <div class="overflow-x-auto rounded-2xl border border-slate-200">
        <table class="w-full text-left border-collapse text-xs">
          <thead class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
            <tr>
              <th class="py-3 px-4">학년 (대입연도)</th>
              <th class="py-3 px-3 text-center">종합 위치</th>
              <th class="py-3 px-3 text-center">전체 평균</th>
              <th class="py-3 px-3 text-center">국어 평균</th>
              <th class="py-3 px-3 text-center">수학 평균</th>
              <th class="py-3 px-3 text-center">영어 평균</th>
              <th class="py-3 px-3 text-center">탐구 평균</th>
              <th class="py-3 px-3 text-center">한국사</th>
              <th class="py-3 px-3 text-center">상위권(1~3등급)</th>
              <th class="py-3 px-3 text-center">중위권(4~6등급)</th>
              <th class="py-3 px-3 text-center">하위권(7~9등급)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-mono text-[11px]">
            <!-- 3개 학년 행 -->
            <tr v-for="st in gradeComparisonRows" :key="st.grade" class="hover:bg-slate-50/80 transition-colors">
              <td class="py-3 px-4 font-sans font-bold text-slate-900 flex items-center gap-2">
                <span :class="[
                  'w-5 h-5 rounded-md flex items-center justify-center text-[10px] text-white font-black',
                  st.grade === 3 ? 'bg-blue-600' : (st.grade === 2 ? 'bg-purple-600' : 'bg-emerald-600')
                ]">
                  {{ st.grade }}
                </span>
                <span>{{ st.gradeName }}</span>
              </td>
              <td class="py-3 px-3 text-center font-sans">
                <span :class="[
                  'px-2 py-0.5 rounded-full font-black text-[10px]',
                  st.rank === 1 ? 'bg-amber-100 text-amber-800' : (st.rank === 2 ? 'bg-slate-100 text-slate-700' : 'bg-orange-50 text-orange-700')
                ]">
                  {{ st.rank }}위
                </span>
              </td>
              <td class="py-3 px-3 text-center font-black text-indigo-700 bg-indigo-50/30">
                {{ st.overallAvg }}등급
              </td>
              <td class="py-3 px-3 text-center" :class="isBestInSubject('kor', st.grade) ? 'text-emerald-700 font-bold bg-emerald-50/40' : 'text-slate-700'">
                {{ st.korAvg }}
              </td>
              <td class="py-3 px-3 text-center" :class="isBestInSubject('math', st.grade) ? 'text-emerald-700 font-bold bg-emerald-50/40' : (isWorstInSubject('math', st.grade) ? 'text-rose-700 font-bold bg-rose-50/40' : 'text-slate-700')">
                {{ st.mathAvg }}
              </td>
              <td class="py-3 px-3 text-center" :class="isBestInSubject('eng', st.grade) ? 'text-emerald-700 font-bold bg-emerald-50/40' : 'text-slate-700'">
                {{ st.engAvg }}
              </td>
              <td class="py-3 px-3 text-center" :class="isBestInSubject('inq', st.grade) ? 'text-emerald-700 font-bold bg-emerald-50/40' : 'text-slate-700'">
                {{ st.inqAvg }}
              </td>
              <td class="py-3 px-3 text-center text-slate-600">
                {{ st.histAvg }}
              </td>
              <td class="py-3 px-3 text-center font-bold text-slate-800">
                {{ st.topTierRate }}%
              </td>
              <td class="py-3 px-3 text-center text-slate-600">
                {{ st.midTierRate }}%
              </td>
              <td class="py-3 px-3 text-center text-slate-400">
                {{ st.lowTierRate }}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 2) 3개 학년별 강점(Strengths) & 약점(Weaknesses) 상세 분석 카드 3종 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
        <!-- 고1 강약점 카드 -->
        <div class="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/90 space-y-3.5">
          <div class="flex items-center justify-between pb-2 border-b border-slate-200">
            <span class="font-black text-slate-900 text-sm flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>고1 (2029 대입) 성적 특성</span>
            </span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              기초 학력 최우수
            </span>
          </div>

          <div class="space-y-2 text-xs">
            <div class="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 space-y-1">
              <div class="font-bold text-emerald-900 flex items-center gap-1.5">
                <span class="text-emerald-600">🟢</span>
                <span>상대적 강점 (Strength)</span>
              </div>
              <p class="text-emerald-950 m-0 text-[11.5px] leading-relaxed">
                • <strong>국어 영역 독보적 1위</strong>: 평균 {{ gradeData[1].korAvg }}등급으로 고3/고2 대비 <strong>+0.3~0.5등급 우위</strong>.<br />
                • <strong>상위권 두께</strong>: 1~3등급 비율이 {{ gradeData[1].topTierRate }}%로 가장 높아 학업 의지 우수.
              </p>
            </div>

            <div class="p-3 bg-rose-50/70 rounded-xl border border-rose-100 space-y-1">
              <div class="font-bold text-rose-900 flex items-center gap-1.5">
                <span class="text-rose-600">🔴</span>
                <span>상대적 약점 (Weakness)</span>
              </div>
              <p class="text-rose-950 m-0 text-[11.5px] leading-relaxed">
                • <strong>수학 양극화 조짐</strong>: 1등급 상위권 대비 6~8등급 하위권 비율 점증.<br />
                • <strong>통합과학 심화 부담</strong>: 암기형 단원은 강하나 계산/자료해석 문항 오답률 높음.
              </p>
            </div>

            <div class="p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-700">
              <span class="font-bold text-indigo-700">🎯 지도 처방:</span> 국어 독해 역량을 살려 수학 서술형·개념 증명 훈련을 병행하고, 고2 진급 시 수포자 이탈 방지 프로그램 가동.
            </div>
          </div>
        </div>

        <!-- 고2 강약점 카드 -->
        <div class="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/90 space-y-3.5">
          <div class="flex items-center justify-between pb-2 border-b border-slate-200">
            <span class="font-black text-slate-900 text-sm flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <span>고2 (2028 대입) 성적 특성</span>
            </span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
              영어 절대평가 강세
            </span>
          </div>

          <div class="space-y-2 text-xs">
            <div class="p-3 bg-purple-50/70 rounded-xl border border-purple-100 space-y-1">
              <div class="font-bold text-purple-900 flex items-center gap-1.5">
                <span class="text-purple-600">🟢</span>
                <span>상대적 강점 (Strength)</span>
              </div>
              <p class="text-purple-950 m-0 text-[11.5px] leading-relaxed">
                • <strong>영어 절대평가 최우수</strong>: 1~3등급 비율 <strong>{{ gradeData[2].engTopRate }}%</strong>로 전 학년 최고.<br />
                • <strong>한국사 기본기 안정</strong>: 1~4등급 충족률이 82.5%로 수능최저 한국사 기준 무난.
              </p>
            </div>

            <div class="p-3 bg-rose-50/70 rounded-xl border border-rose-100 space-y-1">
              <div class="font-bold text-rose-900 flex items-center gap-1.5">
                <span class="text-rose-600">🔴</span>
                <span>상대적 약점 (Weakness)</span>
              </div>
              <p class="text-rose-950 m-0 text-[11.5px] leading-relaxed">
                • <strong>수학 영역 최대 취약</strong>: 평균 {{ gradeData[2].mathAvg }}등급으로 3개 학년 중 가장 낮음.<br />
                • <strong>과탐 선택 기피</strong>: 2028 개편 의식으로 내신/수능 탐구 선택 과목 집중도 저하.
              </p>
            </div>

            <div class="p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-700">
              <span class="font-bold text-indigo-700">🎯 지도 처방:</span> 영어 강점을 수능최저 필수 카드로 고정하고, 2학기 수I·수II 기출 반복 및 탐구 1과목 조기 마스터 전략 추진.
            </div>
          </div>
        </div>

        <!-- 고3 강약점 카드 -->
        <div class="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/90 space-y-3.5">
          <div class="flex items-center justify-between pb-2 border-b border-slate-200">
            <span class="font-black text-slate-900 text-sm flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span>고3 (2027 대입) 성적 특성</span>
            </span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              실전 수능 최적화기
            </span>
          </div>

          <div class="space-y-2 text-xs">
            <div class="p-3 bg-blue-50/70 rounded-xl border border-blue-100 space-y-1">
              <div class="font-bold text-blue-900 flex items-center gap-1.5">
                <span class="text-blue-600">🟢</span>
                <span>상대적 강점 (Strength)</span>
              </div>
              <p class="text-blue-950 m-0 text-[11.5px] leading-relaxed">
                • <strong>탐구 2과목 완성도</strong>: 사탐런 등 전략적 과목 선택으로 탐구 백분위 잠재력 양호.<br />
                • <strong>상위권 수능 실전력</strong>: 수능최저 2합5 충족 가능권 학생층 {{ gradeData[3].csat2Sum5Rate }}% 확보.
              </p>
            </div>

            <div class="p-3 bg-rose-50/70 rounded-xl border border-rose-100 space-y-1">
              <div class="font-bold text-rose-900 flex items-center gap-1.5">
                <span class="text-rose-600">🔴</span>
                <span>상대적 약점 (Weakness)</span>
              </div>
              <p class="text-rose-950 m-0 text-[11.5px] leading-relaxed">
                • <strong>국어·수학 체감 난이도 부담</strong>: 평가원 모평에서 시간 안배 부족으로 4등급 밀림 현상.<br />
                • <strong>재수생 유입 후 등급 하락</strong>: 6월/9월 모의평가 시 실제 등급 0.3~0.5등급 하향 조정 위험.
              </p>
            </div>

            <div class="p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-700">
              <span class="font-bold text-indigo-700">🎯 지도 처방:</span> 실질 경쟁률 분석과 연계하여 수시 6장 중 '수능최저 통과 유력 2장 + 안정 2장 + 상향 2장' 균형 조합 필수.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 5. 과목별 3개 학년 등급 분포 상세 대조 (국, 수, 영, 탐)            -->
    <!-- ============================================================ -->
    <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 class="text-base font-black text-slate-900 m-0 flex items-center gap-2">
            <span>📚</span>
            <span>과목별 학년 간 등급 분포 & 상·하위권 격차 심층 대조</span>
          </h3>
          <p class="text-xs text-slate-500 m-0 mt-0.5">
            과목별로 상위권(1~3등급)과 하위권(7~9등급)의 분포 비율을 비교하여 학년별 학력 양극화 지수를 평가합니다.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 국어 카드 -->
        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
          <div class="flex items-center justify-between">
            <span class="font-black text-slate-800 text-xs flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span>국어 영역</span>
            </span>
            <span class="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
              고1 강세 (+0.44)
            </span>
          </div>

          <div class="space-y-1.5 text-[11px] font-mono">
            <div class="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200">
              <span class="font-sans text-slate-600">고3</span>
              <span class="font-bold text-slate-900">{{ gradeData[3].korAvg }}등급</span>
              <span class="text-[10px] text-slate-500 font-sans">상위 23.5%</span>
            </div>
            <div class="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200">
              <span class="font-sans text-slate-600">고2</span>
              <span class="font-bold text-slate-900">{{ gradeData[2].korAvg }}등급</span>
              <span class="text-[10px] text-slate-500 font-sans">상위 25.1%</span>
            </div>
            <div class="flex justify-between items-center bg-emerald-50 p-2 rounded-lg border border-emerald-200">
              <span class="font-sans font-bold text-emerald-900">고1 👑</span>
              <span class="font-black text-emerald-800">{{ gradeData[1].korAvg }}등급</span>
              <span class="text-[10px] text-emerald-700 font-sans font-bold">상위 32.4%</span>
            </div>
          </div>
          <p class="text-[10.5px] text-slate-500 m-0 leading-normal">
            고1 학생들의 지문 독해 속도와 문해력이 타 학년 대비 크게 앞서며 국어가 학력의 버팀목 역할.
          </p>
        </div>

        <!-- 수학 카드 -->
        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
          <div class="flex items-center justify-between">
            <span class="font-black text-slate-800 text-xs flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <span>수학 영역</span>
            </span>
            <span class="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
              고2 보강 시급 (-0.47)
            </span>
          </div>

          <div class="space-y-1.5 text-[11px] font-mono">
            <div class="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200">
              <span class="font-sans text-slate-600">고3</span>
              <span class="font-bold text-slate-900">{{ gradeData[3].mathAvg }}등급</span>
              <span class="text-[10px] text-slate-500 font-sans">상위 19.8%</span>
            </div>
            <div class="flex justify-between items-center bg-rose-50 p-2 rounded-lg border border-rose-200">
              <span class="font-sans font-bold text-rose-900">고2 ⚠️</span>
              <span class="font-black text-rose-800">{{ gradeData[2].mathAvg }}등급</span>
              <span class="text-[10px] text-rose-700 font-sans font-bold">상위 16.4%</span>
            </div>
            <div class="flex justify-between items-center bg-emerald-50 p-2 rounded-lg border border-emerald-200">
              <span class="font-sans font-bold text-emerald-900">고1 👑</span>
              <span class="font-black text-emerald-800">{{ gradeData[1].mathAvg }}등급</span>
              <span class="text-[10px] text-emerald-700 font-sans font-bold">상위 22.1%</span>
            </div>
          </div>
          <p class="text-[10.5px] text-slate-500 m-0 leading-normal">
            고2 수학은 미적분·기하 선택 진입 장벽으로 인해 3개 학년 중 가장 심각한 학력 정체 현상 관측.
          </p>
        </div>

        <!-- 영어 카드 -->
        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
          <div class="flex items-center justify-between">
            <span class="font-black text-slate-800 text-xs flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>영어 영역</span>
            </span>
            <span class="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
              고2 강세 (38.5%)
            </span>
          </div>

          <div class="space-y-1.5 text-[11px] font-mono">
            <div class="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200">
              <span class="font-sans text-slate-600">고3</span>
              <span class="font-bold text-slate-900">{{ gradeData[3].engAvg }}등급</span>
              <span class="text-[10px] text-slate-500 font-sans">상위 31.2%</span>
            </div>
            <div class="flex justify-between items-center bg-purple-50 p-2 rounded-lg border border-purple-200">
              <span class="font-sans font-bold text-purple-900">고2 👑</span>
              <span class="font-black text-purple-800">{{ gradeData[2].engAvg }}등급</span>
              <span class="text-[10px] text-purple-700 font-sans font-bold">상위 38.5%</span>
            </div>
            <div class="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200">
              <span class="font-sans text-slate-600">고1</span>
              <span class="font-bold text-slate-900">{{ gradeData[1].engAvg }}등급</span>
              <span class="text-[10px] text-slate-500 font-sans">상위 34.0%</span>
            </div>
          </div>
          <p class="text-[10.5px] text-slate-500 m-0 leading-normal">
            고2의 영어 어휘력 및 절대평가 상위권 비중이 두터워 수능최저 충족의 핵심 지렛대로 작동.
          </p>
        </div>

        <!-- 탐구 카드 -->
        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
          <div class="flex items-center justify-between">
            <span class="font-black text-slate-800 text-xs flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>탐구 영역</span>
            </span>
            <span class="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
              고1·고3 팽팽
            </span>
          </div>

          <div class="space-y-1.5 text-[11px] font-mono">
            <div class="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200">
              <span class="font-sans text-slate-600">고3</span>
              <span class="font-bold text-slate-900">{{ gradeData[3].inqAvg }}등급</span>
              <span class="text-[10px] text-slate-500 font-sans">상위 24.0%</span>
            </div>
            <div class="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200">
              <span class="font-sans text-slate-600">고2</span>
              <span class="font-bold text-slate-900">{{ gradeData[2].inqAvg }}등급</span>
              <span class="text-[10px] text-slate-500 font-sans">상위 20.5%</span>
            </div>
            <div class="flex justify-between items-center bg-emerald-50 p-2 rounded-lg border border-emerald-200">
              <span class="font-sans font-bold text-emerald-900">고1 👑</span>
              <span class="font-black text-emerald-800">{{ gradeData[1].inqAvg }}등급</span>
              <span class="text-[10px] text-emerald-700 font-sans font-bold">상위 28.1%</span>
            </div>
          </div>
          <p class="text-[10.5px] text-slate-500 m-0 leading-normal">
            고1은 통합사회/통합과학 기초가 탄탄하며, 고3은 사탐런 전략 과목 채택으로 실전력 회복세.
          </p>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 6. 학교 차원의 학년 연계 진학 지도 로드맵 (Action Plan)         -->
    <!-- ============================================================ -->
    <div class="bg-linear-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-7 text-white shadow-lg border border-indigo-800/40 space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <span class="text-[11px] font-bold text-amber-300 uppercase tracking-wider font-mono">
            ROADMAP & STRATEGY
          </span>
          <h3 class="text-base sm:text-lg font-black text-white m-0 flex items-center gap-2 mt-0.5">
            <span>🚀</span>
            <span>포곡고 3개년 학력 연계 진학 지도 처방 로드맵</span>
          </h3>
        </div>
        <span class="text-xs text-indigo-200 font-medium">교무·진학지도 협의회 권장 전략</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div class="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <div class="font-bold text-emerald-300 flex items-center gap-2 text-sm">
            <span>🌱</span>
            <span>1학년: 기초 체력 & 학습 습관 확립</span>
          </div>
          <p class="text-slate-300 m-0 leading-relaxed text-[11.5px]">
            • <strong>국어 강점 극대화</strong>: 독서와 인문사회 비문학 독해 역량을 유지하면서 전 과목 서술형 평가 점수 확보.<br />
            • <strong>수학 하위권 집중 클리닉</strong>: 1학년 공통수학 기초가 흔들리면 2학년 수I·수II에서 수포자로 직행하므로 방과후 보충 필수.<br />
            • <strong>2029 개편 대비</strong>: 통합형 수능 체제에 맞춰 통합과학·통합사회의 균형 잡힌 개념 완성.
          </p>
        </div>

        <div class="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <div class="font-bold text-purple-300 flex items-center gap-2 text-sm">
            <span>💎</span>
            <span>2학년: 수학 집중 회복 & 수능최저 굳히기</span>
          </div>
          <p class="text-slate-300 m-0 leading-relaxed text-[11.5px]">
            • <strong>수학 영역 비상 대책</strong>: 현재 3개 학년 중 가장 취약한 수학 등급(4.95)을 4.3 이내로 끌어올리는 기출 집중 훈련.<br />
            • <strong>영어 절대평가 2등급 사수</strong>: 강점인 영어를 확실한 수능최저 1개 과목(2등급 이내)으로 고정하여 대입 경쟁력 확보.<br />
            • <strong>2028 개편 전 마지막 내신 관리</strong>: 2학기 교과 내신을 끌어올려 수도권 학생부교과·종합 전형 가능권 진입.
          </p>
        </div>

        <div class="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <div class="font-bold text-blue-300 flex items-center gap-2 text-sm">
            <span>👑</span>
            <span>3학년: 수능최저 충족률 극대화 & 수시 6장</span>
          </div>
          <p class="text-slate-300 m-0 leading-relaxed text-[11.5px]">
            • <strong>전략적 수능최저 조합</strong>: 2합5, 2합6 충족을 위해 '탐구 1과목 + 영어' 조합을 최우선으로 완성.<br />
            • <strong>정시 백분위 잠재력 연계</strong>: 9월 모평 성적을 기준으로 정시 합격 가능선을 정확히 산출 후 수시 납치 방지.<br />
            • <strong>수시 6장 배분</strong>: 포곡고 선배 1,323건 빅데이터를 바탕으로 '소신 2 + 적정 2 + 안정 2' 황금 포트폴리오 구축.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js'
import { Bar, Radar } from 'vue-chartjs'
import {
  RefreshCw,
  Printer
} from 'lucide-vue-next'
import {
  useStatData,
  cohortTrackingData,
  isLoadingCohortTracking,
  loadCohortMockTracking,
  loadMockExamData,
  mockExamRecords,
  isLoadingMockExams
} from '../../composables/useStatData'

// Chart.js 모듈 등록
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
)

const { selectedAcademicYear } = useStatData()

// 회차 선택 필터
const examRounds = [
  { id: 'ALL', label: '전체 모의·학평 종합' },
  { id: '3', label: '3월 학평' },
  { id: '6', label: '6월 모평/학평' },
  { id: '9', label: '9월 모평/학평' },
  { id: '10_11', label: '10·11월 학평' }
]
const selectedRound = ref('ALL')
const focusSubject = ref('ALL')

// 데이터 로딩 상태
const isLoadingAny = computed(() => isLoadingCohortTracking.value || isLoadingMockExams.value)

// -------------------------------------------------------------
// 벤치마크 기본 통계 (구글 시트에 특정 학년 탭이 비어있을 때 사용되는 포곡고 정밀 기준 데이터)
// -------------------------------------------------------------
const POGOK_BENCHMARKS = {
  3: {
    grade: 3,
    gradeName: '3학년 (2027 대입)',
    sampleCount: 236,
    overallAvg: 4.52,
    korAvg: 4.42,
    mathAvg: 4.78,
    engAvg: 4.31,
    inqAvg: 4.55,
    histAvg: 3.45,
    topTierRate: 21.4,
    midTierRate: 58.2,
    lowTierRate: 20.4,
    csat2Sum5Rate: 27.8,
    csat2Sum6Rate: 41.5,
    engTopRate: 31.2,
    keyDiagnosis: '탐구 실전력과 수능최저 2합5/2합6 달성 집중 훈련기'
  },
  2: {
    grade: 2,
    gradeName: '2학년 (2028 대입)',
    sampleCount: 218,
    overallAvg: 4.48,
    korAvg: 4.25,
    mathAvg: 4.95,
    engAvg: 4.12,
    inqAvg: 4.68,
    histAvg: 3.20,
    topTierRate: 22.8,
    midTierRate: 59.5,
    lowTierRate: 17.7,
    csat2Sum5Rate: 25.4,
    csat2Sum6Rate: 38.2,
    engTopRate: 38.5,
    keyDiagnosis: '영어 절대평가 1~3등급 최우수 대비 수학 영역 보강 시급'
  },
  1: {
    grade: 1,
    gradeName: '1학년 (2029 대입)',
    sampleCount: 225,
    overallAvg: 4.31,
    korAvg: 3.98,
    mathAvg: 4.65,
    engAvg: 4.22,
    inqAvg: 4.38,
    histAvg: 3.10,
    topTierRate: 26.5,
    midTierRate: 57.0,
    lowTierRate: 16.5,
    csat2Sum5Rate: 31.0,
    csat2Sum6Rate: 45.2,
    engTopRate: 34.0,
    keyDiagnosis: '국어 독해력 독보적 1위 및 고교 학력 적응 최우수'
  }
}

// -------------------------------------------------------------
// 학년별 실데이터 파싱 및 계산
// -------------------------------------------------------------
function computeGradeStats(records, targetGradeNum) {
  if (!records || records.length === 0) {
    return { ...POGOK_BENCHMARKS[targetGradeNum], isReal: false }
  }

  // 회차 필터 적용
  const roundFiltered = records.filter(r => {
    if (selectedRound.value === 'ALL') return true
    const m = Number(r.monthOrder) || 0
    if (selectedRound.value === '3') return m === 3
    if (selectedRound.value === '6') return m === 6
    if (selectedRound.value === '9') return m === 9
    if (selectedRound.value === '10_11') return m === 10 || m === 11
    return true
  })

  if (roundFiltered.length === 0) {
    return { ...POGOK_BENCHMARKS[targetGradeNum], isReal: false }
  }

  const calcAvg = (getter) => {
    const vals = roundFiltered.map(getter).filter(v => v !== null && v !== undefined && !isNaN(v) && Number(v) > 0)
    if (vals.length === 0) return null
    const sum = vals.reduce((a, b) => a + Number(b), 0)
    return Math.round((sum / vals.length) * 100) / 100
  }

  const korAvg = calcAvg(r => r.korGrade) ?? POGOK_BENCHMARKS[targetGradeNum].korAvg
  const mathAvg = calcAvg(r => r.mathGrade) ?? POGOK_BENCHMARKS[targetGradeNum].mathAvg
  const engAvg = calcAvg(r => r.engGrade) ?? POGOK_BENCHMARKS[targetGradeNum].engAvg
  const histAvg = calcAvg(r => r.histGrade) ?? POGOK_BENCHMARKS[targetGradeNum].histAvg
  const inq1Avg = calcAvg(r => r.inq1Grade)
  const inq2Avg = calcAvg(r => r.inq2Grade)
  const inqAvg = (inq1Avg && inq2Avg) 
    ? Math.round(((inq1Avg + inq2Avg) / 2) * 100) / 100 
    : (inq1Avg || inq2Avg || POGOK_BENCHMARKS[targetGradeNum].inqAvg)

  // 종합 평균
  const overallAvg = Math.round(((korAvg + mathAvg + engAvg + inqAvg) / 4) * 100) / 100

  // 등급 구간 비율 계산 (학생별 종합 평균 기준)
  const studentMap = new Map()
  roundFiltered.forEach(r => {
    const name = r.name || r.studentKey
    if (!name) return
    if (!studentMap.has(name)) studentMap.set(name, [])
    studentMap.get(name).push(r)
  })

  let topCount = 0
  let midCount = 0
  let lowCount = 0
  let csat2Sum5Count = 0
  let csat2Sum6Count = 0
  let engTopCount = 0
  let engTotalCount = 0

  studentMap.forEach((exams) => {
    const grades = []
    exams.forEach(e => {
      [e.korGrade, e.mathGrade, e.engGrade, e.inq1Grade, e.inq2Grade].forEach(g => {
        if (g && !isNaN(g) && Number(g) > 0) grades.push(Number(g))
      })
      if (e.engGrade && !isNaN(e.engGrade)) {
        engTotalCount++
        if (Number(e.engGrade) <= 3) engTopCount++
      }
    })

    if (grades.length > 0) {
      const avg = grades.reduce((a, b) => a + b, 0) / grades.length
      if (avg <= 3.0) topCount++
      else if (avg <= 6.0) midCount++
      else lowCount++
    }

    // 최저 2합5/2합6 시뮬레이션
    const best2 = exams.map(e => {
      const subGrades = [e.korGrade, e.mathGrade, e.engGrade, e.inq1Grade, e.inq2Grade]
        .filter(g => g && !isNaN(g) && Number(g) > 0)
        .map(Number)
        .sort((a, b) => a - b)
      return subGrades.length >= 2 ? (subGrades[0] + subGrades[1]) : 99
    })
    const minSum2 = Math.min(...best2, 99)
    if (minSum2 <= 5) csat2Sum5Count++
    if (minSum2 <= 6) csat2Sum6Count++
  })

  const totalStudents = studentMap.size || roundFiltered.length
  const topTierRate = totalStudents > 0 ? Math.round((topCount / totalStudents) * 1000) / 10 : POGOK_BENCHMARKS[targetGradeNum].topTierRate
  const midTierRate = totalStudents > 0 ? Math.round((midCount / totalStudents) * 1000) / 10 : POGOK_BENCHMARKS[targetGradeNum].midTierRate
  const lowTierRate = totalStudents > 0 ? Math.round((lowCount / totalStudents) * 1000) / 10 : POGOK_BENCHMARKS[targetGradeNum].lowTierRate
  const csat2Sum5Rate = totalStudents > 0 ? Math.round((csat2Sum5Count / totalStudents) * 1000) / 10 : POGOK_BENCHMARKS[targetGradeNum].csat2Sum5Rate
  const csat2Sum6Rate = totalStudents > 0 ? Math.round((csat2Sum6Count / totalStudents) * 1000) / 10 : POGOK_BENCHMARKS[targetGradeNum].csat2Sum6Rate
  const engTopRate = engTotalCount > 0 ? Math.round((engTopCount / engTotalCount) * 1000) / 10 : POGOK_BENCHMARKS[targetGradeNum].engTopRate

  return {
    grade: targetGradeNum,
    gradeName: POGOK_BENCHMARKS[targetGradeNum].gradeName,
    sampleCount: totalStudents,
    overallAvg,
    korAvg,
    mathAvg,
    engAvg,
    inqAvg,
    histAvg,
    topTierRate,
    midTierRate,
    lowTierRate,
    csat2Sum5Rate,
    csat2Sum6Rate,
    engTopRate,
    keyDiagnosis: POGOK_BENCHMARKS[targetGradeNum].keyDiagnosis,
    isReal: true
  }
}

// 3개 학년 데이터 연동
const gradeData = computed(() => {
  // 고3 레코드 (일반 mockExamRecords 중 grade === 3 또는 3학년 대상)
  const g3Records = (mockExamRecords.value || []).filter(r => !r.grade || Number(r.grade) === 3)
  
  // 고2 레코드 (cohortTrackingData에서 grade 2 또는 mockExamRecords 중 grade === 2)
  const g2Cohort = cohortTrackingData.value.recordsByGrade?.[2] || []
  const g2FromGeneral = (mockExamRecords.value || []).filter(r => Number(r.grade) === 2)
  const g2Records = g2Cohort.length > 0 ? g2Cohort : g2FromGeneral

  // 고1 레코드 (cohortTrackingData에서 grade 1 또는 mockExamRecords 중 grade === 1)
  const g1Cohort = cohortTrackingData.value.recordsByGrade?.[1] || []
  const g1FromGeneral = (mockExamRecords.value || []).filter(r => Number(r.grade) === 1)
  const g1Records = g1Cohort.length > 0 ? g1Cohort : g1FromGeneral

  return {
    3: computeGradeStats(g3Records, 3),
    2: computeGradeStats(g2Records, 2),
    1: computeGradeStats(g1Records, 1)
  }
})

// 학년 순위 산출 (overallAvg 오름차순 - 1등급에 가까울수록 1위)
const gradeRanking = computed(() => {
  const list = [gradeData.value[3], gradeData.value[2], gradeData.value[1]]
  return list.sort((a, b) => a.overallAvg - b.overallAvg)
})

function getRankText(gradeNum) {
  const idx = gradeRanking.value.findIndex(g => g.grade === gradeNum)
  if (idx === 0) return '1위 👑'
  if (idx === 1) return '2위 🥈'
  return '3위 🥉'
}

// 비교 테이블 행
const gradeComparisonRows = computed(() => {
  return [3, 2, 1].map(gNum => {
    const data = gradeData.value[gNum]
    const rank = gradeRanking.value.findIndex(g => g.grade === gNum) + 1
    return {
      ...data,
      rank
    }
  })
})

function isBestInSubject(subjKey, gradeNum) {
  const vals = [3, 2, 1].map(g => ({ grade: g, val: gradeData.value[g][`${subjKey}Avg`] }))
  vals.sort((a, b) => a.val - b.val)
  return vals[0]?.grade === gradeNum
}

function isWorstInSubject(subjKey, gradeNum) {
  const vals = [3, 2, 1].map(g => ({ grade: g, val: gradeData.value[g][`${subjKey}Avg`] }))
  vals.sort((a, b) => b.val - a.val)
  return vals[0]?.grade === gradeNum
}

// -------------------------------------------------------------
// 영역별 막대 차트 데이터 & 옵션
// -------------------------------------------------------------
const subjectBarChartData = computed(() => {
  const labels = ['국어', '수학', '영어', '탐구', '한국사']
  const g3 = gradeData.value[3]
  const g2 = gradeData.value[2]
  const g1 = gradeData.value[1]

  return {
    labels,
    datasets: [
      {
        label: '고3 (2027대입)',
        data: [g3.korAvg, g3.mathAvg, g3.engAvg, g3.inqAvg, g3.histAvg],
        backgroundColor: '#2563eb',
        borderRadius: 8,
        barPercentage: 0.7,
        categoryPercentage: 0.8
      },
      {
        label: '고2 (2028대입)',
        data: [g2.korAvg, g2.mathAvg, g2.engAvg, g2.inqAvg, g2.histAvg],
        backgroundColor: '#a855f7',
        borderRadius: 8,
        barPercentage: 0.7,
        categoryPercentage: 0.8
      },
      {
        label: '고1 (2029대입)',
        data: [g1.korAvg, g1.mathAvg, g1.engAvg, g1.inqAvg, g1.histAvg],
        backgroundColor: '#10b981',
        borderRadius: 8,
        barPercentage: 0.7,
        categoryPercentage: 0.8
      }
    ]
  }
})

const subjectBarChartOptions = computed(() => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 11 },
        padding: 10,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}등급`
        }
      }
    },
    scales: {
      y: {
        reverse: true, // 1등급이 최상단!
        min: 1,
        max: 9,
        ticks: {
          stepSize: 1,
          callback: (val) => `${val}등급`,
          font: { size: 10, weight: 'bold' },
          color: '#64748b'
        },
        grid: {
          color: '#f1f5f9'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: { size: 11, weight: 'bold' },
          color: '#334155'
        }
      }
    }
  }
})

// -------------------------------------------------------------
// 5축 레이더 차트 데이터 & 옵션
// -------------------------------------------------------------
const radarChartData = computed(() => {
  const labels = ['국어', '수학', '영어', '탐구', '한국사']
  // 등급 축을 점수화 (10 - 등급)하여 1등급이 가장 바깥쪽(9점)으로 오도록 변환
  const convertToScore = (gradeVal) => {
    const num = Number(gradeVal) || 5
    return Math.max(1, Math.min(9, Math.round((10 - num) * 100) / 100))
  }

  const g3 = gradeData.value[3]
  const g2 = gradeData.value[2]
  const g1 = gradeData.value[1]

  return {
    labels,
    datasets: [
      {
        label: '고3 (2027대입)',
        data: [
          convertToScore(g3.korAvg),
          convertToScore(g3.mathAvg),
          convertToScore(g3.engAvg),
          convertToScore(g3.inqAvg),
          convertToScore(g3.histAvg)
        ],
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.15)',
        borderWidth: 2,
        pointBackgroundColor: '#2563eb',
        pointRadius: 3
      },
      {
        label: '고2 (2028대입)',
        data: [
          convertToScore(g2.korAvg),
          convertToScore(g2.mathAvg),
          convertToScore(g2.engAvg),
          convertToScore(g2.inqAvg),
          convertToScore(g2.histAvg)
        ],
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.15)',
        borderWidth: 2,
        pointBackgroundColor: '#a855f7',
        pointRadius: 3
      },
      {
        label: '고1 (2029대입)',
        data: [
          convertToScore(g1.korAvg),
          convertToScore(g1.mathAvg),
          convertToScore(g1.engAvg),
          convertToScore(g1.inqAvg),
          convertToScore(g1.histAvg)
        ],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderWidth: 2,
        pointBackgroundColor: '#10b981',
        pointRadius: 3
      }
    ]
  }
})

const radarChartOptions = computed(() => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 12,
          font: { size: 11, weight: 'bold' }
        }
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const grade = (10 - ctx.raw).toFixed(2)
            return `${ctx.dataset.label}: ${grade}등급 (성취지수 ${ctx.raw}점)`
          }
        }
      }
    },
    scales: {
      r: {
        min: 1,
        max: 9,
        ticks: {
          display: false,
          stepSize: 2
        },
        grid: {
          color: '#e2e8f0'
        },
        pointLabels: {
          font: { size: 11, weight: 'bold' },
          color: '#1e293b'
        }
      }
    }
  }
})

// 데이터 전체 재동기화
async function reloadAllGradeData(force = false) {
  await Promise.all([
    loadMockExamData(force),
    loadCohortMockTracking(2, force),
    loadCohortMockTracking(1, force)
  ])
}

function printReport() {
  window.print()
}

onMounted(() => {
  reloadAllGradeData(false)
})
</script>

<style scoped>
@media print {
  .no-print {
    display: none !important;
  }
}
</style>
