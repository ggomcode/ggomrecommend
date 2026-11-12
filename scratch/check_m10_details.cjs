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

async function checkMonth10Details() {
  const sheetId = '1hkgi-WKdbh_cIK1Ctzv3BBxqKLe50DCKAT8cmT9wbWg';
  const csv = await fetchCsv(sheetId, '2027모의결과');
  const wb = XLSX.read(csv, { type: 'string' });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });

  const m10_g3 = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (String(r[0]).trim() === '10' && (Number(r[2]) === 3 || !r[2])) {
      m10_g3.push(r);
    }
  }

  console.log('Month 10 Grade 3 records count:', m10_g3.length);
  // print first 5 students
  console.log('\nFirst 5 students:');
  m10_g3.slice(0, 5).forEach(r => {
    console.log({
      name: r[5],
      class: r[3],
      num: r[4],
      korSubj: r[6], korG: r[12],
      mathSubj: r[13], mathG: r[19],
      engG: r[23],
      inq1: r[25], inq1G: r[29],
      inq2: r[30], inq2G: r[34]
    });
  });

  // Grade distributions
  const engGrades = {};
  m10_g3.forEach(r => {
    const eg = r[23];
    engGrades[eg] = (engGrades[eg] || 0) + 1;
  });
  console.log('\nEnglish grade distribution in Month 10 Grade 3:');
  console.log(engGrades);

  const mathGrades = {};
  m10_g3.forEach(r => {
    const mg = r[19];
    mathGrades[mg] = (mathGrades[mg] || 0) + 1;
  });
  console.log('\nMath grade distribution in Month 10 Grade 3:');
  console.log(mathGrades);
}

checkMonth10Details();

