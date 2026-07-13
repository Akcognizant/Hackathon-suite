import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthBrandPanel from '../components/AuthBrandPanel'
import { registerCandidate } from '../api'
import { useToast } from '../context/ToastContext'

export default function RegisterPage() {
    const navigate = useNavigate()
    const { login } = useAuth()
    const toast = useToast()

    const [form, setForm] = useState({
        name: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
    })
    const [errors, setErrors] = useState({})
    const [apiError, setApiError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPass, setShowPass] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
        // Clear field error on change
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
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
        setApiError('')
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
            // A 409 means a duplicate — attach it to the specific field so it's obvious.
            if (status === 409 && msg && /user\s?name/i.test(msg)) {
                setErrors(prev => ({ ...prev, username: msg }))
            } else if (status === 409 && msg && /e-?mail/i.test(msg)) {
                setErrors(prev => ({ ...prev, email: msg }))
            } else {
                toast.error(msg || 'Registration failed. Please try again.')
            }
        } finally {
            setLoading(false)
        }
    }

    const fields = [
        {
            name: 'name', label: 'Full name', type: 'text',
            placeholder: 'Enter your full name', autoComplete: 'name',
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
            ),
        },
        {
            name: 'email', label: 'Email', type: 'email',
            placeholder: 'Enter your email', autoComplete: 'email',
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                </svg>
            ),
        },
        {
            name: 'username', label: 'Username', type: 'text',
            placeholder: 'Choose a username', autoComplete: 'username',
            icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
            ),
        },
    ]

    return (
        <div className="flex min-h-screen">
            <AuthBrandPanel />

            <main className="flex-1 flex items-center justify-center px-6 py-10 bg-white
                       overflow-y-auto">
                <div className="w-full max-w-sm flex flex-col gap-7">

                    {/* Mobile brand */}
                    <div className="flex md:hidden items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: '#534AB7', color: '#CECBF6' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                <circle cx="12" cy="12" r="3" />
                                <line x1="12" y1="2" x2="12" y2="6" />
                                <line x1="12" y1="18" x2="12" y2="22" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-900">PatternIQ</p>
                    </div>

                    {/* Header */}
                    <div className="flex flex-col gap-1.5">
                        <p className="text-xs font-medium tracking-widest uppercase"
                            style={{ color: '#1D9E75' }}>
                            Create account
                        </p>
                        <h2 className="text-2xl font-medium text-gray-900">Get started</h2>
                        <p className="text-sm text-gray-500">
                            Create your account to begin the assessment
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">

                        {/* Name, Email, Username */}
                        {fields.map(({ name, label, type, placeholder, autoComplete, icon }) => (
                            <div key={name} className="flex flex-col gap-1.5">
                                <label htmlFor={name} className="text-xs font-medium text-gray-500">
                                    {label}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2
                                   text-gray-400 pointer-events-none">
                                        {icon}
                                    </span>
                                    <input
                                        id={name}
                                        name={name}
                                        type={type}
                                        placeholder={placeholder}
                                        value={form[name]}
                                        onChange={handleChange}
                                        autoComplete={autoComplete}
                                        className={[
                                            'w-full h-11 pl-9 pr-4 rounded-xl border text-sm text-gray-900',
                                            'placeholder-gray-400 outline-none bg-white transition-all',
                                            errors[name]
                                                ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                                                : 'border-gray-200 hover:border-purple-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-100',
                                        ].join(' ')}
                                    />
                                </div>
                                {errors[name] && (
                                    <p className="text-xs" style={{ color: '#A32D2D' }}>{errors[name]}</p>
                                )}
                            </div>
                        ))}

                        {/* Password */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="password" className="text-xs font-medium text-gray-500">
                                Password
                            </label>
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <input
                                    id="password" name="password"
                                    type={showPass ? 'text' : 'password'}
                                    placeholder="Create a password"
                                    value={form.password}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                    className={[
                                        'w-full h-11 pl-9 pr-11 rounded-xl border text-sm text-gray-900',
                                        'placeholder-gray-400 outline-none bg-white transition-all',
                                        errors.password
                                            ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                                            : 'border-gray-200 hover:border-purple-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-100',
                                    ].join(' ')}
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                             hover:text-gray-600 p-1 rounded transition-colors">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                        {showPass
                                            ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
                                            : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                                        }
                                    </svg>
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-xs" style={{ color: '#A32D2D' }}>{errors.password}</p>
                            )}
                        </div>

                        {/* Confirm password */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="confirmPassword" className="text-xs font-medium text-gray-500">
                                Confirm password
                            </label>
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <input
                                    id="confirmPassword" name="confirmPassword"
                                    type={showConfirm ? 'text' : 'password'}
                                    placeholder="Confirm your password"
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                    className={[
                                        'w-full h-11 pl-9 pr-11 rounded-xl border text-sm text-gray-900',
                                        'placeholder-gray-400 outline-none bg-white transition-all',
                                        errors.confirmPassword
                                            ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                                            : 'border-gray-200 hover:border-purple-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-100',
                                    ].join(' ')}
                                />
                                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                             hover:text-gray-600 p-1 rounded transition-colors">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                        {showConfirm
                                            ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
                                            : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                                        }
                                    </svg>
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-xs" style={{ color: '#A32D2D' }}>{errors.confirmPassword}</p>
                            )}
                        </div>

                        {/* API error */}
                        {apiError && (
                            <div role="alert"
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm border"
                                style={{ background: '#FFF0F0', borderColor: '#F7C1C1', color: '#A32D2D' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                {apiError}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-1 h-11 flex items-center justify-center gap-2 rounded-xl
                         text-sm font-medium text-white transition-all active:scale-[0.98]
                         disabled:opacity-70 disabled:cursor-not-allowed"
                            style={{ backgroundColor: '#534AB7' }}
                            onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#3C3489' }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#534AB7' }}
                        >
                            {loading ? (
                                <span className="w-5 h-5 rounded-full border-2 border-white/30
                                 border-t-white animate-spin" />
                            ) : (
                                <>
                                    Create account
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                        <polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Login link */}
                    <p className="text-sm text-center text-gray-400">
                        Already have an account?{' '}
                        <Link to="/login"
                            className="font-medium transition-colors"
                            style={{ color: '#534AB7' }}>
                            Sign in
                        </Link>
                    </p>

                </div>
            </main>
        </div>
    )
}