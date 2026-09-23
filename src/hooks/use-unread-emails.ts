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

/** Unread emails currently in the store. */
function countUnread(): number {
  return useEmailStore.getState().items.filter(e => e.isRead !== true).length;
}

// `useSyncExternalStore` requires a stable snapshot, and React compares it on
// every store notification, so the value is cached and only recomputed when the
// store actually changes.
let cachedCount = countUnread();

function getSnapshot(): number {
  return cachedCount;
}

function getServerSnapshot(): number {
  return 0;
}

function subscribe(onChange: () => void): () => void {
  return useEmailStore.subscribe(() => {
    const next = countUnread();
    if (next !== cachedCount) {
      cachedCount = next;
      onChange();
    }
  });
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
