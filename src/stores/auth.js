import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '../utils/supabaseClient'
import { hashPhone } from '../utils/phoneUtils'
import { encryptText, decryptText, hashText } from '../utils/cryptoUtils'

let _router = null

export function setRouter(router) {
  _router = router
}

export const useAuthStore = defineStore('auth', () => {
  // 로컬 스토리지 보존 상태 로드
  const token = ref(localStorage.getItem('pcm_token') || null)
  const userId = ref(localStorage.getItem('pcm_user_id') || null)
  const role = ref(localStorage.getItem('pcm_role') || null)
  const status = ref(localStorage.getItem('pcm_status') || null)
  
  // 교사 전용 상태
  const grade = ref(localStorage.getItem('pcm_grade') != null ? Number(localStorage.getItem('pcm_grade')) : null)
  const classNo = ref(localStorage.getItem('pcm_class_no') != null ? Number(localStorage.getItem('pcm_class_no')) : null)
  const teacherName = ref(localStorage.getItem('pcm_teacher_name') || null)

  // 학생 전용 상태
  const studentCode = ref(localStorage.getItem('pcm_student_code') || null)
  const studentName = ref(localStorage.getItem('pcm_student_name') || null)
  const studentPhone = ref(localStorage.getItem('pcm_student_phone') || null)
  const gpaOverall = ref(localStorage.getItem('pcm_gpa_overall') || null)
  const phoneLast4 = ref(localStorage.getItem('pcm_phone_last4') || null)
  const seqNo = ref(localStorage.getItem('pcm_seq_no') != null ? Number(localStorage.getItem('pcm_seq_no')) : null)
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
        // 학생 로그인은 Supabase Auth 세션이 아니라 enrolled_students DB 및 localStorage (pcm_role = 'student') 기반입니다.
        if (role.value === 'student' && studentCode.value) {
          try {
            await fetchProfile(userId.value)
          } catch (e) {
            console.warn('Student profile sync fallback on checkStatus:', e)
          }
        } else {
          clearAuthStates()
        }
      }
    } catch (e) {
      console.error('Session sync error:', e)
      if (role.value !== 'student') {
        clearAuthStates()
      }
    }
  }

  // 사용자 프로필 가져오기 및 상태 바인딩 (자동 복구 내장)
  async function fetchProfile(uId) {
    if (!supabase) return
    if (uId) userId.value = uId

    // 1. 관리자 및 교사 프로필 검사 (profiles)
    let adminTeacherData = null
    if (uId) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uId)
        .maybeSingle()
      adminTeacherData = data
    }

    // [프로필 자동 복구/생성] Supabase Auth 로그인은 성공했으나 profiles 테이블에 레코드가 없는 경우
    if (!adminTeacherData && uId) {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          const meta = authUser.user_metadata || {}
          const userEmail = authUser.email || ''
          let inferredRole = meta.role
          if (!inferredRole) {
            if (userEmail.startsWith('admin') || userEmail.includes('admin@')) inferredRole = 'admin'
            else if (userEmail.startsWith('teacher') || userEmail.includes('teacher')) inferredRole = 'teacher'
          }

          if (inferredRole === 'admin' || inferredRole === 'teacher') {
            const newProfile = {
              id: uId,
              name: inferredRole === 'admin' ? '관리자' : (meta.name || '교사'),
              phone_last4: meta.phone_last4 || '0000',
              role: inferredRole,
              status: 'approved',
              is_enrolled: true,
              grade: meta.grade != null ? Number(meta.grade) : null,
              class_no: meta.class_no != null ? Number(meta.class_no) : null
            }
            try {
              await supabase.from('profiles').upsert(newProfile, { onConflict: 'id' })
            } catch (e) {
              console.warn('Auto-repair profile upsert warning:', e)
            }
            adminTeacherData = newProfile
          }
        }
      } catch (e) {
        console.warn('Profile recovery error during fetchProfile:', e)
      }
    }

    if (adminTeacherData && (adminTeacherData.role === 'admin' || adminTeacherData.role === 'teacher')) {
      role.value = adminTeacherData.role
      status.value = adminTeacherData.status
      if (adminTeacherData.role === 'admin') {
        grade.value = null
        classNo.value = null
        teacherName.value = '관리자'
      } else {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        const meta = authUser?.user_metadata || {}
        grade.value = meta.grade != null ? Number(meta.grade) : null
        classNo.value = meta.class_no != null ? Number(meta.class_no) : null
        teacherName.value = adminTeacherData.name === '관리자' ? '관리자' : await decryptText(adminTeacherData.name)
      }
      _persist()
      return
    }

    // 2. 학생 프로필 검사 (enrolled_students 마스터 원장 100% 통합)
    let meta = {}
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      meta = authUser?.user_metadata || {}
    } catch (e) {}

    const sCode = meta.student_code || (adminTeacherData ? adminTeacherData.student_code : null) || studentCode.value

    let studentData = null
    if (uId) {
      const { data: byUser } = await supabase
        .from('enrolled_students')
        .select('*')
        .eq('user_id', uId)
        .maybeSingle()
      studentData = byUser
    }

    if (!studentData && sCode) {
      const { data: byCode } = await supabase
        .from('enrolled_students')
        .select('*')
        .eq('student_code', sCode)
        .maybeSingle()
      studentData = byCode
    }

    if (studentData) {
      role.value = 'student'
      status.value = studentData.status || 'approved'
      studentCode.value = studentData.student_code
      studentName.value = await decryptText(studentData.name)
      if (studentData.gpa_overall != null) gpaOverall.value = String(studentData.gpa_overall)
      phoneLast4.value = '****'
      isEnrolled.value = studentData.is_enrolled !== false
      gradYear.value = studentData.grad_year
      hasDisciplinary.value = studentData.has_disciplinary || false

      const sCodeStr = String(studentData.student_code || '')
      let pGrade = studentData.grade
      let pClass = studentData.class_no
      let pSeq = studentData.student_no || studentData.seq_no
      if (pGrade == null && sCodeStr.length === 5 && sCodeStr.startsWith('3')) {
        pGrade = parseInt(sCodeStr.substring(0, 1))
        pClass = parseInt(sCodeStr.substring(1, 3))
        pSeq = parseInt(sCodeStr.substring(3, 5))
      }
      grade.value = pGrade
      classNo.value = pClass
      seqNo.value = pSeq

      if (uId && !studentData.user_id) {
        await supabase.from('enrolled_students').update({ user_id: uId }).eq('id', studentData.id)
      }
      _persist()
      return
    }

    if (adminTeacherData) {
      role.value = adminTeacherData.role
      status.value = adminTeacherData.status
      if (adminTeacherData.role === 'student') {
        studentCode.value = adminTeacherData.student_code
        studentName.value = adminTeacherData.name
        phoneLast4.value = adminTeacherData.phone_last4
        isEnrolled.value = adminTeacherData.is_enrolled
        gradYear.value = adminTeacherData.grad_year
        hasDisciplinary.value = adminTeacherData.has_disciplinary
      }
      _persist()
      return
    }

    if (role.value === 'student' && studentCode.value) {
      // 로컬 스토리지에 이미 학생으로 인증된 경우 상태 유지
      return
    }

    throw new Error('사용자 프로필을 찾을 수 없습니다.')
  }

  function _persist() {
    if (token.value) localStorage.setItem('pcm_token', token.value)
    else localStorage.removeItem('pcm_token')

    if (userId.value) localStorage.setItem('pcm_user_id', userId.value)
    else localStorage.removeItem('pcm_user_id')

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

    if (studentPhone.value) localStorage.setItem('pcm_student_phone', studentPhone.value)
    else localStorage.removeItem('pcm_student_phone')

    if (gpaOverall.value) localStorage.setItem('pcm_gpa_overall', gpaOverall.value)
    else localStorage.removeItem('pcm_gpa_overall')

    if (phoneLast4.value) localStorage.setItem('pcm_phone_last4', phoneLast4.value)
    else localStorage.removeItem('pcm_phone_last4')

    if (seqNo.value != null) localStorage.setItem('pcm_seq_no', seqNo.value)
    else localStorage.removeItem('pcm_seq_no')

    localStorage.setItem('pcm_is_enrolled', isEnrolled.value ? 'true' : 'false')

    if (gradYear.value != null) localStorage.setItem('pcm_grad_year', gradYear.value)
    else localStorage.removeItem('pcm_grad_year')

    localStorage.setItem('pcm_has_disciplinary', hasDisciplinary.value ? 'true' : 'false')
    if (token.value) {
      localStorage.setItem('pcm_last_activity', String(Date.now()))
    }
  }

  function clearAuthStates() {
    token.value = null
    userId.value = null
    role.value = null
    status.value = null
    grade.value = null
    classNo.value = null
    teacherName.value = null
    studentCode.value = null
    studentName.value = null
    studentPhone.value = null
    gpaOverall.value = null
    phoneLast4.value = null
    seqNo.value = null
    isEnrolled.value = true
    gradYear.value = null
    hasDisciplinary.value = false
    localStorage.removeItem('pcm_last_activity')
    _persist()
  }

  // 관리자 로그인 (최초 실행 시 자동 계정 생성 지원)
  async function loginAdmin(adminId, password) {
    if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.')
    
    const email = `${adminId}@ggomrecommend.ggomcode`
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

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

      if (signUpData?.session) {
        token.value = signUpData.session.access_token
        await fetchProfile(signUpData.user.id)
        return
      } else {
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

  // 교사 로그인 (단일/개별 teacher 아이디 로그인)
  async function loginTeacher(teacherId, password) {
    if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.')
    
    const rawInput = (teacherId || '').trim()
    if (!rawInput) throw new Error('아이디를 입력해 주세요.')

    let email = rawInput.includes('@') ? rawInput : `${rawInput}@ggomrecommend.ggomcode`

    let { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    // 입력된 아이디 실패 시 통합 teacher@ggomrecommend.ggomcode fallback
    if (error && email !== 'teacher@ggomrecommend.ggomcode') {
      const fallbackRes = await supabase.auth.signInWithPassword({
        email: 'teacher@ggomrecommend.ggomcode',
        password
      })
      if (!fallbackRes.error && fallbackRes.data?.session) {
        data = fallbackRes.data
        error = null
      }
    }

    if (error || !data?.session) {
      throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.')
    }

    token.value = data.session.access_token
    await fetchProfile(data.user.id)
  }

  // 학생 로그인 (enrolled_students 마스터 기반 통합 로그인 - 재학생/졸업생 공통)
  async function loginStudent(studentCodeVal, password, isEnrolledParam = true) {
    if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.')
    
    const cleanCode = String(studentCodeVal).trim()
    const cleanPasswordDigits = String(password || '').trim().replace(/\D/g, '')
    if (!cleanPasswordDigits) {
      throw new Error('비밀번호(전화번호)를 입력해 주세요.')
    }
    const inputHash = await hashPhone(cleanPasswordDigits)

    // 1. enrolled_students 원장 테이블에서 학번으로 학생 프로필 검색
    const { data: matchedRows, error: searchErr } = await supabase
      .from('enrolled_students')
      .select('*')
      .eq('student_code', cleanCode)

    if (searchErr) throw searchErr

    let targetRow = null
    if (matchedRows && matchedRows.length > 0) {
      if (isEnrolledParam !== null) {
        targetRow = matchedRows.find(r => Boolean(r.is_enrolled) === Boolean(isEnrolledParam))
      }
      if (!targetRow) targetRow = matchedRows[0]
    }

    if (!targetRow) {
      throw new Error('등록된 학생 정보를 찾을 수 없습니다. 학번을 확인해 주세요.')
    }

    if (targetRow.status === 'pending') {
      throw new Error('관리자의 회원가입 승인을 대기 중입니다.')
    } else if (targetRow.status === 'rejected') {
      const reasonStr = targetRow.rejection_reason ? ` (반려 사유: ${targetRow.rejection_reason})` : ''
      const err = new Error(`회원가입 신청이 반려되었습니다.${reasonStr}\n'학생 회원가입 신청'에서 가입 정보를 수정하여 다시 제출해 주세요.`)
      err.isRejected = true
      err.rejectionReason = targetRow.rejection_reason || ''
      err.studentCode = cleanCode
      throw err
    }

    // 2. 비밀번호(전화번호 해시) 검증
    const isHashMatched = (targetRow.student_phone_hash && targetRow.student_phone_hash === inputHash) ||
                          (targetRow.phone_hash && targetRow.phone_hash === inputHash)
    const isLast4Matched = targetRow.student_phone_last4 && cleanPasswordDigits.endsWith(targetRow.student_phone_last4)

    if (!isHashMatched && !isLast4Matched) {
      throw new Error('학번 또는 비밀번호(전화번호)가 올바르지 않습니다.')
    }

    // 3. 인증 성공 시 세션 생성
    const sCodeStr = String(cleanCode || '')
    let pGrade = targetRow.grade
    let pClass = targetRow.class_no
    let pSeq = targetRow.student_no || targetRow.seq_no
    if (pGrade == null && sCodeStr.length === 5 && sCodeStr.startsWith('3')) {
      pGrade = parseInt(sCodeStr.substring(0, 1))
      pClass = parseInt(sCodeStr.substring(1, 3))
      pSeq = parseInt(sCodeStr.substring(3, 5))
    }

    token.value = `student_${targetRow.id}_${Date.now()}`
    role.value = 'student'
    status.value = targetRow.status
    grade.value = pGrade
    classNo.value = pClass
    seqNo.value = pSeq
    studentCode.value = cleanCode
    studentName.value = await decryptText(targetRow.name)
    studentPhone.value = cleanPasswordDigits
    if (targetRow.gpa_overall != null) gpaOverall.value = String(targetRow.gpa_overall)
    phoneLast4.value = cleanPasswordDigits.slice(-4)
    isEnrolled.value = targetRow.is_enrolled !== false
    gradYear.value = targetRow.grad_year
    hasDisciplinary.value = targetRow.has_disciplinary || false
    _persist()
  }

  // 학생 회원가입 (enrolled_students 마스터 원장에 저장 - profiles 미생성)
  async function signUpStudent({ studentCode: sCode, name, phone, parentPhone, isEnrolled: enrolled, gradYear: gYear, registrationCode, applySchoolRecommend = true, applyRural = false, ruralType = '유형I', ruralSelfCheck = false }) {
    if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.')

    const cleanPhone = String(phone || '').replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      throw new Error('전화번호(010...) 10~11자리를 정확히 입력해 주세요.')
    }
    const pLast4 = cleanPhone.slice(-4)
    const pHash = await hashPhone(cleanPhone)

    const cleanParentPhone = String(parentPhone || '').replace(/\D/g, '')
    const pPhoneHash = cleanParentPhone ? await hashPhone(cleanParentPhone) : null

    // 1. 가입코드 검증
    const { data: configRow } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'registration_code')
      .maybeSingle()

    const targetCode = configRow && configRow.value ? configRow.value : '17835'
    if (String(registrationCode).trim() !== String(targetCode).trim()) {
      throw new Error('가입코드가 올바르지 않습니다. 다시 확인해 주세요.')
    }

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

      if (parsedClass !== 99 && (isNaN(parsedClass) || parsedClass < 1 || parsedClass > maxClass)) {
        throw new Error(`학번의 반 번호(${parsedClass}반)가 존재하지 않습니다. (1반 ~ ${maxClass}반 범위로 입력해 주세요)`)
      }

      if (isNaN(parsedSeq) || parsedSeq < 1 || parsedSeq > 50) {
        throw new Error(`학번의 출석 번호(${parsedSeq}번)가 올바르지 않습니다.`)
      }
    }

    let studentCodeStr = String(sCode).trim()
    if (!enrolled && gYear) {
      const gYearStr = String(gYear)
      studentCodeStr = sCode 
        ? (studentCodeStr.startsWith(gYearStr) ? studentCodeStr : `${gYearStr}${studentCodeStr}`)
        : `grad_${gYear}_${cleanPhone.slice(-4)}`
    }

    const encName = await encryptText(name.trim())
    const nameHash = await hashText(name.trim())

    // 2. enrolled_students 원장 테이블에서 기존 가입 검사
    const { data: matchedStudent } = await supabase
      .from('enrolled_students')
      .select('id, name, student_code, is_enrolled, status, user_id')
      .eq('student_code', studentCodeStr)
      .maybeSingle()

    let isAutoApproved = false
    let targetId = matchedStudent?.id

    if (matchedStudent) {
      isAutoApproved = matchedStudent.status === 'approved'
      const updatePayload = {
        name: encName,
        name_hash: nameHash,
        student_phone_hash: pHash,
        parent_phone_hash: pPhoneHash,
        status: matchedStudent.status === 'approved' ? 'approved' : 'pending',
        rejection_reason: null,
        is_enrolled: Boolean(enrolled),
        grade: enrolled ? parsedGrade : (matchedStudent.grade || null),
        class_no: enrolled ? parsedClass : (matchedStudent.class_no || null),
        student_no: enrolled ? parsedSeq : (matchedStudent.student_no || null),
        seq_no: enrolled ? parsedSeq : (matchedStudent.seq_no || null),
        grad_year: !enrolled && gYear ? Number(gYear) : (matchedStudent.grad_year || null)
      }
      const { error: updErr } = await supabase.from('enrolled_students').update(updatePayload).eq('id', matchedStudent.id)
      if (updErr) throw updErr
    } else {
      // enrolled_students 원장에 없는 학생인 경우: 승인 절차(pending) 필요
      isAutoApproved = false
      const insertPayload = {
        student_code: studentCodeStr,
        name: encName,
        name_hash: nameHash,
        student_phone_hash: pHash,
        parent_phone_hash: pPhoneHash,
        is_enrolled: Boolean(enrolled),
        grade: enrolled ? parsedGrade : null,
        class_no: enrolled ? parsedClass : null,
        student_no: enrolled ? parsedSeq : null,
        seq_no: enrolled ? parsedSeq : null,
        grad_year: !enrolled && gYear ? Number(gYear) : null,
        status: 'pending' // 승인 절차 필요
      }
      const { data: inserted, error: insErr } = await supabase.from('enrolled_students').insert(insertPayload).select('id').maybeSingle()
      if (insErr) throw insErr
      if (inserted) targetId = inserted.id
    }

    // 3. 농어촌 지원 및 본인 확인 체크 시 student_rural_eligibility 테이블에 즉시 등록/업데이트
    if (applyRural && ruralSelfCheck && targetId) {
      try {
        const ruralTypeVal = (ruralType === '유형II' || ruralType === 'TYPE_2') ? 'TYPE_2' : 'TYPE_1'
        await supabase.from('student_rural_eligibility').upsert({
          student_id: targetId,
          is_eligible: true,
          is_manual_approved: true,
          rural_type: ruralTypeVal,
          manual_reason: '본인 자격 요건 직접 확인 및 신청',
          updated_at: new Date().toISOString()
        }, { onConflict: 'student_id' })
      } catch (e) {
        console.warn('Auto rural eligibility creation error:', e)
      }
    }

    clearAuthStates()
    return { isAutoApproved }
  }

  // 로그아웃
  async function logout() {
    if (supabase) {
      await supabase.auth.signOut()
    }
    clearAuthStates()
    _router?.push('/login')
  }

  const user = computed(() => userId.value ? { id: userId.value } : null)

  return {
    token, userId, user, role, status, grade, classNo, teacherName,
    studentCode, studentName, studentPhone, gpaOverall, phoneLast4, seqNo, isEnrolled, gradYear, hasDisciplinary,
    initialized, isAdmin, isTeacher, isStudent,
    checkStatus, loginAdmin, loginTeacher, loginStudent, signUpStudent, logout
  }
})
