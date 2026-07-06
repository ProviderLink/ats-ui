import { TablePagination } from '@/components/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getJson } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import type { Application, Client, Job, JobFilters, JobStatus } from '@/store';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ChevronDownIcon,
  CircleDotIcon,
  PlusIcon,
  SearchIcon,
  UserIcon,
  XIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { NewJobSheet } from './new-job-sheet';

const DEFAULT_PAGE_SIZE = 10;
const VALID_PAGE_SIZES = [10, 15, 20, 30, 50];

const statusVariant: Record<
  JobStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  open: 'default',
  draft: 'secondary',
  on_hold: 'outline',
  closed: 'destructive',
};

const statusLabel: Record<JobStatus, string> = {
  open: 'Open',
  draft: 'Draft',
  on_hold: 'On Hold',
  closed: 'Closed',
};

const locationTypeLabel: Record<string, string> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
};

type Props = {
  jobs: Job[];
  clients: Client[];
  loading: boolean;
  isRefreshing: boolean;
  filters: JobFilters;
  onFiltersChange: (f: Partial<JobFilters>) => void;
  selectedId: string;
  onSelect: (id: string) => void;
};

export function JobList({
  jobs,
  clients,
  loading,
  isRefreshing,
  filters,
  onFiltersChange,
  selectedId,
  onSelect,
}: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [addOpen, setAddOpen] = useState(
    () => searchParams.get('action') === 'new'
  );

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setAddOpen(true);
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          next.delete('action');
          return next;
        },
        { replace: true }
      );
    }
  }, [searchParams, setSearchParams]);
  const [pagination, setPagination] = useState(() => {
    const rawIndex = parseInt(
      sessionStorage.getItem('jobs-page-index') ?? '',
      10
    );
    const rawSize = parseInt(localStorage.getItem('jobs-page-size') ?? '', 10);
    const pageIndex = Number.isFinite(rawIndex) && rawIndex >= 0 ? rawIndex : 0;
    const pageSize = VALID_PAGE_SIZES.includes(rawSize)
      ? rawSize
      : DEFAULT_PAGE_SIZE;
    return { pageIndex, pageSize };
  });

  const clientMap = useMemo(
    () => Object.fromEntries((clients ?? []).map(c => [c._id, c.companyName])),
    [clients]
  );

  // Keep a local snapshot of all applications so each job card can show its
  // candidate count. This is intentionally NOT the shared application store:
  // the job panel's Candidates tab refetches applications for the selected
  // job, which would otherwise clobber the store and zero out every other
  // card's count. A local fetch keeps the list counts stable.
  const [applications, setApplications] = useState<Application[]>([]);
  useEffect(() => {
    let alive = true;
    void getJson<Application[] | { data: Application[] }>('/ats/applications', {
      limit: 9999,
    })
      .then(res => {
        if (!alive) return;
        setApplications(Array.isArray(res) ? res : (res.data ?? []));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const candidateCountByJob = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of applications) {
      map.set(a.jobId, (map.get(a.jobId) ?? 0) + 1);
    }
    return map;
  }, [applications]);

  const filtered = useMemo(() => {
    let list = jobs ?? [];
    if (filters.status) list = list.filter(j => j.status === filters.status);
    if (filters.clientId)
      list = list.filter(j => j.clientId === filters.clientId);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        j =>
          j.title.toLowerCase().includes(q) ||
          (clientMap[j.clientId] ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [jobs, filters.status, filters.clientId, query, clientMap]);

  function persistPagination(next: { pageIndex: number; pageSize: number }) {
    sessionStorage.setItem('jobs-page-index', String(next.pageIndex));
    localStorage.setItem('jobs-page-size', String(next.pageSize));
  }

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
      const safeSize = next.pageSize > 0 ? next.pageSize : DEFAULT_PAGE_SIZE;
      persistPagination({ pageIndex: safeIndex, pageSize: safeSize });
      return { pageIndex: safeIndex, pageSize: safeSize };
    });
  }

  // Clamp pageIndex if data or filters reduce available pages
  useEffect(() => {
    if (filtered.length === 0) return;
    const pageCount = Math.ceil(filtered.length / pagination.pageSize);
    setPagination(prev => {
      if (prev.pageIndex < pageCount) return prev;
      const safeIndex = Math.max(0, pageCount - 1);
      persistPagination({ pageIndex: safeIndex, pageSize: prev.pageSize });
      return { ...prev, pageIndex: safeIndex };
    });
  }, [filtered.length, pagination.pageSize]);

  const table = useReactTable({
    data: filtered,
    columns: [],
    state: { pagination },
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
  });

  const paginated = table.getRowModel().rows.map(r => r.original);

  function closeSearch() {
    setSearchOpen(false);
    setQuery('');
    handlePaginationChange(p => ({ ...p, pageIndex: 0 }));
  }

  return (
    <>
      <div className="w-72 md:w-96 shrink-0 border-r border-t flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-2 border-b flex items-center gap-1">
          {searchOpen ? (
            <div className="flex flex-1 items-center gap-2">
              <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Search jobs..."
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  handlePaginationChange(p => ({ ...p, pageIndex: 0 }));
                }}
                onBlur={e => {
                  if (!e.target.value) {
                    setSearchOpen(false);
                    handlePaginationChange(p => ({ ...p, pageIndex: 0 }));
                  }
                }}
                className="h-8 flex-1 border-none shadow-none bg-transparent dark:bg-transparent pl-2 pr-0 text-sm focus-visible:ring-0"
              />
              <Button variant="ghost" size="icon-sm" onClick={closeSearch}>
                <XIcon />
              </Button>
            </div>
          ) : (
            <>
              <span className="flex-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Jobs ({filtered.length})
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setSearchOpen(true)}
                    >
                      <SearchIcon />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Search jobs</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setAddOpen(true)}
                    >
                      <PlusIcon className="size-3.5" />
                      Add Job
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add job</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </div>

        {/* Filters */}
        <div className="px-3 py-2 border-b flex items-center gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'h-7 gap-1.5 rounded-full text-xs border-dashed',
                  filters.status && 'border-solid border-primary text-primary'
                )}
              >
                <CircleDotIcon className="size-3" />
                {filters.status
                  ? `Status: ${statusLabel[filters.status]}`
                  : 'Status'}
                <ChevronDownIcon className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              {(['all', 'open', 'draft', 'on_hold', 'closed'] as const).map(
                s => (
                  <DropdownMenuItem
                    key={s}
                    onSelect={() =>
                      onFiltersChange({
                        status: s === 'all' ? undefined : (s as JobStatus),
                        page: 1,
                      })
                    }
                    className={cn(
                      'text-sm',
                      (filters.status ?? 'all') === s &&
                        'font-medium text-primary'
                    )}
                  >
                    {s === 'all' ? 'All Status' : statusLabel[s]}
                  </DropdownMenuItem>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {filters.status && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={() =>
                onFiltersChange({
                  status: undefined,
                  page: 1,
                })
              }
            >
              Clear filter
            </Button>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isRefreshing && (
            <div className="h-px bg-muted overflow-hidden">
              <div className="h-full w-1/3 bg-primary/40 animate-pulse rounded-full" />
            </div>
          )}
          {loading && jobs.length === 0 ? (
            <div className="flex flex-col gap-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="px-4 py-3 border-b last:border-b-0">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-14 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <p className="px-4 py-6 text-xs text-center text-muted-foreground">
              No jobs found.
            </p>
          ) : (
            paginated.map(job => {
              const isSelected = selectedId === job._id;
              return (
                <button
                  key={job._id}
                  onClick={() => onSelect(job._id)}
                  className={cn(
                    'group w-full text-left px-4 py-3 transition-colors hover:bg-foreground/[0.04]',
                    isSelected
                      ? 'bg-foreground/[0.06] border-r-2 border-r-primary'
                      : 'border-r-2 border-r-transparent'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-sm leading-snug">
                      {job.title}
                    </span>
                    <Badge variant={statusVariant[job.status]}>
                      {statusLabel[job.status]}
                    </Badge>
                  </div>
                  <p
                    className={cn(
                      'mt-0.5 text-sm transition-colors',
                      isSelected
                        ? 'text-foreground/70'
                        : 'text-muted-foreground group-hover:text-foreground/70'
                    )}
                  >
                    {clientMap[job.clientId] ?? '—'}
                  </p>
                  <div
                    className={cn(
                      'mt-1 flex items-center gap-2 text-xs transition-colors',
                      isSelected
                        ? 'text-foreground/55'
                        : 'text-muted-foreground group-hover:text-foreground/55'
                    )}
                  >
                    <span>{locationTypeLabel[job.locationType]}</span>
                    <span>·</span>
                    <span>
                      {job.openings} opening{job.openings !== 1 ? 's' : ''}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <UserIcon className="size-3" />
                      {candidateCountByJob.get(job._id) ?? 0} candidate
                      {(candidateCountByJob.get(job._id) ?? 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {filtered.length > 0 && (
          <div className="border-t shrink-0 bg-background">
            <TablePagination
              table={table}
              pageIndex={pagination.pageIndex}
              pageSize={pagination.pageSize}
              totalRows={filtered.length}
              label="jobs"
              compact
            />
          </div>
        )}
      </div>

      <NewJobSheet open={addOpen} onOpenChange={setAddOpen} clients={clients} />
    </>
  );
}
