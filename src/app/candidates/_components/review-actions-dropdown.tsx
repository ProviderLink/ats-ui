import { ComposeEmailSheet } from '@/app/emails/_components/compose-email-sheet';
import { RejectDialog, type RejectPayload } from '@/components/reject-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApplicationStore } from '@/store/slices/applications.store';
import { useAuthStore } from '@/store/slices/auth.store';
import { useCandidateStore } from '@/store/slices/candidates.store';
import type { Application, Candidate, Job } from '@/store/types';
import { CheckIcon, EllipsisVerticalIcon, Loader2Icon, MailIcon, StarIcon, XIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

export function ReviewActionsDropdown({
  candidate,
  allJobs,
  allApps,
  onMutated,
}: {
  candidate: Candidate;
  allJobs: Job[];
  allApps: Application[];
  onMutated?: () => void;
}) {
  const candApprove = useCandidateStore(s => s.approve);
  const candUpdateTalentPool = useCandidateStore(s => s.updateTalentPool);
  const appFetchScopedMerge = useApplicationStore(s => s.fetchScopedMerge);
  const rejectCandidateStore = useCandidateStore(s => s.rejectCandidate);
  const rejectApp = useApplicationStore(s => s.reject);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [acting, setActing] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState('');

  const name = `${candidate.firstName} ${candidate.lastName}`;
  const hasJobApplied = !!candidate.appliedJobId;

  // Open jobs the candidate can be approved into.
  const openJobs = useMemo(
    () => allJobs.filter(j => j.status === 'open'),
    [allJobs]
  );

  // The candidate's applications, for both the reject routing below and the
  // "another job" flag on the reject dialog.
  const candidateApplications = useMemo(
    () => allApps.filter(a => a.candidateId === candidate._id),
    [allApps, candidate._id]
  );

  /**
   * The application a reject should act on, or null when the candidate holds
   * none.
   *
   * Keyed on PHASE rather than on having a stage: an approved application can
   * have a null `currentStage`, and routing such a candidate to the
   * candidate-level endpoint would be refused (they still hold a live
   * application).
   */
  const liveApplication = useMemo(
    () =>
      candidateApplications.find(
        a => a.phase === 'pending' || a.phase === 'approved'
      ) ?? null,
    [candidateApplications]
  );

  /**
   * How many OTHER applications the candidate still has open. When this is
   * non-zero a reject must not ban or pool them — that would silently destroy
   * the other job's pipeline — so the dialog hides the destination options.
   */
  const otherLiveApplicationCount = useMemo(() => {
    const current = liveApplication;
    const live = candidateApplications.filter(
      a => a.phase === 'pending' || a.phase === 'approved'
    );
    if (!current) return 0;
    return live.filter(a => a._id !== current._id).length;
  }, [candidateApplications, liveApplication]);

  async function handleApprove() {
    const jobId = hasJobApplied ? candidate.appliedJobId! : selectedJobId;
    if (!jobId) {
      toast.error('Please select a job to assign this candidate to');
      return;
    }
    setActing(true);
    try {
      await candApprove(candidate._id, jobId);
      toast.success(`${name} approved`);
      setApproveOpen(false);
      setSelectedJobId('');
      // Re-read applications so the new application reaches the store (and
      // therefore the In Pipeline tab's derived id set) without waiting for the
      // `application:created` socket event. `fetchScopedMerge` is the one that
      // writes: `appStore.fetch({limit: 9999})` carries no explicit filter and
      // the post-boot guard makes it a no-op.
      await appFetchScopedMerge({ limit: 9999 });
      onMutated?.();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  }

  /**
   * Reject an In Review candidate.
   *
   * Normally they hold no application, so this goes through the
   * candidate-level endpoint. If they DO hold a live application they are
   * really a pipeline candidate — the candidate endpoint refuses with a 409
   * ("still has an active application") because applying a destination there
   * would ban or pool them platform-wide and destroy every other job's
   * pipeline. Route to that application instead, which removes them from just
   * that job. Same rule the detail sheet applies. Reachable when a candidate
   * is restored from Ineligible while a previous application is still live.
   */
  async function handleReject(payload: RejectPayload) {
    setActing(true);
    try {
      if (liveApplication) {
        await rejectApp(liveApplication._id, payload);
      } else {
        await rejectCandidateStore(candidate._id, {
          rejectionReasonId: payload.rejectionReasonId,
          ...(payload.destination ? { destination: payload.destination } : {}),
          ...(payload.internalNotes
            ? { internalNotes: payload.internalNotes }
            : {}),
        });
      }
      toast.success(
        `${name} rejected` +
          (payload.destination === 'permanently_ineligible'
            ? ' and marked permanently ineligible'
            : payload.destination === 'candidate_pool'
              ? ' and moved to Talent Pool'
              : '')
      );
      setRejectOpen(false);
      onMutated?.();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  }

  async function handleTalentPool() {
    setActing(true);
    try {
      await candUpdateTalentPool(
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
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 pb-1.5 pt-0.5">
            Decide
          </div>
          <DropdownMenuItem
            className="gap-2.5 rounded-md px-2.5 py-2 cursor-pointer"
            disabled={acting || (!hasJobApplied && openJobs.length === 0)}
            onClick={() => {
              setSelectedJobId(candidate.appliedJobId || '');
              setApproveOpen(true);
            }}
          >
            <span className="flex items-center justify-center size-7 rounded-md bg-green-100 dark:bg-green-900/30 shrink-0">
              <CheckIcon className="size-3.5 text-green-600 dark:text-green-400" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm">Approve</span>
              <span className="text-[11px] text-muted-foreground">
                {hasJobApplied
                  ? 'Create application for applied job'
                  : 'Choose a job to approve into'}
              </span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            className="gap-2.5 rounded-md px-2.5 py-2 cursor-pointer"
            disabled={acting}
            onClick={() => setRejectOpen(true)}
          >
            <span className="flex items-center justify-center size-7 rounded-md bg-red-100 dark:bg-red-900/30 shrink-0">
              <XIcon className="size-3.5 text-red-600 dark:text-red-400" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm">Reject</span>
              <span className="text-[11px] text-muted-foreground">
                {liveApplication
                  ? 'Remove from this job only'
                  : 'Choose a reason and destination'}
              </span>
            </span>
          </DropdownMenuItem>
          <div className="mx-2 my-2 h-px bg-border" />
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 pb-1.5 pt-0.5">
            Talent Pool
          </div>
          <DropdownMenuItem
            className="gap-2.5 rounded-md px-2.5 py-2 cursor-pointer"
            disabled={acting}
            onClick={handleTalentPool}
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
              <span className="text-sm">Email</span>
              <span className="text-[11px] text-muted-foreground">
                Compose and send an email
              </span>
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ComposeEmailSheet
        open={composeOpen}
        onOpenChange={setComposeOpen}
        mode={{
          type: 'prefill',
          to: candidate.email,
          subject: '',
          body: '',
          templateType: 'general',
          context: { type: 'general', candidateId: candidate._id },
          variables: {
            candidateName: name,
            candidateEmail: candidate.email,
            candidatePhone: candidate.phone ?? '',
            jobTitle: '',
            clientName: '',
            currentStage: '',
            senderName: (() => {
              const u = useAuthStore.getState().user;
              return u ? `${u.firstName} ${u.lastName}`.trim() : '';
            })(),
          },
        }}
      />

      <Dialog
        open={approveOpen}
        onOpenChange={v => {
          if (!v) setApproveOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve {name}</DialogTitle>
            <DialogDescription>
              {hasJobApplied
                ? 'This will approve the candidate and create an application for the job they applied to. AI scoring will run automatically.'
                : 'This candidate did not apply through a job posting. Choose the job to approve them into — an application is created at the first pipeline stage.'}
            </DialogDescription>
          </DialogHeader>
          {!hasJobApplied && (
            <div className="space-y-3">
              <Label>Select Job</Label>
              <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a job..." />
                </SelectTrigger>
                <SelectContent>
                  {openJobs.map(j => (
                    <SelectItem key={j._id} value={j._id}>
                      {j.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={acting || (hasJobApplied ? false : !selectedJobId)}
            >
              {acting ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <CheckIcon className="size-4" />
              )}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject — routes by scope. A candidate with no live application is
          rejected at candidate level (the destination is always offered, spec
          §4.8). One that still holds a live application is rejected at
          application level, which removes them from that job only — the dialog
          then hides the destination options. */}
      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        candidateName={name}
        jobTitle={
          liveApplication
            ? allJobs.find(j => j._id === liveApplication.jobId)?.title
            : candidate.appliedJobId
              ? allJobs.find(j => j._id === candidate.appliedJobId)?.title
              : undefined
        }
        currentStageName={liveApplication?.currentStage?.stageName}
        hasOtherLiveApplication={otherLiveApplicationCount > 0}
        submitting={acting}
        onConfirm={handleReject}
      />
    </>
  );
}
