import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { DRIVERS } from '../data/raceData';

// Side-profile F1 car silhouette — nose points RIGHT
function F1Car({ color }) {
  return (
    <svg width="62" height="24" viewBox="0 0 62 24" fill="none" style={{ display: 'block' }}>
      <rect x="1" y="4" width="11" height="2.5" rx="0.5" fill={color} />
      <rect x="5" y="4" width="2.5" height="8" rx="0.5" fill={color} opacity="0.8" />
      <path d="M7 11 Q7 8.5 10 8.5 L46 8.5 L51 11 L51 15.5 L10 15.5 Q7 15.5 7 13 Z" fill={color} />
      <path d="M21 8.5 L26 4.5 L38 4.5 L43 8.5 Z" fill={color} />
      <path d="M24 8.5 L28 5.5 L37 5.5 L41 8.5 Z" fill="rgba(5,5,12,0.65)" />
      <path d="M51 11 L61 12.5 L51 14 Z" fill={color} />
      <path d="M53 14 L62 14 L62 16 L51 16 Z" fill={color} opacity="0.85" />
      <path d="M53 16 L62 16 L61 17.5 L52 17.5 Z" fill={color} opacity="0.55" />
      <circle cx="15" cy="17.5" r="5.5" fill={color} />
      <circle cx="15" cy="17.5" r="2.4" fill="rgba(5,5,12,0.7)" />
      <circle cx="13.5" cy="16" r="1.1" fill="rgba(255,255,255,0.13)" />
      <circle cx="45" cy="17.5" r="4.5" fill={color} />
      <circle cx="45" cy="17.5" r="2" fill="rgba(5,5,12,0.7)" />
      <circle cx="43.8" cy="16.2" r="0.9" fill="rgba(255,255,255,0.13)" />
      <path d="M12 9 L44 9 L46 10 L12 10 Z" fill="rgba(255,255,255,0.08)" />
    </svg>
  );
}

function formatGap(gap) {
  if (gap === 0) return 'WINNER';
  if (gap > 95) {
    const laps = Math.round(gap / 95);
    return `+${laps} LAP${laps > 1 ? 'S' : ''}`;
  }
  return `+${gap.toFixed(3)}s`;
}

const MEDAL = ['#FFD700', '#C0C0C0', '#CD7F32'];

export default function RaceFinishChart({ gapData, driverList, finishOrder, driverStats, totalLaps }) {
  const drivers = driverList ?? DRIVERS;

  const finishData = useMemo(() => {
    if (finishOrder?.length) {
      return finishOrder.map(({ driver, gap }) => ({ driver, gap: gap ?? 0 }));
    }
    if (!gapData?.length || !drivers?.length) return [];
    const lastLap = gapData[gapData.length - 1];
    return drivers
      .filter(d => lastLap[d.id] !== undefined)
      .map(d => ({ driver: d, gap: lastLap[d.id] ?? 0 }))
      .sort((a, b) => a.gap - b.gap);
  }, [finishOrder, gapData, drivers]);

  if (!finishData.length) return null;

  // ── Inverse-of-completion-time scale ──────────────────────────────────────
  // winnerTime: total race time for P1, estimated from avgPaceSec × laps.
  // Each driver's pace ratio = winnerTime / (winnerTime + gap)  [0..1]
  // We zoom the axis to the meaningful range so differences are visible.
  const winnerDriver = finishData[0].driver;
  const winnerStats = driverStats?.[winnerDriver.id];
  const laps = totalLaps ?? 57;
  const winnerTime = winnerStats ? winnerStats.avgPaceSec * laps : 5400;

  const maxGap = finishData.reduce((m, e) => (e.gap > m ? e.gap : m), 1);

  // Pace ratio for each driver: closer to 1.0 = faster
  const paceRatio = gap => winnerTime / (winnerTime + gap);

  // Axis zoom: domain runs from minRatio (slowest driver) to 1.0 (winner)
  // Add 10% padding on the slow side so last bar isn't flush with axis edge
  const minRatio = paceRatio(maxGap);
  const axisPadding = (1 - minRatio) * 0.12;
  const axisMin = Math.max(0, minRatio - axisPadding);
  // Map a pace ratio into a [0..100]% position within the zoomed axis
  const toAxisPct = ratio => ((ratio - axisMin) / (1 - axisMin)) * 100;

  // Build 5 evenly-spaced axis tick marks (in seconds of gap)
  const tickCount = 5;
  const tickGaps = Array.from({ length: tickCount }, (_, i) =>
    (maxGap / (tickCount - 1)) * i
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '24px 28px 20px',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '20px',
      }}
    >
      {/* Gold accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(255,200,0,0.65), transparent)',
      }} />

      <div style={{ marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'rgba(238,238,255,0.35)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>
            Final Classification
          </div>
          <div className="orbitron" style={{ fontSize: '18px', fontWeight: 700 }}>
            Race Finish
          </div>
        </div>
        <div style={{ fontSize: '10px', color: 'rgba(238,238,255,0.25)', letterSpacing: '1px', textAlign: 'right', lineHeight: 1.5 }}>
          <div>X-AXIS: 1 / T<sub style={{ fontSize: '8px' }}>race</sub></div>
          <div style={{ color: 'rgba(238,238,255,0.15)' }}>Faster →</div>
        </div>
      </div>

      {/* Left gutter width = position (30) + gap (10) + driver id (36) + gap (10) */}
      {(() => {
        const LEFT = 86; // px — must match the flex items before the bar area
        const RIGHT = 92; // px — gap label + car overflow

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {finishData.map(({ driver, gap }, i) => {
              const ratio = paceRatio(gap);
              const barPct = toAxisPct(ratio);
              const isWinner = i === 0;
              const posColor = i < 3 ? MEDAL[i] : 'rgba(238,238,255,0.28)';

              return (
                <motion.div
                  key={driver.id}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.32, delay: i * 0.04 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '42px' }}
                >
                  {/* Position */}
                  <div className="orbitron" style={{
                    width: '30px', fontSize: '12px', fontWeight: 800,
                    color: posColor, textAlign: 'right', flexShrink: 0,
                  }}>
                    P{i + 1}
                  </div>

                  {/* Driver ID */}
                  <div className="orbitron" style={{
                    width: '36px', fontSize: '11px', fontWeight: 700,
                    color: driver.color, flexShrink: 0, letterSpacing: '0.5px',
                  }}>
                    {driver.id}
                  </div>

                  {/* Bar + car area */}
                  <div style={{ flex: 1, position: 'relative', height: '100%', paddingRight: `${RIGHT}px` }}>
                    {/* Track bg */}
                    <div style={{
                      position: 'absolute', left: 0, right: `${RIGHT}px`,
                      top: '14px', height: '14px',
                      background: 'rgba(255,255,255,0.03)', borderRadius: '4px',
                    }} />

                    {/* Animated bar — width based on inverse-time ratio */}
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barPct}%` }}
                      transition={{ duration: 0.9, delay: 0.15 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        position: 'absolute', left: 0,
                        top: '14px', height: '14px',
                        borderRadius: '4px',
                        background: `linear-gradient(90deg, ${driver.color}1a 0%, ${driver.color}70 100%)`,
                        overflow: 'visible',
                      }}
                    >
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%)',
                        borderRadius: '4px',
                      }} />

                      {/* Car icon at bar tip */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.7 + i * 0.07 }}
                        style={{
                          position: 'absolute', right: '-62px', top: '50%',
                          transform: 'translateY(-50%)',
                          filter: `drop-shadow(0 0 5px ${driver.color}70)`,
                          pointerEvents: 'none',
                        }}
                      >
                        <F1Car color={driver.color} />
                      </motion.div>
                    </motion.div>
                  </div>

                  {/* Gap label */}
                  <div className="orbitron" style={{
                    width: '80px', fontSize: '10px', fontWeight: 700,
                    color: isWinner ? '#FFD700' : 'rgba(238,238,255,0.38)',
                    flexShrink: 0, letterSpacing: '0.3px', textAlign: 'left',
                  }}>
                    {formatGap(gap)}
                  </div>
                </motion.div>
              );
            })}

            {/* ── X-axis ruler ───────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '6px' }}>
              {/* Spacer matching position + driver labels */}
              <div style={{ width: '76px', flexShrink: 0 }} />

              {/* Ruler area */}
              <div style={{ flex: 1, paddingRight: `${RIGHT}px`, position: 'relative' }}>
                {/* Baseline */}
                <div style={{
                  height: '1px',
                  background: 'rgba(255,255,255,0.08)',
                  marginBottom: '4px',
                }} />

                {/* Tick marks + labels */}
                <div style={{ position: 'relative', height: '18px' }}>
                  {tickGaps.map((gapVal, ti) => {
                    const ratio = paceRatio(gapVal);
                    const leftPct = toAxisPct(ratio);
                    const isLast = ti === tickGaps.length - 1; // slowest tick

                    return (
                      <div
                        key={ti}
                        style={{
                          position: 'absolute',
                          left: `${leftPct}%`,
                          transform: 'translateX(-50%)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px',
                        }}
                      >
                        {/* Tick */}
                        <div style={{
                          width: '1px', height: '4px',
                          background: ti === 0 ? 'rgba(255,200,0,0.6)' : 'rgba(255,255,255,0.15)',
                        }} />
                        {/* Label */}
                        <div className="orbitron" style={{
                          fontSize: '9px',
                          color: ti === 0 ? 'rgba(255,200,0,0.7)' : 'rgba(238,238,255,0.22)',
                          whiteSpace: 'nowrap',
                          letterSpacing: '0.3px',
                        }}>
                          {ti === 0 ? '±0s' : `+${gapVal.toFixed(0)}s`}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Axis label */}
                <div style={{
                  textAlign: 'right',
                  fontSize: '9px',
                  color: 'rgba(238,238,255,0.18)',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  marginTop: '2px',
                  fontFamily: 'Orbitron, monospace',
                }}>
                  Gap to Winner (s) · Inverse Pace Scale
                </div>
              </div>

              <div style={{ width: '80px', flexShrink: 0 }} />
            </div>
          </div>
        );
      })()}
    </motion.div>
  );
}
