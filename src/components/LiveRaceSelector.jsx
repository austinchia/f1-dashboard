import { motion, AnimatePresence } from 'framer-motion';
import { useMeetings } from '../hooks/useOpenF1';

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(238,238,255,0.4)', fontSize: '13px' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{
          width: '14px', height: '14px',
          border: '2px solid rgba(232,0,45,0.2)',
          borderTopColor: '#e8002d',
          borderRadius: '50%',
        }}
      />
      Loading 2026 calendar…
    </div>
  );
}

export default function LiveRaceSelector({ selectedMeeting, onSelect }) {
  const { meetings, loading, error } = useMeetings(2026);

  if (loading) return <Spinner />;

  if (error) return (
    <div style={{ fontSize: '13px', color: 'rgba(232,0,45,0.7)', padding: '8px 0' }}>
      Could not load 2026 calendar: {error}
    </div>
  );

  if (!meetings.length) return (
    <div style={{ fontSize: '13px', color: 'rgba(238,238,255,0.35)', padding: '8px 0' }}>
      No completed 2026 races yet — check back after the season opener.
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
    >
      <span style={{ fontSize: '12px', color: 'rgba(238,238,255,0.35)', letterSpacing: '1px', textTransform: 'uppercase' }}>
        Race
      </span>
      <div style={{ position: 'relative' }}>
        <select
          value={selectedMeeting ?? ''}
          onChange={e => onSelect(e.target.value ? Number(e.target.value) : null)}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(232,0,45,0.3)',
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
          <option value="" style={{ background: '#0c0c18' }}>Select a race…</option>
          {meetings.map(m => (
            <option key={m.meeting_key} value={m.meeting_key} style={{ background: '#0c0c18' }}>
              {m.meeting_name} · {m.location}
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
    </motion.div>
  );
}
