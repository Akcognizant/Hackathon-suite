// Auth API calls + session persistence. Keeps localStorage keys in one place so
// the rest of the app (axiosClient, route guards, layouts) stays in sync.
//
// A single account store now backs three roles: ADMIN, JUDGE, and PARTICIPANT.
// The role returned at login drives which experience the SPA renders.

import axiosClient, { TOKEN_KEY } from './axiosClient'

export const ROLE_KEY = 'adminRole'
export const EMAIL_KEY = 'adminEmail'

// The assessment portal is the single front door. After logout (admin, judge, or
// participant) we send users back to its login, not the hackathon's own /login.
export const ASSESSMENT_LOGIN_URL =
  (import.meta.env.VITE_ASSESSMENT_URL ?? 'http://localhost:5175') + '/login'

function persistSession(data) {
  localStorage.setItem(TOKEN_KEY, data.token)
  localStorage.setItem(EMAIL_KEY, data.email)
  localStorage.setItem(ROLE_KEY, data.role)
  // Kept for backward-compat with existing guards/layout reads.
  localStorage.setItem('isAdminAuth', 'true')
}

/**
 * POST /api/auth/login -> { token, email, role }
 * Persists the JWT + session, then returns the payload (incl. role) so the
 * caller can route by role. Throws the Axios error on failure (e.g. 401).
 */
export async function login(email, password) {
  const { data } = await axiosClient.post('/api/auth/login', { email, password })
  persistSession(data)
  return data
}

/**
 * POST /api/auth/register -> { token, email, role } (role = PARTICIPANT)
 * Self-service participant signup. Logs the user straight in on success.
 */
export async function register(name, email, password) {
  const { data } = await axiosClient.post('/api/auth/register', {
    name,
    email,
    password,
  })
  persistSession(data)
  return data
}

/** The current session's role ('ADMIN' | 'JUDGE' | 'PARTICIPANT' | ''). */
export function currentRole() {
  return (localStorage.getItem(ROLE_KEY) || '').toUpperCase()
}

export function isAuthenticated() {
  return Boolean(localStorage.getItem(TOKEN_KEY))
}

/** Stateless logout: drop the token/session locally (JWT has no server session). */
export function logout() {
  axiosClient.post('/api/auth/logout').catch(() => {})
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EMAIL_KEY)
  localStorage.removeItem(ROLE_KEY)
  localStorage.removeItem('isAdminAuth')
}

/** Clear the session and return to the assessment portal's login (the single front door). */
export function logoutToAssessment() {
  logout()
  window.location.href = ASSESSMENT_LOGIN_URL
}
