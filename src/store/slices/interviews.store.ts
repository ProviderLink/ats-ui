import { deleteJson, getJson, patchJson, postJson } from '@/lib/api-client';
import { toast } from 'sonner';
import { create } from 'zustand';

import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  CreateFeedbackDto,
  CreateInterviewDto,
  CreateNestedInterviewDto,
  Interview,
  InterviewFilters,
  Pagination,
  UpdateInterviewDto,
} from '../types';
import { useBootStore } from './boot.store';

interface InterviewState {
  items: Interview[];
  detail: Record<string, Interview>;
  loading: boolean;
  isRefreshing: boolean;
  mutating: boolean;
  error: string | null;
  pagination: Pagination | null;
  filters: InterviewFilters;
}

interface InterviewActions {
  fetch: (params?: InterviewFilters) => Promise<void>;
  fetchOne: (id: string) => Promise<void>;
  refresh: (params?: InterviewFilters) => Promise<void>;
  fetchByApplication: (
    applicationId: string,
    params?: InterviewFilters
  ) => Promise<void>;
  create: (data: CreateInterviewDto) => Promise<Interview>;
  createForApplication: (
    applicationId: string,
    data: CreateNestedInterviewDto
  ) => Promise<Interview>;
  update: (
    id: string,
    data: UpdateInterviewDto,
    applicationId?: string
  ) => Promise<void>;
  cancel: (id: string, applicationId?: string) => Promise<void>;
  submitFeedback: (
    id: string,
    data: CreateFeedbackDto,
    applicationId?: string
  ) => Promise<void>;
  completeAndFeedback: (
    id: string,
    data: CreateFeedbackDto,
    applicationId?: string
  ) => Promise<void>;
  setFilters: (f: Partial<InterviewFilters>) => void;
  reset: () => void;
  _patch: (interview: Interview) => void;
  _remove: (id: string) => void;
}

const initialState: InterviewState = {
  items: [],
  detail: {},
  loading: false,
  isRefreshing: false,
  mutating: false,
  error: null,
  pagination: null,
  filters: { page: 1, limit: 20 },
};

export const useInterviewStore = create<InterviewState & InterviewActions>()(
  persist(
    immer((set, get) => ({
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
          !hasExplicitFilter
        )
          return;

        await get().refresh(params);
      },

      refresh: async params => {
        const filters = { ...get().filters, ...params };
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
          if (params) s.filters = { ...s.filters, ...params };
        });
        try {
          const res = await getJson<{ data: Interview[] } & Pagination>(
            '/ats/interviews',
            filters as Record<string, unknown>
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
            s.items = res.data;
            s.pagination = {
              total: res.total,
              page: res.page,
              limit: res.limit,
              totalPages: res.totalPages,
            };
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
          const interview = await postJson<Interview>('/ats/interviews', data);
          set(s => {
            const idx = s.items.findIndex(x => x._id === interview._id);
            if (idx !== -1) s.items[idx] = interview;
            else s.items.unshift(interview);
            s.mutating = false;
          });
          toast.success('Interview scheduled — invitations sent');
          return interview;
        } catch (e) {
          set(s => {
            s.mutating = false;
            s.error = (e as Error).message;
          });
          toast.error((e as Error).message);
          throw e;
        }
      },

      createForApplication: async (applicationId, data) => {
        set(s => {
          s.mutating = true;
          s.error = null;
        });
        try {
          const interview = await postJson<Interview>(
            `/ats/applications/${applicationId}/interviews`,
            data
          );
          set(s => {
            const idx = s.items.findIndex(x => x._id === interview._id);
            if (idx !== -1) s.items[idx] = interview;
            else s.items.unshift(interview);
            s.mutating = false;
          });
          toast.success('Interview scheduled — invitations sent');
          return interview;
        } catch (e) {
          set(s => {
            s.mutating = false;
            s.error = (e as Error).message;
          });
          toast.error((e as Error).message);
          throw e;
        }
      },

      update: async (id, data, applicationId) => {
        const baseUrl = applicationId
          ? `/ats/applications/${applicationId}/interviews/${id}`
          : `/ats/interviews/${id}`;
        set(s => {
          s.mutating = true;
          s.error = null;
        });
        try {
          const interview = await patchJson<Interview>(baseUrl, data);
          set(s => {
            const idx = s.items.findIndex(x => x._id === id);
            if (idx !== -1) s.items[idx] = interview;
            if (s.detail[id]) s.detail[id] = interview;
            s.mutating = false;
          });
          toast.success('Interview updated — notifications sent');
        } catch (e) {
          set(s => {
            s.mutating = false;
            s.error = (e as Error).message;
          });
          toast.error((e as Error).message);
          throw e;
        }
      },

      cancel: async (id, applicationId) => {
        const baseUrl = applicationId
          ? `/ats/applications/${applicationId}/interviews/${id}`
          : `/ats/interviews/${id}`;
        set(s => {
          s.mutating = true;
        });
        try {
          await deleteJson(baseUrl);
          set(s => {
            const idx = s.items.findIndex(x => x._id === id);
            if (idx !== -1) s.items[idx].status = 'cancelled';
            if (s.detail[id]) s.detail[id].status = 'cancelled';
            s.mutating = false;
          });
          toast.success('Interview cancelled — notifications sent');
        } catch (e) {
          set(s => {
            s.mutating = false;
            s.error = (e as Error).message;
          });
          toast.error((e as Error).message);
          throw e;
        }
      },

      submitFeedback: async (id, data, applicationId) => {
        const baseUrl = applicationId
          ? `/ats/applications/${applicationId}/interviews/${id}/feedback`
          : `/ats/interviews/${id}/feedback`;
        set(s => {
          s.mutating = true;
        });
        try {
          const interview = await postJson<Interview>(baseUrl, data);
          set(s => {
            const idx = s.items.findIndex(x => x._id === id);
            if (idx !== -1) s.items[idx] = interview;
            if (s.detail[id]) s.detail[id] = interview;
            s.mutating = false;
          });
          toast.success('Feedback submitted');
        } catch (e) {
          set(s => {
            s.mutating = false;
            s.error = (e as Error).message;
          });
          toast.error((e as Error).message);
          throw e;
        }
      },

      completeAndFeedback: async (id, data, applicationId) => {
        const patchUrl = applicationId
          ? `/ats/applications/${applicationId}/interviews/${id}`
          : `/ats/interviews/${id}`;
        const feedbackUrl = applicationId
          ? `/ats/applications/${applicationId}/interviews/${id}/feedback`
          : `/ats/interviews/${id}/feedback`;
        set(s => {
          s.mutating = true;
          s.error = null;
        });
        try {
          await patchJson<Interview>(patchUrl, {
            status: 'completed',
          } as UpdateInterviewDto);
          const interview = await postJson<Interview>(feedbackUrl, data);
          set(s => {
            const idx = s.items.findIndex(x => x._id === id);
            if (idx !== -1) s.items[idx] = interview;
            if (s.detail[id]) s.detail[id] = interview;
            s.mutating = false;
          });
          toast.success('Interview completed & feedback submitted');
        } catch (e) {
          set(s => {
            s.mutating = false;
            s.error = (e as Error).message;
          });
          toast.error((e as Error).message);
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

      _patch: interview =>
        set(s => {
          const idx = s.items.findIndex(x => x._id === interview._id);
          if (idx !== -1) s.items[idx] = interview;
          else s.items.unshift(interview);
          if (s.detail[interview._id]) s.detail[interview._id] = interview;
        }),

      _remove: id =>
        set(s => {
          s.items = s.items.filter(x => x._id !== id);
          delete s.detail[id];
        }),
    })),
    {
      name: 'ats-interviews',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
