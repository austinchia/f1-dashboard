import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Fixed padding in rendered pixels (viewBox = container px, so 1 unit = 1px)
const PAD_LEFT = 36;
const PAD_RIGHT = 52;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

const DNF_COLOR = 'rgba(255,255,255,0.18)';

function lapToX(lap, totalLaps, chartW) {
  if (totalLaps <= 1) return PAD_LEFT;
  return PAD_LEFT + ((lap - 1) / (totalLaps - 1)) * chartW;
}

function posToY(pos, numDrivers, chartH) {
  if (numDrivers <= 1) return PAD_TOP;
  return PAD_TOP + ((pos - 1) / (numDrivers - 1)) * chartH;
}

export default function BumpChart({ positionsByLap, drivers, dnfLaps = {}, currentLap, totalLaps }) {
  const containerRef = useRef(null);
  const [svgDims, setSvgDims] = useState({ w: 900, h: 480 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setSvgDims({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const svgW = svgDims.w;
  const svgH = svgDims.h;
  const chartW = svgW - PAD_LEFT - PAD_RIGHT;
  const chartH = svgH - PAD_TOP - PAD_BOTTOM;

  const numDrivers = drivers.length;

  // Interpolate between floor and ceil laps for smooth animation
  const floorLap = Math.floor(currentLap);
  const ceilLap = Math.min(floorLap + 1, totalLaps);
  const frac = currentLap - floorLap;

  const floorEntry = positionsByLap.find(d => d.lap === floorLap);
  const ceilEntry = positionsByLap.find(d => d.lap === ceilLap);

  // Interpolated (float) position per driver for smooth dot/label placement
  const interpolatedPositions = {};
  for (const driver of drivers) {
    const p0 = floorEntry?.positions[driver.id];
    const p1 = ceilEntry?.positions[driver.id];
    if (p0 != null && p1 != null) {
      interpolatedPositions[driver.id] = p0 + frac * (p1 - p0);
    } else if (p0 != null) {
      interpolatedPositions[driver.id] = p0;
    }
  }

  // Build per-driver point arrays up to floorLap, then append interpolated tip
  const visibleLaps = positionsByLap.filter(d => d.lap <= floorLap);
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
  if (frac > 0) {
    for (const driver of drivers) {
      const ipos = interpolatedPositions[driver.id];
      if (ipos != null && driverPoints[driver.id].length > 0) {
        driverPoints[driver.id].push({ lap: currentLap, pos: ipos });
      }
    }
  }

  // Lap tick marks for X axis (every 10 laps + final)
  const lapTicks = [1];
  for (let l = 10; l < totalLaps; l += 10) lapTicks.push(l);
  if (!lapTicks.includes(totalLaps)) lapTicks.push(totalLaps);

  const currentX = lapToX(currentLap, totalLaps, chartW);
  const fontSize = numDrivers > 12 ? 9 : 11;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '16px 12px 12px',
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div ref={containerRef} style={{ flex: 1, minHeight: 0, width: '100%' }}>
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          width="100%"
          height="100%"
          style={{ display: 'block' }}
        >
          {/* Y axis: position labels */}
          {Array.from({ length: numDrivers }, (_, i) => {
            const pos = i + 1;
            const y = posToY(pos, numDrivers, chartH);
            return (
              <text
                key={pos}
                x={PAD_LEFT - 6}
                y={y + 4}
                textAnchor="end"
                fill="var(--text-dim)"
                fontSize={fontSize}
                fontFamily="Orbitron, monospace"
              >
                P{pos}
              </text>
            );
          })}

          {/* Horizontal grid lines */}
          {Array.from({ length: numDrivers }, (_, i) => {
            const pos = i + 1;
            const y = posToY(pos, numDrivers, chartH);
            return (
              <line
                key={pos}
                x1={PAD_LEFT}
                y1={y}
                x2={svgW - PAD_RIGHT}
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
              x={lapToX(lap, totalLaps, chartW)}
              y={svgH - 6}
              textAnchor="middle"
              fill="var(--text-dim)"
              fontSize={9}
              fontFamily="Orbitron, monospace"
            >
              {lap}
            </text>
          ))}

          {/* Driver polylines — split at DNF lap */}
          {drivers.map(driver => {
            const points = driverPoints[driver.id];
            if (points.length < 2) return null;
            const dnfLap = dnfLaps[driver.id];
            if (dnfLap != null && currentLap > dnfLap) {
              const alivePoints = points.filter(p => p.lap <= dnfLap);
              const deadPoints = points.filter(p => p.lap >= dnfLap);
              const toStr = pts => pts.map(p => `${lapToX(p.lap, totalLaps, chartW)},${posToY(p.pos, numDrivers, chartH)}`).join(' ');
              return (
                <g key={driver.id}>
                  {alivePoints.length >= 2 && (
                    <polyline points={toStr(alivePoints)} stroke={driver.color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
                  )}
                  {deadPoints.length >= 2 && (
                    <polyline points={toStr(deadPoints)} stroke={DNF_COLOR} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 3" />
                  )}
                </g>
              );
            }
            const pointsStr = points
              .map(p => `${lapToX(p.lap, totalLaps, chartW)},${posToY(p.pos, numDrivers, chartH)}`)
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
            y2={svgH - PAD_BOTTOM}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={1}
            strokeDasharray="4 4"
            style={{ transition: 'none' }}
          />

          {/* Moving dots at current lap */}
          {drivers.map(driver => {
            const pos = interpolatedPositions[driver.id];
            if (pos == null) return null;
            const retired = dnfLaps[driver.id] != null && currentLap > dnfLaps[driver.id];
            return (
              <circle
                key={driver.id}
                cx={currentX}
                cy={posToY(pos, numDrivers, chartH)}
                r={retired ? 3 : 4}
                fill={retired ? DNF_COLOR : driver.color}
              />
            );
          })}

          {/* Animated driver labels (right edge) */}
          <AnimatePresence>
            {drivers.map(driver => {
              const pos = interpolatedPositions[driver.id];
              if (pos == null) return null;
              const y = posToY(pos, numDrivers, chartH);
              const retired = dnfLaps[driver.id] != null && currentLap > dnfLaps[driver.id];
              return (
                <motion.text
                  key={driver.id}
                  x={svgW - PAD_RIGHT + 6}
                  fill={retired ? DNF_COLOR : driver.color}
                  fontSize={fontSize}
                  fontFamily="Orbitron, monospace"
                  fontWeight="bold"
                  initial={{ y: y + 4, opacity: 0 }}
                  animate={{ y: y + 4, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 60, damping: 18 }}
                >
                  {driver.id}
                </motion.text>
              );
            })}
          </AnimatePresence>
        </svg>
      </div>
    </div>
  );
}
