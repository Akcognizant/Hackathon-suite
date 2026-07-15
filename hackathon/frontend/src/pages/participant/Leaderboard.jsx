// Participant leaderboard — ranked standings for an event the participant is in,
// with their own team highlighted and pinned (via LeaderboardBoard). Searchable
// and paginated. Event picker is scoped to the events the participant has a team in.

import { useEffect, useMemo, useState } from 'react'
import CustomDropdown from '../../components/ui/CustomDropdown'
import LeaderboardBoard from '../../components/leaderboard/LeaderboardBoard'
import { getMyTeams, getLeaderboard } from '../../api/participantApi'

function Leaderboard() {
  const [myTeams, setMyTeams] = useState([])
  const [eventId, setEventId] = useState('')
  const [rows, setRows] = useState([])
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Load the participant's teams to discover which events they belong to.
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

  // Distinct events the participant is part of.
  const eventOptions = useMemo(() => {
    const seen = new Map()
    myTeams.forEach((t) => {
      if (t.hackathonId != null && !seen.has(t.hackathonId)) {
        seen.set(t.hackathonId, t.hackathonTitle || `Event ${t.hackathonId}`)
      }
    })
    return [...seen.entries()].map(([id, title]) => ({ value: String(id), label: title }))
  }, [myTeams])

  // The participant's own team name for the selected event (for highlight/pin).
  const myTeamName = useMemo(() => {
    const mine = myTeams.find((t) => String(t.hackathonId) === String(eventId))
    return mine?.name || null
  }, [myTeams, eventId])

  // Fetch the leaderboard whenever the selected event changes.
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

  const entries = useMemo(
    () => rows.map((r) => ({
      id: r.rank,
      rank: r.rank,
      name: r.team,
      subtitle: r.projectTitle,
      meta: null,
      score: r.score,
      isYou: myTeamName != null && r.team === myTeamName,
    })),
    [rows, myTeamName],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leaderboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            See where your team stands. Your position is highlighted below.
          </p>
        </div>
        {eventOptions.length > 0 && (
          <CustomDropdown
            ariaLabel="Select event"
            options={eventOptions}
            value={eventId}
            onChange={setEventId}
            className="w-full sm:w-72"
          />
        )}
      </div>

      {loadingTeams ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-medium text-slate-500 shadow-sm">Loading…</div>
      ) : eventOptions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm font-medium text-slate-400 shadow-sm">
          Join a team for an event to see its leaderboard.
        </div>
      ) : (
        <LeaderboardBoard
          entries={entries}
          loading={loading}
          error={error}
          emptyMessage="No scores have been published for this event yet. Check back after judging."
        />
      )}
    </div>
  )
}

export default Leaderboard
