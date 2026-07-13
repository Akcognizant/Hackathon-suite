// Submission Tracking — server-paginated table (GET /admin/submissions/page) using
// the shared <DataTable/>, matching the Manage Hackathons look & feel. Supports the
// "Hide Reviewed" (status=PENDING) filter and the ?team= pivot from the Teams page,
// both driven server-side so they work together with pagination. Approve/Reject are
// custom column renderers.

import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import axiosClient from '../api/axiosClient'
import { useToast } from '../context/ToastContext'
import DataTable from './ui/DataTable'

const PAGE_SIZE = 10

function SubmissionStatusBadge({ status }) {
  const normalized = status?.toUpperCase() || ''
  let tone = 'border-gray-300 bg-gray-50 text-gray-500'
  if (normalized === 'PENDING') tone = 'border-amber-400 bg-amber-50 text-amber-700'
  else if (normalized === 'APPROVED') tone = 'border-green-500 bg-green-50 text-green-700'
  else if (normalized === 'REJECTED') tone = 'border-red-500 bg-red-50 text-red-700'
  return (
    <span className={`inline-flex rounded-full border px-3 py-0.5 text-xs font-bold uppercase tracking-wide ${tone}`}>
      {status || '—'}
    </span>
  )
}

function ExternalLinkIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

function ArrowLeftIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

function SubmissionTracking() {
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const teamFilter = searchParams.get('team') || '' // set by the Teams "View Details" pivot

  const [pageData, setPageData] = useState({ content: [], totalElements: 0, totalPages: 0 })
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState({ field: 'id', direction: 'desc' })
  const [showPendingOnly, setShowPendingOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [refreshTick, setRefreshTick] = useState(0)

  // Server-side fetch: status + team filters and sort all applied by the backend.
  useEffect(() => {
    let active = true
    setLoading(true) // eslint-disable-line react-hooks/set-state-in-effect
    axiosClient
      .get('/admin/submissions/page', {
        params: {
          page,
          size: PAGE_SIZE,
          sort: `${sort.field},${sort.direction}`,
          status: showPendingOnly ? 'PENDING' : undefined,
          team: teamFilter || undefined,
        },
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
  }, [page, sort, showPendingOnly, teamFilter, refreshTick])

  const handleSort = (field) => {
    setPage(0)
    setSort((prev) =>
      prev.field === field
        ? { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { field, direction: 'asc' },
    )
  }

  const updateStatus = async (id, status) => {
    setBusyId(id)
    try {
      await axiosClient.put(`/admin/submissions/${id}/status`, { status })
      showToast(
        status === 'APPROVED' ? 'Submission approved successfully!' : 'Submission rejected.',
        status === 'APPROVED' ? 'success' : 'error',
      )
      // Refetch; if that was the last row on a non-first page, step back one page.
      if (pageData.content.length === 1 && page > 0) {
        setPage((p) => p - 1)
      } else {
        setRefreshTick((t) => t + 1)
      }
    } catch {
      showToast('Failed to update submission. Please try again.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const columns = [
    { key: 'team', header: 'Team', render: (s) => <span className="font-medium text-slate-900">{s.team}</span> },
    { key: 'hackathon', header: 'Hackathon', render: (s) => s.hackathon },
    { key: 'projectTitle', header: 'Project Title', sortable: true, render: (s) => s.projectTitle },
    {
      key: 'link',
      header: 'Link',
      render: (s) =>
        s.repositoryUrl ? (
          <a
            href={s.repositoryUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open repository"
            className="inline-flex items-center gap-1 text-blue-600 transition-colors hover:text-blue-700"
          >
            <ExternalLinkIcon className="h-4 w-4" />
            <span className="text-xs font-medium">Repo</span>
          </a>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
    { key: 'status', header: 'Status', sortable: true, render: (s) => <SubmissionStatusBadge status={s.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (s) => {
        const isPending = s.status?.toUpperCase() === 'PENDING'
        const isBusy = busyId === s.id
        if (!isPending) {
          return <span className="text-xs font-medium text-slate-400">Reviewed</span>
        }
        return (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => updateStatus(s.id, 'APPROVED')}
              disabled={isBusy}
              className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-700 transition-colors hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => updateStatus(s.id, 'REJECTED')}
              disabled={isBusy}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-indigo-950">Submission Tracking</h2>
          <p className="mt-1 text-sm text-slate-500">
            Review project submissions and approve or reject them.
          </p>
        </div>

        {showPendingOnly ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowPendingOnly(false)
                setPage(0)
              }}
              title="Back to all submissions"
              aria-label="Back to all submissions"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
            <span className="inline-flex items-center rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white">
              Showing Pending Only
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setShowPendingOnly(true)
              setPage(0)
            }}
            title="Show only pending (un-reviewed) submissions"
            className="shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Hide Reviewed Submissions
          </button>
        )}
      </div>

      {teamFilter && (
        <div className="mb-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSearchParams({})
              setPage(0)
            }}
            title="Back to all submissions"
            aria-label="Clear team filter"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </button>
          <span className="inline-flex items-center rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white">
            Showing Team: {teamFilter}
          </span>
        </div>
      )}

      <DataTable
        columns={columns}
        data={pageData.content}
        rowKey="id"
        loading={loading}
        error={error}
        emptyMessage="No submissions match your filters."
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

export default SubmissionTracking
