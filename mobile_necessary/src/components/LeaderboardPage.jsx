import { useState, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import DashboardNav from './DashboardNav'
import DashboardMascot from './DashboardMascot'
import FloatingParticles from './FloatingParticles'
import { socialAPI } from '../api'
import { useAuth } from '../AuthContext'

const PODIUM = [
  {
    rank: 2, name: 'Felix Wright', seed: 'Felix', tier: 'Silver Tier',
    tierIcon: 'lucide:award', tierColor: '#C0C0C0', reps: '1,482',
    height: 320, borderColor: '#C0C0C0', glowColor: 'rgba(192,192,192,0.25)',
  },
  {
    rank: 1, name: 'Aiden Storm', seed: 'Aiden', tier: 'Grandmaster',
    tierIcon: 'lucide:star', tierColor: '#d4a574', reps: '2,104',
    height: 380, borderColor: '#d4a574', glowColor: 'rgba(212,165,116,0.3)',
    champion: true,
  },
  {
    rank: 3, name: 'Sarah Zen', seed: 'Sarah', tier: 'Bronze Tier',
    tierIcon: 'lucide:medal', tierColor: '#CD7F32', reps: '1,240',
    height: 280, borderColor: '#CD7F32', glowColor: 'rgba(205,127,50,0.2)',
  },
]

const TABLE_ROWS = [
  { rank: 4,  name: 'Marcus Vance', seed: 'Marcus', tier: 'Elite I',     tierIcon: 'lucide:shield-check', tierColor: '#d4a574', reps: 1150, trend: 'up',   trendLabel: 'Up 2 places' },
  { rank: 5,  name: 'Lila Thorne',  seed: 'Lila',   tier: 'Elite I',     tierIcon: 'lucide:shield-check', tierColor: '#d4a574', reps: 1092, trend: null,  trendLabel: 'Stable position' },
  { rank: 6,  name: 'Kael Nova',    seed: 'Kael',   tier: 'Veteran IV',  tierIcon: 'lucide:shield',       tierColor: 'rgba(255,255,255,0.4)', reps: 985, trend: 'down', trendLabel: 'Down 1 place' },
  { rank: 7,  name: 'YOU (FitVision)', seed: 'You', tier: 'Veteran III', tierIcon: 'lucide:zap',          tierColor: '#d4a574', reps: 842, isYou: true },
]

const ACHIEVEMENTS_UNLOCKED = [
  { icon: 'mdi:dumbbell', title: 'Iron Will: 1000+ Reps' },
  { icon: 'mdi:fire',     title: 'On Fire: 7+ Day Streak' },
  { icon: 'mdi:star-plus',title: 'Rising Star: Jumped 5+ ranks' },
]
const ACHIEVEMENTS_LOCKED = [
  { icon: 'mdi:trophy-variant' },
  { icon: 'mdi:flash' },
  { icon: 'mdi:target' },
]

const FILTERS = ['Week', 'Month', 'All Time']

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [activeFilter, setActiveFilter] = useState('Week')
  const [liveBoard, setLiveBoard] = useState(null)  // null = loading
  const [myRankData, setMyRankData] = useState(null)
  const cardRefs = useRef([])

  // Fetch real leaderboard on mount
  useEffect(() => {
    socialAPI.leaderboard(1, 20)
      .then(data => {
        const formatted = data.map((d, i) => {
          const r = i + 1;
          const champion = r === 1;
          return {
            rank: r,
            name: d.username,
            avatar_url: d.avatar_url,
            tier: r === 1 ? 'Grandmaster' : r <= 3 ? 'Elite' : 'Veteran',
            tierIcon: r === 1 ? 'lucide:star' : 'lucide:shield',
            tierColor: r === 1 ? '#d4a574' : '#C0C0C0',
            reps: d.points.toLocaleString(),
            isYou: user && d.username === user.username,
            champion,
            height: champion ? 380 : r === 2 ? 320 : r === 3 ? 280 : undefined,
            borderColor: champion ? '#d4a574' : '#C0C0C0',
            glowColor: champion ? 'rgba(212,165,116,0.3)' : 'rgba(192,192,192,0.25)',
          }
        })
        setLiveBoard(formatted)
      })
      .catch(() => setLiveBoard([]))

    if (user) {
      socialAPI.myRank().then(data => setMyRankData(data)).catch(console.error)
    }
  }, [user])

  // Derived: use live data when available, fall back to static mock
  const boardData = liveBoard && liveBoard.length > 0 ? liveBoard : null
  const currentPodium = boardData ? boardData.slice(0, 3) : PODIUM
  const currentTableRows = boardData ? boardData.slice(3, 10) : TABLE_ROWS

  useEffect(() => {
    const handle = (e) => {
      const x = (e.clientX / window.innerWidth  - 0.5) * 2
      const y = (e.clientY / window.innerHeight - 0.5) * 2
      cardRefs.current.forEach(c => {
        if (c) c.style.transform = `rotateY(${x * 4}deg) rotateX(${-y * 4}deg) translateZ(10px)`
      })
    }
    document.addEventListener('mousemove', handle)
    return () => document.removeEventListener('mousemove', handle)
  }, [])

  const addRef = (el) => { if (el && !cardRefs.current.includes(el)) cardRefs.current.push(el) }

  return (
    <div style={{ minHeight: '100vh', background: '#12080d', color: 'white', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <FloatingParticles />
      <DashboardNav />

      <main style={{ flex: 1, padding: 'clamp(1rem, 4vw, 2.5rem)', maxWidth: '1280px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* ── Header ── */}
        <header style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <h1 className="heading" style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', letterSpacing: '-0.04em', textTransform: 'uppercase', lineHeight: 1 }}>
              Global <span style={{ color: '#d4a574' }}>Leaderboard</span>
            </h1>

            {/* Filter tabs */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.1)' }}>
              {FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  style={{
                    padding: '0.5rem 1.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.6rem',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: activeFilter === f ? '#d4a574' : 'transparent',
                    color: activeFilter === f ? '#12080d' : 'rgba(255,255,255,0.4)',
                    boxShadow: activeFilter === f ? '0 4px 14px rgba(212,165,116,0.3)' : 'none',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <Icon icon="lucide:trophy" style={{ color: '#d4a574', fontSize: '20px' }} />
            <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)' }}>
              The top performers across the globe. Push your limits to rank up.
            </span>
          </div>
        </header>

        {/* ── Podium (top 3) ── */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'clamp(0.5rem, 2vw, 2rem)', alignItems: 'flex-end', marginBottom: '1rem' }} className="podium-grid">
          {currentPodium.map((p) => (
            <PodiumCard key={p.rank} p={p} cardRef={addRef} />
          ))}
        </section>

        {/* ── Main grid: Table + Sidebar ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem' }} className="lb-main-grid">

          {/* Table */}
          <div style={{ background: 'rgba(42,18,32,0.2)', borderRadius: '2.5rem', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', backdropFilter: 'blur(10px)' }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 100px', padding: '1rem 1.5rem', background: 'rgba(42,18,32,0.6)', borderBottom: '1px solid rgba(255,255,255,0.08)' }} className="table-header-grid">
              {['Rank', 'Elite User', 'Total Reps'].map((h, i) => (
                <span key={h} style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)', textAlign: i === 2 ? 'right' : 'left' }}>{h}</span>
              ))}
            </div>

            {/* Rows */}
            {currentTableRows.map((row) => (
              <TableRow key={row.rank} row={row} />
            ))}
          </div>

          {/* Sidebar */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Your Rank card */}
            <div style={{ background: '#2a1220', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2.5rem', padding: '2rem', boxShadow: '0 40px 80px rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h3 className="heading" style={{ fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '-0.03em' }}>Your Rank</h3>
                <div style={{ background: 'rgba(212,165,116,0.1)', padding: '0.25rem 0.85rem', borderRadius: '9999px', border: '1px solid rgba(212,165,116,0.2)' }}>
                  <span style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: '#d4a574', letterSpacing: '0.1em' }}>Top 4%</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span className="heading" style={{ fontSize: '4.5rem', lineHeight: 1, color: 'white' }}>#{myRankData?.rank || '--'}</span>
                <span style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: '#d4a574', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>Global</span>
              </div>
              <p style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}>Level {myRankData?.level || 1} Elite</p>

              {/* Progress to next rank */}
              <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)' }}>Total Points</span>
                <span style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#d4a574' }}>{myRankData?.points?.toLocaleString() || 0} PTS</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '2rem' }}>
                <div style={{ width: '100%', height: '100%', background: '#d4a574', borderRadius: '9999px', boxShadow: '0 0 10px rgba(212,165,116,0.4)' }} />
              </div>

              {/* Mini stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[{ label: 'Current Streak', value: `${myRankData?.streak || 0} Days` }, { label: 'Form Score', value: '94.2%' }].map(s => (
                  <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', padding: '1rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: '0.35rem' }}>{s.label}</span>
                    <span className="heading" style={{ fontSize: '1.25rem', textTransform: 'uppercase' }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div style={{ background: 'rgba(42,18,32,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2.5rem', padding: '2rem', backdropFilter: 'blur(10px)' }}>
              <h3 className="heading" style={{ fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>Top Achievements</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                {ACHIEVEMENTS_UNLOCKED.map(a => (
                  <div key={a.icon} title={a.title} style={{ aspectRatio: '1', background: 'rgba(212,165,116,0.1)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'help', transition: 'transform 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <Icon icon={a.icon} style={{ color: '#d4a574', fontSize: '28px' }} />
                  </div>
                ))}
                {ACHIEVEMENTS_LOCKED.map(a => (
                  <div key={a.icon} style={{ aspectRatio: '1', background: 'rgba(255,255,255,0.04)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3, filter: 'grayscale(1)' }}>
                    <Icon icon={a.icon} style={{ color: 'white', fontSize: '28px' }} />
                  </div>
                ))}
              </div>
              <button style={{ width: '100%', marginTop: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)', transition: 'color 0.2s' }}
                onMouseOver={e => e.currentTarget.style.color = '#d4a574'}
                onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
              >
                View All 42 Badges
              </button>
            </div>
          </aside>
        </div>
      </main>

      {/* Wave */}
      <div className="wave-bg" style={{ opacity: 0.15, zIndex: 0 }}>
        <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#d4a574" />
        </svg>
      </div>

      <DashboardMascot variant="leaderboard" />

      <style>{`
        @media (min-width: 1024px) {
          .lb-main-grid  { grid-template-columns: 8fr 4fr !important; }
        }
        @media (max-width: 640px) {
          .podium-grid { grid-template-columns: 1fr !important; }
          .table-header-grid { display: none !important; }
        }
      `}</style>
    </div>
  )
}

/* ── Podium Card ── */
function PodiumCard({ p, cardRef }) {
  const order = p.rank === 1 ? 2 : p.rank === 2 ? 1 : 3

  return (
    <div style={{ order, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <div
        ref={cardRef}
        style={{
          width: '100%',
          background: p.champion ? 'rgba(42,18,32,0.6)' : 'rgba(42,18,32,0.4)',
          border: `${p.champion ? '2px' : '1px'} solid ${p.champion ? 'rgba(212,165,116,0.3)' : 'rgba(255,255,255,0.05)'}`,
          borderRadius: p.champion ? '3rem' : '2.5rem',
          padding: p.champion ? '2.5rem 2rem' : '1.75rem 1.5rem',
          display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
          backdropFilter: 'blur(10px)',
          position: 'relative',
          height: `clamp(${p.height * 0.7}px, 40vh, ${p.height}px)`,
          justifyContent: 'flex-end',
          paddingBottom: p.champion ? '3rem' : '2.5rem',
          boxShadow: p.champion ? `0 0 50px ${p.glowColor}` : 'none',
          transition: 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Crown for champion */}
        {p.champion && (
          <div style={{ position: 'absolute', top: '-3.5rem', fontSize: '3.5rem', animation: 'bounce 1s infinite' }}>
            <Icon icon="mdi:crown" style={{ color: '#d4a574' }} />
          </div>
        )}

        {/* Avatar */}
        <div style={{
          position: 'absolute',
          top: p.champion ? '-3rem' : '-2.5rem',
          width: p.champion ? 'clamp(80px, 15vw, 112px)' : 'clamp(60px, 12vw, 88px)',
          height: p.champion ? 'clamp(80px, 15vw, 112px)' : 'clamp(60px, 12vw, 88px)',
          borderRadius: '50%',
          border: `4px solid ${p.borderColor}`,
          padding: '3px',
          background: '#12080d',
          boxShadow: `0 0 30px ${p.glowColor}`,
          overflow: 'hidden'
        }}>
          <img src={p.avatar_url ? (p.avatar_url.startsWith('/') ? `http://127.0.0.1:8000${p.avatar_url}` : p.avatar_url) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.seed || p.name}`} alt={p.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
        </div>

        {/* Rank label */}
        <div style={{ marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: p.champion ? '#d4a574' : `${p.tierColor}99`, display: 'block', marginBottom: '0.35rem' }}>
            {p.champion ? 'Global Champion' : `Rank #${p.rank}`}
          </span>
          <h3 className="heading" style={{ fontSize: p.champion ? 'clamp(1rem, 4vw, 1.5rem)' : 'clamp(0.85rem, 3vw, 1.25rem)', textTransform: 'uppercase', letterSpacing: '-0.03em' }}>{p.name}</h3>
        </div>

        {/* Tier badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.4rem 1rem',
          borderRadius: '9999px',
          background: p.champion ? '#d4a574' : `${p.tierColor}22`,
          border: p.champion ? 'none' : `1px solid ${p.tierColor}44`,
          boxShadow: p.champion ? '0 4px 14px rgba(212,165,116,0.25)' : 'none',
          color: p.champion ? '#12080d' : p.tierColor,
          marginBottom: '1rem',
        }}>
          <Icon icon={p.tierIcon} style={{ fontSize: '14px' }} />
          <span style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{p.tier}</span>
        </div>

        {/* Rep count */}
        <span className="heading" style={{ fontSize: p.champion ? 'clamp(1.5rem, 6vw, 2.5rem)' : 'clamp(1.25rem, 5vw, 2rem)', color: p.champion ? 'white' : '#d4a574' }}>
          {p.reps} <span style={{ fontSize: '0.5em', color: 'rgba(255,255,255,0.4)', fontFamily: 'Satoshi, sans-serif', fontWeight: 700 }}>Reps</span>
        </span>
      </div>

      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }`}</style>
    </div>
  )
}

/* ── Table Row ── */
function TableRow({ row }) {
  const trendColor = row.trend === 'up' ? '#34d399' : row.trend === 'down' ? '#f87171' : 'rgba(255,255,255,0.2)'
  const trendIcon  = row.trend === 'up' ? 'lucide:trending-up' : row.trend === 'down' ? 'lucide:trending-down' : null

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '50px 1fr 100px',
        padding: '1rem 1.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        cursor: 'pointer',
        transition: 'background 0.2s, transform 0.2s',
        background: row.isYou ? 'rgba(212,165,116,0.05)' : 'transparent',
        borderLeft: row.isYou ? '4px solid #d4a574' : '4px solid transparent',
        alignItems: 'center',
      }}
      className="table-header-grid"
      onMouseOver={e => { e.currentTarget.style.background = row.isYou ? 'rgba(212,165,116,0.08)' : 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'scale(1.005)' }}
      onMouseOut={e => { e.currentTarget.style.background = row.isYou ? 'rgba(212,165,116,0.05)' : 'transparent'; e.currentTarget.style.transform = 'scale(1)' }}
    >
      {/* Rank */}
      <span className="heading" style={{ fontSize: '1.25rem', fontWeight: 900, color: row.isYou ? '#d4a574' : 'white' }}>#{row.rank}</span>

      {/* User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <img src={row.avatar_url ? (row.avatar_url.startsWith('/') ? `http://127.0.0.1:8000${row.avatar_url}` : row.avatar_url) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.seed || row.name}`} alt={row.name} style={{ width: '42px', height: '42px', borderRadius: '10px', border: row.isYou ? '2px solid rgba(212,165,116,0.4)' : 'none', objectFit: 'cover' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontWeight: row.isYou ? 900 : 700, fontSize: '0.875rem', letterSpacing: '-0.01em', color: row.isYou ? 'white' : 'white' }}>{row.name}</span>
          <span style={{ fontSize: '0.6rem', fontWeight: 700, color: trendColor, display: 'flex', alignItems: 'center', gap: '3px' }}>
            {trendIcon && <Icon icon={trendIcon} style={{ fontSize: '10px' }} />}
            {row.trendLabel ?? (row.isYou ? 'Pushing Limits' : '')}
          </span>
        </div>
      </div>

      {/* Tier */}
      <div style={{ display: 'none' }} className="desktop-only">
        <Icon icon={row.tierIcon} style={{ color: row.tierColor, fontSize: '14px' }} />
        <span style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: row.isYou ? '#d4a574' : 'white' }}>{row.tier}</span>
      </div>

      {/* Reps */}
      <span className="heading" style={{ fontSize: row.isYou ? '1.4rem' : '1.1rem', color: row.isYou ? 'white' : '#d4a574', textAlign: 'right' }}>{row.reps}</span>
    </div>
  )
}
