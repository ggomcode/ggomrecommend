import fs from 'fs';
import * as XLSX from 'xlsx';

const p = 'D:/Cloud/git/ggomcode/ggomrate/2027_대교협_수시경쟁률_매칭완료.xlsx';
const buf = fs.readFileSync(p);
const wb = XLSX.read(buf, { type: 'buffer' });
const s = wb.Sheets['대교협_3개년_경쟁률_매칭'];
const rows = XLSX.utils.sheet_to_json(s, { header: 1, defval: '' });

const mCEIdx = 57;
const db = {};

for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  const ban = String(r[1] || '').trim();
  const num = String(r[2] || '').trim();
  const name = String(r[3] || '').trim();
  const univ = String(r[6] || '').trim();
  const tType = String(r[8] || '').trim();
  const tDetail = String(r[10] || '').trim();
  const dept = String(r[12] || '').trim();

  const key = `${ban}_${num}_${name}_${univ}_${tType}_${tDetail}_${dept}`.replace(/[\r\n\s]+/g, '');
  const subKey = `${ban}_${num}_${name}_${univ}_${dept}`.replace(/[\r\n\s]+/g, '');
  const vals = r.slice(mCEIdx, mCEIdx + 40);

  db[key] = vals;
  if (!db[subKey]) db[subKey] = vals;
}

const jsonStr = JSON.stringify(db);
console.log('JSON string length in bytes:', Buffer.byteLength(jsonStr, 'utf8'));
console.log('JSON string length in KB:', (Buffer.byteLength(jsonStr, 'utf8') / 1024).toFixed(1));
console.log('Total keys in db:', Object.keys(db).length);

