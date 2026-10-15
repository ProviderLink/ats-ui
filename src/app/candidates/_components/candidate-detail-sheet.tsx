import { ComposeEmailSheet } from '@/app/emails/_components/compose-email-sheet';
import { RestoreCandidateDialog } from '@/components/restore-candidate-dialog';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useCandidateEmailActivity } from '@/hooks/use-candidate-email-activity';
import { useApplicationStore } from '@/store/slices/applications.store';
import { useCandidateStore } from '@/store/slices/candidates.store';
import { useTagStore } from '@/store/slices/tags.store';
import type { Candidate } from '@/store/types';
import { useEffect } from 'react';
import { useCandidateApplications } from '../_hooks/use-candidate-applications';
import { useCandidateCompose } from '../_hooks/use-candidate-compose';
import { useCandidateInterviews } from '../_hooks/use-candidate-interviews';
import { useCandidateLookups } from '../_hooks/use-candidate-lookups';
import { useCandidatePipelineActions } from '../_hooks/use-candidate-pipeline-actions';
import { useCandidateReviewActions } from '../_hooks/use-candidate-review-actions';
import { useIneligibleActions } from '../_hooks/use-ineligible-actions';
import { useInterviewActions } from '../_hooks/use-interview-actions';
import { usePipelineNotes } from '../_hooks/use-pipeline-notes';
import { AdditionalInfoSection } from './additional-info-section';
import { AiEvaluationSection } from './ai-evaluation-section';
import { AiValidationSection } from './ai-validation-section';
import { ApplicationsSection } from './applications-section';
import { CandidateActivitySection } from './candidate-activity-section';
import { CandidatePipelineDialogs } from './candidate-pipeline-dialogs';
import { CandidateProfileSections } from './candidate-profile-sections';
import { CandidateReviewDialogs } from './candidate-review-dialogs';
import { CandidateSheetFooter } from './candidate-sheet-footer';
import { CandidateSheetHeader } from './candidate-sheet-header';
import { CrmProfileSection } from './crm-profile-section';
import { DeleteCandidateDialog } from './delete-candidate-dialog';
import { HiredApplicationsSection } from './hired-applications-section';
import { InterviewScorecardsSection } from './interview-scorecards-section';
import { InterviewsSection } from './interviews-section';
import { PipelineNotesSection } from './pipeline-notes-section';
import { RescheduleDialog } from './reschedule-dialog';
import { ResumeAndPortfolioSection } from './resume-and-portfolio-section';

type Props = {
  candidate: Candidate | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mutating?: boolean;
};

export function CandidateDetailSheet({
  candidate,
  open,
  onOpenChange,
  mutating = false,
}: Props) {
  // Read the latest version from the store so save operations are visible
  // immediately. The `candidate` prop is a snapshot from when the sheet
  // opened; `items` and `detail` stay current across mutations.
  const current = useCandidateStore(s => {
    if (!candidate) return undefined;
    return (
      s.detail[candidate._id] ?? s.items.find(i => i._id === candidate._id)
    );
  });
  const c = current ?? candidate;
  const fullName = c ? `${c.firstName} ${c.lastName}` : '';

  const allTags = useTagStore(s => s.items);
  const fetchTags = useTagStore(s => s.fetch);
  const updateCandidate = useCandidateStore(s => s.update);
  const appLoading = useApplicationStore(s => s.loading);
  const appMutating = useApplicationStore(s => s.mutating);

  useEffect(() => {
    if (open) void fetchTags();
  }, [open, fetchTags]);

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

  async function handleUpdateTags(tagIds: string[]) {
    if (!c) return;
    try {
      await updateCandidate(c._id, { tags: tagIds });
    } catch {
      // toast handled by store
    }
  }

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
            onUpdateTags={handleUpdateTags}
          />

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="flex flex-col gap-6">
              <AiValidationSection candidate={c} />
              <AiEvaluationSection candidate={c} />
              <CandidateProfileSections candidate={c} />
              <AdditionalInfoSection candidate={c} />

              <ApplicationsSection
                applications={candidateApplications}
                loading={appLoading}
                jobs={jobs}
                users={users}
                getJobTitle={getJobTitle}
                getClientName={getClientName}
              />

              {c.status === 'approved' && (
                <>
                  <Separator />
                  <InterviewsSection
                    interviews={candidateInterviews}
                    users={users}
                    onComplete={interviewActions.completeInterview}
                    onReschedule={interviewActions.startReschedule}
                    onCancel={interviewActions.cancelScheduledInterview}
                  />
                  <Separator />
                  <InterviewScorecardsSection
                    candidateId={c._id}
                    jobOptions={jobs.map(j => ({
                      _id: j._id,
                      title: j.title,
                    }))}
                    users={users}
                    defaultJobId={pipelineJob?._id ?? null}
                    onCreated={() => void fetchScorecardsByCandidate(c._id)}
                  />
                  <PipelineNotesSection
                    activeApp={activePipelineApp}
                    notesText={notes.notesText}
                    onNotesTextChange={notes.setNotesText}
                    onFocus={notes.seedFromSaved}
                    saving={notes.savingNotes}
                    onSave={notes.saveNotes}
                  />
                </>
              )}

              {c.status === 'hired' && (
                <>
                  <Separator />
                  <HiredApplicationsSection
                    applications={candidateApplications}
                    jobs={jobs}
                    users={users}
                    getClientName={getClientName}
                  />
                </>
              )}

              <Separator />
              <ResumeAndPortfolioSection candidate={c} />
              <CrmProfileSection candidate={c} />

              <Separator />
              <CandidateActivitySection
                candidate={c}
                emailActivity={emailActivity}
              />
            </div>
          </div>

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
