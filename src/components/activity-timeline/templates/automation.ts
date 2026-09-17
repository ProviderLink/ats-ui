/**
 * Automated rows: AI scoring/validation/parsing and cron-driven jobs.
 *
 * Per the reviewed design these are the ONE exception to actor-first grammar.
 * `performedBy` is null on all ten AI call sites, so the actor would always be
 * the literal string "Arista AI" — a constant that carries no information. The
 * row therefore names the entity instead, and the actor is still visible as
 * the avatar plus the automated dot.
 */

import { listPhrase } from '../format';
import { possessive, withQualifier } from '../grammar';
import { RECOMMENDATION } from '../lexicon';
import { asBoolean, asNumber, firstString } from '../narrowing';
import type { ActivityEntry, SentenceContext } from '../types';
import type { Template } from './types';

/** `Sarah Ahmed's resume` in a mixed feed, `Resume` on her own page. */
function owned(ctx: SentenceContext, noun: string): string {
  if (ctx.entityName) return `${possessive(ctx.entityName)} ${noun}`;
  return ctx.scope === 'mixed' ? `a candidate's ${noun}` : noun;
}

/** `95/100`, or null when the score is missing or not numeric. */
function scoreText(score: number | null): string | null {
  return score === null ? null : `${score}/100`;
}

/** `12 skills, 3 roles` from whichever counts the writer happened to include. */
function countPhrase(entry: ActivityEntry): string | null {
  const skills = asNumber(entry.metadata['skillsCount']);
  const experience = asNumber(entry.metadata['experienceCount']);
  const education = asNumber(entry.metadata['educationCount']);

  const parts: string[] = [];
  if (skills !== null && skills > 0) parts.push(`${skills} skills`);
  if (experience !== null && experience > 0) {
    parts.push(`${experience} ${experience === 1 ? 'role' : 'roles'}`);
  }
  if (education !== null && education > 0 && parts.length < 2) {
    parts.push(
      `${education} education ${education === 1 ? 'entry' : 'entries'}`
    );
  }
  return parts.length > 0 ? listPhrase(parts, 3) : null;
}

const aiValidation: Template = (entry, ctx) => {
  const score = scoreText(asNumber(entry.metadata['score']));
  const isValid = asBoolean(entry.metadata['isValid']);
  const resume = owned(ctx, 'resume');

  // `isValid === false` is a real outcome and must not read as a success.
  if (isValid === false) {
    return withQualifier(
      `${resume} could not be validated`,
      score ? `scored ${score}` : null,
      ', '
    );
  }
  const base = `${resume} was validated`;
  return withQualifier(base, score ? `scored ${score}` : null, ' and ');
};

const aiScore: Template = (entry, ctx) => {
  const score = scoreText(asNumber(entry.metadata['score']));
  const recommendation = firstString(entry.metadata, ['recommendation']);
  const phrase = recommendation
    ? (RECOMMENDATION[recommendation] ?? null)
    : null;
  const application = owned(ctx, 'application');

  if (!score) return `${application} was scored`;
  return withQualifier(`${application} was scored ${score}`, phrase, ' — ');
};

const parsedData: Template = (entry, ctx) => {
  const counts = countPhrase(entry);
  const resume = owned(ctx, 'resume');
  // A parsed resume with no counts reported is still a complete sentence.
  return withQualifier(`${resume} was parsed`, counts, ' — ');
};

/** The eod/survey cron jobs log with no actor and no metadata. */
const eodSubmitted: Template = (_entry, ctx) =>
  ctx.scope === 'entity'
    ? 'EOD report submitted'
    : 'An EOD report was submitted';

const eodDeleted: Template = (_entry, ctx) =>
  ctx.scope === 'entity' ? 'EOD report deleted' : 'An EOD report was deleted';

const eodCompliance: Template = (_entry, ctx) =>
  ctx.scope === 'entity' ? 'Compliance checked' : 'EOD compliance was checked';

export const AUTOMATION_TEMPLATES: Record<string, Template> = {
  ai_validation_updated: aiValidation,
  ai_score_updated: aiScore,
  parsed_data_updated: parsedData,
  eod_submitted: eodSubmitted,
  eod_deleted: eodDeleted,
  eod_compliance_checked: eodCompliance,
};
