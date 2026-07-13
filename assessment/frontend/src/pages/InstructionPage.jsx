import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useState, useEffect } from 'react'
import StartAssessmentModal from '../components/StartAssessmentModal'
import { fetchHistory } from '../api'

// Maximum number of assessment attempts allowed per candidate.
const ATTEMPT_LIMIT = 3

const INSTRUCTIONS = [
    {
        step: '01',
        title: 'Two sections, one sitting',
        desc: 'Section 1 has pattern questions (sequences, shapes, matrices). Section 2 has interactive drag-and-drop activities. You move through all 15 items in one attempt.',
    },
    {
        step: '02',
        title: 'Answer pattern questions',
        desc: 'For each pattern, pick the option that completes it. Only one option is correct.',
    },
    {
        step: '03',
        title: 'Complete the drag activities',
        desc: 'Sort items into groups, match pairs, order sequences, and fill in the blanks by dragging. You get credit for every item you place correctly.',
    },
    {
        step: '04',
        title: 'Navigate freely & mark for review',
        desc: 'Jump to any question from the palette and flag ones to revisit. One timer runs across the whole assessment — it keeps ticking even if you leave, and you can resume where you left off.',
    },
    {
        step: '05',
        title: 'Submit to see results',
        desc: 'On submit, your score and per-section analytics are generated. You can review any past attempt from the dashboard.',
    },
]

const SCORING = [
    { label: 'Each correct item', points: '+1 pt', color: '#1D9E75', bg: '#E1F5EE' },
    { label: 'Activities give partial credit', points: 'per item', color: '#534AB7', bg: '#EEEDFE' },
    { label: 'Wrong or unanswered', points: '0 pts', color: '#A32D2D', bg: '#FFF0F0' },
]

const STATS = [
    { value: '2', label: 'Sections' },
    { value: '15', label: 'Questions' },
    { value: '20m', label: 'Duration' },
    { value: '3', label: 'Attempts' },
]

const WARNINGS = [
    'The timer runs across both sections and does not pause',
    'You can close and resume, but the clock keeps running',
    'Ensure a stable internet connection',
    'Find a quiet, distraction-free space',
]

export default function InstructionsPage() {
    const navigate = useNavigate()
    const [showStart, setShowStart] = useState(false)
    const [attempts, setAttempts] = useState(0)

    const candidate = (() => {
        try { return JSON.parse(sessionStorage.getItem('candidate')) } catch { return null }
    })()

    useEffect(() => {
        if (!candidate?.id) return
        fetchHistory(candidate.id)
            .then(res => setAttempts(Array.isArray(res.data) ? res.data.length : 0))
            .catch(() => setAttempts(0))
    }, [candidate?.id])

    const limitReached = attempts >= ATTEMPT_LIMIT

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f7f7f8' }}>
            <Navbar />

            <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10 flex flex-col gap-8">

                {/* Header */}
                <div className="flex flex-col gap-1.5">
                    <p className="text-xs font-medium tracking-widest uppercase"
                        style={{ color: '#1D9E75' }}>
                        Before you begin
                    </p>
                    <h1 className="text-2xl font-medium text-gray-900">Assessment overview</h1>
                    <p className="text-sm text-gray-500">
                        Read through the instructions carefully before starting.
                    </p>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {STATS.map(({ value, label }) => (
                        <div key={label}
                            className="flex flex-col gap-1 px-5 py-4 rounded-2xl border border-gray-100 bg-white">
                            <span className="text-2xl font-medium font-mono" style={{ color: '#26215C' }}>
                                {value}
                            </span>
                            <span className="text-xs text-gray-400">{label}</span>
                        </div>
                    ))}
                </div>

                {/* Two-col: instructions + right column */}
                <div className="grid md:grid-cols-[1fr_300px] gap-6">

                    {/* Instructions */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-6">
                        <div className="flex items-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                stroke="#534AB7" strokeWidth="1.8" strokeLinecap="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <h2 className="text-sm font-medium text-gray-700">How it works</h2>
                        </div>
                        <ol className="flex flex-col gap-5 list-none">
                            {INSTRUCTIONS.map(({ step, title, desc }) => (
                                <li key={step} className="flex gap-4">
                                    <span className="text-xs font-medium font-mono mt-0.5 flex-shrink-0 w-6"
                                        style={{ color: '#AFA9EC' }}>
                                        {step}
                                    </span>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm font-medium text-gray-800">{title}</p>
                                        <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>

                    {/* Right column */}
                    <div className="flex flex-col gap-4">

                        {/* Scoring */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
                            <div className="flex items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    stroke="#534AB7" strokeWidth="1.8" strokeLinecap="round">
                                    <line x1="18" y1="20" x2="18" y2="10" />
                                    <line x1="12" y1="20" x2="12" y2="4" />
                                    <line x1="6" y1="20" x2="6" y2="14" />
                                </svg>
                                <h2 className="text-sm font-medium text-gray-700">Scoring</h2>
                            </div>
                            <div className="flex flex-col gap-2">
                                {SCORING.map(({ label, points, color, bg }) => (
                                    <div key={label} className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500">{label}</span>
                                        <span className="text-xs font-medium font-mono px-2 py-0.5 rounded-md"
                                            style={{ color, backgroundColor: bg }}>
                                            {points}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Begin CTA */}
                <div className="flex items-center justify-between bg-white rounded-2xl
                        border border-gray-100 px-6 py-5">
                    <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-medium text-gray-800">
                            {limitReached
                                ? "You've reached the attempt limit"
                                : 'Ready to test your pattern recognition?'}
                        </p>
                        <p className="text-xs text-gray-400">
                            {limitReached
                                ? `All ${ATTEMPT_LIMIT} attempts have been used.`
                                : 'Your time starts as soon as you click begin.'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                            Go back
                        </button>
                        <div className="relative group inline-flex">
                            <button
                                onClick={() => { if (!limitReached) setShowStart(true) }}
                                disabled={limitReached}
                                aria-disabled={limitReached}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium
                             text-white transition-all ${limitReached ? 'cursor-not-allowed opacity-60' : 'active:scale-[0.98]'}`}
                                style={{ backgroundColor: '#534AB7' }}
                                onMouseEnter={e => { if (!limitReached) e.currentTarget.style.backgroundColor = '#3C3489' }}
                                onMouseLeave={e => { if (!limitReached) e.currentTarget.style.backgroundColor = '#534AB7' }}
                            >
                                Begin assessment
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </button>
                            {limitReached && (
                                <span
                                    className="absolute left-1/2 -translate-x-1/2 top-full mt-2 whitespace-nowrap
                                               rounded-lg px-3 py-1.5 text-xs opacity-0 group-hover:opacity-100
                                               transition-opacity pointer-events-none z-10 shadow-lg"
                                    style={{ backgroundColor: '#0F0D2E', color: '#EEEDFE' }}
                                    role="tooltip"
                                >
                                    Attempt limit reached ({ATTEMPT_LIMIT}/{ATTEMPT_LIMIT})
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                {showStart && <StartAssessmentModal onClose={() => setShowStart(false)} />}
            </main>
        </div>
    )
}