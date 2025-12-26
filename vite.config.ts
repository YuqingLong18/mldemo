import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    port: 3016,
    host: true
  },
  server: {
    port: 3016, // Optional: keep dev server on same port for consistency
    host: true
  }
})
