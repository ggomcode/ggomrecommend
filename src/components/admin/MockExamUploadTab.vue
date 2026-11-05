<template>
  <div class="py-8 px-4 sm:px-10 max-w-6xl mx-auto space-y-6">
    <!-- 1. 헤더 안내 배너 -->
    <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-indigo-900/40">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-[11px] font-bold">
              성적일람표 다중 업로드 엔진
            </span>
            <span class="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-[11px] font-mono font-bold">
              {{ autoAdmissionYear }}학년도 대입 연동
            </span>
          </div>
          <h1 class="text-xl sm:text-2xl font-black text-white m-0 tracking-tight flex items-center gap-2">
            <span>📊</span>
            <span>모의고사 성적일람표 등록</span>
          </h1>
          <p class="text-xs text-slate-300 mt-2 m-0 leading-relaxed max-w-2xl">
            교육청 전국연합학력평가 및 평가원 모의평가 성적일람표(PDF/엑셀)를 다중 업로드하여 자동으로 파싱합니다.<br class="hidden sm:inline" />
            업로드 일자({{ todayFormatted }})에 따라 <code class="px-1.5 py-0.5 rounded bg-indigo-800/80 text-amber-300 font-mono font-bold">{{ targetSheetName }}</code> 시트에 통합 적재되며, 1·2·3학년 성적이 학년도별로 자동 분류됩니다.
          </p>
        </div>

        <!-- 학년도 & 시트 배지 카드 -->
        <div class="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10 shrink-0 text-right space-y-1">
          <div class="text-[11px] text-slate-300 font-medium">자동 분류 대상 시트 탭</div>
          <div class="text-base font-black text-amber-300 font-mono tracking-wide">
            {{ targetSheetName }}
          </div>
          <div class="text-[10px] text-indigo-200">
            고3: {{ autoAdmissionYear }}대입 | 고1·2: {{ autoAcademicYear }}학사
          </div>
        </div>
      </div>
    </div>

    <!-- 2. 업로드 컨트롤 바 (학년 선택 + 드롭존) -->
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-5">
      <!-- 2-1. 학년 선택 드롭다운 -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <span class="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
          <span class="text-sm font-bold text-slate-800">성적일람표 응시 학년 선택</span>
          <span class="text-xs text-slate-400 font-normal">(*업로드할 파일의 해당 학년을 선택해 주세요)</span>
        </div>

        <div class="flex items-center gap-2">
          <label class="text-xs font-semibold text-slate-600">대상 학년:</label>
          <div class="relative inline-block">
            <select
              v-model="selectedGrade"
              class="appearance-none pl-3 pr-8 py-1.5 bg-indigo-50/80 hover:bg-indigo-100/70 border border-indigo-200 rounded-xl text-xs font-black text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer transition-colors"
            >
              <option :value="3">3학년 (고3 / {{ autoAdmissionYear }} 대입)</option>
              <option :value="2">2학년 (고2 / {{ autoAcademicYear }} 학사)</option>
              <option :value="1">1학년 (고1 / {{ autoAcademicYear }} 학사)</option>
            </select>
            <ChevronDown class="w-4 h-4 text-indigo-700 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>
          <span class="text-[11px] font-bold px-2 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
            {{ selectedGrade }}학년 모드
          </span>
        </div>
      </div>

      <!-- 2-2. 복수 파일 드롭다운존 (Drag & Drop Zone) -->
      <div
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleFileDrop"
        :class="[
          'relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer',
          isDragging 
            ? 'border-indigo-500 bg-indigo-50/60 scale-[1.005]' 
            : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/60 bg-slate-50/30'
        ]"
        @click="triggerFileInput"
      >
        <input
          ref="fileInputRef"
          type="file"
          multiple
          accept=".pdf,.xlsx,.xls,.csv"
          class="hidden"
          @change="handleFileInputChange"
        />

        <div class="flex flex-col items-center justify-center space-y-3 pointer-events-none">
          <div class="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
            <UploadCloud :size="28" />
          </div>
          <div class="space-y-1">
            <div class="text-sm font-bold text-slate-800">
              <span class="text-indigo-600 underline">파일을 선택</span>하거나 여기로 드래그하여 놓으세요
            </div>
            <p class="text-xs text-slate-400 m-0">
              지원 형식: <strong>PDF</strong>(교육청 학평 성적일람표 / 평가원 모의평가) 및 <strong>엑셀</strong>(.xlsx, .xls, .csv)
            </p>
          </div>
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/70 text-[11px] font-semibold text-slate-600">
            <span>✨</span>
            <span>여러 학급(1반, 2반, 3반...) 성적표를 한 번에 복수 선택하여 업로드할 수 있습니다.</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. 업로드된 파일 목록 & 파싱 진행 상황 -->
    <div v-if="fileList.length > 0" class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-1.5 h-4 bg-emerald-600 rounded-full"></span>
          <h3 class="text-sm font-bold text-slate-800 m-0">
            업로드된 파일 목록 (총 {{ fileList.length }}개)
          </h3>
        </div>
        <button
          @click="clearAllFiles"
          class="text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-colors border-none cursor-pointer"
        >
          전체 비우기
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          v-for="(fItem, idx) in fileList"
          :key="fItem.id"
          class="p-3.5 rounded-xl border transition-all duration-150 flex items-center justify-between gap-3"
          :class="[
            fItem.status === 'success' 
              ? 'bg-emerald-50/40 border-emerald-200' 
              : fItem.status === 'error'
              ? 'bg-rose-50/40 border-rose-200'
              : fItem.status === 'parsing'
              ? 'bg-indigo-50/40 border-indigo-200'
              : 'bg-slate-50 border-slate-200'
          ]"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div 
              class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-xs shadow-2xs"
              :class="fItem.name.endsWith('.pdf') ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'"
            >
              {{ fItem.name.endsWith('.pdf') ? 'PDF' : 'XLS' }}
            </div>
            <div class="truncate leading-tight">
              <div class="text-xs font-bold text-slate-800 truncate" :title="fItem.name">
                {{ fItem.name }}
              </div>
              <div class="text-[10.5px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                <span>{{ formatFileSize(fItem.size) }}</span>
                <span>•</span>
                <span class="font-bold text-indigo-700">{{ fItem.selectedGrade }}학년</span>
                <span v-if="fItem.parsedExamName">• {{ fItem.parsedExamName }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <!-- 파싱 중 스피너 -->
            <div v-if="fItem.status === 'parsing'" class="flex items-center gap-1 text-xs text-indigo-600 font-bold">
              <RefreshCw class="w-3.5 h-3.5 animate-spin" />
              <span>분석 중…</span>
            </div>
            <!-- 성공 배지 -->
            <div v-else-if="fItem.status === 'success'" class="flex flex-col items-end">
              <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10.5px] font-bold">
                ✓ {{ fItem.students.length }}명 완료
              </span>
              <span v-if="fItem.parsedClass" class="text-[10px] text-slate-400 mt-0.5">
                {{ fItem.parsedClass }}반
              </span>
            </div>
            <!-- 실패 배지 -->
            <div v-else-if="fItem.status === 'error'" class="flex flex-col items-end">
              <span class="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold" :title="fItem.error">
                ⚠️ 파싱 실패
              </span>
            </div>

            <!-- 개별 삭제 -->
            <button
              @click="removeFile(idx)"
              class="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-white border-none cursor-pointer transition-colors"
              title="파일 삭제"
            >
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. 통합 파싱 결과 미리보기 및 저장 액션 -->
    <div v-if="allParsedStudents.length > 0" class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
            <h3 class="text-sm font-black text-slate-900 m-0">
              파싱 완료 학생 성적 미리보기 (총 {{ allParsedStudents.length }}명)
            </h3>
          </div>
          <p class="text-xs text-slate-400 mt-1 m-0">
            업로드된 파일들에서 취합된 성적 명단입니다. 구글 시트의 <code class="text-indigo-600 font-bold font-mono">{{ targetSheetName }}</code> 탭에 바로 반영하거나 엑셀로 내려받을 수 있습니다.
          </p>
        </div>

        <!-- 액션 버튼 그룹 -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- 클립보드 복사 -->
          <button
            type="button"
            @click="copyToClipboard"
            class="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Copy :size="13" />
            <span>{{ copySuccess ? '복사 완료! ✓' : '시트 복사용 텍스트' }}</span>
          </button>

          <!-- 엑셀(.xlsx) 다운로드 -->
          <button
            type="button"
            @click="exportParsedToExcel"
            class="px-3.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <FileSpreadsheet :size="14" class="text-emerald-600" />
            <span>{{ targetSheetName }}용 엑셀 다운로드</span>
          </button>

          <!-- 구글 시트 직송 (향후 연동용) -->
          <button
            type="button"
            @click="handleSaveToGoogleSheet"
            :disabled="isSavingToSheet"
            class="px-4 py-1.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl border-none cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <UploadCloud :size="14" />
            <span>{{ isSavingToSheet ? '구글 시트 반영 중…' : '구글 시트에 즉시 반영' }}</span>
          </button>
        </div>
      </div>

      <!-- 미리보기 테이블 -->
      <div class="overflow-x-auto rounded-xl border border-slate-200 max-h-96 overflow-y-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead class="bg-slate-50 text-slate-600 font-bold sticky top-0 z-10 border-b border-slate-200">
            <tr>
              <th class="py-2.5 px-3 whitespace-nowrap">학년</th>
              <th class="py-2.5 px-3 whitespace-nowrap">반-번호</th>
              <th class="py-2.5 px-3 whitespace-nowrap">성명</th>
              <th class="py-2.5 px-3 whitespace-nowrap">시험명</th>
              <th class="py-2.5 px-3 whitespace-nowrap">국어 (과목/표점/등급)</th>
              <th class="py-2.5 px-3 whitespace-nowrap">수학 (과목/표점/등급)</th>
              <th class="py-2.5 px-3 whitespace-nowrap text-center">영어</th>
              <th class="py-2.5 px-3 whitespace-nowrap text-center">한국사</th>
              <th class="py-2.5 px-3 whitespace-nowrap">탐구1 (과목/표점/등급)</th>
              <th class="py-2.5 px-3 whitespace-nowrap">탐구2 (과목/표점/등급)</th>
              <th class="py-2.5 px-3 whitespace-nowrap text-center">제2외</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-mono text-[11.5px]">
            <tr
              v-for="(st, sIdx) in allParsedStudents"
              :key="st.studentKey + '_' + sIdx"
              class="hover:bg-slate-50/80 transition-colors"
            >
              <td class="py-2 px-3 font-bold text-indigo-700">{{ st.grade }}학년</td>
              <td class="py-2 px-3 text-slate-600">{{ st.classNum }}반 {{ st.studentNum }}번</td>
              <td class="py-2 px-3 font-sans font-bold text-slate-900">{{ st.name }}</td>
              <td class="py-2 px-3 font-sans text-slate-600">
                <span class="px-1.5 py-0.2 rounded bg-slate-100 text-[10px] font-bold">
                  {{ st.examName }}
                </span>
              </td>
              <!-- 국어 -->
              <td class="py-2 px-3">
                <span class="font-sans text-slate-500 text-[10px] mr-1">{{ st.korSubject }}</span>
                <span v-if="st.korStandardScore" class="font-bold text-slate-800 mr-1">{{ st.korStandardScore }}점</span>
                <span v-if="st.korGrade" class="px-1 py-0.2 rounded bg-blue-50 text-blue-700 font-black text-[10px]">
                  {{ st.korGrade }}등급
                </span>
                <span v-else class="text-slate-300">-</span>
              </td>
              <!-- 수학 -->
              <td class="py-2 px-3">
                <span class="font-sans text-slate-500 text-[10px] mr-1">{{ st.mathSubject }}</span>
                <span v-if="st.mathStandardScore" class="font-bold text-slate-800 mr-1">{{ st.mathStandardScore }}점</span>
                <span v-if="st.mathGrade" class="px-1 py-0.2 rounded bg-purple-50 text-purple-700 font-black text-[10px]">
                  {{ st.mathGrade }}등급
                </span>
                <span v-else class="text-slate-300">-</span>
              </td>
              <!-- 영어 -->
              <td class="py-2 px-3 text-center">
                <span v-if="st.engGrade" class="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 font-black text-[10px]">
                  {{ st.engGrade }}등급
                </span>
                <span v-else class="text-slate-300">-</span>
              </td>
              <!-- 한국사 -->
              <td class="py-2 px-3 text-center">
                <span v-if="st.histGrade" class="px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 font-black text-[10px]">
                  {{ st.histGrade }}등급
                </span>
                <span v-else class="text-slate-300">-</span>
              </td>
              <!-- 탐구1 -->
              <td class="py-2 px-3">
                <span class="font-sans text-slate-500 text-[10px] mr-1">{{ st.inquiry1 }}</span>
                <span v-if="st.inq1StandardScore" class="font-bold text-slate-800 mr-1">{{ st.inq1StandardScore }}점</span>
                <span v-if="st.inq1Grade" class="px-1 py-0.2 rounded bg-slate-100 text-slate-700 font-black text-[10px]">
                  {{ st.inq1Grade }}등급
                </span>
                <span v-else class="text-slate-300">-</span>
              </td>
              <!-- 탐구2 -->
              <td class="py-2 px-3">
                <span class="font-sans text-slate-500 text-[10px] mr-1">{{ st.inquiry2 }}</span>
                <span v-if="st.inq2StandardScore" class="font-bold text-slate-800 mr-1">{{ st.inq2StandardScore }}점</span>
                <span v-if="st.inq2Grade" class="px-1 py-0.2 rounded bg-slate-100 text-slate-700 font-black text-[10px]">
                  {{ st.inq2Grade }}등급
                </span>
                <span v-else class="text-slate-300">-</span>
              </td>
              <!-- 제2외국어 -->
              <td class="py-2 px-3 text-center text-slate-400">
                <span v-if="st.secondLangGrade">{{ st.secondLangGrade }}등급</span>
                <span v-else>-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  UploadCloud,
  FileSpreadsheet,
  ChevronDown,
  Trash2,
  Copy,
  RefreshCw
} from 'lucide-vue-next'
import * as XLSX from 'xlsx'
import {
  parseMockExamReportFile,
  convertStudentsToSheetRows,
  getTargetCollegeAdmissionYear,
  getAcademicSchoolYear,
  getTargetMockResultSheetName
} from '../../stat/utils/mockExamReportParser'
import { dialog } from '../common/dialog'

// 현재 날짜 기준 대입/학사 학년도 자동 계산
const now = new Date()
const autoAdmissionYear = computed(() => getTargetCollegeAdmissionYear(now))
const autoAcademicYear = computed(() => getAcademicSchoolYear(now))
const targetSheetName = computed(() => getTargetMockResultSheetName(now))

const todayFormatted = computed(() => {
  return `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`
})

// 선택 학년 (기본값: 3학년)
const selectedGrade = ref(3)

// 드래그앤드롭 상태
const isDragging = ref(false)
const fileInputRef = ref(null)

// 업로드된 파일 상태 관리
const fileList = ref([])
const isSavingToSheet = ref(false)
const copySuccess = ref(false)

function triggerFileInput() {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

function handleFileInputChange(e) {
  const files = Array.from(e.target.files || [])
  if (files.length > 0) {
    addFilesToQueue(files)
  }
  // reset input
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function handleFileDrop(e) {
  isDragging.value = false
  const files = Array.from(e.dataTransfer.files || [])
  if (files.length > 0) {
    addFilesToQueue(files)
  }
}

async function addFilesToQueue(files) {
  const newItems = files.map(file => ({
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    file,
    name: file.name,
    size: file.size,
    selectedGrade: selectedGrade.value,
    status: 'pending', // pending, parsing, success, error
    error: '',
    students: [],
    parsedExamName: '',
    parsedClass: ''
  }))

  fileList.value.push(...newItems)

  // 순차 파싱 실행
  for (const item of newItems) {
    await processFileItem(item)
  }
}

async function processFileItem(item) {
  item.status = 'parsing'
  try {
    const res = await parseMockExamReportFile(item.file, {
      defaultGrade: item.selectedGrade,
      uploadDate: now
    })

    if (!res.success) {
      item.status = 'error'
      item.error = res.error || '성적 데이터를 추출하지 못했습니다.'
      return
    }

    item.status = 'success'
    item.students = res.students
    item.parsedExamName = res.meta?.examName || ''
    item.parsedClass = res.meta?.classNum || ''
  } catch (err) {
    item.status = 'error'
    item.error = err.message || '파일 처리 중 오류가 발생했습니다.'
  }
}

function removeFile(index) {
  fileList.value.splice(index, 1)
}

function clearAllFiles() {
  fileList.value = []
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// 모든 성공 파일의 학생 레코드 합산
const allParsedStudents = computed(() => {
  const all = []
  for (const item of fileList.value) {
    if (item.status === 'success' && Array.isArray(item.students)) {
      all.push(...item.students)
    }
  }
  return all
})

/**
 * 엑셀(.xlsx) 파일로 내보내기
 */
function exportParsedToExcel() {
  if (allParsedStudents.value.length === 0) {
    dialog.alert('내보낼 학생 데이터가 없습니다.')
    return
  }

  const rows = convertStudentsToSheetRows(allParsedStudents.value)
  const ws = XLSX.utils.aoa_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, targetSheetName.value)

  const fileName = `${targetSheetName.value}_파싱성적_${selectedGrade.value}학년_${todayFormatted.value.replace(/[\s년월]/g, '_')}.xlsx`
  XLSX.writeFile(wb, fileName)
}

/**
 * 구글 시트에 바로 붙여넣을 수 있는 탭 구분 텍스트 클립보드 복사
 */
async function copyToClipboard() {
  if (allParsedStudents.value.length === 0) {
    dialog.alert('복사할 데이터가 없습니다.')
    return
  }

  const rows = convertStudentsToSheetRows(allParsedStudents.value)
  const tsvText = rows.map(r => r.join('\t')).join('\n')

  try {
    await navigator.clipboard.writeText(tsvText)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2500)
    dialog.alert(`총 ${allParsedStudents.value.length}명의 데이터가 클립보드에 복사되었습니다!\n구글 시트 '${targetSheetName.value}' 탭의 A1 셀에 붙여넣기(Ctrl+V)하세요.`)
  } catch (e) {
    dialog.alert('클립보드 복사 실패: ' + e.message)
  }
}

/**
 * 구글 시트 직송 / 반영
 */
async function handleSaveToGoogleSheet() {
  if (allParsedStudents.value.length === 0) {
    dialog.alert('반영할 학생 데이터가 없습니다.')
    return
  }

  const confirmed = await dialog.confirm(
    `총 ${allParsedStudents.value.length}명의 모의고사 성적을 구글 시트 '${targetSheetName.value}' 탭에 반영하시겠습니까?`
  )
  if (!confirmed) return

  isSavingToSheet.value = true
  try {
    // 엑셀 다운로드 및 클립보드 복사를 기본 지원하며 안내
    exportParsedToExcel()
    dialog.alert(`'${targetSheetName.value}' 전용 엑셀 파일이 다운로드되었습니다. 구글 시트의 해당 탭에 붙여넣거나 업로드하여 동기화를 완료할 수 있습니다.`)
  } catch (e) {
    dialog.alert('오류 발생: ' + e.message)
  } finally {
    isSavingToSheet.value = false
  }
}
</script>

<style scoped>
/* Scoped custom styling */
</style>

