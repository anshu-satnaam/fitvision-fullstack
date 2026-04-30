import { useState, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'

const QUOTES = [
  "You got this!", "Keep pushing!", "Every rep counts!", "Rise and shine!",
  "No pain, no gain!", "Stay focused!", "You're unstoppable!", "Let's crush it!",
  "Power levels rising!", "Forge your legacy!", "Beast mode: ON!",
]

export default function Mascot() {
  const [visible, setVisible] = useState(false)
  const [quote, setQuote]     = useState(QUOTES[7])
  const [bounce, setBounce]   = useState(false)
  const timerRef = useRef(null)

  const speak = () => {
    clearTimeout(timerRef.current)
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)])
    setVisible(true)
    setBounce(true)
    setTimeout(() => setBounce(false), 250)
    timerRef.current = setTimeout(() => setVisible(false), 3500)
  }

  // Auto-greet after 2s
  useEffect(() => {
    const t = setTimeout(speak, 2000)
    return () => { clearTimeout(t); clearTimeout(timerRef.current) }
  }, [])

  return (
    <div
      className="mascot-container"
      style={{
        position: 'sticky',
        bottom: '1.5rem',
        right: 0,
        alignSelf: 'flex-end',
        zIndex: 50,
        marginTop: '1.5rem',
      }}
    >
      {/* Speech Bubble */}
      <div
        className="speech-bubble-pop"
        style={{
          position: 'absolute',
          bottom: 'calc(100% + 12px)',
          right: 0,
          background: 'white',
          color: '#12080d',
          fontSize: '11px',
          fontWeight: 900,
          padding: '0.5rem 0.85rem',
          borderRadius: '1rem 1rem 0.25rem 1rem',
          border: '2px solid #d4a574',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          pointerEvents: 'none',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
      >
        {quote}
      </div>

      {/* Mascot Button */}
      <div
        id="fitness-mascot"
        onClick={speak}
        className={bounce ? '' : 'mascot-float'}
        style={{
          width: '64px',
          height: '64px',
          background: 'linear-gradient(135deg, #d4a574, #b88a5a)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 15px 35px rgba(212,165,116,0.3)',
          border: '2px solid rgba(255,255,255,0.2)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          transform: bounce ? 'scale(0.88) rotate(-12deg)' : undefined,
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.boxShadow = '0 20px 45px rgba(212,165,116,0.45)'
          e.currentTarget.style.transform = 'scale(1.1)'
        }}
        onMouseOut={(e) => {
          if (!bounce) {
            e.currentTarget.style.boxShadow = '0 15px 35px rgba(212,165,116,0.3)'
            e.currentTarget.style.transform = ''
          }
        }}
      >
        <div style={{ position: 'relative' }}>
          <Icon icon="lucide:dumbbell" style={{ fontSize: '30px', color: '#12080d' }} />
          <div style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '10px',
            height: '10px',
            background: '#22c55e',
            border: '2px solid #2a1220',
            borderRadius: '50%',
          }}>
            <div style={{
              position: 'absolute',
              inset: '-2px',
              background: 'rgba(34,197,94,0.4)',
              borderRadius: '50%',
            }} className="animate-ping" />
          </div>
        </div>
      </div>
    </div>
  )
}
