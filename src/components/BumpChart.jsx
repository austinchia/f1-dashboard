import { motion, AnimatePresence } from 'framer-motion';

// SVG layout constants
const SVG_W = 900;
const SVG_H = 480;
const PAD_LEFT = 36;    // space for P1..PN labels
const PAD_RIGHT = 48;   // space for driver abbreviation labels
const PAD_TOP = 16;
const PAD_BOTTOM = 28;  // space for lap number labels

const CHART_W = SVG_W - PAD_LEFT - PAD_RIGHT;
const CHART_H = SVG_H - PAD_TOP - PAD_BOTTOM;

function lapToX(lap, totalLaps) {
  if (totalLaps <= 1) return PAD_LEFT;
  return PAD_LEFT + ((lap - 1) / (totalLaps - 1)) * CHART_W;
}

function posToY(pos, numDrivers) {
  if (numDrivers <= 1) return PAD_TOP;
  return PAD_TOP + ((pos - 1) / (numDrivers - 1)) * CHART_H;
}

export default function BumpChart({ positionsByLap, drivers, currentLap, totalLaps }) {
  const numDrivers = drivers.length;

  // Slice data to currentLap
  const visibleLaps = positionsByLap.filter(d => d.lap <= currentLap);

  // Build per-driver point arrays
  const driverPoints = {};
  for (const driver of drivers) {
    driverPoints[driver.id] = [];
  }
  for (const lapEntry of visibleLaps) {
    for (const [abbr, pos] of Object.entries(lapEntry.positions)) {
      if (driverPoints[abbr] !== undefined) {
        driverPoints[abbr].push({ lap: lapEntry.lap, pos });
      }
    }
  }

  // Current positions for dots and animated labels
  const currentEntry = positionsByLap.find(d => d.lap === currentLap)
    ?? positionsByLap[positionsByLap.length - 1];
  const currentPositions = currentEntry?.positions ?? {};

  // Lap tick marks for X axis (every 10 laps + final)
  const lapTicks = [1];
  for (let l = 10; l < totalLaps; l += 10) lapTicks.push(l);
  if (!lapTicks.includes(totalLaps)) lapTicks.push(totalLaps);

  // Current lap vertical line X
  const currentX = lapToX(currentLap, totalLaps);

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '16px 12px 12px',
      width: '100%',
    }}>
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block' }}
      >
        {/* Y axis: position labels */}
        {Array.from({ length: numDrivers }, (_, i) => {
          const pos = i + 1;
          const y = posToY(pos, numDrivers);
          return (
            <text
              key={pos}
              x={PAD_LEFT - 6}
              y={y + 4}
              textAnchor="end"
              fill="var(--text-dim)"
              fontSize={numDrivers > 12 ? 9 : 11}
              fontFamily="Orbitron, monospace"
            >
              P{pos}
            </text>
          );
        })}

        {/* Horizontal grid lines */}
        {Array.from({ length: numDrivers }, (_, i) => {
          const pos = i + 1;
          const y = posToY(pos, numDrivers);
          return (
            <line
              key={pos}
              x1={PAD_LEFT}
              y1={y}
              x2={SVG_W - PAD_RIGHT}
              y2={y}
              stroke="var(--grid-line)"
              strokeWidth={1}
            />
          );
        })}

        {/* X axis: lap tick labels */}
        {lapTicks.map(lap => (
          <text
            key={lap}
            x={lapToX(lap, totalLaps)}
            y={SVG_H - 6}
            textAnchor="middle"
            fill="var(--text-dim)"
            fontSize={9}
            fontFamily="Orbitron, monospace"
          >
            {lap}
          </text>
        ))}

        {/* Driver polylines */}
        {drivers.map(driver => {
          const points = driverPoints[driver.id];
          if (points.length < 2) return null;
          const pointsStr = points
            .map(p => `${lapToX(p.lap, totalLaps)},${posToY(p.pos, numDrivers)}`)
            .join(' ');
          return (
            <polyline
              key={driver.id}
              points={pointsStr}
              stroke={driver.color}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.85}
            />
          );
        })}

        {/* Current lap vertical marker */}
        <line
          x1={currentX}
          y1={PAD_TOP}
          x2={currentX}
          y2={SVG_H - PAD_BOTTOM}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1}
          strokeDasharray="4 4"
        />

        {/* Moving dots at current lap */}
        {drivers.map(driver => {
          const pos = currentPositions[driver.id];
          if (pos == null) return null;
          return (
            <circle
              key={driver.id}
              cx={currentX}
              cy={posToY(pos, numDrivers)}
              r={4}
              fill={driver.color}
            />
          );
        })}

        {/* Animated driver labels (right edge, sorted by current position) */}
        <AnimatePresence>
          {drivers.map(driver => {
            const pos = currentPositions[driver.id];
            if (pos == null) return null;
            const y = posToY(pos, numDrivers);
            return (
              <motion.text
                key={driver.id}
                x={SVG_W - PAD_RIGHT + 6}
                fill={driver.color}
                fontSize={numDrivers > 12 ? 9 : 11}
                fontFamily="Orbitron, monospace"
                fontWeight="bold"
                initial={{ y: y + 4, opacity: 0 }}
                animate={{ y: y + 4, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              >
                {driver.id}
              </motion.text>
            );
          })}
        </AnimatePresence>
      </svg>
    </div>
  );
}
