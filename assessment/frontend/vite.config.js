import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Moved off 5173 so it can run alongside the hackathon SPA (which owns 5173).
  server: {
    port: 5175,
  },
})