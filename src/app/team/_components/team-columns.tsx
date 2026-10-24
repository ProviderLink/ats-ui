import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import type { User } from '@/store/types/user.types';
import { type ColumnDef } from '@tanstack/react-table';
import {
  CircleDotIcon,
  EllipsisIcon,
  ShieldIcon,
  UserIcon,
  UsersIcon,
} from 'lucide-react';
import { ColHeader } from './team-col-header';
import { AccountStatus } from './account-status';
import { RoleBadges } from './role-badge';

export const baseColumns: ColumnDef<User>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected()
            ? true
            : table.getIsSomePageRowsSelected()
              ? 'indeterminate'
              : false
        }
        onCheckedChange={v => table.toggleAllPageRowsSelected(!!v)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={v => row.toggleSelected(!!v)}
        aria-label={`Select ${row.original.firstName} ${row.original.lastName}`}
      />
    ),
    size: 40,
  },
  {
    id: 'name',
    accessorFn: row => `${row.firstName} ${row.lastName}`,
    header: () => (
      <ColHeader
        icon={<UserIcon className="size-3 text-muted-foreground" />}
        label="Full name"
      />
    ),
    cell: () => null,
  },
  {
    id: 'email',
    accessorKey: 'email',
    header: () => (
      <ColHeader
        icon={<UserIcon className="size-3 text-muted-foreground" />}
        label="Email"
      />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <a
          href={`mailto:${row.original.email}`}
          className="text-sm text-foreground underline underline-offset-4 decoration-border hover:text-primary transition-colors"
        >
          {row.original.email}
        </a>
        {row.original.phone && (
          <span className="text-xs text-muted-foreground">
            {row.original.phone}
          </span>
        )}
      </div>
    ),
  },
  {
    id: 'role',
    header: () => (
      <ColHeader
        icon={<UsersIcon className="size-3 text-muted-foreground" />}
        label="Role"
      />
    ),
    cell: ({ row }) => <RoleBadges roles={row.original.roles} maxVisible={1} />,
  },
  {
    id: 'status',
    accessorKey: 'isActive',
    header: () => (
      <ColHeader
        icon={<CircleDotIcon className="size-3 text-muted-foreground" />}
        label="Status"
      />
    ),
    cell: ({ row }) => (
      <AccountStatus member={row.original} />
    ),
  },
  {
    id: 'appAccess',
    header: () => (
      <ColHeader
        icon={<ShieldIcon className="size-3 text-muted-foreground" />}
        label="App Access"
      />
    ),
    cell: ({ row }) => {
      const access = row.original.appAccess ?? [];
      return access.length === 0 ? (
        <span className="text-xs text-muted-foreground">None</span>
      ) : (
        <div className="flex gap-1">
          {access.map(a => (
            <Badge key={a} variant="secondary" className="uppercase text-xs border border-gray-300 bg-gray-200 text-gray-800 dark:border-transparent dark:bg-secondary dark:text-secondary-foreground">
              {a}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: () => (
      <ColHeader
        icon={<EllipsisIcon className="size-3 text-muted-foreground" />}
        label="Actions"
      />
    ),
    cell: () => null,
  },
];
