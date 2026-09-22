import {
  CandidateCell,
  TableSkeleton,
} from '@/app/candidates/_components/candidates-table';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { deleteJson, patchJson } from '@/lib/api-client';
import { cn, formatDate } from '@/lib/utils';
import { useCandidateStore } from '@/store/slices/candidates.store';
import { useClientStore } from '@/store/slices/clients.store';
import { useJobStore } from '@/store/slices/jobs.store';
import { useApplicationStore } from '@/store/slices/applications.store';
import type { Candidate } from '@/store/types';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  BanIcon,
  CheckIcon,
  ExternalLinkIcon,
  SearchIcon,
  ShieldAlertIcon,
  ShieldOffIcon,
  Trash2Icon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function PermanentlyIneligibleTable() {
  const navigate = useNavigate();

  // Reads from the dedicated store field (cached once per session), mirroring
  // how the Candidates and Talent Pool pages read the boot-loaded `items`.
  // The page never refetches on navigation — only after a restore / legal-hold.
  const items = useCandidateStore(s => s.ineligibleItems);
  const loading = useCandidateStore(s => s.ineligibleLoading);
  const fetchIneligible = useCandidateStore(s => s.fetchIneligible);

  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [holdTogglingId, setHoldTogglingId] = useState<string | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<Candidate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Candidate | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const jobs = useJobStore(s => s.items);
  const fetchJobs = useJobStore(s => s.fetch);
  const applications = useApplicationStore(s => s.items);
  const clients = useClientStore(s => s.items);
  const fetchClients = useClientStore(s => s.fetch);

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

  // Client-side filter for permanently ineligible only
  const data = useMemo(
    () => items.filter(c => c.eligibilityStatus === 'permanently_ineligible'),
    [items]
  );

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

  const columns = useMemo<ColumnDef<Candidate>[]>(
    () => [
      {
        accessorKey: 'candidate',
        header: 'Candidate',
        size: 250,
        cell: ({ row }) => <CandidateCell candidate={row.original} />,
      },
      {
        accessorKey: 'reason',
        header: 'Reason',
        size: 200,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground line-clamp-1">
            {row.original.permanentlyIneligibleReason
              ? `Reason ID: ${row.original.permanentlyIneligibleReason}`
              : '—'}
          </span>
        ),
      },
      {
        accessorKey: 'ineligibleAt',
        header: 'Marked Ineligible',
        size: 160,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.permanentlyIneligibleAt
              ? formatDate(row.original.permanentlyIneligibleAt)
              : '—'}
          </span>
        ),
      },
      {
        accessorKey: 'legalHold',
        header: 'Legal Hold',
        size: 90,
        cell: ({ row }) =>
          row.original.legalHold ? (
            <Badge
              variant="secondary"
              className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] h-5"
            >
              ON HOLD
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: 'actions',
        header: '',
        size: 100,
        cell: ({ row }) => (
          <div className="flex items-center gap-1 justify-end">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="View details"
                    onClick={() =>
                      navigate(`/ats/candidates/${row.original._id}`)
                    }
                  >
                    <ExternalLinkIcon className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View details</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Restore candidate"
                    disabled={restoringId === row.original._id}
                    onClick={() => setRestoreTarget(row.original)}
                  >
                    <ShieldOffIcon className="size-3.5 text-amber-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Restore candidate (requires a job)
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={
                      row.original.legalHold
                        ? 'Remove legal hold'
                        : 'Place legal hold'
                    }
                    disabled={holdTogglingId === row.original._id}
                    onClick={() =>
                      handleLegalHold(
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
                <TooltipContent>
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
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Delete permanently"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    disabled={deletingId === row.original._id}
                    onClick={() => setDeleteTarget(row.original)}
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete permanently</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ),
      },
    ],
    [navigate, restoringId, holdTogglingId, setRestoreTarget, deletingId]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (loading && data.length === 0) return <TableSkeleton cols={5} />;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Permanently Ineligible</h2>
          <p className="text-sm text-muted-foreground">
            Candidates excluded from the normal pipeline. Admin access only.
          </p>
        </div>
        <Badge
          variant="secondary"
          className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        >
          {data.length} candidate{data.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <CheckIcon className="size-8 opacity-30" />
          <p className="text-sm">No permanently ineligible candidates</p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id}>
                    {hg.headers.map(h => (
                      <th
                        key={h.id}
                        className={cn(
                          'px-4 py-3 text-left text-xs font-medium text-muted-foreground bg-muted/50',
                          h.column.id === 'actions' && 'text-right'
                        )}
                        style={{ width: h.getSize() }}
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr
                    key={row.id}
                    className="border-t hover:bg-muted/30 transition-colors"
                  >
                    {row.getVisibleCells().map(cell => (
                      <td
                        key={cell.id}
                        className={cn(
                          'px-4 py-3',
                          cell.column.id === 'actions' && 'text-right'
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            table={table}
            pageIndex={table.getState().pagination.pageIndex}
            pageSize={table.getState().pagination.pageSize}
            totalRows={data.length}
            label="candidates"
          />
        </>
      )}

      {/* Restore — a job is required, and the candidate returns to In Review. */}
      <RestoreDialog
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
                and all associated data — applications, interviews, emails, and
                history — across every job.
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
    </div>
  );
}

function RestoreDialog({
  candidate,
  jobs,
  blockedJobIds,
  submitting,
  onClose,
  onConfirm,
}: {
  candidate: Candidate | null;
  jobs: { _id: string; title: string; clientName: string }[];
  blockedJobIds: Set<string>;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (candidate: Candidate, jobId: string) => void;
}) {
  return (
    <Dialog open={!!candidate} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {candidate && (
          <RestoreForm
            key={candidate._id}
            candidate={candidate}
            jobs={jobs}
            blockedJobIds={blockedJobIds}
            submitting={submitting}
            onClose={onClose}
            onConfirm={onConfirm}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RestoreForm({
  candidate,
  jobs,
  blockedJobIds,
  submitting,
  onClose,
  onConfirm,
}: {
  candidate: Candidate;
  jobs: { _id: string; title: string; clientName: string }[];
  blockedJobIds: Set<string>;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (candidate: Candidate, jobId: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter(
      j =>
        j.title.toLowerCase().includes(q) ||
        j.clientName.toLowerCase().includes(q)
    );
  }, [jobs, search]);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Restore Candidate</DialogTitle>
        <DialogDescription>
          Restoring{' '}
          <span className="font-medium text-foreground">
            {candidate.firstName} {candidate.lastName}
          </span>{' '}
          clears their permanent ineligibility. Choose the job they are being
          considered for — they return to <strong>In Review</strong> and must be
          approved like any new applicant.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search jobs…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <div className="max-h-64 overflow-y-auto rounded-md border">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              No open jobs found
            </p>
          ) : (
            <div className="flex flex-col">
              {filtered.map(j => {
                const blocked = blockedJobIds.has(j._id);
                return (
                  <button
                    key={j._id}
                    type="button"
                    disabled={blocked}
                    title={
                      blocked
                        ? 'This candidate already has an application for this job'
                        : undefined
                    }
                    className={cn(
                      'flex items-start gap-2 px-3 py-2 text-sm text-left transition-colors',
                      blocked
                        ? 'cursor-not-allowed opacity-50'
                        : 'hover:bg-muted',
                      selectedJobId === j._id && 'bg-muted font-medium'
                    )}
                    onClick={() => !blocked && setSelectedJobId(j._id)}
                  >
                    <span
                      className={cn(
                        'mt-0.5 size-4 rounded-full border flex items-center justify-center shrink-0',
                        selectedJobId === j._id
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30'
                      )}
                    >
                      {selectedJobId === j._id && (
                        <CheckIcon className="size-3" />
                      )}
                    </span>
                    <span className="min-w-0 flex flex-col">
                      <span className="truncate">{j.title}</span>
                      {j.clientName && (
                        <span className="text-xs text-muted-foreground truncate">
                          {j.clientName}
                        </span>
                      )}
                      {blocked && (
                        <span className="text-xs text-muted-foreground truncate">
                          Already applied — not available
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {jobs.length === 0 && (
          <p className="text-xs text-muted-foreground">
            There are no open jobs. Open a job before restoring a candidate.
          </p>
        )}
        {jobs.length > 0 && jobs.every(j => blockedJobIds.has(j._id)) && (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            This candidate already has an application for every open job, so none
            are available for restore.
          </p>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          disabled={!selectedJobId || submitting}
          onClick={() => {
            if (selectedJobId) onConfirm(candidate, selectedJobId);
          }}
        >
          {submitting ? 'Restoring…' : 'Restore'}
        </Button>
      </DialogFooter>
    </>
  );
}
