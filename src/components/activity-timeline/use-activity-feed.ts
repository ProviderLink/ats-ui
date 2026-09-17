/**
 * Feed data for the timeline.
 *
 * Owns the cache lookup, the mount-time revalidate, the loading/error flags and
 * the "load older" call. Deliberately does NOT own the render cap, filtering or
 * collapsing:
 *
 *   - the render cap lives in the container, because it must be applied AFTER
 *     filtering (capping first would hide matching entries and would make the
 *     filter row's own visibility depend on the cap)
 *   - filtering and collapsing are pure functions in `filtering.ts` /
 *     `grouping.ts`
 *
 * Cached entries are returned immediately and the request revalidates them in
 * the background, so re-opening an entity never flashes a skeleton.
 */

import {
  feedKey,
  useActivityLogStore,
} from '@/store/slices/activity-logs.store';
import { useEffect, useMemo } from 'react';
import type { ActivityEntry } from './types';

export interface UseActivityFeedOptions {
  resourceType: string;
  resourceId: string;
  /** Render exactly these instead of fetching. Used by tests and fixtures. */
  entries?: ActivityEntry[];
  /** External loading flag — only meaningful together with `entries`. */
  loading?: boolean;
  /** External error message — only meaningful together with `entries`. */
  error?: string | null;
  /** Skip the fetch (e.g. a user without `activityLogs:read`). */
  enabled?: boolean;
}

export interface ActivityFeedResult {
  /** Every locally-known entry, newest first. Not capped. */
  entries: ActivityEntry[];
  /** Server-side total, when known. */
  serverTotal: number | null;
  loading: boolean;
  error: string | null;
  /** The server holds another page we have not fetched. */
  hasMoreOnServer: boolean;
  loadMore: () => void;
  /** Force a refetch, for the error-state retry button. */
  retry: () => void;
}

export function useActivityFeed({
  resourceType,
  resourceId,
  entries: controlled,
  loading: controlledLoading,
  error: controlledError,
  enabled = true,
}: UseActivityFeedOptions): ActivityFeedResult {
  const key = feedKey(resourceType, resourceId);
  const isControlled = controlled !== undefined;

  const cached = useActivityLogStore(s => s.feeds[key]);
  const storeLoading = useActivityLogStore(s => s.loading[key] ?? false);
  const storeError = useActivityLogStore(s => s.errors[key] ?? null);
  const pagination = useActivityLogStore(s => s.pagination[key] ?? null);
  const fetchForEntity = useActivityLogStore(s => s.fetchForEntity);
  const fetchMore = useActivityLogStore(s => s.fetchMore);

  // Always force: cached entries show instantly while the request revalidates
  // them, otherwise a feed persisted from an earlier session never updates.
  useEffect(() => {
    if (isControlled || !enabled) return;
    void fetchForEntity(resourceType, resourceId, { force: true });
  }, [isControlled, enabled, resourceType, resourceId, fetchForEntity]);

  const entries = useMemo<ActivityEntry[]>(
    () => (isControlled ? (controlled ?? []) : (cached ?? [])),
    [isControlled, controlled, cached]
  );

  return {
    entries,
    serverTotal: pagination?.total ?? null,
    // Only a genuinely empty feed shows skeletons — a revalidate over cached
    // entries must not flash.
    loading: isControlled
      ? !!controlledLoading
      : storeLoading && entries.length === 0,
    error: isControlled ? (controlledError ?? null) : storeError,
    hasMoreOnServer: !!pagination && pagination.page < pagination.totalPages,
    loadMore: () => {
      void fetchMore(resourceType, resourceId);
    },
    retry: () => {
      void fetchForEntity(resourceType, resourceId, { force: true });
    },
  };
}
