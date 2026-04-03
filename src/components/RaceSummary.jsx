import { useMemo } from 'react';

const COMPOUND_COLORS = {
  SOFT: '#e8002d',
  MEDIUM: '#ffd700',
  HARD: '#d8d8d8',
  INTERMEDIATE: '#39b54a',
  WET: '#2196f3',
};

function compoundColor(c) {
  return COMPOUND_COLORS[c?.toUpperCase()] ?? '#666';
}

function compoundLabel(c) {
  return { SOFT: 'S', MEDIUM: 'M', HARD: 'H', INTERMEDIATE: 'I', WET: 'W' }[c?.toUpperCase()] ?? '?';
}

// Derive overtake events from consecutive lap position changes
function computeOvertakes(positionsByLap, drivers) {
  const events = [];
  for (let i = 1; i < positionsByLap.length; i++) {
    const prev = positionsByLap[i - 1].positions;
    const curr = positionsByLap[i].positions;
    const lap = positionsByLap[i].lap;
    for (const driver of drivers) {
      const p0 = prev[driver.id];
      const p1 = curr[driver.id];
      if (p0 != null && p1 != null && p1 < p0) {
        // Find who they passed (the driver who was at p1 before and is now worse)
        const displaced = drivers.find(d => prev[d.id] === p1 && curr[d.id] > p1);
        events.push({
          lap,
          driverId: driver.id,
          from: p0,
          to: p1,
          gain: p0 - p1,
          displaced: displaced?.id ?? null,
        });
      }
    }
  }
  // Sort by lap, then by position gained (biggest moves first within same lap)
  return events.sort((a, b) => a.lap - b.lap || b.gain - a.gain);
}

function PodiumCard({ driver, finalPos, posGained, isFastestLap, isP1 }) {
  if (!driver) return <div style={{ flex: 1 }} />;

  const medal = isP1 ? '#FFD700' : finalPos === 2 ? '#C0C0C0' : '#CD7F32';
  const gainColor = posGained > 0 ? '#4ade80' : posGained < 0 ? '#f87171' : 'var(--text-muted)';
  const gainLabel = posGained > 0 ? `+${posGained}` : posGained < 0 ? `${posGained}` : '—';

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: `1px solid ${isP1 ? 'rgba(255,215,0,0.25)' : 'var(--border)'}`,
      borderRadius: '10px',
      padding: isP1 ? '20px 16px' : '16px 14px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '6px',
      flex: 1,
      position: 'relative',
      boxShadow: isP1 ? '0 0 24px rgba(255,215,0,0.08)' : 'none',
    }}>
      {/* Position badge */}
      <div style={{
        width: isP1 ? '36px' : '28px',
        height: isP1 ? '36px' : '28px',
        borderRadius: '50%',
        background: medal,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 0 12px ${medal}55`,
      }}>
        <span className="orbitron" style={{ fontSize: isP1 ? '14px' : '11px', fontWeight: 900, color: '#000' }}>
          P{finalPos}
        </span>
      </div>

      {/* Driver color bar */}
      <div style={{ width: '32px', height: '3px', background: driver.color, borderRadius: '2px', boxShadow: `0 0 8px ${driver.color}66` }} />

      {/* Driver abbr */}
      <span className="orbitron" style={{ fontSize: isP1 ? '22px' : '16px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '1px' }}>
        {driver.id}
      </span>

      {/* Full name */}
      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif', textAlign: 'center', lineHeight: 1.3 }}>
        {driver.name}
      </span>

      {/* Team */}
      <span style={{ fontSize: '9px', color: driver.color, fontFamily: 'Orbitron, monospace', letterSpacing: '1px', textTransform: 'uppercase' }}>
        {driver.team}
      </span>

      {/* Positions gained */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
        <span style={{ fontSize: '10px', color: gainColor, fontFamily: 'Orbitron, monospace', fontWeight: 700 }}>
          {gainLabel}
        </span>
        <span style={{ fontSize: '9px', color: 'var(--text-dim)', fontFamily: 'Inter, sans-serif' }}>
          {posGained === 0 ? 'positions' : posGained > 0 ? 'gained' : 'lost'}
        </span>
      </div>

      {/* Fastest lap badge */}
      {isFastestLap && (
        <div style={{
          background: 'rgba(155,0,255,0.2)',
          border: '1px solid rgba(155,0,255,0.4)',
          borderRadius: '4px',
          padding: '2px 6px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9b00ff' }} />
          <span style={{ fontSize: '8px', color: '#cc80ff', fontFamily: 'Orbitron, monospace', letterSpacing: '1px' }}>FL</span>
        </div>
      )}
    </div>
  );
}

export default function RaceSummary({ race, drivers, positionsByLap, dnfLaps = {}, stints = {}, fastestLap = null, grid = [] }) {
  const finalEntry = positionsByLap[positionsByLap.length - 1];
  const firstEntry = positionsByLap[0];

  // Starting positions: prefer grid array, fall back to lap 1 positions
  const startPos = useMemo(() => {
    const sp = {};
    if (grid.length > 0) {
      grid.forEach((id, i) => { sp[id] = i + 1; });
    } else if (firstEntry) {
      Object.entries(firstEntry.positions).forEach(([id, pos]) => { sp[id] = pos; });
    }
    return sp;
  }, [grid, firstEntry]);

  const finalPos = finalEntry?.positions ?? {};

  // Podium top 3
  const podium = [1, 2, 3].map(pos => {
    const driverId = Object.entries(finalPos).find(([, p]) => p === pos)?.[0];
    const driver = drivers.find(d => d.id === driverId);
    const gained = (startPos[driverId] ?? pos) - pos;
    return { driver, finalPos: pos, posGained: gained, isFastestLap: fastestLap?.driver === driverId };
  });

  // Overtake events
  const overtakes = useMemo(() => computeOvertakes(positionsByLap, drivers), [positionsByLap, drivers]);

  // Drivers sorted by finish position for stint table
  const sortedDrivers = useMemo(() => {
    return [...drivers].sort((a, b) => {
      const pa = finalPos[a.id] ?? 99;
      const pb = finalPos[b.id] ?? 99;
      return pa - pb;
    });
  }, [drivers, finalPos]);

  // Total race laps (for stint width calc)
  const totalLaps = race.laps;

  const hasStintData = Object.keys(stints).length > 0;
  const hasOvertakes = overtakes.length > 0;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <style>{`
        @media (max-width: 700px) {
          .summary-overtake { width: 100% !important; order: 2; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '3px', height: '28px', background: 'linear-gradient(180deg, #e8002d 0%, rgba(232,0,45,0.3) 100%)', borderRadius: '2px', boxShadow: '0 0 10px rgba(232,0,45,0.5)' }} />
        <div>
          <h2 className="orbitron" style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '1px' }}>
            RACE SUMMARY
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, fontFamily: 'Inter, sans-serif' }}>
            {race.label} · {race.circuit} · {race.date}
          </p>
        </div>
        {fastestLap && (
          <div style={{ marginLeft: 'auto', background: 'rgba(155,0,255,0.15)', border: '1px solid rgba(155,0,255,0.3)', borderRadius: '8px', padding: '8px 14px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '8px', color: '#cc80ff', fontFamily: 'Orbitron, monospace', letterSpacing: '2px' }}>FASTEST LAP</span>
            <span className="orbitron" style={{ fontSize: '15px', fontWeight: 900, color: '#9b00ff' }}>{fastestLap.driver}</span>
            <span style={{ fontSize: '11px', color: '#cc80ff', fontFamily: 'Orbitron, monospace' }}>{fastestLap.time} · Lap {fastestLap.lap}</span>
          </div>
        )}
      </div>

      {/* Podium */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px',
      }}>
        <h3 className="orbitron" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '3px', color: 'var(--text-muted)', margin: '0 0 16px', textTransform: 'uppercase' }}>
          Podium
        </h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          {/* P2 left, P1 center (raised), P3 right */}
          <PodiumCard {...podium[1]} isP1={false} />
          <PodiumCard {...podium[0]} isP1={true} />
          <PodiumCard {...podium[2]} isP1={false} />
        </div>
      </div>

      {/* Stint table + Overtake log: side-by-side on desktop, stacked on mobile */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch', flexWrap: 'wrap' }}>

        {/* Overtake log */}
        <div className="summary-overtake" style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '16px',
          flex: '0 0 auto',
          width: '280px',
          order: 2,
          display: 'flex',
          flexDirection: 'column',
        }}>
          <h3 className="orbitron" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '3px', color: 'var(--text-muted)', margin: '0 0 12px', textTransform: 'uppercase' }}>
            Position Changes
          </h3>
          {!hasOvertakes ? (
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'Inter, sans-serif' }}>No data</span>
          ) : (
            <div style={{ overflowY: 'auto', maxHeight: '320px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {overtakes.slice(0, 40).map((ev, i) => {
                const driver = drivers.find(d => d.id === ev.driverId);
                if (!driver) return null;
                return (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '5px 8px',
                    borderRadius: '6px',
                    background: 'var(--bg-secondary)',
                  }}>
                    {/* Lap badge */}
                    <span className="orbitron" style={{ fontSize: '9px', color: 'var(--text-dim)', minWidth: '36px', letterSpacing: '1px' }}>
                      L{ev.lap}
                    </span>
                    {/* Driver color dot */}
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: driver.color, flexShrink: 0, boxShadow: `0 0 4px ${driver.color}` }} />
                    {/* Driver abbr */}
                    <span className="orbitron" style={{ fontSize: '10px', fontWeight: 700, color: driver.color, minWidth: '28px' }}>
                      {ev.driverId}
                    </span>
                    {/* Move */}
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'Orbitron, monospace' }}>
                      P{ev.from}
                    </span>
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                      <path d="M1 5h10M7 1l4 4-4 4" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#4ade80', fontFamily: 'Orbitron, monospace' }}>
                      P{ev.to}
                    </span>
                    {ev.displaced && (
                      <span style={{ fontSize: '9px', color: 'var(--text-dim)', fontFamily: 'Inter, sans-serif', marginLeft: 'auto' }}>
                        past {ev.displaced}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stint table */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '16px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          order: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <h3 className="orbitron" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '3px', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase' }}>
              Tyre Strategy
            </h3>
            {!hasStintData && (
              <span style={{ fontSize: '9px', color: 'var(--text-dim)', fontFamily: 'Inter, sans-serif' }}>
                Re-run scripts/fetch_laps.py for tyre data
              </span>
            )}
            {hasStintData && (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET'].map(c => {
                  const used = Object.values(stints).some(ss => Array.isArray(ss) && ss.some(s => s.compound === c));
                  if (!used) return null;
                  return (
                    <div key={c} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: compoundColor(c) }} />
                      <span style={{ fontSize: '9px', color: 'var(--text-dim)', fontFamily: 'Orbitron, monospace' }}>{c[0]} – {c}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {!hasStintData ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'Orbitron, monospace', letterSpacing: '1px' }}>
                TYRE DATA UNAVAILABLE
              </span>
            </div>
          ) : (
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {/* Lap scale header */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', paddingLeft: '52px', position: 'relative', minHeight: '12px' }}>
                {[1, 10, 20, 30, 40, 50, totalLaps].filter(l => l <= totalLaps).map(l => (
                  <div key={l} style={{
                    position: 'absolute',
                    left: `calc(52px + ${((l - 1) / (totalLaps - 1)) * 100}%)`,
                    fontSize: '8px',
                    color: 'var(--text-dim)',
                    fontFamily: 'Orbitron, monospace',
                    transform: 'translateX(-50%)',
                  }}>
                    {l}
                  </div>
                ))}
              </div>

              {sortedDrivers.map(driver => {
                const driverStints = stints[driver.id];
                const finPos = finalPos[driver.id];
                const isDnf = dnfLaps[driver.id] != null;
                if (!driverStints || driverStints.length === 0) return null;

                return (
                  <div key={driver.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', minHeight: '24px' }}>
                    {/* Driver label */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', width: '44px', flexShrink: 0 }}>
                      <span style={{ fontSize: '8px', color: 'var(--text-dim)', fontFamily: 'Orbitron, monospace', minWidth: '16px', textAlign: 'right' }}>
                        {finPos ? `P${finPos}` : '—'}
                      </span>
                      <span className="orbitron" style={{ fontSize: '9px', fontWeight: 700, color: isDnf ? 'var(--dnf-color)' : driver.color }}>
                        {driver.id}
                      </span>
                    </div>

                    {/* Stint bars */}
                    <div style={{ flex: 1, position: 'relative', height: '18px', minWidth: 0 }}>
                      {driverStints.map((stint, idx) => {
                        const startPct = ((stint.startLap - 1) / (totalLaps - 1)) * 100;
                        const endPct = ((Math.min(stint.endLap, totalLaps) - 1) / (totalLaps - 1)) * 100;
                        const widthPct = Math.max(endPct - startPct, 0.5);
                        const color = compoundColor(stint.compound);
                        return (
                          <div
                            key={idx}
                            title={`${driver.id}: ${stint.compound} (L${stint.startLap}–${stint.endLap})`}
                            style={{
                              position: 'absolute',
                              left: `${startPct}%`,
                              width: `${widthPct}%`,
                              height: '100%',
                              background: color,
                              borderRadius: '3px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              opacity: isDnf ? 0.5 : 0.9,
                              border: `1px solid ${color}88`,
                            }}
                          >
                            {widthPct > 5 && (
                              <span style={{ fontSize: '8px', fontFamily: 'Orbitron, monospace', fontWeight: 900, color: '#000', userSelect: 'none' }}>
                                {compoundLabel(stint.compound)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
