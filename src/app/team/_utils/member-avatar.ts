import { AVATAR_BG } from '../_data/team';

/** Stable avatar colour classes for a person, derived from their initials. */
export function memberAvatarClass(first: string, last: string): string {
  const idx =
    ((first.charCodeAt(0) || 0) + (last.charCodeAt(0) || 0)) %
    AVATAR_BG.length;
  return AVATAR_BG[idx];
}
