import fs from 'fs';
import * as XLSXModule from 'xlsx';
const XLSX = XLSXModule.default || XLSXModule;

const buf = fs.readFileSync('scratch/2027_수시_대학별_수능최저_정규화목록.xlsx');
const wb = XLSX.read(buf, { type: 'buffer' });
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);
const rawRows = JSON.parse(fs.readFileSync('scratch/raw_rows.json', 'utf-8'));

const colMeta = {
  3: '교과100', 4: '교과+학생부', 5: '교과+면접',
  6: '학종 면접형', 7: '학종 서류형',
  8: '논술+학생부', 9: '논술100'
};

console.log('=== Checking all numbered cells (1), 2) etc.) across all universities ===');

for (let r = 1; r < rawRows.length; r++) {
  const row = rawRows[r];
  const univ = String(row[2] || '').trim().replace(/[\r\n\s]+/g, ' ');
  for (let c = 3; c <= 9; c++) {
    const val = String(row[c] || '').trim();
    if (!val || val === 'Ⅹ' || val === 'X' || val === 'x' || val === '-') continue;

    if (/[1-9]\s*[\).]/i.test(val)) {
      const matched = data.filter(d => d['대학명(캠퍼스)'] === univ && d['세부전형'] === colMeta[c]);
      console.log(`\n[${univ}] (Row ${r+1}, Col ${c}: ${colMeta[c]}) => Output Rows: ${matched.length}`);
      matched.forEach(m => {
        console.log(`   [${m['세세부전형']}] Dept: ${m['학부 또는 학과']} => Score: ${m['수능최저학력기준']}`);
      });
    }
  }
}
