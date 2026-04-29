import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useAuth } from '../AuthContext'

const NAV_LINKS = [
  { label: 'Live Workout', to: '/dashboard/live' },
  { label: 'Chatbot',      to: '/dashboard/chatbot' },
  { label: 'Duel',         to: '/dashboard/duel' },
  { label: 'Leaderboard',  to: '/dashboard/leaderboard' },
  { label: 'Profile',      to: '/dashboard/profile' },
]

export default function DashboardNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(42,18,32,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '1rem 2.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
      }}
    >
      {/* Left: Brand + Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
        <Link to="/dashboard/live" id="nav-brand-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <div style={{
            width: '36px', height: '36px',
            background: '#d4a574',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(212,165,116,0.3)',
            transition: 'transform 0.2s',
          }}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Icon icon="mdi:weight-lifter" style={{ fontSize: '20px', color: '#12080d' }} />
          </div>
          <span className="heading" style={{ fontSize: '1.125rem', letterSpacing: '-0.04em', textTransform: 'uppercase', fontWeight: 800, color: 'white' }}>
            FitVision Lite
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }} className="nav-links-hidden">
          {NAV_LINKS.map(link => (
            <Link
              key={link.to}
              to={link.to}
              id={`nav-${link.label.toLowerCase().replace(' ', '-')}`}
              style={{
                fontSize: '0.65rem',
                fontWeight: 900,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                color: pathname === link.to ? '#d4a574' : 'rgba(255,255,255,0.45)',
                transition: 'color 0.2s',
              }}
              onMouseOver={e => { if (pathname !== link.to) e.currentTarget.style.color = 'white' }}
              onMouseOut={e => { if (pathname !== link.to) e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Right: SETV + Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          id="nav-setv-btn"
          style={{
            fontSize: '0.6rem', fontWeight: 900,
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '0.5rem 1.25rem',
            borderRadius: '9999px',
            background: 'transparent',
            color: 'white',
            cursor: 'pointer',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            transition: 'background 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
        >
          SETV
        </button>
        <button
          id="nav-logout-btn"
          onClick={handleLogout}
          style={{
            fontSize: '0.6rem', fontWeight: 900,
            background: 'rgba(220,38,38,0.9)',
            color: 'white',
            padding: '0.5rem 1.5rem',
            borderRadius: '9999px',
            border: 'none',
            cursor: 'pointer',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            transition: 'background 0.2s',
            boxShadow: '0 4px 20px rgba(220,38,38,0.2)',
          }}
          onMouseOver={e => e.currentTarget.style.background = 'rgb(239,68,68)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(220,38,38,0.9)'}
        >
          Logout
        </button>
      </div>

      <style>{`
        @media (max-width: 768px) { .nav-links-hidden { display: none !important; } }
      `}</style>
    </nav>
  )
}
