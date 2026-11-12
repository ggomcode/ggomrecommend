<template>
  <div class="space-y-6">
    <!-- Student Search & Class Filter Header -->
    <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-center space-x-2">
        <!-- Class Selector -->
        <select 
          v-model="studentClassFilter" 
          class="min-w-67.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 pl-3.5 pr-8 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="ALL">전체 학급 (재학생 + 졸업생)</option>
          <option value="ENROLLED">재학생 전체 (1~11반)</option>
          <option v-for="c in 11" :key="c" :value="c">{{ c }}반</option>
          <option value="졸업생">🎓 졸업생</option>
        </select>

        <!-- Search Input -->
        <div class="relative w-56 sm:w-64">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="학생 이름 또는 번호 검색..." 
            class="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs pl-8 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>
      </div>

      <div class="flex items-center space-x-3">
        <div class="text-xs text-slate-500">
          검색된 학생: <strong class="text-indigo-600 font-bold">{{ studentList.length }}</strong>명
          <span v-if="studentClassFilter === 'ALL'">
            / 전체 <strong>{{ totalStudentsCount }}</strong>명<span v-if="graduateStudentsCount > 0" class="text-slate-400 font-normal"> (재학생 {{ enrolledStudentsCount }}명 + 졸업생 {{ graduateStudentsCount }}명)</span>
          </span>
          <span v-else-if="studentClassFilter === 'ENROLLED'">
            / 재학생 전체 <strong>{{ enrolledStudentsCount }}</strong>명
          </span>
          <span v-else-if="studentClassFilter === '졸업생' || studentClassFilter === 'GRADUATE'">
            / 졸업생 전체 <strong>{{ graduateStudentsCount }}</strong>명
          </span>
          <span v-else>
            / {{ studentClassFilter }}반 전체 <strong>{{ currentTargetTotalCount }}</strong>명
          </span>
        </div>
        <button
          type="button"
          @click="isTeacherReportModalOpen = true"
          class="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer border-none"
          title="특정 상담교사의 상담 기록을 공식 상담록 형태로 A4 인쇄합니다"
        >
          <span>📑</span>
          <span>교사별 상담록 인쇄 (A4)</span>
        </button>
      </div>
    </div>

    <!-- Main Content: Student Master-Detail Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Left: Student List Sidebar -->
      <div class="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col max-h-182">
        <div class="p-3 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <span>학생 명단</span>
          <span>반-번호 순 정렬</span>
        </div>

        <div class="overflow-y-auto divide-y divide-slate-100 flex-1">
          <button 
            v-for="st in studentList" 
            :key="st.key"
            @click="activeStudentKey = st.key"
            :class="[
              'w-full text-left p-3.5 transition-all flex items-center justify-between cursor-pointer border-none',
              activeStudentKey === st.key 
                ? 'bg-indigo-50/80 border-l-4 border-indigo-600' 
                : 'bg-white hover:bg-slate-50'
            ]"
          >
            <div class="flex items-center space-x-3">
              <div :class="[
                'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[10px] font-mono tracking-tighter shrink-0 px-0.5',
                st.isGraduate 
                  ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                  : (activeStudentKey === st.key ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700')
              ]">
                {{ formatStudentCode(st) }}
              </div>
              <div class="truncate">
                <div class="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <span>{{ maskName(st.name) }}</span>
                  <span v-if="st.isGraduate" class="px-1.5 py-0.2 rounded text-[10px] bg-amber-50 text-amber-800 border border-amber-200 font-semibold">졸업생</span>
                  <span v-if="st.hasRec" class="px-1 py-0.2 rounded text-[10px] bg-purple-50 text-purple-700 border border-purple-200">추천</span>
                  <span v-if="st.hasRural" class="px-1 py-0.2 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-200">농어촌</span>
                </div>
                <div class="text-[11px] text-slate-400 mt-0.5 truncate">
                  <span v-if="st.isGraduate" class="text-slate-600 font-medium mr-1.5">학번 {{ st.studentNum }}</span>
                  전교과 <strong class="text-slate-600">{{ formatGrade(st.allSubjectGrade) }}</strong> | 국영수사과 <strong class="text-slate-600">{{ formatGrade(st.mainSubjectGrade) }}</strong>
                </div>
              </div>
            </div>

            <div class="text-right shrink-0">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700">
                {{ st.apps.length }}건
              </span>
            </div>
          </button>

          <div v-if="studentList.length === 0" class="p-8 text-center text-xs text-slate-400">
            검색 조건에 맞는 학생이 없습니다.
          </div>
        </div>
      </div>

      <!-- Right: Detailed Portfolio & 1:1 Counsel Panel for Selected Student -->
      <div v-if="currentStudent" class="lg:col-span-8 space-y-5">
        
        <!-- 1. Student Overview Profile Card -->
        <div class="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div class="flex items-center space-x-4">
              <div :class="[
                'w-14 h-14 rounded-2xl text-white flex items-center justify-center font-black text-sm font-mono tracking-tight shadow-md px-1.5',
                currentStudent.isGraduate 
                  ? 'bg-linear-to-tr from-amber-600 to-amber-400 shadow-amber-500/20' 
                  : 'bg-linear-to-tr from-indigo-600 to-sky-400 shadow-indigo-500/20'
              ]">
                {{ formatStudentCode(currentStudent) }}
              </div>
              <div>
                <div class="flex flex-wrap items-center gap-1.5">
                  <h3 class="text-lg font-bold text-slate-900 m-0">{{ maskName(currentStudent.name) }}</h3>
                  <span v-if="currentStudent.isGraduate" class="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
                    졸업생 (학번: {{ currentStudent.studentNum }}{{ currentStudent.grade ? ' / ' + currentStudent.grade + '년 졸업' : '' }})
                  </span>
                  <span v-else class="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                    3학년 {{ currentStudent.classNum }}반 {{ currentStudent.studentNum }}번
                  </span>
                  <span v-if="currentStudent.hasRec" class="px-2 py-0.5 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                    학교장추천 배정
                  </span>
                  <span v-if="currentStudent.hasRural" class="px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    농어촌전형 출원
                  </span>
                </div>
                <p class="text-xs text-slate-400 mt-1 m-0">
                  총 <span class="font-bold text-indigo-600">{{ currentStudent.apps.length }}건</span> 수시 지원 (수도권 {{ currentStudent.metroAppsCount }}건 / {{ currentStudent.metroRate }}%)
                </p>
              </div>
            </div>

            <!-- Grade Badges -->
            <div class="flex items-center space-x-2">
              <div class="text-right bg-indigo-50/70 border border-indigo-100 rounded-xl px-3 py-2">
                <div class="text-[10px] text-indigo-600 font-medium">전교과(100) 등급</div>
                <div class="text-base font-bold text-indigo-700">{{ formatGrade(currentStudent.allSubjectGrade) }}</div>
              </div>
              <div class="text-right bg-sky-50/70 border border-sky-100 rounded-xl px-3 py-2">
                <div class="text-[10px] text-sky-600 font-medium">국영수사/과 등급</div>
                <div class="text-base font-bold text-sky-700">{{ formatGrade(currentStudent.mainSubjectGrade) }}</div>
              </div>
            </div>
          </div>

          <!-- Subject Specific Grades Breakdown -->
          <div class="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4 text-center">
            <div class="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div class="text-[10px] text-slate-400">국어</div>
              <div class="text-xs font-bold text-slate-800">{{ formatGrade(currentStudent.korGrade) }}</div>
            </div>
            <div class="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div class="text-[10px] text-slate-400">영어</div>
              <div class="text-xs font-bold text-slate-800">{{ formatGrade(currentStudent.engGrade) }}</div>
            </div>
            <div class="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div class="text-[10px] text-slate-400">수학</div>
              <div class="text-xs font-bold text-slate-800">{{ formatGrade(currentStudent.mathGrade) }}</div>
            </div>
            <div class="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div class="text-[10px] text-slate-400">사회</div>
              <div class="text-xs font-bold text-slate-800">{{ formatGrade(currentStudent.socGrade) }}</div>
            </div>
            <div class="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div class="text-[10px] text-slate-400">과학</div>
              <div class="text-xs font-bold text-slate-800">{{ formatGrade(currentStudent.sciGrade) }}</div>
            </div>
            <div class="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div class="text-[10px] text-slate-400">국영수</div>
              <div class="text-xs font-bold text-slate-800">{{ formatGrade(currentStudent.koreanMathEnglish) }}</div>
            </div>
          </div>
        </div>

        <!-- 2. 상담 전략 바: [정시 기대선 & 수시 납치 배너] + [수능 실전 예측기] + [A4 인쇄 버튼] -->
        <div class="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
          
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <!-- 정시 기대선 배지 -->
            <div class="flex items-center space-x-2.5">
              <span class="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                🎯
              </span>
              <div>
                <div class="flex items-center space-x-2">
                  <span class="text-xs font-bold text-slate-900">모평 기준 정시 기대선:</span>
                  <span class="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {{ jungsiBaseline.bandName }}
                  </span>
                </div>
                <div class="text-[11px] text-slate-500 mt-0.5">
                  {{ jungsiBaseline.lineName }}
                </div>
              </div>
            </div>

            <!-- 우측 액션: 인쇄 리포트 모달 열기 & 스왑 초기화 -->
            <div class="flex items-center space-x-2 shrink-0">
              <button
                v-if="hasSwappedCards"
                type="button"
                @click="resetSwappedCards"
                class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-200 flex items-center space-x-1"
                title="임시 스왑된 추천 카드를 원래 카드로 복원합니다"
              >
                <span>🔄</span>
                <span>스왑 원복</span>
              </button>

              <!-- 교사별 상담록 인쇄 버튼 -->
              <button
                type="button"
                @click="isTeacherReportModalOpen = true"
                class="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer border-none"
                title="교사별 상담록 인쇄 모달을 엽니다"
              >
                <span>📑</span>
                <span>교사별 상담록 인쇄</span>
              </button>

              <button
                type="button"
                @click="isPrintModalOpen = true"
                class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer border-none"
              >
                <span>🖨️</span>
                <span>학부모 상담 리포트 (A4 1장)</span>
              </button>
            </div>
          </div>

          <!-- N수생 유입 반영 수능 실전 예측 시뮬레이터 -->
          <div class="space-y-2 pt-1 text-xs">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div class="flex items-center space-x-2 text-slate-600">
                <span class="font-bold text-slate-800">📊 N수생 유입 수능 실전 시뮬레이터:</span>
                <span class="text-[11px] text-slate-400">수능 당일 N수생 유입에 따른 등급 변동을 실시간 테스트합니다</span>
              </div>

              <!-- 3단계 시뮬레이터 버튼 -->
              <div class="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 shrink-0">
                <button
                  type="button"
                  @click="simulationOffset = -1"
                  :class="[
                    'px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer border-none flex items-center space-x-1',
                    simulationOffset === -1 
                      ? 'bg-rose-500 text-white shadow-xs' 
                      : 'bg-transparent text-slate-600 hover:text-slate-900'
                  ]"
                  title="N수생 대거 유입으로 수능 당일 실전 등급이 1등급 하락하는 보수적 상황을 가정합니다"
                >
                  <span>📉</span>
                  <span>보수적 (-1등급)</span>
                </button>
                <button
                  type="button"
                  @click="simulationOffset = 0"
                  :class="[
                    'px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer border-none flex items-center space-x-1',
                    simulationOffset === 0 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'bg-transparent text-slate-600 hover:text-slate-900'
                  ]"
                  title="평소 모의고사 성적 그대로 실력을 발휘하는 기준선입니다"
                >
                  <span>⚖️</span>
                  <span>현상 유지 (기준)</span>
                </button>
                <button
                  type="button"
                  @click="simulationOffset = 1"
                  :class="[
                    'px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer border-none flex items-center space-x-1',
                    simulationOffset === 1 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'bg-transparent text-slate-600 hover:text-slate-900'
                  ]"
                  title="수능 당일 기량을 120% 발휘하여 1등급 상승하는 낙관적 상황을 가정합니다"
                >
                  <span>🚀</span>
                  <span>낙관적 (+1등급)</span>
                </button>
              </div>
            </div>

            <!-- [실시간 시뮬레이션 결과 뷰어] 현재 적용 등급 및 최저 충족 영향 즉각 표시 -->
            <div 
              v-if="effectiveMockExam"
              :class="[
                'p-2.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-2 transition-all duration-200',
                simulationOffset === -1 
                  ? 'bg-rose-50/80 border-rose-200 text-rose-900' 
                  : simulationOffset === 1 
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
                    : 'bg-slate-50 border-slate-200 text-slate-700'
              ]"
            >
              <!-- 좌측: 현재 적용 중인 가상 수능 등급 칩스 -->
              <div class="flex items-center flex-wrap gap-1.5 text-xs">
                <span class="font-bold text-slate-800 shrink-0">
                  {{ simulationOffset === -1 ? '📉 실전 -1등급 반영 수능 등급:' : simulationOffset === 1 ? '🚀 실전 +1등급 반영 수능 등급:' : '⚖️ 모평 기준 수능 등급:' }}
                </span>
                <span class="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold shadow-2xs text-[11px]">
                  국 <strong :class="simulationOffset === -1 ? 'text-rose-600' : simulationOffset === 1 ? 'text-emerald-600' : 'text-indigo-600'">{{ effectiveMockExam.korGrade }}</strong>
                </span>
                <span class="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold shadow-2xs text-[11px]">
                  수 <strong :class="simulationOffset === -1 ? 'text-rose-600' : simulationOffset === 1 ? 'text-emerald-600' : 'text-indigo-600'">{{ effectiveMockExam.mathGrade }}</strong>
                </span>
                <span class="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold shadow-2xs text-[11px]">
                  영 <strong :class="simulationOffset === -1 ? 'text-rose-600' : simulationOffset === 1 ? 'text-emerald-600' : 'text-indigo-600'">{{ effectiveMockExam.engGrade }}</strong>
                </span>
                <span class="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold shadow-2xs text-[11px]">
                  탐 <strong :class="simulationOffset === -1 ? 'text-rose-600' : simulationOffset === 1 ? 'text-emerald-600' : 'text-indigo-600'">{{ effectiveMockExam.tam1Grade }}</strong>
                </span>
                <span class="text-[10px] text-slate-400 font-normal ml-1">
                  ({{ effectiveMockExam.isEstimated ? '💡 내신 기반 추정 모평 성적' : `📊 ${effectiveMockExam.examName || '최신 모평'} 성적 기준` }})
                </span>
              </div>

              <!-- 우측: 수능최저 충족 장수 및 안전도 점수 실시간 반응 -->
              <div class="flex items-center space-x-2 shrink-0 text-xs">
                <div class="flex items-center space-x-1.5 font-bold">
                  <span>수능최저 충족:</span>
                  <span :class="[
                    'px-2 py-0.5 rounded-full text-xs font-black',
                    csatSimulationSummary.satisfiedCount >= 4 ? 'bg-emerald-100 text-emerald-800' :
                    csatSimulationSummary.satisfiedCount >= 2 ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                  ]">
                    6장 중 {{ csatSimulationSummary.satisfiedCount }}장 ({{ csatSimulationSummary.ratePct }}%)
                  </span>
                </div>

                <div class="flex items-center space-x-1 pl-2 border-l border-slate-300 font-bold">
                  <span class="text-slate-500">안전도:</span>
                  <span class="text-indigo-700 font-black text-sm">{{ portfolioAnalysis.safetyScore }}점</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- 3. 서브 탭 스위처: [1. 지원 6장 카드 진단] | [2. 맞춤 추천 대학] | [3. 도플갱어 선배 복기] -->
        <div class="flex items-center space-x-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            @click="activeSubTab = 'DIAGNOSIS'"
            :class="[
              'px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-none flex items-center space-x-1.5',
              activeSubTab === 'DIAGNOSIS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            ]"
          >
            <span>📋</span>
            <span>1. 지원 6장 카드 데이터 진단 & 일정 체크</span>
            <span class="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-extrabold">
              {{ currentStudent.apps.length }}장
            </span>
          </button>

          <button
            type="button"
            @click="activeSubTab = 'RECOMMEND'"
            :class="[
              'px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-none flex items-center space-x-1.5',
              activeSubTab === 'RECOMMEND'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            ]"
          >
            <span>💡</span>
            <span>2. 맞춤 합격 라인 제안 (상향·적정·안정·하향)</span>
            <span class="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-800 font-extrabold">
              추천
            </span>
          </button>

          <button
            type="button"
            @click="activeSubTab = 'SENIORS'"
            :class="[
              'px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-none flex items-center space-x-1.5',
              activeSubTab === 'SENIORS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            ]"
          >
            <span>👥</span>
            <span>3. 도플갱어 선배 합불 복기 (내신 ±0.15)</span>
            <span class="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-extrabold">
              {{ doppelgangerSeniors.length }}명
            </span>
          </button>
        </div>

        <!-- 4-A. [서브 탭 1]: 기존 지원 6장 카드 심층 진단 & 시뮬레이션 -->
        <div v-show="activeSubTab === 'DIAGNOSIS'" class="space-y-5">
          
          <!-- 포트폴리오 안전도 스코어 & 7대 입체 평가 지표 헤더 -->
          <div class="bg-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <!-- 점수 및 등급 배지 (클릭 시 아코디언 토글 & 호버 효과) -->
              <div 
                @click="toggleScoreAccordion('ALL')"
                class="group cursor-pointer p-2 -m-2 rounded-xl transition-all duration-200 hover:bg-white/5"
                title="클릭 시 7대 지표별 세부 배점 및 산출 근거 아코디언이 펼쳐집니다"
              >
                <div class="text-[11px] font-bold text-indigo-300 uppercase tracking-wide flex items-center space-x-1.5">
                  <span>📊</span>
                  <span>7대 입체 평가 지표 기반 6장 포트폴리오 안전도</span>
                  <span class="text-[10px] text-indigo-400/80 group-hover:text-indigo-200 transition-colors ml-1 font-normal">
                    (💡 클릭하여 산출 근거 보기)
                  </span>
                </div>
                <div class="flex items-center space-x-2 mt-1">
                  <h4 class="text-xl sm:text-2xl font-black text-white m-0 tracking-tight group-hover:scale-102 transition-transform origin-left">
                    <strong class="text-indigo-400 font-black">{{ portfolioAnalysis.safetyScore }}점</strong>
                    <span class="text-xs text-slate-400 font-normal"> / 100점 만점</span>
                  </h4>
                  <span :class="['text-xs font-bold px-2.5 py-0.5 rounded-full border transition-shadow group-hover:shadow-xs', portfolioAnalysis.balanceColor]">
                    {{ portfolioAnalysis.gradeRank }}등급 | {{ portfolioAnalysis.balanceType }}
                  </span>
                </div>
              </div>

              <!-- 우측 액션: 조합 현황 배지 & 아코디언 열기/닫기 토글 버튼 -->
              <div class="flex items-center space-x-2 shrink-0">
                <div class="hidden sm:flex items-center space-x-1.5 text-xs">
                  <span v-if="portfolioAnalysis.countBackup > 0" class="px-2 py-1 rounded-lg bg-slate-500/20 text-slate-300 border border-slate-400/30 font-bold">
                    하향 {{ portfolioAnalysis.countBackup }}
                  </span>
                  <span class="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
                    안정 {{ portfolioAnalysis.countSafe }}
                  </span>
                  <span class="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30 font-bold">
                    적정 {{ portfolioAnalysis.countTarget }}
                  </span>
                  <span class="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-400/30 font-bold">
                    상향 {{ portfolioAnalysis.countReach }}
                  </span>
                  <span v-if="portfolioAnalysis.countDanger > 0" class="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-400/30 font-bold">
                    과상향 {{ portfolioAnalysis.countDanger }}
                  </span>
                </div>

                <!-- 아코디언 토글 버튼 -->
                <button
                  type="button"
                  @click="toggleScoreAccordion('ALL')"
                  :class="[
                    'px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center space-x-1.5 border',
                    isScoreAccordionOpen 
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm' 
                      : 'bg-white/10 hover:bg-white/15 text-slate-200 border-white/15 hover:border-indigo-400/50'
                  ]"
                >
                  <span>{{ isScoreAccordionOpen ? '▲ 산출 근거 접기' : '🔍 산출 근거 상세 보기 ▼' }}</span>
                </button>
              </div>
            </div>

            <!-- 7대 세부 입체 지표 브레이크다운 칩스 (각 칩 클릭 시 해당 지표 아코디언 상세 뷰 즉시 오픈) -->
            <div v-if="portfolioAnalysis.scoreBreakdown" class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2 border-t border-slate-800">
              <div 
                @click="openMetricDetail('gpaMargin')"
                class="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-400/70 rounded-xl p-2 text-center cursor-pointer transition-all group"
                title="클릭하여 내신 실질 마진 지표의 세부 배점과 6장 카드별 내신 격차를 확인합니다"
              >
                <div class="text-[10px] text-slate-400 group-hover:text-slate-200">내신 실질 마진</div>
                <div class="text-xs font-bold text-indigo-300 mt-0.5">
                  {{ portfolioAnalysis.scoreBreakdown.gpaMargin.score }}<span class="text-[9px] text-slate-500 font-normal">/25</span>
                </div>
                <div class="text-[9px] text-slate-400 mt-0.5 truncate">{{ portfolioAnalysis.scoreBreakdown.gpaMargin.statusText }}</div>
              </div>

              <div 
                @click="openMetricDetail('csatSatam')"
                class="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-sky-400/70 rounded-xl p-2 text-center cursor-pointer transition-all group"
                title="클릭하여 수능최저 충족 버퍼 및 사탐런 자격 검증 상세를 확인합니다"
              >
                <div class="text-[10px] text-slate-400 group-hover:text-slate-200">수능최저·사탐런</div>
                <div class="text-xs font-bold text-sky-300 mt-0.5">
                  {{ portfolioAnalysis.scoreBreakdown.csatSatam.score }}<span class="text-[9px] text-slate-500 font-normal">/20</span>
                </div>
                <div class="text-[9px] text-slate-400 mt-0.5 truncate">{{ portfolioAnalysis.scoreBreakdown.csatSatam.statusText }}</div>
              </div>

              <div 
                @click="openMetricDetail('schoolRec')"
                class="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/70 rounded-xl p-2 text-center cursor-pointer transition-all group"
                title="클릭하여 학교장추천 쿼터 배분 및 허수 배제 효과 상세를 확인합니다"
              >
                <div class="text-[10px] text-slate-400 group-hover:text-slate-200">학교장추천</div>
                <div class="text-xs font-bold text-purple-300 mt-0.5">
                  {{ portfolioAnalysis.scoreBreakdown.schoolRec.score }}<span class="text-[9px] text-slate-500 font-normal">/15</span>
                </div>
                <div class="text-[9px] text-slate-400 mt-0.5 truncate">{{ portfolioAnalysis.scoreBreakdown.schoolRec.statusText }}</div>
              </div>

              <div 
                @click="openMetricDetail('ruralQuota')"
                class="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-400/70 rounded-xl p-2 text-center cursor-pointer transition-all group"
                title="클릭하여 농어촌 쿼터 유불리 및 역전 방지 상세를 확인합니다"
              >
                <div class="text-[10px] text-slate-400 group-hover:text-slate-200">농어촌 쿼터</div>
                <div class="text-xs font-bold text-emerald-300 mt-0.5">
                  {{ portfolioAnalysis.scoreBreakdown.ruralQuota.score }}<span class="text-[9px] text-slate-500 font-normal">/10</span>
                </div>
                <div class="text-[9px] text-slate-400 mt-0.5 truncate">{{ portfolioAnalysis.scoreBreakdown.ruralQuota.statusText }}</div>
              </div>

              <div 
                @click="openMetricDetail('compTrend')"
                class="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/70 rounded-xl p-2 text-center cursor-pointer transition-all group"
                title="클릭하여 3개년 경쟁률 추이 및 과열/소외 학과 상세를 확인합니다"
              >
                <div class="text-[10px] text-slate-400 group-hover:text-slate-200">3개년 경쟁률</div>
                <div class="text-xs font-bold text-amber-300 mt-0.5">
                  {{ portfolioAnalysis.scoreBreakdown.compTrend.score }}<span class="text-[9px] text-slate-500 font-normal">/10</span>
                </div>
                <div class="text-[9px] text-slate-400 mt-0.5 truncate">{{ portfolioAnalysis.scoreBreakdown.compTrend.statusText }}</div>
              </div>

              <div 
                @click="openMetricDetail('typeDiversify')"
                class="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-400/70 rounded-xl p-2 text-center cursor-pointer transition-all group"
                title="클릭하여 전형 유형 위험 분산도(교과 vs 종합 vs 논술) 상세를 확인합니다"
              >
                <div class="text-[10px] text-slate-400 group-hover:text-slate-200">전형 위험 분산</div>
                <div class="text-xs font-bold text-blue-300 mt-0.5">
                  {{ portfolioAnalysis.scoreBreakdown.typeDiversify.score }}<span class="text-[9px] text-slate-500 font-normal">/10</span>
                </div>
                <div class="text-[9px] text-slate-400 mt-0.5 truncate">{{ portfolioAnalysis.scoreBreakdown.typeDiversify.statusText }}</div>
              </div>

              <div 
                @click="openMetricDetail('jungsiConflict')"
                class="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-rose-400/70 rounded-xl p-2 text-center cursor-pointer transition-all group"
                title="클릭하여 수시 납치 및 고사일정 충돌 방지 상세를 확인합니다"
              >
                <div class="text-[10px] text-slate-400 group-hover:text-slate-200">정시선·일정</div>
                <div class="text-xs font-bold text-rose-300 mt-0.5">
                  {{ portfolioAnalysis.scoreBreakdown.jungsiConflict.score }}<span class="text-[9px] text-slate-500 font-normal">/10</span>
                </div>
                <div class="text-[9px] text-slate-400 mt-0.5 truncate">{{ portfolioAnalysis.scoreBreakdown.jungsiConflict.statusText }}</div>
              </div>
            </div>

            <!-- 맞춤 상담 처방전 박스 -->
            <div v-if="portfolioAnalysis.prescription" class="bg-indigo-950/60 border border-indigo-500/30 rounded-xl p-3 text-xs text-indigo-200 flex items-start space-x-2">
              <span class="text-base shrink-0">💡</span>
              <div class="leading-relaxed">
                <strong class="text-white font-bold">1:1 진학 상담 개선 처방:</strong> {{ portfolioAnalysis.prescription }}
              </div>
            </div>

            <!-- 위험 경고 알림 바 -->
            <div v-if="portfolioAnalysis.warnings.length > 0" class="bg-rose-950/80 border border-rose-500/40 rounded-xl p-3 text-xs text-rose-200 space-y-1">
              <div class="font-bold flex items-center space-x-1.5 text-rose-300">
                <span>🚨</span>
                <span>상담실 안전벨트 알림 (올킬 및 납치 위험 감지):</span>
              </div>
              <ul class="m-0 pl-4 space-y-1 text-[11px]">
                <li v-for="(w, idx) in portfolioAnalysis.warnings" :key="idx">{{ w }}</li>
              </ul>
            </div>
          </div>

          <!-- [신규] 7대 입체 평가 지표 정밀 산출 근거 아코디언 패널 (호버/클릭 시 애니메이션 확장) -->
          <transition
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 -translate-y-2 scale-99"
            enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100 translate-y-0 scale-100"
            leave-to-class="opacity-0 -translate-y-2 scale-99"
          >
            <StudentSafetyScoreAccordion
              v-if="isScoreAccordionOpen && portfolioAnalysis.scoreBreakdown"
              :scoreBreakdown="portfolioAnalysis.scoreBreakdown"
              :safetyScore="portfolioAnalysis.safetyScore"
              :gradeRank="portfolioAnalysis.gradeRank"
              :balanceType="portfolioAnalysis.balanceType"
              :balanceColor="portfolioAnalysis.balanceColor"
              :prescription="portfolioAnalysis.prescription"
              :initialMetricKey="selectedScoreMetric"
              @close="isScoreAccordionOpen = false"
            />
          </transition>

          <!-- 6 Application Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              v-for="(card, index) in portfolioAnalysis.cards" 
              :key="card.id"
              class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-colors flex flex-col justify-between relative"
            >
              <!-- Card Index Ribbon -->
              <div class="absolute top-0 right-0 w-8 h-8 flex items-center justify-center bg-indigo-50 text-indigo-700 font-bold text-xs rounded-tr-2xl rounded-bl-xl border-l border-b border-indigo-100">
                #{{ index + 1 }}
              </div>

              <div>
                <!-- Top Tags: Region + Admission Type + Diagnosis Verdict Badge -->
                <div class="flex flex-wrap items-center gap-1.5 pr-8">
                  <span class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {{ card.region }}
                  </span>
                  <span :class="[
                    'text-[11px] font-medium px-2 py-0.5 rounded-full',
                    card.admissionType.includes('교과') ? 'bg-indigo-50 text-indigo-700' :
                    card.admissionType.includes('종합') ? 'bg-sky-50 text-sky-700' :
                    card.admissionType.includes('실기') ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  ]">
                    {{ card.admissionType }}
                  </span>

                  <!-- 4단계 진단 배지 (상향/적정/안정/과상향) -->
                  <span :class="['text-[11px] font-bold px-2.5 py-0.5 rounded-full border', card.diagnosis.verdictClass]">
                    {{ card.diagnosis.badgeIcon }} {{ card.diagnosis.verdict }} ({{ card.diagnosis.passProbability }}%)
                  </span>

                  <!-- 임시 스왑 배지 -->
                  <span v-if="card.isSwapped" class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-300">
                    스왑 적용 중
                  </span>
                </div>

                <!-- 수시 납치 경고 박스 -->
                <div v-if="card.capture && card.capture.isCaptureRisk" class="mt-2.5 bg-rose-50 border border-rose-200 rounded-xl p-2 text-[11px] text-rose-800 font-semibold flex items-start space-x-1.5">
                  <span class="shrink-0">⚠️</span>
                  <span><strong>수시 납치 위험:</strong> {{ card.capture.reason }}</span>
                </div>

                <!-- Univ & Dept Header -->
                <div class="mt-2.5">
                  <h5 class="text-base font-bold text-slate-900 leading-snug m-0">{{ card.univName }}</h5>
                  <div class="text-xs font-semibold text-indigo-600 mt-0.5">
                    {{ card.dept }}
                    <span v-if="card.quota" class="text-slate-400 font-normal">({{ card.quota }}명 모집)</span>
                  </div>
                </div>

                <!-- Admission Detail Name -->
                <div class="mt-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div class="font-medium text-slate-800">{{ card.admissionDetailType || card.admissionMajorType }}</div>
                  <div class="text-[11px] text-slate-400 mt-0.5">{{ card.selectionMethod || '전형 방식 미지정' }}</div>
                </div>

                <!-- Minimum Criteria & Monthly Mock Exam Tracker -->
                <div class="mt-3">
                  <CsatMinScoreTracker
                    :minScoreReq="card.minScoreReq"
                    :studentField="card.field || '공통'"
                    :mockExams="[effectiveMockExam].filter(Boolean)"
                    :canLoadMock="true"
                    @request-mock-load="handleManualMockLoad"
                  />
                </div>

                <!-- 수능최저 충족률 & 실질경쟁률 급락 완화 박스 -->
                <div v-if="card.diagnosis.passRateInfo" class="mt-2.5 bg-indigo-50/70 border border-indigo-100 rounded-xl p-2.5 text-xs text-indigo-950">
                  <div class="flex items-center justify-between font-bold">
                    <span>수능최저 충족률 {{ card.diagnosis.passRateInfo.passRate }}%</span>
                    <span class="text-indigo-600 font-black">실질 {{ card.diagnosis.passRateInfo.realRate }}:1</span>
                  </div>
                  <div class="text-[11px] text-indigo-800 mt-0.5">
                    원서경쟁률 대비 <strong>{{ card.diagnosis.passRateInfo.easeFactor }}배</strong> 급락! 최저 충족 시 실질 경쟁자 1/3로 축소
                  </div>
                </div>

                <!-- Recent 3 Years Competition Rate Micro Chart -->
                <div class="mt-2.5">
                  <CompetitionRateMicroChart :rates="card.competitionRates" :year="selectedAcademicYear" />
                </div>

                <!-- 3자 합의 조율 태그 선택 버튼 (담임추천 / 학생희망 / 학부모요청) -->
                <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span class="text-[11px] text-slate-400 font-medium">상담 합의 주체:</span>
                  <div class="flex items-center space-x-1">
                    <button
                      type="button"
                      @click="setCardAgreement(card.id, '담임추천')"
                      :class="[
                        'px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer border-none',
                        (cardAgreements[card.id] || '담임추천') === '담임추천' 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      ]"
                    >
                      교사추천
                    </button>
                    <button
                      type="button"
                      @click="setCardAgreement(card.id, '학생희망')"
                      :class="[
                        'px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer border-none',
                        cardAgreements[card.id] === '학생희망' 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      ]"
                    >
                      학생희망
                    </button>
                    <button
                      type="button"
                      @click="setCardAgreement(card.id, '학부모요청')"
                      :class="[
                        'px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer border-none',
                        cardAgreements[card.id] === '학부모요청' 
                          ? 'bg-amber-600 text-white' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      ]"
                    >
                      학부모요청
                    </button>
                  </div>
                </div>

              </div>

              <!-- Footer: Converted Scores & Key Exam Dates & Swap Restore -->
              <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <div>
                  대학환산: <strong class="text-slate-800">{{ card.univConvertedScore ? Number(card.univConvertedScore).toFixed(1) : '-' }}점</strong>
                </div>

                <div class="flex items-center space-x-2">
                  <div v-if="card.interviewDate" class="text-purple-600 font-semibold">
                    면접: {{ card.interviewDate.slice(5) }}
                  </div>
                  <div v-else-if="card.finalAnnounceDate" class="text-slate-400">
                    발표: {{ card.finalAnnounceDate.slice(5, 10) }}
                  </div>

                  <!-- 스왑된 카드 복원 버튼 -->
                  <button
                    v-if="card.isSwapped"
                    type="button"
                    @click="restoreOriginalCard(card.id)"
                    class="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer bg-transparent border-none p-0"
                  >
                    원복
                  </button>
                </div>
              </div>

            </div>
          </div>

          <!-- 1:1 진학 지도 상담 기록 및 이력 관리 (DB 영구 보존 & 교사별 상담록 연동) -->
          <div class="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
            <!-- 헤더 바 -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h5 class="text-xs font-bold text-slate-900 uppercase tracking-wide m-0 flex items-center space-x-2">
                  <span>📝</span>
                  <span>1:1 진학지도 상담 기록 및 DB 저장</span>
                  <span class="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                    DB 영구 보존
                  </span>
                </h5>
                <p class="text-[11px] text-slate-500 m-0 mt-0.5">
                  상담 일자·교사·상담내용을 기록하여 학생별 이력을 누적 관리하고, 교사별 상담록을 인쇄합니다.
                </p>
              </div>

              <button
                type="button"
                @click="isTeacherReportModalOpen = true"
                class="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer border-none shrink-0 self-start sm:self-auto"
              >
                <span>📑</span>
                <span>교사별 상담록 인쇄 (A4)</span>
              </button>
            </div>

            <!-- 상담 기록 작성 폼 -->
            <div class="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80 space-y-3">
              <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <!-- 상담 일자 -->
                <div class="sm:col-span-4 flex items-center space-x-2">
                  <span class="text-xs font-bold text-slate-700 shrink-0">상담 일자:</span>
                  <input
                    type="date"
                    v-model="counselDate"
                    class="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <!-- 상담 교사 -->
                <div class="sm:col-span-5 flex items-center space-x-2">
                  <span class="text-xs font-bold text-slate-700 shrink-0">상담 교사:</span>
                  <input
                    type="text"
                    v-model="counselTeacher"
                    placeholder="상담교사 성명"
                    class="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <!-- 상태 표시 -->
                <div class="sm:col-span-3 text-right">
                  <span v-if="editingLogId" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    기존 기록 수정 중
                  </span>
                  <span v-else class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    신규 상담 작성
                  </span>
                </div>
              </div>

              <!-- 상담 내용 입력창 -->
              <div>
                <textarea
                  v-model="counselContent"
                  rows="3"
                  placeholder="예: 학생은 상향 2장(고려대/성균관대)을 강력 희망하나, 수능 최저 미달 시 올킬 위험이 있으므로 최소 2장을 수도권 안정권(단국대/한경대)으로 조율 합의함."
                  class="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 leading-relaxed placeholder-slate-400"
                ></textarea>
              </div>

              <!-- 버튼 및 피드백 -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <div>
                  <span v-if="saveMessage" class="text-xs text-emerald-600 font-bold flex items-center space-x-1">
                    <span>✅</span>
                    <span>{{ saveMessage }}</span>
                  </span>
                </div>

                <div class="flex items-center space-x-2 self-end sm:self-auto">
                  <button
                    v-if="editingLogId"
                    type="button"
                    @click="startNewCounsel"
                    class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer border border-slate-300 flex items-center space-x-1"
                    title="기존 기록 수정을 닫고 새로운 상담 기록을 작성합니다"
                  >
                    <span>➕</span>
                    <span>새 상담 작성</span>
                  </button>

                  <button
                    v-if="editingLogId"
                    type="button"
                    @click="handleDeleteCounsel(editingLogId)"
                    class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg transition-colors cursor-pointer border border-rose-300 flex items-center space-x-1"
                    title="현재 불러온 상담 기록을 완전히 삭제합니다"
                  >
                    <span>🗑️</span>
                    <span>기록 삭제</span>
                  </button>

                  <button
                    type="button"
                    @click="handleSaveCounsel"
                    :disabled="isSaving"
                    class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer border-none disabled:opacity-50"
                  >
                    <span>💾</span>
                    <span>{{ editingLogId ? '상담 기록 수정 저장' : '상담 기록 DB 저장' }}</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- 해당 학생의 과거 상담 이력 목록 (누적 기록) -->
            <div v-if="studentCounselLogs.length > 0" class="space-y-2 pt-2 border-t border-slate-100">
              <div class="flex items-center justify-between text-xs font-bold text-slate-700">
                <span class="flex items-center space-x-1.5">
                  <span>📋</span>
                  <span>{{ currentStudent.name }} 학생의 1:1 상담 이력</span>
                  <span class="text-indigo-600 font-black">({{ studentCounselLogs.length }}건)</span>
                </span>
                <span class="text-[11px] text-slate-400 font-normal">최신순 정렬</span>
              </div>

              <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
                <div
                  v-for="log in studentCounselLogs"
                  :key="log.id"
                  class="p-3 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50/70 transition-colors text-xs space-y-1.5"
                  :class="{ 'ring-2 ring-indigo-500/30 bg-indigo-50/30': editingLogId === log.id }"
                >
                  <div class="flex items-center justify-between text-[11px]">
                    <div class="flex items-center space-x-2">
                      <span class="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold">
                        📅 {{ log.counsel_date }}
                      </span>
                      <span class="font-bold text-slate-700">
                        상담자: {{ log.teacher_name }} 선생님
                      </span>
                      <span v-if="log.academic_year" class="text-slate-400">
                        ({{ log.academic_year }}학년도)
                      </span>
                    </div>

                    <div class="flex items-center space-x-1.5">
                      <button
                        type="button"
                        @click="handleEditCounsel(log)"
                        class="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-md cursor-pointer transition-colors flex items-center space-x-1 shadow-2xs"
                        title="이 상담 내용을 위 입력창으로 불러와 수정합니다"
                      >
                        <span>✏️</span>
                        <span>수정</span>
                      </button>
                      <button
                        type="button"
                        @click="handleDeleteCounsel(log.id)"
                        class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-md cursor-pointer transition-colors flex items-center space-x-1 shadow-2xs"
                        title="이 상담 기록을 삭제합니다"
                      >
                        <span>🗑️</span>
                        <span>삭제</span>
                      </button>
                    </div>
                  </div>

                  <div class="text-slate-800 leading-relaxed whitespace-pre-wrap text-[11.5px] bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                    {{ log.content }}
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        <!-- 4-B. [서브 탭 2]: 학생 맞춤형 4단계 합격 라인 제안 (상향·적정·안정·하향) -->
        <div v-show="activeSubTab === 'RECOMMEND'">
          <StudentCounselRecommendations
            :student="currentStudent"
            :recommendations="recommendations"
            @swap-card="handleCardSwap"
          />
        </div>

        <!-- 4-C. [서브 탭 3]: 도플갱어 선배 합불 복기 -->
        <div v-show="activeSubTab === 'SENIORS'">
          <StudentDoppelgangerSeniors
            :student="currentStudent"
            :seniors="doppelgangerSeniors"
          />
        </div>

      </div>
    </div>

    <!-- 5. 학부모 상담용 A4 1장 리포트 인쇄 모달 -->
    <CounselPrintReportModal
      v-if="currentStudent"
      :isOpen="isPrintModalOpen"
      :student="currentStudent"
      :latestMock="effectiveMockExam || {}"
      :portfolioAnalysis="portfolioAnalysis"
      :jungsiBaseline="jungsiBaseline"
      :recommendations="recommendations"
      :cardAgreements="cardAgreements"
      :counselMemo="counselMemo"
      :currentYear="selectedAcademicYear"
      @close="isPrintModalOpen = false"
    />

    <!-- 6. 교사별 1:1 진학지도 상담록 인쇄 모달 -->
    <TeacherCounselReportModal
      :isOpen="isTeacherReportModalOpen"
      :initialYear="selectedAcademicYear"
      :currentTeacherName="counselTeacher"
      @close="isTeacherReportModalOpen = false"
      @updated="reloadCurrentStudentLogs"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useData, maskName, formatGrade, formatStudentCode, loadCsatPassRateData, csatPassRateTable } from '../../composables/useStatData'
import CompetitionRateMicroChart from '../CompetitionRateMicroChart.vue'
import CsatMinScoreTracker from '../CsatMinScoreTracker.vue'

// 신규 상담 특화 모듈 및 컴포넌트 임포트
import { 
  getJungsiBaseline, 
  getAdjustedMockExam, 
  analyzePortfolio, 
  findDoppelgangerSeniors, 
  getRecommendedLines 
} from '../../utils/counselEngine.js'
import CounselPrintReportModal from '../counsel/CounselPrintReportModal.vue'
import TeacherCounselReportModal from '../counsel/TeacherCounselReportModal.vue'
import StudentCounselRecommendations from '../counsel/StudentCounselRecommendations.vue'
import StudentDoppelgangerSeniors from '../counsel/StudentDoppelgangerSeniors.vue'
import StudentSafetyScoreAccordion from '../counsel/StudentSafetyScoreAccordion.vue'
import {
  fetchCounselLogsByStudent,
  saveCounselRecord,
  deleteCounselRecord
} from '../../../api/counselApi.js'

const { 
  applications, 
  studentMockExamsMap, 
  loadMockExamData, 
  isLoadingMockExams,
  selectedAcademicYear
} = useData()

// 마운트 시 모의고사 및 수능최저충족률 데이터 로드
onMounted(() => {
  loadMockExamData()
  loadCsatPassRateData()
})

const handleManualMockLoad = () => {
  loadMockExamData(true)
}

const studentClassFilter = ref('ALL')
const searchQuery = ref('')
const activeStudentKey = ref('')

// 신규 상태: 서브 탭, 수능 예측 시뮬레이터 옵셋, 인쇄 모달, 합의 주체, 카드 스왑, 상담 메모
const activeSubTab = ref('DIAGNOSIS') // 'DIAGNOSIS' | 'RECOMMEND' | 'SENIORS'
const simulationOffset = ref(0) // -1: 보수적, 0: 현상유지, 1: 낙관적
const isPrintModalOpen = ref(false)
const isTeacherReportModalOpen = ref(false)
const cardAgreements = ref({}) // { [cardId]: '담임추천' | '학생희망' | '학부모요청' }
const swappedCards = ref({}) // { [cardId]: swappedAppObj }
const counselMemo = ref('')

// 1:1 진학 상담 DB 및 이력 상태
const counselDate = ref(new Date().toISOString().slice(0, 10))
const counselTeacher = ref(localStorage.getItem('pcm_teacher_name') || '담임교사')
const counselContent = ref('')
const editingLogId = ref(null)
const studentCounselLogs = ref([])
const saveMessage = ref('')
const isSaving = ref(false)

// 안전도 점수 아코디언 상세 보기 상태
const isScoreAccordionOpen = ref(false)
const selectedScoreMetric = ref('ALL')

function toggleScoreAccordion(metricKey = 'ALL') {
  if (isScoreAccordionOpen.value && selectedScoreMetric.value === metricKey) {
    isScoreAccordionOpen.value = false
  } else {
    selectedScoreMetric.value = metricKey
    isScoreAccordionOpen.value = true
  }
}

function openMetricDetail(metricKey) {
  selectedScoreMetric.value = metricKey
  isScoreAccordionOpen.value = true
}

// 학생 변경 시 1:1 상담 DB 이력 불러오기 및 스왑 초기화
watch(activeStudentKey, async (newKey) => {
  swappedCards.value = {}
  editingLogId.value = null
  saveMessage.value = ''
  counselDate.value = new Date().toISOString().slice(0, 10)

  if (!counselTeacher.value || counselTeacher.value === '담임교사') {
    counselTeacher.value = localStorage.getItem('pcm_teacher_name') || '담임교사'
  }

  if (newKey) {
    try {
      const logs = await fetchCounselLogsByStudent(newKey, selectedAcademicYear.value)
      studentCounselLogs.value = logs || []
      if (logs && logs.length > 0) {
        const latest = logs[0]
        editingLogId.value = latest.id
        counselDate.value = latest.counsel_date || new Date().toISOString().slice(0, 10)
        counselTeacher.value = latest.teacher_name || counselTeacher.value
        counselContent.value = latest.content || ''
        counselMemo.value = latest.content || ''
      } else {
        editingLogId.value = null
        const saved = localStorage.getItem(`counsel_memo_${newKey}`)
        counselContent.value = saved || ''
        counselMemo.value = saved || ''
      }
    } catch (err) {
      console.warn('Error loading student counsel logs:', err)
      const saved = localStorage.getItem(`counsel_memo_${newKey}`)
      counselContent.value = saved || ''
      counselMemo.value = saved || ''
    }
  } else {
    editingLogId.value = null
    counselContent.value = ''
    counselMemo.value = ''
    studentCounselLogs.value = []
  }
}, { immediate: true })

function startNewCounsel() {
  editingLogId.value = null
  counselDate.value = new Date().toISOString().slice(0, 10)
  counselContent.value = ''
  counselMemo.value = ''
  saveMessage.value = ''
}

// 상담 내용과 레거시 counselMemo 실시간 동기화
watch(counselContent, (newVal) => {
  counselMemo.value = newVal
  if (activeStudentKey.value) {
    localStorage.setItem(`counsel_memo_${activeStudentKey.value}`, newVal)
  }
})

function saveCounselMemo() {
  if (activeStudentKey.value) {
    localStorage.setItem(`counsel_memo_${activeStudentKey.value}`, counselMemo.value)
  }
}

async function reloadCurrentStudentLogs() {
  if (!activeStudentKey.value) return
  const logs = await fetchCounselLogsByStudent(activeStudentKey.value, selectedAcademicYear.value)
  studentCounselLogs.value = logs || []
}

async function handleSaveCounsel() {
  if (!currentStudent.value) return
  if (!counselContent.value.trim()) {
    alert('상담 내용을 입력해주세요.')
    return
  }

  isSaving.value = true
  saveMessage.value = ''
  try {
    const payload = {
      id: editingLogId.value || undefined,
      academic_year: selectedAcademicYear.value || '2027',
      counsel_date: counselDate.value || new Date().toISOString().slice(0, 10),
      teacher_name: (counselTeacher.value || '담임교사').trim(),
      student_key: currentStudent.value.key,
      student_code: formatStudentCode(currentStudent.value),
      student_name: currentStudent.value.name,
      grade: currentStudent.value.grade || 3,
      class_num: String(currentStudent.value.classNum),
      student_num: String(currentStudent.value.studentNum),
      content: counselContent.value.trim()
    }

    await saveCounselRecord(payload)

    if (payload.teacher_name) {
      localStorage.setItem('pcm_teacher_name', payload.teacher_name)
    }

    saveMessage.value = editingLogId.value ? '상담 기록이 수정되었습니다.' : '상담 기록이 DB에 안전하게 저장되었습니다.'
    setTimeout(() => {
      saveMessage.value = ''
    }, 3500)

    editingLogId.value = null
    await reloadCurrentStudentLogs()
  } catch (err) {
    console.error('Save counsel error:', err)
    alert('상담 기록 저장 중 오류가 발생했습니다: ' + err.message)
  } finally {
    isSaving.value = false
  }
}

function handleEditCounsel(log) {
  if (!log) return
  editingLogId.value = log.id
  counselDate.value = log.counsel_date || new Date().toISOString().slice(0, 10)
  counselTeacher.value = log.teacher_name || counselTeacher.value
  counselContent.value = log.content || ''
}

function cancelEditCounsel() {
  editingLogId.value = null
  counselDate.value = new Date().toISOString().slice(0, 10)
  if (studentCounselLogs.value.length > 0) {
    counselContent.value = studentCounselLogs.value[0].content || ''
  }
}

async function handleDeleteCounsel(logId) {
  if (!confirm('해당 상담 기록을 삭제하시겠습니까?')) return
  try {
    await deleteCounselRecord(logId, activeStudentKey.value)
    if (editingLogId.value === logId) {
      editingLogId.value = null
    }
    await reloadCurrentStudentLogs()
    if (studentCounselLogs.value.length > 0) {
      const latest = studentCounselLogs.value[0]
      editingLogId.value = latest.id
      counselDate.value = latest.counsel_date || new Date().toISOString().slice(0, 10)
      counselTeacher.value = latest.teacher_name || counselTeacher.value
      counselContent.value = latest.content || ''
      counselMemo.value = latest.content || ''
    } else {
      editingLogId.value = null
      counselContent.value = ''
      counselMemo.value = ''
    }
    saveMessage.value = '상담 기록이 삭제되었습니다.'
    setTimeout(() => {
      saveMessage.value = ''
    }, 3000)
  } catch (err) {
    console.error('Delete counsel error:', err)
    alert('삭제 중 오류가 발생했습니다.')
  }
}

function setCardAgreement(cardId, agreement) {
  cardAgreements.value = {
    ...cardAgreements.value,
    [cardId]: agreement
  }
}

// Aggregate all applications by student
const studentsMap = computed(() => {
  const map = new Map()

  applications.value.forEach(app => {
    const isGraduate = app.isGraduate || app.classNum === '졸업생'
    const key = app.studentKey
    if (!map.has(key)) {
      map.set(key, {
        key,
        name: app.name,
        classNum: app.classNum,
        studentNum: app.studentNum,
        grade: app.grade,
        isGraduate,
        korGrade: app.korGrade,
        engGrade: app.engGrade,
        mathGrade: app.mathGrade,
        socGrade: app.socGrade,
        sciGrade: app.sciGrade,
        allSubjectGrade: app.allSubjectGrade,
        mainSubjectGrade: app.mainSubjectGrade,
        koreanMathEnglish: app.koreanMathEnglish,
        hasRec: false,
        hasRural: false,
        apps: []
      })
    }
    const st = map.get(key)
    st.apps.push(app)
    if (app.isRecommendation) st.hasRec = true
    if (app.isRural) st.hasRural = true
  })

  return map
})

// 전체 학생 및 재학생/졸업생 수 동적 집계
const allStudentsList = computed(() => Array.from(studentsMap.value.values()))
const totalStudentsCount = computed(() => allStudentsList.value.length)
const enrolledStudentsCount = computed(() => allStudentsList.value.filter(s => !s.isGraduate && s.classNum !== '졸업생').length)
const graduateStudentsCount = computed(() => allStudentsList.value.filter(s => s.isGraduate || s.classNum === '졸업생').length)

const currentTargetTotalCount = computed(() => {
  if (studentClassFilter.value === 'ENROLLED') {
    return enrolledStudentsCount.value
  }
  if (studentClassFilter.value === '졸업생' || studentClassFilter.value === 'GRADUATE') {
    return graduateStudentsCount.value
  }
  if (studentClassFilter.value !== 'ALL') {
    return allStudentsList.value.filter(s => String(s.classNum) === String(studentClassFilter.value)).length
  }
  return totalStudentsCount.value
})

// Filtered student list
const studentList = computed(() => {
  let list = Array.from(studentsMap.value.values())

  // Class filter
  if (studentClassFilter.value === 'ENROLLED') {
    list = list.filter(s => !s.isGraduate && s.classNum !== '졸업생')
  } else if (studentClassFilter.value === '졸업생' || studentClassFilter.value === 'GRADUATE') {
    list = list.filter(s => s.isGraduate || s.classNum === '졸업생')
  } else if (studentClassFilter.value !== 'ALL') {
    list = list.filter(s => String(s.classNum) === String(studentClassFilter.value))
  }

  // Search query
  if (searchQuery.value.trim()) {
    const kw = searchQuery.value.trim().toLowerCase()
    list = list.filter(s => {
      const matchName = s.name.toLowerCase().includes(kw)
      const matchNum = String(s.studentNum).includes(kw)
      const matchTag = s.isGraduate ? '졸업생'.includes(kw) : `${s.classNum}-${s.studentNum}`.includes(kw)
      return matchName || matchNum || matchTag
    })
  }

  // Sort by Class then Student Number
  list.sort((a, b) => {
    if (a.isGraduate && !b.isGraduate) return 1
    if (!a.isGraduate && b.isGraduate) return -1
    if (!a.isGraduate && !b.isGraduate) {
      if (a.classNum !== b.classNum) return a.classNum - b.classNum
      return a.studentNum - b.studentNum
    }
    return String(a.studentNum).localeCompare(String(b.studentNum))
  })

  return list
})

// Current selected student
const currentStudent = computed(() => {
  let st = null
  if (activeStudentKey.value && studentsMap.value.has(activeStudentKey.value)) {
    st = studentsMap.value.get(activeStudentKey.value)
  } else if (studentList.value.length > 0) {
    st = studentList.value[0]
  }
  if (!st) return null

  const metroAppsCount = st.apps.filter(a => a.isMetro).length
  const metroRate = st.apps.length > 0 ? ((metroAppsCount / st.apps.length) * 100).toFixed(0) : '0'
  return {
    ...st,
    metroAppsCount,
    metroRate
  }
})

// 현재 선택된 학생의 월별 모의고사 성적 이력 목록 (3월, 6월, 9월, 10월 등)
const currentStudentMockExams = computed(() => {
  if (!currentStudent.value) return []
  const target = currentStudent.value
  const primaryKey = target.key

  if (studentMockExamsMap.value.has(primaryKey)) {
    return studentMockExamsMap.value.get(primaryKey)
  }

  const normName = String(target.name || '').trim()
  const classStr = String(target.classNum || '').trim()
  const numStr = String(target.studentNum || '').trim()

  for (const [mapKey, records] of studentMockExamsMap.value.entries()) {
    if (mapKey.includes(normName)) {
      if (classStr && numStr && mapKey.includes(`${classStr}-${numStr}`)) {
        return records
      }
    }
  }

  if (normName) {
    const candidates = []
    for (const [mapKey, records] of studentMockExamsMap.value.entries()) {
      if (mapKey.includes(normName)) {
        candidates.push(records)
      }
    }
    if (candidates.length === 1) {
      return candidates[0]
    }
  }

  return []
})

// 최신 모의고사 1회차에 수능 시뮬레이터 옵셋(-1, 0, +1)을 적용한 유효 모의고사 성적
// 모의고사 성적이 미등록된 학생의 경우 학생 내신 기반 가상 모평을 자동 생성하여 시뮬레이션 보장
const effectiveMockExam = computed(() => {
  const records = currentStudentMockExams.value
  let baseExam = null
  if (records && records.length > 0) {
    const sorted = [...records].sort((a, b) => {
      const mA = parseInt(String(a.examName || a.title || '').replace(/[^0-9]/g, '')) || 0
      const mB = parseInt(String(b.examName || b.title || '').replace(/[^0-9]/g, '')) || 0
      return mB - mA
    })
    baseExam = sorted[0]
  }
  return getAdjustedMockExam(baseExam, simulationOffset.value, currentStudent.value)
})

// 수능 실전 시뮬레이션 상태 요약 (최저 충족 카드 수, 충족률, 시뮬레이션 영향)
const csatSimulationSummary = computed(() => {
  if (!portfolioAnalysis.value || !portfolioAnalysis.value.cards) {
    return { satisfiedCount: 0, totalCards: 0, ratePct: 0 }
  }
  const cards = portfolioAnalysis.value.cards
  const totalCards = cards.length
  const satisfiedCount = cards.filter(c => c.diagnosis && c.diagnosis.csatSatisfied).length
  const ratePct = totalCards > 0 ? Math.round((satisfiedCount / totalCards) * 100) : 0
  return { satisfiedCount, totalCards, ratePct }
})

// 정시 기대선 (정시 지원 가능 대학 라인)
const jungsiBaseline = computed(() => {
  return getJungsiBaseline(currentStudentMockExams.value)
})

// 추천 대학 풀 4단계
const recommendations = computed(() => {
  if (!currentStudent.value) return { reach: [], target: [], safety: [], backup: [] }
  return getRecommendedLines(
    currentStudent.value,
    effectiveMockExam.value,
    applications.value,
    csatPassRateTable.value,
    simulationOffset.value
  )
})

// 도플갱어 선배 복기 (내신 ±0.15)
const doppelgangerSeniors = computed(() => {
  if (!currentStudent.value) return []
  return findDoppelgangerSeniors(currentStudent.value, applications.value)
})

// 스왑 적용된 최종 6장 카드 배열
const effectiveStudentApps = computed(() => {
  if (!currentStudent.value) return []
  return currentStudent.value.apps.map(app => {
    if (swappedCards.value[app.id]) {
      return {
        ...swappedCards.value[app.id],
        isSwapped: true,
        originalApp: app
      }
    }
    return {
      ...app,
      isSwapped: false
    }
  })
})

const hasSwappedCards = computed(() => {
  return Object.keys(swappedCards.value).length > 0
})

// 6장 포트폴리오 밸런스 종합 분석 객체
const portfolioAnalysis = computed(() => {
  if (!currentStudent.value) {
    return {
      cards: [],
      countBackup: 0,
      countSafe: 0,
      countTarget: 0,
      countReach: 0,
      countDanger: 0,
      safetyScore: 0,
      balanceType: '',
      warnings: []
    }
  }

  const gpa = Number(currentStudent.value.allSubjectGrade || currentStudent.value.mainSubjectGrade || 3.0)
  return analyzePortfolio(
    effectiveStudentApps.value,
    gpa,
    effectiveMockExam.value,
    csatPassRateTable.value,
    simulationOffset.value,
    jungsiBaseline.value,
    selectedAcademicYear.value,
    currentStudent.value,
    applications.value
  )
})

// 카드 스왑(대체) 핸들러
function handleCardSwap(recommendedUniv) {
  if (!currentStudent.value || currentStudent.value.apps.length === 0) return

  // 과상향 또는 상향 카드 중 첫 번째를 찾아 교체, 없으면 마지막 카드를 교체
  const apps = effectiveStudentApps.value
  const targetCard = apps.find(a => a.diagnosis && (a.diagnosis.verdict === '과상향' || a.diagnosis.verdict === '상향')) || apps[apps.length - 1]

  if (targetCard) {
    const y = parseInt(String(selectedAcademicYear.value || '2027').replace(/[^0-9]/g, ''), 10) || 2027
    swappedCards.value = {
      ...swappedCards.value,
      [targetCard.id]: {
        id: targetCard.id,
        univName: recommendedUniv.univName,
        dept: recommendedUniv.dept,
        admissionType: recommendedUniv.admissionType,
        admissionDetailType: recommendedUniv.admissionType,
        region: '수도권',
        quota: 15,
        minScoreReq: recommendedUniv.minScoreText,
        hasMinScore: !recommendedUniv.minScoreText.includes('미적용'),
        score9Grade: recommendedUniv.targetGpa,
        univConvertedScore: 950,
        univConvertedGrade: recommendedUniv.targetGpa,
        competitionRates: {
          [String(y - 2)]: { rate: 8.5, quota: '15', applicants: '128', raw: '8.5:1' },
          [String(y - 1)]: { rate: 9.2, quota: '15', applicants: '138', raw: '9.2:1' },
          [String(y)]: { rate: 8.8, quota: '15', applicants: '132', raw: '8.8:1' }
        }
      }
    }
    // 스왑 후 1번 진단 탭으로 이동
    activeSubTab.value = 'DIAGNOSIS'
  }
}

function restoreOriginalCard(cardId) {
  const next = { ...swappedCards.value }
  delete next[cardId]
  swappedCards.value = next
}

function resetSwappedCards() {
  swappedCards.value = {}
}
</script>
