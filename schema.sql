-- ================================================================
-- 2027학년도 학교장 추천전형 선발 관리 시스템
-- Supabase PostgreSQL 스키마 스크립트
-- ================================================================

-- 0. EXTENSIONS (pgcrypto 필수 확장모듈)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- 1. CONFIG (시스템 설정 테이블)
CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- 초기 설정 데이터 삽입
INSERT INTO config (key, value) VALUES ('registration_code', 'school2026!') ON CONFLICT (key) DO NOTHING;
INSERT INTO config (key, value) VALUES ('openai_api_key', '') ON CONFLICT (key) DO NOTHING;
INSERT INTO config (key, value) VALUES ('school_info_api_key', '') ON CONFLICT (key) DO NOTHING;
INSERT INTO config (key, value) VALUES ('class_count', '11') ON CONFLICT (key) DO NOTHING;
INSERT INTO config (key, value) VALUES ('school_name', '우리고등학교') ON CONFLICT (key) DO NOTHING;
INSERT INTO config (key, value) VALUES ('allow_area_edit', 'false') ON CONFLICT (key) DO NOTHING;
INSERT INTO config (key, value) VALUES ('eval_areas_store', '[]') ON CONFLICT (key) DO NOTHING;
INSERT INTO config (key, value) VALUES ('disclosure_student_count', '') ON CONFLICT (key) DO NOTHING;
INSERT INTO config (key, value) VALUES ('susi_apply_start_date', '') ON CONFLICT (key) DO NOTHING;
INSERT INTO config (key, value) VALUES ('susi_apply_end_date', '') ON CONFLICT (key) DO NOTHING;
INSERT INTO config (key, value) VALUES ('google_sheet_principal_id', '') ON CONFLICT (key) DO NOTHING;
INSERT INTO config (key, value) VALUES ('google_sheet_rural_id', '') ON CONFLICT (key) DO NOTHING;
INSERT INTO config (key, value) VALUES ('round_schedules_map', '{"1":{"apply_start":"2026-08-19","apply_end":"2026-08-20","eval_date":"2026-08-21","announce_date":"2026-08-24"},"2":{"apply_start":"2026-08-26","apply_end":"2026-08-27","eval_date":"2026-08-28","announce_date":"2026-08-31"},"3":{"apply_start":"2026-09-02","apply_end":"2026-09-03","eval_date":"2026-09-04","announce_date":"2026-09-04"}}') ON CONFLICT (key) DO NOTHING;

-- 2. PROFILES (사용자 프로필 테이블)
-- status: 'pending' (승인대기), 'approved' (승인), 'rejected' (승인거절)
-- role: 'student', 'teacher', 'admin'
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    student_code TEXT UNIQUE, -- 학번 (학생의 경우 필수, 교사/관리자는 NULL)
    name TEXT NOT NULL,
    phone_last4 TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    is_enrolled BOOLEAN NOT NULL DEFAULT TRUE, -- 재학생 여부 (졸업생은 false)
    grad_year INTEGER, -- 졸업학년도 (is_enrolled가 false인 경우 필수)
    grade INTEGER, -- 학년
    class_no INTEGER, -- 반
    seq_no INTEGER, -- 번호
    has_disciplinary BOOLEAN NOT NULL DEFAULT FALSE, -- 선도처분 여부 (사회봉사 이상 시 true)
    rejection_reason TEXT, -- 관리자 가입 반려 사유
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT chk_enrolled_student CHECK (
        (role <> 'student') OR
        (is_enrolled = TRUE AND grad_year IS NULL AND student_code IS NOT NULL AND grade IS NOT NULL AND class_no IS NOT NULL AND seq_no IS NOT NULL) OR
        (is_enrolled = FALSE AND grad_year IS NOT NULL AND student_code IS NOT NULL AND grade IS NULL AND class_no IS NULL AND seq_no IS NULL)
    )
);

-- 3. UNIVERSITIES (대학 및 전형 관리 테이블)
-- csat_min: 'X' (없음), 'O' (있음), 또는 구체적인 텍스트
CREATE TABLE IF NOT EXISTS universities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    univ_name TEXT NOT NULL,
    track_type TEXT NOT NULL, -- 종합 / 교과 / 기타
    track_name TEXT NOT NULL, -- 전형명 (고교추천, 지역균형선발 등)
    grad_allowed BOOLEAN NOT NULL DEFAULT TRUE, -- 졸업생 추천 가능 여부
    csat_min TEXT NOT NULL DEFAULT 'X', -- 수능최저 여부
    has_quota BOOLEAN NOT NULL DEFAULT FALSE, -- 추천인원 제한 여부
    quota_limit INTEGER, -- 추천인원 제한인원수
    remarks TEXT, -- 비고
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (univ_name, track_name)
);

-- 4. APPLICATIONS (추천 신청 및 결과 테이블)
-- round: 1, 2, 3... (각 신청 차수)
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL, -- enrolled_students 및 profiles 통합 참조 ID
    univ_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    round INTEGER NOT NULL,
    department_name TEXT NOT NULL DEFAULT '', -- 지원학과
    
    -- 성적 및 추천 가드
    manual_score NUMERIC, -- 교사가 수동 입력한 대학별 내신산출점수
    is_excluded BOOLEAN NOT NULL DEFAULT FALSE, -- 부적합 여부
    excluded_reason TEXT, -- 부적합 사유
    original_rank INTEGER, -- 부적합 처리 전 원래의 순위 캐싱
    
    -- 추천 상태
    is_recommended BOOLEAN NOT NULL DEFAULT FALSE, -- 추천 확정 여부
    
    -- 포기 상태
    is_abandoned BOOLEAN NOT NULL DEFAULT FALSE, -- 포기 여부
    abandoned_doc_url TEXT, -- 포기원 스캔파일 Supabase Storage URL
    
    -- 웹 작성 신청서 정보
    parent_name TEXT,
    parent_phone TEXT,
    student_signature_url TEXT, -- 학생 서명 이미지 Supabase Storage URL
    parent_signature_url TEXT,  -- 학부모 서명 이미지 Supabase Storage URL
    
    -- 오프라인 서류 업로드 시
    scanned_doc_url TEXT, -- 추천서 스캔파일 Supabase Storage URL
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (student_id, univ_id, round)
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_applications_student ON applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_univ ON applications(univ_id);
CREATE INDEX IF NOT EXISTS idx_applications_round ON applications(round);

-- 5. AUDIT_LOG (감사 로그 테이블)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'SIGNUP', 'APPROVE', 'UNAPPROVE', 'APPLY', 'RECOMMEND', 'UNRECOMMEND', 'ABANDON', 'EXCLUDE'
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. TIMELINE_ROUNDS (라운드 제어 테이블)
-- status: 'OPEN' (신청 중), 'CLOSED' (마감 및 정렬/수동조정), 'FINALIZED' (확정 및 완료)
CREATE TABLE IF NOT EXISTS timeline_rounds (
    id INTEGER PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'FINALIZED')),
    opened_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    finalized_at TIMESTAMP WITH TIME ZONE
);

-- 기본 1, 2, 3 라운드 레코드 추가
INSERT INTO timeline_rounds (id, status) VALUES (1, 'OPEN') ON CONFLICT DO NOTHING;
INSERT INTO timeline_rounds (id, status) VALUES (2, 'OPEN') ON CONFLICT DO NOTHING;
INSERT INTO timeline_rounds (id, status) VALUES (3, 'OPEN') ON CONFLICT DO NOTHING;

-- 7. DISCIPLINARY_LOG (선도 처분 대상자 관리용 테이블)
CREATE TABLE IF NOT EXISTS disciplinary_students (
    student_code TEXT PRIMARY KEY, -- 학번
    name TEXT NOT NULL,
    reason TEXT NOT NULL -- 처분 사유 (사회봉사 이상)
);

-- ================================================================
-- ROW LEVEL SECURITY (RLS) & TRIGGERS
-- ================================================================

-- 프로필 자동 가입 동기화 트리거
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    role_val TEXT;
    name_val TEXT;
    status_val TEXT;
    is_enrolled_val BOOLEAN;
    grad_year_val INTEGER;
    student_code_val TEXT;
    phone_last4_val TEXT;
    grade_val INTEGER;
    class_no_val INTEGER;
    seq_no_val INTEGER;
    has_disc BOOLEAN := FALSE;
BEGIN
    -- user_metadata에서 가입 정보 추출
    role_val := COALESCE(new.raw_user_meta_data->>'role', 'student');
    name_val := COALESCE(new.raw_user_meta_data->>'name', '미입력');
    phone_last4_val := COALESCE(new.raw_user_meta_data->>'phone_last4', '');
    student_code_val := new.raw_user_meta_data->>'student_code';
    is_enrolled_val := COALESCE((new.raw_user_meta_data->>'is_enrolled')::boolean, TRUE);
    
    -- 관리자 및 통합 교사 이메일 강제 매핑 규칙 추가
    IF new.email = 'admin@ggomrecommend.ggomcode' THEN
        role_val := 'admin';
    ELSIF new.email = 'teacher@ggomrecommend.ggomcode' THEN
        role_val := 'teacher';
    END IF;
    
    IF new.raw_user_meta_data->>'grad_year' IS NOT NULL AND new.raw_user_meta_data->>'grad_year' != 'null' AND new.raw_user_meta_data->>'grad_year' != '' THEN
        grad_year_val := (new.raw_user_meta_data->>'grad_year')::integer;
    ELSE
        grad_year_val := NULL;
    END IF;

    IF new.raw_user_meta_data->>'grade' IS NOT NULL AND new.raw_user_meta_data->>'grade' != 'null' AND new.raw_user_meta_data->>'grade' != '' THEN
        grade_val := (new.raw_user_meta_data->>'grade')::integer;
    ELSE
        grade_val := NULL;
    END IF;

    IF new.raw_user_meta_data->>'class_no' IS NOT NULL AND new.raw_user_meta_data->>'class_no' != 'null' AND new.raw_user_meta_data->>'class_no' != '' THEN
        class_no_val := (new.raw_user_meta_data->>'class_no')::integer;
    ELSE
        class_no_val := NULL;
    END IF;

    IF new.raw_user_meta_data->>'seq_no' IS NOT NULL AND new.raw_user_meta_data->>'seq_no' != 'null' AND new.raw_user_meta_data->>'seq_no' != '' THEN
        seq_no_val := (new.raw_user_meta_data->>'seq_no')::integer;
    ELSE
        seq_no_val := NULL;
    END IF;
    
    -- 관리자/교사 또는 명시적 지정 시 즉시 승인, 학생은 대기 상태
    IF role_val IN ('admin', 'teacher') OR new.raw_user_meta_data->>'status' = 'approved' THEN
        status_val := 'approved';
    ELSE
        status_val := 'pending';
    END IF;

    -- 선도 처분 명단 대조 (테이블 미생성 시 안전 처리)
    IF student_code_val IS NOT NULL THEN
        BEGIN
            SELECT EXISTS(SELECT 1 FROM public.disciplinary_students WHERE student_code = student_code_val) INTO has_disc;
        EXCEPTION WHEN OTHERS THEN
            has_disc := FALSE;
        END;
    ELSE
        has_disc := FALSE;
    END IF;

    -- profiles 테이블 삽입 (예외 발생 시 500 에러 방지)
    BEGIN
        INSERT INTO public.profiles (id, student_code, name, phone_last4, role, status, is_enrolled, grad_year, grade, class_no, seq_no, has_disciplinary)
        VALUES (new.id, student_code_val, name_val, phone_last4_val, role_val, status_val, is_enrolled_val, grad_year_val, grade_val, class_no_val, seq_no_val, has_disc)
        ON CONFLICT (id) DO UPDATE SET
            student_code = EXCLUDED.student_code,
            name = EXCLUDED.name,
            phone_last4 = EXCLUDED.phone_last4,
            role = EXCLUDED.role,
            status = EXCLUDED.status,
            is_enrolled = EXCLUDED.is_enrolled,
            grad_year = EXCLUDED.grad_year,
            grade = EXCLUDED.grade,
            class_no = EXCLUDED.class_no,
            seq_no = EXCLUDED.seq_no,
            has_disciplinary = EXCLUDED.has_disciplinary;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'handle_new_user insert error: %', SQLERRM;
    END;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users 트리거 바인딩
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 가입코드 검증 RPC 함수
CREATE OR REPLACE FUNCTION public.check_registration_code(input_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    stored_code TEXT;
BEGIN
    SELECT value INTO stored_code FROM public.config WHERE key = 'registration_code';
    RETURN COALESCE(stored_code = input_code, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 교사 계정 생성 RPC 함수 (pgcrypto 사용)
CREATE OR REPLACE FUNCTION public.create_teacher_account(
    p_grade INT,
    p_class_no INT,
    p_name TEXT,
    p_password TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_email TEXT;
BEGIN
    -- 이메일 규격 설정
    v_email := 'teacher_' || p_grade || '_' || p_class_no || '@ggomrecommend.ggomcode';
    
    -- 이미 존재하는 경우 비밀번호와 메타데이터 업데이트
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
        SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

        UPDATE auth.users 
        SET encrypted_password = crypt(p_password, gen_salt('bf')),
            raw_user_meta_data = jsonb_build_object(
                'role', 'teacher',
                'name', p_name,
                'phone_last4', '0000',
                'grade', p_grade,
                'class_no', p_class_no
            ),
            updated_at = now()
        WHERE email = v_email;
        
        INSERT INTO public.profiles (id, name, role, status, grade, class_no, phone_last4, is_enrolled)
        VALUES (v_user_id, p_name, 'teacher', 'approved', p_grade, p_class_no, '0000', true)
        ON CONFLICT (id) DO UPDATE SET 
            name = EXCLUDED.name,
            grade = EXCLUDED.grade,
            class_no = EXCLUDED.class_no,
            status = 'approved';

        RETURN TRUE;
    END IF;
    
    -- 신규 UUID 생성 및 추가
    v_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        role,
        aud,
        confirmation_token
    ) VALUES (
        v_user_id,
        '00000000-0000-0000-0000-000000000000',
        v_email,
        crypt(p_password, gen_salt('bf')),
        now(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        jsonb_build_object(
            'role', 'teacher',
            'name', p_name,
            'phone_last4', '0000',
            'grade', p_grade,
            'class_no', p_class_no
        ),
        now(),
        now(),
        'authenticated',
        'authenticated',
        ''
    );
    
    -- identities 테이블 등록 (Supabase 로그인 연동용)
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        v_user_id,
        jsonb_build_object('sub', v_user_id, 'email', v_email),
        'email',
        v_email,
        now(),
        now(),
        now()
    );

    INSERT INTO public.profiles (id, name, role, status, grade, class_no, phone_last4, is_enrolled)
    VALUES (v_user_id, p_name, 'teacher', 'approved', p_grade, p_class_no, '0000', true)
    ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name,
        grade = EXCLUDED.grade,
        class_no = EXCLUDED.class_no,
        status = 'approved';

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth;

-- 학생 계정 생성 RPC 함수 (pgcrypto 사용)
CREATE OR REPLACE FUNCTION public.create_student_account(
    p_student_code TEXT,
    p_name TEXT,
    p_phone_last4 TEXT,
    p_password TEXT,
    p_is_enrolled BOOLEAN,
    p_grad_year INT,
    p_grade INT,
    p_class_no INT,
    p_seq_no INT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_email TEXT;
BEGIN
    v_email := 'student_' || p_student_code || '@ggomrecommend.ggomcode';
    
    -- 이미 존재하는 경우 업데이트
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
        UPDATE auth.users 
        SET encrypted_password = crypt(p_password, gen_salt('bf')),
            raw_user_meta_data = jsonb_build_object(
                'role', 'student',
                'name', p_name,
                'phone_last4', p_phone_last4,
                'student_code', p_student_code,
                'is_enrolled', p_is_enrolled,
                'grad_year', p_grad_year,
                'grade', p_grade,
                'class_no', p_class_no,
                'seq_no', p_seq_no,
                'status', 'approved'
            ),
            updated_at = now()
        WHERE email = v_email;
        
        -- profiles 테이블 상태를 approved로 자동 갱신
        UPDATE public.profiles
        SET name = p_name,
            phone_last4 = p_phone_last4,
            status = 'approved',
            is_enrolled = p_is_enrolled,
            grad_year = p_grad_year,
            grade = p_grade,
            class_no = p_class_no,
            seq_no = p_seq_no
        WHERE student_code = p_student_code;

        RETURN TRUE;
    END IF;
    
    v_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        role,
        aud,
        confirmation_token
    ) VALUES (
        v_user_id,
        '00000000-0000-0000-0000-000000000000',
        v_email,
        crypt(p_password, gen_salt('bf')),
        now(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        jsonb_build_object(
            'role', 'student',
            'name', p_name,
            'phone_last4', p_phone_last4,
            'student_code', p_student_code,
            'is_enrolled', p_is_enrolled,
            'grad_year', p_grad_year,
            'grade', p_grade,
            'class_no', p_class_no,
            'seq_no', p_seq_no,
            'status', 'approved'
        ),
        now(),
        now(),
        'authenticated',
        'authenticated',
        ''
    );
    
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        v_user_id,
        jsonb_build_object('sub', v_user_id, 'email', v_email),
        'email',
        v_email,
        now(),
        now(),
        now()
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth;

-- profiles 삭제 시 auth.users 자동 삭제 트리거
CREATE OR REPLACE FUNCTION public.handle_deleted_user()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM auth.users WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_deleted ON public.profiles;
CREATE TRIGGER on_profile_deleted
  AFTER DELETE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_deleted_user();

-- 선도 처분 학생 등록/삭제 시 자동 프로필 및 지원서 배제 업데이트 트리거
CREATE OR REPLACE FUNCTION public.handle_disciplinary_student_change()
RETURNS TRIGGER AS $$
DECLARE
    v_student_id UUID;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- 프로필 업데이트
        UPDATE public.profiles
        SET has_disciplinary = TRUE
        WHERE student_code = NEW.student_code;

        -- 학생 ID 조회
        SELECT id INTO v_student_id FROM public.profiles WHERE student_code = NEW.student_code;
        
        -- 관련 지원서 자동 배제 처리
        IF v_student_id IS NOT NULL THEN
            UPDATE public.applications
            SET is_excluded = TRUE,
                excluded_reason = '선도 처분 대상자 자동 배제 (교내봉사 이상)'
            WHERE student_id = v_student_id;
        END IF;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- 프로필 업데이트
        UPDATE public.profiles
        SET has_disciplinary = FALSE
        WHERE student_code = OLD.student_code;

        -- 학생 ID 조회
        SELECT id INTO v_student_id FROM public.profiles WHERE student_code = OLD.student_code;
        
        -- 관련 지원서 자동 배제 해제
        IF v_student_id IS NOT NULL THEN
            UPDATE public.applications
            SET is_excluded = FALSE,
                excluded_reason = NULL
            WHERE student_id = v_student_id AND excluded_reason LIKE '선도 처분 대상자 자동 배제%';
        END IF;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_disciplinary_student_change ON public.disciplinary_students;
CREATE TRIGGER on_disciplinary_student_change
  AFTER INSERT OR DELETE ON public.disciplinary_students
  FOR EACH ROW EXECUTE PROCEDURE public.handle_disciplinary_student_change();

-- 8. 통합 교사 계정 생성/비밀번호 변경 RPC 함수
CREATE OR REPLACE FUNCTION public.create_unified_teacher_account(p_password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_email TEXT := 'teacher@ggomrecommend.ggomcode';
BEGIN
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
        UPDATE auth.users 
        SET encrypted_password = crypt(p_password, gen_salt('bf')),
            raw_user_meta_data = jsonb_build_object(
                'role', 'teacher',
                'name', '담임교사'
            ),
            updated_at = now()
        WHERE email = v_email;
        RETURN TRUE;
    END IF;
    
    v_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change
    ) VALUES (
        v_user_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(p_password, gen_salt('bf')),
        now(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        jsonb_build_object(
            'role', 'teacher',
            'name', '담임교사'
        ),
        now(),
        now(),
        '',
        '',
        '',
        ''
    );

    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        v_user_id,
        jsonb_build_object('sub', v_user_id, 'email', v_email),
        'email',
        v_email,
        now(),
        now(),
        now()
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth;

-- 9. PROFILES 및 CONFIG 테이블 RLS 접근 정책
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone approved can view profiles" ON public.profiles;
CREATE POLICY "Anyone approved can view profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view config" ON public.config;
CREATE POLICY "Anyone can view config" ON public.config FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can modify config" ON public.config;
CREATE POLICY "Anyone can modify config" ON public.config FOR ALL USING (true);

-- 10. 가입코드 검증 RPC 함수
CREATE OR REPLACE FUNCTION public.check_registration_code(input_code text)
RETURNS boolean AS $$
DECLARE
    v_target text;
BEGIN
    SELECT value INTO v_target FROM public.config WHERE key = 'registration_code';
    IF v_target IS NULL THEN
        v_target := '17835';
    END IF;
    RETURN (trim(input_code) = trim(v_target));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. AUDIT_LOGS 테이블 RLS 설정
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert audit_logs" ON public.audit_logs;
CREATE POLICY "Anyone can insert audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can select audit_logs" ON public.audit_logs;
CREATE POLICY "Anyone can select audit_logs" ON public.audit_logs FOR SELECT USING (true);

-- 12. PROFILES 테이블 반려 사유 컬럼 자동 추가
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 13. REGIONAL_RECOMMENDATIONS (수도권 학교장추천전형 테이블 및 RLS 설정)
CREATE TABLE IF NOT EXISTS public.regional_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seq_no INT NOT NULL,
    region TEXT,
    univ_name TEXT NOT NULL,
    recruitment_quota TEXT,
    track_name TEXT NOT NULL,
    quota_limit TEXT,
    target_students TEXT,
    grad_condition TEXT,
    csat_min TEXT,
    evaluation_method TEXT,
    reflected_subjects TEXT,
    reflected_indicators TEXT,
    course_unit_reflection TEXT,
    grade_ratio TEXT,
    grad_semesters TEXT,
    career_elective_method TEXT,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. 전체 주요 테이블 RLS 통합 정책 (승인, 반려, 계정 삭제, 지원서 관리 권한 부여)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone approved can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can select profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can modify profiles" ON public.profiles;
CREATE POLICY "Anyone can select profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Anyone can modify profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can select applications" ON public.applications;
DROP POLICY IF EXISTS "Anyone can modify applications" ON public.applications;
CREATE POLICY "Anyone can select applications" ON public.applications FOR SELECT USING (true);
CREATE POLICY "Anyone can modify applications" ON public.applications FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can select universities" ON public.universities;
DROP POLICY IF EXISTS "Anyone can modify universities" ON public.universities;
CREATE POLICY "Anyone can select universities" ON public.universities FOR SELECT USING (true);
CREATE POLICY "Anyone can modify universities" ON public.universities FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.regional_recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can select regional_recommendations" ON public.regional_recommendations;
DROP POLICY IF EXISTS "Anyone can modify regional_recommendations" ON public.regional_recommendations;
CREATE POLICY "Anyone can select regional_recommendations" ON public.regional_recommendations FOR SELECT USING (true);
CREATE POLICY "Anyone can modify regional_recommendations" ON public.regional_recommendations FOR ALL USING (true) WITH CHECK (true);

-- 15. ENROLLED_STUDENTS (단일 통합 학생 원장 마스터 테이블 - 재학생/졸업생/회원가입/로그인 통합)
CREATE TABLE IF NOT EXISTS public.enrolled_students (
    -- [1] 기본 식별 정보
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_code TEXT UNIQUE, -- 학번 (예: 30105 또는 졸업생 식별 학번)
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Auth 계정 연동 ID

    -- [2] 학생 기본 인적 사항
    name TEXT NOT NULL, -- 학생 이름 (AES-256 암호화)
    name_hash TEXT, -- 학생 이름 SHA-256 해시
    gender TEXT, -- 성별 ('남', '여')
    student_phone_hash TEXT, -- 학생 전화번호 SHA-256 해시 (로그인 비밀번호 용도)

    -- [3] 학적 정보
    is_enrolled BOOLEAN NOT NULL DEFAULT TRUE, -- 재학생 여부 (true: 재학생, false: 졸업생)
    grade INT, -- 학년 (재학생 필수)
    class_no INT, -- 반 (재학생 필수)
    student_no INT, -- 번호 (재학생 필수)
    seq_no INT, -- 순번
    grad_year INT, -- 졸업연도 (졸업생 필수)

    -- [4] 학부모 정보
    parent_name_hash TEXT, -- 학부모 이름 (AES-256 암호화)
    parent_phone_hash TEXT, -- 학부모 전화번호 SHA-256 해시

    -- [5] 가입 승인 및 추천전형 정보
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    is_rural_eligible BOOLEAN NOT NULL DEFAULT FALSE, -- 농어촌 전형 자격 대상 여부
    has_disciplinary BOOLEAN NOT NULL DEFAULT FALSE, -- 선도처분 여부
    rejection_reason TEXT, -- 가입 거절 사유
    remarks TEXT, -- 비고

    -- [6] 학년/학기별/전학년 석차등급 내신 성적 컬럼
    gpa_1_1 TEXT, -- 1학년 1학기 석차등급
    gpa_1_2 TEXT, -- 1학년 2학기 석차등급
    gpa_1_all TEXT, -- 1학년 전학기 석차등급
    gpa_2_1 TEXT, -- 2학년 1학기 석차등급
    gpa_2_2 TEXT, -- 2학년 2학기 석차등급
    gpa_2_all TEXT, -- 2학년 전학기 석차등급
    gpa_3_1 TEXT, -- 3학년 1학기 석차등급
    gpa_3_2 TEXT, -- 3학년 2학기 석차등급
    gpa_3_all TEXT, -- 3학년 전학기 석차등급
    gpa_overall NUMERIC, -- 전학년 석차등급 (대표 평균 내신)

    -- [7] 추천 희망 및 농어촌 유형 선택 컬럼
    apply_school_recommend BOOLEAN NOT NULL DEFAULT TRUE,
    apply_rural BOOLEAN NOT NULL DEFAULT FALSE,
    rural_type TEXT,
    rural_self_check BOOLEAN NOT NULL DEFAULT FALSE,

    -- [8] 생성 일시
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 재학생 학년/반/번호 중복 방지 유니크 인덱스 (재학생 기준)
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrolled_students_grade_class_no 
ON public.enrolled_students (grade, class_no, student_no) 
WHERE is_enrolled = TRUE AND grade IS NOT NULL AND class_no IS NOT NULL AND student_no IS NOT NULL;

-- 학번 조회용 인덱스
CREATE INDEX IF NOT EXISTS idx_enrolled_students_code ON public.enrolled_students (student_code);

ALTER TABLE public.enrolled_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can select enrolled_students" ON public.enrolled_students;
CREATE POLICY "Anyone can select enrolled_students" ON public.enrolled_students FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can modify enrolled_students" ON public.enrolled_students;
CREATE POLICY "Anyone can modify enrolled_students" ON public.enrolled_students FOR ALL USING (true) WITH CHECK (true);

-- 16. APPLICATIONS 테이블 학부모 서명 컬럼 추가
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS parent_signature_url TEXT;

-- 17. SUPABASE STORAGE 버킷 (signatures, documents, rural_signatures) 생성 및 RLS 정책 설정
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('signatures', 'signatures', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('documents', 'documents', true, 52428800, ARRAY['application/pdf', 'image/png', 'image/jpeg'])
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('rural_signatures', 'rural_signatures', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- signatures 버킷 정책
DROP POLICY IF EXISTS "Anyone can select signatures" ON storage.objects;
CREATE POLICY "Anyone can select signatures" ON storage.objects FOR SELECT USING (bucket_id = 'signatures');
DROP POLICY IF EXISTS "Anyone can insert signatures" ON storage.objects;
CREATE POLICY "Anyone can insert signatures" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'signatures');
DROP POLICY IF EXISTS "Anyone can update signatures" ON storage.objects;
CREATE POLICY "Anyone can update signatures" ON storage.objects FOR UPDATE USING (bucket_id = 'signatures') WITH CHECK (bucket_id = 'signatures');
DROP POLICY IF EXISTS "Anyone can delete signatures" ON storage.objects;
CREATE POLICY "Anyone can delete signatures" ON storage.objects FOR DELETE USING (bucket_id = 'signatures');

-- documents 버킷 정책
DROP POLICY IF EXISTS "Anyone can select documents" ON storage.objects;
CREATE POLICY "Anyone can select documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
DROP POLICY IF EXISTS "Anyone can insert documents" ON storage.objects;
CREATE POLICY "Anyone can insert documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents');
DROP POLICY IF EXISTS "Anyone can update documents" ON storage.objects;
CREATE POLICY "Anyone can update documents" ON storage.objects FOR UPDATE USING (bucket_id = 'documents') WITH CHECK (bucket_id = 'documents');
DROP POLICY IF EXISTS "Anyone can delete documents" ON storage.objects;
CREATE POLICY "Anyone can delete documents" ON storage.objects FOR DELETE USING (bucket_id = 'documents');

-- rural_signatures 버킷 정책
DROP POLICY IF EXISTS "Anyone can select rural_signatures" ON storage.objects;
CREATE POLICY "Anyone can select rural_signatures" ON storage.objects FOR SELECT USING (bucket_id = 'rural_signatures');
DROP POLICY IF EXISTS "Anyone can insert rural_signatures" ON storage.objects;
CREATE POLICY "Anyone can insert rural_signatures" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'rural_signatures');
DROP POLICY IF EXISTS "Anyone can update rural_signatures" ON storage.objects;
CREATE POLICY "Anyone can update rural_signatures" ON storage.objects FOR UPDATE USING (bucket_id = 'rural_signatures') WITH CHECK (bucket_id = 'rural_signatures');
DROP POLICY IF EXISTS "Anyone can delete rural_signatures" ON storage.objects;
CREATE POLICY "Anyone can delete rural_signatures" ON storage.objects FOR DELETE USING (bucket_id = 'rural_signatures');

-- 18. 기타 주요 테이블 RLS 통합 정책 설정 (config, timeline_rounds, disciplinary_students, audit_logs)
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can select config" ON public.config;
CREATE POLICY "Anyone can select config" ON public.config FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can modify config" ON public.config;
CREATE POLICY "Anyone can modify config" ON public.config FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.timeline_rounds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can select timeline_rounds" ON public.timeline_rounds;
CREATE POLICY "Anyone can select timeline_rounds" ON public.timeline_rounds FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can modify timeline_rounds" ON public.timeline_rounds;
CREATE POLICY "Anyone can modify timeline_rounds" ON public.timeline_rounds FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.disciplinary_students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can select disciplinary_students" ON public.disciplinary_students;
CREATE POLICY "Anyone can select disciplinary_students" ON public.disciplinary_students FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can modify disciplinary_students" ON public.disciplinary_students;
CREATE POLICY "Anyone can modify disciplinary_students" ON public.disciplinary_students FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can select audit_logs" ON public.audit_logs;
CREATE POLICY "Anyone can select audit_logs" ON public.audit_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can modify audit_logs" ON public.audit_logs;
CREATE POLICY "Anyone can modify audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

-- ================================================================
-- 19. 농어촌 특별전형 추천자 관리 시스템 스키마 & RLS
-- ================================================================

-- 1. RURAL_SCHOOL_CACHE (학교알리미 API 캐시 테이블)
CREATE TABLE IF NOT EXISTS public.rural_school_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_name TEXT UNIQUE NOT NULL,       -- 학교명 (예: '포곡중학교')
    school_kind TEXT,                       -- 학교급 ('03': 중, '04': 고)
    bjd_code TEXT,                          -- 법정동코드 (ADRCD_ID)
    address TEXT,                           -- 기본주소 (ADRES_BRKDN)
    detail_address TEXT,                    -- 상세주소 (DTLAD_BRKDN)
    road_address TEXT,                      -- 도로명주소 (SCHUL_RDNMA)
    is_rural BOOLEAN NOT NULL DEFAULT FALSE,-- 읍/면 지역 여부 (주소에 '읍'/'면' 포함 시 TRUE)
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. STUDENT_RURAL_ADDRESSES (학생 주소 이력 테이블 - 인적사항_주소 엑셀 파싱 결과)
CREATE TABLE IF NOT EXISTS public.student_rural_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,               -- enrolled_students 및 profiles 통합 참조 ID
    class_no INT NOT NULL,                  -- 반
    seq_no INT NOT NULL,                    -- 번호
    student_name TEXT NOT NULL,             -- 학생 이름
    raw_address_text TEXT NOT NULL,         -- 엑셀 E열 원본 주소 텍스트
    parsed_addresses JSONB NOT NULL DEFAULT '[]'::jsonb, -- 파싱된 분리 주소 목록
    has_rural_address BOOLEAN NOT NULL DEFAULT FALSE,   -- 읍/면/리 주소 포함 여부
    notes TEXT,                             -- 주소 변동/이상 특이사항
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(student_id)
);

-- 3. STUDENT_ACADEMIC_RECORDS (학생 학적 변동 이력 테이블 - 학적사항 엑셀 파싱 결과)
CREATE TABLE IF NOT EXISTS public.student_academic_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,               -- enrolled_students 및 profiles 통합 참조 ID
    class_no INT NOT NULL,                  -- 반
    seq_no INT NOT NULL,                    -- 번호
    student_name TEXT NOT NULL,             -- 학생 이름
    seq_order INT NOT NULL DEFAULT 1,       -- 학적 기록 순서
    record_date DATE,                       -- 변동 날짜 (중학 졸업일, 고교 입학일, 전입일 등)
    change_type TEXT NOT NULL,              -- 변동 구획 (입학, 졸업, 전입, 전출 등)
    school_name TEXT,                       -- 추출된 학교명
    school_cache_id UUID REFERENCES public.rural_school_cache(id) ON DELETE SET NULL,
    raw_record_text TEXT,                   -- C/D열 원본 텍스트
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. STUDENT_RURAL_ELIGIBILITY (농어촌 전형 최종 판정 결과 테이블)
CREATE TABLE IF NOT EXISTS public.student_rural_eligibility (
    student_id UUID PRIMARY KEY,            -- enrolled_students 및 profiles 통합 참조 ID
    middle_school_years NUMERIC(3,1) DEFAULT 0.0, -- 읍면 중학교 재학 계산 기간 (년)
    high_school_years NUMERIC(3,1) DEFAULT 0.0,   -- 읍면 고등학교 재학 계산 기간 (년)
    total_rural_years NUMERIC(3,1) DEFAULT 0.0,   -- 총 읍면 학교 재학 기간 (년)
    address_rural_valid BOOLEAN DEFAULT FALSE,    -- 읍면 주소 거주 요건 만족 여부
    is_type1_eligible BOOLEAN DEFAULT FALSE,      -- 유형 I (6년) 자격 여부
    is_type2_eligible BOOLEAN DEFAULT FALSE,      -- 유형 II (12년) 자격 여부
    is_eligible BOOLEAN NOT NULL DEFAULT FALSE,   -- 자동 판정 최종 농어촌 자격 여부 (6년 이상 & 주소 만족)
    is_manual_approved BOOLEAN NOT NULL DEFAULT FALSE, -- 교사/관리자 수동 인정 여부
    manual_reason TEXT,                           -- 수동 인정/소명 사유
    evaluation_notes TEXT,                        -- 자동 검증 상세 리포트
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_academic_student ON public.student_academic_records(student_id);
CREATE INDEX IF NOT EXISTS idx_rural_address_student ON public.student_rural_addresses(student_id);

-- RLS 활성화
ALTER TABLE public.rural_school_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_rural_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_rural_eligibility ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- RLS 정책 설정
-- ----------------------------------------------------------------

DROP POLICY IF EXISTS "Anyone authenticated can view school cache" ON public.rural_school_cache;
DROP POLICY IF EXISTS "Teachers/Admins can manage school cache" ON public.rural_school_cache;
DROP POLICY IF EXISTS "Anyone can select rural_school_cache" ON public.rural_school_cache;
DROP POLICY IF EXISTS "Anyone can modify rural_school_cache" ON public.rural_school_cache;
CREATE POLICY "Anyone can select rural_school_cache" ON public.rural_school_cache FOR SELECT USING (true);
CREATE POLICY "Anyone can modify rural_school_cache" ON public.rural_school_cache FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Teachers/Admins can manage rural addresses" ON public.student_rural_addresses;
DROP POLICY IF EXISTS "Students can view own rural addresses" ON public.student_rural_addresses;
DROP POLICY IF EXISTS "Anyone can select student_rural_addresses" ON public.student_rural_addresses;
DROP POLICY IF EXISTS "Anyone can modify student_rural_addresses" ON public.student_rural_addresses;
CREATE POLICY "Anyone can select student_rural_addresses" ON public.student_rural_addresses FOR SELECT USING (true);
CREATE POLICY "Anyone can modify student_rural_addresses" ON public.student_rural_addresses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Teachers/Admins can manage academic records" ON public.student_academic_records;
DROP POLICY IF EXISTS "Students can view own academic records" ON public.student_academic_records;
DROP POLICY IF EXISTS "Anyone can select student_academic_records" ON public.student_academic_records;
DROP POLICY IF EXISTS "Anyone can modify student_academic_records" ON public.student_academic_records;
CREATE POLICY "Anyone can select student_academic_records" ON public.student_academic_records FOR SELECT USING (true);
CREATE POLICY "Anyone can modify student_academic_records" ON public.student_academic_records FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Teachers/Admins can manage rural eligibility" ON public.student_rural_eligibility;
DROP POLICY IF EXISTS "Students can view own rural eligibility" ON public.student_rural_eligibility;
DROP POLICY IF EXISTS "Anyone can select student_rural_eligibility" ON public.student_rural_eligibility;
DROP POLICY IF EXISTS "Anyone can modify student_rural_eligibility" ON public.student_rural_eligibility;
CREATE POLICY "Anyone can select student_rural_eligibility" ON public.student_rural_eligibility FOR SELECT USING (true);
CREATE POLICY "Anyone can modify student_rural_eligibility" ON public.student_rural_eligibility FOR ALL USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------
-- 16. RURAL_TRACKS (농어촌 및 기회균형 전형 정보 마스터 테이블)
-- ----------------------------------------------------------------
INSERT INTO config (key, value) VALUES ('jungsi_apply_start_date', '') ON CONFLICT (key) DO NOTHING;
INSERT INTO config (key, value) VALUES ('jungsi_apply_end_date', '') ON CONFLICT (key) DO NOTHING;
INSERT INTO config (key, value) VALUES ('enable_rural_system', 'false') ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.rural_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term_type TEXT NOT NULL CHECK (term_type IN ('수시', '정시')), -- A컬럼: 구분
    medical_type TEXT DEFAULT '없음',                             -- B컬럼: 메디컬 ('의','치','한','약','수','없음')
    region TEXT,                                                  -- C컬럼: 지역
    univ_name TEXT NOT NULL,                                      -- D컬럼: 대학 (지역 포함)
    track_type TEXT NOT NULL,                                     -- E컬럼: 전형 유형 ('교과', '종합', '가', '나', '다')
    track_name TEXT NOT NULL,                                     -- F컬럼: 전형명
    recruitment_quota TEXT,                                       -- G컬럼: 모집인원
    eval_method TEXT,                                             -- H컬럼: 전형방법
    suneung_minimum TEXT,                                         -- I컬럼: 수능최저
    remarks TEXT,                                                 -- J컬럼: 비고 (기회균형 구분 또는 기타)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rural_tracks_term_univ ON public.rural_tracks(term_type, univ_name);

ALTER TABLE public.rural_tracks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can view rural tracks" ON public.rural_tracks;
DROP POLICY IF EXISTS "Teachers/Admins can manage rural tracks" ON public.rural_tracks;
DROP POLICY IF EXISTS "Anyone can select rural_tracks" ON public.rural_tracks;
DROP POLICY IF EXISTS "Anyone can modify rural_tracks" ON public.rural_tracks;
CREATE POLICY "Anyone can select rural_tracks" ON public.rural_tracks FOR SELECT USING (true);
CREATE POLICY "Anyone can modify rural_tracks" ON public.rural_tracks FOR ALL USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------
-- 17. STUDENT_RURAL_ELIGIBILITY 확장 (유형 I/II 및 보류/사유 컬럼 추가)
-- ----------------------------------------------------------------
ALTER TABLE public.student_rural_eligibility ADD COLUMN IF NOT EXISTS rural_type TEXT DEFAULT 'TYPE_1';
ALTER TABLE public.student_rural_eligibility ADD COLUMN IF NOT EXISTS warning_status TEXT DEFAULT 'OK';
ALTER TABLE public.student_rural_eligibility ADD COLUMN IF NOT EXISTS ineligible_reason TEXT;

-- ----------------------------------------------------------------
-- 18. RURAL_APPLICATIONS (학생 농어촌 전형 신청 및 서명 테이블)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rural_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,               -- enrolled_students / profiles 통합 ID 참조
    choice_number INT NOT NULL CHECK (choice_number BETWEEN 1 AND 6), -- 지망 순번 (1 ~ 6)
    
    -- 전형 선택 및 직접 입력 학과 정보
    track_id UUID REFERENCES public.rural_tracks(id) ON DELETE SET NULL,
    term_type TEXT NOT NULL,                -- 구분 ('수시', '정시')
    medical_type TEXT DEFAULT '없음',       -- 메디컬 여부
    region TEXT,                            -- 지역
    univ_name TEXT NOT NULL,                -- 대학명
    department TEXT NOT NULL,               -- 학과 (학생 입력)
    track_type TEXT NOT NULL,               -- 전형 유형 ('교과', '종합', '가', '나', '다')
    track_name TEXT NOT NULL,               -- 전형명
    recruitment_quota TEXT,                 -- 모집인원
    eval_method TEXT,                       -- 전형방법
    suneung_minimum TEXT,                   -- 수능최저
    remarks TEXT,                           -- 비고
    
    -- 자격 경고 인지 및 서명 정보
    is_warning_acknowledged BOOLEAN NOT NULL DEFAULT FALSE, -- 자격 경고 확인 및 신청 강행 여부
    student_signature TEXT,                 -- 학생 서명 (Base64/DataURL)
    parent_signature TEXT,                  -- 학부모 서명 (Base64/DataURL)
    signed_at TIMESTAMP WITH TIME ZONE,     -- 서명 제출 일시
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'teacher_edited', 'approved', 'rejected')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    UNIQUE(student_id, choice_number)
);

CREATE INDEX IF NOT EXISTS idx_rural_applications_student ON public.rural_applications(student_id);

ALTER TABLE public.rural_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own rural applications" ON public.rural_applications;
DROP POLICY IF EXISTS "Students can manage own rural applications" ON public.rural_applications;
DROP POLICY IF EXISTS "Teachers/Admins can manage all rural applications" ON public.rural_applications;
DROP POLICY IF EXISTS "Anyone can select rural_applications" ON public.rural_applications;
DROP POLICY IF EXISTS "Anyone can modify rural_applications" ON public.rural_applications;
CREATE POLICY "Anyone can select rural_applications" ON public.rural_applications FOR SELECT USING (true);
CREATE POLICY "Anyone can modify rural_applications" ON public.rural_applications FOR ALL USING (true) WITH CHECK (true);




-- ----------------------------------------------------------------
-- 19. RURAL_SIGNATURES (농어촌 전형 서명 관리 테이블)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rural_signatures (
    student_id UUID PRIMARY KEY,
    student_signature TEXT,
    parent_signature TEXT,
    parent_name TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.rural_signatures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access to rural_signatures" ON public.rural_signatures;
CREATE POLICY "Enable all access to rural_signatures" ON public.rural_signatures FOR ALL USING (true) WITH CHECK (true);

-- 20. config 테이블 RLS 통합 정책 및 기본 키 설정
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view config" ON public.config;
DROP POLICY IF EXISTS "Anyone can select config" ON public.config;
DROP POLICY IF EXISTS "Anyone can modify config" ON public.config;
DROP POLICY IF EXISTS "Enable all access to config" ON public.config;

CREATE POLICY "Enable all access to config" 
ON public.config 
FOR ALL 
TO public
USING (true) 
WITH CHECK (true);

GRANT ALL ON TABLE public.config TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 21. ENROLLED_STUDENTS & STUDENT_RURAL_ELIGIBILITY RLS 통합 정책 (학생 회원가입 anon 권한 보장)
ALTER TABLE public.enrolled_students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access to enrolled_students" ON public.enrolled_students;
CREATE POLICY "Enable all access to enrolled_students" ON public.enrolled_students FOR ALL TO public USING (true) WITH CHECK (true);
GRANT ALL ON TABLE public.enrolled_students TO anon, authenticated, service_role;

ALTER TABLE public.student_rural_eligibility ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access to student_rural_eligibility" ON public.student_rural_eligibility;
CREATE POLICY "Enable all access to student_rural_eligibility" ON public.student_rural_eligibility FOR ALL TO public USING (true) WITH CHECK (true);
GRANT ALL ON TABLE public.student_rural_eligibility TO anon, authenticated, service_role;

-- ================================================================
-- 22. CSAT_REGISTRATION_RECORDS (대학수학능력시험 공식 응시원서 접수대장 원장)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.csat_registration_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_batch_time TIMESTAMP WITH TIME ZONE NOT NULL,          -- PDF 1페이지 좌측 하단 저장 일시 (예: 2026-08-31 11:33:00)
    seq_no INT,                                                   -- 일련번호 (1 ~ 217)
    receipt_no TEXT UNIQUE,                                       -- 접수번호 (6자리 고유 번호)
    name TEXT NOT NULL,                                           -- 성명 (AES-256-GCM 가역 암호화)
    name_hash TEXT,                                               -- 성명 SHA-256 해시 (대조 및 검색용)
    resident_no TEXT NOT NULL,                                    -- 주민등록번호 (AES-256-GCM 가역 암호화)
    resident_no_hash TEXT,                                        -- 주민등록번호 SHA-256 해시
    gender TEXT,                                                  -- 성별 ('남자', '여자')
    class_or_grad_year INT NOT NULL,                              -- 반(년): 재학생은 학급(1~11), 졸업생은 졸업연도(2026, 2025 등 1000 이상)
    student_no INT,                                               -- 번호 (재학생 출석번호, 졸업생은 null)
    student_code TEXT,                                            -- 재학생 자동 매칭 학번 (예: 30124, 30624)
    is_enrolled BOOLEAN NOT NULL DEFAULT TRUE,                    -- 재학생 여부 (class_or_grad_year < 1000)
    subject_korean TEXT,                                          -- 국어 ('화법과 작문', '언어와 매체', 'X')
    subject_math TEXT,                                            -- 수학 ('확률과 통계', '미적분', '기하', 'X')
    subject_english TEXT,                                         -- 영어 ('O', 'X')
    subject_history TEXT,                                         -- 한국사 ('O', 'X')
    inquiry_type TEXT,                                            -- 탐구 유형 ('사회탐구', '과학탐구', '사회·과학탐구', '직업탐구', '사회·직업탐구', '과학·직업탐구', 'X')
    inquiry_subjects TEXT,                                        -- 탐구 선택과목 (예: '생활과 윤리 / 세계사', '사회·문화 / X', 'X / X')
    foreign_language TEXT,                                        -- 제2외국어/한문 ('X', '일본어I', '한문I' 등)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_csat_records_batch_time ON public.csat_registration_records(upload_batch_time);
CREATE INDEX IF NOT EXISTS idx_csat_records_code ON public.csat_registration_records(student_code);
CREATE INDEX IF NOT EXISTS idx_csat_records_class ON public.csat_registration_records(class_or_grad_year, student_no);

ALTER TABLE public.csat_registration_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access to csat_registration_records" ON public.csat_registration_records;
CREATE POLICY "Enable all access to csat_registration_records" ON public.csat_registration_records FOR ALL TO public USING (true) WITH CHECK (true);
GRANT ALL ON TABLE public.csat_registration_records TO anon, authenticated, service_role;


-- ================================================================
-- 23. STUDENT_INTENT_SURVEYS (학생 수능 미응시 및 수시/정시 원서 미접수 자가 조사 원장)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.student_intent_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.enrolled_students(id) ON DELETE CASCADE,
    student_code TEXT NOT NULL UNIQUE,                            -- 학번 (예: 30105)
    
    -- 1) 수능 응시 여부 조사
    csat_intent TEXT NOT NULL DEFAULT 'TAKE' CHECK (csat_intent IN ('TAKE', 'NO_TAKE')), -- 수능 응시('TAKE') / 미응시('NO_TAKE')
    csat_no_take_reason TEXT,                                     -- 수능 미응시 사유 (취업 준비, 군입대, 해외유학, 수시집중 등)
    
    -- 2) (일반대/과기원) 수시 접수 여부
    susi_general_intent TEXT NOT NULL DEFAULT 'APPLY' CHECK (susi_general_intent IN ('APPLY', 'NO_APPLY')),
    susi_general_no_reason TEXT,
    
    -- 3) (일반대/과기원) 정시 접수 여부
    jungsi_general_intent TEXT NOT NULL DEFAULT 'APPLY' CHECK (jungsi_general_intent IN ('APPLY', 'NO_APPLY')),
    jungsi_general_no_reason TEXT,
    
    -- 4) (전문대) 수시 접수 여부
    susi_college_intent TEXT NOT NULL DEFAULT 'APPLY' CHECK (susi_college_intent IN ('APPLY', 'NO_APPLY')),
    susi_college_no_reason TEXT,
    
    -- 5) (전문대) 정시 접수 여부
    jungsi_college_intent TEXT NOT NULL DEFAULT 'APPLY' CHECK (jungsi_college_intent IN ('APPLY', 'NO_APPLY')),
    jungsi_college_no_reason TEXT,
    
    -- 레거시 호환 컬럼
    susi_intent TEXT DEFAULT 'APPLY',
    susi_no_apply_reason TEXT,
    jungsi_intent TEXT DEFAULT 'APPLY',
    jungsi_no_reason TEXT,
    
    -- 전자서명 및 확인 정보
    student_signature TEXT,                                       -- 학생 모바일/PC 전자서명 (Base64 Data URL)
    parent_signature TEXT,                                        -- 학부모 모바일/PC 전자서명 (Base64 Data URL)
    parent_name TEXT,                                             -- 학부모 성명
    is_form_submitted BOOLEAN NOT NULL DEFAULT FALSE,             -- 실물 확인서 담임 제출 완료 여부
    confirmed_at TIMESTAMP WITH TIME ZONE,                        -- 학생 최초 등록 완료 일시
    
    -- 수정 감사 로그 (Audit History)
    change_logs JSONB DEFAULT '[]'::jsonb,                        -- 수정 변경 내역 이력 로그 배열
    history_count INT DEFAULT 0,                                  -- 총 수정 횟수
    last_modified_by TEXT,                                        -- 최종 수정자 성명
    last_modified_at TIMESTAMP WITH TIME ZONE,                    -- 최종 수정 일시
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_intent_surveys_student_id ON public.student_intent_surveys(student_id);
CREATE INDEX IF NOT EXISTS idx_intent_surveys_csat_intent ON public.student_intent_surveys(csat_intent);
CREATE INDEX IF NOT EXISTS idx_intent_surveys_susi_gen ON public.student_intent_surveys(susi_general_intent);
CREATE INDEX IF NOT EXISTS idx_intent_surveys_jung_gen ON public.student_intent_surveys(jungsi_general_intent);

ALTER TABLE public.student_intent_surveys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access to student_intent_surveys" ON public.student_intent_surveys;
CREATE POLICY "Enable all access to student_intent_surveys" ON public.student_intent_surveys FOR ALL TO public USING (true) WITH CHECK (true);
GRANT ALL ON TABLE public.student_intent_surveys TO anon, authenticated, service_role;

-- ================================================================
-- 24. STUDENT_INTENT_HISTORY (학생 의향 조사 수정 개별 로그 아카이브 테이블)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.student_intent_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_code TEXT NOT NULL,
    actor_name TEXT NOT NULL DEFAULT '학생 본인',
    actor_role TEXT NOT NULL DEFAULT 'student',
    changes JSONB NOT NULL DEFAULT '[]'::jsonb,
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_intent_history_code ON public.student_intent_history(student_code);

ALTER TABLE public.student_intent_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access to student_intent_history" ON public.student_intent_history;
CREATE POLICY "Enable all access to student_intent_history" ON public.student_intent_history FOR ALL TO public USING (true) WITH CHECK (true);
GRANT ALL ON TABLE public.student_intent_history TO anon, authenticated, service_role;


