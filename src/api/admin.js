import { supabase } from '../utils/supabaseClient'

// Helper for error parsing
export async function blobErrMsg(e) {
  return e.message ?? '오류가 발생했습니다'
}

// 현재 활성화된 라운드 조회
export const getCurrentRound = async () => {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('timeline_rounds')
    .select('*')
    .eq('status', 'OPEN')
    .order('id', { ascending: true })
    
  if (error) throw error
  if (data && data.length > 0) return data[0]
  
  const { data: closedData } = await supabase
    .from('timeline_rounds')
    .select('*')
    .eq('status', 'CLOSED')
    .order('id', { ascending: true })
    
  if (closedData && closedData.length > 0) return closedData[0]
  return null
}

// 1. 개요 통계 조회
export const getOverview = async () => {
  if (!supabase) return null

  // 버전 및 주소 정보
  const version = '0.2.12'
  const server_addr = window.location.host

  // 진행 중인 라운드 조회
  const { data: activeRounds } = await supabase
    .from('timeline_rounds')
    .select('*')
    .eq('status', 'OPEN')
    .order('id', { ascending: true })
  
  let round = null
  if (activeRounds && activeRounds.length > 0) {
    round = activeRounds[0]
  } else {
    const { data: closedRounds } = await supabase
      .from('timeline_rounds')
      .select('*')
      .eq('status', 'CLOSED')
      .order('id', { ascending: true })
    if (closedRounds && closedRounds.length > 0) {
      round = closedRounds[0]
    }
  }

  // 총 학생 수
  const { count: studentCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student')

  // 학급 목록 조회
  const { data: teachers } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'teacher')
    .order('grade', { ascending: true })
    .order('class_no', { ascending: true })

  const classes = []
  if (teachers) {
    for (const t of teachers) {
      // 학급별 지원자 수 계산
      let count = 0
      if (round) {
        // 해당 교사 학급의 모든 학생 ID 조회
        const { data: classStudents } = await supabase
          .from('profiles')
          .select('id')
          .eq('grade', t.grade)
          .eq('class_no', t.class_no)
          .eq('is_enrolled', true)
        
        if (classStudents && classStudents.length > 0) {
          const studentIds = classStudents.map(s => s.id)
          const { count: appCount } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('round', round.id)
            .in('student_id', studentIds)
          count = appCount || 0
        }
      }
      classes.push({
        grade: t.grade,
        class_no: t.class_no,
        teacher_name: t.name,
        count,
        confirmed: true // 완료 여부 디폴트 true
      })
    }
  }

  return {
    version,
    server_addr,
    round,
    student_count: studentCount || 0,
    classes
  }
}

// 2. 학급(교사) 목록 조회
export const getClasses = async () => {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'teacher')
    .order('grade', { ascending: true })
    .order('class_no', { ascending: true })

  if (error) throw error
  return data.map(t => ({
    grade: t.grade,
    class_no: t.class_no,
    teacher_name: t.name
  }))
}

// 3. 학급(교사) 추가 및 비밀번호 설정 (RPC 호출)
export const upsertClass = async (grade, classNo, body) => {
  if (!supabase) return
  const { data, error } = await supabase
    .rpc('create_teacher_account', {
      p_grade: grade,
      p_class_no: classNo,
      p_name: body.teacher_name || '담임교사',
      p_password: body.password
    })

  if (error) throw error
  return data
}

// 4. 학급(교사) 삭제
export const deleteClass = async (grade, classNo) => {
  if (!supabase) return
  // profiles에서 삭제하면 PostgreSQL 트리거가 auth.users에서도 지웁니다.
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('role', 'teacher')
    .eq('grade', grade)
    .eq('class_no', classNo)

  if (error) throw error
}

// 학급 일괄 관리용 템플릿/내보내기 (Mocking)
export const downloadClassTemplate = () => {}
export const exportClasses = () => {}
export const importClasses = () => {}

// 5. 전형요소 관리 (더미 - 수동 점수 입력으로 단일화되어 활용하지 않음)
export const getAreas = async () => []
export const createArea = async () => ({ id: 'dummy' })
export const updateArea = async () => {}
export const deleteArea = async () => {}
export const downloadAreaScoreTemplate = () => {}
export const downloadNumericTableTemplate = () => {}
export const exportNumericTable = () => {}
export const importNumericTable = () => {}
export const downloadCategoryMapTemplate = () => {}
export const exportCategoryMap = () => {}
export const importCategoryMap = () => {}

// JSON 조회 더미
export const getNumericTableList = async () => ({ rows: [], total: 0 })
export const getCategoryMapList = async () => ({ rows: [], total: 0 })
export const getBaseDataList = async () => ({ rows: [], total: 0 })
export const downloadBaseDataTemplate = () => {}
export const exportBaseData = () => {}
export const importBaseData = () => {}
export const previewDaegyoImport = () => {}
export const importDaegyo = () => {}
export const previewUnivImport = () => {}
export const importUniv = () => {}

// 6. 학생 관리 조회
export const getStudents = async (params = {}) => {
  if (!supabase) return []
  let query = supabase.from('profiles').select('*').eq('role', 'student')

  if (params.grade !== undefined && params.grade !== '') {
    query = query.eq('grade', params.grade)
  }
  if (params.class_no !== undefined && params.class_no !== '') {
    query = query.eq('class_no', params.class_no)
  }
  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,student_code.ilike.%${params.search}%`)
  }

  const { data, error } = await query
    .order('is_enrolled', { ascending: false })
    .order('grade', { ascending: true })
    .order('class_no', { ascending: true })
    .order('seq_no', { ascending: true })

  if (error) throw error
  return data
}

// 학생 학년 선택 옵션 목록
export const getStudentGradeOptions = async () => {
  return [{ grade: 1 }, { grade: 2 }, { grade: 3 }]
}

// 학생 일괄 관리 (Mocking)
export const downloadStudentTemplate = () => {}
export const exportStudents = () => {}
export const importStudents = () => {}
export const downloadEnrolledTemplate = () => {}
export const exportEnrolled = () => {}
export const importEnrolled = () => {}
export const downloadGraduatedTemplate = () => {}
export const exportGraduated = () => {}
export const importGraduated = () => {}

// 7. 재학생 추가 (RPC 호출)
export const addEnrolledStudent = async (body) => {
  if (!supabase) return
  const { data, error } = await supabase
    .rpc('create_student_account', {
      p_student_code: body.student_code,
      p_name: body.name,
      p_phone_last4: body.phone_last4 || '0000',
      p_password: body.password || 'school1234!',
      p_is_enrolled: true,
      p_grad_year: null,
      p_grade: Number(body.grade),
      p_class_no: Number(body.class_no),
      p_seq_no: Number(body.seq_no)
    })

  if (error) throw error
  return data
}

// 8. 졸업생 추가 (RPC 호출)
export const addGraduatedStudent = async (body) => {
  if (!supabase) return
  const { data, error } = await supabase
    .rpc('create_student_account', {
      p_student_code: body.student_code,
      p_name: body.name,
      p_phone_last4: body.phone_last4 || '0000',
      p_password: body.password || 'school1234!',
      p_is_enrolled: false,
      p_grad_year: Number(body.grad_year),
      p_grade: null,
      p_class_no: null,
      p_seq_no: null
    })

  if (error) throw error
  return data
}

// 9. 학생/졸업생 삭제
export const deleteStudent = async (id) => {
  if (!supabase) return
  // profiles에서 삭제하면 PostgreSQL 트리거가 auth.users에서도 지웁니다.
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// 10. 대학 목록 조회
export const getUniversities = async () => {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('universities')
    .select('*')
    .order('univ_name', { ascending: true })

  if (error) throw error
  return data
}

// 11. 대학교 생성
export const createUniversity = async (body) => {
  if (!supabase) return
  const { data, error } = await supabase
    .from('universities')
    .insert({
      univ_name: body.univ_name,
      track_type: body.track_type || '교과',
      track_name: body.track_name,
      grad_allowed: body.grad_allowed !== undefined ? body.grad_allowed : true,
      csat_min: body.csat_min || 'X',
      has_quota: body.has_quota || false,
      quota_limit: body.quota_limit || null,
      remarks: body.remarks || ''
    })
    .select()

  if (error) throw error
  return data && data[0]
}

// 12. 대학교 수정
export const updateUniversity = async (id, body) => {
  if (!supabase) return
  const { error } = await supabase
    .from('universities')
    .update({
      univ_name: body.univ_name,
      track_type: body.track_type,
      track_name: body.track_name,
      grad_allowed: body.grad_allowed,
      csat_min: body.csat_min,
      has_quota: body.has_quota,
      quota_limit: body.quota_limit,
      remarks: body.remarks
    })
    .eq('id', id)

  if (error) throw error
}

// 13. 대학교 삭제
export const deleteUniversity = async (id) => {
  if (!supabase) return
  const { error } = await supabase
    .from('universities')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// 모집단위 개별 매핑 (단일 테이블 구조이므로 universities 테이블 조회로 우회)
export const getUnivTracks = async (univId) => {
  if (!supabase) return []
  const { data: u } = await supabase.from('universities').select('*').eq('id', univId).single()
  if (!u) return []
  return [u]
}

export const getAllTracks = async () => getUniversities()
export const createTrack = async (univId, body) => createUniversity(body)
export const updateTrack = async (id, body) => updateUniversity(id, body)
export const deleteTrack = async (id) => deleteUniversity(id)

// 14. 라운드 전체 목록 조회
export const getRounds = async () => {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('timeline_rounds')
    .select('*')
    .order('id', { ascending: true })

  if (error) throw error
  return data
}

// 15. 라운드 개시
export const openRound = async () => {
  if (!supabase) return
  // 활성화된 라운드 번호 탐색 (1차 -> 2차 -> 3차)
  const rounds = await getRounds()
  const nextRound = rounds.find(r => r.status === 'OPEN') // 처음 오픈되지 않은 라운드
  
  if (!nextRound) throw new Error('개시 가능한 추가 라운드가 없습니다.')

  const { error } = await supabase
    .from('timeline_rounds')
    .update({ status: 'OPEN', opened_at: new Date().toISOString() })
    .eq('id', nextRound.id)

  if (error) throw error
  return nextRound
}

// 16. 라운드 종료
export const closeRound = async (id) => {
  if (!supabase) return
  const { error } = await supabase
    .from('timeline_rounds')
    .update({ status: 'CLOSED', closed_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

// 17. 라운드 재개
export const reopenRound = async (id) => {
  if (!supabase) return
  const { error } = await supabase
    .from('timeline_rounds')
    .update({ status: 'OPEN', closed_at: null, finalized_at: null })
    .eq('id', id)

  if (error) throw error

  // 기존 추천 및 부적합 내역 초기화
  await supabase
    .from('applications')
    .update({ is_recommended: false, is_excluded: false, excluded_reason: null, original_rank: null })
    .eq('round', id)
}

// 18. 라운드 마감 (최종 확정)
export const finalizeRound = async (id) => {
  if (!supabase) return

  // 1. 미결정(추천 확정 혹은 부적합 처리가 되지 않은) 건이 있는지 조회
  const { data: apps, error: err } = await supabase
    .from('applications')
    .select('*, profiles:student_id(*), universities:univ_id(*)')
    .eq('round', id)
    .eq('is_recommended', false)
    .eq('is_excluded', false)
    .eq('is_abandoned', false)

  if (err) throw err
  
  if (apps && apps.length > 0) {
    // 미결정 지원자가 있으므로 차단
    const undecidedList = apps.map(ap => ({
      student_code: ap.profiles.student_code,
      student_name: ap.profiles.name,
      grade: ap.profiles.grade,
      class_no: ap.profiles.class_no,
      univ_name: ap.universities.univ_name,
      track_name: ap.universities.track_name
    }))
    
    const errorObj = new Error('추천 또는 제외가 결정되지 않은 지원자가 있어 라운드를 마감할 수 없습니다.')
    errorObj.response = {
      status: 422,
      data: {
        error: errorObj.message,
        undecided: undecidedList
      }
    }
    throw errorObj
  }

  // 2. 정원 초과 여부 검증
  const { data: allApps } = await supabase
    .from('applications')
    .select('*, universities:univ_id(*)')
    .eq('round', id)
    .eq('is_recommended', true)
    .eq('is_abandoned', false)

  // 각 대학교 트랙별 추천 수 카운트
  const trackCounts = {}
  allApps?.forEach(ap => {
    trackCounts[ap.univ_id] = (trackCounts[ap.univ_id] || 0) + 1
  })

  const trackViolations = []
  for (const tid of Object.keys(trackCounts)) {
    const { data: track } = await supabase.from('universities').select('*').eq('id', tid).single()
    if (track && track.has_quota && trackCounts[tid] > track.quota_limit) {
      trackViolations.push({
        univ_name: track.univ_name,
        track_name: track.track_name,
        quota: track.quota_limit,
        recommended: trackCounts[tid]
      })
    }
  }

  if (trackViolations.length > 0) {
    const errorObj = new Error('정원 초과로 라운드를 확정할 수 없습니다.')
    errorObj.response = {
      status: 422,
      data: {
        error: errorObj.message,
        track_violations: trackViolations,
        univ_violations: []
      }
    }
    throw errorObj
  }

  // 3. 상태 마감 업데이트
  const { error } = await supabase
    .from('timeline_rounds')
    .update({ status: 'FINALIZED', finalized_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export const calculateScores = async () => ({ calculated: true })

// 19. 라운드별 결과 랭킹 조회 (클라이언트 연산)
export const getResults = async (roundId, trackId) => {
  if (!supabase) return []

  let query = supabase
    .from('applications')
    .select('*, profiles:student_id(*), universities:univ_id(*)')
    .eq('round', roundId)

  if (trackId) {
    query = query.eq('univ_id', trackId)
  }

  const { data: apps, error } = await query
  if (error) throw error

  // 대학교(univ_id) & 라운드(round)별로 묶어 랭킹 부여
  const grouped = {}
  apps.forEach(ap => {
    const key = `${ap.univ_id}-${ap.round}`
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(ap)
  })

  const results = []
  Object.keys(grouped).forEach(key => {
    const groupApps = grouped[key]
    
    // 정렬: 재학생 우선, 내신 성적 내림차순, 학번 오름차순
    groupApps.sort((a, b) => {
      if (a.profiles.is_enrolled !== b.profiles.is_enrolled) {
        return a.profiles.is_enrolled ? -1 : 1
      }
      const scoreA = Number(a.manual_score || 0)
      const scoreB = Number(b.manual_score || 0)
      if (scoreB !== scoreA) return scoreB - scoreA
      return a.profiles.student_code.localeCompare(b.profiles.student_code)
    })

    // Standard Competition Ranking (1, 1, 3, 4...)
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

      // 부적합 처리가 되었을 경우 원래의 순위를 캐싱하여 대시보드에 정상 출력
      let finalRank = rank
      if (ap.is_excluded) {
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
        ranking: finalRank,
        track_rank: finalRank,
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

  return results
}

// 20. 추천 확정
export const recommendResult = async (sid, tid, rid) => {
  if (!supabase) return
  
  // RLS 및 정원 제한 검증
  const { data: track } = await supabase.from('universities').select('*').eq('id', tid).single()
  
  if (track && track.has_quota) {
    // 추천 확정된 비포기 건수
    const { count: recCount } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('univ_id', tid)
      .eq('is_recommended', true)
      .eq('is_abandoned', false)

    if (recCount >= track.quota_limit) {
      throw new Error('정원이 마감되어 더 이상 추천을 확정할 수 없습니다.')
    }
  }

  const { error } = await supabase
    .from('applications')
    .update({ is_recommended: true })
    .eq('student_id', sid)
    .eq('univ_id', tid)
    .eq('round', rid)

  if (error) throw error
}

// 21. 추천 취소
export const unrecommendResult = async (sid, tid, rid) => {
  if (!supabase) return
  const { error } = await supabase
    .from('applications')
    .update({ is_recommended: false })
    .eq('student_id', sid)
    .eq('univ_id', tid)
    .eq('round', rid)

  if (error) throw error
}

// 22. 지원서 목록 조회 (라운드별)
export const getApplications = async (roundId, trackId) => {
  if (!supabase) return []
  let query = supabase
    .from('applications')
    .select('*, profiles:student_id(*), universities:univ_id(*)')
    .eq('round', roundId)

  if (trackId) {
    query = query.eq('univ_id', trackId)
  }

  const { data, error } = await query
  if (error) throw error

  return data.map(ap => ({
    student_id: ap.student_id,
    track_id: ap.univ_id,
    round_id: ap.round,
    abandoned: ap.is_abandoned,
    excluded: ap.is_excluded,
    excluded_reason: ap.excluded_reason,
    department_name: ap.department_name,
    student_code: ap.profiles.student_code,
    name: ap.profiles.name,
    grade: ap.profiles.grade,
    class_no: ap.profiles.class_no,
    seq_no: ap.profiles.seq_no,
    is_enrolled: ap.profiles.is_enrolled,
    univ_id: ap.univ_id,
    univ_name: ap.universities.univ_name,
    track_name: ap.universities.track_name,
    recommended: ap.is_recommended,
    round_status: 'CLOSED'
  }))
}

// 23. 지원 포기 (관리자)
export const abandonApplication = async (sid, tid, rid, docUrl = null) => {
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
}

// 24. 부적합 처리 (excluded)
export const excludeApplication = async (sid, tid, rid, reason) => {
  if (!supabase) return
  const { error } = await supabase
    .from('applications')
    .update({ is_excluded: true, excluded_reason: reason })
    .eq('student_id', sid)
    .eq('univ_id', tid)
    .eq('round', rid)

  if (error) throw error
}

// 25. 부적합 해제
export const clearApplicationExclusion = async (sid, tid, rid) => {
  if (!supabase) return
  const { error } = await supabase
    .from('applications')
    .update({ is_excluded: false, excluded_reason: null, original_rank: null })
    .eq('student_id', sid)
    .eq('univ_id', tid)
    .eq('round', rid)

  if (error) throw error
}

// 결과 엑셀 / 리포트 Mocking
export const exportResultsExcel = () => {}
export const exportRoundSummary = () => {}

// 26. 비밀번호 변경 (관리자)
export const changeAdminPassword = async (currentPassword, newPassword) => {
  if (!supabase) return
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })
  if (error) throw error
}

export const scorePreview = async () => ({ score: 0 })

// 27. 잔여 정원 통계 조회
export const getQuotaStats = async () => {
  if (!supabase) return []
  
  // 모든 대학/전형 조회
  const univs = await getUniversities()
  
  // 추천 확정 현황 취합
  const { data: recommendedApps } = await supabase
    .from('applications')
    .select('univ_id')
    .eq('is_recommended', true)
    .eq('is_abandoned', false)

  const counts = {}
  recommendedApps?.forEach(ap => {
    counts[ap.univ_id] = (counts[ap.univ_id] || 0) + 1
  })

  return univs.map(u => {
    const recommended = counts[u.id] || 0
    const quota = u.has_quota ? u.quota_limit : 9999
    return {
      id: u.id,
      univ_name: u.univ_name,
      track_name: u.track_name,
      quota: u.has_quota ? u.quota_limit : null,
      recommended_count: recommended,
      remaining_quota: u.has_quota ? Math.max(0, quota - recommended) : null
    }
  })
}

// 학급별 마감 확정 현황 (더미)
export const getRoundConfirmationStatus = async () => {
  return { classes: [] }
}

export const exportQuotaStats = () => {}

export const getTrackRecommendedList = async (trackId) => {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('applications')
    .select('*, profiles:student_id(*)')
    .eq('univ_id', trackId)
    .eq('is_recommended', true)
    .eq('is_abandoned', false)

  if (error) throw error
  return data
}

export const downloadUnivSettingsTemplate = () => {}
export const exportUnivSettings = () => {}
export const previewUnivSettings = () => {}
export const importUnivSettings = () => {}

// 28. 2-Phase 자동 추천 알고리즘 (클라이언트)
export const autoRecommend = async (roundId) => {
  if (!supabase) return { confirmed: [], manual: [] }

  // 1. 모든 지원서 조회
  const apps = await getApplications(roundId)
  
  // 이미 추천되었거나, 포기했거나, 부적합 처리된 건 필터링
  const candidates = apps.filter(ap => !ap.recommended && !ap.abandoned && !ap.excluded)
  
  // 대학별/모집단위별 랭킹 구하기
  const results = await getResults(roundId)
  const resultsMap = {}
  results.forEach(r => {
    resultsMap[`${r.student_id}-${r.track_id}`] = r.track_rank
  })

  // 각 모집단위 정원 상태 로드
  const quotaStats = await getQuotaStats()
  const remainingQuotas = {}
  quotaStats.forEach(q => {
    remainingQuotas[q.id] = q.remaining_quota !== null ? q.remaining_quota : 9999
  })

  // 1단계: 모집단위 순위(track_rank) 높은 순으로 정원만큼 채우기
  // 모집단위별로 지원자 그룹화
  const trackGroups = {}
  candidates.forEach(c => {
    if (!trackGroups[c.track_id]) trackGroups[c.track_id] = []
    trackGroups[c.track_id].push(c)
  })

  const confirmedList = []
  const manualList = [] // 동점자로 인해 보류된 건

  Object.keys(trackGroups).forEach(tid => {
    const list = trackGroups[tid]
    // track_rank 기준 오름차순 정렬 (1위부터)
    list.forEach(c => {
      c.rank = resultsMap[`${c.student_id}-${c.track_id}`] || 999
    })
    list.sort((a, b) => a.rank - b.rank)

    let rem = remainingQuotas[tid]
    if (rem <= 0) return

    // 랭킹별 그룹화 (동점 그룹 분리)
    const rankGroups = {}
    list.forEach(c => {
      if (!rankGroups[c.rank]) rankGroups[c.rank] = []
      rankGroups[c.rank].push(c)
    })

    const sortedRanks = Object.keys(rankGroups).map(Number).sort((a, b) => a - b)
    let confirmedCount = 0

    for (const r of sortedRanks) {
      const group = rankGroups[r]
      if (confirmedCount + group.length <= rem) {
        // 그룹 전원 승인
        group.forEach(c => confirmedList.push(c))
        confirmedCount += group.length
      } else {
        // 남은 자리가 그룹 크기보다 작음 (동점자 발생!)
        const freeSpots = rem - confirmedCount
        if (freeSpots > 0) {
          // 남은 자리 존재하여 동점자 수동 선발 보고
          group.forEach(c => {
            manualList.push({
              ...c,
              contenders: group.length,
              free_spots: freeSpots
            })
          })
        }
        break // 정원 소진으로 해당 트랙 종료
      }
    }
  })

  // 2단계: 대학 전체 정원 컷 적용 (우리는 대학별 total_quota가 없으므로 생략하고 1단계 리스트를 바로 반영)
  // 매뉴얼 보고된 동점자를 제외하고 확정(confirmedList)된 학생들에 대해 DB 업데이트
  for (const c of confirmedList) {
    await recommendResult(c.student_id, c.track_id, roundId)
  }

  return {
    confirmed: confirmedList,
    manual: manualList
  }
}

// 대학 지정 자동 추천
export const autoRecommendUniv = async (roundId, univId) => {
  return autoRecommend(roundId)
}

// 29. 감사 로그 조회
export const getAuditLogs = async (params = {}) => {
  if (!supabase) return { rows: [], total: 0 }
  let query = supabase
    .from('audit_logs')
    .select('*, profiles:actor_id(name, role)', { count: 'exact' })

  // 페이징 처리
  const page = params.page || 1
  const perPage = params.per_page || 50
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error

  return {
    rows: data.map(log => ({
      id: log.id,
      actor_ip: 'Client',
      action: log.action,
      details: log.details,
      created_at: log.created_at,
      actor_name: log.profiles ? log.profiles.name : '시스템',
      actor_role: log.profiles ? log.profiles.role : 'system'
    })),
    total: count || 0,
    page,
    per_page: perPage
  }
}

export const exportAuditLogs = () => {}
export const adminAreaScorePreview = async () => ({ score: 0 })
