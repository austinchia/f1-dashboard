# Animated Race Position Visualizer — Design Spec

**Date:** 2026-03-26
**Status:** Approved

---

## Overview

Full rewrite of the F1 dashboard into a focused animated race position visualizer. The app replaces all existing charts and panels with a single bump chart that animates lap-by-lap position changes for all drivers, driven by real past F1 data fetched via the FastF1 Python library. Users can play, pause, and scrub through the race.

---

## What Gets Removed

All existing components are deleted and replaced:

- `LapTimeChart`, `GapToLeaderChart`, `TireStrategy`, `DriverStatsCards`, `RaceFinishChart`
- `RaceInfoBar`, `DriverSelector`, `LoadingState`, `LiveRaceSelector`
- `useOpenF1.js`, `openf1.js`, `transform.js` (live data pipeline — no longer needed)
- Live/mock mode toggle in `App.jsx`

The mock data file `src/data/raceData.js` is deleted entirely. Real data is fetched once by a Python script using FastF1 and saved as static JSON files consumed by the React app.

---

## Architecture

```
App
├── Header          (logo + race tabs + theme toggle)
└── RaceVisualizer  (race title + chart + controls)
    ├── BumpChart   (SVG bump chart)
    └── PlaybackControls (play/pause + lap scrubber)
```

### State

All state lives in `App`:

| State | Type | Description |
|---|---|---|
| `selectedRace` | string | key matching a race in `RACES` (e.g. `'bhr24'`) |
| `currentLap` | number | `1` to `race.laps`, drives both chart and controls |
| `isPlaying` | boolean | Whether playback is running |
| `theme` | string | `'dark'` \| `'light'` |

`currentLap` and `isPlaying` reset to `1` / `false` when `selectedRace` changes.

---

## Data Pipeline: FastF1

Real lap-by-lap position data is fetched once using a Python script and stored as static JSON files in `src/data/`. The React app imports these files directly — no runtime fetching, no backend.

### Python script: `scripts/fetch_race_data.py`

Uses the `fastf1` library. Fetches the 2024 Bahrain, Saudi Arabian, and Australian Grands Prix. For each race:

1. Load the session with `fastf1.get_session(2024, race_name, 'R')` and call `.load()`
2. From `session.laps`, extract per-driver position per lap using the `Position` column
3. Build a `RACES` metadata list (name, circuit, date, total laps) and a `DRIVERS` list (abbreviation, full name, team, team color)
4. Build a `positionsByLap` array: `[{ lap: 1, positions: { VER: 1, NOR: 3, ... } }, ...]`
5. Write one JSON file per race to `src/data/` (e.g. `bhr2024.json`, `sau2024.json`, `aus2024.json`)
6. Write `src/data/races.json` — the race index used to populate the Header tabs

FastF1 caches session data locally in a `fastf1_cache/` directory (added to `.gitignore`).

### JSON shape

**`src/data/races.json`**
```json
[
  { "id": "bhr2024", "label": "Bahrain Grand Prix", "circuit": "Sakhir", "date": "March 2, 2024", "laps": 57 },
  ...
]
```

**`src/data/bhr2024.json`**
```json
{
  "race": { "id": "bhr2024", "label": "Bahrain Grand Prix", "circuit": "Sakhir", "date": "March 2, 2024", "laps": 57 },
  "drivers": [
    { "id": "VER", "name": "Max Verstappen", "team": "Red Bull Racing", "color": "#3671C6" },
    ...
  ],
  "positionsByLap": [
    { "lap": 1, "positions": { "VER": 1, "LEC": 2, "SAI": 3, ... } },
    { "lap": 2, "positions": { "VER": 1, "LEC": 2, "SAI": 3, ... } },
    ...
  ]
}
```

Team colors come from a hardcoded map in the script (FastF1 does not provide colors). The driver list is derived from whoever actually participated in each race.

### React data loading

`src/data/index.js` — a simple lookup that imports all three JSON files and exports them keyed by race id. No async fetching needed since Vite bundles JSON imports.

```js
import bhr2024 from './bhr2024.json';
import sau2024 from './sau2024.json';
import aus2024 from './aus2024.json';
export const RACE_DATA = { bhr2024, sau2024, aus2024 };
```

---

## Components

### `Header`

Simplified from existing. Contains:
- App logo/title (`F1 POSITIONS`, Orbitron font, `--accent-red`)
- Race tabs: one per entry in `RACES` — clicking sets `selectedRace`
- Theme toggle: pill button, 🌙 / ☀️ icon, toggles `theme` state

### `BumpChart`

Pure SVG component. Props: `positionData`, `drivers`, `currentLap`, `totalLaps`, `theme`. (`drivers` replaces the old hardcoded `DRIVERS` constant — it comes from the JSON file for the selected race.)

**Layout:**
- Left margin: P1–P{N} Y-axis labels (N = number of drivers in the race, typically 20 for real data)
- Right margin: 3-letter driver abbreviation labels (animated vertically)
- Bottom: lap number tick marks (every 10 laps + final lap)
- Horizontal grid lines at each position row (8 lines, very faint)

**SVG coordinate mapping:**
- X: `lap` → horizontal pixel position, linearly scaled from left edge to right edge
- Y: `position` → vertical pixel position, 8 equally spaced rows (P1 = top, P8 = bottom)

**Per driver:**
- `<polyline>` of all `(lap, position)` points sliced to `currentLap` — only draws the portion of the race seen so far
- A filled circle dot at the current lap's position
- A dashed vertical line at `currentLap` across the full chart height

**Driver labels (right edge):**
- Rendered as Framer Motion `<motion.text>` elements
- `y` position is animated (`layout` prop or `animate={{ y }}`) so labels slide smoothly up/down when drivers overtake
- Color matches driver team color from `DRIVERS`

**No interactivity on the chart itself** — all control is in PlaybackControls.

### `PlaybackControls`

Props: `currentLap`, `totalLaps`, `isPlaying`, `onPlay`, `onPause`, `onScrub`.

Contains:
- **Play/Pause button**: red filled square button, ▶ / ⏸ icon
- **Lap counter**: `LAP {currentLap}` in Orbitron font
- **Scrubber**: `<input type="range" min={1} max={totalLaps} value={currentLap}` — fires `onScrub(lap)` on change. Styled with CSS to match the red/dark theme.
- **Total laps**: `/ {totalLaps}` in muted text
- **Tick marks**: decorative labels at laps 1, 10, 20, 30, 40, 50, final

**Playback timing:** `useInterval` hook (or `useEffect` + `setInterval`) — advances `currentLap` by 1 every 600ms when `isPlaying`. Stops automatically at `totalLaps`. Dragging the scrubber pauses playback.

### `RaceVisualizer`

Thin wrapper. Props: `race`, `positionData`, `currentLap`, `isPlaying`, `theme`, and all the callbacks. Renders race title + meta, then `BumpChart`, then `PlaybackControls`.

---

## Theming

Two themes implemented via CSS custom properties on `document.documentElement` (or a `data-theme` attribute on `<body>`):

| Token | Dark | Light |
|---|---|---|
| `--bg-primary` | `#050508` | `#f5f5f8` |
| `--bg-card` | `rgba(255,255,255,0.02)` | `#ffffff` |
| `--border` | `rgba(255,255,255,0.06)` | `rgba(0,0,0,0.07)` |
| `--text-primary` | `#eeeeff` | `#111111` |
| `--text-muted` | `rgba(238,238,255,0.35)` | `rgba(0,0,0,0.4)` |
| `--grid-line` | `rgba(255,255,255,0.04)` | `rgba(0,0,0,0.05)` |
| `--accent-red` | `#e8002d` | `#e8002d` |

The `theme` state is stored in `App` and written to the DOM via `useEffect`. Driver line colors are unchanged in both themes.

---

## Files Changed / Created

| File | Action |
|---|---|
| `scripts/fetch_race_data.py` | New — FastF1 data fetcher |
| `scripts/requirements.txt` | New — `fastf1`, no other deps |
| `src/data/races.json` | New — generated by script |
| `src/data/bhr2024.json` | New — generated by script |
| `src/data/sau2024.json` | New — generated by script |
| `src/data/aus2024.json` | New — generated by script |
| `src/data/index.js` | New — exports `RACE_DATA` lookup |
| `src/App.jsx` | Rewrite — remove live mode, add theme + playback state |
| `src/index.css` | Add light theme tokens, remove unused dark-only rules |
| `src/components/Header.jsx` | Rewrite — race tabs + theme toggle only |
| `src/components/BumpChart.jsx` | New |
| `src/components/PlaybackControls.jsx` | New |
| `src/components/RaceVisualizer.jsx` | New |
| `src/data/raceData.js` | Delete |
| `src/components/LapTimeChart.jsx` | Delete |
| `src/components/GapToLeaderChart.jsx` | Delete |
| `src/components/TireStrategy.jsx` | Delete |
| `src/components/DriverStatsCards.jsx` | Delete |
| `src/components/RaceFinishChart.jsx` | Delete |
| `src/components/RaceInfoBar.jsx` | Delete |
| `src/components/DriverSelector.jsx` | Delete |
| `src/components/LoadingState.jsx` | Delete |
| `src/components/LiveRaceSelector.jsx` | Delete |
| `src/hooks/useOpenF1.js` | Delete |
| `src/api/openf1.js` | Delete |
| `src/api/transform.js` | Delete |

---

## Setup Notes

Running the data fetcher (one-time, before starting the React app):
```bash
pip install fastf1
python scripts/fetch_race_data.py
```

Add to `.gitignore`:
```
fastf1_cache/
```

The generated JSON files (`src/data/*.json`) **are** committed — they're static assets bundled by Vite.

---

## Out of Scope

- Speed controls (1x / 2x / 4x) — not requested
- Hover tooltips on the chart
- Driver filtering / selector
- Any live data integration
- Mobile layout optimisation
