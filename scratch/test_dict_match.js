import zlib from 'zlib';
import fs from 'fs';
import * as XLSX from 'xlsx';

const p = 'd:/Cloud/git/ggomcode/ggomrecommend/scratch/2027수시_전체_1400건_매칭완료.xlsx';
const buf = fs.readFileSync(p);
const wb = XLSX.read(buf, { type: 'buffer' });
const s = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(s, { header: 1, defval: '' });

// Build trackMap
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

// Compress & Decompress test
const gzipped = zlib.gzipSync(Buffer.from(JSON.stringify(trackMap), 'utf8'));
const b64 = gzipped.toString('base64');
const dict = JSON.parse(zlib.gunzipSync(Buffer.from(b64, 'base64')).toString('utf8'));

// Now simulate matching on the 1,400 rows
let matchedCount = 0;
let collegeCount = 0;
let missingCount = 0;

for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  const univ = String(r[6] || '').trim();
  const track = String(r[10] || r[8] || '').trim();
  const dept = String(r[12] || '').trim();
  const key = `${univ}__${track}__${dept}`.replace(/[\r\n\s]+/g, '');

  if (dict[key]) {
    matchedCount++;
  } else {
    // Check if college
    const schoolType = String(r[4] || '').trim();
    if (schoolType.includes('전문') || univ.includes('전문대')) {
      collegeCount++;
    } else {
      missingCount++;
    }
  }
}

console.log(`Matched: ${matchedCount}, College: ${collegeCount}, Missing: ${missingCount}`);

