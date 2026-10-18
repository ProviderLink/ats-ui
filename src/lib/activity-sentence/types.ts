import type { ActivityIconName } from '../activity-actions';

/** Where an event came from when it has no `performedBy` user. */
export type ActivityActorKind = 'user' | 'ai' | 'system';

export interface ActivityActor {
  kind: ActivityActorKind;
  /** `_id` of the performing user, or `null` for AI / system events. */
  id: string | null;
  /** Display name — "Cyril Thomas", "AI", "System". */
  name: string;
  avatar: string | null;
  /** True when the performer is the signed-in user (rendered as "You"). */
  isViewer: boolean;
  initials: string;
}

/** Semantic tone of an event. Drives the accent colour of the row. */
export type ActivityTone =
  | 'neutral'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'ai';

export interface ActivitySentence {
  /** Leading name clause. `null` for impersonal events ("Application submitted"). */
  actor: string | null;
  /** The main clause, without the actor. Never empty. */
  text: string;
  /** Optional supporting line: rejection reason, changes, counts. */
  detail: string | null;
  tone: ActivityTone;
  /** Glyph for the badge on the actor avatar — "what kind of event". */
  icon: ActivityIconName;
  /**
   * True when the stored action could not be interpreted (a historical row
   * written before the current action vocabulary). The timeline uses this to
   * render an "unknown event" badge instead of implying a known event kind.
   */
  isLegacy: boolean;
}

export interface ActivityContext {
  /** Job title for a job id, when the jobs are loaded. */
  jobTitle?: (id: string) => string | null;
  /** IANA zone used to print interview times (the company timezone). */
  timeZone?: string;
}
