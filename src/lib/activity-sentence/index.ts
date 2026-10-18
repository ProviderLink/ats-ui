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
import type { ActivityLog } from '@/store/types';
import {
  AI_ACTIONS,
  isUnknownAction,
  resolveActionKey,
  resolveActivityIcon,
  resolveTone,
} from '../activity-actions';
import { describeAccount } from './account';
import { describeCandidate } from './candidate';
import { describeChanges, summariseChanges } from './changes';
import { describeCrm } from './crm';
import { describeCrud } from './crud';
import { describeEmail } from './email';
import {
  MAX_DETAIL_LINE,
  str,
  strArray,
  truncate,
  upperFirst,
} from './format';
import { describeGenericMetadata } from './generic';
import { describeInterview } from './interview';
import { describePipeline } from './pipeline';
import { resourceLabel } from './resource-label';
import type { SentenceHandler, SentenceScope } from './scope';
import type {
  ActivityActor,
  ActivityContext,
  ActivitySentence,
} from './types';

export type {
  ActivityActor,
  ActivityActorKind,
  ActivityContext,
  ActivitySentence,
  ActivityTone,
} from './types';

const HANDLERS: SentenceHandler[] = [
  describePipeline,
  describeCrud,
  describeCandidate,
  describeInterview,
  describeCrm,
  describeAccount,
  describeEmail,
];

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
 * Turn one activity log entry into a sentence.
 *
 * Precedence per action:
 *   1. Structured `metadata` (richest — from/to, reason, scores, counts).
 *   2. A stored `description` (written by the service when metadata is thin).
 *   3. A generic fallback built from the resource type.
 */
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
  // the handlers know exactly what happened.
  const isLegacy = isUnknownAction(log.action);
  const actorName = actor.isViewer ? 'You' : actor.name;

  /** Assemble a short supporting line, never exceeding `MAX_DETAIL_LINE`. */
  const detail = (value: string | null) =>
    value ? truncate(value, MAX_DETAIL_LINE) : null;

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

  const scope: SentenceScope = {
    key,
    log,
    metadata,
    changes,
    isValid,
    ctx,
    unattributed: actor.kind !== 'user',
    finish,
    impersonal,
  };

  for (const handler of HANDLERS) {
    const sentence = handler(scope);
    if (sentence) return sentence;
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
