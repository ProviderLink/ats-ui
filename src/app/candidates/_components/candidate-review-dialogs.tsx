import { RejectDialog } from '@/components/reject-dialog';
import type { Candidate } from '@/store/types';
import type { useCandidateReviewActions } from '../_hooks/use-candidate-review-actions';
import { ApproveCandidateDialog } from './approve-candidate-dialog';
import { TalentPoolDialog } from './talent-pool-dialog';

interface CandidateReviewDialogsProps {
  /** The prop snapshot, which decides whether an approval creates the application. */
  candidate: Candidate;
  fullName: string;
  appliedJobId?: string | null;
  appliedJobTitle: string | null;
  openJobs: { _id: string; title: string }[];
  hasOtherLiveApplication: boolean;
  review: ReturnType<typeof useCandidateReviewActions>;
}

/** Dialogs behind the In Review footer: talent pool, approve, reject. */
export function CandidateReviewDialogs({
  candidate,
  fullName,
  appliedJobId,
  appliedJobTitle,
  openJobs,
  hasOtherLiveApplication,
  review,
}: CandidateReviewDialogsProps) {
  return (
    <>
      <TalentPoolDialog
        open={review.talentPoolOpen}
        onClose={() => review.setTalentPoolOpen(false)}
        onConfirm={review.handleAddToTalentPool}
      />

      <ApproveCandidateDialog
        open={review.approveOpen}
        onOpenChange={review.handleApproveOpenChange}
        variant={review.approveVariant}
        isPending={candidate.status === 'pending'}
        candidateName={fullName}
        appliedJobId={appliedJobId}
        appliedJobTitle={appliedJobTitle}
        openJobs={openJobs}
        selectedJobId={review.approveJobId}
        onSelectedJobIdChange={review.setApproveJobId}
        loading={review.actionLoading}
        onConfirm={review.handleApproveConfirm}
      />

      {/* Reject (In Review) — structured reason + destination.
          No application normally exists, so this rejects at candidate level;
          if one does, the handler routes to it instead. */}
      <RejectDialog
        open={review.rejectOpen}
        onOpenChange={review.setRejectOpen}
        candidateName={fullName}
        jobTitle={appliedJobTitle ?? undefined}
        hasOtherLiveApplication={hasOtherLiveApplication}
        submitting={review.actionLoading}
        onConfirm={review.handleRejectConfirm}
      />

      {/* Reject & Email — same flow, then opens the composer. */}
      <RejectDialog
        open={review.rejectEmailOpen}
        onOpenChange={review.setRejectEmailOpen}
        candidateName={fullName}
        jobTitle={appliedJobTitle ?? undefined}
        hasOtherLiveApplication={hasOtherLiveApplication}
        submitting={review.actionLoading}
        onConfirm={review.handleRejectAndEmailConfirm}
      />
    </>
  );
}
