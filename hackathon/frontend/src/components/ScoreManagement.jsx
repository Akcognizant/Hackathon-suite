// Score Management — server-paginated grading worklist (GET /admin/scores/page:
// APPROVED submissions) rendered with the shared <DataTable/>. "Grade Submission"
// opens a manual-first Grading Center; the optional AI assistant validates the repo
// link, inspects it live, and pre-fills editable per-criterion scores. Confirming
// POSTs the summed total to /admin/scores and refreshes the page.

import { useEffect, useState } from 'react'
import axiosClient from '../api/axiosClient'
import { useToast } from '../context/ToastContext'
import Button from './ui/Button'
import DataTable from './ui/DataTable'
import CustomDropdown from './ui/CustomDropdown'
import StarRating from './ui/StarRating'

const PAGE_SIZE = 10

// Default rubric used when a hackathon has no configured criteria.
const DEFAULT_CRITERIA = [
  { name: 'Innovation', max: 25 },
  { name: 'Technical Complexity', max: 25 },
  { name: 'UI/UX', max: 25 },
  { name: 'Business Value', max: 25 },
]

// Mirrors the backend ContributionType enum.
const CONTRIBUTION_OPTIONS = [
  { value: 'LEAD', label: 'Lead' },
  { value: 'DEVELOPER', label: 'Developer' },
  { value: 'DESIGN', label: 'Design' },
  { value: 'PRESENTATION', label: 'Presentation' },
]

function memberInitials(name) {
  if (!name) return '?'
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

// A submission must have a valid GitHub repo URL before the AI can grade it.
const GITHUB_URL_RE = /^https:\/\/(www\.)?github\.com\/[^/\s]+\/[^/\s]+/i

function ScoreManagement() {
  const { showToast } = useToast()

  // ----- Table state -----
  const [pageData, setPageData] = useState({ content: [], totalElements: 0, totalPages: 0 })
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState({ field: 'id', direction: 'desc' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshTick, setRefreshTick] = useState(0)

  // ----- Grading modal state -----
  const [activeSubmission, setActiveSubmission] = useState(null)
  const [activeCriteria, setActiveCriteria] = useState([])
  const [criteriaLoading, setCriteriaLoading] = useState(false)
  const [scores, setScores] = useState([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiRan, setAiRan] = useState(false)
  const [activeAiFeedback, setActiveAiFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // ----- Individual member evaluation (embedded in the grading modal) -----
  const [members, setMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [memberEvals, setMemberEvals] = useState({}) // memberId -> { score, role }

  // Server-paginated worklist of APPROVED submissions.
  useEffect(() => {
    let active = true
    setLoading(true) // eslint-disable-line react-hooks/set-state-in-effect
    axiosClient
      .get('/admin/scores/page', {
        params: { page, size: PAGE_SIZE, sort: `${sort.field},${sort.direction}` },
      })
      .then((res) => {
        if (active) {
          setPageData(res.data)
          setError('')
        }
      })
      .catch(() => {
        if (active) setError('Failed to load submissions. Please try again.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [page, sort, refreshTick])

  const handleSort = (field) => {
    setPage(0)
    setSort((prev) =>
      prev.field === field
        ? { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { field, direction: 'asc' },
    )
  }

  // Open the Grading Center: render the rubric as empty inputs (manual-first);
  // no AI is triggered here. Fetches the hackathon's criteria (fallback defaults).
  const openGrading = async (submission) => {
    setActiveSubmission(submission)
    setAiRan(false)
    setActiveAiFeedback('')
    setActiveCriteria([])
    setScores([])
    setCriteriaLoading(true)

    // Load the team's members for the embedded evaluation section (non-blocking).
    setMembers([])
    setMemberEvals({})
    if (submission.teamId != null) {
      setMembersLoading(true)
      axiosClient
        .get(`/admin/teams/${submission.teamId}/members`)
        .then(({ data }) => {
          setMembers(data)
          const init = {}
          data.forEach((m) => {
            init[m.id] = { score: m.technicalScore || 0, role: m.contributionType || 'DEVELOPER' }
          })
          setMemberEvals(init)
        })
        .catch(() => setMembers([]))
        .finally(() => setMembersLoading(false))
    }

    let criteria = DEFAULT_CRITERIA
    try {
      if (submission.hackathonId != null) {
        const { data } = await axiosClient.get(
          `/admin/hackathons/${submission.hackathonId}/criteria`,
        )
        if (Array.isArray(data) && data.length > 0) {
          criteria = data.map((c) => ({ name: c.name, max: c.max }))
        }
      }
    } catch {
      // Keep the default criteria if the fetch fails.
    } finally {
      setActiveCriteria(criteria)
      setScores(criteria.map(() => ''))
      setCriteriaLoading(false)
    }
  }

  // Optional AI grading. Validates the GitHub link, then asks the AI to inspect the
  // repo and score each criterion (POST /evaluate). Suggestions stay fully editable.
  const handleGetAiSuggestions = async () => {
    if (!activeSubmission) return

    if (!GITHUB_URL_RE.test(activeSubmission.repositoryUrl || '')) {
      showToast('Link Invalid: a valid GitHub repository URL is required.', 'error')
      return
    }

    setAiLoading(true)
    try {
      const { data } = await axiosClient.post(
        `/admin/submissions/${activeSubmission.id}/evaluate`,
      )
      setScores(
        activeCriteria.map((criterion) => {
          const value = data.scores?.[criterion.name]
          return value == null
            ? ''
            : Math.max(0, Math.min(criterion.max, Number(value) || 0))
        }),
      )
      setActiveAiFeedback(data.feedback ?? '')
      setAiRan(true)
      showToast('AI suggestions applied — review and adjust before assigning.', 'success')
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Unable to analyze repo: link invalid or private.'
      showToast(message, 'error')
    } finally {
      setAiLoading(false)
    }
  }

  const closeModal = () => {
    setActiveSubmission(null)
  }

  const handleScoreChange = (index, value) => {
    setScores((prev) => {
      const next = [...prev]
      if (value === '') {
        next[index] = ''
      } else {
        const max = activeCriteria[index]?.max ?? 0
        next[index] = Math.max(0, Math.min(max, Number(value) || 0))
      }
      return next
    })
  }

  const setMemberScore = (id, score) =>
    setMemberEvals((prev) => ({ ...prev, [id]: { ...prev[id], score } }))
  const setMemberRole = (id, role) =>
    setMemberEvals((prev) => ({ ...prev, [id]: { ...prev[id], role } }))

  const totalMax = activeCriteria.reduce((sum, c) => sum + c.max, 0)
  const totalScore = scores.reduce((sum, value) => sum + (Number(value) || 0), 0)

  // Persist whatever is in the inputs, then refetch so the row reflects its score.
  const handleConfirm = async () => {
    if (!activeSubmission) return
    setSubmitting(true)
    try {
      // Only send members the judge actually rated (score ≥ 1).
      const evaluations = members
        .filter((m) => (memberEvals[m.id]?.score || 0) >= 1)
        .map((m) => ({
          memberId: m.id,
          score: memberEvals[m.id].score,
          role: memberEvals[m.id].role,
        }))
      // One atomic request: rubric total + individual evaluations commit together.
      await axiosClient.post('/admin/scores', {
        submissionId: activeSubmission.id,
        score: totalScore,
        evaluations,
      })
      showToast('Score & evaluations saved successfully!', 'success')
      closeModal()
      setRefreshTick((t) => t + 1)
    } catch {
      showToast('Failed to save score. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Close the modal on Escape (unless a save is in flight).
  useEffect(() => {
    if (!activeSubmission) return
    function handleKey(event) {
      if (event.key === 'Escape' && !submitting) closeModal()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [activeSubmission, submitting])

  const columns = [
    { key: 'team', header: 'Team', render: (s) => <span className="font-medium text-slate-900">{s.team}</span> },
    { key: 'hackathon', header: 'Hackathon', render: (s) => s.hackathon },
    { key: 'projectTitle', header: 'Project', sortable: true, render: (s) => s.projectTitle },
    {
      key: 'score',
      header: 'Score',
      sortable: true,
      render: (s) =>
        s.score !== null && s.score !== undefined ? (
          <span className="text-base font-bold text-slate-900 tabular-nums">
            {s.score}
            <span className="text-sm font-normal text-slate-400"> / 100</span>
          </span>
        ) : (
          <span className="text-sm text-slate-400">—</span>
        ),
    },
    {
      key: 'gradedBy',
      header: 'Evaluator',
      render: (s) =>
        s.gradedBy ? (
          <span className="text-sm text-slate-600">{s.gradedBy}</span>
        ) : (
          <span className="text-sm text-slate-400">—</span>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (s) => {
        const isScored = s.score !== null && s.score !== undefined
        return isScored ? (
          <span className="inline-flex h-8 cursor-default items-center rounded-lg border border-green-500 bg-green-50 px-3 text-xs font-bold uppercase tracking-wide text-green-700">
            Scored
          </span>
        ) : (
          <Button variant="primary" size="sm" onClick={() => openGrading(s)} className="min-w-[10.5rem]">
            Grade Submission
          </Button>
        )
      },
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-indigo-950">Score Management</h2>
        <p className="mt-1 text-sm text-slate-500">
          Grade an approved submission against its rubric. AI assistance is
          optional — you can score every criterion by hand.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={pageData.content}
        rowKey="id"
        loading={loading}
        error={error}
        emptyMessage="No approved submissions available for scoring. Check the Submissions tab."
        sort={sort}
        onSortChange={handleSort}
        page={page}
        totalPages={pageData.totalPages}
        totalElements={pageData.totalElements}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />

      {/* ---------- Grading Center modal (manual-first, optional AI) ---------- */}
      {activeSubmission && (
        <div
          onClick={!submitting ? closeModal : undefined}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[88vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl"
          >
            {/* Scrollable body — the footer stays pinned below it */}
            <div className="flex-1 overflow-y-auto p-6">
            {/* Header */}
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Grading Center</h3>
                <p className="mt-0.5 text-sm text-slate-500">
                  {activeSubmission.team} · {activeSubmission.projectTitle}
                </p>
              </div>
            </div>

            {/* Optional, non-blocking AI assist */}
            <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-purple-100 bg-purple-50/70 px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-purple-800">
                  AI Assist <span className="font-normal text-purple-500">· optional</span>
                </p>
                <p className="mt-0.5 text-xs text-purple-700/80">
                  Analyzes the GitHub repo against the rubric — suggestions are editable.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                isLoading={aiLoading}
                onClick={handleGetAiSuggestions}
                className="shrink-0"
              >
                {aiLoading ? (
                  'Thinking…'
                ) : aiRan ? (
                  'Regenerate'
                ) : (
                  <>
                    <span aria-hidden="true">✨</span>
                    Get AI Suggestions
                  </>
                )}
              </Button>
            </div>

            {/* Interactive, data-driven rubric — empty inputs by default */}
            {criteriaLoading ? (
              <p className="py-8 text-center text-sm text-slate-400">Loading criteria…</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {activeCriteria.map((criterion, index) => (
                  <div key={criterion.name}>
                    <label
                      htmlFor={`rubric-${index}`}
                      className="mb-1 flex items-center justify-between text-sm font-medium text-slate-700"
                    >
                      <span>{criterion.name}</span>
                      <span className="text-xs text-slate-400">/ {criterion.max}</span>
                    </label>
                    <input
                      id={`rubric-${index}`}
                      type="number"
                      min="0"
                      max={criterion.max}
                      value={scores[index] ?? ''}
                      onChange={(event) => handleScoreChange(index, event.target.value)}
                      placeholder="0"
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* AI Insight — scrollable feedback below the scores */}
            {aiRan && activeAiFeedback && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  AI Insight
                </p>
                <div className="max-h-24 overflow-y-auto pr-1 text-sm leading-relaxed text-slate-700">
                  {activeAiFeedback}
                </div>
              </div>
            )}

            {/* Auto-summed total */}
            <div className="mt-6 flex items-center justify-between rounded-xl bg-slate-50 px-5 py-4">
              <span className="text-sm font-medium text-slate-600">Total Score</span>
              <span className="text-4xl font-extrabold text-slate-900 tabular-nums">
                {totalScore}
                <span className="text-lg font-normal text-slate-400"> / {totalMax}</span>
              </span>
            </div>

            {/* ---------- Individual Member Evaluation ---------- */}
            <div className="mt-6 border-t border-slate-200 pt-5">
              <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Individual Member Evaluation
              </h4>
              <p className="mb-3 mt-0.5 text-xs text-slate-400">
                Optional — rate each member's skill and contribution. Saved together with the score.
              </p>
              {membersLoading ? (
                <div className="animate-pulse space-y-2">
                  {[0, 1].map((i) => (
                    <div key={i} className="h-16 rounded-xl bg-slate-100" />
                  ))}
                </div>
              ) : members.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
                  No members registered for this team.
                </p>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => {
                    const evaln = memberEvals[member.id] || { score: 0, role: 'DEVELOPER' }
                    return (
                      <div
                        key={member.id}
                        className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                            {memberInitials(member.name)}
                          </span>
                          <span className="text-sm font-semibold text-slate-800">{member.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <StarRating
                            value={evaln.score}
                            onChange={(v) => setMemberScore(member.id, v)}
                            size="sm"
                          />
                          <CustomDropdown
                            ariaLabel={`Contribution for ${member.name}`}
                            options={CONTRIBUTION_OPTIONS}
                            value={evaln.role}
                            onChange={(v) => setMemberRole(member.id, v)}
                            className="w-36"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            </div>
            {/* End scrollable body */}

            {/* Sticky footer — stays visible while the body scrolls */}
            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <Button variant="secondary" onClick={closeModal} disabled={submitting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirm}
                isLoading={submitting}
                disabled={criteriaLoading}
              >
                {submitting ? 'Saving…' : 'Confirm & Assign Score'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ScoreManagement
