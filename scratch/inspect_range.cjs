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

async function inspectRange() {
  const sheetId = '1hkgi-WKdbh_cIK1Ctzv3BBxqKLe50DCKAT8cmT9wbWg';
  const csv = await fetchCsv(sheetId, '2027모의결과');
  const wb = XLSX.read(csv, { type: 'string' });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });

  console.log('Row 970 to 985:');
  for (let i = 970; i < 985 && i < rows.length; i++) {
    const r = rows[i];
    console.log(`Row ${i+1}: m=${r[0]}, g=${r[2]}, class=${r[3]}, num=${r[4]}, name=${r[5]}, korSubj=${r[6]}, korG=${r[12]}, mathG=${r[19]}`);
  }

  console.log('\nRow 1100 to 1120:');
  for (let i = 1100; i < 1120 && i < rows.length; i++) {
    const r = rows[i];
    console.log(`Row ${i+1}: m=${r[0]}, g=${r[2]}, class=${r[3]}, num=${r[4]}, name=${r[5]}, korSubj=${r[6]}, korG=${r[12]}, mathG=${r[19]}`);
  }
}

inspectRange();

