// My submissions — a slim worklist (project · event · team · status). Clicking a
// row opens a right slide-over with the full details: description, repository,
// score, the judges' response, and a link to the event leaderboard. Edit lives at
// the far right of the panel and is disabled once the hackathon is over.

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMySubmissions, getEvents } from '../../api/participantApi'
import { SUBMISSION_STATUS_STYLES, submissionDisplayStatus } from '../../utils/submissionState'
import Pagination from '../../components/ui/Pagination'
import { usePagination } from '../../utils/usePagination'

const STATUS_STYLES = SUBMISSION_STATUS_STYLES

function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  )
}

function Submissions() {
  const navigate = useNavigate()
  const [submissions, setSubmissions] = useState([])
  const [eventsById, setEventsById] = useState({})
  const [loading, setLoading] = useState(true)
  const { page, totalPages, pageItems, next, prev } = usePagination(submissions, 8)

  // Slide-over detail panel (+ enter/leave animation).
  const [selected, setSelected] = useState(null)
  const [panelIn, setPanelIn] = useState(false)

  useEffect(() => {
    if (!selected) return undefined
    const r = requestAnimationFrame(() => setPanelIn(true))
    return () => cancelAnimationFrame(r)
  }, [selected])

  const closePanel = () => {
    setPanelIn(false)
    setTimeout(() => setSelected(null), 250)
  }

  useEffect(() => {
    Promise.all([getMySubmissions(), getEvents()])
      .then(([subs, events]) => {
        setSubmissions(subs)
        const map = {}
        for (const e of events) map[String(e.id)] = e
        setEventsById(map)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // A hackathon is over once it's COMPLETED or its end date has passed — editing
  // a submission is no longer allowed after that.
  const today = new Date().toISOString().slice(0, 10)
  const isOver = (hackathonId) => {
    const e = eventsById[String(hackathonId)]
    if (!e) return false
    return (e.status || '').toUpperCase() === 'COMPLETED' || (e.endDate && e.endDate < today)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My submissions</h1>
            <p className="mt-1 text-sm text-slate-500">Select a submission to see its full details, score, and the judges’ response.</p>
          </div>
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
                <th className="px-6 py-3">Event</th>
                <th className="px-6 py-3">Team</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageItems.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className="cursor-pointer transition-colors hover:bg-slate-50"
                >
                  <td className="px-6 py-4 font-medium text-slate-800">{s.projectTitle}</td>
                  <td className="px-6 py-4 text-slate-600">{s.hackathonTitle}</td>
                  <td className="px-6 py-4 text-slate-600">{s.teamName}</td>
                  <td className="px-6 py-4"><StatusBadge status={submissionDisplayStatus(s)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} onPrev={prev} onNext={next} className="mb-4" />
        </div>
      )}

      {/* ---------- Detail slide-over ---------- */}
      {selected && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Submission details">
          <div
            className={`absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 ${panelIn ? 'opacity-100' : 'opacity-0'}`}
            onClick={closePanel}
          />
          <div
            className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-slate-50 shadow-2xl transition-transform duration-300 ease-out ${panelIn ? 'translate-x-0' : 'translate-x-full'}`}
          >
            {/* Header — gradient banner with the project + status */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 px-6 pb-6 pt-5 text-white">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-200">{selected.hackathonTitle}</p>
                  <h2 className="mt-1 truncate text-xl font-bold">{selected.projectTitle}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-blue-100">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    {selected.teamName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closePanel}
                  aria-label="Close"
                  className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" /></svg>
                </button>
              </div>
            </div>

            {/* Summary strip — status + score, just below the banner */}
            <div className="px-6 pt-4">
              <div className="flex items-stretch gap-3">
                <div className="flex flex-1 flex-col justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Status</span>
                  <div className="mt-1"><StatusBadge status={submissionDisplayStatus(selected)} /></div>
                </div>
                <div className="flex flex-1 flex-col justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Score</span>
                  <span className="mt-0.5 text-2xl font-extrabold tabular-nums text-indigo-950">
                    {selected.score ?? <span className="text-sm font-medium text-slate-400">Not scored</span>}
                  </span>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Description</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{selected.description || '—'}</p>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Repository</p>
                {selected.repositoryUrl ? (
                  <a href={selected.repositoryUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 break-all text-sm font-medium text-blue-600 hover:text-blue-700">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                    {selected.repositoryUrl}
                  </a>
                ) : (
                  <p className="text-sm text-slate-400">—</p>
                )}
              </section>

              <section className={`rounded-2xl border p-4 shadow-sm ${selected.feedback ? 'border-blue-200 bg-blue-50/60' : 'border-slate-200 bg-white'}`}>
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  Response from judges
                </p>
                {selected.feedback ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{selected.feedback}</p>
                ) : (
                  <p className="text-sm italic text-slate-400">No response yet.</p>
                )}
              </section>

              {selected.aiFeedback && (
                <section className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 shadow-sm">
                  <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-indigo-500">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 5.8H20l-4.9 3.6 1.9 5.8L12 14.6 6.9 18.2l1.9-5.8L4 8.8h6.1z" /></svg>
                    AI review{selected.aiScore != null ? ` · ${selected.aiScore}/10` : ''}
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{selected.aiFeedback}</p>
                </section>
              )}

            </div>

            {/* Footer — Edit at the far right, disabled once the hackathon is over */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-4">
              <button
                type="button"
                onClick={closePanel}
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
              >
                Close
              </button>
              <button
                type="button"
                disabled={isOver(selected.hackathonId)}
                onClick={() => navigate('/portal/submit', { state: { teamId: selected.teamId } })}
                title={isOver(selected.hackathonId) ? 'The hackathon is over — editing is closed.' : undefined}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
                Edit submission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Submissions
