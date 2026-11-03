/**
 * 2027학년도 대입 수시 학교장추천전형 및 지역균형전형 대학별 공식 마스터 기준 데이터
 * - 고교별 추천 제한 정원 (quota / raw_quota)
 * - 졸업년도 지원 자격 조건 (grad_condition)
 * - 포곡고등학교 3학년 재적 인원: 334명 기준 환산
 */

export const HIGH_SCHOOL_ENROLLED_COUNT = 334;

export function cleanUnivName(name) {
  if (!name) return '';
  // 괄호 및 캠퍼스 표기 제거: "명지대학교(용인)" -> "명지대학교", "경희대학교(국제)" -> "경희대학교"
  // 단, 분교 체제인 건국대(글로컬), 한양대(ERICA) 등은 예외 처리 가능
  const raw = String(name).trim();
  if (raw.includes('글로컬')) return '건국대학교(글로컬)';
  if (raw.includes('ERICA') || raw.includes('에리카')) return '한양대학교(ERICA)';
  if (raw.includes('글로벌') && raw.includes('외')) return '한국외국어대학교(글로벌)';
  if (raw.includes('다빈치')) return '중앙대학교(다빈치)';
  return raw.replace(/\([^)]*\)/g, '').trim();
}

/**
 * 2027 대입 학교장추천전형 대학별 고교 추천 제한 정원 및 졸업년도 자격 조건 사전
 */
export const RECOMMENDATION_MASTER_DATA = {
  '서울대학교': {
    quota: 2,
    raw_quota: '2명',
    grad_condition: '2027년 2월 졸업예정자 (재학생만)'
  },
  '연세대학교': {
    quota: Math.ceil(HIGH_SCHOOL_ENROLLED_COUNT * 0.05), // 17명 (재적 5%, 최대 10~17명)
    raw_quota: '5%',
    grad_condition: '2027년 2월 졸업예정자 (재학생만)'
  },
  '고려대학교': {
    quota: Math.ceil(HIGH_SCHOOL_ENROLLED_COUNT * 0.04), // 13명 (재적 4%, 최대 12~13명)
    raw_quota: '4%',
    grad_condition: '2027년 2월 졸업예정자 (재학생만)'
  },
  '서강대학교': {
    quota: 20,
    raw_quota: '20명',
    grad_condition: '2027년 2월 졸업예정자 (재학생만)'
  },
  '성균관대학교': {
    quota: Math.ceil(HIGH_SCHOOL_ENROLLED_COUNT * 0.04), // 13명 (재적 4%, 최대 15명)
    raw_quota: '4%',
    grad_condition: '2027년 2월 졸업예정자 (재학생만)'
  },
  '한양대학교': {
    quota: Math.ceil(HIGH_SCHOOL_ENROLLED_COUNT * 0.11), // 37명 (재적 11%)
    raw_quota: '11%',
    grad_condition: '2026년 2월 이후 졸업자 (재수생 이하)'
  },
  '중앙대학교': {
    quota: 20,
    raw_quota: '20명',
    grad_condition: '2027년 2월 졸업예정자 (재학생만)'
  },
  '경희대학교': {
    quota: Math.ceil(HIGH_SCHOOL_ENROLLED_COUNT * 0.05), // 17명 (재적 5%)
    raw_quota: '5%',
    grad_condition: '2027년 2월 졸업예정자 (재학생만)'
  },
  '한국외국어대학교': {
    quota: 20,
    raw_quota: '20명',
    grad_condition: '2026년 2월 이후 졸업자 (재수생 이하)'
  },
  '서울시립대학교': {
    quota: 10,
    raw_quota: '10명',
    grad_condition: '2026년 2월 이후 졸업자 (재수생 이하)'
  },
  '이화여자대학교': {
    quota: 20,
    raw_quota: '재적 여학생의 5%',
    grad_condition: '2027년 2월 졸업예정자 (재학생만)'
  },
  '건국대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능'
  },
  '건국대학교(글로컬)': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능'
  },
  '동국대학교': {
    quota: 8,
    raw_quota: '8명',
    grad_condition: '졸업생 가능'
  },
  '홍익대학교': {
    quota: 10,
    raw_quota: '10명',
    grad_condition: '2025년 2월 이후 졸업자 (3수생 이하)'
  },
  '숙명여자대학교': {
    quota: 7,
    raw_quota: '여학생 10% (7명)',
    grad_condition: '2027년 2월 졸업예정자 (재학생만)'
  },
  '국민대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능'
  },
  '숭실대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능'
  },
  '세종대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '2026년 2월 이후 졸업자 (재수생 이하)'
  },
  '단국대학교': {
    quota: 8,
    raw_quota: '8명',
    grad_condition: '졸업생 가능'
  },
  '아주대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능'
  },
  '인하대학교': {
    quota: 15,
    raw_quota: '15명',
    grad_condition: '2025년 2월 이후 졸업자 (3수생 이하)'
  },
  '가천대학교': {
    quota: 20,
    raw_quota: '20명',
    grad_condition: '졸업생 가능'
  },
  '경기대학교': {
    quota: 20,
    raw_quota: '20명',
    grad_condition: '졸업생 가능'
  },
  '명지대학교': {
    quota: 20,
    raw_quota: '20명',
    grad_condition: '졸업생 가능'
  },
  '상명대학교': {
    quota: 10,
    raw_quota: '10명',
    grad_condition: '졸업생 가능'
  },
  '서울과학기술대학교': {
    quota: 10,
    raw_quota: '10명',
    grad_condition: '2025년 2월 이후 졸업자 (3수생 이하)'
  },
  '서울여자대학교': {
    quota: 5,
    raw_quota: '5명',
    grad_condition: '졸업생 가능'
  },
  '성신여자대학교': {
    quota: 15,
    raw_quota: '15명',
    grad_condition: '졸업생 가능'
  },
  '가톨릭대학교': {
    quota: 15,
    raw_quota: '15명',
    grad_condition: '2025년 2월 이후 졸업자 (3수생 이하)'
  },
  '인천대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능'
  },
  '수원대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능'
  },
  '평택대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능'
  },
  '강남대학교': {
    quota: 10,
    raw_quota: '10명',
    grad_condition: '졸업생 가능'
  },
  '한국공학대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능'
  },
  '한경국립대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능'
  },
  '광운대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능'
  },
  '총신대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능'
  },
  '한국항공대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능'
  },
  '한양대학교(ERICA)': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능'
  },
  '덕성여자대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능'
  },
  '동덕여자대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능'
  },
  '삼육대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능'
  },
  '서경대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능'
  },
  '한성대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능'
  }
};

/**
 * 대학명 및 전형명을 기준으로 마스터 기준 데이터 조회
 */
export function lookupMasterData(univName, trackName = '') {
  const normU = cleanUnivName(univName);
  const trackStr = String(trackName || '').trim();

  // 1. 자기추천/종합전형 중 추천 제한이 없는 전형 명시 처리
  if (trackStr.includes('자기추천') || trackStr.includes('목회자') || trackStr.includes('Cogito')) {
    return {
      quota: null,
      raw_quota: '제한없음',
      grad_condition: '졸업생 가능'
    };
  }

  // 2. 대학명 매칭
  if (RECOMMENDATION_MASTER_DATA[normU]) {
    return RECOMMENDATION_MASTER_DATA[normU];
  }

  // 3. 부분 일치 탐색
  for (const [key, val] of Object.entries(RECOMMENDATION_MASTER_DATA)) {
    if (normU.includes(key) || key.includes(normU)) {
      return val;
    }
  }

  // 기본값: 제한없음
  return {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능'
  };
}

export function lookupMasterQuota(univName, trackName = '') {
  return lookupMasterData(univName, trackName).quota;
}

export function lookupMasterRawQuota(univName, trackName = '') {
  return lookupMasterData(univName, trackName).raw_quota;
}

export function lookupMasterGradCondition(univName, trackName = '') {
  return lookupMasterData(univName, trackName).grad_condition;
}

