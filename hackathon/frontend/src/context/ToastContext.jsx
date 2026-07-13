// Dependency-free global toast system.
//
// Wrap the app in <ToastProvider> and call `showToast(message, type)` from the
// `useToast()` hook anywhere below it. A single floating toast renders bottom-
// right, slides up on mount, and auto-dismisses after 3s.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

const ToastContext = createContext(null)

const TOAST_DURATION_MS = 3000

function CheckCircleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function XCircleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  )
}

// The floating toast. `key={toast.id}` in the provider remounts this on each
// new toast, so the slide-up enter animation replays every time.
function Toast({ message, type }) {
  const [visible, setVisible] = useState(false)
  const isSuccess = type !== 'error'

  useEffect(() => {
    // Defer one frame so the transition runs from the hidden state.
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div
        className={`flex items-center gap-3 rounded-lg border-l-4 bg-white px-4 py-3 shadow-lg ${
          isSuccess ? 'border-green-500' : 'border-red-500'
        }`}
      >
        {isSuccess ? (
          <CheckCircleIcon className="h-5 w-5 shrink-0 text-green-500" />
        ) : (
          <XCircleIcon className="h-5 w-5 shrink-0 text-red-500" />
        )}
        <p className="text-sm font-medium text-slate-800">{message}</p>
      </div>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timerRef = useRef(null)

  const showToast = useCallback((message, type = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToast({ message, type, id: Date.now() })
    timerRef.current = setTimeout(() => setToast(null), TOAST_DURATION_MS)
  }, [])

  // Clean up a pending timer on unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Toast key={toast.id} message={toast.message} type={toast.type} />
      )}
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
