import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    LineChart, Line, CartesianGrid,
} from 'recharts'
import Navbar from '../components/Navbar'
import { fetchAnalytics } from '../api'

// ─────────────────────────────────────────────
// Data layer — fetches analytics for a session from the backend.
// GET /api/sessions/{sessionId}/analytics → AnalyticsResponse
// ─────────────────────────────────────────────
function useAnalyticsData(sessionId) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        fetchAnalytics(sessionId)
            .then(res => {
                if (cancelled) return
                const d = res.data
                const perQuestion = d.perQuestion || []
                const timed = perQuestion.filter(q => q.timeTaken > 0)
                setData({
                    ...d,
                    avgTime: d.avgTimePerQuestion,           // backend field → UI field
                    perQuestion,
                    sectionBreakdown: d.sectionBreakdown || [],
                    slowest: perQuestion.length
                        ? [...perQuestion].sort((a, b) => b.timeTaken - a.timeTaken)[0]
                        : null,
                    fastest: timed.length
                        ? [...timed].sort((a, b) => a.timeTaken - b.timeTaken)[0]
                        : null,
                })
            })
            .catch(err => {
                if (!cancelled) setError(err.response?.data?.message || 'Analytics not found.')
            })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [sessionId])

    return { data, loading, error }
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function formatTime(s) {
    if (s < 60) return `${s}s`
    return `${Math.floor(s / 60)}m ${s % 60}s`
}

const STATUS_COLOR = {
    correct: { text: '#0F6E56', bg: '#E1F5EE' },
    partial: { text: '#7A4F00', bg: '#FFF7E0' },
    incorrect: { text: '#A32D2D', bg: '#FFF0F0' },
    skipped: { text: '#6b7280', bg: '#f3f4f6' },
}

const SECTION_META = {
    pattern: { label: 'Pattern', color: '#534AB7' },
    drag: { label: 'Interactive', color: '#1D9E75' },
}

// ─────────────────────────────────────────────
// Custom tooltip for charts
// ─────────────────────────────────────────────
function TimeTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm text-xs">
            <p className="font-medium text-gray-700 mb-1">{label}</p>
            <p style={{ color: '#534AB7' }}>Time: <span className="font-mono">{formatTime(payload[0]?.value || 0)}</span></p>
            {payload[1] && <p style={{ color: '#1D9E75' }}>Attempts: <span className="font-mono">{payload[1]?.value}</span></p>}
        </div>
    )
}


// ─────────────────────────────────────────────
// Stat card
// ─────────────────────────────────────────────
function StatCard({ label, value, sub, color }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex flex-col gap-1">
            <span className="text-2xl font-medium font-mono" style={{ color: color || '#26215C' }}>{value}</span>
            <span className="text-xs font-medium text-gray-700">{label}</span>
            {sub && <span className="text-xs text-gray-400">{sub}</span>}
        </div>
    )
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
export default function AnalyticsPage() {
    const { sessionId } = useParams()
    const navigate = useNavigate()
    const { data, loading, error } = useAnalyticsData(sessionId)

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f7f7f8' }}>
            <div className="flex flex-col items-center gap-3">
                <span className="w-8 h-8 rounded-full border-2 border-purple-200 border-t-purple-600 animate-spin"
                    style={{ borderTopColor: '#534AB7' }} />
                <p className="text-sm text-gray-400">Building your analytics…</p>
            </div>
        </div>
    )

    if (error || !data) return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f7f7f8' }}>
            <div className="text-center flex flex-col gap-3">
                <p className="text-sm text-gray-500">{error || 'Analytics not found.'}</p>
                <button onClick={() => navigate(-1)} className="text-sm font-medium" style={{ color: '#534AB7' }}>
                    Go back
                </button>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f7f7f8' }}>
            <Navbar />

            <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 flex flex-col gap-8">

                {/* Header */}
                <div className="flex flex-col gap-1">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 text-xs w-fit mb-1 transition-colors"
                        style={{ color: '#534AB7' }}
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        Back to results
                    </button>
                    <p className="text-xs font-medium tracking-widest uppercase" style={{ color: '#1D9E75' }}>
                        Performance analytics
                    </p>
                    <h1 className="text-2xl font-medium text-gray-900">Detailed breakdown</h1>
                    <p className="text-sm text-gray-500">A deeper look at your time, accuracy, and effort per question.</p>
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard label="Accuracy" value={`${data.accuracy}%`} color="#534AB7" />
                    <StatCard label="Avg time/question" value={formatTime(data.avgTime)} color="#26215C" />
                    <StatCard label="Total attempts" value={data.totalAttempts} color="#1D9E75" />
                    <StatCard label="Total time" value={formatTime(data.totalTimeSeconds)} color="#26215C" />
                </div>

                {/* Charts row */}
                <div className="grid md:grid-cols-2 gap-6">

                    {/* Time per question bar chart */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                                stroke="#534AB7" strokeWidth="1.8" strokeLinecap="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <h2 className="text-sm font-medium text-gray-700">Time per question</h2>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={data.perQuestion} barSize={20}>
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                                    tickFormatter={v => `${v}s`} />
                                <Tooltip content={<TimeTooltip />} cursor={{ fill: '#f7f7f8' }} />
                                <Bar dataKey="timeTaken" fill="#534AB7" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Attempts per question */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                                stroke="#1D9E75" strokeWidth="1.8" strokeLinecap="round">
                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                                <polyline points="17 6 23 6 23 12" />
                            </svg>
                            <h2 className="text-sm font-medium text-gray-700">Attempts per question</h2>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={data.perQuestion}>
                                <CartesianGrid stroke="#f3f4f6" strokeDasharray="4 4" vertical={false} />
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                                    allowDecimals={false} />
                                <Tooltip content={<TimeTooltip />} cursor={{ stroke: '#e5e7eb' }} />
                                <Line type="monotone" dataKey="attempts" stroke="#1D9E75" strokeWidth={2}
                                    dot={{ fill: '#1D9E75', r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Accuracy by section */}
                {data.sectionBreakdown.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-5">
                        <div className="flex items-center gap-2">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                                stroke="#534AB7" strokeWidth="1.8" strokeLinecap="round">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                            </svg>
                            <h2 className="text-sm font-medium text-gray-700">Accuracy by section</h2>
                        </div>
                        <div className="flex flex-col gap-3">
                            {data.sectionBreakdown.map(({ section, total, correct, accuracy }) => {
                                const meta = SECTION_META[section] || { label: section, color: '#534AB7' }
                                return (
                                    <div key={section} className="flex items-center gap-4">
                                        <span className="text-xs font-medium w-20" style={{ color: meta.color }}>
                                            {meta.label}
                                        </span>
                                        <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${accuracy}%`, backgroundColor: meta.color }} />
                                        </div>
                                        <span className="text-xs font-mono text-gray-500 w-20 text-right">
                                            {correct}/{total} · {accuracy}%
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Fastest / slowest callouts */}
                <div className="grid md:grid-cols-2 gap-4">
                    {data.fastest && (
                        <div className="rounded-2xl p-5 flex flex-col gap-1.5" style={{ backgroundColor: '#E1F5EE' }}>
                            <p className="text-xs font-medium" style={{ color: '#0F6E56' }}>⚡ Fastest question</p>
                            <p className="text-sm font-medium text-gray-800">{data.fastest.questionText}</p>
                            <p className="text-xs font-mono" style={{ color: '#1D9E75' }}>{formatTime(data.fastest.timeTaken)}</p>
                        </div>
                    )}
                    {data.slowest && (
                        <div className="rounded-2xl p-5 flex flex-col gap-1.5" style={{ backgroundColor: '#EEEDFE' }}>
                            <p className="text-xs font-medium" style={{ color: '#3C3489' }}>🐢 Slowest question</p>
                            <p className="text-sm font-medium text-gray-800">{data.slowest.questionText}</p>
                            <p className="text-xs font-mono" style={{ color: '#534AB7' }}>{formatTime(data.slowest.timeTaken)}</p>
                        </div>
                    )}
                </div>

                {/* Per-question detail table */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50">
                        <h2 className="text-sm font-medium text-gray-700">Question-by-question metrics</h2>
                    </div>

                    {/* Table header */}
                    <div className="grid px-6 py-2 border-b border-gray-50"
                        style={{ gridTemplateColumns: '2.5rem 1fr 6rem 5rem 5rem 5rem' }}>
                        {['#', 'Question', 'Section', 'Time', 'Attempts', 'Result'].map(h => (
                            <span key={h} className="text-xs font-medium text-gray-400">{h}</span>
                        ))}
                    </div>

                    <div className="divide-y divide-gray-50">
                        {data.perQuestion.map((q) => {
                            const sc = STATUS_COLOR[q.status]
                            return (
                                <div key={q.label}
                                    className="grid px-6 py-3 items-center hover:bg-gray-50 transition-colors"
                                    style={{ gridTemplateColumns: '2.5rem 1fr 6rem 5rem 5rem 5rem' }}>
                                    <span className="text-xs font-mono text-gray-400">{q.label}</span>
                                    <span className="text-sm text-gray-700 pr-4 truncate">{q.questionText}</span>
                                    <span className="text-xs font-medium"
                                        style={{ color: (SECTION_META[q.section] || {}).color || '#6b7280' }}>
                                        {(SECTION_META[q.section] || {}).label || q.section}
                                    </span>
                                    <span className="text-xs font-mono text-gray-500">{formatTime(q.timeTaken)}</span>
                                    <span className="text-xs font-mono text-gray-500">{q.attempts}</span>
                                    <span className="text-xs font-medium px-2 py-0.5 rounded-md w-fit capitalize"
                                        style={{ color: sc.text, backgroundColor: sc.bg }}>
                                        {q.status}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>

            </main>
        </div>
    )
}