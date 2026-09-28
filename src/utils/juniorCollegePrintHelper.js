import { schoolName } from './schoolConfig'

/**
 * 연락처 포맷 헬퍼 (010-1234-5678)
 */
function fmtPhone(raw) {
  if (!raw) return ''
  const d = String(raw).replace(/\D/g, '')
  if (d.length === 11) return d.replace(/(\d{3})(\d{4})(\d{4})/, '$1 - $2 - $3')
  if (d.length === 10) return d.replace(/(\d{3})(\d{3})(\d{4})/, '$1 - $2 - $3')
  return raw
}

/**
 * 정식 고등학교명 포맷
 */
function getFormalSchoolName() {
  const raw = schoolName.value || '우리고등학교'
  let s = String(raw).trim()
  if (!s || s === '우리학교' || s === '우리고등학교') return '우리고등학교'
  if (s.endsWith('고') && !s.endsWith('고등학교')) {
    return s.slice(0, -1) + '고등학교'
  }
  if (!s.endsWith('고등학교') && !s.endsWith('학교')) {
    return s + '고등학교'
  }
  return s
}

/**
 * 1. 전문대학 학교장 추천 신청 확인서 (A4 세로 1장 서식)
 *    - 농어촌 추천 확인서와 동일한 교내 사전 등록 및 내부결재 첨부용 문서
 *    - 우측 상단 결재란(담임/부장)
 *    - 학생/보호자 인적사항 및 지원 전문대학/학과/전형 내역
 *    - 학생·보호자 서명 및 학교장 귀하 수신처
 */
export function printJuniorCollegeRecommendationLetter(recordOrList, studentInfo = null) {
  const sSchoolName = getFormalSchoolName()
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1
  const day = today.getDate()

  // 단일 레코드 또는 목록 지원
  const items = Array.isArray(recordOrList) ? recordOrList : [recordOrList]
  const base = items[0] || {}
  const info = studentInfo || base

  const sName = info.student_name || info.name || '학생'
  const sCode = String(info.student_code || '').trim()
  const isEnrolled = info.is_enrolled !== false

  let gradeClassText = ''
  if (isEnrolled) {
    const g = info.grade || 3
    const c = info.class_no ? `${info.class_no}반 ` : ''
    const s = info.seq_no ? `${info.seq_no}번` : ''
    gradeClassText = `제 ${g}학년 ${c}${s} (재학생)`.trim()
  } else {
    gradeClassText = `${info.grad_year || year}년 2월 졸업생`
  }

  const sPhone = fmtPhone(info.student_phone) || '010 - &nbsp;&nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp;&nbsp;'
  const pPhone = fmtPhone(info.parent_phone) || '010 - &nbsp;&nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp;&nbsp;'
  const parentName = info.parent_name || ''

  // 지원 대학 목록 테이블 행 생성 (최소 3행 확보)
  const rowsCount = Math.max(3, items.length)
  const rowsHtml = Array.from({ length: rowsCount }, (_, i) => {
    const it = items[i]
    if (it) {
      return `
        <tr>
          <td style="text-align: center; font-weight: bold;">${i + 1}</td>
          <td style="text-align: center; font-weight: bold; color: #4338ca;">${it.admission_term || '수시 1차'}</td>
          <td style="font-weight: bold; font-size: 11.5px;">${it.univ_name || '-'}</td>
          <td style="font-weight: bold; color: #1e3a8a; font-size: 11.5px;">${it.department_name || '-'}</td>
          <td>${it.track_name || '-'}</td>
          <td style="text-align: center; font-size: 10px; color: #64748b;">${it.created_at ? it.created_at.substring(0, 10) : `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`}</td>
        </tr>
      `
    } else {
      return `
        <tr>
          <td style="text-align: center; color: #94a3b8;">${i + 1}</td>
          <td style="text-align: center; color: #cbd5e1;">-</td>
          <td style="color: #cbd5e1;">-</td>
          <td style="color: #cbd5e1;">-</td>
          <td style="color: #cbd5e1;">-</td>
          <td style="text-align: center; color: #cbd5e1;">-</td>
        </tr>
      `
    }
  }).join('')

  const win = window.open('', '_blank')
  if (!win) {
    alert('팝업 차단이 설정되어 있어 인쇄 창을 열 수 없습니다. 브라우저 설정에서 팝업을 허용해주세요.')
    return
  }

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>2027학년도 대입 전문대학 학교장 추천 신청 확인서 - ${sName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 16mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Pretendard', 'Malgun Gothic', '맑은 고딕', AppleSDGothicNeo, sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 11px;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page-container {
      width: 100%;
      height: 268mm;
      max-height: 268mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* 헤더 및 우측 결재란 */
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .header-title-cell {
      vertical-align: middle;
      text-align: left;
    }
    .sub-title {
      font-size: 11.5px;
      font-weight: 700;
      color: #4338ca;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
    }
    .main-title {
      font-size: 20px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
    }

    /* 우측 2단 결재란 (담임 / 부장) */
    .stamp-box {
      border: 1px solid #334155;
      border-collapse: collapse;
      text-align: center;
      font-size: 10px;
      margin-left: auto;
      table-layout: fixed;
    }
    .stamp-box th, .stamp-box td {
      border: 1px solid #334155;
      padding: 2px 6px;
      box-sizing: border-box;
    }
    .stamp-box th {
      background-color: #f1f5f9;
      font-weight: 700;
      color: #1e293b;
      height: 20px;
    }
    .stamp-box td {
      height: 62px;
      width: 66px;
      min-width: 66px;
      max-width: 66px;
      vertical-align: middle;
    }

    /* 섹션 제목 */
    .section-title {
      font-size: 12px;
      font-weight: 800;
      margin: 12px 0 6px 0;
      color: #0f172a;
      border-left: 4px solid #4338ca;
      padding-left: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* 인적사항 테이블 */
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }
    .info-table th, .info-table td {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
    }
    .info-table th {
      background-color: #f8fafc;
      font-weight: 700;
      color: #1e293b;
      text-align: center;
    }
    .info-table td {
      color: #0f172a;
    }

    /* 지원 희망 내역 테이블 */
    .choice-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }
    .choice-table th, .choice-table td {
      border: 1px solid #cbd5e1;
      padding: 6.5px 7px;
      height: 28px;
    }
    .choice-table th {
      background-color: #f8fafc;
      font-weight: 800;
      text-align: center;
      color: #1e293b;
    }

    /* 확인 및 서약 안내 박스 */
    .notice-box {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      border-radius: 6px;
      padding: 12px 14px;
      margin-top: 14px;
      margin-bottom: 10px;
    }
    .notice-box p {
      font-size: 11px;
      line-height: 1.65;
      color: #334155;
      word-break: keep-all;
      margin-bottom: 6px;
    }
    .notice-box p:last-child {
      margin-bottom: 0;
    }
    .notice-box strong {
      color: #0f172a;
    }

    /* 하단 서명 및 수신자 영역 */
    .footer-sig {
      margin-top: auto;
      padding-top: 20px;
      text-align: center;
    }
    .footer-date {
      font-size: 13.5px;
      font-weight: 700;
      margin-bottom: 18px;
      letter-spacing: 1px;
    }
    .sig-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .sig-table td {
      padding: 0 10px;
    }
    .principal-to {
      font-size: 17px;
      font-weight: 900;
      text-align: left;
      margin-top: 10px;
      letter-spacing: 0.5px;
      color: #0f172a;
      border-top: 1.5px solid #0f172a;
      padding-top: 12px;
    }

    @media print {
      body { margin: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="page-container">
    <div>
      <!-- 상단 헤더 및 우측 결재란 -->
      <table class="header-table">
        <tr>
          <td class="header-title-cell">
            <p class="sub-title">${sSchoolName} 진학지도부</p>
            <h1 class="main-title">2027학년도 대입 전문대학 학교장 추천 신청 확인서</h1>
          </td>
          <td style="text-align: right; width: 150px;">
            <table class="stamp-box">
              <colgroup>
                <col style="width: 22px;">
                <col style="width: 66px;">
                <col style="width: 66px;">
              </colgroup>
              <tr>
                <th rowspan="2" style="background:#f1f5f9;">결<br>재</th>
                <th>담임</th>
                <th>부장</th>
              </tr>
              <tr>
                <td></td>
                <td></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- 1. 지원자 인적사항 -->
      <div class="section-title">■ 지원자 인적사항</div>
      <table class="info-table">
        <tr>
          <th style="width: 90px;">구분 / 학급</th>
          <td style="font-weight: bold; width: 170px;">${gradeClassText}</td>
          <th style="width: 65px;">학번</th>
          <td style="font-weight: bold; font-family: monospace; width: 100px;">${sCode || '-'}</td>
          <th style="width: 65px;">성명</th>
          <td style="font-weight: bold; font-size: 12.5px;">${sName}</td>
        </tr>
        <tr>
          <th>출신고교</th>
          <td>${sSchoolName}</td>
          <th>학생 연락처</th>
          <td colspan="3" style="font-weight: 600;">${sPhone}</td>
        </tr>
      </table>

      <!-- 2. 지원 희망 전문대학 및 전형 내역 -->
      <div class="section-title">■ 전문대학 학교장 추천 지원 희망 내역</div>
      <table class="choice-table">
        <thead>
          <tr>
            <th style="width: 40px;">연번</th>
            <th style="width: 75px;">모집시기</th>
            <th style="width: 150px;">지원 전문대학</th>
            <th style="width: 160px;">지원 학과(부)</th>
            <th>지원 전형명</th>
            <th style="width: 80px;">등록일자</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <!-- 3. 확인 및 서약 안내문 -->
      <div class="notice-box">
        <p>
          1. 본인은 2027학년도 전문대학 입학전형 학교장 추천 대상자로 추천받고자 위와 같이 신청하며, 기재된 대학·학과·전형 정보가 정확함을 확인합니다.
        </p>
        <p>
          2. 본 확인서는 <strong>전문대학 학교장 직인 날인을 위한 교내 내부결재 사전 등록 및 증빙 첨부자료</strong>로 제출하며, 위 기재 사항에 거짓이 없을 확인합니다.
        </p>
        <p style="font-size: 10px; color: #64748b; margin-top: 6px;">
          ※ 본 확인서를 담임선생님께 제출하여 확인 결재를 득한 후, 행정실에 방문하여 학교장 추천 전형서류에 학교장 직인을 날인받으시기 바랍니다.
        </p>
      </div>
    </div>

    <!-- 하단 서명 및 수신자 -->
    <div class="footer-sig">
      <p class="footer-date">
        ${year}년 &nbsp;&nbsp;&nbsp;${month}월 &nbsp;&nbsp;&nbsp;${day}일
      </p>

      <table class="sig-table">
        <tr>
          <td style="width: 50%; text-align: left; font-size: 12px; vertical-align: top;">
            <div>
              지원 학생: <strong style="font-size: 13.5px; margin-left: 4px;">${sName}</strong>
              <span style="color: #94a3b8; font-size: 11px; margin-left: 6px;">(서명 또는 인)</span>
            </div>
            <div style="font-size: 10.5px; color: #64748b; margin-top: 4px;">연락처: ${sPhone}</div>
          </td>
          <td style="width: 50%; text-align: right; font-size: 12px; vertical-align: top;">
            <div>
              학부모(보호자): <strong style="font-size: 13.5px; margin-left: 4px;">${parentName || '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'}</strong>
              <span style="color: #94a3b8; font-size: 11px; margin-left: 6px;">(서명 또는 인)</span>
            </div>
            <div style="font-size: 10.5px; color: #64748b; margin-top: 4px;">비상연락처: ${pPhone}</div>
          </td>
        </tr>
      </table>

      <div class="principal-to">
        ${sSchoolName}장 귀하
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 250);
    };
  </script>
</body>
</html>`

  win.document.open()
  win.document.write(html)
  win.document.close()
  win.focus()
}

/**
 * 2. 전문대학 학교장 추천 대장 (교내 내부결재 기안 첨부용 A4 가로 서식)
 *    추후 교내 내부결재 기안 시 첨부문서 및 교내 보관용 명단으로 사용합니다.
 */
export function printJuniorCollegeRoster(list, options = {}) {
  const records = Array.isArray(list) ? list : []
  const sSchoolName = getFormalSchoolName()
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1
  const day = today.getDate()

  const title = options.title || `${year}학년도 전문대학 학교장 추천자 명단`

  const win = window.open('', '_blank')
  if (!win) {
    alert('팝업 차단이 설정되어 있어 인쇄 창을 열 수 없습니다. 브라우저 설정에서 팝업을 허용해주세요.')
    return
  }

  // 테이블 행 구성 (학급·번호, 연락처, 상태 제외 8개 컬럼)
  const rowsHtml = records.map((r, idx) => {
    const createdDate = r.created_at ? r.created_at.substring(0, 10) : `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    return `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td style="text-align: center; font-family: monospace;">${r.student_code || '-'}</td>
        <td style="text-align: center; font-weight: 800;">${r.student_name || '-'}</td>
        <td style="font-weight: 700; color: #1e3a8a;">${r.univ_name || '-'}</td>
        <td style="font-weight: 700;">${r.department_name || '-'}</td>
        <td>${r.track_name || '-'}</td>
        <td style="text-align: center;">${r.admission_term || '수시'}</td>
        <td style="text-align: center; font-size: 10.5px;">${createdDate}</td>
      </tr>
    `
  }).join('')

  const emptyHtml = records.length === 0 ? `
    <tr>
      <td colspan="8" style="text-align: center; padding: 40px; color: #64748b;">
        등록된 전문대학 학교장 추천 신청 내역이 없습니다.
      </td>
    </tr>
  ` : ''

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${title} - ${sSchoolName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 10mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Pretendard', 'Malgun Gothic', '맑은 고딕', AppleSDGothicNeo, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.4;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet {
      width: 100%;
    }
    
    /* 상단 영역: 제목 중앙 정렬 */
    .top-bar {
      text-align: center;
      margin-bottom: 14px;
      padding-bottom: 10px;
      border-bottom: 2px solid #0f172a;
    }
    .main-head {
      font-size: 20px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: 1px;
    }

    /* 메인 목록 테이블 (세로 A4 최적화) */
    table.roster-table {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #334155;
      font-size: 10.5px;
      margin-top: 6px;
    }
    table.roster-table th, table.roster-table td {
      border: 1px solid #64748b;
      padding: 5px 4px;
      word-break: keep-all;
    }
    table.roster-table th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 800;
      text-align: center;
      white-space: nowrap;
    }

    @media print {
      body { margin: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="top-bar">
      <h1 class="main-head">${title}</h1>
    </div>

    <!-- 대장 테이블 -->
    <table class="roster-table">
      <thead>
        <tr>
          <th style="width: 35px;">연번</th>
          <th style="width: 55px;">학번</th>
          <th style="width: 65px;">성명</th>
          <th style="width: 125px;">지원 대학</th>
          <th style="width: 135px;">지원 학과(부)</th>
          <th>지원 전형명</th>
          <th style="width: 65px;">모집시기</th>
          <th style="width: 75px;">신청일자</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
        ${emptyHtml}
      </tbody>
    </table>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 250);
    };
  </script>
</body>
</html>`

  win.document.open()
  win.document.write(html)
  win.document.close()
  win.focus()
}
