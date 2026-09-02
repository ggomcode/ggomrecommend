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

/**
 * 수능 응시 및 원서접수 현황 대장 (A4 가로 종합대장 인쇄)
 * - '전체' 인쇄 시 1페이지에 학교 총괄 오버뷰 통계 현황표 출력
 * - 각 학급별(졸업생 포함)로 개별 페이지 분리 출력
 * - 각 학급별 표 하단에 학급 통계 요약 및 결재란 출력
 * @param {Array} records - 대조 데이터 배열
 * @param {Object} options - { title, classInfo, filterSummary, orientation }
 */
export function printSummaryRoster(records, options = {}) {
  if (!records || records.length === 0) {
    alert('인쇄할 대상 데이터가 없습니다.')
    return
  }

  const currentSchool = schoolName.value || schoolName
  const fullSchoolName = getFormattedSchoolName(currentSchool)
  const title = options.title || '2027학년도 수능 응시 및 대입 원서접수 계획 현황 대장'
  const classInfo = options.classInfo || '전체 학급'
  const filterSummary = options.filterSummary || '전체 조건'
  const now = new Date()
  const printDateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  // 통계 계산 헬퍼
  function computeStats(items) {
    const total = items.length
    const surveyed = items.filter(r => r.has_survey).length
    const noSurvey = total - surveyed
    const csatTake = items.filter(r => r.has_survey && r.csat_intent === 'TAKE').length
    const csatNoTake = items.filter(r => r.has_survey && r.csat_intent === 'NO_TAKE').length
    const csatReg = items.filter(r => r.csat_registered).length
    const csatNotReg = items.filter(r => !r.csat_registered).length
    const mismatch = items.filter(r => r.csat_mismatch === 'SURVEY_YES_CSAT_NO' || r.csat_mismatch === 'SURVEY_NO_CSAT_YES').length

    const susiGenNo = items.filter(r => r.has_survey && (r.susi_general_intent || r.susi_intent) === 'NO_APPLY').length
    const jungGenNo = items.filter(r => r.has_survey && (r.jungsi_general_intent || r.jungsi_intent) === 'NO_APPLY').length
    const susiColNo = items.filter(r => r.has_survey && r.susi_college_intent === 'NO_APPLY').length
    const jungColNo = items.filter(r => r.has_survey && r.jungsi_college_intent === 'NO_APPLY').length

    const formSub = items.filter(r => r.is_form_submitted).length
    const formNotSub = items.filter(r => r.has_survey && !r.is_form_submitted && (r.csat_intent === 'NO_TAKE' || (r.susi_general_intent || r.susi_intent) === 'NO_APPLY' || (r.jungsi_general_intent || r.jungsi_intent) === 'NO_APPLY' || r.susi_college_intent === 'NO_APPLY' || r.jungsi_college_intent === 'NO_APPLY')).length

    return {
      total, surveyed, noSurvey, csatTake, csatNoTake, csatReg, csatNotReg, mismatch,
      susiGenNo, jungGenNo, susiColNo, jungColNo, formSub, formNotSub
    }
  }

  // 1. 학급별 그룹핑
  const groups = []
  const classMap = new Map()
  const graduates = []

  for (const r of records) {
    if (r.is_enrolled === false || !r.class_no) {
      graduates.push(r)
    } else {
      if (!classMap.has(r.class_no)) classMap.set(r.class_no, [])
      classMap.get(r.class_no).push(r)
    }
  }

  // 1반 ~ 11반 오름차순 정렬
  const sortedClasses = [...classMap.keys()].sort((a, b) => a - b)
  for (const c of sortedClasses) {
    const classItems = classMap.get(c).sort((a, b) => (a.student_no || 0) - (b.student_no || 0))
    groups.push({
      key: `class_${c}`,
      name: `3학년 ${c}반`,
      isGrad: false,
      items: classItems
    })
  }

  if (graduates.length > 0) {
    groups.push({
      key: 'graduates',
      name: '졸업생 (수능접수대장 등록자)',
      isGrad: true,
      items: graduates
    })
  }

  const isMultiClass = groups.length > 1
  let pagesHtml = ''

  // ================================================================
  // 선택과목 통계 계산 헬퍼 (국어/수학/탐구 조합 및 세부과목/제2외국어)
  // ================================================================
  function computeSubjectStats(items) {
    const registered = items.filter(r => r.csat_registered && r.csat_record)
    const totalReg = registered.length

    const koreanMap = { '화법과 작문': 0, '언어와 매체': 0, '미선택': 0 }
    let korTakers = 0

    const mathMap = { '확률과 통계': 0, '미적분': 0, '기하': 0, '미선택': 0 }
    let mathTakers = 0

    const foreignMap = {}
    let foreignTakers = 0
    let foreignNone = 0

    const inquiryCounts = {}
    let totalInquiryPicks = 0

    const comboCounts = {
      social2: 0,
      social1: 0,
      social1_science1: 0,
      science2: 0,
      science1: 0,
      vocational: 0,
      none: 0
    }

    const SOCIAL_NAMES = ['통합사회', '생활과 윤리', '윤리와 사상', '한국지리', '세계지리', '동아시아사', '세계사', '경제', '정치와 법', '사회·문화', '사회문화']
    const SCIENCE_NAMES = ['통합과학', '물리학Ⅰ', '물리학I', '화학Ⅰ', '화학I', '생명과학Ⅰ', '생명과학I', '지구과학Ⅰ', '지구과학I', '물리학Ⅱ', '물리학II', '화학Ⅱ', '화학II', '생명과학Ⅱ', '생명과학II', '지구과학Ⅱ', '지구과학II']
    const VOCATIONAL_NAMES = ['성공적인 직업생활', '농업 기초 기술', '공업 일반', '상업 경제', '수산·해운 산업 기초', '인간 발달']

    function getCategory(sub) {
      if (!sub || sub === 'X' || sub === '-') return null
      const c = sub.replace(/\s+/g, '')
      if (SOCIAL_NAMES.some(s => c.includes(s.replace(/\s+/g, '')))) return 'SOCIAL'
      if (SCIENCE_NAMES.some(s => c.includes(s.replace(/\s+/g, '')))) return 'SCIENCE'
      if (VOCATIONAL_NAMES.some(s => c.includes(s.replace(/\s+/g, '')))) return 'VOCATIONAL'
      return 'OTHER'
    }

    for (const r of registered) {
      const rec = r.csat_record

      // 1. 국어
      const kor = rec.subject_korean ? rec.subject_korean.trim() : ''
      if (kor && kor !== 'X' && kor !== '-') {
        koreanMap[kor] = (koreanMap[kor] || 0) + 1
        korTakers++
      } else {
        koreanMap['미선택']++
      }

      // 2. 수학
      const mat = rec.subject_math ? rec.subject_math.trim() : ''
      if (mat && mat !== 'X' && mat !== '-') {
        mathMap[mat] = (mathMap[mat] || 0) + 1
        mathTakers++
      } else {
        mathMap['미선택']++
      }

      // 3. 제2외국어
      const frg = (rec.foreign_language || rec.subject_foreign_language || '').trim()
      if (frg && frg !== 'X' && frg !== '-') {
        foreignMap[frg] = (foreignMap[frg] || 0) + 1
        foreignTakers++
      } else {
        foreignNone++
      }

      // 4. 탐구
      let s1 = null
      let s2 = null
      if (rec.inquiry_subjects && typeof rec.inquiry_subjects === 'string') {
        const parts = rec.inquiry_subjects.split('/').map(s => s.trim())
        if (parts[0] && parts[0] !== 'X' && parts[0] !== '-') s1 = parts[0]
        if (parts[1] && parts[1] !== 'X' && parts[1] !== '-') s2 = parts[1]
      } else {
        if (rec.inquiry_subject1 && rec.inquiry_subject1 !== 'X' && rec.inquiry_subject1 !== '-') s1 = rec.inquiry_subject1.trim()
        if (rec.inquiry_subject2 && rec.inquiry_subject2 !== 'X' && rec.inquiry_subject2 !== '-') s2 = rec.inquiry_subject2.trim()
      }

      const subs = []
      if (s1) subs.push(s1)
      if (s2) subs.push(s2)

      totalInquiryPicks += subs.length
      for (const s of subs) {
        inquiryCounts[s] = (inquiryCounts[s] || 0) + 1
      }

      const c1 = getCategory(s1)
      const c2 = getCategory(s2)

      if (subs.length === 0) {
        comboCounts.none++
      } else if (c1 === 'VOCATIONAL' || c2 === 'VOCATIONAL') {
        comboCounts.vocational++
      } else if (subs.length === 2) {
        if (c1 === 'SOCIAL' && c2 === 'SOCIAL') comboCounts.social2++
        else if (c1 === 'SCIENCE' && c2 === 'SCIENCE') comboCounts.science2++
        else if ((c1 === 'SOCIAL' && c2 === 'SCIENCE') || (c1 === 'SCIENCE' && c2 === 'SOCIAL')) comboCounts.social1_science1++
        else comboCounts.social2++
      } else if (subs.length === 1) {
        if (c1 === 'SOCIAL' || c2 === 'SOCIAL') comboCounts.social1++
        else if (c1 === 'SCIENCE' || c2 === 'SCIENCE') comboCounts.science1++
        else comboCounts.social1++
      }
    }

    return {
      totalRegistered: totalReg,
      korean: { map: koreanMap, takers: korTakers },
      math: { map: mathMap, takers: mathTakers },
      foreign: { map: foreignMap, takers: foreignTakers, none: foreignNone },
      inquiry: { totalPicks: totalInquiryPicks, counts: inquiryCounts, combo: comboCounts, takers: totalReg - comboCounts.none }
    }
  }

  // ================================================================
  // 1페이지: 전체 학급 총괄 오버뷰 현황표 (전체 또는 다중 학급 출력 시)
  // ================================================================
  if (isMultiClass) {
    const enrolledOnly = records.filter(r => r.is_enrolled !== false)
    const enrolledStats = computeStats(enrolledOnly)
    const gradStats = computeStats(graduates)
    const grandStats = computeStats(records)
    const subStats = computeSubjectStats(records)

    const overviewRows = groups.filter(g => !g.isGrad).map(g => {
      const s = computeStats(g.items)
      return `
      <tr>
        <td style="font-weight:700; background:#f8fafc;">${g.name}</td>
        <td style="font-weight:700;">${s.total}</td>
        <td>${s.csatTake}</td>
        <td class="${s.csatNoTake > 0 ? 'cell-warn' : ''}">${s.csatNoTake}</td>
        <td class="${s.noSurvey > 0 ? 'cell-muted' : ''}">${s.noSurvey}</td>
        <td style="font-weight:600;">${s.csatReg}</td>
        <td class="${s.csatNotReg > 0 ? 'cell-muted' : ''}">${s.csatNotReg}</td>
        <td class="${s.mismatch > 0 ? 'cell-danger' : ''}">${s.mismatch > 0 ? `⚠️ ${s.mismatch}` : '-'}</td>
        <td class="${s.susiGenNo > 0 ? 'cell-warn' : ''}">${s.susiGenNo}</td>
        <td class="${s.jungGenNo > 0 ? 'cell-warn' : ''}">${s.jungGenNo}</td>
        <td class="${s.susiColNo > 0 ? 'cell-warn' : ''}">${s.susiColNo}</td>
        <td class="${s.jungColNo > 0 ? 'cell-warn' : ''}">${s.jungColNo}</td>
        <td style="color:#15803d; font-weight:700;">${s.formSub}</td>
        <td class="${s.formNotSub > 0 ? 'cell-danger' : ''}">${s.formNotSub}</td>
      </tr>`
    }).join('')

    const enrolledSubtotalRow = `
    <tr style="background:#eef2ff; font-weight:700; border-top:2px solid #6366f1;">
      <td>[재학생 소계]</td>
      <td>${enrolledStats.total}</td>
      <td>${enrolledStats.csatTake}</td>
      <td class="${enrolledStats.csatNoTake > 0 ? 'cell-warn' : ''}">${enrolledStats.csatNoTake}</td>
      <td>${enrolledStats.noSurvey}</td>
      <td>${enrolledStats.csatReg}</td>
      <td>${enrolledStats.csatNotReg}</td>
      <td class="${enrolledStats.mismatch > 0 ? 'cell-danger' : ''}">${enrolledStats.mismatch}</td>
      <td>${enrolledStats.susiGenNo}</td>
      <td>${enrolledStats.jungGenNo}</td>
      <td>${enrolledStats.susiColNo}</td>
      <td>${enrolledStats.jungColNo}</td>
      <td style="color:#15803d;">${enrolledStats.formSub}</td>
      <td class="${enrolledStats.formNotSub > 0 ? 'cell-danger' : ''}">${enrolledStats.formNotSub}</td>
    </tr>`

    const gradRow = graduates.length > 0 ? `
    <tr style="background:#fffbeb; font-weight:700;">
      <td>[졸업생]</td>
      <td>${gradStats.total}</td>
      <td>${gradStats.total}</td>
      <td>-</td>
      <td>-</td>
      <td>${gradStats.total}</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
    </tr>` : ''

    const grandTotalRow = `
    <tr style="background:#f1f5f9; font-weight:800; border-top:2px solid #0f172a; font-size:11px;">
      <td>[총 합계]</td>
      <td>${grandStats.total}</td>
      <td>${grandStats.csatTake + gradStats.total}</td>
      <td class="${grandStats.csatNoTake > 0 ? 'cell-warn' : ''}">${grandStats.csatNoTake}</td>
      <td>${grandStats.noSurvey}</td>
      <td>${grandStats.csatReg}</td>
      <td>${grandStats.csatNotReg}</td>
      <td class="${grandStats.mismatch > 0 ? 'cell-danger' : ''}">${grandStats.mismatch}</td>
      <td>${grandStats.susiGenNo}</td>
      <td>${grandStats.jungGenNo}</td>
      <td>${grandStats.susiColNo}</td>
      <td>${grandStats.jungColNo}</td>
      <td style="color:#15803d;">${grandStats.formSub}</td>
      <td class="${grandStats.formNotSub > 0 ? 'cell-danger' : ''}">${grandStats.formNotSub}</td>
    </tr>`

    // 탐구 세부 과목 정렬 및 출력 (분모: 총 선택과목수)
    const inquiryRows = Object.entries(subStats.inquiry.counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => {
        const pct = subStats.inquiry.totalPicks > 0 ? ((count / subStats.inquiry.totalPicks) * 100).toFixed(1) : 0
        return `<span style="display:inline-block; margin:2px 6px; font-size:10px; background:#fff; border:1px solid #cbd5e1; padding:2px 6px; border-radius:4px;"><strong>${name}</strong>: ${count}건 (${pct}%)</span>`
      }).join('') || '<span class="cell-muted">선택 내역 없음</span>'

    // 국어/수학/외국어/탐구조합 요약 텍스트
    const korHwawon = subStats.korean.map['화법과 작문'] || 0
    const korEonmae = subStats.korean.map['언어와 매체'] || 0
    const korNone = subStats.korean.map['미선택'] || 0
    const korHwawonPct = subStats.totalRegistered > 0 ? ((korHwawon / subStats.totalRegistered) * 100).toFixed(1) : 0
    const korEonmaePct = subStats.totalRegistered > 0 ? ((korEonmae / subStats.totalRegistered) * 100).toFixed(1) : 0

    const mathHwatong = subStats.math.map['확률과 통계'] || 0
    const mathMijeok = subStats.math.map['미적분'] || 0
    const mathGiha = subStats.math.map['기하'] || 0
    const mathNone = subStats.math.map['미선택'] || 0
    const mathHwatongPct = subStats.totalRegistered > 0 ? ((mathHwatong / subStats.totalRegistered) * 100).toFixed(1) : 0
    const mathMijeokPct = subStats.totalRegistered > 0 ? ((mathMijeok / subStats.totalRegistered) * 100).toFixed(1) : 0
    const mathGihaPct = subStats.totalRegistered > 0 ? ((mathGiha / subStats.totalRegistered) * 100).toFixed(1) : 0

    const cb = subStats.inquiry.combo
    const regTot = subStats.totalRegistered || 1
    const s2Pct = ((cb.social2 / regTot) * 100).toFixed(1)
    const s1Pct = ((cb.social1 / regTot) * 100).toFixed(1)
    const s1c1Pct = ((cb.social1_science1 / regTot) * 100).toFixed(1)
    const c2Pct = ((cb.science2 / regTot) * 100).toFixed(1)
    const c1Pct = ((cb.science1 / regTot) * 100).toFixed(1)
    const vocPct = ((cb.vocational / regTot) * 100).toFixed(1)
    const inqNonePct = ((cb.none / regTot) * 100).toFixed(1)

    const foreignEntries = Object.entries(subStats.foreign.map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => `${name}: ${count}명`)
      .join(', ') || '없음'

    pagesHtml += `
    <div class="page-container">
      <div>
        <div class="header-box">
          <h1 class="header-title">${fullSchoolName} 2027학년도 수능 응시 및 대입 원서접수 학교 총괄 현황표</h1>
          <div class="info-bar">
            <div>
              <span>학교명: <strong>${fullSchoolName}</strong></span>
              <span>출력 대상: <strong>${classInfo}</strong></span>
              <span>출력 조건: <strong>${filterSummary}</strong></span>
            </div>
            <div>
              <span>총 대상 인원: <strong>${records.length}명</strong> (재학생 ${enrolledStats.total}명, 졸업생 ${gradStats.total}명)</span>
              <span>출력일시: ${printDateStr}</span>
            </div>
          </div>
        </div>

        <!-- 1. 학급별 총괄 매트릭스 표 -->
        <table class="roster-table overview-table">
          <thead>
            <tr>
              <th rowspan="2" style="width: 100px;">학급 구분</th>
              <th rowspan="2" style="width: 45px;">총원</th>
              <th colspan="3">수능 응시 의향 (자가조사)</th>
              <th colspan="2">수능 접수대장 (공식)</th>
              <th rowspan="2" style="width: 70px;">⚠️수능<br>불일치</th>
              <th colspan="2">일반대/과기원 미접수</th>
              <th colspan="2">전문대 미접수</th>
              <th colspan="2">확인서 제출 현황</th>
            </tr>
            <tr>
              <th style="width: 45px;">응시</th>
              <th style="width: 50px;">미응시</th>
              <th style="width: 45px;">미응답</th>
              <th style="width: 50px;">접수됨</th>
              <th style="width: 45px;">미접수</th>
              <th style="width: 50px;">수시</th>
              <th style="width: 50px;">정시</th>
              <th style="width: 50px;">수시</th>
              <th style="width: 50px;">정시</th>
              <th style="width: 45px;">제출</th>
              <th style="width: 45px;">미제출</th>
            </tr>
          </thead>
          <tbody>
            ${overviewRows}
            ${enrolledSubtotalRow}
            ${gradRow}
            ${grandTotalRow}
          </tbody>
        </table>

        <!-- 2. 수능 선택과목 통계 현황표 (국어, 수학, 탐구 조합, 제2외국어) -->
        <div style="margin-top: 10px; border: 1.5px solid #4338ca; border-radius: 6px; padding: 8px; background: #faf5ff;">
          <div style="font-size: 11.5px; font-weight: 800; color: #3730a3; margin-bottom: 6px;">
            📊 2027학년도 수능 접수대장 선택과목 통계 요약 (총 접수인원: ${subStats.totalRegistered}명 기준)
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; font-size: 10px;">
            <!-- 국어/수학 -->
            <div style="background:#fff; border:1px solid #c7d2fe; border-radius:4px; padding:6px;">
              <div style="font-weight:700; color:#1e1b4b; border-bottom:1px solid #e0e7ff; padding-bottom:3px; margin-bottom:4px;">📖 국어 / 수학 선택과목</div>
              <div>• <strong>국어</strong>: 화법과 작문 <strong>${korHwawon}명</strong> (${korHwawonPct}%) / 언어와 매체 <strong>${korEonmae}명</strong> (${korEonmaePct}%) / 미선택 ${korNone}명</div>
              <div style="margin-top:3px;">• <strong>수학</strong>: 확통 <strong>${mathHwatong}명</strong> (${mathHwatongPct}%) / 미적분 <strong>${mathMijeok}명</strong> (${mathMijeokPct}%) / 기하 <strong>${mathGiha}명</strong> (${mathGihaPct}%) / 미선택 ${mathNone}명</div>
            </div>

            <!-- 탐구 조합 유형 -->
            <div style="background:#fff; border:1px solid #c7d2fe; border-radius:4px; padding:6px;">
              <div style="font-weight:700; color:#1e1b4b; border-bottom:1px solid #e0e7ff; padding-bottom:3px; margin-bottom:4px;">🔬 탐구 조합 유형별 인원 및 비율</div>
              <div>• 사탐 2과목: <strong>${cb.social2}명</strong> (${s2Pct}%) / 사탐 1과목: <strong>${cb.social1}명</strong> (${s1Pct}%)</div>
              <div style="margin-top:2px;">• 사탐1+과탐1: <strong>${cb.social1_science1}명</strong> (${s1c1Pct}%)</div>
              <div style="margin-top:2px;">• 과탐 2과목: <strong>${cb.science2}명</strong> (${c2Pct}%) / 과탐 1과목: <strong>${cb.science1}명</strong> (${c1Pct}%)</div>
              <div style="margin-top:2px;">• 직업탐구: <strong>${cb.vocational}명</strong> (${vocPct}%) / 미선택: <strong>${cb.none}명</strong> (${inqNonePct}%)</div>
            </div>

            <!-- 제2외국어/한문 -->
            <div style="background:#fff; border:1px solid #c7d2fe; border-radius:4px; padding:6px;">
              <div style="font-weight:700; color:#1e1b4b; border-bottom:1px solid #e0e7ff; padding-bottom:3px; margin-bottom:4px;">🌐 제2외국어 / 한문 영역</div>
              <div>• 응시자: <strong>${subStats.foreign.takers}명</strong> (${((subStats.foreign.takers / regTot) * 100).toFixed(1)}%) / 미응시: <strong>${subStats.foreign.none}명</strong></div>
              <div style="margin-top:3px; color:#475569; font-size:9.5px; line-height:1.3;">• 과목: ${foreignEntries}</div>
            </div>
          </div>

          <!-- 3. 탐구 영역 세부 과목별 선택 통계 (분모: 총 선택과목수) -->
          <div style="margin-top: 6px; background: #fff; border: 1px solid #c7d2fe; border-radius: 4px; padding: 6px;">
            <div style="font-size: 10px; font-weight: 700; color: #1e1b4b; margin-bottom: 3px;">
              🧪 탐구 영역 세부 과목별 선택 비율 (총 선택 과목수 분모: <strong>${subStats.inquiry.totalPicks}과목</strong> 기준)
            </div>
            <div style="line-height: 1.6;">
              ${inquiryRows}
            </div>
          </div>
        </div>
      </div>

      <div class="footer-sign">
        <span>작성자(진학담당) : _________________ (인)</span>
        <span style="margin-left: 30px;">진로진학부장 : _________________ (인)</span>
        <span style="margin-left: 30px;">교감 : _________________ (인)</span>
        <span style="margin-left: 30px;">교장 : _________________ (인)</span>
      </div>
    </div>`
  }

  // ================================================================
  // 학급별 개별 대장 페이지 (학급별 페이지 분리 + 하단 학급 통계 요약)
  // ================================================================
  for (const group of groups) {
    const gStats = computeStats(group.items)

    const rowsHtml = group.items.map((r, idx) => {
      const csatSelf = !r.has_survey ? '<span class="badge-none">미응답</span>' : (r.csat_intent === 'TAKE' ? '<span class="badge-yes">응시</span>' : '<span class="badge-no">미응시</span>')
      const csatOfficial = r.csat_registered ? '<span class="badge-yes">접수됨</span>' : '<span class="badge-none">미접수</span>'
      let matchBadge = '-'
      if (r.csat_mismatch === 'MATCH') matchBadge = '<span class="badge-yes">일치</span>'
      else if (r.csat_mismatch === 'NO_SURVEY') matchBadge = '<span class="badge-none">-</span>'
      else if (r.csat_mismatch === 'SURVEY_YES_CSAT_NO' || r.csat_mismatch === 'SURVEY_NO_CSAT_YES') matchBadge = '<span class="badge-mismatch">⚠️불일치</span>'

      const susiGen = !r.has_survey ? '<span class="badge-none">미응답</span>' : ((r.susi_general_intent || r.susi_intent) === 'NO_APPLY' ? '<span class="badge-no">미접수</span>' : '<span class="badge-yes">접수</span>')
      const jungGen = !r.has_survey ? '<span class="badge-none">미응답</span>' : ((r.jungsi_general_intent || r.jungsi_intent) === 'NO_APPLY' ? '<span class="badge-no">미접수</span>' : '<span class="badge-yes">접수</span>')
      const susiCol = !r.has_survey ? '<span class="badge-none">미응답</span>' : (r.susi_college_intent === 'NO_APPLY' ? '<span class="badge-no">미접수</span>' : '<span class="badge-yes">접수</span>')
      const jungCol = !r.has_survey ? '<span class="badge-none">미응답</span>' : (r.jungsi_college_intent === 'NO_APPLY' ? '<span class="badge-no">미접수</span>' : '<span class="badge-yes">접수</span>')

      const formSub = r.has_survey ? (r.is_form_submitted ? '<span class="badge-yes">✔제출</span>' : '<span class="badge-no">미제출</span>') : '-'

      let remarks = []
      if (r.csat_intent === 'NO_TAKE' && r.csat_no_take_reason) remarks.push(`[수능미응시] ${r.csat_no_take_reason}`)
      if ((r.susi_general_intent || r.susi_intent) === 'NO_APPLY' && (r.susi_general_no_reason || r.susi_no_apply_reason)) remarks.push(`[수시미접수] ${r.susi_general_no_reason || r.susi_no_apply_reason}`)
      if (r.history_count > 0) remarks.push(`(수정 ${r.history_count}회)`)
      const remarksStr = remarks.join(' / ') || '-'

      const classDisplay = r.class_no ? `${r.class_no}반` : (r.is_enrolled === false ? `졸업생(${r.grad_year || ''})` : '-')
      const noDisplay = r.student_no ? `${r.student_no}번` : '-'

      return `
      <tr>
        <td>${idx + 1}</td>
        <td style="font-family:monospace; font-weight:700;">${r.student_code || '-'}</td>
        <td style="font-weight:700;">${r.name || '-'}</td>
        <td>${classDisplay} ${noDisplay !== '-' ? noDisplay : ''}</td>
        <td>${csatSelf}</td>
        <td>${csatOfficial}</td>
        <td>${matchBadge}</td>
        <td>${susiGen}</td>
        <td>${jungGen}</td>
        <td>${susiCol}</td>
        <td>${jungCol}</td>
        <td>${formSub}</td>
        <td class="text-left" style="font-size:9.5px; max-width:220px;">${remarksStr}</td>
      </tr>`
    }).join('')

    pagesHtml += `
    <div class="page-container">
      <div>
        <div class="header-box">
          <h1 class="header-title">${title} (${group.name})</h1>
          <div class="info-bar">
            <div>
              <span>학교명: <strong>${fullSchoolName}</strong></span>
              <span>대상 학급: <strong>${group.name}</strong></span>
              <span>출력 조건: <strong>${filterSummary}</strong></span>
            </div>
            <div>
              <span>학급 인원: <strong>총 ${group.items.length}명</strong></span>
              <span>출력일시: ${printDateStr}</span>
            </div>
          </div>
        </div>

        <table class="roster-table">
          <thead>
            <tr>
              <th style="width: 30px;">No</th>
              <th style="width: 55px;">학번</th>
              <th style="width: 65px;">성명</th>
              <th style="width: 65px;">반/번호</th>
              <th style="width: 58px;">수능(자가)</th>
              <th style="width: 62px;">수능(대장)</th>
              <th style="width: 52px;">매칭</th>
              <th style="width: 62px;">(일반대)수시</th>
              <th style="width: 62px;">(일반대)정시</th>
              <th style="width: 62px;">(전문대)수시</th>
              <th style="width: 62px;">(전문대)정시</th>
              <th style="width: 55px;">확인서</th>
              <th>비고 (미응시·미접수 사유 및 특이사항)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <!-- 표 하단 학급 통계 요약 바 -->
        <div class="class-summary-box">
          <div class="summary-header">📊 <strong>[ ${group.name} 현황 통계 요약 ]</strong></div>
          <table class="class-summary-table">
            <tr>
              <th>학급 총원</th>
              <th>수능 응시(자가)</th>
              <th>수능 미응시</th>
              <th>수능 접수대장</th>
              <th>⚠️수능 불일치</th>
              <th>일반대 수시미접수</th>
              <th>일반대 정시미접수</th>
              <th>전문대 수시미접수</th>
              <th>전문대 정시미접수</th>
              <th>확인서 제출</th>
            </tr>
            <tr>
              <td style="font-weight:700;">${gStats.total}명</td>
              <td>${gStats.csatTake}명</td>
              <td class="${gStats.csatNoTake > 0 ? 'cell-warn' : ''}">${gStats.csatNoTake}명</td>
              <td style="font-weight:600;">${gStats.csatReg}명</td>
              <td class="${gStats.mismatch > 0 ? 'cell-danger' : ''}">${gStats.mismatch > 0 ? `⚠️ ${gStats.mismatch}명` : '0명'}</td>
              <td class="${gStats.susiGenNo > 0 ? 'cell-warn' : ''}">${gStats.susiGenNo}명</td>
              <td class="${gStats.jungGenNo > 0 ? 'cell-warn' : ''}">${gStats.jungGenNo}명</td>
              <td class="${gStats.susiColNo > 0 ? 'cell-warn' : ''}">${gStats.susiColNo}명</td>
              <td class="${gStats.jungColNo > 0 ? 'cell-warn' : ''}">${gStats.jungColNo}명</td>
              <td style="color:#15803d; font-weight:700;">${gStats.formSub}명</td>
            </tr>
          </table>
        </div>
      </div>

      <div class="footer-sign">
        <span>담임교사 : _________________ (인)</span>
        <span style="margin-left: 30px;">진로진학부장 : _________________ (인)</span>
        <span style="margin-left: 30px;">교감 : _________________ (인)</span>
        <span style="margin-left: 30px;">교장 : _________________ (인)</span>
      </div>
    </div>`
  }

  const win = window.open('', '_blank')
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>${title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css">
  <style>
    @page { size: A4 landscape; margin: 8mm 10mm; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .page-container { page-break-after: always; min-height: 98vh; display: flex; flex-direction: column; justify-content: space-between; margin-bottom: 0 !important; }
      .page-container:last-child { page-break-after: auto; }
    }
    * { box-sizing: border-box; }
    body { font-family: 'Pretendard', sans-serif; color: #1e293b; margin: 0; padding: 10px; font-size: 11px; }
    .page-container { page-break-after: always; min-height: 98vh; display: flex; flex-direction: column; justify-content: space-between; margin-bottom: 25px; padding-bottom: 10px; border-bottom: 1px dashed #cbd5e1; }
    .page-container:last-child { page-break-after: auto; margin-bottom: 0; border-bottom: none; }
    .header-box { margin-bottom: 10px; }
    .header-title { font-size: 18px; font-weight: 800; text-align: center; margin: 0 0 6px 0; color: #0f172a; letter-spacing: -0.5px; }
    .info-bar { display: flex; justify-content: space-between; align-items: center; border-top: 1.5px solid #0f172a; border-bottom: 1px solid #cbd5e1; padding: 5px 4px; font-size: 11px; font-weight: 600; background: #f8fafc; }
    .info-bar span { margin-right: 14px; }
    .info-bar span strong { color: #4338ca; }
    table.roster-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
    th, td { border: 1px solid #64748b; padding: 4.5px 4px; text-align: center; font-size: 10px; line-height: 1.3; }
    th { background: #f1f5f9 !important; font-weight: 700; color: #0f172a; }
    .text-left { text-align: left !important; }
    .badge-yes { color: #166534; font-weight: 700; }
    .badge-no { color: #991b1b; font-weight: 700; background: #fee2e2; padding: 1px 4px; border-radius: 3px; border: 1px solid #fca5a5; display: inline-block; }
    .badge-mismatch { color: #b91c1c; font-weight: 800; background: #fecaca; padding: 1px 4px; border-radius: 3px; border: 1px solid #f87171; display: inline-block; }
    .badge-none { color: #94a3b8; }
    .cell-warn { color: #c2410c; font-weight: 700; background: #fff7ed !important; }
    .cell-danger { color: #b91c1c; font-weight: 800; background: #fee2e2 !important; }
    .cell-muted { color: #94a3b8; }
    .class-summary-box { margin-top: 10px; border: 1px solid #cbd5e1; border-radius: 6px; background: #f8fafc; padding: 6px 8px; }
    .summary-header { font-size: 11px; color: #334155; margin-bottom: 4px; }
    .class-summary-table { width: 100%; border-collapse: collapse; }
    .class-summary-table th, .class-summary-table td { border: 1px solid #94a3b8; padding: 4px 5px; font-size: 9.5px; text-align: center; }
    .class-summary-table th { background: #e2e8f0 !important; color: #1e293b; font-weight: 700; }
    .overview-table th, .overview-table td { padding: 6px 5px; font-size: 10.5px; }
    .footer-sign { margin-top: 14px; text-align: right; font-size: 11px; font-weight: 600; color: #475569; padding: 6px 4px 0 0; }
  </style>
  </head>
  <body>
    ${pagesHtml}
    <script>window.onload=function(){window.print();window.close();}<\/script>
  </body></html>`)
  win.document.close()
}

