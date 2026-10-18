import { deleteJson, getJson, patchJson } from '@/lib/api-client';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Application, ApplicationFilters, Pagination } from '../types';
import {
  applyApplicationPatch,
  replaceApplication,
} from './applications.store.helpers';
import type {
  ApplicationActions,
  ApplicationState,
} from './applications.store.types';
import { useBootStore } from './boot.store';
import { createMutate } from './mutation';

const initialState: ApplicationState = {
  items: [],
  detail: {},
  loading: false,
  isRefreshing: false,
  mutating: false,
  error: null,
  pagination: null,
  filters: { page: 1, limit: 20 },
};

export const useApplicationStore = create<
  ApplicationState & ApplicationActions
>()(
  persist(
    immer((set, get) => {
      const mutate = createMutate<ApplicationState>(set);

      /** PATCH one application endpoint and write the returned record back. */
      async function transition(
        id: string,
        action: string,
        body: object,
        clearError = true
      ): Promise<void> {
        await mutate(
          () => patchJson<Application>(`/ats/applications/${id}/${action}`, body),
          (s, app) => replaceApplication(s, id, app),
          clearError
        );
      }

      return {
        ...initialState,

        fetch: async params => {
          // No-op after boot only for automatic refreshes that carry no
          // explicit filter. Explicit fetches — e.g. after approve/reject/
          // hire or a pipeline refresh — always hit the server so the
          // pipeline board and detail views stay current.
          const hasExplicitFilter =
            params &&
            Object.keys(params).some(k => k !== 'page' && k !== 'limit');
          if (
            useBootStore.getState().isBooted &&
            get().items.length > 0 &&
            !hasExplicitFilter
          )
            return;

          // Params are authoritative — we don't silently inherit stale
          // jobId / candidateId / phase / etc. from a previous fetch.
          // Only page/limit default to the cached values so callers can
          // issue a plain `fetch()` to refresh the current view.
          const base = get().filters;
          const filters: ApplicationFilters = {
            page: params?.page ?? base.page,
            limit: params?.limit ?? base.limit,
            jobId: params?.jobId,
            candidateId: params?.candidateId,
            clientId: params?.clientId,
            phase: params?.phase,
          };
          const hasData = get().items.length > 0;
          // When the jobId or phase filter changes, treat it as a fresh load
          // so the pipeline board shows a skeleton instead of the wrong job's apps.
          const filterChanged =
            (params?.jobId !== undefined && params.jobId !== base.jobId) ||
            (params?.phase !== undefined && params.phase !== base.phase);
          set(s => {
            if (hasData && !filterChanged) s.isRefreshing = true;
            else s.loading = true;
            s.error = null;
            if (params) s.filters = filters;
          });
          try {
            // getJson may return a flat array when the backend omits `meta`
            // from the response envelope. Handle both shapes so the store
            // never stores `undefined` as items.
            const res = await getJson<
              Application[] | ({ data: Application[] } & Pagination)
            >('/ats/applications', filters as Record<string, unknown>);
            const data = Array.isArray(res) ? res : (res.data ?? []);
            const pag = Array.isArray(res)
              ? null
              : {
                  total: res.total,
                  page: res.page,
                  limit: res.limit,
                  totalPages: res.totalPages,
                };
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

        fetchScoped: async params => {
          const res = await getJson<
            Application[] | ({ data: Application[] } & Pagination)
          >('/ats/applications', {
            ...params,
            page: params.page ?? 1,
            limit: params.limit ?? 9999,
          } as Record<string, unknown>);
          return Array.isArray(res) ? res : (res.data ?? []);
        },

        fetchScopedMerge: async params => {
          set(s => {
            s.isRefreshing = true;
            s.error = null;
          });
          try {
            const rows = await get().fetchScoped(params);
            set(s => {
              const byId = new Map(s.items.map(a => [a._id, a]));
              for (const a of rows) byId.set(a._id, a);
              s.items = [...byId.values()];
              s.isRefreshing = false;
            });
          } catch (e) {
            set(s => {
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
            const app = await getJson<Application>(`/ats/applications/${id}`);
            set(s => {
              s.detail[id] = app;
              s.loading = false;
            });
          } catch (e) {
            set(s => {
              s.loading = false;
              s.error = (e as Error).message;
            });
          }
        },

        approve: id => transition(id, 'approve', {}),

        moveStage: (id, stageId) => transition(id, 'stage', { stageId }, false),

        hire: id => transition(id, 'hire', {}, false),

        reject: (id, payload) =>
          transition(id, 'reject', {
            reason: payload?.reason ?? undefined,
            rejectionReasonId: payload?.rejectionReasonId ?? undefined,
            destination: payload?.destination ?? undefined,
            internalNotes: payload?.internalNotes ?? undefined,
          }),

        moveToTalentPool: (id, notes) =>
          transition(id, 'move-to-talent-pool', { notes: notes ?? undefined }),

        updateNotes: (id, notes) => transition(id, 'notes', { notes }, false),

        remove: async id => {
          await mutate(
            () => deleteJson(`/ats/applications/${id}`),
            s => {
              s.items = s.items.filter(x => x._id !== id);
              delete s.detail[id];
            }
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

        _patch: app => set(s => applyApplicationPatch(s, app)),

        _remove: id =>
          set(s => {
            s.items = s.items.filter(x => x._id !== id);
            delete s.detail[id];
          }),

        _removeByJobId: jobId =>
          set(s => {
            s.items = s.items.filter(x => x.jobId !== jobId);
          }),

        _removeByCandidateId: candidateId =>
          set(s => {
            s.items = s.items.filter(x => x.candidateId !== candidateId);
          }),

        _removeByClientId: clientId =>
          set(s => {
            s.items = s.items.filter(x => x.clientId !== clientId);
          }),
      };
    }),
    {
      name: 'ats-applications',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
