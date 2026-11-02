import fs from 'fs';
import * as XLSX from 'xlsx';

async function checkRowsTail() {
  const sheetId = '1hkgi-WKdbh_cIK1Ctzv3BBxqKLe50DCKAT8cmT9wbWg';
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('2027수시')}`;
  const res = await fetch(url);
  const text = await res.text();
  const wb = XLSX.read(text, { type: 'string' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  
  console.log('Total rows:', rows.length);
  console.log('Last row index:', rows.length - 1);
  console.log('Last row data (first 10 cols):', rows[rows.length - 1].slice(0, 10));
  console.log('Second to last row (first 10 cols):', rows[rows.length - 2].slice(0, 10));
}

checkRowsTail();

