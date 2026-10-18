import { cn } from '@/lib/utils';
import type { Candidate } from '@/store';
import { BanIcon } from 'lucide-react';
import type React from 'react';

interface CandidateCardProps {
  candidate: Candidate;
  onClick?: () => void;
  onDelete?: (e: React.MouseEvent) => void;
}

function scoreClass(score: number) {
  if (score >= 80)
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (score >= 60)
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  if (score >= 40)
    return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
}

export function CandidateCard({
  candidate,
  onClick,
  onDelete,
}: CandidateCardProps) {
  const score = candidate.aiScore?.score ?? 0;
  const yearsExp =
    candidate.yearsOfExperience > 0
      ? `${candidate.yearsOfExperience} yrs exp`
      : '';
  const salaryUsd =
    candidate.currentSalaryUSD != null
      ? `$${(candidate.currentSalaryUSD / 1000).toFixed(candidate.currentSalaryUSD % 1000 === 0 ? 0 : 1)}K/mo`
      : '';
  return (
    <div
      role={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'group relative rounded-lg border bg-background p-3 w-full text-foreground',
        onClick && 'cursor-pointer hover:bg-muted/70 transition-colors'
      )}
    >
      <div className="flex items-start gap-2">
        {score > 0 && (
          <span
            title={`AI fit score: ${score}/100`}
            className={cn(
              'inline-flex items-center justify-center size-8 rounded-tl-md text-[11px] font-bold tabular-nums shrink-0',
              scoreClass(score)
            )}
          >
            {score}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold leading-tight truncate">
            {candidate.firstName} {candidate.lastName}
          </p>
          <p className="text-[10px] text-muted-foreground wrap-break-word mt-0.5">
            {candidate.email}
          </p>
        </div>
      </div>

      {(yearsExp || salaryUsd || onDelete) && (
        <div className="flex items-center gap-1.5 pt-2 mt-2 border-t">
          <span className="text-[11px] text-muted-foreground truncate flex-1 min-w-0">
            {[yearsExp, salaryUsd].filter(Boolean).join(' · ')}
          </span>
          {onDelete && (
            <button
              type="button"
              title="Reject from this job"
              aria-label="Reject this candidate from the job"
              className="shrink-0 inline-flex items-center justify-center size-7 rounded-md border border-red-200 bg-red-50 text-red-500 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400 hover:bg-red-100 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-900/40 dark:hover:text-red-300 focus-visible:ring-2 focus-visible:ring-ring transition-colors"
              onClick={e => {
                e.stopPropagation();
                onDelete(e);
              }}
            >
              <BanIcon className="size-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
