import { TablePagination } from '@/components/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTablePagination } from '@/hooks/use-table-pagination';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/slices/users.store';
import { UserRole as UserRoleEnum } from '@/store/types/enums';
import type { User } from '@/store/types/user.types';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import {
  BookOpenIcon,
  CheckIcon,
  PencilIcon,
  PlusIcon,
  ShieldIcon,
  Trash2Icon,
  UserIcon,
  XIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { ROLE_LABELS } from '@/lib/role-labels';
import type { UserRole } from '../_data/team';
import { ALL_ROLES } from '../_data/team';
import { FilterChip } from './filter-chip';
import { InviteTeamSheet } from './invite-team-sheet';
import { MemberCell } from './member-cell';
import { PermissionGuideDialog } from './permission-guide-dialog';
import { TeamMemberEditSheet } from './team-member-edit-sheet';
import { TeamMemberSheet } from './team-member-sheet';
import { baseColumns } from './team-columns';

type AppFilter = 'all' | 'ats' | 'crm';
type ActiveFilter = 'all' | 'active' | 'invited' | 'inactive';

const ROLE_RANK: Record<string, number> = {
  [UserRoleEnum.admin]: 1,
  [UserRoleEnum.hiring_manager]: 2,
  [UserRoleEnum.recruiter]: 3,
  [UserRoleEnum.coordinator]: 4,
  [UserRoleEnum.interviewer]: 5,
  [UserRoleEnum.account_manager]: 6,
  [UserRoleEnum.client]: 7,
  [UserRoleEnum.va]: 8,
};




type Props = { members: User[]; loading?: boolean; isRefreshing?: boolean };

export function TeamTable({ members, loading }: Props) {
  const { mutating, remove } = useUserStore();

  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [appFilter, setAppFilter] = useState<AppFilter>('all');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [inviteOpen, setInviteOpen] = useState(false);
  const [permissionGuideOpen, setPermissionGuideOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [memberSheetOpen, setMemberSheetOpen] = useState(false);
  const [editMember, setEditMember] = useState<User | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  // `positive` reproduces this table's existing `> 0` rule on change, which
  // accepts 50 from the dropdown even though it is not in `validSizes`.
  const { pageIndex, pageSize, handlePaginationChange } = useTablePagination({
    storageKey: 'team',
    defaultSize: 15,
    sizeValidation: 'positive',
  });
  const pagination = { pageIndex, pageSize };

  function openEdit(member: User) {
    setEditMember(member);
    setEditSheetOpen(true);
  }

  async function handleDelete(id: string) {
    try {
      await remove(id);
    } catch {
      // toast handled by store
    } finally {
      setConfirmId(null);
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
      setConfirmBulkDelete(false);
    }
  }

  const tableColumns = useMemo<ColumnDef<User>[]>(() => {
    const cols = [...baseColumns];

    const nameIdx = cols.findIndex(c => c.id === 'name');
    if (nameIdx !== -1) {
      cols[nameIdx] = {
        ...cols[nameIdx],
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

    const actionsIdx = cols.findIndex(c => c.id === 'actions');
    if (actionsIdx !== -1) {
      cols[actionsIdx] = {
        ...cols[actionsIdx],
        cell: ({ row }) => {
          const member = row.original;
          if (confirmId === member._id) {
            return (
              <div className="flex items-center gap-1 min-w-40">
                <span className="text-xs text-muted-foreground mr-1">
                  Delete?
                </span>
                <Button
                  variant="destructive"
                  size="xs"
                  className="h-7 gap-1 px-2"
                  disabled={mutating}
                  onClick={() => handleDelete(member._id)}
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
            <div className="flex items-center gap-1 min-w-40">
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 px-2 text-xs hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                onClick={() => openEdit(member)}
              >
                <PencilIcon className="size-3" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/40"
                onClick={() => setConfirmId(member._id)}
              >
                <Trash2Icon className="size-3" />
                Delete
              </Button>
            </div>
          );
        },
      };
    }

    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmId, mutating]);

  const filtered = useMemo(() => {
    // Always exclude CRM-only roles (client, va) — these are managed elsewhere
    let data = members.filter(m => {
      const roles = m.roles ?? [];
      return !roles.includes('client') && !roles.includes('va');
    });
    if (roleFilter !== 'all')
      data = data.filter(m => m.roles?.includes(roleFilter));
    if (appFilter !== 'all')
      data = data.filter(m => m.appAccess?.includes(appFilter));
    if (activeFilter === 'active')
      data = data.filter(m => m.isActive && m.isInviteAccepted);
    if (activeFilter === 'invited')
      data = data.filter(m => m.isActive && !m.isInviteAccepted);
    if (activeFilter === 'inactive') data = data.filter(m => !m.isActive);
    return [...data].sort((a, b) => {
      const rankA = ROLE_RANK[a.roles?.[0]] ?? 99;
      const rankB = ROLE_RANK[b.roles?.[0]] ?? 99;
      return rankA - rankB;
    });
  }, [members, roleFilter, appFilter, activeFilter]);

  const table = useReactTable({
    data: filtered,
    columns: tableColumns,
    state: { sorting, rowSelection, pagination },
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

  const filtersActive =
    roleFilter !== 'all' || appFilter !== 'all' || activeFilter !== 'all';
  const selectedCount = Object.keys(rowSelection).length;

  return (
    <>
      <div className="flex flex-col gap-3 flex-1 min-h-0">
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            {selectedCount > 0 &&
              (confirmBulkDelete ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">
                    Delete {selectedCount} member{selectedCount > 1 ? 's' : ''}?
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
              variant="outline"
              className="h-8 gap-1 text-xs"
              onClick={() => setPermissionGuideOpen(true)}
            >
              <BookOpenIcon className="size-3.5" />
              Permissions
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => setInviteOpen(true)}
            >
              <PlusIcon className="size-3.5" />
              Add User
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <FilterChip
            icon={<UserIcon className="size-3" />}
            label={
              roleFilter !== 'all' ? `Role: ${ROLE_LABELS[roleFilter]}` : 'Role'
            }
            active={roleFilter !== 'all'}
          >
            {['all' as const, ...ALL_ROLES].map(r => (
              <DropdownMenuItem
                key={r}
                onSelect={() => setRoleFilter(r)}
                className={cn(
                  'text-sm',
                  roleFilter === r && 'font-medium text-primary'
                )}
              >
                {r === 'all' ? 'All roles' : ROLE_LABELS[r]}
              </DropdownMenuItem>
            ))}
          </FilterChip>

          <FilterChip
            icon={<ShieldIcon className="size-3" />}
            label={
              appFilter !== 'all' ? `App: ${appFilter.toUpperCase()}` : 'App'
            }
            active={appFilter !== 'all'}
          >
            {(['all', 'ats', 'crm'] as const).map(a => (
              <DropdownMenuItem
                key={a}
                onSelect={() => setAppFilter(a)}
                className={cn(
                  'text-sm',
                  appFilter === a && 'font-medium text-primary'
                )}
              >
                {a === 'all' ? 'All apps' : a.toUpperCase()}
              </DropdownMenuItem>
            ))}
          </FilterChip>

          <FilterChip
            icon={<ShieldIcon className="size-3" />}
            label={
              activeFilter !== 'all'
                ? `Status: ${activeFilter === 'active' ? 'Active' : activeFilter === 'invited' ? 'Invited' : 'Inactive'}`
                : 'Status'
            }
            active={activeFilter !== 'all'}
          >
            {(['all', 'active', 'invited', 'inactive'] as const).map(s => (
              <DropdownMenuItem
                key={s}
                onSelect={() => setActiveFilter(s)}
                className={cn(
                  'text-sm',
                  activeFilter === s && 'font-medium text-primary'
                )}
              >
                {s === 'all'
                  ? 'All statuses'
                  : s === 'active'
                    ? 'Active'
                    : s === 'invited'
                      ? 'Invited'
                      : 'Inactive'}
              </DropdownMenuItem>
            ))}
          </FilterChip>

          {filtersActive && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={() => {
                setRoleFilter('all');
                setAppFilter('all');
                setActiveFilter('all');
              }}
            >
              Clear filters
            </Button>
          )}
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
                      <TableHead
                        key={h.id}
                        style={
                          h.column.getSize() !== 150
                            ? { width: h.column.getSize() }
                            : undefined
                        }
                        className={cn(
                          'h-10 px-4',
                          h.column.id === 'select' && 'px-4 text-center'
                        )}
                      >
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
                {loading && members.length === 0 ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow
                      key={i}
                      className="border-b divide-x divide-border"
                    >
                      {baseColumns.map(c => (
                        <TableCell key={c.id} className="px-4 py-3">
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map(row => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() ? 'selected' : undefined}
                      className="border-b last:border-0 divide-x divide-border hover:bg-muted/30 data-[state=selected]:bg-accent/40"
                    >
                      {row.getVisibleCells().map(cell => (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            'px-4 py-3',
                            cell.column.id === 'select' && 'px-4 text-center'
                          )}
                        >
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
                      colSpan={tableColumns.length}
                      className="h-32 text-center text-sm text-muted-foreground"
                    >
                      No team members found.
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
              label="members"
            />
          </div>
        </div>
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
    </>
  );
}
