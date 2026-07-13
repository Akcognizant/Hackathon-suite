// Central Axios instance for the Hackathon Admin Portal.
//
// - baseURL comes from VITE_API_BASE_URL (.env), with a localhost fallback.
// - Request interceptor: attaches the stored JWT as a Bearer token on every call.
// - Response interceptor: on a 401 (expired/invalid token) it clears the stale
//   session and bounces back to /login — except for the auth endpoints, whose
//   401s belong to the login form so it can show "wrong password".

import axios from 'axios'

export const TOKEN_KEY = 'token'

const axiosClient = axios.create({
  // Relative by default: when the SPA is served by Spring Boot, calls hit the same
  // origin (/api/…, /admin/…) — no CORS. Override with VITE_API_BASE_URL only when
  // running the Vite dev server separately (e.g. 'http://localhost:8080').
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  headers: { 'Content-Type': 'application/json' },
})

// --- Request: attach Bearer token if we have one ---
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// --- Response: globally handle expired/invalid sessions ---
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url ?? ''
    const isAuthCall = url.includes('/api/auth/')

    if (status === 401 && !isAuthCall) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem('isAdminAuth')
      localStorage.removeItem('adminEmail')
      localStorage.removeItem('adminRole')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  },
)

export default axiosClient
