// Transform raw OpenF1 API data → the chart/stats format our components expect

import { TIRE_COLORS } from '../data/raceData';

const COMPOUND_SHORT = { SOFT: 'S', MEDIUM: 'M', HARD: 'H', INTERMEDIATE: 'I', WET: 'W' };

// Assign a deterministic color to drivers not already in our DRIVERS list
const PALETTE = [
  '#3671C6', '#FF8000', '#E8002D', '#B51119', '#27F4D2',
  '#16C4AE', '#358C75', '#E8730A', '#9B0000', '#C0C0C0',
];

function padTime(sec) {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(3).padStart(6, '0');
  return `${m}:${s}`;
}

export function transformBundle({ session, drivers, laps, stints, pits }) {
  // Avoid Math.max(...largeArray) call-stack issues — use reduce instead
  const maxLapFromData = laps.reduce((max, l) => (l.lap_number != null && l.lap_number > max ? l.lap_number : max), 0);
  const totalLaps = session.total_laps ?? maxLapFromData;
  if (totalLaps === 0) throw new Error('Race lap data is not yet available for this session.');

  // Build driver map: number → driver object
  const driverMap = {};
  drivers.forEach((d, i) => {
    driverMap[d.driver_number] = {
      id: d.name_acronym,
      name: d.full_name,
      team: d.team_name,
      shortTeam: d.team_name?.split(' ').slice(-1)[0] ?? d.team_name,
      color: d.team_colour
        ? (d.team_colour.startsWith('#') ? d.team_colour : `#${d.team_colour}`)
        : PALETTE[i % PALETTE.length],
      driverNumber: d.driver_number,
      headshotUrl: d.headshot_url,
    };
  });

  const driverList = Object.values(driverMap);

  // Build per-driver lap arrays, skip pit-out laps and outliers
  const lapsByDriver = {};
  driverList.forEach(d => { lapsByDriver[d.id] = {}; });

  laps.forEach(lap => {
    const driver = driverMap[lap.driver_number];
    if (!driver) return;
    if (!lap.lap_duration || lap.is_pit_out_lap) return;
    lapsByDriver[driver.id][lap.lap_number] = {
      lap: lap.lap_number,
      time: lap.lap_duration,
      timeStr: padTime(lap.lap_duration),
      isPit: false,
    };
  });

  // Mark pit laps
  pits.forEach(pit => {
    const driver = driverMap[pit.driver_number];
    if (!driver) return;
    const lapNum = pit.lap_number;
    if (lapsByDriver[driver.id][lapNum]) {
      lapsByDriver[driver.id][lapNum].isPit = true;
    }
  });

  // Build stint data per driver
  const stintsByDriver = {};
  driverList.forEach(d => { stintsByDriver[d.id] = []; });

  stints.forEach(s => {
    const driver = driverMap[s.driver_number];
    if (!driver) return;
    const tire = COMPOUND_SHORT[s.compound] ?? s.compound?.[0] ?? '?';
    stintsByDriver[driver.id].push({
      tire,
      start: s.lap_start,
      end: s.lap_end ?? totalLaps,
      laps: (s.lap_end ?? totalLaps) - s.lap_start + 1,
    });
  });
  // Sort stints by lap_start
  driverList.forEach(d => {
    stintsByDriver[d.id].sort((a, b) => a.start - b.start);
  });

  // Build lap chart data (one row per lap, columns = driver acronyms)
  const lapChartData = [];
  for (let lap = 1; lap <= totalLaps; lap++) {
    const entry = { lap };
    driverList.forEach(d => {
      const lapData = lapsByDriver[d.id][lap];
      if (lapData && !lapData.isPit) {
        entry[d.id] = parseFloat(lapData.time.toFixed(3));
      }
    });
    lapChartData.push(entry);
  }

  // Build gap-to-leader (cumulative)
  const cumulative = {};
  driverList.forEach(d => { cumulative[d.id] = 0; });

  const gapData = [];
  for (let lap = 1; lap <= totalLaps; lap++) {
    driverList.forEach(d => {
      const ld = lapsByDriver[d.id][lap];
      if (ld) cumulative[d.id] += ld.time;
    });
    const min = Math.min(...driverList.map(d => cumulative[d.id]).filter(v => v > 0));
    const entry = { lap };
    driverList.forEach(d => {
      if (cumulative[d.id] > 0) {
        entry[d.id] = parseFloat((cumulative[d.id] - min).toFixed(3));
      }
    });
    gapData.push(entry);
  }

  // Build per-driver stats
  const driverStats = {};
  driverList.forEach(d => {
    const times = Object.values(lapsByDriver[d.id])
      .filter(l => !l.isPit)
      .map(l => l.time);
    if (!times.length) return;
    const fastest = Math.min(...times);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const pitCount = Object.values(lapsByDriver[d.id]).filter(l => l.isPit).length;
    driverStats[d.id] = {
      fastestLap: padTime(fastest),
      fastestLapSec: fastest,
      avgPace: padTime(avg),
      avgPaceSec: avg,
      pitCount,
      stints: stintsByDriver[d.id],
    };
  });

  const race = {
    id: `m${session.meeting_key}`,
    label: session.meeting_name ?? session.location,
    circuit: session.circuit_short_name ?? session.location,
    laps: totalLaps,
    date: session.date_start
      ? new Date(session.date_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : '2026',
  };

  return { race, lapChartData, gapData, driverStats, driverList };
}
