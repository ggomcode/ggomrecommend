import { buildReportsDataFromKcue } from '../src/utils/recommendationKcueAdapter.js';

const kcueData = buildReportsDataFromKcue();
const stats = kcueData.stats;
const allApplicantsMap = kcueData.allApplicantsMap;
const recommendedList = kcueData.recommendedList;
const studentMap = kcueData.studentMap;
const selectedRoundFilter = 'all';

const list = [];
const normKey = s => (s || '').trim().toLowerCase().replace(/\s+/g, '');
const curRound = selectedRoundFilter === 'all' ? null : Number(selectedRoundFilter);

for (const u of (stats || [])) {
  for (const t of (u.tracks || [])) {
    const allTrackApps = allApplicantsMap[t.track_id] || [];
    const allTrackRecs = recommendedList.filter(ap => ap.univ_id === t.track_id);
    const hasQuota = t.unit_quota != null;

    let prevUsedCount = 0;
    const remainingAfterPrev = hasQuota ? Math.max(0, t.unit_quota - prevUsedCount) : null;

    let trackApps = allTrackRecs;
    trackApps.sort((a, b) => {
      if (hasQuota) {
        if (a.rank !== b.rank) return a.rank - b.rank;
        return (a.student_code || '').localeCompare(b.student_code || '');
      } else {
        return (a.student_code || '').localeCompare(b.student_code || '');
      }
    });

    let enrolledCount = 0;
    let gradCount = 0;

    const studentsArray = trackApps.map(ap => {
      const stInfo = studentMap[ap.student_id] || {};
      const rawCode = String(ap.student_code || '').trim();
      const code5 = rawCode.length > 5 ? rawCode.slice(-5) : rawCode;
      const isGrad = stInfo.is_graduated || (!stInfo.grade && stInfo.grad_year);
      if (isGrad) gradCount++;
      else enrolledCount++;
      let displayCode = code5;
      if (isGrad && stInfo.grad_year) displayCode = `${code5}(${stInfo.grad_year})`;
      const appRound = ap.round != null ? ap.round : 1;
      const recRound = ap.recommended_round != null ? ap.recommended_round : 1;
      return {
        id: ap.id,
        student_id: ap.student_id,
        student_code: displayCode,
        name: ap.name,
        rank: ap.rank,
        score_text: ap.score_text,
        round: appRound,
        recommended_round: recRound,
        is_recommended: true,
        grade_type: isGrad ? '졸업생' : '재학생',
        department_name: ap.department_name
      };
    });

    list.push({
      univ_id: u.univ_id,
      univ_name: u.univ_name,
      track_id: t.track_id,
      track_name: t.track_name,
      students: studentsArray,
      used_count: studentsArray.length
    });
  }
}

console.log('FlatStats length:', list.length);
let totalCases = 0;
const totalSet = new Set();
for (const item of list) {
  for (const std of item.students) {
    totalCases++;
    totalSet.add(std.student_id);
  }
}
console.log('Total students:', totalSet.size);
console.log('Total cases:', totalCases);
