import fs from 'fs';
import * as XLSX from 'xlsx';

const p = 'D:/Cloud/git/ggomcode/ggomrate/2027_대교협_수시경쟁률_매칭완료.xlsx';
const buf = fs.readFileSync(p);
const wb = XLSX.read(buf, { type: 'buffer' });
const s = wb.Sheets['대교협_3개년_경쟁률_매칭'];
const rows = XLSX.utils.sheet_to_json(s, { header: 1, defval: '' });

console.log('Total rows in matching sheet:', rows.length);
console.log('Row 0 headers count:', rows[0].length);
console.log('Sample row 1 key:', `${rows[1][1]}_${rows[1][2]}_${rows[1][3]}_${rows[1][6]}_${rows[1][8]}_${rows[1][10]}_${rows[1][12]}`);
console.log('Sample row 1 CE value:', rows[1][57]);

