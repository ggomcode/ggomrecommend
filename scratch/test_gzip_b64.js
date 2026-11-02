import zlib from 'zlib';
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

const jsonStr = JSON.stringify(trackMap);
const gzipped = zlib.gzipSync(Buffer.from(jsonStr, 'utf8'));
const b64 = gzipped.toString('base64');
console.log('Original JSON size:', jsonStr.length, 'bytes');
console.log('Gzip Base64 size:', b64.length, 'bytes (~' + (b64.length/1024).toFixed(1) + ' KB)');

// Verify decompression
const decomp = zlib.gunzipSync(Buffer.from(b64, 'base64')).toString('utf8');
const recovered = JSON.parse(decomp);
console.log('Recovered keys count:', Object.keys(recovered).length);
console.log('Keys match:', Object.keys(recovered).length === Object.keys(trackMap).length);

