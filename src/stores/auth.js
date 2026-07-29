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

  // 사용자 프로필 가져오기 및 상태 바인딩 (자동 복구 내장)
  async function fetchProfile(userId) {
    if (!supabase) return
    let { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    // profiles 레코드가 없는 경우 메타데이터 기반 자동 생성(Self-healing)
    if (!data) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && user.id === userId) {
        const meta = user.user_metadata || {}
        const isEmailAdmin = user.email === 'admin@ggomrecommend.ggomcode'
        const isEmailTeacher = user.email === 'teacher@ggomrecommend.ggomcode'

        const fallbackRole = isEmailAdmin ? 'admin' : (isEmailTeacher ? 'teacher' : (meta.role || 'student'))
        const fallbackName = meta.name || (isEmailAdmin ? '관리자' : (isEmailTeacher ? '담임교사' : '사용자'))

        const newProfile = {
          id: userId,
          role: fallbackRole,
          name: fallbackName,
          status: 'approved',
          student_code: meta.student_code || null,
          phone_last4: meta.phone_last4 || null,
          is_enrolled: meta.is_enrolled !== undefined ? meta.is_enrolled : true,
          grad_year: meta.grad_year || null,
          grade: meta.grade || null,
          class_no: meta.class_no || null,
          seq_no: meta.seq_no || null,
          has_disciplinary: false
        }

        const { data: insertedData } = await supabase
          .from('profiles')
          .upsert(newProfile)
          .select()
          .single()

        if (insertedData) {
          data = insertedData
        }
      }
    }

    if (!data) {
      throw new Error('사용자 프로필을 찾을 수 없습니다. (DB profiles 미등록)')
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

  // 관리자 로그인 (최초 실행 시 자동 계정 생성 지원)
  async function loginAdmin(adminId, password) {
    if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.')
    
    const email = `${adminId}@ggomrecommend.ggomcode`
    
    // 1. 기존 계정으로 로그인 시도
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    // 2. 로그인 실패 시 계정 미설정 상태(최초 설치)로 판단하여 회원가입 시도
    if (error) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'admin',
            name: '관리자'
          }
        }
      })

      if (signUpError) {
        throw new Error('관리자 계정 생성 및 설정에 실패했습니다: ' + (signUpError.message || '인증 오류'))
      }

      // 회원가입 직후 바로 세션이 획득되었을 경우
      if (signUpData?.session) {
        token.value = signUpData.session.access_token
        await fetchProfile(signUpData.user.id)
        return
      } else {
        // 회원가입 성공 후 재로그인 진행
        const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (retryError) throw new Error('관리자 설정 후 로그인 처리에 실패했습니다.')
        token.value = retryData.session.access_token
        await fetchProfile(retryData.user.id)
        return
      }
    }

    token.value = data.session.access_token
    await fetchProfile(data.user.id)
  }

  // 교사 로그인
  async function loginTeacher(teacherId, password) {
    if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.')
    
    const email = `${teacherId}@ggomrecommend.ggomcode`
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.')

    token.value = data.session.access_token
    await fetchProfile(data.user.id)
  }

  // 학생 로그인 (재학생/졸업생 구분 지원)
  async function loginStudent(studentCodeVal, password, isEnrolled = true) {
    if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.')
    
    const cleanCode = String(studentCodeVal).trim()
    
    // 1. profiles 테이블에서 학번으로 가입 프로필 탐색
    const { data: matchedProfiles } = await supabase
      .from('profiles')
      .select('id, student_code, is_enrolled, grad_year')
      .eq('student_code', cleanCode)

    let targetProfile = null
    if (matchedProfiles && matchedProfiles.length > 0) {
      if (isEnrolled !== null) {
        targetProfile = matchedProfiles.find(p => Boolean(p.is_enrolled) === Boolean(isEnrolled))
      }
      if (!targetProfile) {
        targetProfile = matchedProfiles[0]
      }
    }

    let email = isEnrolled 
      ? `student_${cleanCode}@ggomrecommend.ggomcode` 
      : `grad_${targetProfile?.grad_year || ''}_${cleanCode}@ggomrecommend.ggomcode`

    if (targetProfile) {
      email = targetProfile.is_enrolled 
        ? `student_${cleanCode}@ggomrecommend.ggomcode` 
        : `grad_${targetProfile.grad_year || ''}_${cleanCode}@ggomrecommend.ggomcode`
    }

    let { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    // 실패 시 교차 학번(재학생/졸업생) 가입 계정 재시도
    if (error && matchedProfiles && matchedProfiles.length > 1) {
      const altProfile = matchedProfiles.find(p => p.id !== targetProfile?.id)
      if (altProfile) {
        const altEmail = altProfile.is_enrolled 
          ? `student_${cleanCode}@ggomrecommend.ggomcode` 
          : `grad_${altProfile.grad_year || ''}_${cleanCode}@ggomrecommend.ggomcode`
        const retryResult = await supabase.auth.signInWithPassword({ email: altEmail, password })
        if (!retryResult.error) {
          data = retryResult.data
          error = null
        }
      }
    }

    if (error) throw new Error('학번 또는 비밀번호가 올바르지 않습니다.')

    try {
      // 프로필 가져오기 및 승인 여부 체크
      const userId = data.user.id
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('status, rejection_reason')
        .eq('id', userId)
        .single()

      if (profileErr || !profile) {
        throw new Error('프로필을 불러올 수 없습니다.')
      }

      if (profile.status === 'pending') {
        await supabase.auth.signOut()
        throw new Error('관리자의 회원가입 승인을 대기 중입니다.')
      } else if (profile.status === 'rejected') {
        await supabase.auth.signOut()
        const reasonStr = profile.rejection_reason ? ` (반려 사유: ${profile.rejection_reason})` : ''
        const err = new Error(`회원가입 신청이 반려되었습니다.${reasonStr}\n'학생 회원가입 신청'에서 가입 정보를 수정하여 다시 제출해 주세요.`)
        err.isRejected = true
        err.rejectionReason = profile.rejection_reason || ''
        err.studentCode = cleanCode
        throw err
      }

      token.value = data.session.access_token
      await fetchProfile(userId)
    } catch (e) {
      clearAuthStates()
      throw e
    }
  }

  // 학생 회원가입 (전체 전화번호를 비밀번호로 사용)
  async function signUpStudent({ studentCode: sCode, name, phone, isEnrolled: enrolled, gradYear: gYear, registrationCode }) {
    if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.')

    // 숫자만 추출한 전체 전화번호 (예: 01012345678)
    const cleanPhone = String(phone || '').replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      throw new Error('전화번호(010...) 10~11자리를 정확히 입력해 주세요.')
    }
    const pLast4 = cleanPhone.slice(-4)

    // 1. 가입코드 검증 (config 테이블 직접 조회로 RPC 404 에러 방지)
    const { data: configRow } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'registration_code')
      .maybeSingle()

    const targetCode = configRow && configRow.value ? configRow.value : '17835'
    if (String(registrationCode).trim() !== String(targetCode).trim()) {
      throw new Error('가입코드가 올바르지 않습니다. 다시 확인해 주세요.')
    }

    // 학번 파싱 및 학급 수 검증 (재학생 5자리 숫자: 예 30205 -> 3학년 2반 5번)
    let parsedGrade = null
    let parsedClass = null
    let parsedSeq = null

    if (enrolled) {
      const codeStr = String(sCode)
      if (codeStr.length !== 5 || !codeStr.startsWith('3')) {
        throw new Error('학번은 3학년 5자리 숫자여야 합니다 (예: 30105).')
      }

      parsedGrade = parseInt(codeStr.substring(0, 1))
      parsedClass = parseInt(codeStr.substring(1, 3))
      parsedSeq = parseInt(codeStr.substring(3, 5))

      // 설정된 학급 수(기본 11반) 검증
      let maxClass = 11
      try {
        const { data: classConfig } = await supabase
          .from('config')
          .select('value')
          .eq('key', 'class_count')
          .maybeSingle()
        if (classConfig && classConfig.value) {
          maxClass = Number(classConfig.value) || 11
        }
      } catch (e) {}

      // 99반인 경우 테스트용 학번 예외 허용 (학급 수 제한 통과)
      if (parsedClass !== 99 && (isNaN(parsedClass) || parsedClass < 1 || parsedClass > maxClass)) {
        throw new Error(`학번의 반 번호(${parsedClass}반)가 존재하지 않습니다. (1반 ~ ${maxClass}반 범위로 입력해 주세요)`)
      }

      if (isNaN(parsedSeq) || parsedSeq < 1 || parsedSeq > 50) {
        throw new Error(`학번의 출석 번호(${parsedSeq}번)가 올바르지 않습니다.`)
      }
    }

    // 2. 동일 학번/구분의 기존 가입 정보 검사 (반려된 계정이면 기존 정보 갱신 처리)
    const { data: duplicateProfile } = await supabase
      .from('profiles')
      .select('id, name, student_code, is_enrolled, status')
      .eq('student_code', sCode)
      .eq('is_enrolled', Boolean(enrolled))
      .maybeSingle()

    if (duplicateProfile) {
      if (duplicateProfile.status === 'approved') {
        throw new Error('이미 회원가입 승인이 완료된 계정입니다. 해당 학번으로 로그인해 주세요.')
      } else if (duplicateProfile.status === 'pending') {
        throw new Error('이미 관리자의 회원가입 승인을 대기 중인 계정입니다.')
      } else if (duplicateProfile.status === 'rejected') {
        // 반려된 계정이면 기존 프로필을 갱신(Update)하고 승인 대기(pending) 상태로 재전환
        const updateData = {
          name: name.trim(),
          phone_last4: pLast4,
          status: 'pending',
          rejection_reason: null,
          grade: enrolled ? parsedGrade : null,
          class_no: enrolled ? parsedClass : null,
          seq_no: enrolled ? parsedSeq : null,
          grad_year: !enrolled && gYear ? Number(gYear) : null
        }

        const { error: updateErr } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', duplicateProfile.id)

        if (updateErr) throw updateErr

        const metaData = {
          role: 'student',
          name: name.trim(),
          phone_last4: pLast4,
          full_phone: cleanPhone,
          student_code: String(sCode),
          is_enrolled: Boolean(enrolled)
        }
        if (enrolled) {
          if (parsedGrade !== null) metaData.grade = parsedGrade
          if (parsedClass !== null) metaData.class_no = parsedClass
          if (parsedSeq !== null) metaData.seq_no = parsedSeq
        } else {
          if (gYear) metaData.grad_year = Number(gYear)
        }

        const email = enrolled 
          ? `student_${sCode}@ggomrecommend.ggomcode`
          : `grad_${gYear || ''}_${sCode}@ggomrecommend.ggomcode`

        await supabase.auth.signUp({
          email,
          password: cleanPhone,
          options: { data: metaData }
        })

        return { updated: true }
      }
    }

    // 3. 가상의 이메일 매핑으로 가입 진행 (메타데이터 객체 정제)
    const metaData = {
      role: 'student',
      name: name.trim(),
      phone_last4: pLast4,
      full_phone: cleanPhone,
      student_code: String(sCode),
      is_enrolled: Boolean(enrolled)
    }

    if (enrolled) {
      if (parsedGrade !== null) metaData.grade = parsedGrade
      if (parsedClass !== null) metaData.class_no = parsedClass
      if (parsedSeq !== null) metaData.seq_no = parsedSeq
    } else {
      if (gYear) metaData.grad_year = Number(gYear)
    }

    const email = enrolled 
      ? `student_${sCode}@ggomrecommend.ggomcode`
      : `grad_${gYear || ''}_${sCode}@ggomrecommend.ggomcode`

    const { data, error } = await supabase.auth.signUp({
      email,
      password: cleanPhone,
      options: { data: metaData }
    })

    if (error) {
      let msg = error.message || '회원가입에 실패했습니다.'
      if (msg.includes('User already registered') || msg.includes('already exists')) {
        msg = '이미 해당 학번으로 가입된 계정이 존재합니다. 로그인해 주세요.'
      }
      throw new Error(msg)
    }

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
