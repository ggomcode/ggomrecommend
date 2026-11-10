<template>
  <div class="space-y-6">
    <!-- Action Bar (Hidden when printing) -->
    <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
      <div class="flex items-center gap-3">
        <!-- Report Type Toggle Buttons -->
        <div class="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
          <button
            type="button"
            @click="reportMode = 'result2026'"
            :class="[
              'px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer border-none',
              reportMode === 'result2026'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'bg-transparent text-slate-600 hover:text-slate-900'
            ]"
          >
            🏛️ 2026 대입 결과 종합 보고서
          </button>
          <button
            type="button"
            @click="reportMode = 'applicationOfficial'"
            :class="[
              'px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer border-none',
              reportMode === 'applicationOfficial'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'bg-transparent text-slate-600 hover:text-slate-900'
            ]"
          >
            📋 수시 지원 총괄 보고서
          </button>
        </div>
      </div>

      <div class="flex items-center space-x-2">
        <span class="text-xs text-slate-500 font-semibold hidden md:inline-flex items-center gap-1">
          <span>📄</span>
          <span>A4 세로 딱 1페이지 인쇄 규격</span>
        </span>
        <button 
          @click="printReportDoc()"
          class="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-600/30 transition-all cursor-pointer border-none"
        >
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          A4 1페이지 인쇄 / PDF 저장
        </button>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- MODE 1: 2026학년도 대입 입시 결과 분석 종합 보고서 (A4 세로 1페이지 완벽 수납) -->
    <!-- ========================================================================= -->
    <div 
      v-if="reportMode === 'result2026'" 
      class="report-page-a4 bg-white rounded-2xl border border-slate-300 shadow-lg mx-auto p-6 sm:p-8 text-slate-900 print:shadow-none print:border-none print:p-0 flex flex-col justify-between"
    >
      <!-- Title Header -->
      <div class="text-center pb-2 sm:pb-2.5 border-b-2 border-slate-900 shrink-0">
        <div class="text-[10px] text-slate-500 font-bold tracking-wider uppercase">{{ displaySchoolName }} 대입 분석 결과 자료</div>
        <h1 class="text-lg sm:text-xl font-black tracking-tight mt-0.5 text-slate-900">
          Ⅴ. 2026학년도 대학 입시 결과 분석 보고서
        </h1>
        <div class="text-[9.5px] text-slate-600 mt-1 flex items-center justify-center space-x-3">
          <span><strong>기준일:</strong> 2026. 02. 28 (최종 추가합격 및 등록 마감)</span>
          <span>•</span>
          <span><strong>대상:</strong> 2026학년도 대입 수시·정시 지원 졸업생 및 재학생</span>
        </div>
      </div>

      <!-- Part 1: 주요 4년제 대학 세부 합격 현황 -->
      <div class="mt-2.5 shrink-0">
        <h2 class="text-xs font-bold text-slate-900 mb-1 flex items-center">
          <span class="w-1.5 h-1.5 bg-slate-900 rounded-full mr-1.5"></span>
          1. 2026학년도 주요 4년제 대학 세부 합격 현황 (2026. 02. 28 기준)
        </h2>
        <table class="w-full border-collapse border border-slate-400 text-[10px]">
          <thead>
            <tr class="bg-slate-100 text-center font-bold text-slate-800">
              <th class="border border-slate-300 py-1 px-1.5">대학명</th>
              <th class="border border-slate-300 py-1 px-1.5">합격건수</th>
              <th class="border border-slate-300 py-1 px-1.5">대학명</th>
              <th class="border border-slate-300 py-1 px-1.5">합격건수</th>
              <th class="border border-slate-300 py-1 px-1.5">대학명</th>
              <th class="border border-slate-300 py-1 px-1.5">합격건수</th>
            </tr>
          </thead>
          <tbody class="text-center font-medium">
            <tr>
              <td class="border border-slate-300 py-0.5 px-1.5 font-bold text-rose-700 bg-rose-50/40">(의치한수약)</td>
              <td class="border border-slate-300 py-0.5 px-1.5 font-bold text-rose-700 font-mono">6건</td>
              <td class="border border-slate-300 py-0.5 px-1.5 font-bold text-blue-800">서울대</td>
              <td class="border border-slate-300 py-0.5 px-1.5 font-bold text-blue-800 font-mono">1건</td>
              <td class="border border-slate-300 py-0.5 px-1.5 font-bold text-blue-800">연세대</td>
              <td class="border border-slate-300 py-0.5 px-1.5 font-bold text-blue-800 font-mono">2건</td>
            </tr>
            <tr>
              <td class="border border-slate-300 py-0.5 px-1.5 font-bold text-blue-800">고려대</td>
              <td class="border border-slate-300 py-0.5 px-1.5 font-bold text-blue-800 font-mono">1건</td>
              <td class="border border-slate-300 py-0.5 px-1.5 font-bold text-blue-800">성균관대</td>
              <td class="border border-slate-300 py-0.5 px-1.5 font-bold text-blue-800 font-mono">1건</td>
              <td class="border border-slate-300 py-0.5 px-1.5 font-bold text-blue-800">서강대</td>
              <td class="border border-slate-300 py-0.5 px-1.5 font-bold text-blue-800 font-mono">2건</td>
            </tr>
            <tr>
              <td class="border border-slate-300 py-0.5 px-1.5 font-bold text-blue-800">한양대</td>
              <td class="border border-slate-300 py-0.5 px-1.5 font-bold text-blue-800 font-mono">2건</td>
              <td class="border border-slate-300 py-0.5 px-1.5 font-bold text-blue-800">이화여대</td>
              <td class="border border-slate-300 py-0.5 px-1.5 font-bold text-blue-800 font-mono">7건</td>
              <td class="border border-slate-300 py-0.5 px-1.5 font-semibold">중앙대</td>
              <td class="border border-slate-300 py-0.5 px-1.5 font-mono">4건</td>
            </tr>
            <tr>
              <td class="border border-slate-300 py-0.5 px-1.5 font-semibold">경희대</td>
              <td class="border border-slate-300 py-0.5 px-1.5 font-mono">4건</td>
              <td class="border border-slate-300 py-0.5 px-1.5 font-semibold">서울시립대</td>
              <td class="border border-slate-300 py-0.5 px-1.5 font-mono">5건</td>
              <td class="border border-slate-300 py-0.5 px-1.5 font-semibold">건국대</td>
              <td class="border border-slate-300 py-0.5 px-1.5 font-mono">1건</td>
            </tr>
            <tr>
              <td class="border border-slate-300 py-0.5 px-1.5 font-semibold">동국대</td>
              <td class="border border-slate-300 py-0.5 px-1.5 font-mono">3건</td>
              <td class="border border-slate-300 py-0.5 px-1.5 font-semibold">홍익대</td>
              <td class="border border-slate-300 py-0.5 px-1.5 font-mono">2건</td>
              <td class="border border-slate-300 py-0.5 px-1.5 font-semibold">숙명여대</td>
              <td class="border border-slate-300 py-0.5 px-1.5 font-mono">2건</td>
            </tr>
            <tr>
              <td class="border border-slate-300 py-0.5 px-1.5">국민대</td>
              <td class="border border-slate-300 py-0.5 px-1.5 font-mono">2건</td>
              <td class="border border-slate-300 py-0.5 px-1.5">숭실대</td>
              <td class="border border-slate-300 py-0.5 px-1.5 font-mono">1건</td>
              <td class="border border-slate-300 py-0.5 px-1.5">세종대</td>
              <td class="border border-slate-300 py-0.5 px-1.5 font-mono">3건</td>
            </tr>
            <tr>
              <td class="border border-slate-300 py-0.5 px-1.5">단국대(죽전)</td>
              <td class="border border-slate-300 py-0.5 px-1.5 font-bold font-mono text-indigo-700">9건</td>
              <td class="border border-slate-300 py-0.5 px-1.5">아주대</td>
              <td class="border border-slate-300 py-0.5 px-1.5 font-bold font-mono text-indigo-700">7건</td>
              <td class="border border-slate-300 py-0.5 px-1.5">한양대(ERICA)</td>
              <td class="border border-slate-300 py-0.5 px-1.5 font-mono">4건</td>
            </tr>
            <tr class="bg-slate-50 font-bold">
              <td class="border border-slate-300 py-0.5 px-1.5 text-indigo-800">DGIST / 에너지공대</td>
              <td class="border border-slate-300 py-0.5 px-1.5 font-mono text-indigo-800">2건</td>
              <td class="border border-slate-300 py-0.5 px-1.5 text-emerald-800">지거국 (본교)</td>
              <td class="border border-slate-300 py-0.5 px-1.5 font-mono text-emerald-800">11건</td>
              <td class="border border-slate-300 py-0.5 px-1.5 text-purple-800">교대</td>
              <td class="border border-slate-300 py-0.5 px-1.5 font-mono text-purple-800">5건</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Part 2: 과목별 내신 vs 수능 등급 비교 & 수능 응시 현황 -->
      <div class="mt-2.5 shrink-0">
        <h2 class="text-xs font-bold text-slate-900 mb-1 flex items-center">
          <span class="w-1.5 h-1.5 bg-slate-900 rounded-full mr-1.5"></span>
          2. 과목별 내신 vs 수능 등급 비교 & 수능 응시 현황
        </h2>
        <div class="grid grid-cols-2 gap-3 text-[10px]">
          <div class="border border-slate-300 p-2 rounded">
            <div class="font-bold border-b border-slate-200 pb-0.5 mb-1 text-blue-900">과목별 내신 vs 수능 등급 비교</div>
            <table class="w-full text-center">
              <tr class="bg-slate-50 font-semibold text-slate-700">
                <th class="p-0.5 border border-slate-200">영역</th>
                <th class="p-0.5 border border-slate-200">국어</th>
                <th class="p-0.5 border border-slate-200">수학</th>
                <th class="p-0.5 border border-slate-200">영어</th>
                <th class="p-0.5 border border-slate-200">사탐</th>
                <th class="p-0.5 border border-slate-200">과탐</th>
              </tr>
              <tr>
                <td class="p-0.5 border border-slate-200 font-bold text-blue-700">내신 평균</td>
                <td class="p-0.5 border border-slate-200 font-mono">4.20</td>
                <td class="p-0.5 border border-slate-200 font-mono">4.50</td>
                <td class="p-0.5 border border-slate-200 font-mono">4.80</td>
                <td class="p-0.5 border border-slate-200 font-mono">4.60</td>
                <td class="p-0.5 border border-slate-200 font-mono">4.40</td>
              </tr>
              <tr>
                <td class="p-0.5 border border-slate-200 font-bold text-amber-700">수능 평균</td>
                <td class="p-0.5 border border-slate-200 font-mono">6.10</td>
                <td class="p-0.5 border border-slate-200 font-mono">5.80</td>
                <td class="p-0.5 border border-slate-200 font-mono">4.94</td>
                <td class="p-0.5 border border-slate-200 font-mono">6.00</td>
                <td class="p-0.5 border border-slate-200 font-mono">6.30</td>
              </tr>
              <tr class="bg-rose-50/50 font-bold text-rose-700">
                <td class="p-0.5 border border-slate-200">수능 하락폭</td>
                <td class="p-0.5 border border-slate-200 font-mono">-1.90</td>
                <td class="p-0.5 border border-slate-200 font-mono">-1.30</td>
                <td class="p-0.5 border border-slate-200 font-mono">-0.14</td>
                <td class="p-0.5 border border-slate-200 font-mono">-1.40</td>
                <td class="p-0.5 border border-slate-200 font-mono">-1.90</td>
              </tr>
            </table>
          </div>

          <div class="border border-slate-300 p-2 rounded flex flex-col justify-between">
            <div>
              <div class="font-bold border-b border-slate-200 pb-0.5 mb-1 text-indigo-900">국어·수학·영어 세부 응시 현황</div>
              <ul class="space-y-0.5 text-slate-700 leading-tight">
                <li>• <strong>국어 (227명):</strong> 언매 36명(평균 5.28) / 화작 191명(평균 6.26)</li>
                <li>• <strong>수학 (214명):</strong> 미적분 69명(평균 4.71) / 확통 145명(평균 6.32)</li>
                <li>• <strong>영어 (221명):</strong> 절대평가 평균 4.94등급 (수능 최저 핵심 전략)</li>
              </ul>
            </div>
            <div class="p-1 bg-slate-50 border border-slate-200 rounded text-[9.5px] text-slate-600 mt-1">
              * 미적분 및 언매 응시자가 확통/화작 대비 1.0~1.6등급 우수하여 최저 충족 주력군 역할.
            </div>
          </div>
        </div>
      </div>

      <!-- Part 3: 사탐런 현황 (과탐 ➔ 사탐) -->
      <div class="mt-2.5 shrink-0">
        <h2 class="text-xs font-bold text-slate-900 mb-1 flex items-center">
          <span class="w-1.5 h-1.5 bg-slate-900 rounded-full mr-1.5"></span>
          3. 사탐런 (과탐 ➔ 사탐 전향 현황) 및 탐구 분석
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center text-[10px]">
          <table class="sm:col-span-2 border-collapse border border-slate-400 text-center">
            <thead>
              <tr class="bg-amber-50 text-amber-900 font-bold">
                <th class="border border-slate-300 py-1 px-1">구분</th>
                <th class="border border-slate-300 py-1 px-1">전체 전향</th>
                <th class="border border-slate-300 py-1 px-1">1과목 (과탐1+사탐1)</th>
                <th class="border border-slate-300 py-1 px-1">2과목 (사탐2)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-slate-300 py-1 px-1 font-bold bg-slate-50">전향 인원</td>
                <td class="border border-slate-300 py-1 px-1 font-bold text-amber-800 font-mono">{{ reportSatamStats.totalCount }}명 ({{ reportSatamStats.totalRate }}%)</td>
                <td class="border border-slate-300 py-1 px-1 font-mono">{{ reportSatamStats.run1Count }}명 ({{ reportSatamStats.run1Rate }}%)</td>
                <td class="border border-slate-300 py-1 px-1 font-mono">{{ reportSatamStats.run2Count }}명 ({{ reportSatamStats.run2Rate }}%)</td>
              </tr>
            </tbody>
          </table>
          <div class="text-[9.5px] text-slate-600 p-1.5 bg-slate-50 border border-slate-200 rounded leading-tight">
            자연계 {{ reportSatamStats.totalRate }}%가 사회탐구로 전환하였으며, 수능최저 방어 및 전략 과목 확보에 주효함.
          </div>
        </div>
      </div>

      <!-- Part 4: 2027학년도 대입 수시·정시 대비 5대 핵심 전략 지침 -->
      <div class="mt-2.5 shrink-0">
        <h2 class="text-xs font-bold text-slate-900 mb-1 flex items-center">
          <span class="w-1.5 h-1.5 bg-slate-900 rounded-full mr-1.5"></span>
          4. 2027학년도 대입 수시·정시 대비 5대 핵심 전략 지침
        </h2>
        <div class="grid grid-cols-2 gap-2 text-[9.5px] leading-relaxed">
          <div class="border border-slate-300 p-2 rounded bg-slate-50/50">
            <strong class="text-slate-900 block mb-0.5">① 학생부교과 전형 절대 유리</strong>
            우리 학교는 정량 내신 기반 교과 전형이 가장 안정적이며, 학종은 정량 컷 기준 0.5등급 내외 보완 지원.
          </div>
          <div class="border border-slate-300 p-2 rounded bg-slate-50/50">
            <strong class="text-slate-900 block mb-0.5">② 농어촌+기회균형 전형의 양면성</strong>
            상위권(1~2등급)은 농어촌 합격률 42.9%로 압도적이나, 중하위권은 몰림 현상 발생하므로 일반교과 병행 필수.
          </div>
          <div class="border border-slate-300 p-2 rounded bg-slate-50/50">
            <strong class="text-slate-900 block mb-0.5">③ 수능최저 충족 시 경쟁률 마법</strong>
            수능최저 충족 시 실질경쟁률이 {{ schoolMinScoreStats.avgRealRate }}:1로 급락, 충원까지 합산 시 합격률 대폭 상승.
          </div>
          <div class="border border-slate-300 p-2 rounded bg-slate-50/50">
            <strong class="text-slate-900 block mb-0.5">④ 수능은 '수시 최저'를 위한 무기</strong>
            정시 올인이 아닌 수시 최저 2합/3합 충족을 목표로 영어를 필두로 한 전략 과목 집중 대비.
          </div>
        </div>
        <div class="mt-1.5 border border-slate-300 p-1.5 rounded bg-amber-50/40 text-[9.5px] leading-tight text-amber-950">
          <strong>⑤ 수시 납치 방지선 엄수:</strong> 6월/9월 모평 기준 정시 가능 대학 라인을 명확히 긋고, 그 미만 대학은 수시에서 배제.
        </div>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- MODE 2: 수시 지원 총괄 보고서 (A4 세로 1페이지 완벽 수납) -->
    <!-- ========================================================================= -->
    <div 
      v-else 
      class="report-page-a4 bg-white rounded-2xl border border-slate-300 shadow-lg mx-auto p-6 sm:p-8 text-slate-900 print:shadow-none print:border-none print:p-0 flex flex-col justify-between"
    >
      <!-- Document Header -->
      <div class="text-center pb-2 sm:pb-2.5 border-b-2 border-slate-900 shrink-0">
        <div class="text-[10px] text-slate-500 font-bold tracking-wider uppercase">{{ displaySchoolName }} 공식 행정 보고</div>
        <h1 class="text-lg sm:text-xl font-black tracking-tight mt-0.5 text-slate-900">
          {{ reportAdmissionYear }}학년도 대입 수시모집 지원 통계 보고서
        </h1>
        <div class="text-[9.5px] text-slate-600 mt-1 flex items-center justify-center space-x-3">
          <span><strong>대상:</strong> 3학년 재학생 (총 {{ officialStats?.totalStudents != null ? officialStats.totalStudents + '명' : '-' }})</span>
          <span>•</span>
          <span><strong>기준일:</strong> {{ reportApplicationYear }}년 대교협 수시 접수 마감</span>
          <span>•</span>
          <span><strong>자료출처:</strong> 대교협 수시 원서접수 DB</span>
        </div>
      </div>

      <!-- Section 1: Summary Table -->
      <div class="mt-3 shrink-0">
        <h2 class="text-xs font-bold text-slate-900 mb-1 flex items-center">
          <span class="w-1.5 h-1.5 bg-slate-900 rounded-full mr-1.5"></span>
          1. 수시 지원 총괄 현황
        </h2>
        <table class="w-full border-collapse border border-slate-400 text-[10.5px]">
          <thead>
            <tr class="bg-slate-100 text-center font-bold text-slate-800">
              <th class="border border-slate-300 py-1 px-1.5">재학생 총원</th>
              <th class="border border-slate-300 py-1 px-1.5">수시 접수자</th>
              <th class="border border-slate-300 py-1 px-1.5">접수 비율</th>
              <th class="border border-slate-300 py-1 px-1.5">총 지원 건수</th>
              <th class="border border-slate-300 py-1 px-1.5">1인당 평균</th>
              <th class="border border-slate-300 py-1 px-1.5">학교장추천 지원</th>
              <th class="border border-slate-300 py-1 px-1.5">농어촌 지원</th>
            </tr>
          </thead>
          <tbody class="text-center font-medium">
            <tr>
              <td class="border border-slate-300 py-1 px-1.5 font-bold">{{ officialStats?.totalStudents != null ? officialStats.totalStudents + '명' : '-' }}</td>
              <td class="border border-slate-300 py-1 px-1.5 font-bold text-indigo-700">{{ officialStats?.applicantStudents != null ? officialStats.applicantStudents + '명' : '-' }}</td>
              <td class="border border-slate-300 py-1 px-1.5 font-bold text-indigo-700">{{ officialStats?.applicantRate != null ? officialStats.applicantRate + '%' : '-' }}</td>
              <td class="border border-slate-300 py-1 px-1.5 font-bold text-sky-700">{{ officialStats?.totalApplications != null ? officialStats.totalApplications.toLocaleString() + '건' : '-' }}</td>
              <td class="border border-slate-300 py-1 px-1.5 font-bold">{{ officialStats?.avgApplicationsPerStudent != null ? officialStats.avgApplicationsPerStudent + '건' : '-' }}</td>
              <td class="border border-slate-300 py-1 px-1.5">
                <template v-if="officialStats?.recommendation?.applications != null">
                  <strong>{{ officialStats.recommendation.applications }}건</strong>
                  <span class="text-[9px] text-slate-500 block">({{ officialStats.recommendation.students }}명 / {{ officialStats.recommendation.studentRate }}%)</span>
                </template>
                <template v-else>-</template>
              </td>
              <td class="border border-slate-300 py-1 px-1.5">
                <template v-if="officialStats?.rural?.applications != null">
                  <strong>{{ officialStats.rural.applications }}건</strong>
                  <span class="text-[9px] text-slate-500 block">({{ officialStats.rural.applicantStudents }}명 / {{ officialStats.rural.applicantRate }}%)</span>
                </template>
                <template v-else>-</template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Section 2: Regional Distribution Table -->
      <div class="mt-3 shrink-0">
        <h2 class="text-xs font-bold text-slate-900 mb-1 flex items-center">
          <span class="w-1.5 h-1.5 bg-slate-900 rounded-full mr-1.5"></span>
          2. 지역별 수시 지원 분포 (수도권 vs 비수도권)
        </h2>
        <div class="grid grid-cols-2 gap-3 mb-1.5 text-[10px]">
          <div class="p-1.5 bg-slate-50 border border-slate-300 rounded text-center">
            수도권 (서울/경기/인천): <strong class="text-indigo-800">{{ officialStats?.metroBreakdown?.metro?.count != null ? officialStats.metroBreakdown.metro.count + '건' : '-' }}</strong> ({{ officialStats?.metroBreakdown?.metro?.rate != null ? officialStats.metroBreakdown.metro.rate + '%' : '-' }})
          </div>
          <div class="p-1.5 bg-slate-50 border border-slate-300 rounded text-center">
            비수도권 지역: <strong class="text-slate-800">{{ officialStats?.metroBreakdown?.nonMetro?.count != null ? officialStats.metroBreakdown.nonMetro.count + '건' : '-' }}</strong> ({{ officialStats?.metroBreakdown?.nonMetro?.rate != null ? officialStats.metroBreakdown.nonMetro.rate + '%' : '-' }})
          </div>
        </div>

        <table class="w-full border-collapse border border-slate-400 text-[10px]">
          <thead>
            <tr class="bg-slate-100 text-center font-bold text-slate-800">
              <th v-for="r in (officialStats?.regionalBreakdown || []).slice(0, 9)" :key="r.region" class="border border-slate-300 py-0.5 px-1">
                {{ r.region }}
              </th>
            </tr>
          </thead>
          <tbody class="text-center font-medium">
            <tr>
              <td v-for="r in (officialStats?.regionalBreakdown || []).slice(0, 9)" :key="r.region" class="border border-slate-300 py-0.5 px-1 font-bold">
                {{ r.count }}건
                <span class="text-[9px] text-slate-500 font-normal block">({{ r.rate }}%)</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Section 3: Class Breakdown -->
      <div class="mt-3 shrink-0">
        <h2 class="text-xs font-bold text-slate-900 mb-1 flex items-center">
          <span class="w-1.5 h-1.5 bg-slate-900 rounded-full mr-1.5"></span>
          3. 학급별(1반~11반) 수시 지원 현황
        </h2>
        <table class="w-full border-collapse border border-slate-400 text-[9.5px] text-center">
          <thead>
            <tr class="bg-slate-100 font-bold text-slate-800">
              <th class="border border-slate-300 py-0.5 px-1 bg-slate-200">구분</th>
              <th v-for="c in 11" :key="c" class="border border-slate-300 py-0.5 px-1">{{ c }}반</th>
              <th v-if="hasGraduates" class="border border-slate-300 py-0.5 px-1 bg-amber-50 text-amber-900">졸업생</th>
              <th class="border border-slate-300 py-0.5 px-1 bg-slate-200">합계</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-slate-300 py-0.5 px-1 font-bold bg-slate-50">지원건수</td>
              <td v-for="c in 11" :key="c" class="border border-slate-300 py-0.5 px-1 font-mono">
                {{ getClassCount(c) }}
              </td>
              <td v-if="hasGraduates" class="border border-slate-300 py-0.5 px-1 font-bold text-amber-900 font-mono">
                {{ getGraduateCount() }}
              </td>
              <td class="border border-slate-300 py-0.5 px-1 font-bold bg-slate-100 font-mono">{{ applications.length }}</td>
            </tr>
            <tr>
              <td class="border border-slate-300 py-0.5 px-1 font-bold bg-slate-50">지원학생</td>
              <td v-for="c in 11" :key="c" class="border border-slate-300 py-0.5 px-1 text-slate-600 font-mono">
                {{ getClassStudents(c) }}
              </td>
              <td v-if="hasGraduates" class="border border-slate-300 py-0.5 px-1 font-bold text-amber-900 font-mono">
                {{ getGraduateStudents() }}
              </td>
              <td class="border border-slate-300 py-0.5 px-1 font-bold bg-slate-100 font-mono">{{ totalUniqueStudents }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Section 4: Key Targets & Notable Universities -->
      <div class="mt-3 shrink-0">
        <h2 class="text-xs font-bold text-slate-900 mb-1 flex items-center">
          <span class="w-1.5 h-1.5 bg-slate-900 rounded-full mr-1.5"></span>
          4. 최다 출원 상위 대학 및 주요 대학군 지원 현황
        </h2>
        <div class="grid grid-cols-2 gap-3 text-[10px]">
          <!-- Top Applied -->
          <div class="border border-slate-300 p-2 rounded">
            <div class="font-bold border-b border-slate-200 pb-0.5 mb-1 text-indigo-900">최다 출원 대학 TOP 10</div>
            <div class="grid grid-cols-2 gap-x-2 gap-y-0.5 text-slate-700">
              <div v-for="item in topAppliedUnivs" :key="item.rank">
                {{ item.rank }}. {{ item.name }}: <strong>{{ item.count }}건</strong>
              </div>
              <div v-if="topAppliedUnivs.length === 0" class="col-span-2 text-slate-400">
                출원 데이터 없음
              </div>
            </div>
          </div>

          <!-- Special Target Groups -->
          <div class="border border-slate-300 p-2 rounded flex flex-col justify-between">
            <div>
              <div class="font-bold border-b border-slate-200 pb-0.5 mb-1 text-indigo-900">주요대 및 과기원 지원 현황</div>
              <ul class="space-y-0.5 text-slate-700 leading-tight">
                <li>• <strong>설포연고서성한이 & 과기원:</strong> 총 <strong class="text-indigo-700">{{ targetGroupStats.topTierCount }}건</strong> 출원</li>
                <li>• <strong>메디컬 계열:</strong> {{ targetGroupStats.medicalDesc }} (<strong class="text-indigo-700">{{ targetGroupStats.medicalCount }}건</strong>)</li>
                <li>• <strong>거점 국립대학교:</strong> 총 <strong class="text-indigo-700">{{ targetGroupStats.nationalCount }}건</strong> 출원</li>
                <li>• <strong>학교장추천 전형:</strong> {{ targetGroupStats.recStudents }}명 지원 ({{ targetGroupStats.recCount }}건)</li>
              </ul>
            </div>
            <div class="p-1 bg-slate-50 border border-slate-200 rounded text-[9px] text-slate-500 mt-1">
              * 세부 학생별 합격자 통계는 1단계 및 최종 발표 이후 업데이트됩니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStatData } from '../../composables/useStatData'
import { schoolName } from '../../../utils/schoolConfig'
import { calculateSatamRunStats } from '../../utils/satamRunCalculator'

const { officialStats, applications, selectedAcademicYear, schoolMinScoreStats, mockExamRecords } = useStatData()

// 사탐런 실측 통계 (모의고사 원자료 기준, 없을 시 베이스라인)
const reportSatamStats = computed(() => {
  if (mockExamRecords.value && mockExamRecords.value.length > 0) {
    try {
      const stats = calculateSatamRunStats(mockExamRecords.value, applications.value)
      if (stats && stats.naturalCohortCount > 0) {
        return {
          totalCount: stats.totalRunCount,
          totalRate: stats.totalRunRate,
          run1Count: stats.run1Count,
          run1Rate: stats.run1Rate,
          run2Count: stats.run2Count,
          run2Rate: stats.run2Rate,
          cohortCount: stats.naturalCohortCount
        }
      }
    } catch (e) {}
  }
  return {
    totalCount: 56,
    totalRate: '48.7',
    run1Count: 30,
    run1Rate: '26.1',
    run2Count: 26,
    run2Rate: '22.6',
    cohortCount: 115
  }
})

// 동적 최다 출원 대학 TOP 10
const topAppliedUnivs = computed(() => {
  const map = {}
  applications.value.forEach(app => {
    const u = app.univName ? app.univName.trim() : ''
    if (u) {
      map[u] = (map[u] || 0) + 1
    }
  })
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count], index) => ({ rank: index + 1, name, count }))
})

// 동적 주요 대학군 및 특별 전형 지원 현황
const targetGroupStats = computed(() => {
  const apps = applications.value || []
  const topTierKeywords = ['서울대', '연세대', '고려대', '서강대', '성균관대', '한양대', '이화여대', 'KAIST', '포항공대', 'POSTECH', 'GIST', 'DGIST', 'UNIST', '한국에너지공과대']
  const nationalKeywords = ['강원대', '경북대', '경상국립대', '부산대', '전남대', '전북대', '제주대', '충남대', '충북대']
  
  const topTierCount = apps.filter(a => topTierKeywords.some(k => a.univName?.includes(k))).length
  const medicalApps = apps.filter(a => /의예|치의|한의|수의|약학/.test(a.dept || ''))
  const nationalCount = apps.filter(a => nationalKeywords.some(k => a.univName?.includes(k))).length
  const recApps = apps.filter(a => a.isRecommendation)
  const recStudents = new Set(recApps.map(a => a.studentKey)).size

  let medicalDesc = '지원 내역 없음'
  if (medicalApps.length > 0) {
    const first = medicalApps[0]
    medicalDesc = `${first.univName} ${first.dept}${medicalApps.length > 1 ? ` 외 ${medicalApps.length - 1}건` : ''}`
  }

  return {
    topTierCount,
    medicalCount: medicalApps.length,
    medicalDesc,
    nationalCount,
    recCount: recApps.length,
    recStudents
  }
})
const window = globalThis.window

const displaySchoolName = computed(() => {
  return (schoolName.value && schoolName.value !== '우리학교') ? schoolName.value : '포곡고등학교'
})

// 오늘 날짜 기준 대입 학년도 계산 규칙
const reportAdmissionYear = computed(() => {
  const today = new Date()
  const y = today.getFullYear()
  const m = today.getMonth() + 1
  const calc = m >= 2 ? y + 1 : y
  return String(Math.max(calc, 2027))
})

// 대입 수시 원서접수 연도
const reportApplicationYear = computed(() => {
  return String(Number(reportAdmissionYear.value) - 1)
})

const reportMode = ref('result2026') // 기본: 2026 대입 결과 종합 보고서

const hasGraduates = computed(() => {
  return applications.value.some(a => a.isGraduate || a.classNum === '졸업생')
})

const getGraduateCount = () => {
  return applications.value.filter(a => a.isGraduate || a.classNum === '졸업생').length
}

const getGraduateStudents = () => {
  const set = new Set(applications.value.filter(a => a.isGraduate || a.classNum === '졸업생').map(a => a.studentKey))
  return set.size
}

const totalUniqueStudents = computed(() => {
  const set = new Set(applications.value.map(a => a.studentKey))
  return set.size
})

const getClassCount = (classNum) => {
  return applications.value.filter(a => a.classNum === classNum).length
}

const getClassStudents = (classNum) => {
  const set = new Set(applications.value.filter(a => a.classNum === classNum).map(a => a.studentKey))
  return set.size
}

// A4 세로 1페이지 인쇄 전용 샌드박스 엔진
function printReportDoc() {
  const reportEl = document.querySelector('.report-page-a4')
  if (!reportEl) {
    window.print()
    return
  }

  let iframe = document.getElementById('report-print-iframe')
  if (!iframe) {
    iframe = document.createElement('iframe')
    iframe.id = 'report-print-iframe'
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    iframe.style.visibility = 'hidden'
    document.body.appendChild(iframe)
  }

  const doc = iframe.contentWindow.document
  doc.open()

  // 현재 문서의 모든 link rel="stylesheet" 및 style 태그 복사
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map(el => el.outerHTML)
    .join('\n')

  const title = reportMode.value === 'result2026'
    ? '2026학년도 대학 입시 결과 분석 보고서'
    : `${reportAdmissionYear.value}학년도 대입 수시모집 지원 통계 보고서`

  doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  ${styles}
  <style>
    @page {
      size: A4 portrait !important;
      margin: 8mm 10mm !important;
    }
    *, *::before, *::after {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      background: #ffffff !important;
      color: #0f172a !important;
      overflow: visible !important;
    }
    .report-page-a4 {
      width: 190mm !important;
      max-width: 190mm !important;
      height: 279mm !important;
      max-height: 279mm !important;
      min-height: 279mm !important;
      margin: 0 auto !important;
      padding: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      border: none !important;
      box-shadow: none !important;
      background: #ffffff !important;
      overflow: hidden !important;
      page-break-after: avoid !important;
      page-break-inside: avoid !important;
      break-after: avoid !important;
      break-inside: avoid !important;
    }
    table {
      page-break-inside: avoid !important;
    }
  </style>
</head>
<body style="background: #ffffff !important; margin: 0 !important; padding: 0 !important;">
  <div style="width: 190mm; margin: 0 auto;">
    ${reportEl.outerHTML}
  </div>
</body>
</html>`)
  doc.close()

  setTimeout(() => {
    iframe.contentWindow.focus()
    iframe.contentWindow.print()
  }, 250)
}
</script>

<style>
/* 전역 A4 세로 인쇄 강제 규칙 (Ctrl+P 직접 인쇄 대응) */
@media print {
  @page {
    size: A4 portrait !important;
    margin: 8mm 10mm !important;
  }
}
</style>

<style scoped>
/* 화면 미리보기 (A4 세로 비율 유지) */
.report-page-a4 {
  width: 100%;
  max-width: 210mm;
  min-height: 297mm;
  box-sizing: border-box;
}

/* A4 세로 딱 1페이지 엄격 인쇄 규칙 */
@media print {
  @page {
    size: A4 portrait;
    margin: 8mm 10mm;
  }

  :global(body),
  :global(html) {
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .no-print {
    display: none !important;
  }

  .report-page-a4 {
    width: 100% !important;
    max-width: 190mm !important;
    height: 279mm !important;
    max-height: 279mm !important;
    min-height: 0 !important;
    overflow: hidden !important;
    page-break-after: avoid !important;
    page-break-inside: avoid !important;
    break-after: avoid !important;
    break-inside: avoid !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 auto !important;
  }

  table {
    page-break-inside: avoid !important;
  }
}
</style>
