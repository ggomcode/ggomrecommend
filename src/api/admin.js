import { supabase } from '../utils/supabaseClient'
import * as XLSX from 'xlsx'
import { formatPhoneLast4, hashPhone } from '../utils/phoneUtils'
import { encryptText, decryptText, hashText } from '../utils/cryptoUtils'

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
        // 해당 교사 학급의 모든 학생 ID 조회 (null 안전 처리)
        let studentQuery = supabase
          .from('profiles')
          .select('id')
          .eq('is_enrolled', true)

        if (t.grade != null) {
          studentQuery = studentQuery.eq('grade', t.grade)
        } else {
          studentQuery = studentQuery.is('grade', null)
        }

        if (t.class_no != null) {
          studentQuery = studentQuery.eq('class_no', t.class_no)
        } else {
          studentQuery = studentQuery.is('class_no', null)
        }

        const { data: classStudents } = await studentQuery
        
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
        submitted: count,
        confirmed: true
      })
    }
  }

  // 대학 및 모집단위별 현황 (universities)
  const universities = []
  const { data: univList } = await supabase
    .from('universities')
    .select('*')
    .order('univ_name', { ascending: true })

  if (univList) {
    const univMap = new Map()
    for (const u of univList) {
      if (!univMap.has(u.univ_name)) {
        univMap.set(u.univ_name, {
          univ_id: u.id,
          univ_name: u.univ_name,
          total_quota: u.total_quota,
          tracks: []
        })
      }
      let applicants = 0
      if (round) {
        const { count: appCount } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('round', round.id)
          .eq('univ_name', u.univ_name)
          .eq('track_name', u.track_name)
        applicants = appCount || 0
      }
      univMap.get(u.univ_name).tracks.push({
        track_id: u.id,
        track_name: u.track_name,
        unit_quota: u.quota,
        applicants
      })
    }
    universities.push(...Array.from(univMap.values()))
  }

  // 누적 통계 데이터 (all_time) 집계
  const { data: allRounds } = await supabase
    .from('timeline_rounds')
    .select('id')
  const totalRounds = allRounds ? allRounds.length : 0

  const { count: totalApplicants } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })

  const { count: confirmedCount } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('is_recommended', true)

  const { count: abandonedCount } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('is_abandoned', true)

  const all_time = {
    total_rounds: totalRounds,
    total_applicants: totalApplicants || 0,
    confirmed: confirmedCount || 0,
    abandoned: abandonedCount || 0
  }

  return {
    version,
    server_addr,
    round,
    student_count: studentCount || 0,
    classes,
    universities,
    all_time
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

// 6. 학생 관리 조회 (enrolled_students 통합 마스터 원장 전용)
export const getStudents = async (params = {}) => {
  if (!supabase) return { rows: [], total: 0, page: 1, per_page: 100 }

  const page = params.page || 1
  const perPage = params.per_page || 100
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let query = supabase.from('enrolled_students').select('*', { count: 'exact' })

  if (params.is_enrolled !== undefined && params.is_enrolled !== null) {
    query = query.eq('is_enrolled', Boolean(Number(params.is_enrolled)))
  }
  if (params.grade !== undefined && params.grade !== null && params.grade !== '') {
    query = query.eq('grade', params.grade)
  }
  if (params.class_no !== undefined && params.class_no !== null && params.class_no !== '') {
    query = query.eq('class_no', params.class_no)
  }
  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,student_code.ilike.%${params.search}%`)
  }

  const { data, count, error } = await query
    .order('is_enrolled', { ascending: false })
    .order('grade', { ascending: true })
    .order('class_no', { ascending: true })
    .order('student_no', { ascending: true })
    .range(from, to)

  if (error) throw error

  const rows = await Promise.all((data || []).map(async s => ({
    id: s.id,
    student_code: s.student_code || (s.grade && s.class_no && s.student_no ? `${s.grade}${String(s.class_no).padStart(2, '0')}${String(s.student_no).padStart(2, '0')}` : ''),
    name: await decryptText(s.name),
    parent_name: await decryptText(s.parent_name),
    is_enrolled: s.is_enrolled !== false,
    grade: s.grade,
    class_no: s.class_no,
    seq_no: s.student_no || s.seq_no,
    phone_last4: s.student_phone_last4 || '0000',
    status: s.status || 'approved',
    grad_year: s.grad_year
  })))

  return {
    rows,
    total: count !== null ? count : rows.length,
    page,
    per_page: perPage
  }
}

// 학생 학년 선택 옵션 목록
export const getStudentGradeOptions = async () => {
  const defaultOptions = {
    grades: [3],
    by_grade: {
      '3': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    }
  }

  if (!supabase) return defaultOptions

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('grade, class_no')
      .eq('role', 'student')
      .not('grade', 'is', null)

    if (error || !data || data.length === 0) return defaultOptions

    const gradesSet = new Set()
    const byGradeMap = {}

    data.forEach(item => {
      if (item.grade) {
        gradesSet.add(item.grade)
        if (!byGradeMap[item.grade]) byGradeMap[item.grade] = new Set()
        if (item.class_no) byGradeMap[item.grade].add(item.class_no)
      }
    })

    const grades = Array.from(gradesSet).sort((a, b) => a - b)
    if (grades.length === 0) return defaultOptions

    const by_grade = {}
    Object.keys(byGradeMap).forEach(g => {
      const classes = Array.from(byGradeMap[g]).sort((a, b) => a - b)
      by_grade[g] = classes.length > 0 ? classes : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    })

    return { grades, by_grade }
  } catch (e) {
    return defaultOptions
  }
}

// 학생 일괄 관리 (엑셀 다운로드 및 업로드)
export const downloadEnrolledTemplate = async () => {
  const headers = [
    '순번',
    '학년',
    '반',
    '번호',
    '이름',
    '성별',
    '비고',
    '학생전화(끝4자리)',
    '학부모이름',
    '학부모전화(끝4자리)'
  ]
  const sampleData = [
    [1, 3, 1, 1, '홍길동', '남', '', '1234', '홍부모', '5678'],
    [2, 3, 1, 2, '성춘향', '여', '', '2345', '성부모', '6789'],
    [3, 3, 2, 1, '이몽룡', '남', '특기사항 예시', '3456', '이부모', '7890']
  ]
  const wsData = [headers, ...sampleData]
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  ws['!cols'] = [
    { wch: 8 },  // 순번
    { wch: 8 },  // 학년
    { wch: 8 },  // 반
    { wch: 8 },  // 번호
    { wch: 12 }, // 이름
    { wch: 8 },  // 성별
    { wch: 20 }, // 비고
    { wch: 18 }, // 학생전화(끝4자리)
    { wch: 14 }, // 학부모이름
    { wch: 18 }  // 학부모전화(끝4자리)
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '재학생명단양식')
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  return { data: blob }
}

export const downloadGraduatedTemplate = async () => {
  const headers = ['학생코드', '이름', '졸업연도', '비고']
  const sampleData = [
    ['G2025001', '강감찬', 2025, ''],
    ['G2025002', '을지문덕', 2025, '']
  ]
  const wsData = [headers, ...sampleData]
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  ws['!cols'] = [{ wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 20 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '졸업생명단양식')
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  return { data: blob }
}

export const downloadStudentTemplate = downloadEnrolledTemplate
export const exportStudents = () => {}
export const importStudents = () => {}
export const exportEnrolled = () => {}
export const importEnrolled = () => {}
export const exportGraduated = () => {}
export const importGraduated = () => {}

// 7. 재학생 추가 (enrolled_students 원장 연동)
export const addEnrolledStudent = async (body) => {
  if (!supabase) return
  const grade = Number(body.grade)
  const class_no = Number(body.class_no)
  const student_no = Number(body.seq_no) || 1
  const student_code = body.student_code || `${grade}${String(class_no).padStart(2, '0')}${String(student_no).padStart(2, '0')}`

  const { data, error } = await supabase
    .from('enrolled_students')
    .upsert({
      student_code,
      name: body.name,
      student_phone_last4: body.phone_last4 || '0000',
      is_enrolled: true,
      grade,
      class_no,
      student_no,
      seq_no: student_no,
      status: 'approved'
    }, { onConflict: 'grade,class_no,student_no' })

  if (error) throw error
  return data
}

// 8. 졸업생 추가 (enrolled_students 원장 연동)
export const addGraduatedStudent = async (body) => {
  if (!supabase) return
  const grad_year = Number(body.grad_year)
  const student_code = body.student_code || `grad_${grad_year}_${Date.now().toString().slice(-4)}`

  const { data, error } = await supabase
    .from('enrolled_students')
    .insert({
      student_code,
      name: body.name,
      student_phone_last4: body.phone_last4 || '0000',
      is_enrolled: false,
      grad_year,
      status: 'approved'
    })

  if (error) throw error
  return data
}

// 9. 학생/졸업생 삭제
export const deleteStudent = async (id) => {
  if (!supabase) return
  const { error } = await supabase
    .from('enrolled_students')
    .delete()
    .eq('id', id)

  await supabase
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

// 30. 수도권 학교장추천전형 (regional_recommendations) API
export const getRegionalRecommendations = async () => {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('regional_recommendations')
    .select('*')
    .order('seq_no', { ascending: true })

  if (error) throw error
  return data || []
}

export const deleteRegionalRecommendations = async () => {
  if (!supabase) return
  const { error } = await supabase
    .from('regional_recommendations')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (error) throw error
}

export const importRegionalRecommendations = async (file) => {
  if (!supabase) return { count: 0 }
  
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[firstSheetName]
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

  if (!rawRows || rawRows.length === 0) {
    throw new Error('엑셀 파일에 데이터가 없습니다.')
  }

  // 16개 컬럼 매핑
  const mappedRows = rawRows.map((row, index) => {
    return {
      seq_no: index + 1,
      region: String(row['지역'] ?? '').trim(),
      univ_name: String(row['대학명'] ?? '').trim(),
      recruitment_quota: String(row['모집정원'] ?? '').trim(),
      track_name: String(row['전형명'] ?? '').trim(),
      quota_limit: String(row['인원제한'] ?? '').trim(),
      target_students: String(row['대상'] ?? '').trim(),
      grad_condition: String(row['졸업생조건'] ?? '').trim(),
      csat_min: String(row['수능최저학력기준'] ?? '').trim(),
      evaluation_method: String(row['전형방법'] ?? '').trim(),
      reflected_subjects: String(row['반영교과'] ?? '').trim(),
      reflected_indicators: String(row['반영지표'] ?? '').trim(),
      course_unit_reflection: String(row['이수단위 반영'] ?? row['이수단위반영'] ?? '').trim(),
      grade_ratio: String(row['학년별 반영비율'] ?? row['학년별반영비율'] ?? '').trim(),
      grad_semesters: String(row['졸업생 반영학기'] ?? row['졸업생반영학기'] ?? '').trim(),
      career_elective_method: String(row['진로선택과목 반영방법'] ?? row['진로선택과목반영방법'] ?? '').trim(),
      remarks: String(row['비고'] ?? '').trim(),
    }
  }).filter(r => r.univ_name || r.track_name)

  if (mappedRows.length === 0) {
    throw new Error('올바른 전형 정보(대학명/전형명)를 찾을 수 없습니다.')
  }

  // 기존 데이터 삭제 후 새 데이터 일괄 삽입
  await deleteRegionalRecommendations()

  const chunkSize = 100
  for (let i = 0; i < mappedRows.length; i += chunkSize) {
    const chunk = mappedRows.slice(i, i + chunkSize)
    const { error } = await supabase.from('regional_recommendations').insert(chunk)
    if (error) throw error
  }

  return { count: mappedRows.length }
}

// 31. 재학생 명단 (enrolled_students) API
export const getEnrolledStudents = async () => {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('enrolled_students')
    .select('*')
    .order('grade', { ascending: true })
    .order('class_no', { ascending: true })
    .order('student_no', { ascending: true })

  if (error) throw error
  return data || []
}

export const importEnrolledStudents = async (file) => {
  if (!supabase) return { count: 0 }
  
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[firstSheetName]
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

  if (!rawRows || rawRows.length === 0) {
    throw new Error('엑셀 파일에 데이터가 없습니다.')
  }

  const enrolledRows = []

  for (let index = 0; index < rawRows.length; index++) {
    const row = rawRows[index]
    const rawStudentPhone = row['학생전화(끝4자리)'] ?? row['학생전화'] ?? row['학생연락처'] ?? row['학생전화번호'] ?? row['학생 H.P'] ?? row['학생HP'] ?? ''
    const rawParentPhone = row['학부모전화(끝4자리)'] ?? row['학부모전화'] ?? row['학부모연락처'] ?? row['학부모전화번호'] ?? row['학부모 H.P'] ?? row['학부모HP'] ?? ''

    const grade = Number(row['학년']) || 3
    const class_no = Number(row['반'])
    const student_no = Number(row['번호']) || Number(row['순번']) || (index + 1)
    const rawName = String(row['이름'] ?? '').trim()
    const rawParentName = String(row['학부모이름'] ?? row['학부모 성명'] ?? '').trim()
    const gender = String(row['성별'] ?? '').trim()
    const remarks = String(row['비고'] ?? '').trim()
    const sPhoneLast4 = formatPhoneLast4(rawStudentPhone)
    const pPhoneLast4 = formatPhoneLast4(rawParentPhone)

    const cleanStudentPhone = String(rawStudentPhone || '').trim().replace(/\D/g, '')
    const sPhoneHash = cleanStudentPhone ? await hashPhone(cleanStudentPhone) : null
    
    const encName = await encryptText(rawName)
    const encParentName = await encryptText(rawParentName)
    const nameHash = await hashText(rawName)

    if (rawName && class_no && student_no) {
      const studentCode = `${grade}${String(class_no).padStart(2, '0')}${String(student_no).padStart(2, '0')}`

      enrolledRows.push({
        student_code: studentCode,
        seq_no: student_no,
        grade,
        class_no,
        student_no,
        name: encName,
        name_hash: nameHash,
        gender,
        remarks,
        student_phone_last4: sPhoneLast4,
        phone_hash: sPhoneHash,
        parent_name: encParentName,
        parent_phone_last4: pPhoneLast4,
        is_enrolled: true,
        status: 'approved'
      })
    }
  }

  if (enrolledRows.length === 0) {
    throw new Error('올바른 학생 정보(학년, 반, 번호, 이름)를 찾을 수 없습니다.')
  }

  // 1. enrolled_students 마스터 테이블에 업서트 (전화번호 SHA-256 암호화 저장)
  const { error: enrolledErr } = await supabase.from('enrolled_students').upsert(enrolledRows, {
    onConflict: 'grade,class_no,student_no'
  })
  if (enrolledErr) throw enrolledErr

  // 2. profiles 테이블 한 번에 조회하여 메모리 인덱싱 (네트워크 요청 1,000번 ➔ 1번으로 극적 최적화)
  const { data: existingProfiles } = await supabase
    .from('profiles')
    .select('id, name, student_code, grade, class_no, seq_no, phone_last4')
    .eq('role', 'student')
    .eq('is_enrolled', true)

  if (existingProfiles && existingProfiles.length > 0) {
    const codeMap = new Map()
    const classSeqMap = new Map()
    const nameClassMap = new Map()

    existingProfiles.forEach(p => {
      if (p.student_code) codeMap.set(p.student_code, p)
      if (p.grade && p.class_no && p.seq_no) {
        classSeqMap.set(`${p.grade}-${p.class_no}-${p.seq_no}`, p)
      }
      if (p.name && p.grade && p.class_no) {
        nameClassMap.set(`${p.name}-${p.grade}-${p.class_no}`, p)
      }
    })

    const updates = []
    profileRows.forEach(p => {
      const sCode = p.student_code
      const csKey = `${p.grade}-${p.class_no}-${p.seq_no}`
      const ncKey = `${p.name}-${p.grade}-${p.class_no}`

      const matched = codeMap.get(sCode) || classSeqMap.get(csKey) || nameClassMap.get(ncKey)
      if (matched) {
        const updatePayload = {
          name: p.name,
          student_code: p.student_code,
          grade: p.grade,
          class_no: p.class_no,
          seq_no: p.seq_no,
          is_enrolled: true
        }
        if (p.phone_last4 && p.phone_last4 !== '0000') {
          updatePayload.phone_last4 = p.phone_last4
        }
        updates.push(supabase.from('profiles').update(updatePayload).eq('id', matched.id))
      }
    })

    if (updates.length > 0) {
      await Promise.all(updates)
    }
  }

  // 3. 미존재 학급(교사 계정) 1회 일괄 조회 및 자동 생성
  const classMap = new Map()
  enrolledRows.forEach(r => {
    const key = `${r.grade}-${r.class_no}`
    if (!classMap.has(key)) classMap.set(key, { grade: r.grade, class_no: r.class_no })
  })

  const { data: existingTeachers } = await supabase
    .from('profiles')
    .select('grade, class_no')
    .eq('role', 'teacher')

  const teacherSet = new Set()
  if (existingTeachers) {
    existingTeachers.forEach(t => teacherSet.add(`${t.grade}-${t.class_no}`))
  }

  const creationTasks = []
  for (const [, c] of classMap) {
    if (!teacherSet.has(`${c.grade}-${c.class_no}`)) {
      const defaultTeacherName = `${c.grade}학년 ${c.class_no}반 담임`
      creationTasks.push(
        upsertClass(c.grade, c.class_no, { teacher_name: defaultTeacherName, password: 'school1234!' }).catch(() => {})
      )
    }
  }

  if (creationTasks.length > 0) {
    await Promise.all(creationTasks)
  }

  return { count: enrolledRows.length }
}
