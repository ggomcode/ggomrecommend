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
 * 인적사항_주소_X반.xlsx 파싱
 */
export function parseAddressExcel(workbook, fallbackClassNo) {
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  // A3 셀 기반 반 확인
  const cellA3 = worksheet['A3'] ? String(worksheet['A3'].v || '').trim() : '';
  const classMatch = cellA3.match(/(\d+)반/);
  const classNo = classMatch ? parseInt(classMatch[1], 10) : fallbackClassNo;

  const result = [];

  // 데이터행 탐색 (보통 4~5행 이후)
  for (let r = 3; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const seqVal = row[0]; // A열: 번호
    const nameVal = row[1]; // B열: 이름
    const addressVal = row[4] || row[3] || row[2]; // E열 (0-indexed 4): 주소 (fallback D/C열)

    // A열 번호 숫자 체크
    const seqNo = parseInt(String(seqVal).trim(), 10);
    if (isNaN(seqNo) || seqNo <= 0) continue; // 번호가 없거나 '번호', '성명' 등 헤더행 무시

    const studentName = String(nameVal || '').trim();
    if (!studentName) continue;

    const addressInfo = parseAddressText(String(addressVal || ''));

    result.push({
      classNo,
      seqNo,
      studentName,
      rawAddress: addressInfo.raw,
      parsedAddresses: addressInfo.addresses,
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
