import { cn } from '@/lib/utils';
import { StarIcon } from 'lucide-react';
import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import type { ScorecardFormValues } from '../../_utils/scorecard-form';

type RatingName =
  | 'commEnglishDiction'
  | 'commEnglishComprehension'
  | 'experienceRating'
  | 'professionalismRating'
  | 'technologyRating'
  | 'availabilityRating';

const WORDS = ['Not rated', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

interface RatingRowProps {
  label: string;
  name: RatingName;
}

/** 1–5 star radio group with a live word label; arrow keys adjust the value. */
export function RatingRow({ label, name }: RatingRowProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext<ScorecardFormValues>();
  const [hover, setHover] = useState(0);
  const error = errors[name]?.message;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const value = Number(field.value ?? 0);
        const shown = hover || value;
        const set = (n: number) => field.onChange(Math.min(5, Math.max(1, n)));

        return (
          <div className="flex flex-col gap-1">
            <div className="flex flex-col gap-2 @md:flex-row @md:items-center @md:justify-between">
              <span className="text-sm font-medium">{label}</span>
              <div
                role="radiogroup"
                aria-label={label}
                aria-invalid={!!error}
                className="flex items-center gap-3"
                onMouseLeave={() => setHover(0)}
                onKeyDown={e => {
                  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    set(value + 1);
                  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    set(value - 1);
                  }
                }}
              >
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map(i => (
                    <button
                      key={i}
                      type="button"
                      role="radio"
                      aria-checked={value === i}
                      aria-label={`${i} of 5 — ${WORDS[i]}`}
                      tabIndex={value === i || (value === 0 && i === 1) ? 0 : -1}
                      onClick={() => set(i)}
                      onMouseEnter={() => setHover(i)}
                      className="rounded-md p-1 outline-none transition-transform hover:scale-110 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      <StarIcon
                        className={cn(
                          'size-6 transition-colors',
                          shown >= i
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-muted-foreground/30'
                        )}
                      />
                    </button>
                  ))}
                </div>
                <span
                  className={cn(
                    'w-[4.5rem] text-xs',
                    shown ? 'font-medium text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {WORDS[shown]}
                </span>
              </div>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        );
      }}
    />
  );
}
