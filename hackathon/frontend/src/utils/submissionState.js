// Participant-facing submission state. Once an admin has awarded a score the
// submission is considered "completed"; otherwise it reflects the review status
// (PENDING / APPROVED / REJECTED).

export function submissionDisplayStatus(sub) {
  if (!sub) return null
  if (sub.score != null) return 'COMPLETED'
  return sub.status
}

export const SUBMISSION_STATUS_STYLES = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-blue-100 text-blue-800',
}
