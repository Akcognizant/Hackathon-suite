import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LogoutModal from './Logoutmodal'
import BrandMark from './BrandMark'

export default function Navbar({ showBack = false }) {
  const navigate = useNavigate()
  const [showLogout, setShowLogout] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  const candidate = (() => {
    try { return JSON.parse(sessionStorage.getItem('candidate')) } catch { return null }
  })()
  const firstName = candidate?.name?.split(' ')[0] || 'Candidate'
  const initial = firstName[0]?.toUpperCase() || 'C'

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const go = (path) => { setShowDropdown(false); navigate(path) }

  const menuItem = 'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors text-left'

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
        {/* Brand */}
        <button onClick={() => navigate('/dashboard')} className="cursor-pointer" aria-label="Go to dashboard">
          <BrandMark />
        </button>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {showBack && (
            <button onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-800 transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
              </svg>
              Back to results
            </button>
          )}

          {/* Avatar dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setShowDropdown(v => !v)}
              aria-haspopup="menu" aria-expanded={showDropdown}
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-slate-100">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-600 text-sm font-semibold text-white flex-shrink-0">
                {initial}
              </span>
              <span className="hidden sm:inline text-sm text-slate-600">{firstName}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                className={`text-slate-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showDropdown && (
              <div role="menu"
                className="absolute right-0 top-[calc(100%+0.5rem)] w-64 origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl z-50">
                {/* Candidate info */}
                <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-sm font-semibold text-white">
                    {initial}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{candidate?.name || 'Candidate'}</p>
                    <p className="truncate text-xs text-slate-400">{candidate?.email || candidate?.username}</p>
                  </div>
                </div>

                <div className="flex flex-col p-2">
                  <button role="menuitem" onClick={() => go('/dashboard')} className={`${menuItem} rounded-xl`}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-slate-400">
                      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                    </svg>
                    Dashboard
                  </button>
                  <button role="menuitem" onClick={() => go('/history')} className={`${menuItem} rounded-xl`}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-slate-400">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    History
                  </button>
                  <button role="menuitem" onClick={() => go('/profile')} className={`${menuItem} rounded-xl`}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-slate-400">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                    Profile
                  </button>
                  <div className="mx-2 my-1 h-px bg-slate-100" />
                  <button role="menuitem" onClick={() => { setShowDropdown(false); setShowLogout(true) }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors text-left">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-slate-400">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {showLogout && <LogoutModal onClose={() => setShowLogout(false)} />}
    </>
  )
}
