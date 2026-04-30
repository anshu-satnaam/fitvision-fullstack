/**
 * AuthContext.jsx
 *
 * Single source of truth for authentication.
 * Strategy:
 *   1. Firebase handles Google/Apple/Facebook social login.
 *   2. Backend JWT handles email/password login via our FastAPI.
 *   3. Both paths converge here — once either succeeds the user is "logged in".
 *
 * `user` shape exposed to the rest of the app:
 *   { id, username, email, avatar_url, points, streak, level, source: 'firebase'|'backend' }
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, isDemoMode } from './firebase'
import { authAPI, profileAPI, getToken, setToken, clearToken } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // null = still resolving, false = logged out, object = logged in
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // ── Bootstrap: check for existing backend JWT on page load ────────────────
  useEffect(() => {
    const token = getToken()
    if (token) {
      authAPI.me()
        .then((backendUser) => setUser({ ...backendUser, source: 'backend' }))
        .catch(() => { clearToken(); setUser(false) })
        .finally(() => setLoading(false))
    } else if (isDemoMode) {
      // No Firebase and no JWT — start as logged out
      setUser(false)
      setLoading(false)
    } else {
      // Let Firebase listener handle it below
    }
  }, [])

  // ── Firebase auth state listener (for social logins) ─────────────────────
  useEffect(() => {
    if (isDemoMode || getToken()) return // already handled above

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id:         firebaseUser.uid,
          username:   firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email:      firebaseUser.email,
          avatar_url: firebaseUser.photoURL,
          source:     'firebase',
        })
      } else {
        setUser(false)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  // ── Backend email/password login ──────────────────────────────────────────
  const loginWithBackend = useCallback(async (email, password) => {
    const data = await authAPI.login(email, password)
    setToken(data.access_token)
    const backendUser = await authAPI.me()
    setUser({ ...backendUser, source: 'backend' })
    return backendUser
  }, [])

  // ── Backend registration ──────────────────────────────────────────────────
  const registerWithBackend = useCallback(async (username, email, password) => {
    const data = await authAPI.signup(username, email, password)
    setToken(data.access_token)
    const backendUser = await authAPI.me()
    setUser({ ...backendUser, source: 'backend' })
    return backendUser
  }, [])

  // ── Logout (both Firebase + backend) ─────────────────────────────────────
  const logout = useCallback(async () => {
    clearToken()
    if (!isDemoMode && auth?.currentUser) {
      const { signOut } = await import('firebase/auth')
      await signOut(auth).catch(() => {})
    }
    setUser(false)
  }, [])

  // ── Refresh user profile from backend ────────────────────────────────────
  const refreshUser = useCallback(async () => {
    if (getToken()) {
      try {
        const backendUser = await authAPI.me()
        setUser((prev) => ({ ...prev, ...backendUser, source: 'backend' }))
      } catch { /* ignore */ }
    }
  }, [])

  const isLoggedIn = Boolean(user)

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, loading, loginWithBackend, registerWithBackend, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
