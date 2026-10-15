import { Badge } from '@/components/ui/badge';
import { scoreBarColor, scoreTextColor } from '@/lib/candidate-styles';
import { cn, timeAgo } from '@/lib/utils';
import type { Candidate } from '@/store/types';
import { CheckCircle2Icon, XCircleIcon } from 'lucide-react';
import { SectionLabel } from './section-label';

/** Candidacy authenticity check, shown while the candidate is In Review. */
export function AiValidationSection({ candidate }: { candidate: Candidate }) {
  const { aiScore, aiValidation } = candidate;
  const hasScoring =
    !!aiScore && aiScore.score != null && aiScore.recommendation != null;
  if (
    candidate.status !== 'pending' ||
    !aiValidation ||
    aiValidation.score == null ||
    hasScoring
  ) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>AI Validation</SectionLabel>
      <div className="rounded-xl border bg-muted/30 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {aiValidation.isValid ? (
              <CheckCircle2Icon className="size-5 text-[#3d8a5a]" />
            ) : (
              <XCircleIcon className="size-5 text-destructive" />
            )}
            <span className="text-sm font-semibold">
              {aiValidation.isValid
                ? 'Candidacy Valid'
                : 'Candidacy Invalid'}
            </span>
          </div>
          <span
            className={cn(
              'text-sm font-semibold tabular-nums',
              scoreTextColor(aiValidation.score)
            )}
          >
            {aiValidation.score} / 100
          </span>
          <Badge
            className={cn(
              'bg-transparent font-medium shrink-0',
              aiValidation.isValid
                ? 'text-green-700 dark:text-green-300 border-green-300 dark:border-green-700'
                : 'text-destructive border-destructive/30'
            )}
          >
            {aiValidation.isValid ? 'Valid' : 'Invalid'}
          </Badge>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              scoreBarColor(aiValidation.score)
            )}
            style={{ width: `${aiValidation.score}%` }}
          />
        </div>
        {aiValidation.reason && (
          <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
            {aiValidation.reason}
          </p>
        )}
        {aiValidation.completedAt && (
          <p className="mt-2 text-xs text-muted-foreground">
            Validated {timeAgo(aiValidation.completedAt)}
          </p>
        )}
      </div>
    </div>
  );
}
