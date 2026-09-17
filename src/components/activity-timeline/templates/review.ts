/**
 * Review and reporting rows: performance reviews, interview scorecards, and
 * EOD reporting. All of these log an empty `metadata`, so there is nothing to
 * consume beyond the actor and the entity.
 */

import { withQualifier } from '../format';
import { byActor } from '../grammar';
import { asNumber, asString } from '../narrowing';
import type { Template } from './types';

const reviewGenerated: Template = (_entry, ctx) =>
  ctx.scope === 'entity'
    ? `Performance review generated${byActor(ctx)}`
    : `${ctx.actorName} generated a performance review`;

const reviewCompleted: Template = (_entry, ctx) =>
  ctx.scope === 'entity'
    ? `Performance review completed${byActor(ctx)}`
    : `${ctx.actorName} completed a performance review`;

const reviewDeleted: Template = (_entry, ctx) =>
  ctx.scope === 'entity'
    ? `Performance review deleted${byActor(ctx)}`
    : `A performance review was deleted`;

/**
 * `scorecard_generated` is written with `resourceId: 'bulk'`, which fails the
 * model's ObjectId validation and is logged as an error by `createLog` — so
 * these rows are not expected to appear. The template exists anyway so the
 * action can never render as a raw keyword if that write is ever fixed.
 */
const scorecardsGenerated: Template = (entry, ctx) => {
  const count = asNumber(entry.metadata['count']);
  const week = asString(entry.metadata['weekStart']);
  const qualifier =
    count !== null
      ? `${count} ${count === 1 ? 'scorecard' : 'scorecards'}`
      : null;
  const weekText = week ? `week of ${week}` : null;
  const combined = qualifier ?? weekText;

  return ctx.scope === 'entity'
    ? withQualifier(`Scorecards generated${byActor(ctx)}`, combined)
    : withQualifier(`${ctx.actorName} generated scorecards`, combined);
};

export const REVIEW_TEMPLATES: Record<string, Template> = {
  review_generated: reviewGenerated,
  review_completed: reviewCompleted,
  review_deleted: reviewDeleted,
  scorecard_generated: scorecardsGenerated,
};
