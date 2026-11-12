<template>
  <div class="flex flex-col h-full overflow-hidden p-6" style="background: #f8fafc;">
    <!-- ── 화면 전용 뷰 (Screen Only) ────────────────────────── -->
    <div class="screen-only flex flex-col h-full overflow-hidden">
      <!-- ── 상단 헤더 ────────────────────────────────────────── -->
      <div class="flex items-center justify-between shrink-0 mb-5">
        <div>
          <h1 class="text-2xl font-bold text-slate-900" style="margin: 0;">결과 보고서 및 프린트</h1>
        </div>

        <!-- 우측 액션 버튼들 -->
        <div class="flex items-center gap-3 flex-wrap">
          <!-- 차수 선택 드롭다운 -->
          <div class="h-9.5 flex items-center gap-2.5 bg-white px-4 rounded-xl border border-slate-300 shadow-sm box-border">
            <span class="text-xs font-bold text-slate-500 whitespace-nowrap">선택 차수:</span>
            <select
              v-model="selectedRoundFilter"
              class="bg-transparent border-none text-xs font-black text-blue-700 focus:outline-none cursor-pointer pr-3 py-0 leading-tight min-w-19"
            >
              <option value="all">전체</option>
              <option :value="0">사전 선발</option>
              <option v-for="r in roundOptions" :key="r" :value="r">{{ r }}차 선발</option>
            </select>
          </div>

          <button
            class="h-9.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer transition-colors box-border"
            :disabled="loading"
            @click="loadData"
          >
            <span>🔄 데이터 새로고침</span>
          </button>
          <button
            class="h-9.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer transition-colors border-none box-border"
            :disabled="downloading"
            @click="downloadExcel"
          >
            <span>📥 엑셀 내보내기</span>
          </button>
          <button
            class="h-9.5 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer transition-colors border-none box-border"
            @click="printReport"
          >
            <span>🖨️ 보고서 인쇄 (PDF)</span>
          </button>
          <button
            class="h-9.5 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer transition-colors border-none box-border"
            @click="printReportRecommendOnly"
          >
            <span>🖨️ 보고서 인쇄 (PDF, 추천 대학만)</span>
          </button>
          <button
            class="h-9.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer transition-colors border-none box-border"
            title="학교장추천전형 추천 포기자 결과 보고서 인쇄"
            @click="printAbandonedReport"
          >
            <span>🖨️ 포기자 보고서 인쇄 (PDF)</span>
          </button>
        </div>
      </div>

      <!-- ── 2027 대입 확정 원장 안내 배너 ── -->
      <div v-if="isUsingKcueArchive" class="mb-4 bg-linear-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-300 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-lg shrink-0 shadow-xs">
            🏛️
          </div>
          <div>
            <h4 class="text-xs sm:text-sm font-extrabold text-emerald-950 m-0 flex items-center gap-2 flex-wrap">
              2027학년도 대입 학교장추천전형 원서접수 확정 대장
              <span class="px-2 py-0.5 rounded-full text-xs bg-emerald-200 text-emerald-950 border border-emerald-300 font-extrabold">
                총 {{ totalRecommendedStats.totalStudents }}명 ({{ totalRecommendedStats.totalCases }}건)
              </span>
            </h4>
          </div>
        </div>
      </div>

      <!-- ── 검색 및 학급 필터 툴바 ── -->
      <div class="mb-4 bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3 shrink-0 flex-wrap">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xs font-bold text-slate-500">학급 필터:</span>
          <div class="flex items-center gap-1 flex-wrap">
            <button
              class="px-2.5 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer border"
              :class="filterClass === 'all' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'"
              @click="filterClass = 'all'"
            >
              전체
            </button>
            <button
              v-for="c in classNumbers"
              :key="c"
              class="px-2 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer border"
              :class="filterClass === String(c) ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'"
              @click="filterClass = String(c)"
            >
              {{ c }}반
            </button>
            <button
              class="px-2.5 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer border"
              :class="filterClass === 'grad' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'"
              @click="filterClass = 'grad'"
            >
              졸업생
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2 min-w-65 sm:w-72">
          <div class="relative w-full">
            <input
              type="text"
              v-model="searchQuery"
              placeholder="대학명, 모집단위, 학생이름, 학번 검색..."
              class="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
            <span class="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 text-xs cursor-pointer border-none bg-transparent"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <!-- ── 화면용 데이터 테이블 영역 ────────────────────────── -->
      <div class="flex-1 min-h-0 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <!-- 보고서 헤더 -->
        <div class="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <span class="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">{{ schoolName }}</span>
            <div class="flex items-center gap-4 flex-wrap">
              <h2 class="text-xl font-black text-slate-900" style="margin: 0;">
                {{ activeViewMode === 'recommend' ? '학교장추천전형 추천 명단 및 현황' : '학교장추천전형 추천 포기자 명단' }}
                <span class="text-blue-600 text-lg ml-1 font-bold">{{ roundLabelText }}</span>
              </h2>
              <!-- 탭 전환 버튼 -->
              <div class="flex items-center bg-slate-200/90 p-1 rounded-xl shadow-inner">
                <button
                  :class="['px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer border-none', activeViewMode === 'recommend' ? 'bg-white text-blue-700 shadow-sm' : 'bg-transparent text-slate-600 hover:text-slate-900']"
                  @click="activeViewMode = 'recommend'"
                >
                  📋 추천 명단 ({{ totalRecommendedStats.totalCases }}건)
                </button>
                <button
                  :class="['px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer border-none', activeViewMode === 'abandoned' ? 'bg-amber-600 text-white shadow-sm' : 'bg-transparent text-slate-600 hover:text-slate-900']"
                  @click="activeViewMode = 'abandoned'"
                >
                  🚫 포기자 명단 ({{ filteredAbandonedList.length }}건)
                </button>
              </div>
            </div>
          </div>
          <div class="text-xs text-slate-500 font-medium">
            기준일시: {{ currentDate }}
          </div>
        </div>

        <!-- 로딩 -->
        <div v-if="loading" class="flex-1 flex items-center justify-center p-12 text-slate-400 font-medium">
          보고서 데이터를 불러오는 중입니다…
        </div>

        <!-- 1. 추천 명단 화면용 테이블 (activeViewMode === 'recommend') -->
        <template v-else-if="activeViewMode === 'recommend'">
          <div v-if="!displayedStats || displayedStats.length === 0" class="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
            <p class="text-base font-bold text-slate-600 mb-1">
              {{ filterClass !== 'all' ? `${filterClass === 'grad' ? '졸업생' : filterClass + '반'}에 해당하는 추천 학생 데이터가 없습니다.` : '등록된 정원 현황 및 추천 학생 데이터가 없습니다.' }}
            </p>
            <p class="text-xs">
              {{ filterClass !== 'all' ? '다른 학급을 선택하거나 전체를 선택해 주세요.' : '대학 정원 설정 및 학생 지원을 진행한 후 다시 확인해 주세요.' }}
            </p>
          </div>

          <div v-else class="flex-1 min-h-0 overflow-y-auto p-6">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-100 text-slate-700 border-b-2 border-slate-300">
                <th class="p-3 font-bold w-10 text-center">No</th>
                <th class="p-3 font-bold whitespace-nowrap w-28">대학명</th>
                <th class="p-3 font-bold whitespace-nowrap">모집단위</th>
                <th class="p-3 font-bold whitespace-nowrap w-36">졸업년도 조건</th>
                <th class="p-3 font-bold text-center w-32 whitespace-nowrap">추천 제한 정원</th>
                <th class="p-3 font-bold text-center w-28 whitespace-nowrap">추천 현황(지원)</th>
                <th class="p-3 font-bold text-center w-16 whitespace-nowrap">(재학생)</th>
                <th class="p-3 font-bold text-center w-16 whitespace-nowrap">(졸업생)</th>
                <th class="p-3 font-bold text-left whitespace-nowrap" style="min-width: 140px;">추천 학생 (학번/성명)</th>
                <th class="p-3 font-bold text-center whitespace-nowrap" style="min-width: 90px;">지원 / 선발</th>
                <th class="p-3 font-bold text-center whitespace-nowrap" style="min-width: 120px;">순위 / 등급</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr v-for="item in displayedStats" :key="item.no" class="hover:bg-slate-50/80 text-slate-700 transition-colors" :class="item.is_over_quota ? 'bg-rose-50/30' : ''">
                <td class="p-3 text-center text-slate-500 font-medium">{{ item.no }}</td>
                <td class="p-3 font-bold text-slate-900 whitespace-nowrap w-28">
                  <span class="text-sm font-extrabold text-blue-950">{{ item.univ_name }}</span>
                </td>
                <td class="p-3 font-bold text-slate-800 text-sm whitespace-nowrap">{{ item.display_track_name || item.track_name }}</td>
                <td class="p-3 text-slate-600 text-xs whitespace-pre-line font-medium leading-tight">
                  <span :class="item.grad_condition && item.grad_condition.includes('재학생') ? 'text-amber-700 font-semibold' : 'text-slate-600'">
                    {{ item.grad_condition || '제한없음' }}
                  </span>
                </td>
                <td class="p-3 text-center font-semibold text-slate-800 whitespace-nowrap">
                  {{ item.quota_display }}
                </td>
                <td class="p-3 text-center">
                  <div v-if="item.is_over_quota" class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100/80 text-rose-700 border border-rose-200 text-xs font-black">
                    <span>{{ item.unit_used }}명</span>
                    <span class="text-[11px] font-bold text-rose-600">(정원초과)</span>
                  </div>
                  <div v-else-if="item.unit_used > 0 && item.total_applied > item.unit_used" class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-xs font-black">
                    <span class="font-extrabold text-blue-700">{{ item.unit_used }}명</span>
                    <span class="text-[11px] font-bold text-slate-500">(지원 {{ item.total_applied }}명)</span>
                  </div>
                  <span v-else-if="item.unit_used > 0" class="font-extrabold text-blue-600">
                    {{ item.unit_used }}명
                  </span>
                  <span v-else class="text-slate-400">-</span>
                </td>
                <td class="p-3 text-center font-semibold" :class="item.is_over_quota ? 'text-rose-600 font-bold' : 'text-slate-700'">
                  {{ item.enrolled_used > 0 ? item.enrolled_used + '명' : '-' }}
                  <span v-if="item.is_over_quota && item.enrolled_applied > item.enrolled_used" class="text-[10px] text-rose-500 block">({{ item.enrolled_applied }}지원)</span>
                </td>
                <td class="p-3 text-center font-semibold" :class="item.is_over_quota ? 'text-rose-600 font-bold' : 'text-slate-700'">
                  {{ item.grad_used > 0 ? item.grad_used + '명' : '-' }}
                  <span v-if="item.is_over_quota && item.grad_applied > item.grad_used" class="text-[10px] text-rose-500 block">({{ item.grad_applied }}지원)</span>
                </td>
                <!-- 1. 추천 학생 (학번 / 성명) -->
                <td class="p-3 text-left font-medium text-slate-800 whitespace-nowrap" style="min-width: 140px;">
                  <div v-if="item.students && item.students.length > 0" class="flex flex-col gap-1">
                    <div v-for="std in item.students" :key="std.id || std.student_code" class="whitespace-nowrap flex items-center gap-1.5 h-5 leading-5 text-xs">
                      <span class="font-mono text-slate-600">{{ std.student_code }}</span>
                      <span class="font-bold text-slate-900">{{ std.name }}</span>
                    </div>
                  </div>
                  <span v-else class="text-slate-400">-</span>
                </td>
                <!-- 2. 지원 / 선발 구분 (일반 텍스트) -->
                <td class="p-3 text-center whitespace-nowrap" style="min-width: 80px;">
                  <div v-if="item.students && item.students.length > 0" class="flex flex-col items-center gap-1">
                    <div v-for="std in item.students" :key="std.id || std.student_code" class="whitespace-nowrap flex items-center justify-center h-5 leading-5 text-xs">
                      <span :class="getStudentRoundBadge(std).class">
                        {{ getStudentRoundBadge(std).text }}
                      </span>
                    </div>
                  </div>
                  <span v-else class="text-slate-400">-</span>
                </td>
                <!-- 3. 순위 / 등급 -->
                <td class="p-3 text-center whitespace-nowrap" style="min-width: 110px;">
                  <div v-if="item.students && item.students.length > 0" class="flex flex-col items-center gap-1">
                    <div v-for="std in item.students" :key="std.id || std.student_code" class="whitespace-nowrap flex items-center justify-center h-5 leading-5 text-xs text-slate-600">
                      <span v-if="item.unit_quota != null" class="font-semibold text-slate-800">
                        {{ std.rank }}위<span v-if="std.score_text && std.score_text !== '-'" class="text-slate-500 font-normal ml-1">({{ std.score_text }})</span>
                      </span>
                      <span v-else class="text-slate-600 font-medium">
                        {{ std.score_text && std.score_text !== '-' ? std.score_text : '자격 충족' }}
                      </span>
                    </div>
                  </div>
                  <span v-else class="text-slate-400">-</span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- 하단 선발 인원 통계 (화면용) -->
          <div class="mt-6 border border-slate-200 rounded-xl bg-slate-50/50 p-4 text-xs font-semibold text-slate-700 flex justify-between items-center">
            <div class="flex items-center gap-1">
              <span class="text-xs font-bold text-slate-800">📊 학교장추천 선발 인원 통계 (현 상황 기준)</span>
            </div>
            <div class="flex gap-6 items-center">
              <div class="flex items-center gap-1.5">
                <span class="text-slate-400">총 추천 확정(예정):</span>
                <span class="text-sm font-extrabold text-blue-600">{{ totalRecommendedStats.totalStudents }}명 ({{ totalRecommendedStats.totalCases }}건)</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-slate-400">재학생:</span>
                <span class="font-bold text-slate-800">{{ totalRecommendedStats.enrolledStudents }}명 ({{ totalRecommendedStats.enrolledCases }}건)</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-slate-400">졸업생:</span>
                <span class="font-bold text-slate-800">{{ totalRecommendedStats.gradStudents }}명 ({{ totalRecommendedStats.gradCases }}건)</span>
              </div>
            </div>
          </div>
        </div>
      </template>

        <!-- 2. 추천 포기자 명단 화면용 테이블 (activeViewMode === 'abandoned') -->
        <template v-else-if="activeViewMode === 'abandoned'">
          <div v-if="!filteredAbandonedList || filteredAbandonedList.length === 0" class="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
            <p class="text-base font-bold text-slate-600 mb-1">등록된 추천 포기 학생 데이터가 없습니다.</p>
            <p class="text-xs">학생이 추천 포기원을 제출하고 승인된 내역이 이곳에 표시됩니다.</p>
          </div>

          <div v-else class="flex-1 min-h-0 overflow-y-auto p-6">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-amber-50 text-amber-950 border-b-2 border-amber-300">
                  <th class="p-3 font-bold w-10 text-center">No</th>
                  <th class="p-3 font-bold whitespace-nowrap w-32">대학명</th>
                  <th class="p-3 font-bold whitespace-nowrap">모집단위(전형명)</th>
                  <th class="p-3 font-bold whitespace-nowrap w-32">지원학과</th>
                  <th class="p-3 font-bold text-center w-20 whitespace-nowrap">선발차수</th>
                  <th class="p-3 font-bold whitespace-nowrap w-24 text-center">학번</th>
                  <th class="p-3 font-bold whitespace-nowrap w-24 text-center">성명</th>
                  <th class="p-3 font-bold text-center w-20 whitespace-nowrap">구분</th>
                  <th class="p-3 font-bold text-center w-28 whitespace-nowrap">포기일자</th>
                  <th class="p-3 font-bold">포기 사유</th>
                  <th class="p-3 font-bold text-center w-20 whitespace-nowrap">포기원</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                <tr v-for="(ab, idx) in filteredAbandonedList" :key="ab.id || idx" class="hover:bg-amber-50/40 transition-colors">
                  <td class="p-3 text-center font-medium text-slate-500">{{ idx + 1 }}</td>
                  <td class="p-3 font-extrabold text-blue-950 whitespace-nowrap">{{ ab.univ_name }}</td>
                  <td class="p-3 font-bold text-slate-800 whitespace-nowrap">{{ ab.track_name }}</td>
                  <td class="p-3 text-slate-700 whitespace-nowrap">{{ ab.department_name }}</td>
                  <td class="p-3 text-center font-bold text-indigo-700 whitespace-nowrap">{{ ab.abandoned_round || ab.round }}차</td>
                  <td class="p-3 text-center font-mono text-slate-700 whitespace-nowrap">{{ ab.student_code }}</td>
                  <td class="p-3 text-center font-black text-slate-900 whitespace-nowrap">{{ ab.name }}</td>
                  <td class="p-3 text-center whitespace-nowrap">{{ ab.grade_type }}</td>
                  <td class="p-3 text-center text-slate-600 whitespace-nowrap">{{ ab.date }}</td>
                  <td class="p-3 text-rose-900 font-medium">{{ ab.reason }}</td>
                  <td class="p-3 text-center whitespace-nowrap">
                    <button
                      class="text-[11px] font-bold text-amber-700 hover:bg-amber-100 bg-amber-50 border border-amber-300 px-2 py-1 rounded cursor-pointer transition-colors"
                      title="학생 및 학부모 서명 포기원 서류 개별 출력"
                      @click="printAbandonmentForm(ab.raw_app, ab.raw_student)"
                    >
                      📄출력
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- 하단 포기 인원 통계 요약 바 (화면용) -->
            <div class="mt-6 border border-amber-200 rounded-xl bg-amber-50/50 p-4 text-xs font-semibold text-slate-700 flex justify-between items-center">
              <div class="flex items-center gap-1">
                <span class="text-xs font-bold text-amber-900">📊 추천 포기 인원 통계 (현 상황 기준)</span>
              </div>
              <div class="flex gap-6 items-center">
                <div class="flex items-center gap-1.5">
                  <span class="text-slate-500">총 추천 포기:</span>
                  <span class="text-sm font-extrabold text-rose-600">{{ abandonedStats.students }}명 ({{ abandonedStats.cases }}건)</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="text-slate-500">재학생:</span>
                  <span class="font-bold text-slate-800">{{ abandonedStats.enrolled }}명 ({{ abandonedStats.enrolledCases }}건)</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="text-slate-500">졸업생:</span>
                  <span class="font-bold text-slate-800">{{ abandonedStats.grad }}명 ({{ abandonedStats.gradCases }}건)</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- ── 인쇄 전용 영역 (Print Only Pages) ─────────────────── -->
    <div class="print-only-container" id="report-print-area">
      <!-- 1. 추천 포기자 보고서 (printMode === 'abandoned' 일 때 단독 출력) -->
      <template v-if="printMode === 'abandoned'">
        <div class="print-page print-abandoned-page">
          <!-- 1. 상단 헤더 & 결재란 -->
          <div class="print-header-row">
            <div class="print-title-box">
              <div class="print-school-label">{{ schoolName }}</div>
              <h1 class="print-main-title">학교장추천전형 추천 포기자 결과 보고서 {{ roundLabelText }}</h1>
              <div class="print-sub-desc">대입 학교장추천전형 추천 포기원 접수 및 처리 결과 종합 대장</div>
            </div>

            <!-- 결재란: 계 - 부장 - 교감 - 교장 -->
            <div class="print-approval-box">
              <table class="approval-table">
                <tbody>
                  <tr>
                    <th rowspan="2" class="approval-th-title">결<br>재</th>
                    <td class="approval-cell-header">계</td>
                    <td class="approval-cell-header">부장</td>
                    <td class="approval-cell-header">교감</td>
                    <td class="approval-cell-header">교장</td>
                  </tr>
                  <tr>
                    <td class="approval-cell-sign"></td>
                    <td class="approval-cell-sign"></td>
                    <td class="approval-cell-sign"></td>
                    <td class="approval-cell-sign"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 2. 종합 요약 통계 박스 -->
          <div class="print-summary-stat-box">
            <div class="summary-stat-item">
              <span class="stat-label">총 추천 포기 인원</span>
              <span class="stat-val text-rose-700">{{ abandonedStats.students }}명 ({{ abandonedStats.cases }}건)</span>
            </div>
            <div class="summary-stat-item">
              <span class="stat-label">재학생 포기</span>
              <span class="stat-val text-slate-800">{{ abandonedStats.enrolled }}명 ({{ abandonedStats.enrolledCases }}건)</span>
            </div>
            <div class="summary-stat-item">
              <span class="stat-label">졸업생 포기</span>
              <span class="stat-val text-slate-800">{{ abandonedStats.grad }}명 ({{ abandonedStats.gradCases }}건)</span>
            </div>
            <div class="summary-stat-item">
              <span class="stat-label">선발 차수</span>
              <span class="stat-val text-blue-900">{{ roundLabelText }}</span>
            </div>
            <div class="summary-stat-item">
              <span class="stat-label">기준일시</span>
              <span class="stat-val text-slate-600">{{ currentDate }}</span>
            </div>
          </div>

          <!-- 3. 추천 포기자 명단 종합 테이블 -->
          <div class="print-summary-table-section">
            <div class="print-section-header">
              <span class="print-section-title">■ 추천 포기 학생 명단 (총 {{ filteredAbandonedList.length }}건)</span>
            </div>

            <table class="print-summary-table">
              <thead>
                <tr>
                  <th style="width: 32px;">No</th>
                  <th style="width: 110px;">대학명</th>
                  <th style="width: 150px;">모집단위 (전형명)</th>
                  <th style="width: 110px;">지원학과</th>
                  <th style="width: 50px;">차수</th>
                  <th style="width: 80px;">학번</th>
                  <th style="width: 75px;">성명</th>
                  <th style="width: 55px;">구분</th>
                  <th style="width: 85px; white-space: nowrap;">포기일자</th>
                  <th>포기 사유</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!filteredAbandonedList || filteredAbandonedList.length === 0">
                  <td colspan="10" class="print-empty-cell">해당 조건에 등록된 추천 포기자 내역이 없습니다.</td>
                </tr>
                <tr v-for="(ab, idx) in filteredAbandonedList" :key="ab.id || idx">
                  <td class="text-center font-medium text-slate-500">{{ idx + 1 }}</td>
                  <td class="font-extrabold text-blue-950">{{ ab.univ_name }}</td>
                  <td class="font-bold text-slate-800">{{ ab.track_name }}</td>
                  <td class="text-slate-700">{{ ab.department_name }}</td>
                  <td class="text-center font-bold text-indigo-700">{{ ab.abandoned_round || ab.round }}차</td>
                  <td class="text-center font-mono text-slate-700">{{ ab.student_code }}</td>
                  <td class="text-center font-black text-slate-900">{{ ab.name }}</td>
                  <td class="text-center font-medium">{{ ab.grade_type }}</td>
                  <td class="text-center text-slate-700" style="white-space: nowrap;">{{ ab.date }}</td>
                  <td class="text-left text-slate-800 leading-snug">{{ ab.reason }}</td>
                </tr>
              </tbody>
            </table>

            <div style="margin-top: 14px; font-size: 11px; color: #475569; line-height: 1.6;">
              ※ 본 보고서는 2027학년도 대입 학교장추천전형에서 추천 대상자로 선발(또는 지원)된 후 정당한 사유로 포기원을 제출하여 공식 포기 처리된 학생 명단입니다.<br />
              ※ 포기 처리된 정원은 전형 지침 및 학업성적관리위원회 규정에 따라 차순위 대기 학생에게 승계되거나 다음 차수 잔여 정원으로 이월 처리되었습니다.
            </div>
          </div>
        </div>
      </template>

      <!-- 2. 일반 추천 명단 보고서 (printMode !== 'abandoned' 일 때 기존대로 출력) -->
      <template v-else>
        <!-- 0. [첫 페이지] 전체 통계 및 총괄 종합 현황 페이지 (우측 상단 결재란 포함) -->
        <div class="print-page print-summary-page">
        <!-- 1. 상단 헤더 & 결재란 (총괄 페이지에만 결재란 배치) -->
        <div class="print-header-row">
          <div class="print-title-box">
            <div class="print-school-label">{{ schoolName }}</div>
            <h1 class="print-main-title">학교장추천전형 결과 보고서 {{ roundLabelText }}</h1>
            <div class="print-sub-desc">대입 학교장추천전형 추천 명단 및 정원 관리 종합 대장</div>
          </div>

          <!-- 결재란: 계 - 부장 - 교감 - 교장 -->
          <div class="print-approval-box">
            <table class="approval-table">
              <tbody>
                <tr>
                  <th rowspan="2" class="approval-th-title">결<br>재</th>
                  <td class="approval-cell-header">계</td>
                  <td class="approval-cell-header">부장</td>
                  <td class="approval-cell-header">교감</td>
                  <td class="approval-cell-header">교장</td>
                </tr>
                <tr>
                  <td class="approval-cell-sign"></td>
                  <td class="approval-cell-sign"></td>
                  <td class="approval-cell-sign"></td>
                  <td class="approval-cell-sign"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 2. 종합 요약 통계 박스 -->
        <div class="print-summary-stat-box">
          <div class="summary-stat-item">
            <span class="stat-label">총 추천 대상 전형</span>
            <span class="stat-val text-blue-900">{{ displayedStats.length }}개</span>
          </div>
          <div class="summary-stat-item">
            <span class="stat-label">총 지원 학생 수</span>
            <span class="stat-val">{{ totalAppliedStats.students }}명 ({{ totalAppliedStats.cases }}건)</span>
          </div>
          <div class="summary-stat-item">
            <span class="stat-label">총 추천 선발 인원</span>
            <span class="stat-val text-blue-700">{{ totalRecommendedStats.totalStudents }}명 ({{ totalRecommendedStats.totalCases }}건)</span>
          </div>
          <div class="summary-stat-item">
            <span class="stat-label">재학생 선발</span>
            <span class="stat-val text-emerald-700">{{ totalRecommendedStats.enrolledStudents }}명 ({{ totalRecommendedStats.enrolledCases }}건)</span>
          </div>
          <div class="summary-stat-item">
            <span class="stat-label">졸업생 선발</span>
            <span class="stat-val text-slate-700">{{ totalRecommendedStats.gradStudents }}명 ({{ totalRecommendedStats.gradCases }}건)</span>
          </div>
        </div>

        <!-- 3. 전체 추천 현황 종합 테이블 -->
        <div class="print-summary-table-section">
          <div class="print-section-header">
            <span class="print-section-title">■ 대학별 추천 전형 및 선발 학생 현황 총괄표</span>
          </div>

          <table class="print-summary-table">
            <thead>
              <tr>
                <th style="width: 28px;">No</th>
                <th style="width: 95px;">대학명</th>
                <th style="width: 120px;">모집단위</th>
                <th style="width: 85px;">졸업년도 조건</th>
                <th style="width: 90px;">추천 정원</th>
                <th style="width: 65px;">추천(지원)</th>
                <th style="width: 45px;">재학생</th>
                <th style="width: 45px;">졸업생</th>
                <th style="width: 110px;">추천 학생 (학번/성명)</th>
                <th style="width: 70px;">지원 / 선발</th>
                <th style="width: 85px;">순위 / 등급</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!displayedStats || displayedStats.length === 0">
                <td colspan="11" class="print-empty-cell">등록된 추천 전형 및 학생 데이터가 없습니다.</td>
              </tr>
              <template v-for="item in displayedStats" :key="item.no">
                <!-- 학생이 없는 경우 -->
                <tr v-if="!item.students || item.students.length === 0" :class="item.is_over_quota ? 'bg-rose-50/40' : ''">
                  <td class="text-center font-medium text-slate-500">{{ item.no }}</td>
                  <td class="font-extrabold text-blue-950">{{ item.univ_name }}</td>
                  <td class="font-bold text-slate-800">{{ item.display_track_name || item.track_name }}</td>
                  <td class="text-xs text-slate-600 leading-tight whitespace-pre-line">{{ item.grad_condition || '제한없음' }}</td>
                  <td class="text-center font-bold whitespace-nowrap">{{ item.quota_display }}</td>
                  <td class="text-center font-extrabold" :class="item.is_over_quota ? 'text-rose-600' : 'text-blue-700'">
                    {{ item.unit_used }}명
                    <span v-if="item.is_over_quota" class="text-[10px] text-rose-500 block">({{ item.total_applied }}지원)</span>
                  </td>
                  <td class="text-center font-medium">{{ item.enrolled_used > 0 ? item.enrolled_used + '명' : '-' }}</td>
                  <td class="text-center font-medium">{{ item.grad_used > 0 ? item.grad_used + '명' : '-' }}</td>
                  <td class="text-center text-xs py-1 text-slate-400">-</td>
                  <td class="text-center text-xs py-1 text-slate-400">-</td>
                  <td class="text-center text-xs py-1 text-slate-400">-</td>
                </tr>

                <!-- 학생이 있는 경우 -->
                <tr v-else :class="item.is_over_quota ? 'bg-rose-50/40' : ''">
                  <td class="text-center font-medium text-slate-500 align-middle">{{ item.no }}</td>
                  <td class="font-extrabold text-blue-950 align-middle">{{ item.univ_name }}</td>
                  <td class="font-bold text-slate-800 align-middle">{{ item.display_track_name || item.track_name }}</td>
                  <td class="text-xs text-slate-600 leading-tight whitespace-pre-line align-middle">{{ item.grad_condition || '제한없음' }}</td>
                  <td class="text-center font-bold align-middle whitespace-nowrap">{{ item.quota_display }}</td>
                  <td class="text-center font-extrabold align-middle" :class="item.is_over_quota ? 'text-rose-600' : 'text-blue-700'">
                    {{ item.unit_used }}명
                    <span v-if="item.is_over_quota" class="text-[10px] text-rose-500 block">({{ item.total_applied }}지원)</span>
                  </td>
                  <td class="text-center font-medium align-middle">{{ item.enrolled_used > 0 ? item.enrolled_used + '명' : '-' }}</td>
                  <td class="text-center font-medium align-middle">{{ item.grad_used > 0 ? item.grad_used + '명' : '-' }}</td>
                  <!-- 1. 추천 학생 (학번/성명) -->
                  <td class="text-left text-xs py-1">
                    <div v-for="std in item.students" :key="std.id || std.student_code" class="whitespace-nowrap leading-5 h-5 flex items-center gap-1">
                      <span class="font-mono text-slate-600">{{ std.student_code }}</span>
                      <strong class="text-slate-900">{{ std.name }}</strong>
                    </div>
                  </td>
                  <!-- 2. 지원 / 선발 (일반 텍스트) -->
                  <td class="text-center text-xs py-1">
                    <div v-for="std in item.students" :key="std.id || std.student_code" class="whitespace-nowrap leading-5 h-5 flex items-center justify-center">
                      <span :class="getStudentRoundBadge(std).class" style="print-color-adjust: exact; -webkit-print-color-adjust: exact;">
                        {{ getStudentRoundBadge(std).text }}
                      </span>
                    </div>
                  </td>
                  <!-- 3. 순위 / 등급 -->
                  <td class="text-center text-xs py-1">
                    <div v-for="std in item.students" :key="std.id || std.student_code" class="whitespace-nowrap leading-5 h-5 flex items-center justify-center text-slate-600">
                      <span v-if="item.unit_quota != null" class="font-semibold text-slate-800">
                        {{ std.rank }}위<span v-if="std.score_text && std.score_text !== '-'" class="text-slate-500 font-normal ml-0.5">({{ std.score_text }})</span>
                      </span>
                      <span v-else class="text-slate-600 font-medium">
                        {{ std.score_text && std.score_text !== '-' ? std.score_text : '자격충족' }}
                      </span>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 1. [이후 페이지들] 각 전형별 상세 페이지 (결재란 및 우측 상단 박스 없음) -->
      <div
        v-for="item in displayedStats"
        :key="item.track_id || item.no"
        class="print-page print-detail-page"
      >
        <!-- 1. 페이지 상단 헤더 (우측 상단 비움) -->
        <div class="print-header-row print-detail-header-row">
          <div class="print-title-box">
            <div class="print-school-label">{{ schoolName }}</div>
            <h1 class="print-main-title">학교장추천전형 결과 보고서 {{ roundLabelText }}</h1>
            <div class="print-sub-desc">대입 학교장추천전형 추천 명단 및 정원 관리 대장 (전형별 상세)</div>
          </div>
        </div>

        <!-- 2. 전형 정보 요약 테이블 -->
        <div class="print-info-section">
          <table class="print-info-table">
            <tbody>
              <tr>
                <th class="info-th">대 학 명</th>
                <td class="info-td font-extrabold text-blue-950">{{ item.univ_name }}</td>
                <th class="info-th">모집단위</th>
                <td class="info-td font-extrabold">{{ item.display_track_name || item.track_name }}</td>
              </tr>
              <tr>
                <th class="info-th">추천 제한 정원</th>
                <td class="info-td font-bold">{{ item.quota_display }}</td>
                <th class="info-th">졸업년도 조건</th>
                <td class="info-td font-bold text-slate-800">{{ item.grad_condition || '제한없음' }}</td>
              </tr>
              <tr>
                <th class="info-th">추천 인원 현황</th>
                <td class="info-td" colspan="3">
                  <span class="font-extrabold" :class="item.is_over_quota ? 'text-rose-600 font-black' : 'text-blue-700'">
                    {{ item.unit_used }}명
                    <span v-if="item.is_over_quota" class="text-rose-600 font-bold"> (총 지원 {{ item.total_applied }}명 - 정원 초과)</span>
                  </span>
                  <span class="info-sub" :class="item.is_over_quota ? 'text-rose-600 font-bold' : ''">
                    (재학생 지원: {{ item.enrolled_applied }}명 / 졸업생 지원: {{ item.grad_applied }}명)
                  </span>
                  <span v-if="item.unit_quota != null" class="info-sub font-semibold text-slate-600">
                    <template v-if="selectedRoundFilter === 2 && item.remaining_after_prev !== null">
                      | 1차 후 잔여: {{ item.remaining_after_prev }}명 / 2차 선발 후 잔여: {{ item.remaining_quota }}명
                    </template>
                    <template v-else>
                      | 잔여 정원: {{ item.remaining_quota }}명
                    </template>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 3. 추천 대상 학생 명단 상세 테이블 -->
        <div class="print-student-section">
          <div class="print-section-header">
            <span class="print-section-title">■ 추천 대상 학생 명단 ({{ item.students.length }}명)</span>
            <span class="print-sort-note">
              {{ item.unit_quota != null ? '※ 정원 제한 전형: 성적 추천 순위순 표시' : '※ 정원 미제한 전형: 학번순 표시' }}
            </span>
          </div>

          <table class="print-student-table">
            <thead>
              <tr>
                <th style="width: 42px;">No</th>
                <th v-if="item.unit_quota != null" style="width: 70px;">추천순위</th>
                <th style="width: 80px;">학번</th>
                <th style="width: 90px;">성명</th>
                <th style="width: 75px;">재학구분</th>
                <th style="width: 140px;">환산점수 / 석차등급</th>
                <th>추천 선발</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!item.students || item.students.length === 0">
                <td :colspan="item.unit_quota != null ? 7 : 6" class="print-empty-cell">
                  해당 전형에 추천(지원)된 대상 학생이 없습니다.
                </td>
              </tr>
              <tr v-for="(std, sIdx) in item.students" :key="std.id || std.student_code">
                <td class="text-center text-slate-500 font-medium">{{ sIdx + 1 }}</td>
                <td v-if="item.unit_quota != null" class="text-center font-black text-blue-900">
                  {{ std.rank }}위
                </td>
                <td class="text-center font-mono font-bold">{{ std.student_code }}</td>
                <td class="text-center font-black text-slate-900">{{ std.name }}</td>
                <td class="text-center">{{ std.grade_type }}</td>
                <td class="text-center font-medium">{{ std.score_text || '-' }}</td>
                <td class="text-center text-slate-600 text-xs">
                  <template v-if="item.unit_quota != null">
                    {{ std.rank <= item.unit_quota ? '추천 대상 (선발)' : '정원 초과 (대기)' }}
                  </template>
                  <template v-else>
                    추천 대상 (선발)
                  </template>
                  <span v-if="totalRounds > 1" class="font-bold text-slate-800 ml-1">
                    ({{ getStudentRoundBadge(std).text }})
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 4. 페이지 하단 푸터 (우측 전형 순번만 표시) -->
        <div class="print-footer-row">
          <div class="print-footer-right">전형 순번: {{ item.no }} / {{ displayedStats.length }}</div>
        </div>
      </div>
    </template>
  </div>
</div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { getQuotaStats, exportQuotaStats, exportAbandonedExcel, getDisclosureCount, repairCorruptedAbandonSignatures } from '../../api/admin.js'
import { printAbandonmentForm } from '../../utils/printTemplates.js'
import { schoolName } from '../../utils/schoolConfig.js'
import { dialog } from '../common/dialog.js'
import { supabase } from '../../utils/supabaseClient.js'
import { decryptText } from '../../utils/cryptoUtils.js'
import { formatScore } from '../../utils/scorePreviewShared.js'
import { fetchRoundSchedulesMap, DEFAULT_SCHEDULES, parseKstDate, isRoundAnnouncedOrDone } from '../../utils/roundSchedule.js'
import { getKcueRecommendationApps, buildReportsDataFromKcue, exportKcueQuotaStatsExcel } from '../../utils/recommendationKcueAdapter.js'
import { lookupMasterData, lookupMasterQuota, lookupMasterRawQuota, lookupMasterGradCondition, cleanUnivName } from '../../utils/recommendationMasterData.js'
import { checkIsGraduate } from '../../utils/ruralGraduationHelper.js'

const loading = ref(false)
const downloading = ref(false)
const stats = ref([])
const totalRounds = ref(1)
const disclosureCount = ref(null)
const recommendedList = ref([])
const allApplicantsMap = ref({})
const studentMap = ref({})
const gradConditionMap = ref({})
const selectedRoundFilter = ref('all')
const roundsList = ref([])
const schedulesMap = ref({})
const isUsingKcueArchive = ref(false)
const searchQuery = ref('')
const filterClass = ref('all')
const maxClassCount = computed(() => Number(localStorage.getItem('pcm_class_count')) || 11)
const classNumbers = computed(() => Array.from({ length: maxClassCount.value }, (_, i) => i + 1))

// 화면 및 인쇄 모드 상태
const activeViewMode = ref('recommend') // 'recommend' | 'abandoned'
const printMode = ref('recommend') // 'recommend' | 'recommend_only' | 'abandoned'
const abandonedList = ref([])

const filteredAbandonedList = computed(() => {
  const curRound = selectedRoundFilter.value === 'all' ? null : Number(selectedRoundFilter.value)
  let list = abandonedList.value

  // 1. 차수 필터
  if (curRound !== null && !isNaN(curRound)) {
    list = list.filter(item => (item.abandoned_round != null ? item.abandoned_round : item.round) === curRound)
  }

  // 2. 학급 필터
  if (filterClass.value && filterClass.value !== 'all') {
    if (filterClass.value === 'grad') {
      list = list.filter(item => item.grade_type === '졸업생' || item.is_graduated)
    } else {
      const targetClass = Number(filterClass.value)
      list = list.filter(item => {
        if (item.grade_type === '졸업생' || item.is_graduated) return false
        const code = String(item.student_code || item.raw_app?.student_code || '')
        let c = item.class_no ?? item.raw_student?.class_no
        if (c == null && code.length >= 5) {
          const parsed = parseInt(code.substring(1, 3), 10)
          if (!isNaN(parsed) && parsed > 0) c = parsed
        }
        return c === targetClass
      })
    }
  }

  // 3. 검색어 필터
  const q = (searchQuery.value || '').trim().toLowerCase()
  if (q) {
    list = list.filter(item => {
      const uMatch = (item.univ_name || '').toLowerCase().includes(q)
      const tMatch = (item.track_name || '').toLowerCase().includes(q)
      const dMatch = (item.department_name || '').toLowerCase().includes(q)
      const nMatch = (item.name || '').toLowerCase().includes(q)
      const cMatch = (item.student_code || '').toLowerCase().includes(q)
      const rMatch = (item.reason || '').toLowerCase().includes(q)
      return uMatch || tMatch || dMatch || nMatch || cMatch || rMatch
    })
  }

  return list
})

const abandonedStats = computed(() => {
  const list = filteredAbandonedList.value
  const studentSet = new Set()
  let enrolledCases = 0
  const enrolledStudentSet = new Set()
  let gradCases = 0
  const gradStudentSet = new Set()

  for (const ab of list) {
    if (ab.student_id) studentSet.add(ab.student_id)
    if (ab.grade_type === '졸업생') {
      gradCases++
      if (ab.student_id) gradStudentSet.add(ab.student_id)
    } else {
      enrolledCases++
      if (ab.student_id) enrolledStudentSet.add(ab.student_id)
    }
  }

  return {
    students: studentSet.size,
    cases: list.length,
    enrolled: enrolledStudentSet.size,
    enrolledCases,
    grad: gradStudentSet.size,
    gradCases
  }
})

/**
 * 학생별 지원/선발 배지 상태 반환
 * - 1차 선발이 확정된 경우: 'N차 선발' (초록색 계열)
 * - 선발 진행 중인 경우(해당 차수 접수 시작부터 선정 협의일까지): 'N차 지원' (인디고 계열)
 */
function getStudentRoundBadge(std) {
  if (std.is_recommended === false) {
    return {
      type: 'wait',
      text: '정원초과 (대기)',
      class: 'text-rose-600 font-bold text-xs'
    }
  }
  const roundNum = std.recommended_round ?? std.round ?? 1
  if (roundNum === 0) {
    return {
      type: 'selected',
      text: '사전 선발',
      class: 'text-emerald-700 font-bold text-xs'
    }
  }
  return {
    type: 'selected',
    text: `${roundNum}차 선발`,
    class: 'text-emerald-700 font-bold text-xs'
  }
}

const roundOptions = computed(() => {
  const tr = Math.max(totalRounds.value || 1, 2)
  const list = []
  for (let i = 1; i <= tr; i++) {
    list.push(i)
  }
  return list
})

const roundLabelText = computed(() => {
  if (selectedRoundFilter.value === 'all') {
    const completedCount = (roundsList.value || []).filter(r => isRoundAnnouncedOrDone(r, schedulesMap.value[r.id])).length
    if (completedCount >= totalRounds.value && totalRounds.value > 1) {
      return `(전체 ${totalRounds.value}차 합산)`
    }
    if (completedCount >= 2) {
      return `(1~${completedCount}차 누적 합산)`
    }
    return '(전체 합산)'
  }
  if (Number(selectedRoundFilter.value) === 0) return '(사전 선발)'
  return `(${selectedRoundFilter.value}차 선발)`
})

/**
 * 표시용 인원 포맷 함수
 * raw_quota_limit이 %이면 '10명 (3%)' 형식, 2차 이상일 경우 '총 10명 (잔여 4명)' 형태로 총 제한 정원과 잔여정원을 함께 표시
 */
function formatQuotaDisplay(unitQuota, rawQuotaLimit, round = null, remainingAfterPrev = null) {
  let baseStr = ''
  if (rawQuotaLimit) {
    const str = String(rawQuotaLimit).trim()
    const num = parseFloat(str)
    let pct = null
    if (!isNaN(num) && num > 0 && num < 1) {
      pct = num * 100
    } else {
      const m = str.match(/^(\d+(?:\.\d+)?)\s*%$/)
      if (m) pct = parseFloat(m[1])
    }
    if (pct !== null) {
      const pctClean = parseFloat(pct.toPrecision(10))
      if (unitQuota != null && unitQuota > 0) {
        baseStr = `${unitQuota}명 (${pctClean}%)`
      } else if (disclosureCount.value) {
        const calc = Math.ceil(disclosureCount.value * pct / 100)
        baseStr = `${calc}명 (${pctClean}%)`
      } else {
        baseStr = `${pctClean}%`
      }
    }
  }
  if (!baseStr) {
    baseStr = unitQuota != null ? `${unitQuota}명` : '무제한'
  }

  if (baseStr === '무제한' || unitQuota == null) return '무제한'

  // 2차 이상일 때 총 제한 정원과 이전 차수 후 잔여 정원을 함께 표시
  if (round && round >= 2 && remainingAfterPrev !== null) {
    return `총 ${baseStr} (잔여 ${remainingAfterPrev}명)`
  }

  return baseStr
}

/**
 * 대학명 오름차순 -> 전형명 오름차순으로 정렬된 평탄화 데이터 목록
 * 각 전형 내부 학생: 정원 제한이 있는 경우 순위 오름차순, 없는 경우 학번 오름차순
 */
const flatStats = computed(() => {
  const list = []
  const normKey = s => (s || '').trim().toLowerCase().replace(/\s+/g, '')
  const curRound = selectedRoundFilter.value === 'all' ? null : Number(selectedRoundFilter.value)
  
  for (const u of (stats.value || [])) {
    for (const t of (u.tracks || [])) {
      const allTrackApps = allApplicantsMap.value[t.track_id] || []
      const allTrackRecs = recommendedList.value.filter(ap => ap.univ_id === t.track_id && ap.is_recommended !== false)
      const hasQuota = t.unit_quota != null

      // 이전 차수(1차 등)에서 선발된 인원 계산
      let prevUsedCount = 0
      if (curRound != null && curRound >= 2) {
        prevUsedCount = allTrackRecs.filter(ap => {
          const r = ap.recommended_round ?? ap.round ?? 1
          return r < curRound
        }).length
      }

      const remainingAfterPrev = hasQuota ? Math.max(0, t.unit_quota - prevUsedCount) : null

      // 현재 완료된(선정결과 공지 시작 이후) 차수 목록
      const completedRoundIds = new Set(
        (roundsList.value || []).filter(r => isRoundAnnouncedOrDone(r, schedulesMap.value[r.id])).map(r => r.id)
      )

      // 현재 선택된 차수 기준 추천 대상 학생들
      let trackApps = []
      if (curRound === null || isNaN(curRound)) {
        // [합산 모드]:
        // 1,2차가 끝나고 3차 종료 전까지는 1차와 2차를 합산한 결과
        // 3차가 종료된 이후부터는 1,2,3차가 합산되어서 보여짐 (2027년 2월 28일까지 상시 유지)
        if (completedRoundIds.size > 0) {
          trackApps = allTrackRecs.filter(ap => {
            const r = ap.recommended_round ?? ap.round ?? 1
            return completedRoundIds.has(r)
          })
        } else {
          trackApps = allTrackRecs.filter(ap => (ap.recommended_round ?? ap.round ?? 1) === 1)
        }
      } else {
        trackApps = allTrackRecs.filter(ap => {
          const r = ap.recommended_round ?? ap.round ?? 1
          return r === curRound
        })
      }
      
      // 정원제한이 있는 경우: unit_quota를 초과하지 않도록 보장
      if (hasQuota && trackApps.length > t.unit_quota) {
        trackApps = trackApps.slice(0, t.unit_quota)
      }

      // 정원제한이 있는 경우 추천 순위 순, 없는 경우 학번순 정렬
      trackApps.sort((a, b) => {
        if (hasQuota) {
          if (a.rank !== b.rank) return a.rank - b.rank
          return (a.student_code || '').localeCompare(b.student_code || '')
        } else {
          return (a.student_code || '').localeCompare(b.student_code || '')
        }
      })

      let enrolledCount = 0
      let gradCount = 0

      const studentsArray = trackApps.map(ap => {
        const stInfo = studentMap.value[ap.student_id] || {}
        const rawCode = String(ap.student_code || '').trim()
        const code5 = rawCode.length > 5 ? rawCode.slice(-5) : rawCode
        const isGrad = checkIsGraduate({ ...stInfo, ...ap, student_code: rawCode })
        if (isGrad) {
          gradCount++
        } else {
          enrolledCount++
        }
        let displayCode = code5
        if (isGrad && stInfo.grad_year) {
          displayCode = `${code5}(${stInfo.grad_year})`
        }
        const appRound = ap.round != null ? ap.round : 1
        const recRound = ap.recommended_round != null ? ap.recommended_round : (ap.round != null ? ap.round : 1)
        let stdClass = stInfo.class_no != null ? Number(stInfo.class_no) : (ap.class_no != null ? Number(ap.class_no) : null)
        if (!stdClass && rawCode.length >= 5 && !isGrad) {
          const parsed = parseInt(rawCode.substring(1, 3), 10)
          if (!isNaN(parsed) && parsed > 0) stdClass = parsed
        }
        return {
          id: ap.id,
          student_id: ap.student_id,
          student_code: displayCode,
          raw_student_code: rawCode,
          name: ap.name,
          rank: ap.rank,
          score_text: ap.score_text,
          round: appRound,
          recommended_round: recRound,
          is_recommended: !!ap.is_recommended,
          grade_type: isGrad ? '졸업생' : '재학생',
          is_graduated: isGrad,
          class_no: isGrad ? null : stdClass,
          suffix: hasQuota ? `(${ap.rank}위, ${ap.score_text})` : ''
        }
      })

      const usedCount = studentsArray.length

      // 전체 지원자 통계 (재학생/졸업생 지원수, 차수 필터 적용)
      let relevantAppliedApps = allTrackApps
      if (curRound !== null && !isNaN(curRound)) {
        relevantAppliedApps = allTrackApps.filter(ap => (ap.round != null ? ap.round : 1) === curRound)
      }

      let totalApplied = relevantAppliedApps.length
      let enrolledApplied = 0
      let gradApplied = 0
      for (const ap of relevantAppliedApps) {
        const stInfo = studentMap.value[ap.student_id] || {}
        const rawCode = String(ap.student_code || stInfo.student_code || '').trim()
        const isGrad = checkIsGraduate({ ...stInfo, ...ap, student_code: rawCode })
        if (isGrad) gradApplied++
        else enrolledApplied++
      }

      // 추천 제한 인원이 있는 경우, 추천 선발 인원(usedCount)이 제한 인원을 초과했는지 여부
      const effectiveQuota = curRound && curRound >= 2 ? (remainingAfterPrev ?? 0) : (t.unit_quota ?? 0)
      const isOverQuota = hasQuota && effectiveQuota > 0 && usedCount > effectiveQuota

      // 졸업년도 조건 매핑 (1순위: 대학_전형 정확 매칭, 2순위: 대학명 fallback)
            const uNorm = normKey(u.univ_name)
      const tNorm = normKey(t.track_name)
      const uClean = normKey(cleanUnivName(u.univ_name))
      const gradCond = t.grad_condition ||
                       gradConditionMap.value[`${uNorm}__${tNorm}`] ||
                       gradConditionMap.value[uNorm] ||
                       gradConditionMap.value[`${uClean}__${tNorm}`] ||
                       gradConditionMap.value[uClean] ||
                       lookupMasterGradCondition(u.univ_name, t.track_name) ||
                       '졸업생 가능'

      const quotaDisplay = t.quota_display || formatQuotaDisplay(t.unit_quota, t.raw_quota_limit, curRound, remainingAfterPrev)
      const trackType = String(t.track_type || '').trim()
      const displayTrackName = trackType ? `(${trackType}) ${t.track_name}` : t.track_name

      list.push({
        univ_name: u.univ_name,
        region: u.region,
        track_name: t.track_name,
        track_type: trackType,
        display_track_name: displayTrackName,
        track_id: t.track_id,
        grad_condition: gradCond,
        unit_quota: t.unit_quota,
        raw_quota_limit: t.raw_quota_limit ?? null,
        quota_display: quotaDisplay,
        prev_used: prevUsedCount,
        remaining_after_prev: remainingAfterPrev,
        unit_used: usedCount,
        enrolled_used: enrolledCount,
        grad_used: gradCount,
        total_applied: totalApplied,
        enrolled_applied: enrolledApplied,
        grad_applied: gradApplied,
        is_over_quota: isOverQuota,
        remaining_quota: hasQuota ? Math.max(0, (remainingAfterPrev ?? t.unit_quota) - usedCount) : null,
        students: studentsArray
      })
    }
  }

  // 각 전형별 오름차순 정렬: 대학명(가나다순) -> 전형명(가나다순)
  list.sort((a, b) => {
    const uCmp = (a.univ_name || '').localeCompare(b.univ_name || '', 'ko')
    if (uCmp !== 0) return uCmp
    return (a.track_name || '').localeCompare(b.track_name || '', 'ko')
  })

  // 순번 No 재할당
  list.forEach((item, idx) => {
    item.no = idx + 1
  })

  return list
})

const printOnlyWithRecommendations = ref(false)

const displayedStats = computed(() => {
  const isClassFilterActive = filterClass.value && filterClass.value !== 'all'
  const q = (searchQuery.value || '').trim().toLowerCase()
  const targetClass = isClassFilterActive && filterClass.value !== 'grad' ? Number(filterClass.value) : null

  let baseList = flatStats.value

  const result = []

  for (const item of baseList) {
    // 1. 해당 트랙 내 학생들을 학급 필터 및 검색어에 맞춰 선별
    const matchedStudents = (item.students || []).filter(std => {
      // 1-1. 학급 필터
      if (isClassFilterActive) {
        if (filterClass.value === 'grad') {
          if (!std.is_graduated && std.grade_type !== '졸업생') return false
        } else {
          if (std.is_graduated || std.grade_type === '졸업생') return false
          if (std.class_no !== targetClass) return false
        }
      }
      // 1-2. 검색어 필터
      if (q) {
        const uMatch = (item.univ_name || '').toLowerCase().includes(q)
        const tMatch = (item.track_name || '').toLowerCase().includes(q)
        const dMatch = (item.display_track_name || '').toLowerCase().includes(q)
        const sNameMatch = (std.name || '').toLowerCase().includes(q)
        const sCodeMatch = (std.student_code || '').toLowerCase().includes(q) || (std.raw_student_code || '').toLowerCase().includes(q)
        if (!uMatch && !tMatch && !dMatch && !sNameMatch && !sCodeMatch) return false
      }
      return true
    })

    // 2. 대학명/전형명 자체 매칭 여부
    const trackTextMatches = q ? (
      (item.univ_name || '').toLowerCase().includes(q) ||
      (item.track_name || '').toLowerCase().includes(q) ||
      (item.display_track_name || '').toLowerCase().includes(q)
    ) : true

    // 3. 행(row) 표출 여부 결정
    // - 학급 필터가 활성화된 경우: 해당 학급 학생이 존재하는 전형만 표출
    // - 학급 필터가 전체('all')이고 검색어가 있는 경우: 전형명 매칭이거나 학생 매칭인 경우 표출
    // - 인쇄 전용(printOnlyWithRecommendations)인 경우: 추천자가 있는 전형만 표출
    if (isClassFilterActive) {
      if (matchedStudents.length === 0) continue
    } else if (q) {
      if (!trackTextMatches && matchedStudents.length === 0) continue
    } else if (printOnlyWithRecommendations.value) {
      if (item.unit_used === 0 && item.total_applied === 0) continue
    }

    const enrolledMatched = matchedStudents.filter(s => !s.is_graduated && s.grade_type !== '졸업생').length
    const gradMatched = matchedStudents.filter(s => s.is_graduated || s.grade_type === '졸업생').length

    result.push({
      ...item,
      students: matchedStudents,
      unit_used: isClassFilterActive ? matchedStudents.length : item.unit_used,
      enrolled_used: isClassFilterActive ? enrolledMatched : item.enrolled_used,
      grad_used: isClassFilterActive ? gradMatched : item.grad_used
    })
  }

  // 순번 No 재할당
  return result.map((item, idx) => ({
    ...item,
    no: idx + 1
  }))
})

const totalAppliedStats = computed(() => {
  const curRound = selectedRoundFilter.value === 'all' ? null : Number(selectedRoundFilter.value)
  const studentSet = new Set()
  let cases = 0
  for (const trackId in (allApplicantsMap.value || {})) {
    const list = allApplicantsMap.value[trackId] || []
    for (const ap of list) {
      if (curRound !== null && !isNaN(curRound) && (ap.round != null ? ap.round : 1) !== curRound) continue
      if (ap.student_id) studentSet.add(ap.student_id)
      cases++
    }
  }
  return {
    students: studentSet.size,
    cases
  }
})

const totalRecommendedStats = computed(() => {
  const totalSet = new Set()
  const enrolledSet = new Set()
  const gradSet = new Set()
  
  let totalCases = 0
  let enrolledCases = 0
  let gradCases = 0

  for (const item of displayedStats.value) {
    for (const std of (item.students || [])) {
      totalCases++
      totalSet.add(std.student_id)
      if (std.grade_type === '졸업생') {
        gradCases++
        gradSet.add(std.student_id)
      } else {
        enrolledCases++
        enrolledSet.add(std.student_id)
      }
    }
  }

  return {
    totalStudents: totalSet.size,
    totalCases,
    enrolledStudents: enrolledSet.size,
    enrolledCases,
    gradStudents: gradSet.size,
    gradCases,
    total: totalCases,
    enrolled: enrolledCases,
    grad: gradCases
  }
})

function getRoundGroups(students) {
  if (!students || students.length === 0) return []
  const map = new Map()
  for (const std of students) {
    const r = std.recommended_round ?? std.round ?? 1
    const roundKey = (r !== null && r !== undefined && !isNaN(Number(r))) ? Number(r) : 1
    if (!map.has(roundKey)) {
      map.set(roundKey, {
        roundKey,
        roundText: roundKey === 0 ? '사전' : `${roundKey}차`,
        students: []
      })
    }
    map.get(roundKey).students.push(std)
  }
  return Array.from(map.values()).sort((a, b) => a.roundKey - b.roundKey)
}

const currentDate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
})

function applyKcueArchiveFallback(gMap = null, existingStats = null, regRecs = null, dbAbandonedList = null) {
  // 관리자가 '대학 설정'에 넣어둔 기준(existingStats 또는 regRecs)을 최우선으로 사용하여 데이터 생성
  const kcueData = buildReportsDataFromKcue(null, existingStats, regRecs)
  isUsingKcueArchive.value = true
  stats.value = (existingStats && existingStats.length > 0) ? existingStats : kcueData.stats
  allApplicantsMap.value = kcueData.allApplicantsMap
  recommendedList.value = kcueData.recommendedList
  studentMap.value = kcueData.studentMap
  // 1순위: DB에 이미 저장된 포기자 목록 / 2순위: 2027 원장 복수 지원 기반 차수별 포기자 목록
  abandonedList.value = (dbAbandonedList && dbAbandonedList.length > 0) ? dbAbandonedList : (kcueData.abandonedList || [])
  roundsList.value = [
    { id: 1, name: '1차 선발', status: 'FINALIZED' },
    { id: 2, name: '2차 선발', status: 'FINALIZED' },
    { id: 3, name: '3차 선발', status: 'FINALIZED' }
  ]
  totalRounds.value = 3
  selectedRoundFilter.value = 'all'
  if (gMap && Object.keys(gMap).length > 0) {
    gradConditionMap.value = gMap
  }
}

async function loadData() {
  loading.value = true
  try {
    try {
      await repairCorruptedAbandonSignatures()
    } catch (err) {
      console.warn('포기원 서명 자동 복구 예외:', err)
    }
    if (!supabase) {
      applyKcueArchiveFallback()
      return
    }

    stats.value = await getQuotaStats()
    if (supabase) {
      // 1. 지원서, 학생 마스터, 프로필, 수도권/지역 추천 전형(졸업조건), 라운드 목록, 라운드 일정 로드
      const [{ data: allAppsRaw }, { data: students }, { data: profilesData }, { data: regRecs }, { data: roundsData }, sMap] = await Promise.all([
        supabase.from('applications').select('*, universities:univ_id(*)'),
        supabase.from('enrolled_students').select('id, name, student_code, gpa_overall, grad_year, grade, class_no, seq_no, is_enrolled'),
        supabase.from('profiles').select('id, name, student_code, grad_year, grade, class_no, seq_no, is_enrolled'),
        supabase.from('regional_recommendations').select('univ_name, track_name, grad_condition'),
        supabase.from('timeline_rounds').select('*').order('id'),
        fetchRoundSchedulesMap()
      ])

      roundsList.value = roundsData || []
      schedulesMap.value = sMap || {}

      // 졸업년도 조건 맵 구성
      const normKey = s => (s || '').trim().toLowerCase().replace(/\s+/g, '')
      const gMap = {}
      for (const r of (regRecs || [])) {
        if (r.grad_condition) {
          const uKey = normKey(r.univ_name)
          const tKey = normKey(r.track_name)
          gMap[`${uKey}__${tKey}`] = r.grad_condition
          if (!gMap[uKey]) gMap[uKey] = r.grad_condition
          const uClean = normKey(cleanUnivName(r.univ_name))
          if (!gMap[uClean]) gMap[uClean] = r.grad_condition
          gMap[`${uClean}__${tKey}`] = r.grad_condition
        }
      }
      gradConditionMap.value = gMap

      const studentMapLocal = {}
      for (const s of (students || [])) {
        const decName = await decryptText(s.name)
        const isGrad = checkIsGraduate(s)
        studentMapLocal[s.id] = {
          id: s.id,
          name: decName,
          student_code: s.student_code || '',
          grade: s.grade,
          class_no: s.class_no,
          seq_no: s.seq_no,
          gpa_overall: s.gpa_overall,
          grad_year: s.grad_year || null,
          is_enrolled: !isGrad,
          is_graduated: isGrad
        }
      }
      for (const p of (profilesData || [])) {
        if (!studentMapLocal[p.id]) {
          const decName = await decryptText(p.name)
          const isGrad = checkIsGraduate(p)
          studentMapLocal[p.id] = {
            id: p.id,
            name: decName,
            student_code: p.student_code || '',
            grade: p.grade,
            class_no: p.class_no,
            seq_no: p.seq_no,
            gpa_overall: null,
            grad_year: p.grad_year || null,
            is_enrolled: !isGrad,
            is_graduated: isGrad
          }
        }
      }
      studentMap.value = studentMapLocal

      // 2. 대학/트랙 정원 매핑 테이블 구성
      const trackQuotaMap = {}
      const trackInfoMap = {}
      for (const u of (stats.value || [])) {
        for (const t of (u.tracks || [])) {
          trackQuotaMap[t.track_id] = t.unit_quota
          trackInfoMap[t.track_id] = {
            univ_name: u.univ_name,
            track_name: t.track_name,
            track_type: t.track_type,
            unit_quota: t.unit_quota
          }
        }
      }

      // 포기된 지원서(DB) 선행 추출 및 목록 구성
      const rawAbandonedApps = (allAppsRaw || []).filter(ap => {
        if (ap.is_abandoned) return true
        if (ap.scanned_doc_url) {
          try {
            const parsed = typeof ap.scanned_doc_url === 'string' ? JSON.parse(ap.scanned_doc_url) : ap.scanned_doc_url
            if (parsed?.abandon_requested === true) return true
          } catch {}
        }
        return false
      })

      const abList = []
      for (const ap of rawAbandonedApps) {
        const s = studentMapLocal[ap.student_id] || {}
        let reqMeta = {}
        if (ap.scanned_doc_url) {
          try {
            reqMeta = typeof ap.scanned_doc_url === 'string' ? JSON.parse(ap.scanned_doc_url) : ap.scanned_doc_url
          } catch {}
        }
        const tInfo = trackInfoMap[ap.univ_id] || {}
        const univName = ap.universities?.univ_name || tInfo.univ_name || ap.univ_name || ''
        const trackName = ap.universities?.track_name || tInfo.track_name || ap.track_name || ''
        const isGrad = checkIsGraduate(s)
        const reason = reqMeta.abandon_reason || ap.abandon_reason || ap.excluded_reason || '개인 사유로 인한 추천 포기'
        const reqDate = reqMeta.requested_at || ap.abandoned_at || ap.updated_at || ap.created_at
        let dateStr = '-'
        if (reqDate) {
          const d = new Date(reqDate)
          if (!isNaN(d.getTime())) {
            const y = d.getFullYear()
            const m = String(d.getMonth() + 1).padStart(2, '0')
            const day = String(d.getDate()).padStart(2, '0')
            dateStr = `${y}-${m}-${day}`
          }
        }

        abList.push({
          id: ap.id,
          student_id: ap.student_id,
          student_code: s.student_code || '',
          name: s.name || ap.name || '',
          grade_type: isGrad ? '졸업생' : '재학생',
          univ_name: univName,
          track_name: trackName,
          department_name: ap.department_name || '-',
          round: ap.round != null ? ap.round : 1,
          abandoned_round: ap.abandoned_round != null ? ap.abandoned_round : (ap.round != null ? ap.round : 1),
          reason,
          date: dateStr,
          raw_app: ap,
          raw_student: s
        })
      }

      abList.sort((a, b) => {
        const uCmp = (a.univ_name || '').localeCompare(b.univ_name || '', 'ko')
        if (uCmp !== 0) return uCmp
        const tCmp = (a.track_name || '').localeCompare(b.track_name || '', 'ko')
        if (tCmp !== 0) return tCmp
        return (a.student_code || '').localeCompare(b.student_code || '')
      })
      abandonedList.value = abList

      // 지원서 분리: 유효 추천 지원서 vs 포기된 지원서
      const allApps = (allAppsRaw || []).filter(ap => !ap.is_abandoned)

      // 유효 추천 지원서가 없는 경우 (수시 추천 종료 후 아카이브 모드: 2027 원서접수 확정 원장 자동 연동)
      if (allApps.length === 0) {
        applyKcueArchiveFallback(gMap, stats.value, regRecs, abList)
        return
      }

      isUsingKcueArchive.value = false

      // 3. 대학(univ_id=track_id)별로 지원서를 그룹화하여 석차(순위) 계산
      const groupedByTrack = {}
      allApps?.forEach(ap => {
        const key = ap.univ_id
        if (!groupedByTrack[key]) groupedByTrack[key] = []
        groupedByTrack[key].push(ap)
      })
      allApplicantsMap.value = groupedByTrack

      const rankMap = {}
      const selectedApps = []
      const overQuotaApps = []

      // 학생별 복수 지원 차수(1차/2차/3차) 자동 분배
      const allRoundsAreOne = allApps.every(ap => (ap.round == null || Number(ap.round) === 1) && (ap.recommended_round == null || Number(ap.recommended_round) === 1))
      const studentRecOrderMap = {}
      if (allRoundsAreOne) {
        const sortedForOrder = [...allApps].sort((a, b) => {
          const scoreA = a.univ_calc_score != null ? Number(a.univ_calc_score) : (a.manual_score != null ? Number(a.manual_score) : null)
          const scoreB = b.univ_calc_score != null ? Number(b.univ_calc_score) : (b.manual_score != null ? Number(b.manual_score) : null)
          if (scoreA !== null && scoreB !== null && scoreA !== scoreB) return scoreB - scoreA
          return new Date(a.created_at || 0) - new Date(b.created_at || 0)
        })
        sortedForOrder.forEach(ap => {
          const ord = studentRecOrderMap[ap.student_id] || 0
          studentRecOrderMap[ap.student_id] = ord + 1
          ap.calculated_round = Math.min(ord + 1, totalRounds.value || 3)
        })
      }

      Object.keys(groupedByTrack).forEach(trackId => {
        const list = groupedByTrack[trackId]
        const unitQuota = trackQuotaMap[trackId]

        // 성적순 정렬: 환산점수 내림차순 -> 내신석차등급 오름차순 -> 학번 오름차순
        list.sort((a, b) => {
          const stA = studentMapLocal[a.student_id] || {}
          const stB = studentMapLocal[b.student_id] || {}

          const scoreA = a.univ_calc_score != null ? Number(a.univ_calc_score) : (a.manual_score != null ? Number(a.manual_score) : null)
          const scoreB = b.univ_calc_score != null ? Number(b.univ_calc_score) : (b.manual_score != null ? Number(b.manual_score) : null)

          if (scoreA !== null && scoreB !== null && scoreA !== scoreB) {
            return scoreB - scoreA
          }

          const gpaA = stA.gpa_overall != null && Number(stA.gpa_overall) > 0 ? Number(stA.gpa_overall) : 99
          const gpaB = stB.gpa_overall != null && Number(stB.gpa_overall) > 0 ? Number(stB.gpa_overall) : 99

          if (gpaA !== gpaB) {
            return gpaA - gpaB
          }

          return (stA.student_code || '').localeCompare(stB.student_code || '')
        })

        // 석차(rank) 매김
        list.forEach((ap, idx) => {
          const rank = idx + 1
          rankMap[ap.id] = rank

          // [현 상황 추천 선발 대상 판정]
          // 정원 제한이 있는 경우: 반드시 석차가 정원 이내(rank <= unitQuota)여야만 추천 선발 대상!
          // 정원 제한이 없는 경우(무제한): DB의 is_recommended 상태 또는 전체 지원 학생
          const isSelected = unitQuota != null ? (rank <= unitQuota) : (ap.is_recommended !== false)
          const s = studentMapLocal[ap.student_id] || {}
          const scoreVal = ap.univ_calc_score != null ? ap.univ_calc_score : ap.manual_score
          let scoreText = ''
          if (scoreVal != null && Number(scoreVal) > 0) {
            scoreText = `${formatScore(scoreVal)}점`
          } else if (s.gpa_overall != null && Number(s.gpa_overall) > 0) {
            scoreText = `${Number(s.gpa_overall).toFixed(2)}등급`
          } else {
            scoreText = '-'
          }

          const effRound = ap.calculated_round || (ap.recommended_round != null ? ap.recommended_round : (ap.round != null ? ap.round : 1))

          const isGrad = checkIsGraduate(s) || s.is_enrolled === false || !s.grade || Number(s.grade) === 0
          const code = s.student_code || ap.student_code || ''
          let cNo = s.class_no || ap.class_no
          if (!cNo && code.length >= 5 && !isGrad) {
            const parsed = parseInt(code.substring(1, 3), 10)
            if (!isNaN(parsed) && parsed > 0) cNo = parsed
          }

          if (isSelected) {
            selectedApps.push({
              id: ap.id,
              student_id: ap.student_id,
              univ_id: ap.univ_id,
              round: effRound,
              recommended_round: effRound,
              is_recommended: true,
              student_code: s.student_code || '',
              name: s.name || '',
              grade_type: isGrad ? '졸업생' : '재학생',
              is_graduated: isGrad,
              class_no: isGrad ? null : cNo,
              rank: rank,
              score_text: scoreText
            })
          } else {
            // 정원 초과 미선발 지원서 수집 -> 포기자 명단에 추가
            const tInfo = trackInfoMap[ap.univ_id] || {}
            overQuotaApps.push({
              id: `db_over_quota_${ap.id}`,
              student_id: ap.student_id,
              student_code: code,
              class_no: isGrad ? null : cNo,
              is_graduated: isGrad,
              name: s.name || ap.name || '',
              grade_type: isGrad ? '졸업생' : '재학생',
              univ_name: ap.universities?.univ_name || tInfo.univ_name || ap.univ_name || '',
              track_name: ap.universities?.track_name || tInfo.track_name || ap.track_name || '',
              department_name: ap.department_name || '-',
              round: effRound,
              abandoned_round: effRound,
              reason: `추천 제한 정원 초과 (${rank}위, ${scoreText})`,
              date: '2026-09-02',
              raw_app: { ...ap, is_abandoned: true },
              raw_student: s
            })
          }
        })
      })

      recommendedList.value = selectedApps

      // DB에 명시된 포기원(abList) + 정원 초과 미선발 지원 건(overQuotaApps) 합산
      const combinedAbandoned = [...abList, ...overQuotaApps]
      if (combinedAbandoned.length === 0) {
        const kcueData = buildReportsDataFromKcue(null, stats.value, regRecs)
        abandonedList.value = kcueData.abandonedList || []
      } else {
        combinedAbandoned.sort((a, b) => {
          const uCmp = (a.univ_name || '').localeCompare(b.univ_name || '', 'ko')
          if (uCmp !== 0) return uCmp
          const tCmp = (a.track_name || '').localeCompare(b.track_name || '', 'ko')
          if (tCmp !== 0) return tCmp
          return (a.student_code || '').localeCompare(b.student_code || '')
        })
        abandonedList.value = combinedAbandoned
      }
    }
  } catch (e) {
    console.warn('보고서 데이터 조회 예외, 2027 원장 아카이브로 폴백:', e)
    applyKcueArchiveFallback(gradConditionMap.value, stats.value)
  } finally {
    loading.value = false
  }
}

async function downloadExcel() {
  downloading.value = true
  try {
    const isPreRound = selectedRoundFilter.value !== 'all' && Number(selectedRoundFilter.value) === 0
    const roundStr = selectedRoundFilter.value === 'all' ? '전체' : (isPreRound ? '사전' : `${selectedRoundFilter.value}차`)
    if (activeViewMode.value === 'abandoned') {
      const blob = exportAbandonedExcel(filteredAbandonedList.value, roundStr)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `학교장추천전형_${roundStr}_추천포기자_명단_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
      return
    }

    if (isUsingKcueArchive.value) {
      const blob = exportKcueQuotaStatsExcel(flatStats.value, roundStr)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `2027학년도_학교장추천전형_원서접수_확정명단_${roundStr}_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
      return
    }

    const roundParam = selectedRoundFilter.value === 'all' ? null : Number(selectedRoundFilter.value)
    const blob = await exportQuotaStats(roundParam)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `학교장추천전형_${roundStr}_추천명단_및_정원현황_${new Date().toISOString().slice(0, 10)}.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (e) {
    await dialog.alert({ title: '내보내기 실패', message: e.message || '엑셀 다운로드 중 오류가 발생했습니다.' })
  } finally {
    downloading.value = false
  }
}

function printReport() {
  printMode.value = 'recommend'
  printOnlyWithRecommendations.value = false
  window.print()
}

async function printReportRecommendOnly() {
  printMode.value = 'recommend_only'
  printOnlyWithRecommendations.value = true
  await nextTick()
  window.print()
}

async function printAbandonedReport() {
  if (filteredAbandonedList.value.length === 0) {
    await dialog.alert({
      title: '포기자 없음',
      message: selectedRoundFilter.value === 'all'
        ? '현재 등록된 추천 포기자 내역이 없습니다.'
        : `${selectedRoundFilter.value}차 선발에 등록된 추천 포기자 내역이 없습니다.`
    })
    return
  }
  printMode.value = 'abandoned'
  await nextTick()
  window.print()
}

onMounted(async () => {
  try {
    const localTR = localStorage.getItem('total_rounds')
    if (localTR) totalRounds.value = parseInt(localTR, 10) || 1
    if (supabase) {
      const { data: cfg } = await supabase.from('config').select('value').eq('key', 'total_rounds').single()
      if (cfg?.value) {
        totalRounds.value = parseInt(cfg.value, 10) || 1
        localStorage.setItem('total_rounds', String(totalRounds.value))
      }
    }
  } catch {}
  disclosureCount.value = await getDisclosureCount()
  loadData()
  window.addEventListener('afterprint', () => {
    printOnlyWithRecommendations.value = false
    printMode.value = 'recommend'
  })
})
</script>

<style>
/* ── 화면 표시 기본 ── */
.print-only-container {
  display: none;
}

/* ── 인쇄(PDF) 전용 스타일 ── */
@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  @page {
    size: A4 portrait;
    margin: 15mm;
  }

  /* 화면 요소 완전 숨김 */
  aside,
  header,
  button,
  .no-print,
  .screen-only {
    display: none !important;
  }

  body {
    background: #ffffff !important;
    color: #000000 !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  @page {
    size: A4 landscape;
    margin: 15mm;
  }

  body * {
    visibility: hidden;
  }

  .print-only-container,
  .print-only-container * {
    visibility: visible;
  }

  .print-only-container {
    position: absolute;
    left: 0;
    top: 0;
    width: 100% !important;
    display: block !important;
  }

  /* 각 전형별 페이지 분할 (A4 가로 1장 단위) */
  .print-page {
    page-break-after: always;
    break-after: page;
    box-sizing: border-box;
    padding: 0;
    min-height: 180mm;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }

  .print-page:last-child {
    page-break-after: auto;
    break-after: auto;
  }

  /* 1. 상단 헤더 & 결재란 */
  .print-header-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #0f172a;
    padding-bottom: 12px;
    margin-bottom: 14px;
  }

  .print-detail-header-row {
    margin-bottom: 16px;
  }

  .print-title-box {
    flex: 1;
  }

  .print-school-label {
    font-size: 13px;
    font-weight: 800;
    color: #1e3a8a;
    letter-spacing: 0.05em;
    margin-bottom: 4px;
  }

  .print-main-title {
    font-size: 20px;
    font-weight: 900;
    color: #0f172a;
    margin: 0;
    line-height: 1.2;
    letter-spacing: -0.02em;
  }

  .print-sub-desc {
    font-size: 11px;
    color: #64748b;
    margin-top: 4px;
  }

  /* 결재란 (총괄 첫 페이지에만 표시) */
  .print-approval-box {
    margin-left: 16px;
  }

  .approval-table {
    border-collapse: collapse;
    text-align: center;
    border: 1px solid #334155;
    background: #ffffff;
  }

  .approval-th-title {
    padding: 2px 6px;
    border: 1px solid #334155;
    background: #f1f5f9;
    font-weight: 800;
    font-size: 11px;
    line-height: 1.2;
    width: 24px;
  }

  .approval-cell-header {
    padding: 3px 8px;
    border: 1px solid #334155;
    background: #f8fafc;
    font-weight: 800;
    font-size: 11px;
    width: 54px;
  }

  .approval-cell-sign {
    height: 44px;
    border: 1px solid #334155;
    min-width: 54px;
  }

  /* 0. 총괄 요약 통계 박스 & 종합 테이블 */
  .print-summary-stat-box {
    display: flex;
    justify-content: space-around;
    align-items: center;
    background: #f8fafc;
    border: 1.5px solid #cbd5e1;
    border-radius: 6px;
    padding: 8px 12px;
    margin-bottom: 14px;
  }

  .summary-stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .summary-stat-item .stat-label {
    font-size: 10px;
    font-weight: 700;
    color: #64748b;
  }

  .summary-stat-item .stat-val {
    font-size: 14px;
    font-weight: 900;
    color: #0f172a;
  }

  .print-summary-table-section {
    flex: 1;
    margin-bottom: 14px;
  }

  .print-summary-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10px;
    border: 1px solid #94a3b8;
  }

  .print-summary-table thead tr {
    background: #e2e8f0;
    border-bottom: 1.5px solid #64748b;
  }

  .print-summary-table th {
    padding: 5px 4px;
    font-weight: 800;
    color: #1e293b;
    border: 1px solid #cbd5e1;
    text-align: center;
  }

  .print-summary-table td {
    padding: 4px 5px;
    border: 1px solid #cbd5e1;
    color: #1e293b;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* 2. 전형 정보 요약 테이블 */
  .print-info-section {
    margin-bottom: 16px;
  }

  .print-info-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    border: 1px solid #cbd5e1;
  }

  .print-info-table .info-th {
    background: #f1f5f9;
    padding: 7px 10px;
    border: 1px solid #cbd5e1;
    font-weight: 800;
    color: #334155;
    text-align: center;
    width: 18%;
  }

  .print-info-table .info-td {
    padding: 7px 12px;
    border: 1px solid #cbd5e1;
    color: #0f172a;
    width: 32%;
  }

  .info-sub {
    font-size: 11px;
    color: #475569;
  }

  /* 3. 추천 학생 명단 테이블 */
  .print-student-section {
    flex: 1;
    margin-bottom: 16px;
  }

  .print-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .print-section-title {
    font-size: 12px;
    font-weight: 800;
    color: #0f172a;
  }

  .print-sort-note {
    font-size: 10px;
    color: #64748b;
    font-weight: 600;
  }

  .print-student-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
    border: 1px solid #94a3b8;
  }

  .print-student-table thead tr {
    background: #e2e8f0;
    border-bottom: 1.5px solid #64748b;
  }

  .print-student-table th {
    padding: 6px 8px;
    font-weight: 800;
    color: #1e293b;
    text-align: center;
    border: 1px solid #cbd5e1;
  }

  .print-student-table td {
    padding: 6px 8px;
    border: 1px solid #cbd5e1;
    color: #1e293b;
  }

  .print-empty-cell {
    text-align: center;
    padding: 24px !important;
    color: #94a3b8;
    font-weight: 600;
  }

  /* 4. 페이지 하단 푸터 */
  .print-footer-row {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    font-size: 10px;
    color: #64748b;
    border-top: 1px solid #cbd5e1;
    padding-top: 8px;
    margin-top: auto;
  }

  .print-footer-center {
    font-weight: 700;
    color: #334155;
  }
}
</style>

