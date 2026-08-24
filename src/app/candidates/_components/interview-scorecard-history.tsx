/**
 * Interview Scorecard history list + section chrome.
 *
 * Renders the "Interview Scorecards" section inside the candidate detail
 * Sheet using the same `SectionLabel` / `Separator` pattern as the
 * existing "Interviews" section (see candidate-detail-sheet.tsx ~line 3102).
 *
 * Visibility condition is enforced by the PARENT (candidate-detail-sheet.tsx
 * gates this section on `candidate.status === 'approved'`). This component
 * itself does NOT re-check the status — keeping the condition in exactly
 * one place per the §7 planning decision.
 */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatDate } from '@/lib/utils';
import { useInterviewScorecardStore } from '@/store/slices/interview-scorecards.store';
import type { InterviewScorecard } from '@/store/types/interview-scorecard.types';
import {
  FINAL_RECOMMENDATION_BADGE_CLASS,
  FINAL_RECOMMENDATION_LABELS,
} from '@/store/types/interview-scorecard.types';
import { ChevronRightIcon, PlusIcon, StarIcon } from 'lucide-react';
import { useState } from 'react';
import { InterviewScorecardDetail } from './interview-scorecard-detail';

interface Props {
  candidateId: string;
  jobOptions: { _id: string; title: string }[];
  users: { _id: string; firstName: string; lastName: string }[];
  onAdd: () => void;
}

export function InterviewScorecardHistory({ jobOptions, users, onAdd }: Props) {
  const scorecards = useInterviewScorecardStore(s => s.items);
  const loading = useInterviewScorecardStore(s => s.loading);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const selected = selectedId
    ? (scorecards.find(s => s._id === selectedId) ?? null)
    : null;

  const resolveJobTitle = (jobId: string) =>
    jobOptions.find(j => j._id === jobId)?.title ?? 'Unknown job';

  const resolveInterviewerName = (interviewerId: string) => {
    const u = users.find(u => u._id === interviewerId);
    return u ? `${u.firstName} ${u.lastName}` : 'Unknown';
  };

  const openDetail = (sc: InterviewScorecard) => {
    setSelectedId(sc._id);
    setDetailOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (scorecards.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          No interview scorecards recorded yet.
        </p>
        <div>
          <Button size="sm" variant="outline" onClick={onAdd}>
            <PlusIcon className="size-3.5 mr-1" /> Add Scorecard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={onAdd}>
          <PlusIcon className="size-3.5 mr-1" /> Add Scorecard
        </Button>
      </div>

      {scorecards.map(sc => (
        <button
          key={sc._id}
          type="button"
          onClick={() => openDetail(sc)}
          className="group rounded-lg border p-4 text-left hover:bg-muted/40 transition-colors flex items-center gap-3"
        >
          <div className="min-w-0 flex-1 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">
                {formatDate(sc.interviewDate)}
              </span>
              <span className="text-xs text-muted-foreground">
                · {resolveJobTitle(sc.jobId)}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  'h-5 text-xs font-medium ml-auto',
                  FINAL_RECOMMENDATION_BADGE_CLASS[sc.finalRecommendation]
                )}
              >
                {FINAL_RECOMMENDATION_LABELS[sc.finalRecommendation]}
              </Badge>
            </div>
            <div className="flex items-center gap-x-3 gap-y-1 text-xs text-muted-foreground flex-wrap">
              <span>
                Interviewer: {resolveInterviewerName(sc.interviewerId)}
              </span>
              <span className="flex items-center gap-1">
                Overall:{' '}
                <span className="font-medium text-foreground">
                  {sc.overallScore.toFixed(1)}/100
                </span>
              </span>
              <span className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon
                    key={i}
                    className={cn(
                      'size-3',
                      i < Math.round((sc.overallScore / 100) * 5)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground/30'
                    )}
                  />
                ))}
              </span>
            </div>
          </div>
          <ChevronRightIcon className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
        </button>
      ))}

      <InterviewScorecardDetail
        scorecard={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        jobTitle={selected ? resolveJobTitle(selected.jobId) : null}
        interviewerName={
          selected ? resolveInterviewerName(selected.interviewerId) : null
        }
      />
    </div>
  );
}
