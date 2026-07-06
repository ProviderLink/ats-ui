'use client';

import { TablePagination } from '@/components/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn, formatDate } from '@/lib/utils';
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
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  CircleDotIcon,
  EllipsisIcon,
  PencilIcon,
  PlusIcon,
  ShieldIcon,
  Trash2Icon,
  UserIcon,
  UsersIcon,
  XIcon,
} from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';
import type { UserRole } from '../_data/team';
import { ALL_ROLES, AVATAR_BG, ROLE_LABELS } from '../_data/team';
import { InviteTeamSheet } from './invite-team-sheet';
import { PermissionGuideDialog } from './permission-guide-dialog';
import { TeamMemberEditSheet } from './team-member-edit-sheet';
import { TeamMemberSheet } from './team-member-sheet';

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

function ColHeader({ icon, label }: { icon?: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

function MemberCell({
  member,
  onClick,
}: {
  member: User;
  onClick: () => void;
}) {
  const first = member.firstName ?? '';
  const last = member.lastName ?? '';
  const initials = ((first[0] ?? '') + (last[0] ?? '')).toUpperCase() || '?';
  const bg =
    AVATAR_BG[
      ((first.charCodeAt(0) || 0) + (last.charCodeAt(0) || 0)) %
        AVATAR_BG.length
    ];
  return (
    <div className="flex items-start gap-3 min-w-0">
      <div
        className={cn(
          'size-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 select-none overflow-hidden',
          !member.avatar && bg
        )}
      >
        {member.avatar ? (
          <img
            src={member.avatar}
            alt={`${first} ${last}`}
            className="size-full object-cover"
          />
        ) : (
          initials
        )}
      </div>
      <div className="flex flex-col gap-1.5 min-w-0 pt-1.5">
        <button
          type="button"
          onClick={onClick}
          className="text-sm font-medium leading-tight truncate text-left hover:text-primary hover:underline underline-offset-4 transition-colors cursor-pointer"
        >
          {first} {last}
        </button>
        {!member.isInviteAccepted && (
          <span className="inline-flex w-fit items-center gap-1 rounded-full border border-amber-400 bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:border-amber-500/50 dark:text-amber-400">
            <span className="size-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
            Invite pending
          </span>
        )}
      </div>
    </div>
  );
}

function StatusBadge({
  isActive,
  isInviteAccepted,
}: {
  isActive: boolean;
  isInviteAccepted: boolean;
}) {
  const invited = isActive && !isInviteAccepted;
  const variant = invited ? 'invited' : isActive ? 'active' : 'inactive';

  const colors = {
    active: 'border-[#69c58a]/60 text-[#2d8a51] dark:text-[#69c58a]',
    inactive: 'border-rose-400/60 text-rose-600 dark:text-rose-400',
    invited: 'border-amber-400/60 text-amber-600 dark:text-amber-400',
  };

  const dotColors = {
    active: 'bg-[#69c58a]',
    inactive: 'bg-rose-500 dark:bg-rose-400',
    invited: 'bg-amber-500 dark:bg-amber-400',
  };

  const labels = {
    active: 'Active',
    inactive: 'Inactive',
    invited: 'Invited',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        colors[variant]
      )}
    >
      <span className={cn('size-1.5 rounded-full', dotColors[variant])} />
      {labels[variant]}
    </span>
  );
}

function FilterChip({
  icon,
  label,
  active,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-7 gap-1.5 rounded-full text-xs border-dashed',
            active && 'border-solid border-primary text-primary'
          )}
        >
          {icon}
          {label}
          <ChevronDownIcon className="size-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const baseColumns: ColumnDef<User>[] = [
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
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.roles?.[0]
          ? (ROLE_LABELS[row.original.roles[0]] ?? row.original.roles[0])
          : '—'}
      </span>
    ),
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
      <StatusBadge
        isActive={row.original.isActive}
        isInviteAccepted={row.original.isInviteAccepted}
      />
    ),
  },
  {
    id: 'joinedAt',
    accessorKey: 'createdAt',
    size: 120,
    header: () => (
      <ColHeader
        icon={<CalendarIcon className="size-3 text-muted-foreground" />}
        label="Joined date"
      />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(row.original.createdAt)}
      </span>
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
            <Badge key={a} variant="secondary" className="uppercase text-xs">
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
  const [pagination, setPagination] = useState(() => {
    const VALID_SIZES = [10, 15, 20, 30, 50];
    const rawIndex = parseInt(
      sessionStorage.getItem('team-page-index') ?? '',
      10
    );
    const rawSize = parseInt(localStorage.getItem('team-page-size') ?? '', 10);
    const pageIndex = Number.isFinite(rawIndex) && rawIndex >= 0 ? rawIndex : 0;
    const pageSize = VALID_SIZES.includes(rawSize) ? rawSize : 15;
    return { pageIndex, pageSize };
  });

  function handlePaginationChange(
    updater:
      | { pageIndex: number; pageSize: number }
      | ((prev: { pageIndex: number; pageSize: number }) => {
          pageIndex: number;
          pageSize: number;
        })
  ) {
    setPagination(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const safeIndex =
        Number.isFinite(next.pageIndex) && next.pageIndex >= 0
          ? next.pageIndex
          : 0;
      const safeSize = next.pageSize > 0 ? next.pageSize : 15;
      sessionStorage.setItem('team-page-index', String(safeIndex));
      localStorage.setItem('team-page-size', String(safeSize));
      return { pageIndex: safeIndex, pageSize: safeSize };
    });
  }

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
    let data = members;
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
