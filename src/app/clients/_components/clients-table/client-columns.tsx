import { ColHeader } from '@/components/candidate-table/col-header';
import { SortHeader } from '@/components/candidate-table/sort-header';
import type { Client } from '@/store/types';
import type { ColumnDef } from '@tanstack/react-table';
import {
  BriefcaseIcon,
  Building2Icon,
  CircleDotIcon,
  EllipsisIcon,
  ExternalLinkIcon,
  PencilIcon,
  Trash2Icon,
  UserIcon,
  UsersIcon,
} from 'lucide-react';
import type { JobCounts } from '../../_utils/client-list';
import { ClientStatusBadge } from './client-status-badge';
import { CompanyCell } from './company-cell';
import { ContactCell } from './contact-cell';
import { RowActionButton } from './row-action-button';

interface ClientColumnsOptions {
  jobCounts: JobCounts;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onViewJobs: (client: Client) => void;
}

export function buildClientColumns({
  jobCounts,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onViewJobs,
}: ClientColumnsOptions): ColumnDef<Client>[] {
  return [
    {
      id: 'company',
      accessorKey: 'companyName',
      size: 180,
      maxSize: 220,
      header: ({ column }) => (
        <SortHeader
          column={column}
          label="Company"
          icon={<Building2Icon className="size-3" />}
        />
      ),
      cell: ({ row }) => <CompanyCell client={row.original} />,
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: () => (
        <ColHeader label="Status" icon={<CircleDotIcon className="size-3" />} />
      ),
      cell: ({ row }) => <ClientStatusBadge status={row.original.status} />,
    },
    {
      id: 'industry',
      accessorKey: 'industry',
      header: ({ column }) => (
        <SortHeader
          column={column}
          label="Industry"
          icon={<Building2Icon className="size-3" />}
        />
      ),
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium capitalize">
            {row.original.industry || '—'}
          </p>
          {row.original.companySize && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <UsersIcon className="size-3 shrink-0" aria-hidden />
              {row.original.companySize} employees
            </p>
          )}
        </div>
      ),
    },
    {
      id: 'contact',
      header: () => (
        <ColHeader
          label="Primary Contact"
          icon={<UserIcon className="size-3" />}
        />
      ),
      cell: ({ row }) => <ContactCell contacts={row.original.contacts} />,
    },
    {
      id: 'jobs',
      header: () => (
        <ColHeader label="Jobs" icon={<BriefcaseIcon className="size-3" />} />
      ),
      cell: ({ row }) => {
        const counts = jobCounts.get(row.original._id);
        const total = counts?.total ?? 0;
        const open = counts?.open ?? 0;
        if (total === 0) {
          return <span className="text-xs text-muted-foreground">—</span>;
        }
        return (
          <div>
            <p className="text-sm font-semibold tabular-nums">
              {total} job{total === 1 ? '' : 's'}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className={
                  open > 0
                    ? 'size-1.5 rounded-full bg-pine-teal-500'
                    : 'size-1.5 rounded-full bg-silver-400'
                }
                aria-hidden
              />
              {open} open
            </p>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: () => (
        <ColHeader
          label="Actions"
          icon={<EllipsisIcon className="size-3" />}
        />
      ),
      cell: ({ row }) => {
        const client = row.original;
        return (
          <div className="flex items-center gap-1">
            {canEdit && (
              <RowActionButton
                label={`Edit ${client.companyName}`}
                tone="edit"
                tooltip="Edit client"
                icon={<PencilIcon className="size-3.5" />}
                onClick={() => onEdit(client)}
              />
            )}
            {canDelete && (
              <RowActionButton
                tone="destructive"
                label={`Delete ${client.companyName}`}
                tooltip="Delete client"
                icon={<Trash2Icon className="size-3.5" />}
                onClick={() => onDelete(client)}
              />
            )}
            <RowActionButton
              label={`View jobs for ${client.companyName}`}
              tone="view"
              tooltip="View jobs for this client"
              icon={<ExternalLinkIcon className="size-3.5" />}
              onClick={() => onViewJobs(client)}
            />
          </div>
        );
      },
    },
  ];
}
