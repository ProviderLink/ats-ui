/**
 * Presentation layer for activity logs.
 *
 * The backend records machine tokens (`stage_changed`, `candidate_created`)
 * plus structured `metadata`. This module turns one log entry into a single
 * human sentence of the form:
 *
 *   `{actor} {text}` + optional `detail`
 *   e.g. "Cyril Thomas moved the candidate from Phone Screen to Offer"
 *
 * It is deliberately pure — no React, no stores — so it can be unit tested
 * and reused by any surface. The caller resolves the actor (see
 * `useActivityActors`) and passes it in.
 */
import { htmlToPlainText } from '@/lib/html';
import type { ActivityLog } from '@/store/types';
import { INTERVIEW_MEETING_TYPE_LABELS } from '@/store/types/enums';

/** Where an event came from when it has no `performedBy` user. */
export type ActivityActorKind = 'user' | 'ai' | 'system';

export interface ActivityActor {
  kind: ActivityActorKind;
  /** `_id` of the performing user, or `null` for AI / system events. */
  id: string | null;
  /** Display name — "Cyril Thomas", "AI", "System". */
  name: string;
  avatar: string | null;
  /** True when the performer is the signed-in user (rendered as "You"). */
  isViewer: boolean;
  initials: string;
}

/** Semantic tone of an event. Drives the accent colour of the row. */
export type ActivityTone =
  | 'neutral'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'ai';

export interface ActivitySentence {
  /** Leading name clause. `null` for impersonal events ("Application submitted"). */
  actor: string | null;
  /** The main clause, without the actor. Never empty. */
  text: string;
  /** Optional supporting line: rejection reason, changes, counts. */
  detail: string | null;
  tone: ActivityTone;
  /** Glyph for the badge on the actor avatar — "what kind of event". */
  icon: ActivityIconName;
  /**
   * True when the stored action could not be interpreted (a historical row
   * written before the current action vocabulary). The timeline uses this to
   * render an "unknown event" badge instead of implying a known event kind.
   */
  isLegacy: boolean;
}

// ── metadata readers ───────────────────────────────────────────────────────

/**
 * Longest value we will ever print for a single metadata field. Anything
 * longer (job descriptions, notes, pasted paragraphs) is clipped on a word
 * boundary — a supporting line should be readable at a glance, not scrolled.
 */
const MAX_VALUE_CHARS = 64;

/** Hard cap for the assembled supporting line under the sentence. */
const MAX_DETAIL_LINE = 96;

/**
 * Longest value we still show in a `from → to` comparison. Beyond this the
 * comparison is noise (a 40-character-plus blob on each side), so we fall back
 * to naming the field only.
 */
const MAX_COMPARABLE_CHARS = 36;

/** How many field changes are listed before collapsing into "(+N more)". */
const MAX_CHANGES_SHOWN = 2;

/** Strip HTML, collapse whitespace and trim — no truncation. */
function sanitizePlain(value: string): string {
  return htmlToPlainText(value).replace(/\s+/g, ' ').trim();
}

/** Remove the wrapping quotes the backend adds around compared values. */
function stripQuotes(value: string): string {
  return value.replace(/^["']+|["']+$/g, '').trim();
}

/** Shorten to `max` characters, preferring to break on a word boundary. */
function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  const clipped = value.slice(0, max);
  const lastSpace = clipped.lastIndexOf(' ');
  const body = lastSpace > max * 0.6 ? clipped.slice(0, lastSpace) : clipped;
  return `${body.trim()}\u2026`;
}

/**
 * Sanitise a value coming from `metadata` for display: strip any HTML the
 * backend embedded (job descriptions, notes) and cap the length so a single
 * entry can never blow up the row.
 */
function clean(value: string): string {
  return truncate(sanitizePlain(value), MAX_VALUE_CHARS);
}

function str(value: unknown): string | null {
  if (typeof value === 'string' && value.trim() !== '') return clean(value);
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function strArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is string => typeof v === 'string' && v.trim() !== ''
  );
}

/** Turn a machine enum (`permanently_ineligible`) into prose. */
function humanEnum(value: string): string {
  const spaced = value.replace(/_/g, ' ');
  return /^[a-z]/.test(spaced) ? spaced : spaced.toLowerCase();
}

/** Prefer a typed label over the raw enum when we have one. */
function interviewTypeLabel(value: string | null): string | null {
  if (!value) return null;
  return INTERVIEW_TYPE_LABELS[value] ?? humanEnum(value);
}

/**
 * Wording for an interview kind, avoiding "Technical Interview interview":
 * `Technical Interview` → "a Technical interview",
 * `Initial Screening` → "an Initial Screening interview".
 */
function interviewTypePhrase(label: string): string {
  const base = label.replace(/\s+interview$/i, '') || label;
  // Acronyms (HR, QA) take "an" despite the consonant letter.
  const article =
    /^[A-Z]{2,}/.test(base) || /^[aeiou]/i.test(base) ? 'an' : 'a';
  return `${article} ${base} interview`;
}

const INTERVIEW_TYPE_LABELS: Record<string, string> =
  INTERVIEW_MEETING_TYPE_LABELS;

/** Capitalise the first character only — keeps acronyms like "AI" intact. */
function upperFirst(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Read the first present key from metadata. */
function pick(
  metadata: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = str(metadata[key]);
    if (value) return value;
  }
  return null;
}

// ── action resolution ──────────────────────────────────────────────────────

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
const AI_ACTIONS = new Set([
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

// ── tone ───────────────────────────────────────────────────────────────────

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
function resolveActivityIcon(
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

function resolveTone(
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

// ── shared phrases ─────────────────────────────────────────────────────────

const RESOURCE_LABEL: Record<string, string> = {
  candidate: 'the candidate',
  job: 'the job',
  client: 'the client',
  application: 'the application',
  interview: 'the interview',
  user: 'the user',
  assignment: 'the assignment',
  tag: 'the tag',
  work_entry: 'the work entry',
  eod: 'the EOD report',
  performance_review: 'the performance review',
  settings: 'the workspace settings',
  pipeline_template: 'the pipeline template',
  email_template: 'the email template',
  report: 'a report',
};

function resourceLabel(resourceType: string): string {
  if (!resourceType) return 'this record';
  return (
    RESOURCE_LABEL[resourceType] ?? `the ${resourceType.replace(/_/g, ' ')}`
  );
}

/**
 * Keys that only repeat what the sentence already says, or expose raw ids.
 * Used when falling back to generic metadata for an unrecognised action.
 */
const NOISE_KEYS = new Set([
  '_id',
  'id',
  'resourceId',
  'resourceType',
  'relatedId',
  'relatedType',
  'createdAt',
  'updatedAt',
  'changes',
  'provider',
  'jobId',
  'candidateId',
  'applicationId',
  'clientId',
  'userId',
  'performedBy',
  'performerName',
  // Consumed by the dedicated stage/status handlers; showing them again as
  // generic chips would duplicate the sentence.
  'from',
  'to',
  'oldStatus',
  'newStatus',
  'fromStatus',
  'fromStage',
  'toStage',
  'fromStageName',
  'toStageName',
  'stageName',
  'status',
  'stageId',
]);

/**
 * Turn a metadata key into a label: `stageName` → `Stage name`,
 * `isBlocked` → `Is blocked`.
 */
function humanKey(key: string): string {
  return upperFirst(
    key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/_/g, ' ')
  );
}

/**
 * Fallback for an action token we do not recognise (typically a historical row
 * written before the current action vocabulary). Rather than inventing a verb
 * from the token, surface whatever metadata the entry does carry.
 */
function describeGenericMetadata(
  metadata: Record<string, unknown>
): string | null {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(metadata)) {
    if (NOISE_KEYS.has(key)) continue;
    if (value === null || value === undefined || value === '') continue;

    // Booleans and numbers read best as `Key: yes` / `Key: 3`. A `false`
    // boolean is skipped — "Legal hold: no" adds nothing on a row we cannot
    // otherwise interpret.
    let rendered: string | null = null;
    if (typeof value === 'boolean') {
      if (value) rendered = 'yes';
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      rendered = String(value);
    } else if (typeof value === 'string') {
      rendered = truncate(sanitizePlain(value), MAX_VALUE_CHARS);
    }
    if (!rendered) continue;

    parts.push(`${humanKey(key)}: ${rendered}`);
    if (parts.length === MAX_CHANGES_SHOWN) break;
  }
  return parts.length > 0 ? parts.join(' \u00b7 ') : null;
}

/**
 * Most backend change strings are `"<Field> changed from \"<old>\" to \"<new>\""`.
 * Group 2 is greedy so a value that itself contains ` to ` still parses.
 */
const CHANGE_PATTERN =
  /^(.*?)\s+changed\s+from\s+["']?(.*)["']?\s+to\s+["']?(.*?)["']?$/s;

/**
 * Reduce one backend change string to something a reader can scan.
 *
 * The backend interpolates the raw old and new values, which for fields like
 * `description` is the entire job description. We therefore never echo a long
 * value: short scalars keep their `from → to` comparison (genuinely useful for
 * a status, date or duration), everything else collapses to the field name.
 *
 *   `Description changed from "<h1>POSITION OVERVIEW…" to "<h1>New…"`
 *     → `Description changed`
 *   `Status changed from "open" to "closed"`
 *     → `Status: open → closed`
 */
function describeChange(raw: string): string {
  const match = CHANGE_PATTERN.exec(raw);
  if (match) {
    const field = upperFirst(sanitizePlain(match[1] ?? ''));
    const from = stripQuotes(sanitizePlain(match[2] ?? ''));
    const to = stripQuotes(sanitizePlain(match[3] ?? ''));

    if (!field) return 'Details changed';

    const comparable =
      from !== '' &&
      to !== '' &&
      from.length <= MAX_COMPARABLE_CHARS &&
      to.length <= MAX_COMPARABLE_CHARS;

    return comparable ? `${field}: ${from} \u2192 ${to}` : `${field} changed`;
  }

  // Changes that carry no before/after pair: "Phone number updated",
  // "Tags updated", "Interviewer(s) updated".
  const plain = sanitizePlain(raw);
  return plain ? upperFirst(truncate(plain, MAX_VALUE_CHARS)) : '';
}

/** Compact, readable rendering of the `changes` array the backend records. */
function describeChanges(changes: string[]): string | null {
  const rendered = changes.map(describeChange).filter(change => change !== '');
  if (rendered.length === 0) return null;

  const shown = rendered.slice(0, MAX_CHANGES_SHOWN);
  const extra = rendered.length - shown.length;
  const joined = shown.join(' \u00b7 ');
  return extra > 0 ? `${joined} (+${extra} more)` : joined;
}

/** Lower-case the first letter, leaving acronyms (`CRM`, `AI`) alone. */
function lowerFirst(value: string): string {
  return /^[A-Z]{2,}/.test(value)
    ? value
    : value.charAt(0).toLowerCase() + value.slice(1);
}

/** `a`, `a and b`, `a, b and c` — or `a, b and 2 more` for long lists. */
function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length > 3) {
    return `${items[0]}, ${items[1]} and ${items.length - 2} more`;
  }
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

interface ChangeSummary {
  /** Complete clause, e.g. "changed the website and industry". */
  headline: string;
  /** Just the field list, e.g. "website and industry". */
  fields: string;
  /** Optional second line with short before → after values. */
  detail: string | null;
}

/**
 * Reduce the backend's `changes` strings to what a reader needs: WHICH fields
 * changed (and, for a single short value, from what to what).
 *
 *   ['Website updated', 'Industry changed from "A" to "B"']
 *     → headline "changed website and industry", detail "Industry: A → B"
 */
function summariseChanges(changes: string[]): ChangeSummary | null {
  const fields: string[] = [];
  const phrases: string[] = [];
  const pairs: { field: string; from: string; to: string }[] = [];

  for (const raw of changes) {
    const match = CHANGE_PATTERN.exec(raw);
    if (match) {
      const field = lowerFirst(sanitizePlain(match[1] ?? ''));
      if (!field) continue;
      fields.push(field);
      const from = stripQuotes(sanitizePlain(match[2] ?? ''));
      const to = stripQuotes(sanitizePlain(match[3] ?? ''));
      if (
        from &&
        to &&
        from.length <= MAX_COMPARABLE_CHARS &&
        to.length <= MAX_COMPARABLE_CHARS
      ) {
        pairs.push({ field, from, to });
      }
      continue;
    }
    const plain = sanitizePlain(raw);
    if (!plain) continue;
    const stripped = plain.replace(/\s+(updated|changed|removed)$/i, '');
    if (stripped !== plain) {
      fields.push(lowerFirst(truncate(stripped, MAX_VALUE_CHARS)));
    } else {
      phrases.push(lowerFirst(truncate(plain, MAX_VALUE_CHARS)));
    }
  }

  if (fields.length === 0 && phrases.length === 0) return null;

  const list = joinList(fields);
  const only = pairs[0];
  if (fields.length === 1 && phrases.length === 0 && only) {
    return {
      headline: `changed ${only.field} from ${only.from} to ${only.to}`,
      fields: list,
      detail: null,
    };
  }

  const parts = [fields.length > 0 ? `changed ${list}` : null, ...phrases];
  const detail =
    pairs.length > 0
      ? pairs
          .slice(0, MAX_CHANGES_SHOWN)
          .map(p => `${upperFirst(p.field)}: ${p.from} \u2192 ${p.to}`)
          .join(' \u00b7 ')
      : null;
  return {
    headline: parts.filter(Boolean).join(', '),
    fields: list,
    detail,
  };
}

/** `82/100` when the score sits on a 0-100 scale, otherwise the raw value. */
function formatScore(score: number | null): string | null {
  if (score === null) return null;
  return score >= 0 && score <= 100 ? `${score}/100` : String(score);
}

// ── main builder ───────────────────────────────────────────────────────────

/**
 * Turn one activity log entry into a sentence.
 *
 * Precedence per action:
 *   1. Structured `metadata` (richest — from/to, reason, scores, counts).
 *   2. A stored `description` (written by the service when metadata is thin).
 *   3. A generic fallback built from the resource type.
 */
/** "a call note", "an email note", "a note" — from the note's contact method. */
function noteLabel(method: string | null): string {
  if (!method || method === 'other') return 'a note';
  return `${/^[aeiou]/i.test(method) ? 'an' : 'a'} ${method} note`;
}

/**
 * Rejection reasons are logged under the `settings` resource with their label
 * and category as metadata. Name the reason instead of "the workspace settings".
 */
function describeReason(
  verb: string,
  metadata: Record<string, unknown>
): { text: string; detail: string | null } | null {
  const label = str(metadata['label']);
  if (!label) return null;
  const category = str(metadata['category']);
  return {
    text: `${verb} the rejection reason \u201c${label}\u201d`,
    detail: category ? `Category: ${humanEnum(category)}` : null,
  };
}

export interface ActivityContext {
  /** Job title for a job id, when the jobs are loaded. */
  jobTitle?: (id: string) => string | null;
  /** IANA zone used to print interview times (the company timezone). */
  timeZone?: string;
}

/** "OpenAI" / "Claude" for the engine that produced an AI entry. */
function providerLabel(value: string | null): string | null {
  if (!value) return null;
  if (value.toLowerCase() === 'openai') return 'OpenAI';
  if (value.toLowerCase() === 'claude') return 'Claude';
  return upperFirst(value);
}

/** "Tue, Oct 14, 14:30" in the given zone; null when the value is unusable. */
function formatWhen(value: unknown, timeZone?: string): string | null {
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };
  try {
    return new Intl.DateTimeFormat(LOCALE, { ...options, timeZone }).format(
      date
    );
  } catch {
    return new Intl.DateTimeFormat(LOCALE, options).format(date);
  }
}

/** Short label for what an outbound email was, from its template context. */
const EMAIL_KIND_TEXT: Record<string, string> = {
  offer: 'sent an offer email',
  rejection: 'sent a rejection email',
  interview: 'sent an interview email',
  follow_up: 'sent a follow-up email',
  application_confirmation: 'sent the application confirmation',
};

export function buildActivitySentence(
  log: ActivityLog,
  actor: ActivityActor,
  ctx: ActivityContext = {}
): ActivitySentence {
  const key = resolveActionKey(log.action);
  const metadata = (log.metadata ?? {}) as Record<string, unknown>;
  const changes = strArray(metadata['changes']);
  const isValidRaw = metadata['isValid'];
  const isValid = typeof isValidRaw === 'boolean' ? isValidRaw : null;

  const tone = resolveTone(key, {
    isValid,
    destination: str(metadata['destination']),
  });
  const icon = resolveActivityIcon(key, log.resourceType, {
    isValid,
    destination: str(metadata['destination']),
  });
  // A recognised action is never legacy, even when it carries no metadata —
  // the switch below knows exactly what happened.
  const isLegacy = isUnknownAction(log.action);
  const actorName = actor.isViewer ? 'You' : actor.name;

  /** Assemble a short supporting line, never exceeding `MAX_DETAIL_LINE`. */
  const detail = (value: string | null) =>
    value ? truncate(value, MAX_DETAIL_LINE) : null;

  /**
   * Actions that legitimately have no human actor. "System" is truthful for
   * these — a scheduler ran them, or the platform blocked a reapply.
   */
  const SYSTEM_ATTRIBUTABLE = new Set([
    'eod_compliance_checked',
    'survey_dispatched',
    'ineligible_reapply_blocked',
  ]);

  /**
   * Whether crediting an actor is truthful for this entry.
   *
   * A row with no `performedBy` has an `actor.kind` of `ai` or `system`, which
   * used to be rendered literally — so a candidate submitting their own
   * application appeared as "System added the candidate", and an admin's edit
   * whose actor was never recorded appeared as "System updated the candidate".
   * Both are false. An actor is only named when it genuinely performed the
   * action; otherwise the event is stated without one.
   */
  const showActor =
    actor.kind === 'user' ||
    (actor.kind === 'ai' && AI_ACTIONS.has(key)) ||
    (actor.kind === 'system' && SYSTEM_ATTRIBUTABLE.has(key));

  const finish = (text: string, extra?: string | null): ActivitySentence => ({
    actor: showActor ? actorName : null,
    text,
    detail: detail(extra ?? describeChanges(changes)),
    tone,
    icon,
    isLegacy,
  });

  /**
   * Render without any actor clause. Used where a different phrasing is needed
   * as well as the actor being omitted.
   */
  const impersonal = (
    text: string,
    extra?: string | null
  ): ActivitySentence => ({
    actor: null,
    text,
    detail: detail(extra ?? describeChanges(changes)),
    tone,
    icon,
    isLegacy,
  });

  /** True when no person can be credited for this event. */
  const unattributed = actor.kind !== 'user';

  switch (key) {
    // ── Pipeline / application lifecycle ─────────────────────────────
    case 'stage_changed': {
      // Two key generations exist in the data: `{ from, to }` and
      // `{ fromStageName, toStageName }`. Accept both.
      const from = pick(metadata, 'from', 'fromStage', 'fromStageName');
      const to = pick(
        metadata,
        'to',
        'toStage',
        'toStageName',
        'stageName',
        'stage'
      );
      if (from && to) {
        return finish(`moved from ${from} to ${to}`);
      }
      if (to) return finish(`moved to ${to}`);
      return finish('changed the stage');
    }

    case 'applied': {
      const source = str(metadata['source']);
      if (source === 'assigned') {
        return finish('assigned the candidate to this job');
      }
      if (source === 'internal_upload') {
        return finish('added the candidate to this job');
      }
      return finish('submitted an application');
    }

    case 'ineligible_reapply_blocked': {
      return finish('blocked a re-application', 'Permanently ineligible');
    }

    case 'approved': {
      const stageName = pick(metadata, 'stageName');
      const aiScore = formatScore(num(metadata['aiScore']));
      return finish(
        stageName
          ? `approved the candidate into ${stageName}`
          : 'approved the application',
        aiScore ? `AI score at approval: ${aiScore}` : ''
      );
    }

    case 'rejected': {
      const reason = pick(metadata, 'reason', 'rejectionReason');
      const destination = str(metadata['destination']);
      const lastStage = pick(metadata, 'lastStage');

      // The destination is only present on the candidate's last live
      // application; say where they went on the detail line.
      const parts = [
        reason ? `Reason: ${reason}` : null,
        destination === 'permanently_ineligible'
          ? 'Permanently ineligible'
          : destination === 'candidate_pool'
            ? 'Moved to talent pool'
            : null,
        lastStage ? `Last stage: ${lastStage}` : null,
      ].filter(Boolean);

      return finish(
        'rejected the application',
        parts.length > 0 ? parts.join(' \u00b7 ') : null
      );
    }

    case 'job_changed': {
      // A move, not a rejection — the recruiter needs to see where the
      // candidate went without it reading as a rejection.
      const movedTo = pick(metadata, 'movedToJobTitle');
      const lastStage = pick(metadata, 'lastStage');

      const parts = [
        movedTo ? `Now on: ${movedTo}` : null,
        lastStage ? `Left at: ${lastStage}` : null,
      ].filter(Boolean);

      return finish(
        metadata['movedToTalentPool'] === true
          ? 'moved the candidate to the talent pool'
          : 'moved the candidate to another job',
        parts.length > 0 ? parts.join(' \u00b7 ') : null
      );
    }

    case 'hired':
      return finish('hired the candidate');

    case 'disposition': {
      const destination = str(metadata['destination']);
      const reasonLabel = pick(metadata, 'reasonLabel');
      const lastStage = pick(metadata, 'lastStage');

      // Internal notes can be a paragraph; the reason, the destination and the
      // last stage are what a reader actually needs.
      const parts = [
        reasonLabel ? `Reason: ${reasonLabel}` : null,
        destination === 'permanently_ineligible'
          ? 'Permanently ineligible'
          : destination === 'candidate_pool'
            ? 'Moved to talent pool'
            : null,
        lastStage ? `Last stage: ${lastStage}` : null,
      ].filter(Boolean);

      return finish(
        'closed the application',
        parts.length > 0 ? parts.join(' \u00b7 ') : null
      );
    }

    case 'notes_updated':
      return finish('updated the application notes');

    case 'deleted': {
      if (log.resourceType === 'settings') {
        const reason = describeReason('deleted', metadata);
        if (reason) return finish(reason.text, reason.detail ?? '');
      }
      if (
        log.resourceType === 'pipeline_template' ||
        log.resourceType === 'email_template'
      ) {
        const name = pick(metadata, 'name');
        return finish(
          `deleted ${resourceLabel(log.resourceType)}${name ? ` \u201c${name}\u201d` : ''}`
        );
      }
      if (log.resourceType === 'user') {
        const name = pick(metadata, 'name');
        const roles = strArray(metadata['roles']);
        return finish(
          name ? `removed the team member ${name}` : 'removed a team member',
          roles.length > 0
            ? `Roles: ${roles.map(r => humanEnum(r)).join(', ')}`
            : ''
        );
      }
      return finish(`deleted ${resourceLabel(log.resourceType)}`);
    }

    // ── Candidate profile ────────────────────────────────────────────
    case 'created':
      if (log.relatedType === 'interview_scorecard') {
        const overall = num(metadata['overallScore']);
        return finish(
          'created an interview scorecard',
          overall !== null ? `Overall score: ${overall}/100` : null
        );
      }
      if (log.resourceType === 'candidate') {
        const source = str(metadata['source']);
        const appliedJobId = str(metadata['appliedJobId']);
        const job = appliedJobId ? (ctx.jobTitle?.(appliedJobId) ?? null) : null;
        const forJob = job ? ` for ${job}` : '';
        // A candidate created by a public application submitted it themselves;
        // there is no user to credit, so state the event without an actor
        // rather than crediting "System".
        if (source === 'applied' || source === 'direct_apply') {
          return unattributed
            ? impersonal(`the candidate applied${forJob}`)
            : finish(`added the candidate${forJob}`);
        }
        if (source === 'internal_upload')
          return finish(`uploaded the candidate${forJob}`);
        if (source === 'assigned') return finish('assigned the candidate');
        return finish(`added the candidate${forJob}`);
      }
      if (log.resourceType === 'user') {
        const roles = strArray(metadata['roles']);
        return finish(
          'invited a team member',
          roles.length > 0
            ? `Roles: ${roles.map(r => humanEnum(r)).join(', ')}`
            : null
        );
      }
      if (log.resourceType === 'settings') {
        const reason = describeReason('added', metadata);
        if (reason) return finish(reason.text, reason.detail ?? '');
      }
      if (
        log.resourceType === 'pipeline_template' ||
        log.resourceType === 'email_template'
      ) {
        const name = pick(metadata, 'name');
        return finish(
          `created ${resourceLabel(log.resourceType)}${name ? ` \u201c${name}\u201d` : ''}`
        );
      }
      if (log.resourceType === 'tag') return finish('created the tag');
      if (log.resourceType === 'assignment')
        return finish('created the assignment');
      if (log.resourceType === 'work_entry')
        return finish('logged a work entry');
      return finish(`created ${resourceLabel(log.resourceType)}`);

    case 'updated': {
      if (log.relatedType === 'interview_scorecard') {
        const overall = num(metadata['overallScore']);
        return finish(
          'updated an interview scorecard',
          overall !== null ? `Overall score: ${overall}/100` : null
        );
      }
      // Historical rows recorded a job status change as a generic `updated`
      // with `{ oldStatus, newStatus }`. Name it as the status change it is.
      const fromStatus = pick(metadata, 'oldStatus', 'fromStatus');
      const toStatus = pick(metadata, 'newStatus');
      if (fromStatus && toStatus) {
        return finish(
          `changed ${resourceLabel(log.resourceType)} status from ` +
            `${humanEnum(fromStatus)} to ${humanEnum(toStatus)}`
        );
      }
      if (log.resourceType === 'settings') {
        const reason = describeReason(
          metadata['deactivated'] === true ? 'deactivated' : 'edited',
          metadata
        );
        if (reason) return finish(reason.text, reason.detail ?? '');
      }
      const edit = summariseChanges(changes);
      if (edit) {
        const templateName =
          log.resourceType === 'pipeline_template' ||
          log.resourceType === 'email_template'
            ? pick(metadata, 'name')
            : null;
        const detailLine = [
          edit.detail,
          templateName ? `Template: ${templateName}` : null,
        ]
          .filter(Boolean)
          .join(' \u00b7 ');
        return finish(edit.headline, detailLine);
      }
      if (log.resourceType === 'tag') return finish('renamed the tag');
      if (log.resourceType === 'user')
        return finish('edited the team member');
      if (log.resourceType === 'assignment')
        return finish('edited the assignment');
      if (log.resourceType === 'work_entry')
        return finish('edited a work entry');
      break; // description (if any) is rendered by the fallback below
    }

    case 'status_changed': {
      // Key generations: `{ from, to }` and `{ oldStatus, newStatus }`.
      const from = pick(metadata, 'from', 'oldStatus', 'fromStatus');
      const to = pick(metadata, 'to', 'newStatus', 'status');
      return finish(
        from && to
          ? `changed status from ${humanEnum(from)} to ${humanEnum(to)}`
          : to
            ? `changed status to ${humanEnum(to)}`
            : 'changed the status'
      );
    }

    case 'eligibility_changed': {
      const to = pick(metadata, 'to');
      if (to === 'permanently_ineligible') {
        return finish('marked the candidate as permanently ineligible');
      }
      return finish('restored the candidate\u2019s eligibility');
    }

    case 'legal_hold_toggled': {
      const held = metadata['legalHold'] === true;
      return finish(
        held
          ? 'placed a legal hold on the candidate'
          : 'released the legal hold on the candidate'
      );
    }

    case 'talent_pool_added':
      return finish('added the candidate to the talent pool');

    case 'talent_pool_removed':
      return finish('removed the candidate from the talent pool');

    case 'parsed_data_updated': {
      const counts: string[] = [];
      const skills = num(metadata['skillsCount']);
      const experience = num(metadata['experienceCount']);
      const education = num(metadata['educationCount']);
      if (skills) counts.push(`${skills} skills`);
      if (experience) counts.push(`${experience} experience`);
      if (education) counts.push(`${education} education`);
      return finish(
        'parsed the resume',
        counts.length > 0 ? `Extracted ${counts.join(' \u00b7 ')}` : null
      );
    }

    case 'ai_score_updated':
    case 'candidate_scoring_completed': {
      const score = formatScore(num(metadata['score']));
      const recommendation = pick(metadata, 'recommendation');
      const engine = providerLabel(pick(metadata, 'provider'));
      const parts = [
        recommendation ? `Recommendation: ${humanEnum(recommendation)}` : null,
        engine ? `by ${engine}` : null,
      ].filter(Boolean);
      return finish(
        score ? `scored the candidate ${score}` : 'scored the candidate',
        parts.join(' \u00b7 ')
      );
    }

    case 'ai_validation_updated':
    case 'candidacy_validation_completed':
    case 'resume_validation_completed': {
      // `metadata.reason` is the AI's full rationale — 99–258 characters of
      // prose. It belongs on the candidate's validation panel, not in a
      // timeline, where it drowns the event it is describing.
      const score = formatScore(num(metadata['score']));
      const engine = providerLabel(pick(metadata, 'provider'));
      const reason = pick(metadata, 'reason');
      // A flagged application is worth knowing the why of; a passing one only
      // needs its score.
      const detailLine =
        isValid === false && reason
          ? `Reason: ${reason}`
          : [score ? `Score: ${score}` : null, engine ? `by ${engine}` : null]
              .filter(Boolean)
              .join(' \u00b7 ') || null;
      if (isValid === true) {
        return finish('validated the application as eligible', detailLine);
      }
      if (isValid === false) {
        return finish('flagged the application as ineligible', detailLine);
      }
      return finish('validated the application', detailLine);
    }

    case 'resume_parsing_completed': {
      const skills = num(metadata['skillsCount']);
      const experience = num(metadata['experienceCount']);
      const counts: string[] = [];
      if (skills) counts.push(`${skills} skills`);
      if (experience) counts.push(`${experience} experience`);
      return finish(
        'finished parsing the resume',
        counts.length > 0 ? `Extracted ${counts.join(' \u00b7 ')}` : null
      );
    }

    // ── Interviews ───────────────────────────────────────────────────
    case 'interview_scheduled': {
      const label = interviewTypeLabel(pick(metadata, 'interviewType'));
      const jobTitle = pick(metadata, 'jobTitle');
      const what = label ? interviewTypePhrase(label) : 'an interview';
      const when = formatWhen(metadata['scheduledAt'], ctx.timeZone);
      return finish(
        jobTitle ? `scheduled ${what} for ${jobTitle}` : `scheduled ${what}`,
        when ? `On ${when}` : ''
      );
    }

    case 'interview_updated': {
      const edit = summariseChanges(changes);
      return edit
        ? finish(edit.headline, edit.detail ?? '')
        : finish('edited the interview');
    }

    case 'interview_cancelled':
      return finish('cancelled the interview');

    case 'interview_completed':
      return finish('completed the interview');

    case 'interview_no_show':
      return finish('marked the interview as a no-show');

    case 'interview_feedback_submitted': {
      const rating = num(metadata['rating']);
      const recommendation = pick(metadata, 'recommendation');
      const parts = [
        rating !== null ? `Rating: ${rating}` : null,
        recommendation ? `Recommendation: ${humanEnum(recommendation)}` : null,
      ].filter(Boolean);
      return finish(
        'submitted interview feedback',
        parts.join(' \u00b7 ') || null
      );
    }

    case 'scorecard_generated': {
      // The weekly VA productivity scorecards (CRM), not interview scorecards.
      const count = num(metadata['count']);
      const week = str(metadata['weekStart']);
      const weekDate = week ? new Date(`${week}T12:00:00`) : null;
      const weekLabel =
        weekDate && !Number.isNaN(weekDate.getTime())
          ? `Week of ${new Intl.DateTimeFormat(LOCALE, DAY_MONTH_FORMAT).format(weekDate)}`
          : null;
      const parts = [
        count !== null ? `${count} scorecard${count === 1 ? '' : 's'}` : null,
        weekLabel,
      ].filter(Boolean);
      return finish(
        'generated the weekly scorecards',
        parts.join(' \u00b7 ')
      );
    }

    // ── Notes ────────────────────────────────────────────────────────
    case 'note_added':
      return finish(`added ${noteLabel(str(metadata['method']))}`);

    case 'note_updated':
      return finish(`edited ${noteLabel(str(metadata['method']))}`);

    case 'note_deleted':
      return finish(`deleted ${noteLabel(str(metadata['method']))}`);

    // ── Clients ──────────────────────────────────────────────────────
    case 'contact_added': {
      const name = pick(metadata, 'contactName');
      return finish(name ? `added the contact ${name}` : 'added a contact');
    }

    case 'contact_updated': {
      const name = pick(metadata, 'contactName');
      const edit = summariseChanges(changes);
      const who = name ? `${name}\u2019s` : 'a contact\u2019s';
      return edit
        ? finish(`changed ${who} ${edit.fields}`, edit.detail ?? '')
        : finish(name ? `edited the contact ${name}` : 'edited a contact');
    }

    case 'contact_removed':
      return finish('removed a contact');

    case 'crm_profile_updated':
    case 'crm_client_account_updated': {
      const edit = summariseChanges(changes);
      return edit
        ? finish(`changed CRM ${edit.fields}`, edit.detail ?? '')
        : finish('edited the CRM profile');
    }

    case 'va_profile_updated': {
      const fields = strArray(metadata['fields']).map(f => humanKey(f));
      return fields.length > 0
        ? finish(`changed the VA profile`, fields.join(' \u00b7 '))
        : finish('edited the VA profile');
    }

    // ── Jobs ─────────────────────────────────────────────────────────
    case 'pipeline_changed': {
      const templateName = pick(metadata, 'templateName');
      const remapped = num(metadata['applicationsRemapped']);
      const parts = [
        templateName ? `Template: ${templateName}` : null,
        remapped !== null
          ? `${remapped} application${remapped === 1 ? '' : 's'} remapped`
          : null,
      ].filter(Boolean);
      return finish('changed the job pipeline', parts.join(' \u00b7 ') || null);
    }

    // ── Users / team ─────────────────────────────────────────────────
    case 'permissions_updated': {
      const resources = strArray(metadata['resources']).map(r =>
        humanKey(r).toLowerCase()
      );
      return resources.length > 0
        ? finish(`changed permissions`, resources.join(' \u00b7 '))
        : finish('changed permissions');
    }

    case 'provisioned_va':
      return finish('granted CRM portal access');

    case 'provisioned_client':
      return finish('provisioned a client account');

    case 'revoked_crm':
      return finish('revoked CRM portal access');

    case 'deactivated':
      return finish('deactivated this account');

    // ── Assignments / reviews / EOD / survey ─────────────────────────
    case 'ended':
      return finish('ended the assignment');

    case 'review_generated':
      return finish('generated a performance review');

    case 'review_completed':
      return finish('completed the performance review');

    case 'review_deleted':
      return finish('deleted a performance review');

    case 'eod_submitted':
      return finish('submitted an end-of-day report');

    case 'eod_deleted':
      return finish('deleted an end-of-day report');

    case 'eod_compliance_checked':
      return finish('ran the end-of-day compliance check');

    case 'survey_dispatched':
      return finish('dispatched a satisfaction survey');

    // ── Sign-in and account security ─────────────────────────────────
    case 'login': {
      // The IP is stored for investigations but kept off the row: a long list
      // of sign-ins is easier to scan one line each.
      const app = str(metadata['app']);
      return finish(app ? `signed in to the ${app.toUpperCase()}` : 'signed in');
    }

    case 'login_failed': {
      const app = str(metadata['app']);
      const reason = str(metadata['reason']);
      const ip = str(metadata['ip']);
      const parts = [
        app ? app.toUpperCase() : null,
        reason === 'inactive'
          ? 'account deactivated'
          : reason === 'wrong_password'
            ? 'wrong password'
            : null,
        ip,
      ].filter(Boolean);
      return impersonal('failed sign-in attempt', parts.join(' \u00b7 '));
    }

    case 'password_changed':
      return finish('changed their password');

    case 'password_reset':
      return finish('reset their password');

    case 'invite_accepted':
      return finish('accepted the invitation and set a password');

    // ── CRM edits and exports ────────────────────────────────────────
    case 'eod_updated': {
      const edit = summariseChanges(changes);
      return edit
        ? finish(`edited an end-of-day report: ${edit.fields}`, edit.detail ?? '')
        : finish('edited an end-of-day report');
    }

    case 'review_updated': {
      const edit = summariseChanges(changes);
      return edit
        ? finish(edit.headline, edit.detail ?? '')
        : finish('edited the performance review');
    }

    case 'review_regenerated': {
      const section = str(metadata['section']);
      return finish(
        section
          ? `regenerated the review ${section}`
          : 'regenerated part of the review'
      );
    }

    case 'review_exported':
      return finish('exported the review as PDF');

    case 'survey_created': {
      const type = pick(metadata, 'surveyType');
      return finish(
        type
          ? `created a ${humanEnum(type)} survey reminder`
          : 'created a survey reminder'
      );
    }

    case 'survey_updated': {
      const type = pick(metadata, 'surveyType');
      const edit = summariseChanges(changes);
      return edit
        ? finish(
            edit.headline,
            [type ? `${upperFirst(humanEnum(type))} survey` : null, edit.detail]
              .filter(Boolean)
              .join(' \u00b7 ')
          )
        : finish('edited a survey reminder');
    }

    case 'report_exported': {
      const labels: Record<string, string> = {
        work_entries: 'work entries',
        eod_submissions: 'end-of-day',
        performance: 'performance review',
        dispositions: 'rejections',
      };
      const report = str(metadata['report']) ?? '';
      const format = pick(metadata, 'format');
      const start = pick(metadata, 'startDate');
      const end = pick(metadata, 'endDate');
      const range = start || end ? `${start ?? '\u2026'} to ${end ?? '\u2026'}` : null;
      return finish(
        `exported the ${labels[report] ?? 'data'} report`,
        [format ? format.toUpperCase() : null, range]
          .filter(Boolean)
          .join(' \u00b7 ')
      );
    }

    // ── Email (derived from the emails collection) ───────────────────
    case 'email_sent': {
      const subject = pick(metadata, 'subject');
      const kind = str(metadata['kind']);
      const text = unattributed
        ? kind === 'application_confirmation'
          ? 'application confirmation email sent'
          : 'email sent'
        : (EMAIL_KIND_TEXT[kind ?? ''] ?? 'emailed the candidate');
      return finish(text, subject ? `\u201c${subject}\u201d` : '');
    }

    case 'email_received': {
      const subject = pick(metadata, 'subject');
      const files = num(metadata['attachments']);
      const parts = [
        subject ? `\u201c${subject}\u201d` : null,
        files ? `${files} attachment${files === 1 ? '' : 's'}` : null,
      ].filter(Boolean);
      return impersonal('the candidate replied by email', parts.join(' \u00b7 '));
    }

    case 'email_bounced':
    case 'email_failed': {
      const subject = pick(metadata, 'subject');
      return impersonal(
        key === 'email_bounced' ? 'email bounced' : 'email failed to send',
        subject ? `\u201c${subject}\u201d` : ''
      );
    }

    case 'settings_updated': {
      const edit = summariseChanges(changes);
      return edit
        ? finish(edit.headline, edit.detail ?? '')
        : finish('changed workspace settings');
    }
  }

  // ── Fallbacks ──────────────────────────────────────────────────────

  // A service-written description is more informative than anything we can
  // reconstruct from a generic token. These are complete statements
  // ("Job was archived by system"), so joining them to the actor with a verb
  // would read as "Cyril Thomas Job was archived…" — name the actor inline.
  const description = str(log.description);
  if (description && description.toLowerCase() !== key) {
    const statement = upperFirst(description);
    return {
      actor: null,
      text: showActor ? `${actorName}: ${statement}` : statement,
      detail: null,
      tone,
      icon,
      isLegacy,
    };
  }

  const edit = summariseChanges(changes);
  if (edit) return finish(edit.headline, edit.detail ?? '');

  const metadataText = describeGenericMetadata(metadata);

  // Unknown token (or no token at all) and nothing to describe it with: mark
  // it as a legacy entry so a reader understands the gap is in the record, not
  // in their understanding of it.
  if (isLegacy) {
    const alreadyLabelled = /legacy/i.test(log.description ?? '');
    return finish(
      alreadyLabelled ? 'legacy entry' : 'logged a legacy entry',
      metadataText
    );
  }

  // A recognised action whose metadata happens to be empty — the switch above
  // already knows the right phrasing, so do not call it "legacy".
  return finish(`edited ${resourceLabel(log.resourceType)}`, metadataText);
}

// ── timestamps ─────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Day heading for a group of entries: "Today", "Yesterday", "12 Sep" and, once
 * the entry leaves this year, "12 Sep 2025".
 */
export function formatActivityDay(
  value: string | null | undefined,
  now: Date = new Date()
): string {
  const date = value ? new Date(value) : new Date(NaN);
  if (Number.isNaN(date.getTime())) return '';
  if (isSameDay(date, now)) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) return 'Yesterday';
  const dayMonth = new Intl.DateTimeFormat(LOCALE, DAY_MONTH_FORMAT).format(
    date
  );
  return date.getFullYear() === now.getFullYear()
    ? dayMonth
    : `${dayMonth} ${date.getFullYear()}`;
}

/** Clock time only ("14:32"); the day heading carries the date. */
export function formatActivityClock(value: string | null | undefined): string {
  const date = value ? new Date(value) : new Date(NaN);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(LOCALE, TIME_FORMAT).format(date);
}

export interface ActivityTime {
  /** Compact in-row label — "14:32", "Yesterday 14:32", "12 Sep 14:32". */
  label: string;
  /** Full absolute timestamp, for tooltips and `title` attributes. */
  absolute: string;
  /** ISO string for `<time dateTime>`. */
  dateTime: string;
  /** `true` when the event happened within the last hour. */
  isRecent: boolean;
}

const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
};

const DAY_MONTH_FORMAT: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
};

/** Locale for month abbreviations — matches `formatDate` in `lib/utils.ts`. */
const LOCALE = 'en-US';

/**
 * Format an activity timestamp so a reader can always see a date and a time
 * without hovering: today/yesterday are labelled, anything older shows the
 * day and month, and a year suffix appears once the entry leaves this year.
 */
export function formatActivityTime(
  value: string | null | undefined,
  now: Date = new Date()
): ActivityTime {
  const date = value ? new Date(value) : new Date(NaN);
  if (Number.isNaN(date.getTime())) {
    return { label: '', absolute: '', dateTime: '', isRecent: false };
  }

  const time = new Intl.DateTimeFormat(LOCALE, TIME_FORMAT).format(date);
  const absolute = new Intl.DateTimeFormat(LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  let label: string;
  if (isSameDay(date, now)) {
    label = time;
  } else if (isSameDay(date, yesterday)) {
    label = `Yesterday ${time}`;
  } else {
    const dayMonth = new Intl.DateTimeFormat(LOCALE, DAY_MONTH_FORMAT).format(
      date
    );
    label =
      date.getFullYear() === now.getFullYear()
        ? `${dayMonth} ${time}`
        : `${dayMonth} ${date.getFullYear()} ${time}`;
  }

  const ageMs = now.getTime() - date.getTime();
  return {
    label,
    absolute,
    dateTime: date.toISOString(),
    isRecent: ageMs >= 0 && ageMs < 60 * 60 * 1000,
  };
}
