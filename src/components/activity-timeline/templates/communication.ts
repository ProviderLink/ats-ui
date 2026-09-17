/**
 * Communication rows: interviews, feedback, client contacts and notes.
 *
 * Note on `interview_scheduled`: the backend logs the meeting channel
 * (`metadata.type`) and the round (`metadata.interviewType`) but NOT the
 * scheduled time or duration, so a time cannot appear in this sentence. The
 * date separator and the expanded block carry that instead.
 */

import { changeFields } from '../changes';
import { listPhrase } from '../format';
import {
  entityClause,
  objectPhrase,
  possessive,
  withQualifier,
} from '../grammar';
import {
  FEEDBACK_RECOMMENDATION,
  INTERVIEW_ROUND,
  MEETING_CHANNEL,
  NOTE_METHOD,
} from '../lexicon';
import { asNumber, asStringArray, firstString, humanName } from '../narrowing';
import type { SentenceContext } from '../types';
import type { Template } from './types';

/** The person a communication row is about: their name, or `a candidate`. */
function subject(ctx: SentenceContext, noun = 'candidate'): string {
  return ctx.entityName ?? `a ${noun}`;
}

/** `zoom` → `a Zoom interview`; unknown channels degrade to "an interview". */
function interviewPhrase(channel: string | null): string {
  const label = channel ? MEETING_CHANNEL[channel] : undefined;
  return label ? `a ${label} interview` : 'an interview';
}

/** Interview update rows carry only `changes` — reuse the field vocabulary. */
function changeQualifier(
  entry: Parameters<Template>[0],
  max = 2
): string | null {
  const fields = changeFields(asStringArray(entry.metadata['changes']) ?? []);
  return listPhrase(fields, max) || null;
}

const scheduled: Template = (entry, ctx) => {
  const channel = interviewPhrase(firstString(entry.metadata, ['type']));
  const round = firstString(entry.metadata, ['interviewType']);
  const roundPhrase = round ? INTERVIEW_ROUND[round] : undefined;
  // The round is only worth a clause when it says more than the channel.
  const qualifier =
    roundPhrase && roundPhrase !== 'an interview' ? `for ${roundPhrase}` : null;

  return ctx.scope === 'entity'
    ? entityClause(`Scheduled ${channel}`, qualifier, ctx)
    : withQualifier(
        `${ctx.actorName} scheduled ${channel} with ${subject(ctx)}`,
        qualifier
      );
};

const updated: Template = (entry, ctx) => {
  const qualifier = changeQualifier(entry);
  return ctx.scope === 'entity'
    ? entityClause('Interview updated', qualifier, ctx)
    : withQualifier(
        `${ctx.actorName} updated ${possessive(subject(ctx))} interview`,
        qualifier
      );
};

const cancelled: Template = (_entry, ctx) =>
  ctx.scope === 'entity'
    ? entityClause('Interview cancelled', null, ctx)
    : `${ctx.actorName} cancelled the interview with ${subject(ctx)}`;

const completed: Template = (_entry, ctx) =>
  ctx.scope === 'entity'
    ? entityClause('Interview completed', null, ctx)
    : `${ctx.actorName} completed the interview with ${subject(ctx)}`;

const noShow: Template = (_entry, ctx) =>
  ctx.scope === 'entity'
    ? entityClause('Interview marked as a no-show', null, ctx)
    : `${ctx.actorName} marked the interview with ${subject(ctx)} as a no-show`;

const feedbackSubmitted: Template = (entry, ctx) => {
  const rating = asNumber(entry.metadata['rating']);
  const recommendation = firstString(entry.metadata, ['recommendation']);
  const parts: string[] = [];
  if (rating !== null) parts.push(`${rating}/5`);
  if (recommendation) {
    parts.push(
      FEEDBACK_RECOMMENDATION[recommendation] ??
        recommendation.replace(/_/g, ' ')
    );
  }
  const qualifier = listPhrase(parts, 2) || null;

  return ctx.scope === 'entity'
    ? entityClause('Feedback submitted', qualifier, ctx)
    : withQualifier(
        `${ctx.actorName} submitted interview feedback on ${subject(ctx)}`,
        qualifier
      );
};

/** Contact rows are about the client, which is the entity in an entity feed. */
const contactAdded: Template = (entry, ctx) => {
  const name = humanName(firstString(entry.metadata, ['contactName', 'name']));
  return ctx.scope === 'entity'
    ? entityClause('Contact added', name, ctx)
    : withQualifier(
        `${ctx.actorName} added a contact to ${objectPhrase(entry, ctx)}`,
        name
      );
};

const contactUpdated: Template = (entry, ctx) => {
  const name = humanName(firstString(entry.metadata, ['contactName']));
  const fields = changeQualifier(entry);
  const parts = [name, fields].filter((part): part is string => !!part);
  const qualifier = parts.length > 0 ? listPhrase(parts, 2) : null;

  return ctx.scope === 'entity'
    ? entityClause('Contact updated', qualifier, ctx)
    : withQualifier(
        `${ctx.actorName} updated a contact on ${objectPhrase(entry, ctx)}`,
        qualifier
      );
};

const contactRemoved: Template = (entry, ctx) =>
  ctx.scope === 'entity'
    ? entityClause('Contact removed', null, ctx)
    : `${ctx.actorName} removed a contact from ${objectPhrase(entry, ctx)}`;

/**
 * `metadata.method` is how the note was captured. It reads as a clause, not as
 * a trailing qualifier ("added a note to a client — from a call"), so it is
 * folded into a prepositional phrase in a mixed feed.
 */
const noteAdded: Template = (entry, ctx) => {
  const method = firstString(entry.metadata, ['method']);
  const qualifier = method ? (NOTE_METHOD[method] ?? null) : null;
  return ctx.scope === 'entity'
    ? entityClause('Note added', qualifier, ctx)
    : withQualifier(
        `${ctx.actorName} added a note to ${objectPhrase(entry, ctx)}${method ? ` after a ${method}` : ''}`,
        null
      );
};

const noteUpdated: Template = (entry, ctx) =>
  ctx.scope === 'entity'
    ? entityClause('Note updated', null, ctx)
    : `${ctx.actorName} updated a note on ${objectPhrase(entry, ctx)}`;

const noteDeleted: Template = (entry, ctx) =>
  ctx.scope === 'entity'
    ? entityClause('Note deleted', null, ctx)
    : `${ctx.actorName} deleted a note on ${objectPhrase(entry, ctx)}`;

/** Cron-driven, no human actor. */
const surveyDispatched: Template = (_entry, ctx) =>
  ctx.scope === 'entity'
    ? 'Client surveys sent'
    : `${ctx.actorName} sent client surveys`;

export const COMMUNICATION_TEMPLATES: Record<string, Template> = {
  interview_scheduled: scheduled,
  interview_updated: updated,
  interview_cancelled: cancelled,
  interview_completed: completed,
  interview_no_show: noShow,
  interview_feedback_submitted: feedbackSubmitted,
  contact_added: contactAdded,
  contact_updated: contactUpdated,
  contact_removed: contactRemoved,
  note_added: noteAdded,
  note_updated: noteUpdated,
  note_deleted: noteDeleted,
  survey_dispatched: surveyDispatched,
};
