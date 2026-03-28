import { motion } from 'framer-motion';
import { useMemo } from 'react';

// Top surface of f1-car.svg in its native coordinate space (viewBox 0 0 1000 280)
const CAR_SVG_PROFILE = [
  [  10, 122], [  75, 122], [ 150, 138], [ 185, 108],
  [ 260,  90], [ 380,  78], [ 520,  72], [ 590,  46],
  [ 650,  52], [ 680,  72], [ 780,  80], [ 840, 100],
  [ 890,  82], [1000, 130],
];

// Map SVG profile points to real screen pixels using measured car rect
function toScreenProfile(carRect) {
  const { left, top, width, height } = carRect;
  return CAR_SVG_PROFILE.map(([x, y]) => [
    left + (x / 1000) * width,
    top  + (y / 280)  * height,
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
  // Car vertical bounds from profile
  const profileYs = profile.map(([, y]) => y);
  const carTop = Math.min(...profileYs);
  const carBottom = Math.max(...profileYs);
  const carMid = (carTop + carBottom) / 2;
  const carSpan = carBottom - carTop;

  return Array.from({ length: LINE_COUNT }, (_, i) => {
    const t = i / (LINE_COUNT - 1); // 0 = outermost, 1 = innermost

    // Spread lines across a band centred on the car's mid-height.
    // Outer lines sit further above/below; inner lines hug the centre.
    const spread = carSpan * 0.6 + 40; // total vertical spread of all lines
    const lineY = carMid - spread / 2 + t * spread;

    const xs = [-vw * 0.25, vw * 1.25];
    const pts = xs.map(x => [x, lineY]);

    return {
      id: i,
      d: catmullRom(pts),
      strokeWidth: 0.4 + t * 0.7,
      opacity: 0.04 + t * 0.32,
      duration: 2.0 + (1 - t) * 1.5,
      delay: i * 0.08,
    };
  });
}

// carRect: { left, top, width, height } measured from the actual img DOM node
export default function FloatingCarPaths({ carRect }) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const paths = useMemo(() => {
    if (!carRect) return [];
    const profile = toScreenProfile(carRect);
    return buildPaths(vw, vh, profile);
  }, [carRect, vw, vh]);

  if (!paths.length) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2, opacity: 'var(--hero-stream-opacity)' }}>
      <svg
        style={{ width: '100%', height: '100%' }}
        viewBox={`0 0 ${vw} ${vh}`}
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
