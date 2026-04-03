import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ChevronDown, Flag, Menu, Moon, SunMedium, X } from 'lucide-react';

export default function Header({
  races,
  selectedRace,
  years,
  selectedYear,
  onApplySelection,
  theme,
  onThemeToggle,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [raceListOpen, setRaceListOpen] = useState(false);
  const [draftYear, setDraftYear] = useState(selectedYear);
  const [draftRaceId, setDraftRaceId] = useState(selectedRace);
  const availableRaces = races.filter(race => race.year === draftYear);
  const currentRace = races.find(race => race.id === selectedRace);
  const currentLabel = currentRace?.label ?? 'Race';
  const draftRace = availableRaces.find(race => race.id === draftRaceId) ?? availableRaces[0] ?? null;
  const hasPendingChanges = draftYear !== selectedYear || draftRaceId !== selectedRace;

  useEffect(() => {
    setDraftYear(selectedYear);
    setDraftRaceId(selectedRace);
  }, [selectedRace, selectedYear]);

  useEffect(() => {
    if (!menuOpen) {
      setRaceListOpen(false);
    }
  }, [menuOpen]);

  function handleDraftYear(year) {
    setDraftYear(year);
    const racesForYear = races.filter(race => race.year === year);
    const nextRace = racesForYear.find(race => race.id === draftRaceId) ?? racesForYear[0] ?? null;
    setDraftRaceId(nextRace?.id ?? '');
  }

  function handleApply() {
    if (!draftRaceId) return;
    onApplySelection(draftYear, draftRaceId);
    setMenuOpen(false);
    setRaceListOpen(false);
  }

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <motion.header
        className="header-root"
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div style={{
            width: '3px',
            height: '28px',
            background: 'linear-gradient(180deg, #e8002d 0%, rgba(232,0,45,0.3) 100%)',
            borderRadius: '2px',
            boxShadow: '0 0 12px rgba(232,0,45,0.6)',
            flexShrink: 0,
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

        <button
          type="button"
          className="header-menu-trigger"
          aria-label={menuOpen ? 'Close controls menu' : 'Open controls menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(open => !open)}
        >
          <span className="header-menu-trigger__label orbitron">Controls</span>
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button
              type="button"
              className="header-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMenuOpen(false)}
              aria-label="Close controls menu"
            />

            <motion.aside
              className="header-drawer"
              initial={{ x: '100%', opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.9 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="header-drawer__header">
                <div>
                  <div className="header-drawer__eyebrow orbitron">Dashboard Menu</div>
                  <div className="header-drawer__title orbitron">Control Center</div>
                </div>
                <button
                  type="button"
                  className="header-drawer__close"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close controls menu"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="header-drawer__section">
                <div className="header-drawer__sectionTitle orbitron">Grand Prix</div>
                <button
                  type="button"
                  className="header-drawer__raceButton"
                  onClick={() => setRaceListOpen(open => !open)}
                >
                  <span className="header-drawer__raceMeta">
                    <Flag size={14} />
                    <span>{draftRace?.label ?? currentLabel}</span>
                  </span>
                  <ChevronDown
                    size={16}
                    style={{
                      transform: raceListOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {raceListOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="header-drawer__raceList"
                    >
                      {availableRaces.map(race => {
                        const active = race.id === draftRaceId;
                        return (
                          <button
                            key={race.id}
                            type="button"
                            className={`header-drawer__raceItem${active ? ' is-active' : ''}`}
                            onClick={() => {
                              setDraftRaceId(race.id);
                              setRaceListOpen(false);
                            }}
                          >
                            {race.label}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="header-drawer__section">
                <div className="header-drawer__sectionTitle orbitron">Season</div>
                <div className="header-drawer__yearGrid">
                  {years.map(year => {
                    const active = year === draftYear;
                    return (
                      <button
                        key={year}
                        type="button"
                        className={`header-drawer__yearButton${active ? ' is-active' : ''}`}
                        onClick={() => handleDraftYear(year)}
                      >
                        {year}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="header-drawer__section">
                <div className="header-drawer__sectionTitle orbitron">Appearance</div>
                <button
                  type="button"
                  className="header-drawer__themeSimple"
                  onClick={onThemeToggle}
                  aria-label="Toggle theme"
                  title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  <span className="header-drawer__themeSimpleIcon">
                    {theme === 'dark' ? <Moon size={15} /> : <SunMedium size={15} />}
                  </span>
                  <span className={`header-drawer__themeSimpleSwitch${theme === 'light' ? ' is-light' : ''}`}>
                    <span className="header-drawer__themeSimpleKnob" />
                  </span>
                </button>
              </div>

              <div className="header-drawer__actions">
                <button
                  type="button"
                  className={`header-drawer__apply${hasPendingChanges ? ' is-ready' : ''}`}
                  onClick={handleApply}
                  disabled={!hasPendingChanges || !draftRaceId}
                >
                  Apply
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
