import { motion } from 'framer-motion';
import BumpChart from './BumpChart';
import PlaybackControls from './PlaybackControls';

export default function RaceVisualizer({
  race,
  positionsByLap,
  drivers,
  currentLap,
  isPlaying,
  onPlay,
  onPause,
  onScrub,
}) {
  return (
    <motion.div
      key={race.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Race title */}
      <div style={{ marginBottom: '20px' }}>
        <h1 className="orbitron" style={{
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
      <div style={{ marginBottom: '16px' }}>
        <BumpChart
          positionsByLap={positionsByLap}
          drivers={drivers}
          currentLap={currentLap}
          totalLaps={race.laps}
        />
      </div>

      {/* Playback controls */}
      <PlaybackControls
        currentLap={currentLap}
        totalLaps={race.laps}
        isPlaying={isPlaying}
        onPlay={onPlay}
        onPause={onPause}
        onScrub={onScrub}
      />
    </motion.div>
  );
}
