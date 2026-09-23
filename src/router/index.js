import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { checkRuralSystemOpenStatus } from '../api/ruralApi.js'
import { checkExamIntentSystemEnabled } from '../api/examIntentApi.js'
import { checkJuniorCollegeSystemEnabled } from '../api/juniorCollegeApi.js'

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
    beforeEnter: () => {
      const auth = useAuthStore()
      if (auth.isAdmin || auth.isTeacher || auth.isStudent) return '/select-system'
    },
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
    path: '/:pathMatch(.*)*',
    redirect: '/login',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async to => {
  if (to.path === '/server-error') return true

  const auth = useAuthStore()

  await auth.checkStatus()

  if (auth.initialized === false && to.path !== '/welcome') {
    return '/welcome'
  }

  if (auth.initialized === true && to.path === '/welcome') {
    return '/login'
  }

  // Teacher 권한 격리: teacher는 출석관리(/rollbook) 및 포털(/select-system)만 접근 가능
  if (auth.isTeacher && to.path !== '/rollbook' && to.path !== '/select-system' && to.path !== '/login') {
    return '/select-system'
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

  if (to.meta.requiresTeacherOrAdmin && !auth.isAdmin && !auth.isTeacher) return '/login'
  if (to.meta.requiresAuth && !auth.isAdmin && !auth.isTeacher && !auth.isStudent) return '/login'
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


