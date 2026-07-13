import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthBrandPanel from '../components/AuthBrandPanel'
import { loginCandidate } from '../api'
import { useToast } from '../context/ToastContext'

export default function LoginPage() {
    const navigate = useNavigate()
    const { login } = useAuth()
    const toast = useToast()

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPass, setShowPass] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        if (!username.trim() || !password.trim()) {
            setError('Please enter both username and password.')
            return
        }
        setLoading(true)
        try {
            const { data } = await loginCandidate(username.trim(), password)
            login(data.candidate, data.token)
            toast.success(`Welcome back, ${data.candidate.name?.split(' ')[0] || ''}!`.trim())
            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen">
            <AuthBrandPanel />

            <main className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
                <div className="w-full max-w-sm flex flex-col gap-8">

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
                            Candidate login
                        </p>
                        <h2 className="text-2xl font-medium text-gray-900">Welcome back</h2>
                        <p className="text-sm text-gray-500">Sign in to access your assessment</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

                        {/* Username */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="username" className="text-xs font-medium text-gray-500">
                                Username
                            </label>
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                <input
                                    id="username"
                                    type="text"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    autoComplete="username"
                                    autoFocus
                                    className="w-full h-11 pl-9 pr-4 rounded-xl border border-gray-200 text-sm
                             text-gray-900 placeholder-gray-400 outline-none bg-white
                             hover:border-purple-300 focus:border-purple-600
                             focus:ring-2 focus:ring-purple-100 transition-all"
                                />
                            </div>
                        </div>

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
                                    id="password"
                                    type={showPass ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                    className="w-full h-11 pl-9 pr-11 rounded-xl border border-gray-200 text-sm
                             text-gray-900 placeholder-gray-400 outline-none bg-white
                             hover:border-purple-300 focus:border-purple-600
                             focus:ring-2 focus:ring-purple-100 transition-all"
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)}
                                    aria-label={showPass ? 'Hide password' : 'Show password'}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                             hover:text-gray-600 p-1 rounded transition-colors">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                        {showPass ? (
                                            <>
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </>
                                        ) : (
                                            <>
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </>
                                        )}
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div role="alert"
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm border"
                                style={{ background: '#FFF0F0', borderColor: '#F7C1C1', color: '#A32D2D' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                {error}
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
                                    Sign in
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                        <polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Register link */}
                    <p className="text-sm text-center text-gray-400">
                        Don't have an account?{' '}
                        <Link to="/register"
                            className="font-medium transition-colors"
                            style={{ color: '#534AB7' }}>
                            Create one
                        </Link>
                    </p>

                </div>
            </main>
        </div>
    )
}