import fs from 'fs';
import * as XLSX from 'xlsx';

async function checkCompletedFile() {
  const p = 'D:/Cloud/git/ggomcode/ggomrate/2027_대교협_수시_매칭완료.xlsx';
  if (fs.existsSync(p)) {
    const buf = fs.readFileSync(p);
    const wb = XLSX.read(buf, { type: 'buffer' });
    console.log('Sheets in 2027_대교협_수시_매칭완료:', wb.SheetNames);
    const s = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(s, { header: 1, defval: '' });
    console.log('Rows count:', rows.length);
    console.log('Cols count:', rows[0] ? rows[0].length : 0);
  } else {
    console.log('File not found:', p);
  }
}

checkCompletedFile();

