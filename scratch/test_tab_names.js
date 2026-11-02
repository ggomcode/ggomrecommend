import fs from 'fs';
import * as XLSX from 'xlsx';

async function testTabs() {
  const sheetId = '1hkgi-WKdbh_cIK1Ctzv3BBxqKLe50DCKAT8cmT9wbWg';
  const candidates = [
    '2027수시', '2026수시', '2025수시', '2027모의가채점', '2027모의등급컷', '수능최저충족률', '2027수능최저',
    '2027경쟁률', '경쟁률', '수시원자료', '경쟁률크롤링', '크롤링', '2027매칭', '매칭자료', '전문대', '수시'
  ];

  for (const name of candidates) {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(name)}&range=A1:C2`;
    try {
      const res = await fetch(url);
      const text = await res.text();
      if (res.status === 200 && !text.includes('INVALID_QUERY') && !text.includes('Error')) {
        const wb = XLSX.read(text, { type: 'string' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        console.log(`[FOUND TAB] '${name}' -> ${rows.length} rows`);
      } else {
        // console.log(`[NOT FOUND] '${name}'`);
      }
    } catch(e) {}
  }
}

testTabs();

