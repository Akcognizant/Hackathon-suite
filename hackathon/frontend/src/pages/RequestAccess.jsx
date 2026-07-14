// Public page: request an ADMIN or JUDGE account. Submitting creates a PENDING
// request for an existing admin to approve — it does NOT log the user in.

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { requestAccess } from '../api/authService'
import Button from '../components/ui/Button'

const inputClasses =
  'w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'

function RequestAccess() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'JUDGE', reason: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); if (error) setError('') }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await requestAccess(form)
      setDone(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit your request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Left brand panel */}
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-950 via-blue-900 to-blue-800 lg:flex lg:w-1/2">
          <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="relative z-10 flex flex-col justify-center px-16">
            <span className="flex items-baseline text-4xl lowercase tracking-tight text-white">
              <span className="font-light">cognizant</span>
              <span className="ml-2 font-bold">hackathon&trade;</span>
            </span>
            <p className="mt-6 max-w-md text-lg font-semibold uppercase leading-relaxed tracking-wide text-blue-100">
              Request evaluator access.
            </p>
          </div>
        </div>

        {/* Right form */}
        <div className="flex w-full flex-col items-center justify-center bg-white px-6 py-12 lg:w-1/2">
          <div className="w-full max-w-sm">
            <h1 className="text-center text-3xl font-bold text-indigo-950">Request access</h1>
            <p className="mb-8 mt-2 text-center text-sm text-slate-500">
              Apply for an Admin or Judge account. An admin will review your request.
            </p>

            {done ? (
              <div className="space-y-5 text-center">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                  <p className="text-sm font-medium text-emerald-800">Request submitted ✅</p>
                  <p className="mt-1 text-sm text-emerald-700">
                    You’ll be able to sign in once an admin approves your account.
                  </p>
                </div>
                <Button type="button" variant="primary" className="w-full" onClick={() => navigate('/login')}>
                  Back to sign in
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Full name <span className="text-red-500">*</span></label>
                  <input type="text" value={form.name} onChange={set('name')} required placeholder="Jane Doe" className={inputClasses} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Email <span className="text-red-500">*</span></label>
                  <input type="email" value={form.email} onChange={set('email')} required placeholder="jane@cognizant.com" className={inputClasses} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Password <span className="text-red-500">*</span></label>
                  <input type="password" value={form.password} onChange={set('password')} required placeholder="At least 6 characters" className={inputClasses} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Requested role <span className="text-red-500">*</span></label>
                  <select value={form.role} onChange={set('role')} required className={inputClasses}>
                    <option value="JUDGE">Judge</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Reason (optional)</label>
                  <textarea value={form.reason} onChange={set('reason')} rows={3} placeholder="Why do you need access?" className={inputClasses} />
                </div>

                {error && <p className="text-sm font-medium text-red-600">{error}</p>}

                <Button type="submit" variant="primary" isLoading={loading} className="w-full">
                  {loading ? 'Submitting…' : 'Submit request'}
                </Button>

                <p className="text-center text-sm text-slate-500">
                  Already have an account?{' '}
                  <Link to="/login" className="font-semibold text-blue-600 transition-colors hover:text-blue-700">
                    Sign in
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs text-slate-400">
        © 2026 Cognizant. Secure Internal Hackathon Portal.
      </p>
    </div>
  )
}

export default RequestAccess
