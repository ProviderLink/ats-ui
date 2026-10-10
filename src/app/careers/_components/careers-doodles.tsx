const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 14,
  strokeLinecap: 'round',
} as const;

const POSITIONS = {
  list: {
    asterisk: 'absolute -right-6 top-[22%] w-28',
    scribble: 'absolute bottom-[12%] right-[22%] w-96',
  },
  detail: {
    asterisk: 'absolute -right-8 top-64 w-24 opacity-70',
    scribble: 'absolute right-[16%] top-4 w-64 opacity-40',
  },
};

export function CareersDoodles({
  variant = 'list',
}: {
  variant?: keyof typeof POSITIONS;
}) {
  const pos = POSITIONS[variant];
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden text-careers-accent/90 lg:block"
    >
      <svg viewBox="0 0 140 220" className={pos.asterisk} {...STROKE}>
        <path d="M30 20c18 22 34 44 50 70" />
        <path d="M95 5l8 90" />
        <path d="M10 100l75-8" />
        <path d="M95 105c-6 30-18 60-38 100" />
        <path d="M100 110c12 20 24 50 30 80" />
      </svg>
      <svg
        viewBox="0 0 420 150"
        className={pos.scribble}
        {...STROKE}
        strokeWidth={4}
      >
        <path d="M10 30c80 14 200 40 290 70 30 10 70 24 110 38" />
        <path d="M20 60c70 12 180 34 250 54" />
        <path d="M130 10c60 14 130 28 190 44" />
        <path d="M60 80l70 18" />
      </svg>
    </div>
  );
}
