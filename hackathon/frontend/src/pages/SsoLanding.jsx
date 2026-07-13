// SSO landing for candidates arriving from the assessment portal.
//
// The assessment portal redirects here as:  /sso#token=<jwt>
// We store the token (+ derived email/role) using the same localStorage keys the
// rest of the app uses, then drop the candidate into the participant portal — no
// second login. The token is a normal hackathon JWT (shared secret), so every
// subsequent API call is authorized and the backend auto-provisions the account.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TOKEN_KEY } from '../api/axiosClient'
import { ROLE_KEY, EMAIL_KEY } from '../api/authService'

// Decode a JWT payload (base64url) without verifying — just to read email/role/name.
function decodeJwt(token) {
  try {
    const payload = token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

function readTokenFromHash() {
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash
  return new URLSearchParams(hash).get('token')
}

export default function SsoLanding() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    const token = readTokenFromHash()
    const claims = token && decodeJwt(token)
    if (!token || !claims?.sub) {
      setError('This sign-in link is invalid or has expired. Please return to the assessment portal.')
      return
    }
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(EMAIL_KEY, claims.sub)
    localStorage.setItem(ROLE_KEY, claims.role || 'PARTICIPANT')
    localStorage.setItem('isAdminAuth', 'true')
    // Clear the token from the URL, then enter the participant portal.
    window.history.replaceState(null, '', '/sso')
    navigate('/portal', { replace: true })
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      {error ? (
        <div className="max-w-sm rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-red-600">{error}</p>
          <a href="/login" className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700">
            Go to login
          </a>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
          <p className="text-sm text-slate-500">Signing you in…</p>
        </div>
      )}
    </div>
  )
}
