import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // base: '/geoguessr-game/',
  base: '/',
  plugins: [react()],
  define: {
    __BUILD_TIME__: JSON.stringify(
      new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false })
    ),
  },
})
