import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'


export default function SignupForm() {
  const navigate = useNavigate()
  const { registerWithBackend } = useAuth()
  const [form, setForm]       = useState({ name: '', phone: '', email: '', age: '', goal: 'Muscle Synthesis', password: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const showMsg = (text, type = 'error') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 4000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setLoading(true)
    setMessage(null)
    try {
      await registerWithBackend(form.name || form.email.split('@')[0], form.email, form.password)
      showMsg('Account created! Welcome to FitVision.', 'success')
      setTimeout(() => navigate('/dashboard/live', { replace: true }), 800)
    } catch (err) {
      showMsg(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    background: 'rgba(18,8,13,0.4)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '0.75rem 1rem',
    color: 'white', outline: 'none',
    fontSize: '0.875rem',
    transition: 'border-color 0.2s',
  }
  const labelStyle = {
    fontSize: '0.625rem', fontWeight: 700,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase', letterSpacing: '0.1em',
    display: 'block', marginBottom: '0.35rem',
  }
  const focusOn  = (e) => e.target.style.borderColor = 'rgba(212,165,116,0.5)'
  const focusOff = (e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'

  const msgColor = message?.type === 'info'    ? { bg: 'rgba(212,165,116,0.12)', border: 'rgba(212,165,116,0.35)', text: '#d4a574' }
                 : message?.type === 'success'  ? { bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.35)',   text: '#86efac' }
                 :                                { bg: 'rgba(239,68,68,0.12)',    border: 'rgba(239,68,68,0.35)',   text: '#fca5a5' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 className="heading" style={{
          fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
          color: 'white', lineHeight: 0.9,
          textTransform: 'uppercase', letterSpacing: '-0.03em',
          marginBottom: '0.75rem',
        }}>
          Join the<br /><span style={{ color: '#d4a574' }}>Vanguard.</span>
        </h2>
        <p style={{ color: 'rgba(226,226,226,0.4)', fontSize: '0.875rem' }}>
          Initialize your biometrics and set your evolution trajectory.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {message && (
          <div style={{
            background: msgColor.bg, border: `1px solid ${msgColor.border}`,
            borderRadius: '10px', padding: '0.75rem 1rem',
            color: msgColor.text, fontSize: '0.8rem', lineHeight: 1.4,
          }}>
            {message.text}
          </div>
        )}

        <div className="auth-grid">
          <div className="input-3d">
            <label style={labelStyle}>Identity</label>
            <input type="text" placeholder="John Doe" value={form.name}
              onChange={update('name')} style={inputStyle} onFocus={focusOn} onBlur={focusOff} required />
          </div>
          <div className="input-3d">
            <label style={labelStyle}>Comms</label>
            <input type="tel" placeholder="+1 (000)" value={form.phone}
              onChange={update('phone')} style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
          </div>
        </div>

        <div className="input-3d">
          <label style={labelStyle}>Registry Email</label>
          <input type="email" placeholder="commander@earthy.co" value={form.email}
            onChange={update('email')} style={inputStyle} onFocus={focusOn} onBlur={focusOff} required />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="input-3d">
            <label style={labelStyle}>Biometric Age</label>
            <input type="number" min="13" max="99" placeholder="25" value={form.age}
              onChange={update('age')} style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
          </div>
          <div className="input-3d">
            <label style={labelStyle}>Target Goal</label>
            <select value={form.goal} onChange={update('goal')}
              style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
              onFocus={focusOn} onBlur={focusOff}>
              <option>Muscle Synthesis</option>
              <option>Fat Oxidation</option>
              <option>Endurance</option>
              <option>Mobility</option>
            </select>
          </div>
        </div>

        <div className="input-3d">
          <label style={labelStyle}>Security Phrase</label>
          <input type="password" placeholder="Min 6 characters" value={form.password}
            onChange={update('password')} style={inputStyle} onFocus={focusOn} onBlur={focusOff} required minLength={6} />
        </div>

        <button type="submit" id="signup-cta-btn" disabled={loading} style={{
          width: '100%', background: '#d4a574', color: '#12080d',
          padding: '1.1rem', borderRadius: '12px',
          fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em',
          border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '0.875rem', transition: 'all 0.3s',
          boxShadow: '0 10px 25px rgba(212,165,116,0.25)',
          marginTop: '0.5rem', opacity: loading ? 0.7 : 1,
        }}
          onMouseOver={(e) => { if (!loading) e.currentTarget.style.filter = 'brightness(1.12)' }}
          onMouseOut={(e)  => { if (!loading) e.currentTarget.style.filter = 'brightness(1)' }}
        >
          {loading ? 'Initializing…' : 'Confirm Induction'}
        </button>
      </form>
    </div>
  )
}
