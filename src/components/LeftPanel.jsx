import { useState } from 'react'
import { Icon } from '@iconify/react'
import LoginForm from './LoginForm'
import SignupForm from './SignupForm'
import SocialAuth from './SocialAuth'
import Mascot from './Mascot'

export default function LeftPanel() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [animating, setAnimating] = useState(false)

  const switchMode = (next) => {
    if (next === mode || animating) return
    setAnimating(true)
    setTimeout(() => {
      setMode(next)
      setTimeout(() => setAnimating(false), 50)
    }, 300)
  }

  return (
    <div
      className="custom-scrollbar"
      style={{
        flex: '0 0 auto',
        width: '100%',
        maxWidth: '580px',
        background: '#2a1220',
        display: 'flex',
        flexDirection: 'column',
        padding: '4rem',
        position: 'relative',
        overflowY: 'auto',
        zIndex: 20,
        boxShadow: '8px 0 40px rgba(0,0,0,0.5)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: '3rem' }}>
        <a href="#" id="nav-logo-link" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }} className="group">
          <div style={{
            width: '40px', height: '40px',
            background: '#d4a574',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(212,165,116,0.4)',
            transition: 'transform 0.3s',
          }}>
            <Icon icon="mdi:weight-lifter" style={{ fontSize: '24px', color: '#12080d' }} />
          </div>
          <span className="heading" style={{ color: 'white', fontSize: '1.5rem', letterSpacing: '-0.05em', textTransform: 'uppercase' }}>
            EarthyCo
          </span>
        </a>
      </div>

      {/* Tab Switcher */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          display: 'inline-flex',
          padding: '4px',
          background: '#12080d',
          borderRadius: '9999px',
          width: '100%',
          maxWidth: '320px',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
        }}>
          {['login', 'signup'].map((tab) => (
            <button
              key={tab}
              onClick={() => switchMode(tab)}
              style={{
                flex: 1,
                padding: '0.75rem 1.5rem',
                borderRadius: '9999px',
                fontSize: '0.7rem',
                fontWeight: 900,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s',
                background: mode === tab ? '#d4a574' : 'transparent',
                color: mode === tab ? '#12080d' : '#6b7280',
                boxShadow: mode === tab ? '0 4px 14px rgba(212,165,116,0.35)' : 'none',
              }}
            >
              {tab === 'login' ? 'LOGIN' : 'SIGN UP'}
            </button>
          ))}
        </div>
      </div>

      {/* Forms */}
      <div className="form-perspective" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{
          transition: 'opacity 0.3s, transform 0.3s',
          opacity: animating ? 0 : 1,
          transform: animating ? 'translateX(20px)' : 'translateX(0)',
        }}>
          {mode === 'login' ? <LoginForm /> : <SignupForm />}
        </div>
      </div>

      {/* Social Auth */}
      <div style={{ marginTop: '3rem', paddingTop: '2.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <SocialAuth />
      </div>

      {/* Mascot */}
      <Mascot />
    </div>
  )
}
