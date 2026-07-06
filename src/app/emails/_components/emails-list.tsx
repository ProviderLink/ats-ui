import { ConfirmDialog } from '@/components/confirm-dialog';
import { TablePagination } from '@/components/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getJson } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { useEmailStore } from '@/store';
import type { Email, EmailDirection, EmailStatus } from '@/store/types';
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  BriefcaseIcon,
  CheckIcon,
  PenSquareIcon,
  SearchIcon,
  Trash2Icon,
  UserIcon,
  XIcon,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ComposeEmailSheet } from './compose-email-sheet';
import { EmailDetailSheet } from './email-detail-sheet';

type TabValue = 'all' | 'inbox' | 'sent' | 'failed';

function TabCountChip({ n }: { n: number }) {
  return (
    <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-muted-foreground/15 px-1 text-[10px] font-medium text-muted-foreground">
      {n}
    </span>
  );
}

const statusConfig: Record<EmailStatus, { label: string; cls: string }> = {
  delivered: {
    label: 'Delivered',
    cls: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/60 dark:text-emerald-400',
  },
  received: {
    label: 'Received',
    cls: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/60 dark:bg-blue-950/60 dark:text-blue-400',
  },
  sent: {
    label: 'Sent',
    cls: 'border-border bg-muted text-muted-foreground',
  },
  pending: {
    label: 'Pending',
    cls: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/60 dark:text-amber-400',
  },
  failed: {
    label: 'Failed',
    cls: 'border-destructive/30 bg-destructive/10 text-destructive',
  },
  delayed: {
    label: 'Delayed',
    cls: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800/60 dark:bg-orange-950/60 dark:text-orange-400',
  },
  bounced: {
    label: 'Bounced',
    cls: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800/60 dark:bg-red-950/60 dark:text-red-400',
  },
  complained: {
    label: 'Complained',
    cls: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800/60 dark:bg-red-950/60 dark:text-red-400',
  },
};

function StatusPill({ status }: { status: EmailStatus }) {
  const { label, cls } = statusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center rounded-full border px-2 text-[10px] font-medium shrink-0',
        cls
      )}
    >
      {label}
    </span>
  );
}

function DirectionIcon({ direction }: { direction: EmailDirection }) {
  const isOut = direction === 'outbound';
  return (
    <div
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-md',
        isOut ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-500'
      )}
    >
      {isOut ? (
        <ArrowUpRightIcon className="size-3.5" />
      ) : (
        <ArrowDownLeftIcon className="size-3.5" />
      )}
    </div>
  );
}

function SenderAvatar({ address }: { address: string }) {
  const initials = address
    .split('@')[0]
    .split(/[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase() ?? '')
    .join('');

  const colors = [
    'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
    'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400',
    'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
    'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-400',
    'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
  ];
  const color = colors[address.charCodeAt(0) % colors.length];

  return (
    <div
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold select-none',
        color
      )}
    >
      {initials || '?'}
    </div>
  );
}

function ContextChip({ email }: { email: Email }) {
  const { context } = email;
  if (!context) return null;

  if (context.candidateId) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground shrink-0">
        <UserIcon className="size-2.5" />
        Candidate
      </span>
    );
  }

  if (context.jobId) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground shrink-0">
        <BriefcaseIcon className="size-2.5" />
        Job
      </span>
    );
  }

  return null;
}

function formatShortDate(value: string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const datePart = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(d);
  const timePart = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (isToday) return timePart;
  const isThisYear = d.getFullYear() === now.getFullYear();
  if (isThisYear) return `${datePart} · ${timePart}`;
  return `${datePart}, ${d.getFullYear()} · ${timePart}`;
}

function EmailItem({
  email,
  selected,
  onToggle,
  onClick,
  onDelete,
}: {
  email: Email;
  selected: boolean;
  onToggle: () => void;
  onClick: () => void;
  onDelete: () => void;
}) {
  const isOut = email.direction === 'outbound';
  const isUnread = !isOut && !email.isRead;
  const contactAddress = isOut ? email.to[0] : email.from;
  const date = email.sentAt ?? email.receivedAt ?? email.createdAt;
  const shortDate = formatShortDate(date);
  const snippet = (email.bodyText ?? '').replace(/\n+/g, ' ').slice(0, 100);

  return (
    <div className="flex w-full items-start gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-muted/60 active:bg-muted">
      <Checkbox
        checked={selected}
        onCheckedChange={() => onToggle()}
        aria-label={`Select ${email.subject}`}
        className="mt-1 shrink-0"
      />
      <button
        type="button"
        onClick={onClick}
        className="flex flex-1 items-start gap-3 text-left min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      >
        <DirectionIcon direction={email.direction} />
        <SenderAvatar address={contactAddress} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                'text-sm leading-tight truncate',
                isUnread ? 'font-semibold' : 'font-medium'
              )}
            >
              {isUnread && (
                <span className="inline-block size-2 rounded-full bg-blue-500 mr-1.5 align-middle shrink-0" />
              )}
              {email.subject}
            </p>
            <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
              {shortDate}
            </span>
          </div>

          <p className="mt-0.5 text-xs text-muted-foreground truncate">
            {isOut ? `To: ${contactAddress}` : `From: ${contactAddress}`}
          </p>

          <p className="mt-0.5 text-xs text-muted-foreground/70 truncate">
            {snippet}
          </p>

          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <StatusPill status={email.status} />
            <ContextChip email={email} />
            <button
              type="button"
              className="ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              onClick={e => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2Icon className="size-3" />
              Delete
            </button>
          </div>
        </div>
      </button>
    </div>
  );
}

function EmailSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <Skeleton className="size-4 rounded-sm mt-1 shrink-0" />
      <Skeleton className="size-7 rounded-md shrink-0" />
      <Skeleton className="size-8 rounded-md shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between gap-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-5 w-16 rounded-full mt-1" />
      </div>
    </div>
  );
}

export function EmailsList() {
  const {
    items,
    loading,
    isRefreshing,
    pagination: storePagination,
    mutating,
    remove,
    resend,
    markAsRead,
  } = useEmailStore();
  const fetchEmails = useEmailStore(s => s.fetch);

  const [tab, setTab] = useState<TabValue>('all');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmailStatus | 'all'>('all');
  const [selected, setSelected] = useState<Email | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<
    | { type: 'new' }
    | { type: 'reply'; email: Email }
    | { type: 'forward'; email: Email }
  >({ type: 'new' });

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Email | null>(null);

  const VALID_SIZES = [10, 15, 20, 30, 50];
  const [pageIndex, setPageIndex] = useState(() => {
    const raw = parseInt(sessionStorage.getItem('emails-page-index') ?? '', 10);
    return Number.isFinite(raw) && raw >= 0 ? raw : 0;
  });
  const [pageSize, setPageSize] = useState(() => {
    const raw = parseInt(localStorage.getItem('emails-page-size') ?? '', 10);
    return VALID_SIZES.includes(raw) ? raw : 20;
  });

  const totalRows = storePagination?.total ?? 0;
  const data = items;

  // ── Server-side fetch on tab / filter / page change ─────────────
  useEffect(() => {
    const direction =
      tab === 'inbox' ? 'inbound' : tab === 'sent' ? 'outbound' : undefined;
    const status =
      tab === 'failed'
        ? 'failed'
        : statusFilter !== 'all'
          ? statusFilter
          : undefined;
    fetchEmails({
      direction,
      status,
      search: query.trim() || undefined,
      page: pageIndex + 1,
      limit: pageSize,
    });
  }, [tab, statusFilter, query, pageIndex, pageSize, fetchEmails]);

  // Lightweight per-tab counts — fetched on mount and after mutations
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    inbox: 0,
    sent: 0,
    failed: 0,
  });
  const prevMutating = useRef(mutating);

  const refreshCounts = useCallback(async () => {
    const counts = { all: 0, inbox: 0, sent: 0, failed: 0 };
    const results = await Promise.allSettled([
      getJson<{ total: number }>('/ats/emails', { limit: 1 } as Record<
        string,
        unknown
      >),
      getJson<{ total: number }>('/ats/emails', {
        direction: 'inbound',
        limit: 1,
      } as Record<string, unknown>),
      getJson<{ total: number }>('/ats/emails', {
        direction: 'outbound',
        limit: 1,
      } as Record<string, unknown>),
      getJson<{ total: number }>('/ats/emails', {
        status: 'failed',
        limit: 1,
      } as Record<string, unknown>),
    ]);
    if (results[0].status === 'fulfilled') counts.all = results[0].value.total;
    if (results[1].status === 'fulfilled')
      counts.inbox = results[1].value.total;
    if (results[2].status === 'fulfilled') counts.sent = results[2].value.total;
    if (results[3].status === 'fulfilled')
      counts.failed = results[3].value.total;
    setTabCounts(counts);
  }, []);

  useEffect(() => {
    void refreshCounts();
  }, [refreshCounts]);

  useEffect(() => {
    if (prevMutating.current && !mutating) {
      void refreshCounts();
    }
    prevMutating.current = mutating;
  }, [mutating, refreshCounts]);

  function handleTabChange(v: TabValue) {
    setTab(v);
    setPageIndex(0);
    sessionStorage.setItem('emails-page-index', '0');
  }

  function handleStatusFilter(v: EmailStatus | 'all') {
    setStatusFilter(v);
    setPageIndex(0);
    sessionStorage.setItem('emails-page-index', '0');
  }

  function handleQuery(v: string) {
    setQuery(v);
    setPageIndex(0);
    sessionStorage.setItem('emails-page-index', '0');
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
    const safeSize = VALID_SIZES.includes(next.pageSize) ? next.pageSize : 20;
    setPageIndex(safeIndex);
    setPageSize(safeSize);
    sessionStorage.setItem('emails-page-index', String(safeIndex));
    localStorage.setItem('emails-page-size', String(safeSize));
  }

  // ── Selection helpers ────────────────────────────────────────────

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setConfirmBulkDelete(false);
  }

  function toggleSelectAll() {
    setSelectedIds(prev => {
      if (prev.size === data.length) return new Set();
      return new Set(data.map(e => e._id));
    });
    setConfirmBulkDelete(false);
  }

  function clearSelection() {
    setSelectedIds(new Set());
    setConfirmBulkDelete(false);
  }

  const selectedCount = selectedIds.size;
  const allSelected = data.length > 0 && selectedCount === data.length;

  // --- Delete handlers ---

  async function handleDeleteSingle() {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget._id);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(deleteTarget!._id);
        return next;
      });
      toast.success('Email deleted');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDeleteTarget(null);
    }
  }

  async function handleDeleteSelected() {
    const ids = [...selectedIds];
    try {
      await Promise.all(ids.map(id => remove(id)));
      setSelectedIds(new Set());
      toast.success(`${ids.length} email${ids.length > 1 ? 's' : ''} deleted`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setConfirmBulkDelete(false);
    }
  }

  function openDetail(email: Email) {
    setSelected(email);
    setDetailOpen(true);
    if (!email.isRead) markAsRead(email._id);
  }

  function openReply(email: Email) {
    setDetailOpen(false);
    setComposeMode({ type: 'reply', email });
    setComposeOpen(true);
  }

  function openForward(email: Email) {
    setDetailOpen(false);
    setComposeMode({ type: 'forward', email });
    setComposeOpen(true);
  }

  function openCompose() {
    setComposeMode({ type: 'new' });
    setComposeOpen(true);
  }

  async function handleResend(id: string) {
    try {
      await resend(id);
      toast.success('Email resent successfully.');
    } catch {
      toast.error('Failed to resend email.');
    }
  }

  const hasActiveFilters =
    query.trim() !== '' || statusFilter !== 'all' || tab !== 'all';

  return (
    <>
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        {/* Toolbar — tabs (left) + search/status/compose (right) */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between flex-wrap shrink-0">
          <Tabs
            value={tab}
            onValueChange={v => handleTabChange(v as TabValue)}
            className="flex-row"
          >
            <TabsList>
              <TabsTrigger value="all">
                All <TabCountChip n={tabCounts.all} />
              </TabsTrigger>
              <TabsTrigger value="inbox">
                Inbox <TabCountChip n={tabCounts.inbox} />
              </TabsTrigger>
              <TabsTrigger value="sent">
                Sent <TabCountChip n={tabCounts.sent} />
              </TabsTrigger>
              <TabsTrigger value="failed">
                Failed <TabCountChip n={tabCounts.failed} />
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative min-w-44 max-w-xs flex-1 sm:flex-none">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search subject, sender, recipient..."
                value={query}
                onChange={e => handleQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={v => handleStatusFilter(v as EmailStatus | 'all')}
            >
              <SelectTrigger className="w-36 h-9 gap-2">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Button size="sm" className="gap-2" onClick={openCompose}>
              <PenSquareIcon className="size-4" />
              Compose
            </Button>
          </div>
        </div>

        {/* Counts */}
        <p className="flex items-center gap-2 text-xs text-muted-foreground -mt-1 shrink-0">
          <span className="font-medium text-foreground/80">{totalRows}</span>{' '}
          {totalRows === 1 ? 'email' : 'emails'}
          {hasActiveFilters ? ' found' : ' total'}
          {isRefreshing && (
            <span className="inline-flex items-center gap-1 text-muted-foreground/70">
              <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/60" />
              syncing…
            </span>
          )}
        </p>

        {/* Bulk selection bar — sits just above the list, only when selecting */}
        {selectedCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs shrink-0">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleSelectAll}
                aria-label="Select all visible"
                className="size-4"
              />
              <Badge variant="secondary" className="text-xs">
                {selectedCount} selected
              </Badge>
            </div>

            {confirmBulkDelete ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">
                  Delete {selectedCount} email{selectedCount > 1 ? 's' : ''}?
                </span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDeleteSelected}
                >
                  <CheckIcon className="size-4" /> Yes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmBulkDelete(false)}
                >
                  <XIcon className="size-4" /> No
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setConfirmBulkDelete(true)}
              >
                <Trash2Icon className="size-4" />
                Delete selected
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              className="ml-auto text-muted-foreground"
              onClick={clearSelection}
            >
              <XIcon className="size-4" />
              Clear
            </Button>
          </div>
        )}

        {/* Email list */}
        <div className="rounded-lg border flex flex-col flex-1 min-h-0 overflow-hidden">
          {loading && data.length === 0 ? (
            <div className="overflow-y-auto flex-1 divide-y divide-border">
              {Array.from({
                length: pageSize > 5 ? 5 : pageSize,
              }).map((_, i) => (
                <EmailSkeleton key={i} />
              ))}
            </div>
          ) : data.length > 0 ? (
            <>
              <div className="overflow-y-auto flex-1 divide-y divide-border">
                {data.map(email => (
                  <EmailItem
                    key={email._id}
                    email={email}
                    selected={selectedIds.has(email._id)}
                    onToggle={() => toggleSelect(email._id)}
                    onClick={() => openDetail(email)}
                    onDelete={() => setDeleteTarget(email)}
                  />
                ))}
              </div>

              {/* Pagination bar */}
              <div className="border-t shrink-0 bg-background">
                <TablePagination
                  pageIndex={pageIndex}
                  pageSize={pageSize}
                  totalRows={totalRows}
                  label="emails"
                  onPageChange={idx =>
                    handlePaginationChange({
                      pageIndex: idx,
                      pageSize,
                    })
                  }
                  onPageSizeChange={size =>
                    handlePaginationChange({ pageIndex: 0, pageSize: size })
                  }
                />
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="flex flex-col items-center gap-2 py-16 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <SearchIcon className="size-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">No emails found</p>
                <p className="text-xs text-muted-foreground">
                  {hasActiveFilters
                    ? 'Try adjusting your filters or search query.'
                    : 'No emails have been sent or received yet.'}
                </p>
                {hasActiveFilters && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => {
                      handleQuery('');
                      handleStatusFilter('all');
                      handleTabChange('all');
                    }}
                  >
                    Reset filters
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <EmailDetailSheet
        email={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onReply={openReply}
        onForward={openForward}
        onResend={handleResend}
      />

      <ComposeEmailSheet
        open={composeOpen}
        onOpenChange={setComposeOpen}
        mode={composeMode}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete email?"
        description={
          <>
            <strong>{deleteTarget?.subject}</strong> will be permanently
            removed. This action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        variant="destructive"
        loading={mutating}
        onConfirm={handleDeleteSingle}
      />
    </>
  );
}
