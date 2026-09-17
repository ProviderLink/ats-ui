import { getJson } from '@/lib/api-client';
import { isValidObjectId } from '@/lib/utils';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  ActivityLog,
  ActivityLogListResponse,
  ActivityResourceType,
  Pagination,
} from '../types';

/** Compound key (resourceType|resourceId) so per-entity feeds cache independently. */
export function feedKey(resourceType: string, resourceId: string): string {
  return `${resourceType}|${resourceId}`;
}

interface ActivityLogState {
  /** Per-entity activity feeds keyed by `${resourceType}|${resourceId}`. */
  feeds: Record<string, ActivityLog[]>;
  /** Per-feed loading flags, keyed the same way as `feeds` so a fetch for one
   * entity never shows skeletons in an unrelated timeline. */
  loading: Record<string, boolean>;
  /** Per-feed error message, keyed the same way as `feeds`. `null` means the
   * last fetch for that entity succeeded. */
  errors: Record<string, string | null>;
  /** Per-feed pagination cursor, so the UI can load older entries beyond the
   * first page instead of silently truncating the history. */
  pagination: Record<string, Pagination | null>;
}

interface ActivityLogActions {
  /** Fetch the activity feed for a single entity. Cached by `resourceType|resourceId`
   * and reused across mount/unmount cycles until `force` is true. */
  fetchForEntity: (
    resourceType: ActivityResourceType | string,
    resourceId: string,
    opts?: { page?: number; limit?: number; force?: boolean }
  ) => Promise<void>;
  /** Append the next page of entries to an already-loaded feed. No-op while a
   * request is in flight or once the last page has been reached. */
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

const initialState: ActivityLogState = {
  feeds: {},
  loading: {},
  errors: {},
  pagination: {},
};

/**
 * Normalise the API response into a plain array + pagination pair.
 *
 * `getJson` unwraps `{ success, data, meta }` into `{ data, ...meta }` for
 * list endpoints, so pagination arrives **flattened onto the response**, not
 * nested under a `pagination` key. Both shapes are accepted here.
 */
function normalise(res: ActivityLog[] | ActivityLogListResponse): {
  logs: ActivityLog[];
  pagination: Pagination | null;
} {
  if (Array.isArray(res)) return { logs: res, pagination: null };

  const flat = res as ActivityLogListResponse & Partial<Pagination>;
  const pagination =
    res.pagination ??
    (typeof flat.totalPages === 'number' && typeof flat.page === 'number'
      ? {
          total: flat.total ?? 0,
          page: flat.page,
          limit: flat.limit ?? 50,
          totalPages: flat.totalPages,
        }
      : null);

  return { logs: res.data ?? [], pagination };
}

/** Default page size for the first fetch and each subsequent page. */
const PAGE_SIZE = 50;

export const useActivityLogStore = create<
  ActivityLogState & ActivityLogActions
>()(
  persist(
    immer(set => ({
      ...initialState,

      fetchForEntity: async (resourceType, resourceId, opts) => {
        const key = feedKey(resourceType, resourceId);
        if (!isValidObjectId(resourceId)) {
          // Avoid hitting the API for placeholder ids (mocks/new records).
          set(s => {
            s.feeds[key] = [];
          });
          return;
        }
        // Skip refetch when we already have cached entries for this entity
        // and the caller didn't force a refresh — reduces redundant calls
        // when sheets remount.
        if (!opts?.force && useActivityLogStore.getState().feeds[key]) {
          return;
        }
        set(s => {
          s.loading[key] = true;
          s.errors[key] = null;
        });
        try {
          const res = await getJson<ActivityLog[] | ActivityLogListResponse>(
            `/shared/activity-logs/${resourceType}/${resourceId}`,
            { page: opts?.page ?? 1, limit: opts?.limit ?? PAGE_SIZE }
          );
          const { logs, pagination } = normalise(res);
          set(s => {
            s.feeds[key] = logs;
            s.loading[key] = false;
            s.pagination[key] = pagination;
          });
        } catch (e) {
          set(s => {
            s.loading[key] = false;
            s.errors[key] = (e as Error).message;
          });
        }
      },

      fetchMore: async (resourceType, resourceId) => {
        const key = feedKey(resourceType, resourceId);
        const state = useActivityLogStore.getState();
        if (!isValidObjectId(resourceId)) return;
        // Guard against duplicate in-flight requests and end-of-list.
        if (state.loading[key]) return;
        const pager = state.pagination[key];
        if (!pager || pager.page >= pager.totalPages) return;
        // Only append onto a feed that has already loaded its first page.
        if (!state.feeds[key]) return;

        set(s => {
          s.loading[key] = true;
          s.errors[key] = null;
        });
        try {
          const res = await getJson<ActivityLog[] | ActivityLogListResponse>(
            `/shared/activity-logs/${resourceType}/${resourceId}`,
            { page: pager.page + 1, limit: pager.limit || PAGE_SIZE }
          );
          const { logs, pagination } = normalise(res);
          set(s => {
            // De-duplicate by _id — an optimistic entry or a concurrently
            // recorded event can shift page boundaries between requests.
            const seen = new Set((s.feeds[key] ?? []).map(l => l._id));
            s.feeds[key] = [
              ...(s.feeds[key] ?? []),
              ...logs.filter(l => !seen.has(l._id)),
            ];
            s.loading[key] = false;
            s.pagination[key] = pagination ?? {
              ...pager,
              page: pager.page + 1,
            };
          });
        } catch (e) {
          set(s => {
            s.loading[key] = false;
            s.errors[key] = (e as Error).message;
          });
        }
      },

      // Build a fresh object rather than reusing `initialState`, whose nested
      // `feeds` reference would otherwise be shared with the live state.
      reset: () =>
        set(() => ({
          feeds: {},
          loading: {},
          errors: {},
          pagination: {},
        })),

      _prepend: (resourceType, resourceId, log) => {
        set(s => {
          const key = feedKey(resourceType, resourceId);
          const existing = s.feeds[key] ?? [];
          s.feeds[key] = [log, ...existing];
          // The event was recorded locally, so any prior fetch error is stale.
          s.errors[key] = null;
        });
      },
    })),
    {
      name: 'ats-activity-logs',
      storage: createJSONStorage(() => localStorage),
      // Only persist the per-entity feed cache, not loading flags.
      partialize: s => ({ feeds: s.feeds }),
    }
  )
);
