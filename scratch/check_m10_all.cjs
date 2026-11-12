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

async function checkAllM10() {
  const sheetId = '1hkgi-WKdbh_cIK1Ctzv3BBxqKLe50DCKAT8cmT9wbWg';
  const csv = await fetchCsv(sheetId, '2027모의결과');
  const wb = XLSX.read(csv, { type: 'string' });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });

  let normalG3Count = 0;
  let shiftedOrG2FormatCount = 0;

  for (let i = 976; i <= 1109; i++) {
    const r = rows[i];
    // In G3 format:
    // r[6] is korSubject (화법과작문, 언어와매체)
    // r[13] is mathSubject (확률과통계, 미적분, 기하)
    // r[25] is inquiry1 subject name (생활과윤리, etc.)
    const isShifted = r[25] === '사회탐구' || r[30] === '과학탐구' || String(r[19]).includes('.');
    if (isShifted) {
      shiftedOrG2FormatCount++;
      console.log(`Shifted: Row ${i+1}: ${r[5]} (반 ${r[3]}, 번호 ${r[4]})`);
    } else {
      normalG3Count++;
    }
  }

  console.log(`\nNormal G3 format: ${normalG3Count}`);
  console.log(`Shifted / G2 format: ${shiftedOrG2FormatCount}`);
}

checkAllM10();

