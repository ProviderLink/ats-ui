import { cn } from '@/lib/utils';
import type { ApplicationPhase } from '@/store/types';
import { PHASE_FILTERS } from '../../_utils/job-candidates';

interface PhaseFilterChipsProps {
  value: ApplicationPhase;
  counts: Record<ApplicationPhase, number>;
  onChange: (phase: ApplicationPhase) => void;
}

export function PhaseFilterChips({
  value,
  counts,
  onChange,
}: PhaseFilterChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {PHASE_FILTERS.map(f => {
        const active = value === f.key;
        return (
          <button
            key={f.key}
            type="button"
            onClick={() => onChange(f.key)}
            className={cn(
              'inline-flex items-center gap-1.5 h-7 rounded-full border px-2.5 text-xs transition-colors',
              active
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-muted-foreground hover:bg-accent'
            )}
          >
            {f.label}
            <span
              className={cn(
                'text-[10px] font-semibold tabular-nums rounded-full px-1.5 py-px leading-none',
                active
                  ? 'bg-primary/15 text-primary'
                  : 'bg-muted text-muted-foreground/80'
              )}
            >
              {counts[f.key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
