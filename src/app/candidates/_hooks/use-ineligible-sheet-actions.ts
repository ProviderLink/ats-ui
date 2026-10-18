import { useIneligibleActions } from '@/hooks/use-ineligible-actions';
import { useRestoreJobOptions } from '@/hooks/use-restore-job-options';
import type { Candidate } from '@/store/types';
import { useState } from 'react';

/** Restore / delete / legal-hold dialogs for the candidate sheet. */
export function useIneligibleSheetActions(
  candidate: Candidate | null,
  onClosed: () => void
) {
  const actions = useIneligibleActions();
  const restoreJobs = useRestoreJobOptions();
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleRestoreConfirm(target: Candidate, jobId: string) {
    if (!(await actions.restore(target, jobId))) return;
    setRestoreOpen(false);
    onClosed();
  }

  async function handleDeleteConfirm() {
    if (!candidate || !(await actions.remove(candidate))) return;
    setDeleteOpen(false);
    onClosed();
  }

  async function handleToggleLegalHold() {
    if (!candidate) return;
    await actions.toggleLegalHold(candidate._id, !!candidate.legalHold);
  }

  return {
    loading: !!(
      actions.restoringId ||
      actions.deletingId ||
      actions.holdTogglingId
    ),
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
