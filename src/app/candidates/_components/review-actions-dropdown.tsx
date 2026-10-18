import { ComposeEmailSheet } from '@/app/emails/_components/compose-email-sheet';
import { RejectDialog } from '@/components/reject-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Application, Candidate, Job } from '@/store/types';
import {
  CheckIcon,
  EllipsisVerticalIcon,
  MailIcon,
  StarIcon,
  XIcon,
} from 'lucide-react';
import { useState } from 'react';
import { buildCandidateMenuComposeMode } from '../_utils/build-candidate-menu-compose';
import { ActionMenuItem, ActionMenuSection } from './action-menu-item';
import { ApproveJobDialog } from './review-actions-dropdown/approve-job-dialog';
import { useReviewActions } from './review-actions-dropdown/use-review-actions';

type ActiveDialog = 'approve' | 'reject' | 'compose';

interface ReviewActionsDropdownProps {
  candidate: Candidate;
  allJobs: Job[];
  allApps: Application[];
  onMutated?: () => void;
}

export function ReviewActionsDropdown({
  candidate,
  allJobs,
  allApps,
  onMutated,
}: ReviewActionsDropdownProps) {
  const [active, setActive] = useState<ActiveDialog | null>(null);
  const actions = useReviewActions({
    candidate,
    allJobs,
    allApps,
    closeDialog: () => setActive(null),
    onMutated,
  });
  const { name, acting, openJobs, liveApplication } = actions;
  const hasJobApplied = !!candidate.appliedJobId;

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
            aria-label={`Actions for ${name}`}
            className="hover:bg-silver-200 dark:hover:bg-white/10 data-[state=open]:bg-silver-200 dark:data-[state=open]:bg-white/10"
          >
            <EllipsisVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 p-1.5">
          <ActionMenuSection>Decide</ActionMenuSection>
          <ActionMenuItem
            icon={CheckIcon}
            iconBoxClass="bg-green-100 dark:bg-green-900/30"
            iconClass="text-green-600 dark:text-green-400"
            title="Approve"
            description={
              hasJobApplied
                ? 'Create application for applied job'
                : 'Choose a job to approve into'
            }
            disabled={acting || (!hasJobApplied && openJobs.length === 0)}
            onClick={() => {
              actions.startApprove();
              setActive('approve');
            }}
          />
          <ActionMenuItem
            variant="destructive"
            icon={XIcon}
            iconBoxClass="bg-red-100 dark:bg-red-900/30"
            iconClass="text-red-600 dark:text-red-400"
            title="Reject"
            description={
              liveApplication
                ? 'Remove from this job only'
                : 'Choose a reason and destination'
            }
            disabled={acting}
            onClick={() => setActive('reject')}
          />
          <div className="mx-2 my-2 h-px bg-border" />
          <ActionMenuSection>Talent Pool</ActionMenuSection>
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
            disabled={acting}
            onClick={actions.toggleTalentPool}
          />
          <div className="mx-2 my-2 h-px bg-border" />
          <ActionMenuSection>Communication</ActionMenuSection>
          <ActionMenuItem
            icon={MailIcon}
            iconBoxClass="bg-blue-100 dark:bg-blue-900/30"
            iconClass="text-blue-600 dark:text-blue-400"
            title="Email"
            description="Compose and send an email"
            onClick={() => setActive('compose')}
          />
        </DropdownMenuContent>
      </DropdownMenu>

      <ComposeEmailSheet
        {...dialogProps('compose')}
        mode={buildCandidateMenuComposeMode({
          candidate,
          candidateName: name,
          clientName: '',
        })}
      />

      <ApproveJobDialog
        {...dialogProps('approve')}
        candidateName={name}
        hasJobApplied={hasJobApplied}
        openJobs={openJobs}
        selectedJobId={actions.selectedJobId}
        onSelectedJobIdChange={actions.setSelectedJobId}
        acting={acting}
        onConfirm={actions.approve}
      />

      {/* A candidate with no live application is rejected at candidate level
          (destination always offered, spec §4.8). One that holds a live
          application is rejected at application level, which removes them from
          that job only — the dialog then hides the destination options. */}
      <RejectDialog
        {...dialogProps('reject')}
        candidateName={name}
        jobTitle={actions.rejectJobTitle}
        currentStageName={liveApplication?.currentStage?.stageName}
        hasOtherLiveApplication={actions.otherLiveApplicationCount > 0}
        submitting={acting}
        onConfirm={actions.reject}
      />
    </>
  );
}
