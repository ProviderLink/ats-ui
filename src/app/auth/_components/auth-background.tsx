export function AuthBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <style>{`
        @keyframes ab-drift-1 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(40px,-30px) scale(1.08); }
        }
        @keyframes ab-drift-2 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(-35px,25px) scale(1.06); }
        }
        @keyframes ab-drift-3 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(20px,30px) scale(1.05); }
        }
        .ab-1 { animation: ab-drift-1 20s ease-in-out infinite; }
        .ab-2 { animation: ab-drift-2 26s ease-in-out infinite; }
        .ab-3 { animation: ab-drift-3 16s ease-in-out infinite; }
      `}</style>

      {/* ── Gradient orbs ── */}
      <div className="ab-1 absolute -top-40 -right-32 w-[680px] h-[680px] rounded-full
                      bg-[radial-gradient(ellipse_at_center,oklch(0.6_0.12_185/0.28),transparent_70%)]
                      blur-[90px]" />
      <div className="ab-2 absolute -bottom-48 -left-40 w-[620px] h-[620px] rounded-full
                      bg-[radial-gradient(ellipse_at_center,oklch(0.45_0.1_185/0.22),transparent_70%)]
                      blur-[90px]" />
      <div className="ab-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                      w-[480px] h-[360px] rounded-full
                      bg-[radial-gradient(ellipse_at_center,oklch(0.6_0.1_185/0.1),transparent_70%)]
                      blur-[70px]" />

      {/* ── Geometric SVG accents ── */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="ab-grid" x="0" y="0" width="52" height="52" patternUnits="userSpaceOnUse">
            <path d="M 52 0 L 0 0 0 52" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
          <radialGradient id="ab-grid-fade" cx="50%" cy="50%" r="60%">
            <stop offset="0%"   stopOpacity="0" />
            <stop offset="55%"  stopOpacity="1" />
            <stop offset="100%" stopOpacity="1" />
          </radialGradient>
          <mask id="ab-grid-mask">
            <rect width="1440" height="900" fill="url(#ab-grid-fade)" />
          </mask>
        </defs>

        {/* Fine grid — fades out toward center */}
        <rect
          width="1440" height="900"
          fill="url(#ab-grid)"
          className="text-primary"
          opacity="0.09"
          mask="url(#ab-grid-mask)"
        />

        {/* Thin ring accents — top-right */}
        <circle cx="1310" cy="-40" r="320" fill="none" stroke="oklch(0.6 0.12 185)" strokeWidth="0.6" opacity="0.12" />
        <circle cx="1310" cy="-40" r="480" fill="none" stroke="oklch(0.6 0.12 185)" strokeWidth="0.4" opacity="0.07" />
        <circle cx="1310" cy="-40" r="640" fill="none" stroke="oklch(0.6 0.12 185)" strokeWidth="0.3" opacity="0.04" />

        {/* Thin ring accents — bottom-left */}
        <circle cx="130"  cy="940" r="260" fill="none" stroke="oklch(0.6 0.12 185)" strokeWidth="0.6" opacity="0.1" />
        <circle cx="130"  cy="940" r="430" fill="none" stroke="oklch(0.6 0.12 185)" strokeWidth="0.4" opacity="0.06" />

        {/* Hairline diagonal — top-right corner sweep */}
        <line x1="1100" y1="0"   x2="1440" y2="290" stroke="oklch(0.6 0.12 185)" strokeWidth="0.5" opacity="0.1" />
        <line x1="1200" y1="0"   x2="1440" y2="200" stroke="oklch(0.6 0.12 185)" strokeWidth="0.5" opacity="0.07" />

        {/* Hairline diagonal — bottom-left corner sweep */}
        <line x1="340"   y1="900" x2="0"    y2="610" stroke="oklch(0.6 0.12 185)" strokeWidth="0.5" opacity="0.1" />
        <line x1="240"   y1="900" x2="0"    y2="710" stroke="oklch(0.6 0.12 185)" strokeWidth="0.5" opacity="0.07" />

        {/* Corner bracket — top-right */}
        <path d="M 1390 12 L 1428 12 L 1428 48" fill="none" stroke="oklch(0.6 0.12 185)"
              strokeWidth="1" strokeLinecap="round" opacity="0.2" />
        {/* Corner bracket — bottom-left */}
        <path d="M 50 888 L 12 888 L 12 852" fill="none" stroke="oklch(0.6 0.12 185)"
              strokeWidth="1" strokeLinecap="round" opacity="0.2" />
      </svg>
    </div>
  );
}

