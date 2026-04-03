const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 800;
const IMAGE_PADDING = 60;
const circuitCache = new Map();

function buildCacheKey(feature) {
  return feature?.properties?.id ?? feature?.properties?.Name ?? JSON.stringify(feature?.geometry?.coordinates ?? []);
}

function clampUnit(value) {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function normalizeProgress(progress) {
  const normalized = progress % 1;
  return normalized < 0 ? normalized + 1 : normalized;
}

function processCircuitFeature(feature) {
  const coords = feature?.geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) {
    return null;
  }

  const xs = coords.map(([x]) => x);
  const ys = coords.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = Math.max(maxX - minX, Number.EPSILON);
  const spanY = Math.max(maxY - minY, Number.EPSILON);

  const scale = Math.min(
    (IMAGE_WIDTH - IMAGE_PADDING * 2) / spanX,
    (IMAGE_HEIGHT - IMAGE_PADDING * 2) / spanY
  );
  const scaledWidth = spanX * scale;
  const scaledHeight = spanY * scale;
  const offsetX = (IMAGE_WIDTH - scaledWidth) / 2;
  const offsetY = (IMAGE_HEIGHT - scaledHeight) / 2;

  const points = coords.map(([x, y]) => ({
    x: offsetX + (x - minX) * scale,
    y: offsetY + (y - minY) * scale,
  }));

  const segmentLengths = [];
  const cumulativeLengths = [0];
  let totalLength = 0;
  for (let index = 1; index < points.length; index += 1) {
    const dx = points[index].x - points[index - 1].x;
    const dy = points[index].y - points[index - 1].y;
    const segmentLength = Math.hypot(dx, dy);
    segmentLengths.push(segmentLength);
    totalLength += segmentLength;
    cumulativeLengths.push(totalLength);
  }

  const polylinePoints = points.map(point => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');
  const startPoint = points[0];
  const nextPoint = points[1] ?? startPoint;
  const tangentX = nextPoint.x - startPoint.x;
  const tangentY = nextPoint.y - startPoint.y;
  const tangentLength = Math.max(Math.hypot(tangentX, tangentY), Number.EPSILON);
  const normalX = -tangentY / tangentLength;
  const normalY = tangentX / tangentLength;
  const finishHalfLength = 16;
  const finishBandHalfWidth = 7;
  const finishX1 = startPoint.x + normalX * finishHalfLength;
  const finishY1 = startPoint.y + normalY * finishHalfLength;
  const finishX2 = startPoint.x - normalX * finishHalfLength;
  const finishY2 = startPoint.y - normalY * finishHalfLength;
  const stripeOffsetX = normalX * 3.5;
  const stripeOffsetY = normalY * 3.5;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${IMAGE_WIDTH} ${IMAGE_HEIGHT}" width="${IMAGE_WIDTH}" height="${IMAGE_HEIGHT}">
  <polyline points="${polylinePoints}" fill="none" stroke="#581923" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>
  <polyline points="${polylinePoints}" fill="none" stroke="#657086" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
  <polyline points="${polylinePoints}" fill="none" stroke="#f5f7ff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="${finishX1.toFixed(2)}" y1="${finishY1.toFixed(2)}" x2="${finishX2.toFixed(2)}" y2="${finishY2.toFixed(2)}" stroke="#111111" stroke-width="${(finishBandHalfWidth * 2 + 4).toFixed(2)}" stroke-linecap="round"/>
  <line x1="${(finishX1 - stripeOffsetX).toFixed(2)}" y1="${(finishY1 - stripeOffsetY).toFixed(2)}" x2="${(finishX2 - stripeOffsetX).toFixed(2)}" y2="${(finishY2 - stripeOffsetY).toFixed(2)}" stroke="#f5f7ff" stroke-width="${finishBandHalfWidth.toFixed(2)}" stroke-linecap="round"/>
  <line x1="${(finishX1 + stripeOffsetX).toFixed(2)}" y1="${(finishY1 + stripeOffsetY).toFixed(2)}" x2="${(finishX2 + stripeOffsetX).toFixed(2)}" y2="${(finishY2 + stripeOffsetY).toFixed(2)}" stroke="#f5f7ff" stroke-width="${finishBandHalfWidth.toFixed(2)}" stroke-linecap="round"/>
</svg>`;

  return {
    featureId: feature.properties?.id ?? '',
    displayName: feature.properties?.Name ?? '',
    location: feature.properties?.Location ?? '',
    length: feature.properties?.length ?? null,
    opened: feature.properties?.opened ?? null,
    pointCount: coords.length,
    viewBoxWidth: IMAGE_WIDTH,
    viewBoxHeight: IMAGE_HEIGHT,
    points,
    segmentLengths,
    cumulativeLengths,
    totalLength: Math.max(totalLength, Number.EPSILON),
    src: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
  };
}

export function buildRuntimeCircuitMap(feature) {
  if (!feature) {
    return null;
  }

  const cacheKey = buildCacheKey(feature);
  if (!circuitCache.has(cacheKey)) {
    circuitCache.set(cacheKey, processCircuitFeature(feature));
  }
  return circuitCache.get(cacheKey);
}

export function getCircuitPointAtProgress(circuitAsset, progress) {
  if (!circuitAsset?.points?.length) {
    return null;
  }

  if (circuitAsset.points.length === 1) {
    return { ...circuitAsset.points[0], angle: 0, nx: 0, ny: -1, progress: 0 };
  }

  const normalizedProgress = normalizeProgress(progress);
  const targetLength = normalizedProgress * circuitAsset.totalLength;
  let segmentIndex = circuitAsset.segmentLengths.length - 1;

  for (let index = 0; index < circuitAsset.segmentLengths.length; index += 1) {
    if (circuitAsset.cumulativeLengths[index + 1] >= targetLength) {
      segmentIndex = index;
      break;
    }
  }

  const start = circuitAsset.points[segmentIndex];
  const end = circuitAsset.points[segmentIndex + 1] ?? start;
  const segmentLength = Math.max(circuitAsset.segmentLengths[segmentIndex] ?? 0, Number.EPSILON);
  const traveledOnSegment = targetLength - circuitAsset.cumulativeLengths[segmentIndex];
  const segmentT = clampUnit(traveledOnSegment / segmentLength);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const angle = Math.atan2(dy, dx);

  return {
    x: start.x + dx * segmentT,
    y: start.y + dy * segmentT,
    angle,
    nx: -Math.sin(angle),
    ny: Math.cos(angle),
    progress: normalizedProgress,
  };
}
