import { getJson, patchJson } from '@/lib/api-client';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { AppSettings, UpdateSettingsDto } from '../types';
import { useBootStore } from './boot.store';

interface SettingsState {
  settings: AppSettings | null;
  loading: boolean;
  isRefreshing: boolean;
  mutating: boolean;
  error: string | null;
}

interface SettingsActions {
  fetch: () => Promise<void>;
  update: (data: UpdateSettingsDto) => Promise<void>;
  reset: () => void;
}

const initialState: SettingsState = {
  settings: null,
  loading: false,
  isRefreshing: false,
  mutating: false,
  error: null,
};

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      fetch: async () => {
        // No-op after boot — all data is already client-side.
        if (useBootStore.getState().isBooted && get().settings !== null) return;

        const hasData = get().settings !== null;
        set(s => {
          if (hasData) s.isRefreshing = true;
          else s.loading = true;
          s.error = null;
        });
        try {
          const data = await getJson<AppSettings>('/shared/settings');
          set(s => {
            s.settings = data;
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

      update: async data => {
        set(s => {
          s.mutating = true;
          s.error = null;
        });
        try {
          const updated = await patchJson<AppSettings>(
            '/shared/settings',
            data
          );
          set(s => {
            s.settings = updated;
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

      reset: () => set(() => initialState),
    })),
    {
      name: 'ats-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: s => ({ settings: s.settings }),
    }
  )
);
