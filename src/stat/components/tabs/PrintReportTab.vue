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
        <button 
          @click="window.print()"
          class="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          이 양식 그대로 인쇄 / PDF 저장
        </button>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- MODE 1: 2026학년도 대입 입시 결과 분석 종합 보고서 (종이 보고서 1~6p 완전 복원) -->
    <!-- ========================================================================= -->
    <div v-if="reportMode === 'result2026'" class="bg-white rounded-2xl border border-slate-300 shadow-lg max-w-4xl mx-auto p-8 sm:p-12 text-slate-900 print:shadow-none print:border-none print:p-0">
      <!-- Title -->
      <div class="text-center pb-6 border-b-2 border-slate-900">
        <div class="text-xs text-slate-500 font-semibold tracking-wider">{{ displaySchoolName }} 대입 분석 결과 자료</div>
        <h1 class="text-2xl sm:text-3xl font-black tracking-tight mt-1 text-slate-900">
          Ⅴ. 2026학년도 대학 입시 결과 분석 보고서
        </h1>
        <div class="text-xs text-slate-600 mt-2 flex items-center justify-center space-x-4">
          <span><strong>기준일:</strong> 2026. 02. 28 기준 (최종 추가합격 및 등록 마감)</span>
          <span>•</span>
          <span><strong>대상:</strong> 2026학년도 대입 수시·정시 지원 졸업생 및 재학생</span>
        </div>
      </div>

      <!-- Part 1: 주요 4년제 대학 세부 합격 현황 -->
      <div class="mt-8">
        <h2 class="text-sm font-bold text-slate-900 mb-2 flex items-center">
          <span class="w-2 h-2 bg-slate-900 rounded-full mr-2"></span>
          1. 2026학년도 주요 4년제 대학 세부 합격 현황 (2026. 02. 28 기준)
        </h2>
        <table class="w-full border-collapse border border-slate-400 text-xs">
          <thead>
            <tr class="bg-slate-100 text-center font-bold text-slate-800">
              <th class="border border-slate-300 p-2">대학명</th>
              <th class="border border-slate-300 p-2">합격건수</th>
              <th class="border border-slate-300 p-2">대학명</th>
              <th class="border border-slate-300 p-2">합격건수</th>
              <th class="border border-slate-300 p-2">대학명</th>
              <th class="border border-slate-300 p-2">합격건수</th>
            </tr>
          </thead>
          <tbody class="text-center font-medium">
            <tr>
              <td class="border border-slate-300 p-2 font-bold text-rose-700 bg-rose-50/30">(의치한수약)</td>
              <td class="border border-slate-300 p-2 font-bold text-rose-700 font-mono">6건</td>
              <td class="border border-slate-300 p-2 font-bold text-blue-800">서울대</td>
              <td class="border border-slate-300 p-2 font-bold text-blue-800 font-mono">1건</td>
              <td class="border border-slate-300 p-2 font-bold text-blue-800">연세대</td>
              <td class="border border-slate-300 p-2 font-bold text-blue-800 font-mono">2건</td>
            </tr>
            <tr>
              <td class="border border-slate-300 p-2 font-bold text-blue-800">고려대</td>
              <td class="border border-slate-300 p-2 font-bold text-blue-800 font-mono">1건</td>
              <td class="border border-slate-300 p-2 font-bold text-blue-800">성균관대</td>
              <td class="border border-slate-300 p-2 font-bold text-blue-800 font-mono">1건</td>
              <td class="border border-slate-300 p-2 font-bold text-blue-800">서강대</td>
              <td class="border border-slate-300 p-2 font-bold text-blue-800 font-mono">2건</td>
            </tr>
            <tr>
              <td class="border border-slate-300 p-2 font-bold text-blue-800">한양대</td>
              <td class="border border-slate-300 p-2 font-bold text-blue-800 font-mono">2건</td>
              <td class="border border-slate-300 p-2 font-bold text-blue-800">이화여대</td>
              <td class="border border-slate-300 p-2 font-bold text-blue-800 font-mono">7건</td>
              <td class="border border-slate-300 p-2 font-semibold">중앙대</td>
              <td class="border border-slate-300 p-2 font-mono">4건</td>
            </tr>
            <tr>
              <td class="border border-slate-300 p-2 font-semibold">경희대</td>
              <td class="border border-slate-300 p-2 font-mono">4건</td>
              <td class="border border-slate-300 p-2 font-semibold">서울시립대</td>
              <td class="border border-slate-300 p-2 font-mono">5건</td>
              <td class="border border-slate-300 p-2 font-semibold">건국대</td>
              <td class="border border-slate-300 p-2 font-mono">1건</td>
            </tr>
            <tr>
              <td class="border border-slate-300 p-2 font-semibold">동국대</td>
              <td class="border border-slate-300 p-2 font-mono">3건</td>
              <td class="border border-slate-300 p-2 font-semibold">홍익대</td>
              <td class="border border-slate-300 p-2 font-mono">2건</td>
              <td class="border border-slate-300 p-2 font-semibold">숙명여대</td>
              <td class="border border-slate-300 p-2 font-mono">2건</td>
            </tr>
            <tr>
              <td class="border border-slate-300 p-2">국민대</td>
              <td class="border border-slate-300 p-2 font-mono">2건</td>
              <td class="border border-slate-300 p-2">숭실대</td>
              <td class="border border-slate-300 p-2 font-mono">1건</td>
              <td class="border border-slate-300 p-2">세종대</td>
              <td class="border border-slate-300 p-2 font-mono">3건</td>
            </tr>
            <tr>
              <td class="border border-slate-300 p-2">단국대(죽전)</td>
              <td class="border border-slate-300 p-2 font-bold font-mono text-indigo-700">9건</td>
              <td class="border border-slate-300 p-2">아주대</td>
              <td class="border border-slate-300 p-2 font-bold font-mono text-indigo-700">7건</td>
              <td class="border border-slate-300 p-2">가천대</td>
              <td class="border border-slate-300 p-2 font-mono">1건</td>
            </tr>
            <tr>
              <td class="border border-slate-300 p-2">인하대</td>
              <td class="border border-slate-300 p-2 font-mono">2건</td>
              <td class="border border-slate-300 p-2">한양대(ERICA)</td>
              <td class="border border-slate-300 p-2 font-mono">4건</td>
              <td class="border border-slate-300 p-2">광운대</td>
              <td class="border border-slate-300 p-2 font-mono">4건</td>
            </tr>
            <tr class="bg-slate-50 font-bold">
              <td class="border border-slate-300 p-2 text-indigo-800">DGIST / 에너지공대</td>
              <td class="border border-slate-300 p-2 font-mono text-indigo-800">2건</td>
              <td class="border border-slate-300 p-2 text-emerald-800">지거국 (본교)</td>
              <td class="border border-slate-300 p-2 font-mono text-emerald-800">11건</td>
              <td class="border border-slate-300 p-2 text-purple-800">교대</td>
              <td class="border border-slate-300 p-2 font-mono text-purple-800">5건</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Part 2: 내신 vs 수능 오망성 괴리도 & 영역별 수능 결과 -->
      <div class="mt-8">
        <h2 class="text-sm font-bold text-slate-900 mb-2 flex items-center">
          <span class="w-2 h-2 bg-slate-900 rounded-full mr-2"></span>
          2. 내신 vs 수능 과목별 괴리도 & 수능 응시 현황
        </h2>
        <div class="grid grid-cols-2 gap-4 text-xs mb-3">
          <div class="border border-slate-300 p-3 rounded">
            <div class="font-bold border-b border-slate-200 pb-1 mb-2 text-blue-900">내신 vs 수능 등급 비교 (괴리도)</div>
            <table class="w-full text-center">
              <tr class="bg-slate-50 font-semibold text-slate-700">
                <th class="p-1 border border-slate-200">영역</th>
                <th class="p-1 border border-slate-200">국어</th>
                <th class="p-1 border border-slate-200">수학</th>
                <th class="p-1 border border-slate-200">영어</th>
                <th class="p-1 border border-slate-200">사탐</th>
                <th class="p-1 border border-slate-200">과탐</th>
              </tr>
              <tr>
                <td class="p-1 border border-slate-200 font-bold text-blue-700">내신 평균</td>
                <td class="p-1 border border-slate-200 font-mono">4.20</td>
                <td class="p-1 border border-slate-200 font-mono">4.50</td>
                <td class="p-1 border border-slate-200 font-mono">4.80</td>
                <td class="p-1 border border-slate-200 font-mono">4.60</td>
                <td class="p-1 border border-slate-200 font-mono">4.40</td>
              </tr>
              <tr>
                <td class="p-1 border border-slate-200 font-bold text-amber-700">수능 평균</td>
                <td class="p-1 border border-slate-200 font-mono">6.10</td>
                <td class="p-1 border border-slate-200 font-mono">5.80</td>
                <td class="p-1 border border-slate-200 font-mono">4.94</td>
                <td class="p-1 border border-slate-200 font-mono">6.00</td>
                <td class="p-1 border border-slate-200 font-mono">6.30</td>
              </tr>
              <tr class="bg-rose-50/50 font-bold text-rose-700">
                <td class="p-1 border border-slate-200">수능 하락폭</td>
                <td class="p-1 border border-slate-200 font-mono">-1.90</td>
                <td class="p-1 border border-slate-200 font-mono">-1.30</td>
                <td class="p-1 border border-slate-200 font-mono">-0.14</td>
                <td class="p-1 border border-slate-200 font-mono">-1.40</td>
                <td class="p-1 border border-slate-200 font-mono">-1.90</td>
              </tr>
            </table>
          </div>

          <div class="border border-slate-300 p-3 rounded flex flex-col justify-between">
            <div>
              <div class="font-bold border-b border-slate-200 pb-1 mb-2 text-indigo-900">국어·수학·영어 수능 세부 응시 현황</div>
              <ul class="space-y-1 text-slate-700 leading-normal">
                <li>• <strong>국어 (227명 응시):</strong> 언어와 매체 36명(평균 5.28) / 화법과 작문 191명(평균 6.26)</li>
                <li>• <strong>수학 (214명 응시):</strong> 미적분 69명(평균 4.71) / 확률과 통계 145명(평균 6.32)</li>
                <li>• <strong>영어 (221명 응시):</strong> 절대평가 평균 4.94등급 (수능 최저의 핵심 전략 영역)</li>
              </ul>
            </div>
            <div class="p-2 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600 mt-2">
              * 미적분 및 언매 응시자가 확통/화작 대비 1.0~1.6등급 우수하여 수능 최저 충족의 주력군 역할을 수행함.
            </div>
          </div>
        </div>
      </div>

      <!-- Part 3: 사탐런 현황 (과탐 ➔ 사탐) -->
      <div class="mt-8">
        <h2 class="text-sm font-bold text-slate-900 mb-2 flex items-center">
          <span class="w-2 h-2 bg-slate-900 rounded-full mr-2"></span>
          3. 사탐런 (과탐 ➔ 사탐 전향 현황) 및 탐구 분석
        </h2>
        <table class="w-full border-collapse border border-slate-400 text-xs text-center mb-3">
          <thead>
            <tr class="bg-amber-50 text-amber-900 font-bold">
              <th class="border border-slate-300 p-2">구분</th>
              <th class="border border-slate-300 p-2">전체 전향 학생수</th>
              <th class="border border-slate-300 p-2">1과목 전향 (과탐1 + 사탐1)</th>
              <th class="border border-slate-300 p-2">2과목 전향 (사탐2)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-slate-300 p-2 font-bold bg-slate-50">전향 인원 (비율)</td>
              <td class="border border-slate-300 p-2 font-bold text-amber-800 font-mono">56명 (48.7%)</td>
              <td class="border border-slate-300 p-2 font-mono">30명 (26.1%)</td>
              <td class="border border-slate-300 p-2 font-mono">26명 (22.6%)</td>
            </tr>
          </tbody>
        </table>
        <div class="text-[11px] text-slate-600 p-2.5 bg-slate-50 border border-slate-200 rounded leading-relaxed">
          자연계열 학생의 48.7%가 사회탐구로 과목을 전환하였으며, <strong>사회·문화(127명, 5.94등급)</strong>와 <strong>생활과 윤리(111명, 6.00등급)</strong>에 응시자가 집중되었습니다. 과탐(생명과학Ⅰ 35명, 지구과학Ⅰ 17명 등)에 비해 수능 최저학력기준 등급을 방어하는 데 매우 효과적인 전략으로 확인되었습니다.
        </div>
      </div>

      <!-- Part 4: 2027학년도 대입 5대 핵심 전략 지침 -->
      <div class="mt-8">
        <h2 class="text-sm font-bold text-slate-900 mb-2 flex items-center">
          <span class="w-2 h-2 bg-slate-900 rounded-full mr-2"></span>
          4. 2027학년도 대입 수시·정시 대비 5대 핵심 전략
        </h2>
        <div class="space-y-2 text-xs">
          <div class="border border-slate-300 p-3 rounded bg-slate-50/50">
            <div class="font-bold text-slate-900 mb-1">1. 우리 학교는 등급에 관계없이 학생부교과 전형이 유리합니다.</div>
            <p class="text-slate-600 m-0 leading-relaxed">
              - 1.0~1.9등급(서울권), 2.0~2.9등급(서울 하위권 & 지거국 본교 & 수도권 주요대), 3.0~3.9등급(수도권 & 지방 중위권).<br />
              - 가장 중요한 것이 정량 내신이며, 학생부 관리를 통해 종합 전형으로 0.5등급 내외 보완 합격이 가능합니다.
            </p>
          </div>

          <div class="border border-slate-300 p-3 rounded bg-slate-50/50">
            <div class="font-bold text-slate-900 mb-1">2. 농어촌+기회균형 전형의 양면성 (상위권 유리, 중하위권 치열)</div>
            <p class="text-slate-600 m-0 leading-relaxed">
              - 상위권(1~2등급대) 학생은 농어촌 전형 합격률이 42.9%로 일반전형(13.6%) 대비 3배 이상 폭증합니다.<br />
              - 중하위권은 농어촌 몰림 현상으로 컷이 역전될 수 있으므로 일반 정량 교과 전형과 반드시 병행 지원해야 합니다.
            </p>
          </div>

          <div class="border border-slate-300 p-3 rounded bg-slate-50/50">
            <div class="font-bold text-slate-900 mb-1">3. 수능 최저를 맞추는 순간 실질경쟁률이 6:1에서 2:1로 떨어지는 마법</div>
            <p class="text-slate-600 m-0 leading-relaxed">
              - 수능 최저를 충족하는 학생의 비율이 약 30%에 불과하므로, 최저만 맞추면 경쟁률이 1/3로 급락합니다. 충원합격까지 감안하면 사실상 전원 합격권에 도달합니다.
            </p>
          </div>

          <div class="border border-slate-300 p-3 rounded bg-slate-50/50">
            <div class="font-bold text-slate-900 mb-1">4. 수능은 정시를 위한 전략이 아니라, 수시 최저를 위한 핵심 무기</div>
            <p class="text-slate-600 m-0 leading-relaxed">
              - 재학생의 정시 파이터 합격 확률은 극히 낮습니다. 수능은 정시 올인이 아니라 수시 최저 2합/3합 충족을 목표로 영어를 필두로 집중 대비해야 합니다.
            </p>
          </div>

          <div class="border border-slate-300 p-3 rounded bg-slate-50/50">
            <div class="font-bold text-slate-900 mb-1">5. 그래도 정시를 쓰고 싶다면, 수시 접수 전 정시 가능 대학 라인을 확정할 것</div>
            <p class="text-slate-600 m-0 leading-relaxed">
              - 6월/9월 모의평가 기준으로 정시로 갈 수 있는 대학 라인을 냉정히 선을 긋고, 그보다 아래인 대학은 수시에서 쓰지 않는 '수시 납치 방지선'을 엄수해야 합니다.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- MODE 2: 수시 지원 총괄 보고서 (기존 행정 결재 양식) -->
    <!-- ========================================================================= -->
    <div v-else class="bg-white rounded-2xl border border-slate-300 shadow-lg max-w-4xl mx-auto p-8 sm:p-12 text-slate-900 print:shadow-none print:border-none print:p-0 print-break-inside-avoid">
      <!-- Document Header -->
      <div class="text-center pb-6 border-b-2 border-slate-900">
        <div class="text-xs text-slate-500 font-semibold tracking-wider">{{ displaySchoolName }}</div>
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-slate-900">
          {{ reportAdmissionYear }}학년도 대입 수시모집 지원 통계 보고서
        </h1>
        <div class="text-xs text-slate-600 mt-2 flex items-center justify-center space-x-4">
          <span><strong>대상:</strong> 3학년 재학생 (총 {{ officialStats?.totalStudents != null ? officialStats.totalStudents + '명' : '-' }})</span>
          <span>•</span>
          <span><strong>기준일:</strong> {{ reportApplicationYear }}년 대교협 수시 원서접수 마감</span>
          <span>•</span>
          <span><strong>자료출처:</strong> 대교협 수시 원서접수 데이터베이스</span>
        </div>
      </div>

      <!-- Section 1: Summary Table -->
      <div class="mt-8">
        <h2 class="text-sm font-bold text-slate-900 mb-2 flex items-center">
          <span class="w-2 h-2 bg-slate-900 rounded-full mr-2"></span>
          1. 수시 지원 총괄 현황
        </h2>
        <table class="w-full border-collapse border border-slate-400 text-xs">
          <thead>
            <tr class="bg-slate-100 text-center font-bold text-slate-800">
              <th class="border border-slate-300 p-2">재학생 총원</th>
              <th class="border border-slate-300 p-2">수시 접수자</th>
              <th class="border border-slate-300 p-2">접수 비율</th>
              <th class="border border-slate-300 p-2">총 지원 건수</th>
              <th class="border border-slate-300 p-2">1인당 평균 지원</th>
              <th class="border border-slate-300 p-2">학교장추천 지원</th>
              <th class="border border-slate-300 p-2">농어촌 지원</th>
            </tr>
          </thead>
          <tbody class="text-center">
            <tr>
              <td class="border border-slate-300 p-2.5 font-bold">{{ officialStats?.totalStudents != null ? officialStats.totalStudents + '명' : '-' }}</td>
              <td class="border border-slate-300 p-2.5 font-bold text-indigo-700">{{ officialStats?.applicantStudents != null ? officialStats.applicantStudents + '명' : '-' }}</td>
              <td class="border border-slate-300 p-2.5 font-bold text-indigo-700">{{ officialStats?.applicantRate != null ? officialStats.applicantRate + '%' : '-' }}</td>
              <td class="border border-slate-300 p-2.5 font-bold text-sky-700">{{ officialStats?.totalApplications != null ? officialStats.totalApplications.toLocaleString() + '건' : '-' }}</td>
              <td class="border border-slate-300 p-2.5 font-bold">{{ officialStats?.avgApplicationsPerStudent != null ? officialStats.avgApplicationsPerStudent + '건' : '-' }}</td>
              <td class="border border-slate-300 p-2.5">
                <template v-if="officialStats?.recommendation?.applications != null">
                  {{ officialStats.recommendation.applications }}건
                  <span class="text-[10px] text-slate-500 block">({{ officialStats.recommendation.students }}명 / {{ officialStats.recommendation.studentRate }}%)</span>
                </template>
                <template v-else>-</template>
              </td>
              <td class="border border-slate-300 p-2.5">
                <template v-if="officialStats?.rural?.applications != null">
                  {{ officialStats.rural.applications }}건
                  <span class="text-[10px] text-slate-500 block">({{ officialStats.rural.applicantStudents }}명 / {{ officialStats.rural.applicantRate }}%)</span>
                </template>
                <template v-else>-</template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Section 2: Regional Distribution Table -->
      <div class="mt-8">
        <h2 class="text-sm font-bold text-slate-900 mb-2 flex items-center">
          <span class="w-2 h-2 bg-slate-900 rounded-full mr-2"></span>
          2. 지역별 수시 지원 분포 (수도권 vs 비수도권)
        </h2>
        <div class="grid grid-cols-2 gap-4 mb-2 text-xs">
          <div class="p-2.5 bg-slate-50 border border-slate-300 rounded text-center">
            수도권 (서울/경기/인천): <strong class="text-indigo-800">{{ officialStats?.metroBreakdown?.metro?.count != null ? officialStats.metroBreakdown.metro.count + '건' : '-' }}</strong> ({{ officialStats?.metroBreakdown?.metro?.rate != null ? officialStats.metroBreakdown.metro.rate + '%' : '-' }})
          </div>
          <div class="p-2.5 bg-slate-50 border border-slate-300 rounded text-center">
            비수도권 지역: <strong class="text-slate-800">{{ officialStats?.metroBreakdown?.nonMetro?.count != null ? officialStats.metroBreakdown.nonMetro.count + '건' : '-' }}</strong> ({{ officialStats?.metroBreakdown?.nonMetro?.rate != null ? officialStats.metroBreakdown.nonMetro.rate + '%' : '-' }})
          </div>
        </div>

        <table class="w-full border-collapse border border-slate-400 text-xs">
          <thead>
            <tr class="bg-slate-100 text-center font-bold text-slate-800">
              <th v-for="r in (officialStats?.regionalBreakdown || []).slice(0, 9)" :key="r.region" class="border border-slate-300 p-1.5">
                {{ r.region }}
              </th>
            </tr>
          </thead>
          <tbody class="text-center">
            <tr>
              <td v-for="r in (officialStats?.regionalBreakdown || []).slice(0, 9)" :key="r.region" class="border border-slate-300 p-1.5 font-bold">
                {{ r.count }}건
                <span class="text-[10px] text-slate-500 font-normal block">({{ r.rate }}%)</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Section 3: Class Breakdown -->
      <div class="mt-8">
        <h2 class="text-sm font-bold text-slate-900 mb-2 flex items-center">
          <span class="w-2 h-2 bg-slate-900 rounded-full mr-2"></span>
          3. 학급별(1반~11반) 수시 지원 현황
        </h2>
        <table class="w-full border-collapse border border-slate-400 text-xs text-center">
          <thead>
            <tr class="bg-slate-100 font-bold text-slate-800">
              <th class="border border-slate-300 p-1.5 bg-slate-200">구분</th>
              <th v-for="c in 11" :key="c" class="border border-slate-300 p-1.5">{{ c }}반</th>
              <th v-if="hasGraduates" class="border border-slate-300 p-1.5 bg-amber-50 text-amber-900">졸업생</th>
              <th class="border border-slate-300 p-1.5 bg-slate-200">합계</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-slate-300 p-1.5 font-bold bg-slate-50">지원건수</td>
              <td v-for="c in 11" :key="c" class="border border-slate-300 p-1.5">
                {{ getClassCount(c) }}
              </td>
              <td v-if="hasGraduates" class="border border-slate-300 p-1.5 font-bold text-amber-900">
                {{ getGraduateCount() }}
              </td>
              <td class="border border-slate-300 p-1.5 font-bold bg-slate-100">{{ applications.length }}</td>
            </tr>
            <tr>
              <td class="border border-slate-300 p-1.5 font-bold bg-slate-50">지원학생</td>
              <td v-for="c in 11" :key="c" class="border border-slate-300 p-1.5 text-slate-600">
                {{ getClassStudents(c) }}
              </td>
              <td v-if="hasGraduates" class="border border-slate-300 p-1.5 font-bold text-amber-900">
                {{ getGraduateStudents() }}
              </td>
              <td class="border border-slate-300 p-1.5 font-bold bg-slate-100">{{ totalUniqueStudents }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Section 4: Key Targets & Notable Universities -->
      <div class="mt-8">
        <h2 class="text-sm font-bold text-slate-900 mb-2 flex items-center">
          <span class="w-2 h-2 bg-slate-900 rounded-full mr-2"></span>
          4. 최다 지원 상위 10개 대학 및 특수 목적 대학군
        </h2>
        <div class="grid grid-cols-2 gap-4 text-xs">
          <!-- Top Applied -->
          <div class="border border-slate-300 p-3 rounded">
            <div class="font-bold border-b border-slate-200 pb-1 mb-2 text-indigo-900">최다 출원 대학 TOP 10</div>
            <ol class="space-y-1 list-decimal list-inside text-slate-700">
              <li>한경국립대: <strong>56건</strong></li>
              <li>백석대: <strong>40건</strong></li>
              <li>경기대(수원): <strong>36건</strong></li>
              <li>강남대: <strong>36건</strong></li>
              <li>가천대(성남): <strong>34건</strong></li>
              <li>한국외대(용인): <strong>29건</strong></li>
              <li>수원대: <strong>26건</strong></li>
              <li>명지대(용인): <strong>25건</strong></li>
              <li>남서울대: <strong>23건</strong></li>
              <li>용인대 / 평택대: <strong>각 22건</strong></li>
            </ol>
          </div>

          <!-- Special Target Groups -->
          <div class="border border-slate-300 p-3 rounded flex flex-col justify-between">
            <div>
              <div class="font-bold border-b border-slate-200 pb-1 mb-2 text-indigo-900">주요대 및 과기원 지원 현황</div>
              <ul class="space-y-1.5 text-slate-700">
                <li>• <strong>설포연고서성한이 & 4대 과기원:</strong> 총 <strong class="text-indigo-700">101건</strong> 출원</li>
                <li>• <strong>메디컬 계열:</strong> 상지대 한의예과 <strong class="text-indigo-700">1건</strong></li>
                <li>• <strong>거점 국립대학교:</strong> 총 <strong class="text-indigo-700">65건</strong> 출원</li>
                <li>• <strong>학교장추천 선정자:</strong> 65명 전원 지원 완료 (195건)</li>
              </ul>
            </div>
            <div class="mt-3 p-2 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-500">
              * 세부 학생별 합격자 통계는 1단계 및 최종 발표 이후 업데이트 예정입니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useData } from '../../composables/useStatData'
import { schoolName } from '../../../utils/schoolConfig'

const { officialStats, applications, selectedAcademicYear } = useData()
const window = globalThis.window

const displaySchoolName = computed(() => {
  return (schoolName.value && schoolName.value !== '우리학교') ? schoolName.value : '포곡고등학교'
})

// 오늘 날짜 기준 대입 학년도 계산 규칙:
// 오늘 날짜가 2026년이면 -> 2027학년도 대입 (3월 이후는 당해연도 + 1년)
const reportAdmissionYear = computed(() => {
  const today = new Date()
  const y = today.getFullYear()
  const m = today.getMonth() + 1
  const calc = m >= 3 ? y + 1 : y
  return String(Math.max(calc, 2027))
})

// 대입 수시 원서접수 연도 (대입 학년도 - 1년, 예: 2027학년도 대입의 수시 접수 연도는 2026년)
const reportApplicationYear = computed(() => {
  return String(Number(reportAdmissionYear.value) - 1)
})

const reportMode = ref('result2026') // 기본을 2026 대입 결과 종합 보고서로 설정

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
</script>
