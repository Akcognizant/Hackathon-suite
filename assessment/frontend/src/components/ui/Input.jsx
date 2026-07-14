// Shared labeled input for the assessment design system. Handles the patterns the
// auth/profile forms all repeat: a left icon, an error state, and (for passwords)
// a show/hide toggle. Slate neutrals + purple focus ring keep it aligned with the
// hackathon portal's Input while retaining PatternIQ's accent.
//
// Props:
//   label      optional field label
//   icon       optional left-aligned SVG node
//   error      error string (replaces the normal border/ring colours)
//   type       native input type; 'password' auto-adds a reveal toggle
//   hint       optional muted helper text shown after the label
//   ...rest    value, onChange, name, placeholder, autoComplete, disabled, …

import { useState } from 'react'

const BASE =
  'w-full h-11 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-white transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed'
const NORMAL =
  'border-slate-300 hover:border-purple-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-100'
const ERROR =
  'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'

const EyeOpen = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
)
const EyeOff = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

export default function Input({
  label,
  icon,
  error = '',
  hint,
  type = 'text',
  id,
  name,
  className = '',
  ...rest
}) {
  const [reveal, setReveal] = useState(false)
  const fieldId = id ?? name
  const isPassword = type === 'password'
  const effectiveType = isPassword ? (reveal ? 'text' : 'password') : type

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={fieldId} className="text-xs font-medium text-slate-600">
          {label}
          {hint && <span className="ml-1 font-normal text-slate-400">{hint}</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={fieldId}
          name={name}
          type={effectiveType}
          aria-invalid={Boolean(error)}
          className={[
            BASE,
            error ? ERROR : NORMAL,
            icon ? 'pl-9' : 'pl-4',
            isPassword ? 'pr-11' : 'pr-4',
          ].join(' ')}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
          >
            {reveal ? EyeOff : EyeOpen}
          </button>
        )}
      </div>
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}
