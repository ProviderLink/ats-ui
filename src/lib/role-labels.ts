import type { UserRole } from '@/store/types/enums';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  hiring_manager: 'Hiring Manager',
  recruiter: 'Recruiter',
  coordinator: 'Coordinator',
  interviewer: 'Interviewer',
  account_manager: 'Account Manager',
  client: 'Client',
  va: 'VA',
};

export const PERMISSION_RESOURCES = [
  'candidates',
  'jobs',
  'interviews',
  'clients',
  'emails',
  'tags',
  'settings',
  'dashboard',
  'team',
  'pipelineTemplates',
  'emailTemplates',
  'activityLogs',
  'assignments',
  'reports',
  'eod',
  'performanceReview',
] as const;

export type PermissionResource = (typeof PERMISSION_RESOURCES)[number];

export const RESOURCE_LABELS: Record<PermissionResource, string> = {
  candidates: 'Candidates',
  jobs: 'Jobs',
  interviews: 'Interviews',
  clients: 'Clients',
  emails: 'Emails',
  tags: 'Tags',
  settings: 'Settings',
  dashboard: 'Dashboard',
  team: 'Team',
  pipelineTemplates: 'Pipeline Templates',
  emailTemplates: 'Email Templates',
  activityLogs: 'Activity Logs',
  assignments: 'Assignments',
  reports: 'Reports',
  eod: 'EOD',
  performanceReview: 'Performance Review',
};
