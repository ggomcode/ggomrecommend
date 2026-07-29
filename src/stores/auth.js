import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '../utils/supabaseClient'

let _router = null

export function setRouter(router) {
  _router = router
}

export const useAuthStore = defineStore('auth', () => {
  // 로컬 스토리지 보존 상태 로드
  const token = ref(localStorage.getItem('pcm_token') || null)
  const role = ref(localStorage.getItem('pcm_role') || null)
  const status = ref(localStorage.getItem('pcm_status') || null)
  
  // 교사 전용 상태
  const grade = ref(localStorage.getItem('pcm_grade') != null ? Number(localStorage.getItem('pcm_grade')) : null)
  const classNo = ref(localStorage.getItem('pcm_class_no') != null ? Number(localStorage.getItem('pcm_class_no')) : null)
  const teacherName = ref(localStorage.getItem('pcm_teacher_name') || null)

  // 학생 전용 상태
  const studentCode = ref(localStorage.getItem('pcm_student_code') || null)
  const studentName = ref(localStorage.getItem('pcm_student_name') || null)
  const phoneLast4 = ref(localStorage.getItem('pcm_phone_last4') || null)
  const isEnrolled = ref(localStorage.getItem('pcm_is_enrolled') != null ? localStorage.getItem('pcm_is_enrolled') === 'true' : true)
  const gradYear = ref(localStorage.getItem('pcm_grad_year') != null ? Number(localStorage.getItem('pcm_grad_year')) : null)
  const hasDisciplinary = ref(localStorage.getItem('pcm_has_disciplinary') === 'true')

  // null = 아직 체크 안함 / false = 미설정(Supabase 없음) / true = 설정 완료
  const initialized = ref(null)

  const isAdmin = computed(() => role.value === 'admin')
  const isTeacher = computed(() => role.value === 'teacher')
  const isStudent = computed(() => role.value === 'student')

  // Supabase 세션 상태 동기화 및 런타임 체크
  async function checkStatus() {
    if (initialized.value !== null) return
    
    if (!supabase) {
      initialized.value = false // Supabase 정보 누락으로 설정(welcome) 화면으로 이동
      return
    }

    initialized.value = true

    // 현재 저장된 세션 확인 및 갱신
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        token.value = session.access_token
        await fetchProfile(session.user.id)
      } else {
        clearAuthStates()
      }
    } catch (e) {
      console.error('Session sync error:', e)
      clearAuthStates()
    }
  }

  // 사용자 프로필 가져오기 및 상태 바인딩
  async function fetchProfile(userId) {
    if (!supabase) return
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !data) {
      throw new Error('사용자 프로필을 찾을 수 없습니다.')
    }

    role.value = data.role
    status.value = data.status

    if (data.role === 'admin') {
      grade.value = null
      classNo.value = null
      teacherName.value = '관리자'
    } else if (data.role === 'teacher') {
      // 교사의 메타데이터 파싱 (또는 profiles에 학급 정보 필드가 추가된 경우 사용)
      const { data: { user } } = await supabase.auth.getUser()
      const meta = user?.user_metadata || {}
      grade.value = Number(meta.grade) || null
      classNo.value = Number(meta.class_no) || null
      teacherName.value = data.name
    } else if (data.role === 'student') {
      studentCode.value = data.student_code
      studentName.value = data.name
      phoneLast4.value = data.phone_last4
      isEnrolled.value = data.is_enrolled
      gradYear.value = data.grad_year
      hasDisciplinary.value = data.has_disciplinary
    }

    _persist()
  }

  function _persist() {
    if (token.value) localStorage.setItem('pcm_token', token.value)
    else localStorage.removeItem('pcm_token')

    if (role.value) localStorage.setItem('pcm_role', role.value)
    else localStorage.removeItem('pcm_role')

    if (status.value) localStorage.setItem('pcm_status', status.value)
    else localStorage.removeItem('pcm_status')

    if (grade.value != null) localStorage.setItem('pcm_grade', grade.value)
    else localStorage.removeItem('pcm_grade')

    if (classNo.value != null) localStorage.setItem('pcm_class_no', classNo.value)
    else localStorage.removeItem('pcm_class_no')

    if (teacherName.value) localStorage.setItem('pcm_teacher_name', teacherName.value)
    else localStorage.removeItem('pcm_teacher_name')

    if (studentCode.value) localStorage.setItem('pcm_student_code', studentCode.value)
    else localStorage.removeItem('pcm_student_code')

    if (studentName.value) localStorage.setItem('pcm_student_name', studentName.value)
    else localStorage.removeItem('pcm_student_name')

    if (phoneLast4.value) localStorage.setItem('pcm_phone_last4', phoneLast4.value)
    else localStorage.removeItem('pcm_phone_last4')

    localStorage.setItem('pcm_is_enrolled', isEnrolled.value ? 'true' : 'false')

    if (gradYear.value != null) localStorage.setItem('pcm_grad_year', gradYear.value)
    else localStorage.removeItem('pcm_grad_year')

    localStorage.setItem('pcm_has_disciplinary', hasDisciplinary.value ? 'true' : 'false')
  }

  function clearAuthStates() {
    token.value = null
    role.value = null
    status.value = null
    grade.value = null
    classNo.value = null
    teacherName.value = null
    studentCode.value = null
    studentName.value = null
    phoneLast4.value = null
    isEnrolled.value = true
    gradYear.value = null
    hasDisciplinary.value = false
    _persist()
  }

  // 관리자 로그인
  async function loginAdmin(password) {
    if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.')
    
    const email = 'admin@school.internal'
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw new Error('비밀번호가 일치하지 않거나 로그인이 차단되었습니다.')

    token.value = data.session.access_token
    await fetchProfile(data.user.id)
  }

  // 교사 로그인
  async function loginTeacher(gradeVal, classNoVal, password) {
    if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.')
    
    const email = `teacher_${gradeVal}_${classNoVal}@school.internal`
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw new Error('학년, 반 또는 비밀번호가 올바르지 않습니다.')

    token.value = data.session.access_token
    await fetchProfile(data.user.id)
  }

  // 학생 로그인
  async function loginStudent(studentCodeVal, password) {
    if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.')
    
    const email = `student_${studentCodeVal}@school.internal`
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw new Error('학번 또는 비밀번호가 올바르지 않습니다.')

    try {
      // 프로필 가져오기 및 승인 여부 체크
      const userId = data.user.id
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', userId)
        .single()

      if (profileErr || !profile) {
        throw new Error('프로필을 불러올 수 없습니다.')
      }

      if (profile.status === 'pending') {
        await supabase.auth.signOut()
        throw new Error('교사의 회원가입 승인을 대기 중입니다.')
      } else if (profile.status === 'rejected') {
        await supabase.auth.signOut()
        throw new Error('회원가입이 거절되었습니다. 담당 교사에게 문의하세요.')
      }

      token.value = data.session.access_token
      await fetchProfile(userId)
    } catch (e) {
      clearAuthStates()
      throw e
    }
  }

  // 학생 회원가입
  async function signUpStudent({ studentCode: sCode, name, phoneLast4: pLast4, password, isEnrolled: enrolled, gradYear: gYear, registrationCode }) {
    if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.')

    // 1. 가입코드 검증 (RPC 호출)
    const { data: codeValid, error: codeErr } = await supabase
      .rpc('check_registration_code', { input_code: registrationCode })

    if (codeErr) throw new Error('가입코드 검증 중 오류가 발생했습니다.')
    if (!codeValid) throw new Error('가입코드가 올바르지 않습니다.')

    // 학번 파싱 (재학생의 경우 5자리 숫자 30205 -> 3학년 2반 5번)
    let parsedGrade = null
    let parsedClass = null
    let parsedSeq = null
    if (enrolled) {
      const codeStr = String(sCode)
      if (codeStr.length === 5) {
        parsedGrade = parseInt(codeStr.substring(0, 1))
        parsedClass = parseInt(codeStr.substring(1, 3))
        parsedSeq = parseInt(codeStr.substring(3, 5))
      }
    }

    // 2. 가상의 이메일 매핑으로 가입 진행
    const email = `student_${sCode}@school.internal`
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'student',
          name,
          phone_last4: pLast4,
          student_code: sCode,
          is_enrolled: enrolled,
          grad_year: enrolled ? null : gYear,
          grade: parsedGrade,
          class_no: parsedClass,
          seq_no: parsedSeq
        }
      }
    })

    if (error) throw new Error(error.message || '회원가입에 실패했습니다.')

    // 가입 완료 후 자동 로그인 방지 및 승인 대기 안내를 위해 로그아웃
    await supabase.auth.signOut()
    clearAuthStates()
  }

  // 로그아웃
  async function logout() {
    if (supabase) {
      await supabase.auth.signOut()
    }
    clearAuthStates()
    _router?.push('/login')
  }

  return {
    token, role, status, grade, classNo, teacherName,
    studentCode, studentName, phoneLast4, isEnrolled, gradYear, hasDisciplinary,
    initialized, isAdmin, isTeacher, isStudent,
    checkStatus, loginAdmin, loginTeacher, loginStudent, signUpStudent, logout
  }
})
