import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useActivityActors } from '@/hooks/use-activity-actors';
import {
  buildActivitySentence,
  type ActivityActor,
  type ActivityContext,
  type ActivitySentence,
} from '@/lib/activity-sentence';
import { formatActivityDay, formatActivityTime } from '@/lib/activity-time';
import { cn } from '@/lib/utils';
import { useActivityLogStore } from '@/store/slices/activity-logs.store';
import { useJobStore } from '@/store/slices/jobs.store';
import { useSettingsStore } from '@/store/slices/settings.store';
import {
  type ActivityLog,
  type ActivityResourceType as ActivityResourceTypeValue,
} from '@/store/types';
import { ActivityIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityItem } from './activity-item';

function isFoldable(sentence: ActivitySentence): boolean {
  return sentence.detail === null && sentence.text.startsWith('edited ');
}

/** Stable reference for feeds that have not loaded yet. */
const EMPTY_LOGS: ActivityLog[] = [];

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
  const feeds = useActivityLogStore(s => s.feeds);
  const storeLoading = useActivityLogStore(s => s.loading);
  const loadError = useActivityLogStore(s => s.error);
  const fetchForEntity = useActivityLogStore(s => s.fetchForEntity);
  const fetchMore = useActivityLogStore(s => s.fetchMore);
  const serverTotal = useActivityLogStore(s => s.totals[`${resourceType}|${resourceId}`]);
  const { resolve } = useActivityActors();
  const [loadingMore, setLoadingMore] = useState(false);

  const key = `${resourceType}|${resourceId}`;
  const isControlled = controlledLogs !== undefined;
  const baseLogs: ActivityLog[] = isControlled
    ? controlledLogs
    : (feeds[key] ?? EMPTY_LOGS);
  const logs = useMemo(() => {
    const extra = (extraLogs ?? []).filter(e => e.resourceId === resourceId);
    if (extra.length === 0) return baseLogs;
    return [...baseLogs, ...extra].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [baseLogs, extraLogs, resourceId]);

  // Lookups the sentences use to name a job or print an interview time.
  const jobs = useJobStore(s => s.items);
  const companyTimezone = useSettingsStore(s => s.settings?.companyTimezone);
  const context = useMemo<ActivityContext>(() => {
    const titles = new Map(jobs.map(j => [j._id, j.title]));
    return { jobTitle: id => titles.get(id) ?? null, timeZone: companyTimezone };
  }, [jobs, companyTimezone]);
  const loading = isControlled ? !!controlledLoading : storeLoading;

  // Self-fetch mode: trigger a fetch on mount and whenever the entity changes.
  const lastIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (isControlled) return;
    if (lastIdRef.current === resourceId) return;
    lastIdRef.current = resourceId;
    void fetchForEntity(resourceType, resourceId);
  }, [isControlled, resourceType, resourceId, fetchForEntity]);

  // The selected view and how many entries are revealed are kept per feed, so
  // opening another record starts again from the newest entries.
  const [view, setView] = useState({ key, filterId: 'all', visible: pageSize });
  const current =
    view.key === key ? view : { key, filterId: 'all', visible: pageSize };
  const activeFilter = filters?.find(f => f.id === current.filterId);
  const matches = (log: ActivityLog) => !activeFilter || activeFilter.match(log);

  const filtered = useMemo(
    () => logs.filter(log => !activeFilter || activeFilter.match(log)),
    [logs, activeFilter]
  );
  const shown = useMemo(
    () => filtered.slice(0, Math.min(current.visible, maxItems)),
    [filtered, current.visible, maxItems]
  );
  const isLoading = loading && logs.length === 0;

  const loadedFromServer = baseLogs.filter(
    l => !String(l._id).startsWith('local-')
  ).length;
  const serverHasMore =
    !isControlled && serverTotal !== undefined && loadedFromServer < serverTotal;
  const canShowMore =
    filtered.length > shown.length && shown.length < maxItems
      ? true
      : serverHasMore;

  async function showMore() {
    const target = current.visible + pageSize;
    setView({ ...current, visible: target });
    if (isControlled || filtered.length >= target) return;

    // The loaded pages do not hold enough entries for this view; fetch older
    // pages until they do, or the feed runs out.
    setLoadingMore(true);
    try {
      for (let i = 0; i < 10; i++) {
        const state = useActivityLogStore.getState();
        const base = state.feeds[key] ?? [];
        const loaded = base.filter(l => !String(l._id).startsWith('local-'));
        if (loaded.length >= (state.totals[key] ?? 0)) break;
        const extra = (extraLogs ?? []).filter(e => e.resourceId === resourceId);
        if ([...base, ...extra].filter(matches).length >= target) break;
        await fetchMore(resourceType, resourceId);
      }
    } finally {
      setLoadingMore(false);
    }
  }

  // Build the render model once per data change, grouped by calendar day so the
  // rows themselves only need to show a clock time.
  const groups = useMemo(() => {
    const now = new Date();
    const result: {
      day: string;
      items: {
        log: ActivityLog;
        actor: ActivityActor;
        sentence: ActivitySentence;
        time: ReturnType<typeof formatActivityTime>;
        /** How many identical entries this row stands for. */
        count: number;
        /** Timestamp of the oldest entry folded into this row. */
        fromAt: string;
      }[];
    }[] = [];
    for (const log of shown) {
      const day = formatActivityDay(log.createdAt, now);
      const actor = resolve(log);
      const item = {
        log,
        actor,
        sentence: buildActivitySentence(log, actor, context),
        time: formatActivityTime(log.createdAt, now),
        count: 1,
        fromAt: log.createdAt,
      };
      const last = result[result.length - 1];
      if (last && last.day === day) {
        // Old "edited the …" rows say nothing about what changed, so a run of
        // them by the same person folds into one row instead of padding the
        // feed. Nothing is hidden: the count and time range stay visible.
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
      } else result.push({ day, items: [item] });
    }
    return result;
  }, [shown, resolve, context]);

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
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Activity view">
          {[{ id: 'all', label: 'All' }, ...filters].map(f => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={current.filterId === f.id}
              onClick={() =>
                setView({ key, filterId: f.id, visible: pageSize })
              }
              className={cn(
                'rounded-full px-2.5 py-1 text-xs transition-colors',
                current.filterId === f.id
                  ? 'bg-muted font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="size-6 rounded-full" />
              <div className="flex-1 flex flex-col gap-1.5">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : shown.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-center">
          <ActivityIcon className="size-5 text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground">
            {!isControlled && loadError
              ? /permission/i.test(loadError)
                ? 'You don\u2019t have access to this activity.'
                : 'Couldn\u2019t load activity.'
              : current.filterId !== 'all'
                ? 'Nothing here yet.'
                : 'No activity yet.'}
          </p>
        </div>
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
          {canShowMore && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 self-start px-2 text-xs text-muted-foreground"
              disabled={loadingMore}
              onClick={() => void showMore()}
            >
              {loadingMore ? 'Loading\u2026' : 'Show more'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
