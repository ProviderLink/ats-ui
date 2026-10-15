import { logOptimisticActivity } from '@/lib/activity';
import type { RejectPayload } from '@/components/reject-dialog';
import { useApplicationStore } from '@/store/slices/applications.store';
import { useCandidateStore } from '@/store/slices/candidates.store';
import type { Application, Candidate } from '@/store/types';
import { useState } from 'react';
import { toast } from 'sonner';
import type { ApproveVariant } from '../_components/approve-candidate-dialog';

const APPROVE_FLOWS: Record<
  ApproveVariant,
  { addToPool: boolean; openComposer: boolean }
> = {
  approve: { addToPool: false, openComposer: false },
  email: { addToPool: false, openComposer: true },
  emailPool: { addToPool: true, openComposer: true },
};

interface ApproveContext {
  applicationId: string;
  jobId: string;
}

/**
 * Approve / reject / talent-pool actions for candidates that are still In
 * Review (the "pending" footer), plus the dialog state they drive.
 */
export function useCandidateReviewActions(
  candidate: Candidate | null,
  fullName: string,
  pendingApplication: Application | null,
  candidateApplications: Application[],
  openCompose: (flow: 'approve' | 'reject', context?: ApproveContext) => void
) {
  const approveApp = useApplicationStore(s => s.approve);
  const rejectApp = useApplicationStore(s => s.reject);
  const approveCandidate = useCandidateStore(s => s.approve);
  const rejectCandidate = useCandidateStore(s => s.rejectCandidate);
  const updateTalentPool = useCandidateStore(s => s.updateTalentPool);

  const [actionLoading, setActionLoading] = useState(false);
  const [approveVariant, setApproveVariant] = useState<ApproveVariant>('approve');
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveJobId, setApproveJobId] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectEmailOpen, setRejectEmailOpen] = useState(false);
  const [talentPoolOpen, setTalentPoolOpen] = useState(false);

  function openApprove(variant: ApproveVariant, appliedJobId?: string | null) {
    setApproveJobId(appliedJobId || '');
    setApproveVariant(variant);
    setApproveOpen(true);
  }

  function handleApproveOpenChange(open: boolean) {
    setApproveOpen(open);
    if (!open) setApproveJobId('');
  }

  async function handleAddToTalentPool(notes: string) {
    if (!candidate) return;
    try {
      await updateTalentPool(candidate._id, 'add', notes);
      logOptimisticActivity(
        'candidate',
        candidate._id,
        'talent_pool_added',
        `${fullName} added to talent pool`
      );
      toast.success('Added to Talent Pool');
      setTalentPoolOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  /**
   * Approve in one of three flavours — plain, then open the email composer, or
   * additionally add to the talent pool. A pending candidate has no
   * application yet, so the candidate is approved into the chosen job; an
   * approved candidate with a pending application approves that application.
   */
  async function handleApproveConfirm() {
    if (!candidate) return;
    const { addToPool, openComposer } = APPROVE_FLOWS[approveVariant];
    const pooledMessage = addToPool
      ? 'Approved & added to Talent Pool'
      : null;
    if (candidate.status === 'pending') {
      if (!approveJobId) {
        toast.error('Please select a job to assign this candidate to');
        return;
      }
      setActionLoading(true);
      try {
        const result = await approveCandidate(candidate._id, approveJobId);
        if (addToPool) await updateTalentPool(candidate._id, 'add', '');
        logOptimisticActivity(
          'candidate',
          candidate._id,
          'approved',
          `${fullName} approved`
        );
        logOptimisticActivity(
          'application',
          result.applicationId,
          'applied',
          'Application created'
        );
        if (addToPool) {
          logOptimisticActivity(
            'candidate',
            candidate._id,
            'talent_pool_added',
            `${fullName} added to talent pool`
          );
        }
        toast.success(pooledMessage ?? 'Candidate approved');
        setApproveJobId('');
        setApproveOpen(false);
        if (openComposer) {
          openCompose('approve', {
            applicationId: result.applicationId,
            jobId: result.jobId,
          });
        }
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setActionLoading(false);
      }
      return;
    }
    if (!pendingApplication) {
      toast.error('No pending application to approve');
      setApproveOpen(false);
      return;
    }
    setActionLoading(true);
    try {
      await approveApp(pendingApplication._id);
      if (addToPool) await updateTalentPool(candidate._id, 'add', '');
      logOptimisticActivity(
        'application',
        pendingApplication._id,
        'approved',
        'Application approved'
      );
      if (addToPool) {
        logOptimisticActivity(
          'candidate',
          candidate._id,
          'talent_pool_added',
          `${fullName} added to talent pool`
        );
      }
      toast.success(pooledMessage ?? 'Application approved');
      setApproveOpen(false);
      if (openComposer) openCompose('approve');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActionLoading(false);
    }
  }

  /**
   * Reject a candidate who is still In Review.
   *
   * Normally they hold no application, so this goes through the
   * candidate-level endpoint. If they DO hold a live application (possible
   * after an eligibility flip and restore), the candidate endpoint would
   * refuse — so route to that application instead, which removes them from
   * just that job.
   */
  async function rejectCandidateOrApplication(
    target: Candidate,
    payload: RejectPayload
  ) {
    const liveApp = candidateApplications.find(
      a => a.phase === 'pending' || a.phase === 'approved'
    );
    if (liveApp) {
      await rejectApp(liveApp._id, payload);
    } else {
      await rejectCandidate(target._id, payload);
    }
    logOptimisticActivity(
      'candidate',
      target._id,
      'rejected',
      'Candidate rejected',
      {
        reasonId: payload.rejectionReasonId,
        destination: payload.destination ?? null,
      }
    );
  }

  async function handleRejectConfirm(payload: RejectPayload) {
    if (!candidate) {
      setRejectOpen(false);
      return;
    }
    setActionLoading(true);
    try {
      await rejectCandidateOrApplication(candidate, payload);
      toast.success(
        `${fullName} rejected` +
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
      setActionLoading(false);
    }
  }

  async function handleRejectAndEmailConfirm(payload: RejectPayload) {
    if (!candidate) {
      setRejectEmailOpen(false);
      return;
    }
    setActionLoading(true);
    try {
      await rejectCandidateOrApplication(candidate, payload);
      toast.success(`${fullName} rejected`);
      setRejectEmailOpen(false);
      openCompose('reject');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActionLoading(false);
    }
  }

  return {
    actionLoading,
    approveVariant,
    approveOpen,
    approveJobId,
    setApproveJobId,
    openApprove,
    handleApproveOpenChange,
    handleApproveConfirm,
    rejectOpen,
    setRejectOpen,
    handleRejectConfirm,
    rejectEmailOpen,
    setRejectEmailOpen,
    handleRejectAndEmailConfirm,
    talentPoolOpen,
    setTalentPoolOpen,
    handleAddToTalentPool,
  };
}
