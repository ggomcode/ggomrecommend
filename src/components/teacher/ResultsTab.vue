<template>
  <div class="py-8 px-4 sm:px-10">

    <!-- 페이지 헤더 -->
    <div class="mb-5">
      <p class="text-base mb-1" style="color: #94a3b8;">담임 교사</p>
      <h1 class="text-2xl font-semibold" style="color: #1e293b; margin: 0;">추천 결과</h1>
    </div>

    <HelpBox
      v-if="!loading && !loadError"
      :key="helpBox.key"
      class="mb-5"
      :storage-key="helpBox.key"
      :title="helpBox.title"
      :intro="helpBox.intro"
      :items="helpBox.items"
    />

    <!-- 로딩 -->
    <div
      v-if="loading"
      class="rounded-xl flex items-center justify-center"
      style="background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04); height: 240px;"
    >
      <p class="text-base" style="color: #94a3b8;">불러오는 중...</p>
    </div>

    <!-- 로드 오류 -->
    <div
      v-else-if="loadError"
      class="rounded-xl flex items-center justify-center"
      style="background: #fef2f2; box-shadow: 0 0 0 1px #fca5a5; height: 240px;"
    >
      <p class="text-base" style="color: #991b1b;">결과를 불러오지 못했습니다: {{ loadError }}</p>
    </div>

    <!-- 빈 상태 -->
    <div
      v-else-if="rounds.length === 0"
      class="rounded-xl flex items-center justify-center"
      style="background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04); height: 240px;"
    >
      <p class="text-base" style="color: #94a3b8;">아직 개설된 선발 차수가 없습니다.</p>
    </div>

    <!-- 차수별 결과 카드 -->
    <div v-else class="flex flex-col gap-6">
      <div
        v-for="round in rounds"
        :key="round.id"
        class="rounded-xl overflow-hidden"
        style="background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04);"
      >
        <!-- 카드 헤더 -->
        <div class="flex items-center gap-3 px-6 py-4" style="border-bottom: 1px solid #f1f5f9;">
          <h2 class="text-base font-semibold" style="color: #1e293b; margin: 0;">
            <template v-if="auth.grade === 0">졸업생 — {{ round.id }}차 결과</template>
            <template v-else>3학년 {{ auth.classNo ? auth.classNo + '반' : '전체 학급' }} — {{ round.id }}차 결과</template>
          </h2>
          <span
            class="text-xs font-bold px-3 py-1 rounded-full border bg-slate-100 text-slate-700 border-slate-200"
            :class="{
              'bg-emerald-50 text-emerald-700 border-emerald-200': round.status === 'FINALIZED',
              'bg-amber-50 text-amber-700 border-amber-200': round.status === 'CLOSED',
              'bg-blue-50 text-blue-700 border-blue-200': round.status === 'OPEN',
            }"
          >
            {{ roundStatusLabel(round.status) }}
          </span>

          <button
            v-if="round.status === 'FINALIZED'"
            @click="printReport(round.id)"
            class="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg px-2.5 py-1 ml-auto cursor-pointer"
          >
            🖨️ 결과 보고서 출력 (7컬럼)
          </button>
        </div>

        <!-- DRAFT (접수 전) 안내 -->
        <div v-if="round.status === 'DRAFT'" class="flex items-center justify-center text-center px-4" style="height: 120px;">
          <p class="text-base" style="color: #64748b;">📅 아직 학생 지원서 접수가 시작되지 않은 차수입니다. (희망자 접수 기간: {{ formatPeriod(round.schedule) }})</p>
        </div>

        <!-- OPEN / CLOSED / FINALIZED 지원 현황 및 결과 -->
        <template v-else>
          <!-- OPEN 안내 띠 -->
          <div v-if="round.status === 'OPEN'" class="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
            <span class="text-base">📝</span>
            <span class="text-sm font-medium text-blue-700">현재 학생 지원서 접수가 진행 중입니다. (마감 전 실시간 지원 현황입니다)</span>
          </div>
          <!-- CLOSED 안내 띠 -->
          <div v-else-if="round.status === 'CLOSED'" class="px-6 py-3 bg-orange-50 border-b border-orange-100 flex items-center gap-2">
            <span class="text-base">⏳</span>
            <span class="text-sm font-medium text-orange-700">접수가 마감되어 관리자가 선발 및 심사를 진행하고 있습니다.</span>
          </div>

          <!-- 지원 학생 목록이 없는 경우 -->
          <div v-if="!studentsByRound[round.id] || studentsByRound[round.id].length === 0" class="flex items-center justify-center py-10" style="height: 120px;">
            <p class="text-base" style="color: #94a3b8;">
              {{ round.status === 'OPEN' ? '📝 아직 등록된 지원서가 없습니다.' : round.status === 'CLOSED' ? '⏳ 등록된 지원서 없이 마감되었습니다.' : '등록된 지원 결과가 없습니다.' }}
            </p>
          </div>

          <!-- 지원 학생 목록이 있는 경우 -->
          <template v-else>
            <div
              v-for="student in studentsByRound[round.id]"
              :key="student.student_id"
              style="border-bottom: 1px solid #f1f5f9;"
            >
              <!-- 학생 행 헤더 -->
              <div class="flex items-center gap-3 px-6 py-3" style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <span class="text-base font-semibold" style="color: #1e293b;">{{ student.name }}</span>
                <span class="text-base" style="color: #64748b;">{{ student.student_code }}</span>
                <span v-if="auth.grade !== 0" class="text-base" style="color: #94a3b8;">{{ student.seq_no }}번</span>
              </div>

              <!-- 결과 테이블 -->
              <div class="overflow-x-auto">
                <table style="border-collapse: collapse; table-layout: fixed; width: 100%; min-width: 940px;">
                  <colgroup>
                    <col style="width: 150px;">
                    <col style="width: 190px;">
                    <col style="width: 150px;">
                    <col style="width: 110px;">
                    <col style="width: 180px;">
                    <col style="width: 100px;">
                    <col style="width: 110px;">
                  </colgroup>
                  <thead>
                    <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                      <th class="text-base font-semibold text-left" style="padding: 12px 20px; color: #475569;">대학명</th>
                      <th class="text-base font-semibold text-left" style="padding: 12px 16px; color: #475569;">모집단위 (전형)</th>
                      <th class="text-base font-semibold text-left" style="padding: 12px 16px; color: #475569;">지원 학과</th>
                      <th class="text-base font-semibold text-center" style="padding: 12px 16px; color: #475569;">지원 순위 (석차)</th>
                      <th class="text-base font-semibold text-left" style="padding: 12px 20px; color: #475569;">총점 (석차등급/환산점수)</th>
                      <th class="text-base font-semibold text-center" style="padding: 12px 16px; color: #475569;">상태</th>
                      <th class="text-base font-semibold text-center" style="padding: 12px 16px; color: #475569;">추천 포기</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="r in student.results"
                      :key="r.track_id"
                      :style="{
                        borderBottom: '1px solid #f1f5f9',
                        background:
                          r.abandoned ? '#fef2f2' :
                          isAbandonRequested(r) ? '#fff1f2' :
                          r.recommended && !r.abandoned ? '#f0fdf4' :
                          tieSet.has(`${r.student_id}-${r.track_id}-${round.id}`) ? '#fffbeb' :
                          round.status === 'FINALIZED' ? '#fff1f2' : 'white',
                      }"
                    >
                      <td class="text-base" style="padding: 12px 20px; color: #1e293b;">{{ r.univ_name }}</td>
                      <td class="text-base" style="padding: 12px 16px; color: #1e293b;">{{ r.track_name }}</td>
                      <td class="text-base" style="padding: 12px 16px; color: #475569;">{{ r.department_name }}</td>
                      <td class="text-base text-center font-bold" style="padding: 12px 16px; color: #1e293b;">
                        {{ r.ranking ?? '-' }}위
                      </td>
                      <td class="text-base text-left font-semibold" style="padding: 12px 20px; color: #1e293b;">
                        {{ r.score_text || formatScore(r.total_score) }}
                      </td>
                      <td class="text-center" style="padding: 12px 16px;">
                        <span v-if="r.abandoned" class="text-base font-semibold" style="color: #ef4444;">포기됨</span>
                        <span v-else-if="isAbandonRequested(r)" class="text-base font-semibold text-rose-500" style="color: #f43f5e;">포기 신청중</span>
                        <span v-else-if="r.recommended" class="text-base font-semibold" style="color: #16a34a;">추천 확정</span>
                        <span v-else-if="round.status === 'FINALIZED'" class="text-base font-semibold" style="color: #ef4444;">미선발</span>
                        <span v-else class="text-base font-semibold" style="color: #2563eb;">접수 완료</span>
                      </td>
                      <td class="text-center" style="padding: 12px 16px;">
                        <button
                          v-if="r.abandoned"
                          class="text-sm font-semibold rounded-lg whitespace-nowrap shadow-xs hover:bg-rose-100 transition-colors"
                          style="padding: 5px 12px; border: 1px solid #fda4af; background: #fff1f2; color: #e11d48; cursor: pointer;"
                          @click="handlePrintAbandon(r)"
                          title="포기원 서류 인쇄"
                        >📄 포기원 인쇄</button>
                        <button
                          v-else-if="isAbandonRequested(r)"
                          class="text-base font-semibold rounded-lg whitespace-nowrap"
                          style="padding: 5px 12px; border: none; background: #e11d48; color: white; cursor: pointer;"
                          @click="handleApproveAbandon(r)"
                        >포기 승인</button>
                        <button
                          v-else-if="r.recommended && !r.abandoned"
                          class="text-base whitespace-nowrap"
                          style="padding: 6px 12px; border: 1px solid #fca5a5; border-radius: 6px; background: white; color: #ef4444; cursor: pointer;"
                          @click="handleAbandon(r)"
                        >추천 포기</button>
                        <span v-else class="text-slate-400 text-sm">-</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth.js'
import { teacherGetResults, teacherAbandonApplication } from '../../api/teacher.js'
import { promoteNextEligibleStudent } from '../../api/admin.js'
import { roundStatusLabel } from '../../data/roundStatus.js'
import { printRoundsReport, printAbandonmentForm } from '../../utils/printTemplates.js'
import { dialog } from '../common/dialog.js'
import HelpBox from '../common/HelpBox.vue'
import { formatScore } from '../../utils/scorePreviewShared.js'
import { formatKoreanDateTimePeriod } from '../../utils/roundSchedule.js'

const auth = useAuthStore()

const rounds    = ref([])
const results   = ref([])
const loading   = ref(false)
const loadError = ref('')

function formatPeriod(sched) {
  if (!sched || (!sched.apply_start && !sched.apply_end)) return '접수 기간 미선택'
  return formatKoreanDateTimePeriod(sched.apply_start, sched.apply_end)
}

function isAbandonRequested(r) {
  if (r.abandoned || r.is_abandoned) return false
  if (!r.scanned_doc_url) return false
  try {
    const parsed = typeof r.scanned_doc_url === 'string' ? JSON.parse(r.scanned_doc_url) : r.scanned_doc_url
    return parsed && parsed.abandon_requested === true
  } catch {}
  return false
}

const hasFinalized = computed(() => rounds.value.some(r => r.status === 'FINALIZED'))

const helpBox = computed(() => {
  if (hasFinalized.value) {
    return {
      key: 'results-final',
      title: '도움말 — 결과 보는 방법',
      intro: '마감된 차수의 우리 반 학생 결과입니다.',
      items: [
        '초록색 배경의 "추천 확정"은 학교장추천 대상으로 확정된 것이고, 붉은색 배경의 "미선발"은 이번 차수에서 추천되지 않은 것입니다.',
        '추천이 확정된 학생이 추천을 포기하려면 "추천 포기"를 누르세요.',
        { text: '포기는 되돌릴 수 없습니다. 반드시 학생·학부모와 확인한 뒤 처리하세요. 다시 추천받으려면 다음 차수에서 재지원해야 합니다.', warn: true },
        '"미선발"된 학생은 다음 차수가 열리면 다시 지원할 수 있습니다.',
      ],
    }
  }
  if (rounds.value.length === 0) {
    return {
      key: 'results-none',
      title: '도움말 — 결과는 마감 후 공개됩니다',
      intro: '아직 차수가 개설되지 않았습니다.',
      items: [
        '관리자가 차수를 개설하면 지원자 등록이 시작되고, 마감되면 이 화면에 우리 반 학생들의 순위·총점·추천 여부가 표시됩니다.',
      ],
    }
  }
  return {
    key: 'results-waiting',
    title: '도움말 — 지원 현황 및 결과 안내',
    intro: '우리 반 학생들의 지원 현황을 실시간으로 확인할 수 있습니다.',
    items: [
      '"접수 진행중": 학생이 지원서를 제출하는 기간입니다. 제출된 지원서를 실시간으로 조회할 수 있습니다.',
      '"심사 진행중": 접수가 마감되어 관리자가 선발 처리를 진행 중입니다. 지원 현황은 계속 확인할 수 있습니다.',
      { text: '순위·총점·추천 여부(추천 확정/미선발)는 관리자가 "최종 마감" 처리를 완료한 후에 확정되어 표시됩니다.', warn: true },
    ],
  }
})

const tieSet = computed(() => {
  const set = new Set()
  const counts = {}
  for (const r of results.value) {
    if (r.ranking == null) continue
    const k = `${r.track_id}-${r.round_id}-${r.ranking}`
    if (!counts[k]) counts[k] = []
    counts[k].push(r)
  }
  for (const rows of Object.values(counts)) {
    if (rows.length > 1) {
      for (const r of rows) set.add(`${r.student_id}-${r.track_id}-${r.round_id}`)
    }
  }
  return set
})

// round_id → { student_id → { ...student, results[] } } 구조
const studentsByRound = computed(() => {
  const map = {}
  for (const r of results.value) {
    if (!map[r.round_id]) map[r.round_id] = new Map()
    const studentMap = map[r.round_id]
    if (!studentMap.has(r.student_id)) {
      studentMap.set(r.student_id, {
        student_id:   r.student_id,
        name:         r.name,
        student_code: r.student_code,
        seq_no:       r.seq_no,
        results:      [],
      })
    }
    studentMap.get(r.student_id).results.push(r)
  }
  // Map → 정렬된 배열로 변환
  const out = {}
  for (const [roundId, studentMap] of Object.entries(map)) {
    out[roundId] = [...studentMap.values()].sort((a, b) =>
      auth.grade === 0
        ? (a.student_code || '').localeCompare(b.student_code || '')
        : (a.seq_no ?? 999) - (b.seq_no ?? 999)
    )
  }
  return out
})

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const data = await teacherGetResults()
    rounds.value  = data.rounds
    results.value = data.results
  } catch (e) {
    rounds.value  = []
    results.value = []
    loadError.value = e.response?.data ?? e.message ?? '오류가 발생했습니다'
  } finally {
    loading.value = false
  }
}

function printReport(roundId) {
  const roundResults = results.value.filter(r => r.round_id === roundId)
  printRoundsReport(roundId, roundResults)
}

async function handleAbandon(r) {
  if (!(await dialog.confirm({
    title: '추천 포기',
    message: `${r.name} 학생의 ${r.univ_name} ${r.track_name} 지원을 포기 처리하시겠습니까?`,
    confirmText: '포기 처리',
    level: 'danger',
    dangerNotice: '한 번 포기하면 다시 되돌릴 수 없습니다. 재추천을 희망하면 다음 차수에서 재지원해야 합니다.',
    finalConfirmText: '포기 확정',
  }))) return
  try {
    await teacherAbandonApplication(r.student_id, r.track_id, r.round_id)
    await load()
  } catch (e) {
    await dialog.alert({ title: '오류', message: e.response?.data || e.message, level: 'error' })
  }
}

async function handleApproveAbandon(r) {
  let docUrl = null
  if (r.scanned_doc_url) {
    try {
      const parsed = typeof r.scanned_doc_url === 'string' ? JSON.parse(r.scanned_doc_url) : r.scanned_doc_url
      if (parsed && parsed.doc_url) {
        docUrl = parsed.doc_url
      }
    } catch {}
  }

  if (!(await dialog.confirm({
    title: '추천 포기 승인',
    message: `${r.name} 학생의 ${r.univ_name} ${r.track_name} 추천 포기 신청을 승인하시겠습니까?`,
    confirmText: '포기 승인',
    level: 'danger',
    dangerNotice: '승인하면 해당 추천 기회가 취소되며 공석이 반환됩니다. 이 작업은 되돌릴 수 없습니다.',
    finalConfirmText: '승인 확정',
  }))) return

  try {
    await teacherAbandonApplication(r.student_id, r.track_id, r.round_id, docUrl)

    // 차순위 승계 처리 수행
    let successionMsg = ''
    try {
      const nextStudent = await promoteNextEligibleStudent(r.track_id, r.round_id)
      if (nextStudent) {
        successionMsg = `\n\n🎉 [차순위 승계 알림]\n- 대학: ${nextStudent.univ_name} ${nextStudent.track_name}\n- 차순위 후보인 ${nextStudent.name} (${nextStudent.student_code}) 학생이 새롭게 추천 후보명단에 자동 등록되었습니다.`
      }
    } catch (e) {
      console.warn('Succession error:', e)
    }

    await load()
    await dialog.alert({ title: '성공', message: '포기 처리가 완료되었습니다.' + successionMsg, level: 'success' })
  } catch (e) {
    await dialog.alert({ title: '오류', message: e.response?.data || e.message, level: 'error' })
  }
}

function handlePrintAbandon(r) {
  printAbandonmentForm(r)
}

onMounted(load)
</script>
