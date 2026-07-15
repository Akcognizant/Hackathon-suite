// History — every completed hackathon, with the participant's outcome, shown as a
// table. If they didn't take part, the row is marked "Did not participate".

import { useEffect, useState } from 'react'
import { getHistory } from '../../api/participantApi'
import { formatDateRange } from '../../utils/dates'
import Pagination from '../../components/ui/Pagination'
import { usePagination } from '../../utils/usePagination'

function History() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // ALL | PARTICIPATED | NOT

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
        <div>
          <h1 className="text-2xl font-bold text-slate-900">History</h1>
          <p className="mt-1 text-sm text-slate-500">All completed hackathons and where you stood.</p>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-sm text-slate-500">
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
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPrev={prev} onNext={next} className="mb-4" />
        </div>
      )}
    </div>
  )
}

export default History
