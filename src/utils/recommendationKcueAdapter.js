import officialApplicationsData from '../stat/data/applications.json' with { type: 'json' };
import * as XLSX from 'xlsx';

/**
 * 대교협 수시 원서접수 원장(applications.json)에서 학교장추천 전형(isRecommendation=true) 지원 내역 추출
 */
export function getKcueRecommendationApps() {
  const recApps = (officialApplicationsData || []).filter(
    a => a.isRecommendation === true || a.isRecommendation === 'true' || a.is_recommendation === true
  );

  return recApps.map((a, idx) => {
    const grade = a.grade || 3;
    let studentCode = '';
    if (a.classNum && a.studentNum) {
      studentCode = `${grade}${String(a.classNum).padStart(2, '0')}${String(a.studentNum).padStart(2, '0')}`;
    } else {
      studentCode = String(a.studentKey || a.studentNum || '').trim();
    }

    const studentKey = a.studentKey || `${a.classNum || 0}-${a.studentNum || 0}_${a.name || '학생'}`;
    const studentId = `kcue_rec_std_${studentCode}_${a.name || idx}`;

    const univName = (a.univName || '').trim();
    const trackName = (a.admissionDetailType || a.admissionMajorType || '학교장추천전형').trim();
    const trackId = `kcue_track_${univName}__${trackName}`.replace(/[\s()\/]+/g, '_');

    const calcScore = a.univConvertedScore != null ? Number(a.univConvertedScore) : null;
    const gpa = a.score9Grade != null ? Number(a.score9Grade) : (a.allSubjectGrade != null ? Number(a.allSubjectGrade) : null);

    return {
      id: a.id ? `kcue_rec_app_${a.id}` : `kcue_rec_app_${idx + 1}`,
      raw_id: a.id,
      student_id: studentId,
      student_code: studentCode,
      name: a.name || '학생',
      grade: grade,
      class_no: a.classNum ? Number(a.classNum) : null,
      seq_no: a.studentNum ? Number(a.studentNum) : null,
      is_enrolled: !a.isGraduate,
      grad_year: a.isGraduate ? '2026' : null,

      univ_id: trackId,
      track_id: trackId,
      univ_name: univName,
      track_name: trackName,
      department_name: a.dept || '',
      admission_type: a.admissionType || '학생부위주(교과)',
      quota: a.quota != null ? Number(a.quota) : null,
      selection_method: a.selectionMethod || '일괄합산',

      univ_calc_score: calcScore,
      manual_score: calcScore,
      gpa_overall: gpa,

      round: 1,
      recommended_round: 1,
      is_recommended: true,
      is_abandoned: false,
      abandoned: false,
      excluded: false,
      is_official_kcue: true
    };
  });
}

/**
 * ReportsTab.vue (결과 보고서 및 추천 대장)용 데이터 생성
 */
export function buildReportsDataFromKcue(kcueApps = null) {
  const apps = kcueApps || getKcueRecommendationApps();

  // 1. 학생 맵 구성
  const studentMapLocal = {};
  apps.forEach(ap => {
    if (!studentMapLocal[ap.student_id]) {
      studentMapLocal[ap.student_id] = {
        id: ap.student_id,
        name: ap.name,
        student_code: ap.student_code,
        gpa_overall: ap.gpa_overall,
        grad_year: ap.grad_year,
        is_graduated: !ap.is_enrolled,
        grade: ap.grade,
        class_no: ap.class_no,
        seq_no: ap.seq_no
      };
    }
  });

  // 2. 대학 및 트랙별 그룹화
  const groupedTracks = {};
  apps.forEach(ap => {
    const key = ap.univ_id;
    if (!groupedTracks[key]) {
      groupedTracks[key] = {
        univ_name: ap.univ_name,
        track_name: ap.track_name,
        track_type: ap.admission_type,
        quota: ap.quota,
        apps: []
      };
    }
    groupedTracks[key].apps.push(ap);
  });

  // 3. allApplicantsMap 및 recommendedList 산출
  const allApplicantsMap = {};
  const recommendedList = [];

  // 대학별로 stats 배열 구조화
  const univGroupMap = {};

  Object.keys(groupedTracks).forEach(trackId => {
    const trackInfo = groupedTracks[trackId];
    const trackApps = trackInfo.apps;

    // 성적순 정렬: 환산점수 내림차순 -> 내신등급 오름차순 -> 학번
    trackApps.sort((a, b) => {
      const scoreA = a.univ_calc_score != null ? Number(a.univ_calc_score) : null;
      const scoreB = b.univ_calc_score != null ? Number(b.univ_calc_score) : null;
      if (scoreA !== null && scoreB !== null && scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      const gpaA = a.gpa_overall != null && Number(a.gpa_overall) > 0 ? Number(a.gpa_overall) : 99;
      const gpaB = b.gpa_overall != null && Number(b.gpa_overall) > 0 ? Number(b.gpa_overall) : 99;
      if (gpaA !== gpaB) {
        return gpaA - gpaB;
      }
      return (a.student_code || '').localeCompare(b.student_code || '');
    });

    allApplicantsMap[trackId] = trackApps;

    trackApps.forEach((ap, idx) => {
      const rank = idx + 1;
      let scoreText = '-';
      if (ap.univ_calc_score != null && Number(ap.univ_calc_score) > 0) {
        scoreText = `${Number(ap.univ_calc_score).toFixed(2)}점`;
      } else if (ap.gpa_overall != null && Number(ap.gpa_overall) > 0) {
        scoreText = `${Number(ap.gpa_overall).toFixed(2)}등급`;
      }

      recommendedList.push({
        id: ap.id,
        student_id: ap.student_id,
        univ_id: ap.univ_id,
        round: ap.round || 1,
        recommended_round: ap.recommended_round || 1,
        is_recommended: true,
        student_code: ap.student_code || '',
        name: ap.name || '',
        rank: rank,
        score_text: scoreText,
        department_name: ap.department_name
      });
    });

    const uName = trackInfo.univ_name;
    if (!univGroupMap[uName]) {
      univGroupMap[uName] = {
        univ_id: `kcue_u_${uName}`.replace(/[\s()\/]+/g, '_'),
        univ_name: uName,
        tracks: []
      };
    }

    const quotaLimit = trackInfo.quota;
    univGroupMap[uName].tracks.push({
      track_id: trackId,
      track_name: trackInfo.track_name,
      display_track_name: trackInfo.track_name,
      track_type: trackInfo.track_type,
      unit_quota: quotaLimit,
      quota_display: quotaLimit != null ? `${quotaLimit}명` : '제한없음',
      unit_used: trackApps.length,
      total_applied: trackApps.length
    });
  });

  const stats = Object.values(univGroupMap).sort((a, b) => a.univ_name.localeCompare(b.univ_name, 'ko'));

  return {
    stats,
    allApplicantsMap,
    recommendedList,
    studentMap: studentMapLocal,
    totalStudents: Object.keys(studentMapLocal).length,
    totalCases: apps.length
  };
}

/**
 * 2027 원서접수 확정 원장 기반 엑셀 다운로드 Blob 생성
 */
export function exportKcueQuotaStatsExcel(displayedStats, roundStr = '전체') {
  const workbook = XLSX.utils.book_new();

  // 1. 추천 명단 및 정원 현황 시트
  const headers = ['No', '대학명', '모집단위', '졸업년도 조건', '추천 제한 정원', '추천 확정 인원', '(재학생)', '(졸업생)', '추천 학생 명단'];
  const rows = [];

  (displayedStats || []).forEach((item, idx) => {
    const studentStrs = (item.students || []).map(s => `${s.student_code} ${s.name} ${s.suffix || ''}`).join(', ');
    rows.push([
      idx + 1,
      item.univ_name,
      item.display_track_name || item.track_name,
      item.grad_condition || '제한없음',
      item.quota_display,
      item.unit_used != null ? `${item.unit_used}명` : '0명',
      item.enrolled_used != null ? `${item.enrolled_used}명` : '0명',
      item.grad_used != null ? `${item.grad_used}명` : '0명',
      studentStrs || '-'
    ]);
  });

  const ws1 = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws1['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 28 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 10 },
    { wch: 10 },
    { wch: 45 }
  ];
  XLSX.utils.book_append_sheet(workbook, ws1, '추천명단_및_정원현황');

  // 2. 추천 학생 상세 명단 시트
  const studentHeaders = ['No', '대학명', '모집단위', '지원학과', '학번', '성명', '구분', '순위', '성적/등급', '선발결과'];
  const studentRows = [];
  let stIdx = 1;

  (displayedStats || []).forEach(item => {
    (item.students || []).forEach(st => {
      studentRows.push([
        stIdx++,
        item.univ_name,
        item.display_track_name || item.track_name,
        st.department_name || '-',
        st.student_code,
        st.name,
        st.grade_type || '재학생',
        st.rank ? `${st.rank}위` : '-',
        st.score_text || '-',
        '추천 확정 (2027 대입 확정)'
      ]);
    });
  });

  const ws2 = XLSX.utils.aoa_to_sheet([studentHeaders, ...studentRows]);
  ws2['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 28 },
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 14 },
    { wch: 24 }
  ];
  XLSX.utils.book_append_sheet(workbook, ws2, '추천학생상세명단');

  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  blob.data = blob;
  return blob;
}

/**
 * TeacherView/ResultsTab.vue (교사용 추천 결과)용 데이터 생성
 */
export function buildTeacherResultsFromKcue(kcueApps = null, authClassNo = null, authGrade = 3) {
  const apps = kcueApps || getKcueRecommendationApps();

  const isGradTeacher = authGrade === 0;
  const filteredApps = apps.filter(a => {
    if (isGradTeacher) return !a.is_enrolled;
    if (authClassNo == null || authClassNo === '' || authClassNo === 'all') return a.is_enrolled;
    return a.is_enrolled && Number(a.class_no) === Number(authClassNo);
  });

  const rounds = [
    {
      id: 1,
      status: 'FINALIZED',
      name: '2027학년도 대입 원서접수 확정',
      schedule: {
        apply_start: '2026-09-01 09:00',
        apply_end: '2026-09-13 18:00'
      }
    }
  ];

  // results 매핑
  const results = filteredApps.map((a, idx) => {
    let scoreText = '-';
    if (a.univ_calc_score != null && Number(a.univ_calc_score) > 0) {
      scoreText = `${a.univ_calc_score}점`;
    } else if (a.gpa_overall != null && Number(a.gpa_overall) > 0) {
      scoreText = `${a.gpa_overall}등급`;
    }

    return {
      id: a.id,
      student_id: a.student_id,
      round_id: 1,
      round: 1,
      track_id: a.track_id,
      univ_name: a.univ_name,
      track_name: a.track_name,
      department_name: a.department_name,
      name: a.name,
      student_code: a.student_code,
      seq_no: a.seq_no,
      ranking: 1,
      score: scoreText,
      total_score: a.univ_calc_score || a.gpa_overall || 0,
      is_recommended: true,
      abandoned: false,
      is_abandoned: false,
      scanned_doc_url: null,
      is_official_kcue: true
    };
  });

  return {
    rounds,
    results
  };
}


/**
 * OverviewTab.vue (개요)용 데이터 생성 — DB에 지원서가 0건일 때 폴백
 * getOverview()가 반환하는 all_time, classes 구조와 동일한 형태를 KCUE 확정 원장으로 채움
 */
export function buildOverviewFromKcue(teachers = []) {
  const apps = getKcueRecommendationApps();
  const totalCases = apps.length;

  // 학생 고유 수
  const studentSet = new Set(apps.map(a => a.student_id));
  const totalStudents = studentSet.size;

  // 반별 지원자 수 집계
  const classCounts = {};  // key: "grade_classNo" -> Set of student_id
  apps.forEach(a => {
    if (a.class_no) {
      const key = `${a.grade}_${a.class_no}`;
      if (!classCounts[key]) classCounts[key] = new Set();
      classCounts[key].add(a.student_id);
    }
  });

  // teachers 배열로 classes 구성 (교사 정보가 있으면 반영, 없으면 1~11반 기본 생성)
  const regularTeachers = teachers.filter(t => t.grade && Number(t.grade) !== 0);
  const graduatedTeacher = teachers.find(t => !t.grade || Number(t.grade) === 0);

  let classes;
  if (regularTeachers.length > 0) {
    classes = regularTeachers.map(t => {
      const key = `${t.grade}_${t.class_no}`;
      const count = classCounts[key] ? classCounts[key].size : 0;
      return {
        grade: t.grade,
        class_no: t.class_no,
        teacher_name: t.decryptedName || t.teacher_name || '담임교사',
        count,
        submitted: count,
        confirmed: true
      };
    });
  } else {
    // 교사 정보 없으면 1~11반 기본 생성
    classes = [];
    for (let c = 1; c <= 11; c++) {
      const key = `3_${c}`;
      const count = classCounts[key] ? classCounts[key].size : 0;
      classes.push({
        grade: 3,
        class_no: c,
        teacher_name: `${c}반 담임`,
        count,
        submitted: count,
        confirmed: true
      });
    }
  }

  const graduated = graduatedTeacher ? {
    grade: 0,
    class_no: 0,
    teacher_name: graduatedTeacher.decryptedName || graduatedTeacher.teacher_name || '졸업생 담당',
    submitted: 0,
    count: 0,
    confirmed: true
  } : null;

  return {
    classes,
    graduated,
    all_time: {
      total_rounds: 1,
      progressed_rounds: 1,
      applicant_students: totalStudents,
      applicant_cases: totalCases,
      confirmed_students: totalStudents,
      confirmed_cases: totalCases,
      abandoned_students: 0,
      abandoned_cases: 0,
      total_applicants: totalStudents,
      confirmed: totalStudents,
      abandoned: 0
    },
    _is_kcue_archive: true
  };
}

/**
 * TeacherView/ApplicationTab.vue (교사용 신청 관리 및 학생별 지원 현황)용 데이터 보강
 */
export function buildTeacherApplicationsFromKcue(kcueApps = null, authClassNo = null, authGrade = 3) {
  const apps = kcueApps || getKcueRecommendationApps();

  const isGradTeacher = authGrade === 0;
  const filteredApps = apps.filter(a => {
    if (isGradTeacher) return !a.is_enrolled;
    if (authClassNo == null || authClassNo === '' || authClassNo === 'all') return a.is_enrolled;
    return a.is_enrolled && Number(a.class_no) === Number(authClassNo);
  });

  // 학생 목록 구성
  const studentMap = new Map();
  filteredApps.forEach(a => {
    if (!studentMap.has(a.student_id)) {
      studentMap.set(a.student_id, {
        id: a.student_id,
        name: a.name,
        student_code: a.student_code,
        grade: a.grade,
        class_no: a.class_no,
        seq_no: a.seq_no,
        is_enrolled: a.is_enrolled,
        gpa_overall: a.gpa_overall
      });
    }
  });

  const students = Array.from(studentMap.values()).sort((a, b) => (a.seq_no || 0) - (b.seq_no || 0));

  return {
    students,
    applications: filteredApps
  };
}
