/**
 * DuelResults.jsx — Post-battle results screen
 */
import { Icon } from '@iconify/react'

export default function DuelResults({ result, onPlayAgain, onLobby }) {
  if (!result) return null

  const { winnerId, scores = {}, myId, myReps, myAcc, opponent, exercise, duration } = result

  const iWon    = winnerId === myId
  const isDraw  = !winnerId
  const oppName = opponent?.username || 'Opponent'

  // Find opponent reps from scores
  const oppReps = Object.entries(scores)
    .filter(([k]) => k !== myId && k !== 'me')
    .map(([, v]) => v?.reps ?? 0)[0] ?? 0

  const accent      = iWon ? '#d4a574' : isDraw ? '#a78bfa' : '#f87171'
  const resultLabel = iWon ? '🏆 Victory!' : isDraw ? '🤝 Draw!' : '💪 Defeated!'
  const resultMsg   = iWon
    ? `You beat ${oppName} with ${myReps} reps. Incredible!`
    : isDraw
    ? 'Both finished with the same reps. Rematch?'
    : `${oppName} edged you out. Keep training!`

  const xpGained       = iWon ? 250 : isDraw ? 100 : 50
  const durationLabel  = duration === 60 ? '1 Min' : duration === 120 ? '2 Min' : '5 Min'
  const exerciseLabel  = (exercise || '').replace(/_/g, ' ')

  return (
    <div style={{ maxWidth: '540px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center', textAlign: 'center' }}>

      {/* Trophy animation */}
      <div style={{
        width: '110px', height: '110px', borderRadius: '50%',
        background: `${accent}18`, border: `3px solid ${accent}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 50px ${accent}33`,
        animation: 'resultPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275)',
      }}>
        <span style={{ fontSize: '3.2rem' }}>{iWon ? '🏆' : isDraw ? '🤝' : '💔'}</span>
      </div>

      {/* Headline */}
      <div>
        <h1 className="heading" style={{ fontSize: 'clamp(2rem,5vw,3rem)', textTransform: 'uppercase', letterSpacing: '-0.04em', color: accent, lineHeight: 1 }}>
          {resultLabel}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginTop: '0.6rem', lineHeight: 1.6 }}>{resultMsg}</p>
      </div>

      {/* Score card */}
      <div style={{ width: '100%', background: 'rgba(42,18,32,0.55)', borderRadius: '2rem', padding: '2rem', border: `1px solid ${accent}22`, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Side-by-side scores */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '2.8rem', fontWeight: 900, color: iWon ? '#d4a574' : 'white', display: 'block', lineHeight: 1 }}>{myReps}</span>
            <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Your Reps</span>
            <span style={{ display: 'block', fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.15rem' }}>{myAcc}% accuracy</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
            <span className="heading" style={{ fontSize: '1.4rem', color: 'rgba(255,255,255,0.2)' }}>VS</span>
            {iWon  && <span style={{ fontSize: '1rem' }}>👑</span>}
            {isDraw && <span style={{ fontSize: '1rem' }}>⚖️</span>}
            {!iWon && !isDraw && <span style={{ fontSize: '1rem' }}>😤</span>}
          </div>

          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '2.8rem', fontWeight: 900, color: !iWon && !isDraw ? '#f87171' : 'white', display: 'block', lineHeight: 1 }}>{oppReps}</span>
            <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{oppName}</span>
          </div>
        </div>

        {/* Stat chips */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
          {[
            { label: 'Exercise', value: exerciseLabel || '—', icon: 'lucide:activity', color: '#d4a574' },
            { label: 'Duration', value: durationLabel, icon: 'lucide:timer', color: '#22d3ee' },
            { label: 'XP Earned', value: `+${xpGained}`, icon: 'lucide:zap', color: '#fbbf24' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '1rem', padding: '0.85rem 0.5rem', textAlign: 'center' }}>
              <Icon icon={s.icon} style={{ color: s.color, fontSize: '20px', marginBottom: '0.35rem' }} />
              <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 900, color: s.color, textTransform: 'capitalize' }}>{s.value}</span>
              <span style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA buttons */}
      <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
        <button
          id="btn-play-again"
          onClick={onPlayAgain}
          style={{
            flex: 2, background: 'linear-gradient(135deg, #d4a574, #e89b7b)', border: 'none',
            borderRadius: '0.875rem', padding: '1.1rem', cursor: 'pointer', color: '#12080d',
            fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            boxShadow: '0 8px 24px rgba(212,165,116,0.3)',
            transition: 'all 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.opacity = '0.88'}
          onMouseOut={e => e.currentTarget.style.opacity = '1'}
        >
          <Icon icon="lucide:refresh-cw" style={{ fontSize: '16px' }} />
          Play Again
        </button>
        <button
          id="btn-back-lobby"
          onClick={onLobby}
          style={{
            flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '0.875rem', padding: '1.1rem', cursor: 'pointer', color: 'white',
            fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em',
            transition: 'all 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
          Lobby
        </button>
      </div>

      <style>{`
        @keyframes resultPop {
          from { transform: scale(0.4); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  )
}
