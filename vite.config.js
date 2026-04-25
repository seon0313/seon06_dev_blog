import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist' },
  server: {
    // 로컬 개발 시 /api/* 를 wrangler pages dev가 띄운 포트로 프록시
    proxy: {
      '/api': { target: 'http://localhost:8788', changeOrigin: true },
    },
  },
})
