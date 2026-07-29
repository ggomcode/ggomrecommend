<template>
  <div class="flex h-screen overflow-hidden" style="background: #eeecea;">

    <!-- 사이드바 -->
    <aside
      class="flex flex-col flex-shrink-0 bg-white overflow-hidden"
      :style="{
        width: collapsed ? '64px' : '240px',
        borderRight: '1px solid #d4d0cc',
        transition: 'width 0.2s ease',
      }"
    >
      <!-- 로고 + 접기 버튼 -->
      <div
        class="flex items-center flex-shrink-0"
        :style="{
          height: '60px',
          borderBottom: '1px solid #f1f5f9',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '0' : '0 14px 0 16px',
        }"
      >
        <div v-if="!collapsed" class="flex items-center gap-2 whitespace-nowrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
          <span class="text-base font-bold" style="color: #1e293b;">학교장추천 선발 시스템</span>
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
            v-model.number="selectedGrade"
            class="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-md p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
            @change="onGradeChange"
          >
            <option :value="''">학년</option>
            <option v-for="g in availableGrades" :key="g" :value="g">{{ g === 0 ? '졸업생' : g + '학년' }}</option>
          </select>
          <select
            v-if="selectedGrade !== 0"
            v-model.number="selectedClassNo"
            :disabled="!selectedGrade"
            class="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-md p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50 bg-white"
          >
            <option :value="0">전체반</option>
            <option v-for="c in availableClassNos" :key="c" :value="c">{{ c }}반</option>
          </select>
        </div>
      </div>

      <!-- 메뉴 내비게이션 -->
      <nav class="flex-1 overflow-y-auto" style="padding: 10px 8px; display: flex; flex-direction: column; gap: 2px;">
        <button
          v-for="item in sidebarMenus"
          :key="item.key"
          @click="active = item.key"
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
          <span class="relative flex-shrink-0 flex">
            <component :is="item.icon" :size="20" />
          </span>
          <span v-if="!collapsed" class="whitespace-nowrap">{{ item.label }}</span>
        </button>

        <div style="margin: 8px 0; border-top: 1px solid #f1f5f9;" />

        <a
          href="/manual.html"
          target="_blank"
          rel="noopener noreferrer"
          title="매뉴얼 (새 창)"
          class="w-full rounded-lg text-base transition-all duration-150"
          :style="{
            display: 'flex',
            alignItems: 'center',
            gap: collapsed ? '0' : '12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '10px 0' : '10px 14px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '400',
            color: '#64748b',
            background: 'transparent',
            textDecoration: 'none',
            boxSizing: 'border-box',
          }"
        >
          <span class="relative flex-shrink-0 flex">
            <BookOpen :size="20" />
          </span>
          <span v-if="!collapsed" class="whitespace-nowrap flex items-center gap-1">
            매뉴얼
            <ExternalLink :size="14" />
          </span>
        </a>
      </nav>

      <!-- 하단 사용자 카드 -->
      <div :style="{ padding: collapsed ? '10px 8px' : '10px', flexShrink: 0, borderTop: '1px solid #e8e5e2' }">
        <!-- 접힘: 아바타 -->
        <div v-if="collapsed" class="flex justify-center items-center" style="padding: 6px 0;">
          <div
            class="flex items-center justify-center rounded-full font-bold"
            style="width: 36px; height: 36px; background: #dbeafe; color: #1d4ed8; font-size: 16px;"
          >{{ selectedGrade === 0 ? '졸' : '담' }}</div>
        </div>
        <!-- 펼침: 정보 카드 -->
        <div
          v-else
          style="background: #f5f3f0; border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 10px;"
        >
          <!-- 라운드 상태 -->
          <div class="flex items-center gap-2 pb-2" style="border-bottom: 1px solid #e8e5e2;">
            <div
              class="rounded-full flex-shrink-0"
              :style="{ width: '8px', height: '8px', background: currentRound ? '#22c55e' : '#94a3b8' }"
            />
            <span
              class="text-base font-medium whitespace-nowrap"
              :style="{ color: currentRound ? '#15803d' : '#64748b' }"
            >
              {{ currentRound ? `${currentRound.id}차 라운드 진행 중` : '진행 중인 라운드 없음' }}
            </span>
          </div>
          <!-- 사용자 정보 -->
          <div>
            <p class="text-base font-semibold whitespace-nowrap" style="margin: 0; color: #1e293b;">
              {{ auth.teacherName ? `${auth.teacherName} 선생님` : '담임교사 선생님' }}
            </p>
            <p class="text-base whitespace-nowrap" style="margin: 2px 0 0; color: #94a3b8;">{{ roleLabel }}</p>
          </div>
          <!-- 액션 버튼 -->
          <div class="flex gap-3">
            <button
              v-if="selectedGrade !== 0"
              @click="showPwModal = true"
              class="flex items-center gap-1 text-base"
              style="background: none; border: none; cursor: pointer; color: #94a3b8; padding: 0;"
            >
              <KeyRound :size="14" /> 비번변경
            </button>
            <button
              @click="logout"
              class="flex items-center gap-1 text-base"
              style="background: none; border: none; cursor: pointer; color: #94a3b8; padding: 0;"
            >
              <LogOut :size="14" /> 로그아웃
            </button>
          </div>
        </div>
      </div>
    </aside>

    <!-- 메인 콘텐츠 -->
    <main class="flex-1 overflow-y-auto" style="scrollbar-gutter: stable;">
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
import { ref, computed, defineAsyncComponent, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { teacherChangePassword, getCurrentRound } from '../api/teacher.js'
import { dialog } from '../components/common/dialog.js'
import { LayoutGrid, UserPlus, Trophy, ChevronRight, LogOut, KeyRound, Menu, BookOpen, ExternalLink, UserCheck } from 'lucide-vue-next'
import { supabase } from '../utils/supabaseClient'

const router = useRouter()
const auth   = useAuthStore()

// ── 학급 선택 상태 및 저장 ────────────────────────────────────
const LS_GRADE = 'teacher_selected_grade'
const LS_CLASS = 'teacher_selected_class'

// 최초 접속 시 무조건 3학년 전체반(classNo = 0)이 디폴트로 선택되도록 초기화
const selectedGrade = ref(3)
const selectedClassNo = ref(0)

localStorage.setItem(LS_GRADE, '3')
localStorage.setItem(LS_CLASS, '0')

const classes = ref([])
const classesLoading = ref(false)
const maxClassCount = ref(Number(localStorage.getItem('pcm_class_count')) || 11)

// 3학년(디폴트)과 졸업생(0)만 드롭다운에 노출
const availableGrades = computed(() => [3, 0])

const isGraduated = computed(() => selectedGrade.value === 0)

const availableClassNos = computed(() => {
  if (selectedGrade.value === '' || isGraduated.value) return []
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
      .from('profiles')
      .select('grade, class_no')
      .eq('role', 'student')
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
const ClassTab       = defineAsyncComponent(() => import('../components/teacher/ClassTab.vue'))
const ApplicationTab = defineAsyncComponent(() => import('../components/teacher/ApplicationTab.vue'))
const ApprovalTab    = defineAsyncComponent(() => import('../components/teacher/ApprovalTab.vue'))
const ResultsTab     = defineAsyncComponent(() => import('../components/teacher/ResultsTab.vue'))

// ── 메뉴 정의 ────────────────────────────────────────────────
const sidebarMenus = [
  { key: 'class',       label: '학급 관리',   icon: LayoutGrid },
  { key: 'application', label: '지원자 등록', icon: UserPlus },
  { key: 'approval',    label: '가입 승인',   icon: UserCheck },
  { key: 'results',     label: '라운드 결과', icon: Trophy },
]

// ── 활성 탭 ──────────────────────────────────────────────────
const active = ref('class')

const currentTab = computed(() => {
  if (active.value === 'class')       return ClassTab
  if (active.value === 'application') return ApplicationTab
  if (active.value === 'approval')    return ApprovalTab
  return ResultsTab
})

const currentMenuItem = computed(() => sidebarMenus.find(m => m.key === active.value))

// ── 사이드바 접기 ─────────────────────────────────────────────
const collapsed = ref(false)

// ── 역할 레이블 ───────────────────────────────────────────────
const roleLabel = computed(() => {
  if (selectedGrade.value === 0) return '졸업생 담당'
  if (selectedGrade.value === '') return '학급 미선택'
  if (selectedClassNo.value === 0 || !selectedClassNo.value) return '3학년 전체 학급'
  return `${selectedGrade.value}학년 ${selectedClassNo.value}반 담임`
})

// ── 현재 라운드 ───────────────────────────────────────────────
const currentRound = ref(null)

onMounted(async () => {
  await fetchClasses()
  try {
    currentRound.value = await getCurrentRound()
  } catch {
    currentRound.value = null
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
