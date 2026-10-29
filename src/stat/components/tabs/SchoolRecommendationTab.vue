<template>
  <div class="space-y-6 select-none">
    <!-- Top Banner & Academic Year Alert -->
    <div class="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
      <div class="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="px-2.5 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 shadow-xs">
              🏛️ 전형 심층 분석
            </span>
            <span 
              :class="[
                'px-2.5 py-1 rounded-full text-xs font-bold border',
                is2027Mode 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' 
                  : 'bg-blue-500/20 text-blue-200 border-blue-400/40'
              ]"
            >
              {{ selectedAcademicYear }}학년도 {{ is2027Mode ? '추천 시스템 실시간 연동' : '대교협 결과 분석' }}
            </span>
          </div>
          <h1 class="text-xl sm:text-2xl font-black text-white m-0 tracking-tight">
            학교장추천 & 지역균형 전형 심층 분석
          </h1>
          <p class="text-xs sm:text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed m-0">
            고교별 추천 인원 제한이 있는 학교장추천·지역균형 전형의 지원자 분산, 경쟁률, 
            <span v-if="!is2027Mode" class="text-amber-300 font-bold">최종 합불 결과 및 합격자 등급선</span>
            <span v-else class="text-emerald-300 font-bold">1~3차 지망 선발 및 최종 추천 확정 현황</span>을 다각도로 분석합니다.
          </p>
        </div>

        <!-- Mode Badge Card -->
        <div class="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex flex-col items-end shrink-0 text-right">
          <span class="text-[11px] text-slate-300 font-medium">분석 데이터 출처</span>
          <span class="text-sm font-black text-amber-300 mt-0.5">
            {{ is2027Mode ? '포곡고 추천 배정 시스템 (DB)' : `구글 스프레드시트 (${selectedAcademicYear}수시)` }}
          </span>
          <span v-if="is2027Mode" class="text-[10px] text-emerald-300 mt-1 font-semibold">
            💡 2027 대입은 선발 진행 중 (합불 결과는 추후 반영)
          </span>
          <span v-else class="text-[10px] text-blue-200 mt-1 font-semibold">
            🎯 대입 전형 종료 완료 데이터 (합불·등록 포함)
          </span>
        </div>
      </div>
    </div>

    <!-- KPI Summary Cards (4 Cards) -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- 1. 총 추천 지원 건수 -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-slate-500 m-0">총 추천 지원(신청) 건수</p>
          <p class="text-2xl font-black text-slate-900 mt-1 m-0">
            {{ kpi.totalCount }}<span class="text-sm font-bold text-slate-500 ml-1">건</span>
          </p>
          <p class="text-[11px] text-slate-400 mt-1 m-0">
            실지원자 <strong class="text-slate-700">{{ kpi.uniqueStudents }}</strong>명 (1인당 {{ kpi.avgAppsPerStudent }}건)
          </p>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shrink-0 font-black">
          📋
        </div>
      </div>

      <!-- 2. 합격 실적 / 추천 확정 실적 -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-slate-500 m-0">
            {{ is2027Mode ? '최종 추천 확정' : '최종 합격 실적' }}
          </p>
          <p class="text-2xl font-black text-blue-600 mt-1 m-0">
            {{ is2027Mode ? kpi.confirmedRecCount : kpi.finalPassCount }}<span class="text-sm font-bold text-blue-400 ml-1">건</span>
          </p>
          <p class="text-[11px] text-slate-500 mt-1 m-0">
            <template v-if="!is2027Mode">
              합격률 <strong class="text-blue-600 font-black">{{ kpi.passRate }}%</strong> 
              (최종등록 <strong class="text-emerald-600 font-bold">{{ kpi.registeredCount }}</strong>건)
            </template>
            <template v-else>
              추천 배정률 <strong class="text-emerald-600 font-bold">{{ kpi.recRate }}%</strong> 
              (포기 <strong class="text-rose-500">{{ kpi.abandonedCount }}</strong>건)
            </template>
          </p>
        </div>
        <div :class="['w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 font-black', is2027Mode ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600']">
          {{ is2027Mode ? '🎖️' : '🎉' }}
        </div>
      </div>

      <!-- 3. 평균 내신 성적선 -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-slate-500 m-0">
            {{ is2027Mode ? '추천 지원자 평균 내신' : '합격자 평균 내신 (컷)' }}
          </p>
          <p class="text-2xl font-black text-slate-900 mt-1 m-0 font-mono">
            {{ is2027Mode ? kpi.avgApplyGrade : (kpi.avgPassGrade || '-') }}<span class="text-sm font-bold text-slate-400 ml-1">등급</span>
          </p>
          <p class="text-[11px] text-slate-400 mt-1 m-0 font-mono">
            <template v-if="!is2027Mode">
              최고 {{ kpi.minPassGrade || '-' }} ~ 최저 {{ kpi.maxPassGrade || '-' }}등급
            </template>
            <template v-else>
              전체 추천 확정자 평균: {{ kpi.confirmedAvgGrade || '-' }}등급
            </template>
          </p>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shrink-0 font-black">
          🎯
        </div>
      </div>

      <!-- 4. 대상 대학 수 & 경합 대학 -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-slate-500 m-0">추천 지원 대학 수</p>
          <p class="text-2xl font-black text-slate-900 mt-1 m-0">
            {{ kpi.uniqueUnivs }}<span class="text-sm font-bold text-slate-500 ml-1">개교</span>
          </p>
          <p class="text-[11px] text-slate-400 mt-1 m-0">
            <template v-if="is2027Mode">
              정원 초과 경합 <strong class="text-rose-600 font-bold">{{ kpi.competitiveUnivCount }}</strong>개교
            </template>
            <template v-else>
              수도권 상위 15개대 비중 <strong class="text-indigo-600 font-bold">{{ kpi.top15Ratio }}%</strong>
            </template>
          </p>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl shrink-0 font-black">
          🏛️
        </div>
      </div>
    </div>

    <!-- 2 Analysis Sections: TOP Univs & Grade Band Distribution -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Left: TOP 추천 지원 대학 랭킹 (7 cols) -->
      <div class="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div class="flex items-center gap-2">
              <span class="text-base">📊</span>
              <h3 class="text-sm font-black text-slate-800 m-0">
                학교장추천 전형 주요 대학별 지원 현황 및 비중
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
                    <span class="font-bold text-blue-600">{{ u.passCount }}건 합격 ({{ u.passRate }}%)</span>
                  </template>
                  <template v-else>
                    <span class="text-slate-300">|</span>
                    <span class="font-bold text-emerald-600">{{ u.confirmedCount }}건 추천확정</span>
                  </template>
                </div>
              </div>

              <!-- Bar Progress -->
              <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                <div 
                  class="bg-blue-600 h-full rounded-full transition-all duration-300"
                  :style="{ width: `${(u.count / maxUnivCount) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>* 고교별 학교장추천/지역균형 지원 집중 대학 분석</span>
          <span class="font-semibold text-slate-600">{{ schoolName }}</span>
        </div>
      </div>

      <!-- Right: 성적대별 추천 전형 지원 분포 (5 cols) -->
      <div class="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div class="flex items-center gap-2">
              <span class="text-base">🎯</span>
              <h3 class="text-sm font-black text-slate-800 m-0">
                내신 등급 구간별 추천 전형 활용도
              </h3>
            </div>
            <span class="text-[11px] text-slate-400 font-medium">등급대별 분포</span>
          </div>

          <!-- Grade Bands Cards -->
          <div class="space-y-3">
            <div 
              v-for="band in gradeBandStats" 
              :key="band.range"
              class="p-3 rounded-xl border border-slate-100 bg-slate-50/60"
            >
              <div class="flex items-center justify-between text-xs mb-1.5">
                <div class="flex items-center gap-2">
                  <span :class="['w-2.5 h-2.5 rounded-full', band.dotColor]"></span>
                  <span class="font-black text-slate-800">{{ band.label }}</span>
                  <span class="text-[10px] text-slate-400 font-mono">({{ band.range }})</span>
                </div>
                <div class="font-mono text-xs">
                  <strong class="text-slate-900">{{ band.count }}건</strong>
                  <span class="text-slate-400 text-[11px] ml-1">({{ band.ratio }}%)</span>
                </div>
              </div>

              <!-- Bar Progress -->
              <div class="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden flex mb-2">
                <div 
                  :class="['h-full rounded-full transition-all duration-300', band.barColor]"
                  :style="{ width: `${band.ratio}%` }"
                ></div>
              </div>

              <div class="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <template v-if="!is2027Mode">
                  <span>합격: <strong class="text-blue-600 font-bold">{{ band.passCount }}건</strong> ({{ band.passRate }}%)</span>
                  <span>등록: <strong class="text-emerald-600 font-bold">{{ band.regCount }}건</strong></span>
                </template>
                <template v-else>
                  <span>추천 확정: <strong class="text-emerald-600 font-bold">{{ band.confirmedCount }}건</strong></span>
                  <span>탈락/미추천: <strong class="text-slate-500">{{ band.notConfirmedCount }}건</strong></span>
                </template>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 bg-blue-50/60 p-2.5 rounded-xl border border-blue-100 leading-relaxed">
          💡 <strong>추천 전형 진학 시사점:</strong> 학교장추천 전형은 대부분 교과 평가 비중이 높아 1.5~2.5등급 구간 학생들이 수도권 주요 대학(인서울 15개대 등)을 안정·적정으로 공략하는 핵심 지렛대로 활용됩니다.
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
              학교장추천 전형 대학별 지원 및 상세 결과 목록
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
              class="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs pl-8 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
              <th class="py-3 px-3 text-center" v-if="is2027Mode">추천확정</th>
              <th class="py-3 px-3 text-center">평균 내신</th>
              <th class="py-3 px-4 text-center">지원 성적 범위</th>
              <th class="py-3 px-3 text-center">경쟁률</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700 font-medium">
            <template v-if="filteredUnivRows.length > 0">
              <tr 
                v-for="(row, idx) in filteredUnivRows" 
                :key="row.key"
                class="hover:bg-blue-50/40 transition-colors"
              >
                <td class="py-3 px-4 text-center text-slate-400 font-mono">{{ idx + 1 }}</td>
                <td class="py-3 px-4">
                  <div class="flex items-center gap-1.5 font-bold text-slate-900">
                    <span>{{ row.univName }}</span>
                    <span v-if="row.region" class="text-[10px] text-slate-400 font-normal">({{ row.region }})</span>
                  </div>
                </td>
                <td class="py-3 px-4 text-slate-600">
                  <span class="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[11px] border border-blue-100">
                    {{ row.admissionName }}
                  </span>
                </td>
                <td class="py-3 px-4 font-semibold text-slate-800">{{ row.dept || '-' }}</td>
                <td class="py-3 px-3 text-center font-bold text-slate-900 font-mono">{{ row.applyCount }}건</td>
                
                <!-- 2025/2026: Pass Count & Pass Rate -->
                <td v-if="!is2027Mode" class="py-3 px-3 text-center font-bold text-blue-600 font-mono">
                  {{ row.passCount }}건
                </td>
                <td v-if="!is2027Mode" class="py-3 px-3 text-center">
                  <span 
                    :class="[
                      'px-2 py-0.5 rounded-full font-black text-[11px] font-mono',
                      row.passRateNum >= 50 ? 'bg-emerald-100 text-emerald-800' :
                      row.passRateNum > 0 ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'
                    ]"
                  >
                    {{ row.passRate }}%
                  </span>
                </td>

                <!-- 2027: Confirmed Recommendation -->
                <td v-if="is2027Mode" class="py-3 px-3 text-center font-bold text-emerald-600 font-mono">
                  <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black">
                    {{ row.confirmedCount }}건 확정
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

                <!-- Competition Rate -->
                <td class="py-3 px-3 text-center font-mono text-slate-600 text-[11px]">
                  {{ row.compRate || '-' }}
                </td>
              </tr>
            </template>
            <tr v-else>
              <td :colspan="is2027Mode ? 9 : 10" class="py-12 text-center text-slate-400">
                검색 조건에 일치하는 학교장추천 전형 지원 내역이 없습니다.
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
            학교장추천 전형 지원 학생 개별 목록
          </h3>
          <span class="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            총 {{ rawRecList.length }}건
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
                {{ is2027Mode ? '추천 상태' : '최종 결과' }}
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
                    st.isPass ? 'bg-blue-600 text-white' :
                    st.isConfirmed ? 'bg-emerald-600 text-white' :
                    st.isAbandoned ? 'bg-rose-100 text-rose-700' :
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
import { supabase } from '../../../utils/supabaseClient'
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

// 2027 시스템 데이터 상태 (Supabase)
const sys2027Apps = ref([])
const sys2027Students = ref([])
const sys2027Univs = ref([])
const isLoadingSys2027 = ref(false)

const is2027Mode = computed(() => {
  return String(selectedAcademicYear.value) === '2027'
})

// 2027학년도 Supabase 학교장추천 데이터 로드
async function load2027SystemData() {
  if (!supabase) return
  isLoadingSys2027.value = true
  try {
    const [appsRes, studentsRes, univsRes] = await Promise.all([
      supabase.from('applications').select('*'),
      supabase.from('enrolled_students').select('id, name, student_code, gpa_overall, grad_year, grade, is_enrolled'),
      supabase.from('universities').select('*')
    ])

    const rawApps = appsRes.data || []
    const rawStudents = studentsRes.data || []
    const rawUnivs = univsRes.data || []

    // 학생 이름 복호화
    const studentMap = {}
    for (const s of rawStudents) {
      let decName = s.name
      try {
        decName = await decryptText(s.name)
      } catch (e) {
        // keep raw
      }
      studentMap[s.id] = {
        ...s,
        name: decName || s.name
      }
    }

    // 추천 선발 확정 여부 판단:
    // 이미 선발이 마무리되었으므로, 포기하지 않고 제외되지 않은 유효 지원서는 추천 확정으로 인정
    const anyRecTrue = rawApps.some(a => a.is_recommended === true || a.is_recommended === 'true' || a.is_recommended === 1)

    sys2027Apps.value = rawApps.map(a => {
      const st = studentMap[a.student_id] || {}
      const univ = rawUnivs.find(u => u.id === a.univ_id) || {}
      const isAbandoned = !!a.is_abandoned
      const isExcluded = !!a.is_excluded
      const isExplicitRec = a.is_recommended === true || a.is_recommended === 'true' || a.is_recommended === 1
      
      const isConfirmed = anyRecTrue 
        ? (!isAbandoned && isExplicitRec) 
        : (!isAbandoned && !isExcluded)

      return {
        id: a.id,
        studentId: a.student_id,
        name: st.name || '학생',
        classNum: st.student_code ? st.student_code.substring(1, 3) : '-',
        studentNum: st.student_code ? st.student_code.substring(3, 5) : '-',
        univName: univ.univ_name || '대학',
        dept: a.dept || univ.track_name || '-',
        admissionMajorType: univ.admission_type || '학교장추천',
        grade: st.gpa_overall ? Number(st.gpa_overall).toFixed(2) : '-',
        isConfirmed,
        isAbandoned,
        isExcluded,
        round: a.round,
        region: univ.region || '수도권',
        quota: univ.quota || 0,
        compRate: a.comp_rate || null
      }
    })

    sys2027Students.value = Object.values(studentMap)
    sys2027Univs.value = rawUnivs
  } catch (err) {
    console.warn('[SchoolRecommendationTab] 2027 Supabase 데이터 로드 실패:', err)
  } finally {
    isLoadingSys2027.value = false
  }
}

// 2025, 2026학년도 구글시트 applications에서 추천 전형 필터링
const rawRecList = computed(() => {
  if (is2027Mode.value) {
    // 2027학년도: 시스템 데이터가 유효하게 있으면 시스템 데이터 우선 사용
    if (sys2027Apps.value.length > 0) {
      return sys2027Apps.value.map(a => {
        const isConf = !a.isAbandoned && a.isConfirmed
        return {
          ...a,
          isConfirmed: isConf,
          isPass: false, // 2027은 아직 대입 합격여부 미결정
          isFail: false,
          statusText: isConf ? '추천 확정' : (a.isAbandoned ? '추천 포기' : '선발 제외')
        }
      })
    }
  }

  // 구글 시트 applications (2027 대교협 수시 144건, 2026 수시 72건, 2025 수시 등)
  const list = applications.value || []
  return list.filter(app => {
    if (app.isRecommendation) return true
    const major = String(app.admissionMajorType || '')
    const detail = String(app.admissionDetailType || '')
    return major.includes('추천') || major.includes('지역균형') || major.includes('학교장') || major.includes('지균') ||
           detail.includes('추천') || detail.includes('지역균형') || detail.includes('학교장')
  }).map(app => {
    const finalSt = String(app.finalStage || '')
    const isPass = ['합격', '최초합격', '충원합격', '최초합', '추합', '등록'].some(k => finalSt.includes(k)) || app.registerStatus === 'Y'
    const isFail = ['불합격', '불합'].some(k => finalSt.includes(k))
    const isReg = app.registerStatus === 'Y'

    // 대교협 수시 원서에 접수된 학교장추천 전형은 이미 학교 추천선발이 마무리되어 확정 추천된 건임
    const isConfirmed = true

    let statusText = '추천 확정'
    if (isReg) statusText = '최종 등록'
    else if (isPass) statusText = '최종 합격'
    else if (isFail) statusText = '불합격'
    else if (finalSt) statusText = finalSt

    return {
      id: app.id,
      name: app.name,
      classNum: app.classNum,
      studentNum: app.studentNum,
      univName: app.univName,
      dept: app.dept,
      admissionMajorType: app.admissionMajorType || '학교장추천',
      admissionDetailType: app.admissionDetailType,
      grade: app.score9Grade || app.allSubjectGrade || '-',
      region: app.region,
      finalStage: app.finalStage,
      registerStatus: app.registerStatus,
      isPass,
      isFail,
      isReg,
      isConfirmed,
      isAbandoned: false,
      statusText
    }
  })
})

// KPI 계산
const kpi = computed(() => {
  const list = rawRecList.value
  const totalCount = list.length
  const uniqueStudents = new Set(list.map(a => `${a.classNum}-${a.studentNum}_${a.name}`)).size
  const avgAppsPerStudent = uniqueStudents > 0 ? (totalCount / uniqueStudents).toFixed(1) : '0'

  const uniqueUnivsSet = new Set(list.map(a => a.univName))
  const uniqueUnivs = uniqueUnivsSet.size

  if (is2027Mode.value) {
    const confirmedRecCount = list.filter(a => a.isConfirmed).length
    const abandonedCount = list.filter(a => a.isAbandoned).length
    const recRate = totalCount > 0 ? Math.round((confirmedRecCount / totalCount) * 100) : 0

    // 평점
    const validGrades = list.map(a => parseFloat(a.grade)).filter(n => !isNaN(n))
    const avgApplyGrade = validGrades.length > 0 ? (validGrades.reduce((a, b) => a + b, 0) / validGrades.length).toFixed(2) : '-'

    const confirmedGrades = list.filter(a => a.isConfirmed).map(a => parseFloat(a.grade)).filter(n => !isNaN(n))
    const confirmedAvgGrade = confirmedGrades.length > 0 ? (confirmedGrades.reduce((a, b) => a + b, 0) / confirmedGrades.length).toFixed(2) : '-'

    // 경합 대학 (정원 대비 지원자 수 초과)
    const univMap = {}
    list.forEach(a => {
      univMap[a.univName] = (univMap[a.univName] || 0) + 1
    })
    const competitiveUnivCount = Object.keys(univMap).filter(u => univMap[u] >= 3).length

    return {
      totalCount,
      uniqueStudents,
      avgAppsPerStudent,
      uniqueUnivs,
      confirmedRecCount,
      abandonedCount,
      recRate,
      avgApplyGrade,
      confirmedAvgGrade,
      competitiveUnivCount
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

  const top15Set = new Set(['서울대', '연세대', '고려대', '서강대', '성균관대', '한양대', '중앙대', '경희대', '한국외대', '서울시립대', '이화여대', '건국대', '동국대', '홍익대', '숙명여대'])
  const top15Count = list.filter(a => Array.from(top15Set).some(k => a.univName.includes(k))).length
  const top15Ratio = totalCount > 0 ? Math.round((top15Count / totalCount) * 100) : 0

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
    top15Ratio
  }
})

// 상위 대학별 추천 지원 현황
const topUnivsList = computed(() => {
  const map = {}
  rawRecList.value.forEach(a => {
    if (!map[a.univName]) {
      map[a.univName] = {
        univName: a.univName,
        region: a.region,
        count: 0,
        passCount: 0,
        confirmedCount: 0
      }
    }
    map[a.univName].count++
    if (a.isPass) map[a.univName].passCount++
    if (a.isConfirmed) map[a.univName].confirmedCount++
  })

  return Object.values(map)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(u => ({
      ...u,
      passRate: u.count > 0 ? Math.round((u.passCount / u.count) * 100) : 0
    }))
})

const maxUnivCount = computed(() => {
  return topUnivsList.value.length > 0 ? topUnivsList.value[0].count : 1
})

// 내신 등급 구간별 통계 (1.0~1.49 / 1.5~1.99 / 2.0~2.49 / 2.5~2.99 / 3.0 이상)
const gradeBandStats = computed(() => {
  const bands = [
    { label: '최상위 1등급 초반', range: '1.00 ~ 1.49', min: 1.0, max: 1.499, dotColor: 'bg-emerald-500', barColor: 'bg-emerald-500' },
    { label: '상위 1등급 후반', range: '1.50 ~ 1.99', min: 1.5, max: 1.999, dotColor: 'bg-blue-500', barColor: 'bg-blue-500' },
    { label: '우수 2등급 초반', range: '2.00 ~ 2.49', min: 2.0, max: 2.499, dotColor: 'bg-indigo-500', barColor: 'bg-indigo-500' },
    { label: '2등급 후반', range: '2.50 ~ 2.99', min: 2.5, max: 2.999, dotColor: 'bg-amber-500', barColor: 'bg-amber-500' },
    { label: '3등급 이상', range: '3.00 이상', min: 3.0, max: 9.999, dotColor: 'bg-slate-400', barColor: 'bg-slate-400' }
  ]

  const total = rawRecList.value.length || 1

  return bands.map(b => {
    const items = rawRecList.value.filter(a => {
      const g = parseFloat(a.grade)
      return !isNaN(g) && g >= b.min && g <= b.max
    })
    const count = items.length
    const ratio = Math.round((count / total) * 100)
    const passCount = items.filter(a => a.isPass).length
    const regCount = items.filter(a => a.isReg).length
    const confirmedCount = items.filter(a => a.isConfirmed).length
    const notConfirmedCount = count - confirmedCount
    const passRate = count > 0 ? Math.round((passCount / count) * 100) : 0

    return {
      ...b,
      count,
      ratio,
      passCount,
      regCount,
      confirmedCount,
      notConfirmedCount,
      passRate
    }
  })
})

// 대학별 그룹핑 테이블 행 데이터
const filteredUnivRows = computed(() => {
  const map = {}
  rawRecList.value.forEach(a => {
    const key = `${a.univName}__${a.dept || '공통'}__${a.admissionMajorType || ''}`
    if (!map[key]) {
      map[key] = {
        key,
        univName: a.univName,
        admissionName: a.admissionMajorType || '학교장추천',
        dept: a.dept,
        region: a.region,
        applyCount: 0,
        passCount: 0,
        confirmedCount: 0,
        grades: [],
        compRate: a.compRate || null
      }
    }
    map[key].applyCount++
    if (a.isPass) map[key].passCount++
    if (a.isConfirmed) map[key].confirmedCount++
    const g = parseFloat(a.grade)
    if (!isNaN(g)) map[key].grades.push(g)
  })

  let rows = Object.values(map).map(r => {
    const avgGrade = r.grades.length > 0 ? (r.grades.reduce((a, b) => a + b, 0) / r.grades.length).toFixed(2) : '-'
    const minGrade = r.grades.length > 0 ? Math.min(...r.grades).toFixed(2) : '-'
    const maxGrade = r.grades.length > 0 ? Math.max(...r.grades).toFixed(2) : '-'
    const passRateNum = r.applyCount > 0 ? Math.round((r.passCount / r.applyCount) * 100) : 0

    return {
      ...r,
      avgGrade,
      avgGradeNum: avgGrade !== '-' ? parseFloat(avgGrade) : 99,
      minGrade,
      maxGrade,
      passRate: passRateNum,
      passRateNum
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
    rows.sort((a, b) => a.univName.localeCompare(b.univName, 'ko'))
  }

  return rows
})

// 학생별 개별 목록 필터링
const filteredStudentRecords = computed(() => {
  let list = [...rawRecList.value]
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
    ? ['순번', '대학명', '전형명', '모집단위', '지원건수', '추천확정건수', '평균내신', '최고내신', '최저내신']
    : ['순번', '대학명', '전형명', '모집단위', '지원건수', '최종합격건수', '합격률(%)', '평균내신', '최고내신', '최저내신']

  const rows = filteredUnivRows.value.map((r, i) => {
    if (is2027Mode.value) {
      return [i + 1, r.univName, r.admissionName, r.dept || '', r.applyCount, r.confirmedCount, r.avgGrade, r.minGrade, r.maxGrade]
    } else {
      return [i + 1, r.univName, r.admissionName, r.dept || '', r.applyCount, r.passCount, r.passRate, r.avgGrade, r.minGrade, r.maxGrade]
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
  a.download = `학교장추천전형_심층분석_${selectedAcademicYear.value}학년도_${schoolName}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// 2027 연도 변경 감지
watch(selectedAcademicYear, (newYear) => {
  if (String(newYear) === '2027') {
    load2027SystemData()
  }
})

onMounted(() => {
  if (is2027Mode.value) {
    load2027SystemData()
  }
})
</script>

