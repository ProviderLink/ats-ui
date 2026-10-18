import { ComposeEmailSheet } from '@/app/emails/_components/compose-email-sheet';
import { ChangeJobDialog } from '@/components/change-job-dialog';
import { HireCandidateDialog } from '@/components/hire-candidate-dialog';
import { MoveStageDialog } from '@/components/move-stage-dialog';
import { RejectDialog } from '@/components/reject-dialog';
import { ScheduleInterviewDialog } from '@/components/schedule-interview-dialog';
import { TalentPoolToggleDialog } from '@/components/talent-pool-toggle-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Application, Candidate, Job } from '@/store/types';
import {
  ArrowRightLeftIcon,
  CalendarIcon,
  EllipsisVerticalIcon,
  GitCommitHorizontalIcon,
  MailIcon,
  PlusIcon,
  StarIcon,
  UserCheckIcon,
  XIcon,
} from 'lucide-react';
import { useState } from 'react';
import {
  ActionMenuItem,
  ActionMenuSection,
} from './action-menu-item';
import { usePipelineActions } from './pipeline-actions-menu/use-pipeline-actions';

type ActiveDialog =
  | 'stage'
  | 'hire'
  | 'reject'
  | 'reassign'
  | 'talentPool'
  | 'compose'
  | 'schedule'
  | 'changeJob';

interface PipelineActionsMenuProps {
  candidate: Candidate;
  allApps: Application[];
  allJobs: Job[];
}

const MENU_DIVIDER = <div className="mx-2 my-2 h-px bg-border" />;

export function PipelineActionsMenu({
  candidate,
  allApps,
  allJobs,
}: PipelineActionsMenuProps) {
  const [active, setActive] = useState<ActiveDialog | null>(null);
  const actions = usePipelineActions({
    candidate,
    allApps,
    allJobs,
    closeDialog: () => setActive(null),
  });
  const {
    name,
    application,
    job,
    stages,
    openJobs,
    jobOptions,
    heldJobIds,
    otherLiveApplicationCount,
    acting,
  } = actions;

  const dialogProps = (id: ActiveDialog) => ({
    open: active === id,
    onOpenChange: (open: boolean) => setActive(open ? id : null),
  });

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
          <ActionMenuSection>Stage</ActionMenuSection>
          <ActionMenuItem
            icon={GitCommitHorizontalIcon}
            iconBoxClass="bg-violet-100 dark:bg-violet-900/30"
            iconClass="text-violet-600 dark:text-violet-400"
            title="Move Stage"
            description="Advance through pipeline"
            disabled={stages.length === 0 || !application}
            onClick={() => {
              actions.setSelectedStageId(
                application?.currentStage?.stageId ?? stages[0]?._id ?? ''
              );
              setActive('stage');
            }}
          />
          {MENU_DIVIDER}
          <ActionMenuSection>Hiring</ActionMenuSection>
          <ActionMenuItem
            icon={UserCheckIcon}
            iconBoxClass="bg-green-100 dark:bg-green-900/30"
            iconClass="text-green-600 dark:text-green-400"
            title="Hire"
            description="Mark as hired for this job"
            disabled={!application}
            onClick={() => setActive('hire')}
          />
          <ActionMenuItem
            icon={CalendarIcon}
            iconBoxClass="bg-indigo-100 dark:bg-indigo-900/30"
            iconClass="text-indigo-600 dark:text-indigo-400"
            title="Schedule Interview"
            description="Book and invite interviewers"
            disabled={!application || acting}
            onClick={() => setActive('schedule')}
          />
          <ActionMenuItem
            variant="destructive"
            icon={XIcon}
            iconBoxClass="bg-red-100 dark:bg-red-900/30"
            iconClass="text-red-600 dark:text-red-400"
            title="Reject"
            description={
              otherLiveApplicationCount > 0
                ? 'Remove from this job only'
                : 'Reject & close this application'
            }
            disabled={!application}
            onClick={() => setActive('reject')}
          />
          {MENU_DIVIDER}
          <ActionMenuSection>Communication</ActionMenuSection>
          <ActionMenuItem
            icon={MailIcon}
            iconBoxClass="bg-blue-100 dark:bg-blue-900/30"
            iconClass="text-blue-600 dark:text-blue-400"
            title="Email Candidate"
            description="Compose and send an email"
            onClick={() => setActive('compose')}
          />
          {MENU_DIVIDER}
          <ActionMenuSection>Jobs &amp; Pool</ActionMenuSection>
          <ActionMenuItem
            icon={ArrowRightLeftIcon}
            iconBoxClass="bg-orange-100 dark:bg-orange-900/30"
            iconClass="text-orange-600 dark:text-orange-400"
            title="Change Job"
            description="Move to a different job"
            disabled={openJobs.length === 0 || acting}
            onClick={() => setActive('changeJob')}
          />
          <ActionMenuItem
            icon={PlusIcon}
            iconBoxClass="bg-teal-100 dark:bg-teal-900/30"
            iconClass="text-teal-600 dark:text-teal-400"
            title="Add to Another Job"
            description="Add another job alongside the current one"
            disabled={openJobs.length === 0 || acting}
            onClick={() => setActive('reassign')}
          />
          <ActionMenuItem
            icon={StarIcon}
            iconBoxClass="bg-amber-100 dark:bg-amber-900/30"
            iconClass="text-amber-700 dark:text-amber-400"
            title={
              candidate.inTalentPool
                ? 'Remove from Talent Pool'
                : 'Add to Talent Pool'
            }
            description={
              candidate.inTalentPool
                ? 'Remove from saved candidates'
                : 'Save for future opportunities'
            }
            onClick={() => setActive('talentPool')}
          />
        </DropdownMenuContent>
      </DropdownMenu>

      <ComposeEmailSheet
        {...dialogProps('compose')}
        mode={actions.buildComposeMode()}
      />

      <MoveStageDialog
        {...dialogProps('stage')}
        candidateName={name}
        stages={stages}
        selectedStageId={actions.selectedStageId}
        onSelectedStageIdChange={actions.setSelectedStageId}
        currentStageId={application?.currentStage?.stageId}
        loading={acting}
        onConfirm={actions.moveStage}
      />

      <HireCandidateDialog
        {...dialogProps('hire')}
        candidateName={name}
        jobTitle={job?.title}
        loading={acting}
        onConfirm={actions.hire}
      />

      <RejectDialog
        {...dialogProps('reject')}
        candidateName={name}
        jobTitle={job?.title}
        currentStageName={application?.currentStage?.stageName}
        hasOtherLiveApplication={otherLiveApplicationCount > 0}
        submitting={acting}
        onConfirm={actions.reject}
      />

      <ChangeJobDialog
        {...dialogProps('changeJob')}
        mode="change"
        candidateName={name}
        currentJobId={job?._id}
        currentJobTitle={job?.title}
        jobs={jobOptions}
        submitting={acting}
        onConfirm={actions.changeJob}
      />

      <ChangeJobDialog
        {...dialogProps('reassign')}
        mode="add"
        candidateName={name}
        currentJobId={job?._id}
        currentJobTitle={job?.title}
        jobs={jobOptions.filter(j => !heldJobIds.has(j._id))}
        submitting={acting}
        onConfirm={actions.addAnotherJob}
      />

      {/* Keyed by candidate so the form re-seeds when a different row's menu is used. */}
      <ScheduleInterviewDialog
        key={candidate._id}
        open={active === 'schedule'}
        onClose={() => setActive(null)}
        onConfirm={actions.scheduleInterview}
        candidateName={name}
        job={job ?? null}
        jobs={openJobs.map(j => ({ _id: j._id, title: j.title }))}
        users={actions.users}
        loading={acting}
      />

      <TalentPoolToggleDialog
        {...dialogProps('talentPool')}
        candidateName={name}
        inTalentPool={!!candidate.inTalentPool}
        loading={acting}
        onConfirm={actions.toggleTalentPool}
      />
    </>
  );
}
