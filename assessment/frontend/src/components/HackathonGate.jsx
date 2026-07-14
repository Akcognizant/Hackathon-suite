import { useEffect, useState } from 'react'
import { fetchGateStatus, requestHackathonSso } from '../api'

// Shows the candidate's hackathon eligibility based on their assessment results:
//   • passed   → "Proceed to Hackathon" (mints an SSO token and hands off)
//   • blocked  → used all 3 attempts without passing → hackathon disabled
//   • pending  → needs >= threshold to unlock; shows attempts remaining
//
// Renders nothing until the gate status has loaded.
export default function HackathonGate() {
  const [gate, setGate] = useState(null)
  const [redirecting, setRedirecting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchGateStatus()
      .then((res) => { if (!cancelled) setGate(res.data) })
      .catch(() => { if (!cancelled) setGate(null) })
    return () => { cancelled = true }
  }, [])

  const proceed = async () => {
    setError('')
    setRedirecting(true)
    try {
      const { data } = await requestHackathonSso()
      window.location.href = `${data.hackathonUrl}/sso#token=${encodeURIComponent(data.token)}`
    } catch (err) {
      setError(err.response?.data?.message || 'Could not open the hackathon right now.')
      setRedirecting(false)
    }
  }

  if (!gate) return null

  const threshold = gate.passThreshold ?? 75

  if (gate.passed) {
    return (
      <div className="rounded-2xl border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{ backgroundColor: '#E1F5EE', borderColor: '#B7E4D3' }}>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium tracking-widest uppercase" style={{ color: '#0F6E56' }}>
            Assessment cleared
          </p>
          <h3 className="text-lg font-semibold text-slate-900">You’ve unlocked the Hackathon Portal 🎉</h3>
          <p className="text-sm text-slate-600">
            You scored {Math.round(gate.bestAccuracy)}% (≥ {threshold}% required). Head over — no second login needed.
          </p>
          {error && <p className="text-sm font-medium" style={{ color: '#A32D2D' }}>{error}</p>}
        </div>
        <button
          onClick={proceed}
          disabled={redirecting}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white transition-all active:scale-[0.98] flex-shrink-0 w-fit disabled:opacity-60"
          style={{ backgroundColor: '#0F6E56' }}
        >
          {redirecting ? 'Opening hackathon…' : 'Proceed to Hackathon'}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    )
  }

  if (gate.blocked) {
    return (
      <div className="rounded-2xl border p-6 flex flex-col gap-1"
        style={{ backgroundColor: '#FFF0F0', borderColor: '#F3C9C9' }}>
        <p className="text-xs font-medium tracking-widest uppercase" style={{ color: '#A32D2D' }}>
          Hackathon locked
        </p>
        <h3 className="text-lg font-semibold text-slate-900">You can’t attempt the hackathon</h3>
        <p className="text-sm text-slate-600">
          You’ve used all {gate.maxAttempts} attempts without reaching {threshold}%
          (best: {Math.round(gate.bestAccuracy)}%). The hackathon portal is not available.
        </p>
      </div>
    )
  }

  // Pending — attempts remain, not yet passed.
  return (
    <div className="rounded-2xl border p-6 flex flex-col gap-1"
      style={{ backgroundColor: '#FFF7E0', borderColor: '#F0E2B6' }}>
      <p className="text-xs font-medium tracking-widest uppercase" style={{ color: '#7A4F00' }}>
        Hackathon locked
      </p>
      <h3 className="text-lg font-semibold text-slate-900">Score {threshold}% to unlock the hackathon</h3>
      <p className="text-sm text-slate-600">
        {gate.attemptsRemaining} of {gate.maxAttempts} attempt{gate.attemptsRemaining !== 1 ? 's' : ''} remaining.
        {gate.attemptsUsed > 0 && ` Best so far: ${Math.round(gate.bestAccuracy)}%.`}
      </p>
    </div>
  )
}
