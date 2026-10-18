import { ComposeEmailSheet } from '@/app/emails/_components/compose-email-sheet';
import { useCandidateEmailComposer } from '@/app/emails/_hooks/use-candidate-email-composer';
import { AssignJobDialog } from '@/components/assign-job-dialog';
import { CandidateBulkEmailBar } from '@/components/candidate-bulk-email-bar';
import { TableSkeleton } from '@/components/candidate-table/table-skeleton';
import { ClearableSearchInput } from '@/components/clearable-search-input';
import { TablePagination } from '@/components/table-pagination';
import { TagFilter } from '@/components/tag-filter';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAssignableJobs } from '@/hooks/use-assignable-jobs';
import { useIdSelection } from '@/hooks/use-id-selection';
import { useSocketRoom } from '@/hooks/use-socket-room';
import { useDebouncedSearch } from '@/hooks/use-debounced-search';
import { useTablePagination } from '@/hooks/use-table-pagination';
import { cn } from '@/lib/utils';
import { useApplicationStore } from '@/store/slices/applications.store';
import { useCandidateStore } from '@/store/slices/candidates.store';
import { useTagStore } from '@/store/slices/tags.store';
import type { Candidate } from '@/store/types';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { filterTalentPool } from '../_utils/talent-pool-filter';
import { RemoveTalentPoolConfirmDialog } from './remove-talent-pool-dialog';
import { TalentPoolDetailSheet } from './talent-pool-detail-sheet';
import { buildTalentPoolColumns } from './talent-pool-table/talent-pool-columns';

export function TalentPoolTable() {
  const items = useCandidateStore(s => s.items);
  const loading = useCandidateStore(s => s.loading);
  const mutating = useCandidateStore(s => s.mutating);
  const updateTalentPool = useCandidateStore(s => s.updateTalentPool);
  const assignJob = useCandidateStore(s => s.assignJob);
  const allTags = useTagStore(s => s.items);
  const fetchTags = useTagStore(s => s.fetch);
  const fetchApps = useApplicationStore(s => s.fetch);
  const { openJobs } = useAssignableJobs();

  useSocketRoom('candidates');
  useSocketRoom('applications');

  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Candidate | null>(null);
  const [removePoolTarget, setRemovePoolTarget] = useState<Candidate | null>(
    null
  );
  const { selectedIds, toggle, toggleAll, clear } = useIdSelection();
  const { composeOpen, setComposeOpen, composeMode, openComposeFor } =
    useCandidateEmailComposer();

  const { pageIndex, pageSize, handlePaginationChange, resetPage } =
    useTablePagination({ storageKey: 'talent-pool', defaultSize: 20 });
  const search = useDebouncedSearch(() => {
    resetPage();
    // Selections belong to the previous filter; dropping them stops a bulk
    // action from reaching a candidate the user can no longer see.
    clear();
  });

  useEffect(() => {
    if (allTags.length === 0) fetchTags();
  }, [allTags.length, fetchTags]);

  // After boot ALL candidates are in the store, so filtering is local.
  const data = useMemo(
    () => filterTalentPool(items, search.query, tagFilter),
    [items, search.query, tagFilter]
  );
  const totalRows = data.length;
  const hasFilters = !!search.query || tagFilter.length > 0;

  // Derived from the FILTERED list, so a selection made before a search
  // cannot smuggle in a hidden candidate.
  const selectedRows = useMemo(
    () => data.filter(c => selectedIds.has(c._id)),
    [data, selectedIds]
  );

  function handleTagsChange(tags: string[]) {
    setTagFilter(tags);
    resetPage();
    clear();
  }

  async function handleRemoveFromPool() {
    if (!removePoolTarget) return;
    try {
      await updateTalentPool(removePoolTarget._id, 'remove');
      toast.success(
        `${removePoolTarget.firstName} ${removePoolTarget.lastName} removed from talent pool`
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRemovePoolTarget(null);
    }
  }

  async function handleAssignToJob(jobId: string, startStageId?: string) {
    if (!assignTarget) return;
    try {
      await assignJob(assignTarget._id, jobId, startStageId);
      await fetchApps({ limit: 9999 });
      toast.success(
        `${assignTarget.firstName} ${assignTarget.lastName} assigned to job`
      );
      setAssignTarget(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const columns = useMemo(
    () =>
      buildTalentPoolColumns({
        rows: data,
        selectedIds,
        onToggleRow: toggle,
        onToggleAll: () => toggleAll(data.map(c => c._id)),
        mutating,
        onRemove: setRemovePoolTarget,
        onAssign: setAssignTarget,
        onEmail: c => openComposeFor([c]),
      }),
    // `mutating` must be a dependency so the row buttons disable during a
    // mutation; the handlers only touch stable setters and are omitted on
    // purpose so the columns are not rebuilt every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mutating, selectedIds, data]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination: { pageIndex, pageSize },
    },
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
            placeholder="Search by name, email, skills, role, or tags…"
          />
          <TagFilter
            allTags={allTags}
            selected={tagFilter}
            onChange={handleTagsChange}
          />
        </div>

        <p className="text-xs text-muted-foreground -mt-1 shrink-0">
          {loading && data.length === 0
            ? 'Loading…'
            : `${totalRows} ${totalRows === 1 ? 'candidate' : 'candidates'}${hasFilters ? ' found' : ' in talent pool'}`}
        </p>

        {selectedIds.size > 0 && (
          <CandidateBulkEmailBar
            selectedCount={selectedIds.size}
            onEmail={() => openComposeFor(selectedRows)}
            onClear={clear}
          />
        )}

        <div className="rounded-lg border flex flex-col flex-1 min-h-0 overflow-hidden">
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
                      className="border-b last:border-0 hover:bg-foreground/4 dark:hover:bg-white/3 cursor-pointer"
                      onClick={() => {
                        setSelected(row.original);
                        setDetailOpen(true);
                      }}
                    >
                      {row.getVisibleCells().map(cell => (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            'px-4 py-3',
                            (cell.column.id === 'talentPoolNotes' ||
                              cell.column.id === 'currentRole') &&
                              'whitespace-normal'
                          )}
                        >
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
                      No candidates in the talent pool yet.
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

      <TalentPoolDetailSheet
        candidate={selected}
        open={detailOpen}
        onOpenChange={open => {
          setDetailOpen(open);
          if (!open) setSelected(null);
        }}
        mutating={mutating}
      />

      <AssignJobDialog
        open={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        onConfirm={handleAssignToJob}
        jobs={openJobs}
      />

      <RemoveTalentPoolConfirmDialog
        candidate={removePoolTarget}
        open={!!removePoolTarget}
        onClose={() => setRemovePoolTarget(null)}
        onConfirm={handleRemoveFromPool}
      />

      <ComposeEmailSheet
        open={composeOpen}
        onOpenChange={setComposeOpen}
        mode={composeMode}
      />
    </TooltipProvider>
  );
}
