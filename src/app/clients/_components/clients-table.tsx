import { TableSkeleton } from '@/components/candidate-table/table-skeleton';
import { TablePagination } from '@/components/table-pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePermission } from '@/hooks/use-permission';
import { useSearchWithPageRestore } from '@/hooks/use-search-with-page-restore';
import { useSocketRoom } from '@/hooks/use-socket-room';
import { useTablePagination } from '@/hooks/use-table-pagination';
import { useApplicationStore, useClientStore, useJobStore } from '@/store';
import type { Client, ClientStatus } from '@/store/types';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  VALID_SORT_OPTIONS,
  countJobsByClient,
  filterClients,
  sortClients,
  type SortOption,
} from '../_utils/client-list';
import { ClientDetailSheet } from './client-detail-sheet';
import { buildClientColumns } from './clients-table/client-columns';
import { ClientsToolbar } from './clients-table/clients-toolbar';
import { DeleteClientDialog } from './clients-table/delete-client-dialog';
import { NewClientSheet } from './new-client-sheet';

const EMPTY_CLIENTS: Client[] = [];

export function ClientsTable() {
  const navigate = useNavigate();
  useSocketRoom('clients');
  const items = useClientStore(s => s.items ?? EMPTY_CLIENTS);
  const loading = useClientStore(s => s.loading);
  const isRefreshing = useClientStore(s => s.isRefreshing);
  const mutating = useClientStore(s => s.mutating);
  const filters = useClientStore(s => s.filters);
  const setFilters = useClientStore(s => s.setFilters);
  const remove = useClientStore(s => s.remove);
  const allJobs = useJobStore(s => s.items);
  const fetchJobs = useJobStore(s => s.fetch);
  const allApps = useApplicationStore(s => s.items);

  const { hasPermission } = usePermission();
  const canEdit = hasPermission('clients', 'write');
  const canDelete = hasPermission('clients', 'manage');

  const jobCountsByClient = useMemo(() => countJobsByClient(allJobs), [allJobs]);

  useEffect(() => {
    // Reset any clientId filter that the Jobs page may have set in the shared
    // jobs store, then fetch all jobs so every client's counts are correct.
    fetchJobs({ clientId: undefined, limit: 9999 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = items;

  // Shared pagination state. `setPageIndex` / `setPageSize` are stable
  // (useCallback) so they are safe to use as effect and memo dependencies.
  const {
    pageIndex,
    pageSize,
    setPageIndex: handlePaginationIndex,
    setPageSize: handlePaginationSize,
  } = useTablePagination({ storageKey: 'clients', defaultSize: 10 });

  const [query, setQuery] = useState(filters.search ?? '');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>(
    filters.status ?? 'all'
  );

  const [sorting, setSorting] = useState<SortingState>(() => {
    try {
      const raw = localStorage.getItem('clients-column-sorting');
      return raw ? (JSON.parse(raw) as SortingState) : [];
    } catch {
      return [];
    }
  });
  const [addOpen, setAddOpen] = useState(false);
  const [editClientId, setEditClientId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const raw = localStorage.getItem('clients-sort-by') ?? '';
    return (VALID_SORT_OPTIONS as readonly string[]).includes(raw)
      ? (raw as SortOption)
      : 'default';
  });

  const searchDebounce = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { handleSearchChange: onSearchChange } = useSearchWithPageRestore({
    initialValue: filters.search ?? '',
    pageIndex,
    onPageChange: idx => handlePaginationIndex(idx),
  });

  const handleQueryChange = useCallback(
    (q: string) => {
      setQuery(q);
      clearTimeout(searchDebounce.current);
      searchDebounce.current = setTimeout(() => {
        // `onSearchChange` owns the page transition: it jumps to page 0 when a
        // search starts and RESTORES the previous page when the search is
        // cleared. Forcing page 0 here as well overwrote that restore, so
        // clearing the search always dropped the user back to page 1 instead of
        // where they were.
        onSearchChange(q);
        setFilters({ search: q || undefined });
        if (q) handlePaginationIndex(0);
        // No server call — search is fully client-side
      }, 300);
    },
    [onSearchChange, setFilters, handlePaginationIndex]
  );

  const handleStatusFilterChange = useCallback(
    (v: ClientStatus | 'all') => {
      setStatusFilter(v);
      const status = v === 'all' ? undefined : v;
      setFilters({ status });
      handlePaginationIndex(0);
    },
    [setFilters, handlePaginationIndex]
  );

  const selectedClient = selectedClientId
    ? (items.find(c => c._id === selectedClientId) ?? null)
    : null;

  const editClient = editClientId
    ? (items.find(c => c._id === editClientId) ?? null)
    : null;

  const deleteTargetJobCount = useMemo(() => {
    if (!deleteTarget) return 0;
    return jobCountsByClient.get(deleteTarget._id)?.total ?? 0;
  }, [deleteTarget, jobCountsByClient]);

  const deleteTargetAppCount = useMemo(() => {
    if (!deleteTarget) return 0;
    return allApps.filter(a => a.clientId === deleteTarget._id).length;
  }, [deleteTarget, allApps]);

  function handleView(client: Client) {
    setSelectedClientId(client._id);
    setDetailOpen(true);
  }

  function handleEdit(client: Client) {
    setEditClientId(client._id);
  }

  function handleViewJobs(client: Client) {
    const counts = jobCountsByClient.get(client._id);
    if (!counts || counts.total === 0) {
      toast.info(`${client.companyName} has no jobs yet`);
      return;
    }
    navigate(`/ats/jobs?client=${encodeURIComponent(client.companyName)}`);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget._id);
      toast.success(`${deleteTarget.companyName} deleted`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDeleteTarget(null);
    }
  }

  const filteredData = useMemo(
    () =>
      filterClients(
        sortClients(data, jobCountsByClient, sortBy),
        statusFilter,
        query
      ),
    [data, jobCountsByClient, sortBy, statusFilter, query]
  );

  const pagedData = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, pageIndex, pageSize]);

  const displayedRowCount = filteredData.length;

  const cols = useMemo(
    () =>
      buildClientColumns({
        jobCounts: jobCountsByClient,
        canEdit,
        canDelete,
        onEdit: handleEdit,
        onDelete: setDeleteTarget,
        onViewJobs: handleViewJobs,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, jobCountsByClient]
  );

  const table = useReactTable({
    data: pagedData,
    columns: cols,
    manualPagination: true,
    state: {
      sorting,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    onSortingChange: updater => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      localStorage.setItem('clients-column-sorting', JSON.stringify(next));
      setSorting(next);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handlePageChange = useCallback(
    (index: number) => handlePaginationIndex(index),
    [handlePaginationIndex]
  );

  const handlePageSizeChange = useCallback(
    (size: number) => handlePaginationSize(size),
    [handlePaginationSize]
  );

  return (
    <>
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        <ClientsToolbar
          query={query}
          onQueryChange={handleQueryChange}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          sortBy={sortBy}
          onSortChange={v => {
            localStorage.setItem('clients-sort-by', v);
            setSortBy(v);
          }}
          onAdd={() => setAddOpen(true)}
        />

        <p className="text-xs text-muted-foreground -mt-1 shrink-0">
          {loading && data.length === 0
            ? 'Loading…'
            : `${displayedRowCount} client${displayedRowCount !== 1 ? 's' : ''}${query.trim() || statusFilter !== 'all' ? ' match' : ' total'}`}
        </p>

        <div className="rounded-lg border flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-foreground/[0.05] dark:bg-muted">
                {table.getHeaderGroups().map(hg => (
                  <TableRow
                    key={hg.id}
                    className="border-b hover:bg-transparent"
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
              {isRefreshing && (
                <div className="h-px bg-muted overflow-hidden">
                  <div className="h-full w-1/3 bg-primary/40 animate-pulse rounded-full" />
                </div>
              )}
              <TableBody>
                {loading && data.length === 0 ? (
                  <TableSkeleton cols={8} />
                ) : table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map(row => (
                    <TableRow
                      key={row.id}
                      className="border-b last:border-0 hover:bg-foreground/[0.04] dark:hover:bg-white/3 cursor-pointer"
                      onClick={() => handleView(row.original)}
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
                      colSpan={8}
                      className="h-32 text-center text-sm text-muted-foreground"
                    >
                      No clients found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="border-t px-2 py-2 shrink-0 bg-background">
            <TablePagination
              table={table}
              pageIndex={pageIndex}
              pageSize={pageSize}
              totalRows={displayedRowCount}
              label="clients"
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        </div>
      </div>

      <NewClientSheet open={addOpen} onOpenChange={setAddOpen} />
      <NewClientSheet
        open={!!editClientId}
        onOpenChange={open => {
          if (!open) setEditClientId(null);
        }}
        client={editClient ?? undefined}
      />
      <ClientDetailSheet
        client={selectedClient}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={client => {
          setDetailOpen(false);
          setEditClientId(client._id);
        }}
        onDelete={client => {
          setDetailOpen(false);
          setDeleteTarget(client);
        }}
      />

      <DeleteClientDialog
        client={deleteTarget}
        jobCount={deleteTargetJobCount}
        applicationCount={deleteTargetAppCount}
        deleting={mutating}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
