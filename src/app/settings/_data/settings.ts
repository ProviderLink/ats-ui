// Workspace / organisation settings (no backend model — UI-level config)
export const workspaceSettings = {
  name: 'Arista Healthcare Staffing',
  website: 'https://arista.com',
  description:
    'Leading healthcare staffing agency specialising in nursing and allied health.',
  timezone: 'America/New_York',
  currency: 'USD',
  // API settings: PATCH /api/v1/shared/settings
  emailSettings: {
    fromEmail: 'hello@arista.com',
    fromName: 'Arista Healthcare Staffing',
  },
  aiSettings: {
    provider: 'claude' as const,
    resumeValidation: true,
    candidateScoring: false,
    resumeParsing: true,
  },
};

// Mirrors the User model from DATA_MODELS.md
import type { UserRole } from '@/store/types/enums';
export type { UserRole };

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

export type Permission = {
  read: boolean;
  write: boolean;
  manage: boolean;
  schedule: boolean;
  approve: boolean;
};

export type PermissionsMap = Record<string, Permission>;

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

// Pipeline templates (PipelineTemplate model)
export type PipelineStage = {
  _id: string;
  name: string;
  color: string;
  order: number;
  isActive: boolean;
  icon: string;
};

export type PipelineTemplate = {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  isActive: boolean;
  stages: PipelineStage[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

// Email templates (EmailTemplate model)
export const EMAIL_TEMPLATE_TYPES = [
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejection', label: 'Rejection' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'eod_reminder', label: 'EOD Reminder' },
  { value: 'survey_reminder', label: 'Survey Reminder' },
  { value: 'application_confirmation', label: 'Application Confirmation' },
  { value: 'general', label: 'General' },
] as const;

export type EmailTemplateType = (typeof EMAIL_TEMPLATE_TYPES)[number]['value'];

export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  type: EmailTemplateType;
  variables: string[];
  isDefault: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
};

export const EMAIL_VARIABLES = [
  'candidateName',
  'candidateEmail',
  'candidatePhone',
  'jobTitle',
  'clientName',
  'currentStage',
  'senderName',
] as const;
