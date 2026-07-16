// Participant module shell — mirrors the admin layout's look (sticky top navbar,
// dark navy sidebar, light content area) but with participant-scoped navigation
// and a PARTICIPANT role badge. Child routes render via <Outlet/>.

import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { logoutToLogin } from '../api/authService'
import LogoutConfirmModal from './LogoutConfirmModal'
import { getMyMessages, markMessageRead, clearMyMessages } from '../api/participantApi'
import { useToast } from '../context/ToastContext'

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
const BellIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)

function timeAgo(iso) {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/portal', end: true, Icon: DashboardIcon },
  { label: 'Events', to: '/portal/events', end: false, Icon: TrophyIcon },
  { label: 'Join team', to: '/portal/teams', end: false, Icon: UsersIcon },
  { label: 'My Teams', to: '/portal/my-teams', end: false, Icon: UsersIcon },
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const menuRef = useRef(null)

  // Notifications — messages an admin sent (direct + announcements). "Unopened" is
  // tracked client-side (localStorage) so announcements — which have no per-user
  // read flag on the server — also count toward the badge.
  const toast = useToast()
  const SEEN_KEY = `notif_seen_${email}`
  const DISMISSED_KEY = `notif_dismissed_${email}`
  const [messages, setMessages] = useState([])
  const [seenIds, setSeenIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')) } catch { return new Set() }
  })
  const [dismissedIds, setDismissedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]')) } catch { return new Set() }
  })
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const notifRef = useRef(null)
  const prevUnreadRef = useRef(0)
  const firstLoadRef = useRef(true)

  // Messages the user hasn't cleared, newest first (as returned by the API).
  const displayed = messages.filter((m) => !dismissedIds.has(m.id))
  const unread = displayed.reduce((n, m) => (seenIds.has(m.id) ? n : n + 1), 0)

  const persistSeen = (set) => {
    try { localStorage.setItem(SEEN_KEY, JSON.stringify([...set])) } catch { /* ignore quota */ }
  }
  const persistDismissed = (set) => {
    try { localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set])) } catch { /* ignore quota */ }
  }

  const loadNotifications = () => {
    getMyMessages().then(setMessages).catch(() => {})
  }

  const toggleNotifications = async () => {
    const opening = !isNotifOpen
    setIsNotifOpen(opening)
    if (!opening) return
    // Mark direct messages read on the server, and mark everything shown as seen locally.
    const unreadDirect = displayed.filter((m) => m.receiverId != null && !m.read)
    await Promise.all(unreadDirect.map((m) => markMessageRead(m.id).catch(() => {})))
    const next = new Set(seenIds)
    displayed.forEach((m) => next.add(m.id))
    setSeenIds(next)
    persistSeen(next)
    if (unreadDirect.length) loadNotifications()
  }

  const clearAll = async () => {
    // Delete direct messages on the server; dismiss everything (incl. shared
    // announcements) locally so the inbox empties for this user.
    await clearMyMessages().catch(() => {})
    const next = new Set(dismissedIds)
    messages.forEach((m) => next.add(m.id))
    setDismissedIds(next)
    persistDismissed(next)
    loadNotifications()
  }

  // Initial load + light polling so new messages surface without a refresh.
  useEffect(() => {
    loadNotifications()
    const id = setInterval(loadNotifications, 30000)
    return () => clearInterval(id)
  }, [])

  // Pop a toast when the unopened count rises (a new message arrived). Skip the
  // very first computation so we don't toast on page load.
  useEffect(() => {
    const count = messages.filter((m) => !dismissedIds.has(m.id)).reduce((n, m) => (seenIds.has(m.id) ? n : n + 1), 0)
    if (firstLoadRef.current) {
      firstLoadRef.current = false
    } else if (count > prevUnreadRef.current) {
      const delta = count - prevUnreadRef.current
      toast?.showToast?.(`${delta} new message${delta === 1 ? '' : 's'} from the organizers`, 'info')
    }
    prevUnreadRef.current = count
  }, [messages, seenIds, dismissedIds])

  // Close the notifications panel on outside click / Escape.
  useEffect(() => {
    if (!isNotifOpen) return
    const onPointer = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setIsNotifOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setIsNotifOpen(false) }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onPointer); document.removeEventListener('keydown', onKey) }
  }, [isNotifOpen])

  const handleNavClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < DESKTOP_BREAKPOINT) {
      setIsSidebarOpen(false)
    }
  }

  const handleLogout = () => {
    setIsMenuOpen(false)
    setShowLogoutConfirm(true)
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
        <div className="flex items-center gap-1">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={toggleNotifications}
              aria-label="Notifications"
              title="Notifications"
              aria-haspopup="menu"
              aria-expanded={isNotifOpen}
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <BellIcon className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] animate-pulse items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            <div
              role="menu"
              aria-hidden={!isNotifOpen}
              className={`absolute right-0 top-[calc(100%+0.5rem)] z-50 w-80 origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl transition-all duration-150 ${
                isNotifOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
              }`}
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Notifications</p>
                  <p className="text-xs text-slate-500">Messages from the organizers</p>
                </div>
                {displayed.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {displayed.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-slate-400">No messages yet.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {displayed.map((m) => (
                      <li key={m.id} className="px-4 py-3">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            m.messageType === 'ANNOUNCEMENT' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {m.messageType === 'ANNOUNCEMENT' ? 'Announcement' : 'Message'}
                          </span>
                          <span className="text-[11px] text-slate-400">{timeAgo(m.createdAt)}</span>
                        </div>
                        <p className="whitespace-pre-wrap break-words text-sm text-slate-700">{m.content}</p>
                        <p className="mt-1 text-[11px] text-slate-400">from {m.senderEmail || 'organizer'}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/portal/help')}
            aria-label="Help"
            title="Help"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <HelpIcon className="h-5 w-5" />
          </button>
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
              <button role="menuitem" onClick={handleLogout}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700">
                <LogoutIcon className="h-4 w-4 text-slate-400" /> Sign out
              </button>
            </div>
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

      {showLogoutConfirm && (
        <LogoutConfirmModal
          onConfirm={logoutToLogin}
          onClose={() => setShowLogoutConfirm(false)}
        />
      )}
    </div>
  )
}

export default ParticipantLayout
