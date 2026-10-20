import { getJson } from '@/lib/api-client';
import type { Application } from '@/store';
import { useEffect, useMemo, useState } from 'react';
import { isIneligibleRejection } from '../_utils/job-candidates';
import { useCandidatesForApplications } from './use-candidates-for-applications';

interface CacheEntry {
  applications: Application[];
  fetchedAt: number;
}

// Survives unmounts (same pattern as use-job-candidates-data.ts).
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30_000;

// Fetches directly instead of using the shared stores to avoid races with
// other components that load them.
export function usePipelineBoardData(jobId: string) {
  const cached = cache.get(jobId);
  const cacheFresh = !!cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS;

  const [applications, setApplications] = useState<Application[]>(
    cacheFresh ? cached.applications : []
  );
  const [loading, setLoading] = useState(!cacheFresh);

  useEffect(() => {
    let alive = true;

    // All jobs' applications, filtered locally: the board must know whether a
    // candidate still holds another live application, so rejecting here
    // doesn't silently affect that job.
    getJson<Application[] | { data: Application[] }>('/ats/applications', {
      limit: 9999,
    } as Record<string, unknown>)
      .then(appsRes => {
        if (!alive) return;
        const apps = Array.isArray(appsRes) ? appsRes : (appsRes.data ?? []);

        cache.set(jobId, { applications: apps, fetchedAt: Date.now() });

        setApplications(apps);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setLoading(false);
        if (cacheFresh) return;
        // With no cache the board renders empty columns and the user gets no
        // other signal.
        console.error('[PipelineBoard] fetch failed:', err);
      });

    return () => {
      alive = false;
    };
  }, [jobId]);

  const jobApplications = useMemo(
    () => applications.filter(a => a.jobId === jobId && !isIneligibleRejection(a)),
    [applications, jobId]
  );
  const { candidates, resolving } = useCandidatesForApplications(jobApplications);

  return { applications, candidates, loading: loading || resolving };
}
