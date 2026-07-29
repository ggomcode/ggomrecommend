-- ================================================================
-- 2027학년도 학교장 추천전형 선발 관리 시스템
-- Supabase PostgreSQL 스키마 스크립트
-- ================================================================

-- 1. CONFIG (시스템 설정 테이블)
CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- 초기 설정 데이터 삽입
INSERT INTO config (key, value) VALUES ('registration_code', 'school2026!') ON CONFLICT (key) DO NOTHING;
INSERT INTO config (key, value) VALUES ('openai_api_key', '') ON CONFLICT (key) DO NOTHING;

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
-- round: 1, 2, 3 (각 신청 차수)
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    univ_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    round INTEGER NOT NULL CHECK (round IN (1, 2, 3)),
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
    student_signature_url TEXT, -- 서명 이미지 Supabase Storage URL
    
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
    id INTEGER PRIMARY KEY CHECK (id IN (1, 2, 3)),
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
    has_disc BOOLEAN;
BEGIN
    -- user_metadata에서 가입 정보 추출
    role_val := COALESCE(new.raw_user_meta_data->>'role', 'student');
    name_val := COALESCE(new.raw_user_meta_data->>'name', '미입력');
    phone_last4_val := COALESCE(new.raw_user_meta_data->>'phone_last4', '');
    student_code_val := new.raw_user_meta_data->>'student_code';
    is_enrolled_val := COALESCE((new.raw_user_meta_data->>'is_enrolled')::boolean, TRUE);
    
    -- 관리자 이메일 강제 매핑 규칙 추가
    IF new.email = 'admin@ggomrecommend.ggomcode' THEN
        role_val := 'admin';
    END IF;
    
    IF new.raw_user_meta_data->>'grad_year' IS NOT NULL THEN
        grad_year_val := (new.raw_user_meta_data->>'grad_year')::integer;
    ELSE
        grad_year_val := NULL;
    END IF;

    IF new.raw_user_meta_data->>'grade' IS NOT NULL THEN
        grade_val := (new.raw_user_meta_data->>'grade')::integer;
    ELSE
        grade_val := NULL;
    END IF;

    IF new.raw_user_meta_data->>'class_no' IS NOT NULL THEN
        class_no_val := (new.raw_user_meta_data->>'class_no')::integer;
    ELSE
        class_no_val := NULL;
    END IF;

    IF new.raw_user_meta_data->>'seq_no' IS NOT NULL THEN
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

    -- 선도 처분 명단 대조
    IF student_code_val IS NOT NULL THEN
        SELECT EXISTS(SELECT 1 FROM disciplinary_students WHERE student_code = student_code_val) INTO has_disc;
    ELSE
        has_disc := FALSE;
    END IF;

    INSERT INTO public.profiles (id, student_code, name, phone_last4, role, status, is_enrolled, grad_year, grade, class_no, seq_no, has_disciplinary)
    VALUES (new.id, student_code_val, name_val, phone_last4_val, role_val, status_val, is_enrolled_val, grad_year_val, grade_val, class_no_val, seq_no_val, has_disc);
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
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        v_user_id,
        jsonb_build_object('sub', v_user_id, 'email', v_email),
        'email',
        now(),
        now(),
        now()
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        v_user_id,
        jsonb_build_object('sub', v_user_id, 'email', v_email),
        'email',
        now(),
        now(),
        now()
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
