/**
 * ─────────────────────────────────────────────────────────────────────────────
 * [통합 환경 설정] 선택교과 출석관리 및 결석계 관리 시스템
 * 구글 스크립트 속성에 일일이 들어갈 필요 없이, 모든 시트 ID, GID, GAS 웹앱 URL,
 * 드라이브 폴더 ID를 이 파일 상단에서 모두 일괄 관리합니다.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const ROLLBOOK_CONFIG = {
  // 1. 구글 스프레드시트 및 스크립트 ID
  SHEET_ID: '1-Ki9X_EKw5xEq-Pc-ba-PBU6VWhvdBun-1bkUjTTH0Q',
  SCRIPT_ID: '1CL3o-9sgbEvpGbz645c1fY-luyzMbjS4u6C8cZ_7v9M',

  // 2. 배포된 Google Apps Script (GAS) Web App URL
  DEFAULT_GAS_URL: 'https://script.google.com/macros/s/AKfycbwmLRX6kyuS3NTTeCLk0T7PB-Zk-tZlfFsTnjOyvdwlcGn03PAbufa8s4MbYJs8nFI/exec',

  // 3. 스프레드시트 각 탭 GID 및 시트명
  GIDS: {
    ATTENDANCE: '923106420',   // 출결사항 (구 취합)
    HOLIDAYS: '969683114',     // 행사및휴일
    REGISTRY: '334191447',     // 결석계 접수 대장
    PRINT: '256444665',        // 공식 결석계 인쇄 양식
    RECORDS_NAME: '출결기록'   // 실시간 출결 오버라이드 기록 시트명
  },

  // 4. 구글 드라이브 저장 폴더 ID (기존 GAS 스크립트 속성 대체)
  // 여기에 드라이브 폴더 ID 문자열을 적어두시면 GAS가 이 값을 바로 인식하여 저장합니다.
  DRIVE_FOLDERS: {
    FOLDER_ID: '',          // 생성된 공식 결석계 PDF 파일이 저장될 폴더 ID
    PARENT_FOLDER_ID: '',   // 학부모 전자 서명 이미지(PNG)가 저장될 폴더 ID
    STUDENT_FOLDER_ID: '',  // 학생 전자 서명 이미지(PNG)가 저장될 폴더 ID
    TARGET_ROW: ''          // 대상 행 지정 (선택적)
  },

  // 5. 시스템 기본값 (학년, 반 구성)
  SYSTEM_DEFAULTS: {
    TARGET_GRADE: 3,  // 기본 대상 학년
    MAX_GRADE: 3,     // 최대 학년
    MAX_CLASS: 11,    // 최대 반 수 (1~11반)
    MAX_NUMBER: 35    // 최대 학생 번호
  }
};

const SHEET_ID = ROLLBOOK_CONFIG.SHEET_ID;
const GID_ATTENDANCE = ROLLBOOK_CONFIG.GIDS.ATTENDANCE;
const GID_HOLIDAYS = ROLLBOOK_CONFIG.GIDS.HOLIDAYS;
const SHEET_NAME_RECORDS = ROLLBOOK_CONFIG.GIDS.RECORDS_NAME;
const GID_PRINT = ROLLBOOK_CONFIG.GIDS.PRINT;
const GID_REGISTRY = ROLLBOOK_CONFIG.GIDS.REGISTRY;
const DEFAULT_GAS_URL = ROLLBOOK_CONFIG.DEFAULT_GAS_URL;

let _configuredGasUrl = localStorage.getItem('ggom_gas_webapp_url') || DEFAULT_GAS_URL;

export const SheetAPI = {
  config: ROLLBOOK_CONFIG,
  sheetId: SHEET_ID,
  scriptId: ROLLBOOK_CONFIG.SCRIPT_ID,
  gidAttendance: GID_ATTENDANCE,
  gidHolidays: GID_HOLIDAYS,
  sheetNameRecords: SHEET_NAME_RECORDS,
  gidPrint: GID_PRINT,
  gidRegistry: GID_REGISTRY,
  driveFolders: ROLLBOOK_CONFIG.DRIVE_FOLDERS,
  systemDefaults: ROLLBOOK_CONFIG.SYSTEM_DEFAULTS,
  defaultGasUrl: DEFAULT_GAS_URL,

  // 시트 바로가기 URL 생성 헬퍼
  getRegistrySheetUrl() {
    return `https://docs.google.com/spreadsheets/d/${this.sheetId}/edit?gid=${this.gidRegistry}#gid=${this.gidRegistry}`;
  },
  getPrintSheetUrl() {
    return `https://docs.google.com/spreadsheets/d/${this.sheetId}/edit?gid=${this.gidPrint}#gid=${this.gidPrint}`;
  },
  getHolidaysSheetUrl() {
    return `https://docs.google.com/spreadsheets/d/${this.sheetId}/edit?gid=${this.gidHolidays}#gid=${this.gidHolidays}`;
  },

  getGasUrl() {
    return _configuredGasUrl || localStorage.getItem('ggom_gas_webapp_url') || DEFAULT_GAS_URL;
  },

  setGasUrl(url) {
    _configuredGasUrl = (url || '').trim() || DEFAULT_GAS_URL;
    if (_configuredGasUrl && _configuredGasUrl !== DEFAULT_GAS_URL) {
      localStorage.setItem('ggom_gas_webapp_url', _configuredGasUrl);
    } else {
      localStorage.removeItem('ggom_gas_webapp_url');
    }
  },

  /**
   * Fetch sheet data via gviz JSONP or CSV
   */
  async loadAllData() {
    let attendanceCsv = '';
    let holidaysCsv = '';
    let recordsCsv = '';
    let isLive = false;

    try {
      // Live fetch for attendance, holidays, and records sheet
      const [attData, holData, recData] = await Promise.all([
        this.fetchSheetCsv(this.gidAttendance),
        this.fetchSheetCsv(this.gidHolidays),
        this.fetchSheetByName(this.sheetNameRecords).catch(() => '')
      ]);
      attendanceCsv = attData;
      holidaysCsv = holData;
      recordsCsv = recData;
      isLive = true;
    } catch (err) {
      console.error('Live Google Sheets fetch failed:', err);
      throw err;
    }

    return {
      attendanceCsv,
      holidaysCsv,
      recordsCsv,
      isLive,
      timestamp: new Date()
    };
  },

  /**
   * Fetch CSV from Google Sheets with JSONP fallback
   */
  async fetchSheetCsv(gid) {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${this.sheetId}/export?format=csv&gid=${gid}`;
    try {
      const response = await fetch(csvUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (fetchErr) {
      // Try gviz JSONP approach if direct fetch is blocked by CORS
      return await this.fetchViaGvizJsonp(gid);
    }
  },

  /**
   * Fetch sheet by tab name (e.g. '출결기록')
   */
  async fetchSheetByName(sheetName) {
    const encName = encodeURIComponent(sheetName);
    const csvUrl = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:csv&sheet=${encName}`;
    try {
      const response = await fetch(csvUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (err) {
      return await this.fetchViaGvizJsonpByName(sheetName);
    }
  },

  fetchViaGvizJsonpByName(sheetName) {
    return new Promise((resolve, reject) => {
      const callbackName = `gvizNameCallback_${Date.now()}_${Math.floor(Math.random()*1000)}`;
      const script = document.createElement('script');
      const encName = encodeURIComponent(sheetName);
      script.src = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=responseHandler:${callbackName}&sheet=${encName}`;

      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error(`Timeout fetching sheet ${sheetName}`));
      }, 10000);

      const cleanup = () => {
        clearTimeout(timeout);
        delete window[callbackName];
        if (script.parentNode) script.parentNode.removeChild(script);
      };

      window[callbackName] = (json) => {
        cleanup();
        try {
          const csv = this.convertGvizJsonToCsv(json);
          resolve(csv);
        } catch (e) {
          reject(e);
        }
      };

      script.onerror = () => {
        cleanup();
        reject(new Error(`Script error loading sheet ${sheetName}`));
      };

      document.head.appendChild(script);
    });
  },

  /**
   * Send attendance override records to Google Apps Script Web App
   * @param {Array|Object} records [{ key, date, period, studentId, ban, num, name, room, status }]
   */
  async saveAttendanceRecords(records) {
    const url = this.getGasUrl();
    if (!url) {
      console.warn('Google Apps Script Web App URL이 설정되지 않았습니다.');
      return { status: 'no_gas_url', message: 'GAS URL 미설정' };
    }

    const payload = Array.isArray(records) ? { records } : records;

    // Use text/plain to avoid CORS preflight OPTIONS check in GAS Web App
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`GAS POST failed with HTTP ${response.status}`);
    }

    try {
      return await response.json();
    } catch (e) {
      // Sometimes GAS redirects with opaque or plain response
      return { status: 'success', raw: true };
    }
  },

  /**
   * Fetch submitted absence reports from GAS Web App
   */
  async fetchSubmittedReports() {
    const gasUrl = this.getGasUrl();
    if (!gasUrl) return [];
    const teacherKey = localStorage.getItem('teacher_auth_key') || 'teacher2026';
    const sep = gasUrl.includes('?') ? '&' : '?';
    const url = `${gasUrl}${sep}action=get_submitted_reports&key=${encodeURIComponent(teacherKey)}`;

    try {
      const response = await fetch(url);
      if (!response.ok) return [];
      const json = await response.json();
      if (json && json.status === 'success' && Array.isArray(json.reports)) {
        return json.reports;
      }
      return [];
    } catch (e) {
      console.warn('Failed to fetch submitted reports from GAS:', e);
      return [];
    }
  },

  /**
   * Fetch sheet data using Google Visualization API (JSONP callback)
   */
  /**
   * Common helper to POST JSON payload to GAS Web App
   */
  async postToGas(payload) {
    const url = this.getGasUrl();
    if (!url) {
      console.warn('Google Apps Script Web App URL이 설정되지 않았습니다.');
      return { status: 'no_gas_url', message: 'GAS URL 미설정' };
    }

    // api.js 상단 설정값 자동 주입
    const enrichedPayload = {
      folderConfig: {
        folderId: ROLLBOOK_CONFIG.DRIVE_FOLDERS.FOLDER_ID,
        parentFolderId: ROLLBOOK_CONFIG.DRIVE_FOLDERS.PARENT_FOLDER_ID,
        studentFolderId: ROLLBOOK_CONFIG.DRIVE_FOLDERS.STUDENT_FOLDER_ID,
        targetRow: ROLLBOOK_CONFIG.DRIVE_FOLDERS.TARGET_ROW
      },
      systemConfig: ROLLBOOK_CONFIG.SYSTEM_DEFAULTS,
      ...payload
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(enrichedPayload)
      });

      if (!response.ok) {
        throw new Error(`GAS POST failed with HTTP ${response.status}`);
      }

      try {
        return await response.json();
      } catch (e) {
        return { status: 'success', raw: true };
      }
    } catch (err) {
      console.error('GAS 요청 실패:', err);
      throw err;
    }
  },

  /**
   * Submit absence report to GAS (Maps to '인쇄' sheet, creates PDF, saves to '대장')
   */
  async submitAbsenceReport(reportData) {
    return await this.postToGas({
      action: 'submitReport',
      data: reportData
    });
  },

  /**
   * Map to '인쇄' sheet and generate PDF without adding a new row to '대장'
   */
  async printReportOnly(reportData) {
    return await this.postToGas({
      action: 'printReport',
      data: reportData
    });
  },

  /**
   * Recreate PDF for a specific row in '대장' sheet
   */
  async recreateAbsencePdf(rowNo) {
    return await this.postToGas({
      action: 'recreatePdf',
      rowNo
    });
  },

  /**
   * Generate merged single PDF for multiple selected rows
   */
  async generateMergedAbsencePdf(rowNos) {
    return await this.postToGas({
      action: 'generateMergedPdf',
      rowNos
    });
  },

  fetchViaGvizJsonp(gid) {
    return new Promise((resolve, reject) => {
      const callbackName = `gvizCallback_${gid}_${Date.now()}`;
      const script = document.createElement('script');
      script.src = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=responseHandler:${callbackName}&gid=${gid}`;

      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error(`Timeout fetching GID ${gid} via JSONP`));
      }, 10000);

      const cleanup = () => {
        clearTimeout(timeout);
        delete window[callbackName];
        if (script.parentNode) script.parentNode.removeChild(script);
      };

      window[callbackName] = (json) => {
        cleanup();
        try {
          const csv = this.convertGvizJsonToCsv(json);
          resolve(csv);
        } catch (e) {
          reject(e);
        }
      };

      script.onerror = () => {
        cleanup();
        reject(new Error(`Script load error for GID ${gid}`));
      };

      document.head.appendChild(script);
    });
  },

  /**
   * Convert gviz JSON table format to CSV string
   */
  convertGvizJsonToCsv(json) {
    if (!json || !json.table || !json.table.rows) return '';
    const lines = [];

    // Include header row from cols if present
    if (json.table.cols && json.table.cols.some(c => c && c.label)) {
      const headerLine = json.table.cols.map(c => {
        let val = c ? (c.label || '') : '';
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          val = '"' + val.replace(/"/g, '""') + '"';
        }
        return val;
      }).join(',');
      lines.push(headerLine);
    }

    const rows = json.table.rows;
    rows.forEach(r => {
      const cells = r.c || [];
      const line = cells.map(cell => {
        if (!cell || cell.v === null || cell.v === undefined) return '';
        let val = String(cell.v);
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          val = '"' + val.replace(/"/g, '""') + '"';
        }
        return val;
      }).join(',');
      lines.push(line);
    });

    return lines.join('\n');
  },

  /**
   * Standard robust CSV parser handling quoted values with commas
   */
  parseCsv(text) {
    const lines = [];
    let row = [''];
    let inQuotes = false;
    let i = 0;

    while (i < text.length) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          row[row.length - 1] += '"';
          i += 2;
          continue;
        }
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push('');
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        lines.push(row);
        row = [''];
      } else {
        row[row.length - 1] += char;
      }
      i++;
    }

    if (row.length > 1 || row[0] !== '') {
      lines.push(row);
    }

    return lines;
  }
};
