import fs from 'fs';
import * as XLSX from 'xlsx';

const buf = fs.readFileSync('scratch/2027_수시_대학별_수능최저_정규화목록.xlsx');
const wb = XLSX.read(buf, { type: 'buffer' });
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

const mixedRows = [];
rows.forEach((r, idx) => {
  const score = String(r['수능최저학력기준'] || '');
  // 최저기준에 [1-4]합 또는 등급 구문이 여러 개 섞여있는지 검사
  const hapMatches = score.match(/[1-4]\s*합\s*[0-9]+/g) || [];
  const colonMatches = score.match(/[-∙*•]?\s*[^:\n]+:\s*(?:국|수|영|탐|[0-9]합|최저)/g) || [];

  // 단, '또는 국,수 중 1개 2등급' 같은 한 학과의 대체 조건은 제외
  // 서로 다른 학과/조건이 콜론이나 하이픈으로 나열된 경우:
  const hasMultipleBranches = (score.includes('-') && (score.match(/:/g) || []).length >= 2) ||
    ((score.match(/[1-4]\s*합\s*[0-9]+/g) || []).length >= 2 && score.includes(':')) ||
    (score.includes('최저없음') && score.includes('합'));

  if (hasMultipleBranches) {
    mixedRows.push({
      rowNum: idx + 2,
      seq: r['연번'],
      univ: r['대학명(캠퍼스)'],
      broad: r['전형'],
      detail: r['세부전형'],
      subDetail: r['세세부전형'],
      dept: r['학부 또는 학과'],
      score
    });
  }
});

console.log('Mixed Rows Count:', mixedRows.length);
mixedRows.forEach(m => {
  console.log(`[연번 ${m.seq} (Excel ${m.rowNum})] ${m.univ} | ${m.broad} | ${m.detail} | ${m.subDetail} | 학과: "${m.dept}"`);
  console.log(`  Score: "${m.score}"\n`);
});
