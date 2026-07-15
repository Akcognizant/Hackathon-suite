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

// Today's date as a local YYYY-MM-DD string. Built from the local calendar (not
// toISOString(), which is UTC and can be a day off in +/- timezones) so date-only
// string comparisons like `startDate < today` line up with what the user sees.
function todayLocalISO() {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

// Client-side validation mirrors the server rules (see Hackathon entity +
// HackathonService) so users get instant feedback before the round-trip.
// `isEditing` relaxes the "no past start date" rule: an existing hackathon may
// legitimately have started in the past, so we only forbid past starts on create.
function validateHackathon(form, { isEditing = false, today = '' } = {}) {
  const errors = {}
  const title = form.title.trim()
  if (!title) {
    errors.title = 'Title is required.'
  } else if (title.length > 200) {
    errors.title = 'Title must be 200 characters or fewer.'
  }
  if (!form.startDate) {
    errors.startDate = 'Start date is required.'
  } else if (!isEditing && today && form.startDate < today) {
    errors.startDate = 'Start date cannot be in the past.'
  }
  if (!form.endDate) errors.endDate = 'End date is required.'
  if (form.startDate && form.endDate && form.endDate < form.startDate) {
    errors.endDate = 'End date must be on or after the start date.'
  }

  // Team-size bounds are optional (blank = no limit) but must be sensible when set.
  const min = form.minTeamSize === '' ? null : Number(form.minTeamSize)
  const max = form.maxTeamSize === '' ? null : Number(form.maxTeamSize)
  if (min !== null && (!Number.isInteger(min) || min < 1)) {
    errors.minTeamSize = 'Min team size must be a whole number of at least 1.'
  }
  if (max !== null && (!Number.isInteger(max) || max < 1)) {
    errors.maxTeamSize = 'Max team size must be a whole number of at least 1.'
  }
  if (min !== null && max !== null && !errors.minTeamSize && !errors.maxTeamSize && max < min) {
    errors.maxTeamSize = 'Max team size must be greater than or equal to the min.'
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
    minTeamSize: '',
    maxTeamSize: '',
  })
  const [errors, setErrors] = useState({}) // server-side field errors
  const [touched, setTouched] = useState({})
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Recomputed each render — cheap and keeps the min/validation in lockstep.
  const today = todayLocalISO()

  // Live validation (recomputed each render) drives the disabled Submit button.
  // A field's error shows once it's been touched, or after a failed server submit.
  const validationErrors = validateHackathon(form, { isEditing, today })
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
          minTeamSize: data.minTeamSize ?? '',
          maxTeamSize: data.maxTeamSize ?? '',
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
      setTouched({
        title: true,
        startDate: true,
        endDate: true,
        minTeamSize: true,
        maxTeamSize: true,
      })
      return
    }

    setErrors({})
    setSaving(true)
    setError('')
    // Convert the team-size text inputs to numbers (or null when left blank so the
    // limit is cleared server-side).
    const payload = {
      ...form,
      minTeamSize: form.minTeamSize === '' ? null : Number(form.minTeamSize),
      maxTeamSize: form.maxTeamSize === '' ? null : Number(form.maxTeamSize),
    }
    try {
      if (isEditing) {
        await updateHackathon(id, payload)
        showToast('Hackathon updated successfully!', 'success')
      } else {
        await createHackathon(payload)
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
      <button
        type="button"
        onClick={() => navigate('/hackathons')}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        Back to Manage Hackathons
      </button>
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
            // Block past dates in the native picker on create. In edit mode we
            // leave it open so an already-started event can still be adjusted.
            min={isEditing ? undefined : today}
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
            // End can't precede the start; fall back to today on create.
            min={form.startDate || (isEditing ? undefined : today)}
            value={form.endDate}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errorFor('endDate')}
          />
        </div>

        {/* Team size — how many members a team may have for this event. Optional:
            leave blank for no limit. */}
        <div className="mb-1 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input
            label="Min Team Size"
            type="number"
            name="minTeamSize"
            min={1}
            value={form.minTeamSize}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="e.g. 2"
            error={errorFor('minTeamSize')}
          />
          <Input
            label="Max Team Size"
            type="number"
            name="maxTeamSize"
            min={1}
            value={form.maxTeamSize}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="e.g. 5"
            error={errorFor('maxTeamSize')}
          />
        </div>
        <p className="mb-8 text-xs text-slate-400">
          How many members a team may have for this event. Leave blank for no limit.
        </p>

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
