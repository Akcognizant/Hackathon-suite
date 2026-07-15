// Client-side pagination helper. Slices `items` into pages of `pageSize` and
// keeps the current page in range as the underlying list changes (e.g. filtering).

import { useMemo, useState } from 'react'

export function usePagination(items, pageSize = 6) {
  const [page, setPage] = useState(1)
  const list = items || []
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize))
  const current = Math.min(page, totalPages)

  const pageItems = useMemo(
    () => list.slice((current - 1) * pageSize, current * pageSize),
    [list, current, pageSize],
  )

  return {
    page: current,
    totalPages,
    pageItems,
    next: () => setPage((p) => Math.min(p + 1, totalPages)),
    prev: () => setPage((p) => Math.max(p - 1, 1)),
    setPage,
  }
}
