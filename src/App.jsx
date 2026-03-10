import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import Header from './components/Header';
import DriverSelector from './components/DriverSelector';
import RaceInfoBar from './components/RaceInfoBar';
import LapTimeChart from './components/LapTimeChart';
import GapToLeaderChart from './components/GapToLeaderChart';
import TireStrategy from './components/TireStrategy';
import DriverStatsCards from './components/DriverStatsCards';
import { LoadingSkeleton, ErrorState, EmptyState } from './components/LoadingState';

import { DRIVERS, generateRaceData } from './data/raceData';
import { useRaceData } from './hooks/useOpenF1';

const DEFAULT_DEMO_RACE = 'bhr24';

export default function App() {
  const [mode, setMode] = useState('mock'); // 'mock' | 'live'

  // Demo mode state
  const [selectedRace, setSelectedRace] = useState(DEFAULT_DEMO_RACE);

  // Live mode state
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  // Demo data (always ready)
  const mockData = useMemo(() => generateRaceData(selectedRace), [selectedRace]);

  // Live data (fetched on demand)
  const { data: liveData, loading: liveLoading, error: liveError, retry: liveRetry } = useRaceData(
    mode === 'live' ? selectedMeeting : null
  );

  // Determine active data and driver list
  const isLive = mode === 'live';
  const activeData = isLive ? liveData : mockData;
  const activeDemoDriverIds = DRIVERS.map(d => d.id);

  const [selectedDrivers, setSelectedDrivers] = useState(
    () => activeDemoDriverIds.slice(0, 5)
  );

  // When live data loads, default-select top 5 drivers
  const [liveDefaulted, setLiveDefaulted] = useState(false);
  if (isLive && liveData && !liveDefaulted) {
    const ids = liveData.driverList.slice(0, 5).map(d => d.id);
    setSelectedDrivers(ids);
    setLiveDefaulted(true);
  }

  function handleModeChange(newMode) {
    setMode(newMode);
    setLiveDefaulted(false);
    if (newMode === 'mock') {
      setSelectedDrivers(activeDemoDriverIds.slice(0, 5));
    }
  }

  function handleMeetingChange(key) {
    setSelectedMeeting(key);
    setLiveDefaulted(false);
  }

  function toggleDriver(id) {
    setSelectedDrivers(prev =>
      prev.includes(id)
        ? prev.length > 1 ? prev.filter(d => d !== id) : prev
        : [...prev, id]
    );
  }

  // Driver list to show in selector
  const driverList = isLive
    ? (liveData?.driverList ?? [])
    : DRIVERS;

  const showSkeleton = isLive && liveLoading;
  const showError = isLive && liveError;
  const showEmpty = isLive && !liveLoading && !liveError && !liveData && !selectedMeeting;
  const showAwaitSelection = isLive && !liveLoading && !liveError && !liveData && selectedMeeting;
  const showCharts = !isLive || (isLive && liveData);

  const { race, lapChartData, gapData, driverStats } = activeData ?? {};

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Header
        mode={mode}
        onModeChange={handleModeChange}
        selectedRace={selectedRace}
        onRaceChange={r => { setSelectedRace(r); setSelectedDrivers(activeDemoDriverIds.slice(0, 5)); }}
        selectedMeeting={selectedMeeting}
        onMeetingChange={handleMeetingChange}
      />

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 32px 48px' }}>

        {/* Race title — shown for mock or when live data is ready */}
        {race && (
          <motion.div
            key={race.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ marginBottom: '20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <h1 className="orbitron" style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '1px' }}>
                {race.label}
              </h1>
              {isLive && (
                <span style={{
                  background: 'rgba(232,0,45,0.12)',
                  border: '1px solid rgba(232,0,45,0.3)',
                  color: '#e8002d',
                  fontSize: '10px',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  padding: '3px 8px',
                  borderRadius: '4px',
                }}>
                  OPENF1
                </span>
              )}
            </div>
            <p style={{ color: 'rgba(238,238,255,0.4)', fontSize: '14px' }}>
              {race.date} · {race.circuit} · {race.laps} Laps
            </p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {showSkeleton && (
            <motion.div key="loading">
              <LoadingSkeleton />
            </motion.div>
          )}

          {showError && (
            <motion.div key="error">
              <ErrorState message={liveError} onRetry={liveRetry} />
            </motion.div>
          )}

          {(showEmpty || showAwaitSelection) && (
            <motion.div key="empty">
              <EmptyState />
            </motion.div>
          )}

          {showCharts && race && (
            <motion.div
              key={race.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Info bar */}
              <div style={{ marginBottom: '20px' }}>
                <RaceInfoBar race={race} driverStats={driverStats} selectedDrivers={selectedDrivers} />
              </div>

              {/* Driver selector */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', color: 'rgba(238,238,255,0.3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Select Drivers
                </div>
                <DriverSelector
                  selected={selectedDrivers}
                  onToggle={toggleDriver}
                  driverStats={driverStats}
                  driverList={driverList}
                />
              </div>

              {/* Lap time chart */}
              <div style={{ marginBottom: '20px' }}>
                <LapTimeChart data={lapChartData} selectedDrivers={selectedDrivers} driverList={driverList} />
              </div>

              {/* Gap + Tire strategy */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <GapToLeaderChart data={gapData} selectedDrivers={selectedDrivers} driverList={driverList} />
                <TireStrategy
                  driverStats={driverStats}
                  totalLaps={race.laps}
                  selectedDrivers={selectedDrivers}
                  driverList={driverList}
                />
              </div>

              {/* Driver cards */}
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(238,238,255,0.3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '14px' }}>
                  Driver Performance
                </div>
                <DriverStatsCards
                  driverStats={driverStats}
                  selectedDrivers={selectedDrivers}
                  driverList={driverList}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
