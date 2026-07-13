// Centralized role-based permissions (DRY). The role is persisted at login by
// authService into localStorage['adminRole'] ('ADMIN' | 'JUDGE').
//
//   const { isAdmin } = usePermissions()
//   <Button {...adminOnly(isAdmin)} onClick={...}>Delete</Button>
//
// isAdmin gates ADMIN-only actions (create/edit/delete/manage). JUDGE-permitted
// actions (approve/reject submissions, assign scores) are intentionally NOT gated.

import { useMemo } from 'react'

const ROLE_KEY = 'adminRole'
export const ADMIN_ONLY_TITLE = 'Access restricted to Admins'

export function usePermissions() {
  return useMemo(() => {
    const role = (
      (typeof window !== 'undefined' && localStorage.getItem(ROLE_KEY)) || ''
    ).toUpperCase()
    const isAdmin = role === 'ADMIN'
    const isJudge = role === 'JUDGE'
    // Can the current user access something restricted to `required`? Admin
    // supersedes every role; anyone matches an empty/undefined requirement.
    const canAccess = (required) =>
      !required || role === String(required).toUpperCase() || isAdmin
    return { role, isAdmin, isJudge, canAccess }
  }, [])
}

/**
 * Props to spread onto an admin-only button. For non-admins it disables the
 * control and adds the restriction tooltip; for admins it adds nothing.
 * (The shared <Button> already renders a grayed-out `disabled` state.)
 */
export function adminOnly(isAdmin) {
  return isAdmin ? {} : { disabled: true, title: ADMIN_ONLY_TITLE }
}

export default usePermissions
