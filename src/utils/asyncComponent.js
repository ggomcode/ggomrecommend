import { defineAsyncComponent, h } from 'vue'

/**
 * Creates a safe async component loader with automatic retries and fallback error handling.
 * Prevents "Failed to fetch dynamically imported module" crashes in Vue.
 */
export function safeAsyncComponent(loader) {
  return defineAsyncComponent({
    loader: async () => {
      try {
        return await loader()
      } catch (err) {
        console.warn('[AsyncComponent] Import failed, retrying loader...', err)
        await new Promise(res => setTimeout(res, 300))
        return await loader()
      }
    },
    onError(error, retry, fail, attempts) {
      const isFetchError =
        error?.message?.includes('fetch dynamically imported module') ||
        error?.message?.includes('Importing a module script failed') ||
        error?.name === 'TypeError'

      if (isFetchError && attempts <= 3) {
        console.warn(`[AsyncComponent] Retrying dynamic import (attempt ${attempts}/3)...`)
        setTimeout(() => retry(), 500)
      } else {
        console.error('[AsyncComponent] Dynamic import failed after maximum retries:', error)
        fail()
      }
    },
    errorComponent: {
      render() {
        return h('div', { class: 'p-8 text-center text-slate-500' }, [
          h('p', { class: 'text-base font-semibold text-slate-700 mb-2' }, '탭 화면을 불러오는데 실패했습니다.'),
          h('p', { class: 'text-sm text-slate-400 mb-4' }, '네트워크 상태나 서버 업데이트로 인해 모듈을 가져오지 못했습니다.'),
          h(
            'button',
            {
              class: 'px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors',
              onClick: () => window.location.reload()
            },
            '페이지 새로고침'
          )
        ])
      }
    }
  })
}
