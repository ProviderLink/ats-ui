import { cn } from '@/lib/utils';
import { CheckIcon } from 'lucide-react';

const STEPS = ['Your details', 'Review', 'Submit'];

/** `current` is the zero-based index of the active step. */
export function ApplyStepper({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex items-center gap-3">
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  'flex size-6 items-center justify-center rounded-full border text-xs font-medium',
                  done &&
                    'border-careers-accent bg-careers-accent text-careers',
                  active && 'border-careers-accent text-careers-accent',
                  !done && !active && 'border-white/25 text-white/50'
                )}
              >
                {done ? <CheckIcon className="size-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  active ? 'font-medium text-white' : 'text-white/60'
                )}
              >
                {label}
              </span>
            </span>
            {i < STEPS.length - 1 && <span className="h-px w-8 bg-white/20" />}
          </li>
        );
      })}
    </ol>
  );
}
