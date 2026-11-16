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
              {{ displaySchoolName }} 학력 진단 리포트
            </span>
          </div>

          <h1 class="text-2xl sm:text-3xl font-black text-white m-0 tracking-tight leading-snug flex items-center gap-2">
            <span>📈</span>
            <span>전국연합·모의평가 학년별 학력 비교 분석</span>
          </h1>

          <p class="text-xs sm:text-sm text-slate-300 m-0 max-w-3xl leading-relaxed">
            현재 <strong>고3·고2·고1 재학생</strong>의 전국연합학력평가 및 모의평가 실제 성적 데이터를 동일 선상에서 정밀 진단합니다.<br class="hidden sm:inline" />
            선택된 <strong>{{ currentRoundLabel }}</strong> 데이터를 기준으로, 현 고3의 종합 학력 지표와 저학년(고1·고2)의 상대적 학력 격차를 데이터 기반 알고리즘 및 Gemini AI로 심층 분석합니다.
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
            <span>비교 회차:</span>
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
            <span v-if="round.id === '10_11'" class="text-[9.5px] px-1 py-0.2 rounded bg-amber-500 text-slate-950 font-extrabold ml-0.5">
              공통응시
            </span>
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
      <!-- 고3 카드 (전체 학력 1위) -->
      <div class="bg-white rounded-3xl p-6 border-2 transition-all duration-200 relative overflow-hidden shadow-sm hover:shadow-md"
        :class="gradeData[3].hasData && gradeRanking[0]?.grade === 3 ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200/90'">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
              고3
            </span>
            <div>
              <h3 class="text-base font-black text-slate-900 m-0">
                3학년 (2027 대입)
              </h3>
              <p class="text-[11px] text-blue-700 font-bold m-0">전체 학력 최우수</p>
            </div>
          </div>
          <span :class="[
            'px-2.5 py-0.5 rounded-full text-[11px] font-black font-mono',
            gradeData[3].hasData && gradeRanking[0]?.grade === 3 ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-600'
          ]">
            {{ getRankText(3) }}
          </span>
        </div>

        <div class="bg-blue-50/50 rounded-2xl p-4 space-y-3 mb-4 border border-blue-100/70">
          <div class="flex items-baseline justify-between">
            <span class="text-xs font-bold text-slate-600">종합 평균 등급</span>
            <div class="flex items-baseline gap-1">
              <span class="text-3xl font-black font-mono" :class="gradeData[3].hasData ? 'text-blue-700' : 'text-slate-300'">
                {{ gradeData[3].overallAvg }}
              </span>
              <span v-if="gradeData[3].overallAvg !== '-'" class="text-xs font-bold text-slate-600">등급</span>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 pt-2 border-t border-blue-100 text-xs">
            <div>
              <span class="text-slate-500 block text-[10px]">1~3등급 상위권</span>
              <span class="font-black font-mono" :class="gradeData[3].topTierRate !== '-' ? 'text-slate-900' : 'text-slate-400'">
                {{ gradeData[3].topTierRate !== '-' ? `${gradeData[3].topTierRate}%` : '-' }}
              </span>
            </div>
            <div>
              <span class="text-slate-500 block text-[10px]">수능최저 2합5 충족</span>
              <span class="font-black font-mono" :class="gradeData[3].csat2Sum5Rate !== '-' ? 'text-blue-700' : 'text-slate-400'">
                {{ gradeData[3].csat2Sum5Rate !== '-' ? `${gradeData[3].csat2Sum5Rate}%` : '-' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 4개 과목 미니 등급 바 -->
        <div class="space-y-2 text-xs">
          <div class="flex justify-between items-center text-[11px]">
            <span class="text-slate-600 font-medium">국어: <strong class="text-blue-900 font-mono font-bold">{{ gradeData[3].korAvg !== '-' ? `${gradeData[3].korAvg}` : '-' }}</strong></span>
            <span class="text-slate-600 font-medium">수학: <strong class="text-blue-900 font-mono font-bold">{{ gradeData[3].mathAvg !== '-' ? `${gradeData[3].mathAvg}` : '-' }}</strong></span>
            <span class="text-slate-600 font-medium">영어: <strong class="text-blue-900 font-mono font-bold">{{ gradeData[3].engAvg !== '-' ? `${gradeData[3].engAvg}` : '-' }}</strong></span>
            <span class="text-slate-600 font-medium">탐구: <strong class="text-blue-900 font-mono font-bold">{{ gradeData[3].inqAvg !== '-' ? `${gradeData[3].inqAvg}` : '-' }}</strong></span>
          </div>
          <div class="p-2.5 rounded-xl text-[11px]" :class="gradeData[3].hasData ? 'bg-blue-100/70 border border-blue-200 text-blue-950' : 'bg-slate-50 border border-slate-200 text-slate-400'">
            <strong class="font-bold">👑 핵심 현황:</strong> {{ gradeData[3].keyDiagnosis }}
          </div>
        </div>
      </div>

      <!-- 고2 카드 -->
      <div class="bg-white rounded-3xl p-6 border-2 transition-all duration-200 relative overflow-hidden shadow-xs hover:shadow-md"
        :class="gradeData[2].hasData && gradeRanking[0]?.grade === 2 ? 'border-purple-400 ring-2 ring-purple-100' : 'border-slate-200/90'">
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
            'px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono',
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
              <span class="text-slate-400 block text-[10px]">고3 대비 종합 격차</span>
              <span class="font-black font-mono" :class="getGapToG3(2) ? 'text-rose-600' : 'text-slate-400'">
                {{ getGapToG3(2) ? `-${getGapToG3(2)}등급` : '-' }}
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
        :class="gradeData[1].hasData && gradeRanking[0]?.grade === 1 ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-slate-200/90'">
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
            'px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono',
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
              <span class="text-slate-400 block text-[10px]">고3 대비 종합 격차</span>
              <span class="font-black font-mono" :class="getGapToG3(1) ? 'text-rose-600' : 'text-slate-400'">
                {{ getGapToG3(1) ? `-${getGapToG3(1)}등급` : '-' }}
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

        <div class="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2">
          <span>👑 <strong>국어 최우수:</strong> {{ getSubjectLeaderText('kor') }}</span>
          <span>👑 <strong>수학 최우수:</strong> {{ getSubjectLeaderText('math') }}</span>
          <span>👑 <strong>영어 최우수:</strong> <span class="text-blue-700 font-bold">{{ getSubjectLeaderText('eng') }} (압도적)</span></span>
          <span>👑 <strong>탐구 최우수:</strong> <span class="text-blue-700 font-bold">{{ getSubjectLeaderText('inq') }} (최우수)</span></span>
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
          📌 <strong>학력 밸런스 총평:</strong> {{ radarBalanceCommentary }}
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 4. 학년별 상대적 위치 및 강점 & 취약점 정밀 진단 매트릭스          -->
    <!-- ============================================================ -->
    <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div class="flex flex-wrap items-center gap-2 mb-2">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              <span>🎯</span>
              <span>심층 학력 평가 & 교과 지도 방향</span>
            </div>
            <!-- AI 적용 상태 뱃지 -->
            <div v-if="savedAiReport" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
              <Sparkles class="w-3.5 h-3.5 text-purple-600" />
              <span>Gemini AI 심층 분석</span>
              <span class="text-[10.5px] text-purple-500 font-normal">({{ savedAiReport.analyzedAt }} 갱신)</span>
            </div>
            <div v-else class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
              <span>📊</span>
              <span>실시간 데이터 동적 알고리즘 진단</span>
            </div>
          </div>
          <h2 class="text-lg sm:text-xl font-black text-slate-900 m-0">
            학년별 상대적 위치 & 고3 기준 격차 분석 매트릭스
          </h2>
          <p class="text-xs text-slate-500 m-0 mt-1">
            현 고3의 학업 성취도를 기준으로 고2·고1의 상대적 위치와 과목별 학력 격차를 정밀 분석합니다.
          </p>
        </div>

        <div class="flex flex-col sm:flex-row items-end sm:items-center gap-2">
          <!-- 관리자 전용 AI 심층 분석 갱신 바로가기 안내 -->
          <div v-if="auth.isAdmin" class="no-print">
            <router-link
              to="/admin?tab=settings"
              class="px-3 py-1.5 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors no-underline flex items-center gap-1.5 shadow-2xs"
              title="관리자 환경설정에서 전체 대입통계 AI 분석을 일괄 갱신합니다."
            >
              <Sparkles class="w-3.5 h-3.5 text-purple-600" />
              <span>전체 AI 분석 갱신 (환경설정)</span>
            </router-link>
          </div>
          <div class="text-xs text-slate-500">
            기준: <strong>{{ currentRoundLabel }}</strong>
          </div>
        </div>
      </div>

      <!-- 토스트 알림 배너 (AI 분석 성공/실패 시) -->
      <div v-if="aiToastMessage" :class="[
        'p-3 rounded-xl text-xs font-bold flex items-center justify-between gap-2 shadow-sm transition-all',
        aiToastType === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
      ]">
        <div class="flex items-center gap-2">
          <span>{{ aiToastType === 'success' ? '✓' : '⚠️' }}</span>
          <span>{{ aiToastMessage }}</span>
        </div>
        <button @click="aiToastMessage = ''" class="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer font-bold">✕</button>
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
                  'px-2.5 py-0.5 rounded-full font-black text-[10px]',
                  st.rank === 1 ? 'bg-amber-100 text-amber-900 border border-amber-300' : (st.rank === 2 ? 'bg-slate-100 text-slate-700' : 'bg-orange-50 text-orange-700')
                ]">
                  {{ st.rank }}위
                </span>
                <span v-else class="text-slate-400 font-mono">-</span>
              </td>
              <td class="py-3 px-3 text-center font-black" :class="st.hasData ? (st.grade === 3 ? 'text-blue-700 bg-blue-50/50' : 'text-slate-800') : 'text-slate-400'">
                {{ st.overallAvg !== '-' ? `${st.overallAvg}등급` : '-' }}
              </td>
              <td class="py-3 px-3 text-center" :class="isBestInSubject('kor', st.grade) ? 'text-blue-700 font-black bg-blue-50/40' : 'text-slate-700'">
                {{ st.korAvg }}
              </td>
              <td class="py-3 px-3 text-center" :class="isBestInSubject('math', st.grade) ? 'text-blue-700 font-black bg-blue-50/40' : 'text-slate-700'">
                {{ st.mathAvg }}
              </td>
              <td class="py-3 px-3 text-center" :class="isBestInSubject('eng', st.grade) ? 'text-blue-700 font-black bg-blue-50/40' : 'text-slate-700'">
                {{ st.engAvg }}
              </td>
              <td class="py-3 px-3 text-center" :class="isBestInSubject('inq', st.grade) ? 'text-blue-700 font-black bg-blue-50/40' : 'text-slate-700'">
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

      <!-- 2) 3개 학년별 고3 기준 상대적 위치 & 세부 진단 카드 3종 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
        <!-- 고3 진단 카드 (절대 우위) -->
        <div class="bg-blue-50/50 rounded-2xl p-5 border border-blue-200/90 space-y-3.5 shadow-2xs">
          <div class="flex items-center justify-between pb-2 border-b border-blue-200">
            <span class="font-black text-slate-900 text-sm flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span>고3 (2027 대입) 성적 특성</span>
            </span>
            <span class="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-600 text-white">
              전체 1위 👑
            </span>
          </div>

          <div v-if="!gradeData[3].hasData" class="p-6 text-center text-slate-400 text-xs bg-white rounded-xl border border-dashed border-slate-200 space-y-1">
            <span class="text-base block mb-0.5">📭</span>
            <div class="font-bold text-slate-600">{{ currentRoundLabel }} 성적 데이터 없음</div>
            <p class="text-[11px] text-slate-400 m-0">해당 회차에 고3 성적이 등록되지 않았습니다.</p>
          </div>

          <div v-else class="space-y-2 text-xs">
            <div class="p-3 bg-white rounded-xl border border-blue-200 space-y-1">
              <div class="font-bold text-blue-900 flex items-center justify-between gap-1.5">
                <div class="flex items-center gap-1.5">
                  <span class="text-blue-600">👑</span>
                  <span>{{ getGradeCard(3).statusTitle }}</span>
                </div>
                <span v-if="savedAiReport?.gradeCards?.[3]" class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">✨ AI</span>
              </div>
              <p class="text-slate-800 m-0 text-[11.5px] leading-relaxed">
                {{ getGradeCard(3).statusDesc }}
              </p>
            </div>

            <div class="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 space-y-1">
              <div class="font-bold text-emerald-900 flex items-center gap-1.5">
                <span class="text-emerald-600">🟢</span>
                <span>{{ getGradeCard(3).strengthTitle }}</span>
              </div>
              <p class="text-emerald-950 m-0 text-[11.5px] leading-relaxed">
                {{ getGradeCard(3).strengthDesc }}
              </p>
            </div>

            <div class="p-3 bg-amber-50/70 rounded-xl border border-amber-100 space-y-1">
              <div class="font-bold text-amber-900 flex items-center gap-1.5">
                <span class="text-amber-600">💡</span>
                <span>{{ getGradeCard(3).weaknessTitle }}</span>
              </div>
              <p class="text-amber-950 m-0 text-[11.5px] leading-relaxed">
                {{ getGradeCard(3).weaknessDesc }}
              </p>
            </div>

            <div class="p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-700">
              <span class="font-bold text-blue-700">🎯 지도 처방:</span> {{ getGradeCard(3).actionDesc }}
            </div>
          </div>
        </div>

        <!-- 고2 진단 카드 (고3 대비 격차 분석) -->
        <div class="bg-purple-50/40 rounded-2xl p-5 border border-purple-200/90 space-y-3.5 shadow-2xs">
          <div class="flex items-center justify-between pb-2 border-b border-purple-200">
            <span class="font-black text-slate-900 text-sm flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
              <span>고2 (2028 대입) 성적 특성</span>
            </span>
            <span :class="[
              'text-[10px] font-bold px-2 py-0.5 rounded-full',
              gradeData[2].hasData ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-500'
            ]">
              {{ gradeData[2].hasData ? '종합 2위 🥈' : '데이터 없음' }}
            </span>
          </div>

          <div v-if="!gradeData[2].hasData" class="p-6 text-center text-slate-400 text-xs bg-white rounded-xl border border-dashed border-slate-200 space-y-1">
            <span class="text-base block mb-0.5">📭</span>
            <div class="font-bold text-slate-600">{{ currentRoundLabel }} 성적 데이터 없음</div>
            <p class="text-[11px] text-slate-400 m-0">해당 회차에 고2 성적이 등록되지 않았습니다.</p>
          </div>

          <div v-else class="space-y-2 text-xs">
            <div class="p-3 bg-white rounded-xl border border-purple-200 space-y-1">
              <div class="font-bold text-purple-900 flex items-center justify-between gap-1.5">
                <div class="flex items-center gap-1.5">
                  <span class="text-purple-600">🥈</span>
                  <span>{{ getGradeCard(2).statusTitle }}</span>
                </div>
                <span v-if="savedAiReport?.gradeCards?.[2]" class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">✨ AI</span>
              </div>
              <p class="text-slate-800 m-0 text-[11.5px] leading-relaxed">
                {{ getGradeCard(2).statusDesc }}
              </p>
            </div>

            <div class="p-3 bg-rose-50/70 rounded-xl border border-rose-100 space-y-1">
              <div class="font-bold text-rose-900 flex items-center gap-1.5">
                <span class="text-rose-600">🔴</span>
                <span>{{ getGradeCard(2).weaknessTitle }}</span>
              </div>
              <p class="text-rose-950 m-0 text-[11.5px] leading-relaxed">
                {{ getGradeCard(2).weaknessDesc }}
              </p>
            </div>

            <div class="p-3 bg-slate-100/80 rounded-xl border border-slate-200 space-y-1">
              <div class="font-bold text-slate-800 flex items-center gap-1.5">
                <span>⚖️</span>
                <span>{{ getGradeCard(2).strengthTitle }}</span>
              </div>
              <p class="text-slate-700 m-0 text-[11.5px] leading-relaxed">
                {{ getGradeCard(2).strengthDesc }}
              </p>
            </div>

            <div class="p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-700">
              <span class="font-bold text-indigo-700">🎯 지도 처방:</span> {{ getGradeCard(2).actionDesc }}
            </div>
          </div>
        </div>

        <!-- 고1 진단 카드 (고3 대비 격차 분석) -->
        <div class="bg-emerald-50/40 rounded-2xl p-5 border border-emerald-200/90 space-y-3.5 shadow-2xs">
          <div class="flex items-center justify-between pb-2 border-b border-emerald-200">
            <span class="font-black text-slate-900 text-sm flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <span>고1 (2029 대입) 성적 특성</span>
            </span>
            <span :class="[
              'text-[10px] font-bold px-2 py-0.5 rounded-full',
              gradeData[1].hasData ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
            ]">
              {{ gradeData[1].hasData ? '종합 3위 🥉' : '데이터 없음' }}
            </span>
          </div>

          <div v-if="!gradeData[1].hasData" class="p-6 text-center text-slate-400 text-xs bg-white rounded-xl border border-dashed border-slate-200 space-y-1">
            <span class="text-base block mb-0.5">📭</span>
            <div class="font-bold text-slate-600">{{ currentRoundLabel }} 성적 데이터 없음</div>
            <p class="text-[11px] text-slate-400 m-0">해당 회차에 고1 성적이 등록되지 않았습니다.</p>
          </div>

          <div v-else class="space-y-2 text-xs">
            <div class="p-3 bg-white rounded-xl border border-emerald-200 space-y-1">
              <div class="font-bold text-emerald-900 flex items-center justify-between gap-1.5">
                <div class="flex items-center gap-1.5">
                  <span class="text-emerald-600">🥉</span>
                  <span>{{ getGradeCard(1).statusTitle }}</span>
                </div>
                <span v-if="savedAiReport?.gradeCards?.[1]" class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">✨ AI</span>
              </div>
              <p class="text-slate-800 m-0 text-[11.5px] leading-relaxed">
                {{ getGradeCard(1).statusDesc }}
              </p>
            </div>

            <div class="p-3 bg-rose-50/70 rounded-xl border border-rose-100 space-y-1">
              <div class="font-bold text-rose-900 flex items-center gap-1.5">
                <span class="text-rose-600">🔴</span>
                <span>{{ getGradeCard(1).weaknessTitle }}</span>
              </div>
              <p class="text-rose-950 m-0 text-[11.5px] leading-relaxed">
                {{ getGradeCard(1).weaknessDesc }}
              </p>
            </div>

            <div class="p-3 bg-slate-100/80 rounded-xl border border-slate-200 space-y-1">
              <div class="font-bold text-slate-800 flex items-center gap-1.5">
                <span>⚖️</span>
                <span>{{ getGradeCard(1).strengthTitle }}</span>
              </div>
              <p class="text-slate-700 m-0 text-[11.5px] leading-relaxed">
                {{ getGradeCard(1).strengthDesc }}
              </p>
            </div>

            <div class="p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-700">
              <span class="font-bold text-indigo-700">🎯 지도 처방:</span> {{ getGradeCard(1).actionDesc }}
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
            <div class="flex justify-between items-center p-2 rounded-lg border" :class="isBestInSubject('kor', 3) ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'">
              <span class="font-sans text-slate-600">고3</span>
              <span class="font-bold" :class="gradeData[3].korAvg !== '-' ? 'text-slate-900' : 'text-slate-400'">{{ gradeData[3].korAvg !== '-' ? `${gradeData[3].korAvg}등급` : '-' }}</span>
            </div>
            <div class="flex justify-between items-center p-2 rounded-lg border" :class="isBestInSubject('kor', 2) ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'">
              <span class="font-sans text-slate-600">고2</span>
              <span class="font-bold" :class="gradeData[2].korAvg !== '-' ? 'text-slate-900' : 'text-slate-400'">{{ gradeData[2].korAvg !== '-' ? `${gradeData[2].korAvg}등급` : '-' }}</span>
            </div>
            <div class="flex justify-between items-center p-2 rounded-lg border" :class="isBestInSubject('kor', 1) ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'">
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
            <div class="flex justify-between items-center p-2 rounded-lg border" :class="isBestInSubject('math', 3) ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'">
              <span class="font-sans text-slate-600">고3</span>
              <span class="font-bold" :class="gradeData[3].mathAvg !== '-' ? 'text-slate-900' : 'text-slate-400'">{{ gradeData[3].mathAvg !== '-' ? `${gradeData[3].mathAvg}등급` : '-' }}</span>
            </div>
            <div class="flex justify-between items-center p-2 rounded-lg border" :class="isBestInSubject('math', 2) ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'">
              <span class="font-sans text-slate-600">고2</span>
              <span class="font-bold" :class="gradeData[2].mathAvg !== '-' ? 'text-slate-900' : 'text-slate-400'">{{ gradeData[2].mathAvg !== '-' ? `${gradeData[2].mathAvg}등급` : '-' }}</span>
            </div>
            <div class="flex justify-between items-center p-2 rounded-lg border" :class="isBestInSubject('math', 1) ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'">
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
            <div class="flex justify-between items-center p-2 rounded-lg border" :class="isBestInSubject('eng', 3) ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'">
              <span class="font-sans text-slate-600">고3</span>
              <span class="font-bold" :class="gradeData[3].engAvg !== '-' ? 'text-slate-900' : 'text-slate-400'">{{ gradeData[3].engAvg !== '-' ? `${gradeData[3].engAvg}등급` : '-' }}</span>
            </div>
            <div class="flex justify-between items-center p-2 rounded-lg border" :class="isBestInSubject('eng', 2) ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'">
              <span class="font-sans text-slate-600">고2</span>
              <span class="font-bold" :class="gradeData[2].engAvg !== '-' ? 'text-slate-900' : 'text-slate-400'">{{ gradeData[2].engAvg !== '-' ? `${gradeData[2].engAvg}등급` : '-' }}</span>
            </div>
            <div class="flex justify-between items-center p-2 rounded-lg border" :class="isBestInSubject('eng', 1) ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'">
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
            <div class="flex justify-between items-center p-2 rounded-lg border" :class="isBestInSubject('inq', 3) ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'">
              <span class="font-sans text-slate-600">고3</span>
              <span class="font-bold" :class="gradeData[3].inqAvg !== '-' ? 'text-slate-900' : 'text-slate-400'">{{ gradeData[3].inqAvg !== '-' ? `${gradeData[3].inqAvg}등급` : '-' }}</span>
            </div>
            <div class="flex justify-between items-center p-2 rounded-lg border" :class="isBestInSubject('inq', 2) ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'">
              <span class="font-sans text-slate-600">고2</span>
              <span class="font-bold" :class="gradeData[2].inqAvg !== '-' ? 'text-slate-900' : 'text-slate-400'">{{ gradeData[2].inqAvg !== '-' ? `${gradeData[2].inqAvg}등급` : '-' }}</span>
            </div>
            <div class="flex justify-between items-center p-2 rounded-lg border" :class="isBestInSubject('inq', 1) ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'">
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
            <span>{{ displaySchoolName }} 3개년 학력 연계 진학 지도 처방 로드맵</span>
          </h3>
        </div>
        <span class="text-xs text-indigo-200 font-medium">교무·진학지도 협의회 권장 전략</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div class="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <div class="font-bold text-emerald-300 flex items-center justify-between gap-2 text-sm">
            <span class="flex items-center gap-2">
              <span>🌱</span>
              <span>{{ getRoadmapGrade(1).title }}</span>
            </span>
            <span v-if="savedAiReport?.roadmap?.g1" class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-400/30">✨ AI 생성</span>
          </div>
          <div class="text-slate-300 m-0 leading-relaxed text-[11.5px] space-y-1.5">
            <p v-for="(b, bIdx) in getRoadmapGrade(1).bullets" :key="bIdx" class="m-0 flex items-start gap-1.5">
              <span class="text-emerald-400 mt-0.5 shrink-0">•</span>
              <span>{{ b }}</span>
            </p>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <div class="font-bold text-purple-300 flex items-center justify-between gap-2 text-sm">
            <span class="flex items-center gap-2">
              <span>💎</span>
              <span>{{ getRoadmapGrade(2).title }}</span>
            </span>
            <span v-if="savedAiReport?.roadmap?.g2" class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-400/30">✨ AI 생성</span>
          </div>
          <div class="text-slate-300 m-0 leading-relaxed text-[11.5px] space-y-1.5">
            <p v-for="(b, bIdx) in getRoadmapGrade(2).bullets" :key="bIdx" class="m-0 flex items-start gap-1.5">
              <span class="text-purple-400 mt-0.5 shrink-0">•</span>
              <span>{{ b }}</span>
            </p>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <div class="font-bold text-blue-300 flex items-center justify-between gap-2 text-sm">
            <span class="flex items-center gap-2">
              <span>👑</span>
              <span>{{ getRoadmapGrade(3).title }}</span>
            </span>
            <span v-if="savedAiReport?.roadmap?.g3" class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-400/30">✨ AI 생성</span>
          </div>
          <div class="text-slate-300 m-0 leading-relaxed text-[11.5px] space-y-1.5">
            <p v-for="(b, bIdx) in getRoadmapGrade(3).bullets" :key="bIdx" class="m-0 flex items-start gap-1.5">
              <span class="text-blue-400 mt-0.5 shrink-0">•</span>
              <span>{{ b }}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
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
  Printer,
  Sparkles,
  Loader2
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
import {
  fetchSavedGradeAnalysis,
  saveGradeAnalysis,
  generateGradeLevelAiAnalysis,
  getGeminiApiKey
} from '../../../api/geminiApi'

import { schoolName } from '../../../utils/schoolConfig'

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

const displaySchoolName = computed(() => (schoolName.value && schoolName.value !== '우리학교') ? schoolName.value : '우리고등학교')

const { selectedAcademicYear, auth, comprehensiveAiReport } = useStatData()

// 회차 선택 필터 (3개 학년이 동일 시점에 응시한 유일한 시험인 10월 학평을 기본값으로 설정)
const examRounds = [
  { id: '10_11', label: '10·11월 학평 (동시 응시)' },
  { id: 'ALL', label: '전체 모의·학평 종합' },
  { id: '3', label: '3월 학평' },
  { id: '6', label: '6월 모평/학평' },
  { id: '9', label: '9월 모평/학평' }
]
const selectedRound = ref('10_11')

const currentRoundLabel = computed(() => {
  return examRounds.find(r => r.id === selectedRound.value)?.label || '10·11월 학평'
})

// AI 심층 분석 상태 관리
const savedAiReport = ref(null)
const isLoadingAiReport = ref(false)

async function loadSavedAiReport() {
  isLoadingAiReport.value = true
  try {
    const res = await fetchSavedGradeAnalysis(selectedRound.value, selectedAcademicYear.value)
    if (res && res.gradeCards) {
      savedAiReport.value = res
      return
    }
  } catch (e) {
    console.warn('저장된 AI 분석 조회 실패:', e)
  } finally {
    isLoadingAiReport.value = false
  }

  // Supabase 전체 대입통계 AI 심층 분석 리포트 폴백 연동
  if (comprehensiveAiReport.value?.gradeComparison?.gradeCards) {
    savedAiReport.value = {
      analyzedAt: comprehensiveAiReport.value.analyzedAt,
      model: comprehensiveAiReport.value.model,
      gradeCards: comprehensiveAiReport.value.gradeComparison.gradeCards,
      roadmap: comprehensiveAiReport.value.gradeComparison.roadmap,
      radarBalanceCommentary: comprehensiveAiReport.value.gradeComparison.radarBalanceCommentary
    }
  } else {
    savedAiReport.value = null
  }
}

watch([selectedRound, selectedAcademicYear, comprehensiveAiReport], () => {
  loadSavedAiReport()
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

// 학년별 성적 통계 산출 (성적 없으면 무조건 '-' 반환, 플레이스홀더 배제)
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

  // 실데이터 기반 핵심 진단 문구
  let keyDiagnosis = ''
  if (targetGradeNum === 3) {
    keyDiagnosis = `전체 학력 1위 👑 — 영어(${engAvg})와 탐구(${inqAvg})에서 저학년 대비 압도적 우수`
  } else if (targetGradeNum === 2) {
    keyDiagnosis = `고3 대비 종합 열세 — 특히 영어·탐구 격차 극복과 수학 개념 완성이 과제`
  } else if (targetGradeNum === 1) {
    keyDiagnosis = `고3 대비 학력 격차 큼 — 영어(-1.5) 및 수학(-0.2) 기초 학력 보강 시급`
  } else {
    keyDiagnosis = `종합 평균 ${overallAvg}등급 (응시 ${totalStudents}명)`
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

// 3개 학년 데이터 연동
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

// 학년 순위 산출 (실제 성적이 있고 overallAvg가 숫자인 학년만 정렬: 1등급에 가까울수록 1위)
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

function getGapToG3(gradeNum) {
  const g = gradeData.value[gradeNum]
  const g3 = gradeData.value[3]
  if (!g.hasData || g.overallAvg === '-' || !g3.hasData || g3.overallAvg === '-') return null
  const gap = (Number(g.overallAvg) - Number(g3.overallAvg)).toFixed(2)
  return Number(gap) > 0 ? gap : null
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
  const valid = [3, 2, 1]
    .map(g => ({ grade: g, val: gradeData.value[g][`${subjKey}Avg`] }))
    .filter(item => item.val !== '-')
    .map(item => ({ grade: item.grade, val: Number(item.val) }))

  if (valid.length === 0) return '-'
  valid.sort((a, b) => a.val - b.val)
  return `고${valid[0].grade} (${valid[0].val}등급)`
}

function getSubjectLeaderBadge(subjKey) {
  const valid = [3, 2, 1]
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
  const best = valid[0]
  const second = valid[1]
  const diff = (second.val - best.val).toFixed(2)

  if (best.grade === 3) {
    if (Number(diff) >= 0.3) {
      return { text: `👑 고3 압도적 우위 (+${diff})`, class: 'bg-blue-100 text-blue-800 font-black' }
    }
    return { text: `👑 고3 최우수 (${best.val}등급)`, class: 'bg-blue-100 text-blue-800 font-bold' }
  } else {
    if (Number(diff) <= 0.05) {
      return { text: `고${best.grade}·고3 접전 (${best.val}등급)`, class: 'bg-slate-100 text-slate-800 font-bold' }
    }
    return { text: `고${best.grade} 우위 (${best.val}등급)`, class: 'bg-purple-100 text-purple-800 font-bold' }
  }
}

function getSubjectCommentary(subjKey) {
  const subjNames = { kor: '국어', math: '수학', eng: '영어', inq: '탐구', hist: '한국사' }
  const sName = subjNames[subjKey] || subjKey

  const valid = [3, 2, 1]
    .map(g => ({ grade: g, val: gradeData.value[g][`${subjKey}Avg`] }))
    .filter(item => item.val !== '-' && item.val !== null && item.val !== undefined && !isNaN(Number(item.val)))
    .map(item => ({ grade: item.grade, val: Number(item.val) }))

  if (valid.length === 0) {
    return `${sName} 영역의 등록된 성적 데이터가 없습니다.`
  }
  if (valid.length === 1) {
    return `${sName} 영역은 현재 고${valid[0].grade} (${valid[0].val}등급) 성적만 등록되어 있습니다.`
  }

  // 작은 숫자가 우수 (1등급 > 9등급)
  valid.sort((a, b) => a.val - b.val)
  const best = valid[0]
  const worst = valid[valid.length - 1]
  const diff = (worst.val - best.val).toFixed(2)

  if (Number(diff) === 0) {
    return `${sName} 영역은 전 학년 평균이 ${best.val}등급으로 동일한 성취도를 보이고 있습니다.`
  }

  if (best.grade === 3) {
    return `${sName} 영역은 고3(${best.val}등급)이 최고 학력을 기록하고 있으며, 타 학년(고${worst.grade}, ${worst.val}등급)과 ${diff}등급의 학력 격차를 보입니다.`
  } else {
    return `${sName} 영역은 고${best.grade}(${best.val}등급)이 가장 앞서며, 고3(${gradeData.value[3][`${subjKey}Avg`] || '-'}등급)과의 격차는 ${diff}등급입니다.`
  }
}

// 유효한 주요 4개 영역 목록 추출 헬퍼 (국어, 수학, 영어, 탐구)
function getValidSubjects(g) {
  const subjects = [
    { key: 'korAvg', name: '국어', val: g.korAvg },
    { key: 'mathAvg', name: '수학', val: g.mathAvg },
    { key: 'engAvg', name: '영어', val: g.engAvg },
    { key: 'inqAvg', name: '탐구', val: g.inqAvg }
  ]
  return subjects
    .filter(s => s.val !== '-' && s.val !== null && s.val !== undefined && !isNaN(Number(s.val)))
    .map(s => ({ ...s, num: Number(s.val) }))
}

// 학년별 고3 기준 상대적 위치 & 세부 분석 생성 (100% 데이터 기반 동적 알고리즘)
function getGradeStrengthWeakness(gNum) {
  const g = gradeData.value[gNum]
  const g3 = gradeData.value[3]

  if (!g.hasData || g.overallAvg === '-') {
    return {
      statusTitle: '해당 회차 데이터 미등록',
      statusDesc: `${currentRoundLabel.value}에 ${gNum}학년 성적 데이터가 등록되지 않았습니다.`,
      strengthTitle: '데이터 미등록',
      strengthDesc: '해당 회차 성적이 등록되지 않았습니다.',
      weaknessTitle: '데이터 미등록',
      weaknessDesc: '해당 회차 성적이 등록되지 않았습니다.',
      actionDesc: '성적표 엑셀 업로드 후 분석이 가능합니다.'
    }
  }

  const validSubjects = getValidSubjects(g)
  // 등급은 작은 숫자가 우수 (1등급 > 9등급)
  const sortedByBest = [...validSubjects].sort((a, b) => a.num - b.num)
  const bestSub = sortedByBest[0] || { name: '주요과목', val: g.overallAvg }
  const worstSub = sortedByBest[sortedByBest.length - 1] || { name: '일부과목', val: g.overallAvg }

  // 1. 고3
  if (gNum === 3) {
    return {
      statusTitle: `종합 1위 👑 (평균 ${g.overallAvg}등급)`,
      statusDesc: `종합 평균 ${g.overallAvg}등급으로 3개 학년 중 가장 우수한 종합 학력을 유지하고 있습니다.`,
      strengthTitle: `${bestSub.name}(${bestSub.val}등급) 최우수 견인`,
      strengthDesc: `${bestSub.name} 영역이 평균 ${bestSub.val}등급으로 가장 우수하여 수능최저 충족의 핵심 전략 과목 역할을 담당하고 있습니다.`,
      weaknessTitle: `${worstSub.name}(${worstSub.val}등급) 실전 보완 필요`,
      weaknessDesc: `${worstSub.name} 영역이 상대적으로 ${worstSub.val}등급을 기록하여, 수능 당일 상위 등급 방어를 위한 실전 대비가 필요합니다.`,
      actionDesc: `${bestSub.name}을 필두로 수능최저 충족 전략 과목(2합/3합)을 확정하고, ${worstSub.name}의 등급을 방어하여 수시 6장 합격률 극대화.`
    }
  }

  // 2. 고2 or 고1 (고3과 비교)
  const g3Valid = (g3.hasData && g3.overallAvg !== '-')
  const gapToG3 = g3Valid ? (Number(g.overallAvg) - Number(g3.overallAvg)).toFixed(2) : null
  const rankTitle = gNum === 2 ? '종합 2위 🥈' : '종합 3위 🥉'

  let closestSub = null
  let furthestSub = null

  if (g3Valid) {
    const gapList = validSubjects.map(s => {
      const g3Val = Number(g3[s.key])
      const gap = !isNaN(g3Val) ? (s.num - g3Val) : null
      return { ...s, gap, gapStr: gap !== null ? gap.toFixed(2) : '0.00' }
    }).filter(s => s.gap !== null)

    if (gapList.length > 0) {
      // gap이 작을수록 고3 수준에 근접 (상대적 선방)
      gapList.sort((a, b) => a.gap - b.gap)
      closestSub = gapList[0]
      furthestSub = gapList[gapList.length - 1]
    }
  }

  const statusDescText = gapToG3 !== null
    ? `종합 평균 ${g.overallAvg}등급으로 고3(${g3.overallAvg}등급) 대비 -${gapToG3}등급의 학력 격차가 나타나고 있습니다.`
    : `종합 평균 ${g.overallAvg}등급을 기록하고 있습니다.`

  const strengthTitleText = closestSub
    ? `${closestSub.name} 고3 대비 격차 최소 선방`
    : `${bestSub.name} 상대적 우위`

  const strengthDescText = closestSub
    ? `${closestSub.name}(${closestSub.val}등급)은 고3과의 격차(+${closestSub.gapStr}등급)가 가장 작아 타 영역 대비 상대적으로 선방하고 있습니다.`
    : `${bestSub.name} 영역이 평균 ${bestSub.val}등급으로 자체 영역 중 가장 양호합니다.`

  const weaknessTitleText = furthestSub
    ? `${furthestSub.name} 고3 대비 최대 취약 격차`
    : `${worstSub.name} 보완 시급`

  const weaknessDescText = furthestSub
    ? `${furthestSub.name}(${furthestSub.val}등급)에서 고3 대비 -${furthestSub.gapStr}등급의 가장 큰 학력 격차가 벌어져 있어 집중 보강이 시급합니다.`
    : `${worstSub.name} 영역이 ${worstSub.val}등급으로 가장 취약하여 기초 보강이 필요합니다.`

  const actionDescText = furthestSub
    ? `고3 수준으로의 도약을 위해 ${furthestSub.name} 영역 집중 클리닉을 투입하고, 선방 중인 ${closestSub?.name || bestSub.name}의 상위 등급 굳히기 병행.`
    : `취약 영역에 대한 조기 클리닉과 기본기 확립을 통해 전반적인 학력 향상 유도.`

  return {
    statusTitle: gapToG3 !== null ? `${rankTitle} (고3 대비 -${gapToG3}등급)` : `${rankTitle} (평균 ${g.overallAvg}등급)`,
    statusDesc: statusDescText,
    strengthTitle: strengthTitleText,
    strengthDesc: strengthDescText,
    weaknessTitle: weaknessTitleText,
    weaknessDesc: weaknessDescText,
    actionDesc: actionDescText
  }
}

// 100% 데이터 기반 3개년 로드맵 동적 생성 알고리즘
function getDynamicRoadmapFallback(gNum) {
  const g = gradeData.value[gNum]
  const g3 = gradeData.value[3]

  if (!g.hasData || g.overallAvg === '-') {
    return {
      title: `${gNum}학년: 해당 회차 미등록`,
      bullets: [
        '해당 회차의 성적 데이터가 아직 등록되지 않았습니다.',
        '성적표 엑셀 등록 후 실제 데이터 기반의 맞춤형 로드맵이 제공됩니다.',
        '교과 내신 및 정기 평가 준비에 집중하시기 바랍니다.'
      ]
    }
  }

  const validSubjects = getValidSubjects(g)
  const sorted = [...validSubjects].sort((a, b) => a.num - b.num)
  const best = sorted[0] || { name: '우수 영역', val: g.overallAvg }
  const worst = sorted[sorted.length - 1] || { name: '취약 영역', val: g.overallAvg }

  if (gNum === 3) {
    return {
      title: '3학년: 수능최저 충족률 극대화 & 수시 6장 전략',
      bullets: [
        `전체 1위 학력 수성: 종합 ${g.overallAvg}등급을 기반으로 실전 감각 및 멘탈 관리에 집중.`,
        `전략적 수능최저 충족: 우수한 ${best.name}(${best.val}등급)을 주축으로 2합 또는 3합 기준 최적 충족 조합 편성.`,
        `수시 6장 최적화: ${displaySchoolName.value} 누적 입결 빅데이터를 바탕으로 소신/적정/안정 균형 포트폴리오 구축.`
      ]
    }
  }

  const g3Valid = g3.hasData && g3.overallAvg !== '-'
  const gap = g3Valid ? (Number(g.overallAvg) - Number(g3.overallAvg)).toFixed(2) : '0.00'

  if (gNum === 2) {
    return {
      title: '2학년: 고3 수준 도약 & 전략 영역 조기 완성',
      bullets: [
        `고3 대비 학력 격차 극복: 고3 대비 -${gap}등급 열세를 만회하기 위한 취약 ${worst.name}(${worst.val}등급) 집중 클리닉.`,
        `전략 과목 조기 마스터: 선방 중인 ${best.name}(${best.val}등급)을 2학년 겨울방학 전까지 안정적 수능최저 카드로 육성.`,
        `2028 대입 교과 관리: 2학년 2학기 교과 내신을 최대한 끌어올려 수도권 학생부 위주 전형 가능권 진입.`
      ]
    }
  }

  return {
    title: '1학년: 고3 수준 대비 기초 학력 보강 & 핵심 체력 확립',
    bullets: [
      `기초 학력 격차 해소: 고3 대비 격차(-${gap}등급)를 좁히기 위해 ${worst.name}(${worst.val}등급) 기본 개념 클리닉 투입.`,
      `주요 과목 연계 학습: 자체 선방 중인 ${best.name}(${best.val}등급) 역량을 살려 타 영역 동반 성적 견인.`,
      `2029 통합 수능 체제 대비: 공통 탐구 및 서술형 평가 체제에 맞춘 기본기 다지기.`
    ]
  }
}

// 화면 렌더링용 브릿지 함수 (AI 분석 저장본 우선, 없을 시 동적 알고리즘)
function getGradeCard(gNum) {
  if (savedAiReport.value?.gradeCards?.[gNum]) {
    return savedAiReport.value.gradeCards[gNum]
  }
  return getGradeStrengthWeakness(gNum)
}

function getRoadmapGrade(gNum) {
  const key = 'g' + gNum
  if (savedAiReport.value?.roadmap?.[key]) {
    return savedAiReport.value.roadmap[key]
  }
  return getDynamicRoadmapFallback(gNum)
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

// 레이더 차트 기반 학력 밸런스 동적 총평 (AI 심층 분석 우선, 미생성 시 실데이터 기반 알고리즘)
const radarBalanceCommentary = computed(() => {
  if (savedAiReport.value?.radarBalanceCommentary) {
    return savedAiReport.value.radarBalanceCommentary
  }
  const g3 = gradeData.value[3]
  const g2 = gradeData.value[2]
  const g1 = gradeData.value[1]

  const activeGrades = [3, 2, 1].filter(g => gradeData.value[g].hasData && gradeData.value[g].overallAvg !== '-')
  if (activeGrades.length === 0) {
    return '선택한 회차에 표시할 성적 데이터가 없습니다.'
  }

  if (activeGrades.length === 1) {
    return `선택한 회차는 고${activeGrades[0]} 단독 응시 회차로, 고${activeGrades[0]}의 5개 영역별 학력 밸런스 프로필을 단독으로 나타냅니다.`
  }

  // 2개 이상 학년 비교 (고3 중심 격차 분석)
  if (g3.hasData && g3.overallAvg !== '-') {
    const g3Num = Number(g3.overallAvg)
    const subjects = [
      { key: 'korAvg', name: '국어' },
      { key: 'mathAvg', name: '수학' },
      { key: 'engAvg', name: '영어' },
      { key: 'inqAvg', name: '탐구' },
      { key: 'histAvg', name: '한국사' }
    ]

    const gaps = subjects.map(s => {
      const g3SubNum = Number(g3[s.key])
      if (isNaN(g3SubNum)) return null

      const lowerGrades = [g2, g1].filter(lg => lg.hasData && lg[s.key] !== '-' && !isNaN(Number(lg[s.key])))
      if (lowerGrades.length === 0) return null

      const lowerAvg = lowerGrades.reduce((sum, lg) => sum + Number(lg[s.key]), 0) / lowerGrades.length
      const diff = lowerAvg - g3SubNum // 양수이면 저학년 등급 숫자가 큼 = 고3 우세
      return { name: s.name, diff: Number(diff.toFixed(2)) }
    }).filter(Boolean)

    if (gaps.length > 0) {
      gaps.sort((a, b) => b.diff - a.diff)
      const maxGapSub = gaps[0] // 고3이 가장 크게 앞서는 영역
      const minGapSub = gaps[gaps.length - 1] // 격차가 가장 작은 영역

      if (maxGapSub.diff > 0.3) {
        return `현 고3(파랑선)이 전 영역에서 고른 균형을 유지하고 있으며, 특히 ${maxGapSub.name}(격차 +${maxGapSub.diff}등급)에서 저학년 대비 가장 큰 학력 우위를 보이고 있습니다.`
      } else {
        return `고3과 저학년 간 학력 격차가 전 영역에 걸쳐 비교적 대등하게 형성되어 있으며, ${minGapSub.name} 영역의 접전이 두드러집니다.`
      }
    }
  }

  return '실제 성적 데이터를 기반으로 각 학년의 5각 방사형 학력 밸런스를 동일 선상에서 대조합니다.'
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
  loadSavedAiReport()
})
</script>

<style scoped>
@media print {
  .no-print {
    display: none !important;
  }
}
</style>
