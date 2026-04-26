import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  envDir: './backend',
  plugins: [react()],
  server: {
    proxy: {
      '/avatars': {
        target: 'https://ani-wx5s.onrender.com',
        changeOrigin: true,
      },
      '/api': {
        target: 'https://ani-wx5s.onrender.com',
        changeOrigin: true,
      }
    }
  }
})
