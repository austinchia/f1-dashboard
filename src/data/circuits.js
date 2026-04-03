import f1CircuitsRaw from './f1-circuits.geojson?raw';

const f1Circuits = JSON.parse(f1CircuitsRaw);

function normalizeValue(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const LOCATION_ALIASES = new Map([
  [normalizeValue('Marina Bay'), 'Singapore'],
  [normalizeValue('Spa'), 'Spa Francorchamps'],
  [normalizeValue('São Paulo'), 'Sao Paulo'],
  [normalizeValue('Lusail'), 'Lusail'],
]);

function resolveRequestedName(circuitName) {
  return LOCATION_ALIASES.get(normalizeValue(circuitName)) ?? circuitName;
}

export function getCircuitFeature(circuitName) {
  const requestedName = resolveRequestedName(circuitName);
  const normalizedRequested = normalizeValue(requestedName);

  return f1Circuits.features.find(item => {
    const location = normalizeValue(item?.properties?.Location);
    const name = normalizeValue(item?.properties?.Name);
    return location === normalizedRequested || name === normalizedRequested;
  }) ?? null;
}

