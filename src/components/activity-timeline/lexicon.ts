/**
 * Word lexicons. Everything here is a display string — no logic, no colour.
 *
 * Kept separate so the templates read as grammar and the vocabulary can be
 * reviewed (or translated) on its own.
 */

/** `resourceType` → the noun used for "this X" when no real name is known.
 * The feed only ever carries ObjectIds, so this is the common case. */
export const ENTITY_NOUN: Record<string, string> = {
  candidate: 'candidate',
  job: 'job',
  client: 'client',
  application: 'application',
  interview: 'interview',
  user: 'team member',
  assignment: 'assignment',
  eod: 'EOD report',
  performance_review: 'performance review',
  survey: 'survey',
  tag: 'tag',
  work_entry: 'work entry',
  settings: 'settings',
  scorecards: 'scorecards',
  vaProfile: 'VA profile',
  client_account: 'client account',
};

export const DEFAULT_ENTITY_NOUN = 'record';

/**
 * Legacy `type` tokens that we can phrase honestly. The full 54-entry mapping
 * to modern actions lives on the API boundary, but the tokens that have no
 * modern equivalent are skipped by that migration and arrive action-less, so
 * they need a sentence of their own rather than "Activity recorded".
 */
export const LEGACY_VERB: Record<string, { mixed: string; entity: string }> = {
  login: { mixed: 'logged in', entity: 'Signed in' },
  logged_in: { mixed: 'logged in', entity: 'Signed in' },
  user_login: { mixed: 'logged in', entity: 'Signed in' },
  logout: { mixed: 'logged out', entity: 'Signed out' },
  logged_out: { mixed: 'logged out', entity: 'Signed out' },
  sent_email: { mixed: 'sent an email', entity: 'Email sent' },
  email_sent: { mixed: 'sent an email', entity: 'Email sent' },
  email_opened: { mixed: 'opened an email', entity: 'Email opened' },
  password_reset: { mixed: 'reset a password', entity: 'Password reset' },
  password_changed: { mixed: 'changed a password', entity: 'Password changed' },
  viewed_candidate: { mixed: 'viewed a candidate', entity: 'Candidate viewed' },
  viewed_job: { mixed: 'viewed a job', entity: 'Job viewed' },
  exported_report: { mixed: 'exported a report', entity: 'Report exported' },
};

/**
 * `metadata.fields` (VA profile) and `metadata.sections` (resume parsing)
 * write machine tokens; these are the ones worth naming.
 *//**
 * `metadata.source` → how the candidate arrived.
 *
 * The `source` enum is `direct_apply | internal_upload | assigned` on the
 * application, plus `applied`/`manual` legacy variants. `applied` and `created`
 * are the two actions that use it.
 */ export const SOURCE_PHRASE: Record<
  string,
  { mixed: string; entity: string }
> = {
  direct_apply: {
    mixed: 'applied directly to',
    entity: 'Applied directly',
  },
  applied: {
    mixed: 'applied to',
    entity: 'Applied',
  },
  internal_upload: {
    mixed: 'was added to',
    entity: 'Added to this job',
  },
  manual: {
    mixed: 'was added to',
    entity: 'Added',
  },
  assigned: {
    mixed: 'was assigned to',
    entity: 'Assigned to this job',
  },
};

/** Interview meeting channel → the word that goes in front of "interview". */
export const MEETING_CHANNEL: Record<string, string> = {
  zoom: 'Zoom',
  google_meet: 'Google Meet',
  phone_call: 'phone',
  in_person: 'in-person',
};

/** Interview round → lowercase descriptor used after "for". */
export const INTERVIEW_ROUND: Record<string, string> = {
  initial_screening: 'initial screening',
  group_interview: 'a group interview',
  technical_interview: 'a technical interview',
  panel_interview: 'a panel interview',
  final_interview: 'a final interview',
  hr_interview: 'an HR interview',
  culture_fit: 'a culture-fit interview',
  other: 'an interview',
};

/** AI fit-score recommendation → a short qualifier. */
export const RECOMMENDATION: Record<string, string> = {
  strong_fit: 'a strong fit',
  good_fit: 'a good fit',
  moderate_fit: 'a moderate fit',
  weak_fit: 'a weak fit',
  poor_fit: 'a poor fit',
  not_a_fit: 'not a fit',
};

/** Feedback recommendation → lowercase verb phrase. */
export const FEEDBACK_RECOMMENDATION: Record<string, string> = {
  yes: 'a yes',
  strong_yes: 'a strong yes',
  no: 'a no',
  strong_no: 'a strong no',
  maybe: 'a maybe',
  hire: 'hire',
  no_hire: 'no hire',
  strong_hire: 'strong hire',
  strong_no_hire: 'strong no-hire',
};

/** `metadata.fields` (VA profile) and `metadata.sections` (resume parsing)
 * write machine tokens; these are the ones worth naming. */
export const FIELD_PHRASE: Record<string, string> = {
  notes: 'CRM notes',
  lastVaCheckin: 'last check-in',
  satisfactionScore: 'satisfaction score',
  healthStatus: 'health status',
  emrSystem: 'EMR system',
  openIssuesCount: 'open issues',
  accountOwner: 'account owner',
  serviceStartDate: 'service start date',
  primaryContact: 'primary contact',
  secondaryContact: 'secondary contact',
  baaSigned: 'BAA status',
  baaSignedDate: 'BAA signed date',
  onboardingComplete: 'onboarding status',
  sopReceived: 'SOP status',
  skills: 'skills',
  experience: 'work experience',
  education: 'education',
  firstName: 'first name',
  lastName: 'last name',
  email: 'email',
  phone: 'phone number',
  address: 'address',
  tags: 'tags',
  status: 'status',
  role: 'role',
};

/** `metadata.method` on a note → how it was recorded. */
export const NOTE_METHOD: Record<string, string> = {
  call: 'from a call',
  email: 'from an email',
  meeting: 'from a meeting',
  message: 'from a message',
  other: 'from a conversation',
};

/** `metadata.destination` on a disposition. */
export const DISPOSITION_DESTINATION: Record<string, string> = {
  candidate_pool: 'the candidate pool',
  permanently_ineligible: 'the permanently ineligible list',
};

/** Human nouns for the field names embedded in `metadata.changes` strings. */
export const CHANGE_FIELD_PHRASE: Record<string, string> = {
  'profile data': 'profile',
  'applied job': 'applied job',
  'company name': 'company name',
  'phone number': 'phone number',
  'job title': 'job title',
  'years of experience': 'years of experience',
  'english proficiency': 'English proficiency',
  'current salary (php)': 'current salary',
  'current salary (usd)': 'current salary',
  'city of residence': 'city of residence',
  'date & time': 'date and time',
  'account manager': 'account manager',
  'service type': 'service type',
  'start date': 'start date',
  'end date': 'end date',
  'meeting details': 'meeting details',
  interviewers: 'interviewers',
  'health status': 'health status',
  'emr system': 'EMR system',
  'satisfaction score': 'satisfaction score',
  'open issues count': 'open issues',
  'crm notes': 'CRM notes',
  'account owner': 'account owner',
  'service start date': 'service start date',
  'primary contact': 'primary contact',
  'secondary contact': 'secondary contact',
  'last client check-in date': 'last check-in',
  'baa signed date': 'BAA signed date',
  'company size': 'company size',
};
