export default function PlaybackControls({
  currentLap,
  totalLaps,
  isPlaying,
  onPlay,
  onPause,
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
        onClick={isPlaying ? onPause : onPlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
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
        {isPlaying ? '⏸' : '▶'}
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
        LAP {currentLap}
      </div>

      {/* Scrubber + ticks */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <input
          type="range"
          min={1}
          max={totalLaps}
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
