import { deleteJson, patchJson } from '@/lib/api-client';
import { useCandidateStore } from '@/store/slices/candidates.store';
import type { Candidate } from '@/store/types';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

const fullName = (c: Candidate) => `${c.firstName} ${c.lastName}`;

export function useIneligibleActions() {
  const fetchIneligible = useCandidateStore(s => s.fetchIneligible);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [holdTogglingId, setHoldTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /**
   * A job is always required: the candidate returns to In Review as a normal
   * pending applicant for that job and is approved through the usual flow.
   * No application is created here.
   */
  async function restore(candidate: Candidate, jobId: string) {
    setRestoringId(candidate._id);
    try {
      await useCandidateStore
        .getState()
        .restoreCandidate(candidate._id, { jobId });
      toast.success(`${fullName(candidate)} restored — now in review`);
      return true;
    } catch (e) {
      toast.error((e as Error).message || 'Failed to restore candidate');
      return false;
    } finally {
      setRestoringId(null);
    }
  }

  /**
   * The only place in the ATS where permanent deletion is allowed; elsewhere
   * candidates are closed out by rejecting them so their history is kept. The
   * backend enforces the same rule.
   */
  async function remove(candidate: Candidate) {
    setDeletingId(candidate._id);
    try {
      await deleteJson(`/ats/candidates/${candidate._id}`);
      toast.success(`${fullName(candidate)} permanently deleted`);
      await fetchIneligible(true);
      return true;
    } catch (e) {
      toast.error((e as Error).message || 'Failed to delete candidate');
      return false;
    } finally {
      setDeletingId(null);
    }
  }

  const toggleLegalHold = useCallback(
    async (id: string, current: boolean) => {
      setHoldTogglingId(id);
      try {
        await patchJson(`/ats/candidates/${id}/legal-hold`, {
          legalHold: !current,
        });
        toast.success(`Legal hold ${!current ? 'enabled' : 'disabled'}`);
        await fetchIneligible(true);
      } catch (e) {
        toast.error((e as Error).message || 'Failed to toggle legal hold');
      } finally {
        setHoldTogglingId(null);
      }
    },
    [fetchIneligible]
  );

  return {
    restoringId,
    holdTogglingId,
    deletingId,
    restore,
    remove,
    toggleLegalHold,
  };
}
