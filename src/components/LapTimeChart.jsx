import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { DRIVERS } from '../data/raceData';

function formatTime(seconds) {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(3).padStart(6, '0');
  return `${m}:${s}`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div style={{
      background: 'rgba(10, 10, 20, 0.95)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '10px',
      padding: '12px 16px',
      backdropFilter: 'blur(20px)',
      minWidth: '160px',
    }}>
      <div style={{ fontSize: '11px', color: 'rgba(238,238,255,0.4)', marginBottom: '8px', fontFamily: 'Orbitron, monospace', letterSpacing: '1px' }}>
        LAP {label}
      </div>
      {payload
        .filter(p => p.value)
        .sort((a, b) => a.value - b.value)
        .map(p => (
          <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.color, boxShadow: `0 0 6px ${p.color}` }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: p.color }}>{p.dataKey}</span>
            </div>
            <span style={{ fontSize: '11px', color: 'rgba(238,238,255,0.85)', fontFamily: 'Orbitron, monospace' }}>
              {formatTime(p.value)}
            </span>
          </div>
        ))}
    </div>
  );
};

export default function LapTimeChart({ data, selectedDrivers, driverList }) {
  const drivers = driverList ?? DRIVERS;
  const activeDrivers = drivers.filter(d => selectedDrivers.includes(d.id));

  // Y-axis domain: filter nulls, get range
  const allValues = data.flatMap(d => activeDrivers.map(dr => d[dr.id]).filter(Boolean));
  const minVal = allValues.length ? Math.min(...allValues) - 0.5 : 80;
  const maxVal = allValues.length ? Math.max(...allValues) + 0.5 : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow accent */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(232,0,45,0.6), transparent)',
      }} />

      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'rgba(238,238,255,0.35)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>
            Race Analysis
          </div>
          <div className="orbitron" style={{ fontSize: '18px', fontWeight: 700 }}>
            Lap Time Comparison
          </div>
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(238,238,255,0.3)', textAlign: 'right', lineHeight: 1.6 }}>
          <div>Pit laps excluded</div>
          <div style={{ color: 'rgba(232,0,45,0.6)' }}>● SC laps highlighted</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />

          {/* Safety car reference */}
          <ReferenceLine x={20} stroke="rgba(255,200,0,0.2)" strokeDasharray="4 4" label={{ value: 'SC', fill: 'rgba(255,200,0,0.5)', fontSize: 10, fontFamily: 'Orbitron' }} />

          <XAxis
            dataKey="lap"
            tick={{ fill: 'rgba(238,238,255,0.3)', fontSize: 11, fontFamily: 'Inter' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            tickLine={false}
            label={{ value: 'Lap', position: 'insideBottom', offset: -2, fill: 'rgba(238,238,255,0.25)', fontSize: 11 }}
          />
          <YAxis
            domain={[minVal, maxVal]}
            tick={{ fill: 'rgba(238,238,255,0.3)', fontSize: 11, fontFamily: 'Orbitron, monospace' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatTime}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />

          {activeDrivers.map(driver => (
            <Line
              key={driver.id}
              type="monotone"
              dataKey={driver.id}
              stroke={driver.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: driver.color, strokeWidth: 0 }}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
