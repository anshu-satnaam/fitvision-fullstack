import { useState, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import DashboardNav from './DashboardNav'
import DashboardMascot from './DashboardMascot'
import FloatingParticles from './FloatingParticles'

const CHALLENGE_MODES = [
  { icon: 'lucide:zap',          label: 'Rep Sprint',   desc: 'First to reach 50 reps wins the round.',      xp: '+250 XP' },
  { icon: 'lucide:timer',        label: 'Endurance',    desc: 'Hold your posture longer than your rival.',   xp: '+400 XP' },
  { icon: 'lucide:shield-check', label: 'Form Master',  desc: 'Maintain >90% accuracy for 2 minutes.',      xp: '+500 XP' },
  { icon: 'lucide:gem',          label: 'Calorie Burn', desc: 'Burn 50 cals faster than your opponent.',     xp: '+300 XP' },
]

const DUEL_MESSAGES = [
  "Beat them!", "Go harder!", "You're stronger!", "Dominate!",
  "Show them power!", "Victory awaits!", "Crush it!", "You got this!",
]

export default function DuelPage() {
  const [reps, setReps] = useState(24)
  const [repFlash, setRepFlash] = useState(false)
  const [feedItems, setFeedItems] = useState([
    { id: 1, type: 'us',     text: 'SETV performed 5 squats!',     sub: 'Just now' },
    { id: 2, type: 'system', text: 'Waiting for opponent activity...', sub: 'System' },
  ])
  const cardRefs = useRef([])
  const feedRef = useRef(null)
  const nextId = useRef(3)

  // Simulate rep increments + feed updates
  useEffect(() => {
    const iv = setInterval(() => {
      if (Math.random() > 0.8) {
        setReps(r => {
          const next = r + 1
          setRepFlash(true)
          setTimeout(() => setRepFlash(false), 300)
          // Feed entry
          setFeedItems(prev => {
            const entry = { id: nextId.current++, type: 'us', text: `SETV performed 1 squat!`, sub: 'Just now' }
            const updated = [entry, ...prev].slice(0, 10)
            return updated
          })
          return next
        })
      }
    }, 3000)
    return () => clearInterval(iv)
  }, [])

  // Scroll feed to top when new items added
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = 0
  }, [feedItems])

  // 3-D parallax
  useEffect(() => {
    const handle = (e) => {
      const x = (e.clientX / window.innerWidth  - 0.5) * 2
      const y = (e.clientY / window.innerHeight - 0.5) * 2
      cardRefs.current.forEach(c => {
        if (c) c.style.transform = `rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateZ(15px)`
      })
    }
    document.addEventListener('mousemove', handle)
    return () => document.removeEventListener('mousemove', handle)
  }, [])

  const addCardRef = (el) => { if (el && !cardRefs.current.includes(el)) cardRefs.current.push(el) }

  return (
    <div style={{ minHeight: '100vh', background: '#12080d', color: 'white', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <FloatingParticles />
      <DashboardNav />

      <main style={{ flex: 1, padding: '2.5rem', maxWidth: '1280px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

        {/* Header */}
        <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1.5rem' }}>
          <div>
            <h1 className="heading" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.04em', textTransform: 'uppercase', lineHeight: 1, marginBottom: '0.75rem' }}>
              Real-time <span style={{ color: '#d4a574' }}>Duel</span>{' '}
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '60%' }}>(1v1)</span>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                User ID: <span style={{ color: '#e89b7b' }}>2</span>
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16,185,129,0.1)', padding: '0.25rem 0.75rem', borderRadius: '9999px', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%' }} className="animate-pulse" />
                <span style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: '#34d399', letterSpacing: '0.1em' }}>Searching for Opponent</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button id="btn-find-opponent" style={{ background: '#d4a574', color: '#12080d', fontWeight: 900, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '1rem 2rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', boxShadow: '0 8px 20px rgba(212,165,116,0.25)', transition: 'background 0.2s' }}
              onMouseOver={e => e.currentTarget.style.background = '#e89b7b'}
              onMouseOut={e => e.currentTarget.style.background = '#d4a574'}
            >Find Opponent</button>
            <button id="btn-invite" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 900, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '1rem 2rem', borderRadius: '0.75rem', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >Invite Friend</button>
          </div>
        </header>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="duel-main-grid">

          {/* Left: Arena + Stats + Modes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Arena card */}
            <div ref={addCardRef} style={{
              background: 'rgba(42,18,32,0.3)',
              borderRadius: '3rem',
              border: '1px solid rgba(255,255,255,0.05)',
              padding: '2.5rem',
              backdropFilter: 'blur(10px)',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 0 50px rgba(212,165,116,0.08)',
              transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
              transformStyle: 'preserve-3d',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '2rem', alignItems: 'center' }}>
                {/* Your side */}
                <ArenaSide
                  name="Commander SETV"
                  subtitle="Active: Squats"
                  energy={84}
                  reps={reps}
                  repFlash={repFlash}
                  avatarSrc="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                  badge="YOU"
                  isOpponent={false}
                />

                {/* VS divider */}
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#12080d', border: '1px solid rgba(212,165,116,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(0,0,0,0.5)', flexShrink: 0 }}>
                  <span className="heading" style={{ fontSize: '1.5rem', color: '#d4a574' }}>VS</span>
                </div>

                {/* Opponent side */}
                <ArenaSide
                  name="Searching..."
                  subtitle="Opponent Slot"
                  energy={0}
                  reps={0}
                  isOpponent={true}
                />
              </div>
            </div>

            {/* Stat mini-cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <MiniStatCard icon="lucide:flame"  label="Calories Burned" value="142" color="#e89b7b"  pct={65} barColor="#d4a574" />
              <MiniStatCard icon="lucide:target" label="Form Accuracy"   value="94%" color="#22d3ee" pct={94} barColor="#22d3ee" iconBg="rgba(6,182,212,0.1)" />
            </div>

            {/* Challenge modes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }} className="challenge-grid">
              {CHALLENGE_MODES.map(m => (
                <div
                  key={m.label}
                  ref={addCardRef}
                  style={{
                    background: 'rgba(61,26,45,0.4)',
                    borderRadius: '1.5rem',
                    padding: '1.25rem',
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.6rem',
                    cursor: 'pointer',
                    transition: 'transform 0.6s cubic-bezier(0.23,1,0.32,1), border-color 0.2s',
                    transformStyle: 'preserve-3d',
                  }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(212,165,116,0.4)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
                >
                  <Icon icon={m.icon} style={{ color: '#d4a574', fontSize: '22px' }} />
                  <h5 className="heading" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{m.label}</h5>
                  <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{m.desc}</p>
                  <span style={{ background: 'rgba(212,165,116,0.1)', color: '#d4a574', fontSize: '0.6rem', fontWeight: 900, padding: '0.2rem 0.6rem', borderRadius: '9999px', letterSpacing: '0.05em' }}>{m.xp}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Battle Feed + Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Battle Feed */}
            <div style={{
              background: 'rgba(42,18,32,0.4)',
              borderRadius: '3rem',
              border: '1px solid rgba(255,255,255,0.05)',
              padding: '2rem',
              backdropFilter: 'blur(10px)',
              display: 'flex', flexDirection: 'column',
              height: '380px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', background: 'rgba(212,165,116,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon icon="lucide:swords" style={{ color: '#d4a574', fontSize: '20px' }} />
                  </div>
                  <h3 className="heading" style={{ fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Battle Feed</h3>
                </div>
                <div style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }} className="animate-pulse" />
              </div>

              <div ref={feedRef} className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.5rem' }}>
                {feedItems.map((item, idx) => (
                  <div key={item.id} style={{
                    display: 'flex', gap: '0.75rem', padding: '0.75rem',
                    background: item.type === 'us' ? 'rgba(255,255,255,0.04)' : 'rgba(212,165,116,0.06)',
                    borderRadius: '1rem',
                    border: `1px solid ${item.type === 'us' ? 'rgba(255,255,255,0.05)' : 'rgba(212,165,116,0.15)'}`,
                    animation: idx === 0 ? 'slideInFeed 0.35s ease-out forwards' : 'none',
                  }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: item.type === 'us' ? '#d4a574' : 'rgba(255,255,255,0.08)', fontSize: '0.6rem', fontWeight: 900, color: item.type === 'us' ? '#12080d' : 'rgba(255,255,255,0.4)' }}>
                      {item.type === 'us' ? 'US' : '?'}
                    </div>
                    <div>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'white' }}>
                        {item.type === 'us' && <span style={{ color: '#e89b7b' }}>SETV </span>}
                        {item.type === 'us' ? item.text.replace('SETV ', '') : item.text}
                      </p>
                      <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', marginTop: '2px' }}>{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Session Actions */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(42,18,32,0.4) 0%, rgba(61,26,45,0.4) 100%)',
              borderRadius: '3rem',
              border: '1px solid rgba(255,255,255,0.05)',
              padding: '2rem',
              backdropFilter: 'blur(10px)',
              position: 'relative', overflow: 'hidden',
              display: 'flex', flexDirection: 'column', gap: '1.5rem',
            }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: 'rgba(212,165,116,0.04)', borderRadius: '50%', transform: 'translate(40%, -40%)' }} />
              <h3 className="heading" style={{ fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Session Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <ActionBtn label="Start Challenge" icon="lucide:check-circle" primary />
                <ActionBtn label="View Opponent Stats" />
                <ActionBtn label="Surrender" danger />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Wave */}
      <div className="wave-bg" style={{ opacity: 0.15, zIndex: 0 }}>
        <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#d4a574" />
        </svg>
      </div>

      <DashboardMascot variant="duel" />

      <style>{`
        @keyframes slideInFeed {
          from { transform: translateX(16px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @media (min-width: 1024px) {
          .duel-main-grid    { grid-template-columns: 8fr 4fr !important; }
          .challenge-grid    { grid-template-columns: repeat(4,1fr) !important; }
        }
      `}</style>
    </div>
  )
}

function ArenaSide({ name, subtitle, energy, reps, repFlash, avatarSrc, badge, isOpponent }) {
  const dim = isOpponent ? 'rgba(255,255,255,0.15)' : undefined
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', opacity: isOpponent ? 0.4 : 1 }}>
      {/* Avatar */}
      <div style={{ position: 'relative' }}>
        <div style={{ width: '112px', height: '112px', borderRadius: '50%', border: `4px solid ${isOpponent ? 'rgba(255,255,255,0.1)' : '#d4a574'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: isOpponent ? 'rgba(255,255,255,0.05)' : 'rgba(212,165,116,0.1)', boxShadow: isOpponent ? 'none' : '0 0 30px rgba(212,165,116,0.3)' }}>
          {avatarSrc
            ? <img src={avatarSrc} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <Icon icon="lucide:user" style={{ color: 'rgba(255,255,255,0.2)', fontSize: '48px' }} />
          }
          {isOpponent && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: '50%' }}>
              <Icon icon="lucide:loader-2" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '28px', animation: 'spin 1s linear infinite' }} />
            </div>
          )}
        </div>
        {badge && (
          <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: '#d4a574', color: '#12080d', padding: '2px 10px', borderRadius: '0.5rem', fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase' }}>{badge}</div>
        )}
      </div>

      {/* Name */}
      <div style={{ textAlign: 'center' }}>
        <h3 className="heading" style={{ fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '-0.03em', color: isOpponent ? 'rgba(255,255,255,0.4)' : 'white' }}>{name}</h3>
        <p style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: isOpponent ? 'rgba(255,255,255,0.2)' : '#d4a574', marginTop: '0.25rem' }}>{subtitle}</p>
      </div>

      {/* Energy bar */}
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: isOpponent ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.4)' }}>Energy Pool</span>
          <span style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: isOpponent ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.4)' }}>{isOpponent ? '--%' : `${energy}%`}</span>
        </div>
        <div style={{ height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '9999px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
          {!isOpponent && (
            <div style={{ width: `${energy}%`, height: '100%', background: 'linear-gradient(90deg, #d4a574, #e89b7b)', borderRadius: '9999px', transition: 'width 0.8s cubic-bezier(0.65,0,0.35,1)' }} />
          )}
        </div>
      </div>

      {/* Rep counter */}
      <div style={{ background: isOpponent ? 'rgba(18,8,13,0.3)' : 'rgba(18,8,13,0.5)', borderRadius: '1.25rem', padding: '1.25rem 2rem', width: '100%', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: isOpponent ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '0.25rem' }}>Current Reps</span>
        <span className="heading" style={{
          fontSize: '3.5rem',
          color: isOpponent ? 'rgba(255,255,255,0.1)' : (repFlash ? '#d4a574' : 'white'),
          transform: repFlash ? 'scale(1.15)' : 'scale(1)',
          display: 'inline-block',
          transition: 'color 0.2s, transform 0.2s',
        }}>{reps}</span>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function MiniStatCard({ icon, label, value, color, pct, barColor, iconBg = 'rgba(212,165,116,0.1)' }) {
  return (
    <div style={{ background: 'rgba(42,18,32,0.2)', borderRadius: '2rem', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', cursor: 'pointer', transition: 'background 0.2s' }}
      onMouseOver={e => e.currentTarget.style.background = 'rgba(42,18,32,0.3)'}
      onMouseOut={e => e.currentTarget.style.background = 'rgba(42,18,32,0.2)'}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', background: iconBg, borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon icon={icon} style={{ color, fontSize: '20px' }} />
          </div>
          <h4 className="heading" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</h4>
        </div>
        <span style={{ fontWeight: 900, fontSize: '1.25rem', color }}>{value}</span>
      </div>
      <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '9999px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: '9999px' }} />
      </div>
    </div>
  )
}

function ActionBtn({ label, icon, primary, danger }) {
  const base = {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
    fontWeight: 900, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em',
    padding: '1rem', borderRadius: '0.75rem', cursor: 'pointer', border: 'none', transition: 'all 0.2s',
  }
  const style = primary
    ? { ...base, background: '#d4a574', color: '#12080d', boxShadow: '0 8px 20px rgba(212,165,116,0.2)' }
    : danger
      ? { ...base, background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }
      : { ...base, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }

  return (
    <button style={style}
      onMouseOver={e => {
        if (primary)       e.currentTarget.style.background = '#e89b7b'
        else if (danger)   { e.currentTarget.style.background = 'rgb(239,68,68)'; e.currentTarget.style.color = 'white' }
        else               e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
      }}
      onMouseOut={e => Object.assign(e.currentTarget.style, style)}
    >
      {icon && <Icon icon={icon} style={{ fontSize: '18px' }} />}
      {label}
    </button>
  )
}
