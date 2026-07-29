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

      <!-- 통합 로그인 폼 -->
      <div v-if="!isSignUp">
        <form @submit.prevent="handleLogin" class="flex flex-col gap-4">
          <div>
            <label class="block text-sm font-semibold mb-1.5 text-slate-500 dark:text-slate-400">아이디 또는 학번</label>
            <input
              v-model="loginId"
              type="text"
              required
              placeholder="아이디 또는 5자리 학번 입력"
              class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-900 dark:text-white dark:border-slate-700"
              style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; box-sizing: border-box;"
            />
          </div>

          <div>
            <label class="block text-sm font-semibold mb-1.5 text-slate-500 dark:text-slate-400">비밀번호 또는 학생 연락처</label>
            <input
              v-model="loginPassword"
              type="password"
              required
              placeholder="비밀번호 또는 연락처(010...) 입력"
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

          <div class="text-center mt-4">
            <button
              type="button"
              @click="isSignUp = true"
              class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer bg-transparent border-none transition-colors"
            >
              아직 계정이 없으신가요?
              <span class="text-blue-600 dark:text-blue-400 font-bold underline ml-1">학생 회원가입 신청</span>
            </button>
          </div>
        </form>
      </div>

      <!-- 학생 회원가입 폼 -->
      <div v-else>
        <form @submit.prevent="openConfirmModal" class="flex flex-col gap-3">
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
            <div>
              <label class="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">학번 (5자리)</label>
              <input
                v-model="signupStudentCode"
                type="text"
                required
                placeholder="예: 30120"
                maxlength="5"
                pattern="\d{5}"
                class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-900 dark:text-white dark:border-slate-700"
                style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; box-sizing: border-box;"
              />
            </div>
          </div>

          <div v-if="!signupIsEnrolled">
            <label class="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">졸업 학년도</label>
            <input
              v-model.number="signupGradYear"
              type="number"
              required
              placeholder="예: 2025"
              class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-900 dark:text-white dark:border-slate-700"
              style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; box-sizing: border-box;"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">이름</label>
            <input
              v-model="signupName"
              type="text"
              required
              placeholder="학생 이름 입력"
              class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-900 dark:text-white dark:border-slate-700"
              style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; box-sizing: border-box;"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">전화번호 (로그인 비밀번호로 사용)</label>
            <input
              v-model="signupPhone"
              type="tel"
              required
              placeholder="01012345678 (- 없이 입력)"
              class="w-full text-sm focus:outline-none focus:ring-2 dark:bg-slate-900 dark:text-white"
              :class="signupPhone.includes('-') ? 'border-rose-400 focus:ring-rose-400 dark:border-rose-500' : 'border-slate-200 focus:ring-blue-400 dark:border-slate-700'"
              style="border-radius: 8px; padding: 8px 12px; box-sizing: border-box;"
            />
            <p v-if="signupPhone.includes('-')" class="text-xs text-rose-500 dark:text-rose-400 font-semibold mt-1" style="margin: 2px 0 0;">
              ⚠️ 하이픈('-')을 제외하고 숫자만 입력해 주세요 (예: 01012345678).
            </p>
            <p v-else class="text-xs text-slate-400 mt-1" style="margin: 2px 0 0;">* 이 전화번호가 추후 로그인 시 비밀번호가 됩니다.</p>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full text-sm font-bold disabled:opacity-40 transition-colors cursor-pointer"
            style="padding: 10px; border: none; border-radius: 8px; background: #2563eb; color: white; margin-top: 4px;"
          >{{ loading ? '검증 중…' : '가입 신청 완료하기' }}</button>

          <div class="text-center mt-3">
            <button
              type="button"
              @click="isSignUp = false"
              class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer bg-transparent border-none transition-colors"
            >
              이미 가입하셨나요?
              <span class="text-blue-600 dark:text-blue-400 font-bold underline ml-1">로그인하러 가기</span>
            </button>
          </div>
        </form>
      </div>

      <!-- 가입 정보 최종 확인 팝업 모달 -->
      <div
        v-if="showConfirmModal"
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 max-w-sm w-full space-y-4">
          <div class="text-center">
            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <h3 class="text-lg font-bold text-slate-800 dark:text-white" style="margin: 0 0 4px;">가입 정보 최종 확인</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400" style="margin: 0;">입력하신 가입 정보가 맞는지 확인해 주세요.</p>
          </div>

          <div class="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-100 dark:border-slate-700/60 text-sm space-y-2.5">
            <div class="flex justify-between items-center">
              <span class="text-xs text-slate-400 font-semibold">구분</span>
              <span class="font-bold text-slate-700 dark:text-slate-200">
                {{ signupIsEnrolled ? '재학생' : `졸업생 (${signupGradYear}학년도)` }}
              </span>
            </div>
            <div v-if="signupIsEnrolled" class="flex justify-between items-center">
              <span class="text-xs text-slate-400 font-semibold">학번</span>
              <span class="font-bold text-blue-600 dark:text-blue-400 font-mono">
                {{ signupStudentCode }}
                <span class="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">
                  <template v-if="parseInt(signupStudentCode.substring(1, 3)) === 99">(테스트용 99반 {{ parseInt(signupStudentCode.substring(3, 5)) }}번)</template>
                  <template v-else>(3학년 {{ parseInt(signupStudentCode.substring(1, 3)) }}반 {{ parseInt(signupStudentCode.substring(3, 5)) }}번)</template>
                </span>
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-slate-400 font-semibold">이름</span>
              <span class="font-bold text-slate-700 dark:text-slate-200">{{ signupName }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-slate-400 font-semibold">전화번호 (로그인 비번)</span>
              <span class="font-bold text-slate-700 dark:text-slate-200 font-mono">{{ cleanPhoneInput }}</span>
            </div>
          </div>

          <p class="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200/60 text-center" style="margin: 0;">
            * 담임 교사의 가입 승인 완료 후 로그인이 가능합니다.
          </p>

          <div class="flex gap-2 pt-1">
            <button
              type="button"
              @click="showConfirmModal = false"
              class="flex-1 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition-colors cursor-pointer border-none"
            >
              수정하기
            </button>
            <button
              type="button"
              :disabled="loading"
              @click="confirmAndSignUp"
              class="flex-1 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer border-none shadow-sm disabled:opacity-40"
            >
              {{ loading ? '가입 진행 중…' : '확인 및 가입 신청' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 메시지 배너 -->
      <p v-if="error" class="text-sm font-semibold text-center mt-4 text-rose-500 bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-lg border border-rose-100 dark:border-rose-900/30">
        {{ typeof error === 'object' ? (error.message || '가입 처리 중 오류가 발생했습니다.') : error }}
      </p>
      <p v-if="success" class="text-sm font-semibold text-center mt-4 text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">{{ success }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const isSignUp = ref(false)
const loading = ref(false)
const error = ref(null)
const success = ref(null)
const showConfirmModal = ref(false)

// 로그인 상태
const loginId = ref('')
const loginPassword = ref('')

// 학생 회원가입 상태
const signupCode = ref('')
const signupIsEnrolled = ref(true)
const signupGradYear = ref(new Date().getFullYear())
const signupStudentCode = ref('')
const signupName = ref('')
const signupPhone = ref('')

const cleanPhoneInput = computed(() => {
  return signupPhone.value.replace(/\D/g, '')
})

async function handleLogin() {
  error.value = null
  success.value = null
  loading.value = true
  const id = loginId.value.trim()
  const pw = loginPassword.value

  try {
    if (id === 'admin') {
      await auth.loginAdmin(id, pw)
      router.push('/admin')
    } else if (id === 'teacher') {
      await auth.loginTeacher(id, pw)
      router.push('/teacher')
    } else {
      // 5자리 숫자 학번 형태를 검사해서 학생 로그인 처리 (전화번호 비밀번호 정제 지원)
      if (!/^\d{5}$/.test(id)) {
        throw new Error('아이디는 admin, teacher 또는 5자리 학번이어야 합니다.')
      }
      await auth.loginStudent(id, pw)
      router.push('/student')
    }
  } catch (e) {
    error.value = e.message || '로그인에 실패했습니다.'
  } finally {
    loading.value = false
  }
}

// 1단계: 사전 입력 검증 후 최종 확인 모달 띄우기
function openConfirmModal() {
  error.value = null
  success.value = null

  if (signupPhone.value.includes('-')) {
    error.value = "전화번호에 하이픈('-')을 제외하고 숫자만 입력해 주세요 (예: 01012345678)."
    return
  }

  const cleanPhone = cleanPhoneInput.value
  if (!cleanPhone || cleanPhone.length < 10 || !cleanPhone.startsWith('010')) {
    error.value = '전화번호는 010으로 시작하는 10~11자리 숫자여야 합니다 (예: 01012345678).'
    return
  }

  if (!signupCode.value) {
    error.value = '가입코드를 입력해 주세요.'
    return
  }

  if (!/^\d{5}$/.test(signupStudentCode.value)) {
    error.value = '학번은 5자리 숫자여야 합니다 (예: 30120).'
    return
  }

  if (!signupName.value) {
    error.value = '이름을 입력해 주세요.'
    return
  }

  // 모달 열기
  showConfirmModal.value = true
}

// 2단계: 모달에서 '확인 및 가입 신청' 클릭 시 실제 가입 수행
async function confirmAndSignUp() {
  loading.value = true
  error.value = null

  try {
    await auth.signUpStudent({
      studentCode: signupStudentCode.value,
      name: signupName.value,
      phone: cleanPhoneInput.value,
      isEnrolled: signupIsEnrolled.value,
      gradYear: signupIsEnrolled.value ? null : signupGradYear.value,
      registrationCode: signupCode.value
    })
    
    // 모달 닫기 & 성공 처리 및 로그인 폼으로 자동 전환
    showConfirmModal.value = false
    isSignUp.value = false
    loginId.value = signupStudentCode.value
    loginPassword.value = cleanPhoneInput.value
    success.value = '회원가입 신청이 완료되었습니다! 담임 교사의 승인 후 로그인이 가능합니다.'
    
    // 입력폼 초기화
    signupCode.value = ''
    signupStudentCode.value = ''
    signupName.value = ''
    signupPhone.value = ''
  } catch (e) {
    showConfirmModal.value = false
    error.value = e.message || '회원가입에 실패했습니다.'
  } finally {
    loading.value = false
  }
}
</script>
