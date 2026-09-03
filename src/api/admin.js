import { supabase } from '../utils/supabaseClient'
import * as XLSX from 'xlsx'
import { formatPhoneLast4, hashPhone, cleanFullPhone } from '../utils/phoneUtils'
import { encryptText, decryptText, hashText } from '../utils/cryptoUtils'
import { fetchRoundSchedulesMap, computeRoundDisplayStatus } from '../utils/roundSchedule'
import { deleteApplicationStorageFiles } from '../utils/storageUtils'

// Helper for error parsing
export async function blobErrMsg(e) {
  return e.message ?? '오류가 발생했습니다'
}

// 현재 활성화된 라운드 조회
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
  } catch { }

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

export const getOverview = async (targetRoundId = null) => {
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
  } catch { }

  const version = '0.9.99'
  const server_addr = typeof window !== 'undefined' ? window.location.host : 'localhost'

  // 레거시 성적 설정 키 config 테이블 자동 삭제 정리
  try {
    supabase.from('config').delete().in('key', ['global_course_grades', 'global_course_grades_detail']).then(() => { })
  } catch { }

  // [1] 기본 라운드, 학급(교사), 대학, 학생 수, 누적 통계 쿼리를 병렬로 한 번에 실행
  const [
    allRoundsLimitRes,
    studentCountRes,
    teachersRes,
    allAppsRes
  ] = await Promise.all([
    supabase.from('timeline_rounds').select('*').lte('id', limit).order('id', { ascending: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('profiles').select('*').eq('role', 'teacher').order('grade', { ascending: true }).order('class_no', { ascending: true }),
    supabase.from('applications').select('id, student_id, univ_id, round, is_recommended, is_abandoned').lte('round', limit)
  ])

  const allApps = allAppsRes.data || []
  const roundsList = allRoundsLimitRes.data || []
  const schedulesMap = await fetchRoundSchedulesMap()

  // 현재까지 실제로 도달/진행된 최고 차수 계산
  let maxReachedRound = 1
  for (const r of roundsList) {
    const sched = schedulesMap[r.id]
    const hasApps = allApps.some(a => a.round === r.id)
    const status = computeRoundDisplayStatus(r, sched)
    if (hasApps || status !== 'DRAFT') {
      if (r.id > maxReachedRound) {
        maxReachedRound = r.id
      }
    }
  }

  // 1. 누적 지원자 (학생 수 vs 지원 건수)
  const applicantStudentsSet = new Set(allApps.map(a => a.student_id))
  const applicantStudentsCount = applicantStudentsSet.size
  const totalApplicantsCount = allApps.length

  // 2. 확정 추천자 (학생 수 vs 추천 건수)
  const confirmedApps = allApps.filter(a => a.is_recommended)
  const confirmedStudentsSet = new Set(confirmedApps.map(a => a.student_id))
  const confirmedStudentsCount = confirmedStudentsSet.size
  const confirmedCasesCount = confirmedApps.length

  // 3. 포기자 (학생 수 vs 포기 건수)
  const abandonedApps = allApps.filter(a => a.is_abandoned)
  const abandonedStudentsSet = new Set(abandonedApps.map(a => a.student_id))
  const abandonedStudentsCount = abandonedStudentsSet.size
  const abandonedCasesCount = abandonedApps.length

  let round = null
  if (targetRoundId != null) {
    const found = roundsList.find(r => r.id === Number(targetRoundId))
    if (found) {
      round = found
    } else {
      const { data: dbRound } = await supabase.from('timeline_rounds').select('*').eq('id', Number(targetRoundId)).maybeSingle()
      round = dbRound
    }
  } else {
    round = await getCurrentRound()
  }

  const studentCount = studentCountRes.count || 0
  const teachers = teachersRes.data || []
  const totalRounds = roundsList.length

  // [2] 현재 조회 대상 라운드의 지원서와 재학생 매핑 정보를 조회
  const appCountByUniv = new Map()
  const appCountByClass = new Map()
  const gradApplicantsSet = new Set()

  if (round) {
    const [appsRes, studentsRes] = await Promise.all([
      supabase.from('applications').select('univ_id, student_id').eq('round', round.id),
      supabase.from('enrolled_students').select('id, grade, class_no, is_enrolled')
    ])
    const roundApps = appsRes.data || []
    const students = studentsRes.data || []

    const enrolledMap = new Map()
    for (const s of students) {
      enrolledMap.set(s.id, { grade: s.grade, class_no: s.class_no, is_enrolled: s.is_enrolled !== false })
    }

    for (const app of roundApps) {
      if (app.univ_id) {
        appCountByUniv.set(app.univ_id, (appCountByUniv.get(app.univ_id) || 0) + 1)
      }
      const st = enrolledMap.get(app.student_id)
      if (st) {
        if (!st.is_enrolled || !st.grade || Number(st.grade) === 0) {
          gradApplicantsSet.add(app.student_id)
        } else {
          const key = `${st.grade}_${st.class_no}`
          if (!appCountByClass.has(key)) appCountByClass.set(key, new Set())
          appCountByClass.get(key).add(app.student_id)
        }
      } else {
        gradApplicantsSet.add(app.student_id)
      }
    }
  }

  // [3] 일반 학급과 졸업생 담당 교사 분리 생성 (교사 이름 복호화)
  const regularTeachers = []
  let graduatedTeacher = null

  for (const t of teachers) {
    if (!t.grade || Number(t.grade) === 0) {
      graduatedTeacher = t
    } else {
      regularTeachers.push(t)
    }
  }

  const classes = await Promise.all(regularTeachers.map(async t => {
    const key = `${t.grade}_${t.class_no}`
    const count = appCountByClass.has(key) ? appCountByClass.get(key).size : 0
    const decName = t.name === '관리자' ? '관리자' : await decryptText(t.name)
    return {
      grade: t.grade,
      class_no: t.class_no,
      teacher_name: decName || '담임교사',
      count,
      submitted: count,
      confirmed: true
    }
  }))

  const graduatedObj = graduatedTeacher ? {
    grade: 0,
    class_no: 0,
    teacher_name: (graduatedTeacher.name === '관리자' ? '관리자' : await decryptText(graduatedTeacher.name)) || '졸업생 담당',
    submitted: gradApplicantsSet.size,
    count: gradApplicantsSet.size,
    confirmed: true
  } : null

  // [4] 대학/모집단위 배열 생성 (정원 계산 헬퍼 getQuotaStats와 연동하여 정밀한 정원 계산 반영)
  // 이전 차수에서 추천 확정되어 아직 포기되지 않은(유효한) 추천 인원 집계
  const priorConfirmedByTrack = new Map()

  if (round && round.id > 1) {
    const { data: priorApps } = await supabase
      .from('applications')
      .select('univ_id')
      .lt('round', round.id)
      .eq('is_recommended', true)
      .eq('is_abandoned', false)

    for (const app of (priorApps || [])) {
      if (app.univ_id) {
        priorConfirmedByTrack.set(app.univ_id, (priorConfirmedByTrack.get(app.univ_id) || 0) + 1)
      }
    }
  }

  const quotaStats = await getQuotaStats()
  const universities = (quotaStats || []).map(u => {
    let univPriorUsed = 0
    for (const t of u.tracks) {
      univPriorUsed += (priorConfirmedByTrack.get(t.track_id) || 0)
    }
    const remainingUnivTotal = u.total_quota !== null ? Math.max(0, u.total_quota - univPriorUsed) : null

    return {
      univ_id: u.univ_id,
      univ_name: u.univ_name,
      total_quota: u.total_quota,
      prior_total_used: univPriorUsed,
      available_total_quota: remainingUnivTotal,
      tracks: u.tracks.map(t => {
        const applicants = appCountByUniv.get(t.track_id) || 0
        const trackPriorUsed = priorConfirmedByTrack.get(t.track_id) || 0
        const remainingUnit = t.unit_quota !== null ? Math.max(0, t.unit_quota - trackPriorUsed) : null

        let availableQuota = null
        if (remainingUnit !== null && remainingUnivTotal !== null) {
          availableQuota = Math.min(remainingUnit, remainingUnivTotal)
        } else if (remainingUnit !== null) {
          availableQuota = remainingUnit
        } else if (remainingUnivTotal !== null) {
          availableQuota = remainingUnivTotal
        }

        return {
          track_id: t.track_id,
          track_name: t.track_name,
          unit_quota: t.unit_quota,
          prior_used: trackPriorUsed,
          available_quota: availableQuota,
          applicants
        }
      })
    }
  })

  return {
    version,
    server_addr,
    round,
    all_rounds: allRoundsLimitRes.data || [],
    student_count: studentCount,
    classes,
    graduated: graduatedObj,
    universities,
    all_time: {
      total_rounds: totalRounds,
      progressed_rounds: maxReachedRound,
      applicant_students: applicantStudentsCount,
      applicant_cases: totalApplicantsCount,
      confirmed_students: confirmedStudentsCount,
      confirmed_cases: confirmedCasesCount,
      abandoned_students: abandonedStudentsCount,
      abandoned_cases: abandonedCasesCount,
      total_applicants: applicantStudentsCount,
      confirmed: confirmedStudentsCount,
      abandoned: abandonedStudentsCount
    }
  }
}

// 2. 학급(교사) 목록 조회 (교사 이름 복호화)
export const getClasses = async () => {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'teacher')
    .order('grade', { ascending: true })
    .order('class_no', { ascending: true })

  if (error) throw error
  return Promise.all(data.map(async t => ({
    grade: t.grade,
    class_no: t.class_no,
    teacher_name: (t.name === '관리자' ? '관리자' : await decryptText(t.name)) || '담임교사'
  })))
}

// 3. 학급(교사) 추가 및 비밀번호 설정 (교사 이름 AES-256 암호화 저장)
export const upsertClass = async (grade, classNo, body) => {
  if (!supabase) return
  const rawName = (body.teacher_name || '').trim() || `${grade}학년 ${classNo}반 담임`
  const encName = rawName === '관리자' ? '관리자' : await encryptText(rawName)

  // 1. 비밀번호가 넘어왔거나 신규 계정 생성 시 RPC 호출
  if (body.password) {
    const { error: rpcErr } = await supabase
      .rpc('create_teacher_account', {
        p_grade: grade,
        p_class_no: classNo,
        p_name: encName,
        p_password: body.password
      })
    if (rpcErr) throw rpcErr
  }

  // 2. profiles 테이블에서 해당 학급 교사 존재 확인
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'teacher')
    .eq('grade', grade)
    .eq('class_no', classNo)
    .maybeSingle()

  if (existing) {
    // 기존 학급이 있으면 이름(암호화된 이름)만 업데이트
    const { error } = await supabase
      .from('profiles')
      .update({ name: encName })
      .eq('id', existing.id)
    if (error) throw error
  } else if (!body.password) {
    // 신규 학급 생성인데 비밀번호가 없으면 기본 비밀번호로 계정 생성
    const { error: rpcErr } = await supabase
      .rpc('create_teacher_account', {
        p_grade: grade,
        p_class_no: classNo,
        p_name: encName,
        p_password: 'teacher1234!'
      })
    if (rpcErr) throw rpcErr
  }

  return true
}

// 4. 학급(교사) 삭제
export const deleteClass = async (grade, classNo) => {
  if (!supabase) return
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('role', 'teacher')
    .eq('grade', grade)
    .eq('class_no', classNo)

  if (error) throw error
}

// 학급 일괄 관리 엑셀 템플릿/내보내기/가져오기 헬퍼
export const downloadClassTemplate = () => { }
export const exportClasses = () => { }
export const importClasses = () => { }

// 5. 전형요소 관리 (로컬스토리지 및 Supabase 저장소)
const AREAS_STORAGE_KEY = 'ggom_eval_areas_list'

function getLocalAreas() {
  try {
    const raw = localStorage.getItem(AREAS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function setLocalAreas(list) {
  try {
    localStorage.setItem(AREAS_STORAGE_KEY, JSON.stringify(list))
  } catch { }
}

const DEFAULT_GRADE_AREA = {
  id: 'default_grade_area',
  name: '교과 내신',
  max_score: 100,
  calc_type: 'NUMERIC',
  lookup_scope: 'COMPOSITE',
  match_mode: 'EXACT',
  category_agg: null,
  teacher_editable: false,
  unit: '등급',
  created_at: new Date().toISOString()
}

export const getAreas = async () => {
  let list = []
  if (supabase) {
    try {
      const { data } = await supabase.from('config').select('value').eq('key', 'eval_areas_store').maybeSingle()
      if (data && data.value) {
        try { list = JSON.parse(data.value) } catch { }
      }
    } catch { }
  }

  if (!list || list.length === 0) {
    list = getLocalAreas()
  }

  // 만약 등록된 전형요소가 없다면 '교과 내신' (총점 100점)을 기본 디폴트로 자동 생성 및 저장
  if (!list || list.length === 0) {
    list = [DEFAULT_GRADE_AREA]
    setLocalAreas(list)
    if (supabase) {
      try {
        await supabase.from('config').upsert({ key: 'eval_areas_store', value: JSON.stringify(list) })
      } catch { }
    }
  }

  setLocalAreas(list)
  return list
}

export const createArea = async (body) => {
  const current = getLocalAreas()
  const newArea = {
    id: Date.now(),
    name: body.name,
    max_score: parseFloat(body.max_score) || 100,
    calc_type: body.calc_type || 'NUMERIC',
    lookup_scope: body.lookup_scope || 'SIMPLE',
    teacher_editable: Boolean(body.teacher_editable),
    match_mode: body.match_mode || null,
    category_agg: body.category_agg || null,
    unit: body.unit || null,
    created_at: new Date().toISOString()
  }
  current.push(newArea)
  setLocalAreas(current)
  if (supabase) {
    try {
      await supabase.from('config').upsert({ key: 'eval_areas_store', value: JSON.stringify(current) })
    } catch { }
  }
  return newArea
}

export const updateArea = async (id, body) => {
  const current = getLocalAreas()
  const idx = current.findIndex(a => a.id === id)
  if (idx !== -1) {
    if (body.name !== undefined) current[idx].name = body.name
    if (body.teacher_editable !== undefined) current[idx].teacher_editable = Boolean(body.teacher_editable)
    if (body.max_score !== undefined) current[idx].max_score = body.max_score
    if (body.calc_type !== undefined) current[idx].calc_type = body.calc_type
    if (body.lookup_scope !== undefined) current[idx].lookup_scope = body.lookup_scope
    if (body.match_mode !== undefined) current[idx].match_mode = body.match_mode
    if (body.category_agg !== undefined) current[idx].category_agg = body.category_agg
    if (body.unit !== undefined) current[idx].unit = body.unit
    setLocalAreas(current)
    if (supabase) {
      try {
        await supabase.from('config').upsert({ key: 'eval_areas_store', value: JSON.stringify(current) })
      } catch { }
    }
  }
  return current[idx]
}

export const deleteArea = async (id) => {
  let current = getLocalAreas()
  current = current.filter(a => a.id !== id)
  setLocalAreas(current)
  if (supabase) {
    try {
      await supabase.from('config').upsert({ key: 'eval_areas_store', value: JSON.stringify(current) })
    } catch { }
  }
  return true
}

function makeExcelBlobResponse(headers, sampleRows = []) {
  const ws = XLSX.utils.json_to_sheet(sampleRows, { header: headers })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  return { data: blob }
}

export const downloadAreaScoreTemplate = async (id) => {
  return downloadNumericTableTemplate(id)
}

export const downloadNumericTableTemplate = async (areaId) => {
  let isComposite = false
  if (areaId) {
    const areas = await getAreas()
    const target = areas.find(a => String(a.id) === String(areaId))
    if (target && target.lookup_scope === 'COMPOSITE') {
      isComposite = true
    }
  }

  if (isComposite) {
    return makeExcelBlobResponse(['기준값', '점수', '대학명', '모집단위명'], [
      { '기준값': 1, '점수': 10, '대학명': '한국대', '모집단위명': '자연계열' },
      { '기준값': 2, '점수': 8, '대학명': '한국대', '모집단위명': '자연계열' },
      { '기준값': 3, '점수': 6, '대학명': '한국대', '모집단위명': '자연계열' },
      { '기준값': 4, '점수': 4, '대학명': '한국대', '모집단위명': '자연계열' }
    ])
  }

  return makeExcelBlobResponse(['기준값', '점수'], [
    { '기준값': 1.0, '점수': 10 },
    { '기준값': 2.0, '점수': 8 },
    { '기준값': 3.0, '점수': 6 }
  ])
}

export const exportNumericTable = async (id) => {
  return downloadNumericTableTemplate(id)
}

export const importNumericTable = async (id, file) => {
  return { success: true, count: 0 }
}

export const downloadCategoryMapTemplate = async (areaId) => {
  let isComposite = false
  if (areaId) {
    const areas = await getAreas()
    const target = areas.find(a => String(a.id) === String(areaId))
    if (target && target.lookup_scope === 'COMPOSITE') {
      isComposite = true
    }
  }

  if (isComposite) {
    return makeExcelBlobResponse(['범주', '점수', '대학명', '모집단위명'], [
      { '범주': '총학생자치회장', '점수': 5, '대학명': '한국대', '모집단위명': '자연계열' },
      { '범주': '학급자치회장', '점수': 4, '대학명': '한국대', '모집단위명': '자연계열' }
    ])
  }

  return makeExcelBlobResponse(['범주', '점수'], [
    { '범주': '총학생자치회장', '점수': 5 },
    { '범주': '학급자치회장', '점수': 4 }
  ])
}

export const exportCategoryMap = async (id) => {
  return downloadCategoryMapTemplate(id)
}

export const importCategoryMap = async (id, file) => {
  return { success: true, count: 0 }
}

// JSON 조회 더미
export const getNumericTableList = async () => ({ rows: [], total: 0 })
export const getCategoryMapList = async () => ({ rows: [], total: 0 })
export const getBaseDataList = async () => ({ rows: [], total: 0 })

export const downloadBaseDataTemplate = async (areaId, studentType = 'enrolled') => {
  let isComposite = false
  if (areaId) {
    const areas = await getAreas()
    const target = areas.find(a => String(a.id) === String(areaId))
    if (target && target.lookup_scope === 'COMPOSITE') {
      isComposite = true
    }
  }

  const isEnrolled = studentType === 'enrolled'

  if (isEnrolled) {
    if (isComposite) {
      return makeExcelBlobResponse(['학년', '반', '번호', '이름', '값', '대학명', '모집단위명'], [
        { '학년': 3, '반': 1, '번호': 1, '이름': '홍길동', '값': 42, '대학명': '한국대', '모집단위명': '자연계열' },
        { '학년': 3, '반': 1, '번호': 2, '이름': '김철수', '값': 0, '대학명': '한국대', '모집단위명': '자연계열' }
      ])
    }
    return makeExcelBlobResponse(['학년', '반', '번호', '이름', '값'], [
      { '학년': 3, '반': 1, '번호': 1, '이름': '홍길동', '값': 42 },
      { '학년': 3, '반': 1, '번호': 2, '이름': '김철수', '값': 0 }
    ])
  } else {
    if (isComposite) {
      return makeExcelBlobResponse(['학생코드', '이름', '값', '대학명', '모집단위명'], [
        { '학생코드': '20250001', '이름': '홍길동', '값': 42, '대학명': '한국대', '모집단위명': '자연계열' },
        { '학생코드': '20250002', '이름': '김철수', '값': 0, '대학명': '한국대', '모집단위명': '자연계열' }
      ])
    }
    return makeExcelBlobResponse(['학생코드', '이름', '값'], [
      { '학생코드': '20250001', '이름': '홍길동', '값': 42 },
      { '학생코드': '20250002', '이름': '김철수', '값': 0 }
    ])
  }
}

export const exportBaseData = async (areaId, studentType = 'enrolled') => {
  return downloadBaseDataTemplate(areaId, studentType)
}

export const importBaseData = async (id, file, studentType = 'enrolled') => {
  return { success: true, count: 0 }
}

// 유니브(Univ) 내신석차연명부 엑셀 파서
// 4행부터 데이터 시작 (row index 3)
// B: 학년, C: 반, D: 번호, E: 이름, F: 석차, G: 석차백분율
// H: 1-1, I: 1-2, J: 1전학기, K: 2-1, L: 2-2, M: 2전학기, N: 3-1, O: 3-2, P: 3전학기, Q: 전학년 ('-'는 성적 없음을 의미)
export const parseUnivExcel = async (fileBuffer) => {
  const wb = XLSX.read(fileBuffer, { type: 'array' })
  const sheetName = wb.SheetNames[0]
  const sheet = wb.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

  let startRow = 3 // 기본값 4행(0-based 3)
  let headerRow = null

  // 헤더 행 탐색 (최상단 10행 내)
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const r = rows[i] || []
    const rowStr = JSON.stringify(r)
    if ((rowStr.includes('학년') && rowStr.includes('반') && (rowStr.includes('이름') || rowStr.includes('성명'))) || rowStr.includes('1-1') || rowStr.includes('전학년')) {
      startRow = i + 1
      headerRow = r.map(c => String(c || '').trim().replace(/\s+/g, ''))
      break
    }
  }

  // 유니브 엑셀 기본 위치 (B:1, C:2, D:3, E:4, F:5, G:6, H:7, I:8, J:9, K:10, L:11, M:12, N:13, O:14, P:15, Q:16)
  let colGrade = 1
  let colClass = 2
  let colNum = 3
  let colName = 4
  let colRank = 5
  let colPercent = 6
  let col1_1 = 7
  let col1_2 = 8
  let col1_all = 9
  let col2_1 = 10
  let col2_2 = 11
  let col2_all = 12
  let col3_1 = 13
  let col3_2 = 14
  let col3_all = 15
  let colOverall = 16

  if (headerRow) {
    headerRow.forEach((h, idx) => {
      if (!h) return
      if (h.includes('학년') && !h.includes('전학년') && !h.includes('1학년') && !h.includes('2학년') && !h.includes('3학년')) colGrade = idx
      else if (h === '반' || h.includes('반명')) colClass = idx
      else if (h === '번호' || h === '학생번호') colNum = idx
      else if (h.includes('이름') || h.includes('성명')) colName = idx
      else if (h.includes('석차') && !h.includes('등급') && !h.includes('백분율')) colRank = idx
      else if (h.includes('백분율')) colPercent = idx
      else if (h === '1-1' || h.includes('1학년1학기') || h.includes('1-1학기')) col1_1 = idx
      else if (h === '1-2' || h.includes('1학년2학기') || h.includes('1-2학기')) col1_2 = idx
      else if (h === '1전학기' || h === '1학년' || h.includes('1전학기')) col1_all = idx
      else if (h === '2-1' || h.includes('2학년1학기') || h.includes('2-1학기')) col2_1 = idx
      else if (h === '2-2' || h.includes('2학년2학기') || h.includes('2-2학기')) col2_2 = idx
      else if (h === '2전학기' || h === '2학년' || h.includes('2전학기')) col2_all = idx
      else if (h === '3-1' || h.includes('3학년1학기') || h.includes('3-1학기')) col3_1 = idx
      else if (h === '3-2' || h.includes('3학년2학기') || h.includes('3-2학기')) col3_2 = idx
      else if (h === '3전학기' || h === '3학년' || h.includes('3전학기')) col3_all = idx
      else if (h === '전학년' || h.includes('전학년') || h.includes('전학기') || h.includes('총평균')) colOverall = idx
    })
  }

  const parsedStudents = []
  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length < 4) continue

    const rawGrade = String(row[colGrade] || '').trim()
    const rawClass = String(row[colClass] || '').trim()
    const rawNum = String(row[colNum] || '').trim()
    const name = String(row[colName] || '').trim()
    const rank = row[colRank] && String(row[colRank]).trim() !== '-' ? String(row[colRank]).trim() : ''

    const grade = parseInt(rawGrade, 10)
    const classNo = parseInt(rawClass, 10)
    const seqNo = parseInt(rawNum, 10)

    if (isNaN(grade) || isNaN(classNo) || isNaN(seqNo) || !name) continue

    const studentCode = `${grade}${String(classNo).padStart(2, '0')}${String(seqNo).padStart(2, '0')}`

    const gpa_1_1 = String(row[col1_1] || '').trim()
    const gpa_1_2 = String(row[col1_2] || '').trim()
    const gpa_1_all = String(row[col1_all] || '').trim()
    const gpa_2_1 = String(row[col2_1] || '').trim()
    const gpa_2_2 = String(row[col2_2] || '').trim()
    const gpa_2_all = String(row[col2_all] || '').trim()
    const gpa_3_1 = String(row[col3_1] || '').trim()
    const gpa_3_2 = String(row[col3_2] || '').trim()
    const gpa_3_all = String(row[col3_all] || '').trim()
    let gpa_overall = String(row[colOverall] || '').trim()

    // 전학년 등급이 미입력인 경우 최신 유효 등급 fallback
    if (!gpa_overall || gpa_overall === '-' || isNaN(parseFloat(gpa_overall))) {
      for (const val of [gpa_3_all, gpa_3_1, gpa_2_all, gpa_2_2, gpa_2_1, gpa_1_all, gpa_1_2, gpa_1_1]) {
        if (val && val !== '-' && !isNaN(parseFloat(val))) {
          gpa_overall = val
          break
        }
      }
    }

    const numericVal = parseFloat(gpa_overall)

    parsedStudents.push({
      grade,
      class_no: classNo,
      seq_no: seqNo,
      student_code: studentCode,
      name,
      rank: rank || '-',
      percentile: row[colPercent] && String(row[colPercent]).trim() !== '-' ? String(row[colPercent]).trim() : '-',
      gpa_1_1: gpa_1_1 !== '-' ? gpa_1_1 : '',
      gpa_1_2: gpa_1_2 !== '-' ? gpa_1_2 : '',
      gpa_1_all: gpa_1_all !== '-' ? gpa_1_all : '',
      gpa_2_1: gpa_2_1 !== '-' ? gpa_2_1 : '',
      gpa_2_2: gpa_2_2 !== '-' ? gpa_2_2 : '',
      gpa_2_all: gpa_2_all !== '-' ? gpa_2_all : '',
      gpa_3_1: gpa_3_1 !== '-' ? gpa_3_1 : '',
      gpa_3_2: gpa_3_2 !== '-' ? gpa_3_2 : '',
      gpa_3_all: gpa_3_all !== '-' ? gpa_3_all : '',
      gpa_overall: !isNaN(numericVal) ? numericVal : null,
      value: !isNaN(numericVal) ? numericVal : (gpa_overall || '-')
    })
  }

  return parsedStudents
}

export const previewUnivImport = async (areaId, file) => {
  const buffer = await file.arrayBuffer()
  const list = await parseUnivExcel(buffer)
  return {
    univ_name: '유니브',
    value_header: '석차등급',
    header_info: 'B~D열: 학년/반/번호, E열: 이름, F열: 석차, H~Q열: 학기별 및 전학년 석차등급',
    preview: list.slice(0, 10).map(s => [s.grade, s.class_no, s.seq_no, s.name, s.rank, s.value]),
    total: list.length,
    rows: list
  }
}

export const importUniv = async (areaId, file, univName = '', trackName = '') => {
  const buffer = await file.arrayBuffer()
  const list = await parseUnivExcel(buffer)

  if (list.length === 0) {
    throw new Error('엑셀에서 파싱된 유니브 성적 데이터가 0건입니다. 파일 양식을 확인해주세요.')
  }

  // 1. enrolled_students 원장 테이블에 전교생 학적 및 내신 성적 저장
  if (supabase) {
    try {
      const enrolledRows = await Promise.all(list.map(async s => ({
        student_code: s.student_code,
        grade: s.grade,
        class_no: s.class_no,
        student_no: s.seq_no,
        seq_no: s.seq_no,
        name: await encryptText(s.name),
        name_hash: await hashText(s.name),
        is_enrolled: true,
        status: 'approved',
        gpa_1_1: s.gpa_1_1 || null,
        gpa_1_2: s.gpa_1_2 || null,
        gpa_1_all: s.gpa_1_all || null,
        gpa_2_1: s.gpa_2_1 || null,
        gpa_2_2: s.gpa_2_2 || null,
        gpa_2_all: s.gpa_2_all || null,
        gpa_3_1: s.gpa_3_1 || null,
        gpa_3_2: s.gpa_3_2 || null,
        gpa_3_all: s.gpa_3_all || null,
        gpa_overall: s.gpa_overall != null ? s.gpa_overall : (s.value != null && s.value !== '-' && !isNaN(parseFloat(s.value)) ? parseFloat(s.value) : null)
      })))

      const { error: upsertErr } = await supabase.from('enrolled_students').upsert(enrolledRows, {
        onConflict: 'student_code'
      })
      if (upsertErr) {
        console.error('importUniv enrolled_students upsert error:', upsertErr)
      }
    } catch (e) {
      console.error('importUniv enrolled_students error:', e)
    }
  }

  // 2. global_course_grades 및 global_course_grades_detail 설정 보관 (Supabase config + localStorage)
  const gradesMap = {}
  const gradesDetailMap = {}

  list.forEach(s => {
    const overallVal = s.gpa_overall != null ? s.gpa_overall : s.value
    if (overallVal != null && overallVal !== '-') {
      gradesMap[s.student_code] = overallVal
    }
    gradesDetailMap[s.student_code] = {
      gpa_1_1: s.gpa_1_1 || '-',
      gpa_1_2: s.gpa_1_2 || '-',
      gpa_1_all: s.gpa_1_all || '-',
      gpa_2_1: s.gpa_2_1 || '-',
      gpa_2_2: s.gpa_2_2 || '-',
      gpa_2_all: s.gpa_2_all || '-',
      gpa_3_1: s.gpa_3_1 || '-',
      gpa_3_2: s.gpa_3_2 || '-',
      gpa_3_all: s.gpa_3_all || '-',
      value: overallVal || '-'
    }
  })

  if (supabase) {
    try {
      await supabase.from('config').upsert({
        key: 'global_course_grades',
        value: JSON.stringify(gradesMap)
      })
      await supabase.from('config').upsert({
        key: 'global_course_grades_detail',
        value: JSON.stringify(gradesDetailMap)
      })
    } catch (e) {
      console.error('importUniv config upsert error:', e)
    }
  }

  localStorage.setItem('global_course_grades', JSON.stringify(gradesMap))
  localStorage.setItem('global_course_grades_detail', JSON.stringify(gradesDetailMap))

  const baseRows = list.map(s => ({
    student_code: s.student_code,
    name: s.name,
    value: s.value,
    gpa_1_1: s.gpa_1_1,
    gpa_1_2: s.gpa_1_2,
    gpa_1_all: s.gpa_1_all,
    gpa_2_1: s.gpa_2_1,
    gpa_2_2: s.gpa_2_2,
    gpa_2_all: s.gpa_2_all,
    gpa_3_1: s.gpa_3_1,
    gpa_3_2: s.gpa_3_2,
    gpa_3_all: s.gpa_3_all,
    gpa_overall: s.value
  }))

  return { data: { success: true, count: baseRows.length, rows: baseRows } }
}

// ─────────────────────────────────────────────────────────────────────────────
// 재학생 명단 엑셀 (순번, 학년, 반, 번호, 이름, 성별, 비고, 학생 전화, 학부모, 학부모전화) 업로드 & 해시 자동 생성
// ─────────────────────────────────────────────────────────────────────────────
export const parseStudentRosterExcel = async (arrayBuffer) => {
  const wb = XLSX.read(arrayBuffer, { type: 'array' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

  let startRow = 1
  let headerRow = null

  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const r = rows[i] || []
    const rowStr = JSON.stringify(r)
    if (rowStr.includes('학년') && rowStr.includes('반') && (rowStr.includes('이름') || rowStr.includes('성명'))) {
      startRow = i + 1
      headerRow = r.map(c => String(c || '').trim().replace(/\s+/g, ''))
      break
    }
  }

  // 컬럼 인덱스 자동 감지
  let colSeq = -1
  let colGrade = -1
  let colClass = -1
  let colNum = -1
  let colName = -1
  let colGender = -1
  let colRemarks = -1
  let colSPhone = -1
  let colPName = -1
  let colPPhone = -1

  if (headerRow) {
    headerRow.forEach((h, idx) => {
      if (!h) return
      if (colGrade === -1 && h.includes('학년')) colGrade = idx
      else if (colClass === -1 && (h === '반' || h.includes('반명'))) colClass = idx
      else if (colNum === -1 && (h === '번호' || h === '학생번호')) colNum = idx
      else if (colSeq === -1 && (h === '순번' || h === '연번')) colSeq = idx
      else if (colName === -1 && (h.includes('이름') || h.includes('성명'))) colName = idx
      else if (colGender === -1 && h.includes('성별')) colGender = idx
      else if (colRemarks === -1 && (h.includes('비고') || h.includes('메모'))) colRemarks = idx
      else if (colSPhone === -1 && (h.includes('학생') && (h.includes('전화') || h.includes('연락처') || h.includes('폰')))) colSPhone = idx
      else if (colPPhone === -1 && ((h.includes('학부모') || h.includes('보호자')) && (h.includes('전화') || h.includes('연락처') || h.includes('폰')))) colPPhone = idx
      else if (colPName === -1 && (h.includes('학부모') || h.includes('보호자')) && !h.includes('전화') && !h.includes('연락처') && !h.includes('폰')) colPName = idx
    })
  }

  // 매칭 안된 컬럼 기본 위치(A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, I=8, J=9) fallback
  if (colSeq === -1) colSeq = 0
  if (colGrade === -1) colGrade = 1
  if (colClass === -1) colClass = 2
  if (colNum === -1) colNum = 3
  if (colName === -1) colName = 4
  if (colGender === -1) colGender = 5
  if (colRemarks === -1) colRemarks = 6
  if (colSPhone === -1) colSPhone = 7
  if (colPName === -1) colPName = 8
  if (colPPhone === -1) colPPhone = 9

  const list = []
  for (let i = startRow; i < rows.length; i++) {
    const r = rows[i]
    if (!r || r.length === 0) continue

    const seqNoRaw = String(r[colSeq] || '').trim()
    const gradeRaw = String(r[colGrade] || '').trim()
    const classRaw = String(r[colClass] || '').trim()
    const numRaw = String(r[colNum] || '').trim()
    const name = String(r[colName] || '').trim()
    const gender = String(r[colGender] || '').trim()
    const remarks = String(r[colRemarks] || '').trim()
    const sPhone = cleanFullPhone(r[colSPhone])
    const parentName = String(r[colPName] || '').trim()
    const pPhone = cleanFullPhone(r[colPPhone])

    const grade = parseInt(gradeRaw, 10)
    const classNo = parseInt(classRaw, 10)
    const studentNo = parseInt(numRaw, 10)
    const seqNo = parseInt(seqNoRaw, 10) || studentNo

    if (isNaN(grade) || isNaN(classNo) || isNaN(studentNo) || !name) continue

    const studentCode = `${grade}${String(classNo).padStart(2, '0')}${String(studentNo).padStart(2, '0')}`

    const nameHash = await hashText(name)
    const studentPhoneHash = sPhone ? await hashText(sPhone) : null
    const parentNameHash = parentName ? await hashText(parentName) : null
    const parentPhoneHash = pPhone ? await hashText(pPhone) : null

    list.push({
      seq_no: seqNo,
      grade,
      class_no: classNo,
      student_no: studentNo,
      student_code: studentCode,
      name,
      gender,
      remarks,
      student_phone: sPhone,
      parent_name: parentName,
      parent_phone: pPhone,
      name_hash: nameHash,
      student_phone_hash: studentPhoneHash,
      parent_name_hash: parentNameHash,
      parent_phone_hash: parentPhoneHash,
    })
  }

  return list
}

export const previewStudentRosterImport = async (file) => {
  const buffer = await file.arrayBuffer()
  const list = await parseStudentRosterExcel(buffer)
  return {
    univ_name: '재학생 명단 (연락처 및 해시 생성)',
    value_header: '학부모/전화번호',
    header_info: 'A:순번, B:학년, C:반, D:번호, E:이름, F:성별, G:비고, H:학생전화, I:학부모, J:학부모전화',
    preview: list.slice(0, 10).map(s => [s.grade, s.class_no, s.student_no, s.name, s.gender || '-', s.student_phone || '-', s.parent_name || '-', s.parent_phone || '-']),
    total: list.length,
    rows: list
  }
}

export const importStudentRosterExcel = async (file) => {
  const buffer = await file.arrayBuffer()
  const list = await parseStudentRosterExcel(buffer)

  if (supabase && list.length > 0) {
    const enrolledRows = await Promise.all(list.map(async s => ({
      student_code: s.student_code,
      grade: s.grade,
      class_no: s.class_no,
      student_no: s.student_no,
      seq_no: s.seq_no,
      name: await encryptText(s.name),
      gender: s.gender || null,
      remarks: s.remarks || null,
      name_hash: s.name_hash,
      student_phone_hash: s.student_phone_hash,
      parent_name_hash: s.parent_name_hash,
      parent_phone_hash: s.parent_phone_hash,
      is_enrolled: true,
      status: 'approved'
    })))

    const { error } = await supabase.from('enrolled_students').upsert(enrolledRows, {
      onConflict: 'student_code'
    })

    if (error) {
      console.error('importStudentRosterExcel upsert error:', error)
      throw error
    }
  }

  return { success: true, count: list.length, rows: list }
}

export const downloadStudentRosterTemplate = async () => {
  const headers = ['순번', '학년', '반', '번호', '이름', '성별', '비고', '학생 전화', '학부모', '학부모전화']
  const sample1 = [1, 3, 1, 1, '고윤', '여', '', '01056976855', '', '01075925855']
  const sample2 = [2, 3, 1, 2, '김가온', '남', '', '01062730484', '서유희', '01086970213']

  const wsData = [headers, sample1, sample2]
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  ws['!cols'] = [
    { wch: 6 },  // 순번
    { wch: 6 },  // 학년
    { wch: 6 },  // 반
    { wch: 6 },  // 번호
    { wch: 10 }, // 이름
    { wch: 6 },  // 성별
    { wch: 10 }, // 비고
    { wch: 15 }, // 학생 전화
    { wch: 10 }, // 학부모
    { wch: 15 }  // 학부모전화
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '재학생명단')
  XLSX.writeFile(wb, '재학생_명단_업로드_양식.xlsx')
}

export const previewDaegyoImport = async (areaId, file) => {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

  const list = []
  let startRow = 1
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const rowStr = JSON.stringify(rows[i] || [])
    if (rowStr.includes('학번') || rowStr.includes('이름') || rowStr.includes('성명')) {
      startRow = i + 1
      break
    }
  }

  for (let i = startRow; i < rows.length; i++) {
    const r = rows[i]
    if (!r || r.length < 3) continue
    const sCode = String(r[0] || '').trim()
    const name = String(r[1] || '').trim()
    const valStr = String(r[2] || '').trim()
    if (!sCode || !name) continue
    const num = parseFloat(valStr)
    list.push({
      student_code: sCode,
      name,
      value: !isNaN(num) ? num : valStr
    })
  }

  return {
    univ_name: '대교협',
    value_header: '환산점수/석차등급',
    header_info: '대교협 석차연명부 자동 파싱',
    preview: list.slice(0, 10),
    total: list.length,
    rows: list
  }
}

export const importDaegyo = async (areaId, file, univName = '', trackName = '') => {
  const prev = await previewDaegyoImport(areaId, file)
  const baseRows = prev.rows

  if (supabase && areaId) {
    try {
      const configKey = `eval_base_data_${areaId}`
      const { data: existingData } = await supabase.from('config').select('value').eq('key', configKey).maybeSingle()
      let existingRows = []
      if (existingData && existingData.value) {
        try { existingRows = JSON.parse(existingData.value) } catch { }
      }

      const rowMap = new Map()
      for (const r of existingRows) rowMap.set(r.student_code, r)
      for (const r of baseRows) rowMap.set(r.student_code, r)

      const mergedRows = Array.from(rowMap.values())
      await supabase.from('config').upsert({
        key: configKey,
        value: JSON.stringify(mergedRows)
      })
      localStorage.setItem(configKey, JSON.stringify(mergedRows))
    } catch (e) {
      console.error('importDaegyo error:', e)
    }
  }

  return { data: { success: true, count: baseRows.length, rows: baseRows } }
}

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
    parent_name: await decryptText(s.parent_name_hash || s.parent_name),
    is_enrolled: s.is_enrolled !== false,
    grade: s.grade,
    class_no: s.class_no,
    seq_no: s.student_no || s.seq_no,
    phone_last4: '****',
    status: s.status || 'approved',
    grad_year: s.grad_year,
    gpa_1_1: s.gpa_1_1 || null,
    gpa_1_2: s.gpa_1_2 || null,
    gpa_1_all: s.gpa_1_all || null,
    gpa_2_1: s.gpa_2_1 || null,
    gpa_2_2: s.gpa_2_2 || null,
    gpa_2_all: s.gpa_2_all || null,
    gpa_3_1: s.gpa_3_1 || null,
    gpa_3_2: s.gpa_3_2 || null,
    gpa_3_all: s.gpa_3_all || null,
    gpa_overall: s.gpa_overall != null ? s.gpa_overall : null
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
      .from('enrolled_students')
      .select('grade, class_no')
      .eq('is_enrolled', true)
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
    '학생전화',
    '학부모전화',
    '비고'
  ]
  const sampleRows = [
    [1, 3, 1, 1, '김철수', '남', '01012345678', '01087654321', ''],
    [2, 3, 1, 2, '이영희', '여', '01098765432', '01087654321', '']
  ]
  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '재학생명단_양식')
  return { data: XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) }
}

export const downloadGraduatedTemplate = async () => {
  const headers = [
    '순번',
    '졸업연도',
    '학생코드',
    '이름',
    '성별',
    '학생전화',
    '학부모전화',
    '비고'
  ]
  const sampleRows = [
    [1, 2024, '202430101', '박민수', '남', '01012345678', '01087654321', '']
  ]
  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '졸업생명단_양식')
  return { data: XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) }
}

export const downloadStudentTemplate = downloadEnrolledTemplate
export const exportStudents = async () => {
  if (!supabase) return { data: new Uint8Array() }
  const { data } = await supabase.from('enrolled_students').select('*')
  const rows = await Promise.all((data || []).map(async (s, i) => ({
    순번: i + 1,
    구분: s.is_enrolled ? '재학생' : '졸업생',
    학생코드: s.student_code,
    학년: s.grade || '',
    반: s.class_no || '',
    번호: s.seq_no || s.student_no || '',
    이름: await decryptText(s.name),
    졸업연도: s.grad_year || '',
    가입상태: s.status === 'approved' ? '승인' : (s.status === 'pending' ? '대기' : '반려')
  })))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '전체학생명단')
  return { data: XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) }
}
export const importStudents = () => { }
export const exportEnrolled = () => { }
export const importEnrolled = () => { }
export const exportGraduated = () => { }
export const importGraduated = () => { }

// 7. 재학생 추가 (enrolled_students 원장 연동)
export const addEnrolledStudent = async (body) => {
  if (!supabase) return
  const grade = Number(body.grade)
  const class_no = Number(body.class_no)
  const student_no = Number(body.seq_no) || 1
  const student_code = body.student_code || `${grade}${String(class_no).padStart(2, '0')}${String(student_no).padStart(2, '0')}`

  const rawName = String(body.name || '').trim()
  const encName = await encryptText(rawName)
  const nameHash = await hashText(rawName)

  const sPhone = String(body.student_phone || body.phone || '').trim().replace(/\D/g, '')
  const sPhoneHash = sPhone ? await hashPhone(sPhone) : null

  const rawParentName = String(body.parent_name || '').trim()
  const encParentName = rawParentName ? await encryptText(rawParentName) : null
  const parentNameHash = rawParentName ? await hashText(rawParentName) : null

  const pPhone = String(body.parent_phone || '').trim().replace(/\D/g, '')
  const pPhoneHash = pPhone ? await hashPhone(pPhone) : null

  const { data, error } = await supabase
    .from('enrolled_students')
    .upsert({
      student_code,
      name: encName,
      name_hash: nameHash,
      student_phone_hash: sPhoneHash,
      parent_phone_hash: pPhoneHash,
      parent_name_hash: encParentName,
      is_enrolled: true,
      grade,
      class_no,
      student_no,
      seq_no: student_no,
      status: 'approved'
    }, { onConflict: 'student_code' })

  if (error) throw error
  return data
}

// 8. 졸업생 추가 (enrolled_students 원장 연동)
export const addGraduatedStudent = async (body) => {
  if (!supabase) return
  const grad_year = Number(body.grad_year)
  const rawCode = String(body.student_code || '').trim()
  const gradYearStr = String(grad_year)
  const student_code = rawCode.startsWith(gradYearStr) ? rawCode : `${gradYearStr}${rawCode}`

  const rawName = String(body.name || '').trim()
  const encName = await encryptText(rawName)
  const nameHash = await hashText(rawName)

  const sPhone = String(body.student_phone || body.phone || '').trim().replace(/\D/g, '')
  const sPhoneHash = sPhone ? await hashPhone(sPhone) : null

  const rawParentName = String(body.parent_name || '').trim()
  const encParentName = rawParentName ? await encryptText(rawParentName) : null

  const pPhone = String(body.parent_phone || '').trim().replace(/\D/g, '')
  const pPhoneHash = pPhone ? await hashPhone(pPhone) : null

  const { data, error } = await supabase
    .from('enrolled_students')
    .upsert({
      student_code,
      name: encName,
      name_hash: nameHash,
      student_phone_hash: sPhoneHash,
      parent_phone_hash: pPhoneHash,
      parent_name_hash: encParentName,
      is_enrolled: false,
      grad_year,
      status: 'approved'
    }, { onConflict: 'student_code' })

  if (error) throw error
  return data
}

// 9. 학생/졸업생 삭제
export const deleteStudent = async (id) => {
  if (!supabase) return

  // 삭제 전 해당 학생의 모든 지원서 서명/문서 스토리지 파일 삭제
  try {
    const { data: apps } = await supabase
      .from('applications')
      .select('*')
      .eq('student_id', id)

    if (apps && apps.length > 0) {
      for (const ap of apps) {
        await deleteApplicationStorageFiles(ap)
      }
    }
  } catch (e) {
    console.warn('Failed to delete student application storage files:', e)
  }

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

// 9-1. 학생 정보 수정
export const updateStudent = async (id, body) => {
  if (!supabase) return
  const updateData = {}

  if (body.name !== undefined && body.name !== null) {
    const rawName = String(body.name || '').trim()
    if (rawName) {
      updateData.name = await encryptText(rawName)
      updateData.name_hash = await hashText(rawName)
    }
  }
  if (body.grade !== undefined) updateData.grade = body.grade ? Number(body.grade) : null
  if (body.class_no !== undefined) updateData.class_no = body.class_no ? Number(body.class_no) : null
  if (body.seq_no !== undefined || body.student_no !== undefined) {
    const num = Number(body.seq_no || body.student_no)
    if (!isNaN(num)) {
      updateData.student_no = num
      updateData.seq_no = num
    }
  }
  if (body.student_code !== undefined) updateData.student_code = String(body.student_code || '').trim()
  if (body.is_enrolled !== undefined) updateData.is_enrolled = Boolean(body.is_enrolled)
  if (body.grad_year !== undefined) updateData.grad_year = body.grad_year ? Number(body.grad_year) : null
  if (body.gpa_overall !== undefined) updateData.gpa_overall = body.gpa_overall !== null && body.gpa_overall !== '' ? parseFloat(body.gpa_overall) : null
  if (body.gpa_1_1 !== undefined) updateData.gpa_1_1 = body.gpa_1_1 || null
  if (body.gpa_1_2 !== undefined) updateData.gpa_1_2 = body.gpa_1_2 || null
  if (body.gpa_1_all !== undefined) updateData.gpa_1_all = body.gpa_1_all || null
  if (body.gpa_2_1 !== undefined) updateData.gpa_2_1 = body.gpa_2_1 || null
  if (body.gpa_2_2 !== undefined) updateData.gpa_2_2 = body.gpa_2_2 || null
  if (body.gpa_2_all !== undefined) updateData.gpa_2_all = body.gpa_2_all || null
  if (body.gpa_3_1 !== undefined) updateData.gpa_3_1 = body.gpa_3_1 || null
  if (body.gpa_3_2 !== undefined) updateData.gpa_3_2 = body.gpa_3_2 || null
  if (body.gpa_3_all !== undefined) updateData.gpa_3_all = body.gpa_3_all || null

  const { data, error } = await supabase
    .from('enrolled_students')
    .update(updateData)
    .eq('id', id)

  if (error) throw error
  return data
}

// 10. 대학 목록 조회
export const getUniversities = async () => {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('universities')
    .select('*')
    .order('univ_name', { ascending: true })

  if (error) throw error
  return data.map(u => {
    let meta = {}
    try {
      meta = JSON.parse(u.remarks || '{}')
    } catch (e) {
      meta = { text: u.remarks }
    }
    return {
      ...u,
      total_quota: meta.total_quota !== undefined ? meta.total_quota : u.quota_limit,
      unit_quota: u.quota_limit,
      raw_quota_limit: meta.raw_quota_limit ?? null,  // 원본 % 텍스트 ("3%" 등)
      prioritize_enrolled: !!meta.prioritize_enrolled
    }
  })
}

// 11. 대학교 생성
export const createUniversity = async (body) => {
  if (!supabase) return
  const meta = {
    total_quota: body.total_quota !== undefined ? body.total_quota : (body.quota_limit || null),
    prioritize_enrolled: !!body.prioritize_enrolled,
    raw_quota_limit: body.raw_quota_limit ?? null,  // 원본 % 텍스트 보존
  }
  const quota_limit = body.unit_quota !== undefined ? body.unit_quota : (body.total_quota !== undefined ? body.total_quota : body.quota_limit)

  const { data, error } = await supabase
    .from('universities')
    .insert({
      univ_name: body.univ_name,
      track_type: body.track_type || '교과',
      track_name: body.track_name || '',
      grad_allowed: body.grad_allowed !== undefined ? body.grad_allowed : true,
      csat_min: body.csat_min || 'X',
      has_quota: quota_limit !== null,
      quota_limit: quota_limit,
      remarks: JSON.stringify(meta)
    })
    .select()

  if (error) throw error

  const u = data && data[0]
  if (!u) return null
  return {
    ...u,
    total_quota: meta.total_quota,
    unit_quota: u.quota_limit,
    prioritize_enrolled: !!meta.prioritize_enrolled
  }
}

// 12. 대학교 수정
export const updateUniversity = async (id, body) => {
  if (!supabase) return

  // Fetch existing row to merge metadata
  const { data: existing } = await supabase.from('universities').select('*').eq('id', id).single()
  if (!existing) return

  let meta = {}
  try {
    meta = JSON.parse(existing.remarks || '{}')
  } catch (e) {
    meta = { text: existing.remarks }
  }

  if (body.total_quota !== undefined) meta.total_quota = body.total_quota
  if (body.prioritize_enrolled !== undefined) meta.prioritize_enrolled = body.prioritize_enrolled
  if (body.raw_quota_limit !== undefined) meta.raw_quota_limit = body.raw_quota_limit

  const quota_limit = body.unit_quota !== undefined ? body.unit_quota : (body.total_quota !== undefined ? body.total_quota : existing.quota_limit)

  const { error } = await supabase
    .from('universities')
    .update({
      univ_name: body.univ_name !== undefined ? body.univ_name : existing.univ_name,
      track_type: body.track_type !== undefined ? body.track_type : existing.track_type,
      track_name: body.track_name !== undefined ? body.track_name : existing.track_name,
      grad_allowed: body.grad_allowed !== undefined ? body.grad_allowed : existing.grad_allowed,
      csat_min: body.csat_min !== undefined ? body.csat_min : existing.csat_min,
      has_quota: quota_limit !== null,
      quota_limit: quota_limit,
      remarks: JSON.stringify(meta)
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

  let meta = {}
  try {
    meta = JSON.parse(u.remarks || '{}')
  } catch (e) {
    meta = { text: u.remarks }
  }

  return [{
    ...u,
    total_quota: meta.total_quota !== undefined ? meta.total_quota : u.quota_limit,
    unit_quota: u.quota_limit,
    prioritize_enrolled: !!meta.prioritize_enrolled
  }]
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

// 15. 라운드 개시 (새 차수 추가 및 개시)
export const openRound = async () => {
  if (!supabase) return
  const rounds = await getRounds()

  // 1) 개시되지 않은 기존 차수가 있다면 개시
  const unopened = rounds.find(r => r.status !== 'OPEN' && r.status !== 'CLOSED' && r.status !== 'FINALIZED')
  if (unopened) {
    const { error } = await supabase
      .from('timeline_rounds')
      .update({ status: 'OPEN', opened_at: new Date().toISOString() })
      .eq('id', unopened.id)

    if (error) throw error
    return unopened
  }

  // 2) 모든 기존 차수가 개시/종료/마감 상태이면 새 차수 (4차, 5차 등 무제한) 생성
  const maxId = rounds.length > 0 ? Math.max(...rounds.map(r => Number(r.id) || 0)) : 0
  const nextId = maxId + 1

  const newRound = {
    id: nextId,
    status: 'OPEN',
    opened_at: new Date().toISOString()
  }

  const { error } = await supabase
    .from('timeline_rounds')
    .upsert(newRound)

  if (error) {
    if (error.message && error.message.includes('timeline_rounds_id_check')) {
      throw new Error(`Supabase DB의 timeline_rounds_id_check 제약 조건에 의해 4차 이상 생성이 차단되었습니다.\n\nSupabase SQL Editor에서 아래 쿼리를 실행해 주시면 4차 이상 무제한 생성이 가능해집니다:\n\nALTER TABLE timeline_rounds DROP CONSTRAINT IF EXISTS timeline_rounds_id_check;\nALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_round_check;`)
    }
    throw error
  }
  return newRound
}

// 라운드 상태 수동 변경 (DRAFT, OPEN, CLOSED, FINALIZED)
export const updateRoundStatus = async (id, status) => {
  if (!supabase) return
  const { error } = await supabase
    .from('timeline_rounds')
    .update({ status })
    .eq('id', id)

  if (error) throw error
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
    .select('*, universities:univ_id(*)')
    .eq('round', id)
    .eq('is_recommended', false)
    .eq('is_excluded', false)
    .eq('is_abandoned', false)

  if (err) throw err

  if (apps && apps.length > 0) {
    const studentIds = apps.map(ap => ap.student_id)
    const [{ data: studentsData }, { data: profilesData }] = await Promise.all([
      supabase.from('enrolled_students').select('id, name, student_code, grade, class_no').in('id', studentIds),
      supabase.from('profiles').select('id, name, student_code, grade, class_no').in('id', studentIds)
    ])

    const studentMap = new Map((studentsData || []).map(s => [s.id, s]))
    const profileMap = new Map((profilesData || []).map(p => [p.id, p]))

    // 미결정 지원자가 있으므로 차단
    const undecidedList = await Promise.all(apps.map(async ap => {
      const stInfo = studentMap.get(ap.student_id) || profileMap.get(ap.student_id) || {}
      let studentName = stInfo.name || '미명학생'
      if (studentName.startsWith('enc:')) {
        try { studentName = await decryptText(studentName) } catch { studentName = '복호화실패' }
      }
      return {
        student_code: stInfo.student_code || '',
        student_name: studentName,
        grade: stInfo.grade,
        class_no: stInfo.class_no,
        univ_name: ap.universities?.univ_name || '',
        track_name: ap.universities?.track_name || ''
      }
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
    .select('*, universities:univ_id(*)')

  if (roundId) {
    query = query.eq('round', roundId)
  }

  if (trackId) {
    query = query.eq('univ_id', trackId)
  }

  const { data: apps, error } = await query
  if (error) throw error
  if (!apps || apps.length === 0) return []

  // enrolled_students & profiles 매핑 (석차등급 gpa_overall 포함)
  const studentIds = apps.map(ap => ap.student_id)
  const [{ data: studentsData }, { data: profilesData }] = await Promise.all([
    supabase.from('enrolled_students').select('id, name, student_code, grade, class_no, seq_no, is_enrolled, gpa_overall').in('id', studentIds),
    supabase.from('profiles').select('id, name, student_code, grade, class_no, seq_no, is_enrolled').in('id', studentIds)
  ])

  const studentMap = new Map((studentsData || []).map(s => [s.id, s]))
  const profileMap = new Map((profilesData || []).map(p => [p.id, p]))

  // 차수 일정 및 상태 계산
  const { data: rawRounds } = await supabase.from('timeline_rounds').select('*')
  const schedulesMap = await fetchRoundSchedulesMap()
  const roundStatusMap = {}
    ; (rawRounds || []).forEach(r => {
      const sched = schedulesMap[r.id]
      roundStatusMap[r.id] = computeRoundDisplayStatus(r, sched)
    })

  // OPEN 차수는 추천 확정/미선발 리셋 (접수 중 상태 유지)
  for (const ap of apps) {
    if (roundStatusMap[ap.round] === 'OPEN' && (ap.is_recommended || ap.is_excluded)) {
      ap.is_recommended = false
      ap.is_excluded = false
      ap.excluded_reason = null
      await supabase.from('applications').update({ is_recommended: false, is_excluded: false, excluded_reason: null }).eq('id', ap.id)
    }
  }

  // CLOSED 또는 FINALIZED 마감 차수: 정원 및 성적(경합)에 따른 자동 추천 선발 적용
  const closedOrFinalizedRounds = [...new Set(apps.filter(ap => !ap.is_abandoned && (roundStatusMap[ap.round] === 'CLOSED' || roundStatusMap[ap.round] === 'FINALIZED')).map(ap => ap.round))]

  for (const rId of closedOrFinalizedRounds) {
    const rApps = apps.filter(ap => ap.round === rId && !ap.is_abandoned)
    const uGroup = {}
    rApps.forEach(ap => {
      if (!uGroup[ap.univ_id]) uGroup[ap.univ_id] = []
      uGroup[ap.univ_id].push(ap)
    })

    for (const uId of Object.keys(uGroup)) {
      const targetApps = uGroup[uId]
      const sampleUniv = targetApps[0]?.universities || {}
      const hasQuota = sampleUniv.has_quota !== false && sampleUniv.quota_limit > 0
      const limit = hasQuota ? Number(sampleUniv.quota_limit) : 99999

      targetApps.sort((a, b) => {
        const stA = studentMap.get(a.student_id) || profileMap.get(a.student_id) || {}
        const stB = studentMap.get(b.student_id) || profileMap.get(b.student_id) || {}

        if (stA.is_enrolled !== stB.is_enrolled) {
          return stA.is_enrolled ? -1 : 1
        }
        const scoreA = a.manual_score != null ? Number(a.manual_score) : 0
        const scoreB = b.manual_score != null ? Number(b.manual_score) : 0
        if (scoreA !== scoreB) return scoreB - scoreA

        const gpaA = (stA.gpa_overall != null && Number(stA.gpa_overall) > 0) ? Number(stA.gpa_overall) : 99
        const gpaB = (stB.gpa_overall != null && Number(stB.gpa_overall) > 0) ? Number(stB.gpa_overall) : 99
        if (gpaA !== gpaB) return gpaA - gpaB

        return (stA.student_code || '').localeCompare(stB.student_code || '')
      })

      for (let idx = 0; idx < targetApps.length; idx++) {
        const ap = targetApps[idx]
        const rank = idx + 1
        const isRec = rank <= limit
        const isExc = !isRec
        const excReason = isExc ? '추천인원 초과 (성적 미달)' : null

        if (ap.is_recommended !== isRec || ap.is_excluded !== isExc) {
          ap.is_recommended = isRec
          ap.is_excluded = isExc
          ap.excluded_reason = excReason
          await supabase.from('applications').update({
            is_recommended: isRec,
            is_excluded: isExc,
            excluded_reason: excReason
          }).eq('id', ap.id)
        }
      }
    }
  }

  // 대학교(univ_id) & 라운드(round)별로 묶어 랭킹 부여
  const grouped = {}
  apps.forEach(ap => {
    const key = `${ap.univ_id}-${ap.round}`
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(ap)
  })

  const results = []

  for (const key of Object.keys(grouped)) {
    const groupApps = grouped[key]

    // 학생 정보 병합
    const appsWithStudentInfo = await Promise.all(groupApps.map(async ap => {
      const stInfo = studentMap.get(ap.student_id) || profileMap.get(ap.student_id) || {}
      let studentName = stInfo.name || '미명학생'
      if (studentName.startsWith('enc:')) {
        try { studentName = await decryptText(studentName) } catch { studentName = '복호화실패' }
      }
      return {
        ...ap,
        stInfo: {
          ...stInfo,
          name: studentName,
          is_enrolled: stInfo.is_enrolled !== false
        }
      }
    }))

    // 정렬 규정: (1) 재학생 우선, (2) 대학 환산점수(manual_score) 높은 순, (3) 전체 석차등급(gpa_overall) 낮은 순 (상위 성적: 예 1.20 > 1.85), (4) 학번 오름차순
    appsWithStudentInfo.sort((a, b) => {
      if (a.stInfo.is_enrolled !== b.stInfo.is_enrolled) {
        return a.stInfo.is_enrolled ? -1 : 1
      }
      const scoreA = (a.manual_score != null && Number(a.manual_score) > 0) ? Number(a.manual_score) : 0
      const scoreB = (b.manual_score != null && Number(b.manual_score) > 0) ? Number(b.manual_score) : 0
      if (scoreA !== scoreB) return scoreB - scoreA

      const gpaA = (a.stInfo.gpa_overall != null && !isNaN(Number(a.stInfo.gpa_overall)) && Number(a.stInfo.gpa_overall) > 0) ? Number(a.stInfo.gpa_overall) : 99
      const gpaB = (b.stInfo.gpa_overall != null && !isNaN(Number(b.stInfo.gpa_overall)) && Number(b.stInfo.gpa_overall) > 0) ? Number(b.stInfo.gpa_overall) : 99
      if (gpaA !== gpaB) return gpaA - gpaB

      return (a.stInfo.student_code || '').localeCompare(b.stInfo.student_code || '')
    })

    // Standard Competition Ranking (1, 1, 3, 4...)
    let rank = 1
    let skipCount = 0
    let prevScore = null
    let prevGpa = null
    let prevEnrolled = null

    for (let idx = 0; idx < appsWithStudentInfo.length; idx++) {
      const ap = appsWithStudentInfo[idx]
      const currentScore = (ap.manual_score != null && Number(ap.manual_score) > 0) ? Number(ap.manual_score) : 0
      const currentGpa = (ap.stInfo.gpa_overall != null && !isNaN(Number(ap.stInfo.gpa_overall)) && Number(ap.stInfo.gpa_overall) > 0) ? Number(ap.stInfo.gpa_overall) : 99
      const currentEnrolled = ap.stInfo.is_enrolled

      if (idx > 0) {
        if (currentScore === prevScore && currentGpa === prevGpa && currentEnrolled === prevEnrolled) {
          skipCount++
        } else {
          rank += skipCount + 1
          skipCount = 0
        }
      }

      prevScore = currentScore
      prevGpa = currentGpa
      prevEnrolled = currentEnrolled

      // 부적합 처리가 되었을 경우 원래의 순위를 캐싱하여 대시보드에 정상 출력
      let finalRank = rank
      if (ap.is_excluded) {
        if (!ap.original_rank) {
          supabase.from('applications').update({ original_rank: rank }).eq('id', ap.id).then(() => { })
        }
        finalRank = ap.original_rank || rank
      }

      results.push({
        id: ap.id,
        student_id: ap.student_id,
        track_id: ap.univ_id,
        round: ap.round,
        round_id: ap.round,
        recommended_round: ap.recommended_round || ap.round,
        abandoned_round: ap.abandoned_round || ap.round,
        manual_score: ap.manual_score,
        gpa_overall: ap.stInfo.gpa_overall != null ? ap.stInfo.gpa_overall : null,
        total_score: currentScore > 0 ? currentScore : (ap.stInfo.gpa_overall != null ? ap.stInfo.gpa_overall : null),
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
        parent_name: ap.parent_name || ap.stInfo.parent_name || '',
        excluded: ap.is_excluded,
        excluded_reason: ap.excluded_reason,
        student_code: ap.stInfo.student_code || '',
        name: ap.stInfo.name,
        grade: ap.stInfo.grade,
        class_no: ap.stInfo.class_no,
        seq_no: ap.stInfo.seq_no,
        is_enrolled: ap.stInfo.is_enrolled,
        univ_name: ap.universities?.univ_name || '',
        track_name: ap.universities?.track_name || '',
        department_name: ap.department_name,
        grad_allowed: ap.universities?.grad_allowed,
        quota_limit: ap.universities?.quota_limit,
        universities: ap.universities,
        raw_app: ap
      })
    }
  }

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

  // 1. 지원서 조회
  let query = supabase
    .from('applications')
    .select('*, universities:univ_id(*)')
    .eq('round', roundId)

  if (trackId) {
    query = query.eq('univ_id', trackId)
  }

  const { data: appsData, error: appsErr } = await query
  if (appsErr) throw appsErr
  if (!appsData || appsData.length === 0) return []

  // 2. enrolled_students 마스터 데이터 전체 조회 및 인덱스 맵 생성 (gpa_overall 포함)
  const studentIds = appsData.map(ap => ap.student_id)
  const { data: studentsData, error: stErr } = await supabase
    .from('enrolled_students')
    .select('id, name, student_code, grade, class_no, seq_no, is_enrolled, gpa_overall')
    .in('id', studentIds)

  if (stErr) throw stErr

  const studentMap = new Map()
  if (studentsData) {
    for (const s of studentsData) {
      studentMap.set(s.id, s)
    }
  }

  // 3. profiles 데이터도 fallback 대비하여 전체 패치
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, name, student_code, grade, class_no, seq_no, is_enrolled')
    .in('id', studentIds)

  const profileMap = new Map()
  if (profilesData) {
    for (const p of profilesData) {
      profileMap.set(p.id, p)
    }
  }

  // 4. 데이터 가드 매핑 및 암호화 해제
  const mapped = await Promise.all(appsData.map(async ap => {
    const stInfo = studentMap.get(ap.student_id) || profileMap.get(ap.student_id) || {}

    // 이름 복호화
    let studentName = stInfo.name || '미명학생'
    if (studentName.startsWith('enc:')) {
      try {
        studentName = await decryptText(studentName)
      } catch {
        studentName = '복호화실패'
      }
    }

    return {
      student_id: ap.student_id,
      track_id: ap.univ_id,
      round_id: ap.round,
      abandoned: ap.is_abandoned,
      excluded: ap.is_excluded,
      excluded_reason: ap.excluded_reason,
      department_name: ap.department_name,
      manual_score: ap.manual_score,
      gpa_overall: stInfo.gpa_overall != null ? stInfo.gpa_overall : null,
      student_code: stInfo.student_code || '',
      name: studentName,
      grade: stInfo.grade,
      class_no: stInfo.class_no,
      seq_no: stInfo.seq_no,
      is_enrolled: stInfo.is_enrolled !== false,
      univ_id: ap.univ_id,
      univ_name: ap.universities?.univ_name || '',
      track_name: ap.universities?.track_name || '',
      recommended: ap.is_recommended,
      student_signature_url: ap.student_signature_url || null,
      parent_signature_url: ap.parent_signature_url || null,
      round_status: 'CLOSED'
    }
  }))

  return mapped
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

// 25. 선발 차수 결과/현황 엑셀 내보내기
export const exportResultsExcel = async (roundId) => {
  if (!supabase || !roundId) return { data: new Uint8Array() }

  const { data: apps, error: err1 } = await supabase
    .from('applications')
    .select('*, universities:univ_id(*)')
    .eq('round', roundId)

  if (err1 || !apps || apps.length === 0) {
    return makeExcelBlobResponse(['대학명', '전형명', '지원학과', '순위', '학번', '성명', '학년', '반', '번호', '점수/등급', '선발상태', '비고'], [])
  }

  const studentIds = [...new Set(apps.map(ap => ap.student_id))]
  const [{ data: students }, { data: profiles }] = await Promise.all([
    supabase.from('enrolled_students').select('*').in('id', studentIds),
    supabase.from('profiles').select('*').in('id', studentIds)
  ])

  const studentMap = new Map((students || []).map(s => [s.id, s]))
  const profileMap = new Map((profiles || []).map(p => [p.id, p]))

  const grouped = {}
  apps.forEach(ap => {
    if (!grouped[ap.univ_id]) grouped[ap.univ_id] = []
    grouped[ap.univ_id].push(ap)
  })

  const rankMap = {}
  for (const uId of Object.keys(grouped)) {
    const uApps = grouped[uId]
    uApps.sort((a, b) => {
      const stA = studentMap.get(a.student_id) || profileMap.get(a.student_id) || {}
      const stB = studentMap.get(b.student_id) || profileMap.get(b.student_id) || {}
      const scoreA = a.univ_calc_score != null ? Number(a.univ_calc_score) : (a.manual_score != null ? Number(a.manual_score) : null)
      const scoreB = b.univ_calc_score != null ? Number(b.univ_calc_score) : (b.manual_score != null ? Number(b.manual_score) : null)
      if (scoreA !== null && scoreB !== null && scoreA !== scoreB) return scoreB - scoreA
      const gpaA = stA.gpa_overall != null ? Number(stA.gpa_overall) : 99
      const gpaB = stB.gpa_overall != null ? Number(stB.gpa_overall) : 99
      if (gpaA !== gpaB) return gpaA - gpaB
      return new Date(a.created_at || 0) - new Date(b.created_at || 0)
    })
    uApps.forEach((ap, idx) => {
      rankMap[ap.id] = idx + 1
    })
  }

  const exportRows = await Promise.all(apps.map(async ap => {
    const st = studentMap.get(ap.student_id) || profileMap.get(ap.student_id) || {}
    let name = st.name || ''
    if (name.startsWith('enc:')) {
      try { name = await decryptText(name) } catch { }
    }

    let statusText = '접수완료'
    if (ap.is_abandoned) statusText = '추천포기'
    else if (ap.is_recommended) statusText = '추천확정'
    else if (ap.is_excluded) statusText = '미선발'

    const scoreText = ap.univ_calc_score != null
      ? `${formatScore(ap.univ_calc_score)}점`
      : (ap.manual_score != null ? `${formatScore(ap.manual_score)}점` : (st.gpa_overall ? `${st.gpa_overall}등급` : '-'))

    const univObj = ap.universities || {}
    const hasQuota = univObj.has_quota !== false && univObj.quota_limit != null
    const rankStr = hasQuota && rankMap[ap.id] != null ? `${rankMap[ap.id]}위` : '-'

    return {
      '대학명': univObj.univ_name || ap.univ_name || '',
      '전형명': univObj.track_name || ap.track_name || '',
      '지원학과': ap.department_name || '',
      '순위': rankStr,
      '학번': st.student_code || '',
      '성명': name,
      '학년': st.grade || 3,
      '반': st.class_no || '',
      '번호': st.seq_no || '',
      '점수/등급': scoreText,
      '선발상태': statusText,
      '비고': ap.excluded_reason || ''
    }
  }))

  exportRows.sort((a, b) => {
    if (a['대학명'] !== b['대학명']) return a['대학명'].localeCompare(b['대학명'], 'ko')
    if (a['전형명'] !== b['전형명']) return a['전형명'].localeCompare(b['전형명'], 'ko')

    // 학번순 정렬 (학년 -> 반 -> 번호 -> 학번)
    const aGrade = Number(a['학년']) || 0
    const bGrade = Number(b['학년']) || 0
    if (aGrade !== bGrade) return aGrade - bGrade

    const aClass = Number(a['반']) || 0
    const bClass = Number(b['반']) || 0
    if (aClass !== bClass) return aClass - bClass

    const aSeq = Number(a['번호']) || 0
    const bSeq = Number(b['번호']) || 0
    if (aSeq !== bSeq) return aSeq - bSeq

    return String(a['학번'] || '').localeCompare(String(b['학번'] || ''), 'ko', { numeric: true })
  })

  const headers = ['대학명', '전형명', '지원학과', '순위', '학번', '성명', '학년', '반', '번호', '점수/등급', '선발상태', '비고']
  return makeExcelBlobResponse(headers, exportRows)
}

export const exportRoundSummary = async (roundId) => {
  if (!supabase || !roundId) return { data: new Uint8Array() }

  const [{ data: univs }, { data: apps }] = await Promise.all([
    supabase.from('universities').select('*'),
    supabase.from('applications').select('*').eq('round', roundId)
  ])

  if (!univs) return makeExcelBlobResponse(['지역', '대학명', '전형명', '추천 제한인원', '총 지원자수', '추천 확정인원', '추천 포기인원', '미선발인원', '잔여 T/O'], [])

  const appGroup = {}
    ; (apps || []).forEach(ap => {
      if (!appGroup[ap.univ_id]) appGroup[ap.univ_id] = []
      appGroup[ap.univ_id].push(ap)
    })

  const exportRows = univs.map(u => {
    const uApps = appGroup[u.id] || []
    const totalCount = uApps.length
    const activeApps = uApps.filter(ap => !ap.is_abandoned)
    const recCount = activeApps.filter(ap => ap.is_recommended).length
    const abandonCount = uApps.filter(ap => ap.is_abandoned).length
    const excCount = activeApps.filter(ap => ap.is_excluded).length

    const hasQuota = u.has_quota !== false && u.quota_limit > 0
    const quotaLimitText = hasQuota ? `${u.quota_limit}명` : '제한없음'
    const remainingTo = hasQuota ? Math.max(0, u.quota_limit - recCount) : '제한없음'

    return {
      '지역': u.region || '',
      '대학명': u.univ_name || '',
      '전형명': u.track_name || '',
      '추천 제한인원': quotaLimitText,
      '총 지원자수': totalCount,
      '추천 확정인원': recCount,
      '추천 포기인원': abandonCount,
      '미선발인원': excCount,
      '잔여 T/O': remainingTo
    }
  })

  exportRows.sort((a, b) => {
    if (a['지역'] !== b['지역']) return a['지역'].localeCompare(b['지역'], 'ko')
    return a['대학명'].localeCompare(b['대학명'], 'ko')
  })

  const headers = ['지역', '대학명', '전형명', '추천 제한인원', '총 지원자수', '추천 확정인원', '추천 포기인원', '미선발인원', '잔여 T/O']
  return makeExcelBlobResponse(headers, exportRows)
}

// 26. 비밀번호 변경 (관리자)
export const changeAdminPassword = async (currentPassword, newPassword) => {
  if (!supabase) return
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })
  if (error) throw error
}

export const scorePreview = async () => ({ score: 0 })

function detectRegion(univ_name, metaRegion) {
  if (metaRegion && typeof metaRegion === 'string' && metaRegion.trim()) {
    return metaRegion.trim()
  }
  const name = univ_name || ''
  if (name.includes('인천') || name.includes('인하')) return '인천'
  if (name.includes('서울')) return '서울'
  if (name.includes('경기') || name.includes('가천') || name.includes('아주') || name.includes('한국공학')) return '경기'

  const seoulList = [
    '연세', '고려', '서강', '성균관', '한양', '이화', '중앙', '경희', '한국외',
    '시립', '건국', '동국', '홍익', '국민', '숭실', '세종', '가톨릭', '서경',
    '덕성', '동덕', '서울여', '성신', '삼육', '한성', '추계'
  ]
  if (seoulList.some(k => name.includes(k))) return '서울'

  return '그외지역'
}

export function normalizeQuotaLimitRaw(rawVal) {
  if (rawVal == null || rawVal === '') return null
  const str = String(rawVal).trim()
  if (!str) return null

  // 0 < n < 1 소수인 경우 (엑셀 백분율 셀 raw 값) -> "3%" 로 정규화
  const num = parseFloat(str)
  if (!isNaN(num) && num > 0 && num < 1 && !str.includes('%')) {
    const pct = parseFloat((num * 100).toPrecision(10))
    return `${pct}%`
  }

  return str
}

// 27. 잔여 정원 통계 및 보고서 데이터 조회
export const getQuotaStats = async () => {
  if (!supabase) return []

  // % 인원제한 환산용
  const disclosureCount = await getDisclosureCount()

  // % 문자열 quota_limit → 실제 수치 변환 헬퍼
  function resolveUnitQuota(rawVal) {
    if (rawVal == null || rawVal === '') return null
    const str = String(rawVal).trim()
    if (!str || str.includes('없음') || str.includes('제한없음') || str.includes('무제한')) return null

    const num = parseFloat(str)
    // 퍼센트 판별: 0 < n < 1 소수(엑셀 raw) OR 명시적 % 기호
    let pct = null
    if (!isNaN(num) && num > 0 && num < 1) {
      pct = num * 100
    } else {
      const pctMatch = str.match(/^(\d+(?:\.\d+)?)\s*%$/)
      if (pctMatch) pct = parseFloat(pctMatch[1])
    }

    if (pct !== null) {
      if (disclosureCount != null && disclosureCount > 0) {
        return Math.ceil(disclosureCount * pct / 100)
      }
      return null  // 정보공시 미설정 시 무제한 안전 처리
    }

    // 일반 숫자 ("12명", "5" 등)
    const numMatch = str.match(/\d+/)
    return numMatch ? parseInt(numMatch[0], 10) : null
  }

  // 모든 대학/모집단위 조회
  const rawUnivs = await getUniversities()

  // regional_recommendations에서 원본 인원제한 텍스트 조회
  // Map1: univ_name__track_name (정확 매칭)
  // Map2: univ_name 만 (단일 전형 대학 fallback)
  const { data: regRecs } = await supabase
    .from('regional_recommendations')
    .select('univ_name, track_name, quota_limit')
  const regRecMap = new Map()      // key: norm(univ)__norm(track)
  const regRecByUniv = new Map()   // key: norm(univ) (% 타입인 것만)
  // 대학명/전형명 정규화: 앞뒤 공백 제거, 내부 공백 제거, 소문자 변환
  const normKey = s => (s || '').trim().toLowerCase().replace(/\s+/g, '')
  for (const r of (regRecs || [])) {
    const uName = (r.univ_name || '').trim()
    const tName = (r.track_name || '').trim()
    const k = `${normKey(uName)}__${normKey(tName)}`
    if (!regRecMap.has(k)) regRecMap.set(k, r.quota_limit)
    // 퍼센트 타입 감지: "3%" 형태 OR 0 < n < 1 소수("0.03" 등 엑셀 % 셀 원본값)
    if (r.quota_limit != null) {
      const rawStr = String(r.quota_limit).trim()
      const rawNum = parseFloat(rawStr)
      const isPercent = /^\d+(?:\.\d+)?\s*%$/.test(rawStr) ||
        (!isNaN(rawNum) && rawNum > 0 && rawNum < 1)
      if (isPercent && !regRecByUniv.has(normKey(uName))) {
        regRecByUniv.set(normKey(uName), r.quota_limit)
      }
    }
  }

  // raw % 문자열에서 퍼센트 추출 헬퍼
  function extractPct(rawVal) {
    if (rawVal == null) return null
    const str = String(rawVal).trim()
    const num = parseFloat(str)
    if (!isNaN(num) && num > 0 && num < 1) return num * 100
    const m = str.match(/^(\d+(?:\.\d+)?)\s*%$/)
    return m ? parseFloat(m[1]) : null
  }

  // 학생 마스터 정보 조회 (재학생 vs 졸업생 구별용)
  const { data: studentList } = await supabase
    .from('enrolled_students')
    .select('id, is_enrolled, grade')

  const studentGradMap = new Map()
  studentList?.forEach(s => {
    // is_enrolled가 false 이거나 grade가 0이면 졸업생
    const isGrad = s.is_enrolled === false || s.grade === 0
    studentGradMap.set(s.id, isGrad)
  })

  // 추천 확정 현황 취합 (재학생/졸업생 구분)
  const { data: recommendedApps } = await supabase
    .from('applications')
    .select('univ_id, student_id')
    .eq('is_recommended', true)
    .eq('is_abandoned', false)

  const counts = {}
  const enrolledCounts = {}
  const gradCounts = {}

  recommendedApps?.forEach(ap => {
    const uId = ap.univ_id
    counts[uId] = (counts[uId] || 0) + 1
    const isGrad = studentGradMap.get(ap.student_id) === true
    if (isGrad) {
      gradCounts[uId] = (gradCounts[uId] || 0) + 1
    } else {
      enrolledCounts[uId] = (enrolledCounts[uId] || 0) + 1
    }
  })

  // 대학(univ_name) 별 그룹핑
  const univGroupMap = {}

  for (const u of rawUnivs) {
    const key = u.univ_name.trim()
    const recommendedCount = counts[u.id] || 0
    const enrolledUsed = enrolledCounts[u.id] || 0
    const gradUsed = gradCounts[u.id] || 0
    let meta = {}
    try {
      meta = JSON.parse(u.remarks || '{}')
    } catch {
      meta = { text: u.remarks }
    }

    const region = detectRegion(key, u.region || meta.region)

    if (!univGroupMap[key]) {
      univGroupMap[key] = {
        id: u.id,
        univ_id: u.id,
        univ_name: key,
        region: region,
        total_quota: meta.total_quota !== undefined ? meta.total_quota : null,
        total_used: 0,
        total_enrolled_used: 0,
        total_grad_used: 0,
        prioritize_enrolled: !!meta.prioritize_enrolled,
        tracks: []
      }
    }

    const group = univGroupMap[key]
    const regKey = `${normKey(key)}__${normKey(u.track_name || key)}`
    // 1순위: remarks.raw_quota_limit (DB 저장값), 2순위: regRecMap 정확 매칭, 3순위: 대학명만 fallback
    const rawQuotaLimit = u.raw_quota_limit ?? regRecMap.get(regKey) ?? regRecByUniv.get(normKey(key)) ?? null

    // unit_quota: DB 저장값(INTEGER)이 0이고 raw에 %가 있으면 다시 환산
    let unitQuota = u.has_quota ? resolveUnitQuota(u.quota_limit) : null
    if ((unitQuota === 0 || unitQuota === null) && rawQuotaLimit) {
      const pct = extractPct(rawQuotaLimit)
      if (pct !== null && disclosureCount != null && disclosureCount > 0) {
        unitQuota = Math.ceil(disclosureCount * pct / 100)
      }
    }

    group.total_used += recommendedCount
    group.total_enrolled_used += enrolledUsed
    group.total_grad_used += gradUsed
    if (meta.total_quota !== undefined && meta.total_quota !== null) {
      group.total_quota = meta.total_quota
    }

    group.tracks.push({
      id: u.id,
      track_id: u.id,
      track_name: u.track_name || key,
      track_type: u.track_type || '',
      unit_quota: unitQuota,
      raw_quota_limit: rawQuotaLimit,   // 원본 regional % 텍스트 ("3%" 등)
      unit_used: recommendedCount,
      enrolled_used: enrolledUsed,
      grad_used: gradUsed,
      remaining_quota: unitQuota !== null ? Math.max(0, unitQuota - recommendedCount) : null,
      prioritize_enrolled: meta.prioritize_enrolled !== undefined ? !!meta.prioritize_enrolled : !!u.prioritize_enrolled
    })
  }

  const groupedList = Object.values(univGroupMap)

  // 대학 전체 총 정원이 명시적으로 지정되지 않은 경우, 하위 모집단위 정원의 합을 대학 총 정원으로 계산
  for (const group of groupedList) {
    if (group.total_quota === null || group.total_quota === undefined) {
      const hasUnlimitedTrack = group.tracks.some(t => t.unit_quota === null)
      if (!hasUnlimitedTrack && group.tracks.length > 0) {
        group.total_quota = group.tracks.reduce((sum, t) => sum + (t.unit_quota || 0), 0)
      }
    }
  }

  // 지역 정렬 규칙: 서울(1) -> 경기(2) -> 인천(3) -> 그외지역(4), 동일 지역 내 가나다순
  function getRegionRank(regionStr) {
    if (!regionStr) return 4
    const r = String(regionStr).trim()
    if (r.includes('서울')) return 1
    if (r.includes('경기')) return 2
    if (r.includes('인천')) return 3
    return 4
  }

  groupedList.sort((a, b) => {
    const rA = getRegionRank(a.region)
    const rB = getRegionRank(b.region)
    if (rA !== rB) return rA - rB
    return a.univ_name.localeCompare(b.univ_name, 'ko')
  })

  // 각 대학 내의 모집단위(학과)도 가나다순 정렬
  groupedList.forEach(g => {
    g.tracks.sort((a, b) => a.track_name.localeCompare(b.track_name, 'ko'))
  })

  // 하위 호환성을 위해 .univs 프로퍼티 연결
  groupedList.univs = groupedList

  return groupedList
}

// 학급별 마감 확정 현황 (더미)
export const getRoundConfirmationStatus = async () => {
  return { classes: [] }
}

export const exportQuotaStats = async (param = null) => {
  let selectedRound = null
  let filterUnivId = null

  if (param != null) {
    if (typeof param === 'number' || (!isNaN(parseInt(param, 10)) && !String(param).includes('-'))) {
      selectedRound = parseInt(param, 10)
    } else if (param === 'all') {
      selectedRound = null
    } else if (typeof param === 'string' && param.includes('-')) {
      filterUnivId = param
    }
  }

  const stats = await getQuotaStats()
  const disclosureCount = await getDisclosureCount()

  // 1. 지원서 전체 조회 (차수별 이전 선발 인원 및 해당 차수 선발 인원 계산용)
  let allRecApps = []
  let stMap = {}
  let univList = []
  if (supabase) {
    const [{ data: recData }, { data: stData }, { data: uData }] = await Promise.all([
      supabase.from('applications').select('*').eq('is_recommended', true).eq('is_abandoned', false).order('round', { ascending: true }),
      supabase.from('enrolled_students').select('id, name, student_code, grade, class_no, seq_no, is_enrolled, grad_year, gpa_overall'),
      supabase.from('universities').select('id, univ_name, track_name, unit_quota, raw_quota_limit')
    ])
    allRecApps = recData || []
    univList = uData || []
    for (const s of (stData || [])) {
      const decName = await decryptText(s.name)
      stMap[s.id] = { ...s, name: decName }
    }
  }

  // 트랙별 차수별 선발 인원 맵
  const priorUsedMap = {}
  const currentUsedMap = {}
  const currentEnrolledUsedMap = {}
  const currentGradUsedMap = {}

  for (const ap of allRecApps) {
    const tId = ap.univ_id
    const r = ap.recommended_round || ap.round || 1
    const isGrad = stMap[ap.student_id]?.is_enrolled === false || (!stMap[ap.student_id]?.grade && stMap[ap.student_id]?.grad_year)

    if (selectedRound && selectedRound >= 2) {
      if (r < selectedRound) {
        priorUsedMap[tId] = (priorUsedMap[tId] || 0) + 1
      }
    }

    if (!selectedRound || r === selectedRound) {
      currentUsedMap[tId] = (currentUsedMap[tId] || 0) + 1
      if (isGrad) {
        currentGradUsedMap[tId] = (currentGradUsedMap[tId] || 0) + 1
      } else {
        currentEnrolledUsedMap[tId] = (currentEnrolledUsedMap[tId] || 0) + 1
      }
    }
  }

  function formatExcelQuota(unitQuota, rawQuotaLimit, remainingAfterPrev = null) {
    let baseStr = ''
    if (rawQuotaLimit) {
      const str = String(rawQuotaLimit).trim()
      const num = parseFloat(str)
      let pct = null
      if (!isNaN(num) && num > 0 && num < 1) {
        pct = num * 100
      } else {
        const m = str.match(/^(\d+(?:\.\d+)?)\s*%$/)
        if (m) pct = parseFloat(m[1])
      }
      if (pct !== null) {
        const pctClean = parseFloat(pct.toPrecision(10))
        if (unitQuota != null && unitQuota > 0) {
          baseStr = `${unitQuota}명 (${pctClean}%)`
        } else if (disclosureCount) {
          const calc = Math.ceil(disclosureCount * pct / 100)
          baseStr = `${calc}명 (${pctClean}%)`
        } else {
          baseStr = `${pctClean}%`
        }
      }
    }
    if (!baseStr) {
      baseStr = unitQuota != null ? `${unitQuota}명` : '무제한'
    }

    if (selectedRound && selectedRound >= 2 && remainingAfterPrev !== null && unitQuota != null) {
      return `총 ${baseStr} (잔여 ${remainingAfterPrev}명)`
    }
    return baseStr
  }

  const headers = ['No', '지역', '대학명', '구분 / 모집단위(학과)', '추천 제한 정원', '추천 확정 인원', '(재학생)', '(졸업생)', '잔여 추천 정원']
  const rows = []

  let index = 1
  for (const u of stats) {
    if (filterUnivId && u.id !== filterUnivId) continue

    // 대학 총괄 행
    const totalUsed = selectedRound ? (u.tracks.reduce((sum, t) => sum + (currentUsedMap[t.track_id] || 0), 0)) : u.total_used
    const totalEnrolled = selectedRound ? (u.tracks.reduce((sum, t) => sum + (currentEnrolledUsedMap[t.track_id] || 0), 0)) : (u.total_enrolled_used || 0)
    const totalGrad = selectedRound ? (u.tracks.reduce((sum, t) => sum + (currentGradUsedMap[t.track_id] || 0), 0)) : (u.total_grad_used || 0)
    const priorUnivUsed = u.tracks.reduce((sum, t) => sum + (priorUsedMap[t.track_id] || 0), 0)
    const univRemainingAfterPrior = u.total_quota !== null ? Math.max(0, u.total_quota - priorUnivUsed) : null
    const univRemaining = u.total_quota !== null ? Math.max(0, (univRemainingAfterPrior ?? u.total_quota) - totalUsed) + '명' : '무제한'

    const univQuotaDisplay = (selectedRound && selectedRound >= 2 && u.total_quota !== null)
      ? `총 ${u.total_quota}명 (잔여 ${univRemainingAfterPrior}명)`
      : (u.total_quota !== null ? u.total_quota + '명' : '무제한')

    rows.push([
      index++,
      u.region || '그외지역',
      u.univ_name,
      '[대학 전체 총괄]',
      univQuotaDisplay,
      totalUsed > 0 ? totalUsed + '명' : '-',
      totalEnrolled > 0 ? totalEnrolled + '명' : '-',
      totalGrad > 0 ? totalGrad + '명' : '-',
      univRemaining
    ])

    // 학과별 세부 행
    for (const t of u.tracks) {
      const priorUsed = priorUsedMap[t.track_id] || 0
      const remainingAfterPrev = t.unit_quota !== null ? Math.max(0, t.unit_quota - priorUsed) : null
      const unitUsed = selectedRound ? (currentUsedMap[t.track_id] || 0) : t.unit_used
      const enrolledUsed = selectedRound ? (currentEnrolledUsedMap[t.track_id] || 0) : t.enrolled_used
      const gradUsed = selectedRound ? (currentGradUsedMap[t.track_id] || 0) : t.grad_used
      const trackRemaining = t.unit_quota !== null ? Math.max(0, (remainingAfterPrev ?? t.unit_quota) - unitUsed) + '명' : '무제한'

      const displayTrackName = t.track_type ? `(${t.track_type}) ${t.track_name}` : t.track_name
      rows.push([
        '',
        '',
        u.univ_name,
        `  └ ${displayTrackName}`,
        formatExcelQuota(t.unit_quota, t.raw_quota_limit, remainingAfterPrev),
        unitUsed > 0 ? unitUsed + '명' : '-',
        enrolledUsed > 0 ? enrolledUsed + '명' : '-',
        gradUsed > 0 ? gradUsed + '명' : '-',
        trackRemaining
      ])
    }
  }

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
  const workbook = XLSX.utils.book_new()
  const sheet1Name = selectedRound ? `추천현황_${selectedRound}차` : '추천현황종합보고서'
  XLSX.utils.book_append_sheet(workbook, worksheet, sheet1Name)

  // 2. 추천 대상 학생 세부 명단 시트 추가 (지원/선발 차수 포함)
  try {
    const studentHeaders = ['No', '대학명', '모집단위', '학번', '성명', '구분', '내신/점수', '지원 차수', '선발(확정) 차수', '비고']
    const studentRows = []
    let sIdx = 1

    const uMap = {}
    for (const u of univList) {
      uMap[u.id] = u
    }

    for (const ap of allRecApps) {
      if (filterUnivId && ap.univ_id !== filterUnivId) continue
      const r = ap.recommended_round || ap.round || 1
      if (selectedRound && r !== selectedRound) continue

      const s = stMap[ap.student_id] || {}
      const u = uMap[ap.univ_id] || {}
      const isGrad = s.is_enrolled === false || (!s.grade && s.grad_year)
      const scoreVal = ap.univ_calc_score != null ? ap.univ_calc_score : ap.manual_score
      const scoreText = (scoreVal != null && Number(scoreVal) > 0) ? `${scoreVal}점` : (s.gpa_overall ? `${s.gpa_overall}등급` : '-')

      studentRows.push([
        sIdx++,
        u.univ_name || '-',
        u.track_name || '-',
        s.student_code || '-',
        s.name || ap.name || '-',
        isGrad ? '졸업생' : '재학생',
        scoreText,
        `${ap.round || 1}차 지원`,
        `${ap.recommended_round || ap.round || 1}차 선발`,
        '추천 확정'
      ])
    }

    const studentWorksheet = XLSX.utils.aoa_to_sheet([studentHeaders, ...studentRows])
    const sheet2Name = selectedRound ? `추천학생명단_${selectedRound}차` : '추천대상학생명단'
    XLSX.utils.book_append_sheet(workbook, studentWorksheet, sheet2Name)
  } catch (err) {
    console.warn('추천학생명단 시트 생성 중 오류 발생:', err)
  }

  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/octet-stream' })
  blob.data = blob
  return blob
}

export const exportAbandonedExcel = (list, roundStr = '전체') => {
  const headers = ['No', '대학명', '모집단위(전형명)', '지원학과', '차수', '학번', '성명', '구분', '포기일자', '포기 사유']
  const rows = list.map((ab, idx) => [
    idx + 1,
    ab.univ_name || '-',
    ab.track_name || '-',
    ab.department_name || '-',
    `${ab.abandoned_round || ab.round}차`,
    ab.student_code || '-',
    ab.name || '-',
    ab.grade_type || '-',
    ab.date || '-',
    ab.reason || '-'
  ])

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
  const workbook = XLSX.utils.book_new()
  const sheetName = roundStr === '전체' ? '추천포기자명단' : `추천포기자_${roundStr}`
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/octet-stream' })
  blob.data = blob
  return blob
}

export const getTrackRecommendedList = async (trackId) => {
  if (!supabase) return []
  const { data: appsData, error } = await supabase
    .from('applications')
    .select('*')
    .eq('univ_id', trackId)
    .eq('is_recommended', true)
    .eq('is_abandoned', false)

  if (error) throw error
  if (!appsData || appsData.length === 0) return []

  const studentIds = appsData.map(ap => ap.student_id)
  const [{ data: studentsData }, { data: profilesData }] = await Promise.all([
    supabase.from('enrolled_students').select('id, name, student_code, is_enrolled').in('id', studentIds),
    supabase.from('profiles').select('id, name, student_code, is_enrolled').in('id', studentIds)
  ])

  const studentMap = new Map((studentsData || []).map(s => [s.id, s]))
  const profileMap = new Map((profilesData || []).map(p => [p.id, p]))

  const mapped = await Promise.all(appsData.map(async (ap, index) => {
    const stInfo = studentMap.get(ap.student_id) || profileMap.get(ap.student_id) || {}
    let studentName = stInfo.name || '미명학생'
    if (studentName.startsWith('enc:')) {
      try { studentName = await decryptText(studentName) } catch { studentName = '복호화실패' }
    }
    return {
      student_id: ap.student_id,
      name: studentName,
      student_code: stInfo.student_code || '',
      is_enrolled: stInfo.is_enrolled !== false,
      abandoned: ap.is_abandoned,
      ranking: index + 1
    }
  }))

  return mapped
}

export const downloadUnivSettingsTemplate = async () => {
  const headers = ['대학명', '대학 정원', '모집단위명', '모집단위 정원', '재학생 우선 여부']
  const sampleData = [
    ['○○대학교', 5, '인문계열', '제한 없음', 'Y'],
    ['○○대학교', 5, '자연계열', '제한 없음', 'Y'],
    ['△△대학교', '제한 없음', '인문계열', '제한 없음', 'N'],
    ['△△대학교', '제한 없음', '자연계열', '제한 없음', 'N'],
    ['△△대학교', '제한 없음', '의학계열', 1, 'N'],
  ]
  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '대학 설정')
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return { data: wbout }
}

export const exportUnivSettings = async () => {
  const univs = await getUniversities()
  const headers = ['대학명', '대학 정원', '모집단위명', '모집단위 정원', '재학생 우선 여부']
  const rows = univs.map(u => [
    u.univ_name,
    u.total_quota !== null ? u.total_quota : '제한 없음',
    u.track_name,
    u.unit_quota !== null ? u.unit_quota : '제한 없음',
    u.prioritize_enrolled ? 'Y' : 'N'
  ])

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '대학 설정')
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return { data: wbout }
}

export const previewUnivSettings = async (file) => {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })

  if (rows.length < 2) {
    throw new Error('파일에 데이터가 없습니다.')
  }

  const headers = rows[0]
  const colUnivName = headers.indexOf('대학명')
  const colUnivQuota = headers.indexOf('대학 정원')
  const colTrackName = headers.indexOf('모집단위명')
  const colTrackQuota = headers.indexOf('모집단위 정원')
  const colPrioritize = headers.indexOf('재학생 우선 여부')

  if (colUnivName === -1 || colTrackName === -1) {
    throw new Error('필수 열(대학명, 모집단위명)이 누락되었습니다.')
  }

  const currentUnivs = await getUniversities()
  const currentMap = new Map()
  currentUnivs.forEach(u => {
    currentMap.set(`${u.univ_name}-${u.track_name}`, u)
  })

  const errors = []
  const changes = []
  let unchanged_count = 0
  const processedKeys = new Set()

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length === 0) continue

    const univName = String(row[colUnivName] || '').trim()
    const trackName = String(row[colTrackName] || '').trim()

    if (!univName || !trackName) continue

    const key = `${univName}-${trackName}`
    if (processedKeys.has(key)) {
      errors.push(`행 ${i + 1}: 중복된 대학 및 모집단위가 존재합니다 (${univName} - ${trackName})`)
      continue
    }
    processedKeys.add(key)

    let totalQuota = null
    if (colUnivQuota !== -1) {
      const qVal = String(row[colUnivQuota]).trim()
      if (qVal && qVal !== '제한 없음' && qVal !== '무제한') {
        const num = Number(qVal)
        if (isNaN(num) || num < 1) {
          errors.push(`행 ${i + 1}: 대학 정원은 숫자 또는 '제한 없음'이어야 합니다.`)
        } else {
          totalQuota = num
        }
      }
    }

    let unitQuota = null
    if (colTrackQuota !== -1) {
      const qVal = String(row[colTrackQuota]).trim()
      if (qVal && qVal !== '제한 없음' && qVal !== '무제한') {
        const num = Number(qVal)
        if (isNaN(num) || num < 1) {
          errors.push(`행 ${i + 1}: 모집단위 정원은 숫자 또는 '제한 없음'이어야 합니다.`)
        } else {
          unitQuota = num
        }
      }
    }

    let prioritizeEnrolled = false
    if (colPrioritize !== -1) {
      const pVal = String(row[colPrioritize] || '').trim().toUpperCase()
      prioritizeEnrolled = pVal === 'Y' || pVal === 'TRUE' || pVal === '예' || pVal === '1'
    }

    const existing = currentMap.get(key)
    if (!existing) {
      changes.push({
        univ_name: univName,
        track_name: trackName,
        op: 'create',
        blocked: false,
        fields: [
          { field: '대학명', old: '—', new: univName },
          { field: '모집단위명', old: '—', new: trackName },
          { field: '대학 정원', old: '—', new: totalQuota !== null ? `${totalQuota}명` : '제한 없음' },
          { field: '모집단위 정원', old: '—', new: unitQuota !== null ? `${unitQuota}명` : '제한 없음' },
          { field: '재학생 우선', old: '—', new: prioritizeEnrolled ? '설정' : '해제' }
        ]
      })
    } else {
      const fields = []
      if (existing.total_quota !== totalQuota) {
        fields.push({
          field: '대학 정원',
          old: existing.total_quota !== null ? `${existing.total_quota}명` : '제한 없음',
          new: totalQuota !== null ? `${totalQuota}명` : '제한 없음'
        })
      }
      if (existing.unit_quota !== unitQuota) {
        fields.push({
          field: '모집단위 정원',
          old: existing.unit_quota !== null ? `${existing.unit_quota}명` : '제한 없음',
          new: unitQuota !== null ? `${unitQuota}명` : '제한 없음'
        })
      }
      if (existing.prioritize_enrolled !== prioritizeEnrolled) {
        fields.push({
          field: '재학생 우선',
          old: existing.prioritize_enrolled ? '설정' : '해제',
          new: prioritizeEnrolled ? '설정' : '해제'
        })
      }

      if (fields.length > 0) {
        changes.push({
          univ_name: univName,
          track_name: trackName,
          op: 'update',
          blocked: false,
          fields
        })
      } else {
        unchanged_count++
      }
    }
  }

  return {
    errors,
    changes,
    unchanged_count,
    closed_round_labels: [],
    has_blocked: false
  }
}

export const importUnivSettings = async (file) => {
  const preview = await previewUnivSettings(file)
  if (preview.errors.length > 0) {
    throw new Error('가져오기 오류가 있습니다. 파일 내용을 확인하세요.')
  }

  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })

  const headers = rows[0]
  const colUnivName = headers.indexOf('대학명')
  const colUnivQuota = headers.indexOf('대학 정원')
  const colTrackName = headers.indexOf('모집단위명')
  const colTrackQuota = headers.indexOf('모집단위 정원')
  const colPrioritize = headers.indexOf('재학생 우선 여부')

  const currentUnivs = await getUniversities()
  const currentMap = new Map()
  currentUnivs.forEach(u => {
    currentMap.set(`${u.univ_name}-${u.track_name}`, u)
  })

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length === 0) continue

    const univName = String(row[colUnivName] || '').trim()
    const trackName = String(row[colTrackName] || '').trim()

    if (!univName || !trackName) continue

    let totalQuota = null
    if (colUnivQuota !== -1) {
      const qVal = String(row[colUnivQuota]).trim()
      if (qVal && qVal !== '제한 없음' && qVal !== '무제한') {
        totalQuota = Number(qVal) || null
      }
    }
    let unitQuota = null
    if (colTrackQuota !== -1) {
      const qVal = String(row[colTrackQuota]).trim()
      if (qVal && qVal !== '제한 없음' && qVal !== '무제한') {
        unitQuota = Number(qVal) || null
      }
    }
    let prioritizeEnrolled = false
    if (colPrioritize !== -1) {
      const pVal = String(row[colPrioritize] || '').trim().toUpperCase()
      prioritizeEnrolled = pVal === 'Y' || pVal === 'TRUE' || pVal === '예' || pVal === '1'
    }

    const key = `${univName}-${trackName}`
    const existing = currentMap.get(key)

    const body = {
      univ_name: univName,
      track_name: trackName,
      total_quota: totalQuota,
      unit_quota: unitQuota,
      prioritize_enrolled: prioritizeEnrolled
    }

    if (existing) {
      await updateUniversity(existing.id, body)
    } else {
      await createUniversity(body)
    }
  }
}

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

  const page = params.page || 1
  const perPage = params.per_page || 50
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let query = supabase
    .from('audit_logs')
    .select('*, profiles:actor_id(name, role, grade, class_no)', { count: 'exact' })

  if (params.action) {
    query = query.eq('action', params.action)
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error

  return {
    rows: (data || []).map(log => {
      let detailsObj = log.details
      if (typeof log.details === 'string') {
        try { detailsObj = JSON.parse(log.details) } catch { detailsObj = { text: log.details } }
      }
      detailsObj = detailsObj || {}

      const profile = log.profiles || {}

      let actorLabel = '시스템'
      if (profile.role === 'admin' || profile.role === 'ADMIN') actorLabel = '관리자'
      else if (profile.name) {
        if (profile.grade && profile.class_no) actorLabel = `${profile.grade}학년 ${profile.class_no}반 ${profile.name}`
        else actorLabel = `${profile.name} 선생님`
      } else if (log.actor_id) {
        actorLabel = '선생님/관리자'
      }

      // 대상(Target) 정보 추출
      let targetLabel = '-'
      if (detailsObj.student_name) targetLabel = detailsObj.student_name
      else if (detailsObj.teacher_name || detailsObj.name) targetLabel = detailsObj.teacher_name || detailsObj.name
      else if (detailsObj.univ_name) targetLabel = `${detailsObj.univ_name} ${detailsObj.track_name || ''}`.trim()
      else if (detailsObj.target) targetLabel = detailsObj.target

      // 상세 내용(Details) 추출
      let summaryText = '-'
      if (detailsObj.message) summaryText = detailsObj.message
      else if (detailsObj.reason) summaryText = `사유: ${detailsObj.reason}`
      else if (detailsObj.count) summaryText = `${detailsObj.count}건 처리 완료`
      else if (typeof log.details === 'string') summaryText = log.details

      return {
        id: log.id,
        at: log.created_at || log.at,
        created_at: log.created_at || log.at,
        action: log.action,
        actor_name: actorLabel,
        actor_role: profile.role || 'system',
        target_name: targetLabel,
        details_text: summaryText,
        detail: detailsObj,
        details: detailsObj,
      }
    }),
    total: count || 0,
    page,
    per_page: perPage
  }
}

export const exportAuditLogs = () => { }
export const adminAreaScorePreview = async () => ({ score: 0 })

export function sortRegionalRows(rows) {
  function getRegionPriority(regStr) {
    const clean = String(regStr || '').trim()
    if (clean.includes('서울')) return 1
    if (clean.includes('경기')) return 2
    if (clean.includes('인천')) return 3
    if (clean.includes('사관')) return 5
    if (clean.includes('경찰')) return 6
    return 4 // 기타지역
  }

  const sorted = [...rows].sort((a, b) => {
    const regA = String(a.region || '').trim()
    const regB = String(b.region || '').trim()

    const prioA = getRegionPriority(regA)
    const prioB = getRegionPriority(regB)

    if (prioA !== prioB) {
      return prioA - prioB
    }

    if (prioA === 4 && prioB === 4 && regA !== regB) {
      return regA.localeCompare(regB, 'ko')
    }

    const univA = String(a.univ_name || '').trim()
    const univB = String(b.univ_name || '').trim()

    if (univA !== univB) {
      return univA.localeCompare(univB, 'ko')
    }

    const trackA = String(a.track_name || '').trim()
    const trackB = String(b.track_name || '').trim()

    return trackA.localeCompare(trackB, 'ko')
  })

  return sorted.map((row, idx) => ({
    ...row,
    seq_no: idx + 1
  }))
}

export const getRegionalRecommendations = async () => {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('regional_recommendations')
    .select('*')

  if (error) throw error
  return sortRegionalRows(data || [])
}

export const deleteRegionalRecommendations = async () => {
  if (!supabase) return
  const { error } = await supabase
    .from('regional_recommendations')
    .delete()
    .gt('seq_no', -1)

  if (error) {
    const { error: error2 } = await supabase
      .from('regional_recommendations')
      .delete()
      .not('id', 'is', null)
    if (error2) throw error2
  }
}

export function normalizeUnivName(name) {
  if (!name) return ''
  let clean = String(name).trim()

  const UNIV_MAP = {
    '서울대': '서울대학교',
    '연세대': '연세대학교',
    '고려대': '고려대학교',
    '성균관대': '성균관대학교',
    '한양대': '한양대학교',
    '서강대': '서강대학교',
    '이화여대': '이화여자대학교',
    '이화대': '이화여자대학교',
    '중앙대': '중앙대학교',
    '경희대': '경희대학교',
    '한국외대': '한국외국어대학교',
    '외대': '한국외국어대학교',
    '서울시립대': '서울시립대학교',
    '시립대': '서울시립대학교',
    '건국대': '건국대학교',
    '동국대': '동국대학교',
    '홍익대': '홍익대학교',
    '국민대': '국민대학교',
    '숭실대': '숭실대학교',
    '세종대': '세종대학교',
    '단국대': '단국대학교',
    '아주대': '아주대학교',
    '인하대': '인하대학교',
    '가톨릭대': '가톨릭대학교',
    '명지대': '명지대학교',
    '상명대': '상명대학교',
    '가천대': '가천대학교',
    '인천대': '인천대학교',
    '경기대': '경기대학교',
    '수원대': '수원대학교',
    '한성대': '한성대학교',
    '서경대': '서경대학교',
    '삼육대': '삼육대학교',
    '서울여대': '서울여자대학교',
    '덕성여대': '덕성여자대학교',
    '동덕여대': '동덕여자대학교',
    '성신여대': '성신여자대학교',
    '한국공학대': '한국공학대학교',
    '한국항공대': '한국항공대학교',
    '한양대(에리카)': '한양대학교(ERICA)',
    '한양대(ERICA)': '한양대학교(ERICA)',
    '한국외대(글로벌)': '한국외국어대학교(글로벌)',
    '중앙대(다빈치)': '중앙대학교(다빈치)',
  }

  if (UNIV_MAP[clean]) return UNIV_MAP[clean]

  if (clean.endsWith('대') && !clean.endsWith('대학교')) {
    return clean + '학교'
  }

  return clean
}

export const importRegionalRecommendations = async (file) => {
  if (!supabase) return { count: 0 }

  // 정보공시 재학생 수 사전 조회 (엑셀 가져오기 시점에 인원 환산에 사용)
  const disclosureCount = await getDisclosureCount()

  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('엑셀 파일에 시트가 존재하지 않습니다.')
  }

  // 1. 시트(Sheet) 범용 자동 선택 (유효 컬럼 수가 가장 많은 시트 선택)
  let targetSheetName = workbook.SheetNames[0]
  let maxScore = -1

  for (const sName of workbook.SheetNames) {
    const sh = workbook.Sheets[sName]
    const matrix = XLSX.utils.sheet_to_json(sh, { header: 1, defval: '' })
    if (!matrix || matrix.length === 0) continue

    let colCount = 0
    let hasRelevantHeader = false

    for (let i = 0; i < Math.min(matrix.length, 10); i++) {
      const row = (matrix[i] || []).map(c => String(c || '').trim().replace(/\s+/g, ''))
      if (row.length > colCount) colCount = row.length
      if (row.some(cell => cell.includes('대학명') || cell.includes('전형명') || cell === '대학' || cell === '전형' || cell.includes('지역'))) {
        hasRelevantHeader = true
      }
    }

    const score = colCount + (hasRelevantHeader ? 100 : 0)
    if (score > maxScore) {
      maxScore = score
      targetSheetName = sName
    }
  }

  const worksheet = workbook.Sheets[targetSheetName]

  // 2. 2D 매트릭스 형태로 시트 데이터 추출
  const sheetMatrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
  if (!sheetMatrix || sheetMatrix.length === 0) {
    throw new Error('엑셀 파일에 데이터가 없습니다.')
  }

  // 3. 헤더 행(Header Row) 스마트 자동 탐색
  let headerRowIndex = 0
  for (let i = 0; i < Math.min(sheetMatrix.length, 10); i++) {
    const rowCells = (sheetMatrix[i] || []).map(c => String(c || '').trim().replace(/\s+/g, ''))
    const matchCount = rowCells.filter(cell => 
      cell.includes('대학') || cell.includes('전형') || cell.includes('지역') || cell.includes('인원') || cell.includes('구분')
    ).length
    if (matchCount >= 2) {
      headerRowIndex = i
      break
    }
  }

  // 4. 헤더 행 컬럼 인덱스 분석
  const headerRow = sheetMatrix[headerRowIndex] || []
  let colIdxRegion = -1      // Column A (0)
  let colIdxUniv = -1        // Column B (1)
  let colIdxCategory = -1    // Column C (2) - 전형구분 (교과/종합)
  let colIdxTrack = -1       // Column D (3) - 전형명
  let colIdxQuota = -1       // Column E (4) - 인원제한
  let colIdxGrad = -1        // Column F (5) - 졸업년도조건
  let colIdxCsat = -1        // Column G (6) - 수능최저
  let colIdxElig = -1        // Column H (7) - 본교지원가능여부
  let colIdxRemarks = -1     // Column I (8) - 사전마감여부

  for (let ci = 0; ci < headerRow.length; ci++) {
    const h = String(headerRow[ci] || '').trim().replace(/[\s_\-\(\)\[\]\/\,\.]/g, '').toLowerCase()
    if (!h) continue

    if (colIdxRegion === -1 && (h.includes('지역') || h.includes('권역') || h.includes('소재지'))) {
      colIdxRegion = ci
    } else if (colIdxUniv === -1 && (h.includes('대학명') || h.includes('대학교') || h === '대학' || h.includes('학교명'))) {
      colIdxUniv = ci
    } else if (colIdxCategory === -1 && (h.includes('전형구분') || h.includes('전형유형') || h.includes('교과종합') || h.includes('선발유형') || h.includes('선발구분') || h.includes('모집구분') || (h.includes('구분') && !h.includes('졸업')) || h === '유형' || (h === '전형' && ci < 3))) {
      colIdxCategory = ci
    } else if (colIdxTrack === -1 && (h.includes('전형명') || h.includes('세부전형') || h.includes('모집단위') || (h === '전형' && ci >= 3))) {
      colIdxTrack = ci
    } else if (colIdxQuota === -1 && (h.includes('인원제한') || h.includes('추천인원') || h.includes('제한인원') || h.includes('정원') || h.includes('인원'))) {
      colIdxQuota = ci
    } else if (colIdxGrad === -1 && (h.includes('졸업') || h.includes('재학생'))) {
      colIdxGrad = ci
    } else if (colIdxCsat === -1 && (h.includes('수능') || h.includes('최저'))) {
      colIdxCsat = ci
    } else if (colIdxElig === -1 && (h.includes('본교') || h.includes('지원가능') || h.includes('자격') || h.includes('대상'))) {
      colIdxElig = ci
    } else if (colIdxRemarks === -1 && (h.includes('마감') || h.includes('비고') || h.includes('사전'))) {
      colIdxRemarks = ci
    }
  }

  // 기본 표준 위치 매핑 (구글 시트 9컬럼 기준: A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, I=8)
  if (colIdxRegion === -1) colIdxRegion = 0
  if (colIdxUniv === -1) colIdxUniv = 1
  if (colIdxCategory === -1) colIdxCategory = 2   // C컬럼 = 전형구분
  if (colIdxTrack === -1) colIdxTrack = 3
  if (colIdxQuota === -1) colIdxQuota = 4
  if (colIdxGrad === -1) colIdxGrad = 5
  if (colIdxCsat === -1) colIdxCsat = 6
  if (colIdxElig === -1) colIdxElig = 7
  if (colIdxRemarks === -1) colIdxRemarks = 8

  let lastRegion = ''
  let lastUnivName = ''
  let lastCategory = ''

  // 5. 각 데이터 행 순회 파싱
  const mappedRows = []
  for (let rIdx = headerRowIndex + 1; rIdx < sheetMatrix.length; rIdx++) {
    const mRow = sheetMatrix[rIdx] || []
    if (!mRow || mRow.length === 0) continue

    let reg = String(mRow[colIdxRegion] != null ? mRow[colIdxRegion] : '').trim()
    let rawUniv = String(mRow[colIdxUniv] != null ? mRow[colIdxUniv] : '').trim()
    let univ = normalizeUnivName(rawUniv)
    let rawCat = String(mRow[colIdxCategory] != null ? mRow[colIdxCategory] : '').trim()
    let track = String(mRow[colIdxTrack] != null ? mRow[colIdxTrack] : '').trim()
    let quotaLimit = normalizeQuotaLimitRaw(String(mRow[colIdxQuota] != null ? mRow[colIdxQuota] : '').trim())
    let gradCond = String(mRow[colIdxGrad] != null ? mRow[colIdxGrad] : '').trim()
    let csatMin = String(mRow[colIdxCsat] != null ? mRow[colIdxCsat] : '').trim()
    let schoolElig = String(mRow[colIdxElig] != null ? mRow[colIdxElig] : '').trim()
    let preClose = String(mRow[colIdxRemarks] != null ? mRow[colIdxRemarks] : '').trim()

    let category = rawCat

    if (!track && !univ) continue

    // 엑셀 병합 셀 및 이전 행 대학명/지역/구분 승계 처리
    if (univ) {
      lastUnivName = univ
      if (reg) lastRegion = reg
      else reg = lastRegion

      if (category) lastCategory = category
      else category = lastCategory
    } else if (track && lastUnivName) {
      univ = lastUnivName
      reg = reg || lastRegion
      category = category || lastCategory
    }

    if (!univ || !track) continue

    mappedRows.push({
      region: reg,
      univ_name: univ,
      recruitment_quota: category, // C컬럼 값 저장
      track_name: track,
      quota_limit: quotaLimit,
      grad_condition: gradCond,
      csat_min: csatMin,
      target_students: schoolElig,
      remarks: preClose,
      evaluation_method: '',
      reflected_subjects: '',
      reflected_indicators: '',
      course_unit_reflection: '',
      grade_ratio: '',
      grad_semesters: '',
      career_elective_method: ''
    })
  }

  if (mappedRows.length === 0) {
    throw new Error('올바른 전형 정보(대학명/전형명)를 찾을 수 없습니다.')
  }

  // 서울 -> 경기 -> 인천 -> 기타(오름차순) -> 대학명 -> 전형명 정렬 및 No 재할당
  const sortedRows = sortRegionalRows(mappedRows)

  // 기존 데이터 삭제 후 새 데이터 일괄 삽입
  await deleteRegionalRecommendations()

  const chunkSize = 100
  for (let i = 0; i < sortedRows.length; i += chunkSize) {
    const chunk = sortedRows.slice(i, i + chunkSize)
    const { error } = await supabase.from('regional_recommendations').insert(chunk)
    if (error) throw error
  }

  // 1단계 엑셀 업로드 직후 2단계 정원 목록 백그라운드 자동 동기화
  try {
    await syncRegionalToUniversities(sortedRows)
  } catch (e) {
    console.warn('Auto sync to universities failed:', e)
  }

  return { count: sortedRows.length }
}

export const syncPrincipalUnivsFromGoogleSheet = async (sheetId) => {
  if (!sheetId || !sheetId.trim()) {
    throw new Error('학교장 추천 전형 구글 스프레드시트 ID가 입력되지 않았습니다.')
  }

  const cleanId = sheetId.trim()
  const timestamp = Date.now()
  let file = null

  // 1. XLSX 바이너리 내보내기 시도 (캐시 방지 헤더 및 타임스탬프 적용)
  try {
    const xlsxUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/export?format=xlsx&_t=${timestamp}`
    const res = await fetch(xlsxUrl, { cache: 'no-store' })
    if (res.ok) {
      const buffer = await res.arrayBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      file = new File([blob], '2027_대입_학교장추천전형.xlsx', { type: blob.type })
    }
  } catch (e) {
    console.warn('XLSX format fetch failed, trying CSV format:', e)
  }

  // 2. CSV 내보내기 폴백 시도
  if (!file) {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/export?format=csv&_t=${timestamp}`
    const res = await fetch(csvUrl, { cache: 'no-store' })
    if (!res.ok) {
      throw new Error(`구글 스프레드시트를 불러올 수 없습니다. (상태 코드: ${res.status}). 구글 시트 공유 설정이 '링크가 있는 모든 사용자에게 공개(웹에 게시 또는 링크 보기 가능)' 상태인지 확인하세요.`)
    }
    const csvText = await res.text()
    const blob = new Blob([csvText], { type: 'text/csv' })
    file = new File([blob], '2027_대입_학교장추천전형.csv', { type: 'text/csv' })
  }

  return await importRegionalRecommendations(file)
}

function makeUnivMatchKey(univName, trackName) {
  const normU = normalizeUnivName(univName || '').replace(/\s+/g, '')
  const normT = String(trackName || '').trim().replace(/\s+/g, '')
  return `${normU}__${normT}`
}

export const syncRegionalToUniversities = async (customRows = null) => {
  if (!supabase) return { count: 0 }

  const regionalRows = customRows || await getRegionalRecommendations()
  if (!regionalRows || regionalRows.length === 0) {
    throw new Error('등록된 학교장 추천전형 모집요강 데이터가 없습니다. 먼저 상단의 [학교장 전형 DB 동기화] (구글 시트 동기화) 버튼을 클릭해 주세요.')
  }

  // 정보공시 재학생 수 (% 인원제한 환산용) - 루프 진입 전 1회만 조회
  const disclosureCount = await getDisclosureCount()
  const percentWarnings = []

  // 기존 등록된 2단계 대학/모집단위 조회 (정규화 매칭 키 맵핑)
  const { data: existingUnivs } = await supabase.from('universities').select('*')
  const existingMap = new Map(
    (existingUnivs || []).map(u => [makeUnivMatchKey(u.univ_name, u.track_name), u])
  )

  let count = 0
  let updatedCount = 0
  for (const r of regionalRows) {
    const univName = normalizeUnivName((r.univ_name || '').trim())
    const trackName = (r.track_name || '').trim()
    if (!univName || !trackName) continue

    const matchKey = makeUnivMatchKey(univName, trackName)

    // 1단계 요강 대상/마감 조건 파싱
    const target = String(r.target_students || '').trim()
    const remarks = String(r.remarks || '').trim()
    const gradCond = String(r.grad_condition || '').trim()

    // 본교지원가능여부가 '×', 'X', 'x', '✕', '✖', '불가' 이거나 사전마감여부에 '마감'이 포함되어 있는지 확인
    const isTargetX = /[×Xx✕✖]|불가/.test(target)
    const isClosed = remarks.includes('마감')
    const isBlocked = isTargetX || isClosed

    const existing = existingMap.get(matchKey)

    // 지원 불가 또는 사전 마감 항목인 경우
    if (isBlocked) {
      if (existing) {
        // 이미 등록된 전형 중 지원자가 없는 경우 universities 테이블에서 삭제
        const { count: appCount } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('univ_id', existing.id)

        if (!appCount || appCount === 0) {
          try {
            await deleteUniversity(existing.id)
            existingMap.delete(matchKey)
          } catch (_) { }
        }
      }
      // 신규 등록하지 않고 건너뜀
      continue
    }

    // 1단계 요강 인원제한 파싱
    let quotaLimit = null
    let rawQuota = String(r.quota_limit || '').trim()

    // 스마트 % 탐색 fallback
    if (!rawQuota.includes('%')) {
      const decimalNum = parseFloat(rawQuota)
      const isDecimalPercent = !isNaN(decimalNum) && decimalNum > 0 && decimalNum < 1
      if (isDecimalPercent) {
        const pctStr = parseFloat((decimalNum * 100).toPrecision(10))
        rawQuota = `${pctStr}%`
      } else {
        const textToSearch = `${r.quota_limit || ''} ${r.target_students || ''} ${r.remarks || ''}`
        const targetPctMatch = textToSearch.match(/(\d+(?:\.\d+)?)\s*%/)
        if (targetPctMatch) {
          rawQuota = `${targetPctMatch[1]}%`
        }
      }
    }

    let isPercentType = false

    if (rawQuota && !rawQuota.includes('없음') && !rawQuota.includes('제한없음') && !rawQuota.includes('무제한')) {
      const pctMatch = rawQuota.match(/^(\d+(?:\.\d+)?)\s*%$/) || rawQuota.match(/(\d+(?:\.\d+)?)\s*%/)
      const decimalNum = parseFloat(rawQuota)
      const isDecimalPercent = !isNaN(decimalNum) && decimalNum > 0 && decimalNum < 1 && !rawQuota.includes('%')

      if (pctMatch || isDecimalPercent) {
        isPercentType = true
        const pct = pctMatch ? parseFloat(pctMatch[1]) : decimalNum * 100
        if (!isNaN(pct)) {
          if (disclosureCount != null) {
            quotaLimit = Math.ceil(disclosureCount * pct / 100)
            rawQuota = `${parseFloat(pct.toPrecision(10))}%`
          } else {
            percentWarnings.push(`${univName} (${trackName}): ${rawQuota} → 정보공시 인원 미설정으로 무제한 처리`)
          }
        }
      } else {
        const numMatch = rawQuota.match(/\d+/)
        if (numMatch) {
          quotaLimit = parseInt(numMatch[0], 10)
        }
      }
    }

    // 1단계 요강 대상/졸업생 조건 파싱 (재학생만/지원불가 -> 재학생 우선 설정)
    const prioritizeEnrolled = target.includes('재학생만') || target === '재학생' || gradCond.includes('지원불가') || gradCond.includes('불가')

    // 전형구분: 구글 시트 C컬럼(recruitment_quota)의 값을 그대로 사용
    const determinedTrackType = String(r.recruitment_quota || '').trim() || '교과'

    if (existing) {
      const updates = {}
      // 1) track_type 동기화 (구글 시트 C컬럼 반영)
      if (existing.track_type !== determinedTrackType) {
        updates.track_type = determinedTrackType
      }
      // 2) 인원제한 (unit_quota, raw_quota_limit)
      const needsQuotaUpdate = isPercentType || existing.unit_quota !== quotaLimit || (isPercentType && existing.raw_quota_limit !== rawQuota)
      if (needsQuotaUpdate) {
        updates.unit_quota = quotaLimit
        updates.raw_quota_limit = isPercentType ? rawQuota : (existing.raw_quota_limit ?? null)
      }
      // 3) 수능최저 (csat_min)
      const newCsat = r.csat_min || 'X'
      if (existing.csat_min !== newCsat) {
        updates.csat_min = newCsat
      }
      // 4) 졸업생 지원가능 여부 (grad_allowed)
      const newGradAllowed = !gradCond.includes('지원불가')
      if (existing.grad_allowed !== newGradAllowed) {
        updates.grad_allowed = newGradAllowed
      }
      // 5) 재학생 우선 여부 (prioritize_enrolled)
      if (existing.prioritize_enrolled !== prioritizeEnrolled) {
        updates.prioritize_enrolled = prioritizeEnrolled
      }

      if (Object.keys(updates).length > 0) {
        await updateUniversity(existing.id, updates)
        updatedCount++
      }
      continue
    }

    // 2단계 universities 테이블에 자동 등록
    await createUniversity({
      univ_name: univName,
      track_name: trackName,
      track_type: determinedTrackType,
      total_quota: null,
      unit_quota: quotaLimit,
      raw_quota_limit: isPercentType ? rawQuota : null,
      prioritize_enrolled: prioritizeEnrolled,
      csat_min: r.csat_min || 'X',
      grad_allowed: !gradCond.includes('지원불가'),
    })

    existingMap.set(matchKey, { quota_limit: quotaLimit, track_type: determinedTrackType })
    count++
  }

  return { count, updatedCount, percentWarnings }
}

export const updateRegionalRecommendation = async (id, body) => {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('regional_recommendations')
    .update({
      region: body.region,
      univ_name: body.univ_name,
      recruitment_quota: body.recruitment_quota,
      track_name: body.track_name,
      quota_limit: body.quota_limit,
      target_students: body.target_students,
      grad_condition: body.grad_condition,
      csat_min: body.csat_min,
      evaluation_method: body.evaluation_method,
      reflected_subjects: body.reflected_subjects,
      reflected_indicators: body.reflected_indicators,
      course_unit_reflection: body.course_unit_reflection,
      grade_ratio: body.grade_ratio,
      grad_semesters: body.grad_semesters,
      career_elective_method: body.career_elective_method,
      remarks: body.remarks,
    })
    .eq('id', id)
    .select()

  if (error) throw error
  return data && data[0]
}

export const deleteSingleRegionalRecommendation = async (id) => {
  if (!supabase) return
  const { error } = await supabase
    .from('regional_recommendations')
    .delete()
    .eq('id', id)

  if (error) throw error
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

function getExcelRowValue(row, keys) {
  // 1. 키 그대로 매칭
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null) {
      const val = String(row[k]).trim()
      if (val !== '') return val
    }
  }

  // 2. 공백 및 특수문자 제거 후 정규화 매칭
  const normalizedRow = {}
  for (const origKey of Object.keys(row)) {
    const normKey = String(origKey).replace(/[\s_\-\(\)\[\]\/\,\.]/g, '').toLowerCase()
    if (row[origKey] !== undefined && row[origKey] !== null) {
      const val = String(row[origKey]).trim()
      if (val !== '' && !normalizedRow[normKey]) {
        normalizedRow[normKey] = val
      }
    }
  }

  for (const k of keys) {
    const normSearchKey = String(k).replace(/[\s_\-\(\)\[\]\/\,\.]/g, '').toLowerCase()
    if (normalizedRow[normSearchKey]) {
      return normalizedRow[normSearchKey]
    }
  }

  return ''
}


/**
 * 인원제한 열 전용 파싱 함수
 *
 * 엑셀에서 퍼센트 서식 셀(3%)은 XLSX가 0.03(소수)으로 읽습니다.
 * 정보공시 재학생 수(disclosureCount)를 받아 실제 인원으로 환산합니다.
 *
 * 변환 규칙:
 *   0.03 / "3%"  → disclosureCount 설정 시: String(Math.ceil(disclosureCount * 3 / 100))
 *               → 미설정 시: "3%" (나중에 재동기화 가능)
 *   "12명"      → "12명" (그대로)
 *   "없음"      → "없음" (그대로)
 */
function resolveQuotaLimit(rawVal, disclosureCount) {
  if (rawVal === '' || rawVal == null) return ''

  const str = String(rawVal).trim()
  const num = parseFloat(str)

  // 퍼센트 판별: 0 < n < 1 소수(엑셀 raw) OR 명시적 % 기호
  let pct = null
  if (!isNaN(num) && num > 0 && num < 1) {
    pct = num * 100   // 0.03 → 3
  } else {
    const pctMatch = str.match(/^(\d+(?:\.\d+)?)\s*%$/)
    if (pctMatch) pct = parseFloat(pctMatch[1])  // "3%" → 3
  }

  if (pct !== null) {
    if (disclosureCount != null && disclosureCount > 0) {
      // 정보공시 인원 기준으로 실제 인원 산정 (소수점 올림)
      return String(Math.ceil(disclosureCount * pct / 100))
    }
    // 정보공시 미설정: 퍼센트 문자열로 보관 (나중에 재동기화 가능)
    const pctClean = parseFloat(pct.toPrecision(10))
    return `${pctClean}%`
  }

  // 일반 텍스트 ("없음", "12명", "5" 등): 그대로 반환
  return str
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
  const profileRows = []

  for (let index = 0; index < rawRows.length; index++) {
    const row = rawRows[index]
    const rawStudentPhone = getExcelRowValue(row, [
      '학생전화', '학생전화번호', '학생연락처', '학생 전화', '학생 연락처',
      '학생H.P', '학생 H.P', '학생HP', '학생전화(끝4자리)', '학생(끝4자리)',
      '전화번호', '연락처', '전화'
    ])
    const rawParentPhone = getExcelRowValue(row, [
      '학부모전화', '학부모전화번호', '학부모연락처', '학부모 전화', '학부모 연락처',
      '학부모H.P', '학부모 H.P', '학부모HP', '학부모전화(끝4자리)', '학부모(끝4자리)',
      '보호자전화', '보호자연락처', '보호자 전화번호'
    ])

    const grade = Number(row['학년']) || 3
    const class_no = Number(row['반'])
    const student_no = Number(row['번호']) || Number(row['순번']) || (index + 1)
    const rawName = String(row['이름'] ?? '').trim()
    const rawParentName = getExcelRowValue(row, [
      '학부모이름', '학부모 성명', '학부모성명', '학부모 이름', '학부모',
      '보호자이름', '보호자성명', '보호자 이름', '보호자'
    ])
    const gender = String(row['성별'] ?? '').trim()
    const remarks = String(row['비고'] ?? '').trim()
    const sPhoneLast4 = formatPhoneLast4(rawStudentPhone)

    const cleanStudentPhone = String(rawStudentPhone || '').trim().replace(/\D/g, '')
    const sPhoneHash = cleanStudentPhone ? await hashPhone(cleanStudentPhone) : null

    const cleanParentPhone = String(rawParentPhone || '').trim().replace(/\D/g, '')
    const pPhoneHash = cleanParentPhone ? await hashPhone(cleanParentPhone) : null

    const encName = await encryptText(rawName)
    const encParentName = rawParentName ? await encryptText(rawParentName) : null
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
        student_phone_hash: sPhoneHash,
        parent_name_hash: encParentName,
        parent_phone_hash: pPhoneHash,
        is_enrolled: true,
        status: 'approved'
      })

      profileRows.push({
        student_code: studentCode,
        seq_no: student_no,
        grade,
        class_no,
        student_no,
        name: rawName,
        phone_last4: sPhoneLast4
      })
    }
  }

  if (enrolledRows.length === 0) {
    throw new Error('올바른 학생 정보(학년, 반, 번호, 이름)를 찾을 수 없습니다.')
  }

  // 1. enrolled_students 마스터 테이블에 업서트 (전화번호 SHA-256 암호화 저장)
  const { error: enrolledErr } = await supabase.from('enrolled_students').upsert(enrolledRows, {
    onConflict: 'student_code'
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
        upsertClass(c.grade, c.class_no, { teacher_name: defaultTeacherName, password: 'school1234!' }).catch(() => { })
      )
    }
  }

  if (creationTasks.length > 0) {
    await Promise.all(creationTasks)
  }

  return { count: enrolledRows.length }
}

// 32. 학생 명단 및 성적 데이터 전체 초기화 (Truncate / Delete All)
export const resetAllStudentAndGradeData = async () => {
  if (supabase) {
    try {
      const { error: delErr } = await supabase
        .from('enrolled_students')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (delErr) console.error('enrolled_students delete error:', delErr)

      await supabase.from('config').delete().in('key', ['global_course_grades', 'global_course_grades_detail'])
    } catch (e) {
      console.error('resetAllStudentAndGradeData error:', e)
    }
  }

  localStorage.removeItem('global_course_grades')
  localStorage.removeItem('global_course_grades_detail')

  return { success: true }
}

// ── 정보공시 재학생 수 config 관리 ──────────────────────────────
// key: 'disclosure_student_count'
// value: 학교 정보공시(4월 1일 기준) 재학생 수 (문자열로 저장)
export const getDisclosureCount = async () => {
  if (!supabase) return null
  try {
    const { data } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'disclosure_student_count')
      .maybeSingle()
    if (data && data.value) {
      const n = parseInt(data.value, 10)
      return isNaN(n) ? null : n
    }
    return null
  } catch {
    return null
  }
}

export const setDisclosureCount = async (count) => {
  if (!supabase) return
  const targetVal = String(count).trim()
  const { error } = await supabase
    .from('config')
    .upsert({ key: 'disclosure_student_count', value: targetVal }, { onConflict: 'key' })
  if (error) throw error
}

// DB 저장 데이터를 업로드 가능한 동일 형식 엑셀로 백업 내려받기
export const exportRegionalRecommendations = async () => {
  const rows = await getRegionalRecommendations()

  // 인원제한 백업 복원 헬퍼:
  // DB에 '10 (3%)' 또는 '10명 (3%)' 형태로 저장된 경우 → '3%' 로 복원
  // '3%' 또는 '0.03' 등 이미 원본 형태면 그대로 반환
  function restoreQuotaLimitRaw(val) {
    if (val == null) return ''
    const str = String(val).trim()
    // 패턴: "10 (3%)" / "10명 (3%)" / "10(3%)" → "3%" 추출
    const m = str.match(/^\d+명?\s*\((\d+(?:\.\d+)?%)\)$/)
    if (m) return m[1]
    return str
  }

  // 업로드 시 사용하는 9개 헤더명과 1:1 매핑
  const HEADERS = [
    '지역', '대학명', '전형구분', '전형명', '인원제한', '졸업년도조건', '수능최저학력기준', '본교지원가능여부', '사전마감여부'
  ]

  const dataRows = rows.map(r => [
    r.region || '',
    r.univ_name || '',
    r.recruitment_quota || '',
    r.track_name || '',
    restoreQuotaLimitRaw(r.quota_limit),   // '10 (3%)' → '3%' 복원
    r.grad_condition || '',
    r.csat_min || '',
    r.target_students || '',
    r.remarks || ''
  ])

  const worksheet = XLSX.utils.aoa_to_sheet([HEADERS, ...dataRows])

  // 컬럼 너비 자동 조정 (최소 12, 최대 50)
  const colWidths = HEADERS.map((h, ci) => {
    const maxLen = dataRows.reduce((acc, row) => {
      const cellLen = String(row[ci] || '').length
      return Math.max(acc, cellLen)
    }, h.length)
    return { wch: Math.min(Math.max(maxLen + 2, 12), 50) }
  })
  worksheet['!cols'] = colWidths

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '학교장추천전형요강')

  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return new Blob([wbout], { type: 'application/octet-stream' })
}

export const promoteNextEligibleStudent = async (univId, roundId) => {
  if (!supabase) return null

  // 1. 대학 정보 조회 (인원 제한 여부 및 제한 인원 확인)
  const { data: univ } = await supabase
    .from('universities')
    .select('*')
    .eq('id', univId)
    .single()

  if (!univ || !univ.has_quota || !univ.quota_limit) {
    return null
  }

  // 2. 해당 대학 및 라운드의 활성 지원서(포기하지 않은 사람) 조회
  const { data: apps, error: err1 } = await supabase
    .from('applications')
    .select('*')
    .eq('univ_id', univId)
    .eq('round', roundId)
    .eq('is_abandoned', false)

  if (err1 || !apps || apps.length === 0) return null

  // 3. 현재 이미 추천된(추천 확정) 학생 수 계산
  const recommendedCount = apps.filter(ap => ap.is_recommended).length
  if (recommendedCount >= univ.quota_limit) {
    // 이미 정원이 다 차있다면 다음 후보 승계를 진행하지 않음
    return null
  }

  // 4. 추천 대기 상태인 후보군 필터링 (추천 확정되지 않았으며, RLS/부적합 등으로 제외되지 않은 대상)
  const candidates = apps.filter(ap => !ap.is_recommended)
  if (candidates.length === 0) return null

  // 5. 학생 마스터 데이터 조회 (평균 석차등급 gpa_overall 결합용)
  const { data: students, error: err2 } = await supabase
    .from('enrolled_students')
    .select('id, name, student_code, gpa_overall')

  if (err2 || !students) return null

  const studentMap = {}
  students.forEach(s => {
    studentMap[s.id] = s
  })

  // 6. 대학 성정 정렬 규정에 맞게 차순위 후보자 정렬
  // (1) 대학 환산점수(수동 입력) 높은 점수 우선 (2) 석차등급 낮은 순(상위 성적) 우선
  candidates.sort((a, b) => {
    const stA = studentMap[a.student_id] || {}
    const stB = studentMap[b.student_id] || {}

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

  // 7. 최상위 후보자 1명을 추천명단에 등재 (승계)
  const nextStudent = candidates[0]
  const stInfo = studentMap[nextStudent.student_id] || {}

  const { error: updateErr } = await supabase
    .from('applications')
    .update({
      is_recommended: true,
      is_excluded: false,
      excluded_reason: null
    })
    .eq('id', nextStudent.id)

  if (updateErr) throw updateErr

  // 감사로그 추가
  try {
    const userRes = await supabase.auth.getUser()
    if (userRes?.data?.user) {
      await supabase.from('audit_logs').insert({
        actor_id: userRes.data.user.id,
        action: 'SUCCESSION',
        details: { student_id: nextStudent.student_id, univ_id: univId, round: roundId, name: stInfo.name }
      })
    }
  } catch (e) {
    console.warn('감사 로그 작성 실패:', e)
  }

  let decryptedName = stInfo.name || '미명 학생'
  if (decryptedName && decryptedName.startsWith('enc:')) {
    try {
      decryptedName = await decryptText(decryptedName)
    } catch { }
  }

  return {
    name: decryptedName,
    student_code: stInfo.student_code || '',
    univ_name: univ.univ_name,
    department_name: nextStudent.department_name
  }
}

/**
 * 31. 과거 버그로 오염된 포기원 서명 데이터(DB scanned_doc_url)를 학생 본인의 원래 서명으로 일괄 복구
 */
export async function repairCorruptedAbandonSignatures() {
  if (!supabase) return { repaired: 0 }
  let repairedCount = 0

  try {
    const { data: apps, error } = await supabase
      .from('applications')
      .select('id, student_id, scanned_doc_url, student_signature_url, parent_signature_url')
      .not('scanned_doc_url', 'is', null)

    if (error || !apps) return { repaired: 0 }

    for (const ap of apps) {
      if (!ap.scanned_doc_url) continue
      try {
        const parsed = typeof ap.scanned_doc_url === 'string' ? JSON.parse(ap.scanned_doc_url) : ap.scanned_doc_url
        if (!parsed) continue

        const sid = ap.student_id
        const isStCorrupted = parsed.student_signature_url && (
          parsed.student_signature_url.includes('_undefined_') ||
          (sid && parsed.student_signature_url.includes('student_') && !parsed.student_signature_url.includes(`_${sid}_`) && !parsed.student_signature_url.includes(`student_${sid}.`))
        )
        const isPaCorrupted = parsed.parent_signature_url && (
          parsed.parent_signature_url.includes('_undefined_') ||
          (sid && parsed.parent_signature_url.includes('student_') && !parsed.parent_signature_url.includes(`_${sid}_`) && !parsed.parent_signature_url.includes(`student_${sid}.`))
        )

        if (isStCorrupted || isPaCorrupted) {
          // 해당 학생의 정상 서명 조회
          let realStSig = ap.student_signature_url && !ap.student_signature_url.includes('_undefined_') ? ap.student_signature_url : null
          let realPaSig = ap.parent_signature_url && !ap.parent_signature_url.includes('_undefined_') ? ap.parent_signature_url : null

          if (!realStSig || !realPaSig) {
            const { data: siblingApps } = await supabase
              .from('applications')
              .select('student_signature_url, parent_signature_url')
              .eq('student_id', sid)
              .not('student_signature_url', 'is', null)

            for (const sib of (siblingApps || [])) {
              if (!realStSig && sib.student_signature_url && !sib.student_signature_url.includes('_undefined_')) {
                realStSig = sib.student_signature_url
              }
              if (!realPaSig && sib.parent_signature_url && !sib.parent_signature_url.includes('_undefined_')) {
                realPaSig = sib.parent_signature_url
              }
              if (realStSig && realPaSig) break
            }
          }

          if (isStCorrupted) parsed.student_signature_url = realStSig
          if (isPaCorrupted) parsed.parent_signature_url = realPaSig

          await supabase
            .from('applications')
            .update({ scanned_doc_url: JSON.stringify(parsed) })
            .eq('id', ap.id)

          repairedCount++
        }
      } catch (e) {
        console.warn('Individual app signature parse/repair failed:', e)
      }
    }
  } catch (err) {
    console.warn('repairCorruptedAbandonSignatures batch failed:', err)
  }

  return { repaired: repairedCount }
}