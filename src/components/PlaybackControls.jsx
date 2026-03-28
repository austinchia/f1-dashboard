export default function PlaybackControls({
  currentLap,
  totalLaps,
  isPlaying,
  isFinished,
  onPlay,
  onPause,
  onReplay,
  onScrub,
}) {
  // Build tick labels: lap 1, every 10 laps, final lap
  const ticks = [1];
  for (let l = 10; l < totalLaps; l += 10) ticks.push(l);
  if (!ticks.includes(totalLaps)) ticks.push(totalLaps);

  function handleScrub(e) {
    onScrub(Number(e.target.value));
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '14px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    }}>
      {/* Play / Pause */}
      <button
        onClick={isFinished ? onReplay : isPlaying ? onPause : onPlay}
        aria-label={isFinished ? 'Replay' : isPlaying ? 'Pause' : 'Play'}
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '8px',
          border: 'none',
          background: 'var(--accent-red)',
          color: '#fff',
          fontSize: '14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {isFinished ? (
          // Replay
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 8a6 6 0 1 0 1.2-3.6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
            <path d="M2 4.4V8h3.6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : isPlaying ? (
          // Pause — two bars
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="4" y="3" width="3" height="10" rx="1" fill="#fff"/>
            <rect x="9" y="3" width="3" height="10" rx="1" fill="#fff"/>
          </svg>
        ) : (
          // Play — triangle
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M5 3.5l8 4.5-8 4.5V3.5z" fill="#fff"/>
          </svg>
        )}
      </button>

      {/* Lap counter */}
      <div
        className="orbitron"
        style={{
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap',
          minWidth: '60px',
        }}
      >
        LAP {Math.floor(currentLap)}
      </div>

      {/* Scrubber + ticks */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <input
          type="range"
          min={1}
          max={totalLaps}
          step="any"
          value={currentLap}
          onChange={handleScrub}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '9px',
          color: 'var(--text-dim)',
          fontFamily: 'Orbitron, monospace',
          userSelect: 'none',
        }}>
          {ticks.map(t => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>

      {/* Total */}
      <div style={{
        fontFamily: 'Orbitron, monospace',
        fontSize: '11px',
        color: 'var(--text-muted)',
        whiteSpace: 'nowrap',
      }}>
        / {totalLaps}
      </div>
    </div>
  );
}
