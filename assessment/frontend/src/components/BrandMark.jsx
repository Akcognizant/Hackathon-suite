// Unified brand lockup for the assessment portal. Mirrors the hackathon portal's
// "cognizant hackathon™" wordmark so the suite reads as one product, with a
// purple "PatternIQ" pill marking this as the assessment step.
//
// Props:
//   tone   'dark' (default, for light backgrounds) | 'light' (for dark panels)
//   pill   show the PatternIQ pill (default true)
//   size   'sm' (default) | 'lg'

export default function BrandMark({ tone = 'dark', pill = true, size = 'sm' }) {
  const lg = size === 'lg'
  const wordClass = tone === 'light' ? 'text-white' : 'text-slate-900'
  const box = lg ? 'w-10 h-10 rounded-xl' : 'w-8 h-8 rounded-lg'
  const iconSize = lg ? 20 : 16

  return (
    <div className="flex items-center gap-2.5">
      <div className={`${box} flex items-center justify-center flex-shrink-0 bg-purple-600 text-purple-100`}>
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="3" />
          <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" />
          <line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />
          <line x1="4.22" y1="4.22" x2="7.05" y2="7.05" /><line x1="16.95" y1="16.95" x2="19.78" y2="19.78" />
          <line x1="4.22" y1="19.78" x2="7.05" y2="16.95" /><line x1="16.95" y1="7.05" x2="19.78" y2="4.22" />
        </svg>
      </div>
      <span className={`flex items-baseline ${lg ? 'text-xl' : 'text-base'} lowercase tracking-tight ${wordClass}`}>
        <span className="font-normal">cognizant</span>
        <span className="ml-1.5 font-bold">assessment&trade;</span>
      </span>
      {pill && (
        <span className="translate-y-[1px] rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-800">
          PatternIQ
        </span>
      )}
    </div>
  )
}
