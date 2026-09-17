/**
 * The timeline container.
 *
 * Composition only: data comes from `useActivityFeed`, collapsing from
 * `grouping.ts`, sentences from `registry.ts`. Every child is independently
 * replaceable.
 *
 *   collapse → cap → group by day
 *
 * The cap is applied to collapsed rows, not to raw entries, so repeat
 * collapsing cannot be defeated by the render window.
 *
 * Two modes:
 *   1. self-fetch — pass `resourceType` + `resourceId`
 *   2. controlled — pass `entries` (used by the fixture harness and tests)
 *
 * There is no filter UI by design. Every consumer is an entity-scoped sheet
 * showing one entity's history, where the feed is short and filtering is noise.
 * The two pagination controls collapse into a single "show older" affordance,
 * because the reader cannot act differently on "in memory" versus "on server".
 */

import { usePermission } from '@/hooks/use-permission';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import { ActivityDaySection } from './activity-day-group';
import {
  ActivityEmpty,
  ActivityError,
  ActivitySkeleton,
} from './activity-states';
import { buildDaySections, collapseRepeats } from './grouping';
import type { ActivityEntry, ActivityScope } from './types';
import { useActivityFeed } from './use-activity-feed';

/** Rows rendered before the "show older" control appears. */
const DEFAULT_MAX_ROWS = 100;

/** Rows revealed per click on that control. */
const REVEAL_STEP = 50;

export interface ActivityTimelineProps {
  resourceType: string;
  resourceId: string;
  /**
   * Whether the reader is on a single entity's page or looking at a mixed feed.
   *
   * `entity` omits the entity from the sentence and goes passive
   * ("Moved to X by Cyril"). Callers must state this — the component will not
   * guess it from `resourceType`.
   */
  scope?: ActivityScope;
  /** Display name of the entity, so a mixed feed can name it. */
  entityName?: string | null;
  /** Rows rendered before the "show older" control appears. */
  maxItems?: number;
  /** Compact variant — tighter rows for dense side sheets. */
  compact?: boolean;
  className?: string;
  /** Controlled mode: render exactly these entries. */
  entries?: ActivityEntry[];
  /** External loading flag, only used with `entries`. */
  loading?: boolean;
  /** External error message, only used with `entries`. */
  error?: string | null;
}

export function ActivityTimeline({
  resourceType,
  resourceId,
  scope = 'entity',
  entityName = null,
  maxItems = DEFAULT_MAX_ROWS,
  compact = false,
  className,
  entries: controlledEntries,
  loading: controlledLoading,
  error: controlledError,
}: ActivityTimelineProps) {
  const { hasPermission } = usePermission();
  const canRead = hasPermission('activityLogs', 'read');

  const feed = useActivityFeed({
    resourceType,
    resourceId,
    entries: controlledEntries,
    loading: controlledLoading,
    error: controlledError,
    enabled: canRead,
  });

  // The window is keyed per entity so switching entity starts from the top of
  // the new history rather than a stale window size, with no reset effect.
  const [windows, setWindows] = useState<Record<string, number>>({});
  const cap = windows[resourceId] ?? maxItems;

  const rows = useMemo(() => collapseRepeats(feed.entries), [feed.entries]);
  const capped = useMemo(() => rows.slice(0, cap), [rows, cap]);
  const sections = useMemo(() => buildDaySections(capped), [capped]);

  const hiddenLocally = Math.max(0, rows.length - capped.length);
  const canLoadMore = hiddenLocally > 0 || feed.hasMoreOnServer;
  const nextChunk = Math.min(REVEAL_STEP, hiddenLocally);

  // Roles without `activityLogs:read` would otherwise see an empty feed, which
  // is indistinguishable from a genuinely empty history. Render nothing.
  if (!canRead) return null;

  const revealMore = () => {
    // Grow the local window first — those rows are already in memory, so the
    // common case never touches the network.
    setWindows(prev => ({
      ...prev,
      [resourceId]: (prev[resourceId] ?? maxItems) + REVEAL_STEP,
    }));
    if (hiddenLocally === 0) feed.loadMore();
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {feed.loading ? (
        <ActivitySkeleton rows={compact ? 3 : 4} />
      ) : feed.error && feed.entries.length === 0 ? (
        <ActivityError onRetry={feed.retry} retrying={false} />
      ) : sections.length === 0 ? (
        <ActivityEmpty />
      ) : (
        <div className="relative flex flex-col">
          {/* Vertical spine, kept light so it groups without drawing a road. */}
          <span
            aria-hidden
            className="ats-activity-spine pointer-events-none absolute top-3 bottom-3 left-[9px] w-px"
          />
          {sections.map(section => (
            <ActivityDaySection
              key={section.key}
              section={section}
              ctx={{ scope }}
              entityName={entityName}
              compact={compact}
            />
          ))}
        </div>
      )}

      {canLoadMore && !feed.loading && (
        <button
          type="button"
          onClick={revealMore}
          className="mx-auto text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {hiddenLocally > 0
            ? `Show ${nextChunk} older ${nextChunk === 1 ? 'entry' : 'entries'}`
            : 'Load older activity'}
        </button>
      )}
    </div>
  );
}
