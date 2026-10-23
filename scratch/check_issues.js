import * as XLSX from 'xlsx';

async function test() {
  const sheetId = '1hkgi-WKdbh_cIK1Ctzv3BBxqKLe50DCKAT8cmT9wbWg';
  const url = 'https://docs.google.com/spreadsheets/d/' + sheetId + '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent('2027수능최저');
  const res = await fetch(url);
  const text = await res.text();
  const wb = XLSX.read(text, { type: 'string' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const checkUnivs = ['단국대', '경기대', '광운대', '충북대', '전남대', '경상대', '한양대', '한국외국어대'];
  rows.forEach(r => {
    const u = String(r[2] || '');
    if (checkUnivs.some(c => u.includes(c))) {
      for (let c = 3; c <= 9; c++) {
        const val = String(r[c] || '').trim();
        if ((val.includes(',') && val.includes('최저없음')) || val.includes('DKU') || val.includes('음악교육') || val.includes('나머지') || (u.includes('충북대') && c === 7)) {
          console.log(`=== ${u.replace(/[\r\n]+/g, ' ')} | Col ${c} ===`);
          console.log(val);
          console.log('--------------------------------------------------');
        }
      }
    }
  });
}
test().catch(console.error);
