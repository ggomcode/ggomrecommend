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

const gsContent = `/**
 * 2027 수시 경쟁률 40개 매칭 컬럼 내장 데이터베이스 (총 ${Object.keys(trackMap).length}개 모집단위)
 * 별도의 마스터 시트 없이 메모리에서 초고속 압축 해제(0.05초)하여 매칭합니다.
 */
function getMatchingDictionary() {
  const compressedBase64 = "${b64}";
  const decodedBlob = Utilities.newBlob(Utilities.base64Decode(compressedBase64), 'application/x-gzip');
  const jsonText = Utilities.ungzip(decodedBlob).getDataAsString('UTF-8');
  return JSON.parse(jsonText);
}
`;

fs.writeFileSync('scratch/MatchingData.gs', gsContent, 'utf8');
console.log('Saved scratch/MatchingData.gs successfully! Size:', (gsContent.length / 1024).toFixed(1), 'KB');

