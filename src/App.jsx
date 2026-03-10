import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import Header from './components/Header';
import DriverSelector from './components/DriverSelector';
import RaceInfoBar from './components/RaceInfoBar';
import LapTimeChart from './components/LapTimeChart';
import GapToLeaderChart from './components/GapToLeaderChart';
import TireStrategy from './components/TireStrategy';
import DriverStatsCards from './components/DriverStatsCards';

import { DRIVERS, generateRaceData } from './data/raceData';

const DEFAULT_DRIVERS = ['VER', 'NOR', 'LEC', 'SAI', 'HAM'];

export default function App() {
  const [selectedRace, setSelectedRace] = useState('bhr24');
  const [selectedDrivers, setSelectedDrivers] = useState(DEFAULT_DRIVERS);

  const raceData = useMemo(() => generateRaceData(selectedRace), [selectedRace]);

  function toggleDriver(id) {
    setSelectedDrivers(prev =>
      prev.includes(id)
        ? prev.length > 1 ? prev.filter(d => d !== id) : prev
        : [...prev, id]
    );
  }

  function handleRaceChange(raceId) {
    setSelectedRace(raceId);
    setSelectedDrivers(DEFAULT_DRIVERS);
  }

  const { race, lapChartData, gapData, driverStats } = raceData;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Header selectedRace={selectedRace} onRaceChange={handleRaceChange} />

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 32px 48px' }}>

        {/* Race title */}
        <motion.div
          key={selectedRace}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ marginBottom: '20px' }}
        >
          <h1 className="orbitron" style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '1px' }}>
            {race.label}
          </h1>
          <p style={{ color: 'rgba(238,238,255,0.4)', fontSize: '14px', marginTop: '4px' }}>
            {race.date} · {race.circuit} · {race.laps} Laps
          </p>
        </motion.div>

        {/* Info bar */}
        <div style={{ marginBottom: '20px' }}>
          <RaceInfoBar race={race} driverStats={driverStats} selectedDrivers={selectedDrivers} />
        </div>

        {/* Driver filter */}
        <div style={{ marginBottom: '24px', padding: '0' }}>
          <div style={{ fontSize: '11px', color: 'rgba(238,238,255,0.3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px' }}>
            Select Drivers
          </div>
          <DriverSelector
            selected={selectedDrivers}
            onToggle={toggleDriver}
            driverStats={driverStats}
          />
        </div>

        {/* Charts — animated in on race change */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedRace}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Main chart */}
            <div style={{ marginBottom: '20px' }}>
              <LapTimeChart
                data={lapChartData}
                selectedDrivers={selectedDrivers}
              />
            </div>

            {/* Two-column row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '20px',
            }}>
              <GapToLeaderChart data={gapData} selectedDrivers={selectedDrivers} />
              <TireStrategy
                driverStats={driverStats}
                totalLaps={race.laps}
                selectedDrivers={selectedDrivers}
              />
            </div>

            {/* Driver cards */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(238,238,255,0.3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '14px' }}>
                Driver Performance
              </div>
              <DriverStatsCards
                driverStats={driverStats}
                selectedDrivers={selectedDrivers}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
