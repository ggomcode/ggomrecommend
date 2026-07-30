<template>
  <div v-if="isExpired" class="min-h-screen flex items-center justify-center p-6 bg-slate-900 text-slate-100 font-sans">
    <div class="max-w-md w-full bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
      <!-- Decorative background glow -->
      <div class="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl"></div>

      <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 mb-6 border border-rose-500/20">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>

      <h1 class="text-2xl font-bold tracking-tight text-white mb-3">시스템 이용 기간 만료</h1>
      <p class="text-slate-400 leading-relaxed mb-6">
        본 학교장 추천자 선발 관리 시스템의 운영 기간이 만료되었습니다. 
        이 시스템은 한국 시간 기준 <strong>2026년 12월</strong>까지만 운영하도록 설정되어 있어 현재는 접속할 수 없습니다.
      </p>

      <div class="border-t border-slate-700/50 pt-5">
        <p class="text-xs text-slate-500">운영 종료 시점: 2026년 12월 31일 23:59 KST</p>
        <p class="text-xs text-slate-500 mt-1">문의: 본교 3학년부 교무실</p>
      </div>
    </div>
  </div>
  <template v-else>
    <RouterView />
    <DialogHost />

    <!-- 세션 자동 로그아웃 경고 모달 -->
    <div v-if="showWarningModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div class="bg-white dark:bg-slate-800 rounded-3xl p-7 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-700 text-center relative overflow-hidden animate-in fade-in zoom-in duration-200">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-500 mb-4 border border-amber-200 dark:border-amber-900/40">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>

        <h2 class="text-lg font-bold text-slate-800 dark:text-white mb-2">자동 로그아웃 안내</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
          10분 이상 사용 변화가 없어 개인정보 보호를 위해<br>
          <span class="text-rose-500 font-extrabold text-sm">{{ countdownSec }}초 후</span> 자동으로 로그아웃됩니다.
        </p>

        <div class="flex gap-2">
          <button
            @click="handleLogoutNow(false)"
            class="flex-1 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition-colors cursor-pointer border-none"
          >로그아웃</button>
          <button
            @click="extendSession"
            class="flex-1 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer border-none shadow-sm"
          >로그인 연장</button>
        </div>
      </div>
    </div>
  </template>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import DialogHost from './components/common/DialogHost.vue'
import { useAuthStore } from './stores/auth'

// 2026년 12월 31일 23:59:59 KST (UTC로는 15시 0분 0초)
const EXPIRATION_TIME = new Date(Date.UTC(2026, 11, 31, 15, 0, 0)).getTime()
const isExpired = ref(Date.now() > EXPIRATION_TIME)

const auth = useAuthStore()

const INACTIVITY_LIMIT_MS = 10 * 60 * 1000 // 10분
const WARNING_COUNTDOWN_SEC = 30 // 30초

const showWarningModal = ref(false)
const countdownSec = ref(WARNING_COUNTDOWN_SEC)

let idleCheckInterval = null
let countdownInterval = null
let lastActivityTime = Date.now()

function updateLastActivity() {
  const now = Date.now()
  if (now - lastActivityTime < 3000) return
  lastActivityTime = now
  localStorage.setItem('pcm_last_activity', String(now))
}

function startIdleMonitoring() {
  stopIdleMonitoring()

  const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart']
  events.forEach(event => {
    window.addEventListener(event, updateLastActivity, { passive: true })
  })

  idleCheckInterval = setInterval(() => {
    if (!auth.token) return

    const now = Date.now()
    const storedLast = Number(localStorage.getItem('pcm_last_activity')) || lastActivityTime
    const idleMs = now - storedLast

    if (idleMs >= INACTIVITY_LIMIT_MS && !showWarningModal.value) {
      triggerWarningModal()
    }
  }, 1000)
}

function stopIdleMonitoring() {
  const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart']
  events.forEach(event => {
    window.removeEventListener(event, updateLastActivity)
  })
  if (idleCheckInterval) clearInterval(idleCheckInterval)
  if (countdownInterval) clearInterval(countdownInterval)
  idleCheckInterval = null
  countdownInterval = null
}

function triggerWarningModal() {
  showWarningModal.value = true
  countdownSec.value = WARNING_COUNTDOWN_SEC

  if (countdownInterval) clearInterval(countdownInterval)
  countdownInterval = setInterval(() => {
    countdownSec.value--
    if (countdownSec.value <= 0) {
      clearInterval(countdownInterval)
      countdownInterval = null
      handleLogoutNow(true)
    }
  }, 1000)
}

function extendSession() {
  showWarningModal.value = false
  if (countdownInterval) clearInterval(countdownInterval)
  countdownInterval = null

  lastActivityTime = Date.now()
  localStorage.setItem('pcm_last_activity', String(lastActivityTime))
}

async function handleLogoutNow(isAuto = false) {
  showWarningModal.value = false
  stopIdleMonitoring()
  await auth.logout()
  if (isAuto) {
    alert('장시간(10분 이상) 동안 활동이 없어 개인정보 보호를 위해 자동 로그아웃되었습니다.')
  }
}

function checkInitialSessionStale() {
  if (auth.token) {
    const storedLast = Number(localStorage.getItem('pcm_last_activity'))
    if (storedLast && Date.now() - storedLast >= INACTIVITY_LIMIT_MS) {
      auth.logout()
    } else {
      updateLastActivity()
      startIdleMonitoring()
    }
  }
}

watch(() => auth.token, (newToken) => {
  if (newToken) {
    updateLastActivity()
    startIdleMonitoring()
  } else {
    showWarningModal.value = false
    stopIdleMonitoring()
  }
}, { immediate: true })

onMounted(() => {
  checkInitialSessionStale()
})

onUnmounted(() => {
  stopIdleMonitoring()
})
</script>
