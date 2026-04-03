import { useRef, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Fixed padding in rendered pixels (viewBox = container px, so 1 unit = 1px)
const PAD_LEFT = 36;
const PAD_RIGHT = 52;
const PAD_TOP = 22;
const PAD_BOTTOM = 28;

const DNF_COLOR = 'var(--dnf-color)';

const COMPOUND_COLORS = {
  SOFT: '#e8002d',
  MEDIUM: '#ffd700',
  HARD: '#d8d8d8',
  INTERMEDIATE: '#39b54a',
  WET: '#2196f3',
};

function compoundColor(compound) {
  return COMPOUND_COLORS[compound?.toUpperCase()] ?? '#888';
}

function lapToX(lap, totalLaps, chartW) {
  if (totalLaps <= 0) return PAD_LEFT;
  return PAD_LEFT + (lap / totalLaps) * chartW;
}

function posToY(pos, numDrivers, chartH) {
  if (numDrivers <= 1) return PAD_TOP;
  return PAD_TOP + ((pos - 1) / (numDrivers - 1)) * chartH;
}

export default function BumpChart({
  positionsByLap,
  drivers,
  grid = [],
  dnfLaps = {},
  currentLap,
  totalLaps,
  stints = {},
  safetyCars = [],
}) {
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
  const gridPositions = useMemo(() => {
    const positions = {};
    grid.forEach((driverId, index) => {
      positions[driverId] = index + 1;
    });
    return positions;
  }, [grid]);
  const positionsByLapMap = useMemo(() => {
    const byLap = new Map();
    positionsByLap.forEach(entry => byLap.set(entry.lap, entry));
    return byLap;
  }, [positionsByLap]);

  const maxDataLap = positionsByLap.length > 0
    ? positionsByLap[positionsByLap.length - 1].lap
    : totalLaps;
  const floorLap = Math.min(Math.floor(currentLap), maxDataLap);
  const ceilLap = Math.min(floorLap + 1, totalLaps);
  const frac = currentLap - floorLap;

  const floorEntry = floorLap < 1
    ? { lap: 0, positions: gridPositions }
    : positionsByLapMap.get(floorLap);
  const ceilEntry = positionsByLapMap.get(ceilLap);

  // Retired driver fixed slots
  const retiredSlots = {};
  for (const [driverId, dnfLap] of Object.entries(dnfLaps)) {
    const checkLap = dnfLap + 1;
    const numActive = drivers.filter(d => {
      const dl = dnfLaps[d.id];
      return dl == null || dl >= checkLap;
    }).length;
    const retiredAtOrBefore = Object.entries(dnfLaps)
      .filter(([, dl]) => dl < checkLap)
      .sort((a, b) => b[1] - a[1]);
    const rank = retiredAtOrBefore.findIndex(([id]) => id === driverId) + 1;
    retiredSlots[driverId] = numActive + rank;
  }

  // Interpolated positions
  const interpolatedPositions = {};
  for (const driver of drivers) {
    const dnfLap = dnfLaps[driver.id];
    if (dnfLap != null && currentLap > dnfLap) {
      interpolatedPositions[driver.id] = retiredSlots[driver.id];
      continue;
    }
    const p0 = floorEntry?.positions[driver.id];
    const rawP1 = ceilEntry?.positions[driver.id];
    const p1 = (dnfLap != null && ceilLap > dnfLap) ? p0 : rawP1;
    if (p0 != null && p1 != null) {
      interpolatedPositions[driver.id] = p0 + frac * (p1 - p0);
    } else if (p0 != null) {
      interpolatedPositions[driver.id] = p0;
    }
  }

  // Driver polylines up to current lap
  const visibleLaps = positionsByLap.filter(d => d.lap <= floorLap);
  const driverPoints = {};
  for (const driver of drivers) {
    driverPoints[driver.id] = gridPositions[driver.id] != null
      ? [{ lap: 0, pos: gridPositions[driver.id] }]
      : [];
  }
  for (const lapEntry of visibleLaps) {
    for (const [abbr, pos] of Object.entries(lapEntry.positions)) {
      if (driverPoints[abbr] !== undefined) {
        const dnfLap = dnfLaps[abbr];
        if (dnfLap == null || lapEntry.lap <= dnfLap) {
          driverPoints[abbr].push({ lap: lapEntry.lap, pos });
        }
      }
    }
  }
  if (frac > 0) {
    for (const driver of drivers) {
      const dnfLap = dnfLaps[driver.id];
      if (dnfLap != null && currentLap > dnfLap) continue;
      const ipos = interpolatedPositions[driver.id];
      if (ipos != null && driverPoints[driver.id].length > 0) {
        driverPoints[driver.id].push({ lap: currentLap, pos: ipos });
      }
    }
  }

  // Pit markers — derive from stints (startLap of each stint after the first)
  const pitMarkers = [];
  for (const [driverId, driverStints] of Object.entries(stints)) {
    if (!Array.isArray(driverStints) || driverStints.length < 2) continue;
    for (const stint of driverStints.slice(1)) {
      const pitLap = stint.startLap;
      if (pitLap > Math.floor(currentLap)) continue;
      const lapEntry = positionsByLapMap.get(pitLap);
      const pos = lapEntry?.positions[driverId];
      if (pos == null) continue;
      pitMarkers.push({ driverId, lap: pitLap, compound: stint.compound, pos });
    }
  }

  // Lap tick marks for X axis
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
      padding: '10px 12px 12px',
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Card title */}
      <div style={{ marginBottom: '4px', flexShrink: 0 }}>
        <span className="orbitron" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '3px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Race Positions
        </span>
      </div>

      {/* Legend for SC/pit */}
      {(safetyCars.length > 0 || Object.keys(stints).length > 0) && (
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '6px',
          flexShrink: 0,
          flexWrap: 'wrap',
        }}>
          {safetyCars.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '12px', height: '10px', background: 'var(--sc-band-fill)', borderRadius: '2px' }} />
                <span style={{ fontSize: '9px', color: 'var(--text-dim)', fontFamily: 'Orbitron, monospace', letterSpacing: '1px' }}>SC</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '12px', height: '10px', background: 'var(--vsc-band-fill)', borderRadius: '2px' }} />
                <span style={{ fontSize: '9px', color: 'var(--text-dim)', fontFamily: 'Orbitron, monospace', letterSpacing: '1px' }}>VSC</span>
              </div>
            </>
          )}
          {Object.keys(stints).length > 0 && (
            <>
              {['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET'].map(c => {
                const hasCompound = Object.values(stints).some(ss =>
                  Array.isArray(ss) && ss.some(s => s.compound === c)
                );
                if (!hasCompound) return null;
                return (
                  <div key={c} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '0', height: '0', borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: `7px solid ${compoundColor(c)}` }} />
                    <span style={{ fontSize: '9px', color: 'var(--text-dim)', fontFamily: 'Orbitron, monospace', letterSpacing: '1px' }}>{c[0]}</span>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      <div ref={containerRef} style={{ flex: 1, minHeight: 0, width: '100%' }}>
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          width="100%"
          height="100%"
          style={{ display: 'block' }}
        >
          {/* SC / VSC background bands (rect only) — only once currentLap reaches startLap */}
          {safetyCars.map((sc, i) => {
            if (currentLap < sc.startLap) return null;
            const x1 = lapToX(sc.startLap, totalLaps, chartW);
            const visibleEnd = Math.min(sc.endLap + 1, totalLaps, currentLap + 1);
            const x2 = lapToX(visibleEnd, totalLaps, chartW);
            const fill = sc.type === 'SC' ? 'var(--sc-band-fill)' : 'var(--vsc-band-fill)';
            return (
              <rect key={`sc-bg-${i}`} x={x1} y={PAD_TOP} width={Math.max(x2 - x1, 2)} height={chartH} fill={fill} />
            );
          })}

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

          {/* Driver polylines */}
          {drivers.map(driver => {
            const points = driverPoints[driver.id];
            if (points.length < 2) return null;
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

          {/* Retired driver flat dashed lines */}
          {drivers.map(driver => {
            const dnfLap = dnfLaps[driver.id];
            if (dnfLap == null || currentLap <= dnfLap) return null;
            const slot = retiredSlots[driver.id];
            if (slot == null) return null;
            const y = posToY(slot, numDrivers, chartH);
            const x1 = lapToX(dnfLap, totalLaps, chartW);
            const x2 = Math.min(currentX, lapToX(maxDataLap, totalLaps, chartW));
            return (
              <line
                key={`dnf-${driver.id}`}
                x1={x1} y1={y}
                x2={x2} y2={y}
                stroke={DNF_COLOR}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                strokeLinecap="round"
              />
            );
          })}

          {/* Pit stop markers — downward triangle at the out-lap position */}
          {pitMarkers.map(({ driverId, lap, compound, pos }, idx) => {
            const x = lapToX(lap, totalLaps, chartW);
            const y = posToY(pos, numDrivers, chartH);
            const color = compoundColor(compound);
            const s = 4;
            // Downward-pointing triangle: flat top, point at bottom
            const pts = `${x - s},${y - s} ${x + s},${y - s} ${x},${y + s}`;
            return (
              <polygon
                key={`pit-${driverId}-${idx}`}
                points={pts}
                fill={color}
                opacity={0.9}
                stroke="rgba(0,0,0,0.3)"
                strokeWidth={0.5}
              />
            );
          })}

          {/* SC / VSC labels — rendered above all lines */}
          {safetyCars.map((sc, i) => {
            if (currentLap < sc.startLap) return null;
            const x1 = lapToX(sc.startLap, totalLaps, chartW);
            const visibleEnd = Math.min(sc.endLap + 1, totalLaps, currentLap + 1);
            const x2 = lapToX(visibleEnd, totalLaps, chartW);
            const labelColor = sc.type === 'SC' ? 'var(--sc-label-color)' : 'var(--vsc-label-color)';
            const labelBg = sc.type === 'SC' ? 'var(--sc-label-bg)' : 'var(--vsc-label-bg)';
            const midX = (x1 + x2) / 2;
            return (
              <g key={`sc-label-${i}`}>
                <rect x={midX - 10} y={PAD_TOP - 12} width={20} height={11} rx={2} fill={labelBg} />
                <text
                  x={midX}
                  y={PAD_TOP - 3}
                  textAnchor="middle"
                  fill={labelColor}
                  fontSize={7}
                  fontFamily="Orbitron, monospace"
                  fontWeight="bold"
                >
                  {sc.type}
                </text>
              </g>
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
