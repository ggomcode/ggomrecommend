/**
 * 2027학년도 학교장추천전형 선정 신청서 인쇄창 출력
 */
export function printApplicationForm(app) {
  const win = window.open('', '_blank')
  
  // 보호자 서명 이미지가 따로 없는 경우 학생 서명으로 대체 바인딩
  const studentSig = app.student_signature_url
    ? `<img src="${app.student_signature_url}" style="max-height: 45px; vertical-align: middle;" />`
    : '(서명)'
  const parentSig = app.student_signature_url
    ? `<img src="${app.student_signature_url}" style="max-height: 45px; vertical-align: middle; filter: hue-rotate(90deg);" />`
    : '(서명)'

  win.document.write(`
    <html>
      <head>
        <title>2027학년도 학교장추천전형 선정 신청서</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Malgun Gothic', 'Dotum', sans-serif; line-height: 1.6; color: #111; font-size: 14px; margin: 0; padding: 0; }
          .container { max-width: 100%; margin: 0 auto; }
          .header-title { text-align: center; font-size: 26px; font-weight: bold; margin-bottom: 35px; border-bottom: 2px solid #000; padding-bottom: 10px; text-transform: uppercase; letter-spacing: 0.1em; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
          table, th, td { border: 1.5px solid #000; }
          th { background-color: #f7f9fa; font-weight: bold; text-align: center; padding: 12px 10px; font-size: 13px; }
          td { padding: 12px 10px; text-align: center; }
          .policy-box { border: 1px solid #333; background-color: #fafbfc; padding: 18px; font-size: 13px; line-height: 1.8; margin-bottom: 35px; text-align: justify; word-break: break-all; }
          .policy-title { font-weight: bold; margin-bottom: 6px; font-size: 14px; }
          .sig-row { display: flex; justify-content: space-between; margin-top: 40px; padding: 0 20px; }
          .sig-col { font-size: 14px; font-weight: bold; display: flex; items: center; gap: 8px; }
          .footer-section { text-align: center; margin-top: 70px; font-size: 16px; font-weight: bold; }
          .footer-date { font-size: 15px; margin-bottom: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header-title">2027학년도 학교장추천전형 선정 신청서</div>
          
          <table>
            <tr>
              <th width="20%">신청 학생</th>
              <td width="30%">${app.profiles?.name || app.name || ''}</td>
              <th width="20%">학번 (수험번호)</th>
              <td width="30%">${app.profiles?.student_code || app.student_code || ''}</td>
            </tr>
            <tr>
              <th>구분</th>
              <td>${app.profiles?.is_enrolled ? '재학생' : '졸업생'}</td>
              <th>연락처</th>
              <td>${app.profiles?.phone_last4 ? '끝자리 ' + app.profiles.phone_last4 : '등록됨'}</td>
            </tr>
            <tr>
              <th>희망 대학교</th>
              <td><strong>${app.universities?.univ_name || app.univ_name || ''}</strong></td>
              <th>희망 전형</th>
              <td>${app.universities?.track_name || app.track_name || ''}</td>
            </tr>
            <tr>
              <th>모집단위 (학과)</th>
              <td><strong>${app.department_name || ''}</strong></td>
              <th>내신 산출 점수</th>
              <td style="font-weight: bold; color: #1d4ed8;">${app.manual_score || app.total_score || '0'} 점</td>
            </tr>
            <tr>
              <th>보호자 성명</th>
              <td>${app.parent_name || '임의'}</td>
              <th>보호자 연락처</th>
              <td>${app.parent_phone || '010-0000-0000'}</td>
            </tr>
          </table>

          <div class="policy-box">
            <div class="policy-title">■ 학교장추천 대상자 선정 서약 조항</div>
            본인은 2027학년도 대학수학능력시험 및 수시 모집에서 대입 학교장추천을 희망하여 신청서를 제출합니다.
            본인은 학교의 학교장추천 심의원회 규정을 준수하며, 경합이 발생하는 대학의 전형에 대해서는 학교 선발 우선순위 및 내신 성적 기준에 따른 공정한 심사 결과를 겸허히 수용할 것을 엄숙히 서약합니다.
            아울러 추천이 확정된 이후 정당한 사유 없이 임의 포기하여 타 학생의 기회를 박탈하지 않도록 신중하게 행동할 것을 확인합니다.
          </div>

          <div class="sig-row">
            <div class="sig-col">신청 학생 성명: ${app.profiles?.name || app.name || ''} (서명/날인) ${studentSig}</div>
            <div class="sig-col">보호자(학부모) 성명: ${app.parent_name || ''} (서명/날인) ${parentSig}</div>
          </div>

          <div class="footer-section">
            <div class="footer-date">${new Date().getFullYear()}년 ${new Date().getMonth() + 1}월 ${new Date().getDate()}일</div>
            OO고등학교장 귀하
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 600);
          }
        <\/script>
      </body>
    </html>
  `)
  win.document.close()
}

/**
 * 7컬럼 최적화 라운드 추천 결과 보고서 인쇄
 */
export function printRoundsReport(roundId, results) {
  const win = window.open('', '_blank')
  
  const rowsHtml = results.map((r, idx) => `
    <tr>
      <td class="font-mono">${r.ranking || r.track_rank || (idx + 1)}</td>
      <td class="font-mono">${r.student_code}</td>
      <td><strong>${r.name}</strong></td>
      <td>${r.univ_name}</td>
      <td>${r.track_name}</td>
      <td>${r.department_name || '—'}</td>
      <td style="font-weight: bold; color: ${r.abandoned ? '#dc2626' : r.recommended ? '#16a34a' : '#d97706'}">
        ${r.abandoned ? '포기완료' : r.recommended ? '추천확정' : '심의대기'}
      </td>
    </tr>
  `).join('')

  win.document.write(`
    <html>
      <head>
        <title>${roundId}차 라운드 학교장추천 선발 결과 보고서</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Malgun Gothic', sans-serif; line-height: 1.4; color: #222; margin: 0; padding: 0; font-size: 12px; }
          .header { text-align: center; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: bold; margin: 0 0 5px 0; border-bottom: 1.5px solid #000; padding-bottom: 8px; }
          .meta { display: flex; justify-content: space-between; font-size: 11px; color: #555; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; }
          table, th, td { border: 1px solid #111; }
          th { background-color: #f5f6f7; font-weight: bold; font-size: 11px; padding: 8px 5px; text-align: center; }
          td { padding: 7px 5px; text-align: center; }
          .font-mono { font-family: 'Consolas', 'Courier New', monospace; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2 class="title">${roundId}차 추천 라운드 학교장추천전형 결과 보고서 (7컬럼)</h2>
        </div>
        <div class="meta">
          <span>발행처: OO고등학교 3학년 부장실</span>
          <span>출력 일시: ${new Date().toLocaleString('ko-KR')}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th width="8%">순위</th>
              <th width="14%">학번</th>
              <th width="12%">이름</th>
              <th width="18%">대학명</th>
              <th width="18%">전형유형 (전형명)</th>
              <th width="16%">지원학과 (모집단위)</th>
              <th width="14%">최종 상태</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 600);
          }
        <\/script>
      </body>
    </html>
  `)
  win.document.close()
}
