// Role-based rendering wrapper. Renders its children only if the logged-in user
// can access the given role; otherwise renders `fallback` (nothing by default).
// This HIDES restricted UI rather than disabling it — cleaner, role-tailored UX.
//
// NOTE: This is UX only. Real authorization is enforced by the backend on every
// API call — hiding a button never grants or denies actual access.
//
//   <ProtectedRole role="ADMIN">
//     <Button>Delete</Button>
//   </ProtectedRole>
//
// For inline checks outside JSX, use the hook directly:
//   const { canAccess } = usePermissions()
//   if (canAccess('ADMIN')) { ... }

import { usePermissions } from '../hooks/usePermissions'

function ProtectedRole({ role, fallback = null, children }) {
  const { canAccess } = usePermissions()
  return canAccess(role) ? children : fallback
}

export default ProtectedRole
