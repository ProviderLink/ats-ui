import { getAuthToken } from '@/lib/api-client';
import { useAuthStore } from '@/store/slices/auth.store';
import { useActivityLogStore } from '@/store/slices/activity-logs.store';
import type { ActivityLog } from '@/store/types';

/**
 * Optimistically prepend a locally-generated activity entry into the store cache
 * so the UI updates instantly after a mutation, before the server refetch lands.
 *
 * The entry is assigned a temporary `_id` — it will be replaced when
 * `fetchForEntity` returns the canonical server list.
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

  const store = useActivityLogStore.getState();
  store._prepend(resourceType, resourceId, {
    _id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    resourceType,
    resourceId,
    action,
    description,
    createdAt: new Date().toISOString(),
  } as ActivityLog);
  void store.fetchForEntity(resourceType, resourceId, { force: true });
}
