import type { ComposeMode } from '@/app/emails/_components/compose-email-sheet';
import { buildCandidateComposeMode } from '@/app/emails/_utils/candidate-compose';
import type { RejectPayload } from '@/components/reject-dialog';
import { useApplicationStore } from '@/store/slices/applications.store';
import { useCandidateStore } from '@/store/slices/candidates.store';
import type { Application, Candidate } from '@/store/types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { CandidateTabValue } from '../_utils/candidate-tabs';
import { runAllWithConcurrency } from '../_utils/run-with-concurrency';
import type { useCandidateApplicationMaps } from './use-candidate-application-maps';

interface BulkActionsArgs {
  items: Candidate[];
  filteredData: Candidate[];
  allApps: Application[];
  activeTab: CandidateTabValue;
  jobIdFilter: string;
  query: string;
  maps: ReturnType<typeof useCandidateApplicationMaps>;
}

/** Row selection and the bulk actions (stage, reject, pool, email) on it. */
export function useCandidateBulkActions({
  items,
  filteredData,
  allApps,
  activeTab,
  jobIdFilter,
  query,
  maps,
}: BulkActionsArgs) {
  const {
    stageInfoByCandidateId,
    pendingApplicationByCandidateId,
    liveApplicationByCandidateId,
  } = maps;
  const updateTalentPool = useCandidateStore(s => s.updateTalentPool);
  const rejectCandidateStore = useCandidateStore(s => s.rejectCandidate);
  const moveStageApp = useApplicationStore(s => s.moveStage);
  const rejectApp = useApplicationStore(s => s.reject);
  const moveAppToTalentPool = useApplicationStore(s => s.moveToTalentPool);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStageOpen, setBulkStageOpen] = useState(false);
  const [bulkStageId, setBulkStageId] = useState('');
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
  const [bulkPoolMoveOpen, setBulkPoolMoveOpen] = useState(false);
  const [bulkActing, setBulkActing] = useState(false);
  const [bulkComposeOpen, setBulkComposeOpen] = useState(false);
  const [bulkComposeMode, setBulkComposeMode] = useState<ComposeMode>({
    type: 'new',
  });

  // ── Bulk selection helpers ───────────────────────────────────────
  const selectedCount = selectedIds.size;
  const allFilteredSelected =
    filteredData.length > 0 && filteredData.every(c => selectedIds.has(c._id));

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      const allSelected =
        filteredData.length > 0 && filteredData.every(c => prev.has(c._id));
      if (allSelected) return new Set();
      return new Set(filteredData.map(c => c._id));
    });
  }, [filteredData]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Clear selection whenever the effective filter changes so stale IDs from a
  // previous tab/search/job can't be accidentally bulk-acted on.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIds(new Set());
  }, [activeTab, jobIdFilter, query]);

  // Stages offered by the bulk "Move to Stage" dialog (from the first
  // selected candidate's job pipeline).
  const bulkStageOptions = useMemo(() => {
    const firstId = [...selectedIds][0];
    const info = firstId ? stageInfoByCandidateId.get(firstId) : undefined;
    return (info?.stages ?? []).filter(s => s.isActive !== false);
  }, [selectedIds, stageInfoByCandidateId]);

  // ── Bulk action handlers ─────────────────────────────────────────
  /**
   * Bulk email. Every reachable selected candidate's address goes into the
   * single To list, so one send reaches all of them.
   *
   * A selection can mix candidates with and without an email address; the ones
   * that cannot be reached are reported instead of being silently dropped, and
   * an all-unreachable selection refuses to open the composer at all.
   */
  function openBulkCompose() {
    if (selectedCount === 0) return;
    const selectedRows = items.filter(c => selectedIds.has(c._id));
    const reachable = selectedRows.filter(c => (c.email ?? '').trim());
    if (reachable.length === 0) {
      toast.error('None of the selected candidates has an email address.');
      return;
    }
    const skipped = selectedRows.length - reachable.length;
    if (skipped > 0) {
      toast.info(
        `Emailing ${reachable.length} of ${selectedRows.length} selected — ${skipped} ${skipped === 1 ? 'has' : 'have'} no email address.`
      );
    }
    setBulkComposeMode(buildCandidateComposeMode(reachable));
    setBulkComposeOpen(true);
  }

  async function handleBulkTalentPool() {
    if (selectedCount === 0) return;
    setBulkActing(true);
    const ids = [...selectedIds];
    const results = await runAllWithConcurrency(
      ids.map(id => () => updateTalentPool(id, 'add'))
    );
    setBulkActing(false);
    const ok = results.filter(r => r.status === 'fulfilled').length;
    clearSelection();
    if (ok === ids.length) {
      toast.success(
        `${ok} ${ok === 1 ? 'candidate' : 'candidates'} added to Talent Pool`
      );
    } else {
      toast.error(`Added ${ok} of ${ids.length} — some candidates failed`);
    }
  }

  /**
   * Bulk "Remove from job → Talent Pool".
   *
   * Closes each selected candidate's application for the job in view and parks
   * them in the Talent Pool. Not a rejection: no reason is asked for and none
   * is recorded. When a job filter is active only that job's application is
   * closed; any other job the candidate is on is left alone.
   */
  async function handleBulkMoveToTalentPool() {
    if (selectedCount === 0) return;
    setBulkActing(true);
    const ids = [...selectedIds];
    const results = await runAllWithConcurrency(
      ids.map(id => async () => {
        const live = allApps.filter(
          a =>
            a.candidateId === id &&
            (a.phase === 'pending' || a.phase === 'approved')
        );
        const stageAppId = stageInfoByCandidateId.get(id)?.applicationId;
        const target = jobIdFilter
          ? live.find(a => a.jobId === jobIdFilter)
          : (live.find(a => a._id === stageAppId) ?? live[0]);
        if (!target) throw new Error('No live application');
        return moveAppToTalentPool(target._id);
      })
    );
    setBulkActing(false);
    setBulkPoolMoveOpen(false);
    clearSelection();
    const ok = results.filter(r => r.status === 'fulfilled').length;
    if (ok === ids.length) {
      toast.success(
        `${ok} ${ok === 1 ? 'candidate' : 'candidates'} moved to Talent Pool`
      );
    } else {
      toast.error(`Moved ${ok} of ${ids.length} — some candidates failed`);
    }
  }

  /**
   * Bulk reject.
   *
   * Each candidate is rejected through the endpoint matching their state:
   * In Review candidates have no application yet, so they go through the
   * candidate-level reject; pipeline candidates go through their application.
   *
   * The destination is applied per candidate. In Review candidates always
   * receive it. Pipeline candidates only receive it when this is their last
   * live application — otherwise a plain reject removes them from that job and
   * leaves their other pipelines untouched (spec §4.8).
   */
  async function handleBulkReject(payload: RejectPayload) {
    if (selectedCount === 0) return;
    setBulkActing(true);
    const ids = [...selectedIds];
    const results = await runAllWithConcurrency(
      ids.map(id => () => {
        // Prefer the live application whenever one exists. Falling back to a
        // stage-derived id would miss approved applications with a null
        // currentStage and wrongly route them to the candidate endpoint.
        const appId =
          liveApplicationByCandidateId.get(id) ??
          (activeTab === 'approved'
            ? stageInfoByCandidateId.get(id)?.applicationId
            : pendingApplicationByCandidateId.get(id));

        // No application at all — a genuine In Review candidate. Reject at
        // candidate level, which is what moves them to Talent Pool/Ineligible.
        if (!appId) {
          return rejectCandidateStore(id, {
            rejectionReasonId: payload.rejectionReasonId,
            ...(payload.destination
              ? { destination: payload.destination }
              : {}),
            ...(payload.internalNotes
              ? { internalNotes: payload.internalNotes }
              : {}),
          });
        }

        // Pipeline — the backend ignores the destination when the candidate
        // still holds another live application, so it is safe to pass through.
        return rejectApp(appId, payload);
      })
    );
    setBulkActing(false);
    setBulkRejectOpen(false);
    clearSelection();
    const ok = results.filter(r => r.status === 'fulfilled').length;
    if (ok === ids.length) {
      toast.success(`${ok} ${ok === 1 ? 'candidate' : 'candidates'} rejected`);
    } else {
      toast.error(`Rejected ${ok} of ${ids.length} — some candidates failed`);
    }
  }

  async function handleBulkMoveStage() {
    if (selectedCount === 0 || !bulkStageId) return;
    setBulkActing(true);
    const ids = [...selectedIds];
    const results = await runAllWithConcurrency(
      ids.map(id => () => {
        const info = stageInfoByCandidateId.get(id);
        if (!info || !info.stages.some(s => s._id === bulkStageId)) {
          return Promise.reject(new Error('Stage not available for candidate'));
        }
        return moveStageApp(info.applicationId, bulkStageId);
      })
    );
    setBulkActing(false);
    setBulkStageOpen(false);
    setBulkStageId('');
    clearSelection();
    const ok = results.filter(r => r.status === 'fulfilled').length;
    if (ok === ids.length) {
      toast.success(
        `${ok} ${ok === 1 ? 'candidate' : 'candidates'} moved to stage`
      );
    } else {
      toast.error(`Moved ${ok} of ${ids.length} — some candidates failed`);
    }
  }

  return {
    selectedIds,
    selectedCount,
    allFilteredSelected,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    bulkActing,
    bulkStageOpen,
    setBulkStageOpen,
    bulkStageId,
    setBulkStageId,
    bulkStageOptions,
    bulkRejectOpen,
    setBulkRejectOpen,
    bulkPoolMoveOpen,
    setBulkPoolMoveOpen,
    bulkComposeOpen,
    setBulkComposeOpen,
    bulkComposeMode,
    openBulkCompose,
    handleBulkTalentPool,
    handleBulkMoveToTalentPool,
    handleBulkReject,
    handleBulkMoveStage,
  };
}
