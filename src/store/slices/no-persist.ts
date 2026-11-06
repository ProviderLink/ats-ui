import type { StateStorage } from "zustand/middleware";

/**
 * Storage for stores whose data must never be written to the browser.
 *
 * Applications, candidates, emails, interviews, clients, team members and
 * activity are personal data: kept in localStorage they stayed on shared
 * computers, and as they grew they filled the ~5 MB quota, after which every
 * store update threw. The data is loaded fresh after sign-in anyway, so these
 * stores keep it in memory only. Reading returns nothing, and the first read
 * also removes whatever an older version of the app saved under that key.
 */
export const noPersistStorage: StateStorage = {
  getItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // Storage may be unavailable (private mode); nothing to clean up then.
    }
    return null;
  },
  setItem: () => undefined,
  removeItem: () => undefined,
};
