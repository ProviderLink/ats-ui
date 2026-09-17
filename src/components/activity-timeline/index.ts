/**
 * Activity timeline — public surface.
 *
 * Call sites import `ActivityTimeline` and nothing else; the rest is exported
 * because it is independently testable pure logic (the registry's sentence
 * rendering, the legacy-token boundary, collapsing) and because a mixed
 * global feed would need `scope`/`entityName` rather than anything internal.
 */

// The component.
export { ActivityTimeline } from './activity-timeline';
export type { ActivityTimelineProps } from './activity-timeline';

// Registry: how an action becomes a sentence, and who acted.
export { dotStateFor } from './dot-state';
export { isAutomated, renderSentence, resolveActorName } from './registry';

// API boundary: legacy `type`→`action` mapping, allowlisting, `updatedAt`
// stripping. Exported so tests can exercise the normalisation directly.
export { fetchEntityActivity, resolveAction, toEntry } from './api';

// Row shaping, for tests and for any future grouped feed.
export { buildDaySections, collapseRepeats } from './grouping';

// The hard row limit, so callers/tests can reference the real number.
export { MAX_SENTENCE_CHARS } from './format';

export type {
  ActivityDotState,
  ActivityEntry,
  ActivityRowGroup,
  ActivityScope,
  SentenceContext,
} from './types';
