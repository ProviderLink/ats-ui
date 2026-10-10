import { getJson } from '@/lib/api-client';
import { isValidObjectId } from '@/lib/utils';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  ActivityLog,
  ActivityLogListResponse,
  ActivityResourceType,
} from '../types';

/** Compound key (resourceType|resourceId) so per-entity feeds cache independently. */
function feedKey(resourceType: string, resourceId: string): string {
  return `${resourceType}|${resourceId}`;
}

interface ActivityLogState {
  /** Per-entity activity feeds keyed by `${resourceType}|${resourceId}`. */
  feeds: Record<string, ActivityLog[]>;
  /** How many entries exist on the server for each feed (all pages). */
  totals: Record<string, number>;
  /** Last page loaded for each feed. */
  pages: Record<string, number>;
  loading: boolean;
  error: string | null;
}

interface ActivityLogActions {
  /** Fetch the activity feed for a single entity. Cached by `resourceType|resourceId`
   * and reused across mount/unmount cycles until `force` is true. */
  fetchForEntity: (
    resourceType: ActivityResourceType | string,
    resourceId: string,
    opts?: { page?: number; limit?: number; force?: boolean }
  ) => Promise<void>;
  /** Load the next (older) page of a feed and append it. */
  fetchMore: (
    resourceType: ActivityResourceType | string,
    resourceId: string
  ) => Promise<void>;
  reset: () => void;
  /** Optimistically prepend a locally-known event so UI updates instantly
   * after a mutation, before the next fetch lands. */
  _prepend: (
    resourceType: string,
    resourceId: string,
    log: ActivityLog
  ) => void;
}

const PAGE_SIZE = 50;

/** Feeds currently loading an older page, so a double click cannot fetch twice. */
const loadingMore = new Set<string>();

const initialState: ActivityLogState = {
  feeds: {},
  totals: {},
  pages: {},
  loading: false,
  error: null,
};

/**
 * Normalise the API response into a plain array of logs.
 *
 * The endpoint can answer with either a bare array or `{ data, ...pagination }`.
 * The pagination fields are read FLAT off the response (see
 * `ActivityLogListResponse`); they were previously read from a nested
 * `res.pagination`, which the wire format never supplies, so that value was
 * always `undefined`.
 *
 * Only the array is returned: nothing consumes the counts, and the feed is
 * cached whole per entity, so there is no page state to track.
 */
function totalOf(
  res: ActivityLog[] | ActivityLogListResponse,
  fallback: number
): number {
  return Array.isArray(res) ? fallback : (res.total ?? fallback);
}

function normaliseLogs(
  res: ActivityLog[] | ActivityLogListResponse
): ActivityLog[] {
  if (Array.isArray(res)) return res;
  return res.data ?? [];
}

export const useActivityLogStore = create<
  ActivityLogState & ActivityLogActions
>()(
  persist(
    immer(set => ({
      ...initialState,

      fetchForEntity: async (resourceType, resourceId, opts) => {
        if (!isValidObjectId(resourceId)) {
          // Avoid hitting the API for placeholder ids (mocks/new records).
          set(s => {
            s.feeds[feedKey(resourceType, resourceId)] = [];
          });
          return;
        }
        if (opts?.force === false) return;
        const key = feedKey(resourceType, resourceId);
        // Skip refetch when we already have cached entries for this entity
        // and the caller didn't force a refresh — reduces redundant calls
        // when sheets remount.
        if (!opts?.force && useActivityLogStore.getState().feeds[key]) {
          return;
        }
        set(s => {
          s.loading = true;
          s.error = null;
        });
        try {
          const res = await getJson<ActivityLog[] | ActivityLogListResponse>(
            `/shared/activity-logs/${resourceType}/${resourceId}`,
            { page: opts?.page ?? 1, limit: opts?.limit ?? PAGE_SIZE }
          );
          const logs = normaliseLogs(res);
          set(s => {
            s.feeds[key] = logs;
            s.totals[key] = totalOf(res, logs.length);
            s.pages[key] = 1;
            s.loading = false;
          });
        } catch (e) {
          set(s => {
            s.loading = false;
            s.error = (e as Error).message;
          });
        }
      },

      fetchMore: async (resourceType, resourceId) => {
        const key = feedKey(resourceType, resourceId);
        if (!isValidObjectId(resourceId) || loadingMore.has(key)) return;
        const state = useActivityLogStore.getState();
        const total = state.totals[key] ?? 0;
        const loaded = (state.feeds[key] ?? []).filter(
          l => !String(l._id).startsWith('local-')
        ).length;
        if (loaded >= total) return;

        loadingMore.add(key);
        try {
          const page = (state.pages[key] ?? 1) + 1;
          const res = await getJson<ActivityLog[] | ActivityLogListResponse>(
            `/shared/activity-logs/${resourceType}/${resourceId}`,
            { page, limit: PAGE_SIZE }
          );
          const older = normaliseLogs(res);
          set(s => {
            const have = new Set((s.feeds[key] ?? []).map(l => l._id));
            s.feeds[key] = [
              ...(s.feeds[key] ?? []),
              ...older.filter(l => !have.has(l._id)),
            ];
            s.totals[key] = totalOf(res, s.totals[key] ?? 0);
            s.pages[key] = page;
          });
        } catch (e) {
          set(s => {
            s.error = (e as Error).message;
          });
        } finally {
          loadingMore.delete(key);
        }
      },

      reset: () => set(s => Object.assign(s, initialState)),

      _prepend: (resourceType, resourceId, log) => {
        set(s => {
          const key = feedKey(resourceType, resourceId);
          const existing = s.feeds[key] ?? [];
          s.feeds[key] = [log, ...existing];
        });
      },
    })),
    {
      name: 'ats-activity-logs',
      storage: createJSONStorage(() => localStorage),
      // Only persist the per-entity feed cache, not loading flags.
      partialize: s => ({
        feeds: s.feeds,
        totals: s.totals,
        pages: s.pages,
      }),
      // Bump when the shape or meaning of a cached entry changes, so stale
      // rows are discarded rather than rendered with a fallback label.
      // v1 → v2: the backend migrated legacy `type`-only rows to `action`, and
      // `stage_changed` / `status_changed` gained new metadata key names that
      // older cached entries do not carry.
      version: 3,
      migrate: () => ({ feeds: {}, totals: {}, pages: {} }),
    }
  )
);
