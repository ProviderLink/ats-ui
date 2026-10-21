import { CandidateCell } from '@/components/candidate-table/candidate-cell';
import { ColHeader } from '@/components/candidate-table/col-header';
import { SortHeader } from '@/components/candidate-table/sort-header';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import type { Candidate } from '@/store/types';
import type { ColumnDef } from '@tanstack/react-table';
import { ShieldAlertIcon } from 'lucide-react';
import { IneligibleRowActions } from '../ineligible-row-actions';

const LEGAL_HOLD_CLS =
  'border-red-500/30 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400';

interface IneligibleColumnsArgs {
  restoringId: string | null;
  holdTogglingId: string | null;
  deletingId: string | null;
  onView: (candidate: Candidate) => void;
  onRestore: (candidate: Candidate) => void;
  onToggleLegalHold: (id: string, current: boolean) => void;
  onDelete: (candidate: Candidate) => void;
}

const DASH = <span className="text-xs text-muted-foreground">—</span>;

export function buildIneligibleColumns({
  restoringId,
  holdTogglingId,
  deletingId,
  onView,
  onRestore,
  onToggleLegalHold,
  onDelete,
}: IneligibleColumnsArgs): ColumnDef<Candidate>[] {
  return [
    {
      id: 'candidate',
      accessorFn: row => `${row.firstName} ${row.lastName}`,
      header: ({ column }) => <SortHeader column={column} label="Candidate" />,
      cell: ({ row }) => <CandidateCell candidate={row.original} />,
      size: 250,
    },
    {
      id: 'reason',
      accessorFn: row => row.permanentlyIneligibleReasonLabel ?? '',
      header: () => <ColHeader>Reason</ColHeader>,
      cell: ({ row }) => {
        const label = row.original.permanentlyIneligibleReasonLabel;
        if (!label) return DASH;
        // Wrap in full at a small size instead of truncating behind a tooltip.
        return (
          <span className="block w-64 whitespace-normal rounded-md border bg-muted/40 px-2.5 py-1.5 text-xs leading-snug text-foreground/80">
            {label}
          </span>
        );
      },
      size: 260,
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
          DASH
        ),
      size: 90,
    },
    {
      id: 'actions',
      header: () => (
        <ColHeader
          label="Actions"
          icon={<ShieldAlertIcon className="size-3" />}
        />
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
          onView={() => onView(row.original)}
          onRestore={() => onRestore(row.original)}
          onToggleLegalHold={() =>
            onToggleLegalHold(row.original._id, !!row.original.legalHold)
          }
          onDelete={() => onDelete(row.original)}
        />
      ),
    },
  ];
}
