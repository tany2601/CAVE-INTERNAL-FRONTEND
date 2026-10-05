import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // In dev, /api is proxied to the backend so the browser never hits CORS.
  const backendTarget = env.VITE_PROXY_TARGET || 'http://localhost:3000'

  return {
    plugins: [react(), tailwindcss()],
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
