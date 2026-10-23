import * as XLSX from 'xlsx';

async function check() {
  const sheetId = '1hkgi-WKdbh_cIK1Ctzv3BBxqKLe50DCKAT8cmT9wbWg';
  const url = 'https://docs.google.com/spreadsheets/d/' + sheetId + '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent('2027수능최저');
  const res = await fetch(url);
  const text = await res.text();
  const wb = XLSX.read(text, { type: 'string' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  const patternB = [];
  const otherUnusual = [];

  for (let r = 1; r < rows.length; r++) {
    const univ = String(rows[r][2] || '').replace(/[\r\n]+/g, ' ');
    for (let c = 3; c <= 9; c++) {
      const val = String(rows[r][c] || '').trim();
      if (!val || val === 'Ⅹ') continue;
      
      const colName = rows[0][c].replace(/[\r\n]+/g, ' ');

      // Pattern: '최저기준: [학과]' or '숫자) 최저기준: [학과]'
      if (/:\s*\[[^\]]+\]/.test(val) || /[0-9]+\)\s*[^:\n]+:\s*\[/.test(val)) {
        patternB.push({ r, univ, c, colName, val });
      }
    }
  }

  console.log(`Pattern B count: ${patternB.length}`);
  patternB.forEach(p => {
    console.log(`=== R${p.r} ${p.univ} | Col ${p.c} (${p.colName}) ===`);
    console.log(p.val);
    console.log('--------------------------------------------------');
  });
}

check().catch(console.error);
