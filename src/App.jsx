import { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import RaceVisualizer from './components/RaceVisualizer';
import HeroSection from './components/HeroSection';
import RaceSummary from './components/RaceSummary';
import PlaybackControls from './components/PlaybackControls';
import { RACES, RACE_DATA } from './data/index.js';

const YEARS = [2024, 2025, 2026];
const CHART_FOCUS_LAPS_PER_SEC = 3;
const CIRCUIT_FOCUS_LAPS_PER_SEC = 1;
const CIRCUIT_REALTIME_SPEED = 1;
const CHART_RENDER_LAP_STEP = 0.1;
const CIRCUIT_RENDER_MS_STEP = 33;

export default function App() {
  const [selectedYear, setSelectedYear] = useState(2026);
  const racesForYear = RACES.filter(r => r.year === selectedYear);
  const [selectedRace, setSelectedRace] = useState(racesForYear[0].id);
  const [currentLap, setCurrentLap] = useState(0);
  const [currentPlaybackMs, setCurrentPlaybackMs] = useState(0);
  const [telemetry, setTelemetry] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [viewMode, setViewMode] = useState('chart');
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);
  const dashboardRef = useRef(null);
  const summaryRef = useRef(null);

  const lapsPerSecond = viewMode === 'circuit' ? CIRCUIT_FOCUS_LAPS_PER_SEC : CHART_FOCUS_LAPS_PER_SEC;

  const raceMetadata = RACES.find(r => r.id === selectedRace);
  const raceData = RACE_DATA[selectedRace] ?? {
    race: raceMetadata,
    drivers: [],
    grid: [],
    positionsByLap: [],
    dnfLaps: {},
    stints: {},
    safetyCars: [],
    gapsByLap: [],
    fastestLap: null,
  };
  const { race, drivers, grid, positionsByLap, dnfLaps, stints, safetyCars, gapsByLap, fastestLap } = raceData;
  const telemetryDurationMs = Math.max(telemetry?.sessionDurationMs ?? 0, telemetry?.samples?.[telemetry?.samples?.length - 1]?.t ?? 0);
  const telemetryRaceStartMs = Number.isFinite(telemetry?.raceStartTimeMs) ? telemetry.raceStartTimeMs : 0;
  const telemetryRaceEndMs = Number.isFinite(telemetry?.raceEndTimeMs) ? telemetry.raceEndTimeMs : telemetryDurationMs;
  const shouldSkipPreRaceTelemetry = telemetryDurationMs > 0 && telemetry?.hasFormationLapSamples === false && telemetryRaceStartMs > 0;
  const telemetryPlaybackStartMs = shouldSkipPreRaceTelemetry ? telemetryRaceStartMs : 0;
  const visibleTelemetryDurationMs = Math.max(telemetryDurationMs - telemetryPlaybackStartMs, 0);
  const isRealtimeCircuitMode = viewMode === 'circuit' && telemetryDurationMs > 0;
  const visualCurrentLap = (viewMode === 'chart' && isPlaying)
    ? Math.round(currentLap / CHART_RENDER_LAP_STEP) * CHART_RENDER_LAP_STEP
    : currentLap;
  const visualPlaybackMs = (isRealtimeCircuitMode && isPlaying)
    ? Math.round(currentPlaybackMs / CIRCUIT_RENDER_MS_STEP) * CIRCUIT_RENDER_MS_STEP
    : currentPlaybackMs;

  const isFinished = isRealtimeCircuitMode
    ? currentPlaybackMs >= telemetryDurationMs && !isPlaying
    : currentLap >= race.laps && !isPlaying;

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    let isCancelled = false;

    async function loadTelemetry() {
      setTelemetry(null);
      try {
        const response = await fetch(`/telemetry/${selectedRace}.json`, { cache: 'force-cache' });
        if (!response.ok) {
          if (!isCancelled) setTelemetry(null);
          return;
        }
        const payload = await response.json();
        if (!isCancelled) {
          setTelemetry(payload);
        }
      } catch {
        if (!isCancelled) {
          setTelemetry(null);
        }
      }
    }

    loadTelemetry();

    return () => {
      isCancelled = true;
    };
  }, [selectedRace]);

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

  useEffect(() => {
    if (telemetryDurationMs <= 0) return;
    if (isRealtimeCircuitMode) {
      setCurrentPlaybackMs(
        telemetryPlaybackStartMs + (currentLap / Math.max(race.laps, 1)) * visibleTelemetryDurationMs
      );
    }
  }, [isRealtimeCircuitMode, race.laps, telemetryDurationMs, telemetryPlaybackStartMs, visibleTelemetryDurationMs]);

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
      if (isRealtimeCircuitMode) {
        setCurrentPlaybackMs(playbackMs => {
          const nextMs = playbackMs + delta * 1000 * CIRCUIT_REALTIME_SPEED;
          const clampedMs = Math.min(nextMs, telemetryDurationMs);
          setCurrentLap((clampedMs / Math.max(telemetryDurationMs, 1)) * race.laps);
          if (clampedMs >= telemetryDurationMs) {
            setIsPlaying(false);
          }
          return clampedMs;
        });
      } else {
        setCurrentLap(lap => {
          const next = lap + delta * lapsPerSecond;
          if (next >= race.laps) {
            setIsPlaying(false);
            return race.laps;
          }
          return next;
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, isRealtimeCircuitMode, lapsPerSecond, race.laps, telemetryDurationMs]);

  function handleRaceChange(raceId) {
    setSelectedRace(raceId);
    setCurrentLap(0);
    setCurrentPlaybackMs(0);
    setIsPlaying(true);
  }

  function handleApplySelection(year, raceId) {
    setSelectedYear(year);
    handleRaceChange(raceId);
  }

  function handleScrub(lap) {
    if (isRealtimeCircuitMode) {
      const absolutePlaybackMs = telemetryPlaybackStartMs + lap;
      const clampedMs = Math.min(Math.max(absolutePlaybackMs, telemetryPlaybackStartMs), telemetryDurationMs);
      setCurrentPlaybackMs(clampedMs);
      setCurrentLap(((clampedMs - telemetryPlaybackStartMs) / Math.max(visibleTelemetryDurationMs, 1)) * race.laps);
      setIsPlaying(clampedMs < telemetryDurationMs);
      return;
    }

    setCurrentLap(lap);
    if (telemetryDurationMs > 0) {
      setCurrentPlaybackMs((lap / Math.max(race.laps, 1)) * telemetryDurationMs);
    }
    setIsPlaying(lap < race.laps);
  }

  function scrollToSummary() {
    summaryRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  useEffect(() => {
    function handleKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (isRealtimeCircuitMode && currentPlaybackMs >= telemetryDurationMs && !isPlaying) {
          setCurrentPlaybackMs(telemetryPlaybackStartMs);
          setCurrentLap(0);
          setIsPlaying(true);
        } else if (currentLap >= race.laps && !isPlaying) {
          setCurrentLap(0);
          setIsPlaying(true);
        } else {
          setIsPlaying(p => !p);
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setIsPlaying(false);
        if (isRealtimeCircuitMode) {
          setCurrentPlaybackMs(ms => {
            const nextMs = Math.max(telemetryPlaybackStartMs, ms - 5000);
            setCurrentLap(((nextMs - telemetryPlaybackStartMs) / Math.max(visibleTelemetryDurationMs, 1)) * race.laps);
            return nextMs;
          });
        } else {
          setCurrentLap(l => Math.max(0, Math.floor(l) - 1));
        }
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setIsPlaying(false);
        if (isRealtimeCircuitMode) {
          setCurrentPlaybackMs(ms => {
            const nextMs = Math.min(telemetryDurationMs, ms + 5000);
            setCurrentLap(((nextMs - telemetryPlaybackStartMs) / Math.max(visibleTelemetryDurationMs, 1)) * race.laps);
            return nextMs;
          });
        } else {
          setCurrentLap(l => Math.min(race.laps, Math.floor(l) + 1));
        }
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentLap, currentPlaybackMs, isPlaying, isRealtimeCircuitMode, race.laps, telemetryDurationMs, telemetryPlaybackStartMs, visibleTelemetryDurationMs]);

  return (
    <>
      <HeroSection />
      <section
        id="dashboard"
        ref={dashboardRef}
        style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', transition: 'background 0.3s' }}
      >
        <Header
          races={RACES}
          selectedRace={selectedRace}
          years={YEARS}
          selectedYear={selectedYear}
          onApplySelection={handleApplySelection}
          theme={theme}
          onThemeToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        />
        <main className="main-content">
          <RaceVisualizer
            race={race}
            positionsByLap={positionsByLap}
            drivers={drivers}
            grid={grid}
            telemetry={telemetry}
            dnfLaps={dnfLaps}
            currentLap={visualCurrentLap}
            currentPlaybackMs={visualPlaybackMs}
            isFinished={isFinished}
            stints={stints}
            safetyCars={safetyCars}
            gapsByLap={gapsByLap}
            onViewSummary={scrollToSummary}
            onViewModeChange={setViewMode}
          />
        </main>
        <div className="playback-rail">
          <div className="playback-rail__inner">
            <PlaybackControls
              currentLap={currentLap}
              totalLaps={race.laps}
              currentPlaybackMs={currentPlaybackMs}
              totalPlaybackMs={visibleTelemetryDurationMs}
              playbackStartMs={telemetryPlaybackStartMs}
              mode={isRealtimeCircuitMode ? 'time' : 'lap'}
              isPlaying={isPlaying}
              isFinished={isFinished}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onReplay={() => {
                setCurrentLap(0);
                setCurrentPlaybackMs(telemetryPlaybackStartMs);
                setIsPlaying(true);
              }}
              onScrub={handleScrub}
            />
          </div>
        </div>
      </section>

      {isFinished && (
        <section
          ref={summaryRef}
          id="summary"
          style={{
            background: 'var(--bg-primary)',
            padding: '16px 24px 48px',
            transition: 'background 0.3s',
          }}
        >
          <RaceSummary
            race={race}
            drivers={drivers}
            positionsByLap={positionsByLap}
            dnfLaps={dnfLaps}
            stints={stints}
            fastestLap={fastestLap}
            grid={grid}
          />
        </section>
      )}
    </>
  );
}
