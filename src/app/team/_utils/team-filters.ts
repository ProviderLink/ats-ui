import { UserRole as UserRoleEnum } from '@/store/types/enums';
import type { User } from '@/store/types/user.types';
import type { UserRole } from '../_data/team';

export type RoleFilter = UserRole | 'all';
export type AppFilter = 'all' | 'ats' | 'crm';
export type ActiveFilter = 'all' | 'active' | 'invited' | 'inactive';

export interface TeamFilters {
  role: RoleFilter;
  app: AppFilter;
  status: ActiveFilter;
}

export const NO_FILTERS: TeamFilters = {
  role: 'all',
  app: 'all',
  status: 'all',
};

export const APP_OPTIONS: AppFilter[] = ['all', 'ats', 'crm'];

export const STATUS_LABELS: Record<ActiveFilter, string> = {
  all: 'All statuses',
  active: 'Active',
  invited: 'Invited',
  inactive: 'Inactive',
};

const ROLE_RANK: Record<string, number> = {
  [UserRoleEnum.admin]: 1,
  [UserRoleEnum.hiring_manager]: 2,
  [UserRoleEnum.recruiter]: 3,
  [UserRoleEnum.coordinator]: 4,
  [UserRoleEnum.interviewer]: 5,
  [UserRoleEnum.account_manager]: 6,
  [UserRoleEnum.client]: 7,
  [UserRoleEnum.va]: 8,
};

export function hasActiveFilters(filters: TeamFilters): boolean {
  return (
    filters.role !== 'all' || filters.app !== 'all' || filters.status !== 'all'
  );
}

export function filterTeamMembers(
  members: User[],
  { role, app, status }: TeamFilters
): User[] {
  // CRM-only roles (client, va) are managed elsewhere.
  let data = members.filter(m => {
    const roles = m.roles ?? [];
    return !roles.includes('client') && !roles.includes('va');
  });
  if (role !== 'all') data = data.filter(m => m.roles?.includes(role));
  if (app !== 'all') data = data.filter(m => m.appAccess?.includes(app));
  if (status === 'active')
    data = data.filter(m => m.isActive && m.isInviteAccepted);
  if (status === 'invited')
    data = data.filter(m => m.isActive && !m.isInviteAccepted);
  if (status === 'inactive') data = data.filter(m => !m.isActive);
  return [...data].sort((a, b) => {
    const rankA = ROLE_RANK[a.roles?.[0]] ?? 99;
    const rankB = ROLE_RANK[b.roles?.[0]] ?? 99;
    return rankA - rankB;
  });
}
