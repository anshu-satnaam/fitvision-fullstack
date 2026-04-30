import { useRef } from 'react'
import FloatingParticles from './FloatingParticles'
import LeftPanel from './LeftPanel'
import HeroPanel from './HeroPanel'

export default function AuthPage() {
  const heroRef = useRef(null)

  const handleMouseMove = (e) => {
    const hero = heroRef.current
    if (!hero) return
    const rect = hero.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    hero.querySelectorAll('[data-depth]').forEach((layer) => {
      const depth = parseFloat(layer.getAttribute('data-depth'))
      const moveX = (x - 0.5) * depth * 150
      const moveY = (y - 0.5) * depth * 150
      layer.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`
    })
  }

  return (
    <div
      id="main-container"
      className="min-h-screen flex flex-col lg:flex-row overflow-hidden relative"
      style={{ background: '#12080d' }}
    >
      <FloatingParticles />
      <LeftPanel />
      <HeroPanel heroRef={heroRef} onMouseMove={handleMouseMove} />
    </div>
  )
}
