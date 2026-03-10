import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { DRIVERS } from '../data/raceData';

// Side-profile F1 car silhouette — nose points RIGHT
function F1Car({ color }) {
  return (
    <svg width="62" height="24" viewBox="0 0 62 24" fill="none" style={{ display: 'block' }}>
      {/* Rear wing horizontal */}
      <rect x="1" y="4" width="11" height="2.5" rx="0.5" fill={color} />
      {/* Rear wing vertical strut */}
      <rect x="5" y="4" width="2.5" height="8" rx="0.5" fill={color} opacity="0.8" />

      {/* Main chassis body */}
      <path
        d="M7 11 Q7 8.5 10 8.5 L46 8.5 L51 11 L51 15.5 L10 15.5 Q7 15.5 7 13 Z"
        fill={color}
      />

      {/* Cockpit surround */}
      <path d="M21 8.5 L26 4.5 L38 4.5 L43 8.5 Z" fill={color} />
      {/* Cockpit opening (dark) */}
      <path d="M24 8.5 L28 5.5 L37 5.5 L41 8.5 Z" fill="rgba(5,5,12,0.65)" />

      {/* Nose cone */}
      <path d="M51 11 L61 12.5 L51 14 Z" fill={color} />

      {/* Front wing main plane */}
      <path d="M53 14 L62 14 L62 16 L51 16 Z" fill={color} opacity="0.85" />
      {/* Front wing flap */}
      <path d="M53 16 L62 16 L61 17.5 L52 17.5 Z" fill={color} opacity="0.55" />

      {/* Rear tire */}
      <circle cx="15" cy="17.5" r="5.5" fill={color} />
      <circle cx="15" cy="17.5" r="2.4" fill="rgba(5,5,12,0.7)" />
      <circle cx="13.5" cy="16" r="1.1" fill="rgba(255,255,255,0.13)" />

      {/* Front tire */}
      <circle cx="45" cy="17.5" r="4.5" fill={color} />
      <circle cx="45" cy="17.5" r="2" fill="rgba(5,5,12,0.7)" />
      <circle cx="43.8" cy="16.2" r="0.9" fill="rgba(255,255,255,0.13)" />

      {/* Body highlight */}
      <path
        d="M12 9 L44 9 L46 10 L12 10 Z"
        fill="rgba(255,255,255,0.08)"
      />
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

export default function RaceFinishChart({ gapData, driverList }) {
  const drivers = driverList ?? DRIVERS;

  const finishData = useMemo(() => {
    if (!gapData?.length || !drivers?.length) return [];
    const lastLap = gapData[gapData.length - 1];
    return drivers
      .filter(d => lastLap[d.id] !== undefined)
      .map(d => ({ driver: d, gap: lastLap[d.id] ?? 0 }))
      .sort((a, b) => a.gap - b.gap);
  }, [gapData, drivers]);

  if (!finishData.length) return null;

  const maxGap = finishData[finishData.length - 1]?.gap ?? 1;

  // Bar widths: winner = 84%, last = 52%. Gaps exaggerated for visual clarity.
  const getBarPct = gap =>
    maxGap > 0 ? 84 - (gap / maxGap) * 32 : 84;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '24px 28px',
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

      <div style={{ marginBottom: '22px' }}>
        <div style={{ fontSize: '11px', color: 'rgba(238,238,255,0.35)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>
          Final Classification
        </div>
        <div className="orbitron" style={{ fontSize: '18px', fontWeight: 700 }}>
          Race Finish
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {finishData.map(({ driver, gap }, i) => {
          const barPct = getBarPct(gap);
          const isWinner = i === 0;
          const posColor = i < 3 ? MEDAL[i] : 'rgba(238,238,255,0.28)';

          return (
            <motion.div
              key={driver.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                height: '44px',
              }}
            >
              {/* Position */}
              <div className="orbitron" style={{
                width: '30px',
                fontSize: '12px',
                fontWeight: 800,
                color: posColor,
                textAlign: 'right',
                flexShrink: 0,
                letterSpacing: '0.5px',
              }}>
                P{i + 1}
              </div>

              {/* Driver ID */}
              <div className="orbitron" style={{
                width: '36px',
                fontSize: '11px',
                fontWeight: 700,
                color: driver.color,
                flexShrink: 0,
                letterSpacing: '0.5px',
              }}>
                {driver.id}
              </div>

              {/* Bar + Car area */}
              <div style={{
                flex: 1,
                position: 'relative',
                height: '100%',
                // Right padding reserves space for car icon sticking past bar end
                paddingRight: '72px',
              }}>
                {/* Track */}
                <div style={{
                  position: 'absolute',
                  left: 0, right: '72px',
                  top: '15px', height: '14px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '4px',
                }} />

                {/* Animated bar fill */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${barPct}%` }}
                  transition={{ duration: 0.9, delay: 0.15 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '15px', height: '14px',
                    borderRadius: '4px',
                    background: `linear-gradient(90deg, ${driver.color}22 0%, ${driver.color}75 100%)`,
                    overflow: 'visible',
                  }}
                >
                  {/* Inner sheen */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%)',
                    borderRadius: '4px',
                  }} />

                  {/* F1 car icon at bar tip */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35, delay: 0.7 + i * 0.07 }}
                    style={{
                      position: 'absolute',
                      right: '-62px',
                      top: '50%',
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
                width: '80px',
                fontSize: '10px',
                fontWeight: 700,
                color: isWinner ? '#FFD700' : 'rgba(238,238,255,0.4)',
                flexShrink: 0,
                letterSpacing: '0.3px',
                textAlign: 'left',
              }}>
                {formatGap(gap)}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
