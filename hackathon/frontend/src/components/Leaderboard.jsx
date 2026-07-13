// Leaderboard — fully data-driven from the backend. Fetches submissions via the
// API, shows only scored ones, ranked descending, filterable by hackathon, with
// a CSV export of the current view. Gold/silver/bronze styling for the top 3.

import { useEffect, useState } from 'react'
import axiosClient from '../api/axiosClient'
import CustomDropdown from './ui/CustomDropdown'

// Per-rank visual treatment for the podium (top 3).
const RANK_STYLES = {
  1: { container: 'border-yellow-400 bg-yellow-50', icon: 'text-yellow-500' },
  2: { container: 'border-slate-300 bg-slate-100', icon: 'text-slate-400' },
  3: { container: 'border-orange-300 bg-orange-50', icon: 'text-orange-400' },
}

function TrophyIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}

function MedalIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15" />
      <circle cx="12" cy="17" r="5" />
      <path d="M12 18v-2h-.5" />
    </svg>
  )
}

function DownloadIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

// Wrap a value in quotes and escape any embedded quotes (CSV-safe).
const escapeCsv = (value) => `"${String(value).replace(/"/g, '""')}"`

function Leaderboard() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedHackathon, setSelectedHackathon] = useState('All')

  // Fetch all submissions once on mount. The axiosClient attaches the JWT and
  // redirects to /login automatically if the session has expired.
  useEffect(() => {
    let active = true
    axiosClient
      .get('/admin/submissions')
      .then((res) => {
        if (active) setSubmissions(res.data)
      })
      .catch(() => {
        if (active) setError('Failed to load submissions. Please try again.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  // Unique hackathon names present in the data, shaped as dropdown options.
  const hackathonOptions = [
    { value: 'All', label: 'All Hackathons' },
    ...[...new Set(submissions.map((item) => item.hackathon).filter(Boolean))].map(
      (name) => ({ value: name, label: name }),
    ),
  ]

  // Sorting engine: scored only → filtered by hackathon → descending by score.
  const displayedLeaderboard = submissions
    .filter((item) => item.score !== null)
    .filter(
      (item) =>
        selectedHackathon === 'All' || item.hackathon === selectedHackathon,
    )
    .sort((a, b) => b.score - a.score)

  const handleExportCSV = () => {
    const headers = ['Rank', 'Team', 'Hackathon', 'Project', 'Score']
    const rows = displayedLeaderboard.map((item, index) =>
      [
        index + 1,
        escapeCsv(item.team),
        escapeCsv(item.hackathon),
        escapeCsv(item.projectTitle),
        item.score,
      ].join(','),
    )
    const csvContent = [headers.join(','), ...rows].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'leaderboard.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-indigo-950">Live Leaderboard</h2>
          <p className="mt-1 text-sm text-slate-500">
            Team rankings by final score.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <CustomDropdown
            ariaLabel="Filter by hackathon"
            options={hackathonOptions}
            value={selectedHackathon}
            onChange={setSelectedHackathon}
            className="w-full sm:w-64"
          />

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={displayedLeaderboard.length === 0}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <DownloadIcon className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm font-medium text-slate-500 shadow-sm">
          Loading leaderboard…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-10 text-center text-sm font-medium text-red-600 shadow-sm">
          {error}
        </div>
      ) : displayedLeaderboard.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm font-medium text-slate-500 shadow-sm">
          No scored submissions yet. Assign scores in Score Management to
          populate the leaderboard.
        </div>
      ) : (
        <ul className="space-y-3">
          {displayedLeaderboard.map((item, index) => {
            const rank = index + 1
            const podium = RANK_STYLES[rank]
            const containerTone = podium
              ? podium.container
              : 'border-gray-100 bg-white'

            return (
              <li
                key={item.id}
                className={`flex items-center gap-4 rounded-2xl border p-4 shadow-sm transition-colors ${containerTone}`}
              >
                {/* Rank / medal */}
                <div className="flex w-12 shrink-0 items-center justify-center">
                  {podium ? (
                    rank === 1 ? (
                      <TrophyIcon className={`h-8 w-8 ${podium.icon}`} />
                    ) : (
                      <MedalIcon className={`h-8 w-8 ${podium.icon}`} />
                    )
                  ) : (
                    <span className="text-lg font-bold text-slate-400">
                      #{rank}
                    </span>
                  )}
                </div>

                {/* Team info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">
                    {item.team}
                  </p>
                  <p className="truncate text-sm text-slate-500">
                    {item.projectTitle}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {item.hackathon}
                  </p>
                </div>

                {/* Score */}
                <div className="shrink-0 text-right">
                  <p className="text-3xl font-extrabold text-slate-900 tabular-nums sm:text-4xl">
                    {item.score}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    points
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default Leaderboard
