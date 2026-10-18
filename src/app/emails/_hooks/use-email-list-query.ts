import { getJson } from '@/lib/api-client';
import { useEmailStore } from '@/store';
import type { EmailStatus } from '@/store/types';
import { useCallback, useEffect, useRef, useState } from 'react';

export type EmailTab = 'all' | 'inbox' | 'sent' | 'failed';

const VALID_SIZES = [10, 15, 20, 30, 50];
const DEFAULT_SIZE = 20;

type TabCounts = Record<EmailTab, number>;

async function fetchTabCounts(): Promise<TabCounts> {
  const total = (params: Record<string, unknown>) =>
    getJson<{ total: number }>('/ats/emails', { ...params, limit: 1 });
  const [all, inbox, sent, failed] = await Promise.allSettled([
    total({}),
    total({ direction: 'inbound' }),
    total({ direction: 'outbound' }),
    total({ status: 'failed' }),
  ]);
  const count = (r: PromiseSettledResult<{ total: number }>) =>
    r.status === 'fulfilled' ? r.value.total : 0;
  return {
    all: count(all),
    inbox: count(inbox),
    sent: count(sent),
    failed: count(failed),
  };
}

/** Tab, search, status filter and paging for the emails list, plus the fetch. */
export function useEmailListQuery() {
  const mutating = useEmailStore(s => s.mutating);
  const fetchEmails = useEmailStore(s => s.fetch);

  const [tab, setTab] = useState<EmailTab>('all');
  const [query, setQuery] = useState('');
  // What the box shows; `query` (debounced) drives the server fetch.
  const [inputValue, setInputValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmailStatus | 'all'>('all');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [pageIndex, setPageIndex] = useState(() => {
    const raw = parseInt(sessionStorage.getItem('emails-page-index') ?? '', 10);
    return Number.isFinite(raw) && raw >= 0 ? raw : 0;
  });
  const [pageSize, setPageSize] = useState(() => {
    const raw = parseInt(localStorage.getItem('emails-page-size') ?? '', 10);
    return VALID_SIZES.includes(raw) ? raw : DEFAULT_SIZE;
  });

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

  const [tabCounts, setTabCounts] = useState<TabCounts>({
    all: 0,
    inbox: 0,
    sent: 0,
    failed: 0,
  });
  const prevMutating = useRef(mutating);

  const refreshCounts = useCallback(async () => {
    setTabCounts(await fetchTabCounts());
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

  function goToPage(index: number) {
    setPageIndex(index);
    sessionStorage.setItem('emails-page-index', String(index));
  }

  function changeTab(next: EmailTab) {
    setTab(next);
    goToPage(0);
  }

  function changeStatusFilter(next: EmailStatus | 'all') {
    setStatusFilter(next);
    goToPage(0);
  }

  function applyQuery(value: string) {
    setQuery(value);
    goToPage(0);
  }

  /** Keystrokes are debounced: email search is server-side. */
  function changeQuery(value: string) {
    setInputValue(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => applyQuery(value), 300);
  }

  function setQueryImmediately(value: string) {
    setInputValue(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    applyQuery(value);
  }

  function changePageSize(size: number) {
    const safeSize = VALID_SIZES.includes(size) ? size : DEFAULT_SIZE;
    setPageSize(safeSize);
    goToPage(0);
    localStorage.setItem('emails-page-size', String(safeSize));
  }

  /**
   * After a delete, step back to the last real page if the current one no
   * longer exists. Done here (not in an effect) because deleting the only row
   * of the last page changes none of the fetch inputs, so nothing would
   * refetch and the user would be stranded on an empty page.
   */
  function stepBackIfPageGone(remainingTotal: number) {
    if (pageIndex === 0) return;
    const lastPage = Math.max(0, Math.ceil(remainingTotal / pageSize) - 1);
    if (pageIndex > lastPage) goToPage(lastPage);
  }

  return {
    tab,
    query,
    inputValue,
    statusFilter,
    pageIndex,
    pageSize,
    tabCounts,
    changeTab,
    changeStatusFilter,
    changeQuery,
    setQueryImmediately,
    goToPage,
    changePageSize,
    stepBackIfPageGone,
  };
}
