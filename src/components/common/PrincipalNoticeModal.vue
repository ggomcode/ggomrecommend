<template>
  <div
    v-if="show"
    class="fixed inset-0 flex items-center justify-center z-50 p-4"
    style="background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(3px);"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200"
    >
      <!-- 헤더 -->
      <div class="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white shrink-0 border border-white/20 shadow-xs">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        </div>
        <div>
          <span class="text-xs font-semibold text-blue-100 tracking-wide">학교장추천전형 시스템</span>
          <h3 class="text-lg font-bold m-0 leading-tight">프로그램 이용 안내</h3>
        </div>
      </div>

      <!-- 본문 안내문 (사용자 요청 원문 100% 반영) -->
      <div class="p-6 space-y-3.5 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-200">
        <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
          <p class="m-0">
            본 프로그램은 학교장추천전형 선발 업무를 편리하게 지원하기 위한 <strong>보조 도구</strong>입니다.
          </p>
          <p class="m-0">
            프로그램은 입력된 자료를 바탕으로 점수를 계산하고 결과를 정리해 드리지만, 최종 선발 결과의 정확성 확인 및 공식 결정은 <strong>담당자의 검토와 판단</strong>을 통해 이루어져야 합니다.
          </p>
          <p class="m-0 text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
            이 프로그램의 사용으로 인해 발생할 수 있는 결과에 대한 책임은 프로그램 개발자에게 있지 않으며, 운용 및 결과 활용에 관한 책임은 <strong>사용 기관에 있음</strong>을 확인하여 주시기 바랍니다.
          </p>
        </div>
      </div>

      <!-- 하단 확인 버튼 -->
      <div class="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end">
        <button
          type="button"
          @click="confirmAgreement"
          class="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all cursor-pointer border-none flex items-center justify-center gap-1.5"
        >
          <span>확인하였습니다</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const show = ref(false)

function getStorageKey() {
  const userIdentifier = auth.userId || auth.role || 'user'
  return `pcm_principal_disclaimer_agreed_${userIdentifier}`
}

onMounted(() => {
  const specificKey = getStorageKey()
  const agreedSpecific = localStorage.getItem(specificKey) === 'true'
  const agreedGeneral = localStorage.getItem('pcm_principal_disclaimer_agreed') === 'true'

  if (!agreedSpecific && !agreedGeneral) {
    show.value = true
  }
})

function confirmAgreement() {
  const specificKey = getStorageKey()
  localStorage.setItem(specificKey, 'true')
  localStorage.setItem('pcm_principal_disclaimer_agreed', 'true')
  show.value = false
}
</script>

