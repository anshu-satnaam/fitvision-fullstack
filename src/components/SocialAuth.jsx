import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { auth, googleProvider, facebookProvider, appleProvider, isDemoMode } from '../firebase'
import { signInWithPopup } from 'firebase/auth'

import { useAuth } from '../AuthContext'

const PROVIDERS = [
  { id: 'google',   icon: 'logos:google-icon',   label: 'Google'   },
  { id: 'apple',    icon: 'ri:apple-fill',        label: 'Apple'    },
  { id: 'facebook', icon: 'ri:facebook-box-fill', label: 'Facebook', color: '#1877F2' },
]

const providerMap = {
  google:   () => googleProvider,
  apple:    () => appleProvider,
  facebook: () => facebookProvider,
}

export default function SocialAuth() {
  const navigate = useNavigate()
  const { handleSocialLogin } = useAuth()
  const [loading, setLoading] = useState(null)
  const [toast, setToast]     = useState(null)

  const showToast = (msg, type = 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleSocial = async (providerId) => {
    if (loading) return
    if (isDemoMode) {
      showToast(`Add Firebase credentials in .env to enable ${providerId} sign-in.`, 'info')
      return
    }
    setLoading(providerId)
    try {
      await handleSocialLogin(providerMap[providerId])
      navigate('/dashboard/live', { replace: true })
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        showToast(err.message || `Failed: ${err.code || err.message}`)
        console.error('[SocialAuth]', err)
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{
        fontSize: '0.625rem', fontWeight: 700,
        color: 'rgba(255,255,255,0.2)',
        textTransform: 'uppercase', letterSpacing: '0.3em',
        marginBottom: '1.25rem',
      }}>
        Alternate Authentication
      </p>

      {/* Toast */}
      {toast && (
        <div style={{
          background: toast.type === 'info' ? 'rgba(212,165,116,0.15)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${toast.type === 'info' ? 'rgba(212,165,116,0.4)' : 'rgba(239,68,68,0.4)'}`,
          borderRadius: '10px',
          padding: '0.6rem 0.85rem',
          color: toast.type === 'info' ? '#d4a574' : '#fca5a5',
          fontSize: '0.72rem',
          marginBottom: '1rem',
          lineHeight: 1.4,
          textAlign: 'left',
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            id={`${p.id}-auth-btn`}
            onClick={() => handleSocial(p.id)}
            disabled={loading !== null}
            title={`Sign in with ${p.label}`}
            style={{
              width: '48px', height: '48px',
              borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: loading !== null ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: loading !== null && loading !== p.id ? 0.4 : 1,
              color: 'white',
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.borderColor = 'rgba(212,165,116,0.55)'
                e.currentTarget.style.transform = 'translateY(-3px)'
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            {loading === p.id
              ? <Spinner />
              : <Icon icon={p.icon} style={{ fontSize: '22px', ...(p.color ? { color: p.color } : {}) }} />
            }
          </button>
        ))}
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <>
      <svg style={{ width: '18px', height: '18px', animation: 'spin 0.8s linear infinite' }}
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
        <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
      </svg>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </>
  )
}
