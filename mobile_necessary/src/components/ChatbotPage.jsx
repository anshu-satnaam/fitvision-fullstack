import { useState, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import DashboardNav from './DashboardNav'
import DashboardMascot from './DashboardMascot'
import FloatingParticles from './FloatingParticles'
import { chatbotAPI, getToken } from '../api'

const INITIAL_MESSAGES = [
  {
    from: 'coach',
    text: 'Hi! I am your FitVision AI Coach. Ask me anything about form, nutrition, or recovery. Let\'s maximize your progress today!',
    time: '—',
  },
]

const FALLBACK_REPLIES = [
  "Keep pushing — consistency is everything!",
  "Great form starts with breathing: exhale on exertion.",
  "For recovery: sleep, hydration, and 20–30g protein post-workout.",
  "Aim for 1g protein per pound of bodyweight and time carbs around training.",
]

const CHIPS = [
  { label: 'Form Tips',       msg: 'How is my squat form?' },
  { label: 'Nutrition Advice', msg: 'Recommend a post-workout meal' },
  { label: 'Recovery',         msg: 'Create a mobility routine for me' },
  { label: 'Motivation',       msg: 'Give me a motivational quote!' },
]

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const fallbackIdxRef = useRef(0)
  const chatEndRef = useRef(null)
  const cardRef = useRef(null)
  const wsRef = useRef(null)

  useEffect(() => {
    const connectWs = () => {
      const token = getToken()
      if (!token) return
      const wsBase = import.meta.env.VITE_WS_BASE || (() => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const host = window.location.host.includes('5174') ? '127.0.0.1:8000' : window.location.host
        return `${protocol}//${host}`
      })()
      const ws = new WebSocket(`${wsBase}/api/chatbot/ws/${token}`)
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.type === 'stream_chunk') {
          setMessages(prev => {
            const newMsgs = [...prev]
            const last = newMsgs[newMsgs.length - 1]
            if (last && last.from === 'coach' && last.isStreaming) {
              last.text += data.content
            } else {
              newMsgs.push({ from: 'coach', text: data.content, isStreaming: true, time: formatTime(new Date()) })
            }
            return newMsgs
          })
        } else if (data.type === 'stream_end') {
          setMessages(prev => {
            const newMsgs = [...prev]
            const last = newMsgs[newMsgs.length - 1]
            if (last && last.isStreaming) {
              last.isStreaming = false
            }
            return newMsgs
          })
          setTyping(false)
        } else if (data.type === 'error') {
          setTyping(false)
        }
      }
      wsRef.current = ws
    }
    connectWs()
    return () => {
      if (wsRef.current) wsRef.current.close()
    }
  }, [])

  useEffect(() => {
    if (chatEndRef.current) {
      const container = chatEndRef.current.parentElement
      if (container) container.scrollTop = container.scrollHeight
    }
  }, [messages, typing])

  // 3D parallax
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!cardRef.current) return
      const x = (window.innerWidth / 2 - e.pageX) / 50
      const y = (window.innerHeight / 2 - e.pageY) / 50
      cardRef.current.style.transform = `rotateX(${y}deg) rotateY(${-x}deg)`
    }
    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleSend = async (text = input.trim()) => {
    if (!text || typing) return
    const now = new Date()
    setMessages(prev => [...prev, { from: 'user', text, time: formatTime(now) }])
    setInput('')
    setTyping(true)
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ content: text }))
    } else {
      try {
        const data = await chatbotAPI.send(text)
        setMessages(prev => [...prev, { from: 'coach', text: data.reply, time: formatTime(new Date()) }])
      } catch {
        const reply = FALLBACK_REPLIES[fallbackIdxRef.current % FALLBACK_REPLIES.length]
        fallbackIdxRef.current++
        setMessages(prev => [...prev, { from: 'coach', text: reply, time: formatTime(new Date()) }])
      } finally {
        setTyping(false)
      }
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#12080d', color: 'white', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <FloatingParticles />
      <DashboardNav />

      <main style={{ flex: 1, maxWidth: '1280px', margin: '0 auto', width: '100%', padding: 'clamp(1rem, 4vw, 2.5rem)', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 10 }}>
        {/* Header */}
        <header style={{ marginBottom: '2rem' }}>
          <h1 className="heading" style={{ fontSize: 'clamp(2rem, 6vw, 5rem)', letterSpacing: '-0.04em', textTransform: 'uppercase', lineHeight: 1, marginBottom: '0.75rem' }}>
            AI <span style={{ color: '#d4a574' }}>Fitness Coach</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.35rem 0.85rem',
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: '9999px',
              fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase',
              color: '#34d399',
            }}>
              <span style={{ width: '6px', height: '6px', background: '#34d399', borderRadius: '50%' }} className="animate-pulse" />
              Online
            </div>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
              Personalized form analysis.
            </span>
          </div>
        </header>

        {/* Chat card */}
        <div
          ref={cardRef}
          style={{
            flex: 1,
            background: 'rgba(42,18,32,0.3)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '2.5rem',
            boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            maxHeight: 'calc(100vh - clamp(200px, 30vh, 250px))',
            transition: 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        >
          {/* Messages */}
          <div
            id="chat-history"
            className="custom-scrollbar"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 'clamp(1rem, 5vw, 3rem)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}

            {/* Typing indicator */}
            {typing && (
              <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                <div style={{
                  background: 'rgba(42,18,32,0.5)',
                  borderRadius: '1.25rem 1.25rem 1.25rem 0',
                  padding: '0.85rem 1.25rem',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input area */}
          <div style={{
            padding: 'clamp(1rem, 4vw, 2rem) clamp(1rem, 5vw, 3rem)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(0,0,0,0.2)',
          }}>
            {/* Chip suggestions */}
            <div className="custom-scrollbar" style={{ display: 'flex', overflowX: 'auto', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.25rem' }}>
              {CHIPS.map(chip => (
                <ChipButton key={chip.label} label={chip.label} onClick={() => handleSend(chip.msg)} />
              ))}
            </div>

            {/* Text input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input
                type="text"
                id="chat-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask coach..."
                style={{
                  flex: 1,
                  background: 'rgba(18,8,13,0.8)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '1rem',
                  padding: '0.85rem 1.25rem',
                  fontSize: '0.85rem',
                  color: 'white',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'rgba(212,165,116,0.5)'
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(212,165,116,0.1)'
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
              <button
                id="btn-send"
                onClick={() => handleSend()}
                style={{
                  width: '48px', height: '48px', flexShrink: 0,
                  background: '#d4a574',
                  border: 'none',
                  borderRadius: '0.75rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 15px 40px rgba(212,165,116,0.25)',
                  transition: 'background 0.2s, transform 0.15s',
                }}
                onMouseOver={e => { e.currentTarget.style.background = '#e89b7b'; e.currentTarget.style.transform = 'scale(1.05)' }}
                onMouseOut={e => { e.currentTarget.style.background = '#d4a574'; e.currentTarget.style.transform = 'scale(1)' }}
              >
                <Icon icon="lucide:send" style={{ fontSize: '20px', color: '#12080d' }} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Wave */}
      <div className="wave-bg" style={{ opacity: 0.2, zIndex: 0 }}>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#d4a574" />
        </svg>
      </div>

      <DashboardMascot variant="chat" />
    </div>
  )
}

function MessageBubble({ msg }) {
  const isUser = msg.from === 'user'
  return (
    <div style={{
      alignSelf: isUser ? 'flex-end' : 'flex-start',
      maxWidth: '80%',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.4rem',
      animation: 'slideUpFade 0.4s ease-out forwards',
    }}>
      <div style={{
        background: isUser ? '#d4a574' : 'rgba(42,18,32,0.6)',
        borderLeft: isUser ? 'none' : '4px solid #d4a574',
        padding: '1.25rem 1.5rem',
        borderRadius: isUser ? '1.5rem 1.5rem 0 1.5rem' : '1.5rem 1.5rem 1.5rem 0',
        fontSize: '0.9rem',
        color: isUser ? '#12080d' : 'rgba(255,255,255,0.9)',
        fontWeight: isUser ? 700 : 400,
        fontStyle: isUser ? 'normal' : 'italic',
        lineHeight: 1.65,
        boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
      }}>
        {msg.text}
      </div>
      <span style={{
        fontSize: '0.6rem', fontWeight: 700,
        color: 'rgba(255,255,255,0.2)',
        textTransform: 'uppercase', letterSpacing: '0.1em',
        textAlign: isUser ? 'right' : 'left',
        padding: isUser ? '0 0.25rem 0 0' : '0 0 0 0.25rem',
      }}>
        {isUser ? 'You' : 'Coach'} · {msg.time}
      </span>
    </div>
  )
}

function ChipButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '0.75rem',
        padding: '0.5rem 1rem',
        fontSize: '0.6rem', fontWeight: 900,
        textTransform: 'uppercase', letterSpacing: '0.12em',
        color: 'rgba(255,255,255,0.6)',
        cursor: 'pointer',
        transition: 'all 0.2s, transform 0.2s',
      }}
      onMouseOver={e => {
        e.currentTarget.style.background = '#d4a574'
        e.currentTarget.style.color = '#12080d'
        e.currentTarget.style.borderColor = '#d4a574'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseOut={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
        e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {label}
    </button>
  )
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: '6px', height: '6px',
          background: '#d4a574',
          borderRadius: '50%',
          animation: `typingBounce 1.2s ease-in-out infinite`,
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
