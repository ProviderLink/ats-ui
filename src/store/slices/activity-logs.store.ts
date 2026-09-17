import {
  fetchEntityActivity,
  type ActivityPage,
} from '@/components/activity-timeline/api';
import type { ActivityEntry } from '@/components/activity-timeline/types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ActivityResourceType } from '../types';

/** Compound key (resourceType|resourceId) so per-entity feeds cache independently. */
export function feedKey(resourceType: string, resourceId: string): string {
  return `${resourceType}|${resourceId}`;
}

/**
 * Per-entity cache of normalised activity entries.
 *
 * The store owns caching, loading/error flags and the pagination cursor. It
 * deliberately does NOT build HTTP requests or interpret payloads — that is
 * `components/activity-timeline/api.ts`, so legacy-token mapping and the
 * metadata allowlist cannot be bypassed by calling the store directly.
 */

interface ActivityLogState {
  /** Normalised entries, keyed by `${resourceType}|${resourceId}`. */
  feeds: Record<string, ActivityEntry[]>;
  /** Per-feed loading flags, so one entity's fetch never skeletons another. */
  loading: Record<string, boolean>;
  /** Per-feed error message; `null` means the last fetch succeeded. */
  errors: Record<string, string | null>;
  /** Per-feed pagination cursor, so older entries can be loaded on demand. */
  pagination: Record<string, ActivityPage | null>;
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
    entry: ActivityEntry
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
/** Default page size for the first fetch and each subsequent page. */
const PAGE_SIZE = 50;

/** Newest first, with entries sharing a timestamp left in arrival order. */
function sortNewestFirst(entries: ActivityEntry[]): ActivityEntry[] {
  return [...entries].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );
}

export const useActivityLogStore = create<
  ActivityLogState & ActivityLogActions
>()(
  persist(
    immer(set => ({
      ...initialState,

      fetchForEntity: async (resourceType, resourceId, opts) => {
        const key = feedKey(resourceType, resourceId);
        // Skip refetch when we already hold this entity's feed and the caller
        // did not force a refresh — avoids redundant calls on sheet remounts.
        if (!opts?.force && useActivityLogStore.getState().feeds[key]) return;

        set(s => {
          s.loading[key] = true;
          s.errors[key] = null;
        });
        try {
          const page = await fetchEntityActivity(
            resourceType,
            resourceId,
            opts?.page ?? 1,
            opts?.limit ?? PAGE_SIZE
          );
          set(s => {
            s.feeds[key] = page.entries;
            s.loading[key] = false;
            s.pagination[key] = page;
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
          const next = await fetchEntityActivity(
            resourceType,
            resourceId,
            pager.page + 1,
            pager.limit || PAGE_SIZE
          );
          set(s => {
            // De-duplicate by id — an optimistic entry or a concurrently
            // recorded event can shift page boundaries between requests.
            const seen = new Set((s.feeds[key] ?? []).map(entry => entry.id));
            s.feeds[key] = sortNewestFirst([
              ...(s.feeds[key] ?? []),
              ...next.entries.filter(entry => !seen.has(entry.id)),
            ]);
            s.loading[key] = false;
            s.pagination[key] = next;
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

      _prepend: (resourceType, resourceId, entry) => {
        set(s => {
          const key = feedKey(resourceType, resourceId);
          s.feeds[key] = sortNewestFirst([entry, ...(s.feeds[key] ?? [])]);
          // The event was recorded locally, so any prior fetch error is stale.
          s.errors[key] = null;
        });
      },
    })),
    {
      name: 'ats-activity-logs',
      storage: createJSONStorage(() => localStorage),
      // Bump whenever `ActivityEntry` changes shape. Version 1 stored raw
      // server documents (keyed by `_id`, with `updatedAt` and unresolved
      // legacy `type` tokens); rendering those would produce broken rows until
      // the forced refetch landed, so they are dropped instead.
      version: 2,
      migrate: () => ({ feeds: {}, loading: {}, errors: {}, pagination: {} }),
      // Only persist the per-entity feed cache, not loading flags or cursors.
      partialize: s => ({ feeds: s.feeds }),
    }
  )
);
