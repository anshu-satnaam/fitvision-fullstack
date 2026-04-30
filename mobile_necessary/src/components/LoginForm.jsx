import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'


export default function LoginForm() {
  const navigate = useNavigate()
  const { loginWithBackend } = useAuth()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [message, setMessage]   = useState(null)

  const showMsg = (text, type = 'error') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 4000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)
    setMessage(null)
    try {
      await loginWithBackend(email, password)
      navigate('/dashboard/live', { replace: true })
    } catch (err) {
      showMsg(err.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    background: 'rgba(18,8,13,0.4)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '1rem 1.25rem',
    color: 'white',
    outline: 'none',
    fontSize: '0.875rem',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  }
  const labelStyle = {
    fontSize: '0.625rem', fontWeight: 700,
    color: '#d4a574',
    textTransform: 'uppercase', letterSpacing: '0.15em',
    display: 'block', marginBottom: '0.5rem',
  }
  const focusOn  = (e) => e.target.style.borderColor = 'rgba(212,165,116,0.5)'
  const focusOff = (e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Headline */}
      <div>
        <h2 className="heading" style={{
          fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
          color: 'white', lineHeight: 0.9,
          textTransform: 'uppercase', letterSpacing: '-0.03em',
          marginBottom: '0.75rem',
        }}>
          Forged in<br />
          <span style={{ color: '#d4a574' }}>Discipline.</span>
        </h2>
        <p style={{ color: 'rgba(226,226,226,0.4)', fontSize: '0.875rem', maxWidth: '24rem' }}>
          Reignite your journey toward peak human performance.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {message && (
          <div style={{
            background: message.type === 'info' ? 'rgba(212,165,116,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${message.type === 'info' ? 'rgba(212,165,116,0.4)' : 'rgba(239,68,68,0.4)'}`,
            borderRadius: '10px', padding: '0.75rem 1rem',
            color: message.type === 'info' ? '#d4a574' : '#fca5a5',
            fontSize: '0.8rem', lineHeight: 1.4,
          }}>
            {message.text}
          </div>
        )}

        <div className="input-3d" style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={labelStyle}>Access Key (Email)</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="commander@earthy.co" style={inputStyle}
            onFocus={focusOn} onBlur={focusOff} required />
        </div>

        <div className="input-3d" style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={labelStyle}>Security Protocol (Password)</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••" style={inputStyle}
            onFocus={focusOn} onBlur={focusOff} required />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
              style={{ accentColor: '#d4a574', width: '16px', height: '16px' }} />
            Maintain Link
          </label>
          <a href="#" style={{ color: 'rgba(212,165,116,0.7)', fontWeight: 700, textDecoration: 'none' }}
            onMouseOver={(e) => e.target.style.color = '#d4a574'}
            onMouseOut={(e) => e.target.style.color = 'rgba(212,165,116,0.7)'}>
            Forgot Key?
          </a>
        </div>

        <button type="submit" id="login-cta-btn" disabled={loading} style={{
          width: '100%', background: 'white', color: '#12080d',
          padding: '1.25rem', borderRadius: '12px',
          fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em',
          border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '0.875rem', position: 'relative', overflow: 'hidden',
          transition: 'all 0.3s', boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          opacity: loading ? 0.75 : 1,
        }}
          onMouseOver={(e) => { if (!loading) { e.currentTarget.style.background = '#d4a574'; e.currentTarget.style.boxShadow = '0 0 30px rgba(212,165,116,0.35)' }}}
          onMouseOut={(e)  => { if (!loading) { e.currentTarget.style.background = 'white';   e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.4)' }}}
        >
          {loading ? 'Authenticating…' : 'Engage Training'}
        </button>
      </form>
    </div>
  )
}
