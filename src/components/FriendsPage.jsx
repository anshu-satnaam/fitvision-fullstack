import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import DashboardNav from './DashboardNav'
import FloatingParticles from './FloatingParticles'
import { useAuth } from '../AuthContext'
import api from '../api'

export default function FriendsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('friends') // 'friends', 'search', 'requests'
  
  // Data states
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [suggestions, setSuggestions] = useState([])
  
  // UI states
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Profile Modal state
  const [selectedUser, setSelectedUser] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)

  // ── Fetch Data ─────────────────────────────────────────────────────────────
  
  const fetchFriends = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/friends')
      setFriends(res.data)
    } catch (err) {
      console.error(err)
      setError('Failed to load friends.')
    } finally {
      setLoading(false)
    }
  }

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/friends/requests/pending')
      setRequests(res.data)
    } catch (err) {
      console.error(err)
      setError('Failed to load requests.')
    } finally {
      setLoading(false)
    }
  }

  const fetchSuggestions = async () => {
    try {
      const res = await api.get('/api/friends/suggestions')
      setSuggestions(res.data)
    } catch (err) {
      console.error('Failed to load suggestions', err)
    }
  }

  useEffect(() => {
    if (activeTab === 'friends') fetchFriends()
    if (activeTab === 'requests') fetchRequests()
    if (activeTab === 'search') fetchSuggestions()
    // Parallax effect
    const handleMouse = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      document.querySelectorAll('.card-3d').forEach(card => {
        card.style.transform = `rotateY(${x * 4}deg) rotateX(${-y * 4}deg) translateZ(10px)`;
      });
    }
    document.addEventListener('mousemove', handleMouse)
    return () => document.removeEventListener('mousemove', handleMouse)
  }, [activeTab])

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleSearch = async (e) => {
    e.preventDefault()
    if (searchQuery.length < 2) return
    try {
      setLoading(true)
      const res = await api.get(`/api/users/search?q=${encodeURIComponent(searchQuery)}`)
      setSearchResults(res.data)
    } catch (err) {
      console.error(err)
      setError('Failed to search users.')
    } finally {
      setLoading(false)
    }
  }

  const sendFriendRequest = async (userId) => {
    try {
      await api.post(`/api/friends/${userId}/request`)
      // Update local state to reflect 'sent'
      setSearchResults(prev => prev.map(u => u.user_id === userId ? { ...u, friendship_status: 'pending', friendship_direction: 'sent' } : u))
      setSuggestions(prev => prev.map(u => u.user_id === userId ? { ...u, friendship_status: 'pending', friendship_direction: 'sent' } : u))
      if (selectedUser && selectedUser.user_id === userId) {
        setSelectedUser(prev => ({ ...prev, friendship_status: 'pending', friendship_direction: 'sent' }))
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to send request')
    }
  }

  const acceptRequest = async (userId) => {
    try {
      await api.post(`/api/friends/${userId}/accept`)
      setRequests(prev => prev.filter(req => req.user_id !== userId))
      if (selectedUser && selectedUser.user_id === userId) {
        setSelectedUser(prev => ({ ...prev, friendship_status: 'accepted' }))
      }
    } catch (err) {
      alert('Failed to accept request')
    }
  }

  const rejectRequest = async (userId) => {
    try {
      await api.post(`/api/friends/${userId}/reject`)
      setRequests(prev => prev.filter(req => req.user_id !== userId))
      if (selectedUser && selectedUser.user_id === userId) {
        setSelectedUser(prev => ({ ...prev, friendship_status: 'none' }))
      }
    } catch (err) {
      alert('Failed to reject request')
    }
  }
  
  const removeFriend = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this friend?')) return
    try {
      await api.delete(`/api/friends/${userId}`)
      setFriends(prev => prev.filter(f => f.user_id !== userId))
      if (selectedUser && selectedUser.user_id === userId) {
        setSelectedUser(prev => ({ ...prev, friendship_status: 'none' }))
      }
    } catch (err) {
      alert('Failed to remove friend')
    }
  }

  const viewProfile = async (userId) => {
    try {
      setProfileLoading(true)
      setSelectedUser({ _loading: true }) // Show skeleton/spinner modal
      const res = await api.get(`/api/users/${userId}/profile`)
      setSelectedUser(res.data)
    } catch (err) {
      alert('Could not load user profile')
      setSelectedUser(null)
    } finally {
      setProfileLoading(false)
    }
  }

  // ── Render Helpers ─────────────────────────────────────────────────────────

  const getAvatar = (url, name) => url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`

  return (
    <div style={{ minHeight: '100vh', background: '#12080d', color: 'white', position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <FloatingParticles />
      <DashboardNav />

      <main style={{ flex: 1, padding: '2rem', maxWidth: '1280px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        
        {/* ── Header ── */}
        <header style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="md-flex-row md-justify-between">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h1 className="heading" style={{ fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', letterSpacing: '-0.04em', textTransform: 'uppercase', lineHeight: 1 }}>
                Social <span style={{ color: '#d4a574' }}>Network</span>
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.375rem 0.75rem', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Icon icon="lucide:users" style={{ color: '#d4a574' }} />
                  <span style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }}>{friends.length} Friends</span>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button onClick={() => setActiveTab('search')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#d4a574', color: '#12080d', padding: '0.75rem 1.5rem', borderRadius: '9999px', fontWeight: 900, fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.15em', border: 'none', cursor: 'pointer', boxShadow: '0 10px 25px rgba(212,165,116,0.2)', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform='scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform='scale(1)'}>
                <Icon icon="lucide:search" style={{ fontSize: '1.125rem' }} /> Find Friends
              </button>
            </div>
          </div>

          {/* ── Tabs & Search ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(42,18,32,0.4)', padding: '0.75rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }} className="md-flex-row md-align-center">
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem', background: 'rgba(0,0,0,0.2)', borderRadius: '1rem', flexShrink: 0 }}>
              {[
                { id: 'friends', label: 'My Friends' },
                { id: 'search', label: 'Search' },
                { id: 'requests', label: 'Requests' }
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '0.5rem 1.5rem', borderRadius: '0.75rem', fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: activeTab === tab.id ? '#d4a574' : 'transparent', color: activeTab === tab.id ? '#12080d' : 'rgba(255,255,255,0.4)' }}>
                  {tab.label}
                  {tab.id === 'requests' && requests.length > 0 && activeTab !== 'requests' && (
                    <span style={{ marginLeft: '0.5rem', background: '#ef4444', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '99px', fontSize: '0.5rem' }}>{requests.length}</span>
                  )}
                </button>
              ))}
            </div>

            {activeTab === 'search' && (
              <form onSubmit={handleSearch} style={{ position: 'relative', flex: 1, width: '100%' }}>
                <Icon icon="lucide:search" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '1.25rem' }} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="SEARCH BY USERNAME..." 
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1rem', padding: '0.75rem 1rem 0.75rem 3rem', color: 'white', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', outline: 'none', boxSizing: 'border-box' }} 
                  onFocus={e => e.currentTarget.style.borderColor='rgba(212,165,116,0.5)'} 
                  onBlur={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.05)'} 
                />
                <button type="submit" style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: '#d4a574', color: '#12080d', border: 'none', padding: '0.4rem 1rem', borderRadius: '0.5rem', fontSize: '0.6rem', fontWeight: 900, cursor: 'pointer' }}>Search</button>
              </form>
            )}
          </div>
        </header>

        {loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#d4a574' }}>Loading...</div>}
        {error && <div style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>{error}</div>}

        {/* ── Content Area ── */}
        {!loading && !error && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            
            {/* My Friends Tab */}
            {activeTab === 'friends' && friends.length === 0 && (
              <p style={{ color: 'rgba(255,255,255,0.4)', gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>You have no friends yet. Go to Search to find someone!</p>
            )}
            {activeTab === 'friends' && friends.map((friend) => (
              <div key={friend.user_id} className="parallax-container" style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}>
                <div className="friend-card card-3d" onClick={() => viewProfile(friend.user_id)} style={{ background: 'rgba(42,18,32,0.3)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '2.5rem', position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.5s cubic-bezier(0.23,1,0.32,1)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ position: 'relative' }}>
                        <img src={getAvatar(friend.avatar_url, friend.username)} alt={friend.username} style={{ width: '4rem', height: '4rem', borderRadius: '1rem', background: '#12080d', border: `2px solid ${friend.is_online ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.1)'}`, padding: '0.125rem' }} />
                        <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '1rem', height: '1rem', background: friend.is_online ? '#10b981' : 'rgba(255,255,255,0.2)', border: '4px solid #2a1220', borderRadius: '50%' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h3 className="heading" style={{ fontSize: '1.125rem', textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0, color: 'white' }}>{friend.username}</h3>
                        <span style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: friend.is_online ? '#10b981' : 'rgba(255,255,255,0.2)' }}>{friend.is_online ? 'Online' : 'Offline'}</span>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(212,165,116,0.1)', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', border: '1px solid rgba(212,165,116,0.2)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Icon icon="lucide:shield-check" style={{ color: '#d4a574', fontSize: '0.75rem' }} />
                      <span style={{ fontSize: '0.5625rem', fontWeight: 900, color: '#d4a574' }}>Lvl {friend.level}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Search Tab */}
            {activeTab === 'search' && searchQuery.length === 0 && (
              <div style={{ gridColumn: '1/-1' }}>
                <h3 className="heading" style={{ fontSize: '0.8rem', color: '#d4a574', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '1.5rem', opacity: 0.7 }}>Suggested for You</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                  {suggestions.map((sug) => (
                    <div key={sug.user_id} className="friend-card" style={{ background: 'rgba(42,18,32,0.3)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <img src={getAvatar(sug.avatar_url, sug.username)} alt={sug.username} style={{ width: '3.5rem', height: '3.5rem', borderRadius: '0.75rem', background: '#12080d' }} />
                      <div style={{ flex: 1 }}>
                        <h4 className="heading" style={{ fontSize: '1rem', margin: 0 }}>{sug.username}</h4>
                        <span style={{ fontSize: '0.6rem', color: '#d4a574' }}>Lvl {sug.level}</span>
                      </div>
                      {sug.friendship_status === 'pending' ? (
                        <button disabled style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '0.75rem', fontSize: '0.6rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)' }}>
                          {sug.friendship_direction === 'sent' ? 'SENT' : 'PENDING'}
                        </button>
                      ) : (
                        <button onClick={() => sendFriendRequest(sug.user_id)} style={{ background: '#d4a574', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.75rem', fontSize: '0.6rem', fontWeight: 900, cursor: 'pointer', color: '#12080d' }}>+ ADD</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'search' && searchQuery.length > 0 && searchResults.length === 0 && (
              <p style={{ color: 'rgba(255,255,255,0.4)', gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>No users found for "{searchQuery}".</p>
            )}
            {activeTab === 'search' && searchQuery.length > 0 && searchResults.map((result) => (
              <div key={result.user_id} className="parallax-container" style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}>
                <div className="friend-card card-3d" onClick={() => viewProfile(result.user_id)} style={{ background: 'rgba(42,18,32,0.3)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '2.5rem', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <img src={getAvatar(result.avatar_url, result.username)} alt={result.username} style={{ width: '4rem', height: '4rem', borderRadius: '1rem', background: '#12080d', border: '2px solid rgba(255,255,255,0.1)', padding: '0.125rem' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <h3 className="heading" style={{ fontSize: '1.125rem', textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0, color: 'white' }}>{result.username}</h3>
                      <span style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#d4a574' }}>Lvl {result.level}</span>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <div style={{ marginTop: 'auto' }} onClick={e => e.stopPropagation()}>
                    {result.friendship_status === 'accepted' ? (
                      <button disabled style={{ width: '100%', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: '0.75rem', borderRadius: '1rem', color: '#10b981', fontWeight: 900, fontSize: '0.65rem', textTransform: 'uppercase' }}>Friends ✓</button>
                    ) : result.friendship_status === 'pending' ? (
                      <button disabled style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '1rem', color: 'rgba(255,255,255,0.4)', fontWeight: 900, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                        {result.friendship_direction === 'sent' ? 'Request Sent' : 'Check Requests'}
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          sendFriendRequest(result.user_id);
                        }} 
                        style={{ width: '100%', background: '#d4a574', border: 'none', padding: '0.75rem', borderRadius: '1rem', color: '#12080d', fontWeight: 900, fontSize: '0.65rem', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 8px 20px rgba(212,165,116,0.3)' }}
                      >
                        + Add Friend
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Requests Tab */}
            {activeTab === 'requests' && requests.length === 0 && (
              <p style={{ color: 'rgba(255,255,255,0.4)', gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>No pending requests.</p>
            )}
            {activeTab === 'requests' && requests.map((req) => (
              <div key={req.request_id} className="parallax-container" style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}>
                <div className="friend-card card-3d" onClick={() => viewProfile(req.user_id)} style={{ background: 'rgba(42,18,32,0.3)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '2.5rem', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <img src={getAvatar(req.avatar_url, req.username)} alt={req.username} style={{ width: '4rem', height: '4rem', borderRadius: '1rem', background: '#12080d', border: '2px solid rgba(255,255,255,0.1)', padding: '0.125rem' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <h3 className="heading" style={{ fontSize: '1.125rem', textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0, color: 'white' }}>{req.username}</h3>
                      <span style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#a78bfa' }}>Wants to be friends</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => acceptRequest(req.user_id)} style={{ flex: 1, background: '#10b981', border: 'none', padding: '0.75rem', borderRadius: '1rem', color: '#064e3b', fontWeight: 900, fontSize: '0.65rem', textTransform: 'uppercase', cursor: 'pointer' }}>✓ Accept</button>
                    <button onClick={() => rejectRequest(req.user_id)} style={{ flex: 1, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '0.75rem', borderRadius: '1rem', color: '#f87171', fontWeight: 900, fontSize: '0.65rem', textTransform: 'uppercase', cursor: 'pointer' }}>✗ Decline</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* ── User Profile Modal ── */}
      {selectedUser && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(10,4,14,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setSelectedUser(null)}>
          <div style={{ background: '#1a0d18', border: '1px solid rgba(212,165,116,0.3)', borderRadius: '2rem', padding: '2.5rem', width: '100%', maxWidth: '400px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedUser(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            
            {selectedUser._loading ? (
               <div style={{ color: '#d4a574', padding: '2rem' }}>Loading Profile...</div>
            ) : (
              <>
                <img src={getAvatar(selectedUser.avatar_url, selectedUser.username)} alt="Avatar" style={{ width: '6rem', height: '6rem', borderRadius: '50%', background: '#12080d', border: '3px solid #d4a574', padding: '0.25rem' }} />
                
                <div style={{ textAlign: 'center' }}>
                  <h2 className="heading" style={{ fontSize: '1.75rem', textTransform: 'uppercase', margin: 0, color: 'white' }}>{selectedUser.username}</h2>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem' }}>{selectedUser.bio || "No bio set."}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%' }}>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Level</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#d4a574' }}>{selectedUser.level}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Streak</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981' }}>{selectedUser.streak} <span style={{fontSize:'0.8rem'}}>🔥</span></div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Workouts</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white' }}>{selectedUser.total_workouts || 0}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Reps</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#a78bfa' }}>{selectedUser.total_reps || 0}</div>
                  </div>
                </div>

                {/* Modal Action Buttons based on relationship */}
                {selectedUser.user_id !== user?.id && (
                  <div style={{ width: '100%', marginTop: '1rem' }}>
                    {selectedUser.friendship_status === 'accepted' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <button 
                          onClick={() => {
                            setSelectedUser(null);
                            window.location.href = `/dashboard/duel?challenge=${selectedUser.user_id}`;
                          }} 
                          style={{ width: '100%', padding: '0.85rem', borderRadius: '1rem', background: '#d4a574', border: 'none', color: '#12080d', fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 8px 20px rgba(212,165,116,0.3)' }}
                        >
                          Challenge to Duel
                        </button>
                        <button onClick={() => removeFriend(selectedUser.user_id)} style={{ width: '100%', padding: '0.85rem', borderRadius: '1rem', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer', fontSize: '0.7rem' }}>Remove Friend</button>
                      </div>
                    ) : selectedUser.friendship_status === 'pending' ? (
                      selectedUser.friendship_direction === 'sent' ? (
                        <button disabled style={{ width: '100%', padding: '0.85rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.4)', fontWeight: 900, textTransform: 'uppercase' }}>Request Sent</button>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                           <button onClick={() => acceptRequest(selectedUser.user_id)} style={{ flex: 1, background: '#10b981', border: 'none', padding: '0.85rem', borderRadius: '1rem', color: '#064e3b', fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer' }}>Accept</button>
                           <button onClick={() => rejectRequest(selectedUser.user_id)} style={{ flex: 1, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '0.85rem', borderRadius: '1rem', color: '#f87171', fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer' }}>Decline</button>
                        </div>
                      )
                    ) : (
                      <button onClick={() => sendFriendRequest(selectedUser.user_id)} style={{ width: '100%', padding: '0.85rem', borderRadius: '1rem', background: '#d4a574', border: 'none', color: '#12080d', fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer' }}>Add Friend</button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Background Waves */}
      <div className="wave-bg" style={{ opacity: 0.15, zIndex: 0 }}>
        <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#d4a574"></path>
        </svg>
      </div>

      <style>{`
        .md-flex-row { flex-direction: column; }
        @media (min-width: 768px) {
          .md-flex-row { flex-direction: row; }
          .md-justify-between { justify-content: space-between; align-items: flex-end; }
          .md-align-center { align-items: center; }
        }
        .friend-card:hover {
          background: rgba(255,255,255,0.08) !important;
          border-color: rgba(212,165,116,0.3) !important;
        }
      `}</style>
    </div>
  )
}
