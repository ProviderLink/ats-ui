import type { RejectPayload } from '@/components/reject-dialog';
import { useApplicationStore } from '@/store/slices/applications.store';
import { useCandidateStore } from '@/store/slices/candidates.store';
import type { Application, Candidate, Job } from '@/store/types';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface UseReviewActionsArgs {
  candidate: Candidate;
  allJobs: Job[];
  allApps: Application[];
  closeDialog: () => void;
  onMutated?: () => void;
}

export function useReviewActions({
  candidate,
  allJobs,
  allApps,
  closeDialog,
  onMutated,
}: UseReviewActionsArgs) {
  const candApprove = useCandidateStore(s => s.approve);
  const candUpdateTalentPool = useCandidateStore(s => s.updateTalentPool);
  const rejectCandidateStore = useCandidateStore(s => s.rejectCandidate);
  const appFetchScopedMerge = useApplicationStore(s => s.fetchScopedMerge);
  const rejectApp = useApplicationStore(s => s.reject);
  const [acting, setActing] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState('');

  const name = `${candidate.firstName} ${candidate.lastName}`;
  const appliedJobId = candidate.appliedJobId;

  const openJobs = useMemo(
    () => allJobs.filter(j => j.status === 'open'),
    [allJobs]
  );

  // Keyed on PHASE rather than on having a stage: an approved application can
  // have a null `currentStage`, and routing such a candidate to the
  // candidate-level endpoint would be refused (they still hold a live
  // application).
  const { liveApplication, otherLiveApplicationCount } = useMemo(() => {
    const live = allApps.filter(
      a =>
        a.candidateId === candidate._id &&
        (a.phase === 'pending' || a.phase === 'approved')
    );
    const current = live[0] ?? null;
    return {
      liveApplication: current,
      // Non-zero means a reject must not ban or pool them — that would
      // silently destroy the other job's pipeline.
      otherLiveApplicationCount: current ? live.length - 1 : 0,
    };
  }, [allApps, candidate._id]);

  const rejectJobTitle = allJobs.find(
    j => j._id === (liveApplication?.jobId ?? appliedJobId)
  )?.title;

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

  function startApprove() {
    setSelectedJobId(appliedJobId || '');
  }

  async function approve() {
    const jobId = appliedJobId ? appliedJobId : selectedJobId;
    if (!jobId) {
      toast.error('Please select a job to assign this candidate to');
      return;
    }
    await run(async () => {
      await candApprove(candidate._id, jobId);
      toast.success(`${name} approved`);
      closeDialog();
      setSelectedJobId('');
      // `fetchScopedMerge` is the one that writes: `appStore.fetch` carries no
      // explicit filter and the post-boot guard makes it a no-op. Without it
      // the In Pipeline tab misses the new application until the
      // `application:created` socket event.
      await appFetchScopedMerge({ limit: 9999 });
      onMutated?.();
    });
  }

  // A candidate holding a live application is really a pipeline candidate: the
  // candidate endpoint would refuse with 409 (a destination there bans or pools
  // them platform-wide), so route to that application, which removes them from
  // just that job. Reachable when a candidate is restored from Ineligible while
  // a previous application is still live.
  async function reject(payload: RejectPayload) {
    await run(async () => {
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
      closeDialog();
      onMutated?.();
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

  return {
    name,
    acting,
    openJobs,
    selectedJobId,
    setSelectedJobId,
    liveApplication,
    otherLiveApplicationCount,
    rejectJobTitle,
    startApprove,
    approve,
    reject,
    toggleTalentPool,
  };
}
