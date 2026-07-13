import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
    const navigate = useNavigate()

    const isLoggedIn = (() => {
        try { return !!sessionStorage.getItem('candidate') } catch { return false }
    })()

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6"
            style={{ backgroundColor: '#f7f7f8' }}>

            {/* Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm
                      w-full max-w-md p-10 flex flex-col items-center gap-6 text-center">

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: '#EEEDFE' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                        stroke="#534AB7" strokeWidth="1.8" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </div>

                {/* Text */}
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium tracking-widest uppercase"
                        style={{ color: '#1D9E75' }}>
                        404 — Not found
                    </p>
                    <h1 className="text-2xl font-medium text-gray-900">
                        Page doesn't exist
                    </h1>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        The page you're looking for has been moved, deleted, or never existed.
                    </p>
                </div>

                {/* Pattern decoration */}
                <div className="flex items-center gap-2 my-1">
                    {['▲', '▲▲', '▲▲▲', '?'].map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-medium"
                                style={
                                    item === '?'
                                        ? { border: '1.5px dashed #534AB7', backgroundColor: '#EEEDFE', color: '#534AB7' }
                                        : { backgroundColor: '#f7f7f8', color: '#26215C' }
                                }
                            >
                                {item}
                            </div>
                            {i < 3 && <span className="text-gray-200 text-xs">→</span>}
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 w-full">
                    <button
                        onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')}
                        className="w-full h-11 rounded-xl text-sm font-medium text-white
                       transition-all active:scale-[0.98]"
                        style={{ backgroundColor: '#534AB7' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#3C3489'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#534AB7'}
                    >
                        {isLoggedIn ? 'Back to dashboard' : 'Go to login'}
                    </button>

                    {isLoggedIn && (
                        <button
                            onClick={() => navigate(-1)}
                            className="w-full h-11 rounded-xl text-sm font-medium border
                         border-gray-200 text-gray-600 bg-white transition-all
                         hover:border-gray-300 hover:bg-gray-50"
                        >
                            Go back
                        </button>
                    )}
                </div>

            </div>

            {/* Branding */}
            <div className="flex items-center gap-2 mt-8">
                <div className="w-6 h-6 rounded-md flex items-center justify-center"
                    style={{ backgroundColor: '#534AB7', color: '#CECBF6' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="3" />
                        <line x1="12" y1="2" x2="12" y2="6" />
                        <line x1="12" y1="18" x2="12" y2="22" />
                        <line x1="2" y1="12" x2="6" y2="12" />
                        <line x1="18" y1="12" x2="22" y2="12" />
                    </svg>
                </div>
                <span className="text-xs text-gray-400">PatternIQ</span>
            </div>

        </div>
    )
}