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
  _removeByCandidateId: (candidateId: string) => void;
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

type EmailPage = { data: Email[] } & Pagination;

// Pages already fetched, so paging back and forth or switching tabs is instant.
// Dropped whenever anything about emails changes (own actions or live events).
const PAGE_FRESH_MS = 15_000;
const MAX_PAGES = 40;
const emailPageCache = new Map<string, { res: EmailPage; at: number }>();
const emailKey = (f: EmailFilters) => JSON.stringify(f);

// Bumped on every clear so a request that started before a change cannot
// put its (now outdated) page back into the cache.
let emailGen = 0;
function clearEmailPages() {
  emailGen++;
  emailPageCache.clear();
}

function rememberEmailPage(key: string, res: EmailPage, gen = emailGen) {
  if (gen !== emailGen) return;
  emailPageCache.delete(key);
  emailPageCache.set(key, { res, at: Date.now() });
  if (emailPageCache.size > MAX_PAGES) {
    const oldest = emailPageCache.keys().next().value;
    if (oldest !== undefined) emailPageCache.delete(oldest);
  }
}

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
          // Previously omitted, so the composer's search box re-fetched the
          // SAME page on every keystroke while the list labelled the result
          // "found" — a filter that was never sent. `EmailFilters` already
          // declared this field; it was simply dropped by the whitelist.
          search: params?.search,
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
        const key = emailKey(filters);
        const apply = (res: EmailPage) =>
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
        const cached = emailPageCache.get(key);
        if (cached && Date.now() - cached.at < PAGE_FRESH_MS) {
          apply(cached.res);
          return;
        }
        const gen = emailGen;
        try {
          const res = await getJson<EmailPage>(
            '/ats/emails',
            filters as Record<string, unknown>
          );
          rememberEmailPage(key, res, gen);
          apply(res);
          // Fetch the next page ahead of time so "next" is instant.
          if (res.page < res.totalPages) {
            const nextFilters = { ...filters, page: res.page + 1 };
            const nextKey = emailKey(nextFilters);
            if (!emailPageCache.has(nextKey)) {
              void getJson<EmailPage>(
                '/ats/emails',
                nextFilters as Record<string, unknown>
              )
                .then(next => rememberEmailPage(nextKey, next, gen))
                .catch(() => undefined);
            }
          }
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
        clearEmailPages();
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
        clearEmailPages();
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
        clearEmailPages();
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
        clearEmailPages();
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

      reset: () => {
        clearEmailPages();
        set(s => {
          Object.assign(s, initialState);
        });
      },

      _patch: email => {
        clearEmailPages();
        set(s => {
          const idx = s.items.findIndex(x => x._id === email._id);
          if (idx !== -1) s.items[idx] = email;
          else s.items.unshift(email);
          if (s.detail[email._id]) s.detail[email._id] = email;
        });
      },

      _removeByCandidateId: candidateId => {
        clearEmailPages();
        set(s => {
          s.items = s.items.filter(x => x.context?.candidateId !== candidateId);
          for (const id of Object.keys(s.detail)) {
            if (s.detail[id].context?.candidateId === candidateId)
              delete s.detail[id];
          }
        });
      },
    })),
    {
      name: 'ats-emails',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
