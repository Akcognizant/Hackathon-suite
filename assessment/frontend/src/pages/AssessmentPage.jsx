import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import UnansweredWarningModal from '../components/UnansweredWarningModal'
import ActivityRenderer from '../components/activities/ActivityRenderer'
import { startSession, autosaveResponse, submitSession } from '../api'
import { useToast } from '../context/ToastContext'

// ─────────────────────────────────────────────
// Pattern renderers — one per MCQ question type
// ─────────────────────────────────────────────
function NumberSequence({ data }) {
    return (
        <div className="flex items-center justify-center gap-2 flex-wrap">
            {data.sequence.map((item, i) => {
                const isQuestion = item === '?'
                return (
                    <div key={i} className="flex items-center gap-2">
                        <div
                            className={[
                                'w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-medium font-mono',
                                isQuestion
                                    ? 'border-2 border-dashed text-purple-400'
                                    : 'bg-white border border-gray-100 text-gray-800 shadow-sm',
                            ].join(' ')}
                            style={isQuestion ? { borderColor: '#534AB7', color: '#534AB7', backgroundColor: '#EEEDFE' } : {}}
                        >
                            {item}
                        </div>
                        {i < data.sequence.length - 1 && (
                            <span className="text-gray-300 text-sm">→</span>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

function ShapePattern({ data }) {
    return (
        <div className="flex items-center justify-center gap-3 flex-wrap">
            {data.sequence.map((item, i) => {
                const isQuestion = item.count === 0
                return (
                    <div key={i} className="flex items-center gap-3">
                        <div
                            className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center gap-1"
                            style={
                                isQuestion
                                    ? { border: '2px dashed #534AB7', backgroundColor: '#EEEDFE' }
                                    : { backgroundColor: '#fff', border: '1px solid #f0f0f0' }
                            }
                        >
                            {isQuestion ? (
                                <span className="text-2xl font-medium" style={{ color: '#534AB7' }}>?</span>
                            ) : (
                                <>
                                    <span className="text-base leading-tight" style={{ color: '#26215C' }}>
                                        {Array(item.count).fill(item.shape).join(' ')}
                                    </span>
                                    <span className="text-xs font-mono text-gray-400">×{item.count}</span>
                                </>
                            )}
                        </div>
                        {i < data.sequence.length - 1 && (
                            <span className="text-gray-300 text-sm">→</span>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

function MatrixPattern({ data }) {
    return (
        <div className="flex justify-center">
            <div className="inline-grid gap-2" style={{ gridTemplateColumns: `repeat(${data.grid[0].length}, 1fr)` }}>
                {data.grid.flat().map((cell, i) => {
                    const isQuestion = cell === '?'
                    return (
                        <div
                            key={i}
                            className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-medium font-mono"
                            style={
                                isQuestion
                                    ? { border: '2px dashed #534AB7', backgroundColor: '#EEEDFE', color: '#534AB7' }
                                    : { backgroundColor: '#fff', border: '1px solid #f0f0f0', color: '#1a1a2e' }
                            }
                        >
                            {cell}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function PatternDisplay({ question }) {
    if (question.type === 'number_sequence') return <NumberSequence data={question.pattern_data} />
    if (question.type === 'shape_pattern') return <ShapePattern data={question.pattern_data} />
    if (question.type === 'matrix') return <MatrixPattern data={question.pattern_data} />
    return null
}

// ─────────────────────────────────────────────
// Timer hook (per-question count-up)
// ─────────────────────────────────────────────
function useTimer() {
    const [seconds, setSeconds] = useState(0)
    const intervalRef = useRef(null)

    const start = useCallback(() => {
        setSeconds(0)
        clearInterval(intervalRef.current)
        intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    }, [])

    const stop = useCallback(() => {
        clearInterval(intervalRef.current)
        return seconds
    }, [seconds])

    useEffect(() => () => clearInterval(intervalRef.current), [])

    return { seconds, start, stop }
}

function formatTime(s) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
}

const isMcq = (q) => q?.section === 'pattern'

// Whether an item has a usable answer (for palette status + submit gating).
function hasAnswer(q, answers) {
    const a = answers[q.id]
    if (a == null) return false
    if (isMcq(q)) return typeof a === 'number'
    if (a.kind === 'order') return Array.isArray(a.order) && a.order.length > 0
    return a.placements && Object.keys(a.placements).length > 0
}

// Map a fetched question into the shape ActivityRenderer expects.
const toActivity = (q) => ({
    id: q.id, type: q.type, title: q.question_text,
    prompt: q.prompt, items: q.items, zones: q.zones, suffix: q.suffix,
})

const SECTION_LABEL = { pattern: 'Section 1 · Pattern', drag: 'Section 2 · Interactive' }

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
export default function AssessmentPage() {
    const navigate = useNavigate()
    const toast = useToast()

    const [questions, setQuestions] = useState([])
    const [sessionId, setSessionId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState(null)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [answers, setAnswers] = useState({})           // MCQ: optionIndex; activity: answer object
    const [timePerQuestion, setTimePerQuestion] = useState({})
    const [attemptsPerQuestion, setAttemptsPerQuestion] = useState({})
    const [remaining, setRemaining] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [showUnanswered, setShowUnanswered] = useState(false)
    const [reviewFlags, setReviewFlags] = useState({})

    const questionTimer = useTimer()
    const autoSubmittedRef = useRef(false)
    const submitRef = useRef(() => {})
    const activityRef = useRef(null)         // imperative handle of the mounted activity
    const eventsRef = useRef({})             // { qid: [drag events] }
    const dragCountsRef = useRef({})         // { qid: dragAttempts }

    const candidateId = (() => {
        try { return JSON.parse(sessionStorage.getItem('candidate'))?.id } catch { return null }
    })()

    // ── Start or resume the attempt on mount ──
    useEffect(() => {
        let cancelled = false
        if (!candidateId) { navigate('/login'); return }
        ;(async () => {
            try {
                const { data } = await startSession(candidateId)
                if (cancelled) return
                if (data.expired) { navigate(`/results/${data.sessionId}`); return }

                setSessionId(data.sessionId)
                setQuestions((data.questions || []).map(q => ({
                    id: q.id,
                    section: q.section,
                    type: q.questionType,
                    question_text: q.questionText,
                    prompt: q.prompt,
                    pattern_data: q.patternData,
                    options: q.options,
                    items: q.items,
                    zones: q.zones,
                    suffix: q.suffix,
                })))

                // Restore answers/telemetry saved on a previous visit to this attempt.
                const ans = {}, tpq = {}, apq = {}
                ;(data.savedResponses || []).forEach(s => {
                    if (s.selectedOptionIndex !== null && s.selectedOptionIndex !== undefined) ans[s.questionId] = s.selectedOptionIndex
                    else if (s.answer) ans[s.questionId] = s.answer
                    if (s.dragAttempts) dragCountsRef.current[s.questionId] = s.dragAttempts
                    if (s.timeTakenSeconds) tpq[s.questionId] = s.timeTakenSeconds
                    if (s.attemptCount) apq[s.questionId] = s.attemptCount
                })
                setAnswers(ans); setTimePerQuestion(tpq); setAttemptsPerQuestion(apq)

                try { setReviewFlags(JSON.parse(localStorage.getItem(`review_${data.sessionId}`) || '{}')) } catch { /* ignore */ }

                setRemaining(Math.max(0, Math.floor(data.remainingSeconds)))
                if (data.resumed) {
                    toast.info('Resumed your assessment already in progress — the timer kept running while you were away.')
                }
            } catch (err) {
                if (!cancelled) setLoadError(err.response?.data?.message || 'Could not start the assessment.')
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => { cancelled = true }
    }, [candidateId])

    // ── Countdown (server-authoritative) ──
    useEffect(() => {
        if (!sessionId) return
        const id = setInterval(() => setRemaining(prev => (prev == null ? prev : Math.max(0, prev - 1))), 1000)
        return () => clearInterval(id)
    }, [sessionId])

    // ── Auto-submit at zero ──
    useEffect(() => {
        if (remaining === 0 && sessionId && !autoSubmittedRef.current) {
            autoSubmittedRef.current = true
            submitRef.current()
        }
    }, [remaining, sessionId])

    // ── Warn before closing / refreshing ──
    useEffect(() => {
        const handler = (e) => { e.preventDefault(); e.returnValue = '' }
        window.addEventListener('beforeunload', handler)
        return () => window.removeEventListener('beforeunload', handler)
    }, [])

    // ── Warn on the browser Back button ──
    useEffect(() => {
        window.history.pushState(null, '', window.location.href)
        const onPopState = () => {
            const leave = window.confirm(
                'Leave the assessment? Your answers are saved and you can resume — but the timer keeps running.'
            )
            if (leave) {
                window.removeEventListener('popstate', onPopState)
                navigate('/dashboard')
            } else {
                window.history.pushState(null, '', window.location.href)
            }
        }
        window.addEventListener('popstate', onPopState)
        return () => window.removeEventListener('popstate', onPopState)
    }, [])

    // ── Per-question timer restarts on question change ──
    useEffect(() => { questionTimer.start() }, [currentIndex])

    // ── Guards (after all hooks) ──
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f7f7f8' }}>
            <div className="flex flex-col items-center gap-3">
                <span className="w-8 h-8 rounded-full border-2 border-purple-200 animate-spin" style={{ borderTopColor: '#534AB7' }} />
                <p className="text-sm text-gray-400">Preparing your assessment…</p>
            </div>
        </div>
    )
    if (loadError) return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f7f7f8' }}>
            <div className="text-center flex flex-col gap-3 max-w-sm px-6">
                <p className="text-sm text-gray-600">{loadError}</p>
                <button onClick={() => navigate('/dashboard')} className="text-sm font-medium" style={{ color: '#534AB7' }}>Back to dashboard</button>
            </div>
        </div>
    )
    if (!questions.length) return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f7f7f8' }}>
            <div className="text-center flex flex-col gap-3">
                <p className="text-sm text-gray-600">No questions are available right now.</p>
                <button onClick={() => navigate('/dashboard')} className="text-sm font-medium" style={{ color: '#534AB7' }}>Back to dashboard</button>
            </div>
        </div>
    )

    const current = questions[currentIndex]
    const isLast = currentIndex === questions.length - 1

    const autosave = (questionId, fields) => {
        if (!sessionId) return
        autosaveResponse(sessionId, { questionId, ...fields }).catch(() => { /* non-blocking */ })
    }

    // ── MCQ: select an answer ──
    const handleSelect = (optionIndex) => {
        const newAttempt = (attemptsPerQuestion[current.id] || 0) + 1
        setAnswers(prev => ({ ...prev, [current.id]: optionIndex }))
        setAttemptsPerQuestion(prev => ({ ...prev, [current.id]: newAttempt }))
        autosave(current.id, {
            selectedOptionIndex: optionIndex,
            timeTakenSeconds: timePerQuestion[current.id] || 0,
            attemptCount: newAttempt,
        })
    }

    // ── Activity: telemetry callbacks ──
    const handleActivityEvent = (evt) => {
        const qid = current.id
        eventsRef.current[qid] = [...(eventsRef.current[qid] || []), evt]
    }
    const handleActivityDrag = () => {
        const qid = current.id
        dragCountsRef.current[qid] = (dragCountsRef.current[qid] || 0) + 1
        // Capture the fresh arrangement after the component's state has committed.
        requestAnimationFrame(() => {
            const ans = activityRef.current?.getAnswer?.()
            if (ans) setAnswers(prev => ({ ...prev, [qid]: ans }))
            setAttemptsPerQuestion(prev => ({ ...prev, [qid]: dragCountsRef.current[qid] }))
            autosave(qid, {
                answer: ans,
                events: eventsRef.current[qid] || [],
                dragAttempts: dragCountsRef.current[qid] || 0,
                timeTakenSeconds: timePerQuestion[qid] || 0,
                attemptCount: dragCountsRef.current[qid] || 0,
            })
        })
    }

    // ── Save elapsed time + capture the current item on navigation ──
    const saveCurrentTime = () => {
        const elapsed = questionTimer.stop()
        const newTime = (timePerQuestion[current.id] || 0) + elapsed
        setTimePerQuestion(prev => ({ ...prev, [current.id]: newTime }))
        if (isMcq(current)) {
            autosave(current.id, {
                selectedOptionIndex: answers[current.id] ?? null,
                timeTakenSeconds: newTime,
                attemptCount: attemptsPerQuestion[current.id] || 0,
            })
        } else {
            const ans = activityRef.current?.getAnswer?.() ?? answers[current.id] ?? null
            if (ans) setAnswers(prev => ({ ...prev, [current.id]: ans }))
            autosave(current.id, {
                answer: ans,
                events: eventsRef.current[current.id] || [],
                dragAttempts: dragCountsRef.current[current.id] || 0,
                timeTakenSeconds: newTime,
                attemptCount: attemptsPerQuestion[current.id] || dragCountsRef.current[current.id] || 0,
            })
        }
    }

    const goNext = () => { saveCurrentTime(); setCurrentIndex(i => i + 1) }
    const goPrev = () => { saveCurrentTime(); setCurrentIndex(i => i - 1) }
    const goToQuestion = (index) => {
        if (index === currentIndex) return
        saveCurrentTime()
        setCurrentIndex(index)
    }

    const toggleReview = () => {
        setReviewFlags(prev => {
            const next = { ...prev, [current.id]: !prev[current.id] }
            try { localStorage.setItem(`review_${sessionId}`, JSON.stringify(next)) } catch { /* ignore */ }
            return next
        })
    }

    const handleSubmit = async () => {
        if (submitting) return
        setSubmitting(true)
        saveCurrentTime()

        // Read the current activity fresh (its captured answer in state may lag a tick).
        const curActivityAnswer = (!isMcq(current) && activityRef.current)
            ? activityRef.current.getAnswer() : null

        const payload = {
            candidateId,
            responses: questions.map(q => {
                if (isMcq(q)) {
                    return {
                        questionId: q.id,
                        selectedOptionIndex: answers[q.id] ?? null,
                        timeTakenSeconds: timePerQuestion[q.id] || 0,
                        attemptCount: attemptsPerQuestion[q.id] || 0,
                    }
                }
                const ans = q.id === current.id ? curActivityAnswer : (answers[q.id] ?? null)
                return {
                    questionId: q.id,
                    answer: ans,
                    events: eventsRef.current[q.id] || [],
                    dragAttempts: dragCountsRef.current[q.id] || 0,
                    timeTakenSeconds: timePerQuestion[q.id] || 0,
                    attemptCount: attemptsPerQuestion[q.id] || dragCountsRef.current[q.id] || 0,
                }
            }),
        }

        try {
            await submitSession(sessionId, payload)
            try { localStorage.removeItem(`review_${sessionId}`) } catch { /* ignore */ }
            navigate(`/results/${sessionId}`)
        } catch (err) {
            setSubmitting(false)
            setLoadError(err.response?.data?.message || 'Failed to submit your assessment. Please try again.')
        }
    }
    submitRef.current = handleSubmit

    const answeredCount = questions.filter(q => hasAnswer(q, answers)).length
    const progressPct = (currentIndex / questions.length) * 100
    const lowTime = remaining != null && remaining <= 60

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f7f7f8' }}>

            {/* ── Top bar ──────────────────────────── */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: '#534AB7', color: '#CECBF6' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <circle cx="12" cy="12" r="3" /><line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" />
                                <line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />
                            </svg>
                        </div>
                        <span className="text-xs font-medium text-gray-400">PatternIQ</span>
                    </div>

                    <div className="flex-1 max-w-xs flex flex-col items-center gap-1">
                        <p className="text-xs text-gray-400">
                            Question <span className="font-medium text-gray-700">{currentIndex + 1}</span> of {questions.length}
                            <span className="ml-2 text-gray-300">·</span>
                            <span className="ml-2">{answeredCount} answered</span>
                        </p>
                        <div className="w-full h-1 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progressPct}%`, backgroundColor: '#534AB7' }} />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-mono font-medium text-gray-700">{formatTime(questionTimer.seconds)}</span>
                            <span className="text-[10px] text-gray-400">this question</span>
                        </div>
                        <div className="w-px h-6 bg-gray-100" />
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-mono font-medium" style={{ color: lowTime ? '#A32D2D' : '#534AB7' }}>
                                {remaining != null ? formatTime(remaining) : '--:--'}
                            </span>
                            <span className="text-[10px]" style={{ color: lowTime ? '#A32D2D' : '#9ca3af' }}>remaining</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Body ─────────────────────── */}
            <main className="flex-1 flex flex-col items-center px-4 py-8">
                <div className="w-full max-w-2xl flex flex-col gap-6">

                    {/* Question palette — grouped by section */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between flex-wrap gap-y-2">
                            <span className="text-xs font-medium text-gray-500">Questions</span>
                            <div className="flex items-center gap-3 text-[10px] text-gray-400">
                                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#1D9E75' }} />Answered</span>
                                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#F59E0B' }} />For review</span>
                                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#d1d5db' }} />Unanswered</span>
                            </div>
                        </div>
                        {['pattern', 'drag'].map(sec => (
                            <div key={sec} className="flex flex-col gap-1.5">
                                <span className="text-[10px] font-medium uppercase tracking-widest text-gray-400">{SECTION_LABEL[sec]}</span>
                                <div className="flex flex-wrap gap-2">
                                    {questions.map((q, i) => {
                                        if (q.section !== sec) return null
                                        const answered = hasAnswer(q, answers)
                                        const review = !!reviewFlags[q.id]
                                        const isCurrent = i === currentIndex
                                        const bg = review ? '#F59E0B' : answered ? '#1D9E75' : '#e5e7eb'
                                        const fg = (review || answered) ? '#ffffff' : '#4b5563'
                                        return (
                                            <button key={q.id} onClick={() => goToQuestion(i)} aria-label={`Go to question ${i + 1}`}
                                                className="relative w-9 h-9 rounded-lg text-xs font-semibold font-mono transition-all active:scale-95"
                                                style={{ backgroundColor: bg, color: fg, boxShadow: isCurrent ? '0 0 0 2px #ffffff, 0 0 0 4px #534AB7' : 'none' }}>
                                                {i + 1}
                                                {review && answered && (
                                                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#1D9E75', border: '2px solid #fff' }} />
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Question / activity card */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 flex flex-col gap-6 shadow-sm">
                        <div className="flex flex-col gap-1.5">
                            <p className="text-[10px] font-medium tracking-widest uppercase" style={{ color: '#1D9E75' }}>
                                {SECTION_LABEL[current.section]}
                            </p>
                            <h2 className="text-base font-medium text-gray-800">{current.question_text}</h2>
                            {!isMcq(current) && current.prompt && (
                                <p className="text-sm text-gray-500">{current.prompt}</p>
                            )}
                        </div>

                        {isMcq(current) ? (
                            <>
                                <div className="rounded-xl p-6 flex items-center justify-center min-h-28" style={{ backgroundColor: '#f7f7f8' }}>
                                    <PatternDisplay question={current} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {(current.options || []).map((option, i) => {
                                        const isSelected = answers[current.id] === i
                                        return (
                                            <button key={i} onClick={() => handleSelect(i)}
                                                className="h-14 rounded-xl border text-sm font-medium font-mono transition-all duration-150 active:scale-[0.98]"
                                                style={isSelected
                                                    ? { backgroundColor: '#EEEDFE', borderColor: '#534AB7', color: '#534AB7', borderWidth: '1.5px' }
                                                    : { backgroundColor: '#fff', borderColor: '#e5e7eb', color: '#374151' }}>
                                                <span className="mr-2 text-[10px] font-normal opacity-50">{String.fromCharCode(65 + i)}</span>
                                                {option}
                                            </button>
                                        )
                                    })}
                                </div>
                            </>
                        ) : (
                            <ActivityRenderer
                                key={current.id}
                                ref={activityRef}
                                activity={toActivity(current)}
                                initialAnswer={answers[current.id]}
                                onProgress={() => { }}
                                onDragAttempt={handleActivityDrag}
                                onEvent={handleActivityEvent}
                            />
                        )}
                    </div>

                    {/* Bottom bar */}
                    <div className="flex items-center justify-between">
                        <button onClick={goPrev} disabled={currentIndex === 0}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-500 bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:border-gray-300">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                            </svg>
                            Previous
                        </button>

                        <button onClick={toggleReview}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all active:scale-[0.98]"
                            style={reviewFlags[current.id]
                                ? { backgroundColor: '#FEF3C7', borderColor: '#F59E0B', color: '#92400E' }
                                : { backgroundColor: '#fff', borderColor: '#e5e7eb', color: '#6b7280' }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill={reviewFlags[current.id] ? 'currentColor' : 'none'}
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            </svg>
                            {reviewFlags[current.id] ? 'Marked for review' : 'Mark for review'}
                        </button>

                        {isLast ? (
                            <button onClick={() => setShowUnanswered(true)} disabled={submitting}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all active:scale-[0.98] disabled:opacity-70"
                                style={{ backgroundColor: '#1D9E75' }}
                                onMouseEnter={e => { if (!submitting) e.currentTarget.style.backgroundColor = '#0F6E56' }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#1D9E75' }}>
                                {submitting ? (
                                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                ) : (
                                    <>
                                        Submit assessment
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        ) : (
                            <button onClick={goNext}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all active:scale-[0.98]"
                                style={{ backgroundColor: '#534AB7' }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#3C3489'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#534AB7'}>
                                Next
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </main>

            {showUnanswered && (
                <UnansweredWarningModal
                    unansweredNumbers={questions.map((q, i) => !hasAnswer(q, answers) ? i + 1 : null).filter(Boolean)}
                    reviewNumbers={questions.map((q, i) => reviewFlags[q.id] ? i + 1 : null).filter(Boolean)}
                    onConfirm={() => { setShowUnanswered(false); handleSubmit() }}
                    onClose={() => setShowUnanswered(false)}
                />
            )}
        </div>
    )
}
