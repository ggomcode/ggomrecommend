<template>
  <div class="min-h-screen bg-slate-50 text-slate-800 font-sans">
    <!-- 헤더 -->
    <header class="bg-white/90 border-b border-slate-200/80 sticky top-0 z-50 shadow-sm backdrop-blur-md">
      <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md" style="background: linear-gradient(135deg, #6366f1, #8b5cf6);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l3.58-3.58c.94-.94.94-2.48 0-3.42L9 5Z"/>
              <path d="M6 9.01V9"/>
            </svg>
          </div>
          <div class="flex flex-col leading-tight">
            <span class="text-[11px] font-extrabold tracking-tight" style="color: #6366f1;">{{ schoolName }}</span>
            <h1 class="text-base font-bold text-slate-900 m-0">수능응시 · 수시/정시 원서접수계획 관리</h1>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <button @click="$router.push('/select-system')" class="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-2 rounded-lg transition-all cursor-pointer">🏠 포털 이동</button>
          <button @click="handleLogout" class="text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-lg transition-all cursor-pointer">로그아웃</button>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 py-8">
      <!-- 대시보드 통계 카드 -->
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
        <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <p class="text-xs font-bold text-slate-400 mb-1">전체 학생</p>
          <p class="text-2xl font-extrabold text-slate-900">{{ stats.total }}</p>
        </div>
        <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <p class="text-xs font-bold text-slate-400 mb-1">응답 완료</p>
          <p class="text-2xl font-extrabold text-emerald-600">{{ stats.surveyed }}</p>
        </div>
        <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <p class="text-xs font-bold text-slate-400 mb-1">수능 미응시</p>
          <p class="text-2xl font-extrabold text-orange-500">{{ stats.csatNoTake }}</p>
        </div>
        <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <p class="text-xs font-bold text-slate-400 mb-1">일반대 수시 미접수</p>
          <p class="text-2xl font-extrabold text-purple-600">{{ stats.susiGenNoApply }}</p>
        </div>
        <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <p class="text-xs font-bold text-slate-400 mb-1">일반대 정시 미접수</p>
          <p class="text-2xl font-extrabold text-indigo-600">{{ stats.jungsiGenNoApply }}</p>
        </div>
        <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <p class="text-xs font-bold text-slate-400 mb-1">전문대 수시 미접수</p>
          <p class="text-2xl font-extrabold text-pink-600">{{ stats.susiColNoApply }}</p>
        </div>
        <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <p class="text-xs font-bold text-slate-400 mb-1">전문대 정시 미접수</p>
          <p class="text-2xl font-extrabold text-rose-600">{{ stats.jungsiColNoApply }}</p>
        </div>
        <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <p class="text-xs font-bold text-red-500 mb-1">⚠️ 수능 불일치</p>
          <p class="text-2xl font-extrabold text-red-600">{{ stats.mismatch }}</p>
        </div>
      </div>

      <!-- 탭 -->
      <div class="flex gap-2 mb-6 flex-wrap">
        <button @click="activeTab = 'overview'" :class="['px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer border', activeTab === 'overview' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50']">📊 대조 및 원서접수 현황</button>
        <button @click="activeTab = 'stats'" :class="['px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer border', activeTab === 'stats' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50']">📈 수능 선택과목 통계</button>
        <button @click="activeTab = 'upload'" :class="['px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer border', activeTab === 'upload' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50']">📤 수능 접수대장 PDF 업로드</button>
      </div>

      <!-- 대조 현황 탭 -->
      <div v-if="activeTab === 'overview'">
        <!-- 필터 및 액션 버튼 -->
        <div class="flex flex-wrap gap-3 mb-4 items-center justify-between">
          <div class="flex flex-wrap gap-2 items-center">
            <select v-model="filterClass" class="text-sm border border-slate-200 rounded-xl px-4 py-2.5 bg-white font-semibold text-slate-700 cursor-pointer min-w-[220px] shadow-sm focus:outline-none focus:border-indigo-500 transition-all">
              <option value="all">전체 (재학생 + 졸업생)</option>
              <option value="enrolled_all">재학생 전체 (1~11반)</option>
              <option v-for="c in classList" :key="c" :value="c">{{ c }}반</option>
              <option value="grad">🎓 졸업생 (수능접수)</option>
            </select>
            <select v-model="filterStatus" class="text-sm border border-slate-200 rounded-xl px-4 py-2.5 bg-white font-semibold text-slate-700 cursor-pointer min-w-[160px] shadow-sm focus:outline-none focus:border-indigo-500 transition-all">
              <option value="all">전체 상태</option>
              <option value="mismatch">⚠️ 수능 불일치만</option>
              <option value="modified">🔄 계획 수정된 학생만</option>
              <option value="no_survey">미응답자만</option>
              <option value="no_take">수능 미응시만</option>
              <option value="no_apply_any">대입 원서 미접수자(어느 하나라도)</option>
              <option value="no_apply_gen_susi">일반대 수시 미접수만</option>
              <option value="no_apply_gen_jung">일반대 정시 미접수만</option>
              <option value="no_apply_col_susi">전문대 수시 미접수만</option>
              <option value="no_apply_col_jung">전문대 정시 미접수만</option>
            </select>
          </div>
          <div class="flex flex-wrap gap-2 items-center">
            <button @click="downloadExcel" class="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-lg transition-all cursor-pointer">📥 엑셀 다운로드</button>
            <button @click="openRosterModal" class="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3.5 py-2 rounded-lg transition-all cursor-pointer shadow-sm">🖨️ 대장 인쇄</button>
            <button @click="printBatchCsat" class="text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3.5 py-2 rounded-lg transition-all cursor-pointer">🖨️ 수능 미응시 확인서 일괄출력</button>
            <button @click="printBatchSusi" class="text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3.5 py-2 rounded-lg transition-all cursor-pointer">🖨️ 원서 미접수 확인서 일괄출력</button>
          </div>
        </div>

        <!-- 데이터 테이블 -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-xs">
                <th class="px-3 py-3 text-left font-bold text-slate-600">학번</th>
                <th class="px-3 py-3 text-left font-bold text-slate-600">성명</th>
                <th class="px-2 py-3 text-center font-bold text-slate-600">반</th>
                <th class="px-3 py-3 text-center font-bold text-slate-600">수능(자가)</th>
                <th class="px-3 py-3 text-center font-bold text-slate-600">수능(대장)</th>
                <th class="px-2 py-3 text-center font-bold text-slate-600">매칭</th>
                <th class="px-3 py-3 text-center font-bold text-slate-600">(일반대)수시</th>
                <th class="px-3 py-3 text-center font-bold text-slate-600">(일반대)정시</th>
                <th class="px-3 py-3 text-center font-bold text-slate-600">(전문대)수시</th>
                <th class="px-3 py-3 text-center font-bold text-slate-600">(전문대)정시</th>
                <th class="px-3 py-3 text-center font-bold text-slate-600">수정이력</th>
                <th class="px-2 py-3 text-center font-bold text-slate-600">확인서</th>
                <th class="px-3 py-3 text-center font-bold text-slate-600">개별인쇄</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading" class="border-b border-slate-100">
                <td colspan="13" class="px-4 py-12 text-center text-slate-400 font-semibold">불러오는 중...</td>
              </tr>
              <tr v-else-if="filteredData.length === 0" class="border-b border-slate-100">
                <td colspan="13" class="px-4 py-12 text-center text-slate-400 font-semibold">표시할 데이터가 없습니다.</td>
              </tr>
              <tr v-for="row in filteredData" :key="row.student_code"
                :class="['border-b border-slate-100 transition-colors text-xs', isMismatch(row) ? 'bg-red-50/70' : 'hover:bg-slate-50']">
                <td class="px-3 py-3 font-mono text-slate-700 font-bold">{{ row.student_code }}</td>
                <td class="px-3 py-3 font-semibold text-slate-800">{{ row.name }}</td>
                <td class="px-2 py-3 text-center text-slate-600">
                  <span v-if="row.class_no">{{ row.class_no }}반</span>
                  <span v-else class="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">졸업생({{ row.grad_year || '졸업' }})</span>
                </td>

                <!-- 수능 자가체크 -->
                <td class="px-3 py-3 text-center">
                  <span v-if="!row.has_survey" class="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">미응답</span>
                  <span v-else-if="row.csat_intent === 'TAKE'" class="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">응시</span>
                  <span v-else class="text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full" :title="row.csat_no_take_reason">미응시</span>
                </td>

                <!-- 수능 접수대장 -->
                <td class="px-3 py-3 text-center">
                  <span v-if="row.csat_registered" class="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">접수됨</span>
                  <span v-else class="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">미접수</span>
                </td>

                <!-- 수능 매칭 -->
                <td class="px-2 py-3 text-center">
                  <span v-if="row.csat_mismatch === 'MATCH'" class="text-xs font-bold text-emerald-600">✔</span>
                  <span v-else-if="row.csat_mismatch === 'NO_SURVEY'" class="text-xs font-bold text-slate-400">-</span>
                  <span v-else class="text-[11px] font-extrabold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full animate-pulse">⚠️불일치</span>
                </td>

                <!-- (일반대) 수시 자가체크 -->
                <td class="px-3 py-3 text-center">
                  <span v-if="!row.has_survey" class="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">미응답</span>
                  <span v-else-if="(row.susi_general_intent || row.susi_intent) === 'NO_APPLY'" class="text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full" :title="row.susi_general_no_reason || row.susi_no_apply_reason">미접수</span>
                  <span v-else class="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">접수</span>
                </td>

                <!-- (일반대) 정시 자가체크 -->
                <td class="px-3 py-3 text-center">
                  <span v-if="!row.has_survey" class="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">미응답</span>
                  <span v-else-if="(row.jungsi_general_intent || row.jungsi_intent) === 'NO_APPLY'" class="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full" :title="row.jungsi_general_no_reason || row.jungsi_no_reason">미접수</span>
                  <span v-else class="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">접수</span>
                </td>

                <!-- (전문대) 수시 자가체크 -->
                <td class="px-3 py-3 text-center">
                  <span v-if="!row.has_survey" class="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">미응답</span>
                  <span v-else-if="row.susi_college_intent === 'NO_APPLY'" class="text-[11px] font-bold text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full" :title="row.susi_college_no_reason">미접수</span>
                  <span v-else class="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">접수</span>
                </td>

                <!-- (전문대) 정시 자가체크 -->
                <td class="px-3 py-3 text-center">
                  <span v-if="!row.has_survey" class="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">미응답</span>
                  <span v-else-if="row.jungsi_college_intent === 'NO_APPLY'" class="text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full" :title="row.jungsi_college_no_reason">미접수</span>
                  <span v-else class="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">접수</span>
                </td>

                <!-- 수정 이력 버튼 -->
                <td class="px-3 py-3 text-center">
                  <button v-if="row.history_count > 0" @click="openHistoryModal(row)"
                    class="text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-full cursor-pointer transition-all">
                    🔄 {{ row.history_count }}회 수정
                  </button>
                  <span v-else-if="row.has_survey" class="text-[11px] text-slate-400">최초등록</span>
                  <span v-else class="text-xs text-slate-300">-</span>
                </td>

                <!-- 확인서 제출 토글 -->
                <td class="px-2 py-3 text-center">
                  <button v-if="row.has_survey" @click="toggleSubmitted(row)"
                    :class="['text-[11px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition-all border', row.is_form_submitted ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100']">
                    {{ row.is_form_submitted ? '✔제출' : '⏳미제출' }}
                  </button>
                  <span v-else class="text-xs text-slate-300">-</span>
                </td>

                <!-- 인쇄 -->
                <td class="px-3 py-3 text-center">
                  <div class="flex gap-1 justify-center">
                    <button v-if="row.csat_intent === 'NO_TAKE'" @click="printSingleCsat(row)" class="text-[11px] font-bold text-orange-600 hover:bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded cursor-pointer" title="수능 미응시 확인서">📄수능</button>
                    <button v-if="hasStudentNoApply(row)" @click="printSingleSusi(row)" class="text-[11px] font-bold text-purple-600 hover:bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded cursor-pointer" title="대입 원서 미접수 확인서">📄원서</button>
                    <span v-if="row.csat_intent !== 'NO_TAKE' && !hasStudentNoApply(row)" class="text-xs text-slate-300">-</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 수능 선택과목 통계 탭 -->
      <div v-if="activeTab === 'stats'" class="space-y-6">
        <!-- 상단 필터 및 총괄 인원 안내 -->
        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div class="flex flex-wrap items-center gap-3">
            <span class="text-sm font-bold text-slate-700">조회 학급:</span>
            <select v-model="filterClass" class="text-sm border border-slate-200 rounded-xl px-4 py-2.5 bg-white font-semibold text-slate-800 cursor-pointer min-w-[220px] shadow-sm focus:outline-none focus:border-indigo-500 transition-all">
              <option value="all">전체 (재학생 + 졸업생)</option>
              <option value="enrolled_all">재학생 전체 (1~11반)</option>
              <option v-for="c in classList" :key="c" :value="c">{{ c }}반</option>
              <option value="grad">🎓 졸업생 (수능접수)</option>
            </select>
            <button @click="handlePrintElectiveStats" class="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm cursor-pointer transition-all active:scale-95">
              <span>🖨️ 선택과목 통계 인쇄 (1장)</span>
            </button>
          </div>
          <div class="text-xs font-semibold text-slate-600 flex flex-wrap gap-4">
            <span>대상 인원: <strong class="text-slate-900 text-sm font-extrabold">{{ electiveStats.totalStudents }}명</strong></span>
            <span>수능 접수 인원: <strong class="text-indigo-600 text-sm font-extrabold">{{ electiveStats.totalRegistered }}명</strong></span>
            <span>탐구 총 선택 과목수: <strong class="text-purple-600 text-sm font-extrabold">{{ electiveStats.inquiry.totalPicks }}과목</strong> (분모)</span>
          </div>
        </div>

        <!-- 주요 영역별 카드 그리드 -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <!-- 1. 국어 영역 선택과목 -->
          <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h4 class="font-bold text-slate-900 text-sm flex items-center gap-2">📖 국어 영역 선택과목</h4>
              <span class="text-xs font-semibold text-slate-500">응시 {{ electiveStats.korean.takers }}명</span>
            </div>
            <div class="space-y-3">
              <div v-for="(count, name) in electiveStats.korean.map" :key="name">
                <div class="flex justify-between text-xs font-semibold mb-1">
                  <span class="text-slate-700">{{ name }}</span>
                  <span class="text-indigo-600 font-bold">{{ count }}명 ({{ getPct(count, electiveStats.totalRegistered) }}%)</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div class="bg-indigo-500 h-2.5 rounded-full transition-all duration-500" :style="{ width: `${getPct(count, electiveStats.totalRegistered)}%` }"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. 수학 영역 선택과목 -->
          <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h4 class="font-bold text-slate-900 text-sm flex items-center gap-2">📐 수학 영역 선택과목</h4>
              <span class="text-xs font-semibold text-slate-500">응시 {{ electiveStats.math.takers }}명</span>
            </div>
            <div class="space-y-3">
              <div v-for="(count, name) in electiveStats.math.map" :key="name">
                <div class="flex justify-between text-xs font-semibold mb-1">
                  <span class="text-slate-700">{{ name }}</span>
                  <span class="text-blue-600 font-bold">{{ count }}명 ({{ getPct(count, electiveStats.totalRegistered) }}%)</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div class="bg-blue-500 h-2.5 rounded-full transition-all duration-500" :style="{ width: `${getPct(count, electiveStats.totalRegistered)}%` }"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. 제2외국어 / 한문 영역 -->
          <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h4 class="font-bold text-slate-900 text-sm flex items-center gap-2">🌐 제2외국어 / 한문</h4>
              <span class="text-xs font-semibold text-emerald-600">응시 {{ electiveStats.foreign.takers }}명 ({{ getPct(electiveStats.foreign.takers, electiveStats.totalRegistered) }}%)</span>
            </div>
            <div class="space-y-2.5 max-h-[160px] overflow-y-auto pr-1 text-xs">
              <div v-if="Object.keys(electiveStats.foreign.map).length === 0" class="text-center text-slate-400 py-6">응시자 없음</div>
              <div v-for="(count, name) in electiveStats.foreign.map" :key="name" class="flex justify-between items-center py-1 border-b border-slate-50">
                <span class="font-medium text-slate-700">{{ name }}</span>
                <span class="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px]">{{ count }}명 ({{ getPct(count, electiveStats.totalRegistered) }}%)</span>
              </div>
              <div class="flex justify-between items-center py-1 text-slate-400">
                <span>미응시</span>
                <span>{{ electiveStats.foreign.none }}명</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. 탐구 조합 유형별 통계 (사탐1, 사탐2, 사탐1+과탐1, 과탐1, 과탐2, 직탐) -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div class="flex flex-wrap items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div>
              <h4 class="font-bold text-slate-900 text-base flex items-center gap-2">🔬 탐구 조합 유형별 인원 및 비율 현황</h4>
              <p class="text-xs text-slate-500 mt-1">사탐/과탐/직탐 과목 선택 조합에 따른 학생 수 및 비율 (수능 접수자 {{ electiveStats.totalRegistered }}명 기준)</p>
            </div>
            <div class="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
              탐구 응시자: {{ electiveStats.inquiry.takers }}명 / 미응시: {{ electiveStats.inquiry.combo.none }}명
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div class="bg-orange-50/70 border border-orange-200 rounded-xl p-3.5 text-center">
              <p class="text-xs font-bold text-orange-800 mb-1">사탐 2과목</p>
              <p class="text-xl font-extrabold text-orange-600">{{ electiveStats.inquiry.combo.social2 }}명</p>
              <p class="text-[11px] font-semibold text-orange-700 mt-0.5">{{ getPct(electiveStats.inquiry.combo.social2, electiveStats.totalRegistered) }}%</p>
            </div>
            <div class="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-center">
              <p class="text-xs font-bold text-amber-800 mb-1">사탐 1과목</p>
              <p class="text-xl font-extrabold text-amber-600">{{ electiveStats.inquiry.combo.social1 }}명</p>
              <p class="text-[11px] font-semibold text-amber-700 mt-0.5">{{ getPct(electiveStats.inquiry.combo.social1, electiveStats.totalRegistered) }}%</p>
            </div>
            <div class="bg-purple-50/70 border border-purple-200 rounded-xl p-3.5 text-center">
              <p class="text-xs font-bold text-purple-800 mb-1">사탐 1 + 과탐 1</p>
              <p class="text-xl font-extrabold text-purple-600">{{ electiveStats.inquiry.combo.social1_science1 }}명</p>
              <p class="text-[11px] font-semibold text-purple-700 mt-0.5">{{ getPct(electiveStats.inquiry.combo.social1_science1, electiveStats.totalRegistered) }}%</p>
            </div>
            <div class="bg-cyan-50/70 border border-cyan-200 rounded-xl p-3.5 text-center">
              <p class="text-xs font-bold text-cyan-800 mb-1">과탐 2과목</p>
              <p class="text-xl font-extrabold text-cyan-600">{{ electiveStats.inquiry.combo.science2 }}명</p>
              <p class="text-[11px] font-semibold text-cyan-700 mt-0.5">{{ getPct(electiveStats.inquiry.combo.science2, electiveStats.totalRegistered) }}%</p>
            </div>
            <div class="bg-sky-50/70 border border-sky-200 rounded-xl p-3.5 text-center">
              <p class="text-xs font-bold text-sky-800 mb-1">과탐 1과목</p>
              <p class="text-xl font-extrabold text-sky-600">{{ electiveStats.inquiry.combo.science1 }}명</p>
              <p class="text-[11px] font-semibold text-sky-700 mt-0.5">{{ getPct(electiveStats.inquiry.combo.science1, electiveStats.totalRegistered) }}%</p>
            </div>
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center">
              <p class="text-xs font-bold text-slate-700 mb-1">직탐 / 미선택</p>
              <p class="text-xl font-extrabold text-slate-700">{{ electiveStats.inquiry.combo.vocational + electiveStats.inquiry.combo.none }}명</p>
              <p class="text-[11px] font-semibold text-slate-500 mt-0.5">{{ getPct(electiveStats.inquiry.combo.vocational + electiveStats.inquiry.combo.none, electiveStats.totalRegistered) }}%</p>
            </div>
          </div>
        </div>

        <!-- 5. 탐구 영역 세부 과목별 선택 비율 (분모: 전체 탐구 선택 총 과목수) -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div class="flex flex-wrap items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div>
              <h4 class="font-bold text-slate-900 text-base flex items-center gap-2">🧪 탐구 영역 세부 과목별 선택 비율</h4>
              <p class="text-xs text-slate-500 mt-1">선택된 탐구 과목 총 합계(<strong class="text-indigo-600">{{ electiveStats.inquiry.totalPicks }}과목</strong>)를 분모로 한 과목별 점유율</p>
            </div>
            <div class="text-xs font-semibold text-slate-500">
              * 분모 = 전체 학생이 선택한 탐구 과목의 총 개수 합계
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- 사회탐구 과목들 -->
            <div class="bg-orange-50/40 rounded-xl p-4 border border-orange-100">
              <h5 class="text-xs font-extrabold text-orange-900 mb-3 flex items-center gap-1.5">
                <span>📙 사회탐구 영역 (9개 과목)</span>
              </h5>
              <div class="space-y-2.5">
                <div v-for="sub in electiveStats.socialSubjects" :key="sub.name">
                  <div class="flex justify-between text-xs font-semibold mb-1">
                    <span class="text-slate-800">{{ sub.name }}</span>
                    <span class="text-orange-700 font-bold">{{ sub.count }}건 ({{ sub.pct }}%)</span>
                  </div>
                  <div class="w-full bg-orange-100/70 rounded-full h-2 overflow-hidden">
                    <div class="bg-orange-500 h-2 rounded-full transition-all duration-500" :style="{ width: `${sub.pct}%` }"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 과학탐구 과목들 -->
            <div class="bg-cyan-50/40 rounded-xl p-4 border border-cyan-100">
              <h5 class="text-xs font-extrabold text-cyan-900 mb-3 flex items-center gap-1.5">
                <span>📘 과학탐구 영역 (8개 과목)</span>
              </h5>
              <div class="space-y-2.5">
                <div v-for="sub in electiveStats.scienceSubjects" :key="sub.name">
                  <div class="flex justify-between text-xs font-semibold mb-1">
                    <span class="text-slate-800">{{ sub.name }}</span>
                    <span class="text-cyan-700 font-bold">{{ sub.count }}건 ({{ sub.pct }}%)</span>
                  </div>
                  <div class="w-full bg-cyan-100/70 rounded-full h-2 overflow-hidden">
                    <div class="bg-cyan-600 h-2 rounded-full transition-all duration-500" :style="{ width: `${sub.pct}%` }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 접수대장 업로드 탭 -->
      <div v-if="activeTab === 'upload'">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h3 class="text-lg font-bold text-slate-900 mb-2">📤 수능 접수대장 PDF 업로드</h3>
          <p class="text-sm text-slate-500 mb-6">대학수학능력접수시스템에서 '접수대장 출력 → PDF 저장'한 파일을 업로드하세요.</p>

          <!-- 드래그앤드롭 영역 -->
          <div
            @dragover.prevent="isDragOver = true"
            @dragleave="isDragOver = false"
            @drop.prevent="handleDrop"
            :class="['border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer', isDragOver ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 bg-slate-50 hover:border-indigo-300']"
            @click="$refs.fileInput.click()"
          >
            <input ref="fileInput" type="file" accept=".pdf" @change="handleFileSelect" class="hidden" />
            <div class="text-4xl mb-3">📎</div>
            <p class="text-sm font-bold text-slate-600">PDF 파일을 드래그하거나 클릭하여 선택하세요</p>
            <p class="text-xs text-slate-400 mt-1">접수대장 PDF만 지원됩니다</p>
          </div>

          <!-- 업로드 진행 중 -->
          <div v-if="uploadState === 'parsing'" class="mt-6 text-center">
            <div class="inline-flex items-center gap-3 bg-indigo-50 px-6 py-4 rounded-xl border border-indigo-200">
              <div class="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span class="text-sm font-bold text-indigo-700">PDF 파싱 중...</span>
            </div>
          </div>

          <!-- 파싱 결과 미리보기 모달 -->
          <div v-if="uploadState === 'preview'" class="mt-6">
            <div class="bg-indigo-50 rounded-2xl p-6 border border-indigo-200">
              <h4 class="text-base font-bold text-indigo-900 mb-4">📋 파싱 결과 미리보기</h4>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div class="bg-white rounded-xl p-3 text-center border border-indigo-100">
                  <p class="text-xs font-bold text-slate-400">총 인원</p>
                  <p class="text-xl font-extrabold text-indigo-900">{{ parsedResult?.stats?.total ?? parsedResult?.totalCount ?? parsedResult?.records?.length ?? 0 }}명</p>
                </div>
                <div class="bg-white rounded-xl p-3 text-center border border-indigo-100">
                  <p class="text-xs font-bold text-slate-400">재학생</p>
                  <p class="text-xl font-extrabold text-emerald-600">{{ parsedResult?.stats?.enrolledCount ?? parsedResult?.enrolledCount ?? 0 }}명</p>
                </div>
                <div class="bg-white rounded-xl p-3 text-center border border-indigo-100">
                  <p class="text-xs font-bold text-slate-400">졸업생</p>
                  <p class="text-xl font-extrabold text-amber-600">{{ parsedResult?.stats?.graduatedCount ?? parsedResult?.gradCount ?? 0 }}명</p>
                </div>
                <div class="bg-white rounded-xl p-3 text-center border border-indigo-100">
                  <p class="text-xs font-bold text-slate-400">PDF 저장일시</p>
                  <p class="text-xs font-bold text-slate-700 mt-1">{{ parsedResult?.batchTime || '-' }}</p>
                </div>
              </div>

              <!-- 0건 파싱 경고 -->
              <div v-if="!parsedResult?.records?.length" class="p-4 bg-rose-50 rounded-xl border border-rose-300 text-rose-800 text-xs font-bold mb-4">
                ⚠️ 추출된 데이터가 0건입니다. 업로드한 파일이 한국교육과정평가원 수능 원서접수 시스템의 '접수대장' 원본 PDF인지 확인해 주세요.
              </div>

              <!-- 시각 경고 -->
              <div v-if="batchTimeWarning" class="p-4 bg-amber-50 rounded-xl border border-amber-300 text-amber-800 text-xs font-bold mb-4">
                ⚠️ {{ batchTimeWarning }}
              </div>

              <div class="flex gap-3 justify-end">
                <button @click="cancelUpload" class="text-sm font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-lg cursor-pointer transition-all">취소</button>
                <button @click="confirmUpload" :disabled="uploading || !parsedResult?.records?.length" :class="['text-sm font-bold px-6 py-2 rounded-lg transition-all shadow-md', !parsedResult?.records?.length ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer']">
                  {{ uploading ? '업로드 중...' : '✅ DB 저장 확정' }}
                </button>
              </div>
            </div>
          </div>

          <!-- 완료 -->
          <div v-if="uploadState === 'done'" class="mt-6 text-center">
            <div class="bg-emerald-50 rounded-2xl p-6 border border-emerald-200 inline-block">
              <div class="text-3xl mb-2">🎉</div>
              <p class="text-base font-bold text-emerald-800">{{ uploadResultMsg }}</p>
              <button @click="resetUpload" class="mt-4 text-sm font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-4 py-2 rounded-lg cursor-pointer border border-emerald-300 transition-all">새 파일 업로드</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 수정 이력 상세 모달 -->
      <div v-if="selectedHistoryStudent" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
          <!-- 모달 헤더 -->
          <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
              <h3 class="text-base font-bold text-slate-900">
                📋 {{ selectedHistoryStudent.name }} ({{ selectedHistoryStudent.student_code }}) 변경 이력
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">{{ selectedHistoryStudent.grade || 3 }}학년 {{ selectedHistoryStudent.class_no }}반 {{ selectedHistoryStudent.student_no }}번 · 총 {{ selectedHistoryStudent.history_count }}회 수정</p>
            </div>
            <button @click="selectedHistoryStudent = null" class="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 cursor-pointer font-bold transition-all">✕</button>
          </div>

          <!-- 모달 바디 (타임라인) -->
          <div class="p-6 overflow-y-auto flex-1 space-y-4">
            <div v-if="!selectedHistoryStudent.change_logs || selectedHistoryStudent.change_logs.length === 0" class="text-center py-8 text-slate-400 text-sm">
              상세 변경 이력 로그가 없습니다.
            </div>
            <div v-else v-for="(log, idx) in selectedHistoryStudent.change_logs" :key="idx"
              class="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-white transition-all shadow-sm">
              <div class="flex items-center justify-between text-xs mb-2">
                <span class="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {{ log.actor_name || '학생 본인' }}
                </span>
                <span class="text-slate-400">{{ formatDate(log.timestamp) }}</span>
              </div>

              <div v-if="log.type === 'INITIAL'" class="text-xs font-bold text-emerald-600">
                🎉 {{ log.summary || '최초 등록 완료' }}
              </div>
              <div v-else class="space-y-1.5 mt-2">
                <div v-for="(c, cIdx) in log.changes" :key="cIdx" class="text-xs bg-white p-2 rounded border border-slate-200 flex flex-col gap-0.5">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-slate-800">[{{ c.field_name }}]</span>
                    <span class="line-through text-slate-400">{{ c.from_label || c.from }}</span>
                    <span class="text-indigo-600 font-extrabold">➔ {{ c.to_label || c.to }}</span>
                  </div>
                  <div v-if="c.reason" class="text-[11px] text-slate-500">
                    사유: {{ c.reason }}
                  </div>
                </div>
              </div>

              <div v-if="log.memo" class="text-xs text-slate-600 mt-2 bg-amber-50 p-2 rounded border border-amber-200 italic">
                메모: {{ log.memo }}
              </div>
            </div>
          </div>

          <!-- 모달 풋터 -->
          <div class="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
            <button @click="selectedHistoryStudent = null" class="text-sm font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-lg cursor-pointer transition-all">닫기</button>
          </div>
        </div>
      </div>

      <!-- 대장 인쇄 조건 설정 모달 -->
      <div v-if="isRosterModalOpen" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
          <!-- 모달 헤더 -->
          <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base">🖨️</div>
              <div>
                <h3 class="text-base font-bold text-slate-900">수능·원서접수 대장 인쇄 설정</h3>
                <p class="text-xs text-slate-500 mt-0.5">인쇄할 대장 종류와 학급 및 상세 필터 조건을 선택하세요 (A4 가로 서식).</p>
              </div>
            </div>
            <button @click="isRosterModalOpen = false" class="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 cursor-pointer font-bold transition-all">✕</button>
          </div>

          <!-- 모달 바디 -->
          <div class="p-6 overflow-y-auto flex-1 space-y-5 text-sm">
            <!-- 1. 대장 종류 선택 -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-2">1. 대장 종류 (출력 서식)</label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label :class="['border rounded-xl p-3 flex items-start gap-2.5 cursor-pointer transition-all', rosterType === 'all' ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500' : 'border-slate-200 hover:bg-slate-50']">
                  <input type="radio" v-model="rosterType" value="all" class="mt-0.5 text-indigo-600" />
                  <div>
                    <p class="text-xs font-bold text-slate-800">📊 종합 대장 (전체 현황)</p>
                    <p class="text-[11px] text-slate-500 mt-0.5">수능 + 수시/정시 원서접수 전체 계획</p>
                  </div>
                </label>
                <label :class="['border rounded-xl p-3 flex items-start gap-2.5 cursor-pointer transition-all', rosterType === 'csat' ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500' : 'border-slate-200 hover:bg-slate-50']">
                  <input type="radio" v-model="rosterType" value="csat" class="mt-0.5 text-indigo-600" />
                  <div>
                    <p class="text-xs font-bold text-slate-800">📝 수능 응시 대조 대장</p>
                    <p class="text-[11px] text-slate-500 mt-0.5">자가체크 vs 평가원 접수대장 대조</p>
                  </div>
                </label>
                <label :class="['border rounded-xl p-3 flex items-start gap-2.5 cursor-pointer transition-all', rosterType === 'apply' ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500' : 'border-slate-200 hover:bg-slate-50']">
                  <input type="radio" v-model="rosterType" value="apply" class="mt-0.5 text-indigo-600" />
                  <div>
                    <p class="text-xs font-bold text-slate-800">📑 대입 원서접수 계획 대장</p>
                    <p class="text-[11px] text-slate-500 mt-0.5">일반대/전문대 수시 및 정시 현황</p>
                  </div>
                </label>
                <label :class="['border rounded-xl p-3 flex items-start gap-2.5 cursor-pointer transition-all', rosterType === 'mismatch' ? 'border-rose-500 bg-rose-50/50 ring-1 ring-rose-500' : 'border-slate-200 hover:bg-slate-50']">
                  <input type="radio" v-model="rosterType" value="mismatch" class="mt-0.5 text-rose-600" />
                  <div>
                    <p class="text-xs font-bold text-rose-800">⚠️ 수능 불일치 명단 대장</p>
                    <p class="text-[11px] text-rose-600 mt-0.5">자가조사 vs 접수대장 불일치자만</p>
                  </div>
                </label>
                <label :class="['border rounded-xl p-3 flex items-start gap-2.5 cursor-pointer transition-all', rosterType === 'no_take' ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-500' : 'border-slate-200 hover:bg-slate-50']">
                  <input type="radio" v-model="rosterType" value="no_take" class="mt-0.5 text-amber-600" />
                  <div>
                    <p class="text-xs font-bold text-amber-800">🚫 수능 미응시자 명단 대장</p>
                    <p class="text-[11px] text-amber-600 mt-0.5">전체 재학생 중 업로드된 접수대장 PDF에 없는 학생</p>
                  </div>
                </label>
                <label :class="['border rounded-xl p-3 flex items-start gap-2.5 cursor-pointer transition-all', rosterType === 'no_apply' ? 'border-purple-500 bg-purple-50/50 ring-1 ring-purple-500' : 'border-slate-200 hover:bg-slate-50']">
                  <input type="radio" v-model="rosterType" value="no_apply" class="mt-0.5 text-purple-600" />
                  <div>
                    <p class="text-xs font-bold text-purple-800">🚫 원서 미접수자 명단 대장</p>
                    <p class="text-[11px] text-purple-600 mt-0.5">수시/정시 중 미접수 전형 보유자</p>
                  </div>
                </label>
                <label :class="['border rounded-xl p-3 flex items-start gap-2.5 cursor-pointer transition-all', rosterType === 'no_form' ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-500' : 'border-slate-200 hover:bg-slate-50']">
                  <input type="radio" v-model="rosterType" value="no_form" class="mt-0.5 text-amber-600" />
                  <div>
                    <p class="text-xs font-bold text-amber-800">⏳ 확인서 미제출자 명단</p>
                    <p class="text-[11px] text-amber-600 mt-0.5">실물 확인서 미제출 대상자</p>
                  </div>
                </label>
                <label :class="['border rounded-xl p-3 flex items-start gap-2.5 cursor-pointer transition-all', rosterType === 'no_survey' ? 'border-slate-400 bg-slate-100 ring-1 ring-slate-400' : 'border-slate-200 hover:bg-slate-50']">
                  <input type="radio" v-model="rosterType" value="no_survey" class="mt-0.5 text-slate-600" />
                  <div>
                    <p class="text-xs font-bold text-slate-800">⏳ 조사 미응답자 명단</p>
                    <p class="text-[11px] text-slate-500 mt-0.5">계획 조사를 아직 완료하지 않은 학생</p>
                  </div>
                </label>
              </div>
            </div>

            <!-- 2. 학급 선택 -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">2. 대상 학급</label>
              <select v-model="rosterClass" class="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3.5 py-2.5 bg-white text-slate-800 cursor-pointer shadow-sm focus:outline-none focus:border-indigo-500">
                <option value="all">전체 (재학생 + 졸업생)</option>
                <option value="enrolled_all">재학생 전체 (1~11반)</option>
                <option v-for="c in classList" :key="c" :value="c">{{ c }}반</option>
                <option value="grad">🎓 졸업생 전체 (수능접수대장 등록자)</option>
              </select>
            </div>

            <!-- 3. 상세 필터 조건 (수능 대장, 수시, 정시) -->
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <p class="text-xs font-bold text-slate-700">3. 상세 조건 필터 (선택 사항)</p>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label class="block text-[11px] font-semibold text-slate-500 mb-1">수능(접수대장) 상태</label>
                  <select v-model="rosterCsatFilter" class="w-full text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700">
                    <option value="all">전체 (접수/미접수)</option>
                    <option value="registered">접수됨만</option>
                    <option value="not_registered">미접수만</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-slate-500 mb-1">(일반대) 수시 상태</label>
                  <select v-model="rosterSusiGenFilter" class="w-full text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700">
                    <option value="all">전체</option>
                    <option value="apply">접수 예정만</option>
                    <option value="no_apply">미접수만</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-slate-500 mb-1">(일반대) 정시 상태</label>
                  <select v-model="rosterJungGenFilter" class="w-full text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700">
                    <option value="all">전체</option>
                    <option value="apply">접수 예정만</option>
                    <option value="no_apply">미접수만</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- 대상 인원 실시간 요약 바 -->
            <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 flex items-center justify-between">
              <span class="text-xs font-bold text-indigo-900">
                🎯 선택된 조건의 인쇄 대상 인원:
              </span>
              <span class="text-sm font-extrabold text-indigo-700">
                총 {{ rosterFilteredList.length }}명 (재학생 {{ rosterFilteredList.filter(r => r.is_enrolled !== false).length }}명, 졸업생 {{ rosterFilteredList.filter(r => r.is_enrolled === false).length }}명)
              </span>
            </div>
          </div>

          <!-- 모달 풋터 -->
          <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <button @click="isRosterModalOpen = false" class="text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-xl cursor-pointer transition-all">취소</button>
            <button @click="executeRosterPrint" :disabled="rosterFilteredList.length === 0" :class="['text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5', rosterFilteredList.length === 0 ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer']">
              <span>🖨️ 대장 인쇄하기 (A4 가로)</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { schoolName, fetchSchoolName } from '../utils/schoolConfig'
import { buildComparisonData, getLatestUploadBatchTime, upsertCsatRecords, toggleFormSubmitted } from '../api/examIntentApi'
import { parseCsatPdf } from '../utils/csatPdfParser'
import { printCsatNoTakeForm, printSusiNoApplyForm, printBatchIntentForms, printSummaryRoster, printElectiveStatsReport } from '../utils/printTemplates'
import * as XLSX from 'xlsx'

const router = useRouter()
const auth = useAuthStore()

const activeTab = ref('overview')
const loading = ref(true)
const comparisonData = ref([])
const filterClass = ref('all')
const filterStatus = ref('all')

// Upload state
const isDragOver = ref(false)
const uploadState = ref('idle') // idle, parsing, preview, done
const parsedResult = ref(null)
const batchTimeWarning = ref('')
const uploading = ref(false)
const uploadResultMsg = ref('')

// History Modal
const selectedHistoryStudent = ref(null)

// Roster Print Modal State
const isRosterModalOpen = ref(false)
const rosterType = ref('all') // all, csat, apply, mismatch, no_take, no_apply, no_survey, no_form
const rosterClass = ref('all')
const rosterCsatFilter = ref('all') // all, registered, not_registered
const rosterSusiGenFilter = ref('all') // all, apply, no_apply
const rosterJungGenFilter = ref('all') // all, apply, no_apply

function openRosterModal() {
  rosterClass.value = filterClass.value
  isRosterModalOpen.value = true
}

const rosterFilteredList = computed(() => {
  let list = comparisonData.value

  // 1. 학급 필터 ('all'은 재학생 + 졸업생 전체)
  if (rosterClass.value === 'enrolled_all') {
    list = list.filter(r => r.is_enrolled !== false)
  } else if (rosterClass.value === 'grad') {
    list = list.filter(r => r.is_enrolled === false)
  } else if (rosterClass.value !== 'all') {
    list = list.filter(r => r.class_no === Number(rosterClass.value))
  }

  // 2. 대장 종류 필터
  if (rosterType.value === 'mismatch') {
    list = list.filter(r => isMismatch(r))
  } else if (rosterType.value === 'no_take') {
    // 전체 재학생 중 업로드된 수능 접수대장 PDF에 등록되지 않은 학생
    list = list.filter(r => r.is_enrolled !== false && !r.csat_registered)
  } else if (rosterType.value === 'no_apply') {
    list = list.filter(r => hasStudentNoApply(r))
  } else if (rosterType.value === 'no_survey') {
    list = list.filter(r => !r.has_survey && r.is_enrolled !== false)
  } else if (rosterType.value === 'no_form') {
    list = list.filter(r => r.has_survey && !r.is_form_submitted && (r.csat_intent === 'NO_TAKE' || hasStudentNoApply(r)))
  }

  // 3. 수능 접수대장 상태 필터
  if (rosterCsatFilter.value === 'registered') {
    list = list.filter(r => r.csat_registered)
  } else if (rosterCsatFilter.value === 'not_registered') {
    list = list.filter(r => !r.csat_registered)
  }

  // 4. 일반대 수시 상태 필터
  if (rosterSusiGenFilter.value === 'apply') {
    list = list.filter(r => r.has_survey && (r.susi_general_intent || r.susi_intent) !== 'NO_APPLY')
  } else if (rosterSusiGenFilter.value === 'no_apply') {
    list = list.filter(r => r.has_survey && (r.susi_general_intent || r.susi_intent) === 'NO_APPLY')
  }

  // 5. 일반대 정시 상태 필터
  if (rosterJungGenFilter.value === 'apply') {
    list = list.filter(r => r.has_survey && (r.jungsi_general_intent || r.jungsi_intent) !== 'NO_APPLY')
  } else if (rosterJungGenFilter.value === 'no_apply') {
    list = list.filter(r => r.has_survey && (r.jungsi_general_intent || r.jungsi_intent) === 'NO_APPLY')
  }

  return list
})

function executeRosterPrint() {
  const targets = rosterFilteredList.value
  if (targets.length === 0) {
    alert('선택된 조건에 해당하는 인쇄 대상이 없습니다.')
    return
  }

  let title = '2027학년도 수능 응시 및 대입 원서접수 종합대장'
  if (rosterType.value === 'csat') title = '2027학년도 수능 응시 및 접수대장 대조 대장'
  else if (rosterType.value === 'apply') title = '2027학년도 대입 원서접수(수시/정시) 계획 대장'
  else if (rosterType.value === 'mismatch') title = '2027학년도 수능 불일치 대상자 명단 대장'
  else if (rosterType.value === 'no_take') title = '2027학년도 수능 미응시자 명단 대장'
  else if (rosterType.value === 'no_apply') title = '2027학년도 대입 원서 미접수자 명단 대장'
  else if (rosterType.value === 'no_survey') title = '2027학년도 의향 조사 미응답자 명단 대장'
  else if (rosterType.value === 'no_form') title = '2027학년도 확인서 미제출자 명단 대장'

  let classInfo = '전체 (재학생 + 졸업생)'
  if (rosterClass.value === 'enrolled_all') classInfo = '재학생 전체 (1~11반)'
  else if (rosterClass.value === 'grad') classInfo = '졸업생 전체 (수능접수)'
  else if (rosterClass.value !== 'all') classInfo = `3학년 ${rosterClass.value}반`

  const filterSummaryList = []
  if (rosterCsatFilter.value === 'registered') filterSummaryList.push('수능접수:접수됨')
  else if (rosterCsatFilter.value === 'not_registered') filterSummaryList.push('수능접수:미접수')

  if (rosterSusiGenFilter.value === 'apply') filterSummaryList.push('일반대수시:접수')
  else if (rosterSusiGenFilter.value === 'no_apply') filterSummaryList.push('일반대수시:미접수')

  if (rosterJungGenFilter.value === 'apply') filterSummaryList.push('일반대정시:접수')
  else if (rosterJungGenFilter.value === 'no_apply') filterSummaryList.push('일반대정시:미접수')

  const filterSummary = filterSummaryList.length > 0 ? filterSummaryList.join(' / ') : '전체'

  printSummaryRoster(targets, {
    title,
    classInfo,
    filterSummary
  })
  isRosterModalOpen.value = false
}

function handlePrintElectiveStats() {
  let label = '전체 (재학생 + 졸업생)'
  if (filterClass.value === 'enrolled_all') label = '재학생 전체'
  else if (filterClass.value === 'grad') label = '🎓 졸업생'
  else if (filterClass.value !== 'all') label = `${filterClass.value}반`

  printElectiveStatsReport({
    filterLabel: label,
    stats: electiveStats.value,
    schoolName: schoolName.value || '포곡고등학교'
  })
}

function openHistoryModal(row) {
  selectedHistoryStudent.value = row
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const classList = computed(() => {
  const classes = new Set()
  for (const r of comparisonData.value) {
    if (r.class_no) classes.add(r.class_no)
  }
  return [...classes].sort((a, b) => a - b)
})

function hasStudentNoApply(r) {
  if (!r.has_survey) return false
  const genSusi = (r.susi_general_intent || r.susi_intent) === 'NO_APPLY'
  const genJung = (r.jungsi_general_intent || r.jungsi_intent) === 'NO_APPLY'
  const colSusi = r.susi_college_intent === 'NO_APPLY'
  const colJung = r.jungsi_college_intent === 'NO_APPLY'
  return genSusi || genJung || colSusi || colJung
}

const stats = computed(() => {
  const data = comparisonData.value
  return {
    total: data.length,
    surveyed: data.filter(r => r.has_survey).length,
    csatNoTake: data.filter(r => r.has_survey && r.csat_intent === 'NO_TAKE').length,
    susiGenNoApply: data.filter(r => r.has_survey && (r.susi_general_intent || r.susi_intent) === 'NO_APPLY').length,
    jungsiGenNoApply: data.filter(r => r.has_survey && (r.jungsi_general_intent || r.jungsi_intent) === 'NO_APPLY').length,
    susiColNoApply: data.filter(r => r.has_survey && r.susi_college_intent === 'NO_APPLY').length,
    jungsiColNoApply: data.filter(r => r.has_survey && r.jungsi_college_intent === 'NO_APPLY').length,
    mismatch: data.filter(r => isMismatch(r)).length
  }
})

const filteredData = computed(() => {
  let data = comparisonData.value
  if (filterClass.value === 'enrolled_all') {
    data = data.filter(r => r.is_enrolled !== false)
  } else if (filterClass.value === 'grad') {
    data = data.filter(r => r.is_enrolled === false)
  } else if (filterClass.value !== 'all') {
    data = data.filter(r => r.class_no === Number(filterClass.value))
  }
  if (filterStatus.value === 'mismatch') data = data.filter(r => isMismatch(r))
  else if (filterStatus.value === 'modified') data = data.filter(r => r.history_count > 0)
  else if (filterStatus.value === 'no_survey') data = data.filter(r => !r.has_survey)
  else if (filterStatus.value === 'no_take') data = data.filter(r => r.has_survey && r.csat_intent === 'NO_TAKE')
  else if (filterStatus.value === 'no_apply_any') data = data.filter(r => hasStudentNoApply(r))
  else if (filterStatus.value === 'no_apply_gen_susi') data = data.filter(r => r.has_survey && (r.susi_general_intent || r.susi_intent) === 'NO_APPLY')
  else if (filterStatus.value === 'no_apply_gen_jung') data = data.filter(r => r.has_survey && (r.jungsi_general_intent || r.jungsi_intent) === 'NO_APPLY')
  else if (filterStatus.value === 'no_apply_col_susi') data = data.filter(r => r.has_survey && r.susi_college_intent === 'NO_APPLY')
  else if (filterStatus.value === 'no_apply_col_jung') data = data.filter(r => r.has_survey && r.jungsi_college_intent === 'NO_APPLY')
  return data
})

function getPct(count, total) {
  if (!total || total === 0 || !count) return 0
  return ((count / total) * 100).toFixed(1)
}

const ALL_INQUIRY_KEYWORDS = [
  '통합사회', '통합과학',
  '생활과 윤리', '생활과윤리',
  '윤리와 사상', '윤리와사상',
  '한국지리', '세계지리', '동아시아사', '세계사', '경제',
  '정치와 법', '정치와법',
  '사회·문화', '사회문화', '사회.문화',
  '물리학Ⅰ', '물리학I', '물리학1', '물리Ⅰ', '물리I',
  '화학Ⅰ', '화학I', '화학1',
  '생명과학Ⅰ', '생명과학I', '생명과학1', '생명Ⅰ', '생명I',
  '지구과학Ⅰ', '지구과학I', '지구과학1', '지구Ⅰ', '지구I',
  '물리학Ⅱ', '물리학II', '물리학2', '물리Ⅱ', '물리II',
  '화학Ⅱ', '화학II', '화학2',
  '생명과학Ⅱ', '생명과학II', '생명과학2', '생명Ⅱ', '생명II',
  '지구과학Ⅱ', '지구과학II', '지구과학2', '지구Ⅱ', '지구II',
  '성공적인 직업생활', '농업 기초 기술', '공업 일반', '상업 경제', '수산·해운 산업 기초', '인간 발달'
]

function standardizeSubjectName(sub) {
  if (!sub) return ''
  const c = sub.replace(/[\s·./]/g, '')
  if (c.includes('통합사회')) return '통합사회'
  if (c.includes('통합과학')) return '통합과학'
  if (c.includes('생활과윤리') || c === '생윤') return '생활과 윤리'
  if (c.includes('윤리와사상') || c === '윤사') return '윤리와 사상'
  if (c.includes('한국지리') || c === '한지') return '한국지리'
  if (c.includes('세계지리') || c === '세지') return '세계지리'
  if (c.includes('동아시아사') || c === '동사') return '동아시아사'
  if (c.includes('세계사')) return '세계사'
  if (c.includes('경제')) return '경제'
  if (c.includes('정치와법') || c === '정법') return '정치와 법'
  if (c.includes('사회문화') || c === '사문') return '사회·문화'
  if (c.includes('물리') && (c.includes('Ⅱ') || c.includes('II') || c.includes('2'))) return '물리학Ⅱ'
  if (c.includes('물리')) return '물리학Ⅰ'
  if (c.includes('화학') && (c.includes('Ⅱ') || c.includes('II') || c.includes('2'))) return '화학Ⅱ'
  if (c.includes('화학')) return '화학Ⅰ'
  if (c.includes('생명') && (c.includes('Ⅱ') || c.includes('II') || c.includes('2'))) return '생명과학Ⅱ'
  if (c.includes('생명')) return '생명과학Ⅰ'
  if (c.includes('지구') && (c.includes('Ⅱ') || c.includes('II') || c.includes('2'))) return '지구과학Ⅱ'
  if (c.includes('지구')) return '지구과학Ⅰ'
  if (c.includes('직업생활')) return '성공적인 직업생활'
  if (c.includes('농업')) return '농업 기초 기술'
  if (c.includes('공업')) return '공업 일반'
  if (c.includes('상업')) return '상업 경제'
  if (c.includes('수산')) return '수산·해운 산업 기초'
  if (c.includes('인간발달')) return '인간 발달'
  return sub.trim()
}

function parseInquirySubjects(rawText) {
  if (!rawText || rawText === 'X' || rawText === 'X / X' || rawText === '-') return []
  
  const results = []
  let text = String(rawText).trim()

  // 1. 만약 '/' 로 구분되어 있으면 먼저 split
  if (text.includes('/')) {
    const parts = text.split('/').map(s => s.trim()).filter(s => s && s !== 'X' && s !== '-')
    for (const p of parts) {
      const std = standardizeSubjectName(p)
      if (std && !results.includes(std)) results.push(std)
    }
    if (results.length > 0) return results.slice(0, 2)
  }

  // 2. 키워드 기반 탐색 (긴 단어부터 매칭)
  const sortedKeywords = [...ALL_INQUIRY_KEYWORDS].sort((a, b) => b.length - a.length)
  for (const kw of sortedKeywords) {
    if (results.length >= 2) break
    const cleanKw = kw.replace(/[\s·./]/g, '')
    const cleanText = text.replace(/[\s·./]/g, '')
    if (cleanText.includes(cleanKw)) {
      const std = standardizeSubjectName(kw)
      if (std && !results.includes(std)) {
        results.push(std)
        text = text.replace(kw, '').trim()
      }
    }
  }

  return results.slice(0, 2)
}

const ALL_FOREIGN_KEYWORDS = [
  '독일어Ⅰ', '독일어I', '프랑스어Ⅰ', '프랑스어I', '스페인어Ⅰ', '스페인어I',
  '중국어Ⅰ', '중국어I', '일본어Ⅰ', '일본어I', '러시아어Ⅰ', '러시아어I',
  '아랍어Ⅰ', '아랍어I', '베트남어Ⅰ', '베트남어I', '한문Ⅰ', '한문I'
]

function standardizeForeignLanguage(fl) {
  if (!fl || fl === 'X' || fl === '-' || fl === 'x') return null
  const c = fl.replace(/[\s·./]/g, '')
  if (c.includes('독일어')) return '독일어Ⅰ'
  if (c.includes('프랑스어')) return '프랑스어Ⅰ'
  if (c.includes('스페인어')) return '스페인어Ⅰ'
  if (c.includes('중국어')) return '중국어Ⅰ'
  if (c.includes('일본어')) return '일본어Ⅰ'
  if (c.includes('러시아어')) return '러시아어Ⅰ'
  if (c.includes('아랍어')) return '아랍어Ⅰ'
  if (c.includes('베트남어')) return '베트남어Ⅰ'
  if (c.includes('한문')) return '한문Ⅰ'
  return fl.trim()
}

function parseForeignLanguage(rawText) {
  if (!rawText || rawText === 'X' || rawText === '-' || rawText === 'x') return null
  const text = String(rawText).trim()
  for (const kw of ALL_FOREIGN_KEYWORDS) {
    const cleanKw = kw.replace(/[\s·./]/g, '')
    const cleanText = text.replace(/[\s·./]/g, '')
    if (cleanText.includes(cleanKw)) {
      return standardizeForeignLanguage(kw)
    }
  }
  return null
}

const SOCIAL_NAMES = ['통합사회', '생활과 윤리', '윤리와 사상', '한국지리', '세계지리', '동아시아사', '세계사', '경제', '정치와 법', '사회·문화', '사회문화']
const SCIENCE_NAMES = ['통합과학', '물리학Ⅰ', '물리학I', '화학Ⅰ', '화학I', '생명과학Ⅰ', '생명과학I', '지구과학Ⅰ', '지구과학I', '물리학Ⅱ', '물리학II', '화학Ⅱ', '화학II', '생명과학Ⅱ', '생명과학II', '지구과학Ⅱ', '지구과학II']
const VOCATIONAL_NAMES = ['성공적인 직업생활', '농업 기초 기술', '공업 일반', '상업 경제', '수산·해운 산업 기초', '인간 발달']

function getSubCategory(sub) {
  if (!sub || sub === 'X' || sub === '-') return null
  const c = sub.replace(/\s+/g, '')
  if (SOCIAL_NAMES.some(s => c.includes(s.replace(/\s+/g, '')))) return 'SOCIAL'
  if (SCIENCE_NAMES.some(s => c.includes(s.replace(/\s+/g, '')))) return 'SCIENCE'
  if (VOCATIONAL_NAMES.some(s => c.includes(s.replace(/\s+/g, '')))) return 'VOCATIONAL'
  return 'OTHER'
}

const electiveStats = computed(() => {
  // 학급 필터가 적용된 대상 레코드들
  let targetRecords = comparisonData.value
  if (filterClass.value === 'enrolled_all') {
    targetRecords = targetRecords.filter(r => r.is_enrolled !== false)
  } else if (filterClass.value === 'grad') {
    targetRecords = targetRecords.filter(r => r.is_enrolled === false)
  } else if (filterClass.value !== 'all') {
    targetRecords = targetRecords.filter(r => r.class_no === Number(filterClass.value))
  }

  const registered = targetRecords.filter(r => r.csat_registered && r.csat_record)
  const totalStudents = targetRecords.length
  const totalRegistered = registered.length

  const koreanMap = { '화법과 작문': 0, '언어와 매체': 0, '미선택': 0 }
  let korTakers = 0

  const mathMap = { '확률과 통계': 0, '미적분': 0, '기하': 0, '미선택': 0 }
  let mathTakers = 0

  const foreignMap = {}
  let foreignTakers = 0
  let foreignNone = 0

  const inquiryCounts = {}
  let totalInquiryPicks = 0

  const comboCounts = {
    social2: 0,
    social1: 0,
    social1_science1: 0,
    science2: 0,
    science1: 0,
    vocational: 0,
    none: 0
  }

  for (const r of registered) {
    const rec = r.csat_record

    // 1. 국어
    const kor = rec.subject_korean ? rec.subject_korean.trim() : ''
    if (kor && kor !== 'X' && kor !== '-') {
      koreanMap[kor] = (koreanMap[kor] || 0) + 1
      korTakers++
    } else {
      koreanMap['미선택']++
    }

    // 2. 수학
    const mat = rec.subject_math ? rec.subject_math.trim() : ''
    if (mat && mat !== 'X' && mat !== '-') {
      mathMap[mat] = (mathMap[mat] || 0) + 1
      mathTakers++
    } else {
      mathMap['미선택']++
    }

    // 3. 제2외국어 (어떤 필드명이든 강력 추출)
    const rawForeign = rec.foreign_language || rec.subject_foreign_language || ''
    const frg = parseForeignLanguage(rawForeign)
    if (frg) {
      foreignMap[frg] = (foreignMap[frg] || 0) + 1
      foreignTakers++
    } else {
      foreignNone++
    }

    // 4. 탐구 (어떤 포맷이든 슬래시, 공백 상관없이 2과목 정밀 추출)
    const rawInquiry = rec.inquiry_subjects || `${rec.inquiry_subject1 || ''} / ${rec.inquiry_subject2 || ''}`
    const subs = parseInquirySubjects(rawInquiry)

    totalInquiryPicks += subs.length
    for (const s of subs) {
      inquiryCounts[s] = (inquiryCounts[s] || 0) + 1
    }

    const c1 = subs[0] ? getSubCategory(subs[0]) : null
    const c2 = subs[1] ? getSubCategory(subs[1]) : null

    if (subs.length === 0) {
      comboCounts.none++
    } else if (c1 === 'VOCATIONAL' || c2 === 'VOCATIONAL') {
      comboCounts.vocational++
    } else if (subs.length === 2) {
      if (c1 === 'SOCIAL' && c2 === 'SOCIAL') comboCounts.social2++
      else if (c1 === 'SCIENCE' && c2 === 'SCIENCE') comboCounts.science2++
      else if ((c1 === 'SOCIAL' && c2 === 'SCIENCE') || (c1 === 'SCIENCE' && c2 === 'SOCIAL')) comboCounts.social1_science1++
      else comboCounts.social2++
    } else if (subs.length === 1) {
      if (c1 === 'SOCIAL' || c2 === 'SOCIAL') comboCounts.social1++
      else if (c1 === 'SCIENCE' || c2 === 'SCIENCE') comboCounts.science1++
      else comboCounts.social1++
    }
  }

  // 사회탐구 9과목 세부 배열
  const socialList = [
    '생활과 윤리', '윤리와 사상', '한국지리', '세계지리', '동아시아사', '세계사', '경제', '정치와 법', '사회·문화'
  ]
  const socialSubjects = socialList.map(name => {
    let count = 0
    const cleanName = name.replace(/[\s·./]/g, '')
    for (const [subKey, subCount] of Object.entries(inquiryCounts)) {
      if (subKey.replace(/[\s·./]/g, '') === cleanName) {
        count += subCount
      }
    }
    const pct = totalInquiryPicks > 0 ? ((count / totalInquiryPicks) * 100).toFixed(1) : 0
    return { name, count, pct }
  })

  // 과학탐구 8과목 세부 배열
  const scienceList = [
    '물리학Ⅰ', '화학Ⅰ', '생명과학Ⅰ', '지구과학Ⅰ', '물리학Ⅱ', '화학Ⅱ', '생명과학Ⅱ', '지구과학Ⅱ'
  ]
  const scienceSubjects = scienceList.map(name => {
    let count = 0
    const cleanName = name.replace(/[\s·./]/g, '').replace(/Ⅰ/g, 'I').replace(/Ⅱ/g, 'II')
    for (const [subKey, subCount] of Object.entries(inquiryCounts)) {
      const cleanKey = subKey.replace(/[\s·./]/g, '').replace(/Ⅰ/g, 'I').replace(/Ⅱ/g, 'II')
      if (cleanKey === cleanName) {
        count += subCount
      }
    }
    const pct = totalInquiryPicks > 0 ? ((count / totalInquiryPicks) * 100).toFixed(1) : 0
    return { name, count, pct }
  })

  return {
    totalStudents,
    totalRegistered,
    korean: { map: koreanMap, takers: korTakers },
    math: { map: mathMap, takers: mathTakers },
    foreign: { map: foreignMap, takers: foreignTakers, none: foreignNone },
    inquiry: {
      totalPicks: totalInquiryPicks,
      counts: inquiryCounts,
      combo: comboCounts,
      takers: totalRegistered - comboCounts.none
    },
    socialSubjects,
    scienceSubjects
  }
})

function isMismatch(row) {
  return row.csat_mismatch === 'SURVEY_YES_CSAT_NO' || row.csat_mismatch === 'SURVEY_NO_CSAT_YES'
}

async function loadData() {
  loading.value = true
  try {
    comparisonData.value = await buildComparisonData()
  } catch (e) {
    console.error('loadData error:', e)
  } finally {
    loading.value = false
  }
}

async function toggleSubmitted(row) {
  try {
    const newVal = !row.is_form_submitted
    await toggleFormSubmitted(row.student_code, newVal)
    row.is_form_submitted = newVal
  } catch (e) {
    console.error('toggleSubmitted error:', e)
  }
}

// Print
function printSingleCsat(row) {
  const student = { name: row.name, grade: row.grade, class_no: row.class_no, student_no: row.student_no, student_code: row.student_code }
  printCsatNoTakeForm(student, {
    csat_no_take_reason: row.csat_no_take_reason,
    student_signature: row.student_signature,
    parent_signature: row.parent_signature,
    parent_name: row.parent_name,
    confirmed_at: row.confirmed_at
  })
}

function printSingleSusi(row) {
  const student = { name: row.name, grade: row.grade, class_no: row.class_no, student_no: row.student_no, student_code: row.student_code }
  printSusiNoApplyForm(student, {
    susi_general_intent: row.susi_general_intent,
    susi_general_no_reason: row.susi_general_no_reason,
    jungsi_general_intent: row.jungsi_general_intent,
    jungsi_general_no_reason: row.jungsi_general_no_reason,
    susi_college_intent: row.susi_college_intent,
    susi_college_no_reason: row.susi_college_no_reason,
    jungsi_college_intent: row.jungsi_college_intent,
    jungsi_college_no_reason: row.jungsi_college_no_reason,
    susi_intent: row.susi_intent,
    susi_no_apply_reason: row.susi_no_apply_reason,
    jungsi_intent: row.jungsi_intent,
    jungsi_no_reason: row.jungsi_no_reason,
    student_signature: row.student_signature,
    parent_signature: row.parent_signature,
    parent_name: row.parent_name,
    confirmed_at: row.confirmed_at
  })
}

function printBatchCsat() {
  const targets = filteredData.value
    .filter(r => r.csat_intent === 'NO_TAKE')
    .map(r => ({
      student: { name: r.name, grade: r.grade, class_no: r.class_no, student_no: r.student_no, student_code: r.student_code },
      intentData: {
        csat_no_take_reason: r.csat_no_take_reason,
        student_signature: r.student_signature,
        parent_signature: r.parent_signature,
        parent_name: r.parent_name,
        confirmed_at: r.confirmed_at
      }
    }))
  if (targets.length === 0) return alert('수능 미응시 인쇄 대상이 없습니다.')
  printBatchIntentForms(targets, 'csat')
}

function printBatchSusi() {
  const targets = filteredData.value
    .filter(r => hasStudentNoApply(r))
    .map(r => ({
      student: { name: r.name, grade: r.grade, class_no: r.class_no, student_no: r.student_no, student_code: r.student_code },
      intentData: {
        susi_general_intent: r.susi_general_intent,
        susi_general_no_reason: r.susi_general_no_reason,
        jungsi_general_intent: r.jungsi_general_intent,
        jungsi_general_no_reason: r.jungsi_general_no_reason,
        susi_college_intent: r.susi_college_intent,
        susi_college_no_reason: r.susi_college_no_reason,
        jungsi_college_intent: r.jungsi_college_intent,
        jungsi_college_no_reason: r.jungsi_college_no_reason,
        susi_intent: r.susi_intent,
        susi_no_apply_reason: r.susi_no_apply_reason,
        jungsi_intent: r.jungsi_intent,
        jungsi_no_reason: r.jungsi_no_reason,
        student_signature: r.student_signature,
        parent_signature: r.parent_signature,
        parent_name: r.parent_name,
        confirmed_at: r.confirmed_at
      }
    }))
  if (targets.length === 0) return alert('원서 미접수 인쇄 대상이 없습니다.')
  printBatchIntentForms(targets, 'susi')
}

// Excel
function downloadExcel() {
  const rows = filteredData.value.map(r => ({
    '학번': r.student_code,
    '성명': r.name,
    '반': r.class_no,
    '번호': r.student_no,
    '수능자가체크': r.has_survey ? (r.csat_intent === 'TAKE' ? '응시' : '미응시') : '미응답',
    '수능접수대장': r.csat_registered ? '접수됨' : '미접수',
    '수능매칭': r.csat_mismatch === 'MATCH' ? '일치' : (r.csat_mismatch === 'NO_SURVEY' ? '미응답' : '불일치'),
    '수능미응시사유': r.csat_intent === 'NO_TAKE' ? (r.csat_no_take_reason || '') : '',
    '일반대수시': r.has_survey ? ((r.susi_general_intent || r.susi_intent) === 'NO_APPLY' ? '미접수' : '접수') : '미응답',
    '일반대수시사유': (r.susi_general_intent || r.susi_intent) === 'NO_APPLY' ? (r.susi_general_no_reason || r.susi_no_apply_reason || '') : '',
    '일반대정시': r.has_survey ? ((r.jungsi_general_intent || r.jungsi_intent) === 'NO_APPLY' ? '미접수' : '접수') : '미응답',
    '일반대정시사유': (r.jungsi_general_intent || r.jungsi_intent) === 'NO_APPLY' ? (r.jungsi_general_no_reason || r.jungsi_no_reason || '') : '',
    '전문대수시': r.has_survey ? (r.susi_college_intent === 'NO_APPLY' ? '미접수' : '접수') : '미응답',
    '전문대수시사유': r.susi_college_intent === 'NO_APPLY' ? (r.susi_college_no_reason || '') : '',
    '전문대정시': r.has_survey ? (r.jungsi_college_intent === 'NO_APPLY' ? '미접수' : '접수') : '미응답',
    '전문대정시사유': r.jungsi_college_intent === 'NO_APPLY' ? (r.jungsi_college_no_reason || '') : '',
    '수정횟수': r.history_count || 0,
    '최종수정자': r.last_modified_by || '',
    '최종수정일시': r.last_modified_at || '',
    '확인서제출': r.is_form_submitted ? '제출' : '미제출',
    '최초등록일시': r.confirmed_at || ''
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '수능대입원서현황')
  XLSX.writeFile(wb, `수능_대입원서_응시현황_${new Date().toISOString().split('T')[0]}.xlsx`)
}

// PDF Upload
async function handleFileSelect(e) {
  const file = e.target.files?.[0]
  if (file) await processPdf(file)
}

async function handleDrop(e) {
  isDragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && file.type === 'application/pdf') await processPdf(file)
}

async function processPdf(file) {
  uploadState.value = 'parsing'
  try {
    const result = await parseCsatPdf(file)
    console.log('[ExamIntentAdminView] 파싱 완료 result:', result)
    parsedResult.value = result

    // 기존 배치시간과 비교
    const existingTime = await getLatestUploadBatchTime()
    if (existingTime && result.batchTime) {
      const existingDate = new Date(existingTime)
      const newDate = new Date(result.batchTime.replace(' ', 'T') + '+09:00')
      if (newDate <= existingDate) {
        batchTimeWarning.value = `현재 업로드하려는 파일(${result.batchTime})이 기존 DB 저장 시각(${existingDate.toLocaleString('ko-KR')})보다 이전 또는 동일합니다. 업로드를 다시 확인해 주세요.`
      } else {
        batchTimeWarning.value = ''
      }
    } else {
      batchTimeWarning.value = ''
    }

    uploadState.value = 'preview'
  } catch (e) {
    console.error('PDF parsing error:', e)
    alert('PDF 파싱 중 오류가 발생했습니다: ' + (e.message || e))
    uploadState.value = 'idle'
  }
}

async function confirmUpload() {
  if (!parsedResult.value) return
  uploading.value = true
  try {
    const result = await upsertCsatRecords(parsedResult.value.records, parsedResult.value.batchTime)
    uploadResultMsg.value = `${result.total}건의 접수대장 데이터가 성공적으로 업로드되었습니다.`
    uploadState.value = 'done'
    await loadData() // 대조 데이터 새로고침
  } catch (e) {
    console.error('Upload error:', e)
    alert('업로드 중 오류: ' + (e.message || e))
  } finally {
    uploading.value = false
  }
}

function cancelUpload() {
  uploadState.value = 'idle'
  parsedResult.value = null
  batchTimeWarning.value = ''
}

function resetUpload() {
  uploadState.value = 'idle'
  parsedResult.value = null
  batchTimeWarning.value = ''
  uploadResultMsg.value = ''
}

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}

onMounted(async () => {
  fetchSchoolName()
  await loadData()
})
</script>
