// Candidate registration — restyled to match the hackathon admin portal's premium
// split-screen layout (left: immersive branded panel, right: centered form). The
// functionality is unchanged: same fields, validation, and registerCandidate flow.

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { registerCandidate } from '../api'
import { useToast } from '../context/ToastContext'

// Shared field styling — mirrors the hackathon AdminLogin inputs.
const inputClasses =
  'w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const toast = useToast()

  const [form, setForm] = useState({ name: '', email: '', username: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Full name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.username.trim()) e.username = 'Username is required'
    else if (form.username.length < 3) e.username = 'Username must be at least 3 characters'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters'
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password'
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const fieldErrors = validate()
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }
    setLoading(true)
    try {
      const { data } = await registerCandidate({
        name: form.name.trim(),
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password,
      })
      login(data.candidate, data.token)
      toast.success(`Welcome, ${data.candidate.name?.split(' ')[0] || 'there'}! Your account is ready.`)
      navigate('/dashboard')
    } catch (err) {
      const status = err.response?.status
      const msg = err.response?.data?.message
      if (status === 409 && msg && /user\s?name/i.test(msg)) setErrors((prev) => ({ ...prev, username: msg }))
      else if (status === 409 && msg && /e-?mail/i.test(msg)) setErrors((prev) => ({ ...prev, email: msg }))
      else toast.error(msg || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const field = (name, label, { type = 'text', placeholder = '', autoComplete } = {}) => (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label} <span className="text-red-500">*</span>
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={inputClasses}
      />
      {errors[name] && <p className="mt-1.5 text-sm font-medium text-red-600">{errors[name]}</p>}
    </div>
  )

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
              <span className="ml-2 font-bold">assessment&trade;</span>
            </span>
            <p className="mt-6 max-w-md text-lg font-semibold uppercase leading-relaxed tracking-wide text-blue-100">
              Powering Innovation. Securing the Future.
            </p>
          </div>
        </div>

        {/* ---------- Right: registration form ---------- */}
        <div className="flex w-full flex-col items-center justify-center overflow-y-auto bg-white px-6 py-12 lg:w-1/2">
          <div className="w-full max-w-sm">
            <img src="/cogni.png" alt="Cognizant" className="mx-auto mb-6 h-9 w-auto object-contain" />

            <h1 className="text-center text-3xl font-bold text-indigo-950">Assessment Portal</h1>
            <p className="mb-8 mt-2 text-center text-sm text-slate-500">
              Create your account to begin the assessment.
            </p>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {field('name', 'Full Name', { placeholder: 'Enter your full name', autoComplete: 'name' })}
              {field('email', 'Email', { type: 'email', placeholder: 'you@cognizant.com', autoComplete: 'email' })}
              {field('username', 'Username', { placeholder: 'Choose a username', autoComplete: 'username' })}
              {field('password', 'Password', { type: 'password', placeholder: '••••••••', autoComplete: 'new-password' })}
              {field('confirmPassword', 'Confirm Password', { type: 'password', placeholder: '••••••••', autoComplete: 'new-password' })}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                    Creating account…
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-blue-600 transition-colors hover:text-blue-700">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ---------- Footer ---------- */}
      <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs text-slate-400">
        © 2026 Cognizant. Secure Assessment Portal.
      </p>
    </div>
  )
}
