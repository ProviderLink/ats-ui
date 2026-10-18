import { deleteJson, getJson, patchJson, postJson } from '@/lib/api-client';
import { toast } from 'sonner';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  Interview,
  InterviewFilters,
  Pagination,
  UpdateInterviewDto,
} from '../types';
import { useBootStore } from './boot.store';
import {
  interviewPath,
  replaceInterview,
  upsertInterview,
} from './interviews.store.helpers';
import type {
  InterviewActions,
  InterviewState,
} from './interviews.store.types';
import { createMutate } from './mutation';

const initialState: InterviewState = {
  items: [],
  detail: {},
  byApplication: {},
  loading: false,
  isRefreshing: false,
  mutating: false,
  error: null,
  pagination: null,
  filters: { page: 1, limit: 20 },
};

// True while `items` holds a server-filtered subset (e.g. a calendar status
// filter or one candidate's interviews) rather than the full post-boot list.
// The post-boot no-op in `fetch` must not trust `items` in that state, or a
// later unfiltered fetch could never restore the full list. Not persisted:
// after a reload `isBooted` is false and the boot fetch reloads everything.
let itemsAreSubset = false;

/** Run a mutation, toasting its outcome. Failures are rethrown to the caller. */
async function withToast<R>(
  successMessage: string,
  run: () => Promise<R>
): Promise<R> {
  try {
    const result = await run();
    toast.success(successMessage);
    return result;
  } catch (e) {
    toast.error((e as Error).message);
    throw e;
  }
}

export const useInterviewStore = create<InterviewState & InterviewActions>()(
  persist(
    immer((set, get) => {
      const mutate = createMutate<InterviewState>(set);

      return {
        ...initialState,

        fetch: async params => {
          // Skip automatic background refreshes after boot, but always
          // allow explicit fetches (e.g. after mutations or with a
          // candidateId filter) so the UI stays current.
          const hasExplicitFilter =
            params &&
            Object.keys(params).some(k => k !== 'page' && k !== 'limit');
          if (
            useBootStore.getState().isBooted &&
            get().items.length > 0 &&
            !hasExplicitFilter &&
            !itemsAreSubset
          )
            return;

          await get().refresh(params);
        },

        refresh: async params => {
          // Params are authoritative: scoping filters (candidateId, status, ...)
          // from a previous call must not leak into this one, or an unfiltered
          // refresh would silently stay scoped. Only page/limit fall back to the
          // cached values.
          const base = get().filters;
          const filters: InterviewFilters = {
            page: params?.page ?? base.page,
            limit: params?.limit ?? base.limit,
            candidateId: params?.candidateId,
            jobId: params?.jobId,
            applicationId: params?.applicationId,
            status: params?.status,
            interviewerId: params?.interviewerId,
          };
          const hasData = get().items.length > 0;
          // When the status filter changes, treat it as a fresh load so the
          // view shows a skeleton instead of stale data from the old filter.
          const filterChanged =
            params?.status !== undefined &&
            params.status !== get().filters.status;
          set(s => {
            if (hasData && !filterChanged) s.isRefreshing = true;
            else s.loading = true;
            s.error = null;
            if (params) s.filters = filters;
          });
          try {
            const res = await getJson<{ data: Interview[] } & Pagination>(
              '/ats/interviews',
              filters as Record<string, unknown>
            );
            itemsAreSubset = Object.entries(filters).some(
              ([k, v]) => k !== 'page' && k !== 'limit' && v !== undefined
            );
            set(s => {
              s.items = res.data;
              s.pagination = {
                total: res.total,
                page: res.page,
                limit: res.limit,
                totalPages: res.totalPages,
              };
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
            const interview = await getJson<Interview>(`/ats/interviews/${id}`);
            set(s => {
              s.detail[id] = interview;
              s.loading = false;
            });
          } catch (e) {
            set(s => {
              s.loading = false;
              s.error = (e as Error).message;
            });
          }
        },

        /**
         * Fetch interviews for one application and UNION them into `items` by id.
         *
         * Additive on purpose. This used to assign `s.items = res.data`, which
         * REPLACED the shared array with one application's interviews. Opening any
         * candidate detail sheet calls this, so the calendar — which reads
         * `items` — then rendered that single candidate's interviews as the whole
         * workspace. The calendar could not repair it either: its fetch carries
         * no scoping filter, and after boot such a fetch is a deliberate no-op.
         *
         * Never removes anything, mirroring `fetchScopedMerge` in
         * `applications.store.ts`, so a scoped read cannot blank a broad one.
         */
        fetchByApplication: async (applicationId, params) => {
          set(s => {
            s.loading = true;
            s.error = null;
          });
          try {
            const res = await getJson<{ data: Interview[] } & Pagination>(
              `/ats/applications/${applicationId}/interviews`,
              (params ?? {}) as Record<string, unknown>
            );
            set(s => {
              const byId = new Map(s.items.map(i => [i._id, i]));
              for (const interview of res.data)
                byId.set(interview._id, interview);
              s.items = [...byId.values()];
              s.loading = false;
            });
          } catch (e) {
            set(s => {
              s.loading = false;
              s.error = (e as Error).message;
            });
          }
        },

        /**
         * Fetch one application's interviews WITHOUT touching `items`.
         *
         * The scoped screen gets its own slice; the calendar keeps the shared
         * list it needs. Returns the rows so the caller can hold them directly.
         * Errors are surfaced but do not throw, matching the other fetchers —
         * the caller keeps whatever it already had.
         */
        fetchScopedByApplication: async (applicationId, params) => {
          try {
            const res = await getJson<{ data: Interview[] } & Pagination>(
              `/ats/applications/${applicationId}/interviews`,
              (params ?? {}) as Record<string, unknown>
            );
            set(s => {
              s.byApplication[applicationId] = res.data;
            });
            return res.data;
          } catch (e) {
            set(s => {
              s.error = (e as Error).message;
            });
            return [];
          }
        },

        create: data =>
          withToast('Interview scheduled — invitations sent', () =>
            mutate(
              () => postJson<Interview>('/ats/interviews', data),
              (s, interview) => upsertInterview(s, interview)
            )
          ),

        createForApplication: (applicationId, data) =>
          withToast('Interview scheduled — invitations sent', () =>
            mutate(
              () =>
                postJson<Interview>(
                  `/ats/applications/${applicationId}/interviews`,
                  data
                ),
              (s, interview) => upsertInterview(s, interview)
            )
          ),

        update: async (id, data, applicationId) => {
          await withToast('Interview updated — notifications sent', () =>
            mutate(
              () => patchJson<Interview>(interviewPath(id, applicationId), data),
              (s, interview) => replaceInterview(s, id, interview)
            )
          );
        },

        cancel: async (id, applicationId) => {
          await withToast('Interview cancelled — notifications sent', () =>
            mutate(
              () => deleteJson(interviewPath(id, applicationId)),
              s => {
                const idx = s.items.findIndex(x => x._id === id);
                if (idx !== -1) s.items[idx].status = 'cancelled';
                if (s.detail[id]) s.detail[id].status = 'cancelled';
              },
              false
            )
          );
        },

        submitFeedback: async (id, data, applicationId) => {
          await withToast('Feedback submitted', () =>
            mutate(
              () =>
                postJson<Interview>(
                  interviewPath(id, applicationId, '/feedback'),
                  data
                ),
              (s, interview) => replaceInterview(s, id, interview),
              false
            )
          );
        },

        completeAndFeedback: async (id, data, applicationId) => {
          await withToast('Interview completed & feedback submitted', () =>
            mutate(
              async () => {
                await patchJson<Interview>(interviewPath(id, applicationId), {
                  status: 'completed',
                } as UpdateInterviewDto);
                return postJson<Interview>(
                  interviewPath(id, applicationId, '/feedback'),
                  data
                );
              },
              (s, interview) => replaceInterview(s, id, interview)
            )
          );
        },

        setFilters: f =>
          set(s => {
            s.filters = { ...s.filters, ...f };
          }),

        reset: () =>
          set(s => {
            Object.assign(s, initialState);
          }),

        _patch: interview =>
          set(s => {
            upsertInterview(s, interview);
            if (s.detail[interview._id]) s.detail[interview._id] = interview;
          }),

        _remove: id =>
          set(s => {
            s.items = s.items.filter(x => x._id !== id);
            delete s.detail[id];
          }),
      };
    }),
    {
      name: 'ats-interviews',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
