import { ComposeEmailSheet, type ComposeMode } from '@/app/emails/_components/compose-email-sheet';
import { buildCandidateComposeMode } from '@/app/emails/_utils/candidate-compose';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { RejectDialog, type RejectPayload } from '@/components/reject-dialog';
import { TablePagination } from '@/components/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSocketRoom } from '@/hooks/use-socket-room';
import { useTablePagination } from '@/hooks/use-table-pagination';
import { cn, formatDate, sortableTime } from '@/lib/utils';
import { useApplicationStore } from '@/store/slices/applications.store';
import { useCandidateStore } from '@/store/slices/candidates.store';
import { useClientStore } from '@/store/slices/clients.store';
import { useJobStore } from '@/store/slices/jobs.store';
import type { Candidate, CandidateStatus, Job } from '@/store/types';
import { flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from '@tanstack/react-table';
import { ArrowUpDownIcon, BanIcon, ChevronDownIcon, EllipsisIcon, GitCommitHorizontalIcon, MailIcon, PlusIcon, SearchIcon, SparklesIcon, StarIcon, UserMinusIcon, XIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CandidateDetailSheet } from './candidate-detail-sheet';
import { ColHeader } from '@/components/candidate-table/col-header';
import { SORT_BTN_CLS, SortHeader } from '@/components/candidate-table/sort-header';
import { CandidateCell } from '@/components/candidate-table/candidate-cell';
import { TableSkeleton } from '@/components/candidate-table/table-skeleton';
import { runAllWithConcurrency } from '../_utils/run-with-concurrency';
import { AiScoreCell } from './ai-score-cell';
import { CurrentRoleCell } from './current-role-cell';
import { SkillsCell } from './skills-cell';
import { PipelineStageSelectCell } from './pipeline-stage-select-cell';
import { ReviewActionsDropdown } from './review-actions-dropdown';
import { PipelineActionsMenu } from './pipeline-actions-menu';
import { TabCountChip } from './tab-count-chip';
import { CANDIDATE_SORT_LABELS, CANDIDATE_SORT_OPTIONS, type CandidateSortOption } from '../_utils/candidate-sort';

/**
 * Tabs this page actually renders. Hired deliberately has its own page
 * (`/ats/hired`), so it is not a value here — narrowing the type is what keeps
 * the `isHired` branches from silently coming back.
 */
type TabValue = Extract<CandidateStatus, 'pending' | 'approved'>;

export function CandidatesTable() {
  // ── Store subscriptions ──────────────────────────────────────────
  const items = useCandidateStore(s => s.items);
  const loading = useCandidateStore(s => s.loading);
  const isRefreshing = useCandidateStore(s => s.isRefreshing);
  const mutating = useCandidateStore(s => s.mutating);
  const updateTalentPool = useCandidateStore(s => s.updateTalentPool);
  const rejectCandidateStore = useCandidateStore(s => s.rejectCandidate);

  const allApps = useApplicationStore(s => s.items);
  const moveStageApp = useApplicationStore(s => s.moveStage);
  const rejectApp = useApplicationStore(s => s.reject);
  const moveAppToTalentPool = useApplicationStore(s => s.moveToTalentPool);

  const allJobs = useJobStore(s => s.items);
  const allClients = useClientStore(s => s.items);

  const [activeTab, setActiveTab] = useState<TabValue>('pending');
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const [openStageRowId, setOpenStageRowId] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ]);
  const [sortBy, setSortBy] = useState<CandidateSortOption>(() => {
    const raw = localStorage.getItem('candidates-sort-by') ?? '';
    return (CANDIDATE_SORT_OPTIONS as readonly string[]).includes(raw)
      ? (raw as CandidateSortOption)
      : 'newest';
  });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobIdFilter = searchParams.get('jobId') ?? '';
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Bulk selection state
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

  // Subscribe to real-time candidate and application updates
  useSocketRoom('candidates');
  useSocketRoom('applications');

  // Shared pagination state (see use-table-pagination). Behaviour is identical
  // to the per-table implementation it replaces: 20-row default, same size list,
  // `sessionStorage` index and `localStorage` size.
  const { pageIndex, pageSize, handlePaginationChange, resetPage } =
    useTablePagination({ storageKey: 'candidates', defaultSize: 20 });

  // Debounced search ref
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(null);

  // After boot, all candidates are already in the store. No fetch needed —
  // we filter client-side by activeTab instead of making server calls.

  // ── Derived maps from shared app/job/client stores ───────────────

  // candidateId → { jobTitle, clientName }[] for the Job column.
  //
  // Only live and hired applications count. A rejected application stays in the
  // database for history, so without this filter the column would keep showing
  // jobs the candidate was already rejected from — and after a job change it
  // would list the old job alongside the new one.
  const jobInfosByCandidateId = useMemo(() => {
    const jobById = new Map(allJobs.map(j => [j._id, j]));
    const clientNameById = new Map(allClients.map(c => [c._id, c.companyName]));
    const map = new Map<string, { jobTitle: string; clientName: string }[]>();
    for (const a of allApps) {
      if (a.phase === 'rejected') continue;
      const job = jobById.get(a.jobId);
      const title = job?.title ?? a.jobId;
      const clientName = job
        ? (clientNameById.get(job.clientId) ?? job.clientId)
        : '';
      const infos = map.get(a.candidateId) ?? [];
      if (!infos.some(i => i.jobTitle === title)) {
        infos.push({ jobTitle: title, clientName });
      }
      map.set(a.candidateId, infos);
    }
    return map;
  }, [allApps, allJobs, allClients]);

  // candidateId → { stageName, stageColor, assignedAt } for the Pipeline tab.
  // Only approved-phase applications count — rejected apps retain their last
  // currentStage for audit purposes but must not show in the pipeline tab.
  const stageInfoByCandidateId = useMemo(() => {
    const jobById = new Map(allJobs.map(j => [j._id, j]));
    const map = new Map<
      string,
      {
        stageName: string;
        stageColor: string;
        stageId: string;
        assignedAt: string;
        applicationId: string;
        stages: NonNullable<Job['pipeline']>['stages'];
      }
    >();
    for (const a of allApps) {
      if (a.phase !== 'approved' || !a.currentStage || map.has(a.candidateId))
        continue;
      const job = jobById.get(a.jobId);
      const stage = job?.pipeline?.stages?.find(
        s => s._id === a.currentStage!.stageId
      );
      map.set(a.candidateId, {
        stageName: a.currentStage.stageName,
        stageColor: stage?.color ?? '#3b82f6',
        stageId: a.currentStage.stageId,
        assignedAt: a.currentStage.assignedAt,
        applicationId: a._id,
        stages: job?.pipeline?.stages ?? [],
      });
    }
    return map;
  }, [allApps, allJobs]);

  // candidateId → pending application id (for the In Review tab's reject action).
  const pendingApplicationByCandidateId = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of allApps) {
      if (a.phase === 'pending' && !map.has(a.candidateId)) {
        map.set(a.candidateId, a._id);
      }
    }
    return map;
  }, [allApps]);

  /**
   * candidateId → id of ANY live application (pending or approved).
   *
   * Used to decide the reject endpoint. Keyed on phase rather than on having a
   * stage, because an approved application can have a null `currentStage` — and
   * routing that candidate to the candidate-level endpoint would be rejected
   * (they still hold a live application), producing a silent bulk failure.
   */
  const liveApplicationByCandidateId = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of allApps) {
      if (
        (a.phase === 'pending' || a.phase === 'approved') &&
        !map.has(a.candidateId)
      ) {
        map.set(a.candidateId, a._id);
      }
    }
    return map;
  }, [allApps]);

  // ── Helpers ──────────────────────────────────────────────────────

  function handleTabChange(tab: TabValue) {
    setActiveTab(tab);
    resetPage();
    setSorting([{ id: 'createdAt', desc: true }]);
    const defaultSort: CandidateSortOption = 'newest';
    setSortBy(defaultSort);
    localStorage.setItem('candidates-sort-by', defaultSort);
  }

  function handleSortChange(opt: CandidateSortOption) {
    setSortBy(opt);
    localStorage.setItem('candidates-sort-by', opt);
    resetPage();
  }

  function handleSearchChange(q: string) {
    // Update input immediately for responsive typing
    setInputValue(q);
    // Debounce the actual search query to avoid hammering the server
    if (searchTimer.current) clearTimeout(searchTimer.current);
    resetPage();
    searchTimer.current = setTimeout(() => {
      setQuery(q);
    }, 300);
  }

  function handleClearSearch() {
    setInputValue('');
    setQuery('');
    if (searchTimer.current) clearTimeout(searchTimer.current);
  }

  function openDetail(candidate: Candidate) {
    setSelected(candidate);
    setDetailOpen(true);
  }

  // Set of candidateIds who have at least one ACTIVE (approved-phase) application.
  // This is the source of truth for the "In Pipeline" tab — a candidate whose
  // only applications are rejected must not appear there even if their
  // candidate-level status hasn't been updated yet by the backend.
  const candidatesInPipelineIds = useMemo(
    () =>
      new Set(
        allApps.filter(a => a.phase === 'approved').map(a => a.candidateId)
      ),
    [allApps]
  );

  // Defensive fallback: if the application-store derived set is unexpectedly
  // empty while there are candidates with status 'approved' in the candidate
  // store, the application store has likely been corrupted by a lightweight
  // socket broadcast (e.g. triggered by a public apply).  Fall back to
  // candidate-level status so the Pipeline tab doesn't show zero.
  //
  // The fallback must never revive a candidate who has left the pipeline:
  // reject / remove-from-job leave `status` at 'approved', so anyone pooled,
  // banned, or who has application records at all is excluded.
  const pipelineIdsFallback = useMemo(() => {
    const withApplications = new Set(allApps.map(a => a.candidateId));
    return new Set(
      items
        .filter(
          c =>
            c.status === 'approved' &&
            !c.inTalentPool &&
            c.eligibilityStatus !== 'permanently_ineligible' &&
            !withApplications.has(c._id)
        )
        .map(c => c._id)
    );
  }, [items, allApps]);
  const effectivePipelineIds = useMemo(() => {
    if (candidatesInPipelineIds.size > 0) return candidatesInPipelineIds;
    if (pipelineIdsFallback.size > 0) return pipelineIdsFallback;
    return candidatesInPipelineIds;
  }, [candidatesInPipelineIds, pipelineIdsFallback]);

  // ── "In Review" membership ──────────────────────────────────────
  // A candidate is In Review when they are still pending AND not already
  // parked somewhere else. The flag exclusions are what make Reject and
  // "Add to Talent Pool" remove the row immediately: neither action changes
  // `status`, so without them the candidate would stay visible in this tab
  // with no remaining work to do.
  //
  // NOTE: public-apply candidates have NO application at this stage — the
  // application is only created at approval (see job.controller.ts). So this
  // rule must stay candidate-level; it cannot be application-derived.
  const isInReview = useCallback(
    (c: Candidate) =>
      c.status === 'pending' &&
      !c.inTalentPool &&
      c.eligibilityStatus !== 'permanently_ineligible',
    []
  );

  // candidateId → Set of jobIds the candidate is attached to, per tab.
  //  - In Review: the job they applied to (`appliedJobId`, set even though no
  //    application exists yet for public applies) plus any pending application.
  //  - In Pipeline: jobs with an approved (live) application.
  //  - Hired / other: any non-rejected application.
  // Used by both the ?jobId= filter and the job-title search so the two agree.
  const jobIdsForTab = useCallback(
    (c: Candidate, tab: string): Set<string> => {
      const ids = new Set<string>();
      for (const a of allApps) {
        if (a.candidateId !== c._id) continue;
        if (tab === 'pending') {
          if (a.phase === 'pending') ids.add(a.jobId);
        } else if (tab === 'approved') {
          if (a.phase === 'approved') ids.add(a.jobId);
        } else if (a.phase !== 'rejected') {
          ids.add(a.jobId);
        }
      }
      if (tab === 'pending' && c.appliedJobId) ids.add(c.appliedJobId);
      return ids;
    },
    [allApps]
  );

  // ── Tab counts derived from local data ──────────────────────────
  const counts = useMemo(() => {
    const inJob = (c: Candidate, tab: string) =>
      !jobIdFilter || jobIdsForTab(c, tab).has(jobIdFilter);
    return {
      pending: items.filter(c => isInReview(c) && inJob(c, 'pending')).length,
      approved: items.filter(
        c => effectivePipelineIds.has(c._id) && inJob(c, 'approved')
      ).length,
      hired: items.filter(c => c.status === 'hired' && inJob(c, 'hired'))
        .length,
    };
  }, [items, jobIdFilter, jobIdsForTab, effectivePipelineIds, isInReview]);

  // ── Client-side filtering by tab + search ────────────────────────
  // After boot, ALL candidates are in the store. We filter by activeTab
  // and search query locally — no server round-trip needed.
  const filteredData = useMemo(() => {
    // First filter by active tab
    let result = items.filter(c => {
      if (activeTab === 'approved') {
        return effectivePipelineIds.has(c._id);
      }
      if (activeTab === 'pending') {
        return isInReview(c);
      }
      return c.status === activeTab;
    });

    // Filter by job if jobId URL param is present
    if (jobIdFilter) {
      result = result.filter(c =>
        jobIdsForTab(c, activeTab).has(jobIdFilter)
      );
    }

    // Then apply search
    const q = query.trim().toLowerCase();
    if (q) {
      const jobById = new Map(allJobs.map(j => [j._id, j]));
      const clientNameById = new Map(
        allClients.map(c => [c._id, c.companyName])
      );
      result = result.filter(c => {
        const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
        if (fullName.includes(q)) return true;
        if (c.email?.toLowerCase().includes(q)) return true;
        if (c.phone?.toLowerCase().includes(q)) return true;
        const skills = (c.parsedData?.skills ?? []).join(' ').toLowerCase();
        if (skills.includes(q)) return true;
        const exp = c.parsedData?.experience?.[0];
        if (exp?.title?.toLowerCase().includes(q)) return true;
        if (exp?.company?.toLowerCase().includes(q)) return true;
        for (const jobId of jobIdsForTab(c, activeTab)) {
          const job = jobById.get(jobId);
          if (!job) continue;
          if (job.title?.toLowerCase().includes(q)) return true;
          const client = clientNameById.get(job.clientId);
          if (client?.toLowerCase().includes(q)) return true;
        }
        return false;
      });
    }
    return result;
  }, [
    items,
    query,
    activeTab,
    jobIdFilter,
    jobIdsForTab,
    allJobs,
    allClients,
    effectivePipelineIds,
    isInReview,
  ]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const aTime = sortableTime(a.createdAt);
      const bTime = sortableTime(b.createdAt);
      const aName = `${a.firstName} ${a.lastName}`.toLowerCase();
      const bName = `${b.firstName} ${b.lastName}`.toLowerCase();
      const aScore = a.aiScore?.score ?? a.aiValidation?.score ?? -1;
      const bScore = b.aiScore?.score ?? b.aiValidation?.score ?? -1;
      switch (sortBy) {
        case 'newest':
          return bTime - aTime;
        case 'oldest':
          return aTime - bTime;
        case 'a_z':
          return aName.localeCompare(bName);
        case 'z_a':
          return bName.localeCompare(aName);
        case 'highest_score':
          return bScore !== aScore ? bScore - aScore : bTime - aTime;
        case 'lowest_score':
          return aScore !== bScore ? aScore - bScore : bTime - aTime;
      }
    });
  }, [filteredData, sortBy]);

  // Client-side pagination
  const pagedData = useMemo(() => {
    const start = pageIndex * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, pageIndex, pageSize]);

  const data = pagedData;
  const totalRows = filteredData.length;

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

  const columns = useMemo<ColumnDef<Candidate>[]>(() => {
    const isPipeline = activeTab === 'approved';

    const stageCol: ColumnDef<Candidate> = {
      id: 'currentStage',
      header: () => <ColHeader>Current Stage</ColHeader>,
      cell: ({ row }) => {
        const info = stageInfoByCandidateId.get(row.original._id);
        if (!info)
          return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <PipelineStageSelectCell
            applicationId={info.applicationId}
            stageId={info.stageId}
            assignedAt={info.assignedAt}
            stages={info.stages}
            onOpenChange={open =>
              setOpenStageRowId(open ? row.original._id : null)
            }
          />
        );
      },
    };

    const roleCol: ColumnDef<Candidate> = {
      id: 'currentRole',
      accessorFn: row => row.parsedData?.experience?.[0]?.title ?? '',
      header: () => <ColHeader>Current Role</ColHeader>,
      cell: ({ row }) => <CurrentRoleCell candidate={row.original} />,
    };

    return [
      {
        id: 'select',
        header: () => (
          <Checkbox
            checked={
              allFilteredSelected
                ? true
                : selectedCount > 0
                  ? 'indeterminate'
                  : false
            }
            onCheckedChange={() => toggleSelectAll()}
            aria-label="Select all candidates"
          />
        ),
        cell: ({ row }) => (
          <div onClick={e => e.stopPropagation()}>
            <Checkbox
              checked={selectedIds.has(row.original._id)}
              onCheckedChange={() => toggleSelect(row.original._id)}
              aria-label={`Select ${row.original.firstName} ${row.original.lastName}`}
            />
          </div>
        ),
        enableSorting: false,
        size: 40,
      },
      {
        id: 'candidate',
        accessorFn: row => `${row.firstName} ${row.lastName}`,
        header: ({ column }) => (
          <SortHeader column={column} label="Candidate" />
        ),
        cell: ({ row }) => <CandidateCell candidate={row.original} />,
      },
      {
        id: 'jobs',
        header: () => <ColHeader>Job Applied</ColHeader>,
        cell: ({ row }) => {
          // Try app-based lookup first (candidates with an application)
          const appInfos = jobInfosByCandidateId.get(row.original._id);
          if (appInfos && appInfos.length > 0) {
            const first = appInfos[0];
            const rest = appInfos.slice(1);
            return (
              <div className="flex items-start gap-1.5 min-w-35 max-w-55 rounded-sm border border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/30 px-2 py-1 -my-1">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium whitespace-normal leading-tight">
                    {first.jobTitle}
                  </p>
                  {first.clientName && (
                    <p className="text-[11px] text-muted-foreground whitespace-normal leading-tight mt-0.5">
                      {first.clientName}
                    </p>
                  )}
                </div>
                {rest.length > 0 && (
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1 h-4 cursor-default shrink-0"
                        >
                          +{rest.length}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="text-xs max-w-56"
                      >
                        {rest.map(i => i.jobTitle).join(', ')}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            );
          }
          // Fallback: pending candidates have appliedJobId but no application yet
          const appliedJobId = row.original.appliedJobId;
          if (appliedJobId) {
            const job = allJobs.find(j => j._id === appliedJobId);
            const clientName = job
              ? (allClients.find(c => c._id === job.clientId)?.companyName ??
                '')
              : '';
            return (
              <div className="flex items-start gap-1.5 min-w-35 max-w-55 rounded-sm border border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/30 px-2 py-1 -my-1">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium whitespace-normal leading-tight">
                    {job?.title ?? appliedJobId}
                  </p>
                  {clientName && (
                    <p className="text-[11px] text-muted-foreground whitespace-normal leading-tight mt-0.5">
                      {clientName}
                    </p>
                  )}
                </div>
              </div>
            );
          }
          return <span className="text-xs text-muted-foreground">—</span>;
        },
      },
      ...(isPipeline ? [stageCol] : [roleCol]),
      {
        id: 'skills',
        accessorFn: row => (row.parsedData?.skills ?? []).join(' '),
        header: () => <ColHeader>Skills</ColHeader>,
        cell: ({ row }) => <SkillsCell candidate={row.original} />,
      },
      {
        id: 'aiScore',
        accessorFn: (row: Candidate) =>
          row.aiScore?.score ?? row.aiValidation?.score ?? -1,
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className={SORT_BTN_CLS}
            onClick={() => column.toggleSorting()}
          >
            <SparklesIcon className="size-3" />
            AI Score <ArrowUpDownIcon className="size-3" />
          </Button>
        ),
        cell: ({ row }) => <AiScoreCell candidate={row.original} />,
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className={SORT_BTN_CLS}
            onClick={() => column.toggleSorting()}
          >
            Applied <ArrowUpDownIcon className="size-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: 'actions',
        // Icon only, but LEFT-aligned to match the trigger button in the cell
        // below. The previous centred glyph sat roughly 16px to the right of
        // the button, so the header and its column did not read as one unit.
        header: () => (
          <ColHeader icon={<EllipsisIcon className="size-3.5" />} />
        ),
        cell: ({ row }) => (
          <div onClick={e => e.stopPropagation()}>
            {isPipeline ? (
              <PipelineActionsMenu
                candidate={row.original}
                allApps={allApps}
                allJobs={allJobs}
              />
            ) : (
              <ReviewActionsDropdown
                candidate={row.original}
                allJobs={allJobs}
                allApps={allApps}
              />
            )}
          </div>
        ),
      },
    ];
  }, [
    activeTab,
    jobInfosByCandidateId,
    stageInfoByCandidateId,
    allApps,
    allJobs,
    allClients,
    selectedIds,
    selectedCount,
    allFilteredSelected,
    toggleSelect,
    toggleSelectAll,
  ]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    onSortingChange: setSorting,
    onPaginationChange: handlePaginationChange,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
  });

  const hasFilters = inputValue.length > 0;

  return (
    <>
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        {/* Tabs */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3 flex-wrap shrink-0">
          <Tabs
            value={activeTab}
            onValueChange={v => handleTabChange(v as TabValue)}
          >
            <TabsList>
              {[
                {
                  value: 'pending' as const,
                  label: 'In Review',
                  count: counts.pending,
                },
                {
                  value: 'approved' as const,
                  label: 'In Pipeline',
                  count: counts.approved,
                },
              ].map(({ value, label, count }) => (
                <TabsTrigger key={value} value={value}>
                  {label} <TabCountChip n={count} />
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Toolbar */}
          <div className="flex items-center gap-3 sm:ml-auto flex-wrap">
            <div className="relative min-w-48 max-w-sm flex-1 sm:flex-none">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search candidates..."
                value={inputValue}
                onChange={e => handleSearchChange(e.target.value)}
                className="pl-8 pr-8 h-9"
              />
              {inputValue && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-0.5 top-1/2 -translate-y-1/2 size-7"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                >
                  <XIcon className="size-3.5" />
                </Button>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-9 gap-1.5 rounded-full text-xs border-dashed',
                    sortBy !== 'newest' &&
                      'border-solid border-primary text-primary'
                  )}
                >
                  <ArrowUpDownIcon className="size-3" />
                  {CANDIDATE_SORT_LABELS[sortBy]}
                  <ChevronDownIcon className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="text-xs">
                  Sort by
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {CANDIDATE_SORT_OPTIONS.map(opt => (
                  <DropdownMenuItem
                    key={opt}
                    onSelect={() => handleSortChange(opt)}
                    className={cn(
                      'text-sm',
                      sortBy === opt && 'font-medium text-primary'
                    )}
                  >
                    {CANDIDATE_SORT_LABELS[opt]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => navigate('/ats/candidates/quick-import')}
                  >
                    <PlusIcon />
                    Add Candidate
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add a new candidate</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <p className="text-xs text-muted-foreground -mt-1 shrink-0">
          {loading && data.length === 0
            ? 'Loading…'
            : isRefreshing
              ? 'Refreshing…'
              : `${totalRows} ${totalRows === 1 ? 'candidate' : 'candidates'}${hasFilters ? ' found' : ' total'}`}
        </p>

        {/* Bulk selection bar */}
        {selectedCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs shrink-0">
            <Badge variant="secondary" className="text-xs">
              {selectedCount} selected
            </Badge>

            {activeTab === 'approved' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBulkStageOpen(true)}
              >
                <GitCommitHorizontalIcon className="size-4" />
                Move to Stage
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkRejectOpen(true)}
            >
              <BanIcon className="size-4" />
              Reject
            </Button>

            {activeTab === 'approved' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBulkPoolMoveOpen(true)}
                disabled={bulkActing}
              >
                <UserMinusIcon className="size-4" />
                Remove from Job
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkTalentPool}
              disabled={bulkActing}
            >
              <StarIcon className="size-4" />
              Add to Talent Pool
            </Button>

            <Button size="sm" variant="outline" onClick={openBulkCompose}>
              <MailIcon className="size-4" />
              Email
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="ml-auto text-muted-foreground"
              onClick={clearSelection}
            >
              <XIcon className="size-4" />
              Clear
            </Button>
          </div>
        )}

        {/* Table */}
        <div className="relative rounded-lg border flex flex-col flex-1 min-h-0 overflow-hidden">
          <div
            className={cn(
              'pointer-events-none absolute inset-0 z-10 bg-background/40 opacity-0 transition-opacity duration-150 dark:bg-background/60',
              openStageRowId && 'opacity-100'
            )}
          />
          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-foreground/5 dark:bg-muted">
                {table.getHeaderGroups().map(hg => (
                  <TableRow
                    key={hg.id}
                    className="border-b hover:bg-transparent"
                  >
                    {hg.headers.map(h => (
                      <TableHead key={h.id} className="h-10 px-4">
                        {h.isPlaceholder
                          ? null
                          : flexRender(
                              h.column.columnDef.header,
                              h.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading && data.length === 0 ? (
                  <TableSkeleton cols={columns.length} />
                ) : table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map(row => (
                    <TableRow
                      key={row.id}
                      className={cn(
                        'border-b last:border-0 hover:bg-foreground/4 dark:hover:bg-white/3 cursor-pointer has-aria-expanded:bg-transparent',
                        openStageRowId === row.original._id &&
                          'relative z-20 bg-background/90'
                      )}
                      onClick={() => openDetail(row.original)}
                    >
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id} className="px-4 py-3">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-32 text-center text-sm text-muted-foreground"
                    >
                      No candidates found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="border-t px-2 py-2 shrink-0 bg-background">
            <TablePagination
              table={table}
              pageIndex={pageIndex}
              pageSize={pageSize}
              totalRows={totalRows}
              label="candidates"
            />
          </div>
        </div>
      </div>

      {/* Bulk Move to Stage Dialog */}
      <Dialog open={bulkStageOpen} onOpenChange={setBulkStageOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Move to Stage</DialogTitle>
            <DialogDescription>
              Move {selectedCount} selected{' '}
              {selectedCount === 1 ? 'candidate' : 'candidates'} to a pipeline
              stage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Select Stage</Label>
            <Select value={bulkStageId} onValueChange={setBulkStageId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a stage..." />
              </SelectTrigger>
              <SelectContent>
                {bulkStageOptions.map(s => (
                  <SelectItem key={s._id} value={s._id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                      {s.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkStageOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkMoveStage}
              disabled={!bulkStageId || bulkActing}
            >
              {bulkActing ? 'Moving…' : 'Move Stage'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Reject — same reason + destination dialog as the single flow */}
      <RejectDialog
        open={bulkRejectOpen}
        onOpenChange={setBulkRejectOpen}
        candidateName={`${selectedCount} selected ${selectedCount === 1 ? 'candidate' : 'candidates'}`}
        submitting={bulkActing}
        onConfirm={handleBulkReject}
      />

      {/* Bulk remove from job → Talent Pool */}
      <ConfirmDialog
        open={bulkPoolMoveOpen}
        onOpenChange={setBulkPoolMoveOpen}
        title="Remove from job and move to Talent Pool"
        description={`${selectedCount} selected ${selectedCount === 1 ? 'candidate' : 'candidates'} will be removed from ${jobIdFilter ? 'this job' : 'their current job'} and added to the Talent Pool. This is not a rejection. They can be assigned to another job later from the Talent Pool page.`}
        confirmLabel="Move to Talent Pool"
        loading={bulkActing}
        onConfirm={handleBulkMoveToTalentPool}
      />

      {/* Bulk email — one send, every selected address in the To list */}
      <ComposeEmailSheet
        open={bulkComposeOpen}
        onOpenChange={setBulkComposeOpen}
        mode={bulkComposeMode}
      />

      <CandidateDetailSheet
        candidate={selected}
        open={detailOpen}
        onOpenChange={open => {
          setDetailOpen(open);
          if (!open) setSelected(null);
        }}
        mutating={mutating}
      />
    </>
  );
}
