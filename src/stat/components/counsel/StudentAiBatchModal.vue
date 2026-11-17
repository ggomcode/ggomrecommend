<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
    <div class="bg-white rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden border border-slate-200">
      
      <!-- Modal Header -->
      <div class="px-6 py-4 bg-linear-to-r from-indigo-900 via-blue-900 to-slate-900 text-white flex items-center justify-between shrink-0">
        <div class="flex items-center space-x-2.5">
          <span class="text-2xl">⚡</span>
          <div>
            <h3 class="text-sm sm:text-base font-bold m-0 text-white flex items-center gap-2">
              <span>{{ classLabel }} 학생 일괄 AI 심층 상담 리포트 생성기</span>
            </h3>
            <p class="text-[11px] text-blue-200 m-0">상담 주간 전 사전 일괄 생성으로 0초 즉각 열람 보장</p>
          </div>
        </div>
        <button
          type="button"
          @click="handleClose"
          :disabled="isProcessing"
          class="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer border-none bg-transparent disabled:opacity-40"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6 space-y-4 text-xs text-slate-700">
        <!-- Target Info & Options Banner -->
        <div class="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-2.5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span class="font-bold text-indigo-950">분석 대상 학급:</span>
              <strong class="text-indigo-700 ml-1 font-mono text-sm">{{ classLabel }}</strong>
              <span class="text-slate-500 ml-1.5">(총 {{ students.length }}명)</span>
            </div>
            <div class="flex items-center gap-2">
              <label class="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  v-model="skipExisting"
                  :disabled="isProcessing"
                  class="rounded accent-indigo-600"
                />
                <span>이미 분석된 학생은 건너뛰기</span>
              </label>
            </div>
          </div>
          <div class="text-[11px] text-slate-600 leading-relaxed">
            ※ Google Gemini 무료 티어 호출 한도(15 RPM)를 안전하게 준수하기 위해 <strong>학생당 약 3.5초 간격으로 순차 진행</strong>됩니다. 
            완료된 리포트는 Supabase DB에 영구 보존됩니다.
          </div>
        </div>

        <!-- Progress Bar (When processing or completed) -->
        <div v-if="hasStarted" class="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-slate-800">
              {{ isProcessing ? `[진행 중] ${currentStatusText}` : (isComplete ? '🎉 일괄 분석 완료!' : '일시 중단됨') }}
            </span>
            <span class="font-mono font-bold text-indigo-700">
              {{ stats.processed }} / {{ stats.total }} ({{ progressPercent }}%)
            </span>
          </div>

          <!-- Bar -->
          <div class="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
            <div
              class="h-full bg-linear-to-r from-indigo-500 to-blue-600 transition-all duration-300"
              :style="{ width: `${progressPercent}%` }"
            ></div>
          </div>

          <!-- Counter Pills -->
          <div class="grid grid-cols-4 gap-2 text-center text-[11px] pt-1 font-bold">
            <div class="p-1.5 rounded-lg bg-white border border-slate-200">
              <span class="text-slate-400 block text-[10px]">총 대상</span>
              <span class="font-mono text-slate-800">{{ stats.total }}명</span>
            </div>
            <div class="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
              <span class="text-emerald-600 block text-[10px]">성공 생성</span>
              <span class="font-mono">{{ stats.success }}명</span>
            </div>
            <div class="p-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800">
              <span class="text-blue-600 block text-[10px]">기분석 건너뜀</span>
              <span class="font-mono">{{ stats.skipped }}명</span>
            </div>
            <div class="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800">
              <span class="text-rose-600 block text-[10px]">실패</span>
              <span class="font-mono">{{ stats.failed }}명</span>
            </div>
          </div>
        </div>

        <!-- Student Progress Log List -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-[11px] text-slate-500 font-bold px-1">
            <span>학생별 진행 상태 목록</span>
            <span>{{ studentStatusList.length }}명</span>
          </div>
          <div class="max-h-48 overflow-y-auto space-y-1 p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div
              v-for="(st, idx) in studentStatusList"
              :key="st.key"
              class="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-100"
            >
              <div class="flex items-center gap-2">
                <span class="font-mono text-slate-400 text-[10px] w-6">{{ idx + 1 }}.</span>
                <span class="font-bold text-slate-800">{{ st.name }}</span>
                <span class="text-[11px] text-slate-400 font-mono">({{ st.classStr }})</span>
                <span class="text-[10px] text-blue-700 font-mono">내신 {{ st.gpa.toFixed(2) }}</span>
              </div>
              <div>
                <span
                  :class="[
                    'px-2 py-0.5 rounded text-[10px] font-bold',
                    st.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                    st.status === 'SKIPPED' ? 'bg-blue-100 text-blue-800' :
                    st.status === 'PROCESSING' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                    st.status === 'FAILED' ? 'bg-rose-100 text-rose-800' :
                    'bg-slate-100 text-slate-500'
                  ]"
                >
                  {{ st.statusText }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer Action Buttons -->
      <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <button
          type="button"
          @click="handleClose"
          :disabled="isProcessing"
          class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer border border-slate-300 disabled:opacity-40"
        >
          닫기
        </button>

        <div class="flex items-center gap-2">
          <button
            v-if="isProcessing"
            type="button"
            @click="pauseBatch"
            class="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-all cursor-pointer shadow-xs border-none flex items-center gap-1.5"
          >
            <span>⏸️</span>
            <span>일시 중단</span>
          </button>

          <button
            v-else-if="!isComplete"
            type="button"
            @click="startBatch"
            class="px-5 py-2.5 rounded-xl text-xs font-bold bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white transition-all cursor-pointer shadow-md border-none flex items-center gap-1.5"
          >
            <span>⚡</span>
            <span>{{ stats.processed > 0 ? '이어서 일괄 분석' : '일괄 분석 시작' }}</span>
          </button>

          <button
            v-else
            type="button"
            @click="handleClose"
            class="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-md border-none flex items-center gap-1.5"
          >
            <span>✅</span>
            <span>완료 및 닫기</span>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue'
import { 
  getGeminiApiKey, 
  fetchStudentAiCounsel, 
  saveStudentAiCounsel, 
  generateStudentIndividualAiCounsel 
} from '../../../api/geminiApi.js'
import { maskName } from '../../../utils/maskUtils'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  classLabel: { type: String, default: '해당 학급' },
  students: { type: Array, default: () => [] },
  academicYear: { type: String, default: '2027' },
  allApplications: { type: Array, default: () => [] },
  getStudentMockExams: { type: Function, required: true }
})

const emit = defineEmits(['close', 'student-analyzed', 'batch-complete'])

const skipExisting = ref(true)
const isProcessing = ref(false)
const shouldStop = ref(false)
const hasStarted = ref(false)
const isComplete = ref(false)
const currentStatusText = ref('')

const stats = reactive({
  total: 0,
  processed: 0,
  success: 0,
  skipped: 0,
  failed: 0
})

const studentStatusList = ref([])

// 모달이 열릴 때 상태 초기화
watch(() => props.isOpen, (open) => {
  if (open) {
    stats.total = props.students.length
    stats.processed = 0
    stats.success = 0
    stats.skipped = 0
    stats.failed = 0
    hasStarted.value = false
    isComplete.value = false
    shouldStop.value = false
    currentStatusText.value = ''

    studentStatusList.value = props.students.map(s => {
      const classStr = s.isGraduate ? '졸업생' : `${s.classNum}반 ${s.studentNum}번`
      return {
        key: s.key,
        name: maskName(s.name),
        classStr,
        gpa: s.gpa || 0,
        raw: s,
        status: 'PENDING',
        statusText: '대기 중'
      }
    })
  }
})

const progressPercent = computed(() => {
  if (!stats.total) return 0
  return Math.min(100, Math.round((stats.processed / stats.total) * 100))
})

function handleClose() {
  if (isProcessing.value) return
  emit('close')
}

function pauseBatch() {
  shouldStop.value = true
  currentStatusText.value = '일시 중단 요청됨...'
}

/**
 * 특정 학생의 비식별화 페이로드 빌드
 */
function buildPayloadForStudent(student) {
  const apps = props.allApplications.filter(a => a.studentKey === student.key)
  const studentExams = props.getStudentMockExams(student.key) || []

  const cleanedExams = studentExams.map(ex => ({
    examName: ex.examName || `${ex.monthOrder || ''}월 학평`,
    korGrade: ex.korGrade ?? null,
    korPercentile: ex.korPercentile ?? null,
    mathGrade: ex.mathGrade ?? null,
    mathPercentile: ex.mathPercentile ?? null,
    engGrade: ex.engGrade ?? null,
    histGrade: ex.histGrade ?? null,
    inq1Subject: ex.inquiry1 || null,
    inq1Grade: ex.inq1Grade ?? null,
    inq1Percentile: ex.inq1Percentile ?? null,
    inq2Subject: ex.inquiry2 || null,
    inq2Grade: ex.inq2Grade ?? null,
    inq2Percentile: ex.inq2Percentile ?? null
  }))

  const cleanedApps = apps.slice(0, 6).map((app, idx) => ({
    choiceOrder: idx + 1,
    univName: app.univName || '',
    dept: app.dept || '',
    admissionType: app.admissionType || '',
    trackName: app.admissionDetailType || app.admissionMajorType || '',
    csatMinCriteria: app.minScoreReq || '',
    isRuralTrack: Boolean(app.isRural),
    isOpportunityTrack: Boolean(app.isOpportunity),
    result: app.finalStage || app.stage1 || ''
  }))

  const isRuralEligible = Boolean(student.isRural)
  const isOppEligible = Boolean(apps.some(a => a.isOpportunity))
  const studentType = student.isGraduate ? '졸업생(N수)' : `${student.classNum || 3}학년 재학생`

  return {
    academicYear: props.academicYear || '2027',
    studentType,
    gpa: {
      allSubject: Number((student.gpa || 3.0).toFixed(2)),
      korGrade: student.korGrade || 5,
      mathGrade: student.mathGrade || 5,
      engGrade: student.engGrade || 5,
      tamguGrade: student.socGrade || student.sciGrade || 5
    },
    specialQualifications: {
      isRuralEligible,
      isOpportunityEligible: isOppEligible
    },
    applications: cleanedApps,
    mockExams: cleanedExams
  }
}

async function startBatch() {
  const apiKey = await getGeminiApiKey()
  if (!apiKey) {
    alert('Google Gemini API Key가 등록되지 않았습니다. 관리자 [환경 설정] > [Gemini AI 환경 설정]에서 키를 등록해 주세요.')
    return
  }

  isProcessing.value = true
  shouldStop.value = false
  hasStarted.value = true
  isComplete.value = false

  const list = studentStatusList.value
  const yr = props.academicYear || '2027'

  for (let i = 0; i < list.length; i++) {
    if (shouldStop.value) {
      currentStatusText.value = '일시 중단되었습니다.'
      break
    }

    const item = list[i]
    if (item.status === 'SUCCESS' || item.status === 'SKIPPED') {
      continue
    }

    item.status = 'PROCESSING'
    item.statusText = '분석 진행 중...'
    currentStatusText.value = `${item.name} (${item.classStr}) 심층 분석 중...`

    try {
      // 1. 이미 분석된 데이터 조회
      if (skipExisting.value) {
        const cached = await fetchStudentAiCounsel(yr, item.key)
        if (cached && cached.report) {
          item.status = 'SKIPPED'
          item.statusText = '기분석 건너뜀'
          stats.skipped++
          stats.processed++
          continue
        }
      }

      // 2. 비식별화 페이로드 생성
      const payload = buildPayloadForStudent(item.raw)

      // 3. Gemini API 호출
      const res = await generateStudentIndividualAiCounsel(apiKey, yr, payload, (msg) => {
        if (msg.includes('재시도')) {
          item.statusText = '1차 자동 재시도 중...'
        } else if (msg.includes('강등') || msg.includes('낮추어')) {
          item.statusText = '2차 모델 강등 진행 중...'
        } else {
          item.statusText = msg.length > 25 ? msg.substring(0, 23) + '..' : msg
        }
      })

      if (res.success && res.data) {
        // 4. DB 및 localStorage 저장
        await saveStudentAiCounsel(yr, item.key, res.data)
        item.status = 'SUCCESS'
        item.statusText = '생성 완료'
        stats.success++
        stats.processed++
        emit('student-analyzed', { studentKey: item.key, reportData: res.data })
      } else {
        throw new Error('AI 응답 데이터 구조 오류')
      }

      // 5. 15 RPM 한도 준수를 위한 3.5초 안전 대기
      if (i < list.length - 1 && !shouldStop.value) {
        currentStatusText.value = `${item.name} 완료 (다음 학생 대기 중...)`
        await new Promise(r => setTimeout(r, 3500))
      }
    } catch (err) {
      console.warn(`[BatchAI] ${item.name} 분석 실패:`, err)
      item.status = 'FAILED'
      item.statusText = '실패'
      stats.failed++
      stats.processed++
      // 오류 발생 시 2초 대기 후 다음 학생 계속 진행
      await new Promise(r => setTimeout(r, 2000))
    }
  }

  isProcessing.value = false
  if (stats.processed >= stats.total && !shouldStop.value) {
    isComplete.value = true
    currentStatusText.value = `전체 ${stats.total}명 분석 완료 (신규 ${stats.success}명, 건너뜀 ${stats.skipped}명)`
    emit('batch-complete', {
      successCount: stats.success,
      skippedCount: stats.skipped,
      failCount: stats.failed
    })
  }
}
</script>
