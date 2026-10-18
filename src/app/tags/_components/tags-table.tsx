import { TablePagination } from '@/components/table-pagination';
import { Button } from '@/components/ui/button';
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
import { useSocketRoom } from '@/hooks/use-socket-room';
import { useTablePagination } from '@/hooks/use-table-pagination';
import { useTagStore, useUserStore } from '@/store';
import type { Tag } from '@/store/types';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import { PlusIcon, SearchIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { TagFormSheet } from './tag-form-sheet';
import { TagsBulkActions } from './tags-bulk-actions';
import { buildTagColumns } from './tags-columns';

export function TagsTable() {
  useSocketRoom('tags');
  const { items, loading, mutating, error, fetch, create, update, remove } =
    useTagStore();
  const { items: users, fetch: fetchUsers } = useUserStore();

  // `positive` validation accepts 50 even though it is not in `validSizes`,
  // because the page-size dropdown offers it.
  const { pageIndex, pageSize, setPageIndex, handlePaginationChange } =
    useTablePagination({
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
      buildTagColumns(
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

  // Clamp a stale saved pageIndex when the data or page size changes.
  useEffect(() => {
    if (filtered.length === 0) return;
    const pageCount = Math.ceil(filtered.length / pageSize);
    if (pageIndex < pageCount) return;
    setPageIndex(pageCount - 1);
    // pageIndex is excluded on purpose: re-running on it would fight the clamp.
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
            <TagsBulkActions
              selectedCount={selectedCount}
              confirming={confirmBulkDelete}
              mutating={mutating}
              onAskConfirm={() => setConfirmBulkDelete(true)}
              onCancel={() => setConfirmBulkDelete(false)}
              onConfirm={handleDeleteSelected}
            />
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
