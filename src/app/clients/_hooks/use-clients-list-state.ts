import { useSearchWithPageRestore } from '@/hooks/use-search-with-page-restore';
import { useTablePagination } from '@/hooks/use-table-pagination';
import { useClientStore } from '@/store';
import type { Client, ClientStatus } from '@/store/types';
import type { SortingState } from '@tanstack/react-table';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  VALID_SORT_OPTIONS,
  filterClients,
  sortClients,
  type JobCounts,
  type SortOption,
} from '../_utils/client-list';

function readSavedSorting(): SortingState {
  try {
    const raw = localStorage.getItem('clients-column-sorting');
    return raw ? (JSON.parse(raw) as SortingState) : [];
  } catch {
    return [];
  }
}

function readSavedSortBy(): SortOption {
  const raw = localStorage.getItem('clients-sort-by') ?? '';
  return (VALID_SORT_OPTIONS as readonly string[]).includes(raw)
    ? (raw as SortOption)
    : 'default';
}

/** Search, status filter, sort and paging for the clients list. */
export function useClientsListState(items: Client[], jobCounts: JobCounts) {
  const filters = useClientStore(s => s.filters);
  const setFilters = useClientStore(s => s.setFilters);

  // `setPageIndex` / `setPageSize` are stable (useCallback), so they are safe
  // as effect and memo dependencies.
  const { pageIndex, pageSize, setPageIndex, setPageSize } = useTablePagination({
    storageKey: 'clients',
    defaultSize: 10,
  });

  const [query, setQuery] = useState(filters.search ?? '');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>(
    filters.status ?? 'all'
  );
  const [sorting, setSorting] = useState<SortingState>(readSavedSorting);
  const [sortBy, setSortBy] = useState<SortOption>(readSavedSortBy);

  const searchDebounce = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { handleSearchChange: onSearchChange } = useSearchWithPageRestore({
    initialValue: filters.search ?? '',
    pageIndex,
    onPageChange: setPageIndex,
  });

  const changeQuery = useCallback(
    (q: string) => {
      setQuery(q);
      clearTimeout(searchDebounce.current);
      searchDebounce.current = setTimeout(() => {
        // `onSearchChange` owns the page transition: page 0 when a search
        // starts, and RESTORES the previous page when it is cleared. Forcing
        // page 0 here too overwrote that restore. Search is fully client-side.
        onSearchChange(q);
        setFilters({ search: q || undefined });
        if (q) setPageIndex(0);
      }, 300);
    },
    [onSearchChange, setFilters, setPageIndex]
  );

  const changeStatusFilter = useCallback(
    (v: ClientStatus | 'all') => {
      setStatusFilter(v);
      setFilters({ status: v === 'all' ? undefined : v });
      setPageIndex(0);
    },
    [setFilters, setPageIndex]
  );

  function changeSortBy(v: SortOption) {
    localStorage.setItem('clients-sort-by', v);
    setSortBy(v);
  }

  function changeSorting(
    updater: SortingState | ((prev: SortingState) => SortingState)
  ) {
    const next = typeof updater === 'function' ? updater(sorting) : updater;
    localStorage.setItem('clients-column-sorting', JSON.stringify(next));
    setSorting(next);
  }

  const filtered = useMemo(
    () =>
      filterClients(sortClients(items, jobCounts, sortBy), statusFilter, query),
    [items, jobCounts, sortBy, statusFilter, query]
  );

  const paged = useMemo(() => {
    const start = pageIndex * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageIndex, pageSize]);

  return {
    query,
    changeQuery,
    statusFilter,
    changeStatusFilter,
    sortBy,
    changeSortBy,
    sorting,
    changeSorting,
    filtered,
    paged,
    pageIndex,
    pageSize,
    setPageIndex,
    setPageSize,
  };
}
