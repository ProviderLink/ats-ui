import { CandidateDetailSheet } from '@/app/candidates/_components/candidate-detail-sheet';
import { ClearableSearchInput } from '@/components/clearable-search-input';
import { CandidateCell } from '@/components/candidate-table/candidate-cell';
import { ColHeader } from '@/components/candidate-table/col-header';
import { SortHeader } from '@/components/candidate-table/sort-header';
import { TableSkeleton } from '@/components/candidate-table/table-skeleton';
import { RestoreCandidateDialog } from '@/components/restore-candidate-dialog';
import { TablePagination } from '@/components/table-pagination';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSocketRoom } from '@/hooks/use-socket-room';
import { useTablePagination } from '@/hooks/use-table-pagination';
import { formatDate } from '@/lib/utils';
import { useApplicationStore } from '@/store/slices/applications.store';
import { useCandidateStore } from '@/store/slices/candidates.store';
import { useClientStore } from '@/store/slices/clients.store';
import { useJobStore } from '@/store/slices/jobs.store';
import type { Candidate } from '@/store/types';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import {
  ShieldAlertIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { IneligibleRowActions } from './ineligible-row-actions';
import { PermanentDeleteDialog } from './permanent-delete-dialog';
import { useIneligibleActions } from '../_utils/use-ineligible-actions';

const LEGAL_HOLD_CLS =
  'border-red-500/30 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400';

export function PermanentlyIneligibleTable() {
  // Cached once per session; refetched only after a restore or legal-hold.
  const items = useCandidateStore(s => s.ineligibleItems);
  const loading = useCandidateStore(s => s.ineligibleLoading);
  const fetchIneligible = useCandidateStore(s => s.fetchIneligible);

  const jobs = useJobStore(s => s.items);
  const fetchJobs = useJobStore(s => s.fetch);
  const applications = useApplicationStore(s => s.items);
  const clients = useClientStore(s => s.items);
  const fetchClients = useClientStore(s => s.fetch);

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
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Search is client-side: the store already holds the full ineligible set.
  const [query, setQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'ineligibleAt', desc: true },
  ]);

  const { pageIndex, pageSize, handlePaginationChange, resetPage } =
    useTablePagination({ storageKey: 'ineligible', defaultSize: 20 });

  const searchTimer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (jobs.length === 0) fetchJobs({ page: 1, limit: 9999 });
  }, [jobs.length, fetchJobs]);

  useEffect(() => {
    if (clients.length === 0) fetchClients({ page: 1, limit: 9999 });
  }, [clients.length, fetchClients]);

  const openJobs = useMemo(() => {
    const clientMap = new Map(clients.map(c => [c._id, c.companyName]));
    return jobs
      .filter(j => j.status === 'open')
      .map(j => ({
        _id: j._id,
        title: j.title,
        clientName: clientMap.get(j.clientId) ?? '',
      }));
  }, [jobs, clients]);

  // Jobs the restore target already holds an application for. The
  // (candidateId, jobId) index is unique regardless of phase, so restoring onto
  // one of these would block the approval that follows — the dialog disables
  // them rather than letting the user walk into that error.
  const blockedJobIdsForRestore = useMemo(() => {
    if (!restoreTarget) return new Set<string>();
    return new Set(
      applications
        .filter(a => a.candidateId === restoreTarget._id)
        .map(a => a.jobId)
    );
  }, [applications, restoreTarget]);

  useEffect(() => {
    void fetchIneligible();
  }, [fetchIneligible]);

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(c => {
      const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
      if (fullName.includes(q)) return true;
      if (c.email?.toLowerCase().includes(q)) return true;
      if (c.phone?.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [items, query]);

  const totalRows = data.length;
  const hasFilters = !!query;

  function handleSearchChange(q: string) {
    setInputValue(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    resetPage();
    searchTimer.current = setTimeout(() => setQuery(q), 300);
  }

  function handleClearSearch() {
    setInputValue('');
    setQuery('');
    if (searchTimer.current) clearTimeout(searchTimer.current);
  }

  async function handleRestore(candidate: Candidate, jobId: string) {
    if (await restore(candidate, jobId)) setRestoreTarget(null);
  }

  async function handleDelete(candidate: Candidate) {
    if (await remove(candidate)) setDeleteTarget(null);
  }

  function openDetail(candidate: Candidate) {
    setSelected(candidate);
    setDetailOpen(true);
  }

  const columns = useMemo<ColumnDef<Candidate>[]>(
    () => [
      {
        id: 'candidate',
        accessorFn: row => `${row.firstName} ${row.lastName}`,
        header: ({ column }) => (
          <SortHeader column={column} label="Candidate" />
        ),
        cell: ({ row }) => <CandidateCell candidate={row.original} />,
        size: 250,
      },
      {
        id: 'reason',
        accessorFn: row => row.permanentlyIneligibleReasonLabel ?? '',
        header: () => <ColHeader>Reason</ColHeader>,
        cell: ({ row }) => {
          const label = row.original.permanentlyIneligibleReasonLabel;
          if (!label)
            return <span className="text-xs text-muted-foreground">—</span>;
          return (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="block max-w-56 truncate text-sm text-muted-foreground">
                    {label}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs max-w-64">
                  {label}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        },
        size: 200,
      },
      {
        id: 'ineligibleAt',
        accessorFn: row => row.permanentlyIneligibleAt ?? '',
        header: () => <ColHeader>Marked Ineligible</ColHeader>,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.permanentlyIneligibleAt
              ? formatDate(row.original.permanentlyIneligibleAt)
              : '—'}
          </span>
        ),
        size: 160,
      },
      {
        id: 'legalHold',
        header: () => <ColHeader>Legal Hold</ColHeader>,
        cell: ({ row }) =>
          row.original.legalHold ? (
            <Badge variant="outline" className={LEGAL_HOLD_CLS}>
              ON HOLD
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
        size: 90,
      },
      {
        id: 'actions',
        header: () => (
          <div className="flex justify-center">
            <ShieldAlertIcon className="size-4 text-muted-foreground" />
          </div>
        ),
        enableSorting: false,
        size: 130,
        minSize: 120,
        cell: ({ row }) => (
          <IneligibleRowActions
            candidate={row.original}
            restoring={!!restoringId}
            holdToggling={holdTogglingId === row.original._id}
            deleting={deletingId === row.original._id}
            onView={() => openDetail(row.original)}
            onRestore={() => setRestoreTarget(row.original)}
            onToggleLegalHold={() =>
              toggleLegalHold(row.original._id, !!row.original.legalHold)
            }
            onDelete={() => setDeleteTarget(row.original)}
          />
        ),
      },
    ],
    [restoringId, holdTogglingId, deletingId, toggleLegalHold]
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
            placeholder="Search by name, email, or phone…"
          />
        </div>

        <p className="text-xs text-muted-foreground -mt-1 shrink-0">
          {loading && data.length === 0
            ? 'Loading…'
            : `${totalRows} ${totalRows === 1 ? 'candidate' : 'candidates'}${hasFilters ? ' found' : ' ineligible'}`}
        </p>

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
                      className="border-b last:border-0 cursor-pointer"
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
                      {hasFilters
                        ? 'No candidates match your search.'
                        : 'No permanently ineligible candidates.'}
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

        <RestoreCandidateDialog
          candidate={restoreTarget}
          jobs={openJobs}
          blockedJobIds={blockedJobIdsForRestore}
          submitting={!!restoringId}
          onClose={() => setRestoreTarget(null)}
          onConfirm={handleRestore}
        />

        <PermanentDeleteDialog
          candidate={deleteTarget}
          deleting={!!deletingId}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />

        <CandidateDetailSheet
          candidate={selected}
          open={detailOpen}
          onOpenChange={open => {
            setDetailOpen(open);
            if (!open) setSelected(null);
          }}
          mutating={!!holdTogglingId || !!deletingId || !!restoringId}
        />
      </div>
    </TooltipProvider>
  );
}
