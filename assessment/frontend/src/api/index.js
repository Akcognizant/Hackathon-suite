import api from './axiosInstance'

// ── Auth ──────────────────────────────────────────────
export const loginCandidate = (username, password) =>
  api.post('/auth/login', { username, password })

export const registerCandidate = (payload) =>
  api.post('/auth/register', payload) // { name, email, username, password }

export const updateProfile = (candidateId, payload) =>
  api.put(`/candidates/${candidateId}`, payload) // { name, email }

export const updatePassword = (candidateId, payload) =>
  api.put(`/candidates/${candidateId}/password`, payload) // { currentPassword, newPassword }

// ── Questions ─────────────────────────────────────────
export const fetchQuestions = (candidateId) =>
  api.get('/questions', { params: { candidateId } })

// ── Sessions ──────────────────────────────────────────
export const startSession = (candidateId) =>
  api.post('/sessions/start', { candidateId })

// Autosave a single answer while the attempt is in progress
export const autosaveResponse = (sessionId, payload) =>
  api.patch(`/sessions/${sessionId}/responses`, payload)

export const submitSession = (sessionId, payload) =>
  api.post(`/sessions/${sessionId}/submit`, payload)

export const fetchResult = (sessionId) =>
  api.get(`/sessions/${sessionId}/result`)

export const fetchAnalytics = (sessionId) =>
  api.get(`/sessions/${sessionId}/analytics`)

export const fetchHistory = (candidateId) =>
  api.get('/sessions', { params: { candidateId } })

// ── Hackathon gate / SSO ──────────────────────────────
// Pass/attempt status for the current candidate.
export const fetchGateStatus = () => api.get('/gate/status')

// Mint a hackathon SSO token (only succeeds once the candidate has passed).
export const requestHackathonSso = () => api.post('/sso/hackathon')
