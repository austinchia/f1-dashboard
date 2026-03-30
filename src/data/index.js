import races from './races.json';
import { RACE_CONFIGS, RACE_CONFIGS_2025, RACE_CONFIGS_2026 } from './raceConfigs.js';

export const RACES = races;

// Import all real lap-by-lap position files (one per race)
const lapModules = import.meta.glob('./laps/*.json', { eager: true });

function getLaps(raceId) {
  const key = `./laps/${raceId}.json`;
  const mod = lapModules[key];
  return {
    positionsByLap: mod?.positionsByLap ?? [],
    dnfLaps: mod?.dnfLaps ?? {},
  };
}

function buildRaceData(config) {
  const { positionsByLap, dnfLaps } = getLaps(config.race.id);
  return {
    race: config.race,
    drivers: config.drivers,
    positionsByLap,
    dnfLaps,
  };
}

export const RACE_DATA = {};

for (const config of RACE_CONFIGS) {
  RACE_DATA[config.race.id] = buildRaceData(config);
}

for (const config of RACE_CONFIGS_2025) {
  RACE_DATA[config.race.id] = buildRaceData(config);
}

for (const config of RACE_CONFIGS_2026) {
  RACE_DATA[config.race.id] = buildRaceData(config);
}

