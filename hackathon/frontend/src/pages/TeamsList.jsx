// Talent Scouting Directory — premium card grid of teams (GET /admin/teams/page).
// Each card shows the team's server-computed rank (metallic Top-3 badge), status,
// and score, and opens the TeamScoutingModal slide-over for the full profile +
// internal messaging. Server pagination is preserved (default sort: name asc).

import { useEffect, useState } from 'react'
import axiosClient from '../api/axiosClient'
import CustomDropdown from '../components/ui/CustomDropdown'
import RankBadge from '../components/ui/RankBadge'
import TeamScoutingModal from '../components/TeamScoutingModal'

const PAGE_SIZE = 12

// Mirrors the backend TeamStatus enum. '' == All Statuses (no filter sent).
const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
]

function StatusBadge({ status }) {
  const normalized = status?.toUpperCase() || ''
  let tone = 'border-gray-300 bg-gray-50 text-gray-500'
  if (normalized === 'APPROVED') tone = 'border-green-500 bg-green-50 text-green-700'
  else if (normalized === 'PENDING') tone = 'border-amber-400 bg-amber-50 text-amber-700'
  else if (normalized === 'REJECTED') tone = 'border-red-500 bg-red-50 text-red-700'
  return (
    <span className={`inline-flex rounded-full border px-3 py-0.5 text-xs font-bold uppercase tracking-wide ${tone}`}>
      {status || '—'}
    </span>
  )
}

function TeamCard({ team, onScout }) {
  return (
    <button
      type="button"
      onClick={() => onScout(team)}
      className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <div className="flex items-start justify-between gap-3">
        <RankBadge rank={team.rank} />
        <StatusBadge status={team.status} />
      </div>
      <h3 className="mt-4 text-lg font-bold text-indigo-950">{team.team}</h3>
      <p className="mt-0.5 truncate text-sm text-slate-500">{team.hackathon || 'No hackathon'}</p>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        {/* Score shown as a normalized % (basis of the fair cross-hackathon rank),
            with the raw points alongside for reference. */}
        <span className="text-sm text-slate-500">
          Score:{' '}
          <span className="font-semibold text-slate-800">
            {team.normalizedScore != null ? `${team.normalizedScore}%` : '—'}
          </span>
          {team.score != null && (
            <span className="ml-1 text-xs text-slate-400">({team.score} pts)</span>
          )}
        </span>
        <span className="text-xs font-semibold text-blue-600 transition-transform group-hover:translate-x-0.5">
          View Details →
        </span>
      </div>
    </button>
  )
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex justify-between">
        <div className="h-11 w-11 rounded-full bg-slate-200" />
        <div className="h-5 w-20 rounded-full bg-slate-100" />
      </div>
      <div className="mt-4 h-5 w-2/3 rounded bg-slate-200" />
      <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
      <div className="mt-5 h-3 w-full rounded bg-slate-100" />
    </div>
  )
}

function TeamsList() {
  const [pageData, setPageData] = useState({ content: [], totalElements: 0, totalPages: 0 })
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState('')

  // Debounce the search box so we don't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    let active = true
    setLoading(true) // eslint-disable-line react-hooks/set-state-in-effect
    axiosClient
      .get('/admin/teams/page', {
        params: {
          page,
          size: PAGE_SIZE,
          sort: 'name,asc',
          search: debouncedSearch || undefined,
          status: status || undefined,
        },
      })
      .then((res) => {
        if (active) {
          setPageData(res.data)
          setError('')
        }
      })
      .catch(() => {
        if (active) setError('Failed to load teams. Please try again.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [page, debouncedSearch, status])

  const { content, totalElements, totalPages } = pageData
  const from = totalElements === 0 ? 0 : page * PAGE_SIZE + 1
  const to = Math.min(totalElements, page * PAGE_SIZE + content.length)

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-indigo-950">Talent Scouting Directory</h2>
        <p className="mt-1 text-sm text-slate-500">
          Browse teams by standing. Open a profile to review members and message the team.
        </p>
      </div>

      {/* Filter toolbar — matches Manage Hackathons / Participants */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(0)
          }}
          placeholder="Search by team name…"
          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:max-w-xs"
        />
        <CustomDropdown
          label="Filter by Status"
          options={STATUS_OPTIONS}
          value={status}
          onChange={(value) => {
            setStatus(value)
            setPage(0)
          }}
          className="w-full sm:w-48"
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center text-sm font-medium text-red-600">
          {error}
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : content.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-400">
          {debouncedSearch || status ? 'No teams match your filters.' : 'No teams registered yet.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {content.map((team) => (
            <TeamCard key={team.id} team={team} onScout={setSelectedTeam} />
          ))}
        </div>
      )}

      {/* Pagination footer */}
      {!loading && !error && content.length > 0 && (
        <div className="mt-5 flex flex-col items-center justify-between gap-3 text-sm text-slate-500 sm:flex-row">
          <span className="tabular-nums">
            Showing {from}–{to} of {totalElements}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 0}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="tabular-nums text-slate-600">
              Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <TeamScoutingModal
        open={!!selectedTeam}
        teamId={selectedTeam?.id}
        teamName={selectedTeam?.team}
        onClose={() => setSelectedTeam(null)}
      />
    </div>
  )
}

export default TeamsList
