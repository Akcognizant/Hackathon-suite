// Reusable dashboard stat card for the admin design system.
//
// Props:
//   title   the metric label
//   value   the metric value
//   accent  optional Tailwind text-color class for the value (default slate-900)

function StatCard({ title, value, accent = 'text-slate-900' }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className={`mt-2 text-4xl font-bold tabular-nums ${accent}`}>{value}</p>
    </div>
  )
}

export default StatCard
