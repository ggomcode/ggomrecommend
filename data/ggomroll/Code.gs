/**
 * [설정] PDF 결석계 및 서명 이미지가 저장될 구글 드라이브 폴더 ID (스크립트 속성에서 로드)
 */
const scriptProperties = PropertiesService.getScriptProperties();
const FOLDER_ID = scriptProperties.getProperty("FOLDER_ID") || "";
const parentFolderId = scriptProperties.getProperty("parentFolderId") || "";
const studentFolderId = scriptProperties.getProperty("studentFolderId") || "";
const targetRow = scriptProperties.getProperty("targetRow") || "";

/**
 * [설정] 시스템 기본값 (학년, 반 구성)
 * 학추 시스템 및 스크립트 속성과 연동
 */
const TARGET_GRADE = Number(scriptProperties.getProperty("TARGET_GRADE")) || 3;  // 0: 전체 학년 필터링 없음, 1~6: 해당 학년 전용
const MAX_GRADE = Number(scriptProperties.getProperty("MAX_GRADE")) || 3;     // 최대 학년 (고교: 3, 초교: 6)
const MAX_CLASS = Number(scriptProperties.getProperty("MAX_CLASS")) || 11;    // 최대 반 수
const MAX_NUMBER = Number(scriptProperties.getProperty("MAX_NUMBER")) || 35;   // 최대 번호 수

/**
 * 1. 웹 앱 접속 및 데이터 연동 (GET)
 */
function doGet(e) {
  const action = e && e.parameter && e.parameter.action;

  // 외부 API 호출 대응 (JSON 반환)
  if (action) {
    try {
      let result = { status: 'error', message: '알 수 없는 요청 액션: ' + action };

      if (action === 'getHolidays') {
        result = { status: 'success', holidays: getHolidays() };
      } else if (action === 'getSettings') {
        result = { status: 'success', settings: getAppSettings() };
      } else if (action === 'search' || action === 'searchRecords') {
        result = { status: 'success', data: searchRecords(e.parameter) };
      } else if (action === 'getDetail' || action === 'getRecordDetail') {
        result = { status: 'success', data: getRecordDetail(e.parameter.rowNo) };
      }

      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: err.toString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  // HTML 웹 화면 서빙 (index.html or index2.html)
  const page = (e && e.parameter && e.parameter.page) || 'index';
  const fileName = (page === 'search' || page === 'index2') ? 'index2' : 'index';
  
  return HtmlService.createHtmlOutputFromFile(fileName)
      .setTitle('결석계 작성 관리')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * 1-2. 외부 웹 앱 연동 API (POST) - ggomrecommend 선택교과 출석관리 연동
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action || (payload.records ? 'saveAttendance' : '');
    let result = { status: 'error', message: '알 수 없는 요청 액션: ' + action };

    if (action === 'saveAttendance' || payload.records) {
      // '출결기록' 시트에 출결 오버라이드 실시간 동기화
      result = saveAttendanceRecordsToSheet(payload.records || payload);
    } else if (action === 'submitReport' || action === 'createAbsenceReport') {
      // 결석계 작성 및 대장 등록, PDF 생성
      result = processFormData(payload.data || payload);
    } else if (action === 'printReport' || action === 'generateSinglePdf') {
      // 인쇄 시트에만 매핑하고 PDF 바로 생성 (대장 등록 생략 옵션)
      result = printReportOnly(payload.data || payload);
    } else if (action === 'recreatePdf') {
      // 대장 특정 행 PDF 재생성
      result = recreateReportPdf(payload.rowNo);
    } else if (action === 'generateMergedPdf') {
      // 일괄 PDF 생성
      result = generateMergedPdf(payload.rowNos);
    } else if (action === 'updateReportRecord') {
      // 대장 기록 수정
      result = updateReportRecord(payload.data || payload);
    } else if (action === 'deleteReportRecord') {
      // 대장 기록 삭제
      result = deleteReportRecord(payload.rowNo);
    } else if (action === 'getRecordDetail') {
      result = { status: 'success', data: getRecordDetail(payload.rowNo) };
    } else if (action === 'searchRecords') {
      result = { status: 'success', data: searchRecords(payload.query || payload) };
    } else if (action === 'getHolidays') {
      result = { status: 'success', holidays: getHolidays() };
    } else if (action === 'syncAttendanceToRegistry') {
      // 출결기록의 출결 사항을 대장에 등록하고 인쇄 시트로 PDF 생성
      result = syncAttendanceToRegistry(payload.data || payload);
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    console.error("doPost 오류:", err);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 클라이언트 설정값 전달 함수
 */
function getAppSettings() {
  return {
    targetGrade: TARGET_GRADE,
    maxGrade: MAX_GRADE,
    maxClass: MAX_CLASS,
    maxNumber: MAX_NUMBER
  };
}

/**
 * 교사용: 대장 시트에서 기록을 검색하는 함수
 */
function searchRecords(query) {
  try {
    console.log("검색 요청 데이터:", JSON.stringify(query));
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const db = ss.getSheetByName("대장");
    if (!db) {
      console.error("'대장' 시트를 찾을 수 없습니다.");
      return { error: "'대장' 시트를 찾을 수 없습니다." };
    }

    const data = db.getDataRange().getValues();
    if (data.length <= 1) return []; // 헤더만 있는 경우

    const rows = data.slice(1);
    
    let filtered;
    if (typeof query === 'object' && query !== null && !Array.isArray(query)) {
      // 학년/반/번호 구조적 검색 (드롭다운 방식)
      filtered = rows.filter(row => {
        const rowGrade = String(row[1] || "").trim();
        const rowClass = String(row[2] || "").trim();
        const rowNumber = String(row[3] || "").trim();
        
        let match = true;
        if (query.grade && query.grade !== "") match = match && (rowGrade === String(query.grade));
        if (query.classNum && query.classNum !== "") match = match && (rowClass === String(query.classNum));
        if (query.number && query.number !== "") match = match && (rowNumber === String(query.number));
        return match;
      });
    } else {
      // 기존 검색 (학번 또는 이름 문자열 검색)
      const searchStr = String(query || "").toLowerCase();
      filtered = rows.filter(row => {
        const studentId = `${row[1]}${String(row[2] || "").padStart(2, '0')}${String(row[3] || "").padStart(2, '0')}`; // 30101 형식
        const studentName = String(row[4] || "");
        
        return studentId.includes(searchStr) || studentName.toLowerCase().includes(searchStr);
      });
    }

    // [추가] 월별 필터링 (학년도 기준: YYYY-MM)
    if (query.month && query.month !== "") {
      const [qYear, qMonth] = query.month.split("-").map(Number);
      filtered = filtered.filter(row => {
        const startDate = row[13] instanceof Date ? row[13] : new Date(row[13]);
        const endDate = row[15] instanceof Date ? row[15] : new Date(row[15]);
        
        const startMatch = !isNaN(startDate.getTime()) && 
                          startDate.getFullYear() === qYear && 
                          (startDate.getMonth() + 1) === qMonth;
        const endMatch = !isNaN(endDate.getTime()) && 
                        endDate.getFullYear() === qYear && 
                        (endDate.getMonth() + 1) === qMonth;
        
        return startMatch || endMatch;
      });
    }

    console.log("검색 결과 수:", filtered.length);

    // [변경] 사용자 요청 정렬 우선순위 적용
    filtered.sort((a, b) => {
      // 1. 시작일 내림차순 (DESC)
      const dateA = a[13] instanceof Date ? a[13].getTime() : new Date(a[13]).getTime();
      const dateB = b[13] instanceof Date ? b[13].getTime() : new Date(b[13]).getTime();
      if (!isNaN(dateA) && !isNaN(dateB) && dateB !== dateA) return dateB - dateA;

      // 2. 학년-반-번호 오름차순 (ASC)
      if (a[1] !== b[1]) return Number(a[1]) - Number(b[1]);
      if (a[2] !== b[2]) return Number(a[2]) - Number(b[2]);
      if (a[3] !== b[3]) return Number(a[3]) - Number(b[3]);

      // 3. 구분 (결석-조퇴-지각-결과)
      const getCatRank = (r) => {
        if (r[5]) return 0; // 결석
        if (r[7]) return 1; // 조퇴
        if (r[6]) return 2; // 지각
        if (r[8]) return 3; // 결과
        return 99;
      };
      const catRankA = getCatRank(a);
      const catRankB = getCatRank(b);
      if (catRankA !== catRankB) return catRankA - catRankB;

      // 4. 종류 (질병-생리통-출석인정-기타)
      const getTypeRank = (r) => {
        if (r[9]) return 0;  // 질병
        if (r[10]) return 1; // 생리통
        if (r[11]) return 2; // 출석인정 (경조사 등)
        if (r[12]) return 3; // 기타
        return 99;
      };
      const typeRankA = getTypeRank(a);
      const typeRankB = getTypeRank(b);
      return typeRankA - typeRankB;
    });

    // 가공하여 반환
    return filtered.map(row => {
      let formattedDate = "-";
      try {
        if (row[13]) {
          const d = new Date(row[13]);
          if (!isNaN(d.getTime())) {
            formattedDate = Utilities.formatDate(d, "GMT+9", "yyyy-MM-dd");
          } else {
            formattedDate = String(row[13]);
          }
        }
      } catch (e) {
        formattedDate = String(row[13] || "-");
      }

      return {
        no: row[0],
        grade: row[1],
        class: row[2],
        number: row[3],
        name: row[4],
        cat: row[5] ? "결석" : row[6] ? "지각" : row[7] ? "조퇴" : row[8] ? "결과" : "-",
        type: row[9] ? "질병" : row[10] ? "생리통" : row[11] ? "출석인정" : row[12] ? "기타" : "-",
        startDate: formattedDate,
        pdfUrl: row[35] || null // AJ열 (index 35)
      };
    });

  } catch (e) {
    console.error("검색 중 오류: " + e.toString());
    return { error: e.toString() };
  }
}

// '행사및휴일' 시트 연동 (기존 holiday.gs 대체)
function getHolidays() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("행사및휴일") || ss.getSheetByName("휴일");
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    const holidays = [];
    for (let i = 1; i < data.length; i++) {
      const val = data[i][0]; // A열: 날짜
      if (!val) continue;

      if (val instanceof Date && !isNaN(val.getTime())) {
        holidays.push(Utilities.formatDate(val, "GMT+9", "yyyy-MM-dd"));
      } else {
        const strVal = String(val).trim();
        const m = strVal.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
        if (m) {
          const y = m[1];
          const mm = m[2].padStart(2, '0');
          const dd = m[3].padStart(2, '0');
          holidays.push(`${y}-${mm}-${dd}`);
        }
      }
    }
    return Array.from(new Set(holidays)).sort();
  } catch (e) {
    console.warn("행사및휴일 시트 읽기 실패: " + e.message);
    return [];
  }
}

/**
 * 2. 웹 앱 [제출] 버튼 클릭 시 실행되는 통합 로직
 */
function processFormData(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const db = ss.getSheetByName("대장");
    const printSheet = ss.getSheetByName("인쇄");

    if (!db || !printSheet) throw new Error("'대장' 또는 '인쇄' 시트를 찾을 수 없습니다.");

    // [강화] 서버 측 필수 데이터 검증
    if (!data.grade || !data.class || !data.number || !data.name) {
      throw new Error("학번 정보(학년, 반, 번호)와 학생 성명은 필수 입력 사항입니다.");
    }

    const dateValidationError = validateFormDataDates(data);
    if (dateValidationError) {
      throw new Error(dateValidationError);
    }

    // [AA] 파일명 생성을 위한 학번 5자리 및 날짜 가공
    const grade = data.grade;
    const classNum = String(data.class).padStart(2, '0');
    const studentNum = String(data.number).padStart(2, '0');
    const studentId = `${grade}${classNum}${studentNum}`;
    
    const cleanDate = data.startDate.replace(/-/g, '');
    
    // 파일명 조합 (문자열)
    const customFileName = `${studentId}_${data.name}_${cleanDate}_${data.cat}_${data.type}`;

    // [B] 인쇄 시트에 데이터 매핑
    mapDataToPrintSheet(printSheet, data);
    SpreadsheetApp.flush(); 

    // [C] PDF 생성 호출
    let pdfUrl = "";
    try {
      pdfUrl = PDFService.generate(ss, printSheet, customFileName, {
        studentSigId: data.studentSigId,
        parentSigId: data.parentSigId
      }); 
    } catch (pdfErr) {
      // PDF 생성 실패 시에도 대기록은 남기되 PDF URL 없이 진행
      saveToDatabase(data, null);
      return {
        status: "partial_success",
        message: "대장 기록은 성공했으나 PDF 생성에 실패했습니다: " + pdfErr.message,
        pdfUrl: null
      };
    }

    // [D] 대장 시트에 모든 링크 포함하여 최종 저장
    saveToDatabase(data, pdfUrl);

    return {
      status: "success",
      message: `${data.name} 학생의 결석계가 성공적으로 접수되었습니다.`,
      pdfUrl: pdfUrl
    };

  } catch (e) {
    return { status: "error", message: e.toString() };
  }
}

/**
 * 3. 인쇄 시트 매핑 함수 (웹 앱 데이터 -> 인쇄 시트 좌표)
 */
function mapDataToPrintSheet(print, data) {
  print.getRange("S10").setValue(data.grade);
  print.getRange("V10").setValue(data.class);
  print.getRange("X10").setValue(data.number);
  print.getRange("T12").setValue(data.name);

  const isAbsence = data.cat === "결석";
  print.getRange("G7").setValue(isAbsence); print.getRange("O14").setValue(isAbsence);
  print.getRange("K7").setValue(data.cat === "지각"); print.getRange("R14").setValue(data.cat === "지각");
  print.getRange("O7").setValue(data.cat === "조퇴"); print.getRange("U14").setValue(data.cat === "조퇴");
  print.getRange("R7").setValue(data.cat === "결과"); print.getRange("X14").setValue(data.cat === "결과");

  print.getRange("C10").setValue(data.type === "질병");
  print.getRange("C11").setValue(data.type === "생리통" || data.type === "출석인정");
  print.getRange("C12").setValue(data.type === "기타");

  const sd = new Date(data.startDate + "T12:00:00");
  const ed = new Date(data.endDate + "T12:00:00");
  const wd = new Date(data.writeDate + "T12:00:00");
  const cd = data.confirmDate ? new Date(data.confirmDate + "T12:00:00") : null;
  const td = data.teacherDate ? new Date(data.teacherDate + "T12:00:00") : null;

  if (sd instanceof Date && !isNaN(sd.getTime())) {
    print.getRange("F17").setValue(sd.getFullYear());
    print.getRange("H17").setValue(sd.getMonth() + 1);
    print.getRange("J17").setValue(sd.getDate());
  } else {
    print.getRange("F17").clearContent();
    print.getRange("H17").clearContent();
    print.getRange("J17").clearContent();
  }

  if (ed instanceof Date && !isNaN(ed.getTime())) {
    print.getRange("P17").setValue(ed.getMonth() + 1);
    print.getRange("R17").setValue(ed.getDate());
  } else {
    print.getRange("P17").clearContent();
    print.getRange("R17").clearContent();
  }

  print.getRange("M17").setValue(data.startPeriod);
  print.getRange("T17").setValue(data.endPeriod);
  print.getRange("W17").setValue(data.totalDays);
  print.getRange("F18").setValue(data.reason);
  print.getRange("V22").setValue(data.name);      
  print.getRange("V24").setValue(data.parentName);

  if (wd instanceof Date && !isNaN(wd.getTime())) {
    print.getRange("K20").setValue(wd.getFullYear());
    print.getRange("O20").setValue(wd.getMonth() + 1);
    print.getRange("R20").setValue(wd.getDate());
  } else {
    print.getRange("K20").clearContent();
    print.getRange("O20").clearContent();
    print.getRange("R20").clearContent();
  }

  if (cd instanceof Date && !isNaN(cd.getTime())) {
    print.getRange("K32").setValue(cd.getFullYear());
    print.getRange("O32").setValue(cd.getMonth() + 1);
    print.getRange("R32").setValue(cd.getDate());
  } else {
    print.getRange("K32").clearContent();
    print.getRange("O32").clearContent();
    print.getRange("R32").clearContent();
  }

  if (td instanceof Date && !isNaN(td.getTime())) {
    print.getRange("K48").setValue(td.getFullYear());
    print.getRange("O48").setValue(td.getMonth() + 1);
    print.getRange("R48").setValue(td.getDate());
  } else {
    print.getRange("K48").clearContent();
    print.getRange("O48").clearContent();
    print.getRange("R48").clearContent();
  }

  print.getRange("G33").setValue(data.m_visit);
  print.getRange("K33").setValue(data.m_phone);
  print.getRange("O33").setValue(data.m_school);
  print.getRange("S33").setValue(data.m_other);
  print.getRange("V33").setValue(data.m_other_text); // 기타 확인 방법 텍스트
  print.getRange("G34").setValue(data.confirmDetail);
  print.getRange("T46").setValue(data.teacherName);

  print.getRange("G35:G45").setValue(false);
  print.getRange("G41:G45").clearContent();

  const docsStr = [data.doc1, data.doc2, data.doc3, data.doc4, data.m_other_text].filter(Boolean).join(" ");

  if (data.type === "질병") {
    print.getRange("G35").setValue(docsStr.includes("진료확인서") || docsStr.includes("의사진단서") || docsStr.includes("소견서") || docsStr.includes("처방전") || docsStr.includes("약봉투") || docsStr.includes("병명"));
    print.getRange("G36").setValue(docsStr.includes("담임"));
    print.getRange("G37").setValue(docsStr.includes("학부모"));
  } else if (data.type === "생리통") {
    print.getRange("G38").setValue(docsStr.includes("진료확인서") || docsStr.includes("의사진단서") || docsStr.includes("소견서"));
  } else if (data.type === "출석인정") {
    if (docsStr.includes("의사진단서") || docsStr.includes("소견서") || docsStr.includes("의견서")) print.getRange("G39").setValue(true);
    if (docsStr.includes("경조사")) print.getRange("G40").setValue(true);
    const subType = data.subType || data.editSubType;
    if (subType === "대입 관련" || subType === "기타") {
      print.getRange("G41").setValue(data.doc1 || "");
      print.getRange("G41:Y41").setFontWeight("normal");
    }
  } else {
    // 기타
    print.getRange("G41").setValue(data.doc1);
    print.getRange("G41:Y41").setFontWeight("normal");
  }
}

/**
 * 4. 스프레드시트 메뉴 및 기존 시트 관리 함수 (전체 복구)
 */
function onOpen() {
  // 사용하지 않는 메뉴이므로 비활성화 처리됨
}

function setupInputSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let holidaySheet = ss.getSheetByName("행사및휴일") || ss.getSheetByName("휴일");
  if (!holidaySheet) {
    holidaySheet = ss.insertSheet("행사및휴일");
    holidaySheet.getRange("A1").setValue("날짜(yyyy-mm-dd)");
  }
  let input = ss.getSheetByName("결석계 작성");
  if (!input) { input = ss.insertSheet("결석계 작성"); } 
  else { 
    input.clear(); input.clearFormats(); input.getDataRange().removeCheckboxes();
    input.getDrawings().forEach(d => d.remove());
  }
  input.setColumnWidth(2, 130); 
  for (let i = 3; i <= 10; i++) { input.setColumnWidth(i, i % 2 === 1 ? 85 : 120); }
  input.getRange("J2").setValue("made by murmurgene").setFontSize(7).setHorizontalAlignment("right").setFontColor("#999999");
  input.getRange("B1:J1").merge().setValue("2026학년도 결석계 입력 정보").setBackground("#4A86E8").setFontColor("white").setFontWeight("bold").setHorizontalAlignment("center").setFontSize(18);
  const createList = (start, end) => Array.from({length: end - start + 1}, (_, i) => (i + start).toString());
  input.getRange("B3:B6").setValues([["학년"], ["반"], ["번"], ["학생 성명"]]);
  input.getRange("C3").setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(createList(1, MAX_GRADE)).build()).setValue(TARGET_GRADE || MAX_GRADE);
  input.getRange("C4").setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(createList(1, MAX_CLASS)).build()).setValue("1");
  input.getRange("C5").setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(createList(1, MAX_NUMBER)).build()).setValue("1");
  input.getRange("D3:D5").setValues([["학년"], ["반"], ["번"]]);
  
  const setupDateRow = (row, label, defaultVal) => {
    input.getRange(row, 2).setValue(label);
    input.getRange(row, 3).setValue("📅 날짜입력▶").setBackground("#F3F3F3").setHorizontalAlignment("right").setFontColor("#4A86E8").setFontWeight("bold");
    input.getRange(row, 4).setValue(defaultVal).setNumberFormat("yyyy-mm-dd").setDataValidation(SpreadsheetApp.newDataValidation().requireDate().build());
  };
  setupDateRow(9, "시작일", "2026-03-02");
  setupDateRow(10, "종료일", "2026-03-02");
  setupDateRow(13, "작성일", new Date());
  setupDateRow(17, "담임교사 확인일", new Date());
  setupDateRow(25, "담임교사 작성일", new Date());

  const setGuide = (row, text) => {
    input.getRange(row, 5, 1, 6).merge().setValue(text).setFontSize(15).setVerticalAlignment("middle").setFontColor("#666666");
    input.setRowHeight(row, 35);
  };
  setGuide(13, "※ 보통 오늘 날짜를 적습니다. 필요에 따라 수정할 수 있습니다.");
  setGuide(17, "※ 담임 선생님께 출결 사항에 대해 알려드린 날짜를 적습니다.");
  setGuide(25, "※ 담임선생님께서 학생으로부터 결석계를 제출받은 날짜를 적습니다.");

  const setupCheckRow = (row, label, items) => {
    input.getRange(row, 2).setValue(label);
    items.forEach((item, i) => {
      input.getRange(row, 3 + (i * 2)).insertCheckboxes();
      input.getRange(row, 4 + (i * 2)).setValue(item);
    });
  };
  setupCheckRow(7, "구분", ["결석", "지각", "조퇴", "결과"]);
  setupCheckRow(8, "종류", ["질병", "생리통", "경조사/전염병 등", "기타"]);
  
  const pRule = SpreadsheetApp.newDataValidation().requireValueInList(["1","2","3","4","5","6","7"]).build();
  input.getRange("E9").setDataValidation(pRule).setValue("1");
  input.getRange("E10").setDataValidation(pRule).setValue("7");
  input.getRange("F9").setValue("교시 부터");
  input.getRange("F10").setValue("교시 까지");
  input.getRange("B11").setValue("총 일수");
  input.getRange("C11").setFormula('=IF(AND(ISDATE(D9), ISDATE(D10)), CALCULATE_DAYS(D9, D10) & "일", "")');
  input.getRange("B12").setValue("구체적 사유"); input.getRange("C12:J12").merge();
  input.getRange("B14").setValue("학부모 성함");
  input.getRange("B16:J16").merge().setValue("교사 확인 및 처리란").setBackground("#EEEEEE").setFontWeight("bold");
  setupCheckRow(18, "확인방법", ["가정방문", "전화연락", "학부모내교", "기타"]);
  input.getRange("B19").setValue("확인내용"); input.getRange("C19:J19").merge();
  input.getRange("B20").setValue("첨부 서류"); input.getRange("B20:B23").merge().setVerticalAlignment("top");
  input.getRange("B24").setValue("담임선생님 성함");
  
  input.getRange(3, 2, 12, 9).setBorder(true, true, true, true, true, true);
  input.getRange(16, 2, 10, 9).setBorder(true, true, true, true, true, true);
  input.getRange(3, 2, 12, 1).setBackground("#F3F3F3").setFontWeight("bold");
  input.getRange(17, 2, 9, 1).setBackground("#F3F3F3").setFontWeight("bold");
  ss.toast("초기 설정이 완료되었습니다.", "✨ murmurgene");
}

function goToPrintSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  // 주의: 웹 앱 제출 시에는 processFormData가 실행되므로 이 함수는 시트 내 메뉴 전용입니다.
  createAbsenceReport();
  // saveToDatabase() 에 인자가 필요해졌으므로 시트 메뉴 사용 시 주의가 필요합니다.
  ss.setActiveSheet(ss.getSheetByName("인쇄"));
  ss.toast("Ctrl + P를 눌러 인쇄하세요.", "🖨️ 인쇄 준비 완료");
}

function resetAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const input = ss.getSheetByName("결석계 작성");
  const print = ss.getSheetByName("인쇄");
  input.getRange("C6").clearContent();
  input.getRange("C7:J7").uncheck();
  input.getRange("C8:J8").uncheck();
  input.getRange("C12").clearContent();
  input.getRange("C14").clearContent();
  input.getRange("C18:J18").uncheck();
  input.getRange("C19").clearContent();
  input.getRange("C20:C22").uncheck();
  input.getRange("C23:C24").clearContent();
  const printClearRanges = ["S10", "V10", "X10", "T12", "F17", "H17", "J17", "M17", "P17", "R17", "T17", "W17", "F18", "V22", "V24", "G34", "T46", "K32", "O32", "R32", "K48", "O48", "R48"];
  printClearRanges.forEach(range => print.getRange(range).clearContent());
  print.getRange("G41:G45").clearContent();
  const printCheckBoxRanges = ["G7", "K7", "O7", "R7", "C10", "C11", "C12", "O14", "R14", "U14", "X14", "G33", "K33", "O33", "S33", "G35", "G36", "G37", "G38", "G39", "G40"];
  printCheckBoxRanges.forEach(range => print.getRange(range).setValue(false));
  ss.setActiveSheet(input);
  ss.toast("초기화 완료!", "✨");
}

function CALCULATE_DAYS(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const holidays = getHolidays();
  let count = 0;
  let current = (startDate instanceof Date) ? new Date(startDate.getTime()) : new Date(startDate + "T12:00:00");
  let last = (endDate instanceof Date) ? new Date(endDate.getTime()) : new Date(endDate + "T12:00:00");
  current.setHours(12, 0, 0, 0);
  last.setHours(12, 0, 0, 0);

  if (current > last) return 0;
  while (current <= last) {
    const dStr = Utilities.formatDate(current, "GMT+9", "yyyy-MM-dd");
    if (current.getDay() !== 0 && current.getDay() !== 6 && !holidays.includes(dStr)) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

function onEdit(e) {
  const sheet = e.range.getSheet();
  if (sheet.getName() !== "결석계 작성") return;
  const row = e.range.getRow();
  if ([7, 8, 12].includes(row)) {
    const reason = sheet.getRange("C12").getValue();
    const typeRow = sheet.getRange("C7:J7").getValues()[0];
    const types = ["결석", "지각", "조퇴", "결과"];
    let selType = "";
    for (let i=0; i<4; i++) { if (typeRow[i*2] === true) { selType = types[i]; break; } }
    if (reason && selType) {
      const code = reason.toString().slice(-1).charCodeAt(0);
      let josa = (code >= 44032 && code <= 55203 && (code - 44032) % 28 !== 0 && (code - 44032) % 28 !== 8) ? "으로" : "로";
      sheet.getRange("C19").setValue(`${reason}${josa} 인하여 ${selType}함을 확인함.`);
    }
    if (row === 8) updateAttachmentOptions(sheet);
  }
}

function updateAttachmentOptions(sheet) {
  const catVal = sheet.getRange("C8:J8").getValues()[0];
  let sel = catVal[0] ? "질병" : catVal[2] ? "생리통" : catVal[4] ? "출석인정" : catVal[6] ? "기타" : "";
  const target = sheet.getRange("C20:J23");
  target.clear().clearDataValidations().removeCheckboxes();
  if (["질병", "생리통", "출석인정"].includes(sel)) {
    let list = (sel === "출석인정") ? ["의사진단서", "경조사 증빙", "담임확인 의견서"] : ["의사진단서", "담임확인 의견서", "학부모 의견서", "처방전"];
    list.forEach((t, i) => {
      sheet.getRange(20 + i, 3).insertCheckboxes();
      sheet.getRange(20 + i, 4, 1, 7).merge().setValue(t);
      sheet.setRowHeight(20 + i, 45);
    });
  } else if (sel === "기타") {
    sheet.getRange(20, 3).setValue("서류명:");
    sheet.getRange(20, 4, 1, 7).merge().setBackground("#FFF2CC").setBorder(true, true, true, true, true, true);
  }
}

function createAbsenceReport() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const input = ss.getSheetByName("결석계 작성");
  const print = ss.getSheetByName("인쇄");
  const data = input.getDataRange().getValues();
  const getV = (r, c) => data[r-1][c-1];

  print.getRange("S10").setValue(getV(3, 3)); print.getRange("V10").setValue(getV(4, 3));
  print.getRange("X10").setValue(getV(5, 3)); print.getRange("T12").setValue(getV(6, 3));
  
  const typeRow = data[6];
  const typeCols = [2, 4, 6, 8];
  typeCols.forEach((col, i) => {
    const val = typeRow[col] === true;
    print.getRange(["G7", "K7", "O7", "R7"][i]).setValue(val);
    print.getRange(["O14", "R14", "U14", "X14"][i]).setValue(val);
  });
  
  const catRow = data[7];
  print.getRange("C10").setValue(catRow[2] === true); 
  print.getRange("C11").setValue(catRow[4] === true || catRow[6] === true);
  print.getRange("C12").setValue(catRow[8] === true); 
  
  const sd = new Date(getV(9, 4));
  if (sd instanceof Date) { print.getRange("F17").setValue(sd.getFullYear()); print.getRange("H17").setValue(sd.getMonth()+1); print.getRange("J17").setValue(sd.getDate()); }
  print.getRange("M17").setValue(getV(9, 5));
  
  const ed = new Date(getV(10, 4));
  if (ed instanceof Date) { print.getRange("P17").setValue(ed.getMonth()+1); print.getRange("R17").setValue(ed.getDate()); }
  print.getRange("T17").setValue(getV(10, 5));
  
  print.getRange("W17").setValue(getV(11, 3)); print.getRange("F18").setValue(getV(12, 3));
  print.getRange("V22").setValue(getV(6, 3)); print.getRange("V24").setValue(getV(14, 3));
  
  const wd = new Date(getV(13, 4)); print.getRange("K20").setValue(wd.getFullYear()); print.getRange("O20").setValue(wd.getMonth()+1); print.getRange("R20").setValue(wd.getDate());
  const cd = new Date(getV(17, 4)); print.getRange("K32").setValue(cd.getFullYear()); print.getRange("O32").setValue(cd.getMonth()+1); print.getRange("R32").setValue(cd.getDate());
  const td = new Date(getV(25, 4)); print.getRange("K49").setValue(td.getFullYear()); print.getRange("O49").setValue(td.getMonth()+1); print.getRange("R49").setValue(td.getDate());
  
  const mRow = data[17];
  print.getRange("G34").setValue(mRow[2]); print.getRange("K34").setValue(mRow[4]);
  print.getRange("O34").setValue(mRow[6]); print.getRange("S34").setValue(mRow[8]);
  print.getRange("G35").setValue(getV(19, 3)); print.getRange("T47").setValue(getV(24, 3));
}

function saveToDatabase(data, pdfUrl) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const db = ss.getSheetByName("대장");
  if (!db) return;

  const lastRow = db.getLastRow();
  const newRow = lastRow + 1;
  const newNo = lastRow === 1 ? 1 : db.getRange(lastRow, 1).getValue() + 1;
  
  // 기존 데이터 컬럼 (A~AF 예상)
  // [참고] data는 index.html에서 넘어온 JSON 객체입니다.
  db.appendRow([
    newNo, data.grade, data.class, data.number, data.name,
    data.cat === "결석", data.cat === "지각", data.cat === "조퇴", data.cat === "결과",
    data.type === "질병", data.type === "생리통", data.type === "출석인정", data.type === "기타",
    data.startDate, data.startPeriod, data.endDate, data.endPeriod,
    data.totalDays, data.reason, data.writeDate, data.parentName,
    data.confirmDate, data.m_visit, data.m_phone, data.m_school, data.m_other,
    data.confirmDetail, data.doc1, data.doc2, data.doc3, data.m_other_text, data.teacherName, data.teacherDate
  ]);

  // AG(33) -> AH(34), AH(34) -> AI(35), AI(35) -> AJ(36)
  if (data.studentSigId) {
    const studentSigUrl = "https://docs.google.com/file/d/" + data.studentSigId + "/view";
    db.getRange(newRow, 34).setValue(studentSigUrl); // AH
  }
  if (data.parentSigId) {
    const parentSigUrl = "https://docs.google.com/file/d/" + data.parentSigId + "/view";
    db.getRange(newRow, 35).setValue(parentSigUrl); // AI
  }
  if (pdfUrl) {
    db.getRange(newRow, 36).setValue(pdfUrl); // AJ
  }

  // [추가] 제출 서버 시간 기록 (AK열, 37번째)
  const now = new Date();
  const kstTime = Utilities.formatDate(now, "GMT+9", "yyyy-MM-dd HH:mm:ss");
  db.getRange(newRow, 37).setValue(kstTime); // AK

  // AL(38번째 열)에 세부 사유(subType) 기록
  const subType = data.subType || data.editSubType || "";
  db.getRange(newRow, 38).setValue(subType);
}

/**
 * 서명 이미지를 구글 드라이브에 저장하는 함수
 */
function saveSignature(base64Data, type) {
  try {
    const folderId = (type === "parent") ? parentFolderId : studentFolderId;
    
    // [수정] base64 dataURL -> Blob 변환 로직 추가
    const contentType = base64Data.substring(5, base64Data.indexOf(';'));
    const bytes = Utilities.base64Decode(base64Data.split(',')[1]);
    const fileName = (type === "parent" ? "parent_sig_" : "student_sig_") + Utilities.formatDate(new Date(), "GMT+9", "yyyyMMdd_HHmmss") + ".png";
    const blob = Utilities.newBlob(bytes, contentType, fileName);
    
    let folder, file;
    try {
      folder = DriveApp.getFolderById(folderId);
      file = folder.createFile(blob);
    } catch (e) {
      console.warn("서명 폴더 접근/생성 권한이 없어 개인 드라이브에 임시 생성합니다: " + e.message);
      file = DriveApp.createFile(blob);
    }
    
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {
      console.warn("서명 권한설정(sharing) 경고(무시됨): " + e.message);
    }
    
    return file.getId();
  } catch (e) {
    console.error("서명 저장 실패: " + e.toString());
    throw new Error("서명 저장 중 오류가 발생했습니다: " + e.message);
  }
}

/**
 * 재생성용: 대장 시트의 특정 행번호(no)를 기반으로 PDF를 다시 생성하고 기존 파일을 삭제하는 함수
 */
function recreateReportPdf(rowNo) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const db = ss.getSheetByName("대장");
    const printSheet = ss.getSheetByName("인쇄");
    
    if (!db || !printSheet) throw new Error("'대장' 또는 '인쇄' 시트를 찾을 수 없습니다.");
    
    const dataRange = db.getDataRange().getValues();
    let rowIndex = -1;
    for (let i = 1; i < dataRange.length; i++) {
       if (String(dataRange[i][0]) === String(rowNo)) {
         rowIndex = i + 1;
         break;
       }
    }
    
    if (rowIndex === -1) throw new Error("해당 번호의 기록을 찾을 수 없습니다.");
    
    const row = dataRange[rowIndex - 1];
    
    // 데이터 객체 복구 (shifted columns 반영)
    const data = {
      grade: row[1], class: row[2], number: row[3], name: row[4],
      cat: row[5] ? "결석" : row[6] ? "지각" : row[7] ? "조퇴" : row[8] ? "결과" : "-",
      type: row[9] ? "질병" : row[10] ? "생리통" : row[11] ? "출석인정" : row[12] ? "기타" : "-",
      startDate: row[13] instanceof Date ? Utilities.formatDate(row[13], "GMT+9", "yyyy-MM-dd") : String(row[13]),
      startPeriod: row[14],
      endDate: row[15] instanceof Date ? Utilities.formatDate(row[15], "GMT+9", "yyyy-MM-dd") : String(row[15]),
      endPeriod: row[16],
      totalDays: row[17],
      reason: row[18],
      writeDate: row[19] instanceof Date ? Utilities.formatDate(row[19], "GMT+9", "yyyy-MM-dd") : String(row[19]),
      parentName: row[20],
      confirmDate: row[21] instanceof Date ? Utilities.formatDate(row[21], "GMT+9", "yyyy-MM-dd") : String(row[21]),
      m_visit: row[22], m_phone: row[23], m_school: row[24], m_other: row[25],
      confirmDetail: row[26],
      doc1: row[27], doc2: row[28], doc3: row[29], m_other_text: row[30],
      teacherName: row[31],
      teacherDate: row[32] instanceof Date ? Utilities.formatDate(row[32], "GMT+9", "yyyy-MM-dd") : String(row[32]),
      studentSigId: getFileIdFromUrl(row[33]), // AH
      parentSigId: getFileIdFromUrl(row[34]),   // AI
      subType: extractSubType(row)
    };
    
    const studentId = `${data.grade}${String(data.class).padStart(2,'0')}${String(data.number).padStart(2,'0')}`;
    const cleanDate = data.startDate.replace(/-/g, '');
    const customFileName = `${studentId}_${data.name}_${cleanDate}_${data.cat}_${data.type}_v2`;

    // 1. 기존 PDF 삭제 (AJ열 = index 35)
    const oldPdfUrl = row[35];
    if (oldPdfUrl) {
      const oldFileId = getFileIdFromUrl(oldPdfUrl);
      if (oldFileId) {
        try {
          DriveApp.getFileById(oldFileId).setTrashed(true);
        } catch (e) {
          console.warn("기존 파일 삭제 실패(이미 삭제되었을 수 있음): " + e.message);
        }
      }
    }

    // 2. 새로운 PDF 생성
    mapDataToPrintSheet(printSheet, data);
    SpreadsheetApp.flush();
    
    const newPdfUrl = PDFService.generate(ss, printSheet, customFileName, {
      studentSigId: data.studentSigId,
      parentSigId: data.parentSigId
    });

    // 3. 대장 시트 URL 업데이트 (AJ열 = 36번째 컬럼)
    db.getRange(rowIndex, 36).setValue(newPdfUrl);

    return { status: "success", pdfUrl: newPdfUrl };

  } catch (e) {
    console.error("PDF 재생성 중 오류: " + e.toString());
    return { status: "error", message: e.toString() };
  }
}

/**
 * URL에서 구글 드라이브 파일 ID만 추출하는 헬퍼 함수
 */
function getFileIdFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}

/**
 * 삭제용: 특정 행번호(no)를 기반으로 파일들을 삭제하고 시트에서 행을 삭제한 후 번호를 재정렬하는 함수
 */
function deleteReportRecord(rowNo) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const db = ss.getSheetByName("대장");
    if (!db) throw new Error("'대장' 시트를 찾을 수 없습니다.");
    
    const dataRange = db.getDataRange().getValues();
    let rowIndex = -1;
    for (let i = 1; i < dataRange.length; i++) {
       if (String(dataRange[i][0]) === String(rowNo)) {
         rowIndex = i + 1;
         break;
       }
    }
    
    if (rowIndex === -1) throw new Error("해당 번호의 기록을 찾을 수 없습니다.");
    
    const row = dataRange[rowIndex - 1];
    
    // 1. 드라이브 파일 추출 (학생 서명, 학부모 서명, PDF)
    const fileIds = [
      getFileIdFromUrl(row[33]), // AH: 학생 서명
      getFileIdFromUrl(row[34]), // AI: 학부모 서명
      getFileIdFromUrl(row[35])  // AJ: PDF
    ];
    
    // 2. 파일들 휴지통으로 이동
    fileIds.forEach(id => {
      if (id) {
        try {
          DriveApp.getFileById(id).setTrashed(true);
        } catch (e) {
          console.warn(`파일 삭제 실패(ID: ${id}): ` + e.message);
        }
      }
    });
    
    // 3. 시트에서 행 삭제
    db.deleteRow(rowIndex);
    
    // 4. 순번 재조정 (1열 데이터 1번부터 끝까지 다시 쓰기)
    const lastRow = db.getLastRow();
    if (lastRow > 1) {
      const newIds = [];
      for (let i = 1; i < lastRow; i++) {
        newIds.push([i]);
      }
      db.getRange(2, 1, lastRow - 1, 1).setValues(newIds);
    }
    
    return { status: "success" };

  } catch (e) {
    console.error("기록 삭제 중 오류: " + e.toString());
    return { status: "error", message: e.toString() };
  }
}

function extractSubType(row) {
  let subType = row[37] || ""; // 38번째 열
  if (!subType && row[11]) { // row[11] 이 true이면 data.type === "출석인정"인 상태임
    const reasonStr = row[18] || "";
    const match = reasonStr.match(/^(경조사|전염병|대입 관련|기타)(?:\((.*)\)?)?$/);
    if (match) {
      subType = match[1];
    } else if (row[27] && row[27].includes("대입 관련")) {
      subType = "대입 관련";
    } else if (row[27] && row[27].includes("기타")) {
      subType = "기타";
    }
  }
  return subType;
}

/**
 * 특정 기록의 상세 데이터를 가져오는 함수 (수정 모달용)
 */
function getRecordDetail(rowNo) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const db = ss.getSheetByName("대장");
    const data = db.getDataRange().getValues();
    const rowIndex = parseInt(rowNo);
    
    // rowNo가 1부터 시작하는 순번이므로, 데이터에서 해당 행을 찾음
    const row = data.find(r => r[0] == rowIndex);
    if (!row) throw new Error("해당 기록을 찾을 수 없습니다.");

    const formatDate = (date) => {
      if (!date || isNaN(new Date(date).getTime())) return "";
      return Utilities.formatDate(new Date(date), "GMT+9", "yyyy-MM-dd");
    };

    return {
      grade: row[1],
      classNum: row[2],
      number: row[3],
      name: row[4],
      cat: row[5] ? "결석" : row[6] ? "지각" : row[7] ? "조퇴" : row[8] ? "결과" : "결석",
      type: row[9] ? "질병" : row[10] ? "생리통" : row[11] ? "출석인정" : row[12] ? "기타" : "질병",
      startDate: formatDate(row[13]),
      startPeriod: row[14],
      endDate: formatDate(row[15]),
      endPeriod: row[16],
      totalDays: row[17],
      reason: row[18],
      writeDate: formatDate(row[19]),
      confirmDate: formatDate(row[21]),
      m_visit: row[22], m_phone: row[23], m_school: row[24], m_other: row[25],
      doc1: row[27],
      doc2: row[28],
      doc3: row[29],
      m_other_text: row[30], // AE열
      teacherName: row[31],
      teacherDate: formatDate(row[32]),
      subType: extractSubType(row)
    };
  } catch (e) {
    return { error: e.toString() };
  }
}

/**
 * 대장 시트의 기록을 수정하고 필요시 PDF를 재생성하는 함수
 */
function updateReportRecord(data) {
  try {
    const dateValidationError = validateFormDataDates(data);
    if (dateValidationError) {
      throw new Error(dateValidationError);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const db = ss.getSheetByName("대장");
    const values = db.getDataRange().getValues();
    const rowNo = parseInt(data.rowNo);
    
    // 1. 시트에서 해당 행 찾기 (A열의 순번 기준)
    let rowIndex = -1;
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] == rowNo) {
        rowIndex = i + 1; // 1-indexed for sheet
        break;
      }
    }
    if (rowIndex === -1) throw new Error("수정할 행을 찾을 수 없습니다.");

    // 2. 시트 데이터 업데이트
    db.getRange(rowIndex, 2).setValue(data.grade);
    db.getRange(rowIndex, 3).setValue(data.class);
    db.getRange(rowIndex, 4).setValue(data.number);
    db.getRange(rowIndex, 5).setValue(data.name);

    // 구분 (T/F)
    db.getRange(rowIndex, 6, 1, 4).setValues([[
      data.cat === "결석", data.cat === "지각", data.cat === "조퇴", data.cat === "결과"
    ]]);

    // 종류 (T/F)
    db.getRange(rowIndex, 10, 1, 4).setValues([[
      data.type === "질병", data.type === "생리통", data.type === "출석인정", data.type === "기타"
    ]]);

    // 날짜 및 사유 (N~S: 14~19)
    db.getRange(rowIndex, 14).setValue(data.startDate);
    db.getRange(rowIndex, 15).setValue(data.startPeriod);
    db.getRange(rowIndex, 16).setValue(data.endDate);
    db.getRange(rowIndex, 17).setValue(data.endPeriod);
    db.getRange(rowIndex, 18).setValue(data.totalDays);
    db.getRange(rowIndex, 19).setValue(data.reason);
    db.getRange(rowIndex, 20).setValue(data.writeDate);

    // 교사 확인란 (V~Z: 22~26)
    db.getRange(rowIndex, 22).setValue(data.confirmDate || "");
    db.getRange(rowIndex, 23).setValue(!!data.m_visit);
    db.getRange(rowIndex, 24).setValue(!!data.m_phone);
    db.getRange(rowIndex, 25).setValue(!!data.m_school);
    db.getRange(rowIndex, 26).setValue(!!data.m_other);

    // 첨부 서류 (AB~AE: 28~31)
    db.getRange(rowIndex, 28).setValue(data.doc1 || "");
    db.getRange(rowIndex, 29).setValue(data.doc2 || "");
    db.getRange(rowIndex, 30).setValue(data.doc3 || "");
    db.getRange(rowIndex, 31).setValue(data.m_other_text || ""); // AE열: 기타 확인 방법 텍스트

    // 교사 확인 (AF~AG: 32~33)
    db.getRange(rowIndex, 32).setValue(data.teacherName || "");
    db.getRange(rowIndex, 33).setValue(data.teacherDate || "");

    // AL(38번째 열)에 세부 사유(subType) 기록
    const subType = data.subType || data.editSubType || "";
    db.getRange(rowIndex, 38).setValue(subType);

    // [추가] 사유나 구분이 바뀌었을 수 있으므로 확인 내용(confirmDetail, AA열) 자동 업데이트
    const reason = data.reason || "";
    const cat = data.cat || "결석";
    if (reason) {
      const lastChar = reason.charAt(reason.length - 1);
      const code = lastChar.charCodeAt(0);
      let josa = "로";
      if (code >= 0xAC00 && code <= 0xD7A3) { // 한글인 경우만 종성 체크
        const jong = (code - 0xAC00) % 28;
        if (jong !== 0 && jong !== 8) josa = "으로"; // ㄹ 받침 제외하고 받침 있으면 '으로'
      }
      const newConfirmDetail = `${reason}${josa} 인하여 ${cat}함을 확인함.`;
      db.getRange(rowIndex, 27).setValue(newConfirmDetail); // AA(27)
    }

    // 3. PDF 재생성 (옵션)
    if (data.autoRecreate) {
      const res = recreateReportPdf(rowNo);
      if (res.status !== "success") {
        return { status: "partial", message: "시트 수정은 완료되었으나 PDF 재생성에 실패했습니다: " + res.message };
      }
    }

    return { status: "success" };
  } catch (e) {
    return { status: "error", message: e.toString() };
  }
}

/**
 * 일괄 인쇄용: 선택된 여러 기록을 하나의 PDF로 합쳐서 생성하는 함수
 */
function generateMergedPdf(rowNos) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const db = ss.getSheetByName("대장");
    const templateSheet = ss.getSheetByName("인쇄");
    
    if (!db || !templateSheet) throw new Error("'대장' 또는 '인쇄' 시트를 찾을 수 없습니다.");
    
    // 1. 임시 스프레드시트 생성
    const tempSS = SpreadsheetApp.create("Merged_Reports_" + Utilities.formatDate(new Date(), "GMT+9", "MMdd_HHmm"));
    const tempSSId = tempSS.getId();
    
    // 첫 번째 기본 시트 제거를 위해 보관
    const defaultSheet = tempSS.getSheets()[0];
    
    const dbData = db.getDataRange().getValues();
    
    // 2. 각 기록에 대해 시트 추가 및 데이터 채우기
    rowNos.forEach((no, index) => {
      const row = dbData.find(r => String(r[0]) === String(no));
      if (!row) return; // 건너뜀
      
      const data = {
        grade: row[1], class: row[2], number: row[3], name: row[4],
        cat: row[5] ? "결석" : row[6] ? "지각" : row[7] ? "조퇴" : row[8] ? "결과" : "-",
        type: row[9] ? "질병" : row[10] ? "생리통" : row[11] ? "출석인정" : row[12] ? "기타" : "-",
        startDate: row[13] instanceof Date ? Utilities.formatDate(row[13], "GMT+9", "yyyy-MM-dd") : String(row[13]),
        startPeriod: row[14],
        endDate: row[15] instanceof Date ? Utilities.formatDate(row[15], "GMT+9", "yyyy-MM-dd") : String(row[15]),
        endPeriod: row[16],
        totalDays: row[17],
        reason: row[18],
        writeDate: row[19] instanceof Date ? Utilities.formatDate(row[19], "GMT+9", "yyyy-MM-dd") : String(row[19]),
        parentName: row[20],
        confirmDate: row[21] instanceof Date ? Utilities.formatDate(row[21], "GMT+9", "yyyy-MM-dd") : String(row[21]),
        m_visit: row[22], m_phone: row[23], m_school: row[24], m_other: row[25],
        confirmDetail: row[26],
        doc1: row[27], doc2: row[28], doc3: row[29], doc4: row[30],
        teacherName: row[31],
        teacherDate: row[32] instanceof Date ? Utilities.formatDate(row[32], "GMT+9", "yyyy-MM-dd") : String(row[32]),
        studentSigId: getFileIdFromUrl(row[33]),
        parentSigId: getFileIdFromUrl(row[34]),
        subType: extractSubType(row)
      };
      
      // 템플릿 복사
      const targetSheet = templateSheet.copyTo(tempSS);
      targetSheet.setName(`${index + 1}_${data.name}`);
      
      // 데이터 매핑
      mapDataToPrintSheet(targetSheet, data);
      
      // 서명 삽입
      if (data.studentSigId || data.parentSigId) {
        PDFService.insertSignatures(targetSheet, {
          studentSigId: data.studentSigId,
          parentSigId: data.parentSigId
        });
      }
    });
    
    // 기본 시트 삭제
    if (tempSS.getSheets().length > 1) {
      tempSS.deleteSheet(defaultSheet);
    }
    
    SpreadsheetApp.flush();
    
    // 3. 통합 PDF 생성
    const fileName = "일괄결석계_" + Utilities.formatDate(new Date(), "GMT+9", "MMdd_HHmm");
    const blob = PDFService.createBlob(tempSS, null, fileName);
    
    // 4. 저장 및 공유
    let file;
    try {
      const folder = DriveApp.getFolderById(FOLDER_ID);
      file = folder.createFile(blob);
    } catch (e) {
      console.warn("지정된 폴더에 접근 권한이 없어 개인 드라이브 최상단에 생성합니다: " + e.message);
      file = DriveApp.createFile(blob);
    }
    
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {
      console.warn("권한설정(sharing) 경고(무시됨): " + e.message);
    }
    
    const pdfUrl = "https://docs.google.com/file/d/" + file.getId() + "/preview";
    
    // 5. 임시 파일 정리
    try {
      DriveApp.getFileById(tempSSId).setTrashed(true);
    } catch (e) {
      console.warn("임시 파일 삭제 실패: " + e.message);
    }
    
    return { status: "success", pdfUrl: pdfUrl };
    
  } catch (e) {
    console.error("통합 PDF 생성 중 오류: " + e.toString());
    return { status: "error", message: e.toString() };
  }
}

/**
 * 날짜 문자열이 유효한 yyyy-MM-dd 형식인지 검증
 */
function isValidDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return false;
  const reg = /^\d{4}-\d{2}-\d{2}$/;
  if (!reg.test(dateStr)) return false;
  const d = new Date(dateStr + "T12:00:00");
  return d instanceof Date && !isNaN(d.getTime());
}

/**
 * 폼 데이터의 날짜 필드들을 검증하는 공통 함수
 */
function validateFormDataDates(data) {
  // 필수 날짜 검증
  if (!isValidDate(data.startDate)) return "시작일이 올바르지 않은 날짜 형식입니다.";
  if (!isValidDate(data.endDate)) return "종료일이 올바르지 않은 날짜 형식입니다.";
  if (!isValidDate(data.writeDate)) return "작성일이 올바르지 않은 날짜 형식입니다.";
  
  // 선택적 날짜 검증 (교사용 입력란 등)
  if (data.confirmDate && !isValidDate(data.confirmDate)) return "교사 확인일이 올바르지 않은 날짜 형식입니다.";
  if (data.teacherDate && !isValidDate(data.teacherDate)) return "담임 확인일이 올바르지 않은 날짜 형식입니다.";

  // 날짜 순서 검증 (시작일 > 종료일)
  const start = new Date(data.startDate + "T12:00:00");
  const end = new Date(data.endDate + "T12:00:00");
  if (start > end) {
    return "시작일은 종료일보다 이전이어야 합니다.";
  }

  return null; // 검증 통과
}
/**
 * 대장 시트 등록 없이, 인쇄 시트에 데이터를 매핑하고 PDF만 생성하여 미리보기 링크 반환
 */
function printReportOnly(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const printSheet = ss.getSheetByName("인쇄");
    if (!printSheet) throw new Error("'인쇄' 시트를 찾을 수 없습니다.");

    const grade = data.grade || TARGET_GRADE;
    const classNum = String(data.class || data.ban || "").padStart(2, '0');
    const studentNum = String(data.number || data.num || "").padStart(2, '0');
    const studentId = `${grade}${classNum}${studentNum}`;
    const cleanDate = (data.startDate || "").replace(/-/g, '') || Utilities.formatDate(new Date(), "GMT+9", "yyyyMMdd");
    const customFileName = `신고서_${studentId}_${data.name || ""}_${cleanDate}_${data.cat || ""}_${data.type || ""}`;

    mapDataToPrintSheet(printSheet, data);
    SpreadsheetApp.flush();

    const pdfUrl = PDFService.generate(ss, printSheet, customFileName, {
      studentSigId: data.studentSigId || null,
      parentSigId: data.parentSigId || null
    });

    return {
      status: "success",
      message: "인쇄용 PDF가 생성되었습니다.",
      pdfUrl: pdfUrl
    };
  } catch (e) {
    console.error("printReportOnly 오류: " + e.toString());
    return { status: "error", message: e.toString() };
  }
}

/**
 * '선택교과 출석관리' 프론트엔드에서 수신한 출결 오버라이드 데이터를 '출결기록' 시트에 저장
 * 컬럼: 날짜(0), 교시(1), 학번(2), 이름(3), 과목명(4), 상태(5), 사유(6), 갱신일시(7)
 */
function saveAttendanceRecordsToSheet(records) {
  try {
    if (!records) return { status: 'error', message: '저장할 기록이 없습니다.' };
    const list = Array.isArray(records) ? records : [records];
    if (list.length === 0) return { status: 'success', count: 0 };

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("출결기록");
    if (!sheet) {
      sheet = ss.insertSheet("출결기록");
      sheet.appendRow(["날짜", "교시", "학번", "이름", "과목명", "상태", "사유", "갱신일시"]);
    }

    const lastRow = sheet.getLastRow();
    const data = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, 8).getValues() : [];
    
    // Map existing rows: key = "YYYY-MM-DD_교시_학번"
    const rowMap = new Map();
    data.forEach((r, idx) => {
      const dStr = r[0] instanceof Date ? Utilities.formatDate(r[0], "GMT+9", "yyyy-MM-dd") : String(r[0] || "").trim();
      const pStr = String(r[1] || "").trim();
      const sId = String(r[2] || "").trim();
      if (dStr && pStr && sId) {
        rowMap.set(`${dStr}_${pStr}_${sId}`, idx + 2); // 1-indexed row number
      }
    });

    const nowStr = Utilities.formatDate(new Date(), "GMT+9", "yyyy-MM-dd HH:mm:ss");

    list.forEach(rec => {
      const dStr = String(rec.date || "").trim();
      const pStr = String(rec.period || "").trim();
      const sId = String(rec.studentId || "").trim();
      const key = `${dStr}_${pStr}_${sId}`;
      const status = String(rec.status || "").trim();
      const reason = String(rec.reason || rec.subType || "").trim();
      const room = String(rec.room || rec.subject || "").trim();
      const name = String(rec.name || "").trim();

      if (!dStr || !pStr || !sId) return;

      if (rowMap.has(key)) {
        const rowIdx = rowMap.get(key);
        sheet.getRange(rowIdx, 4).setValue(name);
        sheet.getRange(rowIdx, 5).setValue(room);
        sheet.getRange(rowIdx, 6).setValue(status);
        sheet.getRange(rowIdx, 7).setValue(reason);
        sheet.getRange(rowIdx, 8).setValue(nowStr);
      } else {
        sheet.appendRow([dStr, pStr, sId, name, room, status, reason, nowStr]);
        rowMap.set(key, sheet.getLastRow());
      }
    });

    return { status: 'success', message: `${list.length}건의 출결기록이 동기화되었습니다.`, count: list.length };
  } catch (err) {
    console.error("출결기록 저장 실패: " + err.toString());
    return { status: 'error', message: err.toString() };
  }
}

/**
 * '출결기록' 시트의 출결 사항을 바탕으로 '대장' 시트에 정식 신고서로 접수하고
 * '인쇄' 시트에 매핑하여 PDF를 생성하는 통합 브리지 함수
 */
function syncAttendanceToRegistry(data) {
  try {
    if (!data.grade) data.grade = TARGET_GRADE;
    if (!data.writeDate) data.writeDate = Utilities.formatDate(new Date(), "GMT+9", "yyyy-MM-dd");
    if (!data.parentName) data.parentName = "학부모";
    if (!data.teacherDate) data.teacherDate = Utilities.formatDate(new Date(), "GMT+9", "yyyy-MM-dd");

    const res = processFormData(data);
    return res;
  } catch (err) {
    console.error("syncAttendanceToRegistry 오류: " + err.toString());
    return { status: 'error', message: err.toString() };
  }
}
