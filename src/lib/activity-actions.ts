import type { ActivityTone } from './activity-sentence';

/** Actions emitted verbatim by the backend (no resource prefix). */
const KNOWN_ACTIONS = new Set([
  'created',
  'updated',
  'deleted',
  'applied',
  'approved',
  'rejected',
  'hired',
  'stage_changed',
  'status_changed',
  'eligibility_changed',
  'legal_hold_toggled',
  'ineligible_reapply_blocked',
  'pipeline_changed',
  'notes_updated',
  'disposition',
  'talent_pool_added',
  'talent_pool_removed',
  'parsed_data_updated',
  'ai_score_updated',
  'ai_validation_updated',
  'interview_scheduled',
  'interview_updated',
  'interview_cancelled',
  'interview_completed',
  'interview_no_show',
  'interview_feedback_submitted',
  'contact_added',
  'contact_updated',
  'contact_removed',
  'crm_profile_updated',
  'crm_client_account_updated',
  'va_profile_updated',
  'note_added',
  'note_updated',
  'note_deleted',
  'permissions_updated',
  'provisioned_va',
  'provisioned_client',
  'revoked_crm',
  'deactivated',
  'ended',
  'review_generated',
  'review_completed',
  'review_deleted',
  'scorecard_generated',
  'eod_submitted',
  'eod_deleted',
  'eod_compliance_checked',
  'survey_dispatched',
  'settings_updated',
  'email_sent',
  'email_received',
  'email_bounced',
  'email_failed',
  'login',
  'login_failed',
  'password_changed',
  'password_reset',
  'invite_accepted',
  'eod_updated',
  'review_updated',
  'review_regenerated',
  'review_exported',
  'survey_created',
  'survey_updated',
  'report_exported',
]);

/**
 * Actions produced by background jobs rather than a signed-in user. These are
 * checked before suffix-peeling, because a token like
 * `candidate_scoring_completed` would otherwise collapse to the generic
 * `completed` and lose its meaning.
 */
export const AI_ACTIONS = new Set([
  'parsed_data_updated',
  'ai_score_updated',
  'ai_validation_updated',
  'resume_parsing_completed',
  'resume_validation_completed',
  'candidate_scoring_completed',
  'candidacy_validation_completed',
]);

/**
 * Resolve a raw action token to a canonical key.
 *
 * Backend tokens are either bare (`stage_changed`) or resource-prefixed
 * (`candidate_created`, `client_contact_added`, `candidate_talent_pool_added`).
 * We scan suffixes longest-first so compound actions win over their tail:
 * `candidate_talent_pool_added` resolves to `talent_pool_added`, not `added`.
 */
export function resolveActionKey(action: string | null | undefined): string {
  const full = String(action ?? '').toLowerCase();
  if (!full) return '';
  if (isKnown(full)) return full;

  const segments = full.split('_');
  for (let i = 1; i < segments.length; i++) {
    const suffix = segments.slice(i).join('_');
    if (isKnown(suffix)) return suffix;
  }

  return full;
}

/**
 * True when the stored `action` is a token this build does not understand —
 * i.e. a historical row written before the current action vocabulary, or a
 * value the backend no longer produces.
 *
 * A *recognised* action carrying no metadata is NOT legacy: the switch above
 * already knows how to describe it.
 */
export function isUnknownAction(action: string | null | undefined): boolean {
  const key = resolveActionKey(action);
  return key === '' || !isKnown(key);
}

function isKnown(key: string): boolean {
  return KNOWN_ACTIONS.has(key) || AI_ACTIONS.has(key);
}

const SUCCESS_ACTIONS = new Set([
  'created',
  'approved',
  'hired',
  'interview_completed',
  'talent_pool_added',
  'eod_submitted',
  'review_completed',
  'provisioned_va',
  'provisioned_client',
  'contact_added',
  'note_added',
  'scorecard_generated',
]);

const DANGER_ACTIONS = new Set([
  'deleted',
  'rejected',
  'deactivated',
  'revoked_crm',
  'ineligible_reapply_blocked',
  'interview_cancelled',
  'interview_no_show',
  'ended',
  'review_deleted',
  'eod_deleted',
  'contact_removed',
  'note_deleted',
  'email_bounced',
  'email_failed',
  'login_failed',
]);

/**
 * Amber is reserved for events a reader should pause on — a legal hold, an
 * eligibility flip, or a disposition that did not end in the talent pool.
 * Ordinary edits stay teal so a long feed does not read as a warning list.
 */
const WARNING_ACTIONS = new Set(['legal_hold_toggled', 'eligibility_changed']);

const INFO_ACTIONS = new Set([
  'updated',
  'applied',
  'stage_changed',
  'status_changed',
  'pipeline_changed',
  'permissions_updated',
  'settings_updated',
  'interview_scheduled',
  'interview_updated',
  'interview_feedback_submitted',
  'notes_updated',
  'contact_updated',
  'note_updated',
  'crm_profile_updated',
  'crm_client_account_updated',
  'va_profile_updated',
  'talent_pool_removed',
  'survey_dispatched',
  'eod_compliance_checked',
]);

/** Actions performed by the AI engine — tinted violet, not user colours. */
const AI_TONE_ACTIONS = new Set([
  'ai_score_updated',
  'parsed_data_updated',
  'resume_parsing_completed',
  'resume_validation_completed',
  'candidate_scoring_completed',
]);

/**
 * Icon vocabulary for the badge on the actor avatar.
 *
 * The badge answers "what kind of thing happened?". It is deliberately
 * independent of `ActivityTone` (which drives colour only): the same icon may
 * appear in different tones — `arrow-left-right` is amber for a status change
 * and red for a permanent disposition — and a pass/fail AI verdict reuses
 * `badge-check` / `shield-x` rather than a generic sparkle.
 *
 * Keys are either a bare action (`hired`) or `<resourceType>:<action>` for an
 * action whose meaning depends on the entity (`candidate:created` is "added a
 * candidate", `job:created` is "created a job").
 */
export type ActivityIconName =
  // lifecycle
  | 'plus'
  | 'check'
  | 'check-double'
  | 'x'
  | 'ban'
  | 'trash'
  | 'file-plus'
  // change
  | 'pencil'
  | 'swap'
  | 'refresh'
  // pipeline
  | 'arrow-right'
  | 'branch'
  // interview
  | 'calendar-plus'
  | 'calendar-x'
  | 'calendar-check'
  | 'calendar-clock'
  | 'clipboard-check'
  | 'message-plus'
  // AI
  | 'sparkles'
  | 'scan'
  | 'badge-check'
  | 'shield-x'
  // people / client
  | 'user-plus'
  | 'user-check'
  | 'user-minus'
  | 'user-gear'
  | 'contact'
  | 'building'
  | 'handshake'
  // work
  | 'star'
  | 'star-off'
  | 'briefcase'
  | 'circle-play'
  | 'circle-pause'
  | 'timer-off'
  | 'gauge'
  | 'wallet'
  | 'notes'
  | 'pen-line'
  | 'mail'
  | 'settings'
  | 'lock'
  | 'unlock'
  | 'shield-check'
  | 'alert'
  | 'activity';

/** Icons keyed by `<resourceType>:<action>`, checked before the bare action. */
const ICON_BY_RESOURCE_ACTION: Record<string, ActivityIconName> = {
  'candidate:created': 'user-plus',
  'candidate:deleted': 'user-minus',
  'candidate:status_changed': 'user-check',
  'candidate:eligibility_changed': 'alert',
  'candidate:legal_hold_toggled': 'lock',
  'candidate:talent_pool_added': 'star',
  'candidate:talent_pool_removed': 'star-off',
  'candidate:scorecard_generated': 'star',
  'client:created': 'building',
  'client:deleted': 'building',
  'client:crm_profile_updated': 'handshake',
  'client:crm_client_account_updated': 'handshake',
  'job:created': 'briefcase',
  'job:deleted': 'briefcase',
  'job:pipeline_changed': 'branch',
  'job:status_changed': 'swap',
  'user:created': 'user-plus',
  'user:deactivated': 'user-minus',
  'user:permissions_updated': 'user-gear',
  'user:provisioned_va': 'shield-check',
  'user:provisioned_client': 'handshake',
  'user:revoked_crm': 'shield-x',
  'assignment:created': 'circle-play',
  'assignment:ended': 'circle-pause',
  'assignment:status_changed': 'refresh',
  'tag:created': 'plus',
  'tag:updated': 'pencil',
  'tag:deleted': 'trash',
  'work_entry:created': 'notes',
  'work_entry:updated': 'pen-line',
  'work_entry:deleted': 'trash',
  'eod:eod_submitted': 'notes',
  'eod:eod_deleted': 'trash',
  'survey:survey_dispatched': 'mail',
  'settings:settings_updated': 'settings',
};

/** Icons keyed by action alone, used when no entity-specific entry matches. */
const ICON_BY_ACTION: Record<string, ActivityIconName> = {
  // lifecycle
  created: 'plus',
  approved: 'check',
  rejected: 'x',
  hired: 'check-double',
  cancelled: 'ban',
  deleted: 'trash',
  deactivated: 'user-minus',
  ended: 'circle-pause',

  // change
  updated: 'pencil',
  notes_updated: 'notes',
  status_changed: 'swap',
  stage_changed: 'arrow-right',
  job_changed: 'branch',
  pipeline_changed: 'branch',
  eligibility_changed: 'alert',
  legal_hold_toggled: 'lock',

  // applications
  applied: 'file-plus',
  ineligible_reapply_blocked: 'shield-x',
  disposition: 'ban',
  talent_pool_added: 'star',
  talent_pool_removed: 'star-off',

  // interviews
  interview_scheduled: 'calendar-plus',
  interview_updated: 'calendar-clock',
  interview_cancelled: 'calendar-x',
  interview_completed: 'calendar-check',
  interview_no_show: 'calendar-x',
  interview_feedback_submitted: 'clipboard-check',
  scorecard_generated: 'star',

  // AI
  ai_score_updated: 'sparkles',
  ai_validation_updated: 'sparkles',
  parsed_data_updated: 'scan',
  resume_parsing_completed: 'scan',
  resume_validation_completed: 'scan',
  candidate_scoring_completed: 'sparkles',
  candidacy_validation_completed: 'sparkles',

  // people / clients
  contact_added: 'contact',
  contact_updated: 'contact',
  contact_removed: 'user-minus',
  crm_profile_updated: 'handshake',
  crm_client_account_updated: 'handshake',
  va_profile_updated: 'user-gear',
  permissions_updated: 'user-gear',
  provisioned_va: 'shield-check',
  provisioned_client: 'handshake',
  revoked_crm: 'shield-x',

  // notes / comms
  note_added: 'message-plus',
  note_updated: 'pencil',
  note_deleted: 'trash',
  survey_dispatched: 'mail',

  // work / reviews
  review_generated: 'gauge',
  review_completed: 'check',
  review_deleted: 'trash',
  eod_submitted: 'notes',
  eod_deleted: 'trash',
  eod_compliance_checked: 'shield-check',
  settings_updated: 'settings',

  // email (derived from the emails collection, not logged)
  email_sent: 'mail',
  email_received: 'message-plus',
  email_bounced: 'alert',
  email_failed: 'alert',

  // sign-in, account security and admin work
  login: 'user-check',
  login_failed: 'shield-x',
  password_changed: 'lock',
  password_reset: 'lock',
  invite_accepted: 'user-plus',
  eod_updated: 'pen-line',
  review_updated: 'pen-line',
  review_regenerated: 'sparkles',
  review_exported: 'notes',
  survey_created: 'mail',
  survey_updated: 'mail',
  report_exported: 'notes',
};

/**
 * Resolve the badge icon for one log entry.
 *
 * A pass/fail AI verdict and a non-permanent disposition are decided from
 * metadata, because the outcome — not the action — is what the reader needs.
 */
export function resolveActivityIcon(
  key: string,
  resourceType: string,
  flags: { isValid: boolean | null; destination: string | null }
): ActivityIconName {
  if (
    key === 'ai_validation_updated' ||
    key === 'candidacy_validation_completed'
  ) {
    if (flags.isValid === true) return 'badge-check';
    if (flags.isValid === false) return 'shield-x';
    return 'sparkles';
  }
  // Only a terminal disposition gets the hard "ban"; a move to the pool is a
  // transition, not a rejection.
  if (key === 'disposition') {
    return flags.destination === 'permanently_ineligible' ? 'ban' : 'star';
  }

  return (
    ICON_BY_RESOURCE_ACTION[`${resourceType}:${key}`] ??
    ICON_BY_ACTION[key] ??
    'activity'
  );
}

export function resolveTone(
  key: string,
  flags: { isValid: boolean | null; destination: string | null }
): ActivityTone {
  // An AI validity verdict reads as a pass/fail, not as a neutral AI event.
  if (
    key === 'ai_validation_updated' ||
    key === 'candidacy_validation_completed'
  ) {
    if (flags.isValid === true) return 'success';
    if (flags.isValid === false) return 'danger';
    return 'ai';
  }
  if (AI_TONE_ACTIONS.has(key)) return 'ai';
  // A permanent disposition is terminal; a move to the pool is not.
  if (key === 'disposition') {
    return flags.destination === 'permanently_ineligible'
      ? 'danger'
      : 'warning';
  }
  if (DANGER_ACTIONS.has(key)) return 'danger';
  if (SUCCESS_ACTIONS.has(key)) return 'success';
  if (WARNING_ACTIONS.has(key)) return 'warning';
  if (INFO_ACTIONS.has(key)) return 'info';
  return 'neutral';
}
