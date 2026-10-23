import fs from 'fs';
import * as XLSXModule from 'xlsx';
const XLSX = XLSXModule.default || XLSXModule;

const buf = fs.readFileSync('scratch/2027_수시_대학별_수능최저_정규화목록.xlsx');
const wb = XLSX.read(buf, { type: 'buffer' });
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

const checkUnivs = ['충북대', '공주대', '경상대', '충남대', '부산대', '경북대', '전남대', '전북대', '제주대', '포스텍', '한국교원대'];

checkUnivs.forEach(u => {
  console.log('==================== ' + u + ' ====================');
  const rows = data.filter(r => (r['대학명(캠퍼스)'] || '').includes(u));
  rows.forEach(r => {
    console.log('[' + r['전형'] + '|' + r['세부전형'] + '|' + r['세세부전형'] + '] Dept: ' + r['학부 또는 학과'] + ' => Score: ' + r['수능최저학력기준']);
  });
});
