import { schoolName, formatSchoolPrincipalTitle } from './schoolConfig.js'

function getFormattedSchoolName(rawInput) {
  const unwrapped = rawInput && typeof rawInput === 'object' && 'value' in rawInput ? rawInput.value : rawInput
  let name = String(unwrapped || '').trim()
  if (!name || name === '우리학교' || name === '우리고등학교') return '우리고등학교'
  if (name.endsWith('고') && !name.endsWith('고등학교')) {
    return name.slice(0, -1) + '고등학교'
  }
  if (!name.endsWith('고등학교') && !name.endsWith('학교')) {
    return name + '고등학교'
  }
  return name
}

/**
 * 2027학년도 대입 학교장추천전형 지원 신청서 인쇄 (학생 1인 1장, 전체 지원 목록)
 * apps        : 해당 학생의 모든 지원 내역 배열 (또는 단일 app 객체 – 하위 호환)
 * studentInfo : { name, student_code, is_enrolled, grad_year, grade, class_no, seq_no,
 *                 student_phone, parent_name, parent_phone,
 *                 student_signature_url, parent_signature_url }
 */
export function printApplicationForm(apps, studentInfo) {
  // 하위 호환: 단일 app 객체로 호출된 경우 자동 변환
  if (!Array.isArray(apps)) {
    const ap = apps
    studentInfo = studentInfo || {
      name: ap.profiles?.name || ap.name || '',
      student_code: ap.profiles?.student_code || ap.student_code || '',
      is_enrolled: ap.is_enrolled,
      grad_year: ap.grad_year,
      grade: ap.grade,
      class_no: ap.class_no,
      seq_no: ap.seq_no,
      student_phone: ap.student_phone || ap.phone || ap.profiles?.phone || '',
      parent_name: ap.parent_name || '',
      parent_phone: ap.parent_phone || '',
      student_signature_url: ap.student_signature_url,
      parent_signature_url: ap.parent_signature_url
    }
    apps = [ap]
  }

  const win = window.open('', '_blank')
  const isEnrolled = studentInfo.is_enrolled !== false

  // 학번 표시 (5자리 숫자 포맷 - 예: 30202)
  const rawCode = String(studentInfo.student_code || '').trim()
  let cleanCode = rawCode.length > 5 ? rawCode.slice(-5) : rawCode
  if (!cleanCode && studentInfo.grade && studentInfo.class_no && studentInfo.seq_no) {
    const g = String(studentInfo.grade).padStart(1, '0')
    const c = String(studentInfo.class_no).padStart(2, '0')
    const s = String(studentInfo.seq_no).padStart(2, '0')
    cleanCode = `${g}${c}${s}`
  }
  const studentNumberDisplay = cleanCode || rawCode

  // 재학생/졸업생 체크박스
  const enrolledBox  = isEnrolled ? '☑ 재학생' : '☐ 재학생'
  const graduatedBox = isEnrolled
    ? '☐ 졸업생: (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)년 2월 졸업'
    : `☑ 졸업생: (${studentInfo.grad_year || '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'})년 2월 졸업`

  // 연락처 포맷
  function fmtPhone(raw) {
    if (!raw) return ''
    const d = String(raw).replace(/\D/g, '')
    if (d.length === 11) return d.replace(/(\d{3})(\d{4})(\d{4})/, '$1 - $2 - $3')
    if (d.length === 10) return d.replace(/(\d{3})(\d{3})(\d{4})/, '$1 - $2 - $3')
    return raw
  }
  const studentPhoneFmt = fmtPhone(studentInfo.student_phone) || '010 -&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; -'
  const parentPhoneFmt  = fmtPhone(studentInfo.parent_phone)  || '010 -&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; -'

  // 서명
  const studentSig = studentInfo.student_signature_url
    ? `<img src="${studentInfo.student_signature_url}" style="max-height:40px;vertical-align:middle;" />`
    : '(서명 또는 인)'
  const parentSigUrl = studentInfo.parent_signature_url || studentInfo.student_signature_url
  const parentSig = parentSigUrl
    ? `<img src="${parentSigUrl}" style="max-height:40px;vertical-align:middle;${!studentInfo.parent_signature_url ? 'filter:hue-rotate(90deg);' : ''}" />`
    : '(서명 또는 인)'

  // 지원 대학 목록 행 (최소 6행)
  const MAX_ROWS = Math.max(6, apps.length)
  const univRows = Array.from({ length: MAX_ROWS }, (_, i) => {
    const ap = apps[i]
    if (!ap) {
      return `<tr>
        <td style="text-align:center;">${i + 1}</td>
        <td></td>
        <td></td>
        <td></td>
        <td style="text-align:center;"></td>
      </tr>`
    }
    const univName  = ap.universities?.univ_name  || ap.univ_name  || ''
    const trackName = ap.universities?.track_name || ap.track_name || ''
    const dept      = ap.department_name || ''
    const ql        = ap.universities?.quota_limit
    const hasQuota  = ap.universities?.has_quota

    let quotaDisplay = '무'
    if (hasQuota !== false && ql != null && ql !== '' && ql !== '없음' && ql !== '무제한' && ql !== 0 && ql !== '0') {
      quotaDisplay = '유'
    }

    // 포기 신청 여부 확인
    const scanned = ap.scanned_doc_url
    let isAbandonRequested = false
    if (scanned) {
      try {
        const parsed = typeof scanned === 'string' ? JSON.parse(scanned) : scanned
        isAbandonRequested = parsed?.abandon_requested === true
      } catch {}
    }
    const rowStyle = isAbandonRequested ? ' class="abandoned-row"' : ''
    const abandonNote = isAbandonRequested ? ' <span style="font-size:10px;color:#b91c1c;font-weight:bold;">(포기 신청)</span>' : ''
    const appRound = ap.round || ap.round_id
    const roundTag = appRound ? ` <span style="font-size:10px;color:#1d4ed8;font-weight:bold;">[${appRound}차]</span>` : ''

    return `<tr${rowStyle}>
      <td style="text-align:center;">${i + 1}</td>
      <td>${univName}${roundTag}${abandonNote}</td>
      <td>${trackName}</td>
      <td>${dept}</td>
      <td style="text-align:center;font-weight:bold;">${quotaDisplay}</td>
    </tr>`
  }).join('')

  const principalTitle = formatSchoolPrincipalTitle(schoolName.value)
  const formattedSchoolName = getFormattedSchoolName(schoolName.value)
  const now  = new Date()
  const yyyy = now.getFullYear()
  const mm   = now.getMonth() + 1
  const dd   = now.getDate()

  win.document.write(`<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>2027학년도 대입 학교장추천전형 지원 신청서</title>
<style>
@page { size: A4 portrait; margin: 15mm 20mm; }
html, body { margin:0; padding:0; background:#fff; height:100%; }
body { font-family:'Malgun Gothic','Dotum',sans-serif; font-size:13px; color:#111; line-height:1.5; }
.container { display:flex; flex-direction:column; justify-content:space-between; height:calc(297mm - 30mm); box-sizing:border-box; }
.top-section { width:100%; }
.header-title { text-align:center; font-size:22px; font-weight:bold; letter-spacing:0.06em; margin-bottom:18px; }
table { width:100%; border-collapse:collapse; }
table, th, td { border:1px solid #222; }
th { background:#f0f0f0; font-weight:bold; text-align:center; padding:7px 6px; font-size:13px; white-space:nowrap; vertical-align:middle; }
td { padding:7px 8px; font-size:13px; vertical-align:middle; }
.univ-table { border:none; margin:0; }
.univ-table th, .univ-table td { border:1px solid #444; padding:5px 4px; font-size:12px; }

/* 포기 신청 행 음영 - 인쇄 강제 적용 */
.abandoned-row td {
  background:#edc8c8 !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
  color: #111;
}

/* 서약사항 박스 */
.oath-container { margin-top:14px; border:1px solid #333; padding:12px 14px; background:#fafafa; border-radius:3px; }
.oath-title { font-weight:bold; font-size:13px; margin-bottom:6px; color:#111; border-bottom:1px solid #ddd; padding-bottom:4px; }
.oath-list { margin:0; padding-left:18px; font-size:12px; line-height:1.65; color:#222; }
.oath-list li { margin-bottom:3px; }

.note { font-size:13px; margin:16px 2px 0px; line-height:1.8; text-align:center; font-weight:bold; }

/* 하단 날짜, 서명, 학교장 직인 영역 (A4 아래쪽 정렬) */
.bottom-section { width:100%; text-align:center; padding-bottom:4mm; }
.sig-date { margin-bottom:20px; font-size:15px; letter-spacing:0.4em; }
.sig-row { display:flex; justify-content:flex-end; gap:50px; margin-bottom:14px; padding-right:10px; }
.sig-item { display:flex; align-items:center; gap:10px; font-size:14px; }
.principal { font-size:20px; font-weight:bold; margin-top:10px; letter-spacing:0.08em; text-align:left; }
</style>
</head><body>
<div class="container">
<div class="top-section">
  <div class="header-title">2027학년도 대입 학교장추천전형 지원 신청서</div>
  <table style="width:100%; border-collapse:collapse; table-layout:fixed;">
  <colgroup>
    <col style="width:12%;" />
    <col style="width:8%;" />
    <col style="width:6%;" />
    <col style="width:21.33%;" />
    <col style="width:21.33%;" />
    <col style="width:21.34%;" />
    <col style="width:10%;" />
  </colgroup>
  <tbody>
  <tr>
    <th colspan="2">재학생/졸업생</th>
    <td colspan="5">${enrolledBox} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${graduatedBox}</td>
  </tr>
  <tr>
    <th colspan="2">학 번</th>
    <td colspan="5">${studentNumberDisplay} <span style="font-size:11px;color:#555;">&nbsp;&nbsp;(※ 졸업생은 재학 당시의 학번으로 기재)</span></td>
  </tr>
  <tr>
    <th colspan="2">성 명</th>
    <td colspan="5" style="font-weight:bold;font-size:15px;">${studentInfo.name || ''}</td>
  </tr>
  <tr>
    <th rowspan="2">연락처</th>
    <th style="background:#f8f8f8;font-weight:normal;font-size:12px;">학 생</th>
    <td colspan="5">${studentPhoneFmt}</td>
  </tr>
  <tr>
    <th style="background:#f8f8f8;font-weight:normal;font-size:12px;">학부모</th>
    <td colspan="5">${parentPhoneFmt}</td>
  </tr>
  <tr>
    <th colspan="2" rowspan="${MAX_ROWS + 1}" style="vertical-align:middle;font-size:12px;padding:6px 4px;line-height:1.5;word-break:keep-all;">
      지원 신청 대학<br>
      <span style="font-size:10px;font-weight:normal;color:#444;display:inline-block;margin-top:4px;">(추천 인원 제한 없이<br>신청 희망 대학을 모두<br>기재할 것)</span>
    </th>
    <th style="background:#f0f0f0;font-size:12px;">순위</th>
    <th style="background:#f0f0f0;font-size:12px;">대학명</th>
    <th style="background:#f0f0f0;font-size:12px;">전형명</th>
    <th style="background:#f0f0f0;font-size:12px;">학과명</th>
    <th style="background:#f0f0f0;font-size:12px;">인원제한</th>
  </tr>
  ${univRows}
  </tbody>
  </table>

  <!-- 서약사항 조항 -->
  <div class="oath-container">
    <div class="oath-title">■ 학교장추천 대상자 선정 서약 조항</div>
    <ol class="oath-list">
      <li>본인은 2027학년도 대학수학능력시험 및 수시 모집에서 대입 학교장추천을 희망하여 신청서를 제출합니다.</li>
      <li>본인은 학교의 학교장추천 심의위원회 규정을 준수하며, 경합이 발생하는 대학의 전형에 대해서는 학교 선발 우선순위 및 내신 성적 기준에 따른 공정한 심사 결과를 겸허히 수용할 것을 엄숙히 서약합니다.</li>
      <li>아울러 추천이 확정된 이후 정당한 사유 없이 임의 포기하여 타 학생의 기회를 박탈하지 않도록 신중하게 행동할 것을 확인합니다.</li>
    </ol>
  </div>

  <p class="note">${formattedSchoolName} 2027학년도 대입 학교장추천전형 선정 규정에 따라 해당 전형 대상자로 추천을 받고자 위와 같이 신청서를 제출합니다.</p>
</div>

<!-- A4 아래쪽에 바싹 내려서 배치되는 날짜/서명/학교장 직인 -->
<div class="bottom-section">
  <div class="sig-date">${yyyy}년 &nbsp;&nbsp; ${mm}월 &nbsp;&nbsp; ${dd}일</div>
  <div class="sig-row">
    <div class="sig-item-box" style="display:flex; flex-direction:column; align-items:flex-end;">
      <div class="sig-item"><span>지원자 : ${studentInfo.name || ''}</span>${studentSig}</div>
      <div style="font-size:11.5px; color:#333; font-weight:normal; margin-top:4px; text-align:right;">(연락처: ${studentPhoneFmt})</div>
    </div>
    <div class="sig-item-box" style="display:flex; flex-direction:column; align-items:flex-end;">
      <div class="sig-item"><span>학부모 : ${studentInfo.parent_name || ''}</span>${parentSig}</div>
      <div style="font-size:11.5px; color:#333; font-weight:normal; margin-top:4px; text-align:right;">(비상연락처: ${parentPhoneFmt})</div>
    </div>
  </div>
  <div class="principal">${principalTitle}</div>
</div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print();window.close();},600);}<\/script>
</body></html>`)
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
      <td style="font-weight:bold;color:${r.abandoned ? '#dc2626' : r.recommended ? '#16a34a' : '#d97706'}">
        ${r.abandoned ? '포기완료' : r.recommended ? '추천확정' : '심의대기'}
      </td>
    </tr>
  `).join('')
  win.document.write(`
    <html><head>
      <title>${roundId}차 라운드 학교장추천 선발 결과 보고서</title>
      <style>
        @page { size: A4 portrait; margin: 15mm; }
        body { font-family:'Malgun Gothic',sans-serif; line-height:1.4; color:#222; margin:0; padding:0; font-size:12px; }
        .header { text-align:center; margin-bottom:20px; }
        .title { font-size:20px; font-weight:bold; margin:0 0 5px 0; border-bottom:1.5px solid #000; padding-bottom:8px; }
        .meta { display:flex; justify-content:space-between; font-size:11px; color:#555; margin-bottom:10px; }
        table { width:100%; border-collapse:collapse; }
        table, th, td { border:1px solid #111; }
        th { background:#f5f6f7; font-weight:bold; font-size:11px; padding:8px 5px; text-align:center; }
        td { padding:7px 5px; text-align:center; }
        .font-mono { font-family:'Consolas','Courier New',monospace; }
      </style>
    </head><body>
      <div class="header"><h2 class="title">${roundId}차 추천 라운드 학교장추천전형 결과 보고서 (7컬럼)</h2></div>
      <div class="meta">
        <span>발행처: OO고등학교 3학년 부장실</span>
        <span>출력 일시: ${new Date().toLocaleString('ko-KR')}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th width="8%">순위</th><th width="14%">학번</th><th width="12%">이름</th>
            <th width="18%">대학명</th><th width="18%">전형유형 (전형명)</th>
            <th width="16%">지원학과 (모집단위)</th><th width="14%">최종 상태</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <script>window.onload=function(){setTimeout(function(){window.print();window.close();},600);}<\/script>
    </body></html>
  `)
  win.document.close()
}

/**
 * 학급별 학교장추천전형 지원 현황 대장 인쇄
 * @param {Object} params
 * @param {string} params.className 학급명 (예: '3학년 1반' 또는 '졸업생')
 * @param {string} params.teacherName 담임/담당 교사 성명
 * @param {string} params.roundTitle 선발 차수 명칭 (예: '1차 추천 선발' 또는 '추천 선발')
 * @param {string} params.roundStatus 진행 상태 (예: '접수 중', '심의 중', '마감' 등)
 * @param {Array}  params.students 학급 학생 목록 (apps 배열 포함)
 * @param {boolean} params.appliedOnly 지원자만 인쇄할지 여부 (기본 false: 전체 명단)
 */
export function printClassApplicationsReport({
  className = '',
  teacherName = '',
  roundTitle = '추천 선발',
  roundStatus = '접수 중',
  students = [],
  appliedOnly = false
}) {
  const win = window.open('', '_blank')
  if (!win) {
    alert('팝업 차단이 설정되어 있어 인쇄 창을 열 수 없습니다. 팝업 차단을 해제해 주세요.')
    return
  }

  const formattedSchoolName = getFormattedSchoolName(schoolName)
  const printTargetStudents = appliedOnly
    ? students.filter(s => s.apps && s.apps.length > 0)
    : students

  const totalStudentsCount = students.length
  const appliedStudentsCount = students.filter(s => s.apps && s.apps.length > 0).length
  const unappliedStudentsCount = totalStudentsCount - appliedStudentsCount
  const totalAppsCount = students.reduce((sum, s) => sum + (s.apps ? s.apps.length : 0), 0)

  // 행 생성 (학생당 지원 대학이 여러 개인 경우 rowspan 적용)
  let tableRowsHtml = ''
  let rowSeq = 1

  if (printTargetStudents.length === 0) {
    tableRowsHtml = `
      <tr>
        <td colspan="9" style="text-align:center; padding: 25px; color:#64748b; font-size:12px;">
          해당 학급에 등록된 지원/학생 데이터가 없습니다.
        </td>
      </tr>
    `
  } else {
    for (const st of printTargetStudents) {
      const apps = st.apps || []
      const studentNo = st.seq_no || rowSeq
      const studentCode = st.student_code || '—'
      const studentName = st.name || '미명학생'
      const isEnrolledStr = st.is_enrolled === false ? '<span class="tag-grad">졸업생</span>' : '재학생'
      const gpaStr = st.gpa_overall != null ? Number(st.gpa_overall).toFixed(2) : '—'

      if (apps.length === 0) {
        // 미지원 학생
        tableRowsHtml += `
          <tr class="student-row unapplied-row">
            <td class="text-center font-mono">${studentNo}</td>
            <td class="text-center font-mono">${studentCode}</td>
            <td class="text-center font-bold">${studentName}</td>
            <td class="text-center">${isEnrolledStr}</td>
            <td class="text-center text-muted">—</td>
            <td colspan="3" class="text-center text-muted" style="color:#94a3b8; font-style:italic;">(미지원)</td>
            <td class="text-center tabular-nums">${gpaStr}</td>
            <td class="text-center text-muted">미지원</td>
            <td class="text-center"></td>
          </tr>
        `
      } else {
        // 지원 학생 (지망 수만큼 행 생성)
        const spanCount = apps.length
        const sigUrl = apps.find(a => a.student_signature_url)?.student_signature_url || st.student_signature_url
        const sigImgHtml = sigUrl ? `<img src="${sigUrl}" style="max-height: 24px; max-width: 44px; object-fit: contain; display: block; margin: 0 auto;" />` : ''

        apps.forEach((app, idx) => {
          const prefNo = idx + 1
          const univName = app.univ_name || '—'
          const trackName = app.track_name || '—'
          const deptName = app.department_name || '—'
          
          let statusText = '접수완료'
          let statusClass = 'status-open'
          if (app.abandoned) {
            statusText = '포기'
            statusClass = 'status-abandoned'
          } else if (app.excluded) {
            statusText = `미선발(${app.excluded_reason || '제외'})`
            statusClass = 'status-excluded'
          } else if (app.recommended) {
            statusText = '추천확정'
            statusClass = 'status-recommended'
          } else if (roundStatus === 'FINALIZED' || roundStatus === '마감') {
            statusText = '미선발'
            statusClass = 'status-unselected'
          }

          if (idx === 0) {
            tableRowsHtml += `
              <tr class="student-row">
                <td rowspan="${spanCount}" class="text-center font-mono bg-st">${studentNo}</td>
                <td rowspan="${spanCount}" class="text-center font-mono bg-st">${studentCode}</td>
                <td rowspan="${spanCount}" class="text-center font-bold bg-st">${studentName}</td>
                <td rowspan="${spanCount}" class="text-center bg-st">${isEnrolledStr}</td>
                <td class="text-center font-bold text-blue">${prefNo}지망</td>
                <td class="text-left font-bold">${univName}</td>
                <td class="text-left">${trackName}</td>
                <td class="text-left">${deptName || '—'}</td>
                <td rowspan="${spanCount}" class="text-center tabular-nums bg-st font-bold">${gpaStr}</td>
                <td class="text-center"><span class="badge ${statusClass}">${statusText}</span></td>
                <td rowspan="${spanCount}" class="text-center" style="padding: 2px;">${sigImgHtml}</td>
              </tr>
            `
          } else {
            tableRowsHtml += `
              <tr>
                <td class="text-center font-bold text-blue">${prefNo}지망</td>
                <td class="text-left font-bold">${univName}</td>
                <td class="text-left">${trackName}</td>
                <td class="text-left">${deptName || '—'}</td>
                <td class="text-center"><span class="badge ${statusClass}">${statusText}</span></td>
              </tr>
            `
          }
        })
      }
      rowSeq++
    }
  }

  win.document.write(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>&nbsp;</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 10mm 12mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Malgun Gothic', '맑은 고딕', sans-serif;
          color: #1e293b;
          margin: 0;
          padding: 0;
          font-size: 11px;
          line-height: 1.35;
          background: #fff;
        }
        .page-container {
          width: 100%;
        }
        .top-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 8px;
        }
        .title-area h1 {
          font-size: 19px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 4px 0;
          letter-spacing: -0.02em;
        }
        .title-area .sub-meta {
          font-size: 11px;
          color: #475569;
          font-weight: 500;
          margin-top: 3px;
        }
        .title-area .sub-meta strong {
          color: #0f172a;
        }

        /* 결재란 */
        .sign-table {
          border-collapse: collapse;
          text-align: center;
          font-size: 10px;
          border: 1px solid #64748b;
        }
        .sign-table th, .sign-table td {
          border: 1px solid #64748b;
          padding: 2px 6px;
        }
        .sign-table th.header-th {
          background: #f1f5f9;
          font-weight: 700;
          width: 20px;
          line-height: 1.2;
        }
        .sign-table .role-title {
          background: #f8fafc;
          font-weight: 600;
          width: 50px;
          height: 18px;
        }
        .sign-table .sign-box {
          height: 38px;
        }

        /* 통계 요약 바 */
        .summary-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          padding: 6px 12px;
          margin-bottom: 10px;
          font-size: 11px;
        }
        .summary-items {
          display: flex;
          gap: 16px;
        }
        .summary-item strong {
          color: #2563eb;
          font-size: 12px;
        }

        /* 데이터 테이블 */
        table.data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10.5px;
          border: 1px solid #334155;
        }
        table.data-table th, table.data-table td {
          border: 1px solid #cbd5e1;
          padding: 5.5px 6px;
        }
        table.data-table th {
          background: #f1f5f9;
          color: #1e293b;
          font-weight: 700;
          text-align: center;
          border-top: 1px solid #334155;
          border-bottom: 1.5px solid #334155;
        }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .font-mono { font-family: 'Consolas', 'Courier New', monospace; }
        .font-bold { font-weight: 700; }
        .text-blue { color: #1d4ed8; }
        .text-muted { color: #94a3b8; }
        .bg-st { background: #fafafa; }
        .tag-grad {
          display: inline-block;
          font-size: 9px;
          font-weight: 700;
          color: #b45309;
          background: #fef3c7;
          border: 1px solid #fde68a;
          padding: 1px 3px;
          border-radius: 2px;
        }
        .badge {
          display: inline-block;
          font-size: 9.5px;
          font-weight: 700;
          padding: 1.5px 5px;
          border-radius: 3px;
          white-space: nowrap;
        }
        .status-open {
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
        }
        .status-recommended {
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
        }
        .status-unselected {
          background: #f1f5f9;
          color: #64748b;
          border: 1px solid #cbd5e1;
        }
        .status-abandoned {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }
        .status-excluded {
          background: #fffbeb;
          color: #b45309;
          border: 1px solid #fde68a;
        }
      </style>
    </head>
    <body>
      <div class="page-container">
        <!-- 상단 헤더 & 결재란 -->
        <div class="top-header">
          <div class="title-area">
            <h1>2027학년도 대입 학교장추천전형 학급별 지원 현황 대장</h1>
            <div class="sub-meta">
              <span><strong>학급:</strong> ${className}</span>
              &nbsp;|&nbsp;
              <span><strong>선발 차수:</strong> ${roundTitle} (<span style="color:#2563eb; font-weight:700;">${roundStatus}</span>)</span>
            </div>
          </div>
          <table class="sign-table">
            <tr>
              <th rowspan="2" class="header-th">결<br>재</th>
              <td class="role-title">담 임</td>
              <td class="role-title">부 장</td>
              <td class="role-title">교 감</td>
              <td class="role-title">교 장</td>
            </tr>
            <tr>
              <td class="sign-box"></td>
              <td class="sign-box"></td>
              <td class="sign-box"></td>
              <td class="sign-box"></td>
            </tr>
          </table>
        </div>

        <!-- 요약 바 -->
        <div class="summary-bar">
          <div class="summary-items">
            <span class="summary-item">학급 총원: <strong>${totalStudentsCount}명</strong></span>
            <span class="summary-item">지원 학생: <strong>${appliedStudentsCount}명</strong></span>
            <span class="summary-item">미지원 학생: <strong>${unappliedStudentsCount}명</strong></span>
            <span class="summary-item">총 지원 건수: <strong>${totalAppsCount}건</strong></span>
          </div>
        </div>

        <!-- 지원 현황 테이블 -->
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 32px;">번호</th>
              <th style="width: 58px;">학번</th>
              <th style="width: 65px;">성명</th>
              <th style="width: 48px;">구분</th>
              <th style="width: 48px;">지망</th>
              <th style="width: 140px;">지원 대학명</th>
              <th style="width: 150px;">전형명 (모집단위)</th>
              <th>세부 학과명</th>
              <th style="width: 55px;">전체내신</th>
              <th style="width: 68px;">선발 상태</th>
              <th style="width: 54px;">서명확인</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
            window.close();
          }, 500);
        };
      <\/script>
    </body>
    </html>
  `)
  win.document.close()
}

/**
 * 전 학급 학교장추천전형 지원 현황 일괄 대장 인쇄 (반별 자동 페이지 분할)
 * @param {Object} params
 * @param {Array}  params.classesData [{ className, teacherName, students }]
 * @param {string} params.roundTitle 선발 차수 명칭
 * @param {string} params.roundStatus 진행 상태
 * @param {boolean} params.appliedOnly 지원자만 인쇄할지 여부
 */
export function printAllClassesApplicationsReport({
  classesData = [],
  roundTitle = '추천 선발',
  roundStatus = '접수 중',
  appliedOnly = false
}) {
  const win = window.open('', '_blank')
  if (!win) {
    alert('팝업 차단이 설정되어 있어 인쇄 창을 열 수 없습니다. 팝업 차단을 해제해 주세요.')
    return
  }

  // appliedOnly일 경우 지원자가 1명 이상 있는 학급만 필터링 (전체 0명일 때는 기본 목록 유지)
  const targetClassesList = appliedOnly
    ? (classesData.filter(cls => (cls.students || []).some(s => s.apps && s.apps.length > 0)).length > 0
        ? classesData.filter(cls => (cls.students || []).some(s => s.apps && s.apps.length > 0))
        : classesData)
    : classesData

  // 각 학급별 HTML 생성
  const sectionsHtml = targetClassesList.map((cls, clsIdx) => {
    const { className, teacherName, students = [] } = cls
    const printTargetStudents = appliedOnly
      ? students.filter(s => s.apps && s.apps.length > 0)
      : students

    const totalStudentsCount = students.length
    const appliedStudentsCount = students.filter(s => s.apps && s.apps.length > 0).length
    const unappliedStudentsCount = totalStudentsCount - appliedStudentsCount
    const totalAppsCount = students.reduce((sum, s) => sum + (s.apps ? s.apps.length : 0), 0)

    let tableRowsHtml = ''
    let rowSeq = 1

    if (printTargetStudents.length === 0) {
      tableRowsHtml = `
        <tr>
          <td colspan="11" style="text-align:center; padding: 25px; color:#64748b; font-size:12px;">
            해당 학급에 등록된 지원/학생 데이터가 없습니다.
          </td>
        </tr>
      `
    } else {
      for (const st of printTargetStudents) {
        const apps = st.apps || []
        const studentNo = st.seq_no || rowSeq
        const studentCode = st.student_code || '—'
        const studentName = st.name || '미명학생'
        const isEnrolledStr = st.is_enrolled === false ? '<span class="tag-grad">졸업생</span>' : '재학생'
        const gpaStr = st.gpa_overall != null ? Number(st.gpa_overall).toFixed(2) : '—'

        if (apps.length === 0) {
          tableRowsHtml += `
            <tr class="student-row unapplied-row">
              <td class="text-center font-mono">${studentNo}</td>
              <td class="text-center font-mono">${studentCode}</td>
              <td class="text-center font-bold">${studentName}</td>
              <td class="text-center">${isEnrolledStr}</td>
              <td class="text-center text-muted">—</td>
              <td colspan="3" class="text-center text-muted" style="color:#94a3b8; font-style:italic;">(미지원)</td>
              <td class="text-center tabular-nums">${gpaStr}</td>
              <td class="text-center text-muted">미지원</td>
              <td class="text-center"></td>
            </tr>
          `
        } else {
          const spanCount = apps.length
          const sigUrl = apps.find(a => a.student_signature_url)?.student_signature_url || st.student_signature_url
          const sigImgHtml = sigUrl ? `<img src="${sigUrl}" style="max-height: 24px; max-width: 44px; object-fit: contain; display: block; margin: 0 auto;" />` : ''

          apps.forEach((app, idx) => {
            const prefNo = idx + 1
            const univName = app.univ_name || '—'
            const trackName = app.track_name || '—'
            const deptName = app.department_name || '—'
            
            let statusText = '접수완료'
            let statusClass = 'status-open'
            if (app.abandoned) {
              statusText = '포기'
              statusClass = 'status-abandoned'
            } else if (app.excluded) {
              statusText = `미선발(${app.excluded_reason || '제외'})`
              statusClass = 'status-excluded'
            } else if (app.recommended) {
              statusText = '추천확정'
              statusClass = 'status-recommended'
            } else if (roundStatus === 'FINALIZED' || roundStatus === '마감') {
              statusText = '미선발'
              statusClass = 'status-unselected'
            }

            if (idx === 0) {
              tableRowsHtml += `
                <tr class="student-row">
                  <td rowspan="${spanCount}" class="text-center font-mono bg-st">${studentNo}</td>
                  <td rowspan="${spanCount}" class="text-center font-mono bg-st">${studentCode}</td>
                  <td rowspan="${spanCount}" class="text-center font-bold bg-st">${studentName}</td>
                  <td rowspan="${spanCount}" class="text-center bg-st">${isEnrolledStr}</td>
                  <td class="text-center font-bold text-blue">${prefNo}지망</td>
                  <td class="text-left font-bold">${univName}</td>
                  <td class="text-left">${trackName}</td>
                  <td class="text-left">${deptName || '—'}</td>
                  <td rowspan="${spanCount}" class="text-center tabular-nums bg-st font-bold">${gpaStr}</td>
                  <td class="text-center"><span class="badge ${statusClass}">${statusText}</span></td>
                  <td rowspan="${spanCount}" class="text-center" style="padding: 2px;">${sigImgHtml}</td>
                </tr>
              `
            } else {
              tableRowsHtml += `
                <tr>
                  <td class="text-center font-bold text-blue">${prefNo}지망</td>
                  <td class="text-left font-bold">${univName}</td>
                  <td class="text-left">${trackName}</td>
                  <td class="text-left">${deptName || '—'}</td>
                  <td class="text-center"><span class="badge ${statusClass}">${statusText}</span></td>
                </tr>
              `
            }
          })
        }
        rowSeq++
      }
    }

    const isLast = clsIdx === targetClassesList.length - 1
    return `
      <div class="page-container ${isLast ? '' : 'page-break'}">
        <!-- 상단 헤더 & 결재란 -->
        <div class="top-header">
          <div class="title-area">
            <h1>2027학년도 대입 학교장추천전형 학급별 지원 현황 대장</h1>
            <div class="sub-meta">
              <span><strong>학급:</strong> ${className}</span>
              &nbsp;|&nbsp;
              <span><strong>선발 차수:</strong> ${roundTitle} (<span style="color:#2563eb; font-weight:700;">${roundStatus}</span>)</span>
            </div>
          </div>
          <table class="sign-table">
            <tr>
              <th rowspan="2" class="header-th">결<br>재</th>
              <td class="role-title">담 임</td>
              <td class="role-title">부 장</td>
              <td class="role-title">교 감</td>
              <td class="role-title">교 장</td>
            </tr>
            <tr>
              <td class="sign-box"></td>
              <td class="sign-box"></td>
              <td class="sign-box"></td>
              <td class="sign-box"></td>
            </tr>
          </table>
        </div>

        <!-- 요약 바 -->
        <div class="summary-bar">
          <div class="summary-items">
            <span class="summary-item">학급 총원: <strong>${totalStudentsCount}명</strong></span>
            <span class="summary-item">지원 학생: <strong>${appliedStudentsCount}명</strong></span>
            <span class="summary-item">미지원 학생: <strong>${unappliedStudentsCount}명</strong></span>
            <span class="summary-item">총 지원 건수: <strong>${totalAppsCount}건</strong></span>
          </div>
        </div>

        <!-- 지원 현황 테이블 -->
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 32px;">번호</th>
              <th style="width: 58px;">학번</th>
              <th style="width: 65px;">성명</th>
              <th style="width: 48px;">구분</th>
              <th style="width: 48px;">지망</th>
              <th style="width: 140px;">지원 대학명</th>
              <th style="width: 150px;">전형명 (모집단위)</th>
              <th>세부 학과명</th>
              <th style="width: 55px;">전체내신</th>
              <th style="width: 68px;">선발 상태</th>
              <th style="width: 54px;">서명확인</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      </div>
    `
  }).join('')

  win.document.write(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>&nbsp;</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 10mm 12mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Malgun Gothic', '맑은 고딕', sans-serif;
          color: #1e293b;
          margin: 0;
          padding: 0;
          font-size: 11px;
          line-height: 1.35;
          background: #fff;
        }
        .page-container {
          width: 100%;
          box-sizing: border-box;
        }
        .page-break {
          page-break-after: always !important;
          break-after: page !important;
          margin-bottom: 24px;
        }
        @media print {
          body {
            background: #fff;
          }
          .page-container {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .page-break {
            page-break-after: always !important;
            break-after: page !important;
            margin-bottom: 0 !important;
          }
          .page-container:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
        }
        .top-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 8px;
        }
        .title-area h1 {
          font-size: 19px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 4px 0;
          letter-spacing: -0.02em;
        }
        .title-area .sub-meta {
          font-size: 11px;
          color: #475569;
          font-weight: 500;
          margin-top: 3px;
        }
        .title-area .sub-meta strong {
          color: #0f172a;
        }

        /* 결재란 */
        .sign-table {
          border-collapse: collapse;
          text-align: center;
          font-size: 10px;
          border: 1px solid #64748b;
        }
        .sign-table th, .sign-table td {
          border: 1px solid #64748b;
          padding: 2px 6px;
        }
        .sign-table th.header-th {
          background: #f1f5f9;
          font-weight: 700;
          width: 20px;
          line-height: 1.2;
        }
        .sign-table .role-title {
          background: #f8fafc;
          font-weight: 600;
          width: 50px;
          height: 18px;
        }
        .sign-table .sign-box {
          height: 38px;
        }

        /* 통계 요약 바 */
        .summary-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          padding: 6px 12px;
          margin-bottom: 10px;
          font-size: 11px;
        }
        .summary-items {
          display: flex;
          gap: 16px;
        }
        .summary-item strong {
          color: #2563eb;
          font-size: 12px;
        }

        /* 데이터 테이블 */
        table.data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10.5px;
          border: 1px solid #334155;
        }
        table.data-table th, table.data-table td {
          border: 1px solid #cbd5e1;
          padding: 5.5px 6px;
        }
        table.data-table th {
          background: #f1f5f9;
          color: #1e293b;
          font-weight: 700;
          text-align: center;
          border-top: 1px solid #334155;
          border-bottom: 1.5px solid #334155;
        }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .font-mono { font-family: 'Consolas', 'Courier New', monospace; }
        .font-bold { font-weight: 700; }
        .text-blue { color: #1d4ed8; }
        .text-muted { color: #94a3b8; }
        .bg-st { background: #fafafa; }
        .tag-grad {
          display: inline-block;
          font-size: 9px;
          font-weight: 700;
          color: #b45309;
          background: #fef3c7;
          border: 1px solid #fde68a;
          padding: 1px 3px;
          border-radius: 2px;
        }
        .badge {
          display: inline-block;
          font-size: 9.5px;
          font-weight: 700;
          padding: 1.5px 5px;
          border-radius: 3px;
          white-space: nowrap;
        }
        .status-open {
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
        }
        .status-recommended {
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
        }
        .status-unselected {
          background: #f1f5f9;
          color: #64748b;
          border: 1px solid #cbd5e1;
        }
        .status-abandoned {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }
        .status-excluded {
          background: #fffbeb;
          color: #b45309;
          border: 1px solid #fde68a;
        }
      </style>
    </head>
    <body>
      ${sectionsHtml}
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
            window.close();
          }, 600);
        };
      <\/script>
    </body>
    </html>
  `)
  win.document.close()
}

/**
 * 2027학년도 대입 학교장추천전형 지원 포기원 인쇄 (학생용 포기원 양식과 100% 동일한 폼)
 * @param {Object} app 지원 및 포기 정보 객체
 * @param {Object} [studentInfo] 학생 추가 정보 (선택사항)
 */
export function printAbandonmentForm(app, studentInfo = {}) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('팝업 창이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.')
    return
  }

  // 1. 포기 신청 메타데이터 파싱 (scanned_doc_url)
  let req = {}
  if (app.scanned_doc_url) {
    try {
      req = typeof app.scanned_doc_url === 'string' ? JSON.parse(app.scanned_doc_url) : app.scanned_doc_url
    } catch {}
  }

  const studentName = app.name || app.student_name || studentInfo.name || ''
  const studentCode = app.student_code || studentInfo.student_code || ''
  const univName = app.univ_name || app.universities?.univ_name || ''
  const trackName = app.track_name || app.universities?.track_name || ''
  const departmentName = app.department_name || ''
  const parentName = app.parent_name || studentInfo.parent_name || '학부모'
  const abandonReason = req.abandon_reason || app.abandon_reason || app.excluded_reason || '개인 사유로 인한 지원 포기'

  const studentSigUrl = req.student_signature_url || app.student_signature_url || studentInfo.student_signature_url
  const parentSigUrl = req.parent_signature_url || app.parent_signature_url || studentInfo.parent_signature_url

  const studentSigHtml = studentSigUrl
    ? `<img class="sig-img" src="${studentSigUrl}" />`
    : `<div style="height: 60px; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 12px;">(서명/날인)</div>`

  const parentSigHtml = parentSigUrl
    ? `<img class="sig-img" src="${parentSigUrl}" />`
    : `<div style="height: 60px; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 12px;">(서명/날인)</div>`

  const dateVal = req.requested_at || app.abandoned_at || app.updated_at || new Date()
  const formattedDate = new Date(dateVal).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

  // 학생용 포기원 폼의 학교장 직인 타이틀 생성 규칙
  const name = (schoolName.value || '').trim()
  let targetSchoolFooter = '우리고등학교장 귀하'
  if (!name || name === '우리학교' || name === '우리고등학교' || name === '학교명 미설정') {
    targetSchoolFooter = '우리고등학교장 귀하'
  } else if (name.endsWith('학교')) {
    targetSchoolFooter = `${name}장 귀하`
  } else if (name.endsWith('고')) {
    targetSchoolFooter = `${name}등학교장 귀하`
  } else if (!name.includes('학교')) {
    targetSchoolFooter = `${name}고등학교장 귀하`
  } else {
    targetSchoolFooter = `${name}장 귀하`
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>2027학년도 대입 학교장추천전형 지원 포기원</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm 20mm;
          }
          * { box-sizing: border-box; }
          html, body {
            height: 100%;
            margin: 0;
            padding: 0;
            font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
            color: #111;
            line-height: 1.6;
          }
          .page {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 100%;
            min-height: 245mm;
            padding: 5mm 0;
            box-sizing: border-box;
          }
          .top-section {
            width: 100%;
          }
          .title { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 35px; letter-spacing: 1px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
          .table th, .table td { border: 1px solid #000; padding: 10px 12px; text-align: left; font-size: 13px; }
          .table th { background: #f2f2f2; font-weight: bold; width: 25%; text-align: center; }
          .section-title { font-weight: bold; font-size: 14px; margin-top: 20px; margin-bottom: 8px; }
          .reason-box { border: 1px solid #000; padding: 15px; min-height: 130px; margin-bottom: 25px; font-size: 13px; white-space: pre-wrap; }
          .statement { font-size: 13px; line-height: 1.7; word-break: keep-all; margin-top: 15px; }
          .bottom-section {
            margin-top: auto;
            width: 100%;
            padding-bottom: 5mm;
          }
          .date { text-align: center; font-size: 15px; margin-bottom: 35px; }
          .signature-area { display: flex; justify-content: space-around; align-items: flex-start; margin-bottom: 40px; }
          .sig-box { text-align: center; width: 45%; font-size: 13.5px; }
          .sig-img { max-height: 75px; display: block; margin: 10px auto 0; }
          .footer { text-align: left; font-size: 20px; font-weight: bold; letter-spacing: 1px; padding-left: 5px; }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="top-section">
            <div class="title">2027학년도 대입 학교장추천전형 지원 포기원</div>
            
            <div class="section-title">[신청인 인적사항]</div>
            <table class="table">
              <tr>
                <th>학번/학생코드</th>
                <td>${studentCode}</td>
                <th>성명</th>
                <td>${studentName}</td>
              </tr>
              <tr>
                <th>지원 대학</th>
                <td>${univName}</td>
                <th>지원 전형</th>
                <td>${trackName}</td>
              </tr>
              <tr>
                <th>지원 학과</th>
                <td colspan="3">${departmentName}</td>
              </tr>
            </table>
            
            <div class="section-title">[포기 사유]</div>
            <div class="reason-box">${abandonReason}</div>
            
            <p class="statement">
              위 본인은 2027학년도 대입 학교장추천전형 선정과 관련하여 추천이 확정되었으나, 위의 사유로 인하여 학교장추천전형 지원 권한을 공식적으로 포기하고자 포기원을 제출합니다.
              아울러 추천 포기 처리가 완료되면 차순위 대기 학생에게 추천 기회가 승계됨을 확인합니다.
            </p>
          </div>
          
          <div class="bottom-section">
            <div class="date">${formattedDate}</div>
            
            <div class="signature-area">
              <div class="sig-box">
                <div>학생 본인: ${studentName} (서명/날인)</div>
                ${studentSigHtml}
              </div>
              <div class="sig-box">
                <div>보호자(학부모): ${parentName} (서명/날인)</div>
                ${parentSigHtml}
              </div>
            </div>
            
            <div class="footer">${targetSchoolFooter}</div>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            window.close();
          }
        <\/script>
      </body>
    </html>
  `)
  printWindow.document.close()
}


// ========================================================================
// 수능 미응시 확인서 & 수시 미접수 확인서 인쇄 템플릿
// ========================================================================

/**
 * 공통 확인서 인쇄 스타일 (A4 세로)
 */
function getIntentFormStyles() {
  return `
    @page { size: A4 portrait; margin: 15mm 20mm 15mm 20mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Pretendard', '맑은 고딕', sans-serif; color: #111; font-size: 13.5px; line-height: 1.65; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { width: 100%; max-width: 700px; margin: 0 auto; padding: 0; display: flex; flex-direction: column; min-height: 255mm; page-break-after: always; }
    .page:last-child { page-break-after: avoid; }
    .title { text-align: center; font-size: 21px; font-weight: 800; margin: 10px 0 20px 0; letter-spacing: 1.5px; }
    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .info-table th, .info-table td { border: 1px solid #333; padding: 7px 10px; font-size: 12.5px; }
    .info-table th { background: #f3f4f6; font-weight: 700; text-align: center; width: 110px; }
    .info-table td { text-align: center; }
    .content-box { border: 2px solid #333; padding: 18px 20px; margin: 12px 0 16px 0; font-size: 13.5px; line-height: 1.85; text-align: justify; }
    .reason-box { border: 1px solid #999; padding: 12px 16px; margin: 0 0 16px 0; font-size: 12.5px; min-height: 44px; }
    .reason-label { font-weight: 700; font-size: 12.5px; margin-bottom: 4px; }
    .date-line { text-align: center; font-size: 14.5px; font-weight: 600; margin: 20px 0 14px 0; }
    .sig-table { width: 100%; border-collapse: collapse; margin: 0 auto 16px auto; max-width: 520px; }
    .sig-table td { padding: 6px 14px; font-size: 13.5px; vertical-align: middle; }
    .sig-table .label { font-weight: 700; text-align: right; width: 90px; white-space: nowrap; }
    .sig-table .name-cell { text-align: left; min-width: 120px; }
    .sig-table .sig-cell { text-align: right; min-width: 120px; font-size: 13px; color: #666; }
    .sig-table .sig-cell img { max-height: 38px; vertical-align: middle; }
    .footer-line { margin-top: auto; width: 100%; text-align: left; font-size: 15px; font-weight: 800; padding-top: 14px; padding-bottom: 4px; border-top: 1px solid #bbb; letter-spacing: 0.5px; }
    @media screen { .page { border: 1px solid #ddd; padding: 30px; margin: 20px auto; box-shadow: 0 2px 12px rgba(0,0,0,0.1); min-height: auto; } }
  `
}

/**
 * 날짜를 '2026년 8월 31일' 형태로 포맷
 */
function formatKoreanDate(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date()
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

/**
 * 서명 이미지 HTML 생성
 */
function renderSig(sigUrl) {
  if (sigUrl) return `<img src="${sigUrl}" style="max-height:40px; vertical-align:middle;" />`
  return '(서명 또는 인)'
}

/**
 * 2027학년도 대학수학능력시험 미응시 확인서 인쇄
 * @param {object} student - { name, grade, class_no, student_no, student_code }
 * @param {object} intentData - { csat_no_take_reason, student_signature, parent_signature, parent_name, confirmed_at }
 */
export function printCsatNoTakeForm(student, intentData = {}) {
  const currentSchool = schoolName.value || schoolName
  const fullSchoolName = getFormattedSchoolName(currentSchool)
  const principalTitle = formatSchoolPrincipalTitle(currentSchool)
  const dateStr = formatKoreanDate(intentData.confirmed_at)
  const reason = intentData.csat_no_take_reason || '(사유 미입력)'
  const parentNameDisplay = intentData.parent_name || ''

  const win = window.open('', '_blank')
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>수능 미응시 확인서</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css">
  <style>${getIntentFormStyles()}</style></head><body>
  <div class="page">
    <h1 class="title">2027학년도 대학수학능력시험 미응시 확인서</h1>

    <table class="info-table">
      <tr>
        <th>학 교 명</th>
        <td colspan="3">${fullSchoolName}</td>
      </tr>
      <tr>
        <th>학년 / 반 / 번호</th>
        <td>${student.grade || 3}학년 ${student.class_no || ''}반 ${student.student_no || ''}번</td>
        <th>학 번</th>
        <td>${student.student_code || ''}</td>
      </tr>
      <tr>
        <th>성 명</th>
        <td colspan="3" style="font-weight:700; font-size:15px;">${student.name || ''}</td>
      </tr>
    </table>

    <div class="content-box">
      위 학생은 <strong>2027학년도 대학수학능력시험</strong>에 응시하지 않음을 확인하며, 추후 본인의 미응시에 따른 모든 진학 관련 제반 사항에 대하여 충분히 인지하고 <strong>본인과 보호자의 동의</strong>하에 본 확인서를 제출합니다.
    </div>

    <div class="reason-label">▶ 미응시 사유:</div>
    <div class="reason-box">${reason}</div>

    <p class="date-line">${dateStr}</p>

    <table class="sig-table">
      <tr>
        <td class="label">학 생 :</td>
        <td class="name-cell">${student.name || ''}</td>
        <td class="sig-cell">${renderSig(intentData.student_signature)}</td>
      </tr>
      <tr>
        <td class="label">보호자 :</td>
        <td class="name-cell">${parentNameDisplay}</td>
        <td class="sig-cell">${renderSig(intentData.parent_signature)}</td>
      </tr>
      <tr>
        <td class="label">담임교사 :</td>
        <td class="name-cell"></td>
        <td class="sig-cell">(서명 또는 인)</td>
      </tr>
    </table>

    <div class="footer-line">${principalTitle}</div>
  </div>

  <script>window.onload=function(){window.print();window.close();}<\/script>
  </body></html>`)
  win.document.close()
}

/**
 * 2027학년도 대입 원서 미접수 확인서 인쇄 ((일반대·과기원) 수시, (전문대) 수시, 정시 3종 통합 서식)
 * @param {object} student - { name, grade, class_no, student_no, student_code }
 * @param {object} intentData - { susi_general_intent, susi_general_no_reason, susi_college_intent, susi_college_no_reason, jungsi_intent, jungsi_no_reason, student_signature, parent_signature, parent_name, confirmed_at }
 */
export function printSusiNoApplyForm(student, intentData = {}) {
  const currentSchool = schoolName.value || schoolName
  const fullSchoolName = getFormattedSchoolName(currentSchool)
  const principalTitle = formatSchoolPrincipalTitle(currentSchool)
  const dateStr = formatKoreanDate(intentData.confirmed_at)
  const parentNameDisplay = intentData.parent_name || ''

  const genSusiIntent = intentData.susi_general_intent || intentData.susi_intent || 'APPLY'
  const genJungIntent = intentData.jungsi_general_intent || intentData.jungsi_intent || 'APPLY'
  const colSusiIntent = intentData.susi_college_intent || 'APPLY'
  const colJungIntent = intentData.jungsi_college_intent || 'APPLY'

  const genSusiReason = genSusiIntent === 'NO_APPLY' ? (intentData.susi_general_no_reason || intentData.susi_no_apply_reason || '(사유 미입력)') : '-'
  const genJungReason = genJungIntent === 'NO_APPLY' ? (intentData.jungsi_general_no_reason || intentData.jungsi_no_reason || '(사유 미입력)') : '-'
  const colSusiReason = colSusiIntent === 'NO_APPLY' ? (intentData.susi_college_no_reason || '(사유 미입력)') : '-'
  const colJungReason = colJungIntent === 'NO_APPLY' ? (intentData.jungsi_college_no_reason || '(사유 미입력)') : '-'

  const win = window.open('', '_blank')
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>대입 원서 미접수 확인서</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css">
  <style>
    ${getIntentFormStyles()}
    .apply-table { width: 100%; border-collapse: collapse; margin: 16px 0 20px 0; }
    .apply-table th, .apply-table td { border: 1px solid #333; padding: 8px 10px; font-size: 12px; }
    .apply-table th { background: #f3f4f6; font-weight: 700; text-align: center; }
    .status-tag { display: inline-block; font-weight: 700; padding: 2px 6px; border-radius: 3px; font-size: 11px; }
    .status-no { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
    .status-yes { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
  </style></head><body>
  <div class="page">
    <h1 class="title">2027학년도 대입 원서 미접수 확인서</h1>

    <table class="info-table">
      <tr>
        <th>학 교 명</th>
        <td colspan="3">${fullSchoolName}</td>
      </tr>
      <tr>
        <th>학년 / 반 / 번호</th>
        <td>${student.grade || 3}학년 ${student.class_no || ''}반 ${student.student_no || ''}번</td>
        <th>학 번</th>
        <td>${student.student_code || ''}</td>
      </tr>
      <tr>
        <th>성 명</th>
        <td colspan="3" style="font-weight:700; font-size:15px;">${student.name || ''}</td>
      </tr>
    </table>

    <div class="content-box">
      위 학생의 진로 및 진학에 대하여 충분히 상의하였으며, 학생 및 보호자의 의사에 따라 <strong>2027학년도 대학 진학을 위한 원서접수를 아래와 같이 진행(미접수)</strong>함을 본인과 학부모의 연서로 확인합니다.
    </div>

    <div class="reason-label">▶ 대입 전형별 원서접수 여부 및 미접수 사유:</div>
    <table class="apply-table">
      <thead>
        <tr>
          <th style="width: 26%;">전형 구분</th>
          <th style="width: 17%;">접수 여부</th>
          <th style="width: 57%;">미접수 사유</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="font-weight: 700; text-align: center;">(일반대·과기원) 수시모집</td>
          <td style="text-align: center;">
            <span class="status-tag ${genSusiIntent === 'NO_APPLY' ? 'status-no' : 'status-yes'}">
              ${genSusiIntent === 'NO_APPLY' ? '미접수' : '접수'}
            </span>
          </td>
          <td>${genSusiReason}</td>
        </tr>
        <tr>
          <td style="font-weight: 700; text-align: center;">(일반대·과기원) 정시모집</td>
          <td style="text-align: center;">
            <span class="status-tag ${genJungIntent === 'NO_APPLY' ? 'status-no' : 'status-yes'}">
              ${genJungIntent === 'NO_APPLY' ? '미접수' : '접수'}
            </span>
          </td>
          <td>${genJungReason}</td>
        </tr>
        <tr>
          <td style="font-weight: 700; text-align: center;">(전문대) 수시모집</td>
          <td style="text-align: center;">
            <span class="status-tag ${colSusiIntent === 'NO_APPLY' ? 'status-no' : 'status-yes'}">
              ${colSusiIntent === 'NO_APPLY' ? '미접수' : '접수'}
            </span>
          </td>
          <td>${colSusiReason}</td>
        </tr>
        <tr>
          <td style="font-weight: 700; text-align: center;">(전문대) 정시모집</td>
          <td style="text-align: center;">
            <span class="status-tag ${colJungIntent === 'NO_APPLY' ? 'status-no' : 'status-yes'}">
              ${colJungIntent === 'NO_APPLY' ? '미접수' : '접수'}
            </span>
          </td>
          <td>${colJungReason}</td>
        </tr>
      </tbody>
    </table>

    <p class="date-line">${dateStr}</p>

    <table class="sig-table">
      <tr>
        <td class="label">학 생 :</td>
        <td class="name-cell">${student.name || ''}</td>
        <td class="sig-cell">${renderSig(intentData.student_signature)}</td>
      </tr>
      <tr>
        <td class="label">보호자 :</td>
        <td class="name-cell">${parentNameDisplay}</td>
        <td class="sig-cell">${renderSig(intentData.parent_signature)}</td>
      </tr>
      <tr>
        <td class="label">담임교사 :</td>
        <td class="name-cell"></td>
        <td class="sig-cell">(서명 또는 인)</td>
      </tr>
    </table>

    <div class="footer-line">${principalTitle}</div>
  </div>

  <script>window.onload=function(){window.print();window.close();}<\/script>
  </body></html>`)
  win.document.close()
}

/**
 * 학급별 일괄 연속 인쇄 (미응시/미접수 확인서)
 * @param {Array} list - 대상 학생 배열 (각 항목: { student, intentData })
 * @param {'csat'|'susi'} type - 'csat': 수능 미응시, 'susi': 원서 미접수
 */
export function printBatchIntentForms(list, type = 'csat') {
  if (!list || list.length === 0) return

  const currentSchool = schoolName.value || schoolName
  const fullSchoolName = getFormattedSchoolName(currentSchool)
  const principalTitle = formatSchoolPrincipalTitle(currentSchool)
  const isCsat = type === 'csat'

  const title = isCsat
    ? '2027학년도 대학수학능력시험 미응시 확인서'
    : '2027학년도 대입 원서 미접수 확인서'

  const pages = list.map(({ student, intentData }) => {
    const dateStr = formatKoreanDate(intentData?.confirmed_at)
    const parentNameDisplay = intentData?.parent_name || ''

    if (isCsat) {
      const reason = intentData?.csat_no_take_reason || '(사유 미입력)'
      return `
      <div class="page">
        <h1 class="title">${title}</h1>
        <table class="info-table">
          <tr><th>학 교 명</th><td colspan="3">${fullSchoolName}</td></tr>
          <tr><th>학년 / 반 / 번호</th><td>${student.grade || 3}학년 ${student.class_no || ''}반 ${student.student_no || ''}번</td><th>학 번</th><td>${student.student_code || ''}</td></tr>
          <tr><th>성 명</th><td colspan="3" style="font-weight:700; font-size:15px;">${student.name || ''}</td></tr>
        </table>
        <div class="content-box">
          위 학생은 <strong>2027학년도 대학수학능력시험</strong>에 응시하지 않음을 확인하며, 추후 본인의 미응시에 따른 모든 진학 관련 제반 사항에 대하여 충분히 인지하고 <strong>본인과 보호자의 동의</strong>하에 본 확인서를 제출합니다.
        </div>
        <div class="reason-label">▶ 미응시 사유:</div>
        <div class="reason-box">${reason}</div>
        <p class="date-line">${dateStr}</p>
        <table class="sig-table">
          <tr><td class="label">학 생 :</td><td class="name-cell">${student.name || ''}</td><td class="sig-cell">${renderSig(intentData?.student_signature)}</td></tr>
          <tr><td class="label">보호자 :</td><td class="name-cell">${parentNameDisplay}</td><td class="sig-cell">${renderSig(intentData?.parent_signature)}</td></tr>
          <tr><td class="label">담임교사 :</td><td class="name-cell"></td><td class="sig-cell">(서명 또는 인)</td></tr>
        </table>
        <div class="footer-line">${principalTitle}</div>
      </div>`
    } else {
      const genSusiIntent = intentData?.susi_general_intent || intentData?.susi_intent || 'APPLY'
      const genJungIntent = intentData?.jungsi_general_intent || intentData?.jungsi_intent || 'APPLY'
      const colSusiIntent = intentData?.susi_college_intent || 'APPLY'
      const colJungIntent = intentData?.jungsi_college_intent || 'APPLY'

      const genSusiReason = genSusiIntent === 'NO_APPLY' ? (intentData?.susi_general_no_reason || intentData?.susi_no_apply_reason || '(사유 미입력)') : '-'
      const genJungReason = genJungIntent === 'NO_APPLY' ? (intentData?.jungsi_general_no_reason || intentData?.jungsi_no_reason || '(사유 미입력)') : '-'
      const colSusiReason = colSusiIntent === 'NO_APPLY' ? (intentData?.susi_college_no_reason || '(사유 미입력)') : '-'
      const colJungReason = colJungIntent === 'NO_APPLY' ? (intentData?.jungsi_college_no_reason || '(사유 미입력)') : '-'

      return `
      <div class="page">
        <h1 class="title">${title}</h1>
        <table class="info-table">
          <tr><th>학 교 명</th><td colspan="3">${fullSchoolName}</td></tr>
          <tr><th>학년 / 반 / 번호</th><td>${student.grade || 3}학년 ${student.class_no || ''}반 ${student.student_no || ''}번</td><th>학 번</th><td>${student.student_code || ''}</td></tr>
          <tr><th>성 명</th><td colspan="3" style="font-weight:700; font-size:15px;">${student.name || ''}</td></tr>
        </table>
        <div class="content-box">
          위 학생의 진로 및 진학에 대하여 충분히 상의하였으며, 학생 및 보호자의 의사에 따라 <strong>2027학년도 대학 진학을 위한 원서접수를 아래와 같이 진행(미접수)</strong>함을 본인과 학부모의 연서로 확인합니다.
        </div>
        <div class="reason-label">▶ 대입 전형별 원서접수 여부 및 미접수 사유:</div>
        <table class="apply-table">
          <thead>
            <tr>
              <th style="width: 26%;">전형 구분</th>
              <th style="width: 17%;">접수 여부</th>
              <th style="width: 57%;">미접수 사유</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="font-weight: 700; text-align: center;">(일반대·과기원) 수시모집</td>
              <td style="text-align: center;"><span class="status-tag ${genSusiIntent === 'NO_APPLY' ? 'status-no' : 'status-yes'}">${genSusiIntent === 'NO_APPLY' ? '미접수' : '접수'}</span></td>
              <td>${genSusiReason}</td>
            </tr>
            <tr>
              <td style="font-weight: 700; text-align: center;">(일반대·과기원) 정시모집</td>
              <td style="text-align: center;"><span class="status-tag ${genJungIntent === 'NO_APPLY' ? 'status-no' : 'status-yes'}">${genJungIntent === 'NO_APPLY' ? '미접수' : '접수'}</span></td>
              <td>${genJungReason}</td>
            </tr>
            <tr>
              <td style="font-weight: 700; text-align: center;">(전문대) 수시모집</td>
              <td style="text-align: center;"><span class="status-tag ${colSusiIntent === 'NO_APPLY' ? 'status-no' : 'status-yes'}">${colSusiIntent === 'NO_APPLY' ? '미접수' : '접수'}</span></td>
              <td>${colSusiReason}</td>
            </tr>
            <tr>
              <td style="font-weight: 700; text-align: center;">(전문대) 정시모집</td>
              <td style="text-align: center;"><span class="status-tag ${colJungIntent === 'NO_APPLY' ? 'status-no' : 'status-yes'}">${colJungIntent === 'NO_APPLY' ? '미접수' : '접수'}</span></td>
              <td>${colJungReason}</td>
            </tr>
          </tbody>
        </table>
        <p class="date-line">${dateStr}</p>
        <table class="sig-table">
          <tr><td class="label">학 생 :</td><td class="name-cell">${student.name || ''}</td><td class="sig-cell">${renderSig(intentData?.student_signature)}</td></tr>
          <tr><td class="label">보호자 :</td><td class="name-cell">${parentNameDisplay}</td><td class="sig-cell">${renderSig(intentData?.parent_signature)}</td></tr>
          <tr><td class="label">담임교사 :</td><td class="name-cell"></td><td class="sig-cell">(서명 또는 인)</td></tr>
        </table>
        <div class="footer-line">${principalTitle}</div>
      </div>`
    }
  }).join('')

  const win = window.open('', '_blank')
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title} (일괄)</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css">
  <style>
    ${getIntentFormStyles()}
    .apply-table { width: 100%; border-collapse: collapse; margin: 16px 0 20px 0; }
    .apply-table th, .apply-table td { border: 1px solid #333; padding: 9px 10px; font-size: 12.5px; }
    .apply-table th { background: #f3f4f6; font-weight: 700; text-align: center; }
    .status-tag { display: inline-block; font-weight: 700; padding: 2px 6px; border-radius: 3px; font-size: 11px; }
    .status-no { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
    .status-yes { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
  </style></head><body>
  ${pages}
  <script>window.onload=function(){window.print();window.close();}<\/script>
  </body></html>`)
  win.document.close()
}
