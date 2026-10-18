import { useInterviewerOptions } from '@/hooks/use-interviewer-options';
import { DEFAULT_TIMEZONE, zonedWallClockToUtc } from '@/lib/timezones';
import type { RejectPayload } from '@/components/reject-dialog';
import type { ScheduleInterviewInput } from '@/components/schedule-interview/schedule-interview-types';
import { useApplicationStore } from '@/store/slices/applications.store';
import { useCandidateStore } from '@/store/slices/candidates.store';
import { useClientStore } from '@/store/slices/clients.store';
import { useInterviewStore } from '@/store/slices/interviews.store';
import { useSettingsStore } from '@/store/slices/settings.store';
import type { Application, Candidate, Interview, Job } from '@/store/types';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { buildCandidateMenuComposeMode } from '../../_utils/build-candidate-menu-compose';

interface UsePipelineActionsArgs {
  candidate: Candidate;
  allApps: Application[];
  allJobs: Job[];
  closeDialog: () => void;
}

export function usePipelineActions({
  candidate,
  allApps,
  allJobs,
  closeDialog,
}: UsePipelineActionsArgs) {
  const appFetchScopedMerge = useApplicationStore(s => s.fetchScopedMerge);
  const appHire = useApplicationStore(s => s.hire);
  const appMoveStage = useApplicationStore(s => s.moveStage);
  const appReject = useApplicationStore(s => s.reject);
  const candAssignJob = useCandidateStore(s => s.assignJob);
  const candChangeJob = useCandidateStore(s => s.changeJob);
  const candFetch = useCandidateStore(s => s.fetch);
  const candUpdateTalentPool = useCandidateStore(s => s.updateTalentPool);
  const createInterviewForApplication = useInterviewStore(
    s => s.createForApplication
  );
  const settings = useSettingsStore(s => s.settings);
  const companyTimezone = settings?.companyTimezone || DEFAULT_TIMEZONE;

  // Scoped to ATS staff — the boot-loaded user list also holds CRM-only
  // accounts (client/va) and deactivated users, which showed up here as
  // interviewers who are not part of the team.
  const { interviewers } = useInterviewerOptions();
  const users = useMemo(
    () =>
      interviewers.map(u => ({
        _id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
      })),
    [interviewers]
  );

  const allCandidateApps = useMemo(
    () => allApps.filter(a => a.candidateId === candidate._id),
    [allApps, candidate._id]
  );
  const application = allCandidateApps.find(a => a.phase === 'approved');
  const job = useMemo(
    () => allJobs.find(j => j._id === application?.jobId),
    [allJobs, application?.jobId]
  );
  const stages = job?.pipeline?.stages ?? [];
  const openJobs = useMemo(
    () => allJobs.filter(j => j.status === 'open'),
    [allJobs]
  );
  const name = `${candidate.firstName} ${candidate.lastName}`;

  // The (candidateId, jobId) index is unique regardless of phase, so adding a
  // duplicate is rejected by the backend with `409 CANDIDATE_ALREADY_APPLIED`.
  const heldJobIds = useMemo(
    () => new Set(allCandidateApps.map(a => a.jobId)),
    [allCandidateApps]
  );

  // Stages power the ChangeJobDialog's optional "Starting stage" choice.
  const jobOptions = useMemo(
    () =>
      openJobs.map(j => ({
        _id: j._id,
        title: j.title,
        stages: (j.pipeline?.stages ?? [])
          .filter(s => s.isActive !== false)
          .sort((a, b) => a.order - b.order)
          .map(s => ({ _id: s._id, name: s.name })),
      })),
    [openJobs]
  );

  // When non-zero the reject dialog hides the destination options, because
  // banning or pooling them here would silently destroy that other job's
  // pipeline.
  const otherLiveApplicationCount = allCandidateApps.filter(
    a =>
      a._id !== application?._id &&
      (a.phase === 'pending' || a.phase === 'approved')
  ).length;

  const [selectedStageId, setSelectedStageId] = useState('');
  const [acting, setActing] = useState(false);

  async function run(action: () => Promise<void>) {
    setActing(true);
    try {
      await action();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  }

  function buildComposeMode() {
    return buildCandidateMenuComposeMode({
      candidate,
      candidateName: name,
      application,
      job,
      clientName: job
        ? (useClientStore.getState().items.find(c => c._id === job.clientId)
            ?.companyName ?? '')
        : '',
    });
  }

  async function moveStage() {
    if (!application || !selectedStageId) return;
    // Re-sending the current stage would rewrite `currentStage.assignedAt`
    // (resetting the stage age) and log a `from === to` activity row. The
    // confirm button is disabled for this case; this covers a race where the
    // application moves underneath an open dialog.
    if (selectedStageId === application.currentStage?.stageId) {
      closeDialog();
      return;
    }
    await run(async () => {
      await appMoveStage(application._id, selectedStageId);
      toast.success(`${name} moved to stage`);
      closeDialog();
    });
  }

  async function hire() {
    if (!application) return;
    await run(async () => {
      await appHire(application._id);
      toast.success(`${name} hired`);
      closeDialog();
      await candFetch();
    });
  }

  async function toggleTalentPool() {
    await run(async () => {
      await candUpdateTalentPool(
        candidate._id,
        candidate.inTalentPool ? 'remove' : 'add'
      );
      toast.success(
        candidate.inTalentPool
          ? `${name} removed from talent pool`
          : `${name} added to talent pool`
      );
    });
  }

  async function reject(payload: RejectPayload) {
    if (!application) return;
    await run(async () => {
      await appReject(application._id, payload);
      toast.success(
        `${name} rejected` +
          (payload.destination === 'permanently_ineligible'
            ? ' and marked permanently ineligible'
            : payload.destination === 'candidate_pool'
              ? ' and moved to Talent Pool'
              : '')
      );
      closeDialog();
    });
  }

  async function addAnotherJob(jobId: string, startStageId?: string) {
    await run(async () => {
      await candAssignJob(candidate._id, jobId, startStageId);
      toast.success(`${name} added to another job`);
      closeDialog();
      await appFetchScopedMerge({ limit: 9999 });
    });
  }

  // The chosen job REPLACES the current one: `jobId` is part of the
  // application's unique key, so the old application is closed and a new one
  // opened. Distinct from "Add to Another Job", which keeps the current one.
  async function changeJob(jobId: string, startStageId?: string) {
    if (!application) return;
    await run(async () => {
      const target = allJobs.find(j => j._id === jobId);
      await candChangeJob(candidate._id, {
        applicationId: application._id,
        targetJobId: jobId,
        startStageId,
      });
      toast.success(`${name} moved to ${target?.title ?? 'the new job'}`);
      closeDialog();
      // `fetch()` is a no-op after boot and `fetchScoped` doesn't merge, so
      // `fetchScopedMerge` is what updates the Job/Stage columns.
      await appFetchScopedMerge({ limit: 9999 });
    });
  }

  async function scheduleInterview(data: ScheduleInterviewInput) {
    if (!application) return;
    if (data.type === 'google_meet' && !data.meetingLink.trim()) {
      toast.error('Meeting link is required for Google Meet interviews');
      return;
    }
    await run(async () => {
      // The dialog's wall clock is in the company timezone.
      const scheduledAt = zonedWallClockToUtc(
        data.scheduledAt.slice(0, 10),
        data.scheduledAt.slice(11, 16),
        companyTimezone
      );
      if (!scheduledAt) {
        toast.error('Please enter a valid date and time');
        return;
      }
      await createInterviewForApplication(application._id, {
        title: data.title,
        type: data.type as Interview['type'],
        jobId: data.jobId || undefined,
        scheduledAt,
        duration: data.duration,
        // Empty is valid — the backend falls back to the organiser.
        interviewerIds: data.interviewerIds,
        meetingDetails: {
          link: data.meetingLink || null,
          phoneNumber: data.phoneNumber || null,
          address: data.address || null,
        },
      });
      toast.success('Interview scheduled');
      closeDialog();
    });
  }

  return {
    name,
    application,
    job,
    stages,
    openJobs,
    users,
    jobOptions,
    heldJobIds,
    otherLiveApplicationCount,
    selectedStageId,
    setSelectedStageId,
    acting,
    buildComposeMode,
    moveStage,
    hire,
    toggleTalentPool,
    reject,
    addAnotherJob,
    changeJob,
    scheduleInterview,
  };
}
