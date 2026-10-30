<template>
  <header class="bg-white border-b border-slate-200 px-3 sm:px-5 py-2.5 flex items-center justify-between shrink-0 shadow-2xs no-print select-none">
    <!-- Left: Current Active Tab Title & Year/Scope Selector Toolbar -->
    <div class="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
      <div class="flex items-center gap-2 shrink-0">
        <component 
          v-if="currentTabItem?.iconComponent" 
          :is="currentTabItem.iconComponent" 
          class="w-5 h-5 text-blue-600 shrink-0" 
        />
        <h1 class="text-sm sm:text-base font-bold text-slate-900 m-0 leading-none truncate">
          {{ currentTabItem?.name || '대입 통계 시스템' }}
        </h1>
        <span 
          v-if="currentTabItem?.badge" 
          class="hidden sm:inline-block text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 border border-blue-200"
        >
          {{ currentTabItem.badge }}
        </span>
      </div>

      <div class="h-4 w-px bg-slate-200 hidden md:block"></div>

      <!-- 통합 학년도 & 모집범위 & 새로고침 툴바 -->
      <div class="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50/90 p-0.5 shadow-2xs shrink-0">
        <!-- 1. 학년도 선택 드롭다운 -->
        <div class="relative">
          <select
            :value="selectedAcademicYear"
            :disabled="isLoadingYearData"
            @change="e => handleYearChange(e.target.value)"
            class="appearance-none pl-2 pr-5 py-1 rounded-md text-xs font-black bg-white text-amber-950 border border-amber-200/80 shadow-2xs hover:border-amber-400 focus:outline-none cursor-pointer disabled:opacity-60 transition-colors"
            title="대입 학년도 선택"
          >
            <option v-for="y in availableAcademicYears" :key="y" :value="y">
              {{ y }}학년도
            </option>
          </select>
          <svg class="w-3 h-3 text-amber-700 pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        <span class="w-px h-3.5 bg-slate-300 mx-1"></span>

        <!-- 2. 모집시기 및 대학구분 드롭다운 -->
        <div class="relative">
          <select
            :value="selectedScope"
            :disabled="isLoadingYearData"
            @change="e => handleScopeChange(e.target.value)"
            class="appearance-none pl-2 pr-5 py-1 rounded-md text-xs font-bold bg-transparent text-indigo-950 hover:bg-white/80 border-none focus:outline-none cursor-pointer disabled:opacity-60 transition-colors"
            title="모집시기 및 대학구분 선택"
          >
            <option v-for="opt in scopeOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
          <svg class="w-3 h-3 text-indigo-700 pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        <span class="w-px h-3.5 bg-slate-300 mx-1"></span>

        <!-- 3. 실시간 새로고침 버튼 / 로딩 스피너 -->
        <div v-if="isLoadingYearData" class="flex items-center px-1.5 text-amber-600 animate-pulse" title="데이터 연동 중…">
          <svg class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
        </div>
        <button
          v-else
          @click="reloadCurrentYear"
          title="구글 시트에서 최신 원자료 다시 불러오기"
          class="p-1 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-white cursor-pointer transition-colors border-none bg-transparent"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Right: 간결하게 정돈된 액션 컨트롤 -->
    <div class="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
      <!-- 1. 관리자/교사 미니 배지 -->
      <div 
        class="hidden lg:flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-xs font-bold text-slate-700 select-none"
        :title="auth.isAdmin ? '시스템 관리자 권한' : (auth.isGuest ? '게스트 권한' : '교과 교사 권한')"
      >
        <span>{{ auth.isAdmin ? '👑' : (auth.isGuest ? '🔑' : '👨‍🏫') }}</span>
        <span>{{ auth.isAdmin ? '관리자' : (auth.isGuest ? '게스트' : (auth.teacherName || '교사')) }}</span>
      </div>

      <!-- 2. 개인정보 마스킹 컴팩트 토글 버튼 -->
      <div 
        v-if="!auth.isAdmin" 
        class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-900 border border-amber-200 select-none shadow-2xs" 
        :title="auth.isGuest ? '게스트 모드: **동 고정' : '교사 모드: 학생 개인정보 보호를 위해 맨 뒷글자만 표시되는 기본 마스킹(**동)으로 고정됩니다.'"
      >
        <span>🔒</span>
        <span>**동</span>
      </div>

      <button 
        v-else-if="auth.isAdmin"
        @click="cycleAdminMaskMode"
        :class="[
          'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all duration-150 border cursor-pointer shadow-2xs select-none',
          adminMaskMode === 0 
            ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100' 
            : adminMaskMode === 1
            ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
            : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
        ]"
        :title="adminMaskTooltip"
      >
        <span>{{ adminMaskMode === 0 ? '🔒' : (adminMaskMode === 1 ? '🔓' : '👁️') }}</span>
        <span>{{ adminMaskLabel }}</span>
        <span class="text-[9px] px-1 py-0.2 rounded font-black bg-white border border-current">
          {{ adminMaskMode === 0 ? '1단' : (adminMaskMode === 1 ? '2단' : '3단') }}
        </span>
      </button>

      <!-- 3. [통합 데이터 관리] 원클릭 드롭다운 (구글시트 + 탭관리 + 엑셀 + 인쇄) -->
      <div v-if="auth.isAdmin" class="relative group">
        <button 
          type="button"
          class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer shadow-2xs"
        >
          <svg class="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>데이터 관리</span>
          <svg class="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div class="absolute right-0 mt-1 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
          <a 
            :href="`https://docs.google.com/spreadsheets/d/${kcueSheetId}/edit`" 
            target="_blank" 
            class="flex items-center px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors no-underline"
          >
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2.5 shrink-0"></span>
            <div class="truncate">
              <div class="font-bold text-slate-800">대교협 구글 시트</div>
              <div class="text-[10px] text-slate-400">수시·정시 원자료 시트 새 창 열기</div>
            </div>
          </a>

          <button
            type="button"
            @click="isYearSheetModalOpen = true"
            class="w-full text-left flex items-center px-3 py-2 text-xs text-indigo-700 hover:bg-indigo-50 transition-colors border-t border-slate-100 cursor-pointer border-none bg-transparent"
          >
            <span class="mr-2.5 text-sm leading-none">📑</span>
            <div class="truncate">
              <div class="font-bold text-indigo-900">대교협 시트 탭 관리</div>
              <div class="text-[10px] text-indigo-500">2027수시·정시 등 탭 연동 설정</div>
            </div>
          </button>

          <button 
            type="button"
            @click="exportToExcel()"
            class="w-full text-left flex items-center px-3 py-2 text-xs text-emerald-800 hover:bg-emerald-50 transition-colors border-t border-slate-100 cursor-pointer border-none bg-transparent"
          >
            <svg class="w-4 h-4 text-emerald-600 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div class="truncate">
              <div class="font-bold text-emerald-900">엑셀(.xlsx) 내보내기</div>
              <div class="text-[10px] text-emerald-600">현재 필터링된 데이터 다운로드</div>
            </div>
          </button>

          <button 
            type="button"
            @click="window.print()"
            class="w-full text-left flex items-center px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100 cursor-pointer border-none bg-transparent"
          >
            <svg class="w-4 h-4 text-slate-500 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <div class="truncate">
              <div class="font-bold text-slate-800">보고서 인쇄 / PDF</div>
              <div class="text-[10px] text-slate-400">현재 화면 인쇄 (Ctrl+P)</div>
            </div>
          </button>
        </div>
      </div>

      <!-- 4. 포털 복귀 버튼 -->
      <button 
        v-if="!auth.isGuest"
        @click="router.push('/select-system')"
        class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
        title="메인 포털 화면으로 이동합니다."
      >
        <svg class="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span class="hidden sm:inline">포털</span>
      </button>

      <!-- 5. 로그아웃 버튼 -->
      <button 
        v-if="!auth.isGuest"
        @click="handleLogout"
        class="hidden md:inline-flex items-center px-2 py-1 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
        title="로그아웃"
      >
        로그아웃
      </button>
    </div>

    <!-- 학년도별 대교협 시트 ID 관리 모달 -->
    <KcueYearSheetModal
      :isOpen="isYearSheetModalOpen"
      :activeCurrentYear="selectedAcademicYear"
      @close="isYearSheetModalOpen = false"
      @saved="handleSheetsSaved"
    />
  </header>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  currentTabItem: {
    type: Object,
    default: () => ({ name: '대입 통계 시스템' })
  }
})
import KcueYearSheetModal from './KcueYearSheetModal.vue'
import { useRouter } from 'vue-router'
import { useStatData } from '../composables/useStatData'
import { schoolName } from '../../utils/schoolConfig'
import { getKcueSheetId } from '../../api/statApi'

const router = useRouter()
const { 
  auth, 
  adminMaskMode,
  adminMaskToggle, 
  cycleAdminMaskMode,
  isPrivacyMasked, 
  exportToExcel, 
  selectedAcademicYear, 
  availableAcademicYears, 
  selectedScope,
  scopeOptions,
  setAcademicYear, 
  setScope,
  refreshYearSheets,
  isLoadingYearData,
  reloadCurrentYear
} = useStatData()

const adminMaskLabel = computed(() => {
  if (adminMaskMode.value === 0) return '마스킹: **동'
  if (adminMaskMode.value === 1) return '마스킹: 홍*동'
  return '이름 전체공개'
})

const adminMaskTooltip = computed(() => {
  if (adminMaskMode.value === 0) {
    return '1단계 [기본 디폴트 마스킹]: 맨 뒷글자(**동)만 표시 (2글자 이름은 ** 전체 마스킹). 클릭 시 2단계(성과 맨뒷글자 총 2개 표시: 홍*동)로 전환됩니다.'
  }
  if (adminMaskMode.value === 1) {
    return '2단계 [부분 마스킹]: 성+맨뒷글자(홍*동) 2글자 표시 중. 클릭 시 3단계(이름 전체 공개: 홍길동)로 전환됩니다.'
  }
  return '3단계 [이름 전체공개]: 모든 이름이 표시 중. 클릭 시 다시 1단계(디폴트 마스킹: **동)로 되돌아갑니다.'
})

const isYearSheetModalOpen = ref(false)

const currentScopeLabel = computed(() => {
  const opt = scopeOptions.find(o => o.value === selectedScope.value)
  return opt ? opt.label : '데이터'
})

function handleYearChange(year) {
  setAcademicYear(year)
}

function handleScopeChange(scope) {
  setScope(scope)
}

function handleSheetsSaved() {
  refreshYearSheets()
}

function goToCalendar() {
  try {
    sessionStorage.setItem('pcm_calendar_from', 'stat')
  } catch (e) {}
  router.push({ path: '/calendar', query: { from: 'stat' } })
}

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
