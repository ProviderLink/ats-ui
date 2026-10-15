import { ChangeJobDialog } from '@/components/change-job-dialog';
import { HireCandidateDialog } from '@/components/hire-candidate-dialog';
import { MoveStageDialog } from '@/components/move-stage-dialog';
import { RejectDialog } from '@/components/reject-dialog';
import { ScheduleInterviewDialog } from '@/components/schedule-interview-dialog';
import { TalentPoolToggleDialog } from '@/components/talent-pool-toggle-dialog';
import type { Application, Job } from '@/store/types';
import type { useCandidatePipelineActions } from '../_hooks/use-candidate-pipeline-actions';
import { buildChangeJobOptions } from '../_utils/build-change-job-options';

interface CandidatePipelineDialogsProps {
  fullName: string;
  inTalentPool: boolean;
  appliedJobTitle: string | null;
  activePipelineApp: Application | null;
  pipelineJob: Job | null;
  jobs: Job[];
  openJobs: { _id: string; title: string }[];
  users: { _id: string; firstName: string; lastName: string }[];
  heldJobIds: Set<string>;
  hasOtherLiveApplication: boolean;
  pipeline: ReturnType<typeof useCandidatePipelineActions>;
}

/** Dialogs behind the pipeline footer: stage, hire, reject, schedule, jobs, pool. */
export function CandidatePipelineDialogs({
  fullName,
  inTalentPool,
  appliedJobTitle,
  activePipelineApp,
  pipelineJob,
  jobs,
  openJobs,
  users,
  heldJobIds,
  hasOtherLiveApplication,
  pipeline,
}: CandidatePipelineDialogsProps) {
  const stages = pipelineJob?.pipeline?.stages;

  return (
    <>
      <ScheduleInterviewDialog
        open={pipeline.scheduleOpen}
        onClose={() => pipeline.setScheduleOpen(false)}
        onConfirm={pipeline.handleScheduleInterview}
        candidateName={fullName}
        job={pipelineJob}
        jobs={openJobs}
        users={users}
        loading={pipeline.pipelineLoading}
      />

      {stages && (
        <MoveStageDialog
          open={pipeline.stageOpen}
          onOpenChange={pipeline.setStageOpen}
          candidateName={fullName}
          stages={stages}
          selectedStageId={pipeline.selectedStageId}
          onSelectedStageIdChange={pipeline.setSelectedStageId}
          currentStageId={activePipelineApp?.currentStage?.stageId}
          loading={pipeline.pipelineLoading}
          onConfirm={pipeline.handleMoveStage}
        />
      )}

      <HireCandidateDialog
        open={pipeline.hireOpen}
        onOpenChange={pipeline.setHireOpen}
        candidateName={fullName}
        jobTitle={pipelineJob?.title}
        loading={pipeline.pipelineLoading}
        onConfirm={pipeline.handleHire}
      />

      {/* Pipeline reject — structured reason + destination. Destination is
          offered only when this is the candidate's last live application
          (otherwise it is hidden inside the dialog). */}
      <RejectDialog
        open={pipeline.rejectOpen}
        onOpenChange={pipeline.setRejectOpen}
        candidateName={fullName}
        jobTitle={pipelineJob?.title ?? undefined}
        currentStageName={activePipelineApp?.currentStage?.stageName}
        hasOtherLiveApplication={hasOtherLiveApplication}
        submitting={pipeline.pipelineLoading}
        onConfirm={pipeline.handleReject}
      />

      {/* Job & Stage — change the job on this application, or add another */}
      <ChangeJobDialog
        open={pipeline.changeJobOpen}
        onOpenChange={pipeline.setChangeJobOpen}
        mode={pipeline.jobDialogMode}
        candidateName={fullName}
        currentJobTitle={pipelineJob?.title ?? appliedJobTitle ?? undefined}
        currentJobId={activePipelineApp?.jobId}
        jobs={buildChangeJobOptions({
          openJobs,
          jobs,
          heldJobIds,
          mode: pipeline.jobDialogMode,
          currentJobId: activePipelineApp?.jobId,
        })}
        submitting={pipeline.pipelineLoading}
        onConfirm={
          pipeline.jobDialogMode === 'change'
            ? pipeline.handleChangeJob
            : pipeline.handleAddJob
        }
      />

      <TalentPoolToggleDialog
        open={pipeline.talentPoolConfirmOpen}
        onOpenChange={pipeline.setTalentPoolConfirmOpen}
        candidateName={fullName}
        inTalentPool={inTalentPool}
        loading={pipeline.pipelineLoading}
        onConfirm={pipeline.handleTalentPoolToggle}
      />
    </>
  );
}
