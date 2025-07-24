import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    port: 3000,
    host: true,
    allowedHosts: [
      'viralboard-production.up.railway.app',
      'localhost',
      '.railway.app' // This allows all railway.app subdomains
    ]
  },
  server: {
    port: 3000,
    host: true
  }
})
