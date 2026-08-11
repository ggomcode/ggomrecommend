import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/pogokrecommend/',
  plugins: [
    vue(),
    tailwindcss(),
    {
      name: 'redirect-base-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/pogokrecommend') {
            res.writeHead(302, { Location: '/pogokrecommend/' })
            res.end()
            return
          }
          if (req.url && !req.url.startsWith('/pogokrecommend') && !req.url.startsWith('/@') && !req.url.startsWith('/node_modules') && !req.url.includes('.')) {
            res.writeHead(302, { Location: '/pogokrecommend' + req.url })
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
