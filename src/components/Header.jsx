import { motion } from 'framer-motion';

export default function Header({ races, selectedRace, onRaceChange, theme, onThemeToggle }) {
  return (
    <motion.header
      className="header-root"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'var(--header-bg)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      {/* Logo — always first, takes remaining space so toggle sits at end of row */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', order: 1 }}>
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

      {/* Race tabs — order 2 desktop, order 3 mobile (CSS handles this) */}
      <div className="header-tabs-wrapper">
        <div style={{
          display: 'flex',
          background: 'rgba(128,128,128,0.08)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '3px',
          gap: '2px',
        }}>
          {races.map(race => {
            const active = race.id === selectedRace;
            return (
              <button
                key={race.id}
                onClick={() => onRaceChange(race.id)}
                style={{
                  padding: '5px 14px',
                  borderRadius: '7px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  fontFamily: 'Inter, sans-serif',
                  transition: 'all 0.2s',
                  background: active ? 'rgba(232,0,45,0.15)' : 'transparent',
                  color: active ? '#e8002d' : 'var(--text-muted)',
                }}
              >
                {race.label.replace(' Grand Prix', '')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Theme toggle — order 3 desktop, order 2 mobile (CSS handles this) */}
      <button
        className="header-toggle"
        onClick={onThemeToggle}
        aria-label="Toggle theme"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{
          width: '38px',
          height: '22px',
          borderRadius: '11px',
          border: '1px solid var(--border)',
          background: theme === 'dark' ? 'rgba(255,255,255,0.08)' : '#e8002d',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          padding: '2px',
          transition: 'background 0.3s',
          flexShrink: 0,
        }}
      >
        <div style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: theme === 'dark' ? 'rgba(255,255,255,0.5)' : '#fff',
          transform: theme === 'dark' ? 'translateX(0)' : 'translateX(16px)',
          transition: 'transform 0.3s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '9px',
          lineHeight: 1,
        }}>
          {theme === 'dark' ? '🌙' : '☀️'}
        </div>
      </button>

    </motion.header>
  );
}
