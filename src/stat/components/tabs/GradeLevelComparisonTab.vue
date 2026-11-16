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
              고3(2027) · 고2(2028) · 고1(2029) 실데이터 비교
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
            현재 <strong>고3·고2·고1 재학생</strong>의 전국연합학력평가 및 모의평가 실제 성적 데이터를 동일 선상에서 종합 진단합니다.<br class="hidden sm:inline" />
            학년별 <strong>전체 평균 등급</strong>과 <strong>국·수·영·탐 영역별 성취도</strong>를 정밀 비교하며,
            응시하지 않았거나 성적 데이터가 없는 회차는 임의 숫자가 아닌 <strong>'-'</strong>로 정확히 표기됩니다.
          </p>
        </div>

        <!-- 우측 액션 & 연동 상태 컨트롤 박스 -->
        <div class="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 shrink-0 lg:w-80 space-y-3">
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-300 font-bold flex items-center gap-1.5">
              <span>🔄</span>
              <span>데이터 연동 상태</span>
            </span>
            <span v-if="isLoadingData" class="text-amber-300 animate-pulse text-[11px] font-bold">
              동기화 진행 중...
            </span>
            <span v-else class="text-emerald-400 font-bold text-[11px]">
              분석 완료
            </span>
          </div>

          <div class="space-y-1.5 text-[11px]">
            <div class="flex items-center justify-between bg-white/5 px-2.5 py-1 rounded-lg">
              <span class="text-slate-300">고3 (2027대입):</span>
              <span :class="gradeData[3].hasData ? 'text-emerald-300 font-bold' : 'text-slate-400 font-mono'">
                {{ gradeData[3].hasData ? `실연동 ${gradeData[3].sampleCount}명` : '-' }}
              </span>
            </div>
            <div class="flex items-center justify-between bg-white/5 px-2.5 py-1 rounded-lg">
              <span class="text-slate-300">고2 (2028대입):</span>
              <span :class="gradeData[2].hasData ? 'text-emerald-300 font-bold' : 'text-slate-400 font-mono'">
                {{ gradeData[2].hasData ? `실연동 ${gradeData[2].sampleCount}명` : '-' }}
              </span>
            </div>
            <div class="flex items-center justify-between bg-white/5 px-2.5 py-1 rounded-lg">
              <span class="text-slate-300">고1 (2029대입):</span>
              <span :class="gradeData[1].hasData ? 'text-emerald-300 font-bold' : 'text-slate-400 font-mono'">
                {{ gradeData[1].hasData ? `실연동 ${gradeData[1].sampleCount}명` : '-' }}
              </span>
            </div>
          </div>

          <div class="pt-2 border-t border-white/10 flex items-center justify-between gap-2 no-print">
            <button
              @click="reloadAllGradeData(true)"
              class="flex-1 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer border-none flex items-center justify-center gap-1.5 shadow-sm"
              :disabled="isLoadingData"
            >
              <RefreshCw :class="['w-3.5 h-3.5', isLoadingData ? 'animate-spin' : '']" />
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
          <span class="text-xs font-bold text-slate-300">선택 회차:</span>
          <span class="text-xs font-black text-amber-300 font-mono">{{ currentRoundLabel }}</span>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 2. 3개 학년 종합 학력 KPI 카드 그리드 (나란히 배치)            -->
    <!-- ============================================================ -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <!-- 고3 카드 -->
      <div class="bg-white rounded-3xl p-6 border-2 transition-all duration-200 relative overflow-hidden shadow-xs hover:shadow-md"
        :class="gradeData[3].hasData && gradeRanking[0]?.grade === 3 ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200/90'">
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
            gradeData[3].hasData && gradeRanking[0]?.grade === 3 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
          ]">
            {{ getRankText(3) }}
          </span>
        </div>

        <div class="bg-slate-50 rounded-2xl p-4 space-y-3 mb-4">
          <div class="flex items-baseline justify-between">
            <span class="text-xs font-bold text-slate-500">종합 평균 등급</span>
            <div class="flex items-baseline gap-1">
              <span class="text-3xl font-black font-mono" :class="gradeData[3].hasData ? 'text-blue-700' : 'text-slate-300'">
                {{ gradeData[3].overallAvg }}
              </span>
              <span v-if="gradeData[3].overallAvg !== '-'" class="text-xs font-bold text-slate-600">등급</span>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
            <div>
              <span class="text-slate-400 block text-[10px]">1~3등급 상위권</span>
              <span class="font-black font-mono" :class="gradeData[3].topTierRate !== '-' ? 'text-slate-800' : 'text-slate-400'">
                {{ gradeData[3].topTierRate !== '-' ? `${gradeData[3].topTierRate}%` : '-' }}
              </span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">수능최저 2합5 충족</span>
              <span class="font-black font-mono" :class="gradeData[3].csat2Sum5Rate !== '-' ? 'text-indigo-700' : 'text-slate-400'">
                {{ gradeData[3].csat2Sum5Rate !== '-' ? `${gradeData[3].csat2Sum5Rate}%` : '-' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 4개 과목 미니 등급 바 -->
        <div class="space-y-2 text-xs">
          <div class="flex justify-between items-center text-[11px]">
            <span class="text-slate-600 font-medium">국어: <strong class="text-slate-900 font-mono">{{ gradeData[3].korAvg !== '-' ? `${gradeData[3].korAvg}` : '-' }}</strong></span>
            <span class="text-slate-600 font-medium">수학: <strong class="text-slate-900 font-mono">{{ gradeData[3].mathAvg !== '-' ? `${gradeData[3].mathAvg}` : '-' }}</strong></span>
            <span class="text-slate-600 font-medium">영어: <strong class="text-slate-900 font-mono">{{ gradeData[3].engAvg !== '-' ? `${gradeData[3].engAvg}` : '-' }}</strong></span>
            <span class="text-slate-600 font-medium">탐구: <strong class="text-slate-900 font-mono">{{ gradeData[3].inqAvg !== '-' ? `${gradeData[3].inqAvg}` : '-' }}</strong></span>
          </div>
          <div class="p-2 rounded-xl text-[11px]" :class="gradeData[3].hasData ? 'bg-blue-50/60 border border-blue-100 text-blue-900' : 'bg-slate-50 border border-slate-200 text-slate-400'">
            <strong class="font-bold">💡 진단:</strong> {{ gradeData[3].keyDiagnosis }}
          </div>
        </div>
      </div>

      <!-- 고2 카드 -->
      <div class="bg-white rounded-3xl p-6 border-2 transition-all duration-200 relative overflow-hidden shadow-xs hover:shadow-md"
        :class="gradeData[2].hasData && gradeRanking[0]?.grade === 2 ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200/90'">
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
            gradeData[2].hasData && gradeRanking[0]?.grade === 2 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
          ]">
            {{ getRankText(2) }}
          </span>
        </div>

        <div class="bg-slate-50 rounded-2xl p-4 space-y-3 mb-4">
          <div class="flex items-baseline justify-between">
            <span class="text-xs font-bold text-slate-500">종합 평균 등급</span>
            <div class="flex items-baseline gap-1">
              <span class="text-3xl font-black font-mono" :class="gradeData[2].hasData ? 'text-purple-700' : 'text-slate-300'">
                {{ gradeData[2].overallAvg }}
              </span>
              <span v-if="gradeData[2].overallAvg !== '-'" class="text-xs font-bold text-slate-600">등급</span>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
            <div>
              <span class="text-slate-400 block text-[10px]">1~3등급 상위권</span>
              <span class="font-black font-mono" :class="gradeData[2].topTierRate !== '-' ? 'text-slate-800' : 'text-slate-400'">
                {{ gradeData[2].topTierRate !== '-' ? `${gradeData[2].topTierRate}%` : '-' }}
              </span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">영어 1~3등급 비율</span>
              <span class="font-black font-mono" :class="gradeData[2].engTopRate !== '-' ? 'text-purple-700' : 'text-slate-400'">
                {{ gradeData[2].engTopRate !== '-' ? `${gradeData[2].engTopRate}%` : '-' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 4개 과목 미니 등급 바 -->
        <div class="space-y-2 text-xs">
          <div class="flex justify-between items-center text-[11px]">
            <span class="text-slate-600 font-medium">국어: <strong class="text-slate-900 font-mono">{{ gradeData[2].korAvg !== '-' ? `${gradeData[2].korAvg}` : '-' }}</strong></span>
            <span class="text-slate-600 font-medium">수학: <strong class="text-slate-900 font-mono">{{ gradeData[2].mathAvg !== '-' ? `${gradeData[2].mathAvg}` : '-' }}</strong></span>
            <span class="text-slate-600 font-medium">영어: <strong class="text-slate-900 font-mono">{{ gradeData[2].engAvg !== '-' ? `${gradeData[2].engAvg}` : '-' }}</strong></span>
            <span class="text-slate-600 font-medium">탐구: <strong class="text-slate-900 font-mono">{{ gradeData[2].inqAvg !== '-' ? `${gradeData[2].inqAvg}` : '-' }}</strong></span>
          </div>
          <div class="p-2 rounded-xl text-[11px]" :class="gradeData[2].hasData ? 'bg-purple-50/60 border border-purple-100 text-purple-900' : 'bg-slate-50 border border-slate-200 text-slate-400'">
            <strong class="font-bold">💡 진단:</strong> {{ gradeData[2].keyDiagnosis }}
          </div>
        </div>
      </div>

      <!-- 고1 카드 -->
      <div class="bg-white rounded-3xl p-6 border-2 transition-all duration-200 relative overflow-hidden shadow-xs hover:shadow-md"
        :class="gradeData[1].hasData && gradeRanking[0]?.grade === 1 ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200/90'">
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
            gradeData[1].hasData && gradeRanking[0]?.grade === 1 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
          ]">
            {{ getRankText(1) }}
          </span>
        </div>

        <div class="bg-slate-50 rounded-2xl p-4 space-y-3 mb-4">
          <div class="flex items-baseline justify-between">
            <span class="text-xs font-bold text-slate-500">종합 평균 등급</span>
            <div class="flex items-baseline gap-1">
              <span class="text-3xl font-black font-mono" :class="gradeData[1].hasData ? 'text-emerald-700' : 'text-slate-300'">
                {{ gradeData[1].overallAvg }}
              </span>
              <span v-if="gradeData[1].overallAvg !== '-'" class="text-xs font-bold text-slate-600">등급</span>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
            <div>
              <span class="text-slate-400 block text-[10px]">1~3등급 상위권</span>
              <span class="font-black font-mono" :class="gradeData[1].topTierRate !== '-' ? 'text-slate-800' : 'text-slate-400'">
                {{ gradeData[1].topTierRate !== '-' ? `${gradeData[1].topTierRate}%` : '-' }}
              </span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">국어 평균 등급</span>
              <span class="font-black font-mono" :class="gradeData[1].korAvg !== '-' ? 'text-emerald-700' : 'text-slate-400'">
                {{ gradeData[1].korAvg !== '-' ? `${gradeData[1].korAvg}` : '-' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 4개 과목 미니 등급 바 -->
        <div class="space-y-2 text-xs">
          <div class="flex justify-between items-center text-[11px]">
            <span class="text-slate-600 font-medium">국어: <strong class="text-slate-900 font-mono">{{ gradeData[1].korAvg !== '-' ? `${gradeData[1].korAvg}` : '-' }}</strong></span>
            <span class="text-slate-600 font-medium">수학: <strong class="text-slate-900 font-mono">{{ gradeData[1].mathAvg !== '-' ? `${gradeData[1].mathAvg}` : '-' }}</strong></span>
            <span class="text-slate-600 font-medium">영어: <strong class="text-slate-900 font-mono">{{ gradeData[1].engAvg !== '-' ? `${gradeData[1].engAvg}` : '-' }}</strong></span>
            <span class="text-slate-600 font-medium">탐구: <strong class="text-slate-900 font-mono">{{ gradeData[1].inqAvg !== '-' ? `${gradeData[1].inqAvg}` : '-' }}</strong></span>
          </div>
          <div class="p-2 rounded-xl text-[11px]" :class="gradeData[1].hasData ? 'bg-emerald-50/60 border border-emerald-100 text-emerald-900' : 'bg-slate-50 border border-slate-200 text-slate-400'">
            <strong class="font-bold">💡 진단:</strong> {{ gradeData[1].keyDiagnosis }}
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
              <span v-if="gradeData[3].hasData" class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-blue-600"></span>고3</span>
              <span v-if="gradeData[2].hasData" class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-purple-500"></span>고2</span>
              <span v-if="gradeData[1].hasData" class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-emerald-500"></span>고1</span>
              <span v-if="!hasAnyGradeData" class="text-slate-400 font-bold">성적 미등록</span>
            </div>
          </div>

          <div class="pt-4 h-72">
            <div v-if="!hasAnyGradeData" class="h-full flex items-center justify-center text-xs text-slate-400">
              선택한 회차({{ currentRoundLabel }})에 등록된 성적 데이터가 없습니다.
            </div>
            <Bar v-else :data="subjectBarChartData" :options="subjectBarChartOptions" />
          </div>
        </div>

        <div class="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <span>👑 <strong>국어 최우수:</strong> {{ getSubjectLeaderText('kor') }}</span>
          <span>👑 <strong>수학 최우수:</strong> {{ getSubjectLeaderText('math') }}</span>
          <span>👑 <strong>영어 최우수:</strong> {{ getSubjectLeaderText('eng') }}</span>
          <span>👑 <strong>탐구 최우수:</strong> {{ getSubjectLeaderText('inq') }}</span>
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
            <div v-if="radarChartData.datasets.length === 0" class="h-full flex items-center justify-center text-xs text-slate-400">
              선택한 회차({{ currentRoundLabel }})에 표시할 성적 데이터가 없습니다.
            </div>
            <Radar v-else :data="radarChartData" :options="radarChartOptions" />
          </div>
        </div>

        <div class="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-600 leading-relaxed">
          📌 <strong>오각형 균형감:</strong> 성적이 입력된 학년만 레이더 선으로 표시되며, 영역별 고른 밸런스와 상대적 강세를 시각적으로 비교합니다.
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
          기준: <strong>{{ currentRoundLabel }}</strong>
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
                <span v-if="st.hasData && st.rank" :class="[
                  'px-2 py-0.5 rounded-full font-black text-[10px]',
                  st.rank === 1 ? 'bg-amber-100 text-amber-800' : (st.rank === 2 ? 'bg-slate-100 text-slate-700' : 'bg-orange-50 text-orange-700')
                ]">
                  {{ st.rank }}위
                </span>
                <span v-else class="text-slate-400 font-mono">-</span>
              </td>
              <td class="py-3 px-3 text-center font-black" :class="st.hasData ? 'text-indigo-700 bg-indigo-50/30' : 'text-slate-400'">
                {{ st.overallAvg !== '-' ? `${st.overallAvg}등급` : '-' }}
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
              <td class="py-3 px-3 text-center font-bold" :class="st.topTierRate !== '-' ? 'text-slate-800' : 'text-slate-400'">
                {{ st.topTierRate !== '-' ? `${st.topTierRate}%` : '-' }}
              </td>
              <td class="py-3 px-3 text-center" :class="st.midTierRate !== '-' ? 'text-slate-600' : 'text-slate-400'">
                {{ st.midTierRate !== '-' ? `${st.midTierRate}%` : '-' }}
              </td>
              <td class="py-3 px-3 text-center text-slate-400">
                {{ st.lowTierRate !== '-' ? `${st.lowTierRate}%` : '-' }}
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
            <span v-if="gradeData[1].hasData" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              분석 완료
            </span>
            <span v-else class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">
              데이터 없음
            </span>
          </div>

          <div v-if="!gradeData[1].hasData" class="p-6 text-center text-slate-400 text-xs bg-white rounded-xl border border-dashed border-slate-200 space-y-1">
            <span class="text-base block mb-0.5">📭</span>
            <div class="font-bold text-slate-600">{{ currentRoundLabel }} 성적 데이터 없음</div>
            <p class="text-[11px] text-slate-400 m-0">해당 회차에 고1 성적이 등록되지 않아 강약점 분석이 생략됩니다.</p>
          </div>

          <div v-else class="space-y-2 text-xs">
            <div class="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 space-y-1">
              <div class="font-bold text-emerald-900 flex items-center gap-1.5">
                <span class="text-emerald-600">🟢</span>
                <span>상대적 강점 (Strength)</span>
              </div>
              <p class="text-emerald-950 m-0 text-[11.5px] leading-relaxed">
                • <strong>{{ getGradeStrengthWeakness(1).strengthTitle }}</strong>: {{ getGradeStrengthWeakness(1).strengthDesc }}<br />
                • <strong>상위권 두께</strong>: 1~3등급 비율이 {{ gradeData[1].topTierRate }}%로 안정적인 학업 성취 유지.
              </p>
            </div>

            <div class="p-3 bg-rose-50/70 rounded-xl border border-rose-100 space-y-1">
              <div class="font-bold text-rose-900 flex items-center gap-1.5">
                <span class="text-rose-600">🔴</span>
                <span>상대적 약점 (Weakness)</span>
              </div>
              <p class="text-rose-950 m-0 text-[11.5px] leading-relaxed">
                • <strong>{{ getGradeStrengthWeakness(1).weaknessTitle }}</strong>: {{ getGradeStrengthWeakness(1).weaknessDesc }}
              </p>
            </div>

            <div class="p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-700">
              <span class="font-bold text-indigo-700">🎯 지도 처방:</span> {{ getGradeStrengthWeakness(1).actionDesc }}
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
            <span v-if="gradeData[2].hasData" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
              분석 완료
            </span>
            <span v-else class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">
              데이터 없음
            </span>
          </div>

          <div v-if="!gradeData[2].hasData" class="p-6 text-center text-slate-400 text-xs bg-white rounded-xl border border-dashed border-slate-200 space-y-1">
            <span class="text-base block mb-0.5">📭</span>
            <div class="font-bold text-slate-600">{{ currentRoundLabel }} 성적 데이터 없음</div>
            <p class="text-[11px] text-slate-400 m-0">해당 회차에 고2 성적이 등록되지 않아 강약점 분석이 생략됩니다.</p>
          </div>

          <div v-else class="space-y-2 text-xs">
            <div class="p-3 bg-purple-50/70 rounded-xl border border-purple-100 space-y-1">
              <div class="font-bold text-purple-900 flex items-center gap-1.5">
                <span class="text-purple-600">🟢</span>
                <span>상대적 강점 (Strength)</span>
              </div>
              <p class="text-purple-950 m-0 text-[11.5px] leading-relaxed">
                • <strong>{{ getGradeStrengthWeakness(2).strengthTitle }}</strong>: {{ getGradeStrengthWeakness(2).strengthDesc }}<br />
                • <strong>영어 1~3등급</strong>: {{ gradeData[2].engTopRate }}%를 기록하며 수능최저 핵심 카드 확보.
              </p>
            </div>

            <div class="p-3 bg-rose-50/70 rounded-xl border border-rose-100 space-y-1">
              <div class="font-bold text-rose-900 flex items-center gap-1.5">
                <span class="text-rose-600">🔴</span>
                <span>상대적 약점 (Weakness)</span>
              </div>
              <p class="text-rose-950 m-0 text-[11.5px] leading-relaxed">
                • <strong>{{ getGradeStrengthWeakness(2).weaknessTitle }}</strong>: {{ getGradeStrengthWeakness(2).weaknessDesc }}
              </p>
            </div>

            <div class="p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-700">
              <span class="font-bold text-indigo-700">🎯 지도 처방:</span> {{ getGradeStrengthWeakness(2).actionDesc }}
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
            <span v-if="gradeData[3].hasData" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              분석 완료
            </span>
            <span v-else class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">
              데이터 없음
            </span>
          </div>

          <div v-if="!gradeData[3].hasData" class="p-6 text-center text-slate-400 text-xs bg-white rounded-xl border border-dashed border-slate-200 space-y-1">
            <span class="text-base block mb-0.5">📭</span>
            <div class="font-bold text-slate-600">{{ currentRoundLabel }} 성적 데이터 없음</div>
            <p class="text-[11px] text-slate-400 m-0">해당 회차에 고3 성적이 등록되지 않아 강약점 분석이 생략됩니다.</p>
          </div>

          <div v-else class="space-y-2 text-xs">
            <div class="p-3 bg-blue-50/70 rounded-xl border border-blue-100 space-y-1">
              <div class="font-bold text-blue-900 flex items-center gap-1.5">
                <span class="text-blue-600">🟢</span>
                <span>상대적 강점 (Strength)</span>
              </div>
              <p class="text-blue-950 m-0 text-[11.5px] leading-relaxed">
                • <strong>{{ getGradeStrengthWeakness(3).strengthTitle }}</strong>: {{ getGradeStrengthWeakness(3).strengthDesc }}<br />
                • <strong>수능최저 2합5 통과</strong>: {{ gradeData[3].csat2Sum5Rate }}% 달성으로 수시 주요대 지원권 형성.
              </p>
            </div>

            <div class="p-3 bg-rose-50/70 rounded-xl border border-rose-100 space-y-1">
              <div class="font-bold text-rose-900 flex items-center gap-1.5">
                <span class="text-rose-600">🔴</span>
                <span>상대적 약점 (Weakness)</span>
              </div>
              <p class="text-rose-950 m-0 text-[11.5px] leading-relaxed">
                • <strong>{{ getGradeStrengthWeakness(3).weaknessTitle }}</strong>: {{ getGradeStrengthWeakness(3).weaknessDesc }}
              </p>
            </div>

            <div class="p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-700">
              <span class="font-bold text-indigo-700">🎯 지도 처방:</span> {{ getGradeStrengthWeakness(3).actionDesc }}
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
            <span>과목별 학년 간 등급 대조 & 현황</span>
          </h3>
          <p class="text-xs text-slate-500 m-0 mt-0.5">
            데이터가 등록된 학년 기준으로 과목별 평균 등급을 정확하게 대조합니다.
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
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded" :class="getSubjectLeaderBadge('kor').class">
              {{ getSubjectLeaderBadge('kor').text }}
            </span>
          </div>

          <div class="space-y-1.5 text-[11px] font-mono">
            <div class="flex justify-between items-center p-2 rounded-lg border" :class="isBestInSubject('kor', 3) ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'">
              <span class="font-sans text-slate-600">고3</span>
              <span class="font-bold" :class="gradeData[3].korAvg !== '-' ? 'text-slate-900' : 'text-slate-400'">{{ gradeData[3].korAvg !== '-' ? `${gradeData[3].korAvg}등급` : '-' }}</span>
            </div>
            <div class="flex justify-between items-center p-2 rounded-lg border" :class="isBestInSubject('kor', 2) ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'">
              <span class="font-sans text-slate-600">고2</span>
              <span class="font-bold" :class="gradeData[2].korAvg !== '-' ? 'text-slate-900' : 'text-slate-400'">{{ gradeData[2].korAvg !== '-' ? `${gradeData[2].korAvg}등급` : '-' }}</span>
            </div>
            <div class="flex justify-between items-center p-2 rounded-lg border" :class="isBestInSubject('kor', 1) ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'">
              <span class="font-sans text-slate-600">고1</span>
              <span class="font-bold" :class="gradeData[1].korAvg !== '-' ? 'text-slate-900' : 'text-slate-400'">{{ gradeData[1].korAvg !== '-' ? `${gradeData[1].korAvg}등급` : '-' }}</span>
            </div>
          </div>
          <p class="text-[10.5px] text-slate-500 m-0 leading-normal">
            {{ getSubjectCommentary('kor') }}
          </p>
        </div>

        <!-- 수학 카드 -->
        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
          <div class="flex items-center justify-between">
            <span class="font-black text-slate-800 text-xs flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <span>수학 영역</span>
            </span>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded" :class="getSubjectLeaderBadge('math').class">
              {{ getSubjectLeaderBadge('math').text }}
            </span>
          </div>

          <div class="space-y-1.5 text-[11px] font-mono">
            <div class="flex justify-between items-center p-2 rounded-lg border" :class="isBestInSubject('math', 3) ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'">
              <span class="font-sans text-slate-600">고3</span>
              <span class="font-bold" :class="gradeData[3].mathAvg !== '-' ? 'text-slate-900' : 'text-slate-400'">{{ gradeData[3].mathAvg !== '-' ? `${gradeData[3].mathAvg}등급` : '-' }}</span>
            </div>
            <div class="flex justify-between items-center p-2 rounded-lg border" :class="isBestInSubject('math', 2) ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'">
              <span class="font-sans text-slate-600">고2</span>
              <span class="font-bold" :class="gradeData[2].mathAvg !== '-' ? 'text-slate-900' : 'text-slate-400'">{{ gradeData[2].mathAvg !== '-' ? `${gradeData[2].mathAvg}등급` : '-' }}</span>
            </div>
            <div class="flex justify-between items-center p-2 rounded-lg border" :class="isBestInSubject('math', 1) ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'">
              <span class="font-sans text-slate-600">고1</span>
              <span class="font-bold" :class="gradeData[1].mathAvg !== '-' ? 'text-slate-900' : 'text-slate-400'">{{ gradeData[1].mathAvg !== '-' ? `${gradeData[1].mathAvg}등급` : '-' }}</span>
            </div>
          </div>
          <p class="text-[10.5px] text-slate-500 m-0 leading-normal">
            {{ getSubjectCommentary('math') }}
          </p>
        </div>

        <!-- 영어 카드 -->
        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
          <div class="flex items-center justify-between">
            <span class="font-black text-slate-800 text-xs flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>영어 영역</span>
            </span>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded" :class="getSubjectLeaderBadge('eng').class">
              {{ getSubjectLeaderBadge('eng').text }}
            </span>
          </div>

          <div class="space-y-1.5 text-[11px] font-mono">
            <div class="flex justify-between items-center p-2 rounded-lg border" :class="isBestInSubject('eng', 3) ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'">
              <span class="font-sans text-slate-600">고3</span>
              <span class="font-bold" :class="gradeData[3].engAvg !== '-' ? 'text-slate-900' : 'text-slate-400'">{{ gradeData[3].engAvg !== '-' ? `${gradeData[3].engAvg}등급` : '-' }}</span>
            </div>
            <div class="flex justify-between items-center p-2 rounded-lg border" :class="isBestInSubject('eng', 2) ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'">
              <span class="font-sans text-slate-600">고2</span>
              <span class="font-bold" :class="gradeData[2].engAvg !== '-' ? 'text-slate-900' : 'text-slate-400'">{{ gradeData[2].engAvg !== '-' ? `${gradeData[2].engAvg}등급` : '-' }}</span>
            </div>
            <div class="flex justify-between items-center p-2 rounded-lg border" :class="isBestInSubject('eng', 1) ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'">
              <span class="font-sans text-slate-600">고1</span>
              <span class="font-bold" :class="gradeData[1].engAvg !== '-' ? 'text-slate-900' : 'text-slate-400'">{{ gradeData[1].engAvg !== '-' ? `${gradeData[1].engAvg}등급` : '-' }}</span>
            </div>
          </div>
          <p class="text-[10.5px] text-slate-500 m-0 leading-normal">
            {{ getSubjectCommentary('eng') }}
          </p>
        </div>

        <!-- 탐구 카드 -->
        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
          <div class="flex items-center justify-between">
            <span class="font-black text-slate-800 text-xs flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>탐구 영역</span>
            </span>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded" :class="getSubjectLeaderBadge('inq').class">
              {{ getSubjectLeaderBadge('inq').text }}
            </span>
          </div>

          <div class="space-y-1.5 text-[11px] font-mono">
            <div class="flex justify-between items-center p-2 rounded-lg border" :class="isBestInSubject('inq', 3) ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'">
              <span class="font-sans text-slate-600">고3</span>
              <span class="font-bold" :class="gradeData[3].inqAvg !== '-' ? 'text-slate-900' : 'text-slate-400'">{{ gradeData[3].inqAvg !== '-' ? `${gradeData[3].inqAvg}등급` : '-' }}</span>
            </div>
            <div class="flex justify-between items-center p-2 rounded-lg border" :class="isBestInSubject('inq', 2) ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'">
              <span class="font-sans text-slate-600">고2</span>
              <span class="font-bold" :class="gradeData[2].inqAvg !== '-' ? 'text-slate-900' : 'text-slate-400'">{{ gradeData[2].inqAvg !== '-' ? `${gradeData[2].inqAvg}등급` : '-' }}</span>
            </div>
            <div class="flex justify-between items-center p-2 rounded-lg border" :class="isBestInSubject('inq', 1) ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'">
              <span class="font-sans text-slate-600">고1</span>
              <span class="font-bold" :class="gradeData[1].inqAvg !== '-' ? 'text-slate-900' : 'text-slate-400'">{{ gradeData[1].inqAvg !== '-' ? `${gradeData[1].inqAvg}등급` : '-' }}</span>
            </div>
          </div>
          <p class="text-[10.5px] text-slate-500 m-0 leading-normal">
            {{ getSubjectCommentary('inq') }}
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
            • <strong>국어 독해 역량 다지기</strong>: 인문·사회 비문학 및 문학 기초 어휘력을 다져 타 과목 서술형 평가 점수까지 동반 견인.<br />
            • <strong>수학 하위권 클리닉</strong>: 1학년 공통수학 개념 미흡 시 2학년 수I·수II에서 수포자로 이탈할 위험을 사전 차단.<br />
            • <strong>통합사회·과학 탐구</strong>: 2029 통합형 수능 체제에 대비한 개념 중심의 탐구 기초 체력 완성.
          </p>
        </div>

        <div class="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <div class="font-bold text-purple-300 flex items-center gap-2 text-sm">
            <span>💎</span>
            <span>2학년: 수학 집중 회복 & 수능최저 굳히기</span>
          </div>
          <p class="text-slate-300 m-0 leading-relaxed text-[11.5px]">
            • <strong>수학 영역 비상 대책</strong>: 기출 유형 반복 풀이 및 취약 단원 집중 지도로 수학 4등급 이내 안착 추진.<br />
            • <strong>영어 절대평가 2등급 사수</strong>: 강점인 영어를 확실한 수능최저 충족 1개 카드로 고정하여 대입 경쟁력 확보.<br />
            • <strong>2028 개편 직전 내신 관리</strong>: 2학기 교과 내신을 최대한 끌어올려 수도권 학생부교과·종합 전형 가능권 진입.
          </p>
        </div>

        <div class="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <div class="font-bold text-blue-300 flex items-center gap-2 text-sm">
            <span>👑</span>
            <span>3학년: 수능최저 충족률 극대화 & 수시 6장</span>
          </div>
          <p class="text-slate-300 m-0 leading-relaxed text-[11.5px]">
            • <strong>전략적 수능최저 조합</strong>: 2합5, 2합6 달성을 위해 '탐구 1과목 + 영어' 조합을 최우선으로 완성.<br />
            • <strong>정시 백분위 잠재력 연계</strong>: 6월·9월 모평 성적을 기준으로 정시 합격선을 정확히 산출 후 수시 납치 방지.<br />
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
  loadMockExamData,
  getGradeAdmissionYear
} from '../../composables/useStatData'
import {
  fetchAndParseKcueMockData,
  getKcueSheetId
} from '../../../api/statApi'

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

const currentRoundLabel = computed(() => {
  return examRounds.find(r => r.id === selectedRound.value)?.label || '전체 회차'
})

// 데이터 로딩 상태 및 학년별 원시 레코드
const isLoadingData = ref(false)
const rawGradeRecords = ref({ 1: [], 2: [], 3: [] })

// 회차 필터 매칭 헬퍼
function matchesExamRound(record, roundId) {
  if (roundId === 'ALL') return true

  // 1. 숫자 monthOrder 검사 (3~11)
  const m = Number(record.monthOrder)
  if (!isNaN(m) && m >= 3 && m <= 11) {
    if (roundId === '3') return m === 3
    if (roundId === '6') return m === 6
    if (roundId === '9') return m === 9
    if (roundId === '10_11') return m === 10 || m === 11
    return false
  }

  // 2. 텍스트(rawMonth, examName, examTitle) 검사
  const text = `${record.rawMonth || ''} ${record.examName || ''} ${record.examTitle || ''}`.trim()
  if (roundId === '3') return text.includes('3월') || /\b3\b/.test(text)
  if (roundId === '6') return text.includes('6월') || /\b6\b/.test(text)
  if (roundId === '9') return text.includes('9월') || /\b9\b/.test(text)
  if (roundId === '10_11') return text.includes('10월') || text.includes('11월') || /\b(10|11)\b/.test(text)

  return false
}

// 학년별 성적 통계 산출 (성적 없으면 무조건 '-' 반환, 플레이스홀더 완전 배제)
function computeGradeStats(records, targetGradeNum) {
  const admYear = getGradeAdmissionYear(targetGradeNum)
  const emptyResult = {
    grade: targetGradeNum,
    gradeName: `${targetGradeNum}학년 (${admYear} 대입)`,
    sampleCount: 0,
    overallAvg: '-',
    korAvg: '-',
    mathAvg: '-',
    engAvg: '-',
    inqAvg: '-',
    histAvg: '-',
    topTierRate: '-',
    midTierRate: '-',
    lowTierRate: '-',
    csat2Sum5Rate: '-',
    csat2Sum6Rate: '-',
    engTopRate: '-',
    keyDiagnosis: `${currentRoundLabel.value} 성적 데이터 미등록`,
    hasData: false
  }

  if (!records || records.length === 0) {
    return emptyResult
  }

  // 회차 필터 적용
  const roundFiltered = records.filter(r => matchesExamRound(r, selectedRound.value))
  if (roundFiltered.length === 0) {
    return emptyResult
  }

  const calcAvg = (getter) => {
    const vals = roundFiltered.map(getter).filter(v => v !== null && v !== undefined && !isNaN(v) && Number(v) > 0)
    if (vals.length === 0) return '-'
    const sum = vals.reduce((a, b) => a + Number(b), 0)
    return (sum / vals.length).toFixed(2)
  }

  const korAvg = calcAvg(r => r.korGrade)
  const mathAvg = calcAvg(r => r.mathGrade)
  const engAvg = calcAvg(r => r.engGrade)
  const histAvg = calcAvg(r => r.histGrade)
  const inq1Avg = calcAvg(r => r.inq1Grade)
  const inq2Avg = calcAvg(r => r.inq2Grade)

  let inqAvg = '-'
  if (inq1Avg !== '-' && inq2Avg !== '-') {
    inqAvg = (((Number(inq1Avg) + Number(inq2Avg)) / 2)).toFixed(2)
  } else if (inq1Avg !== '-') {
    inqAvg = inq1Avg
  } else if (inq2Avg !== '-') {
    inqAvg = inq2Avg
  }

  // 종합 평균 (유효한 국,수,영,탐 산술 평균)
  const validAvgs = [korAvg, mathAvg, engAvg, inqAvg].filter(v => v !== '-').map(Number)
  const overallAvg = validAvgs.length > 0
    ? (validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length).toFixed(2)
    : '-'

  // 학생별 상위권 및 수능최저 비율 집계
  const studentMap = new Map()
  roundFiltered.forEach(r => {
    const key = String(r.name || r.studentKey || '').trim()
    if (!key) return
    if (!studentMap.has(key)) studentMap.set(key, [])
    studentMap.get(key).push(r)
  })

  let topCount = 0
  let midCount = 0
  let lowCount = 0
  let csat2Sum5Count = 0
  let csat2Sum6Count = 0
  let engTopCount = 0
  let engValidStudents = 0

  studentMap.forEach((exams) => {
    const studentGrades = []
    let bestEng = 99
    exams.forEach(e => {
      [e.korGrade, e.mathGrade, e.engGrade, e.inq1Grade, e.inq2Grade].forEach(g => {
        if (g !== null && g !== undefined && !isNaN(g) && Number(g) > 0) {
          studentGrades.push(Number(g))
        }
      })
      if (e.engGrade !== null && !isNaN(e.engGrade) && Number(e.engGrade) > 0) {
        if (Number(e.engGrade) < bestEng) bestEng = Number(e.engGrade)
      }
    })

    if (studentGrades.length > 0) {
      const avg = studentGrades.reduce((a, b) => a + b, 0) / studentGrades.length
      if (avg <= 3.0) topCount++
      else if (avg <= 6.0) midCount++
      else lowCount++
    }

    if (bestEng <= 9) {
      engValidStudents++
      if (bestEng <= 3) engTopCount++
    }

    // Best 2 sum
    const best2Sums = exams.map(e => {
      const subGrades = [e.korGrade, e.mathGrade, e.engGrade, e.inq1Grade, e.inq2Grade]
        .filter(g => g !== null && g !== undefined && !isNaN(g) && Number(g) > 0)
        .map(Number)
        .sort((a, b) => a - b)
      return subGrades.length >= 2 ? (subGrades[0] + subGrades[1]) : 99
    })
    const min2Sum = Math.min(...best2Sums, 99)
    if (min2Sum <= 5) csat2Sum5Count++
    if (min2Sum <= 6) csat2Sum6Count++
  })

  const totalStudents = studentMap.size || roundFiltered.length
  const topTierRate = totalStudents > 0 ? ((topCount / totalStudents) * 100).toFixed(1) : '-'
  const midTierRate = totalStudents > 0 ? ((midCount / totalStudents) * 100).toFixed(1) : '-'
  const lowTierRate = totalStudents > 0 ? ((lowCount / totalStudents) * 100).toFixed(1) : '-'
  const csat2Sum5Rate = totalStudents > 0 ? ((csat2Sum5Count / totalStudents) * 100).toFixed(1) : '-'
  const csat2Sum6Rate = totalStudents > 0 ? ((csat2Sum6Count / totalStudents) * 100).toFixed(1) : '-'
  const engTopRate = engValidStudents > 0 ? ((engTopCount / engValidStudents) * 100).toFixed(1) : '-'

  // 실데이터 기반 핵심 진단 문구 자동 생성
  let keyDiagnosis = ''
  if (overallAvg !== '-') {
    const subjList = [
      { name: '국어', avg: korAvg !== '-' ? Number(korAvg) : 99 },
      { name: '수학', avg: mathAvg !== '-' ? Number(mathAvg) : 99 },
      { name: '영어', avg: engAvg !== '-' ? Number(engAvg) : 99 },
      { name: '탐구', avg: inqAvg !== '-' ? Number(inqAvg) : 99 }
    ].filter(s => s.avg < 90).sort((a, b) => a.avg - b.avg)

    const bestSubj = subjList[0]?.name || ''
    const worstSubj = subjList[subjList.length - 1]?.name || ''

    if (bestSubj && worstSubj && bestSubj !== worstSubj) {
      keyDiagnosis = `${bestSubj} 상대 우위 (${subjList[0].avg}등급) / ${worstSubj} 보강 필요 (${subjList[subjList.length - 1].avg}등급)`
    } else {
      keyDiagnosis = `종합 평균 ${overallAvg}등급 (응시 ${totalStudents}명)`
    }
  } else {
    keyDiagnosis = `${currentRoundLabel.value} 성적 데이터 미등록`
  }

  return {
    grade: targetGradeNum,
    gradeName: `${targetGradeNum}학년 (${admYear} 대입)`,
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
    keyDiagnosis,
    hasData: true
  }
}

// 3개 학년 데이터 연동 (계산)
const gradeData = computed(() => {
  return {
    3: computeGradeStats(rawGradeRecords.value[3], 3),
    2: computeGradeStats(rawGradeRecords.value[2], 2),
    1: computeGradeStats(rawGradeRecords.value[1], 1)
  }
})

const hasAnyGradeData = computed(() => {
  return gradeData.value[3].hasData || gradeData.value[2].hasData || gradeData.value[1].hasData
})

// 학년 순위 산출 (실제 성적이 있고 overallAvg가 숫자인 학년만 정렬)
const gradeRanking = computed(() => {
  const list = [3, 2, 1]
    .map(g => gradeData.value[g])
    .filter(g => g.hasData && g.overallAvg !== '-')
  return list.sort((a, b) => Number(a.overallAvg) - Number(b.overallAvg))
})

function getRankText(gradeNum) {
  const g = gradeData.value[gradeNum]
  if (!g.hasData || g.overallAvg === '-') return '미응시 (-)'
  const idx = gradeRanking.value.findIndex(item => item.grade === gradeNum)
  if (idx === -1) return '-'
  if (gradeRanking.value.length === 1) return '단독 응시'
  if (idx === 0) return '1위 👑'
  if (idx === 1) return '2위 🥈'
  return '3위 🥉'
}

// 비교 테이블 행
const gradeComparisonRows = computed(() => {
  return [3, 2, 1].map(gNum => {
    const data = gradeData.value[gNum]
    let rank = null
    if (data.hasData && data.overallAvg !== '-') {
      rank = gradeRanking.value.findIndex(g => g.grade === gNum) + 1
    }
    return {
      ...data,
      rank
    }
  })
})

function isBestInSubject(subjKey, gradeNum) {
  const valid = [3, 2, 1]
    .map(g => ({ grade: g, val: gradeData.value[g][`${subjKey}Avg`] }))
    .filter(item => item.val !== '-')
    .map(item => ({ grade: item.grade, val: Number(item.val) }))

  if (valid.length < 2) return false
  valid.sort((a, b) => a.val - b.val)
  return valid[0]?.grade === gradeNum
}

function isWorstInSubject(subjKey, gradeNum) {
  const valid = [3, 2, 1]
    .map(g => ({ grade: g, val: gradeData.value[g][`${subjKey}Avg`] }))
    .filter(item => item.val !== '-')
    .map(item => ({ grade: item.grade, val: Number(item.val) }))

  if (valid.length < 2) return false
  valid.sort((a, b) => b.val - a.val)
  return valid[0]?.grade === gradeNum
}

function getSubjectLeaderText(subjKey) {
  const valid = [1, 2, 3]
    .map(g => ({ grade: g, val: gradeData.value[g][`${subjKey}Avg`] }))
    .filter(item => item.val !== '-')
    .map(item => ({ grade: item.grade, val: Number(item.val) }))

  if (valid.length === 0) return '-'
  valid.sort((a, b) => a.val - b.val)
  return `고${valid[0].grade} (${valid[0].val}등급)`
}

function getSubjectLeaderBadge(subjKey) {
  const valid = [1, 2, 3]
    .map(g => ({ grade: g, val: gradeData.value[g][`${subjKey}Avg`] }))
    .filter(item => item.val !== '-')
    .map(item => ({ grade: item.grade, val: Number(item.val) }))

  if (valid.length === 0) {
    return { text: '데이터 없음 (-)', class: 'bg-slate-100 text-slate-500' }
  }
  if (valid.length === 1) {
    return { text: `고${valid[0].grade} 단독 응시`, class: 'bg-blue-100 text-blue-700' }
  }
  valid.sort((a, b) => a.val - b.val)
  const diff = (valid[1].val - valid[0].val).toFixed(2)
  if (Number(diff) > 0) {
    return { text: `고${valid[0].grade} 우위 (+${diff})`, class: 'bg-emerald-100 text-emerald-800' }
  }
  return { text: '동일 등급', class: 'bg-slate-100 text-slate-700' }
}

function getSubjectCommentary(subjKey) {
  const valid = [1, 2, 3]
    .map(g => ({ grade: g, val: gradeData.value[g][`${subjKey}Avg`] }))
    .filter(item => item.val !== '-')
  if (valid.length === 0) return '해당 회차는 성적 데이터가 등록되지 않았습니다.'
  if (valid.length === 1) return `해당 회차는 고${valid[0].grade} 학생들만 성적 데이터가 등록되어 단독 비교됩니다.`
  return '응시 학년 간 성적 편차를 확인하여 취약 학년 집중 보강 전략을 수립합니다.'
}

// 학년별 동적 강약점 텍스트 생성
function getGradeStrengthWeakness(gNum) {
  const g = gradeData.value[gNum]
  if (!g.hasData || g.overallAvg === '-') {
    return {
      strengthTitle: '데이터 미등록',
      strengthDesc: '해당 회차 성적이 등록되지 않았습니다.',
      weaknessTitle: '데이터 미등록',
      weaknessDesc: '해당 회차 성적이 등록되지 않았습니다.',
      actionDesc: '성적표 엑셀 업로드 후 분석이 가능합니다.'
    }
  }

  const subjects = [
    { name: '국어', val: g.korAvg !== '-' ? Number(g.korAvg) : 99 },
    { name: '수학', val: g.mathAvg !== '-' ? Number(g.mathAvg) : 99 },
    { name: '영어', val: g.engAvg !== '-' ? Number(g.engAvg) : 99 },
    { name: '탐구', val: g.inqAvg !== '-' ? Number(g.inqAvg) : 99 }
  ].filter(s => s.val < 90)

  if (subjects.length === 0) {
    return {
      strengthTitle: '영역별 성적 집계 중',
      strengthDesc: '세부 영역별 등급이 없습니다.',
      weaknessTitle: '영역별 성적 집계 중',
      weaknessDesc: '세부 영역별 등급이 없습니다.',
      actionDesc: '모의고사 성적표 데이터를 확인해 주십시오.'
    }
  }

  subjects.sort((a, b) => a.val - b.val)
  const best = subjects[0]
  const worst = subjects[subjects.length - 1]

  return {
    strengthTitle: `${best.name} 영역 강세`,
    strengthDesc: `평균 ${best.val}등급으로 해당 학년 내에서 가장 우수한 성취도를 보임.`,
    weaknessTitle: `${worst.name} 영역 보강 필요`,
    weaknessDesc: `평균 ${worst.val}등급으로 타 과목 대비 상대적으로 등급 편차가 커 집중 지도가 필요함.`,
    actionDesc: `${best.name}의 강점을 수능최저 안정 카드로 삼고, 취약한 ${worst.name} 영역의 개념 복습을 병행하십시오.`
  }
}

// -------------------------------------------------------------
// 영역별 막대 차트 데이터 & 옵션
// -------------------------------------------------------------
const subjectBarChartData = computed(() => {
  const labels = ['국어', '수학', '영어', '탐구', '한국사']
  const g3 = gradeData.value[3]
  const g2 = gradeData.value[2]
  const g1 = gradeData.value[1]

  const parseVal = (v) => (v !== '-' && v !== null && v !== undefined) ? Number(v) : null

  const datasets = []

  if (g3.hasData) {
    datasets.push({
      label: '고3 (2027대입)',
      data: [parseVal(g3.korAvg), parseVal(g3.mathAvg), parseVal(g3.engAvg), parseVal(g3.inqAvg), parseVal(g3.histAvg)],
      backgroundColor: '#2563eb',
      borderRadius: 8,
      barPercentage: 0.7,
      categoryPercentage: 0.8
    })
  }

  if (g2.hasData) {
    datasets.push({
      label: '고2 (2028대입)',
      data: [parseVal(g2.korAvg), parseVal(g2.mathAvg), parseVal(g2.engAvg), parseVal(g2.inqAvg), parseVal(g2.histAvg)],
      backgroundColor: '#a855f7',
      borderRadius: 8,
      barPercentage: 0.7,
      categoryPercentage: 0.8
    })
  }

  if (g1.hasData) {
    datasets.push({
      label: '고1 (2029대입)',
      data: [parseVal(g1.korAvg), parseVal(g1.mathAvg), parseVal(g1.engAvg), parseVal(g1.inqAvg), parseVal(g1.histAvg)],
      backgroundColor: '#10b981',
      borderRadius: 8,
      barPercentage: 0.7,
      categoryPercentage: 0.8
    })
  }

  return { labels, datasets }
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
  const convertToScore = (gradeVal) => {
    if (gradeVal === '-' || gradeVal === null || gradeVal === undefined) return null
    const num = Number(gradeVal)
    return Math.max(1, Math.min(9, Math.round((10 - num) * 100) / 100))
  }

  const datasets = []
  const g3 = gradeData.value[3]
  const g2 = gradeData.value[2]
  const g1 = gradeData.value[1]

  if (g3.hasData && g3.overallAvg !== '-') {
    datasets.push({
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
    })
  }

  if (g2.hasData && g2.overallAvg !== '-') {
    datasets.push({
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
    })
  }

  if (g1.hasData && g1.overallAvg !== '-') {
    datasets.push({
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
    })
  }

  return { labels, datasets }
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

// 데이터 전체 재동기화 (구글 시트의 실데이터를 학년별로 정확히 분리 적재)
async function reloadAllGradeData(force = false) {
  isLoadingData.value = true
  try {
    const sheetId = await getKcueSheetId()
    const targetYear = selectedAcademicYear?.value || '2027'

    // 1. 기본 active 모의 탭(2027모의결과 등) 로드
    const baseRecords = await loadMockExamData(force, targetYear)

    // 2. 혹시 다른 탭에 분리 저장되어 있을 수 있는 2028, 2026 탭도 병렬 탐색
    const [records2028, records2026] = await Promise.all([
      fetchAndParseKcueMockData(sheetId, null, null, force, '2028').catch(() => []),
      fetchAndParseKcueMockData(sheetId, null, null, force, '2026').catch(() => [])
    ])

    const allRecords = [...(baseRecords || []), ...(records2028 || []), ...(records2026 || [])]

    const g3 = []
    const g2 = []
    const g1 = []
    const seen = new Set()

    allRecords.forEach(r => {
      const g = Number(r.grade)
      const name = String(r.name || r.studentKey || '').trim()
      if (!name) return

      const m = r.monthOrder || r.rawMonth || r.examName || ''
      const dedupeKey = `${g}_${name}_${r.classNum || ''}_${r.studentNum || ''}_${m}`
      if (seen.has(dedupeKey)) return
      seen.add(dedupeKey)

      if (g === 1) g1.push(r)
      else if (g === 2) g2.push(r)
      else if (g === 3 || (!g && r.grade === undefined)) g3.push(r)
    })

    rawGradeRecords.value = {
      1: g1,
      2: g2,
      3: g3
    }
  } catch (err) {
    console.error('reloadAllGradeData error:', err)
  } finally {
    isLoadingData.value = false
  }
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
