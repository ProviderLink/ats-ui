import type { ActivityLog } from '@/store/types';
import type { ActivityContext, ActivitySentence } from './types';

/** Everything a domain handler needs to describe one log entry. */
export interface SentenceScope {
  key: string;
  log: ActivityLog;
  metadata: Record<string, unknown>;
  changes: string[];
  /** AI validity verdict, or `null` when the entry carries none. */
  isValid: boolean | null;
  ctx: ActivityContext;
  /** True when no person can be credited for this event. */
  unattributed: boolean;
  /** Sentence led by the actor, when crediting one is truthful. */
  finish: (text: string, extra?: string | null) => ActivitySentence;
  /** Sentence with no actor clause. */
  impersonal: (text: string, extra?: string | null) => ActivitySentence;
}

/** A handler returns `null` for actions it does not own (or cannot describe). */
export type SentenceHandler = (scope: SentenceScope) => ActivitySentence | null;
