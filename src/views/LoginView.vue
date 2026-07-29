<template>
  <div class="min-h-screen flex items-center justify-center p-6 bg-slate-100 dark:bg-slate-900 font-sans transition-colors duration-300">
    <div
      class="w-full bg-white dark:bg-slate-800 shadow-xl border border-slate-200/50 dark:border-slate-700/50 transition-all duration-300 relative overflow-hidden"
      style="max-width: 440px; border-radius: 24px; padding: 2.5rem;"
    >
      <!-- Decorative background blur -->
      <div class="absolute -top-24 -left-24 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-24 -right-24 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl"></div>

      <!-- 헤더 -->
      <div class="text-center mb-8 relative">
        <div
          class="inline-flex items-center justify-center rounded-2xl mb-4 shadow-sm border border-blue-100/50 dark:border-blue-900/30"
          style="width: 56px; height: 56px; background: #eff6ff;"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-slate-800 dark:text-white tracking-tight" style="margin: 0 0 4px;">학교장 추천자</h1>
        <p class="text-sm font-medium text-slate-400 dark:text-slate-500" style="margin: 0;">선발 관리 시스템</p>
      </div>

      <!-- 역할 토글 (3선택) -->
      <div
        class="flex rounded-xl overflow-hidden mb-6 p-1 bg-slate-100/80 dark:bg-slate-900/50"
        style="border: 1px solid #e2e8f0; border-color: rgba(226, 232, 240, 0.8);"
      >
        <button
          type="button"
          @click="switchMode('student')"
          class="flex-1 text-sm font-bold py-2 rounded-lg transition-all duration-200 cursor-pointer"
          :style="mode === 'student'
            ? { background: '#2563eb', color: 'white', border: 'none' }
            : { background: 'transparent', color: '#64748b', border: 'none' }"
        >학생</button>
        <button
          type="button"
          @click="switchMode('teacher')"
          class="flex-1 text-sm font-bold py-2 rounded-lg transition-all duration-200 cursor-pointer"
          :style="mode === 'teacher'
            ? { background: '#2563eb', color: 'white', border: 'none' }
            : { background: 'transparent', color: '#64748b', border: 'none' }"
        >담임</button>
        <button
          type="button"
          @click="switchMode('admin')"
          class="flex-1 text-sm font-bold py-2 rounded-lg transition-all duration-200 cursor-pointer"
          :style="mode === 'admin'
            ? { background: '#2563eb', color: 'white', border: 'none' }
            : { background: 'transparent', color: '#64748b', border: 'none' }"
        >관리자</button>
      </div>

      <!-- [1] 학생 로그인 및 가입 폼 -->
      <div v-if="mode === 'student'">
        <!-- 로그인 화면 -->
        <form v-if="!isSignUp" @submit.prevent="handleStudentLogin" class="flex flex-col gap-4">
          <div>
            <label class="block text-sm font-semibold mb-1.5 text-slate-500 dark:text-slate-400">학번 (5자리)</label>
            <input
              v-model="studentCode"
              type="text"
              required
              placeholder="예: 30120"
              maxlength="5"
              pattern="\d{5}"
              class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-900 dark:text-white dark:border-slate-700"
              style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; box-sizing: border-box;"
            />
          </div>

          <div>
            <label class="block text-sm font-semibold mb-1.5 text-slate-500 dark:text-slate-400">비밀번호</label>
            <input
              v-model="studentPassword"
              type="password"
              required
              class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-900 dark:text-white dark:border-slate-700"
              style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; box-sizing: border-box;"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full text-sm font-bold disabled:opacity-40 transition-colors cursor-pointer"
            style="padding: 12px; border: none; border-radius: 10px; background: #2563eb; color: white; margin-top: 4px;"
          >{{ loading ? '로그인 중…' : '로그인' }}</button>

          <div class="text-center mt-3">
            <button type="button" @click="isSignUp = true" class="text-xs text-blue-500 hover:underline cursor-pointer bg-transparent border-none">
              아직 계정이 없으신가요? 회원가입 신청
            </button>
          </div>
        </form>

        <!-- 회원가입 화면 -->
        <form v-else @submit.prevent="handleStudentSignUp" class="flex flex-col gap-3">
          <div>
            <label class="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">학교 배포 가입코드</label>
            <input
              v-model="signupCode"
              type="text"
              required
              placeholder="학교에서 안내받은 가입코드를 입력하세요"
              class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-900 dark:text-white dark:border-slate-700"
              style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; box-sizing: border-box;"
            />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">구분</label>
              <select
                v-model="signupIsEnrolled"
                class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-900 dark:text-white dark:border-slate-700 bg-white"
                style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; box-sizing: border-box;"
              >
                <option :value="true">재학생</option>
                <option :value="false">졸업생</option>
              </select>
            </div>
            <div v-if="!signupIsEnrolled">
              <label class="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">졸업 학년도</label>
              <input
                v-model.number="signupGradYear"
                type="number"
                required
                class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-900 dark:text-white dark:border-slate-700"
                style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; box-sizing: border-box;"
              />
            </div>
            <div v-else>
              <label class="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">학번 (5자리)</label>
              <input
                v-model="signupStudentCode"
                type="text"
                required
                maxlength="5"
                placeholder="예: 30205"
                pattern="\d{5}"
                class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-900 dark:text-white dark:border-slate-700"
                style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; box-sizing: border-box;"
              />
            </div>
          </div>

          <!-- 졸업생인 경우 학번도 함께 입력받기 위해 grid 아래에 배치 -->
          <div v-if="!signupIsEnrolled">
            <label class="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">학번 (재학 당시 5자리)</label>
            <input
              v-model="signupStudentCode"
              type="text"
              required
              maxlength="5"
              placeholder="예: 30120"
              class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-900 dark:text-white dark:border-slate-700"
              style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; box-sizing: border-box;"
            />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">이름</label>
              <input
                v-model="signupName"
                type="text"
                required
                class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-900 dark:text-white dark:border-slate-700"
                style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; box-sizing: border-box;"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">연락처 끝 4자리</label>
              <input
                v-model="signupPhoneLast4"
                type="text"
                required
                maxlength="4"
                pattern="\d{4}"
                placeholder="예: 5678"
                class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-900 dark:text-white dark:border-slate-700"
                style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; box-sizing: border-box;"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">비밀번호 (8자 이상)</label>
            <input
              v-model="signupPassword"
              type="password"
              required
              minlength="8"
              class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-900 dark:text-white dark:border-slate-700"
              style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; box-sizing: border-box;"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">비밀번호 확인</label>
            <input
              v-model="signupConfirm"
              type="password"
              required
              class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-900 dark:text-white dark:border-slate-700"
              style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; box-sizing: border-box;"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full text-sm font-bold disabled:opacity-40 transition-colors cursor-pointer"
            style="padding: 10px; border: none; border-radius: 8px; background: #2563eb; color: white; margin-top: 4px;"
          >{{ loading ? '가입 신청 중…' : '가입 신청 완료하기' }}</button>

          <div class="text-center mt-2">
            <button type="button" @click="isSignUp = false" class="text-xs text-blue-500 hover:underline cursor-pointer bg-transparent border-none">
              이미 가입하셨나요? 로그인하러 가기
            </button>
          </div>
        </form>
      </div>

      <!-- [2] 담임 로그인 폼 -->
      <form v-if="mode === 'teacher'" @submit.prevent="handleTeacherLogin" class="flex flex-col gap-4">
        <div>
          <label class="block text-sm font-semibold mb-1.5 text-slate-500 dark:text-slate-400">교사 아이디</label>
          <input
            v-model="teacherId"
            type="text"
            required
            placeholder="교사 아이디 입력"
            class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-900 dark:text-white dark:border-slate-700"
            style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; box-sizing: border-box;"
          />
        </div>

        <div>
          <label class="block text-sm font-semibold mb-1.5 text-slate-500 dark:text-slate-400">비밀번호</label>
          <input
            v-model="teacherPassword"
            type="password"
            autocomplete="current-password"
            required
            class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-900 dark:text-white dark:border-slate-700"
            style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; box-sizing: border-box;"
          />
        </div>

        <button
          type="submit"
          :disabled="loading || !teacherId"
          class="w-full text-sm font-bold disabled:opacity-40 transition-colors cursor-pointer"
          style="padding: 12px; border: none; border-radius: 10px; background: #2563eb; color: white; margin-top: 4px;"
        >{{ loading ? '로그인 중…' : '로그인' }}</button>
      </form>

      <!-- [3] 관리자 로그인 폼 -->
      <form v-if="mode === 'admin'" @submit.prevent="handleAdminLogin" class="flex flex-col gap-4">
        <div>
          <label class="block text-sm font-semibold mb-1.5 text-slate-500 dark:text-slate-400">관리자 아이디</label>
          <input
            v-model="adminId"
            type="text"
            required
            placeholder="관리자 아이디 입력"
            class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-900 dark:text-white dark:border-slate-700"
            style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; box-sizing: border-box;"
          />
        </div>

        <div>
          <label class="block text-sm font-semibold mb-1.5 text-slate-500 dark:text-slate-400">비밀번호</label>
          <input
            v-model="adminPassword"
            type="password"
            autocomplete="current-password"
            required
            class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-900 dark:text-white dark:border-slate-700"
            style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; box-sizing: border-box;"
          />
        </div>

        <button
          type="submit"
          :disabled="loading || !adminId"
          class="w-full text-sm font-bold disabled:opacity-40 transition-colors cursor-pointer"
          style="padding: 12px; border: none; border-radius: 10px; background: #2563eb; color: white; margin-top: 4px;"
        >{{ loading ? '로그인 중…' : '로그인' }}</button>
      </form>

      <!-- 메시지 배너 -->
      <p v-if="error" class="text-sm font-semibold text-center mt-4 text-rose-500 bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-lg border border-rose-100 dark:border-rose-900/30">{{ error }}</p>
      <p v-if="success" class="text-sm font-semibold text-center mt-4 text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">{{ success }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../utils/supabaseClient'

const router = useRouter()
const auth = useAuthStore()

const LS_GRADE = 'login_teacher_grade'
const LS_CLASS = 'login_teacher_class'

const mode = ref('student')
const isSignUp = ref(false)
const loading = ref(false)
const error = ref(null)
const success = ref(null)

// 학생용 상태
const studentCode = ref('')
const studentPassword = ref('')

// 학생 회원가입 상태
const signupCode = ref('')
const signupIsEnrolled = ref(true)
const signupGradYear = ref(new Date().getFullYear())
const signupStudentCode = ref('')
const signupName = ref('')
const signupPhoneLast4 = ref('')
const signupPassword = ref('')
const signupConfirm = ref('')

// 관리자 / 교사용 상태
const adminId = ref('')
const adminPassword = ref('')
const teacherId = ref('')
const teacherPassword = ref('')

const classes = ref([])
const classesLoading = ref(false)

const availableGrades = computed(() =>
  [...new Set(classes.value.map(c => c.grade))].sort((a, b) => a - b)
)

const isGraduated = computed(() => teacherGrade.value === 0)

const availableClassNos = computed(() => {
  if (teacherGrade.value === '' || isGraduated.value) return []
  return classes.value
    .filter(c => c.grade === teacherGrade.value)
    .map(c => c.class_no)
    .sort((a, b) => a - b)
})

function onGradeChange() {
  if (isGraduated.value) {
    teacherClassNo.value = 0
  } else if (!availableClassNos.value.includes(teacherClassNo.value)) {
    teacherClassNo.value = ''
  }
}

// Supabase DB에 등록된 담임 교사 기반 학급 조회 (없으면 디폴트 로드)
async function fetchClasses() {
  classesLoading.value = true
  try {
    if (!supabase) throw new Error('Supabase client uninitialized')
    const { data, error: err } = await supabase
      .from('profiles')
      .select('grade, class_no')
      .eq('role', 'teacher')

    if (err) throw err

    if (!data || data.length === 0) {
      const defaultClasses = [{ grade: 0, class_no: 0 }]
      for (let g = 1; g <= 3; g++) {
        for (let c = 1; c <= 15; c++) {
          defaultClasses.push({ grade: g, class_no: c })
        }
      }
      classes.value = defaultClasses
    } else {
      // 중복 제거 및 졸업생 담임 포함
      const uniqueClasses = [{ grade: 0, class_no: 0 }]
      const seen = new Set()
      data.forEach(c => {
        if (c.grade !== null && c.class_no !== null) {
          const key = `${c.grade}-${c.class_no}`
          if (!seen.has(key)) {
            seen.add(key)
            uniqueClasses.push(c)
          }
        }
      })
      classes.value = uniqueClasses
    }

    if (teacherGrade.value !== '' && !availableGrades.value.includes(Number(teacherGrade.value))) {
      teacherGrade.value = ''
      teacherClassNo.value = ''
    } else if (teacherClassNo.value !== '' && !availableClassNos.value.includes(Number(teacherClassNo.value))) {
      teacherClassNo.value = ''
    }
  } catch (e) {
    // 오프라인/테스트 대응 디폴트 구성
    const defaultClasses = [{ grade: 0, class_no: 0 }]
    for (let g = 1; g <= 3; g++) {
      for (let c = 1; c <= 15; c++) {
        defaultClasses.push({ grade: g, class_no: c })
      }
    }
    classes.value = defaultClasses
  } finally {
    classesLoading.value = false
  }
}

function switchMode(m) {
  mode.value = m
  isSignUp.value = false
  error.value = null
  success.value = null
}

async function handleStudentLogin() {
  error.value = null
  success.value = null
  loading.value = true
  try {
    if (!/^\d{5}$/.test(studentCode.value)) {
      error.value = '학번은 5자리 숫자 형식이어야 합니다.'
      loading.value = false
      return
    }
    await auth.loginStudent(studentCode.value, studentPassword.value)
    router.push('/student')
  } catch (e) {
    error.value = e.message || '로그인에 실패했습니다.'
  } finally {
    loading.value = false
  }
}

async function handleStudentSignUp() {
  error.value = null
  success.value = null
  loading.value = true
  
  if (signupPassword.value !== signupConfirm.value) {
    error.value = '비밀번호가 일치하지 않습니다.'
    loading.value = false
    return
  }

  if (!signupCode.value) {
    error.value = '가입코드를 입력해 주세요.'
    loading.value = false
    return
  }

  if (signupIsEnrolled.value && !/^\d{5}$/.test(signupStudentCode.value)) {
    error.value = '학번은 5자리 숫자여야 합니다 (예: 30205).'
    loading.value = false
    return
  }

  if (!signupName.value) {
    error.value = '이름을 입력해 주세요.'
    loading.value = false
    return
  }

  if (!/^\d{4}$/.test(signupPhoneLast4.value)) {
    error.value = '연락처 끝 4자리는 숫자 4자리여야 합니다.'
    loading.value = false
    return
  }

  try {
    await auth.signUpStudent({
      studentCode: signupStudentCode.value,
      name: signupName.value,
      phoneLast4: signupPhoneLast4.value,
      password: signupPassword.value,
      isEnrolled: signupIsEnrolled.value,
      gradYear: signupIsEnrolled.value ? null : signupGradYear.value,
      registrationCode: signupCode.value
    })
    
    // 성공 시 초기화 및 로그인 폼 이동
    isSignUp.value = false
    studentCode.value = signupStudentCode.value
    success.value = '회원가입 신청이 완료되었습니다! 담임 교사의 승인 후 로그인이 가능합니다.'
    
    // 입력폼 초기화
    signupCode.value = ''
    signupStudentCode.value = ''
    signupName.value = ''
    signupPhoneLast4.value = ''
    signupPassword.value = ''
    signupConfirm.value = ''
  } catch (e) {
    error.value = e.message || '회원가입에 실패했습니다.'
  } finally {
    loading.value = false
  }
}

async function handleTeacherLogin() {
  error.value = null
  success.value = null
  loading.value = true
  try {
    await auth.loginTeacher(teacherId.value, teacherPassword.value)
    router.push('/teacher')
  } catch (e) {
    error.value = e.message || '로그인에 실패했습니다.'
  } finally {
    loading.value = false
  }
}

async function handleAdminLogin() {
  error.value = null
  success.value = null
  loading.value = true
  try {
    await auth.loginAdmin(adminId.value, adminPassword.value)
    router.push('/admin')
  } catch (e) {
    error.value = e.message || '로그인에 실패했습니다.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchClasses)
</script>
