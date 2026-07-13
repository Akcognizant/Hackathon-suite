// Talent-scouting slide-over panel. Opens from the right over a blurred backdrop,
// fetches a team's full profile + message history, and hosts an optimistic
// admin-to-team chat. Designed to feel weighted: mount -> next frame -> slide in;
// on close it slides out (retaining data) before the parent unmounts it.
//
// Props:
//   open       boolean — parent controls visibility (typically !!selectedTeamId)
//   teamId     number | null
//   teamName   string   — shown in the header immediately, before the fetch resolves
//   onClose    () => void

import { useEffect, useRef, useState } from 'react'
import axiosClient from '../api/axiosClient'
import Button from './ui/Button'
import RankBadge from './ui/RankBadge'

// Role colouring, shared shape with the participants table (role doubles as skill tag).
function roleTone(role) {
  const r = role?.toUpperCase() || ''
  if (r.includes('AI')) return { pill: 'border-purple-300 bg-purple-50 text-purple-700', avatar: 'bg-purple-100 text-purple-700' }
  if (r.includes('FRONTEND')) return { pill: 'border-blue-300 bg-blue-50 text-blue-700', avatar: 'bg-blue-100 text-blue-700' }
  if (r.includes('BACKEND')) return { pill: 'border-slate-300 bg-slate-100 text-slate-600', avatar: 'bg-slate-200 text-slate-700' }
  return { pill: 'border-gray-300 bg-gray-50 text-gray-600', avatar: 'bg-gray-100 text-gray-600' }
}

function StatusBadge({ status }) {
  const normalized = status?.toUpperCase() || ''
  let tone = 'border-gray-300 bg-gray-50 text-gray-500'
  if (normalized === 'APPROVED') tone = 'border-green-500 bg-green-50 text-green-700'
  else if (normalized === 'PENDING') tone = 'border-amber-400 bg-amber-50 text-amber-700'
  else if (normalized === 'REJECTED') tone = 'border-red-500 bg-red-50 text-red-700'
  return (
    <span className={`inline-flex rounded-full border px-3 py-0.5 text-xs font-bold uppercase tracking-wide ${tone}`}>
      {status || '—'}
    </span>
  )
}

function initials(name) {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function formatTime(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Skill rating shown as a light, borderless badge on the right of the card:
// a star + "N/5" in a score-tinted colour when evaluated, or muted "Pending" text.
function MemberScore({ member }) {
  if (!member.evaluated || member.technicalScore == null) {
    return <span className="shrink-0 text-xs font-medium text-slate-400">Pending</span>
  }
  const score = member.technicalScore
  const color = score >= 4 ? 'text-green-600' : score === 3 ? 'text-blue-600' : 'text-amber-600'
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 text-sm font-bold tabular-nums ${color}`}>
      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
        <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 15l-5.3 2.8 1-5.8L1.5 7.7l5.9-.9z" />
      </svg>
      {score}/5
    </span>
  )
}

function MemberCard({ member }) {
  const tone = roleTone(member.role)
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 transition-colors hover:bg-slate-50">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${tone.avatar}`}>
          {initials(member.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-800">{member.name}</p>
          <p className="truncate text-sm capitalize text-slate-400">
            {member.role ? member.role.toLowerCase() : 'Member'}
          </p>
        </div>
      </div>
      <MemberScore member={member} />
    </div>
  )
}

// Grey pulse placeholders shown while the profile fetches — never a blank panel.
function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex gap-3">
        <div className="h-11 w-11 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/2 rounded bg-slate-200" />
          <div className="h-3 w-1/3 rounded bg-slate-100" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-slate-100" />
        ))}
      </div>
      <div className="h-24 rounded-xl bg-slate-100" />
    </div>
  )
}

function TeamScoutingModal({ open, teamId, teamName, onClose }) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bodyRef = useRef(null)

  // Weighted enter/exit: keep mounted during the slide-out so the transition plays.
  useEffect(() => {
    if (open) {
      setMounted(true) // eslint-disable-line react-hooks/set-state-in-effect
      const raf = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(raf)
    }
    setVisible(false)
    const timer = setTimeout(() => setMounted(false), 300)
    return () => clearTimeout(timer)
  }, [open])

  // Fetch profile + messages together whenever a team opens.
  useEffect(() => {
    if (!open || !teamId) return undefined
    let active = true
    setLoading(true) // eslint-disable-line react-hooks/set-state-in-effect
    setDetail(null)
    setMessages([])
    Promise.all([
      axiosClient.get(`/admin/teams/${teamId}/scout`),
      axiosClient.get(`/admin/teams/${teamId}/messages`),
    ])
      .then(([profileRes, messagesRes]) => {
        if (active) {
          setDetail(profileRes.data)
          setMessages(messagesRes.data)
        }
      })
      .catch(() => {
        if (active) setDetail({ error: true })
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [open, teamId])

  // Close on Escape.
  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Keep the conversation scrolled to the latest message.
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [messages, loading])

  const handleSend = async () => {
    const body = draft.trim()
    if (!body || sending || !teamId) return
    setSending(true)
    const tempId = `tmp-${Date.now()}`
    // Optimistic: show the message instantly so latency is never felt.
    setMessages((prev) => [
      ...prev,
      { id: tempId, sender: 'You', body, createdAt: new Date().toISOString(), pending: true },
    ])
    setDraft('')
    try {
      const res = await axiosClient.post(`/admin/teams/${teamId}/messages`, { body })
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...res.data, pending: false } : m)))
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, pending: false, failed: true } : m)),
      )
    } finally {
      setSending(false)
    }
  }

  const onInputKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  if (!mounted) return null

  const hasError = detail?.error

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Team scouting profile">
      {/* Glassmorphism backdrop */}
      <div
        onClick={() => onClose?.()}
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Slide-over panel */}
      <div
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-6 py-5">
          <div className="flex items-center gap-3">
            <RankBadge rank={detail?.rank} />
            <div>
              <h2 className="text-xl font-bold text-indigo-950">{detail?.team || teamName}</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {detail?.hackathon || 'Scouting profile'}
                {detail?.score != null && (
                  <span className="ml-2 font-semibold text-slate-700">Score: {detail.score}</span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onClose?.()}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Scrollable body: profile + conversation */}
        <div ref={bodyRef} className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
          {loading ? (
            <Skeleton />
          ) : hasError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm font-medium text-red-600">
              Failed to load this team's profile.
            </p>
          ) : (
            <>
              {/* Status + repo */}
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={detail?.status} />
                {detail?.repositoryUrl ? (
                  <a
                    href={detail.repositoryUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                      <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 005.47 7.59c.4.07.55-.17.55-.38v-1.33c-2.23.48-2.7-1.07-2.7-1.07-.36-.93-.89-1.18-.89-1.18-.73-.5.05-.49.05-.49.8.06 1.23.83 1.23.83.72 1.23 1.88.87 2.34.67.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 014 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0016 8c0-4.42-3.58-8-8-8z" />
                    </svg>
                    View Repository
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 5a1 1 0 10-2 0v3a1 1 0 002 0V7zm-1 7a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    Profile incomplete
                  </span>
                )}
              </div>

              {/* Members */}
              <div>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-700">
                  Members {detail?.members?.length ? `(${detail.members.length})` : ''}
                </h3>
                {detail?.members?.length ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {detail.members.map((member, i) => (
                      <MemberCard key={`${member.name}-${i}`} member={member} />
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
                    No members registered for this team.
                  </p>
                )}
              </div>

              {/* Conversation — light surface separates the messaging zone from team content */}
              <div className="rounded-2xl bg-slate-50 p-4">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-700">
                  Internal Messages
                </h3>
                <div className="space-y-3">
                  {messages.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-400">
                      No messages yet. Start the conversation below.
                    </p>
                  ) : (
                    messages.map((message) => (
                      <div key={message.id} className="flex flex-col items-end">
                        <div
                          className={`max-w-[85%] rounded-2xl rounded-br-sm px-4 py-2 text-sm shadow-sm ${
                            message.failed
                              ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
                              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                          } ${message.pending ? 'opacity-70' : ''}`}
                        >
                          {message.body}
                        </div>
                        <span className="mt-1 text-[10px] text-slate-400">
                          {message.failed
                            ? 'Failed to send'
                            : message.pending
                              ? 'Sending…'
                              : `${message.sender} · ${formatTime(message.createdAt)}`}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-slate-200 bg-white px-4 py-3">
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onInputKeyDown}
              rows={1}
              placeholder="Message this team…"
              disabled={loading || hasError}
              className="h-10 max-h-32 min-h-10 flex-1 resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <Button
              variant="primary"
              onClick={handleSend}
              isLoading={sending}
              disabled={!draft.trim() || loading || hasError}
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeamScoutingModal
