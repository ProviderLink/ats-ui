import { getJson } from '@/lib/api-client';
import type { Application, Candidate } from '@/store';
import { useCandidateStore } from '@/store/slices/candidates.store';
import { useEffect, useMemo, useState } from 'react';

/**
 * Candidates to pair with a job's applications. Reads the already-loaded
 * candidate store; only when an application's candidate is not in it (the store
 * was narrowed, or the candidate is excluded from the default list) does it
 * download the whole list once, as the job tabs used to do every time.
 */
export function useCandidatesForApplications(applications: Application[]): {
  candidates: Candidate[];
  resolving: boolean;
} {
  const storeItems = useCandidateStore(s => s.items);
  const [fetched, setFetched] = useState<Candidate[] | null>(null);

  const missing = useMemo(() => {
    if (applications.length === 0) return false;
    const known = new Set(storeItems.map(c => c._id));
    return applications.some(a => !known.has(a.candidateId));
  }, [applications, storeItems]);

  useEffect(() => {
    if (!missing || fetched) return;
    let alive = true;
    void getJson<Candidate[] | { data: Candidate[] }>('/ats/candidates', {
      limit: 9999,
    })
      .then(res => {
        if (alive) setFetched(Array.isArray(res) ? res : (res.data ?? []));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [missing, fetched]);

  return {
    candidates: missing && fetched ? fetched : storeItems,
    resolving: missing && !fetched,
  };
}
