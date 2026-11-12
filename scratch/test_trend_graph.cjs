const https = require('https');
const XLSX = require('xlsx');

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

async function testTrend() {
  const sheetId = '1hkgi-WKdbh_cIK1Ctzv3BBxqKLe50DCKAT8cmT9wbWg';
  const csv = await fetchCsv(sheetId, '2027모의결과');
  const wb = XLSX.read(csv, { type: 'string' });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });

  const resultRecords = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const name = String(r[5] || '').trim();
    if (!name || name === '이름' || name === '성명') continue;
    const grade = Number(r[2]) || 3;
    const rawMonth = r[0] != null ? String(r[0]).trim() : '';
    const mNum = parseInt(rawMonth.replace(/[^0-9]/g, ''), 10);
    const isMopyeong = [6, 9].includes(mNum);
    const examName = `${mNum}월 ${isMopyeong ? '모평' : '학평'}`;

    resultRecords.push({
      grade,
      month: String(mNum),
      examName,
      name,
      classNum: r[3],
      studentNum: r[4],
      studentKey: `${grade}-${r[3]}-${r[4]}_${name}`,
      korGrade: parseGradeValue(r[12]),
      mathGrade: parseGradeValue(r[19]),
      engGrade: parseGradeValue(r[23]),
      inq1Grade: parseGradeValue(r[29]),
      inq2Grade: parseGradeValue(r[34]),
      inquiry1: r[25] || '',
      inquiry2: r[30] || ''
    });
  }

  // Also check 2027모의가채점
  const gachaeCsv = await fetchCsv(sheetId, '2027모의가채점');
  const gWb = XLSX.read(gachaeCsv, { type: 'string' });
  const gRows = XLSX.utils.sheet_to_json(gWb.Sheets[gWb.SheetNames[0]], { header: 1 });
  const gHeaders = gRows[0] || [];

  const colMap = {};
  gHeaders.forEach((h, idx) => {
    colMap[String(h).replace(/[\r\n\s]+/g, '').trim()] = idx;
  });

  const tentativeRecords = [];
  for (let i = 1; i < gRows.length; i++) {
    const r = gRows[i];
    const name = String(r[colMap['이름'] || colMap['성명']] || '').trim();
    if (!name || name === '이름' || name === '성명') continue;
    const rawMonth = String(r[colMap['월'] || colMap['회차'] || 0] || '').trim();
    const mNum = parseInt(rawMonth.replace(/[^0-9]/g, ''), 10);
    const isMopyeong = [6, 9].includes(mNum);
    const examName = `${mNum}월 ${isMopyeong ? '모평' : '학평'}`;
    const grade = Number(r[colMap['학년']] || 3);
    const cNum = r[colMap['반'] || colMap['학급']] || '';
    const sNum = r[colMap['번호']] || '';

    tentativeRecords.push({
      grade,
      month: String(mNum),
      examName,
      name,
      classNum: cNum,
      studentNum: sNum,
      studentKey: `${grade}-${cNum}-${sNum}_${name}`,
      korGrade: parseGradeValue(r[colMap['국어등급'] || colMap['국어(등급)']]),
      mathGrade: parseGradeValue(r[colMap['수학등급'] || colMap['수학(등급)']]),
      engGrade: parseGradeValue(r[colMap['영어등급'] || colMap['영어(등급)']]),
      inq1Grade: parseGradeValue(r[colMap['탐구1등급'] || colMap['탐구1(등급)']]),
      inq2Grade: parseGradeValue(r[colMap['탐구2등급'] || colMap['탐구2(등급)']]),
      inquiry1: r[colMap['탐구1(과목)'] || colMap['선택1']] || '',
      inquiry2: r[colMap['탐구2(과목)'] || colMap['선택2']] || ''
    });
  }

  // Smart merge simulation
  const hasAnyMockScore = (r) => r.korGrade != null || r.mathGrade != null || r.engGrade != null || r.inq1Grade != null;
  const validResult = resultRecords.filter(hasAnyMockScore);
  const validTentative = tentativeRecords.filter(hasAnyMockScore);

  const resultExamMonths = new Set(validResult.map(r => r.month));
  const resultSet = new Set(validResult.map(r => `${r.month}_${r.studentKey}`));
  const fallback = [];
  validTentative.forEach(tr => {
    if (!resultExamMonths.has(tr.month)) {
      fallback.push(tr);
    } else if (!resultSet.has(`${tr.month}_${tr.studentKey}`)) {
      fallback.push({ ...tr, isFallback: true });
    }
  });

  const merged = [...validResult, ...fallback];
  // Filter for highSchoolMockRecords: Number(r.grade) === 3 || !r.grade
  const g3All = merged.filter(r => Number(r.grade) === 3 || !r.grade);

  console.log('Total G3 mock records in system:', g3All.length);
  const months = ['3', '5', '6', '7', '9', '10'];
  for (const m of months) {
    const mRecs = g3All.filter(r => r.month === m);
    const korRecs = mRecs.filter(r => r.korGrade != null);
    const mathRecs = mRecs.filter(r => r.mathGrade != null);
    const engRecs = mRecs.filter(r => r.engGrade != null);
    const inqRecs = mRecs.filter(r => r.inq1Grade != null || r.inq2Grade != null);

    const avg = arr => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : '-';

    console.log(`\n=== Month ${m} (Total students: ${mRecs.length}) ===`);
    console.log(`  국어: count=${korRecs.length}, avg=${avg(korRecs.map(r => r.korGrade))}`);
    console.log(`  수학: count=${mathRecs.length}, avg=${avg(mathRecs.map(r => r.mathGrade))}`);
    console.log(`  영어: count=${engRecs.length}, avg=${avg(engRecs.map(r => r.engGrade))}`);
    console.log(`  탐구: count=${inqRecs.length}`);
  }
}

testTrend();

