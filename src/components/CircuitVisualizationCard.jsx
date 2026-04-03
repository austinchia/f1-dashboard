import { useEffect, useMemo, useState } from 'react';
import { getCircuitFeature } from '../data/circuits';
import { buildRuntimeCircuitMap } from '../utils/circuitRuntimeMap';
import { buildCircuitMarkers } from '../utils/circuitOverlay';

function formatGap(gap) {
  if (!Number.isFinite(gap) || gap <= 0.05) {
    return 'Leader';
  }
  return `+${gap.toFixed(gap >= 10 ? 1 : 2)}s`;
}

function hexToRgb(hex) {
  const normalized = String(hex || '').replace('#', '').trim();
  if (normalized.length !== 6) return null;

  const value = Number.parseInt(normalized, 16);
  if (Number.isNaN(value)) return null;

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function getLabelTextColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#f5f6ff';

  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.62 ? '#111111' : '#f5f6ff';
}

function MarkerLabel({ marker, isPinned }) {
  const labelWidth = Math.max(64, marker.id.length * 14 + 26);
  const textColor = getLabelTextColor(marker.color);
  const backgroundColor = marker.color;
  const borderColor = isPinned ? textColor : `${marker.color}CC`;

  return (
    <g transform={`translate(${marker.x}, ${marker.y - 30})`} className="circuit-marker__label">
      <rect
        x={-labelWidth / 2}
        y={-28}
        width={labelWidth}
        height={24}
        rx={12}
        className={isPinned ? 'circuit-marker__labelBg is-pinned' : 'circuit-marker__labelBg'}
        style={{ fill: backgroundColor, stroke: borderColor }}
      />
      <text textAnchor="middle" y={-12} className="circuit-marker__labelText" style={{ fill: textColor }}>
        {marker.id}
      </text>
    </g>
  );
}

export default function CircuitVisualizationCard({
  race,
  drivers = [],
  grid = [],
  telemetry = null,
  positionsByLap = [],
  gapsByLap = [],
  dnfLaps = {},
  currentLap = 1,
  currentPlaybackMs = null,
  displayMode = 'default',
}) {
  const [showLabels, setShowLabels] = useState(false);
  const [pinnedDriverId, setPinnedDriverId] = useState(null);
  const [hoveredDriverId, setHoveredDriverId] = useState(null);

  const circuitAsset = useMemo(() => {
    const feature = getCircuitFeature(race.circuit);
    return buildRuntimeCircuitMap(feature);
  }, [race.circuit]);

  const markers = useMemo(() => (
    buildCircuitMarkers({
      circuitAsset,
      drivers,
      grid,
      telemetry,
      positionsByLap,
      gapsByLap,
      dnfLaps,
      currentLap,
      currentPlaybackMs,
      totalLaps: race.laps,
    })
  ), [circuitAsset, currentLap, currentPlaybackMs, dnfLaps, drivers, gapsByLap, grid, positionsByLap, race.laps, telemetry]);

  const activeMarkerId = pinnedDriverId ?? hoveredDriverId;
  const activeMarker = markers.find(marker => marker.id === activeMarkerId) ?? null;
  const isFocusMode = displayMode === 'focus';
  const clearPinnedSelection = () => {
    setPinnedDriverId(null);
  };

  useEffect(() => {
    if (!pinnedDriverId) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setPinnedDriverId(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pinnedDriverId]);

  if (!circuitAsset) {
    return (
      <section className="circuit-card">
        <div className="circuit-card__empty">Official circuit layout unavailable for {race.circuit}.</div>
      </section>
    );
  }

  return (
    <section className={`circuit-card${isFocusMode ? ' circuit-card--focus' : ''}`} onClick={clearPinnedSelection}>
      <div className="circuit-card__header">
        <div>
          <div className="circuit-card__eyebrow">Circuit Layout</div>
          <div className="circuit-card__titleRow">
            <h2 className="circuit-card__title">
              {circuitAsset.displayName ?? race.circuit}
            </h2>
          </div>
        </div>
        <div className="circuit-card__controls">
          <button
            type="button"
            className={`circuit-card__control${showLabels ? ' is-active' : ''}`}
            onClick={(event) => {
              event.stopPropagation();
              setShowLabels(current => !current);
            }}
          >
            Labels
          </button>
        </div>
      </div>

      <div className="circuit-layout">
        <div className="circuit-stage circuit-stage--static">
          <img
            src={circuitAsset.src}
            alt={`${race.circuit} circuit map`}
            className="circuit-stage__map-image"
          />
          <svg
            className="circuit-stage__overlay"
            viewBox={`0 0 ${circuitAsset.viewBoxWidth} ${circuitAsset.viewBoxHeight}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {markers.map(marker => {
              const isPinned = pinnedDriverId === marker.id;
              const isHovered = hoveredDriverId === marker.id;
              const isActive = isPinned || isHovered;

              return (
                <g
                  key={marker.id}
                  className={`circuit-marker${marker.isRetired ? ' is-retired' : ''}`}
                  transform={`translate(${marker.x}, ${marker.y})`}
                  onMouseEnter={() => setHoveredDriverId(marker.id)}
                  onMouseLeave={() => setHoveredDriverId(current => (current === marker.id ? null : current))}
                  onClick={(event) => {
                    event.stopPropagation();
                    setPinnedDriverId(current => (current === marker.id ? null : marker.id));
                  }}
                >
                  <circle className="circuit-marker__halo" r={isActive ? 18 : 14} fill={marker.color} />
                  <circle className="circuit-marker__core" r={isActive ? 9.4 : 7.6} fill={marker.color} />
                  <circle className="circuit-marker__ring" r={isActive ? 11.4 : 9.2} />
                </g>
              );
            })}

            {markers.map(marker => {
              const shouldShowLabel = showLabels || pinnedDriverId === marker.id || hoveredDriverId === marker.id;
              if (!shouldShowLabel) return null;
              return <MarkerLabel key={`${marker.id}-label`} marker={marker} isPinned={pinnedDriverId === marker.id} />;
            })}
          </svg>
        </div>

        <aside className="circuit-selection">
          <div className="circuit-selection__eyebrow">Current Selection</div>
          {activeMarker ? (
            <>
              <div className="circuit-selection__top">
                <span className="circuit-selection__swatch" style={{ background: activeMarker.color }} />
                <div>
                  <div className="circuit-selection__driver">{activeMarker.id}</div>
                  <div className="circuit-selection__name">{activeMarker.name}</div>
                </div>
              </div>
              <div className="circuit-selection__grid">
                <div className="circuit-selection__item">
                  <span className="circuit-selection__label">Position</span>
                  <span className="circuit-selection__value">P{activeMarker.position}</span>
                </div>
                <div className="circuit-selection__item">
                  <span className="circuit-selection__label">Gap</span>
                  <span className="circuit-selection__value">{formatGap(activeMarker.gap)}</span>
                </div>
                <div className="circuit-selection__item">
                  <span className="circuit-selection__label">Team</span>
                  <span className="circuit-selection__value">{activeMarker.team}</span>
                </div>
                <div className="circuit-selection__item">
                  <span className="circuit-selection__label">State</span>
                  <span className="circuit-selection__value">
                    {pinnedDriverId === activeMarker.id ? 'Pinned' : 'Hover'}
                    {activeMarker.isRetired ? ' - Retired' : ''}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="circuit-selection__empty">
              Hover over a driver or click a marker to lock in the current selection here.
            </div>
          )}
        </aside>
      </div>

    </section>
  );
}


