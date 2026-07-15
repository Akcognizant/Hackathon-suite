// In-page "Sign out?" confirmation used by the participant and admin layouts.
// Renders a backdrop + centered card; calls onConfirm only when the user confirms.

export default function LogoutConfirmModal({ onConfirm, onClose }) {
  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-title"
          className="flex w-full max-w-sm flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        >
          <div className="flex flex-col gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A32D2D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <h2 id="logout-title" className="text-base font-semibold text-slate-900">Sign out?</h2>
              <p className="text-sm leading-relaxed text-slate-500">
                You’ll be returned to the login page and will need to sign in again to continue.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-10 flex-1 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-600 transition-all hover:border-slate-400 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="h-10 flex-1 rounded-xl bg-blue-600 text-sm font-medium text-white transition-all hover:bg-blue-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
