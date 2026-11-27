-- ============================================================================
-- 포곡고 3학년 출결기록 (rollbook_records) Supabase 스키마 & 보안 RPC
-- 대상 프로젝트: jjcqhytsoexciupdfdjk
-- 실행 방법: Supabase Dashboard -> SQL Editor에 전체 붙여넣기 후 Run
-- ============================================================================

-- 1. 출결기록 테이블 생성 (기존 구글시트 '출결기록' A~K열 1:1 대응)
CREATE TABLE IF NOT EXISTS public.rollbook_records (
  record_key    TEXT PRIMARY KEY,               -- A열: 날짜_교시_학번 (예: 2026-11-27_1_30101 / 2026-11-27_사유_30101)
  record_date   TEXT NOT NULL,                  -- B열: YYYY-MM-DD
  period        TEXT NOT NULL DEFAULT '',       -- C열: 교시 ('조', '1'~'7', '종', '사유')
  student_id    TEXT NOT NULL DEFAULT '',       -- 학번 (30101 등)
  ban           TEXT NOT NULL DEFAULT '',       -- D열: 반
  num           TEXT NOT NULL DEFAULT '',       -- E열: 번호
  name          TEXT NOT NULL DEFAULT '',       -- F열: 이름
  room          TEXT NOT NULL DEFAULT '',       -- G열: 이동반교실
  status        TEXT NOT NULL DEFAULT '',       -- H열: 출결내용
  reason        TEXT NOT NULL DEFAULT '',       -- I열: 사유
  doc_submitted BOOLEAN NOT NULL DEFAULT FALSE, -- K열: 서류제출여부
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW() -- J열: 수정일시
);

-- 날짜 범위(학년도/월/주차) 조회 성능을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_rollbook_records_date
  ON public.rollbook_records (record_date);

-- 2. RLS 활성화 (직접 테이블 anon 접근은 차단하고 SECURITY DEFINER RPC를 통해서만 제어)
ALTER TABLE public.rollbook_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rollbook_records_auth_select" ON public.rollbook_records;
CREATE POLICY "rollbook_records_auth_select"
  ON public.rollbook_records
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'teacher')
    )
  );

DROP POLICY IF EXISTS "rollbook_records_auth_write" ON public.rollbook_records;
CREATE POLICY "rollbook_records_auth_write"
  ON public.rollbook_records
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'teacher')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'teacher')
    )
  );

-- 3. 내부 권한 검증 함수 (로그인 교사/관리자 OR 유효한 rollbook 시크릿 토큰)
CREATE OR REPLACE FUNCTION public._is_rollbook_authorized(p_secret_token TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sec_enabled  BOOLEAN;
  v_extra_config JSONB;
  v_clean_token  TEXT := COALESCE(TRIM(p_secret_token), '');
  v_now_ms       BIGINT := (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
BEGIN
  -- 1) Supabase 로그인 사용자 중 관리자 또는 교사 확인
  IF auth.uid() IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'teacher')
    ) THEN
      RETURN TRUE;
    END IF;
  END IF;

  -- 2) 비로그인(게스트) 학교 관리자 / 교과교사 시크릿 토큰 검증 (system_modules 테이블)
  IF v_clean_token = '' THEN
    RETURN FALSE;
  END IF;

  SELECT secret_access_enabled, extra_config
  INTO v_sec_enabled, v_extra_config
  FROM public.system_modules
  WHERE id = 'rollbook'
  LIMIT 1;

  IF v_extra_config IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 2-1) 학교 관리자용 시크릿 토큰 확인
  IF COALESCE(v_sec_enabled, (v_extra_config->>'secretAccessEnabled')::BOOLEAN, FALSE) = TRUE
     AND COALESCE(TRIM(v_extra_config->>'secretAccessToken'), '') = v_clean_token
     AND (
       NULLIF(TRIM(v_extra_config->>'secretAccessExpiresAt'), '') IS NULL
       OR (v_extra_config->>'secretAccessExpiresAt')::BIGINT > v_now_ms
     )
  THEN
    RETURN TRUE;
  END IF;

  -- 2-2) 교과교사용 시크릿 토큰 확인
  IF COALESCE((v_extra_config->>'teacherSecretAccessEnabled')::BOOLEAN, FALSE) = TRUE
     AND COALESCE(TRIM(v_extra_config->>'teacherSecretAccessToken'), '') = v_clean_token
     AND (
       NULLIF(TRIM(v_extra_config->>'teacherSecretAccessExpiresAt'), '') IS NULL
       OR (v_extra_config->>'teacherSecretAccessExpiresAt')::BIGINT > v_now_ms
     )
  THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- 4. 출결기록 기간 조회 RPC (Supabase .range() 페이징과 함께 사용하여 1,000행 제한 회피)
CREATE OR REPLACE FUNCTION public.get_rollbook_records(
  p_start_date   TEXT,
  p_end_date     TEXT,
  p_secret_token TEXT DEFAULT NULL
)
RETURNS TABLE (
  record_key    TEXT,
  record_date   TEXT,
  period        TEXT,
  student_id    TEXT,
  ban           TEXT,
  num           TEXT,
  name          TEXT,
  room          TEXT,
  status        TEXT,
  reason        TEXT,
  doc_submitted BOOLEAN,
  updated_at    TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_rollbook_authorized(p_secret_token) THEN
    RAISE EXCEPTION 'rollbook_unauthorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    r.record_key,
    r.record_date,
    r.period,
    r.student_id,
    r.ban,
    r.num,
    r.name,
    r.room,
    r.status,
    r.reason,
    r.doc_submitted,
    r.updated_at
  FROM public.rollbook_records r
  WHERE r.record_date >= p_start_date
    AND r.record_date <= p_end_date
  ORDER BY r.record_date ASC, r.record_key ASC;
END;
$$;

-- 5. 출결기록 일괄 저장/삭제 RPC (부분 업데이트로 동시성 충돌 방지)
CREATE OR REPLACE FUNCTION public.save_rollbook_records(
  p_records      JSONB,
  p_secret_token TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec           JSONB;
  v_key           TEXT;
  v_date          TEXT;
  v_period        TEXT;
  v_student_id    TEXT;
  v_status        TEXT;
  v_has_reason    BOOLEAN;
  v_reason        TEXT;
  v_has_doc       BOOLEAN;
  v_doc           BOOLEAN;
  v_action        TEXT;
  v_is_delete     BOOLEAN;
  v_upserted      INT := 0;
  v_deleted       INT := 0;
BEGIN
  IF NOT public._is_rollbook_authorized(p_secret_token) THEN
    RAISE EXCEPTION 'rollbook_unauthorized' USING ERRCODE = '42501';
  END IF;

  IF p_records IS NULL OR jsonb_typeof(p_records) <> 'array' THEN
    RETURN jsonb_build_object('status', 'success', 'upserted', 0, 'deleted', 0);
  END IF;

  FOR v_rec IN SELECT * FROM jsonb_array_elements(p_records)
  LOOP
    v_date       := COALESCE(TRIM(v_rec->>'date'), '');
    v_period     := COALESCE(TRIM(v_rec->>'period'), '');
    v_student_id := COALESCE(TRIM(v_rec->>'studentId'), '');
    v_key        := COALESCE(NULLIF(TRIM(v_rec->>'key'), ''), v_date || '_' || v_period || '_' || v_student_id);

    IF v_key = '' OR v_key = '__' THEN
      CONTINUE;
    END IF;

    v_status     := COALESCE(TRIM(v_rec->>'status'), '');
    v_action     := COALESCE(TRIM(v_rec->>'action'), '');
    v_has_reason := v_rec ? 'reason';
    v_reason     := CASE WHEN v_has_reason THEN COALESCE(TRIM(v_rec->>'reason'), '') ELSE '' END;
    v_has_doc    := (v_rec ? 'docSubmitted') AND (v_rec->'docSubmitted' IS NOT NULL) AND jsonb_typeof(v_rec->'docSubmitted') <> 'null';
    v_doc        := CASE WHEN v_has_doc THEN COALESCE((v_rec->>'docSubmitted')::BOOLEAN, FALSE) ELSE FALSE END;

    v_is_delete := (v_action = 'delete' AND v_reason = '')
                   OR ((v_status = '' OR v_status = '출석') AND v_reason = '' AND NOT v_has_doc);

    IF v_is_delete THEN
      DELETE FROM public.rollbook_records WHERE record_key = v_key;
      v_deleted := v_deleted + 1;
    ELSE
      INSERT INTO public.rollbook_records (
        record_key, record_date, period, student_id, ban, num, name, room,
        status, reason, doc_submitted, updated_at
      )
      VALUES (
        v_key,
        v_date,
        v_period,
        v_student_id,
        COALESCE(TRIM(v_rec->>'ban'), ''),
        COALESCE(TRIM(v_rec->>'num'), ''),
        COALESCE(TRIM(v_rec->>'name'), ''),
        COALESCE(TRIM(v_rec->>'room'), ''),
        CASE WHEN v_status = '출석' THEN '' ELSE v_status END,
        v_reason,
        v_doc,
        NOW()
      )
      ON CONFLICT (record_key) DO UPDATE SET
        record_date   = CASE WHEN EXCLUDED.record_date <> '' THEN EXCLUDED.record_date ELSE public.rollbook_records.record_date END,
        period        = CASE WHEN EXCLUDED.period <> '' THEN EXCLUDED.period ELSE public.rollbook_records.period END,
        student_id    = CASE WHEN EXCLUDED.student_id <> '' THEN EXCLUDED.student_id ELSE public.rollbook_records.student_id END,
        ban           = CASE WHEN EXCLUDED.ban <> '' THEN EXCLUDED.ban ELSE public.rollbook_records.ban END,
        num           = CASE WHEN EXCLUDED.num <> '' THEN EXCLUDED.num ELSE public.rollbook_records.num END,
        name          = CASE WHEN EXCLUDED.name <> '' THEN EXCLUDED.name ELSE public.rollbook_records.name END,
        room          = CASE WHEN v_rec ? 'room' THEN EXCLUDED.room ELSE public.rollbook_records.room END,
        status        = EXCLUDED.status,
        reason        = CASE WHEN v_has_reason THEN EXCLUDED.reason ELSE public.rollbook_records.reason END,
        doc_submitted = CASE WHEN v_has_doc THEN EXCLUDED.doc_submitted ELSE public.rollbook_records.doc_submitted END,
        updated_at    = NOW();

      v_upserted := v_upserted + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'status', 'success',
    'upserted', v_upserted,
    'deleted', v_deleted
  );
END;
$$;

-- RPC 실행 권한 부여 (내부에서 _is_rollbook_authorized로 교사/관리자 또는 시크릿 토큰을 엄격 검증)
REVOKE ALL ON FUNCTION public._is_rollbook_authorized(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_rollbook_records(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_rollbook_records(JSONB, TEXT) TO anon, authenticated;
