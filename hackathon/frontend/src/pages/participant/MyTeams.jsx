// My Teams — the teams the signed-in participant belongs to, with the ability to
// add another registered user to a team.

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useToast } from '../../context/ToastContext'
import { getMyTeams, getMySubmissions, addTeamMember, leaveTeam } from '../../api/participantApi'
import { SUBMISSION_STATUS_STYLES, submissionDisplayStatus } from '../../utils/submissionState'
import Pagination from '../../components/ui/Pagination'
import { usePagination } from '../../utils/usePagination'

// The tag reflects the admin's review of the team's submission when there is one
// (COMPLETED once scored, else APPROVED/REJECTED/PENDING); otherwise it falls
// back to the team's own status.
const STATUS_TONE = SUBMISSION_STATUS_STYLES

function TeamCard({ team, status, onChanged }) {
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmingLeave, setConfirmingLeave] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const lastMember = team.memberCount <= 1
  // Once the hackathon is active/completed, the roster is locked — no adding or leaving.
  const started = (team.hackathonStatus || '').toUpperCase() !== 'UPCOMING'

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
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-1 flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-900">{team.name}</h3>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_TONE[status] || 'bg-slate-100 text-slate-600'}`}>
          {status}
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
      <p className="mb-3 text-xs text-slate-400">{team.memberCount} member{team.memberCount === 1 ? '' : 's'}</p>

      {/* Add a registered member — only while the hackathon hasn't started yet.
          Once it's active/completed, membership is locked. */}
      {!started ? (
        <form onSubmit={add} className="flex items-end gap-2 border-t border-slate-100 pt-3">
          <Input
            className="flex-1"
            label="Add a member"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" size="sm" isLoading={busy}>Add</Button>
        </form>
      ) : (
        <p className="border-t border-slate-100 pt-3 text-xs text-slate-400">
          The hackathon has started — team members can no longer be added.
        </p>
      )}

      {/* Leave team — disabled once the hackathon has started. */}
      <div className="mt-3 border-t border-slate-100 pt-3">
        {started ? (
          <Button
            variant="danger"
            size="sm"
            className="w-full"
            disabled
            title="The hackathon has started — you can no longer leave the team."
          >
            Leave team
          </Button>
        ) : !confirmingLeave ? (
          <Button
            variant="danger"
            size="sm"
            className="w-full"
            onClick={() => setConfirmingLeave(true)}
          >
            Leave team
          </Button>
        ) : (
          <div>
            <p className="mb-2 text-center text-xs font-medium text-slate-600">
              {lastMember
                ? `Leave “${team.name}”? You’re the last member, so the team will be deleted.`
                : `Leave “${team.name}”?`}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" className="flex-1" disabled={leaving} onClick={() => setConfirmingLeave(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="danger" className="flex-1" isLoading={leaving} onClick={leave}>
                Yes, leave
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MyTeams() {
  const [teams, setTeams] = useState([])
  const [subByTeam, setSubByTeam] = useState({})
  const [loading, setLoading] = useState(true)
  const { page, totalPages, pageItems, next, prev } = usePagination(teams, 6)

  const load = () => {
    setLoading(true)
    Promise.all([getMyTeams(), getMySubmissions()])
      .then(([t, subs]) => {
        setTeams(t)
        const map = {}
        for (const s of subs) map[String(s.teamId)] = s
        setSubByTeam(map)
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
        <p className="mt-1 text-sm text-slate-500">Teams you’ve created or joined — add registered members here.</p>
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
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {pageItems.map((t) => (
              <TeamCard
                key={t.id}
                team={t}
                status={submissionDisplayStatus(subByTeam[String(t.id)]) || t.status}
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
