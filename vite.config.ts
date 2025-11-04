import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ✅ Ensure PostCSS is auto-detected
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.cjs',
  },
})
