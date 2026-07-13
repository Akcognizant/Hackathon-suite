import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Ensure a single React instance (recharts pulls its own otherwise → invalid
  // hook call / "Cannot read properties of null (reading 'useContext')").
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  // Dev server (port 5173): forward API calls to Spring Boot on 8080 so the
  // frontend can use relative URLs (same as the consolidated build) without CORS.
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
      '/admin': 'http://localhost:8080',
      '/participant': 'http://localhost:8080',
      '/submissions': 'http://localhost:8080',
      '/v3': 'http://localhost:8080',
      '/swagger-ui': 'http://localhost:8080',
    },
  },
  // Build straight into the Spring Boot static folder so `npm run build` produces a
  // deployable single-app bundle (Spring serves index.html + /assets from here).
  // emptyOutDir is required because the target is outside the frontend project root.
  build: {
    outDir: '../backend/src/main/resources/static',
    emptyOutDir: true,
  },
})
