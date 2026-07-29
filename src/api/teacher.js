import { supabase } from '../utils/supabaseClient'

// 1. 현재 활성화된 라운드 조회
export const getCurrentRound = async () => {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('timeline_rounds')
    .select('*')
    .eq('status', 'OPEN')
    .order('id', { ascending: true })
    
  if (error) throw error
  if (data && data.length > 0) return data[0]
  
  // OPEN 라운드가 없으면 CLOSED 라운드 조회
  const { data: closedData } = await supabase
    .from('timeline_rounds')
    .select('*')
    .eq('status', 'CLOSED')
    .order('id', { ascending: true })
    
  if (closedData && closedData.length > 0) return closedData[0]
  return null
}

// 2. 담당 학급 학생 목록 조회
export const teacherGetStudents = async () => {
  if (!supabase) return []
  
  const savedGrade = localStorage.getItem('teacher_selected_grade')
  const savedClass = localStorage.getItem('teacher_selected_class')
  
  const targetGrade = savedGrade === '0' || savedGrade === '3' ? Number(savedGrade) : 3
  const targetClassNo = savedClass !== null && savedClass !== '' ? Number(savedClass) : 0

  let query = supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')

  // 졸업생(grade=0)인 경우 졸업생만 조회, 그 외에는 해당 학년(반=0이면 전체반) 조회
  if (targetGrade === 0) {
    query = query.eq('is_enrolled', false).order('name', { ascending: true })
  } else {
    query = query.eq('grade', targetGrade).eq('is_enrolled', true)
    if (targetClassNo > 0) {
      query = query.eq('class_no', targetClassNo)
    }
    query = query
      .order('class_no', { ascending: true })
      .order('seq_no', { ascending: true })
      .order('name', { ascending: true })
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

// 3. 대학 목록 (고유 대학명 리스트)
export const teacherGetUniversities = async () => {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('universities')
    .select('univ_name')
  
  if (error) throw error
  
  // 중복 제거 및 이름순 정렬
  const uniqueNames = [...new Set(data.map(u => u.univ_name))].sort()
  return uniqueNames.map(name => ({ id: name, univ_name: name }))
}

// 4. 특정 대학의 모집단위(트랙) 목록
export const teacherGetUnivTracks = async (univName) => {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('universities')
    .select('*')
    .eq('univ_name', univName)
    .order('track_name', { ascending: true })

  if (error) throw error
  return data.map(u => ({
    id: u.id,
    univ_id: u.id,
    univ_name: u.univ_name,
    track_name: u.track_name,
    track_type: u.track_type,
    grad_allowed: u.grad_allowed,
    csat_min: u.csat_min,
    has_quota: u.has_quota,
    quota_limit: u.quota_limit,
    remarks: u.remarks
  }))
}

// 5. 전형요소 컨텍스트 (수동 성적 입력으로 전환되어 더미 데이터 반환)
export const teacherGetAreaContext = async (studentId, trackId) => {
  return {
    areas: [],
    base_data: {}
  }
}

// 6. 실시간 점수 계산 미리보기 (더미)
export const teacherAreaScorePreview = async (areaId, trackId, values) => {
  return { score: 0 }
}

// 7. 전체 모집단위 목록 (학급관리 탭용)
export const teacherGetAllTracks = async () => {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('universities')
    .select('*')
    .order('univ_name', { ascending: true })

  if (error) throw error
  return data
}

// 8. 담당 학급의 추천 신청서 목록 조회
export const teacherGetApplications = async (roundId) => {
  if (!supabase) return []
  
  const students = await teacherGetStudents()
  if (students.length === 0) return []
  
  const studentIds = students.map(s => s.id)

  let query = supabase
    .from('applications')
    .select('*, profiles:student_id(*), universities:univ_id(*)')
    .in('student_id', studentIds)

  if (roundId !== undefined && roundId !== null && roundId !== '') {
    query = query.eq('round', Number(roundId))
  }

  const { data, error } = await query

  if (error) throw error
  if (!data) return []

  return data.map(ap => ({
    student_id: ap.student_id,
    track_id: ap.univ_id,
    round_id: ap.round,
    abandoned: ap.is_abandoned,
    excluded: ap.is_excluded,
    excluded_reason: ap.excluded_reason,
    department_name: ap.department_name,
    student_code: ap.profiles?.student_code || '',
    name: ap.profiles?.name || '',
    grade: ap.profiles?.grade,
    class_no: ap.profiles?.class_no,
    seq_no: ap.profiles?.seq_no,
    is_enrolled: ap.profiles?.is_enrolled,
    univ_id: ap.univ_id,
    univ_name: ap.universities?.univ_name || '',
    track_name: ap.universities?.track_name || '',
    recommended: ap.is_recommended,
    round_status: 'OPEN' // 라운드 상태 바인딩용
  }))
}

// 9. 교사의 지원서 수동 등록 (재학생 및 졸업생)
// body: { student_id, track_id, round_id, department_name, manual_score, parent_name, parent_phone }
export const teacherCreateApplication = async (body) => {
  if (!supabase) return
  
  const { data, error } = await supabase
    .from('applications')
    .insert({
      student_id: body.student_id,
      univ_id: body.track_id,
      round: body.round_id,
      department_name: body.department_name,
      manual_score: body.manual_score || null,
      parent_name: body.parent_name || '미입력',
      parent_phone: body.parent_phone || '000-0000-0000',
      student_signature_url: body.student_signature_url || null
    })

  if (error) throw error
  
  // 감사로그 기록
  try {
    const userRes = await supabase.auth.getUser()
    if (userRes?.data?.user) {
      await supabase.from('audit_logs').insert({
        actor_id: userRes.data.user.id,
        action: 'TEACHER_APPLY',
        details: { student_id: body.student_id, univ_id: body.track_id, round: body.round_id }
      })
    }
  } catch (e) {
    console.warn('감사 로그 작성 실패:', e)
  }
}

// 10. 지원서 삭제
export const teacherDeleteApplication = async (sid, tid, rid) => {
  if (!supabase) return
  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('student_id', sid)
    .eq('univ_id', tid)
    .eq('round', rid)

  if (error) throw error
}

// 11. 비밀번호 변경
export const teacherChangePassword = async (currentPassword, newPassword) => {
  if (!supabase) return
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })
  if (error) throw error
}

// 12. 라운드 결과 조회 및 클라이언트 순위 계산
export const teacherGetResults = async () => {
  if (!supabase) return { rounds: [], results: [] }

  // 모든 라운드 정보 획득
  const { data: rounds } = await supabase.from('timeline_rounds').select('*').order('id', { ascending: true })
  
  // 교사 소속 학생 획득
  const students = await teacherGetStudents()
  if (students.length === 0) return { rounds: rounds || [], results: [] }
  const studentIds = students.map(s => s.id)

  // 모든 신청 내역 로드
  const { data: apps, error } = await supabase
    .from('applications')
    .select('*, profiles:student_id(*), universities:univ_id(*)')
    .in('student_id', studentIds)

  if (error) throw error

  // 순위 계산 함수 (대학/모집단위별)
  // 기존 Rust Spec: 정렬 기준 -> 내신점수 높은 순, 재학생 우선, 동점 처리(공동순위 건너뜀)
  const results = []

  // 대학교(univ_id) & 라운드(round)별로 묶어서 순위 계산
  const grouped = {}
  apps.forEach(ap => {
    const key = `${ap.univ_id}-${ap.round}`
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(ap)
  })

  Object.keys(grouped).forEach(key => {
    const groupApps = grouped[key]
    
    // 정렬 규칙: 
    // 1. 재학생 우선 여부 (대학 설정ize_enrolled) 확인
    //    우선순위: 재학생(is_enrolled=true) > 졸업생(is_enrolled=false)
    // 2. manual_score 높은 순
    const prioritize = groupApps[0].universities.grad_allowed // 졸업생도 허용되지만 재학생을 우선순위 배치
    
    groupApps.sort((a, b) => {
      // 1. 재학생 우선 정렬
      if (a.profiles.is_enrolled !== b.profiles.is_enrolled) {
        return a.profiles.is_enrolled ? -1 : 1
      }
      // 2. 점수 정렬
      const scoreA = Number(a.manual_score || 0)
      const scoreB = Number(b.manual_score || 0)
      return scoreB - scoreA
    })

    // Standard Competition Ranking 계산 (1, 1, 3, 4...)
    let rank = 1
    let skipCount = 0
    let prevScore = null
    let prevEnrolled = null

    groupApps.forEach((ap, idx) => {
      const currentScore = Number(ap.manual_score || 0)
      const currentEnrolled = ap.profiles.is_enrolled

      if (idx > 0) {
        if (currentScore === prevScore && currentEnrolled === prevEnrolled) {
          skipCount++
        } else {
          rank += skipCount + 1
          skipCount = 0
        }
      }

      prevScore = currentScore
      prevEnrolled = currentEnrolled

      // 부적합 처리가 되었을 경우 원래의 순위를 캐싱하여 리포트
      let finalRank = rank
      if (ap.is_excluded) {
        // original_rank에 캐싱된 값이 없으면 현재 순위 저장
        if (!ap.original_rank) {
          supabase.from('applications').update({ original_rank: rank }).eq('id', ap.id).then(() => {})
        }
        finalRank = ap.original_rank || rank
      }

      results.push({
        student_id: ap.student_id,
        track_id: ap.univ_id,
        round_id: ap.round,
        total_score: currentScore,
        score_detail: {},
        ranking: finalRank, // 대학내 순위
        track_rank: finalRank, // 모집단위 순위 (동일하게 사용)
        recommended: ap.is_recommended,
        abandoned: ap.is_abandoned,
        excluded: ap.is_excluded,
        excluded_reason: ap.excluded_reason,
        student_code: ap.profiles.student_code,
        name: ap.profiles.name,
        grade: ap.profiles.grade,
        class_no: ap.profiles.class_no,
        seq_no: ap.profiles.seq_no,
        is_enrolled: ap.profiles.is_enrolled,
        univ_name: ap.universities.univ_name,
        track_name: ap.universities.track_name,
        department_name: ap.department_name
      })
    })
  })

  return {
    rounds: rounds || [],
    results
  }
}

// 13. 지원 포기원 상태 변경 및 URL 바인딩
export const teacherAbandonApplication = async (sid, tid, rid, docUrl = null) => {
  if (!supabase) return
  const updateData = { is_abandoned: true }
  if (docUrl) {
    updateData.abandoned_doc_url = docUrl
  }

  const { error } = await supabase
    .from('applications')
    .update(updateData)
    .eq('student_id', sid)
    .eq('univ_id', tid)
    .eq('round', rid)

  if (error) throw error

  // 감사로그 기록
  try {
    const userRes = await supabase.auth.getUser()
    if (userRes?.data?.user) {
      await supabase.from('audit_logs').insert({
        actor_id: userRes.data.user.id,
        action: 'ABANDON',
        details: { student_id: sid, univ_id: tid, round: rid }
      })
    }
  } catch (e) {
    console.warn('감사 로그 작성 실패:', e)
  }
}

// 14. 라운드 컨펌 상태 조회 (더미)
export const teacherGetRoundConfirmation = async (roundId) => {
  return { confirmed: false, confirmed_at: null }
}

// 15. 라운드 컨펌 (더미)
export const teacherConfirmRound = async (roundId) => {
  return true
}

// 16. 라운드 컨펌 해제 (더미)
export const teacherRevokeRoundConfirmation = async (roundId) => {
  return true
}
