// Participant-portal API wrappers. All calls go through the shared axiosClient
// (JWT bearer + 401 handling) and hit the backend's /participant/** surface,
// which is gated to the PARTICIPANT role.

import axiosClient from './axiosClient'

export async function getEvents() {
  const { data } = await axiosClient.get('/participant/events')
  return data
}

export async function getMyTeams() {
  const { data } = await axiosClient.get('/participant/teams/mine')
  return data
}

export async function getJoinableTeams() {
  const { data } = await axiosClient.get('/participant/teams/joinable')
  return data
}

export async function createTeam({ name, description, hackathonId, members }) {
  const { data } = await axiosClient.post('/participant/teams', {
    name,
    description,
    hackathonId,
    members,
  })
  return data
}

export async function joinTeam(teamId) {
  const { data } = await axiosClient.post(`/participant/teams/${teamId}/join`)
  return data
}

export async function addTeamMember(teamId, email) {
  const { data } = await axiosClient.post(`/participant/teams/${teamId}/members`, { email })
  return data
}

export async function leaveTeam(teamId) {
  await axiosClient.delete(`/participant/teams/${teamId}/leave`)
}

export async function getMySubmissions() {
  const { data } = await axiosClient.get('/participant/submissions/me')
  return data
}

export async function submitProject({ teamId, projectTitle, description, repositoryUrl }) {
  const { data } = await axiosClient.post('/participant/submissions', {
    teamId,
    projectTitle,
    description,
    repositoryUrl,
  })
  return data
}

export async function getHistory() {
  const { data } = await axiosClient.get('/participant/history')
  return data
}

/** Ranked leaderboard for one event: [{ rank, team, projectTitle, score }]. */
export async function getLeaderboard(eventId) {
  const { data } = await axiosClient.get(`/leaderboard/${eventId}`)
  return data
}

// --- Notifications: messages an admin sent me (direct + announcements) ---

export async function getMyMessages() {
  const { data } = await axiosClient.get('/participant/messages')
  return data
}

export async function getMyUnreadCount() {
  const { data } = await axiosClient.get('/participant/messages/unread-count')
  return data.count ?? 0
}

export async function markMessageRead(id) {
  await axiosClient.post(`/participant/messages/${id}/read`)
}

export async function clearMyMessages() {
  await axiosClient.delete('/participant/messages')
}
