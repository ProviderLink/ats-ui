/**
 * Grammar helpers shared by every template file.
 *
 * Two scopes, two shapes:
 *
 *   mixed  — the actor is the subject and the entity is named:
 *            `Cyril moved Sarah Ahmed from X to Y`
 *   entity — the reader is already looking at the entity, so it is omitted and
 *            the sentence goes passive:
 *            `Moved from X to Y by Cyril`
 *
 * Automated actions (and the two actions with no trustworthy human actor) use
 * `subjectless(...)` instead: the entity is the subject in both scopes.
 */

import {
  article,
  capQualifier,
  listPhrase,
  MAX_SENTENCE_CHARS,
  withQualifier,
} from './format';
import { DEFAULT_ENTITY_NOUN, ENTITY_NOUN } from './lexicon';
import type { ActivityEntry, SentenceContext } from './types';

export { withQualifier };

/** The actor, as the subject of an active sentence. */
export function actor(ctx: SentenceContext): string {
  return ctx.actorName;
}

/**
 * Passive attribution, always terminated.
 *
 * `by System` is kept even though System is not a person: the alternative is
 * an orphan fragment like a bare "Created" on an automated row, which reads as
 * broken rather than as terse. The templates whose rows are deliberately
 * actorless (AI, cron reporting) simply never call this.
 */
export function byActor(ctx: SentenceContext): string {
  return ` by ${actor(ctx)}`;
}

/** True when the entity should be named (mixed feed, or an unknown entity). */
function namesEntity(ctx: SentenceContext): boolean {
  if (ctx.scope === 'mixed') return true;
  return ctx.entityName === null;
}

/** The entity, as a name when we have one and a noun when we do not. */
export function entity(ctx: SentenceContext, nounOverride?: string): string {
  if (ctx.entityName) return ctx.entityName;
  return nounOverride ?? DEFAULT_ENTITY_NOUN;
}

export function entityNoun(resourceType: string): string {
  return ENTITY_NOUN[resourceType] ?? DEFAULT_ENTITY_NOUN;
}

/**
 * The entity as an object phrase: its real name when we have one, otherwise
 * `a candidate` / `an application` in a mixed feed and `this candidate` on its
 * own page.
 */
export function objectPhrase(
  entry: ActivityEntry,
  ctx: SentenceContext
): string {
  if (ctx.entityName) return ctx.entityName;
  const noun = entityNoun(entry.resourceType);
  return `${ctx.scope === 'mixed' ? article(noun) : 'this'} ${noun}`;
}

/**
 * A passive entity-scope sentence: `{clause} … by {Actor}`.
 *
 * Where the qualifier goes depends on what kind of phrase it is:
 *
 *   - a circumstance phrase (`for initial screening`, `from X to Y`) reads as
 *     part of the action, so it goes BEFORE the actor
 *   - a noun phrase (a reason, a contact name, a field list) reads as an aside,
 *     so it goes AFTER the actor — "Rejected — Skills mismatch by Cyril" reads
 *     as though Cyril were the mismatch
 */
export function entityClause(
  clause: string,
  qualifier: string | null | undefined,
  ctx: SentenceContext
): string {
  const q = (qualifier ?? '').trim();
  const tail = byActor(ctx);
  if (!q) return `${clause}${tail}`;

  const circumstance =
    /^(for|from|to|with|after|at|on|in|during|about)\b/i.test(q);
  const fixed = Array.from(clause).length + Array.from(tail).length + 3;
  const budget = MAX_SENTENCE_CHARS - fixed;
  if (budget < 12) return `${clause}${tail}`;

  const capped = capQualifier(q, budget);
  return circumstance
    ? `${clause} — ${capped}${tail}`
    : `${clause}${tail} — ${capped}`;
}

/** `'s` suffix — or a bare possessive for names already ending in `s`. */
export function possessive(name: string): string {
  return /s$/i.test(name) ? `${name}'` : `${name}'s`;
}

/**
 * Assemble one sentence.
 *
 * `verb` is the active verb phrase and `object` the thing it acts on; either
 * may be omitted by a template that has its own full clause. `qualifier` is
 * the optional trailing half, and is what gets truncated.
 */
export function sentence(parts: {
  /** The active verb phrase. Omitted when `passive` or `subject` is used. */
  verb?: string;
  object?: string;
  passive?: string;
  subject?: string;
  qualifier?: string | null;
  /** Joins a multi-word qualifier (`from X to Y`) without an em dash. */
  separator?: string;
  ctx: SentenceContext;
}): string {
  const { verb, object, passive, subject, qualifier, separator, ctx } = parts;

  // Passive form: no leading subject, and the actor is appended last so the
  // qualifier cannot read as something the actor did.
  if (passive) {
    const q = capQualifier(
      qualifier ?? '',
      MAX_SENTENCE_CHARS -
        Array.from(passive).length -
        Array.from(separator ?? ' ').length -
        Array.from(byActor(ctx)).length
    );
    return q
      ? `${passive}${separator ?? ' '}${q}${byActor(ctx)}`
      : `${passive}${byActor(ctx)}`;
  }

  // Automated / subjectless: the entity is the subject, and the entity may or
  // may not be named depending on scope.
  if (subject) {
    const phrase = verb ?? '';
    const base = namesEntity(ctx)
      ? `${subject} ${phrase}`.trim()
      : `${phrase.charAt(0).toUpperCase()}${phrase.slice(1)}`.trim();
    return withQualifier(base, qualifier, separator);
  }

  const objectText = object ? ` ${object}` : '';
  const verbText = verb ? ` ${verb}` : '';
  return withQualifier(
    `${actor(ctx)}${verbText}${objectText}`,
    qualifier,
    separator
  );
}

/**
 * Build the field-list qualifier for an `updated` row: `email, address and
 * tags`. Returns null when there is nothing nameable, which lets the caller
 * fall back to a "profile" phrasing without an empty connector.
 */
export function fieldQualifier(fields: string[]): string | null {
  const phrase = listPhrase(fields, 3);
  return phrase.length > 0 ? phrase : null;
}

/** Guard against a template accidentally returning an empty sentence. */
export function ensureSentence(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.length > MAX_SENTENCE_CHARS * 2 ? fallback : trimmed;
}
