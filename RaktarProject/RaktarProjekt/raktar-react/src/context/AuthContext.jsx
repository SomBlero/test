import { createContext, useContext, useState, useCallback } from 'react'
import { decodeToken, isLoggedIn as checkLoggedIn, getUserId, getUserName, getUserRole } from '../utils/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))

  const payload = decodeToken(token)
  const loggedIn = checkLoggedIn(token)
  const userId = getUserId(payload)
  const userName = localStorage.getItem('displayName') || getUserName(payload)
  const userRole = getUserRole(payload)

  const login = useCallback((newToken) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('displayName')
    setToken(null)
  }, [])

  const updateDisplayName = useCallback((name) => {
    localStorage.setItem('displayName', name)
    setToken(prev => prev) // trigger re-render
  }, [])

  return (
    <AuthContext.Provider value={{ token, loggedIn, userId, userName, userRole, payload, login, logout, updateDisplayName }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
