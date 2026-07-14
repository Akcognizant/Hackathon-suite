// Admin-only API for reviewing admin/judge access requests.
import axiosClient from './axiosClient'

export async function listAccessRequests(status = 'PENDING') {
  const { data } = await axiosClient.get('/admin/access-requests', { params: { status } })
  return data
}

export async function accessRequestCount() {
  const { data } = await axiosClient.get('/admin/access-requests/count')
  return data.pending ?? 0
}

export async function approveAccessRequest(id) {
  await axiosClient.post(`/admin/access-requests/${id}/approve`)
}

export async function rejectAccessRequest(id) {
  await axiosClient.post(`/admin/access-requests/${id}/reject`)
}
