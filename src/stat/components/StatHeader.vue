<template>
  <header class="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs no-print select-none">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Brand & School Logo (Consistent with ggomrecommend) -->
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-xs">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <line x1="18" y1="20" x2="18" y2="10" stroke-width="2.2" stroke-linecap="round"></line>
              <line x1="12" y1="20" x2="12" y2="4" stroke-width="2.2" stroke-linecap="round"></line>
              <line x1="6" y1="20" x2="6" y2="14" stroke-width="2.2" stroke-linecap="round"></line>
            </svg>
          </div>
          <div class="flex flex-col leading-tight">
            <div class="flex items-center space-x-2">
              <span class="text-xs font-extrabold text-indigo-600 tracking-tight">{{ schoolName }}</span>
              <span class="text-[11px] font-semibold px-1.5 py-0.2 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                2027학년도 대입
              </span>
            </div>
            <h1 class="text-base font-bold text-slate-900 tracking-tight m-0">
              수시 지원 통계 분석 시스템 <span class="text-xs font-semibold text-slate-400 font-mono ml-1">ggomstat</span>
            </h1>
          </div>
        </div>

        <!-- Right Action Controls -->
        <div class="flex items-center space-x-2 sm:space-x-2.5">
          <!-- Role Badge -->
          <div class="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-medium text-slate-700">
            <span>{{ auth.isAdmin ? '👑' : '👨‍🏫' }}</span>
            <span class="font-bold">{{ auth.isAdmin ? '관리자' : (auth.teacherName || auth.user?.user_metadata?.name || '교과 교사') }}</span>
            <span :class="[
              'text-[10px] font-bold px-1.5 py-0.2 rounded-full',
              auth.isAdmin ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-900'
            ]">
              {{ auth.isAdmin ? '관리자 권한' : '교과 교사' }}
            </span>
          </div>

          <!-- Privacy Mask Control:
               - Teacher: Fixed/Locked message
               - Admin: Toggleable
          -->
          <div v-if="auth.isTeacher" class="inline-flex items-center px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-800 border border-amber-300" title="교사는 학생 개인정보 보호를 위해 이름이 자동 마스킹됩니다.">
            <span class="mr-1">🔒</span>
            <span>개인정보 마스킹 고정</span>
          </div>
          <button 
            v-else-if="auth.isAdmin"
            @click="adminMaskToggle = !adminMaskToggle"
            :class="[
              'inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 border cursor-pointer',
              isPrivacyMasked 
                ? 'bg-rose-50 text-rose-700 border-rose-200 ring-2 ring-rose-500/20' 
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            ]"
            title="학생 이름 마스킹 토글 (홍*동)"
          >
            <span class="mr-1.5">{{ isPrivacyMasked ? '🔒' : '🔓' }}</span>
            <span>이름 마스킹 {{ isPrivacyMasked ? 'ON' : 'OFF' }}</span>
          </button>

          <!-- External Google Sheet Dropdown (Admin ONLY!) -->
          <div v-if="auth.isAdmin" class="relative group">
            <button class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer shadow-2xs">
              <svg class="w-3.5 h-3.5 text-emerald-600 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H6v-2h6v2zm4-4H6v-2h10v2zm0-4H6V7h10v2z"/>
              </svg>
              <span>구글 시트</span>
              <svg class="w-3.5 h-3.5 ml-1 text-slate-400 group-hover:text-slate-600 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div class="absolute right-0 mt-1 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
              <a 
                :href="`https://docs.google.com/spreadsheets/d/${kcueSheetId}/edit?gid=1103195680#gid=1103195680`" 
                target="_blank" 
                class="flex items-center px-3.5 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
              >
                <span class="w-2 h-2 rounded-full bg-emerald-500 mr-2.5"></span>
                <div class="truncate">
                  <div class="font-bold">대교협 입력자료 (원자료)</div>
                  <div class="text-[10px] text-slate-400">1,376건 수시 지원 명세</div>
                </div>
              </a>
              <a 
                :href="`https://docs.google.com/spreadsheets/d/${kcueSheetId}/edit?gid=1269753392#gid=1269753392`" 
                target="_blank" 
                class="flex items-center px-3.5 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors border-t border-slate-100"
              >
                <span class="w-2 h-2 rounded-full bg-blue-500 mr-2.5"></span>
                <div class="truncate">
                  <div class="font-bold">포곡고 수시 통계 시트</div>
                  <div class="text-[10px] text-slate-400">재학생 공식 집계 요약</div>
                </div>
              </a>
            </div>
          </div>

          <!-- Excel Export (Admin ONLY) -->
          <button 
            v-if="auth.isAdmin"
            @click="exportToExcel()"
            class="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer shadow-2xs"
          >
            <svg class="w-3.5 h-3.5 mr-1 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span class="hidden sm:inline">엑셀</span>
          </button>

          <!-- Print / PDF (Admin ONLY) -->
          <button 
            v-if="auth.isAdmin"
            @click="window.print()"
            class="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-xs shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <svg class="w-3.5 h-3.5 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span class="hidden sm:inline">인쇄</span>
          </button>

          <!-- Portal Return Button -->
          <button 
            @click="router.push('/select-system')"
            class="inline-flex items-center px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            title="메인 포털 화면으로 돌아갑니다."
          >
            <svg class="w-3.5 h-3.5 mr-1 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>포털로 이동</span>
          </button>

          <!-- Logout Button -->
          <button 
            @click="handleLogout"
            class="hidden sm:inline-flex items-center px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStatData } from '../composables/useStatData'
import { schoolName } from '../../utils/schoolConfig'
import { getKcueSheetId } from '../../api/statApi'

const router = useRouter()
const { auth, adminMaskToggle, isPrivacyMasked, exportToExcel } = useStatData()
const window = globalThis.window

const kcueSheetId = ref('')

onMounted(async () => {
  kcueSheetId.value = (await getKcueSheetId()) || '1U5Vnx2x8gnXQlI3N4deyaurKxj-naZP0cRBb3lQnT4o'
})

const handleLogout = async () => {
  await auth.logout()
  router.push('/login')
}
</script>
