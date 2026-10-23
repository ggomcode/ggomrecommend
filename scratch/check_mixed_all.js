import fs from 'fs';
import * as XLSX from 'xlsx';

const buf = fs.readFileSync('scratch/2027_수시_대학별_수능최저_정규화목록.xlsx');
const wb = XLSX.read(buf, { type: 'buffer' });
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

console.log('--- 전수 조사: 최저기준 셀 내부에 복수 조건/학과가 섞인 행 찾기 ---');

const suspicious = [];

rows.forEach((r, idx) => {
  const score = String(r['수능최저학력기준'] || '');
  const dept = String(r['학부 또는 학과'] || '');
  const univ = String(r['대학명(캠퍼스)'] || '');

  // 1. 최저기준 내부에 콜론(:)이 들어있고, 콜론 앞에 학과명 같은 단어가 있는 경우
  // 예: "의/치/한/약: 3합 4", "경찰행정: 2합 4", "-의과: 3합 5"
  const colonDeptMatch = score.match(/(?:^|\s|[-∙*•])([가-힣a-zA-Z0-9/()ㆍ]+):\s*(?:국|수|영|탐|[0-9]합|최저|[0-9]개)/g);
  
  // 2. [1-4]합 구문이 서로 다른 숫자로 2개 이상 들어있는 경우 (예: 2합 5와 3합 4)
  const haps = (score.match(/[1-4]\s*합\s*[0-9]+/g) || []).map(h => h.replace(/\s+/g, ''));
  const uniqueHaps = [...new Set(haps)];

  if (colonDeptMatch && colonDeptMatch.length >= 1) {
    suspicious.push({
      idx: idx + 1,
      univ,
      broad: r['전형'],
      detail: r['세부전형'],
      subDetail: r['세세부전형'],
      dept,
      reason: 'COLON_DEPT_IN_SCORE',
      matches: colonDeptMatch,
      score
    });
  } else if (uniqueHaps.length >= 2 && !score.includes('또는') && !score.includes('택')) {
    suspicious.push({
      idx: idx + 1,
      univ,
      broad: r['전형'],
      detail: r['세부전형'],
      subDetail: r['세세부전형'],
      dept,
      reason: 'MULTIPLE_DIFFERENT_HAPS',
      uniqueHaps,
      score
    });
  }
});

console.log('Suspicious Rows Count:', suspicious.length);
suspicious.forEach(s => {
  console.log(`[연번 ${s.idx}] ${s.univ} | ${s.broad}/${s.detail}/${s.subDetail} | 학과: "${s.dept}"`);
  console.log(`  Reason: ${s.reason} (${s.matches || s.uniqueHaps})`);
  console.log(`  Score: "${s.score}"\n`);
});
