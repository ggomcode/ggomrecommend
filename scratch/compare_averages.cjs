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

const parseGradeValue = (val) => {
  if (val === '' || val === null || val === undefined) return null;
  const cleanStr = String(val).replace(/[^0-9.]/g, '');
  if (!cleanStr) return null;
  const n = Number(cleanStr);
  if (isNaN(n) || n <= 0) return null;
  if (n >= 1 && n <= 9) return Math.round(n * 100) / 100;
  return null;
};

async function compareAverages() {
  const sheetId = '1hkgi-WKdbh_cIK1Ctzv3BBxqKLe50DCKAT8cmT9wbWg';
  const csv = await fetchCsv(sheetId, '2027모의결과');
  const wb = XLSX.read(csv, { type: 'string' });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });

  const allM10G3 = [];
  const cleanM10G3 = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (String(r[0]).trim() === '10' && (Number(r[2]) === 3 || !r[2])) {
      const isShifted = r[25] === '사회탐구' || r[30] === '과학탐구' || String(r[19]).includes('.');
      const item = {
        name: r[5],
        kor: parseGradeValue(r[12]),
        math: parseGradeValue(r[19]),
        eng: parseGradeValue(r[23]),
        inq1: parseGradeValue(r[29]),
        inq2: parseGradeValue(r[34])
      };
      allM10G3.push(item);
      if (!isShifted) {
        cleanM10G3.push(item);
      }
    }
  }

  const avg = arr => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : '-';

  console.log('=== All 134 students in Month 10 G3 ===');
  console.log('국어 평균:', avg(allM10G3.map(r => r.kor).filter(v => v != null)));
  console.log('수학 평균:', avg(allM10G3.map(r => r.math).filter(v => v != null)));
  console.log('영어 평균:', avg(allM10G3.map(r => r.eng).filter(v => v != null)));
  console.log('탐1 평균:', avg(allM10G3.map(r => r.inq1).filter(v => v != null)));
  console.log('탐2 평균:', avg(allM10G3.map(r => r.inq2).filter(v => v != null)));

  console.log('\n=== Clean 127 students in Month 10 G3 (excluding 7 shifted) ===');
  console.log('국어 평균:', avg(cleanM10G3.map(r => r.kor).filter(v => v != null)));
  console.log('수학 평균:', avg(cleanM10G3.map(r => r.math).filter(v => v != null)));
  console.log('영어 평균:', avg(cleanM10G3.map(r => r.eng).filter(v => v != null)));
  console.log('탐1 평균:', avg(cleanM10G3.map(r => r.inq1).filter(v => v != null)));
  console.log('탐2 평균:', avg(cleanM10G3.map(r => r.inq2).filter(v => v != null)));
}

compareAverages();

