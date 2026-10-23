import fs from 'fs';
import * as XLSX from 'xlsx';

async function main() {
  const sheetId = '1hkgi-WKdbh_cIK1Ctzv3BBxqKLe50DCKAT8cmT9wbWg';
  const url = 'https://docs.google.com/spreadsheets/d/' + sheetId + '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent('2027수능최저');
  const res = await fetch(url);
  const text = await res.text();
  const wb = XLSX.read(text, { type: 'string' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  for (let r = 1; r < rows.length; r++) {
    const univ = String(rows[r][2]||'').replace(/[\r\n]+/g, ' ');
    for (let c = 3; c <= 9; c++) {
      if (rows[r][c] && rows[r][c] !== 'Ⅹ') {
        const val = String(rows[r][c]);
        if (val.includes('나머지') || val.includes('제외')) {
          console.log(`[Row ${r} Col ${c}] ${univ}:`);
          console.log('  ' + JSON.stringify(val));
        }
      }
    }
  }
}
main();
