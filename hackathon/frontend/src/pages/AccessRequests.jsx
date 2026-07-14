// Admin-only: review pending admin/judge access requests. Approve → creates the
// account; Reject → discards. Judges are redirected away (ADMIN-only).

import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { usePermissions } from '../hooks/usePermissions'
import { useToast } from '../context/ToastContext'
import Button from '../components/ui/Button'
import {
  listAccessRequests,
  approveAccessRequest,
  rejectAccessRequest,
} from '../api/accessRequestApi'

const ROLE_BADGE = {
  ADMIN: 'bg-indigo-100 text-indigo-800',
  JUDGE: 'bg-emerald-100 text-emerald-800',
}

function AccessRequests() {
  const { isAdmin } = usePermissions()
  const { showToast } = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const load = () => {
    setLoading(true)
    listAccessRequests('PENDING')
      .then(setRows)
      .catch(() => showToast('Failed to load requests.', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (isAdmin) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Judges (or anyone non-admin) can't manage requests.
  if (!isAdmin) return <Navigate to="/dashboard" replace />

  const act = async (id, kind) => {
    setBusyId(id)
    try {
      if (kind === 'approve') {
        await approveAccessRequest(id)
        showToast('Request approved — account created.', 'success')
      } else {
        await rejectAccessRequest(id)
        showToast('Request rejected.', 'success')
      }
      setRows((r) => r.filter((x) => x.id !== id))
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-indigo-950">Access Requests</h2>
        <p className="mt-1 text-sm text-slate-500">
          Approve or reject people requesting Admin or Judge accounts.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-slate-500 shadow-sm">
          No pending requests.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Requested role</th>
                <th className="px-6 py-3">Reason</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="px-6 py-4 font-medium text-slate-800">{r.name}</td>
                  <td className="px-6 py-4 text-slate-600">{r.email}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_BADGE[r.requestedRole] || 'bg-slate-100 text-slate-600'}`}>
                      {r.requestedRole}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-xs text-xs text-slate-500">{r.reason || '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="primary" isLoading={busyId === r.id} onClick={() => act(r.id, 'approve')}>
                        Approve
                      </Button>
                      <Button size="sm" variant="danger" disabled={busyId === r.id} onClick={() => act(r.id, 'reject')}>
                        Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AccessRequests
