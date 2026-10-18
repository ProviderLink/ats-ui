import {
  formatActivityClock,
  formatActivityTime,
  type ActivityActor,
  type ActivitySentence,
} from '@/lib/activity-sentence';
import { cn } from '@/lib/utils';
import { type ActivityLog } from '@/store/types';
import { ActivityIcon } from 'lucide-react';
import { ActorAvatar } from './activity-actor-avatar';
import { RESOURCE_ICON } from './activity-config';

/**
 * One row: who (avatar + name) · what (one short sentence, optional detail
 * line) · when (clock time; the day heading above carries the date).
 */
export function ActivityItem({
  log,
  actor,
  sentence,
  time,
  count,
  fromAt,
  showResourceIcon,
  compact,
}: {
  log: ActivityLog;
  actor: ActivityActor;
  sentence: ActivitySentence;
  time: ReturnType<typeof formatActivityTime>;
  count: number;
  fromAt: string;
  showResourceIcon?: boolean;
  compact?: boolean;
}) {
  // `sentence.actor` is the single source of truth for whether a performer is
  // named (see `showActor` in `activity-sentence.ts`). A row that names nobody
  // gets the event glyph in the avatar slot instead of a person.
  const hasActor = sentence.actor !== null;

  return (
    <li className={cn('flex items-start gap-3', compact ? 'py-2' : 'py-2.5')}>
      <ActorAvatar
        actor={actor}
        icon={sentence.icon}
        tone={sentence.tone}
        impersonal={!hasActor}
      />

      <div className="min-w-0 flex-1">
        {/* `first-letter:uppercase` keeps the capital in one place whether the
            row leads with a name or an impersonal clause. */}
        <p className="text-sm leading-snug break-words first-letter:uppercase">
          {sentence.actor && (
            <span className="font-medium text-foreground">
              {sentence.actor}{' '}
            </span>
          )}
          <span className="text-foreground/80">{sentence.text}</span>
          {count > 1 && (
            <span className="text-muted-foreground tabular-nums">
              {' '}
              ×{count}
            </span>
          )}
        </p>

        {sentence.detail && (
          <p className="mt-0.5 text-xs leading-relaxed break-words text-muted-foreground">
            {sentence.detail}
          </p>
        )}

        {showResourceIcon && log.resourceType && (
          <div className="mt-1 flex items-center gap-1 text-[11px] capitalize text-muted-foreground">
            {RESOURCE_ICON[log.resourceType] ?? (
              <ActivityIcon className="size-3" />
            )}
            <span>{log.resourceType.replace(/_/g, ' ')}</span>
          </div>
        )}
      </div>

      {time.label && (
        <time
          dateTime={time.dateTime}
          title={time.absolute}
          className="shrink-0 pt-px text-[11px] leading-snug tabular-nums text-muted-foreground"
        >
          {count > 1
            ? `${formatActivityClock(fromAt)}\u2013${formatActivityClock(log.createdAt)}`
            : formatActivityClock(log.createdAt)}
        </time>
      )}
    </li>
  );
}
