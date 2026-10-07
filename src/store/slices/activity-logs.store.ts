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
  reset: () => void;
  /** Optimistically prepend a locally-known event so UI updates instantly
   * after a mutation, before the next fetch lands. */
  _prepend: (
    resourceType: string,
    resourceId: string,
    log: ActivityLog
  ) => void;
}

const initialState: ActivityLogState = {
  feeds: {},
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
            { page: opts?.page ?? 1, limit: opts?.limit ?? 50 }
          );
          const logs = normaliseLogs(res);
          set(s => {
            s.feeds[key] = logs;
            s.loading = false;
          });
        } catch (e) {
          set(s => {
            s.loading = false;
            s.error = (e as Error).message;
          });
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
      // Feeds name people and describe candidates, so nothing is persisted.
      partialize: () => ({}),
      // Bump when the shape or meaning of a cached entry changes, so stale
      // rows are discarded rather than rendered with a fallback label.
      // v1 → v2: the backend migrated legacy `type`-only rows to `action`, and
      // `stage_changed` / `status_changed` gained new metadata key names that
      // older cached entries do not carry.
      // v2 → v3: persistence removed; discard any cached feeds left behind.
      version: 3,
      migrate: () => ({}),
    }
  )
);
