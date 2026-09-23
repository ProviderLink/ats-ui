import { TablePagination } from '@/components/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePermission } from '@/hooks/use-permission';
import { useSearchWithPageRestore } from '@/hooks/use-search-with-page-restore';
import { useSocketRoom } from '@/hooks/use-socket-room';
import { cn } from '@/lib/utils';
import { useApplicationStore, useClientStore, useJobStore } from '@/store';
import { useUserStore } from '@/store/slices/users.store';
import type { Client, ClientContact, ClientStatus } from '@/store/types';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import {
  ArrowUpDownIcon,
  BriefcaseIcon,
  Building2Icon,
  ChevronDownIcon,
  CircleDotIcon,
  EllipsisIcon,
  ExternalLinkIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UserIcon,
} from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ClientDetailSheet } from './client-detail-sheet';
import { NewClientSheet } from './new-client-sheet';

// ─── Config ────────────────────────────────────────────────────────────────

const AVATAR_BG = [
  'bg-pine-teal-100 text-pine-teal-800 dark:bg-pine-teal-900 dark:text-pine-teal-200',
  'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
];

const statusConfig: Record<ClientStatus, { label: string; cls: string }> = {
  active: {
    label: 'Active',
    cls: 'border-pine-teal-600 text-pine-teal-700 dark:border-pine-teal-400 dark:text-pine-teal-300',
  },
  inactive: {
    label: 'Inactive',
    cls: 'border-silver-400 text-muted-foreground dark:border-white/20',
  },
  suspended: {
    label: 'Suspended',
    cls: 'border-rose-400 text-rose-600 dark:border-rose-400 dark:text-rose-400',
  },
};

const HEADER_CLS =
  'text-xs font-medium uppercase tracking-wide text-muted-foreground';
const SORT_BTN_CLS =
  '-ml-2 h-7 gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground';

// ─── Cell components ───────────────────────────────────────────────────────

function ColHeader({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className={HEADER_CLS}>{label}</span>
    </div>
  );
}

function SortHeader({
  column,
  label,
  icon,
}: {
  column: Column<Client>;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={SORT_BTN_CLS}
      onClick={() => column.toggleSorting()}
    >
      {icon}
      {label} <ArrowUpDownIcon className="size-3" />
    </Button>
  );
}

function CompanyCell({ client }: { client: Client }) {
  const bg = AVATAR_BG[client.companyName.charCodeAt(0) % AVATAR_BG.length];
  return (
    <div className="flex items-center gap-2 min-w-0">
      {client.logo ? (
        <img
          src={client.logo}
          alt={client.companyName}
          className="size-7 rounded-md object-cover shrink-0"
        />
      ) : (
        <div
          className={cn(
            'size-7 rounded-md flex items-center justify-center text-[10px] font-semibold shrink-0 select-none',
            bg
          )}
        >
          {client.companyName.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[13px] font-medium leading-tight truncate">
          {client.companyName}
        </p>
        <p className="text-[11px] text-muted-foreground truncate">
          {client.address
            ? `${client.address.city}, ${client.address.country}`
            : '—'}
        </p>
      </div>
      <CrmIndicator clientId={client._id} />
    </div>
  );
}

/** Tiny inline badge indicating CRM access status. Wrapped in its own component to use the store efficiently. */
function CrmIndicator({ clientId }: { clientId: string }) {
  const allUsers = useUserStore(s => s.items);
  const hasCrm = allUsers.some(
    u => u.clientRef === clientId && u.appAccess?.includes('crm') && u.isActive
  );
  if (!hasCrm) return null;
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full border border-pine-teal-500/30 bg-pine-teal-50 px-1.5 py-0.5 text-[9px] font-semibold text-pine-teal-700 dark:bg-pine-teal-950/40 dark:text-pine-teal-400 shrink-0 select-none"
      title="CRM access active"
    >
      <ShieldCheckIcon className="size-2.5" />
      CRM
    </span>
  );
}

function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const { label, cls } = statusConfig[status];
  return (
    <Badge className={cn('bg-transparent font-medium', cls)}>{label}</Badge>
  );
}

function ContactCell({ contacts }: { contacts: ClientContact[] }) {
  const primary = contacts.find(c => c.isPrimary) ?? contacts[0];
  if (!primary) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div>
      <p className="text-sm font-medium">{primary.name}</p>
      <p className="text-xs text-muted-foreground truncate max-w-40">
        {primary.position || primary.email}
      </p>
    </div>
  );
}

// ─── Table skeleton ────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 7 }).map((_, i) => (
        <TableRow key={i} className="border-b last:border-0">
          {Array.from({ length: 8 }).map((_, j) => (
            <TableCell key={j} className="px-4 py-3">
              <Skeleton className={cn('h-4', j === 0 ? 'w-36' : 'w-20')} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

// ─── Toolbar ───────────────────────────────────────────────────────────────

type ToolbarProps = {
  query: string;
  onQueryChange: (v: string) => void;
  statusFilter: ClientStatus | 'all';
  onStatusFilterChange: (v: ClientStatus | 'all') => void;
  sortBy: SortOption;
  onSortChange: (v: SortOption) => void;
  onAdd: () => void;
};

const STATUS_FILTER_LABELS: Record<ClientStatus | 'all', string> = {
  all: 'All statuses',
  active: 'Active',
  inactive: 'Inactive',
  suspended: 'Suspended',
};

function ClientsToolbar({
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
  onAdd,
}: ToolbarProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap shrink-0">
      <div className="relative flex-1 min-w-48 max-w-sm">
        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search clients..."
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          className="pl-8 h-9"
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-9 gap-1.5 rounded-full text-xs border-dashed',
              statusFilter !== 'all' &&
                'border-solid border-primary text-primary'
            )}
          >
            <CircleDotIcon className="size-3" />
            {STATUS_FILTER_LABELS[statusFilter]}
            <ChevronDownIcon className="size-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          {(['all', 'active', 'inactive', 'suspended'] as const).map(s => (
            <DropdownMenuItem
              key={s}
              onSelect={() => onStatusFilterChange(s)}
              className={cn(
                'text-sm',
                statusFilter === s && 'font-medium text-primary'
              )}
            >
              {STATUS_FILTER_LABELS[s]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-9 gap-1.5 rounded-full text-xs border-dashed',
              sortBy !== 'default' && 'border-solid border-primary text-primary'
            )}
          >
            <ArrowUpDownIcon className="size-3" />
            {sortBy === 'default' ? 'Sort' : SORT_LABELS[sortBy]}
            <ChevronDownIcon className="size-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          {(
            [
              'default',
              'newest',
              'oldest',
              'mostOpenJobs',
              'leastOpenJobs',
              'mostJobs',
              'leastJobs',
            ] as SortOption[]
          ).map(opt => (
            <DropdownMenuItem
              key={opt}
              onSelect={() => onSortChange(opt)}
              className={cn(
                'text-sm',
                sortBy === opt && 'font-medium text-primary'
              )}
            >
              {SORT_LABELS[opt]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="ml-auto">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onAdd}
                className="hover:bg-pine-teal-700 dark:hover:bg-pine-teal-700"
              >
                <PlusIcon /> Add Client
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add a new client</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

const EMPTY_CLIENTS: Client[] = [];

const VALID_SORT_OPTIONS = [
  'default',
  'newest',
  'oldest',
  'mostJobs',
  'leastJobs',
  'mostOpenJobs',
  'leastOpenJobs',
] as const;
type SortOption = (typeof VALID_SORT_OPTIONS)[number];

const SORT_LABELS: Record<SortOption, string> = {
  default: 'Default',
  newest: 'Newest first',
  oldest: 'Oldest first',
  mostJobs: 'Most jobs',
  leastJobs: 'Least jobs',
  mostOpenJobs: 'Most open jobs',
  leastOpenJobs: 'Least open jobs',
};

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

  const jobCountsByClient = useMemo(() => {
    const map = new Map<string, { total: number; open: number }>();
    for (const job of allJobs) {
      const entry = map.get(job.clientId) ?? { total: 0, open: 0 };
      entry.total++;
      if (job.status === 'open') entry.open++;
      map.set(job.clientId, entry);
    }
    return map;
  }, [allJobs]);

  useEffect(() => {
    // Reset any clientId filter that the Jobs page may have set in the shared
    // jobs store, then fetch all jobs so every client's counts are correct.
    fetchJobs({ clientId: undefined, limit: 9999 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = items;

  // Persisted pagination (page index in sessionStorage, page size in localStorage)
  const VALID_PAGE_SIZES = [10, 15, 20, 30, 50];
  const [pageIndex, setPageIndex] = useState(() => {
    const raw = parseInt(
      sessionStorage.getItem('clients-page-index') ?? '',
      10
    );
    return Number.isFinite(raw) && raw >= 0 ? raw : 0;
  });
  const [pageSize, setPageSize] = useState(() => {
    const raw = parseInt(localStorage.getItem('clients-page-size') ?? '', 10);
    return VALID_PAGE_SIZES.includes(raw) ? raw : 10;
  });

  function handlePaginationIndex(idx: number) {
    const safe = Number.isFinite(idx) && idx >= 0 ? idx : 0;
    sessionStorage.setItem('clients-page-index', String(safe));
    setPageIndex(safe);
  }

  function handlePaginationSize(size: number) {
    const safe = VALID_PAGE_SIZES.includes(size) ? size : 10;
    localStorage.setItem('clients-page-size', String(safe));
    sessionStorage.setItem('clients-page-index', '0');
    setPageSize(safe);
    setPageIndex(0);
  }

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
    [onSearchChange, setFilters]
  );

  const handleStatusFilterChange = useCallback(
    (v: ClientStatus | 'all') => {
      setStatusFilter(v);
      const status = v === 'all' ? undefined : v;
      setFilters({ status });
      handlePaginationIndex(0);
    },
    [setFilters]
  );

  const selectedClient = selectedClientId
    ? (items.find(c => c._id === selectedClientId) ?? null)
    : null;

  const editClient = editClientId
    ? (items.find(c => c._id === editClientId) ?? null)
    : null;

  // ── Deletion impact: count jobs and applications on the targeted client ─────
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

  // Server-filtered, client-sorted data
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const aCounts = jobCountsByClient.get(a._id);
      const bCounts = jobCountsByClient.get(b._id);
      const aOpen = aCounts?.open ?? 0;
      const bOpen = bCounts?.open ?? 0;
      const aTotal = aCounts?.total ?? 0;
      const bTotal = bCounts?.total ?? 0;
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();

      switch (sortBy) {
        case 'newest':
          return bTime - aTime;
        case 'oldest':
          return aTime - bTime;
        case 'mostJobs':
          if (bTotal !== aTotal) return bTotal - aTotal;
          return bTime - aTime;
        case 'leastJobs':
          if (aTotal !== bTotal) return aTotal - bTotal;
          return bTime - aTime;
        case 'mostOpenJobs':
          if (bOpen !== aOpen) return bOpen - aOpen;
          return bTime - aTime;
        case 'leastOpenJobs':
          if (aOpen !== bOpen) return aOpen - bOpen;
          return bTime - aTime;
        default:
          if (bOpen !== aOpen) return bOpen - aOpen;
          if (bTotal !== aTotal) return bTotal - aTotal;
          return bTime - aTime;
      }
    });
  }, [data, jobCountsByClient, sortBy]);

  // ── Client-side status + search filtering ──────────────────────────
  const filteredData = useMemo(() => {
    let result =
      statusFilter === 'all'
        ? sortedData
        : sortedData.filter(c => c.status === statusFilter);
    const q = query.trim().toLowerCase();
    if (!q) return result;
    return result.filter(client => {
      if (client.companyName.toLowerCase().includes(q)) return true;
      if (client.industry?.toLowerCase().includes(q)) return true;
      if (
        client.contacts.some(
          c =>
            c.name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q)
        )
      )
        return true;
      if (
        client.tags?.some(tag => {
          const name =
            typeof tag === 'object' && tag !== null
              ? (tag as { name?: string }).name
              : '';
          return name?.toLowerCase().includes(q);
        })
      )
        return true;
      return false;
    });
  }, [sortedData, statusFilter, query]);

  const pagedData = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, pageIndex, pageSize]);

  const displayedRowCount = filteredData.length;

  const cols = useMemo<ColumnDef<Client>[]>(
    () => [
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
          <ColHeader
            label="Status"
            icon={<CircleDotIcon className="size-3" />}
          />
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
          const client = row.original;
          const counts = jobCountsByClient.get(client._id);
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
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon-xs"
                        className="rounded-[3px] p-2 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent dark:hover:text-accent-foreground"
                        onClick={e => {
                          e.stopPropagation();
                          handleEdit(client);
                        }}
                      >
                        <PencilIcon className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Edit client</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {canDelete && (
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon-xs"
                        className="rounded-[3px] p-2 text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/40 dark:hover:bg-destructive/10 dark:hover:border-destructive/40"
                        onClick={e => {
                          e.stopPropagation();
                          setDeleteTarget(client);
                        }}
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Delete client</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon-xs"
                      className="rounded-[3px] p-2 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent dark:hover:text-accent-foreground"
                      onClick={e => {
                        e.stopPropagation();
                        handleViewJobs(client);
                      }}
                    >
                      <ExternalLinkIcon className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    View jobs for this client
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          );
        },
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
    ],
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
    []
  );

  const handlePageSizeChange = useCallback(
    (size: number) => handlePaginationSize(size),
    []
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
                  <TableSkeleton />
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

      <Dialog
        open={!!deleteTarget}
        onOpenChange={open => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete client?</DialogTitle>
            <DialogDescription>
              <strong>{deleteTarget?.companyName}</strong> will be permanently
              removed. This cannot be undone.
              {(deleteTargetJobCount > 0 || deleteTargetAppCount > 0) && (
                <span className="mt-2 block text-destructive font-medium text-xs rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
                  ⚠ This will also permanently delete{' '}
                  {deleteTargetJobCount > 0 && (
                    <>
                      {deleteTargetJobCount} job
                      {deleteTargetJobCount > 1 ? 's' : ''}
                    </>
                  )}
                  {deleteTargetJobCount > 0 &&
                    deleteTargetAppCount > 0 &&
                    ' and '}
                  {deleteTargetAppCount > 0 && (
                    <>
                      {deleteTargetAppCount} application
                      {deleteTargetAppCount > 1 ? 's' : ''}
                    </>
                  )}{' '}
                  associated with this client.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={mutating}
              onClick={handleDeleteConfirm}
            >
              {mutating ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
