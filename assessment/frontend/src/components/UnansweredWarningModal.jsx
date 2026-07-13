export default function UnansweredWarningModal({
    unansweredNumbers = [],
    reviewNumbers = [],
    onConfirm,
    onClose,
}) {
    const unanswered = unansweredNumbers.length
    const review = reviewNumbers.length

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg
                        w-full max-w-sm p-7 flex flex-col gap-5">

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
                            <h2 className="text-base font-medium text-gray-900">
                                Submit your assessment?
                            </h2>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                {unanswered > 0
                                    ? `${unanswered} question${unanswered > 1 ? 's are' : ' is'} still unanswered and will score zero. `
                                    : 'All questions are answered. '}
                                You can't make changes after submitting.
                            </p>
                        </div>
                    </div>

                    {/* Unanswered questions */}
                    {unanswered > 0 && (
                        <div className="flex flex-col gap-2 px-1">
                            <p className="text-xs font-medium text-gray-400">
                                Unanswered ({unanswered})
                            </p>
                            <div className="flex gap-1.5 flex-wrap">
                                {unansweredNumbers.map((n) => (
                                    <span key={n}
                                        className="w-7 h-7 rounded-md text-xs font-medium font-mono flex items-center justify-center"
                                        style={{ backgroundColor: '#FFF0F0', color: '#A32D2D' }}>
                                        {n}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Marked for review */}
                    {review > 0 && (
                        <div className="flex flex-col gap-2 px-1">
                            <p className="text-xs font-medium text-gray-400">
                                Marked for review ({review})
                            </p>
                            <div className="flex gap-1.5 flex-wrap">
                                {reviewNumbers.map((n) => (
                                    <span key={n}
                                        className="w-7 h-7 rounded-md text-xs font-medium font-mono flex items-center justify-center"
                                        style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                                        {n}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 h-10 rounded-xl border border-gray-200 text-sm
                         font-medium text-gray-600 bg-white transition-all
                         hover:border-gray-300 hover:bg-gray-50"
                        >
                            Go back
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 h-10 rounded-xl text-sm font-medium text-white
                         transition-all active:scale-[0.98]"
                            style={{ backgroundColor: '#534AB7' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#3C3489'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#534AB7'}
                        >
                            Submit anyway
                        </button>
                    </div>

                </div>
            </div>
        </>
    )
}
