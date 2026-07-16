// Participant dashboard — a quick, at-a-glance summary of events, teams, and
// submissions with a welcome hero, icon stat tiles, and recent-activity panels.

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getEvents, getMyTeams, getMySubmissions } from '../../api/participantApi'
import { formatDateRange } from '../../utils/dates'
import { SUBMISSION_STATUS_STYLES, submissionDisplayStatus } from '../../utils/submissionState'

const EVENT_STATUS_STYLES = {
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  UPCOMING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-slate-200 text-slate-600',
}

const TrophyIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
)
const UsersIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)
const FileIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
  </svg>
)

function firstName(email) {
  if (!email) return 'there'
  const local = email.split('@')[0].split(/[._-]+/)[0]
  return local ? local.charAt(0).toUpperCase() + local.slice(1) : 'there'
}

function StatTile({ to, label, value, Icon, tone }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <p className="text-3xl font-bold tabular-nums text-slate-900">{value}</p>
        <p className="text-sm font-medium text-slate-500">{label}</p>
      </div>
    </Link>
  )
}

function Dashboard() {
  const navigate = useNavigate()
  const email = (typeof window !== 'undefined' && localStorage.getItem('adminEmail')) || ''
  const [events, setEvents] = useState([])
  const [teams, setTeams] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([getEvents(), getMyTeams(), getMySubmissions()])
      .then(([e, t, s]) => {
        if (!active) return
        setEvents(e)
        setTeams(t)
        setSubmissions(s)
      })
      .catch(() => {})
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const openEvents = events.filter((e) => (e.status || '').toUpperCase() !== 'COMPLETED')
  const dash = (v) => (loading ? '—' : v)

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-white/5" />
        <div className="relative">
          <h1 className="text-2xl font-bold sm:text-3xl">Welcome back, {firstName(email)}</h1>
          <p className="mt-1 max-w-xl text-sm text-blue-100">Here’s what’s happening across your hackathons.</p>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <StatTile to="/portal/events" label="Open events" value={dash(openEvents.length)} Icon={TrophyIcon} tone="bg-blue-100 text-blue-600" />
        <StatTile to="/portal/my-teams" label="My teams" value={dash(teams.length)} Icon={UsersIcon} tone="bg-indigo-100 text-indigo-600" />
        <StatTile to="/portal/submissions" label="My submissions" value={dash(submissions.length)} Icon={FileIcon} tone="bg-emerald-100 text-emerald-600" />
      </div>

      {/* Panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <TrophyIcon className="h-5 w-5 text-blue-500" /> Upcoming &amp; active events
            </h2>
            <Link to="/portal/events" className="text-sm font-medium text-blue-600 hover:text-blue-700">View all</Link>
          </div>
          {loading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : openEvents.length === 0 ? (
            <p className="text-sm text-slate-400">No open events right now.</p>
          ) : (
            <ul className="space-y-3">
              {openEvents.slice(0, 4).map((e) => (
                <li
                  key={e.id}
                  onClick={() => navigate('/portal/events')}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 px-4 py-3 transition-colors hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">{e.title}</p>
                    <p className="text-xs text-slate-500">{formatDateRange(e.startDate, e.endDate)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${EVENT_STATUS_STYLES[e.status] || 'bg-slate-100 text-slate-600'}`}>
                    {e.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <FileIcon className="h-5 w-5 text-emerald-500" /> My submissions
            </h2>
            <Link to="/portal/submissions" className="text-sm font-medium text-blue-600 hover:text-blue-700">View all</Link>
          </div>
          {loading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : submissions.length === 0 ? (
            <p className="text-sm text-slate-400">
              No submissions yet.{' '}
              <Link to="/portal/submit" className="font-medium text-blue-600 hover:text-blue-700">Submit a project</Link>.
            </p>
          ) : (
            <ul className="space-y-3">
              {submissions.slice(0, 4).map((s) => {
                const st = submissionDisplayStatus(s)
                return (
                  <li
                    key={s.id}
                    onClick={() => navigate('/portal/submissions')}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 px-4 py-3 transition-colors hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-800">{s.projectTitle}</p>
                      <p className="truncate text-xs text-slate-500">{s.teamName} · {s.hackathonTitle}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${SUBMISSION_STATUS_STYLES[st] || 'bg-slate-100 text-slate-600'}`}>
                      {st}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
