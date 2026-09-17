/**
 * People and lifecycle rows: created / updated / deleted, talent pool, status,
 * eligibility, legal hold, and the honest fallback for legacy entries.
 *
 * Entity-scope rows go through `entityClause`, which puts the qualifier before
 * the actor. Building passive rows by string concatenation instead produces
 * "Scheduled a Zoom interview by Cyril — for initial screening", where the
 * qualifier reads as something Cyril did.
 */

import { changeFields } from '../changes';
import { article, capitalizeFirst, listPhrase } from '../format';
import {
  byActor,
  entityClause,
  entityNoun,
  objectPhrase,
  possessive,
  sentence,
} from '../grammar';
import { LEGACY_VERB } from '../lexicon';
import { asBoolean, asStringArray, firstString } from '../narrowing';
import type { SentenceContext } from '../types';
import type { Template } from './types';

/** `a candidate` in a mixed feed, `this candidate` on its own page. */
function targetOf(resourceType: string, ctx: SentenceContext): string {
  if (ctx.entityName) return ctx.entityName;
  const noun = entityNoun(resourceType);
  return `${ctx.scope === 'mixed' ? article(noun) : 'this'} ${noun}`;
}

/** Verb for a job/assignment status transition, when one reads naturally. */
const STATUS_VERB: Record<string, string> = {
  closed: 'closed',
  archived: 'archived',
  paused: 'paused',
  completed: 'completed',
  ended: 'ended',
  active: 'reopened',
  open: 'reopened',
};

const created: Template = (entry, ctx) => {
  const source = firstString(entry.metadata, ['source']);
  const selfServed = source === 'direct_apply' || source === 'applied';
  // A portal application logs `created` with the candidate as the performer.
  // Crediting them with creating their own record is nonsense, so those rows
  // become subjectless — the same rule as `applied`.
  if (selfServed) {
    return ctx.scope === 'mixed'
      ? `${capitalizeFirst(targetOf(entry.resourceType, ctx))} was added to the pipeline`
      : 'Added to the pipeline';
  }
  return ctx.scope === 'entity'
    ? entityClause('Created', null, ctx)
    : sentence({
        verb: 'created',
        object: targetOf(entry.resourceType, ctx),
        ctx,
      });
};

const updated: Template = (entry, ctx) => {
  // `changes` is the only thing on an update that says WHAT changed.
  const fields = changeFields(asStringArray(entry.metadata['changes']) ?? []);
  const qualifier = listPhrase(fields, 3) || null;

  // Entity scope means the entity IS the page, so it is never named — the row
  // goes passive and the actor comes from `entityClause`. Never build this by
  // hand: appending a qualifier after `by {Actor}` reads as though the actor
  // did the qualifier.
  if (ctx.scope === 'entity') {
    return entityClause(
      qualifier ? `Updated ${qualifier}` : 'Updated',
      null,
      ctx
    );
  }

  const subject = ctx.entityName ?? 'a candidate';
  const object = qualifier
    ? `${possessive(subject)} ${qualifier}`
    : `${possessive(subject)} profile`;
  return sentence({ verb: 'updated', object, ctx });
};

const deleted: Template = (entry, ctx) =>
  ctx.scope === 'entity'
    ? entityClause('Deleted', null, ctx)
    : sentence({ verb: 'deleted', object: objectPhrase(entry, ctx), ctx });

const talentPoolAdded: Template = (entry, ctx) =>
  ctx.scope === 'entity'
    ? entityClause('Added to the talent pool', null, ctx)
    : sentence({
        verb: 'added',
        object: `${objectPhrase(entry, ctx)} to the talent pool`,
        ctx,
      });

const talentPoolRemoved: Template = (entry, ctx) =>
  ctx.scope === 'entity'
    ? entityClause('Removed from the talent pool', null, ctx)
    : sentence({
        verb: 'removed',
        object: `${objectPhrase(entry, ctx)} from the talent pool`,
        ctx,
      });

const statusChanged: Template = (entry, ctx) => {
  const raw = firstString(entry.metadata, ['to', 'newStatus']);
  const to = raw ? raw.toLowerCase() : null;
  const noun = entityNoun(entry.resourceType);

  // A candidate's status is an attribute, so it reads "changed status to X".
  if (entry.resourceType === 'candidate') {
    if (ctx.scope === 'entity') {
      return entityClause(
        to ? `Status changed to ${to}` : 'Status changed',
        null,
        ctx
      );
    }
    const owner = ctx.entityName ?? 'a candidate';
    return sentence({
      verb: 'changed',
      object: to
        ? `${possessive(owner)} status to ${to}`
        : `${possessive(owner)} status`,
      ctx,
    });
  }

  // A job or assignment status is the whole story, so it gets a real verb.
  const verb = to ? STATUS_VERB[to] : undefined;
  const owner = ctx.entityName ?? `the ${noun}`;
  const onHold = to === 'on_hold';

  if (ctx.scope === 'entity') {
    const clause = onHold
      ? `${capitalizeFirst(noun)} put on hold`
      : verb
        ? `${capitalizeFirst(noun)} ${verb}`
        : to
          ? `Status changed to ${to}`
          : 'Status changed';
    return entityClause(clause, null, ctx);
  }
  if (onHold) return `${ctx.actorName} put ${owner} on hold`;
  if (verb) return sentence({ verb, object: owner, ctx });
  return sentence({
    verb: 'changed',
    object: to ? `${owner} status to ${to}` : `${owner} status`,
    ctx,
  });
};

const eligibilityChanged: Template = (entry, ctx) => {
  const to = firstString(entry.metadata, ['to', 'eligibilityStatus']);
  const ineligible = (to ?? '').toLowerCase() === 'permanently_ineligible';
  const owner = ctx.entityName ?? 'this candidate';

  if (ineligible) {
    return ctx.scope === 'entity'
      ? entityClause('Marked as permanently ineligible', null, ctx)
      : sentence({
          verb: 'marked',
          object: `${owner} as permanently ineligible`,
          ctx,
        });
  }
  return ctx.scope === 'entity'
    ? entityClause('Eligibility restored', null, ctx)
    : sentence({
        verb: 'restored',
        object: `${possessive(owner)} eligibility`,
        ctx,
      });
};

const legalHoldToggled: Template = (entry, ctx) => {
  const on = asBoolean(entry.metadata['legalHold']) ?? true;
  const owner = ctx.entityName ?? 'this candidate';

  if (on) {
    return ctx.scope === 'entity'
      ? entityClause('Legal hold applied', null, ctx)
      : sentence({ verb: 'put', object: `a legal hold on ${owner}`, ctx });
  }
  return ctx.scope === 'entity'
    ? entityClause('Legal hold removed', null, ctx)
    : sentence({ verb: 'removed', object: `the legal hold on ${owner}`, ctx });
};

/**
 * The honest fallback, for the 452 legacy documents with no `action` and for
 * any action the registry does not know. A handful of well-known legacy tokens
 * get a real sentence; anything else says plainly that an activity was
 * recorded, rather than leaking the raw token into the row.
 */
const recorded: Template = (entry, ctx) => {
  const phrase = entry.legacyType ? LEGACY_VERB[entry.legacyType] : undefined;
  if (phrase) {
    return ctx.scope === 'entity'
      ? entityClause(phrase.entity, null, ctx)
      : sentence({ verb: phrase.mixed, ctx });
  }
  return ctx.scope === 'entity'
    ? entityClause('Activity recorded', null, ctx)
    : sentence({
        verb: 'recorded',
        object: `an activity on ${objectPhrase(entry, ctx)}`,
        ctx,
      });
};

const imported: Template = (entry, ctx) =>
  ctx.scope === 'entity'
    ? entityClause('Imported', null, ctx)
    : sentence({ verb: 'imported', object: objectPhrase(entry, ctx), ctx });

export const PEOPLE_TEMPLATES: Record<string, Template> = {
  created,
  updated,
  deleted,
  talent_pool_added: talentPoolAdded,
  talent_pool_removed: talentPoolRemoved,
  status_changed: statusChanged,
  eligibility_changed: eligibilityChanged,
  legal_hold_toggled: legalHoldToggled,
  recorded,
  imported,
};

export { byActor };
