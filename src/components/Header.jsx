import { motion } from 'framer-motion';

export default function Header({ races, selectedRace, onRaceChange, years, selectedYear, onYearChange, theme, onThemeToggle }) {
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

      {/* Race selector + Year picker — order 2 desktop, order 3 mobile (CSS handles this) */}
      <div className="header-tabs-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Race dropdown */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <select
            value={selectedRace}
            onChange={e => onRaceChange(e.target.value)}
            style={{
              appearance: 'none',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              padding: '7px 36px 7px 12px',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
              minWidth: '160px',
            }}
          >
            {races.map(race => (
              <option key={race.id} value={race.id} style={{ background: '#191A1B', color: 'var(--text-primary)' }}>
                {race.label}
              </option>
            ))}
          </select>
          <svg
            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="12" height="12" viewBox="0 0 12 12" fill="none"
          >
            <path d="M2 4L6 8L10 4" stroke="#e8002d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Year picker segmented control */}
        <div style={{ display: 'flex', background: 'rgba(128,128,128,0.08)', border: '1px solid var(--border)', borderRadius: '8px', padding: '3px', gap: '2px' }}>
          {years.map(year => {
            const active = year === selectedYear;
            return (
              <button
                key={year}
                onClick={() => onYearChange(year)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 700,
                  fontFamily: 'Orbitron, monospace',
                  letterSpacing: '0.5px',
                  transition: 'all 0.2s',
                  background: active ? 'rgba(232,0,45,0.15)' : 'transparent',
                  color: active ? '#e8002d' : 'var(--text-muted)',
                }}
              >
                {year}
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
