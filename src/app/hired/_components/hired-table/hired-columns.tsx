import { CandidateCell } from '@/components/candidate-table/candidate-cell';
import { ColHeader } from '@/components/candidate-table/col-header';
import { SortHeader } from '@/components/candidate-table/sort-header';
import { TagList } from '@/components/tag-list';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDate } from '@/lib/utils';
import type { Candidate } from '@/store/types';
import type { ColumnDef } from '@tanstack/react-table';
import { EllipsisIcon } from 'lucide-react';
import type { HireInfo, OtherActivity } from '../../_utils/hired-data';
import { HiredForCell } from './hired-for-cell';
import { HiredRowActions } from './hired-row-actions';
import { OtherActivityCell } from './other-activity-cell';

interface HiredColumnsOptions {
  rows: Candidate[];
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onToggleAll: () => void;
  hireInfo: Map<string, HireInfo[]>;
  otherActivity: Map<string, OtherActivity>;
  mutating: boolean;
  onAssign: (candidate: Candidate) => void;
  onEmail: (candidate: Candidate) => void;
  onToggleTalentPool: (candidate: Candidate) => void;
}

export function buildHiredColumns({
  rows,
  selectedIds,
  onToggleRow,
  onToggleAll,
  hireInfo,
  otherActivity,
  mutating,
  onAssign,
  onEmail,
  onToggleTalentPool,
}: HiredColumnsOptions): ColumnDef<Candidate>[] {
  return [
    {
      id: 'select',
      header: () => (
        <Checkbox
          checked={
            rows.length > 0 && selectedIds.size === rows.length
              ? true
              : selectedIds.size > 0
                ? 'indeterminate'
                : false
          }
          onCheckedChange={onToggleAll}
          aria-label="Select all hired candidates"
        />
      ),
      cell: ({ row }) => (
        <div onClick={e => e.stopPropagation()}>
          <Checkbox
            checked={selectedIds.has(row.original._id)}
            onCheckedChange={() => onToggleRow(row.original._id)}
            aria-label={`Select ${row.original.firstName} ${row.original.lastName}`}
          />
        </div>
      ),
      enableSorting: false,
      size: 40,
    },
    {
      id: 'candidate',
      accessorFn: row => `${row.firstName} ${row.lastName}`,
      header: ({ column }) => <SortHeader column={column} label="Candidate" />,
      cell: ({ row }) => <CandidateCell candidate={row.original} />,
    },
    {
      id: 'hiredFor',
      header: () => <ColHeader>Hired For</ColHeader>,
      cell: ({ row }) => <HiredForCell infos={hireInfo.get(row.original._id)} />,
    },
    {
      id: 'otherActivity',
      header: () => <ColHeader>Other Activity</ColHeader>,
      cell: ({ row }) => (
        <OtherActivityCell info={otherActivity.get(row.original._id)} />
      ),
    },
    {
      id: 'tags',
      header: () => <ColHeader>Tags</ColHeader>,
      cell: ({ row }) => <TagList tags={row.original.tags} max={3} />,
      size: 120,
      minSize: 80,
    },
    {
      id: 'hiredDate',
      accessorFn: row => hireInfo.get(row._id)?.[0]?.hiredAt ?? row.createdAt,
      header: () => <ColHeader>Hired Date</ColHeader>,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(
            hireInfo.get(row.original._id)?.[0]?.hiredAt ??
              row.original.createdAt
          )}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => (
        <div className="flex justify-center">
          <EllipsisIcon className="size-4 text-muted-foreground" />
        </div>
      ),
      cell: ({ row }) => (
        <HiredRowActions
          candidate={row.original}
          mutating={mutating}
          onAssign={() => onAssign(row.original)}
          onEmail={() => onEmail(row.original)}
          onToggleTalentPool={() => onToggleTalentPool(row.original)}
        />
      ),
      size: 130,
      minSize: 120,
    },
  ];
}
