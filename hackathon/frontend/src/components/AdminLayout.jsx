// Admin module shell — premium enterprise layout:
//   • Light, sticky top navbar (logo, active search, "Ask AI" drawer, actions)
//   • Dark navy sidebar that is an off-canvas drawer on mobile (< lg) and a
//     collapsible w-64 ↔ w-20 icon rail on desktop (>= lg)
//   • Light content area with a corporate footer
//
// Icons are inline SVGs (no extra dependency). Child routes render via <Outlet/>.

import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import axiosClient from '../api/axiosClient'
import { logoutToAdminLogin } from '../api/authService'
import { accessRequestCount } from '../api/accessRequestApi'
import { usePermissions } from '../hooks/usePermissions'
import MessagesInbox from './MessagesInbox'
import LogoutConfirmModal from './LogoutConfirmModal'
import ProfileSettingsModal from './ProfileSettingsModal'

/* ------------------------------ Icons ------------------------------ */

const iconBase = 'h-5 w-5'

const MenuIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

const SearchIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const SparkleIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2l1.9 5.1L19 9l-5.1 1.9L12 16l-1.9-5.1L5 9l5.1-1.9L12 2z" />
  </svg>
)

const BellIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)

const HelpIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

const CloseIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const PaperclipIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
)

const SendIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
)

const DashboardIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
)

const TrophyIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
)

const UsersIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const ParticipantsIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <polyline points="16 11 18 13 22 9" />
  </svg>
)

const SubmissionsIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
)

const BarChartIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
)

const AwardIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="8" r="7" />
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </svg>
)

const LogoutIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

const SettingsIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

const BookIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
)

const CpuIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" />
    <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" />
  </svg>
)

const MailIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 5L2 7" />
  </svg>
)

const ActivityIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
)

const ArrowUpRightIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
)

/* ------------------------------ Nav config ------------------------------ */

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/dashboard', end: true, Icon: DashboardIcon },
  { label: 'Leaderboard', to: '/leaderboard', end: false, Icon: BarChartIcon },
  { label: 'Manage Hackathons', to: '/hackathons', end: false, Icon: TrophyIcon },
  { label: 'Participants', to: '/participants', end: false, Icon: ParticipantsIcon },
  { label: 'Submissions', to: '/submissions', end: false, Icon: SubmissionsIcon },
  { label: 'Score Management', to: '/scores', end: false, Icon: AwardIcon },
  { label: 'Teams', to: '/teams', end: false, Icon: UsersIcon },
]

// Tailwind's `lg` breakpoint (1024px) divides drawer (mobile) from rail (desktop).
const DESKTOP_BREAKPOINT = 1024

// Derive avatar initials from an email: john.doe@… → JD, admin@… → AD.
function getInitials(email) {
  if (!email) return 'AD'
  const local = email.split('@')[0]
  const parts = local.split(/[._-]+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return local.slice(0, 2).toUpperCase()
}

// Starter prompts shown under the assistant's welcome message.
const AI_SUGGESTIONS = [
  'Analyze Star Team Builder metrics',
  'Summarize pending submissions',
  'Export the leaderboard',
]


// Tailwind's preflight strips default markdown styling, so map each element the
// AI Navigator emits (headings, bold, lists, links) to compact chat-friendly styles.
const MARKDOWN_COMPONENTS = {
  h1: ({ children }) => <h2 className="mb-1 mt-3 text-base font-bold text-slate-900">{children}</h2>,
  h2: ({ children }) => <h3 className="mb-1 mt-3 text-sm font-bold text-slate-900">{children}</h3>,
  h3: ({ children }) => <h4 className="mb-1 mt-2 text-sm font-semibold text-slate-800">{children}</h4>,
  p: ({ children }) => <p className="mb-2 text-slate-800">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  code: ({ children }) => (
    <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[12px] text-slate-800">{children}</code>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer" className="font-medium text-blue-600 underline">
      {children}
    </a>
  ),
  hr: () => <hr className="my-3 border-slate-200" />,
}

/* ------------------------------ Layout ------------------------------ */

function AdminLayout() {
  // Open by default on desktop, collapsed/closed on smaller screens.
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= DESKTOP_BREAKPOINT,
  )

  // On mobile, tapping a nav link should dismiss the drawer.
  const handleNavClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < DESKTOP_BREAKPOINT) {
      setIsSidebarOpen(false)
    }
  }

  const navigate = useNavigate()
  const location = useLocation()

  // Role badge is driven by the logged-in user's role (JUDGE vs ADMIN).
  const { isJudge, isAdmin } = usePermissions()
  const roleBadge = isJudge
    ? { label: 'Judge', className: 'bg-emerald-100 text-emerald-800' }
    : { label: 'Admin', className: 'bg-indigo-100 text-indigo-800' }
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const userMenuRef = useRef(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)
  // Single state powering the unified inbox — both the envelope and the bell open it.
  const [isInboxOpen, setIsInboxOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const inboxRef = useRef(null)

  // AI assistant chat state (UI-only demo).
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Hello Admin! I am your Cognizant AI Assistant. I can help you evaluate project submissions, generate real-time leaderboards, or customize your hackathon evaluation criteria. What can I do for you today?',
    },
  ])
  const messageIdRef = useRef(2)
  const [isAiThinking, setIsAiThinking] = useState(false)

  // Read the logged-in email once on mount (set at login).
  const [adminEmail] = useState(
    () =>
      (typeof window !== 'undefined' && localStorage.getItem('adminEmail')) ||
      '',
  )

  const handleLogout = () => {
    setIsUserMenuOpen(false)
    setShowLogoutConfirm(true)
  }

  // Pending access-request count for the nav badge (ADMIN only). Re-read on route
  // changes so approving/rejecting on the requests page updates the badge.
  const [pendingRequests, setPendingRequests] = useState(0)
  useEffect(() => {
    if (!isAdmin) return
    accessRequestCount().then(setPendingRequests).catch(() => {})
  }, [isAdmin, location.pathname])

  // Unread direct-message count for the bell badge. Polled so a message received
  // from another user (e.g. admin → judge) bumps the red count without a refresh.
  const [unreadMessages, setUnreadMessages] = useState(0)
  const refreshUnread = () =>
    axiosClient
      .get('/admin/messages/unread-count')
      .then((res) => setUnreadMessages(res.data?.count ?? 0))
      .catch(() => {})
  useEffect(() => {
    refreshUnread()
    const timer = setInterval(refreshUnread, 20000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // Opening the inbox marks messages read; refresh the count when it closes so the
  // badge clears.
  useEffect(() => {
    if (!isInboxOpen) refreshUnread()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInboxOpen])

  // Admins additionally get the "Access Requests" nav entry (with a pending badge).
  const navItems = isAdmin
    ? [...NAV_ITEMS, { label: 'Access Requests', to: '/access-requests', end: false, Icon: MailIcon, badge: pendingRequests }]
    : NAV_ITEMS

  const handleSendMessage = async () => {
    const text = chatInput.trim()
    if (!text || isAiThinking) return

    // Render the user's message, clear the input.
    setMessages((prev) => [
      ...prev,
      { id: messageIdRef.current++, sender: 'user', text },
    ])
    setChatInput('')
    setIsAiThinking(true)

    // Proxy through the Spring backend (POST /api/ai/query -> Node AI server).
    try {
      const { data } = await axiosClient.post('/api/ai/query', { prompt: text })
      setMessages((prev) => [
        ...prev,
        {
          id: messageIdRef.current++,
          sender: 'ai',
          text: data?.response?.trim() || 'The AI returned an empty response.',
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: messageIdRef.current++,
          sender: 'ai',
          text: 'Sorry — the AI Navigator is unavailable right now. Please try again shortly.',
        },
      ])
    } finally {
      setIsAiThinking(false)
    }
  }

  // Open the AI Navigator with the scoring rubric (triggered from Help center).
  const showScoringRubric = () => {
    setIsHelpOpen(false)
    setMessages((prev) => [
      ...prev,
      {
        id: messageIdRef.current++,
        sender: 'ai',
        text: 'Scoring rubric: each approved submission is graded on Innovation, Technical Complexity, UI/UX, and Business Value (0–25 points each, 100 total). Open Score Management to run an AI-assisted evaluation.',
      },
    ])
    setIsAssistantOpen(true)
  }

  // Close the user menu on outside click or Escape.
  useEffect(() => {
    if (!isUserMenuOpen) return
    function handlePointer(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false)
      }
    }
    function handleKey(event) {
      if (event.key === 'Escape') setIsUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [isUserMenuOpen])

  // Close the AI assistant drawer on Escape.
  useEffect(() => {
    if (!isAssistantOpen) return
    function handleKey(event) {
      if (event.key === 'Escape') setIsAssistantOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isAssistantOpen])

  // Close the unified inbox on outside click or Escape. The ref wraps BOTH the
  // envelope and the bell, so clicking either trigger isn't treated as "outside".
  useEffect(() => {
    if (!isInboxOpen) return
    function handlePointer(event) {
      if (inboxRef.current && !inboxRef.current.contains(event.target)) {
        setIsInboxOpen(false)
      }
    }
    function handleKey(event) {
      if (event.key === 'Escape') setIsInboxOpen(false)
    }
    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [isInboxOpen])

  // Close the help modal on Escape.
  useEffect(() => {
    if (!isHelpOpen) return
    function handleKey(event) {
      if (event.key === 'Escape') setIsHelpOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isHelpOpen])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ---------- Top navbar ---------- */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm sm:px-6">
        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSidebarOpen((open) => !open)}
            aria-label="Toggle sidebar"
            className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <MenuIcon className={iconBase} />
          </button>
          <div className="flex items-center gap-3">
            <span className="flex items-baseline text-xl lowercase tracking-tight text-indigo-950">
              <span className="font-normal">cognizant</span>
              <span className="ml-2 font-bold">hackathon&trade;</span>
            </span>
            <span className={`translate-y-[1px] rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${roleBadge.className}`}>
              {roleBadge.label}
            </span>
          </div>
        </div>

        {/* Center: active global search + Ask AI */}
        <div className="hidden items-center gap-2 md:flex">
          <div className="relative">
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 transition-colors focus-within:bg-slate-200/70">
              <SearchIcon className="h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search hackathons, teams…"
                className="w-56 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            {searchQuery.trim() && (
              <div className="absolute left-0 top-full z-50 mt-2 w-full rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <svg
                    className="h-4 w-4 shrink-0 animate-spin text-blue-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 0 1 8-8V0C5.37 0 0 5.37 0 12h4z"
                    />
                  </svg>
                  <span className="text-sm text-slate-500">
                    Searching global database for{' '}
                    <span className="font-medium text-slate-700">
                      &apos;{searchQuery}&apos;
                    </span>
                    …
                  </span>
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsAssistantOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
          >
            <SparkleIcon className="h-3.5 w-3.5" />
            Ask AI / Navigator
          </button>
        </div>

        {/* Right: messages/notifications (unified), help, avatar */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* The Bell is the single entry point for all messages + notifications. */}
          <div className="relative" ref={inboxRef}>
            <button
              type="button"
              onClick={() => setIsInboxOpen((open) => !open)}
              aria-label={`Messages & notifications (${unreadMessages} unread)`}
              className="relative rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <BellIcon className={iconBase} />
              {unreadMessages > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                  {unreadMessages}
                </span>
              )}
            </button>
            <MessagesInbox open={isInboxOpen} />
          </div>
          <button
            type="button"
            onClick={() => setIsHelpOpen(true)}
            aria-label="Help"
            className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <HelpIcon className={iconBase} />
          </button>
          <div className="relative ml-1" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={isUserMenuOpen}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white transition-shadow hover:ring-2 hover:ring-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              {getInitials(adminEmail)}
            </button>

            <div
              role="menu"
              aria-hidden={!isUserMenuOpen}
              className={`absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 origin-top-right overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] backdrop-blur-xl transition-all duration-200 ease-out ${
                isUserMenuOpen
                  ? 'scale-100 opacity-100'
                  : 'pointer-events-none scale-95 opacity-0'
              }`}
            >
              {/* Profile header */}
              <div className="flex items-center gap-3 rounded-t-2xl border-b border-slate-100 bg-slate-50/50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                  {getInitials(adminEmail)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Administrator
                  </p>
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {adminEmail || 'admin@cognizant.com'}
                  </p>
                </div>
              </div>

              {/* Menu items */}
              <div className="flex flex-col gap-1 p-2">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsUserMenuOpen(false)
                    setIsProfileOpen(true)
                  }}
                  className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  <SettingsIcon className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                  Profile Settings
                </button>

                {/* Divider */}
                <div className="mx-2 my-1 h-px bg-slate-100" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700"
                >
                  <LogoutIcon className="h-4 w-4 text-slate-400 group-hover:text-red-500" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ---------- Mobile overlay backdrop (only < lg, when open) ---------- */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      )}

      {/* ---------- Sidebar ----------
          Mobile (< lg): off-canvas drawer — full w-64, slides in/out via translate.
          Desktop (>= lg): always visible, collapses between w-64 and w-20. */}
      <aside
        className={`fixed bottom-0 left-0 top-16 z-40 flex w-64 flex-col bg-slate-900 transition-all duration-300 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isSidebarOpen ? 'lg:w-64' : 'lg:w-20'}`}
      >
        <nav className="flex flex-1 flex-col gap-1 py-4">
          {navItems.map(({ label, to, end, Icon, badge }) => (
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
              <span className="relative shrink-0">
                <Icon className="h-5 w-5 shrink-0" />
                {badge > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                    {badge}
                  </span>
                )}
              </span>
              {/* Label hides only on the desktop icon-rail (collapsed >= lg). */}
              <span
                className={`whitespace-nowrap ${isSidebarOpen ? '' : 'lg:hidden'}`}
              >
                {label}
              </span>
            </NavLink>
          ))}
        </nav>
        <div
          className={`border-t border-slate-800 p-4 text-xs text-slate-500 ${
            isSidebarOpen ? '' : 'lg:hidden'
          }`}
        >
          Admin Module · v0.1
        </div>
      </aside>

      {/* ---------- Content column ----------
          No left padding on mobile (drawer floats over); on desktop the padding
          tracks the sidebar width. */}
      <div
        className={`flex min-h-screen flex-col pt-16 transition-all duration-300 ${
          isSidebarOpen ? 'lg:pl-64' : 'lg:pl-20'
        }`}
      >
        <main className="flex-1 bg-slate-50 p-8">
          <Outlet />
        </main>

        {/* ---------- Footer ---------- */}
        <footer className="flex flex-col items-center justify-between gap-2 border-t border-gray-200 bg-white px-8 py-4 text-xs text-slate-500 sm:flex-row">
          <span>© 2026 Cognizant, All rights reserved.</span>
          <div className="flex items-center gap-3">
            <a href="#contact" className="transition-colors hover:text-slate-900">
              Contact us
            </a>
            <span className="text-slate-300">|</span>
            <a href="#terms" className="transition-colors hover:text-slate-900">
              Terms
            </a>
            <span className="text-slate-300">|</span>
            <a href="#privacy" className="transition-colors hover:text-slate-900">
              Privacy
            </a>
          </div>
        </footer>
      </div>

      {/* ---------- AI Admin Assistant drawer ---------- */}
      <div
        onClick={() => setIsAssistantOpen(false)}
        aria-hidden={!isAssistantOpen}
        className={`fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          isAssistantOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="AI Admin Assistant"
        className={`fixed inset-y-0 right-0 z-[70] flex w-full max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ${
          isAssistantOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 shadow-sm">
          <div className="flex items-center gap-2">
            <img
              src="/cogniIcon.png"
              alt="Cognizant Logo"
              className="h-6 w-auto object-contain"
            />
            <h3 className="text-base font-bold text-slate-900">
              Cognizant AI Navigator
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsAssistantOpen(false)}
            aria-label="Close assistant"
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto bg-white p-5">
          {messages.map((message, index) => (
            <div key={message.id}>
              {message.sender === 'user' ? (
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl bg-slate-100 px-4 py-3 text-[14px] leading-relaxed text-slate-800">
                    {message.text}
                  </div>
                </div>
              ) : (
                <div className="flex max-w-[92%] items-start gap-3">
                  {/* AI — clean logo on the white bg, no container/background */}
                  <img
                    src="/cogniIcon.png"
                    alt="Cognizant AI"
                    className="mt-0.5 h-6 w-6 shrink-0 object-contain"
                  />
                  <div className="min-w-0 flex-1 text-[14px] leading-relaxed text-slate-800">
                    <ReactMarkdown components={MARKDOWN_COMPONENTS}>
                      {message.text}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Quick suggestion pills under the welcome message */}
              {index === 0 && message.sender === 'ai' && (
                <div className="mt-2 flex flex-row flex-wrap gap-2 pl-9">
                  {AI_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setChatInput(suggestion)}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] text-slate-600 shadow-sm transition-all hover:border-blue-300 hover:bg-slate-50 hover:text-blue-600 cursor-pointer"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* AI typing indicator while awaiting the backend */}
          {isAiThinking && (
            <div className="flex max-w-[92%] items-center gap-3">
              <img
                src="/cogniIcon.png"
                alt="Cognizant AI"
                className="h-6 w-6 shrink-0 object-contain"
              />
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" />
              </span>
            </div>
          )}
        </div>

        <div className="bg-white px-4 pb-5 pt-3">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-3 pr-1.5 shadow-md focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-200">
            <button
              type="button"
              aria-label="Attach file"
              className="shrink-0 text-slate-400 transition-colors hover:text-slate-600"
            >
              <PaperclipIcon className="h-5 w-5" />
            </button>
            <input
              type="text"
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder="Ask Cognizant AI…"
              className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={isAiThinking}
              aria-label="Send message"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <SendIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ---------- Help & resources modal ---------- */}
      {isHelpOpen && (
        <div
          onClick={() => setIsHelpOpen(false)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Help & Resources"
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white/95 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] ring-1 ring-slate-900/5 backdrop-blur-2xl"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsHelpOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <CloseIcon className="h-5 w-5" />
            </button>

            {/* Centered brand header */}
            <div className="flex flex-col items-center justify-center pb-4 pt-8">
              <img
                src="/cogni.png"
                alt="Cognizant"
                className="mb-4 h-auto w-32 object-contain"
              />
              <h2 className="mb-2 text-2xl font-bold text-slate-900">
                Help &amp; Resources
              </h2>
              <p className="mb-8 max-w-sm px-4 text-center text-slate-500">
                Everything you need to run the portal — guides, evaluation
                standards, and support.
              </p>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-2 gap-4 px-6 pb-8">
                {/* Admin Quickstart → docs in a new tab */}
                <button
                  type="button"
                  onClick={() => window.open('/docs', '_blank')}
                  className="group relative flex cursor-pointer flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-blue-300 hover:bg-slate-50 active:scale-[0.98]"
                >
                  <ArrowUpRightIcon className="absolute right-3 top-3 h-4 w-4 text-slate-300 transition-colors group-hover:text-blue-500" />
                  <BookIcon className="mb-1 h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-slate-900">
                    Admin Quickstart
                  </span>
                  <span className="text-sm text-slate-500">
                    Guides to get up and running
                  </span>
                </button>

                {/* Scoring & ML Guidelines → AI Navigator rubric */}
                <button
                  type="button"
                  onClick={showScoringRubric}
                  className="group relative flex cursor-pointer flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-blue-300 hover:bg-slate-50 active:scale-[0.98]"
                >
                  <ArrowUpRightIcon className="absolute right-3 top-3 h-4 w-4 text-slate-300 transition-colors group-hover:text-blue-500" />
                  <CpuIcon className="mb-1 h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-slate-900">
                    Scoring &amp; ML Guidelines
                  </span>
                  <span className="text-sm text-slate-500">
                    How AI-assisted scoring works
                  </span>
                </button>

                {/* System Status → live indicator */}
                <button
                  type="button"
                  className="group relative flex cursor-pointer flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-blue-300 hover:bg-slate-50 active:scale-[0.98]"
                >
                  <ActivityIcon className="mb-1 h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-slate-900">
                    System Status
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-slate-500">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                    </span>
                    All systems operational
                  </span>
                </button>

                {/* Contact Internal IT → mailto */}
                <a
                  href="mailto:support@cognizant.com"
                  className="group relative flex cursor-pointer flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-blue-300 hover:bg-slate-50 active:scale-[0.98]"
                >
                  <ArrowUpRightIcon className="absolute right-3 top-3 h-4 w-4 text-slate-300 transition-colors group-hover:text-blue-500" />
                  <MailIcon className="mb-1 h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-slate-900">
                    Contact Internal IT
                  </span>
                  <span className="text-sm text-slate-500">
                    Report an issue or get support
                  </span>
                </a>
              </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <LogoutConfirmModal
          onConfirm={logoutToAdminLogin}
          onClose={() => setShowLogoutConfirm(false)}
        />
      )}

      <ProfileSettingsModal open={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  )
}

export default AdminLayout
