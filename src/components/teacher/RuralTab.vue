<template>
  <div class="space-y-6">
    <!-- 헤더 영역 -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <div>
        <h2 class="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Building2 class="w-6 h-6 text-emerald-600" />
          농어촌 특별전형 추천자 자격 관리
        </h2>
        <p class="text-sm text-slate-500 mt-1">
          3학년 학생들의 6년 읍·면 재학 및 거주 요건 자동 검증 결과 및 수동 소명 자격 상태를 관리합니다.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="loadData"
          :disabled="loading"
          class="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw :class="{ 'animate-spin': loading }" class="w-4 h-4 text-slate-500" />
          새로고침
        </button>
      </div>
    </div>

    <!-- 엑셀 파일 업로드 안내 배너 -->
    <div class="bg-linear-to-r from-indigo-50 to-blue-50 border border-indigo-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold shadow-xs">
          <UploadCloud class="w-5 h-5" />
        </div>
        <div>
          <h4 class="text-sm font-bold text-slate-900 m-0 flex items-center gap-1.5">
            📂 엑셀 파일 업로드 안내
          </h4>
          <p class="text-xs text-slate-600 mt-1 mb-0 leading-relaxed">
            3학년 인적사항(주소) 및 학적사항(학교) 엑셀 파일 업로드는 왼쪽 메뉴의 <strong class="text-indigo-700 font-bold">[⚙️ 환경설정]</strong> 메뉴에서 등록 및 파싱 검증을 진행해 주세요.
          </p>
        </div>
      </div>
    </div>

    <!-- 3학년 재학생 요약 통계 카운터 -->
    <div class="space-y-1.5">
      <div class="flex items-center gap-1.5 text-xs font-bold text-slate-700">
        <Users class="w-4 h-4 text-blue-600" />
        <span>3학년 재학생 현황</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-slate-500">3학년 전체 대상 학생</p>
            <p class="text-2xl font-bold text-slate-900 mt-1">{{ grade3TotalCount }}명</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            <Users class="w-5 h-5" />
          </div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-emerald-600">지원가능 (자동 적격)</p>
            <p class="text-2xl font-bold text-emerald-600 mt-1">{{ grade3EligibleCount }}명</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 class="w-5 h-5" />
          </div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-rose-600">지원불가 (요건 미달)</p>
            <p class="text-2xl font-bold text-rose-600 mt-1">{{ grade3IneligibleCount }}명</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
            <XCircle class="w-5 h-5" />
          </div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-amber-600">수동 변경/소명 인정</p>
            <p class="text-2xl font-bold text-amber-600 mt-1">{{ grade3ManualApprovedCount }}명</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <UserCheck class="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>

    <!-- 졸업생 요약 통계 카운터 -->
    <div class="space-y-1.5">
      <div class="flex items-center gap-1.5 text-xs font-bold text-amber-900">
        <UserCheck class="w-4 h-4 text-amber-600" />
        <span>졸업생 현황</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div class="p-4 rounded-xl border border-amber-200/70 bg-amber-50/10 shadow-xs flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-slate-500">졸업생 전체 대상 학생</p>
            <p class="text-2xl font-bold text-slate-900 mt-1">{{ gradTotalCount }}명</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-amber-100/60 flex items-center justify-center text-amber-700 font-bold text-sm">
            🎓
          </div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-emerald-600">지원가능 (자동 적격)</p>
            <p class="text-2xl font-bold text-emerald-600 mt-1">{{ gradEligibleCount }}명</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 class="w-5 h-5" />
          </div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-rose-600">지원불가 (요건 미달)</p>
            <p class="text-2xl font-bold text-rose-600 mt-1">{{ gradIneligibleCount }}명</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
            <XCircle class="w-5 h-5" />
          </div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-amber-600">수동 변경/소명 인정</p>
            <p class="text-2xl font-bold text-amber-600 mt-1">{{ gradManualApprovedCount }}명</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <UserCheck class="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>

    <!-- 데이터 테이블 및 검색/필터 바 -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <!-- 반 선택 필터 -->
          <select
            v-model="filterClass"
            class="px-3 py-1.5 pr-7 text-xs bg-white border border-slate-300 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-48"
          >
            <option value="all">전체 학급 (1~11반 + 졸업생)</option>
            <option v-for="c in 11" :key="c" :value="c">{{ c }}반</option>
            <option value="graduated">🎓 졸업생</option>
          </select>

          <!-- 자격 상태 필터 -->
          <select
            v-model="filterStatus"
            class="px-3 py-1.5 pr-7 text-xs bg-white border border-slate-300 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-44"
          >
            <option value="all">전체 상태 보기</option>
            <option value="eligible">지원가능 (적격)</option>
            <option value="ineligible">지원불가 (미달)</option>
            <option value="manual">수동 인정/변경자</option>
          </select>
        </div>

        <!-- 학생 이름/학번 검색 -->
        <div class="relative w-full sm:w-64">
          <Search class="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="학생 이름 또는 학번 검색..."
            class="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <!-- 테이블 목록 -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th class="py-3 px-3">구분</th>
              <th class="py-3 px-3">학번</th>
              <th class="py-3 px-3">이름</th>
              <th class="py-3 px-3 text-center">인적사항 (주소)</th>
              <th class="py-3 px-3 text-center">학적사항 (중/고교)</th>
              <th class="py-3 px-3 text-center">유형 I (6년)</th>
              <th class="py-3 px-3 text-center">유형 II (12년)</th>
              <th class="py-3 px-3 text-center">최종 자격 상태</th>
              <th class="py-3 px-3 text-center">소명/수정</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-if="filteredList.length === 0">
              <td colspan="9" class="py-8 text-center text-slate-400">
                조회된 농어촌 전형 대상 학생 데이터가 없습니다. (엑셀 파일 업로드 필요)
              </td>
            </tr>
            <tr
              v-for="item in filteredList"
              :key="item.id"
              class="hover:bg-slate-50 transition-colors"
            >
              <td class="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                <span v-if="item.is_separate_applicant || item.is_graduated || item.is_enrolled === false" class="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs">
                  졸업생
                </span>
                <span v-else class="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                  재학생
                </span>
              </td>
              <td class="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">{{ item.student_code || '-' }}</td>
              <td class="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">{{ item.name }}</td>
              
              <!-- 1) 인적사항 (주소 6년 읍면) 자격 -->
              <td class="py-3 px-3 text-center">
                <span
                  v-if="item.addressInfo"
                  :class="[
                    'px-2 py-0.5 rounded text-[11px] font-semibold inline-flex items-center gap-1',
                    item.addressInfo.has_rural_address ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  ]"
                >
                  {{ item.addressInfo.has_rural_address ? '적격 (읍·면)' : '미달 (동지역)' }}
                </span>
                <span v-else class="text-slate-400">미등록</span>
              </td>
              
              <!-- 2) 학적사항 (학교 6년 중/고교) 자격 -->
              <td class="py-3 px-3 text-center">
                <span
                  v-if="item.eligibility?.academic_rural_valid"
                  class="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  적격 (중·고교)
                </span>
                <span
                  v-else-if="item.academicRecords && item.academicRecords.length > 0"
                  class="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200"
                >
                  미달
                </span>
                <span v-else class="text-slate-400">미등록</span>
              </td>

              <!-- 3) 유형 I (6년) 자격 (주소 & 학적 모두 충족) -->
              <td class="py-3 px-3 text-center">
                <span
                  :class="[
                    'px-2 py-0.5 rounded text-[11px] font-semibold',
                    item.eligibility?.is_type1_eligible ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                  ]"
                >
                  {{ item.eligibility?.is_type1_eligible ? '적격 (6년)' : '미달' }}
                </span>
              </td>

              <!-- 4) 유형 II (12년) 자격 (교사 수동 판단) -->
              <td class="py-3 px-3 text-center">
                <span
                  :class="[
                    'px-2 py-0.5 rounded text-[11px] font-semibold',
                    item.eligibility?.is_type2_eligible ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-400'
                  ]"
                >
                  {{ item.eligibility?.is_type2_eligible ? '적격 (교사지정)' : '미확인 (수동)' }}
                </span>
              </td>

              <!-- 5) 최종 자격 상태 -->
              <td class="py-3 px-3 text-center">
                <span
                  :class="[
                    'px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 shadow-sm',
                    item.eligibility?.is_type1_eligible
                      ? 'bg-emerald-500 text-white'
                      : (item.eligibility?.is_type2_eligible
                          ? 'bg-amber-500 text-white'
                          : (item.eligibility?.is_manual_approved ? 'bg-blue-600 text-white' : 'bg-rose-500 text-white'))
                  ]"
                >
                  <CheckCircle2 v-if="item.eligibility?.is_eligible || item.eligibility?.is_manual_approved" class="w-3.5 h-3.5" />
                  <XCircle v-else class="w-3.5 h-3.5" />
                  {{
                    item.eligibility?.is_type1_eligible
                      ? '유형I 지원가능'
                      : (item.eligibility?.is_type2_eligible
                          ? '유형II 지원가능'
                          : (item.eligibility?.is_manual_approved ? '수동승인 지원가능' : '지원불가'))
                  }}
                </span>
              </td>

              <!-- 소명/수동 수정 버튼 -->
              <td class="py-3 px-3 text-center">
                <button
                  @click="openManualModal(item)"
                  class="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 transition-colors cursor-pointer"
                >
                  수정/소명
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 수동 인정/소명 관리 모달 -->
    <div v-if="showModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
        <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
          <UserCheck class="w-5 h-5 text-blue-600" />
          농어촌 전형 자격 상태 수동 수정 & 소명
        </h3>

        <div v-if="selectedStudent" class="space-y-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
          <p><strong class="text-slate-700">학생:</strong> {{ selectedStudent.name }} (3학년 {{ selectedStudent.class_no }}반 {{ selectedStudent.seq_no }}번)</p>
          <p><strong class="text-slate-700">주소:</strong> {{ selectedStudent.addressInfo?.raw_address_text || '미등록' }}</p>
          <p class="leading-relaxed"><strong class="text-slate-700">자동 검증 리포트:</strong> {{ selectedStudent.eligibility?.evaluation_notes || '기록 없음' }}</p>
        </div>

        <!-- 1) 유형 I 수동 승인 -->
        <div class="space-y-2 border-t border-slate-100 pt-3">
          <label class="block text-xs font-bold text-slate-800">1. 유형 I (6년) 수동 인정 / 소명 승인</label>
          <div class="flex items-center gap-4 text-xs">
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" :value="true" v-model="modalForm.isManualApproved" class="text-blue-600" />
              <span class="font-bold text-emerald-700">유형 I 지원가능 (수동 인정)</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" :value="false" v-model="modalForm.isManualApproved" class="text-blue-600" />
              <span class="font-bold text-slate-600">자동 검증 결과 유지</span>
            </label>
          </div>
        </div>

        <!-- 2) 유형 II 수동 승인 -->
        <div class="space-y-2 border-t border-slate-100 pt-3">
          <label class="block text-xs font-bold text-slate-800">2. 유형 II (12년 초·중·고) 자격 지정</label>
          <label class="flex items-center gap-2 cursor-pointer bg-amber-50/60 p-2.5 rounded-lg border border-amber-200">
            <input type="checkbox" v-model="modalForm.isType2Eligible" class="rounded text-amber-600 focus:ring-amber-500 w-4 h-4" />
            <span class="text-xs font-bold text-amber-900">유형 II (12년 전 교육과정 읍면 거주/재학) 적격 학생으로 수동 지정</span>
          </label>
          <p class="text-[11px] text-slate-500 leading-snug m-0">
            ※ 업로드 파일에는 초등학교 및 중학교 입학 이력이 포함되어 있지 않으므로 유형 II 자격은 교사가 증빙 서류 개별 확인 후 수동으로 지정해야 합니다.
          </p>
        </div>

        <!-- 3) 사유 입력 -->
        <div class="space-y-1 border-t border-slate-100 pt-3">
          <label class="block text-xs font-bold text-slate-700">수정 사유 및 소명 내용</label>
          <textarea
            v-model="modalForm.reason"
            rows="3"
            placeholder="행정구역 변경, 이사 소명 또는 유형 II 증빙 서류 확인 사유를 상세히 입력하세요."
            class="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          ></textarea>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            @click="showModal = false"
            class="px-3.5 py-1.5 text-xs font-semibold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
          >
            취소
          </button>
          <button
            @click="saveManualApproval"
            :disabled="savingModal"
            class="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
          >
            저장하기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import {
  Building2,
  UploadCloud,
  RefreshCw,
  Users,
  CheckCircle2,
  XCircle,
  UserCheck,
  Search
} from 'lucide-vue-next';

import { getRuralEligibilityList, updateRuralManualApproval } from '../../api/ruralApi';

const loading = ref(false);
const studentList = ref([]);
const filterClass = ref('all');
const filterStatus = ref('all');
const searchQuery = ref('');

const showModal = ref(false);
const selectedStudent = ref(null);
const savingModal = ref(false);
const modalForm = ref({
  isManualApproved: false,
  isType2Eligible: false,
  reason: ''
});

onMounted(() => {
  loadData();
});

async function loadData() {
  loading.value = true;
  try {
    const list = await getRuralEligibilityList();
    studentList.value = list;
  } catch (e) {
    console.error('Failed to load rural eligibility list:', e);
  } finally {
    loading.value = false;
  }
}

// 3학년 재학생 통계
const isGrad = (s) => s.is_separate_applicant || s.is_graduated || s.is_enrolled === false;

const grade3List = computed(() => studentList.value.filter(s => !isGrad(s)));
const grade3TotalCount = computed(() => grade3List.value.length);
const grade3EligibleCount = computed(() => grade3List.value.filter(s => s.eligibility?.is_eligible || s.eligibility?.is_type1_eligible || s.eligibility?.is_type2_eligible || s.eligibility?.is_manual_approved).length);
const grade3IneligibleCount = computed(() => grade3List.value.filter(s => !s.eligibility?.is_eligible && !s.eligibility?.is_type1_eligible && !s.eligibility?.is_type2_eligible && !s.eligibility?.is_manual_approved).length);
const grade3ManualApprovedCount = computed(() => grade3List.value.filter(s => s.eligibility?.is_manual_approved || s.eligibility?.is_type2_eligible).length);

// 졸업생 통계 (농어촌 전형 지원을 체크한 졸업생만 잡히도록 필터링)
const gradList = computed(() => studentList.value.filter(s => isGrad(s) && s.apply_rural !== false));
const gradTotalCount = computed(() => gradList.value.length);
const gradEligibleCount = computed(() => gradList.value.filter(s => s.eligibility?.is_eligible || s.eligibility?.is_type1_eligible || s.eligibility?.is_type2_eligible || s.eligibility?.is_manual_approved).length);
const gradIneligibleCount = computed(() => gradList.value.filter(s => !s.eligibility?.is_eligible && !s.eligibility?.is_type1_eligible && !s.eligibility?.is_type2_eligible && !s.eligibility?.is_manual_approved).length);
const gradManualApprovedCount = computed(() => gradList.value.filter(s => s.eligibility?.is_manual_approved || s.eligibility?.is_type2_eligible).length);

const filteredList = computed(() => {
  return studentList.value.filter(item => {
    // 반 필터
    if (filterClass.value === 'graduated') {
      if (!isGrad(item)) return false;
    } else if (filterClass.value !== 'all') {
      if (isGrad(item)) return false;
      if (item.class_no !== Number(filterClass.value)) return false;
    }
    // 상태 필터
    const isEligible = item.eligibility?.is_eligible || item.eligibility?.is_type1_eligible || item.eligibility?.is_type2_eligible || item.eligibility?.is_manual_approved;
    if (filterStatus.value === 'eligible' && !isEligible) {
      return false;
    }
    if (filterStatus.value === 'ineligible' && isEligible) {
      return false;
    }
    if (filterStatus.value === 'manual' && !item.eligibility?.is_manual_approved && !item.eligibility?.is_type2_eligible) {
      return false;
    }
    // 검색어
    if (searchQuery.value) {
      const q = searchQuery.value.trim().toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchCode = (item.student_code || '').toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }
    return true;
  });
});

function openManualModal(item) {
  selectedStudent.value = item;
  modalForm.value = {
    isManualApproved: item.eligibility?.is_manual_approved || false,
    isType2Eligible: item.eligibility?.is_type2_eligible || false,
    reason: item.eligibility?.manual_reason || ''
  };
  showModal.value = true;
}

async function saveManualApproval() {
  if (!selectedStudent.value) return;
  savingModal.value = true;

  try {
    await updateRuralManualApproval(
      selectedStudent.value.id,
      modalForm.value.isManualApproved,
      modalForm.value.isType2Eligible,
      modalForm.value.reason
    );
    showModal.value = false;
    await loadData();
  } catch (e) {
    console.error('Failed to update manual approval:', e);
    alert('소명 및 수동 인정 저장에 실패했습니다.');
  } finally {
    savingModal.value = false;
  }
}
</script>
