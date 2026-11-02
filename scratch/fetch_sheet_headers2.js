import fs from 'fs';
import * as XLSX from 'xlsx';

async function testFetchSheet() {
  const sheetId = '1hkgi-WKdbh_cIK1Ctzv3BBxqKLe50DCKAT8cmT9wbWg';
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('2027수시')}`;
  try {
    const res = await fetch(url);
    const text = await res.text();
    const wb = XLSX.read(text, { type: 'string' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    console.log('Parsed rows:', rows.length);
    if (rows.length > 0) {
      const headerRow = rows[0];
      console.log('Total columns in row 0:', headerRow.length);
      headerRow.forEach((h, i) => {
        const colLetter = getColumnLetter(i + 1);
        if (i >= 78 && i <= 125) {
          console.log(`Col ${i+1} (${colLetter}): ${h}`);
        }
      });
      if (rows.length > 1) {
        console.log('\nSample row 1 values for CE:DR (cols 83-122):');
        for (let i = 82; i <= 121; i++) {
          const colLetter = getColumnLetter(i + 1);
          console.log(`${colLetter} (${headerRow[i]}): ${rows[1][i]}`);
        }
      }
    }
  } catch(e) {
    console.error('Fetch error:', e);
  }
}

function getColumnLetter(colIndex) {
  let temp, letter = '';
  while (colIndex > 0) {
    temp = (colIndex - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    colIndex = Math.floor((colIndex - temp - 1) / 26);
  }
  return letter;
}

testFetchSheet();

