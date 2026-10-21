import type { computeScorecardPreview } from '@/store/types/interview-scorecard.types';
import { CATEGORY_WEIGHTS } from '@/store/types/interview-scorecard.types';
import { cn } from '@/lib/utils';
import { CheckIcon } from 'lucide-react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useRatedState } from '../../_hooks/use-rated-state';
import type { ScorecardFormValues } from '../../_utils/scorecard-form';

type Scores = ReturnType<typeof computeScorecardPreview>;

const CATEGORIES = [
  { key: 'communication', id: 'sc-communication', label: 'Communication' },
  { key: 'experience', id: 'sc-experience', label: 'Experience' },
  { key: 'professionalism', id: 'sc-professionalism', label: 'Professionalism' },
  { key: 'technology', id: 'sc-technology', label: 'Tech setup' },
  { key: 'availability', id: 'sc-availability', label: 'Availability' },
] as const;

/** Sticky progress strip: one chip per category, tap to jump to it. */
export function ScoreStrip({ scores }: { scores: Scores }) {
  const rated = useRatedState();

  return (
    <nav
      aria-label="Scorecard sections"
      className="sticky top-0 z-10 -mx-5 flex gap-2 overflow-x-auto border-b bg-background/90 px-5 py-2.5 backdrop-blur"
    >
      {CATEGORIES.map(c => {
        const weighted = scores[`${c.key}Weighted` as const];
        const weight = CATEGORY_WEIGHTS[c.key];
        return (
          <button
            key={c.key}
            type="button"
            onClick={() =>
              document
                .getElementById(c.id)
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
            className="flex min-w-[6.5rem] flex-1 flex-col gap-1.5 rounded-lg border bg-card px-2.5 py-2 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span className="flex items-center justify-between gap-1 text-[11px] font-medium">
              <span className="truncate">{c.label}</span>
              {rated[c.key] && <CheckIcon className="size-3 shrink-0 text-primary" />}
            </span>
            <span className="h-1 overflow-hidden rounded-full bg-muted">
              <span
                className={cn(
                  'block h-full rounded-full transition-all',
                  rated[c.key] ? 'bg-primary' : 'bg-muted-foreground/30'
                )}
                style={{ width: `${(weighted / weight) * 100}%` }}
              />
            </span>
          </button>
        );
      })}
    </nav>
  );
}

/** Footer hint: how many required items (5 ratings + recommendation) are open. */
export function CompletionHint() {
  const rated = useRatedState();
  const { control } = useFormContext<ScorecardFormValues>();
  const recommendation = useWatch({ control, name: 'finalRecommendation' });
  const missing =
    CATEGORIES.filter(c => !rated[c.key]).length + (recommendation ? 0 : 1);
  return (
    <p className="text-xs text-muted-foreground">
      {missing === 0
        ? 'Ready to submit'
        : `${missing} required ${missing === 1 ? 'item' : 'items'} left: ratings and final recommendation`}
    </p>
  );
}
