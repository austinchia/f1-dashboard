// Simulated F1 2024 Bahrain Grand Prix Race Data

export const RACES = [
  { id: 'bhr24', label: 'Bahrain Grand Prix', circuit: 'Sakhir', laps: 57, date: 'March 2, 2024' },
  { id: 'sau24', label: 'Saudi Arabian Grand Prix', circuit: 'Jeddah', laps: 50, date: 'March 9, 2024' },
  { id: 'aus24', label: 'Australian Grand Prix', circuit: 'Melbourne', laps: 58, date: 'March 24, 2024' },
];

export const DRIVERS = [
  { id: 'VER', name: 'Max Verstappen',   team: 'Red Bull Racing', color: '#3671C6', shortTeam: 'Red Bull'     },
  { id: 'NOR', name: 'Lando Norris',     team: 'McLaren',          color: '#FF8000', shortTeam: 'McLaren'      },
  { id: 'LEC', name: 'Charles Leclerc',  team: 'Ferrari',          color: '#E8002D', shortTeam: 'Ferrari'      },
  { id: 'SAI', name: 'Carlos Sainz',     team: 'Ferrari',          color: '#B51119', shortTeam: 'Ferrari'      },
  { id: 'HAM', name: 'Lewis Hamilton',   team: 'Mercedes',         color: '#27F4D2', shortTeam: 'Mercedes'     },
  { id: 'RUS', name: 'George Russell',   team: 'Mercedes',         color: '#16C4AE', shortTeam: 'Mercedes'     },
  { id: 'ALO', name: 'Fernando Alonso',  team: 'Aston Martin',     color: '#358C75', shortTeam: 'Aston Martin' },
  { id: 'PIA', name: 'Oscar Piastri',    team: 'McLaren',          color: '#E8730A', shortTeam: 'McLaren'      },
];

// Tire compound colors
export const TIRE_COLORS = {
  S: '#FF1E1E', // Soft - red
  M: '#FFC906', // Medium - yellow
  H: '#FFFFFF', // Hard - white
};

// Pit stop data per race per driver: [lap, newTire]
const PIT_STOPS = {
  bhr24: {
    VER: [[14, 'M'], [36, 'H']],
    NOR: [[16, 'M'], [38, 'H']],
    LEC: [[13, 'M'], [35, 'H']],
    SAI: [[15, 'M'], [37, 'H']],
    HAM: [[17, 'M'], [40, 'H']],
    RUS: [[18, 'M'], [41, 'H']],
    ALO: [[20, 'H'], [43, 'M']],
    PIA: [[19, 'M'], [42, 'H']],
  },
  sau24: {
    VER: [[15, 'M'], [33, 'H']],
    NOR: [[16, 'M'], [34, 'H']],
    LEC: [[14, 'M'], [32, 'H']],
    SAI: [[15, 'M'], [33, 'H']],
    HAM: [[17, 'M'], [35, 'H']],
    RUS: [[18, 'M'], [36, 'H']],
    ALO: [[20, 'H']],
    PIA: [[19, 'M'], [37, 'H']],
  },
  aus24: {
    VER: [[14, 'M'], [38, 'H']],
    NOR: [[16, 'M'], [40, 'H']],
    LEC: [[13, 'M'], [36, 'H']],
    SAI: [[15, 'M'], [38, 'H']],
    HAM: [[17, 'M'], [41, 'H']],
    RUS: [[18, 'M'], [42, 'H']],
    ALO: [[20, 'H']],
    PIA: [[19, 'M'], [43, 'H']],
  },
};

function formatLapTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(3);
  const sPadded = s.padStart(6, '0');
  return `${m}:${sPadded}`;
}

function parseLapTime(str) {
  const [m, s] = str.split(':');
  return parseFloat(m) * 60 + parseFloat(s);
}

// Base lap times (seconds) per race per driver
const BASE_TIMES = {
  bhr24: { VER: 92.8, NOR: 93.1, LEC: 93.3, SAI: 93.5, HAM: 93.8, RUS: 94.0, ALO: 94.3, PIA: 94.5 },
  sau24: { VER: 89.5, NOR: 89.8, LEC: 90.0, SAI: 90.2, HAM: 90.5, RUS: 90.7, ALO: 91.0, PIA: 91.2 },
  aus24: { VER: 80.2, NOR: 80.5, LEC: 80.7, SAI: 80.9, HAM: 81.2, RUS: 81.4, ALO: 81.7, PIA: 81.9 },
};

// Degradation per lap per compound (seconds/lap)
const DEGRADATION = { S: 0.065, M: 0.030, H: 0.015 };

// Pit stop time loss (seconds)
const PIT_LOSS = 22.5;

function generateLapTimes(raceId, driverId, totalLaps) {
  const pits = PIT_STOPS[raceId][driverId];
  const baseTime = BASE_TIMES[raceId][driverId];
  const laps = [];

  let currentTire = 'S';
  let tireAge = 0;
  let pitIdx = 0;

  for (let lap = 1; lap <= totalLaps; lap++) {
    // Check if pit this lap
    const isPitLap = pits[pitIdx] && pits[pitIdx][0] === lap;

    if (isPitLap) {
      // Pit lap: slower lap
      const degradedTime = baseTime + DEGRADATION[currentTire] * tireAge + PIT_LOSS;
      const noise = (Math.random() - 0.5) * 0.3;
      laps.push({
        lap,
        time: degradedTime + noise,
        timeStr: formatLapTime(degradedTime + noise),
        tire: currentTire,
        tireAge,
        isPit: true,
      });
      currentTire = pits[pitIdx][1];
      tireAge = 0;
      pitIdx++;
    } else {
      const degradedTime = baseTime + DEGRADATION[currentTire] * tireAge;
      const noise = (Math.random() - 0.5) * 0.25;
      // Safety car laps occasionally add time (lap 20-22 for all)
      const scBonus = (lap >= 20 && lap <= 22) ? 6 : 0;
      laps.push({
        lap,
        time: degradedTime + noise + scBonus,
        timeStr: formatLapTime(degradedTime + noise + scBonus),
        tire: currentTire,
        tireAge,
        isPit: false,
      });
      tireAge++;
    }
  }

  return laps;
}

function computeGapToLeader(allDriverLaps, totalLaps) {
  // Use cumulative time to compute gaps
  const cumulative = {};
  DRIVERS.forEach(d => {
    cumulative[d.id] = 0;
  });

  const gaps = Array.from({ length: totalLaps }, (_, i) => {
    const lapNum = i + 1;
    DRIVERS.forEach(d => {
      const lapData = allDriverLaps[d.id][i];
      if (lapData) cumulative[d.id] += lapData.time;
    });
    const minTime = Math.min(...DRIVERS.map(d => cumulative[d.id]));
    const entry = { lap: lapNum };
    DRIVERS.forEach(d => {
      entry[d.id] = parseFloat((cumulative[d.id] - minTime).toFixed(3));
    });
    return entry;
  });
  return gaps;
}

export function generateRaceData(raceId) {
  const race = RACES.find(r => r.id === raceId);
  const { laps: totalLaps } = race;

  const allDriverLaps = {};
  DRIVERS.forEach(d => {
    allDriverLaps[d.id] = generateLapTimes(raceId, d.id, totalLaps);
  });

  // Build chart data: one entry per lap
  const lapChartData = Array.from({ length: totalLaps }, (_, i) => {
    const entry = { lap: i + 1 };
    DRIVERS.forEach(d => {
      const lapData = allDriverLaps[d.id][i];
      if (lapData && !lapData.isPit) {
        entry[d.id] = parseFloat(lapData.time.toFixed(3));
      }
    });
    return entry;
  });

  const gapData = computeGapToLeader(allDriverLaps, totalLaps);

  // Stats per driver
  const driverStats = {};
  DRIVERS.forEach(d => {
    const times = allDriverLaps[d.id].filter(l => !l.isPit).map(l => l.time);
    const fastest = Math.min(...times);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const pits = PIT_STOPS[raceId][d.id];
    driverStats[d.id] = {
      fastestLap: formatLapTime(fastest),
      fastestLapSec: fastest,
      avgPace: formatLapTime(avg),
      avgPaceSec: avg,
      pitCount: pits.length,
      stints: buildStints(raceId, d.id, totalLaps),
    };
  });

  return { race, lapChartData, gapData, driverStats, allDriverLaps };
}

function buildStints(raceId, driverId, totalLaps) {
  const pits = PIT_STOPS[raceId][driverId];
  const stints = [];
  let start = 1;
  let tire = 'S';
  pits.forEach(([pitLap, nextTire]) => {
    stints.push({ tire, start, end: pitLap - 1, laps: pitLap - start });
    start = pitLap + 1;
    tire = nextTire;
  });
  stints.push({ tire, start, end: totalLaps, laps: totalLaps - start + 1 });
  return stints;
}
