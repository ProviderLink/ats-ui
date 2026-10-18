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
} from 'lucide-react';
import type { JobCounts } from '../../_utils/client-list';
import { ClientStatusBadge } from './client-status-badge';
import { ColHeader } from './col-header';
import { CompanyCell } from './company-cell';
import { ContactCell } from './contact-cell';
import { RowActionButton } from './row-action-button';
import { SortHeader } from './sort-header';

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
          <p className="text-sm capitalize">{row.original.industry || '—'}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.companySize
              ? `${row.original.companySize} employees`
              : ''}
          </p>
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
        return (
          <div>
            <p className="text-sm font-medium">
              {total > 0 ? `${total} job${total === 1 ? '' : 's'}` : '—'}
            </p>
            {total > 0 && (
              <p className="text-xs text-muted-foreground">{open} open</p>
            )}
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
          <div className="flex items-center gap-2">
            {canEdit && (
              <RowActionButton
                label={`Edit ${client.companyName}`}
                tooltip="Edit client"
                icon={<PencilIcon className="size-3.5" />}
                onClick={() => onEdit(client)}
              />
            )}
            {canDelete && (
              <RowActionButton
                destructive
                label={`Delete ${client.companyName}`}
                tooltip="Delete client"
                icon={<Trash2Icon className="size-3.5" />}
                onClick={() => onDelete(client)}
              />
            )}
            <RowActionButton
              label={`View jobs for ${client.companyName}`}
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
