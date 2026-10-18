export function ExperienceCell({ years }: { years: number }) {
  const whole = Math.floor(years);
  const hasFraction = years > 0 && years !== whole;
  return (
    <span className="text-sm tabular-nums">
      {whole}
      {hasFraction && <sup className="text-[10px] -top-0.5">+</sup>}{' '}
      <span className="text-muted-foreground">yrs</span>
    </span>
  );
}
