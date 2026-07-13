import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import LogoutModal from './Logoutmodal'

const NAV_LINKS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'History', path: '/history' },
]

export default function Navbar({ showBack = false }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [showLogout, setShowLogout] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  const candidate = (() => {
    try { return JSON.parse(sessionStorage.getItem('candidate')) } catch { return null }
  })()
  const firstName = candidate?.name?.split(' ')[0] || 'Candidate'

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      <nav
        className="flex items-center justify-between px-8 py-4 border-b border-white/10"
        style={{ backgroundColor: '#26215C' }}
      >
        {/* Brand */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate('/dashboard')}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: '#534AB7', color: '#CECBF6' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="3" />
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="4.22" y1="4.22" x2="7.05" y2="7.05" />
              <line x1="16.95" y1="16.95" x2="19.78" y2="19.78" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
              <line x1="4.22" y1="19.78" x2="7.05" y2="16.95" />
              <line x1="16.95" y1="7.05" x2="19.78" y2="4.22" />
            </svg>
          </div>
          <span className="text-sm font-medium" style={{ color: '#EEEDFE' }}>PatternIQ</span>
        </div>
        

        {/* Right side */}
        <div className="flex items-center gap-4">

          {/* Back button */}
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-xs transition-colors"
              style={{ color: '#7F77DD' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to results
            </button>
          )}

          {/* Avatar dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(prev => !prev)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors"
              style={{ color: '#AFA9EC' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(83,74,183,0.2)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center
                           text-xs font-medium flex-shrink-0"
                style={{ backgroundColor: '#534AB7', color: '#CECBF6' }}
              >
                {firstName[0].toUpperCase()}
              </div>
              <span className="text-sm">{firstName}</span>
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {showDropdown && (
              <div
                className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl
                           border border-gray-100 shadow-lg overflow-hidden z-20"
              >
                {/* Candidate info */}
                <div className="px-4 py-3 border-b border-gray-50">
                  <p className="text-xs font-medium text-gray-700">
                    {candidate?.name || 'Candidate'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {candidate?.email || candidate?.username}
                  </p>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    onClick={() => { setShowDropdown(false); navigate('/dashboard') }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm
                               text-gray-600 hover:bg-gray-50 transition-colors text-left"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                    </svg>
                    Dashboard
                  </button>

                  <button
                    onClick={() => { setShowDropdown(false); navigate('/history') }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm
                               text-gray-600 hover:bg-gray-50 transition-colors text-left"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    History
                  </button>

                  <button
                    onClick={() => { setShowDropdown(false); navigate('/profile') }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm
                               text-gray-600 hover:bg-gray-50 transition-colors text-left"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Profile
                  </button>
                </div>

                <div className="border-t border-gray-50 py-1">
                  <button
                    onClick={() => { setShowDropdown(false); setShowLogout(true) }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm
                               transition-colors text-left"
                    style={{ color: '#A32D2D' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FFF0F0'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </nav>

      {showLogout && <LogoutModal onClose={() => setShowLogout(false)} />}
    </>
  )
}