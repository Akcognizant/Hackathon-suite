import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthBrandPanel from '../components/AuthBrandPanel'
import BrandMark from '../components/BrandMark'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { registerCandidate } from '../api'
import { useToast } from '../context/ToastContext'

const UserIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
)
const MailIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
    </svg>
)
const LockIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
)

export default function RegisterPage() {
    const navigate = useNavigate()
    const { login } = useAuth()
    const toast = useToast()

    const [form, setForm] = useState({ name: '', email: '', username: '', password: '', confirmPassword: '' })
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
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
        const fieldErrors = validate()
        if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return }
        setLoading(true)
        try {
            const { data } = await registerCandidate({
                name: form.name.trim(), email: form.email.trim(),
                username: form.username.trim(), password: form.password,
            })
            login(data.candidate, data.token)
            toast.success(`Welcome, ${data.candidate.name?.split(' ')[0] || 'there'}! Your account is ready.`)
            navigate('/dashboard')
        } catch (err) {
            const status = err.response?.status
            const msg = err.response?.data?.message
            if (status === 409 && msg && /user\s?name/i.test(msg)) setErrors(prev => ({ ...prev, username: msg }))
            else if (status === 409 && msg && /e-?mail/i.test(msg)) setErrors(prev => ({ ...prev, email: msg }))
            else toast.error(msg || 'Registration failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen">
            <AuthBrandPanel />

            <main className="flex-1 flex items-center justify-center px-6 py-10 bg-white overflow-y-auto">
                <div className="w-full max-w-sm flex flex-col gap-7">

                    {/* Mobile brand */}
                    <div className="md:hidden">
                        <BrandMark />
                    </div>

                    {/* Header */}
                    <div className="flex flex-col gap-1.5">
                        <p className="text-xs font-semibold tracking-widest uppercase text-teal-400">
                            Create account
                        </p>
                        <h2 className="text-2xl font-semibold text-slate-900">Get started</h2>
                        <p className="text-sm text-slate-500">Create your account to begin the assessment</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
                        <Input label="Full name" icon={UserIcon} name="name" type="text"
                            placeholder="Enter your full name" autoComplete="name"
                            value={form.name} onChange={handleChange} error={errors.name} />
                        <Input label="Email" icon={MailIcon} name="email" type="email"
                            placeholder="Enter your email" autoComplete="email"
                            value={form.email} onChange={handleChange} error={errors.email} />
                        <Input label="Username" icon={UserIcon} name="username" type="text"
                            placeholder="Choose a username" autoComplete="username"
                            value={form.username} onChange={handleChange} error={errors.username} />
                        <Input label="Password" icon={LockIcon} name="password" type="password"
                            placeholder="Create a password" autoComplete="new-password"
                            value={form.password} onChange={handleChange} error={errors.password} />
                        <Input label="Confirm password" icon={LockIcon} name="confirmPassword" type="password"
                            placeholder="Confirm your password" autoComplete="new-password"
                            value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />

                        <Button type="submit" isLoading={loading} className="mt-1 w-full h-11">
                            Create account
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                            </svg>
                        </Button>
                    </form>

                    {/* Login link */}
                    <p className="text-sm text-center text-slate-400">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-purple-600 hover:text-purple-800 transition-colors">
                            Sign in
                        </Link>
                    </p>

                </div>
            </main>
        </div>
    )
}
