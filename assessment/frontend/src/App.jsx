import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import HistoryPage from './pages/HistoryPage'
import AssessmentPage from './pages/AssessmentPage'
import ResultPage from './pages/ResultPage'
import AnalyticsPage from './pages/AnalyticsPage'
import ProtectedRoute from './components/ProtectedRoute'
import './index.css'
import NotFoundPage from './pages/NotFound'
import InstructionsPage from './pages/InstructionPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/register" element={<RegisterPage />} />

        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute><HistoryPage /></ProtectedRoute>
        } />
        <Route path="/assessment" element={
          <ProtectedRoute><AssessmentPage /></ProtectedRoute>
        } />
        <Route path="/results/:sessionId" element={
          <ProtectedRoute><ResultPage /></ProtectedRoute>
        } />
        <Route path="/analytics/:sessionId" element={
          <ProtectedRoute><AnalyticsPage /></ProtectedRoute>
        } />
        <Route path="/instructions" element={
          <ProtectedRoute><InstructionsPage /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProfilePage />
        } />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}