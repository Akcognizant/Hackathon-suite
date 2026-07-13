import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach token to every request automatically
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Global error handling.
// A 401 from a protected route means the JWT is missing/expired → force re-login.
// But 401s from the auth endpoints themselves (bad login credentials, wrong current
// password) are expected validation errors — let the page handle/display them.
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register']
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || ''
    const isAuthEndpoint =
      AUTH_ENDPOINTS.some((p) => url.includes(p)) || url.endsWith('/password')
    if (error.response?.status === 401 && !isAuthEndpoint) {
      sessionStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api