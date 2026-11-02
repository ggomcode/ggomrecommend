import fs from 'fs';

// 1. Patch src/api/admin.js
const adminFile = 'src/api/admin.js';
let adminCode = fs.readFileSync(adminFile, 'utf-8');

// Ensure isRoundAnnouncedOrDone is imported
if (!adminCode.includes('isRoundAnnouncedOrDone')) {
  adminCode = adminCode.replace(
    "import { fetchRoundSchedulesMap, computeRoundDisplayStatus } from '../utils/roundSchedule'",
    "import { fetchRoundSchedulesMap, computeRoundDisplayStatus, isRoundAnnouncedOrDone } from '../utils/roundSchedule'"
  );
  console.log('✅ admin.js: imported isRoundAnnouncedOrDone');
}

// Replace getOverview logic
const targetOverviewStart = `  let round = null
  if (targetRoundId != null) {
    const found = roundsList.find(r => r.id === Number(targetRoundId))
    if (found) {
      round = found
    } else {
      const { data: dbRound } = await supabase.from('timeline_rounds').select('*').eq('id', Number(targetRoundId)).maybeSingle()
      round = dbRound
    }
  } else {
    round = await getCurrentRound()
    // 만약 getCurrentRound()로 선택된 라운드에 지원서가 없고, 다른 라운드에 지원서가 있다면 데이터가 있는 라운드를 우선 선택
    if (round && allApps.length > 0 && !allApps.some(a => a.round === round.id)) {
      const roundWithApps = roundsList.find(r => allApps.some(a => a.round === r.id))
      if (roundWithApps) {
        round = roundWithApps
      }
    }
  }

  const studentCount = studentCountRes.count || 0
  const teachers = teachersRes.data || []
  const totalRounds = roundsList.length

  // [2] 현재 조회 대상 라운드의 지원서와 재학생 매핑 정보를 조회
  const appCountByUniv = new Map()
  const appCountByClass = new Map()
  const gradApplicantsSet = new Set()

  if (round) {
    const [appsRes, studentsRes] = await Promise.all([
      supabase.from('applications').select('univ_id, student_id').eq('round', round.id),
      supabase.from('enrolled_students').select('id, grade, class_no, is_enrolled')
    ])`;

const newOverviewLogic = `  // [차수 완료 판정] 각 차수의 모집 및 심사가 끝나고 선정결과 공지 시작 이후이거나 CLOSED/FINALIZED로 마감된 차수
  const completedRounds = roundsList.filter(r => isRoundAnnouncedOrDone(r, schedulesMap[r.id]))
  const completedRoundIds = completedRounds.map(r => r.id)
  const isAllRoundsCompleted = roundsList.length > 0 && completedRoundIds.length >= roundsList.length

  let round = null
  let targetRoundIds = []
  let isCumulative = false

  // 1) 특정 단일 차수를 명시적으로 요청한 경우 (예: 1차, 2차, 3차 탭 클릭)
  if (targetRoundId != null && targetRoundId !== 'all' && targetRoundId !== 'cumulative') {
    const found = roundsList.find(r => r.id === Number(targetRoundId))
    if (found) {
      round = found
    } else {
      const { data: dbRound } = await supabase.from('timeline_rounds').select('*').eq('id', Number(targetRoundId)).maybeSingle()
      round = dbRound
    }
    targetRoundIds = [Number(targetRoundId)]
    isCumulative = false
  } else {
    // 2) 기본 진입(null) 또는 합산 요청('cumulative' / 'all'):
    //    - 1,2차가 끝나고 3차 종료 전까지는 1차와 2차를 합산한 결과 표출
    //    - 3차가 종료된 이후부터는 1,2,3차가 합산되어서 표출 (2027년 2월 28일까지 상시 유지)
    //    - 1차만 끝났으면 1차 결과 표출
    //    - 아직 아무 차수도 안 끝났으면 현재 진행 중인 차수 표출
    if (completedRoundIds.length > 0) {
      targetRoundIds = [...completedRoundIds]
      isCumulative = targetRoundIds.length > 1 || isAllRoundsCompleted
      const lastCompletedId = targetRoundIds[targetRoundIds.length - 1]
      round = {
        id: isAllRoundsCompleted ? 'all' : (targetRoundIds.length > 1 ? 'cumulative' : lastCompletedId),
        display_id: isAllRoundsCompleted ? 'all' : (targetRoundIds.length > 1 ? 'cumulative' : lastCompletedId),
        is_cumulative: isCumulative,
        cumulative_round_ids: targetRoundIds,
        name: isAllRoundsCompleted
          ? \`전체 추천 선발 최종 확정 (\${targetRoundIds.map(id => id + '차').join(', ')} 합산)\`
          : (targetRoundIds.length > 1
              ? \`\${targetRoundIds.map(id => id + '차').join('·')} 누적 추천 선발 결과\`
              : \`\${lastCompletedId}차 추천 선발 결과\`),
        status: 'FINALIZED',
        opened_at: roundsList[0]?.opened_at,
        closed_at: roundsList[lastCompletedId - 1]?.closed_at
      }
    } else {
      round = await getCurrentRound()
      targetRoundIds = round ? [round.id] : [1]
      isCumulative = false
    }
  }

  const studentCount = studentCountRes.count || 0
  const teachers = teachersRes.data || []
  const totalRounds = roundsList.length

  // [2] 현재 조회 대상 라운드(들)의 지원서와 재학생 매핑 정보를 조회 (합산 차수 다중 조회 지원)
  const appCountByUniv = new Map()
  const appCountByClass = new Map()
  const gradApplicantsSet = new Set()

  if (targetRoundIds.length > 0) {
    let appQuery = supabase.from('applications').select('univ_id, student_id, round, is_recommended, is_abandoned')
    if (targetRoundIds.length === 1) {
      appQuery = appQuery.eq('round', targetRoundIds[0])
    } else {
      appQuery = appQuery.in('round', targetRoundIds)
    }

    const [appsRes, studentsRes] = await Promise.all([
      appQuery,
      supabase.from('enrolled_students').select('id, grade, class_no, is_enrolled')
    ])`;

function replaceWithCRLF(code, oldStr, newStr) {
  if (code.includes(oldStr)) return code.replace(oldStr, newStr);
  const oldCRLF = oldStr.replace(/\n/g, '\r\n');
  const newCRLF = newStr.replace(/\n/g, '\r\n');
  if (code.includes(oldCRLF)) return code.replace(oldCRLF, newCRLF);
  throw new Error('Pattern not found');
}

adminCode = replaceWithCRLF(adminCode, targetOverviewStart, newOverviewLogic);

// Update priorConfirmedByTrack in admin.js to check !isCumulative
const oldPriorCode = `  const priorConfirmedByTrack = new Map()

  if (round && round.id > 1) {`;

const newPriorCode = `  const priorConfirmedByTrack = new Map()

  if (!isCumulative && round && round.id > 1) {`;

adminCode = replaceWithCRLF(adminCode, oldPriorCode, newPriorCode);

// Update getApplications to support array or 'all'/'cumulative'
const oldGetAppsQuery = `export const getApplications = async (roundId, trackId) => {
  if (!supabase) return []

  // 1. 지원서 조회
  let query = supabase
    .from('applications')
    .select('*, universities:univ_id(*)')
    .eq('round', roundId)`;

const newGetAppsQuery = `export const getApplications = async (roundId, trackId) => {
  if (!supabase) return []

  // 1. 지원서 조회 (배열, 'all', 'cumulative', 단일 숫자 모두 지원)
  let query = supabase
    .from('applications')
    .select('*, universities:univ_id(*)')

  if (Array.isArray(roundId)) {
    query = query.in('round', roundId)
  } else if (roundId === 'all' || roundId === 'cumulative' || String(roundId).startsWith('cumulative_')) {
    // 누적 합산 조회: 전체 조회
  } else if (roundId !== null && roundId !== undefined && roundId !== '') {
    query = query.eq('round', Number(roundId))
  }`;

adminCode = replaceWithCRLF(adminCode, oldGetAppsQuery, newGetAppsQuery);

fs.writeFileSync(adminFile, adminCode, 'utf-8');
console.log('✅ admin.js updated successfully!');

