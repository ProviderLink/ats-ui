import { useActivityLogStore } from '@/store/slices/activity-logs.store';
import type { ActivityLog } from '@/store/types';
import { useEffect, useMemo, useRef, useState } from 'react';

/** Stable reference for feeds that have not loaded yet. */
const EMPTY_LOGS: ActivityLog[] = [];
const MAX_PAGES_PER_CLICK = 10;
const isLocal = (l: ActivityLog) => String(l._id).startsWith('local-');

interface FilterLike {
  id: string;
  match: (log: ActivityLog) => boolean;
}

interface UseActivityFeedArgs {
  resourceType: string;
  resourceId: string;
  controlledLogs?: ActivityLog[];
  controlledLoading?: boolean;
  extraLogs?: ActivityLog[];
  filters?: FilterLike[];
  pageSize: number;
  maxItems: number;
}

export function useActivityFeed({
  resourceType,
  resourceId,
  controlledLogs,
  controlledLoading,
  extraLogs,
  filters,
  pageSize,
  maxItems,
}: UseActivityFeedArgs) {
  const feeds = useActivityLogStore(s => s.feeds);
  const storeLoading = useActivityLogStore(s => s.loading);
  const loadError = useActivityLogStore(s => s.error);
  const fetchForEntity = useActivityLogStore(s => s.fetchForEntity);
  const fetchMore = useActivityLogStore(s => s.fetchMore);
  const key = `${resourceType}|${resourceId}`;
  const serverTotal = useActivityLogStore(s => s.totals[key]);
  const [loadingMore, setLoadingMore] = useState(false);

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

  const loadedFromServer = baseLogs.filter(l => !isLocal(l)).length;
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
      for (let i = 0; i < MAX_PAGES_PER_CLICK; i++) {
        const state = useActivityLogStore.getState();
        const base = state.feeds[key] ?? [];
        const loaded = base.filter(l => !isLocal(l));
        if (loaded.length >= (state.totals[key] ?? 0)) break;
        const extra = (extraLogs ?? []).filter(e => e.resourceId === resourceId);
        if ([...base, ...extra].filter(matches).length >= target) break;
        await fetchMore(resourceType, resourceId);
      }
    } finally {
      setLoadingMore(false);
    }
  }

  return {
    logs,
    shown,
    isControlled,
    isLoading: loading && logs.length === 0,
    loadError,
    filterId: current.filterId,
    selectFilter: (filterId: string) =>
      setView({ key, filterId, visible: pageSize }),
    canShowMore,
    loadingMore,
    showMore,
  };
}
