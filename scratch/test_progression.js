const DEFAULT_SCHEDULES = {
  1: {
    apply_start: '2026-08-19T09:00',
    apply_end: '2026-08-20T18:00',
    eval_start: '2026-08-21T09:00',
    eval_end: '2026-08-21T18:00',
    announce_start: '2026-08-24T09:00',
    announce_end: '2026-08-25T18:00'
  },
  2: {
    apply_start: '2026-08-26T09:00',
    apply_end: '2026-08-27T18:00',
    eval_start: '2026-08-28T09:00',
    eval_end: '2026-08-28T18:00',
    announce_start: '2026-08-31T09:00',
    announce_end: '2026-09-01T18:00'
  },
  3: {
    apply_start: '2026-09-02T09:00',
    apply_end: '2026-09-03T18:00',
    eval_start: '2026-09-04T09:00',
    eval_end: '2026-09-04T18:00',
    announce_start: '2026-09-04T09:00',
    announce_end: '2026-09-05T18:00'
  }
};

function parseKstDate(str, isEnd = false) {
  if (!str) return null;
  let s = String(str).trim().replace(' ', 'T');
  if (s.length === 10) s += isEnd ? 'T23:59:59' : 'T00:00:00';
  else if (s.length === 16) s += isEnd ? ':59' : ':00';
  if (!s.includes('+') && !s.includes('Z') && !s.endsWith('z')) s += '+09:00';
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function isRoundAnnouncedOrDone(round, schedule, fakeNow = null) {
  if (!round) return false;
  if (round.status === 'FINALIZED' || round.status === 'CLOSED') return true;
  if (!schedule) return round.status === 'FINALIZED' || round.status === 'CLOSED';

  const now = fakeNow || new Date();
  const announceStartDt = parseKstDate(schedule.announce_start || schedule.announce_date, false);
  if (announceStartDt && now >= announceStartDt) return true;

  const evalEndDt = parseKstDate(schedule.eval_end || schedule.eval_date, true);
  if (evalEndDt && now > evalEndDt) return true;

  return false;
}

// Test timeline progression:
const testDates = [
  { label: '1차 접수 중', date: new Date('2026-08-19T14:00:00+09:00') },
  { label: '1차 결과 공지 시작', date: new Date('2026-08-24T10:00:00+09:00') },
  { label: '2차 접수 중 (1차 종료 후)', date: new Date('2026-08-26T14:00:00+09:00') },
  { label: '2차 결과 공지 시작 (1,2차 종료 후)', date: new Date('2026-08-31T10:00:00+09:00') },
  { label: '3차 접수 중 (1,2차 종료 후, 3차 종료 전)', date: new Date('2026-09-02T14:00:00+09:00') },
  { label: '3차 결과 공지 시작 (1,2,3차 모두 종료)', date: new Date('2026-09-04T10:00:00+09:00') },
  { label: '2026년 11월 (3차 종료 후)', date: new Date('2026-11-02T15:00:00+09:00') },
  { label: '2027년 2월 28일 (대입 학년도 마지막 날)', date: new Date('2027-02-28T20:00:00+09:00') }
];

const rounds = [{ id: 1 }, { id: 2 }, { id: 3 }];

for (const t of testDates) {
  const completed = rounds.filter(r => isRoundAnnouncedOrDone(r, DEFAULT_SCHEDULES[r.id], t.date));
  const completedIds = completed.map(r => r.id);
  console.log(`[${t.label}] Completed rounds:`, completedIds.length > 0 ? completedIds.join(', ') : 'None',
    '-> Shown cumulative rounds:', completedIds.length > 0 ? completedIds.join(' + ') + '차' : '1차 진행중');
}

