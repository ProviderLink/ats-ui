import {
  deleteJson,
  getJson,
  patchJson,
  postForm,
  postJson,
} from '@/lib/api-client';
import { isValidObjectId } from '@/lib/utils';
import { toast } from 'sonner';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  CreateUserDto,
  UpdateUserDto,
  User,
  UserFilters,
  UserPermissions,
} from '../types';
import { useAuthStore } from './auth.store';
import { useBootStore } from './boot.store';

interface UserState {
  items: User[];
  loading: boolean;
  isRefreshing: boolean;
  mutating: boolean;
  error: string | null;
}

interface UserActions {
  fetch: (params?: UserFilters) => Promise<void>;
  create: (data: CreateUserDto) => Promise<User>;
  update: (id: string, data: UpdateUserDto) => Promise<void>;
  updateMe: (data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }) => Promise<User>;
  uploadAvatar: (file: File) => Promise<User>;
  remove: (id: string) => Promise<void>;
  updatePermissions: (
    id: string,
    permissions: UserPermissions
  ) => Promise<void>;
  reset: () => void;
  _patch: (user: User) => void;
  _remove: (id: string) => void;
}

const initialState: UserState = {
  items: [],
  loading: false,
  isRefreshing: false,
  mutating: false,
  error: null,
};

export const useUserStore = create<UserState & UserActions>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      fetch: async params => {
        // No-op after boot — all data is already client-side.
        if (useBootStore.getState().isBooted && get().items.length > 0) return;

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

      create: async data => {
        set(s => {
          s.mutating = true;
          s.error = null;
        });
        try {
          const inviter = useAuthStore.getState().user;
          const payload = {
            ...data,
            invitedBy: inviter
              ? {
                  firstName: inviter.firstName,
                  lastName: inviter.lastName,
                }
              : undefined,
          };
          const apiUser = await postJson<User>('/shared/users', payload);
          const user: User = {
            ...apiUser,
            roles: apiUser.roles ?? data.roles ?? [],
            appAccess: apiUser.appAccess ?? data.appAccess ?? [],
          };
          set(s => {
            const idx = s.items.findIndex(x => x._id === user._id);
            if (idx !== -1) s.items[idx] = user;
            else s.items.push(user);
            s.mutating = false;
          });
          return user;
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
          if (!isValidObjectId(id)) {
            throw new Error(
              'Cannot update this member — their invitation is still pending. They must accept the invite before edits can be made.'
            );
          }
          const user = await patchJson<User>(`/shared/users/${id}`, data);
          set(s => {
            const idx = s.items.findIndex(x => x._id === id);
            if (idx !== -1) s.items[idx] = user;
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

      updateMe: async data => {
        set(s => {
          s.mutating = true;
          s.error = null;
        });
        try {
          const user = await patchJson<User>('/shared/users/me', data);
          set(s => {
            const idx = s.items.findIndex(x => x._id === user._id);
            if (idx !== -1) s.items[idx] = user;
            s.mutating = false;
          });
          return user;
        } catch (e) {
          set(s => {
            s.mutating = false;
            s.error = (e as Error).message;
          });
          throw e;
        }
      },

      uploadAvatar: async file => {
        set(s => {
          s.mutating = true;
          s.error = null;
        });
        try {
          const formData = new FormData();
          formData.append('file', file);
          const user = await postForm<User>(
            '/shared/users/me/avatar',
            formData
          );
          set(s => {
            const idx = s.items.findIndex(x => x._id === user._id);
            if (idx !== -1) s.items[idx] = user;
            s.mutating = false;
          });
          return user;
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
          if (!isValidObjectId(id)) {
            throw new Error(
              'Cannot remove this member — their invitation is still pending.'
            );
          }
          await deleteJson(`/shared/users/${id}`);
          set(s => {
            s.items = s.items.filter(x => x._id !== id);
            s.mutating = false;
          });
          toast.success('Team member removed');
        } catch (e) {
          set(s => {
            s.mutating = false;
            s.error = (e as Error).message;
          });
          toast.error((e as Error).message);
          throw e;
        }
      },

      updatePermissions: async (id, permissions) => {
        set(s => {
          s.mutating = true;
        });
        try {
          if (!isValidObjectId(id)) {
            throw new Error(
              "Cannot update permissions — this member's invitation is still pending."
            );
          }
          const user = await patchJson<User>(
            `/shared/users/${id}/permissions`,
            {
              permissions,
            }
          );
          set(s => {
            const idx = s.items.findIndex(x => x._id === id);
            if (idx !== -1) s.items[idx] = user;
            s.mutating = false;
          });
          toast.success('Permissions updated');
        } catch (e) {
          set(s => {
            s.mutating = false;
            s.error = (e as Error).message;
          });
          toast.error((e as Error).message);
          throw e;
        }
      },

      reset: () =>
        set(s => {
          Object.assign(s, initialState);
        }),

      _patch: user =>
        set(s => {
          const idx = s.items.findIndex(x => x._id === user._id);
          if (idx !== -1) s.items[idx] = user;
          else s.items.push(user);
        }),

      _remove: id =>
        set(s => {
          s.items = s.items.filter(x => x._id !== id);
        }),
    })),
    {
      name: 'ats-users',
      storage: createJSONStorage(() => localStorage),
      partialize: s => ({ items: s.items }),
    }
  )
);
