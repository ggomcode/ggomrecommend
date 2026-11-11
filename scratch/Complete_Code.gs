/**
 * ==========================================================
 * 포곡고 대입 데이터 통합 관리 & 자동 라우팅 배포 시스템 (Apps Script)
 * ----------------------------------------------------------
 * 1. [상단 설정] 암호화 시트 목록과 평문 시트 목록 관리
 * 2. [가채점] 2027모의등급컷 기준 등급 자동 변환 (AS:BB)
 * 3. [배포] 현재 탭 자동 배포 / 등록된 모든 시트 일괄 배포
 * 4. [⭐2027수시] CE:DR 40개 매칭 컬럼 자동 동기화 & 원클릭 암호화 배포
 * ==========================================================
 */

const TARGET_SPREADSHEET_ID = '1U5Vnx2x8gnXQlI3N4deyaurKxj-naZP0cRBb3lQnT4o'; // 배포용 시트 ID
const CUTOFF_SHEET_NAME = '2027모의등급컷'; // 가채점 환산 기준표
const TARGET_ENC_COL_NAME = 'encrypted_data';

// ==========================================================
// ⭐ [관리자 설정] 시트 분류 목록
// ==========================================================

// [1] 암호화하여 배포할 시트 목록 (학생 개인정보, 수시지원, 모의고사 성적)
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
// 상단 커스텀 메뉴 등록
// ==========================================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🚀 대입 데이터 관리')
    .addItem('1. [가채점] 2027모의등급컷 기준 등급 자동 변환 (AS:BB)', 'convertMockGradesToEbs')
    .addSeparator()
    .addItem('2. [배포] 현재 탭 자동 배포 (암호화/평문 자동 판별)', 'syncCurrentSheetUpsert')
    .addItem('3. [배포] 등록된 모든 시트 일괄 배포 (원클릭 동기화)', 'deployAllRegisteredSheets')
    .addSeparator()
    .addItem("4. ['2027수시'] CE:DR 자동 매칭 & 암호화 배포 (원스톱)", 'matchAndDeploy2027Susi')
    .addItem("5. ['2027수시'] CE:DR 자동 매칭만 실행 (시트 확인용)", 'rematch2027SusiColumns')
    .addToUi();
}

/**
 * ==========================================================
 * [기능 4] '2027수시' CE:DR 자동 매칭 & 암호화 배포 원스톱 파이프라인
 * ----------------------------------------------------------
 * 1. 2027수시 시트의 CE:DR(40개 열)을 내장 사전 기반으로 100% 자동 매칭
 * 2. 매칭 직후, 배포 시트로 즉시 AES 암호화 배포까지 논스톱 수행
 * ==========================================================
 */
function matchAndDeploy2027Susi() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const susiSheet = ss.getSheetByName('2027수시');

  if (!susiSheet) {
    ui.alert("❌ '2027수시' 시트를 찾을 수 없습니다.");
    return;
  }

  const lastRow = susiSheet.getLastRow();
  if (lastRow < 2) {
    ui.alert("⚠️ '2027수시' 시트에 데이터가 없습니다.");
    return;
  }

  const confirm = ui.alert(
    "['2027수시'] 매칭 & 암호화 배포 확인",
    `현재 '2027수시' 시트의 ${lastRow - 1}개 행에 대해:\n\n` +
    `1. CE:DR 40개 매칭 컬럼을 자동 동기화하고\n` +
    `2. 배포 시트(${TARGET_SPREADSHEET_ID.slice(0, 8)}...)로 즉시 암호화 배포하시겠습니까?`,
    ui.ButtonSet.YES_NO
  );
  if (confirm !== ui.Button.YES) return;

  // 1. 배포 비밀번호를 먼저 입력받음
  const password = promptPassword(ui);
  if (!password) return;

  // 2. 1단계: CE:DR 40개 매칭 컬럼 자동 실행
  const matchResult = executeMatchingLogic(susiSheet);
  if (!matchResult.success) {
    ui.alert("❌ 매칭 실패: " + matchResult.error);
    return;
  }

  // 3. 2단계: 배포 시트로 AES 암호화 배포 실행
  let targetSs = null;
  try {
    targetSs = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
  } catch (e) {
    ui.alert(`❌ 배포 시트 접근 실패: ${e.message}`);
    return;
  }

  // 2027수시 암호화 배포 (완전 동기화 모드)
  const deployResult = executeEncryptedDeploy(susiSheet, targetSs, password, true);

  if (deployResult.success) {
    ui.alert(
      "🎉 ['2027수시' 매칭 & 암호화 배포 완료]\n\n" +
      `[1단계 CE:DR 매칭 결과]\n` +
      `• 전체 대상 행: ${matchResult.totalRows}건\n` +
      `• 40개 매칭 컬럼 정상 반영: ${matchResult.matchedCount}건\n` +
      (matchResult.collegeCount > 0 ? `• 전문대 수시 자동 보강: ${matchResult.collegeCount}건\n` : '') +
      `\n[2단계 암호화 배포 결과]\n` +
      `• 배포 시트 갱신: ${deployResult.totalRows || deployResult.updateCount + deployResult.insertCount}건 (${deployResult.targetEncColLetter}열)\n\n` +
      `선배 도플갱어 추천 및 상담 시스템에 최신 데이터가 즉시 반영되었습니다!`
    );
  } else {
    ui.alert(`⚠️ CE:DR 매칭은 완료되었으나, 암호화 배포 중 오류가 발생했습니다:\n${deployResult.error}`);
  }
}

/**
 * ==========================================================
 * [기능 5] '2027수시' CE:DR 자동 매칭만 실행 (배포 전 확인용)
 * ==========================================================
 */
function rematch2027SusiColumns() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const susiSheet = ss.getSheetByName('2027수시');

  if (!susiSheet) {
    ui.alert("❌ '2027수시' 시트를 찾을 수 없습니다.");
    return;
  }

  const lastRow = susiSheet.getLastRow();
  if (lastRow < 2) {
    ui.alert("⚠️ '2027수시' 시트에 데이터가 없습니다.");
    return;
  }

  const confirm = ui.alert(
    "CE:DR 매칭 자동 동기화 확인",
    `현재 '2027수시' 시트의 ${lastRow - 1}개 행에 대해 CE:DR 컬럼(40개 열)을 자동 매칭하시겠습니까?\n\n` +
    `• 기존 CE:DR 범위를 깨끗이 초기화하고\n` +
    `• MatchingData.gs의 내장 사전을 대조하여 각 행에 정확한 40개 컬럼을 채웁니다.\n` +
    `• 새로 추가된 전문대 수시 행도 표준 전문대 서식으로 자동 보강됩니다.`,
    ui.ButtonSet.YES_NO
  );
  if (confirm !== ui.Button.YES) return;

  const res = executeMatchingLogic(susiSheet);
  if (res.success) {
    ui.alert(
      "🎉 [2027수시 CE:DR 매칭 완료]\n\n" +
      `• 전체 대상 행: 총 ${res.totalRows}건\n` +
      `• 40개 매칭 컬럼 정상 반영: ${res.matchedCount}건\n` +
      (res.collegeCount > 0 ? `• 전문대 수시 자동 보강: ${res.collegeCount}건\n` : '') +
      (res.fallbackCount > 0 ? `• 기타 신규 추가건: ${res.fallbackCount}건\n\n` : '\n') +
      `시트의 CE2:DR${lastRow} 영역이 최신 데이터로 완벽하게 채워졌습니다!`
    );
  } else {
    ui.alert("❌ 매칭 실패: " + res.error);
  }
}

/**
 * ==========================================================
 * [코어 매칭 엔진] 2027수시 CE:DR 매칭 로직
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

/**
 * ==========================================================
 * [기능 A] 현재 활성화된 탭 자동 판별 배포
 * ==========================================================
 */
function syncCurrentSheetUpsert() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const currentSheet = ss.getActiveSheet();
  const sheetName = currentSheet.getName();

  let targetSs = null;
  try {
    targetSs = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
  } catch (e) {
    ui.alert(`배포 시트 접근 실패: ${e.message}`);
    return;
  }

  // 1. 암호화 대상 시트인 경우
  if (ENCRYPTED_SHEETS.includes(sheetName)) {
    const password = promptPassword(ui);
    if (!password) return;

    const res = executeEncryptedDeploy(currentSheet, targetSs, password, false);
    if (res.success) {
      ui.alert(`🎉 [암호화 배포 완료]\n\n` +
               `• 대상 탭: ${sheetName} (암호화 시트)\n` +
               `• 반영 데이터: ${res.totalRows || (res.updateCount + res.insertCount)}건\n` +
               `• 암호문 저장 열: ${res.targetEncColLetter}열 (${res.targetEncColIndex}번째 열)\n\n` +
               `배포 시트로 안전하게 암호화 배포되었습니다.`);
    } else {
      ui.alert(`❌ 암호화 배포 실패: ${res.error}`);
    }
    return;
  }

  // 2. 평문(비암호화) 대상 시트인 경우
  if (PLAIN_SHEETS.includes(sheetName)) {
    const confirm = ui.alert('확인', `'${sheetName}' 탭은 비암호화(평문) 대상 시트입니다.\n비밀번호 없이 배포 시트로 동기화하시겠습니까?`, ui.ButtonSet.YES_NO);
    if (confirm !== ui.Button.YES) return;

    const res = executePlainDeploy(currentSheet, targetSs);
    if (res.success) {
      ui.alert(`🎉 [평문 배포 완료]\n\n` +
               `• 대상 탭: ${sheetName} (평문 통계 시트)\n` +
               `• 반영 데이터: ${res.rows}행 × ${res.cols}열\n\n` +
               `암호화하지 않고 원본 그대로 배포 시트에 동기화되었습니다.`);
    } else {
      ui.alert(`❌ 평문 배포 실패: ${res.error}`);
    }
    return;
  }

  ui.alert(`⚠️ [배포 대상 아님]\n\n` +
           `현재 탭 '${sheetName}'은(는) 배포 목록에 등록되어 있지 않습니다.\n\n` +
           `• 암호화 필요 시: Code.gs 상단의 ENCRYPTED_SHEETS에 추가\n` +
           `• 평문 통계 시: Code.gs 상단의 PLAIN_SHEETS에 추가`);
}

function deployCurrentSheet() {
  syncCurrentSheetUpsert();
}

/**
 * ==========================================================
 * [기능 B] 등록된 모든 시트 일괄 배포 (원클릭 동기화)
 * ==========================================================
 */
function deployAllRegisteredSheets() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const confirm = ui.alert('일괄 배포 확인', 
    `등록된 모든 시트를 배포 시트로 일괄 동기화하시겠습니까?\n\n` +
    `• 암호화 시트: ${ENCRYPTED_SHEETS.join(', ')}\n` +
    `• 평문 시트: ${PLAIN_SHEETS.join(', ')}`, 
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
    ui.alert(`배포 시트 접근 실패: ${e.message}`);
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

  // 2) 암호화 시트 배포
  for (const sheetName of ENCRYPTED_SHEETS) {
    const s = ss.getSheetByName(sheetName);
    if (!s) {
      results.push(`• [암호화 스킵] '${sheetName}' (원본에 없음)`);
      continue;
    }
    const res = executeEncryptedDeploy(s, targetSs, password, sheetName === '2027수시');
    if (res.success) {
      results.push(`• [암호화 배포] '${sheetName}': ${res.totalRows || (res.updateCount + res.insertCount)}건 완료 (${res.targetEncColLetter}열)`);
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
 * [코어 파이프라인 2] AES 암호화 배포 실행 엔진
 * ----------------------------------------------------------
 * isFullSync가 true이거나 2027수시인 경우:
 * 중간행 추가/삭제에 의한 순서 뒤틀림 및 유령 데이터를 방지하기 위해
 * 원본 시트의 행 순서 그대로 1:1 완벽 동기화(Full Sync)를 수행합니다.
 * ==========================================================
 */
function executeEncryptedDeploy(sourceSheet, targetSs, password, isFullSync) {
  try {
    const sheetName = sourceSheet.getName();
    const isMockExam = sheetName.includes('가채점') || sheetName.includes('모의');
    const targetEncColIndex = isMockExam ? 79 : 157; // CA열(79) vs FA열(157)
    const targetEncColLetter = isMockExam ? 'CA' : 'FA';

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
    const totalDataRows = srcLastRow - 1;

    // 열 크기 확보 및 헤더 설정
    const targetMaxCols = targetSheet.getMaxColumns();
    if (targetMaxCols < targetEncColIndex) {
      targetSheet.insertColumnsAfter(targetMaxCols, targetEncColIndex - targetMaxCols);
    }
    targetSheet.getRange(1, targetEncColIndex).setValue(TARGET_ENC_COL_NAME);

    // 기존 비밀번호 검증 (배포 시트에 이미 암호화 데이터가 있는 경우 비밀번호 불일치 방지)
    const targetLastRow = targetSheet.getLastRow();
    if (targetLastRow > 1) {
      const sampleCheckRows = targetSheet.getRange(2, targetEncColIndex, Math.min(10, targetLastRow - 1), 1).getValues();
      for (let r = 0; r < sampleCheckRows.length; r++) {
        const c = String(sampleCheckRows[r][0] || '').trim();
        if (c.startsWith('U2FsdGVkX1')) {
          if (!decryptAES(c, password)) {
            throw new Error('비밀번호가 기존 배포 시트의 암호화 데이터와 일치하지 않습니다.');
          }
          break;
        }
      }
    }

    // Full Sync 모드 (2027수시 및 모의고사 시트 적용: 행 순서 1:1 보장, 다회차 누락 방지, 잔여 유령 행 자동 삭제)
    if (isFullSync || sheetName === '2027수시' || sheetName.includes('모의') || sheetName.includes('가채점')) {
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

      // 행 크기 확보
      const targetMaxRows = targetSheet.getMaxRows();
      if (targetMaxRows < srcLastRow) {
        targetSheet.insertRowsAfter(targetMaxRows, srcLastRow - targetMaxRows);
      }

      // 암호문 일괄 덮어쓰기 (2초 완료)
      targetSheet.getRange(2, targetEncColIndex, cipherRows.length, 1).setValues(cipherRows);

      // 원본보다 배포 시트에 남은 잉여 행이 있다면 깨끗하게 제거
      if (targetLastRow > srcLastRow) {
        const extraRows = targetLastRow - srcLastRow;
        targetSheet.getRange(srcLastRow + 1, targetEncColIndex, extraRows, 1).clearContent();
      }

      return {
        success: true,
        totalRows: cipherRows.length,
        targetEncColLetter,
        targetEncColIndex
      };
    }

    // Upsert 모드 (기타 개별 갱신 시트용)
    const existingKeyMap = new Map();
    let targetRows = targetSheet.getRange(1, 1, targetLastRow, targetEncColIndex).getValues();
    let targetHeaders = targetRows[0];

    for (let r = 1; r < targetLastRow; r++) {
      const row = targetRows[r];
      let key = extractCompositeKey(row, targetHeaders, isMockExam);
      if (!key) {
        const cipher = String(row[targetEncColIndex - 1] || '').trim();
        if (cipher) {
          const dec = decryptAES(cipher, password);
          if (dec) {
            try {
              const obj = JSON.parse(dec);
              const b = obj['반'] || obj['학급'] || '';
              const n = obj['번호'] || obj['출석번호'] || '';
              const nm = obj['이름'] || obj['성명'] || obj['학생명'] || '';
              if (isMockExam) {
                if (nm) key = `${b}_${n}_${nm}`;
              } else {
                const u = obj['대학명'] || '';
                const d = obj['모집단위'] || '';
                if (nm && u) key = `${b}_${n}_${nm}_${u}_${d}`;
              }
            } catch(e) {}
          }
        }
      }
      if (key) existingKeyMap.set(key, r);
    }

    let updateCount = 0;
    let insertCount = 0;
    const newRowEntries = [];
    const encColUpdates = targetLastRow > 1 ? targetRows.slice(1).map(r => [r[targetEncColIndex - 1]]) : [];

    for (let i = 1; i < srcData.length; i++) {
      const row = srcData[i];
      const key = extractCompositeKey(row, srcHeaders, isMockExam);
      if (!key) continue;

      const rowObj = {};
      let hasData = false;
      for (let j = 0; j < srcHeaders.length; j++) {
        const val = row[j];
        if (val !== '' && val !== null && val !== undefined) {
          hasData = true;
          rowObj[srcHeaders[j]] = (val instanceof Date) ? Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd') : val;
        }
      }
      if (!hasData) continue;

      const cipherText = encryptAES(JSON.stringify(rowObj), password);

      if (existingKeyMap.has(key)) {
        const targetRowIdx = existingKeyMap.get(key) - 1;
        if (targetRowIdx >= 0 && targetRowIdx < encColUpdates.length) {
          encColUpdates[targetRowIdx][0] = cipherText;
          updateCount++;
        }
      } else {
        const newRow = new Array(targetEncColIndex).fill('');
        newRow[targetEncColIndex - 1] = cipherText;
        newRowEntries.push(newRow);
        insertCount++;
      }
    }

    if (encColUpdates.length > 0 && updateCount > 0) {
      targetSheet.getRange(2, targetEncColIndex, encColUpdates.length, 1).setValues(encColUpdates);
    }
    if (newRowEntries.length > 0) {
      targetSheet.getRange(targetSheet.getLastRow() + 1, 1, newRowEntries.length, targetEncColIndex).setValues(newRowEntries);
    }

    return {
      success: true,
      updateCount,
      insertCount,
      targetEncColLetter,
      targetEncColIndex
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * ==========================================================
 * [기능 1] '2027모의등급컷' 기준 가채점 EBS 등급 환산 (AS:BB열)
 * ==========================================================
 */
function convertMockGradesToEbs() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const currentSheet = ss.getActiveSheet();
  const currentName = currentSheet.getName();

  if (!currentName.includes('가채점') && !currentName.includes('모의')) {
    const confirm = ui.alert('확인', `'${currentName}' 탭이 가채점 시트가 맞습니까?\n계속 진행하시겠습니까?`, ui.ButtonSet.YES_NO);
    if (confirm !== ui.Button.YES) return;
  }

  const cutoffSheet = ss.getSheetByName(CUTOFF_SHEET_NAME);
  if (!cutoffSheet) {
    ui.alert(`'${CUTOFF_SHEET_NAME}' 시트를 찾을 수 없습니다.`);
    return;
  }

  const cutoffRows = cutoffSheet.getDataRange().getValues();
  const monthCutoffs = parseAllMonthCutoffs(cutoffRows);

  const lastRow = currentSheet.getLastRow();
  if (lastRow < 3) {
    ui.alert('가채점 시트에 변환할 학생 데이터(3행 이후)가 없습니다.');
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
           `• 환산 학생 수: ${convertedResults.length}명\n` +
           `• 반영 영역: AS3:BB${lastRow}\n\n` +
           `'2027모의등급컷' 기준 환산이 정상적으로 적용되었습니다.`);
}

// ==========================================================
// 보조 헬퍼 함수들
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
      const mNum = parseInt(txt);
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

function extractCompositeKey(row, headers, isMockExam) {
  const findVal = (colName) => {
    const cleanTarget = colName.replace(/[\r\n\s]+/g, '');
    const idx = headers.findIndex(h => String(h || '').replace(/[\r\n\s]+/g, '') === cleanTarget);
    return idx !== -1 ? String(row[idx] || '').trim() : '';
  };
  const ban = findVal('반') || findVal('학급');
  const num = findVal('번호') || findVal('출석번호');
  const name = findVal('이름') || findVal('성명') || findVal('학생명');

  if (isMockExam) {
    if (!name) return '';
    return `${ban}_${num}_${name}`;
  } else {
    const univ = findVal('대학명') || findVal('대학');
    const dept = findVal('모집단위') || findVal('학과');
    if (!name || !univ) return '';
    return `${ban}_${num}_${name}_${univ}_${dept}`;
  }
}

function promptPassword(ui) {
  const res1 = ui.prompt('🔐 관리자 보안 인증 (1/2)', '비밀번호를 입력하세요:', ui.ButtonSet.OK_CANCEL);
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

