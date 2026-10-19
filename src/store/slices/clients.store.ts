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
import type { Client, ClientFilters, ClientNote, Pagination } from '../types';
import { useApplicationStore } from './applications.store';
import { canSkipFetch } from './boot.store';
import {
  normalizeClient,
  replaceClient,
  toClient,
  unwrap,
} from './clients.store.helpers';
import type { ClientActions, ClientState } from './clients.store.types';
import { useJobStore } from './jobs.store';
import { createMutate } from './mutation';

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

export const useClientStore = create<ClientState & ClientActions>()(
  persist(
    immer((set, get) => {
      const mutate = createMutate<ClientState>(set);

      return {
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
            canSkipFetch() &&
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

        create: data =>
          mutate(
            async () =>
              toClient(
                await postJson<Client | { data: Client }>('/ats/clients', data)
              ),
            (s, client) => {
              const idx = s.items.findIndex(x => x._id === client._id);
              if (idx !== -1) s.items[idx] = client;
              else s.items.unshift(client);
            }
          ),

        update: async (id, data) => {
          await mutate(
            async () =>
              toClient(
                await patchJson<Client | { data: Client }>(
                  `/ats/clients/${id}`,
                  data
                )
              ),
            (s, client) => replaceClient(s, id, client)
          );
        },

        remove: async id => {
          await mutate(
            () => deleteJson(`/ats/clients/${id}`),
            s => {
              s.items = s.items.filter(x => x._id !== id);
              delete s.detail[id];
            }
          );
          useJobStore.getState()._removeByClientId(id);
          useApplicationStore.getState()._removeByClientId(id);
        },

        uploadLogo: async (id, file) => {
          const fd = new FormData();
          fd.append('file', file);
          const client = toClient(
            await postForm<Client | { data: Client }>(
              `/ats/clients/${id}/logo`,
              fd
            )
          );
          set(s => replaceClient(s, id, client));
        },

        addContact: async (id, data) => {
          await mutate(
            async () =>
              toClient(
                await postJson<Client | { data: Client }>(
                  `/ats/clients/${id}/contacts`,
                  data
                )
              ),
            (s, client) => replaceClient(s, id, client),
            false
          );
        },

        updateContact: async (id, contactId, data) => {
          await mutate(
            async () =>
              toClient(
                await patchJson<Client | { data: Client }>(
                  `/ats/clients/${id}/contacts/${contactId}`,
                  data
                )
              ),
            (s, client) => replaceClient(s, id, client),
            false
          );
        },

        removeContact: async (id, contactId) => {
          await mutate(
            async () =>
              toClient(
                await deleteJson<Client | { data: Client }>(
                  `/ats/clients/${id}/contacts/${contactId}`
                )
              ),
            (s, client) => replaceClient(s, id, client),
            false
          );
        },

        updateCrmProfile: async (id, data) => {
          await mutate(
            async () =>
              toClient(
                await patchJson<Client | { data: Client }>(
                  `/ats/clients/${id}/crm-profile`,
                  data
                )
              ),
            (s, client) => replaceClient(s, id, client),
            false
          );
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
      };
    }),
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
