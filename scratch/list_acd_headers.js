import * as XLSX from 'xlsx';
import fs from 'fs';

const p = 'd:/Cloud/git/ggomcode/ggomrecommend/scratch/2027수시_전체_1400건_매칭완료.xlsx';
const wb = XLSX.read(fs.readFileSync(p), { type: 'buffer' });
const s = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(s, { header: 1, defval: '' });

function toColName(n) {
  let ordA = 'A'.charCodeAt(0);
  let ordZ = 'Z'.charCodeAt(0);
  let len = ordZ - ordA + 1;
  let res = '';
  while(n >= 0) {
    res = String.fromCharCode(n % len + ordA) + res;
    n = Math.floor(n / len) - 1;
  }
  return res;
}

const headers = rows[0].slice(0, 82);
headers.forEach((h, i) => {
  const colLetter = toColName(i);
  console.log(`${i+1} (${colLetter}): ${h}`);
});

