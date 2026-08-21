<template>
  <div class="py-8 px-4 sm:px-10">

    <!-- 페이지 헤더 -->
    <div class="flex items-start justify-between flex-wrap gap-3 mb-5">
      <div>
        <p class="text-base mb-1" style="color: #94a3b8;">담임 교사</p>
        <h1 class="text-2xl font-semibold" style="color: #1e293b; margin: 0;">
          <template v-if="auth.grade === 'all'">전체 학생 현황 (3학년 + 졸업생)</template>
          <template v-else-if="Number(auth.grade) === 0">졸업생 학급 현황</template>
          <template v-else-if="!auth.classNo || Number(auth.classNo) === 0">{{ auth.grade }}학년 전체 학급 현황</template>
          <template v-else>{{ auth.grade }}학년 {{ auth.classNo }}반 학급 현황</template>
        </h1>
      </div>
      <span class="text-base font-semibold" style="color: #64748b;">총 {{ students.length }}명</span>
    </div>

    <HelpBox
      :key="helpBox.key"
      class="mb-5"
      :storage-key="helpBox.key"
      :title="helpBox.title"
      :intro="helpBox.intro"
      :items="helpBox.items"
    />

    <!-- 필터 탭 -->
    <div v-if="students.length > 0" class="flex items-center gap-2 mb-4 flex-wrap">
      <button
        class="px-4 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer border"
        :class="filterTab === 'all' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'"
        @click="filterTab = 'all'"
      >전체 <span class="text-xs opacity-90">({{ students.length }}명)</span></button>
      <button
        class="px-4 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer border"
        :class="filterTab === 'applied' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'"
        @click="filterTab = 'applied'"
      >지원학생 <span class="text-xs opacity-90">({{ appliedStudentsCount }}명)</span></button>
      <button
        class="px-4 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer border"
        :class="filterTab === 'unapplied' ? 'bg-slate-700 text-white border-slate-700 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'"
        @click="filterTab = 'unapplied'"
      >미지원학생 <span class="text-xs opacity-90">({{ unappliedStudentsCount }}명)</span></button>
    </div>

    <!-- 로드 오류 -->
    <div v-if="loadError" class="rounded-xl flex items-center justify-center"
      style="background: #fef2f2; box-shadow: 0 0 0 1px #fca5a5; height: 240px;">
      <p class="text-base" style="color: #991b1b;">학급 현황을 불러오지 못했습니다: {{ loadError }}</p>
    </div>

    <!-- 빈 상태 -->
    <div v-else-if="students.length === 0" class="rounded-xl flex items-center justify-center"
      style="background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04); height: 240px;">
      <p class="text-base" style="color: #94a3b8;">학생이 없습니다. 관리자에게 학생 데이터 등록을 요청하세요.</p>
    </div>

    <!-- 필터 결과 빈 상태 -->
    <div v-else-if="filteredStudents.length === 0" class="rounded-xl flex flex-col items-center justify-center"
      style="background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04); height: 200px;">
      <p class="text-base font-semibold" style="color: #64748b;">선택한 필터 조건에 해당하는 학생이 없습니다.</p>
    </div>

    <!-- 학생 테이블 -->
    <div v-else class="rounded-xl overflow-hidden"
      style="background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04);">
      <div class="overflow-x-auto">
        <table class="w-full" style="border-collapse: collapse; table-layout: fixed; min-width: 500px;">
          <colgroup>
            <col style="width: 70px;">
            <col style="width: 140px;">
            <col style="width: 130px;">
            <col>
          </colgroup>
          <thead>
            <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <th class="text-sm font-semibold text-center" style="padding: 14px 16px; color: #475569;">번호</th>
              <th class="text-sm font-semibold text-left" style="padding: 14px 16px; color: #475569;">학생코드</th>
              <th class="text-sm font-semibold text-left" style="padding: 14px 16px; color: #475569;">이름</th>
              <th class="text-sm font-semibold text-left" style="padding: 14px 16px; color: #475569;">지원 대학 및 전형</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(s, index) in filteredStudents"
              :key="s.id"
              class="hover:bg-slate-50/80 transition-colors border-b border-slate-100"
            >
              <td class="text-sm text-center font-bold text-slate-400" style="padding: 14px 16px;">{{ index + 1 }}</td>
              <td class="text-sm text-slate-500 font-mono" style="padding: 14px 16px;">{{ s.student_code }}</td>
              <td class="text-sm font-bold text-slate-800" style="padding: 14px 16px;">
                {{ s.name }}
                <span v-if="!s.is_enrolled" class="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded ml-1">졸업생</span>
              </td>
              <td style="padding: 14px 16px;">
                <div v-if="getStudentApps(s.id).length === 0" class="text-xs font-semibold text-slate-400">
                  미지원 (지원 내역 없음)
                </div>
                <div
                  v-for="(app, idx) in getStudentApps(s.id)"
                  :key="app.track_id"
                  class="flex items-center gap-2 mb-2 flex-wrap text-sm"
                >
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                    지원 {{ idx + 1 }}
                  </span>
                  <span
                    v-if="app.round_id || app.round"
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap"
                  >
                    {{ app.round_id || app.round }}차 지원
                  </span>
                  <span
                    class="font-medium"
                    :class="{ 'line-through opacity-50': app.abandoned || (!app.recommended && app.round_status === 'FINALIZED') }"
                    :style="{ color: (app.abandoned || (!app.recommended && app.round_status === 'FINALIZED')) ? '#94a3b8' : '#1e293b' }"
                  >
                    {{ app.univ_name }} — {{ app.track_name }}<template v-if="app.department_name"> {{ app.department_name }}</template>
                  </span>
                  <!-- 환산점수 배지 -->
                  <span
                    v-if="app.univ_calc_score != null"
                    class="text-xs font-semibold px-2 py-0.5 rounded border border-violet-200 bg-violet-50 text-violet-700 whitespace-nowrap"
                  >환산 {{ app.univ_calc_score }}점</span>
                  <span v-if="app.abandoned" class="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">({{ app.abandoned_round || app.round_id || app.round }}차 포기됨)</span>
                  <span v-else-if="app.recommended && app.round_status === 'FINALIZED'" class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{{ app.recommended_round || app.round_id || app.round }}차 추천 확정</span>
                  <span v-else-if="!app.recommended && app.round_status === 'FINALIZED'" class="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{{ app.round_id || app.round }}차 미선발</span>
                  <!-- 수정 버튼 -->
                  <button
                    v-if="currentRound && app.round_id === currentRound.id && !app.abandoned"
                    class="text-xs font-semibold px-2.5 py-0.5 rounded border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                    @click="openEditModal(app)"
                  >수정</button>
                  <!-- 취소 버튼 -->
                  <button
                    v-if="currentRound && app.round_id === currentRound.id && !app.abandoned"
                    class="text-xs font-semibold px-2.5 py-0.5 rounded border border-red-200 bg-white text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    @click="removeApplication(app)"
                  >취소</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- ── 수정 모달 ── -->
  <Teleport to="body">
    <div
      v-if="editModal.open"
      class="fixed inset-0 z-50 flex items-center justify-center"
      style="background: rgba(0,0,0,0.45);"
      @click.self="editModal.open = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full mx-4 overflow-hidden" style="max-width: 520px;">
        <!-- 헤더 -->
        <div class="flex items-center justify-between px-6 py-4" style="border-bottom: 1px solid #f1f5f9;">
          <div>
            <p class="text-xs font-semibold text-slate-400 mb-0.5">{{ editModal.studentName }}</p>
            <h3 class="text-base font-bold text-slate-800 m-0">지원 정보 수정</h3>
          </div>
          <button @click="editModal.open = false"
            class="text-slate-400 hover:text-slate-600 cursor-pointer"
            style="background: none; border: none; font-size: 20px; line-height: 1;">✕</button>
        </div>

        <!-- 본문 -->
        <div class="px-6 py-5 flex flex-col gap-5">
          <div class="rounded-lg px-4 py-3 text-sm text-blue-700" style="background: #eff6ff; border: 1px solid #bfdbfe;">
            지원 전형, 지원 학과, 대학별 환산점수를 수정할 수 있습니다.<br>
            저장 후 순위가 즉시 재산정됩니다.
          </div>

          <!-- 대학교 -->
          <div>
            <label class="block text-sm font-semibold text-slate-600 mb-1.5">대학교</label>
            <select v-model="editModal.selectedUnivName"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              @change="onEditUnivChange">
              <option value="">대학교 선택</option>
              <option v-for="u in editModal.univList" :key="u" :value="u">{{ u }}</option>
            </select>
          </div>

          <!-- 모집단위 -->
          <div>
            <label class="block text-sm font-semibold text-slate-600 mb-1.5">모집단위 (전형)</label>
            <select v-model="editModal.selectedTrackId"
              :disabled="!editModal.selectedUnivName || editModal.trackList.length === 0"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50">
              <option value="">전형 선택</option>
              <option v-for="t in editModal.trackList" :key="t.id" :value="String(t.id)">{{ t.track_name }}</option>
            </select>
          </div>

          <!-- 지원 학과 -->
          <div>
            <label class="block text-sm font-semibold text-slate-600 mb-1.5">지원 학과 <span class="text-slate-400 font-normal">(선택)</span></label>
            <input v-model="editModal.departmentName" type="text" placeholder="예) 컴퓨터공학과"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          <!-- 환산점수 -->
          <div>
            <label class="block text-sm font-semibold text-slate-600 mb-1.5">
              대학별 환산점수 <span class="text-slate-400 font-normal">(선택 — 입력 시 순위 산정에 우선 사용)</span>
            </label>
            <input v-model="editModal.univCalcScore" type="number" step="0.01" min="0" placeholder="예) 985.40"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <p class="text-xs text-slate-400 mt-1">비워두면 내신 석차등급으로 순위를 산정합니다.</p>
          </div>
        </div>

        <!-- 푸터 -->
        <div class="flex justify-end gap-3 px-6 py-4" style="border-top: 1px solid #f1f5f9;">
          <button @click="editModal.open = false"
            class="text-sm font-semibold px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer">취소</button>
          <button @click="saveEdit"
            :disabled="editModal.saving || !editModal.selectedTrackId"
            class="text-sm font-semibold px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
            {{ editModal.saving ? '저장 중…' : '저장' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useAuthStore } from '../../stores/auth.js'
import { dialog } from '../common/dialog.js'
import { isUndecidedDepartment } from '../../utils/departmentValidation.js'
import HelpBox from '../common/HelpBox.vue'
import {
  getCurrentRound,
  teacherGetStudents,
  teacherGetApplications,
  teacherDeleteApplication,
  teacherUpdateApplication,
  teacherGetUniversities,
  teacherGetUnivTracks,
} from '../../api/teacher.js'

const auth = useAuthStore()

const currentRound = ref(null)
const students     = ref([])
const applications = ref([])
const loadError    = ref('')

const filterTab = ref('all')

const appliedStudentsCount = computed(() =>
  students.value.filter(s => getStudentApps(s.id).length > 0).length
)
const unappliedStudentsCount = computed(() =>
  students.value.filter(s => getStudentApps(s.id).length === 0).length
)
const filteredStudents = computed(() => {
  if (filterTab.value === 'applied')   return students.value.filter(s => getStudentApps(s.id).length > 0)
  if (filterTab.value === 'unapplied') return students.value.filter(s => getStudentApps(s.id).length === 0)
  return students.value
})

const helpBox = computed(() => {
  if (students.value.length === 0) {
    return {
      key: 'class-empty',
      title: '도움말 — 학생 명단이 비어 있습니다',
      intro: '학생 명단은 관리자가 일괄 등록합니다. 이 화면에서는 추가할 수 없습니다.',
      items: [
        '담당 학급의 학생이 보이지 않으면 관리자(학교장추천 담당 교사)에게 명단 등록을 요청하세요.',
        '명단이 등록되면 이 화면에 학생과 지원 현황이 표시됩니다.',
      ],
    }
  }
  return {
    key: 'class-main',
    title: '도움말 — 우리 반 지원 현황 보기',
    intro: '담당 학급 학생과 각자의 지원 대학·모집단위를 한눈에 확인하는 화면입니다.',
    items: [
      '상단 필터 탭(전체/지원학생/미지원학생)을 클릭하여 원하는 대상 학생만 조회가 가능합니다.',
      '학생별로 복수의 대학에 지원한 경우 [지원 1], [지원 2] 순번 배지로 구분되어 표시됩니다.',
      '"수정" 버튼으로 지원 전형·학과·대학별 환산점수를 수정할 수 있습니다. (현재 진행 중인 차수에만 표시)',
      '"취소" 버튼은 현재 진행 중인 차수의 지원에만 나타납니다.',
      '가로줄이 그어진 지원은 학생이 포기했거나 마감 결과 미선발된 것입니다.',
    ],
  }
})

function getStudentApps(studentId) {
  return applications.value.filter(a => a.student_id === studentId)
}

async function loadAll() {
  loadError.value = ''
  try {
    const [round, sts, apps] = await Promise.all([
      getCurrentRound(),
      teacherGetStudents(),
      teacherGetApplications(),
    ])
    currentRound.value = round
    students.value = sts
    applications.value = apps
  } catch (e) {
    currentRound.value = null
    students.value = []
    applications.value = []
    loadError.value = e.response?.data ?? e.message ?? '오류가 발생했습니다'
  }
}

async function removeApplication(app) {
  if (!(await dialog.confirm({
    title: '지원 취소',
    message: `${app.name} 학생의 ${app.univ_name} ${app.track_name} 지원을 취소하시겠습니까?\n차수가 진행 중인 동안에는 다시 등록할 수 있습니다.`,
    confirmText: '지원 취소',
    level: 'warn',
  }))) return
  try {
    await teacherDeleteApplication(app.student_id, app.track_id, app.round_id)
    applications.value = await teacherGetApplications()
  } catch (e) {
    await dialog.alert({ title: '오류', message: e.response?.data || e.message, level: 'error' })
  }
}

// ── 수정 모달 ──────────────────────────────────────────
const editModal = reactive({
  open: false,
  saving: false,
  appId: null,
  studentName: '',
  univList: [],
  selectedUnivName: '',
  trackList: [],
  selectedTrackId: '',
  departmentName: '',
  univCalcScore: '',
})

async function openEditModal(app) {
  const univs = await teacherGetUniversities()
  editModal.univList = univs.map(u => u.univ_name)

  editModal.appId            = app.id
  editModal.studentName      = `${app.name} 학생`
  editModal.departmentName   = app.department_name || ''
  editModal.univCalcScore    = app.univ_calc_score != null ? String(app.univ_calc_score) : ''
  editModal.selectedUnivName = app.univ_name || ''
  editModal.selectedTrackId  = String(app.track_id || '')

  if (editModal.selectedUnivName) {
    editModal.trackList = await teacherGetUnivTracks(editModal.selectedUnivName)
  } else {
    editModal.trackList = []
  }

  editModal.open = true
}

async function onEditUnivChange() {
  editModal.selectedTrackId = ''
  editModal.trackList = []
  if (!editModal.selectedUnivName) return
  const tracks = await teacherGetUnivTracks(editModal.selectedUnivName)
  editModal.trackList = tracks
  if (tracks.length === 1) editModal.selectedTrackId = String(tracks[0].id)
}

async function saveEdit() {
  if (!editModal.selectedTrackId) return

  let finalDept = editModal.departmentName?.trim() || ''
  if (isUndecidedDepartment(finalDept)) {
    const inputDisplay = finalDept ? `"${finalDept}"` : '미입력(공백)'
    const proceed = await dialog.confirm({
      title: '지원 학과(모집단위) 미지정 확인',
      message: `지원 모집단위(학과/학부)가 명확히 지정되지 않았습니다.\n(입력값: ${inputDisplay})\n\n정확한 추천 선발 및 심사를 위해 학과명을 입력하는 것을 권장합니다.\n\n학과를 미지정한 상태("-" 처리)로 저장하시겠습니까?`,
      confirmText: '미지정("-"로 저장)',
      cancelText: '학과 다시 입력하기',
      level: 'warn',
    })

    if (!proceed) return
    finalDept = '-'
  }

  editModal.saving = true
  try {
    await teacherUpdateApplication(editModal.appId, {
      univ_id:         Number(editModal.selectedTrackId),
      department_name: finalDept,
      univ_calc_score: editModal.univCalcScore !== '' ? Number(editModal.univCalcScore) : '',
    })
    editModal.open = false
    applications.value = await teacherGetApplications()
  } catch (e) {
    await dialog.alert({ title: '저장 오류', message: e.response?.data || e.message, level: 'error' })
  } finally {
    editModal.saving = false
  }
}

onMounted(loadAll)
</script>
