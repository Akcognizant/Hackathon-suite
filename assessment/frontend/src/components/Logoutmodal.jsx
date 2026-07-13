import { useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'

export default function LogoutModal({ onClose }) {
    const navigate = useNavigate()
    const toast = useToast()

    const handleLogout = () => {
        sessionStorage.clear()
        toast.success("You've been signed out")
        navigate('/login')
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
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg w-full max-w-sm p-6 flex flex-col gap-5">

                    {/* Icon + heading */}
                    <div className="flex flex-col gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: '#FFF0F0' }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                stroke="#A32D2D" strokeWidth="1.8" strokeLinecap="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                        </div>
                        <div className="flex flex-col gap-1">
                            <h2 className="text-base font-medium text-gray-900">Sign out?</h2>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Your session data will be cleared. Any unsaved assessment progress will be lost.
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium
                         text-gray-600 bg-white transition-all hover:border-gray-300 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex-1 h-10 rounded-xl text-sm font-medium text-white transition-all"
                            style={{ backgroundColor: '#A32D2D' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#7A1F1F'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#A32D2D'}
                        >
                            Sign out
                        </button>
                    </div>

                </div>
            </div>
        </>
    )
}