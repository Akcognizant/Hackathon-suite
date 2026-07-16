// Unified "Messages & Notifications" panel for the navbar. This renders ONLY the
// dropdown panel (compose box + inbox list); it has no trigger of its own — the Bell
// icon in AdminLayout is the single entry point and controls it via the `open` prop.
// Backed by /admin/messages/*. Opening it marks unread messages read.

import { useEffect, useState } from 'react'
import axiosClient from '../api/axiosClient'
import { useToast } from '../context/ToastContext'
import { usePermissions } from '../hooks/usePermissions'
import Button from './ui/Button'
import CustomDropdown from './ui/CustomDropdown'

// Recipient groups for the compose box. "All Participants" is an ANNOUNCEMENT broadcast.
const GROUP_DIRECT = 'DIRECT'
const GROUP_ANNOUNCEMENT = 'ANNOUNCEMENT'

function formatTime(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Two-letter avatar seed from an email's local part.
function initials(email) {
  if (!email) return '?'
  const local = email.split('@')[0]
  const parts = local.split(/[._-]+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return local.slice(0, 2).toUpperCase()
}

function BellIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}
function MegaphoneIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  )
}
function TrashIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    </svg>
  )
}
function InboxIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  )
}

// `open` is controlled by the parent (AdminLayout) — the Bell icon is the single trigger.
function MessagesInbox({ open = false }) {
  const { showToast } = useToast()
  const { canAccess } = usePermissions()
  const [messages, setMessages] = useState([])
  const [recipients, setRecipients] = useState([])
  const [loading, setLoading] = useState(false)
  const [group, setGroup] = useState(GROUP_DIRECT)
  const [to, setTo] = useState('')
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [clearing, setClearing] = useState(false)

  // Only admins may broadcast to all participants; judges send direct only.
  const canBroadcast = canAccess('ADMIN')
  const groupOptions = [
    { value: GROUP_DIRECT, label: 'Individual Judge' },
    ...(canBroadcast ? [{ value: GROUP_ANNOUNCEMENT, label: 'All Participants' }] : []),
  ]
  const isAnnouncement = group === GROUP_ANNOUNCEMENT

  // On open: load inbox + recipient list, then mark unread messages read.
  useEffect(() => {
    if (!open) return undefined
    let active = true
    setLoading(true) // eslint-disable-line react-hooks/set-state-in-effect
    Promise.all([
      axiosClient.get('/admin/messages/inbox'),
      axiosClient.get('/admin/messages/users'),
    ])
      .then(async ([inboxRes, usersRes]) => {
        if (!active) return
        setMessages(inboxRes.data)
        setRecipients(
          usersRes.data.map((u) => ({ value: String(u.id), label: `${u.email} · ${u.role}` })),
        )
        const unreadIds = inboxRes.data.filter((m) => !m.read).map((m) => m.id)
        if (unreadIds.length) {
          await Promise.all(
            unreadIds.map((id) => axiosClient.post(`/admin/messages/${id}/read`).catch(() => {})),
          )
          if (active) {
            setMessages((prev) => prev.map((m) => ({ ...m, read: true })))
          }
        }
      })
      .catch(() => {
        if (active) showToast('Failed to load messages.', 'error')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [open, showToast])

  const handleSend = async () => {
    const body = content.trim()
    if (!body || sending) return
    if (!isAnnouncement && !to) return // direct requires a recipient
    setSending(true)
    try {
      if (isAnnouncement) {
        await axiosClient.post('/admin/messages/announcement', { content: body })
        showToast('Announcement sent to all participants.', 'success')
      } else {
        await axiosClient.post('/admin/messages', { receiverId: Number(to), content: body })
        showToast('Message sent.', 'success')
      }
      setContent('')
      setTo('')
    } catch {
      showToast('Failed to send. Please try again.', 'error')
    } finally {
      setSending(false)
    }
  }

  // Clear inbox: deletes the user's direct messages. Announcements are global
  // broadcasts (shared across users), so they intentionally remain.
  const handleClear = async () => {
    if (clearing) return
    setClearing(true)
    try {
      await axiosClient.delete('/admin/messages/inbox')
      setMessages((prev) => prev.filter((m) => m.messageType === 'ANNOUNCEMENT'))
      showToast('Inbox cleared.', 'success')
    } catch {
      showToast('Failed to clear inbox.', 'error')
    } finally {
      setClearing(false)
    }
  }

  // Only direct messages can be cleared (announcements are global).
  const hasClearable = messages.some((m) => m.messageType !== 'ANNOUNCEMENT')

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-label="Messages and notifications"
      className="absolute right-0 top-[calc(100%+0.625rem)] z-50 w-[22rem] origin-top-right overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl ring-1 ring-black/5"
    >
      {/* Premium gradient header */}
      <div className="relative flex items-center gap-3 bg-gradient-to-r from-indigo-950 via-blue-900 to-blue-800 px-4 py-3.5 text-white">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20 backdrop-blur">
          <BellIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-tight">Messages &amp; Notifications</p>
          <p className="text-[11px] text-blue-200">Compose, broadcast &amp; review</p>
        </div>
      </div>

      {/* Compose */}
      <div className="border-b border-slate-100 bg-slate-50/70 p-3.5">
        <div className="space-y-2">
          {/* Recipient group — admins can also broadcast to all participants. */}
          {canBroadcast && (
            <CustomDropdown
              ariaLabel="Recipient group"
              options={groupOptions}
              value={group}
              onChange={(v) => {
                setGroup(v)
                if (v === GROUP_ANNOUNCEMENT) setTo('')
              }}
              className="w-full"
            />
          )}
          {!isAnnouncement && (
            <CustomDropdown
              ariaLabel="Recipient"
              options={
                recipients.length
                  ? [{ value: '', label: 'Select recipient…' }, ...recipients]
                  : [{ value: '', label: 'No other users' }]
              }
              value={to}
              onChange={setTo}
              className="w-full"
            />
          )}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={2}
            placeholder={isAnnouncement ? 'Write an announcement…' : 'Write a message…'}
            className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <div className="flex items-center justify-between">
            {isAnnouncement ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-600">
                <MegaphoneIcon className="h-3.5 w-3.5" /> Broadcast to all participants
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">Direct message</span>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={handleSend}
              isLoading={sending}
              disabled={!content.trim() || (!isAnnouncement && !to)}
            >
              {isAnnouncement ? 'Broadcast' : 'Send'}
            </Button>
          </div>
        </div>
      </div>

      {/* Inbox */}
      <div className="flex items-center justify-between px-4 pb-1.5 pt-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Inbox</p>
        {hasClearable && (
          <button
            type="button"
            onClick={handleClear}
            disabled={clearing}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
          >
            <TrashIcon className="h-3.5 w-3.5" />
            {clearing ? 'Clearing…' : 'Clear'}
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto px-2 pb-2">
        {loading ? (
          <div className="space-y-2 px-2 py-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex animate-pulse gap-3 rounded-xl p-2">
                <div className="h-9 w-9 shrink-0 rounded-full bg-slate-200" />
                <div className="flex-1 space-y-2 py-0.5">
                  <div className="h-3 w-1/3 rounded bg-slate-200" />
                  <div className="h-3 w-3/4 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <InboxIcon className="h-6 w-6" />
            </span>
            <p className="text-sm font-medium text-slate-500">No messages yet</p>
            <p className="text-xs text-slate-400">Direct messages and announcements will appear here.</p>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {messages.map((m) => {
              const announcement = m.messageType === 'ANNOUNCEMENT'
              return (
                <li
                  key={m.id}
                  className="flex gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-slate-50"
                >
                  {/* Avatar */}
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-sm ${
                      announcement
                        ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                        : 'bg-gradient-to-br from-indigo-500 to-blue-600'
                    }`}
                  >
                    {announcement ? <MegaphoneIcon className="h-4 w-4" /> : initials(m.senderEmail)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5">
                        {announcement && (
                          <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
                            Announcement
                          </span>
                        )}
                        <span className="truncate text-sm font-semibold text-slate-800">
                          {m.senderEmail || 'Unknown sender'}
                        </span>
                      </span>
                      <span className="shrink-0 text-[10px] text-slate-400">{formatTime(m.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 text-sm leading-snug text-slate-600">{m.content}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

export default MessagesInbox
