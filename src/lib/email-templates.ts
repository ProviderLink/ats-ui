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

export const EMAIL_VARIABLES = [
  'candidateName',
  'candidateEmail',
  'candidatePhone',
  'jobTitle',
  'clientName',
  'currentStage',
  'senderName',
] as const;

export const EMAIL_TEMPLATE_TYPE_LABELS = Object.fromEntries(
  EMAIL_TEMPLATE_TYPES.map(t => [t.value, t.label])
) as Record<string, string>;
