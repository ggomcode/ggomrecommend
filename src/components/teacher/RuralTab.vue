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
          3학년 각 반의 인적사항(주소) 및 학적사항(학교) 엑셀 파일을 각각 업로드하여 6년 읍·면 재학 및 거주 요건을 자동 검증합니다.
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

    <!-- 엑셀 분리 업로드 구역 (인적사항 / 학적사항) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- 1. 인적사항(주소) 엑셀 업로드 -->
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-base font-bold text-slate-900 flex items-center gap-2 m-0">
              <FileSpreadsheet class="w-5 h-5 text-indigo-600" />
              인적사항(주소) 엑셀 파일 업로드
            </h3>
            <span v-if="addressFilesCount > 0" class="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
              {{ addressFilesCount }}개 등록됨
            </span>
          </div>

          <div
            @dragover.prevent="isDraggingAddress = true"
            @dragleave.prevent="isDraggingAddress = false"
            @drop.prevent="handleAddressFileDrop"
            :class="[
              'border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer',
              isDraggingAddress ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'
            ]"
            @click="triggerAddressInput"
          >
            <input
              ref="addressFileInputRef"
              type="file"
              multiple
              accept=".xlsx, .xls"
              class="hidden"
              @change="handleAddressFileSelect"
            />
            <div class="flex flex-col items-center justify-center gap-2">
              <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <UploadCloud class="w-5 h-5" />
              </div>
              <div>
                <p class="text-xs font-bold text-slate-800">
                  인적사항(주소) 엑셀 파일 클릭 선택 또는 드롭
                </p>
                <p class="text-[11px] text-slate-500 mt-0.5">
                  `인적사항_주소_1반~11반.xlsx` 파일들을 이곳에 첨부하세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. 학적사항(학교) 엑셀 업로드 -->
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-base font-bold text-slate-900 flex items-center gap-2 m-0">
              <FileSpreadsheet class="w-5 h-5 text-amber-600" />
              학적사항(학교) 엑셀 파일 업로드
            </h3>
            <span v-if="academicFilesCount > 0" class="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              {{ academicFilesCount }}개 등록됨
            </span>
          </div>

          <div
            @dragover.prevent="isDraggingAcademic = true"
            @dragleave.prevent="isDraggingAcademic = false"
            @drop.prevent="handleAcademicFileDrop"
            :class="[
              'border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer',
              isDraggingAcademic ? 'border-amber-500 bg-amber-50/50' : 'border-slate-300 hover:border-amber-400 bg-slate-50/50'
            ]"
            @click="triggerAcademicInput"
          >
            <input
              ref="academicFileInputRef"
              type="file"
              multiple
              accept=".xlsx, .xls"
              class="hidden"
              @change="handleAcademicFileSelect"
            />
            <div class="flex flex-col items-center justify-center gap-2">
              <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <UploadCloud class="w-5 h-5" />
              </div>
              <div>
                <p class="text-xs font-bold text-slate-800">
                  학적사항(학교) 엑셀 파일 클릭 선택 또는 드롭
                </p>
                <p class="text-[11px] text-slate-500 mt-0.5">
                  `학적사항_1반~11반.xlsx` 파일들을 이곳에 첨부하세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 등록된 파일 현황 및 자동 검증 실행 버튼 -->
    <div v-if="uploadStatus.files.length > 0" class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
        <div>
          <span class="text-xs font-bold text-slate-800">
            등록 완료된 파일 목록 (총 {{ uploadStatus.files.length }}개)
          </span>
          <p class="text-[11px] text-slate-500 mt-0.5">
            인적사항(주소) {{ addressFilesCount }}개 / 학적사항(학교) {{ academicFilesCount }}개
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="!uploading"
            @click="clearUploadedFiles"
            class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-md transition-colors cursor-pointer border-none"
          >
            목록 초기화
          </button>
          <button
            v-if="!uploading"
            @click="processUploadedFiles"
            class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md shadow-xs transition-colors cursor-pointer border-none"
          >
            데이터 파싱 & 자동 검증 실행
          </button>
          <span v-else class="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
            <RefreshCw class="w-3.5 h-3.5 animate-spin" />
            학교알리미 API 연동 및 농어촌 자격 자동 계산 중...
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
        <div
          v-for="(f, idx) in uploadStatus.files"
          :key="idx"
          class="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs"
        >
          <div class="truncate flex items-center gap-1.5 pr-2">
            <FileSpreadsheet :class="f.fileType === 'ADDRESS' ? 'text-indigo-600' : 'text-amber-600'" class="w-3.5 h-3.5 shrink-0" />
            <span class="truncate font-medium text-slate-700" :title="f.fileName">{{ f.fileName }}</span>
          </div>
          <span
            :class="[
              'px-2 py-0.5 rounded text-[10px] font-bold shrink-0',
              f.fileType === 'ADDRESS' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' :
              f.fileType === 'ACADEMIC' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600'
            ]"
          >
            {{ f.classNo ? `${f.classNo}반` : '' }} {{ f.fileType === 'ADDRESS' ? '인적사항(주소)' : f.fileType === 'ACADEMIC' ? '학적사항(학교)' : '기타' }}
          </span>
        </div>
      </div>
    </div>

    <!-- 필터 및 요약 통계 카운터 -->
    <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-slate-500">3학년 전체 대상 학생</p>
          <p class="text-2xl font-bold text-slate-900 mt-1">{{ totalCount }}명</p>
        </div>
        <div class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
          <Users class="w-5 h-5" />
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-emerald-600">지원가능 (자동 적격)</p>
          <p class="text-2xl font-bold text-emerald-600 mt-1">{{ eligibleCount }}명</p>
        </div>
        <div class="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
          <CheckCircle2 class="w-5 h-5" />
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-rose-600">지원불가 (요건 미달)</p>
          <p class="text-2xl font-bold text-rose-600 mt-1">{{ ineligibleCount }}명</p>
        </div>
        <div class="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
          <XCircle class="w-5 h-5" />
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-amber-600">수동 변경/소명 인정</p>
          <p class="text-2xl font-bold text-amber-600 mt-1">{{ manualApprovedCount }}명</p>
        </div>
        <div class="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
          <UserCheck class="w-5 h-5" />
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
            class="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체 학급 (1~11반)</option>
            <option v-for="c in 11" :key="c" :value="c">{{ c }}반</option>
          </select>

          <!-- 자격 상태 필터 -->
          <select
            v-model="filterStatus"
            class="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <th class="py-3 px-4">반/번호</th>
              <th class="py-3 px-4">학번</th>
              <th class="py-3 px-4">이름</th>
              <th class="py-3 px-4">주소 (인적사항)</th>
              <th class="py-3 px-4">읍면주소</th>
              <th class="py-3 px-4">학적 이력 (중/고교)</th>
              <th class="py-3 px-4 text-center">읍면 재학</th>
              <th class="py-3 px-4 text-center">최종 자격</th>
              <th class="py-3 px-4 text-center">소명/수정</th>
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
              <td class="py-3 px-4 font-semibold text-slate-800">
                3-{{ item.class_no }} ({{ item.seq_no }}번)
              </td>
              <td class="py-3 px-4 font-mono text-slate-600">{{ item.student_code || '-' }}</td>
              <td class="py-3 px-4 font-bold text-slate-900">{{ item.name }}</td>
              
              <!-- 주소 -->
              <td class="py-3 px-4 max-w-xs truncate text-slate-700" :title="item.addressInfo?.raw_address_text">
                {{ item.addressInfo?.raw_address_text || '(주소 미등록)' }}
              </td>
              
              <!-- 읍면 주소 여부 -->
              <td class="py-3 px-4">
                <span
                  v-if="item.addressInfo"
                  :class="[
                    'px-2 py-0.5 rounded text-[11px] font-semibold inline-flex items-center gap-1',
                    item.addressInfo.has_rural_address ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  ]"
                >
                  {{ item.addressInfo.has_rural_address ? '읍/면/리 주소' : '동지역 주소' }}
                </span>
                <span v-else class="text-slate-400">-</span>
              </td>

              <!-- 학적 이력 -->
              <td class="py-3 px-4 max-w-xs">
                <div v-if="item.academicRecords && item.academicRecords.length > 0" class="space-y-0.5">
                  <div v-for="ar in item.academicRecords" :key="ar.id" class="text-[11px] text-slate-600 truncate">
                    <span class="font-medium text-slate-800">• {{ ar.school_name || '학교미지정' }}</span>
                    <span class="text-slate-400 ml-1">({{ ar.change_type }})</span>
                  </div>
                </div>
                <span v-else class="text-slate-400">(학적기록 없음)</span>
              </td>

              <!-- 읍면 재학 기간 -->
              <td class="py-3 px-4 text-center font-bold text-slate-800">
                <div v-if="item.eligibility?.total_rural_years != null">
                  <span>{{ item.eligibility.total_rural_years }}년</span>
                  <p class="text-[10px] text-slate-400 font-normal leading-none mt-0.5">
                    (고교 약 {{ item.eligibility.high_school_years }}년)
                  </p>
                </div>
                <span v-else>-</span>
              </td>

              <!-- 최종 자격 -->
              <td class="py-3 px-4 text-center">
                <span
                  :class="[
                    'px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 shadow-sm',
                    item.eligibility?.is_manual_approved
                      ? 'bg-amber-500 text-white'
                      : (item.eligibility?.is_eligible ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white')
                  ]"
                >
                  <CheckCircle2 v-if="item.eligibility?.is_eligible || item.eligibility?.is_manual_approved" class="w-3.5 h-3.5" />
                  <XCircle v-else class="w-3.5 h-3.5" />
                  {{ item.eligibility?.is_manual_approved ? '지원가능 (수동승인)' : (item.eligibility?.is_eligible ? '지원가능' : '지원불가') }}
                </span>
              </td>

              <!-- 소명/수동 수정 버튼 -->
              <td class="py-3 px-4 text-center">
                <button
                  @click="openManualModal(item)"
                  class="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 transition-colors"
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
      <div class="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
        <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
          <UserCheck class="w-5 h-5 text-blue-600" />
          농어촌 전형 자격 상태 수동 수정 & 소명
        </h3>

        <div v-if="selectedStudent" class="space-y-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
          <p><strong class="text-slate-700">학생:</strong> {{ selectedStudent.name }} (3학년 {{ selectedStudent.class_no }}반 {{ selectedStudent.seq_no }}번)</p>
          <p><strong class="text-slate-700">주소:</strong> {{ selectedStudent.addressInfo?.raw_address_text || '미등록' }}</p>
          <p class="leading-relaxed"><strong class="text-slate-700">자동 검증 리포트:</strong> {{ selectedStudent.eligibility?.evaluation_notes || '기록 없음' }}</p>
        </div>

        <div class="space-y-2">
          <label class="block text-xs font-bold text-slate-700">교사 수동 판단 상태 선택</label>
          <div class="flex items-center gap-4 text-xs">
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" :value="true" v-model="modalForm.isManualApproved" class="text-blue-600" />
              <span class="font-bold text-emerald-700">지원가능 (수동 인정/승인)</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" :value="false" v-model="modalForm.isManualApproved" class="text-blue-600" />
              <span class="font-bold text-rose-700">지원불가 (자동검증 결과 유지)</span>
            </label>
          </div>
        </div>

        <div class="space-y-1">
          <label class="block text-xs font-bold text-slate-700">수정 사유 및 소명 내용</label>
          <textarea
            v-model="modalForm.reason"
            rows="3"
            placeholder="행정구역 변경, 이사 소명 등 수동 승인 사유를 상세히 입력하세요."
            class="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          ></textarea>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            @click="showModal = false"
            class="px-3.5 py-1.5 text-xs font-semibold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
          >
            취소
          </button>
          <button
            @click="saveManualApproval"
            :disabled="savingModal"
            class="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm disabled:opacity-50"
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
import * as XLSX from 'xlsx';
import {
  Building2,
  UploadCloud,
  FileSpreadsheet,
  RefreshCw,
  Users,
  CheckCircle2,
  XCircle,
  UserCheck,
  Search
} from 'lucide-vue-next';

import { identifyExcelFile, parseAddressExcel, parseAcademicExcel } from '../../utils/ruralExcelParser';
import { getRuralEligibilityList, saveAndEvaluateRuralData, updateRuralManualApproval } from '../../api/ruralApi';

const loading = ref(false);
const uploading = ref(false);
const addressFileInputRef = ref(null);
const academicFileInputRef = ref(null);
const isDraggingAddress = ref(false);
const isDraggingAcademic = ref(false);

const studentList = ref([]);
const filterClass = ref('all');
const filterStatus = ref('all');
const searchQuery = ref('');

const uploadStatus = ref({
  files: [],
  addressData: [],
  academicData: []
});

const addressFilesCount = computed(() => uploadStatus.value.files.filter(f => f.fileType === 'ADDRESS').length);
const academicFilesCount = computed(() => uploadStatus.value.files.filter(f => f.fileType === 'ACADEMIC').length);

const showModal = ref(false);
const selectedStudent = ref(null);
const savingModal = ref(false);
const modalForm = ref({
  isManualApproved: false,
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

function triggerAddressInput() {
  if (addressFileInputRef.value) addressFileInputRef.value.click();
}

function triggerAcademicInput() {
  if (academicFileInputRef.value) academicFileInputRef.value.click();
}

function handleAddressFileSelect(e) {
  const files = Array.from(e.target.files || []);
  processFilesList(files, 'ADDRESS');
}

function handleAddressFileDrop(e) {
  isDraggingAddress.value = false;
  const files = Array.from(e.dataTransfer.files || []);
  processFilesList(files, 'ADDRESS');
}

function handleAcademicFileSelect(e) {
  const files = Array.from(e.target.files || []);
  processFilesList(files, 'ACADEMIC');
}

function handleAcademicFileDrop(e) {
  isDraggingAcademic.value = false;
  const files = Array.from(e.dataTransfer.files || []);
  processFilesList(files, 'ACADEMIC');
}

function clearUploadedFiles() {
  uploadStatus.value = { files: [], addressData: [], academicData: [] };
}

async function processFilesList(files, targetType = null) {
  if (files.length === 0) return;

  const parsedFilesInfo = [];
  const addressResults = [];
  const academicResults = [];

  for (const file of files) {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const info = identifyExcelFile(file, workbook);
      if (targetType) {
        info.fileType = targetType;
      }

      parsedFilesInfo.push(info);

      if (info.fileType === 'ADDRESS') {
        const parsed = parseAddressExcel(workbook, info.classNo);
        addressResults.push(parsed);
      } else if (info.fileType === 'ACADEMIC') {
        const parsed = parseAcademicExcel(workbook, info.classNo);
        academicResults.push(parsed);
      }
    } catch (err) {
      console.warn(`Error parsing excel file ${file.name}:`, err);
    }
  }

  const existingFiles = targetType
    ? uploadStatus.value.files.filter(f => f.fileType !== targetType)
    : uploadStatus.value.files;
  const existingAddress = targetType === 'ADDRESS' ? [] : uploadStatus.value.addressData;
  const existingAcademic = targetType === 'ACADEMIC' ? [] : uploadStatus.value.academicData;

  uploadStatus.value = {
    files: [...existingFiles, ...parsedFilesInfo],
    addressData: [...existingAddress, ...addressResults],
    academicData: [...existingAcademic, ...academicResults]
  };
}

async function processUploadedFiles() {
  if (uploadStatus.value.files.length === 0) return;
  uploading.value = true;

  try {
    await saveAndEvaluateRuralData(
      uploadStatus.value.addressData,
      uploadStatus.value.academicData
    );

    alert('농어촌 전형 주소 및 학적 데이터 업로드와 학교알리미 연동 검증이 완료되었습니다.');
    uploadStatus.value = { files: [], addressData: [], academicData: [] };
    await loadData();
  } catch (e) {
    console.error('Failed to process and evaluate rural data:', e);
    alert('데이터 파싱 처리 중 오류가 발생하였습니다.');
  } finally {
    uploading.value = false;
  }
}

const totalCount = computed(() => studentList.value.length);
const eligibleCount = computed(() => studentList.value.filter(s => s.eligibility?.is_eligible).length);
const ineligibleCount = computed(() => studentList.value.filter(s => s.eligibility && !s.eligibility.is_eligible && !s.eligibility.is_manual_approved).length);
const manualApprovedCount = computed(() => studentList.value.filter(s => s.eligibility?.is_manual_approved).length);

const filteredList = computed(() => {
  return studentList.value.filter(item => {
    // 반 필터
    if (filterClass.value !== 'all' && item.class_no !== Number(filterClass.value)) {
      return false;
    }
    // 상태 필터
    if (filterStatus.value === 'eligible' && !(item.eligibility?.is_eligible || item.eligibility?.is_manual_approved)) {
      return false;
    }
    if (filterStatus.value === 'ineligible' && (item.eligibility?.is_eligible || item.eligibility?.is_manual_approved)) {
      return false;
    }
    if (filterStatus.value === 'manual' && !item.eligibility?.is_manual_approved) {
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
