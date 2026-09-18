import { useActivityLogStore } from '@/store/slices/activity-logs.store';
import { useAuthStore } from '@/store/slices/auth.store';
import type { ActivityLog } from '@/store/types';

/**
 * Optimistically prepend a locally-generated activity entry into the store cache
 * so the UI updates instantly after a mutation, before the server refetch lands.
 *
 * The entry is assigned a temporary `_id` and stamped with the signed-in user as
 * the performer — the timeline resolves that id into a name and avatar from the
 * boot-loaded user list, so the row matches the server-rendered version instead
 * of briefly reading as a system event.
 *
 * Passing `metadata` is what lets the timeline render a rich sentence straight
 * away, e.g. `{ from: 'Phone Screen', to: 'Offer' }` rather than a fallback
 * label. The entry is replaced when `fetchForEntity` returns the canonical list.
 */
export function logOptimisticActivity(
  resourceType: string,
  resourceId: string,
  action: string,
  description: string,
  metadata?: Record<string, unknown> | null
): void {
  const store = useActivityLogStore.getState();
  const currentUser = useAuthStore.getState().user;

  store._prepend(resourceType, resourceId, {
    _id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    resourceType,
    resourceId,
    action,
    description,
    metadata: metadata ?? null,
    performedBy: currentUser?._id ?? null,
    createdAt: new Date().toISOString(),
  } as ActivityLog);
  void store.fetchForEntity(resourceType, resourceId, { force: true });
}
