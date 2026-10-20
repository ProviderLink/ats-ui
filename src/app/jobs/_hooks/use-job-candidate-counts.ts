import { getJson } from '@/lib/api-client';
import type { Application } from '@/store';
import { useApplicationStore } from '@/store/slices/applications.store';
import { useBootStore } from '@/store/slices/boot.store';
import { useCandidateStore } from '@/store/slices/candidates.store';
import { isIneligibleRejection } from '../_utils/job-candidates';
import { useEffect, useMemo, useState } from 'react';

/**
 * The shared application store holds every application only until something
 * narrows it (a jobId / candidateId / clientId / phase filter, or a page
 * smaller than the total). Only then is it safe to count from it.
 */
function useStoreHasEveryApplication(): boolean {
  const booted = useBootStore(s => s.isBooted);
  const items = useApplicationStore(s => s.items);
  const filters = useApplicationStore(s => s.filters);
  const pagination = useApplicationStore(s => s.pagination);
  return (
    booted &&
    items.length > 0 &&
    !filters.jobId &&
    !filters.candidateId &&
    !filters.clientId &&
    !filters.phase &&
    (!pagination || items.length >= pagination.total)
  );
}

// Falls back to its own request when the shared store is narrowed: the job
// panel's Candidates tab refetches applications for one job, which would
// otherwise zero out every other card's count.
export function useJobCandidateCounts(): Map<string, number> {
  const storeItems = useApplicationStore(s => s.items);
  const storeIsComplete = useStoreHasEveryApplication();
  const [fetched, setFetched] = useState<Application[]>([]);

  useEffect(() => {
    if (storeIsComplete) return;
    let alive = true;
    void getJson<Application[] | { data: Application[] }>('/ats/applications', {
      limit: 9999,
    })
      .then(res => {
        if (!alive) return;
        setFetched(Array.isArray(res) ? res : (res.data ?? []));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [storeIsComplete]);

  const applications = storeIsComplete ? storeItems : fetched;
  const candidates = useCandidateStore(s => s.items);
  const candidateFilters = useCandidateStore(s => s.filters);
  const candidatePagination = useCandidateStore(s => s.pagination);
  const booted = useBootStore(s => s.isBooted);

  // The default candidate list hides permanently ineligible candidates, so a
  // rejected application whose candidate is missing from a complete list is
  // one of theirs (covers rejections recorded before the destination was set).
  const candidatesComplete =
    booted &&
    candidates.length > 0 &&
    !candidateFilters.status &&
    candidateFilters.inTalentPool === undefined &&
    !candidateFilters.search &&
    !candidateFilters.tags?.length &&
    (!candidatePagination || candidates.length >= candidatePagination.total);

  return useMemo(() => {
    const knownCandidates = candidatesComplete
      ? new Set(candidates.map(c => c._id))
      : null;
    const map = new Map<string, number>();
    for (const a of applications) {
      // Pending applicants are still in review and not shown under the job.
      if (a.phase === 'pending' || isIneligibleRejection(a)) continue;
      if (
        a.phase === 'rejected' &&
        knownCandidates &&
        !knownCandidates.has(a.candidateId)
      )
        continue;
      map.set(a.jobId, (map.get(a.jobId) ?? 0) + 1);
    }
    return map;
  }, [applications, candidates, candidatesComplete]);
}
