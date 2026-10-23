import fs from 'fs';
import * as XLSX from 'xlsx';

const buf = fs.readFileSync('scratch/2027_수시_대학별_수능최저_정규화목록.xlsx');
const wb = XLSX.read(buf, { type: 'buffer' });
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

let affected = 0;
const cols = ['지역', '대학명(캠퍼스)', '전형', '세부전형', '세세부전형', '학부 또는 학과', '수능최저학력기준'];

rows.forEach((r, idx) => {
  cols.forEach(col => {
    const orig = String(r[col] || '');
    // 1. 공백 및 개행 정리
    let cleaned = orig.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
    // 2. 앞뒤 불필요한 기호 제거
    cleaned = cleaned.replace(/^[,\s.:;/\-]+/, '').replace(/[,\s.:;/\-]+$/, '').trim();

    if (orig !== cleaned) {
      affected++;
      if (affected <= 20) {
        console.log(`[Row ${idx+1}] ${col}:\n  ORIG: "${orig}"\n  CLEAN: "${cleaned}"\n`);
      }
    }
  });
});

console.log('Total affected fields:', affected);
