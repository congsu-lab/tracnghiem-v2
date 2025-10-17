import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/tracnghiem-v2/', // 👈 Tên repository của bạn
  plugins: [react()],
})
