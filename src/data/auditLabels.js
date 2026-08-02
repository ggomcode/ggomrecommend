export const AUDIT_ACTION_LABELS = {
  // 교사 가입 승인/거절
  APPROVE:          '교사 가입 승인',
  REJECT:           '교사 가입 거절',
  TEACHER_APPROVED: '교사 가입 승인',
  TEACHER_REJECTED: '교사 가입 거절',
  SIGNUP:           '회원 가입 신청',

  // 라운드 생명주기
  ROUND_OPENED:    '라운드 개시',
  ROUND_CLOSED:    '라운드 종료',
  ROUND_REOPENED:  '라운드 재개시',
  ROUND_FINALIZED: '라운드 마감',

  // 점수·추천
  SCORES_RECALCULATED:  '점수 재계산',
  RECOMMEND_CONFIRMED:  '추천 확정',
  RECOMMEND_CANCELED:   '추천 취소',
  AUTO_RECOMMEND_RUN:   '자동 추천',

  // 지원
  APPLICATION_SAVED:    '지원 등록',
  APPLICATION_DELETED:  '지원 삭제',
  APPLICATION_ABANDONED:'지원 포기',
  APPLICATION_EXCLUDED:            '미선발 처리',
  APPLICATION_EXCLUSION_CLEARED:   '미선발 해제',

  // 학급
  CLASSES_IMPORTED: '학급 일괄 가져오기',
  CLASS_SAVED:      '학급 저장',
  CLASS_DELETED:    '학급 삭제',

  // 학생
  STUDENTS_IMPORTED: '학생 일괄 가져오기',
  STUDENT_ADDED:     '학생 추가',
  STUDENT_DELETED:   '학생 삭제',

  // 전형요소
  AREA_CREATED: '전형요소 추가',
  AREA_UPDATED: '전형요소 수정',
  AREA_DELETED: '전형요소 삭제',

  // 점수 기준·기초데이터
  SCORE_TABLE_IMPORTED: '점수 기준 가져오기',
  BASE_DATA_IMPORTED:   '기초데이터 가져오기',

  // 담임 입력 확정
  ROUND_CONFIRMED:              '담임 입력 확정',
  ROUND_CONFIRMATION_REVOKED:   '담임 입력 확정 해제',

  // 대학·모집단위 & 1단계 요강
  UNIVERSITY_CREATED: '대학 추가',
  UNIVERSITY_UPDATED: '대학 수정',
  UNIVERSITY_DELETED: '대학 삭제',
  TRACK_CREATED: '모집단위 추가',
  TRACK_UPDATED: '모집단위 수정',
  TRACK_DELETED: '모집단위 삭제',
  UNIVERSITY_SETTINGS_IMPORTED: '대학 설정 일괄 가져오기',
  REGIONAL_IMPORT: '1단계 엑셀 요강 가져오기',
  REGIONAL_UPDATE: '1단계 요강 수동 수정',
  REGIONAL_DELETE: '1단계 요강 항목 삭제',
  UNIV_SYNC: '1단계 요강 기반 정원 자동 동기화',

  // 인증·백업
  DB_BACKUP_DOWNLOADED:     '백업 파일 다운로드',
  TEACHER_PASSWORD_CHANGED: '담임 비밀번호 변경',
  ADMIN_PASSWORD_CHANGED:   '관리자 비밀번호 변경',
}
