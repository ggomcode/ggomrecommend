<template>
  <div class="space-y-6">
    <!-- 1. 상단 안내 헤더 배너 -->
    <div class="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-indigo-900/40">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div class="space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-[11px] font-bold">
              학사 {{ academicYear }}학년도 학사일정
            </span>
            <span class="px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/30 text-[11px] font-bold">
              고등학교 {{ targetGrade }}학년 전용
            </span>
            <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-[11px] font-mono font-bold">
              🔒 {{ targetAdmissionYear }}학년도 대입 ({{ academicYear }}학년도 고{{ targetGrade }})
            </span>
          </div>

          <h1 class="text-xl sm:text-2xl font-black text-white m-0 tracking-tight flex items-center gap-2">
            <span>📈</span>
            <span v-if="targetGrade === 2">
              고2 모의고사 분석 & 고1➔고2 성장 비교분석 ({{ targetAdmissionYear }}학년도 대입)
            </span>
            <span v-else>
              고1 전국연합학력평가 성적 분석 ({{ targetAdmissionYear }}학년도 대입 대비)
            </span>
          </h1>

          <p class="text-xs text-slate-300 m-0 max-w-3xl leading-relaxed">
            <template v-if="targetGrade === 2">
              현재 <strong>{{ academicYear }}학년도 고2</strong> 학생들이 치른 모의고사 성적(<strong>{{ cohortSheetYears.g2Year }}모의결과</strong>)과 
              고1 시절 성적(<strong>{{ cohortSheetYears.g1Year }}모의결과</strong>)을 연계하여 
              <strong>고1 ➔ 고2 2개년 성적 변화 추이</strong>를 다각도로 비교분석하고 진학 지도를 지원합니다.
            </template>
            <template v-else>
              해당 학사일정(<strong>{{ academicYear }}학년도</strong>)에 응시한 <strong>고1 전국연합학력평가</strong> 성적표(<strong>{{ cohortSheetYears.g1Year }}모의결과</strong>)를 바탕으로 
              회차별(3·6·9·10·11월) 성적 추이를 정밀 분석하고, 직전 대입의 수능최저 충족 기준을 연계하여 진학 설계를 지원합니다.
            </template>
          </p>
        </div>

        <!-- 시트 연동 현황 미니 보드 -->
        <div class="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 shrink-0 space-y-2 text-right">
          <div class="flex items-center justify-between gap-3 text-xs">
            <span class="text-slate-300 font-bold">대입 학년도:</span>
            <span class="font-black text-amber-300 font-mono text-sm">
              {{ targetAdmissionYear }}학년도 대입
            </span>
          </div>

          <!-- 고2일 때: 2개 시트(고1, 고2) 연동 상태 -->
          <div v-if="targetGrade === 2" class="grid grid-cols-2 gap-2 text-center pt-1 border-t border-white/10">
            <!-- 고1 시트 -->
            <div class="bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/10">
              <div class="text-[10px] text-slate-300 font-bold">고1 성적</div>
              <div class="text-[11px] font-bold text-sky-300 truncate" :title="`시트: ${cohortTrackingData.sheetsInfo[0]?.tabName || '2026모의결과'}`">
                {{ cohortTrackingData.sheetsInfo[0]?.examTitle || '2025년 전국연합' }}
              </div>
              <div class="text-[9px]">
                <span v-if="cohortTrackingData.sheetsInfo[0]?.count > 0" class="text-emerald-400 font-bold">
                  {{ cohortTrackingData.sheetsInfo[0]?.count }}건 연동
                </span>
                <span v-else class="text-slate-400">0건 (등록 대기)</span>
              </div>
            </div>

            <!-- 고2 시트 -->
            <div class="bg-indigo-500/20 rounded-lg px-2.5 py-1.5 border border-indigo-400/30">
              <div class="text-[10px] text-indigo-200 font-bold">고2 성적(현재)</div>
              <div class="text-[11px] font-bold text-indigo-200 truncate" :title="`시트: ${cohortTrackingData.sheetsInfo[1]?.tabName || '2027모의결과'}`">
                {{ cohortTrackingData.sheetsInfo[1]?.examTitle || '2026년 전국연합' }}
              </div>
              <div class="text-[9px]">
                <span v-if="cohortTrackingData.sheetsInfo[1]?.count > 0" class="text-emerald-400 font-bold">
                  {{ cohortTrackingData.sheetsInfo[1]?.count }}건 연동
                </span>
                <span v-else class="text-slate-400">0건 (등록 대기)</span>
              </div>
            </div>
          </div>

          <!-- 고1일 때: 1개 시트(고1 현재) 연동 상태 -->
          <div v-else class="text-center pt-1 border-t border-white/10">
            <div class="bg-indigo-500/20 rounded-lg px-4 py-1.5 border border-indigo-400/30 inline-block">
              <div class="text-[10px] text-indigo-200 font-bold">고1 성적(현재)</div>
              <div class="text-xs font-bold text-sky-200" :title="`시트: ${cohortTrackingData.sheetsInfo[0]?.tabName || '2027모의결과'}`">
                {{ cohortTrackingData.sheetsInfo[0]?.examTitle || '2026년 전국연합' }}
              </div>
              <div class="text-[10px]">
                <span v-if="currentGradeRecords.length > 0" class="text-emerald-400 font-bold">
                  {{ currentGradeRecords.length }}건 연동
                </span>
                <span v-else class="text-slate-400">0건 (등록 대기)</span>
              </div>
            </div>
          </div>

          <div class="pt-1 flex items-center justify-between text-[10px] text-slate-300">
            <span v-if="isLoadingCohortTracking" class="text-amber-300 animate-pulse flex items-center gap-1">
              <RefreshCw class="w-3 h-3 animate-spin" />
              <span>시트 동기화 중...</span>
            </span>
            <span v-else class="text-slate-400">
              분석 인원: <strong class="text-white">{{ currentGradeRecords.length }}건</strong>
            </span>

            <button
              @click="reloadCohortData(true)"
              class="px-2 py-0.5 rounded bg-white/15 hover:bg-white/25 text-[10px] font-bold text-white transition-colors cursor-pointer border-none"
              title="구글 시트의 모의고사 데이터를 실시간 다시 불러옵니다."
            >
              🔄 새로고침
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. 서브 탭 스위처 (고2일 때만 표시: 당해 성적 분석 vs 고1➔고2 성장 분석) -->
    <div v-if="targetGrade === 2" class="bg-white rounded-2xl p-2 shadow-sm border border-slate-200 flex items-center justify-between gap-3">
      <div class="inline-flex rounded-xl bg-slate-100 p-1">
        <button
          @click="activeSubTab = 'current'"
          :class="[
            'px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border-none flex items-center gap-1.5',
            activeSubTab === 'current'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'bg-transparent text-slate-600 hover:text-slate-900'
          ]"
        >
          <span>📊</span>
          <span>고2 당해 학년 성적 분석</span>
          <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-indigo-50 text-indigo-700 font-bold">
            {{ currentGradeRecords.length }}건
          </span>
        </button>

        <button
          @click="activeSubTab = 'tracking'"
          :class="[
            'px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border-none flex items-center gap-1.5',
            activeSubTab === 'tracking'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'bg-transparent text-slate-600 hover:text-slate-900'
          ]"
        >
          <span>📈</span>
          <span>고1 ➔ 고2 성적 성장 & 비교분석</span>
          <span 
            v-if="cohortTrackingData.summary.trackedMultiYearCount > 0"
            class="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-800 font-extrabold"
          >
            추적 {{ cohortTrackingData.summary.trackedMultiYearCount }}명
          </span>
        </button>
      </div>

      <div class="hidden sm:flex items-center gap-2 text-xs text-slate-500 pr-2">
        <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
        <span>기준: <strong>{{ targetAdmissionYear }}학년도 대입</strong> ({{ academicYear }}학년도 고{{ targetGrade }} 전국연합)</span>
      </div>
    </div>

    <!-- ========================================================== -->
    <!-- 뷰 1: 당해 학년 성적 정밀 분석 화면 (고2 탭1 또는 고1 단독) -->
    <!-- ========================================================== -->
    <div v-if="activeSubTab === 'current' || targetGrade === 1" class="space-y-6">
      <!-- 필터 및 빠른 액션 바 -->
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <!-- 회차 선택 -->
          <label class="text-xs font-bold text-slate-700">모의고사 회차:</label>
          <div class="relative">
            <select
              v-model="selectedExamName"
              class="appearance-none pl-3 pr-8 py-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl text-xs font-black text-slate-800 focus:outline-none cursor-pointer transition-colors"
            >
              <option value="ALL">전체 회차 종합</option>
              <option v-for="ex in availableExamNames" :key="ex" :value="ex">
                {{ ex }}
              </option>
            </select>
            <ChevronDown class="w-3.5 h-3.5 text-slate-500 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <!-- 반 선택 -->
          <label class="text-xs font-bold text-slate-700 ml-2">학급:</label>
          <div class="relative">
            <select
              v-model="selectedClass"
              class="appearance-none pl-3 pr-8 py-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl text-xs font-black text-slate-800 focus:outline-none cursor-pointer transition-colors"
            >
              <option value="ALL">전체 학급</option>
              <option v-for="c in availableClasses" :key="c" :value="c">
                {{ c }}반
              </option>
            </select>
            <ChevronDown class="w-3.5 h-3.5 text-slate-500 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div class="text-xs text-slate-500">
          조회 결과: <strong>{{ filteredCurrentRecords.length }}건</strong> (학생 {{ uniqueStudentsCount }}명)
        </div>
      </div>

      <!-- 데이터가 없을 때 안내 -->
      <div v-if="filteredCurrentRecords.length === 0" class="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
        <div class="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl">
          📂
        </div>
        <h3 class="text-base font-bold text-slate-800 m-0">
          고{{ targetGrade }} 모의고사 데이터가 아직 구글 시트에 등록되지 않았습니다
        </h3>
        <p class="text-xs text-slate-500 m-0 max-w-lg mx-auto leading-relaxed">
          구글 스프레드시트의 <code class="px-1.5 py-0.5 bg-slate-100 rounded text-indigo-700 font-bold font-mono">{{ targetGrade === 2 ? cohortSheetYears.g2Year : cohortSheetYears.g1Year }}모의결과</code> 탭에 
          고{{ targetGrade }} 모의고사 성적이 적재되면 실시간으로 연동되어 분석됩니다.<br>
          [통합 관리 > 모의고사 성적 업로드] 메뉴를 통해 회차별 엑셀 파일(.xlsx)을 바로 적재하실 수 있습니다.
        </p>
      </div>

      <!-- 4개 영역별 평균 등급 카드 그리드 & 수능최저 시뮬레이션 -->
      <div v-else class="space-y-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- 국어 -->
          <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-2">
            <div class="flex items-center justify-between text-xs font-bold text-slate-500">
              <span class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                국어 영역
              </span>
              <span>응시 {{ summaryStats.korCount }}명</span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-black text-slate-900 font-mono">{{ summaryStats.korAvgGrade }}</span>
              <span class="text-xs font-bold text-slate-500">평균 등급</span>
            </div>
            <div class="text-[11px] text-slate-500 flex justify-between pt-2 border-t border-slate-100">
              <span>평균 표준점수</span>
              <span class="font-bold text-slate-800 font-mono">{{ summaryStats.korAvgScore }}점</span>
            </div>
          </div>

          <!-- 수학 -->
          <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-2">
            <div class="flex items-center justify-between text-xs font-bold text-slate-500">
              <span class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                수학 영역
              </span>
              <span>응시 {{ summaryStats.mathCount }}명</span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-black text-slate-900 font-mono">{{ summaryStats.mathAvgGrade }}</span>
              <span class="text-xs font-bold text-slate-500">평균 등급</span>
            </div>
            <div class="text-[11px] text-slate-500 flex justify-between pt-2 border-t border-slate-100">
              <span>평균 표준점수</span>
              <span class="font-bold text-slate-800 font-mono">{{ summaryStats.mathAvgScore }}점</span>
            </div>
          </div>

          <!-- 영어 -->
          <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-2">
            <div class="flex items-center justify-between text-xs font-bold text-slate-500">
              <span class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                영어 영역 (절대평가)
              </span>
              <span>응시 {{ summaryStats.engCount }}명</span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-black text-slate-900 font-mono">{{ summaryStats.engAvgGrade }}</span>
              <span class="text-xs font-bold text-slate-500">평균 등급</span>
            </div>
            <div class="text-[11px] text-slate-500 flex justify-between pt-2 border-t border-slate-100">
              <span>1~3등급 비율</span>
              <span class="font-bold text-emerald-700 font-mono">{{ summaryStats.engTopRate }}%</span>
            </div>
          </div>

          <!-- 한국사 -->
          <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-2">
            <div class="flex items-center justify-between text-xs font-bold text-slate-500">
              <span class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                한국사 영역
              </span>
              <span>응시 {{ summaryStats.histCount }}명</span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-black text-slate-900 font-mono">{{ summaryStats.histAvgGrade }}</span>
              <span class="text-xs font-bold text-slate-500">평균 등급</span>
            </div>
            <div class="text-[11px] text-slate-500 flex justify-between pt-2 border-t border-slate-100">
              <span>1~4등급 충족률</span>
              <span class="font-bold text-amber-700 font-mono">{{ summaryStats.histPassRate }}%</span>
            </div>
          </div>
        </div>

        <!-- 직전 대입 연계 수능최저 경쟁력 시뮬레이션 요약 카드 -->
        <div class="bg-linear-to-r from-indigo-50/70 via-white to-sky-50/60 rounded-2xl p-5 border border-indigo-100 shadow-sm space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="text-lg">🎯</span>
              <h3 class="text-sm font-bold text-slate-800 m-0">
                직전 대입 기준 주요 수능최저 모의 충족률
              </h3>
              <span class="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                {{ targetAdmissionYear }}학년도 대입 경쟁력 진단
              </span>
            </div>
            <div class="text-xs text-slate-500">
              * 국·수·영·탐 상위 등급 조합 기준 (응시 인원 {{ filteredCurrentRecords.length }}명)
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div class="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs">
              <div class="text-xs font-bold text-slate-600 mb-1 flex items-center justify-between">
                <span>상위권 대학 (2합 5 이내)</span>
                <span class="text-[11px] text-indigo-600 font-mono font-bold">{{ csatBenchmark.twoSum5Count }}명</span>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="text-xl font-black text-indigo-950 font-mono">{{ csatBenchmark.twoSum5Rate }}%</span>
                <span class="text-[10px] text-slate-400">주요 서울권 수시 충족선</span>
              </div>
            </div>

            <div class="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs">
              <div class="text-xs font-bold text-slate-600 mb-1 flex items-center justify-between">
                <span>수도권 및 거점국립대 (2합 6 이내)</span>
                <span class="text-[11px] text-sky-600 font-mono font-bold">{{ csatBenchmark.twoSum6Count }}명</span>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="text-xl font-black text-sky-950 font-mono">{{ csatBenchmark.twoSum6Rate }}%</span>
                <span class="text-[10px] text-slate-400">수도권 학생부교과/종합 충족선</span>
              </div>
            </div>

            <div class="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs">
              <div class="text-xs font-bold text-slate-600 mb-1 flex items-center justify-between">
                <span>최상위권 대학 (3합 7 이내)</span>
                <span class="text-[11px] text-purple-600 font-mono font-bold">{{ csatBenchmark.threeSum7Count }}명</span>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="text-xl font-black text-purple-950 font-mono">{{ csatBenchmark.threeSum7Rate }}%</span>
                <span class="text-[10px] text-slate-400">서·성·한 등 최상위 수시 충족선</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 학생별 성적 명단 테이블 -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-800 m-0 flex items-center gap-2">
              <span>📋</span>
              <span>학생별 모의고사 성적 목록 (총 {{ filteredCurrentRecords.length }}건)</span>
            </h3>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="이름 검색..."
              class="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 w-44"
            />
          </div>

          <div class="overflow-x-auto rounded-xl border border-slate-200 max-h-96 overflow-y-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-slate-50 text-slate-600 font-bold sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th class="py-2.5 px-3">학급</th>
                  <th class="py-2.5 px-3">성명</th>
                  <th class="py-2.5 px-3">회차</th>
                  <th class="py-2.5 px-3">국어 (과목/표점/등급)</th>
                  <th class="py-2.5 px-3">수학 (과목/표점/등급)</th>
                  <th class="py-2.5 px-3 text-center">영어</th>
                  <th class="py-2.5 px-3 text-center">한국사</th>
                  <th class="py-2.5 px-3">탐구1</th>
                  <th class="py-2.5 px-3">탐구2</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-mono text-[11px]">
                <tr
                  v-for="(st, idx) in searchedCurrentRecords"
                  :key="st.studentKey + '_' + idx"
                  class="hover:bg-slate-50/80 transition-colors"
                >
                  <td class="py-2 px-3 text-slate-600">{{ st.classNum }}반 {{ st.studentNum }}번</td>
                  <td class="py-2 px-3 font-sans font-bold text-slate-900">{{ maskName(st.name) }}</td>
                  <td class="py-2 px-3 font-sans text-slate-500">
                    <span class="px-1.5 py-0.2 rounded bg-slate-100 text-[10px] font-bold">
                      {{ st.examName }}
                    </span>
                  </td>
                  <td class="py-2 px-3">
                    <span class="text-slate-500 text-[10px] mr-1">{{ st.korSubject }}</span>
                    <span v-if="st.korStandardScore" class="font-bold text-slate-800 mr-1">{{ st.korStandardScore }}</span>
                    <span v-if="st.korGrade" class="px-1 py-0.2 rounded bg-blue-50 text-blue-700 font-black text-[10px]">
                      {{ st.korGrade }}등급
                    </span>
                  </td>
                  <td class="py-2 px-3">
                    <span class="text-slate-500 text-[10px] mr-1">{{ st.mathSubject }}</span>
                    <span v-if="st.mathStandardScore" class="font-bold text-slate-800 mr-1">{{ st.mathStandardScore }}</span>
                    <span v-if="st.mathGrade" class="px-1 py-0.2 rounded bg-purple-50 text-purple-700 font-black text-[10px]">
                      {{ st.mathGrade }}등급
                    </span>
                  </td>
                  <td class="py-2 px-3 text-center">
                    <span v-if="st.engGrade" class="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 font-black text-[10px]">
                      {{ st.engGrade }}등급
                    </span>
                  </td>
                  <td class="py-2 px-3 text-center">
                    <span v-if="st.histGrade" class="px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 font-black text-[10px]">
                      {{ st.histGrade }}등급
                    </span>
                  </td>
                  <td class="py-2 px-3">
                    <span class="text-slate-500 text-[10px] mr-1">{{ st.inquiry1 }}</span>
                    <span v-if="st.inq1Grade" class="px-1 py-0.2 rounded bg-slate-100 text-slate-700 font-black text-[10px]">
                      {{ st.inq1Grade }}등급
                    </span>
                  </td>
                  <td class="py-2 px-3">
                    <span class="text-slate-500 text-[10px] mr-1">{{ st.inquiry2 }}</span>
                    <span v-if="st.inq2Grade" class="px-1 py-0.2 rounded bg-slate-100 text-slate-700 font-black text-[10px]">
                      {{ st.inq2Grade }}등급
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================================== -->
    <!-- 뷰 2: 고1 ➔ 고2 성적 성장 & 비교분석 화면 (고2 전용)          -->
    <!-- ========================================================== -->
    <div v-else-if="targetGrade === 2 && activeSubTab === 'tracking'" class="space-y-6">
      <!-- (A) 고1 ➔ 고2 영역별 평균 등급 비교 카드 그리드 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <!-- 국어 -->
        <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-2">
          <div class="flex items-center justify-between text-xs font-bold text-slate-500">
            <span class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              국어 영역
            </span>
            <span 
              v-if="cohortTrackingData.summary.deltas.kor !== null"
              :class="[
                'text-[10px] font-black px-1.5 py-0.2 rounded',
                cohortTrackingData.summary.deltas.kor > 0 ? 'bg-emerald-50 text-emerald-700' : (cohortTrackingData.summary.deltas.kor < 0 ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600')
              ]"
            >
              {{ cohortTrackingData.summary.deltas.kor > 0 ? `+${cohortTrackingData.summary.deltas.kor} 상승 🔺` : (cohortTrackingData.summary.deltas.kor < 0 ? `${cohortTrackingData.summary.deltas.kor} 하락 🔻` : '유지 ⚪') }}
            </span>
          </div>

          <div class="flex items-center justify-around pt-1">
            <div class="text-center">
              <div class="text-[10px] text-slate-400">고1 평균</div>
              <div class="text-base font-black font-mono text-slate-700">{{ cohortTrackingData.summary.grade1Avg.kor }}</div>
            </div>
            <ArrowRight class="w-4 h-4 text-slate-300" />
            <div class="text-center">
              <div class="text-[10px] text-indigo-500 font-bold">고2 평균(현재)</div>
              <div class="text-base font-black font-mono text-indigo-700">{{ cohortTrackingData.summary.grade2Avg.kor }}</div>
            </div>
          </div>
        </div>

        <!-- 수학 -->
        <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-2">
          <div class="flex items-center justify-between text-xs font-bold text-slate-500">
            <span class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              수학 영역
            </span>
            <span 
              v-if="cohortTrackingData.summary.deltas.math !== null"
              :class="[
                'text-[10px] font-black px-1.5 py-0.2 rounded',
                cohortTrackingData.summary.deltas.math > 0 ? 'bg-emerald-50 text-emerald-700' : (cohortTrackingData.summary.deltas.math < 0 ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600')
              ]"
            >
              {{ cohortTrackingData.summary.deltas.math > 0 ? `+${cohortTrackingData.summary.deltas.math} 상승 🔺` : (cohortTrackingData.summary.deltas.math < 0 ? `${cohortTrackingData.summary.deltas.math} 하락 🔻` : '유지 ⚪') }}
            </span>
          </div>

          <div class="flex items-center justify-around pt-1">
            <div class="text-center">
              <div class="text-[10px] text-slate-400">고1 평균</div>
              <div class="text-base font-black font-mono text-slate-700">{{ cohortTrackingData.summary.grade1Avg.math }}</div>
            </div>
            <ArrowRight class="w-4 h-4 text-slate-300" />
            <div class="text-center">
              <div class="text-[10px] text-purple-600 font-bold">고2 평균(현재)</div>
              <div class="text-base font-black font-mono text-purple-700">{{ cohortTrackingData.summary.grade2Avg.math }}</div>
            </div>
          </div>
        </div>

        <!-- 영어 -->
        <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-2">
          <div class="flex items-center justify-between text-xs font-bold text-slate-500">
            <span class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              영어 영역
            </span>
            <span 
              v-if="cohortTrackingData.summary.deltas.eng !== null"
              :class="[
                'text-[10px] font-black px-1.5 py-0.2 rounded',
                cohortTrackingData.summary.deltas.eng > 0 ? 'bg-emerald-50 text-emerald-700' : (cohortTrackingData.summary.deltas.eng < 0 ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600')
              ]"
            >
              {{ cohortTrackingData.summary.deltas.eng > 0 ? `+${cohortTrackingData.summary.deltas.eng} 상승 🔺` : (cohortTrackingData.summary.deltas.eng < 0 ? `${cohortTrackingData.summary.deltas.eng} 하락 🔻` : '유지 ⚪') }}
            </span>
          </div>

          <div class="flex items-center justify-around pt-1">
            <div class="text-center">
              <div class="text-[10px] text-slate-400">고1 평균</div>
              <div class="text-base font-black font-mono text-slate-700">{{ cohortTrackingData.summary.grade1Avg.eng }}</div>
            </div>
            <ArrowRight class="w-4 h-4 text-slate-300" />
            <div class="text-center">
              <div class="text-[10px] text-emerald-600 font-bold">고2 평균(현재)</div>
              <div class="text-base font-black font-mono text-emerald-700">{{ cohortTrackingData.summary.grade2Avg.eng }}</div>
            </div>
          </div>
        </div>

        <!-- 탐구 -->
        <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-2">
          <div class="flex items-center justify-between text-xs font-bold text-slate-500">
            <span class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              탐구 영역
            </span>
            <span 
              v-if="cohortTrackingData.summary.deltas.inq !== null"
              :class="[
                'text-[10px] font-black px-1.5 py-0.2 rounded',
                cohortTrackingData.summary.deltas.inq > 0 ? 'bg-emerald-50 text-emerald-700' : (cohortTrackingData.summary.deltas.inq < 0 ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600')
              ]"
            >
              {{ cohortTrackingData.summary.deltas.inq > 0 ? `+${cohortTrackingData.summary.deltas.inq} 상승 🔺` : (cohortTrackingData.summary.deltas.inq < 0 ? `${cohortTrackingData.summary.deltas.inq} 하락 🔻` : '유지 ⚪') }}
            </span>
          </div>

          <div class="flex items-center justify-around pt-1">
            <div class="text-center">
              <div class="text-[10px] text-slate-400">고1 평균</div>
              <div class="text-base font-black font-mono text-slate-700">{{ cohortTrackingData.summary.grade1Avg.inq }}</div>
            </div>
            <ArrowRight class="w-4 h-4 text-slate-300" />
            <div class="text-center">
              <div class="text-[10px] text-amber-600 font-bold">고2 평균(현재)</div>
              <div class="text-base font-black font-mono text-amber-700">{{ cohortTrackingData.summary.grade2Avg.inq }}</div>
            </div>
          </div>
        </div>

        <!-- 전체 종합 평균 -->
        <div class="bg-linear-to-br from-indigo-50 via-white to-sky-50 rounded-2xl p-4 border border-indigo-200/80 shadow-sm space-y-2">
          <div class="flex items-center justify-between text-xs font-bold text-indigo-900">
            <span class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              전영역 종합
            </span>
            <span 
              v-if="cohortTrackingData.summary.deltas.overall !== null"
              :class="[
                'text-[10px] font-black px-1.5 py-0.2 rounded',
                cohortTrackingData.summary.deltas.overall > 0 ? 'bg-emerald-100 text-emerald-800' : (cohortTrackingData.summary.deltas.overall < 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700')
              ]"
            >
              {{ cohortTrackingData.summary.deltas.overall > 0 ? `+${cohortTrackingData.summary.deltas.overall} 상승 🔺` : (cohortTrackingData.summary.deltas.overall < 0 ? `${cohortTrackingData.summary.deltas.overall} 하락 🔻` : '유지 ⚪') }}
            </span>
          </div>

          <div class="flex items-center justify-around pt-1">
            <div class="text-center">
              <div class="text-[10px] text-slate-400">고1 종합</div>
              <div class="text-base font-black font-mono text-slate-800">{{ cohortTrackingData.summary.grade1Avg.overall }}</div>
            </div>
            <ArrowRight class="w-4 h-4 text-indigo-400" />
            <div class="text-center">
              <div class="text-[10px] text-indigo-600 font-bold">고2 종합(현재)</div>
              <div class="text-base font-black font-mono text-indigo-900">{{ cohortTrackingData.summary.grade2Avg.overall }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- (B) 고1 ➔ 고2 성적 변동 분포 지표 카드 -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <!-- 1. 성적 상승자 -->
        <div class="bg-white rounded-2xl p-4 border border-emerald-200 shadow-2xs flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg shrink-0">
            📈
          </div>
          <div>
            <div class="text-[11px] font-bold text-slate-500">성적 상승 학생</div>
            <div class="flex items-baseline gap-1.5">
              <span class="text-xl font-black text-emerald-700 font-mono">{{ cohortTrackingData.summary.improvedCount }}명</span>
              <span class="text-[11px] text-slate-400 font-mono">({{ improvedRate }}%)</span>
            </div>
          </div>
        </div>

        <!-- 2. 성적 유지자 -->
        <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center font-bold text-lg shrink-0">
            ➡️
          </div>
          <div>
            <div class="text-[11px] font-bold text-slate-500">성적 유지 학생</div>
            <div class="flex items-baseline gap-1.5">
              <span class="text-xl font-black text-slate-800 font-mono">{{ cohortTrackingData.summary.maintainedCount }}명</span>
              <span class="text-[11px] text-slate-400 font-mono">({{ maintainedRate }}%)</span>
            </div>
          </div>
        </div>

        <!-- 3. 성적 하락자 -->
        <div class="bg-white rounded-2xl p-4 border border-rose-200 shadow-2xs flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg shrink-0">
            📉
          </div>
          <div>
            <div class="text-[11px] font-bold text-slate-500">성적 하락 (집중 케어)</div>
            <div class="flex items-baseline gap-1.5">
              <span class="text-xl font-black text-rose-700 font-mono">{{ cohortTrackingData.summary.declinedCount }}명</span>
              <span class="text-[11px] text-slate-400 font-mono">({{ declinedRate }}%)</span>
            </div>
          </div>
        </div>

        <!-- 4. 2개년 추적 완료 인원 -->
        <div class="bg-white rounded-2xl p-4 border border-indigo-200 shadow-2xs flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg shrink-0">
            👥
          </div>
          <div>
            <div class="text-[11px] font-bold text-slate-500">고1➔고2 추적 완료</div>
            <div class="flex items-baseline gap-1.5">
              <span class="text-xl font-black text-indigo-900 font-mono">{{ cohortTrackingData.summary.trackedMultiYearCount }}명</span>
              <span class="text-[11px] text-slate-400 font-mono">/ 전체 {{ cohortTrackingData.summary.totalStudents }}명</span>
            </div>
          </div>
        </div>
      </div>

      <!-- (C) 학생별 고1 ➔ 고2 성적 추적 상세 테이블 -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="text-base">📋</span>
            <h3 class="text-sm font-bold text-slate-800 m-0">
              학생별 고1 ➔ 고2 성적 추적 상세 명단 (총 {{ searchedTrackingStudents.length }}명)
            </h3>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <!-- 반 필터 -->
            <select
              v-model="trackingClassFilter"
              class="px-2.5 py-1 text-xs bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">전체 반</option>
              <option v-for="c in trackingAvailableClasses" :key="c" :value="c">{{ c }}반</option>
            </select>

            <!-- 추이 필터 -->
            <select
              v-model="trackingTrendFilter"
              class="px-2.5 py-1 text-xs bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">전체 추이</option>
              <option value="UP">🟢 성적 상승만</option>
              <option value="SAME">⚪ 성적 유지</option>
              <option value="DOWN">🔴 성적 하락만</option>
            </select>

            <!-- 이름 검색 -->
            <input
              v-model="trackingSearchQuery"
              type="text"
              placeholder="학생명 검색..."
              class="px-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 w-36"
            />
          </div>
        </div>

        <div class="overflow-x-auto rounded-xl border border-slate-200 max-h-96 overflow-y-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead class="bg-slate-50 text-slate-600 font-bold sticky top-0 z-10 border-b border-slate-200 text-[11px]">
              <tr>
                <th class="py-2.5 px-3">학급</th>
                <th class="py-2.5 px-3">성명</th>
                <th class="py-2.5 px-3 text-center">고1 종합</th>
                <th class="py-2.5 px-3 text-center">고2 종합(현재)</th>
                <th class="py-2.5 px-3 text-center">변동 추이</th>
                <th class="py-2.5 px-3">국어 (고1➔고2)</th>
                <th class="py-2.5 px-3">수학 (고1➔고2)</th>
                <th class="py-2.5 px-3">영어 (고1➔고2)</th>
                <th class="py-2.5 px-3">탐구 (고1➔고2)</th>
                <th class="py-2.5 px-3 text-center">회차 이력</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-mono text-[11px]">
              <tr
                v-for="st in searchedTrackingStudents"
                :key="st.name"
                class="hover:bg-slate-50/80 transition-colors"
              >
                <td class="py-2 px-3 text-slate-600 font-sans">
                  {{ st.classNum ? `${st.classNum}반 ${st.studentNum}번` : '-' }}
                </td>
                <td class="py-2 px-3 font-sans font-bold text-slate-900">
                  {{ maskName(st.name) }}
                </td>
                <td class="py-2 px-3 text-center font-bold text-slate-700">
                  {{ st.g1.overall !== null ? `${st.g1.overall}등급` : '-' }}
                </td>
                <td class="py-2 px-3 text-center font-black text-indigo-700 bg-indigo-50/30">
                  {{ st.g2.overall !== null ? `${st.g2.overall}등급` : '-' }}
                </td>
                <td class="py-2 px-3 text-center">
                  <span
                    v-if="st.trend === 'UP'"
                    class="px-2 py-0.5 rounded-full font-black text-[10px] bg-emerald-100 text-emerald-800"
                  >
                    +{{ st.deltas.overall }} 🔺 상승
                  </span>
                  <span
                    v-else-if="st.trend === 'DOWN'"
                    class="px-2 py-0.5 rounded-full font-black text-[10px] bg-rose-100 text-rose-800"
                  >
                    {{ st.deltas.overall }} 🔻 하락
                  </span>
                  <span
                    v-else-if="st.trend === 'SAME'"
                    class="px-2 py-0.5 rounded-full font-black text-[10px] bg-slate-100 text-slate-700"
                  >
                    유지 ⚪
                  </span>
                  <span
                    v-else
                    class="px-2 py-0.5 rounded-full font-medium text-[10px] bg-slate-50 text-slate-400"
                  >
                    단일 학년
                  </span>
                </td>
                <td class="py-2 px-3">
                  <span class="text-slate-500 mr-1">{{ st.g1.kor || '-' }} ➔ {{ st.g2.kor || '-' }}</span>
                  <span v-if="st.deltas.kor !== null" :class="st.deltas.kor > 0 ? 'text-emerald-600 font-bold' : (st.deltas.kor < 0 ? 'text-rose-600 font-bold' : 'text-slate-400')">
                    ({{ st.deltas.kor > 0 ? `+${st.deltas.kor}` : st.deltas.kor }})
                  </span>
                </td>
                <td class="py-2 px-3">
                  <span class="text-slate-500 mr-1">{{ st.g1.math || '-' }} ➔ {{ st.g2.math || '-' }}</span>
                  <span v-if="st.deltas.math !== null" :class="st.deltas.math > 0 ? 'text-emerald-600 font-bold' : (st.deltas.math < 0 ? 'text-rose-600 font-bold' : 'text-slate-400')">
                    ({{ st.deltas.math > 0 ? `+${st.deltas.math}` : st.deltas.math }})
                  </span>
                </td>
                <td class="py-2 px-3">
                  <span class="text-slate-500 mr-1">{{ st.g1.eng || '-' }} ➔ {{ st.g2.eng || '-' }}</span>
                  <span v-if="st.deltas.eng !== null" :class="st.deltas.eng > 0 ? 'text-emerald-600 font-bold' : (st.deltas.eng < 0 ? 'text-rose-600 font-bold' : 'text-slate-400')">
                    ({{ st.deltas.eng > 0 ? `+${st.deltas.eng}` : st.deltas.eng }})
                  </span>
                </td>
                <td class="py-2 px-3">
                  <span class="text-slate-500 mr-1">{{ st.g1.inq || '-' }} ➔ {{ st.g2.inq || '-' }}</span>
                  <span v-if="st.deltas.inq !== null" :class="st.deltas.inq > 0 ? 'text-emerald-600 font-bold' : (st.deltas.inq < 0 ? 'text-rose-600 font-bold' : 'text-slate-400')">
                    ({{ st.deltas.inq > 0 ? `+${st.deltas.inq}` : st.deltas.inq }})
                  </span>
                </td>
                <td class="py-2 px-3 text-center">
                  <button
                    @click="openStudentDetail(st)"
                    class="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 transition-colors cursor-pointer border-none"
                  >
                    타임라인
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ========================================================== -->
    <!-- 학생 개인별 모의고사 전 회차 타임라인 모달                   -->
    <!-- ========================================================== -->
    <div
      v-if="isStudentModalOpen && selectedStudentDetail"
      class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
        <!-- 모달 헤더 -->
        <div class="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-lg">📈</span>
            <div>
              <h3 class="text-sm font-black m-0 flex items-center gap-2">
                <span>{{ maskName(selectedStudentDetail.name) }}</span>
                <span class="text-xs text-indigo-300 font-normal">
                  ({{ selectedStudentDetail.classNum }}반 {{ selectedStudentDetail.studentNum }}번)
                </span>
              </h3>
              <p class="text-[11px] text-slate-400 m-0">모의고사 전 회차 응시 이력</p>
            </div>
          </div>
          <button
            @click="isStudentModalOpen = false"
            class="text-slate-400 hover:text-white p-1 rounded-lg bg-transparent border-none cursor-pointer text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <!-- 모달 본문 (스크롤) -->
        <div class="p-6 overflow-y-auto space-y-5">
          <!-- 1. 고1 모의고사 내역 -->
          <div class="space-y-2">
            <div class="flex items-center justify-between text-xs font-bold text-slate-700">
              <span class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-sky-500"></span>
                <span>고1 모의고사 이력 (총 {{ selectedStudentDetail.grade1Exams.length }}회)</span>
              </span>
              <span class="text-slate-500 font-mono">
                종합 평균: <strong>{{ selectedStudentDetail.g1?.overall || '-' }}등급</strong>
              </span>
            </div>

            <div v-if="selectedStudentDetail.grade1Exams.length === 0" class="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl text-center">
              고1 응시 이력이 없습니다.
            </div>
            <div v-else class="space-y-1.5">
              <div
                v-for="ex in selectedStudentDetail.grade1Exams"
                :key="ex.examName"
                class="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
              >
                <div class="font-bold text-slate-800">{{ ex.examName }}</div>
                <div class="flex items-center gap-3 font-mono text-[11px]">
                  <span>국: <strong>{{ ex.korGrade || '-' }}등급</strong></span>
                  <span>수: <strong>{{ ex.mathGrade || '-' }}등급</strong></span>
                  <span>영: <strong>{{ ex.engGrade || '-' }}등급</strong></span>
                  <span>탐1: <strong>{{ ex.inq1Grade || '-' }}등급</strong></span>
                  <span>탐2: <strong>{{ ex.inq2Grade || '-' }}등급</strong></span>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. 고2 모의고사 내역 (고2 학생인 경우에만 표시) -->
          <div v-if="targetGrade === 2" class="space-y-2">
            <div class="flex items-center justify-between text-xs font-bold text-indigo-900">
              <span class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-indigo-600"></span>
                <span>고2 모의고사 이력 (현재, 총 {{ selectedStudentDetail.grade2Exams?.length || 0 }}회)</span>
              </span>
              <span class="text-indigo-700 font-mono">
                종합 평균: <strong>{{ selectedStudentDetail.g2?.overall || '-' }}등급</strong>
              </span>
            </div>

            <div v-if="!selectedStudentDetail.grade2Exams || selectedStudentDetail.grade2Exams.length === 0" class="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl text-center">
              고2 응시 이력이 없습니다.
            </div>
            <div v-else class="space-y-1.5">
              <div
                v-for="ex in selectedStudentDetail.grade2Exams"
                :key="ex.examName"
                class="p-2.5 bg-indigo-50/40 rounded-xl border border-indigo-100 flex items-center justify-between text-xs"
              >
                <div class="font-bold text-indigo-950">{{ ex.examName }}</div>
                <div class="flex items-center gap-3 font-mono text-[11px]">
                  <span>국: <strong class="text-indigo-800">{{ ex.korGrade || '-' }}등급</strong></span>
                  <span>수: <strong class="text-indigo-800">{{ ex.mathGrade || '-' }}등급</strong></span>
                  <span>영: <strong class="text-indigo-800">{{ ex.engGrade || '-' }}등급</strong></span>
                  <span>탐1: <strong class="text-indigo-800">{{ ex.inq1Grade || '-' }}등급</strong></span>
                  <span>탐2: <strong class="text-indigo-800">{{ ex.inq2Grade || '-' }}등급</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 모달 푸터 -->
        <div class="px-6 py-3 bg-slate-50 border-t border-slate-200 text-right">
          <button
            @click="isStudentModalOpen = false"
            class="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ChevronDown, RefreshCw, ArrowRight } from 'lucide-vue-next'
import { 
  useStatData, 
  getGradeAdmissionYear, 
  cohortTrackingData, 
  isLoadingCohortTracking, 
  loadCohortMockTracking 
} from '../../composables/useStatData'
import { getAcademicSchoolYear } from '../../utils/mockExamReportParser'

const props = defineProps({
  grade: {
    type: Number,
    default: 2
  }
})

const targetGrade = computed(() => Number(props.grade) || 2)
// 해당 학사일정 연도 (예: 2026.11 기준 2026학년도 학사)
const academicYear = computed(() => getAcademicSchoolYear(new Date()))
// 해당 학년의 대입 학년도 (예: 2026.11 기준 고2는 2028학년도, 고1은 2029학년도 대입)
const targetAdmissionYear = computed(() => getGradeAdmissionYear(targetGrade.value))

const { mockExamRecords, loadMockExamData, maskName } = useStatData()

// 서브 탭: 'current' (당해 학년 성적 분석) | 'tracking' (고1➔고2 성적 성장 & 비교분석)
const activeSubTab = ref('current')

// 시트 연도 라벨
const cohortSheetYears = computed(() => {
  const base = Number(academicYear.value) // 2026
  if (targetGrade.value === 2) {
    return {
      g1Year: String(base),     // '2026' (2026모의결과)
      g2Year: String(base + 1)  // '2027' (2027모의결과, 현재)
    }
  } else {
    return {
      g1Year: String(base + 1)  // '2027' (2027모의결과, 현재 고1)
    }
  }
})

// 데이터 로드
async function reloadCohortData(forceReload = false) {
  await Promise.all([
    loadMockExamData(forceReload),
    loadCohortMockTracking(targetGrade.value, forceReload)
  ])
}

onMounted(() => {
  reloadCohortData()
})

// -------------------------------------------------------------
// [당해 학년 성적 분석] 관련 계산
// -------------------------------------------------------------
const currentGradeRecords = computed(() => {
  // 1순위: 코호트 트래킹에 로드된 해당 학년 레코드
  const fromCohort = cohortTrackingData.value.recordsByGrade?.[targetGrade.value] || []
  if (fromCohort.length > 0) return fromCohort

  // 2순위: 일반 mockExamRecords 중 targetGrade 일치 레코드
  return (mockExamRecords.value || []).filter(r => Number(r.grade) === targetGrade.value)
})

const uniqueStudentsCount = computed(() => {
  const set = new Set(currentGradeRecords.value.map(r => r.name))
  return set.size
})

const availableExamNames = computed(() => {
  const set = new Set()
  currentGradeRecords.value.forEach(r => {
    if (r.examName) set.add(r.examName)
  })
  return Array.from(set)
})

const availableClasses = computed(() => {
  const set = new Set()
  currentGradeRecords.value.forEach(r => {
    if (r.classNum) set.add(String(r.classNum))
  })
  return Array.from(set).sort((a, b) => Number(a) - Number(b))
})

const selectedExamName = ref('ALL')
const selectedClass = ref('ALL')
const searchQuery = ref('')

const filteredCurrentRecords = computed(() => {
  return currentGradeRecords.value.filter(r => {
    if (selectedExamName.value !== 'ALL' && r.examName !== selectedExamName.value) return false
    if (selectedClass.value !== 'ALL' && String(r.classNum) !== selectedClass.value) return false
    return true
  })
})

const searchedCurrentRecords = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return filteredCurrentRecords.value
  return filteredCurrentRecords.value.filter(r => {
    return (r.name && r.name.toLowerCase().includes(q)) ||
           (r.studentKey && r.studentKey.includes(q))
  })
})

// 요약 통계
const summaryStats = computed(() => {
  const recs = filteredCurrentRecords.value
  const calcAvg = (getter) => {
    const vals = recs.map(getter).filter(v => v !== null && v !== undefined && !isNaN(v))
    if (vals.length === 0) return { count: 0, avg: '-' }
    const sum = vals.reduce((a, b) => a + Number(b), 0)
    return { count: vals.length, avg: (sum / vals.length).toFixed(2) }
  }

  const korGrade = calcAvg(r => r.korGrade)
  const korScore = calcAvg(r => r.korStandardScore)
  const mathGrade = calcAvg(r => r.mathGrade)
  const mathScore = calcAvg(r => r.mathStandardScore)
  const engGrade = calcAvg(r => r.engGrade)
  const histGrade = calcAvg(r => r.histGrade)

  const engValid = recs.filter(r => r.engGrade !== null && !isNaN(r.engGrade))
  const engTop = engValid.filter(r => Number(r.engGrade) <= 3)
  const engTopRate = engValid.length > 0 ? ((engTop.length / engValid.length) * 100).toFixed(1) : '-'

  const histValid = recs.filter(r => r.histGrade !== null && !isNaN(r.histGrade))
  const histPass = histValid.filter(r => Number(r.histGrade) <= 4)
  const histPassRate = histValid.length > 0 ? ((histPass.length / histValid.length) * 100).toFixed(1) : '-'

  return {
    korCount: korGrade.count,
    korAvgGrade: korGrade.avg,
    korAvgScore: korScore.avg,
    mathCount: mathGrade.count,
    mathAvgGrade: mathGrade.avg,
    mathAvgScore: mathScore.avg,
    engCount: engGrade.count,
    engAvgGrade: engGrade.avg,
    engTopRate,
    histCount: histGrade.count,
    histAvgGrade: histGrade.avg,
    histPassRate
  }
})

// 수능최저 시뮬레이션 지표
const csatBenchmark = computed(() => {
  const recs = filteredCurrentRecords.value
  if (recs.length === 0) {
    return {
      twoSum5Count: 0, twoSum5Rate: '-',
      twoSum6Count: 0, twoSum6Rate: '-',
      threeSum7Count: 0, threeSum7Rate: '-'
    }
  }

  let twoSum5 = 0
  let twoSum6 = 0
  let threeSum7 = 0

  recs.forEach(r => {
    const grades = [r.korGrade, r.mathGrade, r.engGrade, r.inq1Grade, r.inq2Grade]
      .filter(g => g !== null && g !== undefined && !isNaN(g) && Number(g) > 0)
      .map(Number)
      .sort((a, b) => a - b)

    if (grades.length >= 2) {
      const sum2 = grades[0] + grades[1]
      if (sum2 <= 5) twoSum5++
      if (sum2 <= 6) twoSum6++
    }
    if (grades.length >= 3) {
      const sum3 = grades[0] + grades[1] + grades[2]
      if (sum3 <= 7) threeSum7++
    }
  })

  return {
    twoSum5Count: twoSum5,
    twoSum5Rate: ((twoSum5 / recs.length) * 100).toFixed(1),
    twoSum6Count: twoSum6,
    twoSum6Rate: ((twoSum6 / recs.length) * 100).toFixed(1),
    threeSum7Count: threeSum7,
    threeSum7Rate: ((threeSum7 / recs.length) * 100).toFixed(1)
  }
})

// -------------------------------------------------------------
// [고1 ➔ 고2 성적 성장 & 비교분석] 관련 계산 (고2 전용)
// -------------------------------------------------------------
const trackingClassFilter = ref('ALL')
const trackingTrendFilter = ref('ALL')
const trackingSearchQuery = ref('')

const trackingAvailableClasses = computed(() => {
  const set = new Set()
  cohortTrackingData.value.studentsTimeline.forEach(st => {
    if (st.classNum) set.add(String(st.classNum))
  })
  return Array.from(set).sort((a, b) => Number(a) - Number(b))
})

const searchedTrackingStudents = computed(() => {
  const q = trackingSearchQuery.value.trim().toLowerCase()
  return cohortTrackingData.value.studentsTimeline.filter(st => {
    if (trackingClassFilter.value !== 'ALL' && String(st.classNum) !== trackingClassFilter.value) return false
    if (trackingTrendFilter.value !== 'ALL' && st.trend !== trackingTrendFilter.value) return false
    if (q && !st.name.toLowerCase().includes(q)) return false
    return true
  })
})

const improvedRate = computed(() => {
  const total = cohortTrackingData.value.summary.trackedMultiYearCount
  if (!total) return '0.0'
  return ((cohortTrackingData.value.summary.improvedCount / total) * 100).toFixed(1)
})

const maintainedRate = computed(() => {
  const total = cohortTrackingData.value.summary.trackedMultiYearCount
  if (!total) return '0.0'
  return ((cohortTrackingData.value.summary.maintainedCount / total) * 100).toFixed(1)
})

const declinedRate = computed(() => {
  const total = cohortTrackingData.value.summary.trackedMultiYearCount
  if (!total) return '0.0'
  return ((cohortTrackingData.value.summary.declinedCount / total) * 100).toFixed(1)
})

// 학생 상세 타임라인 모달 상태
const isStudentModalOpen = ref(false)
const selectedStudentDetail = ref(null)

function openStudentDetail(st) {
  selectedStudentDetail.value = st
  isStudentModalOpen.value = true
}
</script>
