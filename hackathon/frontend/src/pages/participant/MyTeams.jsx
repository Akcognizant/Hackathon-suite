// My Teams — the teams the signed-in participant belongs to. Reached from the
// profile menu (moved out of the Teams page, which now only creates/joins).

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyTeams } from '../../api/participantApi'

function TeamCard({ team }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-1 flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-900">{team.name}</h3>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          {team.status}
        </span>
      </div>
      <p className="mb-3 text-xs text-slate-500">{team.hackathonTitle}</p>
      <ul className="mb-3 space-y-1">
        {team.members.map((m) => (
          <li key={m.email} className="flex items-center gap-2 text-sm text-slate-600">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
              {(m.name || m.email).slice(0, 2).toUpperCase()}
            </span>
            {m.name || m.email}
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-400">{team.memberCount} member{team.memberCount === 1 ? '' : 's'}</p>
    </div>
  )
}

function MyTeams() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyTeams()
      .then(setTeams)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My teams</h1>
        <p className="mt-1 text-sm text-slate-500">Teams you’ve created or joined across hackathons.</p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : teams.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-slate-500 shadow-sm">
          You haven’t joined a team yet.{' '}
          <Link to="/portal/teams" className="font-medium text-blue-600 hover:text-blue-700">
            Create or join a team
          </Link>
          .
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {teams.map((t) => <TeamCard key={t.id} team={t} />)}
        </div>
      )}
    </div>
  )
}

export default MyTeams
