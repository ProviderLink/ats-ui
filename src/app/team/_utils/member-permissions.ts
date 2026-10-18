import {
  PERMISSION_RESOURCES,
  RESOURCE_LABELS,
  type PermissionResource,
} from '@/lib/role-labels';
import type { User, UserPermissionResource } from '@/store/types/user.types';

const ACTION_LABELS: Record<keyof UserPermissionResource, string> = {
  read: 'Read',
  write: 'Write',
  manage: 'Manage',
  schedule: 'Schedule',
  approve: 'Approve',
};

const isResource = (name: string): name is PermissionResource =>
  PERMISSION_RESOURCES.some(r => r === name);

function activeActions(value: boolean | UserPermissionResource | undefined) {
  if (typeof value === 'boolean') return value ? [] : null;
  if (!value) return null;
  const actions = (
    Object.entries(value) as [keyof UserPermissionResource, boolean][]
  )
    .filter(([, on]) => on)
    .map(([action]) => ACTION_LABELS[action] ?? action);
  return actions.length ? actions : null;
}

export interface MemberPermission {
  label: string;
  /** Empty means the resource is allowed without per-action detail. */
  actions: string[];
}

export function getMemberPermissions(member: User): MemberPermission[] {
  return Object.entries(member.permissions ?? {}).flatMap(([resource, value]) => {
    const actions = activeActions(value);
    if (!actions) return [];
    return [
      { label: isResource(resource) ? RESOURCE_LABELS[resource] : resource, actions },
    ];
  });
}
