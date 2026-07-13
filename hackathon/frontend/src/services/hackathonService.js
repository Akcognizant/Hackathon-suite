// Hackathon service — thin wrapper over the live backend API. The axiosClient
// attaches the JWT bearer token and handles 401s globally. Exported signatures
// are unchanged from the previous mock so callers stay the same.
//
// Hackathon shape: { id, title, description, startDate, endDate, status }

import axiosClient from '../api/axiosClient'

/**
 * GET /admin/events -> PageResponse<Hackathon>
 * { content, page, size, totalElements, totalPages, hasNext, hasPrevious }
 * Params: page (0-based), size, sort ('field,dir'), search, status.
 */
export async function getHackathons({
  page = 0,
  size = 10,
  sort = 'startDate,desc',
  search = '',
  status = '',
} = {}) {
  const { data } = await axiosClient.get('/admin/events', {
    params: {
      page,
      size,
      sort,
      search: search || undefined,
      status: status || undefined,
    },
  })
  return data
}

/** GET /admin/events/export -> CSV Blob (respects the same search/status/sort). */
export async function exportHackathonsCsv({
  sort = 'startDate,desc',
  search = '',
  status = '',
} = {}) {
  const { data } = await axiosClient.get('/admin/events/export', {
    params: { sort, search: search || undefined, status: status || undefined },
    responseType: 'blob',
  })
  return data
}

/** GET /admin/events/{id} -> Hackathon */
export async function getHackathonById(id) {
  const { data } = await axiosClient.get(`/admin/events/${id}`)
  return data
}

/** POST /admin/events -> created Hackathon */
export async function createHackathon(payload) {
  const { data } = await axiosClient.post('/admin/events', payload)
  return data
}

/** PUT /admin/events/{id} -> updated Hackathon */
export async function updateHackathon(id, payload) {
  const { data } = await axiosClient.put(`/admin/events/${id}`, payload)
  return data
}

/** DELETE /admin/events/{id} */
export async function deleteHackathon(id) {
  await axiosClient.delete(`/admin/events/${id}`)
}
