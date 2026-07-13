// Manage Participants — server-paginated roster (GET /admin/participants/page) using
// the shared <DataTable/>, matching Manage Hackathons / Submission Tracking. Search
// (name/email) and sorting are applied server-side so they work with pagination.

import { useEffect, useState } from 'react'
import axiosClient from '../api/axiosClient'
import DataTable from './ui/DataTable'
import CustomDropdown from './ui/CustomDropdown'

const PAGE_SIZE = 10

// Mirrors the backend ParticipantRole enum. '' == All Roles (no filter sent).
const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'BACKEND', label: 'Backend' },
  { value: 'FRONTEND', label: 'Frontend' },
  { value: 'AI', label: 'AI' },
]

// Talent-pool filter. '' == everyone; TOP == score ≥ 4; PENDING == not yet evaluated.
const SKILL_OPTIONS = [
  { value: '', label: 'All Talent' },
  { value: 'TOP', label: 'Top Performers' },
  { value: 'PENDING', label: 'Needs Evaluation' },
]

// Skill-score pill: green 4-5, blue 3, amber 1-2 when evaluated; muted grey when pending.
function SkillScoreBadge({ score, evaluated }) {
  if (!evaluated || score == null) {
    return (
      <span className="inline-flex rounded-full border border-gray-300 bg-gray-50 px-3 py-0.5 text-xs font-semibold text-gray-400">
        Pending Evaluation
      </span>
    )
  }
  let tone = 'border-amber-300 bg-amber-50 text-amber-700'
  if (score >= 4) tone = 'border-green-300 bg-green-50 text-green-700'
  else if (score === 3) tone = 'border-blue-300 bg-blue-50 text-blue-700'
  return (
    <span className={`inline-flex rounded-full border px-3 py-0.5 text-xs font-bold tabular-nums ${tone}`}>
      {score}/5
    </span>
  )
}

// Subtle role pill — purple for AI, blue for Frontend, gray for Backend/other.
function RoleBadge({ role }) {
  const normalized = role?.toUpperCase() || ''
  let tone = 'border-gray-300 bg-gray-50 text-gray-600'
  if (normalized.includes('AI')) {
    tone = 'border-purple-300 bg-purple-50 text-purple-700'
  } else if (normalized.includes('FRONTEND')) {
    tone = 'border-blue-300 bg-blue-50 text-blue-700'
  } else if (normalized.includes('BACKEND')) {
    tone = 'border-gray-300 bg-gray-100 text-gray-600'
  }
  return (
    <span className={`inline-flex rounded-full border px-3 py-0.5 text-xs font-semibold ${tone}`}>
      {role || '—'}
    </span>
  )
}

function ParticipantManagement() {
  const [pageData, setPageData] = useState({ content: [], totalElements: 0, totalPages: 0 })
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState({ field: 'name', direction: 'asc' })
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [role, setRole] = useState('')
  const [evaluation, setEvaluation] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Debounce the search box so we don't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    let active = true
    setLoading(true) // eslint-disable-line react-hooks/set-state-in-effect
    axiosClient
      .get('/admin/participants/page', {
        params: {
          page,
          size: PAGE_SIZE,
          sort: `${sort.field},${sort.direction}`,
          search: debouncedSearch || undefined,
          role: role || undefined,
          evaluation: evaluation || undefined,
        },
      })
      .then((res) => {
        if (active) {
          setPageData(res.data)
          setError('')
        }
      })
      .catch(() => {
        if (active) setError('Failed to load participants. Please try again.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [page, sort, debouncedSearch, role, evaluation])

  const handleSort = (field) => {
    setPage(0)
    setSort((prev) =>
      prev.field === field
        ? { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { field, direction: 'asc' },
    )
  }

  const columns = [
    { key: 'name', header: 'Name', sortable: true, render: (p) => <span className="font-medium text-slate-900">{p.name}</span> },
    { key: 'email', header: 'Email', sortable: true, render: (p) => p.email },
    { key: 'teamName', header: 'Team', render: (p) => p.teamName },
    { key: 'hackathon', header: 'Hackathon', render: (p) => p.hackathon },
    { key: 'role', header: 'Role', sortable: true, render: (p) => <RoleBadge role={p.role} /> },
    {
      key: 'technicalScore',
      header: 'Skill Score',
      sortable: true,
      render: (p) => <SkillScoreBadge score={p.technicalScore} evaluated={p.evaluated} />,
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-indigo-950">Manage Participants</h2>
        <p className="mt-1 text-sm text-slate-500">
          View and search all registered hackathon participants.
        </p>
      </div>

      {/* Filter toolbar — matches Manage Hackathons */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(0)
          }}
          placeholder="Search by name or email…"
          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:max-w-xs"
        />
        <CustomDropdown
          label="Filter by Role"
          options={ROLE_OPTIONS}
          value={role}
          onChange={(value) => {
            setRole(value)
            setPage(0)
          }}
          className="w-full sm:w-44"
        />
        <CustomDropdown
          label="Filter by Skill Score"
          options={SKILL_OPTIONS}
          value={evaluation}
          onChange={(value) => {
            setEvaluation(value)
            setPage(0)
          }}
          className="w-full sm:w-48"
        />
      </div>

      <DataTable
        columns={columns}
        data={pageData.content}
        rowKey="id"
        loading={loading}
        error={error}
        emptyMessage="No participants match your search."
        sort={sort}
        onSortChange={handleSort}
        page={page}
        totalPages={pageData.totalPages}
        totalElements={pageData.totalElements}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  )
}

export default ParticipantManagement
