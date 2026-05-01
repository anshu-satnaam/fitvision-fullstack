/**
 * DuelLobby.jsx — Mode selection (Random / Friend / AI)
 */
import { Icon } from '@iconify/react'

const MODES = [
  {
    id: 'random',
    icon: 'lucide:shuffle',
    title: 'Random Battle',
    desc: 'Get matched with a live player worldwide in seconds.',
    badge: 'LIVE',
    badgeColor: '#10b981',
    accent: '#d4a574',
  },
  {
    id: 'friend',
    icon: 'lucide:users',
    title: 'Battle Friend',
    desc: 'Create a private room & share the code with your friend.',
    badge: 'INVITE',
    badgeColor: '#a78bfa',
    accent: '#a78bfa',
  },
  {
    id: 'ai',
    icon: 'lucide:bot',
    title: 'Challenge AI',
    desc: 'Face our humanoid robot — choose Easy, Medium, or Hard.',
    badge: 'ROBOT',
    badgeColor: '#22d3ee',
    accent: '#22d3ee',
  },
]

export default function DuelLobby({ onSelect }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2.5rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <h1 className="heading" style={{ fontSize: 'clamp(2rem,5vw,3.2rem)', textTransform: 'uppercase', letterSpacing: '-0.04em', lineHeight: 1 }}>
          Choose Your <span style={{ color: '#d4a574' }}>Battle</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: '0.75rem' }}>
          Rep battles — most correct reps in the time limit wins
        </p>
      </div>

      {/* Mode cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', width: '100%', maxWidth: '860px' }}>
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            style={{
              background: 'rgba(42,18,32,0.5)',
              border: `1.5px solid rgba(255,255,255,0.07)`,
              borderRadius: '2rem',
              padding: '2rem',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              transition: 'all 0.25s',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseOver={e => {
              e.currentTarget.style.borderColor = m.accent + '66'
              e.currentTarget.style.background = 'rgba(61,26,45,0.6)'
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = `0 16px 40px ${m.accent}22`
            }}
            onMouseOut={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
              e.currentTarget.style.background = 'rgba(42,18,32,0.5)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {/* Glow blob */}
            <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '100px', height: '100px', background: m.accent, opacity: 0.06, borderRadius: '50%', pointerEvents: 'none' }} />

            {/* Icon + badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '1rem', background: `${m.accent}18`, border: `1px solid ${m.accent}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon icon={m.icon} style={{ color: m.accent, fontSize: '26px' }} />
              </div>
              <span style={{ background: `${m.badgeColor}22`, color: m.badgeColor, fontSize: '0.55rem', fontWeight: 900, letterSpacing: '0.12em', padding: '0.2rem 0.7rem', borderRadius: '9999px', border: `1px solid ${m.badgeColor}44` }}>
                {m.badge}
              </span>
            </div>

            {/* Title + desc */}
            <div>
              <h3 className="heading" style={{ fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '-0.02em', color: 'white', marginBottom: '0.4rem' }}>{m.title}</h3>
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{m.desc}</p>
            </div>

            {/* Arrow */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: m.accent, fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 'auto' }}>
              Select <Icon icon="lucide:arrow-right" style={{ fontSize: '14px' }} />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
