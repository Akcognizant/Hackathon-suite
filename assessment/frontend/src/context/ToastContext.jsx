import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastContext = createContext(null)

const TOAST_STYLE = {
    success: { bar: '#1D9E75' },
    error: { bar: '#EF4444' },
    info: { bar: '#534AB7' },
}

// Lightweight, dependency-free toast system.
// Usage: const toast = useToast(); toast.success('Saved'); toast.error('Oops')
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])
    const idRef = useRef(0)

    const remove = useCallback((id) => {
        setToasts((list) => list.filter((t) => t.id !== id))
    }, [])

    const push = useCallback((type, message) => {
        if (!message) return
        const id = ++idRef.current
        setToasts((list) => [...list, { id, type, message }])
        setTimeout(() => remove(id), 3800)
    }, [remove])

    // Stable identity so consumers can safely use it in effect deps.
    const toast = useRef({
        success: (m) => push('success', m),
        error: (m) => push('error', m),
        info: (m) => push('info', m),
    }).current

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
                {toasts.map((t) => {
                    const s = TOAST_STYLE[t.type] || TOAST_STYLE.info
                    return (
                        <div
                            key={t.id}
                            role="status"
                            onClick={() => remove(t.id)}
                            className="flex items-start gap-3 pl-3 pr-4 py-3 rounded-xl border border-gray-100
                                       bg-white shadow-lg cursor-pointer"
                            style={{ borderLeft: `3px solid ${s.bar}` }}
                        >
                            <span className="mt-0.5 flex-shrink-0" style={{ color: s.bar }}>
                                {t.type === 'success' ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                ) : t.type === 'error' ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="16" x2="12" y2="12" />
                                        <line x1="12" y1="8" x2="12.01" y2="8" />
                                    </svg>
                                )}
                            </span>
                            <p className="text-sm text-gray-700 leading-snug flex-1">{t.message}</p>
                        </div>
                    )
                })}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error('useToast must be used inside ToastProvider')
    return ctx
}
