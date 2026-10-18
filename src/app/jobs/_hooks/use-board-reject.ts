import type { RejectPayload } from '@/components/reject-dialog';
import type { Application } from '@/store';
import { useApplicationStore } from '@/store';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  candidateFullName,
  type AppWithCandidate,
} from '../_utils/pipeline-board';

export function useBoardReject(applications: Application[]) {
  const rejectApp = useApplicationStore(s => s.reject);
  const [target, setTarget] = useState<AppWithCandidate | null>(null);
  const [rejecting, setRejecting] = useState(false);

  // When non-zero the dialog hides the destination options, because banning or
  // pooling would silently destroy the other job's pipeline.
  const otherLiveApplicationCount = useMemo(() => {
    if (!target) return 0;
    return applications.filter(
      a =>
        a.candidateId === target.candidate._id &&
        a._id !== target.application._id &&
        (a.phase === 'pending' || a.phase === 'approved')
    ).length;
  }, [applications, target]);

  // The card moves to the Rejected column on its own: that column is derived
  // from `phase === 'rejected'`, which the store patches in place.
  async function reject(payload: RejectPayload) {
    if (!target) return;
    setRejecting(true);
    try {
      await rejectApp(target.application._id, payload);
      toast.success(
        `${candidateFullName(target.candidate)} rejected` +
          (payload.destination === 'permanently_ineligible'
            ? ' and marked permanently ineligible'
            : payload.destination === 'candidate_pool'
              ? ' and moved to Talent Pool'
              : '')
      );
      setTarget(null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRejecting(false);
    }
  }

  return {
    target,
    setTarget,
    rejecting,
    otherLiveApplicationCount,
    reject,
  };
}
