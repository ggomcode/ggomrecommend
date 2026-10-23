import fs from 'fs';
import * as XLSX from 'xlsx';

const buf = fs.readFileSync('scratch/2027_수시_대학별_수능최저_정규화목록.xlsx');
const wb = XLSX.read(buf, { type: 'buffer' });
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

console.log('Total Rows to Audit:', rows.length);

const issues = [];

rows.forEach((r, idx) => {
  const rowNum = idx + 2; // Excel row
  const univ = r['대학명(캠퍼스)'] || '';
  const broad = r['전형'] || '';
  const detail = r['세부전형'] || '';
  const subDetail = r['세세부전형'] || '';
  const dept = r['학부 또는 학과'] || '';
  const minScore = r['수능최저학력기준'] || '';

  // 1. 학과명에 최저기준 문구가 섞여 들어간 경우
  if (/합\s*[0-9]|등급|국,수|최저없음|미적분|기하/.test(dept)) {
    issues.push({ rowNum, univ, type: 'DEPT_CONTAINS_SCORE', dept, minScore, subDetail });
  }

  // 2. 최저기준에 학과명 대괄호가 그대로 남아있거나 끝이 콜론으로 끝나는 경우
  if (/:\s*$/.test(minScore)) {
    issues.push({ rowNum, univ, type: 'SCORE_ENDS_WITH_COLON', dept, minScore, subDetail });
  }

  // 3. 최저기준이 비어있거나 너무 짧은 경우 (예: '1)', '2)')
  if (minScore.length <= 2 || /^[0-9]+[)）]$/.test(minScore)) {
    issues.push({ rowNum, univ, type: 'SCORE_TOO_SHORT_OR_NUMBER', dept, minScore, subDetail });
  }

  // 4. 세세부전형에 최저기준 문구가 들어간 경우 (단, 종합1, 종합2 등 전형명 제외)
  const subDetailScoreCheck = subDetail.replace(/종합\s*[0-9]+/g, '');
  if (/합\s*[0-9]|등급|최저없음/.test(subDetailScoreCheck)) {
    issues.push({ rowNum, univ, type: 'SUBDETAIL_CONTAINS_SCORE', dept, minScore, subDetail });
  }


  // 5. 학과명에 괄호나 특수문자가 비정상적으로 남은 경우
  if (/^[)）:]/.test(dept) || /^[)）:]/.test(minScore)) {
    issues.push({ rowNum, univ, type: 'LEADING_BRACKET_OR_COLON', dept, minScore, subDetail });
  }
});

console.log('Found Issues Count:', issues.length);
if (issues.length > 0) {
  console.log('\n--- Details of Issues ---');
  issues.forEach((iss, i) => {
    console.log(`[${i+1}] Row ${iss.rowNum} (${iss.univ}) Type: ${iss.type}`);
    console.log(`    세세부: "${iss.subDetail}" | 학과: "${iss.dept}" | 최저: "${iss.minScore}"`);
  });
} else {
  console.log('No issues found! Clean and consistent across all 94 universities.');
}
