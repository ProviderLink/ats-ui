import { CandidateDetailSheet } from '@/app/candidates/_components/candidate-detail-sheet';
import {
  CandidateCell,
  ColHeader,
  SortHeader,
  TableSkeleton,
} from '@/app/candidates/_components/candidates-table';
import { ComposeEmailSheet } from '@/app/emails/_components/compose-email-sheet';
import { TablePagination } from '@/components/table-pagination';
import { TagList } from '@/components/tag-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { useSocketRoom } from '@/hooks/use-socket-room';
import { useTablePagination } from '@/hooks/use-table-pagination';
import { cn, formatDate } from '@/lib/utils';
import { useApplicationStore } from '@/store/slices/applications.store';
import { useCandidateStore } from '@/store/slices/candidates.store';
import { useClientStore } from '@/store/slices/clients.store';
import { useJobStore } from '@/store/slices/jobs.store';
import { useTagStore } from '@/store/slices/tags.store';
import type { Application, Candidate, Tag } from '@/store/types';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import {
  BriefcaseIcon,
  CheckIcon,
  EllipsisIcon,
  FilterIcon,
  MailIcon,
  SearchIcon,
  StarIcon,
  XIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * Hired candidates get their own page, mirroring Talent Pool and Ineligible.
 *
 * A candidate is hired when they hold a `hired` application, so this list is
 * application-derived — the same rule the spec defines for the Hired queue.
 * The candidate's original hire is what puts them here; assigning them to a
 * further job adds a pipeline entry without removing the hire record.
 */
export function HiredTable() {
  const items = useCandidateStore(s => s.items);
  const loading = useCandidateStore(s => s.loading);
  const mutating = useCandidateStore(s => s.mutating);
  const updateTalentPool = useCandidateStore(s => s.updateTalentPool);
  const assignJob = useCandidateStore(s => s.assignJob);

  const allTags = useTagStore(s => s.items);
  const fetchTags = useTagStore(s => s.fetch);

  const jobs = useJobStore(s => s.items);
  const fetchJobs = useJobStore(s => s.fetch);

  const clients = useClientStore(s => s.items);
  const fetchClients = useClientStore(s => s.fetch);

  const applications = useApplicationStore(s => s.items);
  const fetchAppsScoped = useApplicationStore(s => s.fetchScoped);

  useSocketRoom('candidates');
  useSocketRoom('applications');

  const [query, setQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'hiredDate', desc: true },
  ]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [assignJobOpen, setAssignJobOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Candidate | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTarget, setComposeTarget] = useState<Candidate | null>(null);

  const { pageIndex, pageSize, handlePaginationChange, resetPage } =
    useTablePagination({ storageKey: 'hired', defaultSize: 20 });

  useEffect(() => {
    if (allTags.length === 0) fetchTags();
  }, [allTags.length, fetchTags]);

  useEffect(() => {
    if (jobs.length === 0) fetchJobs({ page: 1, limit: 9999 });
  }, [jobs.length, fetchJobs]);

  useEffect(() => {
    if (clients.length === 0) fetchClients({ page: 1, limit: 9999 });
  }, [clients.length, fetchClients]);

  // The Hired list is application-derived, so the shared applications list must
  // hold the full dataset. Other screens issue filtered fetches; this page
  // therefore takes its own unfiltered copy so it can never render empty
  // because of what another page happened to load.
  const [scopedApps, setScopedApps] = useState<Application[]>([]);
  useEffect(() => {
    let alive = true;
    fetchAppsScoped({ limit: 9999 })
      .then(rows => {
        if (alive) setScopedApps(rows);
      })
      .catch(() => {
        if (alive) setScopedApps([]);
      });
    return () => {
      alive = false;
    };
  }, [fetchAppsScoped]);

  // Prefer the shared list when it looks complete, otherwise fall back to the
  // page's own fetch. The shared list is the same data, so either works — this
  // only guards against it being a filtered subset.
  const apps = scopedApps.length > 0 ? scopedApps : applications;

  const searchTimer = useRef<ReturnType<typeof setTimeout>>(null);

  // ── Hire records ─────────────────────────────────────────────────
  // candidateId -> every job the candidate was hired for, newest first.
  const hireInfoByCandidateId = useMemo(() => {
    const jobById = new Map(jobs.map(j => [j._id, j]));
    const clientNameById = new Map(clients.map(c => [c._id, c.companyName]));
    const map = new Map<
      string,
      {
        jobTitle: string;
        clientName: string;
        hiredAt: string;
      }[]
    >();
    for (const a of apps) {
      if (a.phase !== 'hired') continue;
      const job = jobById.get(a.jobId);
      const infos = map.get(a.candidateId) ?? [];
      infos.push({
        jobTitle: job?.title ?? a.jobId,
        clientName: job ? (clientNameById.get(job.clientId) ?? '') : '',
        hiredAt: a.hiredAt ?? a.createdAt,
      });
      map.set(a.candidateId, infos);
    }
    return map;
  }, [apps, jobs, clients]);

  // candidateId -> active pipeline apps + talent pool flag, shown as a
  // compact "other activity" column so a hired candidate's additional jobs
  // are still visible without moving them out of the Hired list.
  const otherActivityByCandidateId = useMemo(() => {
    const map = new Map<
      string,
      { inPipeline: number; inTalentPool: boolean }
    >();
    for (const a of apps) {
      if (a.phase !== 'approved') continue;
      const e = map.get(a.candidateId) ?? {
        inPipeline: 0,
        inTalentPool: false,
      };
      e.inPipeline++;
      map.set(a.candidateId, e);
    }
    for (const c of items) {
      const e = map.get(c._id);
      if (e) e.inTalentPool = c.inTalentPool;
    }
    return map;
  }, [apps, items]);

  const openJobs = useMemo(() => {
    const clientMap = new Map(clients.map(c => [c._id, c.companyName]));
    return jobs
      .filter(j => j.status === 'open')
      .map(j => ({
        _id: j._id,
        title: j.title,
        clientName: clientMap.get(j.clientId) ?? '',
        stages: (j.pipeline?.stages ?? [])
          .filter(s => s.isActive)
          .sort((a, b) => a.order - b.order)
          .map(s => ({ _id: s._id, name: s.name })),
      }));
  }, [jobs, clients]);

  // ── Client-side filtering ────────────────────────────────────────
  const data = useMemo(() => {
    let result = items.filter(c => hireInfoByCandidateId.has(c._id));

    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(c => {
        const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
        if (fullName.includes(q)) return true;
        if (c.email?.toLowerCase().includes(q)) return true;
        if (c.phone?.toLowerCase().includes(q)) return true;
        const skills = (c.parsedData?.skills ?? []).join(' ').toLowerCase();
        if (skills.includes(q)) return true;
        return false;
      });
    }

    if (tagFilter.length > 0) {
      result = result.filter(c =>
        c.tags?.some(t => {
          const tagId = typeof t === 'string' ? t : (t as { _id: string })?._id;
          return tagId && tagFilter.includes(tagId);
        })
      );
    }

    return result;
  }, [items, query, tagFilter, hireInfoByCandidateId]);

  const totalRows = data.length;

  function handleSearchChange(q: string) {
    setInputValue(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    resetPage();
    searchTimer.current = setTimeout(() => setQuery(q), 300);
  }

  function handleClearSearch() {
    setInputValue('');
    setQuery('');
    if (searchTimer.current) clearTimeout(searchTimer.current);
  }

  async function handleAssignToJob(jobId: string, startStageId?: string) {
    if (!assignTarget) return;
    try {
      await assignJob(assignTarget._id, jobId, startStageId);
      await fetchAppsScoped({ limit: 9999 }).then(setScopedApps);
      toast.success(
        `${assignTarget.firstName} ${assignTarget.lastName} assigned to job`
      );
      setAssignJobOpen(false);
      setAssignTarget(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleTalentPool(candidate: Candidate) {
    try {
      await updateTalentPool(
        candidate._id,
        candidate.inTalentPool ? 'remove' : 'add'
      );
      toast.success(
        candidate.inTalentPool
          ? `${candidate.firstName} ${candidate.lastName} removed from talent pool`
          : `${candidate.firstName} ${candidate.lastName} added to talent pool`
      );
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  // Stable identity for the columns memo below.
  const handleTalentPoolCb = useCallback(handleTalentPool, [updateTalentPool]);

  function openDetail(candidate: Candidate) {
    setSelected(candidate);
    setDetailOpen(true);
  }

  function buildComposeMode() {
    if (!composeTarget) return { type: 'new' as const };
    return {
      type: 'prefill' as const,
      to: composeTarget.email,
      subject: '',
      body: '',
      templateType: 'general',
      context: { type: 'general', candidateId: composeTarget._id },
      variables: {
        candidateName: `${composeTarget.firstName} ${composeTarget.lastName}`,
        candidateEmail: composeTarget.email,
        candidatePhone: composeTarget.phone ?? '',
        jobTitle: '',
        clientName: '',
        currentStage: '',
        senderName: '',
      },
    };
  }

  const columns: ColumnDef<Candidate>[] = useMemo(
    () => [
      {
        id: 'select',
        header: () => (
          <Checkbox
            checked={
              data.length > 0 && selectedIds.size === data.length
                ? true
                : selectedIds.size > 0
                  ? 'indeterminate'
                  : false
            }
            onCheckedChange={() =>
              setSelectedIds(prev =>
                prev.size === data.length
                  ? new Set()
                  : new Set(data.map(c => c._id))
              )
            }
            aria-label="Select all hired candidates"
          />
        ),
        cell: ({ row }) => (
          <div onClick={e => e.stopPropagation()}>
            <Checkbox
              checked={selectedIds.has(row.original._id)}
              onCheckedChange={() =>
                setSelectedIds(prev => {
                  const next = new Set(prev);
                  if (next.has(row.original._id)) next.delete(row.original._id);
                  else next.add(row.original._id);
                  return next;
                })
              }
              aria-label={`Select ${row.original.firstName} ${row.original.lastName}`}
            />
          </div>
        ),
        enableSorting: false,
        size: 40,
      },
      {
        id: 'candidate',
        accessorFn: row => `${row.firstName} ${row.lastName}`,
        header: ({ column }) => (
          <SortHeader column={column} label="Candidate" />
        ),
        cell: ({ row }) => <CandidateCell candidate={row.original} />,
      },
      {
        id: 'hiredFor',
        header: () => <ColHeader>Hired For</ColHeader>,
        cell: ({ row }) => {
          const infos = hireInfoByCandidateId.get(row.original._id);
          if (!infos || infos.length === 0)
            return <span className="text-xs text-muted-foreground">—</span>;
          const first = infos[0];
          const rest = infos.slice(1);
          return (
            <div className="flex items-start gap-1.5 min-w-35 max-w-55 rounded-sm border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30 px-2 py-1 -my-1">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium whitespace-normal leading-tight">
                  {first.jobTitle}
                </p>
                {first.clientName && (
                  <p className="text-[11px] text-muted-foreground whitespace-normal leading-tight mt-0.5">
                    {first.clientName}
                  </p>
                )}
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {formatDate(first.hiredAt)}
                </p>
              </div>
              {rest.length > 0 && (
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1 h-4 cursor-default shrink-0"
                      >
                        +{rest.length}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs max-w-56">
                      {rest.map(i => i.jobTitle).join(', ')}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          );
        },
      },
      {
        id: 'otherActivity',
        header: () => <ColHeader>Other Activity</ColHeader>,
        cell: ({ row }) => {
          const info = otherActivityByCandidateId.get(row.original._id);
          const inPipeline = info?.inPipeline ?? 0;
          const inTalentPool = info?.inTalentPool ?? false;
          if (inPipeline === 0 && !inTalentPool)
            return <span className="text-xs text-muted-foreground">—</span>;
          return (
            <div className="flex flex-wrap items-center gap-1">
              {inPipeline > 0 && (
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className="h-5 gap-1 border-blue-200 bg-blue-50 text-[10px] font-medium text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300"
                      >
                        <BriefcaseIcon className="size-2.5" />
                        {inPipeline} pipeline
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      Also active in {inPipeline}{' '}
                      {inPipeline === 1 ? 'pipeline' : 'pipelines'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {inTalentPool && (
                <Badge
                  variant="outline"
                  className="h-5 gap-1 border-violet-200 bg-violet-50 text-[10px] font-medium text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-300"
                >
                  <StarIcon className="size-2.5" />
                  Pool
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        id: 'tags',
        header: () => <ColHeader>Tags</ColHeader>,
        cell: ({ row }) => <TagList tags={row.original.tags} max={3} />,
        size: 120,
        minSize: 80,
      },
      {
        id: 'hiredDate',
        accessorFn: row => {
          const infos = hireInfoByCandidateId.get(row._id);
          return infos?.[0]?.hiredAt ?? row.createdAt;
        },
        header: () => <ColHeader>Hired Date</ColHeader>,
        cell: ({ row }) => {
          const infos = hireInfoByCandidateId.get(row.original._id);
          return (
            <span className="text-xs text-muted-foreground">
              {formatDate(infos?.[0]?.hiredAt ?? row.original.createdAt)}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: () => (
          <div className="flex justify-center">
            <EllipsisIcon className="size-4 text-muted-foreground" />
          </div>
        ),
        cell: ({ row }) => {
          const candidate = row.original;
          return (
            <div
              className="flex items-center gap-1"
              onClick={e => e.stopPropagation()}
            >
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon-xs"
                      className="rounded p-2 hover:bg-accent hover:text-accent-foreground"
                      onClick={() => {
                        setAssignTarget(candidate);
                        setAssignJobOpen(true);
                      }}
                    >
                      <BriefcaseIcon className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Assign to a new job
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon-xs"
                      className="rounded p-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
                      disabled={!candidate.email || mutating}
                      onClick={() => {
                        setComposeTarget(candidate);
                        setComposeOpen(true);
                      }}
                    >
                      <MailIcon className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {candidate.email ? 'Email candidate' : 'No email address'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="rounded p-2"
                  >
                    <EllipsisIcon className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    className="gap-2.5"
                    onClick={() => handleTalentPoolCb(candidate)}
                  >
                    <StarIcon className="size-3.5" />
                    {candidate.inTalentPool
                      ? 'Remove from Talent Pool'
                      : 'Add to Talent Pool'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        size: 130,
        minSize: 120,
      },
    ],
    [
      data,
      selectedIds,
      hireInfoByCandidateId,
      otherActivityByCandidateId,
      mutating,
      handleTalentPoolCb,
    ]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination: { pageIndex, pageSize },
    },
    onSortingChange: setSorting,
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
  });

  const hasFilters = !!query || tagFilter.length > 0;

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <div className="relative min-w-48 max-w-sm flex-1">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by name, email, phone, or skills…"
              value={inputValue}
              onChange={e => handleSearchChange(e.target.value)}
              className="pl-8 pr-8 h-9"
            />
            {inputValue && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute right-0.5 top-1/2 -translate-y-1/2 size-7"
                onClick={handleClearSearch}
              >
                <XIcon className="size-3.5" />
              </Button>
            )}
          </div>

          <TagFilter
            allTags={allTags}
            selected={tagFilter}
            onChange={ids => {
              setTagFilter(ids);
              resetPage();
            }}
          />
        </div>

        <p className="text-xs text-muted-foreground -mt-1 shrink-0">
          {loading && data.length === 0
            ? 'Loading…'
            : `${totalRows} ${totalRows === 1 ? 'candidate' : 'candidates'}${hasFilters ? ' found' : ' hired'}`}
        </p>

        {/* Table */}
        <div className="rounded-lg border flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-foreground/5 dark:bg-muted">
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
              <TableBody>
                {loading && data.length === 0 ? (
                  <TableSkeleton cols={columns.length} />
                ) : table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map(row => (
                    <TableRow
                      key={row.id}
                      className="border-b last:border-0 hover:bg-foreground/4 dark:hover:bg-white/3 cursor-pointer"
                      onClick={() => openDetail(row.original)}
                    >
                      {row.getVisibleCells().map(cell => (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            'px-4 py-3',
                            cell.column.id === 'hiredFor' && 'whitespace-normal'
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
                      colSpan={columns.length}
                      className="h-32 text-center text-sm text-muted-foreground"
                    >
                      No hired candidates yet.
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
              totalRows={totalRows}
              label="candidates"
            />
          </div>
        </div>
      </div>

      {/* Detail sheet — the standard candidate sheet already renders the
          hired-specific sections and footer actions. */}
      <CandidateDetailSheet
        candidate={selected}
        open={detailOpen}
        onOpenChange={open => {
          setDetailOpen(open);
          if (!open) setSelected(null);
        }}
        mutating={mutating}
      />

      <AssignJobDialog
        open={assignJobOpen}
        onClose={() => {
          setAssignJobOpen(false);
          setAssignTarget(null);
        }}
        onConfirm={handleAssignToJob}
        jobs={openJobs}
      />

      <ComposeEmailSheet
        open={composeOpen}
        onOpenChange={setComposeOpen}
        mode={buildComposeMode()}
      />
    </TooltipProvider>
  );
}

// ── Tag filter (mirrors the talent-pool toolbar control) ──────────────────
function TagFilter({
  allTags,
  selected,
  onChange,
}: {
  allTags: Tag[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return allTags;
    const q = search.toLowerCase();
    return allTags.filter(t => t.name.toLowerCase().includes(q));
  }, [allTags, search]);

  const toggle = (id: string) =>
    onChange(
      selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]
    );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5">
          <FilterIcon className="size-3.5" />
          Tags
          {selected.length > 0 && (
            <Badge
              variant="secondary"
              className="h-4 px-1.5 text-[10px] rounded-full"
            >
              {selected.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-0">
        <div className="flex flex-col">
          <div className="p-2 border-b">
            <Input
              placeholder="Search tags…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="px-2 py-3 text-xs text-muted-foreground text-center">
                No tags found
              </p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {filtered.map(tag => (
                  <button
                    key={tag._id}
                    type="button"
                    className={cn(
                      'flex items-center gap-2 rounded px-2 py-1.5 text-xs text-left hover:bg-muted transition-colors',
                      selected.includes(tag._id) && 'bg-muted'
                    )}
                    onClick={() => toggle(tag._id)}
                  >
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="flex-1 truncate">{tag.name}</span>
                    {selected.includes(tag._id) && (
                      <XIcon className="size-3 text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          {selected.length > 0 && (
            <div className="border-t px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  {selected.length} selected
                </span>
                <button
                  type="button"
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => onChange([])}
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Assign to job (job + optional starting stage) ─────────────────────────
function AssignJobDialog({
  open,
  onClose,
  onConfirm,
  jobs,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (jobId: string, startStageId?: string) => void;
  jobs: {
    _id: string;
    title: string;
    clientName?: string;
    stages?: { _id: string; name: string }[];
  }[];
}) {
  const [selected, setSelected] = useState('');
  const [search, setSearch] = useState('');
  const [selectedStageId, setSelectedStageId] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return jobs;
    const q = search.toLowerCase();
    return jobs.filter(
      j =>
        j.title.toLowerCase().includes(q) ||
        (j.clientName ?? '').toLowerCase().includes(q)
    );
  }, [jobs, search]);

  const selectedJob = useMemo(
    () => jobs.find(j => j._id === selected),
    [jobs, selected]
  );
  const stages = selectedJob?.stages ?? [];

  return (
    <Dialog
      open={open}
      onOpenChange={v => {
        if (!v) {
          setSelected('');
          setSearch('');
          setSelectedStageId('');
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign to a new job</DialogTitle>
          <DialogDescription>
            This adds a pipeline entry for the new job. The candidate stays in
            the Hired list.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search jobs…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <div className="max-h-64 overflow-y-auto rounded-md border">
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                No jobs found
              </p>
            ) : (
              <div className="flex flex-col">
                {filtered.map(j => (
                  <button
                    key={j._id}
                    type="button"
                    className={cn(
                      'flex items-start gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors',
                      selected === j._id && 'bg-muted font-medium'
                    )}
                    onClick={() => {
                      setSelected(j._id);
                      setSelectedStageId('');
                    }}
                  >
                    <span
                      className={cn(
                        'mt-0.5 size-4 rounded-full border flex items-center justify-center shrink-0',
                        selected === j._id
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30'
                      )}
                    >
                      {selected === j._id && <CheckIcon className="size-3" />}
                    </span>
                    <span className="min-w-0 flex flex-col">
                      <span className="truncate">{j.title}</span>
                      {j.clientName && (
                        <span className="text-xs text-muted-foreground truncate">
                          {j.clientName}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selected && stages.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">
                Starting pipeline stage (optional)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {stages.map(s => (
                  <button
                    key={s._id}
                    type="button"
                    className={cn(
                      'rounded-md border px-2 py-1 text-xs transition-colors',
                      selectedStageId === s._id
                        ? 'border-primary bg-primary/10 font-medium'
                        : 'hover:bg-muted'
                    )}
                    onClick={() =>
                      setSelectedStageId(prev => (prev === s._id ? '' : s._id))
                    }
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!selected}
            onClick={() => {
              onConfirm(selected, selectedStageId || undefined);
              setSelected('');
              setSearch('');
              setSelectedStageId('');
            }}
          >
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
