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

/** Variables the composer fills in for every template type. */
export const EMAIL_VARIABLES = [
  'candidateName',
  'candidateEmail',
  'candidatePhone',
  'jobTitle',
  'clientName',
  'currentStage',
  'senderName',
] as const;

/** Variables the server accepts on a template (superset of the picker). */
export const KNOWN_EMAIL_VARIABLES = [
  ...EMAIL_VARIABLES,
  'companyName',
  'interviewDate',
  'interviewTime',
  'interviewType',
  'meetingLink',
  'interviewerName',
] as const;

/** Variables worth offering in the picker for a given template type. */
export function emailVariablesForType(type: string): readonly string[] {
  // `companyName` is only supplied when the confirmation email is sent.
  return type === 'application_confirmation'
    ? [...EMAIL_VARIABLES, 'companyName']
    : EMAIL_VARIABLES;
}

export const EMAIL_TEMPLATE_TYPE_LABELS = Object.fromEntries(
  EMAIL_TEMPLATE_TYPES.map(t => [t.value, t.label])
) as Record<string, string>;
