// Rank badge for the scouting directory. Top 3 get subtle metallic gradients
// (gold / silver / bronze) with a ring + shadow so they read as "premium"; ranks
// 4+ get a clean neutral chip; unranked teams (no scored submission) get a muted
// placeholder rather than a misleading "#0".
//
// Props: rank (number | null | undefined), size 'sm' | 'md' (default 'md')

const MEDALS = {
  1: 'bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-500 text-amber-950 ring-1 ring-amber-300/70 shadow-md shadow-amber-500/30',
  2: 'bg-gradient-to-br from-slate-100 via-slate-300 to-slate-400 text-slate-700 ring-1 ring-slate-300 shadow-md shadow-slate-400/30',
  3: 'bg-gradient-to-br from-orange-200 via-amber-600 to-orange-800 text-orange-50 ring-1 ring-orange-400/60 shadow-md shadow-orange-700/30',
}

function RankBadge({ rank, size = 'md' }) {
  const dims = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-11 w-11 text-sm'

  if (rank == null) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-50 font-semibold text-slate-400 ${dims}`}
        title="No scored submission yet"
      >
        —
      </span>
    )
  }

  const medal = MEDALS[rank]
  const tone = medal || 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold tabular-nums ${tone} ${dims}`}
      title={`Rank #${rank}`}
    >
      #{rank}
    </span>
  )
}

export default RankBadge
