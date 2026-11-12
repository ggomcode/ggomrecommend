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

async function inspectRow1000() {
  const sheetId = '1hkgi-WKdbh_cIK1Ctzv3BBxqKLe50DCKAT8cmT9wbWg';
  const csv = await fetchCsv(sheetId, '2027모의결과');
  const wb = XLSX.read(csv, { type: 'string' });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });

  const h1 = rows[0];
  const h2 = rows[1];
  const r = rows[999]; // 0-based index for row 1000

  for (let c = 0; c < 44; c++) {
    console.log(`Col ${c} (${String.fromCharCode(65 + (c >= 26 ? Math.floor(c/26)-1 : c))}${c >= 26 ? String.fromCharCode(65 + (c % 26)) : ''}) [${h1[c] || ''} - ${h2[c] || ''}]: ${r[c]}`);
  }
}

inspectRow1000();

