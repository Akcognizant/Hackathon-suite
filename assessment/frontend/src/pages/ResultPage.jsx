import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import HackathonGate from '../components/HackathonGate'
import { fetchResult } from '../api'

// ─────────────────────────────────────────────
// Data layer — fetches the result for a session from the backend.
// GET /api/sessions/{sessionId}/result → ResultResponse
// ─────────────────────────────────────────────
function useResultData(sessionId) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        fetchResult(sessionId)
            .then(res => {
                if (cancelled) return
                const d = res.data
                setData({
                    ...d,
                    // The backend response has no per-row index; add it for display.
                    responses: (d.responses || []).map((r, i) => ({ ...r, questionIndex: i + 1 })),
                })
            })
            .catch(err => {
                if (!cancelled) setError(err.response?.data?.message || 'Result not found.')
            })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [sessionId])

    return { data, loading, error }
}

// ─────────────────────────────────────────────
// Score ring — visual percentage arc
// ─────────────────────────────────────────────
function ScoreRing({ pct, score, max }) {
    const r = 54
    const circ = 2 * Math.PI * r
    const dash = (pct / 100) * circ

    return (
        <div className="relative w-36 h-36 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                <circle cx="64" cy="64" r={r} fill="none" stroke="#f0f0f0" strokeWidth="10" />
                <circle
                    cx="64" cy="64" r={r} fill="none"
                    stroke="#534AB7" strokeWidth="10"
                    strokeDasharray={`${dash} ${circ}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-medium font-mono" style={{ color: '#26215C' }}>{score}</span>
                <span className="text-xs text-gray-400">of {max}</span>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────
// Performance label based on accuracy
// ─────────────────────────────────────────────
function performanceLabel(accuracy) {
    if (accuracy >= 90) return { label: 'Exceptional', color: '#0F6E56', bg: '#E1F5EE' }
    if (accuracy >= 70) return { label: 'Proficient', color: '#534AB7', bg: '#EEEDFE' }
    if (accuracy >= 50) return { label: 'Developing', color: '#7A4F00', bg: '#FFF7E0' }
    return { label: 'Needs practice', color: '#A32D2D', bg: '#FFF0F0' }
}

function formatTime(s) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}m ${sec}s`
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
export default function ResultPage() {
    const { sessionId } = useParams()
    const navigate = useNavigate()
    const { data, loading, error } = useResultData(sessionId)

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f7f7f8' }}>
            <div className="flex flex-col items-center gap-3">
                <span className="w-8 h-8 rounded-full border-2 border-purple-200 border-t-purple-600 animate-spin"
                    style={{ borderTopColor: '#534AB7' }} />
                <p className="text-sm text-gray-400">Loading your results…</p>
            </div>
        </div>
    )

    if (error || !data) return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f7f7f8' }}>
            <div className="text-center flex flex-col gap-3">
                <p className="text-sm text-gray-500">{error || 'Result not found.'}</p>
                <button onClick={() => navigate('/dashboard')}
                    className="text-sm font-medium" style={{ color: '#534AB7' }}>
                    Back to dashboard
                </button>
            </div>
        </div>
    )

    const perf = performanceLabel(data.accuracy)

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f7f7f8' }}>
            <Navbar />

            <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10 flex flex-col gap-6">

                {/* Page header */}
                <div className="flex flex-col gap-1">
                    <p className="text-xs font-medium tracking-widest uppercase" style={{ color: '#1D9E75' }}>
                        Assessment complete
                    </p>
                    <h1 className="text-2xl font-medium text-gray-900">Your results</h1>
                    <p className="text-sm text-gray-500">Here's how you performed across all {data.totalQuestions} items, by section.</p>
                </div>

                {/* Hero result card */}
                <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col md:flex-row items-center gap-8">
                    <ScoreRing pct={data.accuracy} score={data.finalScore} max={data.maxScore} />

                    <div className="flex-1 flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-medium text-gray-900">{data.candidateName}</h2>
                                <span className="text-xs font-medium px-2 py-0.5 rounded-md"
                                    style={{ color: perf.color, backgroundColor: perf.bg }}>
                                    {perf.label}
                                </span>
                            </div>
                            <p className="text-sm text-gray-400">Session · {sessionId}</p>
                        </div>

                        {/* Stat pills */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { label: 'Accuracy', value: `${data.accuracy}%`, color: '#534AB7' },
                                { label: 'Correct', value: data.correct, color: '#1D9E75' },
                                { label: 'Incorrect', value: data.incorrect, color: '#A32D2D' },
                                { label: 'Time', value: formatTime(data.totalTimeSeconds), color: '#26215C' },
                            ].map(({ label, value, color }) => (
                                <div key={label} className="flex flex-col gap-0.5 px-4 py-3 rounded-xl"
                                    style={{ backgroundColor: '#f7f7f8' }}>
                                    <span className="text-lg font-medium font-mono" style={{ color }}>{value}</span>
                                    <span className="text-xs text-gray-400">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Hackathon eligibility (passed / blocked / pending) */}
                <HackathonGate />

                {/* Per-section breakdown */}
                {['pattern', 'drag'].map((sec) => {
                    const rows = data.responses.filter((r) => r.section === sec)
                    if (!rows.length) return null
                    const secCorrect = rows.reduce((s, r) => s + (r.correctCount || 0), 0)
                    const secTotal = rows.reduce((s, r) => s + (r.totalCount || 0), 0)
                    return (
                        <div key={sec} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                                <h2 className="text-sm font-medium text-gray-700">
                                    {sec === 'pattern' ? 'Section 1 · Pattern' : 'Section 2 · Interactive'}
                                </h2>
                                <span className="text-xs text-gray-400">{secCorrect}/{secTotal} correct</span>
                            </div>

                            <div className="divide-y divide-gray-50">
                                {rows.map((r) => {
                                    const status = r.isSkipped ? 'skipped'
                                        : r.correctCount === r.totalCount ? 'correct'
                                            : r.correctCount > 0 ? 'partial' : 'incorrect'
                                    const sc = {
                                        correct: { color: '#1D9E75', bg: '#E1F5EE' },
                                        partial: { color: '#7A4F00', bg: '#FFF7E0' },
                                        incorrect: { color: '#A32D2D', bg: '#FFF0F0' },
                                        skipped: { color: '#9ca3af', bg: '#f3f4f6' },
                                    }[status]
                                    return (
                                        <div key={r.questionId}
                                            className="px-6 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                                            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                                style={{ backgroundColor: sc.bg }}>
                                                {status === 'skipped' ? (
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={sc.color} strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                                ) : status === 'incorrect' ? (
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={sc.color} strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                ) : (
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={sc.color} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-700 truncate">
                                                    <span className="text-gray-400 mr-2 font-mono text-xs">Q{r.questionIndex}</span>
                                                    {r.questionText}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                    {sec === 'pattern' ? (
                                                        r.isSkipped ? (
                                                            <span className="text-xs text-gray-400">Skipped</span>
                                                        ) : (
                                                            <>
                                                                <span className="text-xs" style={{ color: r.isCorrect ? '#1D9E75' : '#A32D2D' }}>
                                                                    Your answer: <span className="font-medium font-mono">{r.selectedOption}</span>
                                                                </span>
                                                                {!r.isCorrect && (
                                                                    <span className="text-xs text-gray-400">
                                                                        Correct: <span className="font-medium font-mono text-gray-600">{r.correctOption}</span>
                                                                    </span>
                                                                )}
                                                            </>
                                                        )
                                                    ) : (
                                                        <>
                                                            <span className="text-xs" style={{ color: sc.color }}>
                                                                {r.correctCount}/{r.totalCount} placed correctly
                                                            </span>
                                                            {r.incorrectPlacements > 0 && (
                                                                <span className="text-xs text-gray-400">{r.incorrectPlacements} misplacement{r.incorrectPlacements !== 1 ? 's' : ''}</span>
                                                            )}
                                                            {r.dragAttempts > 0 && (
                                                                <span className="text-xs text-gray-300">{r.dragAttempts} drag{r.dragAttempts !== 1 ? 's' : ''}</span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                <span className="text-xs font-mono text-gray-400">{formatTime(r.timeTakenSeconds || 0)}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}

                {/* Actions */}
                <div className="flex items-center justify-between">

                    <button
                        onClick={() => navigate(`/analytics/${sessionId}`)}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium
                       text-white transition-all active:scale-[0.98]"
                        style={{ backgroundColor: '#534AB7' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#3C3489'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#534AB7'}
                    >
                        View detailed analytics
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                        </svg>
                    </button>
                </div>

            </main>
        </div>
    )
}