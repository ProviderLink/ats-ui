/**
 * Read-only detail view of a single interview scorecard.
 *
 * Container: Dialog (J7 — a Sheet inside the already-open candidate-profile
 * Sheet would nest awkwardly; Dialog is the established modal pattern in
 * this codebase and is used by `ConfirmDialog`).
 */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { cn, formatDate } from '@/lib/utils';
import type { InterviewScorecard } from '@/store/types/interview-scorecard.types';
import {
  FINAL_RECOMMENDATION_BADGE_CLASS,
  FINAL_RECOMMENDATION_LABELS,
} from '@/store/types/interview-scorecard.types';
import { PencilIcon } from 'lucide-react';
import { OverallScore } from './interview-scorecard-detail/overall-score';
import { ScorecardCategories } from './interview-scorecard-detail/scorecard-categories';
import { ScorecardNotes } from './interview-scorecard-detail/scorecard-notes';

interface InterviewScorecardDetailProps {
  scorecard: InterviewScorecard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Human-readable job title for display. */
  jobTitle?: string | null;
  /** Human-readable interviewer name for display. */
  interviewerName?: string | null;
  /** Triggered when the user clicks Edit. */
  onEdit?: () => void;
}

export function InterviewScorecardDetail({
  scorecard: sc,
  open,
  onOpenChange,
  jobTitle,
  interviewerName,
  onEdit,
}: InterviewScorecardDetailProps) {
  if (!sc) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 flex-wrap">
            Interview Scorecard
            <Badge
              variant="outline"
              className={cn(
                'h-5 text-xs font-medium',
                FINAL_RECOMMENDATION_BADGE_CLASS[sc.finalRecommendation]
              )}
            >
              {FINAL_RECOMMENDATION_LABELS[sc.finalRecommendation]}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {formatDate(sc.interviewDate)} · {jobTitle ?? 'Job'} · Interviewer:{' '}
            {interviewerName ?? 'Unknown'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <OverallScore score={sc.overallScore} />
          <ScorecardCategories sc={sc} />
          <Separator />
          <ScorecardNotes sc={sc} />

          <div className="flex justify-end gap-2">
            {onEdit && (
              <Button variant="outline" onClick={onEdit}>
                <PencilIcon className="size-3.5 mr-1" /> Edit
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
