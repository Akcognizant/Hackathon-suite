import Button from './ui/Button'

// Confirmation shown when a candidate tries to navigate away (browser Back) mid-
// assessment. Replaces the native window.confirm() with the app's modal styling,
// matching UnansweredWarningModal.
export default function LeaveAssessmentModal({ onStay, onLeave }) {
    return (
        <>
            {/* Backdrop — clicking it keeps them on the assessment */}
            <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onStay} />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-lg w-full max-w-sm p-7 flex flex-col gap-5">

                    {/* Icon + heading */}
                    <div className="flex flex-col gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: '#FFF7E0' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                stroke="#7A4F00" strokeWidth="1.8" strokeLinecap="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        </div>
                        <div className="flex flex-col gap-1">
                            <h2 className="text-base font-semibold text-slate-900">Leave the assessment?</h2>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Your answers are saved and you can resume later — but the timer keeps
                                running while you're away.
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={onStay} className="flex-1 h-10">
                            Stay
                        </Button>
                        <Button onClick={onLeave} className="flex-1 h-10">
                            Leave anyway
                        </Button>
                    </div>

                </div>
            </div>
        </>
    )
}
