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
          <div class="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            <Settings :size="18" />
          </div>
          <div class="flex flex-col leading-tight">
            <span class="text-[11px] font-extrabold text-blue-600 tracking-tight">{{ schoolName }}</span>
            <span class="text-sm font-bold text-slate-900">통합 시스템 설정</span>
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
      <nav class="flex-1 overflow-y-auto" style="padding: 10px 8px; display: flex; flex-direction: column; gap: 4px;">
        <button
          v-for="item in menus"
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
            fontWeight: active === item.key ? '700' : '400',
            color: active === item.key ? '#0f172a' : '#64748b',
            background: active === item.key ? '#f1f5f9' : 'transparent',
          }"
        >
          <span class="relative shrink-0 flex">
            <component :is="item.icon" :size="20" :style="{ color: active === item.key ? '#0f172a' : '#64748b' }" />
          </span>
          <span v-if="!collapsed" class="whitespace-nowrap font-bold text-sm">
            {{ item.label }}
          </span>
        </button>
      </nav>

      <!-- 하단 사용자 카드 & 액션 버튼 -->
      <div class="p-3 border-t border-slate-200 shrink-0 bg-slate-50/50">
        <!-- 접힘 아바타 -->
        <div v-if="collapsed" class="flex justify-center py-1">
          <div class="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
            설
          </div>
        </div>
        <!-- 펼침 -->
        <div v-else class="space-y-3">
          <!-- 사용자 정보 -->
          <div class="px-0.5">
            <p class="text-sm font-bold text-slate-900 m-0 leading-tight">관리자</p>
            <p class="text-xs text-slate-500 font-medium m-0 mt-0.5">시스템 관리자</p>
          </div>

          <!-- 액션 버튼 -->
          <div class="pt-2 border-t border-slate-200/80 flex flex-col gap-1.5">
            <button
              @click="showPwModal = true"
              class="w-full text-left text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 py-1 transition-colors cursor-pointer bg-transparent border-none"
            >
              <KeyRound :size="14" /> 비밀번호 변경
            </button>
            <button
              @click="goToPortal"
              class="w-full text-left text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 py-1 transition-colors cursor-pointer bg-transparent border-none"
            >
              <Home :size="14" /> 포털 (메인 선택)
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
          <h1 class="text-base font-bold text-slate-900 m-0">시스템 설정</h1>
          <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
            관리자 전용
          </span>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs font-bold text-slate-500">{{ schoolName }}</span>
          <button
            @click="goToPortal"
            class="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 transition-all cursor-pointer flex items-center gap-1"
          >
            <Home :size="13" /> 포털로 가기
          </button>
        </div>
      </header>

      <div class="flex-1 min-h-0 flex flex-col overflow-y-auto" style="scrollbar-gutter: stable;">
        <Transition name="tab-fade" mode="out-in">
          <div :key="active" class="flex-1 flex flex-col min-h-0">
            <Suspense v-if="currentTab">
              <component :is="currentTab" />
            </Suspense>
            <div v-else class="flex items-center justify-center" style="height: 320px;">
              <p class="text-base" style="color: #94a3b8;">탭 로딩 중...</p>
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
            <label class="block text-sm font-medium mb-1.5" style="color: #64748b;">현재 비밀번호</label>
            <input
              v-model="currentPw"
              type="password"
              autocomplete="current-password"
              class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; box-sizing: border-box;"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: #64748b;">새 비밀번호</label>
            <input
              v-model="newPw"
              type="password"
              autocomplete="new-password"
              class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; box-sizing: border-box;"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: #64748b;">새 비밀번호 확인</label>
            <input
              v-model="confirmPw"
              type="password"
              autocomplete="new-password"
              class="w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; box-sizing: border-box;"
            />
          </div>
          <p v-if="pwError" class="text-xs" style="color: #ef4444; margin: 0;">{{ pwError }}</p>
        </div>
        <div class="flex gap-2">
          <button
            @click="handlePwCancel"
            class="flex-1 text-sm font-medium rounded-lg transition-colors cursor-pointer"
            style="padding: 10px; border: 1px solid #e2e8f0; background: #f8fafc; color: #64748b;"
          >
            취소
          </button>
          <button
            @click="handlePwChange"
            :disabled="pwLoading"
            class="flex-1 text-sm font-medium rounded-lg text-white transition-colors cursor-pointer"
            style="padding: 10px; border: none; background: #2563eb;"
          >
            {{ pwLoading ? '변경 중…' : '변경' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, defineAsyncComponent, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { schoolName, fetchSchoolName } from '../utils/schoolConfig'
import { changeAdminPassword } from '../api/admin'
import { dialog } from '../components/common/dialog'
import {
  UserCheck,
  Users,
  Settings,
  ChevronRight,
  Menu,
  Home,
  LogOut,
  KeyRound
} from 'lucide-vue-next'

const router = useRouter()
const auth = useAuthStore()

// ── 탭 컴포넌트 ──────────────────────────────────────────────
const ApprovalTab = defineAsyncComponent(() => import('../components/teacher/ApprovalTab.vue'))
const StudentsTab = defineAsyncComponent(() => import('../components/admin/StudentsTab.vue'))
const SettingsTab = defineAsyncComponent(() => import('../components/admin/SettingsTab.vue'))

const menus = [
  { key: 'approval', label: '가입 승인', icon: UserCheck },
  { key: 'students', label: '학생 관리', icon: Users },
  { key: 'settings', label: '환경 설정', icon: Settings },
]

const active = ref('approval')
const collapsed = ref(false)

const currentTab = computed(() => {
  if (active.value === 'approval') return ApprovalTab
  if (active.value === 'students') return StudentsTab
  if (active.value === 'settings') return SettingsTab
  return null
})

// ── 비밀번호 변경 ─────────────────────────────────────────────
const showPwModal = ref(false)
const currentPw = ref('')
const newPw = ref('')
const confirmPw = ref('')
const pwError = ref('')
const pwLoading = ref(false)

function handlePwCancel() {
  showPwModal.value = false
  currentPw.value = ''
  newPw.value = ''
  confirmPw.value = ''
  pwError.value = ''
}

async function handlePwChange() {
  pwError.value = ''
  if (!currentPw.value) {
    pwError.value = '현재 비밀번호를 입력해주세요.'
    return
  }
  if (!newPw.value || newPw.value.length < 8) {
    pwError.value = '새 비밀번호는 8자 이상이어야 합니다.'
    return
  }
  if (newPw.value !== confirmPw.value) {
    pwError.value = '새 비밀번호가 일치하지 않습니다.'
    return
  }

  pwLoading.value = true
  try {
    await changeAdminPassword(currentPw.value, newPw.value)
    handlePwCancel()
    await dialog.alert({ title: '성공', message: '비밀번호가 변경되었습니다.' })
  } catch (e) {
    pwError.value = e.message || '비밀번호 변경에 실패했습니다.'
  } finally {
    pwLoading.value = false
  }
}

function goToPortal() {
  router.push('/select-system')
}

async function logout() {
  await auth.logout()
  router.push('/login')
}

onMounted(() => {
  fetchSchoolName()
})
</script>

<style scoped>
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 0.15s ease;
}
.tab-fade-enter-from,
.tab-fade-leave-to {
  opacity: 0;
}
</style>
