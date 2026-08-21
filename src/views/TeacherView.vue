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

      <!-- 학급 선택 필터 (사이드바가 열려있을 때만 노출) -->
      <div v-if="!collapsed" style="padding: 12px 14px 4px; display: flex; flex-direction: column; gap: 6px; border-bottom: 1px solid #f1f5f9;">
        <label class="block text-xs font-semibold text-slate-400">조회 학급 선택</label>
        <div style="display: flex; gap: 6px;">
          <select
            v-model="selectedGrade"
            class="flex-1 text-sm bg-white border border-slate-200 rounded-md p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
            @change="onGradeChange"
          >
            <option value="all">전체</option>
            <option :value="3">3학년</option>
            <option :value="0">졸업생</option>
          </select>
          <select
            v-model.number="selectedClassNo"
            :disabled="selectedGrade === '' || selectedGrade === 'all'"
            class="flex-1 text-sm bg-white border border-slate-200 rounded-md p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
          >
            <template v-if="selectedGrade === 'all'">
              <option :value="0">전체반</option>
            </template>
            <template v-else-if="Number(selectedGrade) === 0">
              <option :value="0">졸업생 학급</option>
            </template>
            <template v-else>
              <option :value="0">전체반</option>
              <option v-for="c in availableClassNos" :key="c" :value="c">{{ c }}반</option>
            </template>
          </select>
        </div>
      </div>

      <!-- 메뉴 내비게이션 -->
      <nav class="flex-1 overflow-y-auto" style="padding: 10px 8px; display: flex; flex-direction: column; gap: 4px;">
        <button
          v-for="item in sidebarMenus"
          :key="item.key + (item.isRed ? '_red' : '')"
          @click="active = item.key"
          :title="item.label"
          class="w-full rounded-lg text-base transition-all duration-150"
          :style="{
            display: 'flex',
            alignItems: 'center',
            gap: collapsed ? '0' : '12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '10px 0' : '10px 14px',
            border: item.isRed ? '1px solid #fecdd3' : 'none',
            cursor: 'pointer',
            fontWeight: active === item.key || item.isRed ? '700' : '400',
            color: item.isRed ? '#e11d48' : (active === item.key ? '#1d4ed8' : '#64748b'),
            background: item.isRed ? '#fff1f2' : (active === item.key ? '#eff6ff' : 'transparent'),
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
      </nav>

      <!-- 하단 사용자 카드 & 라운드 상태/시스템 전환 -->
      <div class="p-3 border-t border-slate-200 shrink-0 bg-slate-50/50">
        <!-- 접힘: 아바타 -->
        <div v-if="collapsed" class="flex justify-center py-1">
          <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
            {{ (auth.teacherName || '담').substring(0, 1) }}
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
            <p class="text-sm font-bold text-slate-900 m-0 leading-tight">
              {{ auth.teacherName ? `${auth.teacherName} 선생님` : '담임교사 선생님' }}
            </p>
            <p class="text-xs text-slate-500 font-medium m-0 mt-0.5">{{ roleLabel }}</p>
          </div>

          <!-- 액션 버튼 -->
          <div class="pt-2 border-t border-slate-200/80 flex flex-col gap-1.5">
            <button
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
          <div :key="active">
            <Suspense v-if="currentTab">
              <component :is="currentTab" :key="selectedGrade + '-' + selectedClassNo" />
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
        <h2 class="text-lg font-semibold mb-5" style="color: #1e293b;">비밀번호 변경</h2>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { teacherChangePassword, getCurrentRound } from '../api/teacher.js'
import { dialog } from '../components/common/dialog.js'
import { LayoutGrid, UserPlus, Trophy, ChevronRight, LogOut, Menu, BookOpen, ExternalLink, UserCheck, Home, FileText, Building2 } from 'lucide-vue-next'
import { supabase } from '../utils/supabaseClient'
import { schoolName, fetchSchoolName } from '../utils/schoolConfig'
import { fetchRoundSchedulesMap, computeRoundDisplayStatus } from '../utils/roundSchedule.js'

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()
const isRuralSystemEnabled = ref(localStorage.getItem('pcm_enable_rural_system') === 'true')

// ── 학급 선택 상태 및 저장 ────────────────────────────────────
const LS_GRADE = 'teacher_selected_grade'
const LS_CLASS = 'teacher_selected_class'

const savedGrade = localStorage.getItem(LS_GRADE)
const savedClass = localStorage.getItem(LS_CLASS)

const parseGrade = (val) => {
  if (val === 'all') return 'all'
  if (val !== null && val !== '' && !isNaN(val)) return Number(val)
  return null
}

const initGrade = parseGrade(savedGrade) ?? parseGrade(auth.grade) ?? 'all'
const initClass = savedClass !== null && savedClass !== '' ? Number(savedClass) : (auth.classNo !== null ? auth.classNo : 0)

const selectedGrade = ref(initGrade)
const selectedClassNo = ref(initClass)

const classes = ref([])
const classesLoading = ref(false)
const maxClassCount = ref(Number(localStorage.getItem('pcm_class_count')) || 11)

// 전체, 3학년, 졸업생(0) 드롭다운에 노출
const availableGrades = computed(() => ['all', 3, 0])

const isGraduated = computed(() => Number(selectedGrade.value) === 0)

const availableClassNos = computed(() => {
  if (selectedGrade.value === '' || selectedGrade.value === 'all' || isGraduated.value) return []
  const found = classes.value
    .filter(c => c.grade === selectedGrade.value)
    .map(c => c.class_no)
    .filter(Boolean)
    .sort((a, b) => a - b)
  
  if (found.length > 0) return [...new Set(found)]
  
  // 관리자 설정 학급 수 (기본 11반)
  const list = []
  for (let i = 1; i <= maxClassCount.value; i++) {
    list.push(i)
  }
  return list
})

function onGradeChange() {
  selectedClassNo.value = 0
}

// Supabase DB에 등록된 학생들의 학년/반 정보를 분석해 고유 학급 목록 추출
async function fetchClasses() {
  classesLoading.value = true
  try {
    if (!supabase) throw new Error('Supabase client uninitialized')

    // 관리자 설정 학급 수 가져오기 (기본 11반)
    const { data: countData } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'class_count')
      .maybeSingle()

    if (countData && countData.value) {
      maxClassCount.value = Number(countData.value) || 11
      localStorage.setItem('pcm_class_count', countData.value)
    }

    const { data, error: err } = await supabase
      .from('enrolled_students')
      .select('grade, class_no')
      .eq('is_enrolled', true)

    if (err) throw err

    if (!data || data.length === 0) {
      const defaultClasses = [{ grade: 0, class_no: 0 }]
      for (let c = 1; c <= maxClassCount.value; c++) {
        defaultClasses.push({ grade: 3, class_no: c })
      }
      classes.value = defaultClasses
    } else {
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
      classes.value = uniqueClasses.sort((a, b) => a.grade - b.grade || a.class_no - b.class_no)
    }
  } catch (e) {
    console.error('Error fetching classes:', e)
    const defaultClasses = [{ grade: 0, class_no: 0 }]
    for (let c = 1; c <= maxClassCount.value; c++) {
      defaultClasses.push({ grade: 3, class_no: c })
    }
    classes.value = defaultClasses
  } finally {
    classesLoading.value = false
  }
}

// auth store와 동기화
watch([selectedGrade, selectedClassNo], ([g, c]) => {
  auth.grade = g === '' ? null : g
  auth.classNo = c === '' ? null : c
  localStorage.setItem(LS_GRADE, g)
  localStorage.setItem(LS_CLASS, c)
}, { immediate: true })

// ── 탭 컴포넌트 ──────────────────────────────────────────────
import ClassTab       from '../components/teacher/ClassTab.vue'
import ApplicationTab from '../components/teacher/ApplicationTab.vue'
import ResultsTab     from '../components/teacher/ResultsTab.vue'
import ReportsTab     from '../components/admin/ReportsTab.vue'

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

const sidebarMenus = computed(() => {
  const menus = [
    { key: 'class',       label: '학급 관리',   icon: LayoutGrid },
    { key: 'application', label: '지원자 등록', icon: UserPlus },
    { key: 'results',     label: '추천 결과',   icon: Trophy },
    { key: 'reports',     label: '결과 보고서', icon: BookOpen },
  ]
  if (pendingAbandonCount.value > 0) {
    menus.splice(2, 0, {
      key: 'results',
      label: '포기원 접수확인',
      icon: FileText,
      isRed: true,
      count: pendingAbandonCount.value
    })
  }
  return menus
})

// ── 활성 탭 ──────────────────────────────────────────────────
const active = ref('class')

const currentTab = computed(() => {
  if (active.value === 'class')       return ClassTab
  if (active.value === 'application') return ApplicationTab
  if (active.value === 'reports')     return ReportsTab
  return ResultsTab
})

const currentMenuItem = computed(() => sidebarMenus.value.find(m => m.key === active.value))

// ── 사이드바 접기 ─────────────────────────────────────────────
const collapsed = ref(false)

// ── 역할 레이블 ───────────────────────────────────────────────
const roleLabel = computed(() => {
  if (selectedGrade.value === 'all') return '전체 학급 조회'
  if (Number(selectedGrade.value) === 0) return '졸업생 학급 담임'
  if (selectedGrade.value === '') return '학급 미선택'
  if (Number(selectedClassNo.value) === 0 || !selectedClassNo.value) return `${selectedGrade.value}학년 전체 학급`
  return `${selectedGrade.value}학년 ${selectedClassNo.value}반 담임`
})

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


onMounted(async () => {
  if (route.query.tab) {
    active.value = route.query.tab
  }
  fetchSchoolName()
  await fetchClasses()
  fetchPendingAbandonCount()
  try {
    schedulesMap.value = await fetchRoundSchedulesMap()
    currentRound.value = await getCurrentRound()
  } catch {
    currentRound.value = null
  }
})

watch(() => route.query.tab, (newTab) => {
  if (newTab) {
    active.value = newTab
  }
})

// ── 비밀번호 변경 ─────────────────────────────────────────────
const showPwModal = ref(false)
const currentPw   = ref('')
const newPw       = ref('')
const confirmPw   = ref('')
const pwError     = ref('')
const pwLoading   = ref(false)

function closePwModal() {
  showPwModal.value = false
  currentPw.value   = ''
  newPw.value       = ''
  confirmPw.value   = ''
  pwError.value     = ''
}

async function changePw() {
  if (!currentPw.value || !newPw.value || !confirmPw.value) return
  if (newPw.value.length < 4) {
    pwError.value = '새 비밀번호는 4자 이상이어야 합니다.'
    return
  }
  if (newPw.value !== confirmPw.value) {
    pwError.value = '새 비밀번호가 일치하지 않습니다.'
    return
  }
  pwLoading.value = true
  pwError.value   = ''
  try {
    await teacherChangePassword(currentPw.value, newPw.value)
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

// 로그아웃
function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
/* 탭 전환이 뚝 끊겨 보이지 않도록 아주 짧은 페이드만 준다 (AdminView와 동일). */
.tab-fade-enter-active { transition: opacity 0.18s ease; }
.tab-fade-leave-active { transition: opacity 0.1s ease; }
.tab-fade-enter-from,
.tab-fade-leave-to { opacity: 0; }
</style>
