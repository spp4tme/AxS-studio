import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base relative so the build is portable on any static host (Netlify, GitHub Pages, S3...).
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { host: true, port: 5173 },
})
