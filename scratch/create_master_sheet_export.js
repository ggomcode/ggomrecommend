import fs from 'fs';
import * as XLSX from 'xlsx';

// 1. 원본 매칭 엑셀 로드
const srcPath = 'D:/Cloud/git/ggomcode/ggomrate/2027_대교협_수시경쟁률_매칭완료.xlsx';
const buf = fs.readFileSync(srcPath);
const wb = XLSX.read(buf, { type: 'buffer' });
const ws = wb.Sheets['대교협_3개년_경쟁률_매칭'];

// 2. 새 워크북 생성하여 저장
const outWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(outWb, ws, '2027매칭마스터');

const outXlsx = 'd:/Cloud/git/ggomcode/ggomrecommend/scratch/2027매칭마스터_1376건.xlsx';
XLSX.writeFile(outWb, outXlsx);
console.log('Saved xlsx:', outXlsx);

// CSV도 저장
const csvContent = XLSX.utils.sheet_to_csv(ws);
const outCsv = 'd:/Cloud/git/ggomcode/ggomrecommend/scratch/2027매칭마스터_1376건.csv';
fs.writeFileSync(outCsv, csvContent, 'utf8');
console.log('Saved csv:', outCsv);
