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
      className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-80 origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
    >
          {/* Compose */}
          <div className="border-b border-slate-100 bg-slate-50/60 p-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              Messages &amp; Notifications
            </p>
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
                className="mb-2 w-full"
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
              className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <div className="mt-2 flex justify-end">
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

          {/* Inbox */}
          <div className="max-h-72 overflow-y-auto p-2">
            <div className="flex items-center justify-between px-1 pb-1">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Inbox</p>
              {hasClearable && (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={clearing}
                  className="text-xs font-semibold text-red-600 transition-colors hover:text-red-700 disabled:opacity-50"
                >
                  {clearing ? 'Clearing…' : 'Clear inbox'}
                </button>
              )}
            </div>
            {loading ? (
              <p className="px-1 py-6 text-center text-sm text-slate-400">Loading…</p>
            ) : messages.length === 0 ? (
              <p className="px-1 py-6 text-center text-sm text-slate-400">No messages yet.</p>
            ) : (
              <ul className="space-y-1">
                {messages.map((m) => (
                  <li key={m.id} className="rounded-xl px-3 py-2 transition-colors hover:bg-slate-50">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5">
                        {m.messageType === 'ANNOUNCEMENT' && (
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
                    <p className="mt-0.5 text-sm text-slate-600">{m.content}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
  )
}

export default MessagesInbox
