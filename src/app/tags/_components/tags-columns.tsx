import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { Tag, User } from '@/store/types';
import type { ColumnDef } from '@tanstack/react-table';
import {
  CalendarIcon,
  EllipsisIcon,
  EyeIcon,
  PaletteIcon,
  PencilIcon,
  TagIcon,
  Trash2Icon,
  UserIcon,
} from 'lucide-react';
import { TagBadge } from './tag-badge';
import { ColHeader } from './tag-col-header';

const AVATAR_COLORS = [
  'bg-violet-200 text-violet-900 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-amber-200 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300',
  'bg-rose-200 text-rose-900 dark:bg-rose-900/30 dark:text-rose-300',
  'bg-sky-200 text-sky-900 dark:bg-sky-900/30 dark:text-sky-300',
  'bg-emerald-200 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300',
  'bg-orange-200 text-orange-900 dark:bg-orange-900/30 dark:text-orange-300',
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function buildTagColumns(
  onEdit: (tag: Tag) => void,
  onDelete: (tag: Tag) => void,
  users: User[]
): ColumnDef<Tag>[] {
  return [
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
          aria-label={`Select ${row.original.name}`}
        />
      ),
      size: 40,
      enableSorting: false,
    },
    {
      id: 'name',
      accessorKey: 'name',
      header: () => (
        <ColHeader
          icon={<TagIcon className="size-3 text-muted-foreground" />}
          label="Tag name"
        />
      ),
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.name}</span>
      ),
    },
    {
      id: 'preview',
      header: () => (
        <ColHeader
          icon={<EyeIcon className="size-3 text-muted-foreground" />}
          label="Preview"
        />
      ),
      cell: ({ row }) => (
        <TagBadge name={row.original.name} color={row.original.color} />
      ),
      enableSorting: false,
    },
    {
      id: 'color',
      accessorKey: 'color',
      header: () => (
        <ColHeader
          icon={<PaletteIcon className="size-3 text-muted-foreground" />}
          label="Color"
        />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span
            className="size-4 rounded-full shrink-0 border border-gray-400 dark:border-foreground/10"
            style={{ background: row.original.color }}
          />
          <span className="text-xs font-mono text-muted-foreground">
            {row.original.color}
          </span>
        </div>
      ),
    },
    {
      id: 'createdBy',
      accessorKey: 'createdBy',
      header: () => (
        <ColHeader
          icon={<UserIcon className="size-3 text-muted-foreground" />}
          label="Created by"
        />
      ),
      cell: ({ row }) => {
        const id = row.original.createdBy;
        const user = id ? users.find(u => u._id === id) : undefined;
        if (!user)
          return (
            <span className="text-sm text-muted-foreground">{id ?? '—'}</span>
          );
        const fullName = `${user.firstName} ${user.lastName}`;
        const initials =
          `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
        return (
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'size-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 select-none',
                avatarColor(fullName)
              )}
            >
              {initials}
            </div>
            <span className="text-sm">{fullName}</span>
          </div>
        );
      },
    },
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: () => (
        <ColHeader
          icon={<CalendarIcon className="size-3 text-muted-foreground" />}
          label="Created at"
        />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      id: 'actions',
      size: 160,
      header: () => (
        <ColHeader
          icon={<EllipsisIcon className="size-3 text-muted-foreground" />}
          label="Actions"
        />
      ),
      cell: ({ row }) => {
        const tag = row.original;
        return (
          <div className="flex items-center gap-1 min-w-[160px]">
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-xs border-blue-300 bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900 hover:border-blue-400 dark:border-input dark:bg-input/30 dark:text-foreground dark:hover:bg-primary/10 dark:hover:text-primary dark:hover:border-primary/30"
              onClick={() => onEdit(tag)}
            >
              <PencilIcon className="size-3" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-xs border-red-300 bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800 hover:border-red-400 dark:border-input dark:bg-input/30 dark:text-destructive dark:hover:bg-destructive/10 dark:hover:border-destructive/40"
              onClick={() => onDelete(tag)}
            >
              <Trash2Icon className="size-3" />
              Delete
            </Button>
          </div>
        );
      },
      enableSorting: false,
    },
  ];
}
