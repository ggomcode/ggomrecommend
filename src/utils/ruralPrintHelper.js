import { schoolName } from './schoolConfig';

/**
 * 학생용 '2027학년도 대입 농어촌 전형 추천 확인서' (A4 2페이지 양면 서식) 인쇄
 */
export function printRuralConfirmationDocument(studentInfo, applications, studentSig, parentSig, parentName = '') {
  const sName = schoolName.value || '우리고등학교';
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  // 매개변수 유연 처리 (4개 인자 또는 1개 통합 객체)
  const info = studentInfo || {};
  const sNameVal = info.studentName || info.name || '학생';
  const rawCodeVal = String(info.studentCode || info.student_code || info.code || '-').trim();
  const sCodeVal = rawCodeVal.length > 5 ? rawCodeVal.slice(-5) : rawCodeVal;
  const classNoVal = info.classNo ?? info.class_no ?? '';
  const seqNoVal = info.seqNo ?? info.seq_no ?? info.studentNo ?? '';
  
  const choices = applications || info.choices || info.applications || [];
  const sSig = studentSig || info.studentSignature || info.studentSig || null;
  const pSig = parentSig || info.parentSignature || info.parentSig || null;

  // 연락처 포맷
  function fmtPhone(raw) {
    if (!raw) return '';
    const d = String(raw).replace(/\D/g, '');
    if (d.length === 11) return d.replace(/(\d{3})(\d{4})(\d{4})/, '$1 - $2 - $3');
    if (d.length === 10) return d.replace(/(\d{3})(\d{3})(\d{4})/, '$1 - $2 - $3');
    return raw;
  }
  const sPhoneFmt = fmtPhone(info.studentPhone || info.student_phone || info.phone) || '010 -&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; -';
  const pPhoneFmt = fmtPhone(info.parentPhone || info.parent_phone || info.emergencyPhone) || '010 -&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; -';

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('팝업 차단이 설정되어 있어 인쇄 창을 열 수 없습니다.');
    return;
  }

  // 1지망~6지망 6행 규격 표 생성
  const rows = [];
  for (let i = 0; i < 6; i++) {
    const app = choices[i];
    if (app) {
      rows.push(`
        <tr>
          <td style="text-align: center; font-weight: bold;">${i + 1}지망</td>
          <td style="text-align: center;">${app.term_type || '수시'}</td>
          <td style="text-align: center;">${app.medical_type && app.medical_type !== '없음' ? app.medical_type : '-'}</td>
          <td style="font-weight: bold;">${app.univ_name || '-'}</td>
          <td style="font-weight: bold; color: #1e3a8a;">${app.department || '-'}</td>
          <td>${app.track_type || '-'}</td>
          <td style="font-weight: bold;">${app.track_name || '-'}</td>
          <td style="font-size: 10.5px;">${app.remarks || app.recruitment_quota ? `모집:${app.recruitment_quota || '-'} ${app.remarks || ''}` : '-'}</td>
        </tr>
      `);
    } else {
      rows.push(`
        <tr>
          <td style="text-align: center; font-weight: bold; color: #94a3b8;">${i + 1}지망</td>
          <td style="text-align: center; color: #cbd5e1;">-</td>
          <td style="text-align: center; color: #cbd5e1;">-</td>
          <td style="color: #cbd5e1;">-</td>
          <td style="color: #cbd5e1;">-</td>
          <td style="color: #cbd5e1;">-</td>
          <td style="color: #cbd5e1;">-</td>
          <td style="color: #cbd5e1;">-</td>
        </tr>
      `);
    }
  }
  const choicesHtml = rows.join('');

  const html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>2027학년도 대입 농어촌 전형 추천 확인서 - ${sNameVal}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 20mm;
        }
        @page :right {
          margin: 20mm;
        }
        @page :left {
          margin: 20mm;
        }
        * {
          box-sizing: border-box;
        }
        body {
          font-family: 'Pretendard', 'Malgun Gothic', sans-serif;
          color: #0f172a;
          margin: 0;
          padding: 0;
          font-size: 11px;
          line-height: 1.4;
          background: #fff;
        }
        .page {
          width: 100%;
          height: 254mm;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          page-break-after: always;
          break-after: page;
          page-break-inside: avoid;
          break-inside: avoid;
          overflow: hidden;
        }
        .page:last-child {
          page-break-after: avoid;
          break-after: avoid;
        }
        .page-body {
          flex: 1;
        }
        .duplex-notice {
          font-size: 9.5px;
          color: #64748b;
          text-align: right;
          margin-bottom: 4px;
          font-weight: 500;
        }
        .header-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
        }
        .header-title {
          font-size: 19px;
          font-weight: 800;
          letter-spacing: -0.5px;
          text-align: left;
        }
        .stamp-box {
          border: 1px solid #334155;
          border-collapse: collapse;
          text-align: center;
          font-size: 11px;
          margin-left: auto;
        }
        .stamp-box th, .stamp-box td {
          border: 1px solid #334155;
          padding: 3px 8px;
        }
        .stamp-box th {
          background-color: #f1f5f9;
          font-weight: bold;
        }
        .stamp-box td {
          height: 40px;
          width: 48px;
          vertical-align: middle;
        }
        .info-table, .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
        }
        .info-table th, .info-table td {
          border: 1px solid #cbd5e1;
          padding: 5px 7px;
        }
        .data-table th, .data-table td {
          border: 1px solid #cbd5e1;
          padding: 12px 7px; /* 2배 이상 높이 확장 */
          height: 35px; /* 최소 높이 보장 */
        }
        .info-table th, .data-table th {
          background-color: #f8fafc;
          font-weight: bold;
          text-align: center;
          color: #1e293b;
        }
        .section-title {
          font-size: 13.5px;
          font-weight: 800;
          margin: 14px 0 6px 0;
          color: #0f172a;
          border-left: 4px solid #059669;
          padding-left: 8px;
        }
        .footer-sig {
          margin-top: auto;
          padding-top: 15px;
          text-align: center;
        }
        .sig-img {
          height: 32px;
          vertical-align: middle;
        }
        .principal-to {
          font-size: 16px;
          font-weight: 900;
          text-align: left;
          margin-top: 25px;
        }
        .guide-box {
          border: 1px solid #cbd5e1;
          background: #fafafa;
          padding: 10px 12px;
          border-radius: 6px;
          margin-bottom: 10px;
        }
        .guide-box h4 {
          margin: 0 0 4px 0;
          font-size: 12px;
          color: #047857;
        }
        .guide-box ul, .guide-box ol {
          margin: 0;
          padding-left: 16px;
        }
        .guide-box li {
          margin-bottom: 3px;
        }
      </style>
    </head>
    <body>

      <!-- PAGE 1: 신청 확인서 및 지망 목록 -->
      <div class="page">
        <div class="page-body">
          <table class="header-table">
            <tr>
              <td class="header-title">2027학년도 대입 농어촌 전형 추천 확인서</td>
              <td style="text-align: right;">
                <table class="stamp-box">
                  <tr>
                    <th rowspan="2" style="width: 20px; background:#f1f5f9;">결<br>재</th>
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

          <table class="info-table">
            <tr>
              <th>학년 / 반 / 번호</th>
              <td style="font-weight: bold;">3학년 ${classNoVal ? `${classNoVal}반 ` : ''}${seqNoVal ? `${seqNoVal}번` : ''}</td>
              <th>학번</th>
              <td style="font-weight: bold; font-family: monospace;">${sCodeVal}</td>
              <th>성명</th>
              <td style="font-weight: bold; font-size: 13px;">${sNameVal}</td>
            </tr>
          </table>

          <div class="section-title">■ 지원 희망 대학 및 전형 내역 (최대 6개)</div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 45px;">지망</th>
                <th style="width: 45px;">구분</th>
                <th style="width: 60px;">메디컬</th>
                <th>대학명</th>
                <th>학과(부)</th>
                <th>전형유형</th>
                <th>전형명</th>
                <th>비고 및 모집인원</th>
              </tr>
            </thead>
            <tbody>
              ${choicesHtml}
            </tbody>
          </table>

          <p style="font-size: 13.5px; font-weight: bold; color: #334155; margin-top: 15px; line-height: 1.6; word-break: keep-all;">
            본인은 2027학년도 대학입학 농어촌 및 기회균형(농어촌) 특별전형 지원 자격을 확인하였으며, 위 기재 사항에 틀림없음을 확인합니다. 제출된 서류는 반납되지 않으며 거짓 기재가 있을 경우 관련 규정에 따라 조치됨을 인지하였습니다.
          </p>
        </div>

        <!-- 하단 서명 및 수신자 고정 정렬 -->
        <div class="footer-sig">
          <p style="font-size: 14px; font-weight: bold; margin-bottom: 20px;">
            ${year}년 ${month}월 ${day}일
          </p>

          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr>
              <td style="width: 50%; text-align: left; font-size: 13px; vertical-align: top;">
                <div>
                  지원 학생: <strong style="font-size: 14px;">${sNameVal}</strong>
                  ${sSig ? `<img src="${sSig}" class="sig-img" alt="서명" />` : '(서명 / 인)'}
                </div>
                <div style="font-size: 11.5px; color: #475569; margin-top: 4px;">(연락처: ${sPhoneFmt})</div>
              </td>
              <td style="width: 50%; text-align: right; font-size: 13px; vertical-align: top;">
                <div>
                  학부모(보호자): ${parentName || '____________________'}
                  ${pSig ? `<img src="${pSig}" class="sig-img" alt="서명" />` : '(서명 / 인)'}
                </div>
                <div style="font-size: 11.5px; color: #475569; margin-top: 4px;">(비상연락처: ${pPhoneFmt})</div>
              </td>
            </tr>
          </table>

          <div class="principal-to">
            ${sName}장 귀하
          </div>
        </div>
      </div>

      <!-- PAGE 2: 지원자격 확인 및 행정처리 안내서 -->
      <div class="page">
        <div class="page-body">
          <h2 style="font-size: 17px; font-weight: 800; border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 12px; margin-top: 0;">
            농어촌 특별전형 지원자격 확인 및 행정처리 안내
          </h2>

          <div class="guide-box">
            <h4>1. 지원자격 확인 요건</h4>
            <ul>
              <li><strong>유형 Ⅰ (6년 요건)</strong>: 학교 - 읍면지역 소재 중/고등학교 6년 연속 재학 / 주소지 - 읍면지역 6년 연속 거주 (부모 및 본인 모두 읍면 거주)</li>
              <li><strong>유형 Ⅱ (12년 요건)</strong>: 학교 - 읍면지역 소재 초/중/고등학교 12년 전 교육과정 이수 / 주소지 - 읍면지역 12년 거주 (부모 거주요건 미적용)</li>
            </ul>
          </div>

          <div class="guide-box">
            <h4>2. 제출 서류 안내</h4>
            <ul>
              <li><strong>공통 서류</strong>: (대학별) 농어촌학교 재학사실확인서 (우리고등학교 직인 필요), 주민등록초(등)본 (주소변동 이력 전체 포함 필수), 고등학교/중학교 생활기록부</li>
              <li><strong>추가 서류 (유형 Ⅰ)</strong>: 가족관계증명서 (지원자 기준 상세), 부/모의 주민등록초본 (주소 변동이력 포함)</li>
              <li><strong>추가 서류 (유형 Ⅱ)</strong>: 초등학교 생활기록부</li>
            </ul>
          </div>

          <div class="section-title">■ 행정처리 절차 및 방법</div>
          <table class="data-table" style="font-size: 10.5px;">
            <thead>
              <tr>
                <th style="width: 35px;">순서</th>
                <th style="width: 130px;">내용</th>
                <th style="width: 120px;">장소</th>
                <th>방법 및 세부 안내</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align:center; font-weight:bold;">1</td>
                <td>응시원서접수</td>
                <td>유웨이, 진학어플라이</td>
                <td>원서 작성 후 출력, 서류봉투 겉지 출력 보관</td>
              </tr>
              <tr>
                <td style="text-align:center; font-weight:bold;">2</td>
                <td>주민등록초본 및 가족관계증명서 준비</td>
                <td>행정복지센터 / 인터넷</td>
                <td>주소 변경이력 전체 포함 필수, 유형Ⅰ의 경우 부/모 초본 및 가족관계증명서 추가</td>
              </tr>
              <tr>
                <td style="text-align:center; font-weight:bold;">3</td>
                <td>(초),중,고 생활기록부 준비</td>
                <td>정부24, 무인민원발급기, 행정실</td>
                <td>학교 발급 시 학교생활기록부 발급 신청서 지참</td>
              </tr>
              <tr>
                <td style="text-align:center; font-weight:bold;">4</td>
                <td>농어촌전형 추천시스템 등록</td>
                <td>인터넷 (본 시스템)</td>
                <td>시스템 등록 후 인쇄 및 결재 (확인서 작성)</td>
              </tr>
              <tr>
                <td style="text-align:center; font-weight:bold;">5</td>
                <td>농어촌 재학사실확인서 직인</td>
                <td>행정실</td>
                <td>추천 확인서, 수시응시원서, 농어촌 재학사실확인서 지참 방문</td>
              </tr>
              <tr>
                <td style="text-align:center; font-weight:bold;">6</td>
                <td>추천 확인서 반납</td>
                <td>3학년 교무실</td>
                <td>담임선생님께 추천 확인서 최종 반납</td>
              </tr>
              <tr>
                <td style="text-align:center; font-weight:bold;">7</td>
                <td>서류 발송</td>
                <td>우체국</td>
                <td>대학별 서류 봉투에 봉인 후 등기 발송 (소인일자 확인 필수)</td>
              </tr>
            </tbody>
          </table>

          <div class="guide-box" style="margin-top: 12px; background: #fff1f2; border-color: #fecdd3;">
            <h4 style="color: #be123c;">⚠️ 유의 및 주의사항</h4>
            <ol style="color: #881337;">
              <li><strong>대학별 제출 서류 확인</strong>: 대학마다 서류가 다를 수 있으므로 수시 모집요강을 반드시 확인하세요.</li>
              <li><strong>주민등록 이전 금지</strong>: 농어촌 전형 지원자는 정해진 일자(고교 졸업일 또는 입학 전)까지 주민등록을 옮기지 마세요.</li>
              <li><strong>서류 제출 일시 준수</strong>: 마감 시간 이전에 서류 발송 및 등기 우체국 접수를 완료하세요.</li>
              <li><strong>온라인 서류 제출 확인</strong>: 일부 대학은 온라인 서류 업로드 방식을 사용하므로 입학처 공지를 확인하세요.</li>
            </ol>
          </div>
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * 교사/관리자용 '2027학년도 대입 농어촌 전형 추천 대장' (가로 인쇄 & 학급별 페이지 분리) 인쇄
 */
export function printRuralClassRoster(title, rosterRows) {
  const sName = schoolName.value || '우리고등학교';

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('팝업 차단이 설정되어 있어 인쇄 창을 열 수 없습니다.');
    return;
  }

  // 1. 학급별 그룹핑
  const groupsMap = new Map();
  (rosterRows || []).forEach(r => {
    const rawCode = String(r.student_code || '').trim();
    const isGrad = r.is_enrolled === false || Boolean(r.grad_year) || (rawCode.length > 5);
    
    let groupKey = 'grad';
    let groupLabel = '졸업생';

    if (!isGrad) {
      let classNo = r.student_class != null ? Number(r.student_class) : null;
      if (classNo == null && rawCode.length === 5) {
        const cParsed = parseInt(rawCode.substring(1, 3), 10);
        if (!isNaN(cParsed) && cParsed > 0) classNo = cParsed;
      }
      if (classNo != null && classNo > 0) {
        groupKey = `class_${classNo}`;
        groupLabel = `3학년 ${classNo}반`;
      } else {
        groupKey = 'class_etc';
        groupLabel = '재학생 (학급미지정)';
      }
    }

    if (!groupsMap.has(groupKey)) {
      groupsMap.set(groupKey, {
        key: groupKey,
        label: groupLabel,
        isGrad: isGrad,
        classNo: groupKey.startsWith('class_') ? parseInt(groupKey.replace('class_', ''), 10) : 999,
        rows: []
      });
    }
    groupsMap.get(groupKey).rows.push(r);
  });

  // 그룹 정렬: 3학년 1반, 2반, ..., 기타, 졸업생
  const sortedGroups = Array.from(groupsMap.values()).sort((a, b) => {
    if (a.isGrad !== b.isGrad) return a.isGrad ? 1 : -1;
    return (a.classNo || 999) - (b.classNo || 999);
  });

  // 데이터가 없을 때 기본 빈 그룹
  if (sortedGroups.length === 0) {
    sortedGroups.push({
      key: 'empty',
      label: '전체',
      isGrad: false,
      rows: []
    });
  }

  // 각 학급별 페이지 HTML 렌더링
  const pagesHtml = sortedGroups.map(group => {
    const pageRowsHtml = group.rows.map((r, idx) => {
      const rawCode = String(r.student_code || '').trim();
      const code5 = rawCode ? (rawCode.length > 5 ? rawCode.slice(-5) : rawCode) : '-';

      const isGrad = r.is_enrolled === false || Boolean(r.grad_year) || (rawCode.length > 5);
      const gradYearVal = r.grad_year || (rawCode.length > 5 ? rawCode.slice(0, 4) : '');

      let codeDisplay = `<span style="font-family: monospace; font-weight: bold; font-size: 11px;">${code5}</span>`;
      if (isGrad && gradYearVal) {
        codeDisplay += ` <span style="font-size: 9.5px; color: #475569; font-weight: normal;">(${gradYearVal}년 졸)</span>`;
      }

      const choiceStr = r.choice_number ? `${r.choice_number}지망` : '-';

      return `
        <tr>
          <td style="text-align: center; color: #64748b;">${idx + 1}</td>
          <td style="text-align: center;">${codeDisplay}</td>
          <td style="text-align: center; font-weight: bold; color: #0f172a;">${r.student_name || '-'}</td>
          <td style="text-align: center; font-weight: 800; color: #2563eb;">${choiceStr}</td>
          <td style="text-align: center; font-size: 10.5px;">${r.term_type || '수시'}</td>
          <td style="text-align: center; font-size: 10.5px;">${r.track_type || '-'}</td>
          <td style="font-weight: 800; color: #0f172a;">${r.univ_name || '-'}</td>
          <td style="color: #1e3a8a; font-weight: 800;">${r.department || '-'}</td>
          <td style="font-size: 10.5px; color: #334155;">${r.track_name || '-'}</td>
        </tr>
      `;
    }).join('');

    return `
      <div class="class-page">
        <!-- 1행: 헤더 (대제목 및 결재란) -->
        <div class="page-header-row">
          <div class="title-area">
            <div class="school-name-tag">${sName}</div>
            <h1 class="main-title">2027학년도 대입 농어촌 전형 추천 대장</h1>
            <div class="sub-title">학급: <strong>${group.label}</strong> (신청 건수: 총 ${group.rows.length}건)</div>
          </div>

          <!-- 4단 결재란 (단일 tbody 구성) -->
          <div class="approval-area">
            <table class="stamp-box">
              <tbody>
                <tr>
                  <th rowspan="2" class="stamp-side-th">결<br>재</th>
                  <td class="stamp-header-td">담임</td>
                  <td class="stamp-header-td">부장</td>
                  <td class="stamp-header-td">교감</td>
                  <td class="stamp-header-td">교장</td>
                </tr>
                <tr>
                  <td class="stamp-sign-td"></td>
                  <td class="stamp-sign-td"></td>
                  <td class="stamp-sign-td"></td>
                  <td class="stamp-sign-td"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 2행: 대장 테이블 (A4 가로 9개 컬럼 규격) -->
        <table class="roster-table">
          <thead>
            <tr>
              <th style="width: 40px;">No</th>
              <th style="width: 90px;">학번</th>
              <th style="width: 80px;">성명</th>
              <th style="width: 55px;">지망</th>
              <th style="width: 60px;">시기</th>
              <th style="width: 85px;">전형유형</th>
              <th style="width: 170px;">대학명</th>
              <th style="width: 200px;">모집단위 (학과)</th>
              <th>세부 전형명</th>
            </tr>
          </thead>
          <tbody>
            ${pageRowsHtml || '<tr><td colspan="9" style="text-align:center; padding: 28px; color:#94a3b8; font-weight:600;">신청 내역이 없습니다.</td></tr>'}
          </tbody>
        </table>

        <!-- 하단 푸터 -->
        <div class="page-footer-row">
          <span>출력일시: ${new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          <span>${sName} 대입 추천 관리 시스템</span>
          <span>구분: ${group.label}</span>
        </div>
      </div>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>2027학년도 대입 농어촌 전형 추천 대장</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 15mm;
        }
        * {
          box-sizing: border-box;
        }
        body {
          font-family: 'Pretendard', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
          color: #0f172a;
          margin: 0;
          padding: 0;
          font-size: 11px;
          background: #ffffff;
        }

        /* 각 학급별 페이지 분할 (A4 가로 1장 단위) */
        .class-page {
          page-break-after: always;
          break-after: page;
          min-height: 180mm;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          box-sizing: border-box;
        }
        .class-page:last-child {
          page-break-after: auto;
          break-after: auto;
        }

        /* 헤더 영역 */
        .page-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 10px;
          margin-bottom: 14px;
        }
        .title-area {
          flex: 1;
        }
        .school-name-tag {
          font-size: 12px;
          font-weight: 800;
          color: #047857;
          letter-spacing: 0.04em;
          margin-bottom: 3px;
        }
        .main-title {
          font-size: 19px;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.02em;
        }
        .sub-title {
          font-size: 11.5px;
          color: #475569;
          margin-top: 4px;
        }

        /* 결재란 */
        .approval-area {
          margin-left: 16px;
        }
        .stamp-box {
          border-collapse: collapse;
          text-align: center;
          border: 1px solid #334155;
          background: #ffffff;
        }
        .stamp-side-th {
          padding: 2px 6px;
          border: 1px solid #334155;
          background: #f1f5f9;
          font-weight: 800;
          font-size: 11px;
          line-height: 1.2;
          width: 22px;
        }
        .stamp-header-td {
          padding: 3px 8px;
          border: 1px solid #334155;
          background: #f8fafc;
          font-weight: bold;
          font-size: 11px;
          width: 52px;
          text-align: center;
        }
        .stamp-sign-td {
          height: 40px;
          border: 1px solid #334155;
          min-width: 52px;
        }

        /* 테이블 */
        .roster-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          border: 1px solid #94a3b8;
        }
        .roster-table thead tr {
          background-color: #e2e8f0;
          border-bottom: 1.5px solid #64748b;
        }
        .roster-table th {
          border: 1px solid #cbd5e1;
          padding: 6px 8px;
          font-weight: 800;
          color: #1e293b;
          text-align: center;
        }
        .roster-table td {
          border: 1px solid #cbd5e1;
          padding: 6px 8px;
          vertical-align: middle;
          color: #1e293b;
        }

        /* 푸터 */
        .page-footer-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          color: #64748b;
          border-top: 1px solid #cbd5e1;
          padding-top: 8px;
          margin-top: auto;
        }
      </style>
    </head>
    <body>
      ${pagesHtml}

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
