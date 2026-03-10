import { motion } from 'framer-motion';
import { RACES } from '../data/raceData';

export default function Header({ selectedRace, onRaceChange }) {
  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(5, 5, 8, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 32px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Logo + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* F1 Red bar accent */}
          <div style={{
            width: '3px',
            height: '28px',
            background: 'linear-gradient(180deg, #e8002d 0%, rgba(232,0,45,0.3) 100%)',
            borderRadius: '2px',
            boxShadow: '0 0 12px rgba(232,0,45,0.6)',
          }} />
          <div>
            <div className="orbitron" style={{ fontSize: '11px', color: 'rgba(238,238,255,0.4)', letterSpacing: '3px', marginBottom: '1px' }}>
              FORMULA 1
            </div>
            <div className="orbitron" style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '1px' }}>
              Race Pace Analyzer
            </div>
          </div>
        </div>
      </div>

      {/* Race Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12px', color: 'rgba(238,238,255,0.35)', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Race
        </span>
        <div style={{ position: 'relative' }}>
          <select
            value={selectedRace}
            onChange={e => onRaceChange(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-primary)',
              padding: '8px 36px 8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              cursor: 'pointer',
              outline: 'none',
              appearance: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(232,0,45,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          >
            {RACES.map(r => (
              <option key={r.id} value={r.id} style={{ background: '#0c0c18' }}>
                {r.label}
              </option>
            ))}
          </select>
          <svg
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="10" height="6" viewBox="0 0 10 6" fill="none"
          >
            <path d="M1 1L5 5L9 1" stroke="rgba(238,238,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
    </motion.header>
  );
}
