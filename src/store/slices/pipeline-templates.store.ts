import { deleteJson, getJson, patchJson, postJson } from '@/lib/api-client';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  CreatePipelineTemplateDto,
  PipelineTemplate,
  UpdatePipelineTemplateDto,
} from '../types';
import { useBootStore } from './boot.store';

interface PipelineTemplateState {
  items: PipelineTemplate[];
  loading: boolean;
  isRefreshing: boolean;
  mutating: boolean;
  error: string | null;
}

interface PipelineTemplateActions {
  fetch: () => Promise<void>;
  fetchOne: (id: string) => Promise<PipelineTemplate>;
  create: (data: CreatePipelineTemplateDto) => Promise<PipelineTemplate>;
  update: (id: string, data: UpdatePipelineTemplateDto) => Promise<void>;
  remove: (id: string) => Promise<void>;
  /**
   * Atomically switch the default template status from the existing default
   * to a new template. Backend enforces a single default via a partial unique
   * index, so we must update the existing default to `isDefault: false`
   * before setting `isDefault: true` on the new one. If the same template is
   * already the default, this is a no-op.
   */
  setAsDefault: (id: string) => Promise<void>;
  reset: () => void;
  _patch: (t: PipelineTemplate) => void;
  _remove: (id: string) => void;
}

const initialState: PipelineTemplateState = {
  items: [],
  loading: false,
  isRefreshing: false,
  mutating: false,
  error: null,
};

export const usePipelineTemplateStore = create<
  PipelineTemplateState & PipelineTemplateActions
>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      fetch: async () => {
        // No-op after boot — all data is already client-side.
        if (useBootStore.getState().isBooted && get().items.length > 0) return;

        const hasData = get().items.length > 0;
        set(s => {
          if (hasData) {
            s.isRefreshing = true;
          } else {
            s.loading = true;
          }
          s.error = null;
        });
        try {
          const data = await getJson<PipelineTemplate[]>(
            '/ats/pipeline-templates'
          );
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

      fetchOne: async id => {
        const t = await getJson<PipelineTemplate>(
          `/ats/pipeline-templates/${id}`
        );
        set(s => {
          const idx = s.items.findIndex(x => x._id === id);
          if (idx !== -1) s.items[idx] = t;
          else s.items.push(t);
        });
        return t;
      },

      create: async data => {
        set(s => {
          s.mutating = true;
          s.error = null;
        });
        try {
          const t = await postJson<PipelineTemplate>(
            '/ats/pipeline-templates',
            data
          );
          set(s => {
            const idx = s.items.findIndex(x => x._id === t._id);
            if (idx !== -1) s.items[idx] = t;
            else s.items.push(t);
            s.mutating = false;
          });
          return t;
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
          const t = await patchJson<PipelineTemplate>(
            `/ats/pipeline-templates/${id}`,
            data
          );
          set(s => {
            const idx = s.items.findIndex(x => x._id === id);
            if (idx !== -1) s.items[idx] = t;
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
          await deleteJson(`/ats/pipeline-templates/${id}`);
          set(s => {
            s.items = s.items.filter(x => x._id !== id);
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

      setAsDefault: async id => {
        const currentDefault = get().items.find(t => t.isDefault);
        // Already the default → nothing to do.
        if (currentDefault && currentDefault._id === id) return;
        set(s => {
          s.mutating = true;
          s.error = null;
        });
        try {
          // Step 1 — un-default the current default in the backend. The store
          // is updated optimistically so subsequent reads see the change; the
          // PATCH response also Patches the store with the server's result.
          if (currentDefault) {
            const undefaulted = await patchJson<PipelineTemplate>(
              `/ats/pipeline-templates/${currentDefault._id}`,
              { isDefault: false }
            );
            set(s => {
              const idx = s.items.findIndex(x => x._id === currentDefault._id);
              if (idx !== -1) s.items[idx] = undefaulted;
            });
          }
          // Step 2 — set the new default. Either we un-defaulted the old one
          // above, or there was no default at all; both satisfy the backend's
          // single-default invariant.
          const updated = await patchJson<PipelineTemplate>(
            `/ats/pipeline-templates/${id}`,
            { isDefault: true }
          );
          set(s => {
            const idx = s.items.findIndex(x => x._id === id);
            if (idx !== -1) s.items[idx] = updated;
            s.mutating = false;
          });
        } catch (e) {
          set(s => {
            s.mutating = false;
            s.error = (e as Error).message;
          });
          // Re-fetch to reconcile local state with the server's source of
          // truth after a failed two-step switch.
          void get().fetch();
          throw e;
        }
      },

      reset: () =>
        set(s => {
          Object.assign(s, initialState);
        }),

      _patch: t =>
        set(s => {
          const idx = s.items.findIndex(x => x._id === t._id);
          if (idx !== -1) s.items[idx] = t;
          else s.items.push(t);
        }),

      _remove: id =>
        set(s => {
          s.items = s.items.filter(x => x._id !== id);
        }),
    })),
    {
      name: 'ats-pipeline-templates',
      storage: createJSONStorage(() => localStorage),
      partialize: s => ({ items: s.items }),
    }
  )
);
