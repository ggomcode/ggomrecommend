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
            <h1 class="text-base font-bold text-slate-900 m-0">수능 · 수시 응시 관리</h1>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <button @click="$router.push('/select-system')" class="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-2 rounded-lg transition-all cursor-pointer">🏠 포털 이동</button>
          <button @click="handleLogout" class="text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-lg transition-all cursor-pointer">로그아웃</button>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 py-8">
      <!-- 통계 카드 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <p class="text-xs font-bold text-slate-400 mb-1">전체 재학생</p>
          <p class="text-2xl font-extrabold text-slate-900">{{ stats.total }}</p>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <p class="text-xs font-bold text-slate-400 mb-1">응답 완료</p>
          <p class="text-2xl font-extrabold text-emerald-600">{{ stats.surveyed }}</p>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <p class="text-xs font-bold text-slate-400 mb-1">수능 미응시</p>
          <p class="text-2xl font-extrabold text-orange-500">{{ stats.csatNoTake }}</p>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <p class="text-xs font-bold text-red-500 mb-1">⚠️ 불일치</p>
          <p class="text-2xl font-extrabold text-red-600">{{ stats.mismatch }}</p>
        </div>
      </div>

      <!-- 탭 -->
      <div class="flex gap-2 mb-6 flex-wrap">
        <button @click="activeTab = 'overview'" :class="['px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer border', activeTab === 'overview' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50']">📊 대조 현황</button>
        <button @click="activeTab = 'upload'" :class="['px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer border', activeTab === 'upload' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50']">📤 접수대장 업로드</button>
      </div>

      <!-- 대조 현황 탭 -->
      <div v-if="activeTab === 'overview'">
        <!-- 필터 -->
        <div class="flex flex-wrap gap-3 mb-4 items-center">
          <select v-model="filterClass" class="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white font-semibold text-slate-700 cursor-pointer">
            <option value="all">전체 반</option>
            <option v-for="c in classList" :key="c" :value="c">{{ c }}반</option>
          </select>
          <select v-model="filterStatus" class="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white font-semibold text-slate-700 cursor-pointer">
            <option value="all">전체 상태</option>
            <option value="mismatch">⚠️ 불일치만</option>
            <option value="no_survey">미응답만</option>
            <option value="no_take">수능 미응시만</option>
            <option value="no_apply">수시 미접수만</option>
          </select>
          <button @click="downloadExcel" class="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-lg transition-all cursor-pointer">📥 엑셀 다운로드</button>
          <button @click="printBatchCsat" class="text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3.5 py-2 rounded-lg transition-all cursor-pointer">🖨️ 수능 미응시 일괄인쇄</button>
          <button @click="printBatchSusi" class="text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3.5 py-2 rounded-lg transition-all cursor-pointer">🖨️ 수시 미접수 일괄인쇄</button>
        </div>

        <!-- 데이터 테이블 -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                <th class="px-4 py-3 text-left font-bold text-slate-600">학번</th>
                <th class="px-4 py-3 text-left font-bold text-slate-600">성명</th>
                <th class="px-4 py-3 text-center font-bold text-slate-600">반</th>
                <th class="px-4 py-3 text-center font-bold text-slate-600">수능 자가체크</th>
                <th class="px-4 py-3 text-center font-bold text-slate-600">수능 접수대장</th>
                <th class="px-4 py-3 text-center font-bold text-slate-600">수능 매칭</th>
                <th class="px-4 py-3 text-center font-bold text-slate-600">수시 자가체크</th>
                <th class="px-4 py-3 text-center font-bold text-slate-600">확인서</th>
                <th class="px-4 py-3 text-center font-bold text-slate-600">인쇄</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading" class="border-b border-slate-100">
                <td colspan="9" class="px-4 py-12 text-center text-slate-400 font-semibold">불러오는 중...</td>
              </tr>
              <tr v-else-if="filteredData.length === 0" class="border-b border-slate-100">
                <td colspan="9" class="px-4 py-12 text-center text-slate-400 font-semibold">표시할 데이터가 없습니다.</td>
              </tr>
              <tr v-for="row in filteredData" :key="row.student_code"
                :class="['border-b border-slate-100 transition-colors', isMismatch(row) ? 'bg-red-50/70' : 'hover:bg-slate-50']">
                <td class="px-4 py-3 font-mono text-slate-700 font-bold">{{ row.student_code }}</td>
                <td class="px-4 py-3 font-semibold text-slate-800">{{ row.name }}</td>
                <td class="px-4 py-3 text-center text-slate-600">{{ row.class_no }}반</td>
                <!-- 수능 자가체크 -->
                <td class="px-4 py-3 text-center">
                  <span v-if="!row.has_survey" class="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">미응답</span>
                  <span v-else-if="row.csat_intent === 'TAKE'" class="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">응시</span>
                  <span v-else class="text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded-full">미응시</span>
                </td>
                <!-- 수능 접수대장 -->
                <td class="px-4 py-3 text-center">
                  <span v-if="row.csat_registered" class="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">접수됨</span>
                  <span v-else class="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">미접수</span>
                </td>
                <!-- 수능 매칭 -->
                <td class="px-4 py-3 text-center">
                  <span v-if="row.csat_mismatch === 'MATCH'" class="text-xs font-bold text-emerald-600">✔</span>
                  <span v-else-if="row.csat_mismatch === 'NO_SURVEY'" class="text-xs font-bold text-slate-400">-</span>
                  <span v-else class="text-xs font-extrabold text-red-600 bg-red-100 px-2 py-1 rounded-full animate-pulse">⚠️ 불일치</span>
                </td>
                <!-- 수시 자가체크 -->
                <td class="px-4 py-3 text-center">
                  <span v-if="!row.has_survey" class="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">미응답</span>
                  <span v-else-if="row.susi_intent === 'APPLY'" class="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">접수</span>
                  <span v-else class="text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded-full">미접수</span>
                </td>
                <!-- 확인서 제출 -->
                <td class="px-4 py-3 text-center">
                  <button v-if="row.has_survey" @click="toggleSubmitted(row)"
                    :class="['text-xs font-bold px-2 py-1 rounded-full cursor-pointer transition-all border', row.is_form_submitted ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100']">
                    {{ row.is_form_submitted ? '✔ 제출' : '⏳ 미제출' }}
                  </button>
                  <span v-else class="text-xs text-slate-300">-</span>
                </td>
                <!-- 인쇄 -->
                <td class="px-4 py-3 text-center">
                  <div class="flex gap-1 justify-center">
                    <button v-if="row.csat_intent === 'NO_TAKE'" @click="printSingleCsat(row)" class="text-xs font-bold text-orange-600 hover:bg-orange-50 px-2 py-1 rounded cursor-pointer" title="수능 미응시 확인서">📄수능</button>
                    <button v-if="row.susi_intent === 'NO_APPLY'" @click="printSingleSusi(row)" class="text-xs font-bold text-purple-600 hover:bg-purple-50 px-2 py-1 rounded cursor-pointer" title="수시 미접수 확인서">📄수시</button>
                    <span v-if="row.csat_intent !== 'NO_TAKE' && row.susi_intent !== 'NO_APPLY'" class="text-xs text-slate-300">-</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
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
                  <p class="text-xl font-extrabold text-slate-900">{{ parsedResult?.stats?.total || 0 }}</p>
                </div>
                <div class="bg-white rounded-xl p-3 text-center border border-indigo-100">
                  <p class="text-xs font-bold text-slate-400">재학생</p>
                  <p class="text-xl font-extrabold text-blue-600">{{ parsedResult?.stats?.enrolledCount || 0 }}</p>
                </div>
                <div class="bg-white rounded-xl p-3 text-center border border-indigo-100">
                  <p class="text-xs font-bold text-slate-400">졸업생</p>
                  <p class="text-xl font-extrabold text-amber-600">{{ parsedResult?.stats?.graduatedCount || 0 }}</p>
                </div>
                <div class="bg-white rounded-xl p-3 text-center border border-indigo-100">
                  <p class="text-xs font-bold text-slate-400">PDF 저장 일시</p>
                  <p class="text-sm font-extrabold text-slate-700">{{ parsedResult?.batchTime || '-' }}</p>
                </div>
              </div>

              <!-- 과목 분포 -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div class="bg-white rounded-xl p-3 border border-indigo-100">
                  <p class="text-xs font-bold text-slate-500 mb-2">국어 선택</p>
                  <div v-for="(cnt, subj) in (parsedResult?.stats?.koreanDist || {})" :key="subj" class="flex justify-between text-xs py-0.5">
                    <span class="text-slate-600">{{ subj }}</span>
                    <span class="font-bold text-slate-800">{{ cnt }}명</span>
                  </div>
                </div>
                <div class="bg-white rounded-xl p-3 border border-indigo-100">
                  <p class="text-xs font-bold text-slate-500 mb-2">수학 선택</p>
                  <div v-for="(cnt, subj) in (parsedResult?.stats?.mathDist || {})" :key="subj" class="flex justify-between text-xs py-0.5">
                    <span class="text-slate-600">{{ subj }}</span>
                    <span class="font-bold text-slate-800">{{ cnt }}명</span>
                  </div>
                </div>
                <div class="bg-white rounded-xl p-3 border border-indigo-100">
                  <p class="text-xs font-bold text-slate-500 mb-2">탐구 유형</p>
                  <div v-for="(cnt, subj) in (parsedResult?.stats?.inquiryDist || {})" :key="subj" class="flex justify-between text-xs py-0.5">
                    <span class="text-slate-600">{{ subj }}</span>
                    <span class="font-bold text-slate-800">{{ cnt }}명</span>
                  </div>
                </div>
              </div>

              <!-- 시간 비교 경고 -->
              <div v-if="batchTimeWarning" class="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-4">
                <p class="text-sm font-bold text-amber-800">⚠️ {{ batchTimeWarning }}</p>
              </div>

              <div class="flex gap-3">
                <button @click="confirmUpload" :disabled="uploading" class="flex-1 py-3 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all cursor-pointer border-none shadow-md">
                  {{ uploading ? '업로드 중...' : '✅ DB에 업로드 실행' }}
                </button>
                <button @click="cancelUpload" class="py-3 px-6 rounded-xl text-sm font-bold bg-slate-200 text-slate-600 hover:bg-slate-300 transition-all cursor-pointer border-none">취소</button>
              </div>
            </div>
          </div>

          <!-- 업로드 완료 -->
          <div v-if="uploadState === 'done'" class="mt-6">
            <div class="bg-emerald-50 rounded-2xl p-6 border border-emerald-200 text-center">
              <p class="text-4xl mb-2">✅</p>
              <p class="text-base font-bold text-emerald-800">{{ uploadResultMsg }}</p>
              <button @click="resetUpload" class="mt-4 text-sm font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-4 py-2 rounded-lg cursor-pointer border border-emerald-300 transition-all">새 파일 업로드</button>
            </div>
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
import { printCsatNoTakeForm, printSusiNoApplyForm, printBatchIntentForms } from '../utils/printTemplates'
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

const classList = computed(() => {
  const classes = new Set()
  for (const r of comparisonData.value) {
    if (r.class_no) classes.add(r.class_no)
  }
  return [...classes].sort((a, b) => a - b)
})

const stats = computed(() => {
  const data = comparisonData.value
  return {
    total: data.length,
    surveyed: data.filter(r => r.has_survey).length,
    csatNoTake: data.filter(r => r.csat_intent === 'NO_TAKE').length,
    susiNoApply: data.filter(r => r.susi_intent === 'NO_APPLY').length,
    mismatch: data.filter(r => isMismatch(r)).length
  }
})

const filteredData = computed(() => {
  let data = comparisonData.value
  if (filterClass.value !== 'all') {
    data = data.filter(r => r.class_no === Number(filterClass.value))
  }
  if (filterStatus.value === 'mismatch') data = data.filter(r => isMismatch(r))
  else if (filterStatus.value === 'no_survey') data = data.filter(r => !r.has_survey)
  else if (filterStatus.value === 'no_take') data = data.filter(r => r.csat_intent === 'NO_TAKE')
  else if (filterStatus.value === 'no_apply') data = data.filter(r => r.susi_intent === 'NO_APPLY')
  return data
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
  printCsatNoTakeForm(student, { csat_no_take_reason: row.csat_no_take_reason, student_signature: row.student_signature, parent_signature: row.parent_signature, parent_name: row.parent_name, confirmed_at: row.confirmed_at })
}

function printSingleSusi(row) {
  const student = { name: row.name, grade: row.grade, class_no: row.class_no, student_no: row.student_no, student_code: row.student_code }
  printSusiNoApplyForm(student, { susi_no_apply_reason: row.susi_no_apply_reason, student_signature: row.student_signature, parent_signature: row.parent_signature, parent_name: row.parent_name, confirmed_at: row.confirmed_at })
}

function printBatchCsat() {
  const targets = filteredData.value
    .filter(r => r.csat_intent === 'NO_TAKE')
    .map(r => ({
      student: { name: r.name, grade: r.grade, class_no: r.class_no, student_no: r.student_no, student_code: r.student_code },
      intentData: { csat_no_take_reason: r.csat_no_take_reason, student_signature: r.student_signature, parent_signature: r.parent_signature, parent_name: r.parent_name, confirmed_at: r.confirmed_at }
    }))
  if (targets.length === 0) return alert('인쇄 대상이 없습니다.')
  printBatchIntentForms(targets, 'csat')
}

function printBatchSusi() {
  const targets = filteredData.value
    .filter(r => r.susi_intent === 'NO_APPLY')
    .map(r => ({
      student: { name: r.name, grade: r.grade, class_no: r.class_no, student_no: r.student_no, student_code: r.student_code },
      intentData: { susi_no_apply_reason: r.susi_no_apply_reason, student_signature: r.student_signature, parent_signature: r.parent_signature, parent_name: r.parent_name, confirmed_at: r.confirmed_at }
    }))
  if (targets.length === 0) return alert('인쇄 대상이 없습니다.')
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
    '수능미응시사유': r.csat_no_take_reason || '',
    '수시자가체크': r.has_survey ? (r.susi_intent === 'APPLY' ? '접수' : '미접수') : '미응답',
    '수시미접수사유': r.susi_no_apply_reason || '',
    '확인서제출': r.is_form_submitted ? '제출' : '미제출',
    '등록일시': r.confirmed_at || ''
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '수능수시현황')
  XLSX.writeFile(wb, `수능수시_응시현황_${new Date().toISOString().split('T')[0]}.xlsx`)
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
