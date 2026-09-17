/**
 * Shared types for the activity timeline.
 *
 * `ActivityEntry` is the ONLY shape the components see. Two things are
 * deliberately absent from it:
 *
 *   - `updatedAt` — migration-polluted, so it is stripped in `api.ts` and the
 *     type makes it impossible to render by accident.
 *   - the legacy `type` token — folded into `action` at the same boundary.
 */

/** The four (and only four) dot states. Everything not positive, negative or
 * automated is `neutral`. */
export type ActivityDotState =
  | 'neutral'
  | 'positive'
  | 'negative'
  | 'automated';

/** How much of the sentence the reader already knows.
 *
 * - `mixed`  — a global feed; the entity is named in the sentence.
 * - `entity` — an entity's own detail page; the entity is the page, so it is
 *              omitted and the sentence goes passive ("Moved to X by Cyril").
 */
export type ActivityScope = 'mixed' | 'entity';

/** A normalised activity entry. */
export interface ActivityEntry {
  id: string;
  /** Canonical action. Unmappable legacy entries resolve to `recorded` rather
   * than to an empty string, so the registry always has something to match. */
  action: string;
  resourceType: string;
  resourceId: string;
  description: string | null;
  /** Untrusted: `Schema.Types.Mixed` on the backend, written by 106 call sites
   * with no validation. Never read a key without narrowing it first. */
  metadata: Record<string, unknown>;
  performedBy: string | null;
  performerName: string | null;
  performerAvatar: string | null;
  /** ISO timestamp. The only time field the UI is allowed to sort or show. */
  createdAt: string;
  /** True when the action was reconstructed from the legacy `type` field, so
   * the expanded detail can be honest about it. */
  legacy: boolean;
  /** The raw legacy token, kept for the expanded detail only. */
  legacyType: string | null;
}

/** Context a template needs to phrase a sentence. */
export interface SentenceContext {
  scope: ActivityScope;
  /** Display name of the entity the feed is scoped to, when known. */
  entityName: string | null;
  /** Resolved actor: a name, `System`, or `Arista AI`. Never blank. */
  actorName: string;
  /** True when the action ran without a human (AI, cron, system). */
  automated: boolean;
}

/** A row after repeat-collapsing: one visible row, N underlying entries. */
export interface ActivityRowGroup {
  key: string;
  entries: ActivityEntry[];
  /** True when ≥2 consecutive entries collapsed into this row. */
  collapsed: boolean;
}
