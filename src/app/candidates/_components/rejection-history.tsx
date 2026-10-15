import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getJson } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { useApplicationStore } from '@/store/slices/applications.store';
import { useJobStore } from '@/store/slices/jobs.store';
import { useUserStore } from '@/store/slices/users.store';
import { useCallback, useEffect, useState } from 'react';

/**
 * Candidate transition history.
 *
 * Rejections and job changes are logged against the application (with the
 * candidate as `relatedType`/`relatedId`), while talent pool and eligibility
 * changes are logged against the candidate. This panel asks the API for both —
 * `includeRelated=true` adds entries that merely reference the candidate — so
 * the whole journey appears in one place.
 *
 * `disposition` is deliberately absent: it duplicates the application-level
 * `rejected` entry, which already carries the destination and reason.
 * Secondary rows that a reject writes as side effects (the talent-pool and
 * eligibility flips) are collapsed below, so one action reads as one entry.
 */
const TRANSITION_ACTIONS = new Set([
  'rejected',
  'job_changed',
  'eligibility_changed',
  'talent_pool_added',
  'talent_pool_removed',
  'hired',
]);

/** Actions a reject performs as a side effect rather than by user choice. */
const REJECT_SIDE_EFFECTS = new Set([
  'talent_pool_added',
  'talent_pool_removed',
  'eligibility_changed',
]);

/**
 * Collapse the rows a single operation writes.
 *
 * A final reject writes an application-level `rejected` row plus candidate-level
 * talent-pool / eligibility rows, all at the same instant. Keep the primary row
 * and drop the side effects that share its second, so the log is not padded with
 * one click appearing three times. A genuine standalone talent-pool change
 * happens at a different time and is therefore preserved.
 */
function collapseSideEffects<T extends { action: string; createdAt: string }>(
  entries: T[]
): T[] {
  const primarySeconds = new Set(
    entries
      .filter(e => !REJECT_SIDE_EFFECTS.has(e.action))
      .map(e => Math.floor(new Date(e.createdAt).getTime() / 1000))
  );
  return entries.filter(e => {
    if (!REJECT_SIDE_EFFECTS.has(e.action)) return true;
    return !primarySeconds.has(
      Math.floor(new Date(e.createdAt).getTime() / 1000)
    );
  });
}

export function RejectionHistory({
  candidateId,
  refreshKey,
}: {
  candidateId: string;
  /** Changes after an in-sheet action so the list re-fetches. */
  refreshKey?: string;
}) {
  interface TransitionEntry {
    _id: string;
    action: string;
    createdAt: string;
    performedBy?: string | null;
    relatedId?: string | null;
    resourceType?: string | null;
    metadata?: Record<string, unknown>;
  }
  // `null` means not loaded yet. The effect only sets state from the async
  // callbacks — setting a loading flag synchronously in the effect body would
  // trigger a cascading render on every refreshKey change.
  const [items, setItems] = useState<TransitionEntry[] | null>(null);
  // Resolves the raw `performedBy` ObjectId into a display name.
  const allUsers = useUserStore(s => s.items);
  // Resolves the job a transition happened on (from the application id).
  const allApps = useApplicationStore(s => s.items);
  const allJobs = useJobStore(s => s.items);

  useEffect(() => {
    let alive = true;
    // includeRelated pulls in application-scoped rows that point at this
    // candidate, which is where rejections and hires are recorded.
    getJson<TransitionEntry[]>(
      `/shared/activity-logs/candidate/${candidateId}?includeRelated=true&limit=100`
    )
      .then(all => {
        if (!alive) return;
        const transitions = (all ?? []).filter(entry =>
          TRANSITION_ACTIONS.has(entry.action)
        );
        setItems(collapseSideEffects(transitions));
      })
      .catch(() => {
        // silently fail — the activity timeline above shows the full log
        if (alive) setItems(prev => prev ?? []);
      });
    return () => {
      alive = false;
    };
  }, [candidateId, refreshKey]);

  const performerName = useCallback(
    (performedBy: string | null | undefined) => {
      if (!performedBy) return null;
      const user = allUsers.find(u => u._id === performedBy);
      if (!user) return null;
      return `${user.firstName} ${user.lastName}`.trim() || null;
    },
    [allUsers]
  );

  /** Job title for an application-level entry, when we can resolve it. */
  const jobTitleForApplication = useCallback(
    (applicationId: string | null | undefined) => {
      if (!applicationId) return null;
      const app = allApps.find(a => a._id === applicationId);
      if (!app) return null;
      return allJobs.find(j => j._id === app.jobId)?.title ?? null;
    },
    [allApps, allJobs]
  );

  if (!items || items.length === 0) return null;

  return (
    <>
      <Separator />
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Transition History
        </p>
        <div className="flex flex-col gap-2">
          {items.map((entry, i) => {
            const m = (entry.metadata ?? {}) as Record<
              string,
              string | undefined
            >;
            const destination = m.destination;
            const reasonLabel = m.reasonLabel;
            const legacyReason = m.reason;
            const lastStage = m.lastStage;
            const notes = m.internalNotes;
            const by = performerName(entry.performedBy);
            const jobTitle = jobTitleForApplication(entry.relatedId);

            // Eligibility flips carry `to` rather than a destination.
            const isEligibility = entry.action === 'eligibility_changed';
            const isTalentPool =
              entry.action === 'talent_pool_added' ||
              entry.action === 'talent_pool_removed';
            // A move closes the old application, but it is not a rejection.
            const isJobChange = entry.action === 'job_changed';

            const label = isEligibility
              ? m.to === 'permanently_ineligible'
                ? 'Ineligible'
                : 'Restored'
              : isTalentPool
                ? entry.action === 'talent_pool_added'
                  ? 'Talent Pool'
                  : 'Left Talent Pool'
                : isJobChange
                  ? 'Job Changed'
                  : entry.action === 'hired'
                    ? 'Hired'
                    : destination === 'permanently_ineligible'
                      ? 'Ineligible'
                      : destination === 'candidate_pool'
                        ? 'Talent Pool'
                        : 'Rejected';

            const tone =
              label === 'Ineligible'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : label === 'Hired'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : label === 'Restored'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : label === 'Job Changed'
                      ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                      : 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400';

            return (
              <div
                key={entry._id ?? i}
                className="rounded-md border bg-muted/20 px-3 py-2 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </span>
                  <Badge
                    variant="secondary"
                    className={cn('text-[10px]', tone)}
                  >
                    {label}
                  </Badge>
                </div>
                {jobTitle && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Job: {jobTitle}
                  </p>
                )}
                {(reasonLabel || legacyReason) && (
                  <p className="mt-0.5 font-medium">
                    {reasonLabel || legacyReason}
                  </p>
                )}
                {lastStage && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Last stage: {lastStage}
                  </p>
                )}
                {notes && (
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    {notes}
                  </p>
                )}
                {by && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    By: {by}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
