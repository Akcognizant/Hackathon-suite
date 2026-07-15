// Admin login — premium split-screen layout. Left: immersive branded panel.
// Right: centered sign-in form. Mock auth enforces a @cognizant.com email, then
// persists the session flag + email to localStorage and routes into the app.

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  login as loginRequest,
  loginCandidate,
  redirectToAssessment,
} from '../api/authService'
import Button from './ui/Button'

// Where each role lands after login.
function homeForRole(role) {
  return (role || '').toUpperCase() === 'PARTICIPANT' ? '/portal' : '/dashboard'
}

function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Single login for everyone. Try the hackathon account store first (admin/judge/
  // participant); if there's no such account, fall back to the assessment (candidate)
  // store and hand the candidate off to the exam portal via reverse SSO.
  const authenticate = async (address, secret) => {
    setError('')
    setLoading(true)
    try {
      const { role } = await loginRequest(address, secret)
      navigate(homeForRole(role))
    } catch (err) {
      const status = err.response?.status
      // Not an admin/judge here (bad creds) OR the hackathon API is unreachable —
      // either way, try the candidate (assessment) account store next.
      if (status === 401 || status === 400 || !err.response) {
        try {
          const data = await loginCandidate(address, secret)
          redirectToAssessment(data)
          return
        } catch (candidateErr) {
          if (!candidateErr.response) {
            setError('Unable to sign in right now. Please try again later.')
          } else {
            setError('Invalid email/username or password. Please try again.')
          }
        }
      } else {
        setError('Unable to sign in right now. Please try again later.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    authenticate(email.trim(), password)
  }

  const inputClasses =
    'w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* ---------- Left: immersive branded panel ---------- */}
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-950 via-blue-900 to-blue-800 lg:flex lg:w-1/2">
          {/* Decorative geometric glow accents */}
          <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />

          <div className="relative z-10 flex flex-col justify-center px-16">
            <span className="flex items-baseline text-4xl lowercase tracking-tight text-white">
              <span className="font-light">cognizant</span>
              <span className="ml-2 font-bold">hackathon&trade;</span>
            </span>
            <p className="mt-6 max-w-md text-lg font-semibold uppercase leading-relaxed tracking-wide text-blue-100">
              Powering Innovation. Securing the Future.
            </p>
          </div>
        </div>

        {/* ---------- Right: sign-in form ---------- */}
        <div className="flex w-full flex-col items-center justify-center bg-white px-6 py-12 lg:w-1/2">
          <div className="w-full max-w-sm">
            <img
              src="/cogni.png"
              alt="Cognizant"
              className="mx-auto mb-6 h-9 w-auto object-contain"
            />

            <h1 className="text-center text-3xl font-bold text-indigo-950">
              Hackathon Portal
            </h1>
            <p className="mb-8 mt-2 text-center text-sm text-slate-500">
              Sign in — judges and admins.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Email or Username <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    if (error) setError('')
                  }}
                  placeholder="admin@cognizant.com"
                  required
                  className={inputClasses}
                />
                {error && (
                  <p className="mt-1.5 text-sm font-medium text-red-600">
                    {error}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  required
                  className={inputClasses}
                />
              </div>

              {/* Remember me + forgot password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  Remember Me
                </label>
                <a
                  href="#forgot"
                  className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
                >
                  Forgot Password?
                </a>
              </div>

              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
                className="w-full"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </Button>

              {/* OR divider */}
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-medium text-slate-400">OR</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              {/* SSO — static, non-interactive placeholder (no auto-login). */}
              <Button
                type="button"
                variant="secondary"
                disabled
                aria-disabled="true"
                tabIndex={-1}
                className="w-full cursor-default"
              >
                Sign in with Cognizant SSO
              </Button>

              <p className="text-center text-sm text-slate-500">
                Need an admin or judge account?{' '}
                <Link to="/request-access" className="font-semibold text-blue-600 transition-colors hover:text-blue-700">
                  Request access
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* ---------- Footer ---------- */}
      <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs text-slate-400">
        © 2026 Cognizant. Secure Internal Hackathon Portal.
      </p>
    </div>
  )
}

export default AdminLogin
