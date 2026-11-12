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

async function findStudent() {
  const sheetId = '1hkgi-WKdbh_cIK1Ctzv3BBxqKLe50DCKAT8cmT9wbWg';
  const csv = await fetchCsv(sheetId, '2027모의결과');
  const wb = XLSX.read(csv, { type: 'string' });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (String(r[5]).includes('한가은')) {
      console.log(`Row ${i+1}: m=${r[0]}, g=${r[2]}, class=${r[3]}, num=${r[4]}, name=${r[5]}`);
    }
  }
}

findStudent();

