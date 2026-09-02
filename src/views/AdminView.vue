<template>
  <div class="flex h-screen overflow-hidden" style="background: #eeecea;">

    <!-- 사이드바 -->
    <aside
      class="flex flex-col shrink-0 bg-white overflow-hidden"
      :style="{
        width: collapsed ? '64px' : '240px',
        borderRight: '1px solid #d4d0cc',
        transition: 'width 0.2s ease',
      }"
    >
      <!-- 로고 + 접기 버튼 -->
      <div
        class="flex items-center shrink-0"
        :style="{
          height: '60px',
          borderBottom: '1px solid #f1f5f9',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '0' : '0 14px 0 16px',
        }"
      >
        <div v-if="!collapsed" class="flex items-center gap-2 whitespace-nowrap">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
          <div class="flex flex-col leading-tight">
            <span class="text-[11px] font-extrabold text-blue-600 tracking-tight">{{ schoolName }}</span>
            <span class="text-sm font-bold text-slate-900">학교장추천전형 시스템</span>
          </div>
        </div>
        <button
          @click="collapsed = !collapsed"
          class="flex items-center justify-center p-1.5 rounded-md"
          style="background: none; border: none; cursor: pointer; color: #94a3b8;"
        >
          <ChevronRight v-if="collapsed" :size="18" />
          <Menu v-else :size="18" />
        </button>
      </div>

      <!-- 메뉴 내비게이션 -->
      <nav class="flex-1 overflow-y-auto" style="padding: 10px 8px; display: flex; flex-direction: column; gap: 2px;">
        <!-- 주 메뉴 -->
        <button
          v-for="item in mainMenus"
          :key="item.key + (item.isRed ? '_red' : '')"
          @click="handleMenuClick(item)"
          :title="item.label"
          class="w-full rounded-lg text-base transition-all duration-150"
          :style="{
            display: 'flex',
            alignItems: 'center',
            gap: collapsed ? '0' : '12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '10px 0' : '10px 14px',
            border: item.isRed ? (active === item.key && showAbandonOnly ? '2px solid #ef4444' : '1px solid #fecdd3') : 'none',
            cursor: 'pointer',
            fontWeight: (active === item.key && (item.key !== 'rounds' || (item.isRed ? showAbandonOnly : !showAbandonOnly))) || item.isRed ? '700' : '400',
            color: item.isRed ? '#e11d48' : (active === item.key && (item.key !== 'rounds' || !showAbandonOnly) ? '#1d4ed8' : '#64748b'),
            background: item.isRed ? '#fff1f2' : (active === item.key && (item.key !== 'rounds' || !showAbandonOnly) ? '#eff6ff' : 'transparent'),
          }"
        >
          <span class="relative shrink-0 flex">
            <component :is="item.icon" :size="20" :style="{ color: item.isRed ? '#e11d48' : undefined }" />
            <span
              v-if="item.isRed && collapsed"
              class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow"
            >
              {{ item.count }}
            </span>
          </span>
          <span v-if="!collapsed" class="whitespace-nowrap flex items-center justify-between w-full">
            <span :class="{ 'text-rose-600 font-extrabold': item.isRed }">{{ item.isRed ? '🚨 ' + item.label : item.label }}</span>
            <span
              v-if="item.isRed"
              class="ml-auto text-xs font-extrabold bg-rose-600 text-white px-2 py-0.5 rounded-full shadow-xs"
            >
              {{ item.count }}건
            </span>
          </span>
        </button>

        <!-- 하단 서브 메뉴 -->
        <template v-if="subMenus.length > 0">
          <div style="margin: 8px 0; border-top: 1px solid #f1f5f9;" />
          <button
            v-for="item in subMenus"
            :key="item.key"
            @click="handleMenuClick(item)"
            :title="item.label"
            class="w-full rounded-lg text-base transition-all duration-150"
            :style="{
              display: 'flex',
              alignItems: 'center',
              gap: collapsed ? '0' : '12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '10px 0' : '10px 14px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: active === item.key ? '600' : '400',
              color: active === item.key ? '#1d4ed8' : '#64748b',
              background: active === item.key ? '#eff6ff' : 'transparent',
            }"
          >
            <span class="relative shrink-0 flex">
              <component :is="item.icon" :size="20" />
            </span>
            <template v-if="!collapsed">
              <span class="whitespace-nowrap">{{ item.label }}</span>
            </template>
          </button>
        </template>
      </nav>

      <!-- 하단 사용자 카드 & 라운드 상태/시스템 전환 -->
      <div class="p-3 border-t border-slate-200 shrink-0 bg-slate-50/50">
        <!-- 접힘: 아바타 -->
        <div v-if="collapsed" class="flex justify-center py-1">
          <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
            관
          </div>
        </div>
        <!-- 펼침 -->
        <div v-else class="space-y-3">
          <!-- 라운드 상태 배지 -->
          <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
            <div
              class="w-2 h-2 rounded-full shrink-0"
              :style="{ background: getRoundStatusColor() }"
            />
            <span
              class="text-xs font-semibold whitespace-nowrap truncate"
              :style="{ color: getRoundStatusTextColor() }"
            >
              {{ getRoundStatusText() }}
            </span>
          </div>

          <!-- 사용자 정보 -->
          <div class="px-0.5">
            <p class="text-sm font-bold text-slate-900 m-0 leading-tight">관리자</p>
            <p class="text-xs text-slate-500 font-medium m-0 mt-0.5">시스템 관리자</p>
          </div>

          <!-- 액션 버튼 -->
          <div class="pt-2 border-t border-slate-200/80 flex flex-col gap-1.5">
            <button
              v-if="isRuralSystemEnabled"
              @click="switchToRuralSystem"
              class="w-full text-left text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1.5 py-1 transition-colors cursor-pointer bg-transparent border-none"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
              농어촌 전형 시스템
            </button>
            <button
              @click="goToPortal"
              class="w-full text-left text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 py-1 transition-colors cursor-pointer bg-transparent border-none"
            >
              <Home :size="14" /> 포털 (시스템 선택)
            </button>
            <button
              @click="logout"
              class="w-full text-left text-xs font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1.5 py-1 transition-colors cursor-pointer bg-transparent border-none"
            >
              <LogOut :size="14" /> 로그아웃
            </button>
          </div>
        </div>
      </div>
    </aside>

    <!-- 메인 콘텐츠 -->
    <main class="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden bg-slate-100">
      <!-- 상단 헤더 배너 (고정) -->
      <header class="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0 shadow-2xs no-print">
        <div class="flex items-center gap-2">
          <h1 class="text-base font-bold text-slate-900 m-0">학교장 추천자 선발 시스템</h1>
          <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            지역균형 포함
          </span>
        </div>
        <div class="text-xs font-bold text-slate-500">
          {{ schoolName }}
        </div>
      </header>

      <div class="flex-1 min-h-0 flex flex-col overflow-y-auto" style="scrollbar-gutter: stable;">
        <!-- 탭 전환 페이드. key를 active로 잡아야 탭이 바뀔 때 트랜지션이 걸린다 -->
        <Transition name="tab-fade" mode="out-in">
          <div :key="active" class="flex-1 flex flex-col min-h-0">
            <Suspense v-if="currentTab">
              <component :is="currentTab" />
            </Suspense>
            <div v-else class="flex items-center justify-center" style="height: 320px;">
              <p class="text-base" style="color: #94a3b8;">{{ currentMenuItem?.label ?? '' }} 탭 준비 중</p>
            </div>
          </div>
        </Transition>
      </div>
    </main>

    <!-- 비밀번호 변경 모달 -->
    <div v-if="showPwModal" class="fixed inset-0 flex items-center justify-center z-50" style="background: rgba(0,0,0,0.35);">
      <div class="bg-white" style="border-radius: 14px; box-shadow: 0 8px 32px rgba(0,0,0,0.15); padding: 1.75rem; width: 340px;">
        <h2 class="text-lg font-semibold mb-5" style="color: #1e293b;">관리자 비밀번호 변경</h2>
        <div class="space-y-4 mb-5">
          <div>
            <label class="block text-base font-medium mb-1.5" style="color: #64748b;">현재 비밀번호</label>
            <input
              v-model="currentPw"
              type="password"
              autocomplete="current-password"
              class="w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
              style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; box-sizing: border-box;"
            />
          </div>
          <div>
            <label class="block text-base font-medium mb-1.5" style="color: #64748b;">새 비밀번호</label>
            <input
              v-model="newPw"
              type="password"
              autocomplete="new-password"
              class="w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
              style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; box-sizing: border-box;"
            />
          </div>
          <div>
            <label class="block text-base font-medium mb-1.5" style="color: #64748b;">새 비밀번호 재입력</label>
            <input
              v-model="confirmPw"
              type="password"
              autocomplete="new-password"
              class="w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
              style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; box-sizing: border-box;"
              @keyup.enter="changePw"
            />
          </div>
        </div>
        <p v-if="pwError" class="text-base text-red-500 mb-3">{{ pwError }}</p>
        <div class="flex gap-2 justify-end">
          <button
            @click="closePwModal"
            class="text-base"
            style="padding: 10px 20px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; cursor: pointer; color: #64748b;"
          >취소</button>
          <button
            :disabled="!currentPw || !newPw || !confirmPw || pwLoading"
            @click="changePw"
            class="text-base font-semibold disabled:opacity-40"
            style="padding: 10px 20px; border-radius: 8px; border: none; background: #2563eb; cursor: pointer; color: white;"
          >{{ pwLoading ? '변경 중...' : '변경' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, provide } from 'vue'
import { fetchRoundSchedulesMap, computeRoundDisplayStatus } from '../utils/roundSchedule.js'
import { supabase } from '../utils/supabaseClient'
import axios from 'axios'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { changeAdminPassword, getCurrentRound } from '../api/admin.js'
import { dialog } from '../components/common/dialog.js'
import { schoolName, fetchSchoolName } from '../utils/schoolConfig.js'
import { checkRuralSystemOpenStatus } from '../api/ruralApi.js'
import {
  Home, Trophy, LayoutGrid, Users, SlidersHorizontal, FileSpreadsheet,
  Building2, BookOpen, RefreshCw, ChevronRight, LogOut, Menu, ScrollText, Settings, UserCheck, School, FileText
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const isRuralSystemEnabled = ref(localStorage.getItem('pcm_enable_rural_system') === 'true')

// ── 탭 컴포넌트 ──────────────────────────────────────────────
import OverviewTab from '../components/admin/OverviewTab.vue'
import ApprovalTab from '../components/teacher/ApprovalTab.vue'
import RoundsTab   from '../components/admin/RoundsTab.vue'
import ClassesTab  from '../components/admin/ClassesTab.vue'
import StudentsTab from '../components/admin/StudentsTab.vue'
import GradesTab   from '../components/admin/GradesTab.vue'
import AreasTab    from '../components/admin/AreasTab.vue'
import UnivTab     from '../components/admin/UniversitiesTab.vue'
import ReportsTab  from '../components/admin/ReportsTab.vue'
import SettingsTab from '../components/admin/SettingsTab.vue'
import AuditTab    from '../components/admin/AuditTab.vue'

// ── 메뉴 정의 ────────────────────────────────────────────────
const pendingAbandonCount = ref(0)

async function fetchPendingAbandonCount() {
  if (!supabase) return
  try {
    const { data: apps, error } = await supabase
      .from('applications')
      .select('id, scanned_doc_url, is_abandoned')
      .eq('is_abandoned', false)
      .not('scanned_doc_url', 'is', null)

    if (error || !apps) return

    let count = 0
    apps.forEach(ap => {
      if (ap.scanned_doc_url) {
        try {
          const parsed = JSON.parse(ap.scanned_doc_url)
          if (parsed && parsed.abandon_requested === true) {
            count++
          }
        } catch {}
      }
    })
    pendingAbandonCount.value = count
  } catch (e) {
    console.error('Error fetching pending abandon count:', e)
  }
}

const mainMenus = computed(() => {
  const menus = [
    { key: 'home',     label: '개요',          icon: Home },
    { key: 'classes',  label: '학급 현황',     icon: School },
    { key: 'univs',    label: '대학 설정',     icon: Building2 },
    { key: 'areas',    label: '추천순위 기준 설정', icon: SlidersHorizontal },
    { key: 'rounds',   label: '학교장 추천 선발', icon: Trophy },
  ]
  if (pendingAbandonCount.value > 0) {
    menus.splice(4, 0, {
      key: 'rounds',
      label: '포기원 접수확인',
      icon: FileText,
      isRed: true,
      count: pendingAbandonCount.value
    })
  }
  menus.push(
    { key: 'reports',  label: '결과 보고서',   icon: ScrollText },
    { key: 'audit',    label: '감사 기록',     icon: BookOpen }
  )
  return menus
})

const hasUpdate = ref(false)

const subMenus = computed(() => [])

const allMenus = computed(() => mainMenus.value)

// ── 활성 탭 ──────────────────────────────────────────────────
const active = ref('home')
const showAbandonOnly = ref(false)
provide('showAbandonOnly', showAbandonOnly)

function handleMenuClick(item) {
  active.value = item.key
  if (item.key === 'rounds') {
    showAbandonOnly.value = item.isRed === true
  } else {
    showAbandonOnly.value = false
  }
}

const currentTab = computed(() => {
  if (active.value === 'home')     return OverviewTab
  if (active.value === 'classes')  return ClassesTab
  if (active.value === 'areas')    return AreasTab
  if (active.value === 'univs')    return UnivTab
  if (active.value === 'rounds')   return RoundsTab
  if (active.value === 'reports')  return ReportsTab
  if (active.value === 'audit')    return AuditTab
  return null
})

const currentMenuItem = computed(() => allMenus.value.find(m => m.key === active.value))

// ── 사이드바 접기 ─────────────────────────────────────────────
const collapsed = ref(false)

// ── 현재 라운드 ───────────────────────────────────────────────
const currentRound = ref(null)

const schedulesMap = ref({})

const getEffectiveStatus = () => {
  if (!currentRound.value) return 'DRAFT'
  const sched = schedulesMap.value[currentRound.value.id]
  return computeRoundDisplayStatus(currentRound.value, sched)
}

const getRoundStatusText = () => {
  if (!currentRound.value) return '진행 중인 추천 선발 없음'
  const statusLabels = {
    DRAFT: '접수 전',
    OPEN: '접수 진행중',
    CLOSED: '심사 진행중',
    FINALIZED: '최종 마감'
  }
  const status = getEffectiveStatus()
  const label = statusLabels[status] || '진행중'
  return getTotalRoundsCount() === 1 ? `추천 선발 (${label})` : `${currentRound.value.id}차 추천 선발 (${label})`
}

const getRoundStatusColor = () => {
  if (!currentRound.value) return '#94a3b8'
  const colors = {
    DRAFT: '#eab308',
    OPEN: '#22c55e',
    CLOSED: '#3b82f6',
    FINALIZED: '#64748b'
  }
  const status = getEffectiveStatus()
  return colors[status] || '#22c55e'
}

const getRoundStatusTextColor = () => {
  if (!currentRound.value) return '#64748b'
  const colors = {
    DRAFT: '#b45309',
    OPEN: '#15803d',
    CLOSED: '#1d4ed8',
    FINALIZED: '#475569'
  }
  const status = getEffectiveStatus()
  return colors[status] || '#15803d'
}

const getTotalRoundsCount = () => {
  const local = localStorage.getItem('total_rounds')
  if (local) {
    const n = parseInt(local, 10)
    if (n >= 1 && n <= 5) return n
  }
  return 3
}


async function refreshRound() {
  fetchPendingAbandonCount()
  try {
    schedulesMap.value = await fetchRoundSchedulesMap()
    currentRound.value = await getCurrentRound()
  } catch {
    currentRound.value = null
  }
}

provide('refreshRound', refreshRound)
provide('setActiveTab', (key) => { active.value = key })

function stripV(v) {
  return (v ?? '').replace(/^v/i, '').trim()
}

onMounted(async () => {
  try {
    const status = await checkRuralSystemOpenStatus()
    isRuralSystemEnabled.value = status.isEnabled === true
  } catch (e) {}
  if (route.query.tab) {
    active.value = route.query.tab
  }
  fetchSchoolName()
  await refreshRound()
})

watch(() => route.query.tab, (newTab) => {
  if (newTab) {
    active.value = newTab
  }
})

// ── 비밀번호 변경 ─────────────────────────────────────────────
const showPwModal = ref(false)
const currentPw = ref('')
const newPw = ref('')
const confirmPw = ref('')
const pwError = ref('')
const pwLoading = ref(false)

function closePwModal() {
  showPwModal.value = false
  currentPw.value = ''
  newPw.value = ''
  confirmPw.value = ''
  pwError.value = ''
}

async function changePw() {
  if (!currentPw.value || !newPw.value || !confirmPw.value) return
  if (newPw.value.length < 8) {
    pwError.value = '새 비밀번호는 8자 이상이어야 합니다.'
    return
  }
  if (newPw.value !== confirmPw.value) {
    pwError.value = '새 비밀번호가 일치하지 않습니다.'
    return
  }
  pwLoading.value = true
  pwError.value = ''
  try {
    await changeAdminPassword(currentPw.value, newPw.value)
    closePwModal()
    await dialog.alert({ title: '완료', message: '비밀번호가 변경되었습니다.' })
  } catch (e) {
    pwError.value = e.response?.data || e.message
  } finally {
    pwLoading.value = false
  }
}

// 시스템 전환 및 이동
function goToPortal() {
  router.push('/select-system')
}
function switchToRuralSystem() {
  router.push('/rural')
}

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
/* 탭 전환이 뚝 끊겨 보이지 않도록 아주 짧은 페이드만 준다.
   나가는 쪽을 더 짧게 잡아야 클릭 반응이 굼떠 보이지 않는다. */
.tab-fade-enter-active { transition: opacity 0.18s ease; }
.tab-fade-leave-active { transition: opacity 0.1s ease; }
.tab-fade-enter-from,
.tab-fade-leave-to { opacity: 0; }
</style>
