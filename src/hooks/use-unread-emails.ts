import { useEmailStore } from '@/store/slices/emails.store';
import { useSyncExternalStore } from 'react';

/**
 * Unread INBOUND emails in the store. Outbound mail must be excluded: the
 * backend defaults `isRead: false` on every email, including ones we send.
 *
 * `items` holds only the page the list last fetched, so this is "unread among
 * loaded emails", not a workspace-wide total.
 */
function countUnread(): number {
  return useEmailStore
    .getState()
    .items.filter(e => e.direction !== 'outbound' && e.isRead !== true).length;
}

/**
 * Deliberately not cached in a module-level variable: a cache only refreshes
 * inside `subscribe`, which is torn down on logout, so the next session's badge
 * would keep the previous user's number.
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

/** Unread email count, derived from the local email store (no API call). */
export function useUnreadEmailCount(): { unreadCount: number } {
  const unreadCount = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  return { unreadCount };
}
