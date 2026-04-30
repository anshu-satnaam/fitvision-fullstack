import { useState, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import DashboardNav from './DashboardNav'
import DashboardMascot from './DashboardMascot'
import FloatingParticles from './FloatingParticles'
import { profileAPI, workoutAPI } from '../api'
import { useAuth } from '../AuthContext'

const STATS = [
  { label: 'Total Reps', value: '12,840', color: '#d4a574' },
  { label: 'Workouts',   value: '142',    color: 'white' },
  { label: 'Streak',     value: '14 🔥',  color: '#f97316' },
  { label: 'PR Score',   value: '98',     color: '#22d3ee' },
]

const DEFAULT_CHART_DAYS = [
  { day: 'Mon', pct: 0, val: 0 },
  { day: 'Tue', pct: 0, val: 0 },
  { day: 'Wed', pct: 0, val: 0 },
  { day: 'Thu', pct: 0, val: 0 },
  { day: 'Fri', pct: 0, val: 0 },
  { day: 'Sat', pct: 0, val: 0 },
  { day: 'Sun', pct: 0, val: 0 },
]

const BADGES = ['fluent-emoji:fire', 'fluent-emoji:flexed-biceps', 'fluent-emoji:crown']

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [editing, setEditing]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [form, setForm] = useState({
    name:   user?.username || 'User',
    email:  user?.email    || '',
    weight: user?.weight_kg || '',
    target: '',
    avatar: user?.avatar_url || 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=400&auto=format&fit=crop',
  })
  const [stats, setStats] = useState([
    { label: 'Total Reps', value: user?.points?.toLocaleString() || '0', color: '#d4a574' },
    { label: 'Workouts',   value: '—',    color: 'white' },
    { label: 'Streak',     value: `${user?.streak ?? '—'} 🔥`, color: '#f97316' },
    { label: 'PR Score',   value: `${user?.level ?? '—'}`,  color: '#22d3ee' },
  ])
  const [chartDays, setChartDays] = useState(DEFAULT_CHART_DAYS)
  const cardRefs = useRef([])
  const fileInputRef = useRef(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const userPoints = user?.points || 0
  let tierName = 'Bronze Tier'
  let nextTierName = 'Silver Ascension'
  let pointsNeeded = 100 - userPoints
  let tierPct = Math.min(100, (userPoints / 100) * 100)

  if (userPoints >= 5000) {
    tierName = 'Diamond Tier'
    nextTierName = 'Max Level'
    pointsNeeded = 0
    tierPct = 100
  } else if (userPoints >= 1000) {
    tierName = 'Platinum Tier'
    nextTierName = 'Diamond Ascension'
    pointsNeeded = 5000 - userPoints
    tierPct = ((userPoints - 1000) / 4000) * 100
  } else if (userPoints >= 500) {
    tierName = 'Gold Tier'
    nextTierName = 'Platinum Ascension'
    pointsNeeded = 1000 - userPoints
    tierPct = ((userPoints - 500) / 500) * 100
  } else if (userPoints >= 100) {
    tierName = 'Silver Tier'
    nextTierName = 'Gold Ascension'
    pointsNeeded = 500 - userPoints
    tierPct = ((userPoints - 100) / 400) * 100
  }

  // Load real profile + workouts from backend
  useEffect(() => {
    if (!user) return
    // Profile
    profileAPI.get().then(p => {
      setForm(f => ({
        ...f,
        name:   p.username || f.name,
        email:  p.email    || f.email,
        weight: p.weight_kg || f.weight,
        avatar: p.avatar_url || f.avatar,
      }))
      setStats([
        { label: 'Total Reps', value: (p.points || 0).toLocaleString(), color: '#d4a574' },
        { label: 'Workouts',   value: '—',                              color: 'white'    },
        { label: 'Streak',     value: `${p.streak ?? 0} 🔥`,           color: '#f97316'  },
        { label: 'PR Score',   value: `${p.level  ?? 1}`,              color: '#22d3ee'  },
      ])
    }).catch(() => {})
    // Workout count
    workoutAPI.myWorkouts().then(ws => {
      setStats(prev => prev.map(s => s.label === 'Workouts' ? { ...s, value: String(ws.total || 0) } : s))
      if (ws.items) {
        const daysArr = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const today = new Date().getDay();
        const jsDayToOurDay = [6, 0, 1, 2, 3, 4, 5];
        const currentOurDay = jsDayToOurDay[today];
        
        let newChartDays = [];
        for (let i = 6; i >= 0; i--) {
          let dayIndex = (currentOurDay - i + 7) % 7;
          newChartDays.push({ day: daysArr[dayIndex], pct: 0, val: 0, highlight: i === 0 });
        }

        ws.items.forEach(item => {
           if (!item.created_at) return;
           const date = new Date(item.created_at);
           const now = new Date();
           // normalize to start of day for comparison
           const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
           const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
           const diffDays = Math.floor((startOfNow - startOfDate) / (1000 * 60 * 60 * 24));
           
           if (diffDays >= 0 && diffDays < 7) {
             const dayIndex = jsDayToOurDay[date.getDay()];
             const chartItem = newChartDays.find(d => d.day === daysArr[dayIndex]);
             if (chartItem) {
                chartItem.val += (item.reps || 0);
             }
           }
        });

        const maxVal = Math.max(...newChartDays.map(d => d.val), 10);
        newChartDays.forEach(d => {
           d.pct = Math.round((d.val / maxVal) * 100);
        });

        setChartDays(newChartDays);
      }
    }).catch(() => {})
  }, [user])

  // 3-D parallax on cards
  useEffect(() => {
    const handle = (e) => {
      const x = (e.clientX / window.innerWidth  - 0.5) * 2
      const y = (e.clientY / window.innerHeight - 0.5) * 2
      cardRefs.current.forEach(c => {
        if (c) c.style.transform = `rotateY(${x * 3}deg) rotateX(${-y * 3}deg) translateY(-5px)`
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

      <main style={{ flex: 1, padding: 'clamp(1rem, 4vw, 3rem)', maxWidth: '1280px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '3rem' }}>

        {/* ── Hero Section ── */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', alignItems: 'center' }} className="profile-hero-grid">
          {/* Avatar + Name */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }} className="profile-avatar-wrap">
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setUploadingAvatar(true)
                  try {
                    const res = await profileAPI.uploadAvatar(file)
                    setForm(f => ({ ...f, avatar: res.avatar_url }))
                    refreshUser()
                  } catch (err) {
                    console.error('Failed to upload avatar', err)
                  } finally {
                    setUploadingAvatar(false)
                  }
                }}
              />
              <div style={{ width: 'clamp(120px, 20vw, 160px)', height: 'clamp(120px, 20vw, 160px)', borderRadius: '50%', border: '4px solid #d4a574', padding: '4px', boxShadow: '0 0 40px rgba(212,165,116,0.25)', position: 'relative', overflow: 'hidden' }}>
                <img
                  src={form.avatar?.startsWith('/') ? `http://127.0.0.1:8000${form.avatar}` : form.avatar}
                  alt="Profile"
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', opacity: uploadingAvatar ? 0.5 : 1 }}
                />
                {uploadingAvatar && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', borderRadius: '50%' }}><span className="animate-pulse">...</span></div>}
              </div>
              <div style={{ position: 'absolute', bottom: '-4px', right: '8px', background: '#d4a574', color: '#12080d', padding: '2px 10px', borderRadius: '9999px', fontSize: '0.55rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', pointerEvents: 'none' }}>
                {tierName}
              </div>
              {/* Glow halo */}
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(212,165,116,0.15)', filter: 'blur(20px)', zIndex: -1, pointerEvents: 'none' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ color: '#d4a574', fontSize: '0.55rem', fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Member since 2024</span>
              <h1 className="heading" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', textTransform: 'uppercase', lineHeight: 1, marginBottom: '0.5rem' }}>
                {form.name.split(' ')[0] || 'User'} <span style={{ color: '#d4a574' }}>{form.name.split(' ').slice(1).join(' ')}</span>
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', maxWidth: '280px', lineHeight: 1.6 }}>
                Pushing the limits of human performance one rep at a time.
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }} className="stats-grid">
            {stats.map((s, i) => (
              <div
                key={s.label}
                ref={addCardRef}
                style={{
                  background: 'rgba(42,18,32,0.4)',
                  padding: '1.5rem',
                  borderRadius: '1.5rem',
                  border: '1px solid rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(10px)',
                  transition: 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.4s ease',
                  transformStyle: 'preserve-3d',
                }}
              >
                <span style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: '0.5rem' }}>{s.label}</span>
                <span className="heading" style={{ fontSize: '2.25rem', color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Lower Section ── */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="profile-lower-grid">

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Bar Chart */}
            <div style={{
              background: 'rgba(42,18,32,0.3)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '2.5rem',
              padding: '2rem',
              backdropFilter: 'blur(20px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', background: 'rgba(212,165,116,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon icon="lucide:trending-up" style={{ color: '#d4a574', fontSize: '20px' }} />
                  </div>
                  <h2 className="heading" style={{ fontSize: '1.4rem', letterSpacing: '-0.03em', textTransform: 'uppercase' }}>
                    Weekly <span style={{ color: '#d4a574' }}>Progression</span>
                  </h2>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button style={{ padding: '0.35rem 1rem', borderRadius: '9999px', background: '#d4a574', color: '#12080d', fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer' }}>Reps</button>
                  <button style={{ padding: '0.35rem 1rem', borderRadius: '9999px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer' }}>Volume</button>
                </div>
              </div>

              {/* Bars */}
              <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '0.75rem', padding: '0 0.5rem' }}>
                {chartDays.map((d) => (
                  <div key={d.day} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '0.75rem 0.75rem 0 0', position: 'relative', height: '100%', display: 'flex', alignItems: 'flex-end' }}
                    className="chart-bar-group"
                  >
                    <div
                      style={{
                        width: '100%',
                        height: `${d.pct}%`,
                        background: d.highlight ? '#d4a574' : 'rgba(212,165,116,0.25)',
                        borderRadius: '0.75rem 0.75rem 0 0',
                        transition: 'height 0.4s ease',
                        boxShadow: d.highlight ? '0 0 15px rgba(212,165,116,0.3)' : 'none',
                        position: 'relative',
                      }}
                    >
                      {/* Tooltip */}
                      <div style={{
                        position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
                        background: 'white', color: '#12080d', padding: '2px 8px', borderRadius: '6px',
                        fontSize: '0.6rem', fontWeight: 900, whiteSpace: 'nowrap',
                        opacity: 0, transition: 'opacity 0.2s',
                      }} className="chart-tooltip">{d.val}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', padding: '0 0.5rem' }}>
                {chartDays.map(d => (
                  <span key={d.day} style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.2)' }}>{d.day}</span>
                ))}
              </div>
            </div>

            {/* Tier + Badges */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }} className="profile-middle-grid">
              {/* Tier Progress */}
              <div ref={addCardRef} style={{ background: 'rgba(42,18,32,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2rem', padding: '2rem', transition: 'transform 0.4s cubic-bezier(0.23,1,0.32,1)', transformStyle: 'preserve-3d' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <Icon icon="lucide:award" style={{ color: '#d4a574', fontSize: '28px' }} />
                  <h3 className="heading" style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Tier Progress</h3>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#d4a574' }}>{tierName}</span>
                    <span style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.4)' }}>{Math.round(tierPct)}%</span>
                  </div>
                  <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '9999px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ width: `${tierPct}%`, height: '100%', background: '#d4a574', borderRadius: '9999px', boxShadow: '0 0 10px rgba(212,165,116,0.4)', transition: 'width 0.8s ease' }} />
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic', marginTop: '0.75rem', lineHeight: 1.5 }}>
                    "{pointsNeeded > 0 ? `${pointsNeeded.toLocaleString()} more reps until ${nextTierName}` : 'Max level reached!'}"
                  </p>
                </div>
              </div>

              {/* Badges */}
              <div ref={addCardRef} style={{ background: 'rgba(42,18,32,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2rem', padding: '2rem', transition: 'transform 0.4s cubic-bezier(0.23,1,0.32,1)', transformStyle: 'preserve-3d' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <Icon icon="lucide:layout-grid" style={{ color: '#22d3ee', fontSize: '28px' }} />
                  <h3 className="heading" style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Recent Badges</h3>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {BADGES.map((icon) => (
                    <div key={icon} style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.05)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'transform 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.transform = 'scale(1.12)'}
                      onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <Icon icon={icon} style={{ fontSize: '24px' }} />
                    </div>
                  ))}
                  <div style={{ width: '48px', height: '48px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 900, color: 'rgba(255,255,255,0.2)' }}>+12</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Account Vault */}
            <div style={{ background: 'rgba(42,18,32,0.8)', border: '1px solid rgba(212,165,116,0.2)', borderRadius: '2.5rem', padding: '2rem', boxShadow: '0 40px 80px rgba(0,0,0,0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 className="heading" style={{ fontSize: '1.4rem', letterSpacing: '-0.03em', textTransform: 'uppercase' }}>
                  Account <span style={{ color: '#d4a574' }}>Vault</span>
                </h2>
                <button onClick={() => setEditing(e => !e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: editing ? '#d4a574' : 'rgba(212,165,116,0.6)', transition: 'color 0.2s' }}>
                  <Icon icon="lucide:edit-3" style={{ fontSize: '20px' }} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <VaultField label="Operative Name" value={form.name} editing={editing} onChange={v => setForm(f => ({ ...f, name: v }))} />
                <VaultField label="Primary Contact" value={form.email} type="email" editing={editing} onChange={v => setForm(f => ({ ...f, email: v }))} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <VaultField label="Weight (KG)" value={form.weight} type="number" editing={editing} onChange={v => setForm(f => ({ ...f, weight: v }))} />
                  <VaultField label="Target (KG)" value={form.target} type="number" editing={editing} onChange={v => setForm(f => ({ ...f, target: v }))} />
                </div>

                {editing && (
                  <button
                    disabled={saving}
                    onClick={async () => {
                      setSaving(true)
                      try {
                        // Update username/email via main profile
                        await profileAPI.update({ username: form.name })
                        // Update weight/height via stats endpoint
                        if (form.weight) await profileAPI.updateStats({ weight: parseFloat(form.weight) })
                        refreshUser()
                      } catch { /* ignore if backend offline */ }
                      setSaving(false)
                      setEditing(false)
                    }}
                    style={{ width: '100%', background: '#d4a574', color: '#12080d', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', padding: '1rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', fontSize: '0.8rem', boxShadow: '0 8px 20px rgba(212,165,116,0.3)', transition: 'background 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.background = '#e89b7b'}
                    onMouseOut={e => e.currentTarget.style.background = '#d4a574'}
                  >
                    Sync Protocols
                  </button>
                )}
              </div>
            </div>

            {/* Social Frequency */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '2.5rem', padding: '2rem', backdropFilter: 'blur(10px)' }}>
              <h3 className="heading" style={{ fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: '1.5rem' }}>
                Social <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>Frequency</span>
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div style={{ flex: 1, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '2rem' }}>
                  <span className="heading" style={{ fontSize: '1.75rem', display: 'block' }}>1.2k</span>
                  <span style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.2)' }}>Followers</span>
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <span className="heading" style={{ fontSize: '1.75rem', display: 'block' }}>#12</span>
                  <span style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.2)' }}>Global Rank</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Wave */}
      <div className="wave-bg" style={{ opacity: 0.15, zIndex: 0 }}>
        <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#d4a574" />
        </svg>
      </div>

      <DashboardMascot variant="profile" />

      <style>{`
        .chart-bar-group:hover .chart-tooltip { opacity: 1 !important; }
        @media (min-width: 1024px) {
          .profile-hero-grid  { grid-template-columns: 5fr 7fr !important; }
          .profile-lower-grid { grid-template-columns: 8fr 4fr !important; }
          .profile-avatar-wrap { flex-direction: row !important; text-align: left !important; }
          .stats-grid { grid-template-columns: repeat(4,1fr) !important; }
          .profile-middle-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  )
}

function VaultField({ label, value, type = 'text', editing, onChange }) {
  const base = {
    width: '100%',
    background: 'rgba(18,8,13,0.5)',
    border: `1px solid ${editing ? 'rgba(212,165,116,0.4)' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: '0.75rem',
    padding: '0.875rem 1rem',
    fontSize: '0.85rem',
    color: 'white',
    outline: 'none',
    cursor: editing ? 'text' : 'not-allowed',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  }
  return (
    <div>
      <label style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: '0.4rem' }}>{label}</label>
      <input
        type={type}
        value={value}
        readOnly={!editing}
        onChange={e => onChange(e.target.value)}
        style={base}
        onFocus={e => { if (editing) e.currentTarget.style.borderColor = '#d4a574' }}
        onBlur={e => e.currentTarget.style.borderColor = editing ? 'rgba(212,165,116,0.4)' : 'rgba(255,255,255,0.08)'}
      />
    </div>
  )
}
