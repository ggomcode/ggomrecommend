import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { checkRuralSystemOpenStatus } from '../api/ruralApi.js'
import { checkExamIntentSystemEnabled } from '../api/examIntentApi.js'
import { checkJuniorCollegeSystemEnabled } from '../api/juniorCollegeApi.js'
import { isKcueStatSystemEnabled } from '../api/statApi.js'
import { 
  isModuleSecretAccessEnabled, 
  getModuleIdByPath, 
  MODULE_ROUTE_MAP,
  verifySecretAccessToken,
  CODE_TO_MODULE_MAP
} from '../api/suiteModulesApi.js'

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
      if (to.query.error) return true
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

  // ── 0. 학교 관리자 Secret 접속 통로 (AES 암호화 토큰 검증) ──
  // 🚫 폐기된 단순 파라미터(?secret=guest 등) 접근 시도는 기존 게스트 세션까지 즉시 파기하고 원천 차단
  if (to.query.secret !== undefined) {
    if (auth.isGuest) auth.logout()
    return { path: '/login', query: { error: 'secret_invalid' } }
  }

  const secretToken = to.query.sec || to.query.token || null
  const isGuestEntryPath = to.path.startsWith('/guest/')
  
  if (secretToken || isGuestEntryPath) {
    let token = secretToken
    let targetModuleId = null

    if (isGuestEntryPath) {
      const segs = to.path.replace(/^\/guest\/?/, '').split('/')
      const rawCodeOrId = segs[0]
      targetModuleId = CODE_TO_MODULE_MAP[rawCodeOrId] || rawCodeOrId || null
      if (!token && segs[1]) {
        token = segs[1]
      }
    } else {
      targetModuleId = getModuleIdByPath(to.path)
    }

    if (!token) {
      // 토큰 없는 게스트 접속 시도: 즉시 로그인 차단
      if (auth.isGuest) auth.logout()
      return { path: '/login', query: { error: 'secret_invalid' } }
    }

    // 1) AES-256-GCM 토큰 복호화 및 유효성(모듈코드, 발급일자, 24시간 만료) 검증
    const verifyResult = await verifySecretAccessToken(token, targetModuleId)
    if (!verifyResult.valid) {
      if (auth.isGuest) auth.logout()
      const errCode = verifyResult.reason === 'expired' ? 'secret_expired' : 'secret_invalid'
      return { path: '/login', query: { error: errCode, module: targetModuleId || 'stat' } }
    }

    const verifiedModuleId = verifyResult.moduleId || targetModuleId
    
    // 2) 관리자 환경설정에서 해당 모듈의 Secret 통로가 열려있는지(ON 상태) 실시간 확인
    const isSecretOpen = await isModuleSecretAccessEnabled(verifiedModuleId)
    if (!isSecretOpen) {
      if (auth.isGuest) auth.logout()
      return { path: '/login', query: { error: 'secret_closed', module: verifiedModuleId } }
    }

    // 3) 검증 통과: 게스트 세션 승인 및 1일 한정 티켓 등록
    if (!auth.isAdmin && !auth.isTeacher) {
      auth.loginAsGuest(verifiedModuleId, { ...verifyResult, token })
    }

    if (isGuestEntryPath) {
      const destPath = MODULE_ROUTE_MAP[verifiedModuleId] || '/stat'
      return { path: destPath, query: { sec: token } }
    }

    return true
  }

  // 0-1. 활성화된 게스트 세션의 모듈 내부 탭 이동 및 새로고침 검증
  if (auth.isGuest) {
    const curModuleId = getModuleIdByPath(to.path)
    if (curModuleId && curModuleId === auth.guestModule) {
      // sessionStorage 티켓 만료 확인 (우연한 접속 또는 1일 경과 접속 차단)
      let hasValidTicket = false
      try {
        const ticketStr = sessionStorage.getItem('pcm_guest_ticket')
        if (ticketStr) {
          const t = JSON.parse(ticketStr)
          if (t && t.moduleId === auth.guestModule && t.expiresAt && Date.now() < t.expiresAt) {
            hasValidTicket = true
          }
        }
      } catch (e) {}

      if (!hasValidTicket) {
        auth.logout()
        return { path: '/login', query: { error: 'secret_expired', module: auth.guestModule } }
      }

      // 관리자가 중간에 토글을 껐는지 확인
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
