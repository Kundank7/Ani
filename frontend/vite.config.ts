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
        target: 'https://generate.freebacklink.in',
        changeOrigin: true,
      },
      '/api': {
        target: 'https://generate.freebacklink.in',
        changeOrigin: true,
      }
    }
  }
})
