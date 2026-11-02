import fs from 'fs';

function replaceWithCRLF(code, oldStr, newStr) {
  if (code.includes(oldStr)) return code.replace(oldStr, newStr);
  const oldCRLF = oldStr.replace(/\n/g, '\r\n');
  const newCRLF = newStr.replace(/\n/g, '\r\n');
  if (code.includes(oldCRLF)) return code.replace(oldCRLF, newCRLF);
  throw new Error(`Pattern not found: ${oldStr.slice(0, 50)}...`);
}

// ─── 1. Patch OverviewTab.vue ───
const overviewFile = 'src/components/admin/OverviewTab.vue';
let overviewCode = fs.readFileSync(overviewFile, 'utf-8');

// 1a. Import isRoundAnnouncedOrDone
if (!overviewCode.includes('isRoundAnnouncedOrDone')) {
  overviewCode = overviewCode.replace(
    "import { fetchRoundSchedulesMap, computeRoundDisplayStatus } from '../../utils/roundSchedule.js'",
    "import { fetchRoundSchedulesMap, computeRoundDisplayStatus, isRoundAnnouncedOrDone } from '../../utils/roundSchedule.js'"
  );
  console.log('✅ OverviewTab.vue: imported isRoundAnnouncedOrDone');
}

// 1b. Update tab buttons
const oldTabButtons = `          <!-- 다차수일 때 차수 선택 탭 버튼 -->
          <div v-if="totalRounds > 1" class="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 flex-wrap">
            <button
              v-for="rId in totalRounds"
              :key="rId"
              type="button"
              @click="handleSelectRound(rId)"
              class="px-3.5 py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer border-none flex items-center gap-1.5"
              :class="currentViewingRoundId === rId
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 bg-transparent'"
            >
              <span>{{ rId }}차 선발</span>
              <span
                class="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                :style="getRoundBadgeStyle(rId)"
              >
                {{ getRoundStatusText(rId) }}
              </span>
            </button>
          </div>`;

const newTabButtons = `          <!-- 다차수일 때 차수 선택 탭 버튼 (누적 합산 및 개별 차수) -->
          <div v-if="totalRounds > 1" class="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 flex-wrap">
            <button
              v-if="hasCompletedRounds"
              type="button"
              @click="handleSelectRound('cumulative')"
              class="px-3.5 py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer border-none flex items-center gap-1.5"
              :class="isViewingCumulative
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 bg-transparent'"
            >
              <span>{{ cumulativeTabTitle }}</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800">
                합산
              </span>
            </button>
            <button
              v-for="rId in totalRounds"
              :key="rId"
              type="button"
              @click="handleSelectRound(rId)"
              class="px-3.5 py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer border-none flex items-center gap-1.5"
              :class="(!isViewingCumulative && currentViewingRoundId === rId)
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 bg-transparent'"
            >
              <span>{{ rId }}차 선발</span>
              <span
                class="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                :style="getRoundBadgeStyle(rId)"
              >
                {{ getRoundStatusText(rId) }}
              </span>
            </button>
          </div>`;

overviewCode = replaceWithCRLF(overviewCode, oldTabButtons, newTabButtons);

// 1c. Update header title
const oldHeaderTitle = `          <span class="text-3xl font-bold" style="color: #1e293b;">
            {{ totalRounds === 1 ? '추천 선발' : \`\${data.round.id}차 추천 선발\` }}
          </span>`;

const newHeaderTitle = `          <span class="text-3xl font-bold" style="color: #1e293b;">
            {{ data.round.is_cumulative ? data.round.name : (totalRounds === 1 ? '추천 선발' : \`\${data.round.id}차 추천 선발\`) }}
          </span>`;

overviewCode = replaceWithCRLF(overviewCode, oldHeaderTitle, newHeaderTitle);

// 1d. Update SectionLabel title
const oldSectionTitle = `<SectionLabel :title="totalRounds === 1 ? '학급별 지원자 현황' : \`\${currentViewingRoundId}차 추천 선발 · 학급별 지원자 현황\`" />`;
const newSectionTitle = `<SectionLabel :title="data.round.is_cumulative ? \`\${data.round.name} · 학급별 지원자 현황\` : (totalRounds === 1 ? '학급별 지원자 현황' : \`\${currentViewingRoundId}차 추천 선발 · 학급별 지원자 현황\`)" />`;

overviewCode = replaceWithCRLF(overviewCode, oldSectionTitle, newSectionTitle);

// 1e. Add computed helpers in script
const oldComputedArea = `const schedulesMap = ref({})
const selectedRoundId = ref(null)
const overviewLoading = ref(false)

const currentViewingRoundId = computed(() => {
  if (selectedRoundId.value) return selectedRoundId.value
  return data.value?.round?.id || 1
})`;

const newComputedArea = `const schedulesMap = ref({})
const selectedRoundId = ref(null)
const overviewLoading = ref(false)

const hasCompletedRounds = computed(() => {
  return (data.value?.all_rounds || []).some(r => isRoundAnnouncedOrDone(r, schedulesMap.value[r.id]))
})

const completedRoundsCount = computed(() => {
  return (data.value?.all_rounds || []).filter(r => isRoundAnnouncedOrDone(r, schedulesMap.value[r.id])).length
})

const isViewingCumulative = computed(() => {
  if (selectedRoundId.value === 'cumulative' || selectedRoundId.value === 'all') return true
  if (data.value?.round?.is_cumulative) return true
  return false
})

const cumulativeTabTitle = computed(() => {
  const count = completedRoundsCount.value
  if (count >= totalRounds.value && totalRounds.value > 1) {
    return '전체 합산 (최종)'
  }
  if (count >= 2) {
    return \`누적 합산 (1~\${count}차)\`
  }
  return '1차 합산'
})

const currentViewingRoundId = computed(() => {
  if (selectedRoundId.value === 'cumulative' || selectedRoundId.value === 'all') return 'cumulative'
  if (selectedRoundId.value) return selectedRoundId.value
  if (data.value?.round?.is_cumulative) return 'cumulative'
  return data.value?.round?.id || 1
})`;

overviewCode = replaceWithCRLF(overviewCode, oldComputedArea, newComputedArea);

// 1f. Update effectiveRoundStatus to handle is_cumulative
const oldEffectiveStatus = `const effectiveRoundStatus = computed(() => {
  if (!data.value?.round) return 'DRAFT'
  const round = data.value.round
  const sched = schedulesMap.value[round.id]
  return computeRoundDisplayStatus(round, sched)
})`;

const newEffectiveStatus = `const effectiveRoundStatus = computed(() => {
  if (!data.value?.round) return 'DRAFT'
  if (data.value.round.is_cumulative) return 'FINALIZED'
  const round = data.value.round
  const sched = schedulesMap.value[round.id]
  return computeRoundDisplayStatus(round, sched)
})`;

overviewCode = replaceWithCRLF(overviewCode, oldEffectiveStatus, newEffectiveStatus);

// 1g. Update roundId in modal & print functions
overviewCode = overviewCode.replace(
  "const roundId = data.value?.round?.id\n\n    const studentParams = {",
  "const roundId = data.value?.round?.cumulative_round_ids || data.value?.round?.id\n\n    const studentParams = {"
);
overviewCode = overviewCode.replace(
  "const roundId = data.value?.round?.id\r\n\r\n    const studentParams = {",
  "const roundId = data.value?.round?.cumulative_round_ids || data.value?.round?.id\r\n\r\n    const studentParams = {"
);

overviewCode = overviewCode.replace(
  "const roundId = data.value?.round?.id\n    const [studentsRes, appsRes] = await Promise.all([",
  "const roundId = data.value?.round?.cumulative_round_ids || data.value?.round?.id\n    const [studentsRes, appsRes] = await Promise.all(["
);
overviewCode = overviewCode.replace(
  "const roundId = data.value?.round?.id\r\n    const [studentsRes, appsRes] = await Promise.all([",
  "const roundId = data.value?.round?.cumulative_round_ids || data.value?.round?.id\r\n    const [studentsRes, appsRes] = await Promise.all(["
);

fs.writeFileSync(overviewFile, overviewCode, 'utf-8');
console.log('✅ OverviewTab.vue updated successfully!');

// ─── 2. Patch ReportsTab.vue ───
const reportsFile = 'src/components/admin/ReportsTab.vue';
let reportsCode = fs.readFileSync(reportsFile, 'utf-8');

// 2a. Import isRoundAnnouncedOrDone
if (!reportsCode.includes('isRoundAnnouncedOrDone')) {
  reportsCode = reportsCode.replace(
    "import { fetchRoundSchedulesMap, DEFAULT_SCHEDULES, parseKstDate } from '../../utils/roundSchedule.js'",
    "import { fetchRoundSchedulesMap, DEFAULT_SCHEDULES, parseKstDate, isRoundAnnouncedOrDone } from '../../utils/roundSchedule.js'"
  );
  console.log('✅ ReportsTab.vue: imported isRoundAnnouncedOrDone');
}

// 2b. Update roundLabelText
const oldRoundLabelText = `const roundLabelText = computed(() => {
  if (selectedRoundFilter.value === 'all') return '(전체)'
  if (Number(selectedRoundFilter.value) === 0) return '(사전 선발)'
  return \`(\${selectedRoundFilter.value}차 선발)\`
})`;

const newRoundLabelText = `const roundLabelText = computed(() => {
  if (selectedRoundFilter.value === 'all') {
    const completedCount = (roundsList.value || []).filter(r => isRoundAnnouncedOrDone(r, schedulesMap.value[r.id])).length
    if (completedCount >= totalRounds.value && totalRounds.value > 1) {
      return \`(전체 \${totalRounds.value}차 합산)\`
    }
    if (completedCount >= 2) {
      return \`(1~\${completedCount}차 누적 합산)\`
    }
    return '(전체 합산)'
  }
  if (Number(selectedRoundFilter.value) === 0) return '(사전 선발)'
  return \`(\${selectedRoundFilter.value}차 선발)\`
})`;

reportsCode = replaceWithCRLF(reportsCode, oldRoundLabelText, newRoundLabelText);

// 2c. Update flatStats in ReportsTab.vue to filter by completed rounds when curRound === null
const oldFlatStatsTrackApps = `      // 현재 선택된 차수 기준 추천 대상 학생들
      let trackApps = []
      if (curRound === null || isNaN(curRound)) {
        trackApps = allTrackRecs
      } else {
        trackApps = allTrackRecs.filter(ap => {
          const r = ap.recommended_round ?? ap.round ?? 1
          return r === curRound
        })
      }`;

const newFlatStatsTrackApps = `      // 현재 완료된(선정결과 공지 시작 이후) 차수 목록
      const completedRoundIds = new Set(
        (roundsList.value || []).filter(r => isRoundAnnouncedOrDone(r, schedulesMap.value[r.id])).map(r => r.id)
      )

      // 현재 선택된 차수 기준 추천 대상 학생들
      let trackApps = []
      if (curRound === null || isNaN(curRound)) {
        // [합산 모드]:
        // 1,2차가 끝나고 3차 종료 전까지는 1차와 2차를 합산한 결과
        // 3차가 종료된 이후부터는 1,2,3차가 합산되어서 보여짐 (2027년 2월 28일까지 상시 유지)
        if (completedRoundIds.size > 0) {
          trackApps = allTrackRecs.filter(ap => {
            const r = ap.recommended_round ?? ap.round ?? 1
            return completedRoundIds.has(r)
          })
        } else {
          trackApps = allTrackRecs.filter(ap => (ap.recommended_round ?? ap.round ?? 1) === 1)
        }
      } else {
        trackApps = allTrackRecs.filter(ap => {
          const r = ap.recommended_round ?? ap.round ?? 1
          return r === curRound
        })
      }`;

reportsCode = replaceWithCRLF(reportsCode, oldFlatStatsTrackApps, newFlatStatsTrackApps);

fs.writeFileSync(reportsFile, reportsCode, 'utf-8');
console.log('✅ ReportsTab.vue updated successfully!');

