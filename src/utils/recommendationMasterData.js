/**
 * 2027 / 2026학년도 대입 수시 학교장추천전형 및 지역균형전형 대학별 공식 기준 데이터
 * - 대학별 공식 수시 모집요강 및 대학입학전형시행계획 기준 전수 검증 반영
 * - 고교별 추천 제한 정원 (quota / raw_quota)
 * - 졸업년도 지원 자격 조건 (grad_condition)
 * - 포곡고등학교 3학년 재적 인원: 334명 기준
 */

export const HIGH_SCHOOL_ENROLLED_COUNT = 334;

export function cleanUnivName(name) {
  if (!name) return '';
  const raw = String(name).trim();
  if (raw.includes('글로컬')) return '건국대학교(글로컬)';
  if (raw.includes('ERICA') || raw.includes('에리카')) return '한양대학교(ERICA)';
  if (raw.includes('글로벌') && raw.includes('외')) return '한국외국어대학교(글로벌)';
  if (raw.includes('다빈치')) return '중앙대학교(다빈치)';
  return raw.replace(/\([^)]*\)/g, '').trim();
}

/**
 * 2026/2027 대입 학교장추천전형 대학별 공식 고교 추천 제한 정원 및 졸업년도 자격 조건
 * (최신 대교협 및 대학별 수시 모집요강 전수 팩트체크 완료)
 */
export const RECOMMENDATION_MASTER_DATA = {
  // ── [1] 서울 주요 상위권 대학 ──────────────────────────────────────────
  '서울대학교': {
    quota: 2,
    raw_quota: '2명',
    grad_condition: '2027년 2월 졸업예정자 (재학생만)'
  },
  '연세대학교': {
    quota: 10,
    raw_quota: '10명',
    grad_condition: '2027년 2월 졸업예정자 (재학생만)'
  },
  '고려대학교': {
    quota: 12,
    raw_quota: '12명',
    grad_condition: '2027년 2월 졸업예정자 (재학생만)'
  },
  '서강대학교': {
    quota: 20,
    raw_quota: '20명',
    grad_condition: '2027년 2월 졸업예정자 (재학생만)'
  },
  '성균관대학교': {
    quota: 15,
    raw_quota: '15명',
    grad_condition: '2027년 2월 졸업예정자 (재학생만)'
  },
  '한양대학교': {
    quota: Math.ceil(HIGH_SCHOOL_ENROLLED_COUNT * 0.11), // 37명 (3학년 재적의 11%)
    raw_quota: '11%',
    grad_condition: '2026년 2월 이후 졸업자 (재수생 이하)'
  },
  '중앙대학교': {
    quota: 20,
    raw_quota: '20명',
    grad_condition: '2026년 2월 이후 졸업자 (재수생 이하)'
  },
  '경희대학교': {
    quota: null,
    raw_quota: '제한없음', // 2026학년도부터 추천 인원 제한 전면 폐지
    grad_condition: '2025년 2월 이후 졸업자 (3수생 이하)' // 졸업생 지원 자격 확대
  },
  '한국외국어대학교': {
    quota: 20,
    raw_quota: '20명 (서울 10, 글로벌 10)',
    grad_condition: '2026년 2월 이후 졸업자 (재수생 이하)'
  },
  '서울시립대학교': {
    quota: 20,
    raw_quota: '20명', // 2026학년도부터 10명 -> 20명으로 확대
    grad_condition: '2026년 2월 이후 졸업자 (재수생 이하)'
  },
  '이화여자대학교': {
    quota: 20,
    raw_quota: '20명', // 2025학년도부터 재적여학생 5% 폐지 -> 고교별 최대 20명 이내
    grad_condition: '2026년 2월 이후 졸업자 (재수생 이하)'
  },

  // ── [2] 서울 주요 중상위권 대학 ──────────────────────────────────────────
  '건국대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능 (제한없음)'
  },
  '건국대학교(글로컬)': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능 (제한없음)'
  },
  '동국대학교': {
    quota: 8,
    raw_quota: '8명',
    grad_condition: '졸업생 가능 (제한없음)'
  },
  '홍익대학교': {
    quota: 10,
    raw_quota: '10명',
    grad_condition: '2025년 2월 이후 졸업자 (3수생 이하)'
  },
  '숙명여자대학교': {
    quota: null,
    raw_quota: '제한없음', // 과거 여학생 10% 폐지 -> 제한없음
    grad_condition: '졸업생 가능 (제한없음)'
  },
  '국민대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능 (제한없음)'
  },
  '숭실대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능 (제한없음)'
  },
  '세종대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '2026년 2월 이후 졸업자 (재수생 이하)'
  },
  '단국대학교': {
    quota: 8,
    raw_quota: '8명 (인문 4, 자연 4)',
    grad_condition: '졸업생 가능 (제한없음)'
  },
  '아주대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능 (제한없음)'
  },
  '인하대학교': {
    quota: null,
    raw_quota: '제한없음', // 과거 15명 제한 폐지 -> 제한없음
    grad_condition: '졸업생 가능 (제한없음)'
  },

  // ── [3] 서울 및 경기·인천 주요 대학 ─────────────────────────────────────
  '가천대학교': {
    quota: null,
    raw_quota: '제한없음', // 고교 사전협의 및 온라인 추천, 추천인원 제한 없음
    grad_condition: '졸업생 가능 (제한없음)'
  },
  '경기대학교': {
    quota: 20,
    raw_quota: '20명',
    grad_condition: '졸업생 가능 (제한없음)'
  },
  '명지대학교': {
    quota: 20,
    raw_quota: '20명',
    grad_condition: '졸업생 가능 (제한없음)'
  },
  '상명대학교': {
    quota: null,
    raw_quota: '제한없음', // 2026학년도부터 10명 제한 폐지 -> 제한없음
    grad_condition: '졸업생 가능 (제한없음)'
  },
  '서울과학기술대학교': {
    quota: null,
    raw_quota: '제한없음', // 과거 10명 제한 폐지 -> 제한없음
    grad_condition: '2025년 2월 이후 졸업자 (3수생 이하)'
  },
  '서울여자대학교': {
    quota: null,
    raw_quota: '제한없음', // 과거 5명 제한 폐지 -> 제한없음
    grad_condition: '졸업생 가능 (제한없음)'
  },
  '성신여자대학교': {
    quota: null,
    raw_quota: '제한없음', // 과거 15명 제한 폐지 -> 제한없음
    grad_condition: '졸업생 가능 (제한없음)'
  },
  '가톨릭대학교': {
    quota: null,
    raw_quota: '제한없음', // 추천인원 제한 없음
    grad_condition: '2025년 2월 이후 졸업자 (3수생 이하)'
  },
  '인천대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능 (제한없음)'
  },
  '수원대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능 (제한없음)'
  },
  '평택대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능 (제한없음)'
  },
  '강남대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능 (제한없음)'
  },
  '한국공학대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능 (제한없음)'
  },
  '한경국립대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능 (제한없음)'
  },
  '광운대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능 (제한없음)'
  },
  '총신대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능 (제한없음)'
  },
  '한국항공대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능 (제한없음)'
  },
  '한양대학교(ERICA)': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능 (제한없음)'
  },
  '덕성여자대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능 (제한없음)'
  },
  '동덕여자대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능 (제한없음)'
  },
  '삼육대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능 (제한없음)'
  },
  '서경대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능 (제한없음)'
  },
  '한성대학교': {
    quota: null,
    raw_quota: '제한없음',
    grad_condition: '졸업생 가능 (제한없음)'
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
      grad_condition: '졸업생 가능 (제한없음)'
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
    grad_condition: '졸업생 가능 (제한없음)'
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
