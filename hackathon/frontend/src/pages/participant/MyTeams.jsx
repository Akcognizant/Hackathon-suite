// My Teams — an accordion list. Each row is a team; clicking it expands to reveal
// the roster and the add-member / leave actions. Members can be added / the team
// left only while the hackathon hasn't started yet.

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useToast } from '../../context/ToastContext'
import { getMyTeams, getMySubmissions, getEvents, addTeamMember, leaveTeam } from '../../api/participantApi'
import { SUBMISSION_STATUS_STYLES, submissionDisplayStatus } from '../../utils/submissionState'
import Pagination from '../../components/ui/Pagination'
import { usePagination } from '../../utils/usePagination'

const STATUS_TONE = { ...SUBMISSION_STATUS_STYLES, NOT_SUBMITTED: 'bg-red-100 text-red-700' }
const STATUS_LABEL = { NOT_SUBMITTED: 'Not submitted' }
const today = () => new Date().toISOString().slice(0, 10)

// A team's badge: its submission status once it has one; otherwise, if the
// hackathon is over and nothing was submitted, "Not submitted"; else team status.
function teamBadgeStatus(team, submission) {
  const subStatus = submissionDisplayStatus(submission)
  if (subStatus) return subStatus
  const over =
    (team.hackathonStatus || '').toUpperCase() === 'COMPLETED' ||
    (team.hackathonEndDate && team.hackathonEndDate < today())
  if (over) return 'NOT_SUBMITTED'
  return team.status
}

const AVATAR_TONES = [
  'bg-blue-100 text-blue-700',
  'bg-indigo-100 text-indigo-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
]

const initials = (m) => (m.name || m.email || '?').slice(0, 2).toUpperCase()

function TeamRow({ team, status, size, isOpen, onToggle, onChanged }) {
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmingLeave, setConfirmingLeave] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const lastMember = team.memberCount <= 1
  const started = (team.hackathonStatus || '').toUpperCase() !== 'UPCOMING'
  const max = size?.max ?? null

  const leave = async () => {
    setLeaving(true)
    try {
      await leaveTeam(team.id)
      toast?.showToast(lastMember ? 'You left — the empty team was deleted.' : 'You left the team.')
      onChanged?.()
    } catch (err) {
      toast?.showToast(err.response?.data?.message || 'Could not leave the team.', 'error')
      setLeaving(false)
      setConfirmingLeave(false)
    }
  }

  const add = async (e) => {
    e.preventDefault()
    const value = email.trim()
    if (!value) return
    setBusy(true)
    try {
      await addTeamMember(team.id, value)
      toast?.showToast('Member added!')
      setEmail('')
      onChanged?.()
    } catch (err) {
      toast?.showToast(err.response?.data?.message || 'Could not add member.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      {/* Row header */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50"
      >
        <svg
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">{team.name}</p>
          <p className="truncate text-xs text-slate-500">{team.hackathonTitle}</p>
        </div>
        <span className="hidden text-xs font-medium text-slate-500 sm:inline">
          {team.memberCount}{max ? ` / ${max}` : ''} member{team.memberCount === 1 ? '' : 's'}
        </span>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_TONE[status] || 'bg-slate-100 text-slate-600'}`}>
          {STATUS_LABEL[status] || status}
        </span>
      </button>

      {/* Expanded body */}
      {isOpen && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Members ({team.memberCount})
          </p>
          <ul className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {team.members.map((m, i) => (
              <li key={m.email} className="flex items-center gap-2 text-sm text-slate-700">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${AVATAR_TONES[i % AVATAR_TONES.length]}`}>
                  {initials(m)}
                </span>
                <span className="truncate">{m.name || m.email}</span>
                {m.lead && (
                  <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
                    Lead
                  </span>
                )}
              </li>
            ))}
          </ul>

          {/* Add a registered member — only before the hackathon starts. */}
          {!started ? (
            <form onSubmit={add} className="flex items-end gap-2 border-t border-slate-200 pt-3">
              <Input className="flex-1" label="Add a member" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Button type="submit" size="sm" isLoading={busy}>Add</Button>
            </form>
          ) : (
            <p className="border-t border-slate-200 pt-3 text-xs text-slate-400">
              The hackathon has started — the roster is locked.
            </p>
          )}

          {/* Leave team — disabled once the hackathon has started. */}
          <div className="mt-3">
            {started ? (
              <Button variant="danger" size="sm" disabled title="The hackathon has started — you can no longer leave the team.">
                Leave team
              </Button>
            ) : !confirmingLeave ? (
              <Button variant="danger" size="sm" onClick={() => setConfirmingLeave(true)}>
                Leave team
              </Button>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="mb-2 text-xs font-medium text-slate-600">
                  {lastMember
                    ? `Leave “${team.name}”? You’re the last member, so the team will be deleted.`
                    : `Leave “${team.name}”?`}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" disabled={leaving} onClick={() => setConfirmingLeave(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" variant="danger" isLoading={leaving} onClick={leave}>
                    Yes, leave
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function MyTeams() {
  const [teams, setTeams] = useState([])
  const [subByTeam, setSubByTeam] = useState({})
  const [sizeByHackathon, setSizeByHackathon] = useState({})
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState(null)
  const { page, totalPages, pageItems, next, prev } = usePagination(teams, 8)

  const load = () => {
    setLoading(true)
    Promise.all([getMyTeams(), getMySubmissions(), getEvents()])
      .then(([t, subs, events]) => {
        setTeams(t)
        const map = {}
        for (const s of subs) map[String(s.teamId)] = s
        setSubByTeam(map)
        const sizes = {}
        for (const e of events) sizes[String(e.id)] = { min: e.minTeamSize, max: e.maxTeamSize }
        setSizeByHackathon(sizes)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My teams</h1>
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
        <>
          <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {pageItems.map((t) => (
              <TeamRow
                key={t.id}
                team={t}
                status={teamBadgeStatus(t, subByTeam[String(t.id)])}
                size={sizeByHackathon[String(t.hackathonId)]}
                isOpen={openId === t.id}
                onToggle={() => setOpenId((cur) => (cur === t.id ? null : t.id))}
                onChanged={load}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPrev={prev} onNext={next} />
        </>
      )}
    </div>
  )
}

export default MyTeams
