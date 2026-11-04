import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import router from './router'
import './style.css'
import App from './App.vue'
import { setRouter } from './stores/auth.js'

// Register Chart.js components
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Filler
} from 'chart.js'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Filler
)

import { initLoginSystemConfig } from './api/suiteModulesApi.js'
import { initSchoolConfig } from './utils/schoolConfig.js'

async function bootstrap() {
  const app = createApp(App)
  app.use(createPinia())
  app.use(router)
  app.use(VueQueryPlugin)

  setRouter(router)

  // 1. 초기 렌더링 전 관리자 설정 대문명(시스템 명칭) 및 학교명을 DB/캐시에서 최우선 검사하여 확정
  // 2. 글꼴(Pretendard) 로딩을 선행 대기하여 첫 화면부터 지정된 글꼴로 번쩍임 없이 바로 표시
  try {
    await Promise.allSettled([
      initLoginSystemConfig(),
      initSchoolConfig(),
      document.fonts ? document.fonts.ready : Promise.resolve()
    ])
  } catch (e) {
    console.warn('Initial bootstrap config check failed:', e)
  }

  app.mount('#app')
}

bootstrap()
