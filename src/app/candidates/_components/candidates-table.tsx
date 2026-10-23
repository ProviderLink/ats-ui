import { useSocketRoom } from '@/hooks/use-socket-room';
import { useDebouncedSearch } from '@/hooks/use-debounced-search';
import { useTablePagination } from '@/hooks/use-table-pagination';
import { useApplicationStore } from '@/store/slices/applications.store';
import { useCandidateStore } from '@/store/slices/candidates.store';
import { useClientStore } from '@/store/slices/clients.store';
import { useJobStore } from '@/store/slices/jobs.store';
import type { Candidate } from '@/store/types';
import { getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type SortingState } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCandidateApplicationMaps } from '../_hooks/use-candidate-application-maps';
import { useCandidateBulkActions } from '../_hooks/use-candidate-bulk-actions';
import { useCandidateColumns } from '../_hooks/use-candidate-columns';
import { useCandidateTable } from '../_hooks/use-candidate-table';
import { CANDIDATE_SORT_OPTIONS, type CandidateSortOption } from '../_utils/candidate-sort';
import type { CandidateTabValue } from '../_utils/candidate-tabs';
import { BulkActionDialogs } from './bulk-action-dialogs';
import { BulkSelectionBar } from './bulk-selection-bar';
import { CandidateDetailSheet } from './candidate-detail-sheet';
import { CandidatesDataTable } from './candidates-data-table';
import { CandidatesToolbar } from './candidates-toolbar';

export function CandidatesTable() {
  // ── Store subscriptions ──────────────────────────────────────────
  const items = useCandidateStore(s => s.items);
  const mutating = useCandidateStore(s => s.mutating);
  const allApps = useApplicationStore(s => s.items);
  const allJobs = useJobStore(s => s.items);
  const allClients = useClientStore(s => s.items);

  const [activeTab, setActiveTab] = useState<CandidateTabValue>('pending');
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
  const [searchParams] = useSearchParams();
  const jobIdFilter = searchParams.get('jobId') ?? '';
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Subscribe to real-time candidate and application updates
  useSocketRoom('candidates');
  useSocketRoom('applications');

  // Shared pagination state (see use-table-pagination). Behaviour is identical
  // to the per-table implementation it replaces: 20-row default, same size list,
  // `sessionStorage` index and `localStorage` size.
  const { pageIndex, pageSize, handlePaginationChange, resetPage } =
    useTablePagination({ storageKey: 'candidates', defaultSize: 20 });
  const search = useDebouncedSearch(resetPage);


  const maps = useCandidateApplicationMaps(allApps, allJobs, allClients);

  // ── Helpers ──────────────────────────────────────────────────────

  function handleTabChange(tab: CandidateTabValue) {
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

  function openDetail(candidate: Candidate) {
    setSelected(candidate);
    setDetailOpen(true);
  }

  // The server filters, searches, sorts and pages; the browser only holds the
  // current page. `items`/`allApps` changing (own edits or live updates)
  // refreshes the page.
  const {
    rows,
    total: totalRows,
    counts,
    loading,
    refreshing: isRefreshing,
    fetchAllIds,
  } = useCandidateTable({
    tab: activeTab,
    jobId: jobIdFilter,
    query: search.query,
    sortBy,
    pageIndex,
    pageSize,
    itemsVersion: items,
    appsVersion: allApps,
  });

  // Show the freshest local copy of each row (edits land instantly), falling
  // back to the server row.
  const data = useMemo(() => {
    const byId = new Map(items.map(c => [c._id, c]));
    return rows.map(r => byId.get(r._id) ?? r);
  }, [rows, items]);

  const bulk = useCandidateBulkActions({
    pageRows: data,
    totalRows,
    fetchAllIds,
    allApps,
    activeTab,
    jobIdFilter,
    query: search.query,
    maps,
  });

  const columns = useCandidateColumns({
    activeTab,
    maps,
    bulk,
    allApps,
    allJobs,
    allClients,
    setOpenStageRowId,
  });

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

  const hasFilters = search.inputValue.length > 0;

  return (
    <>
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        <CandidatesToolbar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          counts={counts}
          inputValue={search.inputValue}
          onSearchChange={search.change}
          onClearSearch={search.clear}
          sortBy={sortBy}
          onSortChange={handleSortChange}
        />

        <p className="text-xs text-muted-foreground -mt-1 shrink-0">
          {loading && data.length === 0
            ? 'Loading…'
            : isRefreshing
              ? 'Refreshing…'
              : `${totalRows} ${totalRows === 1 ? 'candidate' : 'candidates'}${hasFilters ? ' found' : ' total'}`}
        </p>

        {bulk.selectedCount > 0 && (
          <BulkSelectionBar
            activeTab={activeTab}
            selectedCount={bulk.selectedCount}
            bulkActing={bulk.bulkActing}
            onMoveStage={() => bulk.setBulkStageOpen(true)}
            onReject={() => bulk.setBulkRejectOpen(true)}
            onRemoveFromJob={() => bulk.setBulkPoolMoveOpen(true)}
            onTalentPool={bulk.handleBulkTalentPool}
            onEmail={bulk.openBulkCompose}
            onClear={bulk.clearSelection}
          />
        )}

        <CandidatesDataTable
          table={table}
          columnCount={columns.length}
          loading={loading}
          rowCount={data.length}
          openStageRowId={openStageRowId}
          onRowClick={openDetail}
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalRows={totalRows}
        />
      </div>

      <BulkActionDialogs bulk={bulk} jobIdFilter={jobIdFilter} />

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