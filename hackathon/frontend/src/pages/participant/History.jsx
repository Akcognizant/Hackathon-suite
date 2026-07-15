// History — every completed hackathon, with the participant's outcome.
// If they didn't take part, it's shown as "Did not participate"; otherwise their
// team, submission status, rank and score are shown.

import { useEffect, useState } from 'react'
import { getHistory } from '../../api/participantApi'

function medal(rank) {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return null
}

const SUB_STATUS_STYLES = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-700',
}

function History() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getHistory()
      .then(setRows)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const q = search.trim().toLowerCase()
  const filtered = q
    ? rows.filter((r) =>
        [r.hackathonTitle, r.teamName, r.projectTitle]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(q)),
      )
    : rows

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">History</h1>
          <p className="mt-1 text-sm text-slate-500">All completed hackathons and where you stood.</p>
        </div>
        {rows.length > 0 && (
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hackathons…"
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:w-64"
          />
        )}
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-slate-500 shadow-sm">
          No completed hackathons yet.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-slate-500 shadow-sm">
          No hackathons match your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {filtered.map((r, i) => (
            <div key={`${r.hackathonId}-${i}`} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="text-lg font-semibold text-slate-900">{r.hackathonTitle}</h3>
                {r.participated ? (
                  r.ranking != null ? (
                    <span className="shrink-0 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-800">
                      {medal(r.ranking) || `#${r.ranking}`}
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                      Participated
                    </span>
                  )
                ) : (
                  <span className="shrink-0 rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    Did not participate
                  </span>
                )}
              </div>

              {r.participated ? (
                <>
                  <p className="text-sm text-slate-600">Team: <span className="font-medium">{r.teamName}</span></p>
                  {r.projectTitle && <p className="text-sm text-slate-600">Project: {r.projectTitle}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                    {r.submissionStatus && (
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${SUB_STATUS_STYLES[r.submissionStatus] || 'bg-slate-100 text-slate-600'}`}>
                        {r.submissionStatus}
                      </span>
                    )}
                    <span>Rank: <span className="font-semibold text-slate-800">{r.ranking != null ? `#${r.ranking}` : 'Not ranked'}</span></span>
                    <span>Score: <span className="font-semibold text-slate-800">{r.score ?? '—'}</span></span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">You didn’t take part in this hackathon.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default History
