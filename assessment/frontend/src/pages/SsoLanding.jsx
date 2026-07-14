// Reverse-SSO landing: candidates authenticate on the SINGLE login page (the
// hackathon app on :5173). When that page detects a candidate, it redirects here
// with the assessment token + candidate profile in the URL hash. We persist them
// and drop the candidate into their dashboard — no second login.

import { useEffect } from 'react'

function readHash() {
  const raw = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash
  return new URLSearchParams(raw)
}

const HACKATHON_LOGIN =
  (import.meta.env.VITE_HACKATHON_URL ?? 'http://localhost:5173') + '/login'

export default function SsoLanding() {
  useEffect(() => {
    const params = readHash()
    const token = params.get('token')
    const c = params.get('c')
    try {
      if (!token || !c) throw new Error('missing')
      const candidate = JSON.parse(decodeURIComponent(atob(c)))
      sessionStorage.setItem('token', token)
      sessionStorage.setItem('candidate', JSON.stringify(candidate))
      // Full navigation so AuthProvider re-initialises from sessionStorage.
      window.location.assign('/dashboard')
    } catch {
      window.location.assign(HACKATHON_LOGIN)
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f7f7f8' }}>
      <div className="flex flex-col items-center gap-3">
        <span className="w-8 h-8 rounded-full border-2 border-purple-200 border-t-purple-600 animate-spin"
          style={{ borderTopColor: '#534AB7' }} />
        <p className="text-sm text-gray-400">Signing you in…</p>
      </div>
    </div>
  )
}
