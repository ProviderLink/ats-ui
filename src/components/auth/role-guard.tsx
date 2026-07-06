import { useAuthStore } from '@/store/slices/auth.store';
import type { UserRole } from '@/store/types/enums';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const user = useAuthStore(s => s.user);
  const roles = user?.roles ?? [];
  const hasRole = roles.some(r => allowedRoles.includes(r as UserRole));

  if (!hasRole) return <Navigate to="/ats/unauthorized" replace />;

  return <>{children}</>;
}
