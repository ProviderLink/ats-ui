import { getJson } from '@/lib/api-client';
import type { Application } from '@/store';
import { useEffect, useMemo, useState } from 'react';
import { isIneligibleRejection } from '../_utils/job-candidates';
import { useCandidatesForApplications } from './use-candidates-for-applications';

interface CacheEntry {
  applications: Application[];
  fetchedAt: number;
}

// Survives unmounts so navigating away and back to the same job doesn't
// re-trigger a full fetch + spinner. The short TTL keeps data from going stale
// when other users add or remove candidates.
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30_000;

export function useJobCandidatesData(jobId: string) {
  const cached = cache.get(jobId);
  const cacheFresh = !!cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS;

  const [applications, setApplications] = useState<Application[]>(
    cacheFresh ? cached.applications : []
  );
  const [loading, setLoading] = useState(!cacheFresh);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // With a fresh cache we still re-fetch in the background, without a spinner.
    let alive = true;

    if (!cacheFresh) {
      setLoading(true);
      setError(null);
    }

    getJson<Application[] | { data: Application[] }>('/ats/applications', {
      jobId,
      limit: 9999,
    } as Record<string, unknown>)
      .then(appsRes => {
        if (!alive) return;
        const apps = Array.isArray(appsRes) ? appsRes : (appsRes.data ?? []);

        cache.set(jobId, { applications: apps, fetchedAt: Date.now() });

        setApplications(apps);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        // Don't overwrite cached data with an error.
        if (!cacheFresh) setError((e as Error).message);
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [jobId]);

  const visibleApplications = useMemo(
    () => applications.filter(a => !isIneligibleRejection(a)),
    [applications]
  );
  const { candidates, resolving } =
    useCandidatesForApplications(visibleApplications);

  return {
    applications: visibleApplications,
    candidates,
    loading: loading || resolving,
    error,
  };
}
