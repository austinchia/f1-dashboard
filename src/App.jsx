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
