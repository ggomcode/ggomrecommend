const fs = require('fs');
const XLSX = require('xlsx');

// Let's run a test by checking the sheet tabs and data directly
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

async function analyze() {
  const sheetId = '1hkgi-WKdbh_cIK1Ctzv3BBxqKLe50DCKAT8cmT9wbWg';
  
  // 1. Check 2027모의결과
  const resCsv = await fetchCsv(sheetId, '2027모의결과');
  const resWb = XLSX.read(resCsv, { type: 'string' });
  const resRows = XLSX.utils.sheet_to_json(resWb.Sheets[resWb.SheetNames[0]], { header: 1 });
  
  console.log('--- 2027모의결과 ---');
  console.log('Total rows:', resRows.length);
  
  // Count by month for grade 3
  const g3ByMonth = {};
  for (let i = 1; i < resRows.length; i++) {
    const r = resRows[i];
    const m = r[0];
    const g = Number(r[2]) || 3;
    if (g === 3) {
      g3ByMonth[m] = (g3ByMonth[m] || 0) + 1;
    }
  }
  console.log('Grade 3 in 2027모의결과:', g3ByMonth);

  // Check 2027모의가채점
  try {
    const gachaeCsv = await fetchCsv(sheetId, '2027모의가채점');
    const gWb = XLSX.read(gachaeCsv, { type: 'string' });
    const gRows = XLSX.utils.sheet_to_json(gWb.Sheets[gWb.SheetNames[0]], { header: 1 });
    console.log('--- 2027모의가채점 ---');
    console.log('Total rows:', gRows.length);
    const gachaeByMonth = {};
    for (let i = 1; i < gRows.length; i++) {
      const r = gRows[i];
      const m = r[0];
      gachaeByMonth[m] = (gachaeByMonth[m] || 0) + 1;
    }
    console.log('2027모의가채점 by month:', gachaeByMonth);
  } catch (e) {
    console.log('No 2027모의가채점 or error:', e.message);
  }
}

analyze();

