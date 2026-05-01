/**
 * DuelPage.jsx — Main orchestrator for the multiplayer duel system.
 *
 * Phases: lobby → setup → arena → results
 *
 * The socket proxy object is stable (created once in a ref) so DuelArena
 * can safely call socket.setHandler(fn) in a useEffect.
 */
import { useState, useRef, useCallback, useMemo } from 'react'
import DashboardNav      from '../DashboardNav'
import FloatingParticles from '../FloatingParticles'
import DuelLobby         from './DuelLobby'
import DuelSetup         from './DuelSetup'
import DuelArena         from './DuelArena'
import DuelResults       from './DuelResults'
import { useDuelSocket } from './useDuelSocket'
import { getToken }      from '../../api'
import { useAuth }       from '../../AuthContext'

const PHASES = ['lobby', 'setup', 'arena', 'results']

export default function DuelPage() {
  const { user } = useAuth()
  const [phase,     setPhase]     = useState('lobby')
  const [mode,      setMode]      = useState(null)
  const [config,    setConfig]    = useState(null)
  const [result,    setResult]    = useState(null)
  const [challenge, setChallenge] = useState(null)  // { challenger_id, exercise, duration, username }

  // ── Shared message handler ref ─────────────────────────────────────────────
  // DuelArena registers its handler here; DuelPage forwards all WS messages.
  const handlerRef = useRef(null)

  // Stable proxy — never re-created, so DuelArena's useEffect deps stay clean
  const socketProxy = useMemo(() => ({
    send:       (payload) => {}, // patched below
    setHandler: (fn)      => { handlerRef.current = fn },
  }), [])

  const onMessage = useCallback((msg) => {
    if (msg.type === 'challenge_received') {
      setChallenge(msg)   // show in-page notification instead of window.confirm
      return
    }
    if (msg.type === 'challenge_sent') {
      // handled by challenge panel UI
      return
    }
    if (msg.type === 'challenge_rejected') {
      setChallenge({ rejected: true })
      setTimeout(() => setChallenge(null), 3000)
      return
    }
    if (msg.type === 'challenge_accepted') {
      return
    }
    handlerRef.current?.(msg)
  }, [])

  const rawSocket = useDuelSocket(onMessage, user?.uid || user?.id)
  socketProxy.send = rawSocket.send

  // ── Transitions ────────────────────────────────────────────────────────────
  function handleModeSelect(selectedMode) {
    setMode(selectedMode)
    setPhase('setup')
  }

  function handleSetupStart(cfg) {
    setConfig(cfg)
    rawSocket.connect()

    // Wait for WS to connect, then mount arena. Arena will send the join events.
    setTimeout(() => {
      const token = getToken() || user?.uid || user?.id
      if (!token) { alert('Please log in to use multiplayer.'); return }
      setPhase('arena')
    }, 700)
  }

  function handleFinish(res) {
    setResult(res)
    setPhase('results')
    rawSocket.disconnect()
  }

  function handlePlayAgain() {
    handlerRef.current = null
    setResult(null)
    setPhase('setup')
  }

  function handleAcceptChallenge() {
    if (!challenge) return
    rawSocket.connect()
    setTimeout(() => {
      socketProxy.send({ type: 'challenge_response', accept: true, challenger_id: challenge.challenger_id, exercise: challenge.exercise, duration: challenge.duration })
      setConfig({ mode: 'friend', exercise: challenge.exercise, duration: challenge.duration })
      setChallenge(null)
      setPhase('arena')
    }, 400)
  }

  function handleDeclineChallenge() {
    if (!challenge) return
    socketProxy.send({ type: 'challenge_response', accept: false, challenger_id: challenge.challenger_id })
    setChallenge(null)
  }

  function handleLobby() {
    handlerRef.current = null
    setResult(null)
    setConfig(null)
    setMode(null)
    setPhase('lobby')
    rawSocket.disconnect()
  }

  function handleBack() {
    handlerRef.current = null
    rawSocket.disconnect()
    setPhase('lobby')
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #12080d 0%, #1a0d18 50%, #0d0812 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <FloatingParticles />
      <DashboardNav />

      <main style={{
        flex: 1,
        padding: 'clamp(1.5rem,4vw,3rem)',
        maxWidth: '1100px',
        margin: '0 auto',
        width: '100%',
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
      }}>

        {/* ── Page header ── */}
        <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="heading" style={{ fontSize: 'clamp(1.5rem,4vw,2.5rem)', textTransform: 'uppercase', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '0.3rem' }}>
              Duel <span style={{ color: '#d4a574' }}>Arena</span>
              <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '55%' }}> · Multiplayer</span>
            </h1>
            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>
              Rep battles vs players, friends, or AI · most correct reps in time wins
            </p>
          </div>

          {/* Phase pill breadcrumb */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {PHASES.map((p, i) => (
              <div key={p} style={{
                padding: '0.2rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.55rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                background: phase === p ? 'rgba(212,165,116,0.18)' : 'rgba(255,255,255,0.04)',
                color:      phase === p ? '#d4a574' : 'rgba(255,255,255,0.2)',
                border:     `1px solid ${phase === p ? 'rgba(212,165,116,0.35)' : 'rgba(255,255,255,0.06)'}`,
                transition: 'all 0.2s',
              }}>
                {i + 1}. {p}
              </div>
            ))}
          </div>
        </header>

        {/* ── Phase content ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {phase === 'lobby' && (
            <DuelLobby onSelect={handleModeSelect} />
          )}

          {phase === 'setup' && mode && (
            <DuelSetup
              mode={mode}
              onStart={handleSetupStart}
              onBack={handleBack}
              socket={socketProxy}
            />
          )}

          {phase === 'arena' && config && (
            <DuelArena
              config={config}
              socket={socketProxy}
              onFinish={handleFinish}
            />
          )}

          {phase === 'results' && result && (
            <DuelResults
              result={result}
              onPlayAgain={handlePlayAgain}
              onLobby={handleLobby}
            />
          )}
        </div>
      </main>

      {/* Wave decoration */}
      <div className="wave-bg" style={{ opacity: 0.1, zIndex: 0 }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#d4a574" />
        </svg>
      </div>

      {/* ── Challenge Received Overlay ── */}
      {challenge && !challenge.rejected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,4,14,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: 'linear-gradient(145deg,#1e0d20,#12080d)', border: '1.5px solid rgba(167,139,250,0.35)', borderRadius: '2rem', padding: '2.5rem 2rem', maxWidth: '380px', width: '90%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', boxShadow: '0 0 60px rgba(167,139,250,0.2)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(167,139,250,0.15)', border: '2px solid rgba(167,139,250,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>⚔️</div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(167,139,250,0.7)', marginBottom: '0.4rem' }}>Challenge Received!</p>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'white', marginBottom: '0.25rem' }}>You got a battle request</h2>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>From Player_{(challenge.challenger_id || '').slice(0,6)}</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '1rem', padding: '0.9rem 1.5rem', width: '100%', display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>Exercise</p>
                <p style={{ fontSize: '0.9rem', fontWeight: 900, color: '#a78bfa', textTransform: 'capitalize' }}>{challenge.exercise}</p>
              </div>
              <div style={{ width: '1px', background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>Duration</p>
                <p style={{ fontSize: '0.9rem', fontWeight: 900, color: '#a78bfa' }}>{challenge.duration}s</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', width: '100%' }}>
              <button onClick={handleDeclineChallenge} style={{ padding: '0.9rem', borderRadius: '0.875rem', border: '1.5px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.08)', color: '#f87171', fontWeight: 900, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.15s' }}>✗ Decline</button>
              <button onClick={handleAcceptChallenge} style={{ padding: '0.9rem', borderRadius: '0.875rem', border: 'none', background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: 'white', fontWeight: 900, fontSize: '0.8rem', cursor: 'pointer', boxShadow: '0 6px 20px rgba(124,58,237,0.4)', transition: 'all 0.15s' }}>✓ Accept</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Challenge Rejected Toast ── */}
      {challenge?.rejected && (
        <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: 'rgba(239,68,68,0.15)', border: '1.5px solid rgba(239,68,68,0.4)', borderRadius: '1rem', padding: '0.75rem 1.5rem', color: '#f87171', fontWeight: 800, fontSize: '0.8rem', backdropFilter: 'blur(8px)' }}>
          ✗ Your challenge was declined.
        </div>
      )}
    </div>
  )
}
