// There is a SINGLE login page for the whole suite — the hackathon app (:5173).
// Anyone hitting the assessment app's /login is sent there.

import { useEffect } from 'react'

const HACKATHON_LOGIN =
  (import.meta.env.VITE_HACKATHON_URL ?? 'http://localhost:5173') + '/login'

export default function LoginRedirect() {
  useEffect(() => {
    window.location.replace(HACKATHON_LOGIN)
  }, [])
  return null
}
