import { ConfirmDialog } from '@/components/confirm-dialog';
import { useTablePagination } from '@/hooks/use-table-pagination';
import { useUserStore } from '@/store/slices/users.store';
import type { User } from '@/store/types/user.types';
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import {
  filterTeamMembers,
  NO_FILTERS,
  type TeamFilters,
} from '../_utils/team-filters';
import { InviteTeamSheet } from './invite-team-sheet';
import { MemberCell } from './member-cell';
import { PermissionGuideDialog } from './permission-guide-dialog';
import { baseColumns } from './team-columns';
import { MemberRowActions } from './team-table/member-row-actions';
import { TeamDataTable } from './team-table/team-data-table';
import { TeamFiltersBar } from './team-table/team-filters-bar';
import { TeamToolbar } from './team-table/team-toolbar';
import { TeamMemberEditSheet } from './team-member-edit-sheet';
import { TeamMemberSheet } from './team-member-sheet';

interface TeamTableProps {
  members: User[];
  loading?: boolean;
  isRefreshing?: boolean;
}

export function TeamTable({ members, loading }: TeamTableProps) {
  const mutating = useUserStore(s => s.mutating);
  const remove = useUserStore(s => s.remove);

  const [filters, setFilters] = useState<TeamFilters>(NO_FILTERS);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [inviteOpen, setInviteOpen] = useState(false);
  const [permissionGuideOpen, setPermissionGuideOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [memberSheetOpen, setMemberSheetOpen] = useState(false);
  const [editMember, setEditMember] = useState<User | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  // `positive` reproduces this table's existing `> 0` rule on change, which
  // accepts 50 from the dropdown even though it is not in `validSizes`.
  const { pageIndex, pageSize, handlePaginationChange } = useTablePagination({
    storageKey: 'team',
    defaultSize: 15,
    sizeValidation: 'positive',
  });

  function openEdit(member: User) {
    setEditMember(member);
    setEditSheetOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget._id);
    } catch {
      // toast handled by store
    } finally {
      setDeleteTarget(null);
    }
  }

  async function handleDeleteSelected() {
    const ids = table.getSelectedRowModel().rows.map(r => r.id);
    try {
      await Promise.all(ids.map(id => remove(id)));
    } catch {
      // toast handled by store
    } finally {
      setRowSelection({});
    }
  }

  const tableColumns = useMemo<ColumnDef<User>[]>(
    () =>
      baseColumns.map(col => {
        if (col.id === 'name') {
          return {
            ...col,
            cell: ({ row }) => (
              <MemberCell
                member={row.original}
                onClick={() => {
                  setSelectedMember(row.original);
                  setMemberSheetOpen(true);
                }}
              />
            ),
          };
        }
        if (col.id === 'actions') {
          return {
            ...col,
            cell: ({ row }) => {
              const member = row.original;
              return (
                <MemberRowActions
                  onEdit={() => openEdit(member)}
                  onDelete={() => setDeleteTarget(member)}
                />
              );
            },
          };
        }
        return col;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const filtered = useMemo(
    () => filterTeamMembers(members, filters),
    [members, filters]
  );

  const table = useReactTable({
    data: filtered,
    columns: tableColumns,
    state: { sorting, rowSelection, pagination: { pageIndex, pageSize } },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: handlePaginationChange,
    getRowId: row =>
      (row as User & { id?: string })._id ??
      (row as User & { id?: string }).id ??
      '',
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
    manualPagination: false,
  });

  return (
    <>
      <div className="flex flex-col gap-3 flex-1 min-h-0">
        <TeamToolbar
          selectedCount={Object.keys(rowSelection).length}
          mutating={mutating}
          onDeleteSelected={handleDeleteSelected}
          onOpenPermissions={() => setPermissionGuideOpen(true)}
          onInvite={() => setInviteOpen(true)}
        />
        <TeamFiltersBar filters={filters} onChange={setFilters} />
        <TeamDataTable
          table={table}
          showSkeleton={!!loading && members.length === 0}
          totalRows={filtered.length}
        />
      </div>

      <InviteTeamSheet open={inviteOpen} onOpenChange={setInviteOpen} />
      <PermissionGuideDialog
        open={permissionGuideOpen}
        onOpenChange={setPermissionGuideOpen}
      />
      <TeamMemberSheet
        member={selectedMember}
        open={memberSheetOpen}
        onOpenChange={setMemberSheetOpen}
        onEdit={member => openEdit(member)}
      />
      <TeamMemberEditSheet
        member={editMember}
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => !open && setDeleteTarget(null)}
        title="Delete team member?"
        description={
          deleteTarget && (
            <>
              <strong>
                {deleteTarget.firstName} {deleteTarget.lastName}
              </strong>{' '}
              will be removed from the team. This cannot be undone.
            </>
          )
        }
        confirmLabel="Delete"
        variant="destructive"
        loading={mutating}
        onConfirm={handleDelete}
      />
    </>
  );
}
