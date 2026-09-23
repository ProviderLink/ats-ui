/**
 * Unread emails notification system.
 *
 * The count is DERIVED from the email store, which is the single source of
 * truth — there is no separate counter to keep in step.
 *
 * This replaces a module-level counter plus three effects that mirrored it into
 * `useState`. Besides setting state synchronously on mount, that design
 * double-counted: the socket handler inserts the arriving email into the store
 * (`_patch`) *and* incremented the counter, so each live email added one to the
 * derived total and then one more on top.
 */

import { useEmailStore } from '@/store/slices/emails.store';
import { useSyncExternalStore } from 'react';

/**
 * Unread INBOUND emails currently in the store.
 *
 * Direction matters: the backend defaults `isRead: false` on every email
 * (`email.model.ts`) and `sendEmail` never sets it, so an outbound message is
 * `isRead: false` too. Counting those made every email you sent appear as
 * unread. This now matches the list's own guard (`!isOut && !isRead`).
 *
 * NOTE: `items` only ever holds the page the list last fetched (emails are
 * server-paginated, and boot loads a single page), so this is "unread among
 * loaded emails", not a workspace-wide total. A true total needs a backend
 * count endpoint.
 */
function countUnread(): number {
  return useEmailStore
    .getState()
    .items.filter(e => e.direction !== 'outbound' && e.isRead !== true).length;
}

/**
 * `useSyncExternalStore` requires a stable snapshot for a given store state, and
 * a number satisfies that trivially — React compares with `Object.is`.
 *
 * This deliberately does NOT cache in a module-level variable. A cache is only
 * refreshed inside `subscribe`, which is torn down whenever the app unmounts
 * (logout → login screen). A stale cached count would then survive into the
 * next session: it is read by `getSnapshot` on mount, and because it equals the
 * previous value no re-render is triggered, so the badge kept showing the
 * previous user's number.
 */
function getSnapshot(): number {
  return countUnread();
}

function getServerSnapshot(): number {
  return 0;
}

function subscribe(onChange: () => void): () => void {
  return useEmailStore.subscribe(onChange);
}

/**
 * React hook to subscribe to the unread email count.
 * Derived from the local email store — no API call needed.
 *
 * A socket arrival updates the badge because it patches the store; no manual
 * increment is required or wanted.
 */
export function useUnreadEmailCount(): { unreadCount: number } {
  const unreadCount = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  return { unreadCount };
}
