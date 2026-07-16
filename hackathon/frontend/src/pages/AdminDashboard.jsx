// Admin dashboard — fully data-driven from the backend: summary metrics derived
// from the live submissions array, a pure-Tailwind bar chart (participants per
// hackathon), and a paginated Recent Activity feed backed by the activities API.

import { useEffect, useState } from 'react'
import axiosClient from '../api/axiosClient'
import Button from '../components/ui/Button'
import { useToast } from '../context/ToastContext'

const MEMBERS_PER_TEAM = 3
const ACTIVITY_PAGE_SIZE = 5

// Pulsing red alert dot for "action required" metrics.
function PulseDot() {
  return (
    <span className="relative ml-2 inline-flex h-3 w-3 align-middle">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
      <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
    </span>
  )
}

/* ------------------------------ UI helpers ------------------------------ */

// Format a real ISO timestamp (from the Activity table) as a relative label.
function relativeTime(iso) {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const mins = Math.floor((Date.now() - then) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'} ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

// Map an activity type to its timeline dot colour.
function dotForType(type) {
  switch (type) {
    case 'SCORE_ASSIGNED':
      return 'bg-green-500'
    case 'SUBMISSION_APPROVED':
      return 'bg-blue-500'
    case 'SUBMISSION_REJECTED':
      return 'bg-red-500'
    case 'HACKATHON_CREATED':
      return 'bg-indigo-500'
    case 'HACKATHON_UPDATED':
      return 'bg-amber-500'
    case 'HACKATHON_DELETED':
      return 'bg-rose-600'
    case 'TEAM_REGISTERED':
      return 'bg-cyan-500'
    case 'PARTICIPANTS_IMPORTED':
      return 'bg-teal-500'
    default:
      return 'bg-slate-400'
  }
}

// Derive avatar initials from an activity line (display only — no data change):
// picks the last two capitalized words (usually the team/subject).
function activityInitials(text) {
  const caps = (text || '').split(/\s+/).filter((w) => /^[A-Z]/.test(w))
  const picked = caps.slice(-2)
  const initials = picked.map((w) => w[0]).join('')
  return (initials || 'AD').slice(0, 2).toUpperCase()
}

function TrophyIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}

function UsersIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function ClockIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function WarningTriangleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function AdminDashboard() {
  const [data, setData] = useState([])
  const [activities, setActivities] = useState([])
  const [activityPage, setActivityPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [showClearModal, setShowClearModal] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { showToast } = useToast()

  // Fetch live submissions (metrics/chart) and the first page of the activity
  // feed once on mount. The component remounts on every navigation back to the
  // dashboard, so a freshly assigned score shows up the next time you land here.
  useEffect(() => {
    let active = true
    Promise.all([
      axiosClient.get('/admin/submissions'),
      // The feed is best-effort: if it fails, show an empty (not broken) feed.
      axiosClient
        .get(`/admin/activities?page=0&size=${ACTIVITY_PAGE_SIZE}`)
        .catch(() => ({ data: { items: [], hasMore: false } })),
    ])
      .then(([submissionsRes, activitiesRes]) => {
        if (!active) return
        setData(submissionsRes.data)
        const payload = activitiesRes.data
        setActivities(payload.items ?? [])
        setHasMore(Boolean(payload.hasMore))
        setActivityPage(0)
      })
      .catch(() => {
        if (active) setError('Failed to load dashboard data. Please try again.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  // Fetch the next page and APPEND it to the existing list (don't replace).
  const handleLoadMore = async () => {
    const nextPage = activityPage + 1
    setLoadingMore(true)
    try {
      const { data: payload } = await axiosClient.get(
        `/admin/activities?page=${nextPage}&size=${ACTIVITY_PAGE_SIZE}`,
      )
      setActivities((prev) => [...prev, ...(payload.items ?? [])])
      setHasMore(Boolean(payload.hasMore))
      setActivityPage(nextPage)
    } catch {
      showToast('Failed to load more activity. Please try again.', 'error')
    } finally {
      setLoadingMore(false)
    }
  }

  // Admin-only: clear the entire audit log, then reset the feed locally.
  const handleClearAll = async () => {
    setClearing(true)
    try {
      await axiosClient.delete('/admin/activities')
      setActivities([])
      setHasMore(false)
      setActivityPage(0)
      setShowClearModal(false)
      showToast('Activity log cleared.', 'success')
    } catch (err) {
      const message =
        err.response?.status === 403
          ? 'Only admins can clear the activity log.'
          : 'Failed to clear the activity log. Please try again.'
      showToast(message, 'error')
    } finally {
      setClearing(false)
    }
  }

  // Close the confirm modal on Escape (unless a clear is in flight).
  useEffect(() => {
    if (!showClearModal) return
    function handleKey(event) {
      if (event.key === 'Escape' && !clearing) setShowClearModal(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [showClearModal, clearing])

  const uniqueHackathons = [...new Set(data.map((d) => d.hackathon).filter(Boolean))]

  // --- Stat-card metrics, all derived directly from the live submissions array ---
  const totalSubmissions = data.length
  const pendingCount = data.filter(
    (d) => d.status?.toUpperCase() === 'PENDING',
  ).length
  const scoredCount = data.filter(
    (d) => d.score !== null && d.score !== undefined,
  ).length

  // Participants per hackathon = (teams in that hackathon) × members per team.
  const participantsPerHackathon = uniqueHackathons.map((name) => {
    const teams = new Set(
      data.filter((d) => d.hackathon === name).map((d) => d.team),
    )
    return { name, count: teams.size * MEMBERS_PER_TEAM }
  })
  const maxCount = Math.max(...participantsPerHackathon.map((p) => p.count), 1)

  // The feed reflects ONLY real, persisted activities (actual user actions),
  // accumulated across the pages loaded so far via "Load More".
  const recentActivity = activities.map((a) => ({
    id: a.id,
    text: a.message,
    dot: dotForType(a.type),
    time: relativeTime(a.createdAt),
  }))

  const stats = [
    {
      title: 'Total Submissions',
      value: totalSubmissions,
      Icon: UsersIcon,
      tone: { grad: 'from-blue-500 to-indigo-600', bar: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/30' },
    },
    {
      title: 'Pending Reviews',
      value: (
        <span className="inline-flex items-center">
          {pendingCount}
          {pendingCount > 0 && <PulseDot />}
        </span>
      ),
      Icon: ClockIcon,
      tone: { grad: 'from-amber-400 to-orange-500', bar: 'from-amber-400 to-orange-500', shadow: 'shadow-amber-500/30' },
    },
    {
      title: 'Scored',
      value: scoredCount,
      Icon: TrophyIcon,
      tone: { grad: 'from-emerald-500 to-teal-600', bar: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/30' },
    },
  ]

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-center gap-3">
        <span className="h-9 w-1.5 rounded-full bg-gradient-to-b from-blue-600 to-indigo-600" />
        <div>
          <h2 className="text-2xl font-bold text-indigo-950">Dashboard</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Overview of hackathon activity across the portal.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-10 text-center text-sm font-medium text-red-600 shadow-sm">
          {error}
        </div>
      ) : loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm font-medium text-slate-500 shadow-sm">
          Loading dashboard…
        </div>
      ) : (
        <>
          {/* Smart metric cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat) => {
              const Icon = stat.Icon
              return (
                <div
                  key={stat.title}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  {/* Top accent bar */}
                  <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.tone.bar}`} />

                  <div className="relative flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                      <span className="mt-2 block text-4xl font-extrabold tracking-tight tabular-nums text-slate-900">
                        {stat.value}
                      </span>
                    </div>
                    {/* Gradient icon chip */}
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg ${stat.tone.grad} ${stat.tone.shadow} transition-transform duration-300 group-hover:scale-110`}
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Chart + activity feed — stacked on mobile, side-by-side on desktop */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Bar chart */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-black/5">
              <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-slate-900">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  <UsersIcon className="h-4 w-4" />
                </span>
                Participants per Hackathon
              </h3>
              {participantsPerHackathon.length === 0 ? (
                <p className="text-sm text-slate-400">No hackathon data yet.</p>
              ) : (
                <div className="space-y-4">
                  {participantsPerHackathon.map((item) => (
                    <div key={item.name}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">{item.name}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-600">
                          {item.count}
                        </span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 shadow-[0_1px_6px_rgba(37,99,235,0.4)] transition-all duration-700 ease-out"
                          style={{ width: `${(item.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent activity timeline */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-black/5">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-white">
                    <ClockIcon className="h-4 w-4" />
                  </span>
                  Recent Activity
                </h3>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowClearModal(true)}
                  disabled={recentActivity.length === 0}
                >
                  Clear All
                </Button>
              </div>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-slate-400">No recent activity.</p>
              ) : (
                <>
                  <ol className="relative space-y-6">
                    {/* Continuous polished timeline line */}
                    <span
                      aria-hidden="true"
                      className="absolute bottom-3 left-[17px] top-3 w-px bg-slate-200"
                    />
                    {recentActivity.map((event) => (
                      <li key={event.id} className="relative flex items-start gap-4">
                        <span
                          className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ring-4 ring-white ${event.dot}`}
                        >
                          {activityInitials(event.text)}
                        </span>
                        <div className="flex flex-1 items-start justify-between gap-3 pt-1.5">
                          <p className="text-sm text-slate-700">{event.text}</p>
                          <span className="shrink-0 whitespace-nowrap text-xs text-slate-400">
                            {event.time}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ol>

                  {hasMore && (
                    <div className="mt-6 flex justify-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleLoadMore}
                        isLoading={loadingMore}
                      >
                        {loadingMore ? 'Loading…' : 'Load More'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ---------- Clear-all confirmation modal ---------- */}
      {showClearModal && (
        <div
          onClick={!clearing ? () => setShowClearModal(false) : undefined}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-activity-title"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center gap-2">
              <WarningTriangleIcon className="h-6 w-6 shrink-0 text-red-500" />
              <h3 id="clear-activity-title" className="text-xl font-bold text-slate-900">
                Confirm Action
              </h3>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              This will permanently delete all activity logs. Continue?
            </p>
            <div className="mt-8 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowClearModal(false)}
                disabled={clearing}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={handleClearAll} isLoading={clearing}>
                {clearing ? 'Clearing…' : 'Clear All'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
