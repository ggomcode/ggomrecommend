import { supabase } from '../utils/supabaseClient'
import { decryptText } from '../utils/cryptoUtils'
import { formatScore } from '../utils/scorePreviewShared'
import { fetchRoundSchedulesMap, computeRoundDisplayStatus, DEFAULT_SCHEDULES } from '../utils/roundSchedule'
import { deleteApplicationStorageFiles } from '../utils/storageUtils'

// 1. 현재 활성화된 라운드 조회
export const getCurrentRound = async () => {
  if (!supabase) return null

  // 총 선발 회수(total_rounds) 제한값 조회
  let limit = 3
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('total_rounds')
    if (local) {
      const n = parseInt(local, 10)
      if (n >= 1 && n <= 5) limit = n
    }
  }
  try {
    const { data: configLimit } = await supabase.from('config').select('value').eq('key', 'total_rounds').maybeSingle()
    if (configLimit && configLimit.value) {
      const n = parseInt(configLimit.value, 10)
      if (n >= 1 && n <= 5) limit = n
    }
  } catch {}

  const { data: rounds, error } = await supabase
    .from('timeline_rounds')
    .select('*')
    .lte('id', limit)
    .order('id', { ascending: true })

  if (error) throw error
  if (!rounds || rounds.length === 0) return null

  const schedulesMap = await fetchRoundSchedulesMap()

  // 1. 현재 접수 중(OPEN)인 차수가 있으면 낮은 차수(1차 우선) 선택
  for (const r of rounds) {
    const sched = schedulesMap[r.id]
    if (computeRoundDisplayStatus(r, sched) === 'OPEN') return r
  }

  // 2. 접수 전(DRAFT) 상태인 차수가 있으면 가장 낮은 차수(1차) 선택
  for (const r of rounds) {
    const sched = schedulesMap[r.id]
    if (computeRoundDisplayStatus(r, sched) === 'DRAFT') return r
  }

  // 3. 심사 중(CLOSED)인 차수가 있으면 선택
  for (const r of rounds) {
    const sched = schedulesMap[r.id]
    if (computeRoundDisplayStatus(r, sched) === 'CLOSED') return r
  }

  // 4. 모두 FINALIZED이면 첫 차수(1차) 선택
  return rounds[0]
}

// 2. 담당 학급 학생 목록 조회 (enrolled_students 통합 마스터 원장 참조)
export const teacherGetStudents = async () => {
  if (!supabase) return []

  // 현재 로그인한 사용자의 role 확인하여 관리자 여부 판정
  let isAdmin = false
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      if (profile && (profile.role === 'admin' || profile.role === 'ADMIN')) {
        isAdmin = true
      }
    }
  } catch (e) {
    console.warn('role check warn:', e)
  }

  if (isAdmin) {
    // 관리자인 경우 전체 재학생 및 졸업생 목록 조회
    const { data, error } = await supabase
      .from('enrolled_students')
      .select('*')
      .order('is_enrolled', { ascending: false })
      .order('grade', { ascending: true })
      .order('class_no', { ascending: true })
      .order('student_no', { ascending: true })
      .order('student_code', { ascending: true })

    if (error) throw error
    return Promise.all((data || []).map(async s => ({
      id: s.id,
      student_code: s.student_code || `${s.grade}${String(s.class_no).padStart(2, '0')}${String(s.student_no || s.seq_no).padStart(2, '0')}`,
      name: await decryptText(s.name),
      parent_name: await decryptText(s.parent_name),
      is_enrolled: s.is_enrolled !== false,
      grade: s.grade,
      class_no: s.class_no,
      seq_no: s.student_no || s.seq_no,
      phone_last4: s.student_phone_hash ? '****' : '0000',
      status: s.status || 'approved',
      gpa_1_1: s.gpa_1_1 || null,
      gpa_1_2: s.gpa_1_2 || null,
      gpa_1_all: s.gpa_1_all || null,
      gpa_2_1: s.gpa_2_1 || null,
      gpa_2_2: s.gpa_2_2 || null,
      gpa_2_all: s.gpa_2_all || null,
      gpa_3_1: s.gpa_3_1 || null,
      gpa_3_2: s.gpa_3_2 || null,
      gpa_3_all: s.gpa_3_all || null,
      gpa_overall: s.gpa_overall != null ? s.gpa_overall : null,
      grad_year: s.grad_year
    })))
  }

  const savedGrade = localStorage.getItem('teacher_selected_grade')
  const savedClass = localStorage.getItem('teacher_selected_class')

  const targetGrade = savedGrade === 'all' ? 'all' : (savedGrade === '0' ? 0 : 3)
  const targetClassNo = savedClass !== null && savedClass !== '' && savedClass !== 'all' ? Number(savedClass) : 0

  let query = supabase
    .from('enrolled_students')
    .select('*')

  if (targetGrade === 'all') {
    if (targetClassNo > 0) {
      query = query.eq('class_no', targetClassNo)
    }
    query = query
      .order('is_enrolled', { ascending: false })
      .order('grade', { ascending: true })
      .order('class_no', { ascending: true })
      .order('student_no', { ascending: true })
  } else if (targetGrade === 0) {
    query = query.eq('is_enrolled', false).order('student_code', { ascending: true })
  } else {
    query = query.eq('grade', targetGrade).eq('is_enrolled', true)
    if (targetClassNo > 0) {
      query = query.eq('class_no', targetClassNo)
    }
    query = query
      .order('class_no', { ascending: true })
      .order('student_no', { ascending: true })
  }

  const { data, error } = await query
  if (error) throw error

return Promise.all((data || []).map(async s => ({
id: s.id,
student_code: s.student_code || `${s.grade}${String(s.class_no).padStart(2, '0')}${String(s.student_no || s.seq_no).padStart(2, '0')}`,
name: await decryptText(s.name),
parent_name: await decryptText(s.parent_name),
is_enrolled: s.is_enrolled !== false,
grade: s.grade,
class_no: s.class_no,
seq_no: s.student_no || s.seq_no,
phone_last4: s.student_phone_hash ? '****' : '0000',
status: s.status || 'approved',
gpa_1_1: s.gpa_1_1 || null,
gpa_1_2: s.gpa_1_2 || null,
gpa_1_all: s.gpa_1_all || null,
gpa_2_1: s.gpa_2_1 || null,
gpa_2_2: s.gpa_2_2 || null,
gpa_2_all: s.gpa_2_all || null,
gpa_3_1: s.gpa_3_1 || null,
gpa_3_2: s.gpa_3_2 || null,
gpa_3_all: s.gpa_3_all || null,
gpa_overall: s.gpa_overall != null ? s.gpa_overall : null,
grad_year: s.grad_year
})))
}

// 3. 대학 목록 (고유 대학명 리스트)
export const teacherGetUniversities = async () => {
  if (!supabase) return []
  const [{ data, error }, { data: regRecs }] = await Promise.all([
    supabase.from('universities').select('*'),
    supabase.from('regional_recommendations').select('univ_name, track_name, target_students, remarks')
  ])

  if (error) throw error

  const blockedMap = new Set()
  for (const r of (regRecs || [])) {
    const isX = /[×Xx✕✖]|불가/.test(String(r.target_students || '').trim())
    const isClosed = String(r.remarks || '').trim().includes('마감')
    if (isX || isClosed) {
      blockedMap.add(`${String(r.univ_name || '').trim()}__${String(r.track_name || '').trim()}`)
    }
  }

  // 차단되지 않은 대학/전형만 남김
  const validUnivs = (data || []).filter(u => {
    const k = `${String(u.univ_name || '').trim()}__${String(u.track_name || '').trim()}`
    return !blockedMap.has(k)
  })

  // 중복 제거 및 이름순 정렬
  const uniqueNames = [...new Set(validUnivs.map(u => u.univ_name))].sort()
  return uniqueNames.map(name => ({ id: name, univ_name: name }))
}

// 4. 특정 대학의 모집단위(트랙) 목록
export const teacherGetUnivTracks = async (univName) => {
  if (!supabase) return []
  const [{ data, error }, { data: regRecs }] = await Promise.all([
    supabase.from('universities').select('*').eq('univ_name', univName).order('track_name', { ascending: true }),
    supabase.from('regional_recommendations').select('univ_name, track_name, target_students, remarks')
  ])

  if (error) throw error

  const blockedMap = new Set()
  for (const r of (regRecs || [])) {
    const isX = /[×Xx✕✖]|불가/.test(String(r.target_students || '').trim())
    const isClosed = String(r.remarks || '').trim().includes('마감')
    if (isX || isClosed) {
      blockedMap.add(`${String(r.univ_name || '').trim()}__${String(r.track_name || '').trim()}`)
    }
  }

  const validTracks = (data || []).filter(u => {
    const k = `${String(u.univ_name || '').trim()}__${String(u.track_name || '').trim()}`
    return !blockedMap.has(k)
  })

  return validTracks.map(u => ({
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
const studentsMap = {}
students.forEach(s => { studentsMap[s.id] = s })

  // 총 선발 회수(total_rounds) 제한값 조회
  let limit = 3
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('total_rounds')
    if (local) {
      const n = parseInt(local, 10)
      if (n >= 1 && n <= 5) limit = n
    }
  }
  try {
    const { data: configLimit } = await supabase.from('config').select('value').eq('key', 'total_rounds').maybeSingle()
    if (configLimit && configLimit.value) {
      const n = parseInt(configLimit.value, 10)
      if (n >= 1 && n <= 5) limit = n
    }
  } catch {}

  let query = supabase
    .from('applications')
    .select('*')
    .in('student_id', studentIds)

  if (roundId !== undefined && roundId !== null && roundId !== '') {
    query = query.eq('round', Number(roundId))
  } else {
    query = query.lte('round', limit)
  }

  const { data: apps, error } = await query

  if (error) {
    console.error('teacherGetApplications error:', error)
    return []
  }
  if (!apps) return []

  // 1. 전학급 학생 정보 & 대학교 정보 한 번에 로드 (실시간 순위 계산용)
  const [{ data: allEnrolled }, { data: univs }] = await Promise.all([
    supabase.from('enrolled_students').select('id, name, gpa_overall'),
    supabase.from('universities').select('*')
  ])

  const enrolledMap = {}
  allEnrolled?.forEach(e => { enrolledMap[e.id] = e })

  const univsMap = {}
  univs?.forEach(u => { univsMap[u.id] = u })

  // 2. 해당 차수의 전학급 지원서 전체 로드하여 대학교별 순위 계산
  let allRoundAppsQuery = supabase.from('applications').select('*')
  if (roundId !== undefined && roundId !== null && roundId !== '') {
    allRoundAppsQuery = allRoundAppsQuery.eq('round', Number(roundId))
  } else {
    allRoundAppsQuery = allRoundAppsQuery.lte('round', limit)
  }
  const { data: allRoundApps } = await allRoundAppsQuery

// 대학교별로 묶어서 성적순 정렬
const univGrouped = {}
allRoundApps?.forEach(ap => {
if (!univGrouped[ap.univ_id]) univGrouped[ap.univ_id] = []
univGrouped[ap.univ_id].push(ap)
})

// 대학교별 rank Map 생성
const rankMap = {}
Object.keys(univGrouped).forEach(univId => {
const list = univGrouped[univId]
list.sort((a, b) => {
const stA = enrolledMap[a.student_id] || {}
const stB = enrolledMap[b.student_id] || {}

const scoreA = a.univ_calc_score != null ? Number(a.univ_calc_score) : (a.manual_score != null ? Number(a.manual_score) : null)
const scoreB = b.univ_calc_score != null ? Number(b.univ_calc_score) : (b.manual_score != null ? Number(b.manual_score) : null)

if (scoreA !== null && scoreB !== null && scoreA !== scoreB) {
return scoreB - scoreA
}

const gpaA = stA.gpa_overall != null ? Number(stA.gpa_overall) : 99
const gpaB = stB.gpa_overall != null ? Number(stB.gpa_overall) : 99

if (gpaA !== gpaB) {
return gpaA - gpaB
}

return 0
})

list.forEach((ap, idx) => {
rankMap[ap.id] = { rank: idx + 1, total: list.length }
})
})

return apps.map(ap => {
const s = studentsMap[ap.student_id] || {}
const u = univsMap[ap.univ_id] || {}
const rInfo = rankMap[ap.id] || { rank: 1, total: 1 }

return {
id: ap.id,
student_id: ap.student_id,
track_id: ap.univ_id,
round_id: ap.round,
abandoned: ap.is_abandoned,
excluded: ap.is_excluded,
excluded_reason: ap.excluded_reason,
department_name: ap.department_name,
student_code: s.student_code || '',
name: s.name || '',
grade: s.grade || 3,
class_no: s.class_no || null,
seq_no: s.seq_no || null,
is_enrolled: s.is_enrolled !== false,
gpa_overall: s.gpa_overall != null ? s.gpa_overall : null,
manual_score: ap.manual_score,
univ_calc_score: ap.univ_calc_score,
univ_id: ap.univ_id,
univ_name: u.univ_name || ap.univ_name || '',
track_name: u.track_name || ap.track_name || '',
has_quota: u.has_quota || false,
quota_limit: u.quota_limit || null,
univ_rank: rInfo.rank,
univ_total_count: rInfo.total,
recommended: ap.is_recommended,
scanned_doc_url: ap.scanned_doc_url,
round_status: 'OPEN'
}
})
}

// 9. 교사의 지원서 수동 등록 (재학생 및 졸업생)
// body: { student_id, track_id, round_id, department_name, manual_score, parent_name, parent_phone }
export const teacherCreateApplication = async (body) => {
if (!supabase) return

// profiles FK는 enrolled_students 기반 학생에게 불필요 - auth.users가 없으면 FK 위반 발생
// 지원서 등록 시 별도 profiles upsert 없이 진행

const payload = {
student_id: body.student_id,
univ_id: body.track_id,
round: body.round_id,
department_name: body.department_name,
manual_score: body.manual_score || null,
univ_calc_score: body.univ_calc_score || body.manual_score || null,
parent_name: body.parent_name || '미입력',
parent_phone: body.parent_phone || '000-0000-0000',
student_signature_url: body.student_signature_url || null,
parent_signature_url: body.parent_signature_url || body.student_signature_url || null
}

let { data, error } = await supabase.from('applications').insert(payload)
if (error && (error.message?.includes('parent_signature_url') || error.message?.includes('univ_calc_score'))) {
delete payload.parent_signature_url
delete payload.univ_calc_score
const retry = await supabase.from('applications').insert(payload)
if (retry.error) throw retry.error
} else if (error) {
throw error
}

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

// 10. 지원서 삭제 (스토리지 서명/문서 파일 및 DB 레코드 완전 삭제)
export const teacherDeleteApplication = async (sid, tid, rid) => {
  if (!supabase) return

  // 1. 해당 지원서 데이터 조회 (첨부된 서명/문서 URL 획득)
  const { data: app } = await supabase
    .from('applications')
    .select('*')
    .eq('student_id', sid)
    .eq('univ_id', tid)
    .eq('round', rid)
    .maybeSingle()

  if (app) {
    await deleteApplicationStorageFiles(app)
  }

  // 2. DB 레코드 삭제
  const { error } = await supabase
    .from('applications')
    .delete()
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
        action: 'DELETE_APPLICATION',
        details: { student_id: sid, univ_id: tid, round: rid }
      })
    }
  } catch (e) {}

  return true
}

// 10-1. 지원서 수정 (지원전형·학과·환산점수)
export const teacherUpdateApplication = async (appId, updates) => {
  if (!supabase) return
  const payload = {}
  if (updates.univ_id      != null) payload.univ_id        = updates.univ_id
  if (updates.department_name != null) payload.department_name = updates.department_name
  if (updates.univ_calc_score != null) payload.univ_calc_score = updates.univ_calc_score
  else if (updates.univ_calc_score === '') payload.univ_calc_score = null

  const { error } = await supabase
    .from('applications')
    .update(payload)
    .eq('id', appId)

  if (error) throw error

  try {
    const userRes = await supabase.auth.getUser()
    if (userRes?.data?.user) {
      await supabase.from('audit_logs').insert({
        actor_id: userRes.data.user.id,
        action: 'TEACHER_EDIT_APP',
        details: { app_id: appId, updates }
      })
    }
  } catch (e) { console.warn('감사 로그 작성 실패:', e) }
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

  // 총 선발 회수(total_rounds) 제한값 조회
  let limit = 3
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('total_rounds')
    if (local) {
      const n = parseInt(local, 10)
      if (n >= 1 && n <= 5) limit = n
    }
  }
  try {
    const { data: configLimit } = await supabase.from('config').select('value').eq('key', 'total_rounds').maybeSingle()
    if (configLimit && configLimit.value) {
      const n = parseInt(configLimit.value, 10)
      if (n >= 1 && n <= 5) limit = n
    }
  } catch {}

  // 모든 라운드 정보 및 일정 Map 획득
  const [{ data: rawRounds }, schedulesMap, { data: univs }] = await Promise.all([
    supabase.from('timeline_rounds').select('*').lte('id', limit).order('id', { ascending: true }),
    fetchRoundSchedulesMap(),
    supabase.from('universities').select('*')
  ])

const univsMap = {}
univs?.forEach(u => { univsMap[u.id] = u })

const rounds = (rawRounds || []).map(r => {
const sched = schedulesMap[r.id] || DEFAULT_SCHEDULES[r.id]
const status = computeRoundDisplayStatus(r, sched)
return {
...r,
status,
schedule: sched
}
})

// 교사 소속 학생 획득 (반환 대상을 필터링하기 위함)
const students = await teacherGetStudents()
if (students.length === 0) return { rounds: rounds || [], results: [] }
const studentIds = students.map(s => s.id)

  const [{ data: allStudents }, { data: allApps }] = await Promise.all([
    supabase.from('enrolled_students').select('id, name, student_code, is_enrolled, gpa_overall, seq_no, grade, class_no'),
    supabase.from('applications').select('*').lte('round', limit)
  ])

if (!allApps) return { rounds: rounds || [], results: [] }

async function autoProcessUnselectedApps(allApps, schoolStudentsMap, univsMap, rounds) {
  if (!supabase || !allApps || allApps.length === 0) return

  const roundStatusMap = {}
  ;(rounds || []).forEach(r => { roundStatusMap[r.id] = r.status })

  // OPEN 상태인 차수의 경우 선발 확정 상태를 리셋하여 접수 완료 상태로 유지
  for (const ap of allApps) {
    if (roundStatusMap[ap.round] === 'OPEN' && (ap.is_recommended || ap.is_excluded)) {
      ap.is_recommended = false
      ap.is_excluded = false
      ap.excluded_reason = null
      await supabase
        .from('applications')
        .update({ is_recommended: false, is_excluded: false, excluded_reason: null })
        .eq('id', ap.id)
    }
  }

  // CLOSED 또는 FINALIZED 상태인 차수만 자동 선발 수행 (OPEN인 경우 접수 중이므로 선발 미진행)
  const targetRoundIds = [
    ...new Set(
      allApps
        .filter(ap => !ap.is_abandoned && (roundStatusMap[ap.round] === 'CLOSED' || roundStatusMap[ap.round] === 'FINALIZED'))
        .map(ap => ap.round)
    )
  ]

  if (targetRoundIds.length === 0) return

  for (const rId of targetRoundIds) {
    const roundApps = allApps.filter(ap => ap.round === rId && !ap.is_abandoned)
    if (roundApps.length === 0) continue

    const grouped = {}
    roundApps.forEach(ap => {
      if (!grouped[ap.univ_id]) grouped[ap.univ_id] = []
      grouped[ap.univ_id].push(ap)
    })

    for (const uId of Object.keys(grouped)) {
      const uApps = grouped[uId]
      const univ = univsMap[uId] || {}
      const hasQuota = univ.has_quota !== false && univ.quota_limit > 0
      const limit = hasQuota ? Number(univ.quota_limit) : 99999

      uApps.sort((a, b) => {
        const stA = schoolStudentsMap[a.student_id] || {}
        const stB = schoolStudentsMap[b.student_id] || {}

        const scoreA = a.univ_calc_score != null ? Number(a.univ_calc_score) : (a.manual_score != null ? Number(a.manual_score) : null)
        const scoreB = b.univ_calc_score != null ? Number(b.univ_calc_score) : (b.manual_score != null ? Number(b.manual_score) : null)

        if (scoreA !== null && scoreB !== null && scoreA !== scoreB) {
          return scoreB - scoreA
        }

        const gpaA = stA.gpa_overall != null ? Number(stA.gpa_overall) : 99
        const gpaB = stB.gpa_overall != null ? Number(stB.gpa_overall) : 99

        if (gpaA !== gpaB) {
          return gpaA - gpaB
        }

        return new Date(a.created_at || 0) - new Date(b.created_at || 0)
      })

      for (let idx = 0; idx < uApps.length; idx++) {
        const ap = uApps[idx]
        const rank = idx + 1

        if (rank <= limit) {
          ap.is_recommended = true
          ap.is_excluded = false
          ap.excluded_reason = null
          await supabase
            .from('applications')
            .update({ is_recommended: true, is_excluded: false, excluded_reason: null })
            .eq('id', ap.id)
        } else {
          ap.is_recommended = false
          ap.is_excluded = true
          ap.excluded_reason = '추천인원 초과 (성적 미달)'
          await supabase
            .from('applications')
            .update({ is_recommended: false, is_excluded: true, excluded_reason: '추천인원 초과 (성적 미달)' })
            .eq('id', ap.id)
        }
      }
    }
  }
}

const schoolStudentsMap = {}
for (const s of (allStudents || [])) {
const decName = await decryptText(s.name)
schoolStudentsMap[s.id] = {
id: s.id,
name: decName,
student_code: s.student_code,
is_enrolled: s.is_enrolled !== false,
gpa_overall: s.gpa_overall,
seq_no: s.seq_no,
grade: s.grade,
class_no: s.class_no
}
}

// 마감된 차수(CLOSED / FINALIZED)만 자동 선발 처리 (OPEN 차수는 접수 완료 상태 유지)
await autoProcessUnselectedApps(allApps, schoolStudentsMap, univsMap, rounds)

// 2. 대학(univ_id) & 라운드(round)별로 모든 학교 지원서를 그룹화하여 학교 단위 석차 계산
const grouped = {}
allApps.forEach(ap => {
const key = `${ap.univ_id}-${ap.round}`
if (!grouped[key]) grouped[key] = []
grouped[key].push(ap)
})

const rankMap = {}
const scoreTextMap = {}
const totalScoreMap = {}

Object.keys(grouped).forEach(key => {
const groupApps = grouped[key]

// 정렬 규정: (1) 대학 환산점수(univ_calc_score 또는 manual_score) 높은 순, (2) 전체 석차등급(gpa_overall) 낮은 순 (상위 성적)
groupApps.sort((a, b) => {
const stA = schoolStudentsMap[a.student_id] || {}
const stB = schoolStudentsMap[b.student_id] || {}

const scoreA = a.univ_calc_score != null ? Number(a.univ_calc_score) : (a.manual_score != null ? Number(a.manual_score) : null)
const scoreB = b.univ_calc_score != null ? Number(b.univ_calc_score) : (b.manual_score != null ? Number(b.manual_score) : null)

if (scoreA !== null && scoreB !== null && scoreA !== scoreB) {
return scoreB - scoreA
}

const gpaA = stA.gpa_overall != null ? Number(stA.gpa_overall) : 99
const gpaB = stB.gpa_overall != null ? Number(stB.gpa_overall) : 99

if (gpaA !== gpaB) {
return gpaA - gpaB
}

return 0
})

let rank = 1
let skipCount = 0
let prevScore = null
let prevGpa = null

groupApps.forEach((ap, idx) => {
const st = schoolStudentsMap[ap.student_id] || {}
const currentScore = ap.univ_calc_score != null ? Number(ap.univ_calc_score) : (ap.manual_score != null ? Number(ap.manual_score) : null)
const currentGpa = st.gpa_overall != null ? Number(st.gpa_overall) : null

if (idx > 0) {
if (currentScore === prevScore && currentGpa === prevGpa) {
skipCount++
} else {
rank += skipCount + 1
skipCount = 0
}
}

prevScore = currentScore
prevGpa = currentGpa

let finalRank = rank
if (ap.is_excluded) {
if (!ap.original_rank) {
supabase.from('applications').update({ original_rank: rank }).eq('id', ap.id).then(() => {})
}
finalRank = ap.original_rank || rank
}

rankMap[ap.id] = finalRank

// 총점 영역에 환산점수(있을 시) 또는 내신 석차등급 표기 포맷팅
let scoreText = ''
let totalScoreValue = 0
if (currentScore != null && currentScore > 0) {
scoreText = `${formatScore(currentScore)}점`
totalScoreValue = currentScore
} else if (currentGpa != null && currentGpa > 0) {
scoreText = `${currentGpa.toFixed(2)}등급`
totalScoreValue = currentGpa
} else {
scoreText = '-'
totalScoreValue = 0
}

scoreTextMap[ap.id] = scoreText
totalScoreMap[ap.id] = totalScoreValue
})
})

// 3. 교사의 반 소속 학생 지원서만 걸러서 최종 결과 배열로 변환
const results = []
const teacherApps = allApps.filter(ap => studentIds.includes(ap.student_id))

teacherApps.forEach(ap => {
const st = schoolStudentsMap[ap.student_id] || {}
const u = univsMap[ap.univ_id] || {}
const finalRank = rankMap[ap.id] || 1
const scoreText = scoreTextMap[ap.id] || '-'
const totalScore = totalScoreMap[ap.id] || 0

results.push({
id: ap.id,
student_id: ap.student_id,
track_id: ap.univ_id,
round: ap.round,
round_id: ap.round,
recommended_round: ap.recommended_round || ap.round,
abandoned_round: ap.abandoned_round || ap.round,
total_score: totalScore,
score_text: scoreText,
score_detail: {},
ranking: finalRank,
track_rank: finalRank,
recommended: ap.is_recommended,
abandoned: ap.is_abandoned,
scanned_doc_url: ap.scanned_doc_url,
student_signature_url: ap.student_signature_url,
parent_signature_url: ap.parent_signature_url,
abandon_reason: ap.abandon_reason,
abandoned_doc_url: ap.abandoned_doc_url,
abandoned_at: ap.abandoned_at,
parent_name: ap.parent_name || st.parent_name || '',
excluded: ap.is_excluded,
excluded_reason: ap.excluded_reason,
student_code: st.student_code || '',
name: st.name || '',
grade: st.grade || 3,
class_no: st.class_no || null,
seq_no: st.seq_no || null,
is_enrolled: st.is_enrolled !== false,
univ_name: u.univ_name || ap.univ_name || '',
track_name: u.track_name || ap.track_name || '',
department_name: ap.department_name,
universities: u,
raw_app: ap
})
})

return { rounds: rounds || [], results }
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

// 17. 추천 상태 설정 및 전학급 대학교별 추천 제한인원(Quota) 비교/정렬 로직
export const teacherSetRecommendationStatus = async (studentId, univId, roundId, isRecommendRequested) => {
if (!supabase) return

// 1. 해당 대학(univId) 정보 조회 (has_quota 및 quota_limit 확인)
const { data: univ } = await supabase
.from('universities')
.select('*')
.eq('id', univId)
.single()

// 2. 대상 지원서 상태 1차 업데이트
if (!isRecommendRequested) {
// 추천 해제 -> '대기' 상태로 전환
await supabase
.from('applications')
.update({
is_recommended: false,
is_excluded: false,
excluded_reason: null
})
.eq('student_id', studentId)
.eq('univ_id', univId)
.eq('round', roundId)
} else {
// 추천 희망 -> 일단 is_recommended = true 설정
await supabase
.from('applications')
.update({
is_recommended: true,
is_excluded: false,
excluded_reason: null
})
.eq('student_id', studentId)
.eq('univ_id', univId)
.eq('round', roundId)
}

// 3. 해당 대학교(univId) 및 차수(roundId)의 전학급 모든 지원서 조회
const { data: allUnivApps } = await supabase
.from('applications')
.select('*')
.eq('univ_id', univId)
.eq('round', roundId)
.eq('is_abandoned', false)

if (!allUnivApps || allUnivApps.length === 0) return

// 학생 정보(석차등급 gpa_overall) 결합을 위해 enrolled_students 조회
const { data: allStudents } = await supabase
.from('enrolled_students')
.select('id, name, gpa_overall, is_enrolled')

const studentMap = {}
allStudents?.forEach(s => { studentMap[s.id] = s })

// 4. 추천 대상 지원서들(is_recommended = true 또는 is_excluded = true) 필터링
const targetApps = allUnivApps.filter(ap => ap.is_recommended || ap.is_excluded)

// 정렬 규칙 (전학급 대학교별 성적 비교):
// (1) 대학별 환산점수(univ_calc_score 또는 manual_score)가 있으면 높은 점수 우선 (내림차순)
// (2) 석차등급(gpa_overall): 숫자가 낮을수록 상위 (오름차순, 예: 1.20 < 1.45)
targetApps.sort((a, b) => {
const stA = studentMap[a.student_id] || {}
const stB = studentMap[b.student_id] || {}

const scoreA = a.univ_calc_score != null ? Number(a.univ_calc_score) : (a.manual_score != null ? Number(a.manual_score) : null)
const scoreB = b.univ_calc_score != null ? Number(b.univ_calc_score) : (b.manual_score != null ? Number(b.manual_score) : null)

// 1. 대학별 환산점수 비교 (높을수록 우선)
if (scoreA !== null && scoreB !== null && scoreA !== scoreB) {
return scoreB - scoreA
}

// 2. 석차등급 비교 (낮은 숫자 = 상위 성적)
const gpaA = stA.gpa_overall != null ? Number(stA.gpa_overall) : 99
const gpaB = stB.gpa_overall != null ? Number(stB.gpa_overall) : 99

if (gpaA !== gpaB) {
return gpaA - gpaB
}

return 0
})

// 5. 대학교의 추천 제한 인원(quota_limit) 체크
const hasQuota = univ?.has_quota && univ?.quota_limit > 0
const limit = hasQuota ? univ.quota_limit : 99999

for (let idx = 0; idx < targetApps.length; idx++) {
const ap = targetApps[idx]
const rank = idx + 1

if (rank <= limit) {
// 상위 인원 -> 추천 확정
await supabase
.from('applications')
.update({
is_recommended: true,
is_excluded: false,
excluded_reason: null
})
.eq('id', ap.id)
} else {
// 제한 인원 초과 -> 추천 보류(성적 미달)
await supabase
.from('applications')
.update({
is_recommended: false,
is_excluded: true,
excluded_reason: '추천인원 초과 (성적 미달)'
})
.eq('id', ap.id)
}
}
}
