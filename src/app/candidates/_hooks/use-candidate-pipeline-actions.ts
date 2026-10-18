import type { RejectPayload } from '@/components/reject-dialog';
import type { ScheduleInterviewInput } from '@/components/schedule-interview/schedule-interview-types';
import { logOptimisticActivity } from '@/lib/activity';
import { DEFAULT_TIMEZONE, zonedWallClockToUtc } from '@/lib/timezones';
import { useApplicationStore } from '@/store/slices/applications.store';
import { useCandidateStore } from '@/store/slices/candidates.store';
import { useInterviewStore } from '@/store/slices/interviews.store';
import { useSettingsStore } from '@/store/slices/settings.store';
import type { Application, Candidate, Interview, Job } from '@/store/types';
import { useState } from 'react';
import { toast } from 'sonner';

/**
 * Pipeline actions for an approved candidate (move stage, hire, reject,
 * schedule, change job, talent pool) and the dialog state they drive. They all
 * operate on the candidate's active application.
 */
export function useCandidatePipelineActions(
  candidate: Candidate | null,
  fullName: string,
  activePipelineApp: Application | null,
  pipelineJob: Job | null,
  jobs: Job[],
  refreshInterviews: () => void
) {
  const moveStage = useApplicationStore(s => s.moveStage);
  const hireApp = useApplicationStore(s => s.hire);
  const rejectApp = useApplicationStore(s => s.reject);
  const updateTalentPool = useCandidateStore(s => s.updateTalentPool);
  const assignJob = useCandidateStore(s => s.assignJob);
  const changeJob = useCandidateStore(s => s.changeJob);
  const createInterviewForApplication = useInterviewStore(
    s => s.createForApplication
  );
  const companyTimezone =
    useSettingsStore(s => s.settings)?.companyTimezone || DEFAULT_TIMEZONE;

  const [stageOpen, setStageOpen] = useState(false);
  const [hireOpen, setHireOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [changeJobOpen, setChangeJobOpen] = useState(false);
  const [jobDialogMode, setJobDialogMode] = useState<'change' | 'add'>('add');
  const [talentPoolConfirmOpen, setTalentPoolConfirmOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState('');
  const [pipelineLoading, setPipelineLoading] = useState(false);

  function openMoveStage() {
    setSelectedStageId(
      activePipelineApp?.currentStage?.stageId ??
        pipelineJob?.pipeline?.stages?.[0]?._id ??
        ''
    );
    setStageOpen(true);
  }

  function openJobDialog(mode: 'change' | 'add') {
    setJobDialogMode(mode);
    setChangeJobOpen(true);
  }

  async function handleMoveStage() {
    if (!activePipelineApp || !selectedStageId) return;
    // Defensive: the dialog pre-selects the current stage, and re-sending it
    // would rewrite `currentStage.assignedAt` (resetting the stage age shown
    // on the pipeline board) while logging a `from === to` activity row. The
    // confirm button is disabled for this case; this guard covers a race where
    // the application moves underneath an open dialog.
    if (selectedStageId === activePipelineApp.currentStage?.stageId) {
      setStageOpen(false);
      return;
    }
    setPipelineLoading(true);
    try {
      const targetStage = pipelineJob?.pipeline?.stages?.find(
        s => s._id === selectedStageId
      );
      await moveStage(activePipelineApp._id, selectedStageId);
      logOptimisticActivity(
        'application',
        activePipelineApp._id,
        'stage_changed',
        `${fullName} moved to new stage`,
        {
          from: activePipelineApp.currentStage?.stageName ?? null,
          to: targetStage?.name ?? null,
        }
      );
      toast.success(`${fullName} moved to stage`);
      setStageOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPipelineLoading(false);
    }
  }

  async function handleHire() {
    if (!activePipelineApp) return;
    setPipelineLoading(true);
    try {
      await hireApp(activePipelineApp._id);
      logOptimisticActivity(
        'application',
        activePipelineApp._id,
        'hired',
        `${fullName} hired`
      );
      toast.success(`${fullName} hired`);
      setHireOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPipelineLoading(false);
    }
  }

  async function handleReject(payload: RejectPayload) {
    if (!activePipelineApp) return;
    setPipelineLoading(true);
    try {
      await rejectApp(activePipelineApp._id, payload);
      logOptimisticActivity(
        'application',
        activePipelineApp._id,
        'rejected',
        `${fullName} rejected from ${pipelineJob?.title ?? 'job'}`,
        {
          reasonId: payload.rejectionReasonId,
          destination: payload.destination ?? null,
        }
      );
      toast.success(
        `${fullName} rejected from ${pipelineJob?.title ?? 'this job'}` +
          (payload.destination === 'permanently_ineligible'
            ? ' and marked permanently ineligible'
            : payload.destination === 'candidate_pool'
              ? ' and moved to Talent Pool'
              : '')
      );
      setRejectOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPipelineLoading(false);
    }
  }

  async function handleTalentPoolToggle() {
    if (!candidate) return;
    setPipelineLoading(true);
    try {
      await updateTalentPool(
        candidate._id,
        candidate.inTalentPool ? 'remove' : 'add'
      );
      logOptimisticActivity(
        'candidate',
        candidate._id,
        candidate.inTalentPool ? 'talent_pool_removed' : 'talent_pool_added',
        candidate.inTalentPool
          ? `${fullName} removed from talent pool`
          : `${fullName} added to talent pool`
      );
      toast.success(
        candidate.inTalentPool
          ? `${fullName} removed from talent pool`
          : `${fullName} added to talent pool`
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPipelineLoading(false);
    }
  }

  /**
   * Change the job on the candidate's active application.
   *
   * Implemented as a server-side composite — close the current application and
   * create one for the target job — because `jobId` is part of the unique
   * (candidateId, jobId) index and cannot be edited in place.
   */
  async function handleChangeJob(jobId: string, startStageId?: string) {
    if (!candidate || !activePipelineApp) return;
    setPipelineLoading(true);
    try {
      const targetJob = jobs.find(j => j._id === jobId);
      await changeJob(candidate._id, {
        applicationId: activePipelineApp._id,
        targetJobId: jobId,
        startStageId,
      });
      logOptimisticActivity(
        'candidate',
        candidate._id,
        'updated',
        `Moved to ${targetJob?.title ?? 'another job'}`
      );
      toast.success(
        `${fullName} moved to ${targetJob?.title ?? 'the new job'}`
      );
      setChangeJobOpen(false);
      // Re-read applications so the Job/Stage columns reflect the closed and
      // newly created applications. A plain `fetch()` is a no-op after boot
      // (the store skips it when items are loaded and no explicit filter is
      // passed); `fetchScopedMerge` is the variant that actually writes.
      await useApplicationStore.getState().fetchScopedMerge({ limit: 9999 });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPipelineLoading(false);
    }
  }

  /** Add another application without touching the current one. */
  async function handleAddJob(jobId: string, startStageId?: string) {
    if (!candidate) return;
    setPipelineLoading(true);
    try {
      await assignJob(candidate._id, jobId, startStageId);
      logOptimisticActivity(
        'candidate',
        candidate._id,
        'created',
        'Applied to another job'
      );
      toast.success(`${fullName} added to another job`);
      setChangeJobOpen(false);
      await useApplicationStore.getState().fetchScopedMerge({ limit: 9999 });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPipelineLoading(false);
    }
  }

  async function handleScheduleInterview(data: ScheduleInterviewInput) {
    if (!activePipelineApp || !candidate) return;

    if (data.type === 'google_meet' && !data.meetingLink.trim()) {
      toast.error('Meeting link is required for Google Meet interviews');
      return;
    }
    setPipelineLoading(true);
    try {
      // `data.scheduledAt` is a wall clock from the dialog; interpret it in the
      // company timezone, which is the zone the form displays.
      const scheduledAt = zonedWallClockToUtc(
        data.scheduledAt.slice(0, 10),
        data.scheduledAt.slice(11, 16),
        companyTimezone
      );
      if (!scheduledAt) {
        toast.error('Please enter a valid date and time');
        return;
      }
      await createInterviewForApplication(activePipelineApp._id, {
        title: data.title,
        type: data.type as Interview['type'],
        jobId: data.jobId || undefined,
        scheduledAt,
        duration: data.duration,
        interviewerIds: data.interviewerIds,
        meetingDetails: {
          link: data.meetingLink || null,
          phoneNumber: data.phoneNumber || null,
          address: data.address || null,
        },
      });
      refreshInterviews();
      const jobTitle =
        jobs.find(j => j._id === data.jobId)?.title ??
        pipelineJob?.title ??
        'this job';
      logOptimisticActivity(
        'application',
        activePipelineApp._id,
        'interview_scheduled',
        `Interview scheduled for ${jobTitle}`
      );
      setScheduleOpen(false);
    } catch {
      // toast handled by store
    } finally {
      setPipelineLoading(false);
    }
  }

  return {
    pipelineLoading,
    stageOpen,
    setStageOpen,
    selectedStageId,
    setSelectedStageId,
    openMoveStage,
    handleMoveStage,
    hireOpen,
    setHireOpen,
    handleHire,
    rejectOpen,
    setRejectOpen,
    handleReject,
    scheduleOpen,
    setScheduleOpen,
    handleScheduleInterview,
    talentPoolConfirmOpen,
    setTalentPoolConfirmOpen,
    handleTalentPoolToggle,
    changeJobOpen,
    setChangeJobOpen,
    jobDialogMode,
    openJobDialog,
    handleChangeJob,
    handleAddJob,
  };
}
