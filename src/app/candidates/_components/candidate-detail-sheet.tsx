import { ComposeEmailSheet } from '@/app/emails/_components/compose-email-sheet';
import { LockableRegion } from '@/components/profile-lock';
import { ProfileLockContext } from '@/lib/profile-lock-context';
import { LockIcon } from 'lucide-react';
import { RestoreCandidateDialog } from '@/components/restore-candidate-dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useCandidateEmailActivity } from '@/hooks/use-candidate-email-activity';
import { useApplicationStore } from '@/store/slices/applications.store';
import { cn } from '@/lib/utils';
import type { Candidate } from '@/store/types';
import { useState } from 'react';
import { useCandidateApplications } from '../_hooks/use-candidate-applications';
import { useCandidateCompose } from '../_hooks/use-candidate-compose';
import { useCandidateInterviews } from '../_hooks/use-candidate-interviews';
import { useCandidateLookups } from '../_hooks/use-candidate-lookups';
import { useCandidatePipelineActions } from '../_hooks/use-candidate-pipeline-actions';
import { useCandidateTagEditing } from '../_hooks/use-candidate-tag-editing';
import { useCandidateReviewActions } from '../_hooks/use-candidate-review-actions';
import { useIneligibleSheetActions } from '../_hooks/use-ineligible-sheet-actions';
import { useInterviewActions } from '../_hooks/use-interview-actions';
import { useLoadFullCandidate } from '@/hooks/use-load-full-candidate';
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
  useLoadFullCandidate(candidate?._id, open);
  // True while the interview scorecard form is docked beside this sheet.
  const [scorecardFormOpen, setScorecardFormOpen] = useState(false);
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
  const ineligible = useIneligibleSheetActions(candidate, () =>
    onOpenChange(false)
  );
  const notes = usePipelineNotes(activePipelineApp);
  const emailActivity = useCandidateEmailActivity(c?._id);

  if (!candidate || !c) return null;

  const appliedJobTitle = c.appliedJobId ? getJobTitle(c.appliedJobId) : null;

  return (
    <ProfileLockContext.Provider value={scorecardFormOpen}>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          // The form's own Cancel is the only way out while it is open.
          showCloseButton={!scorecardFormOpen}
          // While the scorecard form is open (lg+), shrink to the left half so
          // the profile and the form are visible and usable together.
          className={cn(
            'flex flex-col p-0 max-w-none! w-full sm:w-[68vw] min-w-95',
            scorecardFormOpen &&
              'lg:w-[45vw] lg:data-[side=right]:right-[calc(50vw+1.75rem)]'
          )}
          // The docked form is not part of this sheet's DOM; keep outside
          // clicks (e.g. the backdrop) from closing the sheet and losing the draft.
          onInteractOutside={e => {
            if (scorecardFormOpen) e.preventDefault();
          }}
        >
          <CandidateSheetHeader
            candidate={c}
            fullName={fullName}
            allTags={allTags}
            onUpdateTags={updateTags}
          />

          {scorecardFormOpen && (
            <p className="flex shrink-0 items-center gap-2 border-b bg-muted/50 px-6 py-2 text-xs text-muted-foreground">
              <LockIcon className="size-3.5" />
              Scorecard in progress — this profile is read-only until you submit or
              cancel.
            </p>
          )}

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
            onScorecardFormOpenChange={setScorecardFormOpen}
          />

          <LockableRegion className="shrink-0 border-t px-6 py-4">
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
          </LockableRegion>
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
    </ProfileLockContext.Provider>
  );
}
