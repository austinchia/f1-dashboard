function formatSessionTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function PlaybackControls({
  currentLap,
  totalLaps,
  currentPlaybackMs = 0,
  totalPlaybackMs = 0,
  playbackStartMs = 0,
  mode = 'lap',
  isPlaying,
  isFinished,
  onPlay,
  onPause,
  onReplay,
  onScrub,
}) {
  const isTimeMode = mode === 'time' && totalPlaybackMs > 0;
  const displayedPlaybackMs = isTimeMode
    ? Math.max(0, currentPlaybackMs - playbackStartMs)
    : currentPlaybackMs;

  // Build tick labels: lap 1, every 10 laps, final lap
  const ticks = [1];
  for (let l = 10; l < totalLaps; l += 10) ticks.push(l);
  if (!ticks.includes(totalLaps)) ticks.push(totalLaps);

  const timeTicks = [0, 0.25, 0.5, 0.75, 1].map(fraction => Math.round(totalPlaybackMs * fraction));

  function handleScrub(e) {
    onScrub(Number(e.target.value));
  }

  return (
    <div className="playback-panel">
      {/* Play / Pause */}
      <button
        onClick={isFinished ? onReplay : isPlaying ? onPause : onPlay}
        aria-label={isFinished ? 'Replay' : isPlaying ? 'Pause' : 'Play'}
        className="playback-panel__primary"
      >
        {isFinished ? (
          // Replay
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4.2 4.6A5.8 5.8 0 1 1 3.7 10.8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M4.3 1.9V5.3H7.7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
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
        className="orbitron playback-panel__lap"
      >
        {isTimeMode ? formatSessionTime(displayedPlaybackMs) : currentLap < 1 ? 'GRID' : `LAP ${Math.floor(currentLap)}`}
      </div>

      {/* Scrubber + ticks */}
      <div className="playback-panel__scrub">
        <input
          className="playback-panel__range"
          type="range"
          min={0}
          max={isTimeMode ? totalPlaybackMs : totalLaps}
          step="any"
          value={isTimeMode ? displayedPlaybackMs : currentLap}
          onChange={handleScrub}
        />
        <div className="playback-panel__ticks">
          {isTimeMode ? (
            timeTicks.map(tick => (
              <span key={tick}>{formatSessionTime(tick)}</span>
            ))
          ) : (
            <>
              <span>GRID</span>
              {ticks.map(t => (
                <span key={t}>{t}</span>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Total */}
      <div className="playback-panel__total">
        {isTimeMode ? `/ ${formatSessionTime(totalPlaybackMs)}` : `/ ${totalLaps}`}
      </div>
    </div>
  );
}
