// Participant leaderboard — ranked standings for an event the participant is in,
// presented with the shared DataTable (same look + pagination as the admin pages).
// The participant's own team row is highlighted, and their rank is always shown.

import { useEffect, useMemo, useState } from 'react'
import CustomDropdown from '../../components/ui/CustomDropdown'
import DataTable from '../../components/ui/DataTable'
import { getMyTeams, getLeaderboard } from '../../api/participantApi'

const PAGE_SIZE = 10

function RankCell({ rank }) {
  const tone = rank === 1 ? 'text-amber-600' : rank === 2 ? 'text-slate-500' : rank === 3 ? 'text-orange-600' : 'text-slate-400'
  return (
    <span className="inline-flex items-center gap-1.5">
      {rank <= 3 && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 ${tone}`} aria-hidden="true">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      )}
      <span className={`font-bold tabular-nums ${tone}`}>#{rank}</span>
    </span>
  )
}

function Leaderboard() {
  const [myTeams, setMyTeams] = useState([])
  const [eventId, setEventId] = useState('')
  const [rows, setRows] = useState([])
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  useEffect(() => {
    let active = true
    getMyTeams()
      .then((teams) => {
        if (!active) return
        setMyTeams(teams)
        const first = teams.find((t) => t.hackathonId != null)
        if (first) setEventId(String(first.hackathonId))
      })
      .catch(() => { if (active) setError('Failed to load your events.') })
      .finally(() => { if (active) setLoadingTeams(false) })
    return () => { active = false }
  }, [])

  const eventOptions = useMemo(() => {
    const seen = new Map()
    myTeams.forEach((t) => {
      if (t.hackathonId != null && !seen.has(t.hackathonId)) seen.set(t.hackathonId, t.hackathonTitle || `Event ${t.hackathonId}`)
    })
    return [...seen.entries()].map(([id, title]) => ({ value: String(id), label: title }))
  }, [myTeams])

  const myTeamName = useMemo(() => {
    const mine = myTeams.find((t) => String(t.hackathonId) === String(eventId))
    return mine?.name || null
  }, [myTeams, eventId])

  useEffect(() => {
    if (!eventId) return undefined
    let active = true
    setLoading(true)
    setError('')
    getLeaderboard(eventId)
      .then((data) => { if (active) setRows(data) })
      .catch(() => { if (active) setError('Failed to load the leaderboard.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [eventId])

  useEffect(() => { setPage(0) }, [eventId, search])

  // Rank rows + flag the participant's own team.
  const ranked = useMemo(
    () => rows.map((r) => ({
      id: r.rank,
      rank: r.rank,
      team: r.team,
      projectTitle: r.projectTitle,
      score: r.score,
      isYou: myTeamName != null && r.team === myTeamName,
    })),
    [rows, myTeamName],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return ranked
    return ranked.filter((r) => [r.team, r.projectTitle].some((v) => (v || '').toLowerCase().includes(q)))
  }, [ranked, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  const myEntry = ranked.find((r) => r.isYou)

  const columns = [
    { key: 'rank', header: 'Rank', render: (r) => <RankCell rank={r.rank} /> },
    {
      key: 'team',
      header: 'Team',
      render: (r) => (
        <span className="flex items-center gap-2 font-medium text-slate-900">
          {r.team}
          {r.isYou && <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">You</span>}
        </span>
      ),
    },
    { key: 'projectTitle', header: 'Project', render: (r) => r.projectTitle || <span className="italic text-slate-400">—</span> },
    { key: 'score', header: 'Score', align: 'right', render: (r) => <span className="text-lg font-extrabold tabular-nums text-indigo-950">{r.score}</span> },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leaderboard</h1>
          <p className="mt-1 text-sm text-slate-500">See where your team stands. Your row is highlighted.</p>
        </div>
        {eventOptions.length > 0 && (
          <CustomDropdown ariaLabel="Select event" options={eventOptions} value={eventId} onChange={setEventId} className="w-full sm:w-72" />
        )}
      </div>

      {/* Your position summary */}
      {myEntry && (
        <div className="flex items-center gap-4 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">#{myEntry.rank}</div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Your position</p>
            <p className="truncate text-sm font-semibold text-slate-900">{myEntry.team}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-2xl font-extrabold tabular-nums text-indigo-950">{myEntry.score}</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">points</p>
          </div>
        </div>
      )}

      {eventOptions.length > 0 && (
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by team or project…"
          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:max-w-xs"
        />
      )}

      {loadingTeams ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-medium text-slate-500 shadow-sm">Loading…</div>
      ) : eventOptions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm font-medium text-slate-400 shadow-sm">
          Join a team for an event to see its leaderboard.
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={pageRows}
          rowKey="id"
          loading={loading}
          error={error}
          emptyMessage="No scores have been published for this event yet. Check back after judging."
          page={safePage}
          totalPages={totalPages}
          totalElements={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          rowClassName={(r) => (r.isYou ? 'bg-blue-50/70' : '')}
        />
      )}
    </div>
  )
}

export default Leaderboard
