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
          전체 및 학급별 학생들의 농어촌 희망 지망 신청 현황을 확인하고, 오기재 항목 수정 및 결재 대장을 출력할 수 있습니다.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="openStudentSelectPrintModal"
          class="flex items-center gap-1.5 px-3.5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer border-none"
        >
          <Printer class="w-4 h-4" />
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
            드롭다운 목록에 없는 대학/전형을 학생이 직접 입력하여 신청하였습니다. 아래 테이블의 <strong class="text-amber-950 bg-amber-200 px-1.5 py-0.5 rounded font-bold">⚠️ 직접입력</strong> 항목을 확인해 주세요.
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

    <!-- 교사 항목 수정 모달 -->
    <div v-if="showEditModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <h3 class="text-base font-bold text-slate-900 flex items-center gap-2 m-0">
          <Edit3 class="w-5 h-5 text-emerald-600" />
          학생 신청 항목 오기재 수정
        </h3>

        <div v-if="editingApp" class="space-y-3 text-xs">
          <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p class="m-0"><strong class="text-slate-700">학생:</strong> {{ editingApp.student_name }} ({{ editingApp.student_code }})</p>
            <p class="m-0 mt-1"><strong class="text-slate-700">지망:</strong> {{ editingApp.choice_number }}지망 ({{ editingApp.term_type }})</p>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">대학명</label>
            <input
              v-model="editForm.univ_name"
              type="text"
              class="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">학과(부) 입력</label>
            <input
              v-model="editForm.department"
              type="text"
              class="w-full p-2 border border-slate-300 rounded-lg font-bold text-indigo-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">전형 유형</label>
            <input
              v-model="editForm.track_type"
              type="text"
              class="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">전형명</label>
            <input
              v-model="editForm.track_name"
              type="text"
              class="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            @click="showEditModal = false"
            class="px-4 py-2 text-xs font-semibold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer border-none"
          >
            취소
          </button>
          <button
            @click="saveEdit"
            :disabled="savingEdit"
            class="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs cursor-pointer border-none disabled:opacity-50"
          >
            {{ savingEdit ? '저장 중…' : '수정 사항 저장' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 🖨️ 추천 대장 인쇄 옵션 모달 -->
    <div v-if="showPrintModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-base font-bold text-slate-900 flex items-center gap-2 m-0">
            <Printer class="w-5 h-5 text-indigo-600" />
            농어촌 추천 대장 인쇄 옵션 설정
          </h3>
          <button @click="showPrintModal = false" class="text-slate-400 hover:text-slate-600 font-bold text-lg bg-transparent border-none cursor-pointer">✕</button>
        </div>

        <div class="space-y-3 text-xs">
          <!-- 1. 재학생 / 졸업생 구분 선택 -->
          <div>
            <label class="block font-bold text-slate-700 mb-1">1. 구분 (재학생 / 졸업생)</label>
            <select
              v-model="printFilterCategory"
              class="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-800"
            >
              <option value="all">전체 (재학생 + 졸업생)</option>
              <option value="enrolled">재학생</option>
              <option value="graduated">졸업생</option>
            </select>
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
import { ref, computed, onMounted, watch } from 'vue';
import { Users, FileSpreadsheet, AlertTriangle, Printer, RefreshCw, Search, Edit3 } from 'lucide-vue-next';
import { getAllRuralApplications, getRuralEligibilityList, updateRuralApplicationByTeacher, deleteRuralApplicationByTeacher, getRuralSignatures } from '../../api/ruralApi';
import { printRuralClassRoster, printRuralConfirmationDocument } from '../../utils/ruralPrintHelper';
import { dialog } from '../common/dialog';

const loading = ref(false);
const rawApps = ref([]);
const studentList = ref([]);
const filterClass = ref('all');
const searchQuery = ref('');

const classNumbers = Array.from({ length: 11 }, (_, i) => i + 1);

const showEditModal = ref(false);
const editingApp = ref(null);
const savingEdit = ref(false);
const editForm = ref({
  univ_name: '',
  department: '',
  track_type: '',
  track_name: ''
});

onMounted(() => {
  loadData();
});

async function loadData() {
  loading.value = true;
  try {
    const [apps, students] = await Promise.all([
      getAllRuralApplications(),
      getRuralEligibilityList()
    ]);
    rawApps.value = apps;
    studentList.value = students;
  } catch (e) {
    console.error('Failed to load rural applications data:', e);
  } finally {
    loading.value = false;
  }
}

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
  // 1. 구분 (재학생: 0, 졸업생: 1) -> 졸업생은 재학생 뒤로
  const enrolledA = a.is_enrolled !== false ? 0 : 1;
  const enrolledB = b.is_enrolled !== false ? 0 : 1;
  if (enrolledA !== enrolledB) return enrolledA - enrolledB;

  // 2. 학급 (1~11반, 없거나 졸업생은 999)
  const classA = a.student_class != null ? Number(a.student_class) : 999;
  const classB = b.student_class != null ? Number(b.student_class) : 999;
  if (classA !== classB) return classA - classB;

  // 3. 번호 (student_seq)
  const seqA = a.student_seq != null ? Number(a.student_seq) : 999;
  const seqB = b.student_seq != null ? Number(b.student_seq) : 999;
  if (seqA !== seqB) return seqA - seqB;

  // 4. 학번 (student_code)
  const codeA = String(a.student_code || '');
  const codeB = String(b.student_code || '');
  if (codeA !== codeB) return codeA.localeCompare(codeB, 'ko', { numeric: true });

  // 5. 지망 순위 (choice_number: 1지망 -> 2지망...)
  const choiceA = Number(a.choice_number || 0);
  const choiceB = Number(b.choice_number || 0);
  if (choiceA !== choiceB) return choiceA - choiceB;

  // 6. 대학명 -> 학과명
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

function openEditModal(app) {
  editingApp.value = app;
  editForm.value = {
    univ_name: app.univ_name,
    department: app.department,
    track_type: app.track_type,
    track_name: app.track_name
  };
  showEditModal.value = true;
}

async function saveEdit() {
  if (!editingApp.value) return;
  savingEdit.value = true;
  try {
    await updateRuralApplicationByTeacher(editingApp.value.id, editForm.value);
    await dialog.alert({
      title: '수정 완료',
      message: '학생 신청 항목이 성공적으로 수정되었습니다.'
    });
    showEditModal.value = false;
    await loadData();
  } catch (err) {
    console.error('Failed to update application:', err);
    await dialog.alert({
      title: '수정 오류',
      message: '항목 수정 중 오류가 발생하였습니다.'
    });
  } finally {
    savingEdit.value = false;
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

function openPrintModal() {
  showPrintModal.value = true;
}

const showPrintModal = ref(false);
const printFilterCategory = ref('all');
const printFilterClass = ref('all');
const printFilterStatus = ref('all');

function sortRuralApplicationsForPrint(apps) {
  return [...apps].sort(sortRuralApplications);
}

const printTargetApplications = computed(() => {
  const filtered = enrichedApplications.value.filter(app => {
    // 1. 구분 필터
    if (printFilterCategory.value === 'enrolled' && app.is_enrolled === false) return false;
    if (printFilterCategory.value === 'graduated' && app.is_enrolled !== false) return false;

    // 2. 학급 필터
    if (printFilterClass.value !== 'all') {
      if (printFilterClass.value === 'grad' && app.student_class != null) return false;
      if (printFilterClass.value !== 'grad' && app.student_class !== Number(printFilterClass.value)) return false;
    }

    // 3. 자격 상태 필터
    if (printFilterStatus.value === 'eligible' && app.is_warning) return false;
    if (printFilterStatus.value === 'warning' && !app.is_warning) return false;

    return true;
  });

  return sortRuralApplicationsForPrint(filtered);
});

function executePrint() {
  const catText = printFilterCategory.value === 'enrolled' ? '재학생' : (printFilterCategory.value === 'graduated' ? '졸업생' : '전체');
  const classText = printFilterClass.value === 'all' ? '전체학급' : (printFilterClass.value === 'grad' ? '졸업생' : `3학년 ${printFilterClass.value}반`);
  const statusText = printFilterStatus.value === 'eligible' ? '적격' : (printFilterStatus.value === 'warning' ? '자격주의' : '전체');

  const titleStr = `2027학년도 대입 농어촌 전형 추천 대장 (${catText} / ${classText} / ${statusText})`;

  printRuralClassRoster(titleStr, printTargetApplications.value);
  showPrintModal.value = false;
}

// 🖨️ 개별 학생 추천 확인서 인쇄 로직
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

  // 커스텀 옵션이 제공되지 않은 경우, 모달을 열어 교사/관리자가 연락처를 확인/입력/빈칸 처리할 수 있도록 유도
  if (!customOptions) {
    await openStudentSelectPrintModal(targetStudentId);
    return;
  }

  // 1. 학생 정보 조회
  const st = studentList.value.find(s => s.id === targetStudentId || s.user_id === targetStudentId);
  const studentName = st?.name || (typeof appOrStudentId === 'object' ? appOrStudentId.student_name : '학생');
  const studentCode = st?.student_code || (typeof appOrStudentId === 'object' ? appOrStudentId.student_code : '');
  const isEnrolled = st?.is_enrolled !== false;
  const grade = st?.grade || 3;
  const classNo = st?.class_no ?? (typeof appOrStudentId === 'object' ? appOrStudentId.student_class : '');
  const seqNo = st?.seq_no ?? st?.student_no ?? '';

  // 2. 해당 학생의 모든 신청 지망 목록 (1지망~ 정렬)
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

  // 3. 서명 및 연락처 정보 로드
  let sigData = null;
  try {
    sigData = await getRuralSignatures(targetStudentId);
  } catch (e) {
    console.warn('Failed to load signatures:', e);
  }

  const sSig = sigData?.student_signature || null;
  const pSig = sigData?.parent_signature || null;
  const parentName = customOptions.parentName !== undefined ? customOptions.parentName : (sigData?.parent_name || '');

  // 연락처: 커스텀 입력값 우선 (모르면 빈칸 가능, 빈칸 시 서식에 수기 작성란 형식으로 출력)
  const sPhone = customOptions.studentPhone !== undefined
    ? customOptions.studentPhone
    : (studentApps[0]?.student_phone || sigData?.student_phone || st?.phone || '');
  const pPhone = customOptions.parentPhone !== undefined
    ? customOptions.parentPhone
    : (studentApps[0]?.parent_phone || sigData?.parent_phone || st?.parent_phone || '');

  const ruralType = st?.rural_type || (studentApps[0]?.rural_type === 'TYPE_2' ? 'TYPE_2' : 'TYPE_1');
  const isWarningAcknowledged = Boolean(st?.eligibility?.is_eligible || st?.eligibility?.is_manual_approved);

  // 4. 학생이 인쇄하는 것과 동일한 서식으로 인쇄 실행
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
