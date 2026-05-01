/**
 * DuelSetup.jsx
 * Exercise + duration picker + mode-specific options (difficulty / room code)
 */
import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { socialAPI } from '../../api'

const EXERCISES = [
  { id: 'squats',        label: 'Squats',         icon: 'lucide:activity' },
  { id: 'pushups',       label: 'Push-ups',        icon: 'lucide:dumbbell' },
  { id: 'jumping_jacks', label: 'Jumping Jacks',   icon: 'lucide:zap' },
  { id: 'lunges',        label: 'Lunges',          icon: 'lucide:footprints' },
  { id: 'burpees',       label: 'Burpees',         icon: 'lucide:flame' },
]

const DURATIONS = [
  { secs: 60,  label: '1 Min',  icon: 'lucide:timer' },
  { secs: 120, label: '2 Min',  icon: 'lucide:timer' },
  { secs: 300, label: '5 Min',  icon: 'lucide:clock' },
]

const AI_DIFFICULTIES = [
  { id: 'easy',   label: 'Easy',   color: '#22d3ee', desc: '~10 reps/min, 72% accuracy' },
  { id: 'medium', label: 'Medium', color: '#a78bfa', desc: '~18 reps/min, 85% accuracy' },
  { id: 'hard',   label: 'Hard',   color: '#f87171', desc: '~28 reps/min, 94% accuracy' },
]

function Chip({ label, icon, selected, color = '#d4a574', onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: selected ? `${color}22` : 'rgba(255,255,255,0.04)',
        border: `1.5px solid ${selected ? color + '88' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '0.875rem',
        padding: '0.65rem 1rem',
        cursor: 'pointer',
        color: selected ? color : 'rgba(255,255,255,0.55)',
        fontSize: '0.72rem',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        transition: 'all 0.18s',
        whiteSpace: 'nowrap',
      }}
    >
      {icon && <Icon icon={icon} style={{ fontSize: '15px' }} />}
      {label}
    </button>
  )
}

export default function DuelSetup({ mode, onStart, onBack, socket }) {
  const [exercise,   setExercise]   = useState('squats')
  const [duration,   setDuration]   = useState(60)
  const [difficulty, setDifficulty] = useState('medium')
  const [roomCode,   setRoomCode]   = useState('')
  const [joining,    setJoining]    = useState(false)  // create vs join for friend mode
  const [friends,    setFriends]    = useState([])

  useEffect(() => {
    if (mode === 'friend') {
      socialAPI.getFriends?.()
        .then(f => {
          setFriends(f || []);
          // Auto-challenge if ID in URL
          const params = new URLSearchParams(window.location.search);
          const challengeId = params.get('challenge');
          if (challengeId) {
             const friend = f?.find(fr => fr.user_id === challengeId);
             if (friend) {
                // Wait for socket to be ready
                const checkSocket = setInterval(() => {
                  if (socket) {
                    handleChallenge(challengeId);
                    clearInterval(checkSocket);
                  }
                }, 500);
             }
          }
        })
        .catch(() => {})
    }
  }, [mode, socket])

  function handleChallenge(friendId) {
    if (!socket) return
    socket.send({ type: 'challenge_friend', friend_id: friendId, exercise, duration })
  }

  const modeLabel = mode === 'random' ? 'Random Battle' : mode === 'friend' ? 'Friend Battle' : 'AI Challenge'
  const modeIcon  = mode === 'random' ? 'lucide:shuffle' : mode === 'friend' ? 'lucide:users' : 'lucide:bot'

  function handleStart() {
    if (mode === 'friend' && joining) {
      onStart({ mode, exercise, duration, action: 'join', roomCode: roomCode.toUpperCase().trim() })
    } else {
      onStart({ mode, exercise, duration, difficulty, action: 'create' })
    }
  }

  const canStart = mode === 'friend' && joining ? roomCode.trim().length === 6 : true

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <Icon icon="lucide:chevron-left" style={{ fontSize: '20px' }} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Icon icon={modeIcon} style={{ color: '#d4a574', fontSize: '22px' }} />
          <h2 className="heading" style={{ fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '-0.03em' }}>{modeLabel}</h2>
        </div>
      </div>

      {/* Exercise picker */}
      <div style={{ background: 'rgba(42,18,32,0.5)', borderRadius: '1.5rem', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)', marginBottom: '1rem' }}>Select Exercise</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
          {EXERCISES.map(ex => (
            <Chip key={ex.id} label={ex.label} icon={ex.icon} selected={exercise === ex.id} onClick={() => setExercise(ex.id)} />
          ))}
        </div>
      </div>

      {/* Duration picker */}
      <div style={{ background: 'rgba(42,18,32,0.5)', borderRadius: '1.5rem', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)', marginBottom: '1rem' }}>Battle Duration</p>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          {DURATIONS.map(d => (
            <Chip key={d.secs} label={d.label} icon={d.icon} selected={duration === d.secs} onClick={() => setDuration(d.secs)} />
          ))}
        </div>
      </div>

      {/* AI difficulty */}
      {mode === 'ai' && (
        <div style={{ background: 'rgba(42,18,32,0.5)', borderRadius: '1.5rem', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)', marginBottom: '1rem' }}>AI Difficulty</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {AI_DIFFICULTIES.map(d => (
              <button key={d.id} onClick={() => setDifficulty(d.id)} style={{
                background: difficulty === d.id ? `${d.color}15` : 'rgba(255,255,255,0.03)',
                border: `1.5px solid ${difficulty === d.id ? d.color + '66' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: '0.875rem', padding: '0.75rem 1rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'all 0.18s',
              }}>
                <span style={{ color: difficulty === d.id ? d.color : 'rgba(255,255,255,0.55)', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{d.label}</span>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem' }}>{d.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Friend room options */}
      {mode === 'friend' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Online Friends List */}
          <div style={{ background: 'rgba(42,18,32,0.5)', borderRadius: '1.5rem', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)', marginBottom: '1rem' }}>Online Friends</p>
            {friends.filter(f => f.is_online).length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>No friends currently online.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {friends.filter(f => f.is_online).map(f => (
                  <div key={f.user_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>{f.username}</span>
                    </div>
                    <button onClick={() => handleChallenge(f.user_id)} style={{ background: '#d4a574', color: '#12080d', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer' }}>
                      Challenge
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: 'rgba(42,18,32,0.5)', borderRadius: '1.5rem', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem' }}>
              {['Create Room', 'Join Room'].map((t, i) => (
                <button key={t} onClick={() => setJoining(i === 1)} style={{
                  flex: 1, padding: '0.6rem', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: 800,
                  fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em',
                  background: joining === (i === 1) ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${joining === (i === 1) ? '#a78bfa66' : 'rgba(255,255,255,0.08)'}`,
                  color: joining === (i === 1) ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                  transition: 'all 0.18s',
                }}>{t}</button>
              ))}
            </div>
            {joining ? (
              <div>
                <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem' }}>Enter the 6-character room code</p>
                <input
                  maxLength={6}
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A1B2C3"
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.12)',
                    borderRadius: '0.75rem', padding: '0.75rem 1rem', color: 'white', fontSize: '1.1rem',
                    fontWeight: 900, letterSpacing: '0.25em', textAlign: 'center', textTransform: 'uppercase',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            ) : (
              <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
                A unique room code will be generated. Share it with your friend to start the battle.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Start button */}
      <button
        onClick={handleStart}
        disabled={!canStart}
        style={{
          background: canStart ? 'linear-gradient(135deg, #d4a574, #e89b7b)' : 'rgba(255,255,255,0.08)',
          color: canStart ? '#12080d' : 'rgba(255,255,255,0.3)',
          fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.15em',
          padding: '1.1rem', borderRadius: '0.875rem', border: 'none', cursor: canStart ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
          boxShadow: canStart ? '0 8px 24px rgba(212,165,116,0.3)' : 'none',
        }}
      >
        <Icon icon="lucide:swords" style={{ fontSize: '18px' }} />
        {mode === 'friend' && joining ? 'Join Battle' : 'Start Battle'}
      </button>
    </div>
  )
}
