import { deleteJson, getJson, patchJson, postJson } from '@/lib/api-client';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { CreateTagDto, Tag, UpdateTagDto } from '../types';
import { useBootStore } from './boot.store';

interface TagState {
  items: Tag[];
  loading: boolean;
  isRefreshing: boolean;
  mutating: boolean;
  error: string | null;
}

interface TagActions {
  fetch: () => Promise<void>;
  create: (data: CreateTagDto) => Promise<Tag>;
  update: (id: string, data: UpdateTagDto) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reset: () => void;
  _patch: (tag: Tag) => void;
  _remove: (id: string) => void;
}

const initialState: TagState = {
  items: [],
  loading: false,
  isRefreshing: false,
  mutating: false,
  error: null,
};

export const useTagStore = create<TagState & TagActions>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      fetch: async () => {
        // No-op after boot — all data is already client-side.
        if (useBootStore.getState().isBooted && get().items.length > 0) return;

        const hasData = get().items.length > 0;
        set(s => {
          if (hasData) s.isRefreshing = true;
          else s.loading = true;
          s.error = null;
        });
        try {
          const data = await getJson<Tag[]>('/ats/tags');
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
          const tag = await postJson<Tag>('/ats/tags', data);
          set(s => {
            const idx = s.items.findIndex(t => t._id === tag._id);
            if (idx !== -1) s.items[idx] = tag;
            else s.items.push(tag);
            s.mutating = false;
          });
          return tag;
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
          const tag = await patchJson<Tag>(`/ats/tags/${id}`, data);
          set(s => {
            const idx = s.items.findIndex(t => t._id === id);
            if (idx !== -1) s.items[idx] = tag;
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
          await deleteJson(`/ats/tags/${id}`);
          set(s => {
            s.items = s.items.filter(t => t._id !== id);
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

      reset: () =>
        set(s => {
          Object.assign(s, initialState);
        }),

      _patch: tag =>
        set(s => {
          const idx = s.items.findIndex(t => t._id === tag._id);
          if (idx !== -1) s.items[idx] = tag;
          else s.items.push(tag);
        }),

      _remove: id =>
        set(s => {
          s.items = s.items.filter(t => t._id !== id);
        }),
    })),
    {
      name: 'ats-tags',
      storage: createJSONStorage(() => localStorage),
      partialize: s => ({ items: s.items }),
    }
  )
);
