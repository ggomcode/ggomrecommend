/**
 * 전문대학 학교장 추천 관리 시스템 API 모듈
 * - junior_college_recommendations: 전문대학 학교장 추천 신청 및 현황 관리
 */

import { supabase } from '../utils/supabaseClient'

const LOCAL_STORAGE_KEY = 'pcm_junior_college_recommendations'
const CONFIG_KEY = 'enable_junior_college_system'

// ==========================================
// 1. 시스템 활성화 여부 확인 및 설정
// ==========================================

export async function checkJuniorCollegeSystemEnabled() {
  const cached = localStorage.getItem(`pcm_${CONFIG_KEY}`)
  let isEnabled = cached !== 'false'

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('config')
        .select('value')
        .eq('key', CONFIG_KEY)
        .maybeSingle()

      if (!error) {
        if (data && data.value != null) {
          isEnabled = data.value !== 'false'
        } else {
          isEnabled = true
          try {
            await supabase.from('config').upsert({ key: CONFIG_KEY, value: 'true' }, { onConflict: 'key' })
          } catch (e) {}
        }
        localStorage.setItem(`pcm_${CONFIG_KEY}`, String(isEnabled))
      }
    } catch (e) {
      console.warn('Failed to check junior college system config:', e)
    }
  }

  return isEnabled
}

export async function setJuniorCollegeSystemEnabled(enabled) {
  localStorage.setItem(`pcm_${CONFIG_KEY}`, String(enabled))
  if (supabase) {
    try {
      await supabase.from('config').upsert({ key: CONFIG_KEY, value: String(enabled) }, { onConflict: 'key' })
    } catch (e) {
      console.warn('Failed to update junior college system config in db:', e)
    }
  }
  return enabled
}

// 로컬 스토리지 헬퍼
function getLocalRecords() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalRecords(list) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list))
  } catch (e) {
    console.warn('Local storage write failed:', e)
  }
}

// ==========================================
// 2. 추천 신청 내역 조회 (학생 본인용)
// ==========================================

export async function getMyJuniorCollegeRecommendations(studentCode, studentId = null) {
  if (!studentCode && !studentId) return []

  if (supabase) {
    try {
      let query = supabase
        .from('junior_college_recommendations')
        .select('*')
        .order('created_at', { ascending: false })

      if (studentCode && studentId) {
        query = query.or(`student_code.eq.${studentCode},student_id.eq.${studentId}`)
      } else if (studentCode) {
        query = query.eq('student_code', studentCode)
      } else {
        query = query.eq('student_id', studentId)
      }

      const { data, error } = await query
      if (!error && Array.isArray(data)) {
        // 로컬 캐시 동기화
        const localList = getLocalRecords().filter(r => r.student_code !== studentCode && r.student_id !== studentId)
        saveLocalRecords([...localList, ...data])
        return data
      }
      if (error) console.warn('Supabase getMyJuniorCollegeRecommendations error:', error)
    } catch (e) {
      console.warn('DB query failed, fallback to localStorage:', e)
    }
  }

  // Fallback to localStorage
  const all = getLocalRecords()
  return all.filter(r => 
    (studentCode && String(r.student_code).trim() === String(studentCode).trim()) ||
    (studentId && r.student_id === studentId)
  )
}

// ==========================================
// 3. 전체/학급별 추천 신청 현황 조회 (교사/관리자용)
// ==========================================

export async function getJuniorCollegeRecommendationsList(filters = {}) {
  const { grade, classNo, term, search, isEnrolled } = filters

  if (supabase) {
    try {
      let query = supabase
        .from('junior_college_recommendations')
        .select('*')
        .order('created_at', { ascending: false })

      if (grade != null && grade !== 'all') {
        query = query.eq('grade', Number(grade))
      }
      if (classNo != null && classNo !== 'all') {
        if (classNo === 'grad') {
          query = query.eq('is_enrolled', false)
        } else {
          query = query.eq('class_no', Number(classNo)).eq('is_enrolled', true)
        }
      }
      if (term && term !== 'all') {
        query = query.eq('admission_term', term)
      }
      if (isEnrolled != null && isEnrolled !== 'all') {
        query = query.eq('is_enrolled', isEnrolled === true || isEnrolled === 'true')
      }

      const { data, error } = await query
      if (!error && Array.isArray(data)) {
        let results = data
        if (search && search.trim()) {
          const s = search.trim().toLowerCase()
          results = results.filter(r => 
            (r.student_name && r.student_name.toLowerCase().includes(s)) ||
            (r.student_code && String(r.student_code).includes(s)) ||
            (r.univ_name && r.univ_name.toLowerCase().includes(s)) ||
            (r.department_name && r.department_name.toLowerCase().includes(s)) ||
            (r.track_name && r.track_name.toLowerCase().includes(s))
          )
        }
        return results
      }
      if (error) console.warn('Supabase getJuniorCollegeRecommendationsList error:', error)
    } catch (e) {
      console.warn('DB query failed, fallback to localStorage:', e)
    }
  }

  // Fallback to localStorage
  let list = getLocalRecords()
  if (grade != null && grade !== 'all') {
    list = list.filter(r => Number(r.grade) === Number(grade))
  }
  if (classNo != null && classNo !== 'all') {
    if (classNo === 'grad') {
      list = list.filter(r => r.is_enrolled === false)
    } else {
      list = list.filter(r => Number(r.class_no) === Number(classNo) && r.is_enrolled !== false)
    }
  }
  if (term && term !== 'all') {
    list = list.filter(r => r.admission_term === term)
  }
  if (isEnrolled != null && isEnrolled !== 'all') {
    const boolVal = isEnrolled === true || isEnrolled === 'true'
    list = list.filter(r => r.is_enrolled === boolVal)
  }
  if (search && search.trim()) {
    const s = search.trim().toLowerCase()
    list = list.filter(r => 
      (r.student_name && r.student_name.toLowerCase().includes(s)) ||
      (r.student_code && String(r.student_code).includes(s)) ||
      (r.univ_name && r.univ_name.toLowerCase().includes(s)) ||
      (r.department_name && r.department_name.toLowerCase().includes(s)) ||
      (r.track_name && r.track_name.toLowerCase().includes(s))
    )
  }
  return list
}

// ==========================================
// 4. 추천 신청 등록 / 수정
// ==========================================

export async function saveJuniorCollegeRecommendation(payload) {
  const isUpdate = Boolean(payload.id)
  const now = new Date().toISOString()

  const record = {
    ...payload,
    univ_name: String(payload.univ_name || '').trim(),
    department_name: String(payload.department_name || '').trim(),
    track_name: String(payload.track_name || '').trim(),
    admission_term: payload.admission_term || '수시 1차',
    recommendation_reason: payload.recommendation_reason?.trim() || '위 학생은 품행이 단정하고 성실하며 지원 전공 분야에 대한 잠재력과 학업 의지가 확고하므로 귀 대학의 입학 전형에 적극 추천합니다.',
    status: payload.status || 'submitted',
    updated_at: now
  }

  if (!record.univ_name) throw new Error('지원 대학명을 입력해 주세요.')
  if (!record.department_name) throw new Error('지원 학과명을 입력해 주세요.')
  if (!record.track_name) throw new Error('지원 전형명을 입력해 주세요.')

  if (supabase) {
    try {
      if (isUpdate) {
        const { data, error } = await supabase
          .from('junior_college_recommendations')
          .update(record)
          .eq('id', record.id)
          .select()
          .single()

        if (!error && data) {
          // 로컬 동기화
          const localList = getLocalRecords().map(r => r.id === data.id ? data : r)
          saveLocalRecords(localList)
          return data
        }
        if (error) console.warn('Supabase update failed:', error)
      } else {
        const insertPayload = {
          ...record,
          created_at: now
        }
        delete insertPayload.id

        const { data, error } = await supabase
          .from('junior_college_recommendations')
          .insert(insertPayload)
          .select()
          .single()

        if (!error && data) {
          const localList = getLocalRecords()
          saveLocalRecords([data, ...localList])
          return data
        }
        if (error) console.warn('Supabase insert failed:', error)
      }
    } catch (e) {
      console.warn('DB save failed, using localStorage fallback:', e)
    }
  }

  // Local fallback
  const localList = getLocalRecords()
  if (isUpdate) {
    const idx = localList.findIndex(r => r.id === record.id)
    if (idx !== -1) {
      localList[idx] = { ...localList[idx], ...record }
    } else {
      localList.unshift(record)
    }
    saveLocalRecords(localList)
    return record
  } else {
    const newRecord = {
      ...record,
      id: record.id || `local_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      created_at: now
    }
    localList.unshift(newRecord)
    saveLocalRecords(localList)
    return newRecord
  }
}

// ==========================================
// 5. 추천 신청 삭제
// ==========================================

export async function deleteJuniorCollegeRecommendation(id) {
  if (!id) return false

  if (supabase) {
    try {
      const { error } = await supabase
        .from('junior_college_recommendations')
        .delete()
        .eq('id', id)
      if (error) console.warn('Supabase delete error:', error)
    } catch (e) {
      console.warn('DB delete failed:', e)
    }
  }

  const localList = getLocalRecords().filter(r => r.id !== id)
  saveLocalRecords(localList)
  return true
}

// ==========================================
// 6. 추천 상태 변경 (예: 추천서 발급/직인 날인 완료)
// ==========================================

export async function updateJuniorCollegeStatus(id, status) {
  if (!id) return false

  if (supabase) {
    try {
      const { error } = await supabase
        .from('junior_college_recommendations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) console.warn('Supabase update status error:', error)
    } catch (e) {}
  }

  const localList = getLocalRecords().map(r => r.id === id ? { ...r, status, updated_at: new Date().toISOString() } : r)
  saveLocalRecords(localList)
  return true
}

// ==========================================
// 7. 교사용 학생 목록 조회 헬퍼 (대리 등록용)
// ==========================================

export async function fetchEnrolledStudentsForJC(classNo = null) {
  if (!supabase) return []
  try {
    let query = supabase
      .from('enrolled_students')
      .select('id, name, student_code, grade, class_no, seq_no, is_enrolled, grad_year, phone, emergency_phone')
      .order('is_enrolled', { ascending: false })
      .order('grade', { ascending: true })
      .order('class_no', { ascending: true })
      .order('seq_no', { ascending: true })

    if (classNo != null && classNo !== 'all') {
      if (classNo === 'grad') {
        query = query.eq('is_enrolled', false)
      } else {
        query = query.eq('class_no', Number(classNo)).eq('is_enrolled', true)
      }
    }

    const { data, error } = await query
    if (!error && Array.isArray(data)) {
      return data
    }
  } catch (e) {
    console.warn('Failed to fetch enrolled students for JC:', e)
  }
  return []
}

