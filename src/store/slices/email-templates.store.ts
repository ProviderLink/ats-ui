import { deleteJson, getJson, patchJson, postJson } from '@/lib/api-client';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  CreateEmailTemplateDto,
  EmailTemplate,
  UpdateEmailTemplateDto,
} from '../types';
import { useBootStore } from './boot.store';

interface EmailTemplateState {
  items: EmailTemplate[];
  loading: boolean;
  mutating: boolean;
  error: string | null;
}

interface EmailTemplateActions {
  fetch: () => Promise<void>;
  create: (data: CreateEmailTemplateDto) => Promise<EmailTemplate>;
  update: (id: string, data: UpdateEmailTemplateDto) => Promise<void>;
  setDefault: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reset: () => void;
  _patch: (t: EmailTemplate) => void;
  _remove: (id: string) => void;
}

const initialState: EmailTemplateState = {
  items: [],
  loading: false,
  mutating: false,
  error: null,
};

export const useEmailTemplateStore = create<
  EmailTemplateState & EmailTemplateActions
>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      fetch: async () => {
        // No-op after boot — all data is already client-side.
        if (useBootStore.getState().isBooted && get().items.length > 0) return;

        set(s => {
          s.loading = true;
          s.error = null;
        });
        try {
          const data = await getJson<EmailTemplate[]>('/ats/email-templates');
          set(s => {
            s.items = data;
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
          const t = await postJson<EmailTemplate>('/ats/email-templates', data);
          set(s => {
            if (t.isDefault) {
              s.items.forEach(x => {
                if (x._id !== t._id && x.type === t.type) x.isDefault = false;
              });
            }
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
          const t = await patchJson<EmailTemplate>(
            `/ats/email-templates/${id}`,
            data
          );
          set(s => {
            if (t.isDefault) {
              s.items.forEach(x => {
                if (x._id !== id && x.type === t.type) x.isDefault = false;
              });
            }
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
          await deleteJson(`/ats/email-templates/${id}`);
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

      setDefault: async id => {
        set(s => {
          s.mutating = true;
          s.error = null;
        });
        try {
          const t = await patchJson<EmailTemplate>(
            `/ats/email-templates/${id}`,
            { isDefault: true }
          );
          set(s => {
            // Un-default all other templates of the same type locally
            s.items.forEach(x => {
              if (x._id !== id && x.type === t.type) x.isDefault = false;
            });
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
      name: 'ats-email-templates',
      storage: createJSONStorage(() => localStorage),
      partialize: s => ({ items: s.items }),
    }
  )
);
