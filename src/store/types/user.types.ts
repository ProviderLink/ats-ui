import type { AppAccess, UserRole } from './enums';

export interface UserPermissionResource {
  read?: boolean;
  write?: boolean;
  manage?: boolean;
  schedule?: boolean;
  approve?: boolean;
}

export interface UserPermissions {
  candidates?: UserPermissionResource;
  jobs?: UserPermissionResource;
  interviews?: UserPermissionResource;
  interviewScorecards?: UserPermissionResource;
  clients?: UserPermissionResource;
  emails?: UserPermissionResource;
  tags?: UserPermissionResource;
  settings?: UserPermissionResource;
  dashboard?: UserPermissionResource;
  team?: UserPermissionResource;
  pipelineTemplates?: UserPermissionResource;
  emailTemplates?: UserPermissionResource;
  activityLogs?: UserPermissionResource;
  assignments?: UserPermissionResource;
  reports?: UserPermissionResource;
  eod?: UserPermissionResource;
  performanceReview?: UserPermissionResource;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string | null;
  roles: UserRole[];
  appAccess: AppAccess[];
  permissions?: UserPermissions;
  isActive: boolean;
  emailVerified: boolean;
  isInviteAccepted: boolean;
  lastLoginAts?: string | null;
  lastLoginCrm?: string | null;
  clientRef?: string | null;
  candidateRef?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roles: UserRole[];
  appAccess?: AppAccess[];
  invitedBy?: {
    firstName: string;
    lastName: string;
  };
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  roles?: UserRole[];
  appAccess?: AppAccess[];
  isActive?: boolean;
}

export interface UserFilters {
  roles?: UserRole[];
  appAccess?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}
