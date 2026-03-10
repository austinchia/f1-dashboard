import { motion } from 'framer-motion';
import { DRIVERS } from '../data/raceData';

export default function DriverSelector({ selected, onToggle, driverStats }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}
    >
      {DRIVERS.map((driver, i) => {
        const isActive = selected.includes(driver.id);
        const stats = driverStats?.[driver.id];

        return (
          <motion.button
            key={driver.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onToggle(driver.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 14px',
              background: isActive
                ? `linear-gradient(135deg, ${driver.color}18 0%, ${driver.color}08 100%)`
                : 'rgba(255,255,255,0.03)',
              border: `1px solid ${isActive ? driver.color + '50' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Color dot */}
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: driver.color,
              boxShadow: isActive ? `0 0 8px ${driver.color}` : 'none',
              flexShrink: 0,
              transition: 'box-shadow 0.2s',
            }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 700,
                color: isActive ? driver.color : 'rgba(238,238,255,0.5)',
                letterSpacing: '0.5px',
                fontFamily: 'Orbitron, monospace',
                transition: 'color 0.2s',
              }}>
                {driver.id}
              </div>
              {stats && (
                <div style={{
                  fontSize: '10px',
                  color: isActive ? 'rgba(238,238,255,0.5)' : 'rgba(238,238,255,0.25)',
                  transition: 'color 0.2s',
                  marginTop: '1px',
                }}>
                  {stats.fastestLap}
                </div>
              )}
            </div>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
