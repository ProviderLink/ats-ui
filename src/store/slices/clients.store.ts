import {
  deleteJson,
  getJson,
  patchJson,
  postForm,
  postJson,
} from '@/lib/api-client';
import { toast } from 'sonner';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  Client,
  ClientCrmProfile,
  ClientFilters,
  ClientNote,
  CreateClientDto,
  CreateContactDto,
  CreateNoteDto,
  Pagination,
  UpdateClientDto,
  UpdateContactDto,
  UpdateNoteDto,
} from '../types';
import { CompanySize } from '../types/enums';
import { useApplicationStore } from './applications.store';
import { useBootStore } from './boot.store';
import { useJobStore } from './jobs.store';

interface ClientState {
  items: Client[];
  detail: Record<string, Client>;
  notes: Record<string, ClientNote[]>;
  loading: boolean;
  isRefreshing: boolean;
  notesLoading: boolean;
  mutating: boolean;
  error: string | null;
  pagination: Pagination | null;
  filters: ClientFilters;
}

interface ClientActions {
  fetch: (params?: ClientFilters) => Promise<void>;
  fetchOne: (id: string) => Promise<void>;
  create: (data: CreateClientDto) => Promise<Client>;
  update: (id: string, data: UpdateClientDto) => Promise<void>;
  remove: (id: string) => Promise<void>;
  uploadLogo: (id: string, file: File) => Promise<void>;
  addContact: (id: string, data: CreateContactDto) => Promise<void>;
  updateContact: (
    id: string,
    contactId: string,
    data: UpdateContactDto
  ) => Promise<void>;
  removeContact: (id: string, contactId: string) => Promise<void>;
  updateCrmProfile: (
    id: string,
    data: Partial<ClientCrmProfile>
  ) => Promise<void>;
  setFilters: (f: Partial<ClientFilters>) => void;
  fetchNotes: (clientId: string) => Promise<void>;
  addNote: (clientId: string, data: CreateNoteDto) => Promise<void>;
  updateNote: (
    clientId: string,
    noteId: string,
    data: UpdateNoteDto
  ) => Promise<void>;
  deleteNote: (clientId: string, noteId: string) => Promise<void>;
  reset: () => void;
  _patch: (client: Client) => void;
  _remove: (id: string) => void;
}

const initialState: ClientState = {
  items: [],
  detail: {},
  notes: {},
  loading: false,
  isRefreshing: false,
  notesLoading: false,
  mutating: false,
  error: null,
  pagination: null,
  filters: { page: 1, limit: 10 },
};

const VALID_COMPANY_SIZES = Object.values(CompanySize) as string[];

/** Unwrap envelope responses like { data: T } — returns T directly. */
function unwrap<T>(res: T | { data: T }): T {
  if (res && typeof res === 'object' && 'data' in res && !('_id' in res)) {
    return (res as { data: T }).data;
  }
  return res as T;
}

/** Normalize known bad companySize values from the backend. */
function normalizeClient(c: Client): Client {
  if (c.companySize && !VALID_COMPANY_SIZES.includes(c.companySize)) {
    if ((c.companySize as string) === '1-50')
      return { ...c, companySize: '11-50' };
  }
  return c;
}

export const useClientStore = create<ClientState & ClientActions>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      fetch: async params => {
        // No-op after boot for an UNFILTERED refresh only. An explicit scoping
        // filter (e.g. `{ status }`) must still reach the server; returning
        // early made such a call silently resolve to the full list. Mirrors
        // `hasExplicitFilter` in `candidates.store.ts`.
        const hasExplicitFilter =
          params &&
          Object.keys(params).some(k => {
            if (k === 'page' || k === 'limit') return false;
            return (params as Record<string, unknown>)[k] !== undefined;
          });
        if (
          useBootStore.getState().isBooted &&
          get().items.length > 0 &&
          !hasExplicitFilter
        )
          return;

        // Params are authoritative — don't inherit stale status/search.
        const base = get().filters;
        const filters: ClientFilters = {
          page: params?.page ?? base.page,
          limit: params?.limit ?? base.limit,
          status: params?.status,
          search: params?.search,
        };
        const hasData = get().items.length > 0;
        // When the status filter changes, treat it as a fresh load so the
        // table shows a skeleton instead of stale data from the old filter.
        const filterChanged =
          params?.status !== undefined && params.status !== base.status;
        set(s => {
          if (hasData && !filterChanged) s.isRefreshing = true;
          else s.loading = true;
          s.error = null;
          if (params) s.filters = filters;
        });
        try {
          const res = await getJson<
            Client[] | ({ data: Client[] } & Pagination)
          >('/ats/clients', filters as Record<string, unknown>);
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
            s.items = data.map(normalizeClient);
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
          const client = normalizeClient(
            unwrap(
              await getJson<Client | { data: Client }>(`/ats/clients/${id}`)
            )
          );
          set(s => {
            s.detail[id] = client;
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
          const client = normalizeClient(
            unwrap(
              await postJson<Client | { data: Client }>('/ats/clients', data)
            )
          );
          set(s => {
            const idx = s.items.findIndex(x => x._id === client._id);
            if (idx !== -1) s.items[idx] = client;
            else s.items.unshift(client);
            s.mutating = false;
          });
          return client;
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
          const client = normalizeClient(
            unwrap(
              await patchJson<Client | { data: Client }>(
                `/ats/clients/${id}`,
                data
              )
            )
          );
          set(s => {
            const idx = s.items.findIndex(x => x._id === id);
            if (idx !== -1) s.items[idx] = client;
            if (s.detail[id]) s.detail[id] = client;
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
          await deleteJson(`/ats/clients/${id}`);
          set(s => {
            s.items = s.items.filter(x => x._id !== id);
            delete s.detail[id];
            s.mutating = false;
          });
          useJobStore.getState()._removeByClientId(id);
          useApplicationStore.getState()._removeByClientId(id);
        } catch (e) {
          set(s => {
            s.mutating = false;
            s.error = (e as Error).message;
          });
          throw e;
        }
      },

      uploadLogo: async (id, file) => {
        const fd = new FormData();
        fd.append('file', file);
        try {
          const client = normalizeClient(
            unwrap(
              await postForm<Client | { data: Client }>(
                `/ats/clients/${id}/logo`,
                fd
              )
            )
          );
          set(s => {
            const idx = s.items.findIndex(x => x._id === id);
            if (idx !== -1) s.items[idx] = client;
            if (s.detail[id]) s.detail[id] = client;
          });
          toast.success('Logo updated');
        } catch (e) {
          toast.error((e as Error).message);
          throw e;
        }
      },

      addContact: async (id, data) => {
        set(s => {
          s.mutating = true;
        });
        try {
          const client = normalizeClient(
            unwrap(
              await postJson<Client | { data: Client }>(
                `/ats/clients/${id}/contacts`,
                data
              )
            )
          );
          set(s => {
            const idx = s.items.findIndex(x => x._id === id);
            if (idx !== -1) s.items[idx] = client;
            if (s.detail[id]) s.detail[id] = client;
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

      updateContact: async (id, contactId, data) => {
        set(s => {
          s.mutating = true;
        });
        try {
          const client = normalizeClient(
            unwrap(
              await patchJson<Client | { data: Client }>(
                `/ats/clients/${id}/contacts/${contactId}`,
                data
              )
            )
          );
          set(s => {
            const idx = s.items.findIndex(x => x._id === id);
            if (idx !== -1) s.items[idx] = client;
            if (s.detail[id]) s.detail[id] = client;
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

      removeContact: async (id, contactId) => {
        set(s => {
          s.mutating = true;
        });
        try {
          const client = normalizeClient(
            unwrap(
              await deleteJson<Client | { data: Client }>(
                `/ats/clients/${id}/contacts/${contactId}`
              )
            )
          );
          set(s => {
            const idx = s.items.findIndex(x => x._id === id);
            if (idx !== -1) s.items[idx] = client;
            if (s.detail[id]) s.detail[id] = client;
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

      updateCrmProfile: async (id, data) => {
        set(s => {
          s.mutating = true;
        });
        try {
          const client = normalizeClient(
            unwrap(
              await patchJson<Client | { data: Client }>(
                `/ats/clients/${id}/crm-profile`,
                data
              )
            )
          );
          set(s => {
            const idx = s.items.findIndex(x => x._id === id);
            if (idx !== -1) s.items[idx] = client;
            if (s.detail[id]) s.detail[id] = client;
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

      fetchNotes: async clientId => {
        set(s => {
          s.notesLoading = true;
        });
        try {
          const res = await getJson<ClientNote[] | { data: ClientNote[] }>(
            `/ats/clients/${clientId}/notes`
          );
          const data = Array.isArray(res) ? res : (res.data ?? []);
          set(s => {
            s.notes[clientId] = data;
            s.notesLoading = false;
          });
        } catch {
          set(s => {
            s.notesLoading = false;
          });
        }
      },

      addNote: async (clientId, data) => {
        try {
          const note = unwrap(
            await postJson<ClientNote | { data: ClientNote }>(
              `/ats/clients/${clientId}/notes`,
              data
            )
          );
          set(s => {
            const existing = s.notes[clientId] ?? [];
            s.notes[clientId] = [note, ...existing];
          });
        } catch {
          throw new Error('Failed to add note');
        }
      },

      updateNote: async (clientId, noteId, data) => {
        try {
          const note = unwrap(
            await patchJson<ClientNote | { data: ClientNote }>(
              `/ats/clients/${clientId}/notes/${noteId}`,
              data
            )
          );
          set(s => {
            const existing = s.notes[clientId] ?? [];
            const idx = existing.findIndex(n => n._id === noteId);
            if (idx !== -1) {
              s.notes[clientId] = [
                ...existing.slice(0, idx),
                note,
                ...existing.slice(idx + 1),
              ];
            }
          });
        } catch {
          throw new Error('Failed to update note');
        }
      },

      deleteNote: async (clientId, noteId) => {
        try {
          await deleteJson(`/ats/clients/${clientId}/notes/${noteId}`);
          set(s => {
            const existing = s.notes[clientId] ?? [];
            s.notes[clientId] = existing.filter(n => n._id !== noteId);
          });
        } catch {
          throw new Error('Failed to delete note');
        }
      },

      reset: () =>
        set(s => {
          Object.assign(s, initialState);
        }),

      _patch: client => {
        const c = normalizeClient(client);
        set(s => {
          const idx = s.items.findIndex(x => x._id === c._id);
          if (idx !== -1) s.items[idx] = c;
          else s.items.unshift(c);
          if (s.detail[c._id]) s.detail[c._id] = c;
        });
      },

      _remove: id =>
        set(s => {
          s.items = s.items.filter(x => x._id !== id);
          delete s.detail[id];
        }),
    })),
    {
      name: 'ats-clients',
      storage: createJSONStorage(() => localStorage),
      partialize: s => ({
        items: s.items,
        pagination: s.pagination,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<ClientState>),
        // Prefer current (fresh from API) items over persisted (potentially stale) ones
        items:
          (current as ClientState).items.length > 0
            ? (current as ClientState).items
            : ((persisted as Partial<ClientState>).items ?? []),
      }),
    }
  )
);
