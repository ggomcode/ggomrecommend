/**
 * 수능 미응시자 및 수시 미접수 예정자 등록 시스템 API 모듈
 * - student_intent_surveys: 학생 자가 조사 CRUD
 * - csat_registration_records: PDF 파싱 데이터 암호화 upsert 및 대조
 */

import { supabase } from '../utils/supabaseClient'
import { encryptText, decryptText, hashText } from '../utils/cryptoUtils'

// ==========================================
// 시스템 활성화 여부 확인 (기본값: true - 명시적 'false'일 때만 비활성화)
// ==========================================
export async function checkExamIntentSystemEnabled() {
  const cached = localStorage.getItem('pcm_enable_exam_intent_system')
  let isEnabled = cached !== 'false'

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('config')
        .select('value')
        .eq('key', 'enable_exam_intent_system')
        .maybeSingle()

      if (!error) {
        if (data && data.value != null) {
          isEnabled = data.value !== 'false'
        } else {
          isEnabled = true
          try {
            await supabase.from('config').upsert({ key: 'enable_exam_intent_system', value: 'true' }, { onConflict: 'key' })
          } catch (e) {}
        }
        localStorage.setItem('pcm_enable_exam_intent_system', String(isEnabled))
      }
    } catch (e) {
      console.warn('Failed to check exam intent system config:', e)
    }
  }

  return isEnabled
}

// ==========================================
// 학생 의향 조사 (student_intent_surveys) CRUD
// ==========================================

/**
 * 현재 로그인 학생의 의향 조사 데이터 조회
 */
export async function getMyIntentSurvey(studentCode) {
  if (!supabase || !studentCode) return null
  const { data, error } = await supabase
    .from('student_intent_surveys')
    .select('*')
    .eq('student_code', studentCode)
    .maybeSingle()
  if (error) { console.warn('getMyIntentSurvey error:', error); return null }
  return data
}

/**
 * 학생 의향 조사 등록/수정 (upsert with Audit Log)
 */
export async function upsertIntentSurvey(payload, actor = { name: '학생 본인', role: 'student' }) {
  if (!supabase) throw new Error('DB 연결 없음')
  const {
    student_id,
    student_code,
    csat_intent,
    csat_no_take_reason,
    susi_general_intent,
    susi_general_no_reason,
    susi_college_intent,
    susi_college_no_reason,
    jungsi_intent,
    jungsi_no_reason,
    susi_intent,
    susi_no_apply_reason,
    student_signature,
    parent_signature,
    parent_name,
    memo
  } = payload

  const genIntent = susi_general_intent || susi_intent || 'APPLY'
  const genReason = genIntent === 'NO_APPLY' ? (susi_general_no_reason || susi_no_apply_reason || null) : null
  const colIntent = susi_college_intent || 'APPLY'
  const colReason = colIntent === 'NO_APPLY' ? (susi_college_no_reason || null) : null
  const jungIntent = jungsi_intent || 'APPLY'
  const jungReason = jungIntent === 'NO_APPLY' ? (jungsi_no_reason || null) : null
  const nowIso = new Date().toISOString()

  // 1. 기존 데이터 조회
  const existing = await getMyIntentSurvey(student_code)

  let existingLogs = []
  let historyCount = 0
  let isModified = false
  const changes = []

  if (existing) {
    existingLogs = Array.isArray(existing.change_logs) ? existing.change_logs : []
    historyCount = (existing.history_count || 0)

    // Diff 계산
    if (existing.csat_intent !== (csat_intent || 'TAKE')) {
      changes.push({
        field: 'csat_intent',
        field_name: '수능 응시',
        from: existing.csat_intent,
        from_label: existing.csat_intent === 'TAKE' ? '응시' : '미응시',
        to: csat_intent || 'TAKE',
        to_label: (csat_intent || 'TAKE') === 'TAKE' ? '응시' : '미응시',
        reason: (csat_intent === 'NO_TAKE') ? (csat_no_take_reason || null) : null
      })
    } else if (csat_intent === 'NO_TAKE' && existing.csat_no_take_reason !== csat_no_take_reason) {
      changes.push({
        field: 'csat_no_take_reason',
        field_name: '수능 미응시 사유',
        from: existing.csat_no_take_reason || '',
        to: csat_no_take_reason || ''
      })
    }

    const prevGen = existing.susi_general_intent || existing.susi_intent || 'APPLY'
    if (prevGen !== genIntent) {
      changes.push({
        field: 'susi_general_intent',
        field_name: '(일반대·과기원) 수시',
        from: prevGen,
        from_label: prevGen === 'APPLY' ? '접수 예정' : '미접수',
        to: genIntent,
        to_label: genIntent === 'APPLY' ? '접수 예정' : '미접수',
        reason: genReason
      })
    } else if (genIntent === 'NO_APPLY' && (existing.susi_general_no_reason || existing.susi_no_apply_reason) !== genReason) {
      changes.push({
        field: 'susi_general_no_reason',
        field_name: '일반대 수시 미접수 사유',
        from: existing.susi_general_no_reason || existing.susi_no_apply_reason || '',
        to: genReason || ''
      })
    }

    const prevCol = existing.susi_college_intent || 'APPLY'
    if (prevCol !== colIntent) {
      changes.push({
        field: 'susi_college_intent',
        field_name: '(전문대) 수시',
        from: prevCol,
        from_label: prevCol === 'APPLY' ? '접수 예정' : '미접수',
        to: colIntent,
        to_label: colIntent === 'APPLY' ? '접수 예정' : '미접수',
        reason: colReason
      })
    } else if (colIntent === 'NO_APPLY' && existing.susi_college_no_reason !== colReason) {
      changes.push({
        field: 'susi_college_no_reason',
        field_name: '전문대 수시 미접수 사유',
        from: existing.susi_college_no_reason || '',
        to: colReason || ''
      })
    }

    const prevJung = existing.jungsi_intent || 'APPLY'
    if (prevJung !== jungIntent) {
      changes.push({
        field: 'jungsi_intent',
        field_name: '대학 정시',
        from: prevJung,
        from_label: prevJung === 'APPLY' ? '접수 예정' : '미접수',
        to: jungIntent,
        to_label: jungIntent === 'APPLY' ? '접수 예정' : '미접수',
        reason: jungReason
      })
    } else if (jungIntent === 'NO_APPLY' && existing.jungsi_no_reason !== jungReason) {
      changes.push({
        field: 'jungsi_no_reason',
        field_name: '정시 미접수 사유',
        from: existing.jungsi_no_reason || '',
        to: jungReason || ''
      })
    }

    if (changes.length > 0) {
      isModified = true
      historyCount += 1
      const logEntry = {
        id: `log_${Date.now()}`,
        timestamp: nowIso,
        actor_name: actor.name || '학생 본인',
        actor_role: actor.role || 'student',
        changes,
        memo: memo || null
      }
      existingLogs = [logEntry, ...existingLogs]

      // history 별도 테이블 저장 (비동기 안전 처리)
      try {
        await supabase.from('student_intent_history').insert({
          student_code,
          actor_name: actor.name || '학생 본인',
          actor_role: actor.role || 'student',
          changes,
          memo: memo || null,
          created_at: nowIso
        })
      } catch (e) {
        console.warn('Failed to insert history log table:', e)
      }
    }
  } else {
    // 최초 등록
    existingLogs = [{
      id: `log_${Date.now()}`,
      timestamp: nowIso,
      actor_name: actor.name || '학생 본인',
      actor_role: actor.role || 'student',
      type: 'INITIAL',
      summary: '최초 응시/원서접수 의향 등록 완료'
    }]
  }

  const upsertData = {
    student_id,
    student_code,
    csat_intent: csat_intent || 'TAKE',
    csat_no_take_reason: csat_intent === 'NO_TAKE' ? (csat_no_take_reason || null) : null,
    susi_general_intent: genIntent,
    susi_general_no_reason: genReason,
    susi_college_intent: colIntent,
    susi_college_no_reason: colReason,
    jungsi_intent: jungIntent,
    jungsi_no_reason: jungReason,
    susi_intent: genIntent, // 레거시 호환
    susi_no_apply_reason: genReason,
    student_signature: student_signature || existing?.student_signature || null,
    parent_signature: parent_signature || existing?.parent_signature || null,
    parent_name: parent_name || existing?.parent_name || null,
    confirmed_at: existing?.confirmed_at || nowIso,
    change_logs: existingLogs,
    history_count: historyCount,
    last_modified_by: isModified ? (actor.name || '학생 본인') : existing?.last_modified_by || null,
    last_modified_at: isModified ? nowIso : existing?.last_modified_at || null,
    updated_at: nowIso
  }

  const { data, error } = await supabase
    .from('student_intent_surveys')
    .upsert(upsertData, { onConflict: 'student_code' })
    .select()
    .maybeSingle()

  if (error) throw error
  return data
}

// ==========================================
// 접수대장 PDF 데이터 DB 저장 (csat_registration_records)
// ==========================================

/**
 * 현재 DB에 저장된 최신 업로드 시각을 조회
 */
export async function getLatestUploadBatchTime() {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('csat_registration_records')
    .select('upload_batch_time')
    .order('upload_batch_time', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) { console.warn('getLatestUploadBatchTime error:', error); return null }
  return data?.upload_batch_time || null
}

/**
 * PDF 파싱 데이터를 암호화하여 DB에 upsert (receipt_no 기준)
 * @param {Array} records - csatPdfParser에서 파싱된 레코드 배열
 * @param {string} batchTime - PDF 저장 일시 문자열
 * @returns {{ inserted: number, updated: number, skipped: number }}
 */
export async function upsertCsatRecords(records, batchTime) {
  if (!supabase) throw new Error('DB 연결 없음')
  if (!records || records.length === 0) throw new Error('업로드할 데이터가 없습니다.')

  const batchTimestamp = new Date(batchTime.replace(' ', 'T') + '+09:00').toISOString()

  let inserted = 0
  let updated = 0
  let skipped = 0

  // 배치 단위로 upsert (50건씩)
  const batchSize = 50
  for (let i = 0; i < records.length; i += batchSize) {
    const chunk = records.slice(i, i + batchSize)
    const encryptedChunk = await Promise.all(chunk.map(async (r) => {
      const encName = await encryptText(r.name)
      const nameHash = await hashText(r.name)
      const encResident = await encryptText(r.resident_no)
      const residentHash = await hashText(r.resident_no.replace(/[\s-]/g, ''))

      return {
        upload_batch_time: batchTimestamp,
        seq_no: r.seq_no,
        receipt_no: r.receipt_no,
        name: encName,
        name_hash: nameHash,
        resident_no: encResident,
        resident_no_hash: residentHash,
        gender: r.gender,
        class_or_grad_year: r.class_or_grad_year,
        student_no: r.student_no,
        student_code: r.student_code,
        is_enrolled: r.is_enrolled,
        subject_korean: r.subject_korean,
        subject_math: r.subject_math,
        subject_english: r.subject_english,
        subject_history: r.subject_history,
        inquiry_type: r.inquiry_type,
        inquiry_subjects: r.inquiry_subjects,
        foreign_language: r.foreign_language,
        updated_at: new Date().toISOString()
      }
    }))

    const { data, error } = await supabase
      .from('csat_registration_records')
      .upsert(encryptedChunk, { onConflict: 'receipt_no' })
      .select('id')

    if (error) throw error
    if (data) inserted += data.length
  }

  return { inserted, updated, skipped, total: records.length }
}

// ==========================================
// 관리자/교사용 전체 데이터 조회 및 대조 분석
// ==========================================

/**
 * 전체 학생 의향 조사 데이터 조회
 */
export async function getAllIntentSurveys() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('student_intent_surveys')
    .select('*')
    .order('student_code', { ascending: true })
  if (error) { console.warn('getAllIntentSurveys error:', error); return [] }
  return data || []
}

/**
 * 전체 수능 접수대장 레코드 조회 (복호화 포함)
 */
export async function getAllCsatRecords() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('csat_registration_records')
    .select('*')
    .order('seq_no', { ascending: true })
  if (error) { console.warn('getAllCsatRecords error:', error); return [] }

  // 복호화
  const decrypted = await Promise.all((data || []).map(async (r) => ({
    ...r,
    name_decrypted: await decryptText(r.name),
    resident_no_decrypted: await decryptText(r.resident_no)
  })))

  return decrypted
}

/**
 * 전체 재학생 목록 조회 (enrolled_students)
 */
export async function getAllEnrolledStudents() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('enrolled_students')
    .select('id, student_code, name, name_hash, is_enrolled, grade, class_no, student_no, status')
    .eq('is_enrolled', true)
    .eq('status', 'approved')
    .order('student_code', { ascending: true })
  if (error) { console.warn('getAllEnrolledStudents error:', error); return [] }

  const decrypted = await Promise.all((data || []).map(async (s) => ({
    ...s,
    name_decrypted: await decryptText(s.name)
  })))

  return decrypted
}

/**
 * 의향 조사 vs 접수대장 대조 분석 결과 생성
 * @returns {Array<{ studentCode, name, classNo, studentNo, csatIntent, susiIntent, csatRegistered, mismatchType, ... }>}
 */
export async function buildComparisonData() {
  const [students, surveys, csatRecords] = await Promise.all([
    getAllEnrolledStudents(),
    getAllIntentSurveys(),
    getAllCsatRecords()
  ])

  const surveyMap = new Map()
  for (const s of surveys) {
    surveyMap.set(s.student_code, s)
  }

  const csatMap = new Map()
  for (const r of csatRecords) {
    if (r.student_code) csatMap.set(r.student_code, r)
  }

  const results = []
  for (const student of students) {
    const survey = surveyMap.get(student.student_code) || null
    const csatRec = csatMap.get(student.student_code) || null

    // 불일치 유형 판정
    let csatMismatch = 'NONE'
    if (!survey) {
      csatMismatch = 'NO_SURVEY' // 미응답
    } else if (survey.csat_intent === 'TAKE' && !csatRec) {
      csatMismatch = 'SURVEY_YES_CSAT_NO' // 학생: 응시, 접수대장: 없음
    } else if (survey.csat_intent === 'NO_TAKE' && csatRec) {
      csatMismatch = 'SURVEY_NO_CSAT_YES' // 학생: 미응시, 접수대장: 있음
    } else if (survey.csat_intent === 'TAKE' && csatRec) {
      csatMismatch = 'MATCH' // 일치
    } else if (survey.csat_intent === 'NO_TAKE' && !csatRec) {
      csatMismatch = 'MATCH' // 일치 (미응시+미등록)
    }

    results.push({
      student_code: student.student_code,
      student_id: student.id,
      name: student.name_decrypted,
      grade: student.grade,
      class_no: student.class_no,
      student_no: student.student_no,
      // 의향 조사 정보
      has_survey: !!survey,
      csat_intent: survey?.csat_intent || null,
      csat_no_take_reason: survey?.csat_no_take_reason || null,
      susi_general_intent: survey?.susi_general_intent || survey?.susi_intent || null,
      susi_general_no_reason: survey?.susi_general_no_reason || survey?.susi_no_apply_reason || null,
      susi_college_intent: survey?.susi_college_intent || null,
      susi_college_no_reason: survey?.susi_college_no_reason || null,
      jungsi_intent: survey?.jungsi_intent || null,
      jungsi_no_reason: survey?.jungsi_no_reason || null,
      susi_intent: survey?.susi_general_intent || survey?.susi_intent || null, // 레거시 호환
      susi_no_apply_reason: survey?.susi_general_no_reason || survey?.susi_no_apply_reason || null,
      student_signature: survey?.student_signature || null,
      parent_signature: survey?.parent_signature || null,
      parent_name: survey?.parent_name || null,
      is_form_submitted: survey?.is_form_submitted || false,
      confirmed_at: survey?.confirmed_at || null,
      change_logs: survey?.change_logs || [],
      history_count: survey?.history_count || 0,
      last_modified_by: survey?.last_modified_by || null,
      last_modified_at: survey?.last_modified_at || null,
      // 접수대장 정보
      csat_registered: !!csatRec,
      csat_record: csatRec || null,
      // 불일치 정보
      csat_mismatch: csatMismatch
    })
  }

  return results
}

/**
 * 담임교사: 확인서 실물 제출 완료 체크 토글
 */
export async function toggleFormSubmitted(studentCode, isSubmitted) {
  if (!supabase) throw new Error('DB 연결 없음')
  const { error } = await supabase
    .from('student_intent_surveys')
    .update({ is_form_submitted: isSubmitted, updated_at: new Date().toISOString() })
    .eq('student_code', studentCode)
  if (error) throw error
}

/**
 * 학생의 enrolled_students ID를 student_code로 조회
 */
export async function getStudentIdByCode(studentCode) {
  if (!supabase || !studentCode) return null
  const { data } = await supabase
    .from('enrolled_students')
    .select('id')
    .eq('student_code', studentCode)
    .maybeSingle()
  return data?.id || null
}
