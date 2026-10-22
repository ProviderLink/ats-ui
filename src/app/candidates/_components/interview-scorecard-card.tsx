import { Badge } from '@/components/ui/badge';
import { cn, formatDate } from '@/lib/utils';
import type { InterviewScorecard } from '@/store/types/interview-scorecard.types';
import {
  FINAL_RECOMMENDATION_BADGE_CLASS,
  FINAL_RECOMMENDATION_LABELS,
} from '@/store/types/interview-scorecard.types';
import { CalendarIcon, ChevronRightIcon, UserIcon } from 'lucide-react';

interface InterviewScorecardCardProps {
  scorecard: InterviewScorecard;
  jobTitle: string;
  clientName?: string | null;
  interviewerName: string;
  onOpen: () => void;
}

/** One row of the scorecard history: result at a glance, click for details. */
export function InterviewScorecardCard({
  scorecard: sc,
  jobTitle,
  clientName,
  interviewerName,
  onOpen,
}: InterviewScorecardCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex items-center gap-4 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-lg bg-muted">
        <span className="text-lg font-semibold leading-none tabular-nums">
          {sc.overallScore.toFixed(1)}
        </span>
        <span className="mt-1 text-[10px] leading-none text-muted-foreground">
          / 100
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-col gap-0.5">
          <p className="break-words text-sm font-semibold leading-snug">
            {jobTitle}
          </p>
          {clientName && (
            <p className="break-words text-xs text-muted-foreground">
              {clientName}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <Badge
            variant="outline"
            className={cn(
              'h-5 text-xs font-medium',
              FINAL_RECOMMENDATION_BADGE_CLASS[sc.finalRecommendation]
            )}
          >
            {FINAL_RECOMMENDATION_LABELS[sc.finalRecommendation]}
          </Badge>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <UserIcon className="size-3.5 shrink-0" />
            {interviewerName}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarIcon className="size-3.5 shrink-0" />
            {formatDate(sc.interviewDate)}
          </span>
        </div>
      </div>

      <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
