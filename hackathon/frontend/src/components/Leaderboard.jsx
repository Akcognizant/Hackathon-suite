// Admin/judge leaderboard — data-driven from /admin/submissions, presented with
// the shared DataTable (same look + pagination as Manage Hackathons). Scored
// submissions ranked by score, filterable by hackathon, searchable, with CSV export.

import { useEffect, useMemo, useState } from 'react'
import axiosClient from '../api/axiosClient'
import Button from './ui/Button'
import CustomDropdown from './ui/CustomDropdown'
import DataTable from './ui/DataTable'

const PAGE_SIZE = 10

// Metallic circular badge for the top 3; muted numeric chip for the rest.
function RankCell({ rank }) {
  if (rank <= 3) {
    const grad =
      rank === 1 ? 'from-yellow-400 to-amber-500' : rank === 2 ? 'from-slate-300 to-slate-400' : 'from-orange-400 to-amber-600'
    const glow =
      rank === 1 ? 'shadow-amber-400/40' : rank === 2 ? 'shadow-slate-400/40' : 'shadow-orange-400/40'
    return (
      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${grad} text-sm font-black text-white shadow-md ${glow}`}>
        {rank}
      </span>
    )
  }
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold tabular-nums text-slate-500">
      {rank}
    </span>
  )
}

function initials(name) {
  if (!name) return '—'
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

// Distinct avatar tint per team so the roster reads at a glance.
function avatarTone(name) {
  const tones = [
    'bg-blue-100 text-blue-700',
    'bg-indigo-100 text-indigo-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-purple-100 text-purple-700',
  ]
  let h = 0
  for (let i = 0; i < (name || '').length; i += 1) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return tones[h % tones.length]
}

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
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

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

  // Scored → filtered by hackathon → ranked by score desc.
  const ranked = useMemo(() => {
    return submissions
      .filter((s) => s.score !== null && s.score !== undefined)
      .filter((s) => selectedHackathon === 'All' || s.hackathon === selectedHackathon)
      .sort((a, b) => b.score - a.score)
      .map((s, i) => ({ id: s.id, rank: i + 1, team: s.team, projectTitle: s.projectTitle, hackathon: s.hackathon, score: s.score }))
  }, [submissions, selectedHackathon])

  // Search filter (kept off the rank so positions stay stable).
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return ranked
    return ranked.filter((r) => [r.team, r.projectTitle, r.hackathon].some((v) => (v || '').toLowerCase().includes(q)))
  }, [ranked, search])

  // Reset to page 0 whenever the filter/search changes.
  useEffect(() => { setPage(0) }, [selectedHackathon, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  const handleExportCSV = () => {
    const headers = ['Rank', 'Team', 'Hackathon', 'Project', 'Score']
    const rows = filtered.map((e) => [e.rank, escapeCsv(e.team), escapeCsv(e.hackathon), escapeCsv(e.projectTitle), e.score].join(','))
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

  const columns = [
    { key: 'rank', header: 'Rank', render: (r) => <RankCell rank={r.rank} /> },
    {
      key: 'team',
      header: 'Team',
      render: (r) => (
        <div className="flex items-center gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarTone(r.team)}`}>
            {initials(r.team)}
          </span>
          <span className="font-semibold text-slate-900">{r.team}</span>
        </div>
      ),
    },
    { key: 'projectTitle', header: 'Project', render: (r) => r.projectTitle || <span className="italic text-slate-400">—</span> },
    { key: 'hackathon', header: 'Hackathon', render: (r) => <span className="text-slate-500">{r.hackathon}</span> },
    {
      key: 'score',
      header: 'Score',
      align: 'right',
      render: (r) => (
        <span className="inline-flex items-baseline gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-base font-extrabold tabular-nums text-indigo-700">
          {r.score}
          <span className="text-[10px] font-semibold uppercase text-indigo-400">pts</span>
        </span>
      ),
    },
  ]

  // Subtle metallic tint for the podium rows (works regardless of page).
  const rowClassName = (r) =>
    r.rank === 1
      ? 'bg-amber-50/60'
      : r.rank === 2
        ? 'bg-slate-50/70'
        : r.rank === 3
          ? 'bg-orange-50/50'
          : ''

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-indigo-950">Live Leaderboard</h2>
          <p className="mt-1 text-sm text-slate-500">Team rankings by final score.</p>
        </div>
        <Button variant="secondary" onClick={handleExportCSV} disabled={filtered.length === 0}>
          <DownloadIcon className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Filter toolbar — same pattern as Manage Hackathons */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by team or project…"
          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:max-w-xs"
        />
        <CustomDropdown
          ariaLabel="Filter by hackathon"
          options={hackathonOptions}
          value={selectedHackathon}
          onChange={setSelectedHackathon}
          className="w-full sm:w-64"
        />
      </div>

      <DataTable
        columns={columns}
        data={pageRows}
        rowKey="id"
        loading={loading}
        error={error}
        emptyMessage="No scored submissions yet. Assign scores in Score Management to populate the leaderboard."
        page={safePage}
        totalPages={totalPages}
        totalElements={filtered.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        rowClassName={rowClassName}
      />
    </div>
  )
}

export default Leaderboard
