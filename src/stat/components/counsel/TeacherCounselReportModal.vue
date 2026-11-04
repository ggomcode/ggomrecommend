<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white print:static">
    <div class="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-slate-200 print:shadow-none print:max-w-none print:w-full print:max-h-none print:border-none print:rounded-none">
      
      <!-- Top Modal Bar (화면 전용, 인쇄 시 완전 숨김) -->
      <div class="px-6 py-4 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 print:hidden">
        <div class="flex items-center space-x-3">
          <div class="w-9 h-9 rounded-xl bg-indigo-600/80 flex items-center justify-center text-lg shadow-inner">
            🖨️
          </div>
          <div>
            <h3 class="text-sm font-bold m-0 text-white flex items-center space-x-2">
              <span>교사별 1:1 진학지도 상담록 인쇄 및 조회</span>
              <span class="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 rounded-full">
                A4 상하좌우 15mm 표준서식
              </span>
            </h3>
            <p class="text-[11px] text-slate-300 m-0">학년도·상담교사·학급별 필터링 후 40건 이상의 대용량 상담록을 페이지 분할 인쇄합니다.</p>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <button
            type="button"
            @click="triggerPrint"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer border-none"
          >
            <span>🖨️ 인쇄하기 (Ctrl+P)</span>
          </button>
          <button
            type="button"
            @click="$emit('close')"
            class="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer border-none bg-transparent"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      <!-- Filter Controls Bar (화면 전용) -->
      <div class="px-6 py-3.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden text-xs">
        <div class="flex flex-wrap items-center gap-3">
          <!-- 1. 상담학년도 드롭다운 -->
          <div class="flex items-center space-x-1.5">
            <span class="font-bold text-slate-700">상담 학년도:</span>
            <select
              v-model="selectedYear"
              class="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option v-for="y in availableYears" :key="y" :value="y">{{ y }}학년도</option>
            </select>
          </div>

          <!-- 2. 상담교사 선택 드롭다운 -->
          <div class="flex items-center space-x-1.5">
            <span class="font-bold text-slate-700">상담교사:</span>
            <select
              v-model="selectedTeacher"
              class="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 max-w-40"
            >
              <option v-if="teacherList.length === 0" :value="selectedTeacher">{{ selectedTeacher || '선생님' }}</option>
              <option v-for="t in teacherList" :key="t" :value="t">{{ t }} 선생님</option>
            </select>
            <!-- 직접 입력 버튼 토글 또는 인풋 -->
            <input
              v-if="isCustomTeacherInput"
              v-model="customTeacherName"
              type="text"
              placeholder="직접입력"
              class="w-24 bg-white border border-indigo-300 rounded-lg px-2 py-1 text-xs"
              @blur="applyCustomTeacher"
              @keyup.enter="applyCustomTeacher"
            />
            <button
              type="button"
              @click="toggleCustomTeacher"
              class="text-[11px] text-indigo-600 hover:text-indigo-800 underline bg-transparent border-none cursor-pointer p-0"
            >
              {{ isCustomTeacherInput ? '선택형으로' : '직접입력' }}
            </button>
          </div>

          <!-- 3. 대상 학급 필터 -->
          <div class="flex items-center space-x-1.5">
            <span class="font-bold text-slate-700">학급 필터:</span>
            <select
              v-model="selectedClass"
              class="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">3학년 전체 학생</option>
              <option v-for="c in 11" :key="c" :value="String(c)">3학년 {{ c }}반</option>
              <option value="졸업생">🎓 졸업생</option>
            </select>
          </div>

          <!-- 4. 정렬 방식 -->
          <div class="flex items-center space-x-1.5 text-slate-600">
            <span>정렬:</span>
            <select
              v-model="sortBy"
              class="bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs cursor-pointer focus:outline-none"
            >
              <option value="DATE_ASC">날짜 오름차순 (과거→최신)</option>
              <option value="DATE_DESC">날짜 내림차순 (최신→과거)</option>
              <option value="CODE_ASC">학번 순 (반·번호순)</option>
            </select>
          </div>
        </div>

        <div class="text-xs font-semibold text-slate-600">
          인쇄 대상: <strong class="text-indigo-600 font-bold text-sm">{{ filteredLogs.length }}</strong>건
        </div>
      </div>

      <!-- Printable Document Container (A4 규격 인쇄 영역) -->
      <div class="p-6 sm:p-10 overflow-y-auto print:p-0 print:overflow-visible text-slate-900 bg-white leading-normal flex-1">
        
        <div class="counsel-a4-sheet mx-auto max-w-4xl print:max-w-none print:w-full">
          
          <!-- 1. 상단 대제목 -->
          <div class="text-center mb-6 pt-2">
            <h1 class="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight m-0 pb-1 font-serif print:text-2xl">
              {{ selectedYear }}학년도 1:1 진학지도 상담록
            </h1>
          </div>

          <!-- 2. 제목 아래 줄: [왼쪽: 상담학년도 & 전체 상담기간] / [오른쪽: 상담자 성명] -->
          <div class="flex items-end justify-between border-b-2 border-slate-900 pb-2 mb-3 text-xs sm:text-sm font-semibold text-slate-800">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>상담학년도: <strong class="text-slate-950 font-bold">{{ selectedYear }}학년도</strong></span>
              <span class="text-slate-400">|</span>
              <span>전체 상담기간: <strong class="text-slate-950 font-bold">{{ counselPeriodText }}</strong></span>
              <span v-if="selectedClass !== 'ALL'" class="text-indigo-800 font-bold">
                ({{ formatClassLabel(selectedClass) }})
              </span>
            </div>
            <div class="text-right shrink-0">
              <span>상담자: <strong class="text-sm sm:text-base text-slate-950 font-black underline underline-offset-4 decoration-slate-400">{{ selectedTeacher || '미지정' }}</strong> 선생님</span>
            </div>
          </div>

          <!-- 3. 상담 기록 표 (순번, 학번, 이름, 날짜, 상담내용) -->
          <div class="overflow-x-auto print:overflow-visible mb-4">
            <table class="counsel-table w-full text-left border-collapse text-xs border border-slate-700">
              <thead>
                <tr class="bg-slate-100 text-slate-900 border-b border-slate-700 font-bold text-center">
                  <th class="py-2 px-2 border border-slate-400 w-12 text-center">순번</th>
                  <th class="py-2 px-2 border border-slate-400 w-20 text-center">학번</th>
                  <th class="py-2 px-2 border border-slate-400 w-24 text-center">이름</th>
                  <th class="py-2 px-2 border border-slate-400 w-28 text-center">날짜</th>
                  <th class="py-2 px-3 border border-slate-400 text-left">상담내용</th>
                  <th class="py-2 px-2 border border-slate-400 w-28 text-center print:hidden">관리</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="(log, idx) in filteredLogs" 
                  :key="log.id || idx"
                  class="border-b border-slate-300 hover:bg-slate-50/50 print:hover:bg-transparent"
                >
                  <td class="py-2.5 px-2 border border-slate-300 text-center font-semibold text-slate-600 align-top">
                    {{ idx + 1 }}
                  </td>
                  <td class="py-2.5 px-2 border border-slate-300 text-center font-bold text-slate-800 align-top whitespace-nowrap">
                    {{ log.student_code || formatCode(log) }}
                  </td>
                  <td class="py-2.5 px-2 border border-slate-300 text-center font-bold text-slate-950 align-top whitespace-nowrap">
                    {{ log.student_name }}
                  </td>
                  <td class="py-2.5 px-2 border border-slate-300 text-center text-slate-700 align-top whitespace-nowrap">
                    {{ formatDate(log.counsel_date) }}
                  </td>
                  <td class="py-2.5 px-3 border border-slate-300 text-slate-900 align-top whitespace-pre-wrap leading-relaxed text-[11.5px]">
                    {{ log.content }}
                  </td>
                  <td class="py-2.5 px-2 border border-slate-300 text-center align-top print:hidden whitespace-nowrap">
                    <div class="flex items-center justify-center space-x-1.5">
                      <button
                        type="button"
                        @click="openEditModal(log)"
                        class="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-xs font-bold border border-indigo-200 cursor-pointer transition-colors shadow-2xs"
                        title="상담 기록 수정"
                      >
                        ✏️ 수정
                      </button>
                      <button
                        type="button"
                        @click="handleDeleteLog(log)"
                        class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md text-xs font-bold border border-rose-200 cursor-pointer transition-colors shadow-2xs"
                        title="상담 기록 삭제"
                      >
                        🗑️ 삭제
                      </button>
                    </div>
                  </td>
                </tr>

                <!-- 데이터가 없을 때 -->
                <tr v-if="filteredLogs.length === 0">
                  <td colspan="6" class="py-12 text-center text-slate-400 border border-slate-300">
                    선택한 조건(학년도: {{ selectedYear }}, 상담교사: {{ selectedTeacher }}, 학급: {{ formatClassLabel(selectedClass) }})에 등록된 상담 기록이 없습니다.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 4. 문서 하단 푸터 (인쇄 확인 정보) -->
          <div class="mt-4 pt-2 border-t border-slate-300 flex items-center justify-between text-[11px] text-slate-500 font-sans">
            <div>출력일시: {{ currentDateTimeStr }} | 총 상담건수: {{ filteredLogs.length }}건</div>
            <div>진학지도실 확인: __________________ (인)</div>
          </div>

        </div>

      </div>

      <!-- 상담 기록 수정 서브 모달 (화면 전용) -->
      <div v-if="isEditDialogOpen" class="fixed inset-0 z-60 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 print:hidden">
        <div class="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 class="text-sm font-bold text-slate-900 m-0 flex items-center space-x-2">
              <span>✏️</span>
              <span>상담 기록 수정 ({{ editTarget?.student_name }} / {{ editTarget?.student_code || formatCode(editTarget) }})</span>
            </h4>
            <button type="button" @click="closeEditModal" class="text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer text-lg">
              ✕
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">상담 일자:</label>
              <input type="date" v-model="editForm.counsel_date" class="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">상담 교사:</label>
              <input type="text" v-model="editForm.teacher_name" placeholder="상담교사 성명" class="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">상담 내용:</label>
              <textarea v-model="editForm.content" rows="4" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 leading-relaxed"></textarea>
            </div>
          </div>

          <div class="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button type="button" @click="closeEditModal" class="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer border border-slate-300">
              취소
            </button>
            <button type="button" @click="saveEdit" :disabled="isSavingEdit" class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer border-none disabled:opacity-50 flex items-center space-x-1.5">
              <span>💾</span>
              <span>수정 저장</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { fetchCounselLogs, saveCounselRecord, deleteCounselRecord, getDistinctTeachers, getDistinctYears } from '../../../api/counselApi.js'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  initialYear: { type: String, default: '2027' },
  initialTeacher: { type: String, default: '' },
  currentTeacherName: { type: String, default: '' }
})

const emit = defineEmits(['close', 'updated'])

// 인라인 수정 모달 상태
const isEditDialogOpen = ref(false)
const editTarget = ref(null)
const editForm = ref({ counsel_date: '', teacher_name: '', content: '' })
const isSavingEdit = ref(false)

function openEditModal(log) {
  editTarget.value = log
  editForm.value = {
    counsel_date: log.counsel_date || '',
    teacher_name: log.teacher_name || '',
    content: log.content || ''
  }
  isEditDialogOpen.value = true
}

function closeEditModal() {
  isEditDialogOpen.value = false
  editTarget.value = null
}

async function saveEdit() {
  if (!editTarget.value) return
  if (!editForm.value.content.trim()) {
    alert('상담 내용을 입력해주세요.')
    return
  }

  isSavingEdit.value = true
  try {
    const updated = {
      ...editTarget.value,
      counsel_date: editForm.value.counsel_date,
      teacher_name: (editForm.value.teacher_name || '담임교사').trim(),
      content: editForm.value.content.trim()
    }
    await saveCounselRecord(updated)
    await loadLogs()
    emit('updated')
    closeEditModal()
  } catch (err) {
    console.error('saveEdit error:', err)
    alert('수정 저장 중 오류가 발생했습니다: ' + err.message)
  } finally {
    isSavingEdit.value = false
  }
}

async function handleDeleteLog(log) {
  if (!log) return
  const name = log.student_name || '학생'
  const date = log.counsel_date || ''
  if (!confirm(`[${name}] 학생의 ${date} 상담 기록을 삭제하시겠습니까?`)) {
    return
  }

  try {
    await deleteCounselRecord(log.id, log.student_key)
    await loadLogs()
    emit('updated')
  } catch (err) {
    console.error('handleDeleteLog error:', err)
    alert('삭제 중 오류가 발생했습니다.')
  }
}

const selectedYear = ref(props.initialYear || '2027')
const selectedTeacher = ref(props.initialTeacher || props.currentTeacherName || localStorage.getItem('pcm_teacher_name') || '담임교사')
const selectedClass = ref('ALL') // 'ALL' | '1' ~ '11' | '졸업생'
const sortBy = ref('DATE_ASC') // 'DATE_ASC' | 'DATE_DESC' | 'CODE_ASC'

const availableYears = ref(['2027', '2026', '2025'])
const teacherList = ref([])
const rawLogs = ref([])

const isCustomTeacherInput = ref(false)
const customTeacherName = ref('')

// 모달이 열리거나 학년도가 변경될 때 데이터 로드
watch(() => props.isOpen, (open) => {
  if (open) {
    initData()
  }
})

watch(selectedYear, () => {
  if (props.isOpen) {
    loadLogs()
  }
})

async function initData() {
  try {
    const years = await getDistinctYears()
    if (years && years.length > 0) {
      availableYears.value = years
    }
  } catch (e) {}

  await loadLogs()
}

async function loadLogs() {
  try {
    const logs = await fetchCounselLogs({ academic_year: selectedYear.value })
    rawLogs.value = logs || []

    // 교사 목록 갱신
    const teachers = await getDistinctTeachers(selectedYear.value)
    teacherList.value = teachers

    // 만약 현재 선택된 교사가 목록에 없고 목록에 교사가 있다면 첫번째 교사 선택, 또는 기존 값 유지
    if (!selectedTeacher.value && teachers.length > 0) {
      selectedTeacher.value = teachers[0]
    }
  } catch (err) {
    console.error('[TeacherCounselReportModal] loadLogs error:', err)
  }
}

function toggleCustomTeacher() {
  isCustomTeacherInput.value = !isCustomTeacherInput.value
  if (isCustomTeacherInput.value) {
    customTeacherName.value = selectedTeacher.value
  }
}

function applyCustomTeacher() {
  if (customTeacherName.value.trim()) {
    selectedTeacher.value = customTeacherName.value.trim()
    if (!teacherList.value.includes(selectedTeacher.value)) {
      teacherList.value.unshift(selectedTeacher.value)
    }
  }
  isCustomTeacherInput.value = false
}

// 필터링 및 정렬된 로그 목록
const filteredLogs = computed(() => {
  let list = rawLogs.value.filter(log => {
    // 1. 교사명 필터 (대소문자/공백 무시 비교)
    if (selectedTeacher.value) {
      const targetTeacher = selectedTeacher.value.trim()
      const logTeacher = (log.teacher_name || '').trim()
      if (logTeacher !== targetTeacher) return false
    }

    // 2. 학급 필터
    if (selectedClass.value !== 'ALL') {
      const targetClass = String(selectedClass.value)
      const logClass = String(log.class_num || '')
      if (logClass !== targetClass) return false
    }

    return true
  })

  // 정렬
  list.sort((a, b) => {
    if (sortBy.value === 'DATE_ASC') {
      const da = a.counsel_date || ''
      const db = b.counsel_date || ''
      if (da !== db) return da.localeCompare(db)
      return String(a.student_code || '').localeCompare(String(b.student_code || ''))
    } else if (sortBy.value === 'DATE_DESC') {
      const da = a.counsel_date || ''
      const db = b.counsel_date || ''
      if (da !== db) return db.localeCompare(da)
      return String(a.student_code || '').localeCompare(String(b.student_code || ''))
    } else if (sortBy.value === 'CODE_ASC') {
      const ca = String(a.student_code || formatCode(a))
      const cb = String(b.student_code || formatCode(b))
      if (ca !== cb) return ca.localeCompare(cb)
      return (a.counsel_date || '').localeCompare(b.counsel_date || '')
    }
    return 0
  })

  return list
})

// 해당 학년도의 상담록에 포함되는 전체 상담기간 (minDate ~ maxDate)
const counselPeriodText = computed(() => {
  if (filteredLogs.value.length === 0) {
    return '상담 내역 없음'
  }
  const dates = filteredLogs.value
    .map(l => l.counsel_date)
    .filter(Boolean)
    .sort()

  if (dates.length === 0) return '-'
  const minDate = formatDate(dates[0])
  const maxDate = formatDate(dates[dates.length - 1])

  return `${minDate} ~ ${maxDate}`
})

function formatDate(dStr) {
  if (!dStr) return '-'
  return String(dStr).replace(/-/g, '.')
}

function formatCode(log) {
  if (log.student_code) return log.student_code
  if (log.class_num === '졸업생' || log.isGraduate) return '졸업생'
  if (log.class_num && log.student_num) {
    const c = String(log.class_num).padStart(2, '0')
    const n = String(log.student_num).padStart(2, '0')
    return `3${c}${n}`
  }
  return '-'
}

function formatClassLabel(c) {
  if (c === 'ALL') return '3학년 전체'
  if (c === '졸업생') return '졸업생'
  return `3학년 ${c}반`
}

const currentDateTimeStr = computed(() => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dt = String(d.getDate()).padStart(2, '0')
  const hr = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}.${m}.${dt} ${hr}:${min}`
})

function triggerPrint() {
  window.print()
}

onMounted(() => {
  if (props.isOpen) {
    initData()
  }
})
</script>

<style scoped>
@media print {
  /* A4 기준 상하좌우 여백 15mm 엄수 */
  @page {
    size: A4 portrait;
    margin: 15mm;
  }

  body {
    background: white !important;
    color: #111827 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .print\:hidden {
    display: none !important;
  }

  .counsel-a4-sheet {
    width: 100% !important;
    max-width: none !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .counsel-table {
    width: 100% !important;
    border-collapse: collapse !important;
    page-break-inside: auto;
  }

  /* 테이블 헤더 매 페이지 자동 반복 출력 */
  .counsel-table thead {
    display: table-header-group !important;
  }

  /* 행 중간 페이지 찢어짐 방지 */
  .counsel-table tbody tr {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  .counsel-table th, 
  .counsel-table td {
    border: 1px solid #475569 !important;
  }
}
</style>

