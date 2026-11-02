import fs from 'fs';
import * as XLSX from 'xlsx';

const p = 'd:/Cloud/git/ggomcode/ggomrecommend/scratch/2027수시_전체_1400건_매칭완료.xlsx';
const buf = fs.readFileSync(p);
const wb = XLSX.read(buf, { type: 'buffer' });
const s = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(s, { header: 1, defval: '' });

const mCEIdx = 82;

// 대학/학과/전형별로 그룹화하여 데이터 크기 대폭 축소
// key: 대학명__전형명__학과명
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

console.log('Total unique tracks:', Object.keys(trackMap).length);
// JS 파일 생성
let jsContent = `/**
 * 2027 수시 경쟁률 크롤링 40개 매칭 컬럼 사전 (총 ${Object.keys(trackMap).length}개 모집단위)
 */
function getMatchingDictionary() {
  return ${JSON.stringify(trackMap, null, 2)};
}
`;

fs.writeFileSync('scratch/MatchingData.gs', jsContent, 'utf8');
console.log('Saved scratch/MatchingData.gs, size in KB:', (Buffer.byteLength(jsContent, 'utf8') / 1024).toFixed(1));

