import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useAuth } from '../context/AuthContext'
import { updateProfile, updatePassword, fetchHistory } from '../api'
import { useToast } from '../context/ToastContext'

const MAX_ATTEMPTS = 3

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

// Backend-wired:
//   - PUT /api/candidates/{id}          → update name/email
//   - PUT /api/candidates/{id}/password → update password
//   - GET /api/sessions?candidateId={id} → attempt stats
export default function ProfilePage() {
    const navigate = useNavigate()
    const { login } = useAuth()
    const toast = useToast()

    const candidate = (() => {
        try { return JSON.parse(sessionStorage.getItem('candidate')) } catch { return null }
    })()

    const [profileForm, setProfileForm] = useState({ name: candidate?.name || '', email: candidate?.email || '' })
    const [profileErrors, setProfileErrors] = useState({})
    const [profileLoading, setProfileLoading] = useState(false)

    const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
    const [passErrors, setPassErrors] = useState({})
    const [passLoading, setPassLoading] = useState(false)

    const [attemptStats, setAttemptStats] = useState({
        totalAttempts: 0, attemptsRemaining: MAX_ATTEMPTS, bestScore: null, avgAccuracy: null,
    })

    useEffect(() => {
        if (!candidate?.id) return
        fetchHistory(candidate.id)
            .then(res => {
                const history = Array.isArray(res.data) ? res.data : []
                setAttemptStats({
                    totalAttempts: history.length,
                    attemptsRemaining: Math.max(0, MAX_ATTEMPTS - history.length),
                    bestScore: history.length ? Math.max(...history.map(h => h.score)) : null,
                    avgAccuracy: history.length
                        ? Math.round(history.reduce((s, h) => s + h.accuracy, 0) / history.length) : null,
                })
            })
            .catch(() => { /* leave defaults on failure */ })
    }, [candidate?.id])

    const handleProfileSave = async (ev) => {
        ev.preventDefault()
        const e = {}
        if (!profileForm.name.trim()) e.name = 'Name is required'
        if (!profileForm.email.trim()) e.email = 'Email is required'
        else if (!/\S+@\S+\.\S+/.test(profileForm.email)) e.email = 'Enter a valid email'
        if (Object.keys(e).length) { setProfileErrors(e); return }
        setProfileLoading(true)
        try {
            const { data } = await updateProfile(candidate.id, {
                name: profileForm.name.trim(), email: profileForm.email.trim(),
            })
            login(data.candidate, data.token)
            setProfileErrors({})
            toast.success('Profile updated successfully')
        } catch (err) {
            const msg = err.response?.data?.message
            if (err.response?.status === 409 && msg) setProfileErrors({ email: msg })
            else toast.error(msg || 'Failed to update profile.')
        } finally {
            setProfileLoading(false)
        }
    }

    const handlePasswordSave = async (ev) => {
        ev.preventDefault()
        const e = {}
        if (!passForm.currentPassword) e.currentPassword = 'Enter your current password'
        if (!passForm.newPassword) e.newPassword = 'Enter a new password'
        else if (passForm.newPassword.length < 6) e.newPassword = 'Must be at least 6 characters'
        if (!passForm.confirmPassword) e.confirmPassword = 'Confirm your new password'
        else if (passForm.newPassword !== passForm.confirmPassword) e.confirmPassword = 'Passwords do not match'
        if (Object.keys(e).length) { setPassErrors(e); return }
        setPassLoading(true)
        try {
            await updatePassword(candidate.id, {
                currentPassword: passForm.currentPassword, newPassword: passForm.newPassword,
            })
            setPassErrors({})
            setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
            toast.success('Password updated successfully')
        } catch (err) {
            const msg = err.response?.data?.message
            if (err.response?.status === 401 && msg) setPassErrors({ currentPassword: msg })
            else toast.error(msg || 'Failed to update password.')
        } finally {
            setPassLoading(false)
        }
    }

    const setProfile = (field) => (ev) => {
        setProfileForm(p => ({ ...p, [field]: ev.target.value }))
        if (profileErrors[field]) setProfileErrors(p => ({ ...p, [field]: '' }))
    }
    const setPass = (field) => (ev) => {
        setPassForm(p => ({ ...p, [field]: ev.target.value }))
        if (passErrors[field]) setPassErrors(p => ({ ...p, [field]: '' }))
    }

    const stats = [
        { label: 'Attempts used', value: `${attemptStats.totalAttempts}/${MAX_ATTEMPTS}`, color: 'text-purple-600' },
        { label: 'Attempts left', value: attemptStats.attemptsRemaining, color: attemptStats.attemptsRemaining === 0 ? 'text-red-600' : 'text-teal-400' },
        { label: 'Best score', value: attemptStats.bestScore != null ? `${attemptStats.bestScore}/100` : '—', color: 'text-slate-900' },
        { label: 'Avg accuracy', value: attemptStats.avgAccuracy != null ? `${attemptStats.avgAccuracy}%` : '—', color: 'text-slate-900' },
    ]

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Navbar />

            <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10 flex flex-col gap-6">

                {/* Back */}
                <button onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-800 transition-colors w-fit">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                    </svg>
                    Back to dashboard
                </button>

                <div className="flex flex-col gap-1">
                    <p className="text-xs font-semibold tracking-widest uppercase text-teal-400">Account</p>
                    <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
                    <p className="text-sm text-slate-500">Manage your account details and password.</p>
                </div>

                {/* Assessment stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {stats.map(({ label, value, color }) => (
                        <div key={label} className="flex flex-col gap-1 px-5 py-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <span className={`text-xl font-semibold font-mono ${color}`}>{value}</span>
                            <span className="text-xs text-slate-400">{label}</span>
                        </div>
                    ))}
                </div>

                {/* Personal information */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5">
                    <div className="flex items-center gap-2 text-purple-600">
                        {UserIcon}
                        <h2 className="text-sm font-semibold text-slate-700">Personal information</h2>
                    </div>

                    <form onSubmit={handleProfileSave} noValidate className="flex flex-col gap-4">
                        <Input label="Username" hint="(cannot be changed)" icon={UserIcon}
                            type="text" value={candidate?.username || ''} disabled />
                        <Input label="Full name" icon={UserIcon} id="name" type="text" placeholder="Your full name"
                            value={profileForm.name} onChange={setProfile('name')} error={profileErrors.name} />
                        <Input label="Email" icon={MailIcon} id="email" type="email" placeholder="Your email"
                            value={profileForm.email} onChange={setProfile('email')} error={profileErrors.email} />
                        <div className="flex justify-end">
                            <Button type="submit" isLoading={profileLoading}>Save changes</Button>
                        </div>
                    </form>
                </div>

                {/* Change password */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5">
                    <div className="flex items-center gap-2 text-purple-600">
                        {LockIcon}
                        <h2 className="text-sm font-semibold text-slate-700">Change password</h2>
                    </div>

                    <form onSubmit={handlePasswordSave} noValidate className="flex flex-col gap-4">
                        <Input label="Current password" icon={LockIcon} id="currentPassword" type="password"
                            placeholder="Enter current password" value={passForm.currentPassword}
                            onChange={setPass('currentPassword')} error={passErrors.currentPassword} />
                        <Input label="New password" icon={LockIcon} id="newPassword" type="password"
                            placeholder="Enter new password" value={passForm.newPassword}
                            onChange={setPass('newPassword')} error={passErrors.newPassword} />
                        <Input label="Confirm password" icon={LockIcon} id="confirmPassword" type="password"
                            placeholder="Confirm new password" value={passForm.confirmPassword}
                            onChange={setPass('confirmPassword')} error={passErrors.confirmPassword} />
                        <div className="flex justify-end">
                            <Button type="submit" isLoading={passLoading}>Update password</Button>
                        </div>
                    </form>
                </div>

            </main>
            <Footer />
        </div>
    )
}
