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
  </template>
</template>

<script setup>
import { ref } from 'vue'
import DialogHost from './components/common/DialogHost.vue'

// 2026년 12월 31일 23:59:59 KST (UTC로는 15시 0분 0초)
const EXPIRATION_TIME = new Date(Date.UTC(2026, 11, 31, 15, 0, 0)).getTime()
const isExpired = ref(Date.now() > EXPIRATION_TIME)
</script>
