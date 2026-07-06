import {
  deleteJson,
  getJson,
  patchJson,
  postForm,
  postJson,
} from '@/lib/api-client';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  Email,
  EmailAttachment,
  EmailFilters,
  Pagination,
  SendEmailDto,
} from '../types';

interface EmailState {
  items: Email[];
  detail: Record<string, Email>;
  loading: boolean;
  isRefreshing: boolean;
  mutating: boolean;
  uploading: boolean;
  error: string | null;
  pagination: Pagination | null;
  filters: EmailFilters;
}

interface EmailActions {
  fetch: (params?: EmailFilters) => Promise<void>;
  fetchOne: (id: string) => Promise<void>;
  fetchThread: (threadId: string) => Promise<Email[]>;
  send: (data: SendEmailDto) => Promise<Email>;
  resend: (id: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  uploadAttachment: (file: File) => Promise<EmailAttachment>;
  setFilters: (f: Partial<EmailFilters>) => void;
  reset: () => void;
  _patch: (email: Email) => void;
}

const initialState: EmailState = {
  items: [],
  detail: {},
  loading: false,
  isRefreshing: false,
  mutating: false,
  uploading: false,
  error: null,
  pagination: null,
  filters: { page: 1, limit: 20 },
};

export const useEmailStore = create<EmailState & EmailActions>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      fetch: async params => {
        // Emails keep server-side pagination (can be very large).
        // Only skip if boot is done AND we're not asking for a different page than we have.
        // We still allow fetch to proceed for pagination/tab changes.

        // Params are authoritative — don't silently inherit stale
        // direction/status/etc. from a previous fetch.
        const base = get().filters;
        const filters: EmailFilters = {
          page: params?.page ?? base.page,
          limit: params?.limit ?? base.limit,
          candidateId: params?.candidateId,
          jobId: params?.jobId,
          applicationId: params?.applicationId,
          status: params?.status,
          direction: params?.direction,
          threadId: params?.threadId,
        };
        const hasData = get().items.length > 0;
        // When the tab/direction/status filter changes, treat it as a fresh
        // load so the list shows a skeleton instead of stale data from the
        // previous tab.
        const filterChanged =
          (params?.direction !== undefined &&
            params.direction !== base.direction) ||
          (params?.status !== undefined && params.status !== base.status);
        set(s => {
          if (hasData && !filterChanged) s.isRefreshing = true;
          else s.loading = true;
          s.error = null;
          if (params) s.filters = filters;
        });
        try {
          const res = await getJson<{ data: Email[] } & Pagination>(
            '/ats/emails',
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
          const email = await getJson<Email>(`/ats/emails/${id}`);
          set(s => {
            s.detail[id] = email;
            s.loading = false;
          });
        } catch (e) {
          set(s => {
            s.loading = false;
            s.error = (e as Error).message;
          });
        }
      },

      fetchThread: async threadId => {
        set(s => {
          s.loading = true;
        });
        try {
          const emails = await getJson<Email[]>(
            `/ats/emails/thread/${threadId}`
          );
          set(s => {
            s.loading = false;
          });
          return emails;
        } catch (e) {
          set(s => {
            s.loading = false;
            s.error = (e as Error).message;
          });
          return [];
        }
      },

      send: async data => {
        set(s => {
          s.mutating = true;
          s.error = null;
        });
        try {
          const email = await postJson<Email>('/ats/emails', data);
          set(s => {
            const idx = s.items.findIndex(x => x._id === email._id);
            if (idx !== -1) s.items[idx] = email;
            else s.items.unshift(email);
            s.mutating = false;
          });
          return email;
        } catch (e) {
          set(s => {
            s.mutating = false;
            s.error = (e as Error).message;
          });
          throw e;
        }
      },

      resend: async id => {
        set(s => {
          s.mutating = true;
        });
        try {
          await postJson(`/ats/emails/${id}/resend`, {});
          set(s => {
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

      markAsRead: async id => {
        try {
          await patchJson(`/ats/emails/${id}/read`, {});
          set(s => {
            const item = s.items.find(x => x._id === id);
            if (item) item.isRead = true;
            if (s.detail[id]) s.detail[id].isRead = true;
          });
        } catch {
          // fire-and-forget — don't block UX
        }
      },

      remove: async id => {
        set(s => {
          s.mutating = true;
          s.error = null;
        });
        try {
          await deleteJson(`/ats/emails/${id}`);
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

      uploadAttachment: async file => {
        set(s => {
          s.uploading = true;
          s.error = null;
        });
        try {
          const fd = new FormData();
          fd.append('file', file);
          const att = await postForm<EmailAttachment>(
            '/ats/emails/attachments',
            fd
          );
          set(s => {
            s.uploading = false;
          });
          return att;
        } catch (e) {
          set(s => {
            s.uploading = false;
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

      _patch: email =>
        set(s => {
          const idx = s.items.findIndex(x => x._id === email._id);
          if (idx !== -1) s.items[idx] = email;
          else s.items.unshift(email);
          if (s.detail[email._id]) s.detail[email._id] = email;
        }),
    })),
    {
      name: 'ats-emails',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
