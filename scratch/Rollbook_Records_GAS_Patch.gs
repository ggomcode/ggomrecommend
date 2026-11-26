/**
 * 포곡고 출결기록 & 결석계 초경량 단일 웹훅 API
 * - 출결기록 열 구조 (A~K열):
 *   A: 날짜_교시_학번 | B: 날짜 | C: 교시 | D: 반 | E: 번호 | F: 이름
 *   G: 이동반교실 | H: 출결내용 | I: 사유(신규) | J: 수정일시 | K: 서류제출여부
 */
const SHEET_RECORDS = '출결기록';
const SHEET_REGISTRY = '대장';

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: '포곡고 출결 & 결석계 초경량 단일 웹훅 API 정상 가동 중',
    time: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let payload = {};
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e.parameter && e.parameter.data) {
      payload = JSON.parse(e.parameter.data);
    }

    // 1. 학생/학부모 결석계 제출 처리
    if (payload.action === 'submit_absence') {
      let sheet = ss.getSheetByName(SHEET_REGISTRY);
      if (!sheet) sheet = ss.insertSheet(SHEET_REGISTRY);

      const newNo = sheet.getLastRow();
      const d = payload;

      let studentSigUrl = '';
      let parentSigUrl = '';
      try {
        if (d.studentSigData) {
          const sBlob = Utilities.newBlob(Utilities.base64Decode(d.studentSigData.split(',')[1]), 'image/png', `${d.grade}${d.class}${d.number}_학생서명.png`);
          const sFolder = getTargetFolder('3학년_출결_학생_서명');
          const sFile = sFolder.createFile(sBlob);
          sFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          studentSigUrl = sFile.getUrl();
        }
        if (d.parentSigData) {
          const pBlob = Utilities.newBlob(Utilities.base64Decode(d.parentSigData.split(',')[1]), 'image/png', `${d.grade}${d.class}${d.number}_학부모서명.png`);
          const pFolder = getTargetFolder('3학년_출결_학부모_서명');
          const pFile = pFolder.createFile(pBlob);
          pFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          parentSigUrl = pFile.getUrl();
        }
      } catch (sigErr) {
        console.warn('서명 이미지 저장 경고:', sigErr.message);
      }

      sheet.appendRow([
        newNo, d.grade, d.class, d.number, d.name,
        d.cat === '결석', d.cat === '지각', d.cat === '조퇴', d.cat === '결과',
        d.type === '질병', d.type === '생리통', d.type === '출석인정', d.type === '기타',
        d.startDate, d.startPeriod, d.endDate, d.endPeriod,
        d.totalDays, d.reason, d.writeDate, d.parentName,
        '', '', '', '', '', '', '', '', '', '', '', '',
        studentSigUrl, parentSigUrl, '', Utilities.formatDate(new Date(), 'GMT+9', 'yyyy-MM-dd HH:mm:ss'), d.subType, ''
      ]);

      return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. 인쇄 상태 갱신 처리
    if (payload.action === 'mark_printed') {
      const sheet = ss.getSheetByName(SHEET_REGISTRY);
      if (sheet && Array.isArray(payload.rowNos)) {
        const data = sheet.getDataRange().getValues();
        const timeStr = Utilities.formatDate(new Date(), 'GMT+9', 'yyyy-MM-dd HH:mm');
        for (let i = 1; i < data.length; i++) {
          if (payload.rowNos.some(no => String(no) === String(data[i][0]))) {
            sheet.getRange(i + 1, 39).setValue(timeStr);
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. 출석부 실시간 출결 및 일자별 사유 일괄 저장 (출결기록 시트 A~K열)
    let sheet = ss.getSheetByName(SHEET_RECORDS);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_RECORDS);
      sheet.appendRow(['날짜_교시_학번', '날짜', '교시', '반', '번호', '이름', '이동반교실', '출결내용', '사유', '수정일시', '서류제출여부']);
      sheet.setFrozenRows(1);
    } else {
      ensureAttendanceRecordsReasonColumn_(sheet);
    }

    const records = Array.isArray(payload) ? payload : (payload.records || [payload]);
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
    const lastRow = sheet.getLastRow();
    const existingRows = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, 11).getValues() : [];

    const rowIndexByKey = {};
    for (let i = 0; i < existingRows.length; i++) {
      const k = String(existingRows[i][0] || '').trim();
      if (k) rowIndexByKey[k] = i;
    }

    const keysToDelete = {};
    records.forEach(rec => {
      if (!rec) return;
      const key = String(rec.key || `${rec.date}_${rec.period}_${rec.studentId}`).trim();
      if (!key) return;

      const status = (rec.status || '').trim();
      const reasonDefined = rec.reason !== undefined;
      const reason = reasonDefined ? String(rec.reason || '').trim() : undefined;
      const isDelete = (rec.action === 'delete' && !reason) || ((!status || status === '출석') && !reason && rec.docSubmitted === undefined);

      const existingIdx = rowIndexByKey[key];
      const prevRow = existingIdx !== undefined ? existingRows[existingIdx] : null;

      if (isDelete) {
        keysToDelete[key] = true;
        return;
      }

      delete keysToDelete[key];
      const finalReason = reason !== undefined ? reason : (prevRow ? String(prevRow[8] || '').trim() : '');
      const docSub = rec.docSubmitted !== undefined
        ? (rec.docSubmitted ? '제출' : '')
        : (prevRow ? prevRow[10] : '');

      const newRow = [
        key,
        rec.date || (prevRow ? prevRow[1] : ''),
        rec.period !== undefined ? rec.period : (prevRow ? prevRow[2] : ''),
        rec.ban !== undefined ? rec.ban : (prevRow ? prevRow[3] : ''),
        rec.num !== undefined ? rec.num : (prevRow ? prevRow[4] : ''),
        rec.name || (prevRow ? prevRow[5] : ''),
        rec.room !== undefined ? rec.room : (prevRow ? prevRow[6] : ''),
        status === '출석' ? '' : status,
        finalReason, // I열: 사유
        nowStr,      // J열: 수정일시
        docSub       // K열: 서류제출여부
      ];

      if (existingIdx !== undefined) {
        existingRows[existingIdx] = newRow;
      } else {
        rowIndexByKey[key] = existingRows.length;
        existingRows.push(newRow);
      }
    });

    const finalRows = existingRows.filter(r => !keysToDelete[String(r[0] || '').trim()]);
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, 11).clearContent();
    }
    if (finalRows.length > 0) {
      if (sheet.getMaxRows() < finalRows.length + 1) {
        sheet.insertRowsAfter(sheet.getMaxRows(), finalRows.length + 1 - sheet.getMaxRows());
      }
      sheet.getRange(2, 1, finalRows.length, 11).setValues(finalRows);
    }
    SpreadsheetApp.flush();

    return ContentService.createTextOutput(JSON.stringify({ status: 'success', count: records.length })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.message })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * 기존 10열('수정일시'가 I열) 시트인 경우 I열 앞에 '사유' 열을 1회 자동 삽입
 */
function ensureAttendanceRecordsReasonColumn_(sheet) {
  const lastCol = Math.max(sheet.getLastColumn(), 10);
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || '').trim());
  if (!headers.some(h => h === '사유')) {
    if (headers[8] === '수정일시' || headers[8].indexOf('수정') !== -1) {
      sheet.insertColumnBefore(9);
    } else if (sheet.getMaxColumns() < 11) {
      sheet.insertColumnsAfter(sheet.getMaxColumns(), 11 - sheet.getMaxColumns());
    }
    sheet.getRange(1, 9).setValue('사유');
    sheet.getRange(1, 10).setValue('수정일시');
    sheet.getRange(1, 11).setValue('서류제출여부');
  }
}

function getTargetFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(folderName);
}
