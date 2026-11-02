import fs from 'fs';
import * as XLSX from 'xlsx';

const p = 'd:/Cloud/git/ggomcode/ggomrecommend/scratch/2027수시_전체_1400건_매칭완료.xlsx';
const buf = fs.readFileSync(p);
const wb = XLSX.read(buf, { type: 'buffer' });
const s = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(s, { header: 1, defval: '' });

const mCEIdx = 82;
const trackMap = {};
for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  const univ = String(r[6] || '').trim();
  const track = String(r[10] || r[8] || '').trim();
  const dept = String(r[12] || '').trim();
  const key = `${univ}__${track}__${dept}`.replace(/[\r\n\s]+/g, '');

  const vals = r.slice(mCEIdx, mCEIdx + 40);
  if (!trackMap[key]) {
    trackMap[key] = vals;
  }
}

const rawJson = JSON.stringify(trackMap);
console.log('Compact JSON size in KB:', (Buffer.byteLength(rawJson, 'utf8') / 1024).toFixed(1));

