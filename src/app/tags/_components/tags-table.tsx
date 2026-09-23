import { TablePagination } from '@/components/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useSearchWithPageRestore } from '@/hooks/use-search-with-page-restore';
import { useTablePagination } from '@/hooks/use-table-pagination';
import { useSocketRoom } from '@/hooks/use-socket-room';
import { cn } from '@/lib/utils';
import { useTagStore, useUserStore } from '@/store';
import type { Tag } from '@/store/types';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import {
  CalendarIcon,
  CheckIcon,
  EllipsisIcon,
  EyeIcon,
  PaletteIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TagIcon,
  Trash2Icon,
  UserIcon,
  XIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { TagBadge } from './tag-badge';
import { TagFormSheet } from './tag-form-sheet';

function ColHeader({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function buildColumns(
  onEdit: (tag: Tag) => void,
  confirmId: string | null,
  setConfirmId: (id: string | null) => void,
  onDelete: (id: string) => void,
  mutating: boolean,
  users: import('@/store/types').User[]
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
          aria-label="Select row"
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
            className="size-4 rounded-full shrink-0 border border-foreground/10"
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
        if (confirmId === tag._id) {
          return (
            <div className="flex items-center gap-1 min-w-[160px]">
              <span className="text-xs text-muted-foreground mr-1">
                Delete?
              </span>
              <Button
                variant="destructive"
                size="xs"
                className="h-7 gap-1 px-2"
                disabled={mutating}
                onClick={() => {
                  onDelete(tag._id);
                  setConfirmId(null);
                }}
              >
                <CheckIcon className="size-3" />
                Yes
              </Button>
              <Button
                variant="outline"
                size="xs"
                className="h-7 gap-1 px-2"
                onClick={() => setConfirmId(null)}
              >
                <XIcon className="size-3" />
                No
              </Button>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-1 min-w-[160px]">
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-xs hover:bg-primary/10 hover:text-primary hover:border-primary/30"
              onClick={() => onEdit(tag)}
            >
              <PencilIcon className="size-3" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/40"
              onClick={() => setConfirmId(tag._id)}
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

export function TagsTable() {
  useSocketRoom('tags');
  const { items, loading, mutating, error, fetch, create, update, remove } =
    useTagStore();
  const { items: users, fetch: fetchUsers } = useUserStore();

  // Pagination state is shared with the other list screens. The `positive`
  // validation and the narrower `validSizes` reproduce this table's existing
  // behaviour: 50 is not in the list but the dropdown offers it, and it was
  // accepted, so it still is.
  const {
    pageIndex,
    pageSize,
    setPageIndex,
    handlePaginationChange,
  } = useTablePagination({
    storageKey: 'tags',
    defaultSize: 15,
    validSizes: [10, 15, 20, 30],
    sizeValidation: 'positive',
  });
  const pagination = { pageIndex, pageSize };

  useEffect(() => {
    if (error) toast.error('Failed to load tags');
  }, [error]);

  const { search, handleSearchChange: onSearchChange } =
    useSearchWithPageRestore({
      pageIndex,
      onPageChange: idx => setPageIndex(idx),
    });
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | undefined>(undefined);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  useEffect(() => {
    fetch();
    fetchUsers();
  }, [fetch, fetchUsers]);

  function handleEdit(tag: Tag) {
    setEditingTag(tag);
    setSheetOpen(true);
  }

  function handleNew() {
    setEditingTag(undefined);
    setSheetOpen(true);
  }

  async function handleDelete(id: string) {
    try {
      await remove(id);
      toast.success('Tag deleted');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to delete tag');
    }
  }

  async function handleSave(name: string, color: string) {
    try {
      if (editingTag) {
        await update(editingTag._id, { name, color });
        toast.success('Tag updated');
      } else {
        await create({ name, color });
        toast.success('Tag created');
      }
    } catch (e) {
      toast.error((e as Error).message || 'Failed to save tag');
    }
  }

  const columns = useMemo(
    () =>
      buildColumns(
        handleEdit,
        confirmId,
        setConfirmId,
        handleDelete,
        mutating,
        users
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [confirmId, mutating, users]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(t => t.name.toLowerCase().includes(q));
  }, [items, search]);

  // Clamp pageIndex if it exceeds available pages (e.g. after reload with stale saved index)
  // Clamp only when data or pageSize changes — read pageIndex fresh inside updater
  // so this never fires spuriously on page navigation or search restore
  useEffect(() => {
    if (filtered.length === 0) return;
    const pageCount = Math.ceil(filtered.length / pageSize);
    if (pageIndex < pageCount) return; // no change, no re-render
    setPageIndex(pageCount - 1);
    // pageIndex intentionally excluded — the guard above reads it, but
    // re-running on it would fight the clamp this effect exists to apply
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered.length, pageSize]);

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, rowSelection, pagination },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
    manualPagination: false,
  });

  async function handleDeleteSelected() {
    const selectedIds = table
      .getSelectedRowModel()
      .rows.map(r => r.original._id);
    try {
      await Promise.all(selectedIds.map(id => remove(id)));
      toast.success(
        `${selectedIds.length} tag${selectedIds.length === 1 ? '' : 's'} deleted`
      );
      setRowSelection({});
      setConfirmBulkDelete(false);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to delete tags');
    }
  }

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <>
      <div className="flex flex-col gap-3 flex-1 min-h-0">
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="relative flex-1 max-w-80">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search tags..."
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {selectedCount > 0 &&
              (confirmBulkDelete ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">
                    Delete {selectedCount} tag{selectedCount > 1 ? 's' : ''}?
                  </span>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 gap-1 px-2 text-xs"
                    disabled={mutating}
                    onClick={handleDeleteSelected}
                  >
                    <CheckIcon className="size-3" />
                    Yes
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 px-2 text-xs"
                    onClick={() => setConfirmBulkDelete(false)}
                  >
                    <XIcon className="size-3" />
                    No
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="secondary"
                    className="h-7 rounded-md px-2 text-xs"
                  >
                    {selectedCount} selected
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/40"
                    onClick={() => setConfirmBulkDelete(true)}
                  >
                    <Trash2Icon className="size-3" />
                    Delete selected
                  </Button>
                </div>
              ))}
            <Button
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={handleNew}
              disabled={mutating}
            >
              <PlusIcon className="size-3.5" />
              New tag
            </Button>
          </div>
        </div>

        <div className="rounded-lg border flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-foreground/[0.05] dark:bg-muted">
                {table.getHeaderGroups().map(hg => (
                  <TableRow
                    key={hg.id}
                    className="border-b hover:bg-transparent divide-x divide-border"
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
                {loading && items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-32 text-center text-sm text-muted-foreground"
                    >
                      Loading tags…
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map(row => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() ? 'selected' : undefined}
                      className="border-b last:border-0 divide-x divide-border hover:bg-foreground/[0.04] data-[state=selected]:bg-accent/40"
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
                      {search ? `No tags matching "${search}"` : 'No tags yet.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="border-t shrink-0 bg-background">
            <TablePagination
              table={table}
              pageIndex={pagination.pageIndex}
              pageSize={pagination.pageSize}
              totalRows={filtered.length}
              label="tags"
            />
          </div>
        </div>
      </div>

      <TagFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        tag={editingTag}
        onSave={handleSave}
      />
    </>
  );
}
