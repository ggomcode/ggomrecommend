import fs from 'fs';
import * as XLSX from 'xlsx';

async function checkJuniorRows() {
  const sheetId = '1hkgi-WKdbh_cIK1Ctzv3BBxqKLe50DCKAT8cmT9wbWg';
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('2027수시')}`;
  const res = await fetch(url);
  const text = await res.text();
  const wb = XLSX.read(text, { type: 'string' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  
  const juniorRows = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const sType = String(r[4] || '');
    const uName = String(r[6] || '');
    if (sType.includes('전문') || uName.includes('전문대') || uName.includes('전문대학')) {
      juniorRows.push({
        rowNum: i + 1,
        ban: r[1],
        num: r[2],
        name: r[3],
        schoolType: r[4],
        univ: r[6],
        track: r[9],
        dept: r[12]
      });
    }
  }
  console.log('Total junior college rows found:', juniorRows.length);
  juniorRows.slice(0, 10).forEach(j => {
    console.log(`Line ${j.rowNum}: [${j.ban}반 ${j.num}번 ${j.name}] ${j.univ} | ${j.dept}`);
  });
}

checkJuniorRows();

