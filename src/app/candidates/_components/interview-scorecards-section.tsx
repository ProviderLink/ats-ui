import { useInterviewScorecardStore } from '@/store/slices/interview-scorecards.store';
import type { InterviewScorecard } from '@/store/types/interview-scorecard.types';
import { useState } from 'react';
import { InterviewScorecardForm } from './interview-scorecard-form';
import { InterviewScorecardHistory } from './interview-scorecard-history';
import { SectionLabel } from './section-label';

interface InterviewScorecardsSectionProps {
  candidateId: string;
  jobOptions: { _id: string; title: string }[];
  users: { _id: string; firstName: string; lastName: string }[];
  /** Job preselected in the entry form: the active pipeline application's job. */
  defaultJobId: string | null;
  onCreated: () => void;
}

export function InterviewScorecardsSection({
  candidateId,
  jobOptions,
  users,
  defaultJobId,
  onCreated,
}: InterviewScorecardsSectionProps) {
  const scorecardCount = useInterviewScorecardStore(s => s.items.length);
  const [formOpen, setFormOpen] = useState(false);
  // The scorecard currently being edited (null = create mode).
  const [editing, setEditing] = useState<InterviewScorecard | null>(null);

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
