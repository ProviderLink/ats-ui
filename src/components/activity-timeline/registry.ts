/**
 * The sentence registry's public surface.
 *
 * `renderSentence` is the only entry point the components use. It never
 * throws and never returns an empty string — an unknown action still produces
 * a grammatical sentence, so a new backend action can never render as a raw
 * keyword.
 */

import { AI_ACTIONS, ALLOWED_METADATA_KEYS, lookupAction } from './actions';
import { capSentence } from './format';
import { entityNoun, sentence } from './grammar';
import type { ActivityEntry, SentenceContext } from './types';

export { AI_ACTIONS } from './actions';
export type { ActionDefinition } from './actions';

/**
 * Resolve the actor name shown as the sentence subject.
 *
 * - a real user → their display name
 * - an AI action with no performer → `Arista AI`
 * - anything else unperformed (cron, system, deleted user) → `System`
 */
export function resolveActorName(entry: ActivityEntry): {
  name: string;
  automated: boolean;
} {
  const raw = entry.performerName;
  const usable = raw && !/^[a-f\d]{24}$/i.test(raw) ? raw : null;
  if (usable) return { name: usable, automated: false };

  if (AI_ACTIONS.has(entry.action))
    return { name: 'Arista AI', automated: true };
  return { name: 'System', automated: true };
}

/** True when this row should render as automated regardless of attribution. */
export function isAutomated(entry: ActivityEntry): boolean {
  if (AI_ACTIONS.has(entry.action)) return true;
  return resolveActorName(entry).automated;
}

/**
 * The generic fallback. Still a complete, grammatical sentence — never a raw
 * action token, never an orphan fragment.
 */
function fallbackSentence(entry: ActivityEntry, ctx: SentenceContext): string {
  const noun = entityNoun(entry.resourceType);
  const object =
    ctx.entityName ?? (ctx.scope === 'mixed' ? `a ${noun}` : `this ${noun}`);

  // Automated rows read better as state, because "Arista AI performed an
  // action" would be a lie about provenance.
  if (ctx.automated) {
    return ctx.scope === 'mixed'
      ? `An action was recorded on ${object}`
      : 'An activity was recorded';
  }
  return sentence({
    verb: 'recorded',
    object: `an activity on ${object}`,
    ctx,
  });
}

/**
 * Render one entry as a sentence.
 *
 * The template is selected from the registry by `action`, with a
 * `resourceType` override so `tag`/`work_entry` rows use their workspace
 * wording. An action with no definition falls through to the fallback.
 */
export function renderSentence(
  entry: ActivityEntry,
  ctx: SentenceContext
): string {
  const definition = lookupAction(entry.action, entry.resourceType);
  if (!definition) return fallbackSentence(entry, ctx);

  try {
    const rendered = definition.template(entry, ctx);
    return capSentence(rendered.trim() || fallbackSentence(entry, ctx));
  } catch {
    // A template must never be able to blank a row out. If one throws (a
    // shape we did not anticipate in `metadata`), show the honest fallback.
    return fallbackSentence(entry, ctx);
  }
}

export { ALLOWED_METADATA_KEYS };
