/**
 * Centralized `useData` hook — the single hook for ALL data fetching in the app.
 *
 * Replaces direct store fetch calls with instant cache-first rendering:
 * - First visit (no cache): shows loading skeleton, fetches data
 * - Revisit (cached data): shows data instantly, refreshes in background
 * - Window focus: revalidates stale data automatically
 *
 * Usage in a component:
 * ```tsx
 * const { data, isLoading, isRefreshing, error } = useData(
 *   'clients',
 *   () => getJson('/ats/clients', filters),
 *   { staleTime: 60_000 }
 * );
 * ```
 */

import {
  buildKey,
  DEFAULT_STALE_TIME,
  invalidate as invalidateSwr,
  swrFetch,
} from '@/lib/swr';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseDataOptions {
  /** Time in ms before data is considered stale (default: 30s) */
  staleTime?: number;
  /** If false, fetch is skipped entirely */
  enabled?: boolean;
  /** If true, revalidates when browser tab regains focus */
  revalidateOnFocus?: boolean;
}

export interface UseDataResult<T> {
  data: T | undefined;
  /** True ONLY on first-ever load (no cached data available) */
  isLoading: boolean;
  /** True when fetching in background (cached data exists and is being refreshed) */
  isRefreshing: boolean;
  /** Error message if the fetch failed */
  error: string | null;
  /** Manually refetch data */
  refetch: () => Promise<void>;
  /** Invalidate cache for this key (next access will fetch fresh) */
  invalidate: () => void;
}

/**
 * Fetch data with SWR semantics.
 *
 * On first call with no cache: isLoading=true, data=undefined
 * On call with cached data: data=instant, isRefreshing=true (background fetch)
 * On call with fresh cache: data=instant, no fetch
 */
export function useData<T>(
  keyPrefix: string,
  fetcher: () => Promise<T>,
  params?: Record<string, unknown>,
  options: UseDataOptions = {}
): UseDataResult<T> {
  const {
    staleTime = DEFAULT_STALE_TIME,
    enabled = true,
    revalidateOnFocus = true,
  } = options;

  const cacheKey = buildKey(keyPrefix, params);

  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if this is the first load ever (no cached data)
  const isFirstLoad = useRef(true);
  // Track if component is mounted
  const mountedRef = useRef(true);
  // Track params to avoid unnecessary refetches
  const paramsRef = useRef(cacheKey);

  const doFetch = useCallback(
    async (_forceIsLoading = false) => {
      if (!enabled) return;

      try {
        const result = await swrFetch<T>(cacheKey, fetcher, {
          staleTime,
          onSuccess: d => {
            if (!mountedRef.current) return;
            setData(d);
            setError(null);
            if (isFirstLoad.current) {
              setIsLoading(false);
              isFirstLoad.current = false;
            }
            setIsRefreshing(false);
          },
          onError: err => {
            if (!mountedRef.current) return;
            setError(err.message);
            if (isFirstLoad.current) {
              setIsLoading(false);
              isFirstLoad.current = false;
            }
            setIsRefreshing(false);
          },
        });

        // swrFetch returns immediately when cache is fresh or stale
        // It only awaits when there's NO cached data at all
        // So if we get here synchronously-ish with data and isFirstLoad,
        // we know there was no cache hit

        if (!mountedRef.current) return;
        setData(result);
        setError(null);

        // If we got here and isFirstLoad is still true, it means there was cached data
        if (isFirstLoad.current) {
          // Data came from cache — it's a background refresh scenario
        }
        setIsLoading(false);
        isFirstLoad.current = false;
        setIsRefreshing(false);
      } catch (err) {
        if (!mountedRef.current) return;
        setError((err as Error).message);
        setIsLoading(false);
        isFirstLoad.current = false;
        setIsRefreshing(false);
      }
    },
    [cacheKey, fetcher, staleTime, enabled]
  );

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    isFirstLoad.current = true;

    // Check if we have cached data before fetching
    // swrFetch will handle this internally
    if (enabled) {
      setIsLoading(true);
      doFetch(true);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [cacheKey, enabled]);

  // Refetch when params change
  useEffect(() => {
    if (paramsRef.current !== cacheKey) {
      paramsRef.current = cacheKey;
      isFirstLoad.current = true;
      if (enabled) {
        setIsLoading(true);
        doFetch(true);
      }
    }
  }, [cacheKey, enabled, doFetch]);

  // Revalidate on window focus
  useEffect(() => {
    if (!revalidateOnFocus || !enabled) return;

    const onFocus = () => {
      // Only refetch if we have data already (background refresh)
      if (!isFirstLoad.current) {
        setIsRefreshing(true);
        doFetch(false);
      }
    };

    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [revalidateOnFocus, enabled, doFetch]);

  const refetch = useCallback(async () => {
    setIsRefreshing(true);
    await doFetch(false);
  }, [doFetch]);

  const invalidate = useCallback(() => {
    invalidateSwr(cacheKey);
  }, [cacheKey]);

  return { data, isLoading, isRefreshing, error, refetch, invalidate };
}

/**
 * Simplified hook for list-based data that uses the store pattern.
 * This wraps the existing Zustand store fetch with SWR semantics.
 */
export function useStoreData<T>(
  storeItems: T[],
  storeLoading: boolean,
  storeIsRefreshing: boolean | undefined,
  storeError: string | null,
  storeFetch: () => Promise<void>
): UseDataResult<T[]> {
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (storeItems.length > 0 || !storeLoading) {
      setIsInitialLoad(false);
    }
  }, [storeItems.length, storeLoading]);

  return {
    data: storeItems,
    isLoading: storeLoading && storeItems.length === 0 && isInitialLoad,
    isRefreshing:
      !!storeIsRefreshing || (storeLoading && storeItems.length > 0),
    error: storeError,
    refetch: storeFetch,
    invalidate: () => {},
  };
}
