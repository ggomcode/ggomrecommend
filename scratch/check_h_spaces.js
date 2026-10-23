import fs from 'fs';
import * as XLSX from 'xlsx';

const buf = fs.readFileSync('scratch/2027_수시_대학별_수능최저_정규화목록.xlsx');
const wb = XLSX.read(buf, { type: 'buffer' });
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

let spaceCount = 0;
rows.forEach((r, idx) => {
  const dept = String(r['학부 또는 학과'] || '');
  if (/\s/.test(dept)) {
    spaceCount++;
    console.log(`[연번 ${r['연번']}] Space found in dept: "${dept}"`);
  }
});

console.log('Total depts with spaces:', spaceCount);
