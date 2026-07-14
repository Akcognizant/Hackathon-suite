// Router for the unified Hackathon Portal.
//
// One login backs three roles. After auth, the SPA renders either the ADMIN/JUDGE
// admin console or the PARTICIPANT portal, gated by RequireRole on the JWT role
// stored at login. The backend independently enforces the same boundaries.

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext'
import { currentRole, isAuthenticated } from './api/authService'

// Admin console
import AdminLayout from './components/AdminLayout'
import AdminLogin from './components/AdminLogin'
import RequestAccess from './pages/RequestAccess'
import AccessRequests from './pages/AccessRequests'
import SubmissionForm from './components/SubmissionForm'
import AdminDashboard from './pages/AdminDashboard'
import HackathonList from './pages/HackathonList'
import HackathonForm from './pages/HackathonForm'
import ParticipantManagement from './components/ParticipantManagement'
import SubmissionTracking from './components/SubmissionTracking'
import ScoreManagement from './components/ScoreManagement'
import Leaderboard from './components/Leaderboard'
import TeamsList from './pages/TeamsList'

// Participant portal
import SsoLanding from './pages/SsoLanding'
import ParticipantLayout from './components/ParticipantLayout'
import PDashboard from './pages/participant/Dashboard'
import PEvents from './pages/participant/Events'
import PTeams from './pages/participant/Teams'
import PMyTeams from './pages/participant/MyTeams'
import PSubmit from './pages/participant/SubmitProject'
import PSubmissions from './pages/participant/Submissions'
import PHistory from './pages/participant/History'
import PHelp from './pages/participant/Help'

const ADMIN_ROLES = ['ADMIN', 'JUDGE']

function homeForRole(role) {
  return role === 'PARTICIPANT' ? '/portal' : '/dashboard'
}

// Gate: requires auth and (optionally) one of `roles`. Unauthenticated → /login;
// wrong role → that user's own home (so a participant can't sit on /dashboard).
function RequireRole({ roles, children }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />
  const role = currentRole()
  if (roles && !roles.includes(role)) {
    return <Navigate to={homeForRole(role)} replace />
  }
  return children
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<AdminLogin />} />
          {/* Public: request an admin/judge account (pending admin approval) */}
          <Route path="/request-access" element={<RequestAccess />} />
          {/* SSO handoff from the assessment portal (passed candidates only) */}
          <Route path="/sso" element={<SsoLanding />} />
          {/* Public secret-based team submission intake (kept from admin portal) */}
          <Route path="/submit" element={<SubmissionForm />} />

          {/* Admin / Judge console */}
          <Route
            element={
              <RequireRole roles={ADMIN_ROLES}>
                <AdminLayout />
              </RequireRole>
            }
          >
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/hackathons" element={<HackathonList />} />
            <Route path="/hackathons/new" element={<HackathonForm />} />
            <Route path="/hackathons/edit/:id" element={<HackathonForm />} />
            <Route path="/participants" element={<ParticipantManagement />} />
            <Route path="/submissions" element={<SubmissionTracking />} />
            <Route path="/scores" element={<ScoreManagement />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/teams" element={<TeamsList />} />
            {/* ADMIN-only inside the page (judges are redirected out) */}
            <Route path="/access-requests" element={<AccessRequests />} />
          </Route>

          {/* Participant portal */}
          <Route
            element={
              <RequireRole roles={['PARTICIPANT']}>
                <ParticipantLayout />
              </RequireRole>
            }
          >
            <Route path="/portal" element={<PDashboard />} />
            <Route path="/portal/events" element={<PEvents />} />
            <Route path="/portal/teams" element={<PTeams />} />
            <Route path="/portal/my-teams" element={<PMyTeams />} />
            <Route path="/portal/submit" element={<PSubmit />} />
            <Route path="/portal/submissions" element={<PSubmissions />} />
            <Route path="/portal/history" element={<PHistory />} />
            <Route path="/portal/help" element={<PHelp />} />
          </Route>

          {/* Default: send authenticated users to their home, others to login. */}
          <Route
            path="*"
            element={
              isAuthenticated() ? (
                <Navigate to={homeForRole(currentRole())} replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
