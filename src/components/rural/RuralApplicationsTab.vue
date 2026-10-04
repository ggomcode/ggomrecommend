<template>
  <div class="space-y-4 flex-1 min-h-0 flex flex-col">
    <!-- 헤더 영역 -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs shrink-0">
      <div>
        <h2 class="text-xl font-bold text-slate-900 flex items-center gap-2 m-0">
          <Users class="w-6 h-6 text-emerald-600" />
          학생 농어촌 전형 신청 현황 & 대장 관리
        </h2>
        <p class="text-sm text-slate-500 mt-1 mb-0">
          전체 및 학급별 학생들의 농어촌 희망 지망 신청 현황을 확인하고, 교사 대리 등록, 오기재 항목 수정 및 결재 대장을 출력할 수 있습니다.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <!-- 전문대학 추천과 동일한 패턴의 학생 대리 등록 버튼 -->
        <button
          @click="openCreateModal"
          class="flex items-center gap-1.5 px-3.5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer border-none"
        >
          <Plus class="w-4 h-4" />
          학생 대리 등록
        </button>
        <button
          @click="openStudentSelectPrintModal"
          class="flex items-center gap-1.5 px-3.5 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Printer class="w-4 h-4 text-emerald-600" />
          학생 추천 확인서 인쇄
        </button>
        <button
          @click="openPrintModal"
          class="flex items-center gap-1.5 px-3.5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer border-none"
        >
          <Printer class="w-4 h-4" />
          추천 대장 인쇄
        </button>
        <button
          @click="loadData"
          :disabled="loading"
          class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw :class="{ 'animate-spin': loading }" class="w-4 h-4 text-slate-500" />
          새로고침
        </button>
      </div>
    </div>

    <!-- 미등록 전형 직접입력 학생 발생 알림 바 (교사/관리자용) -->
    <div v-if="customApplicationsCount > 0" class="bg-amber-50 border-2 border-amber-300 p-4 rounded-xl flex items-center justify-between shadow-xs shrink-0">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-extrabold text-lg shrink-0 shadow-xs">
          🔔
        </div>
        <div>
          <h4 class="text-xs sm:text-sm font-extrabold text-amber-950 m-0 flex items-center gap-1.5">
            미등록 대학/전형 직접 입력 신청 발생
            <span class="px-2 py-0.5 rounded-full text-xs bg-amber-200 text-amber-950 border border-amber-300 font-extrabold">
              총 {{ customStudentsCount }}명 ({{ customApplicationsCount }}건)
            </span>
          </h4>
          <p class="text-xs text-amber-900 m-0 mt-1 leading-relaxed">
            드롭다운 목록에 없는 대학/전형을 직접 입력하여 신청한 항목이 있습니다. 아래 테이블의 <strong class="text-amber-950 bg-amber-200 px-1.5 py-0.5 rounded font-bold">⚠️ 직접입력</strong> 항목을 확인해 주세요.
          </p>
        </div>
      </div>
    </div>

    <!-- 학급 필터 & 요약 통계 바 -->
    <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 shrink-0">
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-slate-500 m-0">전체 신청 학생 수</p>
          <p class="text-2xl font-bold text-slate-900 mt-1 m-0">{{ totalAppliedStudents }}명</p>
        </div>
        <div class="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <Users class="w-5 h-5" />
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-indigo-600 m-0">총 신청 지망 건수</p>
          <p class="text-2xl font-bold text-indigo-600 mt-1 m-0">{{ totalApplicationsCount }}건</p>
        </div>
        <div class="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <FileSpreadsheet class="w-5 h-5" />
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-amber-600 m-0">자격 경고/주의 학생</p>
          <p class="text-2xl font-bold text-amber-600 mt-1 m-0">{{ warningStudentsCount }}명</p>
        </div>
        <div class="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
          <AlertTriangle class="w-5 h-5" />
        </div>
      </div>

      <!-- 학급 선택 필터 -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div class="w-full space-y-1">
          <label class="block text-xs font-bold text-slate-700">조회 학급 선택</label>
          <select
            v-model="filterClass"
            class="w-full p-1.5 border border-slate-300 rounded-lg text-xs bg-white font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="all">전체 학급</option>
            <option v-for="cNo in classNumbers" :key="cNo" :value="cNo">
              3학년 {{ cNo }}반
            </option>
            <option value="grad">졸업생</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 검색 및 상세 필터 -->
    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3 text-xs shrink-0">
      <div class="flex items-center gap-3 flex-1">
        <div class="relative max-w-xs w-full">
          <Search class="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="학생 이름, 학번, 대학명, 학과 검색…"
            class="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
          />
        </div>
      </div>
    </div>

    <!-- 신청 내역 현황 테이블 -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-xs flex-1 min-h-0 flex flex-col overflow-hidden">
      <div class="flex-1 min-h-0 overflow-auto custom-scrollbar w-full">
        <table class="w-full text-left text-xs border-collapse" style="min-width: 1300px;">
          <thead class="sticky top-0 z-10 bg-slate-50">
            <tr class="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold whitespace-nowrap">
              <th class="py-3 px-3.5 text-center whitespace-nowrap bg-slate-50" style="width: 50px; min-width: 50px;">순번</th>
              <th class="py-3 px-3.5 whitespace-nowrap bg-slate-50" style="width: 80px; min-width: 80px;">학급</th>
              <th class="py-3 px-3.5 whitespace-nowrap bg-slate-50" style="width: 80px; min-width: 80px;">학번</th>
              <th class="py-3 px-3.5 whitespace-nowrap bg-slate-50" style="width: 100px; min-width: 100px;">이름</th>
              <th class="py-3 px-3.5 text-center whitespace-nowrap bg-slate-50" style="width: 100px; min-width: 100px;">자격상태</th>
              <th class="py-3 px-3.5 text-center whitespace-nowrap bg-slate-50" style="width: 70px; min-width: 70px;">지망</th>
              <th class="py-3 px-3.5 text-center whitespace-nowrap bg-slate-50" style="width: 70px; min-width: 70px;">구분</th>
              <th class="py-3 px-3.5 whitespace-nowrap bg-slate-50" style="width: 160px; min-width: 160px;">대학명</th>
              <th class="py-3 px-3.5 whitespace-nowrap bg-slate-50" style="width: 180px; min-width: 180px;">학과(부)</th>
              <th class="py-3 px-3.5 whitespace-nowrap bg-slate-50" style="width: 110px; min-width: 110px;">전형유형</th>
              <th class="py-3 px-3.5 whitespace-nowrap bg-slate-50" style="width: 200px; min-width: 200px;">전형명</th>
              <th class="py-3 px-3.5 text-center whitespace-nowrap bg-slate-50" style="width: 170px; min-width: 170px;">확인서/수정/삭제</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-if="filteredApplications.length === 0">
              <td colspan="12" class="py-12 text-center text-slate-400">
                조회된 농어촌 희망 지망 신청 데이터가 없습니다.
              </td>
            </tr>
            <tr
              v-for="(app, idx) in filteredApplications"
              :key="app.id"
              class="hover:bg-slate-50 transition-colors"
            >
              <td class="py-3 px-3.5 text-center font-semibold text-slate-500 whitespace-nowrap">{{ idx + 1 }}</td>
              <td class="py-3 px-3.5 font-semibold text-slate-700 whitespace-nowrap">
                {{ app.student_class ? `3-${app.student_class}반` : '졸업생' }}
              </td>
              <td class="py-3 px-3.5 font-mono text-slate-600 whitespace-nowrap">{{ app.student_code || '-' }}</td>
              <td
                class="py-3 px-3.5 font-bold text-slate-900 whitespace-nowrap cursor-pointer hover:text-emerald-600 hover:underline"
                @click="openStudentSelectPrintModal(app.student_id)"
                title="클릭 시 이 학생의 농어촌 전형 추천 확인서 인쇄"
              >
                {{ app.student_name }}
              </td>

              <!-- 자격 상태 배지 (경고 빨간색/주황색) -->
              <td class="py-3 px-3.5 text-center whitespace-nowrap">
                <span
                  v-if="app.is_warning"
                  class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200 whitespace-nowrap inline-block"
                  :title="app.ineligible_reason || '자격 미달/보류 경고'"
                >
                  ⚠️ 자격주의
                </span>
                <span v-else class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 whitespace-nowrap inline-block">
                  🟢 적격
                </span>
              </td>

              <td class="py-3 px-3.5 text-center font-bold text-slate-700 whitespace-nowrap">{{ app.choice_number }}지망</td>
              <td class="py-3 px-3.5 text-center whitespace-nowrap">
                <span :class="app.term_type === '수시' ? 'text-blue-600 font-bold' : 'text-emerald-600 font-bold'">
                  {{ app.term_type }}
                </span>
              </td>
              <td class="py-3 px-3.5 font-bold text-slate-900 whitespace-nowrap">{{ app.univ_name }}</td>
              <td class="py-3 px-3.5 font-bold text-indigo-700 whitespace-nowrap">{{ app.department }}</td>
              <td class="py-3 px-3.5 whitespace-nowrap">
                <span class="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] whitespace-nowrap">
                  {{ app.track_type }}
                </span>
              </td>
              <td class="py-3 px-4 font-semibold text-slate-800">
                {{ app.track_name }}
                <span v-if="app.is_custom_entry || (app.remarks && app.remarks.includes('[미등록'))" class="ml-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 inline-block">
                  ⚠️ 직접입력
                </span>
              </td>

              <!-- 교사 확인서인쇄/수정/삭제 버튼 -->
              <td class="py-3 px-3 text-center whitespace-nowrap">
                <div class="flex items-center justify-center gap-1.5">
                  <button
                    @click="openStudentSelectPrintModal(app.student_id)"
                    class="px-2 py-1 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded border border-emerald-200 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 shadow-2xs"
                    title="이 학생의 농어촌 전형 추천 확인서 인쇄"
                  >
                    <Printer class="w-3 h-3" />
                    확인서
                  </button>
                  <button
                    @click="openEditModal(app)"
                    class="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    수정
                  </button>
                  <button
                    @click="deleteApplication(app)"
                    class="px-2.5 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 rounded border border-rose-200 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    삭제
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 3. 교사/관리자용 대리 등록 / 수정 모달 (전문대학 추천 패턴과 동일 구조) -->
    <div
      v-if="showAdminModal"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-base font-bold text-slate-900 m-0 flex items-center gap-2">
            <PenTool class="w-4 h-4 text-emerald-600" />
            {{ modalRecordId ? '농어촌 전형 신청 수정' : '학생 대리 농어촌 전형 신청 등록' }}
          </h3>
          <button
            @click="showAdminModal = false"
            class="text-slate-400 hover:text-slate-600 font-bold text-lg bg-transparent border-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form @submit.prevent="handleSaveAdminModal" class="space-y-4 text-left text-xs">
          <!-- 1. 대상 학생 선택 (신규 대리 등록 시) -->
          <div v-if="!modalRecordId" class="space-y-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div class="flex items-center justify-between">
              <label class="block font-bold text-slate-800">
                1. 대상 학생 선택 <span class="text-rose-500">*</span>
              </label>
              <span class="text-[11px] text-slate-500">
                (해당 학급: {{ availableStudentsForModal.length }}명)
              </span>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <select
                v-model="modalSelectedClass"
                class="p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
              >
                <option value="all">전체 학생</option>
                <option v-for="c in classNumbers" :key="c" :value="String(c)">3학년 {{ c }}반</option>
                <option value="grad">졸업생</option>
              </select>

              <select
                v-model="modalSelectedStudentId"
                @change="onStudentSelectChanged"
                required
                class="p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-emerald-900"
              >
                <option value="" disabled>-- 학생 선택 (총 {{ availableStudentsForModal.length }}명) --</option>
                <option
                  v-for="st in availableStudentsForModal"
                  :key="st.id || st.student_code"
                  :value="st.id || st.student_code"
                >
                  {{ st.is_enrolled !== false ? `${st.class_no ? `${st.class_no}반 ` : ''}${st.seq_no ? `${st.seq_no}번 ` : ''}${st.name} (${st.student_code || '-'})` : `[졸업생] ${st.name} (${st.student_code || '-'})` }}
                </option>
              </select>
            </div>

            <!-- 선택된 학생 인적사항 및 자격 상태 배너 -->
            <div v-if="selectedStudentObj" class="pt-2 border-t border-slate-200/80 space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-800">
                  {{ selectedStudentObj.name }}
                  <span class="font-normal text-slate-500 font-mono">({{ selectedStudentObj.student_code }})</span>
                </span>
                <span
                  class="px-2 py-0.5 rounded text-[11px] font-bold"
                  :class="selectedStudentObj.is_enrolled !== false ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-800 border border-amber-200'"
                >
                  {{ selectedStudentObj.is_enrolled !== false ? `3학년 ${selectedStudentObj.class_no || ''}반` : '졸업생' }}
                </span>
              </div>

              <!-- 자격 상태 -->
              <div
                class="p-2 rounded-lg text-[11px] font-medium"
                :class="selectedStudentIsEligible ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'"
              >
                <div class="flex items-center gap-1.5 font-bold">
                  <span>{{ selectedStudentIsEligible ? '🟢 농어촌 전형 지원 적격' : '⚠️ 자격 요건 주의 (확인 필요)' }}</span>
                  <span v-if="selectedStudentObj.eligibility?.is_type1_eligible" class="text-[10px] bg-emerald-200/80 text-emerald-950 px-1.5 py-0.2 rounded font-extrabold">유형I (6년)</span>
                  <span v-else-if="selectedStudentObj.eligibility?.is_type2_eligible" class="text-[10px] bg-amber-200 text-amber-950 px-1.5 py-0.2 rounded font-extrabold">유형II (12년)</span>
                  <span v-else-if="selectedStudentObj.eligibility?.is_manual_approved" class="text-[10px] bg-indigo-200 text-indigo-950 px-1.5 py-0.2 rounded font-extrabold">수동 인정</span>
                </div>
                <p v-if="selectedStudentObj.eligibility?.evaluation_notes" class="m-0 mt-0.5 text-[10px] text-slate-600">
                  {{ selectedStudentObj.eligibility.evaluation_notes }}
                </p>
              </div>

              <!-- 기존 등록 지망 요약 -->
              <div v-if="studentExistingApps.length > 0" class="pt-1">
                <span class="text-[11px] font-bold text-slate-600">현재 등록된 지망 내역 (총 {{ studentExistingApps.length }}건):</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  <span
                    v-for="eApp in studentExistingApps"
                    :key="eApp.id"
                    class="px-2 py-0.5 rounded text-[10px] bg-white border border-slate-300 text-slate-700 font-semibold"
                  >
                    <strong>{{ eApp.choice_number }}지망:</strong> {{ eApp.univ_name }} ({{ eApp.department }})
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 수정 모드 시 학생 정보 배너 -->
          <div v-else class="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 flex items-center justify-between">
            <div>
              <span class="font-bold text-sm">{{ adminForm.student_name }}</span>
              <span class="text-xs text-slate-500 font-mono ml-1.5">({{ adminForm.student_code }})</span>
            </div>
            <span class="text-xs font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
              {{ adminForm.choice_number }}지망 수정 중
            </span>
          </div>

          <!-- 2. 지망 순번 선택 (1지망 ~ 6지망) -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="block font-bold text-slate-800">
                2. 지원 지망 순번 <span class="text-rose-500">*</span>
              </label>
              <span class="text-[11px] text-slate-500">
                * 최대 6지망까지 지원 가능
              </span>
            </div>

            <div class="grid grid-cols-6 gap-1.5">
              <button
                v-for="num in 6"
                :key="num"
                type="button"
                @click="selectChoiceNumber(num)"
                :class="[
                  'py-2 px-1 rounded-lg border text-center transition-all cursor-pointer font-bold flex flex-col items-center justify-center',
                  adminForm.choice_number === num
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : getChoiceApp(num)
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                ]"
              >
                <span class="text-xs">{{ num }}지망</span>
                <span class="text-[9px] mt-0.5 truncate w-full px-0.5" :class="adminForm.choice_number === num ? 'text-emerald-100' : 'text-slate-400'">
                  {{ getChoiceApp(num) ? (getChoiceApp(num).univ_name.substring(0, 3) + '…') : '비어있음' }}
                </span>
              </button>
            </div>
          </div>

          <!-- 3. 모집 시기 구분 (수시 / 정시) -->
          <div class="space-y-1.5">
            <label class="block font-bold text-slate-800">
              3. 모집 시기 구분 <span class="text-rose-500">*</span>
            </label>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="term in ['수시', '정시']"
                :key="term"
                type="button"
                @click="onTermTypeChange(term)"
                :class="[
                  'py-2 rounded-lg border font-bold text-xs transition-colors cursor-pointer',
                  adminForm.term_type === term
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                ]"
              >
                {{ term }}
              </button>
            </div>
          </div>

          <!-- 직접입력 모드 전환 알림 바 -->
          <div class="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <span class="text-xs text-slate-600 font-medium">
              모집요강 DB에 없는 대학이나 전형인가요?
            </span>
            <button
              type="button"
              @click="toggleCustomMode"
              class="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-white border border-emerald-300 px-2.5 py-1 rounded cursor-pointer transition-colors shadow-2xs"
            >
              {{ isCustomInputMode ? '📋 모집요강 목록 선택으로 전환' : '✏️ 미등록 대학/전형 직접 입력' }}
            </button>
          </div>

          <!-- 4. 대학 및 전형 선택 영역 -->
          <div class="space-y-3 p-3.5 rounded-xl border border-slate-200 bg-white">
            <!-- (1) 지원 대학 -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">
                지원 대학명 <span class="text-rose-500">*</span>
              </label>
              <select
                v-if="!isCustomInputMode"
                v-model="adminForm.univ_name"
                @change="onAdminUnivChange"
                required
                class="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="">-- 대학 선택 (총 {{ availableFormUnivs.length }}개) --</option>
                <option v-for="u in availableFormUnivs" :key="u.value" :value="u.value">
                  {{ u.label }}
                </option>
              </select>
              <input
                v-else
                v-model="customUnivName"
                type="text"
                required
                placeholder="예: 서울대학교, 연세대학교 등 직접 입력"
                class="w-full p-2 bg-white border border-amber-400 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <!-- (2) 지원 학과(부)명 -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">
                지원 학과(부)명 <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="adminForm.department"
                type="text"
                required
                placeholder="예: 컴퓨터공학과, 경영학과, 의예과 등"
                class="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-indigo-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <p v-if="adminDetectedMedical !== '없음'" class="text-[11px] font-extrabold text-rose-600 mt-1 flex items-center gap-1">
                🏥 메디컬 계열 자동 인식: {{ medicalDisplayNames[adminDetectedMedical] }}
              </p>
            </div>

            <!-- (3) 전형 유형 -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">
                전형 유형 <span class="text-rose-500">*</span>
              </label>
              <select
                v-if="!isCustomInputMode && adminForm.univ_name !== '__CUSTOM__'"
                v-model="adminForm.track_type"
                @change="onAdminTrackTypeChange"
                class="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="">-- 유형 선택 --</option>
                <option v-for="tType in availableFormTrackTypes" :key="tType" :value="tType">
                  {{ tType }}
                </option>
              </select>
              <input
                v-else
                v-model="customTrackType"
                type="text"
                required
                placeholder="예: 학생부교과, 학생부종합, 가군, 나군 등"
                class="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <!-- (4) 전형명 -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">
                전형명 <span class="text-rose-500">*</span>
              </label>
              <select
                v-if="!isCustomInputMode && adminForm.univ_name !== '__CUSTOM__'"
                v-model="adminForm.track_name"
                @change="onAdminTrackNameChange"
                required
                class="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="">-- 전형명 선택 --</option>
                <option v-for="t in availableFormTrackNames" :key="t.id || t.track_name" :value="t.track_name">
                  {{ t.track_name }}
                </option>
              </select>
              <input
                v-else
                v-model="customTrackName"
                type="text"
                required
                placeholder="예: 농어촌학생 특별전형, 기회균형특별전형 등"
                class="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <!-- (5) 비고 / 요강 정보 미리보기 (모집인원, 최저기준 등) -->
            <div v-if="adminSelectedTrackDetails && !isCustomInputMode" class="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] space-y-1 text-slate-600">
              <div class="flex items-center gap-3">
                <span v-if="adminSelectedTrackDetails.recruitment_quota"><strong>모집인원:</strong> {{ adminSelectedTrackDetails.recruitment_quota }}</span>
                <span v-if="adminSelectedTrackDetails.eval_method"><strong>전형방법:</strong> {{ adminSelectedTrackDetails.eval_method }}</span>
              </div>
              <p v-if="adminSelectedTrackDetails.suneung_minimum" class="m-0">
                <strong>수능최저:</strong> {{ adminSelectedTrackDetails.suneung_minimum }}
              </p>
            </div>

            <!-- 비고 메모 입력 -->
            <div>
              <label class="block font-semibold text-slate-700 mb-1">비고 (교사 메모 또는 특이사항)</label>
              <input
                v-model="adminForm.remarks"
                type="text"
                placeholder="특이사항이 있을 경우 입력 (선택)"
                class="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-800"
              />
            </div>
          </div>

          <!-- 하단 버튼 -->
          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              @click="showAdminModal = false"
              class="px-4 py-2 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 cursor-pointer transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              :disabled="adminSubmitting"
              class="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl border-none cursor-pointer transition-colors shadow-sm disabled:bg-slate-300 flex items-center gap-1.5"
            >
              <Check class="w-4 h-4" />
              {{ adminSubmitting ? '저장 중…' : (modalRecordId ? '수정 사항 저장' : '대리 신청 등록 완료') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 🖨️ 추천 대장 인쇄 옵션 모달 -->
    <div v-if="showPrintModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-base font-bold text-slate-900 flex items-center gap-2 m-0">
            <Printer class="w-5 h-5 text-indigo-600" />
            2027 농어촌 전형 추천 대장 인쇄 설정
          </h3>
          <button @click="showPrintModal = false" class="text-slate-400 hover:text-slate-600 font-bold text-lg bg-transparent border-none cursor-pointer">✕</button>
        </div>

        <div class="space-y-3.5 text-xs">
          <!-- 1. 구분 선택 -->
          <div>
            <label class="block font-bold text-slate-700 mb-1">1. 모집 시기 구분</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="cat in ['all', '수시', '정시']"
                :key="cat"
                type="button"
                @click="printFilterCategory = cat"
                class="py-2 rounded-lg border font-bold transition-colors cursor-pointer text-xs"
                :class="printFilterCategory === cat ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'"
              >
                {{ cat === 'all' ? '전체 (수시+정시)' : cat }}
              </button>
            </div>
          </div>

          <!-- 2. 학급 선택 -->
          <div>
            <label class="block font-bold text-slate-700 mb-1">2. 학급 선택</label>
            <select
              v-model="printFilterClass"
              class="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-800"
            >
              <option value="all">전체 학급</option>
              <option v-for="c in classNumbers" :key="c" :value="String(c)">
                3학년 {{ c }}반
              </option>
              <option value="grad">졸업생</option>
            </select>
          </div>

          <!-- 3. 자격 상태 선택 -->
          <div>
            <label class="block font-bold text-slate-700 mb-1">3. 자격 상태</label>
            <select
              v-model="printFilterStatus"
              class="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-800"
            >
              <option value="all">전체 (적격 + 자격주의)</option>
              <option value="eligible">적격</option>
              <option value="warning">자격주의 (확인필요)</option>
            </select>
          </div>

          <!-- 인쇄 대상 요약 안내 -->
          <div class="p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl flex items-center justify-between text-xs text-indigo-900 font-semibold">
            <span>인쇄 대상건수:</span>
            <span class="text-sm font-extrabold text-indigo-700">총 {{ printTargetApplications.length }}건</span>
          </div>

          <p class="text-[11px] text-slate-500 leading-normal m-0 pt-1">
            * 정렬: 재학생 ➔ 졸업생 ➔ 학급 ➔ 학번 ➔ 지망순(1지망~6지망) 오름차순
          </p>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            @click="showPrintModal = false"
            class="px-4 py-2 text-xs font-semibold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer border-none"
          >
            취소
          </button>
          <button
            @click="executePrint"
            :disabled="printTargetApplications.length === 0"
            class="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs cursor-pointer border-none disabled:opacity-40 flex items-center gap-1.5"
          >
            <Printer class="w-3.5 h-3.5" />
            추천 대장 인쇄하기
          </button>
        </div>
      </div>
    </div>

    <!-- 🖨️ 개별 학생 농어촌 전형 추천 확인서 인쇄 모달 -->
    <div v-if="showStudentPrintModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-base font-bold text-slate-900 flex items-center gap-2 m-0">
            <Printer class="w-5 h-5 text-emerald-600" />
            학생별 농어촌 전형 추천 확인서 인쇄
          </h3>
          <button @click="showStudentPrintModal = false" class="text-slate-400 hover:text-slate-600 font-bold text-lg bg-transparent border-none cursor-pointer">✕</button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-1">1. 인쇄 대상 학생 선택</label>
            <select
              v-model="selectedPrintStudentId"
              class="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-slate-800"
            >
              <option value="" disabled>-- 학생을 선택하세요 (총 {{ uniqueAppliedStudents.length }}명) --</option>
              <option v-for="st in uniqueAppliedStudents" :key="st.id" :value="st.id">
                {{ st.label }}
              </option>
            </select>
          </div>

          <!-- 선택된 학생 지망 내역 미리보기 -->
          <div v-if="selectedStudentPreview" class="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div class="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <span class="font-bold text-slate-800 text-sm">
                {{ selectedStudentPreview.student.name }}
                <span class="text-xs font-mono text-slate-500 font-normal ml-1">({{ selectedStudentPreview.student.student_code }})</span>
              </span>
              <span class="text-xs px-2 py-0.5 rounded font-bold" :class="selectedStudentPreview.student.isGrad ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'">
                {{ selectedStudentPreview.student.isGrad ? '졸업생' : `3학년 ${selectedStudentPreview.student.classNo ? `${selectedStudentPreview.student.classNo}반` : ''}` }}
              </span>
            </div>

            <div class="space-y-1 max-h-48 overflow-y-auto pr-1">
              <div
                v-for="app in selectedStudentPreview.apps"
                :key="app.id"
                class="flex items-center justify-between bg-white p-2 rounded border border-slate-200 text-xs"
              >
                <div class="flex items-center gap-2">
                  <span class="font-extrabold text-blue-600">{{ app.choice_number }}지망</span>
                  <span class="font-bold text-slate-900">{{ app.univ_name }}</span>
                  <span class="text-indigo-700 font-semibold">{{ app.department }}</span>
                </div>
                <span class="text-[11px] text-slate-500">{{ app.track_name || app.track_type }}</span>
              </div>
            </div>
          </div>

          <!-- 2. 연락처 입력 및 확인 (학생 인쇄와 동일, 모를 경우 빈칸 가능) -->
          <div v-if="selectedPrintStudentId" class="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-left space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="font-extrabold text-slate-800 flex items-center gap-1.5 text-xs">
                📞 인쇄용 연락처 입력 / 확인 (서명란 아래에 출력)
              </span>
              <span class="text-[11px] text-slate-500 font-medium">
                * 모를 경우 빈칸 가능 (수기 작성란 출력)
              </span>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700 mb-1 text-[11px]">학생 연락처</label>
                <input
                  v-model="printStudentPhone"
                  type="text"
                  placeholder="예: 010-1234-5678 (빈칸 가능)"
                  class="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs text-slate-800"
                />
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1 text-[11px]">학부모(보호자) 비상연락처</label>
                <input
                  v-model="printParentPhone"
                  type="text"
                  placeholder="예: 010-9876-5432 (빈칸 가능)"
                  class="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs text-slate-800"
                />
              </div>
            </div>
          </div>

          <p class="text-[11px] text-slate-500 leading-normal m-0 pt-1">
            * 학생이 직접 신청서 탭에서 인쇄하는 것과 동일한 <strong>2027학년도 대입 농어촌 전형 추천 확인서 (양면 서식)</strong>로 즉시 인쇄 창이 열립니다.
          </p>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            @click="showStudentPrintModal = false"
            class="px-4 py-2 text-xs font-semibold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer border-none"
          >
            취소
          </button>
          <button
            @click="executeSelectedStudentPrint"
            :disabled="!selectedPrintStudentId"
            class="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs cursor-pointer border-none disabled:opacity-40 flex items-center gap-1.5"
          >
            <Printer class="w-3.5 h-3.5" />
            추천 확인서 인쇄하기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import {
  Users,
  FileSpreadsheet,
  AlertTriangle,
  Printer,
  RefreshCw,
  Search,
  Plus,
  PenTool,
  Check
} from 'lucide-vue-next';
import {
  getAllRuralApplications,
  getRuralEligibilityList,
  getRuralTracks,
  getStudentRuralApplications,
  saveStudentRuralApplications,
  updateRuralApplicationByTeacher,
  deleteRuralApplicationByTeacher,
  getRuralSignatures
} from '../../api/ruralApi';
import { printRuralClassRoster, printRuralConfirmationDocument } from '../../utils/ruralPrintHelper';
import { dialog } from '../common/dialog';
import { useAuthStore } from '../../stores/auth';

const auth = useAuthStore();

const loading = ref(false);
const rawApps = ref([]);
const studentList = ref([]);
const allTracks = ref([]);
const filterClass = ref('all');
const searchQuery = ref('');

const classNumbers = Array.from({ length: 11 }, (_, i) => i + 1);

// ── 교사/관리자용 대리 등록 / 수정 모달 상태 (전문대 추천과 동일) ──
const showAdminModal = ref(false);
const modalRecordId = ref(null);
const editingApp = ref(null);
const modalSelectedClass = ref('all');
const modalSelectedStudentId = ref('');
const adminSubmitting = ref(false);

const isCustomInputMode = ref(false);
const customUnivName = ref('');
const customTrackType = ref('');
const customTrackName = ref('');

const adminForm = reactive({
  student_id: null,
  student_name: '',
  student_code: '',
  grade: 3,
  class_no: null,
  seq_no: null,
  is_enrolled: true,
  grad_year: null,

  choice_number: 1,
  term_type: '수시',
  univ_name: '',
  department: '',
  track_type: '',
  track_name: '',
  medical_type: '없음',
  region: '',
  recruitment_quota: '',
  eval_method: '',
  suneung_minimum: '',
  remarks: '',
  track_id: null
});

// 메디컬 감지 헬퍼
function detectMedicalType(deptName) {
  if (!deptName) return '없음';
  const name = String(deptName).trim().replaceAll(' ', '');
  if (/치대|치의예|치의학|치의학과|치의학전문대학원/.test(name)) return '치';
  if (/의예|의학|의대|의학전문대학원/.test(name) && !/한의|수의|치의/.test(name)) return '의';
  if (/한의/.test(name)) return '한';
  if (/약대|약학/.test(name)) return '약';
  if (/수의/.test(name)) return '수';
  return '없음';
}

const medicalDisplayNames = {
  '의': '의과대학',
  '치': '치의학',
  '한': '한의학',
  '약': '약학대학',
  '수': '수의과대학',
  '없음': ''
};

const adminDetectedMedical = computed(() => {
  return detectMedicalType(adminForm.department);
});

onMounted(() => {
  loadData();
});

async function loadData() {
  loading.value = true;
  try {
    const [apps, students, tracks] = await Promise.all([
      getAllRuralApplications(),
      getRuralEligibilityList(),
      getRuralTracks()
    ]);
    rawApps.value = apps || [];
    studentList.value = students || [];
    allTracks.value = tracks || [];
  } catch (e) {
    console.error('Failed to load rural applications data:', e);
  } finally {
    loading.value = false;
  }
}

// ── 모달 내 학생 및 전형 계산 속성 ──────────────────────
const availableStudentsForModal = computed(() => {
  const c = modalSelectedClass.value;
  if (!studentList.value || studentList.value.length === 0) return [];

  return studentList.value.filter(st => {
    const isGrad = st.is_separate_applicant || st.is_graduated || st.is_enrolled === false;
    if (c === 'all') return true;
    if (c === 'grad') return isGrad;
    return !isGrad && Number(st.class_no) === Number(c);
  });
});

const selectedStudentObj = computed(() => {
  if (!modalSelectedStudentId.value) return null;
  return studentList.value.find(s => (s.id || s.student_code) === modalSelectedStudentId.value) || null;
});

const selectedStudentIsEligible = computed(() => {
  const st = selectedStudentObj.value;
  if (!st) return false;
  return Boolean(st.eligibility?.is_eligible || st.eligibility?.is_manual_approved);
});

const studentExistingApps = computed(() => {
  const st = selectedStudentObj.value;
  if (!st) return [];
  return rawApps.value
    .filter(a => a.student_id === st.id)
    .sort((a, b) => Number(a.choice_number) - Number(b.choice_number));
});

function getChoiceApp(num) {
  return studentExistingApps.value.find(a => Number(a.choice_number) === num);
}

function selectChoiceNumber(num) {
  adminForm.choice_number = num;
  const existing = getChoiceApp(num);
  if (existing) {
    adminForm.term_type = existing.term_type || '수시';
    adminForm.univ_name = existing.univ_name || '';
    adminForm.department = existing.department || '';
    adminForm.track_type = existing.track_type || '';
    adminForm.track_name = existing.track_name || '';
    adminForm.medical_type = existing.medical_type || '없음';
    adminForm.region = existing.region || '';
    adminForm.recruitment_quota = existing.recruitment_quota || '';
    adminForm.eval_method = existing.eval_method || '';
    adminForm.suneung_minimum = existing.suneung_minimum || '';
    adminForm.remarks = existing.remarks || '';
    adminForm.track_id = existing.track_id || null;

    const isCustom = existing.is_custom_entry || (existing.remarks && existing.remarks.includes('[미등록'));
    isCustomInputMode.value = Boolean(isCustom);
    if (isCustom) {
      customUnivName.value = existing.univ_name || '';
      customTrackType.value = existing.track_type || '';
      customTrackName.value = existing.track_name || '';
    }
  } else {
    adminForm.univ_name = '';
    adminForm.department = '';
    adminForm.track_type = '';
    adminForm.track_name = '';
    adminForm.medical_type = '없음';
    adminForm.region = '';
    adminForm.recruitment_quota = '';
    adminForm.eval_method = '';
    adminForm.suneung_minimum = '';
    adminForm.remarks = '';
    adminForm.track_id = null;
    isCustomInputMode.value = false;
    customUnivName.value = '';
    customTrackType.value = '';
    customTrackName.value = '';
  }
}

function onStudentSelectChanged() {
  const st = selectedStudentObj.value;
  if (st) {
    adminForm.student_id = st.id;
    adminForm.student_name = st.name;
    adminForm.student_code = String(st.student_code || '');
    adminForm.grade = st.grade || 3;
    adminForm.class_no = st.class_no || null;
    adminForm.seq_no = st.seq_no || null;
    adminForm.is_enrolled = st.is_enrolled !== false;
    adminForm.grad_year = st.grad_year || null;

    // 비어있는 가장 빠른 지망 순번(1~6) 자동 선택
    const existingChoices = new Set(studentExistingApps.value.map(a => Number(a.choice_number)));
    let nextChoice = 1;
    for (let i = 1; i <= 6; i++) {
      if (!existingChoices.has(i)) {
        nextChoice = i;
        break;
      }
    }
    selectChoiceNumber(nextChoice);
  }
}

// ── 전형 요강 드롭다운 필터링 ───────────────────────────
const availableFormUnivs = computed(() => {
  if (!allTracks.value || allTracks.value.length === 0) return [];
  const targetTerm = (adminForm.term_type || '수시').trim();

  const filtered = allTracks.value.filter(t => {
    if (!t.univ_name) return false;
    if (t.term_type && String(t.term_type).trim() !== targetTerm) return false;
    return true;
  });

  const baseList = filtered.length > 0 ? filtered : allTracks.value;

  const uniqueUnivsMap = new Map();
  baseList.forEach(t => {
    const uName = String(t.univ_name).trim();
    if (uName && !uniqueUnivsMap.has(uName)) {
      uniqueUnivsMap.set(uName, {
        univ_name: uName,
        region: String(t.region || '').trim()
      });
    }
  });

  const REGION_PRIORITY = { '서울': 1, '경기': 2, '인천': 3 };

  const sorted = Array.from(uniqueUnivsMap.values()).sort((a, b) => {
    const prioA = REGION_PRIORITY[a.region] ?? 999;
    const prioB = REGION_PRIORITY[b.region] ?? 999;
    if (prioA !== prioB) return prioA - prioB;
    return a.univ_name.localeCompare(b.univ_name, 'ko');
  });

  const result = sorted.map(u => ({
    value: u.univ_name,
    label: u.region ? `[${u.region}] ${u.univ_name}` : u.univ_name
  }));

  result.push({ value: '__CUSTOM__', label: '✏️ 목록에 없는 대학 직접 입력' });
  return result;
});

const availableFormTrackTypes = computed(() => {
  if (!adminForm.univ_name || adminForm.univ_name === '__CUSTOM__') return ['직접입력'];
  const targetUniv = adminForm.univ_name.trim();
  const targetTerm = (adminForm.term_type || '수시').trim();
  const med = adminDetectedMedical.value;

  const tracksForUniv = allTracks.value.filter(t =>
    t.univ_name && String(t.univ_name).trim() === targetUniv &&
    (!t.term_type || String(t.term_type).trim() === targetTerm)
  );

  let filtered = tracksForUniv;
  if (med !== '없음') {
    const medTracks = tracksForUniv.filter(t => t.medical_type === med);
    if (medTracks.length > 0) filtered = medTracks;
  } else {
    const genTracks = tracksForUniv.filter(t => !t.medical_type || t.medical_type === '없음');
    if (genTracks.length > 0) filtered = genTracks;
  }

  const result = Array.from(new Set(filtered.map(t => t.track_type).filter(Boolean)));
  result.push('직접입력');
  return result;
});

const availableFormTrackNames = computed(() => {
  if (!adminForm.univ_name || adminForm.univ_name === '__CUSTOM__') return [];
  const targetUniv = adminForm.univ_name.trim();
  const targetTerm = (adminForm.term_type || '수시').trim();
  const targetType = adminForm.track_type;
  const med = adminDetectedMedical.value;

  let filtered = allTracks.value.filter(t =>
    t.univ_name && String(t.univ_name).trim() === targetUniv &&
    (!t.term_type || String(t.term_type).trim() === targetTerm)
  );

  if (targetType && targetType !== '직접입력') {
    filtered = filtered.filter(t => t.track_type === targetType);
  }

  if (med !== '없음') {
    const medTracks = filtered.filter(t => t.medical_type === med);
    if (medTracks.length > 0) filtered = medTracks;
  } else {
    const genTracks = filtered.filter(t => !t.medical_type || t.medical_type === '없음');
    if (genTracks.length > 0) filtered = genTracks;
  }

  const map = new Map();
  filtered.forEach(t => {
    if (t.track_name && !map.has(t.track_name)) {
      map.set(t.track_name, t);
    }
  });

  const list = Array.from(map.values());
  list.push({ id: '__CUSTOM__', track_name: '✏️ 목록에 없는 전형명 직접 입력' });
  return list;
});

const adminSelectedTrackDetails = computed(() => {
  if (!adminForm.univ_name || !adminForm.track_name || isCustomInputMode.value) return null;
  const targetUniv = adminForm.univ_name.trim();
  const targetTrack = adminForm.track_name.trim();
  const targetTerm = (adminForm.term_type || '수시').trim();

  return allTracks.value.find(t =>
    t.univ_name && String(t.univ_name).trim() === targetUniv &&
    t.track_name && String(t.track_name).trim() === targetTrack &&
    (!t.term_type || String(t.term_type).trim() === targetTerm)
  ) || null;
});

function onTermTypeChange(term) {
  adminForm.term_type = term;
  adminForm.univ_name = '';
  onAdminUnivChange();
}

function onAdminUnivChange() {
  if (adminForm.univ_name === '__CUSTOM__') {
    isCustomInputMode.value = true;
    return;
  }
  adminForm.track_type = '';
  adminForm.track_name = '';
  adminForm.track_id = null;
  adminForm.recruitment_quota = '';
  adminForm.eval_method = '';
  adminForm.suneung_minimum = '';
  adminForm.remarks = '';

  const types = availableFormTrackTypes.value;
  if (types.length === 1) {
    adminForm.track_type = types[0];
  } else if (types.length > 0 && !types.includes(adminForm.track_type)) {
    adminForm.track_type = types[0];
  }
}

function onAdminTrackTypeChange() {
  adminForm.track_name = '';
  const tracks = availableFormTrackNames.value;
  if (tracks.length === 1) {
    adminForm.track_name = tracks[0].track_name;
    onAdminTrackNameChange();
  }
}

function onAdminTrackNameChange() {
  if (adminForm.track_name === '__CUSTOM__') {
    isCustomInputMode.value = true;
    return;
  }
  const match = adminSelectedTrackDetails.value;
  if (match) {
    adminForm.track_id = match.id || null;
    adminForm.track_type = match.track_type || adminForm.track_type;
    adminForm.recruitment_quota = match.recruitment_quota || '';
    adminForm.eval_method = match.eval_method || '';
    adminForm.suneung_minimum = match.suneung_minimum || '';
    adminForm.region = match.region || '';
    if (!adminForm.remarks && match.remarks) {
      adminForm.remarks = match.remarks;
    }
  } else {
    adminForm.track_id = null;
  }
}

function toggleCustomMode() {
  isCustomInputMode.value = !isCustomInputMode.value;
  if (isCustomInputMode.value) {
    if (adminForm.univ_name && adminForm.univ_name !== '__CUSTOM__') customUnivName.value = adminForm.univ_name;
    if (adminForm.track_type && adminForm.track_type !== '직접입력') customTrackType.value = adminForm.track_type;
    if (adminForm.track_name && adminForm.track_name !== '__CUSTOM__') customTrackName.value = adminForm.track_name;
  } else {
    adminForm.univ_name = '';
    onAdminUnivChange();
  }
}

// ── 모달 열기/닫기 및 저장 핸들러 ──────────────────────
async function openCreateModal() {
  modalRecordId.value = null;
  editingApp.value = null;
  modalSelectedStudentId.value = '';

  adminForm.student_id = null;
  adminForm.student_name = '';
  adminForm.student_code = '';
  adminForm.grade = 3;
  adminForm.class_no = null;
  adminForm.seq_no = null;
  adminForm.is_enrolled = true;
  adminForm.grad_year = null;

  adminForm.choice_number = 1;
  adminForm.term_type = '수시';
  adminForm.univ_name = '';
  adminForm.department = '';
  adminForm.track_type = '';
  adminForm.track_name = '';
  adminForm.medical_type = '없음';
  adminForm.region = '';
  adminForm.recruitment_quota = '';
  adminForm.eval_method = '';
  adminForm.suneung_minimum = '';
  adminForm.remarks = '';
  adminForm.track_id = null;

  isCustomInputMode.value = false;
  customUnivName.value = '';
  customTrackType.value = '';
  customTrackName.value = '';

  // 담당 학급 자동 기본값 설정 (교사: 본인 반, 관리자: 현재 필터)
  if (auth.isTeacher && auth.teacherClass) {
    modalSelectedClass.value = String(auth.teacherClass);
  } else if (filterClass.value && filterClass.value !== 'all') {
    modalSelectedClass.value = String(filterClass.value);
  } else {
    modalSelectedClass.value = 'all';
  }

  showAdminModal.value = true;
}

function openEditModal(app) {
  modalRecordId.value = app.id;
  editingApp.value = app;

  const st = studentList.value.find(s => s.id === app.student_id);
  adminForm.student_id = app.student_id;
  adminForm.student_name = st?.name || app.student_name || '학생';
  adminForm.student_code = st?.student_code || app.student_code || '';
  adminForm.grade = st?.grade || 3;
  adminForm.class_no = st?.class_no || app.student_class;
  adminForm.seq_no = st?.seq_no || null;
  adminForm.is_enrolled = st?.is_enrolled !== false;

  modalSelectedStudentId.value = app.student_id;

  adminForm.choice_number = app.choice_number;
  adminForm.term_type = app.term_type || '수시';
  adminForm.univ_name = app.univ_name || '';
  adminForm.department = app.department || '';
  adminForm.track_type = app.track_type || '';
  adminForm.track_name = app.track_name || '';
  adminForm.medical_type = app.medical_type || '없음';
  adminForm.region = app.region || '';
  adminForm.recruitment_quota = app.recruitment_quota || '';
  adminForm.eval_method = app.eval_method || '';
  adminForm.suneung_minimum = app.suneung_minimum || '';
  adminForm.remarks = app.remarks || '';
  adminForm.track_id = app.track_id || null;

  const isCustom = app.is_custom_entry || (app.remarks && app.remarks.includes('[미등록'));
  isCustomInputMode.value = Boolean(isCustom);
  if (isCustom) {
    customUnivName.value = app.univ_name || '';
    customTrackType.value = app.track_type || '';
    customTrackName.value = app.track_name || '';
  } else {
    customUnivName.value = '';
    customTrackType.value = '';
    customTrackName.value = '';
  }

  showAdminModal.value = true;
}

async function handleSaveAdminModal() {
  adminSubmitting.value = true;
  try {
    const targetStudentId = modalRecordId.value
      ? editingApp.value?.student_id
      : (adminForm.student_id || modalSelectedStudentId.value);

    if (!targetStudentId) {
      throw new Error('대상 학생을 선택해 주세요.');
    }

    const finalUniv = (isCustomInputMode.value || adminForm.univ_name === '__CUSTOM__')
      ? customUnivName.value.trim()
      : adminForm.univ_name.trim();

    const finalDept = adminForm.department.trim();

    const finalTrackType = (isCustomInputMode.value || adminForm.univ_name === '__CUSTOM__')
      ? (customTrackType.value.trim() || '기타')
      : (adminForm.track_type.trim() || '기타');

    const finalTrackName = (isCustomInputMode.value || adminForm.univ_name === '__CUSTOM__')
      ? customTrackName.value.trim()
      : (adminForm.track_name.trim() || '농어촌 전형');

    if (!finalUniv) throw new Error('지원 대학명을 입력해 주세요.');
    if (!finalDept) throw new Error('지원 학과(부)명을 입력해 주세요.');
    if (!finalTrackName) throw new Error('지원 전형명을 입력해 주세요.');

    const isCustom = isCustomInputMode.value || adminForm.univ_name === '__CUSTOM__';
    const finalRemarks = isCustom
      ? `[미등록 직접입력] ${adminForm.remarks || ''}`.trim()
      : (adminForm.remarks || '');

    const newAppEntry = {
      choice_number: Number(adminForm.choice_number),
      track_id: adminForm.track_id || null,
      term_type: adminForm.term_type || '수시',
      medical_type: adminForm.medical_type || detectMedicalType(finalDept),
      region: adminForm.region || '',
      univ_name: finalUniv,
      department: finalDept,
      track_type: finalTrackType,
      track_name: finalTrackName,
      recruitment_quota: adminForm.recruitment_quota || '',
      eval_method: adminForm.eval_method || '',
      suneung_minimum: adminForm.suneung_minimum || '',
      remarks: finalRemarks,
      is_warning_acknowledged: true,
      status: 'teacher_proxy_submitted'
    };

    if (modalRecordId.value) {
      // 1. 단일 항목 수정인 경우
      await updateRuralApplicationByTeacher(modalRecordId.value, {
        choice_number: Number(adminForm.choice_number),
        term_type: adminForm.term_type,
        medical_type: adminForm.medical_type || detectMedicalType(finalDept),
        region: adminForm.region || '',
        univ_name: finalUniv,
        department: finalDept,
        track_type: finalTrackType,
        track_name: finalTrackName,
        recruitment_quota: adminForm.recruitment_quota || '',
        eval_method: adminForm.eval_method || '',
        suneung_minimum: adminForm.suneung_minimum || '',
        remarks: finalRemarks
      });
      await dialog.alert({
        title: '수정 완료',
        message: '농어촌 신청 지망 정보가 성공적으로 수정되었습니다.'
      });
    } else {
      // 2. 신규 대리 등록인 경우: 기존 학생의 지망 목록을 가져와 해당 순번에 병합/저장
      const existingApps = await getStudentRuralApplications(targetStudentId);
      const updatedApps = existingApps.filter(a => Number(a.choice_number) !== Number(adminForm.choice_number));
      updatedApps.push(newAppEntry);
      updatedApps.sort((a, b) => Number(a.choice_number) - Number(b.choice_number));

      await saveStudentRuralApplications(targetStudentId, updatedApps);
      await dialog.alert({
        title: '대리 등록 완료',
        message: `${adminForm.student_name} 학생의 ${adminForm.choice_number}지망 (${finalUniv} - ${finalDept}) 신청이 성공적으로 등록되었습니다.`
      });
    }

    showAdminModal.value = false;
    await loadData();
  } catch (e) {
    console.error('Failed to save admin modal:', e);
    await dialog.alert({
      title: '저장 실패',
      message: e.message || '저장 중 오류가 발생했습니다.'
    });
  } finally {
    adminSubmitting.value = false;
  }
}

async function deleteApplication(app) {
  const confirmed = await dialog.confirm({
    title: '신청 항목 삭제',
    message: `${app.student_name} 학생의 ${app.choice_number}지망 (${app.univ_name} - ${app.department}) 신청 항목을 정말 삭제하시겠습니까?\n\n삭제된 항목은 복구할 수 없습니다.`
  });
  if (!confirmed) return;

  try {
    await deleteRuralApplicationByTeacher(app.id);
    await dialog.alert({
      title: '삭제 완료',
      message: '해당 신청 항목이 삭제되었습니다.'
    });
    await loadData();
  } catch (err) {
    console.error('Failed to delete application:', err);
    await dialog.alert({
      title: '삭제 오류',
      message: '항목 삭제 중 오류가 발생하였습니다.'
    });
  }
}

// ── 데이터 테이블 정렬 및 필터링 ────────────────────────
const enrichedApplications = computed(() => {
  const studentMap = new Map();
  studentList.value.forEach(s => {
    studentMap.set(s.id, s);
  });

  return rawApps.value.map(app => {
    const st = studentMap.get(app.student_id);
    const elig = st?.eligibility;
    const isEligible = Boolean(elig?.is_eligible || elig?.is_manual_approved);
    return {
      ...app,
      student_name: st?.name || app.student_name || '미확인학생',
      student_code: st?.student_code || '',
      student_class: st?.class_no || null,
      student_seq: st?.seq_no || null,
      is_warning: !isEligible,
      ineligible_reason: elig?.evaluation_notes || ''
    };
  });
});

const totalAppliedStudents = computed(() => {
  const set = new Set(rawApps.value.map(a => a.student_id));
  return set.size;
});

const totalApplicationsCount = computed(() => rawApps.value.length);

const warningStudentsCount = computed(() => {
  const set = new Set(enrichedApplications.value.filter(a => a.is_warning).map(a => a.student_id));
  return set.size;
});

const customApplicationsCount = computed(() => {
  return rawApps.value.filter(a => a.is_custom_entry || (a.remarks && a.remarks.includes('[미등록'))).length;
});

const customStudentsCount = computed(() => {
  const customApps = rawApps.value.filter(a => a.is_custom_entry || (a.remarks && a.remarks.includes('[미등록')));
  return new Set(customApps.map(a => a.student_id)).size;
});

function sortRuralApplications(a, b) {
  const enrolledA = a.is_enrolled !== false ? 0 : 1;
  const enrolledB = b.is_enrolled !== false ? 0 : 1;
  if (enrolledA !== enrolledB) return enrolledA - enrolledB;

  const classA = a.student_class != null ? Number(a.student_class) : 999;
  const classB = b.student_class != null ? Number(b.student_class) : 999;
  if (classA !== classB) return classA - classB;

  const seqA = a.student_seq != null ? Number(a.student_seq) : 999;
  const seqB = b.student_seq != null ? Number(b.student_seq) : 999;
  if (seqA !== seqB) return seqA - seqB;

  const codeA = String(a.student_code || '');
  const codeB = String(b.student_code || '');
  if (codeA !== codeB) return codeA.localeCompare(codeB, 'ko', { numeric: true });

  const choiceA = Number(a.choice_number || 0);
  const choiceB = Number(b.choice_number || 0);
  if (choiceA !== choiceB) return choiceA - choiceB;

  const univA = String(a.univ_name || '').trim();
  const univB = String(b.univ_name || '').trim();
  if (univA !== univB) return univA.localeCompare(univB, 'ko');

  const deptA = String(a.department || '').trim();
  const deptB = String(b.department || '').trim();
  return deptA.localeCompare(deptB, 'ko');
}

const filteredApplications = computed(() => {
  const filtered = enrichedApplications.value.filter(app => {
    if (filterClass.value !== 'all') {
      if (filterClass.value === 'grad' && app.student_class != null) return false;
      if (filterClass.value !== 'grad' && app.student_class !== Number(filterClass.value)) return false;
    }

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      const matchName = app.student_name.toLowerCase().includes(q);
      const matchCode = app.student_code.toLowerCase().includes(q);
      const matchUniv = app.univ_name.toLowerCase().includes(q);
      const matchDept = app.department.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchUniv && !matchDept) return false;
    }

    return true;
  });

  return [...filtered].sort(sortRuralApplications);
});

// ── 🖨️ 추천 대장 인쇄 로직 ──────────────────────────────
const showPrintModal = ref(false);
const printFilterCategory = ref('all');
const printFilterClass = ref('all');
const printFilterStatus = ref('all');

function openPrintModal() {
  printFilterCategory.value = 'all';
  printFilterClass.value = filterClass.value || 'all';
  printFilterStatus.value = 'all';
  showPrintModal.value = true;
}

const printTargetApplications = computed(() => {
  return enrichedApplications.value.filter(app => {
    if (printFilterCategory.value !== 'all' && app.term_type !== printFilterCategory.value) {
      return false;
    }
    if (printFilterClass.value !== 'all') {
      if (printFilterClass.value === 'grad' && app.student_class != null) return false;
      if (printFilterClass.value !== 'grad' && app.student_class !== Number(printFilterClass.value)) return false;
    }
    if (printFilterStatus.value === 'eligible' && app.is_warning) return false;
    if (printFilterStatus.value === 'warning' && !app.is_warning) return false;
    return true;
  }).sort(sortRuralApplications);
});

function executePrint() {
  if (printTargetApplications.value.length === 0) {
    dialog.alert({
      title: '출력 데이터 없음',
      message: '선택하신 조건에 해당하는 농어촌 신청 데이터가 없습니다.'
    });
    return;
  }

  const catText = printFilterCategory.value === 'all' ? '수시+정시 통합' : printFilterCategory.value;
  const classText = printFilterClass.value === 'all' ? '전체 학급' : (printFilterClass.value === 'grad' ? '졸업생' : `3학년 ${printFilterClass.value}반`);
  const statusText = printFilterStatus.value === 'all' ? '전체' : (printFilterStatus.value === 'eligible' ? '적격자' : '자격주의자');

  const titleStr = `2027학년도 대입 농어촌 전형 추천 대장 (${catText} / ${classText} / ${statusText})`;

  printRuralClassRoster(titleStr, printTargetApplications.value);
  showPrintModal.value = false;
}

// ── 🖨️ 개별 학생 추천 확인서 인쇄 로직 ─────────────────
const showStudentPrintModal = ref(false);
const selectedPrintStudentId = ref('');
const printStudentPhone = ref('');
const printParentPhone = ref('');
const printParentName = ref('');

async function loadStudentContacts(studentId) {
  if (!studentId) {
    printStudentPhone.value = '';
    printParentPhone.value = '';
    printParentName.value = '';
    return;
  }
  const st = studentList.value.find(s => s.id === studentId || s.user_id === studentId);
  const studentApps = rawApps.value.filter(a => a.student_id === studentId);

  let sigData = null;
  try {
    sigData = await getRuralSignatures(studentId);
  } catch (e) {
    console.warn('Failed to load signatures for contacts:', e);
  }

  printStudentPhone.value = studentApps[0]?.student_phone || sigData?.student_phone || st?.phone || '';
  printParentPhone.value = studentApps[0]?.parent_phone || sigData?.parent_phone || st?.parent_phone || '';
  printParentName.value = sigData?.parent_name || '';
}

watch(selectedPrintStudentId, async (newId) => {
  if (newId) {
    await loadStudentContacts(newId);
  } else {
    printStudentPhone.value = '';
    printParentPhone.value = '';
    printParentName.value = '';
  }
});

async function openStudentSelectPrintModal(studentId = null) {
  let targetId = studentId;
  if (!targetId && !selectedPrintStudentId.value && uniqueAppliedStudents.value.length > 0) {
    targetId = uniqueAppliedStudents.value[0].id;
  }
  if (targetId) {
    selectedPrintStudentId.value = targetId;
    await loadStudentContacts(targetId);
  }
  showStudentPrintModal.value = true;
}

const uniqueAppliedStudents = computed(() => {
  const studentMap = new Map();
  studentList.value.forEach(s => {
    studentMap.set(s.id, s);
    if (s.user_id) studentMap.set(s.user_id, s);
  });

  const ids = Array.from(new Set(rawApps.value.map(a => a.student_id)));
  return ids.map(id => {
    const st = studentMap.get(id);
    const apps = rawApps.value.filter(a => a.student_id === id);
    const rawCode = String(st?.student_code || apps[0]?.student_code || '').trim();
    const isGrad = st?.is_enrolled === false || Boolean(st?.grad_year) || rawCode.length > 5;
    const classNo = st?.class_no || apps[0]?.student_class;
    const seqNo = st?.seq_no || st?.student_no;
    const name = st?.name || apps[0]?.student_name || '학생';

    let label = '';
    if (isGrad) {
      label = `[졸업생] ${name} (${rawCode || '-'}) - ${apps.length}건`;
    } else {
      label = `[3학년 ${classNo ? `${classNo}반 ` : ''}${seqNo ? `${seqNo}번` : ''}] ${name} (${rawCode || '-'}) - ${apps.length}건`;
    }

    return {
      id,
      name,
      student_code: rawCode,
      isGrad,
      classNo,
      seqNo,
      appCount: apps.length,
      label
    };
  }).sort((a, b) => {
    if (a.isGrad !== b.isGrad) return a.isGrad ? 1 : -1;
    const cA = Number(a.classNo) || 999;
    const cB = Number(b.classNo) || 999;
    if (cA !== cB) return cA - cB;
    const sA = Number(a.seqNo) || 999;
    const sB = Number(b.seqNo) || 999;
    if (sA !== sB) return sA - sB;
    return a.name.localeCompare(b.name, 'ko');
  });
});

const selectedStudentPreview = computed(() => {
  if (!selectedPrintStudentId.value) return null;
  const st = uniqueAppliedStudents.value.find(s => s.id === selectedPrintStudentId.value);
  if (!st) return null;
  const apps = rawApps.value
    .filter(a => a.student_id === selectedPrintStudentId.value)
    .sort((a, b) => (Number(a.choice_number) || 0) - (Number(b.choice_number) || 0));
  return {
    student: st,
    apps
  };
});

async function executeSelectedStudentPrint() {
  if (!selectedPrintStudentId.value) return;
  const studentId = selectedPrintStudentId.value;
  showStudentPrintModal.value = false;
  await printIndividualConfirmation(studentId, {
    studentPhone: printStudentPhone.value,
    parentPhone: printParentPhone.value,
    parentName: printParentName.value
  });
}

async function printIndividualConfirmation(appOrStudentId, customOptions = null) {
  let targetStudentId = typeof appOrStudentId === 'object' ? appOrStudentId.student_id : appOrStudentId;
  if (!targetStudentId && typeof appOrStudentId === 'object') {
    targetStudentId = appOrStudentId.id;
  }
  if (!targetStudentId) return;

  if (!customOptions) {
    await openStudentSelectPrintModal(targetStudentId);
    return;
  }

  const st = studentList.value.find(s => s.id === targetStudentId || s.user_id === targetStudentId);
  const studentName = st?.name || (typeof appOrStudentId === 'object' ? appOrStudentId.student_name : '학생');
  const studentCode = st?.student_code || (typeof appOrStudentId === 'object' ? appOrStudentId.student_code : '');
  const isEnrolled = st?.is_enrolled !== false;
  const grade = st?.grade || 3;
  const classNo = st?.class_no ?? (typeof appOrStudentId === 'object' ? appOrStudentId.student_class : '');
  const seqNo = st?.seq_no ?? st?.student_no ?? '';

  const studentApps = rawApps.value
    .filter(a => a.student_id === targetStudentId)
    .sort((a, b) => (Number(a.choice_number) || 0) - (Number(b.choice_number) || 0));

  if (studentApps.length === 0) {
    await dialog.alert({
      title: '신청 내역 없음',
      message: `${studentName} 학생의 등록된 농어촌 전형 신청 지망 내역이 없습니다.`
    });
    return;
  }

  let sigData = null;
  try {
    sigData = await getRuralSignatures(targetStudentId);
  } catch (e) {
    console.warn('Failed to load signatures:', e);
  }

  const sSig = sigData?.student_signature || null;
  const pSig = sigData?.parent_signature || null;
  const parentName = customOptions.parentName !== undefined ? customOptions.parentName : (sigData?.parent_name || '');

  const sPhone = customOptions.studentPhone !== undefined
    ? customOptions.studentPhone
    : (studentApps[0]?.student_phone || sigData?.student_phone || st?.phone || '');
  const pPhone = customOptions.parentPhone !== undefined
    ? customOptions.parentPhone
    : (studentApps[0]?.parent_phone || sigData?.parent_phone || st?.parent_phone || '');

  const ruralType = st?.rural_type || (studentApps[0]?.rural_type === 'TYPE_2' ? 'TYPE_2' : 'TYPE_1');
  const isWarningAcknowledged = Boolean(st?.eligibility?.is_eligible || st?.eligibility?.is_manual_approved);

  printRuralConfirmationDocument(
    {
      studentName,
      studentCode,
      isEnrolled,
      grade,
      classNo,
      seqNo,
      studentPhone: sPhone,
      parentPhone: pPhone,
      gradYear: isEnrolled ? null : (st?.grad_year || 2026),
      ruralType,
      isWarningAcknowledged
    },
    studentApps,
    sSig,
    pSig,
    parentName
  );
}
</script>

<style scoped>
.custom-scrollbar {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.custom-scrollbar::-webkit-scrollbar {
  height: 10px;
  display: block;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #e2e8f0;
  border-radius: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #64748b;
  border-radius: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #475569;
}
</style>
