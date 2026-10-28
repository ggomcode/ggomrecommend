-- ================================================================
-- 26. SYSTEM_MODULES (ggomsuite 통합 서비스 모듈 관리 및 스케줄링 테이블)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.system_modules (
    id TEXT PRIMARY KEY,                                           -- 'principal', 'rural', 'exam_intent', 'junior_college', 'rollbook', 'stat' 등
    name TEXT NOT NULL,                                            -- 시스템/모듈 표시명
    category TEXT,                                                 -- 분류 (진학/대입, 학사/출결, 통계/분석 등)
    badge TEXT,                                                    -- 상단 뱃지 텍스트
    description TEXT,                                              -- 서비스 설명
    icon TEXT,                                                     -- lucide 아이콘 식별자
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,                      -- 대문 활성화 여부
    always_open BOOLEAN NOT NULL DEFAULT TRUE,                     -- 상시 오픈 여부 (true면 기간 무관 상시 오픈)
    start_at TIMESTAMP WITH TIME ZONE,                             -- 오픈 시작 일시
    end_at TIMESTAMP WITH TIME ZONE,                               -- 마감 종료 일시
    target_roles TEXT[] DEFAULT '{"student", "teacher", "admin"}', -- 표시 대상 권한
    sort_order INTEGER DEFAULT 0,                                  -- 정렬 순서
    secret_access_enabled BOOLEAN DEFAULT FALSE,                   -- 학교 관리자 Secret 접속 통로 활성화 여부
    extra_config JSONB DEFAULT '{}'::jsonb,                        -- 추가 확장 옵션 (JSON)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 기존 테이블에 secret_access_enabled 컬럼 추가 (안전 실행)
ALTER TABLE public.system_modules ADD COLUMN IF NOT EXISTS secret_access_enabled BOOLEAN DEFAULT FALSE;

-- RLS 활성화 및 권한 부여
ALTER TABLE public.system_modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access to system_modules" ON public.system_modules;
CREATE POLICY "Enable all access to system_modules" ON public.system_modules FOR ALL TO public USING (true) WITH CHECK (true);
GRANT ALL ON TABLE public.system_modules TO anon, authenticated, service_role;

-- 초기 기본 모듈 데이터 시딩 (각 서비스별 기본 권한 그룹 명시)
INSERT INTO public.system_modules (id, name, category, badge, description, icon, is_enabled, always_open, sort_order, target_roles)
VALUES 
  ('principal', '학교장 추천자 선발 시스템', '대입 전형', '전국 대입', '주요 대학 학교장추천전형(지역균형) 신청서 제출, 대학별 정원 관리, 교내 석차 심의 및 최종 추천 확정', 'GraduationCap', true, true, 1, ARRAY['student', 'graduate', 'admin']),
  ('rural', '농어촌(기회균형) 전형 추천 등록', '대입 전형', '기회균형 포함', '기회균형 내 농어촌 특별전형 자격 검증, 지원 희망자 배정 관리 및 거주 요건 이력 통합 관리', 'ShieldCheck', true, true, 2, ARRAY['student', 'graduate', 'admin']),
  ('exam_intent', '수능응시 · 수시/정시 원서접수계획 등록', '진학 관리', '재학생 전수 조사', '수능 응시 여부 및 대학 수시·정시 원서접수 계획 자가 등록, 미응시/미접수 확인서 출력 및 수능 접수대장 대조', 'ClipboardList', true, true, 3, ARRAY['student', 'teacher', 'admin']),
  ('junior_college', '전문대학 학교장 추천', '대입 전형', '직인 날인 즉시 발급', '별도 교내 심의 없이 대학·학과·전형 수동 직접 입력 및 행정실 학교장 직인 날인용 추천서 즉시 발급·출력', 'School', true, true, 4, ARRAY['student', 'graduate', 'admin']),
  ('rollbook', '선택교과 출석관리', '학사 관리', '고3 이동수업 · 원적학급', '고등학교 3학년 선택교육과정 이동수업(1~12반) 및 원적학급(1~11반) 출석부 생성·인쇄, 결석계 대장 조회/인쇄, 급식 캘린더', 'BookOpen', true, true, 5, ARRAY['teacher', 'admin']),
  ('stat', '수시 지원 통계 분석 (꼼스탯)', '통계 분석', '대교협 원자료 기반', '대교협 수시 지원 원자료를 바탕으로 한 학생별·대학별 전형 지원 통계 및 합격 예측 시각화', 'BarChart3', true, true, 6, ARRAY['teacher', 'admin'])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  badge = EXCLUDED.badge,
  target_roles = EXCLUDED.target_roles;

-- 기본 로그인 화면 시스템명 config 추가
INSERT INTO public.config (key, value)
VALUES ('login_system_name', '3학년 통합 학년업무 시스템')
ON CONFLICT (key) DO NOTHING;
