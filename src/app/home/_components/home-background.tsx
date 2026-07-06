import { useTheme } from 'next-themes';
import { useEffect, useRef } from 'react';

/**
 * Static background decoration for the home page: a wall of small grid cells
 * reminiscent of a GitHub contribution history box.  Each cell has a
 * deterministic pseudo-random intensity (0–4) computed from its grid
 * coordinates.  No animation — purely a subtle texture layer behind the
 * foreground content.  DPR-aware canvas.
 */

const CELL = 14; // px square
const GAP = 4; // px between cells
const STRIDE = CELL + GAP;

// Dark mode — teal ladder with low alphas on dark background.
const DARK_ALPHA = [0, 0.08, 0.18, 0.32, 0.5];
const DARK_COLOR = [
  'oklch(0.30 0.02 162)',
  'oklch(0.55 0.09 162)',
  'oklch(0.65 0.11 162)',
  'oklch(0.72 0.12 162)',
  'oklch(0.82 0.14 162)',
];

// Light mode — neutral grey dots on white background.
const LIGHT_ALPHA = [0, 0.1, 0.22, 0.38, 0.55];
const LIGHT_COLOR = [
  'oklch(0.20 0 0)',
  'oklch(0.25 0 0)',
  'oklch(0.32 0 0)',
  'oklch(0.40 0 0)',
  'oklch(0.50 0 0)',
];

// Deterministic pseudo-random in [0,1) from integer coordinates.
const hash2 = (x: number, y: number): number => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};

// Base intensity 0–4 for a cell.
const baseLevel = (gx: number, gy: number): number => {
  const r = hash2(gx, gy);
  if (r < 0.55) return 0;
  if (r < 0.75) return 1;
  if (r < 0.89) return 2;
  if (r < 0.97) return 3;
  return 4;
};

export function HomeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const isDark = resolvedTheme !== 'light';
    const LEVEL_COLOR = isDark ? DARK_COLOR : LIGHT_COLOR;
    const LEVEL_BY_ALPHA = isDark ? DARK_ALPHA : LIGHT_ALPHA;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const roundRect = (x: number, y: number, size: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + size, y, x + size, y + size, r);
      ctx.arcTo(x + size, y + size, x, y + size, r);
      ctx.arcTo(x, y + size, x, y, r);
      ctx.arcTo(x, y, x + size, y, r);
      ctx.closePath();
    };

    const render = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.clearRect(0, 0, w, h);

      const cols = Math.ceil(w / STRIDE) + 1;
      const rows = Math.ceil(h / STRIDE) + 1;

      const radius = 2;
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const level = baseLevel(gx, gy);
          const x = gx * STRIDE;
          const y = gy * STRIDE;
          const alpha = LEVEL_BY_ALPHA[level];
          const color = LEVEL_COLOR[level];
          ctx.fillStyle = color.replace(')', ` / ${alpha})`);
          roundRect(x, y, CELL, radius);
          ctx.fill();
        }
      }
    };
    render();

    // Repaint on resize or theme change.
    const ro = new ResizeObserver(render);
    ro.observe(canvas);

    return () => {
      ro.disconnect();
    };
  }, [resolvedTheme]);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <canvas className="absolute inset-0 h-full w-full" ref={canvasRef} />

      {/* Stronger vignette makes the grid recede behind centered content. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_18%,background_72%)]" />
      <div className="absolute inset-0 bg-linear-to-b from-background/65 via-transparent to-background/75" />
    </div>
  );
}
