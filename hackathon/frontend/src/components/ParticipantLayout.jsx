// Participant module shell — mirrors the admin layout's look (sticky top navbar,
// dark navy sidebar, light content area) but with participant-scoped navigation
// and a PARTICIPANT role badge. Child routes render via <Outlet/>.

import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { logoutToAssessment } from '../api/authService'

const iconBase = 'h-5 w-5 shrink-0'

const MenuIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)
const DashboardIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
)
const TrophyIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
)
const UsersIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)
const UploadIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)
const FileIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
  </svg>
)
const HistoryIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><path d="M12 7v5l4 2" />
  </svg>
)
const LogoutIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)
const HelpIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/portal', end: true, Icon: DashboardIcon },
  { label: 'Events', to: '/portal/events', end: false, Icon: TrophyIcon },
  { label: 'Teams', to: '/portal/teams', end: false, Icon: UsersIcon },
  { label: 'Submit Project', to: '/portal/submit', end: false, Icon: UploadIcon },
  { label: 'My Submissions', to: '/portal/submissions', end: false, Icon: FileIcon },
  { label: 'History', to: '/portal/history', end: false, Icon: HistoryIcon },
]

const DESKTOP_BREAKPOINT = 1024

function getInitials(email) {
  if (!email) return 'ME'
  const local = email.split('@')[0]
  const parts = local.split(/[._-]+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return local.slice(0, 2).toUpperCase()
}

function ParticipantLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= DESKTOP_BREAKPOINT,
  )
  const navigate = useNavigate()
  const email =
    (typeof window !== 'undefined' && localStorage.getItem('adminEmail')) || ''

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const handleNavClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < DESKTOP_BREAKPOINT) {
      setIsSidebarOpen(false)
    }
  }

  const handleLogout = () => {
    logoutToAssessment()
  }

  const go = (to) => {
    setIsMenuOpen(false)
    navigate(to)
  }

  // Close the profile menu on outside click / Escape.
  useEffect(() => {
    if (!isMenuOpen) return
    const onPointer = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setIsMenuOpen(false) }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onPointer); document.removeEventListener('keydown', onKey) }
  }, [isMenuOpen])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top navbar */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSidebarOpen((o) => !o)}
            aria-label="Toggle sidebar"
            className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <MenuIcon className={iconBase} />
          </button>
          <span className="flex items-baseline text-xl lowercase tracking-tight text-indigo-950">
            <span className="font-normal">cognizant</span>
            <span className="ml-2 font-bold">hackathon&trade;</span>
          </span>
          <span className="translate-y-[1px] rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-800">
            Participant
          </span>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-slate-100"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              {getInitials(email)}
            </span>
            <span className="hidden max-w-[12rem] truncate text-sm text-slate-600 sm:inline">{email}</span>
          </button>

          <div
            role="menu"
            aria-hidden={!isMenuOpen}
            className={`absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl transition-all duration-150 ${
              isMenuOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
            }`}
          >
            <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                {getInitials(email)}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Participant</p>
                <p className="truncate text-sm font-semibold text-slate-900">{email}</p>
              </div>
            </div>
            <div className="flex flex-col p-2">
              <button role="menuitem" onClick={() => go('/portal/my-teams')}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
                <UsersIcon className="h-4 w-4 text-slate-400" /> My Teams
              </button>
              <button role="menuitem" onClick={() => go('/portal/help')}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
                <HelpIcon className="h-4 w-4 text-slate-400" /> Help
              </button>
              <div className="mx-2 my-1 h-px bg-slate-100" />
              <button role="menuitem" onClick={handleLogout}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700">
                <LogoutIcon className="h-4 w-4 text-slate-400" /> Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed bottom-0 left-0 top-16 z-40 flex w-64 flex-col bg-slate-900 transition-all duration-300 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isSidebarOpen ? 'lg:w-64' : 'lg:w-20'}`}
      >
        <nav className="flex flex-1 flex-col gap-1 py-4">
          {NAV_ITEMS.map(({ label, to, end, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={label}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `mx-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isSidebarOpen ? '' : 'lg:justify-center'
                } ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className={iconBase} />
              <span className={`whitespace-nowrap ${isSidebarOpen ? '' : 'lg:hidden'}`}>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className={`border-t border-slate-800 p-4 text-xs text-slate-500 ${isSidebarOpen ? '' : 'lg:hidden'}`}>
          Participant Portal · v0.1
        </div>
      </aside>

      {/* Content */}
      <div className={`flex min-h-screen flex-col pt-16 transition-all duration-300 ${isSidebarOpen ? 'lg:pl-64' : 'lg:pl-20'}`}>
        <main className="flex-1 bg-slate-50 p-8">
          <Outlet />
        </main>
        <footer className="border-t border-gray-200 bg-white px-8 py-4 text-center text-xs text-slate-500">
          © 2026 Cognizant, All rights reserved.
        </footer>
      </div>
    </div>
  )
}

export default ParticipantLayout
