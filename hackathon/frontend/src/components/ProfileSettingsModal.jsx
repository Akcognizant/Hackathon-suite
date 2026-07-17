// Profile Settings modal — opened from the navbar avatar menu. Shows the signed-in
// user's account details and lets them change their password. Backed by
// /api/account/me and /api/account/change-password.

import { useEffect, useState } from 'react'
import { getProfile, changePassword } from '../api/authService'
import { useToast } from '../context/ToastContext'
import Button from './ui/Button'

function initials(email, name) {
  const base = (name || email || '').trim()
  if (!base) return 'ME'
  const parts = base.split(/[\s._-]+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return base.slice(0, 2).toUpperCase()
}

const ROLE_TONE = {
  ADMIN: 'bg-indigo-100 text-indigo-800',
  JUDGE: 'bg-emerald-100 text-emerald-800',
  PARTICIPANT: 'bg-blue-100 text-blue-800',
}

const fieldClasses =
  'w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'

export default function ProfileSettingsModal({ open, onClose }) {
  const { showToast } = useToast()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // Load the profile whenever the modal opens; reset the form.
  useEffect(() => {
    if (!open) return
    setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setErrors({})
    setLoading(true)
    getProfile()
      .then(setProfile)
      .catch(() => showToast('Failed to load your profile.', 'error'))
      .finally(() => setLoading(false))
  }, [open, showToast])

  // Close on Escape.
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape' && !saving) onClose?.() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, saving, onClose])

  if (!open) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => (prev[name] ? { ...prev, [name]: '' } : prev))
  }

  const validate = () => {
    const e = {}
    if (!form.currentPassword) e.currentPassword = 'Enter your current password.'
    if (!form.newPassword) e.newPassword = 'Enter a new password.'
    else if (form.newPassword.length < 6) e.newPassword = 'Must be at least 6 characters.'
    if (form.newPassword && form.newPassword === form.currentPassword)
      e.newPassword = 'New password must differ from the current one.'
    if (!form.confirmPassword) e.confirmPassword = 'Confirm your new password.'
    else if (form.confirmPassword !== form.newPassword) e.confirmPassword = 'Passwords do not match.'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const fieldErrors = validate()
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors)
      return
    }
    setSaving(true)
    try {
      await changePassword(form.currentPassword, form.newPassword)
      showToast('Password updated successfully.', 'success')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      onClose?.()
    } catch (err) {
      const msg = err.response?.data?.message
      const fe = err.response?.data?.fieldErrors
      if (fe) setErrors((prev) => ({ ...prev, ...fe }))
      else if (msg && /current password/i.test(msg)) setErrors((prev) => ({ ...prev, currentPassword: msg }))
      else showToast(msg || 'Could not update password. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const email = profile?.email || ''
  const name = profile?.name || ''
  const role = (profile?.role || '').toUpperCase()
  // Fall back to the email's username (before @) when no display name is set,
  // e.g. admin@cognizant.com -> "admin".
  const displayName = name || (email ? email.split('@')[0] : '')

  return (
    <div
      onClick={() => !saving && onClose?.()}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Profile settings"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
      >
        {/* Gradient header with avatar */}
        <div className="flex items-center gap-4 bg-gradient-to-r from-indigo-950 via-blue-900 to-blue-800 px-6 py-5 text-white">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-lg font-bold ring-1 ring-white/25">
            {initials(email, name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold capitalize leading-tight">{displayName || 'Your account'}</p>
            <p className="truncate text-sm text-blue-200">{email || '—'}</p>
          </div>
          <button
            type="button"
            onClick={() => onClose?.()}
            aria-label="Close"
            className="ml-auto rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Account details */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Account</p>
            <dl className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Email</dt>
                <dd className="truncate font-medium text-slate-800">{loading ? '…' : email || '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Name</dt>
                <dd className="truncate font-medium capitalize text-slate-800">{loading ? '…' : displayName || '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Role</dt>
                <dd>
                  {role ? (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${ROLE_TONE[role] || 'bg-slate-100 text-slate-600'}`}>
                      {role}
                    </span>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {/* Change password */}
          <form onSubmit={handleSubmit}>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Change password</p>
            <div className="space-y-3">
              <div>
                <input
                  type="password"
                  name="currentPassword"
                  value={form.currentPassword}
                  onChange={handleChange}
                  placeholder="Current password"
                  autoComplete="current-password"
                  className={fieldClasses}
                />
                {errors.currentPassword && <p className="mt-1 text-xs font-medium text-red-600">{errors.currentPassword}</p>}
              </div>
              <div>
                <input
                  type="password"
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  placeholder="New password"
                  autoComplete="new-password"
                  className={fieldClasses}
                />
                {errors.newPassword && <p className="mt-1 text-xs font-medium text-red-600">{errors.newPassword}</p>}
              </div>
              <div>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  className={fieldClasses}
                />
                {errors.confirmPassword && <p className="mt-1 text-xs font-medium text-red-600">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => onClose?.()} disabled={saving} type="button">
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={saving}>
                {saving ? 'Updating…' : 'Update password'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
