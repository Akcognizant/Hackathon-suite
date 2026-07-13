// My submissions — status (PENDING / APPROVED / REJECTED) plus any assigned score.

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMySubmissions } from '../../api/participantApi'

const STATUS_STYLES = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-700',
}

function Submissions() {
  const navigate = useNavigate()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMySubmissions()
      .then(setSubmissions)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My submissions</h1>
          <p className="mt-1 text-sm text-slate-500">Track review status and scores for your teams’ projects.</p>
        </div>
        <Link
          to="/portal/submit"
          className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-indigo-700"
        >
          Submit a project
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : submissions.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-slate-500 shadow-sm">
          No submissions yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3">Project</th>
                <th className="px-6 py-3">Team</th>
                <th className="px-6 py-3">Event</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Score</th>
                <th className="px-6 py-3">Repository</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submissions.map((s) => (
                <tr key={s.id} className="align-top">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-800">{s.projectTitle}</p>
                    {s.description && (
                      <p className="mt-1 max-w-xs text-xs text-slate-500 line-clamp-2">{s.description}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{s.teamName}</td>
                  <td className="px-6 py-4 text-slate-600">{s.hackathonTitle}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[s.status] || 'bg-slate-100 text-slate-600'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 tabular-nums text-slate-700">{s.score ?? '—'}</td>
                  <td className="px-6 py-4">
                    <a href={s.repositoryUrl} target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:text-blue-700">
                      View
                    </a>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => navigate('/portal/submit', { state: { teamId: s.teamId } })}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Submissions
