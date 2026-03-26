# F1 Race Position Visualizer

An animated race position visualizer for Formula 1. Watch lap-by-lap position changes play out across real 2024 race data — with full playback controls and light/dark mode.

![F1 Race Position Visualizer](https://img.shields.io/badge/React-19-blue) ![FastF1](https://img.shields.io/badge/Data-FastF1-red) ![Vite](https://img.shields.io/badge/Build-Vite-purple)

## Features

- **Animated bump chart** — all drivers plotted as colored lines across P1–P20, drawing forward lap by lap
- **Smooth overtake animations** — driver abbreviation labels spring-animate vertically as positions change
- **Playback controls** — play, pause, and scrub to any lap
- **3 real 2024 races** — Bahrain, Saudi Arabia, and Australia Grand Prix with actual timing data
- **Light / dark mode** — toggle in the header

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Fetch race data (one-time)

The app uses real F1 data fetched via [FastF1](https://docs.fastf1.dev/). Run this once to generate the static JSON files:

```bash
pip install fastf1
python scripts/fetch_race_data.py
```

This downloads and caches timing data from the 2024 Bahrain, Saudi Arabian, and Australian GPs. Takes a few minutes on first run; subsequent runs use the local cache.

### 3. Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Usage

| Action | How |
|---|---|
| Play / pause animation | ▶ / ⏸ button |
| Jump to a specific lap | Drag the scrubber |
| Switch race | Click a race tab in the header |
| Toggle light/dark mode | Click the 🌙 / ☀️ pill in the header |

## Project Structure

```
f1-dashboard/
├── scripts/
│   ├── fetch_race_data.py   # FastF1 data fetcher (run once)
│   └── requirements.txt
├── src/
│   ├── data/
│   │   ├── index.js         # Data layer exports
│   │   ├── races.json       # Race index (generated)
│   │   ├── bhr2024.json     # Bahrain GP data (generated)
│   │   ├── sau2024.json     # Saudi Arabia GP data (generated)
│   │   └── aus2024.json     # Australia GP data (generated)
│   ├── components/
│   │   ├── BumpChart.jsx        # SVG bump chart
│   │   ├── PlaybackControls.jsx # Play/pause + scrubber
│   │   ├── RaceVisualizer.jsx   # Chart + controls wrapper
│   │   └── Header.jsx           # Race tabs + theme toggle
│   └── App.jsx              # State management
```

## Tech Stack

- **React 19** + **Vite**
- **FastF1** — real F1 timing data
- **Framer Motion** — animated driver labels
- **SVG** — bump chart rendering (no charting library)
