import { useState, useEffect } from 'react';

export default function HeroNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function scrollToDashboard(e) {
    e.preventDefault();
    document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 32px',
        transition: 'background 0.35s, backdrop-filter 0.35s, border-color 0.35s',
        background: scrolled ? 'var(--header-bg)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
      }}
    >
      {/* Logo — mirrors the dashboard header exactly */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '3px',
          height: '28px',
          background: 'linear-gradient(180deg, #e8002d 0%, rgba(232,0,45,0.3) 100%)',
          borderRadius: '2px',
          boxShadow: '0 0 12px rgba(232,0,45,0.6)',
          flexShrink: 0,
        }} />
        <div>
          <div className="orbitron" style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '3px', marginBottom: '1px' }}>
            FORMULA 1
          </div>
          <div className="orbitron" style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '1px', color: 'var(--text-primary)' }}>
            Race Positions
          </div>
        </div>
      </div>

      {/* Nav link */}
      <a
        href="#dashboard"
        onClick={scrollToDashboard}
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 600,
          fontSize: '13px',
          letterSpacing: '0.02em',
          color: 'var(--text-muted)',
          textDecoration: 'none',
          padding: '8px 18px',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          background: 'var(--bg-card)',
          transition: 'color 0.2s, border-color 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = 'var(--text-primary)';
          e.currentTarget.style.borderColor = 'rgba(232,0,45,0.4)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = 'var(--text-muted)';
          e.currentTarget.style.borderColor = 'var(--border)';
        }}
      >
        Open Dashboard
      </a>
    </nav>
  );
}
