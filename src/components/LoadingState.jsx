import { motion } from 'framer-motion';

function SkeletonBlock({ height = 200, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 1.6, repeat: Infinity, delay, ease: 'easeInOut' }}
      style={{
        height,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 100%)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    />
  );
}

export function LoadingSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      <SkeletonBlock height={60} delay={0} />
      <SkeletonBlock height={360} delay={0.1} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <SkeletonBlock height={300} delay={0.2} />
        <SkeletonBlock height={300} delay={0.25} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[0, 1, 2, 3].map(i => <SkeletonBlock key={i} height={120} delay={0.3 + i * 0.05} />)}
      </div>
    </motion.div>
  );
}

export function ErrorState({ message }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        background: 'rgba(232,0,45,0.05)',
        border: '1px solid rgba(232,0,45,0.2)',
        borderRadius: '16px',
        padding: '40px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '24px', marginBottom: '12px' }}>⚠</div>
      <div className="orbitron" style={{ fontSize: '14px', color: 'rgba(232,0,45,0.8)', marginBottom: '8px' }}>
        Failed to load race data
      </div>
      <div style={{ fontSize: '13px', color: 'rgba(238,238,255,0.4)', maxWidth: '400px', margin: '0 auto' }}>
        {message}
      </div>
    </motion.div>
  );
}

export function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '60px 40px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.4 }}>🏎</div>
      <div className="orbitron" style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
        Select a Race
      </div>
      <div style={{ fontSize: '13px', color: 'rgba(238,238,255,0.35)' }}>
        Choose a completed 2026 Grand Prix from the dropdown above to load live race data.
      </div>
    </motion.div>
  );
}
