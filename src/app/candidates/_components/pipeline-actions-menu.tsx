import { ComposeEmailSheet } from '@/app/emails/_components/compose-email-sheet';
import { ChangeJobDialog } from '@/components/change-job-dialog';
import { HireCandidateDialog } from '@/components/hire-candidate-dialog';
import { MoveStageDialog } from '@/components/move-stage-dialog';
import { RejectDialog, type RejectPayload } from '@/components/reject-dialog';
import { ScheduleInterviewDialog, type ScheduleInterviewInput } from '@/components/schedule-interview-dialog';
import { TalentPoolToggleDialog } from '@/components/talent-pool-toggle-dialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useInterviewerOptions } from '@/hooks/use-interviewer-options';
import { DEFAULT_TIMEZONE, zonedWallClockToUtc } from '@/lib/timezones';
import { useApplicationStore } from '@/store/slices/applications.store';
import { useAuthStore } from '@/store/slices/auth.store';
import { useCandidateStore } from '@/store/slices/candidates.store';
import { useClientStore } from '@/store/slices/clients.store';
import { useInterviewStore } from '@/store/slices/interviews.store';
import { useSettingsStore } from '@/store/slices/settings.store';
import type { Application, Candidate, Interview, Job } from '@/store/types';
import { ArrowRightLeftIcon, CalendarIcon, EllipsisVerticalIcon, GitCommitHorizontalIcon, MailIcon, PlusIcon, StarIcon, UserCheckIcon, XIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

export function PipelineActionsMenu({
  candidate,
  allApps,
  allJobs,
}: {
  candidate: Candidate;
  allApps: Application[];
  allJobs: Job[];
}) {
  const appStore = useApplicationStore();
  const candStore = useCandidateStore();
  const createInterviewForApplication = useInterviewStore(
    s => s.createForApplication
  );
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

  const candidateApps = useMemo(
    () =>
      allApps.filter(
        a => a.candidateId === candidate._id && a.phase === 'approved'
      ),
    [allApps, candidate._id]
  );
  const allCandidateApps = useMemo(
    () => allApps.filter(a => a.candidateId === candidate._id),
    [allApps, candidate._id]
  );
  const application = candidateApps[0];
  const job = useMemo(
    () => allJobs.find(j => j._id === application?.jobId),
    [allJobs, application?.jobId]
  );
  const stages = job?.pipeline?.stages ?? [];

  const [stageOpen, setStageOpen] = useState(false);
  const [hireOpen, setHireOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [talentPoolConfirmOpen, setTalentPoolConfirmOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [changeJobOpen, setChangeJobOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState('');
  const [acting, setActing] = useState(false);
  const settings = useSettingsStore(s => s.settings);
  const companyTimezone = settings?.companyTimezone || DEFAULT_TIMEZONE;

  const openJobs = useMemo(
    () => allJobs.filter(j => j.status === 'open'),
    [allJobs]
  );

  const name = `${candidate.firstName} ${candidate.lastName}`;

  /**
   * Every job this candidate already holds an application for, in any phase.
   * The (candidateId, jobId) index is unique regardless of phase, so adding a
   * duplicate is rejected by the backend with `409 CANDIDATE_ALREADY_APPLIED`.
   * The reassign picker disables these rather than letting the user hit that.
   */
  const heldJobIds = useMemo(
    () => new Set(allCandidateApps.map(a => a.jobId)),
    [allCandidateApps]
  );

  /**
   * Open jobs with their active pipeline stages, for the ChangeJobDialog job
   * picker. The stage list is what powers the dialog's optional "Starting
   * stage" choice — without it that section never renders.
   */
  const jobOptionsForActions = useMemo(
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

  /**
   * Live applications the candidate holds on other jobs. When non-zero the
   * reject dialog hides the destination options, because banning or pooling
   * them here would silently destroy that other job's pipeline.
   */
  const otherLiveApplicationCount = allCandidateApps.filter(
    a =>
      a._id !== application?._id &&
      (a.phase === 'pending' || a.phase === 'approved')
  ).length;

  // Compose email prefill for this candidate
  function buildComposeMode() {
    return {
      type: 'prefill' as const,
      to: candidate.email,
      subject: '',
      body: '',
      templateType: 'general',
      context: application
        ? {
            type: 'general',
            candidateId: candidate._id,
            applicationId: application._id,
            jobId: application.jobId,
          }
        : { type: 'general', candidateId: candidate._id },
      variables: {
        candidateName: name,
        candidateEmail: candidate.email,
        candidatePhone: candidate.phone ?? '',
        jobTitle: job?.title ?? '',
        clientName: job
          ? (useClientStore.getState().items.find(c => c._id === job.clientId)
              ?.companyName ?? '')
          : '',
        currentStage: application?.currentStage?.stageName ?? '',
        senderName: (() => {
          const u = useAuthStore.getState().user;
          return u ? `${u.firstName} ${u.lastName}`.trim() : '';
        })(),
      },
    };
  }

  async function handleMoveStage() {
    if (!application || !selectedStageId) return;
    // Defensive: the dialog pre-selects the current stage, and re-sending it
    // would rewrite `currentStage.assignedAt` (resetting the stage age shown in
    // the Stage column) while logging a `from === to` activity row. The confirm
    // button is disabled for this case; this guard covers a race where the
    // application moves underneath an open dialog.
    if (selectedStageId === application.currentStage?.stageId) {
      setStageOpen(false);
      return;
    }
    setActing(true);
    try {
      await appStore.moveStage(application._id, selectedStageId);
      toast.success(`${name} moved to stage`);
      setStageOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  }

  async function handleHire() {
    if (!application) return;
    setActing(true);
    try {
      await appStore.hire(application._id);
      toast.success(`${name} hired`);
      setHireOpen(false);
      await candStore.fetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  }

  async function handleTalentPool() {
    setActing(true);
    try {
      await candStore.updateTalentPool(
        candidate._id,
        candidate.inTalentPool ? 'remove' : 'add'
      );
      toast.success(
        candidate.inTalentPool
          ? `${name} removed from talent pool`
          : `${name} added to talent pool`
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  }

  async function handleReject(payload: RejectPayload) {
    if (!application) return;
    setActing(true);
    try {
      await appStore.reject(application._id, payload);
      toast.success(
        `${name} rejected` +
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
      setActing(false);
    }
  }

  /** Add a second job alongside the current one (the current app stays open). */
  async function handleAddAnotherJob(jobId: string, startStageId?: string) {
    setActing(true);
    try {
      await candStore.assignJob(candidate._id, jobId, startStageId);
      toast.success(`${name} added to another job`);
      setReassignOpen(false);
      await appStore.fetchScopedMerge({ limit: 9999 });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  }

  /**
   * Change job — the chosen job REPLACES the current one. The existing
   * application is closed and a new one opened, because `jobId` is part of the
   * application's unique key and cannot be edited in place. Distinct from
   * "Add to Another Job", which keeps the current application.
   */
  async function handleChangeJob(jobId: string, startStageId?: string) {
    if (!application) return;
    setActing(true);
    try {
      const target = allJobs.find(j => j._id === jobId);
      await candStore.changeJob(candidate._id, {
        applicationId: application._id,
        targetJobId: jobId,
        startStageId,
      });
      toast.success(`${name} moved to ${target?.title ?? 'the new job'}`);
      setChangeJobOpen(false);
      // Re-read applications so the Job/Stage columns reflect the closed and
      // newly created applications immediately. `fetch()` would be a no-op here
      // (the store skips it after boot when items are loaded and no explicit
      // filter is passed), and `fetchScoped` only returns rows without merging
      // them — so `fetchScopedMerge` is the one that actually updates the store.
      await appStore.fetchScopedMerge({ limit: 9999 });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  }

  async function handleScheduleInterview(data: ScheduleInterviewInput) {
    if (!application) return;
    if (data.type === 'google_meet' && !data.meetingLink.trim()) {
      toast.error('Meeting link is required for Google Meet interviews');
      return;
    }
    setActing(true);
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
      setScheduleOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={acting}
            aria-label={`Actions for ${name}`}
            className="hover:bg-silver-200 dark:hover:bg-white/10 data-[state=open]:bg-silver-200 dark:data-[state=open]:bg-white/10"
          >
            <EllipsisVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 p-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 pb-1.5 pt-0.5">
            Stage
          </div>
          <DropdownMenuItem
            className="gap-2.5 rounded-md px-2.5 py-2 cursor-pointer"
            disabled={stages.length === 0 || !application}
            onClick={() => {
              setSelectedStageId(
                application?.currentStage?.stageId ?? stages[0]?._id ?? ''
              );
              setStageOpen(true);
            }}
          >
            <span className="flex items-center justify-center size-7 rounded-md bg-violet-100 dark:bg-violet-900/30 shrink-0">
              <GitCommitHorizontalIcon className="size-3.5 text-violet-600 dark:text-violet-400" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm">Move Stage</span>
              <span className="text-[11px] text-muted-foreground">
                Advance through pipeline
              </span>
            </span>
          </DropdownMenuItem>
          <div className="mx-2 my-2 h-px bg-border" />
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 pb-1.5 pt-0.5">
            Hiring
          </div>
          <DropdownMenuItem
            className="gap-2.5 rounded-md px-2.5 py-2 cursor-pointer"
            disabled={!application}
            onClick={() => setHireOpen(true)}
          >
            <span className="flex items-center justify-center size-7 rounded-md bg-green-100 dark:bg-green-900/30 shrink-0">
              <UserCheckIcon className="size-3.5 text-green-600 dark:text-green-400" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm">Hire</span>
              <span className="text-[11px] text-muted-foreground">
                Mark as hired for this job
              </span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2.5 rounded-md px-2.5 py-2 cursor-pointer"
            disabled={!application || acting}
            onClick={() => setScheduleOpen(true)}
          >
            <span className="flex items-center justify-center size-7 rounded-md bg-indigo-100 dark:bg-indigo-900/30 shrink-0">
              <CalendarIcon className="size-3.5 text-indigo-600 dark:text-indigo-400" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm">Schedule Interview</span>
              <span className="text-[11px] text-muted-foreground">
                Book and invite interviewers
              </span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            className="gap-2.5 rounded-md px-2.5 py-2 cursor-pointer"
            disabled={!application}
            onClick={() => setRejectOpen(true)}
          >
            <span className="flex items-center justify-center size-7 rounded-md bg-red-100 dark:bg-red-900/30 shrink-0">
              <XIcon className="size-3.5 text-red-600 dark:text-red-400" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm">Reject</span>
              <span className="text-[11px] text-muted-foreground">
                {otherLiveApplicationCount > 0
                  ? 'Remove from this job only'
                  : 'Reject & close this application'}
              </span>
            </span>
          </DropdownMenuItem>
          <div className="mx-2 my-2 h-px bg-border" />
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 pb-1.5 pt-0.5">
            Communication
          </div>
          <DropdownMenuItem
            className="gap-2.5 rounded-md px-2.5 py-2 cursor-pointer"
            onClick={() => setComposeOpen(true)}
          >
            <span className="flex items-center justify-center size-7 rounded-md bg-blue-100 dark:bg-blue-900/30 shrink-0">
              <MailIcon className="size-3.5 text-blue-600 dark:text-blue-400" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm">Email Candidate</span>
              <span className="text-[11px] text-muted-foreground">
                Compose and send an email
              </span>
            </span>
          </DropdownMenuItem>
          <div className="mx-2 my-2 h-px bg-border" />
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 pb-1.5 pt-0.5">
            Jobs &amp; Pool
          </div>
          <DropdownMenuItem
            className="gap-2.5 rounded-md px-2.5 py-2 cursor-pointer"
            disabled={openJobs.length === 0 || acting}
            onClick={() => setChangeJobOpen(true)}
          >
            <span className="flex items-center justify-center size-7 rounded-md bg-orange-100 dark:bg-orange-900/30 shrink-0">
              <ArrowRightLeftIcon className="size-3.5 text-orange-600 dark:text-orange-400" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm">Change Job</span>
              <span className="text-[11px] text-muted-foreground">
                Move to a different job
              </span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2.5 rounded-md px-2.5 py-2 cursor-pointer"
            disabled={openJobs.length === 0 || acting}
            onClick={() => setReassignOpen(true)}
          >
            <span className="flex items-center justify-center size-7 rounded-md bg-teal-100 dark:bg-teal-900/30 shrink-0">
              <PlusIcon className="size-3.5 text-teal-600 dark:text-teal-400" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm">Add to Another Job</span>
              <span className="text-[11px] text-muted-foreground">
                Add another job alongside the current one
              </span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2.5 rounded-md px-2.5 py-2 cursor-pointer"
            onClick={() => setTalentPoolConfirmOpen(true)}
          >
            <span className="flex items-center justify-center size-7 rounded-md bg-amber-100 dark:bg-amber-900/30 shrink-0">
              <StarIcon className="size-3.5 text-amber-700 dark:text-amber-400" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm">
                {candidate.inTalentPool
                  ? 'Remove from Talent Pool'
                  : 'Add to Talent Pool'}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {candidate.inTalentPool
                  ? 'Remove from saved candidates'
                  : 'Save for future opportunities'}
              </span>
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Compose Email Sheet */}
      <ComposeEmailSheet
        open={composeOpen}
        onOpenChange={setComposeOpen}
        mode={buildComposeMode()}
      />

      <MoveStageDialog
        open={stageOpen}
        onOpenChange={setStageOpen}
        candidateName={name}
        stages={stages}
        selectedStageId={selectedStageId}
        onSelectedStageIdChange={setSelectedStageId}
        currentStageId={application?.currentStage?.stageId}
        loading={acting}
        onConfirm={handleMoveStage}
      />

      <HireCandidateDialog
        open={hireOpen}
        onOpenChange={setHireOpen}
        candidateName={name}
        jobTitle={job?.title}
        loading={acting}
        onConfirm={handleHire}
      />

      {/* Reject Dialog — structured reason + destination */}
      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        candidateName={name}
        jobTitle={job?.title}
        currentStageName={application?.currentStage?.stageName}
        hasOtherLiveApplication={otherLiveApplicationCount > 0}
        submitting={acting}
        onConfirm={handleReject}
      />

      {/* Change Job — replaces the current job; the old application closes. */}
      <ChangeJobDialog
        open={changeJobOpen}
        onOpenChange={setChangeJobOpen}
        mode="change"
        candidateName={name}
        currentJobId={job?._id}
        currentJobTitle={job?.title}
        jobs={jobOptionsForActions}
        submitting={acting}
        onConfirm={handleChangeJob}
      />

      {/* Add to Another Job — keeps the current job and adds a second one. */}
      <ChangeJobDialog
        open={reassignOpen}
        onOpenChange={setReassignOpen}
        mode="add"
        candidateName={name}
        currentJobId={job?._id}
        currentJobTitle={job?.title}
        jobs={jobOptionsForActions.filter(j => !heldJobIds.has(j._id))}
        submitting={acting}
        onConfirm={handleAddAnotherJob}
      />

      {/* Schedule Interview — keyed by candidate so the form re-seeds when a
          different row's menu is used. */}
      <ScheduleInterviewDialog
        key={candidate._id}
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        onConfirm={handleScheduleInterview}
        candidateName={name}
        job={job ?? null}
        jobs={openJobs.map(j => ({ _id: j._id, title: j.title }))}
        users={users}
        loading={acting}
      />

      <TalentPoolToggleDialog
        open={talentPoolConfirmOpen}
        onOpenChange={setTalentPoolConfirmOpen}
        candidateName={name}
        inTalentPool={!!candidate.inTalentPool}
        loading={acting}
        onConfirm={handleTalentPool}
      />
    </>
  );
}
