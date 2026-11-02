import fs from 'fs';

const file = 'src/utils/roundSchedule.js';
let code = fs.readFileSync(file, 'utf-8');

const functionToAdd = `
/**
 * 각 차수가 완료(모집 및 심사가 끝나고 선정결과 공지 시작 이후)되었는지 여부 확인
 * 사용자의 정의: "기간이면, 선정결과 공지 기간 직전까지를 말하는거고, 각 차수의 모집이 끝나면 선정결과가 공지되는거야."
 * 즉, announce_start(공지 시작)에 도달했거나, eval_end(심사 종료)가 지났거나, 관리자가 CLOSED/FINALIZED로 마감한 경우 완료됨.
 */
export function isRoundAnnouncedOrDone(round, rawSchedule) {
  if (!round) return false
  if (round.status === 'FINALIZED' || round.status === 'CLOSED') return true
  const schedule = normalizeSchedule(rawSchedule)
  if (!schedule) return round.status === 'FINALIZED' || round.status === 'CLOSED'

  const now = new Date()
  // 1. 선정결과 공지 시작일 (announce_start 또는 announce_date) 도달 시
  const announceStartDt = parseKstDate(schedule.announce_start || schedule.announce_date, false)
  if (announceStartDt && now >= announceStartDt) {
    return true
  }

  // 2. 심사/협의 종료일 (eval_end 또는 eval_date) 경과 시
  const evalEndDt = parseKstDate(schedule.eval_end || schedule.eval_date, true)
  if (evalEndDt && now > evalEndDt) {
    return true
  }

  return false
}
`;

if (!code.includes('isRoundAnnouncedOrDone')) {
  code = code.trimEnd() + '\n' + functionToAdd;
  fs.writeFileSync(file, code, 'utf-8');
  console.log('✅ Added isRoundAnnouncedOrDone to src/utils/roundSchedule.js');
} else {
  console.log('⏭️ Already exists in src/utils/roundSchedule.js');
}

