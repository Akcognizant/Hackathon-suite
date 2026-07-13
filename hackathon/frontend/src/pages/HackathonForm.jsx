// Hackathon form — handles both create (/hackathons/new) and edit
// (/hackathons/edit/:id). In edit mode it loads the existing record first.

import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createHackathon,
  updateHackathon,
  getHackathonById,
} from '../services/hackathonService'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { useToast } from '../context/ToastContext'
import { usePermissions, ADMIN_ONLY_TITLE } from '../hooks/usePermissions'

// Client-side validation mirrors the server rules (see Hackathon entity +
// HackathonService) so users get instant feedback before the round-trip.
function validateHackathon(form) {
  const errors = {}
  const title = form.title.trim()
  if (!title) {
    errors.title = 'Title is required.'
  } else if (title.length > 200) {
    errors.title = 'Title must be 200 characters or fewer.'
  }
  if (!form.startDate) errors.startDate = 'Start date is required.'
  if (!form.endDate) errors.endDate = 'End date is required.'
  if (form.startDate && form.endDate && form.endDate < form.startDate) {
    errors.endDate = 'End date must be on or after the start date.'
  }
  return errors
}

// Stored values stay uppercase (data convention); `label` is the Title Case
// display text; `dot` is the color indicator shown beside each option.
const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active', dot: 'bg-green-500' },
  { value: 'UPCOMING', label: 'Upcoming', dot: 'bg-blue-500' },
  { value: 'COMPLETED', label: 'Completed', dot: 'bg-gray-400' },
]

function ChevronDownIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={className}>
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function CheckIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={className}>
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.79 6.8-6.79a1 1 0 0 1 1.4 0Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

// Custom, library-less status dropdown with color-coded indicators.
function StatusSelect({ id, value, onChange }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  // Match the current value case-insensitively (seeds vs. form vs. API casing).
  const selected =
    STATUS_OPTIONS.find(
      (option) => option.value.toUpperCase() === (value || '').toUpperCase(),
    ) || null

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return
    function handlePointer(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    function handleKey(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const handleSelect = (optionValue) => {
    onChange(optionValue)
    setOpen(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        id={id}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between rounded-md border bg-white py-2 pl-3 pr-10 text-left text-sm text-slate-900 shadow-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
          open
            ? 'border-blue-400 ring-2 ring-blue-200'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <span className="flex items-center gap-2">
          {selected ? (
            <>
              <span className={`h-2.5 w-2.5 rounded-full ${selected.dot}`} />
              {selected.label}
            </>
          ) : (
            <span className="text-slate-400">Select status</span>
          )}
        </span>
      </button>

      {/* Chevron nudged into the pr-10 zone, decorative (clicks pass through). */}
      <ChevronDownIcon
        className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-transform duration-200 ${
          open ? 'rotate-180' : ''
        }`}
      />

      {open && (
        <ul
          role="listbox"
          className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {STATUS_OPTIONS.map((option) => {
            const isSelected = selected?.value === option.value
            return (
              <li key={option.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                    isSelected
                      ? 'bg-blue-50 font-semibold text-blue-700'
                      : 'text-slate-700 hover:bg-blue-50/60'
                  }`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${option.dot}`} />
                  {option.label}
                  {isSelected && (
                    <CheckIcon className="ml-auto h-4 w-4 text-blue-600" />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function HackathonForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const { showToast } = useToast()
  const { isAdmin } = usePermissions()

  const [form, setForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'UPCOMING',
  })
  const [errors, setErrors] = useState({}) // server-side field errors
  const [touched, setTouched] = useState({})
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Live validation (recomputed each render) drives the disabled Submit button.
  // A field's error shows once it's been touched, or after a failed server submit.
  const validationErrors = validateHackathon(form)
  const isValid = Object.keys(validationErrors).length === 0
  const errorFor = (field) =>
    (touched[field] && validationErrors[field]) || errors[field] || ''

  // In edit mode, fetch the existing hackathon and populate the form.
  useEffect(() => {
    if (!isEditing) return
    let active = true
    async function loadHackathon() {
      try {
        const data = await getHackathonById(id)
        if (!active) return
        setForm({
          title: data.title ?? '',
          description: data.description ?? '',
          startDate: data.startDate ?? '',
          endDate: data.endDate ?? '',
          status: data.status ?? 'UPCOMING',
        })
      } catch {
        // Unknown id or load failure — fall back to the list.
        if (active) navigate('/hackathons')
      } finally {
        if (active) setLoading(false)
      }
    }
    loadHackathon()
    return () => {
      active = false
    }
  }, [id, isEditing, navigate])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true }))
    // Clear a stale server error on this field as soon as the user edits it.
    setErrors((prev) => (prev[name] ? { ...prev, [name]: '' } : prev))
  }

  const handleBlur = (event) => {
    const { name } = event.target
    setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true }))
  }

  const handleStatusChange = (value) => {
    setForm((prev) => ({ ...prev, status: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    // The Submit button is disabled while invalid, but guard anyway — reveal all
    // field errors if somehow submitted.
    if (!isValid) {
      setTouched({ title: true, startDate: true, endDate: true })
      return
    }

    setErrors({})
    setSaving(true)
    setError('')
    try {
      if (isEditing) {
        await updateHackathon(id, form)
        showToast('Hackathon updated successfully!', 'success')
      } else {
        await createHackathon(form)
        showToast('Hackathon created successfully!', 'success')
      }
      navigate('/hackathons')
    } catch (err) {
      // Map server-side field errors (400 from bean validation) back onto the
      // fields; otherwise show a general message. Either way, let the user retry.
      const fieldErrors = err.response?.data?.fieldErrors
      if (fieldErrors) setErrors(fieldErrors)
      setError(
        err.response?.data?.message ||
          'Something went wrong while saving. Please try again.',
      )
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-medium text-slate-500 shadow-sm">
        Loading…
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          {isEditing ? 'Edit Hackathon' : 'Create New Hackathon'}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {isEditing
            ? 'Update the details of this hackathon event.'
            : 'Fill in the details below to set up a new hackathon event.'}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <Input
          className="mb-5"
          label="Hackathon Title"
          name="title"
          required
          value={form.title}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="e.g. AI Innovation Sprint"
          error={errorFor('title')}
        />

        <Input
          className="mb-5"
          label="Description"
          type="textarea"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Describe the goals, theme, and rules of the hackathon."
        />

        <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input
            label="Start Date"
            type="date"
            name="startDate"
            required
            value={form.startDate}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errorFor('startDate')}
          />
          <Input
            label="End Date"
            type="date"
            name="endDate"
            required
            value={form.endDate}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errorFor('endDate')}
          />
        </div>

        <div className="mb-8">
          <label
            htmlFor="status"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Status
          </label>
          <StatusSelect
            id="status"
            value={form.status}
            onChange={handleStatusChange}
          />
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate('/hackathons')}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={saving}
            disabled={!isValid || !isAdmin}
            title={!isAdmin ? ADMIN_ONLY_TITLE : undefined}
          >
            {isEditing ? 'Update Hackathon' : 'Create Hackathon'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default HackathonForm
