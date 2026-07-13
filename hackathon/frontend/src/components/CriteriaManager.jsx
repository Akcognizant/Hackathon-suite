// Per-hackathon evaluation-criteria editor. Loads the hackathon's criteria from
// GET /admin/hackathons/{id}/criteria and saves the full set via POST. Used inside
// the expandable row of the Manage Hackathons table.

import { useEffect, useState } from 'react'
import axiosClient from '../api/axiosClient'
import { useToast } from '../context/ToastContext'
import Button from './ui/Button'
import { usePermissions, ADMIN_ONLY_TITLE } from '../hooks/usePermissions'

const EMPTY_ROW = { name: '', max: 10 }
// Shared between the input's placeholder attribute and the save-time filter so a
// row left at the placeholder text can never be sent to the backend.
const NAME_PLACEHOLDER = 'Criterion (e.g. Scalability)'

function CriteriaManager({ hackathonId }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()
  const { isAdmin } = usePermissions()

  // Load this hackathon's configured criteria once.
  useEffect(() => {
    let active = true
    axiosClient
      .get(`/admin/hackathons/${hackathonId}/criteria`)
      .then((res) => {
        if (active) setRows(res.data.length ? res.data : [{ ...EMPTY_ROW }])
      })
      .catch(() => {
        if (active) setRows([{ ...EMPTY_ROW }])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [hackathonId])

  const updateRow = (index, field, value) =>
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  const addRow = () => setRows((prev) => [...prev, { ...EMPTY_ROW }])
  const removeRow = (index) => setRows((prev) => prev.filter((_, i) => i !== index))

  const totalMax = rows.reduce((sum, row) => sum + (Number(row.max) || 0), 0)

  const handleSave = async () => {
    // Drop blank rows, the untouched placeholder, and any non-positive max before
    // sending. The backend also rejects these with a 400, but cleaning here keeps
    // the common case from ever round-tripping an invalid row.
    const payload = rows
      .map((row) => ({ name: (row.name ?? '').trim(), max: Number(row.max) }))
      .filter((row) => row.name && row.name !== NAME_PLACEHOLDER && row.max > 0)

    if (payload.length === 0) {
      showToast('Add at least one criterion with a name and a positive max score.', 'error')
      return
    }

    setSaving(true)
    try {
      const { data } = await axiosClient.post(`/admin/hackathons/${hackathonId}/criteria`, payload)
      setRows(data)
      showToast('Evaluation criteria saved.', 'success')
    } catch (err) {
      // Surface the backend's specific message (e.g. "Criterion #2 is missing a
      // name") so the admin knows exactly what to fix; fall back to a generic line.
      const message =
        err.response?.data?.message || 'Failed to save criteria. Please try again.'
      showToast(message, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-xs text-slate-400">Loading criteria…</p>
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Evaluation Criteria
        </p>
        <span className="text-xs text-slate-500">
          Total max:{' '}
          <span className="font-semibold tabular-nums text-slate-700">{totalMax}</span>
        </span>
      </div>

      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={row.name}
              onChange={(event) => updateRow(index, 'name', event.target.value)}
              placeholder={NAME_PLACEHOLDER}
              className="h-9 flex-1 rounded-md border border-gray-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <input
              type="number"
              min="1"
              value={row.max}
              onChange={(event) => updateRow(index, 'max', event.target.value)}
              aria-label="Max score"
              className="h-9 w-20 rounded-md border border-gray-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <button
              type="button"
              onClick={() => removeRow(index)}
              aria-label="Remove criterion"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 text-lg leading-none text-slate-400 transition-colors hover:border-red-300 hover:text-red-600"
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={addRow}
          className="text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700"
        >
          + Add criterion
        </button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          isLoading={saving}
          disabled={!isAdmin}
          title={!isAdmin ? ADMIN_ONLY_TITLE : undefined}
        >
          {saving ? 'Saving…' : 'Save Criteria'}
        </Button>
      </div>
    </div>
  )
}

export default CriteriaManager
