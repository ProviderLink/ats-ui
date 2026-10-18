import { CandidateDetailSheet } from '@/app/candidates/_components/candidate-detail-sheet';
import { ComposeEmailSheet } from '@/app/emails/_components/compose-email-sheet';
import { useCandidateEmailComposer } from '@/app/emails/_hooks/use-candidate-email-composer';
import { AssignJobDialog } from '@/components/assign-job-dialog';
import { CandidateBulkEmailBar } from '@/components/candidate-bulk-email-bar';
import { CandidateCountLine } from '@/components/candidate-table/candidate-count-line';
import { CandidateListTable } from '@/components/candidate-table/candidate-list-table';
import { ClearableSearchInput } from '@/components/clearable-search-input';
import { TagFilter } from '@/components/tag-filter';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAssignCandidateToJob } from '@/hooks/use-assign-candidate-to-job';
import { useCandidateListControls } from '@/hooks/use-candidate-list-controls';
import { useDetailSheet } from '@/hooks/use-detail-sheet';
import { useSocketRoom } from '@/hooks/use-socket-room';
import { useCandidateStore } from '@/store/slices/candidates.store';
import type { Candidate } from '@/store/types';
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
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

  const [sorting, setSorting] = useState<SortingState>([
    { id: 'hiredDate', desc: true },
  ]);
  const controls = useCandidateListControls('hired');
  const { search, tagFilter, pagination } = controls;
  const { selectedIds, toggle, toggleAll, clear } = controls.selection;
  const detail = useDetailSheet<Candidate>();
  const assign = useAssignCandidateToJob(refreshApps);
  const { composeOpen, setComposeOpen, composeMode, openComposeFor } =
    useCandidateEmailComposer();

  const data = useMemo(
    () => filterHired(candidates, hireInfoByCandidateId, search.query, tagFilter),
    [candidates, hireInfoByCandidateId, search.query, tagFilter]
  );

  const selectedRows = useMemo(
    () => data.filter(c => selectedIds.has(c._id)),
    [data, selectedIds]
  );

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
        onAssign: assign.setAssignTarget,
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
      pagination: {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      },
    },
    onSortingChange: setSorting,
    onPaginationChange: pagination.handlePaginationChange,
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
            placeholder="Search by name, email, phone, or skills…"
          />
          <TagFilter
            allTags={allTags}
            selected={tagFilter}
            onChange={controls.changeTagFilter}
          />
        </div>

        <CandidateCountLine
          loading={loading}
          count={data.length}
          hasFilters={controls.hasFilters}
          unfilteredSuffix="hired"
        />

        {selectedRows.length > 0 && (
          <CandidateBulkEmailBar
            selectedCount={selectedRows.length}
            onEmail={() => openComposeFor(selectedRows)}
            onClear={clear}
          />
        )}

        <CandidateListTable
          table={table}
          showSkeleton={loading && data.length === 0}
          totalRows={data.length}
          emptyMessage="No hired candidates yet."
          onRowClick={detail.show}
          wrapColumnIds={['hiredFor']}
        />
      </div>

      <CandidateDetailSheet
        candidate={detail.selected}
        open={detail.open}
        onOpenChange={detail.onOpenChange}
        mutating={mutating}
      />

      <AssignJobDialog
        open={!!assign.assignTarget}
        onClose={() => assign.setAssignTarget(null)}
        onConfirm={assign.assign}
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
