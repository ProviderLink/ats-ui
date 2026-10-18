import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { StarIcon } from 'lucide-react';
import { Controller, useFormContext } from 'react-hook-form';
import type { ScorecardFormValues } from '../../_utils/scorecard-form';

type RatingName =
  | 'commEnglishDiction'
  | 'commEnglishComprehension'
  | 'experienceRating'
  | 'professionalismRating'
  | 'technologyRating'
  | 'availabilityRating';

interface RatingRowProps {
  label: string;
  name: RatingName;
}

export function RatingRow({ label, name }: RatingRowProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext<ScorecardFormValues>();
  const error = errors[name]?.message;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <ToggleGroup
              type="single"
              value={String(field.value ?? 0)}
              onValueChange={(v: string) => field.onChange(Number(v ?? 0))}
              className="flex items-center gap-1"
            >
              {[1, 2, 3, 4, 5].map(i => (
                <ToggleGroupItem
                  key={i}
                  value={String(i)}
                  aria-label={`${i} star`}
                  className={cn(
                    'size-8 p-0',
                    Number(field.value ?? 0) >= i &&
                      'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:border-amber-700/40 dark:text-amber-300'
                  )}
                >
                  <StarIcon
                    className={cn(
                      'size-4',
                      Number(field.value ?? 0) >= i
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground/40'
                    )}
                  />
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}
        />
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    </div>
  );
}
