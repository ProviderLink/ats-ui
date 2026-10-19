/**
 * Boot store — gates the entire protected app behind a one-time data load.
 *
 * After login succeeds, the boot loader fetches every entity type in
 * parallel. Until that completes, the user sees a full-screen spinner.
 * Once booted, all stores are populated and every page renders instantly
 * with zero loading states — all filtering/pagination is client-side.
 */

import { create } from 'zustand';

interface BootState {
  isBooted: boolean;
  isBooting: boolean;
  /** True while a post-reconnect refresh runs; lets store fetches bypass their post-boot no-op. */
  resyncing: boolean;
  error: string | null;
}

interface BootActions {
  setBooting: () => void;
  setBooted: () => void;
  setError: (error: string) => void;
  setResyncing: (resyncing: boolean) => void;
  reset: () => void;
}

const initialState: BootState = {
  isBooted: false,
  isBooting: false,
  resyncing: false,
  error: null,
};

export const useBootStore = create<BootState & BootActions>()(set => ({
  ...initialState,

  setBooting: () => set({ isBooting: true, isBooted: false, error: null }),
  setBooted: () => set({ isBooted: true, isBooting: false, error: null }),
  setError: error => set({ isBooting: false, error }),
  setResyncing: resyncing => set({ resyncing }),
  reset: () => set(initialState),
}));

/**
 * True when a store's `fetch()` may return early because boot already loaded
 * everything. Turns false during a post-reconnect resync so those same fetches
 * actually reach the server.
 */
export function canSkipFetch(): boolean {
  const { isBooted, resyncing } = useBootStore.getState();
  return isBooted && !resyncing;
}
