// Participant dashboard — quick summary of events, my teams, and submissions.

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StatCard from '../../components/ui/StatCard'
import { getEvents, getMyTeams, getMySubmissions } from '../../api/participantApi'
import { formatDateRange } from '../../utils/dates'

function Dashboard() {
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back 👋</h1>
        <p className="mt-1 text-sm text-slate-500">Here’s what’s happening across your hackathons.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <StatCard title="Open events" value={loading ? '—' : openEvents.length} accent="text-blue-600" />
        <StatCard title="My teams" value={loading ? '—' : teams.length} accent="text-indigo-600" />
        <StatCard title="My submissions" value={loading ? '—' : submissions.length} accent="text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Upcoming & active events</h2>
            <Link to="/portal/events" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>
          {loading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : openEvents.length === 0 ? (
            <p className="text-sm text-slate-400">No open events right now.</p>
          ) : (
            <ul className="space-y-3">
              {openEvents.slice(0, 4).map((e) => (
                <li key={e.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-800">{e.title}</p>
                    <p className="text-xs text-slate-500">
                      {formatDateRange(e.startDate, e.endDate)}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {e.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">My submissions</h2>
            <Link to="/portal/submissions" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>
          {loading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : submissions.length === 0 ? (
            <p className="text-sm text-slate-400">
              No submissions yet.{' '}
              <Link to="/portal/submit" className="font-medium text-blue-600 hover:text-blue-700">
                Submit a project
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-3">
              {submissions.slice(0, 4).map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-800">{s.projectTitle}</p>
                    <p className="text-xs text-slate-500">{s.teamName} · {s.hackathonTitle}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {s.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
