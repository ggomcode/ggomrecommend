<template>
  <div class="space-y-6 select-none">
    <!-- Top Banner & Academic Year Alert -->
    <div class="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
      <div class="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-400 text-slate-950 shadow-xs">
              🌲 전형 심층 분석
            </span>
            <span 
              :class="[
                'px-2.5 py-1 rounded-full text-xs font-bold border',
                is2027Mode 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' 
                  : 'bg-teal-500/20 text-teal-200 border-teal-400/40'
              ]"
            >
              {{ selectedAcademicYear }}학년도 {{ is2027Mode ? '농어촌 시스템 실시간 연동' : '대교협 결과 분석' }}
            </span>
          </div>
          <h1 class="text-xl sm:text-2xl font-black text-white m-0 tracking-tight">
            농어촌 학생 특별전형 심층 분석
          </h1>
          <p class="text-xs sm:text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed m-0">
            포곡고의 읍·면 지역 입지 이점을 극대화하는 농어촌 정원외/정원내 특별전형 지원자 성적대, 경쟁률, 
            <span v-if="!is2027Mode" class="text-amber-300 font-bold">최종 합불 결과 및 합격 커트라인(컷선)</span>
            <span v-else class="text-emerald-300 font-bold">1~6지망 농어촌 신청 현황 및 대학별 수요</span>를 다각도로 분석합니다.
          </p>
        </div>

        <!-- Mode Badge Card -->
        <div class="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex flex-col items-end shrink-0 text-right">
          <span class="text-[11px] text-slate-300 font-medium">분석 데이터 출처</span>
          <span class="text-sm font-black text-emerald-300 mt-0.5">
            {{ is2027Mode ? '포곡고 농어촌 통합 시스템 (DB)' : `구글 스프레드시트 (${selectedAcademicYear}수시)` }}
          </span>
          <span v-if="is2027Mode" class="text-[10px] text-emerald-300 mt-1 font-semibold">
            💡 2027 대입은 지망 접수 진행 중 (합불 결과는 추후 반영)
          </span>
          <span v-else class="text-[10px] text-teal-200 mt-1 font-semibold">
            🎯 대입 전형 종료 완료 데이터 (합불·등록 포함)
          </span>
        </div>
      </div>
    </div>

    <!-- KPI Summary Cards (4 Cards) -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- 1. 총 농어촌 지원 건수 -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-slate-500 m-0">총 농어촌 지원(지망) 건수</p>
          <p class="text-2xl font-black text-slate-900 mt-1 m-0">
            {{ kpi.totalCount }}<span class="text-sm font-bold text-slate-500 ml-1">건</span>
          </p>
          <p class="text-[11px] text-slate-400 mt-1 m-0">
            실지원자 <strong class="text-slate-700">{{ kpi.uniqueStudents }}</strong>명 (1인당 {{ kpi.avgAppsPerStudent }}건)
          </p>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0 font-black">
          🌲
        </div>
      </div>

      <!-- 2. 최종 합격 실적 / 농어촌 자격 현황 -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-slate-500 m-0">
            {{ is2027Mode ? '농어촌 자격 적격 학생' : '최종 합격 실적' }}
          </p>
          <p class="text-2xl font-black text-emerald-600 mt-1 m-0">
            {{ is2027Mode ? kpi.eligibleStudentsCount : kpi.finalPassCount }}
            <span class="text-sm font-bold text-emerald-400 ml-1">{{ is2027Mode ? '명' : '건' }}</span>
          </p>
          <p class="text-[11px] text-slate-500 mt-1 m-0">
            <template v-if="!is2027Mode">
              합격률 <strong class="text-emerald-600 font-black">{{ kpi.passRate }}%</strong> 
              (최종등록 <strong class="text-teal-600 font-bold">{{ kpi.registeredCount }}</strong>건)
            </template>
            <template v-else>
              실제 농어촌 지원 <strong class="text-emerald-700 font-bold">{{ kpi.uniqueStudents }}명</strong> (총 {{ kpi.totalCount }}건)
            </template>
          </p>
        </div>
        <div :class="['w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 font-black', is2027Mode ? 'bg-teal-50 text-teal-600' : 'bg-emerald-50 text-emerald-600']">
          {{ is2027Mode ? '📜' : '🏆' }}
        </div>
      </div>

      <!-- 3. 합격자 평균 내신 & 커트라인 -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-slate-500 m-0">
            {{ is2027Mode ? '농어촌 지원자 평균 내신' : '합격자 평균 내신 (컷선)' }}
          </p>
          <p class="text-2xl font-black text-slate-900 mt-1 m-0 font-mono">
            {{ is2027Mode ? kpi.avgApplyGrade : (kpi.avgPassGrade || '-') }}<span class="text-sm font-bold text-slate-400 ml-1">등급</span>
          </p>
          <p class="text-[11px] text-slate-400 mt-1 m-0 font-mono">
            <template v-if="!is2027Mode">
              최고 {{ kpi.minPassGrade || '-' }} ~ 최저 {{ kpi.maxPassGrade || '-' }}등급
            </template>
            <template v-else>
              지원 성적 범위: {{ kpi.minApplyGrade || '-' }} ~ {{ kpi.maxApplyGrade || '-' }}등급
            </template>
          </p>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shrink-0 font-black">
          🎯
        </div>
      </div>

      <!-- 4. 지원 대학 수 & 수도권 비중 -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-slate-500 m-0">농어촌 지원 대학 수</p>
          <p class="text-2xl font-black text-slate-900 mt-1 m-0">
            {{ kpi.uniqueUnivs }}<span class="text-sm font-bold text-slate-500 ml-1">개교</span>
          </p>
          <p class="text-[11px] text-slate-400 mt-1 m-0">
            수도권(경기·서울·인천) <strong class="text-emerald-700 font-bold">{{ kpi.metroRatio }}%</strong>
          </p>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shrink-0 font-black">
          🗺️
        </div>
      </div>
    </div>

    <!-- 2 Visual Analysis Sections: TOP Univs & Admission Types -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Left: 농어촌 선호 TOP 10 대학 랭킹 (7 cols) -->
      <div class="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div class="flex items-center gap-2">
              <span class="text-base">📊</span>
              <h3 class="text-sm font-black text-slate-800 m-0">
                농어촌 전형 최다 지원 TOP 10 대학 및 합격률
              </h3>
            </div>
            <span class="text-[11px] text-slate-400 font-medium">상위 10개 대학</span>
          </div>

          <!-- Top University Ranking Bars -->
          <div class="space-y-3">
            <div 
              v-for="(u, idx) in topUnivsList" 
              :key="u.univName"
              class="p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div class="flex items-center justify-between text-xs mb-1.5">
                <div class="flex items-center gap-2">
                  <span 
                    :class="[
                      'w-5 h-5 rounded-md flex items-center justify-center font-black text-[11px]',
                      idx === 0 ? 'bg-amber-400 text-slate-900 shadow-2xs' :
                      idx === 1 ? 'bg-slate-300 text-slate-800' :
                      idx === 2 ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                    ]"
                  >
                    {{ idx + 1 }}
                  </span>
                  <span class="font-bold text-slate-800 text-xs sm:text-sm">{{ u.univName }}</span>
                  <span v-if="u.region" class="text-[10px] text-slate-400 font-medium">({{ u.region }})</span>
                </div>
                <div class="flex items-center gap-2 font-mono text-[11px]">
                  <span class="font-bold text-slate-900">{{ u.count }}건 지원</span>
                  <template v-if="!is2027Mode">
                    <span class="text-slate-300">|</span>
                    <span class="font-bold text-emerald-600">{{ u.passCount }}건 합격 ({{ u.passRate }}%)</span>
                  </template>
                  <template v-else>
                    <span class="text-slate-300">|</span>
                    <span class="text-slate-500 font-medium">지망 비중 {{ u.shareRatio }}%</span>
                  </template>
                </div>
              </div>

              <!-- Bar Progress -->
              <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                <div 
                  class="bg-emerald-600 h-full rounded-full transition-all duration-300"
                  :style="{ width: `${(u.count / maxUnivCount) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>* 포곡고 농어촌 특별전형 선호도 및 집중 대학 분석</span>
          <span class="font-semibold text-slate-600">{{ schoolName }}</span>
        </div>
      </div>

      <!-- Right: 농어촌 전형 유형 및 성적대별 분포 (5 cols) -->
      <div class="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div class="flex items-center gap-2">
              <span class="text-base">🎯</span>
              <h3 class="text-sm font-black text-slate-800 m-0">
                농어촌 전형 유형 & 성적대 분석
              </h3>
            </div>
            <span class="text-[11px] text-slate-400 font-medium">유형별 비율</span>
          </div>

          <!-- Admission Type Breakdown -->
          <div class="space-y-3">
            <div 
              v-for="t in typeStats" 
              :key="t.type"
              class="p-3 rounded-xl border border-slate-100 bg-slate-50/60"
            >
              <div class="flex items-center justify-between text-xs mb-1.5">
                <div class="flex items-center gap-2">
                  <span :class="['w-2.5 h-2.5 rounded-full', t.dotColor]"></span>
                  <span class="font-black text-slate-800">{{ t.label }}</span>
                </div>
                <div class="font-mono text-xs">
                  <strong class="text-slate-900">{{ t.count }}건</strong>
                  <span class="text-slate-400 text-[11px] ml-1">({{ t.ratio }}%)</span>
                </div>
              </div>

              <!-- Bar Progress -->
              <div class="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden flex mb-2">
                <div 
                  :class="['h-full rounded-full transition-all duration-300', t.barColor]"
                  :style="{ width: `${t.ratio}%` }"
                ></div>
              </div>

              <div class="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <template v-if="!is2027Mode">
                  <span>합격: <strong class="text-emerald-600 font-bold">{{ t.passCount }}건</strong> ({{ t.passRate }}%)</span>
                  <span>평균내신: <strong class="text-slate-800 font-mono">{{ t.avgGrade }}등급</strong></span>
                </template>
                <template v-else>
                  <span>평균 지원성적: <strong class="text-slate-800 font-mono">{{ t.avgGrade }}등급</strong></span>
                  <span>지망생 수: <strong class="text-emerald-700 font-bold">{{ t.uniqueStudents }}명</strong></span>
                </template>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-600 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100 leading-relaxed">
          🌲 <strong>농어촌 전형 특화 전략:</strong> 포곡고 학생들은 일반전형 대비 약 0.5~1.2등급 내신의 보정 효과(커트라인 완화)를 누리며 경기·인천 거점 대학(가천대, 경기대, 강남대, 단국대 등) 및 충청권 국공립대에 적극 도전하고 있습니다.
        </div>
      </div>
    </div>

    <!-- Universities Detailed Table & Search Filter -->
    <div class="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      <!-- Table Header & Controls -->
      <div class="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <span class="text-lg">🏛️</span>
          <div>
            <h3 class="text-sm sm:text-base font-black text-slate-800 m-0">
              농어촌 특별전형 대학별 지원 및 상세 결과 목록
            </h3>
            <p class="text-xs text-slate-400 mt-0.5 m-0">
              총 {{ filteredUnivRows.length }}개 전형·학과 목록이 조회되었습니다.
            </p>
          </div>
        </div>

        <!-- Search & Filter Controls -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Search input -->
          <div class="relative w-48 sm:w-60">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="대학명, 학과명 검색..."
              class="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs pl-8 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer"
            >
              ✕
            </button>
          </div>

          <!-- Sort Select -->
          <select
            v-model="sortBy"
            class="bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 px-3 py-2 focus:outline-none"
          >
            <option value="count">지원자 많은 순</option>
            <option value="passRate" v-if="!is2027Mode">합격률 높은 순</option>
            <option value="gradeAsc">내신 평균 높은 순 (1등급쪽)</option>
            <option value="univName">대학명 가나다순</option>
          </select>

          <!-- Privacy Masking Toggle -->
          <div v-if="!auth.isAdmin" class="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1.5 select-none" title="교사는 개인정보 보호를 위해 마스킹이 항상 유지됩니다.">
            <span>🔒</span>
            <span>마스킹: **동 (1단계)</span>
          </div>
          <button
            v-else
            type="button"
            @click="cycleAdminMaskMode"
            :class="[
              'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs select-none',
              adminMaskMode === 0 
                ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 ring-1 ring-rose-200' 
                : adminMaskMode === 1
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 ring-1 ring-amber-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 ring-1 ring-emerald-200'
            ]"
            :title="adminMaskTooltip"
          >
            <span>{{ adminMaskMode === 0 ? '🔒' : (adminMaskMode === 1 ? '🔓' : '👁️') }}</span>
            <span>{{ adminMaskLabel }}</span>
            <span class="text-[10px] px-1 py-0.2 rounded-full font-black bg-white border border-current shadow-2xs">
              {{ adminMaskMode === 0 ? '1단계' : (adminMaskMode === 1 ? '2단계' : '3단계') }}
            </span>
          </button>

          <!-- Export Excel CSV -->
          <button
            type="button"
            @click="exportCsv"
            class="px-3 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer border-none flex items-center gap-1.5 shadow-2xs"
          >
            <span>📥 CSV 저장</span>
          </button>
        </div>
      </div>

      <!-- Main Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <th class="py-3 px-4 w-12 text-center">번호</th>
              <th class="py-3 px-4">대학명</th>
              <th class="py-3 px-4">전형명</th>
              <th class="py-3 px-4">모집단위 (학과)</th>
              <th class="py-3 px-3 text-center">지원인원</th>
              <th class="py-3 px-3 text-center" v-if="!is2027Mode">최종합격</th>
              <th class="py-3 px-3 text-center" v-if="!is2027Mode">합격률</th>
              <th class="py-3 px-3 text-center" v-if="is2027Mode">지망비중</th>
              <th class="py-3 px-3 text-center">평균 내신</th>
              <th class="py-3 px-4 text-center">지원 성적 범위</th>
              <th class="py-3 px-3 text-center">지역</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700 font-medium">
            <template v-if="filteredUnivRows.length > 0">
              <tr 
                v-for="(row, idx) in filteredUnivRows" 
                :key="row.key"
                class="hover:bg-emerald-50/40 transition-colors"
              >
                <td class="py-3 px-4 text-center text-slate-400 font-mono">{{ idx + 1 }}</td>
                <td class="py-3 px-4">
                  <div class="flex items-center gap-1.5 font-bold text-slate-900">
                    <span>{{ row.univName }}</span>
                  </div>
                </td>
                <td class="py-3 px-4 text-slate-600">
                  <span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold text-[11px] border border-emerald-100">
                    {{ row.admissionName }}
                  </span>
                </td>
                <td class="py-3 px-4 font-semibold text-slate-800">{{ row.dept || '-' }}</td>
                <td class="py-3 px-3 text-center font-bold text-slate-900 font-mono">{{ row.applyCount }}건</td>
                
                <!-- 2025/2026: Pass Count & Pass Rate -->
                <td v-if="!is2027Mode" class="py-3 px-3 text-center font-bold text-emerald-600 font-mono">
                  {{ row.passCount }}건
                </td>
                <td v-if="!is2027Mode" class="py-3 px-3 text-center">
                  <span 
                    :class="[
                      'px-2 py-0.5 rounded-full font-black text-[11px] font-mono',
                      row.passRateNum >= 50 ? 'bg-emerald-100 text-emerald-800' :
                      row.passRateNum > 0 ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-500'
                    ]"
                  >
                    {{ row.passRate }}%
                  </span>
                </td>

                <!-- 2027: Choice Share -->
                <td v-if="is2027Mode" class="py-3 px-3 text-center font-bold text-teal-700 font-mono">
                  <span class="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 font-black border border-teal-200">
                    {{ row.shareRatio }}%
                  </span>
                </td>

                <!-- Average GPA -->
                <td class="py-3 px-3 text-center font-black text-slate-800 font-mono">
                  {{ row.avgGrade !== '-' ? `${row.avgGrade}등급` : '-' }}
                </td>

                <!-- Grade Range: Min ~ Max -->
                <td class="py-3 px-4 text-center font-mono text-[11px] text-slate-500">
                  {{ row.minGrade }} ~ {{ row.maxGrade }}
                </td>

                <!-- Region -->
                <td class="py-3 px-3 text-center text-slate-500 text-[11px]">
                  {{ row.region || '기타' }}
                </td>
              </tr>
            </template>
            <tr v-else>
              <td :colspan="is2027Mode ? 9 : 10" class="py-12 text-center text-slate-400">
                검색 조건에 일치하는 농어촌 전형 지원 내역이 없습니다.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Student Detail Records List -->
    <div class="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 mb-4 gap-2">
        <div class="flex items-center gap-2">
          <span class="text-base">👤</span>
          <h3 class="text-sm font-black text-slate-800 m-0">
            농어촌 전형 지원 학생 개별 목록
          </h3>
          <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            총 {{ rawRuralList.length }}건
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button 
            v-if="auth.isAdmin"
            type="button"
            @click="cycleAdminMaskMode"
            :class="[
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all border cursor-pointer shadow-2xs select-none',
              adminMaskMode === 0 
                ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 ring-1 ring-rose-200' 
                : adminMaskMode === 1
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 ring-1 ring-amber-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 ring-1 ring-emerald-200'
            ]"
            :title="adminMaskTooltip"
          >
            <span>{{ adminMaskMode === 0 ? '🔒' : (adminMaskMode === 1 ? '🔓' : '👁️') }}</span>
            <span>{{ adminMaskLabel }}</span>
            <span class="text-[10px] px-1 py-0.2 rounded-full font-black bg-white border border-current shadow-2xs">
              {{ adminMaskMode === 0 ? '1단계' : (adminMaskMode === 1 ? '2단계' : '3단계') }}
            </span>
          </button>
          <span v-else class="text-xs text-slate-400">
            * 개인정보 보호를 위해 1단계(**동) 마스킹이 상시 적용됩니다.
          </span>
        </div>
      </div>

      <div class="overflow-x-auto max-h-[460px] overflow-y-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead class="sticky top-0 bg-slate-50 z-10 border-b border-slate-200">
            <tr class="text-slate-600 font-bold">
              <th class="py-2.5 px-3 w-12 text-center">번호</th>
              <th class="py-2.5 px-3 text-center">학급-번호</th>
              <th class="py-2.5 px-3">학생명</th>
              <th class="py-2.5 px-4">지원 대학</th>
              <th class="py-2.5 px-4">모집단위</th>
              <th class="py-2.5 px-3">전형명</th>
              <th class="py-2.5 px-3 text-center">내신 등급</th>
              <th class="py-2.5 px-3 text-center">
                {{ is2027Mode ? '지망 순위' : '최종 결과' }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            <tr 
              v-for="(st, idx) in filteredStudentRecords" 
              :key="idx"
              class="hover:bg-slate-50/80 transition-colors"
            >
              <td class="py-2 px-3 text-center text-slate-400 font-mono">{{ idx + 1 }}</td>
              <td class="py-2 px-3 text-center font-mono font-semibold">{{ st.classNum }}반 {{ st.studentNum }}번</td>
              <td class="py-2 px-3 font-bold text-slate-900">{{ maskName(st.name) }}</td>
              <td class="py-2 px-4 font-semibold text-slate-800">{{ st.univName }}</td>
              <td class="py-2 px-4 text-slate-600">{{ st.dept || '-' }}</td>
              <td class="py-2 px-3 text-slate-500 text-[11px]">{{ st.admissionMajorType }}</td>
              <td class="py-2 px-3 text-center font-mono font-black text-slate-800">{{ st.grade }}등급</td>
              <td class="py-2 px-3 text-center">
                <span 
                  :class="[
                    'px-2 py-0.5 rounded text-[10px] font-black',
                    st.isPass ? 'bg-emerald-600 text-white' :
                    st.isReg ? 'bg-teal-700 text-white' :
                    st.isChoice ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                    st.isFail ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-slate-100 text-slate-600'
                  ]"
                >
                  {{ st.statusText }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { 
  useStatData, 
  maskName, 
  adminMaskMode, 
  cycleAdminMaskMode 
} from '../../composables/useStatData'
import { useAuthStore } from '../../../stores/auth'
import { schoolName } from '../../../utils/schoolConfig'
import { getAllRuralApplications, getRuralEligibilityList, getRuralTracks } from '../../../api/ruralApi'
import { decryptText } from '../../../utils/cryptoUtils'

const auth = useAuthStore()
const { selectedAcademicYear, applications } = useStatData()

const searchQuery = ref('')
const sortBy = ref('count')

const adminMaskLabel = computed(() => {
  if (adminMaskMode.value === 0) return '마스킹: **동'
  if (adminMaskMode.value === 1) return '마스킹: 홍*동'
  return '이름 전체공개'
})

const adminMaskTooltip = computed(() => {
  if (adminMaskMode.value === 0) {
    return '1단계 [기본 마스킹]: 맨 뒷글자(**동)만 표시 (2글자 이름은 ** 전체 마스킹). 클릭 시 2단계(성과 맨뒷글자 총 2개 표시: 홍*동)로 전환됩니다.'
  }
  if (adminMaskMode.value === 1) {
    return '2단계 [부분 마스킹]: 성+맨뒷글자(홍*동) 2글자 표시 중. 클릭 시 3단계(이름 전체 공개: 홍길동)로 전환됩니다.'
  }
  return '3단계 [이름 전체공개]: 모든 이름이 표시 중. 클릭 시 다시 1단계(디폴트 마스킹: **동)로 되돌아갑니다.'
})

// 2027 농어촌 시스템 데이터 상태
const sys2027RuralApps = ref([])
const sys2027Students = ref([])
const sys2027Tracks = ref([])
const isLoadingSys2027 = ref(false)

const is2027Mode = computed(() => {
  return String(selectedAcademicYear.value) === '2027'
})

// 2027학년도 농어촌 시스템 데이터 로드
async function load2027RuralData() {
  isLoadingSys2027.value = true
  try {
    const [apps, students, tracks] = await Promise.all([
      getAllRuralApplications(),
      getRuralEligibilityList(),
      getRuralTracks()
    ])

    const studentMap = {}
    for (const s of (students || [])) {
      let decName = s.name
      try {
        decName = await decryptText(s.name)
      } catch (e) {
        // keep
      }
      studentMap[s.student_id || s.id] = {
        ...s,
        name: decName || s.name
      }
    }

    sys2027RuralApps.value = (apps || []).map(a => {
      const st = studentMap[a.student_id] || {}
      return {
        id: a.id,
        studentId: a.student_id,
        name: st.name || a.student_name || '학생',
        classNum: a.class_no || st.class_no || '-',
        studentNum: a.student_no || st.student_no || '-',
        univName: a.univ_name || '대학',
        dept: a.dept_name || a.major_name || '-',
        admissionMajorType: a.track_name || '농어촌학생특별전형',
        grade: st.gpa_overall ? Number(st.gpa_overall).toFixed(2) : (a.grade ? Number(a.grade).toFixed(2) : '-'),
        choiceNumber: a.choice_number || 1,
        termType: a.term_type || '수시',
        isChoice: true,
        region: a.region || '수도권'
      }
    })

    sys2027Students.value = Object.values(studentMap)
    sys2027Tracks.value = tracks || []
  } catch (err) {
    console.warn('[RuralStatTab] 2027 농어촌 시스템 데이터 로드 실패:', err)
  } finally {
    isLoadingSys2027.value = false
  }
}

// 농어촌 전형 목록 (2027 vs 2025/2026)
const rawRuralList = computed(() => {
  if (is2027Mode.value) {
    if (sys2027RuralApps.value.length > 0) {
      return sys2027RuralApps.value.map(a => ({
        ...a,
        isPass: false,
        isFail: false,
        isReg: false,
        statusText: `${a.choiceNumber}지망`
      }))
    }
  }

  // 2025, 2026 구글시트
  const list = applications.value || []
  return list.filter(app => {
    if (app.isRural) return true
    const major = String(app.admissionMajorType || '')
    const detail = String(app.admissionDetailType || '')
    return major.includes('농어촌') || detail.includes('농어촌')
  }).map(app => {
    const finalSt = String(app.finalStage || '')
    const isPass = ['합격', '최초합격', '충원합격', '최초합', '추합', '등록'].some(k => finalSt.includes(k)) || app.registerStatus === 'Y'
    const isFail = ['불합격', '불합'].some(k => finalSt.includes(k))
    const isReg = app.registerStatus === 'Y'

    return {
      id: app.id,
      name: app.name,
      classNum: app.classNum,
      studentNum: app.studentNum,
      univName: app.univName,
      dept: app.dept,
      admissionMajorType: app.admissionMajorType || '농어촌특별전형',
      admissionDetailType: app.admissionDetailType,
      grade: app.score9Grade || app.allSubjectGrade || '-',
      region: app.region,
      finalStage: app.finalStage,
      registerStatus: app.registerStatus,
      isPass,
      isFail,
      isReg,
      isChoice: false,
      statusText: isReg ? '최종 등록' : (isPass ? '최종 합격' : (isFail ? '불합격' : (finalSt || '결과 미등록')))
    }
  })
})

// KPI 계산
const kpi = computed(() => {
  const list = rawRuralList.value
  const totalCount = list.length
  const uniqueStudents = new Set(list.map(a => `${a.classNum}-${a.studentNum}_${a.name}`)).size
  const avgAppsPerStudent = uniqueStudents > 0 ? (totalCount / uniqueStudents).toFixed(1) : '0'

  const uniqueUnivsSet = new Set(list.map(a => a.univName))
  const uniqueUnivs = uniqueUnivsSet.size

  const metroCount = list.filter(a => ['경기', '서울', '인천'].includes(String(a.region || ''))).length
  const metroRatio = totalCount > 0 ? Math.round((metroCount / totalCount) * 100) : 0

  if (is2027Mode.value) {
    // 334명(전교생 전체)이 아닌, 실제 자격 심사를 통과한 적격 학생만 필터링
    const eligibleStudents = sys2027Students.value.filter(s => {
      const el = s.eligibility || {}
      return el.is_eligible === true || 
             el.is_type1_eligible === true || 
             el.is_type2_eligible === true || 
             el.is_manual_approved === true ||
             s.is_rural_eligible === true
    })
    const eligibleStudentsCount = eligibleStudents.length > 0 ? eligibleStudents.length : uniqueStudents

    const validGrades = list.map(a => parseFloat(a.grade)).filter(n => !isNaN(n))
    const avgApplyGrade = validGrades.length > 0 ? (validGrades.reduce((a, b) => a + b, 0) / validGrades.length).toFixed(2) : '-'
    const minApplyGrade = validGrades.length > 0 ? Math.min(...validGrades).toFixed(2) : '-'
    const maxApplyGrade = validGrades.length > 0 ? Math.max(...validGrades).toFixed(2) : '-'

    return {
      totalCount,
      uniqueStudents,
      avgAppsPerStudent,
      uniqueUnivs,
      eligibleStudentsCount,
      avgApplyGrade,
      minApplyGrade,
      maxApplyGrade,
      metroRatio
    }
  }

  // 2025/2026 모드
  const finalPassCount = list.filter(a => a.isPass).length
  const registeredCount = list.filter(a => a.isReg).length
  const passRate = totalCount > 0 ? Math.round((finalPassCount / totalCount) * 100) : 0

  const passGrades = list.filter(a => a.isPass).map(a => parseFloat(a.grade)).filter(n => !isNaN(n))
  const avgPassGrade = passGrades.length > 0 ? (passGrades.reduce((a, b) => a + b, 0) / passGrades.length).toFixed(2) : '-'
  const minPassGrade = passGrades.length > 0 ? Math.min(...passGrades).toFixed(2) : null
  const maxPassGrade = passGrades.length > 0 ? Math.max(...passGrades).toFixed(2) : null

  return {
    totalCount,
    uniqueStudents,
    avgAppsPerStudent,
    uniqueUnivs,
    finalPassCount,
    registeredCount,
    passRate,
    avgPassGrade,
    minPassGrade,
    maxPassGrade,
    metroRatio
  }
})

// 농어촌 TOP 대학 랭킹
const topUnivsList = computed(() => {
  const map = {}
  const total = rawRuralList.value.length || 1
  rawRuralList.value.forEach(a => {
    if (!map[a.univName]) {
      map[a.univName] = {
        univName: a.univName,
        region: a.region,
        count: 0,
        passCount: 0
      }
    }
    map[a.univName].count++
    if (a.isPass) map[a.univName].passCount++
  })

  return Object.values(map)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(u => ({
      ...u,
      shareRatio: Math.round((u.count / total) * 100),
      passRate: u.count > 0 ? Math.round((u.passCount / u.count) * 100) : 0
    }))
})

const maxUnivCount = computed(() => {
  return topUnivsList.value.length > 0 ? topUnivsList.value[0].count : 1
})

// 전형 유형 및 성적대 분포
const typeStats = computed(() => {
  const types = [
    { label: '학생부교과 (농어촌)', match: k => k.includes('교과'), dotColor: 'bg-emerald-500', barColor: 'bg-emerald-500' },
    { label: '학생부종합 (농어촌)', match: k => k.includes('종합'), dotColor: 'bg-teal-500', barColor: 'bg-teal-500' },
    { label: '실기/실적 (농어촌)', match: k => k.includes('실기'), dotColor: 'bg-amber-500', barColor: 'bg-amber-500' },
    { label: '기타/수능위주 (정시)', match: k => !k.includes('교과') && !k.includes('종합') && !k.includes('실기'), dotColor: 'bg-indigo-500', barColor: 'bg-indigo-500' }
  ]

  const total = rawRuralList.value.length || 1

  return types.map(t => {
    const items = rawRuralList.value.filter(a => {
      const typeStr = `${a.admissionMajorType || ''} ${a.dept || ''}`
      return t.match(typeStr)
    })
    const count = items.length
    const ratio = Math.round((count / total) * 100)
    const passCount = items.filter(a => a.isPass).length
    const passRate = count > 0 ? Math.round((passCount / count) * 100) : 0
    const grades = items.map(a => parseFloat(a.grade)).filter(n => !isNaN(n))
    const avgGrade = grades.length > 0 ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(2) : '-'
    const uniqueStudents = new Set(items.map(a => a.name)).size

    return {
      ...t,
      count,
      ratio,
      passCount,
      passRate,
      avgGrade,
      uniqueStudents
    }
  })
})

// 대학별 그룹핑 테이블 행 데이터
const filteredUnivRows = computed(() => {
  const map = {}
  const total = rawRuralList.value.length || 1

  rawRuralList.value.forEach(a => {
    const key = `${a.univName}__${a.dept || '공통'}__${a.admissionMajorType || ''}`
    if (!map[key]) {
      map[key] = {
        key,
        univName: a.univName,
        admissionName: a.admissionMajorType || '농어촌특별전형',
        dept: a.dept,
        region: a.region,
        applyCount: 0,
        passCount: 0,
        grades: []
      }
    }
    map[key].applyCount++
    if (a.isPass) map[key].passCount++
    const g = parseFloat(a.grade)
    if (!isNaN(g)) map[key].grades.push(g)
  })

  let rows = Object.values(map).map(r => {
    const avgGrade = r.grades.length > 0 ? (r.grades.reduce((a, b) => a + b, 0) / r.grades.length).toFixed(2) : '-'
    const minGrade = r.grades.length > 0 ? Math.min(...r.grades).toFixed(2) : '-'
    const maxGrade = r.grades.length > 0 ? Math.max(...r.grades).toFixed(2) : '-'
    const passRateNum = r.applyCount > 0 ? Math.round((r.passCount / r.applyCount) * 100) : 0
    const shareRatio = Math.round((r.applyCount / total) * 100)

    return {
      ...r,
      avgGrade,
      avgGradeNum: avgGrade !== '-' ? parseFloat(avgGrade) : 99,
      minGrade,
      maxGrade,
      passRate: passRateNum,
      passRateNum,
      shareRatio
    }
  })

  // 검색어 필터링
  if (searchQuery.value) {
    const q = searchQuery.value.trim().toLowerCase()
    rows = rows.filter(r => 
      r.univName.toLowerCase().includes(q) || 
      (r.dept && r.dept.toLowerCase().includes(q)) ||
      (r.admissionName && r.admissionName.toLowerCase().includes(q))
    )
  }

  // 정렬
  if (sortBy.value === 'count') {
    rows.sort((a, b) => b.applyCount - a.applyCount)
  } else if (sortBy.value === 'passRate') {
    rows.sort((a, b) => b.passRateNum - a.passRateNum)
  } else if (sortBy.value === 'gradeAsc') {
    rows.sort((a, b) => a.avgGradeNum - b.avgGradeNum)
  } else if (sortBy.value === 'univName') {
    rows.sort((a, b) => a.univName.localeCompare(r.univName, 'ko'))
  }

  return rows
})

// 학생별 개별 목록 필터링
const filteredStudentRecords = computed(() => {
  let list = [...rawRuralList.value]
  if (searchQuery.value) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(st => 
      st.univName.toLowerCase().includes(q) ||
      (st.dept && st.dept.toLowerCase().includes(q)) ||
      (st.name && st.name.toLowerCase().includes(q))
    )
  }
  return list
})

// CSV 내보내기
function exportCsv() {
  const headers = is2027Mode.value
    ? ['순번', '대학명', '전형명', '모집단위', '지원건수', '지망비중(%)', '평균내신', '최고내신', '최저내신', '지역']
    : ['순번', '대학명', '전형명', '모집단위', '지원건수', '최종합격건수', '합격률(%)', '평균내신', '최고내신', '최저내신', '지역']

  const rows = filteredUnivRows.value.map((r, i) => {
    if (is2027Mode.value) {
      return [i + 1, r.univName, r.admissionName, r.dept || '', r.applyCount, r.shareRatio, r.avgGrade, r.minGrade, r.maxGrade, r.region || '']
    } else {
      return [i + 1, r.univName, r.admissionName, r.dept || '', r.applyCount, r.passCount, r.passRate, r.avgGrade, r.minGrade, r.maxGrade, r.region || '']
    }
  })

  let csvContent = '\uFEFF' + headers.join(',') + '\n'
  rows.forEach(row => {
    csvContent += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n'
  })

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `농어촌특별전형_심층분석_${selectedAcademicYear.value}학년도_${schoolName}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

watch(selectedAcademicYear, (newYear) => {
  if (String(newYear) === '2027') {
    load2027RuralData()
  }
})

onMounted(() => {
  if (is2027Mode.value) {
    load2027RuralData()
  }
})
</script>

