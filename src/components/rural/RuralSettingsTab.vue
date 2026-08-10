<template>
  <div class="space-y-6 flex-1 min-h-0 flex flex-col overflow-y-auto pr-1">
    <!-- 헤더 카드 -->
    <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs shrink-0">
      <h2 class="text-xl font-bold text-slate-900 flex items-center gap-2 m-0">
        <Settings class="w-6 h-6 text-emerald-600" />
        농어촌 추천 관리 시스템 환경설정
      </h2>
      <p class="text-sm text-slate-500 mt-1 mb-0">
        농어촌 및 기회균형 추천 시스템의 데이터베이스(전형 요강, 자격 검증, 학생 신청 현황) 초기화 및 인적·학적 엑셀 업로드를 관리합니다.
      </p>
    </div>

    <!-- 1. 엑셀 분리 업로드 구역 (인적사항 / 학적사항) -->
    <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
      <div class="border-b border-slate-100 pb-3">
        <h3 class="text-base font-bold text-slate-900 flex items-center gap-2 m-0">
          <UploadCloud class="w-5 h-5 text-indigo-600" />
          학생 인적사항 및 학적사항 엑셀 업로드 (자격 자동 검증)
        </h3>
        <p class="text-xs text-slate-500 mt-1 mb-0">
          3학년 각 반의 인적사항(주소) 및 학적사항(학교) 엑셀 파일들을 각각 업로드하여 6년 읍·면 재학 및 거주 요건을 자동 검증합니다.
          <span class="text-indigo-600 font-semibold">(※ 학급별로 파일 업로드 순서가 달라도, 2개 파일이 DB에 모두 등록되는 즉시 학생별 자동 판정이 완성됩니다.)</span>
        </p>
      </div>

      <!-- 사전 안내 카드 -->
      <div class="bg-amber-50/90 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-xs">
        <AlertTriangle class="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
        <div class="text-xs text-amber-900 leading-relaxed space-y-1">
          <p class="font-bold text-amber-950 text-xs m-0 flex items-center gap-1.5">
            <span>📌 NEIS 학교생활기록부 엑셀 다운로드 및 업로드 안내</span>
          </p>
          <p class="m-0 text-amber-900">
            NEIS <strong class="text-amber-950 font-bold bg-amber-100/80 px-1 py-0.5 rounded">학교생활기록부 > 항목별조회</strong> 메뉴에서 각 학급별 <strong class="text-amber-950 font-bold">인적사항</strong>과 <strong class="text-amber-950 font-bold">학적사항</strong>을 <span class="bg-amber-200/80 text-amber-950 font-bold px-1.5 py-0.5 rounded border border-amber-300">xls</span> 또는 <span class="bg-amber-200/80 text-amber-950 font-bold px-1.5 py-0.5 rounded border border-amber-300">xls data</span> 형식으로 다운로드받은 후 아래 업로드 영역에 첨부하세요.
          </p>
          <p class="m-0 text-[11px] text-amber-800 pt-0.5">
            ※ 파일 종류(인적/학적)는 시스템이 스스로 자동 구별하여 처리합니다. 단, 자격 판정은 인적사항(주소)과 학적사항(학교) 2개 데이터가 모두 등록된 시점에 완결되므로 두 종류 파일을 모두 업로드해 주세요.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- 1) 인적사항(주소) 엑셀 업로드 -->
        <div class="bg-slate-50/50 p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-bold text-slate-900 flex items-center gap-2 m-0">
                <FileSpreadsheet class="w-4 h-4 text-indigo-600" />
                인적사항(주소) 엑셀 파일 업로드
              </h4>
              <span v-if="addressFilesCount > 0" class="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                {{ addressFilesCount }}개 등록됨
              </span>
            </div>

            <div
              @dragover.prevent="isDraggingAddress = true"
              @dragleave.prevent="isDraggingAddress = false"
              @drop.prevent="handleAddressFileDrop"
              :class="[
                'border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer',
                isDraggingAddress ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-400 bg-white'
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
              <div class="flex flex-col items-center justify-center gap-1.5">
                <div class="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <UploadCloud class="w-4 h-4" />
                </div>
                <div>
                  <p class="text-xs font-bold text-slate-800 m-0">
                    인적사항(주소) 엑셀 파일 클릭 선택 또는 드롭
                  </p>
                  <p class="text-[11px] text-slate-500 mt-0.5 m-0">
                    NEIS 항목별조회 인적사항 <span class="text-indigo-600 font-semibold">(xls / xls data)</span> 파일들을 첨부하세요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 2) 학적사항(학교) 엑셀 업로드 -->
        <div class="bg-slate-50/50 p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-bold text-slate-900 flex items-center gap-2 m-0">
                <FileSpreadsheet class="w-4 h-4 text-amber-600" />
                학적사항(학교) 엑셀 파일 업로드
              </h4>
              <span v-if="academicFilesCount > 0" class="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                {{ academicFilesCount }}개 등록됨
              </span>
            </div>

            <div
              @dragover.prevent="isDraggingAcademic = true"
              @dragleave.prevent="isDraggingAcademic = false"
              @drop.prevent="handleAcademicFileDrop"
              :class="[
                'border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer',
                isDraggingAcademic ? 'border-amber-500 bg-amber-50/50' : 'border-slate-300 hover:border-amber-400 bg-white'
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
              <div class="flex flex-col items-center justify-center gap-1.5">
                <div class="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <UploadCloud class="w-4 h-4" />
                </div>
                <div>
                  <p class="text-xs font-bold text-slate-800 m-0">
                    학적사항(학교) 엑셀 파일 클릭 선택 또는 드롭
                  </p>
                  <p class="text-[11px] text-slate-500 mt-0.5 m-0">
                    NEIS 항목별조회 학적사항 <span class="text-amber-600 font-semibold">(xls / xls data)</span> 파일들을 첨부하세요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 등록된 파일 현황 및 자동 검증 실행 버튼 -->
      <div v-if="uploadStatus.files.length > 0" class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
          <div>
            <span class="text-xs font-bold text-slate-800">
              등록 완료된 파일 목록 (총 {{ uploadStatus.files.length }}개)
            </span>
            <p class="text-[11px] text-slate-500 mt-0.5 m-0">
              인적사항(주소) {{ addressFilesCount }}개 / 학적사항(학교) {{ academicFilesCount }}개
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="!uploading"
              @click="clearUploadedFiles"
              class="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold rounded-md transition-colors cursor-pointer"
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
            class="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs"
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
    </div>

    <!-- 2. 데이터베이스 초기화 구역 -->
    <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
      <div class="border-b border-slate-100 pb-4">
        <h3 class="text-base font-bold text-slate-900 flex items-center gap-2 m-0">
          <Database class="w-5 h-5 text-rose-600" />
          농어촌 데이터베이스(DB) 초기화 관리
        </h3>
        <p class="text-xs text-slate-500 mt-1 mb-0">
          초기화 시 해당 테이블 데이터가 영구 삭제되므로 신중하게 실행하세요.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <!-- 1) 전형 요강 DB 초기화 -->
        <div class="p-5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-4">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="p-1.5 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs">1</span>
              <h4 class="text-sm font-bold text-slate-900 m-0">전형 요강 DB 초기화</h4>
            </div>
            <p class="text-xs text-slate-600 leading-relaxed m-0">
              구글 시트로 동기화된 2027학년도 농어촌 및 기회균형 모집요강 데이터를 전체 삭제합니다.
            </p>
          </div>
          <button
            @click="handleResetTracks"
            :disabled="resetting"
            class="w-full py-2.5 px-4 bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Trash2 class="w-4 h-4" />
            전형 요강 DB 초기화
          </button>
        </div>

        <!-- 2) 학적 및 자격 검증 DB 초기화 -->
        <div class="p-5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-4">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="p-1.5 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs">2</span>
              <h4 class="text-sm font-bold text-slate-900 m-0">학적 및 자격 검증 DB 초기화</h4>
            </div>
            <p class="text-xs text-slate-600 leading-relaxed m-0">
              업로드된 학생 주소/학적 엑셀 이력 및 자동/수동 자격 검증 결과를 전체 삭제하고 초기화합니다.
            </p>
          </div>
          <button
            @click="handleResetAcademic"
            :disabled="resetting"
            class="w-full py-2.5 px-4 bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Trash2 class="w-4 h-4" />
            학적 및 자격 검증 DB 초기화
          </button>
        </div>

        <!-- 3) 학생 신청 현황 & 대장 DB 초기화 -->
        <div class="p-5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-4">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs">3</span>
              <h4 class="text-sm font-bold text-slate-900 m-0">신청 현황 & 대장 DB 초기화</h4>
            </div>
            <p class="text-xs text-slate-600 leading-relaxed m-0">
              학생들이 작성한 1~6지망 농어촌 전형 신청서 및 서명 데이터를 전체 삭제합니다.
            </p>
          </div>
          <button
            @click="handleResetApplications"
            :disabled="resetting"
            class="w-full py-2.5 px-4 bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Trash2 class="w-4 h-4" />
            신청 현황 & 대장 DB 초기화
          </button>
        </div>
      </div>

      <!-- 4) 전체 일괄 초기화 경고 카드 -->
      <div class="p-5 rounded-xl border border-rose-200 bg-rose-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-start gap-3">
          <AlertTriangle class="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 class="text-sm font-bold text-rose-900 m-0">농어촌 추천 관리 시스템 전체 데이터 일괄 초기화</h4>
            <p class="text-xs text-rose-700 mt-1 mb-0 leading-relaxed">
              전형 요강, 자격 검증 내역, 학생 신청 현황 등 농어촌 시스템의 **모든 데이터베이스를 한 번에 초기화**합니다.
            </p>
          </div>
        </div>
        <button
          @click="handleResetAll"
          :disabled="resetting"
          class="shrink-0 py-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-sm disabled:opacity-50"
        >
          <AlertOctagon class="w-4 h-4" />
          {{ resetting ? '초기화 처리 중…' : '농어촌 전체 DB 일괄 초기화' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import * as XLSX from 'xlsx';
import {
  Settings,
  Database,
  Trash2,
  AlertTriangle,
  AlertOctagon,
  UploadCloud,
  FileSpreadsheet,
  RefreshCw
} from 'lucide-vue-next';
import { identifyExcelFile, parseAddressExcel, parseAcademicExcel } from '../../utils/ruralExcelParser';
import {
  saveAndEvaluateRuralData,
  resetRuralTracksDB,
  resetRuralAcademicDB,
  resetRuralApplicationsDB,
  resetAllRuralDBs
} from '../../api/ruralApi';
import { dialog } from '../common/dialog';

const resetting = ref(false);
const uploading = ref(false);
const addressFileInputRef = ref(null);
const academicFileInputRef = ref(null);
const isDraggingAddress = ref(false);
const isDraggingAcademic = ref(false);

const uploadStatus = ref({
  files: [],
  addressData: [],
  academicData: []
});

const addressFilesCount = computed(() => uploadStatus.value.files.filter(f => f.fileType === 'ADDRESS').length);
const academicFilesCount = computed(() => uploadStatus.value.files.filter(f => f.fileType === 'ACADEMIC').length);

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

async function processFilesList(files, fallbackType = null) {
  if (!files || files.length === 0) return;

  const currentFiles = [...uploadStatus.value.files];
  const currentAddress = [...uploadStatus.value.addressData];
  const currentAcademic = [...uploadStatus.value.academicData];

  for (const file of files) {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const info = identifyExcelFile(file, workbook);

      if (info.fileType === 'UNKNOWN' && fallbackType) {
        info.fileType = fallbackType;
      }

      if (info.fileType === 'ADDRESS') {
        const parsed = parseAddressExcel(workbook, info.classNo);
        const idx = currentAddress.findIndex(a => a.classNo === parsed.classNo);
        if (idx >= 0) currentAddress[idx] = parsed;
        else currentAddress.push(parsed);

        const fIdx = currentFiles.findIndex(f => f.classNo === info.classNo && f.fileType === 'ADDRESS');
        if (fIdx >= 0) currentFiles[fIdx] = info;
        else currentFiles.push(info);

      } else if (info.fileType === 'ACADEMIC') {
        const parsed = parseAcademicExcel(workbook, info.classNo);
        const idx = currentAcademic.findIndex(a => a.classNo === parsed.classNo);
        if (idx >= 0) currentAcademic[idx] = parsed;
        else currentAcademic.push(parsed);

        const fIdx = currentFiles.findIndex(f => f.classNo === info.classNo && f.fileType === 'ACADEMIC');
        if (fIdx >= 0) currentFiles[fIdx] = info;
        else currentFiles.push(info);
      }
    } catch (err) {
      console.warn(`Error parsing excel file ${file.name}:`, err);
    }
  }

  uploadStatus.value = {
    files: currentFiles,
    addressData: currentAddress,
    academicData: currentAcademic
  };
}

async function processUploadedFiles() {
  if (uploadStatus.value.files.length === 0) return;
  uploading.value = true;

  try {
    const res = await saveAndEvaluateRuralData(
      uploadStatus.value.addressData,
      uploadStatus.value.academicData
    );

    let alertMessage = '농어촌 전형 주소 및 학적 데이터 업로드와 NEIS 연동 자격 자동 검증이 완료되었습니다.';
    if (res?.logs && res.logs.length > 0) {
      alertMessage += '\n\n [확인 필요 경고 및 안내 사항]\n' + res.logs.join('\n\n');
    }

    await dialog.alert({
      title: (res?.logs && res.logs.length > 0) ? '자동 검증 완료 (경고 확인 필요)' : '자동 검증 완료',
      message: alertMessage
    });
    uploadStatus.value = { files: [], addressData: [], academicData: [] };
  } catch (err) {
    console.error('Failed to process and evaluate rural data:', err);
    await dialog.alert({
      title: '파싱 처리 실패',
      message: err.message || '데이터 파싱 처리 중 오류가 발생하였습니다.'
    });
  } finally {
    uploading.value = false;
  }
}

// 1. 전형 요강 DB 초기화
async function handleResetTracks() {
  const confirmed = await dialog.confirm({
    title: '전형 요강 DB 초기화',
    message: '동기화된 2027학년도 농어촌 및 기회균형 모집요강 데이터를 전체 삭제하시겠습니까?',
    confirmText: '초기화 실행',
    level: 'danger',
    dangerNotice: '삭제된 모집요강 전형 데이터는 복구할 수 없습니다. 상단 동기화 버튼을 통해 다시 불러와야 합니다.',
    finalConfirmText: '영구 삭제'
  });

  if (!confirmed) return;

  resetting.value = true;
  try {
    await resetRuralTracksDB();
    await dialog.alert({
      title: '초기화 완료',
      message: '전형 요강 DB가 성공적으로 초기화되었습니다.'
    });
  } catch (err) {
    console.error('Failed to reset rural tracks DB:', err);
    await dialog.alert({
      title: '초기화 실패',
      message: err.message || '전형 요강 DB 초기화 중 오류가 발생했습니다.'
    });
  } finally {
    resetting.value = false;
  }
}

// 2. 학적 및 자격 검증 DB 초기화
async function handleResetAcademic() {
  const confirmed = await dialog.confirm({
    title: '학적 및 자격 검증 DB 초기화',
    message: '학생 주소/학적 엑셀 이력 및 자동/수동 검증 결과를 전체 삭제하고 초기화하시겠습니까?',
    confirmText: '초기화 실행',
    level: 'danger',
    dangerNotice: '삭제된 자격 검증 이력 및 수동 승인 사유는 복구할 수 없습니다.',
    finalConfirmText: '영구 삭제'
  });

  if (!confirmed) return;

  resetting.value = true;
  try {
    await resetRuralAcademicDB();
    await dialog.alert({
      title: '초기화 완료',
      message: '학적 및 자격 검증 DB가 성공적으로 초기화되었습니다.'
    });
  } catch (err) {
    console.error('Failed to reset rural academic DB:', err);
    await dialog.alert({
      title: '초기화 실패',
      message: err.message || '학적 및 자격 검증 DB 초기화 중 오류가 발생했습니다.'
    });
  } finally {
    resetting.value = false;
  }
}

// 3. 학생 신청 현황 DB 초기화
async function handleResetApplications() {
  const confirmed = await dialog.confirm({
    title: '신청 현황 & 대장 DB 초기화',
    message: '학생들이 제출한 1~6지망 농어촌 신청서 및 서명 데이터를 전체 삭제하시겠습니까?',
    confirmText: '초기화 실행',
    level: 'danger',
    dangerNotice: '학생들의 지망 신청서 내역이 전체 삭제되며 복구할 수 없습니다.',
    finalConfirmText: '영구 삭제'
  });

  if (!confirmed) return;

  resetting.value = true;
  try {
    await resetRuralApplicationsDB();
    await dialog.alert({
      title: '초기화 완료',
      message: '학생 신청 현황 & 대장 DB가 성공적으로 초기화되었습니다.'
    });
  } catch (err) {
    console.error('Failed to reset rural applications DB:', err);
    await dialog.alert({
      title: '초기화 실패',
      message: err.message || '학생 신청 현황 DB 초기화 중 오류가 발생했습니다.'
    });
  } finally {
    resetting.value = false;
  }
}

// 4. 농어촌 전체 DB 일괄 초기화
async function handleResetAll() {
  const confirmed = await dialog.confirm({
    title: '⚠️ 농어촌 시스템 전체 DB 일괄 초기화',
    message: '전형 요강, 자격 검증 내역, 학생 신청 현황 등 농어촌 시스템의 모든 데이터베이스를 일괄 초기화하시겠습니까?',
    confirmText: '전체 데이터 초기화 실행',
    level: 'danger',
    dangerNotice: '농어촌 전형 관리 시스템의 모든 데이터(요강, 검증이력, 신청대장)가 영구 삭제됩니다.',
    finalConfirmText: '모든 농어촌 DB 영구 삭제'
  });

  if (!confirmed) return;

  resetting.value = true;
  try {
    await resetAllRuralDBs();
    await dialog.alert({
      title: '일괄 초기화 완료',
      message: '농어촌 시스템의 모든 데이터베이스가 성공적으로 초기화되었습니다.'
    });
  } catch (err) {
    console.error('Failed to reset all rural DBs:', err);
    await dialog.alert({
      title: '초기화 실패',
      message: err.message || '농어촌 전체 DB 초기화 중 오류가 발생했습니다.'
    });
  } finally {
    resetting.value = false;
  }
}
</script>
