import { useState } from 'react'
import { Icon } from '@iconify/react'
import DashboardNav from './DashboardNav'
import DashboardMascot from './DashboardMascot'
import FloatingParticles from './FloatingParticles'

const CLAN_MEMBERS = [
  { id: 1, name: 'Aiden Storm', role: 'Leader', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aiden', status: 'online' },
  { id: 2, name: 'Marcus Vance', role: 'Elder', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus', status: 'online' },
  { id: 3, name: 'Sarah Zen', role: 'Veteran', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', status: 'offline' },
]

const MESSAGES = [
  { id: 1, text: "Who's up for a tag-team duel later? Need to hit my daily cap.", sender: 'FELIX W.', time: '14:20', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', isMe: false, color: '#e89b7b' },
  { id: 2, text: "I'm down! Just finished my 100 reps session. Give me 10 mins.", sender: 'YOU', time: '14:22', avatar: '', isMe: true, color: '#d4a574' },
  { id: 3, text: "Great job guys. We are currently #2 in the weekly clan race. Keep pushing! 🔥", sender: 'LILA T.', time: '14:25', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lila', isMe: false, color: '#34d399' },
]

const CLANS_LIST = [
  { id: 1, rank: 1, name: 'Imperial Guard', subtitle: 'Regional Champions', members: '50/50', xp: '1.2M', tier: '+150 XP Bonus', isYours: false, badgeClass: 'rank-badge-gold', icon: 'mdi:shield-outline', color: '#10b981' },
  { id: 2, rank: 2, name: 'Zenith Elite', subtitle: 'Your Clan', members: '48/50', xp: '984K', tier: '+120 XP Bonus', isYours: true, badgeClass: 'rank-badge-silver', icon: 'mdi:shield-check', color: '#ffffff' },
  { id: 3, rank: 3, name: 'Shadow Clan', subtitle: 'Rising Fast', members: '42/50', xp: '742K', tier: '+95 XP Bonus', isYours: false, badgeClass: 'rank-badge-bronze', icon: 'mdi:shield-cross', color: '#ef4444' },
]

export default function ClanPage() {
  const [activeTab, setActiveTab] = useState('my-clan')

  return (
    <div style={{ minHeight: '100vh', background: '#12080d', color: 'white', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <FloatingParticles />
      <DashboardNav />

      <main style={{ flex: 1, padding: '2rem', maxWidth: '1280px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative', zIndex: 10 }}>
        
        {/* Header & Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="md-flex-row md-justify-between md-align-end">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Icon icon="mdi:shield-cross" style={{ color: '#d4a574', fontSize: '1.875rem' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#d4a574' }}>Battlegrounds</span>
            </div>
            <h1 className="heading" style={{ fontSize: 'clamp(3rem, 5vw, 3.75rem)', letterSpacing: '-0.04em', textTransform: 'uppercase', lineHeight: 1 }}>
              Clan <span style={{ color: '#d4a574' }}>Headquarters</span>
            </h1>
          </div>
          
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={() => setActiveTab('my-clan')} style={{ padding: '0.75rem 2rem', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', transition: 'all 0.2s', border: 'none', cursor: 'pointer', background: activeTab === 'my-clan' ? '#d4a574' : 'transparent', color: activeTab === 'my-clan' ? '#12080d' : 'rgba(255,255,255,0.4)' }}>
              My Clan
            </button>
            <button onClick={() => setActiveTab('leaderboard')} style={{ padding: '0.75rem 2rem', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', transition: 'all 0.2s', border: 'none', cursor: 'pointer', background: activeTab === 'leaderboard' ? '#d4a574' : 'transparent', color: activeTab === 'leaderboard' ? '#12080d' : 'rgba(255,255,255,0.4)' }}>
              Discover Clans
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'my-clan' && (
          <section className="grid-lg-12" style={{ display: 'grid', gap: '2rem' }}>
            {/* Left Sidebar */}
            <aside className="col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ background: '#2a1220', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2.5rem', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-2.5rem', right: '-2.5rem', width: '10rem', height: '10rem', background: 'rgba(212,165,116,0.05)', borderRadius: '50%', filter: 'blur(30px)' }} />
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ width: '5rem', height: '5rem', background: 'linear-gradient(to bottom right, #d4a574, #e89b7b)', borderRadius: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(212,165,116,0.2)' }}>
                    <Icon icon="mdi:shield-star" style={{ fontSize: '2.5rem', color: '#12080d' }} />
                  </div>
                  <div>
                    <h2 className="heading" style={{ fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0 }}>Zenith Elite</h2>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>EST. AUG 2023</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.5625rem', fontWeight: 900, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em', display: 'block', marginBottom: '0.25rem' }}>Clan Level</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="heading" style={{ fontSize: '1.25rem', margin: 0 }}>LVL 24</span>
                      <Icon icon="mdi:chevron-double-up" style={{ color: '#34d399' }} />
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.5625rem', fontWeight: 900, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em', display: 'block', marginBottom: '0.25rem' }}>World Rank</span>
                    <span className="heading" style={{ fontSize: '1.25rem', margin: 0 }}>#42</span>
                  </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', color: '#d4a574' }}>Next Reward Progress</span>
                    <span style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>85%</span>
                  </div>
                  <div style={{ width: '100%', height: '0.375rem', background: 'rgba(255,255,255,0.05)', borderRadius: '9999px' }}>
                    <div style={{ height: '100%', background: '#d4a574', width: '85%', borderRadius: '9999px', boxShadow: '0 0 10px rgba(212,165,116,0.3)' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <h3 style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem' }}>Clan Roster (48/50)</h3>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.5rem' }} className="custom-scrollbar">
                    {CLAN_MEMBERS.map(m => (
                      <div key={m.id} className="roster-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.2s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ position: 'relative' }}>
                            <img src={m.avatar} alt={m.name} style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem' }} />
                            {m.status === 'online' && <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '0.75rem', height: '0.75rem', background: '#10b981', border: '2px solid #2a1220', borderRadius: '50%' }} />}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{m.name}</span>
                            <span style={{ fontSize: '0.5rem', fontWeight: 900, textTransform: 'uppercase', color: m.role === 'Leader' ? '#d4a574' : 'rgba(255,255,255,0.3)' }}>{m.role}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Right Side: Live Chat */}
            <div className="col-span-8" style={{ display: 'flex', flexDirection: 'column', background: '#2a1220', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2.5rem', overflow: 'hidden', minHeight: '600px' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ display: 'flex', marginLeft: '0.5rem' }}>
                    {CLAN_MEMBERS.map((m, i) => (
                      <img key={m.id} src={m.avatar} style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: '2px solid #2a1220', marginLeft: '-0.5rem', zIndex: 10 - i }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Clan Live Chat</span>
                    <span style={{ fontSize: '0.625rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span className="animate-pulse" style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%' }} />
                      12 Members Online
                    </span>
                  </div>
                </div>
                <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color='white'} onMouseOut={e => e.currentTarget.style.color='rgba(255,255,255,0.4)'}>
                  <Icon icon="mdi:cog-outline" style={{ fontSize: '1.25rem' }} />
                </button>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="custom-scrollbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.05)' }} />
                  <span style={{ fontSize: '0.5625rem', fontWeight: 900, textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em' }}>Today</span>
                  <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.05)' }} />
                </div>

                {MESSAGES.map(msg => (
                  <div key={msg.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', maxWidth: '80%', alignSelf: msg.isMe ? 'flex-end' : 'flex-start', flexDirection: msg.isMe ? 'row-reverse' : 'row' }}>
                    {msg.isMe ? (
                      <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: '#d4a574', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon icon="mdi:account" style={{ fontSize: '1.5rem', color: '#12080d' }} />
                      </div>
                    ) : (
                      <img src={msg.avatar} alt="user" style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.05)' }} />
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: msg.isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexDirection: msg.isMe ? 'row-reverse' : 'row' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 900, color: msg.color }}>{msg.sender}</span>
                        <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.2)' }}>{msg.time}</span>
                      </div>
                      <div style={{ background: msg.isMe ? 'rgba(212,165,116,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${msg.isMe ? 'rgba(212,165,116,0.3)' : 'rgba(255,255,255,0.05)'}`, padding: '1rem', borderRadius: msg.isMe ? '1rem 0 1rem 1rem' : '0 1rem 1rem 1rem', fontSize: '0.875rem', color: msg.isMe ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.8)' }}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(18,8,13,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', padding: '0.5rem', paddingLeft: '1rem' }}>
                  <input type="text" placeholder="Type a message to your clan..." style={{ background: 'transparent', flex: 1, fontSize: '0.875rem', outline: 'none', border: 'none', color: 'white' }} />
                  <button style={{ width: '2.5rem', height: '2.5rem', background: '#d4a574', color: '#12080d', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform='scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform='scale(1)'}>
                    <Icon icon="mdi:send" style={{ fontSize: '1.25rem' }} />
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Discover Content */}
        {activeTab === 'leaderboard' && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }} className="md-grid-12">
              <div className="md-col-8" style={{ position: 'relative' }}>
                <Icon icon="mdi:magnify" style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.25rem', color: 'rgba(255,255,255,0.3)' }} />
                <input type="text" placeholder="Search for clans by name or tag..." style={{ width: '100%', background: '#2a1220', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.5rem', padding: '1.5rem 2rem 1.5rem 4rem', fontSize: '0.875rem', outline: 'none', transition: 'border-color 0.2s', color: 'white', boxSizing: 'border-box' }} onFocus={e => e.currentTarget.style.borderColor='#d4a574'} onBlur={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'} />
              </div>
              <div className="md-col-4" style={{ display: 'flex', gap: '1rem' }}>
                <button style={{ flex: 1, background: '#2a1220', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'white', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'} onMouseOut={e => e.currentTarget.style.background='#2a1220'}>
                  <Icon icon="mdi:filter-variant" style={{ fontSize: '1.125rem' }} /> Region
                </button>
                <button style={{ flex: 1, background: '#2a1220', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'white', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'} onMouseOut={e => e.currentTarget.style.background='#2a1220'}>
                  <Icon icon="mdi:sort-ascending" style={{ fontSize: '1.125rem' }} /> Rank
                </button>
              </div>
            </div>

            <div style={{ background: 'rgba(42,18,32,0.2)', borderRadius: '2.5rem', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', backdropFilter: 'blur(4px)' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'rgba(42,18,32,0.6)' }}>
                  <tr style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '1.5rem 2rem' }}>Rank</th>
                    <th style={{ padding: '1.5rem 2rem' }}>Clan Name</th>
                    <th style={{ padding: '1.5rem 2rem' }}>Tier Reward</th>
                    <th style={{ padding: '1.5rem 2rem' }}>Members</th>
                    <th style={{ padding: '1.5rem 2rem', textAlign: 'right' }}>Clan XP</th>
                  </tr>
                </thead>
                <tbody>
                  {CLANS_LIST.map((clan, i) => (
                    <tr key={clan.id} style={{ borderBottom: i < CLANS_LIST.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', transition: 'background 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'} onMouseOut={e => e.currentTarget.style.background='transparent'}>
                      <td style={{ padding: '1.5rem 2rem' }}>
                        <div className={clan.badgeClass} style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 'bold', color: clan.rank === 1 ? '#12080d' : 'white', background: clan.rank === 1 ? 'linear-gradient(45deg, #ffd700, #d4a574)' : clan.rank === 2 ? 'rgba(226,226,226,0.2)' : 'rgba(205,127,50,0.2)' }}>
                          {clan.rank}
                        </div>
                      </td>
                      <td style={{ padding: '1.5rem 2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '3rem', height: '3rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                            <Icon icon={clan.icon} style={{ fontSize: '1.5rem', color: clan.isYours ? 'rgba(255,255,255,0.4)' : clan.color }} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 900, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>{clan.name}</span>
                            <span style={{ fontSize: '0.625rem', color: clan.isYours ? 'rgba(255,255,255,0.2)' : clan.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>{clan.subtitle}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1.5rem 2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '2rem', height: '2rem', background: clan.isYours ? 'rgba(255,255,255,0.1)' : `${clan.color}33`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon icon="mdi:diamond-stone" style={{ color: clan.isYours ? '#d4a574' : clan.color }} />
                          </div>
                          <span style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', color: clan.isYours ? 'rgba(255,255,255,0.4)' : clan.color }}>{clan.tier}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1.5rem 2rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, opacity: 0.6 }}>{clan.members}</span>
                      </td>
                      <td style={{ padding: '1.5rem 2rem', textAlign: 'right' }}>
                        <span className="heading" style={{ fontSize: '1.5rem', color: clan.isYours ? 'white' : '#d4a574' }}>{clan.xp}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
              <button style={{ padding: '1rem 2.5rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', background: 'transparent', cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color='white'} onMouseOut={e => e.currentTarget.style.color='rgba(255,255,255,0.4)'}>
                Load More Clans
              </button>
            </div>
          </section>
        )}
      </main>

      <DashboardMascot variant="clan" />

      <style>{`
        .md-flex-row { flex-direction: column; }
        .grid-lg-12 { grid-template-columns: 1fr; }
        .md-grid-12 { grid-template-columns: 1fr; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d4a574; border-radius: 10px; }
        .roster-item:hover { background: rgba(255,255,255,0.1) !important; }
        
        @media (min-width: 768px) {
          .md-flex-row { flex-direction: row; }
          .md-justify-between { justify-content: space-between; }
          .md-align-end { align-items: flex-end; }
          .md-grid-12 { grid-template-columns: repeat(12, minmax(0, 1fr)); }
          .md-col-8 { grid-column: span 8 / span 8; }
          .md-col-4 { grid-column: span 4 / span 4; }
        }
        @media (min-width: 1024px) {
          .grid-lg-12 { grid-template-columns: repeat(12, minmax(0, 1fr)); }
          .col-span-4 { grid-column: span 4 / span 4; }
          .col-span-8 { grid-column: span 8 / span 8; }
        }
      `}</style>
    </div>
  )
}
