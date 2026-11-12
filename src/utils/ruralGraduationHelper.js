/**
 * 농어촌 전형 및 학교장 추천 시스템 - 학사 일정 기준 졸업생 판정 공통 유틸리티
 */

// 2026학년도 고3 학생들의 2027학년도 대입 학사 일정 상 졸업식 날짜 (2027년 1월 6일)
export const DEFAULT_GRADUATION_DATE = '2027-01-06';

/**
 * 학사 일정 기준 졸업생 여부 판정:
 * 1) 과거 연도 졸업생(2026년 2월 이전 졸업), 명시적 졸업생 신분 접수자(is_enrolled === false, role === 'graduate', 등)는 확실한 "졸업생"으로 판정됩니다.
 * 2) 현재 2026학년도 고3 재학생(2027학년도 대입 수험생, grade === 3 && is_enrolled !== false)은 2027년 1월 졸업식(기본값: 2027-01-06) 이전까지는 "절대" 졸업생이 아니며, 3학년 재학생으로 분류됩니다.
 * 3) 졸업식 날짜(2027-01-06) 당일 및 그 이후부터 2026학년도 고3 학생들도 졸업생으로 전환됩니다.
 *
 * @param {Object} studentOrApp - 학생 또는 지원서 객체
 * @param {string} [targetGraduationDate=DEFAULT_GRADUATION_DATE] - 졸업식 날짜 (YYYY-MM-DD)
 * @returns {boolean} 졸업생 여부 (true: 졸업생, false: 재학생)
 */
export function isGraduatedStudent(studentOrApp, targetGraduationDate = DEFAULT_GRADUATION_DATE) {
  if (!studentOrApp) return false;

  // 1. 과거 연도 졸업생(2026년 2월 이전 졸업 등)이 명시된 경우 -> 무조건 졸업생
  const gradYear = Number(studentOrApp.grad_year || studentOrApp.gradYear || 0);
  if (gradYear > 0 && gradYear < 2027) {
    return true;
  }

  // 2. 명시적으로 졸업생 신분인 경우 (is_enrolled === false, is_graduated === true, role === 'graduate', 등)
  if (
    studentOrApp.is_enrolled === false ||
    studentOrApp.is_graduated === true ||
    studentOrApp.grade_type === '졸업생' ||
    studentOrApp.role === 'graduate' ||
    studentOrApp.is_separate_applicant === true ||
    studentOrApp.grade === 0 ||
    Number(studentOrApp.grade) === 0
  ) {
    return true;
  }

  // 3. 학번이 5자리를 초과하는 경우 (예: 202630120 등 졸업연도가 접두어로 붙은 학번) -> 졸업생
  const code = String(studentOrApp.student_code || studentOrApp.studentCode || '').trim();
  if (code.length > 5 && !code.startsWith('kcue_')) {
    return true;
  }

  // 4. 졸업식 날짜 비교
  const now = new Date();
  const gradDate = new Date(targetGraduationDate + 'T00:00:00');
  const isAfterGraduation = now >= gradDate;

  // 5. 2026학년도 현재 3학년 재학생 (2027 대입 수험생)
  const isCurrentSenior = Boolean(
    studentOrApp.is_official_kcue ||
    (studentOrApp.grade === 3 && studentOrApp.is_enrolled !== false)
  );

  if (isCurrentSenior) {
    // 2027년 1월 졸업식 전까지는 무조건 재학생, 졸업식 이후부터는 졸업생
    return isAfterGraduation;
  }

  return false;
}
