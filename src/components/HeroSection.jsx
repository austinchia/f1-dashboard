import HeroNavbar from './HeroNavbar';
import ScrollPrompt from './ScrollPrompt';
import f1CarPng from '../assets/f1-car.png';

export default function HeroSection() {
  function scrollToDashboard(e) {
    e.preventDefault();
    document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <section
      style={{
        position: 'relative',
        height: '100svh',
        minHeight: '580px',
        background: '#191A1B',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <HeroNavbar />

      {/* ── Diagonal slash band 1 (wide red, from upper-right) ── */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        right: '-15%',
        width: '75%',
        height: '200%',
        background: '#e8002d',
        transform: 'rotate(35deg)',
        transformOrigin: 'top right',
        zIndex: 1,
      }} />

      {/* ── Diagonal slash band 2 (dark gap, creates two-stripe look) ── */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        right: '-15%',
        width: '58%',
        height: '200%',
        background: '#191A1B',
        transform: 'rotate(35deg)',
        transformOrigin: 'top right',
        zIndex: 2,
      }} />

      {/* ── Text block — upper center ── */}
      <div style={{
        position: 'relative',
        zIndex: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        paddingTop: '112px',
        paddingLeft: '24px',
        paddingRight: '24px',
        flexShrink: 0,
      }}>
        {/* Eyebrow */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '18px',
          opacity: 0,
          animation: 'hero-fade-up 0.6s ease-out 0.05s forwards',
        }}>
          <div style={{ width: '24px', height: '2px', background: '#e8002d', boxShadow: '0 0 8px rgba(232,0,45,0.7)' }} />
          <span className="orbitron" style={{ fontSize: '10px', letterSpacing: '4px', color: '#e8002d' }}>
            2024 – 2025 Season
          </span>
          <div style={{ width: '24px', height: '2px', background: '#e8002d', boxShadow: '0 0 8px rgba(232,0,45,0.7)' }} />
        </div>

        {/* Headline */}
        <h1
          className="orbitron"
          style={{
            fontSize: 'clamp(32px, 6vw, 72px)',
            fontWeight: 900,
            lineHeight: 1.08,
            textTransform: 'uppercase',
            color: '#f0f0ff',
            margin: '0 0 14px',
            opacity: 0,
            animation: 'hero-fade-up 0.7s ease-out 0.15s forwards',
          }}
        >
          Race Positions
          <br />
          <span style={{ color: '#f0f0ff' }}>Like a </span>
          <span style={{ color: '#e8002d' }}>Pro.</span>
        </h1>

        {/* Tagline */}
        <p style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 'clamp(13px, 1.5vw, 16px)',
          fontWeight: 400,
          lineHeight: 1.6,
          color: 'rgba(240,240,255,0.5)',
          margin: '0 0 28px',
          maxWidth: '420px',
          opacity: 0,
          animation: 'hero-fade-up 0.7s ease-out 0.28s forwards',
        }}>
          Watch every overtake unfold lap by lap. Interactive animations powered by real FastF1 telemetry.
        </p>

        {/* CTA */}
        <div style={{ opacity: 0, animation: 'hero-fade-up 0.7s ease-out 0.4s forwards' }}>
          <a
            href="#dashboard"
            onClick={scrollToDashboard}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontWeight: 600,
              fontSize: '14px',
              color: '#fff',
              textDecoration: 'none',
              background: '#e8002d',
              padding: '12px 28px',
              borderRadius: '8px',
              boxShadow: '0 0 24px rgba(232,0,45,0.35)',
              transition: 'background 0.2s, box-shadow 0.2s, transform 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#c8001a';
              e.currentTarget.style.boxShadow = '0 0 32px rgba(232,0,45,0.5)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#e8002d';
              e.currentTarget.style.boxShadow = '0 0 24px rgba(232,0,45,0.35)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Open Dashboard
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7H11.5M11.5 7L7.5 3M11.5 7L7.5 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </div>

      {/* ── F1 Car — lower portion, wide, on top of everything ── */}
      <div style={{
        position: 'absolute',
        bottom: '-2%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(92%, 1100px)',
        zIndex: 3,
        opacity: 0,
        animation: 'hero-car-in 1s ease-out 0.5s forwards',
        filter: 'drop-shadow(0 -4px 40px rgba(232,0,45,0.18)) drop-shadow(0 20px 40px rgba(0,0,0,0.7))',
      }}>
        <img
          src={f1CarPng}
          alt="F1 race car"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      </div>

      <ScrollPrompt />

      <style>{`
        @keyframes hero-fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hero-car-in {
          from { opacity: 0; transform: translateX(-50%) translateY(24px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </section>
  );
}
