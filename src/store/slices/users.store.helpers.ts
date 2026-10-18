import type { User } from '../types';
import type { UserState } from './users.store.types';

/** Replace an existing user in the list; does nothing when it isn't there. */
export function replaceUser(
  s: Pick<UserState, 'items'>,
  id: string,
  user: User
) {
  const idx = s.items.findIndex(x => x._id === id);
  if (idx !== -1) s.items[idx] = user;
}

/** Replace the user in the list, or append it when new. */
export function upsertUser(s: Pick<UserState, 'items'>, user: User) {
  const idx = s.items.findIndex(x => x._id === user._id);
  if (idx !== -1) s.items[idx] = user;
  else s.items.push(user);
}
