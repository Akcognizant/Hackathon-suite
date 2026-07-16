// History — every completed hackathon, with the participant's outcome, shown as a
// table. If they didn't take part, the row is marked "Did not participate".

import { useEffect, useState } from 'react'
import { getHistory, getLeaderboard } from '../../api/participantApi'
import { formatDateRange } from '../../utils/dates'
import Pagination from '../../components/ui/Pagination'
import { usePagination } from '../../utils/usePagination'

function History() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // ALL | PARTICIPATED | NOT

  // Leaderboard modal — opened per history row.
  const [lbEvent, setLbEvent] = useState(null) // { hackathonId, hackathonTitle, teamName }
  const [lbRows, setLbRows] = useState([])
  const [lbLoading, setLbLoading] = useState(false)
  const [lbError, setLbError] = useState('')

  const openLeaderboard = (r) => {
    setLbEvent(r)
    setLbRows([])
    setLbError('')
    setLbLoading(true)
    getLeaderboard(r.hackathonId)
      .then(setLbRows)
      .catch(() => setLbError('Failed to load the leaderboard.'))
      .finally(() => setLbLoading(false))
  }

  useEffect(() => {
    getHistory()
      .then(setRows)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const q = search.trim().toLowerCase()
  const filtered = rows
    .filter((r) => !q || (r.hackathonTitle || '').toLowerCase().includes(q))
    .filter((r) =>
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'PARTICIPATED'
          ? r.participated
          : !r.participated,
    )

  const { page, totalPages, pageItems, next, prev } = usePagination(filtered, 10)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v13H3V8" /><rect x="1" y="3" width="22" height="5" rx="1" /><line x1="10" y1="12" x2="14" y2="12" /></svg>
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">History</h1>
            <p className="mt-1 text-sm text-slate-500">All completed hackathons and where you stood.</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by event…"
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:w-56"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:w-48"
          >
            <option value="ALL">All statuses</option>
            <option value="PARTICIPATED">Participated</option>
            <option value="NOT">Not participated</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3">Event</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Leaderboard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">
                      No data available
                    </td>
                  </tr>
                ) : (
                  pageItems.map((r, i) => (
                  <tr key={`${r.hackathonId}-${i}`} className="align-top">
                    <td className="px-6 py-4 font-medium text-slate-800">{r.hackathonTitle}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {formatDateRange(r.startDate, r.endDate, { withYear: true }) || '—'}
                    </td>
                    <td className="px-6 py-4">
                      {r.participated ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                          Participated
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          Not participated
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {r.participated ? (
                        <button
                          type="button"
                          onClick={() => openLeaderboard(r)}
                          className="font-medium text-blue-600 hover:text-blue-700"
                        >
                          View
                        </button>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPrev={prev} onNext={next} className="mb-4" />
        </div>
      )}

      {/* Leaderboard modal for a single hackathon */}
      {lbEvent && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm" onClick={() => setLbEvent(null)} aria-hidden="true" />
          <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
            <div role="dialog" aria-modal="true" className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">{lbEvent.hackathonTitle} — Leaderboard</h2>
                  <p className="mt-0.5 text-xs text-slate-500">Final standings for this hackathon.</p>
                </div>
                <button type="button" onClick={() => setLbEvent(null)} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
              <div className="overflow-y-auto p-5">
                {lbLoading ? (
                  <p className="py-6 text-center text-sm text-slate-400">Loading…</p>
                ) : lbError ? (
                  <p className="py-6 text-center text-sm text-red-600">{lbError}</p>
                ) : lbRows.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-500">No scores have been published for this event yet.</p>
                ) : (
                  <table className="min-w-full divide-y divide-slate-100 text-sm">
                    <thead className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="py-2 pr-4">Rank</th>
                        <th className="py-2 pr-4">Team</th>
                        <th className="py-2 pr-4">Project</th>
                        <th className="py-2 text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lbRows.map((row) => {
                        const isYou = lbEvent.teamName && row.team === lbEvent.teamName
                        return (
                          <tr key={row.rank} className={isYou ? 'bg-blue-50/70' : ''}>
                            <td className="py-2 pr-4 font-bold tabular-nums text-slate-700">#{row.rank}</td>
                            <td className="py-2 pr-4 font-medium text-slate-900">
                              {row.team}
                              {isYou && <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">You</span>}
                            </td>
                            <td className="py-2 pr-4 text-slate-600">{row.projectTitle || '—'}</td>
                            <td className="py-2 text-right font-extrabold tabular-nums text-indigo-950">{row.score}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default History
