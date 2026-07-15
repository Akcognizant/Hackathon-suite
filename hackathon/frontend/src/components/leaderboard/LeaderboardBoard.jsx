// Shared, high-tech leaderboard board used by both the admin console and the
// participant portal. Given a pre-ranked list of entries it renders:
//   • a top-3 podium (gold / silver / bronze)
//   • a searchable, paginated ranking table
//   • an optional pinned "Your position" bar for the current participant
//
// Entry shape: { id, rank, name, subtitle, meta, score, isYou }
// The parent supplies data + filters; this component owns search + pagination.

import { useEffect, useMemo, useState } from 'react'

const PAGE_SIZE = 10

function TrophyIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}
function MedalIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <circle cx="12" cy="15" r="6" /><path d="M12 13v4M10 15h4" opacity="0" />
      <path d="M8.5 8.5 6 2h4l2 4M15.5 8.5 18 2h-4l-2 4" />
    </svg>
  )
}
function SearchIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  )
}

// Medal treatment per top-3 rank.
const PODIUM = {
  1: { ring: 'ring-yellow-300', grad: 'from-amber-100 to-yellow-50', badge: 'bg-gradient-to-br from-yellow-400 to-amber-500', label: 'text-amber-700', glow: 'shadow-[0_10px_40px_-10px_rgba(245,158,11,0.5)]' },
  2: { ring: 'ring-slate-300', grad: 'from-slate-100 to-slate-50', badge: 'bg-gradient-to-br from-slate-300 to-slate-400', label: 'text-slate-600', glow: 'shadow-[0_10px_40px_-12px_rgba(100,116,139,0.45)]' },
  3: { ring: 'ring-orange-300', grad: 'from-orange-100 to-amber-50', badge: 'bg-gradient-to-br from-orange-400 to-amber-600', label: 'text-orange-700', glow: 'shadow-[0_10px_40px_-12px_rgba(234,88,12,0.45)]' },
}

function initials(name) {
  if (!name) return '—'
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function PodiumCard({ entry, elevated }) {
  const p = PODIUM[entry.rank] || PODIUM[3]
  return (
    <div className={`relative flex flex-1 flex-col items-center rounded-2xl bg-gradient-to-b ${p.grad} p-5 ring-1 ${p.ring} ${p.glow} ${elevated ? 'sm:-mt-6 sm:pb-8' : ''} ${entry.isYou ? 'outline outline-2 outline-blue-500' : ''}`}>
      <span className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 text-xs font-black text-white ${p.badge}`}>
        #{entry.rank}
      </span>
      <span className={`mt-2 flex h-14 w-14 items-center justify-center rounded-full ${p.badge} text-lg font-bold text-white shadow-inner`}>
        {entry.rank === 1 ? <TrophyIcon className="h-7 w-7" /> : initials(entry.name)}
      </span>
      <p className="mt-3 line-clamp-1 text-center text-sm font-bold text-slate-900">{entry.name}</p>
      {entry.subtitle && <p className="line-clamp-1 text-center text-xs text-slate-500">{entry.subtitle}</p>}
      <p className="mt-2 text-2xl font-extrabold tabular-nums text-slate-900">{entry.score}</p>
      <p className={`text-[10px] font-bold uppercase tracking-wider ${p.label}`}>points</p>
      {entry.isYou && (
        <span className="mt-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">You</span>
      )}
    </div>
  )
}

function RankRow({ entry }) {
  const medal = entry.rank <= 3
  const medalTone = entry.rank === 1 ? 'text-amber-500' : entry.rank === 2 ? 'text-slate-400' : 'text-orange-500'
  return (
    <div className={`flex items-center gap-4 px-4 py-3 transition-colors ${entry.isYou ? 'bg-blue-50/80' : 'hover:bg-slate-50'}`}>
      <div className="flex w-10 shrink-0 items-center justify-center">
        {medal ? (
          <MedalIcon className={`h-6 w-6 ${medalTone}`} />
        ) : (
          <span className="text-sm font-bold tabular-nums text-slate-400">#{entry.rank}</span>
        )}
      </div>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
        {initials(entry.name)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate text-sm font-semibold text-slate-900">
          {entry.name}
          {entry.isYou && <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">You</span>}
        </p>
        {entry.subtitle && <p className="truncate text-xs text-slate-500">{entry.subtitle}</p>}
      </div>
      {entry.meta && (
        <span className="hidden shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 sm:inline">
          {entry.meta}
        </span>
      )}
      <div className="shrink-0 text-right">
        <p className="text-xl font-extrabold tabular-nums text-indigo-950">{entry.score}</p>
        <p className="text-[10px] uppercase tracking-wide text-slate-400">pts</p>
      </div>
    </div>
  )
}

export default function LeaderboardBoard({ entries = [], loading, error, emptyMessage = 'No rankings yet.', pageSize = PAGE_SIZE }) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)

  useEffect(() => { setPage(0) }, [query, entries.length])

  const q = query.trim().toLowerCase()
  const searching = q !== ''
  const filtered = useMemo(
    () => (!searching ? entries : entries.filter((e) =>
      [e.name, e.subtitle, e.meta].some((v) => (v || '').toLowerCase().includes(q)))),
    [entries, q, searching],
  )

  const podium = searching ? [] : entries.slice(0, 3)
  const tableSource = searching ? filtered : entries.slice(3)
  const totalPages = Math.max(1, Math.ceil(tableSource.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const pageRows = tableSource.slice(safePage * pageSize, safePage * pageSize + pageSize)

  const you = entries.find((e) => e.isYou)
  const youVisible = you && (podium.some((e) => e.id === you.id) || pageRows.some((e) => e.id === you.id))
  const showYouPin = you && !youVisible

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-medium text-slate-500 shadow-sm">Loading leaderboard…</div>
  }
  if (error) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center text-sm font-medium text-red-600 shadow-sm">{error}</div>
  }
  if (entries.length === 0) {
    return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm font-medium text-slate-400 shadow-sm">{emptyMessage}</div>
  }

  return (
    <div className="space-y-5">
      {/* Podium */}
      {podium.length > 0 && (
        <div className="flex flex-col items-stretch gap-4 rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-6 shadow-sm sm:flex-row sm:items-end sm:pt-10">
          {/* Order: 2nd, 1st (elevated), 3rd on desktop */}
          {podium[1] && <div className="order-2 sm:order-1 flex"><PodiumCard entry={podium[1]} /></div>}
          {podium[0] && <div className="order-1 sm:order-2 flex"><PodiumCard entry={podium[0]} elevated /></div>}
          {podium[2] && <div className="order-3 flex"><PodiumCard entry={podium[2]} /></div>}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by team or project…"
          className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      {/* Ranking table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {searching ? `Results (${filtered.length})` : 'Rankings'}
          </span>
          <span className="text-xs text-slate-400">{entries.length} ranked</span>
        </div>

        {pageRows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-400">No teams match “{query}”.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {pageRows.map((entry) => <RankRow key={entry.id} entry={entry} />)}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span className="tabular-nums">Page {safePage + 1} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={safePage <= 0}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
              Previous
            </button>
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
              Next
            </button>
          </div>
        </div>
      )}

      {/* Pinned "your position" bar — shown when the participant's row isn't on screen */}
      {showYouPin && (
        <div className="sticky bottom-4 z-10">
          <div className="flex items-center gap-4 rounded-2xl border border-blue-300 bg-blue-600 px-4 py-3 text-white shadow-lg shadow-blue-600/30">
            <div className="flex w-10 shrink-0 items-center justify-center text-sm font-black tabular-nums">#{you.rank}</div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">{initials(you.name)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{you.name} <span className="font-medium text-blue-100">· Your team</span></p>
              {you.subtitle && <p className="truncate text-xs text-blue-100">{you.subtitle}</p>}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xl font-extrabold tabular-nums">{you.score}</p>
              <p className="text-[10px] uppercase tracking-wide text-blue-100">pts</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
