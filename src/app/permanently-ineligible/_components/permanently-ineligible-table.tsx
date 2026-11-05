import { CandidateDetailSheet } from '@/app/candidates/_components/candidate-detail-sheet';
import { CandidateCountLine } from '@/components/candidate-table/candidate-count-line';
import { ClearableSearchInput } from '@/components/clearable-search-input';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { RestoreCandidateDialog } from '@/components/restore-candidate-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useDebouncedSearch } from '@/hooks/use-debounced-search';
import { useIdSelection } from '@/hooks/use-id-selection';
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
import { Trash2Icon, XIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useIneligibleRestoreOptions } from '../_hooks/use-ineligible-restore-options';
import { filterIneligible } from '../_utils/filter-ineligible';
import { PermanentDeleteDialog } from './permanent-delete-dialog';
import { buildIneligibleColumns } from './permanently-ineligible-table/ineligible-columns';
import { IneligibleDataTable } from './permanently-ineligible-table/ineligible-data-table';

export function PermanentlyIneligibleTable() {
  // Cached once per session; refetched only after a restore.
  const items = useCandidateStore(s => s.ineligibleItems);
  const loading = useCandidateStore(s => s.ineligibleLoading);
  const fetchIneligible = useCandidateStore(s => s.fetchIneligible);

  // An eligibility flip elsewhere (reject → Ineligible) patches the store.
  useSocketRoom('candidates');

  const {
    restoringId,
    deletingId,
    restore,
    remove,
    removeMany,
  } = useIneligibleActions();
  const selection = useIdSelection();
  const { selectedIds, toggle, toggleAll, clear } = selection;
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<Candidate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Candidate | null>(null);
  const detail = useDetailSheet<Candidate>();
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'ineligibleAt', desc: true },
  ]);

  const { pageIndex, pageSize, handlePaginationChange, resetPage } =
    useTablePagination({ storageKey: 'ineligible', defaultSize: 20 });
  // Search is client-side: the store already holds the full ineligible set.
  const search = useDebouncedSearch(() => {
    resetPage();
    clear();
  });
  const { openJobs, blockedJobIds } =
    useIneligibleRestoreOptions(restoreTarget);

  useEffect(() => {
    void fetchIneligible();
  }, [fetchIneligible]);

  const data = useMemo(
    () => filterIneligible(items, search.query),
    [items, search.query],
  );
  const hasFilters = !!search.query;

  // Derived from the FILTERED list, so a selection made before a search cannot
  // include a candidate that is no longer visible.
  const selectedRows = useMemo(
    () => data.filter(c => selectedIds.has(c._id)),
    [data, selectedIds],
  );

  const columns = useMemo(
    () =>
      buildIneligibleColumns({
        rows: data,
        selectedIds,
        onToggleRow: toggle,
        onToggleAll: () => toggleAll(data.map(c => c._id)),
        restoringId,
        deletingId,
        onRestore: setRestoreTarget,
        onDelete: setDeleteTarget,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [restoringId, deletingId, selectedIds, data],
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

        {selectedRows.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs shrink-0">
            <Badge variant="secondary" className="text-xs">
              {selectedRows.length} selected
            </Badge>
            <Button
              size="sm"
              variant="outline"
              className="border-red-300 bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800 dark:border-input dark:bg-input/30 dark:text-destructive dark:hover:bg-destructive/10"
              disabled={!!deletingId}
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2Icon className="size-4" />
              Delete selected
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto text-muted-foreground"
              onClick={clear}
            >
              <XIcon className="size-4" />
              Clear
            </Button>
          </div>
        )}

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

        <ConfirmDialog
          open={bulkDeleteOpen}
          onOpenChange={setBulkDeleteOpen}
          title={`Permanently delete ${selectedRows.length} ${selectedRows.length === 1 ? 'candidate' : 'candidates'}?`}
          description="This permanently deletes the selected candidates and all associated data — applications, interviews, emails and history. This cannot be undone."
          confirmLabel="Delete permanently"
          variant="destructive"
          loading={deletingId === 'bulk'}
          onConfirm={async () => {
            await removeMany(selectedRows);
            clear();
            setBulkDeleteOpen(false);
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
          mutating={!!deletingId || !!restoringId}
        />
      </div>
    </TooltipProvider>
  );
}
