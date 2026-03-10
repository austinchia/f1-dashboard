import { motion } from 'framer-motion';
import { DRIVERS, TIRE_COLORS } from '../data/raceData';

const TIRE_LABEL = { S: 'Soft', M: 'Medium', H: 'Hard' };

export default function TireStrategy({ driverStats, totalLaps, selectedDrivers, driverList }) {
  const drivers = driverList ?? DRIVERS;
  const activeDrivers = drivers.filter(d => selectedDrivers.includes(d.id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(255,200,0,0.5), transparent)',
      }} />

      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'rgba(238,238,255,0.35)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>
            Strategy
          </div>
          <div className="orbitron" style={{ fontSize: '18px', fontWeight: 700 }}>
            Tire Compounds
          </div>
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {Object.entries(TIRE_LABEL).map(([key, label]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: TIRE_COLORS[key],
                border: key === 'H' ? '1px solid rgba(255,255,255,0.3)' : 'none',
                boxShadow: `0 0 6px ${TIRE_COLORS[key]}80`,
              }} />
              <span style={{ fontSize: '11px', color: 'rgba(238,238,255,0.4)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lap axis */}
      <div style={{ marginLeft: '56px', marginBottom: '8px', position: 'relative' }}>
        {[1, 10, 20, 30, 40, 50, totalLaps].map(lap => (
          <span key={lap} style={{
            position: 'absolute',
            left: `${((lap - 1) / (totalLaps - 1)) * 100}%`,
            fontSize: '10px',
            color: 'rgba(238,238,255,0.25)',
            transform: 'translateX(-50%)',
            fontFamily: 'Orbitron, monospace',
          }}>{lap}</span>
        ))}
        <div style={{ height: '12px' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {activeDrivers.map((driver, di) => {
          const stats = driverStats?.[driver.id];
          if (!stats) return null;

          return (
            <motion.div
              key={driver.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: di * 0.05 }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {/* Driver label */}
              <div style={{
                width: '48px',
                fontSize: '11px',
                fontWeight: 700,
                color: driver.color,
                fontFamily: 'Orbitron, monospace',
                flexShrink: 0,
                letterSpacing: '0.5px',
              }}>
                {driver.id}
              </div>

              {/* Stint bars */}
              <div style={{ flex: 1, display: 'flex', height: '22px', gap: '2px', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                {stats.stints.map((stint, si) => {
                  const width = ((stint.laps) / totalLaps) * 100;
                  return (
                    <motion.div
                      key={si}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.5, delay: di * 0.05 + si * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        width: `${width}%`,
                        background: `${TIRE_COLORS[stint.tire]}${stint.tire === 'H' ? 'dd' : 'cc'}`,
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transformOrigin: 'left',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: `linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)`,
                      }} />
                      {width > 8 && (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: stint.tire === 'H' ? '#111' : 'rgba(0,0,0,0.8)',
                          fontFamily: 'Orbitron, monospace',
                          position: 'relative',
                          zIndex: 1,
                        }}>
                          {stint.laps}L
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Pit count */}
              <div style={{ fontSize: '11px', color: 'rgba(238,238,255,0.3)', width: '20px', textAlign: 'right' }}>
                {stats.pitCount}×
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
