import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { fetchHistory } from '../api'

function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', {
        day: 'numeric', month: 'short', year: 'numeric',
    })
}

function formatTime(s) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}m ${sec}s`
}

function performanceLabel(accuracy) {
    if (accuracy >= 90) return { label: 'Exceptional', color: '#0F6E56', bg: '#E1F5EE' }
    if (accuracy >= 70) return { label: 'Proficient', color: '#534AB7', bg: '#EEEDFE' }
    if (accuracy >= 50) return { label: 'Developing', color: '#7A4F00', bg: '#FFF7E0' }
    return { label: 'Needs practice', color: '#A32D2D', bg: '#FFF0F0' }
}

export default function HistoryPage() {
    const navigate = useNavigate()

    const candidate = (() => {
        try { return JSON.parse(sessionStorage.getItem('candidate')) } catch { return null }
    })()

    const [history, setHistory] = useState([])

    useEffect(() => {
        if (!candidate?.id) return
        fetchHistory(candidate.id)
            .then(res => setHistory(Array.isArray(res.data) ? res.data : []))
            .catch(() => setHistory([]))
    }, [candidate?.id])

    const bestScore = history.length ? Math.max(...history.map(h => h.score)) : null
    const avgAccuracy = history.length
        ? Math.round(history.reduce((s, h) => s + h.accuracy, 0) / history.length)
        : null

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f7f7f8' }}>
            <Navbar />

            <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 flex flex-col gap-8">

                {/* Header */}
                <div className="flex flex-col gap-1">
                    <p className="text-xs font-medium tracking-widest uppercase"
                        style={{ color: '#1D9E75' }}>
                        Your progress
                    </p>
                    <h1 className="text-2xl font-medium text-gray-900">
                        Assessment history
                    </h1>
                    <p className="text-sm text-gray-500">
                        Review every attempt, revisit results, and dig into the analytics.
                    </p>
                </div>

                {/* Summary stats — only show if history exists */}
                {history.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: 'Attempts', value: history.length, color: '#26215C' },
                            { label: 'Best score', value: `${bestScore}/100`, color: '#534AB7' },
                            { label: 'Avg accuracy', value: `${avgAccuracy}%`, color: '#1D9E75' },
                            { label: 'Last attempt', value: formatDate(history[0].date), color: '#26215C' },
                        ].map(({ label, value, color }) => (
                            <div key={label}
                                className="flex flex-col gap-1 px-5 py-4 rounded-2xl border border-gray-100 bg-white">
                                <span className="text-xl font-medium font-mono" style={{ color }}>{value}</span>
                                <span className="text-xs text-gray-400">{label}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Attempt history */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                                stroke="#534AB7" strokeWidth="1.8" strokeLinecap="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <h2 className="text-sm font-medium text-gray-700">Attempt history</h2>
                        </div>
                        <span className="text-xs text-gray-400">
                            {history.length} attempt{history.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-4">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                                style={{ backgroundColor: '#EEEDFE' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                                    stroke="#534AB7" strokeWidth="1.8" strokeLinecap="round">
                                    <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            </div>
                            <div className="flex flex-col items-center gap-1 text-center">
                                <p className="text-sm font-medium text-gray-700">No attempts yet</p>
                                <p className="text-xs text-gray-400 max-w-xs">
                                    Your assessment history will appear here after you complete your first attempt.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/instructions')}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                           text-white transition-all active:scale-[0.98]"
                                style={{ backgroundColor: '#534AB7' }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#3C3489'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#534AB7'}
                            >
                                Take your first assessment
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-x-6 px-6 py-3 border-b border-gray-50"
                                style={{ gridTemplateColumns: 'minmax(9rem,1fr) 5rem 5rem 5rem 8rem 10rem' }}>
                                {['Date', 'Score', 'Accuracy', 'Time', 'Result', 'Actions'].map((h, i) => (
                                    <span key={h}
                                        className={`text-xs font-medium text-gray-400 ${i === 5 ? 'text-right' : ''}`}>
                                        {h}
                                    </span>
                                ))}
                            </div>
                            <div className="divide-y divide-gray-50">
                                {history.map((attempt) => {
                                    const perf = performanceLabel(attempt.accuracy)
                                    return (
                                        <div key={attempt.sessionId}
                                            className="grid gap-x-6 px-6 py-5 items-center hover:bg-gray-50 transition-colors"
                                            style={{ gridTemplateColumns: 'minmax(9rem,1fr) 5rem 5rem 5rem 8rem 10rem' }}>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm text-gray-700">{formatDate(attempt.date)}</span>
                                                <span className="text-xs text-gray-400">
                                                    Attempt {attempt.attemptNumber}
                                                </span>
                                            </div>
                                            <span className="text-sm font-medium font-mono" style={{ color: '#26215C' }}>
                                                {attempt.score}/{attempt.maxScore}
                                            </span>
                                            <span className="text-sm font-mono" style={{ color: '#534AB7' }}>
                                                {attempt.accuracy}%
                                            </span>
                                            <span className="text-sm font-mono text-gray-500">
                                                {formatTime(attempt.totalTimeSeconds)}
                                            </span>
                                            <span className="text-xs font-medium px-2.5 py-1 rounded-md w-fit whitespace-nowrap"
                                                style={{ color: perf.color, backgroundColor: perf.bg }}>
                                                {perf.label}
                                            </span>
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => navigate(`/results/${attempt.sessionId}`)}
                                                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200
                                     text-gray-600 hover:border-gray-300 transition-colors">
                                                    Results
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/analytics/${attempt.sessionId}`)}
                                                    className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                                                    style={{ backgroundColor: '#EEEDFE', color: '#534AB7' }}>
                                                    Analytics
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </div>

            </main>
        </div>
    )
}
