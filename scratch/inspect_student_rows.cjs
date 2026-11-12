const fs = require('fs');
const XLSX = require('xlsx');
const https = require('https');

function fetchCsv(sheetId, tabName) {
  return new Promise((resolve, reject) => {
    const url = 'https://docs.google.com/spreadsheets/d/' + sheetId + '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent(tabName);
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function inspectStudentRows() {
  const sheetId = '1hkgi-WKdbh_cIK1Ctzv3BBxqKLe50DCKAT8cmT9wbWg';
  const csv = await fetchCsv(sheetId, '2027모의결과');
  const wb = XLSX.read(csv, { type: 'string' });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });

  [24, 176, 409, 623, 818, 999].forEach(idx => {
    const r = rows[idx];
    console.log(`\nMonth ${r[0]} (Row ${idx+1}):`);
    console.log(`  국어: subj=${r[6]}, 표점=${r[10]}, 백분위=${r[11]}, 등급=${r[12]}`);
    console.log(`  수학: subj=${r[13]}, 표점=${r[17]}, 백분위=${r[18]}, 등급=${r[19]}`);
    console.log(`  영어: 등급=${r[23]}`);
    console.log(`  탐1: subj=${r[25]}, 표점=${r[27]}, 백분위=${r[28]}, 등급=${r[29]}`);
    console.log(`  탐2: subj=${r[30]}, 표점=${r[32]}, 백분위=${r[33]}, 등급=${r[34]}`);
  });
}

inspectStudentRows();

