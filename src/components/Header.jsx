import { motion } from 'framer-motion';
import { RACES } from '../data/raceData';
import LiveRaceSelector from './LiveRaceSelector';

export default function Header({ mode, onModeChange, selectedRace, onRaceChange, selectedMeeting, onMeetingChange }) {
  const isLive = mode === 'live';

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(5, 5, 8, 0.88)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 32px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
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

      {/* Right side controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

        {/* Mode toggle */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px',
          padding: '3px',
          gap: '2px',
        }}>
          {[
            { id: 'mock', label: 'Demo' },
            { id: 'live', label: '2026 Live' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => onModeChange(opt.id)}
              style={{
                padding: '5px 14px',
                borderRadius: '7px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                fontFamily: 'Inter, sans-serif',
                transition: 'all 0.2s',
                background: mode === opt.id
                  ? opt.id === 'live' ? 'rgba(232,0,45,0.15)' : 'rgba(255,255,255,0.08)'
                  : 'transparent',
                color: mode === opt.id
                  ? opt.id === 'live' ? '#e8002d' : 'var(--text-primary)'
                  : 'rgba(238,238,255,0.35)',
                position: 'relative',
              }}
            >
              {opt.id === 'live' && (
                <span style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#e8002d',
                  marginRight: '6px',
                  verticalAlign: 'middle',
                  boxShadow: mode === 'live' ? '0 0 6px #e8002d' : 'none',
                  opacity: mode === 'live' ? 1 : 0.4,
                  transition: 'all 0.2s',
                }} />
              )}
              {opt.label}
            </button>
          ))}
        </div>

        {/* Race selector — demo mode */}
        {!isLive && (
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
                }}
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
        )}

        {/* Race selector — live mode */}
        {isLive && (
          <LiveRaceSelector selectedMeeting={selectedMeeting} onSelect={onMeetingChange} />
        )}
      </div>
    </motion.header>
  );
}
