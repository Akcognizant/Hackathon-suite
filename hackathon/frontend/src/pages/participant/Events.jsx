// Browse all hackathons visible to participants.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import { getEvents } from '../../api/participantApi'
import { formatDateRange } from '../../utils/dates'
import Pagination from '../../components/ui/Pagination'
import { usePagination } from '../../utils/usePagination'

const STATUS_STYLES = {
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  UPCOMING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-slate-200 text-slate-600',
}

const ACCENT = {
  ACTIVE: 'bg-emerald-500',
  UPCOMING: 'bg-blue-500',
  COMPLETED: 'bg-slate-400',
}

function Events() {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let active = true
    getEvents()
      .then((e) => active && setEvents(e))
      .catch(() => {})
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  // Completed events live on the History page — Events shows only active/upcoming.
  const filtered = events
    .filter((e) => (e.status || '').toUpperCase() !== 'COMPLETED')
    .filter((e) => e.title.toLowerCase().includes(query.trim().toLowerCase()))

  // Team registration is only open before the day a hackathon starts. Once it's
  // active (started) or completed, creating/joining a team is closed.
  const today = new Date().toISOString().slice(0, 10)
  const registrationClosed = (e) =>
    (e.status || '').toUpperCase() === 'COMPLETED' || (e.startDate && today >= e.startDate)

  const { page, totalPages, pageItems, next, prev } = usePagination(filtered, 6)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Events</h1>
          <p className="mt-1 text-sm text-slate-500">Browse hackathons and form a team to take part.</p>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search events…"
          className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:w-64"
        />
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading events…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-400">No events found.</p>
      ) : (
        <>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {pageItems.map((e) => (
            <div key={e.id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className={`h-1.5 ${ACCENT[e.status] || 'bg-slate-300'}`} />
              <div className="flex flex-1 flex-col p-6">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold text-slate-900">{e.title}</h3>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[e.status] || 'bg-slate-100 text-slate-600'}`}>
                    {e.status}
                  </span>
                </div>
                <p className="mb-4 line-clamp-3 flex-1 text-sm text-slate-500">{e.description}</p>
                <dl className="mb-4 space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-1.5"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>Dates</dt>
                    <dd className="font-medium text-slate-700">{formatDateRange(e.startDate, e.endDate)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-1.5"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>Team size</dt>
                    <dd className="font-medium text-slate-700">{e.minTeamSize ?? 1}–{e.maxTeamSize ?? '∞'}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-1.5"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /><path d="M4 22h16" /></svg>Teams</dt>
                    <dd className="font-medium text-slate-700">{e.teamCount}</dd>
                  </div>
                </dl>
                <Button
                  size="sm"
                  className="w-full"
                  disabled={registrationClosed(e)}
                  onClick={() => navigate('/portal/teams', { state: { hackathonId: e.id } })}
                >
                  {(e.status || '').toUpperCase() === 'COMPLETED'
                    ? 'Closed'
                    : registrationClosed(e)
                      ? 'Registration closed'
                      : 'Form / join a team'}
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Pagination page={page} totalPages={totalPages} onPrev={prev} onNext={next} />
        </>
      )}
    </div>
  )
}

export default Events
