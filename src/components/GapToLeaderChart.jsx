import { motion } from 'framer-motion';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { DRIVERS } from '../data/raceData';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div style={{
      background: 'rgba(10, 10, 20, 0.95)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '10px',
      padding: '12px 16px',
      backdropFilter: 'blur(20px)',
      minWidth: '150px',
    }}>
      <div style={{ fontSize: '11px', color: 'rgba(238,238,255,0.4)', marginBottom: '8px', fontFamily: 'Orbitron, monospace', letterSpacing: '1px' }}>
        LAP {label}
      </div>
      {payload
        .filter(p => p.value > 0)
        .sort((a, b) => a.value - b.value)
        .map(p => (
          <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.color }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: p.color }}>{p.dataKey}</span>
            </div>
            <span style={{ fontSize: '11px', color: 'rgba(238,238,255,0.85)', fontFamily: 'Orbitron, monospace' }}>
              +{p.value.toFixed(2)}s
            </span>
          </div>
        ))}
    </div>
  );
};

export default function GapToLeaderChart({ data, selectedDrivers }) {
  const activeDrivers = DRIVERS.filter(d => selectedDrivers.includes(d.id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
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
        background: 'linear-gradient(90deg, transparent, rgba(0,144,255,0.5), transparent)',
      }} />

      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '11px', color: 'rgba(238,238,255,0.35)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>
          Cumulative Gap
        </div>
        <div className="orbitron" style={{ fontSize: '18px', fontWeight: 700 }}>
          Gap to Leader
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="lap"
            tick={{ fill: 'rgba(238,238,255,0.3)', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            tickLine={false}
            label={{ value: 'Lap', position: 'insideBottom', offset: -2, fill: 'rgba(238,238,255,0.25)', fontSize: 11 }}
          />
          <YAxis
            tick={{ fill: 'rgba(238,238,255,0.3)', fontSize: 11, fontFamily: 'Orbitron, monospace' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `+${v.toFixed(0)}s`}
            width={46}
          />
          <Tooltip content={<CustomTooltip />} />
          {activeDrivers.map(driver => (
            <Line
              key={driver.id}
              type="monotone"
              dataKey={driver.id}
              stroke={driver.color}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: driver.color, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
