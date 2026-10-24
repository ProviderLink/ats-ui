import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Candidate } from '@/store/types';
import { getFitConfig } from '@/lib/candidate-styles';

export function AiScoreCell({ candidate }: { candidate: Candidate }) {
  // TYPE 2: job-fit scoring (approved/pipeline candidates)
  const scoring = candidate.aiScore;
  const hasScoring =
    !!scoring && scoring.score != null && scoring.recommendation != null;

  // TYPE 1: candidacy validation / authenticity check (pending candidates)
  const validation = candidate.aiValidation;
  const hasValidation = !!validation && validation.score != null;

  if (hasScoring) {
    const score = scoring.score as number;
    const { recommendation } = scoring;
    const { label } = getFitConfig(recommendation);
    return (
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={cn(
            'inline-flex items-center justify-center size-9 rounded-full text-xs font-bold tabular-nums',
            score >= 80
              ? 'bg-green-200 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : score >= 60
                ? 'bg-amber-200 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                : score >= 40
                  ? 'bg-orange-200 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                  : 'bg-red-200 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          )}
        >
          {score}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-xs text-muted-foreground cursor-default border-b border-dotted border-muted-foreground/40">
              {label}
            </span>
          </TooltipTrigger>
          <TooltipContent className="text-xs max-w-48">
            Score: {score}/100 — {label}
            {scoring.summary && (
              <p className="mt-1 opacity-70">{scoring.summary}</p>
            )}
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  if (validation && hasValidation) {
    const { score, isValid, reason } = validation;
    return (
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={cn(
            'inline-flex items-center justify-center size-9 rounded-full text-xs font-bold tabular-nums',
            isValid
              ? 'bg-green-200 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-200 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          )}
        >
          {score}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-xs text-muted-foreground cursor-default border-b border-dotted border-muted-foreground/40">
              {isValid ? 'Valid' : 'Invalid'}
            </span>
          </TooltipTrigger>
          <TooltipContent className="text-xs max-w-56">
            <p>
              Candidacy: {isValid ? 'Valid' : 'Invalid'} — Score: {score}/100
            </p>
            {reason && <p className="mt-1 opacity-70">{reason}</p>}
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return <span className="text-xs text-muted-foreground">—</span>;
}
