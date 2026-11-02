import fs from 'fs';
import * as XLSX from 'xlsx';
import zlib from 'zlib';

const p = 'd:/Cloud/git/ggomcode/ggomrecommend/scratch/2027수시_전체_1400건_매칭완료.xlsx';
const buf = fs.readFileSync(p);
const wb = XLSX.read(buf, { type: 'buffer' });
const s = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(s, { header: 1, defval: '' });

const mCEIdx = 82;
const keyMap = {};

for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  const ban = String(r[1] || '').trim();
  const num = String(r[2] || '').trim();
  const name = String(r[3] || '').trim();
  const univ = String(r[6] || '').trim();
  const dept = String(r[12] || '').trim();
  const key = `${ban}_${num}_${name}_${univ}_${dept}`.replace(/[\r\n\s]+/g, '');

  const vals = r.slice(mCEIdx, mCEIdx + 40);
  keyMap[key] = vals;
}

const jsonStr = JSON.stringify(keyMap);
const gzipped = zlib.gzipSync(Buffer.from(jsonStr, 'utf8'));
const base64 = gzipped.toString('base64');
console.log('Gzip Base64 size in KB:', (base64.length / 1024).toFixed(1));

