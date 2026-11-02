import fs from 'fs';
import * as XLSX from 'xlsx';

const p = 'D:/Cloud/git/ggomcode/ggomrate/2027_대교협_수시경쟁률_매칭완료.xlsx';
const buf = fs.readFileSync(p);
const wb = XLSX.read(buf, { type: 'buffer' });
const s = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(s, { header: 1, defval: '' });

const keys = new Set();
let duplicates = 0;

for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  // 키: 반_번호_이름_대학명_전형유형_세부유형_모집단위
  const key = `${r[1]}_${r[2]}_${r[3]}_${r[6]}_${r[8]}_${r[10]}_${r[12]}`.replace(/\s+/g, '');
  if (keys.has(key)) {
    duplicates++;
    console.log('Duplicate:', key);
  }
  keys.add(key);
}

console.log('Total rows:', rows.length - 1);
console.log('Unique keys:', keys.size);
console.log('Duplicates:', duplicates);

