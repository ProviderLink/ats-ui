import { deleteJson, getJson, patchJson } from '@/lib/api-client';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Application, ApplicationFilters, Pagination } from '../types';
import { useBootStore } from './boot.store';

interface ApplicationState {
  items: Application[];
  detail: Record<string, Application>;
  loading: boolean;
  isRefreshing: boolean;
  mutating: boolean;
  error: string | null;
  pagination: Pagination | null;
  filters: ApplicationFilters;
}

interface ApplicationActions {
  fetch: (params?: ApplicationFilters) => Promise<void>;
  /**
   * Fetch applications matching a filter WITHOUT touching `items`.
   *
   * `items` holds the full post-boot dataset that several screens read
   * (`/ats/hired`, the In Pipeline tab, the clients table). Transient callers —
   * dialogs that need one job's or one client's applications — must use this
   * instead of `fetch`, otherwise they replace the shared list with a subset
   * and those screens silently render empty.
   */
  fetchScoped: (params: ApplicationFilters) => Promise<Application[]>;
  /**
   * Fetch matching applications and UNION them into `items` by id.
   *
   * Used by sheets that need a scoped slice (one client's applications) while
   * still showing rows the shared list already holds. Never removes anything,
   * so it cannot blank out screens that depend on the full dataset.
   */
  fetchScopedMerge: (params: ApplicationFilters) => Promise<void>;
  fetchOne: (id: string) => Promise<void>;
  approve: (id: string) => Promise<void>;
  moveStage: (id: string, stageId: string) => Promise<void>;
  hire: (id: string) => Promise<void>;
  reject: (
    id: string,
    payload?: {
      reason?: string;
      rejectionReasonId?: string;
      destination?: 'candidate_pool' | 'permanently_ineligible';
      internalNotes?: string;
    }
  ) => Promise<void>;
  updateNotes: (id: string, notes: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setFilters: (f: Partial<ApplicationFilters>) => void;
  reset: () => void;
  _patch: (app: Application) => void;
  _remove: (id: string) => void;
  _removeByJobId: (jobId: string) => void;
  _removeByCandidateId: (candidateId: string) => void;
  _removeByClientId: (clientId: string) => void;
}

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
    immer((set, get) => ({
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

      approve: async id => {
        set(s => {
          s.mutating = true;
          s.error = null;
        });
        try {
          const app = await patchJson<Application>(
            `/ats/applications/${id}/approve`,
            {}
          );
          set(s => {
            const idx = s.items.findIndex(x => x._id === id);
            if (idx !== -1) s.items[idx] = app;
            if (s.detail[id]) s.detail[id] = app;
            s.mutating = false;
          });
        } catch (e) {
          set(s => {
            s.mutating = false;
            s.error = (e as Error).message;
          });
          throw e;
        }
      },

      moveStage: async (id, stageId) => {
        set(s => {
          s.mutating = true;
        });
        try {
          const app = await patchJson<Application>(
            `/ats/applications/${id}/stage`,
            { stageId }
          );
          set(s => {
            const idx = s.items.findIndex(x => x._id === id);
            if (idx !== -1) s.items[idx] = app;
            if (s.detail[id]) s.detail[id] = app;
            s.mutating = false;
          });
        } catch (e) {
          set(s => {
            s.mutating = false;
            s.error = (e as Error).message;
          });
          throw e;
        }
      },

      hire: async id => {
        set(s => {
          s.mutating = true;
        });
        try {
          const app = await patchJson<Application>(
            `/ats/applications/${id}/hire`,
            {}
          );
          set(s => {
            const idx = s.items.findIndex(x => x._id === id);
            if (idx !== -1) s.items[idx] = app;
            if (s.detail[id]) s.detail[id] = app;
            s.mutating = false;
          });
        } catch (e) {
          set(s => {
            s.mutating = false;
            s.error = (e as Error).message;
          });
          throw e;
        }
      },

      reject: async (id, payload) => {
        set(s => {
          s.mutating = true;
          s.error = null;
        });
        try {
          const app = await patchJson<Application>(
            `/ats/applications/${id}/reject`,
            {
              reason: payload?.reason ?? undefined,
              rejectionReasonId: payload?.rejectionReasonId ?? undefined,
              destination: payload?.destination ?? undefined,
              internalNotes: payload?.internalNotes ?? undefined,
            }
          );
          set(s => {
            const idx = s.items.findIndex(x => x._id === id);
            if (idx !== -1) s.items[idx] = app;
            if (s.detail[id]) s.detail[id] = app;
            s.mutating = false;
          });
        } catch (e) {
          set(s => {
            s.mutating = false;
            s.error = (e as Error).message;
          });
          throw e;
        }
      },

      updateNotes: async (id, notes) => {
        set(s => {
          s.mutating = true;
        });
        try {
          const app = await patchJson<Application>(
            `/ats/applications/${id}/notes`,
            { notes }
          );
          set(s => {
            const idx = s.items.findIndex(x => x._id === id);
            if (idx !== -1) s.items[idx] = app;
            if (s.detail[id]) s.detail[id] = app;
            s.mutating = false;
          });
        } catch (e) {
          set(s => {
            s.mutating = false;
            s.error = (e as Error).message;
          });
          throw e;
        }
      },

      remove: async id => {
        set(s => {
          s.mutating = true;
          s.error = null;
        });
        try {
          await deleteJson(`/ats/applications/${id}`);
          set(s => {
            s.items = s.items.filter(x => x._id !== id);
            delete s.detail[id];
            s.mutating = false;
          });
        } catch (e) {
          set(s => {
            s.mutating = false;
            s.error = (e as Error).message;
          });
          throw e;
        }
      },

      setFilters: f =>
        set(s => {
          s.filters = { ...s.filters, ...f };
        }),

      reset: () =>
        set(s => {
          Object.assign(s, initialState);
        }),

      _patch: app =>
        set(s => {
          // Socket updates can ship lightweight payloads (e.g. stage-only
          // moves) that omit fields the derived maps rely on (currentStage,
          // phase, hiredAt, etc.). Merge with the existing record so those
          // fields are preserved instead of being nulled out.
          //
          // candidateId / jobId / clientId are also preserved: a lightweight
          // application:updated payload (e.g. broadcast when a public apply
          // triggers related-job changes) must not null out foreign keys that
          // the candidatesInPipelineIds Set and tab counts depend on.
          const merge = <T extends Application>(prev: T): T => {
            const merged: Application = {
              ...prev,
              ...app,
              candidateId: app.candidateId ?? prev.candidateId,
              jobId: app.jobId ?? prev.jobId,
              clientId: app.clientId ?? prev.clientId,
              currentStage: app.currentStage ?? prev.currentStage,
              phase: app.phase ?? prev.phase,
              hiredAt: app.hiredAt ?? prev.hiredAt,
              hiredBy: app.hiredBy ?? prev.hiredBy,
              rejectionReason: app.rejectionReason ?? prev.rejectionReason,
              closedAt: app.closedAt ?? prev.closedAt,
              dispositionDate: app.dispositionDate ?? prev.dispositionDate,
              dispositionReasonId:
                app.dispositionReasonId ?? prev.dispositionReasonId,
              dispositionDestination:
                app.dispositionDestination ?? prev.dispositionDestination,
              isBlocked: app.isBlocked ?? prev.isBlocked,
            };
            return merged as T;
          };
          const idx = s.items.findIndex(x => x._id === app._id);
          if (idx !== -1) s.items[idx] = merge(s.items[idx]);
          else s.items.unshift(app);
          if (s.detail[app._id]) s.detail[app._id] = merge(s.detail[app._id]);
        }),

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
    })),
    {
      name: 'ats-applications',
      storage: createJSONStorage(() => localStorage),
      partialize: () => ({}),
      version: 1,
      migrate: () => ({}),
    }
  )
);
