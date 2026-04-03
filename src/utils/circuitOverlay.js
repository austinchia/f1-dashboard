import { getCircuitPointAtProgress } from './circuitRuntimeMap';

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function toLapIndex(currentLap, totalLaps) {
  return clamp(Math.floor(currentLap), 0, totalLaps);
}

function getLapEntry(entries, lap) {
  return entries[lap - 1] ?? entries.find(entry => entry.lap === lap) ?? null;
}

function getInterpolatedNumericValue(startValue, endValue, fraction) {
  if (startValue == null && endValue == null) return null;
  if (startValue == null) return endValue;
  if (endValue == null) return startValue;
  return startValue + (endValue - startValue) * fraction;
}

function getEstimatedLapTimeSeconds(circuitLength) {
  if (!Number.isFinite(circuitLength)) {
    return 88;
  }
  return clamp(circuitLength / 62, 74, 120);
}

function getDriverFallbackGap(position) {
  return Math.max(0, position - 1) * 0.42;
}

function wrapProgress(progress) {
  return ((progress % 1) + 1) % 1;
}

function interpolateCircularProgress(startValue, endValue, fraction) {
  if (startValue == null && endValue == null) return null;
  if (startValue == null) return wrapProgress(endValue);
  if (endValue == null) return wrapProgress(startValue);

  let delta = endValue - startValue;
  if (delta > 0.5) delta -= 1;
  if (delta < -0.5) delta += 1;

  return wrapProgress(startValue + delta * fraction);
}

function getTelemetryFrameIndex(samples, targetMs) {
  let low = 0;
  let high = samples.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const value = samples[mid]?.t ?? 0;
    if (value === targetMs) return mid;
    if (value < targetMs) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return Math.max(0, low - 1);
}

function getTelemetryMarkerState(telemetry, driverId, currentLap, totalLaps, currentPlaybackMs = null) {
  const samples = telemetry?.samples;
  if (!samples?.length) return null;

  const sessionDurationMs = Math.max(telemetry.sessionDurationMs ?? 0, samples[samples.length - 1]?.t ?? 0, 1);
  const normalizedRaceProgress = clamp(currentLap / Math.max(totalLaps, 1), 0, 1);
  const targetMs = Number.isFinite(currentPlaybackMs)
    ? clamp(currentPlaybackMs, 0, sessionDurationMs)
    : normalizedRaceProgress * sessionDurationMs;
  const currentIndex = getTelemetryFrameIndex(samples, targetMs);
  const currentSample = samples[currentIndex] ?? null;
  const nextSample = samples[Math.min(currentIndex + 1, samples.length - 1)] ?? currentSample;

  if (!currentSample?.drivers?.[driverId] && !nextSample?.drivers?.[driverId]) {
    return null;
  }

  const currentTime = currentSample?.t ?? targetMs;
  const nextTime = nextSample?.t ?? currentTime;
  const span = Math.max(nextTime - currentTime, 1);
  const sampleFraction = clamp((targetMs - currentTime) / span, 0, 1);

  const currentDriver = currentSample?.drivers?.[driverId] ?? null;
  const nextDriver = nextSample?.drivers?.[driverId] ?? currentDriver;
  const progress = interpolateCircularProgress(
    currentDriver?.progress ?? null,
    nextDriver?.progress ?? null,
    sampleFraction
  );

  if (progress == null) return null;

  return {
    progress,
    status: nextDriver?.status ?? currentDriver?.status ?? null,
    t: targetMs,
  };
}

function getInterpolatedRaceState(driverId, lapIndex, fraction, positionsByLap, gapsByLap) {
  const currentEntry = getLapEntry(positionsByLap, lapIndex);
  const nextEntry = getLapEntry(positionsByLap, Math.min(lapIndex + 1, positionsByLap.length));
  const currentPosition = currentEntry?.positions?.[driverId];
  const nextPosition = nextEntry?.positions?.[driverId];
  const position = getInterpolatedNumericValue(currentPosition, nextPosition, fraction);

  const currentGap = getLapEntry(gapsByLap, lapIndex)?.gaps?.[driverId];
  const nextGap = getLapEntry(gapsByLap, Math.min(lapIndex + 1, gapsByLap.length))?.gaps?.[driverId];
  const gap = getInterpolatedNumericValue(currentGap, nextGap, fraction);

  return {
    position,
    gap,
  };
}

export function buildCircuitMarkers({
  circuitAsset,
  drivers,
  grid = [],
  telemetry = null,
  positionsByLap,
  gapsByLap,
  dnfLaps = {},
  currentLap,
  currentPlaybackMs = null,
  totalLaps,
}) {
  if (!circuitAsset || !drivers.length || !positionsByLap.length) {
    return [];
  }

  const lapIndex = toLapIndex(currentLap, totalLaps);
  const fraction = clamp(currentLap - lapIndex, 0, 0.999);
  const estimatedLapTime = getEstimatedLapTimeSeconds(circuitAsset.length);
  const gridPositions = {};
  grid.forEach((driverId, index) => {
    gridPositions[driverId] = index + 1;
  });

  if (lapIndex < 1 && grid.length > 0) {
    const gridSpacingPx = 18;
    return drivers
      .map(driver => {
        const gridPosition = gridPositions[driver.id];
        if (!gridPosition) return null;
        const progress = -((gridPosition - 1) * gridSpacingPx) / circuitAsset.totalLength;
        const point = getCircuitPointAtProgress(circuitAsset, progress);
        if (!point) return null;
        return {
          id: driver.id,
          name: driver.name,
          team: driver.team,
          color: driver.color,
          position: gridPosition,
          rawPosition: gridPosition,
          gap: null,
          isRetired: false,
          lap: 0,
          progress: ((progress % 1) + 1) % 1,
          x: point.x,
          y: point.y,
          angle: point.angle,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.position - b.position);
  }

  const markers = drivers
    .map(driver => {
      const dnfLap = dnfLaps[driver.id];
      const isRetired = dnfLap != null && currentLap > dnfLap;
      const sampleLap = isRetired ? clamp(dnfLap, 1, totalLaps) : lapIndex;
      const sampleFraction = isRetired ? 0.999 : fraction;
      const state = getInterpolatedRaceState(driver.id, sampleLap, sampleFraction, positionsByLap, gapsByLap);

      if (!Number.isFinite(state.position)) {
        return null;
      }

      const effectiveGap = state.gap ?? getDriverFallbackGap(state.position);
      const telemetryState = getTelemetryMarkerState(telemetry, driver.id, currentLap, totalLaps, currentPlaybackMs);
      const overallLapProgress = (sampleLap - 1 + sampleFraction) - (effectiveGap / estimatedLapTime);
      const progress = telemetryState?.progress ?? wrapProgress(overallLapProgress);
      const point = getCircuitPointAtProgress(circuitAsset, progress);

      if (!point) {
        return null;
      }

      return {
        id: driver.id,
        name: driver.name,
        team: driver.team,
        color: driver.color,
        position: Math.max(1, Math.round(state.position)),
        rawPosition: state.position,
        gap: effectiveGap,
        isRetired,
        lap: sampleLap,
        progress,
        source: telemetryState ? 'telemetry' : 'estimated',
        x: point.x,
        y: point.y,
        angle: point.angle,
      };
    })
    .filter(Boolean);

  return markers.sort((a, b) => a.position - b.position);
}
