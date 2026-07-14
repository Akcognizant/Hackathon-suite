import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import HackathonGate from '../components/HackathonGate'
import { fetchHistory, fetchGateStatus } from '../api'

// Maximum number of assessment attempts allowed per candidate.
const ATTEMPT_LIMIT = 3

// Platform-level metrics — company/landing figures, not tied to a single attempt.
const PLATFORM_STATS = [
    { label: 'Candidates assessed', value: '48,200+', color: '#534AB7' },
    { label: 'Assessments completed', value: '126K', color: '#1D9E75' },
    { label: 'Hiring teams', value: '340', color: '#0f172a' },
    { label: 'Avg. completion rate', value: '94%', color: '#534AB7' },
]

const CAPABILITIES = [
    {
        title: 'Adaptive pattern engine',
        body: 'Questions calibrate to each candidate in real time, keeping every attempt fair and fatigue-free.',
        icon: (
            <>
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
            </>
        ),
    },
    {
        title: 'Multi-format activities',
        body: 'Sequencing, categorising, matching and drag-and-drop tasks measure reasoning from every angle.',
        icon: (
            <>
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
            </>
        ),
    },
    {
        title: 'Deep analytics',
        body: 'Per-question timing, accuracy trends and cognitive breakdowns turn raw answers into insight.',
        icon: (
            <>
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
            </>
        ),
    },
    {
        title: 'Enterprise-ready security',
        body: 'Token-based access, autosave and tamper-resistant sessions protect the integrity of every result.',
        icon: (
            <>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </>
        ),
    },
]

const STEPS = [
    { n: '01', title: 'Start an assessment', body: 'Launch a timed session in a single click — no setup required.' },
    { n: '02', title: 'Solve the activities', body: 'Work through adaptive pattern tasks with progress saved as you go.' },
    { n: '03', title: 'Review your analytics', body: 'Get an instant breakdown of accuracy, speed and reasoning strengths.' },
]

// "Start new assessment" button that disables itself and shows a tooltip
// once the attempt limit has been reached.
function StartButton({ disabled, tooltip, onClick, className, style, hoverBg, baseBg, children }) {
    return (
        <div className="relative group inline-flex">
            <button
                onClick={disabled ? undefined : onClick}
                disabled={disabled}
                aria-disabled={disabled}
                className={`${className} ${disabled ? 'cursor-not-allowed opacity-60' : 'active:scale-[0.98]'}`}
                style={style}
                onMouseEnter={e => { if (!disabled && hoverBg) e.currentTarget.style.backgroundColor = hoverBg }}
                onMouseLeave={e => { if (!disabled && baseBg) e.currentTarget.style.backgroundColor = baseBg }}
            >
                {children}
            </button>
            {disabled && (
                <span
                    className="absolute left-1/2 -translate-x-1/2 top-full mt-2 whitespace-nowrap
                               rounded-lg px-3 py-1.5 text-xs opacity-0 group-hover:opacity-100
                               transition-opacity pointer-events-none z-10 shadow-lg"
                    style={{ backgroundColor: '#0F0D2E', color: '#EEEDFE' }}
                    role="tooltip"
                >
                    {tooltip}
                </span>
            )}
        </div>
    )
}

export default function Dashboard() {
    const navigate = useNavigate()

    const candidate = (() => {
        try { return JSON.parse(sessionStorage.getItem('candidate')) } catch { return null }
    })()
    const firstName = candidate?.name?.split(' ')[0] || 'Candidate'

    const [attempts, setAttempts] = useState(0)
    const [gate, setGate] = useState(null)

    useEffect(() => {
        if (!candidate?.id) return
        fetchHistory(candidate.id)
            .then(res => setAttempts(Array.isArray(res.data) ? res.data.length : 0))
            .catch(() => setAttempts(0))
        fetchGateStatus()
            .then(res => setGate(res.data))
            .catch(() => setGate(null))
    }, [candidate?.id])

    // Start is locked once attempts run out, once the candidate has passed, or once blocked.
    const startLocked = attempts >= ATTEMPT_LIMIT || gate?.passed || gate?.blocked
    const limitTooltip = gate?.passed
        ? 'You already passed — proceed to the hackathon'
        : `Attempt limit reached (${ATTEMPT_LIMIT}/${ATTEMPT_LIMIT})`

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f8fafc' }}>
            <Navbar />

            {/* Hero */}
            <section className="w-full" style={{ backgroundColor: '#0f172a' }}>
                <div className="max-w-5xl mx-auto w-full px-6 py-16 flex flex-col gap-6">
                    <p className="text-xs font-medium tracking-widest uppercase" style={{ color: '#1D9E75' }}>
                        Welcome back, {firstName}
                    </p>
                    <h1 className="text-3xl md:text-4xl font-semibold leading-tight max-w-2xl"
                        style={{ color: '#EEEDFE' }}>
                        Measure how people think — not just what they know.
                    </h1>
                    <p className="text-sm md:text-base max-w-xl" style={{ color: '#AFA9EC' }}>
                        PatternIQ is a cognitive assessment platform that turns pattern-recognition
                        tasks into clear, actionable signals about reasoning ability.
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                        <StartButton
                            disabled={startLocked}
                            tooltip={limitTooltip}
                            onClick={() => navigate('/instructions')}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white transition-all"
                            style={{ backgroundColor: '#534AB7' }}
                            hoverBg="#3C3489"
                            baseBg="#534AB7"
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                            Start new assessment
                        </StartButton>
                        <button
                            onClick={() => navigate('/history')}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium
                                       transition-all active:scale-[0.98] border"
                            style={{ color: '#EEEDFE', borderColor: 'rgba(207,203,246,0.3)' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(83,74,183,0.25)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            View my history
                        </button>
                    </div>
                    {attempts >= ATTEMPT_LIMIT && !gate?.passed && (
                        <p className="text-xs" style={{ color: '#AFA9EC' }}>
                            You've used all {ATTEMPT_LIMIT} attempts. Review your results from the history page.
                        </p>
                    )}
                </div>
            </section>

            <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 flex flex-col gap-14">

                {/* Hackathon eligibility — overlaps the hero as the lead card */}
                <div className="-mt-20 relative z-10">
                    <HackathonGate />
                </div>

                {/* Platform analytics band */}
                <section className="flex flex-col gap-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {PLATFORM_STATS.map(({ label, value, color }) => (
                            <div key={label}
                                className="flex flex-col gap-1 px-5 py-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <span className="text-2xl font-medium font-mono" style={{ color }}>{value}</span>
                                <span className="text-xs text-slate-400">{label}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-slate-400 px-1">
                        Platform metrics across all PatternIQ workspaces, updated daily.
                    </p>
                </section>

                {/* Capabilities */}
                <section className="flex flex-col gap-6">
                    <div className="flex flex-col gap-1">
                        <p className="text-xs font-medium tracking-widest uppercase" style={{ color: '#1D9E75' }}>
                            Why PatternIQ
                        </p>
                        <h2 className="text-xl font-semibold text-slate-900">
                            Built for accurate, insightful assessment
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {CAPABILITIES.map(({ title, body, icon }) => (
                            <div key={title}
                                className="flex items-start gap-4 px-5 py-5 rounded-2xl border border-slate-200 bg-white">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: '#EEEDFE' }}>
                                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
                                        stroke="#534AB7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        {icon}
                                    </svg>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">{body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* How it works */}
                <section className="flex flex-col gap-6">
                    <div className="flex flex-col gap-1">
                        <p className="text-xs font-medium tracking-widest uppercase" style={{ color: '#1D9E75' }}>
                            How it works
                        </p>
                        <h2 className="text-xl font-semibold text-slate-900">
                            From click to insight in three steps
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {STEPS.map(({ n, title, body }) => (
                            <div key={n}
                                className="flex flex-col gap-2 px-5 py-5 rounded-2xl border border-slate-200 bg-white">
                                <span className="text-lg font-semibold font-mono" style={{ color: '#7F77DD' }}>{n}</span>
                                <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">{body}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Closing CTA */}
                <section
                    className="rounded-2xl px-8 py-10 flex flex-col md:flex-row md:items-center justify-between gap-6"
                    style={{ backgroundColor: '#EEEDFE' }}>
                    <div className="flex flex-col gap-1">
                        <h2 className="text-lg font-semibold" style={{ color: '#0f172a' }}>
                            {gate?.passed
                                ? 'You passed — the hackathon awaits'
                                : startLocked
                                    ? "You've reached the attempt limit"
                                    : 'Ready to test your pattern recognition skills?'}
                        </h2>
                        <p className="text-sm text-slate-500">
                            {gate?.passed
                                ? 'Head to the hackathon portal from the banner above.'
                                : startLocked
                                    ? `All ${ATTEMPT_LIMIT} attempts used — revisit your past attempts anytime.`
                                    : 'Take a fresh assessment or revisit your past attempts anytime.'}
                        </p>
                    </div>
                    <StartButton
                        disabled={startLocked}
                        tooltip={limitTooltip}
                        onClick={() => navigate('/instructions')}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white transition-all flex-shrink-0 w-fit"
                        style={{ backgroundColor: '#534AB7' }}
                        hoverBg="#3C3489"
                        baseBg="#534AB7"
                    >
                        Start new assessment
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                        </svg>
                    </StartButton>
                </section>

            </main>
            <Footer />
        </div>
    )
}
