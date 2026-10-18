import { CandidateDetailSheet } from '@/app/candidates/_components/candidate-detail-sheet';
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
import { useIdSelection } from '@/hooks/use-id-selection';
import { useSocketRoom } from '@/hooks/use-socket-room';
import { useTablePagination } from '@/hooks/use-table-pagination';
import { cn } from '@/lib/utils';
import { useCandidateStore } from '@/store/slices/candidates.store';
import type { Candidate } from '@/store/types';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useHiredData } from '../_hooks/use-hired-data';
import { filterHired } from '../_utils/hired-data';
import { buildHiredColumns } from './hired-table/hired-columns';

/**
 * Hired candidates get their own page, mirroring Talent Pool and Ineligible.
 *
 * A candidate is hired when they hold a `hired` application, so this list is
 * application-derived — the same rule the spec defines for the Hired queue.
 * The candidate's original hire is what puts them here; assigning them to a
 * further job adds a pipeline entry without removing the hire record.
 */
export function HiredTable() {
  const loading = useCandidateStore(s => s.loading);
  const mutating = useCandidateStore(s => s.mutating);
  const updateTalentPool = useCandidateStore(s => s.updateTalentPool);
  const assignJob = useCandidateStore(s => s.assignJob);

  const {
    candidates,
    allTags,
    hireInfoByCandidateId,
    otherActivityByCandidateId,
    openJobs,
    refreshApps,
  } = useHiredData();

  useSocketRoom('candidates');
  useSocketRoom('applications');

  const [query, setQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'hiredDate', desc: true },
  ]);
  const { selectedIds, toggle, toggleAll, clear } = useIdSelection();
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Candidate | null>(null);
  const { composeOpen, setComposeOpen, composeMode, openComposeFor } =
    useCandidateEmailComposer();
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const { pageIndex, pageSize, handlePaginationChange, resetPage } =
    useTablePagination({ storageKey: 'hired', defaultSize: 20 });

  const data = useMemo(
    () => filterHired(candidates, hireInfoByCandidateId, query, tagFilter),
    [candidates, hireInfoByCandidateId, query, tagFilter]
  );
  const totalRows = data.length;
  const hasFilters = !!query || tagFilter.length > 0;

  const selectedRows = useMemo(
    () => data.filter(c => selectedIds.has(c._id)),
    [data, selectedIds]
  );

  function handleSearchChange(q: string) {
    setInputValue(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    resetPage();
    // Selections belong to the previous filter; dropping them stops a bulk
    // action from reaching a candidate the user can no longer see.
    clear();
    searchTimer.current = setTimeout(() => setQuery(q), 300);
  }

  function handleClearSearch() {
    setInputValue('');
    setQuery('');
    if (searchTimer.current) clearTimeout(searchTimer.current);
  }

  async function handleAssignToJob(jobId: string, startStageId?: string) {
    if (!assignTarget) return;
    try {
      await assignJob(assignTarget._id, jobId, startStageId);
      await refreshApps();
      toast.success(
        `${assignTarget.firstName} ${assignTarget.lastName} assigned to job`
      );
      setAssignTarget(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleTalentPool(candidate: Candidate) {
    const name = `${candidate.firstName} ${candidate.lastName}`;
    try {
      await updateTalentPool(
        candidate._id,
        candidate.inTalentPool ? 'remove' : 'add'
      );
      toast.success(
        candidate.inTalentPool
          ? `${name} removed from talent pool`
          : `${name} added to talent pool`
      );
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const columns = useMemo(
    () =>
      buildHiredColumns({
        rows: data,
        selectedIds,
        onToggleRow: toggle,
        onToggleAll: () => toggleAll(data.map(c => c._id)),
        hireInfo: hireInfoByCandidateId,
        otherActivity: otherActivityByCandidateId,
        mutating,
        onAssign: setAssignTarget,
        onEmail: c => openComposeFor([c]),
        onToggleTalentPool: handleTalentPool,
      }),
    // Handlers only touch stable setters and store actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      data,
      selectedIds,
      hireInfoByCandidateId,
      otherActivityByCandidateId,
      mutating,
      updateTalentPool,
    ]
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
            value={inputValue}
            onChange={handleSearchChange}
            onClear={handleClearSearch}
            placeholder="Search by name, email, phone, or skills…"
          />
          <TagFilter
            allTags={allTags}
            selected={tagFilter}
            onChange={ids => {
              setTagFilter(ids);
              resetPage();
              clear();
            }}
          />
        </div>

        <p className="text-xs text-muted-foreground -mt-1 shrink-0">
          {loading && data.length === 0
            ? 'Loading…'
            : `${totalRows} ${totalRows === 1 ? 'candidate' : 'candidates'}${hasFilters ? ' found' : ' hired'}`}
        </p>

        {selectedRows.length > 0 && (
          <CandidateBulkEmailBar
            selectedCount={selectedRows.length}
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
                            cell.column.id === 'hiredFor' && 'whitespace-normal'
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
                      No hired candidates yet.
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

      <CandidateDetailSheet
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
        description="This adds a pipeline entry for the new job. The candidate stays in the Hired list."
      />

      <ComposeEmailSheet
        open={composeOpen}
        onOpenChange={setComposeOpen}
        mode={composeMode}
      />
    </TooltipProvider>
  );
}
