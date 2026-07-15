// Human-friendly date helpers for the participant portal.
//
// Backend dates arrive as ISO day strings ("2026-07-16"). We render them as
// "July 16" (events) or "July 16 – July 17, 2026" (history, with the year).

function parseDay(value) {
  if (!value) return null
  // Append a time so the string is parsed in local time, not UTC (which can
  // shift the calendar day backwards for negative timezones).
  const d = new Date(`${value}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

/** "2026-07-16" -> "July 16" */
export function formatDay(value) {
  const d = parseDay(value)
  return d ? d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : (value || '')
}

/**
 * A start–end range. "July 16 – July 17" by default; pass { withYear: true } to
 * append the year ("July 16 – July 17, 2026") for the history view.
 */
export function formatDateRange(start, end, { withYear = false } = {}) {
  const s = formatDay(start)
  const e = formatDay(end)
  let range = s && e ? `${s} – ${e}` : (s || e || '')
  if (withYear && range) {
    const anchor = parseDay(end) || parseDay(start)
    if (anchor) range += `, ${anchor.getFullYear()}`
  }
  return range
}
