import { deleteJson, getJson, patchJson, postJson } from '@/lib/api-client';
import { toast } from 'sonner';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  CreateJobDto,
  GenerateJobDraftDto,
  GeneratedJobDraft,
  Job,
  JobFilters,
  JobStatus,
  Pagination,
  UpdateJobDto,
} from '../types';
import { useApplicationStore } from './applications.store';
import { useBootStore } from './boot.store';

interface JobState {
  items: Job[];
  detail: Record<string, Job>;
  loading: boolean;
  isRefreshing: boolean;
  mutating: boolean;
  error: string | null;
  pagination: Pagination | null;
  filters: JobFilters;
}

interface JobActions {
  fetch: (params?: JobFilters) => Promise<void>;
  fetchOne: (id: string) => Promise<void>;
  create: (data: CreateJobDto) => Promise<Job>;
  update: (id: string, data: UpdateJobDto) => Promise<void>;
  /**
   * Turn a free-form brief into a structured draft. Stateless — nothing is
   * persisted and no job state is touched, so failed calls can never leave
   * the store inconsistent.
   */
  generateDraft: (data: GenerateJobDraftDto) => Promise<GeneratedJobDraft>;
  remove: (id: string) => Promise<void>;
  setStatus: (id: string, status: JobStatus) => Promise<void>;
  setPipeline: (
    id: string,
    templateId: string,
    stageMapping?: Record<string, string>
  ) => Promise<void>;
  setFilters: (f: Partial<JobFilters>) => void;
  reset: () => void;
  _patch: (job: Job) => void;
  _remove: (id: string) => void;
  _removeByClientId: (clientId: string) => void;
}

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

export const useJobStore = create<JobState & JobActions>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      fetch: async params => {
        // No-op after boot — all data is already client-side.
        if (useBootStore.getState().isBooted && get().items.length > 0) return;

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

      create: async data => {
        set(s => {
          s.mutating = true;
          s.error = null;
        });
        try {
          const job = await postJson<Job>('/ats/jobs', data);
          set(s => {
            const idx = s.items.findIndex(x => x._id === job._id);
            if (idx !== -1) s.items[idx] = job;
            else s.items.unshift(job);
            s.mutating = false;
          });
          return job;
        } catch (e) {
          set(s => {
            s.mutating = false;
            s.error = (e as Error).message;
          });
          throw e;
        }
      },

      update: async (id, data) => {
        set(s => {
          s.mutating = true;
          s.error = null;
        });
        try {
          const job = await patchJson<Job>(`/ats/jobs/${id}`, data);
          set(s => {
            const idx = s.items.findIndex(x => x._id === id);
            if (idx !== -1) s.items[idx] = job;
            if (s.detail[id]) s.detail[id] = job;
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
          await deleteJson(`/ats/jobs/${id}`);
          set(s => {
            s.items = s.items.filter(x => x._id !== id);
            delete s.detail[id];
            s.mutating = false;
          });
          useApplicationStore.getState()._removeByJobId(id);
          toast.success('Job deleted');
        } catch (e) {
          set(s => {
            s.mutating = false;
            s.error = (e as Error).message;
          });
          toast.error((e as Error).message);
          throw e;
        }
      },

      setStatus: async (id, status) => {
        set(s => {
          s.mutating = true;
        });
        try {
          const job = await patchJson<Job>(`/ats/jobs/${id}/status`, {
            status,
          });
          set(s => {
            const idx = s.items.findIndex(x => x._id === id);
            if (idx !== -1) s.items[idx] = job;
            if (s.detail[id]) s.detail[id] = job;
            s.mutating = false;
          });
          const label =
            status === 'open'
              ? 'Job opened'
              : status === 'closed'
                ? 'Job closed'
                : status === 'on_hold'
                  ? 'Job put on hold'
                  : 'Job status updated';
          toast.success(label);
        } catch (e) {
          set(s => {
            s.mutating = false;
            s.error = (e as Error).message;
          });
          toast.error((e as Error).message);
          throw e;
        }
      },

      setPipeline: async (id, templateId, stageMapping) => {
        set(s => {
          s.mutating = true;
        });
        try {
          const body: Record<string, unknown> = { templateId };
          if (stageMapping) body.stageMapping = stageMapping;
          const job = await patchJson<Job>(`/ats/jobs/${id}/pipeline`, body);
          set(s => {
            const idx = s.items.findIndex(x => x._id === id);
            if (idx !== -1) s.items[idx] = job;
            if (s.detail[id]) s.detail[id] = job;
            s.mutating = false;
          });
          toast.success('Pipeline assigned');
        } catch (e) {
          set(s => {
            s.mutating = false;
            s.error = (e as Error).message;
          });
          toast.error((e as Error).message);
          throw e;
        }
      },

      generateDraft: async data => {
        return postJson<GeneratedJobDraft>('/ats/jobs/generate-draft', data);
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
          const idx = s.items.findIndex(x => x._id === job._id);
          if (idx !== -1) s.items[idx] = job;
          else s.items.unshift(job);
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
    })),
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
