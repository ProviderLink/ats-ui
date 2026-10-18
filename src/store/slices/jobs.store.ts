import { deleteJson, getJson, patchJson, postJson } from '@/lib/api-client';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  GeneratedJobDraft,
  Job,
  Pagination,
  StandardizedJobContent,
} from '../types';
import { useApplicationStore } from './applications.store';
import { useBootStore } from './boot.store';
import {
  replaceJob,
  statusChangeMessage,
  upsertJob,
} from './jobs.store.helpers';
import type { JobActions, JobState } from './jobs.store.types';
import { createMutate, withToast } from './mutation';

const initialState: JobState = {
  items: [],
  detail: {},
  loading: false,
  isRefreshing: false,
  mutating: false,
  error: null,
  pagination: null,
  filters: { page: 1, limit: 20 },
};

// True while `items` holds a server-filtered subset (e.g. `{ clientId }` or
// `{ status: 'open' }`) rather than the full post-boot list. The post-boot
// no-op in `fetch` must not trust `items` in that state, otherwise a later
// unfiltered fetch can never restore the full list. Not persisted: after a
// reload `isBooted` is false and the boot fetch reloads everything anyway.
let itemsAreSubset = false;

export const useJobStore = create<JobState & JobActions>()(
  persist(
    immer((set, get) => {
      const mutate = createMutate<JobState>(set);

      return {
        ...initialState,

        fetch: async params => {
          // No-op after boot for an UNFILTERED refresh only — all data is already
          // client-side. An explicit scoping filter (e.g. `{ clientId }`) must
          // still reach the server; returning early made such a call silently
          // resolve to the full list. Mirrors `hasExplicitFilter` in
          // `candidates.store.ts`.
          const hasExplicitFilter =
            params &&
            Object.keys(params).some(k => {
              if (k === 'page' || k === 'limit') return false;
              return (params as Record<string, unknown>)[k] !== undefined;
            });
          if (
            useBootStore.getState().isBooted &&
            get().items.length > 0 &&
            !hasExplicitFilter &&
            !itemsAreSubset
          )
            return;

          const filters = { ...get().filters, ...params };
          const hasData = get().items.length > 0;
          // When the status filter changes, treat it as a fresh load so the
          // list shows a skeleton instead of stale data from the old filter.
          const filterChanged =
            params?.status !== undefined &&
            params.status !== get().filters.status;
          set(s => {
            if (hasData && !filterChanged) {
              s.isRefreshing = true;
            } else {
              s.loading = true;
            }
            s.error = null;
            if (params) s.filters = filters;
          });
          try {
            const res = await getJson<Job[] | ({ data: Job[] } & Pagination)>(
              '/ats/jobs',
              filters as Record<string, unknown>
            );
            const data = Array.isArray(res) ? res : (res.data ?? []);
            const pag = Array.isArray(res)
              ? null
              : {
                  total: res.total,
                  page: res.page,
                  limit: res.limit,
                  totalPages: res.totalPages,
                };
            itemsAreSubset = Object.entries(filters).some(
              ([k, v]) => k !== 'page' && k !== 'limit' && v !== undefined
            );
            set(s => {
              s.items = data;
              s.pagination = pag;
              s.loading = false;
              s.isRefreshing = false;
            });
          } catch (e) {
            set(s => {
              s.loading = false;
              s.isRefreshing = false;
              s.error = (e as Error).message;
            });
          }
        },

        fetchOne: async id => {
          set(s => {
            s.loading = true;
            s.error = null;
          });
          try {
            const job = await getJson<Job>(`/ats/jobs/${id}`);
            set(s => {
              s.detail[id] = job;
              s.loading = false;
            });
          } catch (e) {
            set(s => {
              s.loading = false;
              s.error = (e as Error).message;
            });
          }
        },

        create: data =>
          mutate(
            () => postJson<Job>('/ats/jobs', data),
            (s, job) => upsertJob(s, job)
          ),

        update: async (id, data) => {
          await mutate(
            () => patchJson<Job>(`/ats/jobs/${id}`, data),
            (s, job) => replaceJob(s, id, job)
          );
        },

        remove: async id => {
          await withToast('Job deleted', async () => {
            await mutate(
              () => deleteJson(`/ats/jobs/${id}`),
              s => {
                s.items = s.items.filter(x => x._id !== id);
                delete s.detail[id];
              }
            );
            useApplicationStore.getState()._removeByJobId(id);
          });
        },

        setStatus: async (id, status) => {
          await withToast(statusChangeMessage(status), () =>
            mutate(
              () => patchJson<Job>(`/ats/jobs/${id}/status`, { status }),
              (s, job) => replaceJob(s, id, job),
              false
            )
          );
        },

        setPipeline: async (id, templateId, stageMapping) => {
          await withToast('Pipeline assigned', () =>
            mutate(
              () => {
                const body: Record<string, unknown> = { templateId };
                if (stageMapping) body.stageMapping = stageMapping;
                return patchJson<Job>(`/ats/jobs/${id}/pipeline`, body);
              },
              (s, job) => replaceJob(s, id, job),
              false
            )
          );
        },

        generateDraft: async data => {
          return postJson<GeneratedJobDraft>('/ats/jobs/generate-draft', data);
        },

        standardizeContent: async data => {
          return postJson<StandardizedJobContent>('/ats/jobs/standardize', data);
        },

        setFilters: f =>
          set(s => {
            s.filters = { ...s.filters, ...f };
          }),

        reset: () =>
          set(s => {
            Object.assign(s, initialState);
          }),

        _patch: job =>
          set(s => {
            upsertJob(s, job);
            if (s.detail[job._id]) s.detail[job._id] = job;
          }),

        _remove: id =>
          set(s => {
            s.items = s.items.filter(x => x._id !== id);
            delete s.detail[id];
          }),

        _removeByClientId: clientId =>
          set(s => {
            s.items = s.items.filter(x => x.clientId !== clientId);
          }),
      };
    }),
    {
      name: 'ats-jobs',
      storage: createJSONStorage(() => localStorage),
      partialize: s => ({
        items: s.items,
        pagination: s.pagination,
      }),
    }
  )
);
