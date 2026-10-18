import { ConfirmDialog } from '@/components/confirm-dialog';
import { TablePagination } from '@/components/table-pagination';
import { useEmailStore } from '@/store';
import type { Email } from '@/store/types';
import { useState } from 'react';
import { toast } from 'sonner';
import { useEmailListQuery } from '../_hooks/use-email-list-query';
import { useEmailSelection } from '../_hooks/use-email-selection';
import type { ComposeMode } from '../_utils/compose-mode';
import { ComposeEmailSheet } from './compose-email-sheet';
import { EmailDetailSheet } from './email-detail-sheet';
import { EmailBulkBar } from './emails-list/email-bulk-bar';
import { EmailItem } from './emails-list/email-item';
import { EmailSkeleton } from './emails-list/email-skeleton';
import { EmailsEmptyState } from './emails-list/emails-empty-state';
import { EmailsToolbar } from './emails-list/emails-toolbar';

export function EmailsList() {
  const data = useEmailStore(s => s.items);
  const loading = useEmailStore(s => s.loading);
  const isRefreshing = useEmailStore(s => s.isRefreshing);
  const totalRows = useEmailStore(s => s.pagination?.total ?? 0);
  const mutating = useEmailStore(s => s.mutating);
  const remove = useEmailStore(s => s.remove);
  const resend = useEmailStore(s => s.resend);
  const markAsRead = useEmailStore(s => s.markAsRead);

  const q = useEmailListQuery();
  const selection = useEmailSelection(data);

  const [selected, setSelected] = useState<Email | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<ComposeMode>({ type: 'new' });
  const [deleteTarget, setDeleteTarget] = useState<Email | null>(null);

  async function handleDeleteSingle() {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget._id);
      q.stepBackIfPageGone(Math.max(0, totalRows - 1));
      selection.remove(deleteTarget._id);
      toast.success('Email deleted');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDeleteTarget(null);
    }
  }

  async function handleDeleteSelected() {
    const ids = [...selection.selectedIds];
    try {
      await Promise.all(ids.map(id => remove(id)));
      q.stepBackIfPageGone(Math.max(0, totalRows - ids.length));
      selection.clear();
      toast.success(`${ids.length} email${ids.length > 1 ? 's' : ''} deleted`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      selection.setConfirmingBulkDelete(false);
    }
  }

  function openDetail(email: Email) {
    setSelected(email);
    setDetailOpen(true);
    if (!email.isRead) markAsRead(email._id);
  }

  function openCompose(mode: ComposeMode) {
    setDetailOpen(false);
    setComposeMode(mode);
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

  function resetFilters() {
    q.setQueryImmediately('');
    q.changeStatusFilter('all');
    q.changeTab('all');
  }

  const hasActiveFilters =
    q.query.trim() !== '' || q.statusFilter !== 'all' || q.tab !== 'all';

  const pagination = (
    <div className="border-t shrink-0 bg-background">
      <TablePagination
        pageIndex={q.pageIndex}
        pageSize={q.pageSize}
        totalRows={totalRows}
        label="emails"
        onPageChange={q.goToPage}
        onPageSizeChange={q.changePageSize}
      />
    </div>
  );

  return (
    <>
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        <EmailsToolbar
          tab={q.tab}
          onTabChange={q.changeTab}
          tabCounts={q.tabCounts}
          search={q.inputValue}
          onSearchChange={q.changeQuery}
          statusFilter={q.statusFilter}
          onStatusFilterChange={q.changeStatusFilter}
          onCompose={() => {
            setComposeMode({ type: 'new' });
            setComposeOpen(true);
          }}
        />

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

        {selection.selectedCount > 0 && (
          <EmailBulkBar
            selectedCount={selection.selectedCount}
            allSelected={selection.allSelected}
            confirming={selection.confirmingBulkDelete}
            onToggleAll={selection.toggleAll}
            onAskDelete={() => selection.setConfirmingBulkDelete(true)}
            onCancelDelete={() => selection.setConfirmingBulkDelete(false)}
            onConfirmDelete={handleDeleteSelected}
            onClear={selection.clear}
          />
        )}

        <div className="rounded-lg border flex flex-col flex-1 min-h-0 overflow-hidden">
          {loading && data.length === 0 ? (
            <div className="overflow-y-auto flex-1 divide-y divide-border">
              {Array.from({ length: Math.min(q.pageSize, 5) }).map((_, i) => (
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
                    selected={selection.selectedIds.has(email._id)}
                    onToggle={() => selection.toggle(email._id)}
                    onClick={() => openDetail(email)}
                    onDelete={() => setDeleteTarget(email)}
                  />
                ))}
              </div>
              {pagination}
            </>
          ) : (
            <>
              <EmailsEmptyState
                hasActiveFilters={hasActiveFilters}
                onResetFilters={resetFilters}
              />
              {/* Stays mounted on an empty page so the user can page back. */}
              {totalRows > 0 && pagination}
            </>
          )}
        </div>
      </div>

      <EmailDetailSheet
        email={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onReply={email => openCompose({ type: 'reply', email })}
        onForward={email => openCompose({ type: 'forward', email })}
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
