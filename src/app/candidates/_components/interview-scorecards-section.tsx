import { useInterviewScorecardStore } from '@/store/slices/interview-scorecards.store';
import type { InterviewScorecard } from '@/store/types/interview-scorecard.types';
import { useEffect, useState } from 'react';
import type { ScorecardJobOption } from '../_utils/scorecard-form';
import { InterviewScorecardForm } from './interview-scorecard-form';
import { InterviewScorecardHistory } from './interview-scorecard-history';
import { SectionLabel } from './section-label';

interface InterviewScorecardsSectionProps {
  candidateId: string;
  jobOptions: ScorecardJobOption[];
  users: { _id: string; firstName: string; lastName: string }[];
  /** Job preselected in the entry form: the active pipeline application's job. */
  defaultJobId: string | null;
  onCreated: () => void;
  /** Lets the host sheet make room while the entry form is open. */
  onFormOpenChange?: (open: boolean) => void;
}

export function InterviewScorecardsSection({
  candidateId,
  jobOptions,
  users,
  defaultJobId,
  onCreated,
  onFormOpenChange,
}: InterviewScorecardsSectionProps) {
  const scorecardCount = useInterviewScorecardStore(s => s.items.length);
  const [formOpen, setFormOpen] = useState(false);
  // The scorecard currently being edited (null = create mode).
  const [editing, setEditing] = useState<InterviewScorecard | null>(null);

  useEffect(() => {
    onFormOpenChange?.(formOpen);
  }, [formOpen, onFormOpenChange]);
  // Release the host's split layout if the section unmounts with the form open.
  useEffect(() => () => onFormOpenChange?.(false), [onFormOpenChange]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <SectionLabel>Interview Scorecards</SectionLabel>
        <span className="text-xs text-muted-foreground">
          ({scorecardCount})
        </span>
      </div>
      <InterviewScorecardHistory
        candidateId={candidateId}
        jobOptions={jobOptions}
        users={users}
        onAdd={() => {
          setEditing(null);
          setFormOpen(true);
        }}
        onEdit={scorecard => {
          setEditing(scorecard);
          setFormOpen(true);
        }}
      />
      <InterviewScorecardForm
        open={formOpen}
        onOpenChange={open => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        candidateId={candidateId}
        defaultJobId={defaultJobId}
        editing={editing}
        jobOptions={jobOptions}
        onCreated={onCreated}
      />
    </div>
  );
}
