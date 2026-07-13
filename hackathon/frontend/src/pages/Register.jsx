// Participant self-registration — split-screen layout matching the login.
// Open to any email; the created account always gets the PARTICIPANT role and
// is logged straight in, landing on the participant portal.

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register as registerRequest } from '../api/authService'
import Button from '../components/ui/Button'

function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await registerRequest(name.trim(), email.trim(), password)
      navigate('/portal')
    } catch (err) {
      const status = err.response?.status
      if (status === 409) {
        setError('An account with this email already exists.')
      } else if (status === 400) {
        setError('Please check your details and try again.')
      } else {
        setError('Unable to register right now. Please try again later.')
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClasses =
    'w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Left: branded panel */}
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-950 via-blue-900 to-blue-800 lg:flex lg:w-1/2">
          <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />
          <div className="relative z-10 flex flex-col justify-center px-16">
            <span className="flex items-baseline text-4xl lowercase tracking-tight text-white">
              <span className="font-light">cognizant</span>
              <span className="ml-2 font-bold">hackathon&trade;</span>
            </span>
            <p className="mt-6 max-w-md text-lg font-semibold uppercase leading-relaxed tracking-wide text-blue-100">
              Build. Team up. Ship your idea.
            </p>
          </div>
        </div>

        {/* Right: registration form */}
        <div className="flex w-full flex-col items-center justify-center bg-white px-6 py-12 lg:w-1/2">
          <div className="w-full max-w-sm">
            <h1 className="text-center text-3xl font-bold text-indigo-950">
              Create your account
            </h1>
            <p className="mb-8 mt-2 text-center text-sm text-slate-500">
              Register as a participant to join hackathons.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Full name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                  required
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError('')
                  }}
                  placeholder="you@example.com"
                  required
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Confirm password <span className="text-red-500">*</span>
                </label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={inputClasses}
                />
                {error && (
                  <p className="mt-1.5 text-sm font-medium text-red-600">{error}</p>
                )}
              </div>

              <Button type="submit" variant="primary" isLoading={loading} className="w-full">
                {loading ? 'Creating account…' : 'Create account'}
              </Button>

              <p className="text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-blue-600 transition-colors hover:text-blue-700">
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs text-slate-400">
        © 2026 Cognizant. Secure Internal Hackathon Portal.
      </p>
    </div>
  )
}

export default Register
