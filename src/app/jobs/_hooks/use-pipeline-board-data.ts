import { getJson } from '@/lib/api-client';
import type { Application, Candidate } from '@/store';
import { useEffect, useState } from 'react';

interface CacheEntry {
  applications: Application[];
  candidates: Candidate[];
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
  const [candidates, setCandidates] = useState<Candidate[]>(
    cacheFresh ? cached.candidates : []
  );

  useEffect(() => {
    let alive = true;

    Promise.all([
      // All jobs' applications, filtered locally: the board must know whether a
      // candidate still holds another live application, so rejecting here
      // doesn't silently affect that job.
      getJson<Application[] | { data: Application[] }>('/ats/applications', {
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
      })
      .catch((err: unknown) => {
        if (!alive || cacheFresh) return;
        // With no cache the board renders empty columns and the user gets no
        // other signal.
        console.error('[PipelineBoard] fetch failed:', err);
      });

    return () => {
      alive = false;
    };
  }, [jobId]);

  return { applications, candidates };
}
