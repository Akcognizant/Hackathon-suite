import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthBrandPanel from '../components/AuthBrandPanel'
import BrandMark from '../components/BrandMark'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { loginCandidate } from '../api'
import { useToast } from '../context/ToastContext'

const UserIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
)
const LockIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
)

export default function LoginPage() {
    const navigate = useNavigate()
    const { login } = useAuth()
    const toast = useToast()

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

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
                    <div className="md:hidden">
                        <BrandMark />
                    </div>

                    {/* Header */}
                    <div className="flex flex-col gap-1.5">
                        <p className="text-xs font-semibold tracking-widest uppercase text-teal-400">
                            Candidate login
                        </p>
                        <h2 className="text-2xl font-semibold text-slate-900">Welcome back</h2>
                        <p className="text-sm text-slate-500">Sign in to access your assessment</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                        <Input
                            label="Username"
                            icon={UserIcon}
                            id="username"
                            type="text"
                            placeholder="Enter your username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            autoComplete="username"
                            autoFocus
                        />
                        <Input
                            label="Password"
                            icon={LockIcon}
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoComplete="current-password"
                        />

                        {error && (
                            <div role="alert"
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm border border-red-200 bg-red-50 text-red-700">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <Button type="submit" isLoading={loading} className="mt-1 w-full h-11">
                            Sign in
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                            </svg>
                        </Button>
                    </form>

                    {/* Register link */}
                    <p className="text-sm text-center text-slate-400">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-medium text-purple-600 hover:text-purple-800 transition-colors">
                            Create one
                        </Link>
                    </p>

                </div>
            </main>
        </div>
    )
}
