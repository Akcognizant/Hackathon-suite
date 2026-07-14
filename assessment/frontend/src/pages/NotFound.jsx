import { useNavigate } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import Button from '../components/ui/Button'

export default function NotFoundPage() {
    const navigate = useNavigate()

    const isLoggedIn = (() => {
        try { return !!sessionStorage.getItem('candidate') } catch { return false }
    })()

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-slate-50">

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm w-full max-w-md p-10 flex flex-col items-center gap-6 text-center">

                {/* Oversized 404 with a subtle icon */}
                <div className="flex items-center gap-4">
                    <span className="text-6xl font-bold tracking-tight text-slate-900 leading-none">404</span>
                    <span className="w-14 h-14 rounded-2xl flex items-center justify-center bg-purple-50">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="1.8" strokeLinecap="round">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            <line x1="8" y1="11" x2="14" y2="11" />
                        </svg>
                    </span>
                </div>

                {/* Text */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-xl font-semibold text-slate-900">Page not found</h1>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        The page you're looking for has been moved, deleted, or never existed.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 w-full">
                    <Button onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')} className="w-full h-11">
                        {isLoggedIn ? 'Back to dashboard' : 'Go to login'}
                    </Button>
                    {isLoggedIn && (
                        <Button variant="secondary" onClick={() => navigate(-1)} className="w-full h-11">
                            Go back
                        </Button>
                    )}
                </div>
            </div>

            {/* Branding */}
            <div className="mt-8">
                <BrandMark pill={false} />
            </div>

        </div>
    )
}
