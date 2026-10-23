import fs from 'fs';
import * as XLSXModule from 'xlsx';
const XLSX = XLSXModule.default || XLSXModule;

const buf = fs.readFileSync('scratch/2027_수시_대학별_수능최저_정규화목록.xlsx');
const wb = XLSX.read(buf, { type: 'buffer' });
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);
const rawRows = JSON.parse(fs.readFileSync('scratch/raw_rows.json', 'utf-8'));

console.log('=== FULL AUDIT OF ALL 94 UNIVERSITIES ===\n');

// 1. Check for broken Score fields
console.log('--- 1. Incomplete or Malformed Scores ---');
data.forEach(r => {
  const s = String(r['수능최저학력기준'] || '').trim();
  const d = String(r['학부 또는 학과'] || '').trim();
  const univ = r['대학명(캠퍼스)'];
  
  // ends with '중' or '포함' or '합' without number or ':'
  if (/중$/.test(s) || /포함$/.test(s) || /[:;,]$/.test(s) || s === '최저' || s.length <= 2) {
    console.log(`[Broken Score] ${univ} | Dept: ${d} | Score: "${s}"`);
  }
  // contains brackets like [xxx] in score
  if (/\[.*\]/.test(s)) {
    console.log(`[Brackets in Score] ${univ} | Dept: ${d} | Score: "${s}"`);
  }
  // contains multiple grades like '3합 5' AND '3합 6'
  const sumMatches = s.match(/\d+합\s*\d+/g);
  if (sumMatches && new Set(sumMatches).size > 1) {
    console.log(`[Multiple Sums in Score] ${univ} | Dept: ${d} | Score: "${s}"`);
  }
});

// 2. Check for recruitment numbers in Dept or Score (e.g. (20명))
console.log('\n--- 2. Numbers like (XX명) in Dept or Score ---');
data.forEach(r => {
  const s = String(r['수능최저학력기준'] || '').trim();
  const d = String(r['학부 또는 학과'] || '').trim();
  const univ = r['대학명(캠퍼스)'];
  if (/\d+명/.test(d) || /\d+명/.test(s)) {
    console.log(`[Recruitment numbers] ${univ} | Dept: ${d} | Score: "${s}"`);
  }
});

// 3. Check for Dept containing '전체' or '일반' when raw cell had multiple departments
console.log('\n--- 3. Cells where raw had department splits but result has 전체/일반 ---');
const colMeta = {
  3: '교과100', 4: '교과+학생부', 5: '교과+면접',
  6: '학종 면접형', 7: '학종 서류형',
  8: '논술+학생부', 9: '논술100'
};

for (let r = 1; r < rawRows.length; r++) {
  const row = rawRows[r];
  const univ = String(row[2] || '').trim().replace(/[\r\n\s]+/g, ' ');
  for (let c = 3; c <= 9; c++) {
    const val = String(row[c] || '').trim();
    if (!val || val === 'Ⅹ' || val === 'X' || val === 'x' || val === '-') continue;

    // Check if raw val had department indicators like [의예], 의예:, 의/치 등
    const hasDeptIndicator = /\[[^\]]+\]/.test(val) || /(?:의예|약학|간호|의학|치의|한의|수의|사범|공과|자연|인문)\s*:/i.test(val);
    
    // Find corresponding rows in normalized data
    const matched = data.filter(d => d['대학명(캠퍼스)'] === univ && d['세부전형'] === colMeta[c]);
    
    // If raw cell clearly had multiple branches (e.g. 2+ colons or multiple brackets)
    const colonCount = (val.match(/:/g) || []).length;
    const bracketCount = (val.match(/\[[^\]]+\]/g) || []).length;

    if ((colonCount >= 2 || bracketCount >= 2) && matched.length === 1 && (matched[0]['학부 또는 학과'] === '전체' || matched[0]['학부 또는 학과'] === '일반')) {
      console.log(`[Unsplit Complex Cell] ${univ} (R${r+1} C${c} ${colMeta[c]}) -> matched only 1 row (${matched[0]['학부 또는 학과']}):\n  Raw: ${val.replace(/\n/g, ' ')}`);
    }
  }
}
