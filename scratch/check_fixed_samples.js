import fs from 'fs';
import * as XLSX from 'xlsx';

const buf = fs.readFileSync('scratch/2027_수시_대학별_수능최저_정규화목록.xlsx');
const wb = XLSX.read(buf, { type: 'buffer' });
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

['경희대', '동국대', '성균관대', '전남대'].forEach(univ => {
  console.log(`\n=== ${univ} ===`);
  const filtered = rows.filter(r => (r['대학명(캠퍼스)']||'').includes(univ));
  filtered.forEach(r => {
    console.log(`[${r['전형']}|${r['세부전형']}|${r['세세부전형']}] (${r['학부 또는 학과']}) => ${r['수능최저학력기준']}`);
  });
});
