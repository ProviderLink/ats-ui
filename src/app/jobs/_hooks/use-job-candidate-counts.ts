import { getJson } from '@/lib/api-client';
import { useApplicationStore } from '@/store/slices/applications.store';
import { useEffect, useMemo, useState } from 'react';

/**
 * Candidates shown under each job card, counted by the server (pending
 * applicants and permanently-ineligible rejections are excluded there).
 * Recounts, debounced, whenever applications change.
 */
export function useJobCandidateCounts(): Map<string, number> {
  const applications = useApplicationStore(s => s.items);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let alive = true;
    const timer = setTimeout(() => {
      void getJson<Record<string, number>>('/ats/applications/counts-by-job')
        .then(res => {
          if (alive) setCounts(res ?? {});
        })
        .catch(() => undefined);
    }, 300);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [applications]);

  return useMemo(() => new Map(Object.entries(counts)), [counts]);
}
