import { Button } from '@/components/ui/button';
import { ArrowRightLeftIcon, BanIcon, CalendarIcon, GitCommitHorizontalIcon, MailIcon, StarIcon, UserCheckIcon } from 'lucide-react';
import { AddToAnotherJobButton } from './add-to-another-job-button';

interface ApprovedActionsBarProps {
  inTalentPool: boolean;
  loading: boolean;
  hasActiveApp: boolean;
  hasStages: boolean;
  hasOpenJobs: boolean;
  onMoveStage: () => void;
  onSchedule: () => void;
  onHire: () => void;
  onEmail: () => void;
  onTalentPool: () => void;
  onChangeJob: () => void;
  onAddJob: () => void;
  onReject: () => void;
}

/**
 * Ordered so the everyday pipeline actions lead and the two
 * destructive/irreversible ones trail.
 */
export function ApprovedActionsBar({
  inTalentPool,
  loading,
  hasActiveApp,
  hasStages,
  hasOpenJobs,
  onMoveStage,
  onSchedule,
  onHire,
  onEmail,
  onTalentPool,
  onChangeJob,
  onAddJob,
  onReject,
}: ApprovedActionsBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          size="sm"
          variant="outline"
          disabled={loading || !hasActiveApp || !hasStages}
          className="h-8 gap-1.5"
          onClick={onMoveStage}
        >
          <GitCommitHorizontalIcon className="size-3.5" />
          Move Stage
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={loading || !hasActiveApp}
          className="h-8 gap-1.5"
          onClick={onSchedule}
        >
          <CalendarIcon className="size-3.5" />
          Schedule Interview
        </Button>
        {/* Hire — the expected end state, so it carries the emerald
            treatment the pending footer gives Approve. */}
        <Button
          size="sm"
          variant="outline"
          disabled={loading || !hasActiveApp}
          className="h-8 gap-1.5 border-emerald-400 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:border-emerald-700/40 dark:bg-emerald-950/30 dark:text-emerald-300"
          onClick={onHire}
        >
          <UserCheckIcon className="size-3.5" />
          Hire
        </Button>
      </div>

      <span className="mx-0.5 h-5 w-px shrink-0 bg-border" />

      <div className="flex flex-wrap items-center gap-1.5">
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
        {/* Change Job — replaces the current job on this application */}
        <Button
          size="sm"
          variant="outline"
          disabled={loading || !hasActiveApp || !hasOpenJobs}
          className="h-8 gap-1.5"
          onClick={onChangeJob}
        >
          <ArrowRightLeftIcon className="size-3.5" />
          Change Job
        </Button>
        <AddToAnotherJobButton
          disabled={loading || !hasOpenJobs}
          hasOpenJobs={hasOpenJobs}
          onClick={onAddJob}
        />
      </div>

      <span className="mx-0.5 h-5 w-px shrink-0 bg-border" />

      {/* Reject — last, and the only destructive action here */}
      <Button
        size="sm"
        variant="outline"
        disabled={loading || !hasActiveApp}
        className="h-8 gap-1.5 border-red-300 bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800 dark:border-input dark:bg-input/30 dark:text-destructive dark:hover:bg-destructive/10"
        onClick={onReject}
      >
        <BanIcon className="size-3.5" />
        Reject
      </Button>
    </div>
  );
}
