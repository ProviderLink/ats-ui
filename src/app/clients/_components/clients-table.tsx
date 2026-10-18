import { usePermission } from '@/hooks/use-permission';
import { useSocketRoom } from '@/hooks/use-socket-room';
import { useApplicationStore, useClientStore, useJobStore } from '@/store';
import type { Client } from '@/store/types';
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useEffect, useMemo } from 'react';
import { useClientDialogs } from '../_hooks/use-client-dialogs';
import { useClientsListState } from '../_hooks/use-clients-list-state';
import { countJobsByClient } from '../_utils/client-list';
import { ClientDetailSheet } from './client-detail-sheet';
import { buildClientColumns } from './clients-table/client-columns';
import { ClientsDataTable } from './clients-table/clients-data-table';
import { ClientsToolbar } from './clients-table/clients-toolbar';
import { DeleteClientDialog } from './clients-table/delete-client-dialog';
import { NewClientSheet } from './new-client-sheet';

const EMPTY_CLIENTS: Client[] = [];

export function ClientsTable() {
  useSocketRoom('clients');
  const items = useClientStore(s => s.items ?? EMPTY_CLIENTS);
  const loading = useClientStore(s => s.loading);
  const isRefreshing = useClientStore(s => s.isRefreshing);
  const mutating = useClientStore(s => s.mutating);
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

  const list = useClientsListState(items, jobCountsByClient);
  const dialogs = useClientDialogs(items, jobCountsByClient, allApps);

  const cols = useMemo(
    () =>
      buildClientColumns({
        jobCounts: jobCountsByClient,
        canEdit,
        canDelete,
        onEdit: dialogs.startEdit,
        onDelete: dialogs.setDeleteTarget,
        onViewJobs: dialogs.viewJobs,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, jobCountsByClient]
  );

  const table = useReactTable({
    data: list.paged,
    columns: cols,
    manualPagination: true,
    state: {
      sorting: list.sorting,
      pagination: { pageIndex: list.pageIndex, pageSize: list.pageSize },
    },
    onSortingChange: list.changeSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const total = list.filtered.length;
  const isFiltered = !!list.query.trim() || list.statusFilter !== 'all';

  return (
    <>
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        <ClientsToolbar
          query={list.query}
          onQueryChange={list.changeQuery}
          statusFilter={list.statusFilter}
          onStatusFilterChange={list.changeStatusFilter}
          sortBy={list.sortBy}
          onSortChange={list.changeSortBy}
          onAdd={() => dialogs.setAddOpen(true)}
        />

        <p className="text-xs text-muted-foreground -mt-1 shrink-0">
          {loading && items.length === 0
            ? 'Loading…'
            : `${total} client${total !== 1 ? 's' : ''}${isFiltered ? ' match' : ' total'}`}
        </p>

        <ClientsDataTable
          table={table}
          showSkeleton={loading && items.length === 0}
          isRefreshing={isRefreshing}
          totalRows={total}
          onRowClick={dialogs.view}
          onPageChange={list.setPageIndex}
          onPageSizeChange={list.setPageSize}
        />
      </div>

      <NewClientSheet open={dialogs.addOpen} onOpenChange={dialogs.setAddOpen} />
      <NewClientSheet
        open={!!dialogs.editClient}
        onOpenChange={open => {
          if (!open) dialogs.closeEdit();
        }}
        client={dialogs.editClient ?? undefined}
      />
      <ClientDetailSheet
        client={dialogs.selectedClient}
        open={dialogs.detailOpen}
        onOpenChange={dialogs.setDetailOpen}
        onEdit={client => {
          dialogs.setDetailOpen(false);
          dialogs.startEdit(client);
        }}
        onDelete={client => {
          dialogs.setDetailOpen(false);
          dialogs.setDeleteTarget(client);
        }}
      />

      <DeleteClientDialog
        client={dialogs.deleteTarget}
        jobCount={dialogs.deleteTargetJobCount}
        applicationCount={dialogs.deleteTargetAppCount}
        deleting={mutating}
        onClose={() => dialogs.setDeleteTarget(null)}
        onConfirm={dialogs.confirmDelete}
      />
    </>
  );
}
