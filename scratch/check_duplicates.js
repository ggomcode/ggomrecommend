import fs from 'fs';
import * as XLSX from 'xlsx';

const p = 'D:/Cloud/git/ggomcode/ggomrate/2027_대교협_수시경쟁률_매칭완료.xlsx';
const buf = fs.readFileSync(p);
const wb = XLSX.read(buf, { type: 'buffer' });
const s = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(s, { header: 1, defval: '' });

// 중복된 5개 행 살펴보기
const targetNames = ['임아름', '정미성', '공건호', '조원준', '조은서'];
rows.forEach((r, idx) => {
  if (targetNames.includes(r[3])) {
    console.log(`Row ${idx+1}: [${r[1]}반 ${r[2]}번 ${r[3]}] ${r[6]} | ${r[8]} | ${r[9]} | ${r[10]} | ${r[12]}`);
  }
});

