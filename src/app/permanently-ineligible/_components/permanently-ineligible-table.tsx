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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { patchJson } from '@/lib/api-client';
import { cn, formatDate } from '@/lib/utils';
import { useCandidateStore } from '@/store/slices/candidates.store';
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
  ShieldAlertIcon,
  ShieldOffIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function PermanentlyIneligibleTable() {
  const navigate = useNavigate();
  const { items, loading, pagination, fetch } = useCandidateStore();

  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [holdTogglingId, setHoldTogglingId] = useState<string | null>(null);

  // Fetch permanently ineligible candidates
  useEffect(() => {
    fetch({ includeIneligible: true, limit: 50 });
  }, [fetch]);

  // Client-side filter for permanently ineligible only
  const data = useMemo(
    () => items.filter(c => c.eligibilityStatus === 'permanently_ineligible'),
    [items]
  );

  async function handleRestore(id: string, name: string) {
    setRestoringId(id);
    try {
      await patchJson(`/ats/candidates/${id}/eligibility`, {
        eligibilityStatus: 'eligible',
      });
      toast.success(`${name} restored to eligible`);
      fetch({ includeIneligible: true, limit: 50 });
    } catch (e) {
      toast.error((e as Error).message || 'Failed to restore eligibility');
    } finally {
      setRestoringId(null);
    }
  }

  async function handleLegalHold(id: string, current: boolean) {
    setHoldTogglingId(id);
    try {
      await patchJson(`/ats/candidates/${id}/legal-hold`, {
        legalHold: !current,
      });
      toast.success(`Legal hold ${!current ? 'enabled' : 'disabled'}`);
      fetch({ includeIneligible: true, limit: 50 });
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
                    aria-label="Restore eligibility"
                    disabled={restoringId === row.original._id}
                    onClick={() =>
                      handleRestore(
                        row.original._id,
                        `${row.original.firstName} ${row.original.lastName}`
                      )
                    }
                  >
                    <ShieldOffIcon className="size-3.5 text-amber-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Restore eligibility</TooltipContent>
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
          </div>
        ),
      },
    ],
    [navigate, restoringId, holdTogglingId]
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

      {/* Restore confirmation */}
      <Dialog
        open={!!restoringId}
        onOpenChange={v => !v && setRestoringId(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Restore Eligibility</DialogTitle>
            <DialogDescription>
              This will allow the candidate to be considered for positions
              again. This action will be audited.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoringId(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const c = data.find(x => x._id === restoringId);
                if (c) handleRestore(c._id, `${c.firstName} ${c.lastName}`);
              }}
              variant="default"
            >
              Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
