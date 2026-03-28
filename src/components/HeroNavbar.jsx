export default function HeroNavbar() {
  return (
    <nav
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 32px',
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
          <div className="orbitron" style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '1px', color: 'var(--text-primary)' }}>
            DataLap F1
          </div>
        </div>
      </div>

    </nav>
  );
}
