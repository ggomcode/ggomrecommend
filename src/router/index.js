import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

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
    path: '/teacher',
    component: () => import('../views/TeacherView.vue'),
    meta: { requiresTeacher: true },
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
      window.location.assign(to.fullPath)
    } else {
      sessionStorage.removeItem(key)
      console.error('[Router] Dynamic import failed permanently:', error)
    }
  }
})

export default router


