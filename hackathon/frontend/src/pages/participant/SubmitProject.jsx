// Submit (or update) a project for one of my teams.

import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useToast } from '../../context/ToastContext'
import { getMyTeams, getMySubmissions, submitProject } from '../../api/participantApi'

function SubmitProject() {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const [teams, setTeams] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [teamId, setTeamId] = useState('')
  const [projectTitle, setProjectTitle] = useState('')
  const [description, setDescription] = useState('')
  const [repositoryUrl, setRepositoryUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Fill the form from a team's existing submission (edit), or clear it.
  const applyExisting = (subs, id) => {
    const existing = subs.find((s) => String(s.teamId) === String(id))
    setProjectTitle(existing?.projectTitle || '')
    setDescription(existing?.description || '')
    setRepositoryUrl(existing?.repositoryUrl || '')
  }

  // A hackathon is "over" once it's marked COMPLETED or its end date has passed.
  // Teams for such events drop out of the picker — you can't submit anymore.
  const isOver = (team) => {
    if ((team.hackathonStatus || '').toUpperCase() === 'COMPLETED') return true
    if (team.hackathonEndDate) {
      const today = new Date().toISOString().slice(0, 10)
      return team.hackathonEndDate < today
    }
    return false
  }

  useEffect(() => {
    Promise.all([getMyTeams(), getMySubmissions()])
      .then(([t, s]) => {
        setTeams(t.filter((team) => !isOver(team)))
        setSubmissions(s)
        // If we arrived via an "Edit" link, preselect that team and prefill.
        const preselect = location.state?.teamId
        if (preselect != null) {
          setTeamId(String(preselect))
          applyExisting(s, preselect)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Prefill when selecting a team that already has a submission (edit mode).
  const onSelectTeam = (id) => {
    setTeamId(id)
    applyExisting(submissions, id)
  }

  // Teams that already submitted for their hackathon — disabled in the picker.
  const submittedTeamIds = new Set(submissions.map((s) => String(s.teamId)))
  // True when the selected team already has a submission (so this is an edit).
  const isEditing = submittedTeamIds.has(String(teamId))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!teamId) {
      setError('Please select a team.')
      return
    }
    if (!description.trim()) {
      setError('Please add a project description.')
      return
    }
    setSubmitting(true)
    try {
      await submitProject({ teamId: Number(teamId), projectTitle, description, repositoryUrl })
      toast?.showToast('Project submitted!')
      navigate('/portal/submissions')
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not submit project.'
      setError(msg)
      toast?.showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Submit a project</h1>
        <p className="mt-1 text-sm text-slate-500">One submission per team — submitting again updates it.</p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : teams.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-slate-500 shadow-sm">
          You need a team first.{' '}
          <button className="font-medium text-blue-600 hover:text-blue-700" onClick={() => navigate('/portal/teams')}>
            Create or join a team
          </button>
          .
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Team <span className="text-red-500">*</span>
            </label>
            <select
              value={teamId}
              onChange={(e) => onSelectTeam(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Select a team…</option>
              {teams.map((t) => {
                const submitted = submittedTeamIds.has(String(t.id))
                return (
                  <option
                    key={t.id}
                    value={t.id}
                    disabled={submitted && String(t.id) !== String(teamId)}
                  >
                    {t.name} — {t.hackathonTitle}{submitted ? ' (already submitted)' : ''}
                  </option>
                )
              })}
            </select>
          </div>
          <Input label="Project title" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} required />
          <Input label="Description" type="textarea" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="What does your project do? Key features, tech used, and what problem it solves." />
          <Input label="Repository URL" type="url" value={repositoryUrl} onChange={(e) => setRepositoryUrl(e.target.value)} required />
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <Button type="submit" isLoading={submitting}>{isEditing ? 'Update submission' : 'Submit project'}</Button>
        </form>
      )}
    </div>
  )
}

export default SubmitProject
