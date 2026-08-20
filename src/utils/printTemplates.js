import { schoolName, formatSchoolPrincipalTitle } from './schoolConfig.js'

function getFormattedSchoolName(rawInput) {
  let name = String(rawInput || '').trim()
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

    return `<tr${rowStyle}>
      <td style="text-align:center;">${i + 1}</td>
      <td>${univName}${abandonNote}</td>
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
        apps.forEach((app, idx) => {
          const prefNo = idx + 1
          const univName = app.univ_name || '—'
          const trackName = app.track_name || '—'
          const deptName = app.department_name ? ` (${app.department_name})` : ''
          
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
                <td class="text-center"></td>
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
                <td class="text-center"></td>
              </tr>
            `
          }
        })
      }
      rowSeq++
    }
  }

  const todayStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  })

  win.document.write(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>${className} 학교장추천전형 지원 현황 대장</title>
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
        .title-area .school-badge {
          font-size: 11px;
          color: #2563eb;
          font-weight: 700;
          margin-bottom: 2px;
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

        .footer-note {
          margin-top: 10px;
          display: flex;
          justify-content: space-between;
          font-size: 9.5px;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      <div class="page-container">
        <!-- 상단 헤더 & 결재란 -->
        <div class="top-header">
          <div class="title-area">
            <div class="school-badge">${formattedSchoolName}</div>
            <h1>2027학년도 대입 학교장추천전형 학급별 지원 현황 대장</h1>
            <div class="sub-meta">
              <span><strong>학급:</strong> ${className}</span>
              &nbsp;|&nbsp;
              <span><strong>담임/담당:</strong> ${teacherName || '관리자'}</span>
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
          <div style="color:#64748b;">
            출력 일시: ${todayStr}
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
              <th style="width: 48px;">서명확인</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <!-- 하단 안내 -->
        <div class="footer-note">
          <span>※ 본 문서는 학교장추천전형 지원 접수 및 심의를 위한 교내 확인용 공식 출력물입니다.</span>
          <span>${formattedSchoolName} 진학지도부</span>
        </div>
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

  const formattedSchoolName = getFormattedSchoolName(schoolName)
  const todayStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  })

  // 각 학급별 HTML 생성
  const sectionsHtml = classesData.map((cls, clsIdx) => {
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
          apps.forEach((app, idx) => {
            const prefNo = idx + 1
            const univName = app.univ_name || '—'
            const trackName = app.track_name || '—'
            const deptName = app.department_name ? ` (${app.department_name})` : ''
            
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
                  <td class="text-center"></td>
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
                  <td class="text-center"></td>
                </tr>
              `
            }
          })
        }
        rowSeq++
      }
    }

    const isLast = clsIdx === classesData.length - 1
    return `
      <div class="page-container ${isLast ? '' : 'page-break'}">
        <!-- 상단 헤더 & 결재란 -->
        <div class="top-header">
          <div class="title-area">
            <div class="school-badge">${formattedSchoolName}</div>
            <h1>2027학년도 대입 학교장추천전형 학급별 지원 현황 대장</h1>
            <div class="sub-meta">
              <span><strong>학급:</strong> ${className}</span>
              &nbsp;|&nbsp;
              <span><strong>담임/담당:</strong> ${teacherName || '관리자'}</span>
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
          <div style="color:#64748b;">
            출력 일시: ${todayStr}
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
              <th style="width: 48px;">서명확인</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <!-- 하단 안내 -->
        <div class="footer-note">
          <span>※ 본 문서는 학교장추천전형 지원 접수 및 심의를 위한 교내 확인용 공식 출력물입니다.</span>
          <span>${formattedSchoolName} 진학지도부</span>
        </div>
      </div>
    `
  }).join('')

  win.document.write(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>전체 학급 학교장추천전형 지원 현황 일괄 대장</title>
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
        .page-break {
          page-break-after: always;
          break-after: page;
          margin-bottom: 24px;
        }
        @media print {
          .page-break {
            margin-bottom: 0;
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
        .title-area .school-badge {
          font-size: 11px;
          color: #2563eb;
          font-weight: 700;
          margin-bottom: 2px;
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

        .footer-note {
          margin-top: 10px;
          display: flex;
          justify-content: space-between;
          font-size: 9.5px;
          color: #64748b;
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


