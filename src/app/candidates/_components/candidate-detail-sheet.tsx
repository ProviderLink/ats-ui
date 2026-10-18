import { ComposeEmailSheet } from '@/app/emails/_components/compose-email-sheet';
import { RestoreCandidateDialog } from '@/components/restore-candidate-dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useCandidateEmailActivity } from '@/hooks/use-candidate-email-activity';
import { useApplicationStore } from '@/store/slices/applications.store';
import type { Candidate } from '@/store/types';
import { useCandidateApplications } from '../_hooks/use-candidate-applications';
import { useCandidateCompose } from '../_hooks/use-candidate-compose';
import { useCandidateInterviews } from '../_hooks/use-candidate-interviews';
import { useCandidateLookups } from '../_hooks/use-candidate-lookups';
import { useCandidatePipelineActions } from '../_hooks/use-candidate-pipeline-actions';
import { useCandidateTagEditing } from '../_hooks/use-candidate-tag-editing';
import { useCandidateReviewActions } from '../_hooks/use-candidate-review-actions';
import { useIneligibleActions } from '../_hooks/use-ineligible-actions';
import { useInterviewActions } from '../_hooks/use-interview-actions';
import { useLatestCandidate } from '../_hooks/use-latest-candidate';
import { usePipelineNotes } from '../_hooks/use-pipeline-notes';
import { CandidateDetailBody } from './candidate-detail-body';
import { CandidatePipelineDialogs } from './candidate-pipeline-dialogs';
import { CandidateReviewDialogs } from './candidate-review-dialogs';
import { CandidateSheetFooter } from './candidate-sheet-footer';
import { CandidateSheetHeader } from './candidate-sheet-header';
import { DeleteCandidateDialog } from './delete-candidate-dialog';
import { RescheduleDialog } from './reschedule-dialog';

interface CandidateDetailSheetProps {
  candidate: Candidate | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mutating?: boolean;
}

export function CandidateDetailSheet({
  candidate,
  open,
  onOpenChange,
  mutating = false,
}: CandidateDetailSheetProps) {
  const c = useLatestCandidate(candidate);
  const fullName = c ? `${c.firstName} ${c.lastName}` : '';
  const appLoading = useApplicationStore(s => s.loading);
  const appMutating = useApplicationStore(s => s.mutating);
  const { allTags, updateTags } = useCandidateTagEditing(c, open);

  const { jobs, users, openJobs, getJobTitle, getClientName } =
    useCandidateLookups();
  const {
    candidateApplications,
    heldJobIds,
    pendingApplication,
    activePipelineApp,
    otherLiveApplicationCount,
    pipelineJob,
  } = useCandidateApplications(candidate);
  const { candidateInterviews, refreshInterviews, fetchScorecardsByCandidate } =
    useCandidateInterviews(open, candidate, activePipelineApp);
  const interviewActions = useInterviewActions(
    activePipelineApp,
    refreshInterviews
  );
  const compose = useCandidateCompose(
    open,
    c,
    fullName,
    pendingApplication,
    { jobs, getJobTitle, getClientName }
  );
  const review = useCandidateReviewActions(
    candidate,
    fullName,
    pendingApplication,
    candidateApplications,
    compose.openCompose
  );
  const pipeline = useCandidatePipelineActions(
    candidate,
    fullName,
    activePipelineApp,
    pipelineJob,
    jobs,
    refreshInterviews
  );
  const ineligible = useIneligibleActions(candidate, fullName, () =>
    onOpenChange(false)
  );
  const notes = usePipelineNotes(activePipelineApp);
  const emailActivity = useCandidateEmailActivity(c?._id);

  if (!candidate || !c) return null;

  const appliedJobTitle = c.appliedJobId ? getJobTitle(c.appliedJobId) : null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="flex flex-col p-0 max-w-none! w-full sm:w-[68vw] min-w-95"
        >
          <CandidateSheetHeader
            candidate={c}
            fullName={fullName}
            allTags={allTags}
            onUpdateTags={updateTags}
          />

          <CandidateDetailBody
            candidate={c}
            applications={candidateApplications}
            applicationsLoading={appLoading}
            lookups={{ jobs, users, getJobTitle, getClientName }}
            interviews={candidateInterviews}
            interviewActions={interviewActions}
            activePipelineApp={activePipelineApp}
            pipelineJob={pipelineJob}
            notes={notes}
            emailActivity={emailActivity}
            onScorecardCreated={() => void fetchScorecardsByCandidate(c._id)}
          />

          <div className="shrink-0 border-t px-6 py-4">
            <CandidateSheetFooter
              candidate={c}
              mutating={mutating}
              appMutating={appMutating}
              review={review}
              pipeline={pipeline}
              ineligible={ineligible}
              hasActiveApp={!!activePipelineApp}
              hasStages={(pipelineJob?.pipeline?.stages?.length ?? 0) > 0}
              hasOpenJobs={openJobs.length > 0}
              onEmail={() => compose.openCompose(null)}
              onClose={() => onOpenChange(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <CandidateReviewDialogs
        candidate={candidate}
        fullName={fullName}
        appliedJobId={c.appliedJobId}
        appliedJobTitle={appliedJobTitle}
        openJobs={openJobs}
        hasOtherLiveApplication={otherLiveApplicationCount > 0}
        review={review}
      />

      <ComposeEmailSheet
        open={compose.composeOpen}
        onOpenChange={compose.handleComposeOpenChange}
        mode={compose.buildMode() ?? undefined}
      />

      <RescheduleDialog
        open={interviewActions.rescheduleOpen}
        onClose={interviewActions.closeReschedule}
        onConfirm={interviewActions.confirmReschedule}
        interviewTitle={interviewActions.rescheduleInterview?.title ?? ''}
        currentDate={interviewActions.rescheduleInterview?.scheduledAt ?? ''}
        currentTimezone={interviewActions.rescheduleInterview?.timezone}
        loading={review.actionLoading}
      />

      <CandidatePipelineDialogs
        fullName={fullName}
        inTalentPool={c.inTalentPool}
        appliedJobTitle={appliedJobTitle}
        activePipelineApp={activePipelineApp}
        pipelineJob={pipelineJob}
        jobs={jobs}
        openJobs={openJobs}
        users={users}
        heldJobIds={heldJobIds}
        hasOtherLiveApplication={otherLiveApplicationCount > 0}
        pipeline={pipeline}
      />

      <RestoreCandidateDialog
        candidate={
          c.eligibilityStatus === 'permanently_ineligible' &&
          ineligible.restoreOpen
            ? c
            : null
        }
        jobs={ineligible.restoreJobs}
        blockedJobIds={heldJobIds}
        submitting={ineligible.loading}
        onClose={() => ineligible.setRestoreOpen(false)}
        onConfirm={ineligible.handleRestoreConfirm}
      />

      <DeleteCandidateDialog
        open={ineligible.deleteOpen}
        onOpenChange={ineligible.setDeleteOpen}
        candidateName={fullName}
        loading={ineligible.loading}
        onConfirm={ineligible.handleDeleteConfirm}
      />
    </>
  );
}
