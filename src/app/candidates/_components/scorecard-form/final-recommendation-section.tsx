import { cn } from '@/lib/utils';
import {
  FINAL_RECOMMENDATION_BADGE_CLASS,
  FINAL_RECOMMENDATION_LABELS,
} from '@/store/types/interview-scorecard.types';
import { SparklesIcon } from 'lucide-react';
import { Controller, useFormContext } from 'react-hook-form';
import {
  RECOMMENDATION_OPTIONS,
  type ScorecardFormValues,
} from '../../_utils/scorecard-form';
import { SectionCard } from './section-card';

export function FinalRecommendationSection() {
  const {
    control,
    formState: { errors },
  } = useFormContext<ScorecardFormValues>();
  const error = errors.finalRecommendation?.message;

  return (
    <SectionCard
      id="sc-recommendation"
      icon={SparklesIcon}
      title="Final recommendation"
      subtitle="Required to submit"
      className={cn(error && 'border-destructive/50')}
    >
      <Controller
        control={control}
        name="finalRecommendation"
        render={({ field }) => (
          <div
            role="radiogroup"
            aria-label="Final recommendation"
            aria-invalid={!!error}
            className="grid grid-cols-1 gap-2 @md:grid-cols-2"
          >
            {RECOMMENDATION_OPTIONS.map(r => {
              const selected = field.value === r;
              return (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => field.onChange(r)}
                  className={cn(
                    'rounded-lg border px-3 py-2.5 text-left text-sm outline-none transition-all focus-visible:ring-[3px] focus-visible:ring-ring/50',
                    selected
                      ? cn(
                          'font-medium ring-2 ring-current/20',
                          FINAL_RECOMMENDATION_BADGE_CLASS[r]
                        )
                      : 'bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  {FINAL_RECOMMENDATION_LABELS[r]}
                </button>
              );
            })}
          </div>
        )}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </SectionCard>
  );
}
