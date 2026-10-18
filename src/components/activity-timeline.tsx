import { Button } from '@/components/ui/button';
import { useActivityActors } from '@/hooks/use-activity-actors';
import { cn } from '@/lib/utils';
import {
  type ActivityLog,
  type ActivityResourceType as ActivityResourceTypeValue,
} from '@/store/types';
import { useMemo } from 'react';
import { ActivityItem } from './activity-item';
import { ActivityFilterTabs } from './activity-timeline/activity-filter-tabs';
import {
  ActivityEmptyState,
  ActivitySkeleton,
} from './activity-timeline/activity-feed-states';
import { groupActivityLogs } from './activity-timeline/group-activity-logs';
import { useActivityContext } from './activity-timeline/use-activity-context';
import { useActivityFeed } from './activity-timeline/use-activity-feed';

export interface ActivityTimelineProps {
  /** The kind of entity this feed belongs to. Required for self-fetch mode. */
  resourceType: ActivityResourceTypeValue | string;
  /** The entity id. Invalid/placeholder ids short-circuit to an empty state. */
  resourceId: string;
  /** Optional heading rendered above the feed. Defaults to no heading. */
  heading?: string;
  /** Show the resource-type label under each entry (useful in the global feed
   * where several resource types are interleaved). Entity-scoped views leave
   * this off to keep the list compact. */
  showResourceIcon?: boolean;
  /** Max entries to render before the container scrolls internally. */
  maxItems?: number;
  /** Compact variant — tighter padding for dense side sheets. */
  compact?: boolean;
  className?: string;
  /** Pre-loaded logs. When provided, the component skips self-fetching and
   * renders exactly these entries — useful for the global feed where filters
   * change the dataset every query. */
  logs?: ActivityLog[];
  /** External loading flag — only used together with `logs`. */
  loading?: boolean;
  /** Extra entries merged into the feed by time — e.g. a candidate's emails,
   * which live in their own collection rather than in the activity log. */
  extraLogs?: ActivityLog[];
  /** Optional views over the feed ("Sign-ins", "Changes"). An "All" view is
   * always added first. */
  filters?: ActivityFilter[];
  /** How many entries to show at first, and how many more each "Show more"
   * click reveals. Older pages are fetched from the server as needed. */
  pageSize?: number;
}

export interface ActivityFilter {
  id: string;
  label: string;
  match: (log: ActivityLog) => boolean;
}

/**
 * Activity feed rendered as a vertical timeline. Two modes:
 *
 * 1. Self-fetch (default): pulls the per-entity feed from
 *    `useActivityLogStore.fetchForEntity`, cached by `${resourceType}|${resourceId}`.
 * 2. Controlled: pass `logs` (and optionally `loading`) to render entries you
 *    already have.
 *
 * Each row leads with the performer's avatar and a tone badge, followed by a
 * single plain sentence:
 *
 *   **Cyril Thomas** moved the candidate from Phone Screen to Offer   14:32
 *   Reason: Skills mismatch
 *
 * Rows with no recorded performer carry the event glyph in the avatar slot and
 * drop the corner badge, which would otherwise repeat it (see `ActorAvatar`).
 *
 * The performer is resolved client-side from the boot-loaded user list, so no
 * extra API calls are made. To update optimistically after a mutation, call
 * `useActivityLogStore.getState()._prepend(resourceType, resourceId, log)`.
 */
export function ActivityTimeline({
  resourceType,
  resourceId,
  heading,
  showResourceIcon = false,
  maxItems = 200,
  compact = false,
  className,
  logs: controlledLogs,
  loading: controlledLoading,
  extraLogs,
  filters,
  pageSize = 10,
}: ActivityTimelineProps) {
  const feed = useActivityFeed({
    resourceType,
    resourceId,
    controlledLogs,
    controlledLoading,
    extraLogs,
    filters,
    pageSize,
    maxItems,
  });
  const { resolve } = useActivityActors();
  const context = useActivityContext();
  const { logs, shown } = feed;

  const groups = useMemo(
    () => groupActivityLogs(shown, resolve, context),
    [shown, resolve, context]
  );

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {heading && (
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">{heading}</h4>
          {logs.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
            </span>
          )}
        </div>
      )}

      {filters && filters.length > 0 && (
        <ActivityFilterTabs
          filters={filters}
          value={feed.filterId}
          onChange={feed.selectFilter}
        />
      )}

      {feed.isLoading ? (
        <ActivitySkeleton />
      ) : shown.length === 0 ? (
        <ActivityEmptyState
          loadError={feed.isControlled ? null : feed.loadError}
          isFiltered={feed.filterId !== 'all'}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map(group => (
            <section key={group.day} className="flex flex-col">
              <h5 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {group.day}
              </h5>
              <ol className="flex flex-col divide-y divide-border/50">
                {group.items.map((item, idx) => (
                  <ActivityItem
                    key={item.log._id ?? idx}
                    log={item.log}
                    actor={item.actor}
                    sentence={item.sentence}
                    time={item.time}
                    count={item.count}
                    fromAt={item.fromAt}
                    showResourceIcon={showResourceIcon}
                    compact={compact}
                  />
                ))}
              </ol>
            </section>
          ))}
          {feed.canShowMore && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 self-start px-2 text-xs text-muted-foreground"
              disabled={feed.loadingMore}
              onClick={() => void feed.showMore()}
            >
              {feed.loadingMore ? 'Loading\u2026' : 'Show more'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
