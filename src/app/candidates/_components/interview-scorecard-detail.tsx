/**
 * Read-only detail view of a single interview scorecard.
 *
 * Container: Dialog (J7 — a Sheet inside the already-open candidate-profile
 * Sheet would nest awkwardly; Dialog is the established modal pattern in
 * this codebase and is used by `ConfirmDialog`).
 */
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';
import type { InterviewScorecard } from '@/store/types/interview-scorecard.types';
import { PencilIcon } from 'lucide-react';
import { ScoreSummary } from './interview-scorecard-detail/overall-score';
import { ScoreBreakdown } from './interview-scorecard-detail/score-breakdown';
import { ScorecardCategories } from './interview-scorecard-detail/scorecard-categories';
import { ScorecardNotes } from './interview-scorecard-detail/scorecard-notes';

interface InterviewScorecardDetailProps {
  scorecard: InterviewScorecard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Human-readable job title for display. */
  jobTitle?: string | null;
  /** Client the job belongs to. */
  clientName?: string | null;
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
  clientName,
  interviewerName,
  onEdit,
}: InterviewScorecardDetailProps) {
  if (!sc) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 border-b px-6 py-4 pr-14">
          <DialogTitle>Interview scorecard</DialogTitle>
          <DialogDescription>
            Initial screening · {formatDate(sc.interviewDate)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">
          <ScoreSummary
            sc={sc}
            jobTitle={jobTitle}
            clientName={clientName}
            interviewerName={interviewerName}
          />
          <ScoreBreakdown sc={sc} />
          <ScorecardCategories sc={sc} />
          <ScorecardNotes sc={sc} />
        </div>

        <DialogFooter className="shrink-0 border-t px-6 py-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {onEdit && (
            <Button onClick={onEdit}>
              <PencilIcon className="size-3.5" /> Edit scorecard
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
