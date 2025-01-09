/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const assetsUrl = process.env.NODE_ENV === 'production' ? '/front/' : '/'

export default defineConfig({
  base: assetsUrl,
  plugins: [react()],
  // Unecessary in prod since react and phoenix shared the same port
  server: {
    origin: assetsUrl,
    proxy: {
      '/sse': {
        target: 'http://localhost:4000',
        secure: false,
        ws: true,
      },
      '/api': {
        target: 'http://localhost:4000',
        secure: false,
        ws: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    teardownTimeout: 1000,
    setupFiles: './src/test/setup.ts',
    minWorkers: 1,
  },
})
