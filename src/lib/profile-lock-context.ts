import { createContext, useContext } from 'react';

/**
 * True while something else (e.g. the interview scorecard form docked beside
 * the candidate sheet) owns the screen and the profile must be view-only.
 */
export const ProfileLockContext = createContext(false);

export function useProfileLocked() {
  return useContext(ProfileLockContext);
}
