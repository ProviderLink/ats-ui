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
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useInterviewScorecardStore } from '@/store/slices/interview-scorecards.store';
import type { InterviewScorecard } from '@/store/types/interview-scorecard.types';
import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import type { ScorecardJobOption } from '../_utils/scorecard-form';
import { InterviewScorecardCard } from './interview-scorecard-card';
import { InterviewScorecardDetail } from './interview-scorecard-detail';

interface Props {
  candidateId: string;
  jobOptions: ScorecardJobOption[];
  users: { _id: string; firstName: string; lastName: string }[];
  onAdd: () => void;
  /** Triggered when the user requests to edit an existing scorecard. */
  onEdit?: (scorecard: InterviewScorecard) => void;
}

export function InterviewScorecardHistory({
  jobOptions,
  users,
  onAdd,
  onEdit,
}: Props) {
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
        <InterviewScorecardCard
          key={sc._id}
          scorecard={sc}
          jobTitle={resolveJobTitle(sc.jobId)}
          clientName={jobOptions.find(j => j._id === sc.jobId)?.clientName}
          interviewerName={resolveInterviewerName(sc.interviewerId)}
          onOpen={() => openDetail(sc)}
        />
      ))}

      <InterviewScorecardDetail
        scorecard={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        jobTitle={selected ? resolveJobTitle(selected.jobId) : null}
        clientName={
          selected
            ? jobOptions.find(j => j._id === selected.jobId)?.clientName
            : null
        }
        interviewerName={
          selected ? resolveInterviewerName(selected.interviewerId) : null
        }
        onEdit={
          selected
            ? () => {
                setDetailOpen(false);
                onEdit?.(selected);
              }
            : undefined
        }
      />
    </div>
  );
}
