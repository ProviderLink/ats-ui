import { CandidateDetailSheet } from '@/app/candidates/_components/candidate-detail-sheet';
import {
  CandidateCell,
  ColHeader,
  SortHeader,
  TableSkeleton,
} from '@/app/candidates/_components/candidates-table';
import { RestoreCandidateDialog } from '@/components/restore-candidate-dialog';
import { TablePagination } from '@/components/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
import { deleteJson, patchJson } from '@/lib/api-client';
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
  BanIcon,
  ExternalLinkIcon,
  SearchIcon,
  ShieldAlertIcon,
  ShieldOffIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

const LEGAL_HOLD_CLS =
  'border-red-500/30 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400';

export function PermanentlyIneligibleTable() {
  // Reads from the dedicated store field (cached once per session), mirroring
  // how the Candidates and Talent Pool pages read the boot-loaded `items`.
  // The page never refetches on navigation — only after a restore / legal-hold.
  const items = useCandidateStore(s => s.ineligibleItems);
  const loading = useCandidateStore(s => s.ineligibleLoading);
  const fetchIneligible = useCandidateStore(s => s.fetchIneligible);

  const jobs = useJobStore(s => s.items);
  const fetchJobs = useJobStore(s => s.fetch);
  const applications = useApplicationStore(s => s.items);
  const clients = useClientStore(s => s.items);
  const fetchClients = useClientStore(s => s.fetch);

  // Keep the list live: an eligibility flip elsewhere (reject → Ineligible)
  // patches the store, and this page reads the same field.
  useSocketRoom('candidates');

  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [holdTogglingId, setHoldTogglingId] = useState<string | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<Candidate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Candidate | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Toolbar state — search is client-side (the store already holds the full
  // ineligible set) so it stays instant like every other list page.
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

  // Ensure the list is loaded once (no-op when already cached by boot or a
  // prior visit, so navigating here never triggers a network refetch).
  useEffect(() => {
    void fetchIneligible();
  }, [fetchIneligible]);

  // The store field is already server-filtered to permanently ineligible, so
  // only the search query is applied here.
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

  /**
   * Restore a permanently ineligible candidate.
   *
   * A job is always required: the candidate returns to **In Review** as a
   * normal pending applicant for that job, and must be approved through the
   * usual flow. No application is created here.
   */
  async function handleRestore(candidate: Candidate, jobId: string) {
    setRestoringId(candidate._id);
    try {
      // Patches the returned candidate into the store. Previously this called
      // fetch({ status: 'pending' }), which replaced the whole list with
      // pending-only rows and left the In Pipeline tab permanently empty.
      await useCandidateStore
        .getState()
        .restoreCandidate(candidate._id, { jobId });
      toast.success(
        `${candidate.firstName} ${candidate.lastName} restored — now in review`
      );
      setRestoreTarget(null);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to restore candidate');
    } finally {
      setRestoringId(null);
    }
  }

  /**
   * Permanently delete a candidate.
   *
   * This is the only place in the ATS where permanent deletion is allowed —
   * elsewhere candidates are closed out by rejecting them so their history is
   * preserved. The backend enforces the same rule.
   */
  async function handleDelete(candidate: Candidate) {
    setDeletingId(candidate._id);
    try {
      await deleteJson(`/ats/candidates/${candidate._id}`);
      toast.success(
        `${candidate.firstName} ${candidate.lastName} permanently deleted`
      );
      setDeleteTarget(null);
      await fetchIneligible(true);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to delete candidate');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleLegalHold(id: string, current: boolean) {
    setHoldTogglingId(id);
    try {
      await patchJson(`/ats/candidates/${id}/legal-hold`, {
        legalHold: !current,
      });
      toast.success(`Legal hold ${!current ? 'enabled' : 'disabled'}`);
      await fetchIneligible(true);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to toggle legal hold');
    } finally {
      setHoldTogglingId(null);
    }
  }

  const toggleLegalHold = useCallback(handleLegalHold, [fetchIneligible]);

  /**
   * Open the shared candidate detail sheet — the same one every other list
   * page uses. Previously this navigated to /ats/candidates/:id, which is
   * still a placeholder page rendering `Candidate #<id>`.
   */
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
          // Resolved server-side from the disposition reason's label — this
          // column previously printed the raw ObjectId.
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
          <div
            className="flex items-center gap-1 justify-end"
            onClick={e => e.stopPropagation()}
          >
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="View details"
                    onClick={() => openDetail(row.original)}
                  >
                    <ExternalLinkIcon className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">View details</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Restore candidate"
                    disabled={!!restoringId}
                    onClick={() => setRestoreTarget(row.original)}
                  >
                    <ShieldOffIcon className="size-3.5 text-amber-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Restore candidate (requires a job)
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={
                      row.original.legalHold
                        ? 'Remove legal hold'
                        : 'Place legal hold'
                    }
                    disabled={holdTogglingId === row.original._id}
                    onClick={() =>
                      toggleLegalHold(
                        row.original._id,
                        !!row.original.legalHold
                      )
                    }
                  >
                    {row.original.legalHold ? (
                      <BanIcon className="size-3.5 text-red-600" />
                    ) : (
                      <ShieldAlertIcon className="size-3.5 text-muted-foreground" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {row.original.legalHold
                    ? 'Remove legal hold'
                    : 'Place legal hold'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Delete permanently"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    disabled={deletingId === row.original._id}
                    onClick={() => setDeleteTarget(row.original)}
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Delete permanently</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
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
        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <div className="relative min-w-48 max-w-sm flex-1">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by name, email, or phone…"
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
              >
                <XIcon className="size-3.5" />
              </Button>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground -mt-1 shrink-0">
          {loading && data.length === 0
            ? 'Loading…'
            : `${totalRows} ${totalRows === 1 ? 'candidate' : 'candidates'}${hasFilters ? ' found' : ' ineligible'}`}
        </p>

        {/* Table */}
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

        {/* Restore — a job is required, and the candidate returns to In Review. */}
        <RestoreCandidateDialog
          candidate={restoreTarget}
          jobs={openJobs}
          blockedJobIds={blockedJobIdsForRestore}
          submitting={!!restoringId}
          onClose={() => setRestoreTarget(null)}
          onConfirm={handleRestore}
        />

        {/* Permanent delete — the only deletion path in the ATS. */}
        <Dialog
          open={!!deleteTarget}
          onOpenChange={v => !v && setDeleteTarget(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-destructive">
                Permanently Delete Candidate
              </DialogTitle>
              <DialogDescription className="flex flex-col gap-3 pt-2">
                <p>
                  This will permanently delete{' '}
                  <span className="font-medium text-foreground">
                    {deleteTarget
                      ? `${deleteTarget.firstName} ${deleteTarget.lastName}`
                      : 'this candidate'}
                  </span>{' '}
                  and all associated data — applications, interviews, emails,
                  and history — across every job.
                </p>
                <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive text-xs">
                  This action <em>cannot</em> be undone. To keep their history
                  instead, use Restore.
                </p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={!!deletingId}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={!!deletingId}
                onClick={() => deleteTarget && handleDelete(deleteTarget)}
              >
                {deletingId ? 'Deleting…' : 'Delete permanently'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail sheet — the shared candidate sheet, which renders the
            ineligible-specific footer actions (restore / legal hold / delete). */}
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
