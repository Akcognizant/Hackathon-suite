// Admin/judge leaderboard — data-driven from /admin/submissions. Shows scored
// submissions ranked by score, filterable by hackathon, searchable + paginated
// (via LeaderboardBoard), with a CSV export of the current ranking.

import { useEffect, useMemo, useState } from 'react'
import axiosClient from '../api/axiosClient'
import CustomDropdown from './ui/CustomDropdown'
import LeaderboardBoard from './leaderboard/LeaderboardBoard'

function DownloadIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`

function Leaderboard() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedHackathon, setSelectedHackathon] = useState('All')

  useEffect(() => {
    let active = true
    axiosClient
      .get('/admin/submissions')
      .then((res) => { if (active) setSubmissions(res.data) })
      .catch(() => { if (active) setError('Failed to load submissions. Please try again.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const hackathonOptions = [
    { value: 'All', label: 'All Hackathons' },
    ...[...new Set(submissions.map((s) => s.hackathon).filter(Boolean))].map((name) => ({ value: name, label: name })),
  ]

  // Scored → filtered by hackathon → ranked by score desc → mapped to board entries.
  const ranked = useMemo(() => {
    return submissions
      .filter((s) => s.score !== null && s.score !== undefined)
      .filter((s) => selectedHackathon === 'All' || s.hackathon === selectedHackathon)
      .sort((a, b) => b.score - a.score)
      .map((s, i) => ({
        id: s.id,
        rank: i + 1,
        name: s.team,
        subtitle: s.projectTitle,
        meta: s.hackathon,
        score: s.score,
      }))
  }, [submissions, selectedHackathon])

  const handleExportCSV = () => {
    const headers = ['Rank', 'Team', 'Hackathon', 'Project', 'Score']
    const rows = ranked.map((e) => [e.rank, escapeCsv(e.name), escapeCsv(e.meta), escapeCsv(e.subtitle), e.score].join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
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
          <p className="mt-1 text-sm text-slate-500">Team rankings by final score.</p>
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
            disabled={ranked.length === 0}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <DownloadIcon className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      <LeaderboardBoard
        entries={ranked}
        loading={loading}
        error={error}
        emptyMessage="No scored submissions yet. Assign scores in Score Management to populate the leaderboard."
      />
    </div>
  )
}

export default Leaderboard
