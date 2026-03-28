import { motion } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';

function useViewportSize() {
  const snap = () => ({ w: window.innerWidth, h: window.innerHeight });
  const [size, setSize] = useState(snap);
  useEffect(() => {
    let t;
    const onResize = () => { clearTimeout(t); t = setTimeout(() => setSize(snap()), 120); };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); clearTimeout(t); };
  }, []);
  return size;
}

// Top surface of f1-car.svg in its native coordinate space (viewBox 0 0 1000 280)
const CAR_SVG_PROFILE = [
  [  10, 122], [  75, 122], [ 150, 138], [ 185, 108],
  [ 260,  90], [ 380,  78], [ 520,  72], [ 590,  46],
  [ 650,  52], [ 680,  72], [ 780,  80], [ 840, 100],
  [ 890,  82], [1000, 130],
];

// Map car SVG profile to real screen pixels.
// Must match the CSS positioning of the car div in HeroSection.
function toScreenProfile(vw, vh) {
  const carW = Math.min(vw * 0.92, 1100);
  const carH = carW * 0.28; // aspect ratio of f1-car.svg: 280/1000
  const carLeft = (vw - carW) / 2;
  // bottom: 12% on mobile (<768px), 3% on desktop — matches HeroSection CSS
  const carBottomY = vw < 768 ? vh * 0.88 : vh * 0.97;
  const carTopY = carBottomY - carH;
  return CAR_SVG_PROFILE.map(([x, y]) => [
    carLeft + (x / 1000) * carW,
    carTopY + (y / 280)  * carH,
  ]);
}

function lerpY(x, profile) {
  if (x <= profile[0][0]) return profile[0][1];
  const last = profile[profile.length - 1];
  if (x >= last[0]) return last[1];
  for (let k = 0; k < profile.length - 1; k++) {
    const [x0, y0] = profile[k];
    const [x1, y1] = profile[k + 1];
    if (x >= x0 && x <= x1)
      return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
  }
  return last[1];
}

function catmullRom(pts, tension = 0.38) {
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let k = 0; k < pts.length - 1; k++) {
    const p0 = pts[Math.max(0, k - 1)], p1 = pts[k];
    const p2 = pts[k + 1],              p3 = pts[Math.min(pts.length - 1, k + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) * tension;
    const c1y = p1[1] + (p2[1] - p0[1]) * tension;
    const c2x = p2[0] - (p3[0] - p1[0]) * tension;
    const c2y = p2[1] - (p3[1] - p1[1]) * tension;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)},${c2x.toFixed(1)} ${c2y.toFixed(1)},${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

const LINE_COUNT = 22;

function buildPaths(vw, vh, profile) {
  const peakY = Math.min(...profile.map(([, y]) => y)); // highest point on car (smallest y)

  return Array.from({ length: LINE_COUNT }, (_, i) => {
    const t = i / (LINE_COUNT - 1);           // 0 = outermost, 1 = innermost
    const clearance = 8 + (1 - t) * 130;      // inner = 8px above surface, outer = 138px
    const entryY = Math.max(vh * 0.04, peakY - clearance);

    // Sample at viewport margins + every car profile x-coordinate
    const xs = [
      -vw * 0.06, 0,
      ...profile.map(([x]) => x),
      vw, vw * 1.06,
    ].sort((a, b) => a - b);

    const pts = xs.map(x => {
      if (x <= 0 || x >= vw) return [x, entryY];
      const followY = lerpY(x, profile) - clearance;
      // Only deflect upward: if car surface rises above ambient, push line up
      return [x, Math.min(entryY, followY)];
    });

    return {
      id: i,
      d: catmullRom(pts),
      strokeWidth: 0.4 + t * 0.85,
      opacity: 0.05 + t * 0.38,
      duration: 3.0 + (1 - t) * 2.8,
      delay: i * 0.2,
    };
  });
}

export default function FloatingCarPaths() {
  const { w, h } = useViewportSize();

  const paths = useMemo(() => {
    const profile = toScreenProfile(w, h);
    return buildPaths(w, h, profile);
  }, [w, h]);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3 }}>
      <svg
        style={{ width: '100%', height: '100%' }}
        viewBox={`0 0 ${w} ${h}`}
        fill="none"
        preserveAspectRatio="none"
      >
        {paths.map(p => (
          <motion.path
            key={p.id}
            d={p.d}
            stroke="#e8002d"
            strokeWidth={p.strokeWidth}
            strokeOpacity={p.opacity}
            strokeLinecap="round"
            initial={{ pathLength: 0.12, pathOffset: 0 }}
            animate={{ pathOffset: [0, 1] }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: 'linear',
              delay: p.delay,
            }}
          />
        ))}
      </svg>
    </div>
  );
}
