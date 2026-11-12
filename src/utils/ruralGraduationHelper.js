/**
 * 농어촌 전형 및 학교장 추천 시스템 - 학사 일정 기준 졸업생 판정 공통 유틸리티
 */

// 2026학년도 고3 학생들의 2027학년도 대입 학사 일정 상 졸업식 날짜 (2027년 1월 6일)
export const DEFAULT_GRADUATION_DATE = '2027-01-06';

/**
 * 학사 일정 기준 졸업생 여부 판정:
 * 1) 2026학년도 고3 (2027학년도 대입 수험생)은 2027년 1월 졸업식(기본값: 2027-01-06) 이전까지는 "절대" 졸업생이 아니며, 3학년 재학생으로 분류됩니다.
 * 2) 졸업식 날짜(2027-01-06) 당일 및 그 이후부터 2026학년도 고3 학생들도 졸업생으로 전환됩니다.
 * 3) 과거 연도 졸업생(2026년 2월 이전 졸업생, 2025학년도 이전 졸업, 또는 명시적 졸업생 신분으로 접수한 학생)은 졸업생으로 판정됩니다.
 *
 * @param {Object} studentOrApp - 학생 또는 지원서 객체
 * @param {string} [targetGraduationDate=DEFAULT_GRADUATION_DATE] - 졸업식 날짜 (YYYY-MM-DD)
 * @returns {boolean} 졸업생 여부 (true: 졸업생, false: 재학생)
 */
export function isGraduatedStudent(studentOrApp, targetGraduationDate = DEFAULT_GRADUATION_DATE) {
  if (!studentOrApp) return false;

  // 1. 과거 연도 졸업생(2026년 2월 이전 졸업 등)이 명시된 경우 -> 확실한 졸업생
  const gradYear = Number(studentOrApp.grad_year || studentOrApp.gradYear || 0);
  if (gradYear > 0 && gradYear < 2027) {
    return true;
  }

  // 2. 현재 기준 날짜와 졸업식 날짜 비교
  const now = new Date();
  const gradDate = new Date(targetGraduationDate + 'T00:00:00');
  const isAfterGraduation = now >= gradDate;

  // 3. 2026학년도 고3 (2027 대입 수험생) 식별:
  // - 2027 수시 원서접수 원장(is_official_kcue) 데이터
  // - 현재 3학년(grade === 3)
  // - 일반 학급(1~11반) 소속
  const cls = Number(studentOrApp.class_no ?? studentOrApp.student_class ?? 0);
  const is2027Senior = Boolean(
    studentOrApp.is_official_kcue ||
    studentOrApp.grade === 3 ||
    (cls >= 1 && cls <= 11)
  );

  // 4. 2026학년도 고3 학생은 졸업식 이전까지는 무조건 재학생 (졸업생 불가)
  if (is2027Senior && !isAfterGraduation) {
    return false;
  }

  // 5. 졸업식 날짜 이후라면 2026 고3 학생들도 졸업생으로 분류
  if (is2027Senior && isAfterGraduation) {
    return true;
  }

  // 6. 명시적 졸업생 플래그가 있는 경우 (과거 졸업생 또는 별도 졸업생 신분 접수자)
  if (
    studentOrApp.is_graduated === true ||
    studentOrApp.grade_type === '졸업생' ||
    studentOrApp.role === 'graduate' ||
    studentOrApp.is_separate_applicant === true
  ) {
    return true;
  }

  if (studentOrApp.is_enrolled === false) {
    return true;
  }

  return false;
}
