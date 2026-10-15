import { Button } from '@/components/ui/button';
import { MailIcon, StarIcon } from 'lucide-react';
import { AddToAnotherJobButton } from './add-to-another-job-button';
import { CandidateCrmButton } from './candidate-crm-button';

interface HiredActionsBarProps {
  candidateId: string;
  inTalentPool: boolean;
  loading: boolean;
  hasOpenJobs: boolean;
  onEmail: () => void;
  onTalentPool: () => void;
  onAddJob: () => void;
}

export function HiredActionsBar({
  candidateId,
  inTalentPool,
  loading,
  hasOpenJobs,
  onEmail,
  onTalentPool,
  onAddJob,
}: HiredActionsBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <Button
        size="sm"
        variant="outline"
        disabled={loading}
        className="h-8 gap-1.5"
        onClick={onEmail}
      >
        <MailIcon className="size-3.5" />
        Email
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={loading}
        className="h-8 gap-1.5"
        onClick={onTalentPool}
      >
        <StarIcon className="size-3.5" />
        {inTalentPool ? 'Remove from Pool' : 'Add to Pool'}
      </Button>
      <CandidateCrmButton candidateId={candidateId} candidateStatus="hired" />
      <AddToAnotherJobButton
        disabled={loading || !hasOpenJobs}
        hasOpenJobs={hasOpenJobs}
        onClick={onAddJob}
      />
    </div>
  );
}
