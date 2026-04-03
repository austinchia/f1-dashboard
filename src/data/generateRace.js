function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function seededNoise(lap, driverIdx, raceCode) {
  const x = Math.sin(lap * 7.3 + driverIdx * 13.7 + raceCode * 3.1) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1; // -1 to 1
}

export function generateRaceData(config) {
  const { race, drivers, grid, finish } = config;
  const { laps } = race;
  const raceCode = race.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

  const positionsByLap = [];

  for (let lap = 1; lap <= laps; lap++) {
    // Last lap: exact finish positions
    if (lap === laps) {
      const positions = {};
      finish.forEach((driverId, idx) => { positions[driverId] = idx + 1; });
      drivers.forEach(d => { if (!(d.id in positions)) positions[d.id] = drivers.length; });
      positionsByLap.push({ lap, positions });
      continue;
    }

    const t = (lap - 1) / (laps - 1);
    const eased = smoothstep(t);

    const scores = {};
    drivers.forEach((driver, i) => {
      const gridPos = (grid.indexOf(driver.id) + 1) || drivers.length;
      const finishPos = (finish.indexOf(driver.id) + 1) || drivers.length;
      const base = gridPos + (finishPos - gridPos) * eased;
      // Gaussian pit stop dips at ~33% and ~66% of race
      const pit1 = Math.exp(-Math.pow((t - 0.33) * laps / 5, 2)) * 5;
      const pit2 = Math.exp(-Math.pow((t - 0.66) * laps / 5, 2)) * 4;
      const noise = seededNoise(lap, i, raceCode) * 1.5;
      scores[driver.id] = base + pit1 + pit2 + noise;
    });

    const sorted = Object.entries(scores).sort((a, b) => a[1] - b[1]);
    const positions = {};
    sorted.forEach(([id], idx) => { positions[id] = idx + 1; });
    positionsByLap.push({ lap, positions });
  }

  return { race, drivers, positionsByLap };
}
