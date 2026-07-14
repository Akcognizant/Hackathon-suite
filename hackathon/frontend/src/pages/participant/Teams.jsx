// Teams — see my teams, create a new team for an event, and join open teams.

import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useToast } from '../../context/ToastContext'
import {
  getEvents,
  getJoinableTeams,
  createTeam,
  joinTeam,
} from '../../api/participantApi'

function TeamCard({ team, action }) {
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
      {action}
    </div>
  )
}

function Teams() {
  const location = useLocation()
  const toast = useToast()
  const [events, setEvents] = useState([])
  const [joinable, setJoinable] = useState([])
  const [loading, setLoading] = useState(true)
  const [joinFilter, setJoinFilter] = useState('') // event id to filter joinable teams

  // Create-team form
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [hackathonId, setHackathonId] = useState(location.state?.hackathonId || '')
  const [invites, setInvites] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([getEvents(), getJoinableTeams()])
      .then(([e, join]) => {
        setEvents(e)
        setJoinable(join)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const openEvents = events.filter((e) => (e.status || '').toUpperCase() !== 'COMPLETED')

  // Distinct events that actually have open teams (for the join filter dropdown).
  const joinEventOptions = Array.from(
    new Map(joinable.map((t) => [t.hackathonId, t.hackathonTitle])).entries(),
  ).map(([id, title]) => ({ id, title }))

  const filteredJoinable = joinFilter
    ? joinable.filter((t) => String(t.hackathonId) === String(joinFilter))
    : joinable

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!hackathonId) {
      setFormError('Please choose an event.')
      return
    }
    const members = invites
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    setSubmitting(true)
    try {
      await createTeam({ name, description, hackathonId: Number(hackathonId), members })
      toast?.showToast('Team created!')
      setName('')
      setDescription('')
      setInvites('')
      setHackathonId('')
      load()
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not create team.'
      setFormError(msg)
      toast?.showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleJoin = async (teamId) => {
    try {
      await joinTeam(teamId)
      toast?.showToast('Joined team!')
      load()
    } catch (err) {
      toast?.showToast(err.response?.data?.message || 'Could not join team.', 'error')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Teams</h1>
        <p className="mt-1 text-sm text-slate-500">Create a team for an event or join an existing one.</p>
      </div>

      {/* Create team */}
      <form onSubmit={handleCreate} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Create a team</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input label="Team name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Neural Ninjas" />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Event <span className="text-red-500">*</span>
            </label>
            <select
              value={hackathonId}
              onChange={(e) => setHackathonId(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Select an event…</option>
              {openEvents.map((e) => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
          </div>
        </div>
        <Input
          className="mt-4"
          label="Add members (comma-separated emails, optional)"
          value={invites}
          onChange={(e) => setInvites(e.target.value)}
          placeholder="alice@cognizant.com, bob@cognizant.com"
        />
        <p className="mt-1 text-xs text-slate-400">Members must be registered users — unknown emails are rejected.</p>
        {formError && <p className="mt-3 text-sm font-medium text-red-600">{formError}</p>}
        <div className="mt-4">
          <Button type="submit" isLoading={submitting}>Create team</Button>
        </div>
      </form>

      {/* Joinable teams */}
      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Open teams to join</h2>
          {joinEventOptions.length > 0 && (
            <select
              value={joinFilter}
              onChange={(e) => setJoinFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:w-64"
            >
              <option value="">All events</option>
              {joinEventOptions.map((e) => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
          )}
        </div>
        {loading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : joinable.length === 0 ? (
          <p className="text-sm text-slate-400">No open teams available for events you haven’t joined.</p>
        ) : filteredJoinable.length === 0 ? (
          <p className="text-sm text-slate-400">No open teams for the selected event.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredJoinable.map((t) => (
              <TeamCard
                key={t.id}
                team={t}
                action={
                  <Button size="sm" className="mt-3 w-full" onClick={() => handleJoin(t.id)}>
                    Join team
                  </Button>
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Teams
