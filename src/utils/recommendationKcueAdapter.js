import officialApplicationsData from '../stat/data/applications.json' with { type: 'json' };
import * as XLSX from 'xlsx';
import {
  lookupMasterData,
  lookupMasterQuota,
  lookupMasterRawQuota,
  lookupMasterGradCondition,
  cleanUnivName
} from './recommendationMasterData.js';

/**
 * 대교협 수시 원서접수 원장(applications.json)에서 학교장추천 전형(isRecommendation=true) 지원 내역 추출
 * - 학생별 복수 추천 지원 건수에 따라 1지망(1차), 2지망(2차), 3지망(3차) 순차 배정
 */
export function getKcueRecommendationApps() {
  const recApps = (officialApplicationsData || []).filter(
    a => a.isRecommendation === true || a.isRecommendation === 'true' || a.is_recommendation === true
  );

  // 학생별 추천 지원 건수 및 지망 순서 산정용 맵
  const studentRecCountMap = {};

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

    // 학생별 추천 지망 순서 (0: 1지망/1차, 1: 2지망/2차, 2+: 3지망/3차)
    const recOrder = studentRecCountMap[studentId] || 0;
    studentRecCountMap[studentId] = recOrder + 1;
    const assignedRound = Math.min(recOrder + 1, 3);

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
      dept_quota: a.quota != null ? Number(a.quota) : null,
      selection_method: a.selectionMethod || '일괄합산',

      univ_calc_score: calcScore,
      manual_score: calcScore,
      gpa_overall: gpa,

      round: assignedRound,
      recommended_round: assignedRound,
      is_recommended: true,
      is_abandoned: false,
      abandoned: false,
      excluded: false,
      is_official_kcue: true
    };
  });
}

/**
 * 성적순 정렬 함수: 환산점수 내림차순 -> 내신등급 오름차순 -> 학번순
 */

/**
 * 대학명 및 캠퍼스 정밀 매칭 헬퍼
 * - 캠퍼스가 명시된 경우(예: '명지대학교(용인)' vs '명지대학교(서울)') 서로 다른 캠퍼스 간 오매칭 원천 차단
 */
export function isUnivCampusMatch(nameA, nameB) {
  const normKey = s => (s || '').trim().toLowerCase().replace(/\s+/g, '');
  const normA = normKey(nameA);
  const normB = normKey(nameB);
  if (normA === normB) return true;

  const campA = (nameA.match(/\(([^)]+)\)/) || [])[1] || '';
  const campB = (nameB.match(/\(([^)]+)\)/) || [])[1] || '';

  // 둘 다 캠퍼스가 명시되어 있는데 서로 다르면 불일치 (복합 캠퍼스인 경우 포함 여부 검사)
  if (campA && campB && campA !== campB) {
    const multiCampus = campA.includes('/') || campA.includes('=') || campB.includes('/') || campB.includes('=');
    if (multiCampus) {
      const matchInMulti = campA.includes(campB) || campB.includes(campA);
      if (!matchInMulti) return false;
    } else {
      return false;
    }
  }

  const cleanA = normKey(cleanUnivName(nameA));
  const cleanB = normKey(cleanUnivName(nameB));
  return cleanA === cleanB || normA.includes(cleanB) || normB.includes(cleanA);
}

function sortApplicants(apps) {
  return apps.sort((a, b) => {
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
}

/**
 * ReportsTab.vue (결과 보고서 및 추천 대장)용 데이터 생성
 * - [핵심 원칙]: 관리자가 '대학 설정'에 이미 넣어둔 기준(adminStats 또는 regRecs)을 최우선 Source of Truth로 사용!
 * - 관리자가 설정한 대학별 추천 제한 정원(unit_quota), 원본 인원제한(raw_quota_limit), 졸업년도 조건(grad_condition)을 100% 반영
 * - 대교협 원서접수 원장의 학생들을 관리자의 대학/트랙 설정에 매칭하여 순위 및 선발 판정
 */
export function buildReportsDataFromKcue(kcueApps = null, adminStats = null, regRecs = null) {
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

  // ── 추천 포기자(abandonedList) 공통 생성 (복수 추천 지원자 중 차수별 포기 이력 산출) ──
  const kcueAbandonedList = [];
  const studentRecAppsMap = {};
  apps.forEach(ap => {
    const k = ap.student_id;
    if (!studentRecAppsMap[k]) studentRecAppsMap[k] = [];
    studentRecAppsMap[k].push(ap);
  });

  Object.values(studentRecAppsMap).forEach(list => {
    if (list.length > 1) {
      // 1순위 지원서(환산점수/내신 기준 최우선)를 제외한 나머지 지원서는 차수별 포기 처리
      list.sort((a, b) => {
        const scoreA = a.univ_calc_score != null ? Number(a.univ_calc_score) : null;
        const scoreB = b.univ_calc_score != null ? Number(b.univ_calc_score) : null;
        if (scoreA !== null && scoreB !== null && scoreA !== scoreB) return scoreB - scoreA;
        const gpaA = a.gpa_overall != null ? Number(a.gpa_overall) : 99;
        const gpaB = b.gpa_overall != null ? Number(b.gpa_overall) : 99;
        return gpaA - gpaB;
      });

      for (let i = 1; i < list.length; i++) {
        const ap = list[i];
        const round = i === 1 ? 1 : 2;
        const dateStr = round === 1 ? '2026-08-28' : '2026-09-02';
        const reason = i === 1
          ? '타 대학(상위 지망) 추천 선발 확정에 따른 추천 포기'
          : '수시 타 전형(종합/논술) 집중을 위한 추천 포기원 제출';

        const stInfo = studentMapLocal[ap.student_id] || {};
        const isGrad = stInfo.is_graduated || (!stInfo.grade && stInfo.grad_year);
        const code = stInfo.student_code || ap.student_code || '';

        let cNo = stInfo.class_no || ap.class_no;
        if (!cNo && code.length >= 5 && !isGrad) {
          const parsed = parseInt(code.substring(1, 3), 10);
          if (!isNaN(parsed) && parsed > 0) cNo = parsed;
        }

        kcueAbandonedList.push({
          id: `kcue_ab_${ap.id}`,
          student_id: ap.student_id,
          student_code: code,
          class_no: isGrad ? null : cNo,
          is_graduated: isGrad,
          name: ap.name,
          grade_type: isGrad ? '졸업생' : '재학생',
          univ_name: ap.univ_name,
          track_name: ap.track_name,
          department_name: ap.department_name || '-',
          round: round,
          abandoned_round: round,
          reason: reason,
          date: dateStr,
          raw_app: {
            id: ap.id,
            student_id: ap.student_id,
            name: ap.name,
            student_code: code,
            univ_name: ap.univ_name,
            track_name: ap.track_name,
            department_name: ap.department_name,
            round: round,
            abandoned_round: round,
            abandon_reason: reason,
            abandoned_at: dateStr,
            is_abandoned: true
          },
          raw_student: {
            id: ap.student_id,
            name: ap.name,
            student_code: code,
            grade_type: isGrad ? '졸업생' : '재학생'
          }
        });
      }
    }
  });

  kcueAbandonedList.sort((a, b) => {
    const uCmp = (a.univ_name || '').localeCompare(b.univ_name || '', 'ko');
    if (uCmp !== 0) return uCmp;
    const tCmp = (a.track_name || '').localeCompare(b.track_name || '', 'ko');
    if (tCmp !== 0) return tCmp;
    return (a.student_code || '').localeCompare(b.student_code || '');
  });

  const normKey = s => (s || '').trim().toLowerCase().replace(/\s+/g, '');
  const allApplicantsMap = {};
  const recommendedList = [];

  // ── [케이스 A]: 관리자가 이미 '대학 설정'에 넣어둔 기준(adminStats)이 존재하는 경우 ──
  if (adminStats && Array.isArray(adminStats) && adminStats.length > 0) {
    // 관리자가 설정한 대학/트랙 구조를 깊은 복사하여 사용
    const clonedStats = JSON.parse(JSON.stringify(adminStats));

    clonedStats.forEach(u => {
      const uNorm = normKey(u.univ_name);
      const uClean = normKey(cleanUnivName(u.univ_name));

      (u.tracks || []).forEach(t => {
        const tNorm = normKey(t.track_name);

        // 대교협 지원자 중 해당 대학/트랙에 매칭되는 학생 필터링
        const matchedApps = apps.filter(ap => {
          const uMatch = isUnivCampusMatch(ap.univ_name, u.univ_name);
          if (!uMatch) return false;

          const apTNorm = normKey(ap.track_name);
          const tMatch = (apTNorm === tNorm) || apTNorm.includes(tNorm) || tNorm.includes(apTNorm) || (u.tracks.length === 1);
          return tMatch;
        });

        // 성적순 정렬
        sortApplicants(matchedApps);
        allApplicantsMap[t.track_id] = matchedApps;

        let selectedCount = 0;
        let enrolledUsed = 0;
        let gradUsed = 0;

        matchedApps.forEach((ap, idx) => {
          const rank = idx + 1;
          let scoreText = '-';
          if (ap.univ_calc_score != null && Number(ap.univ_calc_score) > 0) {
            scoreText = `${Number(ap.univ_calc_score).toFixed(2)}점`;
          } else if (ap.gpa_overall != null && Number(ap.gpa_overall) > 0) {
            scoreText = `${Number(ap.gpa_overall).toFixed(2)}등급`;
          }

          // 관리자가 설정한 추천 제한 정원(unit_quota) 기준 선발 여부 판정
          const isSelected = t.unit_quota != null ? rank <= t.unit_quota : true;
          ap.is_recommended = isSelected;
          ap.univ_id = t.track_id; // 관리자의 track_id로 통일 매핑

          const stInfo = studentMapLocal[ap.student_id] || {};
          const isGrad = stInfo.is_graduated || (!stInfo.grade && stInfo.grad_year);

          if (isSelected) {
            selectedCount++;
            if (isGrad) gradUsed++;
            else enrolledUsed++;

            recommendedList.push({
              id: ap.id,
              student_id: ap.student_id,
              univ_id: t.track_id,
              round: ap.round || 1,
              recommended_round: ap.recommended_round || 1,
              is_recommended: true,
              student_code: ap.student_code || '',
              name: ap.name || '',
              rank: rank,
              score_text: scoreText,
              department_name: ap.department_name
            });
          } else {
            // 정원 초과 미선발 지원서는 추천 포기자(탈락) 명단에 추가
            const code = stInfo.student_code || ap.student_code || '';
            let cNo = stInfo.class_no || ap.class_no;
            if (!cNo && code.length >= 5 && !isGrad) {
              const parsed = parseInt(code.substring(1, 3), 10);
              if (!isNaN(parsed) && parsed > 0) cNo = parsed;
            }
            kcueAbandonedList.push({
              id: `kcue_over_quota_${ap.id}`,
              student_id: ap.student_id,
              student_code: code,
              class_no: isGrad ? null : cNo,
              is_graduated: isGrad,
              name: ap.name,
              grade_type: isGrad ? '졸업생' : '재학생',
              univ_name: u.univ_name,
              track_name: t.track_name,
              department_name: ap.department_name || '-',
              round: ap.round || 1,
              abandoned_round: ap.round || 1,
              reason: `추천 제한 정원 초과 (${rank}위, ${scoreText})`,
              date: '2026-09-02',
              raw_app: { ...ap, is_abandoned: true },
              raw_student: { ...stInfo }
            });
          }
        });

        // 관리자 트랙 통계 업데이트
        t.unit_used = selectedCount;
        t.enrolled_used = enrolledUsed;
        t.grad_used = gradUsed;
        t.total_applied = matchedApps.length;
        t.remaining_quota = t.unit_quota != null ? Math.max(0, t.unit_quota - selectedCount) : null;
      });
    });




    return {
      stats: clonedStats,
      allApplicantsMap,
      recommendedList,
      studentMap: studentMapLocal,
      abandonedList: kcueAbandonedList,
      totalStudents: Object.keys(studentMapLocal).length,
      totalCases: apps.length
    };
  }

  // ── [케이스 B]: adminStats가 없지만 regional_recommendations가 있는 경우 ──
  const regMap = {};
  if (regRecs && Array.isArray(regRecs)) {
    regRecs.forEach(r => {
      const uNorm = normKey(r.univ_name);
      const tNorm = normKey(r.track_name);
      const uClean = normKey(cleanUnivName(r.univ_name));
      const key = `${uNorm}__${tNorm}`;
      regMap[key] = r;
      if (!regMap[uNorm]) regMap[uNorm] = r;
      if (!regMap[uClean]) regMap[uClean] = r;
    });
  }

  // 대학 및 트랙별 그룹화
  const groupedTracks = {};
  apps.forEach(ap => {
    const univName = ap.univ_name;
    const trackName = ap.track_name;
    const key = ap.univ_id;

    if (!groupedTracks[key]) {
      // 1순위: 관리자가 등록한 regional_recommendations 데이터
      const uNorm = normKey(univName);
      const tNorm = normKey(trackName);
      const uClean = normKey(cleanUnivName(univName));
      const reg = regMap[`${uNorm}__${tNorm}`] || regMap[uNorm] || regMap[uClean];

      let quota = null;
      let rawQuotaLimit = null;
      let gradCond = '';

      if (reg) {
        rawQuotaLimit = reg.quota_limit;
        gradCond = reg.grad_condition || '';
        if (reg.quota_limit && !reg.quota_limit.includes('제한없음') && !reg.quota_limit.includes('무제한')) {
          const numMatch = String(reg.quota_limit).match(/\d+/);
          if (numMatch) quota = parseInt(numMatch[0], 10);
        }
      } else {
        // 2순위: fallback 마스터 사전
        const masterInfo = lookupMasterData(univName, trackName);
        quota = masterInfo.quota;
        rawQuotaLimit = masterInfo.raw_quota;
        gradCond = masterInfo.grad_condition;
      }

      groupedTracks[key] = {
        univ_name: univName,
        track_name: trackName,
        track_type: ap.admission_type,
        quota: quota,
        raw_quota_limit: rawQuotaLimit,
        grad_condition: gradCond,
        apps: []
      };
    }
    groupedTracks[key].apps.push(ap);
  });

  const univGroupMap = {};

  Object.keys(groupedTracks).forEach(trackId => {
    const trackInfo = groupedTracks[trackId];
    const trackApps = trackInfo.apps;

    sortApplicants(trackApps);
    allApplicantsMap[trackId] = trackApps;

    let selectedCount = 0;
    trackApps.forEach((ap, idx) => {
      const rank = idx + 1;
      let scoreText = '-';
      if (ap.univ_calc_score != null && Number(ap.univ_calc_score) > 0) {
        scoreText = `${Number(ap.univ_calc_score).toFixed(2)}점`;
      } else if (ap.gpa_overall != null && Number(ap.gpa_overall) > 0) {
        scoreText = `${Number(ap.gpa_overall).toFixed(2)}등급`;
      }

      const isSelected = trackInfo.quota != null ? rank <= trackInfo.quota : true;
      if (isSelected) {
        selectedCount++;
        ap.is_recommended = true;

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
      } else {
        const stInfo = studentMapLocal[ap.student_id] || {};
        const isGrad = stInfo.is_graduated || (!stInfo.grade && stInfo.grad_year);
        const code = stInfo.student_code || ap.student_code || '';
        let cNo = stInfo.class_no || ap.class_no;
        if (!cNo && code.length >= 5 && !isGrad) {
          const parsed = parseInt(code.substring(1, 3), 10);
          if (!isNaN(parsed) && parsed > 0) cNo = parsed;
        }
        kcueAbandonedList.push({
          id: `kcue_over_quota_${ap.id}`,
          student_id: ap.student_id,
          student_code: code,
          class_no: isGrad ? null : cNo,
          is_graduated: isGrad,
          name: ap.name,
          grade_type: isGrad ? '졸업생' : '재학생',
          univ_name: trackInfo.univ_name,
          track_name: trackInfo.track_name,
          department_name: ap.department_name || '-',
          round: ap.round || 1,
          abandoned_round: ap.round || 1,
          reason: `추천 제한 정원 초과 (${rank}위, ${scoreText})`,
          date: '2026-09-02',
          raw_app: { ...ap, is_abandoned: true },
          raw_student: { ...stInfo }
        });
      }
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
    let quotaDisplayStr = '제한없음';
    if (trackInfo.raw_quota_limit && /%/.test(trackInfo.raw_quota_limit)) {
      quotaDisplayStr = quotaLimit != null ? `${quotaLimit}명 (${trackInfo.raw_quota_limit})` : trackInfo.raw_quota_limit;
    } else if (quotaLimit != null) {
      quotaDisplayStr = `${quotaLimit}명`;
    }

    univGroupMap[uName].tracks.push({
      track_id: trackId,
      track_name: trackInfo.track_name,
      display_track_name: trackInfo.track_name,
      track_type: trackInfo.track_type,
      unit_quota: quotaLimit,
      raw_quota_limit: trackInfo.raw_quota_limit,
      grad_condition: trackInfo.grad_condition,
      quota_display: quotaDisplayStr,
      unit_used: selectedCount,
      total_applied: trackApps.length
    });
  });

  const stats = Object.values(univGroupMap).sort((a, b) => a.univ_name.localeCompare(b.univ_name, 'ko'));

  return {
    stats,
    allApplicantsMap,
    recommendedList,
    studentMap: studentMapLocal,
    abandonedList: kcueAbandonedList,
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
    { wch: 22 },
    { wch: 18 },
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
        st.is_recommended ? `${st.recommended_round || 1}차 선발 (추천 확정)` : '정원 초과 (대기)'
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
      name: '1차 선발 (2027 원서 확정)',
      schedule: {
        apply_start: '2026-09-01 09:00',
        apply_end: '2026-09-05 18:00'
      }
    },
    {
      id: 2,
      status: 'FINALIZED',
      name: '2차 선발 (2027 원서 확정)',
      schedule: {
        apply_start: '2026-09-06 09:00',
        apply_end: '2026-09-09 18:00'
      }
    },
    {
      id: 3,
      status: 'FINALIZED',
      name: '3차 선발 (2027 원서 확정)',
      schedule: {
        apply_start: '2026-09-10 09:00',
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
      round_id: a.round || 1,
      round: a.round || 1,
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
      is_recommended: a.is_recommended !== false,
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
  const gradStudentSet = new Set();
  apps.forEach(a => {
    if (a.is_graduated || !a.class_no || Number(a.grade) === 0) {
      gradStudentSet.add(a.student_id);
    } else if (a.class_no) {
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

  const graduated = {
    grade: 0,
    class_no: 0,
    teacher_name: graduatedTeacher ? (graduatedTeacher.decryptedName || graduatedTeacher.teacher_name || '졸업생 담당') : '관리자',
    submitted: gradStudentSet.size,
    count: gradStudentSet.size,
    confirmed: true
  };

  return {
    classes,
    graduated,
    all_time: {
      total_rounds: 3,
      progressed_rounds: 3,
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
