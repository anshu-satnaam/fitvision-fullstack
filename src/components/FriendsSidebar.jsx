import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { socialAPI } from '../api'

export default function FriendsSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchFriends = async () => {
    try {
      setLoading(true)
      const data = await socialAPI.getFriends()
      setFriends(data || [])
    } catch (err) {
      console.error('Failed to fetch friends for sidebar', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) fetchFriends()
  }, [isOpen])

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          right: isOpen ? '320px' : '20px',
          bottom: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#d4a574',
          color: '#12080d',
          border: 'none',
          cursor: 'pointer',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(212,165,116,0.4)',
          transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
        }}
      >
        <Icon icon={isOpen ? "lucide:x" : "lucide:users"} style={{ fontSize: '24px' }} />
        {!isOpen && friends.filter(f => f.is_online).length > 0 && (
          <span style={{ position: 'absolute', top: 0, right: 0, width: '12px', height: '12px', background: '#10b981', borderRadius: '50%', border: '2px solid white' }} />
        )}
      </button>

      {/* Sidebar Panel */}
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          width: '320px',
          background: 'rgba(26,13,24,0.95)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(212,165,116,0.2)',
          zIndex: 9999,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
          padding: '2rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 className="heading" style={{ fontSize: '1.25rem', textTransform: 'uppercase', margin: 0 }}>Social Panel</h2>
          <button onClick={() => fetchFriends()} style={{ background: 'none', border: 'none', color: '#d4a574', cursor: 'pointer' }}>
            <Icon icon="lucide:refresh-cw" style={{ fontSize: '1.25rem' }} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }} className="custom-scrollbar">
          {loading ? (
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>Loading friends...</p>
          ) : friends.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>No friends yet.</p>
          ) : (
            friends.map(friend => (
              <div
                key={friend.user_id}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  padding: '1rem',
                  borderRadius: '1.25rem',
                  border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{ position: 'relative' }}>
                  <img
                    src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`}
                    alt={friend.username}
                    style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#000' }}
                  />
                  <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '10px', height: '10px', background: friend.is_online ? '#10b981' : 'rgba(255,255,255,0.2)', border: '2px solid #1a0d18', borderRadius: '50%' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>{friend.username}</div>
                  <div style={{ fontSize: '0.625rem', color: '#d4a574', textTransform: 'uppercase', fontWeight: 800 }}>Lvl {friend.level}</div>
                </div>
                <button
                  onClick={() => window.location.href = `/dashboard/duel?challenge=${friend.user_id}`}
                  style={{
                    background: '#d4a574',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <Icon icon="mdi:sword-cross" style={{ color: '#12080d', fontSize: '1.25rem' }} />
                </button>
              </div>
            ))
          )}
        </div>

        <button
          onClick={() => window.location.href = '/dashboard/friends'}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '1rem',
            borderRadius: '1.25rem',
            color: 'white',
            fontWeight: 800,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            cursor: 'pointer',
          }}
        >
          View All Network
        </button>
      </div>
    </>
  )
}
