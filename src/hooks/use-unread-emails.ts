/**
 * Unread emails notification system.
 *
 * Counts unread emails from the local email store — no server round-trip needed.
 * The count updates reactively via socket events (incrementUnreadCount) and
 * whenever the email store items change.
 */

import { useEmailStore } from '@/store/slices/emails.store';
import { useEffect, useState } from 'react';

// Global module-level state so the count survives component remounts
let _unreadCount = 0;
const _listeners = new Set<(count: number) => void>();

function notifyListeners() {
  _listeners.forEach(fn => fn(_unreadCount));
}

/** Recompute unread count from the email store. */
function recomputeFromStore(): number {
  const items = useEmailStore.getState().items;
  return items.filter(e => e.isRead !== true).length;
}

/** Update the global unread count. */
export function setUnreadCount(count: number): void {
  _unreadCount = count;
  notifyListeners();
}

/** Increment the global unread count by 1 (called when a new email arrives via socket). */
export function incrementUnreadCount(): void {
  _unreadCount += 1;
  notifyListeners();
}

/**
 * React hook to subscribe to the unread email count.
 * Derived from the local email store — no API call needed.
 */
export function useUnreadEmailCount(): {
  unreadCount: number;
} {
  const [count, setCount] = useState(() => recomputeFromStore());

  // Subscribe to global count changes (from socket events)
  useEffect(() => {
    const handler = (c: number) => setCount(c);
    _listeners.add(handler);
    return () => {
      _listeners.delete(handler);
    };
  }, []);

  // Recompute when store items change (emails loaded, read status toggled, etc.)
  useEffect(() => {
    const unsub = useEmailStore.subscribe(() => {
      const c = recomputeFromStore();
      _unreadCount = c;
      setCount(c);
      notifyListeners();
    });
    return unsub;
  }, []);

  // Initial recompute on mount (in case store was populated during boot)
  useEffect(() => {
    const c = recomputeFromStore();
    _unreadCount = c;
    setCount(c);
  }, []);

  return { unreadCount: count };
}
