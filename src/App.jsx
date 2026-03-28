import { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import RaceVisualizer from './components/RaceVisualizer';
import HeroSection from './components/HeroSection';
import { RACES, RACE_DATA } from './data/index.js';

const YEARS = [2024, 2025];

export default function App() {
  const [selectedYear, setSelectedYear] = useState(2025);
  const racesForYear = RACES.filter(r => r.year === selectedYear);

  const [selectedRace, setSelectedRace] = useState(racesForYear[0].id);
  const [currentLap, setCurrentLap] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [theme, setTheme] = useState('dark');
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);
  const dashboardRef = useRef(null);
  const LAPS_PER_SEC = 1.5;

  const raceMetadata = RACES.find(r => r.id === selectedRace);
  const raceData = RACE_DATA[selectedRace] ?? {
    race: raceMetadata,
    drivers: [],
    positionsByLap: [],
    dnfLaps: {},
  };
  const { race, drivers, positionsByLap, dnfLaps } = raceData;

  // Apply theme to DOM
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  // Start animation only when dashboard scrolls into view (fires once)
  useEffect(() => {
    const el = dashboardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsPlaying(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Smooth RAF-based playback
  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
      return;
    }
    function tick(timestamp) {
      if (lastTimeRef.current === null) lastTimeRef.current = timestamp;
      const delta = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;
      setCurrentLap(lap => {
        const next = lap + delta * LAPS_PER_SEC;
        if (next >= race.laps) {
          setIsPlaying(false);
          return race.laps;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, race.laps]);

  function handleYearChange(year) {
    const filtered = RACES.filter(r => r.year === year);
    setSelectedYear(year);
    setSelectedRace(filtered[0].id);
    setCurrentLap(1);
    setIsPlaying(true);
  }

  function handleRaceChange(raceId) {
    setSelectedRace(raceId);
    setCurrentLap(1);
    setIsPlaying(true);
  }

  function handleScrub(lap) {
    setCurrentLap(lap);
    setIsPlaying(lap < race.laps);
  }

  return (
    <>
      <HeroSection />
      <section
        id="dashboard"
        ref={dashboardRef}
        style={{ height: '100svh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-primary)', transition: 'background 0.3s' }}
      >
        <Header
          races={racesForYear}
          selectedRace={selectedRace}
          onRaceChange={handleRaceChange}
          years={YEARS}
          selectedYear={selectedYear}
          onYearChange={handleYearChange}
          theme={theme}
          onThemeToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        />
        <main className="main-content">
          <RaceVisualizer
            race={race}
            positionsByLap={positionsByLap}
            drivers={drivers}
            dnfLaps={dnfLaps}
            currentLap={currentLap}
            isPlaying={isPlaying}
            isFinished={currentLap >= race.laps && !isPlaying}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onReplay={() => { setCurrentLap(1); setIsPlaying(true); }}
            onScrub={handleScrub}
          />
        </main>
      </section>
    </>
  );
}
