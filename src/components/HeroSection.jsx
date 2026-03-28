import { motion } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import HeroNavbar from './HeroNavbar';
import ScrollPrompt from './ScrollPrompt';
import FloatingCarPaths from './FloatingCarPaths';
import f1CarPng from '../assets/f1-car.png';

export default function HeroSection() {
  const imgRef = useRef(null);
  const [carRect, setCarRect] = useState(null);

  const measureCar = useCallback(() => {
    const el = imgRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setCarRect({ left: r.left, top: r.top, width: r.width, height: r.height });
  }, []);

  useEffect(() => {
    const el = imgRef.current;
    if (el?.complete) measureCar();
    window.addEventListener('resize', measureCar);
    return () => window.removeEventListener('resize', measureCar);
  }, [measureCar]);

  function scrollToDashboard(e) {
    e.preventDefault();
    document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <section
      style={{
        position: 'relative',
        height: '100svh',
        minHeight: '580px',
        background: 'var(--hero-bg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'background 0.3s',
      }}
    >
      <HeroNavbar />
      <FloatingCarPaths carRect={carRect} />

      {/* ── TEXT ZONE ── */}
      <div className="hero-text" style={{
        flex: '0 0 auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        paddingTop: '64px',
        paddingLeft: '24px',
        paddingRight: '24px',
        position: 'relative',
        zIndex: 4,
      }}>
        {/* Eyebrow */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '16px',
          opacity: 0,
          animation: 'hero-fade-up 0.6s ease-out 0.05s forwards',
        }}>
          <div style={{ width: '24px', height: '2px', background: '#e8002d', boxShadow: '0 0 8px rgba(232,0,45,0.7)' }} />
          <span className="orbitron" style={{ fontSize: '10px', letterSpacing: '4px', color: '#e8002d' }}>
            FORMULA 1
          </span>
          <div style={{ width: '24px', height: '2px', background: '#e8002d', boxShadow: '0 0 8px rgba(232,0,45,0.7)' }} />
        </div>

        {/* Headline */}
        <h1
          className="orbitron"
          style={{
            fontSize: 'clamp(28px, 5vw, 64px)',
            fontWeight: 900,
            lineHeight: 1.08,
            textTransform: 'uppercase',
            color: 'var(--hero-heading)',
            margin: '0 0 12px',
            opacity: 0,
            animation: 'hero-fade-up 0.7s ease-out 0.15s forwards',
          }}
        >
          Race Positions
          <br />
          <span style={{ color: 'var(--hero-heading)' }}>Like a </span>
          <span style={{ color: '#e8002d' }}>Pro.</span>
        </h1>

        {/* Tagline */}
        <p style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 'clamp(12px, 1.4vw, 15px)',
          fontWeight: 400,
          lineHeight: 1.6,
          color: 'var(--hero-tagline)',
          margin: '0 0 24px',
          maxWidth: '400px',
          opacity: 0,
          animation: 'hero-fade-up 0.7s ease-out 0.28s forwards',
        }}>
          Watch every overtake unfold lap by lap. Interactive animations powered by real FastF1 telemetry.
        </p>

        {/* CTA */}
        <div style={{ opacity: 0, animation: 'hero-fade-up 0.7s ease-out 0.4s forwards' }}>
          <a
            href="#dashboard"
            onClick={scrollToDashboard}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontWeight: 600,
              fontSize: '14px',
              color: '#fff',
              textDecoration: 'none',
              background: '#e8002d',
              padding: '11px 26px',
              borderRadius: '8px',
              boxShadow: '0 0 24px rgba(232,0,45,0.35)',
              transition: 'background 0.2s, box-shadow 0.2s, transform 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#c8001a';
              e.currentTarget.style.boxShadow = '0 0 32px rgba(232,0,45,0.5)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#e8002d';
              e.currentTarget.style.boxShadow = '0 0 24px rgba(232,0,45,0.35)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Open Dashboard
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7H11.5M11.5 7L7.5 3M11.5 7L7.5 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </div>

      {/* ── F1 Car ── */}
      <div className="hero-car" style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(88%, 860px)',
        zIndex: 3,
      }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: 'drop-shadow(0 -4px 40px rgba(232,0,45,0.18)) drop-shadow(0 20px 40px rgba(0,0,0,0.7))' }}
        >
          <motion.img
            ref={imgRef}
            src={f1CarPng}
            alt="F1 race car"
            onLoad={measureCar}
            style={{ width: '100%', height: 'auto', display: 'block' }}
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 1.5, repeatDelay: 2.5 }}
          />
        </motion.div>
      </div>

      <ScrollPrompt />

      <style>{`
        @keyframes hero-fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-car { top: 32%; }
        .hero-text { margin-top: 0; }
        @media (max-width: 767px) {
          .hero-car { top: 52%; }
          .hero-text { margin-top: 48px; }
        }
      `}</style>
    </section>
  );
}
