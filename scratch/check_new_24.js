import fs from 'fs';
import * as XLSX from 'xlsx';

async function checkNew24Rows() {
  const sheetId = '1hkgi-WKdbh_cIK1Ctzv3BBxqKLe50DCKAT8cmT9wbWg';
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('2027수시')}`;
  const res = await fetch(url);
  const text = await res.text();
  const wbCurrent = XLSX.read(text, { type: 'string' });
  const sheetCurrent = wbCurrent.Sheets[wbCurrent.SheetNames[0]];
  const currentRows = XLSX.utils.sheet_to_json(sheetCurrent, { header: 1, defval: '' });
  const dataRows = currentRows.slice(1);

  const masterPath = 'D:/Cloud/git/ggomcode/ggomrate/2027_대교협_수시경쟁률_매칭완료.xlsx';
  const masterBuf = fs.readFileSync(masterPath);
  const wbMaster = XLSX.read(masterBuf, { type: 'buffer' });
  const sMaster = wbMaster.Sheets['대교협_3개년_경쟁률_매칭'];
  const masterRows = XLSX.utils.sheet_to_json(sMaster, { header: 1, defval: '' });

  const masterKeys = new Set();
  for (let i = 1; i < masterRows.length; i++) {
    const r = masterRows[i];
    const ban = String(r[1] || '').trim();
    const num = String(r[2] || '').trim();
    const name = String(r[3] || '').trim();
    const univ = String(r[6] || '').trim();
    const dept = String(r[12] || '').trim();
    masterKeys.add(`${ban}_${num}_${name}_${univ}_${dept}`.replace(/[\r\n\s]+/g, ''));
  }

  console.log('--- 24 NEW ROWS ---');
  let count = 0;
  for (let i = 0; i < dataRows.length; i++) {
    const r = dataRows[i];
    const ban = String(r[1] || '').trim();
    const num = String(r[2] || '').trim();
    const name = String(r[3] || '').trim();
    const univ = String(r[6] || '').trim();
    const dept = String(r[12] || '').trim();
    const subKey = `${ban}_${num}_${name}_${univ}_${dept}`.replace(/[\r\n\s]+/g, '');

    if (!masterKeys.has(subKey)) {
      count++;
      console.log(`[${count}] Line ${i+2}: ${ban}반 ${num}번 ${name} | ${r[4]} | ${univ} | ${r[8]} | ${r[9]} | ${dept}`);
    }
  }
}

checkNew24Rows();

