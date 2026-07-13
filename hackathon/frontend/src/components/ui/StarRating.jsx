// Clean, clickable 1-5 star rating for the design system. Controlled: pass `value`
// (0 = unrated) and an `onChange(star)` handler. Accessible as a radiogroup.
//
// Props: value (number), onChange (fn), size 'sm' | 'md' (default 'md'), disabled

function StarRating({ value = 0, onChange, size = 'md', disabled = false }) {
  const dims = size === 'sm' ? 'h-5 w-5' : 'h-6 w-6'
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Skill rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange?.(star)}
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          className="rounded p-0.5 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed"
        >
          <svg
            viewBox="0 0 20 20"
            className={`${dims} ${star <= value ? 'text-amber-400' : 'text-slate-200'}`}
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 15l-5.3 2.8 1-5.8L1.5 7.7l5.9-.9z" />
          </svg>
        </button>
      ))}
    </div>
  )
}

export default StarRating
