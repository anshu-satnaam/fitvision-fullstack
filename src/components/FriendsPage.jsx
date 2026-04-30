import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import DashboardNav from './DashboardNav'
import FloatingParticles from './FloatingParticles'

const FRIENDS = [
  { id: 1, name: 'Marcus Vance', status: 'Online - In Menu', level: 42, rank: 'Elite I', reps: 942, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus', isOnline: true },
  { id: 2, name: 'Lila Thorne', status: 'In Workout (15m)', level: 58, rank: 'Grandmaster', reps: 1840, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lila', isOnline: true },
  { id: 3, name: 'Kael Nova', status: 'Last Online: 2h ago', level: 34, rank: 'Veteran IV', reps: 720, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kael', isOnline: false },
  { id: 4, name: 'Sarah Zen', status: 'Online - Chatting', level: 29, rank: 'Silver III', reps: 610, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', isOnline: true },
  { id: 5, name: 'Aiden Storm', status: 'Online - In Match', level: 99, rank: 'Legendary', reps: 4120, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aiden', isOnline: true },
  { id: 6, name: 'Felix Wright', status: 'Online', level: 41, rank: 'Silver I', reps: 1020, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', isOnline: true },
]

export default function FriendsPage() {
  const [filter, setFilter] = useState('All')
  
  useEffect(() => {
    const handleMouse = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      document.querySelectorAll('.card-3d').forEach(card => {
        card.style.transform = `rotateY(${x * 4}deg) rotateX(${-y * 4}deg) translateZ(10px)`;
      });
    }
    document.addEventListener('mousemove', handleMouse)
    return () => document.removeEventListener('mousemove', handleMouse)
  }, [])

  const filteredFriends = FRIENDS.filter(f => {
    if (filter === 'Online') return f.isOnline
    return true
  })

  return (
    <div style={{ minHeight: '100vh', background: '#12080d', color: 'white', position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <FloatingParticles />
      <DashboardNav />

      <main style={{ flex: 1, padding: '2rem', maxWidth: '1280px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        
        {/* Header Section */}
        <header style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="md-flex-row md-justify-between">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h1 className="heading" style={{ fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', letterSpacing: '-0.04em', textTransform: 'uppercase', lineHeight: 1 }}>
                Social <span style={{ color: '#d4a574' }}>Network</span>
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.375rem 0.75rem', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Icon icon="lucide:users" style={{ color: '#d4a574' }} />
                  <span style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }}>128 Friends</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16,185,129,0.1)', padding: '0.375rem 0.75rem', borderRadius: '9999px', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <span className="animate-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                  <span style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#10b981' }}>42 Online</span>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#d4a574', color: '#12080d', padding: '0.75rem 1.5rem', borderRadius: '9999px', fontWeight: 900, fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.15em', border: 'none', cursor: 'pointer', boxShadow: '0 10px 25px rgba(212,165,116,0.2)', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform='scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform='scale(1)'}>
                <Icon icon="lucide:user-plus" style={{ fontSize: '1.125rem' }} /> Add Friend
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '9999px', fontWeight: 900, fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.15em', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'} onMouseOut={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}>
                <Icon icon="lucide:share-2" style={{ fontSize: '1.125rem' }} /> Invite
              </button>
            </div>
          </div>

          {/* Filter & Search */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(42,18,32,0.4)', padding: '0.75rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }} className="md-flex-row md-align-center">
            <div style={{ position: 'relative', flex: 1, width: '100%' }}>
              <Icon icon="lucide:search" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '1.25rem' }} />
              <input type="text" placeholder="SEARCH FRIENDS BY USERNAME..." style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1rem', padding: '0.75rem 1rem 0.75rem 3rem', color: 'white', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', outline: 'none', boxSizing: 'border-box' }} onFocus={e => e.currentTarget.style.borderColor='rgba(212,165,116,0.5)'} onBlur={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.05)'} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem', background: 'rgba(0,0,0,0.2)', borderRadius: '1rem' }}>
              {['All', 'Online', 'Recent'].map(tab => (
                <button key={tab} onClick={() => setFilter(tab)} style={{ padding: '0.5rem 1.5rem', borderRadius: '0.75rem', fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: filter === tab ? '#d4a574' : 'transparent', color: filter === tab ? '#12080d' : 'rgba(255,255,255,0.4)' }}>
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Friends Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredFriends.map((friend) => (
            <div key={friend.id} className="parallax-container" style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}>
              <div className="friend-card card-3d" style={{ background: 'rgba(42,18,32,0.3)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '2.5rem', position: 'relative', overflow: 'hidden', opacity: friend.isOnline ? 1 : 0.6, transition: 'transform 0.5s cubic-bezier(0.23,1,0.32,1), opacity 0.3s' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                      <img src={friend.avatar} alt={friend.name} style={{ width: '4rem', height: '4rem', borderRadius: '1rem', background: '#12080d', border: `2px solid ${friend.isOnline ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.1)'}`, padding: '0.125rem', filter: friend.isOnline ? 'none' : 'grayscale(100%)' }} />
                      <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '1rem', height: '1rem', background: friend.isOnline ? '#10b981' : 'rgba(255,255,255,0.2)', border: '4px solid #2a1220', borderRadius: '50%' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <h3 className="heading" style={{ fontSize: '1.125rem', textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0, color: 'white' }}>{friend.name}</h3>
                      <span style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: friend.isOnline ? '#10b981' : 'rgba(255,255,255,0.2)' }}>{friend.status}</span>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(212,165,116,0.1)', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', border: '1px solid rgba(212,165,116,0.2)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Icon icon="lucide:shield-check" style={{ color: '#d4a574', fontSize: '0.75rem' }} />
                    <span style={{ fontSize: '0.5625rem', fontWeight: 900, color: '#d4a574' }}>Lvl {friend.level}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.5rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.2em', display: 'block', marginBottom: '0.25rem' }}>Rank</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: friend.isOnline ? '#e2e2e2' : 'rgba(255,255,255,0.4)' }}>{friend.rank}</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.5rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.2em', display: 'block', marginBottom: '0.25rem' }}>Avg Reps</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: friend.isOnline ? '#d4a574' : 'rgba(255,255,255,0.4)' }}>{friend.reps.toLocaleString()}</span>
                  </div>
                </div>

                {friend.isOnline ? (
                  <button style={{ width: '100%', background: 'rgba(20,255,150,0.1)', border: '1px solid rgba(20,255,150,0.3)', padding: '0.75rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.3s' }} onMouseOver={e => {e.currentTarget.style.background='#14ff96'; e.currentTarget.children[0].style.color='#12080d'; e.currentTarget.children[1].style.color='#12080d'; e.currentTarget.style.boxShadow='0 0 15px rgba(20,255,150,0.4)'}} onMouseOut={e => {e.currentTarget.style.background='rgba(20,255,150,0.1)'; e.currentTarget.children[0].style.color='#14ff96'; e.currentTarget.children[1].style.color='white'; e.currentTarget.style.boxShadow='none'}}>
                    <Icon icon="lucide:swords" style={{ color: '#14ff96', fontSize: '1.25rem', transition: 'color 0.3s' }} />
                    <span style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'white', transition: 'color 0.3s' }}>Initiate Battle</span>
                  </button>
                ) : (
                  <button style={{ width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'not-allowed' }}>
                    <Icon icon="lucide:message-square" style={{ color: 'rgba(255,255,255,0.2)', fontSize: '1.25rem' }} />
                    <span style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.2)' }}>Send Message</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

      </main>

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
