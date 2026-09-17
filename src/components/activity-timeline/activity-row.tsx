/**
 * One timeline row.
 *
 * Layout is a single line wherever the sentence fits:
 *
 *   [avatar + state dot] [spine] sentence ………… chevron  time
 *
 * Identity (the actor avatar) is what the eye scans for, and the action is
 * already in the sentence, so there is no action icon. Colour appears in
 * exactly two places: the dot state, and the avatar's faint tint.
 *
 * An expandable row uses a real `<button>` so keyboard and assistive tech get
 * correct semantics for free, with the time as a flex sibling outside the
 * control (a control's accessible name should not include a timestamp).
 */

import { cn } from '@/lib/utils';
import { ChevronDownIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { formatAbsolute, initials, relativeTime } from './format';
import type { ActivityDotState } from './types';

export interface ActivityRowProps {
  actorName: string;
  avatarUrl: string | null;
  dot: ActivityDotState;
  sentence: string;
  createdAt: string;
  /**
   * Repeat count when this row collapsed a run of identical entries. Rendered
   * as a trailing `(3 times)` rather than pluralised, because the grammar of an
   * arbitrary sentence cannot be pluralised mechanically.
   */
  repeatCount: number;
  /** `true` when there is something worth expanding. */
  expandable: boolean;
  expanded: boolean;
  onToggle: () => void;
  compact?: boolean;
  /** The expanded block. Rendered only when `expanded`. */
  children?: ReactNode;
}

/** Dot class per state. These four classes are the only colour mapping. */
const DOT_CLASS: Record<ActivityDotState, string> = {
  neutral: 'ats-activity-dot--neutral',
  positive: 'ats-activity-dot--positive',
  negative: 'ats-activity-dot--negative',
  automated: 'ats-activity-dot--automated',
};

const AVATAR_CLASS: Record<ActivityDotState, string> = {
  neutral: 'ats-activity-avatar--neutral',
  positive: 'ats-activity-avatar--positive',
  negative: 'ats-activity-avatar--negative',
  automated: 'ats-activity-avatar--automated',
};

export function ActivityRow({
  actorName,
  avatarUrl,
  dot,
  sentence,
  createdAt,
  repeatCount,
  expandable,
  expanded,
  onToggle,
  compact = false,
  children,
}: ActivityRowProps) {
  const text =
    repeatCount > 1 ? `${sentence} (${repeatCount} times)` : sentence;

  const content = (
    <>
      {/* Rail: avatar with the action state as a corner dot. */}
      <span
        className={cn(
          'ats-activity-avatar relative z-10 grid shrink-0 place-items-center rounded-full font-medium',
          AVATAR_CLASS[dot],
          compact ? 'size-5 text-[9px]' : 'size-[20px] text-[9px]'
        )}
        aria-hidden
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="size-full rounded-full object-cover"
          />
        ) : (
          initials(actorName)
        )}
        <span
          className={cn(
            'absolute -right-0.5 -bottom-0.5 size-2 rounded-full ring-2 ring-background',
            DOT_CLASS[dot]
          )}
        />
      </span>

      {/* The sentence. Never line-clamped: a 110-character sentence can need
          three lines in a narrow side sheet, and hiding the end of it with no
          way to reveal it would be worse than an uneven row. */}
      <span className="min-w-0 flex-1 text-sm leading-[1.45] break-words text-foreground/90">
        {text}
      </span>

      {expandable && (
        <ChevronDownIcon
          className={cn(
            'mt-0.5 size-3 shrink-0 text-muted-foreground/0 transition-transform group-hover:text-muted-foreground/70',
            expanded && 'rotate-180 text-muted-foreground/70'
          )}
        />
      )}
    </>
  );

  return (
    <li role="listitem" className="flex flex-col">
      <div
        className={cn(
          'group relative flex items-start gap-3 rounded-md px-2',
          compact ? 'py-1.5' : 'py-2',
          expanded && 'ats-activity-expanded'
        )}
      >
        {expandable ? (
          <button
            type="button"
            aria-expanded={expanded}
            onClick={onToggle}
            className="ats-activity-hover relative z-10 flex min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-md text-left"
          >
            {content}
          </button>
        ) : (
          <div className="ats-activity-hover relative z-10 flex min-w-0 flex-1 items-start gap-3 rounded-md">
            {content}
          </div>
        )}

        {/* Sibling of the control, so never part of its accessible name. */}
        <time
          dateTime={createdAt}
          title={formatAbsolute(createdAt)}
          className="relative z-10 shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground/70"
        >
          {relativeTime(createdAt)}
        </time>
      </div>

      {expanded && children}
    </li>
  );
}
