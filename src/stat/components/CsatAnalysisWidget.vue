<template>
  <div id="csat-analysis-section" class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm transition-all duration-300 space-y-6">
    <!-- 🌟 섹션 헤더 (가채점 vs 결과 모드 자동 감지) -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold mb-2"
          :class="isTentativeMode ? 'bg-amber-50 text-amber-800 border border-amber-200/80' : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'">
          <span>{{ isTentativeMode ? '📝' : '🎓' }}</span>
          <span>3. {{ isTentativeMode ? '수능 가채점 분석' : '수능 결과 분석' }}</span>
          <span class="text-slate-300">|</span>
          <span class="font-semibold">{{ isTentativeMode ? `${selectedAcademicYear || '2027'}학년도 11월 가채점 실측 성적 기준` : `${selectedAcademicYear || '2027'}학년도 공식 실채점 확정 성적표` }}</span>
        </div>
        <h3 class="text-lg sm:text-xl font-black text-slate-900 tracking-tight m-0 flex items-center gap-2 flex-wrap">
          <span>{{ isTentativeMode ? `${selectedAcademicYear || '2027'}학년도 수능 가채점 기반 수시 최저 진단 & 대학별고사 응시 가이드` : `${selectedAcademicYear || '2027'}학년도 수능 결과 기반 수시 최저 확정 & 정시 지원 분석` }}</span>
          <span
            class="px-2 py-0.5 rounded-md text-[11px] font-bold"
            :class="isTentativeMode ? 'bg-amber-500 text-white shadow-2xs' : 'bg-emerald-600 text-white shadow-2xs'"
          >
            {{ isTentativeMode ? '가채점 모드 (원점수/등급)' : '실채점 확정 모드 (표점/백분위/등급)' }}
          </span>
        </h3>
        <p class="text-xs text-slate-500 m-0 mt-1 leading-relaxed">
          {{ isTentativeMode
            ? `${selectedAcademicYear || '2027'}학년도 수능 가채점 ${csatStudents.length}명 원점수/등급과 수시 6장 지원 카드를 1:1 대조하여 수시최저 충족 여부, 대학별고사(면접/논술) 포기 vs 응시 전략 및 영역별 성적을 분석합니다.`
            : `${selectedAcademicYear || '2027'}학년도 공식 수능 실채점 성적표를 바탕으로 수시 수능최저 최종 충족 여부와 정시 실전 환산점수 배치선을 종합 분석합니다.`
          }}
        </p>
      </div>

      <!-- Quick KPI Badges & 새로고침 버튼 -->
      <div class="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
        <button
          type="button"
          @click="reloadMockData"
          :disabled="isReloading || isLoadingMockExams"
          class="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
          title="구글 시트 2027모의가채점 / 2027모의결과 탭의 최신 데이터를 강제 재동기화합니다."
        >
          <span :class="{ 'animate-spin': isReloading || isLoadingMockExams }">🔄</span>
          <span>{{ isReloading || isLoadingMockExams ? '동기화 중...' : '시트 가채점 동기화' }}</span>
        </button>
        <div class="bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl text-right">
          <span class="text-[10px] text-indigo-700 block font-semibold">수능 실응시자</span>
          <span class="text-sm font-black text-indigo-900 font-mono">
            {{ csatStudents.length }}명
          </span>
        </div>
        <div class="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-right">
          <span class="text-[10px] text-emerald-800 block font-semibold">수시최저 충족률</span>
          <span class="text-sm font-black text-emerald-700 font-mono">
            {{ overallStats.passRate }}%
            <span class="text-[10.5px] font-medium text-slate-500">({{ overallStats.passCards }}/{{ overallStats.totalMinCards }}건)</span>
          </span>
        </div>
      </div>
    </div>

    <!-- 동기화 상태 안내 배너 -->
    <div
      v-if="reloadStatusMessage"
      class="px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-2xs transition-all"
      :class="{
        'bg-emerald-50 text-emerald-800 border border-emerald-200': reloadStatusType === 'success',
        'bg-rose-50 text-rose-800 border border-rose-200': reloadStatusType === 'error',
        'bg-blue-50 text-blue-800 border border-blue-200': reloadStatusType === 'info'
      }"
    >
      <div class="flex items-center gap-2">
        <span class="text-sm">
          {{ reloadStatusType === 'success' ? '✅' : (reloadStatusType === 'error' ? '⚠️' : '🔄') }}
        </span>
        <span>{{ reloadStatusMessage }}</span>
      </div>
      <button
        type="button"
        @click="reloadStatusMessage = ''"
        class="text-xs opacity-60 hover:opacity-100 border-none bg-transparent cursor-pointer font-bold px-1"
        title="닫기"
      >
        ✕
      </button>
    </div>

    <!-- 데이터가 없는 경우 안내 -->
    <div v-if="csatStudents.length === 0" class="text-center py-10 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 space-y-3">
      <span class="text-3xl block">📋</span>
      <h4 class="text-sm font-bold text-slate-700 m-0">수능 가채점 성적 데이터를 불러오는 중이거나 아직 동기화되지 않았습니다</h4>
      <p class="text-xs text-slate-500 max-w-md mx-auto">
        구글 시트 '{{ selectedAcademicYear || '2027' }}모의가채점' 탭에 11월 수능 원점수/등급을 입력하셨다면 아래 동기화 버튼을 눌러주세요.
      </p>
      <div>
        <button
          type="button"
          @click="reloadMockData"
          :disabled="isReloading || isLoadingMockExams"
          class="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
        >
          <span :class="{ 'animate-spin': isReloading || isLoadingMockExams }">🔄</span>
          <span>{{ isReloading || isLoadingMockExams ? '구글 시트 동기화 중...' : '구글 시트에서 수능 가채점 데이터 즉시 불러오기' }}</span>
        </button>
      </div>
    </div>

    <template v-else>
      <!-- 🔘 서브 탭 내비게이션 (1. 전체 통계 & 등급 분포 vs 2. 개인별 정밀 분석) -->
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div class="inline-flex p-1 rounded-xl bg-slate-100/90 border border-slate-200/80 gap-1">
          <button
            type="button"
            @click="activeViewTab = 'summary'"
            :class="[
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer border-none',
              activeViewTab === 'summary'
                ? 'bg-white text-indigo-950 shadow-2xs font-black'
                : 'bg-transparent text-slate-600 hover:text-slate-900'
            ]"
          >
            <span>📊</span>
            <span>전체 통계 & 수능 영역별 등급 분포</span>
          </button>
          <button
            type="button"
            @click="activeViewTab = 'individual'"
            :class="[
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer border-none',
              activeViewTab === 'individual'
                ? 'bg-white text-indigo-950 shadow-2xs font-black'
                : 'bg-transparent text-slate-600 hover:text-slate-900'
            ]"
          >
            <span>👤</span>
            <span>개인별 수시최저 & 대학별고사(면접/논술) 가이드</span>
            <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 font-bold ml-1">
              {{ csatStudents.length }}명
            </span>
          </button>
        </div>

        <!-- 우측 빠른 필터/정보 -->
        <span class="text-xs text-slate-400 font-medium hidden sm:inline-block">
          💡 수시최저 판정은 지원 카드별 전형 요강(탐구 반영수, 한국사)을 100% 반영합니다.
        </span>
      </div>

      <!-- ============================================================== -->
      <!-- [뷰 1] 개인별 정밀 분석 & 면접/논술 응시 가이드 -->
      <!-- ============================================================== -->
      <div v-if="activeViewTab === 'individual'" class="space-y-5">
        <!-- 🎯 학생 선택 바 & 빠른 필터 (반/이름 드롭다운) -->
        <div class="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs font-bold text-slate-700">반 선택:</span>
              <select
                v-model="classFilter"
                class="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer min-w-24"
              >
                <option value="ALL">전체 반</option>
                <option v-for="c in availableClasses" :key="c" :value="String(c)">
                  {{ c }}반
                </option>
              </select>

              <span class="text-xs font-bold text-slate-700 ml-1">학생 선택:</span>
              <select
                v-model="selectedStudentKey"
                class="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer min-w-52"
              >
                <option v-for="st in filteredStudents" :key="st.studentKey" :value="st.studentKey">
                  {{ st.classNum ? `${st.classNum}반 ` : '' }}{{ maskName(st.name) }}
                  (내신 {{ st.gpa || '-' }} / 국수탐 {{ st.rawSum300 || '-' }}점)
                </option>
              </select>
            </div>

            <!-- 상태 필터 태그 -->
            <div class="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                @click="statusFilter = 'ALL'"
                :class="[
                  'px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition-colors',
                  statusFilter === 'ALL' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'
                ]"
              >
                전체 ({{ csatStudents.length }})
              </button>
              <button
                type="button"
                @click="statusFilter = 'PASS_ALL'"
                :class="[
                  'px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition-colors',
                  statusFilter === 'PASS_ALL' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                ]"
              >
                ✨ 최저100% 충족 ({{ overallStats.perfectPassCount }})
              </button>
              <button
                type="button"
                @click="statusFilter = 'FAIL_SOME'"
                :class="[
                  'px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition-colors',
                  statusFilter === 'FAIL_SOME' ? 'bg-amber-600 text-white border-amber-600' : 'bg-amber-50 text-amber-700 border-amber-200'
                ]"
              >
                ⚠️ 일부 미달 ({{ overallStats.partialFailCount }})
              </button>
            </div>
          </div>
        </div>

        <!-- 현재 선택된 학생 상세 카드 -->
        <div v-if="currentStudent" class="space-y-4">
          <!-- 1. 학생 성적 요약 카드 -->
          <div class="bg-linear-to-br from-indigo-900 via-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-md space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div class="flex items-center gap-2.5">
                <span class="text-lg font-black tracking-tight">
                  {{ currentStudent.classNum ? `${currentStudent.classNum}반 ` : '' }}{{ currentStudent.studentNum ? `${currentStudent.studentNum}번 ` : '' }}{{ maskName(currentStudent.name) }}
                </span>
                <span class="px-2 py-0.5 rounded text-[10.5px] font-bold bg-white/15 text-indigo-200 border border-white/20">
                  내신 {{ currentStudent.gpa || '-' }}등급
                </span>
                <span v-if="currentStudent.field" class="px-2 py-0.5 rounded text-[10.5px] font-bold bg-indigo-500/30 text-indigo-300">
                  {{ currentStudent.field }}
                </span>
              </div>
              <div class="flex items-center gap-3 text-xs">
                <div>
                  <span class="text-slate-400 mr-1.5">국·수·탐(2) 원점수 총점:</span>
                  <span class="font-mono font-black text-amber-300 text-sm">{{ currentStudent.rawSum300 }}점</span>
                  <span class="text-[10px] text-slate-400"> / 300</span>
                </div>
                <div class="border-l border-white/15 pl-3">
                  <span class="text-slate-400 mr-1.5">4영역 평균 등급:</span>
                  <span class="font-mono font-black text-emerald-300 text-sm">{{ currentStudent.avgGrade }}등급</span>
                </div>
              </div>
            </div>

            <!-- 영역별 성적표 그리드 -->
            <div class="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
              <!-- 국어 -->
              <div class="bg-white/5 border border-white/10 rounded-xl p-2.5">
                <div class="text-[11px] text-slate-300 font-semibold mb-1">
                  국어 <span v-if="currentStudent.korSubject" class="text-[10px] text-indigo-300">({{ currentStudent.korSubject }})</span>
                </div>
                <div class="text-base font-black text-white font-mono">
                  {{ currentStudent.korGrade ? `${currentStudent.korGrade}등급` : '-' }}
                </div>
                <div class="text-[10px] text-slate-400 mt-0.5 font-mono">
                  원점수 {{ currentStudent.korRawScore || '-' }}점
                </div>
              </div>
              <!-- 수학 -->
              <div class="bg-white/5 border border-white/10 rounded-xl p-2.5">
                <div class="text-[11px] text-slate-300 font-semibold mb-1">
                  수학 <span v-if="currentStudent.mathSubject" class="text-[10px] text-indigo-300">({{ currentStudent.mathSubject }})</span>
                </div>
                <div class="text-base font-black text-white font-mono">
                  {{ currentStudent.mathGrade ? `${currentStudent.mathGrade}등급` : '-' }}
                </div>
                <div class="text-[10px] text-slate-400 mt-0.5 font-mono">
                  원점수 {{ currentStudent.mathRawScore || '-' }}점
                </div>
              </div>
              <!-- 영어 -->
              <div class="bg-white/5 border border-white/10 rounded-xl p-2.5">
                <div class="text-[11px] text-slate-300 font-semibold mb-1">영어</div>
                <div class="text-base font-black text-emerald-300 font-mono">
                  {{ currentStudent.engGrade ? `${currentStudent.engGrade}등급` : '-' }}
                </div>
                <div class="text-[10px] text-slate-400 mt-0.5 font-mono">
                  원점수 {{ currentStudent.engRawScore || '-' }}점
                </div>
              </div>
              <!-- 탐구1 -->
              <div class="bg-white/5 border border-white/10 rounded-xl p-2.5">
                <div class="text-[11px] text-slate-300 font-semibold mb-1 truncate" :title="currentStudent.inquiry1">
                  {{ currentStudent.inquiry1 || '탐구1' }}
                </div>
                <div class="text-base font-black text-white font-mono">
                  {{ currentStudent.inq1Grade ? `${currentStudent.inq1Grade}등급` : '-' }}
                </div>
                <div class="text-[10px] text-slate-400 mt-0.5 font-mono">
                  원점수 {{ currentStudent.inq1RawScore || '-' }}점
                </div>
              </div>
              <!-- 탐구2 -->
              <div class="bg-white/5 border border-white/10 rounded-xl p-2.5">
                <div class="text-[11px] text-slate-300 font-semibold mb-1 truncate" :title="currentStudent.inquiry2">
                  {{ currentStudent.inquiry2 || '탐구2' }}
                </div>
                <div class="text-base font-black text-white font-mono">
                  {{ currentStudent.inq2Grade ? `${currentStudent.inq2Grade}등급` : '-' }}
                </div>
                <div class="text-[10px] text-slate-400 mt-0.5 font-mono">
                  원점수 {{ currentStudent.inq2RawScore || '-' }}점
                </div>
              </div>
              <!-- 한국사 -->
              <div class="bg-white/5 border border-white/10 rounded-xl p-2.5">
                <div class="text-[11px] text-slate-300 font-semibold mb-1">한국사</div>
                <div class="text-base font-black text-amber-300 font-mono">
                  {{ currentStudent.histGrade ? `${currentStudent.histGrade}등급` : '-' }}
                </div>
                <div class="text-[10px] text-slate-400 mt-0.5 font-mono">
                  원점수 {{ currentStudent.histRawScore || '-' }}점
                </div>
              </div>
            </div>
          </div>

          <!-- 2. 🚨 대학별고사(면접/논술) 응시 결정 종합 처방전 배너 -->
          <div
            class="p-4 sm:p-5 rounded-2xl border transition-all duration-200"
            :class="studentDecisionBannerClass"
          >
            <div class="flex items-start gap-3">
              <span class="text-2xl shrink-0 mt-0.5">{{ studentDecisionIcon }}</span>
              <div class="space-y-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <h4 class="text-sm font-black m-0 tracking-tight" :class="studentDecisionTitleColor">
                    {{ studentDecisionTitle }}
                  </h4>
                  <span class="px-2 py-0.5 rounded text-[10.5px] font-bold" :class="studentDecisionBadgeClass">
                    {{ studentDecisionBadge }}
                  </span>
                </div>
                <p class="text-xs text-slate-600 m-0 leading-relaxed">
                  {{ studentDecisionMessage }}
                </p>
                <div class="text-[11px] font-medium text-slate-500 pt-1 flex items-center gap-3 flex-wrap">
                  <span>🎯 정시 기대 라인: <strong class="text-slate-800">{{ currentStudent.satTierName }}</strong></span>
                  <span>|</span>
                  <span>수시 최저 적용 카드: <strong class="text-slate-800">{{ currentStudent.susiApps.filter(a => a.minEval.hasMinScore).length }}건 중 {{ currentStudent.susiApps.filter(a => a.minEval.isSatisfied).length }}건 충족</strong></span>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. 지원한 수시 6장 카드별 수능 최저 충족 현황 테이블 -->
          <div class="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div class="bg-slate-100/90 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
              <span class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>📑</span>
                <span>수시 지원 카드별 수능최저 충족 여부 및 대학별고사 응시 처방</span>
                <span class="text-[11px] font-normal text-slate-500">({{ currentStudent.susiApps.length }}장 지원)</span>
              </span>
              <span class="text-[11px] text-slate-400">
                초록: 충족(응시 권장) / 주황: 정시비교 권고 / 회색: 미충족
              </span>
            </div>

            <div v-if="currentStudent.susiApps.length === 0" class="p-8 text-center text-xs text-slate-400">
              해당 학생의 수시 지원 데이터가 원본 시트에 등록되어 있지 않습니다.
            </div>

            <div v-else class="overflow-x-auto">
              <table class="w-full text-xs text-left border-collapse min-w-190">
                <thead>
                  <tr class="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th class="p-2.5 whitespace-nowrap min-w-35">지원 대학교 (학과)</th>
                    <th class="p-2.5 whitespace-nowrap min-w-25">전형 유형</th>
                    <th class="p-2.5 min-w-45">수능최저 요구기준</th>
                    <th class="p-2.5 text-center whitespace-nowrap min-w-22">충족 판정</th>
                    <th class="p-2.5 min-w-40">반영 과목 계산 상세</th>
                    <th class="p-2.5 text-center whitespace-nowrap min-w-28">대학별고사 처방</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr
                    v-for="(app, idx) in currentStudent.susiApps"
                    :key="idx"
                    class="hover:bg-slate-50/80 transition-colors"
                  >
                    <!-- 대학 & 학과 -->
                    <td class="p-2.5">
                      <div class="font-bold text-slate-900">{{ app.univName }}</div>
                      <div v-if="app.dept" class="text-[11px] text-slate-500 mt-0.5">
                        {{ app.dept }}
                      </div>
                    </td>

                    <!-- 전형 유형 -->
                    <td class="p-2.5 whitespace-nowrap">
                      <span
                        :class="[
                          'px-2 py-0.5 rounded text-[11px] font-bold inline-block',
                          app.admissionType?.includes('교과') ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          app.admissionType?.includes('종합') ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                          'bg-slate-100 text-slate-600'
                        ]"
                      >
                        {{ app.admissionType || '수시' }}
                      </span>
                      <div v-if="app.admissionDetailType" class="text-[10px] text-slate-400 mt-0.5 truncate max-w-28" :title="app.admissionDetailType">
                        {{ app.admissionDetailType }}
                      </div>
                    </td>

                    <!-- 요구 기준 -->
                    <td class="p-2.5 text-slate-700 leading-snug">
                      <div v-if="app.minEval.hasMinScore" class="font-medium text-slate-800">
                        {{ app.minScoreReq }}
                      </div>
                      <div v-else class="text-slate-400 text-[11px]">
                        수능최저 없음 (면접/서류 100%)
                      </div>
                    </td>

                    <!-- 충족 판정 -->
                    <td class="p-2.5 text-center whitespace-nowrap">
                      <template v-if="!app.minEval.hasMinScore">
                        <span class="px-2 py-0.5 rounded text-[10.5px] font-bold bg-slate-100 text-slate-500">
                          미적용
                        </span>
                      </template>
                      <template v-else-if="app.minEval.isSatisfied">
                        <span
                          v-if="app.minEval.isBorderline"
                          class="px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs"
                          title="기준 컷에 딱 맞춘 턱걸이 충족 (등급컷 변동 주의)"
                        >
                          PASS (턱걸이)
                        </span>
                        <span
                          v-else
                          class="px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs"
                        >
                          PASS (충족)
                        </span>
                      </template>
                      <template v-else>
                        <span class="px-2 py-0.5 rounded text-[10.5px] font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                          FAIL (미달)
                        </span>
                      </template>
                    </td>

                    <!-- 반영 과목 계산 상세 -->
                    <td class="p-2.5 text-slate-600 text-[11px] leading-snug">
                      <div>{{ app.minEval.evalSummary }}</div>
                      <div v-if="app.minEval.failReason" class="text-rose-600 text-[10.5px] mt-0.5 font-medium">
                        ⚠️ {{ app.minEval.failReason }}
                      </div>
                    </td>

                    <!-- 대학별고사 처방 -->
                    <td class="p-2.5 text-center whitespace-nowrap">
                      <span
                        class="px-2.5 py-1 rounded-md text-[11px] font-black inline-block shadow-2xs"
                        :class="app.actionClass"
                      >
                        {{ app.actionText }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- [뷰 2] 전체 27명 통계 & 영역별 등급 분포 -->
      <!-- ============================================================== -->
      <div v-else class="space-y-6">
        <!-- 1. 핵심 성과 통계 4대 카드 -->
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div class="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 text-center">
            <span class="text-xs font-bold text-indigo-700 block mb-1">수능 실응시 인원</span>
            <span class="text-2xl font-black text-indigo-950 font-mono">{{ csatStudents.length }}명</span>
            <span class="text-[10.5px] text-indigo-600 block mt-1">
              {{ selectedAcademicYear || '2027' }}학년도 {{ isTentativeMode ? '수능 가채점 입력학생' : '수능 응시학생' }}
            </span>
          </div>

          <div class="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100 text-center">
            <span class="text-xs font-bold text-emerald-700 block mb-1">수시 최저 통과율</span>
            <span class="text-2xl font-black text-emerald-800 font-mono">{{ overallStats.passRate }}%</span>
            <span class="text-[10.5px] text-emerald-600 block mt-1">{{ overallStats.passCards }}건 충족 / 총 {{ overallStats.totalMinCards }}건</span>
          </div>

          <div class="bg-blue-50/70 p-4 rounded-2xl border border-blue-100 text-center">
            <span class="text-xs font-bold text-blue-700 block mb-1">최저 100% 충족 학생</span>
            <span class="text-2xl font-black text-blue-900 font-mono">{{ overallStats.perfectPassCount }}명</span>
            <span class="text-[10.5px] text-blue-600 block mt-1">지원한 모든 최저 카드 통과</span>
          </div>

          <div class="bg-amber-50/70 p-4 rounded-2xl border border-amber-100 text-center">
            <span class="text-xs font-bold text-amber-800 block mb-1">평균 원점수 합 (300만점)</span>
            <span class="text-2xl font-black text-amber-900 font-mono">{{ overallStats.avgRawSum }}점</span>
            <span class="text-[10.5px] text-amber-700 block mt-1">국+수+탐(2) 합산 평균</span>
          </div>
        </div>

        <!-- 2. 수능 주요 5개 영역별 가채점 등급 분포표 -->
        <div class="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div class="bg-slate-100/90 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
            <h4 class="text-xs font-bold text-slate-800 m-0 flex items-center gap-1.5">
              <span>📈</span>
              <span>수능 영역별 등급 분포 및 평균 성적 (응시자 {{ csatStudents.length }}명 기준)</span>
            </h4>
            <span class="text-[11px] text-slate-400">
              절대평가(영어·한국사) 및 주요 과목 최저 방어율
            </span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-xs text-center border-collapse min-w-160">
              <thead>
                <tr class="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th class="p-2.5 text-left min-w-20">영역</th>
                  <th class="p-2.5 min-w-15">평균 등급</th>
                  <th class="p-2.5 min-w-15">평균 원점수</th>
                  <th class="p-2.5 min-w-16">1등급</th>
                  <th class="p-2.5 min-w-16">2등급</th>
                  <th class="p-2.5 min-w-16">3등급</th>
                  <th class="p-2.5 min-w-18 text-emerald-700 bg-emerald-50/50">1~3등급 누적</th>
                  <th class="p-2.5 min-w-16">4등급 이하</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="subj in subjectGradeDistribution" :key="subj.key" class="hover:bg-slate-50/80">
                  <td class="p-2.5 font-bold text-slate-800 text-left flex items-center gap-1.5">
                    <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: subj.color }"></span>
                    <span>{{ subj.name }}</span>
                  </td>
                  <td class="p-2.5 font-bold font-mono text-indigo-700">{{ subj.avgGrade }}등급</td>
                  <td class="p-2.5 font-mono text-slate-600">{{ subj.avgScore }}점</td>
                  <td class="p-2.5 font-mono font-bold text-blue-600">
                    {{ subj.g1 }}명 <span class="text-[10px] text-slate-400 font-normal">({{ subj.g1Rate }}%)</span>
                  </td>
                  <td class="p-2.5 font-mono text-slate-700">
                    {{ subj.g2 }}명 <span class="text-[10px] text-slate-400 font-normal">({{ subj.g2Rate }}%)</span>
                  </td>
                  <td class="p-2.5 font-mono text-slate-700">
                    {{ subj.g3 }}명 <span class="text-[10px] text-slate-400 font-normal">({{ subj.g3Rate }}%)</span>
                  </td>
                  <td class="p-2.5 font-mono font-black text-emerald-700 bg-emerald-50/40">
                    {{ subj.g13 }}명 <span class="text-[10.5px]">({{ subj.g13Rate }}%)</span>
                  </td>
                  <td class="p-2.5 font-mono text-slate-400">
                    {{ subj.g4plus }}명
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 3. 전체 학생 가채점 성적 & 최저 달성 현황 일람표 -->
        <div class="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div class="bg-slate-100/90 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
            <h4 class="text-xs font-bold text-slate-800 m-0 flex items-center gap-1.5">
              <span>📋</span>
              <span>전체 응시자({{ csatStudents.length }}명) 가채점 성적 및 최저 달성 현황 일람표</span>
            </h4>
            <span class="text-[11px] text-slate-400">
              클릭 시 해당 학생의 세부 처방으로 이동합니다
            </span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left border-collapse min-w-220">
              <thead>
                <tr class="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th class="p-2.5 whitespace-nowrap min-w-20">학생</th>
                  <th class="p-2.5 text-center min-w-15">내신</th>
                  <th class="p-2.5 text-center min-w-15">국어</th>
                  <th class="p-2.5 text-center min-w-15">수학</th>
                  <th class="p-2.5 text-center min-w-15">영어</th>
                  <th class="p-2.5 text-center min-w-18">탐구1</th>
                  <th class="p-2.5 text-center min-w-18">탐구2</th>
                  <th class="p-2.5 text-center min-w-14">한국사</th>
                  <th class="p-2.5 text-center min-w-18">원점수합</th>
                  <th class="p-2.5 text-center min-w-22">최저 충족률</th>
                  <th class="p-2.5 text-center min-w-26">종합 처방</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="st in csatStudents"
                  :key="st.studentKey"
                  @click="selectStudentAndGo(st.studentKey)"
                  class="hover:bg-indigo-50/50 cursor-pointer transition-colors"
                  :class="selectedStudentKey === st.studentKey ? 'bg-indigo-50/70 font-semibold' : ''"
                >
                  <td class="p-2.5 font-bold text-slate-800 whitespace-nowrap">
                    {{ st.classNum ? `${st.classNum}반 ` : '' }}{{ maskName(st.name) }}
                  </td>
                  <td class="p-2.5 text-center font-mono font-bold text-blue-700">
                    {{ st.gpa || '-' }}
                  </td>
                  <td class="p-2.5 text-center font-mono">
                    <span :class="getGradeColor(st.korGrade)">{{ st.korGrade || '-' }}등급</span>
                    <span class="text-[10px] text-slate-400 block">({{ st.korRawScore || '-' }})</span>
                  </td>
                  <td class="p-2.5 text-center font-mono">
                    <span :class="getGradeColor(st.mathGrade)">{{ st.mathGrade || '-' }}등급</span>
                    <span class="text-[10px] text-slate-400 block">({{ st.mathRawScore || '-' }})</span>
                  </td>
                  <td class="p-2.5 text-center font-mono">
                    <span :class="getGradeColor(st.engGrade)">{{ st.engGrade || '-' }}등급</span>
                    <span class="text-[10px] text-slate-400 block">({{ st.engRawScore || '-' }})</span>
                  </td>
                  <td class="p-2.5 text-center font-mono">
                    <span :class="getGradeColor(st.inq1Grade)">{{ st.inq1Grade || '-' }}등급</span>
                    <span class="text-[10px] text-slate-400 block truncate max-w-16" :title="st.inquiry1">({{ st.inq1RawScore || '-' }})</span>
                  </td>
                  <td class="p-2.5 text-center font-mono">
                    <span :class="getGradeColor(st.inq2Grade)">{{ st.inq2Grade || '-' }}등급</span>
                    <span class="text-[10px] text-slate-400 block truncate max-w-16" :title="st.inquiry2">({{ st.inq2RawScore || '-' }})</span>
                  </td>
                  <td class="p-2.5 text-center font-mono text-slate-600">
                    {{ st.histGrade ? `${st.histGrade}등급` : '-' }}
                  </td>
                  <td class="p-2.5 text-center font-mono font-bold text-amber-700">
                    {{ st.rawSum300 }}점
                  </td>
                  <td class="p-2.5 text-center font-mono">
                    <span
                      class="px-2 py-0.5 rounded text-[11px] font-bold"
                      :class="st.passCount === st.totalMinCards && st.totalMinCards > 0 ? 'bg-emerald-100 text-emerald-800' : st.passCount > 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'"
                    >
                      {{ st.passCount }}/{{ st.totalMinCards }}
                    </span>
                  </td>
                  <td class="p-2.5 text-center whitespace-nowrap">
                    <span
                      class="px-2 py-0.5 rounded text-[10.5px] font-bold"
                      :class="st.overallDecisionClass"
                    >
                      {{ st.overallDecisionText }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useData } from '../composables/useStatData'

const {
  applications,
  mockExamRecords,
  isLoadingMockExams,
  loadMockExamData,
  selectedAcademicYear,
  maskName,
  formatGrade
} = useData()

const activeViewTab = ref('summary')
const selectedStudentKey = ref('')
const classFilter = ref('ALL')
const statusFilter = ref('ALL')
const isReloading = ref(false)
const reloadStatusMessage = ref('')
const reloadStatusType = ref('info')

async function reloadMockData() {
  if (isReloading.value) return
  isReloading.value = true
  reloadStatusMessage.value = '구글 시트에서 최신 수능 가채점 성적을 동기화하고 있습니다. 잠시만 기다려주세요...'
  reloadStatusType.value = 'info'
  try {
    const yr = selectedAcademicYear.value || '2027'
    await loadMockExamData(true, yr)
    const count = csatStudents.value.length
    if (count > 0) {
      reloadStatusMessage.value = `동기화 완료: ${yr}학년도 수능 가채점 실응시자 ${count}명의 성적이 성공적으로 반영되었습니다.`
      reloadStatusType.value = 'success'
    } else {
      reloadStatusMessage.value = `⚠️ 동기화 완료되었으나 수능 가채점 응시자를 찾지 못했습니다. ('${yr}모의가채점' 탭의 행 또는 학년도를 확인해주세요)`
      reloadStatusType.value = 'error'
    }
  } catch (err) {
    console.warn('[CsatAnalysisWidget] 수능 가채점 데이터 재로드 실패:', err)
    reloadStatusMessage.value = `❌ 동기화 실패: ${err.message || '네트워크 오류가 발생했습니다.'}`
    reloadStatusType.value = 'error'
  } finally {
    isReloading.value = false
  }
}

// 수능 레코드 판정 (11월, 11, 수능, CSAT, 가채점 탭 출처 등 유연 매칭)
function isCsatRecord(r) {
  if (!r) return false
  const name = String(r.examName || '').trim()
  const rawMonth = String(r.rawMonth || '').trim()
  if (name.includes('수능') || name.includes('대학수학능력시험') || name === 'CSAT') return true
  if (rawMonth.includes('수능') || rawMonth.includes('대학수학능력시험') || rawMonth === 'CSAT') return true
  if (rawMonth.includes('11') || name.includes('11')) return true
  if (r.monthOrder && Number(r.monthOrder) === 11) return true
  if (r.rawRow) {
    if (Array.isArray(r.rawRow)) {
      const rowStr = r.rawRow.slice(0, 3).join(' ')
      if (rowStr.includes('수능') || rowStr.includes('11')) return true
    }
    const firstVal = String(Object.values(r.rawRow)[0] || '').trim()
    if (firstVal.includes('수능') || firstVal.includes('11')) return true
    if (r.rawRow['월'] && (String(r.rawRow['월']).includes('수능') || String(r.rawRow['월']).includes('11'))) return true
  }
  // 가채점 시트 출처이면서 3~10월 모의고사가 아니면 수능 가채점으로 채택
  if (r.isFallbackFromTentative || String(r.sourceTab || '').includes('가채점')) {
    if (!name.includes('3월') && !name.includes('5월') && !name.includes('6월') && !name.includes('7월') && !name.includes('9월') && !name.includes('10월')) {
      return true
    }
  }
  return false
}

// 가채점 vs 확정 결과 자동 판정: 표준점수가 없는 경우 가채점으로 처리
const isTentativeMode = computed(() => {
  const records = rawCsatRecords.value
  if (!records || records.length === 0) return true
  // 표준점수 유무 확인
  const hasStd = records.some(r => r.korStandardScore || r.mathStandardScore)
  return !hasStd
})

// 순수 11월 수능 레코드 목록 (고3 3학년 + 헤더성 행 방어 필터링)
const rawCsatRecords = computed(() => {
  const all = mockExamRecords.value || []
  return all.filter(r => {
    if (Number(r.grade) !== 3 && r.grade) return false
    if (!isCsatRecord(r)) return false
    const cleanName = String(r.name || '').trim()
    if (!cleanName || /^(이름|성명|국어선택|수학선택|탐구선택|선택과목|과목명|원점수|표준점수|백분위|등급)$/.test(cleanName)) return false
    if (/(선택|과목|점수|등급|백분위|합계|총점)/.test(cleanName)) return false
    // 최소한 국/수/영/탐/한국사 중 1개 이상의 숫자 성적이 존재해야 함
    const hasNumScore = [
      r.korGrade, r.mathGrade, r.engGrade, r.inq1Grade, r.inq2Grade, r.histGrade,
      r.korRawScore, r.mathRawScore, r.engRawScore, r.inq1RawScore, r.inq2RawScore
    ].some(v => v !== null && v !== undefined && String(v).trim() !== '' && !isNaN(Number(v)) && Number(v) > 0)
    return hasNumScore
  })
})

// 정시 예상 지원선 산출 (원점수 300점 만점 또는 등급 평균 기준)
function getSatTier(rawSum, avgGrade) {
  const sum = Number(rawSum) || 0
  const avg = Number(avgGrade) || 9
  if (sum >= 275 || avg <= 1.4) return { tier: 1, name: '의약학 · 서울대 · 연고대 상위' }
  if (sum >= 255 || avg <= 2.0) return { tier: 2, name: '연고대 · 서강·성균관·한양대' }
  if (sum >= 235 || avg <= 2.6) return { tier: 3, name: '중앙·경희·한국외·시립대' }
  if (sum >= 210 || avg <= 3.2) return { tier: 4, name: '건국·동국·홍익·숙명여대' }
  if (sum >= 185 || avg <= 3.8) return { tier: 5, name: '국민·숭실·세종·단국·인하·아주대' }
  if (sum >= 160 || avg <= 4.5) return { tier: 6, name: '수도권 주요대 · 거점국립대 본교' }
  if (sum >= 135 || avg <= 5.2) return { tier: 7, name: '경기권 및 지방 거점대' }
  return { tier: 8, name: '지방 4년제 및 전문대' }
}

// 수시 대학 레벨 Tier 추정 (1~8)
function getUnivTier(univName) {
  const u = String(univName || '').trim()
  if (u.includes('서울대') || u.includes('의대') || u.includes('약대') || u.includes('치의') || u.includes('한의')) return 1
  if (u.includes('연세대') || u.includes('고려대') || u.includes('서강대') || u.includes('성균관대') || u.includes('한양대')) return 2
  if (u.includes('중앙대') || u.includes('경희대') || u.includes('한국외') || u.includes('시립대') || u.includes('이화여대')) return 3
  if (u.includes('건국대') || u.includes('동국대') || u.includes('홍익대') || u.includes('숙명여대')) return 4
  if (u.includes('국민대') || u.includes('숭실대') || u.includes('세종대') || u.includes('단국대') || u.includes('인하대') || u.includes('아주대') || u.includes('과기대')) return 5
  if (u.includes('가천대') || u.includes('경기대') || u.includes('인천대') || u.includes('충남대') || u.includes('충북대') || u.includes('경북대') || u.includes('부산대')) return 6
  if (u.includes('안양대') || u.includes('강남대') || u.includes('수원대') || u.includes('한신대') || u.includes('성결대') || u.includes('대진대')) return 7
  return 8
}

// 수시최저학력기준 정밀 파서 및 판정 함수
function evaluateMinScore(minReq, student) {
  const req = String(minReq || '').trim()
  if (!req || req === '-' || req === '없음' || req === '미적용' || req.includes('미반영') || req.includes('없음')) {
    return {
      hasMinScore: false,
      isSatisfied: true,
      isBorderline: false,
      evalSummary: '수능최저 미적용 (면접/서류 100%)',
      failReason: ''
    }
  }

  const kor = Number(student.korGrade) || 9
  const math = Number(student.mathGrade) || 9
  const eng = Number(student.engGrade) || 9
  const inq1 = Number(student.inq1Grade) || 9
  const inq2 = Number(student.inq2Grade) || 9
  const hist = Number(student.histGrade) || 9

  // 1. 한국사 필수 조건 검사 (예: 한국사 4등급 이내)
  const histMatch = req.match(/한국사\s*([1-9])\s*등급?/)
  if (histMatch) {
    const reqHist = Number(histMatch[1])
    if (hist > reqHist) {
      return {
        hasMinScore: true,
        isSatisfied: false,
        isBorderline: false,
        evalSummary: `한국사 ${hist}등급 (요구: ${reqHist}등급 이내 미충족)`,
        failReason: '한국사 등급 미달'
      }
    }
  }

  // 2. 탐구 반영 방식 (1과목 vs 2과목 평균)
  const is2Inq = req.includes('2과목') || req.includes('탐(2)') || req.includes('평균')
  const inqGrade = is2Inq ? (inq1 + inq2) / 2 : Math.min(inq1, inq2)

  // 가용 과목 리스트 [국어, 수학, 영어, 탐구]
  const subjectGrades = [
    { name: '국', grade: kor },
    { name: '수', grade: math },
    { name: '영', grade: eng },
    { name: is2Inq ? '탐평' : '탐', grade: inqGrade }
  ]

  // 3. 'N개 영역 합 M' 패턴 정규식 매칭 (예: 2개 합 5, 3합 7, 3개 영역 등급 합 8 등)
  let nAreas = 0
  let targetSum = 0

  const sumMatch1 = req.match(/([1-4])\s*개?\s*영?역?\s*합\s*([0-9]{1,2})/)
  const sumMatch2 = req.match(/([1-4])\s*합\s*([0-9]{1,2})/)
  if (sumMatch1) {
    nAreas = Number(sumMatch1[1])
    targetSum = Number(sumMatch1[2])
  } else if (sumMatch2) {
    nAreas = Number(sumMatch2[1])
    targetSum = Number(sumMatch2[2])
  } else {
    // 1개 영역 3등급 등
    const singleMatch = req.match(/([1-4])\s*개?\s*영?역?\s*([1-9])\s*등급/)
    if (singleMatch) {
      nAreas = Number(singleMatch[1])
      targetSum = Number(singleMatch[2]) * nAreas
    }
  }

  if (nAreas > 0 && targetSum > 0) {
    // 성적 우수 과목 순으로 정렬
    const sorted = [...subjectGrades].sort((a, b) => a.grade - b.grade)
    const picked = sorted.slice(0, nAreas)
    const actualSum = picked.reduce((acc, cur) => acc + cur.grade, 0)
    const isSatisfied = actualSum <= targetSum
    const isBorderline = actualSum === targetSum
    const pickedDesc = picked.map(p => `${p.name}(${p.grade})`).join('+')

    return {
      hasMinScore: true,
      isSatisfied,
      isBorderline,
      actualSum,
      targetSum,
      evalSummary: `${pickedDesc} = ${actualSum}합 (${nAreas}합 ${targetSum} 기준)`,
      failReason: isSatisfied ? '' : `${actualSum - targetSum}등급 초과 미달`
    }
  }

  // 패턴 미검출 시 기본 패스/미달 안내
  return {
    hasMinScore: true,
    isSatisfied: true,
    isBorderline: false,
    evalSummary: '최저 기준 반영 (정성 검토)',
    failReason: ''
  }
}

// 27명 학생 수합 및 수시 6장 1:1 매칭 데이터
const csatStudents = computed(() => {
  const records = rawCsatRecords.value
  const allApps = applications.value || []

  return records.map(r => {
    const rawSum300 = (
      (Number(r.korRawScore) || 0) +
      (Number(r.mathRawScore) || 0) +
      (Number(r.inq1RawScore) || 0) +
      (Number(r.inq2RawScore) || 0)
    )

    const validGrades = [r.korGrade, r.mathGrade, r.engGrade, r.inq1Grade, r.inq2Grade].filter(g => g > 0)
    const avgGrade = validGrades.length > 0
      ? (validGrades.reduce((a, b) => a + b, 0) / validGrades.length).toFixed(2)
      : '-'

    const satTier = getSatTier(rawSum300, avgGrade)

    // 해당 학생의 수시 6장 카드 탐색
    const cleanName = String(r.name || '').trim()
    const studentApps = allApps.filter(a => {
      const aName = String(a.name || '').trim()
      if (aName !== cleanName) return false
      if (r.classNum && a.classNum && String(r.classNum) !== String(a.classNum)) return false
      return true
    })

    // 각 수시 카드별 최저 평가 및 대학별고사 추천
    const evaluatedApps = studentApps.map(app => {
      const minEval = evaluateMinScore(app.minScoreReq, r)
      const univTier = getUnivTier(app.univName)

      let actionText = '필참 응시'
      let actionClass = 'bg-emerald-600 text-white'

      if (!minEval.hasMinScore) {
        actionText = '필참 (최저없음)'
        actionClass = 'bg-blue-600 text-white'
      } else if (!minEval.isSatisfied) {
        actionText = '최저미달 (응시불가)'
        actionClass = 'bg-slate-300 text-slate-600'
      } else {
        // 최저 충족한 경우: 매우 보수적으로 정시 비교 권고 여부 판정
        // 정시 성적이 확실한 상위권(tier <= 3, 원점수 235점↑ 또는 평균 2.6등급↓)이면서 2티어 이상 격차가 날 때만 신중 비교 권고
        const isHighSat = satTier.tier <= 3
        const hasBigGap = satTier.tier < univTier && (univTier - satTier.tier >= 2)
        if (isHighSat && hasBigGap) {
          actionText = '💡 정시비교 권고'
          actionClass = 'bg-amber-500 text-white'
        } else if (satTier.tier <= univTier) {
          actionText = '적극 응시 권장'
          actionClass = 'bg-emerald-700 text-white'
        } else {
          actionText = '적정 응시'
          actionClass = 'bg-emerald-600 text-white'
        }
      }

      return {
        ...app,
        minEval,
        actionText,
        actionClass
      }
    })

    // 학생의 내신 (수시 카드 또는 모의 레코드에서 추출)
    const gpa = studentApps[0]?.allSubjectGrade || studentApps[0]?.score9Grade || '-'
    const field = studentApps[0]?.field || ''

    // 최저 충족 건수 집계
    const minApplied = evaluatedApps.filter(a => a.minEval.hasMinScore)
    const passCount = minApplied.filter(a => a.minEval.isSatisfied).length
    const totalMinCards = minApplied.length

    // 학생 종합 처방 판정
    let overallDecisionText = '정상 응시'
    let overallDecisionClass = 'bg-emerald-100 text-emerald-800'
    const hasCompareRecommend = evaluatedApps.some(a => a.actionText.includes('정시비교'))
    const allFail = totalMinCards > 0 && passCount === 0

    if (hasCompareRecommend) {
      overallDecisionText = '💡 정시비교 권고'
      overallDecisionClass = 'bg-amber-100 text-amber-800 border border-amber-300 font-bold'
    } else if (allFail) {
      overallDecisionText = '⚠️ 최저 미충족 (정시집중)'
      overallDecisionClass = 'bg-slate-200 text-slate-700'
    } else if (passCount === totalMinCards && totalMinCards > 0) {
      overallDecisionText = '✨ 최저 100% 달성'
      overallDecisionClass = 'bg-emerald-100 text-emerald-800 font-bold'
    }

    return {
      ...r,
      gpa,
      field,
      rawSum300,
      avgGrade,
      satTier: satTier.tier,
      satTierName: satTier.name,
      susiApps: evaluatedApps,
      passCount,
      totalMinCards,
      overallDecisionText,
      overallDecisionClass
    }
  }).sort((a, b) => {
    const classA = Number(a.classNum) || 999
    const classB = Number(b.classNum) || 999
    if (classA !== classB) return classA - classB
    return String(a.name || '').localeCompare(String(b.name || ''), 'ko')
  })
})

// 전체 학생 중 고유 반 목록
const availableClasses = computed(() => {
  const set = new Set()
  csatStudents.value.forEach(s => {
    if (s.classNum) set.add(s.classNum)
  })
  return Array.from(set).sort((a, b) => Number(a) - Number(b))
})

// 필터링된 학생 목록 (반별·이름순 오름차순 유지)
const filteredStudents = computed(() => {
  return csatStudents.value.filter(s => {
    if (classFilter.value !== 'ALL' && String(s.classNum) !== String(classFilter.value)) return false
    if (statusFilter.value === 'SKIP') return s.overallDecisionText.includes('정시비교')
    if (statusFilter.value === 'PASS_ALL') return s.totalMinCards > 0 && s.passCount === s.totalMinCards
    if (statusFilter.value === 'FAIL_SOME') return s.totalMinCards > 0 && s.passCount < s.totalMinCards
    return true
  })
})

// 반 또는 상태 필터 변경 시 선택 학생이 목록에 없으면 첫 번째 학생 자동 선택
watch([classFilter, statusFilter], () => {
  const list = filteredStudents.value
  if (list.length > 0 && !list.some(s => s.studentKey === selectedStudentKey.value)) {
    selectedStudentKey.value = list[0].studentKey
  }
})

// 현재 선택된 학생 객체
const currentStudent = computed(() => {
  if (!selectedStudentKey.value && csatStudents.value.length > 0) {
    return csatStudents.value[0]
  }
  return csatStudents.value.find(s => s.studentKey === selectedStudentKey.value) || csatStudents.value[0] || null
})

// 종합 통계 계산
const overallStats = computed(() => {
  const list = csatStudents.value
  let totalMinCards = 0
  let passCards = 0
  let skipCount = 0
  let perfectPassCount = 0
  let partialFailCount = 0
  let rawSumTotal = 0

  list.forEach(s => {
    totalMinCards += s.totalMinCards
    passCards += s.passCount
    rawSumTotal += s.rawSum300
    if (s.overallDecisionText.includes('정시비교')) skipCount++
    if (s.totalMinCards > 0 && s.passCount === s.totalMinCards) perfectPassCount++
    if (s.totalMinCards > 0 && s.passCount < s.totalMinCards) partialFailCount++
  })

  const passRate = totalMinCards > 0 ? ((passCards / totalMinCards) * 100).toFixed(1) : '0.0'
  const avgRawSum = list.length > 0 ? (rawSumTotal / list.length).toFixed(1) : '-'

  return {
    totalMinCards,
    passCards,
    passRate,
    skipCount,
    perfectPassCount,
    partialFailCount,
    avgRawSum
  }
})

// 영역별 등급 분포표 데이터 (탐구1·2 통합, (절대)/(필수) 표기 제거)
const subjectGradeDistribution = computed(() => {
  const list = csatStudents.value
  const total = list.length
  if (total === 0) return []

  const subjects = [
    { key: 'kor', name: '국어', color: '#3b82f6', getItems: s => [{ grade: s.korGrade, score: s.korRawScore }] },
    { key: 'math', name: '수학', color: '#8b5cf6', getItems: s => [{ grade: s.mathGrade, score: s.mathRawScore }] },
    { key: 'eng', name: '영어', color: '#10b981', getItems: s => [{ grade: s.engGrade, score: s.engRawScore }] },
    {
      key: 'inq',
      name: '탐구',
      color: '#f59e0b',
      getItems: s => [
        { grade: s.inq1Grade, score: s.inq1RawScore },
        { grade: s.inq2Grade, score: s.inq2RawScore }
      ]
    },
    { key: 'hist', name: '한국사', color: '#64748b', getItems: s => [{ grade: s.histGrade, score: s.histRawScore }] }
  ]

  return subjects.map(sub => {
    let g1 = 0, g2 = 0, g3 = 0, g4plus = 0
    let gradeSum = 0, scoreSum = 0, validGradeCount = 0, validScoreCount = 0

    list.forEach(s => {
      const items = sub.getItems(s)
      items.forEach(item => {
        const g = Number(item.grade)
        const sc = Number(item.score)
        if (g >= 1 && g <= 9) {
          validGradeCount++
          gradeSum += g
          if (g === 1) g1++
          else if (g === 2) g2++
          else if (g === 3) g3++
          else g4plus++
        }
        if (!isNaN(sc) && sc > 0) {
          validScoreCount++
          scoreSum += sc
        }
      })
    })

    const g13 = g1 + g2 + g3
    const denom = validGradeCount > 0 ? validGradeCount : total
    return {
      key: sub.key,
      name: sub.name,
      color: sub.color,
      avgGrade: validGradeCount > 0 ? (gradeSum / validGradeCount).toFixed(2) : '-',
      avgScore: validScoreCount > 0 ? (scoreSum / validScoreCount).toFixed(1) : '-',
      g1,
      g1Rate: ((g1 / denom) * 100).toFixed(1),
      g2,
      g2Rate: ((g2 / denom) * 100).toFixed(1),
      g3,
      g3Rate: ((g3 / denom) * 100).toFixed(1),
      g13,
      g13Rate: ((g13 / denom) * 100).toFixed(1),
      g4plus
    }
  })
})

// 처방전 배너 상태별 스타일
const studentDecisionBannerClass = computed(() => {
  if (!currentStudent.value) return 'bg-slate-50 border-slate-200'
  const text = currentStudent.value.overallDecisionText
  if (text.includes('정시비교')) return 'bg-amber-50/90 border-amber-300 ring-1 ring-amber-200'
  if (text.includes('100%')) return 'bg-emerald-50/90 border-emerald-300'
  if (text.includes('미충족') || text.includes('전멸')) return 'bg-slate-100 border-slate-300'
  return 'bg-blue-50/90 border-blue-200'
})

const studentDecisionIcon = computed(() => {
  if (!currentStudent.value) return '📋'
  const text = currentStudent.value.overallDecisionText
  if (text.includes('정시비교')) return '💡'
  if (text.includes('100%')) return '✨'
  if (text.includes('미충족') || text.includes('전멸')) return '⚠️'
  return '🎯'
})

const studentDecisionTitleColor = computed(() => {
  if (!currentStudent.value) return 'text-slate-900'
  const text = currentStudent.value.overallDecisionText
  if (text.includes('정시비교')) return 'text-amber-900'
  if (text.includes('100%')) return 'text-emerald-900'
  return 'text-indigo-950'
})

const studentDecisionTitle = computed(() => {
  if (!currentStudent.value) return '대학별고사 응시 전략 분석'
  const text = currentStudent.value.overallDecisionText
  if (text.includes('정시비교')) return '정시 지원 가능선 비교 후 대학별고사(면접/논술) 응시 여부 신중 검토 권고'
  if (text.includes('100%')) return '수능최저 100% 충족: 지원 대학 대학별고사 적극 응시 권장'
  if (text.includes('미충족') || text.includes('전멸')) return '수능최저 미충족: 정시 지원 가능선 점검 및 대안 전략 수립'
  return '수능최저 부분 충족: 통과된 대학 중심 대학별고사 전략적 응시'
})

const studentDecisionBadgeClass = computed(() => {
  if (!currentStudent.value) return 'bg-slate-200 text-slate-700'
  const text = currentStudent.value.overallDecisionText
  if (text.includes('정시비교')) return 'bg-amber-600 text-white'
  if (text.includes('100%')) return 'bg-emerald-600 text-white'
  return 'bg-indigo-600 text-white'
})

const studentDecisionBadge = computed(() => {
  if (!currentStudent.value) return '-'
  return currentStudent.value.overallDecisionText
})

const studentDecisionMessage = computed(() => {
  if (!currentStudent.value) return ''
  const text = currentStudent.value.overallDecisionText
  if (text.includes('정시비교')) {
    return '수능 가채점 성적이 우수하여 정시 지원 가능선과 수시 지원 대학의 수준을 비교해 볼 필요가 있습니다. 다만 면접·논술 결시는 해당 수시 기회를 포기하는 결정이며, 이미 전형이 종료된 교과·서류 전형은 합격 시 정시 지원이 불가하므로 정시 환산점수와 배치표를 충분히 대조한 뒤 신중하게 응시 여부를 결정할 것을 권고합니다.'
  }
  if (text.includes('100%')) {
    return '학생이 지원한 모든 수시 카드의 수능최저학력기준을 충족했습니다. 수시 합격을 목표로 대학별고사(면접·논술) 준비에 집중해 최종 합격을 노리는 것을 권장합니다.'
  }
  if (text.includes('미충족') || text.includes('전멸')) {
    return '수능최저학력기준이 설정된 수시 카드를 충족하지 못했습니다. 최저 미적용 전형 여부를 확인하고, 정시 지원 가능 대학 포트폴리오를 빠르게 점검하는 것을 권고합니다.'
  }
  return '지원한 수시 카드 중 일부 대학의 최저를 충족하였습니다. 아래 표를 확인하여 최저를 맞춘 대학의 대학별고사에 집중하고, 미달된 대학은 제외하여 효율적으로 준비하시기 바랍니다.'
})

function getGradeColor(grade) {
  const g = Number(grade)
  if (g === 1) return 'text-blue-600 font-black'
  if (g === 2) return 'text-indigo-600 font-bold'
  if (g === 3) return 'text-emerald-600 font-bold'
  if (g >= 4 && g <= 5) return 'text-amber-700 font-medium'
  return 'text-slate-400 font-normal'
}

function selectStudentAndGo(key) {
  classFilter.value = 'ALL'
  statusFilter.value = 'ALL'
  selectedStudentKey.value = key
  activeViewTab.value = 'individual'
  const target = document.getElementById('csat-analysis-section')
  if (target) {
    target.scrollIntoView({ behavior: 'smooth' })
  }
}

// 초기 선택 학생 바인딩
watch(csatStudents, (newList) => {
  if (newList.length > 0 && !selectedStudentKey.value) {
    selectedStudentKey.value = newList[0].studentKey
  }
}, { immediate: true })

onMounted(async () => {
  const yr = selectedAcademicYear.value || '2027'
  if (!mockExamRecords.value || mockExamRecords.value.length === 0) {
    await loadMockExamData(false, yr).catch(() => {})
  }
  // 수능 레코드가 아직 없으면 구글 시트에서 최신 가채점 탭 재동기화 시도
  if (csatStudents.value.length === 0) {
    await loadMockExamData(true, yr).catch(() => {})
  }
  if (csatStudents.value.length > 0 && !selectedStudentKey.value) {
    selectedStudentKey.value = csatStudents.value[0].studentKey
  }
})

// 학년도 변경 시 자동 동기화
watch(selectedAcademicYear, async (newYr) => {
  if (newYr) {
    await loadMockExamData(false, newYr).catch(() => {})
  }
})
</script>