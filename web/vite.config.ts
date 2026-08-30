import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Local-only analysis backend (pipeline/server.py). The deployed build has no
    // backend — it serves pre-computed sessions from public/sessions/ instead.
    proxy: { '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true } },
  },
  build: { outDir: 'dist', sourcemap: false },
})
