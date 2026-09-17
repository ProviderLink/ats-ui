/**
 * Dot state per action: exactly four values.
 *
 *   neutral   — the default, and what everything unspecified gets (~80%)
 *   positive  — hired / approved / validated / scheduled
 *   negative  — rejected / deleted / cancelled / no-show / deactivated
 *   automated — no human actor at all (AI, cron, or a deleted user)
 *
 * Declared per action in the registry, with one override applied here.
 */

import { lookupAction } from './actions';
import { isAutomated } from './registry';
import type { ActivityDotState, ActivityEntry } from './types';

/**
 * The dot answers "who acted", the sentence answers "what happened", so an
 * automated row reads as automated even when the action itself is negative.
 * An unattributed deletion is still a cron job's deletion, and colouring it
 * red would imply a person decided it.
 */
export function dotStateFor(entry: ActivityEntry): ActivityDotState {
  if (isAutomated(entry)) return 'automated';
  return lookupAction(entry.action, entry.resourceType)?.dot ?? 'neutral';
}
