import { getJson } from '@/lib/api-client';
import { useCandidateStore } from '@/store/slices/candidates.store';
import type { Candidate, Pagination } from '@/store/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CandidateSortOption } from '../_utils/candidate-sort';
import type { CandidateTabValue } from '../_utils/candidate-tabs';

export interface CandidateTableCounts {
  pending: number;
  approved: number;
  hired: number;
}

interface TableArgs {
  tab: CandidateTabValue;
  jobId: string;
  query: string;
  sortBy: CandidateSortOption;
  pageIndex: number;
  pageSize: number;
  /** Change whenever the underlying data changed, to refetch the page. */
  itemsVersion: unknown;
  appsVersion: unknown;
}

type TableResponse = { data: Candidate[]; counts: CandidateTableCounts } & Pagination;

interface Entry {
  rows: Candidate[];
  total: number;
  counts: CandidateTableCounts;
  at: number;
}

const EMPTY_COUNTS: CandidateTableCounts = { pending: 0, approved: 0, hired: 0 };
/** A cached page younger than this is shown without asking the server again. */
const FRESH_MS = 15_000;
const MAX_ENTRIES = 60;

// Pages already fetched, so going back, re-sorting back or revisiting a search
// is instant. Shared across mounts; cleared whenever the data changes.
const pageCache = new Map<string, Entry>();

function remember(key: string, entry: Entry) {
  pageCache.delete(key);
  pageCache.set(key, entry);
  if (pageCache.size > MAX_ENTRIES) {
    const oldest = pageCache.keys().next().value;
    if (oldest !== undefined) pageCache.delete(oldest);
  }
}

async function fetchPage(
  base: Record<string, unknown>,
  pageIndex: number,
  pageSize: number
): Promise<Entry & { fetchedRows: Candidate[] }> {
  const res = await getJson<TableResponse>('/ats/candidates/table', {
    ...base,
    page: pageIndex + 1,
    limit: pageSize,
  });
  const rows = res.data ?? [];
  return {
    rows,
    fetchedRows: rows,
    total: res.total ?? 0,
    counts: res.counts ?? EMPTY_COUNTS,
    at: Date.now(),
  };
}

/**
 * One page of the Candidates table, filtered, searched and sorted by the
 * server. Pages are cached and the next page is fetched ahead of time, so
 * paging and revisiting a query feel instant; stale pages show immediately
 * and refresh in the background.
 */
export function useCandidateTable({
  tab,
  jobId,
  query,
  sortBy,
  pageIndex,
  pageSize,
  itemsVersion,
  appsVersion,
}: TableArgs) {
  const [rows, setRows] = useState<Candidate[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<CandidateTableCounts>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const loadedKey = useRef('');
  // What the last fetch already reflected, so merging its own rows into the
  // shared list does not trigger a second identical request.
  const seen = useRef<{ items: unknown; apps: unknown } | null>(null);

  const params = useCallback(
    () => ({
      tab,
      jobId: jobId || undefined,
      q: query.trim() || undefined,
      sort: sortBy,
    }),
    [tab, jobId, query, sortBy]
  );

  useEffect(() => {
    const base = params();
    const key = JSON.stringify({ ...base, pageIndex, pageSize });
    const dataChanged =
      !!seen.current &&
      (seen.current.items !== itemsVersion || seen.current.apps !== appsVersion);
    const isNewQuery = key !== loadedKey.current;
    if (!isNewQuery && !dataChanged) return;

    // Edits or live updates make every cached page suspect.
    if (dataChanged) pageCache.clear();

    const hit = pageCache.get(key);
    const fresh = !!hit && Date.now() - hit.at < FRESH_MS;
    const id = ++requestId.current;

    if (hit) {
      // Show what we have right away; refresh below unless it is fresh.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRows(hit.rows);
      setTotal(hit.total);
      setCounts(hit.counts);
      setLoading(false);
      loadedKey.current = key;
      if (fresh) return;
    }

    const timer = setTimeout(
      async () => {
        if (!hit) setLoading(true);
        else setRefreshing(true);
        setError(null);
        try {
          const page = await fetchPage(base, pageIndex, pageSize);
          if (id !== requestId.current) return;
          loadedKey.current = key;
          remember(key, page);
          setRows(page.rows);
          // Keep the shared cache able to resolve every row on screen.
          useCandidateStore.getState()._mergeMany(page.fetchedRows);
          seen.current = {
            items: useCandidateStore.getState().items,
            apps: appsVersion,
          };
          setTotal(page.total);
          setCounts(page.counts);

          // Fetch the next page ahead of time (cheap, and makes "next" instant).
          const nextIndex = pageIndex + 1;
          const nextKey = JSON.stringify({ ...base, pageIndex: nextIndex, pageSize });
          if (nextIndex * pageSize < page.total && !pageCache.has(nextKey)) {
            void fetchPage(base, nextIndex, pageSize)
              .then(next => {
                if (id !== requestId.current) return;
                remember(nextKey, next);
                useCandidateStore.getState()._mergeMany(next.fetchedRows);
                seen.current = {
                  items: useCandidateStore.getState().items,
                  apps: appsVersion,
                };
              })
              .catch(() => undefined);
          }
        } catch (e) {
          if (id !== requestId.current) return;
          setError((e as Error).message);
        } finally {
          if (id === requestId.current) {
            setLoading(false);
            setRefreshing(false);
          }
        }
      },
      // Data changes arrive in bursts: wait a beat so one refetch covers them.
      isNewQuery ? 0 : 400
    );
    return () => clearTimeout(timer);
  }, [params, pageIndex, pageSize, itemsVersion, appsVersion]);

  /** Every id matching the current filters, across all pages. */
  const fetchAllIds = useCallback(
    () => getJson<string[]>('/ats/candidates/table/ids', params()),
    [params]
  );

  return { rows, total, counts, loading, refreshing, error, fetchAllIds };
}
