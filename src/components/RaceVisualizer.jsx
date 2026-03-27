import { motion } from 'framer-motion';
import BumpChart from './BumpChart';
import PlaybackControls from './PlaybackControls';

export default function RaceVisualizer({
  race,
  positionsByLap,
  drivers,
  dnfLaps,
  currentLap,
  isPlaying,
  isFinished,
  onPlay,
  onPause,
  onReplay,
  onScrub,
}) {
  return (
    <motion.div
      key={race.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      {/* Race title */}
      <div style={{ marginBottom: '16px', flexShrink: 0 }}>
        <h1 className="orbitron race-title" style={{
          fontSize: '24px',
          fontWeight: 900,
          letterSpacing: '1px',
          color: 'var(--text-primary)',
          marginBottom: '4px',
        }}>
          {race.label.toUpperCase()}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {race.circuit} · {race.date} · {race.laps} Laps
        </p>
      </div>

      {/* Bump chart */}
      <div style={{ flex: 1, minHeight: 0, marginBottom: '12px' }}>
        <BumpChart
          positionsByLap={positionsByLap}
          drivers={drivers}
          dnfLaps={dnfLaps}
          currentLap={currentLap}
          totalLaps={race.laps}
        />
      </div>

      {/* Playback controls */}
      <div style={{ flexShrink: 0 }}>
      <PlaybackControls
        currentLap={currentLap}
        totalLaps={race.laps}
        isPlaying={isPlaying}
        isFinished={isFinished}
        onPlay={onPlay}
        onPause={onPause}
        onReplay={onReplay}
        onScrub={onScrub}
      />
      </div>
    </motion.div>
  );
}
