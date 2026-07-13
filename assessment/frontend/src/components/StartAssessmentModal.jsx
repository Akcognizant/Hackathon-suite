import { useNavigate } from 'react-router-dom'

export default function StartAssessmentModal({ onClose }) {
    const navigate = useNavigate()

    const handleStart = () => {
        navigate('/assessment')
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg w-full max-w-md p-6 flex flex-col gap-5">

                    {/* Icon + heading */}
                    <div className="flex flex-col gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: '#EEEDFE' }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                stroke="#534AB7" strokeWidth="1.8" strokeLinecap="round">
                                <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        </div>
                        <div className="flex flex-col gap-1">
                            <h2 className="text-base font-medium text-gray-900">Ready to begin?</h2>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Please read the following before starting your assessment.
                            </p>
                        </div>
                    </div>

                    {/* Warnings */}
                    <div
                        className="rounded-xl p-4 flex flex-col gap-3"
                        style={{ backgroundColor: '#EEEDFE' }}
                    >
                        <div className="flex items-center gap-2">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                stroke="#534AB7" strokeWidth="2" strokeLinecap="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                            <p className="text-xs font-medium" style={{ color: '#3C3489' }}>Before you start</p>
                        </div>
                        <ul className="flex flex-col gap-2 list-none">
                            {[
                                'The timer runs across both sections and does not pause',
                                'You can close and resume, but the clock keeps running',
                                'Find a quiet, distraction-free space',
                            ].map((note) => (
                                <li key={note} className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: '#7F77DD' }} />
                                    <span className="text-xs leading-relaxed" style={{ color: '#534AB7' }}>
                                        {note}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Stats row */}
                    <div className="flex justify-between px-1">
                        {[['15', 'questions'], ['2', 'sections'], ['~20m', 'duration']].map(([val, lbl]) => (
                            <div key={lbl} className="flex flex-col items-center gap-0.5">
                                <span className="text-base font-medium font-mono" style={{ color: '#26215C' }}>{val}</span>
                                <span className="text-xs text-gray-400">{lbl}</span>
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium
                         text-gray-600 bg-white transition-all hover:border-gray-300 hover:bg-gray-50"
                        >
                            Not yet
                        </button>
                        <button
                            onClick={handleStart}
                            className="flex-1 h-10 rounded-xl text-sm font-medium text-white
                         transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            style={{ backgroundColor: '#534AB7' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#3C3489'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#534AB7'}
                        >
                            Begin assessment
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </button>
                    </div>

                </div>
            </div>
        </>
    )
}