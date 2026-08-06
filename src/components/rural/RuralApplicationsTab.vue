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
          @click="printRoster"
          class="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer border-none"
        >
          <Printer class="w-4 h-4" />
          2027 농어촌 전형 추천 대장 인쇄 (4단 결재)
        </button>
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
              <th class="py-3 px-3.5 whitespace-nowrap bg-slate-50" style="width: 80px; min-width: 80px;">학반</th>
              <th class="py-3 px-3.5 whitespace-nowrap bg-slate-50" style="width: 80px; min-width: 80px;">학번</th>
              <th class="py-3 px-3.5 whitespace-nowrap bg-slate-50" style="width: 100px; min-width: 100px;">이름</th>
              <th class="py-3 px-3.5 text-center whitespace-nowrap bg-slate-50" style="width: 100px; min-width: 100px;">자격상태</th>
              <th class="py-3 px-3.5 text-center whitespace-nowrap bg-slate-50" style="width: 70px; min-width: 70px;">지망</th>
              <th class="py-3 px-3.5 text-center whitespace-nowrap bg-slate-50" style="width: 70px; min-width: 70px;">구분</th>
              <th class="py-3 px-3.5 whitespace-nowrap bg-slate-50" style="width: 160px; min-width: 160px;">대학명</th>
              <th class="py-3 px-3.5 whitespace-nowrap bg-slate-50" style="width: 180px; min-width: 180px;">학과(부)</th>
              <th class="py-3 px-3.5 whitespace-nowrap bg-slate-50" style="width: 110px; min-width: 110px;">전형유형</th>
              <th class="py-3 px-3.5 whitespace-nowrap bg-slate-50" style="width: 200px; min-width: 200px;">전형명</th>
              <th class="py-3 px-3.5 text-center whitespace-nowrap bg-slate-50" style="width: 70px; min-width: 70px;">수정</th>
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
              <td class="py-3 px-3.5 font-bold text-slate-900 whitespace-nowrap">{{ app.student_name }}</td>

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
              <td class="py-3 px-4 font-semibold text-slate-800">{{ app.track_name }}</td>

              <!-- 교사 수정 버튼 -->
              <td class="py-3 px-4 text-center">
                <button
                  @click="openEditModal(app)"
                  class="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 transition-colors cursor-pointer"
                >
                  수정
                </button>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Users, FileSpreadsheet, AlertTriangle, Printer, RefreshCw, Search, Edit3 } from 'lucide-vue-next';
import { getAllRuralApplications, getRuralEligibilityList, updateRuralApplicationByTeacher } from '../../api/ruralApi';
import { printRuralClassRoster } from '../../utils/ruralPrintHelper';
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

const filteredApplications = computed(() => {
  return enrichedApplications.value.filter(app => {
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

function printRoster() {
  const titleStr = filterClass.value === 'all'
    ? '2027학년도 대입 농어촌 전형 추천 대장 (전체)'
    : filterClass.value === 'grad'
      ? '2027학년도 대입 농어촌 전형 추천 대장 (졸업생)'
      : `2027학년도 대입 농어촌 전형 추천 대장 (3학년 ${filterClass.value}반)`;

  printRuralClassRoster(titleStr, filteredApplications.value);
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
