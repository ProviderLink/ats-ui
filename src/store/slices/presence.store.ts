import { create } from 'zustand';

interface PresenceState {
  /** User ids with at least one live ATS connection. */
  online: Record<string, true>;
  setSnapshot: (ids: string[]) => void;
  setOnline: (userId: string, online: boolean) => void;
  clear: () => void;
}

export const usePresenceStore = create<PresenceState>(set => ({
  online: {},
  setSnapshot: ids =>
    set({ online: Object.fromEntries(ids.map(id => [id, true as const])) }),
  setOnline: (userId, online) =>
    set(state => {
      if (online === Boolean(state.online[userId])) return state;
      const next = { ...state.online };
      if (online) next[userId] = true;
      else delete next[userId];
      return { online: next };
    }),
  clear: () => set({ online: {} }),
}));
