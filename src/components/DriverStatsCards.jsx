import { motion } from 'framer-motion';
import { DRIVERS } from '../data/raceData';

function StatItem({ label, value, accent }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '10px', color: 'rgba(238,238,255,0.3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '3px' }}>
        {label}
      </div>
      <div className="orbitron" style={{ fontSize: '13px', fontWeight: 600, color: accent || 'var(--text-primary)', letterSpacing: '0.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </div>
    </div>
  );
}

export default function DriverStatsCards({ driverStats, selectedDrivers, driverList }) {
  const drivers = driverList ?? DRIVERS;
  const activeDrivers = drivers.filter(d => selectedDrivers.includes(d.id));

  if (!driverStats) return null;

  // Find overall fastest lap
  const fastestSec = Math.min(...activeDrivers.map(d => driverStats[d.id]?.fastestLapSec || Infinity));

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '12px',
    }}>
      {activeDrivers.map((driver, i) => {
        const stats = driverStats[driver.id];
        if (!stats) return null;
        const isFastest = Math.abs(stats.fastestLapSec - fastestSec) < 0.001;

        return (
          <motion.div
            key={driver.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            whileHover={{ y: -2, scale: 1.01 }}
            style={{
              background: `linear-gradient(135deg, ${driver.color}12 0%, rgba(12,12,24,0.8) 60%)`,
              border: `1px solid ${driver.color}25`,
              borderRadius: '14px',
              padding: '16px',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'default',
            }}
          >
            {/* Background glow */}
            <div style={{
              position: 'absolute',
              top: -30,
              right: -30,
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: driver.color,
              opacity: 0.06,
              filter: 'blur(20px)',
            }} />

            {/* Fastest lap badge */}
            {isFastest && (
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(155,0,200,0.2)',
                border: '1px solid rgba(155,0,200,0.4)',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '9px',
                color: '#c060ff',
                fontFamily: 'Orbitron, monospace',
                letterSpacing: '0.5px',
              }}>
                FL
              </div>
            )}

            {/* Driver ID */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{
                width: '3px',
                height: '24px',
                background: driver.color,
                borderRadius: '2px',
                boxShadow: `0 0 8px ${driver.color}80`,
                flexShrink: 0,
              }} />
              <div>
                <div className="orbitron" style={{ fontSize: '15px', fontWeight: 800, color: driver.color, letterSpacing: '1px' }}>
                  {driver.id}
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(238,238,255,0.35)', marginTop: '1px' }}>
                  {driver.shortTeam}
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <StatItem label="Best Lap" value={stats.fastestLap} accent={isFastest ? '#c060ff' : undefined} />
              <StatItem label="Avg Pace" value={stats.avgPace} />
              <StatItem label="Pit Stops" value={`${stats.pitCount} stop${stats.pitCount !== 1 ? 's' : ''}`} />
              <StatItem label="Stints" value={stats.stints.map(s => s.tire).join(' › ')} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
