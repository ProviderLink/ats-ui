import { CandidateDetailSheet } from '@/app/candidates/_components/candidate-detail-sheet';
import { CandidateCountLine } from '@/components/candidate-table/candidate-count-line';
import { ClearableSearchInput } from '@/components/clearable-search-input';
import { RestoreCandidateDialog } from '@/components/restore-candidate-dialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useDebouncedSearch } from '@/hooks/use-debounced-search';
import { useDetailSheet } from '@/hooks/use-detail-sheet';
import { useIneligibleActions } from '@/hooks/use-ineligible-actions';
import { useSocketRoom } from '@/hooks/use-socket-room';
import { useTablePagination } from '@/hooks/use-table-pagination';
import { useCandidateStore } from '@/store/slices/candidates.store';
import type { Candidate } from '@/store/types';
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { useEffect, useMemo, useState } from 'react';
import { useIneligibleRestoreOptions } from '../_hooks/use-ineligible-restore-options';
import { filterIneligible } from '../_utils/filter-ineligible';
import { PermanentDeleteDialog } from './permanent-delete-dialog';
import { buildIneligibleColumns } from './permanently-ineligible-table/ineligible-columns';
import { IneligibleDataTable } from './permanently-ineligible-table/ineligible-data-table';

export function PermanentlyIneligibleTable() {
  // Cached once per session; refetched only after a restore or legal-hold.
  const items = useCandidateStore(s => s.ineligibleItems);
  const loading = useCandidateStore(s => s.ineligibleLoading);
  const fetchIneligible = useCandidateStore(s => s.fetchIneligible);

  // An eligibility flip elsewhere (reject → Ineligible) patches the store.
  useSocketRoom('candidates');

  const {
    restoringId,
    holdTogglingId,
    deletingId,
    restore,
    remove,
    toggleLegalHold,
  } = useIneligibleActions();
  const [restoreTarget, setRestoreTarget] = useState<Candidate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Candidate | null>(null);
  const detail = useDetailSheet<Candidate>();
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'ineligibleAt', desc: true },
  ]);

  const { pageIndex, pageSize, handlePaginationChange, resetPage } =
    useTablePagination({ storageKey: 'ineligible', defaultSize: 20 });
  // Search is client-side: the store already holds the full ineligible set.
  const search = useDebouncedSearch(resetPage);
  const { openJobs, blockedJobIds } =
    useIneligibleRestoreOptions(restoreTarget);

  useEffect(() => {
    void fetchIneligible();
  }, [fetchIneligible]);

  const data = useMemo(
    () => filterIneligible(items, search.query),
    [items, search.query]
  );
  const hasFilters = !!search.query;

  const columns = useMemo(
    () =>
      buildIneligibleColumns({
        restoringId,
        holdTogglingId,
        deletingId,
        onView: detail.show,
        onRestore: setRestoreTarget,
        onToggleLegalHold: toggleLegalHold,
        onDelete: setDeleteTarget,
      }),
    [restoringId, holdTogglingId, deletingId, toggleLegalHold]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination: { pageIndex, pageSize } },
    onSortingChange: setSorting,
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
  });

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <ClearableSearchInput
            value={search.inputValue}
            onChange={search.change}
            onClear={search.clear}
            placeholder="Search by name, email, or phone…"
          />
        </div>

        <CandidateCountLine
          loading={loading}
          count={data.length}
          hasFilters={hasFilters}
          unfilteredSuffix="ineligible"
        />

        <IneligibleDataTable
          table={table}
          showSkeleton={loading && data.length === 0}
          hasFilters={hasFilters}
          totalRows={data.length}
          onRowClick={detail.show}
        />

        <RestoreCandidateDialog
          candidate={restoreTarget}
          jobs={openJobs}
          blockedJobIds={blockedJobIds}
          submitting={!!restoringId}
          onClose={() => setRestoreTarget(null)}
          onConfirm={async (candidate, jobId) => {
            if (await restore(candidate, jobId)) setRestoreTarget(null);
          }}
        />

        <PermanentDeleteDialog
          candidate={deleteTarget}
          deleting={!!deletingId}
          onClose={() => setDeleteTarget(null)}
          onConfirm={async candidate => {
            if (await remove(candidate)) setDeleteTarget(null);
          }}
        />

        <CandidateDetailSheet
          candidate={detail.selected}
          open={detail.open}
          onOpenChange={detail.onOpenChange}
          mutating={!!holdTogglingId || !!deletingId || !!restoringId}
        />
      </div>
    </TooltipProvider>
  );
}
