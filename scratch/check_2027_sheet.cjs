const https = require('https');

const sheetId = '1hkgi-WKdbh_cIK1Ctzv3BBxqKLe50DCKAT8cmT9wbWg';
const tabName = encodeURIComponent('2027모의결과');
const url = 'https://docs.google.com/spreadsheets/d/' + sheetId + '/gviz/tq?tqx=out:csv&sheet=' + tabName;

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const lines = data.trim().split(/\r?\n/);
    console.log('Total rows in sheet (including headers):', lines.length);
    const byMonthAndGrade = {};
    const sampleRows = {};
    for (let i = 1; i < lines.length; i++) {
      // simple csv split handling quotes
      const line = lines[i];
      const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^["']|["']$/g, '').trim());
      const m = cols[0];
      const g = cols[2];
      const key = 'Month ' + m + ' / Grade ' + g;
      byMonthAndGrade[key] = (byMonthAndGrade[key] || 0) + 1;
      if (!sampleRows[key]) {
        sampleRows[key] = cols.slice(0, 15).join(' | ');
      }
    }
    console.log('Breakdown by Month and Grade:');
    console.log(JSON.stringify(byMonthAndGrade, null, 2));
    console.log('\nSample Rows:');
    console.log(JSON.stringify(sampleRows, null, 2));
  });
}).on('error', err => console.error(err));

