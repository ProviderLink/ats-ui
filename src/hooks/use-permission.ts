import { useAuthStore } from '@/store/slices/auth.store';
import type { UserPermissions } from '@/store/types';
import type { UserRole } from '@/store/types/enums';

type Resource = keyof UserPermissions;
type Action = 'read' | 'write' | 'manage' | 'schedule' | 'approve';

export function usePermission() {
  const user = useAuthStore(s => s.user);

  const hasPermission = (resource: Resource, action: Action): boolean => {
    if (!user) return false;
    if (user.roles.includes('admin')) return true;
    return (user.permissions?.[resource] as Record<string, boolean> | undefined)?.[action] ?? false;
  };

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return user.roles.some(r => roles.includes(r as UserRole));
  };

  return { hasPermission, hasRole };
}
