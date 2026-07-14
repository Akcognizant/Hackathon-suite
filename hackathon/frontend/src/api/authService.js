// Auth API calls + session persistence. Keeps localStorage keys in one place so
// the rest of the app (axiosClient, route guards, layouts) stays in sync.
//
// A single account store now backs three roles: ADMIN, JUDGE, and PARTICIPANT.
// The role returned at login drives which experience the SPA renders.

import axios from 'axios'
import axiosClient, { TOKEN_KEY } from './axiosClient'

export const ROLE_KEY = 'adminRole'
export const EMAIL_KEY = 'adminEmail'

// The assessment (exam) app — a candidate who isn't an admin/judge authenticates
// against it, then we reverse-SSO them into the assessment portal.
export const ASSESSMENT_API = import.meta.env.VITE_ASSESSMENT_API ?? 'http://localhost:8082/api'
export const ASSESSMENT_URL = import.meta.env.VITE_ASSESSMENT_URL ?? 'http://localhost:5175'

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

/**
 * Fallback login against the assessment (exam) backend for candidate accounts.
 * Returns { token, candidate } on success; throws on invalid credentials.
 */
export async function loginCandidate(identifier, password) {
  const { data } = await axios.post(`${ASSESSMENT_API}/auth/login`, {
    username: identifier,
    password,
  })
  return data
}

/** Hand a freshly-authenticated candidate to the assessment portal (reverse SSO). */
export function redirectToAssessment({ token, candidate }) {
  const hash = new URLSearchParams({
    token,
    c: btoa(encodeURIComponent(JSON.stringify(candidate))),
  }).toString()
  window.location.href = `${ASSESSMENT_URL}/sso#${hash}`
}

/**
 * POST /api/auth/access-request — request an ADMIN or JUDGE account.
 * Creates a PENDING request for an admin to approve; does NOT log the user in.
 */
export async function requestAccess({ name, email, password, role, reason }) {
  await axiosClient.post('/api/auth/access-request', { name, email, password, role, reason })
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

/** Participant logout → back to the assessment portal login (their front door). */
export function logoutToAssessment() {
  logout()
  window.location.href = ASSESSMENT_LOGIN_URL
}

/** Admin/judge logout → back to the hackathon login (their front door). */
export function logoutToAdminLogin() {
  logout()
  window.location.href = '/login'
}

/** Everyone returns to the single login page (the hackathon /login). */
export function logoutToLogin() {
  logout()
  window.location.href = '/login'
}
