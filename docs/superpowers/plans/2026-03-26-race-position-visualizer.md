# Race Position Visualizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the F1 dashboard into an animated bump chart that plays through real lap-by-lap race positions using FastF1 data.

**Architecture:** A Python script fetches real F1 data via FastF1 and writes static JSON files into `src/data/`. The React app imports these JSON files at build time — no backend, no runtime fetching. Three new components (`BumpChart`, `PlaybackControls`, `RaceVisualizer`) replace the entire old panel system. All state (selected race, current lap, playing, theme) lives in `App`.

**Tech Stack:** Python + FastF1, React 19, Framer Motion, SVG (no Recharts), Vite, CSS custom properties for theming.

---

## File Map

| File | Role |
|---|---|
| `scripts/requirements.txt` | Python deps for data fetcher |
| `scripts/fetch_race_data.py` | Fetches FastF1 data, writes JSON files |
| `src/data/races.json` | Race index (generated) |
| `src/data/bhr2024.json` | Bahrain race data (generated) |
| `src/data/sau2024.json` | Saudi Arabia race data (generated) |
| `src/data/aus2024.json` | Australia race data (generated) |
| `src/data/index.js` | Exports `RACE_DATA` lookup keyed by race id |
| `src/index.css` | Dark + light theme CSS custom properties |
| `src/components/Header.jsx` | Logo, race tabs, theme toggle |
| `src/components/PlaybackControls.jsx` | Play/pause button + lap scrubber |
| `src/components/BumpChart.jsx` | SVG bump chart, animated driver labels |
| `src/components/RaceVisualizer.jsx` | Race title + BumpChart + PlaybackControls |
| `src/App.jsx` | All state, wires everything together |

---

## Task 1: Python data fetcher

**Files:**
- Create: `scripts/requirements.txt`
- Create: `scripts/fetch_race_data.py`
- Modify: `.gitignore`

- [ ] **Step 1: Create `scripts/requirements.txt`**

```
fastf1
```

- [ ] **Step 2: Create `scripts/fetch_race_data.py`**

```python
"""
Fetches 2024 F1 race data using FastF1 and writes static JSON files
to src/data/ for consumption by the React app.

Run once before starting the dev server:
    pip install fastf1
    python scripts/fetch_race_data.py
"""

import json
import os
import fastf1

# Ensure output directory exists
os.makedirs(os.path.join("src", "data"), exist_ok=True)

# Enable FastF1 cache (avoids re-downloading on repeat runs)
fastf1.Cache.enable_cache("fastf1_cache")

# Team colors — FastF1 doesn't provide these, so we hardcode them
TEAM_COLORS = {
    "Red Bull Racing": "#3671C6",
    "McLaren": "#FF8000",
    "Ferrari": "#E8002D",
    "Mercedes": "#27F4D2",
    "Aston Martin": "#358C75",
    "Alpine": "#0093cc",
    "Williams": "#64C4FF",
    "RB": "#6692FF",
    "Kick Sauber": "#52E252",
    "Haas F1 Team": "#B6BABD",
}

RACES_CONFIG = [
    {"year": 2024, "name": "Bahrain",      "id": "bhr2024"},
    {"year": 2024, "name": "Saudi Arabia", "id": "sau2024"},
    {"year": 2024, "name": "Australia",    "id": "aus2024"},
]

races_index = []

for config in RACES_CONFIG:
    print(f"\nFetching {config['name']} {config['year']}...")
    session = fastf1.get_session(config["year"], config["name"], "R")
    session.load()

    # --- Race metadata ---
    event = session.event
    total_laps = int(session.laps["LapNumber"].max())

    # Format date cross-platform (avoid %-d which fails on Windows)
    event_date = event["EventDate"]
    date_str = event_date.strftime("%B ") + str(event_date.day) + event_date.strftime(", %Y")

    race_meta = {
        "id": config["id"],
        "label": event["EventName"],
        "circuit": event["Location"],
        "date": date_str,
        "laps": total_laps,
    }
    races_index.append(race_meta)

    # --- Driver list (only drivers who have lap data) ---
    drivers = []
    seen_abbrs = set()
    for drv_num in session.drivers:
        try:
            info = session.get_driver(drv_num)
            abbr = info["Abbreviation"]
            if abbr in seen_abbrs:
                continue
            seen_abbrs.add(abbr)
            team = info["TeamName"]
            drivers.append({
                "id": abbr,
                "name": info["FullName"],
                "team": team,
                "color": TEAM_COLORS.get(team, "#888888"),
            })
        except Exception:
            continue

    # Build abbreviation lookup: driver_number -> abbreviation
    num_to_abbr = {}
    for drv_num in session.drivers:
        try:
            info = session.get_driver(drv_num)
            num_to_abbr[str(drv_num)] = info["Abbreviation"]
        except Exception:
            continue

    # --- Positions by lap ---
    laps_df = session.laps[["DriverNumber", "LapNumber", "Position"]].copy()
    laps_df = laps_df.dropna(subset=["Position"])
    laps_df["Position"] = laps_df["Position"].astype(int)
    laps_df["LapNumber"] = laps_df["LapNumber"].astype(int)

    positions_by_lap = []
    for lap_num in range(1, total_laps + 1):
        lap_rows = laps_df[laps_df["LapNumber"] == lap_num]
        positions = {}
        for _, row in lap_rows.iterrows():
            abbr = num_to_abbr.get(str(int(row["DriverNumber"])))
            if abbr:
                positions[abbr] = int(row["Position"])
        if positions:
            positions_by_lap.append({"lap": lap_num, "positions": positions})

    # --- Write race JSON ---
    race_data = {
        "race": race_meta,
        "drivers": drivers,
        "positionsByLap": positions_by_lap,
    }
    out_path = os.path.join("src", "data", f"{config['id']}.json")
    with open(out_path, "w") as f:
        json.dump(race_data, f, indent=2)
    print(f"  Written {out_path} ({len(positions_by_lap)} laps, {len(drivers)} drivers)")

# --- Write races index ---
index_path = os.path.join("src", "data", "races.json")
with open(index_path, "w") as f:
    json.dump(races_index, f, indent=2)
print(f"\nWritten {index_path}")
print("\nDone. Run 'npm run dev' to start the app.")
```

- [ ] **Step 3: Add `fastf1_cache/` to `.gitignore`**

Append to `.gitignore`:
```
fastf1_cache/
```

- [ ] **Step 4: Run the fetcher**

```bash
cd c:/Users/austi/f1-dashboard
pip install fastf1
python scripts/fetch_race_data.py
```

Expected output (will take a few minutes per race on first run due to download):
```
Fetching Bahrain 2024...
  Written src/data/bhr2024.json (57 laps, 20 drivers)
Fetching Saudi Arabia 2024...
  Written src/data/sau2024.json (50 laps, 20 drivers)
Fetching Australia 2024...
  Written src/data/aus2024.json (58 laps, 20 drivers)

Written src/data/races.json
Done. Run 'npm run dev' to start the app.
```

- [ ] **Step 5: Verify JSON shape**

Open `src/data/bhr2024.json` and confirm it contains:
- `race.id` = `"bhr2024"`, `race.laps` = `57`
- `drivers` array with objects having `id`, `name`, `team`, `color`
- `positionsByLap` array where each entry has `lap` (int) and `positions` (object mapping abbreviation → position number)

- [ ] **Step 6: Commit**

```bash
git add scripts/requirements.txt scripts/fetch_race_data.py .gitignore src/data/
git commit -m "feat: add FastF1 data fetcher and generated race JSON files"
```

---

## Task 2: React data layer

**Files:**
- Create: `src/data/index.js`
- Delete: `src/data/raceData.js`

- [ ] **Step 1: Create `src/data/index.js`**

```js
import races from './races.json';
import bhr2024 from './bhr2024.json';
import sau2024 from './sau2024.json';
import aus2024 from './aus2024.json';

export const RACES = races;

export const RACE_DATA = { bhr2024, sau2024, aus2024 };
```

- [ ] **Step 2: Delete `src/data/raceData.js`**

```bash
rm src/data/raceData.js
```

- [ ] **Step 3: Verify Vite can resolve the imports**

```bash
npm run build 2>&1 | head -30
```

Expected: build will fail with errors about missing imports in old components — that's fine, we haven't deleted those yet. What you're checking is that the JSON imports themselves resolve without error (look for lines mentioning `raceData` — those will be errors from old components, not from `index.js`).

- [ ] **Step 4: Commit**

```bash
git add src/data/index.js
git rm src/data/raceData.js
git commit -m "feat: add React data layer importing FastF1 JSON files"
```

---

## Task 3: CSS theming

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Replace `src/index.css` with dark + light theme tokens**

Replace the entire file:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Orbitron:wght@400;500;600;700;800;900&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Dark theme (default) */
:root {
  --bg-primary: #050508;
  --bg-card: rgba(255, 255, 255, 0.02);
  --border: rgba(255, 255, 255, 0.06);
  --text-primary: #eeeeff;
  --text-muted: rgba(238, 238, 255, 0.35);
  --text-dim: rgba(238, 238, 255, 0.2);
  --grid-line: rgba(255, 255, 255, 0.04);
  --accent-red: #e8002d;
  --header-bg: rgba(5, 5, 8, 0.88);
  --scrubber-track: rgba(255, 255, 255, 0.1);
}

/* Light theme */
[data-theme="light"] {
  --bg-primary: #f5f5f8;
  --bg-card: #ffffff;
  --border: rgba(0, 0, 0, 0.07);
  --text-primary: #111111;
  --text-muted: rgba(0, 0, 0, 0.4);
  --text-dim: rgba(0, 0, 0, 0.25);
  --grid-line: rgba(0, 0, 0, 0.05);
  --accent-red: #e8002d;
  --header-bg: rgba(255, 255, 255, 0.92);
  --scrubber-track: rgba(0, 0, 0, 0.1);
}

html, body {
  height: 100%;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  transition: background 0.3s, color 0.3s;
}

body {
  overflow-x: hidden;
}

#root {
  min-height: 100vh;
}

::-webkit-scrollbar {
  width: 3px;
  height: 3px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(232, 0, 45, 0.35);
  border-radius: 2px;
}

.orbitron {
  font-family: 'Orbitron', monospace;
}

/* Scrubber input styling */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  background: var(--scrubber-track);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #e8002d;
  box-shadow: 0 0 6px rgba(232, 0, 45, 0.6);
  cursor: pointer;
}
input[type="range"]::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #e8002d;
  box-shadow: 0 0 6px rgba(232, 0, 45, 0.6);
  cursor: pointer;
  border: none;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/index.css
git commit -m "feat: add light/dark theme CSS custom properties"
```

---

## Task 4: PlaybackControls component

**Files:**
- Create: `src/components/PlaybackControls.jsx`

- [ ] **Step 1: Create `src/components/PlaybackControls.jsx`**

```jsx
export default function PlaybackControls({
  currentLap,
  totalLaps,
  isPlaying,
  onPlay,
  onPause,
  onScrub,
}) {
  // Build tick labels: lap 1, every 10 laps, final lap
  const ticks = [1];
  for (let l = 10; l < totalLaps; l += 10) ticks.push(l);
  if (!ticks.includes(totalLaps)) ticks.push(totalLaps);

  function handleScrub(e) {
    onScrub(Number(e.target.value));
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '14px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    }}>
      {/* Play / Pause */}
      <button
        onClick={isPlaying ? onPause : onPlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '8px',
          border: 'none',
          background: 'var(--accent-red)',
          color: '#fff',
          fontSize: '14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      {/* Lap counter */}
      <div
        className="orbitron"
        style={{
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap',
          minWidth: '60px',
        }}
      >
        LAP {currentLap}
      </div>

      {/* Scrubber + ticks */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <input
          type="range"
          min={1}
          max={totalLaps}
          value={currentLap}
          onChange={handleScrub}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '9px',
          color: 'var(--text-dim)',
          fontFamily: 'Orbitron, monospace',
          userSelect: 'none',
        }}>
          {ticks.map(t => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>

      {/* Total */}
      <div style={{
        fontFamily: 'Orbitron, monospace',
        fontSize: '11px',
        color: 'var(--text-muted)',
        whiteSpace: 'nowrap',
      }}>
        / {totalLaps}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PlaybackControls.jsx
git commit -m "feat: add PlaybackControls component"
```

---

## Task 5: BumpChart component

**Files:**
- Create: `src/components/BumpChart.jsx`

- [ ] **Step 1: Create `src/components/BumpChart.jsx`**

```jsx
import { motion, AnimatePresence } from 'framer-motion';

// SVG layout constants
const SVG_W = 900;
const SVG_H = 480;
const PAD_LEFT = 36;    // space for P1..PN labels
const PAD_RIGHT = 48;   // space for driver abbreviation labels
const PAD_TOP = 16;
const PAD_BOTTOM = 28;  // space for lap number labels

const CHART_W = SVG_W - PAD_LEFT - PAD_RIGHT;
const CHART_H = SVG_H - PAD_TOP - PAD_BOTTOM;

function lapToX(lap, totalLaps) {
  if (totalLaps <= 1) return PAD_LEFT;
  return PAD_LEFT + ((lap - 1) / (totalLaps - 1)) * CHART_W;
}

function posToY(pos, numDrivers) {
  if (numDrivers <= 1) return PAD_TOP;
  return PAD_TOP + ((pos - 1) / (numDrivers - 1)) * CHART_H;
}

export default function BumpChart({ positionsByLap, drivers, currentLap, totalLaps }) {
  const numDrivers = drivers.length;

  // Slice data to currentLap
  const visibleLaps = positionsByLap.filter(d => d.lap <= currentLap);

  // Build per-driver point arrays
  const driverPoints = {};
  for (const driver of drivers) {
    driverPoints[driver.id] = [];
  }
  for (const lapEntry of visibleLaps) {
    for (const [abbr, pos] of Object.entries(lapEntry.positions)) {
      if (driverPoints[abbr] !== undefined) {
        driverPoints[abbr].push({ lap: lapEntry.lap, pos });
      }
    }
  }

  // Current positions for dots and animated labels
  const currentEntry = positionsByLap.find(d => d.lap === currentLap)
    ?? positionsByLap[positionsByLap.length - 1];
  const currentPositions = currentEntry?.positions ?? {};

  // Lap tick marks for X axis (every 10 laps + final)
  const lapTicks = [1];
  for (let l = 10; l < totalLaps; l += 10) lapTicks.push(l);
  if (!lapTicks.includes(totalLaps)) lapTicks.push(totalLaps);

  // Current lap vertical line X
  const currentX = lapToX(currentLap, totalLaps);

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '16px 12px 12px',
      width: '100%',
    }}>
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block' }}
      >
        {/* Y axis: position labels */}
        {Array.from({ length: numDrivers }, (_, i) => {
          const pos = i + 1;
          const y = posToY(pos, numDrivers);
          return (
            <text
              key={pos}
              x={PAD_LEFT - 6}
              y={y + 4}
              textAnchor="end"
              fill="var(--text-dim)"
              fontSize={numDrivers > 12 ? 9 : 11}
              fontFamily="Orbitron, monospace"
            >
              P{pos}
            </text>
          );
        })}

        {/* Horizontal grid lines */}
        {Array.from({ length: numDrivers }, (_, i) => {
          const pos = i + 1;
          const y = posToY(pos, numDrivers);
          return (
            <line
              key={pos}
              x1={PAD_LEFT}
              y1={y}
              x2={SVG_W - PAD_RIGHT}
              y2={y}
              stroke="var(--grid-line)"
              strokeWidth={1}
            />
          );
        })}

        {/* X axis: lap tick labels */}
        {lapTicks.map(lap => (
          <text
            key={lap}
            x={lapToX(lap, totalLaps)}
            y={SVG_H - 6}
            textAnchor="middle"
            fill="var(--text-dim)"
            fontSize={9}
            fontFamily="Orbitron, monospace"
          >
            {lap}
          </text>
        ))}

        {/* Driver polylines */}
        {drivers.map(driver => {
          const points = driverPoints[driver.id];
          if (points.length < 2) return null;
          const pointsStr = points
            .map(p => `${lapToX(p.lap, totalLaps)},${posToY(p.pos, numDrivers)}`)
            .join(' ');
          return (
            <polyline
              key={driver.id}
              points={pointsStr}
              stroke={driver.color}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.85}
            />
          );
        })}

        {/* Current lap vertical marker */}
        <line
          x1={currentX}
          y1={PAD_TOP}
          x2={currentX}
          y2={SVG_H - PAD_BOTTOM}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1}
          strokeDasharray="4 4"
        />

        {/* Moving dots at current lap */}
        {drivers.map(driver => {
          const pos = currentPositions[driver.id];
          if (pos == null) return null;
          return (
            <circle
              key={driver.id}
              cx={currentX}
              cy={posToY(pos, numDrivers)}
              r={4}
              fill={driver.color}
            />
          );
        })}

        {/* Animated driver labels (right edge, sorted by current position) */}
        <AnimatePresence>
          {drivers.map(driver => {
            const pos = currentPositions[driver.id];
            if (pos == null) return null;
            const y = posToY(pos, numDrivers);
            return (
              <motion.text
                key={driver.id}
                x={SVG_W - PAD_RIGHT + 6}
                y={y + 4}
                fill={driver.color}
                fontSize={numDrivers > 12 ? 9 : 11}
                fontFamily="Orbitron, monospace"
                fontWeight="bold"
                animate={{ y: y + 4 }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              >
                {driver.id}
              </motion.text>
            );
          })}
        </AnimatePresence>
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/BumpChart.jsx
git commit -m "feat: add BumpChart SVG component with animated driver labels"
```

---

## Task 6: Header component

**Files:**
- Modify: `src/components/Header.jsx`

- [ ] **Step 1: Replace `src/components/Header.jsx`**

```jsx
import { motion } from 'framer-motion';

export default function Header({ races, selectedRace, onRaceChange, theme, onThemeToggle }) {
  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'var(--header-bg)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 32px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div style={{
          width: '3px',
          height: '28px',
          background: 'linear-gradient(180deg, #e8002d 0%, rgba(232,0,45,0.3) 100%)',
          borderRadius: '2px',
          boxShadow: '0 0 12px rgba(232,0,45,0.6)',
        }} />
        <div>
          <div className="orbitron" style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '3px', marginBottom: '1px' }}>
            FORMULA 1
          </div>
          <div className="orbitron" style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '1px', color: 'var(--text-primary)' }}>
            Race Positions
          </div>
        </div>
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

        {/* Race tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(128,128,128,0.08)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '3px',
          gap: '2px',
        }}>
          {races.map(race => {
            const active = race.id === selectedRace;
            return (
              <button
                key={race.id}
                onClick={() => onRaceChange(race.id)}
                style={{
                  padding: '5px 14px',
                  borderRadius: '7px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  fontFamily: 'Inter, sans-serif',
                  transition: 'all 0.2s',
                  background: active ? 'rgba(232,0,45,0.15)' : 'transparent',
                  color: active ? '#e8002d' : 'var(--text-muted)',
                }}
              >
                {race.label.replace(' Grand Prix', '')}
              </button>
            );
          })}
        </div>

        {/* Theme toggle */}
        <button
          onClick={onThemeToggle}
          aria-label="Toggle theme"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            width: '38px',
            height: '22px',
            borderRadius: '11px',
            border: '1px solid var(--border)',
            background: theme === 'dark' ? 'rgba(255,255,255,0.08)' : '#e8002d',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '2px',
            transition: 'background 0.3s',
            flexShrink: 0,
          }}
        >
          <div style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: theme === 'dark' ? 'rgba(255,255,255,0.5)' : '#fff',
            transform: theme === 'dark' ? 'translateX(0)' : 'translateX(16px)',
            transition: 'transform 0.3s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '9px',
            lineHeight: 1,
          }}>
            {theme === 'dark' ? '🌙' : '☀️'}
          </div>
        </button>

      </div>
    </motion.header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Header.jsx
git commit -m "feat: rewrite Header with race tabs and theme toggle"
```

---

## Task 7: RaceVisualizer component

**Files:**
- Create: `src/components/RaceVisualizer.jsx`

- [ ] **Step 1: Create `src/components/RaceVisualizer.jsx`**

```jsx
import { motion } from 'framer-motion';
import BumpChart from './BumpChart';
import PlaybackControls from './PlaybackControls';

export default function RaceVisualizer({
  race,
  positionsByLap,
  drivers,
  currentLap,
  isPlaying,
  onPlay,
  onPause,
  onScrub,
}) {
  return (
    <motion.div
      key={race.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Race title */}
      <div style={{ marginBottom: '20px' }}>
        <h1 className="orbitron" style={{
          fontSize: '24px',
          fontWeight: 900,
          letterSpacing: '1px',
          color: 'var(--text-primary)',
          marginBottom: '4px',
        }}>
          {race.label.toUpperCase()}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {race.circuit} · {race.date} · {race.laps} Laps
        </p>
      </div>

      {/* Bump chart */}
      <div style={{ marginBottom: '16px' }}>
        <BumpChart
          positionsByLap={positionsByLap}
          drivers={drivers}
          currentLap={currentLap}
          totalLaps={race.laps}
        />
      </div>

      {/* Playback controls */}
      <PlaybackControls
        currentLap={currentLap}
        totalLaps={race.laps}
        isPlaying={isPlaying}
        onPlay={onPlay}
        onPause={onPause}
        onScrub={onScrub}
      />
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/RaceVisualizer.jsx
git commit -m "feat: add RaceVisualizer wrapper component"
```

---

## Task 8: Rewrite App.jsx

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Replace `src/App.jsx`**

```jsx
import { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import RaceVisualizer from './components/RaceVisualizer';
import { RACES, RACE_DATA } from './data/index.js';

const DEFAULT_RACE = RACES[0].id;
const PLAYBACK_INTERVAL_MS = 600;

export default function App() {
  const [selectedRace, setSelectedRace] = useState(DEFAULT_RACE);
  const [currentLap, setCurrentLap] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [theme, setTheme] = useState('dark');
  const intervalRef = useRef(null);

  const raceData = RACE_DATA[selectedRace];
  const { race, drivers, positionsByLap } = raceData;

  // Apply theme to DOM
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  // Playback interval
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentLap(lap => {
          if (lap >= race.laps) {
            setIsPlaying(false);
            return lap;
          }
          return lap + 1;
        });
      }, PLAYBACK_INTERVAL_MS);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, race.laps]);

  // Reset on race change
  function handleRaceChange(raceId) {
    setSelectedRace(raceId);
    setCurrentLap(1);
    setIsPlaying(false);
  }

  function handleScrub(lap) {
    setIsPlaying(false);
    setCurrentLap(lap);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', transition: 'background 0.3s' }}>
      <Header
        races={RACES}
        selectedRace={selectedRace}
        onRaceChange={handleRaceChange}
        theme={theme}
        onThemeToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
      />
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 32px 48px' }}>
        <RaceVisualizer
          race={race}
          positionsByLap={positionsByLap}
          drivers={drivers}
          currentLap={currentLap}
          isPlaying={isPlaying}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onScrub={handleScrub}
        />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/App.jsx
git commit -m "feat: rewrite App with playback state and theme management"
```

---

## Task 9: Delete old files

**Files:** Everything listed below gets deleted.

- [ ] **Step 1: Delete old components and API files**

```bash
cd c:/Users/austi/f1-dashboard
git rm src/components/LapTimeChart.jsx
git rm src/components/GapToLeaderChart.jsx
git rm src/components/TireStrategy.jsx
git rm src/components/DriverStatsCards.jsx
git rm src/components/RaceFinishChart.jsx
git rm src/components/RaceInfoBar.jsx
git rm src/components/DriverSelector.jsx
git rm src/components/LoadingState.jsx
git rm src/components/LiveRaceSelector.jsx
git rm src/hooks/useOpenF1.js
git rm src/api/openf1.js
git rm src/api/transform.js
```

- [ ] **Step 2: Commit**

```bash
git commit -m "chore: delete old dashboard components, hooks, and API files"
```

---

## Task 10: Verify the app works

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Expected: No build errors. Server starts at `http://localhost:5173`.

- [ ] **Step 2: Open the app and verify the following manually**

- [ ] Header shows "FORMULA 1 / Race Positions" logo, 3 race tabs, and a theme toggle pill
- [ ] Bump chart renders with all drivers as colored lines, P1–P{N} on Y-axis, lap ticks on X-axis
- [ ] Pressing ▶ animates forward lap by lap, driver labels slide vertically on overtakes
- [ ] ⏸ stops playback
- [ ] Scrubber can be dragged to any lap, chart updates immediately
- [ ] At final lap, playback stops automatically
- [ ] Switching race tab resets to lap 1 and stops playback
- [ ] Theme toggle switches between dark and light, all tokens update

- [ ] **Step 3: Verify production build is clean**

```bash
npm run build
```

Expected: No errors. `dist/` created successfully.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: animated race position visualizer — complete"
```
