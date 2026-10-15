import { logOptimisticActivity } from '@/lib/activity';
import { patchJson } from '@/lib/api-client';
import { useCandidateStore } from '@/store/slices/candidates.store';
import { useClientStore } from '@/store/slices/clients.store';
import { useJobStore } from '@/store/slices/jobs.store';
import type { Candidate } from '@/store/types';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

/** Admin actions for a permanently ineligible candidate: restore, legal hold, delete. */
export function useIneligibleActions(
  candidate: Candidate | null,
  fullName: string,
  onClosed: () => void
) {
  const restoreCandidate = useCandidateStore(s => s.restoreCandidate);
  const removeCandidate = useCandidateStore(s => s.remove);
  const jobs = useJobStore(s => s.items);
  const clients = useClientStore(s => s.items);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  /** Open jobs with the client name resolved, for the restore job picker. */
  const restoreJobs = useMemo(() => {
    const clientMap = new Map(clients.map(c => [c._id, c.companyName]));
    return jobs
      .filter(j => j.status === 'open')
      .map(j => ({
        _id: j._id,
        title: j.title,
        clientName: clientMap.get(j.clientId) ?? '',
      }));
  }, [jobs, clients]);

  /**
   * Restore a permanently ineligible candidate. A job is required — they return
   * to **In Review** and must be approved normally; no application is created.
   */
  async function handleRestoreConfirm(target: Candidate, jobId: string) {
    setLoading(true);
    try {
      await restoreCandidate(target._id, { jobId });
      logOptimisticActivity(
        'candidate',
        target._id,
        'eligibility_changed',
        `${fullName} restored from permanently ineligible`
      );
      toast.success('Candidate restored — now in review');
      setRestoreOpen(false);
      onClosed();
    } catch (e) {
      toast.error((e as Error).message || 'Failed to restore candidate');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Permanently delete a candidate. Mirrors the Ineligible list — this is the
   * only path in the ATS that removes a candidate and all their history.
   */
  async function handleDeleteConfirm() {
    if (!candidate) return;
    setLoading(true);
    try {
      await removeCandidate(candidate._id);
      toast.success('Candidate permanently deleted');
      setDeleteOpen(false);
      onClosed();
    } catch (e) {
      toast.error((e as Error).message || 'Failed to delete candidate');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleLegalHold() {
    if (!candidate) return;
    setLoading(true);
    try {
      const next = !candidate.legalHold;
      await patchJson(`/ats/candidates/${candidate._id}/legal-hold`, {
        legalHold: next,
      });
      toast.success(`Legal hold ${next ? 'enabled' : 'disabled'}`);
      // The candidate prop is owned by the parent; refetch into the store so
      // the sheet reflects the new hold state without closing.
      await useCandidateStore.getState().fetchOne(candidate._id);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to toggle legal hold');
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    restoreJobs,
    restoreOpen,
    setRestoreOpen,
    deleteOpen,
    setDeleteOpen,
    handleRestoreConfirm,
    handleDeleteConfirm,
    handleToggleLegalHold,
  };
}
