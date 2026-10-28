import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { checkRuralSystemOpenStatus } from '../api/ruralApi.js'
import { checkExamIntentSystemEnabled } from '../api/examIntentApi.js'
import { checkJuniorCollegeSystemEnabled } from '../api/juniorCollegeApi.js'
import { isKcueStatSystemEnabled } from '../api/statApi.js'
import { isModuleSecretAccessEnabled, getModuleIdByPath, MODULE_ROUTE_MAP } from '../api/suiteModulesApi.js'

const routes = [
  { path: '/', redirect: '/login' },
  {
    path: '/server-error',
    component: () => import('../views/ServerErrorView.vue'),
  },
  {
    path: '/welcome',
    component: () => import('../views/WelcomeView.vue'),
  },
  {
    path: '/login',
    component: () => import('../views/LoginView.vue'),
    beforeEnter: (to) => {
      const auth = useAuthStore()
      if (to.query.error === 'secret_closed') return true
      if (auth.isGuest && auth.guestModule) {
        return MODULE_ROUTE_MAP[auth.guestModule] || '/stat'
      }
      if (auth.isAdmin || auth.isTeacher || auth.isStudent) return '/select-system'
    },
  },
  {
    path: '/calendar',
    alias: '/calendar/',
    component: () => import('../views/LoginView.vue'),
  },
  {
    path: '/guest/:moduleId',
    component: () => import('../views/LoginView.vue'),
  },
  {
    path: '/select-system',
    component: () => import('../views/PortalView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/admin',
    component: () => import('../views/AdminView.vue'),
    meta: { requiresAdmin: true },
  },
  {
    path: '/system-settings',
    component: () => import('../views/SystemSettingsAdminView.vue'),
    meta: { requiresAdmin: true },
  },
  {
    path: '/teacher',
    component: () => import('../views/TeacherView.vue'),
    meta: { requiresAdmin: true },
  },
  {
    path: '/rollbook',
    component: () => import('../views/RollbookView.vue'),
    meta: { requiresTeacherOrAdmin: true },
  },
  {
    path: '/student',
    component: () => import('../views/StudentView.vue'),
    meta: { requiresStudent: true },
  },
  {
    path: '/rural',
    component: () => import('../views/RuralView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/exam-intent',
    component: () => import('../views/ExamIntentStudentView.vue'),
    meta: { requiresStudent: true },
  },
  {
    path: '/exam-intent-manage',
    component: () => import('../views/ExamIntentAdminView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/junior-college',
    component: () => import('../views/JuniorCollegeView.vue'),
    meta: { requiresAuth: true },
  },
    {
    path: '/stat',
    component: () => import('../views/StatView.vue'),
    meta: { requiresTeacherOrAdmin: true },
  },
{
    path: '/:pathMatch(.*)*',
    redirect: '/login',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async to => {
  if (to.path === '/server-error' || to.path === '/calendar' || to.path === '/calendar/') return true

  const auth = useAuthStore()

  await auth.checkStatus()

  // ── 0. 학교 관리자 Secret 접속 통로 (비밀번호 없는 임시 게스트 열람) ──
  const isGuestEntryPath = to.path.startsWith('/guest/')
  const hasSecretQuery = to.query.secret === 'guest' || to.query.guest === 'true' || to.query.secret === 'manager'
  
  if (isGuestEntryPath || hasSecretQuery) {
    const targetModuleId = isGuestEntryPath
      ? (to.path.replace(/^\/guest\/?/, '').split('/')[0] || 'stat')
      : (getModuleIdByPath(to.path) || 'stat')
    
    const isSecretOpen = await isModuleSecretAccessEnabled(targetModuleId)
    if (isSecretOpen) {
      if (!auth.isAdmin && !auth.isTeacher) {
        auth.loginAsGuest(targetModuleId)
      }
      if (isGuestEntryPath) {
        const destPath = MODULE_ROUTE_MAP[targetModuleId] || '/stat'
        return { path: destPath, query: { secret: 'guest' } }
      }
      // 이미 해당 모듈 URL에 쿼리로 진입한 경우 진행 허용
      return true
    } else {
      // Secret 통로가 비활성화(닫힘)되어 있는 경우
      if (auth.isGuest && auth.guestModule === targetModuleId) {
        auth.logout()
      }
      return { path: '/login', query: { error: 'secret_closed', module: targetModuleId } }
    }
  }

  // 0-1. 활성화된 게스트 세션의 모듈 내부 탭 이동 및 새로고침 검증
  if (auth.isGuest) {
    const curModuleId = getModuleIdByPath(to.path)
    if (curModuleId && curModuleId === auth.guestModule) {
      const isSecretOpen = await isModuleSecretAccessEnabled(auth.guestModule)
      if (isSecretOpen) {
        return true
      } else {
        auth.logout()
        return { path: '/login', query: { error: 'secret_closed', module: auth.guestModule } }
      }
    } else if (to.path !== '/login') {
      const allowedPath = MODULE_ROUTE_MAP[auth.guestModule] || '/stat'
      return allowedPath
    }
  }

  if (auth.initialized === false && to.path !== '/welcome') {
    return '/welcome'
  }

  if (auth.initialized === true && to.path === '/welcome') {
    return '/login'
  }

  // Teacher 권한 격리: teacher는 출석관리(/rollbook) 및 포털(/select-system)만 접근 가능
  if (auth.isTeacher && to.path !== '/rollbook' && to.path !== '/stat' && to.path !== '/select-system' && to.path !== '/login') {
    return '/select-system'
  }

  if (to.path === '/stat') {
    const isEnabled = await isKcueStatSystemEnabled()
    if (!isEnabled) return '/select-system'
  }

  if (to.path === '/rural') {
    const status = await checkRuralSystemOpenStatus()
    if (status.isEnabled !== true) return '/select-system'
  }

  if (to.path === '/junior-college') {
    const isEnabled = await checkJuniorCollegeSystemEnabled()
    if (!isEnabled) return '/select-system'
  }

  if (to.path === '/exam-intent' || to.path === '/exam-intent-manage') {
    const isEnabled = await checkExamIntentSystemEnabled()
    if (!isEnabled) return '/select-system'
    // 학생인 경우 졸업생은 진입 차단
    if (to.path === '/exam-intent' && auth.isStudent && !auth.isEnrolled) {
      return '/select-system'
    }
  }

  const isGuestAuthorized = auth.isGuest && auth.guestModule === getModuleIdByPath(to.path)

  if (to.meta.requiresTeacherOrAdmin && !auth.isAdmin && !auth.isTeacher && !isGuestAuthorized) return '/login'
  if (to.meta.requiresAuth && !auth.isAdmin && !auth.isTeacher && !auth.isStudent && !isGuestAuthorized) return '/login'
  if (to.meta.requiresAdmin && !auth.isAdmin) return '/login'
  if (to.meta.requiresTeacher && !auth.isTeacher) return '/login'
  if (to.meta.requiresStudent && !auth.isStudent) return '/login'
})

router.onError((error, to) => {
  if (error?.message?.includes('Failed to fetch dynamically imported module')) {
    const key = 'module_import_retry_' + (to?.path || 'app')
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1')
      window.location.reload()
    } else {
      sessionStorage.removeItem(key)
      console.error('[Router] Dynamic import failed permanently:', error)
    }
  }
})

export default router
