import fs from 'fs';
import * as XLSX from 'xlsx';

const p = 'D:/Cloud/git/ggomcode/ggomrate/2027_대교협_수시경쟁률_매칭완료.xlsx';
const buf = fs.readFileSync(p);
const wb = XLSX.read(buf, { type: 'buffer' });
const s = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(s, { header: 1, defval: '' });

const headers = rows[0];
console.log('Headers count:', headers.length);

// 2027수시 시트의 앞쪽 컬럼들과 매칭 파일 앞쪽 컬럼들 비교
console.log('First 15 headers of matching excel:');
headers.slice(0, 15).forEach((h, i) => console.log(i, h));

// CE:DR 컬럼(40개 컬럼)의 헤더들
// 매칭 파일에서 CE:DR에 해당하는 컬럼들이 어디서부터 시작되는지 찾기
const ceHeaderIdx = headers.findIndex(h => h.includes('대학구분') || h.includes('[대학구분]'));
console.log('CE header index in matching excel:', ceHeaderIdx);
if (ceHeaderIdx !== -1) {
  console.log('Matching columns count from CE:', headers.length - ceHeaderIdx);
  console.log(headers.slice(ceHeaderIdx));
}

