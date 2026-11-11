/**
 * ==========================================================
 * 포곡고 대입 데이터 통합 관리 & 자동 라우팅 배포 시스템 (Apps Script)
 * ----------------------------------------------------------
 * 1. [가채점] 연도 자동 감지 모의등급컷 기준 등급 자동 변환 (AS:BB)
 * 2. [원클릭 일괄 배포] 수시 40개 컬럼 자동 매칭 + A열 단일 암호화 배포 + 평문 배포
 * ==========================================================
 */

const TARGET_SPREADSHEET_ID = '1U5Vnx2x8gnXQlI3N4deyaurKxj-naZP0cRBb3lQnT4o'; // 배포용 시트 ID
const TARGET_ENC_COL_NAME = 'encrypted_data'; // 암호문 헤더명 (A열 통일)

// ==========================================================
// ⭐ [관리자 설정] 시트 분류 목록
// ==========================================================

// [1] 암호화하여 배포할 시트 목록 (학생 개인정보, 수시지원, 모의고사 성적)
//     * 모든 암호화 시트는 배포 시트의 'A열'에 단일화되어 초경량 배포됩니다.
//     * 수시 시트는 배포 직전 CE:DR 40개 컬럼 자동 매칭이 선행 실행됩니다.
const ENCRYPTED_SHEETS = [
  '2027수시',
  '2026수시',
  '2025수시',
  '2027모의결과',
  '2027모의가채점'
];

// [2] 암호화 없이 원본 그대로(평문) 배포할 시트 목록 (통계, 요약, 최저기준표 등)
const PLAIN_SHEETS = [
  '수능최저충족률',
  '2027수능최저'
];

// ==========================================================
// 🔍 최신 가채점 연도 자동 감지 헬퍼
// ==========================================================
function detectLatestMockYear() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  let maxYear = 2027; // 기본값

  for (const sheet of sheets) {
    const name = sheet.getName();
    const match = name.match(/(\d{4})모의/);
    if (match) {
      const year = parseInt(match[1], 10);
      if (year > maxYear) {
        maxYear = year;
      }
    }
  }
  return maxYear;
}

// ==========================================================
// 🚀 상단 커스텀 메뉴 등록 (심플 2단 구조)
// ==========================================================
function onOpen() {
  const latestYear = detectLatestMockYear();
  SpreadsheetApp.getUi()
    .createMenu('🚀 대입 데이터 관리')
    .addItem(`1. [가채점] ${latestYear}모의등급컷 기준 등급 자동 변환 (AS:BB)`, 'convertMockGradesToEbs')
    .addSeparator()
    .addItem('2. [배포] 등록된 모든 시트 일괄 배포 (수시 자동 매칭 포함)', 'deployAllRegisteredSheets')
    .addToUi();
}

/**
 * ==========================================================
 * [기능 1] 모의등급컷 기준 가채점 EBS 등급 환산 (AS:BB열)
 * ----------------------------------------------------------
 * - 현재 작업 중인 시트 또는 등록된 최신 연도 탭을 자동 감지하여 등급 산출
 * ==========================================================
 */
function convertMockGradesToEbs() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let currentSheet = ss.getActiveSheet();
  let currentName = currentSheet.getName();

  // 현재 시트가 가채점/모의 시트가 아니면 최신 가채점 시트로 자동 탐색
  if (!currentName.includes('가채점') && !currentName.includes('모의')) {
    const latestYear = detectLatestMockYear();
    const fallbackSheet = ss.getSheetByName(`${latestYear}모의가채점`) || ss.getSheetByName('2027모의가채점');
    if (fallbackSheet) {
      currentSheet = fallbackSheet;
      currentName = fallbackSheet.getName();
    } else {
      const confirm = ui.alert('확인', `'${currentName}' 탭이 가채점 시트가 맞습니까?\n계속 진행하시겠습니까?`, ui.ButtonSet.YES_NO);
      if (confirm !== ui.Button.YES) return;
    }
  }

  // 연도 추출 및 대응 등급컷 시트 탐색
  const yearMatch = currentName.match(/(\d{4})/);
  const targetYear = yearMatch ? parseInt(yearMatch[1], 10) : detectLatestMockYear();

  let cutoffSheet = ss.getSheetByName(`${targetYear}모의등급컷`);
  if (!cutoffSheet) {
    cutoffSheet = ss.getSheetByName('2027모의등급컷');
  }
  if (!cutoffSheet) {
    const sheets = ss.getSheets();
    cutoffSheet = sheets.find(s => s.getName().includes('모의등급컷') || s.getName().includes('등급컷'));
  }

  if (!cutoffSheet) {
    ui.alert(`❌ 등급컷 기준 시트('${targetYear}모의등급컷')를 찾을 수 없습니다.`);
    return;
  }

  const cutoffSheetName = cutoffSheet.getName();
  const cutoffRows = cutoffSheet.getDataRange().getValues();
  const monthCutoffs = parseAllMonthCutoffs(cutoffRows);

  const lastRow = currentSheet.getLastRow();
  if (lastRow < 3) {
    ui.alert(`⚠️ '${currentName}' 시트에 변환할 학생 데이터(3행 이후)가 없습니다.`);
    return;
  }

  const dataRange = currentSheet.getRange(3, 1, lastRow - 2, 54);
  const rows = dataRange.getValues();
  const convertedResults = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = String(row[5] || '').trim();

    if (!name) {
      convertedResults.push(new Array(10).fill(''));
      continue;
    }

    const monthNum = parseInt(row[0]) || 3;
    const mCuts = monthCutoffs[monthNum] || monthCutoffs[3] || {};

    const korSubj = String(row[6] || '').trim();
    const korScore = row[9];
    const korGrade = calcCutoffGrade(korScore, mCuts[cleanSubjName(korSubj)]);

    const mathSubj = String(row[13] || '').trim();
    const mathScore = row[16];
    const mathGrade = calcCutoffGrade(mathScore, mCuts[cleanSubjName(mathSubj)]);

    const engScore = row[20];
    const engGrade = calcAbsoluteEnglish(engScore);

    const histScore = row[35];
    const histGrade = calcAbsoluteHistory(histScore);

    const inq1Subj = String(row[25] || '').trim();
    const inq1Score = row[26];
    const inq1Grade = calcCutoffGrade(inq1Score, mCuts[cleanSubjName(inq1Subj)]);

    const inq2Subj = String(row[30] || '').trim();
    const inq2Score = row[31];
    const inq2Grade = calcCutoffGrade(inq2Score, mCuts[cleanSubjName(inq2Subj)]);

    convertedResults.push([
      korSubj, korGrade,
      mathSubj, mathGrade,
      engGrade, histGrade,
      inq1Subj, inq1Grade,
      inq2Subj, inq2Grade
    ]);
  }

  currentSheet.getRange(3, 45, convertedResults.length, 10).setValues(convertedResults);

  ui.alert(`🎉 [등급 환산 완료]\n\n` +
           `• 대상 탭: ${currentName}\n` +
           `• 기준 등급컷: ${cutoffSheetName}\n` +
           `• 환산 학생 수: ${convertedResults.length}명\n` +
           `• 반영 영역: AS3:BB${lastRow}\n\n` +
           `가채점 등급 환산이 정상적으로 적용되었습니다.`);
}

/**
 * ==========================================================
 * [기능 2] 등록된 모든 시트 일괄 배포 (원클릭 동기화 & 수시 매칭 통합)
 * ----------------------------------------------------------
 * 1. 수시 시트(예: 2027수시)는 배포 직전 CE:DR 40개 컬럼 최신 매칭 자동 선행
 * 2. 모든 암호화 시트는 배포 시트 'A열'로 단일화되어 초경량 저장
 * 3. 평문 시트는 원본 열 그대로 온전하게 동기화
 * ==========================================================
 */
function deployAllRegisteredSheets() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const confirm = ui.alert('일괄 배포 확인', 
    `등록된 모든 시트를 배포 시트로 일괄 동기화하시겠습니까?\n\n` +
    `• 암호화 대상 (A열 단일화): ${ENCRYPTED_SHEETS.join(', ')}\n` +
    `• 평문 대상 (통계/기준표): ${PLAIN_SHEETS.join(', ')}\n\n` +
    `※ 수시 시트는 배포 전 CE:DR 40개 매칭 컬럼이 자동으로 최신 반영됩니다.`, 
    ui.ButtonSet.YES_NO
  );
  if (confirm !== ui.Button.YES) return;

  let password = null;
  if (ENCRYPTED_SHEETS.length > 0) {
    password = promptPassword(ui);
    if (!password) return;
  }

  let targetSs = null;
  try {
    targetSs = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
  } catch (e) {
    ui.alert(`❌ 배포 시트 접근 실패: ${e.message}`);
    return;
  }

  const results = [];

  // 1) 평문 시트 배포
  for (const sheetName of PLAIN_SHEETS) {
    const s = ss.getSheetByName(sheetName);
    if (!s) {
      results.push(`• [평문 스킵] '${sheetName}' (원본에 없음)`);
      continue;
    }
    const res = executePlainDeploy(s, targetSs);
    if (res.success) {
      results.push(`• [평문 배포] '${sheetName}': ${res.rows}행 동기화 완료`);
    } else {
      results.push(`• [평문 실패] '${sheetName}': ${res.error}`);
    }
  }

  // 2) 암호화 시트 배포 (수시 시트는 매칭 로직 자동 통합)
  for (const sheetName of ENCRYPTED_SHEETS) {
    const s = ss.getSheetByName(sheetName);
    if (!s) {
      results.push(`• [암호화 스킵] '${sheetName}' (원본에 없음)`);
      continue;
    }

    let matchSummary = '';
    // 수시 시트인 경우 CE:DR 40개 컬럼 선행 매칭
    if (sheetName.includes('수시')) {
      const matchRes = executeMatchingLogic(s);
      if (matchRes.success) {
        matchSummary = ` (CE:DR ${matchRes.matchedCount}건 매칭완료)`;
      } else {
        matchSummary = ` (⚠️ 매칭 경고: ${matchRes.error})`;
      }
    }

    // A열 단일화 암호화 배포 실행
    const res = executeEncryptedDeploy(s, targetSs, password, true);
    if (res.success) {
      results.push(`• [암호화 배포] '${sheetName}': ${res.totalRows}건 반영 (A열 단일화)${matchSummary}`);
    } else {
      results.push(`• [암호화 실패] '${sheetName}': ${res.error}`);
    }
  }

  ui.alert(`🎉 [일괄 배포 완료]\n\n` + results.join('\n'));
}

/**
 * ==========================================================
 * [코어 파이프라인 1] 평문(비암호화) 배포 실행 엔진
 * ==========================================================
 */
function executePlainDeploy(sourceSheet, targetSs) {
  try {
    const sheetName = sourceSheet.getName();
    let targetSheet = targetSs.getSheetByName(sheetName);
    if (!targetSheet) {
      targetSheet = targetSs.insertSheet(sheetName);
    }

    const srcLastRow = sourceSheet.getLastRow();
    const srcLastCol = sourceSheet.getLastColumn();

    if (srcLastRow < 1 || srcLastCol < 1) {
      targetSheet.clearContents();
      return { success: true, rows: 0, cols: 0 };
    }

    const srcData = sourceSheet.getRange(1, 1, srcLastRow, srcLastCol).getValues();

    const targetMaxRows = targetSheet.getMaxRows();
    if (targetMaxRows < srcLastRow) {
      targetSheet.insertRowsAfter(targetMaxRows, srcLastRow - targetMaxRows);
    }
    const targetMaxCols = targetSheet.getMaxColumns();
    if (targetMaxCols < srcLastCol) {
      targetSheet.insertColumnsAfter(targetMaxCols, srcLastCol - targetMaxCols);
    }

    targetSheet.clearContents();
    targetSheet.getRange(1, 1, srcLastRow, srcLastCol).setValues(srcData);

    return { success: true, rows: srcLastRow, cols: srcLastCol };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * ==========================================================
 * [코어 파이프라인 2] AES 암호화 배포 실행 엔진 (A열 단일화 초경량)
 * ----------------------------------------------------------
 * - 모든 암호화 탭의 암호문을 배포 시트의 'A열(1열)' 1개 열로 완전히 통일
 * - 기존 FA(157), DA(105), CA(79) 등의 유령 열 데이터를 완전히 제거하여 용량 극소화
 * - 배포 전 기존 데이터 암호문과 비밀번호 일치 여부를 사전 검증하여 데이터 파손 방지
 * ==========================================================
 */
function executeEncryptedDeploy(sourceSheet, targetSs, password, isFullSync) {
  try {
    const sheetName = sourceSheet.getName();
    const targetEncColIndex = 1; // ⭐ 무조건 A열(1번째 열)로 단일화
    const targetEncColLetter = 'A';

    let targetSheet = targetSs.getSheetByName(sheetName);
    if (!targetSheet) {
      targetSheet = targetSs.insertSheet(sheetName);
    }

    const srcLastRow = sourceSheet.getLastRow();
    const srcLastCol = sourceSheet.getLastColumn();
    if (srcLastRow < 2) {
      return { success: false, error: '동기화할 데이터가 없습니다.' };
    }

    const srcData = sourceSheet.getRange(1, 1, srcLastRow, srcLastCol).getValues();
    const srcHeaders = srcData[0];

    // [보안 안전장치] 기존 배포 시트에 암호화 데이터가 있을 경우 비밀번호 일치 여부 사전 검증
    const targetLastRow = targetSheet.getLastRow();
    const targetMaxCols = targetSheet.getMaxColumns();
    if (targetLastRow > 1) {
      let sampleCipher = '';

      // 1순위: A열 샘플 탐색
      const aColSamples = targetSheet.getRange(2, 1, Math.min(10, targetLastRow - 1), 1).getValues();
      for (const row of aColSamples) {
        const val = String(row[0] || '').trim();
        if (val.startsWith('U2FsdGVkX1')) {
          sampleCipher = val;
          break;
        }
      }

      // 2순위: 과거 레거시 열(157, 105, 79열) 샘플 탐색
      if (!sampleCipher) {
        for (const legacyCol of [157, 105, 79]) {
          if (targetMaxCols >= legacyCol) {
            const legSamples = targetSheet.getRange(2, legacyCol, Math.min(10, targetLastRow - 1), 1).getValues();
            for (const row of legSamples) {
              const val = String(row[0] || '').trim();
              if (val.startsWith('U2FsdGVkX1')) {
                sampleCipher = val;
                break;
              }
            }
          }
          if (sampleCipher) break;
        }
      }

      // 기존 암호문이 존재하는 경우 복호화 테스트
      if (sampleCipher) {
        if (!decryptAES(sampleCipher, password)) {
          throw new Error(`비밀번호가 기존 배포 시트('${sheetName}')의 암호화 데이터와 일치하지 않습니다.`);
        }
      }
    }

    // 1행 데이터 암호화 생성
    const cipherRows = [];
    for (let i = 1; i < srcData.length; i++) {
      const row = srcData[i];
      const rowObj = {};
      let hasData = false;
      for (let j = 0; j < srcHeaders.length; j++) {
        const val = row[j];
        if (val !== '' && val !== null && val !== undefined) {
          hasData = true;
          rowObj[srcHeaders[j]] = (val instanceof Date) ? Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd') : val;
        }
      }
      if (hasData) {
        cipherRows.push([encryptAES(JSON.stringify(rowObj), password)]);
      } else {
        cipherRows.push(['']);
      }
    }

    // 배포 시트의 과거 잔여 열 및 찌꺼기 데이터 전체 소거 (완전 무결성 보장)
    targetSheet.clearContents();

    // 불필요하게 늘어난 잉여 열 정리 (A열만 남기거나 2열 이후 축소하여 시트 초경량화)
    if (targetSheet.getMaxColumns() > 2) {
      try {
        targetSheet.deleteColumns(2, targetSheet.getMaxColumns() - 1);
      } catch (colErr) {
        // 열 삭제 제한 환경일 경우 패스
      }
    }

    // 행 크기 확보
    const targetCurrentMaxRows = targetSheet.getMaxRows();
    if (targetCurrentMaxRows < srcLastRow) {
      targetSheet.insertRowsAfter(targetCurrentMaxRows, srcLastRow - targetCurrentMaxRows);
    }

    // A1 헤더 설정
    targetSheet.getRange(1, 1).setValue(TARGET_ENC_COL_NAME);

    // A열에 2행부터 암호문 일괄 덮어쓰기
    targetSheet.getRange(2, 1, cipherRows.length, 1).setValues(cipherRows);

    return {
      success: true,
      totalRows: cipherRows.length,
      targetEncColLetter,
      targetEncColIndex
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * ==========================================================
 * [코어 매칭 엔진] 수시 시트 CE:DR (40개 열) 자동 매칭 로직
 * ----------------------------------------------------------
 * MatchingData.gs 사전 데이터를 기반으로 대학구분, 전년도 입결 등 40개 열을 100% 자동 산출
 * ==========================================================
 */
function executeMatchingLogic(susiSheet) {
  try {
    let dict = {};
    try {
      dict = getMatchingDictionary();
    } catch (e) {
      return { success: false, error: "MatchingData.gs 매칭 사전을 불러오는데 실패했습니다: " + e.message };
    }

    const lastRow = susiSheet.getLastRow();
    const totalDataRows = lastRow - 1;
    if (totalDataRows < 1) return { success: false, error: "데이터가 없습니다." };

    const susiHeaders = susiSheet.getRange(1, 1, 1, susiSheet.getLastColumn()).getValues()[0].map(h => String(h || '').trim());
    const findCol = (names) => {
      for (const name of names) {
        const idx = susiHeaders.findIndex(h => h.replace(/[\r\n\s]+/g, '') === name.replace(/[\r\n\s]+/g, ''));
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const sSchoolTypeIdx = findCol(['학교유형']);
    const sUnivIdx = findCol(['대학명', '대학']);
    const sTrackTypeIdx = findCol(['전형유형']);
    const sTrackDetailIdx = findCol(['세부유형', '전형명(소)', '세부전형']);
    const sDeptIdx = findCol(['모집단위', '학과']);
    const sApplyCountIdx = findCol(['지원인원']);
    const sQuotaIdx = findCol(['모집인원']);

    let sCECol = 83; // 기본 CE열 (83열)
    const foundCE = susiHeaders.findIndex(h => h.includes('대학구분') || h.includes('[대학구분]'));
    if (foundCE !== -1) sCECol = foundCE + 1;

    const susiData = susiSheet.getRange(2, 1, totalDataRows, susiSheet.getLastColumn()).getValues();
    const outputRows = [];
    let matchedCount = 0;
    let collegeCount = 0;
    let fallbackCount = 0;

    for (let i = 0; i < totalDataRows; i++) {
      const row = susiData[i];
      const schoolType = String(row[sSchoolTypeIdx] || '').trim();
      const univ = String(row[sUnivIdx] || '').trim();
      const tType = String(row[sTrackTypeIdx] || '').trim();
      const tDetail = String(row[sTrackDetailIdx] || '').trim();
      const track = tDetail || tType || '';
      const dept = String(row[sDeptIdx] || '').trim();

      const key = `${univ}__${track}__${dept}`.replace(/[\r\n\s]+/g, '');
      const altKey = `${univ}__${tType}__${dept}`.replace(/[\r\n\s]+/g, '');

      if (dict[key]) {
        outputRows.push(dict[key]);
        matchedCount++;
      } else if (dict[altKey]) {
        outputRows.push(dict[altKey]);
        matchedCount++;
      } else {
        const isJuniorCollege = schoolType.includes('전문') || univ.includes('전문대') || univ.includes('전문대학');
        const fallbackRow = new Array(40).fill('-');
        fallbackRow[0] = isJuniorCollege ? '전문대학' : (schoolType || '4년제대학');
        fallbackRow[1] = isJuniorCollege ? '전문대 수시접수' : '신규 추가건';
        fallbackRow[2] = track || '수시전형';
        fallbackRow[3] = dept;
        fallbackRow[4] = row[sQuotaIdx] ? String(row[sQuotaIdx]) : '-';
        fallbackRow[5] = row[sQuotaIdx] ? Number(row[sQuotaIdx]) || '' : '';
        fallbackRow[6] = row[sApplyCountIdx] ? Number(row[sApplyCountIdx]) || '' : '';
        fallbackRow[7] = '-';
        fallbackRow[8] = '';
        fallbackRow[9] = '단독선발';
        fallbackRow[10] = '-';
        fallbackRow[11] = '-';
        fallbackRow[12] = '';
        fallbackRow[13] = '';

        outputRows.push(fallbackRow);
        if (isJuniorCollege) {
          collegeCount++;
        } else {
          fallbackCount++;
        }
      }
    }

    const targetRange = susiSheet.getRange(2, sCECol, totalDataRows, 40);
    targetRange.clearContent();
    targetRange.setValues(outputRows);

    return {
      success: true,
      totalRows: totalDataRows,
      matchedCount,
      collegeCount,
      fallbackCount
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ==========================================================
// 🛠️ 보조 헬퍼 및 보안 함수
// ==========================================================
function cleanSubjName(name) {
  if (!name) return '';
  let s = String(name).replace(/[\r\n\s·ㆍ]+/g, '').replace(/[Ⅰ1]/g, '1').replace(/[Ⅱ2]/g, '2');
  if (s.startsWith('물리1') || s.startsWith('물리학1')) return '물리학1';
  if (s.startsWith('물리2') || s.startsWith('물리학2')) return '물리학2';
  if (s.startsWith('화학1') || s.startsWith('화1')) return '화학1';
  if (s.startsWith('화학2') || s.startsWith('화2')) return '화학2';
  if (s.startsWith('생명과학1') || s.startsWith('생명1') || s.startsWith('생물1')) return '생명과학1';
  if (s.startsWith('생명과학2') || s.startsWith('생명2') || s.startsWith('생물2')) return '생명과학2';
  if (s.startsWith('지구과학1') || s.startsWith('지학1') || s.startsWith('지구1')) return '지구과학1';
  if (s.startsWith('지구과학2') || s.startsWith('지학2') || s.startsWith('지구2')) return '지구과학2';
  return s;
}

function parseAllMonthCutoffs(cRows) {
  const monthCutoffs = {};
  for (let r = 0; r < cRows.length; r++) {
    const txt = String(cRows[r]?.[0] || '').trim();
    if (txt.includes('월')) {
      const mNum = parseInt(txt, 10);
      if (isNaN(mNum)) continue;
      monthCutoffs[mNum] = {};
      const subjRow = cRows[r + 1] || [];
      const typeRow = cRows[r + 2] || [];

      for (let c = 0; c < subjRow.length; c++) {
        const rawSubj = subjRow[c];
        if (!rawSubj) continue;
        const key = cleanSubjName(rawSubj);
        let scoreColIdx = -1;
        if (String(typeRow[c] || '').includes('원점수')) scoreColIdx = c;
        else if (String(typeRow[c + 1] || '').includes('원점수')) scoreColIdx = c + 1;
        else if (String(typeRow[c + 2] || '').includes('원점수')) scoreColIdx = c + 2;

        if (scoreColIdx !== -1) {
          const cuts = [];
          for (let g = 1; g <= 8; g++) {
            const cutVal = cRows[r + 5 + g]?.[scoreColIdx];
            cuts.push(cutVal != null && !isNaN(cutVal) ? Number(cutVal) : null);
          }
          monthCutoffs[mNum][key] = cuts;
        }
      }
    }
  }
  return monthCutoffs;
}

function calcCutoffGrade(score, cuts) {
  if (score == null || score === '' || isNaN(score)) return '';
  const num = Number(score);
  if (!cuts || cuts.length === 0) return '';
  for (let i = 0; i < cuts.length; i++) {
    if (cuts[i] != null && num >= cuts[i]) return i + 1;
  }
  return 9;
}

function calcAbsoluteEnglish(score) {
  if (score == null || score === '' || isNaN(score)) return '';
  const num = Number(score);
  if (num >= 90) return 1;
  if (num >= 80) return 2;
  if (num >= 70) return 3;
  if (num >= 60) return 4;
  if (num >= 50) return 5;
  if (num >= 40) return 6;
  if (num >= 30) return 7;
  if (num >= 20) return 8;
  return 9;
}

function calcAbsoluteHistory(score) {
  if (score == null || score === '' || isNaN(score)) return '';
  const num = Number(score);
  if (num >= 40) return 1;
  if (num >= 35) return 2;
  if (num >= 30) return 3;
  if (num >= 25) return 4;
  if (num >= 20) return 5;
  if (num >= 15) return 6;
  if (num >= 10) return 7;
  if (num >= 5) return 8;
  return 9;
}

function promptPassword(ui) {
  const res1 = ui.prompt('🔐 관리자 보안 인증 (1/2)', '배포 비밀번호를 입력하세요:', ui.ButtonSet.OK_CANCEL);
  if (res1.getSelectedButton() !== ui.Button.OK) return null;
  const pw1 = res1.getResponseText().trim();
  if (!pw1) return null;

  const res2 = ui.prompt('🔐 비밀번호 확인 (2/2)', '비밀번호를 한 번 더 입력하세요:', ui.ButtonSet.OK_CANCEL);
  if (res2.getSelectedButton() !== ui.Button.OK) return null;
  const pw2 = res2.getResponseText().trim();

  if (pw1 !== pw2) {
    ui.alert('❌ 비밀번호가 일치하지 않습니다.');
    return null;
  }
  return pw1;
}

let _crypto = null;
function getCryptoJS() {
  if (_crypto) return _crypto;
  if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
    globalThis.crypto = {
      getRandomValues: function(b) {
        for (let i = 0; i < b.length; i++) b[i] = Math.floor(Math.random() * 256);
        return b;
      }
    };
  }
  const code = UrlFetchApp.fetch('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.3.0/crypto-js.min.js').getContentText();
  eval(code);
  _crypto = CryptoJS;
  return _crypto;
}

function encryptAES(text, password) {
  return getCryptoJS().AES.encrypt(text, password).toString();
}

function decryptAES(cipherText, password) {
  try {
    const bytes = getCryptoJS().AES.decrypt(cipherText, password);
    const str = bytes.toString(CryptoJS.enc.Utf8);
    return str || null;
  } catch(e) {
    return null;
  }
}
