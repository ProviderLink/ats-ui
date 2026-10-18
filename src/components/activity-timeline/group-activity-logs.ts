import {
  buildActivitySentence,
  type ActivityActor,
  type ActivityContext,
  type ActivitySentence,
} from '@/lib/activity-sentence';
import { formatActivityDay, formatActivityTime } from '@/lib/activity-time';
import type { ActivityLog } from '@/store/types';

export interface ActivityRow {
  log: ActivityLog;
  actor: ActivityActor;
  sentence: ActivitySentence;
  time: ReturnType<typeof formatActivityTime>;
  /** How many identical entries this row stands for. */
  count: number;
  /** Timestamp of the oldest entry folded into this row. */
  fromAt: string;
}

export interface ActivityDayGroup {
  day: string;
  items: ActivityRow[];
}

function isFoldable(sentence: ActivitySentence): boolean {
  return sentence.detail === null && sentence.text.startsWith('edited ');
}

/**
 * Groups logs by calendar day so rows only need to show a clock time.
 *
 * Old "edited the …" rows say nothing about what changed, so a run of them by
 * the same person folds into one row instead of padding the feed. Nothing is
 * hidden: the count and time range stay visible.
 */
export function groupActivityLogs(
  logs: ActivityLog[],
  resolve: (log: ActivityLog) => ActivityActor,
  context: ActivityContext
): ActivityDayGroup[] {
  const now = new Date();
  const result: ActivityDayGroup[] = [];
  for (const log of logs) {
    const day = formatActivityDay(log.createdAt, now);
    const actor = resolve(log);
    const item: ActivityRow = {
      log,
      actor,
      sentence: buildActivitySentence(log, actor, context),
      time: formatActivityTime(log.createdAt, now),
      count: 1,
      fromAt: log.createdAt,
    };
    const last = result[result.length - 1];
    if (!last || last.day !== day) {
      result.push({ day, items: [item] });
      continue;
    }
    const prev = last.items[last.items.length - 1];
    if (
      prev &&
      isFoldable(prev.sentence) &&
      isFoldable(item.sentence) &&
      prev.sentence.text === item.sentence.text &&
      prev.actor.id === item.actor.id &&
      prev.actor.name === item.actor.name
    ) {
      prev.count += 1;
      prev.fromAt = log.createdAt;
    } else {
      last.items.push(item);
    }
  }
  return result;
}
