<template>
  <div class="py-8 px-4 sm:px-10">

    <!-- 페이지 헤더 -->
    <div class="flex items-end justify-between flex-wrap gap-3 mb-5">
      <div>
        <p class="text-xs font-bold mb-1 text-slate-400">통합 시스템 설정</p>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight m-0">학급 현황 설정</h1>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button
          class="flex items-center gap-1.5 text-sm font-semibold rounded-lg disabled:opacity-40 shadow-xs cursor-pointer transition-all"
          style="padding: 9px 16px; border: none; background: #2563eb; color: white;"
          :disabled="showAddForm"
          @click="openAddForm"
        >
          <Plus :size="16" /> 새 학급 추가
        </button>
        <span style="color: #cbd5e1; user-select: none;">|</span>
        <button
          class="flex items-center gap-1.5 text-sm font-medium rounded-lg disabled:opacity-40 bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
          style="padding: 9px 16px; border: 1px solid #cbd5e1; color: #334155;"
          :disabled="classes.length === 0"
          @click="dlExport"
        >
          <FileSpreadsheet :size="16" class="text-emerald-600" />
          {{ selectedGrade === 'ALL' ? '전체 학급 목록 다운로드' : `${selectedGradeLabel} 목록 다운로드` }}
        </button>
      </div>
    </div>

    <!-- 도움말 박스 -->
    <HelpBox class="mb-5" storage-key="classes_settings" :title="HELP.title" :intro="HELP.intro" :items="HELP.items" />

    <!-- 학년 필터 & 제어 바 -->
    <div class="bg-white rounded-xl border border-slate-200/90 p-4 mb-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
      <!-- 1. 드롭다운 선택 (사용자 요청 핵심) -->
      <div class="flex items-center gap-2.5">
        <label for="grade-select" class="text-sm font-bold text-slate-700 whitespace-nowrap flex items-center gap-1.5">
          <GraduationCap :size="17" class="text-blue-600" />
          학년 선택:
        </label>
        <select
          id="grade-select"
          v-model="selectedGrade"
          class="text-sm font-bold text-slate-900 bg-slate-50 hover:bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer shadow-2xs"
          style="min-width: 170px;"
        >
          <option value="ALL">전체 학년 ({{ classes.length }}개 학급)</option>
          <option :value="3">3학년 ({{ gradeCounts[3] || 0 }}개 학급)</option>
          <option :value="2">2학년 ({{ gradeCounts[2] || 0 }}개 학급)</option>
          <option :value="1">1학년 ({{ gradeCounts[1] || 0 }}개 학급)</option>
          <option :value="0">졸업생 ({{ gradeCounts[0] || 0 }}개)</option>
        </select>
      </div>

      <!-- 2. 빠른 원클릭 탭 버튼 -->
      <div class="flex items-center gap-1.5 flex-wrap">
        <button
          v-for="opt in gradeOptions"
          :key="opt.value"
          @click="selectedGrade = opt.value"
          class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
          :class="selectedGrade === opt.value
            ? 'bg-blue-600 text-white shadow-xs font-bold'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/60'"
        >
          <span>{{ opt.label }}</span>
          <span
            class="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
            :class="selectedGrade === opt.value ? 'bg-blue-700/80 text-white' : 'bg-white text-slate-600 border border-slate-200'"
          >
            {{ opt.count }}
          </span>
        </button>
      </div>
    </div>

    <!-- 학급 추가 폼 -->
    <Transition name="fade">
      <div
        v-if="showAddForm"
        class="mb-6 rounded-xl border border-blue-200 bg-gradient-to-b from-blue-50/40 to-white shadow-sm p-5 sm:p-6"
      >
        <div class="flex items-center justify-between mb-4 pb-3 border-b border-blue-100">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <Plus :size="16" />
            </div>
            <h3 class="text-base font-bold text-slate-900 m-0">새 학급 및 담임교사 등록</h3>
          </div>
          <span class="text-xs text-slate-500 font-medium">
            * 등록 시 해당 담임교사의 시스템 로그인 계정이 즉시 자동 생성됩니다.
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <!-- 학년 선택 -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5">대상 학년</label>
            <select
              v-model.number="newGrade"
              @change="onNewGradeChange"
              class="w-full text-sm font-semibold bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option :value="3">3학년</option>
              <option :value="2">2학년</option>
              <option :value="1">1학년</option>
              <option :value="0">졸업생</option>
            </select>
          </div>

          <!-- 반 선택 -->
          <div v-if="newGrade !== 0">
            <label class="block text-xs font-bold text-slate-700 mb-1.5">
              학급 (반) <span class="text-blue-600 font-normal">(추천: {{ suggestedClassNo }}반)</span>
            </label>
            <div class="relative">
              <input
                v-model.number="newClassNo"
                type="number"
                min="1"
                max="99"
                class="w-full text-sm font-semibold bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="반 번호 입력"
              />
              <span class="absolute right-3 top-2 text-xs text-slate-400 font-bold">반</span>
            </div>
          </div>
          <div v-else>
            <label class="block text-xs font-bold text-slate-700 mb-1.5">학급 (반)</label>
            <input
              type="text"
              value="졸업생 관리반"
              disabled
              readonly
              class="w-full text-sm font-bold bg-slate-100 text-slate-500 border border-slate-200 rounded-lg px-3 py-2 cursor-not-allowed"
            />
          </div>

          <!-- 담임교사 성함 -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5">담임교사 성함</label>
            <input
              v-model="newTeacherName"
              type="text"
              class="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 홍길동"
            />
          </div>

          <!-- 초기 비밀번호 -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5">
              로그인 비밀번호 <span class="text-rose-500 font-normal">(4자 이상)</span>
            </label>
            <input
              v-model="newPassword"
              type="password"
              class="w-full text-sm bg-white border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              :class="newPassword && newPassword.length < 4 ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'"
              placeholder="초기 접속 비밀번호"
            />
          </div>
        </div>

        <!-- 계정 생성 정보 미리보기 알림 -->
        <div class="bg-blue-100/60 border border-blue-200 rounded-lg p-3 mb-4 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div class="flex items-center gap-2 text-blue-950 font-medium">
            <span class="font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-300 shadow-2xs font-mono">
              teacher_{{ newGrade }}_{{ newGrade === 0 ? 0 : (newClassNo || 1) }}
            </span>
            <span>아이디로 담임 계정이 생성됩니다. (로그인 시 학년/반 선택 후 비밀번호 입력)</span>
          </div>
          <span v-if="newPassword && newPassword.length < 4" class="text-rose-600 font-bold">
            ⚠️ 비밀번호는 4글자 이상 입력해주세요.
          </span>
        </div>

        <div class="flex gap-2 justify-end items-center">
          <button
            class="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
            @click="cancelAdd"
          >
            취소
          </button>
          <button
            class="text-xs font-bold px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs disabled:opacity-40 transition-colors flex items-center gap-1.5"
            :disabled="saving || (newPassword && newPassword.length < 4)"
            @click="addRow"
          >
            <Check :size="14" /> {{ saving ? '등록 중…' : '학급 등록 완료' }}
          </button>
        </div>
      </div>
    </Transition>

    <div v-if="error" class="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
      <span>{{ error }}</span>
      <button @click="error = ''" class="text-rose-500 hover:text-rose-700 font-bold bg-transparent border-none cursor-pointer">✕</button>
    </div>

    <!-- 학급 테이블 -->
    <div
      class="rounded-xl overflow-hidden bg-white border border-slate-200 shadow-xs"
    >
      <div class="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <School :size="16" class="text-slate-600" />
          <h2 class="text-sm font-bold text-slate-800 m-0">
            {{ selectedGradeLabel }} 학급 목록
          </h2>
          <span class="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
            총 {{ displayedClasses.length }}개 학급
          </span>
        </div>
        <span class="text-xs text-slate-500">
          * 학급을 삭제하면 해당 담임교사의 접속 계정도 함께 삭제됩니다.
        </span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-left text-sm" style="table-layout: fixed;">
          <colgroup>
            <col style="width: 14%;">
            <col style="width: 14%;">
            <col style="width: 20%;">
            <col style="width: 28%;">
            <col style="width: 24%;">
          </colgroup>
          <thead>
            <tr class="bg-slate-100/80 border-b border-slate-200 text-xs font-bold text-slate-600">
              <th class="px-5 py-3">학년</th>
              <th class="px-5 py-3">반</th>
              <th class="px-5 py-3">담임교사 성함</th>
              <th class="px-5 py-3">교사 로그인 ID</th>
              <th class="px-5 py-3 text-right">관리</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <template v-for="row in displayedClasses" :key="`${row.grade}-${row.class_no}`">
              <!-- 일반 보기 행 -->
              <tr
                v-if="editing?.grade !== row.grade || editing?.class_no !== row.class_no"
                class="hover:bg-slate-50/80 transition-colors"
              >
                <!-- 학년 배지 -->
                <td class="px-5 py-3.5 whitespace-nowrap">
                  <span
                    class="inline-flex items-center px-2.5 py-0.8 rounded-md text-xs font-bold border"
                    :class="getGradeBadgeClass(row.grade)"
                  >
                    {{ formatGradeName(row.grade) }}
                  </span>
                </td>

                <!-- 반 -->
                <td class="px-5 py-3.5 whitespace-nowrap font-bold text-slate-900">
                  {{ (!row.class_no || Number(row.class_no) === 0) ? '졸업생' : `${row.class_no}반` }}
                </td>

                <!-- 담임교사 성함 -->
                <td class="px-5 py-3.5 whitespace-nowrap text-slate-800 font-medium">
                  <div class="flex items-center gap-1.5">
                    <User :size="14" class="text-slate-400" />
                    <span>{{ row.teacher_name || '담임교사' }}</span>
                  </div>
                </td>

                <!-- 로그인 ID -->
                <td class="px-5 py-3.5 whitespace-nowrap">
                  <span class="font-mono text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200">
                    teacher_{{ row.grade }}_{{ row.class_no }}
                  </span>
                </td>

                <!-- 관리 액션 -->
                <td class="px-5 py-3.5 whitespace-nowrap text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      class="px-2.5 py-1 text-xs font-semibold rounded-md text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 bg-white cursor-pointer transition-colors"
                      :disabled="saving"
                      @click="startEdit(row)"
                    >
                      편집
                    </button>
                    <button
                      class="px-2.5 py-1 text-xs font-semibold rounded-md text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 bg-white cursor-pointer transition-colors"
                      :disabled="saving"
                      @click="remove(row)"
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>

              <!-- 인라인 편집 행 -->
              <tr v-else class="bg-blue-50/50 border-y border-blue-200">
                <td class="px-5 py-3 whitespace-nowrap">
                  <span
                    class="inline-flex items-center px-2.5 py-0.8 rounded-md text-xs font-bold border"
                    :class="getGradeBadgeClass(row.grade)"
                  >
                    {{ formatGradeName(row.grade) }}
                  </span>
                </td>
                <td class="px-5 py-3 whitespace-nowrap font-bold text-slate-900">
                  {{ (!row.class_no || Number(row.class_no) === 0) ? '졸업생' : `${row.class_no}반` }}
                </td>
                <td class="px-5 py-3 whitespace-nowrap">
                  <input
                    v-model="editTeacherName"
                    type="text"
                    class="text-xs bg-white border border-blue-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 w-32"
                    placeholder="담임 성함"
                  />
                </td>
                <td class="px-5 py-3 whitespace-nowrap">
                  <input
                    v-model="editPassword"
                    type="password"
                    placeholder="새 비밀번호 (변경시만)"
                    class="text-xs bg-white border border-blue-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 w-44"
                  />
                </td>
                <td class="px-5 py-3 whitespace-nowrap text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <button
                      class="px-3 py-1.5 text-xs font-bold rounded-md bg-blue-600 text-white hover:bg-blue-700 border-none cursor-pointer shadow-2xs transition-colors"
                      :disabled="saving"
                      @click="saveEdit(row)"
                    >
                      {{ saving ? '저장 중…' : '저장' }}
                    </button>
                    <button
                      class="px-3 py-1.5 text-xs font-semibold rounded-md bg-white text-slate-600 hover:bg-slate-100 border border-slate-300 cursor-pointer transition-colors"
                      :disabled="saving"
                      @click="editing = null"
                    >
                      취소
                    </button>
                  </div>
                </td>
              </tr>
            </template>

            <!-- 학급이 없을 때 -->
            <tr v-if="displayedClasses.length === 0">
              <td colspan="5" class="px-5 py-12 text-center text-slate-400">
                <School :size="32" class="mx-auto mb-2 text-slate-300" />
                <p class="text-sm font-semibold mb-1 text-slate-600">
                  {{ selectedGrade === 'ALL' ? '등록된 학급이 없습니다.' : `${selectedGradeLabel}에 등록된 학급이 없습니다.` }}
                </p>
                <p class="text-xs text-slate-400">
                  우측 상단의 '+ 새 학급 추가' 버튼을 눌러 학급을 등록하세요.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import * as XLSX from 'xlsx'
import { getClasses, upsertClass, deleteClass } from '../../api/admin.js'
import HelpBox from '../common/HelpBox.vue'
import { dialog } from '../common/dialog.js'
import {
  School,
  Plus,
  FileSpreadsheet,
  GraduationCap,
  Check,
  User
} from 'lucide-vue-next'

const HELP = {
  title: '도움말 — 학급 현황 및 담임교사 계정 설정',
  intro: '1·2·3학년 및 졸업생 학급을 관리하는 메뉴입니다. 학급을 등록하면 해당 학급의 담임교사가 로그인할 수 있는 계정이 자동으로 생성됩니다.',
  items: [
    '상단의 "학년 선택 드롭다운" 또는 학년별 탭을 클릭하여 각 학년별 학급 목록을 분리하여 조회하고 관리할 수 있습니다.',
    '"+ 새 학급 추가" 버튼을 눌러 대상 학년, 반 번호, 담임교사 성함, 초기 비밀번호를 입력하여 신규 학급을 생성합니다.',
    '담임교사는 로그인 화면에서 본인의 학년과 반을 선택하고 설정된 비밀번호를 입력해 시스템에 로그인합니다.',
    { text: '학급을 삭제하면 해당 학급 담임교사의 접속 계정도 함께 삭제되므로 주의하세요.', warn: true },
  ],
}

// ── 상태 ──────────────────────────────────────────────────────
const classes = ref([])
const error = ref('')
const saving = ref(false)

// 학년 필터 (ALL, 3, 2, 1, 0)
const selectedGrade = ref('ALL')

// 인라인 편집 상태
const editing = ref(null)
const editTeacherName = ref('')
const editPassword = ref('')

// 신규 학급 추가 상태
const showAddForm = ref(false)
const newGrade = ref(3)
const newClassNo = ref(1)
const newTeacherName = ref('')
const newPassword = ref('')

// ── 학년별 통계 & 필터 계산 ──────────────────────────────────
const gradeCounts = computed(() => {
  const counts = { 3: 0, 2: 0, 1: 0, 0: 0 }
  for (const c of classes.value) {
    const g = Number(c.grade) || 0
    if (counts[g] !== undefined) {
      counts[g]++
    }
  }
  return counts
})

const gradeOptions = computed(() => [
  { value: 'ALL', label: '전체', count: classes.value.length },
  { value: 3, label: '3학년', count: gradeCounts.value[3] || 0 },
  { value: 2, label: '2학년', count: gradeCounts.value[2] || 0 },
  { value: 1, label: '1학년', count: gradeCounts.value[1] || 0 },
  { value: 0, label: '졸업생', count: gradeCounts.value[0] || 0 },
])

const selectedGradeLabel = computed(() => {
  if (selectedGrade.value === 'ALL') return '전체 학년'
  if (selectedGrade.value === 0) return '졸업생'
  return `${selectedGrade.value}학년`
})

// 학년별 필터링 및 정렬된 학급 목록
const displayedClasses = computed(() => {
  let list = [...classes.value]
  if (selectedGrade.value !== 'ALL') {
    const targetG = Number(selectedGrade.value)
    list = list.filter(c => (Number(c.grade) || 0) === targetG)
  }

  // 정렬: 학년 내림차순 (3 -> 2 -> 1 -> 0) 후 반 오름차순 (1, 2, 3...)
  return list.sort((a, b) => {
    const ga = Number(a.grade) || 0
    const gb = Number(b.grade) || 0
    if (ga !== gb) return gb - ga // 3학년 우선
    const ca = Number(a.class_no) || 0
    const cb = Number(b.class_no) || 0
    return ca - cb
  })
})

// 다음 추천 반 번호 계산 (newGrade 기준 max + 1)
const suggestedClassNo = computed(() => {
  if (newGrade.value === 0) return 0
  const sameGradeClasses = classes.value.filter(c => Number(c.grade) === Number(newGrade.value))
  if (sameGradeClasses.length === 0) return 1
  const maxNo = Math.max(...sameGradeClasses.map(c => Number(c.class_no) || 0))
  return maxNo + 1
})

function formatGradeName(grade) {
  const g = Number(grade) || 0
  if (g === 0) return '졸업생'
  return `${g}학년`
}

function getGradeBadgeClass(grade) {
  const g = Number(grade) || 0
  if (g === 3) return 'bg-blue-50 text-blue-700 border-blue-200'
  if (g === 2) return 'bg-indigo-50 text-indigo-700 border-indigo-200'
  if (g === 1) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  return 'bg-slate-100 text-slate-700 border-slate-300'
}

// ── 데이터 로드 ──────────────────────────────────────────────
async function load() {
  try {
    classes.value = await getClasses()
  } catch (e) {
    error.value = e.response?.data ?? e.message
  }
}

// ── 학급 추가 폼 제어 ────────────────────────────────────────
function openAddForm() {
  // 현재 선택된 학년 필터를 기본값으로 반영
  if (selectedGrade.value !== 'ALL') {
    newGrade.value = Number(selectedGrade.value)
  } else {
    newGrade.value = 3
  }
  onNewGradeChange()
  newTeacherName.value = ''
  newPassword.value = ''
  error.value = ''
  showAddForm.value = true
}

function onNewGradeChange() {
  if (newGrade.value === 0) {
    newClassNo.value = 0
  } else {
    newClassNo.value = suggestedClassNo.value
  }
}

function cancelAdd() {
  showAddForm.value = false
  newGrade.value = 3
  newClassNo.value = 1
  newTeacherName.value = ''
  newPassword.value = ''
  error.value = ''
}

async function addRow() {
  if (newGrade.value == null || newClassNo.value == null) {
    error.value = '학년과 반을 올바르게 입력해주세요.'
    return
  }
  if (!newPassword.value || newPassword.value.length < 4) {
    error.value = '비밀번호를 4글자 이상 설정해야 합니다.'
    return
  }

  // 중복 확인
  const isDuplicate = classes.value.some(
    c => Number(c.grade) === Number(newGrade.value) && Number(c.class_no) === Number(newClassNo.value)
  )
  if (isDuplicate) {
    const label = newGrade.value === 0 ? '졸업생' : `${newGrade.value}학년 ${newClassNo.value}반`
    const confirm = await dialog.confirm({
      title: '학급 중복 확인',
      message: `이미 등록된 ${label}입니다. 정보를 덮어쓰시겠습니까?`,
      confirmText: '덮어쓰기',
      level: 'warning'
    })
    if (!confirm) return
  }

  const body = {
    teacher_name: (newTeacherName.value || '').trim() || (newGrade.value === 0 ? '졸업생 담당' : `${newGrade.value}학년 ${newClassNo.value}반 담임`),
    password: newPassword.value.trim()
  }

  saving.value = true
  error.value = ''
  try {
    await upsertClass(newGrade.value, newClassNo.value, body)
    cancelAdd()
    await load()
    await dialog.alert({ title: '성공', message: '학급 및 담임교사 계정이 정상 등록되었습니다.' })
  } catch (e) {
    error.value = e.response?.data ?? e.message
  } finally {
    saving.value = false
  }
}

// ── 인라인 편집 ──────────────────────────────────────────────
function startEdit(row) {
  editing.value = { grade: row.grade, class_no: row.class_no }
  editTeacherName.value = row.teacher_name ?? ''
  editPassword.value = ''
}

async function saveEdit(row) {
  const teacherNameInput = editTeacherName.value.trim()
  if (!teacherNameInput) {
    error.value = '담임명을 입력해주세요.'
    return
  }
  saving.value = true
  error.value = ''
  try {
    await upsertClass(row.grade, row.class_no, {
      teacher_name: teacherNameInput,
      password: editPassword.value.trim() || undefined
    })
    editing.value = null
    await load()
  } catch (e) {
    error.value = e.response?.data ?? e.message
  } finally {
    saving.value = false
  }
}

// ── 학급 삭제 ────────────────────────────────────────────────
async function remove(row) {
  const label = (!row.grade || Number(row.grade) === 0) ? '졸업생 관리반' : `${row.grade}학년 ${row.class_no}반`
  if (!(await dialog.confirm({
    title: '학급 삭제',
    message: `${label}을 삭제하시겠습니까?\n해당 학급의 담임교사 로그인 계정도 함께 삭제됩니다.`,
    confirmText: '삭제',
    level: 'danger',
    dangerNotice: '삭제된 학급과 교사 계정 정보는 복구할 수 없습니다.',
    finalConfirmText: '영구 삭제',
  }))) return

  saving.value = true
  error.value = ''
  try {
    await deleteClass(row.grade, row.class_no)
    await load()
  } catch (e) {
    error.value = e.response?.data ?? e.message
  } finally {
    saving.value = false
  }
}

// ── 엑셀 다운로드 (XLSX) ────────────────────────────────────
function dlExport() {
  try {
    const listToExport = displayedClasses.value.length > 0 ? displayedClasses.value : classes.value
    const exportData = listToExport.map(r => ({
      '학년': formatGradeName(r.grade),
      '반': (!r.class_no || Number(r.class_no) === 0) ? '졸업생' : `${r.class_no}반`,
      '담임교사 성함': r.teacher_name || '담임교사',
      '교사 로그인 ID': `teacher_${r.grade}_${r.class_no}`,
      '시스템 등록 이메일': `teacher_${r.grade}_${r.class_no}@ggomrecommend.ggomcode`
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '학급현황')

    const gradeSuffix = selectedGrade.value === 'ALL'
      ? '전체학년'
      : (selectedGrade.value === 0 ? '졸업생' : `${selectedGrade.value}학년`)
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    XLSX.writeFile(wb, `학급현황_${gradeSuffix}_${today}.xlsx`)
  } catch (e) {
    error.value = '엑셀 내보내기 중 오류가 발생했습니다: ' + e.message
  }
}

onMounted(load)
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
