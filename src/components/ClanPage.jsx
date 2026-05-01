import { useState, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import DashboardNav from './DashboardNav'
import FloatingParticles from './FloatingParticles'
import { useAuth } from '../AuthContext'
import { socialAPI } from '../api'

export default function ClanPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('browse') // 'browse', 'my-clan', 'leaderboard'
  
  // Data states
  const [clans, setClans] = useState([])
  const [myClan, setMyClan] = useState(null)
  const [clanMembers, setClanMembers] = useState([])
  const [clanChat, setClanChat] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // UI states
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', description: '' })
  const [chatInput, setChatInput] = useState('')
  const chatEndRef = useRef(null)
  const wsRef = useRef(null)

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (activeTab === 'my-clan' && myClan) {
      fetchClanDetails()
      initChatWS()
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [activeTab, myClan])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [clanChat])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      const [allClans, meClan] = await Promise.all([
        socialAPI.getClans(),
        socialAPI.getMyClan()
      ])
      setClans(allClans)
      setMyClan(meClan)
      if (meClan) setActiveTab('my-clan')
    } catch (err) {
      console.error(err)
      setError('Failed to load clan data')
    } finally {
      setLoading(false)
    }
  }

  const fetchClanDetails = async () => {
    if (!myClan) return
    try {
      const [members, chat] = await Promise.all([
        socialAPI.getClanMembers(myClan.id),
        socialAPI.getClanChat(myClan.id)
      ])
      setClanMembers(members)
      setClanChat(chat)
    } catch (err) {
      console.error('Failed to load clan details', err)
    }
  }

  const initChatWS = () => {
    if (!myClan || wsRef.current) return
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace(/^https?:\/\//, '') 
      : `${window.location.hostname}:8000`
    
    const ws = new WebSocket(`${protocol}//${host}/api/clans/${myClan.id}/ws`)
    
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      setClanChat(prev => [...prev, msg])
    }
    
    ws.onclose = () => {
      wsRef.current = null
    }
    
    wsRef.current = ws
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const newClan = await socialAPI.createClan(createForm)
      setShowCreate(false)
      setMyClan(newClan)
      setActiveTab('my-clan')
      fetchInitialData()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create clan')
    }
  }

  const handleJoin = async (clanId) => {
    try {
      await socialAPI.joinClan(clanId)
      fetchInitialData()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to join clan')
    }
  }

  const handleLeave = async () => {
    if (!myClan) return
    if (!window.confirm('Are you sure you want to leave this clan?')) return
    try {
      await socialAPI.leaveClan(myClan.id)
      setMyClan(null)
      setActiveTab('browse')
      fetchInitialData()
    } catch (err) {
      alert('Failed to leave clan')
    }
  }

  const sendChatMessage = async (e) => {
    e.preventDefault()
    if (!chatInput.trim() || !myClan) return
    try {
      await socialAPI.sendClanMessage(myClan.id, chatInput)
      setChatInput('')
    } catch (err) {
      console.error('Failed to send message', err)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#12080d', color: 'white', position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <FloatingParticles />
      <DashboardNav />

      <main style={{ flex: 1, padding: '2rem', maxWidth: '1280px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        
        {/* Header Section */}
        <header style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="md-flex-row md-justify-between md-align-center">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h1 className="heading" style={{ fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', letterSpacing: '-0.04em', textTransform: 'uppercase', lineHeight: 1 }}>
                Clan <span style={{ color: '#d4a574' }}>Headquarters</span>
              </h1>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em' }}>
                Forge alliances. Dominate the ranks.
              </p>
            </div>
            
            {!myClan && (
              <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#d4a574', color: '#12080d', padding: '1rem 2rem', borderRadius: '9999px', fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', border: 'none', cursor: 'pointer', boxShadow: '0 10px 25px rgba(212,165,116,0.3)', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                <Icon icon="lucide:shield-plus" style={{ fontSize: '1.25rem' }} /> Create New Alliance
              </button>
            )}
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
            {['Browse', 'My Clan', 'Leaderboard'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab.toLowerCase().replace(' ', '-'))}
                style={{
                  background: 'none', border: 'none', padding: '0.5rem 1rem',
                  fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: activeTab === tab.toLowerCase().replace(' ', '-') ? '#d4a574' : 'rgba(255,255,255,0.3)',
                  cursor: 'pointer', position: 'relative', transition: 'color 0.2s'
                }}
              >
                {tab}
                {activeTab === tab.toLowerCase().replace(' ', '-') && (
                  <div style={{ position: 'absolute', bottom: '-1rem', left: 0, right: 0, height: '2px', background: '#d4a574', boxShadow: '0 0 10px #d4a574' }} />
                )}
              </button>
            ))}
          </div>
        </header>

        {loading && <div style={{ textAlign: 'center', padding: '5rem', color: '#d4a574' }} className="heading">Initializing Tactical Systems...</div>}
        
        {/* ── Tab: Browse ── */}
        {activeTab === 'browse' && !loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
            {clans.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.4)', gridColumn: '1/-1', textAlign: 'center', padding: '5rem' }}>No active alliances found.</p>
            ) : clans.map(clan => (
              <div key={clan.id} className="clan-card" style={{ background: 'rgba(42,18,32,0.3)', border: '1px solid rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', transition: 'transform 0.3s', backdropFilter: 'blur(10px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ width: '4rem', height: '4rem', borderRadius: '1.25rem', background: 'linear-gradient(135deg, rgba(212,165,116,0.2), rgba(42,18,32,0.6))', border: '1px solid rgba(212,165,116,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🛡️</div>
                  <div>
                    <h3 className="heading" style={{ fontSize: '1.5rem', textTransform: 'uppercase', margin: 0 }}>{clan.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.6rem', color: '#d4a574', fontWeight: 900, textTransform: 'uppercase' }}>Lvl {clan.level}</span>
                      <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                      <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 900, textTransform: 'uppercase' }}>{clan.member_count} Members</span>
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, flex: 1 }}>{clan.description || 'Unity is strength. Join this alliance to dominate together.'}</p>
                <button 
                  onClick={() => handleJoin(clan.id)}
                  disabled={!!myClan}
                  style={{ width: '100%', padding: '1rem', borderRadius: '1.25rem', background: myClan ? 'rgba(255,255,255,0.05)' : 'rgba(212,165,116,0.1)', border: '1px solid rgba(212,165,116,0.2)', color: myClan ? 'rgba(255,255,255,0.2)' : '#d4a574', fontWeight: 900, textTransform: 'uppercase', fontSize: '0.75rem', cursor: myClan ? 'default' : 'pointer', letterSpacing: '0.1em' }}
                >
                  {myClan ? 'In Another Clan' : 'Request to Join'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Tab: My Clan ── */}
        {activeTab === 'my-clan' && !loading && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem' }} className="my-clan-grid">
            {!myClan ? (
              <div style={{ textAlign: 'center', padding: '5rem' }}>
                <h2 className="heading" style={{ fontSize: '2rem', marginBottom: '1rem' }}>No Active Alliance</h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '2rem' }}>You are currently a lone wolf. Join or create a clan to unlock rewards.</p>
                <button onClick={() => setActiveTab('browse')} style={{ background: '#d4a574', color: '#12080d', padding: '1rem 2rem', borderRadius: '9999px', fontWeight: 900, border: 'none', cursor: 'pointer' }}>Browse Alliances</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="lg-grid-layout">
                {/* Clan Info + Members */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div style={{ background: 'linear-gradient(135deg, rgba(42,18,32,0.6), rgba(26,13,24,0.4))', border: '1px solid rgba(212,165,116,0.2)', padding: '2.5rem', borderRadius: '3rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-2rem', right: '-2rem', fontSize: '10rem', opacity: 0.05 }}>🛡️</div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                          <div style={{ width: '5rem', height: '5rem', borderRadius: '1.5rem', background: '#d4a574', color: '#12080d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', boxShadow: '0 10px 30px rgba(212,165,116,0.4)' }}>🛡️</div>
                          <div>
                            <h2 className="heading" style={{ fontSize: '2.5rem', textTransform: 'uppercase', margin: 0 }}>{myClan.name}</h2>
                            <p style={{ fontSize: '0.75rem', color: '#d4a574', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Level {myClan.level} Tactical Unit</p>
                          </div>
                        </div>
                        <button onClick={handleLeave} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '0.75rem 1.5rem', borderRadius: '9999px', fontWeight: 900, fontSize: '0.65rem', textTransform: 'uppercase', cursor: 'pointer' }}>Leave Alliance</button>
                      </div>
                      <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, maxWidth: '600px' }}>{myClan.description}</p>
                    </div>
                  </div>

                  {/* Members List */}
                  <div style={{ background: 'rgba(42,18,32,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2.5rem', padding: '2rem' }}>
                    <h3 className="heading" style={{ fontSize: '1.25rem', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Operational Personnel ({clanMembers.length})</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                      {clanMembers.map(member => (
                        <div key={member.user_id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <img src={member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`} alt={member.username} style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem' }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>{member.username}</div>
                            <div style={{ fontSize: '0.6rem', color: '#d4a574', textTransform: 'uppercase', fontWeight: 800 }}>{member.role === 'leader' ? 'COMMANDER' : 'VETERAN'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Clan Chat */}
                <div style={{ background: 'rgba(26,13,24,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2.5rem', height: '600px', display: 'flex', flexDirection: 'column', overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
                  <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(212,165,116,0.05)' }}>
                    <h3 className="heading" style={{ fontSize: '1rem', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981' }} />
                      Tactical Comms
                    </h3>
                  </div>
                  
                  <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }} className="custom-scrollbar">
                    {clanChat.length === 0 ? (
                      <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem', marginTop: '2rem' }}>Quiet in the base. Start the conversation.</p>
                    ) : clanChat.map((msg, i) => (
                      <div key={msg.id || i} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignSelf: msg.username === user?.username ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                        <div style={{ fontSize: '0.65rem', color: '#d4a574', fontWeight: 800, textTransform: 'uppercase', marginLeft: msg.username === user?.username ? 'auto' : '0' }}>{msg.username}</div>
                        <div style={{ background: msg.username === user?.username ? '#d4a574' : 'rgba(255,255,255,0.05)', color: msg.username === user?.username ? '#12080d' : 'white', padding: '0.75rem 1.25rem', borderRadius: '1rem', borderBottomRightRadius: msg.username === user?.username ? '2px' : '1rem', borderBottomLeftRadius: msg.username === user?.username ? '1rem' : '2px', fontSize: '0.875rem', fontWeight: 500 }}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  <form onSubmit={sendChatMessage} style={{ padding: '1.5rem', background: 'rgba(42,18,32,0.4)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '1rem' }}>
                    <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message..." style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', padding: '0.85rem 1.25rem', color: 'white', fontSize: '0.875rem' }} />
                    <button type="submit" style={{ background: '#d4a574', color: '#12080d', width: '48px', height: '48px', borderRadius: '1rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon icon="lucide:send" style={{ fontSize: '1.25rem' }} />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Leaderboard ── */}
        {activeTab === 'leaderboard' && !loading && (
          <div style={{ background: 'rgba(42,18,32,0.2)', borderRadius: '3rem', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 150px 150px', padding: '1.5rem 2.5rem', background: 'rgba(42,18,32,0.6)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              {['Rank', 'Alliance', 'Level', 'Total XP'].map(h => (
                <span key={h} style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)' }}>{h}</span>
              ))}
            </div>
            {clans.map((clan, i) => (
              <div key={clan.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 150px 150px', padding: '1.5rem 2.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'center', background: myClan?.id === clan.id ? 'rgba(212,165,116,0.05)' : 'transparent' }}>
                <span className="heading" style={{ fontSize: '1.5rem', color: i < 3 ? '#d4a574' : 'white' }}>#{i + 1}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', background: 'rgba(212,165,116,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🛡️</div>
                  <span style={{ fontWeight: 800, fontSize: '1rem' }}>{clan.name}</span>
                </div>
                <span style={{ fontWeight: 900, color: '#d4a574', fontSize: '0.75rem' }}>LEVEL {clan.level}</span>
                <span style={{ fontWeight: 700, color: 'white', fontSize: '0.875rem' }}>{clan.total_xp.toLocaleString()} XP</span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(10,4,14,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} style={{ background: '#1a0d18', border: '1px solid rgba(212,165,116,0.3)', borderRadius: '2rem', padding: '2.5rem', width: '100%', maxWidth: '420px', position: 'relative' }} onClick={e => e.stopPropagation()}>
             <button onClick={() => setShowCreate(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
             <h2 className="heading" style={{ fontSize: '1.75rem', textTransform: 'uppercase', marginBottom: '2rem', textAlign: 'center' }}>Found an <span style={{ color: '#d4a574'}}>Alliance</span></h2>
             
             <div style={{ marginBottom: '1.5rem' }}>
               <label style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem', display: 'block', letterSpacing: '0.1em' }}>Alliance Name</label>
               <input required value={createForm.name} onChange={e => setCreateForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Shadow Vanguard" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', padding: '1rem', color: 'white', boxSizing: 'border-box', outline: 'none' }} />
             </div>
             <div style={{ marginBottom: '2rem' }}>
               <label style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem', display: 'block', letterSpacing: '0.1em' }}>Tactical Mission (Bio)</label>
               <textarea value={createForm.description} onChange={e => setCreateForm(f => ({...f, description: e.target.value}))} placeholder="What is your alliance about?" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', padding: '1rem', color: 'white', minHeight: '100px', boxSizing: 'border-box', outline: 'none', resize: 'none' }} />
             </div>
             
             <button type="submit" style={{ width: '100%', padding: '1.125rem', borderRadius: '1.25rem', background: '#d4a574', border: 'none', color: '#12080d', fontWeight: 900, fontSize: '0.875rem', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 10px 30px rgba(212,165,116,0.3)' }}>Initialize Alliance</button>
          </form>
        </div>
      )}

      <style>{`
        .md-flex-row { flex-direction: column; }
        @media (min-width: 768px) {
          .md-flex-row { flex-direction: row; }
          .md-justify-between { justify-content: space-between; }
          .md-align-center { align-items: center; }
          .lg-grid-layout { grid-template-columns: 7fr 5fr !important; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212,165,116,0.3); borderRadius: 10px; }
        .clan-card:hover { transform: translateY(-8px); border-color: rgba(212,165,116,0.3) !important; }
      `}</style>
    </div>
  )
}
