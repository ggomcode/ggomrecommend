import fs from 'fs';
import * as XLSX from 'xlsx';

const sheetId = '1hkgi-WKdbh_cIK1Ctzv3BBxqKLe50DCKAT8cmT9wbWg';
const url = 'https://docs.google.com/spreadsheets/d/' + sheetId + '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent('2027수능최저');
const res = await fetch(url);
const text = await res.text();
const wb = XLSX.read(text, { type: 'string' });
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
const knu = rows.find(r => (r[2]||'').includes('강원대'));

console.log('=== 강원대 원본 셀 전체 ===');
for (let c = 3; c <= 9; c++) {
  if (knu[c] && knu[c] !== 'Ⅹ') {
    console.log(`\n--- Col ${c} ---`);
    console.log(knu[c]);
  }
}
