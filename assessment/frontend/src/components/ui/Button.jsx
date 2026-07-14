// Shared button for the assessment design system. Mirrors the hackathon portal's
// Button API (variant / size / isLoading) so the two apps feel like one product,
// but the primary action keeps PatternIQ's purple accent instead of blue/indigo.
//
// Props:
//   variant   'primary' | 'secondary' | 'danger' | 'ghost'  (default 'primary')
//   size      'sm' | 'md'                                    (default 'md')
//   isLoading boolean — shows a spinner and disables the button
//   className extra classes (e.g. 'w-full h-11' for full-width form submits)
//   ...rest   standard button attributes (onClick, disabled, type, …)

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all focus:outline-none focus:ring-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
}

const VARIANTS = {
  // Primary = PatternIQ purple, subtly deepened on hover (echoes the hackathon's
  // gradient action button, in our accent colour).
  primary:
    'border border-transparent bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-sm hover:from-purple-800 hover:to-purple-900 hover:shadow-md focus:ring-purple-300',
  secondary:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-300',
  danger:
    'border border-red-200 bg-white text-red-600 hover:bg-red-50 focus:ring-red-300',
  ghost:
    'border border-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-300',
}

function Spinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
  )
}

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  type = 'button',
  disabled = false,
  className = '',
  children,
  ...rest
}) {
  const classes = `${BASE} ${SIZES[size] ?? SIZES.md} ${VARIANTS[variant] ?? VARIANTS.primary} ${className}`.trim()
  return (
    <button type={type} disabled={disabled || isLoading} className={classes} {...rest}>
      {isLoading ? <Spinner /> : children}
    </button>
  )
}
