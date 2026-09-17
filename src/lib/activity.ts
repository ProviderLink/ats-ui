import type { ActivityEntry } from '@/components/activity-timeline/types';
import { getAuthToken } from '@/lib/api-client';
import { useActivityLogStore } from '@/store/slices/activity-logs.store';
import { useAuthStore } from '@/store/slices/auth.store';

/**
 * Optimistically prepend a locally-generated activity entry into the store cache
 * so the UI updates instantly after a mutation, before the server refetch lands.
 *
 * The entry carries a temporary id — it is replaced when `fetchForEntity`
 * returns the canonical server list. The shape is `ActivityEntry`, so the
 * entry is built the same way the API boundary would build it: no `updatedAt`,
 * and only metadata the templates actually consume.
 *
 * No-op for users without `activityLogs:read` — they cannot read the feed, so
 * the cache write and the follow-up refetch (which would 403) are both wasted.
 */
export function logOptimisticActivity(
  resourceType: string,
  resourceId: string,
  action: string,
  description: string
): void {
  const user = useAuthStore.getState().user;
  if (user) {
    const canRead =
      user.roles.includes('admin') ||
      user.permissions?.activityLogs?.read === true;
    if (!canRead) return;
  }

  // Without a token the refetch below would 401; skip both writes.
  if (!getAuthToken()) return;

  const entry: ActivityEntry = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    action,
    resourceType,
    resourceId,
    description,
    metadata: {},
    performedBy: null,
    performerName: user
      ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || null
      : null,
    performerAvatar: null,
    createdAt: new Date().toISOString(),
    legacy: false,
    legacyType: null,
  };

  const store = useActivityLogStore.getState();
  store._prepend(resourceType, resourceId, entry);
  void store.fetchForEntity(resourceType, resourceId, { force: true });
}
