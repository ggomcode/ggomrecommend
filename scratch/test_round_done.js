import { DEFAULT_SCHEDULES, normalizeSchedule, parseKstDate } from '../src/utils/roundSchedule.js';

function isRoundAnnouncedOrDone(round, rawSchedule) {
  if (!round) return false;
  if (round.status === 'FINALIZED' || round.status === 'CLOSED') return true;
  const schedule = normalizeSchedule(rawSchedule);
  if (!schedule) return round.status === 'FINALIZED' || round.status === 'CLOSED';

  const now = new Date();
  // 선정결과 공지 시작일 (announce_start 또는 announce_date)
  const announceStartDt = parseKstDate(schedule.announce_start || schedule.announce_date, false);
  if (announceStartDt && now >= announceStartDt) {
    return true;
  }

  // 심사/협의 종료일 (eval_end 또는 eval_date)
  const evalEndDt = parseKstDate(schedule.eval_end || schedule.eval_date, true);
  if (evalEndDt && now > evalEndDt) {
    return true;
  }

  return false;
}

console.log('Testing schedules with today = 2026-11-02:');
for (let r = 1; r <= 3; r++) {
  const sched = DEFAULT_SCHEDULES[r];
  const roundObj = { id: r, status: 'OPEN' }; // pretend status not updated in DB
  const isDone = isRoundAnnouncedOrDone(roundObj, sched);
  console.log(`Round ${r}: isAnnouncedOrDone =`, isDone, 'announce_start =', sched?.announce_start);
}

