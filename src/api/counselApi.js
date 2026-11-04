import { supabase } from '../utils/supabaseClient.js'

const LOCAL_STORAGE_KEY = 'pcm_counsel_logs'

/**
 * 로컬 스토리지에 캐시된 상담 기록 목록 조회
 */
export function getLocalCounselLogs() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (err) {
    console.warn('[counselApi] getLocalCounselLogs JSON parse error:', err)
  }
  return []
}

/**
 * 로컬 스토리지에 상담 기록 목록 저장
 */
export function setLocalCounselLogs(logs) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(logs || []))
  } catch (err) {
    console.warn('[counselApi] setLocalCounselLogs error:', err)
  }
}

/**
 * 고유 ID 생성기
 */
function generateId() {
  return `csl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * 특정 조건에 맞는 상담 기록 목록 조회
 * @param {Object} filter
 * @param {string} [filter.academic_year] - '2027', '2026' 등
 * @param {string} [filter.teacher_name] - 특정 교사명
 * @param {string|number} [filter.class_num] - 'ALL', '1'~'11', '졸업생'
 * @param {string} [filter.student_key] - 학생 키
 */
export async function fetchCounselLogs(filter = {}) {
  const { academic_year, teacher_name, class_num, student_key } = filter
  let dbLogs = null

  if (supabase) {
    try {
      let query = supabase.from('counsel_logs').select('*')

      if (academic_year && academic_year !== 'ALL') {
        query = query.eq('academic_year', String(academic_year))
      }
      if (teacher_name && teacher_name !== 'ALL' && teacher_name.trim()) {
        query = query.eq('teacher_name', teacher_name.trim())
      }
      if (class_num && class_num !== 'ALL') {
        query = query.eq('class_num', String(class_num))
      }
      if (student_key) {
        query = query.eq('student_key', student_key)
      }

      query = query.order('counsel_date', { ascending: true }).order('student_code', { ascending: true })

      const { data, error } = await query
      if (!error && Array.isArray(data)) {
        dbLogs = data
        // 로컬 캐시 머지
        syncWithLocalCache(data)
      } else if (error) {
        console.warn('[counselApi] Supabase fetch error, fallback to local:', error.message)
      }
    } catch (err) {
      console.warn('[counselApi] Supabase network error, fallback to local:', err)
    }
  }

  // Supabase 조회 성공 시 DB 결과 필터링/반환
  if (dbLogs !== null) {
    return dbLogs
  }

  // Fallback: 로컬 캐시 필터링
  let localLogs = getLocalCounselLogs()
  if (academic_year && academic_year !== 'ALL') {
    localLogs = localLogs.filter(item => String(item.academic_year) === String(academic_year))
  }
  if (teacher_name && teacher_name !== 'ALL' && teacher_name.trim()) {
    localLogs = localLogs.filter(item => item.teacher_name === teacher_name.trim())
  }
  if (class_num && class_num !== 'ALL') {
    localLogs = localLogs.filter(item => String(item.class_num) === String(class_num))
  }
  if (student_key) {
    localLogs = localLogs.filter(item => item.student_key === student_key)
  }

  // 날짜 오름차순, 학번 오름차순 정렬
  localLogs.sort((a, b) => {
    if (a.counsel_date !== b.counsel_date) {
      return a.counsel_date.localeCompare(b.counsel_date)
    }
    return String(a.student_code || '').localeCompare(String(b.student_code || ''))
  })

  return localLogs
}

/**
 * 특정 학생의 상담 기록 목록 조회 (최신 날짜순)
 */
export async function fetchCounselLogsByStudent(studentKey, academicYear = null) {
  if (!studentKey) return []

  const filter = { student_key: studentKey }
  if (academicYear) filter.academic_year = academicYear

  const records = await fetchCounselLogs(filter)
  
  // 최신 날짜 역순(desc) 정렬
  records.sort((a, b) => {
    const da = a.counsel_date || ''
    const db = b.counsel_date || ''
    if (da !== db) return db.localeCompare(da)
    return (b.created_at || '').localeCompare(a.created_at || '')
  })

  // 만약 기존 localStorage 에 옛날 단일 memo(counsel_memo_${studentKey})만 있고 DB/목록엔 없다면
  // 사용자 데이터 유실 방지를 위해 자동 1건 생성 대상 확인
  if (records.length === 0) {
    const oldMemo = localStorage.getItem(`counsel_memo_${studentKey}`)
    if (oldMemo && oldMemo.trim()) {
      const today = new Date().toISOString().slice(0, 10)
      const virtualLog = {
        id: `legacy_${studentKey}`,
        academic_year: academicYear || '2027',
        counsel_date: today,
        teacher_name: localStorage.getItem('pcm_teacher_name') || '담임교사',
        student_key: studentKey,
        student_code: '',
        student_name: studentKey.split('_')[2] || '',
        class_num: studentKey.split('_')[0]?.replace('3-', '') || '',
        student_num: studentKey.split('_')[1] || '',
        content: oldMemo,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isLegacy: true
      }
      return [virtualLog]
    }
  }

  return records
}

/**
 * 상담 기록 단건 저장 (추가 또는 수정)
 * @param {Object} record
 */
export async function saveCounselRecord(record) {
  if (!record) throw new Error('상담 기록 데이터가 유효하지 않습니다.')

  const nowIso = new Date().toISOString()
  const payload = {
    id: (record.id && !record.id.startsWith('legacy_')) ? record.id : generateId(),
    academic_year: String(record.academic_year || '2027'),
    counsel_date: record.counsel_date || nowIso.slice(0, 10),
    teacher_name: (record.teacher_name || '담임교사').trim(),
    student_key: record.student_key,
    student_code: String(record.student_code || '').trim(),
    student_name: (record.student_name || '').trim(),
    grade: Number(record.grade) || 3,
    class_num: String(record.class_num || ''),
    student_num: String(record.student_num || ''),
    content: (record.content || '').trim(),
    created_at: record.created_at || nowIso,
    updated_at: nowIso
  }

  // 1. 로컬 스토리지 즉시 반영
  const currentLogs = getLocalCounselLogs()
  const idx = currentLogs.findIndex(item => item.id === payload.id)
  if (idx >= 0) {
    currentLogs[idx] = payload
  } else {
    currentLogs.push(payload)
  }
  setLocalCounselLogs(currentLogs)

  // 레거시 연동: 학생별 메모 키(counsel_memo_${student_key})도 최신 상담 내용으로 갱신
  if (payload.student_key && payload.content) {
    localStorage.setItem(`counsel_memo_${payload.student_key}`, payload.content)
  }

  // 2. Supabase DB 반영 (연결 가능한 경우)
  if (supabase) {
    try {
      const { error } = await supabase.from('counsel_logs').upsert([payload])
      if (error) {
        console.warn('[counselApi] Supabase upsert error (saved locally):', error.message)
      }
    } catch (err) {
      console.warn('[counselApi] Supabase network error on upsert (saved locally):', err)
    }
  }

  return payload
}

/**
 * 상담 기록 단건 삭제
 */
export async function deleteCounselRecord(id, studentKey = null) {
  if (!id) return false

  if (String(id).startsWith('legacy_')) {
    if (studentKey) {
      localStorage.removeItem(`counsel_memo_${studentKey}`)
    }
    return true
  }

  // 1. 로컬 스토리지에서 삭제
  const currentLogs = getLocalCounselLogs()
  const filtered = currentLogs.filter(item => item.id !== id)
  setLocalCounselLogs(filtered)

  // 학생별 최신 메모 갱신
  if (studentKey) {
    const remainingForStudent = filtered.filter(item => item.student_key === studentKey)
    if (remainingForStudent.length > 0) {
      remainingForStudent.sort((a, b) => (b.counsel_date || '').localeCompare(a.counsel_date || ''))
      localStorage.setItem(`counsel_memo_${studentKey}`, remainingForStudent[0].content || '')
    } else {
      localStorage.removeItem(`counsel_memo_${studentKey}`)
    }
  }

  // 2. Supabase DB에서 삭제
  if (supabase) {
    try {
      const { error } = await supabase.from('counsel_logs').delete().eq('id', id)
      if (error) {
        console.warn('[counselApi] Supabase delete error:', error.message)
      }
    } catch (err) {
      console.warn('[counselApi] Supabase network error on delete:', err)
    }
  }

  return true
}

/**
 * 해당 학년도의 상담 기록에 등록된 고유 교사명 목록 조회
 */
export async function getDistinctTeachers(academicYear = null) {
  const allLogs = await fetchCounselLogs({ academic_year: academicYear || 'ALL' })
  const teacherSet = new Set()

  allLogs.forEach(log => {
    if (log.teacher_name && log.teacher_name.trim()) {
      teacherSet.add(log.teacher_name.trim())
    }
  })

  // 현재 로그인된 교사명도 포함
  const currentLoginTeacher = localStorage.getItem('pcm_teacher_name')
  if (currentLoginTeacher && currentLoginTeacher.trim()) {
    teacherSet.add(currentLoginTeacher.trim())
  }

  return Array.from(teacherSet).sort((a, b) => a.localeCompare(b, 'ko'))
}

/**
 * 기록이 존재하는 고유 학년도 목록 조회
 */
export async function getDistinctYears() {
  const allLogs = getLocalCounselLogs()
  const yearSet = new Set(['2027', '2026', '2025'])

  allLogs.forEach(log => {
    if (log.academic_year) {
      yearSet.add(String(log.academic_year))
    }
  })

  return Array.from(yearSet).sort((a, b) => Number(b) - Number(a))
}

/**
 * 로컬 캐시와 DB 데이터 머지 동기화
 */
function syncWithLocalCache(dbRecords) {
  if (!Array.isArray(dbRecords)) return
  const localMap = new Map()
  
  // 로컬 기록 로드
  getLocalCounselLogs().forEach(item => {
    if (item.id) localMap.set(item.id, item)
  })

  // DB 기록으로 덮어쓰기/추가
  dbRecords.forEach(item => {
    if (item.id) localMap.set(item.id, item)
  })

  setLocalCounselLogs(Array.from(localMap.values()))
}

