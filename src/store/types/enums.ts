export const CandidateStatus = {
  pending: 'pending',
  approved: 'approved',
  hired: 'hired',
} as const;
export type CandidateStatus =
  (typeof CandidateStatus)[keyof typeof CandidateStatus];

export const JobStatus = {
  draft: 'draft',
  open: 'open',
  on_hold: 'on_hold',
  closed: 'closed',
} as const;
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

export const ApplicationPhase = {
  pending: 'pending',
  approved: 'approved',
  hired: 'hired',
  rejected: 'rejected',
} as const;
export type ApplicationPhase =
  (typeof ApplicationPhase)[keyof typeof ApplicationPhase];

export const InterviewStatus = {
  scheduled: 'scheduled',
  completed: 'completed',
  cancelled: 'cancelled',
  no_show: 'no_show',
} as const;
export type InterviewStatus =
  (typeof InterviewStatus)[keyof typeof InterviewStatus];

export const InterviewType = {
  zoom: 'zoom',
  google_meet: 'google_meet',
  phone_call: 'phone_call',
  in_person: 'in_person',
} as const;
export type InterviewType = (typeof InterviewType)[keyof typeof InterviewType];

export const ClientStatus = {
  active: 'active',
  inactive: 'inactive',
  suspended: 'suspended',
} as const;
export type ClientStatus = (typeof ClientStatus)[keyof typeof ClientStatus];

export const CrmHealth = {
  green: 'green',
  yellow: 'yellow',
  red: 'red',
} as const;
export type CrmHealth = (typeof CrmHealth)[keyof typeof CrmHealth];

export const JobPriority = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  urgent: 'urgent',
} as const;
export type JobPriority = (typeof JobPriority)[keyof typeof JobPriority];

export const JobType = {
  full_time: 'full_time',
  part_time: 'part_time',
  contract: 'contract',
  temporary: 'temporary',
} as const;
export type JobType = (typeof JobType)[keyof typeof JobType];

export const LocationType = {
  remote: 'remote',
  hybrid: 'hybrid',
  onsite: 'onsite',
} as const;
export type LocationType = (typeof LocationType)[keyof typeof LocationType];

export const ExperienceLevel = {
  entry: 'entry',
  mid: 'mid',
  senior: 'senior',
  lead: 'lead',
} as const;
export type ExperienceLevel =
  (typeof ExperienceLevel)[keyof typeof ExperienceLevel];

export const AiFitRecommendation = {
  poor_fit: 'poor_fit',
  moderate_fit: 'moderate_fit',
  good_fit: 'good_fit',
  strong_fit: 'strong_fit',
} as const;
export type AiFitRecommendation =
  (typeof AiFitRecommendation)[keyof typeof AiFitRecommendation];

export const InterviewRecommendation = {
  strong_yes: 'strong_yes',
  yes: 'yes',
  neutral: 'neutral',
  no: 'no',
  strong_no: 'strong_no',
} as const;
export type InterviewRecommendation =
  (typeof InterviewRecommendation)[keyof typeof InterviewRecommendation];

export const WorkloadLevel = {
  low: 'low',
  medium: 'medium',
  high: 'high',
} as const;
export type WorkloadLevel = (typeof WorkloadLevel)[keyof typeof WorkloadLevel];

export const CandidateSource = {
  applied: 'applied',
  internal_upload: 'internal_upload',
} as const;
export type CandidateSource =
  (typeof CandidateSource)[keyof typeof CandidateSource];

export const ApplicationSource = {
  direct_apply: 'direct_apply',
  internal_upload: 'internal_upload',
  assigned: 'assigned',
} as const;
export type ApplicationSource =
  (typeof ApplicationSource)[keyof typeof ApplicationSource];

export const SalaryPeriod = {
  hourly: 'hourly',
  daily: 'daily',
  weekly: 'weekly',
  bi_weekly: 'bi_weekly',
  monthly: 'monthly',
  yearly: 'yearly',
} as const;
export type SalaryPeriod = (typeof SalaryPeriod)[keyof typeof SalaryPeriod];

export const CompanySize = {
  '1-10': '1-10',
  '11-50': '11-50',
  '51-200': '51-200',
  '201-500': '201-500',
  '500+': '500+',
} as const;
export type CompanySize = (typeof CompanySize)[keyof typeof CompanySize];

export const UserRole = {
  admin: 'admin',
  hiring_manager: 'hiring_manager',
  recruiter: 'recruiter',
  coordinator: 'coordinator',
  interviewer: 'interviewer',
  account_manager: 'account_manager',
  client: 'client',
  va: 'va',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const EmailDirection = {
  outbound: 'outbound',
  inbound: 'inbound',
} as const;
export type EmailDirection =
  (typeof EmailDirection)[keyof typeof EmailDirection];

export const EmailStatus = {
  pending: 'pending',
  sent: 'sent',
  delivered: 'delivered',
  delayed: 'delayed',
  failed: 'failed',
  bounced: 'bounced',
  complained: 'complained',
  received: 'received',
} as const;
export type EmailStatus = (typeof EmailStatus)[keyof typeof EmailStatus];

export const EmailTemplateType = {
  interview: 'interview',
  offer: 'offer',
  rejection: 'rejection',
  follow_up: 'follow_up',
  eod_reminder: 'eod_reminder',
  survey_reminder: 'survey_reminder',
  application_confirmation: 'application_confirmation',
  general: 'general',
} as const;
export type EmailTemplateType =
  (typeof EmailTemplateType)[keyof typeof EmailTemplateType];

export const AppAccess = {
  ats: 'ats',
  crm: 'crm',
} as const;
export type AppAccess = (typeof AppAccess)[keyof typeof AppAccess];

export const EnglishProficiency = {
  basic: 'basic',
  conversational: 'conversational',
  professional: 'professional',
  fluent: 'fluent',
  native: 'native',
} as const;
export type EnglishProficiency =
  (typeof EnglishProficiency)[keyof typeof EnglishProficiency];

export const VideoIntroSource = {
  cloudinary: 'cloudinary',
  external: 'external',
} as const;
export type VideoIntroSource =
  (typeof VideoIntroSource)[keyof typeof VideoIntroSource];

export const NoteMethod = {
  call: 'call',
  email: 'email',
  meeting: 'meeting',
  message: 'message',
  other: 'other',
} as const;
export type NoteMethod = (typeof NoteMethod)[keyof typeof NoteMethod];
