import type { ActivityEntry, SentenceContext } from '../types';

/**
 * A sentence template: one action in, one grammatical sentence out.
 *
 * A template may read ONLY the metadata keys it declares in
 * `ACTIONS[action].consumes`. Everything else is invisible.
 */
export type Template = (entry: ActivityEntry, ctx: SentenceContext) => string;
