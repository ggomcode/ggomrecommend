import * as XLSX from 'xlsx';

/**
 * 엑셀 파일 버퍼 및 파일명을 받아 문서 유형(ADDRESS / ACADEMIC) 및 학급 정보(class_no) 파싱
 */
export function identifyExcelFile(file, workbook) {
  const fileName = file.name || '';
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // A3 셀 (인덱스 row: 2, col: 0) 읽기
  const cellA3 = worksheet['A3'] ? String(worksheet['A3'].v || '').trim() : '';

  let classNo = null;
  // A3 또는 파일명에서 반 정보 추출 (예: '3학년 5반' -> 5)
  const classMatch = cellA3.match(/(\d+)반/) || fileName.match(/(\d+)반/);
  if (classMatch) {
    classNo = parseInt(classMatch[1], 10);
  }

  let fileType = 'UNKNOWN';
  if (fileName.includes('주소') || fileName.includes('인적사항')) {
    fileType = 'ADDRESS';
  } else if (fileName.includes('학적')) {
    fileType = 'ACADEMIC';
  } else {
    // 셀 내용 기반 추정
    const jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const fullText = JSON.stringify(jsonRows);
    if (fullText.includes('학적변동') || fullText.includes('전입') || fullText.includes('전출')) {
      fileType = 'ACADEMIC';
    } else if (fullText.includes('주소')) {
      fileType = 'ADDRESS';
    }
  }

  return {
    fileName,
    fileType,
    classNo,
    cellA3
  };
}

/**
 * 주소 텍스트 분리 및 읍/면/리 포함 여부 판별
 */
export function parseAddressText(rawAddress) {
  if (!rawAddress || typeof rawAddress !== 'string') {
    return {
      raw: '',
      addresses: [],
      hasRural: false,
      isMultiple: false
    };
  }

  const clean = rawAddress.trim();
  if (!clean) {
    return { raw: '', addresses: [], hasRural: false, isMultiple: false };
  }

  // 주소가 2개 이상 연속되어 기재된 경우 분리 (예: 경기도...경기도... 또는 신/구 주소 혼재)
  // 도/특별시/광역시 명칭 단위로 구분 시도
  const regexDo = /(?=경기도|강원특별자치도|강원도|충청북도|충청남도|전라북도|전북특별자치도|전라남도|경상북도|경상남도|제주특별자치도|서울특별시|부산광역시|대구광역시|인천광역시|광주광역시|대전광역시|울산광역시|세종특별자치시)/g;

  let addressList = clean.split(regexDo).map(s => s.trim()).filter(Boolean);
  if (addressList.length === 0) {
    addressList = [clean];
  }

  // 읍 / 면 / 리 포함 여부 검사 (단, '동'으로 끝나는 일반 도시구역 제외)
  // 예: '포곡읍', '모현읍', '삼계리', '양지면'
  const ruralPattern = /(?:[가-힣]+(?:읍|면|리))(?:\s|[0-9,()!]|$)/;
  const hasRural = addressList.some(addr => ruralPattern.test(addr));

  return {
    raw: clean,
    addresses: addressList,
    hasRural,
    isMultiple: addressList.length > 1
  };
}

/**
 * 인적사항_주소_X반.xlsx 파싱 (NEIS 'xls data' 양식 & 'xls' 양식 자동 구별 대응)
 */
export function parseAddressExcel(workbook, fallbackClassNo) {
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  // A3 셀 또는 시트명 기반 반 확인
  const cellA3 = worksheet['A3'] ? String(worksheet['A3'].v || '').trim() : '';
  let classMatch = cellA3.match(/(\d+)반/);
  if (!classMatch && firstSheetName) {
    classMatch = firstSheetName.match(/(\d+)반/);
  }
  const classNo = classMatch ? parseInt(classMatch[1], 10) : fallbackClassNo;

  // 1. 컬럼 위치 스마트 자동 구별 (Format 1: A열 번호, B열 이름, E열 주소 vs Format 2: B열 번호, C열 이름, I열 주소)
  let seqCol = 0;      // 기본값 A열 (0)
  let nameCol = 1;     // 기본값 B열 (1)
  let addressCol = 4;  // 기본값 E열 (4)

  // 1-1. 헤더행(0~5행)에서 컬럼 제목 탐색
  for (let r = 0; r < Math.min(rows.length, 6); r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    for (let c = 0; c < row.length; c++) {
      const txt = String(row[c] || '').trim();
      if (txt === '번호' || txt === '연번' || txt === '순번') {
        seqCol = c;
      } else if (txt === '성명' || txt === '이름' || txt === '학생명') {
        nameCol = c;
      } else if (txt.includes('주소') || txt.includes('도로명') || txt.includes('소재지')) {
        addressCol = c;
      }
    }
  }

  // 1-2. 헤더 명칭 미발견 시 데이터행(2~10행) 실데이터 패턴으로 자동 추정
  for (let r = 2; r < Math.min(rows.length, 10); r++) {
    const row = rows[r];
    if (!row || row.length < 3) continue;

    const col0Val = parseInt(String(row[0] || '').trim(), 10);
    const col1Val = parseInt(String(row[1] || '').trim(), 10);

    // Format 2: B열(1)이 숫자(1, 2, 3...)이고 C열(2)에 학생 이름이 있는 경우 (B열 번호, C열 이름, I열 주소)
    if (isNaN(col0Val) && !isNaN(col1Val) && col1Val > 0) {
      seqCol = 1;       // B열
      nameCol = 2;      // C열
      addressCol = row.length > 8 ? 8 : (row.length > 7 ? 7 : 8); // I열 (index 8)
      break;
    }
    // Format 1: A열(0)이 숫자(1, 2, 3...)인 경우 (A열 번호, B열 이름, E열 주소)
    else if (!isNaN(col0Val) && col0Val > 0) {
      seqCol = 0;       // A열
      nameCol = 1;      // B열
      addressCol = 4;   // E열
      break;
    }
  }

  const result = [];

  // 데이터행 탐색
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length < 2) continue;

    // 번호 및 학생명 스마트 추출 (Format 1: A열 번호, B열 이름 vs Format 2: B열 번호, C열 이름)
    let seqNo = parseInt(String(row[seqCol] || '').trim(), 10);
    let studentName = String(row[nameCol] || '').trim();

    if (isNaN(seqNo) || seqNo <= 0) {
      // fallback 1: A열 번호, B열 이름
      const seqA = parseInt(String(row[0] || '').trim(), 10);
      if (!isNaN(seqA) && seqA > 0) {
        seqNo = seqA;
        studentName = String(row[1] || '').trim();
      } else {
        // fallback 2: B열 번호, C열 이름
        const seqB = parseInt(String(row[1] || '').trim(), 10);
        if (!isNaN(seqB) && seqB > 0) {
          seqNo = seqB;
          studentName = String(row[2] || '').trim();
        }
      }
    }

    if (isNaN(seqNo) || seqNo <= 0 || !studentName) continue; // 헤더행 및 숫자/이름 없는 행 무시

    // 주소 텍스트 스마트 추출
    let addressVal = '';

    // 1) 지정된 addressCol 컬럼 확인
    if (row[addressCol]) {
      const candidate = String(row[addressCol]).trim();
      if (candidate.length >= 5 && (
        candidate.includes('도') || candidate.includes('시') || candidate.includes('군') || 
        candidate.includes('구') || candidate.includes('읍') || candidate.includes('면') || 
        candidate.includes('동') || candidate.includes('리') || candidate.includes('길') || candidate.includes('로')
      )) {
        addressVal = candidate;
      }
    }

    // 2) addressCol이 비어있거나 주소가 아니면 행 전체 열(index 2 이상) 탐색
    if (!addressVal) {
      for (let c = 2; c < row.length; c++) {
        const candidate = String(row[c] || '').trim();
        if (candidate.length >= 5 && (
          candidate.includes('도') || candidate.includes('시') || candidate.includes('군') || 
          candidate.includes('구') || candidate.includes('읍') || candidate.includes('면') || 
          candidate.includes('동') || candidate.includes('리') || candidate.includes('길') || candidate.includes('로')
        )) {
          addressVal = candidate;
          break;
        }
      }
    }

    const addressInfo = parseAddressText(addressVal);

    result.push({
      classNo,
      seqNo,
      studentName,
      rawAddress: addressInfo.raw,
      hasRuralAddress: addressInfo.hasRural,
      isMultipleAddress: addressInfo.isMultiple
    });
  }

  return {
    classNo,
    students: result
  };
}

/**
 * 학적 변동 텍스트에서 학교명 추출
 */
export function extractSchoolNames(recordText) {
  if (!recordText) return [];

  // 예: '포곡중학교 졸업', '삼계고등학교 입학', '용인고 전입'
  const schoolRegex = /([가-힣A-Za-z0-9]+(?:중학교|고등학교|중학|고교))/g;
  const matches = recordText.match(schoolRegex) || [];

  // 중복 제거
  return Array.from(new Set(matches.map(m => m.trim())));
}

/**
 * 학적사항_X반.xlsx 파싱 (빈 셀 기반 다중 행 머지)
 */
export function parseAcademicExcel(workbook, fallbackClassNo) {
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  // A3 셀 기반 반 확인
  const cellA3 = worksheet['A3'] ? String(worksheet['A3'].v || '').trim() : '';
  const classMatch = cellA3.match(/(\d+)반/);
  const classNo = classMatch ? parseInt(classMatch[1], 10) : fallbackClassNo;

  const students = [];
  let currentStudent = null;

  for (let r = 3; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const seqVal = row[0]; // A열: 번호
    const nameVal = row[1]; // B열: 이름
    const dateVal = row[2]; // C열: 날짜
    const recordVal = row[3]; // D열: 학적변동사항

    const seqNo = parseInt(String(seqVal).trim(), 10);

    // A열에 번호가 적혀있으면 -> 새로운 학생 블록 시작
    if (!isNaN(seqNo) && seqNo > 0) {
      const studentName = String(nameVal || '').trim();
      if (studentName) {
        currentStudent = {
          classNo,
          seqNo,
          studentName,
          records: []
        };
        students.push(currentStudent);
      }
    }

    // 현재 할당된 학생이 있고, C열/D열 학적 기록이 존재하는 경우
    if (currentStudent && (dateVal || recordVal)) {
      const recordText = String(recordVal || '').trim();
      const dateText = String(dateVal || '').trim();
      const extractedSchools = extractSchoolNames(recordText);

      // 무시 조건: 헤더행 ('날짜', '학적변동사항' 등)
      if (dateText === '날짜' || recordText === '학적변동사항') continue;

      currentStudent.records.push({
        seqOrder: currentStudent.records.length + 1,
        recordDate: dateText,
        rawRecordText: recordText,
        extractedSchools
      });
    }
  }

  return {
    classNo,
    students
  };
}
