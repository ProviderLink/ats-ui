export interface JobFact {
  label: string;
  value: string;
}

export function JobFacts({ facts }: { facts: JobFact[] }) {
  return (
    <dl className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] overflow-hidden rounded-2xl border border-white/15">
      {facts.map(({ label, value }) => (
        <div
          key={label}
          className="flex flex-col gap-1 p-4 shadow-[0_0_0_0.5px_rgba(255,255,255,0.15)]"
        >
          <dt className="text-xs uppercase tracking-wide text-white/50">
            {label}
          </dt>
          <dd className="text-base font-medium text-white">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
