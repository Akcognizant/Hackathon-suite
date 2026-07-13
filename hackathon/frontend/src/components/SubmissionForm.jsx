// Public project-submission page (route: /submit). Multi-tenant: the submitter
// picks a hackathon and supplies that hackathon's access key (X-Team-Secret).
// Uses plain fetch (not the JWT axios client). The hackathon list comes from the
// public, secret-free GET /submissions/hackathons endpoint.

import { useEffect, useState } from 'react'
import { useToast } from '../context/ToastContext'
import Button from './ui/Button'

// Relative by default (same-origin when served by Spring Boot). Set VITE_API_BASE_URL
// only for the standalone Vite dev server (e.g. 'http://localhost:8080').
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

const EMPTY_FORM = { hackathonName: '', teamName: '', projectTitle: '', repoLink: '' }

const FIELD_CLASS =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200'

function SubmissionForm() {
  const [hackathons, setHackathons] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [secretKey, setSecretKey] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()

  // Load the selectable hackathons (public endpoint — no auth, no secrets).
  useEffect(() => {
    let active = true
    fetch(`${API_BASE}/submissions/hackathons`)
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => {
        if (active) setHackathons(Array.isArray(list) ? list : [])
      })
      .catch(() => {
        if (active) setHackathons([])
      })
    return () => {
      active = false
    }
  }, [])

  const update = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (
      !form.hackathonName ||
      !form.teamName.trim() ||
      !form.projectTitle.trim() ||
      !form.repoLink.trim() ||
      !secretKey.trim()
    ) {
      showToast('All fields, including the access key, are required.', 'error')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Team-Secret': secretKey,
        },
        body: JSON.stringify({
          hackathonName: form.hackathonName,
          teamName: form.teamName.trim(),
          projectTitle: form.projectTitle.trim(),
          repoLink: form.repoLink.trim(),
        }),
      })

      if (!res.ok) {
        // fetch only rejects on network errors, so handle non-2xx explicitly.
        let message = 'Submission failed.'
        if (res.status === 401) {
          message = 'Invalid Access Key for this Hackathon'
        } else {
          // Surface the backend's message (e.g. "Team not found…") when present.
          try {
            const body = await res.json()
            if (body?.message) message = body.message
          } catch {
            /* non-JSON error body — keep the generic message */
          }
        }
        showToast(message, 'error')
        return
      }

      showToast('Submitted!', 'success')
      setForm(EMPTY_FORM)
      setSecretKey('')
    } catch {
      showToast('Submission failed. Please check your connection.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-md">
        <div className="mb-6">
          <img src="/cogni.png" alt="Cognizant" className="mb-4 h-8 w-auto object-contain" />
          <h1 className="text-2xl font-bold text-indigo-950">Submit Your Project</h1>
          <p className="mt-1 text-sm text-slate-500">
            Select your hackathon, then enter your team and repository details.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="hackathonName" className="mb-1 block text-sm font-medium text-slate-700">
              Hackathon
            </label>
            <select
              id="hackathonName"
              value={form.hackathonName}
              onChange={update('hackathonName')}
              className={FIELD_CLASS}
            >
              <option value="">Select a hackathon…</option>
              {hackathons.map((h) => (
                <option key={h.id} value={h.title}>
                  {h.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="secretKey" className="mb-1 block text-sm font-medium text-slate-700">
              Access Key
            </label>
            <input
              id="secretKey"
              type="password"
              value={secretKey}
              onChange={(event) => setSecretKey(event.target.value)}
              placeholder="The access key for this hackathon"
              autoComplete="off"
              className={FIELD_CLASS}
            />
          </div>

          <div>
            <label htmlFor="teamName" className="mb-1 block text-sm font-medium text-slate-700">
              Team Name
            </label>
            <input
              id="teamName"
              type="text"
              value={form.teamName}
              onChange={update('teamName')}
              placeholder="e.g. Neural Ninjas"
              className={FIELD_CLASS}
            />
          </div>

          <div>
            <label htmlFor="projectTitle" className="mb-1 block text-sm font-medium text-slate-700">
              Project Title
            </label>
            <input
              id="projectTitle"
              type="text"
              value={form.projectTitle}
              onChange={update('projectTitle')}
              placeholder="e.g. CostGuard — AI Cloud Spend Optimizer"
              className={FIELD_CLASS}
            />
          </div>

          <div>
            <label htmlFor="repoLink" className="mb-1 block text-sm font-medium text-slate-700">
              Repo Link
            </label>
            <input
              id="repoLink"
              type="url"
              value={form.repoLink}
              onChange={update('repoLink')}
              placeholder="https://github.com/your-team/your-project"
              className={FIELD_CLASS}
            />
          </div>

          <Button type="submit" variant="primary" isLoading={submitting} className="w-full">
            {submitting ? 'Submitting…' : 'Submit Project'}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default SubmissionForm
