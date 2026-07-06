/**
 * Centralized SWR (Stale-While-Revalidate) data layer for ATS UI.
 *
 * Provides a single source of truth for data fetching with:
 * - Instant cache-first rendering (no loading spinners on navigation)
 * - Background revalidation when data is stale
 * - Request deduplication (concurrent calls share one promise)
 * - Memory + localStorage persistence
 * - Configurable stale times per resource
 */

// ── Types ───────────────────────────────────────────────────────────

export interface SwrOptions<T = unknown> {
  /** Time in ms before data is considered stale (default: 30s) */
  staleTime?: number;
  /** If false, fetch is skipped entirely */
  enabled?: boolean;
  /** Called when fetch succeeds */
  onSuccess?: (data: T) => void;
  /** Called when fetch fails */
  onError?: (error: Error) => void;
}

export interface SwrState<T> {
  data: T | undefined;
  /** True ONLY when there is no cached data at all (first-ever load) */
  isLoading: boolean;
  /** True when fetching in background (cached data exists) */
  isRefreshing: boolean;
  error: string | null;
  lastFetchedAt: number | null;
}

// ── Constants ───────────────────────────────────────────────────────

const DEFAULT_STALE_TIME = 30_000; // 30 seconds
const LS_PREFIX = 'ats_swr:';

// ── In-memory cache ─────────────────────────────────────────────────

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry>();
const inflightRequests = new Map<string, Promise<unknown>>();

// ── Helpers ─────────────────────────────────────────────────────────

function buildKey(prefix: string, params?: Record<string, unknown>): string {
  if (!params) return prefix;
  const sorted = Object.keys(params)
    .sort()
    .reduce(
      (acc, k) => {
        const v = params[k];
        if (v !== undefined && v !== null && v !== '') acc[k] = v;
        return acc;
      },
      {} as Record<string, unknown>
    );
  return `${prefix}:${JSON.stringify(sorted)}`;
}

function loadFromStorage<T>(key: string): CacheEntry<T> | null {
  try {
    const raw = localStorage.getItem(`${LS_PREFIX}${key}`);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (entry && typeof entry.timestamp === 'number' && 'data' in entry) {
      return entry;
    }
  } catch {
    // corrupted entry
  }
  return null;
}

function saveToStorage<T>(key: string, entry: CacheEntry<T>): void {
  try {
    localStorage.setItem(`${LS_PREFIX}${key}`, JSON.stringify(entry));
  } catch {
    // storage full or unavailable
  }
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Fetch data with SWR semantics:
 * 1. If non-stale cache exists → return it immediately, no fetch
 * 2. If stale cache exists → return it immediately, fetch in background
 * 3. If no cache → fetch and return
 *
 * Deduplicates concurrent fetches for the same key.
 */
export async function swrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: SwrOptions<T> = {}
): Promise<T> {
  const staleTime = options.staleTime ?? DEFAULT_STALE_TIME;

  // Check memory cache first
  let entry = memoryCache.get(key) as CacheEntry<T> | undefined;

  // Fall back to localStorage
  if (!entry) {
    const stored = loadFromStorage<T>(key);
    if (stored) {
      entry = stored;
      memoryCache.set(key, stored);
    }
  }

  const isFresh = entry && Date.now() - entry.timestamp < staleTime;
  const hasCachedData = !!entry;

  // If fresh, return immediately with no fetch
  if (isFresh) {
    return entry!.data;
  }

  // Deduplicate in-flight requests
  const inflight = inflightRequests.get(key) as Promise<T> | undefined;
  if (inflight) {
    return inflight;
  }

  // Create new fetch promise
  const promise = (async () => {
    try {
      const data = await fetcher();
      const newEntry: CacheEntry<T> = { data, timestamp: Date.now() };
      memoryCache.set(key, newEntry);
      saveToStorage(key, newEntry);
      options.onSuccess?.(data);
      return data;
    } catch (err) {
      options.onError?.(err as Error);
      // If we have stale cached data, return it on error
      if (hasCachedData && entry) {
        return entry.data;
      }
      throw err;
    } finally {
      inflightRequests.delete(key);
    }
  })();

  inflightRequests.set(key, promise);

  // If we have cached data (stale), return it immediately while fetch completes in background
  if (hasCachedData && entry) {
    // Fire and forget the background refresh
    promise.catch(() => {});
    return entry.data;
  }

  // No cached data — must wait for fetch
  return promise;
}

/**
 * Invalidate cached data for a key or key prefix.
 */
export function invalidate(keyOrPrefix: string): void {
  // Exact match
  if (memoryCache.has(keyOrPrefix)) {
    memoryCache.delete(keyOrPrefix);
    try {
      localStorage.removeItem(`${LS_PREFIX}${keyOrPrefix}`);
    } catch {}
  }

  // Prefix match — clear all keys starting with this prefix
  for (const key of memoryCache.keys()) {
    if (key.startsWith(keyOrPrefix)) {
      memoryCache.delete(key);
      try {
        localStorage.removeItem(`${LS_PREFIX}${key}`);
      } catch {}
    }
  }
}

/**
 * Pre-populate the cache (used by preloader).
 */
export function seedCache<T>(key: string, data: T): void {
  const entry: CacheEntry<T> = { data, timestamp: Date.now() };
  memoryCache.set(key, entry);
  saveToStorage(key, entry);
}

/**
 * Clear all SWR cache entries.
 */
export function clearAllCache(): void {
  memoryCache.clear();
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(LS_PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
  } catch {}
}

// Re-export for convenience
export { buildKey, DEFAULT_STALE_TIME };
