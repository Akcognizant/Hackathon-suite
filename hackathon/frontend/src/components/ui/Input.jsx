// Reusable labeled input/textarea for the admin design system.
//
// Props:
//   label     optional field label
//   type      'text' | 'date' | 'textarea' | any native input type (default 'text')
//   value, onChange, name, required, placeholder, rows, id
//   ...rest   standard field attributes
//
// When type === 'textarea' a <textarea> is rendered; otherwise an <input>.

// Split so the error state cleanly *replaces* the normal border/focus colors
// (avoids conflicting Tailwind classes being present at once).
const FIELD_BASE =
  'w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2'
const FIELD_NORMAL = 'border-slate-300 focus:border-blue-500 focus:ring-blue-200'
const FIELD_ERROR = 'border-red-400 focus:border-red-500 focus:ring-red-200'

function Input({
  label,
  type = 'text',
  id,
  name,
  value,
  onChange,
  required = false,
  placeholder,
  rows = 4,
  className = '',
  error = '',
  ...rest
}) {
  const fieldId = id ?? name
  const isTextarea = type === 'textarea'
  const fieldClasses = `${FIELD_BASE} ${error ? FIELD_ERROR : FIELD_NORMAL}`

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={fieldId}
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}

      {isTextarea ? (
        <textarea
          id={fieldId}
          name={name}
          rows={rows}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          className={`${fieldClasses} resize-y`}
          {...rest}
        />
      ) : (
        <input
          id={fieldId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          className={fieldClasses}
          {...rest}
        />
      )}

      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}

export default Input
