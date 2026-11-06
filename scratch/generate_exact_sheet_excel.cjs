const fs = require('fs');
const XLSX = require('xlsx');

const KCUE_MOCK_44_HEADERS_ROW1 = [
  '월', '계열번호', '학년', '반', '번호', '이름',
  '국어', '', '', '', '', '', '',
  '수학', '', '', '', '', '', '',
  '영어', '', '', '',
  '탐구영역',
  '선택1', '', '', '', '',
  '선택2', '', '', '', '',
  '한국사', '', '', '',
  '제2외국어', '', '', '', ''
];

const KCUE_MOCK_44_HEADERS_ROW2 = [
  '', '', '', '', '', '',
  '국어선택', '공통원점수', '선택원점수', '원점수총점', '표준점수', '백분위', '등급',
  '수학선택', '공통원점수', '선택원점수', '원점수총점', '표준점수', '백분위', '등급',
  '원점수', '표준점수', '백분위', '등급',
  '',
  '과목명', '원점수', '표준점수', '백분위', '등급',
  '과목명', '원점수', '표준점수', '백분위', '등급',
  '원점수', '표준점수', '백분위', '등급',
  '과목명', '원점수', '표준점수', '백분위', '등급'
];

const p = 'G:/내 드라이브/3학년부/시험 관련/10월/2026년 03월_모의고사 선택회차 자료.xlsx';
const wb = XLSX.readFile(p);
const ws = wb.Sheets[wb.SheetNames[0]];
const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1 });

let currentArea = '';
const colMap = {};
const maxCols = Math.max(rawRows[0]?.length || 0, rawRows[1]?.length || 0);
for (let c = 0; c < maxCols; c++) {
  const top = String(rawRows[0]?.[c] || '').trim();
  if (top) currentArea = top;
  const sub = String(rawRows[1]?.[c] || '').trim();
  const full = (sub ? `${currentArea}_${sub}` : currentArea).replace(/\s+/g, '');
  colMap[full] = c;
}

const parseNum = (v) => {
  if (v === undefined || v === null || v === '' || v === '-') return '';
  const n = Number(String(v).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? '' : n;
};

const getVal = (row, ...keys) => {
  for (const k of keys) {
    const cleanK = k.replace(/\s+/g, '');
    const idx = colMap[cleanK];
    if (idx !== undefined && row[idx] !== undefined && row[idx] !== null && String(row[idx]).trim() !== '') {
      return String(row[idx]).trim();
    }
  }
  return '';
};

const outputRows = [
  KCUE_MOCK_44_HEADERS_ROW1,
  KCUE_MOCK_44_HEADERS_ROW2
];

for (let r = 2; r < rawRows.length; r++) {
  const row = rawRows[r];
  if (!row || row.length === 0) continue;
  const name = getVal(row, '이름', '성명', '학생명');
  if (!name) continue;

  const grade = Number(getVal(row, '학년')) || 3;
  const classNum = String(getVal(row, '반') || '1');
  const studentNum = Number(getVal(row, '번호')) || (r - 1);

  outputRows.push([
    3,                                                      // A: 월 (3)
    1,                                                      // B: 계열번호 (1)
    grade,                                                  // C: 학년
    classNum,                                               // D: 반
    studentNum,                                             // E: 번호
    name,                                                   // F: 이름
    getVal(row, '국어_선택') || '화법과 작문',              // G: 국어선택
    '',                                                     // H: 공통원점수
    '',                                                     // I: 선택원점수
    parseNum(getVal(row, '국어_원점수')),                   // J: 원점수총점
    parseNum(getVal(row, '국어_표준점수')),                 // K: 표준점수
    parseNum(getVal(row, '국어_백분위')),                   // L: 백분위
    parseNum(getVal(row, '국어_등급')),                     // M: 등급
    getVal(row, '수학_선택') || '확률과 통계',              // N: 수학선택
    '',                                                     // O: 공통원점수
    '',                                                     // P: 선택원점수
    parseNum(getVal(row, '수학_원점수')),                   // Q: 원점수총점
    parseNum(getVal(row, '수학_표준점수')),                 // R: 표준점수
    parseNum(getVal(row, '수학_백분위')),                   // S: 백분위
    parseNum(getVal(row, '수학_등급')),                     // T: 등급
    parseNum(getVal(row, '영어_원점수')),                   // U: 영어 원점수
    '',                                                     // V: 영어 표준점수
    '',                                                     // W: 영어 백분위
    parseNum(getVal(row, '영어_등급')),                     // X: 영어 등급
    '',                                                     // Y: 탐구영역
    getVal(row, '탐구영역1_선택', '탐구1_선택') || '',      // Z: 선택1 과목명
    parseNum(getVal(row, '탐구영역1_원점수', '탐구1_원점수')), // AA: 선택1 원점수
    parseNum(getVal(row, '탐구영역1_표준점수', '탐구1_표준점수')), // AB: 선택1 표준점수
    parseNum(getVal(row, '탐구영역1_백분위', '탐구1_백분위')),     // AC: 선택1 백분위
    parseNum(getVal(row, '탐구영역1_등급', '탐구1_등급')),         // AD: 선택1 등급
    getVal(row, '탐구영역2_선택', '탐구2_선택') || '',      // AE: 선택2 과목명
    parseNum(getVal(row, '탐구영역2_원점수', '탐구2_원점수')), // AF: 선택2 원점수
    parseNum(getVal(row, '탐구영역2_표준점수', '탐구2_표준점수')), // AG: 선택2 표준점수
    parseNum(getVal(row, '탐구영역2_백분위', '탐구2_백분위')),     // AH: 선택2 백분위
    parseNum(getVal(row, '탐구영역2_등급', '탐구2_등급')),         // AI: 선택2 등급
    parseNum(getVal(row, '한국사_원점수')),                 // AJ: 한국사 원점수
    '',                                                     // AK: 한국사 표점
    '',                                                     // AL: 한국사 백분위
    parseNum(getVal(row, '한국사_등급')),                   // AM: 한국사 등급
    getVal(row, '제2외국어_과목명') || '',                  // AN: 제2외국어 과목명
    parseNum(getVal(row, '제2외국어_원점수')),              // AO: 제2외국어 원점수
    '',                                                     // AP: 제2외국어 표점
    '',                                                     // AQ: 제2외국어 백분위
    parseNum(getVal(row, '제2외국어_등급'))                 // AR: 제2외국어 등급
  ]);
}

const outWs = XLSX.utils.aoa_to_sheet(outputRows);
const outWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(outWb, outWs, '2027모의결과');

const targetXlsx = 'G:/내 드라이브/3학년부/시험 관련/10월/2027모의결과_3월학평_전교생_44컬럼_완성본.xlsx';
const targetCsv = 'G:/내 드라이브/3학년부/시험 관련/10월/2027모의결과_3월학평_전교생_44컬럼_완성본.csv';

XLSX.writeFile(outWb, targetXlsx);
const csvContent = XLSX.utils.sheet_to_csv(outWs);
fs.writeFileSync(targetCsv, '\uFEFF' + csvContent, 'utf8');

console.log('Regenerated successfully! Total student rows:', outputRows.length - 2);
console.log('Sample student 1 (고윤):', JSON.stringify(outputRows[2]));
