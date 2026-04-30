export default function FloatingParticles() {
  const particles = [
    { w: 'w-1', h: 'h-12', left: '25%', delay: '0s' },
    { w: 'w-2', h: 'h-20', left: '50%', delay: '-5s' },
    { w: 'w-1', h: 'h-10', left: '75%', delay: '-12s' },
    { w: 'w-1', h: 'h-16', left: '10%', delay: '-7s' },
    { w: 'w-2', h: 'h-8',  left: '88%', delay: '-3s' },
  ]

  return (
    <>
      {particles.map((p, i) => (
        <div
          key={i}
          className="floating-particle"
          style={{
            width:  p.w === 'w-1' ? '4px' : '8px',
            height: p.h === 'h-12' ? '48px' : p.h === 'h-20' ? '80px' : p.h === 'h-10' ? '40px' : p.h === 'h-16' ? '64px' : '32px',
            left:   p.left,
            top:    '100%',
            animationDelay: p.delay,
          }}
        />
      ))}
    </>
  )
}
