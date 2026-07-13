// Reusable admin data table: sortable headers + pagination controls + optional
// expandable rows. Presentational only — the PARENT owns data fetching and the
// page/sort/filter state, and passes results in. This keeps one table pattern
// across every admin module (DRY).
//
// Props:
//   columns   [{ key, header, sortable?, align?, render?(row) }]
//   data      array of row objects
//   rowKey    field name or fn(row) -> unique key (default 'id')
//   loading, error, emptyMessage
//   sort      { field, direction: 'asc' | 'desc' }
//   onSortChange(field)          -> parent toggles/sets sort, refetches
//   page (0-based), totalPages, totalElements, pageSize
//   onPageChange(nextPage)       -> parent refetches
//   renderExpanded?(row)         -> optional expandable detail row

import { Fragment, useState } from 'react'

function SortGlyph({ state }) {
  // state: 'asc' | 'desc' | 'none'
  return (
    <span className="ml-1 inline-flex flex-col leading-none text-[8px]">
      <span className={state === 'asc' ? 'text-blue-600' : 'text-slate-300'}>▲</span>
      <span className={state === 'desc' ? 'text-blue-600' : 'text-slate-300'}>▼</span>
    </span>
  )
}

function DataTable({
  columns,
  data = [],
  rowKey = 'id',
  loading = false,
  error = '',
  emptyMessage = 'No records found.',
  sort,
  onSortChange,
  page = 0,
  totalPages = 0,
  totalElements = 0,
  pageSize = 10,
  onPageChange,
  renderExpanded,
}) {
  const [expandedKey, setExpandedKey] = useState(null)
  const [jumpValue, setJumpValue] = useState('')
  const keyOf = (row) => (typeof rowKey === 'function' ? rowKey(row) : row[rowKey])

  // "Jump to page": clamp the entered 1-based page into [1, totalPages] so the user
  // can never navigate out of range, then convert to the 0-based page the parent owns.
  const goToPage = () => {
    const parsed = parseInt(jumpValue, 10)
    if (Number.isNaN(parsed)) return
    const clamped = Math.min(totalPages, Math.max(1, parsed))
    onPageChange?.(clamped - 1)
    setJumpValue('')
  }
  const totalCols = columns.length + (renderExpanded ? 1 : 0)

  const from = totalElements === 0 ? 0 : page * pageSize + 1
  const to = Math.min(totalElements, page * pageSize + data.length)

  const sortState = (key) =>
    sort?.field === key ? sort.direction : 'none'

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse text-left text-sm">
          <thead className="border-b border-gray-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              {renderExpanded && <th className="w-10 px-4 py-3" aria-label="Expand" />}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-3 ${col.align === 'right' ? 'text-right' : ''}`}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => onSortChange?.(col.key)}
                      className="inline-flex items-center font-semibold uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-800"
                    >
                      {col.header}
                      <SortGlyph state={sortState(col.key)} />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={totalCols} className="px-6 py-12 text-center text-sm text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={totalCols} className="px-6 py-12 text-center text-sm font-medium text-red-600">
                  {error}
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={totalCols} className="px-6 py-12 text-center text-sm text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const key = keyOf(row)
                const isExpanded = expandedKey === key
                return (
                  <Fragment key={key}>
                    <tr
                      className={`transition-colors hover:bg-slate-50 ${
                        isExpanded ? '' : 'border-b border-gray-100'
                      }`}
                    >
                      {renderExpanded && (
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => setExpandedKey(isExpanded ? null : key)}
                            aria-expanded={isExpanded}
                            aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                            className="text-slate-400 transition-colors hover:text-blue-600"
                          >
                            <span className={`inline-block transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                              ▸
                            </span>
                          </button>
                        </td>
                      )}
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={`px-6 py-4 text-slate-600 ${col.align === 'right' ? 'text-right' : ''}`}
                        >
                          {col.render ? col.render(row) : row[col.key]}
                        </td>
                      ))}
                    </tr>
                    {isExpanded && renderExpanded && (
                      <tr className="border-b border-gray-100">
                        <td colSpan={totalCols} className="bg-slate-50/60 px-6 pb-4">
                          {renderExpanded(row)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-6 py-3 text-sm text-slate-500 sm:flex-row">
        <span className="tabular-nums">
          {totalElements === 0 ? 'No results' : `Showing ${from}–${to} of ${totalElements}`}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange?.(page - 1)}
            disabled={page <= 0 || loading}
            className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <span className="tabular-nums text-slate-600">
            Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange?.(page + 1)}
            disabled={page >= totalPages - 1 || loading}
            className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>

          {/* Jump to page */}
          {totalPages > 1 && (
            <span className="ml-1 flex items-center gap-1.5 border-l border-slate-200 pl-3">
              <span className="text-slate-500">Jump to</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpValue}
                onChange={(event) => setJumpValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    goToPage()
                  }
                }}
                disabled={loading}
                aria-label="Jump to page"
                className="h-8 w-14 rounded-lg border border-slate-200 px-2 text-center tabular-nums text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-40"
              />
              <button
                type="button"
                onClick={goToPage}
                disabled={loading || jumpValue.trim() === ''}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Go
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default DataTable
