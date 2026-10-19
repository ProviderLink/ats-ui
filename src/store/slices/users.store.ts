import {
  deleteJson,
  getJson,
  patchJson,
  postForm,
  postJson,
} from '@/lib/api-client';
import { isValidObjectId } from '@/lib/utils';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { User } from '../types';
import { useAuthStore } from './auth.store';
import { canSkipFetch } from './boot.store';
import { createMutate } from './mutation';
import { replaceUser, upsertUser } from './users.store.helpers';
import type { UserActions, UserState } from './users.store.types';

const initialState: UserState = {
  items: [],
  loading: false,
  isRefreshing: false,
  mutating: false,
  error: null,
};

export const useUserStore = create<UserState & UserActions>()(
  persist(
    immer((set, get) => {
      const mutate = createMutate<UserState>(set);

      return {
        ...initialState,

        fetch: async params => {
          // No-op after boot for an UNFILTERED refresh only. An explicit scoping
          // filter (e.g. `{ role }`) must still reach the server; returning early
          // made such a call silently resolve to the full list. Mirrors
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

          const hasData = get().items.length > 0;
          set(s => {
            if (hasData) s.isRefreshing = true;
            else s.loading = true;
            s.error = null;
          });
          try {
            const res = await getJson<User[] | { data: User[] }>(
              '/shared/users',
              params as Record<string, unknown>
            );
            const data = Array.isArray(res)
              ? res
              : ((res as { data: User[] }).data ?? []);
            set(s => {
              s.items = data;
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

        // `fetch` is a no-op once boot has loaded the list, so fields the server
        // changes on its own (last sign-in) went stale. These always hit the
        // server and keep the current list on failure.
        refresh: async () => {
          try {
            const res = await getJson<User[] | { data: User[] }>(
              '/shared/users'
            );
            const data = Array.isArray(res)
              ? res
              : ((res as { data: User[] }).data ?? []);
            set(s => {
              s.items = data;
            });
          } catch {
            // Keep showing what we have.
          }
        },

        refreshOne: async id => {
          if (!isValidObjectId(id)) return;
          try {
            const user = await getJson<User>(`/shared/users/${id}`);
            set(s => replaceUser(s, id, user));
          } catch {
            // Keep showing what we have.
          }
        },

        create: async data => {
          const inviter = useAuthStore.getState().user;
          const payload = {
            ...data,
            invitedBy: inviter
              ? { firstName: inviter.firstName, lastName: inviter.lastName }
              : undefined,
          };
          return mutate(
            async () => {
              const response = await postJson<{
                user: User;
                inviteToken?: string;
              }>('/shared/users', payload);
              // POST /shared/users returns { user, inviteToken } — extract the user
              const apiUser = response.user ?? (response as unknown as User);
              return {
                ...apiUser,
                roles: apiUser.roles ?? data.roles ?? [],
                appAccess: apiUser.appAccess ?? data.appAccess ?? [],
              };
            },
            (s, user) => upsertUser(s, user)
          );
        },

        update: async (id, data) => {
          await mutate(
            async () => {
              if (!isValidObjectId(id)) {
                throw new Error(
                  'Cannot update this member — their invitation is still pending. They must accept the invite before edits can be made.'
                );
              }
              return patchJson<User>(`/shared/users/${id}`, data);
            },
            (s, user) => replaceUser(s, id, user)
          );
        },

        updateMe: data =>
          mutate(
            () => patchJson<User>('/shared/users/me', data),
            (s, user) => replaceUser(s, user._id, user)
          ),

        uploadAvatar: file =>
          mutate(
            () => {
              const formData = new FormData();
              formData.append('file', file);
              return postForm<User>('/shared/users/me/avatar', formData);
            },
            (s, user) => replaceUser(s, user._id, user)
          ),

        remove: async id => {
          await mutate(
            async () => {
              if (!isValidObjectId(id)) {
                throw new Error(
                  'Cannot remove this member — their invitation is still pending.'
                );
              }
              await deleteJson(`/shared/users/${id}`);
            },
            s => {
              s.items = s.items.filter(x => x._id !== id);
            }
          );
        },

        provisionClient: clientId =>
          mutate(
            () => postJson<User>('/shared/users/provision-client', { clientId }),
            (s, user) => upsertUser(s, user)
          ),

        provisionVA: candidateId =>
          mutate(
            () => postJson<User>('/shared/users/provision-va', { candidateId }),
            (s, user) => upsertUser(s, user)
          ),

        revokeCrmAccess: userId =>
          mutate(
            () => postJson<User>(`/shared/users/${userId}/revoke-crm`, {}),
            (s, user) => replaceUser(s, userId, user)
          ),

        reset: () =>
          set(s => {
            Object.assign(s, initialState);
          }),

        _patch: user => set(s => upsertUser(s, user)),

        _remove: id =>
          set(s => {
            s.items = s.items.filter(x => x._id !== id);
          }),
      };
    }),
    {
      name: 'ats-users',
      storage: createJSONStorage(() => localStorage),
      partialize: s => ({ items: s.items }),
    }
  )
);
