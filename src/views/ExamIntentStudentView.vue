<template>
  <div class="ei-student-root">
    <!-- 헤더 -->
    <header class="ei-header">
      <div class="ei-header-inner">
        <div class="ei-header-left">
          <div class="ei-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l3.58-3.58c.94-.94.94-2.48 0-3.42L9 5Z"/>
              <path d="M6 9.01V9"/>
            </svg>
          </div>
          <div class="ei-header-titles">
            <span class="ei-school-tag">{{ schoolName }}</span>
            <h1 class="ei-page-title">수능 · 수시 응시 등록</h1>
          </div>
        </div>
        <div class="ei-header-right">
          <button @click="$router.push('/select-system')" class="ei-btn-ghost">🏠 포털</button>
          <button @click="handleLogout" class="ei-btn-ghost">로그아웃</button>
        </div>
      </div>
      <!-- 학생 정보 바 -->
      <div class="ei-student-bar">
        <span class="ei-student-name">{{ auth.studentName }}</span>
        <span class="ei-student-info">{{ auth.grade || 3 }}학년 {{ auth.classNo }}반 {{ auth.seqNo }}번 ({{ auth.studentCode }})</span>
      </div>
    </header>

    <!-- 로딩 -->
    <div v-if="loading" class="ei-loading">
      <div class="ei-spinner"></div>
      <p>데이터를 불러오는 중입니다...</p>
    </div>

    <!-- 이미 등록 완료된 경우: 완료 뷰 -->
    <div v-else-if="isCompleted && !isEditing" class="ei-container">
      <div class="ei-completed-card">
        <div class="ei-completed-icon">✅</div>
        <h2 class="ei-completed-title">등록 완료</h2>
        <p class="ei-completed-date">{{ formatDate(survey.confirmed_at) }}에 등록되었습니다.</p>

        <div class="ei-completed-summary">
          <div class="ei-summary-row">
            <span class="ei-summary-label">수능 응시</span>
            <span :class="['ei-summary-badge', survey.csat_intent === 'TAKE' ? 'badge-blue' : 'badge-red']">
              {{ survey.csat_intent === 'TAKE' ? '✔ 응시' : '✖ 미응시' }}
            </span>
          </div>
          <div v-if="survey.csat_intent === 'NO_TAKE'" class="ei-summary-reason">
            사유: {{ survey.csat_no_take_reason || '-' }}
          </div>
          <div class="ei-summary-row">
            <span class="ei-summary-label">수시 원서</span>
            <span :class="['ei-summary-badge', survey.susi_intent === 'APPLY' ? 'badge-blue' : 'badge-red']">
              {{ survey.susi_intent === 'APPLY' ? '✔ 접수 예정' : '✖ 미접수' }}
            </span>
          </div>
          <div v-if="survey.susi_intent === 'NO_APPLY'" class="ei-summary-reason">
            사유: {{ survey.susi_no_apply_reason || '-' }}
          </div>
        </div>

        <!-- 확인서 출력 버튼 -->
        <div class="ei-print-actions">
          <button v-if="survey.csat_intent === 'NO_TAKE'" @click="printCsatForm" class="ei-btn-print ei-btn-print-csat">
            🖨️ 수능 미응시 확인서 출력
          </button>
          <button v-if="survey.susi_intent === 'NO_APPLY'" @click="printSusiForm" class="ei-btn-print ei-btn-print-susi">
            🖨️ 수시 미접수 확인서 출력
          </button>
        </div>

        <button @click="isEditing = true" class="ei-btn-edit">📝 수정하기</button>
      </div>
    </div>

    <!-- 등록 위저드 -->
    <div v-else class="ei-container">
      <!-- 진행 스텝 표시 -->
      <div class="ei-steps">
        <div v-for="s in 4" :key="s" :class="['ei-step', { active: step >= s, current: step === s }]">
          <div class="ei-step-dot">{{ s }}</div>
          <span class="ei-step-label">{{ stepLabels[s - 1] }}</span>
        </div>
      </div>

      <!-- Step 1: 수능 응시 여부 -->
      <div v-if="step === 1" class="ei-step-content">
        <h2 class="ei-step-title">📝 수능(대학수학능력시험) 응시 여부</h2>
        <p class="ei-step-desc">2027학년도 대학수학능력시험에 응시하시나요?</p>

        <div class="ei-choice-grid">
          <button
            @click="form.csat_intent = 'TAKE'"
            :class="['ei-choice-card', { selected: form.csat_intent === 'TAKE' }]"
          >
            <span class="ei-choice-icon">✅</span>
            <span class="ei-choice-text">수능 응시합니다</span>
            <span class="ei-choice-sub">수능에 접수하여 시험에 응시합니다.</span>
          </button>
          <button
            @click="form.csat_intent = 'NO_TAKE'"
            :class="['ei-choice-card', 'card-red', { selected: form.csat_intent === 'NO_TAKE' }]"
          >
            <span class="ei-choice-icon">❌</span>
            <span class="ei-choice-text">수능 미응시합니다</span>
            <span class="ei-choice-sub">수능에 응시하지 않겠습니다.</span>
          </button>
        </div>

        <!-- 미응시 사유 (미응시 선택 시) -->
        <div v-if="form.csat_intent === 'NO_TAKE'" class="ei-reason-section">
          <label class="ei-label">미응시 사유를 선택해 주세요</label>
          <div class="ei-reason-chips">
            <button v-for="r in csatReasons" :key="r" @click="form.csat_no_take_reason = r"
              :class="['ei-chip', { active: form.csat_no_take_reason === r }]">{{ r }}</button>
          </div>
          <textarea
            v-if="form.csat_no_take_reason === '기타'"
            v-model="form.csat_no_take_reason_detail"
            class="ei-textarea"
            placeholder="기타 사유를 입력해 주세요..."
            rows="2"
          ></textarea>
        </div>

        <div class="ei-nav-buttons">
          <button @click="cancelEditing" v-if="isEditing" class="ei-btn-secondary">취소</button>
          <button @click="goStep(2)" :disabled="!form.csat_intent" class="ei-btn-primary">다음 →</button>
        </div>
      </div>

      <!-- Step 2: 수시 접수 여부 -->
      <div v-if="step === 2" class="ei-step-content">
        <h2 class="ei-step-title">📋 2027학년도 대입 수시원서 접수 여부</h2>
        <p class="ei-step-desc">수시모집 원서를 접수할 예정인가요?</p>

        <div class="ei-choice-grid">
          <button
            @click="form.susi_intent = 'APPLY'"
            :class="['ei-choice-card', { selected: form.susi_intent === 'APPLY' }]"
          >
            <span class="ei-choice-icon">✅</span>
            <span class="ei-choice-text">수시 접수합니다</span>
            <span class="ei-choice-sub">수시모집 원서를 접수할 예정입니다.</span>
          </button>
          <button
            @click="form.susi_intent = 'NO_APPLY'"
            :class="['ei-choice-card', 'card-red', { selected: form.susi_intent === 'NO_APPLY' }]"
          >
            <span class="ei-choice-icon">❌</span>
            <span class="ei-choice-text">수시 미접수합니다</span>
            <span class="ei-choice-sub">수시원서를 접수하지 않겠습니다.</span>
          </button>
        </div>

        <div v-if="form.susi_intent === 'NO_APPLY'" class="ei-reason-section">
          <label class="ei-label">미접수 사유를 선택해 주세요</label>
          <div class="ei-reason-chips">
            <button v-for="r in susiReasons" :key="r" @click="form.susi_no_apply_reason = r"
              :class="['ei-chip', { active: form.susi_no_apply_reason === r }]">{{ r }}</button>
          </div>
          <textarea
            v-if="form.susi_no_apply_reason === '기타'"
            v-model="form.susi_no_apply_reason_detail"
            class="ei-textarea"
            placeholder="기타 사유를 입력해 주세요..."
            rows="2"
          ></textarea>
        </div>

        <div class="ei-nav-buttons">
          <button @click="goStep(1)" class="ei-btn-secondary">← 이전</button>
          <button @click="goStep(3)" :disabled="!form.susi_intent" class="ei-btn-primary">다음 →</button>
        </div>
      </div>

      <!-- Step 3: 서명 -->
      <div v-if="step === 3" class="ei-step-content">
        <h2 class="ei-step-title">✍️ 전자 서명</h2>
        <p class="ei-step-desc">학생 및 보호자의 서명을 입력해 주세요. (종이 수기 서명을 원하시면 건너뛸 수 있습니다.)</p>

        <!-- 보호자 성명 -->
        <div class="ei-field">
          <label class="ei-label">보호자 성명</label>
          <input type="text" v-model="form.parent_name" class="ei-input" placeholder="보호자 성명을 입력해 주세요" />
        </div>

        <!-- 학생 서명 -->
        <div class="ei-sig-section">
          <div class="ei-sig-header">
            <span class="ei-sig-title">학생 서명</span>
            <button @click="clearCanvas('student')" class="ei-btn-clear">지우기</button>
          </div>
          <canvas
            ref="studentCanvasRef"
            class="ei-sig-canvas"
            @mousedown="startDraw($event, 'student')"
            @mousemove="draw($event, 'student')"
            @mouseup="endDraw('student')"
            @mouseleave="endDraw('student')"
            @touchstart.prevent="startDrawTouch($event, 'student')"
            @touchmove.prevent="drawTouch($event, 'student')"
            @touchend="endDraw('student')"
          ></canvas>
        </div>

        <!-- 보호자 서명 -->
        <div class="ei-sig-section">
          <div class="ei-sig-header">
            <span class="ei-sig-title">보호자 서명</span>
            <button @click="clearCanvas('parent')" class="ei-btn-clear">지우기</button>
          </div>
          <canvas
            ref="parentCanvasRef"
            class="ei-sig-canvas"
            @mousedown="startDraw($event, 'parent')"
            @mousemove="draw($event, 'parent')"
            @mouseup="endDraw('parent')"
            @mouseleave="endDraw('parent')"
            @touchstart.prevent="startDrawTouch($event, 'parent')"
            @touchmove.prevent="drawTouch($event, 'parent')"
            @touchend="endDraw('parent')"
          ></canvas>
        </div>

        <div class="ei-nav-buttons">
          <button @click="goStep(2)" class="ei-btn-secondary">← 이전</button>
          <button @click="goStep(4)" class="ei-btn-primary">다음 →</button>
        </div>
      </div>

      <!-- Step 4: 확인 및 제출 -->
      <div v-if="step === 4" class="ei-step-content">
        <h2 class="ei-step-title">📄 등록 내용 확인</h2>
        <p class="ei-step-desc">아래 내용을 확인한 후 제출해 주세요.</p>

        <div class="ei-confirm-card">
          <div class="ei-confirm-row">
            <span class="ei-confirm-label">수능</span>
            <span :class="['ei-summary-badge', form.csat_intent === 'TAKE' ? 'badge-blue' : 'badge-red']">
              {{ form.csat_intent === 'TAKE' ? '✔ 응시' : '✖ 미응시' }}
            </span>
          </div>
          <div v-if="form.csat_intent === 'NO_TAKE'" class="ei-confirm-reason">
            사유: {{ finalCsatReason }}
          </div>

          <div class="ei-confirm-row">
            <span class="ei-confirm-label">수시 원서</span>
            <span :class="['ei-summary-badge', form.susi_intent === 'APPLY' ? 'badge-blue' : 'badge-red']">
              {{ form.susi_intent === 'APPLY' ? '✔ 접수 예정' : '✖ 미접수' }}
            </span>
          </div>
          <div v-if="form.susi_intent === 'NO_APPLY'" class="ei-confirm-reason">
            사유: {{ finalSusiReason }}
          </div>

          <div class="ei-confirm-row">
            <span class="ei-confirm-label">보호자</span>
            <span class="ei-confirm-value">{{ form.parent_name || '(미입력)' }}</span>
          </div>
          <div class="ei-confirm-row">
            <span class="ei-confirm-label">학생 서명</span>
            <span class="ei-confirm-value">{{ studentSigData ? '✔ 입력됨' : '미입력 (종이 제출)' }}</span>
          </div>
          <div class="ei-confirm-row">
            <span class="ei-confirm-label">보호자 서명</span>
            <span class="ei-confirm-value">{{ parentSigData ? '✔ 입력됨' : '미입력 (종이 제출)' }}</span>
          </div>
        </div>

        <div class="ei-nav-buttons">
          <button @click="goStep(3)" class="ei-btn-secondary">← 이전</button>
          <button @click="submitSurvey" :disabled="submitting" class="ei-btn-submit">
            {{ submitting ? '저장 중...' : '✅ 등록 제출' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { schoolName, fetchSchoolName } from '../utils/schoolConfig'
import { getMyIntentSurvey, upsertIntentSurvey, getStudentIdByCode } from '../api/examIntentApi'
import { printCsatNoTakeForm, printSusiNoApplyForm } from '../utils/printTemplates'
import { dialog } from '../components/common/dialog'

const router = useRouter()
const auth = useAuthStore()

const loading = ref(true)
const step = ref(1)
const isCompleted = ref(false)
const isEditing = ref(false)
const submitting = ref(false)
const survey = ref(null)

const stepLabels = ['수능 응시', '수시 접수', '서명', '확인']

const csatReasons = ['취업 준비', '군입대', '해외유학', '수시 합격 기대', '기타']
const susiReasons = ['정시 집중', '취업 준비', '재수 준비', '해외유학', '군입대', '기타']

const form = reactive({
  csat_intent: null,
  csat_no_take_reason: null,
  csat_no_take_reason_detail: '',
  susi_intent: null,
  susi_no_apply_reason: null,
  susi_no_apply_reason_detail: '',
  parent_name: ''
})

// 서명 캔버스 refs
const studentCanvasRef = ref(null)
const parentCanvasRef = ref(null)
const isDrawing = ref({ student: false, parent: false })
const studentSigData = ref(null)
const parentSigData = ref(null)

const finalCsatReason = computed(() => {
  if (form.csat_no_take_reason === '기타') return form.csat_no_take_reason_detail || '기타'
  return form.csat_no_take_reason || ''
})

const finalSusiReason = computed(() => {
  if (form.susi_no_apply_reason === '기타') return form.susi_no_apply_reason_detail || '기타'
  return form.susi_no_apply_reason || ''
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function goStep(s) {
  step.value = s
  window.scrollTo({ top: 0, behavior: 'smooth' })
  if (s === 3) {
    nextTick(() => {
      initCanvas('student')
      initCanvas('parent')
    })
  }
}

function cancelEditing() {
  isEditing.value = false
  step.value = 1
}

// ===== 서명 캔버스 =====
function getCanvas(type) {
  return type === 'student' ? studentCanvasRef.value : parentCanvasRef.value
}

function initCanvas(type) {
  const canvas = getCanvas(type)
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * 2
  canvas.height = rect.height * 2
  const ctx = canvas.getContext('2d')
  ctx.scale(2, 2)
  ctx.strokeStyle = '#1e293b'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // 기존 서명 복원
  const existingSig = type === 'student' ? studentSigData.value : parentSigData.value
  if (existingSig) {
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, rect.width, rect.height)
    }
    img.src = existingSig
  }
}

function clearCanvas(type) {
  const canvas = getCanvas(type)
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  if (type === 'student') studentSigData.value = null
  else parentSigData.value = null
}

function getPos(e, canvas) {
  const rect = canvas.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

function startDraw(e, type) {
  isDrawing.value[type] = true
  const canvas = getCanvas(type)
  const ctx = canvas.getContext('2d')
  const pos = getPos(e, canvas)
  ctx.beginPath()
  ctx.moveTo(pos.x, pos.y)
}

function draw(e, type) {
  if (!isDrawing.value[type]) return
  const canvas = getCanvas(type)
  const ctx = canvas.getContext('2d')
  const pos = getPos(e, canvas)
  ctx.lineTo(pos.x, pos.y)
  ctx.stroke()
}

function endDraw(type) {
  if (!isDrawing.value[type]) return
  isDrawing.value[type] = false
  saveSigData(type)
}

function startDrawTouch(e, type) {
  const touch = e.touches[0]
  const canvas = getCanvas(type)
  const rect = canvas.getBoundingClientRect()
  isDrawing.value[type] = true
  const ctx = canvas.getContext('2d')
  ctx.beginPath()
  ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top)
}

function drawTouch(e, type) {
  if (!isDrawing.value[type]) return
  const touch = e.touches[0]
  const canvas = getCanvas(type)
  const ctx = canvas.getContext('2d')
  const rect = canvas.getBoundingClientRect()
  ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top)
  ctx.stroke()
}

function saveSigData(type) {
  const canvas = getCanvas(type)
  if (!canvas) return
  const dataUrl = canvas.toDataURL('image/png')
  // 빈 캔버스 체크
  const blankCanvas = document.createElement('canvas')
  blankCanvas.width = canvas.width
  blankCanvas.height = canvas.height
  if (dataUrl === blankCanvas.toDataURL('image/png')) return
  if (type === 'student') studentSigData.value = dataUrl
  else parentSigData.value = dataUrl
}

// ===== 제출 =====
async function submitSurvey() {
  submitting.value = true
  try {
    const studentId = await getStudentIdByCode(auth.studentCode)

    const payload = {
      student_id: studentId,
      student_code: auth.studentCode,
      csat_intent: form.csat_intent,
      csat_no_take_reason: form.csat_intent === 'NO_TAKE' ? finalCsatReason.value : null,
      susi_intent: form.susi_intent,
      susi_no_apply_reason: form.susi_intent === 'NO_APPLY' ? finalSusiReason.value : null,
      student_signature: studentSigData.value,
      parent_signature: parentSigData.value,
      parent_name: form.parent_name || null
    }

    const result = await upsertIntentSurvey(payload)
    survey.value = result
    isCompleted.value = true
    isEditing.value = false

    await dialog.alert({ title: '✅ 등록 완료', message: '수능/수시 응시 여부가 성공적으로 등록되었습니다.' })
  } catch (e) {
    console.error('submitSurvey error:', e)
    await dialog.alert({ title: '오류', message: '등록 중 오류가 발생했습니다: ' + (e.message || e) })
  } finally {
    submitting.value = false
  }
}

// ===== 인쇄 =====
function printCsatForm() {
  const student = {
    name: auth.studentName,
    grade: auth.grade,
    class_no: auth.classNo,
    student_no: auth.seqNo,
    student_code: auth.studentCode
  }
  printCsatNoTakeForm(student, survey.value)
}

function printSusiForm() {
  const student = {
    name: auth.studentName,
    grade: auth.grade,
    class_no: auth.classNo,
    student_no: auth.seqNo,
    student_code: auth.studentCode
  }
  printSusiNoApplyForm(student, survey.value)
}

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}

onMounted(async () => {
  fetchSchoolName()
  loading.value = true
  try {
    const data = await getMyIntentSurvey(auth.studentCode)
    if (data && data.confirmed_at) {
      survey.value = data
      isCompleted.value = true
      // form에도 로드
      form.csat_intent = data.csat_intent
      form.csat_no_take_reason = data.csat_no_take_reason
      form.susi_intent = data.susi_intent
      form.susi_no_apply_reason = data.susi_no_apply_reason
      form.parent_name = data.parent_name || ''
      studentSigData.value = data.student_signature
      parentSigData.value = data.parent_signature
    }
  } catch (e) {
    console.warn('Failed to load intent survey:', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* ===== Mobile-First Exam Intent Student View ===== */
.ei-student-root {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4ff 0%, #e8ecf4 100%);
  font-family: 'Pretendard', -apple-system, sans-serif;
  color: #1e293b;
  -webkit-font-smoothing: antialiased;
}

/* Header */
.ei-header {
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(148,163,184,0.2);
  position: sticky;
  top: 0;
  z-index: 50;
}
.ei-header-inner {
  max-width: 640px;
  margin: 0 auto;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ei-header-left { display: flex; align-items: center; gap: 10px; }
.ei-logo {
  width: 38px; height: 38px; border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  color: white; box-shadow: 0 2px 8px rgba(99,102,241,0.3);
}
.ei-header-titles { display: flex; flex-direction: column; }
.ei-school-tag { font-size: 10px; font-weight: 800; color: #6366f1; letter-spacing: 0.03em; }
.ei-page-title { font-size: 15px; font-weight: 800; color: #1e293b; margin: 0; }
.ei-header-right { display: flex; gap: 6px; }
.ei-btn-ghost {
  font-size: 12px; font-weight: 700; color: #64748b;
  background: #f1f5f9; border: 1px solid #e2e8f0;
  padding: 6px 12px; border-radius: 8px; cursor: pointer;
  transition: all 0.2s;
}
.ei-btn-ghost:hover { background: #e2e8f0; color: #1e293b; }

.ei-student-bar {
  max-width: 640px; margin: 0 auto;
  padding: 8px 20px 12px; display: flex; align-items: center; gap: 8px;
}
.ei-student-name { font-size: 14px; font-weight: 800; color: #334155; }
.ei-student-info { font-size: 12px; font-weight: 600; color: #94a3b8; }

/* Loading */
.ei-loading {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 80px 20px; gap: 16px;
}
.ei-spinner {
  width: 36px; height: 36px;
  border: 3px solid #e2e8f0; border-top-color: #6366f1;
  border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.ei-loading p { font-size: 14px; color: #94a3b8; font-weight: 600; }

/* Container */
.ei-container {
  max-width: 640px; margin: 0 auto; padding: 20px;
}

/* Steps indicator */
.ei-steps {
  display: flex; gap: 4px; margin-bottom: 24px;
  padding: 0 4px;
}
.ei-step {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.ei-step-dot {
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 800;
  background: #e2e8f0; color: #94a3b8;
  transition: all 0.3s;
}
.ei-step.active .ei-step-dot { background: #6366f1; color: white; box-shadow: 0 2px 8px rgba(99,102,241,0.3); }
.ei-step.current .ei-step-dot { transform: scale(1.15); }
.ei-step-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-align: center; }
.ei-step.active .ei-step-label { color: #6366f1; }

/* Step content */
.ei-step-content {
  background: white; border-radius: 20px;
  padding: 28px 24px; box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  border: 1px solid rgba(148,163,184,0.15);
}
.ei-step-title { font-size: 20px; font-weight: 800; color: #1e293b; margin: 0 0 6px; }
.ei-step-desc { font-size: 14px; color: #64748b; font-weight: 500; margin: 0 0 24px; line-height: 1.5; }

/* Choice cards */
.ei-choice-grid { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
.ei-choice-card {
  display: flex; flex-direction: column; gap: 4px;
  padding: 20px; border-radius: 16px; cursor: pointer;
  border: 2px solid #e2e8f0; background: #fafbfc;
  transition: all 0.25s; text-align: left;
  -webkit-tap-highlight-color: transparent;
}
.ei-choice-card:hover { border-color: #6366f1; background: #f0f0ff; }
.ei-choice-card.selected {
  border-color: #6366f1; background: linear-gradient(135deg, #eef2ff, #e0e7ff);
  box-shadow: 0 2px 12px rgba(99,102,241,0.15);
}
.ei-choice-card.card-red:hover { border-color: #ef4444; background: #fff5f5; }
.ei-choice-card.card-red.selected {
  border-color: #ef4444; background: linear-gradient(135deg, #fef2f2, #fee2e2);
  box-shadow: 0 2px 12px rgba(239,68,68,0.15);
}
.ei-choice-icon { font-size: 28px; }
.ei-choice-text { font-size: 16px; font-weight: 800; color: #1e293b; }
.ei-choice-sub { font-size: 12px; font-weight: 500; color: #94a3b8; }

/* Reason section */
.ei-reason-section {
  background: #f8fafc; border-radius: 14px; padding: 16px;
  border: 1px solid #e2e8f0; margin-bottom: 16px;
}
.ei-label { font-size: 13px; font-weight: 700; color: #475569; display: block; margin-bottom: 10px; }
.ei-reason-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.ei-chip {
  padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 700;
  background: white; border: 1.5px solid #e2e8f0; color: #475569;
  cursor: pointer; transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
}
.ei-chip.active {
  background: #6366f1; color: white; border-color: #6366f1;
  box-shadow: 0 2px 8px rgba(99,102,241,0.25);
}
.ei-textarea {
  width: 100%; border: 1.5px solid #e2e8f0; border-radius: 12px;
  padding: 12px; font-size: 14px; font-family: inherit; resize: none;
  outline: none; transition: border-color 0.2s;
}
.ei-textarea:focus { border-color: #6366f1; }

/* Nav buttons */
.ei-nav-buttons {
  display: flex; gap: 10px; margin-top: 24px;
}
.ei-btn-primary {
  flex: 1; padding: 14px; border-radius: 14px; font-size: 15px; font-weight: 800;
  background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white;
  border: none; cursor: pointer; transition: all 0.25s;
  box-shadow: 0 2px 12px rgba(99,102,241,0.3);
}
.ei-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(99,102,241,0.4); }
.ei-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.ei-btn-secondary {
  flex: 0.5; padding: 14px; border-radius: 14px; font-size: 15px; font-weight: 700;
  background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0;
  cursor: pointer; transition: all 0.2s;
}
.ei-btn-secondary:hover { background: #e2e8f0; }
.ei-btn-submit {
  flex: 1; padding: 16px; border-radius: 14px; font-size: 16px; font-weight: 800;
  background: linear-gradient(135deg, #059669, #10b981); color: white;
  border: none; cursor: pointer; transition: all 0.25s;
  box-shadow: 0 2px 12px rgba(5,150,105,0.3);
}
.ei-btn-submit:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(5,150,105,0.4); }
.ei-btn-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

/* Signature */
.ei-field { margin-bottom: 20px; }
.ei-input {
  width: 100%; padding: 12px 16px; border: 1.5px solid #e2e8f0;
  border-radius: 12px; font-size: 15px; font-family: inherit;
  outline: none; transition: border-color 0.2s;
}
.ei-input:focus { border-color: #6366f1; }
.ei-sig-section { margin-bottom: 20px; }
.ei-sig-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;
}
.ei-sig-title { font-size: 14px; font-weight: 700; color: #334155; }
.ei-btn-clear {
  font-size: 12px; font-weight: 700; color: #ef4444;
  background: #fef2f2; border: 1px solid #fecaca; padding: 4px 12px;
  border-radius: 8px; cursor: pointer;
}
.ei-sig-canvas {
  width: 100%; height: 140px; border: 2px dashed #cbd5e1;
  border-radius: 14px; background: white; cursor: crosshair;
  touch-action: none;
}

/* Confirm card */
.ei-confirm-card {
  background: #f8fafc; border-radius: 16px; padding: 20px;
  border: 1px solid #e2e8f0; margin-bottom: 8px;
}
.ei-confirm-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 0; border-bottom: 1px solid #e2e8f0;
}
.ei-confirm-row:last-child { border-bottom: none; }
.ei-confirm-label { font-size: 14px; font-weight: 700; color: #475569; }
.ei-confirm-value { font-size: 14px; font-weight: 600; color: #64748b; }
.ei-confirm-reason { font-size: 12px; color: #94a3b8; padding: 4px 0 8px 8px; }

/* Completed view */
.ei-completed-card {
  background: white; border-radius: 24px; padding: 36px 28px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06); text-align: center;
  border: 1px solid rgba(148,163,184,0.15);
}
.ei-completed-icon { font-size: 56px; margin-bottom: 12px; }
.ei-completed-title { font-size: 22px; font-weight: 800; color: #1e293b; margin: 0 0 6px; }
.ei-completed-date { font-size: 13px; color: #94a3b8; font-weight: 600; margin: 0 0 24px; }
.ei-completed-summary {
  background: #f8fafc; border-radius: 16px; padding: 16px 20px;
  text-align: left; margin-bottom: 24px; border: 1px solid #e2e8f0;
}
.ei-summary-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 0;
}
.ei-summary-label { font-size: 14px; font-weight: 700; color: #475569; }
.ei-summary-badge {
  font-size: 13px; font-weight: 800; padding: 4px 12px; border-radius: 20px;
}
.badge-blue { background: #eef2ff; color: #4f46e5; }
.badge-red { background: #fef2f2; color: #dc2626; }
.ei-summary-reason { font-size: 12px; color: #94a3b8; padding: 0 0 6px 4px; }

.ei-print-actions { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.ei-btn-print {
  width: 100%; padding: 14px; border-radius: 14px; font-size: 14px; font-weight: 800;
  border: none; cursor: pointer; transition: all 0.2s;
}
.ei-btn-print-csat { background: linear-gradient(135deg, #f97316, #ef4444); color: white; }
.ei-btn-print-susi { background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; }
.ei-btn-edit {
  width: 100%; padding: 12px; border-radius: 12px; font-size: 14px; font-weight: 700;
  background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0;
  cursor: pointer; transition: all 0.2s;
}
.ei-btn-edit:hover { background: #e2e8f0; }

/* Responsive */
@media (max-width: 480px) {
  .ei-container { padding: 16px; }
  .ei-step-content { padding: 22px 18px; border-radius: 16px; }
  .ei-step-title { font-size: 17px; }
  .ei-choice-card { padding: 16px; }
  .ei-btn-ghost { padding: 5px 8px; font-size: 11px; }
}
</style>
