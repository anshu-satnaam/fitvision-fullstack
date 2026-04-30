import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import AuthPage        from './components/AuthPage'
import LiveWorkoutPage from './components/LiveWorkoutPage'
import ChatbotPage     from './components/ChatbotPage'
import ProfilePage     from './components/ProfilePage'
import DuelPage        from './components/DuelPage'
import LeaderboardPage from './components/LeaderboardPage'
import FriendsPage     from './components/FriendsPage'
import ClanPage        from './components/ClanPage'

/** Inner router — needs to be inside AuthProvider to call useAuth */
function AppRoutes() {
  const { isLoggedIn, loading } = useAuth()

  // Resolve auth state — show nothing to avoid flash
  if (loading) return null

  return (
    <Routes>
      {/* Auth — redirect to dashboard if already logged in */}
      <Route
        path="/"
        element={isLoggedIn ? <Navigate to="/dashboard/live" replace /> : <AuthPage />}
      />

      {/* Dashboard — redirect to auth if not logged in */}
      <Route path="/dashboard/live"        element={isLoggedIn ? <LiveWorkoutPage /> : <Navigate to="/" replace />} />
      <Route path="/dashboard/chatbot"     element={isLoggedIn ? <ChatbotPage />     : <Navigate to="/" replace />} />
      <Route path="/dashboard/profile"     element={isLoggedIn ? <ProfilePage />     : <Navigate to="/" replace />} />
      <Route path="/dashboard/duel"        element={isLoggedIn ? <DuelPage />        : <Navigate to="/" replace />} />
      <Route path="/dashboard/leaderboard" element={isLoggedIn ? <LeaderboardPage /> : <Navigate to="/" replace />} />
      <Route path="/dashboard/friends"     element={isLoggedIn ? <FriendsPage />     : <Navigate to="/" replace />} />
      <Route path="/dashboard/clan"        element={isLoggedIn ? <ClanPage />        : <Navigate to="/" replace />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
