/**
 * The action registry.
 *
 * One row per action in the backend `ActivityAction` union, declaring:
 *
 *   - `dot`       — which of the four dot states it gets
 *   - `template`  — how it becomes a sentence
 *   - `consumes`  — the ONLY metadata keys its template may read
 *
 * `consumes` is the allowlist. Keys not listed are never handed to a template,
 * and the expanded detail renderer reads from the same reduced object, so a new
 * backend field can never leak into the UI whether or not a row is expanded.
 *
 * Adding a backend action requires adding one row here. An action with no row
 * still renders a grammatical sentence via the generic fallback in
 * `registry.ts`, so it can never appear as a raw keyword.
 */

import { AUTOMATION_TEMPLATES } from './templates/automation';
import { COMMUNICATION_TEMPLATES } from './templates/communication';
import { PEOPLE_TEMPLATES } from './templates/people';
import { PIPELINE_TEMPLATES } from './templates/pipeline';
import { REVIEW_TEMPLATES } from './templates/review';
import type { Template } from './templates/types';
import { WORKSPACE_TEMPLATES } from './templates/workspace';
import type { ActivityDotState } from './types';

export interface ActionDefinition {
  dot: ActivityDotState;
  template: Template;
  consumes: readonly string[];
}

/** Metadata keys, spelled out so a typo here is a compile error at the call
 * site rather than a silently invisible field. */
const K = {
  source: 'source',
  changes: 'changes',
  from: 'from',
  to: 'to',
  fromStage: 'fromStage',
  fromStageName: 'fromStageName',
  toStage: 'toStage',
  toStageName: 'toStageName',
  stageName: 'stageName',
  stage: 'stage',
  newStatus: 'newStatus',
  eligibilityStatus: 'eligibilityStatus',
  legalHold: 'legalHold',
  reason: 'reason',
  reasonLabel: 'reasonLabel',
  lastStage: 'lastStage',
  internalNotes: 'internalNotes',
  destination: 'destination',
  dispositionDestination: 'dispositionDestination',
  score: 'score',
  isValid: 'isValid',
  recommendation: 'recommendation',
  skillsCount: 'skillsCount',
  experienceCount: 'experienceCount',
  educationCount: 'educationCount',
  interviewType: 'interviewType',
  rating: 'rating',
  templateName: 'templateName',
  applicationsRemapped: 'applicationsRemapped',
  method: 'method',
  contactName: 'contactName',
  name: 'name',
  fields: 'fields',
  label: 'label',
  memberName: 'memberName',
  userName: 'userName',
  type: 'type',
  count: 'count',
  weekStart: 'weekStart',
} as const;

function def(
  template: Template,
  dot: ActivityDotState,
  consumes: readonly string[] = []
): ActionDefinition {
  return { dot, template, consumes };
}

const P = PEOPLE_TEMPLATES;
const L = PIPELINE_TEMPLATES;
const C = COMMUNICATION_TEMPLATES;
const A = AUTOMATION_TEMPLATES;
const W = WORKSPACE_TEMPLATES;
const R = REVIEW_TEMPLATES;

/**
 * Every action currently in the backend union, plus `recorded` (the honest
 * fallback reached from the API boundary when a legacy document cannot be
 * mapped) and `imported` (bulk candidate import).
 */
export const ACTIONS: Record<string, ActionDefinition> = {
  // ── Generic lifecycle ────────────────────────────────────────────────
  created: def(P['created']!, 'neutral', [K.source]),
  updated: def(P['updated']!, 'neutral', [K.changes]),
  deleted: def(P['deleted']!, 'negative'),
  imported: def(P['imported']!, 'neutral'),

  // ── Talent pool / eligibility ────────────────────────────────────────
  talent_pool_added: def(P['talent_pool_added']!, 'positive'),
  talent_pool_removed: def(P['talent_pool_removed']!, 'neutral'),
  eligibility_changed: def(P['eligibility_changed']!, 'negative', [
    K.to,
    K.eligibilityStatus,
  ]),
  legal_hold_toggled: def(P['legal_hold_toggled']!, 'negative', [K.legalHold]),
  status_changed: def(P['status_changed']!, 'neutral', [K.to, K.newStatus]),

  // ── Application lifecycle ────────────────────────────────────────────
  applied: def(L['applied']!, 'neutral', [K.source]),
  rejected: def(L['rejected']!, 'negative', [K.reason, K.reasonLabel]),
  hired: def(L['hired']!, 'positive'),
  approved: def(L['approved']!, 'positive', [K.stageName, K.to]),
  stage_changed: def(L['stage_changed']!, 'neutral', [
    K.from,
    K.to,
    K.fromStage,
    K.fromStageName,
    K.toStage,
    K.toStageName,
    K.stageName,
    K.stage,
  ]),
  notes_updated: def(L['notes_updated']!, 'neutral'),
  disposition: def(L['disposition']!, 'neutral', [
    K.destination,
    K.dispositionDestination,
    K.reasonLabel,
    // Read by the candidate sheet's disposition history, not by the sentence.
    K.lastStage,
    K.internalNotes,
  ]),
  ineligible_reapply_blocked: def(L['ineligible_reapply_blocked']!, 'negative'),
  pipeline_changed: def(L['pipeline_changed']!, 'neutral', [
    K.templateName,
    K.applicationsRemapped,
  ]),

  // ── Interviews ───────────────────────────────────────────────────────
  interview_scheduled: def(C['interview_scheduled']!, 'positive', [
    K.type,
    K.interviewType,
  ]),
  interview_updated: def(C['interview_updated']!, 'neutral', [K.changes]),
  interview_cancelled: def(C['interview_cancelled']!, 'negative'),
  interview_completed: def(C['interview_completed']!, 'positive'),
  interview_no_show: def(C['interview_no_show']!, 'negative'),
  interview_feedback_submitted: def(
    C['interview_feedback_submitted']!,
    'neutral',
    [K.rating, K.recommendation]
  ),

  // ── Client contacts / notes ──────────────────────────────────────────
  contact_added: def(C['contact_added']!, 'neutral', [K.contactName, K.name]),
  contact_updated: def(C['contact_updated']!, 'neutral', [
    K.contactName,
    K.changes,
  ]),
  contact_removed: def(C['contact_removed']!, 'negative'),
  note_added: def(C['note_added']!, 'neutral', [K.method]),
  note_updated: def(C['note_updated']!, 'neutral'),
  note_deleted: def(C['note_deleted']!, 'negative'),
  survey_dispatched: def(C['survey_dispatched']!, 'automated'),

  // ── Automation (AI + cron) ───────────────────────────────────────────
  ai_validation_updated: def(A['ai_validation_updated']!, 'automated', [
    K.score,
    K.isValid,
  ]),
  ai_score_updated: def(A['ai_score_updated']!, 'automated', [
    K.score,
    K.recommendation,
  ]),
  parsed_data_updated: def(A['parsed_data_updated']!, 'automated', [
    K.skillsCount,
    K.experienceCount,
    K.educationCount,
  ]),
  eod_submitted: def(A['eod_submitted']!, 'automated'),
  eod_deleted: def(A['eod_deleted']!, 'negative'),
  eod_compliance_checked: def(A['eod_compliance_checked']!, 'automated'),

  // ── Reviews / reports ────────────────────────────────────────────────
  review_generated: def(R['review_generated']!, 'neutral'),
  review_completed: def(R['review_completed']!, 'positive'),
  review_deleted: def(R['review_deleted']!, 'negative'),
  scorecard_generated: def(R['scorecard_generated']!, 'neutral', [
    K.count,
    K.weekStart,
  ]),

  // ── Workspace / settings ─────────────────────────────────────────────
  settings_updated: def(W['settings_updated']!, 'neutral', [
    K.fields,
    K.changes,
  ]),
  crm_profile_updated: def(W['crm_profile_updated']!, 'neutral', [K.changes]),
  crm_client_account_updated: def(W['crm_client_account_updated']!, 'neutral'),
  permissions_updated: def(W['permissions_updated']!, 'neutral', [
    K.memberName,
    K.userName,
    K.name,
  ]),
  provisioned_va: def(W['provisioned_va']!, 'positive', [
    K.memberName,
    K.userName,
    K.name,
  ]),
  provisioned_client: def(W['provisioned_client']!, 'positive', [
    K.memberName,
    K.userName,
    K.name,
  ]),
  revoked_crm: def(W['revoked_crm']!, 'negative', [
    K.memberName,
    K.userName,
    K.name,
  ]),
  deactivated: def(W['deactivated']!, 'negative', [
    K.memberName,
    K.userName,
    K.name,
  ]),
  va_profile_updated: def(W['updated']!, 'neutral', [K.fields]),

  // ── Assignment ───────────────────────────────────────────────────────
  ended: def(L['ended']!, 'neutral'),

  // ── Fallback for unmappable legacy documents ─────────────────────────
  recorded: def(P['recorded']!, 'neutral'),
};

/**
 * `resourceType` overrides — only where a generic action needs a different
 * sentence shape, i.e. the impersonally-named workspace resources.
 */
const RESOURCE_OVERRIDES: Record<string, Record<string, ActionDefinition>> = {
  tag: {
    created: def(W['created']!, 'neutral'),
    updated: def(W['updated']!, 'neutral', [K.label, K.changes]),
    deleted: def(W['deleted']!, 'negative'),
  },
  work_entry: {
    created: def(W['created']!, 'neutral'),
    updated: def(W['updated']!, 'neutral', [K.changes]),
    deleted: def(W['deleted']!, 'negative'),
  },
};

/** The definition for an entry, or null when the action is unknown. */
export function lookupAction(
  action: string,
  resourceType: string
): ActionDefinition | null {
  const override = RESOURCE_OVERRIDES[resourceType]?.[action];
  if (override) return override;
  return ACTIONS[action] ?? null;
}

/**
 * The union of every key any template declares in `consumes`.
 *
 * This is the enforcement point for the allowlist: `api.ts` reduces each
 * entry's `metadata` to these keys before it ever reaches a component, so a
 * new backend field is invisible whether or not a row is expanded.
 */
export const ALLOWED_METADATA_KEYS: ReadonlySet<string> = new Set([
  ...Object.values(ACTIONS).flatMap(definition => [...definition.consumes]),
  ...Object.values(RESOURCE_OVERRIDES).flatMap(byAction =>
    Object.values(byAction).flatMap(definition => [...definition.consumes])
  ),
]);

/** Actions run by a model rather than a human, used for actor attribution. */
export const AI_ACTIONS: ReadonlySet<string> = new Set([
  'ai_validation_updated',
  'ai_score_updated',
  'parsed_data_updated',
]);
