import { useRef, useState, useEffect, useMemo } from 'react';

const PAD_LEFT = 36;
const PAD_RIGHT = 52;
const PAD_TOP = 12;
const PAD_BOTTOM = 22;

const MAX_GAP_S = 60; // clip display at 60 seconds

function lapToX(lap, totalLaps, chartW) {
  if (totalLaps <= 0) return PAD_LEFT;
  return PAD_LEFT + (lap / totalLaps) * chartW;
}

function gapToY(gap, chartH) {
  const clamped = Math.min(gap, MAX_GAP_S);
  return PAD_TOP + (clamped / MAX_GAP_S) * chartH;
}

export default function GapChart({
  gapsByLap = [],
  drivers = [],
  currentLap,
  totalLaps,
  safetyCars = [],
}) {
  const containerRef = useRef(null);
  const [svgDims, setSvgDims] = useState({ w: 900, h: 200 });

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

  if (gapsByLap.length === 0) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
      }}>
        <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'Orbitron, monospace', letterSpacing: '1px' }}>
          GAP DATA — RE-RUN scripts/fetch_laps.py
        </span>
      </div>
    );
  }

  const svgW = svgDims.w;
  const svgH = svgDims.h;
  const chartW = svgW - PAD_LEFT - PAD_RIGHT;
  const chartH = svgH - PAD_TOP - PAD_BOTTOM;
  const gapsByLapMap = useMemo(() => {
    const byLap = new Map();
    gapsByLap.forEach(entry => byLap.set(entry.lap, entry));
    return byLap;
  }, [gapsByLap]);

  // Build per-driver gap lines up to currentLap
  const floorLap = Math.min(Math.max(Math.floor(currentLap), 0), gapsByLap[gapsByLap.length - 1]?.lap ?? totalLaps);
  const ceilLap = floorLap + 1;
  const floorEntry = gapsByLapMap.get(floorLap);
  const ceilEntry = gapsByLapMap.get(ceilLap) ?? null;
  const frac = currentLap - floorLap;

  // Points per driver: all laps up to floorLap
  const driverPoints = {};
  for (const driver of drivers) {
    driverPoints[driver.id] = [];
  }
  for (const entry of gapsByLap) {
    if (entry.lap > floorLap) break;
    for (const driver of drivers) {
      const gap = entry.gaps[driver.id];
      if (gap != null) {
        driverPoints[driver.id].push({ lap: entry.lap, gap });
      }
    }
  }

  // Extend to currentLap with interpolation
  if (frac > 0 && floorEntry && ceilEntry) {
    for (const driver of drivers) {
      const g0 = floorEntry.gaps[driver.id];
      const g1 = ceilEntry.gaps[driver.id];
      if (g0 != null && g1 != null && driverPoints[driver.id].length > 0) {
        driverPoints[driver.id].push({ lap: currentLap, gap: g0 + frac * (g1 - g0) });
      }
    }
  }

  // Current interpolated gap per driver (for dot placement)
  const currentGaps = {};
  for (const driver of drivers) {
    const g0 = floorEntry?.gaps[driver.id];
    const g1 = ceilEntry?.gaps[driver.id];
    if (g0 != null && g1 != null) {
      currentGaps[driver.id] = g0 + frac * (g1 - g0);
    } else if (g0 != null) {
      currentGaps[driver.id] = g0;
    }
  }

  const currentX = lapToX(currentLap, totalLaps, chartW);

  // Y axis ticks: 0, 10, 20, 30, 40, 50, 60
  const yTicks = [0, 10, 20, 30, 40, 50, 60];

  // Lap x-axis ticks
  const lapTicks = [1];
  for (let l = 10; l < totalLaps; l += 10) lapTicks.push(l);
  if (!lapTicks.includes(totalLaps)) lapTicks.push(totalLaps);

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '10px 12px 8px',
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexShrink: 0 }}>
        <span className="orbitron" style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: 'var(--text-muted)' }}>
          GAP TO LEADER
        </span>
        <span style={{ fontSize: '9px', color: 'var(--text-dim)', fontFamily: 'Inter, sans-serif' }}>
          (seconds · capped at 60s)
        </span>
      </div>

      <div ref={containerRef} style={{ flex: 1, minHeight: 0, width: '100%' }}>
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          width="100%"
          height="100%"
          style={{ display: 'block' }}
        >
          {/* SC / VSC background bands */}
          {safetyCars.map((sc, i) => {
            if (currentLap < sc.startLap) return null;
            const x1 = lapToX(sc.startLap, totalLaps, chartW);
            const visibleEnd = Math.min(sc.endLap + 1, totalLaps, currentLap + 1);
            const x2 = lapToX(visibleEnd, totalLaps, chartW);
            const fill = sc.type === 'SC' ? 'var(--sc-band-fill)' : 'var(--vsc-band-fill)';
            return (
              <rect key={`sc-${i}`} x={x1} y={PAD_TOP} width={Math.max(x2 - x1, 2)} height={chartH} fill={fill} />
            );
          })}

          {/* Y axis grid + labels */}
          {yTicks.map(s => {
            const y = gapToY(s, chartH);
            return (
              <g key={s}>
                <line
                  x1={PAD_LEFT}
                  y1={y}
                  x2={svgW - PAD_RIGHT}
                  y2={y}
                  stroke="var(--grid-line)"
                  strokeWidth={s === 0 ? 1.5 : 1}
                />
                <text
                  x={PAD_LEFT - 5}
                  y={y + 3}
                  textAnchor="end"
                  fill="var(--text-dim)"
                  fontSize={8}
                  fontFamily="Orbitron, monospace"
                >
                  {s}s
                </text>
              </g>
            );
          })}

          {/* X axis lap ticks */}
          {lapTicks.map(lap => (
            <text
              key={lap}
              x={lapToX(lap, totalLaps, chartW)}
              y={svgH - 4}
              textAnchor="middle"
              fill="var(--text-dim)"
              fontSize={8}
              fontFamily="Orbitron, monospace"
            >
              {lap}
            </text>
          ))}

          {/* Clip rect for gap lines (prevent drawing above 0 or below 60s) */}
          <defs>
            <clipPath id="gap-clip">
              <rect x={PAD_LEFT} y={PAD_TOP} width={chartW} height={chartH} />
            </clipPath>
          </defs>

          {/* Driver gap lines */}
          <g clipPath="url(#gap-clip)">
            {drivers.map(driver => {
              const points = driverPoints[driver.id];
              if (points.length < 2) return null;
              const pointsStr = points
                .map(p => `${lapToX(p.lap, totalLaps, chartW)},${gapToY(p.gap, chartH)}`)
                .join(' ');
              return (
                <polyline
                  key={driver.id}
                  points={pointsStr}
                  stroke={driver.color}
                  strokeWidth={1.5}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.75}
                />
              );
            })}
          </g>

          {/* Current lap vertical marker */}
          <line
            x1={currentX}
            y1={PAD_TOP}
            x2={currentX}
            y2={svgH - PAD_BOTTOM}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />

          {/* Dots at current lap */}
          {drivers.map(driver => {
            const gap = currentGaps[driver.id];
            if (gap == null || gap > MAX_GAP_S) return null;
            return (
              <circle
                key={driver.id}
                cx={currentX}
                cy={gapToY(gap, chartH)}
                r={3}
                fill={driver.color}
              />
            );
          })}

          {/* Leader label only (gap = 0) */}
          {(() => {
            const leader = drivers.find(d => currentGaps[d.id] === 0 || (
              currentGaps[d.id] != null &&
              Math.abs(currentGaps[d.id]) < 0.001
            ));
            if (!leader) {
              // fallback: driver with smallest gap
              const sorted = drivers
                .filter(d => currentGaps[d.id] != null)
                .sort((a, b) => currentGaps[a.id] - currentGaps[b.id]);
              const fallback = sorted[0];
              if (!fallback) return null;
              return (
                <text
                  x={svgW - PAD_RIGHT + 5}
                  y={gapToY(currentGaps[fallback.id], chartH) + 3}
                  fill={fallback.color}
                  fontSize={8}
                  fontFamily="Orbitron, monospace"
                  fontWeight="bold"
                >
                  {fallback.id}
                </text>
              );
            }
            return (
              <text
                x={svgW - PAD_RIGHT + 5}
                y={gapToY(currentGaps[leader.id], chartH) + 3}
                fill={leader.color}
                fontSize={8}
                fontFamily="Orbitron, monospace"
                fontWeight="bold"
              >
                {leader.id}
              </text>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}
