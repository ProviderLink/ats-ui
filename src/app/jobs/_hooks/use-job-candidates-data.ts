import { getJson } from '@/lib/api-client';
import type { Application, Candidate } from '@/store';
import { useEffect, useState } from 'react';

interface CacheEntry {
  applications: Application[];
  candidates: Candidate[];
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
  const [candidates, setCandidates] = useState<Candidate[]>(
    cacheFresh ? cached.candidates : []
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

    Promise.all([
      getJson<Application[] | { data: Application[] }>('/ats/applications', {
        jobId,
        limit: 9999,
      } as Record<string, unknown>),
      getJson<Candidate[] | { data: Candidate[] }>('/ats/candidates', {
        limit: 9999,
      }),
    ])
      .then(([appsRes, candsRes]) => {
        if (!alive) return;
        const apps = Array.isArray(appsRes) ? appsRes : (appsRes.data ?? []);
        const cands = Array.isArray(candsRes)
          ? candsRes
          : (candsRes.data ?? []);

        cache.set(jobId, {
          applications: apps,
          candidates: cands,
          fetchedAt: Date.now(),
        });

        setApplications(apps);
        setCandidates(cands);
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

  return { applications, candidates, loading, error };
}
