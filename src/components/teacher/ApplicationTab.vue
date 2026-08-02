<template>
  <div class="flex flex-col">
    <!-- 페이지 헤더 -->
    <div ref="pageTopRef" class="flex-shrink-0 pt-8 pb-3 px-4 sm:px-10 flex items-start justify-between gap-4 flex-wrap">
      <div>
        <p class="text-xs font-semibold mb-1 text-slate-400">담임 교사</p>
        <h1 class="text-2xl font-semibold text-slate-800 dark:text-white" style="margin: 0;">지원자 등록</h1>
      </div>
    </div>

    <!-- HWP 양식 다운로드 바 -->
    <div class="px-4 sm:px-10 pb-4 flex gap-4 text-xs border-b border-slate-100 dark:border-slate-800 mb-2">
      <a href="/data/2027%ED%95%99%EB%85%84%EB%8F%84%20%ED%95%99%EA%B5%90%EC%9E%A5%EC%B6%94%EC%B2%9C%EC%A0%84%ED%98%95%20%EC%84%A0%EC%A0%95%20%EC%8B%A0%EC%B2%AD%EC%84%9C_%EC%96%91%EC%8B%9D.hwp" download class="text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer">
        📝 신청서 한글 양식 다운로드 (HWP)
      </a>
      <span class="text-slate-300 dark:text-slate-700">|</span>
      <a href="/data/2027%ED%95%99%EB%85%84%EB%8F%84%20%ED%95%90%EA%B5%90%EC%9E%A5%EC%B6%94%EC%B2%9C%EC%A0%84%ED%98%95%20%EC%A7%80%EC%9B%90%20%ED%8F%AC%EA%B8%B0%EC%9B%90_%EC%96%91%EC%8B%9D.hwp" download class="text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer">
        📝 포기원 한글 양식 다운로드 (HWP)
      </a>
    </div>

    <!-- 💡 학교장 추천전형 지원 안내 및 지원 전략 가이드 -->
    <div class="mx-4 sm:mx-10 mb-4 bg-gradient-to-br from-blue-50 to-indigo-50/60 dark:from-slate-800 dark:to-slate-800/90 rounded-2xl p-5 border border-blue-200/80 dark:border-blue-900/40 shadow-sm space-y-3">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold shadow-sm">💡</span>
          <h3 class="text-base font-bold text-slate-900 dark:text-white m-0">학교장 추천전형 지원 안내 및 전략 가이드</h3>
        </div>
        <span class="text-xs font-extrabold text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800">
          ★ 1차 라운드 적극 지원 유효
        </span>
      </div>

      <div class="p-3.5 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-blue-100 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 space-y-2">
        <p class="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5 text-xs m-0">
          <span class="text-sm">🎯</span> 1차 라운드 적극 지원의 법칙 (가장 중요)
        </p>
        <p class="leading-relaxed pl-5 text-slate-600 dark:text-slate-300 m-0">
          <strong>1차 라운드에 희망하는 대학을 빠짐없이 미리 신청하도록 지도해 주세요!</strong><br />
          1차 라운드에서 <strong>[추천 확정](합격)</strong>을 받은 학생의 자리는 2차 라운드가 열려 성적이 더 우수한 학생이 추가 지원하더라도 <strong>절대로 박탈되거나 취소되지 않으며 100% 안전하게 보호</strong>됩니다.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
        <div class="p-3 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/50">
          <p class="font-bold text-slate-800 dark:text-slate-200 mb-1">1️⃣ 1차 라운드 (메인 선발)</p>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed m-0">
            주요 대학 추천 희망자 접수 및 1차 추천자 확정 (합격자 기득권 완전 보장)
          </p>
        </div>
        <div class="p-3 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/50">
          <p class="font-bold text-slate-800 dark:text-slate-200 mb-1">2️⃣ 2차 라운드 (잔여 정원)</p>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed m-0">
            1차 합격자를 제외한 <strong>남은 정원(잔여 T/O)</strong>에 대해서만 2차 신청자 간 성적순 경쟁
          </p>
        </div>
        <div class="p-3 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/50">
          <p class="font-bold text-slate-800 dark:text-slate-200 mb-1">3️⃣ 3차 라운드 (최종 미달)</p>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed m-0">
            추가 모집 및 잔여 미달 모집단위 최종 접수 및 마무리 선발
          </p>
        </div>
      </div>

      <div class="text-[11px] text-slate-500 dark:text-slate-400 pt-2 flex items-center justify-between border-t border-blue-100 dark:border-slate-700/50">
        <span>🛡️ <strong>포기자 발생 시</strong>: 1차 합격자가 포기서를 제출한 경우에만 해당 빈자리가 다음 차수 잔여 정원으로 이월됩니다.</span>
      </div>
    </div>

    <div class="px-4 sm:px-10">

      <!-- 입력 확정 버튼 -->
      <div v-if="currentRound && loaded" class="flex items-center gap-3 flex-wrap mt-2">
        <template v-if="!confirmed">
          <button
            class="text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white border-none cursor-pointer transition-all px-4 py-2"
            @click="handleConfirm"
          >입력 완료 확정</button>
        </template>
        <template v-else>
          <span class="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
            ✓ 입력 확정됨
          </span>
          <button
            class="text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer px-3 py-2"
            @click="handleRevokeConfirmation"
          >확정 취소</button>
        </template>
      </div>
    </div>

    <!-- 로딩 / 오류 상태 -->
    <div v-if="loadError" class="px-4 sm:px-10 pb-8">
      <div class="rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 text-rose-800 dark:text-rose-400 p-6 text-center text-sm font-semibold">
        지원자 정보를 불러오지 못했습니다: {{ loadError }}
      </div>
    </div>

    <div v-else-if="!currentRound && loaded" class="px-4 sm:px-10 pb-8">
      <div class="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 p-12 text-center text-slate-400 dark:text-slate-500">
        🔓 진행 중인 추천 라운드가 없습니다. 관리자가 새 추천 라운드를 시작해야 지원 등록이 가능합니다.
      </div>
    </div>

    <!-- 메인 레이아웃 -->
    <div v-else-if="loaded" class="flex flex-col lg:flex-row gap-6 px-4 sm:px-10 pb-8">
      <!-- 1. 좌측 학생 목록 -->
      <div class="w-full lg:w-60 flex-shrink-0 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <div class="p-4 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/10">
          학급 학생 목록 ({{ students.length }}명)
        </div>
        <div class="divide-y divide-slate-100 dark:divide-slate-700 max-h-[500px] overflow-y-auto">
          <div
            v-for="s in students"
            :key="s.id"
            @click="selectStudent(s)"
            class="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors border-l-4"
            :class="selectedStudent?.id === s.id ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-600' : 'border-transparent'"
          >
            <div>
              <span class="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {{ s.is_enrolled ? `${s.seq_no}번 ${s.name}` : `[졸업생] ${s.name}` }}
              </span>
              <p class="text-[10px] text-slate-400 font-mono mt-0.5">{{ s.student_code }}</p>
            </div>
            <span
              v-if="getStudentAppCount(s.id) > 0"
              class="text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full px-2 py-0.5"
            >
              {{ getStudentAppCount(s.id) }}건
            </span>
          </div>
        </div>
      </div>

      <!-- 2. 우측 등록 영역 -->
      <div class="flex-1">
        <div v-if="!selectedStudent" class="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-24 text-center text-slate-400 dark:text-slate-500">
          👈 왼쪽 목록에서 지원을 입력할 학생을 선택해 주세요.
        </div>

        <div v-else class="flex flex-col gap-4">
          <!-- 학생 지원 리스트 -->
          <div class="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl p-5 shadow-sm">
            <div class="flex justify-between items-center mb-4">
              <div>
                <h3 class="text-base font-bold text-slate-800 dark:text-white">
                  {{ selectedStudent.name }} 학생의 추천 신청 내역
                </h3>
                <p class="text-xs text-slate-400 font-medium">현재 {{ currentRound.id }}차 라운드 신청 데이터</p>
              </div>
              <button
                @click="openNewForm"
                v-if="!showForm"
                class="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 border-none rounded-lg px-3 py-2 cursor-pointer transition-colors shadow-sm"
              >
                + 새 전형 추가
              </button>
            </div>

            <div v-if="studentApps.length === 0 && !showForm" class="py-8 text-center text-xs text-slate-400">
              이번 라운드에 등록된 지원 내역이 없습니다. 우측 상단의 '+ 새 전형 추가' 버튼을 눌러주세요.
            </div>

            <div v-else class="flex flex-col gap-2.5">
              <div
                v-for="app in studentApps"
                :key="app.track_id"
                @click="openDetail(app)"
                class="flex justify-between items-center p-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/20 cursor-pointer transition-colors"
              >
                <div>
                  <span class="text-sm font-bold text-slate-800 dark:text-white">
                    [{{ app.univ_name }}] {{ app.track_name }}
                  </span>
                  <span class="text-xs text-slate-400 ml-2">({{ app.department_name }})</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-xs font-semibold text-slate-500">
                    {{ app.total_score ? app.total_score + '점' : '점수 미입력' }}
                  </span>
                  <!-- 추천 배지 -->
                  <span v-if="app.abandoned" class="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-500">포기</span>
                  <span v-else-if="app.recommended" class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-500">추천확정</span>
                  <span v-else class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-500">대기</span>
                  <span class="text-slate-400">›</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 새 전형 추가 폼 -->
          <div v-if="showForm" class="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl p-6 shadow-sm">
            <div class="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 class="text-sm font-bold text-slate-800 dark:text-white">새 전형 지원서 입력</h3>
              <button @click="closeForm" class="text-xs font-bold text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer">닫기</button>
            </div>

            <form @submit.prevent="saveApplication" class="flex flex-col gap-4">
              <!-- 대학/모집단위/학과명 -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-400 mb-1">지원 대학</label>
                  <select
                    v-model="form.univName"
                    required
                    @change="onUnivChange"
                    class="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">대학 선택</option>
                    <option v-for="u in universities" :key="u.id" :value="u.univ_name">{{ u.univ_name }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-400 mb-1">전형명</label>
                  <select
                    v-model="form.trackId"
                    required
                    :disabled="!form.univName"
                    class="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">전형 선택</option>
                    <option v-for="t in tracks" :key="t.id" :value="t.id">
                      {{ t.track_name }} {{ t.grad_allowed ? '' : '[재학생 전용]' }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-400 mb-1">모집단위 (학과)</label>
                  <input
                    v-model="form.departmentName"
                    type="text"
                    required
                    placeholder="예: 컴퓨터공학과"
                    class="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              <!-- 보호자 정보 및 수동 점수 -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div>
                  <label class="block text-xs font-bold text-slate-400 mb-1">학부모 성명</label>
                  <input
                    v-model="form.parentName"
                    type="text"
                    required
                    placeholder="예: 홍길동"
                    class="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-400 mb-1">학부모 연락처</label>
                  <input
                    v-model="form.parentPhone"
                    type="text"
                    required
                    placeholder="010-0000-0000"
                    class="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="block text-xs font-bold text-slate-400">내신 산출 점수</label>
                    <button
                      type="button"
                      @click="showCalcModal = true"
                      class="text-[10px] font-bold text-blue-600 hover:underline bg-transparent border-none cursor-pointer"
                    >
                      🧮 모의 계산기
                    </button>
                  </div>
                  <input
                    v-model="form.manualScore"
                    type="number"
                    step="0.001"
                    required
                    placeholder="직접 계산된 내신 총점 입력"
                    class="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              <!-- 저장 / 취소 버튼 -->
              <div class="flex justify-end gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  @click="closeForm"
                  class="text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 border-none rounded-lg px-4 py-2 cursor-pointer transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  :disabled="saving"
                  class="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 border-none rounded-lg px-5 py-2 cursor-pointer transition-colors"
                >
                  {{ saving ? '제출 중…' : '신청서 등록' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- 지원 상세 모달 -->
    <ApplicationDetailModal
      v-if="detailApp"
      :app="detailApp"
      :student-name="selectedStudent?.name ?? ''"
      @close="detailApp = null"
      @deleted="onModalDeleted"
    />

    <!-- 숨겨진 내신 모의 계산기 모달 -->
    <div v-if="showCalcModal" class="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl w-96 border border-slate-200 dark:border-slate-700">
        <h3 class="text-sm font-bold text-slate-800 dark:text-white mb-4">내신 성적 모의 산출기 (예비)</h3>
        <div class="flex flex-col gap-3 mb-5">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs text-slate-400 mb-1">국어 등급 (1~9)</label>
              <input v-model.number="calcGrades.kor" type="number" min="1" max="9" class="w-full text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 focus:outline-none" />
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">영어 등급 (1~9)</label>
              <input v-model.number="calcGrades.eng" type="number" min="1" max="9" class="w-full text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 focus:outline-none" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs text-slate-400 mb-1">수학 등급 (1~9)</label>
              <input v-model.number="calcGrades.math" type="number" min="1" max="9" class="w-full text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 focus:outline-none" />
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">과학 등급 (1~9)</label>
              <input v-model.number="calcGrades.sci" type="number" min="1" max="9" class="w-full text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 focus:outline-none" />
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-2.5">
          <button @click="showCalcModal = false" class="text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-lg border-none cursor-pointer">취소</button>
          <button @click="runMockCalculation" class="text-xs text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-lg border-none cursor-pointer font-bold">점수 반영</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth.js'
import {
  getCurrentRound,
  teacherGetStudents,
  teacherGetApplications,
  teacherGetUniversities,
  teacherGetUnivTracks,
  teacherCreateApplication,
} from '../../api/teacher.js'
import ApplicationDetailModal from './ApplicationDetailModal.vue'

const auth = useAuthStore()

// ── 페이지 상태 ──
const currentRound = ref(null)
const students = ref([])
const applications = ref([])
const universities = ref([])
const tracks = ref([])
const loaded = ref(false)
const loadError = ref('')
const confirmed = ref(false)

const selectedStudent = ref(null)
const showForm = ref(false)
const saving = ref(false)
const detailApp = ref(null)

// ── 폼 입력 ──
const form = reactive({
  univName: '',
  trackId: '',
  departmentName: '',
  parentName: '',
  parentPhone: '',
  manualScore: ''
})

// ── 모의 계산기 ──
const showCalcModal = ref(false)
const calcGrades = reactive({
  kor: 1,
  eng: 1,
  math: 1,
  sci: 1
})

function runMockCalculation() {
  const avg = (calcGrades.kor + calcGrades.eng + calcGrades.math + calcGrades.sci) / 4
  // 등급 -> 백점 만점 산출 공식
  const score = 100 - ((avg - 1) * 10)
  form.manualScore = Number(score.toFixed(3))
  showCalcModal.value = false
}

const studentApps = computed(() =>
  applications.value.filter(a => a.student_id === selectedStudent.value?.id)
)

function getStudentAppCount(sid) {
  return applications.value.filter(a => a.student_id === sid).length
}

async function loadAll() {
  loadError.value = ''
  try {
    const round = await getCurrentRound()
    currentRound.value = round

    const sts = await teacherGetStudents()
    students.value = sts

    const univs = await teacherGetUniversities()
    universities.value = univs

    if (round) {
      applications.value = await teacherGetApplications(round.id)
    }
  } catch (e) {
    loadError.value = e.message || '데이터를 불러오는 중 오류가 발생했습니다.'
  } finally {
    loaded.value = true
  }
}

function selectStudent(s) {
  selectedStudent.value = s
  closeForm()
}

function openNewForm() {
  showForm.value = true
  form.univName = ''
  form.trackId = ''
  form.departmentName = ''
  form.parentName = ''
  form.parentPhone = ''
  form.manualScore = ''
}

function closeForm() {
  showForm.value = false
}

async function onUnivChange() {
  form.trackId = ''
  tracks.value = []
  if (!form.univName) return
  
  try {
    const trks = await teacherGetUnivTracks(form.univName)
    // 졸업생인 경우 졸업생 허용되는 전형만 필터링
    if (!selectedStudent.value.is_enrolled) {
      tracks.value = trks.filter(t => t.grad_allowed)
    } else {
      tracks.value = trks
    }
  } catch (e) {
    console.error(e)
  }
}

async function saveApplication() {
  saving.value = true
  try {
    const body = {
      student_id: selectedStudent.value.id,
      track_id: form.trackId,
      round_id: currentRound.value.id,
      department_name: form.departmentName,
      manual_score: Number(form.manualScore),
      parent_name: form.parentName,
      parent_phone: form.parentPhone
    }
    await teacherCreateApplication(body)
    
    // 다시 로드
    applications.value = await teacherGetApplications(currentRound.value.id)
    closeForm()
  } catch (e) {
    alert(e.message || '제출 오류가 발생했습니다.')
  } finally {
    saving.value = false
  }
}

function openDetail(app) {
  detailApp.value = app
}

async function onModalDeleted() {
  detailApp.value = null
  applications.value = await teacherGetApplications(currentRound.value.id)
}

function handleConfirm() {
  confirmed.value = true
}

function handleRevokeConfirmation() {
  confirmed.value = false
}

onMounted(loadAll)
</script>
