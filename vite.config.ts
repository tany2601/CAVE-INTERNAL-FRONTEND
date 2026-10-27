import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import fs from 'node:fs'

// One id per build. The app compares it with /version.json to learn that a newer version has been deployed,
// and the service worker is stamped with it so every deploy installs a fresh worker and drops old caches.
const BUILD_ID = Date.now().toString(36)

const buildStamp = () => ({
  name: 'cave-build-stamp',
  apply: 'build' as const,
  closeBundle() {
    const dist = path.resolve(__dirname, 'dist')
    fs.writeFileSync(path.join(dist, 'version.json'), JSON.stringify({ build: BUILD_ID }))
    const sw = path.join(dist, 'sw.js')
    if (fs.existsSync(sw)) fs.writeFileSync(sw, fs.readFileSync(sw, 'utf8').split('__BUILD_ID__').join(BUILD_ID))
  },
})

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // In dev, /api is proxied to the backend so the browser never hits CORS.
  const backendTarget = env.VITE_PROXY_TARGET || 'http://localhost:3000'

  return {
    plugins: [react(), tailwindcss(), buildStamp()],
    define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: parseInt(env.PORT || '5173'),
      proxy: {
        '/api': { target: backendTarget, changeOrigin: true },
      },
    },
    preview: {
      host: '0.0.0.0',
      port: parseInt(env.PORT || '4173'),
    },
  }
})
