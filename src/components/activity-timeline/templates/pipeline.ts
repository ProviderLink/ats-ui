/**
 * Pipeline rows: applications, stage moves, hiring, rejection, disposition.
 *
 * `applied` and `ineligible_reapply_blocked` are deliberately subjectless.
 * `applied` is logged with `performedBy = createdBy`, which is the candidate
 * for a portal application and a staff member for an upload — nothing
 * separates the two, so crediting an actor would be wrong roughly half the
 * time. `ineligible_reapply_blocked` is logged with `performedBy: null`.
 * Both name the entity instead.
 */

import { article, capitalizeFirst } from '../format';
import {
  entityClause,
  entityNoun,
  objectPhrase,
  possessive,
  sentence,
  withQualifier,
} from '../grammar';
import { DISPOSITION_DESTINATION, SOURCE_PHRASE } from '../lexicon';
import { asNumber, firstString, humanName, jobTitle } from '../narrowing';
import type { SentenceContext } from '../types';
import type { Template } from './types';

/** The entity noun, with `application` deliberately mapped to `candidate` for
 * the `hired` sentence. */
function entityNounFor(resourceType: string): string {
  return resourceType === 'application'
    ? 'candidate'
    : entityNoun(resourceType);
}

/** `Virtual Assistant` → `the Virtual Assistant role`, unless it already ends
 * in a role-ish noun. */
function rolePhrase(title: string | null): string | null {
  if (!title) return null;
  if (/\b(role|position|opening|job)$/i.test(title)) return `the ${title}`;
  return `the ${title} role`;
}

const applied: Template = (entry, ctx) => {
  const source = firstString(entry.metadata, ['source']);
  const phrase =
    (source ? SOURCE_PHRASE[source] : null) ?? SOURCE_PHRASE['applied'];
  const role = rolePhrase(jobTitle(entry.metadata));
  const verbs = phrase ?? { mixed: 'applied to', entity: 'Applied' };

  // Entity scope: the candidate is the page, so the sentence is subjectless.
  if (ctx.scope === 'entity') {
    return role ? `${verbs.entity} — ${role}` : verbs.entity;
  }
  const who = ctx.entityName ?? 'A candidate';
  return `${who} ${verbs.mixed} ${role ?? 'this job'}`;
};

const rejected: Template = (entry, ctx) => {
  // `reasonLabel` is the curated reason; `reason` is free prose.
  const reason = humanName(
    firstString(entry.metadata, ['reasonLabel', 'reason'])
  );
  const qualifier = reason && reason.length <= 60 ? reason : null;
  return ctx.scope === 'entity'
    ? entityClause('Rejected', qualifier, ctx)
    : withQualifier(`${ctx.actorName} rejected the application`, qualifier);
};

/**
 * You hire a person, not a record. The entry's `resourceType` is `application`
 * (the hiring is recorded against the application), so the object has to be
 * derived from the resource type by hand.
 */
const hired: Template = (entry, ctx) => {
  if (ctx.scope === 'entity') return entityClause('Hired', null, ctx);

  const noun = entityNounFor(entry.resourceType);
  const object = ctx.entityName ?? `a ${noun}`;
  return `${ctx.actorName} hired ${object}`;
};

const approved: Template = (entry, ctx) => {
  const stage = humanName(firstString(entry.metadata, ['stageName', 'to']));
  return ctx.scope === 'entity'
    ? entityClause('Approved', stage, ctx)
    : withQualifier(
        `${ctx.actorName} approved ${possessive(ctx.entityName ?? 'a candidate')} application`,
        stage,
        ' and placed them in '
      );
};

const stageChanged: Template = (entry, ctx) => {
  const from = humanName(
    firstString(entry.metadata, ['from', 'fromStage', 'fromStageName'])
  );
  const to = humanName(
    firstString(entry.metadata, ['to', 'toStage', 'toStageName', 'stageName'])
  );
  const clause = to
    ? from
      ? `Moved from ${from} to ${to}`
      : `Moved to ${to}`
    : 'Moved';

  if (ctx.scope === 'entity') return entityClause(clause, null, ctx);

  // The transition is the object of "moved", not a trailing qualifier, so it
  // joins with a space rather than an em dash.
  return sentence({
    verb: 'moved',
    object: objectPhrase(entry, ctx),
    qualifier: to ? (from ? `from ${from} to ${to}` : `to ${to}`) : null,
    separator: ' ',
    ctx,
  });
};

const notesUpdated: Template = (entry, ctx) =>
  ctx.scope === 'entity'
    ? entityClause('Application notes updated', null, ctx)
    : sentence({
        verb: 'updated',
        object:
          entry.resourceType === 'application'
            ? 'the application notes'
            : 'the notes',
        ctx,
      });

const disposition: Template = (entry, ctx) => {
  const destination = firstString(entry.metadata, [
    'destination',
    'dispositionDestination',
  ]);
  const where = destination
    ? (DISPOSITION_DESTINATION[destination] ?? `the ${destination} list`)
    : 'the candidate pool';
  const reason = humanName(firstString(entry.metadata, ['reasonLabel']));

  return ctx.scope === 'entity'
    ? entityClause(`Moved to ${where}`, reason, ctx)
    : sentence({
        verb: 'moved',
        object: `${objectPhrase(entry, ctx)} to ${where}`,
        qualifier: reason,
        ctx,
      });
};

/** Subjectless in both scopes: no trustworthy human actor for this event. */
const reapplyBlocked: Template = (entry, ctx) => {
  const destination = firstString(entry.metadata, ['destination']);
  const qualifier =
    destination === 'permanently_ineligible'
      ? 'permanently ineligible'
      : 'ineligible';

  if (ctx.scope === 'entity') {
    return withQualifier('Reapplication blocked', qualifier);
  }
  const who = ctx.entityName ?? 'a candidate';
  return withQualifier(`Blocked ${who} from reapplying`, qualifier);
};

const ended: Template = (entry, ctx) =>
  ctx.scope === 'entity'
    ? entityClause('Assignment ended', null, ctx)
    : sentence({ verb: 'ended', object: objectPhrase(entry, ctx), ctx });

const pipelineChanged: Template = (entry, ctx) => {
  const name = humanName(firstString(entry.metadata, ['templateName']));
  const remapped = asNumber(entry.metadata['applicationsRemapped']);
  const qualifier =
    remapped && remapped > 0
      ? `${remapped} ${remapped === 1 ? 'application' : 'applications'} remapped`
      : null;

  if (ctx.scope === 'entity') {
    return entityClause(
      name ? `Pipeline changed to ${name}` : 'Pipeline changed',
      qualifier,
      ctx
    );
  }
  // Avoid "the Standard VA Pipeline pipeline": only add the noun when the
  // template name does not already say it.
  const label = name
    ? /\bpipeline\b/i.test(name)
      ? `the ${name}`
      : `the ${name} pipeline`
    : 'the job pipeline';
  return sentence({
    verb: name ? 'applied' : 'changed',
    object: label,
    qualifier,
    ctx,
  });
};

export const PIPELINE_TEMPLATES: Record<string, Template> = {
  applied,
  rejected,
  hired,
  approved,
  stage_changed: stageChanged,
  notes_updated: notesUpdated,
  disposition,
  ineligible_reapply_blocked: reapplyBlocked,
  ended,
  pipeline_changed: pipelineChanged,
};

/** Re-exported for the workspace templates' shared phrasing. */
export const _article = article;
export const _capitalizeFirst = capitalizeFirst;
export type { SentenceContext };
