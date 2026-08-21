/**
 * 지원 모집단위(학과/학부) 입력 유효성 검사 및 정규화 유틸리티
 */

/**
 * 학과명이 미지정(공백, 상관없음, 미정, 모름 등)인지 확인
 * @param {string} dept 
 * @returns {boolean}
 */
export function isUndecidedDepartment(dept) {
  if (!dept || !String(dept).trim()) return true
  const clean = String(dept).trim().replace(/\s+/g, '').toLowerCase()

  // 특수문자 단독 또는 반복 (예: '-', '.', '?', 'x', 'X', '×', '/' 등)
  if (/^[-_.?~!\/xXoO×✕✖*#]+$/.test(clean)) return true

  // 미지정/상관없음 관련 단어 목록
  const undecidedKeywords = [
    '상관없음', '상관없다', '상관x', '상관없', '상관없슴', '상관마', '상관안함',
    '미정', '미지정', '미결정', '아직미결정', '아직미정', '미정임',
    '추후결정', '추후정함', '추후', '추후선택', '추후입력',
    '모름', '모르겠음', '몰라요', '몰라', '모름니다',
    '없음', '없다', '무', '해당없음', '해당없다',
    '아무거나', '아무과', '아무데나', '아무학과', '자유전공없음'
  ]

  if (undecidedKeywords.includes(clean)) return true

  return false
}

/**
 * 학과명 정규화 (미지정인 경우 '-' 반환)
 * @param {string} dept 
 * @param {boolean} forceUndecided 
 * @returns {string}
 */
export function normalizeDepartmentName(dept, forceUndecided = false) {
  if (forceUndecided || isUndecidedDepartment(dept)) {
    return '-'
  }
  return String(dept).trim()
}
