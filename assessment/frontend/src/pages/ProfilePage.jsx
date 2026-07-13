import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { updateProfile, updatePassword, fetchHistory } from '../api'
import { useToast } from '../context/ToastContext'

const MAX_ATTEMPTS = 3

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

    // ── Profile form state ──
    const [profileForm, setProfileForm] = useState({
        name: candidate?.name || '',
        email: candidate?.email || '',
    })
    const [profileErrors, setProfileErrors] = useState({})
    const [profileSuccess, setProfileSuccess] = useState(false)
    const [profileLoading, setProfileLoading] = useState(false)

    // ── Password form state ──
    const [passForm, setPassForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    })
    const [passErrors, setPassErrors] = useState({})
    const [passSuccess, setPassSuccess] = useState(false)
    const [passLoading, setPassLoading] = useState(false)
    const [showPassFields, setShowPassFields] = useState({
        current: false, newPass: false, confirm: false,
    })

    // ── Attempt stats from session history ──
    const [attemptStats, setAttemptStats] = useState({
        totalAttempts: 0,
        attemptsRemaining: MAX_ATTEMPTS,
        bestScore: null,
        avgAccuracy: null,
        memberSince: candidate?.createdAt || null,
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
                        ? Math.round(history.reduce((s, h) => s + h.accuracy, 0) / history.length)
                        : null,
                    memberSince: candidate?.createdAt || null,
                })
            })
            .catch(() => { /* leave defaults on failure */ })
    }, [candidate?.id])

    // ── Profile validation ──
    const validateProfile = () => {
        const e = {}
        if (!profileForm.name.trim()) e.name = 'Name is required'
        if (!profileForm.email.trim()) e.email = 'Email is required'
        else if (!/\S+@\S+\.\S+/.test(profileForm.email)) e.email = 'Enter a valid email'
        return e
    }

    const handleProfileSave = async (ev) => {
        ev.preventDefault()
        setProfileSuccess(false)
        const errs = validateProfile()
        if (Object.keys(errs).length) { setProfileErrors(errs); return }
        setProfileLoading(true)

        try {
            const { data } = await updateProfile(candidate.id, {
                name: profileForm.name.trim(),
                email: profileForm.email.trim(),
            })
            // Refresh stored candidate + token so the Navbar and future requests stay in sync.
            login(data.candidate, data.token)
            setProfileErrors({})
            toast.success('Profile updated successfully')
        } catch (err) {
            const msg = err.response?.data?.message
            if (err.response?.status === 409 && msg) {
                setProfileErrors({ email: msg }) // duplicate email → attach to the email field
            } else {
                toast.error(msg || 'Failed to update profile.')
            }
        } finally {
            setProfileLoading(false)
        }
    }

    // ── Password validation ──
    const validatePass = () => {
        const e = {}
        if (!passForm.currentPassword) e.currentPassword = 'Enter your current password'
        if (!passForm.newPassword) e.newPassword = 'Enter a new password'
        else if (passForm.newPassword.length < 6) e.newPassword = 'Must be at least 6 characters'
        if (!passForm.confirmPassword) e.confirmPassword = 'Confirm your new password'
        else if (passForm.newPassword !== passForm.confirmPassword)
            e.confirmPassword = 'Passwords do not match'
        return e
    }

    const handlePasswordSave = async (ev) => {
        ev.preventDefault()
        setPassSuccess(false)
        const errs = validatePass()
        if (Object.keys(errs).length) { setPassErrors(errs); return }
        setPassLoading(true)

        try {
            await updatePassword(candidate.id, {
                currentPassword: passForm.currentPassword,
                newPassword: passForm.newPassword,
            })
            setPassErrors({})
            setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
            toast.success('Password updated successfully')
        } catch (err) {
            const msg = err.response?.data?.message
            if (err.response?.status === 401 && msg) {
                setPassErrors({ currentPassword: msg }) // wrong current password → attach to that field
            } else {
                toast.error(msg || 'Failed to update password.')
            }
        } finally {
            setPassLoading(false)
        }
    }

    const inputClass = (hasError) => [
        'w-full h-11 pl-9 pr-4 rounded-xl border text-sm text-gray-900',
        'placeholder-gray-400 outline-none bg-white transition-all',
        hasError
            ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
            : 'border-gray-200 hover:border-purple-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-100',
    ].join(' ')

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f7f7f8' }}>
            <Navbar />

            <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10 flex flex-col gap-6">

                {/* Header */}
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-1.5 text-xs transition-colors"
                        style={{ color: '#534AB7' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        Back to dashboard
                    </button>
                </div>

                <div className="flex flex-col gap-1">
                    <p className="text-xs font-medium tracking-widest uppercase"
                        style={{ color: '#1D9E75' }}>Account</p>
                    <h1 className="text-2xl font-medium text-gray-900">Profile</h1>
                    <p className="text-sm text-gray-500">Manage your account details and password.</p>
                </div>

                {/* Assessment stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        {
                            label: 'Attempts used',
                            value: `${attemptStats.totalAttempts}/${MAX_ATTEMPTS}`,
                            color: '#534AB7',
                        },
                        {
                            label: 'Attempts left',
                            value: attemptStats.attemptsRemaining,
                            color: attemptStats.attemptsRemaining === 0 ? '#A32D2D' : '#1D9E75',
                        },
                        {
                            label: 'Best score',
                            value: attemptStats.bestScore != null ? `${attemptStats.bestScore}/100` : '—',
                            color: '#26215C',
                        },
                        {
                            label: 'Avg accuracy',
                            value: attemptStats.avgAccuracy != null ? `${attemptStats.avgAccuracy}%` : '—',
                            color: '#26215C',
                        },
                    ].map(({ label, value, color }) => (
                        <div key={label}
                            className="flex flex-col gap-1 px-5 py-4 rounded-2xl border border-gray-100 bg-white">
                            <span className="text-xl font-medium font-mono" style={{ color }}>{value}</span>
                            <span className="text-xs text-gray-400">{label}</span>
                        </div>
                    ))}
                </div>

                {/* Profile info */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-5">
                    <div className="flex items-center gap-2">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                            stroke="#534AB7" strokeWidth="1.8" strokeLinecap="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                        <h2 className="text-sm font-medium text-gray-700">Personal information</h2>
                    </div>

                    <form onSubmit={handleProfileSave} noValidate className="flex flex-col gap-4">

                        {/* Username — read only */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-gray-500">
                                Username <span className="text-gray-300 font-normal">(cannot be changed)</span>
                            </label>
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
                                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                <input
                                    type="text"
                                    value={candidate?.username || ''}
                                    disabled
                                    className="w-full h-11 pl-9 pr-4 rounded-xl border border-gray-100
                             text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Name */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="name" className="text-xs font-medium text-gray-500">
                                Full name
                            </label>
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                <input
                                    id="name" type="text"
                                    placeholder="Your full name"
                                    value={profileForm.name}
                                    onChange={e => {
                                        setProfileForm(p => ({ ...p, name: e.target.value }))
                                        setProfileSuccess(false)
                                        if (profileErrors.name) setProfileErrors(p => ({ ...p, name: '' }))
                                    }}
                                    className={inputClass(!!profileErrors.name)}
                                />
                            </div>
                            {profileErrors.name && (
                                <p className="text-xs" style={{ color: '#A32D2D' }}>{profileErrors.name}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="email" className="text-xs font-medium text-gray-500">
                                Email
                            </label>
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                </svg>
                                <input
                                    id="email" type="email"
                                    placeholder="Your email"
                                    value={profileForm.email}
                                    onChange={e => {
                                        setProfileForm(p => ({ ...p, email: e.target.value }))
                                        setProfileSuccess(false)
                                        if (profileErrors.email) setProfileErrors(p => ({ ...p, email: '' }))
                                    }}
                                    className={inputClass(!!profileErrors.email)}
                                />
                            </div>
                            {profileErrors.email && (
                                <p className="text-xs" style={{ color: '#A32D2D' }}>{profileErrors.email}</p>
                            )}
                        </div>

                        {profileErrors.api && (
                            <p className="text-xs" style={{ color: '#A32D2D' }}>{profileErrors.api}</p>
                        )}

                        {profileSuccess && (
                            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
                                style={{ backgroundColor: '#E1F5EE', color: '#0F6E56' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Profile updated successfully
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={profileLoading}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm
                           font-medium text-white transition-all active:scale-[0.98]
                           disabled:opacity-70"
                                style={{ backgroundColor: '#534AB7' }}
                                onMouseEnter={e => { if (!profileLoading) e.currentTarget.style.backgroundColor = '#3C3489' }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#534AB7' }}
                            >
                                {profileLoading
                                    ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                    : 'Save changes'
                                }
                            </button>
                        </div>
                    </form>
                </div>

                {/* Change password */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-5">
                    <div className="flex items-center gap-2">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                            stroke="#534AB7" strokeWidth="1.8" strokeLinecap="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <h2 className="text-sm font-medium text-gray-700">Change password</h2>
                    </div>

                    <form onSubmit={handlePasswordSave} noValidate className="flex flex-col gap-4">

                        {[
                            { id: 'currentPassword', label: 'Current password', key: 'current', placeholder: 'Enter current password' },
                            { id: 'newPassword', label: 'New password', key: 'newPass', placeholder: 'Enter new password' },
                            { id: 'confirmPassword', label: 'Confirm password', key: 'confirm', placeholder: 'Confirm new password' },
                        ].map(({ id, label, key, placeholder }) => (
                            <div key={id} className="flex flex-col gap-1.5">
                                <label htmlFor={id} className="text-xs font-medium text-gray-500">
                                    {label}
                                </label>
                                <div className="relative">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                        width="16" height="16" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    <input
                                        id={id} name={id}
                                        type={showPassFields[key] ? 'text' : 'password'}
                                        placeholder={placeholder}
                                        value={passForm[id]}
                                        onChange={e => {
                                            setPassForm(p => ({ ...p, [id]: e.target.value }))
                                            setPassSuccess(false)
                                            if (passErrors[id]) setPassErrors(p => ({ ...p, [id]: '' }))
                                        }}
                                        className={inputClass(!!passErrors[id])}
                                        style={{ paddingRight: '2.75rem' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassFields(p => ({ ...p, [key]: !p[key] }))}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                               hover:text-gray-600 p-1 rounded transition-colors"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                            {showPassFields[key]
                                                ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
                                                : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                                            }
                                        </svg>
                                    </button>
                                </div>
                                {passErrors[id] && (
                                    <p className="text-xs" style={{ color: '#A32D2D' }}>{passErrors[id]}</p>
                                )}
                            </div>
                        ))}

                        {passErrors.api && (
                            <p className="text-xs" style={{ color: '#A32D2D' }}>{passErrors.api}</p>
                        )}

                        {passSuccess && (
                            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
                                style={{ backgroundColor: '#E1F5EE', color: '#0F6E56' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Password updated successfully
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={passLoading}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm
                           font-medium text-white transition-all active:scale-[0.98]
                           disabled:opacity-70"
                                style={{ backgroundColor: '#534AB7' }}
                                onMouseEnter={e => { if (!passLoading) e.currentTarget.style.backgroundColor = '#3C3489' }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#534AB7' }}
                            >
                                {passLoading
                                    ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                    : 'Update password'
                                }
                            </button>
                        </div>
                    </form>
                </div>

            </main>
        </div>
    )
}