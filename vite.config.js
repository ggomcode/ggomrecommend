import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/ggomrecommend/',
  plugins: [
    vue(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        manual: 'manual.html',
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
})
