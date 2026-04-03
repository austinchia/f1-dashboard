import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function buildGridEntry(grid = []) {
  const positions = {};
  grid.forEach((driverId, index) => {
    positions[driverId] = index + 1;
  });
  return { lap: 0, positions };
}

export default function Leaderboard({ positionsByLap, drivers, grid = [], dnfLaps = {}, currentLap }) {
  const lap = Math.min(Math.floor(currentLap), positionsByLap[positionsByLap.length - 1]?.lap ?? 1);
  const entry = lap < 1
    ? buildGridEntry(grid)
    : positionsByLap.find(e => e.lap === lap);

  const ordered = useMemo(() => {
    if (!entry) return [];
    return [...drivers]
      .filter(d => entry.positions[d.id] != null)
      .sort((a, b) => entry.positions[a.id] - entry.positions[b.id]);
  }, [entry, drivers]);

  if (ordered.length === 0) return null;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '10px 8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '0px',
      width: '130px',
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      <span className="orbitron" style={{
        fontSize: '8px',
        fontWeight: 700,
        letterSpacing: '2px',
        color: 'var(--text-muted)',
        marginBottom: '6px',
        paddingLeft: '2px',
        flexShrink: 0,
      }}>
        ORDER
      </span>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <AnimatePresence initial={false}>
          {ordered.map((driver, idx) => {
            const pos = entry.positions[driver.id];
            const isDnf = dnfLaps[driver.id] != null && currentLap > dnfLaps[driver.id];
            const isLeader = pos === 1;

            return (
              <motion.div
                key={driver.id}
                layout
                layoutId={`lb-${driver.id}`}
                transition={{ type: 'spring', stiffness: 80, damping: 20 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 4px',
                  borderRadius: '5px',
                  background: isLeader ? 'rgba(232,0,45,0.08)' : 'transparent',
                }}
              >
                {/* Position number */}
                <span className="orbitron" style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  color: isDnf ? 'var(--dnf-color)' : isLeader ? 'var(--accent-red)' : 'var(--text-dim)',
                  minWidth: '18px',
                  textAlign: 'right',
                }}>
                  P{pos}
                </span>

                {/* Color bar */}
                <div style={{
                  width: '2px',
                  height: '14px',
                  borderRadius: '1px',
                  background: isDnf ? 'var(--dnf-color)' : driver.color,
                  flexShrink: 0,
                  opacity: isDnf ? 0.4 : 1,
                }} />

                {/* Driver abbr */}
                <span className="orbitron" style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: isDnf ? 'var(--dnf-color)' : driver.color,
                  letterSpacing: '0.5px',
                  opacity: isDnf ? 0.5 : 1,
                }}>
                  {driver.id}
                </span>

                {/* DNF tag */}
                {isDnf && (
                  <span style={{
                    fontSize: '7px',
                    color: 'var(--dnf-color)',
                    fontFamily: 'Orbitron, monospace',
                    marginLeft: 'auto',
                  }}>
                    DNF
                  </span>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
