const https = require('https');
const XLSX = require('xlsx');

const sheetId = '1hkgi-WKdbh_cIK1Ctzv3BBxqKLe50DCKAT8cmT9wbWg';

function fetchCsv(tab) {
  return new Promise((resolve, reject) => {
    const url = 'https://docs.google.com/spreadsheets/d/' + sheetId + '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent(tab);
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  for (const tab of ['2027모의결과', '2027모의가채점']) {
    console.log('=== TAB:', tab);
    try {
      const csv = await fetchCsv(tab);
      const wb = XLSX.read(csv, { type: 'string' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      console.log('Rows count:', rows.length);
      console.log('Headers (Row 0):', (rows[0] || []).slice(0, 10));
      console.log('Headers (Row 1):', (rows[1] || []).slice(0, 10));

      const col0Values = new Map();
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length === 0) continue;
        const v = String(r[0] || '').trim();
        col0Values.set(v, (col0Values.get(v) || 0) + 1);
      }
      console.log('Column 0 distribution:', Object.fromEntries(col0Values));

      // Also let's check unique exam names or month values across rows
      // Check first few rows
      console.log('Sample row 2:', rows[2]?.slice(0, 7));
      console.log('Sample row 3:', rows[3]?.slice(0, 7));
    } catch (e) {
      console.error('Error fetching tab:', tab, e.message);
    }
  }
}

run();

