import { deleteJson, getJson, patchJson, postJson } from '@/lib/api-client';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  CreatePipelineTemplateDto,
  PipelineTemplate,
  UpdatePipelineTemplateDto,
} from '../types';
import { canSkipFetch } from './boot.store';

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
   * Switch the default template status from the existing default to a new
   * template (see `runWithDefaultTransfer`). If the same template is already
   * the default, this is a no-op.
   */
  setAsDefault: (id: string) => Promise<void>;
  reset: () => void;
  _patch: (t: PipelineTemplate) => void;
  _remove: (id: string) => void;
}

/**
 * The backend allows a single default and rejects (409) any request that would
 * create a second one, so a default transfer is two PATCHes: demote the current
 * default, then run `run` (which promotes the new one). If `run` fails the old
 * default is restored so the workspace is never left without a default (and if
 * even that fails, `onRestoreFailed` syncs the local copy to the server).
 */
async function runWithDefaultTransfer<T>(
  current: PipelineTemplate | undefined,
  run: () => Promise<T>,
  onRestoreFailed: (demoted: PipelineTemplate) => void
): Promise<{ result: T; demoted: PipelineTemplate | null }> {
  if (!current) return { result: await run(), demoted: null };
  const url = `/ats/pipeline-templates/${current._id}`;
  const demoted = await patchJson<PipelineTemplate>(url, { isDefault: false });
  try {
    return { result: await run(), demoted };
  } catch (e) {
    try {
      await patchJson<PipelineTemplate>(url, { isDefault: true });
    } catch {
      onRestoreFailed(demoted);
    }
    throw e;
  }
}

function upsert(items: PipelineTemplate[], t: PipelineTemplate) {
  const idx = items.findIndex(x => x._id === t._id);
  if (idx !== -1) items[idx] = t;
  else items.push(t);
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
        if (canSkipFetch() && get().items.length > 0) return;

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
          const { result: t, demoted } = await runWithDefaultTransfer(
            data.isDefault ? get().items.find(x => x.isDefault) : undefined,
            () => postJson<PipelineTemplate>('/ats/pipeline-templates', data),
            d => set(s => upsert(s.items, d))
          );
          set(s => {
            if (demoted) upsert(s.items, demoted);
            upsert(s.items, t);
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
          const { result: t, demoted } = await runWithDefaultTransfer(
            data.isDefault
              ? get().items.find(x => x.isDefault && x._id !== id)
              : undefined,
            () =>
              patchJson<PipelineTemplate>(`/ats/pipeline-templates/${id}`, data),
            d => set(s => upsert(s.items, d))
          );
          set(s => {
            if (demoted) upsert(s.items, demoted);
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
          const { result: updated, demoted } = await runWithDefaultTransfer(
            currentDefault,
            () =>
              patchJson<PipelineTemplate>(`/ats/pipeline-templates/${id}`, {
                isDefault: true,
              }),
            d => set(s => upsert(s.items, d))
          );
          set(s => {
            if (demoted) upsert(s.items, demoted);
            const idx = s.items.findIndex(x => x._id === id);
            if (idx !== -1) s.items[idx] = updated;
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
