/**
 * 농어촌 전형 및 학교장 추천 시스템 - 학사 일정 기준 졸업생 판정 공통 유틸리티
 */

// 2026학년도 고3 학생들의 2027학년도 대입 학사 일정 상 졸업식 날짜 (2027년 1월 6일)
export const DEFAULT_GRADUATION_DATE = '2027-01-06';

/**
 * 학사 일정 및 학번 규칙 기준 졸업생 여부 판정:
 * 1) 학번 규칙: 학번 앞에 4자리 졸업연도(XXXX)가 붙은 9자리 학번 (예: 202430101, 202530101, 202630101 등 XXXX30101)
 *    또는 학번이 5자리를 초과하거나 'grad_' 접두어가 붙은 경우 -> 무조건 확실한 "졸업생"으로 판정됩니다.
 * 2) 명시적 졸업생 정보: grad_year < 2027, is_enrolled === false, is_graduated === true, role === 'graduate', grade === 0 등
 * 3) 현재 2026학년도 고3 재학생: 순수 5자리 학번 (예: 30101 ~ 31135), is_enrolled !== false, grade === 3
 *    -> 2027년 1월 6일 졸업식 이전까지는 "절대" 졸업생이 아니며 3학년 재학생으로 분류됩니다.
 * 4) 졸업식 날짜(2027-01-06) 당일 및 그 이후부터는 2026학년도 고3 학생들도 졸업생으로 전환됩니다.
 *
 * @param {Object} studentOrApp - 학생 또는 지원서 객체
 * @param {string} [targetGraduationDate=DEFAULT_GRADUATION_DATE] - 졸업식 날짜 (YYYY-MM-DD)
 * @returns {boolean} 졸업생 여부 (true: 졸업생, false: 재학생)
 */
export function isGraduatedStudent(studentOrApp, targetGraduationDate = DEFAULT_GRADUATION_DATE) {
  if (!studentOrApp) return false;

  // 1. 학번 규칙 검사
  // 졸업생은 5자리 학번(예: 30101) 앞에 4자리 졸업연도(XXXX)가 붙어 9자리 학번(XXXX30101) 형태를 갖습니다.
  const code = String(studentOrApp.student_code || studentOrApp.studentCode || '').trim();
  if (code.startsWith('grad_')) {
    return true;
  }
  if (code && !code.startsWith('kcue_')) {
    const digits = code.replace(/\D/g, '');
    // 5자리를 초과하는 숫자 학번(예: 9자리 202430101, 202530101, 202630101 등)은 무조건 졸업생
    if (digits.length > 5) {
      return true;
    }
  }

  // 2. 과거 연도 졸업생(2026년 2월 이전 졸업 등)이 명시된 경우 -> 무조건 졸업생
  const gradYear = Number(studentOrApp.grad_year || studentOrApp.gradYear || 0);
  if (gradYear > 0 && gradYear < 2027) {
    return true;
  }

  // 3. 명시적으로 졸업생 신분인 경우 (is_enrolled === false, is_graduated === true, role === 'graduate', grade === 0 등)
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

  // 4. 졸업식 날짜 비교
  const now = new Date();
  const gradDate = new Date(targetGraduationDate + 'T00:00:00');
  const isAfterGraduation = now >= gradDate;

  // 5. 2026학년도 현재 3학년 재학생 (2027 대입 수험생, 순수 5자리 학번)
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

export const checkIsGraduate = isGraduatedStudent;
