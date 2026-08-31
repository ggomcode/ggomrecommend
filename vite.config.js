import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// GitHub Actions 환경에서는 저장소 이름(ggomrecommend 또는 pogokrecommend)을 자동 감지
const repoName = process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split('/')[1] : null
const basePath = process.env.VITE_BASE_PATH || (repoName ? `/${repoName}/` : '/ggomrecommend/')

export default defineConfig({
  base: basePath,
  plugins: [
    vue(),
    tailwindcss(),
    {
      name: 'redirect-base-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const cleanBase = basePath.replace(/\/$/, '')
          if (req.url === cleanBase) {
            res.writeHead(302, { Location: basePath })
            res.end()
            return
          }
          if (req.url && !req.url.startsWith(cleanBase) && !req.url.startsWith('/@') && !req.url.startsWith('/node_modules') && !req.url.includes('.')) {
            res.writeHead(302, { Location: cleanBase + req.url })
            res.end()
            return
          }
          next()
        })
      }
    }
  ],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
})
