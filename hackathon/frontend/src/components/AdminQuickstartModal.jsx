// Admin Quickstart — an in-app getting-started guide opened from Help & Resources.
// Replaces the old window.open('/docs') (which had no route and bounced to the
// dashboard). Each step links straight to the relevant admin section.

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePermissions } from '../hooks/usePermissions'

const STEPS = [
  {
    title: 'Create a hackathon',
    body: 'Go to Manage Hackathons → “Create New Hackathon”. Set the title, description, dates and team size. The status (Upcoming / Active / Completed) is derived automatically from the dates.',
    to: '/hackathons',
    action: 'Open Manage Hackathons',
    adminOnly: true,
  },
  {
    title: 'Define evaluation criteria',
    body: 'On Manage Hackathons, expand a hackathon row to add its rubric criteria and max points. Scores are later normalized against this maximum for fair cross-event ranking.',
    to: '/hackathons',
    action: 'Set criteria',
    adminOnly: true,
  },
  {
    title: 'Onboard participants & teams',
    body: 'View registered participants and teams under Participants. Participants join via the assessment portal SSO and form teams within each event’s size limits.',
    to: '/participants',
    action: 'Open Participants',
  },
  {
    title: 'Review submissions',
    body: 'Track every project under Submissions. Approve or reject entries, and open a submission to inspect its repository and details.',
    to: '/submissions',
    action: 'Open Submissions',
  },
  {
    title: 'Score & evaluate',
    body: 'Assign rubric scores in Score Management. Use AI-assisted scoring for a consistent first pass, then finalize. Individual talent can be rated too.',
    to: '/scores',
    action: 'Open Score Management',
  },
  {
    title: 'Track standings',
    body: 'The Leaderboard ranks teams by their normalized score (percentage of each hackathon’s max), so events with different rubrics compare fairly.',
    to: '/leaderboard',
    action: 'Open Leaderboard',
  },
  {
    title: 'Scout talent',
    body: 'The Talent Scouting directory ranks teams and surfaces high-performing participants, with search, pagination and CSV export.',
    to: '/teams',
    action: 'Open Talent Scouting',
  },
  {
    title: 'Communicate',
    body: 'Use the bell (top-right) to message individual judges or broadcast announcements to all participants. Unread messages show a red badge.',
    to: null,
    action: null,
  },
  {
    title: 'Approve access requests',
    body: 'New admin/judge accounts request access; approve or reject them under Access Requests. A badge shows how many are pending.',
    to: '/access-requests',
    action: 'Open Access Requests',
    adminOnly: true,
  },
]

export default function AdminQuickstartModal({ open, onClose }) {
  const navigate = useNavigate()
  const { isAdmin } = usePermissions()

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const steps = STEPS.filter((s) => !s.adminOnly || isAdmin)

  const go = (to) => {
    onClose?.()
    navigate(to)
  }

  return (
    <div
      onClick={() => onClose?.()}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Admin Quickstart"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 bg-gradient-to-r from-indigo-950 via-blue-900 to-blue-800 px-6 py-4 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-base font-bold leading-tight">Admin Quickstart</p>
            <p className="text-[11px] text-blue-200">Run the portal end to end in {steps.length} steps</p>
          </div>
          <button
            type="button"
            onClick={() => onClose?.()}
            aria-label="Close"
            className="ml-auto rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Steps */}
        <ol className="flex-1 space-y-4 overflow-y-auto p-6">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                <p className="mt-0.5 text-sm leading-snug text-slate-600">{step.body}</p>
                {step.to && step.action && (
                  <button
                    type="button"
                    onClick={() => go(step.to)}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700"
                  >
                    {step.action}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                )}
              </div>
            </li>
          ))}
        </ol>

        <div className="shrink-0 border-t border-slate-100 bg-slate-50/60 px-6 py-3 text-center text-xs text-slate-400">
          Tip: the AI Navigator (top bar) can answer questions anytime.
        </div>
      </div>
    </div>
  )
}
