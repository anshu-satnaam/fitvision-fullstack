/**
 * AiHumanoid.jsx
 * Animated SVG humanoid figure doing exercises at different speeds
 * based on AI difficulty (easy / medium / hard).
 */
import { useEffect, useRef } from 'react'

const SPEEDS = { easy: 1.8, medium: 1.0, hard: 0.55 }
const COLORS = { easy: '#22d3ee', medium: '#a78bfa', hard: '#f87171' }

export default function AiHumanoid({ difficulty = 'medium', exercise = 'squats', isActive = false, repCount = 0 }) {
  const dur  = SPEEDS[difficulty]
  const col  = COLORS[difficulty]

  const animId = `bot-anim-${difficulty}`

  const squatAnim = `
    @keyframes squat-body-${difficulty} {
      0%,100% { transform: translateY(0); }
      50%      { transform: translateY(18px); }
    }
    @keyframes squat-leg-l-${difficulty} {
      0%,100% { transform: rotate(0deg); }
      50%      { transform: rotate(40deg); }
    }
    @keyframes squat-leg-r-${difficulty} {
      0%,100% { transform: rotate(0deg); }
      50%      { transform: rotate(-40deg); }
    }
  `

  const pushupAnim = `
    @keyframes pushup-body-${difficulty} {
      0%,100% { transform: translateY(0) rotate(-5deg); }
      50%      { transform: translateY(10px) rotate(-5deg); }
    }
    @keyframes pushup-arm-${difficulty} {
      0%,100% { transform: rotate(20deg); }
      50%      { transform: rotate(70deg); }
    }
  `

  const jumpAnim = `
    @keyframes jump-body-${difficulty} {
      0%,100% { transform: translateY(0); }
      40%      { transform: translateY(-12px); }
      60%      { transform: translateY(-12px); }
    }
    @keyframes jump-arm-l-${difficulty} {
      0%,100% { transform: rotate(-30deg); }
      50%      { transform: rotate(-130deg); }
    }
    @keyframes jump-arm-r-${difficulty} {
      0%,100% { transform: rotate(30deg); }
      50%      { transform: rotate(130deg); }
    }
    @keyframes jump-leg-l-${difficulty} {
      0%,100% { transform: rotate(0deg); }
      50%      { transform: rotate(-30deg); }
    }
    @keyframes jump-leg-r-${difficulty} {
      0%,100% { transform: rotate(0deg); }
      50%      { transform: rotate(30deg); }
    }
  `

  const css = exercise === 'squats' ? squatAnim
    : exercise === 'pushups' ? pushupAnim
    : jumpAnim

  // If repCount > 0, we animate once. We use the key on the SVG to remount and trigger it.
  const shouldAnimate = isActive && repCount > 0

  const bodyStyle = shouldAnimate ? {
    animation: exercise === 'squats'
      ? `squat-body-${difficulty} ${dur}s ease-in-out 1`
      : exercise === 'pushups'
      ? `pushup-body-${difficulty} ${dur}s ease-in-out 1`
      : `jump-body-${difficulty} ${dur}s ease-in-out 1`,
  } : {}

  const lArmStyle = shouldAnimate ? {
    transformOrigin: '24px 33px', // Relative to actual x,y
    animation: exercise === 'jumping_jacks'
      ? `jump-arm-l-${difficulty} ${dur}s ease-in-out 1`
      : exercise === 'pushups'
      ? `pushup-arm-${difficulty} ${dur}s ease-in-out 1`
      : 'none',
  } : {}

  const rArmStyle = shouldAnimate ? {
    transformOrigin: '56px 33px',
    animation: exercise === 'jumping_jacks'
      ? `jump-arm-r-${difficulty} ${dur}s ease-in-out 1`
      : exercise === 'pushups'
      ? `pushup-arm-${difficulty} ${dur}s ease-in-out 1`
      : 'none',
  } : {}

  const lLegStyle = shouldAnimate ? {
    transformOrigin: '34px 60px', // Center of left leg (x=29, width=10)
    animation: exercise === 'jumping_jacks'
      ? `jump-leg-l-${difficulty} ${dur}s ease-in-out 1`
      : exercise === 'squats'
      ? `squat-leg-l-${difficulty} ${dur}s ease-in-out 1`
      : 'none',
  } : {}

  const rLegStyle = shouldAnimate ? {
    transformOrigin: '46px 60px', // Center of right leg (x=41, width=10)
    animation: exercise === 'jumping_jacks'
      ? `jump-leg-r-${difficulty} ${dur}s ease-in-out 1`
      : exercise === 'squats'
      ? `squat-leg-r-${difficulty} ${dur}s ease-in-out 1`
      : 'none',
  } : {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <style>{css}</style>
      <svg width="80" height="120" viewBox="0 0 80 120" fill="none">
        <g style={bodyStyle}>
          {/* Head */}
          <circle cx="40" cy="18" r="12" fill={col} opacity="0.9" />
          {/* Eyes */}
          <circle cx="36" cy="17" r="2" fill="#12080d" />
          <circle cx="44" cy="17" r="2" fill="#12080d" />
          {/* Smile */}
          <path d="M36 22 Q40 25 44 22" stroke="#12080d" strokeWidth="1.5" fill="none" strokeLinecap="round" />

          {/* Torso */}
          <rect x="28" y="32" width="24" height="28" rx="5" fill={col} opacity="0.8" />

          {/* Left Arm */}
          <g style={lArmStyle}>
            <rect x="16" y="33" width="11" height="20" rx="5" fill={col} opacity="0.7" transform="rotate(-10 24 33)" />
          </g>
          {/* Right Arm */}
          <g style={rArmStyle}>
            <rect x="53" y="33" width="11" height="20" rx="5" fill={col} opacity="0.7" transform="rotate(10 56 33)" />
          </g>

          {/* Left Leg */}
          <g style={lLegStyle}>
            <rect x="29" y="60" width="10" height="26" rx="5" fill={col} opacity="0.75" />
            {/* Left foot */}
            <rect x="25" y="83" width="14" height="7" rx="3" fill={col} opacity="0.6" />
          </g>
          {/* Right Leg */}
          <g style={rLegStyle}>
            <rect x="41" y="60" width="10" height="26" rx="5" fill={col} opacity="0.75" />
            {/* Right foot */}
            <rect x="41" y="83" width="14" height="7" rx="3" fill={col} opacity="0.6" />
          </g>

          {/* Shadow/glow */}
          <ellipse cx="40" cy="95" rx="18" ry="4" fill={col} opacity="0.15" />
        </g>
      </svg>

      {/* Difficulty badge */}
      <div style={{
        background: `${col}22`,
        border: `1px solid ${col}55`,
        color: col,
        fontSize: '0.55rem',
        fontWeight: 900,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        padding: '0.2rem 0.7rem',
        borderRadius: '9999px',
      }}>
        🤖 AI · {difficulty}
      </div>
    </div>
  )
}
