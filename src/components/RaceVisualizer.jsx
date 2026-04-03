import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import BumpChart from './BumpChart';
import GapChart from './GapChart';
import Leaderboard from './Leaderboard';
import CircuitVisualizationCard from './CircuitVisualizationCard';

export default function RaceVisualizer({
  race,
  positionsByLap,
  drivers,
  grid = [],
  telemetry = null,
  dnfLaps,
  currentLap,
  currentPlaybackMs = null,
  isFinished,
  stints = {},
  safetyCars = [],
  gapsByLap = [],
  onViewSummary,
  onViewModeChange,
}) {
  const [viewMode, setViewMode] = useState('chart');
  const hasGapData = gapsByLap.length > 0;
  const hasPositionData = positionsByLap.length > 0;
  const isCircuitFocus = viewMode === 'circuit';

  useEffect(() => {
    onViewModeChange?.(viewMode);
  }, [onViewModeChange, viewMode]);

  return (
    <motion.div
      key={race.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
    >
      <div className="race-header">
        <div className="race-header__titleBlock">
          <div className="race-header__titleRow">
          <h1 className="orbitron race-title" style={{
            fontSize: '24px',
            fontWeight: 900,
            letterSpacing: '1px',
            color: 'var(--text-primary)',
            marginBottom: '4px',
          }}>
            {race.label.toUpperCase()}
          </h1>
          {isFinished && onViewSummary && (
            <button
              onClick={onViewSummary}
              className="race-summary-button"
            >
              RACE SUMMARY
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v10M1 6l5 5 5-5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {race.circuit} · {race.date} · {race.laps} Laps
          </p>
        </div>

        <div className="race-header__controls">
          <div className="race-view-toggle">
            <button
              type="button"
              className={`race-view-toggle__button${viewMode === 'chart' ? ' is-active' : ''}`}
              onClick={() => setViewMode('chart')}
            >
              Chart Focus
            </button>
            <button
              type="button"
              className={`race-view-toggle__button${viewMode === 'circuit' ? ' is-active' : ''}`}
              onClick={() => setViewMode('circuit')}
            >
              Circuit Focus
            </button>
          </div>
        </div>
      </div>

      {isCircuitFocus ? (
        <div style={{ minHeight: '560px' }}>
          <CircuitVisualizationCard
            race={race}
            drivers={drivers}
            grid={grid}
            telemetry={telemetry}
            positionsByLap={positionsByLap}
            gapsByLap={gapsByLap}
            dnfLaps={dnfLaps}
            currentLap={currentLap}
            currentPlaybackMs={currentPlaybackMs}
            displayMode="focus"
          />
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ minHeight: '520px' }}>
              <BumpChart
                positionsByLap={positionsByLap}
                drivers={drivers}
                grid={grid}
                dnfLaps={dnfLaps}
                currentLap={currentLap}
                totalLaps={race.laps}
                stints={stints}
                safetyCars={safetyCars}
              />
            </div>

            {hasGapData && (
              <div style={{ minHeight: '220px' }}>
                <GapChart
                  gapsByLap={gapsByLap}
                  drivers={drivers}
                  currentLap={currentLap}
                  totalLaps={race.laps}
                  safetyCars={safetyCars}
                />
              </div>
            )}
          </div>

          {hasPositionData && (
            <div className="leaderboard-sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
              <Leaderboard
                positionsByLap={positionsByLap}
                drivers={drivers}
                grid={grid}
                dnfLaps={dnfLaps}
                currentLap={currentLap}
              />
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
