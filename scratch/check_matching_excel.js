import fs from 'fs';
import * as XLSX from 'xlsx';

const p = 'D:/Cloud/git/ggomcode/ggomrate/2027_대교협_수시경쟁률_매칭완료.xlsx';
const buf = fs.readFileSync(p);
const wb = XLSX.read(buf, { type: 'buffer' });
console.log('Sheets:', wb.SheetNames);
const s = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(s, { header: 1, defval: '' });
console.log('Rows count:', rows.length);
console.log('Cols count:', rows[0] ? rows[0].length : 0);
console.log('First 5 col headers:');
console.log(rows[0].slice(0, 10));
console.log('Last col headers:');
console.log(rows[0].slice(-10));

