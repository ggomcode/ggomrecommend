import fs from 'fs';
import * as XLSX from 'xlsx';

async function checkCurrentSusiSheet() {
  const sheetId = '1hkgi-WKdbh_cIK1Ctzv3BBxqKLe50DCKAT8cmT9wbWg';
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('2027수시')}`;
  try {
    const res = await fetch(url);
    const text = await res.text();
    const wb = XLSX.read(text, { type: 'string' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    console.log('Current rows count in 2027수시:', rows.length);
    console.log('Cols count:', rows[0] ? rows[0].length : 0);
    
    // CE열(83열, index 82) 상태 확인
    if (rows.length > 1) {
      console.log('Header at 82 (CE):', rows[0][82]);
      console.log('Row 1 at 82 (CE):', rows[1][82]);
      console.log('Row 2 at 82 (CE):', rows[2][82]);
      console.log('Row 1376 at 82 (CE):', rows[1376] ? rows[1376][82] : 'none');
      if (rows.length > 1380) {
        console.log('Row 1380 at 82 (CE):', rows[1380][82]);
      }
    }
  } catch(e) {
    console.error('Fetch error:', e);
  }
}

checkCurrentSusiSheet();

