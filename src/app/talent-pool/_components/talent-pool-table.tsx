import {
  CandidateCell,
  ColHeader,
  DeleteConfirmDialog,
  SortHeader,
  TableSkeleton,
} from '@/app/candidates/_components/candidates-table';
import { ComposeEmailSheet } from '@/app/emails/_components/compose-email-sheet';
import { TablePagination } from '@/components/table-pagination';
import { TagList } from '@/components/tag-list';
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
import { cn } from '@/lib/utils';
import { useApplicationStore } from '@/store/slices/applications.store';
import { useCandidateStore } from '@/store/slices/candidates.store';
import { useClientStore } from '@/store/slices/clients.store';
import { useJobStore } from '@/store/slices/jobs.store';
import { useTagStore } from '@/store/slices/tags.store';
import type { Candidate, Tag } from '@/store/types';
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
  MousePointerClickIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { TalentPoolDetailSheet } from './talent-pool-detail-sheet';

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
          {/* Search */}
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <SearchIcon className="size-3.5 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Filter tags…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
            {search && (
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setSearch('')}
              >
                <XIcon className="size-3.5" />
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-52 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground px-2 py-3 text-center">
                {allTags.length === 0
                  ? 'No tags available'
                  : 'No matching tags'}
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

          {/* Footer */}
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

function CurrentRoleCell({ candidate }: { candidate: Candidate }) {
  const exp = candidate.parsedData?.experience?.[0];
  const role = exp?.title?.trim();
  const company = exp?.company?.trim();
  const duration = exp?.duration?.trim();

  if (!role) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex flex-col min-w-0 max-w-48">
      <span className="text-sm text-foreground leading-tight line-clamp-2 whitespace-normal wrap-break-word">
        {role}
      </span>
      {company && (
        <span className="text-xs text-muted-foreground leading-tight whitespace-normal wrap-break-word mt-0.5">
          {company}
        </span>
      )}
      {duration && (
        <span className="text-xs text-muted-foreground leading-tight whitespace-normal wrap-break-word mt-0.5 tp-duration">
          {duration}
        </span>
      )}
    </div>
  );
}

function SkillsCell({ candidate }: { candidate: Candidate }) {
  const skills = candidate.parsedData?.skills ?? [];
  if (skills.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const MAX = 3;
  const visible = skills.slice(0, MAX);
  const overflow = skills.length - MAX;
  return (
    <div className="flex items-center gap-1 flex-wrap min-w-0 max-w-48">
      {visible.map(skill => (
        <span
          key={skill}
          className="inline-flex items-center h-5 rounded-md border px-1.5 text-xs leading-none text-muted-foreground bg-muted/40 max-w-full"
        >
          <span className="truncate">{skill}</span>
        </span>
      ))}
      {overflow > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1 h-5 shrink-0 rounded-md border px-1.5 text-xs leading-none text-muted-foreground bg-muted/40 cursor-default border-dashed">
              +{overflow} more
              <MousePointerClickIcon className="size-3 text-warning" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="right" align="start" className="p-2.5 max-w-72">
            <div className="flex flex-wrap gap-1">
              {skills.map(s => (
                <span
                  key={s}
                  className="inline-flex items-center min-h-5 rounded-md border border-current/25 px-1.5 text-xs leading-snug text-current/85 whitespace-normal wrap-break-word"
                >
                  {s}
                </span>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

function TalentPoolNotesCell({ candidate }: { candidate: Candidate }) {
  const notes = candidate.talentPoolNotes?.trim();
  if (!notes) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className="text-xs text-muted-foreground line-clamp-3 whitespace-normal block">
      {notes}
    </span>
  );
}

function AssignJobDialog({
  open,
  onClose,
  onConfirm,
  jobs,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (jobId: string) => void;
  jobs: { _id: string; title: string; clientName?: string }[];
}) {
  const [selected, setSelected] = useState('');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return jobs;
    const q = search.toLowerCase();
    return jobs.filter(
      j =>
        j.title.toLowerCase().includes(q) ||
        (j.clientName ?? '').toLowerCase().includes(q)
    );
  }, [jobs, search]);

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign to a new job</DialogTitle>
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
          <div className="max-h-56 overflow-y-auto rounded-md border">
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
                      'flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors',
                      selected === j._id && 'bg-muted font-medium'
                    )}
                    onClick={() => setSelected(j._id)}
                  >
                    <span
                      className={cn(
                        'size-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5',
                        selected === j._id
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30'
                      )}
                    >
                      {selected === j._id && <CheckIcon className="size-3" />}
                    </span>
                    <span className="flex flex-col min-w-0">
                      <span className="truncate">{j.title}</span>
                      {j.clientName && (
                        <span className="text-[11px] text-muted-foreground truncate">
                          {j.clientName}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!selected}
            onClick={() => {
              onConfirm(selected);
              setSelected('');
              setSearch('');
            }}
          >
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RemoveTalentPoolConfirmDialog({
  candidate,
  open,
  onClose,
  onConfirm,
}: {
  candidate: Candidate | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!candidate) return null;
  const name = `${candidate.firstName} ${candidate.lastName}`;
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove from Talent Pool</DialogTitle>
          <DialogDescription className="flex flex-col gap-3 pt-2">
            <p>
              You are about to remove{' '}
              <span className="font-medium text-foreground">{name}</span> from
              the talent pool.
            </p>
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive">
              <strong>Warning:</strong> If this candidate has no active job
              assignments, they will be permanently deleted from the ATS
              platform, and all associated data will be erased. This action
              <em> cannot</em> be undone.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Remove from pool
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TalentPoolTable() {
  // ── Store subscriptions ──────────────────────────────────────────
  const items = useCandidateStore(s => s.items);
  const loading = useCandidateStore(s => s.loading);
  const mutating = useCandidateStore(s => s.mutating);
  const remove = useCandidateStore(s => s.remove);
  const updateTalentPool = useCandidateStore(s => s.updateTalentPool);
  const assignJob = useCandidateStore(s => s.assignJob);

  const allTags = useTagStore(s => s.items);
  const fetchTags = useTagStore(s => s.fetch);

  const jobs = useJobStore(s => s.items);
  const fetchJobs = useJobStore(s => s.fetch);

  const clients = useClientStore(s => s.items);
  const fetchClients = useClientStore(s => s.fetch);

  const fetchApps = useApplicationStore(s => s.fetch);

  // Subscribe to real-time updates for candidates and applications
  useSocketRoom('candidates');
  useSocketRoom('applications');

  const [query, setQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [assignJobOpen, setAssignJobOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Candidate | null>(null);
  const [removePoolTarget, setRemovePoolTarget] = useState<Candidate | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<Candidate | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTarget, setComposeTarget] = useState<Candidate | null>(null);

  const VALID_PAGE_SIZES = [10, 15, 20, 30, 50];
  const [pageIndex, setPageIndex] = useState(() => {
    const raw = parseInt(
      sessionStorage.getItem('talent-pool-page-index') ?? '',
      10
    );
    return Number.isFinite(raw) && raw >= 0 ? raw : 0;
  });
  const [pageSize, setPageSize] = useState(() => {
    const raw = parseInt(
      localStorage.getItem('talent-pool-page-size') ?? '',
      10
    );
    return VALID_PAGE_SIZES.includes(raw) ? raw : 20;
  });

  // Fetch tags & jobs once on mount (no-op after boot — data already loaded)
  useEffect(() => {
    if (allTags.length === 0) fetchTags();
  }, [allTags.length, fetchTags]);

  useEffect(() => {
    if (jobs.length === 0) fetchJobs({ page: 1, limit: 9999 });
  }, [jobs.length, fetchJobs]);

  // Fetch clients once on mount for resolving client names in assign dialog
  useEffect(() => {
    if (clients.length === 0) fetchClients({ page: 1, limit: 9999 });
  }, [clients.length, fetchClients]);

  // Debounced search ref
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(null);

  // After boot, ALL candidates are in the store. We filter by talentPool,
  // tags, and search query client-side — no server round-trip needed.
  // The server-side fetch useEffect has been replaced by local filtering.

  const openJobs = useMemo(() => {
    const clientMap = new Map(clients.map(c => [c._id, c.companyName]));
    return jobs
      .filter(j => j.status === 'open')
      .map(j => ({
        _id: j._id,
        title: j.title,
        clientName: clientMap.get(j.clientId) ?? '',
      }));
  }, [jobs, clients]);

  // ── Client-side filtering ────────────────────────────────────────
  // After boot, ALL candidates are in the store. We filter locally.
  const data = useMemo(() => {
    let result = items.filter(c => c.inTalentPool === true);

    // Search filter
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(c => {
        const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
        if (fullName.includes(q)) return true;
        if (c.email?.toLowerCase().includes(q)) return true;
        if (c.phone?.toLowerCase().includes(q)) return true;
        const skills = (c.parsedData?.skills ?? []).join(' ').toLowerCase();
        if (skills.includes(q)) return true;
        const exp = c.parsedData?.experience?.[0];
        if (exp?.title?.toLowerCase().includes(q)) return true;
        if (exp?.company?.toLowerCase().includes(q)) return true;
        return false;
      });
    }

    // Tag filter
    if (tagFilter.length > 0) {
      result = result.filter(c =>
        c.tags?.some(t => {
          const tagId = typeof t === 'string' ? t : (t as any)?._id;
          return tagId && tagFilter.includes(tagId);
        })
      );
    }

    return result;
  }, [items, query, tagFilter]);

  const totalRows = data.length;

  function persistPagination(pIndex: number, pSize: number) {
    sessionStorage.setItem('talent-pool-page-index', String(pIndex));
    localStorage.setItem('talent-pool-page-size', String(pSize));
  }

  function handleSearchChange(q: string) {
    // Update input immediately for responsive typing
    setInputValue(q);
    // Debounce the actual search query to avoid re-filtering on every keystroke
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setPageIndex(0);
    sessionStorage.setItem('talent-pool-page-index', '0');
    searchTimer.current = setTimeout(() => {
      setQuery(q);
    }, 300);
  }

  function handleClearSearch() {
    setInputValue('');
    setQuery('');
    if (searchTimer.current) clearTimeout(searchTimer.current);
  }

  function handleTagsChange(tags: string[]) {
    setTagFilter(tags);
    setPageIndex(0);
    sessionStorage.setItem('talent-pool-page-index', '0');
  }

  function handlePaginationChange(
    updater:
      | { pageIndex: number; pageSize: number }
      | ((prev: { pageIndex: number; pageSize: number }) => {
          pageIndex: number;
          pageSize: number;
        })
  ) {
    const next =
      typeof updater === 'function'
        ? updater({ pageIndex, pageSize })
        : updater;
    const safeIndex =
      Number.isFinite(next.pageIndex) && next.pageIndex >= 0
        ? next.pageIndex
        : 0;
    const safeSize = VALID_PAGE_SIZES.includes(next.pageSize)
      ? next.pageSize
      : 20;
    setPageIndex(safeIndex);
    setPageSize(safeSize);
    persistPagination(safeIndex, safeSize);
  }

  async function handleRemoveFromPool() {
    if (!removePoolTarget) return;
    try {
      await updateTalentPool(removePoolTarget._id, 'remove');
      toast.success(
        `${removePoolTarget.firstName} ${removePoolTarget.lastName} removed from talent pool`
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRemovePoolTarget(null);
    }
  }

  async function handleDelete(candidate: Candidate) {
    try {
      await remove(candidate._id);
      toast.success(`${candidate.firstName} ${candidate.lastName} deleted`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function openDetail(candidate: Candidate) {
    setSelected(candidate);
    setDetailOpen(true);
  }

  function openAssignJob(candidate: Candidate) {
    setAssignTarget(candidate);
    setAssignJobOpen(true);
  }

  function openCompose(candidate: Candidate) {
    setComposeTarget(candidate);
    setComposeOpen(true);
  }

  function buildComposeMode() {
    if (!composeTarget) return { type: 'new' as const };
    const name = `${composeTarget.firstName} ${composeTarget.lastName}`;
    return {
      type: 'prefill' as const,
      to: composeTarget.email,
      subject: '',
      body: '',
      templateType: 'general',
      context: { type: 'general', candidateId: composeTarget._id },
      variables: {
        candidateName: name,
        candidateEmail: composeTarget.email,
        candidatePhone: composeTarget.phone ?? '',
        jobTitle: '',
        clientName: '',
        currentStage: '',
        companyName: '',
        senderName: '',
      },
    };
  }

  async function handleAssignToJob(jobId: string) {
    if (!assignTarget) return;
    try {
      await assignJob(assignTarget._id, jobId);
      // Refresh applications so the candidate appears in the pipeline tab
      // on the candidates page immediately (socket may be missed while on
      // this page since we were not previously in the applications room).
      await fetchApps({ limit: 9999 });
      toast.success(
        `${assignTarget.firstName} ${assignTarget.lastName} assigned to job`
      );
      setAssignJobOpen(false);
      setAssignTarget(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const columns: ColumnDef<Candidate>[] = useMemo(
    () => [
      {
        id: 'candidate',
        accessorFn: row => `${row.firstName} ${row.lastName}`,
        header: ({ column }) => (
          <SortHeader column={column} label="Candidate" />
        ),
        cell: ({ row }) => <CandidateCell candidate={row.original} />,
        size: 200,
        minSize: 150,
      },
      {
        id: 'currentRole',
        accessorFn: row => row.parsedData?.experience?.[0]?.title ?? '',
        header: () => <ColHeader>Current Role</ColHeader>,
        cell: ({ row }) => <CurrentRoleCell candidate={row.original} />,
        size: 180,
        minSize: 130,
      },
      {
        id: 'skills',
        accessorFn: row => (row.parsedData?.skills ?? []).join(' '),
        header: () => <ColHeader>Skills</ColHeader>,
        cell: ({ row }) => <SkillsCell candidate={row.original} />,
        size: 160,
        minSize: 100,
      },
      {
        id: 'experience',
        accessorKey: 'yearsOfExperience',
        header: ({ column }) => <SortHeader column={column} label="Exp" />,
        cell: ({ row }) => {
          const yrs = row.original.yearsOfExperience;
          const whole = Math.floor(yrs);
          const hasFraction = yrs > 0 && yrs !== whole;
          return (
            <span className="text-sm tabular-nums">
              {whole}
              {hasFraction && (
                <sup className="text-[10px] -top-0.5">+</sup>
              )}{' '}
              <span className="text-muted-foreground">yrs</span>
            </span>
          );
        },
        size: 70,
        minSize: 60,
      },
      {
        id: 'tags',
        header: () => <ColHeader>Tags</ColHeader>,
        cell: ({ row }) => <TagList tags={row.original.tags} max={3} />,
        size: 120,
        minSize: 80,
      },
      {
        id: 'talentPoolNotes',
        header: () => <ColHeader>Notes</ColHeader>,
        cell: ({ row }) => <TalentPoolNotesCell candidate={row.original} />,
        size: 160,
        minSize: 150,
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
                      className="rounded p-2 text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/40 dark:hover:bg-destructive/10 dark:hover:border-destructive/40"
                      disabled={mutating}
                      onClick={() => setRemovePoolTarget(candidate)}
                    >
                      <XIcon className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Remove from talent pool
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon-xs"
                      className="rounded p-2 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent dark:hover:text-accent-foreground"
                      onClick={() => openAssignJob(candidate)}
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
                      className="rounded p-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 dark:hover:border-blue-700/40"
                      disabled={!candidate.email || mutating}
                      onClick={() => openCompose(candidate)}
                    >
                      <MailIcon className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {candidate.email ? 'Email candidate' : 'No email address'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          );
        },
        size: 120,
        minSize: 110,
      },
    ],
    []
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
              placeholder="Search by name, email, skills, role, or tags…"
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
            onChange={handleTagsChange}
          />
        </div>

        <p className="text-xs text-muted-foreground -mt-1 shrink-0">
          {loading && data.length === 0
            ? 'Loading…'
            : `${totalRows} ${totalRows === 1 ? 'candidate' : 'candidates'}${hasFilters ? ' found' : ' in talent pool'}`}
        </p>

        {/* Table */}
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
              <TableBody>
                {loading && data.length === 0 ? (
                  <TableSkeleton cols={columns.length} />
                ) : table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map(row => (
                    <TableRow
                      key={row.id}
                      className="border-b last:border-0 hover:bg-foreground/[0.04] dark:hover:bg-white/3 cursor-pointer"
                      onClick={() => openDetail(row.original)}
                    >
                      {row.getVisibleCells().map(cell => (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            'px-4 py-3',
                            (cell.column.id === 'talentPoolNotes' ||
                              cell.column.id === 'currentRole') &&
                              'whitespace-normal'
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
                      No candidates in the talent pool yet.
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

      <TalentPoolDetailSheet
        candidate={selected}
        open={detailOpen}
        onOpenChange={open => {
          setDetailOpen(open);
          if (!open) setSelected(null);
        }}
        mutating={mutating}
      />

      <DeleteConfirmDialog
        candidate={deleteTarget}
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget!)}
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

      <RemoveTalentPoolConfirmDialog
        candidate={removePoolTarget}
        open={!!removePoolTarget}
        onClose={() => setRemovePoolTarget(null)}
        onConfirm={handleRemoveFromPool}
      />

      <ComposeEmailSheet
        open={composeOpen}
        onOpenChange={setComposeOpen}
        mode={buildComposeMode()}
      />
    </TooltipProvider>
  );
}
