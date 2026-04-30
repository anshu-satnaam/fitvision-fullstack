export default function HeroPanel({ heroRef, onMouseMove }) {
  return (
    <div
      ref={heroRef}
      onMouseMove={onMouseMove}
      id="hero-section"
      style={{
        flex: 1,
        display: 'none',
        position: 'relative',
        overflow: 'hidden',
        background: '#12080d',
      }}
      className="lg-hero"
    >
      {/* Gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, #2a1220 0%, #12080d 50%, #000 100%)',
        zIndex: 0,
      }} />

      {/* Wave */}
      <div className="wave-bg" style={{ opacity: 0.2, zIndex: 0 }}>
        <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#d4a574" />
        </svg>
      </div>

      {/* Parallax ghost text */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
        <div data-depth="0.1" className="parallax-layer" style={{
          position: 'absolute', top: '10%', left: '5%',
          fontSize: '20rem', fontFamily: 'CabinetGrotesk, sans-serif',
          color: 'rgba(255,255,255,0.03)', userSelect: 'none', lineHeight: 1, letterSpacing: '-0.05em',
        }}>ELITE</div>
        <div data-depth="0.2" className="parallax-layer" style={{
          position: 'absolute', bottom: '10%', right: '5%',
          fontSize: '15rem', fontFamily: 'CabinetGrotesk, sans-serif',
          color: 'rgba(212,165,116,0.03)', userSelect: 'none', lineHeight: 1, letterSpacing: '-0.05em',
        }}>CORE</div>
      </div>

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '42rem', padding: '5rem', display: 'flex', flexDirection: 'column' }}>
        {/* EST */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }} className="animate-pulse-slow">
          <div style={{ width: '48px', height: '1px', background: '#d4a574' }} />
          <span style={{ color: '#d4a574', fontWeight: 700, letterSpacing: '0.4em', textTransform: 'uppercase', fontSize: '0.75rem' }}>
            EST. MMXXIV
          </span>
        </div>

        {/* Headline */}
        <div data-depth="0.05" className="parallax-layer">
          <h1 className="heading" style={{
            fontSize: 'clamp(4rem, 8vw, 6.5rem)',
            color: 'white',
            lineHeight: 0.85,
            letterSpacing: '-0.04em',
            textTransform: 'uppercase',
            marginBottom: '2rem',
          }}>
            ASCEND<br />
            <span style={{
              backgroundImage: 'linear-gradient(90deg, #d4a574, white)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>BEYOND</span><br />
            LIMITS.
          </h1>
        </div>

        {/* Quote */}
        <p data-depth="0.08" className="parallax-layer" style={{
          fontSize: '1.1rem',
          color: 'rgba(226,226,226,0.4)',
          lineHeight: 1.7,
          maxWidth: '28rem',
          marginBottom: '3rem',
          fontStyle: 'italic',
        }}>
          "The separation between the possible and the impossible is defined only by the intensity of your will."
        </p>

        {/* Stats */}
        <div data-depth="0.12" className="parallax-layer" style={{ display: 'flex', gap: '3rem' }}>
          {[
            { value: '850+', label: 'Modules' },
            { value: 'PRO',  label: 'Protocols' },
            { value: '100%', label: 'Results' },
          ].map((s) => (
            <div key={s.label} style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="heading" style={{ fontSize: '3rem', color: 'white', letterSpacing: '-0.04em', lineHeight: 1 }}>
                {s.value.replace('+', '')}
                {s.value.includes('+') && <span style={{ color: '#d4a574' }}>+</span>}
                {s.value.includes('%') && <span style={{ color: '#d4a574' }}>%</span>}
                {s.value === 'PRO' && ''}
              </span>
              <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.2em', marginTop: '0.25rem' }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Image Card */}
      <div data-depth="0.2" className="parallax-layer" style={{
        position: 'absolute',
        bottom: '5rem',
        right: '5rem',
        width: '20rem',
        height: '24rem',
        zIndex: 10,
      }}>
        <div style={{
          width: '100%', height: '100%',
          borderRadius: '1.5rem',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
          position: 'relative',
        }}>
          <img
            src="https://images.unsplash.com/photo-1593079831268-3381b0db4a77?q=80&w=800&auto=format&fit=crop"
            alt="Vanguard Protocol athlete"
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover',
              filter: 'grayscale(100%)',
              opacity: 0.4,
              transition: 'filter 0.7s, opacity 0.7s, transform 0.7s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.filter = 'grayscale(0%)'
              e.currentTarget.style.opacity = '0.85'
              e.currentTarget.style.transform = 'scale(1.08)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.filter = 'grayscale(100%)'
              e.currentTarget.style.opacity = '0.4'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, #12080d 10%, transparent 70%)',
          }} />
          <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem' }}>
            <p className="heading" style={{ fontSize: '1.4rem', color: 'white', textTransform: 'uppercase', lineHeight: 1.2 }}>
              Vanguard<br />Protocol
            </p>
            <div style={{ display: 'flex', gap: '4px', marginTop: '0.5rem', position: 'relative' }}>
              <div style={{ width: '8px', height: '8px', background: '#d4a574', borderRadius: '50%' }} className="animate-ping" />
              <div style={{ width: '8px', height: '8px', background: '#d4a574', borderRadius: '50%', position: 'absolute' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Community Badge */}
      <div data-depth="0.15" className="parallax-layer" style={{
        position: 'absolute',
        bottom: '3rem',
        left: '5rem',
        padding: '2rem',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '2rem',
        backdropFilter: 'blur(20px)',
        background: 'rgba(255,255,255,0.02)',
        boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex' }}>
          {['a1', 'a2', 'a3'].map((u, i) => (
            <img
              key={u}
              src={`https://i.pravatar.cc/150?u=${u}`}
              alt="Community member"
              style={{
                width: '40px', height: '40px',
                borderRadius: '50%',
                border: '2px solid #2a1220',
                outline: '2px solid rgba(212,165,116,0.2)',
                marginLeft: i > 0 ? '-12px' : 0,
              }}
            />
          ))}
        </div>
        <div>
          <p style={{ color: 'white', fontWeight: 900, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
            Live Community
          </p>
          <p style={{ color: '#d4a574', fontSize: '0.625rem', fontWeight: 700 }}>
            12.4K MEMBERS ACTIVE NOW
          </p>
        </div>
      </div>

      {/* Responsive CSS injected */}
      <style>{`
        @media (min-width: 1024px) {
          .lg-hero { display: flex !important; flex-direction: column; align-items: center; justify-content: center; }
        }
      `}</style>
    </div>
  )
}
