import fs from 'fs';
import * as XLSX from 'xlsx';

const p = 'd:/Cloud/git/ggomcode/ggomrecommend/scratch/2027수시_전체_1400건_매칭완료.xlsx';
const buf = fs.readFileSync(p);
const wb = XLSX.read(buf, { type: 'buffer' });
const s = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(s, { header: 1, defval: '' });

// 1,400개 행의 CE:DR 데이터(40개 열)를
// 고유 키(반_번호_이름_대학_학과) 기반으로 JSON 생성
const mCEIdx = 82; // CE열은 82 (0-based)
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

console.log('Total entries:', Object.keys(keyMap).length);

// Gzip 또는 단순 문자열 압축
const jsonStr = JSON.stringify(keyMap);
console.log('Raw JSON size in KB:', (Buffer.byteLength(jsonStr, 'utf8') / 1024).toFixed(1));

// zlib deflate
import zlib from 'zlib';
const deflated = zlib.deflateSync(Buffer.from(jsonStr, 'utf8'));
const base64 = deflated.toString('base64');
console.log('Deflated Base64 size in KB:', (base64.length / 1024).toFixed(1));

