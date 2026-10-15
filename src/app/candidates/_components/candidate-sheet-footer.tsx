import { Button } from '@/components/ui/button';
import type { Candidate } from '@/store/types';
import type { useCandidatePipelineActions } from '../_hooks/use-candidate-pipeline-actions';
import type { useCandidateReviewActions } from '../_hooks/use-candidate-review-actions';
import type { useIneligibleActions } from '../_hooks/use-ineligible-actions';
import { ApprovedActionsBar } from './approved-actions-bar';
import { HiredActionsBar } from './hired-actions-bar';
import { IneligibleActions } from './ineligible-actions';
import { PendingActionsToolbar } from './pending-actions-toolbar';

interface CandidateSheetFooterProps {
  candidate: Candidate;
  /** The candidate list is mid-mutation (owned by the parent). */
  mutating: boolean;
  /** Applications are mid-mutation. */
  appMutating: boolean;
  review: ReturnType<typeof useCandidateReviewActions>;
  pipeline: ReturnType<typeof useCandidatePipelineActions>;
  ineligible: ReturnType<typeof useIneligibleActions>;
  hasActiveApp: boolean;
  hasStages: boolean;
  hasOpenJobs: boolean;
  onEmail: () => void;
  onClose: () => void;
}

export function CandidateSheetFooter({
  candidate: c,
  mutating,
  appMutating,
  review,
  pipeline,
  ineligible,
  hasActiveApp,
  hasStages,
  hasOpenJobs,
  onEmail,
  onClose,
}: CandidateSheetFooterProps) {
  const openTalentPoolConfirm = () => pipeline.setTalentPoolConfirmOpen(true);

  // Ineligible candidates have no pipeline and no live application, so every
  // other footer action (approve / reject / stage / hire) is meaningless.
  if (c.eligibilityStatus === 'permanently_ineligible') {
    return (
      <IneligibleActions
        legalHold={!!c.legalHold}
        disabled={ineligible.loading || mutating}
        onToggleLegalHold={ineligible.handleToggleLegalHold}
        onRestore={() => ineligible.setRestoreOpen(true)}
        onDelete={() => ineligible.setDeleteOpen(true)}
      />
    );
  }

  if (c.status === 'pending') {
    return (
      <PendingActionsToolbar
        disabled={review.actionLoading || appMutating}
        onApprove={() => review.openApprove('approve', c.appliedJobId)}
        onApproveAndEmail={() => review.openApprove('email', c.appliedJobId)}
        onApproveEmailAndPool={() =>
          review.openApprove('emailPool', c.appliedJobId)
        }
        onReject={() => review.setRejectOpen(true)}
        onRejectAndEmail={() => review.setRejectEmailOpen(true)}
        onEmail={onEmail}
        onAddToTalentPool={() => review.setTalentPoolOpen(true)}
      />
    );
  }

  if (c.status === 'approved') {
    return (
      <ApprovedActionsBar
        inTalentPool={c.inTalentPool}
        loading={pipeline.pipelineLoading}
        hasActiveApp={hasActiveApp}
        hasStages={hasStages}
        hasOpenJobs={hasOpenJobs}
        onMoveStage={pipeline.openMoveStage}
        onSchedule={() => pipeline.setScheduleOpen(true)}
        onHire={() => pipeline.setHireOpen(true)}
        onEmail={onEmail}
        onTalentPool={openTalentPoolConfirm}
        onChangeJob={() => pipeline.openJobDialog('change')}
        onAddJob={() => pipeline.openJobDialog('add')}
        onReject={() => pipeline.setRejectOpen(true)}
      />
    );
  }

  if (c.status === 'hired') {
    return (
      <HiredActionsBar
        candidateId={c._id}
        inTalentPool={c.inTalentPool}
        loading={pipeline.pipelineLoading}
        hasOpenJobs={hasOpenJobs}
        onEmail={onEmail}
        onTalentPool={openTalentPoolConfirm}
        onAddJob={() => pipeline.openJobDialog('add')}
      />
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">
        Created{' '}
        {new Date(c.createdAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}{' '}
        · {c.source === 'applied' ? 'Applied Directly' : 'Internal Upload'}
      </span>
      <Button variant="outline" className="ml-auto" onClick={onClose}>
        Close
      </Button>
    </div>
  );
}
