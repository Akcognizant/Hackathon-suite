// Simple Previous / Next pager. Always visible; the Previous/Next buttons are
// disabled when there's no page to move to.

export default function Pagination({ page, totalPages, onPrev, onNext, className = '' }) {
  const btn =
    'inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <div className={`mt-6 flex items-center justify-between gap-4 px-1 ${className}`}>
      <button type="button" onClick={onPrev} disabled={page <= 1} className={btn}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        Previous
      </button>
      <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
      <button type="button" onClick={onNext} disabled={page >= totalPages} className={btn}>
        Next
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
      </button>
    </div>
  )
}
