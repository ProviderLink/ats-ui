import { ComposeEmailSheet } from '@/app/emails/_components/compose-email-sheet';
import { useCandidateEmailComposer } from '@/app/emails/_hooks/use-candidate-email-composer';
import { AssignJobDialog } from '@/components/assign-job-dialog';
import { CandidateBulkEmailBar } from '@/components/candidate-bulk-email-bar';
import { CandidateCountLine } from '@/components/candidate-table/candidate-count-line';
import { CandidateListTable } from '@/components/candidate-table/candidate-list-table';
import { ClearableSearchInput } from '@/components/clearable-search-input';
import { TagFilter } from '@/components/tag-filter';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAssignableJobs } from '@/hooks/use-assignable-jobs';
import { useAssignCandidateToJob } from '@/hooks/use-assign-candidate-to-job';
import { useCandidateListControls } from '@/hooks/use-candidate-list-controls';
import { useDetailSheet } from '@/hooks/use-detail-sheet';
import { useSocketRoom } from '@/hooks/use-socket-room';
import { useApplicationStore } from '@/store/slices/applications.store';
import { useCandidateStore } from '@/store/slices/candidates.store';
import { useTagStore } from '@/store/slices/tags.store';
import type { Candidate } from '@/store/types';
import {
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
  const allTags = useTagStore(s => s.items);
  const fetchTags = useTagStore(s => s.fetch);
  const fetchApps = useApplicationStore(s => s.fetch);
  const { openJobs } = useAssignableJobs();

  useSocketRoom('candidates');
  useSocketRoom('applications');

  const [sorting, setSorting] = useState<SortingState>([]);
  const [removePoolTarget, setRemovePoolTarget] = useState<Candidate | null>(
    null
  );
  const controls = useCandidateListControls('talent-pool');
  const { search, tagFilter, pagination } = controls;
  const { selectedIds, toggle, toggleAll, clear } = controls.selection;
  const detail = useDetailSheet<Candidate>();
  const assign = useAssignCandidateToJob(() => fetchApps({ limit: 9999 }));
  const { composeOpen, setComposeOpen, composeMode, openComposeFor } =
    useCandidateEmailComposer();

  useEffect(() => {
    if (allTags.length === 0) fetchTags();
  }, [allTags.length, fetchTags]);

  // After boot ALL candidates are in the store, so filtering is local.
  const data = useMemo(
    () => filterTalentPool(items, search.query, tagFilter),
    [items, search.query, tagFilter]
  );

  // Derived from the FILTERED list, so a selection made before a search
  // cannot smuggle in a hidden candidate.
  const selectedRows = useMemo(
    () => data.filter(c => selectedIds.has(c._id)),
    [data, selectedIds]
  );

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

  const columns = useMemo(
    () =>
      buildTalentPoolColumns({
        rows: data,
        selectedIds,
        onToggleRow: toggle,
        onToggleAll: () => toggleAll(data.map(c => c._id)),
        mutating,
        onRemove: setRemovePoolTarget,
        onAssign: assign.setAssignTarget,
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
            placeholder="Search by name, email, skills, role, or tags…"
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
          unfilteredSuffix="in talent pool"
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
          emptyMessage="No candidates in the talent pool yet."
          onRowClick={detail.show}
          wrapColumnIds={['talentPoolNotes', 'currentRole']}
        />
      </div>

      <TalentPoolDetailSheet
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
