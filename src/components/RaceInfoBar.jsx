import { motion } from 'framer-motion';
import { DRIVERS } from '../data/raceData';

export default function RaceInfoBar({ race, driverStats, selectedDrivers, driverList }) {
  if (!race || !driverStats) return null;

  const drivers = driverList ?? DRIVERS;
  const activeDrivers = drivers.filter(d => selectedDrivers.includes(d.id));

  const fastestLapDriver = activeDrivers.reduce((best, d) => {
    const s = driverStats[d.id];
    if (!s) return best;
    if (!best || s.fastestLapSec < driverStats[best.id]?.fastestLapSec) return d;
    return best;
  }, null);

  const bestAvgDriver = activeDrivers.reduce((best, d) => {
    const s = driverStats[d.id];
    if (!s) return best;
    if (!best || s.avgPaceSec < driverStats[best.id]?.avgPaceSec) return d;
    return best;
  }, null);

  const stats = [
    { label: 'Circuit', value: race.circuit },
    { label: 'Race Laps', value: race.laps },
    { label: 'Date', value: race.date },
    {
      label: 'Overall Fastest',
      value: fastestLapDriver ? `${fastestLapDriver.id} ${driverStats[fastestLapDriver.id]?.fastestLap}` : '—',
      color: '#c060ff',
    },
    {
      label: 'Best Avg Pace',
      value: bestAvgDriver ? `${bestAvgDriver.id} ${driverStats[bestAvgDriver.id]?.avgPace}` : '—',
      color: '#27F4D2',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      style={{
        display: 'flex',
        gap: '1px',
        background: 'var(--border)',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid var(--border)',
      }}
    >
      {stats.map((stat, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            background: 'var(--bg-card)',
            padding: '14px 16px',
            minWidth: 0,
          }}
        >
          <div style={{ fontSize: '10px', color: 'rgba(238,238,255,0.3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
            {stat.label}
          </div>
          <div className="orbitron" style={{ fontSize: '13px', fontWeight: 600, color: stat.color || 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {stat.value}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
