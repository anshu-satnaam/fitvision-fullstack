import { useState, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'

const LIVE_MESSAGES = [
  "You got this!", "Keep pushing!", "Every rep counts!", "Rise and shine!",
  "No pain, no gain!", "Stay focused!", "You're unstoppable!", "Let's crush it!",
]

const CHAT_MESSAGES = [
  "Ask away! I'm here to help.", "Let's get stronger together!", "Form first, speed later!",
  "You're doing great, keep going!", "Stay curious and stay fit!", "Check your posture!",
  "Consistency is key!", "Crush those goals!",
]

const PROFILE_MESSAGES = [
  "Looking sharp today!", "Your streak is legendary!", "85% to Platinum — so close!",
  "Ready for another session?", "New personal record incoming!", "Don't forget to hydrate!",
  "You're in the top 12 globally!", "Consistency is your superpower!",
]

const DUEL_MESSAGES = [
  "Beat them!", "Go harder!", "You're stronger!", "Dominate!",
  "Show them power!", "Victory awaits!", "Crush it!", "You got this!",
]

const LEADERBOARD_MESSAGES = [
  "You're climbing fast!", "Keep grinding!", "Show them what you got!",
  "Rank up time!", "Push harder!", "Chase that gold!",
  "Dominate the board!", "You got this!",
]

const VARIANT_CONFIG = {
  live:        { messages: LIVE_MESSAGES,        icon: 'mdi:emoticon-happy'   },
  chat:        { messages: CHAT_MESSAGES,        icon: 'mdi:robot-happy'      },
  profile:     { messages: PROFILE_MESSAGES,     icon: 'mdi:emoticon-cool'    },
  duel:        { messages: DUEL_MESSAGES,        icon: 'mdi:emoticon-excited' },
  leaderboard: { messages: LEADERBOARD_MESSAGES, icon: 'mdi:trophy-outline'   },
}

export default function DashboardMascot({ variant = 'live' }) {
  const [visible, setVisible] = useState(false)
  const [text, setText] = useState('')
  const [bounce, setBounce] = useState(false)
  const timerRef = useRef(null)
  const indexRef = useRef(0)
  const { messages, icon } = VARIANT_CONFIG[variant] ?? VARIANT_CONFIG.live

  const speak = () => {
    clearTimeout(timerRef.current)
    setText(messages[indexRef.current % messages.length])
    indexRef.current++
    setVisible(true)
    setBounce(true)
    setTimeout(() => setBounce(false), 250)
    timerRef.current = setTimeout(() => setVisible(false), 3500)
  }

  useEffect(() => {
    const t = setTimeout(speak, 1800)
    return () => { clearTimeout(t); clearTimeout(timerRef.current) }
  }, [])

  return (
    <div id="fitness-mascot-container" style={{
      position: 'fixed',
      bottom: '2rem',
      left: '2rem',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '0.75rem',
    }}>
      {/* Speech bubble */}
      <div style={{
        background: 'white',
        color: '#12080d',
        padding: '0.75rem 1rem',
        borderRadius: '1rem 1rem 0.25rem 1rem',
        border: '2px solid #d4a574',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        fontSize: '0.7rem',
        fontWeight: 900,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        maxWidth: '200px',
        pointerEvents: 'none',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.9)',
        transformOrigin: 'bottom left',
        transition: 'opacity 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      }}>
        {text}
      </div>

      {/* Mascot button */}
      <div
        id="fitness-mascot"
        onClick={speak}
        className={bounce ? '' : 'mascot-float'}
        style={{
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, #d4a574 0%, #b88a5a 100%)',
          borderRadius: '50%',
          border: '4px solid #2a1220',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          position: 'relative',
          transition: 'transform 0.2s, box-shadow 0.2s',
          transform: bounce ? 'scale(0.88)' : undefined,
        }}
        onMouseOver={e => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.boxShadow = '0 25px 50px rgba(212,165,116,0.4)'
        }}
        onMouseOut={e => {
          if (!bounce) {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.5)'
          }
        }}
      >
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 60%)',
        }} />
        <Icon icon={icon} style={{ fontSize: '40px', color: '#12080d', position: 'relative', zIndex: 1 }} />
      </div>

      {/* Shadow */}
      <div style={{
        width: '50px', height: '8px',
        background: 'rgba(0,0,0,0.5)',
        borderRadius: '50%',
        filter: 'blur(6px)',
        alignSelf: 'center',
        marginTop: '-0.5rem',
      }} />
    </div>
  )
}
