// Manage Hackathons — server-driven table (GET /admin/events) with pagination,
// sorting, search + status filtering, an expandable criteria row, and a
// delete-confirmation modal. Table UI is the reusable <DataTable/>; this page
// owns the page/sort/filter state and data fetching.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHackathons, deleteHackathon } from '../services/hackathonService'
import { useToast } from '../context/ToastContext'
import Button from '../components/ui/Button'
import DataTable from '../components/ui/DataTable'
import CustomDropdown from '../components/ui/CustomDropdown'
import CriteriaManager from '../components/CriteriaManager'
import { usePermissions } from '../hooks/usePermissions'
import ProtectedRole from '../components/ProtectedRole'

const PAGE_SIZE = 10

const STATUS_FILTERS = [
  { value: '', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'COMPLETED', label: 'Completed' },
]

function StatusBadge({ status }) {
  const s = status?.toUpperCase() || ''
  let tone = 'border-gray-300 bg-gray-50 text-gray-500'
  if (s === 'ACTIVE') tone = 'border-green-500 bg-green-50 text-green-700'
  else if (s === 'UPCOMING') tone = 'border-blue-500 bg-blue-50 text-blue-700'
  else if (s === 'COMPLETED') tone = 'border-gray-400 bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex rounded-full border px-3 py-0.5 text-xs font-bold uppercase tracking-wide ${tone}`}>
      {status || '—'}
    </span>
  )
}

function WarningTriangleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function HackathonList() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { canAccess } = usePermissions()

  const [pageData, setPageData] = useState({ content: [], totalElements: 0, totalPages: 0 })
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState({ field: 'startDate', direction: 'asc' })
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshTick, setRefreshTick] = useState(0)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [hackathonToDelete, setHackathonToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Debounce the search box so we don't fire a request on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Single fetch for page/sort/filter changes (and after a delete via refreshTick).
  useEffect(() => {
    let active = true
    setLoading(true) // eslint-disable-line react-hooks/set-state-in-effect
    getHackathons({
      page,
      size: PAGE_SIZE,
      sort: `${sort.field},${sort.direction}`,
      search: debouncedSearch,
      status: statusFilter,
    })
      .then((data) => {
        if (active) {
          setPageData(data)
          setError('')
        }
      })
      .catch(() => {
        if (active) setError('Failed to load hackathons. Please try again.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [page, sort, debouncedSearch, statusFilter, refreshTick])

  const handleSort = (field) => {
    setPage(0)
    setSort((prev) =>
      prev.field === field
        ? { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { field, direction: 'asc' },
    )
  }

  const openDeleteModal = (hackathon) => {
    setHackathonToDelete(hackathon)
    setIsDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    if (deleting) return
    setIsDeleteModalOpen(false)
    setHackathonToDelete(null)
  }

  const confirmDelete = async () => {
    if (!hackathonToDelete) return
    setDeleting(true)
    try {
      await deleteHackathon(hackathonToDelete.id)
      showToast('Hackathon deleted.', 'success')
      setIsDeleteModalOpen(false)
      setHackathonToDelete(null)
      // If we removed the last row on a non-first page, step back; else just refetch.
      if (pageData.content.length === 1 && page > 0) {
        setPage((p) => p - 1)
      } else {
        setRefreshTick((t) => t + 1)
      }
    } catch {
      showToast('Failed to delete hackathon. Please try again.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    if (!isDeleteModalOpen) return
    function handleKey(event) {
      if (event.key === 'Escape') closeDeleteModal()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDeleteModalOpen, deleting])

  const columns = [
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (h) => <span className="font-medium text-slate-900">{h.title}</span>,
    },
    { key: 'startDate', header: 'Start Date', sortable: true, render: (h) => <span className="tabular-nums">{h.startDate}</span> },
    { key: 'endDate', header: 'End Date', sortable: true, render: (h) => <span className="tabular-nums">{h.endDate}</span> },
    { key: 'status', header: 'Status', sortable: true, render: (h) => <StatusBadge status={h.status} /> },
    // Edit/Delete are admin-only, so the whole Actions column is omitted for judges
    // (they see a clean, read-only list rather than an empty column).
    ...(canAccess('ADMIN')
      ? [
          {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (h) => (
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/hackathons/edit/${h.id}`)}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => openDeleteModal(h)}
                >
                  Delete
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ]

  const renderExpanded = (h) => (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Description</p>
      <p className="text-sm text-slate-600">
        {h.description ? h.description : <span className="italic text-gray-400">No description provided.</span>}
      </p>
      <div className="mt-4 border-t border-gray-200 pt-4">
        <CriteriaManager hackathonId={h.id} />
      </div>
    </div>
  )

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-indigo-950">Manage Hackathons</h2>
          <p className="mt-1 text-sm text-slate-500">View and manage all hackathon events.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ProtectedRole role="ADMIN">
            <Button variant="primary" onClick={() => navigate('/hackathons/new')}>
              + Create New Hackathon
            </Button>
          </ProtectedRole>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(0)
          }}
          placeholder="Search by title…"
          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:max-w-xs"
        />
        <CustomDropdown
          ariaLabel="Filter by status"
          options={STATUS_FILTERS}
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value)
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
        emptyMessage="No hackathon events match your filters."
        sort={sort}
        onSortChange={handleSort}
        page={page}
        totalPages={pageData.totalPages}
        totalElements={pageData.totalElements}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        renderExpanded={renderExpanded}
      />

      {/* ---------- Delete confirmation modal ---------- */}
      {isDeleteModalOpen && (
        <div
          onClick={closeDeleteModal}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            onClick={(event) => event.stopPropagation()}
            className="animate-in fade-in zoom-in mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl duration-200"
          >
            <div className="mb-4 flex items-center gap-2">
              <img src="/cogni.png" alt="Cognizant Logo" className="h-8 w-auto object-contain" />
            </div>
            <div className="flex items-center gap-2">
              <WarningTriangleIcon className="h-6 w-6 shrink-0 text-amber-500" />
              <h3 id="delete-modal-title" className="text-xl font-bold text-slate-900">
                Confirm Deletion
              </h3>
            </div>
            <div className="mt-4">
              <p className="text-sm leading-relaxed text-slate-600">
                Are you sure you want to permanently delete the{' '}
                <span className="font-semibold text-slate-900">{hackathonToDelete?.title}</span> hackathon?
                All associated participant data, team rosters, and project submissions will be erased.
              </p>
              <p className="mt-3 font-medium text-slate-900">This action is irreversible.</p>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <Button variant="secondary" onClick={closeDeleteModal} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmDelete} isLoading={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HackathonList
