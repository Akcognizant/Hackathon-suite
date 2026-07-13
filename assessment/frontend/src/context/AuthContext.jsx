import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [candidate, setCandidate] = useState(() => {
    const stored = sessionStorage.getItem('candidate')
    return stored ? JSON.parse(stored) : null
  })

  const login = (candidateData, token) => {
    sessionStorage.setItem('candidate', JSON.stringify(candidateData))
    sessionStorage.setItem('token', token)
    setCandidate(candidateData)
  }

  const logout = () => {
    sessionStorage.removeItem('candidate')
    sessionStorage.removeItem('token')
    setCandidate(null)
  }

  return (
    <AuthContext.Provider value={{ candidate, login, logout, isLoggedIn: !!candidate }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}